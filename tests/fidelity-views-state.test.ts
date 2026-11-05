import { expect, test } from 'bun:test'
import { nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// Native models below were captured from the parser bridges at their pinned versions
// (scripts/fidelity-probe.ts), trimmed to the fields each test reads.
const verdicts = () => {
  const log: string[] = []
  return {
    log,
    hooks: {
      unavailable: (reason: string) => {
        log.push('gap: ' + reason)
        throw Error('gap')
      },
      unsupported: (reason: string) => {
        log.push('unsupported: ' + reason)
        throw Error('unsupported')
      },
    },
  }
}
const state = (project: string, raw: unknown, hooks: any) => nativeSchemaView(project, 'state', raw, hooks)

// zombie-mermaid for:
//   A : second / B / note left of B : left note / state C { D --> E } / note right of C : composite note
//   classDef exampleStyleClass background:#bbb,border:1.5px solid red / class B, D exampleStyleClass
//   style A background:#bbb, font-weight:bold / [*] --> A / A --> B : go / state "Shown" as S / S --> [*]
const zombie = () => ({
  direction: 'TD',
  nodes: new Map<string, any>([
    ['A', { id: 'A', label: 'second', shape: 'rounded' }],
    ['B', { id: 'B', label: 'B', shape: 'rounded' }],
    ['B----note-1', { id: 'B----note-1', label: 'left note', shape: 'note' }],
    ['D', { id: 'D', label: 'D', shape: 'rounded' }],
    ['E', { id: 'E', label: 'E', shape: 'rounded' }],
    ['C----note-2', { id: 'C----note-2', label: 'composite note', shape: 'note' }],
    ['_start', { id: '_start', label: '', shape: 'state-start' }],
    ['S', { id: 'S', label: 'Shown', shape: 'rounded' }],
    ['_end', { id: '_end', label: '', shape: 'state-end' }],
  ]),
  edges: [
    { source: 'B', target: 'B----note-1', style: 'dotted', hasArrowStart: false, hasArrowEnd: false },
    { source: 'D', target: 'E', style: 'solid', hasArrowStart: false, hasArrowEnd: true },
    { source: 'C', target: 'C----note-2', style: 'dotted', hasArrowStart: false, hasArrowEnd: false },
    { source: '_start', target: 'A', style: 'solid', hasArrowStart: false, hasArrowEnd: true },
    { source: 'A', target: 'B', label: 'go', style: 'solid', hasArrowStart: false, hasArrowEnd: true },
    { source: 'S', target: '_end', style: 'solid', hasArrowStart: false, hasArrowEnd: true },
  ],
  subgraphs: [{ id: 'C', label: 'C', nodeIds: ['D', 'E'], children: [] }],
  classDefs: new Map([['exampleStyleClass', { background: '#bbb', border: '1.5px solid red' }]]),
  classAssignments: new Map([['B', 'exampleStyleClass'], ['D', 'exampleStyleClass']]),
  nodeStyles: new Map([['A', { background: '#bbb', 'font-weight': 'bold' }]]),
  linkStyles: new Map(),
  interactions: new Map(),
})

test('a flowchart-graph state model answers the root document in Mermaid vocabulary', () => {
  const { hooks, log } = verdicts()
  const view = state('dfadler/zombie-mermaid', zombie(), hooks)
  const states = view.getStates()
  // Root states only; [*] is root_start / root_end with type 'default', as Mermaid's docTranslator leaves it.
  expect([...states.keys()].sort()).toEqual(['A', 'B', 'C', 'S', 'root_end', 'root_start'])
  expect(states.get('root_start').type).toBe('default')
  expect(states.get('root_start').descriptions).toEqual([])
  expect(states.get('S').descriptions).toEqual(['Shown'])
  expect(states.get('A').styles).toEqual(['background:#bbb', 'font-weight:bold'])
  expect(states.get('B').classes).toEqual(['exampleStyleClass'])
  expect(states.get('A').doc).toBeUndefined()
  expect(view.getRelations().map((r: any) => [r.id1, r.id2, r.relationTitle])).toEqual([
    ['root_start', 'A', ''],
    ['A', 'B', 'go'],
    ['S', 'root_end', ''],
  ])
  expect(view.getClasses().get('exampleStyleClass').styles).toEqual(['background:#bbb', 'border:1.5px solid red'])
  expect(view.getDirection()).toBe('TB')
  // A bare state and `B : B` are one node: only that reading is unsupported.
  expect(() => states.get('B').descriptions).toThrow('unsupported')
  expect(log.at(-1)).toContain('bare state')
  // A composite's members are a node list, not Mermaid's statement document.
  expect(() => states.get('C').doc).toThrow('unsupported')
  // zombie drops a note's side; the text is kept.
  expect(states.get('B').note.text).toBe('left note')
  expect(() => states.get('B').note.position).toThrow('unsupported')
  expect(() => view.getAccTitle()).toThrow('unsupported')
})

test('state layout data follows dataFetcher: shapes, parents, note groups and dashed note edges', () => {
  const { hooks, log } = verdicts()
  const data = state('dfadler/zombie-mermaid', zombie(), hooks).getData()
  // A note's id is Mermaid's running count, so states are looked up among the non-notes.
  const byId = (id: string) => data.nodes.find((node: any) => node.shape !== 'note' && node.id === id)
  expect(byId('C').shape).toBe('roundedWithTitle')
  expect(byId('C').isGroup).toBe(true)
  expect(byId('C').dir).toBe('TB')
  expect(byId('D').parentId).toBe('C')
  expect(byId('D').cssClasses).toBe('exampleStyleClass statediagram-state')
  expect(byId('A').cssStyles).toEqual(['background:#bbb', 'font-weight:bold'])
  expect(byId('A').label).toBe('second')
  expect(byId('root_start').shape).toBe('stateStart')
  expect(byId('root_start').label).toBe('root_start')
  // A composite comes before its members.
  expect(data.nodes.findIndex((n: any) => n.id === 'C')).toBeLessThan(data.nodes.findIndex((n: any) => n.id === 'D'))
  const notes = data.nodes.filter((node: any) => node.shape === 'note')
  expect(notes.map((n: any) => [n.isGroup, n.type, n.parentId])).toEqual([[false, 'node', 'B----parent'], [false, 'node', 'C----parent']])
  expect(byId('C----parent').isGroup).toBe(true)
  const noteEdges = data.edges.filter((edge: any) => edge.classes.includes('note-edge'))
  expect(noteEdges.map((e: any) => e.pattern)).toEqual(['dashed', 'dashed'])
  expect(data.edges.filter((edge: any) => !edge.classes.includes('note-edge')).every((edge: any) => edge.pattern === undefined)).toBe(true)
  // Renderer-decided fields and Mermaid's running ids are not claimed.
  expect(() => byId('C').colorIndex).toThrow('unsupported')
  expect(log.at(-1)).toContain('colour slots')
  expect(() => byId('A').padding).toThrow('unsupported')
  expect(() => data.config).toThrow('unsupported')
  expect(() => notes[0].id).toThrow('gap')
  expect(() => data.edges[0].id).toThrow('gap')
})

test('a transition between documents in a global edge list has no recorded document', () => {
  const { hooks, log } = verdicts()
  // termaid: state Active { Idle } / Inactive --> Idle: ACT / Active --> Active: LOG
  const termaid = {
    direction: 'TB',
    nodes: { Idle: { id: 'Idle', label: 'Idle', shape: 'ROUNDED' }, Inactive: { id: 'Inactive', label: 'Inactive', shape: 'ROUNDED' } },
    edges: [{ source: 'Inactive', target: 'Idle', label: 'ACT' }, { source: 'Active', target: 'Active', label: 'LOG' }],
    subgraphs: [{ id: 'Active', label: 'Active', node_ids: ['Idle'], children: [] }],
    node_order: ['Idle', 'Inactive'],
    notes: [],
  }
  const view = state('fasouto/termaid', termaid, hooks)
  expect(() => view.getRelations()).toThrow('unsupported')
  expect(log.at(-1)).toContain('Inactive -> Idle')
  expect(() => view.getStates()).toThrow('unsupported')
  // Layout data does not depend on a transition's document.
  expect(view.getData().nodes.find((n: any) => n.id === 'Idle').parentId).toBe('Active')
  expect(() => view.getClasses()).toThrow('unsupported')
  expect(log.at(-1)).toContain('reads no classDef')
})

test('a port keeping Mermaid records is read directly, with Rust None as Mermaid writes it', () => {
  const { hooks, log } = verdicts()
  const bezel = {
    states: { a: { stmt: 'state', id: 'a', type: 'default', descriptions: [], classes: ['hot'], styles: [], textStyles: [] } },
    relations: [{ id1: 'a', id2: 'b', relationTitle: '' }],
    classes: { hot: { id: 'hot', styles: ['fill:red'], textStyles: [] } },
    rootDoc: [{ stmt: 'dir', value: 'LR' }],
    graph: { nodes: [{ id: 'a', shape: 'rect', label: 'a', cssClasses: 'hot statediagram-state', cssCompiledStyles: ['fill:red'], cssStyles: [], isGroup: false }], edges: [{ id: 'edge0', start: 'a', end: 'b', label: '', classes: 'transition' }] },
  }
  const view = state('crabtalk/bezel', bezel, hooks)
  expect(view.getStates().get('a').classes).toEqual(['hot'])
  expect(view.getClasses().get('hot').styles).toEqual(['fill:red'])
  expect(view.getDirection()).toBe('LR')
  expect(view.getAccDescription()).toBe('')
  const data = view.getData()
  expect(data.nodes[0].cssStyles).toEqual([])
  expect(data.edges[0].pattern).toBeUndefined()
  expect(() => data.nodes[0].cssCompiledStyles).toThrow('unsupported')
  const latias = {
    states: { a: { id: 'a', type: 'default', descriptions: [], doc: null, note: null, classes: [], styles: [], textStyles: [], start: null } },
    relations: [{ id1: 'root_start', id2: 'a', relationTitle: null }],
    styleClasses: { hot: { id: 'hot', styles: ['fill:red'], textStyles: [] } },
    nodes: [{ id: 'a', shape: 'rect', parentId: null, colorIndex: null }],
    edges: [{ id: 'edge0', start: 'root_start', end: 'a', classes: 'transition' }],
    direction: 'TB',
    accTitle: null,
  }
  const lview = state('Latias94/merman', latias, hooks)
  expect(lview.getRelations()[0].relationTitle).toBe('')
  expect(lview.getStates().get('a').doc).toBeUndefined()
  expect(lview.getClasses().get('hot').styles).toEqual(['fill:red'])
  expect(lview.getAccTitle()).toBe('')
  expect(() => lview.getData().edges[0].pattern).toThrow('unsupported')
  expect(log.at(-1)).toContain('pattern')
})

test('a concurrency region kept without an id leaves its ids unsupported, not invented', () => {
  const { hooks, log } = verdicts()
  // mermaid_core: state Active { [*] --> A -- B }
  const dart = {
    states: new Map<string, any>([
      ['Active', { id: 'Active', label: 'Active', kind: 'composite', children: ['__start_Active', 'A', 'B'], parent: null, cssClasses: [], styles: new Map(), regions: [['__start_Active', 'A'], ['B']] }],
      ['__start_Active', { id: '__start_Active', label: '', kind: 'start', children: [], parent: 'Active', cssClasses: [], styles: new Map(), regions: [] }],
      ['A', { id: 'A', label: 'A', kind: 'normal', children: [], parent: 'Active', cssClasses: [], styles: new Map(), regions: [] }],
      ['B', { id: 'B', label: 'first\nsecond', kind: 'normal', children: [], parent: 'Active', cssClasses: ['hot'], styles: new Map([['fill', 'red']]), regions: [] }],
    ]),
    transitions: [{ from: '__start_Active', to: 'A', label: null }],
    notes: [{ target: 'Active', text: 'n', position: 'leftOf' }],
    classDefs: new Map([['hot', new Map([['fill', 'red']])]]),
    direction: 'lr',
  }
  const view = state('orestesgaolin/mermaid', dart, hooks)
  expect([...view.getStates().keys()]).toEqual(['Active'])
  expect(view.getStates().get('Active').note.position).toBe('left of')
  expect(view.getDirection()).toBe('LR')
  const data = view.getData()
  // Order: Active, its first region, that region's start and A, the second region, B.
  const dividers = [data.nodes[1], data.nodes[4]]
  expect(dividers.map((n: any) => [n.shape, n.parentId])).toEqual([['divider', 'Active'], ['divider', 'Active']])
  expect(() => dividers[0].id).toThrow('unsupported')
  expect(log.at(-1)).toContain('without ids')
  expect(() => data.nodes[2].id).toThrow('unsupported')
  const b = data.nodes[5]
  expect(b.cssClasses).toBe('hot statediagram-state')
  expect(() => b.parentId).toThrow('unsupported')
  // Repeated descriptions joined into one label are not split back.
  expect(() => b.label).toThrow('unsupported')
  const noteEdge = data.edges.find((e: any) => e.classes.includes('note-edge'))
  expect(noteEdge.end).toBe('Active')
  expect(() => noteEdge.start).toThrow('gap')
})

test('nested documents name each [*] by its document; composite markers are undone only where unambiguous', () => {
  const { hooks } = verdicts()
  const agentic = {
    kind: 'state',
    states: [{ id: 'S', label: 'Shown', className: 'a b' }, { id: 'C', states: [{ id: 'D' }], transitions: [{ from: '[*]', to: 'D' }] }],
    transitions: [{ from: '[*]', to: 'S', fromClass: 'hot' }, { from: 'S', to: 'C', label: 'go' }],
    notes: [{ target: 'S', side: 'right', text: 'n' }],
    classDefs: { hot: { fill: 'red', color: 'blue' } },
  }
  const view = state('adewale/agentic-mermaid', agentic, hooks)
  expect([...view.getStates().keys()]).toEqual(['S', 'C', 'root_start'])
  expect(view.getStates().get('S').classes).toEqual(['a', 'b'])
  expect(view.getStates().get('root_start').classes).toEqual(['hot'])
  expect(view.getRelations().map((r: any) => [r.id1, r.id2, r.relationTitle])).toEqual([['root_start', 'S', ''], ['S', 'C', 'go']])
  expect(view.getClasses().get('hot').textStyles).toEqual(['fill:blue'])
  expect(view.getData().edges.map((e: any) => e.start)).toContain('C_start')
  // OpenCode merman rewrites `A --> C` into `A --> C.__start` when C has its own start.
  const merman = {
    direction: 'TB',
    states: [{ id: '__start', label: '●', kind: 'start' }, { id: 'C.__start', label: '●', kind: 'start', parentId: 'C' }, { id: 'X', label: 'X', kind: 'state', parentId: 'C' }],
    transitions: [{ from: '__start', to: 'C.__start', label: '' }, { from: 'C.__start', to: 'X', label: '' }],
    composites: [{ id: 'C', label: 'C' }],
    notes: [{ target: 'C', position: 'left', lines: ['a', 'b'] }],
  }
  const mview = state('anomalyco/opencode', merman, hooks)
  expect(mview.getRelations().map((r: any) => [r.id1, r.id2])).toEqual([['root_start', 'C']])
  expect(mview.getStates().get('C').note.text).toBe('a\nb')
  expect(() => state('anomalyco/opencode', { ...merman, direction: 'LR' }, hooks).getDirection()).toThrow('unsupported')
})

test('models that collapse readings declare only those readings unsupported', () => {
  const { hooks, log } = verdicts()
  // Grok: one flat document; <<fork>> and a plain state are both Round nodes.
  const grok = { nodes: [{ label: '●', shape: 'Round' }, { label: 'Moving', shape: 'Round' }, { label: 'go', shape: 'Diamond' }], edges: [{ from: 0, to: 1, label: null }], index: { '[*]start': 0, Moving: 1, c: 2 }, groups: [], node_group: [null, null, null], dir: 'Right' }
  const view = state('xai-org/grok-build', grok, hooks)
  expect([...view.getStates().keys()]).toEqual(['root_start', 'Moving', 'c'])
  expect(view.getStates().get('c').type).toBe('choice')
  expect(view.getStates().get('c').descriptions).toEqual(['go'])
  expect(() => view.getStates().get('Moving').type).toThrow('unsupported')
  expect(log.at(-1)).toContain('<<fork>>')
  expect(view.getDirection()).toBe('LR')
  expect(() => view.getClasses()).toThrow('unsupported')
  // mermaid-rs-renderer: nesting read from node lists; a display label joining text and descriptions is not split.
  const mmdr = {
    direction: 'TopDown',
    nodes: { A: { id: 'A', label: 'A\n---\nfirst', shape: 'RoundRect' }, X: { id: 'X', label: 'X', shape: 'RoundRect' }, Y: { id: 'Y', label: 'Y', shape: 'RoundRect' } },
    node_order: { A: 0, X: 1, Y: 2 },
    edges: [{ from: 'X', to: 'Y', label: null }],
    subgraphs: [{ id: 'Outer', label: 'Outer', nodes: ['X', 'Y'] }, { id: 'Inner', label: 'Inner', nodes: ['Y'] }],
    state_notes: [],
    class_defs: { hot: { fill: 'red' } },
    node_classes: { A: ['hot'] },
  }
  const mview = state('1jehuang/mermaid-rs-renderer', mmdr, hooks)
  const data = mview.getData()
  expect(data.nodes.find((n: any) => n.id === 'Inner').parentId).toBe('Outer')
  expect(data.nodes.find((n: any) => n.id === 'Y').parentId).toBe('Inner')
  expect(data.nodes.find((n: any) => n.id === 'X').label).toBe('X')
  expect(() => mview.getStates().get('A').descriptions).toThrow('unsupported')
  expect(() => mview.getClasses().get('hot').styles).toThrow('unsupported')
  // figurehead: one document and no classes, styles or notes at all.
  const figurehead = { states: [{ id: '[*]_start', label: '[*]_start', shape: 'Terminal' }, { id: 'S', label: 'Shown', shape: 'Rectangle' }], transitions: [{ from: '[*]_start', to: 'S', label: null }] }
  const fview = state('Mootikins/figurehead-rs', figurehead, hooks)
  expect(fview.getRelations().map((r: any) => [r.id1, r.id2])).toEqual([['root_start', 'S']])
  expect(() => fview.getStates().get('S').classes).toThrow('unsupported')
  expect(() => fview.getDirection()).toThrow('unsupported')
  // Without notes the layout lists may lack Mermaid's note members: a member is read, the whole list is not.
  const fdata = fview.getData()
  expect(fdata.nodes[1].label).toBe('Shown')
  expect(() => fdata.nodes.find((n: any) => n.shape === 'note')).toThrow('unsupported')
  expect(log.at(-1)).toContain('note nodes')
  expect(() => fdata.edges.length).toThrow('unsupported')
})
