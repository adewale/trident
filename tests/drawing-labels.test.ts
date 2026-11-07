import { expect, test } from 'bun:test'
import { assessLabels, expectedLabels, labelFound, leakedSyntax, svgText, terminalText } from '../fidelity/drawing/labels.ts'

const flow: any = {
  id: 'fixture', family: 'flowchart', source: 'flowchart TD\nMermaid[Mermaid.js] -->|derivative| Beautiful[Beautiful Mermaid]\n', sourceGaps: [], geometry: [],
  expected: { nodes: [{ id: 'Mermaid', label: 'Mermaid.js' }, { id: 'Beautiful', label: 'Beautiful Mermaid' }], edges: [{ source: 'Mermaid', target: 'Beautiful', label: 'derivative' }], facts: { 'authored-config': { title: 'not a label' } } },
  terminal: { expected: { graph: { nodes: [{}, {}], edges: [{}] } } },
}

test('expected labels come from reviewed nodes, edges and named facts, not configuration', () => {
  expect(expectedLabels(flow)).toEqual(['Mermaid.js', 'Beautiful Mermaid', 'derivative'])
  const pie: any = { ...flow, expected: { facts: { title: 'Pets', slices: [{ label: 'Dogs', value: 0.8 }, { label: 'Cats', value: 0.2 }], 'show-data': false } } }
  expect(expectedLabels(pie)).toEqual(['Pets', 'Dogs', 'Cats'])
  const markdown: any = { ...flow, expected: { nodes: [{ id: 'a', label: '**Bold** and `code`<br>next' }] } }
  expect(expectedLabels(markdown)).toEqual(['Bold and code next'])
})

test('SVG text includes HTML labels and excludes styles and accessibility metadata', () => {
  const svg = '<svg><title>Mermaid.js</title><style>.label{}</style><g><foreignObject><div>Beautiful<br/>Mermaid</div></foreignObject><text><tspan>derivative</tspan></text></g></svg>'
  expect(svgText(svg).replace(/\s+/g, ' ').trim()).toBe('Beautiful Mermaid derivative')
  expect(assessLabels(flow, 'svg', svgText(svg))).toMatchObject({ status: 'incorrect', missing: ['Mermaid.js'] })
})

test('terminal labels wrapped inside boxes are still found', () => {
  const drawing = '┌────────────┐      ┌───────────┐\n│ Mermaid.js ├─────►│ Beautiful │\n└────────────┘ deri │ Mermaid   │\n               vative└───────────┘'
  expect(labelFound('Beautiful Mermaid', terminalText(drawing))).toBe(true)
  expect(assessLabels(flow, 'terminal', terminalText(drawing.replace('deri', 'deri ').replace('vative', 'derivative')))).toMatchObject({ status: 'correct' })
})

test('raw source syntax in the output is a failure even when labels are present', () => {
  const echoed = 'flowchart TD Mermaid[Mermaid.js] -->|derivative| Beautiful[Beautiful Mermaid]'
  expect(leakedSyntax(flow, echoed)).toEqual(['flowchart TD', 'Mermaid[Mermaid.js', 'Beautiful[Beautiful Mermaid', '|derivative|'])
  expect(assessLabels(flow, 'svg', echoed).status).toBe('incorrect')
  // ASCII art draws edge labels beside '|' line characters.
  expect(leakedSyntax(flow, '|derivative|', 'terminal')).toEqual([])
  // Very short identifiers are not checked: OCR and drawings produce such sequences by chance.
  expect(leakedSyntax({ ...flow, source: 'C4Context\nSystem(s, "S")', expected: { nodes: [{ id: 's', label: 'S' }] } }, 's[S')).toEqual([])
})

test('label matching is exact apart from whitespace and wrapping', () => {
  expect(labelFound('Prototype', 'Proto type')).toBe(true)
  expect(labelFound('Prototype', 'prototype')).toBe(false)
  expect(labelFound('Prototype', 'Prototvpe')).toBe(false)
})

test('SVG discretionary hyphenation is recognized only at explicit line transitions within one text', () => {
  const wrapped = svgText('<svg><text><tspan x="10" dy="0">Small</tspan><tspan x="10" dy="16">rectangl-</tspan><tspan x="10" dy="16">e</tspan></text></svg>')
  expect(labelFound('Small rectangle', wrapped)).toBe(true)
  expect(labelFound('Small rectanglx', wrapped)).toBe(false)
  const authored = svgText('<svg><text><tspan x="10">co-</tspan><tspan x="10" dy="16">operate</tspan></text></svg>')
  expect(labelFound('co-operate', authored)).toBe(true)
  const mixed = svgText('<svg><text><tspan x="10">co-</tspan><tspan x="10" dy="16">operat-</tspan><tspan x="10" dy="16">e</tspan></text></svg>')
  expect(labelFound('co-operate', mixed)).toBe(true)
  expect(labelFound('cooperate', 'co-operate')).toBe(false)
  for (const svg of [
    '<text><tspan>rectangl-</tspan><tspan>e</tspan></text>',
    '<text><tspan>rectangl-</tspan><tspan x="10" dy="0">e</tspan></text>',
    '<text><tspan>rectangl-</tspan></text><text><tspan x="10" dy="16">e</tspan></text>',
  ]) expect(labelFound('rectangle', svgText(svg))).toBe(false)
})

test('an empty diagram passes only without text; a case without labels is judged on raw syntax alone', () => {
  const empty: any = { ...flow, source: 'flowchart\n', expected: { nodes: [], edges: [], facts: {} }, terminal: { expected: { graph: { nodes: [], edges: [] } } } }
  expect(assessLabels(empty, 'svg', '   ').status).toBe('correct')
  expect(assessLabels(empty, 'svg', 'Syntax error').status).toBe('incorrect')
  const unlabeled: any = { ...flow, source: 'xychart-beta\n bar [1]', expected: { facts: { series: [{ kind: 'bar', values: [1] }] } }, terminal: { expected: {} } }
  expect(assessLabels(unlabeled, 'svg', 'a horizontal bar of length 1').status).toBe('correct')
  expect(assessLabels(unlabeled, 'terminal', 'bar [1]').status).toBe('incorrect')
  expect(assessLabels(unlabeled, 'svg', 'xychart-beta').status).toBe('incorrect')
})

test('a label written with an escape sequence is found in its visible forms', () => {
  expect(labelFound('\u001b[31mX', 'A [31mX B')).toBe(true)
  expect(labelFound('\u001b[31mX', 'A X B')).toBe(true)
  expect(labelFound('\u001b[31mX', 'A \u001b[31mX B')).toBe(true)
  expect(labelFound('\u001b[31mX', 'A Y B')).toBe(false)
})
