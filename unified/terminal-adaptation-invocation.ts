import { evidenceDigest, type InvocationEvidence, type InvocationIdentity } from '../portable/evidence-contract.ts'

/** One fresh-source correctness call needs one coherent durable start/outcome.
 * Legacy Python frames omit predecessor hashes; equal attempt, full identity
 * and call-entry clocks remain mandatory, and a supplied hash must verify. */
export function bindTerminalAdaptationInvocation(records: readonly Readonly<InvocationEvidence>[], attemptId: string, expected: Pick<InvocationIdentity, 'project' | 'caseId' | 'sourceSha256' | 'artifactSha256' | 'format'>) {
  const starts = records.filter(frame => frame.state === 'started')
  const outcomes = records.filter(frame => frame.state === 'returned' || frame.state === 'public-error')
  if (records.length !== 2 || starts.length !== 1 || outcomes.length !== 1 || starts[0]!.attemptId !== attemptId || outcomes[0]!.attemptId !== attemptId) throw Error('New correctness call needs exactly one matching durable start and completed outcome')
  const start = starts[0]!, outcome = outcomes[0]!
  if (evidenceDigest(start.identity) !== evidenceDigest(outcome.identity) || start.startedAt !== outcome.startedAt || Object.entries(expected).some(([key, value]) => outcome.identity[key as keyof InvocationIdentity] !== value) || outcome.startedReceiptSha256 !== undefined && outcome.startedReceiptSha256 !== evidenceDigest(start)) throw Error('New correctness call has stale or mixed source/artifact/binding/start evidence')
  return outcome
}
