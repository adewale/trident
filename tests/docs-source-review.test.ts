import { expect, test } from 'bun:test'
import { admitDocsReviews, assessDocsDrawing } from '../unified/docs-drawings.ts'
import { docsSourcePin, requiredDocumentationObligations, reviewDocumentationSource } from '../unified/docs-source-review.ts'

const input = (source: string, id = 'source-control') => ({ id, family: 'source-control', source })
const review = (source: string) => reviewDocumentationSource(input(source))
const facts = (source: string) => review(source).expected!.facts!

test('literal IDs and labels do not inherit JavaScript object properties or unintended Markdown', () => {
  const row = review('flowchart LR\n__proto__[__proto__] --> constructor[constructor]\nconstructor --> toString[toString]')
  expect(row.expected!.nodes).toEqual([{ id: '__proto__', label: '__proto__' }, { id: 'constructor', label: 'constructor' }, { id: 'toString', label: 'toString' }])
  expect(row.expected!.edges).toHaveLength(2)
  expect(review('pie\n"__proto__": 1\n"constructor": 2\n"toString": 3').expected!.labels).toEqual(['__proto__', 'constructor', 'toString'])
  expect(review('flowchart LR\nA["**literal** _text_"] --> B["`**formatted** _text_`"]\nC["`x_y_z`"]\nD["#quot;quote#quot;<br>next"]').expected!.nodes).toEqual([{ id: 'A', label: '**literal** _text_' }, { id: 'B', label: 'formatted text' }, { id: 'C', label: 'x_y_z' }, { id: 'D', label: '"quote"\nnext' }])
})

test('written endpoints, reversed markers, multiplicity, hidden edges and grouping remain separate obligations', () => {
  const row = review('flowchart LR\nsubgraph g[Group]\nA[Alpha] & B[Beta] -->|go| C[Gamma]\nend\nC <-- D[Delta]\nA <--> B\nB ~~~ D')
  expect(row.expected!.edges).toEqual([{ source: 'A', target: 'C', directed: true, label: 'go', startMarker: 'none', endMarker: 'arrow' }, { source: 'B', target: 'C', directed: true, label: 'go', startMarker: 'none', endMarker: 'arrow' }, { source: 'C', target: 'D', directed: true, startMarker: 'arrow', endMarker: 'none' }, { source: 'A', target: 'B', directed: true, startMarker: 'arrow', endMarker: 'arrow' }])
  expect(row.expected!.groups).toEqual([{ id: 'g', label: 'Group', members: ['A', 'B', 'C'] }])
  expect(row.expected!.facts!['layout-constraints']).toEqual([{ source: 'B', target: 'D', relation: 'invisible' }])
})

test('edge attribute updates never invent a visible node for the edge identifier', () => {
  const row = review('flowchart LR\nA e1@--> B\ne1@{ animate: true }')
  expect(row.expected!.nodes!.map(node => node.id)).toEqual(['A', 'B'])
  expect(row.expected!.facts!['edge-attributes']).toEqual([{ id: 'e1', attributes: { animate: true } }])
})

test('state triple-colon classes are neither labels nor transition captions', () => {
  const row = review('stateDiagram\n[*] --> Still:::plain\nStill:::plain --> Moving:::moving\nMoving --> Still\nMoving --> Crash:::bad\nCrash --> [*]\nStill --> [*]')
  expect(row.expected!.edges).toHaveLength(6)
  expect(row.expected!.labels).toEqual(['Still', 'Moving', 'Crash'])
  expect(row.expected!.edges!.every(edge => !edge.label)).toBe(true)
  expect(row.expected!.facts!['state-classes']).toContainEqual({ id: 'Still', class: 'plain' })
})

test('class declarations and members do not get consumed as CSS class directives', () => {
  const value = facts('classDiagram\nclass Bird {\n+String name\n+fly() bool\n}\nclass Duck:::bird\nBird <|-- Duck\nclassDef bird fill:red')
  expect(value.members).toEqual([{ id: 'Bird', values: ['+String name', '+fly() bool'] }, { id: 'Duck', values: [] }])
  expect(value['edge-appearance']).toContainEqual({ from: 'Bird', to: 'Duck', stroke: 'solid' })
})

test('entity cardinality aliases, attributes, groups and layout remain explicit', () => {
  const row = review('erDiagram\ndirection LR\nsubgraph domain[Domain]\np[Person] {\nstring name PK "legal name"\n}\np one or zero optionally to many(0) CAR : owns\nend')
  expect(row.expected!.facts!.cardinalities).toEqual([{ from: 'p', to: 'CAR', left: 'zero-or-one', right: 'zero-or-many', identifying: false }])
  expect(row.expected!.facts!.attributes).toEqual([{ id: 'p', values: [{ name: 'name', type: 'string', keys: ['PK'], comment: 'legal name' }] }, { id: 'CAR', values: [] }])
  expect(row.expected!.groups).toEqual([{ id: 'domain', label: 'Domain', members: ['p', 'CAR'] }])
})

test('sequence order, aliases, notes and activation retain more than common labels', () => {
  const row = review('sequenceDiagram\nparticipant A as Alice\nactor B as Bob\nA->>+B: request\nNote right of B: waiting\nB-->>-A: response')
  expect(row.expected!.facts!['message-order']).toEqual([{ from: 'A', to: 'B', text: 'request' }, { from: 'B', to: 'A', text: 'response' }])
  expect(row.expected!.facts!['message-style']).toEqual(['->>', '-->>'])
  expect(row.expected!.facts!.notes).toEqual([{ side: 'right of', actors: ['B'], text: 'waiting', afterMessage: 1 }])
  expect(row.expected!.facts!.lifecycles).toEqual([{ kind: 'activate', actor: 'B', beforeMessage: 1 }, { kind: 'deactivate', actor: 'A', beforeMessage: 2 }])
})

test('numeric chart contracts preserve exact source quantities and authored axes', () => {
  expect(facts('pie showData title Mix\n"__proto__": 2\n"Other": 3').slices).toEqual([{ label: '__proto__', value: 2 }, { label: 'Other', value: 3 }])
  expect(facts('packet-beta\n0-3: "Type"\n+4: "Length"').fields).toEqual([{ label: 'Type', start: 0, end: 3 }, { label: 'Length', start: 4, end: 7 }])
  expect(facts('xychart-beta horizontal\nx-axis "Month" [Jan, Feb]\ny-axis "Count" 0 --> 10\nbar "First" [2, 9]').series).toEqual([{ kind: 'bar', values: [2, 9], label: 'First' }])
  expect(facts('radar-beta\naxis a["First"], b["Second"]\ncurve c["C"]{2,5}').range).toEqual([0, 5])
  expect(facts('sankey-beta\n"A, source",B,4').links).toEqual([{ source: 'A, source', target: 'B', value: 4 }])
})

test('ordered chart and hierarchy controls preserve values and ancestry', () => {
  expect(facts('timeline\nsection First\n2020 : One : Two\n: Three').periods).toEqual([{ section: 'First', period: '2020', events: ['One', 'Two', 'Three'] }])
  expect(facts('journey\nsection Morning\nCoffee: 5: Alice, Bob').tasks).toEqual([{ label: 'Coffee', score: 5, actors: ['Alice', 'Bob'], section: 'Morning' }])
  expect(facts('treemap-beta\n"Root"\n  "Leaf": 7:::special').hierarchy).toEqual([{ id: 'Root', parent: '' }, { id: 'Root/Leaf', parent: 'Root', class: 'special' }])
  expect(facts('treeView\nroot/\n├── child/\n│   └── file.txt').hierarchy).toEqual([{ id: 'root', parent: '', directory: true }, { id: 'root/child', parent: 'root', directory: true }, { id: 'root/child/file.txt', parent: 'root/child', directory: false }])
  expect(facts('mindmap\nroot((Root))\n  bang))Alert((').hierarchy).toEqual([{ id: 'root', parent: '', shape: 'circle' }, { id: 'bang', parent: 'root', shape: 'bang' }])
})

test('new dialects retain domain obligations rather than masquerading as simple flowcharts', () => {
  expect(facts('agentflow-beta TB\nflow team[Team]\na[Work]@{ shape: task }\nend')['dialect-kinds']).toEqual([{ id: 'team', kind: 'agent-flow' }])
  expect(facts('block\ncolumns 3\na:2 space b')['grid-cell-order']).toEqual([{ kind: 'node', id: 'a', parent: null, span: 2 }, { kind: 'space', parent: null, span: 1 }, { kind: 'node', id: 'b', parent: null, span: 1 }])
  expect(facts('eventmodeling\ntf 01 ui Cart\nrf 02 rmo Items ->> 01').frames).toEqual([{ id: '01', resets: false, kind: 'ui', label: 'Cart', dataReference: null, fields: [], readsFrom: [] }, { id: '02', resets: true, kind: 'read-model', label: 'Items', dataReference: null, fields: [], readsFrom: ['01'] }])
  expect((facts('kanban\nTodo\n  a[Work]@{ priority: High }').columns as any[])[0].tasks).toEqual([{ id: 'a', label: 'Work', attributes: { priority: 'High' } }])
})

test('railroad contracts retain expression structure and grammar dialect', () => {
  expect(facts('railroad-ebnf-beta\nnumber = sign? digit+ ;')['grammar-rules']).toEqual([{ name: 'number', expression: { kind: 'sequence', items: [{ kind: 'repeat', minimum: 0, maximum: 1, expression: { kind: 'reference', value: 'sign' } }, { kind: 'repeat', minimum: 1, maximum: null, expression: { kind: 'reference', value: 'digit' } }] } }])
  expect((facts('railroad-peg-beta\nname <- !keyword letter ;')['grammar-rules'] as any[])[0].expression.items[0].kind).toBe('negative-lookahead')
})

test('accessibility title and description are metadata obligations, distinct from painted title', () => {
  const row = review('flowchart TB\naccTitle: Accessible\naccDescr {\nDescription one.\nDescription two.\n}\nA --> B')
  expect(row.expected!.facts!['accessibility-title']).toBe('Accessible')
  expect(row.expected!.facts!['accessibility-description']).toBe('Description one.\nDescription two.')
  expect(row.expected!.labels).toEqual(['A', 'B'])
})

test('unknown syntax, malformed styles and stale or contradictory review contracts cannot qualify', () => {
  const stimulus = input('pie\n"One": 1\nmystery unsupported syntax'), row = reviewDocumentationSource(stimulus)
  expect(row.sourceReview.expectedFactsComplete).toBe(false)
  expect(admitDocsReviews([stimulus], [row])[0]!.intent).toBe('source-review-pending')
  expect(assessDocsDrawing(stimulus, row, 'passed', true, []).status).toBe('unknown')
  expect(review('block\nA\nstyle A fill#969').sourceReview.expectedFactsComplete).toBe(false)
  expect(() => admitDocsReviews([stimulus], [{ ...row, sourceReview: { ...row.sourceReview, expectedFactsComplete: true } }])).toThrow('contradictory')
  expect(() => admitDocsReviews([stimulus], [{ ...row, sourceReview: { ...row.sourceReview, sourcePin: '0'.repeat(40) } }])).toThrow('stale')
  expect(() => admitDocsReviews([stimulus], [{ ...row, sourceReview: { ...row.sourceReview, requiredObligations: [] } }])).toThrow('contradictory')
  expect(() => admitDocsReviews([{ ...stimulus, source: stimulus.source + '\n"Two": 2' }], [row])).toThrow('stale')
  expect(row.sourceReview.sourcePin).toBe(docsSourcePin)
})

test('a source quantity mutation changes its independent expected answer and bound obligations', () => {
  const first = review('pie\n"A": 1\n"B": 9'), second = review('pie\n"A": 9\n"B": 1')
  expect(first.expected!.labels).toEqual(second.expected!.labels)
  expect(first.expected!.facts!.slices).not.toEqual(second.expected!.facts!.slices)
  expect(first.sourceSha256).not.toBe(second.sourceSha256)
  expect(first.sourceReview.requiredObligations).toEqual(requiredDocumentationObligations(first.expected))
  expect(first.sourceReview.requiredObligations).toContain('fact:slices')
})
