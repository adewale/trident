import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectGraphFamilyPaint, plannedGraphFamilyCriteria } from '../fidelity/paint-graph-families.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { chromiumExecutable } from './helpers/environment.ts'

let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const fixture = (name: string) => readFileSync(new URL('./fixtures/fidelity/' + name + '.svg', import.meta.url), 'utf8')
const svg = (body: string, width = 500, height = 260) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="font:14px sans-serif">${body}</svg>`
const rect = (id: string, x: number, y: number, width = 70, height = 40) => `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white" stroke="black"/><text x="${x + 5}" y="${y + 25}">${id}</text></g>`
const status = (checks: PaintCheck[], key: string) => checks.find(check => check.criterion === key)?.status
async function inspect(value: string, family: string, expected: MeaningExpectation, source = '') {
  const page = await browser.newPage()
  try {
    await page.setContent(value)
    const paint = await page.evaluate(inspectFidelityPaint, { family, expected })
    const graph = await page.evaluate(inspectGraphFamilyPaint, { family, source, expected, paint, quantitative: [] })
    return { paint, graph, checks: graph.checks }
  } finally { await page.close() }
}

test('group membership has its own planned obligation, including declared empty inventories', () => {
  expect(plannedGraphFamilyCriteria({ family: 'flowchart', expected: { labels: [], groups: [] } })).toEqual(['painted-group-membership'])
  expect(plannedGraphFamilyCriteria({ family: 'pie', expected: { labels: [], groups: [] } })).toEqual([])
})

test('new polygon and compound outlines require actual silhouette and internal strokes', async () => {
  const value = svg('<g><polygon points="25,20 110,20 95,70 10,70" fill="white" stroke="black"/><text x="35" y="50">Input</text></g><g><rect x="140" y="20" width="100" height="50" fill="white" stroke="black"/><path d="M148 20 L148 70 M232 20 L232 70" fill="none" stroke="black"/><text x="165" y="50">Tool</text></g><g><circle cx="310" cy="45" r="30" fill="white" stroke="black"/><circle cx="310" cy="45" r="26" fill="none" stroke="black"/><text x="294" y="50">End</text></g>')
  const expected = { labels: ['Input', 'Tool', 'End'], nodes: [{ id: 'A', label: 'Input' }, { id: 'B', label: 'Tool' }, { id: 'C', label: 'End' }], facts: { 'node-shapes': [{ id: 'A', shape: 'input' }, { id: 'B', shape: 'tool' }, { id: 'C', shape: 'double-circle' }] } }
  expect(status((await inspect(value, 'agentflow', expected)).checks, 'source-fact:node-shapes')).toBe('passed')
  expect(status((await inspect(value.replace('25,20 110,20 95,70 10,70', '10,20 110,20 110,70 10,70'), 'agentflow', expected)).checks, 'source-fact:node-shapes')).toBe('failed')
  expect(status((await inspect(value.replace('M148 20 L148 70 M232 20 L232 70', 'M148 20 L148 70'), 'agentflow', expected)).checks, 'source-fact:node-shapes')).toBe('failed')
  expect(status((await inspect(value.replace('<circle cx="310" cy="45" r="26" fill="none" stroke="black"/>', ''), 'agentflow', expected)).checks, 'source-fact:node-shapes')).toBe('failed')
})

test('curved document and cylinder silhouettes require their real waves and cap topology', async () => {
  const cylinder = svg('<g><path d="M20 40 A50 10 0 1 1 120 40 A50 10 0 1 1 20 40 L20 100 A50 10 0 0 0 120 100 L120 40" fill="white" stroke="black"/><text x="40" y="80">Store</text></g>'), document = svg('<g><path d="M20 30 H120 V100 C95 120 80 80 60 100 C45 115 30 110 20 100 Z" fill="white" stroke="black"/><text x="40" y="65">Store</text></g>')
  const expected = { labels: ['Store'], nodes: [{ id: 'S', label: 'Store' }], facts: { 'node-shapes': [{ id: 'S', shape: 'cylinder' }] } }
  expect(status((await inspect(cylinder, 'flowchart', expected)).checks, 'source-fact:node-shapes')).toBe('passed')
  const doc = structuredClone(expected); doc.facts['node-shapes'][0]!.shape = 'doc'
  expect(status((await inspect(document, 'flowchart', doc)).checks, 'source-fact:node-shapes')).toBe('passed')
  expect(status((await inspect(cylinder, 'flowchart', doc)).checks, 'source-fact:node-shapes')).toBe('failed')
  const plain = svg(rect('Store', 20, 30, 100, 80))
  expect(status((await inspect(plain, 'flowchart', doc)).checks, 'source-fact:node-shapes')).toBe('failed')
})

test('nested containers prove exact immediate members and reject borrowed descendant membership', async () => {
  const value = svg('<g class="cluster"><rect x="5" y="5" width="350" height="180" fill="white" stroke="black"/><text x="15" y="25">Outer</text><g class="cluster"><rect x="15" y="35" width="140" height="130" fill="white" stroke="black"/><text x="25" y="55">Inner</text>' + rect('Alpha', 35, 80) + '</g>' + rect('Beta', 220, 80) + '</g>')
  const expected = { labels: ['Alpha', 'Beta', 'Outer', 'Inner'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], groups: [{ id: 'outer', label: 'Outer', members: ['inner', 'B'] }, { id: 'inner', label: 'Inner', members: ['A'] }] }
  expect(status((await inspect(value, 'flowchart', expected)).checks, 'painted-group-membership')).toBe('passed')
  const wrong = { ...expected, groups: [{ ...expected.groups[0]!, members: ['inner', 'A', 'B'] }, { ...expected.groups[1]!, members: [] }] }
  expect(status((await inspect(value, 'flowchart', wrong)).checks, 'painted-group-membership')).toBe('failed')
  const extra = value.replace('</svg>', rect('Extra', 120, 195) + '</svg>')
  expect((await inspect(extra, 'flowchart', expected)).paint.checks.find((check: PaintCheck) => check.criterion === 'painted-node-ownership')?.status).toBe('failed')
})

for (const renderer of ['mermaid', 'pele']) test(renderer + ' retained sequence headers and complete loop interval use physical ownership', async () => {
  const input = expandedFidelityCases().find(item => item.id === 'features:sequence:notes-loop-reciprocal')!
  const value = fixture(renderer + '-sequence-messages'), result = await inspect(value, input.family, input.expected, input.source)
  expect(status(result.checks, 'source-fact:participant-order')).toBe('passed')
  expect(status(result.checks, 'source-fact:fragments')).toBe('passed')
  const expected = structuredClone(input.expected); expected.facts!['participant-order'] = ['B', 'A']
  expect(status((await inspect(value, input.family, expected, input.source)).checks, 'source-fact:participant-order')).toBe('failed')
  const wrong = structuredClone(input.expected); (wrong.facts!.fragments as any[])[0].endMessage = 3
  expect(status((await inspect(value, input.family, wrong, input.source)).checks, 'source-fact:fragments')).toBe('failed')
  const renamed = value.replaceAll('community-fidelity', 'arbitrary-output').replaceAll('pele', 'unrelated')
  expect(status((await inspect(renamed, input.family, input.expected, input.source)).checks, 'source-fact:fragments')).toBe('passed')
})

test('class annotations and cardinalities cannot borrow a matching label from the wrong endpoint or class', async () => {
  const value = svg('<g><rect x="10" y="60" width="120" height="110" fill="white" stroke="black"/><text x="20" y="85">Alpha</text><text x="20" y="110">«interface»</text></g>' + rect('Beta', 320, 60, 120, 110) + '<path d="M130 120 L320 120" fill="none" stroke="black"/><text x="140" y="110">1</text><text x="300" y="110">*</text>')
  const expected = { labels: ['Alpha', 'Beta', 'interface', '1', '*'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: false }], facts: { annotations: [{ id: 'A', annotation: 'interface' }], cardinalities: [{ from: 'A', to: 'B', left: '1', right: '*' }] } }
  const result = await inspect(value, 'class', expected)
  expect(status(result.checks, 'source-fact:annotations')).toBe('passed')
  expect(status(result.checks, 'source-fact:cardinalities')).toBe('passed')
  expect(status((await inspect(value.replace('x="140" y="110"', 'x="300" y="110"').replace('x="300" y="110">*', 'x="140" y="110">*'), 'class', expected)).checks, 'source-fact:cardinalities')).toBe('failed')
  const wrong = structuredClone(expected); wrong.facts.annotations[0]!.id = 'B'
  expect(status((await inspect(value, 'class', wrong)).checks, 'source-fact:annotations')).toBe('failed')
})

test('actual inline ER bars, optional circle and crow-foot topology prove endpoint cardinality', async () => {
  const expected = { labels: ['ALPHA', 'BETA', 'owns'], nodes: ['ALPHA', 'BETA'].map(id => ({ id, label: id })), edges: [{ source: 'ALPHA', target: 'BETA', directed: false, label: 'owns' }], facts: { cardinalities: [{ from: 'ALPHA', to: 'BETA', left: 'one-only', right: 'zero-or-many', identifying: true }] } }
  const value = fixture('pele-er-cardinality-bars')
  expect(status((await inspect(value, 'er', expected)).checks, 'source-fact:cardinalities')).toBe('passed')
  const wrong = structuredClone(expected); wrong.facts.cardinalities[0]!.left = 'zero-or-one'
  expect(status((await inspect(value, 'er', wrong)).checks, 'source-fact:cardinalities')).toBe('failed')
  expect(status((await inspect(value.replace('M51,62L61,62M51,66L61,66', 'M51,62L61,62'), 'er', expected)).checks, 'source-fact:cardinalities')).not.toBe('passed')
  expect(status((await inspect(value.replaceAll('pele', 'unrelated'), 'er', expected)).checks, 'source-fact:cardinalities')).toBe('passed')
})

test('architecture side ports and alignment bind actual endpoints and service centers', async () => {
  const value = svg(rect('Alpha', 20, 30) + rect('Beta', 230, 30) + '<path d="M90 50 L230 50" fill="none" stroke="black"/>')
  const expected = { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: false }], facts: { ports: [{ from: 'A', to: 'B', fromSide: 'R', toSide: 'L' }], alignments: [{ axis: 'row', ids: ['A', 'B'] }] } }
  const valid = await inspect(value, 'architecture', expected)
  expect(status(valid.checks, 'source-fact:ports')).toBe('passed')
  expect(status(valid.checks, 'source-fact:alignments')).toBe('passed')
  const wrong = structuredClone(expected); wrong.facts.ports[0]!.fromSide = 'T'
  expect(status((await inspect(value, 'architecture', wrong)).checks, 'source-fact:ports')).toBe('failed')
  expect(status((await inspect(value.replace('<path d="M90 50 L230 50"', '<path d="M105 50 L215 50"'), 'architecture', expected)).checks, 'source-fact:ports')).toBe('unavailable')
})

test('block grid order and spans use one measured column lattice', async () => {
  const value = svg(rect('Alpha', 20, 20, 60, 40) + rect('Beta', 90, 20, 130, 40) + rect('Gamma', 20, 90, 60, 40) + rect('Delta', 90, 90, 60, 40) + rect('Epsilon', 160, 90, 60, 40))
  const ids = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'], expected = { labels: ids, nodes: ids.map(id => ({ id, label: id })), facts: { 'grid-cell-order': ids.map((id, index) => ({ kind: 'node', id, parent: null, span: index === 1 ? 2 : 1 })), 'grid-columns': [{ group: null, value: 3 }] } }
  expect(status((await inspect(value, 'block', expected)).checks, 'source-fact:grid-cell-order')).toBe('passed')
  expect(status((await inspect(value.replace('width="130"', 'width="90"'), 'block', expected)).checks, 'source-fact:grid-cell-order')).toBe('failed')
  const wrong = structuredClone(expected); wrong.facts['grid-cell-order'] = [wrong.facts['grid-cell-order'][1]!, wrong.facts['grid-cell-order'][0]!, ...wrong.facts['grid-cell-order'].slice(2)]
  expect(status((await inspect(value, 'block', wrong)).checks, 'source-fact:grid-cell-order')).toBe('failed')
})

test('anonymous block boundaries bind exact descendant ink before receiving a source identity', async () => {
  const value = svg('<g><rect x="10" y="10" width="300" height="100" fill="white" stroke="black"/>' + rect('Alpha', 30, 35) + rect('Beta', 160, 35) + '</g>')
  const expected = { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], groups: [{ id: 'anonymous:0', label: '', members: ['A', 'B'] }], facts: { 'grid-cell-order': [{ kind: 'group', id: 'anonymous:0', parent: null, span: 1 }, { kind: 'node', id: 'A', parent: 'anonymous:0', span: 1 }, { kind: 'node', id: 'B', parent: 'anonymous:0', span: 1 }], 'grid-columns': [{ group: null, value: 1 }, { group: 'anonymous:0', value: 'auto' }] } }
  const valid = await inspect(value, 'block', expected)
  expect(status(valid.checks, 'painted-group:anonymous:0')).toBe('passed')
  expect(status(valid.checks, 'painted-group-membership')).toBe('passed')
  expect(status(valid.checks, 'source-fact:grid-cell-order')).toBe('passed')
  expect(status((await inspect(value.replace('width="300"', 'width="130"'), 'block', expected)).checks, 'source-fact:grid-cell-order')).not.toBe('passed')
})

test('state parallel regions require real dashed partitions and exact member ownership', async () => {
  const value = svg('<g class="cluster"><rect x="10" y="10" width="400" height="200" fill="white" stroke="black"/><text x="20" y="32">Active</text>' + rect('Alpha', 40, 55, 100) + rect('Beta', 40, 145, 100) + '<path d="M20 120H400" fill="none" stroke="black" stroke-dasharray="4 4"/></g>')
  const expected = { labels: ['Active', 'Alpha', 'Beta'], nodes: [{ id: 'Active', label: 'Active' }, { id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], groups: [{ id: 'Active', label: 'Active', members: ['A', 'B'] }], facts: { 'state-kinds': [{ id: 'Active', kind: 'composite-state' }, { id: 'A', kind: 'state' }, { id: 'B', kind: 'state' }], 'parallel-regions': [{ scope: 'Active', region: 0, members: ['A'] }, { scope: 'Active', region: 1, members: ['B'] }] } }
  const valid = await inspect(value, 'state', expected)
  expect(status(valid.checks, 'source-fact:parallel-regions')).toBe('passed')
  expect(status(valid.checks, 'painted-node-ownership')).toBe('passed')
  const wrong = structuredClone(expected); wrong.facts['parallel-regions'][0]!.members = ['B']; wrong.facts['parallel-regions'][1]!.members = ['A']
  expect(status((await inspect(value, 'state', wrong)).checks, 'source-fact:parallel-regions')).toBe('failed')
  expect(status((await inspect(value.replace('stroke-dasharray="4 4"', 'stroke-dasharray="none"'), 'state', expected)).checks, 'source-fact:parallel-regions')).not.toBe('passed')
})

test('unlabelled state roles are assigned only after unique actual glyph adjacency and scope', async () => {
  const value = svg('<defs><marker id="head" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z"/></marker></defs><circle cx="30" cy="70" r="8" fill="black"/>' + rect('Work', 100, 50, 80, 40) + '<circle cx="250" cy="70" r="10" fill="white" stroke="black"/><circle cx="250" cy="70" r="6" fill="black"/><path d="M38 70 L100 70" fill="none" stroke="black" marker-end="url(#head)"/><path d="M180 70 L240 70" fill="none" stroke="black" marker-end="url(#head)"/>')
  const expected = { labels: ['Work'], nodes: [{ id: 'start', label: '' }, { id: 'W', label: 'Work' }, { id: 'end', label: '' }], edges: [{ source: 'start', target: 'W', directed: true }, { source: 'W', target: 'end', directed: true }], facts: { pseudostates: [{ id: 'start', kind: 'start', scope: 'root' }, { id: 'end', kind: 'end', scope: 'root' }], 'state-kinds': [{ id: 'start', kind: 'pseudostate-start' }, { id: 'W', kind: 'state' }, { id: 'end', kind: 'pseudostate-end' }] } }
  const result = await inspect(value, 'state', expected)
  expect(status(result.checks, 'source-fact:pseudostates')).toBe('passed')
  expect(result.graph.nodes.length).toBe(3)
  const wrong = value.replace('<circle cx="250" cy="70" r="6" fill="black"/>', '')
  expect(status((await inspect(wrong, 'state', expected)).checks, 'source-fact:pseudostates')).not.toBe('passed')
  const symmetric = value.replace('</svg>', '<circle cx="30" cy="170" r="8" fill="black"/><path d="M38 170 L100 70" fill="none" stroke="black"/></svg>')
  expect(status((await inspect(symmetric, 'state', expected)).checks, 'painted-node-ownership')).not.toBe('passed')
  const crossedFinal = value.replace('</svg>', '<path d="M244 64L256 76 M244 76L256 64" fill="none" stroke="black"/></svg>')
  expect(status((await inspect(crossedFinal, 'state', expected)).checks, 'source-fact:pseudostates')).not.toBe('passed')
  const coveredStart = value.replace('</svg>', '<circle cx="30" cy="70" r="8" fill="white"/></svg>')
  expect(status((await inspect(coveredStart, 'state', expected)).checks, 'source-fact:pseudostates')).not.toBe('passed')
})

test('a hidden intermediate connector cannot pass because both visible endpoints and captions are correct', async () => {
  const body = rect('Alpha', 10, 60) + rect('Beta', 350, 60), path = '<path d="M80 80 L350 80" fill="none" stroke="black"/>'
  const expected = { labels: ['Alpha', 'Beta', 'Middle'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }, { id: 'C', label: 'Middle' }], edges: [{ source: 'A', target: 'B', directed: false }] }
  const clear = svg(body + path + rect('Middle', 190, 150)), hidden = svg(body + path + rect('Middle', 190, 60))
  expect(status((await inspect(clear, 'c4', expected)).checks, 'painted-route-visibility')).toBe('passed')
  const bad = await inspect(hidden, 'c4', expected)
  expect(status(bad.paint.checks, 'painted-relationships')).toBe('passed')
  expect(status(bad.checks, 'painted-route-visibility')).toBe('failed')
  const transparent = hidden.replace('<rect x="190" y="60" width="70" height="40" fill="white"', '<rect x="190" y="60" width="70" height="40" fill="none"')
  expect(status((await inspect(transparent, 'c4', expected)).checks, 'painted-route-visibility')).toBe('passed')
})

test('decorated class rows need actual generic text, italic abstract methods and underlined static members', async () => {
  const value = svg('<g><rect x="10" y="20" width="240" height="150" fill="white" stroke="black"/><text x="20" y="45">Alpha&lt;T&gt;</text><text x="20" y="70">«interface»</text><text x="20" y="100" font-style="italic">+execute() bool</text><text x="20" y="130" text-decoration="underline">+int count</text></g>')
  const expected = { labels: ['Alpha', 'interface'], nodes: [{ id: 'A', label: 'Alpha' }], facts: { generics: [{ id: 'A', parameter: 'T' }], annotations: [{ id: 'A', annotation: 'interface' }], members: [{ id: 'A', values: ['+execute() bool*', '+int count$'] }] } }
  const valid = await inspect(value, 'class', expected)
  expect(status(valid.checks, 'source-fact:generics')).toBe('passed')
  expect(status(valid.checks, 'source-fact:members')).toBe('passed')
  expect(status((await inspect(value.replace('+int count', '+ count:int'), 'class', expected)).checks, 'source-fact:members')).toBe('passed')
  expect(status((await inspect(value.replace('+int count', '+ count:long'), 'class', expected)).checks, 'source-fact:members')).toBe('failed')
  expect(status((await inspect(value.replace('font-style="italic"', 'font-style="normal"'), 'class', expected)).checks, 'source-fact:members')).toBe('failed')
  expect(status((await inspect(value.replace('text-decoration="underline"', 'text-decoration="none"'), 'class', expected)).checks, 'source-fact:members')).toBe('failed')
  const wrong = value.replace('Alpha&lt;T&gt;', 'Alpha&lt;U&gt;')
  expect(status((await inspect(wrong, 'class', expected)).checks, 'source-fact:generics')).toBe('failed')
})

test('source style selections compile to owned body and text paint without matching class names', async () => {
  const value = svg('<g><rect x="10" y="20" width="160" height="70" fill="red" stroke="black" stroke-width="3"/><text x="20" y="50" fill="blue" font-weight="bold">Alpha</text></g>')
  const expected = { labels: ['Alpha'], nodes: [{ id: 'A', label: 'Alpha' }], facts: { 'authored-style': [{ kind: 'classDef', selection: 'important', attributes: [{ property: 'fill', value: 'red' }, { property: 'color', value: 'blue' }, { property: 'font-weight', value: 'bold' }, { property: 'stroke-width', value: '3px' }] }, { kind: 'class', selection: 'A', attributes: [{ class: 'important' }] }] } }
  expect(status((await inspect(value, 'flowchart', expected)).checks, 'source-fact:authored-style')).toBe('passed')
  expect(status((await inspect(value.replace('fill="blue"', 'fill="green"'), 'flowchart', expected)).checks, 'source-fact:authored-style')).toBe('failed')
  expect(status((await inspect(value.replace('stroke-width="3"', 'stroke-width="1"'), 'flowchart', expected)).checks, 'source-fact:authored-style')).toBe('failed')
})

test('C4 elements own all visible properties, including a separate type and exact description', async () => {
  const value = svg('<g><rect x="10" y="20" width="240" height="140" fill="white" stroke="black"/><text x="20" y="45">Alpha</text><text x="20" y="70">[Software System]</text><text x="20" y="100">Handles requests</text></g>')
  const expected = { labels: ['Alpha', 'Handles requests'], nodes: [{ id: 'A', label: 'Alpha' }], facts: { elements: [{ id: 'A', kind: 'System', label: 'Alpha', extraVisibleFields: ['Handles requests'] }] } }
  expect(status((await inspect(value, 'c4', expected)).checks, 'source-fact:elements')).toBe('passed')
  expect(status((await inspect(value.replace('Handles requests', 'Drops requests'), 'c4', expected)).checks, 'source-fact:elements')).not.toBe('passed')
  const extra = value.replace('</g>', '<text x="20" y="130">Invented field</text></g>')
  expect(status((await inspect(extra, 'c4', expected)).checks, 'source-fact:elements')).toBe('failed')
})

test('C4 type technology and description values cannot swap their visible field roles', async () => {
  const value = svg('<g><rect x="10" y="20" width="240" height="140" fill="white" stroke="black"/><text x="20" y="45" font-weight="bold">Alpha</text><text x="20" y="70" font-size="12">[Container: TypeScript]</text><text x="20" y="100">Service</text></g>')
  const expected = { labels: ['Alpha', 'TypeScript', 'Service'], nodes: [{ id: 'A', label: 'Alpha' }], facts: { elements: [{ id: 'A', kind: 'Container', label: 'Alpha', extraVisibleFields: ['TypeScript', 'Service'] }] } }
  expect(status((await inspect(value, 'c4', expected)).checks, 'source-fact:elements')).toBe('passed')
  const swapped = value.replace('[Container: TypeScript]', '[Container: Service]').replace('>Service</text>', '>TypeScript</text>')
  expect(status((await inspect(swapped, 'c4', expected)).checks, 'source-fact:elements')).toBe('failed')
})

test('an external usecase actor label needs a real connected head, spine, arms and legs', async () => {
  const value = svg('<g><circle cx="70" cy="40" r="10" fill="white" stroke="black"/><path d="M70 50L70 80 M50 60L90 60 M70 80L50 110 M70 80L90 110" fill="none" stroke="black"/><text x="50" y="140">User</text></g>')
  const expected = { labels: ['User'], nodes: [{ id: 'U', label: 'User' }], facts: { 'node-shapes': [{ id: 'U', shape: 'actor-stick' }], 'dialect-kinds': [{ id: 'U', kind: 'actor' }] } }
  const result = await inspect(value, 'usecase', expected)
  expect(status(result.checks, 'painted-node-ownership')).toBe('passed')
  expect(status(result.checks, 'source-fact:node-shapes')).toBe('passed')
  expect(status(result.checks, 'source-fact:dialect-kinds')).toBe('passed')
  expect(status((await inspect(value.replace(' M70 80L90 110', ''), 'usecase', expected)).checks, 'source-fact:node-shapes')).not.toBe('passed')
  expect(status((await inspect(value.replace('y="140">User', 'y="220">User'), 'usecase', expected)).checks, 'painted-node-ownership')).not.toBe('passed')
})

test('C4 explicit row limits are falsifiable even when another requested style offset is unknown', async () => {
  const ids = ['A', 'B', 'C', 'D'], value = svg(ids.map((id, i) => rect(id, 10 + 100 * i, 30)).join(''))
  const expected: MeaningExpectation = { labels: ids, nodes: ids.map(id => ({ id, label: id })), facts: { 'authored-style': [{ kind: 'UpdateLayoutConfig', positions: [], attributes: { c4ShapeInRow: '3' } }, { kind: 'UpdateRelStyle', positions: ['A', 'B'], attributes: { offsetX: '5' } }] } }
  expect(status((await inspect(value, 'c4', expected)).checks, 'source-fact:authored-style')).toBe('failed')
  const valid = value.replace('<rect x="310" y="30"', '<rect x="10" y="130"').replace('<text x="315" y="55">D', '<text x="15" y="155">D')
  expect(status((await inspect(valid, 'c4', expected)).checks, 'source-fact:authored-style')).toBe('unavailable')
  const noOffset = structuredClone(expected); (noOffset.facts!['authored-style'] as any[]).pop()
  expect(status((await inspect(valid, 'c4', noOffset)).checks, 'source-fact:authored-style')).toBe('passed')
})

test('note line breaks need the actual owned note body and separate physical glyph rows', async () => {
  const value = svg('<defs><marker id="head" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z"/></marker></defs>' + rect('Alpha', 20, 20, 70, 30) + rect('Beta', 320, 20, 70, 30) + '<path d="M55 50L55 230" fill="none" stroke="black"/><path d="M355 50L355 230" fill="none" stroke="black"/><rect x="90" y="70" width="170" height="45" fill="lightyellow" stroke="black"/><text><tspan x="100" y="87">Line one</tspan><tspan x="100" y="107">Line two</tspan></text><path d="M55 150L355 150" fill="none" stroke="black" marker-end="url(#head)"/><text x="180" y="140">Request</text>')
  const expected = { labels: ['Alpha', 'Beta', 'Line one Line two', 'Request'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true, label: 'Request' }], facts: { notes: [{ side: 'over', actors: ['A', 'B'], text: 'Line one\nLine two', afterMessage: 0, fragmentScope: [] }], 'text-line-breaks': [{ owner: { kind: 'note', index: 0 }, lines: ['Line one', 'Line two'] }] } }
  const valid = await inspect(value, 'sequence', expected)
  expect(status(valid.checks, 'source-fact:notes')).toBe('passed')
  expect(status(valid.checks, 'source-fact:text-line-breaks')).toBe('passed')
  const collapsed = value.replace('<text><tspan x="100" y="87">Line one</tspan><tspan x="100" y="107">Line two</tspan></text>', '<text x="100" y="100">Line one Line two</text>')
  expect(status((await inspect(collapsed, 'sequence', expected)).checks, 'source-fact:text-line-breaks')).toBe('failed')
})
