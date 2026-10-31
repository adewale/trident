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
import { inventoryPublicTests, publicConformanceProtocol, publicParseFile, publicParseScope, type PublicTestDeclaration } from './public-conformance-inventory.ts'
import type { BenchmarkObservation, UnifiedSuiteResult } from './types.ts'

export interface PublicParseBinding {
  project: string; packageRoot: string; publicImport: string
  kind: 'mermaid-api' | 'result-parser'
  export?: string; familyPath?: string; configPath?: string; familyAliases?: Record<string, string>
}
export interface PublicConformanceOptions { source: string; out: string; bindings: PublicParseBinding[]; runnerRoot?: string; node?: string; timeoutMs?: number }
const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const write = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
const regex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export interface NativeCallback { fullName: string; status: string; location?: { line: number }; failureMessages: string[] }
export interface PublicCallEvent { type: string; caseId?: string; disposition?: string; missingFields?: string[]; [key: string]: unknown }
export function reducePublicCallbacks(cases: readonly PublicTestDeclaration[], callbacks: NativeCallback[], events: PublicCallEvent[], frameworkComplete: boolean, originalSourceControl = false) {
  return cases.map(input => {
    const matches = callbacks.filter(row => row.fullName === input.fullName && row.location?.line === input.line)
    const own = events.filter(row => row.caseId === input.id), calls = own.filter(row => row.type === 'call-result')
    let status: 'passed' | 'failed' | 'unsupported' | 'blocked', reason: string
    if (!frameworkComplete || matches.length !== 1 || !['passed', 'failed'].includes(matches[0]!.status) || !originalSourceControl && (!own.some(row => row.type === 'case-start') || !own.some(row => row.type === 'case-end') || !calls.length || own.filter(row => row.type === 'call-start').length !== calls.length)) {
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

/** The native Vitest runner executes the unchanged upstream spec. A Vite plugin
 * delegates only the public implementation method, never rewriting an assertion. */
export async function runPublicConformance(options: PublicConformanceOptions): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
  const source = realpathSync(options.source), out = resolve(options.out), node = options.node ?? 'node', startedAt = new Date().toISOString()
  if (existsSync(out) || !options.bindings.length || new Set(options.bindings.map(binding => binding.project)).size !== options.bindings.length) throw Error('Choose a fresh output and unique public target bindings')
  const reference = options.bindings.find(binding => binding.project === 'mermaid-js/mermaid' && binding.kind === 'mermaid-api')
  if (!reference) throw Error('Original public-test conformance requires the actual Mermaid reference binding')
  const inventory = inventoryPublicTests(source), cases = inventory.declarations.filter(row => row.disposition === 'eligible')
  const sourceRequire = createRequire(join(source, 'package.json')), runtime = options.runnerRoot ?? source
  const runnerPackage = createRequire(join(runtime, 'package.json')).resolve('vitest/package.json'), sourceRunnerPackage = sourceRequire.resolve('vitest/package.json')
  if (realpathSync(runnerPackage) !== realpathSync(sourceRunnerPackage)) throw Error('Original source and selected runner must resolve the same Vitest instance')
  const runnerDirectory = dirname(runnerPackage), runner = join(runnerDirectory, 'vitest.mjs')
  const runnerVersion = read(runnerPackage).version, implementation = join(source, 'packages/mermaid/src/mermaidAPI.ts'), implementationSha256 = hash(readFileSync(implementation))
  const runtimeQualification = qualifyOriginalRuntime(source, runtime, node)
  const producers = protocolIdentity(tridentDirectory, ['unified/public-conformance.ts', 'unified/public-conformance-binding.mjs'])
  mkdirSync(out, { recursive: true }); write(join(out, 'inventory.json'), inventory)
  const targetIdentities = options.bindings.map(binding => {
    const require = createRequire(join(binding.packageRoot, 'package.json')), entry = require.resolve(binding.publicImport), pkg = read(join(binding.packageRoot, 'package.json'))
    if (!binding.publicImport.startsWith(pkg.name) || !existsSync(entry)) throw Error('Binding does not resolve its installed public package export')
    return { binding, entry, version: pkg.version, entrySha256: hash(readFileSync(entry)), dependencies: captureInstalledDependencyClosure(binding.packageRoot) }
  })
  write(join(out, 'context.json'), { protocol: publicConformanceProtocol, sourceCommit: inventory.sourceCommit, sourceConfigSha256: hash(readFileSync(join(source, 'vite.config.ts'))), implementationSha256, runtimeQualification, producers, runnerVersion, node, targets: targetIdentities, sampling: 'One execution of each original callback per target; no renderers or speed comparison.', scope: publicParseScope })
  const execute = (name: string, binding?: PublicParseBinding) => {
    const directory = join(out, name); mkdirSync(directory)
    const calls = join(directory, 'calls.jsonl'), raw = join(directory, 'vitest.json'), config = join(directory, 'config.mts'), setup = join(directory, 'setup.mjs')
    const prefix = `import base from ${JSON.stringify(join(source, 'vite.config.ts'))}\n`
    let plugin = '', setupFile = ''
    if (binding) {
      setupFile = setup
      writeFileSync(setup, `import fs from 'node:fs';\nimport {beforeEach,afterEach,expect} from ${JSON.stringify(pathToFileURL(join(runnerDirectory, 'dist/index.js')).href)};\nimport {bindPublicParse} from ${JSON.stringify(pathToFileURL(join(tridentDirectory, 'unified/public-conformance-binding.mjs')).href)};\nconst bindings=${JSON.stringify(binding)},cases=${JSON.stringify(cases.map(row => ({ id: row.id, name: row.fullName })))},file=${JSON.stringify(calls)};let current,sequence=0;const append=v=>fs.appendFileSync(file,JSON.stringify({...v,caseId:current?.id})+'\\n');\nconst target=await bindPublicParse(bindings,event=>append({type:'call-result',...event}));\nbeforeEach(()=>{current=cases.find(row=>row.name===expect.getState().currentTestName);if(current){append({type:'case-start'});target.reset()}});\nafterEach(()=>{if(current)append({type:'case-end'})});\nglobalThis.__tridentPublicParse=async(text,options)=>{append({type:'call-start',invocation:++sequence,source:text});return target.parse(text,options)};\n`)
      plugin = `import {replacePublicParseBody} from ${JSON.stringify(join(tridentDirectory, 'unified/public-conformance-inventory.ts'))};\nconst boundary={name:'trident-sha-bound-public-parse',enforce:'pre',transform(code,id){if(id.split('?')[0]!==${JSON.stringify(implementation)})return;return {code:replacePublicParseBody(code,${JSON.stringify(implementationSha256)}),map:null}}};\n`
    }
    const selected = '^(' + cases.map(row => regex(row.fullName)).join('|') + ')$'
    writeFileSync(config, prefix + plugin + `export default {...base,plugins:[...(base.plugins??[]),${binding ? 'boundary' : ''}],test:{...base.test,include:[${JSON.stringify(publicParseFile)}],testNamePattern:${JSON.stringify(selected)},setupFiles:${JSON.stringify(setupFile ? [setupFile] : [])},fileParallelism:false,maxWorkers:1,minWorkers:1}}\n`)
    const args = [runner, 'run', '--config', config, '--includeTaskLocation', '--reporter', 'json', '--outputFile', raw]
    write(join(directory, 'invocation.json'), { node, args, cwd: source, binding: binding ?? 'unmodified-original-source', selectedCaseIds: cases.map(row => row.id), snapshotPolicy: 'CI mode; no updates', startedAt: new Date().toISOString() })
    const child = spawnSync(node, args, { cwd: source, encoding: 'utf8', env: { ...process.env, CI: 'true' }, timeout: options.timeoutMs ?? 120_000, maxBuffer: 16 * 1024 * 1024 })
    writeFileSync(join(directory, 'runner.log'), (child.stdout ?? '') + (child.stderr ?? ''))
    const native = existsSync(raw) ? read(raw) : undefined, callbacks: NativeCallback[] = native?.testResults?.flatMap((file: any) => file.assertionResults ?? []) ?? []
    const events: PublicCallEvent[] = existsSync(calls) ? readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : []
    // The native control has no invocation instrumentation. Its callback status
    // is observed, but no actual public-call count is inferred.
    const snapshots = native?.snapshot
    if (snapshots && (snapshots.added || snapshots.updated || snapshots.filesAdded || snapshots.filesUpdated || snapshots.didUpdate)) throw Error('Original runner changed snapshots; conformance is blocked')
    const complete = !child.error && !!native && !(native.numUnhandledErrors ?? 0) && !native.unhandledErrors?.length && native.testResults?.every((file: any) => !file.message || file.assertionResults?.length)
    const rows = reducePublicCallbacks(cases, callbacks, events, complete, !binding)
    const receipt = { mode: binding ? 'public-binding-original-assertions' : 'actual-original-control', exitCode: child.status, signal: child.signal, error: child.error ? String(child.error) : null, frameworkComplete: complete, rows, callbacks: callbacks.filter(row => cases.some(input => input.fullName === row.fullName)), originalSpecSha256: hash(readFileSync(join(source, publicParseFile))), originalImplementationSha256: hash(readFileSync(implementation)) }
    write(join(directory, 'receipt.json'), receipt)
    if (receipt.originalImplementationSha256 !== implementationSha256 || receipt.originalSpecSha256 !== inventory.files.find(file => file.path === publicParseFile)!.sha256) throw Error('Original source changed during conformance collection')
    return receipt
  }
  const original = execute('original-control'), adaptedReference = execute('reference-public-binding', reference)
  const qualification = qualifyPublicReference(cases, original.rows, adaptedReference.rows)
  write(join(out, 'reference-qualification.json'), qualification)
  const targets: any[] = [], observations: BenchmarkObservation[] = []
  if (qualification.qualified) for (const identity of targetIdentities) {
    const result = identity.binding.project === reference.project ? adaptedReference : execute(Buffer.from(identity.binding.project).toString('base64url'), identity.binding)
    const counts = Object.fromEntries(['passed', 'failed', 'unsupported', 'blocked'].map(status => [status, result.rows.filter(row => row.status === status).length]))
    targets.push({ project: identity.binding.project, version: identity.version, counts, planned: cases.length, rows: result.rows })
    for (const row of result.rows) observations.push({ suite: 'public-conformance', surface: 'public:parse', runtime: 'Node + original Vitest', family: cases.find(input => input.id === row.caseId)!.family, caseId: row.caseId, operation: 'original-public-test-callback', format: 'assertions', mode: publicConformanceProtocol, status: row.status, detail: row.reason, metrics: { project: identity.binding.project, version: identity.version, measuredAt: new Date().toISOString(), individualAssertionCountAvailable: false, originalCallbackSha256: row.callbackSha256, sourceCommit: inventory.sourceCommit, publicCalls: row.publicCalls } })
    if (hash(readFileSync(identity.entry)) !== identity.entrySha256 || JSON.stringify(captureInstalledDependencyClosure(identity.binding.packageRoot)) !== JSON.stringify(identity.dependencies)) throw Error('Public target entry changed during original-test execution')
  }
  const result: UnifiedSuiteResult = { id: 'public-conformance', status: !qualification.qualified ? 'blocked' : observations.some(row => row.status === 'failed') ? 'failed' : observations.some(row => row.status === 'blocked') ? 'blocked' : 'passed', startedAt, finishedAt: new Date().toISOString(), observations, gaps: [publicParseScope, inventory.wholeSuiteBlocker, ...(!qualification.qualified ? ['Original/source public-reference equivalence is unqualified; no peer score was constructed.'] : [])], artifacts: ['inventory.json', 'context.json', 'reference-qualification.json', 'public-conformance-report.json'] }
  write(join(out, 'public-conformance-report.json'), { inventory: inventory.counts, qualification, targets, wholeSuiteConformanceQualified: false, result })
  write(join(out, 'result.json'), result)
  return result
}

if (import.meta.main) {
  if (process.argv.includes('--help')) console.log('bun unified/public-conformance.ts --source PINNED_SOURCE --out FRESH_DIR [--bindings JSON_FILE --runner-root RUNTIME]\n--inventory-only writes every original declaration and the fixed public-parse scope without executing a parser. Otherwise native original callbacks and assertions execute unchanged, qualified against the original source runner. No drawing or speed score.')
  else {
    const args = new Map<string, string>(); let inventoryOnly = false
    for (let index = 2; index < process.argv.length; index++) { const key = process.argv[index]!; if (key === '--inventory-only') { inventoryOnly = true; continue }; const value = process.argv[++index]; if (!['--source', '--out', '--bindings', '--runner-root', '--node'].includes(key) || !value || args.has(key)) throw Error('Use --help'); args.set(key, value) }
    const source = args.get('--source'), out = args.get('--out')
    if (!source || !out) throw Error('Use --help')
    if (inventoryOnly) { if (existsSync(out)) throw Error('Fresh output required'); mkdirSync(out, { recursive: true }); write(join(out, 'inventory.json'), inventoryPublicTests(source)) }
    else { if (!args.get('--bindings')) throw Error('Explicit reviewed public bindings required'); console.log(JSON.stringify(await runPublicConformance({ source, out, bindings: read(args.get('--bindings')!), runnerRoot: args.get('--runner-root'), node: args.get('--node') }))) }
  }
}
