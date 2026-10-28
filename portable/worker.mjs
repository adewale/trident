import { createRequire } from 'node:module'
import { join } from 'node:path'
import { createExtraCommunityApi } from '../unified/community-extra-adapters.mjs'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { portableRenderOptions } from './configuration.ts'
import { qualifyPortable } from './fidelity.ts'
import { assertBenchmarkExecutionAllowed } from './ci-policy.ts'
import { PORTABLE_MEASUREMENT_PROTOCOL } from './protocol.ts'

assertBenchmarkExecutionAllowed()

// Kept deliberately independent of Agentic source and the parent harness runtime.
const transport = process.argv[2]
const job = transport === '--ipc' ? await new Promise(resolve => process.once('message', message => { if (message?.phase !== 'job') throw Error('Invalid worker job message'); resolve(message.job) })) : transport === '--stdio' ? JSON.parse(readFileSync(0, 'utf8')) : JSON.parse(readFileSync(transport, 'utf8'))
const started = process.hrtime.bigint()
const clock = () => Number(process.hrtime.bigint()) / 1e6
const runtime = { executable: process.execPath, node: process.versions.node, platform: process.platform, arch: process.arch }
const result = { protocol: PORTABLE_MEASUREMENT_PROTOCOL, caseId: job.testCase.id, family: job.testCase.family, mode: job.mode, round: job.round, replica: job.replica, sample: job.sample, status: 'blocked', importMs: 0, tracks: {}, iterations: {}, outputBytes: 0, qualification: null, prelude: [], runtime }
const errorText = error => error instanceof Error ? String(error.stack ?? error) : String(error)
const thenable = value => value && typeof value.then === 'function'
let outputFailure, outputFailureSvg, disposePublicFactory
const publicCleanups = []
const rememberOutputFailure = (qualification, expectedCase, svg) => {
  if (!outputFailure && expectedCase.expected.accept && qualification.evidence?.outputAdmission !== 'passed') { outputFailure = qualification; outputFailureSvg = typeof svg === 'string' ? svg : undefined }
}
function collect() { if (global.gc) { global.gc(); global.gc() } }
try {
  const module = await import(pathToFileURL(job.artifact.entry).href)
  const api = module.default && typeof module.default === 'object' ? { ...module.default, ...module } : module
  let publicRenderer
  if (job.artifact.adapter === 'public-package') {
    const config = job.artifact.publicConfig
    if (!config || !Array.isArray(config.outputs) || !config.outputs.includes('svg') || JSON.parse(readFileSync(join(job.artifact.root, 'package.json'), 'utf8')).name !== config.package) throw Error('Public adapter package differs from the actual installed artifact')
    const prepared = { ...job.artifact, module: job.artifact.entry, kind: 'node' }
    const renderer = await createExtraCommunityApi({ artifact: prepared, node: { id: job.artifact.project, benchmark: config }, config, output: 'svg', require: createRequire(join(job.artifact.root, 'package.json')), cleanups: publicCleanups })
    publicRenderer = renderer.invoke
    result.apiBoundary = renderer.boundary
  }
  const binding = job.artifact.binding
  const at = (root, path) => { const keys = path.split('.'); const receiver = keys.slice(0, -1).reduce((value, key) => value?.[key], root); return { receiver, value: receiver?.[keys.at(-1)] } }
  let targetApi = api
  if (binding?.factory) {
    const factory = at(api, binding.factory)
    if (typeof factory.value !== 'function') throw Error('Declared public factory is unavailable')
    targetApi = await factory.value.call(factory.receiver)
    if (binding.dispose) { const cleanup = at(targetApi, binding.dispose); if (typeof cleanup.value !== 'function') throw Error('Declared public disposal method is unavailable'); disposePublicFactory = () => cleanup.value.call(cleanup.receiver) }
  }
  const declared = job.artifact.adapter === 'declared' ? at(targetApi, binding.export) : undefined
  const receiver = declared?.receiver
  const rendering = publicRenderer ?? (declared ? declared.value : job.artifact.adapter === 'agentic' ? api.renderMermaidSVG : job.artifact.adapter === 'beautiful' ? api.renderMermaidSVG ?? api.renderMermaidSync ?? api.renderMermaid : api.render)
  if (typeof rendering !== 'function') throw Error('Declared public SVG renderer is unavailable')
  result.importMs = Number(process.hrtime.bigint() - started) / 1e6
  // Parent starts first-use calls only after every prepared process is idle.
  // Import preparation is concurrent; every measured render remains serial.
  if (job.mode === 'cold' && process.send) {
    process.send({ phase: 'ready' })
    await new Promise(resolve => process.once('message', message => { if (message?.phase !== 'start') throw Error('Invalid first-use barrier message'); resolve() }))
  }
  const invoke = async (source, options, recordWindow = false) => {
    let value, error, bytes = 0
    const invocationOptions = portableRenderOptions(job.artifact, options)
    const begin = clock()
    const startNs = recordWindow ? process.hrtime.bigint().toString() : undefined
    try {
      value = rendering.call(receiver, source, invocationOptions)
      if (thenable(value)) value = await value
      if (binding?.result) value = value?.[binding.result]
      const svg = typeof value === 'string' ? value : value?.svg
      if (typeof svg !== 'string') throw Error('Public renderer did not return SVG text')
      bytes = Buffer.byteLength(svg, 'utf8')
    } catch (caught) { error = errorText(caught) }
    const elapsedMs = clock() - begin
    if (recordWindow) result.apiWindow = { startNs, endNs: process.hrtime.bigint().toString() }
    return { value, error, bytes, elapsedMs }
  }
  const testCase = job.testCase
  const admitted = []
  const inspect = async (rendered, expectedCase, source) => {
    const svg = typeof rendered.value === 'string' ? rendered.value : rendered.value?.svg
    const previous = typeof svg === 'string' && admitted.find(item => item.expected === expectedCase.expected && item.svg === svg)
    if (previous) return previous.qualification
    let model
    if (!rendered.error && typeof api.parse === 'function') { try { model = api.parse(source); if (thenable(model)) model = await model } catch {} }
    const qualification = qualifyPortable(expectedCase, { svg, model, error: rendered.error, adapter: job.artifact.adapter })
    rememberOutputFailure(qualification, expectedCase, svg)
    if (qualification.checks.some(check => check.status === 'failed')) {
      result.status = 'failed'; result.error ??= 'A consumed SVG return failed its declared checks'; result.qualification = qualification
    } else if (typeof svg === 'string') {
      admitted.push({ expected: expectedCase.expected, svg, qualification })
      if (admitted.length > 4) admitted.shift()
    }
    return qualification
  }
  for (const prelude of testCase.prelude ?? []) {
    const rendered = await invoke(prelude.source, undefined)
    const actualAccepted = !rendered.error
    result.prelude.push({ source: prelude.source, expectedAccepted: prelude.accept, actualAccepted, passed: prelude.accept === actualAccepted })
  }
  let retained
  if (job.mode === 'probe') {
    // Family support only: one untimed call, accepted or rejected; checks belong to measured cases.
    const probe = await invoke(testCase.source, testCase.renderOptions)
    result.status = probe.error ? 'unsupported' : 'passed'
    result.outputBytes = probe.bytes
    if (probe.error) result.error = probe.error
  } else if (job.mode === 'baseline') {
    collect()
    const before = process.memoryUsage()
    collect()
    result.memory = { before, atReturn: process.memoryUsage(), afterGc: process.memoryUsage(), gcAvailable: !!global.gc }
    result.status = 'passed'
  } else if (job.mode === 'memory') {
    collect()
    const before = process.memoryUsage()
    let memoryCall = await invoke(testCase.source, testCase.renderOptions)
    const atReturn = process.memoryUsage()
    result.outputBytes = memoryCall.bytes
    if ((!memoryCall.error) !== testCase.expected.accept) { result.status = 'failed'; result.error = `Memory-measured invocation changed acceptance: ${memoryCall.error ?? 'unexpected success'}` }
    memoryCall.value = null
    memoryCall = null
    collect()
    result.memory = { before, atReturn, afterGc: process.memoryUsage(), gcAvailable: !!global.gc }
    // Qualification allocations occur after all API memory snapshots.
    retained = await invoke(testCase.source, testCase.renderOptions)
  } else if (job.mode === 'retention') {
    collect()
    result.retention = [{ calls: 0, snapshot: process.memoryUsage() }]
    for (let count = 1; count <= 1000; count++) {
      let rendered = await invoke(`${testCase.source}\n%% retention-source-${count}`, testCase.renderOptions)
      if ((!rendered.error) !== testCase.expected.accept) { result.status = 'failed'; result.error ??= `Retention invocation${count} changed acceptance: ${rendered.error ?? 'unexpected success'}` }
      rendered.value = null
      rendered = null
      if ([10, 100, 1000].includes(count)) { collect(); result.retention.push({ calls: count, snapshot: process.memoryUsage() }) }
    }
    retained = await invoke(testCase.source, testCase.renderOptions)
  } else if (job.mode === 'cold') {
    retained = await invoke(testCase.source, testCase.renderOptions, true)
    result.tracks['first-use'] = [retained.elapsedMs]
  } else {
    // Warmup and qualification never enter the recorded API clocks.
    retained = await invoke(testCase.source, testCase.renderOptions)
    await inspect(retained, testCase, testCase.source)
    for (const track of ['warm-repeat', 'warm-new-source', ...(testCase.edit ? ['warm-label-edit'] : [])]) {
      const samples = []
      const iterations = []
      let lastSource = testCase.source
      let invocation = 0
      for (let index = 0; index < job.samples; index++) {
        let elapsed = 0, calls = 0
        do {
          const edited = track === 'warm-label-edit' && invocation % 2 === 1
          const source = track === 'warm-new-source' ? `${testCase.source}\n%% portable-source-${job.round}-${invocation}` : edited ? testCase.edit.source : testCase.source
          const options = edited ? testCase.edit.renderOptions ?? testCase.renderOptions : testCase.renderOptions
          const current = await invoke(source, options)
          if ((!current.error) !== testCase.expected.accept) { result.status = 'failed'; result.error = 'Acceptance changed during the measured track' }
          const expectedCase = edited ? { ...testCase, source, expected: testCase.edit.expected, renderOptions: testCase.edit.renderOptions ?? testCase.renderOptions } : { ...testCase, source }
          await inspect(current, expectedCase, source)
          lastSource = source
          elapsed += current.elapsedMs
          calls++; invocation++
          retained = current
        } while (elapsed < (job.minSampleMs ?? 2) && calls < 256)
        samples.push(elapsed / calls)
        iterations.push(calls)
      }
      result.tracks[track] = samples
      result.iterations[track] = iterations
      // Validate the actual last return from each track, outside its clock.
      const edited = track === 'warm-label-edit' && (invocation - 1) % 2 === 1
      const expectedCase = edited ? { ...testCase, source: lastSource, expected: testCase.edit.expected, renderOptions: testCase.edit.renderOptions ?? testCase.renderOptions } : { ...testCase, source: lastSource }
      const checked = await inspect(retained, expectedCase, expectedCase.source)
      if (checked.checks.some(check => check.status === 'failed')) { result.status = 'failed'; result.error = `${track}: declared output checks failed`; result.qualification = checked }
    }
    // Ensure the edited output is checked even when an odd sample count ends on seed.
    if (testCase.edit) {
      const rendered = await invoke(testCase.edit.source, testCase.edit.renderOptions ?? testCase.renderOptions)
      let model
      if (!rendered.error && typeof api.parse === 'function') { try { model = api.parse(testCase.edit.source); if (thenable(model)) model = await model } catch {} }
      const checked = qualifyPortable({ ...testCase, source: testCase.edit.source, expected: testCase.edit.expected, renderOptions: testCase.edit.renderOptions ?? testCase.renderOptions }, { svg: typeof rendered.value === 'string' ? rendered.value : rendered.value?.svg, model, error: rendered.error, adapter: job.artifact.adapter })
      rememberOutputFailure(checked, testCase, typeof rendered.value === 'string' ? rendered.value : rendered.value?.svg)
      if (checked.checks.some(check => check.status === 'failed')) { result.status = 'failed'; result.error = 'Edited output failed declared checks'; result.qualification = checked }
    }
    retained = await invoke(testCase.source, testCase.renderOptions)
  }
  if (retained) {
    if (retained.error) result.error ??= retained.error
    if (job.mode !== 'memory') result.outputBytes = retained.bytes
    let model
    if (!retained.error && typeof api.parse === 'function') { try { model = api.parse(testCase.source); if (thenable(model)) model = await model } catch {} }
    const svg = typeof retained.value === 'string' ? retained.value : retained.value?.svg
    const qualification = qualifyPortable(testCase, { svg, model, error: retained.error, adapter: job.artifact.adapter })
    rememberOutputFailure(qualification, testCase, svg)
    result.qualification ??= qualification
    if (result.status !== 'failed') result.status = qualification.checks.some(check => check.status === 'failed') || !result.prelude.every(item => item.passed) ? 'failed' : qualification.passed ? 'passed' : 'partial'
    const witnessSvg = outputFailure ? outputFailureSvg : svg
    if (job.svgFile && typeof witnessSvg === 'string') writeFileSync(job.svgFile, witnessSvg, { flag: 'wx' })
  }
} catch (error) {
  result.status = 'blocked'
  result.error = errorText(error)
}
try { if (disposePublicFactory) await disposePublicFactory(); for (const cleanup of publicCleanups.reverse()) await cleanup() } catch (error) { result.status = 'blocked'; result.error = errorText(error) }
// Retain an earlier output failure even if a later model-only failure overwrote
// the general qualification witness. Output-only timing must inspect every return.
if (outputFailure) { result.qualification = outputFailure; if (result.status !== 'blocked') result.status = 'failed' }
if (result.prelude.some(item => !item.passed)) { result.status = 'failed'; result.error ??= 'A declared prelude changed acceptance' }
if (result.qualification && !result.qualification.checks.some(check => check.status === 'failed') && !job.fullEvidence) {
  result.qualification.checks = result.qualification.checks.map(check => ({ ...check, expected: null, actual: null }))
  result.qualification.unmeasuredScopes.push('Repeated passing check payloads omitted; authored expectations and representative SVG/model evidence are retained with the run. Failed checks retain their full payloads.')
}
process.exitCode = result.status === 'blocked' ? 2 : 0
if (transport === '--ipc') { process.send({ phase: 'result', result }, error => { if (error) process.exitCode = 1; if (process.connected) process.disconnect() }) }
else if (transport === '--stdio') writeFileSync(3, JSON.stringify(result) + '\n')
else writeFileSync(job.resultFile, JSON.stringify(result) + '\n', { flag: 'wx' })
