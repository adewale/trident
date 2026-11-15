import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { nativeAstView, nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'
import { projectPublicDatabase } from '../unified/upstream-fidelity-projection.mjs'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-views-zombie-')

test('the zombie bridge binds the text parsers from 5.17.0 on and keeps sankey a Trident gap', () => {
  const bridge = resolve(import.meta.dirname, '../unified/mermaid-fidelity/bridges/javascript.mjs')
  const install = (version: string, parsers: string) => {
    const modules = join(temporary.dir(), 'node_modules'), scope = join(modules, '@zombie-mermaid')
    mkdirSync(join(modules, 'zombie-mermaid'), { recursive: true })
    mkdirSync(join(scope, 'core/dist'), { recursive: true })
    mkdirSync(join(scope, 'mermaid-parser/dist'), { recursive: true })
    writeFileSync(join(scope, 'core/dist/index.js'), 'export const splitStatements = text => text.split("\\n")')
    writeFileSync(join(scope, 'mermaid-parser/package.json'), JSON.stringify({ name: '@zombie-mermaid/mermaid-parser', version, type: 'module' }))
    writeFileSync(join(scope, 'mermaid-parser/dist/index.js'), parsers)
    return (family: string) => {
      const child = spawnSync(process.execPath, [bridge, 'zombie', join(modules, 'zombie-mermaid')], { input: JSON.stringify({ family, source: 'gitGraph\ncommit' }), encoding: 'utf8', timeout: 5000 })
      expect(child.status).toBe(0)
      return JSON.parse(child.stdout)
    }
  }
  const parsers = 'export const parseMermaid = () => ({}); export const parseGitGraph = (...args) => ({ args }); export const parseGantt = (...args) => ({ args }); export const parseSankey = () => ({})'
  const current = install('5.17.0', parsers)
  // Called with the source alone (parseGantt keeps its own default date).
  expect(current('gitgraph')).toEqual({ value: { args: ['gitGraph\ncommit'] } })
  expect(current('gantt')).toEqual({ value: { args: ['gitGraph\ncommit'] } })
  expect(current('sankey').adapterGap).toBe('zombie-mermaid exports parseSankey for sankey, which has no reviewed Trident binding')
  expect(current('radar').adapterGap).toBe('zombie-mermaid no longer exports its radar parser')
  const earlier = install('5.16.0', parsers)
  expect(earlier('gitgraph').adapterGap).toBe('zombie-mermaid exports parseGitGraph for gitgraph, which has no reviewed Trident binding')
  expect(install('5.14.4', 'export const parseMermaid = () => ({})')('gitgraph').unsupported).toContain('has no gitgraph parser')
})

// zombie-mermaid 5.17.0 views for the families its mermaid-parser exports text parsers for
// (parseGitGraph, parseRadar, parsePacket, parseKanban, parseMindmap, parseTimeline,
// parseJourney, parseGantt, parseRequirementDiagram). Each native model below is the output
// of the installed 5.17.0 parser for the source in its comment, as the bridge hands it over
// (Maps kept), trimmed only of config the views do not read.
const PROJECT = 'dfadler/zombie-mermaid'
const verdicts = () => {
  const log: string[] = []
  return {
    log,
    hooks: {
      version: '5.17.0',
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
const view = (family: string, raw: unknown) => {
  const { hooks, log } = verdicts()
  return { view: nativeSchemaView(PROJECT, family, raw, hooks), log }
}

// gitGraph TB: / accTitle: T / commit id:"A" tag:"v1" type:HIGHLIGHT / branch develop order: 2 /
// branch empty / checkout develop / commit msg:"hi" / commit id:"B" / checkout main /
// merge develop id:"M" type:REVERSE tag:"r" / branch x / checkout x / cherry-pick id:"B" /
// checkout main / merge x
const gitRaw = {
  direction: 'TB',
  branches: ['main', 'empty', 'x', 'develop'],
  commits: [
    { id: 'A', message: '', seq: 0, type: 'HIGHLIGHT', tags: ['v1'], parents: [], branch: 'main' },
    { id: '1-f47a74e', message: 'hi', seq: 1, type: 'NORMAL', tags: [], parents: ['A'], branch: 'develop' },
    { id: 'B', message: '', seq: 2, type: 'NORMAL', tags: [], parents: ['1-f47a74e'], branch: 'develop' },
    { id: 'M', message: 'merged branch develop into main', seq: 3, parents: ['A', 'B'], branch: 'main', type: 'MERGE', tags: ['r'], customType: 'REVERSE', customId: true },
    { id: '4-1e8b36b', message: 'cherry-picked  into x', seq: 4, parents: ['M', 'B'], branch: 'x', type: 'CHERRY_PICK', tags: ['cherry-pick:B'] },
    { id: '5-f50b3a2', message: 'merged branch x into main', seq: 5, parents: ['M', '4-1e8b36b'], branch: 'main', type: 'MERGE', tags: [] },
  ],
  config: { mainBranchName: 'main', mainBranchOrder: 0 },
}

test('zombie-mermaid git graph: commits, merge fields by omission, drawing order and derived heads', () => {
  const { view: git, log } = view('gitgraph', gitRaw)
  const commits = git.getCommits()
  expect([...commits.keys()]).toEqual(['A', '1-f47a74e', 'B', 'M', '4-1e8b36b', '5-f50b3a2'])
  expect(commits.get('A').type).toBe(2)
  expect(commits.get('A').tags).toEqual(['v1'])
  expect(commits.get('1-f47a74e').message).toBe('hi')
  // A merge with a written type and id; the second merge wrote neither.
  expect([commits.get('M').type, commits.get('M').customType, commits.get('M').customId]).toEqual([3, 1, true])
  expect([commits.get('5-f50b3a2').customType, commits.get('5-f50b3a2').customId]).toEqual([undefined, false])
  // A cherry-pick is Mermaid's CHERRY_PICK commit, with no merge fields.
  expect(commits.get('4-1e8b36b').type).toBe(4)
  expect(commits.get('4-1e8b36b').parents).toEqual(['M', 'B'])
  expect(commits.get('4-1e8b36b').customType).toBeUndefined()
  expect(git.getCommitsArray().map((commit: any) => commit.seq)).toEqual([0, 1, 2, 3, 4, 5])
  expect(git.getBranchesAsObjArray()).toEqual([{ name: 'main' }, { name: 'empty' }, { name: 'x' }, { name: 'develop' }])
  expect(git.getDirection()).toBe('TB')
  const branches = git.getBranches()
  expect(branches.size).toBe(4)
  expect([branches.get('main'), branches.get('develop'), branches.get('x')]).toEqual(['5-f50b3a2', 'B', '4-1e8b36b'])
  // `empty` was cut from A and never committed on: zombie keeps no fork point.
  expect(() => branches.get('empty')).toThrow('unsupported')
  expect(log.at(-1)).toContain('no fork point')
  // The list is in drawing order, not Mermaid's creation order.
  expect(() => [...branches.keys()]).toThrow('unsupported')
  expect(log.at(-1)).toContain('drawing order')
  for (const getter of ['getCurrentBranch', 'getHead', 'getAccTitle', 'getAccDescription']) expect(() => git[getter]()).toThrow('unsupported')
  expect(git.getDiagramTitle()).toBe('')
})

test('zombie-mermaid git graph: one branch enumerates; no commits leaves every head null; the AST has no statements', () => {
  // gitGraph / branch b1 / branch b2 order: 0
  const empty = { direction: 'LR', branches: ['main', 'b1', 'b2'], commits: [], config: { mainBranchName: 'main' } }
  expect([...view('gitgraph', { ...empty, branches: ['main'] }).view.getBranches()]).toEqual([['main', null]])
  const branches = view('gitgraph', empty).view.getBranches()
  expect([branches.get('main'), branches.get('b1'), branches.get('b2')]).toEqual([null, null, null])
  // gitGraph / title TT / commit
  const { hooks, log } = verdicts()
  const ast = nativeAstView(PROJECT, 'GitGraph', { direction: 'LR', title: 'TT', branches: ['main'], commits: [{ id: '0-9b915a1', message: '', seq: 0, type: 'NORMAL', tags: [], parents: [], branch: 'main' }], config: {} }, hooks)
  expect(ast.$type).toBe('GitGraph')
  expect(ast.title).toBe('TT')
  expect(() => ast.statements).toThrow('unsupported')
  expect(log.at(-1)).toContain('keeps no statement list')
  expect(() => ast.accTitle).toThrow('unsupported')
})

test('zombie-mermaid radar AST: written labels only, entries and options not as written', () => {
  // radar-beta / title Hello / accTitle: T / axis A, B["Bee"], C / curve c1{1,2,3} /
  // curve c2["Two"]{C: 3, A: 1, B: 2} / showLegend false / ticks 3
  const raw = {
    axes: [{ name: 'A', label: 'A' }, { name: 'B', label: 'Bee' }, { name: 'C', label: 'C' }],
    curves: [{ name: 'c1', label: 'c1', entries: [1, 2, 3] }, { name: 'c2', label: 'Two', entries: [1, 2, 3] }],
    options: { showLegend: false, ticks: 3, max: null, min: 0, graticule: 'circle' },
    title: 'Hello',
  }
  const { hooks, log } = verdicts()
  const ast = nativeAstView(PROJECT, 'Radar', raw, hooks)
  expect([ast.$type, ast.title]).toEqual(['Radar', 'Hello'])
  expect(ast.axes.map((axis: any) => axis.name)).toEqual(['A', 'B', 'C'])
  expect(ast.axes[1].label).toBe('Bee')
  expect(() => ast.axes[0].label).toThrow('unsupported')
  expect(log.at(-1)).toContain('name as label')
  expect(ast.curves[1].label).toBe('Two')
  expect(() => ast.curves[1].entries).toThrow('unsupported')
  expect(() => ast.options).toThrow('unsupported')
  expect(() => ast.accTitle).toThrow('unsupported')
})

test("zombie-mermaid packet: its own rows without Mermaid's bit count; the AST keeps no written blocks", () => {
  // packet / title Packet diagram / accTitle: Packet accTitle / accDescr: Packet accDescription /
  // 0-10: "test" / 11-90: "multiple"
  const raw = {
    blocks: [{ start: 0, end: 10, label: 'test' }, { start: 11, end: 90, label: 'multiple' }],
    words: [[{ start: 0, end: 10, label: 'test' }, { start: 11, end: 31, label: 'multiple' }], [{ start: 32, end: 63, label: 'multiple' }], [{ start: 64, end: 90, label: 'multiple' }]],
    title: 'Packet diagram',
  }
  const { view: packet, log } = view('packet', raw)
  expect(packet.getDiagramTitle()).toBe('Packet diagram')
  const rows = packet.getPacket()
  expect(rows.map((row: any[]) => row.map(block => [block.start, block.end, block.label]))).toEqual([[[0, 10, 'test'], [11, 31, 'multiple']], [[32, 63, 'multiple']], [[64, 90, 'multiple']]])
  expect(() => rows[0][0].bits).toThrow('unsupported')
  // A snapshot of the rows lists bits among the keys, so enumerating them is unsupported too.
  expect(() => Object.keys(rows[0][0])).toThrow('unsupported')
  expect(log.at(-1)).toContain('not a bit count')
  expect(() => packet.getAccTitle()).toThrow('unsupported')
  const { hooks } = verdicts()
  const ast = nativeAstView(PROJECT, 'Packet', raw, hooks)
  expect([ast.$type, ast.title]).toEqual(['Packet', 'Packet diagram'])
  expect(() => ast.blocks).toThrow('unsupported')
  expect(() => ast.accDescr).toThrow('unsupported')
})

test('zombie-mermaid kanban: columns and cards; column metadata and icons are not kept', () => {
  // kanban / root[The root] / ::icon(bomb) / :::m-4 p-8 /
  // a[Item A]@{ ticket: MC-1, assigned: knsv, priority: High, icon: star } / b / col2@{ icon: star, assigned: x }
  const raw = {
    columns: [
      { id: 'root', text: 'The root', cards: [{ id: 'a', text: 'Item A', icon: 'star', assigned: 'knsv', ticket: 'MC-1', priority: 'High' }, { id: 'b', text: 'b' }], className: 'm-4 p-8' },
      { id: 'col2', text: 'col2', cards: [] },
    ],
  }
  const { view: kanban, log } = view('kanban', raw)
  const sections = kanban.getSections()
  expect(sections.map((section: any) => [section.id, section.label, section.cssClasses])).toEqual([['root', 'The root', 'm-4 p-8'], ['col2', 'col2', undefined]])
  expect(() => sections[0].icon).toThrow('unsupported')
  expect(log.at(-1)).toContain('no @{ ... } metadata or ::icon decoration on a kanban column')
  expect(() => sections[1].assigned).toThrow('unsupported')
  const nodes = kanban.getData().nodes
  expect(nodes.map((node: any) => [node.id, node.parentId, node.isGroup])).toEqual([['root', undefined, true], ['a', 'root', false], ['b', 'root', false], ['col2', undefined, true]])
  expect([nodes[1].ticket, nodes[1].assigned, nodes[1].priority, nodes[1].icon, nodes[1].label]).toEqual(['MC-1', 'knsv', 'High', 'star', 'Item A'])
  // A section node's ticket is column metadata, which zombie does not keep.
  expect(() => nodes[0].ticket).toThrow('unsupported')
})

test('zombie-mermaid mindmap: a bare node is its own id; a delimited one keeps only its label', () => {
  // mindmap / root((the root)) / child1[c1] / ::icon(bomb) / :::m-4 large / leaf / child2
  const raw = {
    root: {
      id: 0, text: 'the root', shape: 'circle', level: 0,
      children: [
        { id: 1, text: 'c1', shape: 'rect', level: 2, children: [{ id: 2, text: 'leaf', shape: 'default', level: 4, children: [] }], icon: 'bomb', className: 'm-4 large' },
        { id: 3, text: 'child2', shape: 'default', level: 2, children: [] },
      ],
    },
  }
  const { view: mindmap, log } = view('mindmap', raw)
  const root = mindmap.getMindmap()
  expect([root.descr, root.type, root.level]).toEqual(['the root', mindmap.nodeType.CIRCLE, 0])
  expect(() => root.nodeId).toThrow('unsupported')
  expect(log.at(-1)).toContain('not the id written before it')
  const [child1, child2] = root.children
  expect([child1.descr, child1.type, child1.icon, child1.class, child1.level]).toEqual(['c1', mindmap.nodeType.RECT, 'bomb', 'm-4 large', 2])
  expect([child2.nodeId, child2.descr, child2.type]).toEqual(['child2', 'child2', mindmap.nodeType.DEFAULT])
  expect(child1.children[0].nodeId).toBe('leaf')
})

test('zombie-mermaid timeline: periods are task records without id or score', () => {
  // timeline / title T / accTitle: x / 2002 : LinkedIn / section S1 / 2004 : Facebook : Google / 2005
  const raw = { direction: 'LR', sections: ['S1'], periods: [{ section: '', label: '2002', events: ['LinkedIn'] }, { section: 'S1', label: '2004', events: ['Facebook', 'Google'] }, { section: 'S1', label: '2005', events: [] }], title: 'T' }
  const { view: timeline, log } = view('timeline', raw)
  expect(timeline.getSections()).toEqual(['S1'])
  expect(timeline.getDirection()).toBe('LR')
  const tasks = timeline.getTasks()
  expect(tasks.map((task: any) => [task.section, task.type, task.task, task.events])).toEqual([['', '', '2002', ['LinkedIn']], ['S1', 'S1', '2004', ['Facebook', 'Google']], ['S1', 'S1', '2005', []]])
  expect(() => tasks[0].score).toThrow('unsupported')
  expect(log.at(-1)).toContain('keeps no timeline task score')
})

test("zombie-mermaid journey: Mermaid's task records; acc statements are not kept", () => {
  // journey / title Adding journey / accTitle: T / accDescr: D / Task0: 5: Me / section Order /
  // Task1: 3: Me, Cat / Task2: x   (Task2's NaN score reaches the views as null)
  const raw = { sections: ['Order'], tasks: [{ section: '', name: 'Task0', score: 5, actors: ['Me'] }, { section: 'Order', name: 'Task1', score: 3, actors: ['Me', 'Cat'] }, { section: 'Order', name: 'Task2', score: null, actors: [] }], actors: ['Cat', 'Me'], title: 'Adding journey' }
  const { hooks } = verdicts()
  const journey = projectPublicDatabase('bridge', 'journey', raw, hooks.unavailable, hooks.unsupported, PROJECT, '5.17.0')
  expect(journey.getDiagramTitle()).toBe('Adding journey')
  expect(journey.getSections()).toEqual(['Order'])
  expect(journey.getActors()).toEqual(['Cat', 'Me'])
  expect(() => journey.getTasks()).toThrow('gap')
  const { view: finite } = view('journey', { ...raw, tasks: raw.tasks.slice(0, 2) })
  expect(finite.getTasks()).toEqual([
    { score: 5, people: ['Me'], section: '', task: 'Task0', type: '' },
    { score: 3, people: ['Me', 'Cat'], section: 'Order', task: 'Task1', type: 'Order' },
  ])
  expect(() => finite.getAccTitle()).toThrow('unsupported')
})

test('zombie-mermaid gantt: scheduled UTC wall-clock times are local Dates; weekday and excludes are kept', () => {
  // gantt / dateFormat YYYY-MM-DD / weekday friday / accTitle: T / excludes Weekends /
  // excludes 2024-01-29 Monday / title Hi / section Documentation / task A: a, 2024-01-27, 2024-01-28 /
  // task B:crit,milestone, b, after a, 2024-01-30 / task C: c, 2024-01-20, until a
  const task = (id: string, label: string, start: number, end: number, flags: Record<string, boolean> = {}) => ({ id, label, section: 'Documentation', start, end, renderEnd: null, active: false, done: false, crit: false, milestone: false, vert: false, order: 0, classes: [], ...flags })
  const raw = {
    dateFormat: 'YYYY-MM-DD', axisFormat: '', todayMarker: '', includes: [], excludes: ['weekends', '2024-01-29', 'monday'], inclusiveEndDates: false, topAxis: false, weekday: 'friday', weekend: 'saturday', displayMode: '',
    sections: ['Documentation'],
    tasks: [task('a', 'task A', 1706313600000, 1706400000000), task('b', 'task B', 1706400000000, 1706572800000, { crit: true, milestone: true }), task('c', 'task C', 1705708800000, 1706745600000)],
    title: 'Hi',
  }
  const { view: gantt } = view('gantt', raw)
  const tasks = gantt.getTasks()
  expect([tasks[0].id, tasks[0].task, tasks[0].section]).toEqual(['a', 'task A', 'Documentation'])
  expect(tasks[0].startTime).toEqual(new Date(2024, 0, 27))
  expect(tasks[0].endTime).toEqual(new Date(2024, 0, 28))
  expect(tasks[1].startTime).toEqual(new Date(2024, 0, 28))
  expect([tasks[1].crit, tasks[1].milestone, tasks[1].done, tasks[1].active]).toEqual([true, true, false, false])
  expect(tasks[2].startTime).toEqual(new Date(2024, 0, 20))
  expect(gantt.getWeekday()).toBe('friday')
  expect(gantt.getExcludes()).toEqual(['weekends', '2024-01-29', 'monday'])
  expect(() => gantt.getAccTitle()).toThrow('unsupported')
})

test("zombie-mermaid requirement: Mermaid's records, styles in applied order and the default direction", () => {
  // requirementDiagram / accTitle: T / accDescr: D / direction LR / functionalRequirement test_req {
  // id: 1, text: the test text., risk: high, verifymethod: analysis } / element test_entity {
  // type: simulation, docref: abc } / test_entity - satisfies -> test_req /
  // test_req <- contains - test_entity / classDef red fill:#f00,color:white / classDef blue fill:#00f /
  // style test_req stroke:#0f0 / class test_req red / class test_req blue / test_entity:::red
  const raw = {
    nodes: [
      { id: 'test_req', kind: 'requirement', typeLabel: 'Functional Requirement', requirementId: '1', text: 'the test text.', risk: 'High', verifyMethod: 'Analysis', elementType: '', docRef: '' },
      { id: 'test_entity', kind: 'element', typeLabel: 'Element', requirementId: '', text: '', risk: '', verifyMethod: '', elementType: 'simulation', docRef: 'abc' },
    ],
    relationships: [{ type: 'satisfies', src: 'test_entity', dst: 'test_req' }, { type: 'contains', src: 'test_entity', dst: 'test_req' }],
    classDefs: new Map([['red', { fill: '#f00', color: 'white' }], ['blue', { fill: '#00f' }]]),
    classAssignments: new Map([['test_req', 'blue'], ['test_entity', 'red']]),
    nodeStyles: new Map([['test_req', { stroke: '#0f0' }]]),
    nodeClasses: new Map([['test_req', ['red', 'blue']], ['test_entity', ['red']]]),
    styleLayers: new Map([['test_req', [{ stroke: '#0f0' }, { fill: '#f00', color: 'white' }, { fill: '#00f' }]], ['test_entity', [{ fill: '#f00', color: 'white' }]]]),
    direction: 'LR',
  }
  const { view: requirement } = view('requirement', raw)
  expect(requirement.getRequirements().get('test_req')).toEqual({ name: 'test_req', type: 'Functional Requirement', requirementId: '1', text: 'the test text.', risk: 'High', verifyMethod: 'Analysis', cssStyles: ['stroke:#0f0', 'fill:#f00', 'color:white', 'fill:#00f'], classes: ['default', 'red', 'blue'] })
  expect(requirement.getElements().get('test_entity')).toEqual({ name: 'test_entity', type: 'simulation', docRef: 'abc', cssStyles: ['fill:#f00', 'color:white'], classes: ['default', 'red'] })
  expect(requirement.getRelationships()).toEqual(raw.relationships)
  expect(requirement.getClasses().get('red')).toEqual({ id: 'red', styles: ['fill:#f00', 'color:white'], textStyles: ['color:white'] })
  expect(requirement.getDirection()).toBe('LR')
  // An unwritten direction is unset in zombie's model; Mermaid's parser stores TB.
  expect(view('requirement', { ...raw, direction: undefined }).view.getDirection()).toBe('TB')
  expect(() => requirement.getAccTitle()).toThrow('unsupported')
})
