import { expect, test } from 'bun:test'
import { nativeAstView, nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// Native outputs below were captured from the parser bridges at their pinned versions.
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

test('an index-addressed graph maps identities, markers and strokes into Mermaid vocabulary', () => {
  const { hooks } = verdicts()
  const grok = {
    nodes: [{ label: 'Start', shape: 'Rect' }, { label: 'Round', shape: 'Round' }, { label: 'Decide', shape: 'Diamond' }],
    edges: [
      { from: 0, to: 1, label: 'yes', head_to: 'Arrow', head_from: 'None', line: 'Solid' },
      { from: 1, to: 2, label: null, head_to: 'Circle', head_from: 'Circle', line: 'Dotted' },
    ],
    index: { A: 0, B: 1, C: 2 },
    groups: [{ id: 'S1', label: 'Group', parent: null }],
    node_group: [null, null, 0],
    dir: 'Right',
  }
  const view = nativeSchemaView('xai-org/grok-build', 'flowchart', grok, hooks)
  const vertices = view.getVertices()
  expect([...vertices.keys()]).toEqual(['A', 'B', 'C'])
  expect(vertices.get('A').type).toBe('square')
  expect(vertices.get('C').text).toBe('Decide')
  expect(view.getEdges().map((e: any) => [e.start, e.end, e.type, e.stroke, e.text])).toEqual([
    ['A', 'B', 'arrow_point', 'normal', 'yes'],
    ['B', 'C', 'double_arrow_circle', 'dotted', ''],
  ])
  expect(view.getSubGraphs()[0].nodes).toEqual(['C'])
  expect(view.getDirection()).toBe('LR')
})

test('a concept the native model does not carry is unsupported; an unmapped expected field is a gap', () => {
  const { hooks, log } = verdicts()
  const view = nativeSchemaView('xai-org/grok-build', 'flowchart', { nodes: [{ label: 'A', shape: 'Rect' }], edges: [], index: { A: 0 }, groups: [], node_group: [null], dir: 'Down' }, hooks)
  expect(() => view.getVertices().get('A').styles).toThrow('unsupported')
  expect(log.at(-1)).toContain('keeps no per-node styles')
  expect(() => view.getVertices().get('A').props).toThrow('gap')
  expect(log.at(-1)).toBe('gap: vertex.props')
  // A field Mermaid does not define stays undefined rather than failing.
  expect(view.getVertices().get('A').notAField).toBeUndefined()
})

test('ER cardinalities follow Mermaid: cardA from the right-hand marker, IDENTIFYING for a solid line', () => {
  const { hooks } = verdicts()
  const ascii = {
    Entities: [{ Name: 'CUSTOMER', Display: 'CUSTOMER', Attributes: [{ Type: 'string', Name: 'name', Keys: ['PK'], Comment: 'the name' }] }, { Name: 'ORDER', Display: 'ORDER', Attributes: [] }],
    Relationships: [{ Left: 'CUSTOMER', Right: 'ORDER', LeftCard: 'OnlyOne', RightCard: 'ZeroOrMore', Identifying: true, Label: 'places' }],
  }
  const view = nativeSchemaView('AlexanderGrooff/mermaid-ascii', 'er', ascii, hooks)
  expect(view.getEntities().get('CUSTOMER').attributes[0].comment).toBe('the name')
  expect(view.getRelationships()[0].relSpec).toEqual({ cardA: 'ZERO_OR_MORE', cardB: 'ONLY_ONE', relType: 'IDENTIFYING' })
  expect(view.getRelationships()[0].roleA).toBe('places')
})

test('class relations, notes and absent notes', () => {
  const { hooks, log } = verdicts()
  const dart = {
    classes: new Map([['Animal', { id: 'Animal', label: 'Animal', annotations: ['interface'], attributes: [{ text: '+int age' }], methods: [], cssClasses: [], styles: new Map(), link: null }]]),
    relations: [{ from: 'Animal', to: 'Duck', endFrom: 'extension', endTo: 'none', dotted: false, label: null, cardFrom: null, cardTo: null }],
    notes: [{ text: 'hello', forClass: 'Animal' }],
  }
  const view = nativeSchemaView('orestesgaolin/mermaid', 'class', dart, hooks)
  expect(view.getRelations()[0].relation).toEqual({ type1: view.relationType.EXTENSION, type2: 'none', lineType: view.lineType.LINE })
  expect(view.getClass('Animal').members.length).toBe(1)
  expect(view.getNote(0)).toEqual({ id: 'note0', class: 'Animal', text: 'hello', index: 0 })
  const crafter = nativeSchemaView('crafter-station/mermaid', 'class', { classes: new Map(), relations: [] }, hooks)
  expect(() => crafter.getNote(0)).toThrow('unsupported')
  expect(log.at(-1)).toContain("Crafter's class model keeps no notes")
})

test('Ondine has no model, and an AST view claims only what a resolved database can tell apart', () => {
  const { hooks, log } = verdicts()
  expect(() => nativeSchemaView('wevm/ondine', 'flowchart', {}, hooks).whole.getVertices()).toThrow('unsupported')
  expect(log.at(-1)).toContain('Ondine exposes no parsed model')
  const radar = nativeAstView('crabtalk/bezel', 'Radar', { title: 'T', accTitle: null, accDescr: null, axes: [{ name: 'a', label: 'Axis A' }, { name: 'b', label: 'b' }], curves: [{ name: 'c', label: 'c', entries: [1, 2] }], options: { showLegend: true } }, hooks)
  expect(radar.$type).toBe('Radar')
  expect(radar.axes[0].label).toBe('Axis A')
  expect(() => radar.axes[1].label).toThrow('unsupported')
  expect(radar.curves[0].entries.map((e: any) => [e.$type, e.value])).toEqual([['Entry', 1], ['Entry', 2]])
  expect(() => radar.options).toThrow('unsupported')
  // Without a reviewed view an accepted parse is an AST of the right type whose fields are gaps.
  const bare = nativeAstView('xai-org/grok-build', 'Radar', {}, hooks)
  expect(bare.$type).toBe('Radar')
  expect(() => bare.axes).toThrow('gap')
  const tree = nativeAstView('obsidianmd/pele', 'TreeView', { root: { level: -1, children: [{ level: 0, name: 'Root', children: [{ level: 4, name: 'a', cssClass: 'hl', children: [] }] }] } }, hooks)
  expect(tree.nodes.map((n: any) => [n.name, n.indent])).toEqual([['Root', undefined], ['a', 4]])
  expect(tree.nodes[1].classAnnotation).toBe('hl')
})

test('zombie-mermaid: crow\'s-foot words map to Mermaid cardinalities; an association is not a recorded marker', () => {
  const { hooks, log } = verdicts()
  const er = nativeSchemaView('dfadler/zombie-mermaid', 'er', { entities: [{ id: 'A', label: 'A', attributes: [] }, { id: 'B', label: 'B', attributes: [] }], relationships: [{ entity1: 'A', entity2: 'B', cardinality1: 'one', cardinality2: 'zero-many', label: 'has', identifying: false }] }, hooks)
  expect(er.getRelationships()[0].relSpec).toEqual({ cardA: 'ZERO_OR_MORE', cardB: 'ONLY_ONE', relType: 'NON_IDENTIFYING' })
  const cls = nativeSchemaView('dfadler/zombie-mermaid', 'class', { classes: [], relationships: [{ from: 'A', to: 'B', type: 'realization', markerAt: 'to' }, { from: 'C', to: 'D', type: 'association', markerAt: 'to' }, { from: 'E', to: 'F', type: 'composition', markerAt: 'from' }] }, hooks)
  const [realization, association, composition] = cls.getRelations()
  expect(realization.relation).toEqual({ type1: 'none', type2: cls.relationType.EXTENSION, lineType: cls.lineType.DOTTED_LINE })
  expect(() => association.relation).toThrow('unsupported')
  expect(log.at(-1)).toContain("same 'association'")
  expect(composition.relation.type1).toBe(cls.relationType.COMPOSITION)
  expect(() => composition.relation.lineType).toThrow('unsupported')
})

test('XMermaid: exactly_one is ONLY_ONE, and normalized class relations are unsupported', () => {
  const { hooks } = verdicts()
  const er = nativeSchemaView('evangwt/xmermaid', 'er', { type: 'er', entities: [{ name: 'A' }, { name: 'B' }], relationships: [{ from: 'A', to: 'B', label: 'x', from_cardinality: 'exactly_one', to_cardinality: 'zero_or_more', non_identifying: true }] }, hooks)
  expect(er.getRelationships()[0].relSpec).toEqual({ cardA: 'ZERO_OR_MORE', cardB: 'ONLY_ONE', relType: 'NON_IDENTIFYING' })
  const cls = nativeSchemaView('evangwt/xmermaid', 'class', { type: 'class', classes: [{ id: 'A', label: 'A' }], relations: [{ from: 'B', to: 'A', kind: 'inheritance' }] }, hooks)
  expect(() => cls.getRelations()).toThrow('unsupported')
})

test('XMermaid flowchart: a null label is the id on a bare node; style words and markers make the edge type', () => {
  const { hooks, log } = verdicts()
  const raw = {
    type: 'flowchart', direction: 'TD',
    nodes: [{ id: 'A', label: 'Start', shape: 'rect', classes: [] }, { id: 'B', label: null, shape: 'rect', classes: ['hl'] }, { id: 'C', label: 'Decide', shape: 'diamond', classes: [] }],
    edges: [
      { from: 'A', to: 'B', style: 'arrow', label: 'yes', min_length: 1 },
      { from: 'B', to: 'C', style: 'dotted', label: null, min_length: 2, end_marker: 'arrow' },
      { from: 'A', to: 'C', style: 'line', label: null, min_length: 1, start_marker: 'cross', end_marker: 'cross' },
    ],
    subgraphs: [{ id: 'outer', title: 'outer', nodes: ['B'], subgraphs: [{ id: 'inner', title: 'In', nodes: ['C'], subgraphs: [] }] }],
    link_styles: [{ indices: [0], targets_default: false, style: { stroke: 'red' } }],
  }
  const view = nativeSchemaView('evangwt/xmermaid', 'flowchart', raw, hooks)
  const vertices = view.getVertices()
  expect(vertices.get('A').type).toBe('square')
  expect([vertices.get('B').text, vertices.get('B').type, vertices.get('B').classes]).toEqual(['B', undefined, ['hl']])
  expect(view.getEdges().map((e: any) => [e.type, e.stroke, e.length, e.text, e.style])).toEqual([
    ['arrow_point', 'normal', 1, 'yes', ['stroke:red']],
    ['arrow_point', 'dotted', 2, '', undefined],
    ['double_arrow_cross', 'normal', 1, '', undefined],
  ])
  expect(view.getSubGraphs().map((g: any) => [g.id, g.nodes])).toEqual([['inner', ['C']], ['outer', ['B', 'inner']]])
  expect(view.getDirection()).toBe('TB')
  expect(() => vertices.get('A').styles).toThrow('unsupported')
  expect(log.at(-1)).toContain('merges classDef and style')
})

test('agentic-mermaid class relations: markerAt and kind give each end; notes keep their class', () => {
  const { hooks } = verdicts()
  const raw = {
    kind: 'class',
    classes: [{ id: 'Animal', members: [] }, { id: 'P', generic: 'T', members: [] }],
    relations: [
      { from: 'Animal', to: 'Duck', kind: 'inheritance', label: 'extends', markerAt: 'from' },
      { from: 'A', to: 'B', kind: 'dependency', markerAt: 'to' },
      { from: 'C', to: 'D', kind: 'composition', markerAt: 'from', lineStyle: 'dashed', fromCardinality: '1' },
      { from: 'M', to: 'N', kind: 'realization', markerAt: 'both', fromKind: 'realization', toKind: 'realization' },
      { from: 'I', to: 'J', kind: 'link-dashed', markerAt: 'none' },
    ],
    notes: [{ text: 'quack', for: 'Duck' }, { text: 'general' }],
  }
  const view = nativeSchemaView('adewale/agentic-mermaid', 'class', raw, hooks)
  expect(view.getRelations().map((r: any) => [r.id1, r.id2, r.relation.type1, r.relation.type2, r.relation.lineType, r.relationTitle1, r.title])).toEqual([
    ['Animal', 'Duck', 1, 'none', 0, 'none', 'extends'],
    ['A', 'B', 'none', 3, 1, 'none', undefined],
    ['C', 'D', 2, 'none', 1, '1', undefined],
    ['M', 'N', 1, 1, 1, 'none', undefined],
    ['I', 'J', 'none', 'none', 1, 'none', undefined],
  ])
  expect(view.getClass('P').type).toBe('T')
  expect(view.getNote(0)).toEqual({ id: 'note0', class: 'Duck', text: 'quack', index: 0 })
  expect(view.getNote(1).class).toBeUndefined()
})

test('VitePress relations keep no marker side; Merslim ER keeps keys but not cardinalities', () => {
  const { hooks, log } = verdicts()
  const vp = nativeSchemaView('KlangHaus/vitepress-plugin-diagram', 'class', { classes: { Animal: { id: 'Animal', members: [{ name: 'int age', isMethod: false }, { name: 'eat', isMethod: true }], annotation: 'interface' } }, relationships: [{ from: 'A', to: 'B', type: 'inheritance', label: 'x' }] }, hooks)
  expect([vp.getClass('Animal').members.length, vp.getClass('Animal').methods.length, vp.getClass('Animal').annotations]).toEqual([1, 1, ['interface']])
  expect([vp.getRelations()[0].id1, vp.getRelations()[0].title]).toEqual(['A', 'x'])
  expect(() => vp.getRelations()[0].relation).toThrow('unsupported')
  expect(() => vp.getNote(0)).toThrow('unsupported')
  const er = nativeSchemaView('emtyty/merslim', 'er', { type: 'er', schema: { tables: [{ name: 'CUSTOMER', columns: [{ name: 'id', type: 'string', isPK: true, isFK: false, isUnique: true }] }], relations: [{ fromTable: 'CUSTOMER', fromCol: 'places', toTable: 'ORDER', toCol: 'places', nullable: true }] } }, hooks)
  expect(er.getEntities().get('CUSTOMER').attributes[0].keys).toEqual(['PK', 'UK'])
  expect(() => er.getEntities().get('CUSTOMER').attributes[0].comment).toThrow('unsupported')
  expect([er.getRelationships()[0].entityA, er.getRelationships()[0].roleA]).toEqual(['CUSTOMER', 'places'])
  expect(() => er.getRelationships()[0].relSpec).toThrow('unsupported')
  expect(log.at(-1)).toContain('nullable flag')
})

test('Frankenmermaid flowchart IR: arrow words name both ends and the line; subgraphs come out innermost first', () => {
  const { hooks, log } = verdicts()
  const ir = {
    diagram_type: 'Flowchart', direction: 'LR', labels: [{ text: 'Start' }, { text: 'yes' }, { text: 'Outer' }, { text: 'inner' }],
    nodes: [{ id: 'A', label: 0, shape: 'Rect', classes: ['has-link'], interaction: { href: 'http://x' } }, { id: 'B', shape: 'Rect', classes: [] }, { id: 'C', shape: 'Asymmetric', classes: [] }],
    edges: [{ from: { Node: 0 }, to: { Node: 1 }, arrow: 'Arrow', label: 1 }, { from: { Node: 1 }, to: { Node: 2 }, arrow: 'DoubleDottedArrow' }, { from: { Node: 0 }, to: { Node: 2 }, arrow: 'ThickCircle' }],
    style_refs: [{ target: { Node: 0 }, style: 'fill:#f00,stroke:#333' }, { target: { Link: 1 }, style: 'stroke:red' }],
    graph: { subgraphs: [{ id: 0, key: 'outer', title: 2, children: [1], members: [1, 2], direction: 'TB' }, { id: 1, key: 'inner', title: 3, parent: 0, children: [], members: [2] }] },
  }
  const view = nativeSchemaView('Dicklesworthstone/frankenmermaid', 'flowchart', ir, hooks)
  const vertices = view.getVertices()
  expect([vertices.get('A').type, vertices.get('A').classes, vertices.get('A').styles, vertices.get('A').link]).toEqual(['square', [], ['fill:#f00', 'stroke:#333'], 'http://x'])
  expect([vertices.get('B').text, vertices.get('B').type, vertices.get('B').link]).toEqual(['B', undefined, undefined])
  expect(view.getEdges().map((e: any) => [e.type, e.stroke, e.text, e.style])).toEqual([['arrow_point', 'normal', 'yes', undefined], ['double_arrow_point', 'dotted', '', ['stroke:red']], ['arrow_circle', 'thick', '', undefined]])
  expect(view.getSubGraphs().map((g: any) => [g.id, g.title, g.nodes, g.dir])).toEqual([['inner', 'inner', ['C'], undefined], ['outer', 'Outer', ['B', 'inner'], 'TB']])
  expect(() => view.getEdges()[0].length).toThrow('unsupported')
  expect(log.at(-1)).toContain('no link length')
})

test('C4 views: Mermaid shape types, the global boundary, and what each model keeps', () => {
  const { hooks, log } = verdicts()
  const zombie = nativeSchemaView('dfadler/zombie-mermaid', 'c4', {
    variant: 'container',
    elements: [{ alias: 'web', kind: 'container', shape: 'default', external: false, label: 'Web', technology: 'React', description: 'UI' }, { alias: 'db', kind: 'container', shape: 'db', external: true, label: 'DB' }, { alias: 'p', kind: 'person', shape: 'default', external: false, label: 'P' }],
    boundaries: [{ alias: 'sb', label: 'Sys', type: 'SYSTEM', elementAliases: ['web'], children: [{ alias: 'in', label: 'In', elementAliases: ['db'], children: [] }] }],
    relationships: [{ from: 'p', to: 'web', label: 'Uses', bidirectional: false, layout: 'up' }, { from: 'web', to: 'db', label: 'Reads', bidirectional: false, reversed: true, technology: 'SQL' }],
  }, hooks)
  expect(zombie.getC4Type()).toBe('C4Container')
  expect(zombie.getC4ShapeArray().map((s: any) => [s.alias, s.typeC4Shape.text, s.parentBoundary, s.techn])).toEqual([['web', 'container', 'sb', { text: 'React' }], ['db', 'external_container_db', 'in', { text: '' }], ['p', 'person', 'global', undefined]])
  expect(zombie.getBoundaries().map((b: any) => [b.alias, b.type.text, b.parentBoundary])).toEqual([['global', 'global', ''], ['sb', 'SYSTEM', 'global'], ['in', 'system', 'sb']])
  expect(zombie.getRels().map((r: any) => [r.type, r.techn.text])).toEqual([['rel_u', ''], ['rel_b', 'SQL']])
  expect(() => zombie.getC4ShapeArray()[0].wrap).toThrow('unsupported')
  const dart = nativeSchemaView('orestesgaolin/mermaid', 'c4', { nodes: new Map([['q', { id: 'q', kind: 'queue', label: 'Q', description: 'Async', technology: '', styleKey: 'system_queue', boundary: 'b1' }]]), boundaries: [{ id: 'b1', label: 'Custom', type: 'Enterprise', parent: null, isNode: false }], rels: [{ from: 'q', to: 'q', label: 'Self', technology: '', bidirectional: false, backwards: false }], subtype: 'context' }, hooks)
  expect([dart.getC4Shape('q').typeC4Shape.text, dart.getC4Shape('q').descr.text, dart.getBoundary('b1').type.text]).toEqual(['system_queue', 'Async', 'ENTERPRISE'])
  expect(() => dart.getRels()[0].type).toThrow('unsupported')
  expect(log.at(-1)).toContain('Rel_U/D/L/R')
})

test('sequence: block events flatten into Mermaid start, section and end markers in source order', () => {
  const { hooks, log } = verdicts()
  const termaid = {
    participants: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }],
    events: [
      { source: 'A', target: 'B', label: 'Hello', line_type: 'solid', arrow_type: 'arrow' },
      { participant: 'B', active: true },
      { kind: 'alt', label: 'ok', events: [{ source: 'A', target: 'B', label: 'x', line_type: 'dotted', arrow_type: 'open' }], sections: [{ label: 'bad', events: [] }] },
      { text: 'both', position: 'over', participants: ['A', 'B'] },
    ],
    autonumber: false,
  }
  const view = nativeSchemaView('fasouto/termaid', 'sequence', termaid, hooks)
  expect(view.getMessages().map((m: any) => [m.id, m.from, m.to, m.message, m.type])).toEqual([
    ['0', 'A', 'B', 'Hello', 0], ['1', 'B', undefined, '', 17], ['2', undefined, undefined, 'ok', 12], ['3', 'A', 'B', 'x', 6], ['4', undefined, undefined, 'bad', 13], ['5', undefined, undefined, '', 14], ['6', 'A', 'B', 'both', 2],
  ])
  expect(view.getMessages()[6].placement).toBe(2)
  expect(() => view.getMessages()[0].activate).toThrow('unsupported')
  expect(() => view.getMessages()[0].wrap).toThrow('unsupported')
  expect(() => nativeSchemaView('fasouto/termaid', 'sequence', { ...termaid, autonumber: true }, hooks).getMessages()).toThrow('unsupported')
  expect(log.at(-1)).toContain('autonumber')
  const dart = nativeSchemaView('orestesgaolin/mermaid', 'sequence', { participants: new Map(), events: [{ kind: 'loop', label: 'L', color: null }, { from: 'A', to: 'B', arrow: 'dottedPoint', text: 'p', wrap: true }, {}] }, hooks)
  expect(dart.getMessages().map((m: any) => [m.type, m.message])).toEqual([[10, 'L'], [25, 'p'], [11, '']])
  expect(dart.getMessages()[1].wrap).toBe(true)
})

test('ports: kanban sections and getData nodes; treeView root', () => {
  const { hooks } = verdicts()
  const bezel = { type: 'kanban', sections: [{ id: 'todo', level: 2, label: 'Todo', items: [{ id: 't1', level: 4, label: 'Docs', priority: 'High' }] }] }
  const view = nativeSchemaView('crabtalk/bezel', 'kanban', bezel, hooks)
  expect(view.getSections().map((s: any) => s.label)).toEqual(['Todo'])
  expect(view.getData().nodes.map((n: any) => [n.id, n.parentId, n.isGroup, n.shape, n.priority])).toEqual([['todo', undefined, true, 'kanbanSection', undefined], ['t1', 'todo', false, 'kanbanItem', 'High']])
  expect(() => view.getData().config).toThrow('unsupported')
  expect(() => view.getData().nodes[1].rx).toThrow('unsupported')
  const tree = nativeSchemaView('obsidianmd/pele', 'treeview', { root: { id: 0, level: -1, name: '/', nodeType: 'directory', children: [{ id: 1, level: 0, name: 'src', nodeType: 'file', icon: null, children: [] }] }, count: 2 }, hooks)
  expect([tree.getRoot().children[0].name, tree.getRoot().children[0].icon, tree.getCount()]).toEqual(['src', undefined, 2])
})
