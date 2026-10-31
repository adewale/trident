import { afterAll, beforeAll, expect, test } from 'bun:test'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { inspectFidelityPaint, type PaintEvidence, type PaintInput } from '../fidelity/paint.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import { chromiumExecutable } from './helpers/environment.ts'

let browser: any
beforeAll(async () => {
  const require = createRequire(join(import.meta.dir, '../package.json'))
  browser = await require('playwright').chromium.launch({ headless: true, executablePath: chromiumExecutable })
})
afterAll(async () => { await browser?.close() })
const expected = { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true }] }
const fixture = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z"/></marker></defs><g class="node"><rect x="10" y="10" width="60" height="30" fill="white" stroke="black"/><text x="14" y="30">Alpha</text></g><g class="node"><rect x="150" y="10" width="60" height="30" fill="white" stroke="black"/><text x="154" y="30">Beta</text></g><g class="edge"><path d="M70 25 L150 25" fill="none" stroke="black" marker-end="url(#arrow)"/></g></svg>`
const retainedSvg = (name: string) => readFileSync(join(import.meta.dir, 'fixtures/fidelity', name), 'utf8')
async function inspect(svg: string, expectation: MeaningExpectation = expected, options: Pick<PaintInput, 'paint'> & { family?: string } = {}): Promise<PaintEvidence> {
  const page = await browser.newPage()
  try { await page.setContent(svg); return await page.evaluate(inspectFidelityPaint, { family: options.family ?? 'flowchart', expected: expectation, paint: options.paint }) as PaintEvidence }
  finally { await page.close() }
}

test('actual Mermaid drop shadow preserves source ink without granting arbitrary filters paint credit', async () => {
  const svg = retainedSvg('mermaid-flowchart-drop-shadow.svg')
  const authored = { labels: ['Alpha', 'Beta', 'Gamma'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }, { id: 'C', label: 'Gamma' }], edges: [{ source: 'A', target: 'B', directed: true }, { source: 'B', target: 'C', directed: true }] }
  const observed = await inspect(svg, authored)
  expect(observed.passed).toBe(true)
  expect((await inspect(svg.replaceAll('community-fidelity-0', 'renamed-output'), authored)).passed).toBe(true)
  for (const changed of [
    svg.replace('height="130%" width="130%"', 'height="10%" width="10%"'),
    svg.replace('<feDropShadow ', '<feDropShadow in="SourceAlpha" '),
    svg.replace(/<feDropShadow[^>]*><\/feDropShadow>/, '<feComponentTransfer><feFuncA type="linear" slope="0"/></feComponentTransfer>'),
  ]) {
    const result = await inspect(changed, authored)
    expect(result.checks.find(item => item.criterion === 'paint-opacity-and-color')?.status).toBe('unavailable')
    expect(result.passed).toBe(false)
  }
  const hidden = await inspect(svg.replace(/(<g[^>]*class="nodes"[^>]*>)/, '$1<g opacity="0">').replace('</svg>', '</g></svg>'), authored)
  expect(hidden.passed).toBe(false)
})

test('actual painted endpoints and multiplicity are independent of correct labels and model expectations', async () => {
  expect((await inspect(fixture)).passed).toBe(true)
  const reversed = await inspect(fixture.replace('M70 25 L150 25', 'M150 25 L70 25'))
  expect(reversed.checks.find(item => item.criterion === 'visible-authored-labels')?.status).toBe('passed')
  expect(reversed.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('failed')
  const duplicate = await inspect(fixture.replace('</svg>', '<g class="edge"><path d="M70 25 L150 25" fill="none" stroke="black" marker-end="url(#arrow)"/></g></svg>'))
  expect(duplicate.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('failed')
  const hidden = await inspect(fixture.replace('stroke="black" marker-end', 'stroke="none" marker-end'))
  expect(hidden.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('failed')
  for (const hiddenPaint of ['stroke="black" stroke-opacity="0"', 'stroke="transparent"']) {
    const invisible = await inspect(fixture.replace('stroke="black" marker-end', hiddenPaint + ' marker-end'))
    expect(invisible.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('failed')
  }
  const detached = await inspect(fixture.replace('M70 25 L150 25', 'M87 25 L133 25'))
  expect(detached.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('unavailable')
  const invented = await inspect(fixture, { ...expected, edges: [] })
  expect(invented.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('failed')
})

test('positive-alpha labels cannot earn visible credit when their opaque node backdrop has the same colour', async () => {
  const white = fixture.replaceAll('<text ', '<text fill="white" ')
  expect((await inspect(white)).checks.find(check => check.criterion === 'visible-authored-labels')?.status).toBe('failed')
  const black = fixture.replaceAll('fill="white"', 'fill="black"')
  expect((await inspect(black)).checks.find(check => check.criterion === 'visible-authored-labels')?.status).toBe('failed')
  expect((await inspect(fixture)).checks.find(check => check.criterion === 'visible-authored-labels')?.status).toBe('passed')
  const subpixel = fixture.replaceAll('<text ', '<text opacity="0.000000001" ')
  expect((await inspect(subpixel)).checks.find(check => check.criterion === 'paint-opacity-and-color')?.status).toBe('unavailable')
  const invisibleBody = fixture.replaceAll('fill="white" stroke="black"', 'fill="white" stroke="none"')
  expect((await inspect(invisibleBody)).checks.find(check => check.criterion === 'painted-node-ownership')?.status).not.toBe('passed')
  const invisibleEdge = fixture.replace('fill="none" stroke="black" marker-end', 'fill="none" stroke="white" marker-end')
  expect((await inspect(invisibleEdge)).checks.find(check => check.criterion === 'painted-relationships')?.status).not.toBe('passed')
})

test('an extra explicitly identified but unbound route cannot earn exact multiplicity credit', async () => {
  const extra = fixture.replace('</svg>', '<g class="edge"><path d="M20 70 L220 70" fill="none" stroke="black" marker-end="url(#arrow)"/></g></svg>')
  expect((await inspect(extra)).checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('unavailable')
})

test('one missing node body cannot borrow a surrounding cluster while another body remains distinct', async () => {
  const missing = fixture.replace('<rect x="10" y="10" width="60" height="30" fill="white" stroke="black"/>', '')
    .replace('<g class="node">', '<g class="cluster"><rect x="0" y="0" width="230" height="70" fill="white" stroke="black"/><g class="node">')
    .replace('M70 25 L150 25', 'M0 25 L150 25').replace('</svg>', '</g></svg>')
  const observed = await inspect(missing)
  expect(observed.checks.find(item => item.criterion === 'painted-node-ownership')?.status).toBe('unavailable')
  expect(observed.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('unavailable')
})

test('group labels bind their own containers without letting nodes borrow the same group outline', async () => {
  const grouped = fixture.replace('<g class="node">', '<g class="cluster"><rect x="4" y="4" width="224" height="72" fill="white" stroke="black"/><text x="12" y="68">Team</text><g class="node">').replace('</svg>', '</g></svg>')
  const authored = { ...expected, labels: [...expected.labels, 'Team'], groups: [{ id: 'team', label: 'Team', members: ['A', 'B'] }] }
  expect((await inspect(grouped, authored)).checks.find(item => item.criterion === 'painted-group:team')?.status).toBe('passed')
  const wrong = await inspect(grouped.replace('width="224" height="72"', 'width="100" height="72"'), authored)
  expect(wrong.checks.find(item => item.criterion === 'painted-group:team')?.status).toBe('failed')
  const missingNode = grouped.replace('<rect x="10" y="10" width="60" height="30" fill="white" stroke="black"/>', '')
  expect((await inspect(missingNode, authored)).checks.find(item => item.criterion === 'painted-node-ownership')?.status).toBe('unavailable')
})

test('collapsed or hidden source content cannot pass merely because the requested outer labels are present', async () => {
  const authored = { ...expected, forbiddenLabels: ['Beta'] }
  expect((await inspect(fixture, authored)).checks.find(item => item.criterion === 'hidden-authored-content')?.status).toBe('failed')
  const hidden = fixture.replace('x="154" y="30"', 'x="154" y="30" display="none"')
  expect((await inspect(hidden, authored)).checks.find(item => item.criterion === 'hidden-authored-content')?.status).toBe('passed')
  const masked = fixture.replace('x="154" y="30"', 'x="154" y="30" style="mask-image:linear-gradient(black,transparent)"')
  expect((await inspect(masked, authored)).checks.find(item => item.criterion === 'hidden-authored-content')?.status).toBe('unavailable')
})

test.each(['L0 0 L6 3 L0 6 Z', 'M0 0 L6 3 M0 6', 'M0 0 L6,,3 L0 6 Z'])('unprojected marker grammar cannot invent an arrow: %s', async path => {
  const broken = fixture.replace('M0 0 L6 3 L0 6 Z', path)
  expect((await inspect(broken)).checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('unavailable')
})

test('browser paint rejects hidden and clipped authored labels, not just missing SVG text', async () => {
  const hidden = await inspect(fixture.replace('x="154" y="30"', 'x="154" y="30" opacity="0"'))
  expect(hidden.checks.find(item => item.criterion === 'visible-authored-labels')?.status).toBe('failed')
  const clipped = await inspect(fixture.replace('viewBox="0 0 240 80"', 'viewBox="0 0 100 80"'))
  expect(clipped.checks.find(item => item.criterion === 'labels-within-canvas')?.status).toBe('failed')
  const selfClipped = await inspect(fixture.replace('</defs>', '<clipPath id="tiny"><rect x="0" y="0" width="1" height="1"/></clipPath></defs>').replace('x="154" y="30"', 'x="154" y="30" clip-path="url(#tiny)"'))
  const html = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect x="1" y="1" width="220" height="70" fill="white"/><foreignObject x="10" y="10" width="200" height="50"><div xmlns="http://www.w3.org/1999/xhtml" style="width:150px;white-space:nowrap;overflow-x:hidden;overflow-y:visible">A long authored label</div></foreignObject></svg>'
  expect((await inspect(html, { labels: ['A long authored label'] })).passed).toBe(true)
  const htmlClipped = await inspect(html.replace('width:150px', 'width:20px'), { labels: ['A long authored label'] })
  expect(htmlClipped.checks.find(item => item.criterion === 'unclipped-authored-labels')?.status).toBe('failed')
  expect(selfClipped.checks.find(item => item.criterion === 'unclipped-authored-labels')?.status).toBe('failed')
  const wrapped = fixture.replaceAll('width="60" height="30"', 'width="60" height="50"').replace('>Alpha</text>', '><tspan>Alpha</tspan><tspan x="14" dy="15">Beta</tspan></text>')
  const multiline = await inspect(wrapped, { ...expected, labels: ['Alpha Beta', 'Beta'], nodes: [{ id: 'A', label: 'Alpha Beta' }, { id: 'B', label: 'Beta' }] })
  expect(multiline.passed).toBe(true)
})

test('failed image decoding earns no paint credit and unsupported ownership remains unavailable', async () => {
  const broken = 'data:image/png;base64,invalid'
  const badImage = await inspect(fixture.replace('</svg>', `<image href="${broken}" width="20" height="20"/></svg>`), expected, { paint: { images: [{ href: broken, count: 1 }] } })
  expect(badImage.checks.find(item => item.criterion === 'embedded-images')?.status).toBe('failed')
  const red = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=='
  const retained = fixture.replace('</svg>', `<image href="${red}" x="100" y="50" width="20" height="20"/></svg>`)
  expect((await inspect(retained, expected, { paint: { images: [{ href: red, count: 1 }] } })).passed).toBe(true)
  const omitted = await inspect(fixture, expected, { paint: { images: [{ href: red, count: 1 }] } })
  expect(omitted.checks.find(item => item.criterion === 'embedded-images')?.status).toBe('failed')
  const hiddenImage = await inspect(retained.replace('x="100" y="50" width="20"', 'x="100" y="50" opacity="0" width="20"'), expected, { paint: { images: [{ href: red, count: 1 }] } })
  expect(hiddenImage.checks.find(item => item.criterion === 'embedded-images')?.status).toBe('failed')
  const ambiguous = await inspect(fixture.replace('</svg>', '<g><rect x="10" y="50" width="60" height="25"/><text x="14" y="68">Alpha</text></g></svg>'))
  expect(ambiguous.checks.find(item => item.criterion === 'painted-node-ownership')?.status).toBe('unavailable')
  expect(ambiguous.passed).toBe(false)
  const mask = await inspect(fixture.replace('x="154" y="30"', 'x="154" y="30" style="mask-image:linear-gradient(black,transparent)"'))
  expect(mask.checks.find(item => item.criterion === 'unclipped-authored-labels')?.status).toBe('unavailable')
})

test('every relationship label belongs to its actual owned route, even when all endpoints and text counts are correct', async () => {
  const shape = (x: number, label: string) => `<g><rect x="${x}" y="50" width="60" height="40" fill="white" stroke="black"/><text x="${x + 5}" y="75">${label}</text></g>`
  const defs = fixture.slice(fixture.indexOf('<defs>'), fixture.indexOf('</defs>') + 7)
  const drawing = `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="130">${defs}${shape(10, 'Alpha')}${shape(130, 'Beta')}${shape(250, 'Gamma')}<g class="edge"><path d="M70 70 L130 70" fill="none" stroke="black" marker-end="url(#arrow)"/></g><g class="edge"><path d="M190 70 L250 70" fill="none" stroke="black" marker-end="url(#arrow)"/></g><text x="80" y="65">send</text><text x="200" y="65">reply</text></svg>`
  const authored = { labels: ['Alpha', 'Beta', 'Gamma', 'send', 'reply'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }, { id: 'C', label: 'Gamma' }], edges: [{ source: 'A', target: 'B', directed: true, label: 'send' }, { source: 'B', target: 'C', directed: true, label: 'reply' }] }
  const valid = await inspect(drawing, authored)
  expect(valid.passed).toBe(true)
  const swapped = await inspect(drawing.replace('>send</text>', '>temporary</text>').replace('>reply</text>', '>send</text>').replace('>temporary</text>', '>reply</text>'), authored)
  expect(swapped.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('passed')
  expect(swapped.checks.find(item => item.criterion === 'painted-relationship-label-counts')?.status).toBe('passed')
  expect(swapped.checks.find(item => item.criterion === 'painted-relationship-label-ownership')?.status).toBe('failed')
})

test('marker ownership distinguishes inheritance, composition and inline arrowheads without classifying decorations as directed arrows', async () => {
  const base = fixture.replace('orient="auto"', 'orient="auto-start-reverse"').replace('fill="none" stroke="black" marker-end', 'fill="none" stroke="black" marker-start')
  const inheritance = base.replace('M0 0 L6 3 L0 6 Z', 'M0 0 L6 3 L0 6 Z" fill="white" stroke="black')
  expect((await inspect(inheritance, { ...expected, edges: [{ source: 'A', target: 'B', directed: true, startMarker: 'triangle', endMarker: 'none' }] }, { family: 'class' })).passed).toBe(true)
  const composition = base.replace('M0 0 L6 3 L0 6 Z', 'M0 3 L3 0 L6 3 L3 6 Z')
  expect((await inspect(composition, { ...expected, edges: [{ source: 'A', target: 'B', directed: false, startMarker: 'diamond', endMarker: 'none' }] }, { family: 'class' })).passed).toBe(true)
  const actualInline = fixture.replace('class="edge"', 'class="pele-edge"').replace('<path d="M70 25 L150 25" fill="none" stroke="black" marker-end="url(#arrow)"/>', '<path d="M70 25 L142 25" fill="none" stroke="black"/><path class="pele-marker" d="M150 25 L142 21 L142 29 Z" fill="black" stroke="none"/>')
  expect((await inspect(actualInline)).passed).toBe(true)
  const wrong = await inspect(actualInline.replace('M150 25 L142 21 L142 29 Z', 'M142 25 L150 21 L150 29 Z'))
  expect(wrong.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('failed')
})

test('requested font size is checked on every authored text run rather than one convenient element', async () => {
  const configured = fixture.replace('viewBox="0 0 240 80"', 'viewBox="0 0 240 80" style="font-size:14px"')
  expect((await inspect(configured, expected, { paint: { fontSize: 14 } })).passed).toBe(true)
  const wrong = await inspect(configured.replace('x="154" y="30"', 'x="154" y="30" font-size="24"'), expected, { paint: { fontSize: 14 } })
  expect(wrong.checks.find(item => item.criterion === 'computed-authored-font-size')?.status).toBe('failed')
})

test('owned node fill and edge stroke effects cannot be satisfied by unrelated matching decorations', async () => {
  const styled = fixture.replaceAll('fill="white" stroke="black"', 'fill="#ffcc00" stroke="black"').replace('fill="none" stroke="black" marker-end', 'fill="none" stroke="#225588" stroke-width="3" marker-end')
  const paint = { nodeFill: '#ffcc00', edgeStroke: '#225588', edgeStrokeWidth: 3 }
  expect((await inspect(styled, expected, { paint })).passed).toBe(true)
  const omittedFill = await inspect(styled.replace('fill="#ffcc00"', 'fill="white"') + '<svg><rect fill="#ffcc00"/></svg>', expected, { paint })
  expect(omittedFill.checks.find(item => item.criterion === 'computed-owned-node-fill')?.status).toBe('failed')
  const transparentFill = await inspect(styled.replace('fill="#ffcc00"', 'fill="#ffcc00" fill-opacity="0"'), expected, { paint })
  expect(transparentFill.checks.find(item => item.criterion === 'computed-owned-node-fill')?.status).toBe('failed')
  const omittedStroke = await inspect(styled.replace('stroke-width="3"', 'stroke-width="1"'), expected, { paint })
  expect(omittedStroke.checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('passed')
  expect(omittedStroke.checks.find(item => item.criterion === 'computed-owned-edge-style')?.status).toBe('failed')
})

test('barbed four-vertex arrows are concave directional heads rather than convex cardinality diamonds', async () => {
  const barb = fixture.replace('M0 0 L6 3 L0 6 Z', 'M6 3 L0 6 L2 3 L0 0 Z')
  expect((await inspect(barb, expected, { family: 'state' })).checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('passed')
  expect((await inspect(barb.replace('M6 3 L0 6 L2 3 L0 0 Z', 'M0 3 L6 6 L4 3 L6 0 Z'), expected, { family: 'state' })).checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('failed')
})

test('actual sequence messages exclude painted actor lifelines and nested outlines retain node ownership', async () => {
  const sequence = fixture.replace('height="80" viewBox="0 0 240 80"', 'height="100" viewBox="0 0 240 100"').replace('<g class="edge"><path d="M70 25 L150 25" fill="none" stroke="black" marker-end="url(#arrow)"/></g>', '<line class="lifeline" x1="40" y1="40" x2="40" y2="95" stroke="black"/><line class="lifeline" x1="180" y1="40" x2="180" y2="95" stroke="black"/><g class="message"><line x1="40" y1="60" x2="180" y2="60" stroke="black" marker-end="url(#arrow)"/></g>')
  for (const family of ['sequence', 'zenuml']) expect((await inspect(sequence, expected, { family })).checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('passed')
  const nested = fixture.replace(/(<rect\b[^>]*\/>)/g, '<g class="outer-path">$1</g>')
  expect((await inspect(nested, expected, { family: 'class' })).checks.find(item => item.criterion === 'painted-node-ownership')?.status).toBe('passed')
})

test('rich foreignObject leaves remain actual authored text and logical tree groups do not imply enclosure', async () => {
  const rich = fixture.replace('<text x="14" y="30">Alpha</text>', '<foreignObject x="14" y="14" width="52" height="22"><div xmlns="http://www.w3.org/1999/xhtml"><span><b>Alpha</b></span></div></foreignObject>')
  expect((await inspect(rich, expected, { family: 'eventmodeling' })).checks.find(item => item.criterion === 'visible-authored-labels')?.status).toBe('passed')
  const hierarchy = await inspect(fixture, { ...expected, groups: [{ id: 'A', label: 'Alpha', members: ['B'] }] }, { family: 'mindmap' })
  expect(hierarchy.checks.find(item => item.criterion === 'painted-group:A')?.status).toBe('unavailable')
})

test('C4 person relationships can attach to the actual compound head rather than an unrelated body rectangle', async () => {
  const compound = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="110"><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z"/></marker></defs><g class="node c4-person"><g class="basic label-container"><rect x="10" y="50" width="60" height="30"/><circle cx="40" cy="35" r="20"/></g><text x="14" y="70" fill="white">Alpha</text></g><g class="node"><rect x="150" y="10" width="60" height="30"/><text x="154" y="30" fill="white">Beta</text></g><g class="edge"><path d="M60 35 L150 25" fill="none" stroke="black" marker-end="url(#arrow)"/></g></svg>'
  expect((await inspect(compound, expected, { family: 'c4' })).checks.find(item => item.criterion === 'painted-relationships')?.status).toBe('passed')
  expect((await inspect(compound.replace('<circle cx="40" cy="35" r="20"/>', ''), expected, { family: 'c4' })).checks.find(item => item.criterion === 'painted-relationships')?.status).not.toBe('passed')
})

test('actual Mermaid open-arrow legs retain direction across a repeated moveto apex', async () => {
  const svg = retainedSvg('mermaid-requirement-open-arrow.svg')
  const authored = { labels: ['reliable', 'suite', 'Requests retain meaning'], nodes: [{ id: 'reliable', label: 'reliable' }, { id: 'suite', label: 'suite' }], edges: [{ source: 'suite', target: 'reliable', directed: true, label: 'verifies' }] }
  const observed = await inspect(svg, authored, { family: 'requirement' })
  expect(observed.checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('passed')
  expect(observed.checks.find(check => check.criterion === 'painted-relationship-label-ownership')?.status).toBe('passed')
  const reversed = svg.replace('M0,0\n      L20,10\n      M20,10\n      L0,20', 'M20,0 L0,10 M0,10 L20,20')
  expect((await inspect(reversed, authored, { family: 'requirement' })).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('failed')
  const unprojected = fixture.replace('<path d="M0 0 L6 3 L0 6 Z"/>', '<path d="M0 0 L6 3 M0 6 L6 3" fill="none" stroke="black"/>')
  expect((await inspect(unprojected)).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('unavailable')
  const malformed = fixture.replace('M0 0 L6 3 L0 6 Z', 'M0 0 L6 3 @ L0 6 Z')
  expect((await inspect(malformed)).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('unavailable')
})

test('actual ZenUML inline SVG heads and reflected arrows determine reciprocal physical direction', async () => {
  const svg = retainedSvg('mermaid-zenuml-inline-arrows.svg')
  const authored = { labels: ['Alice', 'John', 'Hello John, how are you?', 'Great!'], nodes: [{ id: 'Alice', label: 'Alice' }, { id: 'John', label: 'John' }], edges: [{ source: 'Alice', target: 'John', directed: true, label: 'Hello John, how are you?' }, { source: 'John', target: 'Alice', directed: true, label: 'Great!' }] }
  const observed = await inspect(svg, authored, { family: 'zenuml' })
  expect(observed.checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('passed')
  expect(observed.checks.find(check => check.criterion === 'painted-relationship-label-ownership')?.status).toBe('passed')
  const reversed = svg.replace('transform="scale(-1, 1) translate(-7, 0)"', '')
  expect((await inspect(reversed, authored, { family: 'zenuml' })).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('failed')
})

test('actual ZenUML activations, self calls, and return polylines stay owned by their drawn actors', async () => {
  const svg = retainedSvg('mermaid-zenuml-activations.svg')
  const authored = { labels: ['Client', 'API', 'Stock', 'checkout()', 'reserve()', 'ticket', 'fail()', 'receipt', 'available'], nodes: [{ id: 'Client', label: 'Client' }, { id: 'API', label: 'API' }, { id: 'Stock', label: 'Stock' }], edges: [{ source: 'Client', target: 'API', label: 'checkout()', directed: true }, { source: 'API', target: 'Stock', label: 'reserve()', directed: true }, { source: 'Stock', target: 'API', label: 'ticket', directed: true }, { source: 'API', target: 'API', label: 'fail()', directed: true }, { source: 'API', target: 'Client', label: 'receipt', directed: true }] }
  const observed = await inspect(svg, authored, { family: 'zenuml' })
  expect(observed.checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('passed')
  expect(observed.checks.find(check => check.criterion === 'painted-relationship-label-ownership')?.status).toBe('passed')
  const identityViewport = svg.replace('x="158" y="291" width="30" height="24"', 'x="158" y="291" width="30" height="24" viewBox="0 0 30 24"')
  expect((await inspect(identityViewport, authored, { family: 'zenuml' })).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('passed')
  const detached = svg.replace('x1="243" y1="214" x2="158"', 'x1="243" y1="214" x2="178"')
  expect((await inspect(detached, authored, { family: 'zenuml' })).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('failed')
})

test('actual Pele external labels bind distinct service bodies without borrowing their common cluster', async () => {
  const svg = retainedSvg('pele-architecture-external-labels.svg')
  const authored = { labels: ['App', 'API', 'Data'], nodes: [{ id: 'api', label: 'API' }, { id: 'db', label: 'Data' }], edges: [{ source: 'api', target: 'db', directed: true }] }
  const observed = await inspect(svg, authored, { family: 'architecture' })
  expect(observed.checks.find(check => check.criterion === 'painted-node-ownership')?.status).toBe('passed')
  expect(observed.checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('passed')
  const absentBodies = svg.replaceAll(/<rect x="-24" width="48" height="48"[^>]*\/>/g, '')
  expect((await inspect(absentBodies, authored, { family: 'architecture' })).checks.find(check => check.criterion === 'painted-node-ownership')?.status).toBe('unavailable')
  const unprojected = svg.replace('d="M108,60L100,63.36L100,56.64Z" fill="var(--_l)" stroke="none"', 'd="M100,56.64L108,60M100,63.36L108,60" fill="none" stroke="var(--_l)"')
  expect((await inspect(unprojected, authored, { family: 'architecture' })).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('unavailable')
})


test('inline arrows use the same geometry for every renderer prefix and reject missing, reversed and detached heads', async () => {
  const svg = retainedSvg('bezel-inline-arrow.svg')
  const facts = { labels: ['A', 'B'], nodes: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], edges: [{ source: 'A', target: 'B', directed: true }] }
  expect((await inspect(svg, facts)).passed).toBe(true)
  expect((await inspect(svg.replaceAll('bezel-', 'independent-'), facts)).passed).toBe(true)
  const mutations = [
    svg.replace(/<path class="bezel-marker"[^>]*\/>/, ''),
    svg.replace('M104,32L96,35.36L96,28.64Z', 'M96,32L104,35.36L104,28.64Z'),
    svg.replace('M104,32L96,35.36L96,28.64Z', 'M124,32L116,35.36L116,28.64Z'),
  ]
  for (const broken of mutations) expect((await inspect(broken, facts)).checks.find(check => check.criterion === 'painted-relationships')?.status).not.toBe('passed')
})


test('an additional visible node cannot earn a complete ownership pass by preserving expected labels', async () => {
  const extra = fixture.replace('</svg>', '<g class="thirdparty-node"><rect x="85" y="43" width="60" height="30" fill="white" stroke="black"/><text x="88" y="63">Intruder</text></g></svg>')
  expect((await inspect(extra)).checks.find(check => check.criterion === 'painted-node-ownership')?.status).toBe('failed')
})


test('unclassed inline triangle geometry is observed without an implementation-specific selector', async () => {
  const svg = retainedSvg('dart-inline-arrow.svg')
  const facts = { labels: ['A', 'B'], nodes: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], edges: [{ source: 'A', target: 'B', directed: true }] }
  expect((await inspect(svg, facts)).passed).toBe(true)
  const backwards = svg.replace('129,33 121,37 121,29', '121,33 129,37 129,29')
  expect((await inspect(backwards, facts)).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('failed')
})

test('unwrapped public SVG binds labels to individual real outlines without borrowing a canvas background', async () => {
  const authored = { labels: ['A', 'B'], nodes: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], edges: [{ source: 'A', target: 'B', directed: true }] }
  for (const name of ['rs-flat-flowchart.svg', 'merslim-flat-flowchart.svg']) {
    const svg = retainedSvg(name)
    expect((await inspect(svg, authored)).checks.filter(check => ['painted-node-ownership', 'painted-relationships'].includes(check.criterion)).map(check => [check.criterion, check.status])).toEqual([['painted-node-ownership', 'passed'], ['painted-relationships', 'passed']])
    const renamed = svg.replaceAll('edge-0', 'arbitrary-relation').replaceAll('edgePath', 'arbitrary-path')
    expect((await inspect(renamed, authored)).checks.find(check => check.criterion === 'painted-relationships')?.status).toBe('passed')
    const extra = svg.replace('</svg>', '<rect x="10" y="67" width="60" height="10" fill="white" stroke="black"/><text x="12" y="75" font-size="8">Intruder</text></svg>')
    expect((await inspect(extra, authored)).checks.find(check => check.criterion === 'painted-node-ownership')?.status).toBe('failed')
  }
  const flat = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100"><rect width="240" height="100" fill="white"/><text x="14" y="30">Alpha</text></svg>'
  expect((await inspect(flat, { labels: ['Alpha'], nodes: [{ id: 'A', label: 'Alpha' }], edges: [] })).checks.find(check => check.criterion === 'painted-node-ownership')?.status).toBe('unavailable')
})

test('a later opaque cover cannot preserve passing visible-label evidence through positive text bounds', async () => {
  const opaque = fixture.replace('</svg>', '<rect x="0" y="0" width="240" height="80" fill="white" pointer-events="none"/></svg>')
  const hidden = await inspect(opaque)
  expect(hidden.checks.find(check => check.criterion === 'visible-authored-labels')?.status).toBe('passed')
  expect(hidden.checks.find(check => check.criterion === 'unclipped-authored-labels')?.status).toBe('failed')
  expect(hidden.passed).toBe(false)
  const partial = await inspect(fixture.replace('</svg>', '<rect x="10" y="10" width="20" height="30" fill="white"/></svg>'))
  expect(partial.checks.find(check => check.criterion === 'unclipped-authored-labels')?.status).toBe('unavailable')
  const behind = fixture.replace('<defs>', '<rect x="0" y="0" width="240" height="80" fill="white"/><defs>')
  expect((await inspect(behind)).passed).toBe(true)
})
