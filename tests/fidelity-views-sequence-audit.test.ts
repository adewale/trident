import { expect, test } from 'bun:test'
import { nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

const hooks = { unsupported: (reason: string): never => { throw Error('unsupported: ' + reason) }, unavailable: (reason: string): never => { throw Error('gap: ' + reason) } }
const fields = (item: any) => ({ from: item.from, to: item.to, message: item.message, type: item.type })

test('Crafter maps nested block and note records without repairing malformed native endpoints', () => {
  // Captured from @crafter/mermaid-parser installed with renderer 0.0.3;
  // spans omitted. See the package source map diagrams/sequence.ts.
  const view = nativeSchemaView('crafter-station/mermaid', 'sequence', {
    participants: [{ id: 'A', label: 'Al', type: 'participant' }, { id: 'B', label: 'B', type: 'actor' }],
    messages: [{ from: 'A', to: 'B', label: 'hi', arrowType: 'solid' }, { type: 'loop', label: 'repeat', sections: [{ messages: [
      { placement: 'over', participants: ['A', 'B'], text: 'note' }, { from: 'B', to: 'A', label: 'ok', arrowType: 'dashed' },
    ] }] }],
  }, hooks)
  expect(view.getMessages().map(fields)).toEqual([
    { from: 'A', to: 'B', message: 'hi', type: 0 },
    { from: undefined, to: undefined, message: 'repeat', type: 10 },
    { from: 'A', to: 'B', message: 'note', type: 2 },
    { from: 'B', to: 'A', message: 'ok', type: 1 },
    { from: undefined, to: undefined, message: '', type: 11 },
  ])
  expect(view.getActor('B').type).toBe('actor')
  expect(view.getNotes()[0].actor).toEqual(['A', 'B'])
  expect(() => view.getMessages()[0].wrap).toThrow('unsupported')
  const malformed = nativeSchemaView('crafter-station/mermaid', 'sequence', { participants: [], messages: [{ from: 'A', to: '+B', label: 'hi', arrowType: 'solid' }] }, hooks)
  expect(malformed.getMessages()[0].to).toBe('+B')
})

test('OpenCode maps ordered steps, arrow semantics and activations; lost actor kind and box colour stay unsupported', () => {
  const view = nativeSchemaView('anomalyco/opencode', 'sequence', {
    participants: [{ id: 'A', label: 'Alice' }, { id: 'B', label: 'B' }], groups: [{ label: 'Team', participantIds: ['A'] }],
    steps: [
      { type: 'message', message: { from: 'A', to: 'B', label: 'hi', style: 'solid', activate: 'B' } },
      { type: 'note', note: { over: ['B'], position: 'left', label: 'n' } },
      { type: 'fragment', fragment: { kind: 'alt', label: 'yes' } },
      { type: 'message', message: { from: 'B', to: 'A', label: 'ok', style: 'dashed', head: 'open' } },
      { type: 'fragment', fragment: { kind: 'else', label: 'no' } },
      { type: 'activation', activation: { participant: 'B', active: false } },
      { type: 'fragment', fragment: { kind: 'end', label: 'alt' } },
    ],
  }, hooks)
  expect(view.getMessages().map((item: any) => item.type)).toEqual([0, 17, 2, 12, 6, 13, 18, 14])
  expect(view.getMessages()[0].activate).toBe(true)
  expect(view.getNotes()[0].actor).toBe('B')
  expect(view.getBoxes()[0].name).toBe('Team')
  expect(() => view.getBoxes()[0].fill).toThrow('unsupported')
  expect(() => view.getActor('A').type).toThrow('unsupported')
  expect(() => nativeSchemaView('anomalyco/opencode', 'sequence', { participants: [], groups: [], steps: [{ type: 'message', message: { style: 'solid', number: 1 } }] }, hooks).getMessages()).toThrow('unsupported')
})

test('Mermaid RS mindmap resolves flat child IDs and native shapes; missing children are harness gaps', () => {
  const raw = { node_classes: { root: ['hot', 'large'] }, mindmap: { root_id: 'root', nodes: [
    { id: 'root', label: 'Root', node_type: 'Circle', children: ['child'], icon: null, class: null },
    { id: 'child', label: 'Child', node_type: 'Hexagon', children: [], icon: null, class: null },
  ] } }
  const view = nativeSchemaView('1jehuang/mermaid-rs-renderer', 'mindmap', raw, hooks)
  expect(view.getMindmap().nodeId).toBe('root')
  expect(view.getMindmap().type).toBe(3)
  expect(view.getMindmap().class).toBe('hot large')
  expect(view.getMindmap().children[0].descr).toBe('Child')
  expect(view.getMindmap().children[0].type).toBe(6)
  expect(() => view.getMindmap().level).toThrow('unsupported')
  expect(nativeSchemaView('1jehuang/mermaid-rs-renderer', 'mindmap', { mindmap: { root_id: null, nodes: [] } }, hooks).getMindmap()).toBeNull()
  raw.mindmap.nodes[0]!.children = ['missing']
  expect(() => view.getMindmap()).toThrow('gap:')
})

test('Gantt tags are observed from native fields, while written start specifications cannot supply computed dates', () => {
  const crafter = nativeSchemaView('crafter-station/mermaid', 'gantt', { sections: [{ name: 'Work', tasks: [{ id: 'a', label: 'A', status: 'done', startDate: '2026-01-01', duration: '2d' }] }] }, hooks)
  expect(crafter.getTasks()[0].done).toBe(true)
  expect(crafter.getTasks()[0].crit).toBe(false)
  expect(() => crafter.getTasks()[0].startTime).toThrow('unsupported')
  const franken = nativeSchemaView('Dicklesworthstone/frankenmermaid', 'gantt', {
    diagram_type: 'Gantt', nodes: [{ label: 0 }], labels: [{ text: 'B' }],
    gantt_meta: { sections: [{ name: 'Work' }], tasks: [{ node: 0, section_idx: 0, task_id: 'b', start: { AfterTask: 'a' }, end: { DurationDays: 1 }, flags: { active: true, done: false, crit: true, milestone: false } }] },
  }, hooks)
  expect(franken.getTasks()[0].id).toBe('b')
  expect(franken.getTasks()[0].task).toBe('B')
  expect(franken.getTasks()[0].active).toBe(true)
  expect(franken.getTasks()[0].crit).toBe(true)
  expect(() => franken.getTasks()[0].startTime).toThrow('unsupported')
})
