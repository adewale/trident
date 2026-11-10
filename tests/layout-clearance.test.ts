import { afterAll, beforeAll, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { chromium, type Browser, type BrowserContext } from 'playwright'
import { measureLayout, type LayoutGeometry, type LayoutMetric, type Point } from '../fidelity/drawing/layout-geometry.ts'
import { observeSvgLayout } from '../fidelity/drawing/layout-svg.ts'
import type { DrawingCase } from '../fidelity/drawing/corpus.ts'
import { defaultChromium } from '../unified/benchmark-context.ts'

const rectangle = (x: number, y: number, width: number, height: number): Point[] => [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }, { x, y }]
const empty = (): LayoutGeometry => ({ nodes: [], edges: [], labels: [], groups: [], markers: [] })
const edge = (points: Point[], id = 'e', source = 'A', target = 'B') => ({ id, source, target, points })
const upstream = JSON.parse(readFileSync(new URL('./fixtures/layout/upstream-clearance.json', import.meta.url), 'utf8'))
for (const fixture of upstream.cases) test('adapted Mermaid regression: ' + fixture.name, () => {
  const geometry = empty()
  geometry.nodes = fixture.nodes.map((node: { id: string; x: number; y: number; width: number; height: number }) => ({ id: node.id, boundary: rectangle(node.x - node.width / 2, node.y - node.height / 2, node.width, node.height) }))
  geometry.edges = fixture.edges
  expect(measureLayout(geometry).counts[fixture.metric as LayoutMetric]).toBe(fixture.count)
})

test('own endpoint interiors are observed after a bounded terminal allowance, including self-loops', () => {
  const geometry = empty()
  geometry.nodes = [{ id: 'A', boundary: rectangle(0, 0, 40, 40) }, { id: 'B', boundary: rectangle(100, 0, 40, 40) }]
  geometry.edges = [edge([{ x: 40, y: 20 }, { x: 60, y: 20 }, { x: 100, y: 20 }])]
  expect(measureLayout(geometry).counts.edgeEndpointNodeIntersections).toBe(0)
  // Leave A, then return through its interior before continuing to B.
  geometry.edges[0]!.points = [{ x: 40, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 20 }, { x: 20, y: 20 }, { x: 20, y: 60 }, { x: 100, y: 60 }, { x: 100, y: 20 }]
  let result = measureLayout(geometry)
  expect(result.counts.edgeEndpointNodeIntersections).toBe(1)
  expect(result.findings.find(f => f.metric === 'edgeEndpointNodeIntersections')!.objects).toEqual(['e', 'A'])
  // Reversing the path must detect the same intrusion at the target.
  geometry.edges = [edge([...geometry.edges[0]!.points].reverse(), 'reverse', 'B', 'A')]
  expect(measureLayout(geometry).counts.edgeEndpointNodeIntersections).toBe(1)
  geometry.edges = [edge([{ x: 40, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 30 }, { x: 40, y: 30 }], 'self', 'A', 'A')]
  expect(measureLayout(geometry).counts.edgeEndpointNodeIntersections).toBe(0)
  geometry.edges[0]!.points.splice(2, 0, { x: 20, y: 20 })
  result = measureLayout(geometry)
  expect(result.counts.edgeEndpointNodeIntersections).toBe(1)
})
test('terminal tolerance follows arc length and cannot exempt later re-entry near the same port', () => {
  const geometry = empty()
  geometry.nodes = [{ id: 'A', boundary: rectangle(0, 0, 40, 40) }]
  geometry.edges = [edge([{ x: 39, y: 20 }, { x: 50, y: 20 }, { x: 100, y: 20 }])]
  expect(measureLayout(geometry).counts.edgeEndpointNodeIntersections).toBe(0)
  geometry.edges[0]!.points = [{ x: 40, y: 20 }, { x: 60, y: 20 }, { x: 60, y: 22 }, { x: 38, y: 22 }, { x: 38, y: 30 }]
  expect(measureLayout(geometry).counts.edgeEndpointNodeIntersections).toBe(1)
})
test('parallel route diagnostics preserve direction neutrality and exempt shared-node terminal fans', () => {
  const geometry = empty()
  geometry.edges = [edge([{ x: 0, y: 0 }, { x: 100, y: 0 }], 'first'), edge([{ x: 0, y: 2 }, { x: 100, y: 2 }], 'second', 'C', 'D')]
  let result = measureLayout(geometry)
  expect(result.counts.crowdedParallelPaths).toBe(1)
  expect(result.findings.find(f => f.metric === 'crowdedParallelPaths')!.details?.gap).toBe(2)
  geometry.edges[1]!.source = 'A'
  expect(measureLayout(geometry).counts.crowdedParallelPaths).toBe(0)
  geometry.edges[1]!.source = 'C'
  geometry.edges[1]!.points = [{ x: 0, y: 8 }, { x: 100, y: 8 }]
  expect(measureLayout(geometry).counts.crowdedParallelPaths).toBe(0)
  // Rotate both routes 45 degrees: the measurement must not require axes.
  geometry.edges = [edge([{ x: 0, y: 0 }, { x: 100, y: 100 }], 'first'), edge([{ x: 0, y: 2 }, { x: 100, y: 102 }], 'second', 'C', 'D')]
  expect(measureLayout(geometry).counts.crowdedParallelPaths).toBe(1)
})
test('group containment is allowed; border cuts and routes through actual titles are measured', () => {
  const geometry = empty()
  geometry.groups = [{ id: 'G', boundary: rectangle(0, 0, 200, 200), title: { x: 60, y: 10, width: 80, height: 20 } }]
  geometry.nodes = [{ id: 'A', boundary: rectangle(20, 60, 40, 40) }]
  geometry.labels = [{ id: 'caption', owner: 'e', box: { x: 180, y: 110, width: 40, height: 20 } }]
  geometry.edges = [edge([{ x: 100, y: 60 }, { x: 100, y: 0 }])]
  let result = measureLayout(geometry)
  expect(result.counts.edgeGroupTitleIntersections).toBe(1)
  expect(result.counts.labelGroupBorderIntersections).toBe(1)
  expect(result.counts.nodeGroupBorderIntersections).toBe(0)
  geometry.nodes[0]!.boundary = rectangle(-10, 60, 40, 40)
  expect(measureLayout(geometry).counts.nodeGroupBorderIntersections).toBe(1)
  geometry.labels[0]!.box.x = 120
  geometry.edges[0]!.points = [{ x: 50, y: 60 }, { x: 50, y: 0 }]
  result = measureLayout(geometry)
  expect(result.counts.edgeGroupTitleIntersections).toBe(0)
  expect(result.counts.labelGroupBorderIntersections).toBe(0)
})
test('labels can overlap their own arrowhead even though their own route is exempt', () => {
  const geometry = empty()
  geometry.edges = [edge([{ x: 20, y: 0 }, { x: 180, y: 0 }])]
  geometry.labels = [{ id: 'caption', owner: 'e', box: { x: 148, y: -10, width: 56, height: 21 } }]
  geometry.markers = [{ id: 'head', edge: 'e', terminal: 'end', boundary: [{ x: 170, y: -7 }, { x: 180, y: 0 }, { x: 170, y: 7 }, { x: 170, y: -7 }] }]
  let result = measureLayout(geometry)
  expect(result.counts.labelMarkerOverlaps).toBe(1)
  expect(result.counts.edgeLabelIntersections).toBe(0)
  geometry.labels[0]!.box = { x: 80, y: -10, width: 40, height: 21 }
  result = measureLayout(geometry)
  expect(result.counts.labelMarkerOverlaps).toBe(0)
})

let browser: Browser, context: BrowserContext
beforeAll(async () => {
  browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1600, height: 1200 } })
  await context.route('**/*', route => route.abort())
})
afterAll(async () => { await context?.close(); await browser?.close() })
const input = {
  id: 'independent-clearance-control', family: 'flowchart', source: 'flowchart LR\nA[Alpha] -->|Yes| B[Beta]', sourceGaps: [],
  expected: { labels: ['Alpha', 'Beta', 'Yes'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true, label: 'Yes' }] },
} as unknown as DrawingCase
const markerSvg = readFileSync(new URL('./fixtures/layout/marker-label.svg', import.meta.url), 'utf8')
const groupSvg = readFileSync(new URL('./fixtures/layout/group-clearance.svg', import.meta.url), 'utf8')
async function observe(svg: string, testCase = input) {
  const page = await context.newPage()
  try { await page.setContent('<style>body{margin:0}</style>' + svg); return await observeSvgLayout(page, testCase) }
  finally { await page.close() }
}
test('browser measures an actual filled marker and detects its own caption collision', async () => {
  const result = await observe(markerSvg)
  expect(result.reasons).toEqual([])
  expect(result.coverage.markers).toMatchObject({ expected: 1, observed: 1 })
  expect(result.metrics.labelMarkerOverlaps.value).toBe(1)
  const clean = await observe(markerSvg.replace('x="258" y="104"', 'x="160" y="104"'))
  expect(clean.metrics.labelMarkerOverlaps.value).toBe(0)
  expect(clean.metrics.edgeLabelIntersections.value).toBe(0)
  const transformed = await observe(markerSvg.replace('width="400" height="200" viewBox="0 0 400 200"', 'width="800" height="400" viewBox="0 0 800 400"').replace('</defs>', '</defs><g transform="translate(20 10) scale(2)">').replace('</svg>', '</g></svg>'))
  expect(transformed.metrics.labelMarkerOverlaps.value).toBe(1)
  const raw = result.geometry.markers![0]!.boundary, scaled = transformed.geometry.markers![0]!.boundary
  expect(Math.max(...scaled.map(p => p.x))).toBeCloseTo(20 + Math.max(...raw.map(p => p.x)) * 2, 1)
  // A viewBox with an equivalent scale must yield the same physical contour.
  const view = await observe(markerSvg.replace('markerWidth="10" markerHeight="10"', 'markerWidth="10" markerHeight="10" viewBox="0 0 10 10"'))
  expect(view.metrics.labelMarkerOverlaps.value).toBe(1)
  const twoHeads = await observe(markerSvg.replace('orient="auto"', 'orient="auto-start-reverse"').replace('marker-end="url(#head)"', 'marker-start="url(#head)" marker-end="url(#head)"'), { ...input, expected: { ...input.expected, edges: [{ ...input.expected.edges![0]!, startMarker: 'arrow' }] } })
  expect(twoHeads.coverage.markers.observed).toBe(2)
  expect(twoHeads.coverage.markers.reasons).toEqual([])
  const start = twoHeads.geometry.markers!.find(marker => marker.terminal === 'start')!
  expect(Math.min(...start.boundary.map(p => p.x))).toBeCloseTo(60, 0)
  expect(Math.max(...start.boundary.map(p => p.x))).toBeCloseTo(70, 0)
})
test('unsupported marker bodies leave marker clearance unassessed without losing route observations', async () => {
  const result = await observe(markerSvg.replace('fill="black" stroke="none"', 'fill="none" stroke="black"'))
  expect(result.metrics.labelMarkerOverlaps.value).toBeNull()
  expect(result.coverage.markers.reasons.length).toBeGreaterThan(0)
  expect(result.metrics.crossings.value).toBe(0)
  const selfCrossing = await observe(markerSvg.replace('points="0,0 10,5 0,10"', 'points="0,0 10,10 0,10 10,0"'))
  expect(selfCrossing.metrics.labelMarkerOverlaps.value).toBeNull()
  expect(selfCrossing.coverage.markers.reasons.some(reason => reason.includes('Self-intersecting'))).toBe(true)
})
test('browser binds a source-owned group and detects caption/frame collisions without rejecting containment', async () => {
  const grouped = { ...input, source: 'flowchart LR\nsubgraph G[Zone]\nA[Alpha]\nend\nA ---|Yes| B[Beta]', expected: { ...input.expected, labels: ['Alpha', 'Beta', 'Yes', 'Zone'], groups: [{ id: 'G', label: 'Zone', members: ['A'] }], edges: [{ source: 'A', target: 'B', directed: false, label: 'Yes' }] } }
  const result = await observe(groupSvg, grouped)
  expect(result.reasons).toEqual([])
  expect(result.coverage.groups).toMatchObject({ expected: 1, observed: 1 })
  expect(result.metrics.labelGroupBorderIntersections.value).toBe(1)
  expect(result.metrics.nodeGroupBorderIntersections.value).toBe(0)
  const clean = await observe(groupSvg.replace('x="132" y="124"', 'x="180" y="124"'), grouped)
  expect(clean.metrics.labelGroupBorderIntersections.value).toBe(0)
  expect(clean.metrics.edgeGroupTitleIntersections.value).toBe(0)
  const titleHit = await observe(groupSvg.replace('M100 120 H280', 'M100 120 H160 V32 H50 V70 H240 V120 H280'), grouped)
  expect(titleHit.metrics.edgeGroupTitleIntersections.value).toBe(1)
  const unsupported = await observe(groupSvg.replace('<rect x="20" y="20" width="120" height="180"', '<rect clip-path="inset(0)" x="20" y="20" width="120" height="180"'), grouped)
  expect(unsupported.metrics.edgeGroupTitleIntersections.value).toBeNull()
  expect(unsupported.metrics.labelGroupBorderIntersections.value).toBeNull()
  expect(unsupported.metrics.crossings.value).toBe(0)
  const nodeCut = await observe(groupSvg.replace('x="40" y="100"', 'x="10" y="100"').replace('x="50" y="125"', 'x="20" y="125"').replace('M100 120 H280', 'M70 120 H280'), grouped)
  expect(nodeCut.metrics.nodeGroupBorderIntersections.value).toBe(1)
})
