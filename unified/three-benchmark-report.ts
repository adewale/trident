import { fidelityPopulation, synthesiseBenchmarks, type ScoreBounds } from './overall-score.ts'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { davebenchRankings, type DavebenchRun } from './davebench.ts'

/** Report only measured campaigns. Undefined new benchmarks cannot inherit old subset scores. */
export function threeBenchmarkReport(images: any, terminal: any, versions?: any) {
  if (images.state !== 'complete' || terminal.state !== 'complete') throw Error('Wait for both rendering campaigns to complete')
  if (images.corpus.commit !== terminal.corpus.commit || images.corpus.occurrences !== terminal.corpus.occurrences) throw Error('DaveBench formats must use one documentation corpus')
  const runs: DavebenchRun[] = [...images.runs, ...terminal.runs]
  const rankings = davebenchRankings(runs, images.corpus.occurrences)
  return { schema: 'trident-davebench-report-v2', corpus: images.corpus, versionsCheckedAt: versions?.checkedAt, status: 'davebench-only',
    collection: { images: { startedAt: images.startedAt, finishedAt: images.updatedAt, environment: images.environment, method: images.method, consolidation: images.consolidation }, terminal: { startedAt: terminal.startedAt, finishedAt: terminal.updatedAt, environment: terminal.environment, method: terminal.method, consolidation: terminal.consolidation } },
    measurements: { davebench: { status: 'measured', runs: runs.length, attemptedCalls: runs.reduce((sum, row) => sum + row.attempted, 0) }, drawing: { status: 'not-supplied' }, fidelity: { status: 'not-supplied' } },
    runs, rankings, blocked: [...images.blocked, ...terminal.blocked] }
}

export function renderThreeBenchmarkReport(report: ReturnType<typeof threeBenchmarkReport>) {
  const lines = ['# DaveBench results', '', '**This report contains DaveBench only.** Drawing Correctness and Mermaid Fidelity are collected separately; the current league tables are in `RESULTS.md`.', '',
    `${report.corpus.occurrences} documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation${report.versionsCheckedAt ? ' (' + report.versionsCheckedAt + ')' : ''}.`, '',
    '| Benchmark | Result |', '|---|---|', `| DaveBench | ${report.measurements.davebench.runs} measured runs; ${report.measurements.davebench.attemptedCalls.toLocaleString('en-GB')} timed calls. |`, '| Drawing Correctness | Not supplied to this DaveBench report. |', '| Mermaid Fidelity | Not supplied to this DaveBench report. |', '']
  for (const format of ['svg', 'png', 'terminal'] as const) {
    lines.push('## DaveBench — ' + format.toUpperCase(), '', '**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.', '', '| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |', '|---:|---|---:|---:|---|---|---:|---|')
    for (const row of report.rankings[format]) {
      const own = report.runs.filter(run => run.project === row.project && run.format === format).sort((a, b) => a.run - b.run)
      lines.push(`| ${row.rank} | ${projectVersion(row.project, row.version)} | ${row.completed} | ${row.failed} | ${own.map(run => run.invalid ?? '—').join(' / ')} | ${own.map(run => run.timeouts).join(' / ')} | ${(row.medianTotalMs / 1000).toFixed(3)} | ${row.boundary} |`)
    }
    lines.push('')
  }
  lines.push('', '## Blocked or incomplete execution', '')
  for (const row of report.blocked) lines.push('- **' + row.project + ':** ' + row.reason.replaceAll('\n', ' ').replaceAll('|', '\|'))
  for (const row of report.rankings.unranked) lines.push('- **' + row.project + ' (' + row.format + '):** ' + row.reason)
  lines.push('', 'DaveBench measures completion and time. Drawing Correctness and Mermaid Fidelity have separate result files.', '')
  return lines.join('\n')
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('campaign:results --images FILE --terminal FILE --out FRESH_DIRECTORY [--versions DIRECTORY]\nReport measured DaveBench results. Use results:snapshot for the three current benchmark leagues.'); return }
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) { if (!['--images', '--terminal', '--versions', '--out'].includes(args[i]!) || !args[i + 1] || options.has(args[i]!)) throw Error('campaign:results --images FILE --terminal FILE --out FRESH_DIRECTORY [--versions DIRECTORY]'); options.set(args[i]!, args[i + 1]!) }
  if (['--images', '--terminal', '--out'].some(key => !options.has(key))) throw Error('Supply images, terminal and output paths')
  const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'))
  const report = threeBenchmarkReport(read(options.get('--images')!), read(options.get('--terminal')!), options.has('--versions') ? read(join(options.get('--versions')!, 'versions.json')) : undefined)
  const out = resolve(options.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  writeFileSync(join(out, 'report.md'), renderThreeBenchmarkReport(report))
}
if (import.meta.main) await main()

/** One display identity everywhere a measured project appears. */
export function projectVersion(project: string, version: string, names: Record<string, string> = {}) {
  if (!version) throw Error('Missing measured/frozen version for ' + project)
  const revision = /^(?:git-)?([a-f0-9]{40})$/.exec(version)
  return `${names[project] ?? project} ${revision ? 'git-' + revision[1]!.slice(0, 12) : version}`
}

/** Tables only, from the three existing numeric results. No renderer execution. */
export function renderBenchmarkLeagues(davebench: any, drawing: any, fidelity: any, catalog: any, displayNames: Record<string, string> = {}) {
  if (drawing.state !== 'complete') throw Error('Drawing collection must be complete')
  const names = { ...Object.fromEntries(catalog.nodes.filter((n: any) => n.comparisonBranding?.name).map((n: any) => [n.id, n.comparisonBranding.name])), ...displayNames }
  const versions = new Map<string, string>(catalog.nodes.map((n: any) => [n.id, n.benchmark?.version]))
  for (const row of [...(davebench.runs ?? []), ...drawing.results, ...fidelity.results]) versions.set(row.project, row.version)
  const label = (row: any) => projectVersion(row.project, row.version ?? versions.get(row.project), names)
  const escape = (v: unknown) => String(v).replaceAll('|', '\\|').replaceAll('\n', ' ')
  const lines = ['# Benchmark league tables', '', '[Methods, scoring and coverage details](docs/benchmark-results-details.md)', '', '## DaveBench', '']
  const table = (columns: string[], rows: unknown[][]) => lines.push('| ' + columns.join(' | ') + ' |', '| ' + columns.map(() => '---').join(' | ') + ' |', ...rows.map(r => '| ' + r.map(escape).join(' | ') + ' |'), '')
  for (const format of ['svg', 'png', 'terminal']) {
    lines.push('### ' + (format === 'terminal' ? 'Terminal rendering' : format.toUpperCase() + ' rendering'), '')
    const ranked = [...davebench.rankings[format]].sort((a: any, b: any) => a.rank - b.rank || label(a).localeCompare(label(b)))
    const rows: unknown[][] = ranked.map((r: any) => [r.rank, label(r), r.completed, (r.medianTotalMs / 1000).toFixed(3)])
    for (const block of davebench.blocked ?? []) if (!ranked.some((r: any) => r.project === block.project) && catalog.nodes.find((n: any) => n.id === block.project)?.benchmark?.outputs.includes(format)) rows.push(['—', label(block), 'Blocked', '—'])
    table(['Rank', 'Project', `Completed / ${davebench.corpus.occurrences} ↑`, 'Median seconds ↓'], rows)
  }
  const caseTable = (entries: any[], population: number, blocks: any[], blockedLabel = 'Not run') => {
    const measured = entries.map(r => ({ ...r, scored: r.passed + r.failed > 0 })).sort((a, b) => Number(b.scored) - Number(a.scored) || b.passed - a.passed || label(a).localeCompare(label(b)))
    // Every unassessed case could still pass or fail. The range is the best and
    // worst position reachable once those cases are resolved, for scored rows.
    const scored = measured.filter(r => r.scored)
    const range = (r: any) => {
      const best = 1 + scored.filter(o => o !== r && o.passed > r.passed + r.gaps).length, worst = 1 + scored.filter(o => o !== r && o.passed + o.gaps > r.passed).length
      return best === worst ? String(best) : best + '–' + worst
    }
    let rank = 0, previous: number | undefined
    const rows: unknown[][] = measured.map((r, index) => {
      if (r.scored && r.passed !== previous) { rank = index + 1; previous = r.passed }
      return [r.scored ? rank : '—', r.scored ? range(r) : '—', label(r), r.scored ? r.passed : 'Not assessed', r.scored ? r.failed : '—', r.gaps]
    })
    for (const block of [...blocks].sort((a, b) => label(a).localeCompare(label(b)))) if (!measured.some(r => r.project === block.project)) rows.push(['—', '—', label(block), blockedLabel, '—', population])
    table(['Verified rank', 'Possible rank', 'Project', `Passed / ${population} ↑`, 'Failed', 'Unassessed'], rows)
  }
  lines.push('## Drawing Correctness', '')
  for (const format of drawing.formats ?? ['svg', 'png', 'terminal']) {
    lines.push('### ' + (format === 'terminal' ? 'Terminal correctness' : format.toUpperCase() + ' correctness'), '')
    caseTable(drawing.results.filter((r: any) => r.format === format).map((r: any) => ({ ...r, passed: r.counts.correct, failed: r.counts.incorrect + r.counts['renderer-failure'] + r.counts['invalid-format'], gaps: r.counts.unknown + r.counts.unrun })), drawing.corpus.cases, drawing.blocked.filter((r: any) => String(r.format).split('/').includes(format)), 'Blocked')
  }
  lines.push('## Mermaid Fidelity', '')
  const population = fidelityPopulation(fidelity)
  caseTable(fidelity.results.map((r: any) => ({ ...r, passed: r.counts.passed, failed: r.counts.failed + r.counts.unsupported, gaps: r.counts['trident-blocked'] })), population, fidelity.blocked)
  lines.push('## Equal-weight synthesis', '')
  const bounds = (value: ScoreBounds | null) => value === null ? 'n/a' : Math.abs(value.upper - value.lower) < 1e-9 ? value.lower.toFixed(2) : value.lower.toFixed(2) + '–' + value.upper.toFixed(2)
  const rank = (row: { bestRank: number; worstRank: number }) => row.bestRank === row.worstRank ? String(row.bestRank) : row.bestRank + '–' + row.worstRank
  table(['Possible rank', 'Project', 'DaveBench / 100', 'Drawing / 100', 'Fidelity / 100', 'Overall / 100 ↑'], synthesiseBenchmarks(davebench, drawing, fidelity, catalog).map(row => [rank(row), label(row), bounds(row.davebench), bounds(row.drawing), bounds(row.fidelity), bounds(row.overall)]))
  return lines.join('\n')
}

/** DaveBench, Drawing Correctness, Mermaid Fidelity and the frozen catalog behind the landing page. */
export const currentBenchmarkResultFiles = ['docs/evidence/benchmark-campaign-2026-11-03/report.json', 'results/drawing-correctness-2026-11-03.json', 'results/mermaid-fidelity-2026-11-03.json', 'docs/evidence/benchmark-campaign-2026-11-02/catalog.json']

/** Current campaign inputs already tracked in the repository; older snapshots
 * continue to support explicit historical exports to other directories. */
export function retainedBenchmarkLeagues(root: string, names: Record<string, string> = {}) {
  const paths = currentBenchmarkResultFiles.map(p => join(root, p))
  if (!paths.slice(0, 3).some(p => existsSync(p))) return undefined
  if (!paths.every(p => existsSync(p))) throw Error('Current league tables require all three benchmark result files and the frozen catalog')
  const [davebench, drawing, fidelity, catalog] = paths.map(p => JSON.parse(readFileSync(p, 'utf8')))
  return renderBenchmarkLeagues(davebench, drawing, fidelity, catalog, names)
}
