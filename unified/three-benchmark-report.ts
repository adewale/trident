import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { davebenchRankings, type DavebenchRun } from './davebench.ts'
import { meanScores, missingScore, overallScorecards } from './overall-score.ts'

/** Report only measured campaigns. Undefined new benchmarks cannot inherit old subset scores. */
export function threeBenchmarkReport(images: any, terminal: any, versions: any, catalog: any) {
  if (images.state !== 'complete' || terminal.state !== 'complete') throw Error('Wait for both rendering campaigns to complete')
  if (!versions.complete || !Array.isArray(versions.rows)) throw Error('Version selection is incomplete')
  if (images.corpus.commit !== terminal.corpus.commit || images.corpus.occurrences !== terminal.corpus.occurrences) throw Error('DaveBench formats must use one documentation corpus')
  const runs: DavebenchRun[] = [...images.runs, ...terminal.runs]
  const rankings = davebenchRankings(runs, images.corpus.occurrences)
  const projects = [...new Set(versions.rows.map((row: any) => row.project))] as string[]
  const scores = projects.map(project => {
    const node = catalog.nodes.find((node: any) => node.id === project), outputs = node.benchmark?.outputs ?? node.outputs
    const formats: ('svg' | 'png' | 'terminal')[] = []
    if (outputs.includes('svg')) formats.push('svg')
    if (outputs.includes('svg') || outputs.includes('png')) formats.push('png')
    if (outputs.some((format: string) => ['terminal', 'ascii', 'unicode', 'ascii-unicode'].includes(format)) || node.benchmark?.cliRelease?.outputs.terminal) formats.push('terminal')
    const formatScores = formats.map(format => {
      const cohort = rankings[format], row = cohort.find(row => row.project === project)
      if (!row) return missingScore(format + ': no complete measurement')
      const score = cohort.length === 1 ? 100 : 100 * (cohort.length - row.rank) / (cohort.length - 1)
      return { score, lower: score, upper: score }
    })
    return { project, formats, components: { davebench: meanScores(formatScores), drawing: missingScore('Expanded cross-format drawing corpus and assessment campaign are not implemented'), fidelity: missingScore('Shared full pinned-upstream-suite campaign runner is not implemented') } }
  })
  const overall = overallScorecards(scores)
  return { schema: 'trident-three-benchmark-report-v1', corpus: images.corpus, versionsCheckedAt: versions.checkedAt, status: 'partial-benchmark-implementation',
    measurements: { davebench: { status: 'measured', runs: runs.length, attemptedCalls: runs.reduce((sum, row) => sum + row.attempted, 0) }, drawing: { status: 'not-implemented', measuredProjects: 0 }, fidelity: { status: 'not-implemented', measuredProjects: 0 } },
    scoring: { weights: overall.weights, davebench: 'Mean format rank percentile among measured participants: 100 for first, 0 for last. Completion-first ranks retain their timing tie-break. Average the predeclared applicable formats; unmeasured applicable formats remain unknown.', drawing: '100 × fully passed cases / fixed planned cases; unresolved assessments preserve uncertainty.', fidelity: '100 × fully passed upstream test cases / fixed scored population; Trident gaps preserve uncertainty.', overall: 'Arithmetic mean of the three benchmark scores. A missing benchmark is neither zero nor omitted; overall rank is withheld.' },
    runs, rankings, blocked: [...images.blocked, ...terminal.blocked], overall }
}

export function renderThreeBenchmarkReport(report: ReturnType<typeof threeBenchmarkReport>) {
  const lines = ['# Benchmark campaign results — 2 November 2026', '', '**DaveBench was collected. Drawing Correctness and Mermaid Fidelity remain unimplemented at their newly agreed scope, so no overall winner can be established.** The earlier 116-case terminal and 49/154-case compatibility selections are not substituted for those benchmarks.', '',
    `${report.corpus.occurrences} documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation.`, '',
    '| Benchmark | Result |', '|---|---|', `| DaveBench | ${report.measurements.davebench.runs} measured runs; ${report.measurements.davebench.attemptedCalls.toLocaleString('en-GB')} timed calls. |`, '| Drawing Correctness | Not run: the expanded issue/test corpus and cross-format assessment campaign are not implemented. |', '| Mermaid Fidelity | Not run: the shared full pinned-upstream-suite runner and project adapters are not implemented. |', '']
  for (const format of ['svg', 'png', 'terminal'] as const) {
    lines.push('## DaveBench — ' + format.toUpperCase(), '', '**More completions wins; lower median total time breaks ties.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.', '', '| Rank | Project | Version | Completed | Failed | Timeouts in runs 1/2/3 | Median total seconds | Boundary |', '|---:|---|---|---:|---:|---|---:|---|')
    for (const row of report.rankings[format]) {
      const timeouts = report.runs.filter(run => run.project === row.project && run.format === format).sort((a, b) => a.run - b.run).map(run => run.timeouts).join(' / ')
      lines.push(`| ${row.rank} | ${row.project} | ${row.version} | ${row.completed} | ${row.failed} | ${timeouts} | ${(row.medianTotalMs / 1000).toFixed(3)} | ${row.boundary} |`)
    }
    lines.push('')
  }
  lines.push('## Requested equal-weight synthesis', '', '**Weights: DaveBench ⅓, Drawing Correctness ⅓, Mermaid Fidelity ⅓.** DaveBench is normalized to a rank percentile within each format and averaged across applicable formats. The other two components have no new measurements. Missing results are not scored as zero and are not dropped from the average.', '', 'Rows below are ordered by the measured DaveBench component, not by an overall rank. An overall score requires all three benchmarks.', '', '| Project | DaveBench / 100 | Drawing Correctness / 100 | Mermaid Fidelity / 100 | Overall / 100 |', '|---|---:|---:|---:|---|')
  for (const row of [...report.overall.ranked, ...report.overall.unranked]) lines.push(`| ${row.project} | ${row.components.davebench.score === null ? 'Unresolved' : row.components.davebench.score.toFixed(1)} | — | — | Unranked |`)
  lines.push('', '## Blocked or incomplete execution', '')
  for (const row of report.blocked) lines.push('- **' + row.project + ':** ' + row.reason.replaceAll('\n', ' ').replaceAll('|', '\|'))
  for (const row of report.rankings.unranked) lines.push('- **' + row.project + ' (' + row.format + '):** ' + row.reason)
  lines.push('', 'The expanded benchmarks need implementation before these rows can support a best-overall comparison. No renderer correctness or full Mermaid fidelity result is inferred from returning output.', '')
  return lines.join('\n')
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('campaign:results --images FILE --terminal FILE --versions DIRECTORY --out FRESH_DIRECTORY\nReport actual measurements and equal-weight synthesis readiness; missing benchmarks remain unranked.'); return }
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) { if (!['--images', '--terminal', '--versions', '--out'].includes(args[i]!) || !args[i + 1] || options.has(args[i]!)) throw Error('campaign:results --images FILE --terminal FILE --versions DIRECTORY --out FRESH_DIRECTORY'); options.set(args[i]!, args[i + 1]!) }
  if (['--images', '--terminal', '--versions', '--out'].some(key => !options.has(key))) throw Error('Supply images, terminal, versions and output paths')
  const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'))
  const report = threeBenchmarkReport(read(options.get('--images')!), read(options.get('--terminal')!), read(join(options.get('--versions')!, 'versions.json')), read(join(options.get('--versions')!, 'catalog.json')))
  const out = resolve(options.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  writeFileSync(join(out, 'report.md'), renderThreeBenchmarkReport(report))
  writeFileSync(join(out, 'runs.csv'), 'project,version,format,run,attempted,completed,failed,timeouts,total_ms\n' + report.runs.map(row => [row.project, row.version, row.format, row.run, row.attempted, row.completed, row.failed, row.timeouts, row.totalMs].join(',')).join('\n') + '\n')
}
if (import.meta.main) await main()
