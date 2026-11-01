import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium, type Page } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import { chromiumExecutable } from './helpers/environment.ts'
import { retainedGraphFonts } from './helpers/retained-graph-fonts.ts'
import provenance from './fixtures/independent-svg-validation/provenance.json' with { type: 'json' }

// This is a deliberately small mechanism sample, not corpus admission. Facts
// below are handwritten from the retained literal sources and public syntax;
// no compiled expectation, renderer model, snapshot status or reference pixels
// provide expected values. Actual-output provenance remains that of each saved
// original SVG companion, never an invented independent SVG invocation.
setDefaultTimeout(30_000)
let browser: Awaited<ReturnType<typeof chromium.launch>>
beforeAll(async () => { browser = await chromium.launch({ executablePath: chromiumExecutable, headless: true }) })
afterAll(async () => { await browser?.close() })
const directory = new URL('./fixtures/independent-svg-validation/', import.meta.url)
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const input = (index: number) => {
  const row = provenance.find(row => row.index === index)!
  return { row, source: readFileSync(new URL(row.source, directory), 'utf8'), svg: gunzipSync(readFileSync(new URL(row.file, directory))).toString() }
}
const status = (result: Awaited<ReturnType<typeof inspectSvgDrawing>>, criterion: string) => result.checks.find(check => check.criterion === criterion)?.status
async function observe(index: number, family: string, expected: MeaningExpectation, change?: (page: Page) => Promise<unknown>) {
  const witness = input(index), page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(witness.svg)
    await retainedGraphFonts(page)
    await change?.(page)
    return await inspectSvgDrawing(page, { family, source: witness.source, expected })
  } finally { await page.close() }
}
const packet: MeaningExpectation = { labels: ['Source Port', 'Destination Port', 'Sequence Number'], facts: {
  fields: [{ label: 'Source Port', start: 0, end: 15 }, { label: 'Destination Port', start: 16, end: 31 }, { label: 'Sequence Number', start: 32, end: 63 }],
  'authored-config': { packet: { showBits: true }, themeVariables: { packet: { startByteColor: 'red' } } }
} }
const market: MeaningExpectation = { labels: ['Market Share', 'Company A', 'Company B', 'Company C', 'Others'], nodes: [
  { id: 'Market Share', label: 'Market Share' }, { id: 'Market Share/Company A', label: 'Company A' }, { id: 'Market Share/Company B', label: 'Company B' }, { id: 'Market Share/Company C', label: 'Company C' }, { id: 'Market Share/Others', label: 'Others' }
], facts: { hierarchy: [{ id: 'Market Share', parent: '' }, ...['Company A', 'Company B', 'Company C', 'Others'].map(name => ({ id: 'Market Share/' + name, parent: 'Market Share' }))], 'show-values': true,
  'displayed-values': [{ id: 'Market Share', value: 1, format: '$.1%' }, { id: 'Market Share/Company A', value: .35, format: '$.1%' }, { id: 'Market Share/Company B', value: .25, format: '$.1%' }, { id: 'Market Share/Company C', value: .15, format: '$.1%' }, { id: 'Market Share/Others', value: .25, format: '$.1%' }]
} }
const budgetNodes = [['Budget', 'Budget'], ['Budget/Operations', 'Operations'], ['Budget/Operations/Salaries', 'Salaries'], ['Budget/Operations/Equipment', 'Equipment'], ['Budget/Operations/Supplies', 'Supplies'], ['Budget/Marketing', 'Marketing'], ['Budget/Marketing/Advertising', 'Advertising'], ['Budget/Marketing/Events', 'Events']] as const
const budget: MeaningExpectation = { labels: budgetNodes.map(([, label]) => label), nodes: budgetNodes.map(([id, label]) => ({ id, label })), facts: {
  hierarchy: budgetNodes.map(([id]) => ({ id, parent: id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : '' })), 'show-values': true,
  'displayed-values': budgetNodes.map(([id], i) => ({ id, value: [1500000, 1000000, 700000, 200000, 100000, 500000, 400000, 100000][i]!, format: '$0,0' }))
} }
const strategies: MeaningExpectation = { labels: ['Sourcing Strategy', 'Customer', 'Custom App', 'Off-the-shelf Tool', 'Managed Service', 'Cloud Platform'], facts: { components: [
  { name: 'Customer', kind: 'anchor', coordinates: [.8, .95] }, { name: 'Custom App', kind: 'component', coordinates: [.45, .85], strategy: 'build' }, { name: 'Off-the-shelf Tool', kind: 'component', coordinates: [.85, .65], strategy: 'buy' }, { name: 'Managed Service', kind: 'component', coordinates: [.6, .4], strategy: 'outsource' }, { name: 'Cloud Platform', kind: 'component', coordinates: [.95, .25], strategy: 'market' }
] } }

test('independent mechanism witnesses retain exact source and actual public-output ownership', () => {
  for (const row of provenance) {
    const witness = input(row.index)
    expect(digest(witness.source)).toBe(row.sourceSha256)
    expect(digest(witness.svg)).toBe(row.svgSha256)
    expect(row.parentInvocationId).toBeTruthy()
    expect(row.scope).toContain('no independent SVG invocation')
  }
})

test('packet absolute offsets and authored color separate valid geometry from a real saved wrong color', async () => {
  const result = await observe(324, 'packet', packet)
  expect(status(result, 'source-fact:fields')).toBe('passed')
  expect(status(result, 'source-fact:authored-config')).toBe('failed')
  // Independent geometric ruler: the two disjoint 16-bit cells share a row;
  // a complete 32-bit cell owns the following row. The 1px gap is actual paint.
  const page = await browser.newPage()
  try {
    await page.setContent(input(324).svg)
    const cells = await page.locator('rect').evaluateAll(rects => rects.map(e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width } }).filter(b => b.width > 100).sort((a, b) => a.y - b.y || a.x - b.x))
    expect(cells).toHaveLength(3)
    expect(cells[0]!.y).toBe(cells[1]!.y)
    expect(cells[2]!.y).toBeGreaterThan(cells[0]!.y)
    expect(cells[1]!.width).toBe(cells[0]!.width)
    expect(cells[2]!.width).toBeCloseTo(cells[0]!.width + cells[1]!.width + cells[1]!.x - cells[0]!.x - cells[0]!.width, 5)
  } finally { await page.close() }
  const corrected = await observe(324, 'packet', packet, page => page.evaluate(() => {
    for (const e of document.querySelectorAll('text')) if (['0', '16', '32'].includes(e.textContent ?? '')) e.style.fill = 'rgb(255 0 0)'
  }))
  expect(status(corrected, 'source-fact:authored-config')).toBe('passed')
  const wrongSpan = await observe(324, 'packet', packet, page => page.evaluate(() => {
    const cell = [...document.querySelectorAll('rect')].find(e => Number(e.getAttribute('width')) > 100)!
    cell.setAttribute('width', String(Number(cell.getAttribute('width')) - 30))
  }))
  expect(status(wrongSpan, 'painted-bit-field-ratios')).toBe('passed')
  expect(status(wrongSpan, 'source-fact:fields')).not.toBe('passed')
  expect(status(wrongSpan, 'painted-bit-field-spans')).toBe('failed')
})

test('wrapped packet fields keep the required absolute proof without an inapplicable ratio finding', async () => {
  const fields = [
    { label: 'Source Port', start: 0, end: 15 }, { label: 'Destination Port', start: 16, end: 31 }, { label: 'Sequence Number', start: 32, end: 63 }, { label: 'Acknowledgment Number', start: 64, end: 95 },
    { label: 'Data Offset', start: 96, end: 99 }, { label: 'Reserved', start: 100, end: 105 }, { label: 'URG', start: 106, end: 106 }, { label: 'ACK', start: 107, end: 107 }, { label: 'PSH', start: 108, end: 108 },
    { label: 'RST', start: 109, end: 109 }, { label: 'SYN', start: 110, end: 110 }, { label: 'FIN', start: 111, end: 111 }, { label: 'Window', start: 112, end: 127 }, { label: 'Checksum', start: 128, end: 143 },
    { label: 'Urgent Pointer', start: 144, end: 159 }, { label: '(Options and Padding)', start: 160, end: 191 }, { label: 'Data (variable length)', start: 192, end: 255 }
  ], expected: MeaningExpectation = { labels: ['TCP Packet', ...fields.map(field => field.label)], facts: { title: 'TCP Packet', fields } }
  const original = await observe(321, 'packet', expected)
  expect(original.checks.filter(check => check.status !== 'passed')).toEqual([])
  expect(status(original, 'painted-bit-field-spans')).toBe('passed')
  const wrong = await observe(321, 'packet', expected, page => page.evaluate(() => {
    const cell = [...document.querySelectorAll('rect')].at(-1)!
    cell.setAttribute('width', String(Number(cell.getAttribute('width')) - 30))
  }))
  expect(status(wrong, 'painted-bit-field-spans')).toBe('failed')
})

test('treemap values are owner-bound; equivalent SVG text spans work and borrowed numbers do not', async () => {
  expect(status(await observe(471, 'treemap', market), 'source-fact:displayed-values')).toBe('passed')
  const equivalent = await observe(471, 'treemap', market, page => page.evaluate(() => {
    for (const e of document.querySelectorAll('text')) if (e.textContent?.startsWith('$')) { const child = document.createElementNS('http://www.w3.org/2000/svg', 'tspan'); child.textContent = e.textContent; e.replaceChildren(child) }
  }))
  expect(status(equivalent, 'source-fact:displayed-values')).toBe('passed')
  const swapped = await observe(471, 'treemap', market, page => page.evaluate(() => {
    const a = [...document.querySelectorAll('text')].find(e => e.textContent === '$35.0%')!, c = [...document.querySelectorAll('text')].find(e => e.textContent === '$15.0%')!
    a.textContent = '$15.0%'; c.textContent = '$35.0%'
  }))
  expect(status(swapped, 'source-fact:displayed-values')).toBe('failed')
  // Saved defect: Supplies is named but its owned amount is display:none.
  expect(status(await observe(470, 'treemap', budget), 'source-fact:displayed-values')).toBe('failed')
  const borrowed = await observe(470, 'treemap', budget, page => page.evaluate(() => document.querySelector('svg')!.insertAdjacentHTML('beforeend', '<text x="1200" y="500">$100,000</text>')))
  expect(status(borrowed, 'source-fact:displayed-values')).not.toBe('passed')
})

test('Wardley source strategy symbols cannot pass through matching labels or circular rings', async () => {
  // Pinned wardley.md 148–151 explicitly promises triangle/diamond/square/circle
  // for build/buy/outsource/market. This output has circular compound rings.
  const result = await observe(512, 'wardley', strategies)
  expect(status(result, 'source-fact:components')).toBe('failed')
  const renamed = await observe(512, 'wardley', strategies, page => page.evaluate(() => {
    for (const e of document.querySelectorAll('[class],[id]')) { e.removeAttribute('class'); e.removeAttribute('id') }
  }))
  expect(status(renamed, 'source-fact:components')).toBe('failed')
})

test('known incomplete link vocabulary and unresolved filtered paint stay unknown rather than incorrect', async () => {
  const links: MeaningExpectation = { labels: ['User', 'App', 'API', 'Cache', 'Database', 'backup'], facts: {
    components: [{ name: 'User', kind: 'component', coordinates: [.9, .95] }, { name: 'App', kind: 'component', coordinates: [.75, .75] }, { name: 'API', kind: 'component', coordinates: [.6, .6] }, { name: 'Cache', kind: 'component', coordinates: [.65, .45] }, { name: 'Database', kind: 'component', coordinates: [.15, .8] }],
    links: [{ source: 'User', target: 'App', kind: '->', label: '' }, { source: 'App', target: 'API', kind: '+>', label: '' }, { source: 'API', target: 'Database', kind: '->', label: '' }, { source: 'API', target: 'Cache', kind: '+<>', label: '' }, { source: 'Cache', target: 'Database', kind: "+'backup'>", label: 'backup' }]
  } }
  expect(status(await observe(513, 'wardley', links), 'source-fact:links')).toBe('unavailable')
  const timeline: MeaningExpectation = { labels: ['History of Social Media Platform', '2002', 'LinkedIn', '2004', 'Facebook', 'Google', '2005', 'YouTube', '2006', 'Twitter', '2007', 'Tumblr', '2008', 'Instagram', '2010', 'Pinterest'] }
  expect(status(await observe(450, 'timeline', timeline), 'paint-opacity-and-color')).toBe('unavailable')
})

test('intrinsic image overpaint withholds individual packet and radial geometry facts', async () => {
  const radar: MeaningExpectation = { labels: ['Restaurant Comparison', 'Food Quality', 'Service', 'Price', 'Ambiance', 'Restaurant A', 'Restaurant B', 'Restaurant C', 'Restaurant D'], facts: {
    axes: [{ id: 'food', label: 'Food Quality' }, { id: 'service', label: 'Service' }, { id: 'price', label: 'Price' }, { id: 'ambiance', label: 'Ambiance' }],
    curves: [{ id: 'a', label: 'Restaurant A', values: [4, 3, 2, 4] }, { id: 'b', label: 'Restaurant B', values: [3, 4, 3, 3] }, { id: 'c', label: 'Restaurant C', values: [2, 3, 4, 2] }, { id: 'd', label: 'Restaurant D', values: [2, 2, 4, 3] }], range: [0, 5]
  } }
  const cover = (page: Page) => page.evaluate(() => {
    const svg = document.querySelector('svg')!, vb = svg.viewBox.baseVal, image = document.createElementNS(svg.namespaceURI, 'image')
    image.setAttribute('x', String(vb.x)); image.setAttribute('y', String(vb.y)); image.setAttribute('width', String(vb.width || 1600)); image.setAttribute('height', String(vb.height || 1200))
    image.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="white"/></svg>')); image.setAttribute('preserveAspectRatio', 'none'); svg.append(image)
    return new Promise<void>(resolve => image.addEventListener('load', () => resolve(), { once: true }))
  })
  expect(status(await observe(331, 'radar', radar), 'source-fact:curves')).toBe('passed')
  const packetCovered = await observe(324, 'packet', packet, cover)
  expect(status(packetCovered, 'source-fact:fields')).not.toBe('passed')
  expect(status(packetCovered, 'painted-bit-field-ratios')).not.toBe('passed')
  expect(status(await observe(331, 'radar', radar, cover), 'source-fact:curves')).not.toBe('passed')
  const hiddenImage = await observe(324, 'packet', packet, async page => { await cover(page); await page.locator('image').evaluate(e => e.setAttribute('display', 'none')) })
  expect(status(hiddenImage, 'source-fact:fields')).toBe('passed')
  const outsideImage = await observe(331, 'radar', radar, async page => { await cover(page); await page.locator('image').evaluate(e => e.setAttribute('x', '10000')) })
  expect(status(outsideImage, 'source-fact:curves')).toBe('passed')
  const instanceCover = await observe(324, 'packet', packet, page => page.evaluate(() => {
    const svg = document.querySelector('svg')!, defs = document.createElementNS(svg.namespaceURI, 'defs'), cell = document.createElementNS(svg.namespaceURI, 'rect'), use = document.createElementNS(svg.namespaceURI, 'use')
    cell.id = 'independent-opaque-cell'; cell.setAttribute('width', '1600'); cell.setAttribute('height', '1200'); cell.setAttribute('fill', 'white'); defs.append(cell); svg.append(defs)
    use.setAttribute('href', '#independent-opaque-cell'); svg.append(use)
  }))
  expect(status(instanceCover, 'source-fact:fields')).not.toBe('passed')
})

test('explicit requirement layout is independent from relation arrow direction', async () => {
  const expected: MeaningExpectation = { labels: ['test_req', '1', 'the test text.', 'high', 'test', 'test_entity', 'simulation', 'satisfies'], nodes: [{ id: 'test_req', label: 'test_req' }, { id: 'test_entity', label: 'test_entity' }], edges: [{ source: 'test_entity', target: 'test_req', directed: true, label: 'satisfies' }], facts: {
    direction: 'LR', definitions: [{ name: 'test_req', kind: 'requirement', fields: { id: '1', text: 'the test text.', risk: 'high', verifymethod: 'test' } }, { name: 'test_entity', kind: 'element', fields: { type: 'simulation' } }]
  } }
  const original = await observe(352, 'requirement', expected)
  expect(original.checks.filter(check => ['painted-node-ownership','painted-node-visibility'].includes(check.criterion) && check.status !== 'passed')).toEqual([])
  expect(original.checks.find(check => check.criterion === 'source-fact:direction')).toMatchObject({ status: 'passed', actual: [{ source: 'test_entity', target: 'test_req', actualDirection: 'LR' }] })
  const equivalent = await observe(352, 'requirement', expected, page => page.evaluate(() => {
    const svg = document.querySelector('svg')!, group = document.createElementNS(svg.namespaceURI, 'g')
    for (const e of [...svg.children]) if (!['style','defs','title','desc'].includes(e.localName)) group.append(e)
    group.setAttribute('transform', 'translate(15,20) scale(.8)'); svg.append(group)
  }))
  expect(status(equivalent, 'source-fact:direction')).toBe('passed')
  const vertical = await observe(352, 'requirement', expected, page => page.evaluate(() => {
    const svg = document.querySelector('svg')!, vb = svg.viewBox.baseVal, group = document.createElementNS(svg.namespaceURI, 'g'), width = vb.width, height = vb.height
    for (const e of [...svg.children]) if (!['style','defs','title','desc'].includes(e.localName)) group.append(e)
    group.setAttribute('transform', 'matrix(0 1 -1 0 ' + height + ' 0)'); svg.setAttribute('viewBox', '0 0 ' + height + ' ' + width); svg.append(group)
  }))
  expect(status(vertical, 'source-fact:direction')).toBe('failed')
})
