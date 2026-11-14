import { expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'
import { projectPublicDatabase } from '../unified/upstream-fidelity-projection.mjs'
import { flutterPackageConfig, locateCore } from '../unified/mermaid-fidelity/bridges/dart/build.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-views-native-coverage-')
const verdicts = () => {
  const log: string[] = []
  return {
    log,
    hooks: {
      unavailable: (reason: string) => { log.push('gap: ' + reason); throw Error('gap') },
      unsupported: (reason: string) => { log.push('unsupported: ' + reason); throw Error('unsupported') },
    },
  }
}

// block-beta / columns 3 / a b / block:e:2 / f / end / classDef black color:#fff / a -- "l" --> b
// as Pele 1.13.0 and Bezel 0.2.26 (root, blocks, byId) and Latias94/merman 0.10.0 (blocks,
// blocksFlat) return it (scripts/fidelity-probe.ts).
const block = (root: any) => {
  const a = { id: 'a', label: 'a', type: 'na', widthInColumns: 1, children: [] }, b = { id: 'b', label: 'b', type: 'na', widthInColumns: 1, children: [] }
  const f = { id: 'f', label: 'f', type: 'na', widthInColumns: 1, children: [] }, e = { id: 'e', label: '', type: 'composite', widthInColumns: 2, children: [f], colorIndex: 0 }
  const edges = [{ id: '1-a-b', start: 'a', end: 'b', label: 'l', type: 'edge', thickness: 'normal', pattern: 'solid', arrowTypeEnd: 'arrow_point', arrowTypeStart: 'arrow_open' }]
  const classes = { black: { id: 'black', styles: ['color:#fff'], textStyles: [] } }
  return { type: 'block', ...(root ? { root: { id: 'root', type: 'composite', columns: root, children: [a, b, e] }, byId: { a, b, e, f } } : { blocksFlat: [{ id: 'root', type: 'composite', label: '', columns: 3, children: [a, b, e] }, a, b, e, f] }), blocks: [a, b, e], edges, classes }
}

test('the ports answer the block getters from the records getBlock already reads', () => {
  for (const [project, raw] of [['obsidianmd/pele', block(3)], ['crabtalk/bezel', block(3)], ['Latias94/merman', block(undefined)]] as const) {
    const { hooks } = verdicts()
    const view = nativeSchemaView(project, 'block', raw, hooks)
    expect(view.getBlocks().map((item: any) => item.id), project).toEqual(['a', 'b', 'e'])
    // blockDB.ts getColumns: written columns, else the number of children, else -1.
    expect([view.getColumns('root'), view.getColumns('e'), view.getColumns('a'), view.getColumns('missing')], project).toEqual([3, 1, 0, -1])
    expect(view.getEdges()[0], project).toMatchObject({ id: '1-a-b', start: 'a', end: 'b', label: 'l', arrowTypeEnd: 'arrow_point' })
    expect(view.getClasses().get('black'), project).toEqual({ id: 'black', styles: ['color:#fff'], textStyles: [] })
  }
  // The root keeps Mermaid's -1 when no columns (or `columns auto`) are written.
  expect(nativeSchemaView('crabtalk/bezel', 'block', block(-1), verdicts().hooks).getColumns('root')).toBe(-1)
})

test("the ports' timeline periods become Mermaid's task records; the id counter and score are declared absent", () => {
  const periods = [{ text: 'task1', events: ['e1', 'e2'], section: 'abc-123', sectionIndex: 0 }]
  for (const project of ['obsidianmd/pele', 'crabtalk/bezel']) {
    const { hooks, log } = verdicts()
    const view = nativeSchemaView(project, 'timeline', { type: 'timeline', direction: 'LR', sections: ['abc-123'], periods }, hooks)
    expect(view.getSections()).toEqual(['abc-123'])
    const [task] = view.getTasks()
    expect([task.task, task.section, task.type, task.events]).toEqual(['task1', 'abc-123', 'abc-123', ['e1', 'e2']])
    expect(() => task.score).toThrow('unsupported')
    expect(log.at(-1)).toContain('keeps no timeline task score')
  }
  const merman = nativeSchemaView('Latias94/merman', 'timeline', { type: 'timeline', sections: ['s'], tasks: [{ id: 0, section: 's', type: 's', task: 't', score: 0, events: [] }] }, verdicts().hooks)
  expect(merman.getTasks()).toEqual([{ id: 0, section: 's', type: 's', task: 't', score: 0, events: [] }])
})

test('without a reviewed view, timeline values pass through only in Mermaid shapes', () => {
  const read = (raw: any, getter: string) => {
    const { hooks, log } = verdicts()
    try { return projectPublicDatabase('bridge', 'timeline', raw, hooks.unavailable, hooks.unsupported, 'some/project')[getter]() } catch { return log.at(-1) }
  }
  expect(read({ sections: ['a', 'b'], direction: 'TD' }, 'getSections')).toEqual(['a', 'b'])
  expect(read({ sections: ['a'], direction: 'TD' }, 'getDirection')).toBe('TD')
  // Section records, period records and other direction spellings are gaps, never comparisons.
  expect(read({ sections: [{ name: 'a' }] }, 'getSections')).toBe('gap: Unmapped native timeline schema: section records')
  expect(read({ periods: [{ text: 't' }] }, 'getTasks')).toBe('gap: Unmapped native timeline schema: period records')
  expect(read({ direction: 'LeftRight' }, 'getDirection')).toBe('gap: Unmapped native timeline schema: direction "LeftRight"')
  expect(read({ direction: 'td' }, 'getDirection')).toBe('gap: Unmapped native timeline schema: direction "td"')
})

test("zombie-mermaid's written edge ids and animation are read; a generated id is absent for that edge", () => {
  // flowchart TD / A --> B / B e2@--> C / e2@{ animate: true } (zombie-mermaid 5.17.0)
  const graph = {
    direction: 'TD',
    nodes: new Map([['A', { id: 'A', label: 'A', shape: 'rectangle' }], ['B', { id: 'B', label: 'B', shape: 'rectangle' }], ['C', { id: 'C', label: 'C', shape: 'rectangle' }]]),
    edges: [{ source: 'A', target: 'B', style: 'solid', hasArrowStart: false, hasArrowEnd: true }, { source: 'B', target: 'C', style: 'solid', hasArrowStart: false, hasArrowEnd: true, id: 'e2', animate: true }],
    subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map(), interactions: new Map(),
  }
  const { hooks, log } = verdicts()
  const [plain, named] = nativeSchemaView('dfadler/zombie-mermaid', 'flowchart', graph, hooks).getEdges()
  expect([named.id, named.isUserDefinedId, named.animate]).toEqual(['e2', true, true])
  expect([plain.isUserDefinedId, plain.animate]).toEqual([false, undefined])
  expect(() => plain.id).toThrow('unsupported')
  expect(log.at(-1)).toContain('keeps no generated edge id')
  // beautiful-mermaid's MermaidEdge keeps neither: still declared absent.
  const beautiful = nativeSchemaView('lukilabs/beautiful-mermaid', 'flowchart', graph, verdicts().hooks).getEdges()[1]
  expect(() => beautiful.id).toThrow('unsupported')
})

test("MermaidTUI's one public parser answers every family, so a family it does not parse is its own refusal", () => {
  const root = temporary.dir()
  const module = join(root, 'index.js')
  writeFileSync(module, `export function parseMermaid(input){ if(!/^flowchart\\s+(LR|RL|TB|BT)$/i.test(input.split('\\n')[0])){ const e=new Error('Line 1: Unsupported diagram type or missing direction'); e.name='ParseError'; throw e } return { direction: 'LR', nodes: new Map(), edges: [] } }`)
  const bridge = resolve(import.meta.dirname, '../unified/mermaid-fidelity/bridges/javascript.mjs')
  const run = (family: string, source: string) => JSON.parse(spawnSync(process.execPath, [bridge, 'mermaidtui', module], { input: JSON.stringify({ family, source }), encoding: 'utf8', timeout: 5000 }).stdout)
  expect(run('er', 'erDiagram\nA ||--o{ B : x')).toEqual({ error: { name: 'ParseError', message: 'Line 1: Unsupported diagram type or missing direction' } })
  expect(run('flowchart', 'flowchart LR\nA-->B').value.direction).toBe('LR')
})

test("Mermaid Flutter's mermaid_core is the copy its native app resolved, never another project's", () => {
  const root = temporary.dir(), core = join(root, 'cache/hosted/pub.dev/mermaid_core-0.3.2'), app = join(root, 'app')
  mkdirSync(core, { recursive: true }); mkdirSync(join(app, '.dart_tool'), { recursive: true })
  writeFileSync(join(core, 'pubspec.yaml'), 'name: mermaid_core\nversion: 0.3.2\n')
  writeFileSync(join(app, 'pubspec.lock'), '')
  const config = flutterPackageConfig(join(app, 'pubspec.lock'))
  expect(config).toBe(join(app, '.dart_tool/package_config.json'))
  const flutter = { node: { id: 'pub:mermaid_flutter' }, artifact: { root: '/elsewhere' } }
  expect(() => locateCore(flutter, '0.3.2', config)).toThrow("native app has no resolved mermaid_core")
  writeFileSync(config, JSON.stringify({ packages: [{ name: 'mermaid_core', rootUri: 'file://' + core }] }))
  expect(locateCore(flutter, '0.3.2', config)).toBe(core)
  expect(() => locateCore(flutter, '0.3.3', config)).toThrow('is mermaid_core 0.3.2, not 0.3.3')
})

test('layout step fields come only from an edge record that keeps a step; otherwise they are unmapped, never absent', () => {
  const graph = (edges: any[]) => ({
    direction: 'LR',
    nodes: new Map([['A', { id: 'A', label: 'A', shape: 'rectangle' }], ['B', { id: 'B', label: 'B', shape: 'rectangle' }], ['C', { id: 'C', label: 'C', shape: 'rectangle' }]]),
    edges, subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map(), interactions: new Map(),
  })
  // zombie-mermaid keeps written edge ids but no step: a test reading step is a gap, not a failure or a pass.
  const { hooks, log } = verdicts()
  const data = projectPublicDatabase('bridge', 'flowchart', graph([{ source: 'A', target: 'B', style: 'solid', hasArrowStart: false, hasArrowEnd: true, id: 'e1' }]), hooks.unavailable, hooks.unsupported, 'dfadler/zombie-mermaid').getData()
  expect(() => data.edges[0].step).toThrow('gap')
  expect(() => 'step' in data.edges[0]).toThrow('gap')
  expect(log.at(-1)).toBe('gap: layout edge.step')
  // Mermaid's renderer decides a step edge's duration and number badge.
  expect(() => data.edges[0].stepDuration).toThrow('unsupported')
})
