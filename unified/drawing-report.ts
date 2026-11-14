/** Drawing Correctness report additions: the source-obligation axis and the
 * bounded manual reviews. Small pure functions over the published Drawing
 * result; neither changes a label verdict, a count or a rank. */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { obligationCategories, obligationProfile, summarizeObligations, type ObligationCategory, type ObligationLaneSummary, type ObligationRow } from '../fidelity/drawing/obligations.ts'

type Label = (row: { project: string; version?: string }) => string
const defaultLabel: Label = row => row.project + (row.version ? ' ' + row.version : '')
const escape = (value: unknown) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
const laneKey = (row: { project: string; format: string }) => JSON.stringify([row.project, row.format])
const failures = ['incorrect', 'renderer-failure', 'invalid-format']

export interface DrawingObligationEvidence { schema: string; profile: string; corpus: { ids: string[]; contractSha256: string }; rows: ObligationRow[]; method?: unknown; observerSources?: unknown; qualification?: unknown; capture?: unknown }
export interface LaneObligations { profile: string; cases: number; categories: Record<ObligationCategory, { applicable: number; assessed: number; passed: number; failed: number; failedNoDrawing: number; unassessed: number; caseOutcomes: { passed: string[]; failed: string[]; unassessed: string[] } }> }

/** Add the obligation axis to a published Drawing result: `obligations` on
 * every lane and `obligationAssessment` (profile, coverage per format) at the
 * top. Rejects evidence from another corpus, version or lane set, and evidence
 * whose missing drawings disagree with the published label outcomes. */
export function withDrawingObligations(drawing: any, evidence: DrawingObligationEvidence) {
  if (evidence.profile !== obligationProfile) throw Error('Unsupported obligation profile ' + evidence.profile)
  if (evidence.corpus.contractSha256 !== drawing.corpus.contractSha256 || JSON.stringify(evidence.corpus.ids) !== JSON.stringify(drawing.corpus.ids)) throw Error('Obligation evidence uses a different Drawing corpus')
  const summaries = new Map(summarizeObligations(evidence.rows, drawing.corpus.ids).map(lane => [laneKey(lane), lane]))
  if (summaries.size !== drawing.results.length) throw Error('Obligation evidence lanes differ from the published Drawing lanes')
  const results = drawing.results.map((lane: any) => {
    const summary = summaries.get(laneKey(lane))
    if (!summary || summary.version !== lane.version) throw Error('No obligation evidence for ' + lane.project + ' ' + lane.format + ' ' + lane.version)
    const missing = new Set(evidence.rows.filter(row => laneKey(row) === laneKey(lane) && row.noDrawing).map(row => row.caseId))
    const published = new Set<string>([...lane.caseOutcomes['renderer-failure'], ...lane.caseOutcomes['invalid-format']])
    if (missing.size !== published.size || [...missing].some(id => !published.has(id))) throw Error('Obligation evidence disagrees with published missing drawings: ' + lane.project + ' ' + lane.format)
    return { ...lane, obligations: { profile: evidence.profile, cases: summary.cases, categories: summary.categories } satisfies LaneObligations }
  })
  return { ...drawing, results, obligationAssessment: { profile: evidence.profile, categories: [...obligationCategories], method: evidence.method, coverage: obligationCoverage(results) } }
}

/** Per format and category: applicable case rows and how many were assessed. */
export function obligationCoverage(results: readonly { format: string; obligations?: LaneObligations }[]) {
  const coverage: Record<string, Record<ObligationCategory, { applicable: number; assessed: number; failedNoDrawing: number }>> = {}
  for (const lane of results) {
    if (!lane.obligations) continue
    const format = (coverage[lane.format] ??= { relationships: { applicable: 0, assessed: 0, failedNoDrawing: 0 }, geometry: { applicable: 0, assessed: 0, failedNoDrawing: 0 }, layout: { applicable: 0, assessed: 0, failedNoDrawing: 0 } })
    for (const category of obligationCategories) {
      const own = lane.obligations.categories[category]
      format[category].applicable += own.applicable
      format[category].assessed += own.assessed
      format[category].failedNoDrawing += own.failedNoDrawing
    }
  }
  return coverage
}

const title = (format: string) => format === 'terminal' ? 'Terminal' : format.toUpperCase()

/** "Source obligations" table for one format. Rows are alphabetical: a
 * partially assessed axis is not a ranking. */
export function renderDrawingObligations(drawing: any, format: string, label: Label = defaultLabel): string[] {
  const lanes = drawing.results.filter((lane: any) => lane.format === format && lane.obligations)
  if (!lanes.length) return []
  const population = Object.fromEntries(obligationCategories.map(category => [category, Math.max(...lanes.map((lane: any) => lane.obligations.categories[category].applicable))]))
  const coverage = drawing.obligationAssessment?.coverage?.[format] ?? obligationCoverage(lanes)[format]
  const cell = (c: LaneObligations['categories'][ObligationCategory]) => c.applicable ? `${c.passed} / ${c.failed}${c.failedNoDrawing ? ` (${c.failedNoDrawing} no drawing)` : ''} / ${c.unassessed}` : 'n/a'
  const lines = [`### Source obligations: ${title(format)}`, '',
    'A second axis beside the ranked label verdict, not a ranking: rows are alphabetical and the label table above is unchanged. Each cell is passed / failed / unassessed over the cases whose reviewed source contract has that obligation. Relationships are drawn edges, messages and transitions with their direction, markers and captions; geometry is group containment, chart values encoded as position or extent, and regression geometry; layout is explicitly required source order or grid placement. A failure with no drawing is a renderer failure or inadmissible output. Unassessed obligations have no qualified observer for that drawing and could still pass or fail.', '',
    'Coverage, assessed / applicable case rows: ' + obligationCategories.map(category => `${category} ${coverage[category].assessed} / ${coverage[category].applicable}`).join('; ') + '.', '',
    `| Project | Relationships (${population.relationships} cases) | Geometry (${population.geometry} cases) | Layout (${population.layout} cases) |`, '| --- | --- | --- | --- |']
  for (const lane of [...lanes].sort((a: any, b: any) => label(a).localeCompare(label(b)))) lines.push(`| ${escape(label(lane))} | ${obligationCategories.map(category => cell(lane.obligations.categories[category])).join(' | ')} |`)
  lines.push('')
  return lines
}

export const reviewVerdicts = ['confirmed-failure', 'drawn-correctly', 'undecidable'] as const
export type ReviewVerdict = typeof reviewVerdicts[number]
export type ReviewAspect = 'labels' | ObligationCategory
export interface DrawingReview {
  format: 'svg' | 'terminal'; caseId: string; outputSha256: string
  /** Why the row was selected and which aspect the verdict is about. */
  selection: 'label-unknown' | 'label-incorrect' | 'obligation-failed' | 'obligation-unassessed'
  aspect: ReviewAspect
  /** The mechanical verdict on that aspect, copied unchanged. */
  mechanical: string
  verdict: ReviewVerdict
  reason: string
  method: 'svg-screenshot' | 'terminal-text'
  candidateObserverDefect?: { observer: string; evidence: string }
}
export interface DrawingReviewFile { schema: 'trident-drawing-reviews-v1'; project: string; version: string; capture: { path: string; sha256: string }; reviewedAt: string; selectionRule: string; reviews: DrawingReview[] }

export function loadDrawingReviews(directory: string): DrawingReviewFile[] {
  return readdirSync(directory).filter(name => name.endsWith('.json') && name !== 'obligations.json').sort().map(name => JSON.parse(readFileSync(join(directory, name), 'utf8'))).filter(file => file.schema === 'trident-drawing-reviews-v1')
}

const mechanicalFailure = (review: Pick<DrawingReview, 'aspect' | 'mechanical'>) => review.aspect === 'labels' ? failures.includes(review.mechanical) : review.mechanical === 'failed'
/** A review contradicts the mechanical verdict only when a mechanical failure
 * looks drawn correctly. It is a candidate observer defect, never a change. */
export const contradictsMechanical = (review: Pick<DrawingReview, 'aspect' | 'mechanical' | 'verdict'>) => review.verdict === 'drawn-correctly' && mechanicalFailure(review)

/** Validate review files against the published label outcomes (and, for
 * obligation aspects, the obligation rows when supplied). */
export function validateDrawingReviews(drawing: any, files: readonly DrawingReviewFile[], obligations?: DrawingObligationEvidence) {
  const lanes = new Map(drawing.results.map((lane: any) => [laneKey(lane), lane]))
  const rows = new Map((obligations?.rows ?? []).map(row => [JSON.stringify([row.project, row.format, row.caseId]), row]))
  for (const file of files) {
    if (file.schema !== 'trident-drawing-reviews-v1') throw Error('Unsupported review file for ' + file.project)
    if (drawing.collection?.captureArchive && file.capture.sha256 !== drawing.collection.captureArchive.sha256) throw Error('Review of a different capture: ' + file.project)
    const seen = new Set<string>()
    for (const review of file.reviews) {
      const lane: any = lanes.get(laneKey({ project: file.project, format: review.format }))
      if (!lane || lane.version !== file.version) throw Error('Review of an unpublished lane: ' + file.project + ' ' + review.format)
      const id = JSON.stringify([review.format, review.caseId, review.aspect])
      if (seen.has(id)) throw Error('Duplicate review ' + file.project + ' ' + id)
      seen.add(id)
      if (!reviewVerdicts.includes(review.verdict) || !review.reason.trim()) throw Error('Review needs a verdict and a reason: ' + file.project + ' ' + id)
      if (review.aspect === 'labels') {
        const status = Object.entries(lane.caseOutcomes).find(([, ids]) => (ids as string[]).includes(review.caseId))?.[0]
        if (status !== review.mechanical) throw Error('Review misstates the label verdict: ' + file.project + ' ' + id + ' ' + status)
      } else if (obligations) {
        const row = rows.get(JSON.stringify([file.project, review.format, review.caseId]))
        if (!row || row.categories[review.aspect].status !== review.mechanical || (row.outputSha256 && row.outputSha256 !== review.outputSha256)) throw Error('Review misstates the obligation verdict: ' + file.project + ' ' + id)
      }
      if (contradictsMechanical(review) && !review.candidateObserverDefect?.evidence) throw Error('A contradicted mechanical verdict needs observer-defect evidence: ' + file.project + ' ' + id)
    }
  }
}

export interface LaneReviews { reviewed: number; confirmedFailures: number; drawnCorrectly: number; undecidable: number; contradictions: { caseId: string; aspect: ReviewAspect; mechanical: string; reason: string; observer: string; evidence: string }[] }
/** Per lane review counts. Mechanical counts are untouched. */
export function summarizeDrawingReviews(files: readonly DrawingReviewFile[]) {
  const lanes = new Map<string, LaneReviews & { project: string; version: string; format: string }>()
  for (const file of files) for (const review of file.reviews) {
    const key = laneKey({ project: file.project, format: review.format })
    const lane = lanes.get(key) ?? { project: file.project, version: file.version, format: review.format, reviewed: 0, confirmedFailures: 0, drawnCorrectly: 0, undecidable: 0, contradictions: [] }
    lane.reviewed++
    if (review.verdict === 'confirmed-failure') lane.confirmedFailures++
    else if (review.verdict === 'drawn-correctly') lane.drawnCorrectly++
    else lane.undecidable++
    if (contradictsMechanical(review)) lane.contradictions.push({ caseId: review.caseId, aspect: review.aspect, mechanical: review.mechanical, reason: review.reason, observer: review.candidateObserverDefect!.observer, evidence: review.candidateObserverDefect!.evidence })
    lanes.set(key, lane)
  }
  return [...lanes.values()].sort((a, b) => a.format.localeCompare(b.format) || a.project.localeCompare(b.project))
}

/** Add `reviews` to reviewed lanes and `manualReview` at the top. Counts,
 * case outcomes and obligation results stay exactly as published. */
export function withDrawingReviews(drawing: any, files: readonly DrawingReviewFile[], obligations?: DrawingObligationEvidence) {
  validateDrawingReviews(drawing, files, obligations)
  const summaries = new Map(summarizeDrawingReviews(files).map(lane => [laneKey(lane), lane]))
  const results = drawing.results.map((lane: any) => {
    const summary = summaries.get(laneKey(lane))
    if (!summary) return lane
    const { project: _p, version: _v, format: _f, ...reviews } = summary
    return { ...lane, reviews }
  })
  const rules = [...new Set(files.map(file => file.selectionRule))]
  return { ...drawing, results, manualReview: { selectionRule: rules.length === 1 ? rules[0] : rules, projects: files.map(file => file.project).sort(), reviewed: files.reduce((sum, file) => sum + file.reviews.length, 0), policy: 'Reviews are recorded beside the mechanical verdicts. They never erase a mechanical failure and never turn an unknown into a ranked pass; a mechanical failure that looks drawn correctly is listed as a candidate observer defect.' } }
}

/** "Reviewed" summary for one format, next to the mechanical counts. */
export function renderDrawingReviews(drawing: any, format: string, label: Label = defaultLabel): string[] {
  const lanes = drawing.results.filter((lane: any) => lane.format === format && lane.reviews)
  if (!lanes.length) return []
  const lines = [`### Manual review: ${title(format)}`, '',
    'A bounded manual review of retained drawings, beside the mechanical counts and not merged into them. ' + (typeof drawing.manualReview?.selectionRule === 'string' ? 'Selection: ' + drawing.manualReview.selectionRule + ' ' : '') + 'A review never erases a mechanical failure and never turns an unknown into a ranked pass.', '',
    '| Project | Mechanical labels passed / failed / unknown | Reviewed | Confirmed failure | Drawn correctly | Undecidable | Contradicts a mechanical failure |', '| --- | --- | --- | --- | --- | --- | --- |']
  for (const lane of [...lanes].sort((a: any, b: any) => label(a).localeCompare(label(b)))) {
    const c = lane.counts, r: LaneReviews = lane.reviews
    lines.push(`| ${escape(label(lane))} | ${c.correct} / ${c.incorrect + c['renderer-failure'] + c['invalid-format']} / ${c.unknown + c.unrun} | ${r.reviewed} | ${r.confirmedFailures} | ${r.drawnCorrectly} | ${r.undecidable} | ${r.contradictions.length} |`)
  }
  lines.push('')
  const contradictions = lanes.flatMap((lane: any) => lane.reviews.contradictions.map((c: any) => ({ lane, ...c })))
  if (contradictions.length) {
    lines.push('Candidate observer defects (mechanical verdicts unchanged):', '')
    for (const c of contradictions) lines.push(`- ${escape(label(c.lane))}, \`${c.caseId}\` (${c.aspect}, mechanical ${c.mechanical}): ${escape(c.reason)} Observer: ${escape(c.observer)}. Evidence: ${escape(c.evidence)}`)
    lines.push('')
  }
  return lines
}

export type { ObligationLaneSummary }
