import { admitCaseEvidenceContract, admitCheckedEvidence, admitInvocationEvidence, evidenceBytesDigest, evidenceDigest, type CaseEvidenceContract, type CheckedEvidence, type InvocationEvidence } from './evidence-contract.ts'
import type { TimingPlan, TimingSample } from './qualified-timing.ts'

/** A new observer/expectation interpretation of an unchanged collection. The
 * old capture plan, source population, artifacts and clocks stay authoritative.
 * Callers still use the existing complete-source contract builders: this policy
 * does not supply missing source review or observer qualification. */
export interface TimingGrading {
  schema: 'trident-derived-timing-grading-v1'
  collectionPlanSha256: string
  cases: readonly CaseEvidenceContract[]
  observerSha256: string
  reason: string
  provenance: { source: string; sha256: string }
  checks: readonly { attemptId: string; checked: CheckedEvidence }[]
}
export type TimingGradingPolicy = Omit<TimingGrading, 'checks'>
function fail(message: string): never { throw Error('Invalid derived timing grading: ' + message) }
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0
const digest = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

function admitPolicy(plan: TimingPlan, value: TimingGradingPolicy): Readonly<TimingGradingPolicy> {
  if (!value || value.schema !== 'trident-derived-timing-grading-v1' || value.collectionPlanSha256 !== evidenceDigest(plan) || !digest(value.observerSha256) || !text(value.reason) || !value.provenance || !text(value.provenance.source) || !digest(value.provenance.sha256)) fail('parent collection, observer, reason and grading-source identity are required')
  if (Object.keys(value).some(key => !['schema', 'collectionPlanSha256', 'cases', 'observerSha256', 'reason', 'provenance', 'checks'].includes(key))) fail('grading cannot override collection artifacts, sampling or clocks')
  if (!Array.isArray(value.cases) || value.cases.length !== plan.cases.length || new Set(value.cases.map(contract => contract.caseId)).size !== value.cases.length) fail('grading must retain every original case exactly once')
  const cases = value.cases.map(admitCaseEvidenceContract)
  for (const original of plan.cases) if (!cases.some(contract => contract.caseId === original.caseId && contract.sourceSha256 === original.sourceSha256)) fail('grading cannot replace, add or select source cases')
  return Object.freeze({ schema: value.schema, collectionPlanSha256: value.collectionPlanSha256, cases: Object.freeze(plan.cases.map(original => cases.find(contract => contract.caseId === original.caseId)!)), observerSha256: value.observerSha256, reason: value.reason, provenance: Object.freeze({ source: value.provenance.source, sha256: value.provenance.sha256 }) })
}

/** Validate fresh rows against the new contracts. Old checks are never rehashed
 * or promoted; a missing observation remains missing under its own contract. */
export function admitTimingGrading(plan: TimingPlan, samples: readonly TimingSample[], value: TimingGrading): Readonly<TimingGrading> {
  const policy = admitPolicy(plan, value)
  if (!Array.isArray(value.checks) || value.checks.length !== samples.length || new Set(value.checks.map(row => row.attemptId)).size !== value.checks.length) fail('fresh checks must cover every original invocation exactly once')
  const invocations = samples.map(sample => admitInvocationEvidence(sample.invocation)), byAttempt = new Map(invocations.map(invocation => [invocation.attemptId, invocation])), contracts = new Map(policy.cases.map(contract => [contract.caseId, contract]))
  const checks = value.checks.map(row => {
    const invocation = byAttempt.get(row.attemptId)
    if (!invocation || !invocation.output) fail('fresh check belongs to no retained original return')
    const contract = contracts.get(invocation.identity.caseId)
    if (!contract) fail('fresh check has no active source contract')
    const checked = admitCheckedEvidence(contract, row.checked)
    if (checked.observerSha256 !== policy.observerSha256 || checked.outputSha256 !== invocation.output.sha256) fail('fresh check belongs to a stale observer or different measured bytes')
    return Object.freeze({ attemptId: row.attemptId, checked })
  })
  const checkedAttempts = new Set(checks.map(row => row.attemptId))
  if (invocations.some(invocation => !checkedAttempts.has(invocation.attemptId))) fail('fresh grading omitted an original invocation')
  return Object.freeze({ ...policy, checks: Object.freeze(checks) })
}

/** Invoke the current checker on the actual retained bytes outside all clocks.
 * The checker returns its own bound evidence. This function never changes an
 * old row's expectation/observer hashes to make it look freshly checked. */
export async function deriveTimingGrading(
  plan: TimingPlan,
  samples: readonly TimingSample[],
  readOutput: (output: NonNullable<InvocationEvidence['output']>) => Uint8Array,
  policy: TimingGradingPolicy,
  inspect: (input: { contract: CaseEvidenceContract; invocation: InvocationEvidence; bytes: Uint8Array; observerSha256: string }) => CheckedEvidence | Promise<CheckedEvidence>,
): Promise<Readonly<TimingGrading>> {
  const admitted = admitPolicy(plan, policy), contracts = new Map(admitted.cases.map(contract => [contract.caseId, contract])), checks: { attemptId: string; checked: CheckedEvidence }[] = []
  for (const sample of samples) {
    const invocation = admitInvocationEvidence(sample.invocation)
    if (invocation.state !== 'returned' || !invocation.output) fail('cannot invent a fresh check for an absent original return')
    const contract = contracts.get(sample.caseId)
    if (!contract || invocation.identity.caseId !== contract.caseId || invocation.identity.sourceSha256 !== contract.sourceSha256) fail('measured source differs from the active grading contract')
    const bytes = readOutput(invocation.output)
    if (bytes.byteLength !== invocation.output.bytes || evidenceBytesDigest(bytes) !== invocation.output.sha256) fail('retained measured bytes changed before regrading')
    const checked = await inspect({ contract, invocation, bytes, observerSha256: admitted.observerSha256 })
    checks.push({ attemptId: invocation.attemptId, checked })
  }
  return admitTimingGrading(plan, samples, { ...admitted, checks })
}
