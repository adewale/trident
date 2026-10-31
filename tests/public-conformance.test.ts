import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { replacePublicParseBody, replacePublicDetectBody, type PublicTestDeclaration } from '../unified/public-conformance-inventory.ts'
import { qualifyPublicReference, reducePublicCallbacks, type PublicCallEvent } from '../unified/public-conformance.ts'
import { bindPublicParse, bindPublicDetect } from '../unified/public-conformance-binding.mjs'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('public-conformance-'), hash = (value: string) => createHash('sha256').update(value).digest('hex')
const manifest = JSON.parse(readFileSync(new URL('../corpus/mermaid-public-tests.json', import.meta.url), 'utf8'))
const cases: PublicTestDeclaration[] = manifest.eligible
const passed = () => cases.map(input => ({ fullName: input.fullName, status: 'passed', location: { line: input.line }, failureMessages: [] }))
const evidence = (): PublicCallEvent[] => cases.flatMap(input => ['case-start', 'call-start', 'call-result', 'case-end'].map(type => ({ type, caseId: input.id, ...(type === 'call-result' ? { disposition: 'observed', missingFields: [] } : {}) })))

test('the pinned inventory retains all original source files and preserves the exact upstream public test bytes', () => {
  const sources = new Map<string, string>()
  for (const spec of manifest.sourceSpecs) {
    const original = readFileSync(new URL('../' + spec.fixture, import.meta.url), 'utf8')
    expect(hash(original)).toBe(spec.sha256)
    sources.set(spec.path, original)
  }
  expect(manifest.counts).toEqual({ files: 368, declarations: 4060, eligible: 22, upstreamDisabled: 18, outsideScope: 4020 })
  expect(manifest.censusFiles).toHaveLength(368)
  expect(manifest.censusFiles.reduce((total: number, file: any) => total + file.declarations, 0)).toBe(4060)
  expect(cases).toHaveLength(22)
  for (const input of cases) {
    const text = sources.get(input.path)!.split('\n').slice(input.line - 1, input.endLine).join('\n')
    expect(text).toContain(input.name)
    expect(text).toMatch(input.publicOperation === 'detectType' ? /\bdetectType\(/ : /mermaid(?:API)?\.parse\(/)
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
