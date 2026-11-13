import { inspectSvgGraph, inspectSvgDrawing } from '../inspect-svg.ts'
import { inspectTerminalFacts } from '../terminal-facts.ts'
import { plannedGraphFamilyCriteria } from '../paint-graph-families.ts'
import { inspectQuadrantClearance } from './quadrant-layout.ts'
import type { PaintEvidence } from '../paint.ts'
import type { DrawingCase } from './corpus.ts'

export const structureProfile = 'drawing-structure-v2'
export const structureGraphFamilies = ['flowchart', 'class', 'state', 'er', 'sequence']
export type StructureStatus = 'passed' | 'failed' | 'unassessed' | 'not-applicable'
export interface StructureCheck { criterion: string; status: Exclude<StructureStatus, 'not-applicable'>; detail: string; actual?: unknown }
export interface StructureAxis { status: StructureStatus; checks: StructureCheck[] }
export interface StructureAssessment { topology: StructureAxis; layout: StructureAxis }
const unknown = (criterion: string, detail: string): StructureAxis => ({ status: 'unassessed', checks: [{ criterion, status: 'unassessed', detail }] })
const axis = (checks: StructureCheck[]): StructureAxis => ({ status: checks.some(c => c.status === 'failed') ? 'failed' : !checks.length || checks.some(c => c.status === 'unassessed') ? 'unassessed' : 'passed', checks })
const notApplicable = (): StructureAxis => ({ status: 'not-applicable', checks: [] })
export function structureObligations(test: DrawingCase) {
  const nonGraph = ['pie', 'quadrant', 'radar', 'gantt', 'timeline', 'xychart', 'journey', 'treemap'].includes(test.family)
  return { topology: !nonGraph || !!test.expected.edges?.length, layout: !!test.expected.labels?.length || !!test.expected.nodes?.length || !!Object.keys(test.expected.facts ?? {}).length }
}
export function unavailableStructure(test: DrawingCase, reason: string, failed = false): StructureAssessment {
  const applicable = structureObligations(test)
  const make = (name: 'topology' | 'layout'): StructureAxis => !applicable[name] ? notApplicable() : { status: failed ? 'failed' : 'unassessed', checks: [{ criterion: name, status: failed ? 'failed' : 'unassessed', detail: reason }] }
  return { topology: make('topology'), layout: make('layout') }
}

/** Source order is normative only where the reviewed contract explicitly requires
 * it. Cyclic or contradictory orders cannot supply a layout verdict. */
function acyclic(orders: readonly { before: string; after: string }[]) {
  const edges = new Map<string, string[]>()
  for (const o of orders) { const next = edges.get(o.before); if (next) next.push(o.after); else edges.set(o.before, [o.after]) }
  const done = new Set<string>(), visiting = new Set<string>()
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false
    if (done.has(id)) return true
    visiting.add(id)
    for (const next of edges.get(id) ?? []) if (!visit(next)) return false
    visiting.delete(id); done.add(id); return true
  }
  return [...edges.keys()].every(visit)
}

/** Geometry diagnostics over qualified, actually measured visible owners. These
 * are explicit box constraints, not a claim that one layout is prettier. */
export function inspectGraphLayout(test: DrawingCase, paint: PaintEvidence): StructureCheck[] {
  const checks: StructureCheck[] = []
  const observed = new Map(paint.checks.map(c => [c.criterion, c]))
  for (const criterion of ['visible-authored-labels', 'labels-within-canvas', 'unclipped-authored-labels']) {
    const c = observed.get(criterion)
    checks.push({ criterion, status: c?.status === 'passed' ? 'passed' : c?.status === 'failed' ? 'failed' : 'unassessed', detail: c?.scope ?? 'No qualified visible label bounds' })
  }
  type Box = { x: number; y: number; width: number; height: number }
  const nodes = paint.nodes as { id: string; box: Box }[]
  const qualified = observed.get('painted-node-ownership')?.status === 'passed'
  const boxes = new Map(nodes.map(n => [n.id, n.box]))
  const containers = new Set((test.expected.groups ?? []).map(g => g.id))
  const leaves = (test.expected.nodes ?? []).filter(n => !containers.has(n.id))
  const overlaps: [string, string][] = [], measurable = qualified && leaves.every(n => boxes.has(n.id))
  if (measurable) {
    for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
      const a = boxes.get(leaves[i]!.id)!, b = boxes.get(leaves[j]!.id)!
      if (Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1) overlaps.push([leaves[i]!.id, leaves[j]!.id])
    }
  }
  checks.push({ criterion: 'leaf-node-box-overlap', status: !measurable ? 'unassessed' : overlaps.length ? 'failed' : 'passed', detail: 'Distinct source-owned leaf node boxes must not overlap by more than one CSS pixel on both axes; declared containers are excluded', actual: overlaps })
  const facts = test.terminal.expected.contract?.facts ?? []
  const requiredOrder = facts.some(f => f.criterion === 'layout-order' && f.required !== false)
  const orders = test.terminal.expected.graph?.layout ?? []
  if (requiredOrder) {
    const available = qualified && orders.length > 0 && acyclic(orders) && orders.every(o => boxes.has(o.before) && boxes.has(o.after))
    const measurements = available ? orders.map(o => { const a = boxes.get(o.before)!, b = boxes.get(o.after)!; return { ...o, beforeCoordinate: o.axis === 'x' ? a.x + a.width / 2 : a.y + a.height / 2, afterCoordinate: o.axis === 'x' ? b.x + b.width / 2 : b.y + b.height / 2 } }) : []
    checks.push({ criterion: 'source-required-order', status: !available ? 'unassessed' : measurements.every(o => o.beforeCoordinate < o.afterCoordinate) ? 'passed' : 'failed', detail: 'Only explicitly required, acyclic source orders are compared with measured node centers; global direction hints do not impose an order on cyclic graphs', actual: measurements })
  }
  return checks
}

export async function assessSvgStructure(test: DrawingCase, page: any): Promise<StructureAssessment> {
  if (test.sourceGaps.length) return unavailableStructure(test, test.sourceGaps.join('; '))
  if (test.family === 'quadrant') {
    const paint = await inspectSvgDrawing(page, { family: test.family, source: test.source, expected: test.expected })
    const checks = ['visible-authored-labels', 'labels-within-canvas', 'unclipped-authored-labels', 'painted-quadrant-coordinates'].map(criterion => {
      const c = paint.checks.find(c => c.criterion === criterion)
      return { criterion, status: c?.status === 'passed' ? 'passed' as const : c?.status === 'failed' ? 'failed' as const : 'unassessed' as const, detail: c?.scope ?? 'No qualified quadrant observation' }
    })
    // A marker overlapping text can make the separate glyph-occlusion proof
    // unavailable. That cannot erase an independently observed box collision.
    if (['visible-authored-labels', 'painted-quadrant-coordinates'].every(criterion => checks.find(c => c.criterion === criterion)?.status === 'passed')) checks.push(...await page.evaluate(inspectQuadrantClearance, test.expected))
    else checks.push({ criterion: 'quadrant-box-clearance', status: 'unassessed', detail: 'Visible labels and actual point inventory/coordinates must qualify before clearance can be assessed' })
    return { topology: notApplicable(), layout: axis(checks) }
  }
  if (!structureGraphFamilies.includes(test.family)) return unavailableStructure(test, 'No qualified structural profile for ' + test.family)
  if (test.expected.nodes?.some(n => /[\u0000-\u001f]/.test(n.label))) return unavailableStructure(test, 'Control-bearing label-to-node identity needs a structural projection')
  const owners = new Map<string, string>()
  for (const group of test.expected.groups ?? []) for (const member of group.members) {
    // Older independent SVG contracts can retain both lexical mentions of a
    // global node, while the terminal contract explicitly assigns first use.
    // Do not turn conflicting source ownership into a renderer failure.
    if (owners.has(member) && owners.get(member) !== group.id) return unavailableStructure(test, 'Source group ownership needs review: ' + member + ' occurs in multiple direct membership lists')
    owners.set(member, group.id)
  }
  const applies = structureObligations(test)
  const paint = await inspectSvgGraph(page, { family: test.family, source: test.source, expected: test.expected })
  const required = [...new Set(['visible-authored-labels', 'paint-opacity-and-color', 'painted-node-ownership', 'painted-node-visibility', 'painted-relationships', 'painted-route-visibility',
    ...(test.expected.edges?.some(e => e.startMarker !== undefined || e.endMarker !== undefined) ? ['painted-relationship-markers'] : []),
    ...(test.expected.edges?.some(e => e.label) ? ['painted-relationship-label-counts', 'painted-relationship-label-ownership'] : []),
    ...(test.expected.groups ?? []).map(g => 'painted-group:' + g.id),
    ...(test.family === 'flowchart' ? [] : plannedGraphFamilyCriteria({ family: test.family, expected: test.expected })),
  ])]
  const topology = required.map(criterion => {
    const c = paint.checks.find(c => c.criterion === criterion)
    return { criterion, status: c?.status === 'passed' ? 'passed' as const : c?.status === 'failed' ? 'failed' as const : 'unassessed' as const, detail: c?.scope ?? 'No qualified observation for this obligation', actual: c?.actual }
  })
  return { topology: applies.topology ? axis(topology) : notApplicable(), layout: applies.layout ? axis(inspectGraphLayout(test, paint)) : notApplicable() }
}

export function assessTerminalStructure(test: DrawingCase, output: string): StructureAssessment {
  if (test.sourceGaps.length) return unavailableStructure(test, test.sourceGaps.join('; '))
  if (!structureGraphFamilies.includes(test.family)) return unavailableStructure(test, 'No qualified structural profile for ' + test.family)
  const applies = structureObligations(test), contract = test.terminal.expected.contract, graph = test.terminal.expected.graph
  if (!contract || test.family === 'flowchart' && !graph) return unavailableStructure(test, 'No independent terminal source contract')
  if (test.family === 'state') {
    const states = contract.facts.find(f => f.criterion === 'states')?.expected as { id: string; scope: string[] }[] | undefined
    const scopes = new Map<string, string>()
    for (const state of states ?? []) {
      const scope = JSON.stringify(state.scope)
      if (scopes.has(state.id) && scopes.get(state.id) !== scope) return unavailableStructure(test, 'Source state ownership needs review: identifier ' + state.id + ' is referenced in multiple lexical scopes')
      scopes.set(state.id, scope)
    }
  }
  const facts = inspectTerminalFacts(output, contract, graph)
  const required = test.family === 'flowchart' ? ['nodes', 'relationships', ...(graph?.groups?.length ? ['groups'] : []), ...(contract.facts.some(f => f.criterion === 'literal-control-safety') ? ['literal-control-safety'] : [])] : contract.facts.filter(f => f.required !== false).map(f => f.criterion)
  const project = (criterion: string): StructureCheck => {
    const c = facts.find(c => c.criterion === criterion)
    return { criterion, status: c?.status === 'passed' ? 'passed' : c?.status === 'failed' ? 'failed' : 'unassessed', detail: c?.detail ?? 'No qualified observation for this obligation', actual: c?.actual }
  }
  const layout = contract.facts.some(f => f.criterion === 'layout-order' && f.required !== false)
    ? axis([project('layout-order')]) : unknown('layout-order', 'No explicit source order; terminal box overlap is not yet measured independently')
  return { topology: applies.topology ? axis(required.map(project)) : notApplicable(), layout: applies.layout ? layout : notApplicable() }
}
