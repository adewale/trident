import { expect, test } from 'bun:test'
import { classifyDrawingOutcome, drawingOutcomeCells, drawingOutcomeColumns, drawingStatisticsColumns, retainedDrawingOutcome, summarizeDrawingOutcomes } from '../unified/drawing-outcomes.ts'
import { baselineComparison, drawingBounds, rankedRows, renderSnapshot, retainedTableValues, validateSnapshot, type SnapshotTable } from '../unified/results-snapshot.ts'
import type { LineageCatalog } from '../unified/lineage.ts'
const baseline = 'mermaid-js/mermaid', peer = 'fixture/peer'
const catalog: LineageCatalog = { nodes: [baseline, peer].map(id => ({ id, roles: ['peer'], outputs: ['svg'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } })) }
const receipt = { url: 'https://example.test/receipt.json', sha256: 'a'.repeat(64) }
function table(reference: Parameters<typeof summarizeDrawingOutcomes>[0], candidate: Parameters<typeof summarizeDrawingOutcomes>[0]): SnapshotTable {
  return { id: 'outcomes', suite: 'docs', outputFormat: 'svg', historical: false, measuredAt: '2026-11-01T00:00:00Z', unit: 'drawings', caption: 'Frozen source population.', receipt,
    drawingOutcomePolicy: 'drawing-outcomes-v1', columns: ['Version', ...drawingOutcomeColumns, 'Planned', ...drawingStatisticsColumns],
    rows: [[baseline, reference], [peer, candidate]].map(([project, outcomes]) => ({ project: project as string, values: ['1.0', ...drawingOutcomeCells(summarizeDrawingOutcomes(outcomes as Parameters<typeof summarizeDrawingOutcomes>[0]))] })),
    ranking: { column: 'Correct', direction: 'descending' }, overview: { numerator: 'Correct', denominator: 'Planned', suffix: '' }, population: { total: 'Planned', outcomes: [...drawingOutcomeColumns] } }
}
test('eight exclusive outcomes require typed ownership and reconcile to the full corpus', () => {
  const outcomes = [classifyDrawingOutcome({ verdict: 'correct' }), classifyDrawingOutcome({ verdict: 'incorrect' }), classifyDrawingOutcome({ verdict: 'incorrect', formatRejected: true }), classifyDrawingOutcome({ unsupported: true }), classifyDrawingOutcome({ rendererFailure: true }), classifyDrawingOutcome({ recorded: true }), classifyDrawingOutcome({ recorded: false }), classifyDrawingOutcome({ harnessFailure: true })]
  expect(outcomes).toEqual([...drawingOutcomeColumns])
  const summary = summarizeDrawingOutcomes(outcomes)
  expect(summary.total).toBe(8)
  expect(Object.values(summary.counts)).toEqual(Array(8).fill(1))
  expect([summary.assessed, summary.resolved, summary.lower, summary.upper]).toEqual([3, 5, 1, 4])
  expect([summary.observerCoverage, summary.lowerPercent, summary.upperPercent]).toEqual([37.5, 12.5, 50])
  expect(classifyDrawingOutcome({ runtimeExecuted: false, returned: true })).toBe('Unassessed')
  expect(classifyDrawingOutcome({ runtimeExecuted: false, returned: false })).toBe('Unrun')
  expect(retainedDrawingOutcome({ observations: [{ operation: 'render', status: 'blocked', metrics: { runtimeExecuted: false } }] as any })).toBe('Unrun')
  expect(retainedDrawingOutcome({ observations: [{ operation: 'drawing-checks', status: 'blocked', metrics: { observerFailure: true } }] as any })).toBe('Harness failure')
  expect(retainedDrawingOutcome({ observations: [{ operation: 'drawing-checks', status: 'blocked', metrics: { harnessFailure: true } }] as any })).toBe('Harness failure')
  expect(retainedDrawingOutcome({ observations: [{ operation: 'drawing-checks', status: 'blocked', detail: 'Drawing observer did not complete' }] as any })).toBe('Unassessed')
  expect(() => classifyDrawingOutcome({ verdict: 'correct', formatRejected: true })).toThrow('contradicts')
  expect(retainedDrawingOutcome({ observations: [{ operation: 'render', status: 'failed', detail: 'renderer exploded' }] as any })).toBe('Unassessed')
  expect(retainedDrawingOutcome({ observations: [], record: { publicOutcomeClassification: { category: 'actual-renderer-failure', publicApiEntryProved: false } } })).toBe('Unassessed')
  expect(retainedDrawingOutcome({ observations: [], record: { publicOutcomeClassification: { category: 'actual-renderer-failure', publicApiEntryProved: true } } })).toBe('Renderer failure')
  expect(retainedDrawingOutcome({ observations: [], record: { admission: { ok: false, scope: 'authored-labels' } } })).toBe('Unassessed')
  expect(retainedDrawingOutcome({ observations: [], record: { admission: { ok: false, scope: 'format-only' } } })).toBe('Invalid format')
  expect(retainedDrawingOutcome({ verdict: 'unknown', observations: [], record: { assessment: { status: 'correct' } } })).toBe('Unassessed')
})
test('overlapping bounds rank verified counts without claiming superiority; disjoint bounds can prove it', () => {
  const overlap = table(['Correct', 'Correct', 'Unassessed', 'Unassessed'], ['Correct', 'Correct', 'Correct', 'Incorrect drawing'])
  expect(rankedRows(overlap, id => id).map(row => [row.project, row.rank])).toEqual([[peer, 1], [baseline, 2]])
  expect(baselineComparison(overlap, overlap.rows[1]!)).toBe('More verified (+1); bounds overlap')
  const disjoint = table(['Correct', 'Incorrect drawing', 'Invalid format', 'Unsupported'], ['Correct', 'Correct', 'Correct', 'Unassessed'])
  expect(baselineComparison(disjoint, disjoint.rows[1]!)).toBe('Higher on this corpus (+2); disjoint bounds')
  const reverse = table(['Correct', 'Correct', 'Correct', 'Correct'], ['Correct', 'Incorrect drawing', 'Unassessed', 'Harness failure'])
  expect(baselineComparison(reverse, reverse.rows[1]!)).toBe('Lower on this corpus (-3); disjoint bounds')
  const tied = table(['Correct', 'Unsupported'], ['Correct', 'Renderer failure'])
  expect(baselineComparison(tied, tied.rows[1]!)).toBe('Tie on this corpus; fully resolved')
  expect(rankedRows(tied, id => id).map(row => row.rank)).toEqual([1, 1])
})
test('verified zero ranks while missing values and empty populations remain unavailable', () => {
  const data = table(['Unassessed', 'Unrun'], ['Incorrect drawing', 'Unsupported'])
  expect(rankedRows(data, id => id).map(row => row.rank)).toEqual([1, 1])
  expect(drawingBounds(data, data.rows[0]!)!.upper).toBe(2)
  expect(drawingBounds(data, data.rows[1]!)!.upper).toBe(0)
  data.rows[0]!.values[1] = 'unavailable'
  expect(rankedRows(data, id => id).find(row => row.project === baseline)!.rank).toBeNull()
  const empty = table([], [])
  expect(empty.rows[0]!.values.slice(-3)).toEqual(['unavailable', 'unavailable', 'unavailable'])
  expect(rankedRows(empty, id => id).map(row => row.rank)).toEqual([null, null])
})
test('snapshot validates derived bounds and binds the outcome policy without changing historical values', () => {
  const entry = table(['Correct', 'Unassessed'], ['Incorrect drawing', 'Harness failure']), snapshot = { schema: 'trident-results-snapshot-v1' as const, tables: [entry], attempts: [] }
  validateSnapshot(snapshot, catalog)
  const before = retainedTableValues(snapshot, ['outcomes'])
  expect((before[0] as any).drawingOutcomePolicy).toBe('drawing-outcomes-v1')
  const rendered = renderSnapshot(snapshot, catalog, undefined, true)
  expect(rendered).toContain('Verified-count rank')
  expect(rendered).toContain('bounds overlap')
  expect(rendered).toContain('overlapping bounds establish no accuracy winner')
  entry.rows[0]!.values[entry.columns.indexOf('Correctness upper (%)')] = 49
  expect(() => validateSnapshot(snapshot, catalog)).toThrow('bounds')
  entry.rows[0]!.values[entry.columns.indexOf('Correctness upper (%)')] = 100
  entry.rows[0]!.values[entry.columns.indexOf('Unrun')] = 1
  expect(() => validateSnapshot(snapshot, catalog)).toThrow('reconcile')
})
test('retained public-model tables keep their counts and receipts but lose comparative exposure', () => {
  const model: SnapshotTable = { ...table(['Correct'], ['Unassessed']), suite: 'native-fidelity', drawingOutcomePolicy: undefined, id: 'models', summary: true }
  const snapshot = { schema: 'trident-results-snapshot-v1' as const, tables: [model], attempts: [] }
  const before = retainedTableValues(snapshot, ['models'])
  const output = renderSnapshot(snapshot, catalog, undefined, true)
  expect(output).toContain('Unscored harness/observer regressions')
  expect(rankedRows(model, id => id).map(row => row.rank)).toEqual([null, null])
  expect(retainedTableValues(snapshot, ['models'])).toEqual(before)
  expect(output.split('\n').find(line => line.startsWith('| Project | Overview rank |'))).not.toContain('Model')
})
