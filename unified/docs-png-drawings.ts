import { createHash } from 'node:crypto'
import { inspectPng } from './png-inspection.ts'
import { sourceHash, type DocsDrawingReview, type DocsInput } from './docs-drawings.ts'

/** A review of the actual image against the complete source expectations.
 * No renderer, SVG return or nonblank check can manufacture this review. */
export interface DocsPngReview {
  id: string
  sourceSha256: string
  pngSha256: string
  expectationsSha256: string
  status: 'correct' | 'incorrect'
  reviewedBy: string
  review: string
}
export const docsExpectationsHash = (review: DocsDrawingReview) => sourceHash(JSON.stringify({ family: review.family, expected: review.expected, unverifiedFacts: review.unverifiedFacts ?? [] }))
export function admitPngReviews(inputs: readonly DocsInput[], sourceReviews: readonly DocsDrawingReview[], reviews: readonly DocsPngReview[]) {
  const seen = new Set<string>()
  for (const review of reviews) {
    const input = inputs.find(item => item.id === review.id), expected = sourceReviews.find(item => item.id === review.id)
    const key = JSON.stringify([review.id, review.pngSha256])
    if (!input || !expected || expected.intent !== 'drawing' || sourceHash(input.source) !== review.sourceSha256 || review.expectationsSha256 !== docsExpectationsHash(expected) || !/^[a-f0-9]{64}$/.test(review.pngSha256) || !['correct', 'incorrect'].includes(review.status) || !review.reviewedBy?.trim() || !review.review?.trim() || seen.has(key)) throw Error('Missing, duplicate or stale PNG content review: ' + review.id)
    seen.add(key)
  }
  return reviews
}

export function assessDocsPng(input: DocsInput, expected: DocsDrawingReview | null, bytes: Uint8Array | undefined, reviews: readonly DocsPngReview[]) {
  if (expected && (expected.id !== input.id || expected.sourceSha256 !== sourceHash(input.source))) throw Error('Stale PNG source expectation')
  if (expected?.intent === 'configuration-only') return { status: 'not-applicable', reason: expected.review }
  if (!bytes) return { status: 'unknown', reason: 'No inspectable PNG; see the separate output-return result' }
  const decoded = inspectPng(bytes, expected?.intent === 'drawing')
  if (decoded.unavailable) return { status: 'unknown', reason: decoded.findings.join('; ') }
  if (decoded.findings.length) return { status: 'incorrect', reason: decoded.findings.join('; ') }
  if (!expected) return { status: 'unknown', reason: 'No reviewed source expectation; PNG decoding supplies no correctness credit' }
  const hash = createHash('sha256').update(bytes).digest('hex')
  const review = reviews.find(item => item.id === input.id && item.sourceSha256 === sourceHash(input.source) && item.pngSha256 === hash && item.expectationsSha256 === docsExpectationsHash(expected))
  return review ? { status: review.status, reason: review.review, reviewedBy: review.reviewedBy } : { status: 'unknown', reason: 'Actual PNG lacks a complete content review bound to these source, expectation and image bytes; SVG checks cannot supply raster correctness' }
}
