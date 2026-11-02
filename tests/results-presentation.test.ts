import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { drawingOutcomeColumns, drawingOutcomeStatistics, drawingStatisticsColumns } from '../unified/drawing-outcomes.ts'
import { renderPublicResults, retainedTableValues, writeSnapshot, type ResultsSnapshot, type SnapshotTable } from '../unified/results-snapshot.ts'
import type { LineageCatalog } from '../unified/lineage.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('results-presentation-')
const reference = 'mermaid-js/mermaid', peer = 'fixture/peer', unknown = 'fixture/unknown'
const catalog: LineageCatalog = { nodes: [reference, peer, unknown].map(id => ({ id, roles: ['peer'], outputs: ['svg', 'png', 'terminal'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } })) }
const receipt = { url: 'https://example.test/capture/report.json', sha256: 'a'.repeat(64) }
function drawing(format: 'svg' | 'png', id = 'draw-' + format): SnapshotTable {
  const values = [[reference, 8, 2, 10], [peer, 9, 1, 10], [unknown, 0, 0, 20]] as const
  return { id, suite: 'docs', outputFormat: format, measuredAt: '2026-02-01', historical: false, unit: 'drawings', caption: 'An explicitly bounded synthetic fixture, not renderer evidence.', receipt,
    drawingOutcomePolicy: 'drawing-outcomes-v1', population: { total: 'Planned', outcomes: [...drawingOutcomeColumns] }, ranking: { column: 'Correct', direction: 'descending' },
    columns: ['Version', ...drawingOutcomeColumns, 'Planned', ...drawingStatisticsColumns, 'Measured'],
    rows: values.map(([project, correct, failed, unresolved]) => {
      const counts = Object.fromEntries(drawingOutcomeColumns.map(column => [column, 0])) as any
      counts.Correct = correct; counts['Incorrect drawing'] = failed; counts.Unassessed = unresolved
      const stats = drawingOutcomeStatistics(counts, 20)
      return { project, values: ['1.0', ...drawingOutcomeColumns.map(column => counts[column]), 20, ...[stats.observerCoverage, stats.lowerPercent, stats.upperPercent].map(value => Number(value!.toFixed(6))), '2026-02-01'] }
    }) }
}
function timing(format: 'svg' | 'png', qualified: boolean): SnapshotTable {
  return { id: 'time-' + format, suite: 'portable', cohort: 'native-timing:' + format + ':fixture', summary: true, historical: false, measuredAt: '2026-02-02', unit: 'paired normalized workload time', receipt,
    caption: format.toUpperCase() + '; first-use; Host synthetic fixture boundary. Corpus: synthetic fixture source; exact inputs in the plan. Ranks use the paired normalized ratio.',
    ranking: { column: 'Ratio to reference', direction: 'ascending' },
    columns: ['Version', 'Examples', 'Rounds', 'Median replica-round ms', 'Ratio to reference', 'Ratio interval', 'Qualification'],
    rows: [reference, peer].map((project, index) => ({ project, values: ['artifact ' + index, 6, 6, qualified ? index ? 25 : 100 : 'withheld', qualified ? index ? 0.25 : 1 : 'withheld', index ? '0.2–0.3' : 'reference', qualified ? 'qualified' : 'unqualified'], ...(!qualified ? { unrankedReason: 'Observed A/A control spread exceeds the declared noise ceiling' } : {}) })) }
}
const snapshot = (...tables: SnapshotTable[]): ResultsSnapshot => ({ schema: 'trident-results-snapshot-v1', tables, attempts: [] })
const render = (data: ResultsSnapshot) => renderPublicResults(data, catalog, new Map(data.tables.map(table => [table.id, 'results/tables/' + table.suite + '-1.md'])))

test('public ranks verified counts, preserves unresolved populations and avoids an overall rank', () => {
  const data = snapshot(drawing('svg')), before = JSON.stringify(retainedTableValues(data, data.tables.map(table => table.id)))
  const output = render(data)
  expect(output).toContain('| 1 | fixture/peer 1.0 | 9 | 1 | 10 | Uncertain |')
  expect(output).toContain('| 2 | mermaid-js/mermaid 1.0 | 8 | 2 | 10 | Reference |')
  expect(output).toContain('| — | fixture/unknown 1.0 | — | — | 20 | Not assessed |')
  expect(output).not.toContain('Overview rank')
  expect(output).not.toContain('xychart-beta')
  expect(output).not.toContain('Correctness upper (%)')
  expect(output).toContain('Exact documentation revision not recorded')
  expect(JSON.stringify(retainedTableValues(data, data.tables.map(table => table.id)))).toBe(before)
})

test('a new PNG failure cannot erase SVG scores or revive an old incompatible cohort', () => {
  const svg = drawing('svg'), old = structuredClone(svg)
  old.id = 'old-svg'; old.measuredAt = '2026-01-01'; old.rows[0]!.values[0] = 'old-version'
  const data = snapshot(old, svg, drawing('png'))
  data.attempts.push({ id: 'new-png', suite: 'docs', project: peer, outputFormats: ['png'], measuredFrom: '2026-03-01', updatedAt: '2026-03-01', status: 'blocked', detail: 'New PNG capture failed', receipt: { ...receipt, sha256: 'b'.repeat(64) }, groups: [] })
  const output = render(data), svgPart = output.split('## DaveBench SVG')[1]!.split('## DaveBench PNG')[0]!, pngPart = output.split('## DaveBench PNG')[1]!.split('## Terminal rendering')[0]!
  expect(svgPart).toContain('| 1 | fixture/peer 1.0 |')
  expect(output).not.toContain('old-version')
  expect(pngPart).not.toContain('| 1 | fixture/peer 1.0 |')
  expect(pngPart).toContain('Newer attempts supersede these scores: fixture/peer')
})

test('PNG noise does not obscure qualified SVG pairs, and raw return diagnostics stay in details', () => {
  const data = snapshot(drawing('svg'), timing('svg', true), timing('png', false)), output = render(data)
  const svg = output.split('### SVG')[1]!.split('### PNG')[0]!
  expect(svg).toContain('| 1 | fixture/peer artifact 1 | 25 | 0.250 | 0.200–0.300 |')
  expect(svg).toContain('| 2 | mermaid-js/mermaid artifact 0 | 100 | 1.000 | reference |')
  const png = output.split('### PNG')[1]!.split('### TERMINAL')[0]!
  expect(png).toContain('No paired run qualified')
  expect(png).toContain('Reference measurements too noisy')
  expect(png).not.toContain('| 1 |')
  const out = temp.dir(); writeSnapshot(data, catalog, out)
  expect(readFileSync(join(out, 'RESULTS.md'), 'utf8')).not.toContain('Overview rank')
  expect(readFileSync(join(out, 'results/tables/portable-1.md'), 'utf8')).toContain('A/A control spread')
  writeSnapshot(data, catalog, out, true)
})


test('later comparisons retain each earlier pair’s actual reference rather than suppress or pool it', () => {
  const first = timing('svg', true), second = structuredClone(first)
  second.id = 'second-pair'; second.measuredAt = '2026-03-01'
  second.receipt = { ...receipt, sha256: 'b'.repeat(64) }
  second.rows[1]!.project = unknown; second.rows[0]!.values[3] = 200
  const data = snapshot(first, second)
  data.attempts.push({ id: 'second-control', project: reference, suite: 'portable', cohort: first.cohort, measuredFrom: '2026-03-01', updatedAt: '2026-03-01', status: 'recorded', detail: 'A separate pair owns this reference', receipt: second.receipt, groups: [] })
  const output = render(data).split('### SVG')[1]!.split('### PNG')[0]!
  expect(output).toContain('100 | 1.000 | reference')
  expect(output).toContain('200 | 1.000 | reference')
  expect(output.match(/\| 2 \| mermaid-js\/mermaid artifact 0 \|/g)).toHaveLength(2)
})


test('illustrated outputs preserve the retained image bytes and exact source identity', () => {
  const directory = new URL('./../docs/images/results-2026-11-01/', import.meta.url)
  const examples = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8'))
  const corpus = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases
  expect(examples.map((row: any) => row.status)).toEqual(['correct', 'incorrect', 'unknown'])
  for (const row of examples) {
    expect(createHash('sha256').update(readFileSync(new URL(row.file, directory))).digest('hex')).toBe(row.outputSha256)
    const input = corpus.find((input: any) => input.id === row.caseId)
    expect(createHash('sha256').update(input.source).digest('hex')).toBe(row.sourceSha256)
  }
})


test('unlike planned populations cannot be presented as one accuracy league', () => {
  const entry = drawing('svg'), row = entry.rows[1]!
  row.values[entry.columns.indexOf('Unassessed')] = 20
  row.values[entry.columns.indexOf('Planned')] = 30
  const counts = Object.fromEntries(drawingOutcomeColumns.map(column => [column, row.values[entry.columns.indexOf(column)]])) as any
  const stats = drawingOutcomeStatistics(counts, 30)
  for (const [index, value] of [stats.observerCoverage, stats.lowerPercent, stats.upperPercent].entries()) row.values[entry.columns.indexOf(drawingStatisticsColumns[index]!)] = Number(value!.toFixed(6))
  const output = render(snapshot(entry))
  expect(output).toContain('Different planned populations cannot share a compact ranking')
  expect(output).not.toContain('| 1 | fixture/peer 1.0 |')
})
