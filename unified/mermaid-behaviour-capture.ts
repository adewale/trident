import { spawnSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { basename, isAbsolute, join, resolve } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { readCheckpointEntries } from '../portable/checkpoint.ts'
import { admitInvocationEvidence, evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import corpus from '../corpus/mermaid-behaviour-tests.json' with { type: 'json' }
import type { BehaviourCase } from './mermaid-behaviour-corpus.ts'
import { assessBehaviourCase, ownedBehaviourFile, requireBehaviourReference, type BehaviourValue } from './mermaid-behaviour.ts'

export interface BehaviourAdapter { schema: 'mermaid-behaviour-stdio-adapter-v1'; project: string; version: string; executable: string; adapter: string; args?: string[]; artifactFiles: string[]; capabilities: ('detect-family' | 'svg-accessibility')[]; bindingDescription: string }
export interface AdapterResult { status: number | null; signal: string | null; stdout: Uint8Array; stderr: Uint8Array; error?: string }
export type BehaviourExecutor = (adapter: BehaviourAdapter, request: string) => AdapterResult
const sha = (file: string) => evidenceBytesDigest(readFileSync(file))
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
export function readBehaviourAdapter(file: string): BehaviourAdapter {
  const value = read(file)
  if (value.schema !== 'mermaid-behaviour-stdio-adapter-v1' || !value.project?.trim() || !value.version?.trim() || !value.bindingDescription?.trim() || !Array.isArray(value.artifactFiles) || !value.artifactFiles.length || !Array.isArray(value.capabilities) || new Set(value.capabilities).size !== value.capabilities.length || value.capabilities.some((item: string) => !['detect-family', 'svg-accessibility'].includes(item)) || value.args !== undefined && (!Array.isArray(value.args) || value.args.some((arg: unknown) => typeof arg !== 'string'))) throw Error('Incomplete native behaviour adapter manifest')
  for (const path of [value.executable, value.adapter, ...value.artifactFiles]) if (typeof path !== 'string' || !isAbsolute(path) || realpathSync(path) !== path) throw Error('Adapter executable, script and artifact paths must be absolute physical files')
  return value
}
const snapshot = (adapter: BehaviourAdapter) => {
  let standardBridge: { config: string; configSha256: string; module: string; moduleSha256: string } | null = null
  if (sha(adapter.adapter) === sha(new URL('./mermaid-behaviour-node-adapter.mjs', import.meta.url).pathname)) {
    const config = adapter.args?.[0]
    if (!config || !isAbsolute(config) || realpathSync(config) !== config) throw Error('Included Node bridge requires an absolute physical config-file argument')
    const module = read(config).module
    if (typeof module !== 'string' || !isAbsolute(module) || realpathSync(module) !== module || !statSync(module).isFile()) throw Error('Included Node bridge requires an absolute physical public module file')
    standardBridge = { config, configSha256: sha(config), module, moduleSha256: sha(module) }
  }
  return { executable: { path: adapter.executable, sha256: sha(adapter.executable) }, adapter: { path: adapter.adapter, sha256: sha(adapter.adapter) }, standardBridge, artifacts: [...new Set([...adapter.artifactFiles, ...(adapter.args ?? []).filter(arg => isAbsolute(arg) && existsSync(arg) && statSync(arg).isFile()), ...(standardBridge ? [standardBridge.config, standardBridge.module] : [])])].map(path => ({ path, sha256: sha(path) })), scope: 'Declared executable, public adapter, file arguments and artifact files only; included Node-bridge config and public module are automatic. No claim about undeclared dependencies or internal API-entry clocks' }
}
const identity = (context: any, input: BehaviourCase, step: number) => ({ project: context.adapter.project, caseId: input.id, sourceSha256: input.steps[step]!.sourceSha256, artifactSha256: context.artifactSha256, bindingSha256: context.bindingSha256, format: input.operation === 'svg-accessibility' ? 'svg' : 'json', coordinate: 'behaviour-step:' + step })

/** Injected executor keeps unit controls synthetic. The CLI is the only native
 * process entry and enforces the normal benchmark execution policy. */
export function captureBehaviourRaw(directory: string, adapter: BehaviourAdapter, cases: readonly BehaviourCase[], execute: BehaviourExecutor) {
  const root = resolve(directory)
  if (existsSync(root)) throw Error('Fresh native behaviour capture directory required')
  const before = snapshot(adapter), artifactSha256 = evidenceDigest(before.artifacts), bindingSha256 = evidenceDigest({ adapter: before.adapter, executable: before.executable, standardBridge: before.standardBridge, args: adapter.args ?? [], capabilities: adapter.capabilities, bindingDescription: adapter.bindingDescription })
  mkdirSync(root, { recursive: true }); copyFileSync(adapter.adapter, join(root, 'executed-adapter.txt')); copyFileSync(import.meta.filename, join(root, 'capture-producer.ts.txt'))
  const context = { schema: 'mermaid-behaviour-native-capture-v1', protocol: corpus.protocol, recordedRoot: root, adapter, artifactSnapshot: before, artifactSha256, bindingSha256, corpusSha256: sha(new URL('../corpus/mermaid-behaviour-tests.json', import.meta.url).pathname), producerSha256: sha(import.meta.filename), scope: 'Actual host-observed JSON-stdio adapter processes. Each request contains only source and operation; stdout/stderr and process outcomes are retained before assertions. No internal public-API entry or performance clock is inferred.' }
  writeFileSync(join(root, 'context.json'), JSON.stringify(context, null, 2))
  const journal = new InvocationJournal(join(root, 'journal')), steps: any[] = []
  for (const input of cases) for (const [step, stimulus] of input.steps.entries()) {
    if (!adapter.capabilities.includes(input.operation)) { steps.push({ caseId: input.id, step, unavailable: 'Declared native adapter does not expose this observable capability' }); continue }
    const request = JSON.stringify({ protocol: corpus.protocol, operation: input.operation === 'svg-accessibility' ? 'render-svg' : 'detect-family', source: stimulus.source }) + '\n'
    const started = journal.start(identity(context, input, step))
    let result: AdapterResult
    try { result = execute(adapter, request) } catch (error) { result = { status: null, signal: null, stdout: new Uint8Array(), stderr: new Uint8Array(), error: String(error) } }
    const streams = journal.streams(result.stdout, result.stderr)
    const outcome = result.error || result.signal || result.status !== 0 ? journal.failed(started, 'Host adapter process did not complete: ' + (result.error ?? result.signal ?? result.status), null, 'interrupted', streams) : journal.returned(started, result.stdout, null, streams)
    // Record transport identity only; qualification has not run yet.
    steps.push({ caseId: input.id, step, sourceSha256: stimulus.sourceSha256, requestSha256: evidenceBytesDigest(request), attemptId: started.attemptId, startedReceiptSha256: evidenceDigest(started), outcomeReceiptSha256: evidenceDigest(outcome) })
  }
  if (evidenceDigest(before) !== evidenceDigest(snapshot(adapter))) throw Error('Native adapter/executable/artifact changed during capture; raw attempts retained without qualification')
  writeFileSync(join(root, 'capture.json'), JSON.stringify({ schema: context.schema, contextSha256: sha(join(root, 'context.json')), steps }, null, 2))
  return context
}

export function readBehaviourCapture(directory: string, cases: readonly BehaviourCase[] = corpus.cases as BehaviourCase[]) {
  const root = realpathSync(directory), context = read(ownedBehaviourFile(root, 'context.json')), saved = read(ownedBehaviourFile(root, 'capture.json'))
  if (context.schema !== 'mermaid-behaviour-native-capture-v1' || context.protocol !== corpus.protocol || saved.contextSha256 !== sha(ownedBehaviourFile(root, 'context.json')) || context.corpusSha256 !== sha(new URL('../corpus/mermaid-behaviour-tests.json', import.meta.url).pathname) || context.producerSha256 !== sha(ownedBehaviourFile(root, 'capture-producer.ts.txt')) || context.artifactSnapshot.adapter.sha256 !== sha(ownedBehaviourFile(root, 'executed-adapter.txt')) || context.artifactSha256 !== evidenceDigest(context.artifactSnapshot.artifacts) || context.bindingSha256 !== evidenceDigest({ adapter: context.artifactSnapshot.adapter, executable: context.artifactSnapshot.executable, standardBridge: context.artifactSnapshot.standardBridge, args: context.adapter.args ?? [], capabilities: context.adapter.capabilities, bindingDescription: context.adapter.bindingDescription })) throw Error('Native behaviour capture/source/adapter ownership changed')
  for (const name of ['checkpoint.json', 'checkpoint-units']) ownedBehaviourFile(root, 'journal/' + name)
  for (const name of readdirSync(join(root, 'journal/checkpoint-units'))) ownedBehaviourFile(root, 'journal/checkpoint-units/' + name)
  const frames = readCheckpointEntries(join(root, 'journal'), { schema: 'trident-invocation-journal-v1' }).map(([, frame]) => admitInvocationEvidence(frame)), seen = new Set<string>()
  const rows = cases.map(input => {
    if (!saved.steps.some((entry: any) => entry.caseId === input.id)) return { ...assessBehaviourCase(input), evidence: { contextSha256: saved.contextSha256, steps: [] } }
    const values = input.steps.map((stimulus, step): BehaviourValue => {
      const matches = saved.steps.filter((entry: any) => entry.caseId === input.id && entry.step === step)
      if (matches.length !== 1) return { kind: 'unavailable', reason: 'Missing/duplicate source-owned native invocation' }
      const recorded = matches[0]
      if (recorded.unavailable) return { kind: 'unavailable', reason: recorded.unavailable }
      if (seen.has(recorded.attemptId)) throw Error('Native behaviour invocation reused across stimuli')
      seen.add(recorded.attemptId)
      const own = frames.filter(frame => frame.attemptId === recorded.attemptId), started = own.find(frame => frame.state === 'started'), outcome = own.find(frame => frame.state !== 'started')
      const request = JSON.stringify({ protocol: corpus.protocol, operation: input.operation === 'svg-accessibility' ? 'render-svg' : 'detect-family', source: stimulus.source }) + '\n'
      if (!started || !outcome || own.length !== 2 || evidenceDigest(started) !== recorded.startedReceiptSha256 || evidenceDigest(outcome) !== recorded.outcomeReceiptSha256 || outcome.startedReceiptSha256 !== recorded.startedReceiptSha256 || !sameIdentity(started.identity, identity(context, input, step)) || !sameIdentity(outcome.identity, started.identity) || recorded.sourceSha256 !== stimulus.sourceSha256 || recorded.requestSha256 !== evidenceBytesDigest(request)) throw Error('Native behaviour invocation/source/artifact/binding chain changed')
      const retained = (output: NonNullable<typeof outcome.output>) => {
        if (output.path !== join(context.recordedRoot, 'journal', 'outputs', output.sha256) || basename(output.path) !== output.sha256) throw Error('Native output borrowed a foreign path')
        const bytes = readFileSync(ownedBehaviourFile(root, 'journal/outputs/' + output.sha256))
        if (bytes.length !== output.bytes || evidenceBytesDigest(bytes) !== output.sha256) throw Error('Native actual output bytes changed')
        return bytes
      }
      if (outcome.streams) { retained(outcome.streams.stdout); retained(outcome.streams.stderr) }
      if (outcome.state !== 'returned' || !outcome.output) return { kind: 'unavailable', reason: 'Host adapter interruption/error supplies no observable behaviour credit' }
      const bytes = retained(outcome.output)
      try {
        const result = JSON.parse(bytes.toString())
        if (result.unsupported === true) return { kind: 'unavailable', reason: 'Native adapter reports this observable operation unsupported' }
        return input.operation === 'detect-family' ? { kind: 'family', family: result.family } : { kind: 'svg', svg: result.svg }
      } catch { return { kind: 'unavailable', reason: 'Actual native stdout is not one JSON return; retained raw bytes remain available' } }
    })
    return { ...assessBehaviourCase(input, values), evidence: { contextSha256: saved.contextSha256, steps: saved.steps.filter((entry: any) => entry.caseId === input.id) } }
  })
  const actualFrames = frames.filter(frame => seen.has(frame.attemptId)), dates = actualFrames.map(frame => frame.recordedAt).filter((date): date is string => typeof date === 'string' && Number.isFinite(Date.parse(date))).sort((a, b) => Date.parse(a) - Date.parse(b))
  return { context, rows, counts: Object.fromEntries(['passed', 'failed', 'unavailable', 'unrun'].map(status => [status, rows.filter(row => row.status === status).length])), actualCallBounds: { from: dates[0] ?? null, to: dates.at(-1) ?? null, attempts: seen.size, scope: 'Owned host-process request/outcome retention bounds; no internal API clock or timing score' } }
}
const sameIdentity = (a: unknown, b: unknown) => evidenceDigest(a) === evidenceDigest(b)

export function runNativeBehaviours(options: { adapter?: string; capture?: string; reference: string; out: string }) {
  const out = resolve(options.out), referenceRoot = realpathSync(options.reference)
  if (out === referenceRoot || out.startsWith(referenceRoot + '/')) throw Error('Output must be outside its immutable reference evidence')
  const reference = requireBehaviourReference(referenceRoot)
  if (existsSync(out) || !!options.adapter === !!options.capture) throw Error('Choose one native adapter or saved capture and a fresh output')
  if (options.adapter) {
    assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
    const adapter = readBehaviourAdapter(options.adapter)
    captureBehaviourRaw(join(out, 'native-capture'), adapter, corpus.cases as BehaviourCase[], (binding, request) => {
      const result = spawnSync(binding.executable, [binding.adapter, ...binding.args ?? []], { input: request, timeout: 20_000, killSignal: 'SIGKILL', maxBuffer: 32 * 1024 * 1024 })
      return { status: result.status, signal: result.signal, stdout: result.stdout ?? new Uint8Array(), stderr: result.stderr ?? new Uint8Array(), ...(result.error ? { error: String(result.error) } : {}) }
    })
  } else {
    const source = realpathSync(options.capture!)
    if (out === source || out.startsWith(source + '/')) throw Error('Replay output must be outside its captured parent')
    mkdirSync(out, { recursive: true })
    // Existing raw journal bytes are copied without changing stored paths;
    // the reader remaps only the owned content-addressed output location.
    cpSync(source, join(out, 'native-capture'), { recursive: true, dereference: false, filter: file => { if (lstatSync(file).isSymbolicLink()) throw Error('Native capture has a foreign symlink'); return true } })
  }
  const captured = readBehaviourCapture(join(out, 'native-capture'))
  cpSync(realpathSync(options.reference), join(out, 'reference-behaviour'), { recursive: true, dereference: false, filter: file => { if (lstatSync(file).isSymbolicLink()) throw Error('Behaviour reference contains a foreign symlink'); return true } })
  if (!sameIdentity(reference, requireBehaviourReference(join(out, 'reference-behaviour')))) throw Error('Actual reference raw evidence changed during capture/replay')
  const report = { schema: 'trident-mermaid-behaviour-report-v1', protocol: corpus.protocol, captureMode: options.adapter ? 'native-stdio' : 'retained-native-stdio', sourceCommit: corpus.sourceCommit, scope: corpus.scope, assessedAt: new Date().toISOString(), corpusSha256: sha(new URL('../corpus/mermaid-behaviour-tests.json', import.meta.url).pathname), referenceQualification: reference, referenceEvidence: { directory: 'reference-behaviour', reportSha256: sha(join(out, 'reference-behaviour/report.json')) }, targets: [{ project: captured.context.adapter.project, version: captured.context.adapter.version, planned: 49, counts: captured.counts, rows: captured.rows }], capture: { directory: 'native-capture', contextSha256: sha(join(out, 'native-capture/context.json')) }, projectInvocations: options.adapter ? captured.rows.flatMap(row => row.evidence.steps).filter((step: any) => step.attemptId).length : 0, timing: 'Coverage only, one host process per supported source stimulus, no warmups/retries or latency score. Internal API entry is not inferred from host spawn.', adapterProtocol: 'Each stdin request is {protocol,operation:detect-family|render-svg,source}. Return exactly one JSON {family:string}, {svg:string} or {unsupported:true}; no expected answer is sent.', limits: captured.context.artifactSnapshot.scope }
  writeFileSync(join(out, 'corpus.json'), JSON.stringify(corpus, null, 2) + '\n'); writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  return report
}
