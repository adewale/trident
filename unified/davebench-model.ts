export const davebenchAdmissionProfile = 'davebench-public-api-admission-v3'
export const davebenchAdmission = 'A call completes only when it returns without error and its output passes mechanical admission after the clock stops: SVG must parse the way a browser displays it (as an SVG document, or embedded in an HTML page, where the HTML parser must yield exactly one SVG element) to an SVG namespace root with finite positive size; strict-XML validity is reported separately and does not affect completion; PNG must contain complete decodable image data with positive dimensions; terminal text must be non-empty after removing control sequences. An output that draws nothing (SVG: no painted shape with geometry and no visible text; terminal: nothing left after removing whitespace, control sequences and blank braille U+2800) is admitted only when the reviewed source draws nothing (configuration-only), and rejected when the reviewed source draws something; for inputs whose source bytes have no review, an empty sized SVG stays admitted and empty terminal text stays rejected. Error placeholders (aria-roledescription="error"), outputs led by a renderer error phrase absent from the source, and terminal text that only echoes the source are failures. A cheap meaning check then rejects fallback renders: drawn SVG text or terminal text that shows the source header line verbatim, or at least three and at least half of its syntax-bearing statements (arrows, shape brackets, key: value fields), was drawn from the source text rather than from an understood diagram. Native PNG bytes are not read for text, so the check covers PNG only when it is converted from the candidate SVG. Whether the drawing is correct is judged by Drawing Correctness; outputs are not retained.'

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
  /**
   * Every failed input, grouped by reason ('error: <first line, numbers as N>', 'timeout',
   * 'invalid: <admission reason>'): each value lists positions in the collection's
   * `plan.cases` as ascending ranges ("0-3,17"). Completed inputs are implied. Expand with
   * davebenchFailedInputs.
   */
  failures?: Record<string, string>
  /** Completed SVG outputs (also the SVG behind a converted PNG) that a browser displays
   * but that are not strict XML, by the strict parser's first complaint. Not failures. */
  strictXmlInvalid?: number; strictXmlReasons?: Record<string, number>
  /** PNG rows: the project's own PNG interface ('native') or Trident's Chromium
   * conversion of the project's SVG ('trident-conversion'). */
  pngPath?: 'native' | 'trident-conversion'
}

/** Ascending case positions as compact ranges: [0,1,2,5] -> "0-2,5". */
export function encodeCaseRanges(positions: number[]) {
  const sorted = [...new Set(positions)].sort((a, b) => a - b), parts: string[] = []
  for (let index = 0; index < sorted.length;) {
    let end = index
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end]! + 1) end++
    parts.push(end === index ? String(sorted[index]) : `${sorted[index]}-${sorted[end]}`)
    index = end + 1
  }
  return parts.join(',')
}
export function decodeCaseRanges(ranges: string) {
  if (!ranges) return []
  return ranges.split(',').flatMap(part => {
    const [start, end = start] = part.split('-').map(Number)
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start! < 0 || end! < start!) throw Error('Invalid DaveBench case range: ' + part)
    return Array.from({ length: end! - start! + 1 }, (_, offset) => start! + offset)
  })
}
/** Record one failed input on a run, keeping `failures` grouped by reason. */
export function recordFailure(run: Run, position: number, reason: string) {
  const failures = run.failures ??= {}
  failures[reason] = encodeCaseRanges([...decodeCaseRanges(failures[reason] ?? ''), position])
}
/** Count one measured call on a run: completion, failure counters and reasons, the
 * per-input failure record and the strict-XML diagnostic. Counting rules are unchanged. */
export function recordOutcome(run: Run, position: number, id: string, value: { outcome: string; ms: number | null; error?: string; invalid?: string; strictXmlInvalid?: string }) {
  run.attempted++
  if (value.ms === null) run.untimedCalls = (run.untimedCalls ?? 0) + 1; else run.totalMs += value.ms
  if (value.outcome === 'completed') run.completed++; else run.failed++
  if (value.outcome === 'error') { const reason = (value.error ?? 'no message').replace(/\d+/g, 'N'); (run.errorReasons ??= {})[reason] = (run.errorReasons[reason] ?? 0) + 1; recordFailure(run, position, 'error: ' + reason) }
  if (value.outcome === 'invalid') { run.invalid = (run.invalid ?? 0) + 1; const reason = (value.invalid ?? 'invalid').replace(/: .*/, ''); (run.invalidReasons ??= {})[reason] = (run.invalidReasons[reason] ?? 0) + 1; (run.rejected ??= {})[id] = value.invalid ?? 'invalid'; recordFailure(run, position, 'invalid: ' + reason) }
  if (value.outcome === 'timeout') { run.timeouts++; recordFailure(run, position, 'timeout') }
  if (value.outcome !== 'completed' && !['error', 'invalid', 'timeout'].includes(value.outcome)) recordFailure(run, position, value.outcome)
  if (value.outcome === 'completed' && value.strictXmlInvalid) { run.strictXmlInvalid = (run.strictXmlInvalid ?? 0) + 1; (run.strictXmlReasons ??= {})[value.strictXmlInvalid] = (run.strictXmlReasons[value.strictXmlInvalid] ?? 0) + 1 }
}
/** Failed input id -> reason for one run; inputs that are absent completed. */
export function davebenchFailedInputs(run: Pick<Run, 'failures'>, cases: readonly string[]) {
  const failed: Record<string, string> = {}
  for (const [reason, ranges] of Object.entries(run.failures ?? {})) for (const position of decodeCaseRanges(ranges)) {
    const id = cases[position]
    if (id === undefined || failed[id] !== undefined) throw Error('DaveBench failure names an unplanned or repeated case: ' + position)
    failed[id] = reason
  }
  return failed
}
type Run = DavebenchRun
export const davebenchRankingRule = {
  primary: 'More completed examples is better; use the minimum completion count across three complete runs.',
  secondary: 'For equal completion counts, when every tied row uses the same boundary kind (fresh process or persistent API), lower median total render/export time ranks first, but only when the three-run time ranges [min, max] do not overlap: differences inside run-to-run spread are not evidence.',
  ties: 'Identical completion counts share a rank when their boundary kinds differ, when a time is missing, or when their three-run time ranges overlap. Sorted by median, a row whose range overlaps the row above it takes that row\'s rank, so overlapping ranges chain into one shared rank.',
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
  const ranked: { project: string; version: string; format: string; boundary: string; completed: number; failed: number; medianTotalMs: number | null; totalMsRange: [number, number] | null; pngPath?: Run['pngPath']; rank: number }[] = []
  const unranked: { project: string; format: string; reason: string }[] = []
  for (const summary of davebenchSummary(runs)) {
    const rows = runs.filter(row => row.project === summary.project && row.format === summary.format)
    if (rows.length !== 3 || JSON.stringify(rows.map(row => row.run).sort()) !== '[1,2,3]' || rows.some(row => row.attempted !== planned || row.completed + row.failed !== planned || row.version !== summary.version || row.boundary !== summary.boundary || row.boundaryKind !== rows[0]!.boundaryKind)) {
      unranked.push({ project: summary.project, format: summary.format, reason: 'Three complete runs with one version and boundary are required.' }); continue
    }
    if (rows.some(row => !Number.isSafeInteger(row.completed) || row.completed < 0 || row.completed > planned || !Number.isFinite(row.totalMs) || row.totalMs < 0 || row.untimedCalls !== undefined && (!Number.isSafeInteger(row.untimedCalls) || row.untimedCalls < 0 || row.untimedCalls > row.attempted) || row.boundaryKind !== undefined && !['fresh-process', 'persistent-api'].includes(row.boundaryKind))) throw Error('Invalid DaveBench ranking measurements')
    const completed = Math.min(...rows.map(row => row.completed))
    if (rows.some(row => row.pngPath !== rows[0]!.pngPath)) { unranked.push({ project: summary.project, format: summary.format, reason: 'Three complete runs with one version and boundary are required.' }); continue }
    const times = rows.map(row => row.totalMs)
    ranked.push({ project: summary.project, version: summary.version, format: summary.format, boundary: summary.boundary, completed, failed: planned - completed, medianTotalMs: summary.medianTotalMs, totalMsRange: summary.medianTotalMs === null ? null : [Math.min(...times), Math.max(...times)], ...(rows[0]!.pngPath ? { pngPath: rows[0]!.pngPath } : {}), rank: 0 })
  }
  const format = (name: string) => {
    const kind = (row: typeof ranked[number]) => runs.find(run => run.project === row.project && run.format === row.format)?.boundaryKind ?? boundaryKind(row.boundary)
    const rows = ranked.filter(row => row.format === name).sort((a, b) => b.completed - a.completed || kind(a).localeCompare(kind(b)) || (a.medianTotalMs ?? Infinity) - (b.medianTotalMs ?? Infinity) || a.project.localeCompare(b.project))
    for (let start = 0; start < rows.length;) {
      let end = start
      while (end < rows.length && rows[end]!.completed === rows[start]!.completed) end++
      const group = rows.slice(start, end)
      // Fresh-process and persistent-API clocks measure different work, so time
      // separates equal completion counts only when every tied row shares one kind,
      // and only when the three-run ranges do not overlap (run-to-run spread is not evidence).
      if (new Set(group.map(kind)).size > 1 || group.some(row => row.totalMsRange === null)) for (const row of group) row.rank = start + 1
      else for (const [offset, row] of group.entries()) { const previous = group[offset - 1]; row.rank = previous && row.totalMsRange![0] <= previous.totalMsRange![1] && previous.totalMsRange![0] <= row.totalMsRange![1] ? previous.rank : start + offset + 1 }
      start = end
    }
    return rows
  }
  return { svg: format('svg'), png: format('png'), terminal: format('terminal'), unranked }
}
