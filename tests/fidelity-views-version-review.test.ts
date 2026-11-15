import { expect, test } from 'bun:test'
import { nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// View updates made when reviewing the versions changed in the November campaign
// (views/reviewed-versions.mjs). Models are trimmed captures from the probes.
const verdicts = () => {
  const log: string[] = []
  return { log, hooks: { unavailable: (reason: string): never => { log.push('gap: ' + reason); throw Error('gap') }, unsupported: (reason: string): never => { log.push('unsupported: ' + reason); throw Error('unsupported') } } }
}

// zombie-mermaid 5.16.0, `[*] --> Active / Active --> Inactive / note left of Active : left /
// note right of Inactive : right`: a left-of note is joined note -> state.
const zombieNotes = () => ({
  direction: 'TD',
  nodes: new Map<string, any>([
    ['_start', { id: '_start', label: '', shape: 'state-start' }],
    ['Active----note-1', { id: 'Active----note-1', label: 'left', shape: 'note' }],
    ['Active', { id: 'Active', label: 'Active', shape: 'rounded' }],
    ['Inactive', { id: 'Inactive', label: 'Inactive', shape: 'rounded' }],
    ['Inactive----note-2', { id: 'Inactive----note-2', label: 'right', shape: 'note' }],
  ]),
  edges: [
    { source: '_start', target: 'Active', style: 'solid', hasArrowStart: false, hasArrowEnd: true },
    { source: 'Active', target: 'Inactive', style: 'solid', hasArrowStart: false, hasArrowEnd: true },
    { source: 'Active----note-1', target: 'Active', style: 'dotted', hasArrowStart: false, hasArrowEnd: false },
    { source: 'Inactive', target: 'Inactive----note-2', style: 'dotted', hasArrowStart: false, hasArrowEnd: false },
  ],
  subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map(), interactions: new Map(),
})

test("zombie-mermaid 5.16's note -> state edge is a note, never a transition, and its side is not inferred", () => {
  const { hooks } = verdicts()
  const view = nativeSchemaView('dfadler/zombie-mermaid', 'state', zombieNotes(), hooks)
  expect(view.getRelations().map((r: any) => [r.id1, r.id2])).toEqual([['root_start', 'Active'], ['Active', 'Inactive']])
  expect(view.getStates().get('Active').note.text).toBe('left')
  expect(view.getStates().get('Inactive').note.text).toBe('right')
  expect(() => view.getStates().get('Active').note.position).toThrow('unsupported')
})

test('Frankenmermaid 0.5.0 keeps a later concurrency region\'s start without Mermaid\'s divider id', () => {
  const { hooks, log } = verdicts()
  const label = (text: string) => ({ text })
  const node = (id: string, shape: string) => ({ id, shape, classes: [] })
  const ir = {
    diagram_type: 'State', direction: 'TB', labels: [label('Active')],
    nodes: [node('__state_start', 'FilledCircle'), node('Active', 'Rounded'), node('__state_start__state_Active', 'FilledCircle'), node('A', 'Rounded'), node('__state_start__state_Active___region_2', 'FilledCircle'), node('B', 'Rounded')],
    edges: [{ from: { Node: 0 }, to: { Node: 1 } }, { from: { Node: 2 }, to: { Node: 3 } }, { from: { Node: 4 }, to: { Node: 5 } }],
    graph: { subgraphs: [{ id: 0, key: 'Active', members: [2, 3, 4, 5], children: [1, 2] }, { id: 1, key: '__state_region_1', members: [2, 3], children: [], parent: 0 }, { id: 2, key: '__state_region_2', members: [4, 5], children: [], parent: 0 }] },
  }
  const view = nativeSchemaView('Dicklesworthstone/frankenmermaid', 'state', ir, hooks)
  expect([...view.getStates().keys()]).toEqual(['root_start', 'Active'])
  // Layout data: neither region nor a region's start has a Mermaid id in the IR.
  const nodes = view.getData().nodes
  expect(nodes.map((n: any) => { try { return n.id } catch { return 'unsupported' } })).toEqual(['root_start', 'Active', 'unsupported', 'unsupported', 'A', 'unsupported', 'unsupported', 'B'])
  expect(log.some(line => line.includes('concurrency region'))).toBe(true)
})

test('zombie-mermaid 5.16 messages translate a recorded wrap; an unrecorded one stays absent', () => {
  const { hooks } = verdicts()
  const raw = { actors: [{ id: 'A', label: 'A', type: 'participant' }, { id: 'B', label: 'B', type: 'participant' }], messages: [{ from: 'A', to: 'B', label: 'wrapped', lineStyle: 'solid', arrowHead: 'filled', wrap: true }, { from: 'B', to: 'A', label: 'plain', lineStyle: 'solid', arrowHead: 'filled' }], notes: [], blocks: [], boxes: [] }
  const messages = nativeSchemaView('dfadler/zombie-mermaid', 'sequence', raw, hooks).getMessages()
  expect(messages[0].wrap).toBe(true)
  expect(() => messages[1].wrap).toThrow('unsupported')
})

test('Agentic requirement direction is read as recorded, with no default filled in by the view', () => {
  const { hooks } = verdicts()
  const view = (direction?: string) => nativeSchemaView('adewale/agentic-mermaid', 'requirement', { kind: 'requirement', requirements: [], elements: [], relations: [], classDefs: [], ...(direction ? { direction } : {}) }, hooks)
  expect(view('LR').getDirection()).toBe('LR')
  expect(view().getDirection()).toBeUndefined()
})

test('zombie-mermaid 5.17 participants translate a recorded wrap: / nowrap:; an unrecorded one stays absent', () => {
  const { hooks } = verdicts()
  // Captured from 5.17.0: participant A as wrap:Alice / participant B as nowrap:Bob / participant C / A->>B: hi
  const raw = { actors: [{ id: 'A', label: 'Alice', wrap: true, type: 'participant' }, { id: 'B', label: 'Bob', wrap: false, type: 'participant' }, { id: 'C', label: 'C', type: 'participant' }], messages: [{ from: 'A', to: 'B', label: 'hi', lineStyle: 'solid', arrowHead: 'filled' }], notes: [], blocks: [], boxes: [] }
  const actors = nativeSchemaView('dfadler/zombie-mermaid', 'sequence', raw, hooks).getActors()
  expect([actors.get('A').wrap, actors.get('B').wrap]).toEqual([true, false])
  expect(() => actors.get('C').wrap).toThrow('unsupported')
})
