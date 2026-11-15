/** Evidence that turns an unsupported verdict into a known nonpass under Fidelity scoring
 * v3 (scoring.ts). Without evidence a verdict stays unassessed.
 *
 * - A native refusal (outcome-kinds.ts `native-unsupported`) is verified when the pinned
 *   Mermaid oracle accepts every source the candidate refused in that callback: the
 *   candidate refused valid Mermaid. A source the oracle also rejects was never valid
 *   Mermaid input (a test fragment, a deliberately invalid diagram), so that refusal is
 *   not evidence against the candidate.
 * - A capability assessment is confirmed when a recorded review confirmed every reason
 *   it gives: a model concept by its exact reason for that project
 *   (docs/evidence/fidelity-model-concept-review-*.json), any other basis by basis and
 *   project (docs/evidence/fidelity-capability-review-*.json). */
import { createHash } from 'node:crypto'
import { assessmentBasis, outcomeKind } from './outcome-kinds.ts'

export const REFUSAL_VERIFICATION_PROTOCOL = 'fidelity-refusal-verification-v1'
export const sourceDigest = (source: string) => createHash('sha256').update(source).digest('hex')

export interface OracleVerdict { accepted: boolean; diagramType?: string; error?: string }
export interface RefusalVerification { protocol: string; oracle: Record<string, string>; verdicts: Record<string, OracleVerdict> }

export function checkRefusalVerification(value: any): RefusalVerification {
  if (value?.protocol !== REFUSAL_VERIFICATION_PROTOCOL || !value.verdicts || typeof value.verdicts !== 'object') throw Error('Not a Fidelity refusal verification file')
  return value
}

/** Whether a case row is a native refusal of valid Mermaid. */
export function verifiedRefusal(row: { status: string; reason?: unknown; unsupportedKind?: any; refusedSources?: string[] }, verification: RefusalVerification | undefined) {
  if (!verification || outcomeKind(row) !== 'native-unsupported' || !row.refusedSources?.length) return false
  return row.refusedSources.every(source => verification.verdicts[sourceDigest(source)]?.accepted === true)
}

/** The parts of a callback's unsupported reason (runtime.ts joins verdicts with '; '). */
const reasonParts = (reason: unknown) => [...new Set(String(reason ?? '').split('; ').map(part => part.trim()).filter(Boolean))]

export interface AssessmentConfirmations { confirmed(project: string, reason: string): boolean; files: number }

/** Confirmations from capability and model-concept review files. Only a verdict that is
 * exactly `confirmed` counts; `disproved`, partial verdicts and unprobed entries do not. */
export function assessmentConfirmations(reviews: readonly any[]): AssessmentConfirmations {
  const byBasis = new Set<string>(), byReason = new Set<string>()
  for (const review of reviews) {
    if (review?.protocol === 'fidelity-model-concept-review-v1') {
      for (const concept of review.concepts ?? [])
        if (concept.verdict === 'confirmed' && !concept.supersededBy) for (const [project, reasons] of Object.entries(concept.projects ?? {})) for (const reason of Object.keys(reasons as object)) byReason.add(project + '\u0000' + reason)
    } else if (Array.isArray(review?.assessments)) {
      for (const entry of review.assessments)
        if (entry.verdict === 'confirmed' && entry.basis !== 'model-concept' && Array.isArray(entry.projects)) for (const project of entry.projects) byBasis.add(entry.basis + '\u0000' + project)
    } else throw Error('Not a Fidelity capability or model-concept review file')
  }
  return {
    files: reviews.length,
    confirmed(project, reason) {
      const basis = assessmentBasis(reason)
      return basis === 'model-concept' ? byReason.has(project + '\u0000' + reason) : byBasis.has(basis + '\u0000' + project)
    },
  }
}

/** Whether a case row is a capability assessment whose every reason a review confirmed. */
export function confirmedAbsence(project: string, row: { status: string; reason?: unknown; unsupportedKind?: any }, confirmations: AssessmentConfirmations | undefined) {
  if (!confirmations || outcomeKind(row) !== 'capability-assessment') return false
  const parts = reasonParts(row.reason)
  return parts.length > 0 && parts.every(reason => confirmations.confirmed(project, reason))
}
