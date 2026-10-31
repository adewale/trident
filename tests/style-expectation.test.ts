import { expect, test } from 'bun:test'
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
