import { expect, test } from 'bun:test'
import { projectVisualExpectation } from '../fidelity/visual-expectation.ts'

test('unprinted pie totals project to fractions; showData retains explicit absolute values', () => {
  const raw = { labels: ['A', 'B'], facts: { slices: [{ label: 'A', value: 7 }, { label: 'B', value: 3 }], 'show-data': false } }
  const doubled = { ...raw, facts: { ...raw.facts, slices: [{ label: 'A', value: 14 }, { label: 'B', value: 6 }] } }
  expect(projectVisualExpectation('pie', raw).expected).toEqual(projectVisualExpectation('pie', doubled).expected)
  expect(projectVisualExpectation('pie', { ...raw, facts: { ...raw.facts, 'show-data': true } }).expected.facts?.slices).toEqual(raw.facts.slices)
  expect(raw.facts.slices[0]?.value).toBe(7)
})
test('Sankey geometry permits common rescaling only when printed values are disabled', () => {
  const links = [{ source: 'A', target: 'B', value: 7 }, { source: 'A', target: 'C', value: 3 }]
  const raw = { labels: ['A', 'B', 'C'], facts: { links, 'authored-config': { sankey: { showValues: false } } } }
  const doubled = { ...raw, facts: { ...raw.facts, links: links.map(link => ({ ...link, value: link.value * 2 })) } }
  expect(projectVisualExpectation('sankey', raw).expected).toEqual(projectVisualExpectation('sankey', doubled).expected)
  const printed = projectVisualExpectation('sankey', { labels: raw.labels, facts: { links } }).expected.facts as any
  expect(printed['show-values']).toBe(true)
  expect(printed['displayed-node-values']).toEqual([{ id: 'A', value: 10, display: '10' }, { id: 'B', value: 7, display: '7' }, { id: 'C', value: 3, display: '3' }])
})
test('treemap sibling areas include aggregate subtree weights; default printed values remain absolute', () => {
  const raw = { labels: ['Root', 'A', 'B'], nodes: [{ id: 'Root', label: 'Root' }, { id: 'Root/A', label: 'A' }, { id: 'Root/B', label: 'B' }], facts: { values: [{ id: 'Root/A', value: 7 }, { id: 'Root/B', value: 3 }] } }
  const projected = projectVisualExpectation('treemap', raw).expected.facts as any
  expect(projected.values).toEqual([{ id: 'Root', value: 1 }, { id: 'Root/A', value: .7 }, { id: 'Root/B', value: .3 }])
  expect(projected['displayed-values']).toEqual([{ id: 'Root', value: 10, format: ',' }, { id: 'Root/A', value: 7, format: ',' }, { id: 'Root/B', value: 3, format: ',' }])
  expect(projectVisualExpectation('treemap', { ...raw, facts: { ...raw.facts, 'authored-config': { treemap: { showValues: false } } } }).expected.facts).not.toHaveProperty('displayed-values')
})
