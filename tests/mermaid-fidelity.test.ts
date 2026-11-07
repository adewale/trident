import { expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { projectPublicDatabase } from '../unified/upstream-fidelity-projection.mjs'
import { fidelityOutcomes } from '../unified/mermaid-fidelity.ts'

const native = (statuses: string[]) => ({ testResults: [{ name: '/original.spec.ts', assertionResults: statuses.map(status => ({ fullName: 'parameter table repeated title', status })) }] })
const audit = (index: number, extra = {}) => ({ index, file: '/original.spec.ts', name: 'parameter table repeated title', calls: 1, gaps: [], ...extra })
test('expanded parameter cases with the same title retain separate results', () => {
  const rows = fidelityOutcomes(native(['passed', 'passed']), native(['passed', 'failed']), [audit(0), audit(1)])
  expect(rows.map((r: any) => r.status)).toEqual(['passed', 'failed'])
})
test('a caught missing-adapter exception, unsupported result, or absent target invocation cannot become a pass', () => {
  const rows = fidelityOutcomes(native(['passed', 'passed', 'passed']), native(['passed', 'passed', 'passed']), [audit(0, { gaps: ['missing native getter'] }), audit(1, { unsupported: ['actual opaque model'] }), audit(2, { calls: 0 })])
  expect(rows.map((r: any) => r.status)).toEqual(['trident-blocked', 'unsupported', 'trident-blocked'])
})
test('an operation the candidate does not offer outranks a Trident gap in the same test', () => {
  const rows = fidelityOutcomes(native(['passed', 'passed']), native(['passed', 'passed']), [audit(0, { gaps: ['unmapped getter'], unsupported: ['no parser for this family'] }), audit(1, { gaps: ['unmapped getter'] })])
  expect(rows.map((r: any) => r.status)).toEqual(['unsupported', 'trident-blocked'])
  expect(rows[0].reason).toBe('no parser for this family')
})
test('upstream skips and unqualified control tests stay separate from candidate failures', () => {
  expect(fidelityOutcomes(native(['pending', 'failed']), native(['failed', 'failed']), [audit(0), audit(1)]).map((r: any) => r.status)).toEqual(['upstream-skipped', 'reference-unqualified'])
})

test('a passing reference assertion with an adapter gap cannot qualify a candidate', () => {
  const rows = fidelityOutcomes(native(['passed']), native(['passed']), [audit(0)], [audit(0, { gaps: ['unbound reference operation'] })])
  expect(rows[0].status).toBe('reference-unqualified')
})

test('native schema views expose observed identities and endpoints, withholding unmapped data', () => {
  const gap = (reason: string): never => {
    throw Error('ADAPTER: ' + reason)
  }
  const raw: any = {
    direction: 'TD',
    nodes: new Map([
      ['A', { id: 'A', label: 'Alpha', shape: 'rectangle' }],
      ['B', { id: 'B', label: 'Beta', shape: 'circle' }],
    ]),
    edges: [{ from: 'A', to: 'B', label: 'owns', arrowType: 'arrow', lineStyle: 'solid' }],
  }
  const view = projectPublicDatabase('native', 'flowchart', raw, gap)
  expect(view.getVertices().get('A')).toMatchObject({ id: 'A', text: 'Alpha', type: 'square' })
  expect(view.getEdges()[0]).toMatchObject({ start: 'A', end: 'B', text: 'owns', type: 'arrow_point' })
  raw.edges[0].to = 'C'
  expect(view.getEdges()[0].end).toBe('C')
  expect(() => view.getVertices().get('A').styles).toThrow('Unmapped native')
  expect(() => projectPublicDatabase('native', 'flowchart', { nodes: [{ name: 'A', caption: 'Alpha' }], edges: [] }, gap).getVertices()).toThrow('node identities')
  expect(() => projectPublicDatabase('native', 'flowchart', { nodes: raw.nodes, edges: [{ left: 'A', right: 'B' }] }, gap).getEdges()).toThrow('edge endpoints')
})
test('note lookup aliases only observe a native notes Map', () => {
  const data = { classes: new Map(), notes: new Map([['note0', { id: 'note0', text: 'Observed native note' }]]) }
  const view = projectPublicDatabase('pele', 'class', data)
  expect(view.getNote(0)).toEqual({ id: 'note0', text: 'Observed native note' })
  expect(view.getNote('note0')).toEqual(view.getNote(0))
  expect(view.getNote(1)).toBeUndefined()
  expect(projectPublicDatabase('native', 'class', { classes: [] }).getNote).toBeUndefined()
})
test('native parser transport preserves Maps and separates module errors from parser refusals', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-native-parser-'))
  const worker = resolve(import.meta.dirname, '../unified/mermaid-fidelity/native-call.mjs')
  const run = (name: string, code: string) => {
    const entry = join(root, name)
    writeFileSync(entry, code)
    const child = spawnSync(process.execPath, [worker], { input: JSON.stringify({ entry, methods: ['parse'], source: 'actual input' }), encoding: 'utf8', timeout: 10000 })
    expect(child.status).toBe(0)
    return JSON.parse(child.stdout.trim())
  }
  try {
    const observed = run('native.mjs', 'export async function parse(source) { return new Map([["input", source]]) }')
    expect(observed.value).toEqual({ __tridentNativeMap: [['input', 'actual input']] })
    const lines = run('lines.ts', 'export function parse(lines: string[]) { return lines }')
    expect(lines.value).toEqual(['actual input'])
    const refusal = run('refusal.mjs', 'export function parse() { throw new SyntaxError("native grammar refusal") }')
    expect(refusal.error).toMatchObject({ name: 'SyntaxError', message: 'native grammar refusal' })
    const brokenImport = run('broken.mjs', 'export function parse( {')
    expect(brokenImport.adapterGap).toContain('import/binding failed')
    expect(brokenImport).not.toHaveProperty('error')
    const cycle = run('cyclic.mjs', 'export function parse() { const value = {}; value.self = value; return value }')
    expect(cycle.adapterGap).toContain('cannot be serialized')
    expect(cycle).not.toHaveProperty('error')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('native grammar refusal is observed before editable preservation, and Result errors keep their fields', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'native-grammar-'))
  try {
    writeFileSync(join(scratch, 'package.json'), JSON.stringify({ name: 'agentic-mermaid', type: 'module', exports: { '.': './index.mjs' } }))
    writeFileSync(join(scratch, 'index.mjs'), `export function parseClassDiagram(source) {
      if (source === 'reject') throw Object.assign(new Error('Strict grammar refusal'), { name: 'MermaidSyntaxError', line: 7, column: 3 })
      if (source === 'internal') throw new Error('Internal invariant failed')
      return { classes: [], relationships: [], namespaces: [], classDefs: new Map() }
    }`)
    const entry = join(scratch, 'agent.mjs')
    writeFileSync(entry, `export function parseRegisteredMermaid(source) {
      return source === 'result' ? { ok: false, error: [{ code: 'PARSE_ERROR', message: 'First line\\nsecond line', line: 5, col: 2 }, { code: 'PARSE_ERROR', message: 'Other refusal' }] }
        : { ok: true, value: { body: { kind: 'opaque' }, meta: {} } }
    }`)
    const job = join(scratch, 'job.json')
    writeFileSync(job, JSON.stringify({ reference: scratch, audit: join(scratch, 'audit.jsonl'), target: { tool: 'agentic', root: scratch, entry } }))
    const runtime = resolve('unified/mermaid-fidelity/runtime.ts')
    const driver = `const r = await import(${JSON.stringify(runtime)}); await r.initialize(); const out=[];
      for(const [family,source] of [['class','reject'],['state','result'],['class','preserve'],['class','internal']]) {
        try { r.probeNative(family,source); out.push({unexpected:true}) }
        catch(e) { out.push({message:e.message,...Object.fromEntries(['line','column','col'].filter(k=>Object.hasOwn(e,k)).map(k=>[k,e[k]]))}) }
      } r.shutdown(); console.log(JSON.stringify(out))`
    const result = spawnSync(process.execPath, ['--eval', driver], { env: { ...process.env, TRIDENT_FIDELITY_JOB: job }, encoding: 'utf8' })
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
    const observed = JSON.parse(result.stdout)
    expect(observed[0]).toMatchObject({ message: 'Strict grammar refusal', line: 7, column: 3 })
    expect(observed[1]).toMatchObject({ message: 'First line\nsecond line\nOther refusal', line: 5, col: 2 })
    expect(observed[2].message).toBe('Native semantic support unavailable')
    expect(observed[3].message).toContain('Unclassified native grammar exception: Error: Internal invariant failed')
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('a proven unbound private formatter is a schema gap, while a native implementation error stays a nonpass', () => {
  const report = native(['failed', 'failed'])
  Object.assign(report.testResults[0]!.assertionResults[0]!, { failureMessages: ['TypeError: member.getDisplayDetails is not a function\n    at /original.spec.ts:12:3'] })
  Object.assign(report.testResults[0]!.assertionResults[1]!, { failureMessages: ['TypeError: member.getDisplayDetails is not a function\n    at /native/parser.js:12:3\n    at /original.spec.ts:12:3'] })
  const rows = fidelityOutcomes(native(['passed', 'passed']), report, [audit(0), audit(1)])
  expect(rows.map((r: any) => r.status)).toEqual(['trident-blocked', 'failed'])
})
test('schema cloning delegates a real native member prototype method rather than replacing it', () => {
  class NativeMember {
    text: string
    constructor(text: string) {
      this.text = text
    }
    getDisplayDetails() {
      return { displayText: this.text }
    }
  }
  const member = new NativeMember('actual native member')
  const projected = projectPublicDatabase('pele', 'class', { classes: new Map([['A', { id: 'A', methods: [member] }]]) }).getClass('A').methods[0]
  expect(Object.getPrototypeOf(projected)).toBe(Object.getPrototypeOf(member))
  expect(projected.getDisplayDetails()).toEqual(member.getDisplayDetails())
})
test("a candidate file that fails to load on the candidate's own unsupported operation makes its tests unsupported, not gaps", () => {
  const reference = { testResults: [{ name: '/up/radar.spec.ts', assertionResults: [{ fullName: 'radar parses', title: 'radar parses', status: 'passed' }] }] }
  const candidate = { testResults: [{ name: '/up/radar.spec.ts', assertionResults: [], message: 'Unsupported candidate operation: no radar parser\n    at module' }] }
  const rows = fidelityOutcomes(reference, candidate, [], [{ file: '/up/radar.spec.ts', index: 0, name: 'radar parses', gaps: [], calls: 1, unsupported: [] }])
  expect(rows.map((r: any) => [r.status, r.reason])).toEqual([['unsupported', 'no radar parser']])
  const crashed = fidelityOutcomes(reference, { testResults: [{ name: '/up/radar.spec.ts', assertionResults: [], message: 'TypeError: x is undefined' }] }, [], [{ file: '/up/radar.spec.ts', index: 0, name: 'radar parses', gaps: [], calls: 1, unsupported: [] }])
  expect(crashed.map((r: any) => r.status)).toEqual(['trident-blocked'])
})
