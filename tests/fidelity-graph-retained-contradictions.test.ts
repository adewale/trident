import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import type { PaintEvidence } from '../fidelity/paint.ts'
import { reviewedDocsCase } from '../unified/docs-drawings.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
const directory = './fixtures/graph-families/retained-contradictions/'
const retained = JSON.parse(readFileSync(new URL(directory + 'provenance.json', import.meta.url), 'utf8')).retained
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases
const reviews = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8'))
const status = (paint: PaintEvidence, criterion: string) => paint.checks.find(check => check.criterion === criterion)?.status
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
async function inspect(index: number, mutate?: (page: any, paint: PaintEvidence) => Promise<void>) {
  const record = retained.find((entry: any) => entry.docsIndex === index), source = sources[index], bytes = readFileSync(new URL(directory + record.file, import.meta.url)), sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
  expect(sha(bytes)).toBe(record.svgSha256); expect(sha(source.source)).toBe(record.sourceSha256); expect(source.id).toBe(record.caseId)
  const input = reviewedDocsCase(source, reviews.find((entry: any) => entry.id === source.id)), page = await browser.newPage()
  try {
    await page.setContent(bytes.toString())
    const original = await inspectSvgDrawing(page, input)
    if (!mutate) return original
    await mutate(page, original)
    return await inspectSvgDrawing(page, input)
  } finally { await page.close() }
}

test('retained nested class generic types preserve every angle depth and type token', async () => {
  expect(status(await inspect(64), 'source-fact:members')).toBe('passed')
  for (const replacement of ['List<List<string>>', 'List<int>']) {
    const wrong = await inspect(64, page => page.evaluate((replacement: string) => {
      const rows = [...document.querySelectorAll('text,foreignObject p')].filter(element => element.textContent?.includes('getDistanceMatrix()'))
      if (rows.length !== 1 || !rows[0]!.textContent?.includes('List<List<int>>')) throw Error('Expected exactly one retained nested-type method row')
      rows[0]!.textContent = rows[0]!.textContent!.replace('List<List<int>>', replacement)
    }, replacement))
    expect(status(wrong, 'source-fact:members')).toBe('failed')
  }
})

test('retained class cardinalities belong to the uniquely nearest actual route endpoint', async () => {
  expect(status(await inspect(81), 'source-fact:cardinalities')).toBe('passed')
  for (const duplicate of [false, true]) {
    const wrong = await inspect(81, page => page.evaluate((duplicate: boolean) => {
      const labels = [...document.querySelectorAll('foreignObject p')].filter(element => element.textContent === '1')
      if (labels.length !== 4) throw Error('Expected all four retained endpoint cardinality glyphs')
      const owner = labels[0]!.closest('foreignObject')!
      if (duplicate) { const extra = owner.cloneNode(true) as Element; extra.setAttribute('transform', 'translate(-12 0)'); owner.parentElement!.append(extra) } else owner.remove()
    }, duplicate))
    expect(status(wrong, 'source-fact:cardinalities')).toBe('failed')
  }
})

for (const index of [364, 400, 401]) test('retained filled concave sequence chevron ' + index + ' has a source-consistent open V contour independent of SVG fill syntax', async () => {
  const original = await inspect(index)
  expect(status(original, 'painted-relationship-markers')).toBe('passed')
  expect(status(original, 'painted-relationship-label-ownership')).toBe('passed')
  const triangle = await inspect(index, page => page.evaluate(() => {
    const shapes = [...document.querySelectorAll('marker path')].filter(element => element.getAttribute('d')?.replace(/\s/g, '') === 'M18,7L9,13L14,7L9,1Z')
    if (shapes.length !== 1) throw Error('Expected the actual concave four-vertex marker')
    shapes[0]!.setAttribute('d', 'M9 1 L18 7 L9 13 Z')
  }))
  expect(status(triangle, 'painted-relationship-markers')).toBe('failed')
  const open = await inspect(index, page => page.evaluate(() => {
    const shape = [...document.querySelectorAll('marker path')].find(element => element.getAttribute('d')?.replace(/\s/g, '') === 'M18,7L9,13L14,7L9,1Z')!
    shape.setAttribute('d', 'M9 1 L18 7 L9 13'); shape.setAttribute('style', 'fill:none!important;stroke:#28253D!important;stroke-width:2')
  }))
  expect(status(open, 'painted-relationship-markers')).toBe('passed')
  const covered = await inspect(index, page => page.evaluate(() => {
    const shape = [...document.querySelectorAll('marker path')].find(element => element.getAttribute('d')?.replace(/\s/g, '') === 'M18,7L9,13L14,7L9,1Z')!
    shape.parentElement!.insertAdjacentHTML('beforeend', '<path d="M9 1L18 7L9 13Z" fill="black"/>')
  }))
  expect(status(covered, 'painted-relationship-markers')).not.toBe('passed')
  const tiny = await inspect(index, page => page.evaluate(() => {
    const shape = [...document.querySelectorAll('marker path')].find(element => element.getAttribute('d')?.replace(/\s/g, '') === 'M18,7L9,13L14,7L9,1Z')!
    shape.parentElement!.setAttribute('markerWidth', '.01'); shape.parentElement!.setAttribute('markerHeight', '.01')
  }))
  expect(status(tiny, 'painted-relationship-markers')).not.toBe('passed')
  const closedNotch = await inspect(index, page => page.evaluate(() => {
    const shape = [...document.querySelectorAll('marker path')].find(element => element.getAttribute('d')?.replace(/\s/g, '') === 'M18,7L9,13L14,7L9,1Z')!
    shape.setAttribute('style', 'stroke:black!important;stroke-width:20!important;stroke-linejoin:round')
  }))
  expect(status(closedNotch, 'painted-relationship-markers')).not.toBe('passed')
  const distorted = await inspect(index, page => page.evaluate(() => { (document.querySelector('svg') as SVGElement).style.transform = 'scaleX(1.5)' }))
  expect(status(distorted, 'painted-relationship-markers')).not.toBe('passed')
  const faint = await inspect(index, page => page.evaluate(() => {
    const shape = [...document.querySelectorAll('marker path')].find(element => element.getAttribute('d')?.replace(/\s/g, '') === 'M18,7L9,13L14,7L9,1Z')!
    shape.setAttribute('fill-opacity', '.1')
    const host = [...document.querySelectorAll('[marker-end]')].find(element => (element.getAttribute('marker-end') ?? '').includes(shape.parentElement!.id))!
    host.setAttribute('opacity', '.01')
  }))
  expect(status(faint, 'painted-relationship-markers')).not.toBe('passed')
  const white = await inspect(index, page => page.evaluate(() => {
    const shape = [...document.querySelectorAll('marker path')].find(element => element.getAttribute('d')?.replace(/\s/g, '') === 'M18,7L9,13L14,7L9,1Z')!
    shape.setAttribute('style', 'fill:white!important;stroke:none!important')
  }))
  expect(status(white, 'painted-relationship-markers')).not.toBe('passed')
})

for (const index of [394, 395]) test('retained sequence condition ' + index + ' has a complete bracketed soft-wrapped caption', async () => {
  const original = await inspect(index)
  expect(status(original, 'visible-authored-labels')).toBe('passed')
  expect(status(original, 'labels-within-canvas')).toBe('passed')
  // The complete words do not by themselves prove the enclosing branch scope.
  expect(status(original, 'source-fact:fragments')).toBe('unavailable')
  const detached = await inspect(index, page => page.evaluate(() => {
    const tail = [...document.querySelectorAll('text')].find(element => /(?:connection to the DB|process fails)\]/.test(element.textContent ?? ''))!
    tail.setAttribute('x', '1000'); for (const part of tail.querySelectorAll('tspan')) part.setAttribute('x', '1000')
  }))
  expect(status(detached, 'visible-authored-labels')).not.toBe('passed')
  expect(status(detached, 'source-fact:fragments')).not.toBe('passed')
})
