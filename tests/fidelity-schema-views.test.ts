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
  expect(() => radar.axes[1].label).toThrow('gap')
  expect(radar.curves[0].entries.map((e: any) => [e.$type, e.value])).toEqual([['Entry', 1], ['Entry', 2]])
  expect(() => radar.options).toThrow('gap')
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

test('XMermaid: exactly_one is ONLY_ONE, and normalized class relations stay a gap', () => {
  const { hooks } = verdicts()
  const er = nativeSchemaView('evangwt/xmermaid', 'er', { type: 'er', entities: [{ name: 'A' }, { name: 'B' }], relationships: [{ from: 'A', to: 'B', label: 'x', from_cardinality: 'exactly_one', to_cardinality: 'zero_or_more', non_identifying: true }] }, hooks)
  expect(er.getRelationships()[0].relSpec).toEqual({ cardA: 'ZERO_OR_MORE', cardB: 'ONLY_ONE', relType: 'NON_IDENTIFYING' })
  const cls = nativeSchemaView('evangwt/xmermaid', 'class', { type: 'class', classes: [{ id: 'A', label: 'A' }], relations: [{ from: 'B', to: 'A', kind: 'inheritance' }] }, hooks)
  expect(() => cls.getRelations()).toThrow('gap')
})
