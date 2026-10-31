import { expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { classifyMeaningFailure, createMeaningAdapter, normalizeMeaning } from '../fidelity/adapters.ts'
import { assessMeaning, assessPrelude, type AuthoredFidelityCase, type NormalizedMeaning } from '../fidelity/meaning.ts'

const witness: AuthoredFidelityCase = {
  id: 'owned-relationships', family: 'flowchart', required: true, source: 'flowchart LR\nA[Alpha]-->B[Beta]\nA-->B\nB-->A', features: ['parallel-reciprocal'], provenance: 'Independent authored expectation',
  expected: { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true }, { source: 'A', target: 'B', directed: true }, { source: 'B', target: 'A', directed: true }], groups: [{ id: 'G', label: 'Group', members: ['A', 'B'] }], facts: { direction: 'LR' } },
}
const valid = (): NormalizedMeaning => ({ family: 'flowchart', nodes: structuredClone(witness.expected.nodes), edges: structuredClone(witness.expected.edges), groups: structuredClone(witness.expected.groups), facts: { direction: 'LR' }, unavailable: {} })

test('semantic admission rejects wrong endpoints, collapsed parallel edges, direction loss, identity relabeling and wrong immediate ownership', () => {
  expect(assessMeaning(witness, valid()).passed).toBe(true)
  const mutations = [
    (m: NormalizedMeaning) => { m.edges![0]!.target = 'C' },
    (m: NormalizedMeaning) => { m.edges!.pop() },
    (m: NormalizedMeaning) => { m.edges!.splice(0, 1) },
    (m: NormalizedMeaning) => { m.edges![0]!.directed = false },
    (m: NormalizedMeaning) => { m.nodes![0]!.label = 'Beta'; m.nodes![1]!.label = 'Alpha' },
    (m: NormalizedMeaning) => { m.groups![0]!.members = ['A'] },
    (m: NormalizedMeaning) => { m.nodes!.push({ id: 'A', label: 'Alpha' }) },
    (m: NormalizedMeaning) => { m.nodes![0]!.id = ' A ' },
  ]
  for (const mutate of mutations) { const model = valid(); mutate(model); expect(assessMeaning(witness, model).passed).toBe(false) }
})

test('missing evidence cannot pass, while available wrong values fail separately from unavailable projections', () => {
  const model = valid(); delete model.facts.direction
  expect(assessMeaning(witness, model)).toMatchObject({ complete: false, passed: false })
  expect(assessMeaning(witness, model).checks.find(check => check.criterion === 'fact:direction')?.status).toBe('unavailable')
  model.facts.direction = 'TB'
  expect(assessMeaning(witness, model)).toMatchObject({ complete: true, passed: false })
  expect(assessMeaning(witness, model).checks.find(check => check.criterion === 'fact:direction')?.status).toBe('failed')
  expect(assessMeaning(witness).checks.every(check => check.status === 'unavailable')).toBe(true)
})

test('numeric values and relationship markers remain independently checked even when all labels survive', () => {
  const source = { family: 'er', expected: { labels: ['User', 'Order'], edges: [{ source: 'User', target: 'Order', directed: false, startMarker: 'one-only', endMarker: 'zero-or-many' }], facts: { links: [{ value: 7 }] } } }
  const observed: NormalizedMeaning = { family: 'er', edges: [{ source: 'User', target: 'Order', directed: false, startMarker: 'one-only', endMarker: 'zero-or-many' }], facts: { links: [{ value: 7 }] }, unavailable: {} }
  expect(assessMeaning(source, observed).passed).toBe(true)
  observed.edges![0]!.endMarker = 'one-only'
  expect(assessMeaning(source, observed).checks.find(check => check.criterion === 'relationships')?.status).toBe('failed')
  observed.facts.links = [{ value: 70 }]
  expect(assessMeaning(source, observed).checks.find(check => check.criterion === 'fact:links')?.status).toBe('failed')
})

test('reviewed public model projections preserve nesting and sequence order without reparsing authored input', () => {
  const graph = normalizeMeaning('agentic', 'flowchart', { graph: { nodes: new Map([['A', { label: 'Alpha' }], ['B', { label: 'Beta' }]]), edges: [], direction: 'LR', subgraphs: [{ id: 'Outer', label: 'Outer', nodeIds: [], children: [{ id: 'Inner', label: 'Inner', nodeIds: ['A', 'B'], children: [] }] }] } })
  expect(graph.groups).toEqual([{ id: 'Outer', label: 'Outer', members: ['Inner'] }, { id: 'Inner', label: 'Inner', members: ['A', 'B'] }])
  const sequence = normalizeMeaning('agentic', 'sequence', { participants: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], messages: [{ from: 'B', to: 'A', text: 'Finish', arrow: '-->>' }], statements: [{ kind: 'fragment', fragment: { fragmentKind: 'loop', label: 'Retry', branches: [{ messages: [{ from: 'A', to: 'B', text: 'Request', arrow: '->>' }] }] } }, { kind: 'message', ref: 0 }, { kind: 'opaque-block', lines: ['Note over A,B: Remember'] }] })
  expect(sequence.facts['message-order']).toEqual([{ from: 'A', to: 'B', text: 'Request' }, { from: 'B', to: 'A', text: 'Finish' }])
  expect(sequence.facts.notes).toBeUndefined()
  expect(sequence.unavailable['fact:notes']).toContain('source-preserved')
})

test('Mermaid public Event Modeling getter transport preserves actual frame identities and endpoints', () => {
  const frame = (name: string, entityIdentifier: string) => ({ frame: { name, entityIdentifier } })
  const first = frame('01', 'CartUI'), second = frame('02', 'AddItem')
  const observed = normalizeMeaning('mermaid', 'eventmodeling', { getState: () => ({ boxes: [first, second], relations: [{ sourceBox: first, targetBox: second }] }) })
  expect(observed.nodes).toEqual([{ id: '01', label: 'CartUI' }, { id: '02', label: 'AddItem' }])
  expect(observed.edges).toEqual([{ source: '01', target: '02', directed: true, label: '' }])
  expect(observed.facts['frame-order']).toEqual(['CartUI', 'AddItem'])
})

test('native Event Modeling projection preserves qualified payloads and reads inferred endpoints from public layout output', () => {
  const frames = [{ id: '01', entity: 'Cart.UI', entityType: 'ui', reset: false, sources: [] }, { id: '02', entity: 'Cart.Add', entityType: 'command', reset: false, sources: [], data: { text: 'productId: 7' } }]
  const body = { frames, data: [], notes: [], specifications: [] }
  const native = normalizeMeaning('agentic', 'eventmodeling', body, { edges: [{ from: '01', to: '02' }] })
  expect(native.nodes).toEqual([{ id: '01', label: 'UI' }, { id: '02', label: 'Add' }])
  expect(native.edges).toEqual([{ source: '01', target: '02', directed: true, label: '' }])
  expect((native.facts['frame-content'] as any[])[1]).toMatchObject({ entity: 'Cart.Add', data: { text: 'productId: 7' } })
  expect(normalizeMeaning('agentic', 'eventmodeling', body).edges).toBeUndefined()
  const explicit = normalizeMeaning('agentic', 'eventmodeling', { ...body, frames: frames.map((frame, index) => ({ ...frame, reset: true, sources: index ? ['01'] : [] })) })
  expect(explicit.edges).toEqual(native.edges)
})

test('native ZenUML call-stack projection retains ordered endpoints and observes assignment returns without inventing a second reply', () => {
  const body = { participants: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }, { id: 'C', label: 'Cache' }], statements: [{ kind: 'message', from: 'A', to: 'B', text: 'request', mode: 'sync', assignment: 'result', children: [{ kind: 'region', type: 'loop', branches: [{ label: 'retry', statements: [{ kind: 'message', to: 'C', text: 'lookup', mode: 'async', children: [] }, { kind: 'return', text: 'done' }] }] }] }] }
  const native = normalizeMeaning('agentic', 'zenuml', body, { edges: [{ from: 'A', to: 'B', label: { text: 'request' } }, { from: 'B', to: 'C', label: { text: 'lookup' } }, { from: 'B', to: 'A', label: { text: 'result = done' } }] })
  expect(native.nodes).toHaveLength(3)
  expect(native.facts['message-order']).toEqual([{ from: 'A', to: 'B', text: 'request' }, { from: 'B', to: 'C', text: 'lookup' }, { from: 'B', to: 'A', text: 'result = done' }])
  expect(native.facts['assignment-bindings']).toEqual([{ to: 'B', name: 'result', type: null }])
  expect(native.facts['message-modes']).toBeUndefined()
  expect(normalizeMeaning('agentic', 'zenuml', body).edges).toBeUndefined()
  expect(native.facts.regions).toEqual([{ kind: 'loop', labels: ['retry'] }])
  expect(normalizeMeaning('pele', 'zenuml', body).nodes).toBeUndefined()
})

test('declared unordered fact collections allow authored rename order changes without discarding duplicates', () => {
  const source = { family: 'quadrant', expected: { labels: ['Renamed', 'Beta'], unorderedFacts: ['points'], facts: { points: [{ label: 'Renamed', x: .2 }, { label: 'Beta', x: .8 }, { label: 'Beta', x: .8 }] } } }
  const model: NormalizedMeaning = { family: 'quadrant', facts: { points: [{ label: 'Beta', x: .8 }, { label: 'Beta', x: .8 }, { label: 'Renamed', x: .2 }] }, unavailable: {} }
  expect(assessMeaning(source, model).passed).toBe(true)
  ;(model.facts.points as unknown[]).shift()
  expect(assessMeaning(source, model).passed).toBe(false)
})

test('actual adapter family is observed rather than supplied by the requested case', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fidelity-public-return-'))
  try {
    mkdirSync(join(root, 'dist'))
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'agentic-mermaid', version: '0.4.2', type: 'module' }))
    writeFileSync(join(root, 'dist/agent-core.js'), 'export function parseRegisteredMermaid(source){if(source==="opaque")return {ok:true,value:{body:{kind:"opaque",source}}};let reads=0;return {ok:true,value:{body:{kind:"class",get classes(){reads++;return [{id:"C",members:[]}]},projectionReads:()=>reads,relations:[],notes:[]}}}};export function serializeMermaid(){return "classDiagram\\nclass C"}')
    const adapter = await createMeaningAdapter({ tool: 'agentic', packageRoot: root })
    const raw = await adapter.acquireRaw('flowchart LR\nA-->B', 'flowchart')
    expect(raw.publicAccepted).toBe(true)
    expect(raw.raw.projectionReads()).toBe(0)
    expect(await adapter.acquireRaw('opaque', 'flowchart')).toMatchObject({ status: 'unsupported', publicAccepted: true })
    const result = await adapter.parse('flowchart LR\nA-->B', 'flowchart')
    expect(result.meaning?.family).toBe('class')
    expect(assessMeaning(witness, result.meaning).passed).toBe(false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('unavailable positioned projection does not erase independently returned native frame facts', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fidelity-position-unavailable-'))
  try {
    mkdirSync(join(root, 'dist'))
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'agentic-mermaid', version: '0.4.2', type: 'module' }))
    writeFileSync(join(root, 'dist/agent-core.js'), 'export function parseRegisteredMermaid(){return {ok:true,value:{body:{kind:"eventmodeling",frames:[{id:"01",entityType:"ui",entity:"Cart.Screen",reset:false,sources:[]}],data:[],notes:[],specifications:[]}}}};export function layoutMermaid(){throw Error("Positioning backend unavailable")}')
    const adapter = await createMeaningAdapter({ tool: 'agentic', packageRoot: root })
    const result = await adapter.parse('eventmodeling\ntf 01 ui Cart.Screen', 'eventmodeling')
    expect(result).toMatchObject({ status: 'accepted', publicAccepted: true, meaning: { nodes: [{ id: '01', label: 'Screen' }], facts: { 'frame-order': ['Screen'] } } })
    expect(result.meaning?.edges).toBeUndefined()
    expect(result.meaning?.unavailable.relationships).toContain('actual public layout')
    expect(result.scope).toContain('positioned projection unavailable')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('only reviewed source rejection earns negative credit; backend/resource faults retain unavailable evidence', () => {
  class PublicPeleError extends Error { code: string; constructor(code: string, message: string) { super(message); this.code = code } }
  expect(classifyMeaningFailure('pele', new PublicPeleError('syntax', 'Invalid source'), PublicPeleError)).toMatchObject({ status: 'rejected', publicAccepted: false })
  expect(classifyMeaningFailure('pele', new PublicPeleError('unsupported-diagram', 'Unknown header'), PublicPeleError)).toMatchObject({ status: 'unsupported', publicAccepted: false })
  for (const error of [new PublicPeleError('resource-limit', 'Parser source budget exceeded'), new Error('Parser backend failed'), new TypeError('Cannot read parser'), Object.assign(new Error('Parse error on line 2: backend was unavailable'), { name: 'TimeoutError' })]) expect(classifyMeaningFailure('pele', error, PublicPeleError)).toMatchObject({ status: 'unavailable', publicAccepted: null })
  expect(classifyMeaningFailure('mermaid', new Error('"dogs" has invalid value: -60.67. Negative values are not allowed in pie charts. All slice values must be >= 0.'))).toMatchObject({ status: 'rejected', publicAccepted: false })
  expect(classifyMeaningFailure('mermaid', new Error('Backend reports invalid value: -60.67. Negative values are not allowed'))).toMatchObject({ status: 'unavailable', publicAccepted: null })
  const unsupported = classifyMeaningFailure('pele', new PublicPeleError('unsupported-diagram', 'Unknown header'), PublicPeleError)
  expect(assessPrelude(true, unsupported.status)).toBe('unsupported')
  expect(assessPrelude(false, unsupported.status)).toBe('unsupported')
  const unavailable = classifyMeaningFailure('pele', new TypeError('Host unavailable'), PublicPeleError)
  expect(assessPrelude(true, unavailable.status)).toBe('unavailable')
  expect(assessPrelude(false, unavailable.status)).toBe('unavailable')
})

test('native Mermaid registers the declared addon without inventing its missing public semantic model', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fidelity-mermaid-addon-')), addon = join(root, 'addon')
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'Option']
  const before = globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const)
  try {
    for (const folder of ['node_modules/mermaid', 'node_modules/jsdom', 'addon/dist']) mkdirSync(join(root, folder), { recursive: true })
    writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module' }))
    writeFileSync(join(root, 'node_modules/jsdom/package.json'), JSON.stringify({ type: 'module', exports: './index.mjs' }))
    writeFileSync(join(root, 'node_modules/jsdom/index.mjs'), 'export class JSDOM { constructor(){this.window={document:{}};this.window.window=this.window} }')
    writeFileSync(join(root, 'node_modules/mermaid/package.json'), JSON.stringify({ name: 'mermaid', version: '12.2.0', type: 'module', exports: { '.': './index.mjs', './package.json': './package.json' } }))
    writeFileSync(join(root, 'node_modules/mermaid/index.mjs'), `const plugins=[];export default {initialize(){},async registerExternalDiagrams(items){plugins.push(...items)},mermaidAPI:{async getDiagramFromText(source){const plugin=plugins.find(item=>item.detector(source));if(!plugin)throw Object.assign(Error('No diagram type detected matching given configuration for text:'+source),{name:'UnknownDiagramError'});const {diagram}=await plugin.loader();return {type:plugin.id,db:diagram.db}}}}`)
    writeFileSync(join(addon, 'package.json'), JSON.stringify({ name: '@mermaid-js/mermaid-zenuml', version: '1.0.1', type: 'module' }))
    writeFileSync(join(addon, 'dist/mermaid-zenuml.esm.min.mjs'), `export default {id:'zenuml',detector:source=>source.startsWith('zenuml'),loader:async()=>({diagram:{db:{getDiagramTitle:()=> 'Loaded declared addon'}}})}`)
    const bare = await createMeaningAdapter({ tool: 'mermaid', packageRoot: join(root, 'node_modules/mermaid'), referenceRoot: root })
    expect((await bare.acquireRaw('zenuml\nA.call()', 'zenuml')).status).toBe('unsupported')
    const registered = await createMeaningAdapter({ tool: 'mermaid', packageRoot: join(root, 'node_modules/mermaid'), referenceRoot: root, zenumlRoot: addon })
    const result = await registered.parse('zenuml\nA.call()', 'zenuml')
    expect(result).toMatchObject({ status: 'accepted', family: 'zenuml', meaning: { family: 'zenuml', facts: { title: 'Loaded declared addon' } } })
    expect(result.meaning?.nodes).toBeUndefined()
    expect(result.meaning?.unavailable.identities).toContain('No reviewed native public ZenUML model')
  } finally {
    for (const [name, descriptor] of before) if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name)
    rmSync(root, { recursive: true, force: true })
  }
})
