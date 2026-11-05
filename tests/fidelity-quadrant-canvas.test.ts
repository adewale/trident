import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
const fixture = new URL('./fixtures/quadrant-canvas/', import.meta.url), provenance = JSON.parse(readFileSync(new URL('provenance.json', fixture), 'utf8'))
const retained = readFileSync(new URL(provenance.file, fixture), 'utf8'), source = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases.find((c: any) => c.id === provenance.id).source
const canonical = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-reviewed.json.gz', import.meta.url))).toString()).find((c: any) => c.id === provenance.id).expected
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const handExpected = { labels: ['Low', 'High', 'Bottom', 'Top', 'One', 'Two', 'Three', 'Four'], facts: { 'authored-config': { quadrantChart: { chartWidth: 400, chartHeight: 400 } }, points: [], axes: { x: ['Low', 'High'], y: ['Bottom', 'Top'] }, quadrants: [{ number: 1, label: 'One' }, { number: 2, label: 'Two' }, { number: 3, label: 'Three' }, { number: 4, label: 'Four' }] } }
const handSource = '---\nconfig:\n  quadrantChart:\n    chartWidth: 400\n    chartHeight: 400\n---\nquadrantChart\nx-axis Low --> High\ny-axis Bottom --> Top\nquadrant-1 One\nquadrant-2 Two\nquadrant-3 Three\nquadrant-4 Four\n'
const hand = (size = 400, xSide = 'top', ySide = 'left') => {
  const half = (size - 36) / 2, x = ySide === 'left' ? 31 : 5, y = xSide === 'top' ? 31 : 5, left = x + half / 2, right = x + half * 1.5, top = y + half / 2, bottom = y + half * 1.5
  const rects = [[x, y], [x + half, y], [x, y + half], [x + half, y + half]].map(([x, y]) => `<rect x="${x}" y="${y}" width="${half}" height="${half}" fill="#ddd"/>`).join('')
  const text = (s: string, x: number, y: number) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${s}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="font:12px Arial;background:white">${rects}${text('One', right, top)}${text('Two', left, top)}${text('Three', left, bottom)}${text('Four', right, bottom)}${text('Low', left, xSide === 'top' ? 17 : size - 17)}${text('High', right, xSide === 'top' ? 17 : size - 17)}<g transform="translate(${ySide === 'left' ? 17 : size - 17} ${bottom}) rotate(-90)">${text('Bottom', 0, 0)}</g><g transform="translate(${ySide === 'left' ? 17 : size - 17} ${top}) rotate(-90)">${text('Top', 0, 0)}</g></svg>`
}
async function inspect(svg: string, expected: any = handExpected, literal = handSource, change?: string) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } })
  try { await page.setContent(svg); await page.evaluate(async () => { await document.fonts.ready }); if (change) await page.evaluate(change); return (await inspectSvgDrawing(page, { family: 'quadrant', source: literal, expected })).checks }
  finally { await page.close() }
}
const status = (rows: any[], key: string) => rows.find(r => r.criterion === 'source-fact:' + key)?.status
test('retained documentation328 owns a400canvas and364plot with topX labels', async () => {
  expect(createHash('sha256').update(retained).digest('hex')).toBe(provenance.svgSha256)
  expect(createHash('sha256').update(source).digest('hex')).toBe(provenance.sourceSha256)
  const rows = await inspect(retained, canonical, source)
  expect(rows.filter((r: any) => r.status !== 'passed')).toEqual([])
})
test('independently authored fullcanvas dimensions include axis gutters and allow unrequested sides', async () => {
  for (const [x, y] of [['top', 'left'], ['bottom', 'right']]) {
    const rows = await inspect(hand(400, x, y))
    expect(status(rows, 'authored-config')).toBe('passed')
    expect(status(rows, 'axes')).toBe('passed')
    expect(status(rows, 'quadrants')).toBe('passed')
  }
  expect(status(await inspect(hand(300)), 'authored-config')).toBe('failed')
  expect(status(await inspect(hand(), handExpected, handSource, `const a=[...document.querySelectorAll('text')].find(e=>e.textContent==='Low'),b=[...document.querySelectorAll('text')].find(e=>e.textContent==='High');a.textContent='High';b.textContent='Low'`), 'axes')).toBe('failed')
})
test('explicit side requests, canvas ownership and four distinct contiguous regions stay required', async () => {
  const requested = structuredClone(handExpected) as any; requested.facts['authored-config'].quadrantChart.xAxisPosition = 'bottom'
  expect(status(await inspect(hand(), requested), 'axes')).toBe('failed')
  expect(status(await inspect(hand(400, 'bottom'), requested), 'axes')).toBe('passed')
  const wrongY = structuredClone(handExpected) as any; wrongY.facts['authored-config'].quadrantChart.yAxisPosition = 'right'
  expect(status(await inspect(hand(), wrongY), 'axes')).toBe('failed')
  expect(status(await inspect(hand(), handExpected, handSource, `for(const e of document.querySelectorAll('text'))if(e.textContent==='Low'||e.textContent==='High')e.setAttribute('y','-30')`), 'axes')).not.toBe('passed')
  const missing = await inspect(hand(), handExpected, handSource, `const r=document.querySelectorAll('rect');r[3].setAttribute('x',r[0].getAttribute('x'));r[3].setAttribute('y',r[0].getAttribute('y'))`)
  expect(status(missing, 'authored-config')).not.toBe('passed')
  expect(status(missing, 'quadrants')).not.toBe('passed')
})
