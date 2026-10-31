import { ChildProcess } from 'node:child_process'
import { Worker, parentPort } from 'node:worker_threads'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BrowserContext, Page } from 'playwright'
import { CollectionCheckpoint, writeDurableEvidence } from './checkpoint.ts'
import { admitCheckedEvidence, admitInvocationEvidence, evidenceBytesDigest, evidenceDigest, type CaseEvidenceContract, type CheckedEvidence, type InvocationEvidence } from './evidence-contract.ts'
import { InvocationJournal } from './invocation-journal.ts'
import { admitTimingPlan, qualifyTiming, type TimingPlan, type TimingSample } from './qualified-timing.ts'

type Replica = 'A0' | 'A1' | 'B'
type Artifact = TimingPlan['artifacts'][Replica]
export interface TimingSource { caseId: string; source: string; provenance?: string }
export type OwnedTimingExecution = { kind: 'node-worker'; handle: Worker } | { kind: 'child-process'; handle: ChildProcess } | { kind: 'browser-context'; handle: BrowserContext; page: Page }
export interface TimingCoordinate { round: number; replica: Replica; caseId: string; sample: number }
export type OpenedTimingRuntime = { artifact: Artifact } & ({ execution: Extract<OwnedTimingExecution, { kind: 'node-worker' | 'child-process' }> } | { execution: Extract<OwnedTimingExecution, { kind: 'browser-context' }>; request?: Readonly<Record<string, unknown>>; invokeInPage: (request: any) => string | Promise<string> })
export interface QualifiedTimingPublicDriver {
  /** Produced by the reviewed public binding, not inferred from a plan label.
   * For RPC drivers the boundary includes request/return transport overhead. */
  context: Pick<TimingPlan, 'boundary' | 'format' | 'track' | 'environmentSha256' | 'artifacts'>
  /** Initializes/imports a fresh runtime, without a render call or warmup.
   * The collector owns and closes the actual handle after exactly one call. */
  open(coordinate: TimingCoordinate & { artifact: Artifact }): Promise<OpenedTimingRuntime>
}
export type ObserveTimedOutput = (input: { contract: CaseEvidenceContract; bytes: Uint8Array; invocation: Readonly<InvocationEvidence>; coordinate: TimingCoordinate }) => CheckedEvidence | Promise<CheckedEvidence>
const replicaPermutations: readonly (readonly Replica[])[] = [['A0', 'A1', 'B'], ['B', 'A1', 'A0'], ['A1', 'B', 'A0'], ['A0', 'B', 'A1'], ['B', 'A0', 'A1'], ['A1', 'A0', 'B']]
const callTimeoutMs = 30_000

/** Six paired orders put every replica in every position twice. Matching
 * case calls stay adjacent; no result can alter the predeclared schedule. */
export function qualifiedTimingCoordinates(plan: TimingPlan): TimingCoordinate[] {
  const result: TimingCoordinate[] = []
  for (let round = 1; round <= plan.rounds; round++) for (const [index, input] of plan.cases.entries()) for (let sample = 0; sample < plan.samplesPerRound; sample++) for (const replica of replicaPermutations[(round - 1 + index + sample) % 6]!) result.push({ round, replica, caseId: input.caseId, sample })
  return result
}

/** Install inside an already initialized fresh Worker. No source or public
 * render call is supplied during initialization. Exactly one call is accepted. */
export function serveQualifiedTimingWorker(invoke: (source: string) => string | Uint8Array | Promise<string | Uint8Array>) {
  const channel = parentPort
  if (!channel) throw Error('Qualified timing Worker service must run in a Worker')
  let called = false
  channel.on('message', async request => {
    if (request?.schema !== 'trident-qualified-timing-call-v1') return
    const reply = (value: unknown) => channel.postMessage(value)
    if (called || typeof request.attemptId !== 'string' || typeof request.source !== 'string') { reply({ schema: 'trident-qualified-timing-error-v1', attemptId: request.attemptId, detail: 'Fresh timing Worker accepts exactly one source call' }); return }
    called = true
    try { reply({ schema: 'trident-qualified-timing-return-v1', attemptId: request.attemptId, output: await invoke(request.source) }) }
    catch (error) { reply({ schema: 'trident-qualified-timing-error-v1', attemptId: request.attemptId, detail: String(error) }) }
  })
  channel.postMessage({ schema: 'trident-qualified-timing-ready-v1' })
}
function preparePublicCall(opened: OpenedTimingRuntime, attemptId: string, source: string) {
  const execution = opened.execution
  if (execution.kind === 'browser-context') {
    if (!('invokeInPage' in opened) || typeof opened.invokeInPage !== 'function') throw Error('Browser timing needs its public call serialized into the actual fresh page')
    return { invoke: () => execution.page.evaluate(opened.invokeInPage, opened.request ? { ...opened.request, source } : source), cancel: () => {} }
  }
  const handle = execution.handle
  let resolve!: (value: string | Uint8Array) => void, reject!: (error: Error) => void
  const result = new Promise<string | Uint8Array>((done, fail) => { resolve = done; reject = fail })
  const message = (reply: any) => { if (reply?.attemptId !== attemptId) return; if (reply.schema === 'trident-qualified-timing-return-v1') resolve(reply.output); else if (reply.schema === 'trident-qualified-timing-error-v1') reject(Error(reply.detail || 'Public timing request failed')) }
  const error = (failure: Error) => reject(failure), exit = () => reject(Error('Fresh timing runtime exited before its owned return'))
  handle.on('message', message); handle.once('error', error); handle.once('exit', exit)
  return { invoke: () => { const request = { schema: 'trident-qualified-timing-call-v1', attemptId, source }; if (execution.kind === 'node-worker') execution.handle.postMessage(request); else execution.handle.send(request); return result }, cancel: () => { handle.off('message', message); handle.off('error', error); handle.off('exit', exit) } }
}

/** Fixed first-use collection. No adaptive loops, selection on outcomes or
 * hidden retries. A grader crash can replay the complete retained raw phase;
 * an interrupted raw phase stays incomplete instead of mixing controller runs. */
export async function collectQualifiedTiming(plan: TimingPlan, sources: readonly TimingSource[], invokePublic: QualifiedTimingPublicDriver, observeOutput: ObserveTimedOutput, out: string) {
  plan = admitTimingPlan(plan)
  if (plan.rounds % 6 !== 0) throw Error('This collector needs complete six-round blocks for balanced first-use ordering and finite median-ratio uncertainty')
  if (plan.track !== 'first-use') throw Error('This collector supports first-use only; warm/adaptive tracks need their own reviewed execution policy')
  const context = { boundary: plan.boundary, format: plan.format, track: plan.track, environmentSha256: plan.environmentSha256, artifacts: plan.artifacts }
  if (evidenceDigest(invokePublic.context) !== evidenceDigest(context)) throw Error('Actual public driver context differs from the frozen timing plan')
  const sourceMap = new Map(sources.map(input => [input.caseId, input.source]))
  if (sourceMap.size !== sources.length || sourceMap.size !== plan.cases.length || plan.cases.some(input => typeof sourceMap.get(input.caseId) !== 'string' || evidenceBytesDigest(sourceMap.get(input.caseId)!) !== input.sourceSha256)) throw Error('Timing sources must match the complete frozen corpus exactly')
  const planSha256 = evidenceDigest(plan), coordinates = qualifiedTimingCoordinates(plan), captureProtocol = { name: 'fresh-instance-per-call-six-orders-v1', coordinateScheduleSha256: evidenceDigest(coordinates), maximumCallMs: callTimeoutMs, imports: 'Initialized before timing without public calls', measuredBoundary: 'Controller request through returned public bytes; declared RPC overhead included' }
  const checkpoint = new CollectionCheckpoint(join(out, 'collection'), { schema: 'trident-qualified-timing-collection-v1', planSha256, captureProtocol }), journal = new InvocationJournal(join(out, 'raw'))
  writeDurableEvidence(join(out, 'plan.json'), Buffer.from(JSON.stringify(plan, null, 2) + '\n'))
  writeDurableEvidence(join(out, 'sources.json'), Buffer.from(JSON.stringify(plan.cases.map(input => ({ ...sources.find(source => source.caseId === input.caseId)!, sourceSha256: input.sourceSha256 })), null, 2) + '\n'))
  const key = (coordinate: TimingCoordinate) => JSON.stringify([planSha256, coordinate.round, coordinate.replica, coordinate.caseId, coordinate.sample])
  type CollectionError = { phase: string; detail: string; coordinate?: TimingCoordinate; attemptId?: string }
  const errors: CollectionError[] = checkpoint.get('capture-errors') ?? []
  const seenHandles = new WeakSet<object>(), proofs: Record<string, unknown>[] = checkpoint.get('instances') ?? []
  const inspectExecution = (execution: OwnedTimingExecution) => {
    if (!execution?.handle || seenHandles.has(execution.handle)) throw Error('First-use needs a fresh actual runtime handle for every full sample coordinate')
    if (execution.kind === 'node-worker') {
      if (!(execution.handle instanceof Worker) || execution.handle.threadId < 1) throw Error('Timing driver did not open a live fresh Node Worker')
      seenHandles.add(execution.handle)
      return { id: `node-worker:${process.pid}:${execution.handle.threadId}`, proof: { kind: execution.kind, controllerPid: process.pid, threadId: execution.handle.threadId } }
    }
    if (execution.kind === 'child-process') {
      if (!(execution.handle instanceof ChildProcess) || !execution.handle.pid || execution.handle.exitCode !== null || execution.handle.signalCode !== null || execution.handle.killed || !execution.handle.connected) throw Error('Timing driver did not open a live fresh child process with IPC')
      seenHandles.add(execution.handle)
      return { id: `child-process:${execution.handle.pid}:${randomUUID()}`, proof: { kind: execution.kind, pid: execution.handle.pid, executable: execution.handle.spawnfile } }
    }
    if (execution.kind === 'browser-context') {
      const context = execution.handle
      if (!context.browser()?.isConnected() || execution.page.isClosed() || execution.page.context() !== context || context.pages().length !== 1 || context.pages()[0] !== execution.page) throw Error('Timing driver needs one live page in a fresh isolated browser context')
      seenHandles.add(context)
      return { id: 'browser-context:' + randomUUID(), proof: { kind: execution.kind, browserType: context.browser()!.browserType().name(), browserVersion: context.browser()!.version(), pages: 1 } }
    }
    throw Error('First-use needs an actual Worker, child process or isolated browser context; a renamed callback is insufficient')
  }
  const closeExecution = async (execution: OwnedTimingExecution) => {
    if (execution.kind === 'node-worker') { await execution.handle.terminate(); return }
    if (execution.kind === 'browser-context') { await execution.handle.close(); return }
    if (execution.handle.exitCode !== null || execution.handle.signalCode !== null) return
    await new Promise<void>(resolve => {
      const child = execution.handle, timer = setTimeout(() => { child.kill('SIGKILL') }, 2000)
      child.once('close', () => { clearTimeout(timer); resolve() }); child.kill('SIGTERM')
    })
  }
  // Reopening a partially captured run cannot restore its old runtime state or
  // manufacture one monotonic controller domain. Existing calls are never rerun.
  if (!checkpoint.has('raw-complete') && journal.records().length === 0) {
    const clockDomainId = randomUUID()
    for (const [sequence, coordinate] of coordinates.entries()) {
      const contract = plan.cases.find(input => input.caseId === coordinate.caseId)!, artifact = plan.artifacts[coordinate.replica], identity = { ...artifact, caseId: coordinate.caseId, sourceSha256: contract.sourceSha256, format: plan.format, coordinate: key(coordinate) }
      let opened: Awaited<ReturnType<QualifiedTimingPublicDriver['open']>> | undefined, started: Readonly<InvocationEvidence> | undefined
      try {
        opened = await invokePublic.open({ ...coordinate, artifact })
        if (evidenceDigest(opened.artifact) !== evidenceDigest(artifact)) throw Error('Opened runtime uses a different actual artifact or binding')
        if (opened.execution.kind === 'browser-context' && plan.format === 'png') throw Error('This first-use browser collector supports text outputs only; PNG needs an explicit reviewed byte transport')
        const instance = inspectExecution(opened.execution)
        proofs.push({ ...coordinate, executionInstanceId: instance.id, ...instance.proof })
        started = journal.start(identity, { captureProtocolSha256: evidenceDigest(captureProtocol), planSha256, environmentSha256: plan.environmentSha256, boundary: plan.boundary, track: plan.track, clockDomainId, executionInstanceId: instance.id, sequence })
        let timer: ReturnType<typeof setTimeout> | undefined
        const pending = preparePublicCall(opened, started.attemptId, sourceMap.get(coordinate.caseId)!)
        const timeout = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(Error('Public timing boundary exceeded its fixed 30000ms deadline')), callTimeoutMs) })
        const apiStartNs = process.hrtime.bigint()
        try {
          const value = await Promise.race([pending.invoke(), timeout])
          const apiFinishNs = process.hrtime.bigint(); clearTimeout(timer)
          if (typeof value !== 'string' && !(value instanceof Uint8Array)) throw Error('Public timing binding must return its declared text or byte output directly')
          journal.returned(started, value, Number(apiFinishNs - apiStartNs) / 1e6, undefined, { apiStartNs, apiFinishNs })
        } catch (error) {
          const apiFinishNs = process.hrtime.bigint(); clearTimeout(timer)
          // A controller timeout or retention/type failure is no source rejection.
          if (!journal.outcome(started.attemptId)) journal.failed(started, error, null, 'interrupted', undefined, { apiStartNs, apiFinishNs })
          errors.push({ phase: 'public-call-or-retention', detail: String(error), coordinate, attemptId: started.attemptId })
        } finally { pending.cancel() }
      } catch (error) {
        errors.push({ phase: 'runtime-preflight', detail: String(error), coordinate })
        if (!started) journal.adopt(admitInvocationEvidence({ schema: 'trident-invocation-evidence-v1', attemptId: randomUUID(), identity, state: 'not-invoked', startedAt: null, finishedAt: null, recordedAt: new Date().toISOString(), durationMs: null, output: null, detail: 'Expected artifact was not invoked: ' + String(error) }))
      } finally {
        if (opened) try { await closeExecution(opened.execution) } catch (error) { errors.push({ phase: 'runtime-close', detail: String(error), coordinate }) }
      }
    }
    checkpoint.record('capture-errors', errors)
    checkpoint.record('instances', proofs)
    checkpoint.record('raw-complete', { planned: coordinates.length, attempts: journal.records().filter(frame => frame.state === 'started').length, clockDomainId })
  } else if (!checkpoint.has('raw-complete')) errors.push({ phase: 'recovery', detail: 'Raw capture was interrupted; original invocations are preserved and no public calls are repeated or silently added' })
  const samples: TimingSample[] = []
  for (const coordinate of coordinates) {
    const contract = plan.cases.find(input => input.caseId === coordinate.caseId)!, frames = journal.records().filter(frame => frame.identity.coordinate === key(coordinate)), returned = frames.filter(frame => frame.state === 'returned')
    if (returned.length > 1) throw Error('A timing coordinate has multiple actual returns; selection is forbidden')
    const invocation = returned[0]
    if (!invocation?.output) continue
    try {
      const checkKey = 'checked:' + key(coordinate), bytes = readFileSync(invocation.output.path)
      const checked = admitCheckedEvidence(contract, checkpoint.get<CheckedEvidence>(checkKey) ?? await observeOutput({ contract, bytes, invocation, coordinate }))
      if (checked.outputSha256 !== invocation.output.sha256 || checked.observerSha256 !== plan.observerSha256) throw Error('Observer evidence does not bind the actual timed output and frozen observer')
      checkpoint.record(checkKey, checked)
      samples.push({ ...coordinate, invocation, checked })
    } catch (error) {
      const failure = { phase: 'observer', detail: String(error), coordinate, attemptId: invocation.attemptId }
      errors.push(failure); checkpoint.record('observer-error:' + invocation.attemptId + ':' + randomUUID(), failure)
    }
  }
  const frames = journal.records(), rawQualification = qualifyTiming(plan, samples, output => readFileSync(output.path), frames)
  const captureGaps = [...(!checkpoint.has('raw-complete') ? ['Raw timing capture did not complete; resumed controllers cannot fill an interrupted capture'] : []), ...(checkpoint.get<CollectionError[]>('capture-errors') ?? []).map(error => 'Capture ' + error.phase + ': ' + error.detail)]
  const qualification = captureGaps.length ? { ...rawQualification, status: 'unqualified' as const, medianMs: null, perRoundMs: null, gaps: [...new Set([...rawQualification.gaps, ...captureGaps])] } : rawQualification
  const bundle = { schema: 'trident-qualified-timing-bundle-v1', plan, samples, sourcesFile: 'sources.json', captureProtocol, journalDirectory: 'raw', collectionDirectory: 'collection', executionInstances: proofs, rawComplete: checkpoint.has('raw-complete'), errors, qualification }
  const bundleFile = join(out, 'timing-bundle-' + evidenceDigest(bundle).slice(0, 24) + '.json')
  writeDurableEvidence(bundleFile, Buffer.from(JSON.stringify(bundle, null, 2) + '\n'))
  return { ...bundle, bundleFile }
}
