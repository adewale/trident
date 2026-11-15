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

/** A callback's distinct unsupported verdicts. Case rows carry them as an array; rows
 * collected before that carry only the reason, the verdicts joined with '; '. A verdict's
 * own wording can contain '; ', so such a reason is read as one verdict, repeated or not.
 * In the 14 November runs no callback has two distinct assessment verdicts (their audits
 * record each verdict separately), so this reading loses nothing there. */
export function unsupportedVerdicts(row: { reason?: unknown; unsupportedVerdicts?: string[] }) {
  if (Array.isArray(row.unsupportedVerdicts)) return [...new Set(row.unsupportedVerdicts)]
  const reason = String(row.reason ?? '').trim()
  if (!reason) return []
  for (let end = reason.indexOf('; '); end >= 0; end = reason.indexOf('; ', end + 2)) {
    const verdict = reason.slice(0, end), repeats = (reason.length + 2) / (verdict.length + 2)
    if (Number.isInteger(repeats) && Array(repeats).fill(verdict).join('; ') === reason) return [verdict]
  }
  return [reason]
}

export interface AssessmentConfirmations { confirmed(project: string, reason: string): boolean; files: number }

/** Confirmations from capability and model-concept review files. Only a verdict that is
 * exactly `confirmed` counts; `disproved`, partial verdicts and unprobed entries do not. */
/** Reasons as review files record them: the merged result's reason tables, which the
 * model-concept review was drawn from, replace every number with N ("per CN element" for
 * the verdict "per C4 element"), so reasons are compared in that form. */
const reasonKey = (reason: string) => reason.replace(/\d+/g, 'N')

export function assessmentConfirmations(reviews: readonly any[]): AssessmentConfirmations {
  const byBasis = new Set<string>(), byReason = new Set<string>()
  for (const review of reviews) {
    if (review?.protocol === 'fidelity-model-concept-review-v1') {
      for (const concept of review.concepts ?? [])
        if (concept.verdict === 'confirmed' && !concept.supersededBy) for (const [project, reasons] of Object.entries(concept.projects ?? {})) for (const reason of Object.keys(reasons as object)) byReason.add(project + '\u0000' + reasonKey(reason))
    } else if (Array.isArray(review?.assessments)) {
      for (const entry of review.assessments)
        if (entry.verdict === 'confirmed' && entry.basis !== 'model-concept' && Array.isArray(entry.projects)) for (const project of entry.projects) byBasis.add(entry.basis + '\u0000' + project)
    } else throw Error('Not a Fidelity capability or model-concept review file')
  }
  return {
    files: reviews.length,
    confirmed(project, reason) {
      const basis = assessmentBasis(reason)
      return basis === 'model-concept' ? byReason.has(project + '\u0000' + reasonKey(reason)) : byBasis.has(basis + '\u0000' + project)
    },
  }
}

/** Whether a case row is a capability assessment whose every reason a review confirmed. */
export function confirmedAbsence(project: string, row: { status: string; reason?: unknown; unsupportedKind?: any; unsupportedVerdicts?: string[] }, confirmations: AssessmentConfirmations | undefined) {
  if (!confirmations || outcomeKind(row) !== 'capability-assessment') return false
  const verdicts = unsupportedVerdicts(row)
  return verdicts.length > 0 && verdicts.every(reason => confirmations.confirmed(project, reason))
}
