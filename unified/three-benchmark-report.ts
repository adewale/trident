import { reserveResultDirectory } from './result-storage.ts'
import { fidelityPopulation, synthesiseBenchmarks, type ScoreBounds } from './overall-score.ts'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { boundaryKind, davebenchRankings, davebenchSummary, type DavebenchRun } from './davebench-model.ts'
import { assertTimingCollection, campaignPlan } from './campaign-plan.ts'

function requireSameAdmission(left: any, right: any) {
  const policy = left.method?.admission
  if (typeof policy !== 'string' || !policy || policy !== right.method?.admission) throw Error('DaveBench collections must use one recorded admission policy')
  if (left.method?.admissionProfile !== right.method?.admissionProfile) throw Error('DaveBench collections must use one admission profile; recollect changed methods together')
}

/** Report only measured campaigns. Undefined new benchmarks cannot inherit old subset scores. */
export function threeBenchmarkReport(images: any, terminal: any, versions?: any) {
  if (images.state !== 'complete' || terminal.state !== 'complete') throw Error('Wait for both rendering campaigns to complete')
  if (images.corpus.commit !== terminal.corpus.commit || images.corpus.occurrences !== terminal.corpus.occurrences) throw Error('DaveBench formats must use one documentation corpus')
  requireSameAdmission(images, terminal)
  assertTimingCollection(images); assertTimingCollection(terminal)
  const runs: DavebenchRun[] = [...images.runs, ...terminal.runs]
  const rankings = davebenchRankings(runs, images.corpus.occurrences)
  return { schema: 'trident-davebench-report-v2', corpus: images.corpus, versionsCheckedAt: versions?.checkedAt, status: 'davebench-only',
    ...(images.plan || terminal.plan ? { scope: images.plan?.scope === 'subset' || terminal.plan?.scope === 'subset' ? 'subset' : 'full', plans: { images: images.plan, terminal: terminal.plan } } : {}),
    collection: { images: { startedAt: images.startedAt, finishedAt: images.updatedAt, environment: images.environment, method: images.method, consolidation: images.consolidation }, terminal: { startedAt: terminal.startedAt, finishedAt: terminal.updatedAt, environment: terminal.environment, method: terminal.method, consolidation: terminal.consolidation } },
    measurements: { davebench: { status: runs.some(row => row.attempted > 0) ? 'measured' : 'unmeasured', runs: runs.length, attemptedCalls: runs.reduce((sum, row) => sum + row.attempted, 0) }, drawing: { status: 'not-supplied' }, fidelity: { status: 'not-supplied' } },
    runs, rankings, blocked: [...images.blocked, ...terminal.blocked] }
}

export function renderThreeBenchmarkReport(report: ReturnType<typeof threeBenchmarkReport>) {
  const lines = ['# DaveBench results', '', '**This report contains DaveBench only.** Drawing Correctness and Mermaid Fidelity are collected separately; the current league tables are in `RESULTS.md`.', '',
    `${report.corpus.occurrences} documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation${report.versionsCheckedAt ? ' (' + report.versionsCheckedAt + ')' : ''}.`, '',
    '| Benchmark | Result |', '|---|---|', `| DaveBench | ${report.measurements.davebench.runs} measured runs; ${report.measurements.davebench.attemptedCalls.toLocaleString('en-GB')} attempted calls. |`, '| Drawing Correctness | Not supplied to this DaveBench report. |', '| Mermaid Fidelity | Not supplied to this DaveBench report. |', '']
  if (report.scope === 'subset') lines.push('**Functional subset:** this report does not establish the full campaign league.', '')
  if (report.measurements.davebench.status === 'unmeasured') lines.push('**Unmeasured:** every planned lane was blocked; no completion or timing score is available.', '')
  for (const format of ['svg', 'png', 'terminal'] as const) {
    lines.push('## DaveBench — ' + format.toUpperCase(), '', '**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.', '', '| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |', '|---:|---|---:|---:|---|---|---:|---|')
    for (const row of report.rankings[format]) {
      const own = report.runs.filter(run => run.project === row.project && run.format === format).sort((a, b) => a.run - b.run)
      lines.push(`| ${row.rank} | ${projectVersion(row.project, row.version)} | ${row.completed} | ${row.failed} | ${own.map(run => run.invalid ?? '—').join(' / ')} | ${own.map(run => run.timeouts).join(' / ')} | ${(row.medianTotalMs === null ? '—' : (row.medianTotalMs / 1000).toFixed(3))} | ${row.boundary} |`)
    }
    lines.push('')
  }
  lines.push('', '## Blocked or incomplete execution', '')
  for (const row of report.blocked) lines.push('- **' + row.project + ':** ' + row.reason.replaceAll('\n', ' ').replaceAll('|', '\|'))
  for (const row of report.rankings.unranked) lines.push('- **' + row.project + ' (' + row.format + '):** ' + row.reason)
  lines.push('', 'DaveBench measures completion and time. Drawing Correctness and Mermaid Fidelity have separate result files.', '')
  return lines.join('\n')
}

/** The image results with a native PNG collection's runs added: both must count the same
 * pinned documentation corpus, and a project measured natively is no longer blocked. */
export function mergeNativePng(images: any, native: any) {
  for (const key of ['commit', 'occurrences'] as const) if (images.corpus?.[key] !== native.corpus?.[key]) throw Error(`Native PNG results count a different corpus (${key}: ${native.corpus?.[key]} vs ${images.corpus?.[key]})`)
  if (native.state !== 'complete') throw Error('Native PNG results are incomplete')
  assertTimingCollection(native)
  requireSameAdmission(images, native)
  const measured = new Set(native.runs.map((run: any) => run.project))
  for (const project of measured) if (images.runs.some((run: any) => run.project === project)) throw Error(project + ' already has image runs')
  let plan = images.plan
  if (plan || native.plan) {
    if (!plan || !native.plan || JSON.stringify(plan.cases) !== JSON.stringify(native.plan.cases)) throw Error('Native PNG requires the same planned case identities')
    const lanes = new Map(plan.lanes.map((lane: any) => [JSON.stringify([lane.project, lane.format]), lane]))
    for (const lane of native.plan.lanes) {
      const key = JSON.stringify([lane.project, lane.format]), prior: any = lanes.get(key)
      if (prior && prior.version !== lane.version) throw Error('Native PNG differs from planned frozen version')
      lanes.set(key, lane)
    }
    plan = campaignPlan([...lanes.values()] as any[], plan.cases, plan.rounds, { collections: [plan.identity, native.plan.identity] }, plan.scope)
  }
  const runs = [...images.runs, ...native.runs]
  const merged = { ...images, ...(plan ? { plan } : {}), runs, summary: davebenchSummary(runs), rankings: davebenchRankings(runs, images.corpus.occurrences), blocked: (images.blocked ?? []).filter((block: any) => !measured.has(block.project)) }
  assertTimingCollection(merged)
  return merged
}

export async function main(args = process.argv.slice(2)) {
  const usage = 'campaign:results --images FILE --terminal FILE [--native-png FILE] --out FRESH_DIRECTORY [--versions DIRECTORY]'
  if (args.length === 1 && args[0] === '--help') { console.log(usage + '\nReport measured DaveBench results. --native-png adds a davebench:native-png collection to the image results and writes the merged images.json beside the report. Use results:snapshot for the three current benchmark leagues.'); return }
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) { if (!['--images', '--terminal', '--native-png', '--versions', '--out'].includes(args[i]!) || !args[i + 1] || options.has(args[i]!)) throw Error(usage); options.set(args[i]!, args[i + 1]!) }
  if (['--images', '--terminal', '--out'].some(key => !options.has(key))) throw Error('Supply images, terminal and output paths')
  const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'))
  const images = options.has('--native-png') ? mergeNativePng(read(options.get('--images')!), read(options.get('--native-png')!)) : read(options.get('--images')!)
  const report = threeBenchmarkReport(images, read(options.get('--terminal')!), options.has('--versions') ? read(join(options.get('--versions')!, 'versions.json')) : undefined)
  const out = resolve(options.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  reserveResultDirectory(out)
  if (options.has('--native-png')) writeFileSync(join(out, 'images.json'), JSON.stringify(images, null, 2) + '\n')
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
  if (davebench.scope === 'subset' || drawing.plan?.scope === 'subset') throw Error('Current league tables require full campaigns; merge qualified partial recollections into the full campaign first')
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
    const rows: unknown[][] = ranked.map((r: any) => {
      const kind = davebench.runs?.find((run: any) => run.project === r.project && run.format === format)?.boundaryKind ?? (r.boundary ? boundaryKind(r.boundary) : undefined)
      return [r.rank, label(r), r.completed, (r.medianTotalMs === null ? '—' : (r.medianTotalMs / 1000).toFixed(3)), kind === 'fresh-process' ? 'CLI; startup included' : kind === 'persistent-api' ? 'API; initialization excluded' : 'Not recorded']
    })
    for (const block of davebench.blocked ?? []) if (!ranked.some((r: any) => r.project === block.project) && catalog.nodes.find((n: any) => n.id === block.project)?.benchmark?.outputs.includes(format)) rows.push(['—', label(block), 'Blocked', '—', '—'])
    table(['Rank', 'Project', `Completed / ${davebench.corpus.occurrences} ↑`, 'Median seconds ↓', 'Timing boundary'], rows)
  }
  const caseTable = (entries: any[], population: number, blocks: any[], mode: 'svg' | 'terminal' | 'fidelity', blockedLabel = 'Not run') => {
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
      const cells: unknown[] = [r.scored ? rank : '—', r.scored ? range(r) : '—', label(r), r.scored ? r.passed : 'Not assessed']
      if (mode === 'svg') cells.push(r.gaps ? r.passed + '–' + (r.passed + r.gaps) : r.passed)
      cells.push(r.scored ? mode === 'fidelity' ? r.counts.failed : r.failed : '—')
      if (mode === 'fidelity') cells.push(r.scored ? r.counts.unsupported : '—')
      const shared = mode === 'fidelity' ? fidelity.coverage?.commonUnassessedCallbacks : undefined
      if (shared !== undefined && (!Number.isSafeInteger(shared) || shared < 0 || r.project !== 'mermaid-js/mermaid' && shared > r.gaps)) throw Error('Invalid shared Fidelity gap accounting')
      cells.push(shared !== undefined && r.project !== 'mermaid-js/mermaid' ? shared + ' + ' + (r.gaps - shared) : r.gaps)
      return cells
    })
    for (const block of [...blocks].sort((a, b) => label(a).localeCompare(label(b)))) if (!measured.some(r => r.project === block.project)) rows.push(['—', '—', label(block), blockedLabel, ...(mode === 'svg' ? ['0–' + population] : []), '—', ...(mode === 'fidelity' ? ['—'] : []), population])
    table(['Verified rank', 'Possible rank', 'Project', `Passed / ${population} ↑`, ...(mode === 'svg' ? ['Pass bounds'] : []), mode === 'fidelity' ? 'Assertion/fault nonpasses' : 'Failed', ...(mode === 'fidelity' ? ['Unsupported'] : []), mode === 'fidelity' && fidelity.coverage ? 'Unassessed (shared + additional)' : 'Unassessed'], rows)
  }
  lines.push('## Drawing Correctness', '')
  lines.push('Required labels must be visible without leaked source syntax. Edges, arrow direction, layout and styling are outside this benchmark; PNG is not assessed.', '')
  for (const format of drawing.formats ?? ['svg', 'png', 'terminal']) {
    lines.push('### ' + (format === 'terminal' ? 'Terminal correctness' : format.toUpperCase() + ' correctness'), '')
    caseTable(drawing.results.filter((r: any) => r.format === format).map((r: any) => ({ ...r, passed: r.counts.correct, failed: r.counts.incorrect + r.counts['renderer-failure'] + r.counts['invalid-format'], gaps: r.counts.unknown + r.counts.unrun })), drawing.corpus.cases, drawing.blocked.filter((r: any) => String(r.format).split('/').includes(format)), format, 'Blocked')
  }
  lines.push('## Mermaid Fidelity', '')
  const population = fidelityPopulation(fidelity)
  if (fidelity.coverage) lines.push(`${fidelity.coverage.commonUnassessedCallbacks} reference-qualified callbacks are unassessed for every one of the ${fidelity.coverage.candidates} executed candidates; ${fidelity.coverage.commonUncollectedCallbacks} of them have no matching collected callback. Additional gaps vary by candidate. These gaps receive no verified pass credit.`, '')
  caseTable(fidelity.results.map((r: any) => ({ ...r, passed: r.counts.passed, failed: r.counts.failed + r.counts.unsupported, gaps: r.counts['trident-blocked'] })), population, fidelity.blocked, 'fidelity')
  lines.push('## Equal-weight synthesis', '')
  const bounds = (value: ScoreBounds | null) => value === null ? 'n/a' : Math.abs(value.upper - value.lower) < 1e-9 ? value.lower.toFixed(2) : value.lower.toFixed(2) + '–' + value.upper.toFixed(2)
  const rank = (row: { bestRank: number; worstRank: number }) => row.bestRank === row.worstRank ? String(row.bestRank) : row.bestRank + '–' + row.worstRank
  table(['Possible rank', 'Project', 'DaveBench / 100', 'Drawing / 100', 'Fidelity / 100', 'Overall / 100 ↑'], synthesiseBenchmarks(davebench, drawing, fidelity, catalog).map(row => [rank(row), label(row), bounds(row.davebench), bounds(row.drawing), bounds(row.fidelity), bounds(row.overall)]))
  return lines.join('\n')
}

/** DaveBench, Drawing Correctness, Mermaid Fidelity and the frozen catalog behind the landing page. */
/** The release campaign lives at fixed paths: a file name never claims a collection date.
 * Published dates come from the timestamps each result file records (published-facts.ts).
 * The catalog is the version cutoff the campaign ran against, named for the day it was frozen. */
export const currentBenchmarkResultFiles = ['results/release/report.json', 'results/release/drawing-correctness.json', 'results/release/mermaid-fidelity.json', 'docs/evidence/benchmark-campaign-2026-11-07/catalog.json']

/** Current campaign inputs already tracked in the repository; older snapshots
 * continue to support explicit historical exports to other directories. */
export function readCurrentBenchmarkResults(root: string) {
  const paths = currentBenchmarkResultFiles.map(p => join(root, p))
  if (!paths.slice(0, 3).some(p => existsSync(p))) return undefined
  if (!paths.every(p => existsSync(p))) throw Error('Current league tables require all three benchmark result files and the frozen catalog')
  const [davebench, drawing, fidelity, catalog] = paths.map(p => JSON.parse(readFileSync(p, 'utf8')))
  return { davebench, drawing, fidelity, catalog }
}

export function retainedBenchmarkLeagues(root: string, names: Record<string, string> = {}) {
  const model = readCurrentBenchmarkResults(root)
  return model && renderBenchmarkLeagues(model.davebench, model.drawing, model.fidelity, model.catalog, names)
}
