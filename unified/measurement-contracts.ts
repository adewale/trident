import { evidenceDigest } from '../portable/evidence-contract.ts'
import type { SnapshotTable } from './results-snapshot.ts'
import type { PublicSuite } from './support.ts'

/** Measurement identity is separate from corpus, artifact and observer identity.
 * Binding a contract describes a question; it never certifies its evidence. */
export const measurementContracts = {
  'invocation-outcomes': {
    question: 'Which planned calls have a causal return, completed error, interruption or missing evidence?',
    unit: 'planned public calls', evidence: 'Matching causal start/terminal frames bound to the source, project and artifact',
    limit: 'A completed error establishes no returned value, not correct syntax rejection or renderer blame. Interrupted calls cannot establish non-return. Missing proof includes unrun work.', ranks: [] as string[],
  },
  'output-production': {
    question: 'Does the public operation return a value in the requested output field?',
    unit: 'planned inputs', evidence: 'Retained output bytes or an explicit completed wrong-type return',
    limit: 'Returning bytes establishes no format validity, drawing correctness or source acceptance. Transport interruptions remain unknown.', ranks: ['Returned output'],
  },
  'output-validity': {
    question: 'Does the actual returned output satisfy the declared mechanical format check?',
    unit: 'planned inputs', evidence: 'Actual bytes and format-only SVG or PNG checks, without label or drawing assertions',
    limit: 'Format validity is not drawing correctness. Missing output and unknown format inspection remain distinct.', ranks: ['Valid format'],
  },
  'output-admission': {
    question: 'Does the public invocation produce output satisfying the declared admission checks?',
    unit: 'planned inputs', evidence: 'Actual public return and named format/admission checks',
    limit: 'Admission may include labels. It establishes neither complete drawing correctness nor syntax rejection.',
    ranks: ['Returned in all rounds', 'Admitted', 'Passed'],
  },
  'source-rejection': {
    question: 'Does the public interface explicitly reject the independently invalid source?',
    unit: 'invalid-source controls', evidence: 'Source-bound typed rejection after proved public API entry',
    limit: 'A timeout, crash, missing adapter or observer exception is not a correct rejection.',
    ranks: ['Correct rejection', 'Rejected', 'Correct'],
  },
  'observable-behaviour': {
    question: 'Does every required assertion in the selected public behaviour case pass?',
    unit: 'whole behaviour cases', evidence: 'Literal stimuli, actual public values and qualified reference controls',
    limit: 'Selected family detection and structural naming behaviours; not whole-library conformance or drawing quality.',
    ranks: ['Passed'],
  },
  'api-compatibility': {
    question: 'Does the public interface satisfy the selected unchanged Mermaid API callbacks?',
    unit: 'selected callbacks', evidence: 'Original and public-reference controls plus retained peer public calls',
    limit: 'Measures substitutability for these APIs, not a requirement that all renderers expose the same API.',
    ranks: ['Passed'],
  },
  'drawing-assessment': {
    question: 'Which planned drawings satisfy every declared fact under the named output observer?',
    unit: 'planned drawings', evidence: 'Exact source expectations, actual output and representation-scoped observer controls',
    limit: 'Verified counts depend on assessment coverage. Unknown representations are assessment gaps, not renderer defects. PNG review reuse does not assess unseen images.',
    ranks: ['Correct'],
  },
  'public-model': {
    question: 'Do the shared public model operations preserve their specified postconditions?',
    unit: 'public model cases', evidence: 'Actual public model returns with prerequisites and operation contracts',
    limit: 'Optional API scope; model agreement supplies no painted-output correctness.', ranks: [] as string[],
  },
  'qualified-rendering-time': {
    question: 'How long does the fixed, correctly completed rendering workload take through the declared boundary?',
    unit: 'milliseconds or paired time ratio', evidence: 'Exhaustive owned serial calls, every checked output, complete current source contracts and stable A/A controls',
    limit: 'Only the frozen workload and execution boundary. API, CLI, conversion, cold and warm costs are separate.',
    ranks: ['Ratio to reference', 'Median ms'],
  },
  'output-size': {
    question: 'How many bytes does the actual public return contain?',
    unit: 'bytes', evidence: 'Retained public bytes, with encoding and compression stated',
    limit: 'Size is a cost measurement, not correctness or visual quality. No current aggregate size league is defined.', ranks: [] as string[],
  },
  'resource-cost': {
    question: 'What resource consumption does the specified counter observe within its declared process and time scope?',
    unit: 'counter-specific', evidence: 'Named counter, unit, process boundary, sampling method and resolution',
    limit: 'RSS, peak RSS, CPU, browser heap and native/GPU memory are different measures. Missing and censored counters cannot become zero.', ranks: [] as string[],
  },
  'recorded-checks': {
    question: 'What outcomes were recorded for these explicitly named checks?',
    unit: 'recorded checks', evidence: 'Owning retained observations',
    limit: 'Legacy or unclassified checks supply no inferred full-population, drawing or performance qualification.', ranks: ['Passed'],
  },
  'harness-regression': {
    question: 'Do the harness and its observers satisfy their development regression cases?',
    unit: 'regression cases', evidence: 'Independent fixtures and assertions',
    limit: 'Tests Trident; supplies no comparative renderer score.', ranks: [] as string[],
  },
} as const
for (const contract of Object.values(measurementContracts)) { Object.freeze(contract.ranks); Object.freeze(contract) }
Object.freeze(measurementContracts)
export type MeasurementId = keyof typeof measurementContracts
export interface MeasurementBinding { id: MeasurementId; sha256: string }
export function bindMeasurement(id: MeasurementId): MeasurementBinding {
  if (!Object.hasOwn(measurementContracts, id)) throw Error('Unknown measurement contract')
  return { id, sha256: evidenceDigest(measurementContracts[id]) }
}
export function assertMeasurementBinding(value: MeasurementBinding) {
  if (!value || !Object.hasOwn(measurementContracts, value.id) || value.sha256 !== bindMeasurement(value.id).sha256) throw Error('Unknown or changed measurement contract')
}
export const suiteMeasurements: Record<PublicSuite, readonly MeasurementId[]> = {
  docs: ['invocation-outcomes', 'output-production', 'output-validity', 'output-size', 'output-admission', 'source-rejection', 'drawing-assessment'],
  community: ['invocation-outcomes', 'output-production', 'output-validity', 'output-size', 'output-admission', 'source-rejection', 'drawing-assessment'],
  'mermaid-behaviour': ['observable-behaviour'], 'public-conformance': ['api-compatibility'],
  portable: ['output-admission', 'qualified-rendering-time'], fidelity: ['harness-regression'],
  'native-fidelity': ['public-model'], 'upstream-original': ['harness-regression'], 'upstream-fidelity': ['recorded-checks'],
}

/** Select known reducer schemas, not words in a caption or project names.
 * Historical rows without bindings remain explicitly inferred, never certified. */
export function measurementForTable(table: SnapshotTable): MeasurementId {
  if (table.columns.includes('Returned calls')) return 'invocation-outcomes'
  if (table.columns.includes('Returned output')) return 'output-production'
  if (table.columns.includes('Valid format')) return 'output-validity'
  if (table.columns.includes('Returned bytes')) return 'output-size'
  if (table.suite === 'fidelity' || table.suite === 'upstream-original') return 'harness-regression'
  if (table.suite === 'native-fidelity') return 'public-model'
  if (table.suite === 'mermaid-behaviour') return 'observable-behaviour'
  if (table.suite === 'public-conformance') return 'api-compatibility'
  if (table.drawingOutcomePolicy || table.suite === 'docs' && table.population?.total === 'Planned reviewed') return 'drawing-assessment'
  if (table.columns.includes('Correct rejection') || table.unit === 'invalid-source controls') return 'source-rejection'
  if (table.suite === 'portable' && (table.columns.includes('Ratio to reference') || table.columns.includes('Median ms'))) return 'qualified-rendering-time'
  if (table.columns.includes('Returned in all rounds') || table.columns.includes('Admitted') || table.columns.includes('Planned inputs') && table.columns.includes('Interface')) return 'output-admission'
  return 'recorded-checks'
}
export function validateTableMeasurement(table: SnapshotTable) {
  if (!table.measurement) return
  assertMeasurementBinding(table.measurement)
  const id = measurementForTable(table)
  if (table.measurement.id !== id) throw Error('Measurement contract does not match the table schema')
  if (table.ranking && !(measurementContracts[id].ranks as readonly string[]).includes(table.ranking.column)) throw Error('Ranking is outside the measurement contract')
}

/** This projection never invents attempted calls from assessment outcomes.
 * Completeness describes the stored grades, not independent observer validity. */
export function measurementCoverage(table: SnapshotTable, row: SnapshotTable['rows'][number]) {
  const number = (column: string) => {
    const value = row.values[table.columns.indexOf(column)]
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
  }
  // A recorded-observation denominator says nothing about planned calls.
  const planned = table.population && table.population.total !== 'Recorded' ? number(table.population.total) : null
  if (!table.population || planned === null) return { planned, resolved: null, unresolved: null, assessmentComplete: false }
  const resolved = new Set(['Correct', 'Incorrect', 'Incorrect drawing', 'Invalid format', 'Unsupported', 'Renderer failure', 'Passed', 'Failed', 'Correct rejection', 'Accepted invalid source', 'Rejected', 'Returned output', 'No returned output', 'Valid format', 'Returned in all rounds', 'Admitted', 'Returned calls', 'Completed errors'])
  const unknown = table.population.outcomes.filter(column => !resolved.has(column))
  const counts = unknown.map(number)
  if (counts.some(value => value === null)) throw Error('Unknown measurement coverage count')
  const unresolved = (counts as number[]).reduce((a, b) => a + b, 0)
  if (unresolved > planned) throw Error('Measurement gaps exceed the planned population')
  return { planned, resolved: planned - unresolved, unresolved, assessmentComplete: planned > 0 && unresolved === 0 }
}
