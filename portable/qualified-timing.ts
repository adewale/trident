import { admitCaseEvidenceContract, admitCheckedEvidence, admitInvocationEvidence, constructEvidenceVerdict, evidenceBytesDigest, evidenceDigest, type CaseEvidenceContract, type CheckedEvidence, type InvocationEvidence } from './evidence-contract.ts'
import { admitTimingGrading, materializeTimingSamples, type TimingGrading } from './timing-grading.ts'
import { calibrate, median } from './statistics.ts'

type Replica = 'A0' | 'A1' | 'B'
interface Artifact { project: string; artifactSha256: string; bindingSha256: string }
export const browserSvgFirstUseTimingBoundary = 'Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded'
export const timingDriverFinalizationChecks = ['artifacts', 'sdk', 'fonts', 'resourceAudit', 'cleanup'] as const
export interface TimingDriverFinalization {
  schema: 'trident-timing-driver-finalization-v1'
  planSha256: string
  policySha256: string
  captureProtocolSha256: string | null
  journalSha256: string | null
  checks: Record<typeof timingDriverFinalizationChecks[number], boolean>
  status: 'passed' | 'failed'
  errors: string[]
  completedAt: string
}
export interface TimingPlan {
  schema: 'trident-qualified-timing-plan-v1'
  /** Exact API/process boundary, cache/prelude policy and output format. */
  boundary: string
  format: 'svg' | 'png' | 'terminal'
  track: string
  environmentSha256: string
  observerSha256: string
  rounds: number
  samplesPerRound: number
  maximumControlSpread: number
  cases: readonly CaseEvidenceContract[]
  artifacts: Record<Replica, Artifact>
  /** Production driver postchecks and outer cleanup remain outside API clocks.
   * Their requirement is frozen into the original collection plan. */
  driverFinalization?: { protocol: 'browser-svg-first-use-v1'; producerSha256: string }
}
export interface TimingSample {
  round: number
  sample: number
  replica: Replica
  caseId: string
  invocation: InvocationEvidence
  checked: CheckedEvidence
}
const replicas: Replica[] = ['A0', 'A1', 'B']
const digest = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const fail = (message: string): never => { throw Error('Invalid qualified timing: ' + message) }
export function admitTimingPlan(value: TimingPlan): Readonly<TimingPlan> {
  if (!value || value.schema !== 'trident-qualified-timing-plan-v1' || !value.boundary?.trim() || !value.track?.trim() || !['svg', 'png', 'terminal'].includes(value.format) || !digest(value.environmentSha256) || !digest(value.observerSha256)) fail('boundary, track, format, observer and host identity are required')
  if (!Number.isSafeInteger(value.rounds) || value.rounds < 5 || !Number.isSafeInteger(value.samplesPerRound) || value.samplesPerRound < 1 || !Number.isFinite(value.maximumControlSpread) || value.maximumControlSpread < 0) fail('sampling and control ceiling must be frozen before collection')
  if (!Array.isArray(value.cases) || !value.cases.length || new Set(value.cases.map(input => input.caseId)).size !== value.cases.length) fail('nonempty unique fixed corpus is required')
  const cases = value.cases.map(admitCaseEvidenceContract)
  for (const replica of replicas) {
    const artifact = value.artifacts?.[replica]
    if (!artifact?.project?.trim() || !digest(artifact.artifactSha256) || !digest(artifact.bindingSha256)) fail('artifact and public binding identities are required for each replica')
  }
  if (evidenceDigest(value.artifacts.A0) !== evidenceDigest(value.artifacts.A1)) fail('A/A replicas must use exactly the same artifact and binding')
  if (value.driverFinalization !== undefined && (!value.driverFinalization || value.driverFinalization.protocol !== 'browser-svg-first-use-v1' || !digest(value.driverFinalization.producerSha256))) fail('driver finalization policy is invalid')
  return Object.freeze({ ...value, ...(value.driverFinalization ? { driverFinalization: Object.freeze({ ...value.driverFinalization }) } : {}), cases: Object.freeze(cases), artifacts: Object.freeze(Object.fromEntries(replicas.map(replica => [replica, Object.freeze({ ...value.artifacts[replica] })]))) as TimingPlan['artifacts'] })
}

/** Regrade every measured return, including repeats, outside its API clock.
 * readOutput must read the retained bytes named by the invocation receipt.
 * This never promotes first-output qualification to later calls. */
export function qualifyTiming(plan: TimingPlan, samples: readonly TimingSample[], readOutput: (output: NonNullable<InvocationEvidence['output']>) => Uint8Array, journal?: readonly InvocationEvidence[], grading?: TimingGrading) {
  plan = admitTimingPlan(plan)
  const active = grading ? admitTimingGrading(plan, samples, grading, journal) : undefined, measured = active ? materializeTimingSamples(plan, samples, journal) : samples, activeCases = active?.cases ?? plan.cases, activeObserver = active?.observerSha256 ?? plan.observerSha256
  const originalAttempts = new Set(samples.map(sample => sample.invocation.attemptId))
  const planSha256 = evidenceDigest(plan), collectionCases = new Map(plan.cases.map(contract => [contract.caseId, contract])), gradingCases = new Map(activeCases.map(contract => [contract.caseId, contract])), freshChecks = new Map(active?.checks.map(row => [row.attemptId, row.checked]) ?? [])
  const gaps = new Set<string>(), seen = new Set<string>(), attempts = new Set<string>()
  const durations = new Map<string, number>()
  const instances = new Map<string, string>(), instanceOwners = new Map<string, string>()
  const windows: { start: bigint; finish: bigint; sequence: number; domain: string }[] = []
  for (const sample of measured) {
    if (!Number.isSafeInteger(sample.round) || sample.round < 1 || sample.round > plan.rounds || !Number.isSafeInteger(sample.sample) || sample.sample < 0 || sample.sample >= plan.samplesPerRound || !replicas.includes(sample.replica)) fail('sample is outside the frozen plan')
    const contract = collectionCases.get(sample.caseId)
    if (!contract) throw Error('Invalid qualified timing: sample source is outside the frozen corpus')
    const coordinate = JSON.stringify([sample.round, sample.replica, sample.caseId, sample.sample])
    if (seen.has(coordinate)) fail('duplicate sample coordinate')
    seen.add(coordinate)
    const invocation = admitInvocationEvidence(sample.invocation), artifact = plan.artifacts[sample.replica]
    if (attempts.has(invocation.attemptId)) fail('one public invocation cannot supply multiple samples')
    attempts.add(invocation.attemptId)
    if (invocation.identity.project !== artifact.project || invocation.identity.artifactSha256 !== artifact.artifactSha256 || invocation.identity.bindingSha256 !== artifact.bindingSha256 || invocation.identity.caseId !== contract.caseId || invocation.identity.sourceSha256 !== contract.sourceSha256 || invocation.identity.format !== plan.format) fail('invocation differs from the planned artifact, source or output')
    if (invocation.state !== 'returned' || !invocation.output || invocation.durationMs === null || invocation.durationMs <= 0 || invocation.startedAt === null || invocation.finishedAt === null) { gaps.add('Every sample requires a retained return and its actual complete public-call clocks'); continue }
    const clock = invocation.measurement
    if (!clock || clock.monotonicFinishNs === null) { gaps.add('Every sample needs its captured host, boundary, track and monotonic invocation envelope'); continue }
    if (clock.environmentSha256 !== plan.environmentSha256 || clock.boundary !== plan.boundary || clock.track !== plan.track) fail('actual sample context differs from the declared host, boundary or track')
    if (clock.planSha256 !== planSha256) fail('actual sample belongs to a different predeclared plan')
    if (invocation.identity.coordinate !== JSON.stringify([planSha256, sample.round, sample.replica, sample.caseId, sample.sample])) fail('actual invocation belongs to a different planned sampling coordinate')
    const replicaRound = plan.track === 'first-use' ? coordinate : JSON.stringify([sample.replica, sample.round]), owner = instanceOwners.get(clock.executionInstanceId)
    if (owner && owner !== replicaRound) gaps.add('Independent replicas and rounds cannot share an execution instance')
    if (instances.has(replicaRound) && instances.get(replicaRound) !== clock.executionInstanceId) gaps.add('A replica/round cannot silently mix execution instances')
    instances.set(replicaRound, clock.executionInstanceId); instanceOwners.set(clock.executionInstanceId, replicaRound)
    const bytes = readOutput(invocation.output)
    if (bytes.byteLength !== invocation.output.bytes || evidenceBytesDigest(bytes) !== invocation.output.sha256) fail('retained measured output changed')
    const activeContract = gradingCases.get(sample.caseId)!, fresh = freshChecks.get(invocation.attemptId)
    const checked = admitCheckedEvidence(activeContract, active ? fresh : sample.checked)
    if (checked.observerSha256 !== activeObserver) fail('sample was graded by a different observer')
    if (checked.outputSha256 !== invocation.output.sha256) fail('correctness evidence belongs to a different output')
    if (constructEvidenceVerdict(activeContract, checked).status !== 'correct') { gaps.add('Every timed output must satisfy the complete source contract'); continue }
    const start = Date.parse(invocation.startedAt), finish = Date.parse(invocation.finishedAt)
    // Millisecond UTC stamps may round sub-ms calls; they still bind the actual
    // host interval. Monotonic API duration must fit with that rounding margin.
    if (invocation.durationMs > finish - start + 2) fail('API duration exceeds its invocation interval')
    const monoStart = BigInt(clock.monotonicStartNs), monoFinish = BigInt(clock.monotonicFinishNs)
    if (monoFinish <= monoStart || invocation.durationMs > Number(monoFinish - monoStart) / 1e6 + .000001) fail('API duration exceeds its monotonic invocation envelope')
    if (clock.apiStartNs === null || clock.apiFinishNs === null) { gaps.add('The public API clock must be captured by the timed-call producer, not an arbitrary reported duration'); continue }
    const apiStart = BigInt(clock.apiStartNs), apiFinish = BigInt(clock.apiFinishNs)
    if (apiStart < monoStart || apiFinish > monoFinish || apiFinish <= apiStart || Math.abs(invocation.durationMs - Number(apiFinish - apiStart) / 1e6) > .000001) fail('reported duration differs from the captured public API clock')
    windows.push({ start: monoStart, finish: monoFinish, sequence: clock.sequence, domain: clock.clockDomainId })
    durations.set(coordinate, invocation.durationMs)
  }
  windows.sort((a, b) => a.sequence - b.sequence)
  if (new Set(windows.map(window => window.domain)).size > 1 || new Set(windows.map(window => window.sequence)).size !== windows.length) gaps.add('Measured calls need one captured controller clock domain and unique sequence')
  if (windows.some((window, index) => index > 0 && window.start < windows[index - 1]!.finish)) gaps.add('Measured public calls overlapped; this protocol requires serialized execution')
  const planned = plan.rounds * replicas.length * plan.cases.length * plan.samplesPerRound
  if (!journal) gaps.add('Exhaustive raw invocation journal is required; selected successful samples alone cannot qualify timing')
  else {
    const frames = journal.map(admitInvocationEvidence), byAttempt = new Map<string, Readonly<InvocationEvidence>[]>()
    for (const frame of frames) { const own = byAttempt.get(frame.attemptId) ?? []; own.push(frame); byAttempt.set(frame.attemptId, own) }
    if (frames.length !== measured.length * 2 || new Set(frames.map(frame => frame.attemptId + ':' + frame.state)).size !== frames.length) gaps.add('Raw journal includes missing, duplicated, extra or interrupted attempts')
    for (const sample of measured) {
      const own = byAttempt.get(sample.invocation.attemptId) ?? [], start = own.find(frame => frame.state === 'started'), finish = own.find(frame => frame.state === 'returned')
      if (own.length !== 2 || !start || !finish || evidenceDigest(finish) !== evidenceDigest(sample.invocation) || finish.startedReceiptSha256 !== evidenceDigest(start) || start.startedAt !== finish.startedAt || start.recordedAt && finish.recordedAt && Date.parse(start.recordedAt) > Date.parse(finish.recordedAt) || evidenceDigest(start.identity) !== evidenceDigest(finish.identity) || evidenceDigest(start.measurement ?? null) !== evidenceDigest(finish.measurement ? { ...finish.measurement, monotonicFinishNs: null, apiStartNs: null, apiFinishNs: null } : null)) gaps.add('Selected sample lacks its exact durable causal start/return pair')
    }
  }
  if (measured.length !== planned || durations.size !== planned) gaps.add('The fixed case/replica/round/sample population is incomplete')
  const rounds = Array.from({ length: plan.rounds }, (_, index) => {
    const values = (replica: Replica) => Array.from({ length: plan.samplesPerRound }, (_, sample) => {
      const calls = plan.cases.map(input => durations.get(JSON.stringify([index + 1, replica, input.caseId, sample])))
      return calls.every(value => value !== undefined) ? calls.reduce<number>((sum, value) => sum + value!, 0) : null
    }).filter((value): value is number => value !== null)
    return { round: index + 1, A0: values('A0'), A1: values('A1'), B: values('B') }
  })
  const calibration = calibrate(rounds, plan.samplesPerRound, plan.maximumControlSpread)
  for (const gap of calibration.gaps) gaps.add(gap)
  const qualified = gaps.size === 0
  return Object.freeze({ schema: 'trident-qualified-timing-v1' as const, status: qualified ? 'qualified' as const : 'unqualified' as const, planSha256: evidenceDigest(plan), samplesSha256: evidenceDigest(samples), ...(active ? { gradingSha256: evidenceDigest(active), activeGrading: active, recoveredInvocations: measured.filter(sample => !originalAttempts.has(sample.invocation.attemptId)).map(sample => sample.invocation.attemptId), gradingHistory: { collectionPlan: structuredClone(plan), originalChecks: samples.map(sample => ({ attemptId: sample.invocation.attemptId, checked: structuredClone(sample.checked) })) } } : {}), comparisonKey: evidenceDigest({ grading: { cases: activeCases, observerSha256: activeObserver }, boundary: plan.boundary, format: plan.format, track: plan.track, environment: plan.environmentSha256, baseline: plan.artifacts.A0, maximumControlSpread: plan.maximumControlSpread, rounds: plan.rounds, samples: plan.samplesPerRound }), project: plan.artifacts.B.project, caseIds: plan.cases.map(input => input.caseId), boundary: plan.boundary, format: plan.format, track: plan.track, environmentSha256: plan.environmentSha256, planned, checked: durations.size, gaps: [...gaps], perRoundMs: qualified ? rounds.map(round => median(round.B)) : null, medianMs: qualified ? median(rounds.flatMap(round => round.B)) : null, calibration, interpretation: 'Time for the exact fixed corpus through the declared boundary. All sampled outputs are independently checked. A/A spread and median round uncertainty remain separate; calibration alone is not a confidence claim.' })
}

/** Consumers must recompute qualification from owned raw evidence. Never trust
 * an imported boolean or a summary stamped "qualified" by itself. */
export function timingFromRetainedBundle(bundle: { plan: TimingPlan; samples: TimingSample[]; grading?: TimingGrading } | undefined, readOutput: (output: NonNullable<InvocationEvidence['output']>) => Uint8Array, journal?: readonly InvocationEvidence[]) {
  return bundle ? qualifyTiming(bundle.plan, bundle.samples, readOutput, journal, bundle.grading) : null
}
