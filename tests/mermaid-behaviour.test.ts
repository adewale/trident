import { expect, test } from 'bun:test'
import { cpSync, mkdirSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'
import corpus from '../corpus/mermaid-behaviour-tests.json' with { type: 'json' }
import { buildBehaviourCorpus, portableFamily, type BehaviourCase } from '../unified/mermaid-behaviour-corpus.ts'
import { evidenceDigest } from '../portable/evidence-contract.ts'
import { assessBehaviourCase, evaluateBehaviourStep, replayMermaidBehaviours, requireBehaviourReference } from '../unified/mermaid-behaviour.ts'
import { captureBehaviourRaw, readBehaviourCapture, runNativeBehaviours, type BehaviourAdapter } from '../unified/mermaid-behaviour-capture.ts'
import { readBehaviourEvidence } from '../unified/mermaid-behaviour-evidence.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('mermaid-behaviour-')
const root = new URL('../', import.meta.url).pathname, cases = corpus.cases as BehaviourCase[]
const detection = cases.find(input => input.operation === 'detect-family')!, naming = cases.find(input => input.operation === 'svg-accessibility')!
const svg = (body = '<title>a11y title</title><desc>a11y description</desc>', attributes = '') => `<svg xmlns="http://www.w3.org/2000/svg" ${attributes}>${body}</svg>`
const check = (value: string) => evaluateBehaviourStep(naming, naming.steps[0]!, { kind: 'svg', svg: value })
const pass = (value: string) => check(value).every(row => row.status === 'passed')
test('frozen49 adaptations preserve all154 original identities and source-derived ordered stimuli', () => {
  expect(buildBehaviourCorpus(root)).toEqual(corpus as ReturnType<typeof buildBehaviourCorpus>)
  expect(corpus.origins.filter(row => row.disposition === 'adapted')).toHaveLength(49)
  expect(corpus.origins.filter(row => row.disposition === 'excluded')).toHaveLength(105)
  expect(cases.find(row => row.origin.callbackId.endsWith('spec.ts:46'))?.steps).toHaveLength(2)
  expect(naming.steps[0]!.source).toBe('classDiagram\n accTitle: a11y title\n accDescr: a11y description\n')
})
test('family semantics accept explicit portable aliases but reject wrong families and source-free inference', () => {
  expect(assessBehaviourCase(detection, [{ kind: 'family', family: 'flowchart-v2' }]).status).toBe('passed')
  expect(assessBehaviourCase(detection, [{ kind: 'family', family: 'pie' }]).status).toBe('failed')
  expect(assessBehaviourCase(detection, [{ kind: 'svg', svg: '<svg/>' }]).status).toBe('unavailable')
  expect(assessBehaviourCase(detection).status).toBe('unrun')
  expect(assessBehaviourCase(detection, []).status).toBe('unavailable')
})
test('prototype family names remain serializable wrong-family strings rather than inherited aliases', () => {
  for (const family of ['constructor', '__proto__', 'toString']) {
    const checks = evaluateBehaviourStep(detection, detection.steps[0]!, { kind: 'family', family })
    expect(portableFamily(family)).toBe(family)
    expect(checks[0]!.status).toBe('failed')
    expect(checks[0]!.actual).toEqual({ native: family, family })
    expect(JSON.parse(JSON.stringify(checks))).toEqual(checks)
    expect(() => evidenceDigest(checks)).not.toThrow()
  }
  expect(portableFamily('flowchart-v2')).toBe('flowchart')
  expect(assessBehaviourCase(detection, [{ kind: 'family', family: 'flowchart-v2' }]).status).toBe('passed')
})
test('static SVG naming is independent of caller IDs and preserves actual XML text order', () => {
  expect(pass(svg())).toBe(true)
  expect(pass(svg('<title id="native-title">a11y title</title><desc id="native-desc">a11y description</desc>', 'aria-labelledby="native-title" aria-describedby="native-desc"'))).toBe(true)
  expect(pass(svg('<title>a11y <tspan>title</tspan></title><desc>a11y description</desc>'))).toBe(true)
  expect(pass(svg('<title><tspan>title</tspan>a11y </title><desc>a11y description</desc>'))).toBe(false)
  expect(pass(svg('<title>wrong</title><title>a11y title</title><desc>a11y description</desc>'))).toBe(false)
  expect(pass(svg(undefined, 'aria-label="wrong"'))).toBe(false)
  expect(pass(svg('<g><title>a11y title</title><desc>a11y description</desc></g>'))).toBe(false)
  expect(check(svg(undefined, 'aria-labelledby="missing"')).some(row => row.status === 'unavailable')).toBe(true)
  expect(check(svg('<title id="dup">a11y title</title><title id="dup">a11y title</title><desc>a11y description</desc>', 'aria-labelledby="dup"')).some(row => row.status === 'unavailable')).toBe(true)
  expect(check(svg('<text id="n" aria-label="wrong">a11y title</text><desc>a11y description</desc>', 'aria-labelledby="n"')).some(row => row.status === 'unavailable')).toBe(true)
  expect(check(svg('<text id="n">a11y title<tspan display="none">wrong</tspan></text><desc>a11y description</desc>', 'aria-labelledby="n"')).some(row => row.status === 'unavailable')).toBe(true)
  expect(check('<!DOCTYPE svg>' + svg()).every(row => row.status === 'unavailable')).toBe(true)
  expect(check('<svg xmlns="http://www.w3.org/2000/svg"><title>unclosed').every(row => row.status === 'failed')).toBe(true)
})
test('scripts, root hiding, role suppression and unresolved CSS cannot gain naming credit from readable bytes', () => {
  for (const value of [svg(undefined, 'display="none"'), svg(undefined, 'visibility="hidden"'), svg(undefined, 'aria-hidden="TRUE"'), svg(undefined, 'style="display:none"'), svg(undefined, 'style="display:none !important;display:block"'), svg('<style>svg {display:none}</style><title>a11y title</title><desc>a11y description</desc>'), svg(undefined, 'role="presentation"'), svg(undefined, 'role="unfamiliar"'), svg('<script>document.querySelector("title").textContent="wrong"</script><title>a11y title</title><desc>a11y description</desc>'), svg('<style>:is(svg) {visibility:hidden}</style><title>a11y title</title><desc>a11y description</desc>'), svg(undefined, 'onload="this.remove()"')]) expect(check(value).every(row => row.status === 'unavailable')).toBe(true)
  expect(pass(svg(undefined, 'display="none" style="display:block"'))).toBe(true)
  expect(pass(svg('<style>#root .label-icon {display:inline-block}</style><title>a11y title</title><desc>a11y description</desc>', 'id="root"'))).toBe(true)
})
function parentFixture() {
  const dir = temp.dir(), saved = JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/conformance/public-tests-expanded154-evidence.json.gz', import.meta.url))).toString())
  for (const file of saved.files) { const path = join(dir, file.path); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, file.text) }
  return dir
}
test('actual retained154 raw values qualify49 reference behaviours, preserve absent peers and differ from exact API scores', () => {
  const out = join(temp.dir(), 'behaviours'), report = replayMermaidBehaviours({ evidence: parentFixture(), out, projects: ['mermaid-js/mermaid', 'adewale/agentic-mermaid', 'unmeasured/tool'] })
  expect(report.referenceQualification).toMatchObject({ qualified: true, cases: 49, rawChecksPassed: 49 })
  expect(report.targets[0]!.counts).toEqual({ passed: 49, failed: 0, unavailable: 0, unrun: 0 })
  expect(report.targets[1]!.counts).toEqual({ passed: 29, failed: 0, unavailable: 20, unrun: 0 })
  expect(report.targets[2]!.counts).toEqual({ passed: 0, failed: 0, unavailable: 0, unrun: 49 })
  expect(report.projectInvocations).toBe(0)
  expect(requireBehaviourReference(out)).toMatchObject({ qualified: true, cases: 49 })
  expect(readBehaviourEvidence(out).targets[1].counts.passed).toBe(29)
  const reportFile = join(out, 'report.json'), altered = JSON.parse(readFileSync(reportFile, 'utf8')); altered.targets[1].counts.passed = 49; writeFileSync(reportFile, JSON.stringify(altered))
  expect(() => readBehaviourEvidence(out)).toThrow('re-evaluated')
  const contextPath = join(out, 'parent-public-tests/context.json'), context = JSON.parse(readFileSync(contextPath, 'utf8')); context.sourceCommit = '0'.repeat(40); writeFileSync(contextPath, JSON.stringify(context))
  expect(() => requireBehaviourReference(out)).toThrow()
})
function adapterFixture(): BehaviourAdapter {
  const dir = temp.dir(), adapter = join(dir, 'bridge.mjs'), artifact = join(dir, 'native.mjs')
  writeFileSync(adapter, '// synthetic adapter bytes'); writeFileSync(artifact, '// synthetic public artifact bytes')
  return { schema: 'mermaid-behaviour-stdio-adapter-v1', project: 'fixture/native', version: '1', executable: realpathSync(process.execPath), adapter, artifactFiles: [artifact], capabilities: ['detect-family', 'svg-accessibility'], bindingDescription: 'Synthetic raw-first control, no renderer' }
}
test('native capture sends no answers and retains complete source/artifact-bound raw bytes before grading', () => {
  const adapter = adapterFixture(), dir = join(temp.dir(), 'capture'), selected = [detection, naming]
  captureBehaviourRaw(dir, adapter, selected, (_adapter, input) => {
    const request = JSON.parse(input); expect(Object.keys(request).sort()).toEqual(['operation', 'protocol', 'source'])
    return { status: 0, signal: null, stdout: Buffer.from(JSON.stringify(request.operation === 'detect-family' ? { family: 'flowchart' } : { svg: svg() })), stderr: Buffer.from('') }
  })
  expect(() => { throw Error('Synthetic post-capture grading crash') }).toThrow()
  expect(readBehaviourCapture(dir, selected).counts).toEqual({ passed: 2, failed: 0, unavailable: 0, unrun: 0 })
  const moved = join(temp.dir(), 'moved'); cpSync(dir, moved, { recursive: true }); expect(readBehaviourCapture(moved, selected).counts.passed).toBe(2)
  const manifestFile = join(moved, 'capture.json'), manifest = JSON.parse(readFileSync(manifestFile, 'utf8')); manifest.steps[0].sourceSha256 = 'f'.repeat(64); writeFileSync(manifestFile, JSON.stringify(manifest))
  expect(() => readBehaviourCapture(moved, selected)).toThrow('chain changed')
})
test('native process errors, wrong values and unsupported capabilities remain distinct', () => {
  const adapter = adapterFixture(), dir = join(temp.dir(), 'capture')
  captureBehaviourRaw(dir, adapter, [detection], () => ({ status: 0, signal: null, stdout: Buffer.from('{"family":"pie"}'), stderr: new Uint8Array() }))
  expect(readBehaviourCapture(dir, [detection]).counts.failed).toBe(1)
  const interrupted = join(temp.dir(), 'capture')
  captureBehaviourRaw(interrupted, adapter, [detection], () => ({ status: null, signal: 'SIGKILL', stdout: Buffer.from('{"family":"flowchart"}'), stderr: new Uint8Array() }))
  expect(readBehaviourCapture(interrupted, [detection]).counts.unavailable).toBe(1)
  const unsupported = join(temp.dir(), 'capture')
  captureBehaviourRaw(unsupported, { ...adapter, capabilities: [] }, [naming], () => { throw Error('Unsupported capability must not invoke') })
  expect(readBehaviourCapture(unsupported, [naming]).counts.unavailable).toBe(1)
})
test('included thin Node bridge delegates native output without expected answers or source parsing', () => {
  const dir = temp.dir(), module = join(dir, 'public.mjs'), config = join(dir, 'bridge.json')
  writeFileSync(module, 'export const detect=source=>({family:source==="literal-control"?"native-family":"wrong"});')
  writeFileSync(config, JSON.stringify({ module, detect: { export: 'detect', familyPath: 'family' } }))
  const output = spawnSync(process.execPath, [join(root, 'unified/mermaid-behaviour-node-adapter.mjs'), config], { input: JSON.stringify({ operation: 'detect-family', source: 'literal-control' }), encoding: 'utf8' })
  expect(output.status).toBe(0); expect(JSON.parse(output.stdout)).toEqual({ family: 'native-family' })
})
test('new-peer saved captures regrade portably with actual copied Mermaid reference and retain unrun cases', () => {
  const reference = join(temp.dir(), 'reference')
  replayMermaidBehaviours({ evidence: parentFixture(), out: reference })
  const native = join(temp.dir(), 'capture')
  captureBehaviourRaw(native, adapterFixture(), [detection], () => ({ status: 0, signal: null, stdout: Buffer.from('{"family":"flowchart"}'), stderr: new Uint8Array() }))
  const out = join(temp.dir(), 'new-peer'), report = runNativeBehaviours({ capture: native, reference, out })
  expect(report.captureMode).toBe('retained-native-stdio')
  expect(report.projectInvocations).toBe(0)
  expect(report.targets[0]!.counts).toEqual({ passed: 1, failed: 0, unavailable: 0, unrun: 48 })
  expect(requireBehaviourReference(join(out, 'reference-behaviour')).qualified).toBe(true)
  expect(readBehaviourEvidence(out).targets[0].counts).toEqual({ passed: 1, failed: 0, unavailable: 0, unrun: 48 })
  expect(readBehaviourEvidence(out).measuredAt).not.toBeNull()
})
test('included bridge automatically seals config selection and configured public module bytes', () => {
  for (const mutation of ['config', 'module']) {
    const dir = temp.dir(), config = join(dir, 'config.json'), module = join(dir, 'public.mjs'), extra = join(dir, 'declared.txt')
    writeFileSync(module, 'export const detect=()=>"flowchart"'); writeFileSync(extra, 'declared artifact')
    writeFileSync(config, JSON.stringify({ module, detect: { export: 'detect' } }))
    const adapter: BehaviourAdapter = { schema: 'mermaid-behaviour-stdio-adapter-v1', project: 'fixture/native', version: '1', executable: realpathSync(process.execPath), adapter: join(root, 'unified/mermaid-behaviour-node-adapter.mjs'), args: [config], artifactFiles: [extra], capabilities: ['detect-family'], bindingDescription: 'Synthetic control: public module and config intentionally omitted from manual artifactFiles' }
    expect(() => captureBehaviourRaw(join(dir, 'capture'), adapter, [detection], () => {
      if (mutation === 'config') writeFileSync(config, JSON.stringify({ module, detect: { export: 'other' } }))
      else writeFileSync(module, 'export const detect=()=>"pie"')
      return { status: 0, signal: null, stdout: Buffer.from('{"family":"flowchart"}'), stderr: new Uint8Array() }
    })).toThrow('changed during capture')
  }
})
test('included bridge accepts logical absolute aliases and detects identical-byte target changes', () => {
  const dir = realpathSync(temp.dir()), first = join(dir, 'physical-a'), second = join(dir, 'physical-b'), alias = join(dir, 'var'), moduleAlias = join(dir, 'public.mjs'), moduleA = join(dir, 'public-a.mjs'), moduleB = join(dir, 'public-b.mjs'), extra = join(dir, 'declared.txt')
  mkdirSync(first); mkdirSync(second)
  writeFileSync(moduleA, 'export const detect=()=>"flowchart"'); writeFileSync(moduleB, readFileSync(moduleA)); writeFileSync(extra, 'declared artifact')
  symlinkSync(moduleA, moduleAlias); symlinkSync(first, alias, 'dir')
  const config = join(alias, 'config.json'), configText = JSON.stringify({ module: moduleAlias, detect: { export: 'detect' } })
  writeFileSync(join(first, 'config.json'), configText); writeFileSync(join(second, 'config.json'), configText)
  const adapter: BehaviourAdapter = { schema: 'mermaid-behaviour-stdio-adapter-v1', project: 'fixture/native', version: '1', executable: realpathSync(process.execPath), adapter: join(root, 'unified/mermaid-behaviour-node-adapter.mjs'), args: [config], artifactFiles: [extra], capabilities: ['detect-family'], bindingDescription: 'Synthetic Mac-like logical config/module aliases' }
  const returned = { status: 0, signal: null, stdout: Buffer.from('{"family":"flowchart"}'), stderr: new Uint8Array() }
  captureBehaviourRaw(join(dir, 'success'), adapter, [detection], () => returned)
  const saved = readBehaviourCapture(join(dir, 'success'), [detection])
  expect(saved.counts.passed).toBe(1)
  expect(saved.context.artifactSnapshot.standardBridge.config).toBe(join(first, 'config.json'))
  expect(saved.context.artifactSnapshot.standardBridge.module).toBe(moduleA)
  expect(() => captureBehaviourRaw(join(dir, 'config-retarget'), adapter, [detection], () => { unlinkSync(alias); symlinkSync(second, alias, 'dir'); return returned })).toThrow('changed during capture')
  unlinkSync(alias); symlinkSync(first, alias, 'dir')
  expect(() => captureBehaviourRaw(join(dir, 'module-retarget'), adapter, [detection], () => { unlinkSync(moduleAlias); symlinkSync(moduleB, moduleAlias); return returned })).toThrow('changed during capture')
})
