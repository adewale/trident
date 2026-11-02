import { expect, test } from 'bun:test'
import { caseScoreboard, timingScoreboard, benchmarkScoreboards } from '../unified/benchmark-scoreboards.ts'
import { rankedRows, type SnapshotTable, type ResultsSnapshot } from '../unified/results-snapshot.ts'
import type { LineageCatalog } from '../unified/lineage.ts'

const receipt = { url: 'https://example.test/recorded/report.json', sha256: 'a'.repeat(64) }
const catalog: LineageCatalog = { nodes: ['fixture/a', 'fixture/b', 'fixture/c', 'fixture/missing'].map(id => ({ id, roles: ['peer'], outputs: ['svg', 'terminal'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } })) }
function controls(): SnapshotTable {
  return { id: 'controls', suite: 'community', cohort: 'terminal-fixture', measuredAt: '2026-02-01', historical: false, unit: 'invalid-source controls', caption: 'Synthetic ranking fixture; no renderer evidence.', receipt,
    columns: ['Version', 'Correct', 'Incorrect', 'Unknown', 'Planned'], ranking: { column: 'Correct', direction: 'descending' }, population: { total: 'Planned', outcomes: ['Correct', 'Incorrect', 'Unknown'] },
    rows: [{ project: 'fixture/a', values: ['1', 2, 0, 2, 4] }, { project: 'fixture/b', values: ['1', 2, 1, 1, 4] }, { project: 'fixture/c', values: ['1', 0, 4, 0, 4] }, { project: 'fixture/missing', values: ['1', 0, 0, 4, 4] }] }
}
function timing(id: string, qualified: boolean, date: string): SnapshotTable {
  return { id, suite: 'portable', cohort: 'native-timing:svg:fixture', measuredAt: date, historical: false, unit: 'paired normalized workload time', caption: 'Synthetic matched-workload fixture; no renderer evidence.', receipt,
    columns: ['Version', 'Examples', 'Rounds', 'Median replica-round ms', 'Ratio to reference', 'Ratio interval', 'Qualification'], ranking: { column: 'Ratio to reference', direction: 'ascending' },
    rows: ['fixture/a', 'fixture/b'].map((project, index) => ({ project, values: ['1', 6, 6, qualified ? index ? 20 : 100 : 'withheld', qualified ? index ? 0.2 : 1 : 'withheld', index ? '0.15–0.25' : 'reference', qualified ? 'qualified' : 'unqualified'], ...(!qualified ? { unrankedReason: 'Reference measurements too noisy' } : {}) })) }
}

test('case scoreboards share equal ranks, keep unknowns out of failures and distinguish observed zero from no assessment', () => {
  const table = controls(), before = JSON.stringify(table), board = caseScoreboard(table, 'rejection', id => id)
  expect(board.rows.map(row => [row.project, row.rank])).toEqual([['fixture/a', 1], ['fixture/b', 1], ['fixture/c', 3], ['fixture/missing', null]])
  expect(board.rows[0]).toMatchObject({ passed: 2, nonpasses: 0, unresolved: 2 })
  expect(board.rows[2]).toMatchObject({ passed: 0, nonpasses: 4, unresolved: 0 })
  expect(board.participants).toEqual({ recorded: 4, ranked: 3, passing: 2, unresolved: 1 })
  expect(rankedRows(table, id => id).find(row => row.project === 'fixture/missing')!.rank).toBeNull()
  expect(JSON.stringify(table)).toBe(before)
})

test('unlike denominators and inconsistent outcome totals cannot create a case league', () => {
  const table = controls()
  table.rows[0]!.values[3] = 3; table.rows[0]!.values[4] = 5
  expect(() => caseScoreboard(table, 'rejection', id => id)).toThrow('Different planned populations')
  table.rows[0]!.values[4] = 4
  expect(() => caseScoreboard(table, 'rejection', id => id)).toThrow('partition')
})

test('timing ranks lower ratios only inside the same qualified pair; noisy runs withhold every score', () => {
  const qualified = timingScoreboard(timing('qualified', true, '2026-02-01'), id => id)
  expect(qualified.rows.map(row => [row.project, row.rank, row.ratio])).toEqual([['fixture/b', 1, 0.2], ['fixture/a', 2, 1]])
  const noisy = timingScoreboard(timing('noisy', false, '2026-02-02'), id => id)
  expect(noisy.rows.every(row => row.rank === null && row.ratio === null && row.workloadMs === null)).toBe(true)
})

test('a newer failed attempt cannot revive earlier passes or an older qualified timing pair', () => {
  const table = controls(), snapshot: ResultsSnapshot = { schema: 'trident-results-snapshot-v1', tables: [table, timing('old', true, '2026-02-01'), timing('new', false, '2026-02-02')], attempts: [{ id: 'new-attempt', suite: 'community', project: 'fixture/a', cohort: 'terminal-fixture', measuredFrom: '2026-02-02', updatedAt: '2026-02-02', status: 'blocked', detail: 'Synthetic missing newer collection', receipt: { url: 'https://example.test/new/report.json', sha256: 'b'.repeat(64) }, groups: [] }] }
  const report = benchmarkScoreboards(snapshot, catalog), rejection = report.cases.find(board => board.definition === 'rejection')!
  expect(rejection.rows.find(row => row.project === 'fixture/a')).toMatchObject({ rank: null, passed: 2 })
  expect(rejection.rows.find(row => row.project === 'fixture/a')!.unrankedReason).toContain('Superseded')
  expect(report.timing).toHaveLength(1)
  expect(report.timing[0]).toMatchObject({ tableId: 'new', qualified: false })
  expect(report.timingParticipation).toEqual({ recordedProjects: 2, qualifiedProjects: 0, qualifiedPairs: 0 })
})

test('paired runs count distinct qualified projects, not pairs or positive case scores', () => {
  const first = timing('first', true, '2026-02-01'), second = timing('second', true, '2026-02-02')
  second.rows[1]!.project = 'fixture/c'
  const report = benchmarkScoreboards({ schema: 'trident-results-snapshot-v1', tables: [first, second], attempts: [] }, catalog)
  expect(report.timingParticipation).toEqual({ recordedProjects: 3, qualifiedProjects: 3, qualifiedPairs: 2 })
})
