/**
 * DaveBench completion credited only over the inputs the Mermaid reference accepts, and
 * failures split by kind. Pure functions over a published DaveBench report (or a raw
 * collection with the same `plans`/`runs` shape): everything is recomputed from the recorded
 * per-input failures, so no recollection is needed.
 */
import { davebenchFailedInputs, davebenchRankings, decodeCaseRanges, encodeCaseRanges, type DavebenchRun } from './davebench-model.ts'

/** The ranked reference whose own parse/render decides which inputs are Mermaid at all. */
export const davebenchReferenceProject = 'mermaid-js/mermaid'
export type DavebenchFormat = 'svg' | 'png' | 'terminal'
export const davebenchFormats: readonly DavebenchFormat[] = ['svg', 'png', 'terminal']

/** The fields of results/release/report.json these helpers read. */
export interface DavebenchReportInput {
  corpus: { occurrences: number; referenceRejected?: Record<string, string> }
  plans: { images: { cases: readonly string[] }; terminal?: { cases: readonly string[] } }
  runs: readonly DavebenchRun[]
}

export interface ReferenceRejectedInput { id: string; error: string }

/**
 * Errors that Mermaid's own parsers and diagram detection raise: Jison grammars ("Parse error
 * on line N:", "Lexical error on line N."), Langium grammars ("Parsing failed: ...") and
 * detection ("No diagram type detected ..."). Anything else the reference throws (for example
 * an image the sandbox could not fetch) is not a rejection of the source.
 */
export const referenceRejectionErrors = /^error: (?:Parse error\b|Lexical error\b|Parsing failed\b|No diagram type detected\b|UnknownDiagramError\b)/

/**
 * Inputs the Mermaid reference rejects. A collection that recorded the pinned oracle's
 * verdicts (`corpus.referenceRejected`) is used as recorded. Otherwise an input is rejected
 * when every recorded SVG run of the reference failed it with a parser or detection error.
 */
export function referenceRejectedInputs(report: DavebenchReportInput, reference = davebenchReferenceProject): ReferenceRejectedInput[] {
  const cases = report.plans.images.cases
  if (report.corpus.referenceRejected) {
    const recorded = Object.entries(report.corpus.referenceRejected)
    for (const [id] of recorded) if (!cases.includes(id)) throw Error('Recorded reference rejection names an unplanned input: ' + id)
    return recorded.map(([id, error]) => ({ id, error })).sort((a, b) => cases.indexOf(a.id) - cases.indexOf(b.id))
  }
  const runs = report.runs.filter(run => run.project === reference && run.format === 'svg')
  if (!runs.length) throw Error(`DaveBench has no SVG runs of the reference ${reference}, so reference-rejected inputs cannot be determined`)
  const failed = runs.map(run => davebenchFailedInputs(requireFailures(run), cases))
  return cases.flatMap(id => {
    const reasons = failed.map(byId => byId[id])
    return reasons.every(reason => reason !== undefined && referenceRejectionErrors.test(reason)) ? [{ id, error: reasons[0]!.replace(/^error: /, '') }] : []
  })
}

export type DavebenchFailureKind = 'execution' | 'admission' | 'conversion'
/** PNG conversion errors that restate an SVG admission rule: the SVG itself was not admissible. */
const svgAdmissionInConversion = /^error: PNG conversion: (?:zero-size SVG|Malformed SVG document|Expected an SVG root)/
/**
 * Which kind of failure a recorded reason is.
 * - execution: the render threw, exited nonzero, crashed or timed out ('error: …', 'timeout').
 * - admission: an output was returned but rejected ('invalid: …'), including a PNG conversion
 *   that stopped because the project's SVG would fail SVG admission (zero size, malformed).
 * - conversion: Trident's PNG conversion failed after an admissible SVG ('error: PNG
 *   conversion: …', 'invalid: empty PNG encoding').
 */
export function davebenchFailureKind(reason: string): DavebenchFailureKind {
  if (svgAdmissionInConversion.test(reason)) return 'admission'
  if (reason.startsWith('error: PNG conversion: ') || reason === 'invalid: empty PNG encoding') return 'conversion'
  if (reason.startsWith('invalid: ')) return 'admission'
  return 'execution'
}

export interface AcceptedCompletionRow {
  project: string; version: string; format: string
  /** The run counted: the one with the fewest accepted completions (lowest run number on a tie). */
  run: number; runs: number
  /** Reference-accepted inputs; the denominator for every project. */
  accepted: number
  /** Accepted inputs that completed in the counted run. */
  completed: number
  /** The current league count: fewest completions of any run, over all planned inputs. */
  currentCompleted: number
  /** Failures on accepted inputs in the counted run, by kind; completed + these = accepted. */
  failures: Record<DavebenchFailureKind, number>
  /** Reference-rejected inputs this project rendered in the counted run. Not a success. */
  referenceRejectedRendered: string[]
  pngPath?: DavebenchRun['pngPath']
}
export interface AcceptedCompletion { format: DavebenchFormat; planned: number; accepted: number; rejected: ReferenceRejectedInput[]; rows: AcceptedCompletionRow[] }

const casesFor = (report: DavebenchReportInput, format: string) => {
  const cases = format === 'terminal' ? report.plans.terminal?.cases : report.plans.images.cases
  if (!cases) throw Error('DaveBench report has no plan for ' + format)
  return cases
}
function requireFailures(run: DavebenchRun) {
  if (!run.failures && run.failed > 0) throw Error(`DaveBench run ${run.project} ${run.format} ${run.run} records no per-input failures, so accepted completion cannot be recomputed`)
  return run
}
function runOutcome(run: DavebenchRun, cases: readonly string[], rejected: ReadonlySet<string>) {
  const failed = davebenchFailedInputs(requireFailures(run), cases)
  const failures: Record<DavebenchFailureKind, number> = { execution: 0, admission: 0, conversion: 0 }
  let completed = 0
  const rendered: string[] = []
  for (const id of cases) {
    const reason = failed[id]
    if (rejected.has(id)) { if (reason === undefined) rendered.push(id); continue }
    if (reason === undefined) completed++; else failures[davebenchFailureKind(reason)]++
  }
  return { completed, failures, rendered }
}

/**
 * Completion per project for one format, credited only over reference-accepted inputs
 * ("completed of N accepted"). The counted run is the league-count run under this credit:
 * the run with the fewest accepted completions. Rows are ordered by accepted completions.
 */
export function acceptedCompletion(report: DavebenchReportInput, format: DavebenchFormat): AcceptedCompletion {
  const cases = casesFor(report, format), rejected = referenceRejectedInputs(report)
  const rejectedIds = new Set(rejected.map(input => input.id)), accepted = cases.filter(id => !rejectedIds.has(id)).length
  const projects = [...new Set(report.runs.filter(run => run.format === format).map(run => run.project))]
  const rows = projects.map(project => {
    const runs = report.runs.filter(run => run.project === project && run.format === format).sort((a, b) => a.run - b.run)
    const counted = runs.map(run => ({ run, ...runOutcome(run, cases, rejectedIds) })).sort((a, b) => a.completed - b.completed || a.run.run - b.run.run)[0]!
    const row: AcceptedCompletionRow = { project, version: counted.run.version, format, run: counted.run.run, runs: runs.length, accepted, completed: counted.completed,
      currentCompleted: Math.min(...runs.map(run => run.completed)), failures: counted.failures, referenceRejectedRendered: counted.rendered }
    if (counted.run.pngPath) row.pngPath = counted.run.pngPath
    return row
  }).sort((a, b) => b.completed - a.completed || a.project.localeCompare(b.project))
  return { format, planned: cases.length, accepted, rejected, rows }
}

/**
 * Every run restated over reference-accepted inputs: attempted is the accepted count,
 * completed counts accepted inputs only and failures drop rejected inputs. totalMs is kept as
 * recorded (per-input times are not retained, so time on rejected inputs cannot be removed).
 */
export function acceptedRuns(report: DavebenchReportInput): DavebenchRun[] {
  const rejectedIds = new Set(referenceRejectedInputs(report).map(input => input.id))
  return report.runs.map(run => {
    const cases = casesFor(report, run.format), keep = new Set(cases.flatMap((id, position) => rejectedIds.has(id) ? [] : [position]))
    const outcome = runOutcome(run, cases, rejectedIds), attempted = keep.size
    const failures = Object.fromEntries(Object.entries(requireFailures(run).failures ?? {}).flatMap(([reason, ranges]) => {
      const positions = decodeCaseRanges(ranges).filter(position => keep.has(position))
      return positions.length ? [[reason, encodeCaseRanges(positions)]] : []
    }))
    return { ...run, attempted, completed: outcome.completed, failed: attempted - outcome.completed, failures }
  })
}

/** League rankings (davebenchRankings) over reference-accepted inputs, per format. */
export function acceptedRankings(report: DavebenchReportInput) {
  const runs = acceptedRuns(report), rejected = new Set(referenceRejectedInputs(report).map(input => input.id))
  const accepted = (format: string) => casesFor(report, format).filter(id => !rejected.has(id)).length
  const images = davebenchRankings(runs.filter(run => run.format !== 'terminal'), accepted('svg'))
  const terminal = report.plans.terminal ? davebenchRankings(runs.filter(run => run.format === 'terminal'), accepted('terminal')) : { terminal: [], unranked: [] }
  return { accepted: { svg: accepted('svg'), png: accepted('png'), terminal: report.plans.terminal ? accepted('terminal') : 0 }, svg: images.svg, png: images.png, terminal: terminal.terminal, unranked: [...images.unranked, ...terminal.unranked] }
}

const formatTitle: Record<DavebenchFormat, string> = { svg: 'SVG', png: 'PNG', terminal: 'Terminal text' }
const cell = (text: string) => text.replaceAll('|', '\\|').replace(/\s+/g, ' ').trim()

/**
 * Markdown: the reference-rejected inputs with Mermaid's error, then one table per format of
 * accepted completions, failures by kind and reference-rejected inputs rendered. `label`
 * names a project (three-benchmark-report's projectVersion fits).
 */
export function renderDavebenchAcceptedCompletion(report: DavebenchReportInput, label: (project: string, version: string) => string = (project, version) => `${project} ${version}`) {
  const tables = davebenchFormats.filter(format => format !== 'terminal' || report.plans.terminal).map(format => acceptedCompletion(report, format))
  const { planned, accepted, rejected } = tables[0]!
  const lines = ['# DaveBench completion on reference-accepted inputs', '',
    `The Mermaid reference rejects ${rejected.length} of the ${planned} documentation inputs with its own parser or diagram-detection error, so every project's completion is counted over the ${accepted} accepted inputs. Rendering a reference-rejected input earns no completion credit; the last column counts them and is not a success. Counts come from each project's run with the fewest accepted completions.`, '',
    'Failures on accepted inputs, by kind: **execution** (the render threw, exited nonzero or timed out), **admission** (an output came back but was rejected: error placeholder or text, fallback render, draws nothing, malformed, zero size) and **conversion** (Trident\'s PNG conversion failed after an admissible SVG). Completed + execution + admission + conversion = accepted.', '']
  if (rejected.length) {
    lines.push('| Reference-rejected input | Mermaid error |', '|---|---|')
    for (const input of rejected) lines.push(`| ${cell(input.id)} | ${cell(input.error) || '(no message)'} |`)
    lines.push('')
  }
  for (const table of tables) {
    lines.push('## ' + formatTitle[table.format], '',
      `| Project | Completed of ${table.accepted} accepted ↑ | Current count of ${table.planned} | Execution failures | Admission failures | Conversion failures | Reference-rejected inputs rendered |`,
      '|---|---:|---:|---:|---:|---:|---:|')
    for (const row of table.rows) {
      const conversion = table.format === 'png' && row.pngPath !== 'native' ? String(row.failures.conversion) : '—'
      lines.push(`| ${cell(label(row.project, row.version))} | ${row.completed} | ${row.currentCompleted} | ${row.failures.execution} | ${row.failures.admission} | ${conversion} | ${row.referenceRejectedRendered.length} |`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
