import { expect, test } from 'bun:test'
import type { PortableCase } from '../portable/cohorts.ts'
import { qualifyPortable } from '../portable/fidelity.ts'

const graph: PortableCase = {
  id: 'authored-flowchart',
  family: 'flowchart',
  cohort: 'adversarial',
  source: 'flowchart LR\nA[Alpha] --> B[Beta]',
  expected: { accept: true, labels: ['Alpha', 'Beta'], topology: { nodes: ['A', 'B'], edges: [{ source: 'A', target: 'B' }], nodeLabels: { A: 'Alpha', B: 'Beta' } } },
}
const model = () => ({
  type: 'flowchart',
  nodes: new Map([
    ['A', { text: 'Alpha' }],
    ['B', { text: 'Beta' }],
  ]),
  edges: [{ id: 'L_A_B_0', start: 'A', end: 'B' }],
  subgraphs: [] as { id: string; nodes: string[] }[],
})
const ownedEdge = (path = 'M30,20 L93,20') => `<g class="pele-edge" data-id="L_A_B_0"><path d="${path}"/><path class="pele-marker" d="M100,20L92,24L92,16Z"/></g>`
const node = (id: string, label: string, x: number) => `<g class="pele-node" data-id="${id}"><rect x="${x}" y="10" width="20" height="20"/><text x="${x}" y="20">${label}</text></g>`
const svg = (edges = ownedEdge(), extra = '', swapped = false) => `<svg xmlns="http://www.w3.org/2000/svg" class="pele pele-flowchart" viewBox="0 0 260 90">${extra}${edges}${node('A', swapped ? 'Beta' : 'Alpha', 10)}${node('B', swapped ? 'Alpha' : 'Beta', 100)}</svg>`
const check = (result: ReturnType<typeof qualifyPortable>, name: string) => result.checks.find(item => item.name === name)

test('qualifies declared graph meaning through both the public model and owned path geometry', () => {
  const result = qualifyPortable(graph, { svg: svg(), model: model() })
  expect(result.passed).toBe(true)
  expect(result.semanticComplete).toBe(true)
  expect(check(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('passed')
  expect(result.unmeasuredScopes.join(' ')).toContain('curve geometry')
  expect(result.scope).toContain('not complete Mermaid or visual fidelity')
})
test('malformed or disconnected owned paths cannot certify their apparent endpoint relationship', () => {
  for (const path of [
    'M30,20 L40,20 M80,20 L93,20',
    'L0,0 M30,20 L93,20',
    'M30,20 L93%20',
    'M30,,20 L93,20',
    'M,30,20 L93,20',
    'M30,20 L93,20,',
    'M30,20 A5,5 0 2,0 93,20',
  ]) {
    const result = qualifyPortable(graph, { svg: svg(ownedEdge(path)), model: model() })
    expect(check(result, 'model-edge-endpoints-and-multiplicity')?.status).toBe('passed')
    expect(check(result, 'svg-edge-attachment:0')?.status).not.toBe('passed')
    expect(result.passed).toBe(false)
    expect(result.semanticComplete).toBe(false)
  }
})
test('continuous owned paths retain their valid number separators and move boundaries', () => {
  for (const path of ['M30,20 L50,20 M50,20 L93,20', 'M3e1 20 50 20 93 20', 'm30 20 h20 m0 0 l43 0']) {
    const result = qualifyPortable(graph, { svg: svg(ownedEdge(path)), model: model() })
    expect(result.passed).toBe(true)
    expect(result.semanticComplete).toBe(true)
  }
})
test('discarded characters cannot fabricate a visible owned target marker', () => {
  for (const marker of ['M100%20L92,24L92,16Z', 'M100,,20L92,24L92,16Z', 'M100,20L92,24L92,16,Z']) {
    const result = qualifyPortable(graph, { svg: svg(ownedEdge().replace('M100,20L92,24L92,16Z', marker)), model: model() })
    expect(check(result, 'svg-edge-attachment:0')?.status).toBe('passed')
    expect(check(result, 'svg-edge-target-marker:0')?.status).not.toBe('passed')
    expect(result.passed).toBe(false)
    expect(result.semanticComplete).toBe(false)
  }
})
test('unprojected valid path and marker grammars remain unmeasured', () => {
  const compactArc = qualifyPortable(graph, { svg: svg(ownedEdge('M30 20 A5 5 0 0193 20')), model: model() })
  expect(check(compactArc, 'svg-edge-attachment:0')?.status).toBe('unmeasured')
  expect(compactArc.semanticComplete).toBe(false)
  for (const marker of ['m100 20 l-8 4 l0 -8z', 'M100 20 92 24 92 16Z']) {
    const result = qualifyPortable(graph, { svg: svg(ownedEdge().replace('M100,20L92,24L92,16Z', marker)), model: model() })
    expect(check(result, 'svg-edge-target-marker:0')?.status).toBe('unmeasured')
    expect(result.semanticComplete).toBe(false)
  }
  const lowercaseClose = qualifyPortable(graph, { svg: svg(ownedEdge().replace('L92,16Z', 'L92,16z')), model: model() })
  expect(lowercaseClose.semanticComplete).toBe(true)
})
test('malformed transform and polygon lists cannot fabricate geometry evidence', () => {
  for (const transform of ['translate(30,,0)', 'translate(30,0,)']) {
    const edge = `<g class="pele-edge" data-id="L_A_B_0" transform="${transform}"><path d="M0,20 L63,20"/><path class="pele-marker" d="M70,20L62,24L62,16Z"/></g>`
    const result = qualifyPortable(graph, { svg: svg(edge), model: model() })
    expect(check(result, 'svg-edge-attachment:0')?.status).toBe('unmeasured')
    expect(result.semanticComplete).toBe(false)
  }
  const polygon = svg().replace('<rect x="10" y="10" width="20" height="20"/>', '<polygon points="10,,10 30,10 30,30 10,30"/>')
  expect(qualifyPortable(graph, { svg: polygon, model: model() }).semanticComplete).toBe(false)
  const valid = svg().replace('<rect x="10" y="10" width="20" height="20"/>', '<polygon points="10,10 30,10 30,30 10,30"/>')
  expect(qualifyPortable(graph, { svg: valid, model: model() }).semanticComplete).toBe(true)
  const translated = ownedEdge().replace('data-id="L_A_B_0"', 'data-id="L_A_B_0" transform="translate(0, 0)"')
  expect(qualifyPortable(graph, { svg: svg(translated), model: model() }).semanticComplete).toBe(true)
})
test('a target marker must touch its actual stem and aim into the target box', () => {
  for (const marker of ['M100,40L92,44L92,36Z', 'M100,31L92,10L92,50Z']) {
    const result = qualifyPortable(graph, { svg: svg(ownedEdge().replace('M100,20L92,24L92,16Z', marker)), model: model() })
    expect(check(result, 'svg-edge-attachment:0')?.status).toBe('passed')
    expect(check(result, 'svg-edge-target-marker:0')?.status).toBe('failed')
    expect(result.semanticComplete).toBe(false)
  }
})
test('nonfinite derived geometry cannot qualify finite coordinate tokens', () => {
  const marker = 'M100,20L-1e308,-1e308L1e308,1e308Z'
  const overflow = qualifyPortable(graph, { svg: svg(ownedEdge('M30,20 L100,20').replace('M100,20L92,24L92,16Z', marker)), model: model() })
  expect(check(overflow, 'svg-edge-attachment:0')?.status).toBe('passed')
  expect(check(overflow, 'svg-edge-target-marker:0')?.status).toBe('unmeasured')
  expect(overflow.semanticComplete).toBe(false)
  const path = qualifyPortable(graph, { svg: svg(ownedEdge('M30,20 L1e308,20 l1e308,0 L93,20')), model: model() })
  expect(check(path, 'svg-edge-attachment:0')?.status).toBe('unmeasured')
  expect(path.semanticComplete).toBe(false)
})
test('correct labels and model do not hide a path attached to the wrong place', () => {
  const result = qualifyPortable(graph, { svg: svg(ownedEdge('M30,20 L230,20')), model: model() })
  expect(check(result, 'label:Alpha')?.status).toBe('passed')
  expect(check(result, 'model-edge-endpoints-and-multiplicity')?.status).toBe('passed')
  expect(check(result, 'svg-edge-attachment:0')?.status).toBe('failed')
  expect(result.passed).toBe(false)
  expect(result.semanticComplete).toBe(false)
})
test('a duplicate painted edge fails even with unchanged labels and native graph', () => {
  const result = qualifyPortable(graph, { svg: svg(ownedEdge() + ownedEdge()), model: model() })
  expect(check(result, 'svg-owned-edge-count')?.status).toBe('failed')
  expect(check(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('failed')
  expect(result.semanticComplete).toBe(false)
})
test('swapping labels between the correct node IDs loses authored meaning', () => {
  const result = qualifyPortable(graph, { svg: svg(ownedEdge(), '', true), model: model() })
  expect(check(result, 'label:Alpha')?.status).toBe('passed')
  expect(check(result, 'label:Beta')?.status).toBe('passed')
  expect(check(result, 'svg-owned-node-label:A')?.status).toBe('failed')
  expect(check(result, 'svg-owned-node-label:B')?.status).toBe('failed')
  expect(result.passed).toBe(false)
})
test('a public model with reversed endpoints fails independently of the SVG label census', () => {
  const actual = model()
  actual.edges[0] = { id: 'L_A_B_0', start: 'B', end: 'A' }
  const result = qualifyPortable(graph, { svg: svg(), model: actual })
  expect(check(result, 'model-edge-endpoints-and-multiplicity')?.status).toBe('failed')
  expect(result.passed).toBe(false)
})
test('edge IDs and marker ink alone do not substitute for an actual connecting path', () => {
  const result = qualifyPortable(graph, { svg: svg('<g class="pele-edge" data-id="L_A_B_0"><path class="pele-marker" d="M100,20L92,24L92,16Z"/></g>'), model: model() })
  expect(check(result, 'svg-edge-owned-ink:0')?.status).toBe('failed')
  expect(result.passed).toBe(false)
})
test('group membership must also be reflected in painted containment', () => {
  const grouped: PortableCase = { ...graph, expected: { ...graph.expected, topology: { ...graph.expected.topology!, groups: [{ id: 'G', members: ['A', 'B'] }] } } }
  const actual = model()
  actual.subgraphs = [{ id: 'G', nodes: ['A', 'B'] }]
  const result = qualifyPortable(grouped, { svg: svg(ownedEdge(), '<g class="pele-cluster" data-id="G"><rect x="0" y="0" width="50" height="50"/></g>'), model: actual })
  expect(check(result, 'model-group-membership:G')?.status).toBe('passed')
  expect(check(result, 'svg-group-containment:G')?.status).toBe('failed')
  expect(result.semanticComplete).toBe(false)
})
test('missing public parse evidence remains unmeasured and cannot qualify semantic equivalence', () => {
  const result = qualifyPortable(graph, { svg: svg() })
  expect(result.accepted).toBe(true)
  expect(check(result, 'model-node-identities')?.status).toBe('unmeasured')
  expect(result.passed).toBe(false)
  expect(result.semanticComplete).toBe(false)
})
test('numeric public-model fidelity is independent of labels and does not certify chart geometry', () => {
  const pie: PortableCase = { id: 'authored-pie', family: 'pie', source: 'pie\n"Alpha":7', cohort: 'family', expected: { accept: true, labels: ['Alpha'], model: [{ path: ['sections', { map: 'Alpha' }], value: 7 }] } }
  const output = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text>Alpha</text></svg>'
  const correct = qualifyPortable(pie, { svg: output, model: { type: 'pie', sections: new Map([['Alpha', 7]]) } })
  expect(check(correct, 'model:["sections",{"map":"Alpha"}]')?.status).toBe('passed')
  expect(check(correct, 'painted-semantic-correspondence')?.status).toBe('unmeasured')
  expect(correct.semanticComplete).toBe(false)
  const wrong = qualifyPortable(pie, { svg: output, model: { type: 'pie', sections: new Map([['Alpha', 70]]) } })
  expect(check(wrong, 'model:["sections",{"map":"Alpha"}]')?.status).toBe('failed')
})
test('invalid-source rejection requires a public exception, rather than an empty successful return', () => {
  const invalid: PortableCase = { id: 'authored-negative', family: 'flowchart', source: 'flowchart LR\n --> -->', cohort: 'invalid', expected: { accept: false, labels: [] } }
  expect(qualifyPortable(invalid, { error: 'Parser rejected missing endpoints' }).passed).toBe(true)
  expect(qualifyPortable(invalid, { svg: '' }).passed).toBe(false)
})
test('font configuration must be emitted, rather than merely accepted as an unused option', () => {
  const configured = { ...graph, renderOptions: { fontSize: 24 } }
  const ignored = qualifyPortable(configured, { svg: svg().replace('class="pele pele-flowchart"', 'class="pele pele-flowchart" style="font:14px sans-serif"'), model: model() })
  expect(check(ignored, 'svg-root-font-size')?.status).toBe('failed')
  const consumed = qualifyPortable(configured, { svg: svg().replace('class="pele pele-flowchart"', 'class="pele pele-flowchart" style="font:24px sans-serif"'), model: model() })
  expect(check(consumed, 'svg-root-font-size')?.status).toBe('passed')
})
test('namespace, duplicate document IDs and hidden source text are independent admission failures', () => {
  expect(check(qualifyPortable(graph, { svg: svg().replace('http://www.w3.org/2000/svg', 'urn:wrong'), model: model() }), 'svg-format')?.status).toBe('failed')
  expect(check(qualifyPortable(graph, { svg: svg(ownedEdge(), '<path id="duplicate"/><path id="duplicate"/>'), model: model() }), 'svg-unique-ids')?.status).toBe('failed')
  const hidden = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><metadata>Alpha Beta</metadata><text display="none">Alpha Beta</text></svg>'
  expect(check(qualifyPortable(graph, { svg: hidden, model: model() }), 'label:Alpha')?.status).toBe('failed')
  const foreign = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">Alpha Beta<g>Alpha Beta</g><text xmlns="urn:unpainted">Alpha Beta</text></svg>'
  expect(check(qualifyPortable(graph, { svg: foreign, model: model() }), 'label:Alpha')?.status).toBe('failed')
})
test('an uninspectable public result fails its own qualification without aborting the campaign', () => {
  const actual = Object.defineProperty({}, 'type', {
    get() {
      throw Error('Broken public model accessor')
    },
  })
  const result = qualifyPortable(graph, { svg: svg(), model: actual })
  expect(result.accepted).toBe(true)
  expect(result.passed).toBe(false)
  expect(check(result, 'qualification-protocol')?.actual).toBe('Broken public model accessor')
})
