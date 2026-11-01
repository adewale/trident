import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { inspectTerminalFamilyFacts, terminalFamilySourceObservable } from '../fidelity/terminal-family-facts.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { inspectTerminalBlock, projectTerminalBlockLayout } from '../fidelity/terminal-family-layout.ts'
import provenance from './fixtures/terminal/family-provenance.json'
const cases = reviewedTerminalCases(), fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const input = (name: string) => cases.find(input => input.id === provenance.find(row => row.file === name + '.txt')!.caseId)!
const inspect = (name: string, text = fixture(name)) => inspectTerminalFamilyFacts(text, input(name).expected.contract!)!
const passed = (checks: ReturnType<typeof inspect>) => checks.length > 0 && checks.every(check => check.status === 'passed')
const mutateCell = (text: string, x: number, y: number, value: string) => { const rows = text.split('\n').map(row => [...row]); rows[y]![x] = value; return rows.map(row => row.join('')).join('\n') }

test('nineteen finite family cases retain original source, artifact, output and clock provenance', () => {
  expect(provenance).toHaveLength(19)
  for (const row of provenance) {
    expect(createHash('sha256').update(fixture(row.file.slice(0, -4))).digest('hex')).toBe(row.sha256)
    const source = cases.find(input => input.id === row.caseId)!
    expect(source.sourceSha256).toBe(row.sourceSha256)
    expect(source.family).toBe(row.family)
    expect(row.originalStartedAt < row.originalFinishedAt).toBe(true)
    expect(row.originalCallStartedAt).toBeNull()
    expect(row.originalCallFinishedAt).toBeNull()
    expect(row.artifact.sha256 ?? row.artifact.revision).toMatch(/^[a-f0-9]{40,64}$/)
    expect(terminalFamilySourceObservable(source.expected.contract!)).toBe(true)
  }
  expect(new Set(provenance.map(row => row.caseId)).size).toBe(19)
})
test('fifteen authenticated positive drawings establish every required family fact', () => {
  for (const row of provenance.filter(row => row.role === 'positive')) expect(passed(inspect(row.file.slice(0, -4)))).toBe(true)
  expect(provenance.filter(row => row.role === 'positive')).toHaveLength(15)
})
test('source echoes, label inventories, empty strings and concealed drawings never establish whole drawing meaning', () => {
  for (const row of provenance) {
    const name = row.file.slice(0, -4), source = input(name)
    expect(passed(inspect(name, source.source))).toBe(false)
    expect(passed(inspect(name, source.source.replace(/[^\p{Letter}\p{Number} ]/gu, ' ')))).toBe(false)
    expect(passed(inspect(name, ''))).toBe(false)
    expect(passed(inspect(name, '\x1b[8m' + fixture(name)))).toBe(false)
    expect(passed(inspect(name, fixture(name) + '\nUNASSIGNED INK'))).toBe(false)
  }
})
test('C4 role, description, enclosure, primitive and route direction have independent controls', () => {
  expect(passed(inspect('family-c4-single', fixture('family-c4-single').replace('[Software System]', '[Container]      ')))).toBe(false)
  const context = fixture('family-c4-context')
  for (const text of [context.replace('A customer', 'An imposter'), context.replace('Uses', 'Owns'), context.replace('▼', '▲'), context.replace('Sends emails', 'Drops emails')]) expect(passed(inspect('family-c4-context', text))).toBe(false)
  const boundary = fixture('family-c4-boundary')
  expect(passed(inspect('family-c4-boundary', boundary.replace('Services', 'Strangers')))).toBe(false)
  expect(passed(inspect('family-c4-boundary', boundary.replace('Queues', 'Drops ')))).toBe(false)
  expect(passed(inspect('family-c4-boundary', boundary.replace('Manages', 'Uses   ')))).toBe(false)
})
test('Git operations require chronological IDs, owned tags, continuous branches and provenance stems', () => {
  const merge = fixture('family-git-merges')
  for (const text of [merge.replace('init', 'TEMP').replace('scaffold', 'init').replace('TEMP', 'scaffold'), merge.replace('v1.0.1', 'v9.9.9'), merge.replace('[feature/ui]', '[other/ui]'), merge.replace('├─╮', '  ╮'), merge.replace('◎─╯', '●─╯')]) expect(passed(inspect('family-git-merges', text))).toBe(false)
  const cherry = fixture('family-git-cherry')
  expect(passed(inspect('family-git-cherry', cherry.replace('cherry-picked B', 'cherry-picked A')))).toBe(false)
  expect(passed(inspect('family-git-cherry', cherry.replace('◆', '*')))).toBe(false)
  expect(passed(inspect('family-git-cherry', cherry.replace('│', ' ')))).toBe(false)
})
test('mindmap elbows and continuing ancestor stems bind exact parentage, order and the root shape', () => {
  const text = fixture('family-mindmap')
  for (const changed of [text.replace('Leaf1', 'TEMP').replace('Leaf3', 'Leaf1').replace('TEMP', 'Leaf3'), text.replace('│  ├', '   ├'), text.replace('└─ · Branch2', '├─ · Branch2'), text.replace('● Main', '○ Main')]) expect(passed(inspect('family-mindmap', changed))).toBe(false)
})
test('quadrant legends must independently agree with uniquely positioned plot dots and directed axis endpoints', () => {
  const text = fixture('family-quadrant'), lines = text.split('\n'), dotRow = lines.findIndex(line => line.includes('●'))
  expect(passed(inspect('family-quadrant', text.replace('Alpha: [0.25, 0.75]', 'Alpha: [0.75, 0.25]')))).toBe(false)
  const x = [...lines[dotRow]!].indexOf('●'), moved = mutateCell(mutateCell(text, x, dotRow, ' '), x + 3, dotRow, '●')
  expect(passed(inspect('family-quadrant', moved))).toBe(false)
  expect(passed(inspect('family-quadrant', text.replace('bottom: Low value', 'bottom: High value')))).toBe(false)
  expect(passed(inspect('family-quadrant', lines.filter(line => /^●/.test(line)).join('\n')))).toBe(false)
})
test('block literal capacities project occupied rows and shared boundaries without inventing unused tail cells', () => {
  const text = fixture('family-block-dense')
  expect(passed(inspect('family-block-dense', text.replace('Postgres', 'Redis   ')))).toBe(false)
  expect(passed(inspect('family-block-dense', text.replace('Web Frontend', 'CLI Tool    ')))).toBe(false)
  expect(inspect('family-block-underfilled')[0]!.status).toBe('passed')
  expect((inspect('family-block-underfilled')[0]!.expected as any).columns[0].columns).toBe(1000)
  expect(inspect('family-block-nested')[0]!.status).toBe('passed')
  expect(passed(inspect('family-block-nested', fixture('family-block-nested').replace('inner1', 'other1')))).toBe(false)
})
test('architecture roles, enclosures and exact requested ports are separately observed', () => {
  const text = fixture('family-architecture-basic')
  for (const changed of [text.replace('[icon] Web', '[disk] Web'), text.replace('►', '◄'), text.replace('──────►', '──  ──►'), text.replace('(icon) API', '(disk) API')]) expect(passed(inspect('family-architecture-basic', changed))).toBe(false)
  expect(inspect('family-architecture-broken').some(check => check.criterion === 'port-routes' && check.status === 'failed')).toBe(true)
})
test('packet numbers belong to continuous field walls with proportional widths', () => {
  const text = fixture('family-packet')
  for (const changed of [text.replace('15 16', '14 16'), text.replace('Source Port', 'Changed Port'), text.replace('Sequence Number', 'Acknowledgment Number'), text.replace('┬', '─')]) expect(passed(inspect('family-packet', changed))).toBe(false)
})
test('Gantt dates, status and bar continuity are observed; invisible after-links remain required', () => {
  const text = fixture('family-gantt-single')
  for (const changed of [text.replace('2024-01-31', '2024-01-30'), text.replace('░░░░', '░ ░░'), text.replace('▼ One', '▼ Two')]) expect(passed(inspect('family-gantt-single', changed))).toBe(false)
  expect(passed(inspect('family-gantt-dependencies'))).toBe(false)
})
test('XY values require calibrated bar geometry, orientation and owned categories', () => {
  const vertical = fixture('family-xy-vertical'), horizontal = fixture('family-xy-horizontal')
  for (const changed of [vertical.replace('Jan', 'Mar'), vertical.replace('35 │', '70 │'), vertical.replace('████', '█  █')]) expect(passed(inspect('family-xy-vertical', changed))).toBe(false)
  expect(passed(inspect('family-xy-horizontal', horizontal.replace('██████████', '█████     ')))).toBe(false)
  expect(passed(inspect('family-xy-horizontal', horizontal.replace('0.8', '0.2')))).toBe(false)
})
test('synthetic UML control exercises role, call direction, activation, arguments and stack depth without claiming a real renderer positive', () => {
  const text = fixture('family-zenuml-synthetic')
  expect(passed(inspect('family-zenuml-source-boxes', text))).toBe(true)
  for (const changed of [text.replace('[Control]', '[Actor]  '), text.replace('save()', 'save(x)'), text.replace('▶', '◀'), text.replace('█ save()', '│ save()'), text.replace('│ return            █', '│ wrong             █')]) expect(passed(inspect('family-zenuml-source-boxes', changed))).toBe(false)
  expect(passed(inspect('family-zenuml-source-boxes'))).toBe(false)
})
test('synthetic treemap control separates exact weights, containment and proportional regions from the real truncated output', () => {
  const text = fixture('family-treemap-synthetic')
  expect(passed(inspect('family-treemap-truncated', text))).toBe(true)
  expect(passed(inspect('family-treemap-truncated', text.replace('40', '10')))).toBe(false)
  expect(passed(inspect('family-treemap-truncated', text.replace('Auth', 'CSS ')))).toBe(false)
  expect(inspect('family-treemap-truncated')[0]!.status).toBe('failed')
})
test('synthetic schedule annotations retain provenance and milestone instant without inventing renderer output', () => {
  const text = fixture('family-gantt-synthetic')
  expect(passed(inspect('family-gantt-dependencies', text))).toBe(true)
  expect(passed(inspect('family-gantt-dependencies', text.replace('after=a1', 'after=b1')))).toBe(false)
  expect(passed(inspect('family-gantt-dependencies', text.replace('12:00:00.000Z', '00:00:00.000Z')))).toBe(false)
  expect(inspect('family-gantt-dependencies').find(check => check.criterion === 'gantt-tasks')!.detail).toContain('dependency provenance')
})

// Hand-authored drawings, not renderer outputs or generated decoder round trips.
test('independent block grid controls reject wrong relative boundaries, rows, spans and containment', () => {
  const contract = analyseTerminalSource('block-beta\ncolumns 3\nA B C\nW:2 D\nE F G\n', 'block').contract
  const positive = fixture('family-block-grid-synthetic')
  expect(passed(inspectTerminalBlock(positive, contract))).toBe(true)
  expect(passed(inspectTerminalBlock(fixture('family-block-grid-wrong-width-synthetic'), contract))).toBe(false)
  expect(passed(inspectTerminalBlock(fixture('family-block-grid-wrong-row-synthetic'), contract))).toBe(false)
  expect(passed(inspectTerminalBlock(positive, analyseTerminalSource('block-beta\ncolumns 3\nA B C\nW D:2\nE F G\n', 'block').contract))).toBe(false)
  const nested = input('family-block-nested').expected.contract!, layout = nested.facts.find(f => f.criterion === 'block-layout')!.expected as any
  expect(projectTerminalBlockLayout(layout)).toEqual([
    { scope: null, columns: 4, items: [{ id: 'a', kind: 'node', span: 2, row: 0, start: 0, end: 2 }, { id: 'b', kind: 'node', span: 2, row: 0, start: 2, end: 4 }, { id: 'inner1', kind: 'group', span: 2, row: 1, start: 0, end: 2 }] },
    { scope: 'inner1', columns: 2, items: [{ id: 'c', kind: 'node', span: 1, row: 0, start: 0, end: 1 }, { id: 'd', kind: 'node', span: 1, row: 0, start: 1, end: 2 }] },
  ])
  // Swapping C/D ownership keeps their letters and boxes but changes geometry.
  expect(passed(inspect('family-block-nested', fixture('family-block-nested').replace('    C     ', '    X     ').replace('    D     ', '    C     ').replace('    X     ', '    D     ')))).toBe(false)
})

test('block projection rejects conflicting IDs, duplicate scopes and cyclic parentage', () => {
  const source = analyseTerminalSource('block-beta\ncolumns 2\nA B\n', 'block').contract.facts[0]!.expected as any
  expect(projectTerminalBlockLayout({ ...source, nodes: [...source.nodes, source.nodes[0]] })).toBeUndefined()
  expect(projectTerminalBlockLayout({ ...source, columns: [...source.columns, source.columns[0]] })).toBeUndefined()
  expect(projectTerminalBlockLayout({ nodes: [], groups: [{ id: 'a', parent: 'b', span: 1 }, { id: 'b', parent: 'a', span: 1 }], columns: [{ scope: null, columns: 2 }] })).toBeUndefined()
})
