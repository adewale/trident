import { expect, test } from 'bun:test'
import { nativeAstView, nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// mermaid_core 0.3.2 models below were captured from the Dart bridge (scripts/fidelity-probe.ts),
// trimmed to the fields the views read. The bridge names each kind of a sealed model class
// (RailroadExpr, SeqEvent) in $class.
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
const DART = ['orestesgaolin/mermaid', 'pub:mermaid_flutter']

// railroad-beta / title T / expr = term (("+" | "-") term)* ; / x = ? any ? , [ a ] , { b } , c+ ;
const railroadRaw = {
  title: 'T',
  rules: [
    { name: 'expr', expr: { $class: 'RailroadSequence', items: [{ $class: 'RailroadNonTerminal', text: 'term' }, { $class: 'RailroadRepetition', oneOrMore: false, child: { $class: 'RailroadSequence', items: [{ $class: 'RailroadChoice', options: [{ $class: 'RailroadTerminal', text: '+' }, { $class: 'RailroadTerminal', text: '-' }] }, { $class: 'RailroadNonTerminal', text: 'term' }] } }] } },
    { name: 'x', expr: { $class: 'RailroadSequence', items: [{ $class: 'RailroadSpecial', text: 'any' }, { $class: 'RailroadOptional', child: { $class: 'RailroadNonTerminal', text: 'a' } }, { $class: 'RailroadRepetition', oneOrMore: true, child: { $class: 'RailroadNonTerminal', text: 'c' } }, { $class: 'RailroadEmpty' }] } },
  ],
}

test('mermaid_core railroad: expression kinds translate to Mermaid rule records', () => {
  for (const project of DART) {
    const { hooks } = verdicts()
    const view = nativeSchemaView(project, 'railroad', railroadRaw, hooks)
    const rules = view.getRules()
    expect(rules).toEqual([
      { name: 'expr', definition: { type: 'sequence', elements: [{ type: 'nonterminal', name: 'term' }, { type: 'repetition', min: 0, max: Infinity, element: { type: 'sequence', elements: [{ type: 'choice', alternatives: [{ type: 'terminal', value: '+' }, { type: 'terminal', value: '-' }] }, { type: 'nonterminal', name: 'term' }] } }] } },
      { name: 'x', definition: { type: 'sequence', elements: [{ type: 'special', text: 'any' }, { type: 'optional', element: { type: 'nonterminal', name: 'a' } }, { type: 'repetition', min: 1, max: Infinity, element: { type: 'nonterminal', name: 'c' } }, { type: 'mermaid_core:RailroadEmpty' }] } },
    ])
    expect('comment' in rules[0]).toBe(true)
    expect(view.getRule('x').definition.elements[0].text).toBe('any')
    expect(view.getTitle()).toBe('T')
    expect(() => view.getAccTitle()).toThrow('unsupported')
  }
  const { hooks, log } = verdicts()
  expect(() => nativeSchemaView(DART[0], 'railroad', { rules: [{ name: 'r', expr: { text: 'a' } }] }, hooks).getRules()).toThrow('gap')
  expect(log.at(-1)).toContain('railroad expression text')
  const ast = nativeAstView(DART[0], 'Railroad', railroadRaw, hooks)
  expect(ast.rules.map((rule: any) => rule.name)).toEqual(['expr', 'x'])
  expect(() => ast.rules[0].definition).toThrow('unsupported')
})

// wardley-beta / title Test Pipeline / size [800, 600] / evolution Genesis@0.3 -> Custom@0.6 ->
// Product@0.85 -> Commodity@1.0 / anchor User [0.9, 0.1] / component Kettle [0.45, 0.57] label
// [-10, 5] (build) / pipeline Kettle { component Campfire Kettle [0.35] label [-60, 35] /
// component Electric Kettle [0.53] } / User -> Kettle / Kettle -.-> Campfire Kettle; heat /
// evolve Kettle 0.8 / note "hello" [0.2, 0.3] / annotations [0.9, 0.1] / annotation 1,[0.5, 0.5]
// "first" / accelerator Fast [0.4, 0.6]
const comp = (name: string, x: number, y: number, className: string, extra = {}) => ({ name, x, y, anchor: className === 'anchor', labelOffsetX: null, labelOffsetY: null, inertia: false, sourceStrategy: null, className, evolveTo: null, isPipelineParent: false, ...extra })
const wardleyRaw = {
  components: [
    comp('Kettle', 56.99999999999999, 45, 'component', { labelOffsetX: -10, labelOffsetY: 5, sourceStrategy: 'build', evolveTo: 80, isPipelineParent: true }),
    comp('User', 10, 90, 'anchor'),
    comp('Campfire Kettle', 35, 45, 'pipeline-component', { labelOffsetX: -60, labelOffsetY: 35 }),
    comp('Electric Kettle', 53, 45, 'pipeline-component'),
  ],
  edges: [{ from: 'User', to: 'Kettle', dashed: false, label: null, flow: null }, { from: 'Kettle', to: 'Campfire Kettle', dashed: true, label: 'heat', flow: 'forward' }],
  title: 'Test Pipeline',
  pipelines: [{ parent: 'Kettle', componentIds: ['Campfire Kettle', 'Electric Kettle'] }],
  notes: [{ text: 'hello', x: 30, y: 20 }],
  annotations: [{ number: 1, x: 50, y: 50, text: 'first' }],
  annotationsBox: { x: 10, y: 90 },
  accelerators: [{ name: 'Fast', x: 60, y: 40 }],
  deaccelerators: [],
  stages: ['Genesis', 'Custom', 'Product', 'Commodity'],
  stageBoundaries: [0.3, 0.6, 0.85, 1],
  xLabel: null,
  yLabel: null,
  size: { width: 800, height: 600 },
}

test('mermaid_core wardley: Mermaid node order, pipeline ids, resolved links, trends', () => {
  const { hooks, log } = verdicts()
  const view = nativeSchemaView(DART[0], 'wardley', wardleyRaw, hooks)
  const data = view.getWardleyData()
  expect(data.nodes.map((node: any) => node.id)).toEqual(['User', 'Kettle', 'Kettle_Campfire Kettle', 'Kettle_Electric Kettle'])
  expect(data.nodes[0]).toEqual({ id: 'User', label: 'User', x: 10, y: 90, className: 'anchor', labelOffsetX: undefined, labelOffsetY: undefined, inertia: undefined, sourceStrategy: undefined })
  expect(data.nodes[1]).toMatchObject({ inertia: false, sourceStrategy: 'build', labelOffsetX: -10, isPipelineParent: true })
  expect(data.nodes[2]).toMatchObject({ label: 'Campfire Kettle', inPipeline: true, y: 45, inertia: undefined })
  expect(data.links).toEqual([{ source: 'User', target: 'Kettle', dashed: false, label: undefined, flow: undefined }, { source: 'Kettle', target: 'Kettle_Campfire Kettle', dashed: true, label: 'heat', flow: 'forward' }])
  expect(data.trends).toEqual([{ nodeId: 'Kettle', targetX: 80, targetY: 45 }])
  expect(data.pipelines).toEqual([{ nodeId: 'Kettle', componentIds: ['Kettle_Campfire Kettle', 'Kettle_Electric Kettle'] }])
  expect(data.annotations).toEqual([{ number: 1, coordinates: [{ x: 50, y: 50 }], text: 'first' }])
  expect(data.axes).toEqual({ stages: ['Genesis', 'Custom', 'Product', 'Commodity'], stageBoundaries: [0.3, 0.6, 0.85, 1] })
  expect(data.size).toEqual({ width: 800, height: 600 })
  expect(view.getDiagramTitle()).toBe('Test Pipeline')
  // Two evolve targets: their statement order is not kept.
  const two = { ...wardleyRaw, components: [...wardleyRaw.components.slice(0, 1), comp('User', 10, 90, 'anchor', { evolveTo: 20 }), ...wardleyRaw.components.slice(2)] }
  expect(() => nativeSchemaView(DART[0], 'wardley', two, hooks).getWardleyData().trends).toThrow('unsupported')
  expect(() => ({ ...nativeSchemaView(DART[0], 'wardley', two, hooks).getWardleyData() })).toThrow('unsupported')
  // Stages without boundaries: none and some cannot be told apart.
  const axes = nativeSchemaView(DART[0], 'wardley', { ...wardleyRaw, stageBoundaries: null }, hooks).getWardleyData().axes
  expect(axes.stages).toHaveLength(4)
  expect(() => axes.stageBoundaries).toThrow('unsupported')
  expect(log.at(-1)).toContain('every stage')
  expect(nativeSchemaView(DART[0], 'wardley', { ...wardleyRaw, stages: null, stageBoundaries: null }, hooks).getWardleyData().axes).toEqual({})
})

test('mermaid_core venn, cynefin and ishikawa', () => {
  const { hooks } = verdicts()
  const venn = nativeSchemaView(DART[1], 'venn', {
    sets: ['A', 'B'],
    subsets: [{ sets: ['A'], size: 10, label: 'Alpha' }, { sets: ['B'], size: 10, label: null }, { sets: ['A', 'B'], size: 2.5, label: '' }],
    textNodes: [{ sets: ['A'], id: 't1', label: null }],
    styles: [{ targets: ['A'], styles: new Map([['fill', 'red']]) }],
    title: null,
  }, hooks)
  expect(venn.getSubsetData()).toEqual([{ sets: ['A'], size: 10, label: 'Alpha' }, { sets: ['B'], size: 10, label: undefined }, { sets: ['A', 'B'], size: 2.5, label: undefined }])
  expect(venn.getTextData()).toEqual([{ sets: ['A'], id: 't1', label: undefined }])
  expect(venn.getStyleData()).toEqual([{ targets: ['A'], styles: { fill: 'red' } }])
  expect(venn.getDiagramTitle()).toBe('')
  expect(() => venn.getCurrentSets()).toThrow('unsupported')

  const cynefin = nativeSchemaView(DART[0], 'cynefin', { domains: new Map([['complex', ['Probe', 'Sense']], ['clear', []]]), title: 'C', transitions: [{ from: 'complex', to: 'clear', label: null }, { from: 'clear', to: 'chaotic', label: 'fall' }], accTitle: null, accDescription: 'D' }, hooks)
  expect(cynefin.getDomains()).toEqual(new Map([['complex', { name: 'complex', items: [{ label: 'Probe' }, { label: 'Sense' }] }], ['clear', { name: 'clear', items: [] }]]))
  expect(cynefin.getTransitions()).toEqual([{ from: 'complex', to: 'clear', label: undefined }, { from: 'clear', to: 'chaotic', label: 'fall' }])
  expect([cynefin.getDiagramTitle(), cynefin.getAccTitle(), cynefin.getAccDescription()]).toEqual(['C', '', 'D'])

  const ishikawa = nativeSchemaView(DART[0], 'ishikawa', { root: { text: 'Effect', children: [{ text: 'Cause', children: [{ text: 'Sub', children: [] }] }] } }, hooks)
  expect(ishikawa.getRoot()).toEqual({ text: 'Effect', children: [{ text: 'Cause', children: [{ text: 'Sub', children: [] }] }] })
  expect(ishikawa.getDiagramTitle()).toBe('Effect')
  expect(nativeSchemaView(DART[0], 'ishikawa', { root: null }, hooks).getRoot()).toBeUndefined()
})

test('mermaid_core Treemap AST: class selectors kept; classDefs leave the row list unknown', () => {
  const { hooks } = verdicts()
  const raw = { title: 'T', classes: new Map(), roots: [{ label: 'S', value: 3, isLeafNode: false, cssClass: 'sec', children: [{ label: 'L', value: 3, isLeafNode: true, cssClass: null, children: [] }] }] }
  const ast = nativeAstView(DART[0], 'Treemap', raw, hooks)
  expect(ast.TreemapRows.map((row: any) => [row.item.$type, row.item.name, row.item.classSelector])).toEqual([['Section', 'S', 'sec'], ['Leaf', 'L', undefined]])
  expect(ast.TreemapRows[1].item.value).toBe(3)
  expect(() => ast.TreemapRows[0].indent).toThrow('unsupported')
  expect(() => ast.accTitle).toThrow('unsupported')
  const withClass = nativeAstView(DART[0], 'Treemap', { ...raw, classes: new Map([['c', { fill: null, stroke: null, color: null }]]) }, hooks)
  expect(() => withClass.TreemapRows).toThrow('unsupported')
  expect(withClass.title).toBe('T')
})
