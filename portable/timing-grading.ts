import { admitCaseEvidenceContract, admitCheckedEvidence, admitInvocationEvidence, evidenceBytesDigest, evidenceDigest, type CaseEvidenceContract, type CheckedEvidence, type InvocationEvidence } from './evidence-contract.ts'
import type { TimingPlan, TimingSample } from './qualified-timing.ts'

/** A new observer/expectation interpretation of an unchanged collection. The
 * old capture plan, source population, artifacts and clocks stay authoritative.
 * Callers still use the existing complete-source contract builders: this policy
 * does not supply missing source review or observer qualification. */
export interface TimingGrading {
  schema: 'trident-derived-timing-grading-v1'
  collectionPlanSha256: string
  /** Original invocation UUIDs, clocks and old checks, preserved as history. */
  collectionSamplesSha256: string
  /** Present when raw returns omitted by the old grader are recovered. */
  collectionJournalSha256?: string
  cases: readonly CaseEvidenceContract[]
  observerSha256: string
  reason: string
  provenance: { source: string; sha256: string }
  checks: readonly { attemptId: string; checked: CheckedEvidence }[]
}
export type TimingGradingPolicy = Omit<TimingGrading, 'checks' | 'collectionSamplesSha256' | 'collectionJournalSha256'>
function fail(message: string): never { throw Error('Invalid derived timing grading: ' + message) }
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0
const digest = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

function admitPolicy(plan: TimingPlan, value: TimingGradingPolicy): Readonly<TimingGradingPolicy> {
  if (!value || value.schema !== 'trident-derived-timing-grading-v1' || value.collectionPlanSha256 !== evidenceDigest(plan) || !digest(value.observerSha256) || !text(value.reason) || !value.provenance || !text(value.provenance.source) || !digest(value.provenance.sha256)) fail('parent collection, observer, reason and grading-source identity are required')
  if (Object.keys(value).some(key => !['schema', 'collectionPlanSha256', 'cases', 'observerSha256', 'reason', 'provenance', 'checks', 'collectionSamplesSha256', 'collectionJournalSha256'].includes(key))) fail('grading cannot override collection artifacts, sampling or clocks')
  if (!Array.isArray(value.cases) || value.cases.length !== plan.cases.length || new Set(value.cases.map(contract => contract.caseId)).size !== value.cases.length) fail('grading must retain every original case exactly once')
  const cases = new Map(value.cases.map(item => { const contract = admitCaseEvidenceContract(item); return [contract.caseId, contract] }))
  for (const original of plan.cases) if (cases.get(original.caseId)?.sourceSha256 !== original.sourceSha256) fail('grading cannot replace, add or select source cases')
  return Object.freeze({ schema: value.schema, collectionPlanSha256: value.collectionPlanSha256, cases: Object.freeze(plan.cases.map(original => cases.get(original.caseId)!)), observerSha256: value.observerSha256, reason: value.reason, provenance: Object.freeze({ source: value.provenance.source, sha256: value.provenance.sha256 }) })
}

export type TimingCapturedSample = Omit<TimingSample, 'checked'> & { checked?: CheckedEvidence }
const journalDigest = (journal: readonly InvocationEvidence[]) => evidenceDigest(journal.map(admitInvocationEvidence).sort((left, right) => { const a = left.attemptId + ':' + left.state, b = right.attemptId + ':' + right.state; return a < b ? -1 : a > b ? 1 : 0 }))

/** Recover coordinate rows from actual raw returns, never from an old pass or
 * an inferred clock. Existing samples must agree with their owning raw return.
 * Missing starts/errors remain in the exhaustive journal for final rejection. */
export function materializeTimingSamples(plan: TimingPlan, samples: readonly TimingSample[], journal?: readonly InvocationEvidence[]): readonly TimingCapturedSample[] {
  if (!journal) return samples
  const parent = evidenceDigest(plan), returned = journal.map(admitInvocationEvidence).filter(frame => frame.state === 'returned'), byAttempt = new Map(samples.map(sample => [sample.invocation.attemptId, sample]))
  if (byAttempt.size !== samples.length) fail('original samples contain duplicate invocation IDs')
  const cases = new Map(plan.cases.map(contract => [contract.caseId, contract])), found = new Set<string>()
  const rows = returned.map(invocation => {
    let coordinate: unknown
    try { coordinate = JSON.parse(invocation.identity.coordinate ?? '') } catch { fail('raw return has no original planned sampling coordinate') }
    if (!Array.isArray(coordinate) || coordinate.length !== 5) fail('raw return has an invalid sampling coordinate')
    const [planSha256, round, replica, caseId, sample] = coordinate
    if (planSha256 !== parent || !Number.isSafeInteger(round) || round < 1 || round > plan.rounds || !['A0', 'A1', 'B'].includes(replica) || typeof caseId !== 'string' || !Number.isSafeInteger(sample) || sample < 0 || sample >= plan.samplesPerRound) fail('raw return is outside its original collection plan')
    const contract = cases.get(caseId), artifact = plan.artifacts[replica as TimingSample['replica']]
    if (!contract || invocation.identity.caseId !== caseId || invocation.identity.sourceSha256 !== contract.sourceSha256 || invocation.identity.project !== artifact.project || invocation.identity.artifactSha256 !== artifact.artifactSha256 || invocation.identity.bindingSha256 !== artifact.bindingSha256 || invocation.identity.format !== plan.format || invocation.measurement?.planSha256 !== parent) fail('raw return changes the planned source, artifact or captured clock identity')
    const old = byAttempt.get(invocation.attemptId)
    if (old && (old.round !== round || old.replica !== replica || old.caseId !== caseId || old.sample !== sample || evidenceDigest(old.invocation) !== evidenceDigest(invocation))) fail('original sample contradicts its raw invocation')
    found.add(invocation.attemptId)
    return { round, replica, caseId, sample, invocation, ...(old ? { checked: old.checked } : {}) } as TimingCapturedSample
  })
  if (samples.some(sample => !found.has(sample.invocation.attemptId))) fail('original sample has no matching raw returned invocation')
  return rows
}

/** Validate fresh rows against the new contracts. Old checks are never rehashed
 * or promoted; a missing observation remains missing under its own contract. */
export function admitTimingGrading(plan: TimingPlan, samples: readonly TimingSample[], value: TimingGrading, journal?: readonly InvocationEvidence[]): Readonly<TimingGrading> {
  const policy = admitPolicy(plan, value)
  if (value.collectionSamplesSha256 !== evidenceDigest(samples)) fail('original invocation clocks, UUIDs or collected checks changed after grading')
  const measured = materializeTimingSamples(plan, samples, journal), originalAttempts = new Set(samples.map(sample => sample.invocation.attemptId)), recovered = measured.some(sample => !originalAttempts.has(sample.invocation.attemptId))
  if (value.collectionJournalSha256 !== undefined && (!journal || value.collectionJournalSha256 !== journalDigest(journal)) || recovered && !value.collectionJournalSha256) fail('recovered grading requires the exact original exhaustive journal')
  if (!Array.isArray(value.checks) || value.checks.length !== measured.length || new Set(value.checks.map(row => row.attemptId)).size !== value.checks.length) fail('fresh checks must cover every original invocation exactly once')
  const invocations = measured.map(sample => admitInvocationEvidence(sample.invocation)), byAttempt = new Map(invocations.map(invocation => [invocation.attemptId, invocation])), contracts = new Map(policy.cases.map(contract => [contract.caseId, contract]))
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
  return Object.freeze({ ...policy, collectionSamplesSha256: value.collectionSamplesSha256, ...(value.collectionJournalSha256 ? { collectionJournalSha256: value.collectionJournalSha256 } : {}), checks: Object.freeze(checks) })
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
  journal?: readonly InvocationEvidence[],
): Promise<Readonly<TimingGrading>> {
  const admitted = admitPolicy(plan, policy), collectionSamplesSha256 = evidenceDigest(samples), collectionJournalSha256 = journal ? journalDigest(journal) : undefined, measured = materializeTimingSamples(plan, samples, journal), contracts = new Map(admitted.cases.map(contract => [contract.caseId, contract])), checks: { attemptId: string; checked: CheckedEvidence }[] = []
  for (const sample of measured) {
    const invocation = admitInvocationEvidence(sample.invocation)
    if (invocation.state !== 'returned' || !invocation.output) fail('cannot invent a fresh check for an absent original return')
    const contract = contracts.get(sample.caseId)
    if (!contract || invocation.identity.caseId !== contract.caseId || invocation.identity.sourceSha256 !== contract.sourceSha256) fail('measured source differs from the active grading contract')
    const bytes = readOutput(invocation.output)
    if (bytes.byteLength !== invocation.output.bytes || evidenceBytesDigest(bytes) !== invocation.output.sha256) fail('retained measured bytes changed before regrading')
    const checked = await inspect({ contract, invocation, bytes, observerSha256: admitted.observerSha256 })
    checks.push({ attemptId: invocation.attemptId, checked })
  }
  return admitTimingGrading(plan, samples, { ...admitted, collectionSamplesSha256, ...(collectionJournalSha256 ? { collectionJournalSha256 } : {}), checks }, journal)
}
