import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { benchmarkDefinitions, type BenchmarkDefinition } from './benchmark-definitions.ts'
import { rankResults, measurementNumber } from './result-ranking.ts'
import { supersedingAttempt, validateSnapshot, type ResultsSnapshot, type SnapshotTable } from './results-snapshot.ts'
import { communityCatalogFile, tridentDirectory } from './trident-paths.ts'
import type { LineageCatalog } from './lineage.ts'

const count = (table: SnapshotTable, row: SnapshotTable['rows'][number], column: string) => {
  const value = measurementNumber(row.values[table.columns.indexOf(column)])
  if (value === null || !Number.isSafeInteger(value) || value < 0) throw Error('Missing or invalid case count: ' + column)
  return value
}
const sum = (table: SnapshotTable, row: SnapshotTable['rows'][number], columns: string[]) => columns.reduce((total, column) => total + (table.columns.includes(column) ? count(table, row, column) : 0), 0)
const recent = (a: SnapshotTable, b: SnapshotTable) => Date.parse(b.campaignUpdatedAt ?? b.measuredAt) - Date.parse(a.campaignUpdatedAt ?? a.measuredAt) || a.id.localeCompare(b.id)
const evidence = (table: SnapshotTable) => ({ tableId: table.id, measuredAt: table.measuredAt, updatedAt: table.campaignUpdatedAt ?? table.measuredAt, receipt: table.receipt })

export function caseScoreboard(table: SnapshotTable, definition: Exclude<BenchmarkDefinition, 'timing'>, name: (project: string) => string) {
  const positive = definition === 'behaviour' || definition === 'api' ? 'Passed' : 'Correct'
  const unknown = definition === 'terminal' ? ['Unassessed', 'Unrun', 'Harness failure'] : definition === 'behaviour' ? ['Unavailable', 'Unrun'] : definition === 'api' ? ['Binding gaps'] : ['Unknown']
  if (!table.population) throw Error('A fixed case population is required')
  const rows = table.rows.map(row => {
    const planned = count(table, row, table.population!.total), passed = count(table, row, positive), unresolved = sum(table, row, unknown)
    const outcomes = Object.fromEntries(table.population!.outcomes.map(column => [column, count(table, row, column)]))
    if (Object.values(outcomes).reduce((a, b) => a + b, 0) !== planned || passed + unresolved > planned) throw Error('Case outcomes do not partition the planned workload')
    const nonpasses = planned - passed - unresolved
    return { project: row.project, name: name(row.project), version: String(row.values[0]), planned, passed, nonpasses, unresolved, outcomes,
      unrankedReason: row.unrankedReason ?? (passed + nonpasses === 0 ? 'No resolved case outcomes.' : null) }
  })
  if (new Set(rows.map(row => row.planned)).size !== 1 || !rows[0]?.planned) throw Error('Different planned populations cannot share a ranking')
  const ranked = rankResults(rows, { direction: 'descending', name: row => row.name, score: row => row.unrankedReason ? null : row.passed }).map(({ row, rank }) => ({ ...row, rank }))
  return { definition, ...benchmarkDefinitions[definition], ...evidence(table), planned: rows[0].planned, rows: ranked }
}

export function timingScoreboard(table: SnapshotTable, name: (project: string) => string) {
  const number = (row: SnapshotTable['rows'][number], column: string) => measurementNumber(row.values[table.columns.indexOf(column)])
  const qualified = table.rows.length === 2 && table.rows.every(row => !row.unrankedReason && row.values[table.columns.indexOf('Qualification')] === 'qualified' && (number(row, 'Ratio to reference') ?? 0) > 0 && (number(row, 'Median replica-round ms') ?? 0) > 0)
  const rows = table.rows.map(row => ({ project: row.project, name: name(row.project), version: String(row.values[0]), examples: number(row, 'Examples'), rounds: number(row, 'Rounds'),
    ratio: qualified ? number(row, 'Ratio to reference') : null, workloadMs: qualified ? number(row, 'Median replica-round ms') : null,
    interval: qualified ? row.values[table.columns.indexOf('Ratio interval')] : null,
    unrankedReason: qualified ? null : row.unrankedReason ?? 'The latest paired run did not qualify.' }))
  const ranked = rankResults(rows, { direction: 'ascending', name: row => row.name, score: row => row.ratio }).map(({ row, rank }) => ({ ...row, rank }))
  return { definition: 'timing' as const, ...benchmarkDefinitions.timing, ...evidence(table), format: table.cohort?.split(':')[1] ?? null, cohort: table.cohort, qualified, scope: table.caption, rows: ranked }
}

export function benchmarkScoreboards(snapshot: ResultsSnapshot, catalog: LineageCatalog) {
  validateSnapshot(snapshot, catalog)
  const nodes = new Map(catalog.nodes.map(node => [node.id, node]))
  const name = (id: string) => snapshot.projectNames?.[id] ?? nodes.get(id)?.comparisonBranding?.name ?? id
  const tables = snapshot.tables.filter(table => !table.historical && table.artifactRole !== 'candidate').sort(recent)
  const population = (table: SnapshotTable, planned: number) => !!table.population && table.rows.length > 0 && table.rows.every(row => count(table, row, table.population!.total) === planned)
  const selections: { definition: Exclude<BenchmarkDefinition, 'timing'>; table?: SnapshotTable }[] = [
    { definition: 'terminal', table: tables.find(table => table.suite === 'community' && !table.diagnostic && !!table.drawingOutcomePolicy && population(table, 116)) },
    { definition: 'behaviour', table: tables.find(table => table.suite === 'mermaid-behaviour' && !table.diagnostic && table.columns.includes('Passed') && population(table, 49)) },
    { definition: 'api', table: tables.find(table => table.suite === 'public-conformance' && table.columns.includes('Passed') && population(table, 154)) },
    { definition: 'rejection', table: tables.find(table => table.suite === 'community' && table.unit === 'invalid-source controls' && population(table, 4)) },
  ]
  const pairs = new Map<string, SnapshotTable>()
  for (const table of tables.filter(table => table.suite === 'portable' && table.cohort?.startsWith('native-timing:'))) {
    const key = JSON.stringify([table.cohort!.split(':')[1], table.rows.map(row => row.project).sort()])
    if (!pairs.has(key)) pairs.set(key, table)
  }
  return { schema: 'trident-benchmark-scoreboards-v1', rules: 'Each benchmark has one task, one score direction and its own stack rank. Equal scores share a rank. Entirely unresolved results stay unranked. No speed tie-break is invented for case tests.',
    cases: selections.filter(selection => !!selection.table).map(selection => {
      const table = selection.table!
      return caseScoreboard({ ...table, rows: table.rows.map(row => {
        const newer = supersedingAttempt(snapshot.attempts, table, row.project)
        return newer ? { ...row, unrankedReason: 'Superseded by a newer ' + newer.status + ' attempt; earlier passes are withheld.' } : row
      }) }, selection.definition, name)
    }),
    missing: selections.filter(selection => !selection.table).map(selection => ({ definition: selection.definition, reason: 'No recorded table for this benchmark.' })),
    timing: [...pairs.values()].map(table => timingScoreboard(table, name)),
    unscored: [{ name: 'Harness and Observer Regressions', reason: 'Development checks test Trident; they do not compare renderer results.' }, { name: 'Public Model Regressions', reason: 'Optional API maintenance checks have no shared renderer score.' }],
    limits: 'Case ranks order recorded passes on the fixed planned cases. Unresolved assessments remain visible. Timing ranks apply only within each qualified paired workload. This report runs no renderers or output graders.' }
}

export function renderBenchmarkScoreboards(report: ReturnType<typeof benchmarkScoreboards>, localRoot = tridentDirectory) {
  const cell = (value: unknown) => String(value ?? '—').replaceAll('|', '&#124;').replaceAll('\n', ' ')
  const link = (url: string) => url.startsWith('https://') ? url : join(localRoot, url)
  const lines = ['# Benchmark scoreboards', '', report.rules, '', report.limits, '']
  for (const board of report.cases) {
    lines.push('## ' + board.name, '', '**Task:** ' + board.task, '', '**Better:** ' + board.score + ' ' + board.why, '', '**Ties:** ' + board.ties, '',
      `**Source measurements:** ${board.measuredAt.slice(0, 10)}; ${board.planned} planned cases per project. No new collection.`, '',
      '| Rank | Project | Version | Passed | Nonpasses | Unresolved |', '|---:|---|---|---:|---:|---:|')
    for (const row of board.rows.filter(row => row.rank !== null)) lines.push('| ' + [row.rank, row.name, row.version, row.passed, row.nonpasses, row.unresolved].map(cell).join(' | ') + ' |')
    const missing = new Map<string, string[]>()
    for (const row of board.rows.filter(row => row.rank === null)) missing.set(row.unrankedReason!, [...(missing.get(row.unrankedReason!) ?? []), row.name])
    for (const [reason, projects] of missing) lines.push('', '**Unranked:** ' + projects.join(', ') + '. ' + reason)
    lines.push('', 'Source table: `' + board.tableId + '` · [Owning evidence](' + link(board.receipt.url) + ').', '')
  }
  lines.push('## ' + benchmarkDefinitions.timing.name, '', '**Task:** ' + benchmarkDefinitions.timing.task, '', '**Better:** ' + benchmarkDefinitions.timing.score + ' ' + benchmarkDefinitions.timing.why, '', '**Ties:** ' + benchmarkDefinitions.timing.ties, '')
  for (const board of report.timing.filter(board => board.qualified)) {
    lines.push('### ' + board.format!.toUpperCase() + ': ' + board.rows.map(row => row.name).join(' / '), '',
      `${board.rows[0]!.examples} examples; ${board.rows[0]!.rounds} rounds; ${board.measuredAt.slice(0, 10)}.`, '',
      '| Rank | Project | Workload ms | Time ratio |', '|---:|---|---:|---:|')
    for (const row of board.rows) lines.push('| ' + [row.rank, row.name, row.workloadMs!.toFixed(1), row.ratio!.toFixed(3)].map(cell).join(' | ') + ' |')
    lines.push('', 'Source table: `' + board.tableId + '` · [Owning evidence](' + link(board.receipt.url) + ').', '')
  }
  const unqualified = report.timing.filter(board => !board.qualified)
  if (unqualified.length) {
    lines.push('### Unranked timing attempts', '', '| Format | Pair | Reason |', '|---|---|---|')
    for (const board of unqualified) {
      const reason = [...new Set(board.rows.map(row => row.unrankedReason))].join('; ')
      lines.push('| ' + [board.format, board.rows.map(row => row.name).join(' / '), /noise ceiling/.test(reason) ? 'Reference measurements too noisy.' : reason].map(cell).join(' | ') + ' |')
    }
    lines.push('')
  }
  lines.push('## Unscored maintenance checks', '')
  for (const entry of report.unscored) lines.push('- **' + entry.name + ':** ' + entry.reason)
  for (const entry of report.missing) lines.push('- Missing ' + entry.definition + ': ' + entry.reason)
  lines.push('', 'Nonpasses include recorded failures and proven unsupported cases. They exclude unresolved assessments and binding gaps. Fully unresolved rows have no rank. The original numeric snapshot and frozen baseline are unchanged.', '')
  return lines.join('\n')
}

export function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('rankings --out FRESH_DIRECTORY [--snapshot FILE]\nWrite definitions, score directions and ranked scoreboards from recorded measurements. No renderer calls or output assessments.'); return }
  const values = new Map<string, string>()
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]!, value = args[index + 1]
    if (!['--out', '--snapshot'].includes(key) || !value || value.startsWith('--') || values.has(key)) throw Error('Use rankings --out FRESH_DIRECTORY [--snapshot FILE]')
    values.set(key, value)
  }
  if (!values.has('--out')) throw Error('Choose --out FRESH_DIRECTORY')
  const out = resolve(values.get('--out')!), file = resolve(values.get('--snapshot') ?? join(tridentDirectory, 'results/latest.json'))
  if (existsSync(out)) throw Error('Choose a fresh scoreboard output directory')
  const bytes = readFileSync(file), snapshot = JSON.parse(bytes.toString()), catalog = JSON.parse(readFileSync(communityCatalogFile, 'utf8'))
  const report = { ...benchmarkScoreboards(snapshot, catalog), source: { path: file, sha256: createHash('sha256').update(bytes).digest('hex') } }
  mkdirSync(out, { recursive: true }); writeFileSync(join(out, 'scoreboards.json'), JSON.stringify(report, null, 2) + '\n'); writeFileSync(join(out, 'scoreboards.md'), renderBenchmarkScoreboards(report))
  console.log(JSON.stringify({ out, caseBenchmarks: report.cases.length, qualifiedTimingPairs: report.timing.filter(board => board.qualified).length, rendererCalls: 0 }))
}
if (import.meta.main) main()
