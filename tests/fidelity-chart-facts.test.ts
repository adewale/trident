import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { inspectChartFacts } from '../fidelity/paint-chart-facts.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import type { PaintCheck } from '../fidelity/paint.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(20_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ executablePath: chromiumExecutable, headless: true }) })
afterAll(async () => { await browser?.close() })
const fixture = (family: string) => readFileSync(new URL('./fixtures/qualified-charts/' + family + '.svg', import.meta.url), 'utf8')
const original = (family: string) => expandedFidelityCases().find(item => item.id === 'meaning:family:' + family)!.expected
async function inspect(family: string, options: { expected?: MeaningExpectation; change?: string; svg?: string } = {}) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(options.svg ?? fixture(family))
    if (options.change) await page.evaluate(options.change)
    return await page.evaluate(inspectChartFacts, { family, source: '', expected: options.expected ?? original(family), paint: { nodes: [], checks: [], connections: [], complete: true, passed: true, viewBox: null }, quantitative: [] }) as PaintCheck[]
  } finally { await page.close() }
}
const check = (checks: PaintCheck[], key: string) => checks.find(item => item.criterion === key)

test('retained real XY, quadrant and radar drawings pass their owned chart value checks', async () => {
  expect(check(await inspect('xychart'), 'source-fact:series')?.status).toBe('passed')
  expect(check(await inspect('quadrant'), 'source-fact:points')?.status).toBe('passed')
  const radar = await inspect('radar')
  expect(check(radar, 'source-fact:curves')?.status).toBe('passed')
  expect(check(radar, 'source-fact:axes')?.status).toBe('passed')
  expect(check(radar, 'source-fact:range')?.status).toBe('unavailable')
})
test('changed XY bar, line and source category order cannot retain correct fact credit', async () => {
  expect(check(await inspect('xychart', { change: `document.querySelector('.bar-plot-0 rect').setAttribute('height','20')` }), 'source-fact:series')?.status).toBe('failed')
  expect(check(await inspect('xychart', { change: `document.querySelector('.line-plot-1 path').setAttribute('transform','translate(0,40)')` }), 'source-fact:series')?.status).toBe('failed')
  const e = original('xychart'), expected = { ...e, facts: { ...e.facts, 'x-categories': ['Three', 'Two', 'One'] } }
  expect(check(await inspect('xychart', { expected }), 'source-fact:x-categories')?.status).toBe('failed')
})
test('extra XY series and invisible or ambiguously owned chart content are not correct', async () => {
  expect(check(await inspect('xychart', { change: `const p=document.querySelector('.line-plot-1 path');p.after(p.cloneNode(true))` }), 'source-fact:series')?.status).not.toBe('passed')
  expect(check(await inspect('xychart', { change: `document.querySelector('.line-plot-1 path').setAttribute('stroke','transparent')` }), 'source-fact:series')?.status).not.toBe('passed')
  expect(check(await inspect('xychart', { change: `document.querySelector('svg').insertAdjacentHTML('beforeend','<defs><clipPath id="empty"><rect width="0" height="0"/></clipPath></defs>');document.querySelector('.line-plot-1 path').setAttribute('clip-path','url(#empty)')` }), 'source-fact:series')?.status).not.toBe('passed')
})
test('actual quadrant points, exact inventory and axis roles are independently checked', async () => {
  expect(check(await inspect('quadrant', { change: `document.querySelector('circle').setAttribute('cx','200')` }), 'source-fact:points')?.status).not.toBe('passed')
  expect(check(await inspect('quadrant', { change: `const p=document.querySelector('circle');p.after(p.cloneNode(true))` }), 'source-fact:points')?.status).not.toBe('passed')
  const e = original('quadrant'), expected = { ...e, facts: { ...e.facts, 'axis-labels': ['High effort', 'Low effort', 'Low value', 'High value'] } }
  expect(check(await inspect('quadrant'), 'source-fact:axis-labels')?.status).toBe('passed')
  expect(check(await inspect('quadrant', { expected }), 'source-fact:axis-labels')?.status).toBe('failed')
})
test('radar detects altered radial values, swapped labels, extra curves and hidden geometry', async () => {
  const e = original('radar'), curves = structuredClone(e.facts!.curves) as any[]; curves[0]!.values[0] = 1
  expect(check(await inspect('radar', { expected: { ...e, facts: { ...e.facts, curves } } }), 'source-fact:curves')?.status).toBe('failed')
  expect(check(await inspect('radar', { change: `const t=[...document.querySelectorAll('text')].find(e=>e.textContent==='Speed');t.textContent='Power'` }), 'source-fact:axes')?.status).not.toBe('passed')
  expect(check(await inspect('radar', { change: `const p=document.querySelector('.radarCurve-0');p.after(p.cloneNode(true))` }), 'source-fact:curves')?.status).not.toBe('passed')
  expect(check(await inspect('radar', { change: `document.querySelector('.radarCurve-0').setAttribute('opacity','0')` }), 'source-fact:curves')?.status).not.toBe('passed')
})
test('renderer IDs, metadata and CSS class names cannot supply ownership', async () => {
  const change = `[...document.querySelectorAll('[id],[class]')].filter(e=>e.localName!=='svg').forEach(e=>{const s=getComputedStyle(e);e.style.fill=s.fill;e.style.stroke=s.stroke;e.style.strokeWidth=s.strokeWidth;e.removeAttribute('id');e.removeAttribute('class')})`
  expect(check(await inspect('xychart', { change }), 'source-fact:series')?.status).toBe('passed')
  expect(check(await inspect('radar', { change }), 'source-fact:curves')?.status).toBe('passed')
})

test('multiple named lines use legend ownership; swapping names cannot preserve credit', async () => {
  const expected: MeaningExpectation = { labels: [], facts: { 'x-categories': ['90d', '60d', '30d', '7d', '1d', 'Current'], 'y-range': [0, 198.2], series: [{ kind: 'line', label: 'avg', values: [48.1, 41.5, 45.7, 72.8, 67.7, 59.9] }, { kind: 'line', label: 'p50', values: [38.2, 36.8, 39.7, 54.5, 49, 38.4] }, { kind: 'line', label: 'p95', values: [112.2, 75.3, 103, 177, 180.2, 109.4] }] } }
  const svg = fixture('multiline')
  const checks = await inspect('xychart', { expected, svg })
  expect(check(checks, 'source-fact:series')?.status).toBe('passed')
  expect(check(checks, 'source-fact:y-range')?.status).toBe('unavailable')
  const change = `const a=[...document.querySelectorAll('text')].find(e=>e.textContent==='avg'),b=[...document.querySelectorAll('text')].find(e=>e.textContent==='p50');a.textContent='p50';b.textContent='avg'`
  expect(check(await inspect('xychart', { expected, svg, change }), 'source-fact:series')?.status).toBe('failed')
})

test('later opaque rectangles cannot leave hidden chart semantics qualified', async () => {
  const change = `document.querySelector('svg').insertAdjacentHTML('beforeend','<rect x="0" y="0" width="2000" height="2000" fill="white" style="pointer-events:none"/>')`
  expect(check(await inspect('xychart', { change }), 'source-fact:series')?.status).not.toBe('passed')
  expect(check(await inspect('quadrant', { change }), 'source-fact:points')?.status).not.toBe('passed')
  expect(check(await inspect('radar', { change }), 'source-fact:curves')?.status).not.toBe('passed')
})


test('an extra partial line cannot disappear from the XY series inventory', async () => {
  const change = `document.querySelector('svg').insertAdjacentHTML('beforeend','<path d="M200 200L300 180" fill="none" stroke="red"/>')`
  expect(check(await inspect('xychart', { change }), 'source-fact:series')?.status).not.toBe('passed')
})


test('numeric range and category labels must own actual ticks rather than borrow other text', async () => {
  const change = `const t=[...document.querySelectorAll('text')].find(e=>e.textContent==='10');t.textContent='';document.querySelector('svg').insertAdjacentHTML('beforeend','<text x="400" y="30">10</text>')`
  expect(check(await inspect('xychart', { change }), 'source-fact:y-range')?.status).not.toBe('passed')
  const missingCategoryTick = `const ticks=[...document.querySelector('.bottom-axis .ticks').querySelectorAll('path')];ticks[0].remove()`
  expect(check(await inspect('xychart', { change: missingCategoryTick }), 'source-fact:series')?.status).not.toBe('passed')
})


test('a named unique curve cannot borrow its label from unrelated text', async () => {
  const change = `document.querySelector('.radarLegendBox-0').remove()`
  expect(check(await inspect('radar', { change }), 'source-fact:curves')?.status).not.toBe('passed')
})


test('flat background camouflage and subpixel effective opacity cannot qualify chart values', async () => {
  const whiteBars = `document.querySelectorAll('.bar-plot-0 rect').forEach(e=>{e.style.fill='white';e.style.stroke='white'})`
  expect(check(await inspect('xychart', { change: whiteBars }), 'source-fact:series')?.status).not.toBe('passed')
  expect(check(await inspect('xychart', { change: `document.querySelector('.line-plot-1 path').style.strokeOpacity='0.000000001'` }), 'source-fact:series')?.status).not.toBe('passed')
  expect(check(await inspect('radar', { change: `const e=document.querySelector('.radarCurve-0');e.style.fill='white';e.style.stroke='white'` }), 'source-fact:curves')?.status).not.toBe('passed')
})
