import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { captureInstalledDependencyClosure } from '../portable/artifact-dependencies.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { qualifyOriginalRuntime } from './upstream-runtime-qualification.ts'
import { tridentDirectory } from './trident-paths.ts'
import { replacePublicRenderBody, inventoryPublicTests, publicConformanceProtocol, publicParseFiles, publicParseScope, type PublicTestDeclaration } from './public-conformance-inventory.ts'
import type { BenchmarkObservation, UnifiedSuiteResult } from './types.ts'

export interface PublicParseBinding {
  project: string; packageRoot: string; publicImport: string
  kind: 'mermaid-api' | 'result-parser'
  export?: string; familyPath?: string; configPath?: string; familyAliases?: Record<string, string>
  detection?: { export: string; familyPath: string; kindPath?: string; acceptedKind?: string }
  render?: { export: string; options?: Record<string, unknown> }
}
export interface PublicConformanceOptions { source: string; out: string; bindings: PublicParseBinding[]; controlEvidence?: string; runnerRoot?: string; node?: string; timeoutMs?: number }
const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const write = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
const regex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export interface NativeCallback { fullName: string; status: string; location?: { line: number }; failureMessages: string[] }
export interface PublicCallEvent { type: string; caseId?: string; disposition?: string; missingFields?: string[]; [key: string]: unknown }
export function reducePublicCallbacks(cases: readonly PublicTestDeclaration[], callbacks: NativeCallback[], events: PublicCallEvent[], frameworkComplete: boolean, originalSourceControl = false) {
  return cases.map(input => {
    const matches = callbacks.filter(row => row.fullName === input.fullName && row.location?.line === (input.nativeRegistrationLine ?? input.line))
    const own = events.filter(row => row.caseId === input.id), calls = own.filter(row => row.type === 'call-result')
    const starts = own.filter(row => row.type === 'case-start'), ends = own.filter(row => row.type === 'case-end')
    const completeEvents = starts.length === 1 && ends.length === 1 && own[0]?.type === 'case-start' && own.at(-1)?.type === 'case-end' && calls.length > 0 && own.filter(row => row.type === 'call-start').length === calls.length
    let outstanding = 0, orderedEvents = true
    for (const event of own) { if (event.type === 'call-start') outstanding++; if (event.type === 'call-result' && --outstanding < 0) orderedEvents = false }
    const observedCalls = completeEvents && orderedEvents && outstanding === 0
    let status: 'passed' | 'failed' | 'unsupported' | 'blocked', reason: string
    if (!frameworkComplete || matches.length !== 1 || !['passed', 'failed'].includes(matches[0]!.status) || !originalSourceControl && !observedCalls) {
      status = 'blocked'; reason = 'Native callback, public invocation or terminal evidence is incomplete; no inferred pass.'
    } else if (calls.some(row => row.disposition === 'binding-unavailable')) {
      status = 'blocked'; reason = 'Public binding could not establish its reviewed return contract.'
    } else if (calls.some(row => row.disposition === 'unsupported')) {
      status = 'unsupported'; reason = 'Public parser reports preserved/unregistered syntax; an error assertion cannot turn unsupported validation into conformance.'
    } else if (calls.some(row => input.requiredReturnFields.some(field => row.missingFields?.includes(field)))) {
      status = 'blocked'; reason = 'An original asserted return field is not exposed by the reviewed public binding.'
    } else { status = matches[0]!.status as 'passed' | 'failed'; reason = status === 'passed' ? 'Original callback and assertions passed on this public binding.' : matches[0]!.failureMessages.join('\n') }
    return { caseId: input.id, name: input.fullName, path: input.path, line: input.line, callbackSha256: input.callbackSha256, status, reason, publicCalls: originalSourceControl ? null : calls.length, nativeStatus: matches[0]?.status ?? null }
  })
}
export function qualifyPublicReference(cases: readonly PublicTestDeclaration[], original: ReturnType<typeof reducePublicCallbacks>, adapted: ReturnType<typeof reducePublicCallbacks>) {
  if (!cases.length || original.length !== cases.length || adapted.length !== cases.length || new Set(original.map(row => row.caseId)).size !== cases.length || new Set(adapted.map(row => row.caseId)).size !== cases.length) throw Error('Reference qualification omitted or duplicated original cases')
  const differences = cases.flatMap(input => {
    const baseline = original.find(row => row.caseId === input.id), publicApi = adapted.find(row => row.caseId === input.id)
    return !baseline || !publicApi || baseline.status !== 'passed' || publicApi.status !== baseline.status || baseline.callbackSha256 !== input.callbackSha256 || publicApi.callbackSha256 !== input.callbackSha256 ? [{ caseId: input.id, original: baseline?.status ?? 'missing', adapted: publicApi?.status ?? 'missing' }] : []
  })
  return { qualified: differences.length === 0, cases: cases.length, differences, scope: publicParseScope }
}

/** Reassessment may repair location mapping without rerunning unchanged
 * controls. Actual source, host, parameter inventory, package and public binding
 * identities must remain equal. Measurement provenance stays with its parent. */
export function validateRetainedPublicControls(prior: any, inventory: any, current: any, cases: readonly PublicTestDeclaration[]) {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  for (const key of ['protocol', 'sourceCommit', 'sourceConfigSha256', 'originalJsdomHelperSha256', 'implementationSha256', 'detectionSha256', 'runnerVersion', 'runtimeQualification', 'rawCapture', 'node']) if (!same(prior[key], current[key])) throw Error('Retained control identity differs: ' + key)
  const callbackIdentity = (rows: readonly PublicTestDeclaration[]) => rows.map(row => ({ id: row.id, declarationId: row.declarationId, sourceSha256: row.sourceSha256, callbackSha256: row.callbackSha256, name: row.fullName, operation: row.publicOperation, parameter: row.parameter }))
  if (!same(callbackIdentity(inventory.callbacks ?? []), callbackIdentity(cases))) throw Error('Retained original callback/parameter inventory differs')
  const reference = (context: any) => context.targets?.find((target: any) => target.binding?.project === 'mermaid-js/mermaid')
  const before = reference(prior), after = reference(current)
  if (!before || !after || !same(before, after)) throw Error('Retained public reference artifact or binding differs')
  const binder = (context: any) => context.producers?.find((row: string) => row.endsWith('\tunified/public-conformance-binding.mjs'))
  if (!binder(prior) || binder(prior) !== binder(current)) throw Error('Retained public boundary adapter changed')
}

/** The native Vitest runner executes the unchanged upstream spec. A Vite plugin
 * delegates only the public implementation method, never rewriting an assertion. */
export async function runPublicConformance(options: PublicConformanceOptions): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
  const source = realpathSync(options.source), out = resolve(options.out), node = options.node ?? 'node', startedAt = new Date().toISOString()
  if (existsSync(out) || !options.bindings.length || new Set(options.bindings.map(binding => binding.project)).size !== options.bindings.length) throw Error('Choose a fresh output and unique public target bindings')
  const reference = options.bindings.find(binding => binding.project === 'mermaid-js/mermaid' && binding.kind === 'mermaid-api')
  if (!reference) throw Error('Original public-test conformance requires the actual Mermaid reference binding')
  const inventory = inventoryPublicTests(source), cases = inventory.callbacks
  const sourceRequire = createRequire(join(source, 'package.json')), runtime = options.runnerRoot ?? source
  const runnerPackage = createRequire(join(runtime, 'package.json')).resolve('vitest/package.json'), sourceRunnerPackage = sourceRequire.resolve('vitest/package.json')
  if (realpathSync(runnerPackage) !== realpathSync(sourceRunnerPackage)) throw Error('Original source and selected runner must resolve the same Vitest instance')
  const runnerDirectory = dirname(runnerPackage), runner = join(runnerDirectory, 'vitest.mjs')
  const runnerVersion = read(runnerPackage).version, implementation = join(source, 'packages/mermaid/src/mermaidAPI.ts'), implementationSha256 = hash(readFileSync(implementation)), detection = join(source, 'packages/mermaid/src/diagram-api/detectType.ts'), detectionSha256 = hash(readFileSync(detection))
  const runtimeQualification = qualifyOriginalRuntime(source, runtime, node), delegatedRenderSha256 = hash(replacePublicRenderBody(readFileSync(implementation, 'utf8'), implementationSha256))
  const producers = protocolIdentity(tridentDirectory, ['unified/public-conformance.ts', 'unified/public-conformance-binding.mjs'])
  mkdirSync(out, { recursive: true }); write(join(out, 'inventory.json'), inventory)
  const targetIdentities = options.bindings.map(binding => {
    const require = createRequire(join(binding.packageRoot, 'package.json')), entry = require.resolve(binding.publicImport), pkg = read(join(binding.packageRoot, 'package.json'))
    if (binding.publicImport !== pkg.name && !binding.publicImport.startsWith(pkg.name + '/') || !existsSync(entry)) throw Error('Binding does not resolve its installed public package export')
    return { binding, entry, version: pkg.version, entrySha256: hash(readFileSync(entry)), dependencies: captureInstalledDependencyClosure(binding.packageRoot) }
  })
  write(join(out, 'context.json'), { protocol: publicConformanceProtocol, sourceCommit: inventory.sourceCommit, sourceConfigSha256: hash(readFileSync(join(source, 'vite.config.ts'))), originalJsdomHelperSha256: hash(readFileSync(join(source, 'packages/mermaid/src/tests/util.ts'))), implementationSha256, detectionSha256, runtimeQualification, producers, runnerVersion, node, rawCapture: { protocol: 'durable-public-return-json-v1', parserReturns: 'Actual JSON-safe native result/config retained; unserializable loss explicitly marked', eventPersistence: 'Fsynced complete event before original assertions', originalSourceControl: 'Native callbacks only; original source return values are not instrumented' }, targets: targetIdentities, sampling: 'One execution per original callback/parameter. Original jsdomIt geometry mocks retained for structural render assertions; no speed comparison.', scope: publicParseScope })
  let retained: string | undefined
  if (options.controlEvidence) {
    retained = realpathSync(options.controlEvidence)
    const prior = read(join(retained, 'context.json')), priorInventory = read(join(retained, 'inventory.json'))
    const current = read(join(out, 'context.json'))
    validateRetainedPublicControls(prior, priorInventory, current, cases)
    write(join(out, 'retained-controls.json'), { directory: retained, contextSha256: hash(readFileSync(join(retained, 'context.json'))), inventorySha256: hash(readFileSync(join(retained, 'inventory.json'))), policy: 'No original/reference parser or renderer rerun. Native reports and invocation events are regraded against unchanged callbacks; prior measurement producer identities remain in their original context.' })
  }
  const execute = (name: string, binding?: PublicParseBinding, retainedControl?: string) => {
    const directory = join(out, name); mkdirSync(directory)
    const calls = join(directory, 'calls.jsonl'), raw = join(directory, 'vitest.json'), config = join(directory, 'config.mts'), setup = join(directory, 'setup.mjs')
    const prefix = `import base from ${JSON.stringify(join(source, 'vite.config.ts'))}\n`
    let plugin = '', setupFile = ''
    if (binding) {
      setupFile = setup
      writeFileSync(setup, `import {beforeEach,afterEach} from ${JSON.stringify(pathToFileURL(join(runnerDirectory, 'dist/index.js')).href)};\nimport {getTestName} from ${JSON.stringify(pathToFileURL(sourceRequire.resolve('@vitest/runner/utils')).href)};\nimport {bindPublicParse,bindPublicDetect,bindPublicRender,appendPublicEvent} from ${JSON.stringify(pathToFileURL(join(tridentDirectory, 'unified/public-conformance-binding.mjs')).href)};\nconst bindings=${JSON.stringify(binding)},cases=${JSON.stringify(cases.map(row => ({ id: row.id, name: row.fullName, operation: row.publicOperation })))},file=${JSON.stringify(calls)};let current,sequence=0;const append=v=>appendPublicEvent(file,{...v,caseId:current?.id});\nconst target=await bindPublicParse(bindings,event=>append({type:'call-result',...event})),detector=await bindPublicDetect(bindings,event=>append({type:'call-result',...event})),renderer=await bindPublicRender(bindings,event=>append({type:'call-result',...event}));\nbeforeEach(context=>{const name=getTestName(context.task,' ');current=cases.find(row=>row.name===name);if(current){globalThis.__tridentPublicOperation=current.operation;append({type:'case-start'});target.reset()}else append({type:'unmapped-case',nativeName:name})});\nafterEach(()=>{if(current)append({type:'case-end'})});\nglobalThis.__tridentPublicParse=async(text,options)=>{append({type:'call-start',invocation:++sequence,source:text});return target.parse(text,options)};\nglobalThis.__tridentPublicDetect=(text,config)=>{append({type:'call-start',invocation:++sequence,source:text});return detector.detect(text,config)};\nglobalThis.__tridentPublicRender=async(id,text,container)=>{append({type:'call-start',invocation:++sequence,source:text,renderId:id});return renderer.render(id,text,container)};\n`)
      plugin = `import fs from 'node:fs';\nimport {replacePublicParseBody,replacePublicDetectBody,replacePublicRenderBody} from ${JSON.stringify(join(tridentDirectory, 'unified/public-conformance-inventory.ts'))};\nconst boundary={name:'trident-sha-bound-public-parse',enforce:'pre',load(id){if(id.split('?')[0]===${JSON.stringify(detection)})return {code:replacePublicDetectBody(fs.readFileSync(${JSON.stringify(detection)},'utf8'),${JSON.stringify(detectionSha256)}),map:null};if(id.split('?')[0]!==${JSON.stringify(implementation)})return;return {code:replacePublicParseBody(replacePublicRenderBody(fs.readFileSync(${JSON.stringify(implementation)},'utf8'),${JSON.stringify(implementationSha256)}),${JSON.stringify(delegatedRenderSha256)}),map:null}}};\n`
    }
    const selected = '^(' + cases.map(row => regex(row.fullName)).join('|') + ')$'
    writeFileSync(config, prefix + plugin + `export default {...base,plugins:[...(base.plugins??[]),${binding ? 'boundary' : ''}],test:{...base.test,include:${JSON.stringify(publicParseFiles)},testNamePattern:${JSON.stringify(selected)},setupFiles:${JSON.stringify(setupFile ? [setupFile] : [])},fileParallelism:false,maxWorkers:1,minWorkers:1}}\n`)
    const args = [runner, 'run', '--config', config, '--includeTaskLocation', '--reporter', 'json', '--outputFile', raw]
    write(join(directory, 'invocation.json'), { node, args, cwd: source, binding: binding ?? 'unmodified-original-source', selectedCaseIds: cases.map(row => row.id), snapshotPolicy: 'CI mode; no updates', startedAt: new Date().toISOString() })
    const child = retainedControl ? (() => {
      const priorDirectory = join(retainedControl, name), receipt = read(join(priorDirectory, 'receipt.json'))
      if (!receipt.frameworkComplete || receipt.originalImplementationSha256 !== implementationSha256 || receipt.originalDetectorSha256 !== detectionSha256 || publicParseFiles.some(file => receipt.originalSpecSha256[file] !== inventory.files.find(item => item.path === file)!.sha256)) throw Error('Retained original control source or framework evidence changed')
      const retainedFiles = ['vitest.json', 'runner.log', 'invocation.json', ...(binding ? ['calls.jsonl', 'setup.mjs'] : []), 'config.mts']
      const files = retainedFiles.map(file => { const bytes = readFileSync(join(priorDirectory, file)); writeFileSync(join(directory, file), bytes); return { file, sha256: hash(bytes) } })
      write(join(directory, 'retained-parent.json'), { directory: priorDirectory, receiptSha256: hash(readFileSync(join(priorDirectory, 'receipt.json'))), files })
      return { status: receipt.exitCode, signal: receipt.signal, error: receipt.error, stdout: readFileSync(join(directory, 'runner.log'), 'utf8'), stderr: '' }
    })() : spawnSync(node, args, { cwd: source, encoding: 'utf8', env: { ...process.env, CI: 'true' }, timeout: options.timeoutMs ?? 120_000, maxBuffer: 16 * 1024 * 1024 })
    writeFileSync(join(directory, 'runner.log'), (child.stdout ?? '') + (child.stderr ?? ''))
    const native = existsSync(raw) ? read(raw) : undefined, callbacks: NativeCallback[] = native?.testResults?.flatMap((file: any) => file.assertionResults ?? []) ?? []
    const events: PublicCallEvent[] = existsSync(calls) ? readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : []
    // The native control has no invocation instrumentation. Its callback status
    // is observed, but no actual public-call count is inferred.
    const snapshots = native?.snapshot
    if (snapshots && (snapshots.added || snapshots.updated || snapshots.filesAdded || snapshots.filesUpdated || snapshots.didUpdate)) throw Error('Original runner changed snapshots; conformance is blocked')
    const complete = !child.error && child.signal === null && [0, 1].includes(child.status ?? -1) && !!native && !(native.numUnhandledErrors ?? 0) && !native.unhandledErrors?.length && native.testResults?.every((file: any) => !file.message || file.assertionResults?.length)
    const rows = reducePublicCallbacks(cases, callbacks, events, complete, !binding)
    const receipt = { mode: binding ? 'public-binding-original-assertions' : 'actual-original-control', exitCode: child.status, signal: child.signal, error: child.error ? String(child.error) : null, frameworkComplete: complete, rows, callbacks: callbacks.filter(row => cases.some(input => input.fullName === row.fullName)), originalSpecSha256: Object.fromEntries(publicParseFiles.map(file => [file, hash(readFileSync(join(source, file)))])), originalImplementationSha256: hash(readFileSync(implementation)), originalDetectorSha256: hash(readFileSync(detection)) }
    write(join(directory, 'receipt.json'), receipt)
    if (receipt.originalImplementationSha256 !== implementationSha256 || receipt.originalDetectorSha256 !== detectionSha256 || publicParseFiles.some(file => receipt.originalSpecSha256[file] !== inventory.files.find(item => item.path === file)!.sha256)) throw Error('Original source changed during conformance collection')
    return receipt
  }
  const original = execute('original-control', undefined, retained), adaptedReference = execute('reference-public-binding', reference, retained)
  const qualification = qualifyPublicReference(cases, original.rows, adaptedReference.rows)
  write(join(out, 'reference-qualification.json'), qualification)
  const targets: any[] = [], observations: BenchmarkObservation[] = []
  if (qualification.qualified) for (const identity of targetIdentities) {
    const result = identity.binding.project === reference.project ? adaptedReference : execute(Buffer.from(identity.binding.project).toString('base64url'), identity.binding)
    const counts = Object.fromEntries(['passed', 'failed', 'unsupported', 'blocked'].map(status => [status, result.rows.filter(row => row.status === status).length]))
    targets.push({ project: identity.binding.project, version: identity.version, counts, planned: cases.length, rows: result.rows })
    for (const row of result.rows) observations.push({ suite: 'public-conformance', surface: 'public:' + cases.find(input => input.id === row.caseId)!.publicOperation, runtime: 'Node + original Vitest', family: cases.find(input => input.id === row.caseId)!.family, caseId: row.caseId, operation: 'original-public-test-callback', format: 'assertions', mode: publicConformanceProtocol, status: row.status, detail: row.reason, metrics: { project: identity.binding.project, version: identity.version, measuredAt: new Date().toISOString(), individualAssertionCountAvailable: false, originalCallbackSha256: row.callbackSha256, sourceCommit: inventory.sourceCommit, publicCalls: row.publicCalls } })
    if (hash(readFileSync(identity.entry)) !== identity.entrySha256 || JSON.stringify(captureInstalledDependencyClosure(identity.binding.packageRoot)) !== JSON.stringify(identity.dependencies)) throw Error('Public target entry changed during original-test execution')
  }
  const result: UnifiedSuiteResult = { id: 'public-conformance', status: !qualification.qualified ? 'blocked' : observations.some(row => row.status === 'failed' || row.status === 'unsupported') ? 'failed' : observations.some(row => row.status === 'blocked') ? 'blocked' : 'passed', startedAt, finishedAt: new Date().toISOString(), observations, gaps: [publicParseScope, inventory.wholeSuiteBlocker, ...(!qualification.qualified ? ['Original/source public-reference equivalence is unqualified; no peer score was constructed.'] : [])], artifacts: ['inventory.json', 'context.json', 'reference-qualification.json', 'public-conformance-report.json'] }
  write(join(out, 'public-conformance-report.json'), { inventory: inventory.counts, qualification, targets, wholeSuiteConformanceQualified: false, result })
  write(join(out, 'result.json'), result)
  return result
}

if (import.meta.main) {
  if (process.argv.includes('--help')) console.log('bun unified/public-conformance.ts --source PINNED_SOURCE --out FRESH_DIR [--bindings JSON_FILE --runner-root RUNTIME --controls RETAINED_CONTROL_DIR]\n--inventory-only writes every original declaration and the fixed public-parse scope without executing a parser. Otherwise native original callbacks and assertions execute unchanged, qualified against the original source runner. No drawing or speed score.')
  else {
    const args = new Map<string, string>(); let inventoryOnly = false
    for (let index = 2; index < process.argv.length; index++) { const key = process.argv[index]!; if (key === '--inventory-only') { inventoryOnly = true; continue }; const value = process.argv[++index]; if (!['--source', '--out', '--bindings', '--runner-root', '--node', '--controls'].includes(key) || !value || args.has(key)) throw Error('Use --help'); args.set(key, value) }
    const source = args.get('--source'), out = args.get('--out')
    if (!source || !out) throw Error('Use --help')
    if (inventoryOnly) { if (existsSync(out)) throw Error('Fresh output required'); mkdirSync(out, { recursive: true }); write(join(out, 'inventory.json'), inventoryPublicTests(source)) }
    else { if (!args.get('--bindings')) throw Error('Explicit reviewed public bindings required'); console.log(JSON.stringify(await runPublicConformance({ source, out, bindings: read(args.get('--bindings')!), controlEvidence: args.get('--controls'), runnerRoot: args.get('--runner-root'), node: args.get('--node') }))) }
  }
}
