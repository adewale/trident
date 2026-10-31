import { expect, test } from 'bun:test'
import { projectVisualExpectation } from '../fidelity/visual-expectation.ts'
import type {MeaningExpectation} from '../fidelity/meaning.ts'

test('Git commit message metadata never substitutes for displayed ID/tag text and remains complete native data',()=>{
  const literal:MeaningExpectation={labels:['Shown','Tag'],facts:{commits:[{id:'commit:0',authoredId:'Shown',message:'private message',branch:'main',parents:[],type:'NORMAL',tags:['Tag']}]}}
  const visual=projectVisualExpectation('gitgraph',literal)
  expect(visual.expected.labels).toEqual(['Shown','Tag'])
  expect((visual.expected.facts!.commits as any[])[0]).not.toHaveProperty('message')
  expect(visual.expected.advisoryFacts!['nonvisual-commit-messages']).toEqual([{id:'commit:0',message:'private message'}])
  expect(visual.profileExpected).toEqual(literal)
})
test('Wardley pipeline parent projects to shared visibility and exact member range while preserving original point data',()=>{
  const literal:MeaningExpectation={labels:['Database','SQL','Cloud'],facts:{components:[{name:'Database',kind:'component',coordinates:[.4,.6]},{name:'Other',kind:'component',coordinates:[.8,.2]}],pipelines:[{component:'Database',members:[{name:'SQL',kind:'component',coordinates:[.25]},{name:'Cloud',kind:'component',coordinates:[.85]}]}]}}
  const visual=projectVisualExpectation('wardley',literal)
  expect((visual.expected.facts!.components as any[])[0]).toEqual({name:'Database',kind:'pipeline-group',visibility:.4})
  expect((visual.expected.facts!.components as any[])[1]).toEqual({name:'Other',kind:'component',coordinates:[.8,.2]})
  expect(visual.expected.facts!.pipelines).toEqual(literal.facts!.pipelines)
  expect(visual.expected.advisoryFacts!['pipeline-parent-native-coordinates']).toEqual([{name:'Database',coordinates:[.4,.6]}])
  expect(visual.profileExpected).toEqual(literal)
})

test('global layout hints become normative order only for a defensible simple chain', () => {
  const nodes = [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }, { id: 'C', label: 'C' }], chain = { labels: [], nodes, edges: [{ source: 'A', target: 'B', directed: true }, { source: 'B', target: 'C', directed: true }], facts: { direction: 'TD' } }
  expect(projectVisualExpectation('flowchart', chain).expected.facts?.direction).toBe('TD')
  const branching = projectVisualExpectation('flowchart', { ...chain, edges: [{ source: 'A', target: 'B', directed: true }, { source: 'A', target: 'C', directed: true }] }).expected
  expect(branching.facts).not.toHaveProperty('direction')
  expect(branching.advisoryFacts?.direction).toBe('TD')
})
test('complete class signature facts replace brittle literal signature display labels', () => {
  const expected = projectVisualExpectation('class', { labels: ['User', '+save() bool', '+String name'], facts: { members: [{ id: 'User', values: ['+save() bool', '+String name'] }] } }).expected
  expect(expected.labels).toEqual(['User'])
  expect(expected.facts?.members).toEqual([{ id: 'User', values: ['+save() bool', '+String name'] }])
  expect(projectVisualExpectation('class', { labels: ['IdCard'], nodes: [{ id: 'IdCard', label: 'IdCard' }], facts: { members: [{ id: 'Other', values: ['IdCard'] }] } }).expected.labels).toEqual(['IdCard'])
})

test('unprinted pie totals project to fractions; showData retains explicit absolute values', () => {
  const raw = { labels: ['A', 'B'], facts: { slices: [{ label: 'A', value: 7 }, { label: 'B', value: 3 }], 'show-data': false } }
  const doubled = { ...raw, facts: { ...raw.facts, slices: [{ label: 'A', value: 14 }, { label: 'B', value: 6 }] } }
  expect(projectVisualExpectation('pie', raw).expected).toEqual(projectVisualExpectation('pie', doubled).expected)
  expect(projectVisualExpectation('pie', { ...raw, facts: { ...raw.facts, 'show-data': true } }).expected.facts?.slices).toEqual(raw.facts.slices)
  expect(raw.facts.slices[0]?.value).toBe(7)
})
test('unheaded sequence messages preserve endpoints and chronology without claiming an invisible sender', () => {
  const raw = { labels: ['A', 'B', 'Hello'], facts: { 'message-order': [{ from: 'B', to: 'A', text: 'Hello' }], 'message-style': ['->'] } }
  expect(projectVisualExpectation('sequence', raw).expected.facts?.['message-order']).toEqual([{ from: 'A', to: 'B', text: 'Hello', direction: 'unprinted' }])
  expect(raw.facts['message-order'][0]?.from).toBe('B')
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

test('explicit owned source breaks become obligations independently of family text representation', () => {
  const raw = { labels: ['Line one\nLine two'], nodes: [{ id: 'A', label: 'Line one\nLine two' }], edges: [{ source: 'A', target: 'B', directed: true, label: 'Edge one\nEdge two' }], groups: [{ id: 'g', label: 'Group one\nGroup two', members: ['A'] }], facts: { title: 'Title one\nTitle two' } }
  const projected = projectVisualExpectation('flowchart', raw).expected
  expect(projected.facts?.['text-line-breaks']).toEqual([{ owner: { kind: 'node', id: 'A' }, lines: ['Line one', 'Line two'] }, { owner: { kind: 'edge', index: 0 }, lines: ['Edge one', 'Edge two'] }, { owner: { kind: 'group', id: 'g' }, lines: ['Group one', 'Group two'] }, { owner: { kind: 'title' }, lines: ['Title one', 'Title two'] }])
  expect(raw.facts).not.toHaveProperty('text-line-breaks')
})
