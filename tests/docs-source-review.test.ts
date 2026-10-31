import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { documentationSourceAudit } from '../scripts/review-docs-sources.ts'
import { admitDocsReviews, assessDocsDrawing } from '../unified/docs-drawings.ts'
import { docsSourcePin, requiredDocumentationObligations, reviewDocumentationSource } from '../unified/docs-source-review.ts'

const input = (source: string, id = 'source-control') => ({ id, family: 'source-control', source })
const review = (source: string) => reviewDocumentationSource(input(source), { visual: false })
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
  expect(row.expected!.facts!.lifecycles).toEqual([{ kind: 'activate', actor: 'B', beforeMessage: 1 }, { kind: 'deactivate', actor: 'B', beforeMessage: 2 }])
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

test('sequence box colors are separate from labels, while ordinary multiword labels remain intact', () => {
  const row = review('sequenceDiagram\nbox Purple Alice & John\nparticipant A\nparticipant J\nend\nbox Another Group\nparticipant B\nend\nA->>B: hi')
  expect(row.expected!.groups!.map(group => group.label)).toEqual(['Alice & John', 'Another Group'])
  expect(row.expected!.facts!['box-appearance']).toEqual([{ id: 'box:0', color: 'Purple' }])
})

test('ordered JSON tables keep integer-key source order, nested paths and last duplicate values', () => {
  const row = review('usecase-beta\njson Data@{ "2": "second", "1": "first", "__proto__": true, "n": null, "nested": { "x": 2 }, "items": ["A", "B"], "empty": {}, "2": "last" }')
  const table = (row.expected!.facts!['dialect-kinds'] as any[])[0]
  expect(table.rows).toEqual([{ path: '2', value: 'last', kind: 'string' }, { path: '1', value: 'first', kind: 'string' }, { path: '__proto__', value: 'true', kind: 'boolean' }, { path: 'n', value: 'null', kind: 'null' }, { path: 'nested.x', value: '2', kind: 'number' }, { path: 'items[0]', value: 'A', kind: 'string' }, { path: 'items[1]', value: 'B', kind: 'string' }, { path: 'empty', value: '{}', kind: 'object' }])
  expect(row.sourceReview.expectedFactsComplete).toBe(true)
  expect(review('usecase-beta\njson Data@[1,2]').sourceReview.expectedFactsComplete).toBe(false)
})

test('point styles, Venn region membership and Wardley annotation coordinates stay in expected facts', () => {
  expect(facts('quadrantChart\nA:::special: [0.2, 0.8] radius: 12, color: #f00')['point-appearance']).toEqual([{ label: 'A', classes: 'special', properties: { radius: '12', color: '#f00' } }])
  const venn = facts('venn-beta\nset A["Alpha"]:20\n  text t["Inside"]\nset B:12\nunion A,B["Both"]:3')
  expect(venn.sets).toEqual([{ id: 'A', label: 'Alpha', size: 20 }, { id: 'B', label: 'B', size: 12 }])
  expect(venn['region-texts']).toEqual([{ id: 't', label: 'Inside', owner: { kind: 'set', id: 'A' } }])
  expect(facts('wardley-beta\ncomponent Database [0.5, 0.4] (buy) (inertia)\nannotations [0.1, 0.2]\nannotation 1,[0.3, 0.4] "Risk"').annotations).toEqual([{ kind: 'numbered-annotation', number: 1, coordinates: [0.3, 0.4], text: 'Risk' }])
})

test('ZenUML sync nesting, explicit async senders, returns and control regions preserve order', () => {
  const value = facts('zenuml\nClient->A.method() {\nB.nested() {\nreturn answer\n}\nif(ready) {\nB->Client: done\n}\n}')
  const events = value['zenuml-event-order'] as any[]
  expect(events.map(event => [event.kind, event.from, event.to])).toEqual([['sync', 'Client', 'A'], ['sync', 'A', 'B'], ['return', 'B', 'A'], ['async', 'B', 'Client']])
  expect((value['control-regions'] as any[])[0]).toMatchObject({ kind: 'if', condition: 'ready', beginEvent: 3, endEvent: 4 })
})

test('shared agentflow nodes stay at top level when referenced inside multiple flows', () => {
  const row = review('agentflow-beta TB\nglobal\ncorpus[Shared]\nend\nflow a[First]\nx[Work]\nx -.- corpus\nend\nflow b[Second]\ny[Other]\ny -.- corpus\nend')
  expect(row.expected!.groups).toEqual([{ id: 'a', label: 'First', members: ['x'] }, { id: 'b', label: 'Second', members: ['y'] }])
  expect(row.expected!.facts!['global-node-scope']).toEqual(['corpus'])
})

test('fontawesome glyph references are resource obligations rather than literal visible words', () => {
  const row = review('flowchart TD\nA["fa:fa-twitter for peace"] --> B(fa:fa-spinner)')
  expect(row.expected!.nodes).toEqual([{ id: 'A', label: 'for peace' }, { id: 'B', label: '' }])
  expect(row.expected!.facts!['embedded-icons']).toEqual([{ id: 'A', icons: [{ reference: 'fa:fa-twitter', textOffset: 0 }] }, { id: 'B', icons: [{ reference: 'fa:fa-spinner', textOffset: 0 }] }])
})


test('the full pinned corpus keeps all 548 occurrences and 546 distinct literal diagrams', () => {
  const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString())
  const audit = documentationSourceAudit(inventory)
  const committed = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8'))
  expect(inventory.occurrences).toBe(548)
  expect(inventory.distinct).toBe(546)
  expect(audit.reviews).toEqual(committed)
  expect(audit.admitted).toHaveLength(548)
  expect(audit.pending.map(row => row.id)).toEqual(['packages/mermaid/src/docs/syntax/block.md:488', 'packages/mermaid/src/docs/syntax/flowchart.md:844', 'packages/mermaid/src/docs/syntax/gantt.md:519'])
  expect(audit.reviews.filter(row => row.intent === 'configuration-only').map(row => row.id)).toEqual(['packages/mermaid/src/docs/syntax/gantt.md:291'])
  expect(audit.reviews.filter(row => row.intent === 'drawing' && row.sourceReview.expectedFactsComplete)).toHaveLength(544)
  for (const row of audit.reviews) if (row.intent === 'drawing') { expect(Object.keys(row.expected!.facts!).length).toBeGreaterThan(0); expect(row.sourceReview.requiredObligations.some(obligation => obligation.startsWith('fact:'))).toBe(true) }
  const shared = new Map<string, string[]>()
  for (const row of inventory.cases) { const ids = shared.get(row.source.trim()) ?? []; ids.push(row.id); shared.set(row.source.trim(), ids) }
  expect([...shared.values()].filter(ids => ids.length > 1).map(ids => ids.length).sort()).toEqual([2, 2])
})


test('usecase label delimiters do not replace actor geometry or default ellipse semantics', () => {
  const row = review('usecase-beta\nactor Normal("Normal actor")\nactor Hollow("Other")@{ type: hollow }\nLogin("Sign in")\nReport[Generate report]\n"Reset password"\nNormal --> Implied\nsystemBoundary service[Service]@{ type: package }\nWork("Do work")\nend')
  expect(row.expected!.facts!['node-shapes']).toEqual([{ id: 'Normal', shape: 'actor-stick' }, { id: 'Hollow', shape: 'actor-hollow' }, { id: 'Login', shape: 'ellipse' }, { id: 'Report', shape: 'rectangle' }, { id: 'Reset_password', shape: 'ellipse' }, { id: 'Work', shape: 'ellipse' }, { id: 'Implied', shape: 'ellipse' }])
  expect(row.expected!.groups).toEqual([{ id: 'service', label: 'Service', members: ['Work'] }])
})

test('ABNF prefix repetition cannot be consumed as postfix repetition on the preceding item', () => {
  const value = facts('railroad-abnf-beta\ndomain = label *( "." label ) ;')
  expect(value['grammar-rules']).toEqual([{ name: 'domain', expression: { kind: 'sequence', items: [{ kind: 'reference', value: 'label' }, { kind: 'repeat', minimum: 0, maximum: null, expression: { kind: 'sequence', items: [{ kind: 'terminal', value: '.' }, { kind: 'reference', value: 'label' }] } }] } }])
})

test('inline classes and compact edge tokens are grammar boundaries rather than node IDs', () => {
  const row = review('flowchart LR\nA:::red-->B\nB---C\nC--oD\nD--xE\nclassDef red fill:red')
  expect(row.expected!.nodes!.map(node => node.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
  expect(row.expected!.facts!['node-attributes']).toEqual([{ id: 'A', attributes: { classes: 'red' } }])
  expect(row.expected!.edges).toEqual([{ source: 'A', target: 'B', directed: true, startMarker: 'none', endMarker: 'arrow' }, { source: 'B', target: 'C', directed: false, startMarker: 'none', endMarker: 'none' }, { source: 'C', target: 'D', directed: false, startMarker: 'none', endMarker: 'circle' }, { source: 'D', target: 'E', directed: false, startMarker: 'none', endMarker: 'cross' }])
})

test('sequence fragments and branches bind their exact message ranges', () => {
  const value = facts('sequenceDiagram\nalt allowed\nA->>B: yes\nelse denied\nA->>B: no\nelse retry\nB->>A: again\nend')
  expect(value.fragments).toEqual([{ kind: 'alt', caption: 'allowed', beginMessage: 0, nesting: [], endMessage: 3 }, { kind: 'else', caption: 'denied', beginMessage: 1, parent: 0, endMessage: 2 }, { kind: 'else', caption: 'retry', beginMessage: 2, parent: 0, endMessage: 3 }])
})

test('ZenUML source-first explicit callers, bare returns and painted message comments remain explicit', () => {
  const row = review('zenuml\n// participant comment is hidden\nClient\n// **message** comment\nClient->A.method() {\nreturn\n}')
  expect(row.expected!.facts!['participant-order']).toEqual(['Client', 'A'])
  expect((row.expected!.facts!['zenuml-event-order'] as any[]).map(event => event.kind)).toEqual(['sync', 'return'])
  expect(row.expected!.labels).toContain('message comment')
  expect(row.expected!.labels).not.toContain('participant comment is hidden')
})

test('a sequence box with only a color does not invent a visible caption', () => {
  const row = review('sequenceDiagram\nbox Purple\nparticipant A\nend')
  expect(row.expected!.groups).toEqual([{ id: 'box:0', label: '', members: ['A'] }])
  expect(row.expected!.facts!['box-appearance']).toEqual([{ id: 'box:0', color: 'Purple' }])
})

test('logging and navigation configuration is frozen provenance rather than a pixel obligation', () => {
  const row = review('---\nconfig:\n  logLevel: debug\n  kanban:\n    ticketBaseUrl: https://example.com/#TICKET#\n---\nkanban\nTodo\n  work[Work]')
  expect(row.expected!.facts!['authored-config']).toBeUndefined()
  expect(row.sourceReview.excludedNonvisual).toContain('Configuration affects logging or navigation, not the static drawing: logLevel="debug"')
  expect(row.sourceReview.excludedNonvisual).toContain('Configuration affects logging or navigation, not the static drawing: kanban.ticketBaseUrl="https://example.com/#TICKET#"')
})


test('authored radar legend intent and event fields after read dependencies remain explicit facts', () => {
  expect(facts('radar-beta\naxis a["A"]\ncurve c["C"]{3}\nshowLegend true')['show-legend']).toBe(true)
  expect(facts('eventmodeling\nrf 03 evt Cart.Added ->> 02 { productId: 7 }').frames).toEqual([{ id: '03', resets: true, kind: 'event', label: 'Cart.Added', dataReference: null, fields: [{ name: 'productId', value: '7' }], readsFrom: ['02'] }])
})


test('visual contracts project unprinted ratios once while raw literal contracts preserve source quantities', () => {
  const stimulus = input('pie\n"A": 2\n"B": 6'), raw = reviewDocumentationSource(stimulus, { visual: false }), visual = reviewDocumentationSource(stimulus)
  expect(raw.expected!.facts!.slices).toEqual([{ label: 'A', value: 2 }, { label: 'B', value: 6 }])
  expect(visual.expected!.facts!.slices).toEqual([{ label: 'A', value: .25 }, { label: 'B', value: .75 }])
  expect(visual.sourceReview.visualProjections).toHaveLength(1)
  expect(visual.sourceReview.requiredObligations).toEqual(requiredDocumentationObligations(visual.expected))
  expect(raw.sourceSha256).toBe(visual.sourceSha256)
})


test('class block colon members retain their owning class instead of inventing nodes', () => {
  const result = review('classDiagram\nclass Student {\n-idCard : IdCard\n}\nclass IdCard {\n-id : int\n-name : string\n}\nStudent "1" --o "1" IdCard : carries')
  expect(result.expected?.nodes).toEqual([{ id: 'Student', label: 'Student' }, { id: 'IdCard', label: 'IdCard' }])
  expect(result.expected?.facts?.members).toEqual([{ id: 'Student', values: ['-idCard : IdCard'] }, { id: 'IdCard', values: ['-id : int', '-name : string'] }])
  expect(result.expected?.labels).toContain('IdCard')
  expect(result.sourceReview.expectedFactsComplete).toBe(true)
  const global = review('classDiagram\nStudent: -idCard : IdCard\nclass IdCard')
  expect(global.expected?.facts?.members).toEqual([{ id: 'Student', values: ['-idCard : IdCard'] }, { id: 'IdCard', values: [] }])
})


test('sequence arrow kinds follow the literal documentation table without invented arrowheads', () => {
  const row = review('sequenceDiagram\nA->B: line\nA-->B: dotted line\nA->>B: head\nA-->>B: dotted head\nA-)B: open\nA--)B: dotted open\nA-xB: cross\nA--xB: dotted cross\nA<<->>B: both\nA<<-->>B: dotted both')
  expect(row.expected?.edges?.map(edge => [edge.directed, edge.startMarker, edge.endMarker])).toEqual([[false, 'none', 'none'], [false, 'none', 'none'], [true, 'none', 'arrow'], [true, 'none', 'arrow'], [true, 'none', 'open-arrow'], [true, 'none', 'open-arrow'], [false, 'none', 'cross'], [false, 'none', 'cross'], [true, 'arrow', 'arrow'], [true, 'arrow', 'arrow']])
  expect(row.expected?.facts?.['participant-kinds']).toEqual([{ id: 'A', kind: 'participant' }, { id: 'B', kind: 'participant' }])
})

test('sequence defaults, effective aliases and source-owned line breaks remain explicit', () => {
  const row = review('sequenceDiagram\nparticipant A@{ "type":"boundary", "alias":"Ignored" } as Alice<br/>A\nA->>B: Hello<br/>Bob\nNote over A,B: First<br/>Second\n%% invisible comment')
  expect(row.expected?.facts?.['participant-kinds']).toEqual([{ id: 'A', kind: 'boundary' }, { id: 'B', kind: 'participant' }])
  expect(row.expected?.nodes).toEqual([{ id: 'A', label: 'Alice\nA' }, { id: 'B', label: 'B' }])
  expect(row.expected?.facts?.['text-line-breaks']).toEqual([{ owner: { kind: 'message', index: 0 }, lines: ['Hello', 'Bob'] }, { owner: { kind: 'note', index: 0 }, lines: ['First', 'Second'] }, { owner: { kind: 'participant', id: 'A' }, lines: ['Alice', 'A'] }])
  expect(row.sourceReview.requiredObligations).toContain('fact:text-line-breaks')
  expect(row.expected?.forbiddenLabels).toEqual(['invisible comment'])
  expect(row.sourceReview.excludedNonvisual.join(' ')).toContain('Ignored')
  expect(review('sequenceDiagram\nA->>B: visible\n%% visible').sourceReview.expectedFactsComplete).toBe(false)
})

test('Mermaid named entities decode into their independently documented display characters', () => {
  expect(review('sequenceDiagram\nA->>B: I #9829; you #infin; times more!').expected?.facts?.['message-order']).toEqual([{ from: 'A', to: 'B', text: 'I ♥ you ∞ times more!' }])
  expect(review('flowchart LR\nA["#quot;quoted#quot; &amp; #amp; #notAnEntity;"]').expected?.nodes).toEqual([{ id: 'A', label: '"quoted" & & #notAnEntity;' }])
})
