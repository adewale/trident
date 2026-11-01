import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { inspectFidelityPaint } from '../fidelity/paint.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ executablePath: chromiumExecutable, headless: true }) })
afterAll(async () => { await browser?.close() })
const directory = new URL('./fixtures/domain-completion/', import.meta.url)
const provenance = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8')) as any[]
const docs = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8')) as any[]
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as any[]
const svgFor = (index: number) => gunzipSync(readFileSync(new URL(provenance.find(entry => entry.index === index).file, directory))).toString()
async function inspect(index: number, change?: string) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(svgFor(index))
    if (change) await page.evaluate(change)
    return await inspectSvgDrawing(page, { family: docs[index].family, source: sources[index].source, expected: docs[index].expected })
  } finally { await page.close() }
}
const status = (result: Awaited<ReturnType<typeof inspect>>, key: string) => result.checks.find(check => check.criterion === key)?.status

test('retained completion witnesses preserve actual source and owning public return provenance', () => {
  for (const entry of provenance) {
    expect(createHash('sha256').update(svgFor(entry.index)).digest('hex')).toBe(entry.svgSha256)
    expect(createHash('sha256').update(sources[entry.index].source).digest('hex')).toBe(entry.sourceSha256)
    expect(entry.parentInvocationId).toBeTruthy()
  }
})

test('neutral brightness preserves exposed timeline paint and cannot hide text or excuse arbitrary filters', async () => {
  for (const index of [437]) {
    const result = await inspect(index)
    expect(status(result, 'paint-opacity-and-color')).toBe('passed')
  }
  // Neutral white-only event bodies are not exposed against the white canvas.
  expect(status(await inspect(450), 'paint-opacity-and-color')).toBe('unavailable')
  const opaque = await inspect(437, `document.querySelector('svg').style.filter='opacity(0)'`)
  expect(opaque.passed).toBe(false)
  const unsupported = await inspect(437, `document.querySelector('svg').style.filter='blur(5px)'`)
  expect(status(unsupported, 'paint-opacity-and-color')).toBe('unavailable')
})

test('brightness is evaluated after filtering when foreground and backdrop become identical', async () => {
  const page = await browser.newPage()
  try {
    await page.setContent('<svg width="200" height="90"><text x="20" y="45" fill="#ddd" style="filter:brightness(2)">Alpha</text></svg>')
    const result = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected: { labels: ['Alpha'] } })
    expect(status(result, 'visible-authored-labels')).toBe('failed')
    expect(result.passed).toBe(false)
    await page.setContent('<svg width="200" height="90"><g style="filter:brightness(1.1)"><g style="filter:brightness(1.1)"><rect x="10" y="10" width="150" height="60" fill="#ddd"/><text x="20" y="45">Alpha</text></g></g></svg>')
    const nested = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected: { labels: ['Alpha'], nodes: [{id:'A',label:'Alpha'}] } })
    expect(status(nested, 'paint-opacity-and-color')).toBe('unavailable')
  } finally { await page.close() }
})

test('multiline timeline captions retain exact text and measured period and section ownership', async () => {
  for (const index of [439, 440, 441]) {
    const result = await inspect(index)
    expect(result.passed).toBe(true)
  }
  const wrong = await inspect(439, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent.includes('Machinery'));e.closest('g').setAttribute('transform','translate(900,0)')`)
  expect(status(wrong, 'source-fact:periods')).not.toBe('passed')
  const missing = await inspect(441, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent.includes('Q1'));e.querySelector('tspan').textContent='2024 Q1'`)
  expect(status(missing, 'source-fact:sections')).not.toBe('passed')
  const td = await inspect(442)
  expect(status(td, 'source-fact:periods')).toBe('passed')
  const wrongBand = await inspect(442, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent.includes('sub-point   1b'));e.setAttribute('y','400')`)
  expect(status(wrongBand, 'source-fact:periods')).not.toBe('passed')
})

test('duplicate event basenames require their actual type-owned namespace rows', async () => {
  for (const index of [125, 131]) expect((await inspect(index)).passed).toBe(true)
  const wrong = await inspect(131, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Stream: Cart');e.textContent='Stream: Other'`)
  expect(status(wrong, 'source-fact:frames')).not.toBe('passed')
  const extra = await inspect(131, `const e=[...document.querySelectorAll('foreignObject b')].find(e=>e.textContent==='InventoryChanged');e.parentElement.append(e.cloneNode(true))`)
  expect(status(extra, 'source-fact:frames')).not.toBe('passed')
})

test('treemap currency and percent formats require every actual owned amount', async () => {
  expect((await inspect(471)).passed).toBe(true)
  const wrong = await inspect(471, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='$35.0%');e.textContent='$30.0%'`)
  expect(status(wrong, 'source-fact:displayed-values')).toBe('failed')
  const missing = await inspect(471, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='$35.0%');e.remove()`)
  expect(status(missing, 'source-fact:show-values')).toBe('failed')
  // The actual Supplies amount is display:none, so the visible contract fails.
  expect(status(await inspect(470), 'source-fact:displayed-values')).toBe('failed')
})

test('a Kanban priority is a card-owned category stripe, not a literal or arbitrary accent', async () => {
  expect((await inspect(304)).passed).toBe(true)
  const wrong = await inspect(304, `document.querySelector('line').style.stroke='blue'`)
  expect(status(wrong, 'source-fact:columns')).toBe('failed')
  const absent = await inspect(304, `document.querySelector('line').remove();document.querySelector('svg').insertAdjacentHTML('beforeend','<line x1="5" y1="5" x2="5" y2="80" stroke="orange" stroke-width="4"/>')`)
  expect(status(absent, 'source-fact:columns')).not.toBe('passed')
})

test('packet byte-color overrides bind the actual field-owned start endpoints', async () => {
  expect(status(await inspect(324), 'source-fact:authored-config')).toBe('failed')
  const correct = await inspect(324, `for(const e of document.querySelectorAll('text'))if(['0','16','32'].includes(e.textContent))e.style.fill='red'`)
  expect(status(correct, 'source-fact:authored-config')).toBe('passed')
  const borrowed = await inspect(324, `document.querySelector('svg').insertAdjacentHTML('beforeend','<text x="400" y="115" fill="red">0</text>')`)
  expect(status(borrowed, 'source-fact:authored-config')).toBe('failed')
})

test('XY explicit ranges use independently calibrated axis gutters and preserve wrong-scale controls', async () => {
  expect((await inspect(525)).passed).toBe(true)
  expect((await inspect(531)).passed).toBe(true)
  const wrongRange = await inspect(525, `const e=[...document.querySelectorAll('path')].find(e=>{const b=e.getBBox();return b.width===0&&b.height>400});const d=e.getAttribute('d');const nums=[...d.matchAll(/[-+]?\\d*\\.?\\d+/g)];const last=nums.at(-1);e.setAttribute('d',d.slice(0,last.index)+(Number(last[0])+20)+d.slice(last.index+last[0].length))`)
  expect(status(wrongRange, 'source-fact:y-range')).toBe('failed')
  const wrongCanvas = await inspect(531, `const e=document.querySelector('svg');e.setAttribute('viewBox','0 0 1000 600')`)
  expect(status(wrongCanvas, 'source-fact:authored-config')).toBe('failed')
  const wrongTitle = await inspect(531, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Sales Revenue');e.style.fill='blue'`)
  expect(status(wrongTitle, 'source-fact:authored-config')).toBe('failed')
})

test('radar polygon vertices and exposed curve tokens remain independently required', async () => {
  expect(status(await inspect(331), 'source-fact:range')).toBe('passed')
  expect((await inspect(332)).passed).toBe(true)
  const wrongRange = await inspect(331, `const e=[...document.querySelectorAll('polygon')].find(e=>e.getAttribute('points').includes('-240 180'));const p=e.points.getItem(0);p.y+=15;e.points.replaceItem(p,0)`)
  expect(status(wrongRange, 'source-fact:range')).not.toBe('passed')
  const wrongAlpha = await inspect(332, `document.querySelector('path').style.fillOpacity='0.5'`)
  expect(status(wrongAlpha, 'source-fact:theme-paint')).toBe('failed')
  const hidden = await inspect(332, `document.querySelector('svg').insertAdjacentHTML('beforeend','<rect x="50" y="50" width="600" height="600" fill="white"/>')`)
  expect(status(hidden, 'source-fact:theme-paint')).not.toBe('passed')
})

test('absolute Gantt calendars also prove excluded-day durations and clock milestone midpoints', async () => {
  expect((await inspect(259)).passed).toBe(true)
  expect((await inspect(260)).passed).toBe(true)
  const wrongDuration = await inspect(259, `const e=document.querySelector('rect.task');e.setAttribute('width',String(Number(e.getAttribute('width'))-20))`)
  expect(status(wrongDuration, 'painted-duration-ratios')).toBe('failed')
  const wrongMilestone = await inspect(260, `const e=document.querySelector('rect.milestone');e.setAttribute('x',String(Number(e.getAttribute('x'))+20))`)
  expect(status(wrongMilestone, 'source-fact:tasks')).not.toBe('passed')
})

for (const index of [48, 49]) test('C4 actual route-midpoint caption offsets: ' + index, async () => {
  expect(status(await inspect(index), 'source-fact:authored-style')).toBe('passed')
})
test('a moved C4 caption cannot retain its source offset', async () => {
  const wrong = await inspect(48, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Uses'&&getComputedStyle(e).fill==='rgb(0, 0, 255)');e.setAttribute('x',String(Number(e.getAttribute('x'))+10))`)
  expect(status(wrong, 'source-fact:authored-style')).not.toBe('passed')
})
test('unsupported C4 caption anchors remain unqualified', async () => {
  const borrowed = await inspect(48, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Uses'&&getComputedStyle(e).fill==='rgb(0, 0, 255)');e.style.textAnchor='start'`)
  expect(status(borrowed, 'source-fact:authored-style')).not.toBe('passed')
})

test('Wardley empty inventories, scoped captions, inertia and cumulative stage boundaries are physical facts', async () => {
  for (const index of [506, 507, 511, 518, 522]) expect((await inspect(index)).passed).toBe(true)
  const wrong = await inspect(518, `const e=[...document.querySelectorAll('line')].find(e=>Number(e.getAttribute('x1'))===Number(e.getAttribute('x2'))&&Number(e.getAttribute('x1'))>48);e.setAttribute('x1',String(Number(e.getAttribute('x1'))+20));e.setAttribute('x2',String(Number(e.getAttribute('x2'))+20))`)
  expect(status(wrong, 'source-fact:evolution-stages')).toBe('failed')
  const borrowed = await inspect(507, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Product'&&Number(e.getAttribute('y'))<500);e.remove()`)
  expect(status(borrowed, 'source-fact:components')).not.toBe('passed')
  const missingInertia = await inspect(511, `const e=[...document.querySelectorAll('line')].find(e=>getComputedStyle(e).strokeWidth==='6px');e.remove()`)
  expect(status(missingInertia, 'source-fact:components')).not.toBe('passed')
  const extra = await inspect(506, `document.querySelector('svg').insertAdjacentHTML('beforeend','<circle cx="200" cy="200" r="6" fill="white" stroke="black"/>')`)
  expect(status(extra, 'source-fact:components')).toBe('failed')
})

test('Wardley force arrows preserve physical direction and source anchor without fitted positions', async () => {
  expect((await inspect(521)).passed).toBe(true)
  const shifted = await inspect(521, `document.querySelector('path').setAttribute('transform','translate(20,0)')`)
  expect(status(shifted, 'source-fact:annotations')).not.toBe('passed')
  const erased = await inspect(521, `document.querySelector('path').style.opacity='0'`)
  expect(status(erased, 'source-fact:annotations')).not.toBe('passed')
  expect(status(await inspect(512), 'source-fact:components')).toBe('failed')
})

test('treemap requested minimum outer padding binds all actual ink geometry', async () => {
  expect((await inspect(469)).passed).toBe(true)
  const reduced = await inspect(469, `const e=document.querySelector('svg');const v=e.viewBox.baseVal;e.setAttribute('viewBox',[v.x+50,v.y+50,v.width-100,v.height-100].join(' '))`)
  expect(status(reduced, 'source-fact:authored-config')).toBe('failed')
})

test('curved multiply ribbons require bound ports, resolved alpha and actual contrast through overlays', async () => {
  for (const index of [357,358,359,360,361,362,363]) expect((await inspect(index)).passed).toBe(true)
  const invisibleOutline = await inspect(361, `document.querySelectorAll('text').forEach(e=>{if(getComputedStyle(e).stroke!=='none')e.style.stroke='white'})`)
  expect(status(invisibleOutline, 'source-fact:authored-config')).not.toBe('passed')
  const white = await inspect(357, `document.querySelectorAll('stop').forEach(e=>e.style.stopColor='white')`)
  expect(status(white, 'source-fact:links')).not.toBe('passed')
  const covered = await inspect(357, `document.querySelector('svg').insertAdjacentHTML('beforeend','<rect x="100" y="20" width="250" height="400" fill="white"/>')`)
  expect(status(covered, 'source-fact:links')).not.toBe('passed')
  const image = await inspect(357, `document.querySelector('svg').insertAdjacentHTML('beforeend','<image x="100" y="20" width="250" height="400" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22%3E%3Crect width=%221%22 height=%221%22 fill=%22white%22/%3E%3C/svg%3E"/>')`)
  expect(status(image, 'source-fact:links')).not.toBe('passed')
  const stroke = await inspect(357, `document.querySelector('svg').insertAdjacentHTML('beforeend','<path d="M100,50C200,50,200,250,350,250" fill="none" stroke="white" stroke-width="100"/>')`)
  expect(status(stroke, 'source-fact:links')).not.toBe('passed')
  const darkBackdrop = await inspect(357, `document.querySelector('svg').insertAdjacentHTML('afterbegin','<rect x="0" y="0" width="800" height="450" fill="white" style="filter:brightness(0.005)"/>')`)
  expect(status(darkBackdrop, 'paint-opacity-and-color')).not.toBe('passed')
  const opaqueBound = await inspect(357, `const g=document.querySelector('.links .link'),clone=g.cloneNode(true),e=clone.querySelector('path');clone.querySelectorAll('linearGradient').forEach(e=>e.remove());e.style.stroke='black';e.style.strokeOpacity='1';g.parentElement.append(clone)`)
  expect(status(opaqueBound, 'paint-opacity-and-color')).not.toBe('passed')
  const lowAlpha = await inspect(357, `document.querySelectorAll('stop').forEach(e=>e.style.stopOpacity='0.000001')`)
  expect(status(lowAlpha, 'source-fact:links')).not.toBe('passed')
  const invalidPort = await inspect(357, `document.querySelector('.links path').setAttribute('transform','translate(60,0)')`)
  expect(status(invalidPort, 'source-fact:links')).not.toBe('passed')
})

test('transparent HTML space cannot be mistaken for paint over Venn captions', async () => {
  expect((await inspect(503)).passed).toBe(true)
  expect((await inspect(504)).passed).toBe(true)
  const opaque = await inspect(503, `document.querySelector('foreignObject span').style.background='white'`)
  expect(status(opaque, 'unclipped-authored-labels')).not.toBe('passed')
  const ownerOpaque = await inspect(503, `document.querySelector('foreignObject').style.background='white'`)
  expect(status(ownerOpaque, 'unclipped-authored-labels')).not.toBe('passed')
  const shadow = await inspect(503, `document.querySelector('foreignObject span').style.textShadow='0 -50px black'`)
  expect(status(shadow, 'unclipped-authored-labels')).not.toBe('passed')
  const wrong = await inspect(504, `const e=[...document.querySelectorAll('path')].find(e=>getComputedStyle(e).fill==='rgb(255, 107, 107)');e.style.setProperty('fill','blue','important')`)
  expect(status(wrong, 'source-fact:authored-style')).toBe('failed')
  const wrongText = await inspect(504, `const e=[...document.querySelectorAll('foreignObject')].find(e=>e.textContent==='React');e.querySelector('span').style.color='blue'`)
  expect(status(wrongText, 'source-fact:authored-style')).toBe('failed')
})

test('treemap class definitions bind every exact hierarchy attachment, including own value rows', async () => {
  expect((await inspect(466)).passed).toBe(true)
  const wrong = await inspect(466, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Leaf 2.1');e.style.setProperty('fill','green','important')`)
  expect(status(wrong, 'source-fact:authored-style')).toBe('failed')
  const borrowed = await inspect(466, `const e=[...document.querySelectorAll('rect')].find(e=>getComputedStyle(e).fill==='rgb(255, 0, 0)');e.style.setProperty('fill','green','important')`)
  expect(status(borrowed, 'source-fact:authored-style')).toBe('failed')
})
