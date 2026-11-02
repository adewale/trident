import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { davebenchRankings, type DavebenchRun } from './davebench.ts'

/** Report only measured campaigns. Undefined new benchmarks cannot inherit old subset scores. */
export function threeBenchmarkReport(images: any, terminal: any, versions?: any) {
  if (images.state !== 'complete' || terminal.state !== 'complete') throw Error('Wait for both rendering campaigns to complete')
  if (images.corpus.commit !== terminal.corpus.commit || images.corpus.occurrences !== terminal.corpus.occurrences) throw Error('DaveBench formats must use one documentation corpus')
  const runs: DavebenchRun[] = [...images.runs, ...terminal.runs]
  const rankings = davebenchRankings(runs, images.corpus.occurrences)
  return { schema: 'trident-davebench-report-v2', corpus: images.corpus, versionsCheckedAt: versions?.checkedAt, status: 'partial-benchmark-implementation',
    collection: { images: { startedAt: images.startedAt, finishedAt: images.updatedAt, environment: images.environment, method: images.method, consolidation: images.consolidation }, terminal: { startedAt: terminal.startedAt, finishedAt: terminal.updatedAt, environment: terminal.environment, method: terminal.method, consolidation: terminal.consolidation } },
    measurements: { davebench: { status: 'measured', runs: runs.length, attemptedCalls: runs.reduce((sum, row) => sum + row.attempted, 0) }, drawing: { status: 'not-implemented', measuredProjects: 0 }, fidelity: { status: 'not-implemented', measuredProjects: 0 } },
    runs, rankings, blocked: [...images.blocked, ...terminal.blocked] }
}

export function renderThreeBenchmarkReport(report: ReturnType<typeof threeBenchmarkReport>) {
  const lines = ['# DaveBench results', '', '**DaveBench was collected. Drawing Correctness and Mermaid Fidelity remain unimplemented at their newly agreed scope, so no overall winner can be established.** The earlier 116-case terminal and 49/154-case compatibility selections are not substituted for those benchmarks.', '',
    `${report.corpus.occurrences} documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation${report.versionsCheckedAt ? ' (' + report.versionsCheckedAt + ')' : ''}.`, '',
    '| Benchmark | Result |', '|---|---|', `| DaveBench | ${report.measurements.davebench.runs} measured runs; ${report.measurements.davebench.attemptedCalls.toLocaleString('en-GB')} timed calls. |`, '| Drawing Correctness | Not run: the expanded issue/test corpus and cross-format assessment campaign are not implemented. |', '| Mermaid Fidelity | Not run: the shared full pinned-upstream-suite runner and project adapters are not implemented. |', '']
  for (const format of ['svg', 'png', 'terminal'] as const) {
    lines.push('## DaveBench — ' + format.toUpperCase(), '', '**More completions wins; lower median total time breaks ties.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.', '', '| Rank | Project | Version | Completed | Failed | Timeouts in runs 1/2/3 | Median total seconds | Boundary |', '|---:|---|---|---:|---:|---|---:|---|')
    for (const row of report.rankings[format]) {
      const timeouts = report.runs.filter(run => run.project === row.project && run.format === format).sort((a, b) => a.run - b.run).map(run => run.timeouts).join(' / ')
      lines.push(`| ${row.rank} | ${row.project} | ${row.version} | ${row.completed} | ${row.failed} | ${timeouts} | ${(row.medianTotalMs / 1000).toFixed(3)} | ${row.boundary} |`)
    }
    lines.push('')
  }
  lines.push('', '## Blocked or incomplete execution', '')
  for (const row of report.blocked) lines.push('- **' + row.project + ':** ' + row.reason.replaceAll('\n', ' ').replaceAll('|', '\|'))
  for (const row of report.rankings.unranked) lines.push('- **' + row.project + ' (' + row.format + '):** ' + row.reason)
  lines.push('', 'The expanded benchmarks need implementation before these rows can support a best-overall comparison. No renderer correctness or full Mermaid fidelity result is inferred from returning output.', '')
  return lines.join('\n')
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('campaign:results --images FILE --terminal FILE --out FRESH_DIRECTORY [--versions DIRECTORY]\nReport measured DaveBench results. Overall scoring awaits the other two benchmarks.'); return }
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
