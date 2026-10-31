import { createHash } from 'node:crypto'
import type { AuthoredFidelityCase, MeaningExpectation } from '../fidelity/meaning.ts'
import { assessSvgCases, type SvgEvidenceBinding } from '../fidelity/svg-assessment.ts'
import type { PaintCheck } from '../fidelity/paint.ts'
import type { BenchmarkObservation } from './types.ts'
import { docsSourcePin, docsSourceReviewProtocol, requiredDocumentationObligations, type DocsSourceReview } from './docs-source-review.ts'
import { evidenceDigest } from '../portable/evidence-contract.ts'

export interface DocsDrawingReview { id: string; sourceSha256: string; intent: 'drawing' | 'configuration-only'; family: string; expected?: MeaningExpectation; unverifiedFacts?: string[]; review: string; sourceReview?: DocsSourceReview }
export interface DocsInput { id: string; source: string; family: string }
export const sourceHash = (source: string) => createHash('sha256').update(source).digest('hex')

/** Reviews bind literal source bytes. New or edited documentation stays unknown
 * until its expectations are reviewed; reference agreement cannot supply a pass. */
export function admitDocsReviews(inputs: readonly DocsInput[], reviews: readonly DocsDrawingReview[]) {
  const byId = new Map<string, DocsDrawingReview>()
  for (const review of reviews) {
    const input = inputs.find(item => item.id === review.id)
    const source = review.sourceReview
    if (source && (source.protocol !== docsSourceReviewProtocol || source.sourcePin !== docsSourcePin || !source.method?.trim() || typeof source.expectedFactsComplete !== 'boolean' || !Array.isArray(source.requiredObligations) || !Array.isArray(source.unresolved) || !Array.isArray(source.excludedNonvisual) || [...source.requiredObligations, ...source.unresolved, ...source.excludedNonvisual].some(value => typeof value !== 'string' || !value.trim()) || new Set(source.requiredObligations).size !== source.requiredObligations.length || JSON.stringify(source.requiredObligations) !== JSON.stringify(requiredDocumentationObligations(review.expected)) || source.expectedFactsComplete && (source.unresolved.length > 0 || !!review.unverifiedFacts?.length || review.intent === 'drawing' && !source.requiredObligations.length))) throw Error('Incomplete, contradictory or stale documentation source contract: ' + review.id)
    if (byId.has(review.id) || !input || sourceHash(input.source) !== review.sourceSha256 || !review.review?.trim() || !['drawing', 'configuration-only'].includes(review.intent) || !review.family || review.intent === 'drawing' && (!Array.isArray(review.expected?.labels) || review.expected.labels.some(label => typeof label !== 'string') || !review.expected.labels.length && !review.expected.nodes?.length && !Object.keys(review.expected.facts ?? {}).length && source?.expectedFactsComplete !== false)) throw Error('Missing, duplicate or stale documentation drawing review: ' + review.id)
    byId.set(review.id, review)
  }
  return inputs.map(input => { const review = byId.get(input.id); return { id: input.id, family: input.family, sourceSha256: sourceHash(input.source), intent: review?.sourceReview?.expectedFactsComplete === false ? 'source-review-pending' : review?.intent ?? 'unreviewed', review: review ?? null } })
}

export function reviewedDocsCase(input: DocsInput, review: DocsDrawingReview): AuthoredFidelityCase {
  if (!review.expected || review.intent !== 'drawing' || review.id !== input.id || review.sourceSha256 !== sourceHash(input.source)) throw Error('Documentation source has no matching drawing expectation')
  return { id: input.id, family: review.family, source: input.source, required: true, features: ['reviewed-documentation-content'], provenance: review.review, expected: review.expected, ...(review.sourceReview ? { sourceReview: { protocol: review.sourceReview.protocol, sourceSha256: review.sourceSha256, expectedSha256: evidenceDigest(review.expected), expectedFactsComplete: review.sourceReview.expectedFactsComplete, requiredObligations: review.sourceReview.requiredObligations, unresolved: review.sourceReview.unresolved, provenance: review.review } } : {}) }
}

export function assessDocsDrawing(input: DocsInput, review: DocsDrawingReview | null, publicStatus: string, admissionPassed: boolean, checks: readonly PaintCheck[], binding?: SvgEvidenceBinding) {
  if (!review) return { status: 'unknown', reason: 'No reviewed source expectation; SVG return supplies no correctness credit' }
  if (review.id !== input.id || review.sourceSha256 !== sourceHash(input.source)) throw Error('Stale documentation source review')
  if (review.intent === 'configuration-only') return { status: 'not-applicable', reason: review.review }
  if (review.sourceReview?.expectedFactsComplete !== true) return { status: 'unknown', reason: 'Source expectations are incomplete or have no complete source contract: ' + (review.sourceReview?.unresolved.join('; ') ?? 'legacy review has no completeness metadata') }
  if (publicStatus !== 'passed') return { status: 'unknown', reason: 'Public call did not supply an inspectable SVG; see the separate render outcome' }
  const authored = reviewedDocsCase(input, review)
  const row = (surface: string, operation: string, status: BenchmarkObservation['status']): BenchmarkObservation => ({ suite: 'docs', surface, runtime: 'Chromium', family: authored.family, caseId: input.id + ':' + operation, operation, format: 'svg', mode: 'reviewed-documentation-content', status, metrics: { authoredCase: input.id, ...(binding ? binding : {}) } })
  const observations = [row('browser-public-api', 'public-svg-admission', 'passed'), row('browser-public-api', 'standalone-svg-and-labels', admissionPassed ? 'passed' : 'failed'), ...checks.map(check => row('browser-owned-ink', check.criterion, check.status === 'unavailable' ? 'blocked' : check.status))]
  const verdict = assessSvgCases([authored], observations, binding ? { [input.id]: binding } : undefined)[0]!
  if (verdict.status === 'correct' && review.unverifiedFacts?.length) return { ...verdict, status: 'unknown', reason: 'Required source facts lack an observer: ' + review.unverifiedFacts.join('; ') }
  return { ...verdict, reason: 'Reviewed authored content; layout, paint ownership and quantitative checks use the shared SVG observer' }
}
