import type { BenchmarkObservation } from './types.ts'

export const drawingOutcomeColumns = ['Correct', 'Incorrect drawing', 'Invalid format', 'Unsupported', 'Renderer failure', 'Unassessed', 'Unrun', 'Harness failure'] as const
export type DrawingOutcome = typeof drawingOutcomeColumns[number]
export type DrawingOutcomeCounts = Record<DrawingOutcome, number>
export interface DrawingOutcomeEvidence {
  verdict?: string
  formatRejected?: boolean
  unsupported?: boolean
  rendererFailure?: boolean
  harnessFailure?: boolean
  /** false is an explicit retained execution result, not a missing clock. */
  runtimeExecuted?: boolean | null
  returned?: boolean
  recorded?: boolean
}
/** Only reported evidence identifies failure ownership. A generic exception or
 * absent timestamp cannot distinguish a renderer failure from a harness gap. */
export function classifyDrawingOutcome(input: DrawingOutcomeEvidence): DrawingOutcome {
  if (input.verdict === 'correct') {
    if (input.formatRejected || input.unsupported || input.rendererFailure) throw Error('Correct drawing contradicts its retained format/public outcome')
    return 'Correct'
  }
  if (input.formatRejected) return 'Invalid format'
  if (input.unsupported || input.verdict === 'unsupported') return 'Unsupported'
  if (input.rendererFailure) return 'Renderer failure'
  if (input.verdict === 'incorrect') return 'Incorrect drawing'
  if (input.harnessFailure) return 'Harness failure'
  if (!input.returned && (input.runtimeExecuted === false || input.recorded === false)) return 'Unrun'
  return 'Unassessed'
}
export function summarizeDrawingOutcomes(outcomes: readonly DrawingOutcome[]) {
  const counts = Object.fromEntries(drawingOutcomeColumns.map(key => [key, 0])) as DrawingOutcomeCounts
  for (const outcome of outcomes) {
    if (!Object.hasOwn(counts, outcome)) throw Error('Unknown drawing outcome')
    counts[outcome]++
  }
  return { counts, total: outcomes.length, ...drawingOutcomeStatistics(counts, outcomes.length) }
}
export function drawingOutcomeStatistics(counts: DrawingOutcomeCounts, total: number) {
  if (!Number.isSafeInteger(total) || total < 0 || drawingOutcomeColumns.some(key => !Number.isSafeInteger(counts[key]) || counts[key] < 0) || drawingOutcomeColumns.reduce((sum, key) => sum + counts[key], 0) !== total) throw Error('Drawing outcomes do not reconcile to their planned population')
  const assessed = counts.Correct + counts['Incorrect drawing'] + counts['Invalid format']
  const unresolved = counts.Unassessed + counts.Unrun + counts['Harness failure']
  const lower = counts.Correct, upper = lower + unresolved
  const percent = (value: number) => total ? 100 * value / total : null
  return { assessed, resolved: total - unresolved, lower, upper, observerCoverage: percent(assessed), resolutionCoverage: percent(total - unresolved), lowerPercent: percent(lower), upperPercent: percent(upper) }
}
const failed = (checks: readonly any[] | undefined, names: readonly string[]) => checks?.some(check => names.includes(check.criterion ?? check.operation) && check.status === 'failed') ?? false
/** Format-only rejection and the named structural SVG checks are explicit
 * format evidence. An admission that also checks authored labels is not. */
export function invalidDrawingFormat(record: any, observations: readonly BenchmarkObservation[]) {
  return record?.admission?.ok === false && record.admission.scope === 'format-only'
    || failed(record?.checks, ['svg-root', 'svg-unique-ids'])
    || failed(observations, ['svg-root', 'svg-unique-ids'])
}
export function retainedDrawingOutcome(input: { verdict?: string; record?: any; execution?: any; observations: readonly BenchmarkObservation[] }): DrawingOutcome {
  const { record, observations, execution } = input
  const render = observations.filter(row => row.operation === 'render'), publicClassification = record?.publicOutcomeClassification
  const classification = publicClassification?.publicApiEntryProved === true ? publicClassification.category
    : render.find(row => row.metrics?.noImagePublicApiEntryProved === true)?.metrics?.noImageClassification
  const harnessFailure = observations.some(row => ['artifact-admission', 'invocation-admission', 'harness-admission'].includes(row.operation) && ['failed', 'blocked'].includes(row.status))
  const returned = !!(record?.pngSha256 || record?.originalSvgSha256 || record?.svgSha256 || record?.witness || record?.sha256 || execution?.witness) || render.some(row => row.status === 'passed')
  const verdict = input.verdict ?? record?.assessment?.status
  return classifyDrawingOutcome({ verdict, formatRejected: invalidDrawingFormat(record, observations),
    unsupported: classification === 'proven-unsupported-source-input' || render.some(row => row.status === 'unsupported'),
    rendererFailure: classification === 'actual-renderer-failure', harnessFailure,
    runtimeExecuted: typeof execution?.runtimeExecuted === 'boolean' ? execution.runtimeExecuted : typeof record?.runtimeExecuted === 'boolean' ? record.runtimeExecuted : undefined,
    returned, recorded: !!record || !!execution || observations.length > 0 })
}
/** Reporting tables carry counts and bounds in ordinary cells. Missing ratios
 * stay textual when a population is empty; no missing score becomes zero. */
export const drawingStatisticsColumns = ['Observer coverage (%)', 'Correctness lower (%)', 'Correctness upper (%)'] as const
export function drawingOutcomeCells(summary: ReturnType<typeof summarizeDrawingOutcomes>) {
  return [...drawingOutcomeColumns.map(key => summary.counts[key]), summary.total, ...[summary.observerCoverage, summary.lowerPercent, summary.upperPercent].map(value => value === null ? 'unavailable' : Number(value.toFixed(6)))]
}
