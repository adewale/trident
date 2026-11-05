import { expect, test } from 'bun:test'
import { nativeAstView, nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// Frankenmermaid 0.4.0 parse() IR, captured with scripts/fidelity-probe.ts and trimmed to
// the fields the views read (spans, guard metadata and render hints removed).
const PROJECT = 'Dicklesworthstone/frankenmermaid'
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
const labels = (...texts: string[]) => texts.map(text => ({ text }))
const edge = (from: number, to: number, arrow: string, label: number | null = null, extras: unknown = null) => ({ from: { Node: from }, to: { Node: to }, arrow, label, extras })

// sequenceDiagram / box Group 1 (a, b) / box aqua (c) / box rgb(1,2,3) Name X (d) /
// alt outer { a->>b: 1; loop inner { Note over a,b: in; b->>a: 2 } else other: a->>c: 3 } /
// Note over a: last
const sequence = {
  diagram_type: 'Sequence',
  nodes: ['a', 'b', 'c', 'd'].map((id, label) => ({ id, label, classes: ['sequence-participant'] })),
  edges: [edge(0, 1, 'Arrow', 4), edge(1, 0, 'Arrow', 5), edge(0, 2, 'Arrow', 6)],
  labels: labels('a', 'b', 'c', 'd', '1', '2', '3'),
  sequence_meta: {
    autonumber: false,
    notes: [
      { position: 'Over', participants: [0, 1], text: 'in', after_edge: 0 },
      { position: 'Over', participants: [0], text: 'last', after_edge: 2 },
    ],
    fragments: [
      { kind: 'Loop', label: 'inner', start_edge: 1, end_edge: 1, alternatives: [], children: [] },
      { kind: 'Alt', label: 'outer', start_edge: 0, end_edge: 2, alternatives: [{ label: 'other', start_edge: 2, end_edge: 2 }], children: [0] },
    ],
    participant_groups: [
      { label: 'Group 1', participants: [0, 1] },
      { label: '', color: 'aqua', participants: [2] },
      { label: 'Name X', color: 'rgb(1,2,3)', participants: [3] },
    ],
    timeline: ['Open', 'Message', 'Open', 'Note', 'Message', 'Close', 'Else', 'Message', 'Close', 'Note'],
  },
}

test('sequence: the flat message list is rebuilt from the timeline in Mermaid line types', () => {
  const { hooks } = verdicts()
  const db = nativeSchemaView(PROJECT, 'sequence', sequence, hooks)
  const L = db.LINETYPE
  expect(db.getMessages().map((m: any) => [m.from, m.to, m.message, m.type])).toEqual([
    [undefined, undefined, 'outer', L.ALT_START],
    ['a', 'b', '1', L.SOLID],
    [undefined, undefined, 'inner', L.LOOP_START],
    ['a', 'b', 'in', L.NOTE],
    ['b', 'a', '2', L.SOLID],
    [undefined, undefined, '', L.LOOP_END],
    [undefined, undefined, 'other', L.ALT_ELSE],
    ['a', 'c', '3', L.SOLID],
    [undefined, undefined, '', L.ALT_END],
    ['a', 'a', 'last', L.NOTE],
  ])
  expect(db.getMessages()[3].placement).toBe(db.PLACEMENT.OVER)
  expect(db.getMessages().map((m: any) => m.id)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
})

test('sequence: participants, boxes and the half-arrow vocabulary', () => {
  const { hooks } = verdicts()
  const db = nativeSchemaView(PROJECT, 'sequence', sequence, hooks)
  const a = db.getActors().get('a')
  expect([a.name, a.description, a.type, a.prevActor, a.nextActor, a.box.name]).toEqual(['a', 'a', 'participant', undefined, 'b', 'Group 1'])
  expect(db.getActorKeys()).toEqual(['a', 'b', 'c', 'd'])
  expect(db.getBoxes().map((b: any) => [b.name, b.fill, b.actorKeys])).toEqual([
    ['Group 1', 'transparent', ['a', 'b']],
    [undefined, 'aqua', ['c']],
    ['Name X', 'rgb(1,2,3)', ['d']],
  ])
  const typed = {
    diagram_type: 'Sequence',
    nodes: [
      { id: 'A', label: 0, classes: ['sequence-participant'], menu_links: [{ label: 'Dash', url: 'https://x' }] },
      { id: 'B', label: 1, classes: ['sequence-participant', 'sequence-participant-actor', 'sequence-actor'] },
      { id: 'C', label: null, classes: [] },
    ],
    edges: [edge(0, 1, 'HalfArrowTop'), edge(1, 2, 'StickArrowBottomReverseDotted', 2), edge(0, 2, 'OpenArrow')],
    labels: labels('Alice', 'B', 'x'),
    sequence_meta: null,
  }
  const view = nativeSchemaView(PROJECT, 'sequence', typed, hooks)
  expect([...view.getActors().values()].map((actor: any) => [actor.description, actor.type, actor.links])).toEqual([
    ['Alice', 'participant', { Dash: 'https://x' }],
    ['B', 'actor', {}],
    ['C', 'participant', {}],
  ])
  expect(view.getMessages().map((m: any) => m.type)).toEqual([41, 58, 24])
})

test('sequence: what the IR does not record is unsupported', () => {
  const { hooks, log } = verdicts()
  const db = nativeSchemaView(PROJECT, 'sequence', sequence, hooks)
  expect(() => db.getMessages()[1].wrap).toThrow('unsupported')
  expect(log.at(-1)).toContain('wrap')
  expect(() => db.getActors().get('a').properties).toThrow('unsupported')
  // par and par_over are the same Par fragment: only the start's type is ambiguous.
  const par = { ...sequence, sequence_meta: { timeline: ['Open', 'Message', 'Close'], fragments: [{ kind: 'Par', label: 'p', alternatives: [], children: [] }] }, edges: [edge(0, 1, 'Arrow', 4)] }
  const view = nativeSchemaView(PROJECT, 'sequence', par, hooks)
  expect(() => view.getMessages()[0].type).toThrow('unsupported')
  expect(view.getMessages()[2].type).toBe(view.LINETYPE.PAR_END)
  const activated = { ...sequence, sequence_meta: { ...sequence.sequence_meta, activations: [{ participant: 1, start_edge: 0, end_edge: 2, depth: 0 }] } }
  expect(() => nativeSchemaView(PROJECT, 'sequence', activated, hooks).getMessages()).toThrow('unsupported')
  expect(log.at(-1)).toContain('activations')
})

// stateDiagram-v2 with direction LR, a classDef, [*] --> State1, a labelled transition,
// a two-line description, a composite with its own start/end, fork, choice, a note, a
// class and a style statement.
const state = {
  diagram_type: 'State',
  direction: 'LR',
  nodes: [
    { id: '__state_start', label: null, shape: 'FilledCircle', classes: [] },
    { id: 'State1', label: 2, shape: 'Rounded', classes: [] },
    { id: 'State2', label: null, shape: 'Rect', classes: ['exampleStyleClass'] },
    { id: 'LN', label: 3, shape: 'Rounded', classes: [] },
    { id: 'Active', label: 4, shape: 'Rounded', classes: [] },
    { id: '__state_start__state_Active', label: null, shape: 'FilledCircle', classes: [] },
    { id: 'Idle', label: null, shape: 'Rect', classes: [] },
    { id: '__state_end__state_Active', label: null, shape: 'DoubleCircle', classes: [] },
    { id: 'fork1', label: null, shape: 'HorizontalBar', classes: [] },
    { id: 'ch', label: null, shape: 'Diamond', classes: [] },
    { id: '__state_end', label: null, shape: 'DoubleCircle', classes: [] },
  ],
  edges: [edge(0, 1, 'Arrow'), edge(1, 2, 'Arrow', 0), edge(5, 6, 'Arrow'), edge(6, 7, 'Arrow'), edge(2, 10, 'Arrow')],
  labels: labels('Transition 1', 'this is a string', 'this is a string\nanother', 'Long name', 'Active'),
  graph: { subgraphs: [{ key: 'Active', members: [5, 6, 7], children: [] }] },
  style_refs: [
    { target: { Class: 'exampleStyleClass' }, style: 'background:#bbb,border:1px solid red' },
    { target: { Node: 3 }, style: 'fill:#f00' },
  ],
  state_notes: [{ target: 'State1', position: 'right', text: 'a note' }],
}

test('state: the root document, pseudo-state ids, classes, styles and notes', () => {
  const { hooks, log } = verdicts()
  const db = nativeSchemaView(PROJECT, 'state', state, hooks)
  const states = db.getStates()
  expect([...states.keys()]).toEqual(['root_start', 'State1', 'State2', 'LN', 'Active', 'fork1', 'ch', 'root_end'])
  expect([states.get('root_start').type, states.get('root_end').type, states.get('ch').type, states.get('State2').type]).toEqual(['start', 'end', 'choice', 'default'])
  expect(states.get('State2').classes).toEqual(['exampleStyleClass'])
  expect(states.get('LN').styles).toEqual(['fill:#f00'])
  expect(states.get('State1').note).toEqual({ position: 'right of', text: 'a note' })
  expect(states.get('State1').doc).toBeUndefined()
  expect(db.getRelations().map((r: any) => [r.id1, r.id2, r.relationTitle])).toEqual([
    ['root_start', 'State1', ''],
    ['State1', 'State2', 'Transition 1'],
    ['State2', 'root_end', ''],
  ])
  expect(db.getClasses().get('exampleStyleClass').styles).toEqual(['background:#bbb', 'border:1px solid red'])
  expect(db.getDirection()).toBe('LR')
  expect(() => states.get('State1').descriptions).toThrow('unsupported')
  expect(() => states.get('fork1').type).toThrow('unsupported')
  expect(log.at(-1)).toContain('fork and join')
  expect(() => states.get('Active').doc).toThrow('unsupported')
})

test('state: a transition inside one composite cannot be placed in a document', () => {
  const { hooks, log } = verdicts()
  const inner = { ...state, nodes: [...state.nodes, { id: 'Busy', label: null, shape: 'Rect', classes: [] }], edges: [...state.edges, edge(6, 11, 'Arrow')], graph: { subgraphs: [{ key: 'Active', members: [5, 6, 7, 11], children: [] }] } }
  expect(() => nativeSchemaView(PROJECT, 'state', inner, hooks).getStates()).toThrow('unsupported')
  expect(log.at(-1)).toContain('document it was written in')
})

// C4Context with persons, systems in nested boundaries, containers, Rel, BiRel, Rel_U and Rel_Back.
const c4 = {
  diagram_type: 'C4Context',
  meta: { title: 'Context' },
  nodes: [
    { id: 'customerA', label: 0, c4_meta: { element_type: 'person', description: 'A customer' } },
    { id: 'SystemB', label: 1, c4_meta: { element_type: 'system', description: 'desc B' } },
    { id: 'SystemC', label: 2, c4_meta: { element_type: 'system_queue' } },
    { id: 'c1', label: 3, c4_meta: { element_type: 'container', technology: 'Java', description: 'desc c' } },
    { id: 'b9', label: 4 },
  ],
  edges: [edge(0, 1, 'DoubleArrow', 5), edge(1, 2, 'Arrow', 6, { c4_direction: 'Up' }), edge(3, 2, 'Arrow', 7, { technology: 'tech' })],
  labels: labels('Customer', 'B', 'C', 'Cont', 'b9', 'Sync', 'Up', 'Back'),
  graph: { subgraphs: [{ key: 'b0', title: 4, parent: null, members: [1, 2], cluster: 0 }, { key: 'b1', title: 4, parent: 0, members: [2], cluster: 1 }] },
  clusters: [{ c4_boundary_type: 'ENTERPRISE' }, { c4_boundary_type: 'system' }],
}

test('C4: shapes, boundaries and the relations whose direction is recorded', () => {
  const { hooks, log } = verdicts()
  const db = nativeSchemaView(PROJECT, 'c4', c4, hooks)
  expect(db.getC4ShapeArray().map((s: any) => [s.alias, s.label.text, s.descr.text, s.typeC4Shape.text, s.parentBoundary])).toEqual([
    ['customerA', 'Customer', 'A customer', 'person', 'global'],
    ['SystemB', 'B', 'desc B', 'system', 'b0'],
    ['SystemC', 'C', '', 'system_queue', 'b1'],
    ['c1', 'Cont', 'desc c', 'container', 'global'],
  ])
  expect(db.getC4Shape('c1').techn).toEqual({ text: 'Java' })
  expect(db.getBoundaries().map((b: any) => [b.alias, b.type.text, b.parentBoundary])).toEqual([
    ['global', 'global', ''],
    ['b0', 'ENTERPRISE', 'global'],
    ['b1', 'system', 'b0'],
  ])
  const rels = db.getRels()
  expect([rels[0].type, rels[0].from, rels[0].to, rels[1].type]).toEqual(['birel', 'customerA', 'SystemB', 'rel_u'])
  expect(rels[2].techn).toEqual({ text: 'tech' })
  expect(() => rels[2].from).toThrow('unsupported')
  expect(log.at(-1)).toContain('Rel_Back')
  expect(() => rels[0].label).toThrow('unsupported')
  expect(() => db.getC4ShapeArray()[0].sprite).toThrow('unsupported')
  expect([db.getC4Type(), db.getTitle()]).toEqual(['C4Context', 'Context'])
})

// gitGraph LR: commit id "A" tag "v1" type HIGHLIGHT, commit, branch develop, commit msg,
// commit type REVERSE, merge develop, branch feat + commit "F", cherry-pick "F".
const gitgraph = {
  diagram_type: 'GitGraph',
  direction: 'LR',
  nodes: [
    { id: 'A', label: 0, classes: ['git-commit-highlight', 'git-branch-0'] },
    { id: 'commit_1', label: null, classes: ['git-branch-0'] },
    { id: 'commit_2', label: 1, classes: ['git-branch-2'] },
    { id: 'commit_3', label: null, classes: ['git-commit-reverse', 'git-branch-2'] },
    { id: 'M', label: 2, classes: ['git-branch-0'] },
    { id: 'F', label: null, classes: ['git-branch-1'] },
    { id: 'commit_4', label: 4, classes: ['git-branch-0'] },
  ],
  edges: [edge(0, 1, 'Line'), edge(1, 2, 'Line'), edge(2, 3, 'Line'), edge(3, 4, 'DottedArrow', 3), edge(1, 4, 'Line'), edge(4, 5, 'Line'), edge(4, 6, 'Line')],
  labels: labels('A [v1]', 'commit_2 dev', 'M [t2]', 'merge develop', 'cherry-pick F'),
  git_graph_meta: { branches: ['main', 'feat', 'develop'], commit_lanes: { 0: 0, 1: 0, 2: 2, 3: 2, 4: 0, 5: 1, 6: 0 } },
}

test('git graph: commits, merges and branch heads; checkouts are not recorded', () => {
  const { hooks, log } = verdicts()
  const db = nativeSchemaView(PROJECT, 'gitgraph', gitgraph, hooks)
  const commits = db.getCommits()
  const T = db.commitType
  expect([...commits.keys()]).toEqual(['A', 'commit_1', 'commit_2', 'commit_3', 'M', 'F', 'commit_4'])
  expect([commits.get('A').type, commits.get('commit_1').type, commits.get('commit_3').type, commits.get('M').type]).toEqual([T.HIGHLIGHT, T.NORMAL, T.REVERSE, T.MERGE])
  expect(commits.get('M').parents).toEqual(['commit_1', 'commit_3'])
  expect([commits.get('commit_3').branch, commits.get('F').branch, commits.get('commit_1').message, commits.get('commit_1').tags]).toEqual(['develop', 'feat', '', []])
  expect(() => commits.get('A').message).toThrow('unsupported')
  expect(log.at(-1)).toContain('display label')
  expect(() => commits.get('commit_4').type).toThrow('unsupported')
  const branches = db.getBranches()
  expect([branches.size, branches.get('develop'), branches.get('main'), branches.get('feat')]).toEqual([3, 'commit_3', 'commit_4', 'F'])
  expect(() => [...branches.keys()]).toThrow('unsupported')
  expect(db.getBranchesAsObjArray()).toEqual([{ name: 'main' }, { name: 'feat' }, { name: 'develop' }])
  expect(() => db.getCurrentBranch()).toThrow('unsupported')
  expect(db.getDirection()).toBe('LR')
})

test('pie, journey, requirement, ishikawa and mindmap translate their own blocks', () => {
  const { hooks } = verdicts()
  const pie = nativeSchemaView(PROJECT, 'pie', { diagram_type: 'Pie', meta: { title: 'Pets' }, pie_meta: { title: 'Pets', show_data: true, slices: [{ label: 'Dogs', value: 386 }, { label: 'Dogs', value: 1 }, { label: 'Cats', value: 85.5 }] } }, hooks)
  expect([...pie.getSections()]).toEqual([['Dogs', 386], ['Cats', 85.5]])
  expect([pie.getShowData(), pie.getDiagramTitle(), pie.getAccTitle()]).toEqual([true, 'Pets', ''])

  const journey = nativeSchemaView(PROJECT, 'journey', {
    diagram_type: 'Journey',
    nodes: [
      { id: 'A_task', label: 1, classes: ['journey-step', 'journey-score-5', 'journey-actor'], journey_meta: { actors: ['Alice', 'Bob'] } },
      { id: 'P_task', label: 3, classes: ['journey-step', 'journey-score-3'] },
    ],
    edges: [], labels: labels('Docs', 'A task', 'Other', 'P task'),
    graph: { subgraphs: [{ key: 'journey-section-Docs', title: 0, members: [0] }, { key: 'journey-section-Other', title: 2, members: [1] }] },
  }, hooks)
  expect(journey.getTasks().map((t: any) => ({ ...t }))).toEqual([
    { section: 'Docs', type: 'Docs', people: ['Alice', 'Bob'], task: 'A task', score: 5 },
    { section: 'Other', type: 'Other', people: [], task: 'P task', score: 3 },
  ])

  const requirement = nativeSchemaView(PROJECT, 'requirement', {
    diagram_type: 'Requirement', direction: 'TB',
    nodes: [
      { id: 'r', classes: ['important'], requirement_meta: { requirement_type: 'functionalRequirement', req_id: '1.1', text: 'second', risk: 'high', verify_method: 'inspection' } },
      { id: 'e', classes: [], requirement_meta: { requirement_type: 'element', element_type: 'simulation', doc_ref: 'reqs/e' } },
    ],
    edges: [edge(1, 0, 'Arrow', 0)], labels: labels('<<satisfies>>'),
    style_refs: [{ target: { Class: 'important' }, style: 'fill:#f96,color:red' }],
  }, hooks)
  const r = requirement.getRequirements().get('r')
  expect([r.type, r.requirementId, r.risk, r.verifyMethod, r.classes]).toEqual(['Functional Requirement', '1.1', 'High', 'Inspection', ['default', 'important']])
  const e = requirement.getElements().get('e')
  expect([e.type, e.docRef, e.cssStyles]).toEqual(['simulation', 'reqs/e', []])
  expect(requirement.getRelationships().map((x: any) => [x.src, x.dst])).toEqual([['e', 'r']])
  expect(() => requirement.getRelationships()[0].type).toThrow('unsupported')
  expect(() => r.cssStyles).toThrow('unsupported')
  expect(requirement.getClasses().get('important')).toEqual({ id: 'important', styles: ['fill:#f96', 'color:red'], textStyles: ['color:red'] })

  const ishikawa = nativeSchemaView(PROJECT, 'ishikawa', {
    diagram_type: 'Ishikawa',
    nodes: [{ id: 'effect', label: 0, classes: ['ishikawa-head'] }, { id: 'cause_1', label: 1, classes: ['ishikawa-cause'] }, { id: 'cause_2', label: 2, classes: ['ishikawa-sub-cause'] }],
    edges: [edge(1, 0, 'Arrow'), edge(2, 1, 'Arrow')], labels: labels('Blurry Photo', 'Process', 'Out of focus'),
  }, hooks)
  expect(JSON.parse(JSON.stringify(ishikawa.getRoot()))).toEqual({ text: 'Blurry Photo', children: [{ text: 'Process', children: [{ text: 'Out of focus', children: [] }] }] })

  const mindmap = nativeSchemaView(PROJECT, 'mindmap', {
    diagram_type: 'Mindmap',
    nodes: [
      { id: 'root', label: 0, shape: 'Circle', classes: ['mindmap-root', 'mindmap-branch-0'] },
      { id: 'C', label: 1, shape: 'Hexagon', classes: ['mindmap-branch-2'], interaction: { icon: 'fa fa-book' } },
      { id: 'E', shape: 'Rect', classes: ['mindmap-branch-4', 'mindmap-no-border', 'urgent', 'large'] },
    ],
    edges: [edge(0, 1, 'Line'), edge(0, 2, 'Line')], labels: labels('Root', 'Hex'),
  }, hooks)
  const mm = mindmap.getMindmap()
  expect([mm.nodeId, mm.descr, mm.type, mm.children.map((c: any) => [c.nodeId, c.descr, c.type, c.icon, c.class])]).toEqual(['root', 'Root', 3, [['C', 'Hex', 6, 'fa fa-book', undefined], ['E', 'E', 0, undefined, 'urgent large']]])
  expect(() => mm.level).toThrow('unsupported')
})

test('ASTs: radar, tree view, architecture and git graph', () => {
  const { hooks, log } = verdicts()
  const radar = nativeAstView(PROJECT, 'Radar', {
    diagram_type: 'Radar',
    meta: { title: 'My Title', acc_title: 'AT' },
    radar_meta: { axes: [{ id: 'ax1', label: 'Axis One' }, { id: 'ax2' }], curves: [{ id: 'c1', label: 'Curve One', values: [] }, { id: 'c2', values: [3, 4] }], graticule: 'circle', show_legend: true },
  }, hooks)
  expect([radar.$type, radar.title, radar.accTitle, radar.accDescr]).toEqual(['Radar', 'My Title', 'AT', undefined])
  expect(radar.axes.map((a: any) => [a.$type, a.name, a.label])).toEqual([['Axis', 'ax1', 'Axis One'], ['Axis', 'ax2', undefined]])
  expect(radar.curves[1].entries.map((e: any) => [e.$type, e.value, e.axis])).toEqual([['Entry', 3, undefined], ['Entry', 4, undefined]])
  expect(() => radar.options).toThrow('unsupported')
  expect(log.at(-1)).toContain('defaults')

  const tree = nativeAstView(PROJECT, 'TreeView', {
    diagram_type: 'TreeView',
    meta: { title: 'TV' },
    nodes: [{ id: 'root', label: 0, classes: ['tree-view-root'] }, { id: 'entry_1', label: 1, classes: ['tree-view-node'] }, { id: 'entry_2', label: 2, classes: ['tree-view-node'] }],
    edges: [edge(0, 1, 'Line'), edge(1, 2, 'Line')], labels: labels('/', 'docs', 'a.md'),
  }, hooks)
  expect(tree.nodes.map((n: any) => n.name)).toEqual(['docs', 'a.md'])
  expect(() => tree.nodes[0].indent).toThrow('unsupported')

  const arch = nativeAstView(PROJECT, 'Architecture', {
    diagram_type: 'ArchitectureBeta',
    meta: { title: 'Arch' },
    nodes: [
      { id: 'db', label: 1, classes: ['architecture', 'architecture-service'], interaction: { icon: 'database' } },
      { id: 'plain', label: 2, classes: ['architecture', 'architecture-service'] },
      { id: 'j1', label: 3, classes: ['architecture', 'architecture-junction'] },
    ],
    edges: [], labels: labels('API', 'Database', 'plain', 'j1'),
    graph: { subgraphs: [{ key: 'api', title: 0, children: [], members: [0, 2] }] },
  }, hooks)
  const [db, plain] = arch.services
  expect([db.id, db.title, db.icon, db.in, plain.id, plain.icon, plain.in]).toEqual(['db', 'Database', 'database', 'api', 'plain', undefined, undefined])
  // A service written without a title is labelled with its id.
  expect(() => plain.title).toThrow('unsupported')
  expect(arch.junctions.map((j: any) => [j.id, j.in])).toEqual([['j1', 'api']])
  expect(arch.groups.map((g: any) => [g.id, g.title])).toEqual([['api', 'API']])

  const git = nativeAstView(PROJECT, 'GitGraph', { ...gitgraph, meta: { acc_title: 'Graph' } }, hooks)
  expect(git.accTitle).toBe('Graph')
  expect(() => git.statements).toThrow('unsupported')
})

test('a family Frankenmermaid does not recognise is unsupported, not read from its fallback IR', () => {
  const { hooks, log } = verdicts()
  const fallback = { diagram_type: 'Flowchart', nodes: [{ id: 'agentflow', label: null, shape: 'Rect', classes: [] }], edges: [], labels: [] }
  const db = nativeSchemaView(PROJECT, 'agentflow', fallback, hooks)
  expect(() => db.whole.getData()).toThrow('unsupported')
  expect(log.at(-1)).toContain('does not recognise agentflow')
  expect(() => nativeAstView(PROJECT, 'Railroad', fallback, hooks)).toThrow('unsupported')
  // A view never reads another family's IR: a Sequence IR answers no state getters.
  expect(nativeSchemaView(PROJECT, 'state', sequence, hooks)).toBeUndefined()
})
