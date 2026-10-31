import { expect, test } from 'bun:test'
import { defineCaseEvidenceContract, evidenceBytesDigest as hash, evidenceDigest, type CheckedEvidence, type InvocationEvidence } from '../portable/evidence-contract.ts'
import { deriveTimingGrading, timingJournalDigest, type TimingGrading, type TimingGradingPolicy } from '../portable/timing-grading.ts'
import { qualifyTiming, timingFromRetainedBundle, timingDriverFinalizationChecks, type TimingDriverFinalization, type TimingPlan, type TimingSample } from '../portable/qualified-timing.ts'
import { CollectionCheckpoint } from '../portable/checkpoint.ts'
import { qualifyRetainedTiming } from '../unified/qualify-timing.ts'
import { readdirSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('qualified-timing-')
const bytes = Buffer.from('<svg>independently checked fixture drawing</svg>')
function fixture(reference = 'reference artifact', caseCount = 1) {
  const contract = defineCaseEvidenceContract({ caseId: 'source:chain', source: 'flowchart LR; A-->B', expectations: { labels: ['A', 'B'], edge: ['A', 'B'] }, requiredChecks: [{ surface: 'paint', criterion: 'complete-chain' }] })
  const contracts = [contract, ...(caseCount > 1 ? [defineCaseEvidenceContract({ caseId: 'source:second-chain', source: 'flowchart LR; X-->Y', expectations: { labels: ['X', 'Y'], edge: ['X', 'Y'] }, requiredChecks: [{ surface: 'paint', criterion: 'complete-chain' }] })] : [])]
  const artifact = { project: 'fixture/reference', artifactSha256: hash(reference), bindingSha256: hash('public SVG call') }
  const plan: TimingPlan = { schema: 'trident-qualified-timing-plan-v1', boundary: 'public SVG API through returned bytes; import excluded', format: 'svg', track: 'first-use', environmentSha256: hash('frozen environment'), observerSha256: hash('independently qualified fixture observer'), rounds: 6, samplesPerRound: 2, maximumControlSpread: .25, cases: contracts, artifacts: { A0: artifact, A1: artifact, B: { ...artifact, project: 'fixture/candidate', artifactSha256: hash('candidate artifact') } } }
  const samples: TimingSample[] = []
  for (let round = 1; round <= plan.rounds; round++) for (const replica of ['A0', 'A1', 'B'] as const) for (let sample = 0; sample < plan.samplesPerRound; sample++) for (const contract of contracts) {
    const identity = plan.artifacts[replica], start = Date.UTC(2026, 9, 31) + samples.length * 20
    const invocation: InvocationEvidence = { schema: 'trident-invocation-evidence-v1', attemptId: 'actual-fixture-call-' + samples.length, identity: { ...identity, caseId: contract.caseId, sourceSha256: contract.sourceSha256, format: 'svg', coordinate: JSON.stringify([evidenceDigest(plan),round,replica,contract.caseId,sample]) }, measurement: { planSha256: evidenceDigest(plan), environmentSha256: plan.environmentSha256, boundary: plan.boundary, track: plan.track, clockDomainId: 'fixture-monotonic-controller', executionInstanceId: replica+'-fresh-instance-'+round+'-sample-'+sample+'-case-'+contract.caseId, sequence: samples.length, apiStartNs: String(BigInt(samples.length) * 20_000_000n), apiFinishNs: String(BigInt(samples.length) * 20_000_000n + BigInt(replica==='B'?5_000_000:10_000_000)), monotonicStartNs: String(BigInt(samples.length) * 20_000_000n), monotonicFinishNs: String(BigInt(samples.length) * 20_000_000n + 10_000_000n) }, state: 'returned', startedAt: new Date(start).toISOString(), finishedAt: new Date(start + 10).toISOString(), durationMs: replica === 'B' ? 5 : 10, output: { path: 'actual.svg', bytes: bytes.length, sha256: hash(bytes) }, detail: 'Synthetic deterministic clock fixture, not a renderer measurement' }
    const checked: CheckedEvidence = { schema: 'trident-checked-evidence-v1', caseId: contract.caseId, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: hash(bytes), observerSha256: plan.observerSha256, checks: contract.requiredChecks.map(check => ({ ...check, status: 'passed', detail: 'Independent authored fixture observation' })) }
    samples.push({ round, sample, replica, caseId: contract.caseId, invocation, checked })
  }
  return { plan, samples }
}
function journalOf(samples:TimingSample[]) { return samples.flatMap(sample=>{ const start:InvocationEvidence={...sample.invocation,state:'started',startedAt:sample.invocation.startedAt??'2026-10-31T00:00:00.000Z',finishedAt:null,durationMs:null,output:null,...(sample.invocation.measurement?{measurement:{...sample.invocation.measurement,monotonicFinishNs:null,apiStartNs:null,apiFinishNs:null}}:{})}; delete start.startedReceiptSha256; sample.invocation.startedReceiptSha256=evidenceDigest(start);return[start,sample.invocation] }) }
const qualify=(plan:TimingPlan,samples:TimingSample[],reader:()=>Uint8Array)=>qualifyTiming(plan,samples,reader,journalOf(samples))
test('retained reduction shares the finalization gate and never exposes marked timing without its exact passed receipt', async () => {
  const { plan, samples } = fixture(), captureProtocol = { name: 'synthetic frozen finalization control' }
  plan.driverFinalization = { protocol: 'browser-svg-first-use-v1', producerSha256: hash('synthetic finalization producer') }
  const planSha256 = evidenceDigest(plan)
  for (const sample of samples) { sample.invocation.measurement!.planSha256 = planSha256; sample.invocation.measurement!.captureProtocolSha256 = evidenceDigest(captureProtocol); sample.invocation.identity.coordinate = JSON.stringify([planSha256, sample.round, sample.replica, sample.caseId, sample.sample]) }
  const journal = journalOf(samples), bundle = { plan, samples, captureProtocol }
  const receipt: TimingDriverFinalization = { schema: 'trident-timing-driver-finalization-v1', planSha256, policySha256: evidenceDigest(plan.driverFinalization), captureProtocolSha256: evidenceDigest(captureProtocol), journalSha256: timingJournalDigest(journal), checks: Object.fromEntries(timingDriverFinalizationChecks.map(check => [check, true])) as TimingDriverFinalization['checks'], status: 'passed', errors: [], completedAt: '2026-10-31T01:00:00.000Z' }
  expect(qualifyTiming(plan, samples, () => bytes, journal).status).toBe('qualified')
  expect(timingFromRetainedBundle(bundle, () => bytes, journal)).toMatchObject({ status: 'unqualified', medianMs: null, perRoundMs: null })
  expect(timingFromRetainedBundle(bundle, () => bytes, journal, receipt)).toMatchObject({ status: 'qualified', medianMs: 5 })
  for (const changed of [
    { ...receipt, status: 'failed' }, { ...receipt, errors: ['Actual outer cleanup failed'] },
    { ...receipt, checks: { ...receipt.checks, artifacts: false } }, { ...receipt, checks: { ...receipt.checks, cleanup: undefined } },
    { ...receipt, planSha256: hash('different capture plan') }, { ...receipt, journalSha256: hash('different actual calls') },
    { ...receipt, captureProtocolSha256: hash('different frozen capture protocol') }, { ...receipt, policySha256: hash('different driver') },
  ]) expect(timingFromRetainedBundle(bundle, () => bytes, journal, changed)).toMatchObject({ status: 'unqualified', medianMs: null, perRoundMs: null })
  const grading = await deriveTimingGrading(plan, samples, () => bytes, freshPolicy(plan), freshlyInspect, journal)
  expect(timingFromRetainedBundle({ ...bundle, grading }, () => bytes, journal, receipt)?.status).toBe('qualified')
  expect(timingFromRetainedBundle({ ...bundle, grading }, () => bytes, journal)?.status).toBe('unqualified')
})
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

test('first use cannot reuse an execution instance or accept an invented shorter duration',()=>{
 const reused=fixture();reused.samples[1]!.invocation.measurement!.executionInstanceId=reused.samples[0]!.invocation.measurement!.executionInstanceId
 expect(qualify(reused.plan,reused.samples,()=>bytes).status).toBe('unqualified')
 const short=fixture();short.samples[0]!.invocation.durationMs=1
 expect(()=>qualify(short.plan,short.samples,()=>bytes)).toThrow('captured public API clock')
 const missing=fixture(),journal=journalOf(missing.samples);delete missing.samples[0]!.invocation.startedReceiptSha256
 expect(qualifyTiming(missing.plan,missing.samples,()=>bytes,journal).status).toBe('unqualified')
})
test('different A/A baselines cannot share a comparative timing key',()=>{
 const first=fixture('baseline version one'),second=fixture('baseline version two')
 expect(qualify(first.plan,first.samples,()=>bytes).comparisonKey).not.toBe(qualify(second.plan,second.samples,()=>bytes).comparisonKey)
})
test('offline timing reads the exhaustive journal without writes and rejects a symlinked output owner',()=>{
 const root=temp.dir(),file=join(root,'bundle.json'),output=join(root,'actual.svg'),directory=join(root,'journal'),data=fixture()
 writeFileSync(output,bytes)
 for(const sample of data.samples)sample.invocation.output!.path=output
 const journal=new CollectionCheckpoint(directory,{schema:'trident-invocation-journal-v1'})
 for(const frame of journalOf(data.samples))journal.record(frame.attemptId+':'+frame.state,frame)
 writeFileSync(file,JSON.stringify({...data,journalDirectory:'journal'}))
 const before=readdirSync(root,{recursive:true}).sort()
 expect(qualifyRetainedTiming(file)?.status).toBe('unqualified')
 expect(readdirSync(root,{recursive:true}).sort()).toEqual(before)
 const elsewhere=join(temp.dir(),'borrowed.svg');writeFileSync(elsewhere,bytes);unlinkSync(output);symlinkSync(elsewhere,output)
 expect(()=>qualifyRetainedTiming(file)).toThrow('outside the owning bundle')
})


function freshPolicy(plan: TimingPlan): TimingGradingPolicy {
  return { schema: 'trident-derived-timing-grading-v1', collectionPlanSha256: evidenceDigest(plan), cases: plan.cases.map(contract => ({ ...contract, expectationsSha256: hash('new complete independent source facts: ' + contract.caseId), requiredChecks: [...contract.requiredChecks, { surface: 'paint', criterion: 'new-required-source-fact' }] })), observerSha256: hash('current independent checker code'), reason: 'Correct the source contract and observer using retained output; keep every original captured call.', provenance: { source: 'Synthetic source-grading control, not benchmark evidence', sha256: hash('independent checker fixture source') } }
}
const freshlyInspect = (input: { contract: TimingPlan['cases'][number]; invocation: InvocationEvidence; bytes: Uint8Array; observerSha256: string }): CheckedEvidence => ({ schema: 'trident-checked-evidence-v1', caseId: input.contract.caseId, sourceSha256: input.contract.sourceSha256, expectationsSha256: input.contract.expectationsSha256, outputSha256: hash(input.bytes), observerSha256: input.observerSha256, checks: input.contract.requiredChecks.map(check => ({ ...check, status: input.bytes.toString().includes('independently checked fixture drawing') ? 'passed' : 'failed', detail: 'Fresh byte inspection of this synthetic trust-record control; no renderer accuracy claim' })) })

test('derived grading reuses exact original clocks while freshly checking every retained output against new facts', async () => {
  const { plan, samples } = fixture(), journal = journalOf(samples), original = JSON.stringify({ plan, samples }), calls: string[] = []
  const grading = await deriveTimingGrading(plan, samples, () => bytes, freshPolicy(plan), input => { calls.push(input.invocation.attemptId); return freshlyInspect(input) })
  const initial = qualifyTiming(plan, samples, () => bytes, journal), result = qualifyTiming(plan, samples, () => bytes, journal, grading)
  expect(result).toMatchObject({ status: 'qualified', planned: 36, checked: 36, medianMs: 5, planSha256: initial.planSha256, samplesSha256: initial.samplesSha256 })
  expect(calls).toEqual(samples.map(sample => sample.invocation.attemptId))
  expect(result.comparisonKey).not.toBe(initial.comparisonKey)
  expect(result.gradingHistory?.collectionPlan).toEqual(plan)
  expect(result.gradingHistory?.originalChecks).toEqual(samples.map(sample => ({ attemptId: sample.invocation.attemptId, checked: sample.checked })))
  expect(JSON.stringify({ plan, samples })).toBe(original)
  expect(timingFromRetainedBundle({ plan, samples, grading }, () => bytes, journal)?.status).toBe('qualified')
})

test('derived grading cannot borrow old checks or omit a required fresh observation', async () => {
  const { plan, samples } = fixture(), journal = journalOf(samples), grading = await deriveTimingGrading(plan, samples, () => bytes, freshPolicy(plan), freshlyInspect)
  expect(() => qualifyTiming(plan, samples, () => bytes, journal, { ...grading, checks: grading.checks.slice(1) })).toThrow('every original invocation')
  const stale = { ...grading, checks: grading.checks.map((row, index) => ({ attemptId: row.attemptId, checked: samples[index]!.checked })) }
  expect(() => qualifyTiming(plan, samples, () => bytes, journal, stale)).toThrow('stale')
  const missingFact: TimingGrading = { ...grading, checks: grading.checks.map((row, index) => index ? row : { ...row, checked: { ...row.checked, checks: row.checked.checks.slice(0, 1) } }) }
  expect(qualifyTiming(plan, samples, () => bytes, journal, missingFact)).toMatchObject({ status: 'unqualified', checked: 35, medianMs: null })
  await expect(deriveTimingGrading(plan, samples, () => bytes, freshPolicy(plan), () => samples[0]!.checked)).rejects.toThrow('stale')
})

test('derived grading rejects nonempty subsets, new source bytes and collection-plan overrides', async () => {
  const { plan, samples } = fixture('reference artifact', 2), policy = freshPolicy(plan)
  for (const changed of [
    { ...policy, cases: policy.cases.slice(0, 1) },
    { ...policy, cases: policy.cases.map((contract, index) => index ? contract : { ...contract, sourceSha256: hash('replacement diagram') }) },
    { ...policy, collectionPlanSha256: hash('different sampling plan') },
    { ...policy, rounds: 1 },
  ]) await expect(deriveTimingGrading(plan, samples, () => bytes, changed, freshlyInspect)).rejects.toThrow('derived timing grading')
  const journal = journalOf(samples), grading = await deriveTimingGrading(plan, samples, () => bytes, policy, freshlyInspect)
  const result = qualifyTiming(plan, samples, () => bytes, journal, grading)
  expect(result).toMatchObject({ status: 'qualified', planned: 72, checked: 72 })
  const changed = structuredClone(samples); changed[2]!.invocation.attemptId = 'replacement UUID'
  expect(() => qualifyTiming(plan, changed, () => bytes, journal, grading)).toThrow()
})

test('fresh grading failure and changed actual bytes withhold timing without changing raw history', async () => {
  const { plan, samples } = fixture(), journal = journalOf(samples), grading = await deriveTimingGrading(plan, samples, () => bytes, freshPolicy(plan), input => ({ ...freshlyInspect(input), checks: input.contract.requiredChecks.map(check => ({ ...check, status: 'failed', detail: 'Fresh observer found a required source fact violated in this controlled record' })) }))
  expect(qualifyTiming(plan, samples, () => bytes, journal, grading)).toMatchObject({ status: 'unqualified', checked: 0, medianMs: null })
  await expect(deriveTimingGrading(plan, samples, () => Buffer.from('changed bytes'), freshPolicy(plan), freshlyInspect)).rejects.toThrow('bytes changed')
})


test('public offline timing reduction consumes explicit derived grading and preserves the collection files', async () => {
  const root = temp.dir(), file = join(root, 'derived-bundle.json'), output = join(root, 'actual.svg'), directory = join(root, 'journal'), data = fixture()
  writeFileSync(output, bytes)
  for (const sample of data.samples) sample.invocation.output!.path = output
  const journal = new CollectionCheckpoint(directory, { schema: 'trident-invocation-journal-v1' }), frames = journalOf(data.samples)
  for (const frame of frames) journal.record(frame.attemptId + ':' + frame.state, frame)
  const partial = data.samples.slice(4), grading = await deriveTimingGrading(data.plan, partial, () => bytes, freshPolicy(data.plan), freshlyInspect, frames)
  writeFileSync(file, JSON.stringify({ ...data, samples: partial, journalDirectory: 'journal', grading }))
  const before = readdirSync(root, { recursive: true }).sort(), result = qualifyRetainedTiming(file)
  expect(result).toMatchObject({ status: 'unqualified', planSha256: evidenceDigest(data.plan), medianMs: null, checked: data.samples.length })
  expect(result?.gaps).toContain('Owned capture protocol and collection lifecycle receipts are required')
  expect(result?.activeGrading?.observerSha256).toBe(grading.observerSha256)
  expect(result?.recoveredInvocations).toHaveLength(4)
  expect(readdirSync(root, { recursive: true }).sort()).toEqual(before)
})


test('derived grading binds original clocks and raw checks, including mutation during async inspection', async () => {
  const { plan, samples } = fixture(), journal = journalOf(samples), grading = await deriveTimingGrading(plan, samples, () => bytes, freshPolicy(plan), freshlyInspect)
  const changed = structuredClone(samples); changed[0]!.invocation.durationMs = 1
  expect(() => qualifyTiming(plan, changed, () => bytes, journal, grading)).toThrow('original invocation clocks')
  const oldCheckChanged = structuredClone(samples); oldCheckChanged[0]!.checked.checks = []
  expect(() => qualifyTiming(plan, oldCheckChanged, () => bytes, journal, grading)).toThrow('collected checks changed')
  await expect(deriveTimingGrading(plan, samples, () => bytes, freshPolicy(plan), input => { samples[0]!.invocation.durationMs = 1; return freshlyInspect(input) })).rejects.toThrow('original invocation clocks')
})


test('fresh grading recovers raw returns omitted by a crashed old observer without calling a renderer', async () => {
  const { plan, samples } = fixture(), journal = journalOf(samples), missing = samples[17]!, partial = samples.filter(sample => sample !== missing), original = JSON.stringify({ plan, partial, journal }), inspected: string[] = []
  // The old observer threw after the raw return had already been durably saved.
  expect(qualifyTiming(plan, partial, () => bytes, journal).status).toBe('unqualified')
  const grading = await deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), input => { inspected.push(input.invocation.attemptId); return freshlyInspect(input) }, journal)
  const result = qualifyTiming(plan, partial, () => bytes, journal, grading)
  expect(result).toMatchObject({ status: 'qualified', planned: 36, checked: 36, medianMs: 5, samplesSha256: evidenceDigest(partial), recoveredInvocations: [missing.invocation.attemptId] })
  expect(inspected.sort()).toEqual(samples.map(sample => sample.invocation.attemptId).sort())
  expect(result.gradingHistory?.originalChecks).toHaveLength(35)
  expect(result.gradingHistory?.originalChecks.some(row => row.attemptId === missing.invocation.attemptId)).toBe(false)
  expect(JSON.stringify({ plan, partial, journal })).toBe(original)
  expect(timingFromRetainedBundle({ plan, samples: partial, grading }, () => bytes, journal)?.status).toBe('qualified')
  expect(() => qualifyTiming(plan, partial, () => bytes, journal, { ...grading, checks: grading.checks.filter(row => row.attemptId !== missing.invocation.attemptId) })).toThrow('every original invocation')
  expect(() => qualifyTiming(plan, partial, () => bytes, journal, { ...grading, collectionJournalSha256: undefined })).toThrow('exact original exhaustive journal')
  await expect(deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), input => { if (input.invocation.attemptId === missing.invocation.attemptId) throw Error('replacement observer also crashed'); return freshlyInspect(input) }, journal)).rejects.toThrow('replacement observer also crashed')
})

test('recovery rejects changed raw history, contradictory rows and replaced sources or UUID coordinates', async () => {
  const { plan, samples } = fixture(), journal = journalOf(samples), partial = samples.slice(1), grading = await deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), freshlyInspect, journal)
  const rawChanged = structuredClone(journal); rawChanged[0]!.detail = 'post-grading changed start receipt'
  expect(() => qualifyTiming(plan, partial, () => bytes, rawChanged, grading)).toThrow('exact original exhaustive journal')
  const contradict = structuredClone(partial); contradict[0]!.invocation.durationMs = 1
  await expect(deriveTimingGrading(plan, contradict, () => bytes, freshPolicy(plan), freshlyInspect, journal)).rejects.toThrow('contradicts its raw invocation')
  for (const mutate of [
    (frame: InvocationEvidence) => { frame.identity.sourceSha256 = hash('substituted source') },
    (frame: InvocationEvidence) => { frame.identity.coordinate = JSON.stringify([evidenceDigest(plan), 99, 'A0', plan.cases[0]!.caseId, 0]) },
    (frame: InvocationEvidence) => { frame.measurement!.planSha256 = hash('different collection') },
  ]) {
    const changed = structuredClone(journal); mutate(changed[1]!)
    await expect(deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), freshlyInspect, changed)).rejects.toThrow('derived timing grading')
  }
  await expect(deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), input => { journal[0]!.detail = 'modified during async grading'; return freshlyInspect(input) }, journal)).rejects.toThrow('exact original exhaustive journal')
})

test('raw recovery cannot select away missing, duplicate or interrupted public attempts', async () => {
  const { plan, samples } = fixture(), journal = journalOf(samples), partial = samples.slice(1)
  const missing = journal.slice(2), missingGrading = await deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), freshlyInspect, missing)
  expect(qualifyTiming(plan, partial, () => bytes, missing, missingGrading).status).toBe('unqualified')
  const interrupted = [...journal, { ...journal[0]!, attemptId: 'extra-interrupted-public-attempt' }]
  const interruptedGrading = await deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), freshlyInspect, interrupted)
  expect(qualifyTiming(plan, partial, () => bytes, interrupted, interruptedGrading).gaps.join(' ')).toContain('interrupted attempts')
  const duplicate = [...journal, journal[1]!]
  await expect(deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), freshlyInspect, duplicate)).rejects.toThrow('every original invocation')
  const extra = [...journal, { ...journal[1]!, attemptId: 'extra-return-same-source-and-coordinate' }]
  const extraGrading = await deriveTimingGrading(plan, partial, () => bytes, freshPolicy(plan), freshlyInspect, extra)
  expect(() => qualifyTiming(plan, partial, () => bytes, extra, extraGrading)).toThrow('duplicate sample coordinate')
})
