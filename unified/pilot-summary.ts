import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { rankResults } from './result-ranking.ts'

/** Read the owning reports, never a controller's hand-maintained totals. */
export function summarizePilot(file: string) {
  const source = JSON.parse(readFileSync(file, 'utf8'))
  const boundaries = source.pilot && Array.isArray(source.results) ? source.results.map((row: any) => ({ ...row, report: existsSync(join(row.out, 'report.json')) ? join(row.out, 'report.json') : undefined,
    seconds: row.elapsedSeconds, cancelledForBudget: row.disposition === 'budget-exhausted' && row.launched })) : source.rows
  if (!Array.isArray(boundaries)) throw Error('Pilot controller needs a rows array or an explicit diagnostic pilot campaign')
  const seen = new Set<string>()
  const rows = boundaries.map((row: any) => {
    const key = JSON.stringify([row.project, row.caseId])
    if (seen.has(key)) throw Error('Duplicate pilot project/case boundary')
    seen.add(key)
    const base = { project: String(row.project), caseId: String(row.caseId), seconds: typeof row.seconds === 'number' && Number.isFinite(row.seconds) && row.seconds >= 0 ? row.seconds : null }
    if (row.cancelledForBudget || row.status === 'cancelled') return { ...base, state: 'cancelled' as const }
    if (!row.report) return { ...base, state: 'not-started' as const }
    // Historical controllers retain absolute workspace paths. Locate the owning
    // report inside this pilot directory so an extracted archive works too.
    const reportPath = source.pilot ? join(dirname(file), 'portable', encodeURIComponent(row.project), encodeURIComponent(row.caseId), 'report.json') : join(dirname(file), basename(dirname(row.report)), basename(row.report))
    const bytes = readFileSync(reportPath), report = JSON.parse(bytes.toString())
    if (report.project === row.project && !report.summary) return { ...base, state: 'incomplete' as const }
    if (report.project !== row.project || report.summary?.cases?.length !== 1 || report.summary.cases[0].id !== row.caseId) throw Error('Pilot owning report differs from its project/case boundary')
    const counts = report.summary.counts
    for (const field of ['positiveCases', 'outputAdmissionCases', 'completeSemanticCases', 'outputCalibratedTimingRows', 'totalTimingRows']) if (!Number.isSafeInteger(counts[field]) || counts[field] < 0) throw Error('Invalid pilot count: ' + field)
    if (counts.outputAdmissionCases > counts.positiveCases || counts.completeSemanticCases > counts.positiveCases || counts.outputCalibratedTimingRows > counts.totalTimingRows) throw Error('Pilot counts do not reconcile')
    return { ...base, state: 'collected' as const, positiveCases: counts.positiveCases, outputAdmissionCases: counts.outputAdmissionCases,
      semanticCompleteCases: counts.completeSemanticCases, calibratedTracks: counts.outputCalibratedTimingRows, totalTracks: counts.totalTimingRows,
      report: basename(dirname(reportPath)) + '/' + basename(reportPath), sha256: createHash('sha256').update(bytes).digest('hex') }
  })
  const collected = rows.filter((row: any) => row.state === 'collected')
  return { schema: 'trident-pilot-summary-v1', scope: 'Diagnostic collection cost and declared checks on the named pilot inputs; no ecosystem score, renderer-latency ranking or full-suite qualification.',
    sourceSha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
    counts: { planned: rows.length, collected: collected.length, cancelled: rows.filter((row: any) => row.state === 'cancelled').length,
      notStarted: rows.filter((row: any) => row.state === 'not-started').length,
      incomplete: rows.filter((row: any) => row.state === 'incomplete').length,
      positiveCases: collected.reduce((sum: number, row: any) => sum + row.positiveCases, 0),
      outputAdmissionCases: collected.reduce((sum: number, row: any) => sum + row.outputAdmissionCases, 0),
      semanticCompleteCases: collected.reduce((sum: number, row: any) => sum + row.semanticCompleteCases, 0) }, rows }
}
export function pilotMarkdown(summary: ReturnType<typeof summarizePilot>) {
  const c = summary.counts
  const lines = ['# Pilot evidence', '', summary.scope, '',
    `${c.collected}/${c.planned} boundaries collected; ${c.cancelled} cancelled; ${c.notStarted} unstarted; ${c.incomplete} other incomplete attempts.`,
    `${c.outputAdmissionCases}/${c.positiveCases} positive cases passed output admission; ${c.semanticCompleteCases}/${c.positiveCases} completed the declared semantic checks.`, '',
    'Ranks describe collection wall time within each named case, lower first. Failed output and uncollected boundaries are unranked. Completing declared semantic checks covers only that input and observer scope.', '']
  for (const caseId of new Set<string>(summary.rows.map((row: any) => row.caseId))) {
    lines.push(`## ${caseId}`, '', '| Rank | Project | Seconds | Output admission | Declared semantics | Calibrated tracks |', '|---:|---|---:|---|---|---|')
    const ranked = rankResults<any>(summary.rows.filter((row: any) => row.caseId === caseId), { direction: 'ascending', name: row => row.project,
      score: row => row.state === 'collected' && row.positiveCases > 0 && row.outputAdmissionCases === row.positiveCases && row.seconds !== null ? Math.round(row.seconds * 10) / 10 : null })
    for (const { row, rank } of ranked) lines.push(`| ${rank ?? '—'} | ${row.project} | ${row.seconds?.toFixed(1) ?? '—'} | ${row.state === 'collected' ? `${row.outputAdmissionCases}/${row.positiveCases}` : row.state} | ${row.state === 'collected' ? `${row.semanticCompleteCases}/${row.positiveCases}` : '—'} | ${row.state === 'collected' ? `${row.calibratedTracks}/${row.totalTracks}` : '—'} |`)
    lines.push('')
  }
  return lines.join('\n')
}
export function writePilotSummary(file: string, out: string) {
  const summary = summarizePilot(file)
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'pilot-summary.json'), JSON.stringify(summary, null, 2) + '\n')
  writeFileSync(join(out, 'pilot-summary.md'), pilotMarkdown(summary))
  return summary
}
