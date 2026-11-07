import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium, type Browser, type Page } from 'playwright'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { inspectFidelityPaint, type PaintEvidence } from '../fidelity/paint.ts'
import provenance from './fixtures/text-ink-clipping/provenance.json' with { type: 'json' }
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
let browser: Browser, page: Page
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }); page = await browser.newPage() })
afterAll(async () => { await browser?.close() })
const title = 'What makes a good feature'
const statuses = (paint: PaintEvidence) => paint.checks.filter(check => ['labels-within-canvas', 'unclipped-authored-labels'].includes(check.criterion)).map(check => check.status)
const drawing = (y = 16, height = 80, attributes = '', transform = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}"><g${transform ? ' transform="' + transform + '"' : ''}><text x="${transform ? 200 : 400}" y="${y}" text-anchor="middle" dominant-baseline="middle" style="font:32px Arial;fill:black" ${attributes}>${title}</text></g></svg>`
async function inspect(svg: string, label = title) { await page.setContent(svg); return page.evaluate(inspectFidelityPaint, { family: 'synthetic-text-ink', expected: { labels: [label] } }) }

/** Decode existing actual PNGs, or an independently hand-authored SVG control.
 * No Mermaid/project renderer or generated correctness reference is called. */
async function rows(url: string) {
  return page.evaluate(async src => {
    const image = new Image(); image.src = src; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0)
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    return Array.from({ length: canvas.height }, (_, y) => { let count = 0; for (let x = 0; x < canvas.width; x++) { const at = (y * canvas.width + x) * 4; if (pixels[at] !== 255 || pixels[at + 1] !== 255 || pixels[at + 2] !== 255) count++ }; return count })
  }, url)
}

test('three retained actual title images prove ink fits despite their overflowing SVG font line boxes', async () => {
  for (const input of provenance.cases) {
    const bytes = gunzipSync(readFileSync(new URL('./fixtures/text-ink-clipping/' + input.svg, import.meta.url))), png = readFileSync(new URL('./fixtures/text-ink-clipping/' + input.png, import.meta.url))
    expect(evidenceBytesDigest(bytes)).toBe(input.svgSha256)
    expect(evidenceBytesDigest(png)).toBe(input.pngSha256)
    const pixels = await rows('data:image/png;base64,' + png.toString('base64'))
    expect(pixels[0]).toBe(0)
    expect(pixels.slice(1, 31).every(count => count > 0)).toBe(true)
    expect(pixels.slice(31, 37).every(count => count === 0)).toBe(true)
    const paint = await inspect(bytes.toString(), input.title)
    expect(statuses(paint)).toEqual(['passed', 'passed'])
    const actual = paint.checks.find(check => check.criterion === 'labels-within-canvas')!.actual as any[]
    expect(actual[0].boxes[0].y).toBeLessThan(8)
    expect(actual[0].glyphInkBoxes[0].y).toBeGreaterThanOrEqual(8)
    expect(actual[0].glyphInkBoxes[0].height).toBeGreaterThan(0)
  }
})

test('top and bottom clipping of actual glyph ink still fail, independently confirmed by missing raster ink', async () => {
  const full = drawing(), complete = await rows('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(full)), fullInk = complete.reduce((a, b) => a + b, 0)
  expect(statuses(await inspect(full))).toEqual(['passed', 'passed'])
  for (const clipped of [drawing(8), drawing(16, 25)]) {
    const pixels = await rows('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clipped))
    expect(pixels.reduce((a, b) => a + b, 0)).toBeLessThan(fullInk)
    expect(pixels[0]! + pixels.at(-1)!).toBeGreaterThan(0)
    expect(statuses(await inspect(clipped))).toEqual(['failed', 'failed'])
  }
  expect(statuses(await inspect(drawing(16, 80, '', 'scale(2)')))).toEqual(['passed', 'passed'])
})

test('Latin-1 glyph bounds distinguish fitting accents from actual raster clipping', async () => {
  const label = 'Über die Grenze: naïve café, ÅÄÖ éèêàçô'
  const full = drawing(24).replace(title, label), pixels = await rows('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(full)), fullInk = pixels.reduce((a, b) => a + b, 0)
  expect(fullInk).toBeGreaterThan(0)
  expect(statuses(await inspect(full, label))).toEqual(['passed', 'passed'])
  for (const clipped of [drawing(8), drawing(24, 30)].map(svg => svg.replace(title, label))) {
    const pixels = await rows('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clipped))
    expect(pixels.reduce((a, b) => a + b, 0)).toBeLessThan(fullInk)
    expect(statuses(await inspect(clipped, label))).toEqual(['failed', 'failed'])
  }
})

test('unqualified font-box overflow cannot turn HTML, complex glyphs or stretched text into renderer faults', async () => {
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="80"><foreignObject x="0" y="-6" width="800" height="80"><div xmlns="http://www.w3.org/1999/xhtml" style="font:32px Arial;line-height:36px">${title}</div></foreignObject></svg>`
  expect(statuses(await inspect(html))).toEqual(['unavailable', 'unavailable'])
  expect(statuses(await inspect(drawing().replace(title, 'Cafe\u0301'), 'Cafe\u0301'))).toEqual(['unavailable', 'unavailable'])
  expect(statuses(await inspect(drawing(16, 80, 'textLength="300" lengthAdjust="spacingAndGlyphs"')))).toEqual(['unavailable', 'unavailable'])
  const clipped = drawing().replace('<g>', '<defs><clipPath id="cut"><rect width="1" height="1"/></clipPath></defs><g clip-path="url(#cut)">')
  expect(statuses(await inspect(clipped))).toEqual(['passed', 'failed'])
})
