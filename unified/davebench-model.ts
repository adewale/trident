export const davebenchAdmissionProfile = 'davebench-public-api-admission-v2'
export const davebenchAdmission = 'A call completes only when it returns without error and its output passes mechanical admission after the clock stops: SVG must parse as XML to an SVG namespace root with finite positive size; PNG must contain complete decodable image data with positive dimensions; terminal text must be non-empty after removing control sequences. Error placeholders (aria-roledescription="error"), outputs led by a renderer error phrase absent from the source, and terminal text that only echoes the source are failures. A cheap meaning check then rejects fallback renders: drawn SVG text or terminal text that shows the source header line verbatim, or at least three and at least half of its syntax-bearing statements (arrows, shape brackets, key: value fields), was drawn from the source text rather than from an understood diagram. Native PNG bytes are not read for text, so the check covers PNG only when it is converted from the candidate SVG. Whether the drawing is correct is judged by Drawing Correctness; outputs are not retained.'

export interface DavebenchRun {
  project: string; version: string; format: string; run: number; boundary: string
  attempted: number; completed: number; failed: number; timeouts: number; totalMs: number
  /** Worker crashes/timeouts have no API duration. totalMs sums known durations only. */
  untimedCalls?: number
  /** New collectors record the boundary explicitly; legacy rows use their prose. */
  boundaryKind?: 'fresh-process' | 'persistent-api'
  /** Calls that returned without error but whose output failed mechanical admission; included in failed. */
  invalid?: number; invalidReasons?: Record<string, number>
  /** Which inputs were rejected, by input id, with the full reason: the audit trail for admission. */
  rejected?: Record<string, string>
  /** Calls that threw or exited nonzero, by their first error line (diagnostic only). */
  errorReasons?: Record<string, number>
}
type Run = DavebenchRun
export const davebenchRankingRule = {
  primary: 'More completed examples is better; use the minimum completion count across three complete runs.',
  secondary: 'For equal completion counts, lower median total render/export time is better when every tied row uses the same boundary kind (fresh process or persistent API).',
  ties: 'Identical completion counts share a rank when their boundary kinds differ, or when their median times are identical.',
  scope: 'Rank SVG, PNG and terminal text separately through the declared public execution paths. Native CLI time includes per-example process startup.',
  incomplete: 'Fewer than three complete runs, or mixed versions/boundaries, remain unranked.',
} as const
/** Fresh CLI processes include startup on every call; persistent APIs do not. */
export function boundaryKind(boundary: string) { return /process startup included|\bCLI\b/i.test(boundary) ? 'fresh-process' : 'persistent-api' }
function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]! }
export function davebenchSummary(runs: Run[]) {
  const keys = [...new Set(runs.map(run => JSON.stringify([run.project, run.format])))]
  return keys.map(key => {
    const rows = runs.filter(run => JSON.stringify([run.project, run.format]) === key)
    return { project: rows[0]!.project, version: rows[0]!.version, format: rows[0]!.format, boundary: rows[0]!.boundary,
      completed: rows.map(row => row.completed), failed: rows.map(row => row.failed), totalMs: rows.map(row => row.totalMs), medianTotalMs: rows.some(row => row.untimedCalls) ? null : median(rows.map(row => row.totalMs)), runs: rows.length }
  })
}

export function davebenchRankings(runs: Run[], planned: number) {
  const ranked: { project: string; version: string; format: string; boundary: string; completed: number; failed: number; medianTotalMs: number | null; rank: number }[] = []
  const unranked: { project: string; format: string; reason: string }[] = []
  for (const summary of davebenchSummary(runs)) {
    const rows = runs.filter(row => row.project === summary.project && row.format === summary.format)
    if (rows.length !== 3 || JSON.stringify(rows.map(row => row.run).sort()) !== '[1,2,3]' || rows.some(row => row.attempted !== planned || row.completed + row.failed !== planned || row.version !== summary.version || row.boundary !== summary.boundary || row.boundaryKind !== rows[0]!.boundaryKind)) {
      unranked.push({ project: summary.project, format: summary.format, reason: 'Three complete runs with one version and boundary are required.' }); continue
    }
    if (rows.some(row => !Number.isSafeInteger(row.completed) || row.completed < 0 || row.completed > planned || !Number.isFinite(row.totalMs) || row.totalMs < 0 || row.untimedCalls !== undefined && (!Number.isSafeInteger(row.untimedCalls) || row.untimedCalls < 0 || row.untimedCalls > row.attempted) || row.boundaryKind !== undefined && !['fresh-process', 'persistent-api'].includes(row.boundaryKind))) throw Error('Invalid DaveBench ranking measurements')
    const completed = Math.min(...rows.map(row => row.completed))
    ranked.push({ project: summary.project, version: summary.version, format: summary.format, boundary: summary.boundary, completed, failed: planned - completed, medianTotalMs: summary.medianTotalMs, rank: 0 })
  }
  const format = (name: string) => {
    const kind = (row: typeof ranked[number]) => runs.find(run => run.project === row.project && run.format === row.format)?.boundaryKind ?? boundaryKind(row.boundary)
    const rows = ranked.filter(row => row.format === name).sort((a, b) => b.completed - a.completed || kind(a).localeCompare(kind(b)) || (a.medianTotalMs ?? Infinity) - (b.medianTotalMs ?? Infinity) || a.project.localeCompare(b.project))
    for (let start = 0; start < rows.length;) {
      let end = start
      while (end < rows.length && rows[end]!.completed === rows[start]!.completed) end++
      const group = rows.slice(start, end)
      // Fresh-process and persistent-API clocks measure different work, so time
      // separates equal completion counts only when every tied row shares one kind.
      if (new Set(group.map(kind)).size > 1 || group.some(row => row.medianTotalMs === null)) for (const row of group) row.rank = start + 1
      else for (const [offset, row] of group.entries()) { const previous = group[offset - 1]; row.rank = previous && row.medianTotalMs === previous.medianTotalMs ? previous.rank : start + offset + 1 }
      start = end
    }
    return rows
  }
  return { svg: format('svg'), png: format('png'), terminal: format('terminal'), unranked }
}
