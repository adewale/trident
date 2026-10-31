import { admitDocsReviews, sourceHash, type DocsDrawingReview, type DocsInput } from './docs-drawings.ts'
import { docsSourceAdmission } from './docs-source-admission.ts'

/** The public adapter retains the native error's fields without inventing a
 * code from source text, an adapter exception, a timeout or absent output. */
export interface DocsPublicRejectionEvidence {
  protocol: 'docs-native-public-rejection-v1'
  sourceSha256: string
  origin: 'native-public-api' | 'adapter' | 'transport'
  outcome: 'returned' | 'rejected' | 'unavailable'
  nativeError?: { name: string; code?: string; message: string; identifier?: string }
}

/** Invalid examples remain in acceptance, with their own source-bound control.
 * The narrow code vocabulary is deliberate: an arbitrary thrown Error cannot
 * establish that the public implementation recognized a duplicate identifier. */
export function assessDocsInvalidSource(input: DocsInput, review: DocsDrawingReview, evidence?: DocsPublicRejectionEvidence) {
  admitDocsReviews([input], [review])
  const admission = docsSourceAdmission(input, review)
  if (!admission.matched || review.intent !== 'invalid-source' || !review.expectedRejection) return { status: 'unknown', reason: admission.matched ? 'No reviewed invalid-source contract' : admission.reason }
  if (!evidence || evidence.protocol !== 'docs-native-public-rejection-v1' || evidence.sourceSha256 !== sourceHash(input.source) || evidence.origin !== 'native-public-api' || evidence.outcome === 'unavailable') return { status: 'unknown', reason: 'Missing source-bound native public rejection evidence; adapter and transport failures cannot satisfy the control' }
  if (evidence.outcome === 'returned') return { status: 'incorrect', reason: 'The public API accepted source that violates the independently documented identifier constraint' }
  const error = evidence.nativeError
  if (evidence.outcome !== 'rejected' || !error || !error.name?.trim() || !error.message?.trim() || !['DUPLICATE_IDENTIFIER', 'DUPLICATE_ID'].includes(error.code ?? '') || !error.identifier || !review.expectedRejection.identifiers.includes(error.identifier) || !error.message.includes(error.identifier)) return { status: 'unknown', reason: 'A native typed duplicate-identifier rejection naming the documented offending identity is required; generic exceptions receive no pass' }
  return { status: 'correct', reason: 'Native public rejection identifies the independently documented duplicate identity', category: review.expectedRejection.category, identifier: error.identifier }
}
