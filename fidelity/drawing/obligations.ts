/** Source obligations beyond labels, judged from actual retained drawings by
 * the existing structure, layout and regression-geometry observers. This module
 * only names which reviewed source facts apply to a case and projects observer
 * checks onto them; it observes nothing itself and invokes no renderer. */
import type { DrawingCase } from './corpus.ts'
import type { StructureAssessment } from './structure.ts'
import type { LayoutObservation } from './layout-svg.ts'

export const obligationProfile = 'drawing-source-obligations-v1'
export const obligationCategories = ['relationships', 'geometry', 'layout'] as const
export type ObligationCategory = typeof obligationCategories[number]
export type ObligationStatus = 'passed' | 'failed' | 'unassessed'
export type ObligationFormat = 'svg' | 'terminal'
export interface ObligationCheck { criterion: string; status: ObligationStatus; detail?: string }
export interface SourceObligation { category: ObligationCategory; name: string; fact: string }
export interface ObligationResult { name: string; status: ObligationStatus; detail: string; criteria: string[] }
export interface CategoryResult { status: ObligationStatus | 'not-applicable'; obligations: ObligationResult[] }
export interface ObligationAssessment { noDrawing: boolean; categories: Record<ObligationCategory, CategoryResult> }
/** Observer evidence for one retained drawing. Every field is optional: a
 * missing observation leaves the dependent obligation unassessed. */
export interface ObligationEvidence {
  producerStatus: string
  structure?: StructureAssessment
  layout?: LayoutObservation | null
  regression?: ObligationCheck[]
  quantitative?: ObligationCheck[]
}

/** Source facts that require a drawn relationship between two source objects. */
const relationshipFacts = ['relationships', 'class-relations', 'entity-relations', 'transitions', 'ordered-messages', 'port-routes', 'zenuml-calls', 'git-operations', 'mindmap-hierarchy']
/** Source facts whose correct drawing depends on measured containment. */
const containmentFacts = ['groups', 'state-enclosures', 'kanban-hierarchy', 'treemap-hierarchy']
/** Source values a chart must encode as measured position or extent. */
const encodedFacts: Record<string, { name: string; svg: string }> = {
  'quadrant-chart': { name: 'quadrant-points', svg: 'painted-quadrant-coordinates' },
  'slice-values': { name: 'slice-weights', svg: 'painted-slice-weights' },
  'xy-series': { name: 'series-values', svg: 'painted-series-values' },
  'packet-fields': { name: 'bit-field-spans', svg: 'painted-bit-field-spans' },
  'gantt-tasks': { name: 'task-durations', svg: 'painted-duration-ratios' },
  'journey-tasks': { name: 'score-order', svg: 'painted-score-order' },
}
/** Explicit source placement constraints. Direction hints are not orders. */
const layoutFacts: Record<string, string> = { 'layout-order': 'source-order', 'block-layout': 'grid-placement' }
/** Regression geometry declared on a reviewed regression source. */
const regressionGeometry = ['distinct-node-bodies', 'edge-node-clearance', 'orthogonal-node-approach']

/** Quantitative chart observers admitted for this profile. Each needs passing
 * positive and negative independent controls in obligation qualification. */
export const admittedQuantitativeCriteria = ['painted-quadrant-coordinates', 'painted-slice-weights']

const nonEmpty = (value: unknown) => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && (typeof value !== 'object' || Object.keys(value).length > 0)

/** Applicable obligations come only from the reviewed source contract and the
 * regression geometry list, identically for every format and project. */
export function sourceObligations(test: Pick<DrawingCase, 'family' | 'expected' | 'geometry' | 'terminal'>): SourceObligation[] {
  const facts = (test.terminal.expected.contract?.facts ?? []).filter(f => f.required !== false)
  const present = (criterion: string) => facts.some(f => f.criterion === criterion && nonEmpty(f.expected))
  const result: SourceObligation[] = []
  const relations = relationshipFacts.filter(present)
  for (const fact of relations) result.push({ category: 'relationships', name: fact, fact })
  if (!relations.length && test.expected.edges?.length) result.push({ category: 'relationships', name: 'relationships', fact: 'expected.edges' })
  const containment = containmentFacts.filter(present)
  if (containment.length || test.expected.groups?.length) result.push({ category: 'geometry', name: 'containment', fact: containment[0] ?? 'expected.groups' })
  for (const [fact, encoded] of Object.entries(encodedFacts)) if (present(fact)) result.push({ category: 'geometry', name: encoded.name, fact })
  for (const criterion of regressionGeometry) if (test.geometry.includes(criterion)) result.push({ category: 'geometry', name: criterion, fact: 'geometry' })
  for (const criterion of test.geometry) if (!regressionGeometry.includes(criterion)) result.push({ category: 'geometry', name: criterion, fact: 'geometry' })
  for (const [fact, name] of Object.entries(layoutFacts)) if (present(fact)) result.push({ category: 'layout', name, fact })
  return result
}

const svgRelationshipCriteria = ['painted-relationships', 'painted-route-visibility', 'painted-relationship-markers', 'painted-relationship-label-counts', 'painted-relationship-label-ownership']
const svgPrerequisites = ['painted-node-ownership', 'painted-node-visibility', 'paint-opacity-and-color']
const terminalPrerequisites = ['nodes', 'class-bodies', 'entity-bodies', 'states', 'participants']
/** Which observer criteria decide an obligation in each format. Empty means no
 * qualified observer: the obligation remains explicitly unassessed. */
export function obligationCriteria(obligation: SourceObligation, format: ObligationFormat, available: readonly string[]): { criteria: string[]; prerequisites: string[] } {
  const svg = format === 'svg'
  const has = (criterion: string) => available.includes(criterion)
  const pre = (svg ? svgPrerequisites : terminalPrerequisites).filter(has)
  if (obligation.category === 'relationships') {
    if (svg) return ['relationships', 'class-relations', 'entity-relations', 'transitions', 'ordered-messages', 'expected.edges'].includes(obligation.fact) && has('painted-relationships') ? { criteria: svgRelationshipCriteria.filter(has), prerequisites: pre } : { criteria: [], prerequisites: [] }
    const criterion = obligation.fact === 'expected.edges' ? 'relationships' : obligation.fact
    return has(criterion) ? { criteria: [criterion], prerequisites: pre } : { criteria: [], prerequisites: [] }
  }
  if (obligation.name === 'containment') {
    if (svg) { const groups = available.filter(c => c.startsWith('painted-group:') || c === 'painted-group-membership'); return groups.length ? { criteria: groups, prerequisites: pre } : { criteria: [], prerequisites: [] } }
    const criteria = ['groups', 'state-enclosures'].filter(has)
    return criteria.length ? { criteria, prerequisites: pre } : { criteria: [], prerequisites: [] }
  }
  const encoded = Object.values(encodedFacts).find(e => e.name === obligation.name)
  if (encoded) return svg && admittedQuantitativeCriteria.includes(encoded.svg) && has(encoded.svg) ? { criteria: [encoded.svg], prerequisites: [] } : { criteria: [], prerequisites: [] }
  if (obligation.fact === 'geometry') {
    if (svg && obligation.name === 'distinct-node-bodies') return has('layout:nodeOverlaps') ? { criteria: ['layout:nodeOverlaps'], prerequisites: [] } : { criteria: [], prerequisites: [] }
    if (svg && obligation.name === 'edge-node-clearance') return has('layout:edgeNodeIntersections') ? { criteria: ['layout:edgeNodeIntersections'], prerequisites: [] } : { criteria: [], prerequisites: [] }
    return has('regression:' + obligation.name) ? { criteria: ['regression:' + obligation.name], prerequisites: [] } : { criteria: [], prerequisites: [] }
  }
  if (obligation.name === 'source-order') {
    const criterion = svg ? 'source-required-order' : 'layout-order'
    return has(criterion) ? { criteria: [criterion], prerequisites: [] } : { criteria: [], prerequisites: [] }
  }
  return { criteria: [], prerequisites: [] }
}

/** Flatten every observer's checks under one namespace. Layout metrics become
 * pass/fail only where the layout observer itself assessed the metric. */
export function obligationChecks(evidence: ObligationEvidence): { checks: Map<string, ObligationCheck>; gap?: string } {
  const checks = new Map<string, ObligationCheck>()
  let gap: string | undefined
  for (const axis of ['topology', 'layout'] as const) for (const check of evidence.structure?.[axis].checks ?? []) {
    // A structure axis made unavailable as a whole names the axis itself.
    if (check.criterion === axis) { gap ??= check.detail; continue }
    const prior = checks.get(check.criterion)
    // The same label criterion can appear on both axes; a failure is never hidden.
    if (!prior || check.status === 'failed' || (check.status === 'unassessed' && prior.status === 'passed')) checks.set(check.criterion, { criterion: check.criterion, status: check.status, detail: check.detail })
  }
  const layout = evidence.layout
  if (layout) for (const [metric, value] of Object.entries(layout.metrics)) {
    const assessed = value.status === 'assessed' && value.value !== null
    checks.set('layout:' + metric, { criterion: 'layout:' + metric, status: !assessed ? 'unassessed' : value.value! > 0 ? 'failed' : 'passed', detail: assessed ? metric + ' = ' + value.value : 'Layout observer left ' + metric + ' unassessed: ' + (layout.reasons.join('; ') || 'coverage gap') })
  }
  for (const check of evidence.regression ?? []) checks.set('regression:' + check.criterion, { ...check, criterion: 'regression:' + check.criterion })
  for (const check of evidence.quantitative ?? []) checks.set(check.criterion, check)
  return { checks, gap }
}

const combine = (statuses: ObligationStatus[]): ObligationStatus => statuses.includes('failed') ? 'failed' : statuses.length && statuses.every(s => s === 'passed') ? 'passed' : 'unassessed'

/** Project observer checks onto the case's source obligations. A drawing that
 * was never returned (renderer failure, inadmissible output) is a known nonpass
 * on every applicable obligation; an unrun row stays unassessed. Prerequisite
 * failures (node ownership, for example) cannot establish a relationship
 * failure: only the relationship's own check can. */
export function classifyObligations(test: Pick<DrawingCase, 'family' | 'expected' | 'geometry' | 'terminal'>, format: ObligationFormat, evidence: ObligationEvidence): ObligationAssessment {
  const obligations = sourceObligations(test)
  const noDrawing = ['renderer-failure', 'invalid-format'].includes(evidence.producerStatus)
  const { checks, gap } = obligationChecks(evidence)
  const available = [...checks.keys()]
  const judge = (obligation: SourceObligation): ObligationResult => {
    if (noDrawing) return { name: obligation.name, status: 'failed', detail: 'No admissible drawing: ' + evidence.producerStatus, criteria: [] }
    if (evidence.producerStatus === 'unrun') return { name: obligation.name, status: 'unassessed', detail: 'Renderer was not run', criteria: [] }
    const { criteria, prerequisites } = obligationCriteria(obligation, format, available)
    if (!criteria.length) return { name: obligation.name, status: 'unassessed', detail: gap ?? 'No qualified ' + format + ' observer for ' + obligation.name, criteria }
    const own = criteria.map(c => checks.get(c)!), failed = own.filter(c => c.status === 'failed')
    if (failed.length) return { name: obligation.name, status: 'failed', detail: failed.map(c => c.criterion + ': ' + (c.detail ?? 'failed')).join('; ').slice(0, 400), criteria }
    const blocking = prerequisites.map(c => checks.get(c)!).filter(c => c.status !== 'passed')
    if (blocking.length) return { name: obligation.name, status: 'unassessed', detail: 'Prerequisite not established: ' + blocking.map(c => c.criterion + ' ' + c.status).join(', '), criteria }
    const status = combine(own.map(c => c.status))
    return { name: obligation.name, status, detail: status === 'passed' ? 'Observed: ' + criteria.join(', ') : own.filter(c => c.status !== 'passed').map(c => c.criterion + ': ' + (c.detail ?? 'unassessed')).join('; ').slice(0, 400), criteria }
  }
  const categories = Object.fromEntries(obligationCategories.map(category => {
    const results = obligations.filter(o => o.category === category).map(judge)
    return [category, { status: results.length ? combine(results.map(r => r.status)) : 'not-applicable', obligations: results }]
  })) as Record<ObligationCategory, CategoryResult>
  return { noDrawing, categories }
}

export interface ObligationRow extends ObligationAssessment { project: string; version: string; format: ObligationFormat; caseId: string; producerStatus: string; outputSha256?: string }
export interface CategorySummary { applicable: number; assessed: number; passed: number; failed: number; failedNoDrawing: number; unassessed: number; caseOutcomes: Record<ObligationStatus, string[]> }
export interface ObligationLaneSummary { project: string; version: string; format: ObligationFormat; cases: number; categories: Record<ObligationCategory, CategorySummary> }

/** Per lane, per category: applicable population and passed / failed /
 * unassessed counts. Every lane must account for the same case population. */
export function summarizeObligations(rows: readonly ObligationRow[], caseIds: readonly string[]): ObligationLaneSummary[] {
  const expected = new Set(caseIds), groups = new Map<string, ObligationRow[]>()
  if (expected.size !== caseIds.length) throw Error('Obligation summary needs unique case IDs')
  for (const row of rows) {
    const key = JSON.stringify([row.project, row.format])
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return [...groups.values()].map(group => {
    const first = group[0]!, seen = new Set<string>()
    if (group.some(row => row.version !== first.version)) throw Error('Mixed versions in obligation lane ' + first.project + ' ' + first.format)
    const empty = (): CategorySummary => ({ applicable: 0, assessed: 0, passed: 0, failed: 0, failedNoDrawing: 0, unassessed: 0, caseOutcomes: { passed: [], failed: [], unassessed: [] } })
    const categories: Record<ObligationCategory, CategorySummary> = { relationships: empty(), geometry: empty(), layout: empty() }
    for (const row of group) {
      if (!expected.has(row.caseId) || seen.has(row.caseId)) throw Error('Unknown or duplicate obligation case: ' + row.caseId)
      seen.add(row.caseId)
      for (const category of obligationCategories) {
        const result = row.categories[category], summary = categories[category]
        if (result.status === 'not-applicable') continue
        summary.applicable++
        summary[result.status]++
        summary.caseOutcomes[result.status].push(row.caseId)
        if (result.status !== 'unassessed') summary.assessed++
        if (result.status === 'failed' && row.noDrawing) summary.failedNoDrawing++
      }
    }
    if (seen.size !== expected.size) throw Error(first.project + ' ' + first.format + ' obligations do not account for every case')
    return { project: first.project, version: first.version, format: first.format, cases: seen.size, categories }
  }).sort((a, b) => a.format.localeCompare(b.format) || a.project.localeCompare(b.project))
}
