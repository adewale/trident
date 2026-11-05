import { expect, test } from 'bun:test'
import { nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// Native outputs below were captured from the parser bridges at their pinned versions
// (scripts/fidelity-probe.ts), trimmed to the fields each view reads.
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

test('class members: Mermaid display details from structured fields, or from a member\'s own display text', () => {
  const { hooks, log } = verdicts()
  const vitepress = {
    classes: new Map([['Class01', { id: 'Class01', annotation: 'interface', generic: 'T', namespace: 'NS', members: [
      { name: 'int age', visibility: 'public', isMethod: false, isStatic: false, isAbstract: false, raw: '+int age' },
      { name: 'foo', visibility: 'private', isMethod: false, isStatic: true, isAbstract: false, returnType: 'string', raw: '-foo : string$' },
      { name: 'getAge', visibility: 'public', isMethod: true, isStatic: false, isAbstract: true, parameters: 'List~int~ x', returnType: 'int', raw: '+getAge(List~int~ x) int*' },
    ] }]]),
    relationships: [],
    namespaces: [{ id: 'NS', classIds: ['Class01'] }],
  }
  const view = nativeSchemaView('KlangHaus/vitepress-plugin-diagram', 'class', vitepress, hooks)
  const c = view.getClass('Class01')
  expect(c.members.map((m: any) => m.getDisplayDetails())).toEqual([
    { displayText: '+int age', cssStyle: '' },
    { displayText: '-foo : string', cssStyle: 'text-decoration:underline;' },
  ])
  expect(c.methods[0].getDisplayDetails()).toEqual({ displayText: '+getAge(List<int> x) : int', cssStyle: 'font-style:italic;' })
  expect(c.methods[0].id).toBe('getAge')
  expect(c.members[0].parameters).toBeUndefined()
  expect([c.type, c.parent, c.annotations]).toEqual(['T', 'NS', ['interface']])
  expect(view.getNamespace('NS').classes.get('Class01').id).toBe('Class01')
  expect(() => c.cssClasses).toThrow('unsupported')
  expect(log.at(-1)).toContain('keeps no class assignments')
  expect(view.getDirection()).toBe('TB')

  // mermaid_core keeps a member as its display text with static/abstract flags.
  const dart = {
    classes: new Map([['A', { id: 'A', label: 'A', annotations: [], attributes: [{ text: '-List<String> names', isStatic: true, isAbstract: false }], methods: [], cssClasses: ['exClass'], styles: new Map(), link: null }]]),
    relations: [], namespaces: [], notes: [], direction: 'lr',
  }
  const dartView = nativeSchemaView('orestesgaolin/mermaid', 'class', dart, hooks)
  const a = dartView.getClass('A')
  expect(a.members[0].getDisplayDetails()).toEqual({ displayText: '-List<String> names', cssStyle: 'text-decoration:underline;' })
  expect(a.cssClasses).toBe('default exClass')
  expect(() => a.members[0].visibility).toThrow('unsupported')
  expect(log.at(-1)).toContain('display text')
  expect(dartView.getDirection()).toBe('LR')
})

test('class cssClasses: a class with both assigned classes and a click keeps no statement order', () => {
  const { hooks, log } = verdicts()
  const zombie = {
    classes: [{ id: 'A', label: 'A', attributes: [], methods: [] }, { id: 'B', label: 'B', attributes: [], methods: [] }],
    relationships: [], namespaces: [], notes: [],
    interactions: new Map([['A', { href: 'http://x', tooltip: 'tip' }], ['B', { callback: 'cb()' }]]),
    classAssignments: new Map([['A', 'pink']]),
    nodeStyles: new Map(),
  }
  const view = nativeSchemaView('dfadler/zombie-mermaid', 'class', zombie, hooks)
  expect(view.getClass('B').cssClasses).toBe('default clickable')
  expect(view.getClass('B').haveCallback).toBe(true)
  expect(view.getClass('A').link).toBe('http://x')
  expect(() => view.getClass('A').cssClasses).toThrow('unsupported')
  expect(log.at(-1)).toContain('came first')
  expect(() => view.getData()).toThrow('unsupported')
})

test('ER: class assignments, styles and classDefs where kept; subgraphs from agentic-mermaid groups in closing order', () => {
  const { hooks, log } = verdicts()
  const zombie = {
    entities: [{ id: 'CUSTOMER', label: 'CUSTOMER', attributes: [] }, { id: 'ORDER', label: 'ORDER', attributes: [] }],
    relationships: [{ entity1: 'CUSTOMER', entity2: 'ORDER', cardinality1: 'one', cardinality2: 'zero-many', label: 'places', identifying: true }],
    classDefs: new Map([['pink', { fill: '#f9f', color: 'red' }]]),
    classAssignments: new Map([['CUSTOMER', 'pink']]),
    nodeStyles: new Map([['ORDER', { fill: '#00f' }]]),
  }
  const view = nativeSchemaView('dfadler/zombie-mermaid', 'er', zombie, hooks)
  expect(view.getEntity('CUSTOMER').cssClasses).toBe('default pink')
  expect(view.getEntity('ORDER').cssStyles).toEqual(['fill:#00f'])
  expect(view.getClasses().get('pink')).toEqual({ id: 'pink', styles: ['fill:#f9f', 'color:red'], textStyles: ['color:red'] })
  expect(view.getRelationships()[0].entityA).toBe(view.getEntity('CUSTOMER').id)
  expect(() => view.getSubGraphs()).toThrow('unsupported')
  expect(log.at(-1)).toContain('keeps no subgraphs')

  const agentic = {
    entities: [{ id: 'A', attributes: [], groupId: 'Outer' }, { id: 'B', attributes: [], groupId: 'Inner' }],
    relations: [{ from: 'A', to: 'B', leftCard: 'parent', rightCard: 'zero-or-many', dashed: true, label: 'r' }],
    groups: [{ id: 'Outer', label: 'Outer' }, { id: 'Inner', label: 'Inner', parentId: 'Outer', direction: 'RL' }],
    statements: [{ kind: 'group-open', id: 'Outer' }, { kind: 'group-open', id: 'Inner' }, { kind: 'group-close', id: 'Inner' }, { kind: 'group-close', id: 'Outer' }],
    classDefs: {},
  }
  const er = nativeSchemaView('adewale/agentic-mermaid', 'er', agentic, hooks)
  expect(er.getSubGraphs().map((g: any) => [g.id, g.nodes, g.dir])).toEqual([['Inner', ['B'], 'RL'], ['Outer', ['A', 'Inner'], undefined]])
  expect(er.getRelationships()[0].relSpec).toEqual({ cardA: 'ZERO_OR_MORE', cardB: 'MD_PARENT', relType: 'NON_IDENTIFYING' })
})

test('flowchart: reviewed records are refined, not replaced; a model without arrowheads declares edge type absent', () => {
  const { hooks, log } = verdicts()
  const mmdr = {
    direction: 'LeftRight',
    nodes: { A: { id: 'A', label: 'A', shape: 'Rectangle' } },
    node_order: { A: 0 },
    edges: [{ from: 'A', to: 'A', label: null, arrow_start: false, arrow_end: true, style: 'Solid' }],
    subgraphs: [{ id: 'S', label: 'S', nodes: ['A'], direction: 'TopDown' }, { id: 'R', label: 'R', nodes: [], direction: 'RightLeft' }],
    node_classes: {}, subgraph_classes: { S: ['hot'] },
  }
  const view = nativeSchemaView('1jehuang/mermaid-rs-renderer', 'flowchart', mmdr, hooks)
  const [s, r] = view.getSubGraphs()
  expect([s.id, s.title, s.nodes, s.classes]).toEqual(['S', 'S', ['A'], ['hot']])
  expect(r.dir).toBe('RL')
  expect(() => s.dir).toThrow('unsupported')
  expect(log.at(-1)).toContain('TopDown')
  expect(view.getEdges()[0].type).toBe('arrow_point')
  expect(() => view.getEdges()[0].id).toThrow('unsupported')
  expect(() => view.getClasses()).toThrow('unsupported')

  const dsh = {
    direction: 'lr',
    nodes: new Map([['A', { id: 'A', label: 'A', shape: 'process', explicit: false }], ['B', { id: 'B', label: 'Box', shape: 'process', explicit: true }], ['C', { id: 'C', label: 'Go', shape: 'terminal', explicit: true }]]),
    edges: [{ from: 'A', to: 'B', label: '', dashed: true, thick: false }],
    subgraphs: [{ id: 'S1', title: 'Title', members: ['C'] }],
  }
  const plain = nativeSchemaView('sandyyst/dsh-plugin-mermaid-gb-svg', 'flowchart', dsh, hooks)
  const vertices = plain.getVertices()
  expect([vertices.get('A').type, vertices.get('B').type]).toEqual([undefined, 'square'])
  expect(() => vertices.get('C').type).toThrow('unsupported')
  expect(plain.getEdges()[0].stroke).toBe('dotted')
  expect(() => plain.getEdges()[0].type).toThrow('unsupported')
  expect(log.at(-1)).toContain('no arrowheads')
  expect(plain.getDirection()).toBe('LR')
})

test('flowchart: agentic-mermaid edge ids follow Mermaid (a written id once, generated L_ ids otherwise)', () => {
  const { hooks } = verdicts()
  const graph = {
    direction: 'TD',
    nodes: new Map([['A', { id: 'A', label: 'A', shape: 'rectangle' }], ['B', { id: 'B', label: 'Round', shape: 'rounded' }]]),
    edges: [
      { source: 'A', target: 'B', style: 'solid', hasArrowStart: false, hasArrowEnd: true, endMarker: 'arrow', id: 'e1' },
      { source: 'A', target: 'B', style: 'thick', hasArrowStart: false, hasArrowEnd: true, endMarker: 'circle', id: 'e1' },
      { source: 'A', target: 'B', style: 'dotted', hasArrowStart: true, hasArrowEnd: false, startMarker: 'arrow', length: 3 },
    ],
    subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map([[0, { stroke: '#ff3' }]]),
  }
  const view = nativeSchemaView('adewale/agentic-mermaid', 'flowchart', { kind: 'flowchart', graph }, hooks)
  expect(view.getEdges().map((e: any) => [e.id, e.isUserDefinedId, e.type, e.stroke, e.length, e.style])).toEqual([
    ['e1', true, 'arrow_point', 'normal', 1, ['stroke:#ff3']],
    ['L_A_B_2', false, 'arrow_circle', 'thick', 1, undefined],
    ['L_A_B_3', false, 'agentic-mermaid:start-only-point', 'dotted', 3, undefined],
  ])
  expect(view.getVertices().get('B').type).toBe('round')
})

test('flowchart: Grok keeps a start-only or mixed pair of heads in its own spelling', () => {
  const { hooks } = verdicts()
  const grok = {
    nodes: [{ label: 'A', shape: 'Rect' }, { label: 'B', shape: 'Rect' }],
    edges: [
      { from: 0, to: 1, label: null, head_to: 'None', head_from: 'Arrow', line: 'Solid' },
      { from: 0, to: 1, label: 'x', head_to: 'Arrow', head_from: 'None', line: 'Dotted' },
    ],
    index: { A: 0, B: 1 }, groups: [], node_group: [null, null], dir: 'Down',
  }
  const view = nativeSchemaView('xai-org/grok-build', 'flowchart', grok, hooks)
  expect(view.getEdges().map((e: any) => [e.start, e.end, e.type, e.stroke, e.text])).toEqual([
    ['A', 'B', 'Grok:point-none', 'normal', ''],
    ['A', 'B', 'arrow_point', 'dotted', 'x'],
  ])
  expect(view.getVertices().get('A').type).toBe('square')
  expect(() => view.getClasses()).toThrow('unsupported')
})

test('kanban, gantt, mindmap and architecture translate what each model keeps', () => {
  const { hooks, log } = verdicts()
  const kanban = nativeSchemaView('adewale/agentic-mermaid', 'kanban', { columns: [{ id: 'root', label: 'The root', metadata: {}, className: 'm-4', icon: 'bomb', tasks: [{ id: 't', label: 'Task', metadata: { ticket: 'MC-1', priority: 'high' } }] }] }, hooks)
  expect(kanban.getSections()[0].cssClasses).toBe('m-4')
  const node = kanban.getData().nodes[1]
  expect([node.parentId, node.ticket, node.priority, node.shape]).toEqual(['root', 'MC-1', 'high', 'kanbanItem'])
  expect(() => kanban.getSections()[0].level).toThrow('unsupported')

  const termaidKanban = nativeSchemaView('fasouto/termaid', 'kanban', { columns: [{ title: 'Todo', cards: [{ title: 'a(b)', metadata: '' }] }] }, hooks)
  expect(() => termaidKanban.getSections()[0].id).toThrow('unsupported')

  const gantt = nativeSchemaView('emtyty/merslim', 'gantt', { type: 'gantt', tasks: [{ id: 'des1', label: 'Design', start: '2014-01-01T00:00:00.000Z', end: '2014-01-04T00:00:00.000Z', status: 'crit', section: 'Docs' }] }, hooks)
  const task = gantt.getTasks()[0]
  expect([task.startTime, task.endTime, task.crit, task.done]).toEqual([new Date(2014, 0, 1), new Date(2014, 0, 4), true, false])
  expect(() => gantt.getWeekday()).toThrow('unsupported')

  const mindmap = nativeSchemaView('adewale/agentic-mermaid', 'mindmap', { root: { id: 'root', label: 'The root', shape: 'rect', children: [{ id: 'h', label: 'hex', shape: 'hexagon', children: [] }] } }, hooks)
  const root = mindmap.getMindmap()
  expect([root.nodeId, root.descr, root.type, root.children[0].type]).toEqual(['root', 'The root', mindmap.nodeType.RECT, mindmap.nodeType.HEXAGON])

  const arch = nativeSchemaView('orestesgaolin/mermaid', 'architecture', {
    services: [{ id: 'db', icon: 'database', label: 'DB', group: 'api', isJunction: false, iconText: null }, { id: 'mid', icon: null, label: '', group: 'api', isJunction: true }],
    groups: [{ id: 'api', icon: 'cloud', label: 'API', parent: null }],
    edges: [], alignments: [{ row: true, members: ['db', 'mid'] }],
  }, hooks)
  expect(arch.getServices().map((s: any) => [s.id, s.type, s.title, s.in])).toEqual([['db', 'service', 'DB', 'api']])
  expect(arch.getJunctions()[0].in).toBe('api')
  expect(arch.getLayoutHints()).toEqual([{ direction: 'row', members: ['db', 'mid'] }])
  expect(() => arch.getDiagramTitle()).toThrow('unsupported')
  expect(() => arch.getDataStructures()).toThrow('unsupported')
  expect(log.at(-1)).toContain('layout computation')
})

test('requirement and C4: vocabulary words are translated; collapsed forms are unsupported', () => {
  const { hooks, log } = verdicts()
  const dart = {
    nodes: new Map([
      ['r', { id: 'r', kind: 'functionalRequirement', fields: [['id', '1'], ['text', 'x'], ['risk', 'high'], ['verifyMethod', 'test']], classes: ['important'], styles: new Map() }],
      ['e', { id: 'e', kind: 'element', fields: [['type', 'simulation']], classes: ['important'], styles: new Map([['fill', '#fff']]) }],
    ]),
    relations: [{ from: 'e', to: 'r', label: 'satisfies' }],
    classDefs: new Map([['important', new Map([['fill', '#f96']])]]),
  }
  const req = nativeSchemaView('orestesgaolin/mermaid', 'requirement', dart, hooks)
  const r = req.getRequirements().get('r')
  expect([r.type, r.risk, r.verifyMethod, r.cssStyles, r.classes]).toEqual(['Functional Requirement', 'High', 'Test', ['fill:#f96'], ['default', 'important']])
  expect(() => req.getElements().get('e').cssStyles).toThrow('unsupported')
  expect(req.getRelationships()).toEqual([{ type: 'satisfies', src: 'e', dst: 'r' }])

  const xmermaid = {
    type: 'c4', diagram_kind: 'Context', title: 'T',
    elements: [{ kind: 'Person', id: 'p1', label: 'P', description: 'desc' }, { kind: 'System', id: 's1', label: 'S', description: null, container: 'b1' }],
    relationships: [{ from: 'p1', to: 's1', label: 'Uses', bidirectional: false }, { from: 's1', to: 'p1', label: 'Back', bidirectional: true }],
    boundaries: [{ kind: 'Enterprise_Boundary', id: 'b0', label: 'E', elements: [], boundaries: [{ kind: 'System_Boundary', id: 'b1', label: 'B', elements: [] }] }],
  }
  const c4 = nativeSchemaView('evangwt/xmermaid', 'c4', xmermaid, hooks)
  expect(c4.getC4ShapeArray().map((s: any) => [s.alias, s.typeC4Shape.text, s.parentBoundary, s.descr.text])).toEqual([['p1', 'person', 'global', 'desc'], ['s1', 'system', 'b1', '']])
  expect(c4.getBoundaries().map((b: any) => [b.alias, b.type.text, b.parentBoundary])).toEqual([['global', 'global', ''], ['b0', 'ENTERPRISE', 'global'], ['b1', 'SYSTEM', 'b0']])
  expect(c4.getRels()[1].type).toBe('birel')
  expect(() => c4.getRels()[0].type).toThrow('unsupported')
  expect(log.at(-1)).toContain('bidirectional flag')
  expect(c4.getTitle()).toBe('T')
  expect(c4.getC4Type()).toBe('C4Context')
})

test('agentic-mermaid: a shape written as @{ shape: X } is the vertex type X', async () => {
  const { projectPublicDatabase } = await import('../unified/upstream-fidelity-projection.mjs')
  const graph = { direction: 'TB', nodes: new Map<string, any>([['A', { id: 'A', label: 'A', shape: 'rounded' }], ['C', { id: 'C', label: 'C', shape: 'rounded', semanticShape: 'rounded', authoredShape: 'rounded' }], ['D', { id: 'D', label: 'D', shape: 'rectangle', semanticShape: 'rect', authoredShape: 'rect' }]]), edges: [], subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map() }
  const fail = (reason: string) => { throw Error(reason) }
  const db: any = projectPublicDatabase('agentic', 'flowchart', { kind: 'flowchart', graph }, fail, fail, 'adewale/agentic-mermaid')
  expect([...db.getVertices()].map(([id, v]: any) => [id, v.type])).toEqual([['A', 'round'], ['C', 'rounded'], ['D', 'rect']])
  expect(db.getData().nodes.map((n: any) => n.shape)).toEqual(['roundedRect', 'rounded', 'rect'])
})

// merslim: flowchart LR / A[Square] --> B(Round) / B -.-> C{Diamond} / E -- text --> F[(Cyl)] /
// I ~~~ J / subgraph sub1 [Sub title] K end
test('merslim flowchart: shapes only where its kind names one; no arrowheads, subgraph members or classDefs', () => {
  const { hooks } = verdicts()
  const raw = {
    type: 'flowchart', direction: 'LR',
    nodes: [{ id: 'A', label: 'Square', kind: 'process' }, { id: 'C', label: 'Diamond', kind: 'decision' }, { id: 'F', label: 'Cyl', kind: 'database' }, { id: 'I', label: 'I', kind: 'plain' }],
    edges: [{ source: 'A', target: 'C', kind: 'dashed' }, { source: 'C', target: 'F', kind: 'solid', label: 'text' }, { source: 'I', target: 'F', kind: 'invisible' }],
    subgraphs: [{ id: 'sub1', label: 'Sub title' }],
  }
  const view = nativeSchemaView('emtyty/merslim', 'flowchart', raw, hooks)
  const vertices = view.getVertices()
  expect([vertices.get('C').type, vertices.get('F').type, vertices.get('A').text]).toEqual(['diamond', 'cylinder', 'Square'])
  expect(() => vertices.get('A').type).toThrow('unsupported')
  expect(() => vertices.get('I').type).toThrow('unsupported')
  expect(view.getEdges().map((edge: any) => [edge.start, edge.end, edge.stroke, edge.text])).toEqual([['A', 'C', 'dotted', ''], ['C', 'F', 'normal', 'text'], ['I', 'F', 'invisible', '']])
  expect(() => view.getEdges()[0].type).toThrow('unsupported')
  expect(view.getSubGraphs()[0].title).toBe('Sub title')
  expect(() => view.getSubGraphs()[0].nodes).toThrow('unsupported')
  expect(() => view.getClasses()).toThrow('unsupported')
  expect(view.getDirection()).toBe('LR')
})

// OpenCode merman: flowchart LR / A[Square] --> B(Round) / B -.-> C{Diamond} / A <--> D / D ~~~ C /
// subgraph sub1 [Sub title] direction TB C subgraph inner D end end
test('merman flowchart (OpenCode, kitlangton): edges from its flags, subgraphs inner first', () => {
  const { hooks } = verdicts()
  const raw = {
    direction: 'LR',
    nodes: [{ id: 'A', label: 'Square', shape: 'box' }, { id: 'B', label: 'Round', shape: 'rounded' }, { id: 'C', label: 'Diamond', shape: 'decision' }, { id: 'D', label: 'D', shape: 'box' }],
    edges: [{ from: 'A', to: 'B', label: '' }, { from: 'B', to: 'C', label: '', style: 'dashed' }, { from: 'A', to: 'D', label: '', sourceArrowhead: true }, { from: 'D', to: 'C', label: '', orderOnly: true }],
    subgraphs: [{ id: 'sub1', label: 'Sub title', nodeIds: ['C'], direction: 'TB' }, { id: 'inner', label: 'inner', nodeIds: ['D'], parentId: 'sub1' }],
  }
  for (const project of ['anomalyco/opencode', 'kitlangton/merman']) {
    const view = nativeSchemaView(project, 'flowchart', raw, hooks)
    const vertices = view.getVertices()
    expect([vertices.get('A').type, vertices.get('C').type]).toEqual(['square', 'diamond'])
    expect(() => vertices.get('B').type).toThrow('unsupported')
    expect(() => vertices.get('D').type).toThrow('unsupported')
    expect(view.getEdges().map((edge: any) => [edge.type, edge.stroke])).toEqual([['arrow_point', 'normal'], ['arrow_point', 'dotted'], ['double_arrow_point', 'normal'], ['arrow_open', 'invisible']])
    expect(view.getSubGraphs().map((group: any) => [group.id, group.nodes])).toEqual([['inner', ['D']], ['sub1', ['C', 'inner']]])
    expect(view.getSubGraphs()[1].dir).toBe('TB')
    expect(() => view.getSubGraphs()[0].dir).toThrow('unsupported')
    expect(() => view.getClasses()).toThrow('unsupported')
    expect(() => view.getEdges()[0].style).toThrow('unsupported')
  }
})

test('XMermaid cynefin and wardley', () => {
  const { hooks } = verdicts()
  const cynefin = nativeSchemaView('evangwt/xmermaid', 'cynefin', {
    type: 'cynefin', title: 'My Cyn',
    domains: [{ id: 'complex', items: ['Probe', 'Sense'] }, { id: 'complicated', items: [] }, { id: 'clear', items: ['Best'] }, { id: 'chaotic', items: [] }, { id: 'confusion', items: [] }],
    transitions: [{ from: 'complex', to: 'clear', label: 'simplify' }, { from: 'chaotic', to: 'complex', label: '' }],
  }, hooks)
  const domains = cynefin.getDomains()
  expect(domains.get('complex')).toEqual({ name: 'complex', items: [{ label: 'Probe' }, { label: 'Sense' }] })
  expect(domains.has('clear')).toBe(true)
  expect(() => domains.get('chaotic')).toThrow('unsupported')
  expect(() => domains.size).toThrow('unsupported')
  expect(() => [...domains]).toThrow('unsupported')
  expect(cynefin.getTransitions()).toEqual([{ from: 'complex', to: 'clear', label: 'simplify' }, { from: 'chaotic', to: 'complex', label: undefined }])
  expect(cynefin.getDiagramTitle()).toBe('My Cyn')
  expect(() => cynefin.getAccTitle()).toThrow('unsupported')
  const wardley = nativeSchemaView('evangwt/xmermaid', 'wardley', { type: 'wardley', title: 'Example', components: [{ id: 'Alpha', label: 'Alpha', x: 0.2, y: 0.1, anchor: false }, { id: 'U', label: 'U', x: 0.9, y: 0.95, anchor: true }], dependencies: [{ from: 'U', to: 'Alpha' }] }, hooks)
  const data = wardley.getWardleyData()
  expect(data.nodes.map((node: any) => [node.id, node.className, node.x, node.y])).toEqual([['U', 'anchor', 90, 95], ['Alpha', 'component', 20, 10]])
  expect(data.links.map((link: any) => [link.source, link.target])).toEqual([['U', 'Alpha']])
  expect(() => data.links[0].dashed).toThrow('unsupported')
  expect(() => data.trends).toThrow('unsupported')
  expect(() => data.nodes[0].inertia).toThrow('unsupported')
  expect(wardley.getDiagramTitle()).toBe('Example')
})
