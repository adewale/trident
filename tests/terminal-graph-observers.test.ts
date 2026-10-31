import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { inspectTerminalGraphFacts, terminalGraphSourceObservable } from '../fidelity/terminal-graph-facts.ts'
import { inspectTerminalClass, terminalClassSourceObservable } from '../fidelity/terminal-class.ts'
import { inspectTerminalState, terminalStateSourceObservable } from '../fidelity/terminal-state.ts'
import { inspectTerminalEr, terminalErSourceObservable } from '../fidelity/terminal-er.ts'
import provenance from './fixtures/terminal/graph-provenance.json'
const cases = reviewedTerminalCases(), fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const input = (name: string) => cases.find(item => item.id === provenance.find(row => row.file === name + '.txt')!.caseId)!
const graph = (name: string, output = fixture(name)) => { const item = input(name); return inspectTerminalGraphFacts(output, item.expected.contract!, item.expected.graph!) }
const classes = (name: string, output = fixture(name)) => inspectTerminalClass(output, input(name).expected.contract!)
const states = (name: string, output = fixture(name)) => inspectTerminalState(output, input(name).expected.contract!)
const status = (checks: ReturnType<typeof graph>, criterion: string) => checks.find(row => row.criterion === criterion)?.status
const allPass = (checks: ReturnType<typeof graph>) => checks.every(row => row.status === 'passed')
test('retained graph controls authenticate source, artifact, original output bytes and collection interval', () => {
  for (const row of provenance) { expect(createHash('sha256').update(fixture(row.file.slice(0, -4))).digest('hex')).toBe(row.sha256); expect(cases.find(item => item.id === row.caseId)!.sourceSha256).toBe(row.sourceSha256); expect(row.originalStartedAt < row.originalFinishedAt).toBe(true); expect(row.rawReceiptSha256).toMatch(/^[0-9a-f]{64}$/) }
})
test('dotted, thick, undirected, circle and cross markers require the actual route stroke and endpoint role', () => {
  for (const name of ['graph-dotted-cli', 'graph-thick-python', 'graph-markers-module', 'graph-cross-python']) expect(allPass(graph(name))).toBe(true)
  expect(status(graph('graph-dotted-cli', fixture('graph-dotted-cli').replaceAll('┄', '─').replaceAll('┆', '│')), 'relationships')).toBe('failed')
  expect(status(graph('graph-thick-python', fixture('graph-thick-python').replaceAll('┃', '│')), 'relationships')).toBe('failed')
  expect(status(graph('graph-markers-module', fixture('graph-markers-module').replace('✕', '◯')), 'relationships')).toBe('failed')
  expect(status(graph('graph-cross-python', fixture('graph-cross-python').replace('×', '►')), 'relationships')).toBe('failed')
  expect(status(graph('graph-bidirectional-module'), 'relationships')).toBe('failed') // Original collapses three obligations to one two-headed dotted link.
})
test('multiline edge captions own contiguous route cells; HTML and collapsed or detached captions earn no line-break credit', () => {
  const name = 'graph-caption-module', original = fixture(name)
  expect(allPass(graph(name))).toBe(true)
  expect(allPass(graph(name, original.replace('Second', 'Wrong!')))).toBe(false)
  expect(allPass(graph(name, original.replace('Second', '      ') + '\nSecond'))).toBe(false)
  expect(allPass(graph(name, original.replace('First', '\x1b[8mFirst\x1b[28m')))).toBe(false)
})
test('hexagon boundaries and 100-node identities remain inspectable while ambiguous routes retain unknown', () => {
  const hexagon = graph('graph-hexagon-python')
  expect(status(hexagon, 'node-shapes')).toBe('passed'); expect(status(hexagon, 'groups')).toBe('passed'); expect(status(hexagon, 'relationships')).toBe('unknown')
  expect(status(graph('graph-hexagon-python', fixture('graph-hexagon-python').replace('/────────────────\\', '/────────────────/')), 'node-shapes')).not.toBe('passed')
  const large = graph('graph-large-cli')
  expect(status(large, 'nodes')).toBe('passed'); expect(status(large, 'node-shapes')).toBe('passed'); expect(status(large, 'relationships')).toBe('unknown')
  expect(status(graph('graph-large-cli', fixture('graph-large-cli').replace('C99', 'BAD')), 'nodes')).toBe('failed')
})
test('a literal source escape cannot execute as terminal state; only explicit visible escapes can retain its label', () => {
  expect(status(graph('graph-control-injection-python'), 'literal-control-safety')).toBe('failed')
  expect(allPass(graph('graph-literal-control-module'))).toBe(false)
  // Independent positive control changes one retained replacement glyph into
  // the visible Unicode ESC control picture; no renderer or source echo defines it.
  const safe = fixture('graph-literal-control-module').replace('?[31mX', '␛[31mX')
  expect(allPass(graph('graph-literal-control-module', safe))).toBe(true)
  expect(allPass(graph('graph-literal-control-module', safe + '\n␛[31mX'))).toBe(false)
})
test('class members retain generic parameters, field roles, visibility, stereotypes and method signatures', () => {
  expect(allPass(classes('class-generics-loom'))).toBe(true)
  expect(allPass(classes('class-cardinality-python'))).toBe(true)
  expect(status(classes('class-members-python'), 'class-bodies')).toBe('passed')
  expect(status(classes('class-members-python'), 'class-relations')).toBe('unknown')
  expect(status(classes('class-generics-loom', fixture('class-generics-loom').replace('Box<T>', 'Box<U>')), 'class-bodies')).toBe('failed')
  expect(status(classes('class-cardinality-python', fixture('class-cardinality-python').replace('-int age', '+int age')), 'class-bodies')).toBe('failed')
  expect(status(classes('class-cardinality-python', fixture('class-cardinality-python').replace('Animal a', 'Animal b')), 'class-bodies')).toBe('failed')
  expect(status(classes('class-generics-loom', fixture('class-generics-loom').replace('△', '◇')), 'class-relations')).not.toBe('passed')
  expect(status(classes('class-cardinality-python', fixture('class-cardinality-python').replace('0..*', '1..*')), 'class-relations')).toBe('failed')
})
test('ER inline cardinalities own their actual route endpoints; ambiguous branch crossings cannot borrow source topology', () => {
  const source = cases.find(item => item.id.endsWith('89be4f2885fb74a9'))!, original = fixture('er-cli-key-columns'), er = (text: string) => inspectTerminalEr(text, source.expected.contract!).checks
  expect(allPass(er(original))).toBe(true)
  expect(status(er(original.replace('└||', '└o|')), 'entity-relations')).toBe('failed')
  expect(status(er(original.replace('o{┘', '|{┘')), 'entity-relations')).toBe('failed')
  expect(status(er(original.replace('places', 'wrong!')), 'entity-relations')).toBe('failed')
  expect(allPass(er(original + '\nplaces'))).toBe(false)
  for (const name of ['er-branches-cli', 'er-fields-branches-cli']) { const checks = inspectTerminalEr(fixture(name), input(name).expected.contract!).checks; expect(status(checks, 'entity-bodies')).toBe('passed'); expect(status(checks, 'entity-relations')).toBe('unknown') }
})
test('self transitions need the same real state at both ends, and composite frames retain scope-qualified identities', () => {
  expect(allPass(states('state-loop-zombie'))).toBe(true)
  expect(allPass(states('state-loop-zombie', fixture('state-loop-zombie').replace('◄', '►')))).toBe(false)
  expect(allPass(states('state-loop-zombie', fixture('state-loop-zombie').replace('●', '○')))).toBe(false)
  expect(allPass(states('state-loop-zombie', fixture('state-loop-zombie').replace('Retry fails again', 'Retry fails WRONG')))).toBe(false)
  expect(status(states('state-nesting-module'), 'states')).toBe('failed') // Actual output merges distinct lexical B/C identities.
  expect(status(states('state-nesting-module'), 'state-enclosures')).toBe('passed')
  expect(status(states('state-nesting-module', fixture('state-nesting-module').replace('│   E   │', '│   X   │')), 'state-enclosures')).toBe('failed')
})
test('source-only observer availability retains every graph/class/ER/state obligation without shrinking the corpus', () => {
  for (const item of cases.filter(item => ['flowchart', 'class', 'er', 'state'].includes(item.family))) {
    const contract = item.expected.contract!
    expect(item.family === 'flowchart' ? terminalGraphSourceObservable(contract, item.expected.graph) : item.family === 'class' ? terminalClassSourceObservable(contract) : item.family === 'er' ? terminalErSourceObservable(contract) : terminalStateSourceObservable(contract)).toBe(true)
  }
  expect(cases).toHaveLength(120); expect(cases.filter(item => item.intent !== 'invalid')).toHaveLength(116)
  const analysis = analyseTerminalSource('flowchart\nA@{shape: unknown}', 'flowchart')
  expect(analysis.contract.sourceUncertainties.length > 0 || !terminalGraphSourceObservable(analysis.contract, analysis.graph)).toBe(true)
})
test('independent closed scope control verifies scoped transitions, beyond retained nested-frame failure evidence', () => {
  const source = analyseTerminalSource('stateDiagram-v2\nstate D {\nA --> B\n}', 'state'), drawing = '┌─────────┐\n│ D       │\n│ ┌─────┐ │\n│ │  A  │ │\n│ └──┬──┘ │\n│    │    │\n│    ▼    │\n│ ┌─────┐ │\n│ │  B  │ │\n│ └─────┘ │\n└─────────┘'
  expect(allPass(inspectTerminalState(drawing, source.contract))).toBe(true)
  expect(allPass(inspectTerminalState(drawing.replace('▼', '▲'), source.contract))).toBe(false)
})
test('independent crossing-free ER branch control observes every port, identifying stroke and cardinality pair', () => {
  const analysis = analyseTerminalSource('erDiagram\nA ||--o{ B : linksB\nA }|..|{ C : linksC', 'er'), grid = Array.from({ length: 12 }, () => Array.from({ length: 37 }, () => ' '))
  const box = (x: number, y: number, right: number, bottom: number, label: string) => { grid[y]![x] = '┌'; grid[y]![right] = '┐'; grid[bottom]![x] = '└'; grid[bottom]![right] = '┘'; for (let col = x + 1; col < right; col++) grid[y]![col] = grid[bottom]![col] = '─'; for (let row = y + 1; row < bottom; row++) grid[row]![x] = grid[row]![right] = '│'; grid[y + 1]![x + 2] = label }
  box(0, 0, 6, 11, 'A'); box(30, 0, 36, 4, 'B'); box(30, 7, 36, 11, 'C')
  for (const [y, caption, left, right, stroke] of [[2, 'linksB', '||', 'o{', '─'], [9, 'linksC', '}|', '|{', '┄']] as const) { grid[y]![6] = '├'; grid[y]![30] = '┤'; const text = left + stroke.repeat(2) + caption + stroke.repeat(11) + right; [...text].forEach((glyph, n) => grid[y]![7 + n] = glyph) }
  const drawing = grid.map(row => row.join('')).join('\n'), checks = (text: string) => inspectTerminalEr(text, analysis.contract).checks
  expect(allPass(checks(drawing))).toBe(true)
  expect(status(checks(drawing.replace('}|', '}o')), 'entity-relations')).toBe('failed')
  expect(status(checks(drawing.replaceAll('┄', '─')), 'entity-relations')).toBe('failed')
})
test('independent concentric 100-node drawing verifies the complete large-source relation multiset', () => {
  // Hand-authored orthogonal projection of the reviewed five-node rings and
  // inward links. It reads no renderer, candidate output or expected edge array.
  // Retained CLI output above remains a separate ambiguous-junction control.
  const grid = Array.from({ length: 421 }, () => Array.from({ length: 421 }, () => ' ')), center = 210, nodes: { x: number; y: number }[] = []
  const connections = new Map<string, Set<number>>(), dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0]
  for (let ring = 0; ring < 20; ring++) { const radius = 205 - ring * 10; for (const [x, y] of [[center - radius, center - radius], [center + radius, center - radius], [center + radius, center + radius], [center - radius, center + radius], [center - radius, center]]) nodes.push({ x: x!, y: y! }) }
  for (const [id, { x, y }] of nodes.entries()) { grid[y - 2]![x - 3] = '┌'; grid[y - 2]![x + 3] = '┐'; grid[y + 2]![x - 3] = '└'; grid[y + 2]![x + 3] = '┘'; for (let col = x - 2; col < x + 3; col++) grid[y - 2]![col] = grid[y + 2]![col] = '─'; for (let row = y - 1; row <= y + 1; row++) grid[row]![x - 3] = grid[row]![x + 3] = '│'; [...'C' + id].forEach((glyph, n) => grid[y]![x - 2 + n] = glyph) }
  const route = (waypoints: [number, number][]) => {
    const cells: [number, number][] = [waypoints[0]!]
    for (let n = 1; n < waypoints.length; n++) { const previous = cells.at(-1)!, target = waypoints[n]!, stepX = Math.sign(target[0] - previous[0]), stepY = Math.sign(target[1] - previous[1]); if (stepX && stepY) throw Error('Control route must be orthogonal'); let x = previous[0], y = previous[1]; while (x !== target[0] || y !== target[1]) { x += stepX; y += stepY; cells.push([x, y]) } }
    for (const [n, [x, y]] of cells.entries()) { const exits = connections.get(x + ',' + y) ?? new Set<number>(); for (const neighbor of [cells[n - 1], cells[n + 1]]) if (neighbor) exits.add(dx.findIndex((col, direction) => x + col === neighbor[0] && y + dy[direction]! === neighbor[1])); connections.set(x + ',' + y, exits) }
    const last = cells.at(-1)!, previous = cells.at(-2)!, direction = dx.findIndex((col, index) => previous[0] + col === last[0] && previous[1] + dy[index]! === last[1]); grid[last[1]]![last[0]] = ['▲', '►', '▼', '◄'][direction]!
  }
  for (let ring = 0; ring < 20; ring++) {
    const [a, b, c, d, e] = nodes.slice(ring * 5, ring * 5 + 5) as [typeof nodes[number], typeof nodes[number], typeof nodes[number], typeof nodes[number], typeof nodes[number]]
    route([[a.x + 4, a.y], [b.x - 4, b.y]]); route([[b.x, b.y + 3], [c.x, c.y - 3]]); route([[c.x - 4, c.y], [d.x + 4, d.y]]); route([[d.x, d.y - 3], [e.x, e.y + 3]]); route([[e.x, e.y - 3], [a.x, a.y + 3]])
    if (ring < 19) for (let n = 0; n < 5; n++) { const outer = nodes[ring * 5 + n]!, inner = nodes[(ring + 1) * 5 + n]!; if (n === 4) route([[outer.x + 4, outer.y], [inner.x - 4, inner.y]]); else { const left = n === 0 || n === 3, top = n < 2, x = outer.x + (left ? 2 : -2); route([[x, outer.y + (top ? 3 : -3)], [x, inner.y], [inner.x + (left ? -4 : 4), inner.y]]) } }
  }
  const glyphs: Record<string, string> = { '1,3': '─', '0,2': '│', '1,2': '┌', '2,3': '┐', '0,1': '└', '0,3': '┘' }
  for (const [coordinate, exits] of connections) { const [x, y] = coordinate.split(',').map(Number); if (grid[y!]![x!] !== ' ') continue; const directions = [...exits].sort().join(','); grid[y!]![x!] = exits.size === 1 ? exits.has(0) || exits.has(2) ? '│' : '─' : glyphs[directions] ?? '┼' }
  const drawing = grid.map(row => row.join('').trimEnd()).join('\n'), name = 'graph-large-cli'
  expect(allPass(graph(name, drawing))).toBe(true)
  expect(status(graph(name, drawing.replace('►', '◄')), 'relationships')).toBe('failed')
})

test('unsupported textual or unqualified representations remain unknown instead of becoming node faults', () => {
  const checks = graph('graph-thick-python', 'Unsupported diagram family at this public boundary')
  expect(checks.every(row => row.status === 'unknown')).toBe(true)
  expect(classes('class-cardinality-python', 'classDiagram is not supported').every(row => row.status === 'unknown')).toBe(true)
  expect(states('state-loop-zombie', 'stateDiagram is not supported').every(row => row.status === 'unknown')).toBe(true)
})
