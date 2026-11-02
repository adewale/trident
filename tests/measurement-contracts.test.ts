import { expect, test } from 'bun:test'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { bindMeasurement, measurementCoverage, measurementForTable, validateTableMeasurement, suiteMeasurements } from '../unified/measurement-contracts.ts'
import { measurementReport } from '../unified/measurements.ts'
import { validateSnapshot, type SnapshotTable, type ResultsSnapshot } from '../unified/results-snapshot.ts'
import { drawingOutcomeColumns, drawingStatisticsColumns, drawingOutcomeStatistics } from '../unified/drawing-outcomes.ts'
import { campaignPlan } from '../unified/campaign-plan.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('measurement-contracts-')
const project = 'fixture/renderer', catalog: any = { nodes: [{ id: project, roles: ['renderer'], outputs: ['svg'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } }] }
function admission(): SnapshotTable {
  return { id: 'return', suite: 'docs', outputFormat: 'svg', historical: false, measuredAt: '2026-01-01', unit: 'inputs', caption: 'A small independent return-count fixture', receipt: { url: 'https://example.test/report.json', sha256: 'a'.repeat(64) },
    columns: ['Version', 'Returned in all rounds', 'Failed', 'Blocked', 'Planned'], rows: [{ project, values: ['1', 1, 0, 1, 2] }], ranking: { column: 'Returned in all rounds', direction: 'descending' }, population: { total: 'Planned', outcomes: ['Returned in all rounds', 'Failed', 'Blocked'] }, measurement: bindMeasurement('output-admission') }
}
test('measurement schemas reject relabeling public returns as drawing correctness or rendering performance', () => {
  const table = admission(), snapshot: ResultsSnapshot = { schema: 'trident-results-snapshot-v1', tables: [table], attempts: [] }
  expect(() => validateSnapshot(snapshot, catalog)).not.toThrow()
  expect(measurementForTable(table)).toBe('output-admission')
  for (const id of ['drawing-assessment', 'qualified-rendering-time'] as const) {
    table.measurement = bindMeasurement(id)
    expect(() => validateSnapshot(snapshot, catalog)).toThrow('does not match')
  }
  table.measurement = { ...bindMeasurement('output-admission'), sha256: 'b'.repeat(64) }
  expect(() => validateTableMeasurement(table)).toThrow('changed')
  const { measurement: _measurement, ...legacy } = admission()
  expect(measurementReport({ ...snapshot, tables: [legacy] }, catalog).tables[0]!.binding).toBe('inferred legacy schema')
})
test('assessment coverage separates renderer defects from observer gaps and never fabricates attempted calls', () => {
  const counts = Object.fromEntries(drawingOutcomeColumns.map(column => [column, 0])) as any
  counts.Correct = 1; counts['Renderer failure'] = 1; counts.Unassessed = 1; counts['Harness failure'] = 1; counts.Unrun = 1
  const stats = drawingOutcomeStatistics(counts, 5), table = admission()
  table.id = 'drawing'; table.drawingOutcomePolicy = 'drawing-outcomes-v1'; table.measurement = bindMeasurement('drawing-assessment')
  table.columns = ['Version', ...drawingOutcomeColumns, 'Planned', ...drawingStatisticsColumns]
  table.rows = [{ project, values: ['1', ...drawingOutcomeColumns.map(column => counts[column]), 5, stats.observerCoverage!, stats.lowerPercent!, stats.upperPercent!] }]
  table.population = { total: 'Planned', outcomes: [...drawingOutcomeColumns] }; table.ranking = { column: 'Correct', direction: 'descending' }
  const report = measurementReport({ schema: 'trident-results-snapshot-v1', tables: [table], attempts: [] }, catalog)
  expect(report.tables[0]!.rows[0]!.coverage).toEqual({ planned: 5, resolved: 2, unresolved: 3, assessmentComplete: false })
  expect(report.tables[0]!.rows[0]!.attemptedCalls).toBeNull()
  expect(report.tables[0]!.limit).toContain('assessment gaps')
  expect(measurementCoverage(admission(), admission().rows[0]!)).toEqual({ planned: 2, resolved: 1, unresolved: 1, assessmentComplete: false })
})
test('ordinary benchmark planning declares questions without asserting qualification or acquiring artifacts', () => {
  const plan = campaignPlan({ projects: catalog.nodes, suites: ['docs', 'portable'], rounds: 1, profile: 'smoke', executable: '/missing/browser' })
  expect(plan.rows[0]!.measurements.map(binding => binding.id)).toEqual([...suiteMeasurements.docs])
  expect(plan.rows.every(row => row.acquisition === 'not attempted')).toBe(true)
  expect(plan.rows[0]!.missing).toContain('chromium')
  expect(plan.docsWorkload!.plannedOccurrences).toBe(548)
  const partial = campaignPlan({ projects: catalog.nodes, suites: ['docs'], rounds: 1, profile: 'full', docsFormats: ['svg'], docsCaseIds: ['packages/mermaid/src/docs/syntax/flowchart.md:686'] })
  expect(partial.docsWorkload!.selectedOccurrences).toBe(1)
  expect(partial.docsWorkload!.requestedOutputCoordinates).toBe(1)
  expect(partial.docsWorkload!.plannedOccurrences).toBe(548)
})
test('binding gaps and unfamiliar outcomes cannot become resolved assessments or invented planned workloads', () => {
  for (const gap of ['Binding gaps', 'Missing', 'Future unqualified representation']) {
    const table = admission()
    table.columns[3] = gap; table.population!.outcomes[2] = gap
    expect(measurementCoverage(table, table.rows[0]!)).toEqual({ planned: 2, resolved: 1, unresolved: 1, assessmentComplete: false })
  }
  const recorded = admission()
  recorded.columns[4] = 'Recorded'; recorded.population!.total = 'Recorded'
  expect(measurementCoverage(recorded, recorded.rows[0]!)).toEqual({ planned: null, resolved: null, unresolved: null, assessmentComplete: false })
})
test('the public measurement command writes a separate audit without changing or collecting evidence', () => {
  const root = temp.dir(), input = join(root, 'snapshot.json'), catalogFile = join(root, 'catalog.json'), out = join(root, 'report')
  const snapshot = JSON.stringify({ schema: 'trident-results-snapshot-v1', tables: [admission()], attempts: [] })
  writeFileSync(input, snapshot); writeFileSync(catalogFile, JSON.stringify(catalog))
  const result = spawnSync(process.execPath, [resolveCommand(), 'measurements', '--snapshot', input, '--catalog', catalogFile, '--out', out], { encoding: 'utf8', env: { ...process.env, CI: 'true', MERMAID_REFERENCE_DIR: '/absent-oracle' } })
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
  expect(JSON.parse(result.stdout).rendererInvocations).toBe(0)
  expect(readFileSync(input, 'utf8')).toBe(snapshot)
  expect(JSON.parse(readFileSync(join(out, 'measurements.json'), 'utf8')).tables[0].rows[0].coverage.unresolved).toBe(1)
  expect(existsSync(join(out, 'README.md'))).toBe(true)
  const audit = JSON.parse(readFileSync(join(out, 'measurements.json'), 'utf8'))
  expect(audit.tables[0].rows[0].metrics['Returned in all rounds']).toBe(1)
  expect(audit.tables[0].rows[0].observerQualification.status).toBe('not-established-by-summary')
  expect(audit.source.path).toBe(input)
  expect(readFileSync(join(out, 'README.md'), 'utf8')).toContain('| fixture/renderer | 1 | 1 | 0 | 1 | 2 |')
})
const resolveCommand = () => new URL('../commands.ts', import.meta.url).pathname

test('the public acceptance plan is inspectable in CI without oracle, acquisition or renderer calls', () => {
  const result = spawnSync(process.execPath, [resolveCommand(), 'verify:measurements:live', '--plan'], { encoding: 'utf8', env: { ...process.env, CI: 'true', MERMAID_REFERENCE_DIR: '/absent-oracle' } })
  expect(result.status).toBe(0)
  const plan = JSON.parse(result.stdout)
  expect(plan.projects).toEqual(['mermaid-js/mermaid', 'obsidianmd/pele', 'lukilabs/beautiful-mermaid'])
  expect(plan.docsCaseIds).toHaveLength(3)
  expect(plan.purpose).toContain('no accuracy or speed ranking')
})
