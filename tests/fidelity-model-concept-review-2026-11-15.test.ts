import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { nativeAstView, nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'
import { assessmentConfirmations } from '../unified/mermaid-fidelity/verification.ts'

// docs/evidence/fidelity-model-concept-review-2026-11-15.json confirms reasons by their exact
// text. Each native model below is the probe output of the installed candidate artifact for
// the test source in its comment (scripts/fidelity-probe.ts), trimmed to what the view reads;
// the view must give exactly the reason the review confirmed, or the callback is unconfirmed.
const review = JSON.parse(readFileSync(join(import.meta.dir, '../docs/evidence/fidelity-model-concept-review-2026-11-15.json'), 'utf8'))
const confirmations = assessmentConfirmations([review])

const reasonOf = (read: (hooks: any) => unknown) => {
  const log: string[] = []
  const hooks = {
    unavailable: (reason: string) => { log.push('gap: ' + reason); throw Error('gap') },
    unsupported: (reason: string) => { log.push(reason); throw Error('unsupported') },
  }
  expect(() => read(hooks)).toThrow('unsupported')
  return log.at(-1)!
}

test('the 2026-11-15 review is well formed: one verdict per concept, every probe has its source', () => {
  expect(review.protocol).toBe('fidelity-model-concept-review-v1')
  for (const concept of review.concepts) {
    expect(['confirmed', 'disproved', 'not decidable']).toContain(concept.verdict)
    for (const probe of concept.probes) expect(review.probeSources[probe]?.source).toBeString()
    for (const reasons of Object.values(concept.projects) as Record<string, number>[]) for (const key of Object.keys(reasons)) expect(key).not.toMatch(/\d/)
  }
  const callbacks = review.concepts.flatMap((concept: any) => Object.values(concept.projects).flatMap((reasons: any) => Object.values(reasons) as number[]))
  expect(callbacks.reduce((a: number, b: number) => a + b, 0)).toBe(28)
})

test('the views give exactly the reasons the 2026-11-15 review confirmed for the probed models', () => {
  const cases: [string, (hooks: any) => unknown][] = [
    // sequenceDiagram / Alice-->>Bob:Hello Bob, how are you? / activate Bob / Bob-->>Alice:Hello Alice / deactivate Bob
    ['Dicklesworthstone/frankenmermaid', hooks => nativeSchemaView('Dicklesworthstone/frankenmermaid', 'sequence', {
      diagram_type: 'Sequence', direction: 'TB',
      nodes: [{ id: 'Alice', shape: 'Rect', classes: [], implicit: false }, { id: 'Bob', shape: 'Rect', classes: [], implicit: false }],
      edges: [{ from: { Node: 0 }, to: { Node: 1 }, arrow: 'DottedArrow', label: 0 }, { from: { Node: 1 }, to: { Node: 0 }, arrow: 'DottedArrow', label: 1 }],
      ports: [], clusters: [], labels: [{ text: 'Hello Bob, how are you?' }, { text: 'Hello Alice' }], constraints: [], diagnostics: [],
      sequence_meta: { autonumber: false, activations: [{ participant: 1, start_edge: 0, end_edge: 1, depth: 0 }] },
    }, hooks).getMessages()],
    // railroad-beta / rule = sequence(terminal("a"), nonterminal("b")) ;
    ['Latias94/merman', hooks => (nativeAstView('Latias94/merman', 'Railroad', { type: 'railroad', title: null, accTitle: null, accDescr: null, rules: [{ name: 'rule', definition: { type: 'sequence', elements: [{ type: 'terminal', value: 'a' }, { type: 'nonterminal', name: 'b' }] } }] }, hooks) as any).rules[0].definition],
    // agentflow-beta TB / a["A"] / a@{ __proto__: / polluted: true }
    ['Latias94/merman', hooks => nativeSchemaView('Latias94/merman', 'agentflow', { connectors: [], direction: 'TB', diagnostics: [], subGraphs: [], vertices: [{ id: 'a', label: 'A', shape: 'square', vertexKind: 'task' }], edges: [], type: 'agentflow', title: null }, hooks).getVertices().get('a').metadata],
    // classDiagram / class Class01:::pink / classDef pink fill:#f9f,stroke:#333,stroke-width:6px
    ['adewale/agentic-mermaid', hooks => nativeSchemaView('adewale/agentic-mermaid', 'class', { kind: 'class', classes: [{ id: 'Class01', members: [], className: 'pink' }], relations: [], notes: [], classDefs: { pink: { fill: '#f9f', stroke: '#333', 'stroke-width': '6px' } } }, hooks).getClass('Class01').styles],
    // sequenceDiagram / critical Establish a connection to the DB / Service-->DB: connect / end
    ['adewale/agentic-mermaid', hooks => nativeSchemaView('adewale/agentic-mermaid', 'sequence', { kind: 'sequence', participants: [{ id: 'Service', label: 'Service', kind: 'participant' }, { id: 'DB', label: 'DB', kind: 'participant' }], messages: [], statements: [{ kind: 'opaque-block', lines: ['    critical Establish a connection to the DB', '        Service-->DB: connect', '    end'] }] }, hooks).getMessages()],
    // flowchart TD / A e1@--> B / C e2@--> D / E e3@--> F / e1@{ animate: true } / e2@{ animate: false } / e3@{ animate: true } / e3@{ animate: false }
    ['adewale/agentic-mermaid', hooks => {
      const node = (id: string) => [id, { id, label: id, shape: 'rectangle' }] as const
      const edge = (source: string, target: string, id: string, animate?: boolean) => ({ source, target, id, style: 'solid', hasArrowStart: false, hasArrowEnd: true, endMarker: 'arrow', ...(animate ? { animate } : {}) })
      const graph = { direction: 'TD', nodes: new Map(['A', 'B', 'C', 'D', 'E', 'F'].map(node)), edges: [edge('A', 'B', 'e1', true), edge('C', 'D', 'e2'), edge('E', 'F', 'e3', true)], subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map() }
      return nativeSchemaView('adewale/agentic-mermaid', 'flowchart', { kind: 'flowchart', graph }, hooks).getEdges()[1].animate
    }],
    // stateDiagram-v2 / [*] --> NotShooting / state "Not Shooting State" as NotShooting { ... [*] --> Idle ... } / note right of NotShooting : ...
    ['evangwt/xmermaid', hooks => nativeSchemaView('evangwt/xmermaid', 'state', {
      type: 'state',
      states: [{ id: '__start__', pseudostate: 'start', composite: false, parent: '"Not Shooting State" as NotShooting' }, { id: 'NotShooting', composite: false }, { id: '"Not Shooting State" as NotShooting', composite: true }, { id: 'Idle', label: 'Idle mode', composite: false, parent: '"Not Shooting State" as NotShooting' }, { id: 'Configuring', label: 'Configuring mode', composite: false, parent: '"Not Shooting State" as NotShooting' }],
      transitions: [{ from: '__start__', to: 'NotShooting', label: '' }, { from: '__start__', to: 'Idle', label: '' }, { from: 'Idle', to: 'Configuring', label: 'EvConfig' }, { from: 'Configuring', to: 'Idle', label: 'EvConfig' }],
      notes: [{ target: 'NotShooting', placement: 'right', text: 'This is a note on a composite state' }],
    }, hooks).getState('NotShooting').note],
  ]
  // classDiagram / Class1 -- Class02 (beautiful-mermaid 1.1.3 and ascii-mermaid 0.1.0 give the same model)
  for (const project of ['lukilabs/beautiful-mermaid', 'kais-radwan/ascii-mermaid'])
    cases.push([project, hooks => nativeSchemaView(project, 'class', { classes: [{ id: 'Class1', label: 'Class1', attributes: [], methods: [] }, { id: 'Class02', label: 'Class02', attributes: [], methods: [] }], relationships: [{ from: 'Class1', to: 'Class02', type: 'association', markerAt: 'to' }], namespaces: [] }, hooks).getRelations()[0].relation])
  for (const [project, read] of cases) expect([project, confirmations.confirmed(project, reasonOf(read))]).toEqual([project, true])
})
