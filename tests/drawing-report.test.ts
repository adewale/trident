import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { contradictsMechanical, loadDrawingReviews, renderDrawingObligations, renderDrawingReviews, summarizeDrawingReviews, validateDrawingReviews, withDrawingObligations, withDrawingReviews, type DrawingReviewFile } from '../unified/drawing-report.ts'
import { obligationProfile, type ObligationRow } from '../fidelity/drawing/obligations.ts'

const statuses = ['correct', 'incorrect', 'renderer-failure', 'invalid-format', 'unknown', 'unrun']
const lane = (project: string, outcomes: Record<string, string[]>) => ({ project, version: '1.0', format: 'svg', counts: Object.fromEntries(statuses.map(s => [s, outcomes[s]?.length ?? 0])), caseOutcomes: Object.fromEntries(statuses.map(s => [s, outcomes[s] ?? []])) })
const drawing = () => ({ corpus: { cases: 3, ids: ['a', 'b', 'c'], contractSha256: 'x' }, collection: { captureArchive: { sha256: 'cap' } }, formats: ['svg'], results: [lane('zeta/z', { correct: ['a', 'c'], 'renderer-failure': ['b'] }), lane('alpha/a', { correct: ['a'], incorrect: ['b'], unknown: ['c'] })] })
const row = (project: string, caseId: string, relationships: 'passed' | 'failed' | 'unassessed' | 'not-applicable', noDrawing = false): ObligationRow => ({ project, version: '1.0', format: 'svg', caseId, producerStatus: noDrawing ? 'renderer-failure' : 'correct', noDrawing, categories: { relationships: { status: relationships, obligations: [] }, geometry: { status: caseId === 'c' ? 'unassessed' : 'not-applicable', obligations: [] }, layout: { status: 'not-applicable', obligations: [] } } })
const evidence = (rows = [row('zeta/z', 'a', 'passed'), row('zeta/z', 'b', 'failed', true), row('zeta/z', 'c', 'not-applicable'), row('alpha/a', 'a', 'passed'), row('alpha/a', 'b', 'failed'), row('alpha/a', 'c', 'not-applicable')]) => ({ schema: 'trident-drawing-obligations-v1', profile: obligationProfile, corpus: { ids: ['a', 'b', 'c'], contractSha256: 'x' }, rows })

test('the obligation axis is added beside unchanged label verdicts with explicit coverage', () => {
  const base = drawing(), result = withDrawingObligations(base, evidence())
  expect(result.results.map((l: any) => [l.counts, l.caseOutcomes])).toEqual(base.results.map(l => [l.counts, l.caseOutcomes]))
  const zeta = result.results.find((l: any) => l.project === 'zeta/z').obligations.categories
  expect(zeta.relationships).toMatchObject({ applicable: 2, passed: 1, failed: 1, failedNoDrawing: 1, unassessed: 0 })
  expect(zeta.geometry).toMatchObject({ applicable: 1, assessed: 0, unassessed: 1 })
  expect(result.obligationAssessment.coverage.svg).toEqual({ relationships: { applicable: 4, assessed: 4, failedNoDrawing: 1 }, geometry: { applicable: 2, assessed: 0, failedNoDrawing: 0 }, layout: { applicable: 0, assessed: 0, failedNoDrawing: 0 } })
  const lines = renderDrawingObligations(result, 'svg')
  expect(lines[0]).toBe('### Source obligations: SVG')
  expect(lines.join('\n')).toContain('| Project | Relationships (2 cases) | Geometry (1 cases) | Layout (0 cases) |')
  expect(lines.join('\n')).toContain('Coverage, assessed / applicable case rows: relationships 4 / 4; geometry 0 / 2; layout 0 / 0.')
  // Alphabetical, not ranked: alpha precedes zeta even though zeta passes more.
  const tableRows = lines.filter(l => l.startsWith('| alpha') || l.startsWith('| zeta'))
  expect(tableRows).toEqual(['| alpha/a 1.0 | 1 / 1 / 0 | 0 / 0 / 1 | n/a |', '| zeta/z 1.0 | 1 / 1 (1 no drawing) / 0 | 0 / 0 / 1 | n/a |'])
  expect(renderDrawingObligations(drawing(), 'svg')).toEqual([])
})

test('obligation evidence from another corpus, lane set or missing-drawing record is rejected', () => {
  expect(() => withDrawingObligations(drawing(), { ...evidence(), corpus: { ids: ['a', 'b', 'c'], contractSha256: 'other' } })).toThrow('different Drawing corpus')
  expect(() => withDrawingObligations(drawing(), evidence(evidence().rows.filter(r => r.project === 'zeta/z')))).toThrow('lanes differ')
  const wrong = evidence().rows.map(r => r.project === 'zeta/z' && r.caseId === 'b' ? { ...r, noDrawing: false } : r)
  expect(() => withDrawingObligations(drawing(), evidence(wrong))).toThrow('missing drawings')
  expect(() => withDrawingObligations(drawing(), { ...evidence(), profile: 'old' })).toThrow('Unsupported obligation profile')
})

const reviews = (overrides: Partial<DrawingReviewFile['reviews'][number]> = {}): DrawingReviewFile => ({ schema: 'trident-drawing-reviews-v1', project: 'alpha/a', version: '1.0', capture: { path: 'c.tar.gz', sha256: 'cap' }, reviewedAt: '2026-11-14', selectionRule: 'All unknown rows.', reviews: [
  { format: 'svg', caseId: 'c', outputSha256: 'o', selection: 'label-unknown', aspect: 'labels', mechanical: 'unknown', verdict: 'drawn-correctly', reason: 'All labels visible.', method: 'svg-screenshot' },
  { format: 'svg', caseId: 'b', outputSha256: 'o', selection: 'label-incorrect', aspect: 'labels', mechanical: 'incorrect', verdict: 'drawn-correctly', reason: 'The label is visible.', method: 'svg-screenshot', candidateObserverDefect: { observer: 'svg-label-observer', evidence: 'Label box measured off-canvas.' } },
  { format: 'svg', caseId: 'a', outputSha256: 'o', selection: 'obligation-failed', aspect: 'relationships', mechanical: 'passed', verdict: 'undecidable', reason: 'Edges overlap.', method: 'svg-screenshot', ...overrides },
] })

test('reviews sit beside mechanical counts, never change them, and flag contradicted failures as candidate defects', () => {
  const base = drawing(), result = withDrawingReviews(base, [reviews()])
  expect(result.results.map((l: any) => [l.counts, l.caseOutcomes])).toEqual(base.results.map(l => [l.counts, l.caseOutcomes]))
  const alpha = result.results.find((l: any) => l.project === 'alpha/a')
  expect(alpha.reviews).toMatchObject({ reviewed: 3, confirmedFailures: 0, drawnCorrectly: 2, undecidable: 1 })
  expect(alpha.reviews.contradictions).toEqual([{ caseId: 'b', aspect: 'labels', mechanical: 'incorrect', reason: 'The label is visible.', observer: 'svg-label-observer', evidence: 'Label box measured off-canvas.' }])
  // A reviewed unknown that looks correct is not a contradiction and earns no ranked pass.
  expect(contradictsMechanical({ aspect: 'labels', mechanical: 'unknown', verdict: 'drawn-correctly' })).toBe(false)
  expect(alpha.counts.correct).toBe(1)
  expect(result.results.find((l: any) => l.project === 'zeta/z').reviews).toBeUndefined()
  const text = renderDrawingReviews(result, 'svg').join('\n')
  expect(text).toContain('| alpha/a 1.0 | 1 / 1 / 1 | 3 | 0 | 2 | 1 | 1 |')
  expect(text).toContain('Candidate observer defects (mechanical verdicts unchanged):')
  expect(summarizeDrawingReviews([reviews()])[0]!.reviewed).toBe(3)
})

test('review files must state the published mechanical verdict and evidence any contradiction', () => {
  const misstated = reviews(), unevidenced = reviews()
  misstated.reviews[0] = { ...misstated.reviews[0]!, mechanical: 'correct' }
  expect(() => validateDrawingReviews(drawing(), [misstated])).toThrow('misstates the label verdict')
  delete unevidenced.reviews[1]!.candidateObserverDefect
  expect(() => validateDrawingReviews(drawing(), [unevidenced])).toThrow('observer-defect evidence')
  expect(() => validateDrawingReviews(drawing(), [{ ...reviews(), capture: { path: 'c', sha256: 'other' } }])).toThrow('different capture')
  expect(() => validateDrawingReviews(drawing(), [reviews()], evidence())).not.toThrow()
  expect(() => validateDrawingReviews(drawing(), [reviews({ mechanical: 'failed' })], evidence())).toThrow('misstates the obligation verdict')
  expect(() => validateDrawingReviews(drawing(), [reviews({ outputSha256: 'other' })], evidence(evidence().rows.map(r => ({ ...r, outputSha256: 'o' }))))).toThrow('misstates the obligation verdict')
})

const evidenceDirectory = join(import.meta.dirname, '../docs/evidence/drawing-reviews-2026-11-14')
test('committed obligation and review evidence matches the published Drawing result and its capture', () => {
  const published = JSON.parse(readFileSync(join(import.meta.dirname, '../results/release/drawing-correctness.json'), 'utf8'))
  const obligations = JSON.parse(gunzipSync(readFileSync(join(evidenceDirectory, 'obligations.json.gz'))).toString())
  const withObligations = withDrawingObligations(published, obligations), files = loadDrawingReviews(evidenceDirectory)
  expect(files.length).toBeGreaterThan(0)
  const reviewed = withDrawingReviews(withObligations, files, obligations)
  expect(reviewed.results.map((l: any) => l.counts)).toEqual(published.results.map((l: any) => l.counts))
  expect(reviewed.totals).toEqual(published.totals)
  const outputs = new Map(obligations.rows.map((r: any) => [JSON.stringify([r.project, r.format, r.caseId]), r.outputSha256]))
  for (const file of files) for (const review of file.reviews) expect(outputs.get(JSON.stringify([file.project, review.format, review.caseId]))).toBe(review.outputSha256)
  const ondine = files.find(file => file.project === 'wevm/ondine')!
  for (const format of ['svg', 'terminal']) {
    const own = published.results.find((l: any) => l.project === 'wevm/ondine' && l.format === format)
    for (const caseId of [...own.caseOutcomes.unknown, ...own.caseOutcomes.incorrect]) expect(ondine.reviews.some(r => r.format === format && r.caseId === caseId && r.aspect === 'labels')).toBe(true)
  }
  for (const format of ['svg', 'terminal']) {
    expect(renderDrawingObligations(reviewed, format).length).toBeGreaterThan(5)
    expect(renderDrawingReviews(reviewed, format).length).toBeGreaterThan(5)
  }
}, 30_000)
