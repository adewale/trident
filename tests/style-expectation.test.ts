import { expect, test } from 'bun:test'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import { compileVisualStyles } from '../fidelity/style-expectation.ts'
const nodes = [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }]
const attribute = (property: string, value: string) => ({ property, value })
test('source class selectors compile independently to owned paint, and inline styles override class rules', () => {
  const result = compileVisualStyles({ labels: ['Alpha', 'Beta'], nodes, facts: { 'authored-style': [{ kind: 'classDef', selection: 'warm', attributes: [attribute('fill', 'red'), attribute('stroke', 'black')] }, { kind: 'class', selection: 'A', attributes: [{ class: 'warm' }] }, { kind: 'style', selection: 'A', attributes: [attribute('fill', 'blue')] }] } })
  expect(result.complete).toBe(true)
  expect(result.expected.facts?.['node-paint']).toEqual([{ id: 'A', properties: { fill: 'blue', stroke: 'black' } }])
  expect(result.expected.facts).not.toHaveProperty('authored-style')
})
test('default applies to unassigned nodes and inline class metadata becomes its visible effect', () => {
  const result = compileVisualStyles({ labels: [], nodes, facts: { 'node-attributes': [{ id: 'B', attributes: { classes: 'special', shape: 'rect' } }], 'authored-style': [{ kind: 'classDef', selection: 'default', attributes: [attribute('fill', 'blue'), attribute('stroke-width', '2px')] }, { kind: 'classDef', selection: 'special', attributes: [attribute('fill', 'red')] }] } })
  expect(result.expected.facts?.['node-paint']).toEqual([{ id: 'A', properties: { fill: 'blue', 'stroke-width': '2px' } }, { id: 'B', properties: { fill: 'red' } }])
  expect(result.expected.facts?.['node-attributes']).toEqual([{ id: 'B', attributes: { shape: 'rect' } }])
})
test('unknown properties and unbound selectors retain every raw required style fact', () => {
  for (const statement of [{ kind: 'style', selection: 'missing', attributes: [attribute('fill', 'red')] }, { kind: 'style', selection: 'A', attributes: [attribute('animation', 'pulse 1s')] }]) {
    const expected = { labels: [], nodes, facts: { 'authored-style': [statement] } }
    const result = compileVisualStyles(expected)
    expect(result.complete).toBe(false)
    expect(result.expected).toEqual(expected)
  }
})
test('source edge defaults and indexed overrides bind endpoints rather than renderer edge order', () => {
  const edges = [{ source: 'A', target: 'B', directed: true }, { source: 'B', target: 'A', directed: true }]
  const result = compileVisualStyles({ labels: [], nodes, edges, facts: { 'authored-style': [{ kind: 'linkStyle', selection: '1', attributes: [attribute('stroke', 'red')] }, { kind: 'linkStyle', selection: 'default', attributes: [attribute('stroke', 'blue'), attribute('stroke-width', '3px')] }] } })
  expect(result.complete).toBe(true)
  expect(result.expected.facts?.['edge-paint']).toEqual([{ edge: edges[0]!, properties: { stroke: 'blue', 'stroke-width': '3px' } }, { edge: edges[1]!, properties: { stroke: 'red', 'stroke-width': '3px' } }])
})

test('quadrant source point classes retain every unresolved radius/color/stroke definition', () => {
  // Literal declarations from pinned Mermaid quadrantChart.md:190. Class2
  // supplies every CampaignE property; F overrides only class3 color inline.
  const expected: MeaningExpectation = { labels: ['Campaign E', 'Campaign F'], facts: { points: [{ label: 'Campaign E', x: .5, y: .4 }, { label: 'Campaign F', x: .4, y: .5 }], 'point-appearance': [{ label: 'Campaign E', classes: 'class2', properties: {} }, { label: 'Campaign F', classes: 'class3', properties: { color: '#0000ff' } }], 'authored-style': [{ kind: 'classDef', selection: 'class2', attributes: [attribute('color', '#908342'), attribute('radius', '10'), attribute('stroke-color', '#310085'), attribute('stroke-width', '10px')] }, { kind: 'classDef', selection: 'class3', attributes: [attribute('color', '#f00fff'), attribute('radius', '10')] }] } }
  const result = compileVisualStyles(expected)
  expect(result.active).toBe(true)
  expect(result.complete).toBe(false)
  expect(result.expected).toEqual(expected)
  expect(result.expected.facts).toHaveProperty('authored-style')
})
test('a genuinely unused class definition remains nonvisual without inventing an assignment', () => {
  const result = compileVisualStyles({ labels: ['ENTITY'], nodes: [{ id: 'ENTITY', label: 'ENTITY' }], facts: { 'authored-style': [{ kind: 'classDef', selection: 'unusedFooBar', attributes: [attribute('font-size', '42px')] }] } })
  expect(result.complete).toBe(true)
  expect(result.expected.facts).not.toHaveProperty('authored-style')
  expect(result.expected.facts).not.toHaveProperty('node-paint')
})
