import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { campaignReportFile, readCampaign } from './campaign-publication.ts'
import { campaignTables } from './campaign-tables.ts'
import { measurementContracts, bindMeasurement, measurementForTable, measurementCoverage } from './measurement-contracts.ts'
import { validateSnapshot, type ResultsSnapshot } from './results-snapshot.ts'
import type { LineageCatalog } from './lineage.ts'
import { communityCatalogFile } from './trident-paths.ts'
import { freshOutputOutside } from './measurement-replay.ts'

/** An audit of stored measurement scopes, not a replacement raw-output grader. */
export interface MeasurementReportSource { kind: 'snapshot' | 'campaign'; path: string; sha256: string }
export function measurementReport(snapshot: ResultsSnapshot, catalog: LineageCatalog, source?: MeasurementReportSource) {
  validateSnapshot(snapshot, catalog)
  const evidence = (receipt: SnapshotTableReceipt) => source?.kind === 'campaign' ? { kind: 'local-campaign' as const, path: source.path, sha256: receipt.sha256 } : { kind: 'published-receipt' as const, ...receipt }
  return { schema: 'trident-measurement-report-v2', ...(source ? { source } : {}),
    limits: 'Stored counts describe their named measurement. Assessment completeness is not observer qualification. Attempted calls, output size, resources and latency are never inferred from drawing grades. No renderer or observer was invoked by this report.',
    tables: snapshot.tables.map(table => {
      const id = measurementForTable(table), contract = measurementContracts[id]
      return { tableId: table.id, suite: table.suite, measurement: bindMeasurement(id), binding: table.measurement ? 'recorded' : 'inferred legacy schema',
        question: contract.question, limit: contract.limit, unit: table.unit, corpus: table.cohort ?? null, comparisonKey: table.comparisonKey ?? null,
        columns: table.columns, scope: table.caption, ranking: table.ranking ?? null,
        evidence: evidence(table.receipt), measuredAt: table.measuredAt,
        rows: table.rows.map(row => ({ project: row.project, values: row.values, metrics: Object.fromEntries(table.columns.map((column, index) => [column, row.values[index]!])), coverage: measurementCoverage(table, row), evidence: evidence(row.receipt ?? table.receipt),
          attemptedCalls: null, observerQualification: { status: 'not-established-by-summary', reason: 'Requires matching property/representation controls and actual-output evidence; stored counts cannot qualify an observer.' }, ...(row.unrankedReason ? { qualificationGap: row.unrankedReason } : {}) })) }
    }) }
}
type SnapshotTableReceipt = ResultsSnapshot['tables'][number]['receipt']
export const MEASUREMENTS_HELP = `measurements --list
measurements --snapshot FILE [--catalog FILE] --out FRESH_DIRECTORY
measurements --campaign DIRECTORY [--catalog FILE] --out FRESH_DIRECTORY
Reports separate output admission, rejection, behaviours, API compatibility, drawing assessment and qualified timing. Campaign mode reruns ordinary reducers; snapshot mode audits stored summaries. Neither mode collects outputs or certifies raw evidence. Use measurements:replay to regrade retained bytes.`
export function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--help') { console.log(MEASUREMENTS_HELP); return }
  if (argv.length === 1 && argv[0] === '--list') { console.log(JSON.stringify(Object.entries(measurementContracts).map(([id, contract]) => ({ ...bindMeasurement(id as keyof typeof measurementContracts), ...contract })), null, 2)); return }
  const options = new Map<string, string>()
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]!, value = argv[i + 1]
    if (!['--snapshot', '--campaign', '--catalog', '--out'].includes(key) || !value || value.startsWith('--') || options.has(key)) throw Error(MEASUREMENTS_HELP)
    options.set(key, value)
  }
  if (!options.has('--out') || options.has('--snapshot') === options.has('--campaign')) throw Error(MEASUREMENTS_HELP)
  const out = resolve(options.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh measurement report directory')
  if (options.has('--campaign')) freshOutputOutside(resolve(options.get('--campaign')!), out)
  const catalog = JSON.parse(readFileSync(options.get('--catalog') ?? communityCatalogFile, 'utf8')) as LineageCatalog
  let snapshot: ResultsSnapshot, source: MeasurementReportSource
  if (options.has('--snapshot')) {
    const path = resolve(options.get('--snapshot')!)
    snapshot = readBenchmarkDocument(path)
    source = { kind: 'snapshot', path, sha256: evidenceBytesDigest(readFileSync(path)) }
  }
  else {
    const directory = resolve(options.get('--campaign')!), report = readCampaign(directory), file = campaignReportFile(directory)
    const actual = existsSync(join(directory, file)) ? join(directory, file) : join(directory, file + '.gz')
    source = { kind: 'campaign', path: actual, sha256: evidenceBytesDigest(readFileSync(actual)) }
    snapshot = { schema: 'trident-results-snapshot-v1', attempts: [], tables: campaignTables(report, { url: 'https://local.invalid/retained-report', sha256: evidenceBytesDigest(readFileSync(actual)) }) }
  }
  const report = measurementReport(snapshot, catalog, source)
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'measurements.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
  const lines = ['# Trident measurements', '', report.limits, '']
  for (const entry of report.tables) {
    const cell = (value: unknown) => String(value ?? 'unavailable').replaceAll('|', '&#124;').replaceAll('\n', ' ')
    lines.push('## ' + entry.tableId, '', entry.question, '', entry.limit, '', '**Unit:** ' + cell(entry.unit) + ' · **Measured:** ' + cell(entry.measuredAt), '', entry.scope, '',
      '| ' + ['Project', ...entry.columns].map(cell).join(' | ') + ' |', '| ' + ['Project', ...entry.columns].map(() => '---').join(' | ') + ' |')
    for (const row of entry.rows) lines.push('| ' + [row.project, ...row.values].map(cell).join(' | ') + ' |')
    lines.push('', '| Project | Planned | Resolved | Unresolved | Stored assessment complete |', '|---|---:|---:|---:|---|')
    for (const row of entry.rows) lines.push('| ' + [row.project, row.coverage.planned, row.coverage.resolved, row.coverage.unresolved, row.coverage.assessmentComplete].map(cell).join(' | ') + ' |')
    lines.push('')
  }
  writeFileSync(join(out, 'README.md'), lines.join('\n'), { flag: 'wx' })
  console.log(JSON.stringify({ out, tables: report.tables.length, rendererInvocations: 0 }))
}
if (import.meta.main) main()
