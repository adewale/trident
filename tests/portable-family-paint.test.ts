import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PortableCase } from '../portable/cohorts.ts'
import { qualifyPortable } from '../portable/fidelity.ts'

type Family = 'class' | 'state' | 'er'
const sources: Record<Family, string> = {
  class: 'classDiagram\nclass A\nclass B\nclass C\nA --> B\nB --> C',
  state: 'stateDiagram-v2\nA --> B\nB --> C',
  er: 'erDiagram\nA ||--o{ B : first\nB ||--o{ C : second',
}
const graph = (family: Family): PortableCase => ({
  id: 'owned-' + family,
  family,
  cohort: 'adversarial',
  source: sources[family],
  expected: {
    accept: true,
    labels: ['A', 'B', 'C'],
    topology: {
      nodes: ['A', 'B', 'C'],
      edges: [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
      ],
    },
  },
})
function model(family: Family) {
  if (family === 'class')
    return {
      type: family,
      classes: new Map(['A', 'B', 'C'].map(id => [id, { label: id }])),
      relations: [
        { id1: 'A', id2: 'B', relation: { type1: 'none', type2: 3 } },
        { id1: 'B', id2: 'C', relation: { type1: 'none', type2: 3 } },
      ],
    }
  if (family === 'state')
    return {
      type: family,
      states: new Map(['A', 'B', 'C'].map(id => [id, { descriptions: [id] }])),
      relations: [
        { id1: 'A', id2: 'B' },
        { id1: 'B', id2: 'C' },
      ],
    }
  return {
    type: family,
    entities: new Map(['A', 'B', 'C'].map(id => [id, { id: 'entity-' + id, label: id }])),
    relationships: [
      { entityA: 'entity-A', entityB: 'entity-B' },
      { entityA: 'entity-B', entityB: 'entity-C' },
    ],
  }
}
const node = (family: Family, id: string, x: number) => `<g class="pele-node pele-${family === 'er' ? 'entity' : family}" data-id="${id}"><rect x="${x}" y="10" width="20" height="20" fill="white" stroke="black"/><text x="${x}" y="20">${id}</text></g>`
const edge = (family: Family, index: number, from: number, to: number, marker = true) =>
  `<g class="pele-edge" data-id="relation-${index}"><path d="M${from},20 L${to - (family === 'er' ? 0 : 7)},20"/>${!marker ? '' : family === 'er' ? `<path class="pele-marker" d="M${from + 6},16 L${from + 6},24 M${from + 10},16 L${from + 10},24"/><path class="pele-marker" d="M${to + 6},20 L${to},10 L${to - 6},20"/>` : `<path class="pele-marker" d="M${to},20L${to - 8},16L${to - 8},24Z" fill="black" stroke="none"/>`}</g>`
const svg = (family: Family, edges = edge(family, 0, 30, 110) + edge(family, 1, 130, 210)) =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="pele pele-${family}" viewBox="0 0 250 50"><g class="pele-edges" fill="none" stroke="black">${edges}</g>${node(family, 'A', 10)}${node(family, 'B', 110)}${node(family, 'C', 210)}</svg>`
const finding = (result: ReturnType<typeof qualifyPortable>, name: string) => result.checks.find(check => check.name === name)

const agenticModel = (family: 'class' | 'er', edges = graph(family).expected.topology!.edges) => ({ ok: true, value: { kind: family, body: {
  kind: family,
  [family === 'class' ? 'classes' : 'entities']: ['A', 'B', 'C'].map(id => ({ id, label: id })),
  relations: edges.map(({ source: from, target: to }) => family === 'class' ? { from, to, kind: 'association', markerAt: 'to' } : { from, to, leftCard: 'one-only', rightCard: 'zero-or-many', dashed: false }),
} } })
const agenticMarker = '<defs><marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" overflow="visible"><polyline points="0 0,8 3,0 6" fill="none" stroke="#111"/></marker></defs>'
const agenticGlyphs = (from: number, to: number, y = 20) => {
  const direction = Math.sign(to - from), line = (x1: number, y1: number, x2: number, y2: number) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111"/>`
  return [4, 8].map(offset => line(from + direction * offset, y - 6, from + direction * offset, y + 6)).join('')
    + [-7, 0, 7].map(side => line(to - direction * 4, y + side, to - direction * 16, y)).join('')
    + `<circle cx="${to - direction * 20}" cy="${y}" r="4" fill="#fff" stroke="#111"/>`
}
const agenticSvg = (family: 'class' | 'er', routes: { source: string; target: string; from: number; to: number; y?: number }[] = [{ source: 'A', target: 'B', from: 30, to: 110 }, { source: 'B', target: 'C', from: 130, to: 210 }]) =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="am-fixture" viewBox="0 0 250 50">${family === 'class' ? agenticMarker : ''}${routes.map((route, index) => `<polyline class="${family}-relationship" data-id="owned-${index}" data-from="${route.source}" data-to="${route.target}" points="${route.from},${route.y ?? 20} ${route.to},${route.y ?? 20}" fill="none" stroke="#111"${family === 'class' ? ' marker-end="url(#arrow)"' : ''}/>`).join('')}${['A', 'B', 'C'].map((id, index) => `<g class="${family === 'class' ? 'class-node' : 'entity'}" data-id="${id}"><rect x="${index * 100 + 10}" y="10" width="20" height="20" fill="#fff" stroke="#111"/><text x="${index * 100 + 10}" y="20">${id}</text></g>`).join('')}${family === 'er' ? routes.map(route => agenticGlyphs(route.from, route.to, route.y)).join('') : ''}</svg>`

for (const family of ['class', 'er'] as const) {
  const observe = (ink = agenticSvg(family), native: unknown = agenticModel(family), authored = graph(family)) => qualifyPortable(authored, { svg: ink, model: native, adapter: 'agentic' })
  test(`Agentic ${family}: actual typed Result and independently owned visible ink qualify`, () => {
    const result = observe()
    expect(result.observer).toBe('portable-owned-topology-v3-agentic-class-er')
    expect(result.semanticComplete).toBe(true)
    expect(finding(result, 'model-node-identities')?.status).toBe('passed')
    expect(finding(result, family === 'class' ? 'svg-edge-target-marker:0' : 'svg-er-cardinality-and-identifying')?.status).toBe('passed')
  })
  test(`Agentic ${family}: typed identities and exact endpoint multiplicity cannot be replaced by labels`, () => {
    for (const mutate of [
      (native: ReturnType<typeof agenticModel>) => { native.value.body.relations.pop() },
      (native: ReturnType<typeof agenticModel>) => { native.value.body.relations[0]!.to = 'C' },
    ]) {
      const native = agenticModel(family); mutate(native)
      const result = observe(undefined, native)
      expect(result.evidence?.outputAdmission).toBe('passed')
      expect(finding(result, 'model-edge-endpoints-and-multiplicity')?.status).toBe('failed')
      expect(result.semanticComplete).toBe(false)
    }
    for (const native of [undefined, { ok: true, value: { kind: family, body: { kind: 'preserved', source: sources[family] } } }, { ok: false, error: 'unsupported' }]) {
      const result = qualifyPortable(graph(family), { svg: agenticSvg(family), model: native, adapter: 'agentic' })
      expect(result.evidence?.outputAdmission).toBe('passed')
      expect(result.semanticComplete).toBe(false)
      expect(finding(result, 'model-native-result')?.status).not.toBe('passed')
    }
    const duplicate = agenticModel(family)
    ;(duplicate.value.body as Record<string, any>)[family === 'class' ? 'classes' : 'entities'][1].id = 'A'
    expect(finding(observe(undefined, duplicate), 'model-node-identities')?.status).toBe('failed')
  })
  test(`Agentic ${family}: unchanged metadata cannot hide missing, invisible or redirected route geometry`, () => {
    for (const ink of [
      agenticSvg(family).replace('30,20 110,20', '30,20 210,20'),
      agenticSvg(family).replace('30,20 110,20', '30,20 30,20'),
      agenticSvg(family).replace('30,20 110,20', '30,20 110,20').replace('fill="none" stroke="#111"', 'fill="none" stroke="none"'),
      agenticSvg(family).replace('data-id="owned-1"', 'data-id="owned-0"'),
      agenticSvg(family).replace('points="30,20 110,20"', 'stroke-dasharray="0 4" points="30,20 110,20"'),
      agenticSvg(family).replace(/<polyline class="(?:class|er)-relationship"[^>]*\/>/, ''),
    ]) {
      const result = observe(ink)
      expect(finding(result, 'model-edge-endpoints-and-multiplicity')?.status).toBe('passed')
      expect(result.semanticComplete).toBe(false)
    }
    const unsupported = observe(agenticSvg(family).replace('points="30,20 110,20"', 'transform="scale(2)" points="30,20 110,20"'))
    expect(finding(unsupported, 'svg-edge-owned-ink:0')?.status).toBe('unmeasured')
    expect(unsupported.semanticComplete).toBe(false)
    for (const rule of ['polyline {stroke: transparent}', 'polyline {stroke-dasharray: 0 4}', 'rect {fill-opacity: 0; stroke-opacity: 0}']) {
      const css = observe(agenticSvg(family).replace('</svg>', `<style>${rule}</style></svg>`))
      expect(finding(css, 'svg-edge-owned-ink:0')?.status).toBe('unmeasured')
      expect(css.semanticComplete).toBe(false)
    }
  })
}
test('Agentic Class direction needs a referenced, visible and correctly oriented open arrow', () => {
  for (const ink of [
    agenticSvg('class').replace(' marker-end="url(#arrow)"', ''),
    agenticSvg('class').replace('id="arrow"', 'id="missing"'),
    agenticSvg('class').replace('fill="none" stroke="#111"', 'fill="none" stroke="#111" opacity="0.0"'),
    agenticSvg('class').replace('points="0 0,8 3,0 6"', 'points="8 0,0 3,8 6"'),
  ]) {
    const result = qualifyPortable(graph('class'), { svg: ink, model: agenticModel('class'), adapter: 'agentic' })
    expect(finding(result, 'svg-edge-target-marker:0')?.status).toBe('failed')
    expect(result.semanticComplete).toBe(false)
  }
})
test('Agentic ER exact glyph meaning and identifying appearance reject credible substitutions', () => {
  for (const ink of [
    agenticSvg('er').replace('<line x1="38" y1="14" x2="38" y2="26" stroke="#111"/>', ''),
    agenticSvg('er').replace('cx="90"', 'cx="80"'),
    agenticSvg('er').replace('cx="90" cy="20" r="4" fill="#fff" stroke="#111"', 'cx="90" cy="20" r="4" fill="#fff" stroke="none"'),
    agenticSvg('er').replace('points="30,20 110,20"', 'stroke-dasharray="4 3" points="30,20 110,20"'),
    agenticSvg('er').replace('</svg>', '<circle cx="42" cy="20" r="4" stroke="#111"/></svg>'), // Conflicting zero minimum added to two ticks.
    agenticSvg('er').replace('</svg>', agenticGlyphs(30, 110) + '</svg>'), // A second owner cannot reuse the same endpoint glyphs.
  ]) {
    const result = qualifyPortable(graph('er'), { svg: ink, model: agenticModel('er'), adapter: 'agentic' })
    expect(result.semanticComplete).toBe(false)
    expect(result.checks.some(check => check.name.startsWith('svg-er-') && check.status !== 'passed')).toBe(true)
  }
  const native = agenticModel('er'); native.value.body.relations[0]!.rightCard = 'one-or-many'
  const result = qualifyPortable(graph('er'), { svg: agenticSvg('er'), model: native, adapter: 'agentic' })
  expect(finding(result, 'model-er-cardinality-and-identifying')?.status).toBe('failed')
  const conflicting = qualifyPortable(graph('er'), { svg: agenticSvg('er').replace('</svg>', '<circle cx="42" cy="20" r="4" stroke="#111"/></svg>'), model: agenticModel('er'), adapter: 'agentic' })
  expect(finding(conflicting, 'svg-er-cardinality-ink:0')?.status).toBe('unmeasured')
  expect(conflicting.semanticComplete).toBe(false)
})
test('Agentic parallel and reciprocal relations retain exact multiplicity independently of SVG DOM order', () => {
  for (const family of ['class', 'er'] as const) {
    const routes = [{ source: 'A', target: 'B', from: 30, to: 110, y: 14 }, { source: 'A', target: 'B', from: 30, to: 110, y: 20 }, { source: 'B', target: 'A', from: 110, to: 30, y: 26 }]
    const edges = routes.map(({ source, target }) => ({ source, target })), authored = { ...graph(family), source: `${family === 'class' ? 'classDiagram' : 'erDiagram'}\n` + edges.map(({ source, target }) => `${source} ${family === 'class' ? '-->' : '||--o{'} ${target}${family === 'er' ? ' : owns' : ''}`).join('\n'), expected: { ...graph(family).expected, topology: { nodes: ['A', 'B', 'C'], edges } } }
    const native = agenticModel(family, edges)
    const qualified = qualifyPortable(authored, { svg: agenticSvg(family, routes.toReversed()), model: native, adapter: 'agentic' })
    expect(qualified.semanticComplete, JSON.stringify(qualified.checks.filter(check => check.status !== 'passed'))).toBe(true)
    const dropped = qualifyPortable(authored, { svg: agenticSvg(family, routes.slice(1)), model: native, adapter: 'agentic' })
    expect(finding(dropped, 'svg-owned-edge-count')?.status).toBe('failed')
    expect(dropped.semanticComplete).toBe(false)
    if (family === 'er') {
      const duplicated = [routes[1]!, routes[1]!], repeatedEdges = duplicated.map(({ source, target }) => ({ source, target })), repeatedCase = { ...authored, source: 'erDiagram\nA ||--o{ B : one\nA ||--o{ B : two', expected: { ...authored.expected, topology: { nodes: ['A', 'B', 'C'], edges: repeatedEdges } } }
      const shared = agenticSvg(family, duplicated).replace(agenticGlyphs(30, 110), '')
      const borrowed = qualifyPortable(repeatedCase, { svg: shared, model: agenticModel(family, repeatedEdges), adapter: 'agentic' })
      expect(borrowed.semanticComplete).toBe(false)
      expect(finding(borrowed, 'svg-er-cardinality-ink:1')?.status).toBe('failed')
    }
  }
})
test('Agentic ER distinguishes all four reviewed cardinality glyphs and dashed identifying intent', () => {
  const line = (x1: number, y1: number, x2: number, y2: number) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111"/>`
  const glyphs = line(34, 14, 34, 26) + '<circle cx="42" cy="20" r="4" fill="#fff" stroke="#111"/>'
    + [13, 20, 27].map(y => line(106, y, 94, 20)).join('') + line(90, 14, 90, 26)
    + [13, 20, 27].map(y => line(134, y, 146, 20)).join('') + line(150, 14, 150, 26)
    + line(206, 14, 206, 26) + line(202, 14, 202, 26)
  const ink = agenticSvg('er').replace(agenticGlyphs(30, 110) + agenticGlyphs(130, 210), glyphs).replace('points="30,20 110,20"', 'stroke-dasharray="4 3" points="30,20 110,20"')
  const authored = { ...graph('er'), source: 'erDiagram\nA |o..|{ B : first\nB }|--|| C : second' }, native = agenticModel('er')
  Object.assign(native.value.body.relations[0]!, { leftCard: 'zero-or-one', rightCard: 'one-or-many', dashed: true })
  Object.assign(native.value.body.relations[1]!, { leftCard: 'one-or-many', rightCard: 'one-only' })
  const result = qualifyPortable(authored, { svg: ink, model: native, adapter: 'agentic' })
  expect(result.semanticComplete, JSON.stringify(result.checks.filter(check => check.status !== 'passed'))).toBe(true)
})

test('published Pele ER cardinality bars remain separate painted strokes, not a connecting relation', () => {
  const actualSvg = readFileSync(join(import.meta.dir, 'fixtures/fidelity/pele-er-cardinality-bars.svg'), 'utf8')
  const authored: PortableCase = {
    id: 'published-pele-er-bars', family: 'er', cohort: 'adversarial',
    source: 'erDiagram\nALPHA ||--o{ BETA : owns',
    expected: { accept: true, labels: ['ALPHA', 'BETA'], topology: { nodes: ['ALPHA', 'BETA'], edges: [{ source: 'ALPHA', target: 'BETA' }] } },
  }
  const nativeModel = { type: 'er', entities: new Map(['ALPHA', 'BETA'].map(id => [id, { id: 'entity-' + id, label: id }])), relationships: [{ entityA: 'entity-ALPHA', entityB: 'entity-BETA' }] }
  const observe = (ink: string) => qualifyPortable(authored, { svg: ink, model: nativeModel })
  expect(finding(observe(actualSvg), 'svg-edge-end-markers:0')?.status).toBe('passed')
  expect(observe(actualSvg).semanticComplete).toBe(true)
  // A shared SVG translation changes no physical attachment relationship.
  const translated = actualSvg.replace(/viewBox="[^"]+"/, 'viewBox="0 0 180 250"').replace(/(<svg[^>]*>)/, '$1<g transform="translate(20,10)">').replace('</svg>', '</g></svg>')
  expect(observe(translated).semanticComplete).toBe(true)
  const bars = 'M51,62L61,62M51,66L61,66'
  for (const path of [
    'M151,62L161,62M151,66L161,66', // Both legitimate bars detached from either entity.
    'M51,62L61,62M51,66L61,66L70,70', // Extra unreviewed stroke.
    'M51,62L51,62M51,66L51,66', // Zero-length ink.
    'M51,62L61,62M51,66L60,68', // Nonparallel strokes.
    'M51,62L61,62M55,66L65,66', // Offset along the stroke: no reviewed aligned bar pair.
    'L51,62L61,62M51,66L61,66', // Illegal initial drawing command.
  ]) {
    const result = observe(actualSvg.replace(bars, path))
    expect(finding(result, 'svg-edge-end-markers:0')?.status, path).not.toBe('passed')
    expect(result.semanticComplete, path).toBe(false)
  }
  const disconnectedRoute = observe(actualSvg.replace('M56,56L56,145', 'M56,56L56,90M56,100L56,145'))
  expect(finding(disconnectedRoute, 'svg-edge-attachment:0')?.status).toBe('unmeasured')
  expect(disconnectedRoute.semanticComplete).toBe(false)
  expect(finding(observe(actualSvg.replace('cy="131"', 'cy="90"')), 'svg-edge-end-markers:0')?.status).toBe('failed')
  expect(finding(observe(actualSvg.replace('r="3.5"', 'r="0"')), 'svg-edge-end-markers:0')?.status).toBe('unmeasured')
})

for (const family of ['class', 'state', 'er'] as const) {
  test(`${family}: owned geometry binds authored relations without guessing generated IDs`, () => {
    const result = qualifyPortable(graph(family), { svg: svg(family), model: model(family) })
    expect(result.passed).toBe(true)
    expect(result.semanticComplete).toBe(true)
    expect(finding(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('passed')
    // DOM order is irrelevant; the independently observed endpoints bind each edge.
    expect(qualifyPortable(graph(family), { svg: svg(family, edge(family, 1, 130, 210) + edge(family, 0, 30, 110)), model: model(family) }).semanticComplete).toBe(true)
  })
  test(`${family}: correct public model and labels cannot hide an edge redirected to another node`, () => {
    const result = qualifyPortable(graph(family), { svg: svg(family, edge(family, 0, 30, 210) + edge(family, 1, 130, 210)), model: model(family) })
    expect(finding(result, 'model-edge-endpoints-and-multiplicity')?.status).toBe('passed')
    expect(finding(result, 'label:B')?.status).toBe('passed')
    expect(finding(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('failed')
    expect(result.semanticComplete).toBe(false)
  })
  test(`${family}: dropped relation ink fails despite unchanged labels and native graph`, () => {
    const result = qualifyPortable(graph(family), { svg: svg(family, edge(family, 0, 30, 110)), model: model(family) })
    expect(finding(result, 'model-node-identities')?.status).toBe('passed')
    expect(finding(result, 'label:C')?.status).toBe('passed')
    expect(finding(result, 'svg-owned-edge-count')?.status).toBe('failed')
    expect(result.passed).toBe(false)
  })
  test(`${family}: body paths without endpoint marker ink cannot certify the declared relation`, () => {
    const result = qualifyPortable(graph(family), { svg: svg(family, edge(family, 0, 30, 110, false) + edge(family, 1, 130, 210)), model: model(family) })
    expect(finding(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('passed')
    expect(finding(result, family === 'er' ? 'svg-edge-end-markers:0' : 'svg-edge-target-marker:0')?.status).toBe('failed')
    expect(result.semanticComplete).toBe(false)
  })
}
test('duplicate relation owner IDs fail even when all expected geometric endpoint pairs are present', () => {
  const result = qualifyPortable(graph('class'), { svg: svg('class').replace('data-id="relation-1"', 'data-id="relation-0"'), model: model('class') })
  expect(finding(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('passed')
  expect(finding(result, 'svg-owned-edge-identities')?.status).toBe('failed')
  expect(result.semanticComplete).toBe(false)
})
test('a degenerate move-only path is not a connecting segment', () => {
  const result = qualifyPortable(graph('state'), { svg: svg('state').replace('M30,20 L103,20', 'M30,20'), model: model('state') })
  expect(finding(result, 'svg-edge-attachment:0')?.status).toBe('unmeasured')
  expect(result.semanticComplete).toBe(false)
})
test('a failed canvas or authored-label criterion withholds semantic completion despite correct topology', () => {
  const emptyCanvas = qualifyPortable(graph('state'), { svg: svg('state').replace('0 0 250 50', '0 0 0 0'), model: model('state') })
  expect(finding(emptyCanvas, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('passed')
  expect(finding(emptyCanvas, 'positive-canvas')?.status).toBe('failed')
  expect(emptyCanvas.semanticComplete).toBe(false)
  const annotated = { ...graph('class'), expected: { ...graph('class').expected, labels: ['A', 'B', 'C', 'Required authored note'] } }
  expect(qualifyPortable(annotated, { svg: svg('class'), model: model('class') }).semanticComplete).toBe(false)
})
test('unreviewed class marker profiles remain unmeasured rather than pretending to cover all relationship kinds', () => {
  const actual = model('class')
  const relations = (actual as { relations: { relation: { type1: string; type2: number } }[] }).relations
  relations[0]!.relation.type2 = 0
  const result = qualifyPortable(graph('class'), { svg: svg('class'), model: actual })
  expect(finding(result, 'svg-edge-target-marker:0')?.status).toBe('unmeasured')
  expect(result.semanticComplete).toBe(false)
})

const sequence: PortableCase = {
  id: 'owned-sequence',
  family: 'sequence',
  cohort: 'adversarial',
  source: 'sequenceDiagram\nparticipant A\nparticipant B\nparticipant C\nA->>B: Request\nB-->>A: Reply',
  expected: {
    accept: true,
    labels: ['A', 'B', 'C', 'Request', 'Reply'],
    topology: {
      nodes: ['A', 'B', 'C'],
      edges: [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'A' },
      ],
    },
  },
}
const sequenceModel = () => ({
  type: 'sequence',
  actors: new Map(['A', 'B', 'C'].map(id => [id, { name: id, description: id, type: 'participant' }])),
  messages: [
    { from: 'A', to: 'B', message: 'Request', type: 0 },
    { from: 'B', to: 'A', message: 'Reply', type: 1 },
  ],
  notes: [],
  boxes: [],
  createdActors: {},
  destroyedActors: {},
  active: {},
})
const participant = (id: string, x: number, footer = false) => `<g class="pele-node pele-actor${footer ? ' pele-actor-footer' : ''}" data-id="${id}"><rect x="${x - 10}" y="${footer ? 200 : 10}" width="20" height="20" fill="white" stroke="black"/><text x="${x}" y="${footer ? 215 : 25}">${id}</text></g>`
const message = (index: number, from: number, to: number, y: number) =>
  `<g class="pele-edge pele-message" data-id="message-${index}"><path d="M${from},${y}H${to - Math.sign(to - from) * 7}"/><path class="pele-marker" d="M${to},${y}L${to - Math.sign(to - from) * 8},${y - 4}L${to - Math.sign(to - from) * 8},${y + 4}Z" fill="black" stroke="none"/></g>`
const messageLabel = (index: number, label: string, y: number) => `<g class="pele-edge-label" data-id="message-${index}"><text x="70" y="${y}">${label}</text></g>`
const sequenceSvg = (messages = message(0, 20, 120, 70) + message(1, 120, 20, 110), labels = messageLabel(0, 'Request', 65) + messageLabel(1, 'Reply', 105), extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="pele pele-sequence" viewBox="0 0 250 240"><g class="pele-edges" stroke="black" fill="none">${messages}</g>${['A', 'B', 'C'].map((id, i) => participant(id, i * 100 + 20) + participant(id, i * 100 + 20, true) + `<path class="pele-lifeline" data-id="${id}" d="M${i * 100 + 20},30V200" stroke="black"/>`).join('')}${labels}${extra}</svg>`

test('simple sequence messages bind to actor lifelines while legitimate footer duplicates stay distinct', () => {
  const result = qualifyPortable(sequence, { svg: sequenceSvg(), model: sequenceModel() })
  expect(result.passed).toBe(true)
  expect(result.semanticComplete).toBe(true)
  expect(finding(result, 'svg-owned-node-identities')?.status).toBe('passed')
  expect(finding(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('passed')
})
test('sequence message paint redirected to a third actor fails with correct labels and unchanged native messages', () => {
  const result = qualifyPortable(sequence, { svg: sequenceSvg(message(0, 20, 220, 70) + message(1, 120, 20, 110)), model: sequenceModel() })
  expect(finding(result, 'model-message-order')?.status).toBe('passed')
  expect(finding(result, 'label:Request')?.status).toBe('passed')
  expect(finding(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('failed')
  expect(result.semanticComplete).toBe(false)
})
test('duplicating a message label cannot be hidden by an unowned global copy of the missing text', () => {
  const result = qualifyPortable(sequence, { svg: sequenceSvg(undefined, messageLabel(0, 'Request', 65) + messageLabel(1, 'Request', 105), '<text x="10" y="230">Reply</text>'), model: sequenceModel() })
  expect(finding(result, 'label:Reply')?.status).toBe('passed')
  expect(finding(result, 'svg-sequence-owned-message-label:1')?.status).toBe('failed')
  expect(result.semanticComplete).toBe(false)
})
test('sequence chronology comes from painted rows, not DOM order or native endpoint multiset alone', () => {
  const result = qualifyPortable(sequence, { svg: sequenceSvg(message(0, 20, 120, 110) + message(1, 120, 20, 70)), model: sequenceModel() })
  expect(finding(result, 'model-edge-endpoints-and-multiplicity')?.status).toBe('passed')
  expect(finding(result, 'svg-owned-edge-endpoints-and-multiplicity')?.status).toBe('failed')
  expect(result.passed).toBe(false)
})
test('a duplicated actor header cannot impersonate a legitimate footer', () => {
  const result = qualifyPortable(sequence, { svg: sequenceSvg(undefined, undefined, participant('A', 20)), model: sequenceModel() })
  expect(finding(result, 'svg-owned-node-identities')?.status).toBe('failed')
  expect(result.semanticComplete).toBe(false)
})
test('unreviewed sequence signal styles stay unmeasured even when their labels and endpoints match', () => {
  const actual = sequenceModel()
  actual.messages[0]!.type = 2
  const result = qualifyPortable(sequence, { svg: sequenceSvg(), model: actual })
  expect(finding(result, 'model-message-order')?.status).toBe('passed')
  expect(finding(result, 'svg-sequence-message-profile')?.status).toBe('unmeasured')
  expect(result.semanticComplete).toBe(false)
})

test('Agentic Class marker presentation cannot hide or add arrows behind valid SVG attributes', () => {
  const observe = (ink: string) => qualifyPortable(graph('class'), { svg: ink, model: agenticModel('class'), adapter: 'agentic' })
  const base = agenticSvg('class')
  expect(observe(base).semanticComplete).toBe(true)
  expect(observe(base.replace('</svg>', '<style>/* theme tokens */ svg { --fg:#111 }</style></svg>')).semanticComplete).toBe(true)
  for (const replacement of [
    'marker-end="url(#arrow)" style="marker-end:none"',
    'marker-end="url(#arrow)" style="MARKER-END:none"',
    'marker-end="url(#arrow)" style="marker-end/**/:none"',
    'marker-end="url(#arrow)" style="marker:none"',
    'marker-end="url(#arrow)" style="marker-end:none !important;marker-end:url(#arrow)"',
    'marker-end="url(#arrow)" marker-start="url(#arrow)"',
    'marker-end="url(#arrow)" marker-mid="url(#arrow)"',
  ]) {
    const result = observe(base.replace('marker-end="url(#arrow)"', replacement))
    expect(result.evidence?.outputAdmission).toBe('passed')
    expect(finding(result, 'svg-edge-target-marker:0')?.status).not.toBe('passed')
    expect(result.semanticComplete).toBe(false)
  }
  expect(observe(base.replaceAll('marker-end="url(#arrow)"', 'style="marker-end:url(#arrow)"')).semanticComplete).toBe(true)
  const stylesheet = observe(base.replace('</svg>', '<style>.class-relationship { marker-end/**/:none }</style></svg>'))
  expect(finding(stylesheet, 'svg-edge-target-marker:0')?.status).not.toBe('passed')
  expect(stylesheet.semanticComplete).toBe(false)
})
