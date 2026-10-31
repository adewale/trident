import { expect, test } from 'bun:test'
import { rankedRows, renderSnapshot, type ResultsSnapshot, type SnapshotTable, type SnapshotAttempt } from '../unified/results-snapshot.ts'
import type { LineageCatalog } from '../unified/lineage.ts'
const project = 'fixture/terminal', catalog: LineageCatalog = { nodes: [{ id: project, roles: ['peer'], outputs: ['terminal'], benchmark: { adapter: 'source-cli', outputs: ['terminal'] } }] }
const receipt = (key: string) => ({ url: 'https://example.test/' + key, sha256: key.repeat(64).slice(0, 64) })
function snapshot(): ResultsSnapshot {
  const table: SnapshotTable = { id: 'broad-community', suite: 'community', historical: false, measuredAt: '2026-01-01T00:00:00Z', campaignUpdatedAt: '2026-01-01T00:00:00Z', unit: 'inputs', caption: 'Broad retained compatibility', columns: ['Passed', 'Planned'], rows: [{ project, values: [3, 3] }], receipt: receipt('a'), ranking: { column: 'Passed', denominator: 'Planned', direction: 'descending' }, overview: { numerator: 'Passed', denominator: 'Planned', suffix: '%' } }
  return { schema: 'trident-results-snapshot-v1', overviewRanking: table.id, tables: [table], attempts: [] }
}
function attempt(cohort: string, day: string): SnapshotAttempt { return { id: 'attempt-' + cohort, project, suite: 'community', cohort, measuredFrom: '2026-01-01T00:00:00Z', updatedAt: `2026-01-${day}T00:00:00Z`, status: 'blocked', detail: 'Synthetic profile attempt', receipt: receipt('b'), groups: [] } }
test('new named terminal attempts preserve broad community evidence and its overview cell', () => {
  const data = snapshot(); data.attempts.push(attempt('terminal-project-corpus-v1', '02'))
  const text = renderSnapshot(data, catalog)
  const overview = text.split('\n').find(line => line.startsWith('| fixture/terminal |'))!
  expect(overview).toContain('100.0%')
  expect(overview).not.toContain('blocked')
})
test('the same terminal profile supersedes its old rolling row; another profile cannot hide it', () => {
  const data = snapshot(), table = data.tables[0]!
  table.id = 'terminal-table'; table.cohort = 'terminal-project-corpus-v1'; table.rolling = true; table.overview = undefined
  data.overviewRanking = undefined
  data.attempts.push(attempt('other-terminal-profile', '02'))
  expect(renderSnapshot(data, catalog)).toContain('**terminal-table**')
  data.attempts.push(attempt('terminal-project-corpus-v1', '03'))
  expect(renderSnapshot(data, catalog)).not.toContain('**terminal-table**')
})
test('correctness counts display best-first while unknowns still withhold formal ranks', () => {
  const table = snapshot().tables[0]!
  table.columns = ['Correct', 'Planned']; table.ranking = { column: 'Correct', denominator: 'Planned', direction: 'descending' }
  table.rows = [{ project: 'known', values: [5, 10] }, { project: 'unknown', values: [6, 10], unrankedReason: 'Unobserved display facts' }]
  expect(rankedRows(table, value => value).map(row => [row.project, row.rank])).toEqual([['unknown', null], ['known', 1]])
})
