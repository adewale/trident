import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium, type Browser, type BrowserContext } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { measureLayout, type LayoutGeometry, type Point } from '../fidelity/drawing/layout-geometry.ts'
import { observeSvgLayout } from '../fidelity/drawing/layout-svg.ts'
import { retainDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { observeLayoutRun, summarizeLayouts, layoutMarkdown } from '../unified/layout-observe.ts'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { planDigest } from '../unified/campaign-plan.ts'
import type { DrawingCase } from '../fidelity/drawing/corpus.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('layout-observer-')
const rectangle = (x: number, y: number, w = 20, h = 20): Point[] => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y }]
const empty = (): LayoutGeometry => ({ nodes: [], edges: [], labels: [] })
const edge = (id: string, points: Point[], source = id + '-a', target = id + '-b') => ({ id, points, source, target })

test('crossings count transverse contacts once, including a contact at a sampled vertex', () => {
  const geometry = empty()
  geometry.edges = [edge('a', [{ x: 0, y: 10 }, { x: 10, y: 10 }, { x: 20, y: 10 }]), edge('b', [{ x: 10, y: 0 }, { x: 10, y: 20 }])]
  const result = measureLayout(geometry)
  expect(result.counts.crossings).toBe(1)
  expect(result.findings[0]).toEqual({ metric: 'crossings', objects: ['a', 'b'], point: { x: 10, y: 10 } })
  geometry.edges[1] = edge('b', [{ x: 10, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 20 }])
  expect(measureLayout(geometry).counts.crossings).toBe(1)
})
test('shared endpoints, T junctions, tangencies and collinear routes are not transverse crossings', () => {
  for (const points of [
    [{ x: 0, y: 10 }, { x: 10, y: 0 }],
    [{ x: 10, y: 0 }, { x: 10, y: 10 }],
    [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }],
    [{ x: 5, y: 10 }, { x: 15, y: 10 }],
  ]) {
    const geometry = empty()
    geometry.edges = [edge('a', [{ x: 0, y: 10 }, { x: 20, y: 10 }]), edge('b', points)]
    expect(measureLayout(geometry).counts.crossings).toBe(0)
  }
  const geometry = empty()
  geometry.edges = [edge('a', [{ x: 0, y: 10 }, { x: 20, y: 10 }]), edge('b', [{ x: 5, y: 10 }, { x: 10, y: 10 }, { x: 15, y: 10 }])]
  expect(measureLayout(geometry).counts.sharedPaths).toBe(1)
})
test('crossings at two bends use alternating arms rather than one incoming tangent', () => {
  const geometry = empty()
  geometry.edges = [edge('a', [{ x: -10, y: 10 }, { x: 0, y: 0 }, { x: 10, y: 10 }]), edge('b', [{ x: -10, y: 20 }, { x: 0, y: 0 }, { x: 10, y: 1 }])]
  expect(measureLayout(geometry).counts.crossings).toBe(1)
  geometry.edges[1]!.points.reverse()
  expect(measureLayout(geometry).counts.crossings).toBe(1)
  geometry.edges[1]!.points = [{ x: -10, y: 20 }, { x: 0, y: 0 }, { x: 10, y: 20 }]
  expect(measureLayout(geometry).counts.crossings).toBe(0)
})
test('routes converging onto shared ink do not gain a crossing at their merge point', () => {
  const geometry = empty()
  geometry.edges = [
    edge('a', [{ x: 0, y: -10 }, { x: 10, y: -10 }, { x: 10, y: -1 }, { x: 11, y: 0 }, { x: 20, y: 0 }]),
    edge('b', [{ x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 1 }, { x: 11, y: 0 }, { x: 20, y: 0 }]),
  ]
  expect(measureLayout(geometry).counts.crossings).toBe(0)
  expect(measureLayout(geometry).counts.sharedPaths).toBe(1)
})
test('node contours distinguish overlap, containment, touching, and bounding-box-only overlap', () => {
  const geometry = empty()
  geometry.nodes = [{ id: 'a', boundary: rectangle(0, 0) }, { id: 'b', boundary: rectangle(10, 0) }, { id: 'c', boundary: rectangle(30, 0) }]
  expect(measureLayout(geometry).counts.nodeOverlaps).toBe(1)
  geometry.nodes = [{ id: 'a', boundary: rectangle(0, 0) }, { id: 'b', boundary: rectangle(5, 5, 5, 5) }]
  expect(measureLayout(geometry).counts.nodeOverlaps).toBe(1)
  geometry.nodes[1]!.boundary = rectangle(0, 0)
  expect(measureLayout(geometry).counts.nodeOverlaps).toBe(1)
  geometry.nodes = [{ id: 'diamond', boundary: [{ x: 10, y: 0 }, { x: 20, y: 10 }, { x: 10, y: 20 }, { x: 0, y: 10 }, { x: 10, y: 0 }] }, { id: 'corner', boundary: rectangle(0, 0, 3, 3) }]
  expect(measureLayout(geometry).counts.nodeOverlaps).toBe(0)
})
test('coincident concave contours overlap even when their bounding-box center lies outside', () => {
  const boundary = [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }, { x: 30, y: 40 }, { x: 30, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 40 }, { x: 0, y: 40 }, { x: 0, y: 0 }]
  const geometry = empty()
  geometry.nodes = [{ id: 'a', boundary }, { id: 'b', boundary: [...boundary].reverse() }]
  expect(measureLayout(geometry).counts.nodeOverlaps).toBe(1)
  // Contact on the outside edge still has no common interior.
  geometry.nodes[1]!.boundary = rectangle(40, 0, 10, 40)
  expect(measureLayout(geometry).counts.nodeOverlaps).toBe(0)
  // The empty notch belongs to neither body: bounding boxes alone are no proof.
  geometry.nodes[1]!.boundary = rectangle(10, 10, 20, 30)
  expect(measureLayout(geometry).counts.nodeOverlaps).toBe(0)
})
test('a route through a foreign node or caption is reported with location; owned labels and endpoints are excluded', () => {
  const geometry = empty()
  geometry.nodes = [{ id: 'a', boundary: rectangle(0, 0) }, { id: 'foreign', boundary: rectangle(40, 0) }]
  geometry.edges = [edge('route', [{ x: 10, y: 10 }, { x: 100, y: 10 }], 'a', 'z')]
  geometry.labels = [{ id: 'owned', owner: 'a', box: { x: 5, y: 5, width: 10, height: 10 } }, { id: 'caption', owner: 'route', box: { x: 70, y: 5, width: 15, height: 10 } }, { id: 'other', owner: 'foreign', box: { x: 75, y: 5, width: 15, height: 10 } }]
  const result = measureLayout(geometry)
  expect(result.counts.edgeNodeIntersections).toBe(1)
  expect(result.counts.labelNodeOverlaps).toBe(0)
  expect(result.counts.labelOverlaps).toBe(1)
  expect(result.counts.edgeLabelIntersections).toBe(2) // Own endpoint label is still crossed by the actual route.
  expect(result.findings.some(f => f.metric === 'edgeNodeIntersections' && f.objects.join(',') === 'route,foreign' && f.point.x > 40 && f.point.x < 60)).toBe(true)
})

let browser: Browser, context: BrowserContext
beforeAll(async () => {
  browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1600, height: 1200 }, serviceWorkers: 'block' })
  await context.route('**/*', route => route.abort())
})
afterAll(async () => { await context?.close(); await browser?.close() })
const input = {
  id: 'independent-layout-control', family: 'flowchart', source: 'flowchart LR\nA[Alpha] --- B[Beta]\nC[Gamma] --- D[Delta]', sourceGaps: [],
  expected: { labels: ['Alpha', 'Beta', 'Gamma', 'Delta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }, { id: 'C', label: 'Gamma' }, { id: 'D', label: 'Delta' }], edges: [{ source: 'A', target: 'B', directed: false }, { source: 'C', target: 'D', directed: false }] },
} as unknown as DrawingCase
// Independently drawn fixture, with no renderer classes, source IDs or layout
// model. The two centerlines cross at (160,100), and all captions are disjoint.
const fixture = readFileSync(new URL('./fixtures/layout/crossing.svg', import.meta.url), 'utf8')
const noCrossing = readFileSync(new URL('./fixtures/layout/no-crossing.svg', import.meta.url), 'utf8')
async function observe(svg: string, testCase = input) {
  const page = await context.newPage()
  try { await page.setContent('<style>body{margin:0}</style>' + svg); return await observeSvgLayout(page, testCase) }
  finally { await page.close() }
}
test('browser observer measures an independently authored SVG without renderer-specific selectors', async () => {
  const result = await observe(fixture)
  expect(result.reasons).toEqual([])
  expect(result.status).toBe('assessed')
  expect(result.metrics.crossings.value).toBe(1)
  expect(result.metrics.nodeOverlaps.value).toBe(0)
  expect(result.metrics.edgeNodeIntersections.value).toBe(0)
  expect(result.findings.find(f => f.metric === 'crossings')!.point.x).toBeCloseTo(160, 1)
  const clean = await observe(noCrossing)
  expect(clean.reasons).toEqual([])
  expect(clean.metrics.crossings.value).toBe(0)
  expect(clean.metrics.nodeOverlaps.value).toBe(0)
})
test('browser observes overlapping node bodies independently of an unqualified edge inventory', async () => {
  const overlap = fixture.replace('x="280" y="80"', 'x="40" y="80"').replace('x="290" y="105"', 'x="50" y="105"')
  const result = await observe(overlap)
  expect(result.metrics.nodeOverlaps.value).toBe(1)
  expect(result.metrics.crossings.value).toBeNull()
  expect(result.findings.some(f => f.metric === 'nodeOverlaps')).toBe(true)
})
test('geometry work and browser sampling have explicit limits', async () => {
  const geometry = empty()
  geometry.edges = Array.from({ length: 2050 }, (_, i) => edge(String(i), [{ x: 0, y: i }, { x: 1, y: i }]))
  expect(() => measureLayout(geometry)).toThrow('comparison budget')
  const tooLong = fixture.replace('M60 100 H280', 'M60 100 ' + 'H280 H60 '.repeat(1000) + 'H280')
  const result = await observe(tooLong)
  expect(result.metrics.crossings.value).toBeNull()
  expect(result.reasons.some(reason => reason.includes('sample budget'))).toBe(true)
})
test('curved routes and transformed SVGs are measured in screen coordinates', async () => {
  const curve = fixture.replace('M60 100 H280', 'M60 100 C120 60 220 140 280 100')
  const result = await observe(curve)
  expect(result.reasons).toEqual([])
  expect(result.metrics.crossings.value).toBe(1)
  const transformed = await observe(fixture.replace('width="400" height="240" viewBox="0 0 400 240"', 'width="640" height="400" viewBox="0 0 640 400"').replace('<g>', '<g transform="translate(20 30) scale(1.5)">'))
  expect(transformed.metrics.crossings.value).toBe(1)
  expect(transformed.findings.find(f => f.metric === 'crossings')!.point.x).toBeCloseTo(260, 1)
})
test('a source-preserving drop shadow is admitted; clipping filter regions stay unassessed', async () => {
  const shadow = fixture.replace('<g>', '<defs><filter id="shadow"><feDropShadow dx="1" dy="1" stdDeviation="1"/></filter></defs><g filter="url(#shadow)">')
  expect((await observe(shadow)).metrics.crossings.value).toBe(1)
  const cropped = await observe(shadow.replace('<filter id="shadow">', '<filter id="shadow" x="20%" width="40%">'))
  expect(cropped.metrics.crossings.value).toBeNull()
  const altered = await observe(shadow.replace('<feDropShadow dx="1" dy="1" stdDeviation="1"/>', '<feColorMatrix values="0"/>'))
  expect(altered.metrics.crossings.value).toBeNull()
})
test('missing edges, unfamiliar bodies, clipping and incomplete source contracts cannot earn zero counts', async () => {
  const missing = await observe(fixture.replace('<path d="M160 40 V160"/>', ''))
  expect(missing.metrics.crossings.status).toBe('unassessed')
  expect(missing.metrics.crossings.value).toBeNull()
  expect(missing.coverage.edges.observed).toBeLessThan(missing.coverage.edges.expected)
  const clipped = await observe(fixture.replace('<g>', '<g clip-path="inset(0)">'))
  expect(clipped.status).toBe('unassessed')
  expect(clipped.metrics.crossings.value).toBeNull()
  const unknown = await observe(fixture, { ...input, sourceGaps: ['Unreviewed source'] })
  expect(unknown.status).toBe('unassessed')
  expect(unknown.metrics.nodeOverlaps.value).toBeNull()
  expect((await observe(fixture, { ...input, family: 'sequence' })).status).toBe('unassessed')
})
test('retained replay binds source/output bytes and reports only common assessed cases', async () => {
  const root = temporary.dir(), output = retainDrawingOutput(root, 'fixture-a', input, 'svg', fixture)
  const run = { state: 'complete', corpus: { ids: [input.id], contractSha256: planDigest([{ id: input.id, source: input.source, expected: input.expected, sourceGaps: input.sourceGaps }]) }, outputs: [output], rows: [{ project: 'fixture-a', version: '1', format: 'svg', caseId: input.id, status: 'correct' }, { project: 'fixture-b', version: '2', format: 'svg', caseId: input.id, status: 'renderer-failure' }] }
  const rows = await observeLayoutRun(run, root, context, { cases: [input] })
  expect(rows[0]!.outputSha256).toBe(output.outputSha256)
  expect(rows[0]!.observation.metrics.crossings.value).toBe(1)
  expect(rows[1]!.observation.metrics.crossings.value).toBeNull()
  expect(summarizeLayouts(rows).find(s => s.metric === 'crossings')!.commonCaseIds).toEqual([])
  expect(layoutMarkdown(rows)).toContain('unassessed')
  const only = await observeLayoutRun(run, root, context, { projects: ['fixture-a'], cases: [input] })
  expect(summarizeLayouts(only).find(s => s.metric === 'crossings')!.projects[0]!.count).toBe(1)
  const second = retainDrawingOutput(root, 'fixture-b', input, 'svg', noCrossing)
  const paired = await observeLayoutRun({ ...run, outputs: [output, second], rows: run.rows.map(row => ({ ...row, status: 'correct' })) }, root, context, { cases: [input] })
  const summary = summarizeLayouts(paired).find(s => s.metric === 'crossings')!
  expect(summary.commonCaseIds).toEqual([input.id])
  expect(summary.projects.map(p => p.count)).toEqual([1, 0])
  await expect(observeLayoutRun({ ...run, outputs: [output, output] }, root, context, { cases: [input] })).rejects.toThrow('Duplicate')
  await expect(observeLayoutRun({ ...run, corpus: { ...run.corpus, contractSha256: 'changed' } }, root, context, { cases: [input] })).rejects.toThrow('source contract')
  writeFileSync(join(root, 'outputs', output.outputSha256 + '.gz'), 'tampered')
  await expect(observeLayoutRun(run, root, context, { cases: [input] })).rejects.toThrow()
})
