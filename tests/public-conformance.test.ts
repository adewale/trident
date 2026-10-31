import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { replacePublicParseBody, replacePublicDetectBody, replacePublicRenderBody, expandPublicCallbacks, type PublicTestDeclaration } from '../unified/public-conformance-inventory.ts'
import { qualifyPublicReference, reducePublicCallbacks, validateRetainedPublicControls, type PublicCallEvent } from '../unified/public-conformance.ts'
import { bindPublicParse, bindPublicDetect, bindPublicRender, appendPublicEvent, capturePublicValue, publicReturnCaptureProtocol } from '../unified/public-conformance-binding.mjs'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('public-conformance-'), hash = (value: string) => createHash('sha256').update(value).digest('hex')
const manifest = JSON.parse(readFileSync(new URL('../corpus/mermaid-public-tests.json', import.meta.url), 'utf8'))
const cases: PublicTestDeclaration[] = manifest.eligible
const passed = () => cases.map(input => ({ fullName: input.fullName, status: 'passed', location: { line: input.nativeRegistrationLine ?? input.line }, failureMessages: [] }))
const evidence = (): PublicCallEvent[] => cases.flatMap(input => ['case-start', 'call-start', 'call-result', 'case-end'].map(type => ({ type, caseId: input.id, ...(type === 'call-result' ? { disposition: 'observed', missingFields: [] } : {}) })))

test('the pinned inventory retains all original source files and preserves the exact upstream public test bytes', () => {
  const sources = new Map<string, string>()
  for (const spec of manifest.sourceSpecs) {
    const original = readFileSync(new URL('../' + spec.fixture, import.meta.url), 'utf8')
    expect(hash(original)).toBe(spec.sha256)
    sources.set(spec.path, original)
  }
  expect(manifest.counts).toEqual({ files: 368, declarations: 4060, eligible: 41, eligibleDeclarations: 23, upstreamDisabled: 18, outsideScope: 4019 })
  expect(manifest.censusFiles).toHaveLength(368)
  expect(manifest.censusFiles.reduce((total: number, file: any) => total + file.declarations, 0)).toBe(4060)
  expect(cases).toHaveLength(41)
  for (const input of cases) {
    const text = sources.get(input.path)!.split('\n').slice(input.line - 1, input.endLine).join('\n')
    expect(text).toContain(input.name)
    expect(text).toMatch(input.publicOperation === 'detectType' ? /\bdetectType\(/ : input.publicOperation === 'render' ? /mermaidAPI\.render\(/ : /mermaid(?:API)?\.parse\(/)
    expect(input.callbackSha256).toMatch(/^[a-f0-9]{64}$/)
  }
  expect(manifest.wholeSuiteConformanceQualified).toBe(false)
})

test('the implementation transform changes one public body and refuses stale or ambiguous source; it never changes tests', () => {
  const source = 'const keep="public contract";\nasync function parse(text:string, parseOptions?:any):Promise<any>{return original(text,parseOptions)}\nexport const mermaidAPI={parse};'
  const changed = replacePublicParseBody(source, hash(source))
  expect(changed).toBe('const keep="public contract";\nasync function parse(text:string, parseOptions?:any):Promise<any>{ return (globalThis as any).__tridentPublicParse(text, parseOptions) }\nexport const mermaidAPI={parse};')
  expect(() => replacePublicParseBody(source + '\n', hash(source))).toThrow('hash changed')
  expect(() => replacePublicParseBody('export const parse=()=>true', hash('export const parse=()=>true'))).toThrow('exactly one')
  const staleSignature = 'async function parse(input:string){return input}'
  expect(() => replacePublicParseBody(staleSignature, hash(staleSignature))).toThrow('signature changed')
})

test('missing callbacks, lost call results and duplicate callbacks cannot supply conformance passes', () => {
  const complete = reducePublicCallbacks(cases, passed(), evidence(), true)
  expect(complete.filter(row => row.status === 'passed')).toHaveLength(cases.length)
  expect(reducePublicCallbacks(cases, [], evidence(), true).every(row => row.status === 'blocked')).toBe(true)
  expect(reducePublicCallbacks(cases, passed(), evidence().filter(row => row.type !== 'call-result'), true).every(row => row.status === 'blocked')).toBe(true)
  expect(reducePublicCallbacks(cases, [...passed(), passed()[0]!], evidence(), true)[0]!.status).toBe('blocked')
  expect(reducePublicCallbacks(cases, passed(), evidence(), false).every(row => row.status === 'blocked')).toBe(true)
  expect(reducePublicCallbacks(cases, passed(), [...evidence(), { type: 'case-start', caseId: cases[0]!.id }], true)[0]!.status).toBe('blocked')
  const inverted = evidence().map(row => row.type === 'call-start' ? { ...row, type: 'call-result' } : row.type === 'call-result' ? { ...row, type: 'call-start' } : row)
  expect(reducePublicCallbacks(cases, passed(), inverted, true).every(row => row.status === 'blocked')).toBe(true)
  const original = reducePublicCallbacks(cases, passed(), [], true, true)
  expect(original.every(row => row.status === 'passed' && row.publicCalls === null)).toBe(true)
})

test('a candidate cannot pass by throwing unsupported syntax into an original rejection expectation', () => {
  const events = evidence().map(row => row.type === 'call-result' && row.caseId === cases[0]!.id ? { ...row, disposition: 'unsupported' } : row)
  const rows = reducePublicCallbacks(cases, passed(), events, true)
  expect(rows[0]!.status).toBe('unsupported')
  expect(rows).toHaveLength(cases.length)
  expect(rows.filter(row => row.status === 'passed')).toHaveLength(cases.length - 1)
})

test('missing asserted config is a binding gap; generic successful parse assertions do not require an invented config', () => {
  const events = evidence().map(row => row.type === 'call-result' ? { ...row, missingFields: ['config'] } : row)
  const rows = reducePublicCallbacks(cases, passed(), events, true)
  expect(rows.find(row => row.caseId === cases.find(input => input.requiredReturnFields.length)!.id)!.status).toBe('blocked')
  expect(rows.find(row => row.caseId === cases.find(input => input.name === 'does not throw for a valid definition')!.id)!.status).toBe('passed')
})

test('reference equivalence requires every unchanged callback to pass on both actual original and public-boundary execution', () => {
  const rows = reducePublicCallbacks(cases, passed(), evidence(), true)
  expect(qualifyPublicReference(cases, rows, rows).qualified).toBe(true)
  const failed = rows.map((row, index) => index ? row : { ...row, status: 'failed' as const })
  expect(qualifyPublicReference(cases, rows, failed).qualified).toBe(false)
  expect(qualifyPublicReference(cases, failed, failed).qualified).toBe(false)
  expect(() => qualifyPublicReference(cases, rows.slice(1), rows)).toThrow('omitted or duplicated')
})

test('a public Result binding never reads the source with a reference parser or fabricates absent config', async () => {
  const root = temp.dir()
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'public-parser-fixture', type: 'module', exports: './index.mjs' }))
  writeFileSync(join(root, 'index.mjs'), 'export function parse(source){return {ok:true,value:source==="preserved"?{kind:"family:unknown",body:{kind:"preserved"}}:{kind:"flowchart"}}}')
  const events: any[] = [], bound = await bindPublicParse({ packageRoot: root, publicImport: 'public-parser-fixture', kind: 'result-parser', export: 'parse', familyPath: 'kind', familyAliases: { flowchart: 'flowchart-v2' } }, (event: any) => events.push(event))
  expect(await bound.parse('literal source', {})).toEqual({ diagramType: 'flowchart-v2' })
  expect(events[0].missingFields).toEqual(['config'])
  await expect(bound.parse('preserved', {})).rejects.toThrow('does not validate')
  expect(events[1].disposition).toBe('unsupported')
  expect(events[0].rawPublicReturn).toEqual({ protocol: publicReturnCaptureProtocol, complete: true, value: { ok: true, value: { kind: 'flowchart' } } })
  expect(events[1].rawPublicReturn.value.value.body.kind).toBe('preserved')
})

test('actual native parse results and configuration are durably snapshotted before original assertions can inspect or mutate them', async () => {
  const root = temp.dir(), file = join(root, 'calls.jsonl')
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'native-parse-capture-fixture', type: 'module', exports: './index.mjs' }))
  writeFileSync(join(root, 'index.mjs'), 'export default {initialize(){},async parse(source){if(source==="reject")throw Error("actual native rejection");return {diagramType:"flowchart",config:{theme:"dark",nested:{value:7}}}}}')
  const target = await bindPublicParse({ packageRoot: root, publicImport: 'native-parse-capture-fixture', kind: 'mermaid-api' }, (event: any) => appendPublicEvent(file, event))
  const value = await target.parse('literal source', {})
  const captured = JSON.parse(readFileSync(file, 'utf8').trim())
  expect(captured.rawPublicReturn).toEqual({ protocol: publicReturnCaptureProtocol, complete: true, value })
  value.config.nested.value = 99
  expect(captured.rawPublicReturn.value.config.nested.value).toBe(7)
  await expect(target.parse('reject', {})).rejects.toThrow('actual native rejection')
  const rejection = JSON.parse(readFileSync(file, 'utf8').trim().split('\n')[1]!)
  expect(rejection.thrown.message).toBe('actual native rejection')
  expect(rejection.thrown.stack).toContain('actual native rejection')
  expect(rejection.rawPublicThrown).toMatchObject({ protocol: publicReturnCaptureProtocol, complete: false, valueRetained: false })
})

test('raw parse capture preserves JSON data and declares loss instead of silently invoking or replacing unsupported values', () => {
  const value = JSON.parse('{"__proto__":{"label":"literal"},"config":{"theme":"dark","numbers":[1,2,null]}}')
  const raw = capturePublicValue(value)
  expect(raw).toEqual({ protocol: publicReturnCaptureProtocol, complete: true, value })
  expect(JSON.parse(JSON.stringify(raw)).value.__proto__).toEqual({ label: 'literal' })
  let getterCalls = 0
  const accessor = Object.defineProperty({}, 'secret', { enumerable: true, get() { getterCalls++; return 'must not invoke' } })
  const cyclic: any = {}; cyclic.self = cyclic
  const shared = { value: 1 }
  expect(capturePublicValue({ a: shared, b: shared }).complete).toBe(true)
  for (const unsafe of [new Map([['answer', 42]]), { callback() {} }, cyclic, accessor, [1, , 3], { value: undefined }, { value: Infinity }]) {
    const result = capturePublicValue(unsafe)
    expect(result).toMatchObject({ protocol: publicReturnCaptureProtocol, complete: false, valueRetained: false })
    expect(result.loss).toBeString()
    expect(Object.hasOwn(result, 'value')).toBe(false)
  }
  expect(getterCalls).toBe(0)
})

import { classifyPublicScope } from '../unified/public-conformance-scope.ts'
test('public-surface review does not disguise pending public tests or shadowed identifiers as internal-only exclusions', () => {
  const classify = (source: string) => classifyPublicScope(source, { ...cases[0]!, path: 'packages/mermaid/src/example.spec.ts', line: 2, endLine: 2, disposition: 'outside-public-parse-scope' })
  expect(classify("import mermaid from './mermaid.js';\nit('render',async()=>{await mermaid.render('id','flowchart LR\\nA-->B')});")).toMatchObject({ disposition: 'review-required', category: 'public-render' })
  expect(classify("import {parse} from './privateParser.js';\nit('private',()=>{parse('source')});")).toMatchObject({ disposition: 'review-required', category: 'private-implementation' })
  expect(classify("import {parse} from './privateParser.js';\nit('shadow',()=>{const parse=(s:string)=>s;parse('source')});")).toMatchObject({ disposition: 'review-required', category: 'unclassified-contract' })
  expect(classify("import {helper} from './tests/util.js';\nit('unknown helper',()=>{helper()});")).toMatchObject({ disposition: 'review-required', category: 'unclassified-contract' })
})

test('public detector delegation is separately SHA-bound and never substitutes the parser', async () => {
  const source = 'export const detectType=function(text:string,config?:any){return original(text,config)};const keep=1'
  const adapted = replacePublicDetectBody(source, hash(source))
  expect(adapted).toContain('__tridentPublicOperation === "detectType"')
  expect(adapted).toContain('__tridentPublicDetect(text, config)')
  expect(adapted).toContain('return original(text,config)};const keep=1')
  expect(() => replacePublicDetectBody(source + ' ', hash(source))).toThrow('hash changed')
  const root = temp.dir()
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'public-detector-fixture', type: 'module', exports: './index.mjs' }))
  writeFileSync(join(root, 'index.mjs'), 'export function detect(source){return source==="known"?{kind:"registered",familyId:"flowchart"}:{kind:"unknown"}};export function parse(){throw Error("must not parse")}')
  const events: any[] = [], binding = { packageRoot: root, publicImport: 'public-detector-fixture', kind: 'result-parser', export: 'parse', detection: { export: 'detect', familyPath: 'familyId', kindPath: 'kind', acceptedKind: 'registered' }, familyAliases: { flowchart: 'flowchart-v2' } }
  const target = await bindPublicDetect(binding, (event: any) => events.push(event))
  expect(target.detect('known')).toBe('flowchart-v2')
  expect(() => target.detect('unknown')).toThrow('does not recognize')
  expect(events.map(row => row.disposition)).toEqual(['observed', 'unsupported'])
  const missing = await bindPublicDetect({ ...binding, detection: undefined }, (event: any) => events.push(event))
  expect(() => missing.detect('known')).toThrow('No reviewed')
  expect(events.at(-1).disposition).toBe('binding-unavailable')
})

test('the structural render matrix preserves original callback bytes and freezes all nineteen source parameters', () => {
  const render = cases.filter(input => input.publicOperation === 'render')
  expect(render).toHaveLength(19)
  expect(new Set(render.map(input => input.callbackSha256)).size).toBe(1)
  expect(new Set(render.map(input => input.declarationId)).size).toBe(1)
  expect(new Set(render.map(input => input.fullName)).size).toBe(19)
  expect(render.every(input => input.nativeRegistrationLine === input.line && input.parameter && input.fullName.includes(input.parameter))).toBe(true)
  const declaration = { ...render[0]!, id: render[0]!.declarationId!, fullName: render[0]!.fullName.replace('classDiagram', '`${testedDiagram.textDiagramType}`') }
  expect(expandPublicCallbacks([declaration]).map(input => input.id)).toEqual(render.map(input => input.id))
  const original = 'const render=async function(id:string,text:string,svgContainingElement?:Element){return native(id,text,svgContainingElement)};const keep=1'
  const changed = replacePublicRenderBody(original, hash(original))
  expect(changed).toBe('const render=async function(id:string,text:string,svgContainingElement?:Element){ return (globalThis as any).__tridentPublicRender(id, text, svgContainingElement) };const keep=1')
  expect(() => replacePublicRenderBody(original + ' ', hash(original))).toThrow('hash changed')
})
test('public render adaptation preserves the complete native SVG rather than manufacturing accessibility attributes', async () => {
  const root = temp.dir(), svg = '<svg aria-roledescription="native-role"><title>Native</title></svg>'
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'public-svg-fixture', type: 'module', exports: './index.mjs' }))
  writeFileSync(join(root, 'index.mjs'), 'export function render(source,options){if(source!=="exact source"||options.security!=="strict")throw Error("wrong public input");return ' + JSON.stringify(svg) + '}')
  const events: any[] = [], target = await bindPublicRender({ packageRoot: root, publicImport: 'public-svg-fixture', kind: 'result-parser', render: { export: 'render', options: { security: 'strict' } } }, (event: any) => events.push(event))
  expect(await target.render('caller-id', 'exact source', undefined)).toEqual({ svg })
  expect(events[0].returned.svg).toBe(svg)
  expect(events[0].inputMapping).toContain('no caller diagram-ID')
  expect(svg).not.toContain('chart-desc-caller-id')
})

test('retained original controls cannot change sources, parameters, host or public boundary to avoid rerunning', () => {
  const original = { protocol: 'fixed', sourceCommit: 'pin', sourceConfigSha256: 'config', originalJsdomHelperSha256: 'host', implementationSha256: 'impl', detectionSha256: 'detect', runnerVersion: '3.2.7', runtimeQualification: { native: 'sealed' }, node: 'node', targets: [{ binding: { project: 'mermaid-js/mermaid' }, entrySha256: 'entry' }], producers: ['100644 blob digest\tunified/public-conformance-binding.mjs'] }
  const inventory = { callbacks: cases }
  expect(() => validateRetainedPublicControls(original, inventory, structuredClone(original), cases)).not.toThrow()
  for (const key of ['protocol', 'sourceCommit', 'sourceConfigSha256', 'originalJsdomHelperSha256', 'implementationSha256', 'detectionSha256', 'runnerVersion', 'runtimeQualification', 'rawCapture', 'node']) expect(() => validateRetainedPublicControls(original, inventory, { ...original, [key]: 'changed' }, cases)).toThrow('identity differs')
  expect(() => validateRetainedPublicControls(original, { callbacks: cases.slice(1) }, original, cases)).toThrow('inventory differs')
  expect(() => validateRetainedPublicControls(original, inventory, { ...original, producers: [] }, cases)).toThrow('adapter changed')
  expect(() => validateRetainedPublicControls(original, inventory, { ...original, targets: [] }, cases)).toThrow('artifact or binding differs')
})
