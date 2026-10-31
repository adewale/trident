import { expect, test } from 'bun:test'
import { defineCaseEvidenceContract, evidenceBytesDigest as hash, evidenceDigest, type CheckedEvidence, type InvocationEvidence } from '../portable/evidence-contract.ts'
import { qualifyTiming, type TimingPlan, type TimingSample } from '../portable/qualified-timing.ts'
const bytes = Buffer.from('<svg>independently checked fixture drawing</svg>')
function fixture() {
  const contract = defineCaseEvidenceContract({ caseId: 'source:chain', source: 'flowchart LR; A-->B', expectations: { labels: ['A', 'B'], edge: ['A', 'B'] }, requiredChecks: [{ surface: 'paint', criterion: 'complete-chain' }] })
  const artifact = { project: 'fixture/reference', artifactSha256: hash('reference artifact'), bindingSha256: hash('public SVG call') }
  const plan: TimingPlan = { schema: 'trident-qualified-timing-plan-v1', boundary: 'public SVG API through returned bytes; import excluded', format: 'svg', track: 'first-use', environmentSha256: hash('frozen environment'), observerSha256: hash('independently qualified fixture observer'), rounds: 6, samplesPerRound: 2, maximumControlSpread: .25, cases: [contract], artifacts: { A0: artifact, A1: artifact, B: { ...artifact, project: 'fixture/candidate', artifactSha256: hash('candidate artifact') } } }
  const samples: TimingSample[] = []
  for (let round = 1; round <= plan.rounds; round++) for (const replica of ['A0', 'A1', 'B'] as const) for (let sample = 0; sample < plan.samplesPerRound; sample++) {
    const identity = plan.artifacts[replica], start = Date.UTC(2026, 9, 31) + samples.length * 20
    const invocation: InvocationEvidence = { schema: 'trident-invocation-evidence-v1', attemptId: 'actual-fixture-call-' + samples.length, identity: { ...identity, caseId: contract.caseId, sourceSha256: contract.sourceSha256, format: 'svg', coordinate: JSON.stringify([evidenceDigest(plan),round,replica,contract.caseId,sample]) }, measurement: { planSha256: evidenceDigest(plan), environmentSha256: plan.environmentSha256, boundary: plan.boundary, track: plan.track, clockDomainId: 'fixture-monotonic-controller', executionInstanceId: replica+'-fresh-instance-'+round, sequence: samples.length, monotonicStartNs: String(BigInt(samples.length) * 20_000_000n), monotonicFinishNs: String(BigInt(samples.length) * 20_000_000n + 10_000_000n) }, state: 'returned', startedAt: new Date(start).toISOString(), finishedAt: new Date(start + 10).toISOString(), durationMs: replica === 'B' ? 5 : 10, output: { path: 'actual.svg', bytes: bytes.length, sha256: hash(bytes) }, detail: 'Synthetic deterministic clock fixture, not a renderer measurement' }
    const checked: CheckedEvidence = { schema: 'trident-checked-evidence-v1', caseId: contract.caseId, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: hash(bytes), observerSha256: plan.observerSha256, checks: contract.requiredChecks.map(check => ({ ...check, status: 'passed', detail: 'Independent authored fixture observation' })) }
    samples.push({ round, sample, replica, caseId: contract.caseId, invocation, checked })
  }
  return { plan, samples }
}
const journalOf=(samples:TimingSample[])=>samples.flatMap(sample=>[{...sample.invocation,state:'started' as const,startedAt:sample.invocation.startedAt??'2026-10-31T00:00:00.000Z',finishedAt:null,durationMs:null,output:null,measurement:sample.invocation.measurement?{...sample.invocation.measurement,monotonicFinishNs:null}:undefined},sample.invocation])
const qualify=(plan:TimingPlan,samples:TimingSample[],reader:()=>Uint8Array)=>qualifyTiming(plan,samples,reader,journalOf(samples))
test('timing requires a checked actual output for every fixed-plan invocation', () => {
  const { plan, samples } = fixture(), result = qualify(plan, samples, () => bytes)
  expect(result).toMatchObject({ status: 'qualified', planned: 36, checked: 36, medianMs: 5 })
  expect(result.calibration.candidateRatio).toBe(.5)
  expect(result.calibration.roundRatioUncertainty?.replicaB.interval).not.toBeNull()
  samples[17]!.checked.checks = []
  expect(qualify(plan, samples, () => bytes)).toMatchObject({ status: 'unqualified', medianMs: null, checked: 35 })
})
test('one passing initial output cannot qualify missing, failed or changed repeated outputs', () => {
  const { plan, samples } = fixture()
  expect(qualify(plan, samples.slice(0, 1), () => bytes).status).toBe('unqualified')
  samples[7]!.checked.checks = samples[7]!.checked.checks.map(check => ({ ...check, status: 'failed' }))
  expect(qualify(plan, samples, () => bytes).medianMs).toBeNull()
  expect(() => qualify(plan, samples, () => Buffer.from('wrong bytes'))).toThrow('output changed')
})
test('stale expectations, observer, artifacts, duplicate calls and invalid A/A controls reject', () => {
  for (const mutate of [
    (sample: TimingSample) => { sample.checked.expectationsSha256 = hash('stale') },
    (sample: TimingSample) => { sample.checked.observerSha256 = hash('other observer') },
    (sample: TimingSample) => { sample.invocation.identity.bindingSha256 = hash('different API') },
    (sample: TimingSample) => { sample.invocation.attemptId = 'actual-fixture-call-0' }
  ]) { const { plan, samples } = fixture(); mutate(samples[5]!); expect(() => qualify(plan, samples, () => bytes)).toThrow() }
  const { plan, samples } = fixture(); plan.artifacts.A1 = { ...plan.artifacts.A1, artifactSha256: hash('different') }
  expect(() => qualify(plan, samples, () => bytes)).toThrow('A/A')
})
test('unknown clocks and overlapping measured calls withhold speed', () => {
  const { plan, samples } = fixture()
  samples[4]!.invocation.startedAt = null
  expect(qualify(plan, samples, () => bytes).status).toBe('unqualified')
  const other = fixture(); other.samples[4]!.invocation.measurement!.monotonicStartNs = other.samples[3]!.invocation.measurement!.monotonicStartNs
  expect(qualify(other.plan, other.samples, () => bytes).gaps.join(' ')).toContain('overlapped')
})

test('host and boundary relabelling and zero-width cloned clocks cannot qualify', () => {
  for (const field of ['environmentSha256', 'boundary', 'track'] as const) {
    const {plan,samples}=fixture(); samples[9]!.invocation.measurement![field]=field==='environmentSha256'?hash('other host'):'other boundary or track'
    expect(()=>qualify(plan,samples,()=>bytes)).toThrow('actual sample context')
  }
  const {plan,samples}=fixture(); for (const sample of samples) { sample.invocation.measurement!.monotonicStartNs='0'; sample.invocation.measurement!.monotonicFinishNs='0' }
  expect(()=>qualify(plan,samples,()=>bytes)).toThrow('monotonic invocation envelope')
  const missing=fixture(); delete missing.samples[4]!.invocation.measurement
  expect(qualify(missing.plan,missing.samples,()=>bytes).status).toBe('unqualified')
})

test('post-hoc plan tuning and a selected subset of an exhaustive journal cannot qualify',()=>{
 const {plan,samples}=fixture(); expect(qualifyTiming(plan,samples,()=>bytes).status).toBe('unqualified')
 const frames=journalOf(samples); frames.push({...frames[0]!,attemptId:'hidden-failed-attempt'})
 expect(qualifyTiming(plan,samples,()=>bytes,frames).status).toBe('unqualified')
 plan.maximumControlSpread=.5;expect(()=>qualify(plan,samples,()=>bytes)).toThrow('predeclared plan')
})
