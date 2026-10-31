import { createHash } from 'node:crypto'
import { inspectPng, type PngPixelIdentity } from './png-inspection.ts'
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
  /** Derived from the reviewed original PNG, never a perceptual-image hash. */
  pixels?: PngPixelIdentity
}
export const docsExpectationsHash = (review: DocsDrawingReview) => {
  const sourceReview = (review as DocsDrawingReview & { sourceReview?: unknown }).sourceReview
  return sourceHash(JSON.stringify({ family: review.family, expected: review.expected, unverifiedFacts: review.unverifiedFacts ?? [], ...(sourceReview ? { sourceReview } : {}) }))
}
const validPixels = (pixels: PngPixelIdentity | undefined) => pixels === undefined || !!pixels && typeof pixels === 'object' && pixels.protocol === 'png-rgba16-and-display-metadata-v1' && /^[a-f0-9]{64}$/.test(pixels.sha256) && Number.isSafeInteger(pixels.width) && Number.isSafeInteger(pixels.height) && pixels.width > 0 && pixels.height > 0 && pixels.width * pixels.height <= 16 * 1024 * 1024
const samePixels = (left: PngPixelIdentity, right: PngPixelIdentity) => left.protocol === right.protocol && left.width === right.width && left.height === right.height && left.sha256 === right.sha256
export function admitPngReviews(inputs: readonly DocsInput[], sourceReviews: readonly DocsDrawingReview[], reviews: readonly DocsPngReview[]) {
  const seen = new Set<string>()
  const pixelVerdicts = new Map<string, DocsPngReview['status']>()
  for (const review of reviews) {
    const input = inputs.find(item => item.id === review.id), expected = sourceReviews.find(item => item.id === review.id)
    const key = JSON.stringify([review.id, review.pngSha256])
    if (!input || !expected || expected.intent !== 'drawing' || sourceHash(input.source) !== review.sourceSha256 || review.expectationsSha256 !== docsExpectationsHash(expected) || !/^[a-f0-9]{64}$/.test(review.pngSha256) || !['correct', 'incorrect'].includes(review.status) || !review.reviewedBy?.trim() || !review.review?.trim() || !validPixels(review.pixels) || seen.has(key)) throw Error('Missing, duplicate or stale PNG content review: ' + review.id)
    seen.add(key)
    if (review.pixels) {
      const identity = JSON.stringify([review.id, review.sourceSha256, review.expectationsSha256, review.pixels.protocol, review.pixels.width, review.pixels.height, review.pixels.sha256])
      const previous = pixelVerdicts.get(identity)
      if (previous && previous !== review.status) throw Error('Conflicting PNG reviews for identical decoded pixels: ' + review.id)
      pixelVerdicts.set(identity, review.status)
    }
  }
  return reviews
}

/** Import an existing image review using its actual original bytes. Re-encoding
 * may reuse the verdict only if every decoded RGBA16 sample, dimensions and
 * display-affecting metadata agree. This does not create a content review. */
export function bindPngReviewPixels(input: DocsInput, expected: DocsDrawingReview, review: DocsPngReview, originalPng: Uint8Array): DocsPngReview {
  admitPngReviews([input], [expected], [review])
  if (createHash('sha256').update(originalPng).digest('hex') !== review.pngSha256) throw Error('PNG pixel baseline is not the reviewed original image')
  const decoded = inspectPng(originalPng, false)
  if (decoded.findings.length || !decoded.pixelIdentity) throw Error('Reviewed PNG baseline cannot be fully decoded: ' + decoded.findings.join('; '))
  if (review.pixels && !samePixels(review.pixels, decoded.pixelIdentity)) throw Error('PNG review pixel identity differs from its original image')
  return { ...review, pixels: decoded.pixelIdentity }
}

export function assessDocsPng(input: DocsInput, expected: DocsDrawingReview | null, bytes: Uint8Array | undefined, reviews: readonly DocsPngReview[]) {
  if (expected && (expected.id !== input.id || expected.sourceSha256 !== sourceHash(input.source))) throw Error('Stale PNG source expectation')
  if (expected?.intent === 'configuration-only') return { status: 'not-applicable', reason: expected.review }
  if (!bytes) return { status: 'unknown', reason: 'No inspectable PNG; see the separate output-return result' }
  // A drawing may deliberately contain no marks (for example an empty Gantt).
  // Only explicit visible labels/bodies/routes justify a nonblank requirement.
  const requiresInk = !!expected?.expected && (!!expected.expected.labels.some(label => label.trim()) || !!expected.expected.nodes?.length || !!expected.expected.edges?.length || !!expected.expected.groups?.length)
  const decoded = inspectPng(bytes, requiresInk)
  if (decoded.unavailable) return { status: 'unknown', reason: decoded.findings.join('; ') }
  if (decoded.findings.length) return { status: 'incorrect', reason: decoded.findings.join('; ') }
  if (!expected) return { status: 'unknown', reason: 'No reviewed source expectation; PNG decoding supplies no correctness credit' }
  const hash = createHash('sha256').update(bytes).digest('hex')
  const own = reviews.filter(item => item.id === input.id && item.sourceSha256 === sourceHash(input.source) && item.expectationsSha256 === docsExpectationsHash(expected))
  for (const item of own) if (item.pngSha256 === hash && item.pixels && (!validPixels(item.pixels) || !decoded.pixelIdentity || !samePixels(item.pixels, decoded.pixelIdentity))) throw Error('PNG review pixels contradict its actual reviewed bytes')
  const review = own.find(item => ['correct', 'incorrect'].includes(item.status) && !!item.reviewedBy?.trim() && !!item.review?.trim() && validPixels(item.pixels) && (item.pngSha256 === hash || !!item.pixels && !!decoded.pixelIdentity && samePixels(item.pixels, decoded.pixelIdentity)))
  if (!review) return { status: 'unknown', reason: 'Actual PNG lacks a complete content review bound to these source, expectation and image bytes or exact decoded pixels; SVG checks cannot supply raster correctness' }
  const sourceReview = (expected as DocsDrawingReview & { sourceReview?: { expectedFactsComplete?: boolean; unresolved?: unknown[] } }).sourceReview
  if (review.status === 'correct' && (expected.unverifiedFacts?.length || sourceReview && (sourceReview.expectedFactsComplete !== true || sourceReview.unresolved?.length))) return { status: 'unknown', reason: 'Required source facts remain unresolved; an image review cannot complete the source contract' }
  return { status: review.status, reason: review.review, reviewedBy: review.reviewedBy, evidence: { method: itemMethod(review, hash), reviewedPngSha256: review.pngSha256, actualPngSha256: hash, ...(decoded.pixelIdentity ? { pixels: decoded.pixelIdentity } : {}) } }
}
const itemMethod = (review: DocsPngReview, actualSha256: string) => review.pngSha256 === actualSha256 ? 'reviewed-exact-png-bytes' : 'reviewed-exact-decoded-pixels'
