import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { chromiumExecutable } from './helpers/environment.ts'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { classifyObligations, sourceObligations, summarizeObligations, type ObligationRow } from '../fidelity/drawing/obligations.ts'
import { observeLayoutInContext, observeSvgObligations, observeTerminalObligations } from '../fidelity/drawing/obligation-observe.ts'
import { obligationControlCase, obligationControlSvg, obligationControlTerminal, pieObligationCase, pieObligationSvg, qualifyObligationObservers } from '../fidelity/drawing/obligation-controls.ts'
import { assessTextDrawing } from '../fidelity/drawing/terminal.ts'
import type { StructureAssessment } from '../fidelity/drawing/structure.ts'

const check = (criterion: string, status: 'passed' | 'failed' | 'unassessed') => ({ criterion, status, detail: criterion + ' ' + status })
const structure = (topology: ReturnType<typeof check>[], layout: ReturnType<typeof check>[] = []): StructureAssessment => ({ topology: { status: 'passed', checks: topology }, layout: { status: 'passed', checks: layout } })
const graph = (status: 'passed' | 'failed' | 'unassessed', prerequisite: 'passed' | 'failed' | 'unassessed' = 'passed') => structure(
  [check('painted-node-ownership', prerequisite), check('painted-node-visibility', 'passed'), check('painted-relationships', status), check('painted-route-visibility', 'passed')],
  [check('source-required-order', status)])

test('applicable obligations come from the reviewed source contract and are the same for every format', () => {
  const cases = drawingCases(), count = (category: string) => cases.filter(c => sourceObligations(c).some(o => o.category === category)).length
  expect(count('relationships')).toBe(98)
  expect(count('geometry')).toBe(28)
  expect(count('layout')).toBe(34)
  const regression = cases.find(c => c.geometry.includes('orthogonal-node-approach'))!
  expect(sourceObligations(regression).filter(o => o.category === 'geometry').map(o => o.name)).toEqual(expect.arrayContaining(['edge-node-clearance', 'orthogonal-node-approach']))
  // A label-only case has no obligation beyond labels.
  const single = cases.find(c => c.id === 'drawing:03019928d457c65c')!
  expect(sourceObligations(single)).toEqual([])
  expect(classifyObligations(single, 'svg', { producerStatus: 'correct' }).categories.relationships.status).toBe('not-applicable')
})

test('classification projects observer checks without inventing passes or failures', () => {
  const svg = (evidence: Parameters<typeof classifyObligations>[2]) => classifyObligations(obligationControlCase, 'svg', evidence)
  const layoutFact = { ...obligationControlCase, terminal: { expected: { ...obligationControlCase.terminal.expected, contract: { ...obligationControlCase.terminal.expected.contract!, facts: [...obligationControlCase.terminal.expected.contract!.facts, { criterion: 'layout-order', expected: [{ before: 'Alpha', after: 'Gamma', axis: 'x' }] }] } } } } as typeof obligationControlCase
  expect(svg({ producerStatus: 'correct', structure: graph('passed') }).categories.relationships.status).toBe('passed')
  expect(svg({ producerStatus: 'correct', structure: graph('failed') }).categories.relationships.status).toBe('failed')
  expect(svg({ producerStatus: 'correct', structure: graph('unassessed') }).categories.relationships.status).toBe('unassessed')
  // A failed prerequisite (node ownership) cannot establish a relationship failure.
  expect(svg({ producerStatus: 'correct', structure: graph('passed', 'failed') }).categories.relationships.status).toBe('unassessed')
  expect(classifyObligations(layoutFact, 'svg', { producerStatus: 'correct', structure: graph('passed') }).categories.layout.status).toBe('passed')
  expect(classifyObligations(layoutFact, 'svg', { producerStatus: 'correct', structure: graph('failed') }).categories.layout.status).toBe('failed')
  // Geometry: the layout observer decides node overlap and edge/node clearance only when it assessed them.
  const metrics = (nodeOverlaps: number | null, edgeNodeIntersections: number | null) => ({ status: 'assessed', reasons: [], metrics: { nodeOverlaps: { status: nodeOverlaps === null ? 'unassessed' : 'assessed', value: nodeOverlaps, observed: 0 }, edgeNodeIntersections: { status: edgeNodeIntersections === null ? 'unassessed' : 'assessed', value: edgeNodeIntersections, observed: 0 } } }) as any
  const geometry = (layout: any, orthogonal: 'passed' | 'failed' | 'unassessed') => Object.fromEntries(svg({ producerStatus: 'correct', structure: graph('passed'), layout, regression: [check('orthogonal-node-approach', orthogonal)] }).categories.geometry.obligations.map(o => [o.name, o.status]))
  expect(geometry(metrics(0, 0), 'passed')).toEqual({ 'distinct-node-bodies': 'passed', 'edge-node-clearance': 'passed', 'orthogonal-node-approach': 'passed' })
  expect(geometry(metrics(1, 2), 'failed')).toEqual({ 'distinct-node-bodies': 'failed', 'edge-node-clearance': 'failed', 'orthogonal-node-approach': 'failed' })
  expect(geometry(metrics(null, null), 'unassessed')).toEqual({ 'distinct-node-bodies': 'unassessed', 'edge-node-clearance': 'unassessed', 'orthogonal-node-approach': 'unassessed' })
  expect(geometry(null, 'passed')['distinct-node-bodies']).toBe('unassessed')
  // No drawing is a known nonpass; an unrun renderer stays unassessed.
  const missing = svg({ producerStatus: 'renderer-failure' })
  expect(missing.noDrawing).toBe(true)
  expect(missing.categories.geometry.status).toBe('failed')
  expect(svg({ producerStatus: 'unrun' }).categories.relationships.status).toBe('unassessed')
  // Without a qualified observer (an unprofiled family) every obligation stays unassessed.
  const unavailable: StructureAssessment = { topology: { status: 'unassessed', checks: [check('topology', 'unassessed')] }, layout: { status: 'unassessed', checks: [check('layout', 'unassessed')] } }
  expect(svg({ producerStatus: 'correct', structure: unavailable }).categories.relationships).toMatchObject({ status: 'unassessed', obligations: [{ detail: 'topology unassessed' }] })
  // Terminal relationships use the terminal contract's own relationship fact.
  const terminal = (status: 'passed' | 'failed') => classifyObligations(obligationControlCase, 'terminal', { producerStatus: 'correct', structure: structure([check('nodes', 'passed'), check('relationships', status)]) }).categories.relationships.status
  expect(terminal('passed')).toBe('passed')
  expect(terminal('failed')).toBe('failed')
})

test('obligation summaries count applicable cases per lane and require the full case population', () => {
  const row = (project: string, caseId: string, status: 'passed' | 'failed' | 'unassessed', producerStatus = 'correct'): ObligationRow => ({ project, version: '1', format: 'svg', caseId, producerStatus, noDrawing: producerStatus === 'renderer-failure', categories: { relationships: { status, obligations: [] }, geometry: { status: 'not-applicable', obligations: [] }, layout: { status: 'not-applicable', obligations: [] } } })
  const [summary] = summarizeObligations([row('p', 'a', 'passed'), row('p', 'b', 'failed', 'renderer-failure'), row('p', 'c', 'unassessed')], ['a', 'b', 'c'])
  expect(summary!.categories.relationships).toMatchObject({ applicable: 3, assessed: 2, passed: 1, failed: 1, failedNoDrawing: 1, unassessed: 1, caseOutcomes: { passed: ['a'], failed: ['b'], unassessed: ['c'] } })
  expect(summary!.categories.geometry.applicable).toBe(0)
  expect(() => summarizeObligations([row('p', 'a', 'passed')], ['a', 'b'])).toThrow('do not account for every case')
  expect(() => summarizeObligations([row('p', 'a', 'passed'), row('p', 'a', 'passed')], ['a'])).toThrow('duplicate')
})

test('terminal regression geometry keeps the full drawing verdict and exposes per-criterion results', () => {
  const checks = observeTerminalObligations(obligationControlCase, obligationControlTerminal).regression!
  expect(Object.fromEntries(checks.map(c => [c.criterion, c.status]))).toEqual({ 'distinct-node-bodies': 'passed', 'edge-node-clearance': 'passed', 'orthogonal-node-approach': 'passed' })
  expect(observeTerminalObligations(obligationControlCase, 'Alpha Beta Gamma').regression!.every(c => c.status === 'unassessed')).toBe(true)
  const base = drawingCases().find(c => c.id.startsWith('regression:0be487'))!
  expect(assessTextDrawing({ ...base, geometry: ['unimplemented-fact'] } as any, '┌───────┐    ┌──────┐\n│ Alpha ├───▶│ Beta │\n└───────┘    └──────┘').status).not.toBe('correct')
})

test('production obligation qualification and SVG controls separate clear, obstructed, steep, overlapping and mis-weighted drawings', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  const context = await browser.newContext({ javaScriptEnabled: false }), layout = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 })
  try {
    const controls = await qualifyObligationObservers(context, layout)
    expect(controls.find(c => c.name === 'route-through-unrelated-node')?.obligations['edge-node-clearance']).toBe('failed')
    expect(controls.find(c => c.name === 'pie-weights-swapped')?.obligations['slice-weights']).toBe('failed')
    expect(controls.find(c => c.name === 'quadrant-point-moved')?.obligations['quadrant-points']).toBe('failed')
    const observe = async (svg: string, test = obligationControlCase) => {
      const page = await context.newPage()
      try {
        await page.setContent('<!doctype html><style>body{margin:0}</style>' + svg)
        const result = classifyObligations(test, 'svg', { producerStatus: 'correct', ...await observeSvgObligations(test, page, () => observeLayoutInContext(layout, test, svg)) })
        return Object.fromEntries(Object.values(result.categories).flatMap(c => c.obligations).map(o => [o.name, o.status]))
      } finally { await page.close() }
    }
    expect(await observe(obligationControlSvg('clear'))).toMatchObject({ relationships: 'passed', 'distinct-node-bodies': 'passed', 'edge-node-clearance': 'passed', 'orthogonal-node-approach': 'passed' })
    expect((await observe(obligationControlSvg('through')))['edge-node-clearance']).toBe('failed')
    expect((await observe(obligationControlSvg('diagonal')))['orthogonal-node-approach']).toBe('failed')
    expect((await observe(obligationControlSvg('overlap')))['distinct-node-bodies']).toBe('failed')
    expect((await observe(pieObligationSvg(), pieObligationCase))['slice-weights']).toBe('passed')
    expect((await observe(pieObligationSvg(true), pieObligationCase))['slice-weights']).toBe('failed')
  } finally { await context.close(); await layout.close(); await browser.close() }
}, 30_000)
