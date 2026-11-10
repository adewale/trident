import { expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
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
  expect(rows[2].reason).toBe('No candidate operation was exercised by this test')
})
test('a candidate callback without an audit stays unassessed with its reported disposition', () => {
  for (const status of ['passed', 'skipped', 'pending', 'todo']) {
    const [row] = fidelityOutcomes(native(['passed']), native([status]), [])
    expect(row.status).toBe('trident-blocked')
    expect(row.reason).toBe(`Candidate callback has no native-operation audit (reported ${status})`)
  }
})
test('a candidate fault remains a nonpass even if a negative assertion catches the exception', () => {
  const rows = fidelityOutcomes(native(['passed']), native(['passed']), [audit(0, { faults: ['RangeError: candidate stack overflow'], gaps: ['subsequent observation unavailable'] })])
  expect(rows[0].status).toBe('failed')
  expect(rows[0].reason).toBe('RangeError: candidate stack overflow')
})
test('the JavaScript bridge distinguishes a parser crash from a module binding failure', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-js-parser-fault-')), entry = join(root, 'parser.mjs')
  const bridge = resolve(import.meta.dirname, '../unified/mermaid-fidelity/bridges/javascript.mjs')
  const run = (code: string) => {
    writeFileSync(entry, code)
    const child = spawnSync('node', [bridge, 'dsh', entry], { input: JSON.stringify({ family: 'flowchart', source: 'flowchart TD\nA-->B' }), encoding: 'utf8', timeout: 5000 })
    expect(child.status).toBe(0)
    return JSON.parse(child.stdout)
  }
  try {
    expect(run('export function parseMermaid(){throw new TypeError("candidate bug")}').candidateFault).toContain('TypeError: candidate bug')
    expect(run('throw new TypeError("module unavailable"); export function parseMermaid(){}').adapterGap).toContain('import failed')
    expect(run('export function renamedParser(){}').adapterGap).toContain('no longer exports')
    expect(run('export function parseMermaid(){throw new SyntaxError("grammar refusal")}').error.name).toBe('SyntaxError')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
test('lazy and input-wrapped parser bindings are checked before invoking the candidate', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-js-parser-binding-'))
  const bridge = resolve(import.meta.dirname, '../unified/mermaid-fidelity/bridges/javascript.mjs')
  const write = (path: string, code: string) => {
    const entry = join(root, 'src', path, 'parser.ts')
    mkdirSync(join(root, 'src', path), { recursive: true })
    writeFileSync(entry, code)
  }
  const run = (key: string, family: string) => {
    const child = spawnSync(process.execPath, [bridge, key, root], { input: JSON.stringify({ family, source: 'flowchart TD\nA-->B' }), encoding: 'utf8', timeout: 5000 })
    expect(child.status).toBe(0)
    return JSON.parse(child.stdout)
  }
  try {
    for (const family of ['flowchart', 'gantt', 'gitgraph', 'sequence', 'state', 'timeline', 'class', 'er', 'xychart']) write(family, 'export function renamedParser(){throw new Error("must not run")}')
    write('', 'export function parseMermaid(){}')
    expect(run('opencode', 'flowchart')).toEqual({ adapterGap: 'opencode merman no longer exports its flowchart parser' })
    expect(run('beautiful', 'sequence')).toEqual({ adapterGap: 'beautiful-mermaid no longer exports its sequence parser' })
    expect(run('opencode', 'pie').unsupported).toContain('has no pie parser')
    write('flowchart', 'export function parseMermaidFlowchartDiagram(){throw new RangeError("candidate crash")}')
    write('sequence', 'export function parseSequenceDiagram(){throw new TypeError("candidate crash")}')
    expect(run('opencode', 'flowchart').candidateFault).toContain('RangeError: candidate crash')
    expect(run('beautiful', 'sequence').candidateFault).toContain('TypeError: candidate crash')
  } finally { rmSync(root, { recursive: true, force: true }) }
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

test('a sealed source control qualifies setup-derived assertions without weakening candidate operation guards', () => {
  const reference = [audit(0, { protocol: 'pinned-source-control-v1', calls: 0 })]
  expect(fidelityOutcomes(native(['passed']), native(['passed']), [audit(0)], reference)[0].status).toBe('passed')
  expect(fidelityOutcomes(native(['passed']), native(['passed']), [audit(0, { calls: 0 })], reference)[0].status).toBe('trident-blocked')
  expect(fidelityOutcomes(native(['passed']), native(['passed']), [audit(0)], [audit(0, { calls: 0 })])[0].status).toBe('reference-unqualified')
  const control = native(['passed'])
  expect(fidelityOutcomes(control, control, reference, reference)[0].status).toBe('passed')
})

test('literal greater-than separators in original titles retain their audit identity', () => {
  const report = { testResults: [{ name: '/original.spec.ts', assertionResults: [{ fullName: 'suite note with > in it', status: 'passed' }] }] }
  const evidence = [{ ...audit(0), name: 'suite > note with > in it', fullName: 'suite note with > in it' }]
  expect(fidelityOutcomes(report, report, evidence, evidence)[0].status).toBe('passed')
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

test("a programming error raised in Trident's own code is unassessed; a candidate's refusal stays a failure", () => {
  const trident = join(import.meta.dir, '..', 'unified/upstream-test-assertions.mjs')
  const failing = (message: string) => ({ testResults: [{ name: '/original.spec.ts', assertionResults: [{ fullName: 'parameter table repeated title', status: 'failed', failureMessages: [message] }] }] })
  const control = native(['passed'])
  const [helper] = fidelityOutcomes(control, failing(`TypeError: model.nodes?.find is not a function\n    at Object.getMindmap (${trident}:25:85)\n    at /original.spec.ts:3:1`), [audit(0)])
  expect(helper!.status).toBe('trident-blocked')
  expect(helper!.reason).toStartWith('Trident error: TypeError')
  const [refusal] = fidelityOutcomes(control, failing(`Error: Unsupported syntax in flowchart diagram at line 1\n    at nativeParse (${join(import.meta.dir, '..', 'unified/mermaid-fidelity/runtime.ts')}:302:13)`), [audit(0)])
  expect(refusal!.status).toBe('failed')
  const [candidate] = fidelityOutcomes(control, failing('TypeError: x is not a function\n    at render (/cache/candidate/dist/index.js:1:1)'), [audit(0)])
  expect(candidate!.status).toBe('failed')
  const gapMessage = `Error: TRIDENT_ADAPTER_GAP: usecase.db.getAST\n    at gap (${join(import.meta.dir, '..', 'unified/mermaid-fidelity/runtime.ts')}:81:9)`
  expect(fidelityOutcomes(control, failing(gapMessage), [audit(0)])[0]!.status).toBe('trident-blocked')
  expect(fidelityOutcomes(control, failing(gapMessage), [audit(0, { faults: ['native parser crashed'] })])[0]!.status).toBe('failed')
  expect(fidelityOutcomes(control, failing(gapMessage), [audit(0, { unsupported: ['native model drops the field'] })])[0]!.status).toBe('unsupported')
  expect(fidelityOutcomes(control, failing('Error: TRIDENT_ADAPTER_GAP: candidate message\n    at parse (/cache/candidate/parser.js:1:1)'), [audit(0)])[0]!.status).toBe('failed')
})
