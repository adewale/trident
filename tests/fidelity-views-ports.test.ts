import { expect, test } from 'bun:test'
import { nativeAstView, nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// Native outputs below are trimmed captures from the Pele, Bezel and Latias94/merman
// parser bridges (scripts/fidelity-probe.ts) at their pinned versions.
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

// agentflow-beta TB / a["Alpha"]@{ owner: "me" } / b@{ shape: tool, label: "Beta" } /
// connector c1["Conn"] / flow p["P"] x --> y; x -.- z end / a --> b / a --x p /
// p@{ view: "collapsed" } / classDef red fill:#f00 / class a red
const peleAgentflow = () => ({
  type: 'agentflow',
  direction: 'TB',
  nodes: new Map<string, any>([
    ['a', { id: 'a', labelType: 'string', styles: [], classes: ['red'], text: 'Alpha', type: 'square', props: {}, metadata: { owner: 'me' } }],
    ['b', { id: 'b', labelType: 'markdown', styles: [], classes: [], text: 'Beta', props: {}, metadata: { shape: 'subroutine', label: 'Beta' }, type: 'subroutine' }],
    ['c1', { id: 'c1', labelType: 'text', styles: [], classes: [], isConnector: true, text: 'Conn' }],
    ['x', { id: 'x', labelType: 'text', styles: [], classes: [], text: 'x', props: {} }],
    ['y', { id: 'y', labelType: 'text', styles: [], classes: [], text: 'y', props: {} }],
    ['z', { id: 'z', labelType: 'text', styles: [], classes: [], text: 'z', props: {} }],
    ['p', { id: 'p', labelType: 'text', styles: [], classes: [], text: 'p', props: {} }],
  ]),
  edges: [
    { start: 'x', end: 'y', type: 'arrow_point', text: '', labelType: 'text', classes: [], isUserDefinedId: false, stroke: 'normal', length: 1, edgeSemantic: 'sequence', id: 'L_x_y_0' },
    { start: 'x', end: 'z', type: 'arrow_open', text: '', labelType: 'text', classes: [], isUserDefinedId: false, stroke: 'dotted', length: 1, edgeSemantic: 'reference', id: 'L_x_z_0' },
    { start: 'a', end: 'b', type: 'arrow_point', text: '', labelType: 'text', classes: [], isUserDefinedId: false, stroke: 'normal', length: 1, edgeSemantic: 'sequence', id: 'L_a_b_0' },
    { start: 'a', end: 'p', type: 'arrow_cross', text: '', labelType: 'text', classes: [], isUserDefinedId: false, stroke: 'normal', length: 1, edgeSemantic: 'failure', id: 'L_a_p_0' },
  ],
  subgraphs: [{ id: 'p', nodes: ['y', 'x', 'z'], title: 'P', classes: [], labelType: 'string', type: 'flow', metadata: { view: 'collapsed' } }],
  connectors: new Map([['c1', { id: 'c1', labelType: 'text', styles: [], classes: [], isConnector: true, text: 'Conn' }]]),
  classes: new Map([['red', { id: 'red', styles: ['fill:#f00'], textStyles: [] }]]),
  tooltips: new Map(),
  defaultInterpolate: 'basis',
  mappings: [
    { id: 'a', type: 'vertex', position: { startLine: 2, startColumn: 2, endLine: 2, endColumn: 33, startIndex: 0, endIndex: 0 } },
    { id: 'p', type: 'subgraph', position: { startLine: 5, startColumn: 2, endLine: 8, endColumn: 5, startIndex: 0, endIndex: 0 } },
    { id: 'x', type: 'vertex', position: { startLine: 6, startColumn: 4, endLine: 6, endColumn: 5, startIndex: 0, endIndex: 0 } },
  ],
  diagnostics: [],
})

test('Pele and Bezel agentflow views answer AgentFlowDB getters from its own state', () => {
  const { hooks, log } = verdicts()
  const view = nativeSchemaView('obsidianmd/pele', 'agentflow', peleAgentflow(), hooks)
  const vertices = view.getVertices()
  expect([...vertices.keys()]).toEqual(['a', 'b', 'c1', 'x', 'y', 'z', 'p'])
  expect(vertices.get('b').type).toBe('subroutine')
  expect(view.getTools().map((v: any) => v.id)).toEqual(['b'])
  expect(view.getEdges()[0].interpolate).toBeUndefined()
  expect(view.getEdges().defaultInterpolate).toBe('basis')
  expect(view.getSubGraphs()[0].dir).toBeUndefined()
  expect(view.getConnectors().map((c: any) => c.text)).toEqual(['Conn'])
  expect(view.getElementAtPosition(6, 4).id).toBe('x')
  expect(view.getMappingStats()).toEqual({ vertices: 2, edges: 0, subgraphs: 1, connectors: 0, attachments: 0, totalElements: 3 })
  // A vertex's DOM id is Mermaid's renderer state.
  expect(() => vertices.get('a').domId).toThrow('unsupported')

  // getData: the collapsed container hides its members and redirects the edge to it;
  // the collapse-induced x -> y and x -> z self-loops are dropped.
  const data = view.getData()
  expect(data.nodes.map((n: any) => [n.id, n.shape, n.isGroup])).toEqual([
    ['p', 'collapsedGroup', false],
    ['a', 'roundedRect', false],
    ['b', 'subroutine', false],
    ['c1', 'roundedRect', false],
  ])
  expect(data.nodes[0].metadata).toEqual({ view: 'collapsed', containerType: 'flow' })
  expect(data.edges.map((e: any) => [e.start, e.end, e.arrowTypeEnd])).toEqual([
    ['a', 'b', 'arrow_point'],
    ['a', 'p', 'arrow_cross'],
  ])
  expect(() => data.nodes[1].colorIndex).toThrow('unsupported')
  expect(() => data.config).toThrow('unsupported')

  const model = view.getSemanticModel()
  expect(model.vertices.find((v: any) => v.id === 'b')).toEqual({ id: 'b', label: 'Beta', shape: 'subroutine', vertexKind: 'tool', metadata: { label: 'Beta' } })
  expect(model.connectors).toEqual([{ id: 'c1', title: 'Conn' }])
  expect(model.vertices.some((v: any) => v.id === 'p')).toBe(false)
  expect(model.subGraphs[0]).toEqual({ id: 'p', nodes: ['y', 'x', 'z'], type: 'flow', title: 'P' })
  expect(log.filter(line => line.startsWith('gap'))).toEqual([])

  // Bezel's JSON objects keep declaration order only without integer-like ids.
  const bezel = { ...peleAgentflow(), nodes: { 2: { id: '2', text: '2', labelType: 'text', styles: [], classes: [] }, 1: { id: '1', text: '1', labelType: 'text', styles: [], classes: [] } } }
  const lost = nativeSchemaView('crabtalk/bezel', 'agentflow', bezel, hooks).getVertices()
  expect(lost.get('1').text).toBe('1')
  expect(lost.size).toBe(2)
  expect(() => [...lost.keys()]).toThrow('gap')
  expect(() => nativeSchemaView('crabtalk/bezel', 'agentflow', bezel, hooks).emitWarning('SHAPE_UNSUPPORTED', 'x')).toThrow('unsupported')
})

test('Latias94/merman agentflow is the semantic model; what it drops is unsupported', () => {
  const { hooks, log } = verdicts()
  const merman = (subGraphs: any[] = []) => ({
    connectors: [],
    direction: 'TB',
    diagnostics: [],
    subGraphs,
    vertices: [
      { id: 'a', label: 'Round', shape: 'rect', vertexKind: 'task' },
      { id: 'b', label: 'Beta', shape: 'subroutine', vertexKind: 'tool', metadata: { label: 'Beta' } },
      { id: 'c', label: 'c', vertexKind: 'task' },
    ],
    edges: [{ start: 'a', end: 'b', id: 'L_a_b_0', label: 'go', edgeSemantic: 'sequence', type: 'arrow_point', stroke: 'normal', length: 1 }],
    type: 'agentflow',
    title: null,
  })
  const view = nativeSchemaView('Latias94/merman', 'agentflow', merman(), hooks)
  expect(view.getSemanticModel()).toEqual({ vertices: merman().vertices, edges: merman().edges, subGraphs: [], connectors: [], diagnostics: [], direction: 'TB' })
  const vertices = view.getVertices()
  expect(vertices.size).toBe(3)
  expect(vertices.get('b').type).toBe('subroutine')
  expect(vertices.get('b').metadata.label).toBe('Beta')
  // `rect` is both a `(text)` node and an authored rect; metadata keeps no presentation keys.
  expect(() => vertices.get('a').type).toThrow('unsupported')
  expect(() => vertices.get('b').metadata.shape).toThrow('unsupported')
  expect(() => vertices.get('c').metadata).toThrow('unsupported')
  expect(() => vertices.get('a').styles).toThrow('unsupported')
  expect(view.getEdges()[0].text).toBe('go')
  expect(() => view.getEdges()[0].isUserDefinedId).toThrow('unsupported')
  expect(view.getData().nodes.map((n: any) => [n.id, n.shape])).toEqual([
    ['a', 'roundedRect'],
    ['b', 'subroutine'],
    ['c', 'roundedRect'],
  ])
  expect(() => view.getElementMappings()).toThrow('unsupported')

  const nested = nativeSchemaView('Latias94/merman', 'agentflow', merman([{ id: 'p', title: 'P', nodes: ['c'], type: 'flow' }]), hooks)
  expect(nested.getVertices().get('a').text).toBe('Round')
  expect(() => nested.getVertices().size).toThrow('unsupported')
  expect(() => nested.getVertices().get('p')).toThrow('unsupported')
  expect(() => nested.getData()).toThrow('unsupported')
  expect(nested.getSubGraphs()[0].title).toBe('P')
  expect(log.filter(line => line.startsWith('gap'))).toEqual([])
})

test('use case views map Pele state directly and translate Latias94/merman node kinds', () => {
  const { hooks } = verdicts()
  const pele = nativeSchemaView('obsidianmd/pele', 'usecase', {
    actors: new Map([['User', { id: 'User', label: 'Person', labelType: 'text', business: false, classes: [], type: 'hollow', styles: [], stereotype: 'Human', parentId: 'sb1' }]]),
    useCases: new Map(),
    systemBoundaries: new Map(),
    relationships: [],
    notes: new Map(),
    jsonNodes: new Map([['Config', { id: 'Config', value: { a: 1 }, propertyOrder: new Map([['', ['a']]]), classes: [], styles: [] }]]),
    classDefs: new Map(),
    direction: 'TB',
    accTitle: '',
    accDescr: '',
    accDescription: '',
    source: 'usecase-beta\nactor User\n',
    headerSpan: [0, 12],
    statements: [{ kind: 'node', span: [13, 23] }],
  }, hooks)
  expect(pele.getActor('User').parentId).toBe('sb1')
  expect(pele.getJsonNode('Config').propertyOrder).toEqual({ '': ['a'] })
  expect(pele.getAST().statements).toEqual([{ kind: 'node', span: [13, 23] }])
  expect(pele.getAST().header.span).toEqual([0, 12])
  expect(() => pele.getAST().nodes).toThrow('unsupported')

  const merman = nativeSchemaView('Latias94/merman', 'usecase', {
    type: 'usecase',
    direction: 'TB',
    nodes: [
      { id: 'User', label: 'Person', labelType: 'text', kind: 'actor', actorType: 'hollow', icon: null, parentId: 'sb1', business: false, stereotype: 'Human', classes: [], styles: [] },
      { id: 'Login', label: 'Sign in', labelType: 'text', kind: 'useCaseRect', actorType: 'normal', icon: null, parentId: 'sb1', business: false, stereotype: 'Primary', classes: ['important'], styles: [] },
      { id: 'Admin', label: 'Admin', labelType: 'text', kind: 'useCaseEllipse', actorType: 'normal', icon: null, parentId: null, business: false, stereotype: null, classes: [], styles: [] },
    ],
    boundaries: [{ id: 'sb1', label: 'Payment service', labelType: 'text', members: ['User', 'Login'], package: true, classes: [], styles: [] }],
    relationships: [{ id: 'edge-1', explicitId: false, source: 'Admin', target: 'Login', relationshipType: 'association', arrowType: 1, label: null, labelType: null, dotted: false, minlen: 1, classes: [], styles: [], animate: false, animation: null }],
    notes: [],
    jsonNodes: [],
    classDefs: [{ id: 'important', styles: ['fill:red'] }],
  }, hooks)
  expect([...merman.getActors().values()]).toEqual([{ id: 'User', label: 'Person', labelType: 'text', type: 'hollow', business: false, stereotype: 'Human', parentId: 'sb1', classes: [], styles: [] }])
  expect([...merman.getUseCases().values()].map((u: any) => [u.id, u.shape, u.parentId])).toEqual([
    ['Login', 'rect', 'sb1'],
    ['Admin', 'ellipse', undefined],
  ])
  expect(merman.getSystemBoundary('sb1').type).toBe('package')
  expect(merman.getRelationships()).toEqual([{ id: 'edge-1', explicitId: false, source: 'Admin', target: 'Login', type: 'association', arrowType: 1, minlen: 1, classes: [], styles: [], animate: false }])
  expect(() => merman.getAST()).toThrow('unsupported')
})

test('railroad, wardley, venn, cynefin and packet records map field for field', () => {
  const { hooks } = verdicts()
  const rules = [{ name: 'r', definition: { type: 'repetition', element: { type: 'terminal', value: 'd' }, min: 0, max: null } }, { name: 'r', definition: { type: 'special', text: 'x' } }]
  const railroad = nativeSchemaView('crabtalk/bezel', 'railroad', { type: 'railroad', title: 'G', rules }, hooks)
  expect(railroad.getRules()[0].definition.max).toBe(Infinity)
  expect(railroad.getRule('r').definition.type).toBe('special')
  expect(railroad.getTitle()).toBe('G')

  const wardley = nativeSchemaView('Latias94/merman', 'wardley', { type: 'wardley', title: 'E', accTitle: null, nodes: [{ id: 'A', label: 'A', x: 10, y: 20 }], links: [], trends: [], pipelines: [], annotations: [], notes: [], accelerators: [], deaccelerators: [], annotationsBox: null, axes: { stages: ['G'] }, size: { width: 1, height: 2 } }, hooks)
  expect(wardley.getWardleyData()).toEqual({ nodes: [{ id: 'A', label: 'A', x: 10, y: 20 }], links: [], trends: [], pipelines: [], annotations: [], notes: [], accelerators: [], deaccelerators: [], annotationsBox: undefined, axes: { stages: ['G'] }, size: { width: 1, height: 2 } })

  const venn = nativeSchemaView('obsidianmd/pele', 'venn', { subsets: [{ sets: ['B'], size: 10 }], textNodes: [], styles: [{ targets: ['A', 'B'], styles: new Map([['fill', 'red']]) }], current: ['A', 'B'], indent: false }, hooks)
  expect(venn.getSubsetData()).toEqual([{ sets: ['B'], size: 10, label: undefined }])
  expect(venn.getStyleData()).toEqual([{ targets: ['A', 'B'], styles: { fill: 'red' } }])
  expect(() => nativeSchemaView('Latias94/merman', 'venn', { subsets: [], textNodes: [], styleEntries: [] }, hooks).getCurrentSets()).toThrow('unsupported')

  const cynefin = nativeSchemaView('Latias94/merman', 'cynefin', { domains: [{ name: 'complex', items: [{ label: 'A' }] }], transitions: [{ from: 'clear', to: 'chaotic' }] }, hooks)
  expect(cynefin.getDomains().get('complex').items[0].label).toBe('A')
  expect(cynefin.getTransitions()).toEqual([{ from: 'clear', to: 'chaotic', label: undefined }])

  expect(nativeSchemaView('Latias94/merman', 'packet', { packet: [[{ start: 0, end: 10, bits: 11, label: 'test' }]] }, hooks).getPacket()).toEqual([[{ start: 0, end: 10, bits: 11, label: 'test' }]])
})

test('architecture nodes get their edge lists; Bezel integer-like ids lose their order', () => {
  const { hooks } = verdicts()
  const edges = [{ lhsId: 'a', lhsDir: 'R', lhsInto: false, lhsGroup: false, rhsId: 'b', rhsDir: 'L', rhsInto: false, rhsGroup: false }]
  const pele = nativeSchemaView('obsidianmd/pele', 'architecture', { nodes: new Map<string, any>([['a', { id: 'a', type: 'service', icon: 'server', title: 'A', in: 'api' }], ['b', { id: 'b', type: 'service' }], ['j', { id: 'j', type: 'junction' }]]), groups: new Map([['api', { id: 'api', icon: 'cloud', title: 'API' }]]), edges, layoutHints: [] }, hooks)
  expect(pele.getServices().map((s: any) => [s.id, s.edges.length])).toEqual([['a', 1], ['b', 1]])
  expect(pele.getJunctions().map((j: any) => j.id)).toEqual(['j'])
  expect(() => pele.getDataStructures()).toThrow('unsupported')
  const merman = nativeSchemaView('Latias94/merman', 'architecture', { nodes: [{ id: 'a', type: 'service', edges: [{ ...edges[0], lhsInto: null }], icon: 'server', iconText: null, title: 'A', in: null }], groups: [], edges: [{ ...edges[0], lhsInto: null }], layoutHints: [] }, hooks)
  expect(merman.getEdges()[0].lhsInto).toBe(false)
  expect(() => nativeSchemaView('crabtalk/bezel', 'architecture', { nodes: { 10: { id: '10', type: 'service' }, a: { id: 'a', type: 'service' } }, groups: {}, edges: [], layoutHints: [] }, hooks).getServices()).toThrow('gap')
})

test('state layout data keeps structural fields; renderer fields are unsupported', () => {
  const { hooks } = verdicts()
  const graph = { nodes: [{ id: 'B', shape: 'roundedWithTitle', label: 'B', description: [], cssClasses: ' statediagram-state', cssCompiledStyles: [], cssStyles: [], type: 'group', isGroup: true, dir: 'TB', colorIndex: 0 }], edges: [{ id: 'edge0', start: 'root_start', end: 'A', label: '', classes: 'transition' }] }
  const view = nativeSchemaView('obsidianmd/pele', 'state', { states: new Map(), classes: new Map([['s', { id: 's', styles: ['fill:#f00'], textStyles: [] }]]), links: new Map(), graph }, hooks)
  expect(view.getData().nodes[0].dir).toBe('TB')
  expect(() => view.getData().nodes[0].colorIndex).toThrow('unsupported')
  expect(view.getClasses().get('s').styles).toEqual(['fill:#f00'])
  const merman = nativeSchemaView('Latias94/merman', 'state', { states: {}, styleClasses: { s: { id: 's', styles: [], textStyles: [] } }, links: {}, nodes: [{ id: 'A', shape: 'rect', label: 'A', cssClasses: '', cssStyles: [], isGroup: false, padding: 8, parentId: null }], edges: [] }, hooks)
  expect(merman.getData().nodes[0].parentId).toBeUndefined()
  expect(() => merman.getData().nodes[0].padding).toThrow('unsupported')
  expect([...merman.getClasses().keys()]).toEqual(['s'])
})

test('git graph, mindmap and sequence extras', () => {
  const { hooks } = verdicts()
  expect(nativeSchemaView('crabtalk/bezel', 'gitgraph', { commits: {}, branches: {}, lanes: ['main', 'd', 'c', 'b'] }, hooks).getBranchesAsObjArray()).toEqual([{ name: 'main' }, { name: 'd' }, { name: 'c' }, { name: 'b' }])
  expect(nativeSchemaView('Latias94/merman', 'gitgraph', { commits: [], branches: [{ name: 'main' }, { name: 'd' }] }, hooks).getBranchesAsObjArray()).toEqual([{ name: 'main' }, { name: 'd' }])

  const mindmap = nativeSchemaView('obsidianmd/pele', 'mindmap', { nodes: [{ id: 0, nodeId: 'root', level: 0, descr: 'Root', type: 3, children: [{ id: 1, nodeId: 'A', level: 2, descr: 'Rect', type: 2, children: [] }], isRoot: true }] }, hooks)
  expect(mindmap.nodeType.RECT).toBe(2)
  expect(mindmap.getMindmap().children[0].type).toBe(mindmap.nodeType.RECT)
  expect(() => mindmap.getMindmap().width).toThrow('unsupported')

  const sequence = nativeSchemaView('obsidianmd/pele', 'sequence', { actors: new Map([['A', { name: 'A', description: 'Alice', wrap: false, links: new Map([['Help', 'https://example.com']]), properties: new Map(), type: 'participant' }]]), createdActors: new Map([['A', 1]]), destroyedActors: new Map(), messages: [] }, hooks)
  expect(sequence.getActor('A').links).toEqual({ Help: 'https://example.com' })
  expect([...sequence.getCreatedActors()]).toEqual([['A', 1]])
})

test('Langium AST views claim only what the database record keeps', () => {
  const { hooks } = verdicts()
  const railroad = nativeAstView('obsidianmd/pele', 'Railroad', { title: 'Example Grammar', rules: [{ name: 'rule', definition: { type: 'terminal', value: 'a' } }] }, hooks)
  expect(railroad.title).toBe('Example Grammar')
  expect(railroad.accTitle).toBeUndefined()
  expect(railroad.rules.map((r: any) => r.name)).toEqual(['rule'])
  expect(() => railroad.rules[0].definition).toThrow('unsupported')
  const git = nativeAstView('Latias94/merman', 'GitGraph', { commits: [], branches: [], title: null }, hooks)
  expect(git.$type).toBe('GitGraph')
  expect(() => git.statements).toThrow('unsupported')
})
