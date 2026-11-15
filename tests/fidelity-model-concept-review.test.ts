import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { nativeAstView, nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'
import { unsupportedKind } from '../unified/mermaid-fidelity/outcome-kinds.ts'
import { bridgeBuiltFromCheckout } from './helpers/bridge-build.ts'

// Views fixed by the model-concept review (docs/evidence/fidelity-model-concept-review-2026-11-14.json).
// Each native model below is the probe output of the installed candidate artifact for the
// source in its comment (scripts/fidelity-probe.ts), trimmed to the fields the test reads.
// Before the review each of these readings was a declared-absent concept (unsupported).
const verdicts = (version?: string) => {
  const log: string[] = []
  return {
    log,
    hooks: {
      version,
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

test('agentic-mermaid 0.5.6 keeps the accessibility description its parse result records (flowchart, ER, gantt, class, radar)', () => {
  const { hooks } = verdicts()
  // flowchart TD / accTitle: ACCTTL / accDescr: ACCDSC / A-->B
  const flow = { kind: 'flowchart', graph: { direction: 'TD', nodes: new Map([['A', { id: 'A', label: 'A', shape: 'rectangle' }], ['B', { id: 'B', label: 'B', shape: 'rectangle' }]]), edges: [], subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map() }, accessibilityTitle: 'ACCTTL', accessibilityDescription: 'ACCDSC' }
  const flowView = nativeSchemaView('adewale/agentic-mermaid', 'flowchart', flow, hooks)
  expect([flowView.getAccTitle(), flowView.getAccDescription()]).toEqual(['ACCTTL', 'ACCDSC'])
  // erDiagram / accTitle: ACCTTL / accDescr: ACCDSC / A ||--o{ B : owns (the editing model: 0.5.6 has no parseErDiagram)
  const er = { kind: 'er', entities: [{ id: 'A', attributes: [] }, { id: 'B', attributes: [] }], relations: [{ from: 'A', to: 'B', leftCard: 'one-only', rightCard: 'zero-or-many', dashed: false, label: 'owns' }], groups: [], statements: [{ kind: 'relation', ref: 0 }], accessibilityTitle: 'ACCTTL', accessibilityDescription: 'ACCDSC' }
  expect(nativeSchemaView('adewale/agentic-mermaid', 'er', er, hooks).getAccDescription()).toBe('ACCDSC')
  // gantt / dateFormat YYYY-MM-DD / accTitle: ACCTTL / accDescr: ACCDSC / section S / T1 :a1, 2024-01-01, 3d
  const gantt = { kind: 'gantt', sections: [{ id: 'section-0', label: 'S', tasks: [{ id: 'task-0', taskId: 'a1', label: 'T1', tags: [], start: '2024-01-01', end: '3d' }] }], accessibilityTitle: 'ACCTTL', accessibilityDescription: 'ACCDSC' }
  const ganttView = nativeSchemaView('adewale/agentic-mermaid', 'gantt', gantt, hooks)
  expect([ganttView.getAccTitle(), ganttView.getAccDescription()]).toEqual(['ACCTTL', 'ACCDSC'])
  // classDiagram / accTitle: ACCTTL / accDescr: ACCDSC / class A
  const cls = nativeSchemaView('adewale/agentic-mermaid', 'class', { kind: 'class', classes: [{ id: 'A', members: [] }], relations: [], notes: [], accessibilityTitle: 'ACCTTL', accessibilityDescription: 'ACCDSC' }, hooks)
  expect([cls.getAccTitle(), cls.getAccDescription()]).toEqual(['ACCTTL', 'ACCDSC'])
  // radar-beta / title RADTTL / accTitle: ACCTTL / accDescr: ACCDSC / axis ... / curve ...
  const radar = nativeAstView('adewale/agentic-mermaid', 'Radar', { kind: 'radar', title: 'RADTTL', axes: [{ id: 'ax1', label: 'AXONE' }], curves: [{ id: 'CRV', label: 'CURVEX', values: [1] }], min: 1, max: 9, ticks: 7, graticule: 'polygon', showLegend: false, accessibilityTitle: 'ACCTTL', accessibilityDescription: 'ACCDSC' }, hooks)
  expect([radar.accTitle, radar.accDescr]).toEqual(['ACCTTL', 'ACCDSC'])
  // Unwritten: no meta.accessibility field, Mermaid's ''.
  expect(nativeSchemaView('adewale/agentic-mermaid', 'flowchart', { ...flow, accessibilityDescription: undefined }, hooks).getAccDescription()).toBe('')
})

test("agentic-mermaid 0.5.6 keeps a class's style statements and an edge's written animate", () => {
  const { hooks, log } = verdicts()
  // classDiagram / class A / style A stroke-width:4px,fill:#f9f,font-size:20px / class B
  const cls = nativeSchemaView('adewale/agentic-mermaid', 'class', { kind: 'class', classes: [{ id: 'A', members: [], style: { 'stroke-width': '4px', fill: '#f9f', 'font-size': '20px' } }, { id: 'B', members: [] }], relations: [], notes: [] }, hooks)
  expect(cls.getClass('A').styles).toEqual(['stroke-width:4px', 'fill:#f9f', 'font-size:20px'])
  expect(cls.getClass('B').styles).toEqual([])
  // classDiagram / class C:::pink / classDef pink fill:#f9f: Mermaid merges the classDef into
  // C's styles in statement order; the model keeps className and classDefs apart.
  const merged = nativeSchemaView('adewale/agentic-mermaid', 'class', { kind: 'class', classes: [{ id: 'C', members: [], className: 'pink' }], relations: [], notes: [], classDefs: { pink: { fill: '#f9f' } } }, hooks)
  expect(() => merged.getClass('C').styles).toThrow('unsupported')
  expect(log.at(-1)).toContain('apart, not the styles list Mermaid merges')
  // The body rows stay raw: still the candidate's unsupported concept.
  expect(() => cls.getClass('A').members).toThrow('unsupported')
  expect(log.at(-1)).toContain('raw rows')
  // flowchart TD / A e1@--> B / e1@{ animate: true } / B --> C
  const graph = { direction: 'TD', nodes: new Map([['A', { id: 'A', label: 'A', shape: 'rectangle' }], ['B', { id: 'B', label: 'B', shape: 'rectangle' }], ['C', { id: 'C', label: 'C', shape: 'rectangle' }]]), edges: [{ source: 'A', target: 'B', id: 'e1', style: 'solid', hasArrowStart: false, hasArrowEnd: true, endMarker: 'arrow', animate: true }, { source: 'B', target: 'C', style: 'solid', hasArrowStart: false, hasArrowEnd: true, endMarker: 'arrow' }], subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map() }
  const edges = nativeSchemaView('adewale/agentic-mermaid', 'flowchart', { kind: 'flowchart', graph }, hooks).getEdges()
  expect(edges[0].animate).toBe(true)
  // `animate: false` is dropped like an unwritten flag: absent for that edge only.
  expect(() => edges[1].animate).toThrow('unsupported')
  expect(log.at(-1)).toContain('records a written animate: false and an unwritten animate the same way')
  // Crafter's MermaidEdge keeps no animate.
  expect(() => nativeSchemaView('crafter-station/mermaid', 'flowchart', { type: 'flowchart', ...graph }, hooks).getEdges()[0].animate).toThrow('unsupported')
})

test('a class statement on a subgraph is read from the native model that records it', () => {
  // flowchart TD / subgraph S1 / A / end / classDef SUBCLS fill:#f00 / class S1 SUBCLS
  const graph = () => ({ direction: 'TD', nodes: new Map([['A', { id: 'A', label: 'A', shape: 'rectangle' }]]), edges: [], subgraphs: [{ id: 'S1', label: 'S1', nodeIds: ['A'], children: [] }, { id: 'S2', label: 'S2', nodeIds: [], children: [] }], classDefs: new Map([['SUBCLS', { fill: '#f00' }]]), classAssignments: new Map([['S1', 'SUBCLS']]), nodeStyles: new Map(), linkStyles: new Map() })
  for (const project of ['dfadler/zombie-mermaid', 'lukilabs/beautiful-mermaid', 'kais-radwan/ascii-mermaid', 'crafter-station/mermaid']) {
    const { hooks } = verdicts()
    const subgraphs = nativeSchemaView(project, 'flowchart', graph(), hooks).getSubGraphs()
    expect(subgraphs.map((group: any) => [group.id, group.classes])).toEqual([['S1', ['SUBCLS']], ['S2', []]])
  }
  const { hooks } = verdicts()
  expect(nativeSchemaView('adewale/agentic-mermaid', 'flowchart', { kind: 'flowchart', graph: graph() }, hooks).getSubGraphs()[0].classes).toEqual(['SUBCLS'])
  // Frankenmermaid 0.5.0: the subgraph's cluster lists its classes (absent when none).
  const ir = {
    diagram_type: 'Flowchart', direction: 'TD',
    nodes: [{ id: 'A', shape: 'Rect', classes: [] }], edges: [], labels: [],
    clusters: [{ id: 0, title: 0, members: [0], classes: ['SUBCLS'] }, { id: 1, title: 0, members: [] }],
    graph: { nodes: [{ node_id: 0 }], edges: [], subgraphs: [{ id: 0, key: 'S1', title: 0, children: [], members: [0], cluster: 0 }, { id: 1, key: 'S2', title: 0, children: [], members: [], cluster: 1 }] },
  }
  expect(nativeSchemaView('Dicklesworthstone/frankenmermaid', 'flowchart', ir, hooks).getSubGraphs().map((group: any) => group.classes)).toEqual([['SUBCLS'], []])
})

test("zombie-mermaid 5.17.0 keeps a sequence title; beautiful-mermaid's parser skips it", () => {
  const { hooks, log } = verdicts()
  // sequenceDiagram / title SEQTTL / A->>B: hi
  const raw = { actors: [{ id: 'A', label: 'A', type: 'participant' }, { id: 'B', label: 'B', type: 'participant' }], messages: [{ from: 'A', to: 'B', label: 'hi', lineStyle: 'solid', arrowHead: 'filled' }], blocks: [], notes: [], activations: [], boxes: [], title: 'SEQTTL' }
  expect(nativeSchemaView('dfadler/zombie-mermaid', 'sequence', raw, hooks).getDiagramTitle()).toBe('SEQTTL')
  expect(nativeSchemaView('dfadler/zombie-mermaid', 'sequence', { ...raw, title: undefined }, hooks).getDiagramTitle()).toBe('')
  expect(() => nativeSchemaView('dfadler/zombie-mermaid', 'sequence', raw, hooks).getAccTitle()).toThrow('unsupported')
  const { activations: _a, boxes: _b, title: _t, ...beautiful } = raw
  expect(() => nativeSchemaView('lukilabs/beautiful-mermaid', 'sequence', beautiful, hooks).getDiagramTitle()).toThrow('unsupported')
  expect(log.at(-1)).toContain('skips title lines')
})

test("zombie-mermaid 5.17.0 class relations: 'link', 'dashed-link' and a dashed lollipop carry their line", () => {
  const { hooks } = verdicts()
  // classDiagram / R2A -- R2B / R3A --> R3B / R8A .. R8B / D3A ()-- D3B / D4A ()..D4B
  const raw = { classes: [], relationships: [
    { from: 'R2A', to: 'R2B', type: 'link', markerAt: 'to' },
    { from: 'R3A', to: 'R3B', type: 'association', markerAt: 'to' },
    { from: 'R8A', to: 'R8B', type: 'dashed-link', markerAt: 'to' },
    { from: 'D3A', to: 'D3B', type: 'lollipop', markerAt: 'from' },
    { from: 'D4A', to: 'D4B', type: 'lollipop', markerAt: 'from', dashed: true },
  ] }
  const view = nativeSchemaView('dfadler/zombie-mermaid', 'class', raw, hooks)
  expect(view.getRelations().map((rel: any) => rel.relation)).toEqual([
    { type1: 'none', type2: 'none', lineType: 0 },
    { type1: 'none', type2: 3, lineType: 0 },
    { type1: 'none', type2: 'none', lineType: 1 },
    { type1: 4, type2: 'none', lineType: 0 },
    { type1: 4, type2: 'none', lineType: 1 },
  ])
})

test('an entity alias is read where the native model keeps it, and Mermaid labels the entity by its name', () => {
  const { hooks, log } = verdicts()
  // erDiagram / p[ALIASX] { string name } / "QUOTED NAME" { int x }
  const dart = { entities: new Map([['p', { id: 'p', label: 'ALIASX', attributes: [{ type: 'string', name: 'name', keys: [], comment: null }], cssStyles: [], cssClasses: [] }], ['QUOTED NAME', { id: 'QUOTED NAME', label: 'QUOTED NAME', attributes: [], cssStyles: [], cssClasses: [] }]]), relationships: [], direction: 'tb', title: null, classDefs: new Map() }
  for (const project of ['orestesgaolin/mermaid', 'pub:mermaid_flutter']) {
    const entities = nativeSchemaView(project, 'er', dart, hooks).getEntities()
    expect([...entities.values()].map((entity: any) => [entity.label, entity.alias])).toEqual([['p', 'ALIASX'], ['QUOTED NAME', '']])
  }
  // zombie-mermaid ErEntity.label: "same as id unless aliased"
  const zombie = { entities: [{ id: 'p', label: 'ALIASX', attributes: [] }, { id: 'q', label: 'q', attributes: [] }], relationships: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map() }
  const entities = nativeSchemaView('dfadler/zombie-mermaid', 'er', zombie, hooks).getEntities()
  expect([...entities.values()].map((entity: any) => [entity.label, entity.alias])).toEqual([['p', 'ALIASX'], ['q', '']])
  // beautiful-mermaid keeps `p[ALIASX]` as the id itself: no alias.
  const beautiful = nativeSchemaView('lukilabs/beautiful-mermaid', 'er', { entities: [{ id: 'p[ALIASX]', label: 'p[ALIASX]', attributes: [] }], relationships: [] }, hooks).getEntities()
  expect(() => [...beautiful.values()][0].alias).toThrow('unsupported')
  expect(log.at(-1)).toContain("beautiful-mermaid's ER entity model keeps no alias")
  // mermaid-ascii's Display is the alias; Mermaid's label is still the name.
  const ascii = nativeSchemaView('AlexanderGrooff/mermaid-ascii', 'er', { Entities: [{ Name: 'p', Display: 'ALIASX', Attributes: [] }], Relationships: [] }, hooks).getEntities()
  expect([...ascii.values()].map((entity: any) => [entity.label, entity.alias])).toEqual([['p', 'ALIASX']])
})

test("zombie-mermaid's state note side is its note edge's direction in the versions that write it", () => {
  // stateDiagram-v2 / [*] --> A / note right of A : NOTETXT / note left of A / NOTEML / end note
  const raw = () => ({
    direction: 'TD',
    nodes: new Map<string, any>([['_start', { id: '_start', label: '', shape: 'state-start' }], ['A----note-2', { id: 'A----note-2', label: 'NOTEML', shape: 'note' }], ['A', { id: 'A', label: 'A', shape: 'rounded' }], ['B', { id: 'B', label: 'B', shape: 'rounded' }], ['B----note-1', { id: 'B----note-1', label: 'NOTETXT', shape: 'note' }]]),
    edges: [{ source: '_start', target: 'A', style: 'solid', hasArrowStart: false, hasArrowEnd: true }, { source: 'B', target: 'B----note-1', style: 'dotted', hasArrowStart: false, hasArrowEnd: false }, { source: 'A----note-2', target: 'A', style: 'dotted', hasArrowStart: false, hasArrowEnd: false }],
    subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map(), interactions: new Map(),
  })
  const states = nativeSchemaView('dfadler/zombie-mermaid', 'state', raw(), verdicts('5.17.0').hooks).getStates()
  expect(states.get('A').note).toEqual({ position: 'left of', text: 'NOTEML' })
  expect(states.get('B').note).toEqual({ position: 'right of', text: 'NOTETXT' })
  // 5.14.4 joined every note state -> note: the side is still not recorded there.
  const old = verdicts('5.14.4')
  expect(() => nativeSchemaView('dfadler/zombie-mermaid', 'state', raw(), old.hooks).getStates().get('B').note.position).toThrow('unsupported')
  expect(old.log.at(-1)).toContain('drops the side')
})

// Bezel's AgentflowDb::emit_warning/emit_error (db.rs:781, :785) are no longer a view-level
// verdict: the stateful Bezel bridge runs them on Bezel's own model, so the agentflow view
// declares nothing for them (tests/fidelity-native-bindings.test.ts covers the binding).
test("Bezel's agentflow view leaves emitWarning and emitError to the bridged database", () => {
  const { hooks } = verdicts('0.2.26')
  const raw = { vertices: {}, edges: [], subGraphs: [], connectors: [], classes: {}, tooltips: {}, elementMappings: [], diagnostics: [], direction: 'TB' }
  const view = nativeSchemaView('crabtalk/bezel', 'agentflow', raw, hooks)
  expect(view.emitWarning).toBeUndefined()
  expect(view.emitError).toBeUndefined()
})

// fasouto/termaid: a family termaid has no parser for is answered by its public
// termaid.parse(), which reads anything but a state diagram as a flowchart.
const termaidBridge = resolve(import.meta.dirname, '../unified/mermaid-fidelity/bridges/termaid.py')
const python = ['python3', 'python'].find(command => spawnSync(command, ['--version']).status === 0)
test.skipIf(!python)("the termaid bridge reports termaid.parse()'s own dispatch for a family it has no parser for", () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-termaid-'))
  try {
    mkdirSync(join(root, 'termaid', 'parser'), { recursive: true })
    writeFileSync(join(root, 'termaid', 'parser', '__init__.py'), '')
    writeFileSync(join(root, 'termaid', 'parser', 'piechart.py'), 'def parse_pie_chart(text):\n    return {"slices": []}\n')
    writeFileSync(join(root, 'termaid', '__init__.py'), [
      'def parse_flowchart(text):', '    return {"kind": "graph"}',
      'def parse_state_diagram(text):', '    return {"kind": "graph"}',
      'def parse(source, *, partial=False):', '    return parse_state_diagram(source) if source.startswith("stateDiagram") else parse_flowchart(source)', '',
    ].join('\n'))
    // The bridge file is itself named termaid.py: run a copy beside the stand-in package, as
    // the real bridge runs isolated (-I) beside termaid's own venv.
    copyFileSync(termaidBridge, join(root, 'bridge.py'))
    const run = (family: string, source: string) => {
      const child = spawnSync(python!, ['-B', join(root, 'bridge.py')], { input: JSON.stringify({ family, source }), encoding: 'utf8', timeout: 10000 })
      expect(child.status).toBe(0)
      return JSON.parse(child.stdout)
    }
    expect(run('radar', 'radar-beta\naxis a')).toEqual({ unsupported: 'termaid parsed this source as flowchart, not radar', native: true })
    expect(run('requirement', 'stateDiagram-v2\nA-->B')).toEqual({ unsupported: 'termaid parsed this source as state, not requirement', native: true })
    expect(run('pie', 'pie\n"A": 1')).toEqual({ value: { slices: [] } })
    // Mermaid's cross-family request is not a family termaid could parse.
    expect(run('<shared>', 'info')).toEqual({ unsupported: 'termaid has no <shared> parser' })
    // Both verdicts count as the candidate's own observation, not a capability assessment.
    expect(unsupportedKind('termaid parsed this source as flowchart, not radar', 'native')).toBe('native')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

// 1jehuang/mermaid-rs-renderer: the bridge built from this source (bridges/mmdr/build.ts).
const mmdrBridge = bridgeBuiltFromCheckout('mmdr', '1jehuang-mermaid-rs-renderer', 'mmdr-bridge')
test.skipIf(!mmdrBridge)("the mmdr bridge reports parse_mermaid's own result for a family its DiagramKind has no variant for", () => {
  const run = (family: string, source: string) => JSON.parse(spawnSync(mmdrBridge!, [], { input: JSON.stringify({ family, source }), encoding: 'utf8', timeout: 10000 }).stdout)
  const railroad = run('railroad', 'railroad-beta\nexpression = terminal("a") ;')
  expect(railroad).toEqual({ unsupported: 'mmdr detected this source as Flowchart, not railroad' })
  expect(unsupportedKind(railroad.unsupported, 'bridge')).toBe('native')
  const info = run('info', 'info')
  expect(info).toEqual({ unsupported: 'unknown or missing Mermaid diagram header' })
  expect(unsupportedKind(info.unsupported, 'bridge')).toBe('native')
  expect(run('<shared>', 'info').unsupported).toContain('has no <shared> parser')
  expect(run('flowchart', 'flowchart TD\nA-->B').value.kind).toBe('Flowchart')
})
