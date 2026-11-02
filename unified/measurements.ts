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
export function measurementReport(snapshot: ResultsSnapshot, catalog: LineageCatalog) {
  validateSnapshot(snapshot, catalog)
  return { schema: 'trident-measurement-report-v1',
    limits: 'Stored counts describe their named measurement. Assessment completeness is not observer qualification. Attempted calls, output size, resources and latency are never inferred from drawing grades. No renderer or observer was invoked by this report.',
    tables: snapshot.tables.map(table => {
      const id = measurementForTable(table), contract = measurementContracts[id]
      return { tableId: table.id, suite: table.suite, measurement: bindMeasurement(id), binding: table.measurement ? 'recorded' : 'inferred legacy schema',
        question: contract.question, limit: contract.limit, unit: table.unit, corpus: table.cohort ?? null, comparisonKey: table.comparisonKey ?? null,
        evidence: table.receipt, measuredAt: table.measuredAt,
        rows: table.rows.map(row => ({ project: row.project, coverage: measurementCoverage(table, row), evidence: row.receipt ?? table.receipt,
          attemptedCalls: null, observerQualification: 'consult owning property/representation controls', ...(row.unrankedReason ? { qualificationGap: row.unrankedReason } : {}) })) }
    }) }
}
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
  let snapshot: ResultsSnapshot
  if (options.has('--snapshot')) snapshot = readBenchmarkDocument(resolve(options.get('--snapshot')!))
  else {
    const directory = resolve(options.get('--campaign')!), report = readCampaign(directory), file = campaignReportFile(directory)
    const actual = existsSync(join(directory, file)) ? join(directory, file) : join(directory, file + '.gz')
    snapshot = { schema: 'trident-results-snapshot-v1', attempts: [], tables: campaignTables(report, { url: 'https://local.invalid/retained-report', sha256: evidenceBytesDigest(readFileSync(actual)) }) }
  }
  const report = measurementReport(snapshot, catalog)
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'measurements.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
  const lines = ['# Trident measurements', '', report.limits, '']
  for (const entry of report.tables) {
    lines.push('## ' + entry.tableId, '', entry.question, '', entry.limit, '', '| Project | Planned | Resolved | Unresolved | Stored assessment complete |', '|---|---:|---:|---:|---|')
    const cell = (value: unknown) => String(value ?? 'unavailable').replaceAll('|', '&#124;').replaceAll('\n', ' ')
    for (const row of entry.rows) lines.push('| ' + [row.project, row.coverage.planned, row.coverage.resolved, row.coverage.unresolved, row.coverage.assessmentComplete].map(cell).join(' | ') + ' |')
    lines.push('')
  }
  writeFileSync(join(out, 'README.md'), lines.join('\n'), { flag: 'wx' })
  console.log(JSON.stringify({ out, tables: report.tables.length, rendererInvocations: 0 }))
}
if (import.meta.main) main()
