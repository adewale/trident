import { assessSvgStructure, assessTerminalStructure } from './structure.ts'
import type { DrawingCase } from './corpus.ts'
import { analyseTerminalSource } from '../terminal-source.ts'

// Independently authored graph and pictures; no renderer supplies the oracle.
export const structureControlCase = {
  id: 'structure-control', family: 'flowchart', source: 'flowchart LR\nAlpha-->Beta\nBeta-->Gamma', sourceGaps: [], geometry: [], origins: [],
  expected: { labels: ['Alpha', 'Beta', 'Gamma'], nodes: ['Alpha', 'Beta', 'Gamma'].map(id => ({ id, label: id })), edges: [{ source: 'Alpha', target: 'Beta', directed: true, startMarker: 'none', endMarker: 'arrow' }, { source: 'Beta', target: 'Gamma', directed: true, startMarker: 'none', endMarker: 'arrow' }] },
  terminal: { expected: { graph: { nodes: ['Alpha', 'Beta', 'Gamma'].map(id => ({ id, label: id })), edges: [{ source: 'Alpha', target: 'Beta', directed: true }, { source: 'Beta', target: 'Gamma', directed: true }], layout: [{ before: 'Alpha', after: 'Beta', axis: 'x' }, { before: 'Beta', after: 'Gamma', axis: 'x' }] }, contract: { family: 'flowchart', facts: [{ criterion: 'nodes', expected: [] }, { criterion: 'relationships', expected: [] }, { criterion: 'layout-order', expected: [] }], sourceUncertainties: [] } } },
} as unknown as DrawingCase
export function structureControlSvg(reverseLayout = false) {
  const positions = reverseLayout ? [290, 150, 10] : [10, 150, 290]
  const nodes = ['Alpha', 'Beta', 'Gamma'].map((name, i) => `<g><rect x="${positions[i]}" y="10" width="60" height="30" fill="white" stroke="black"/><text x="${positions[i]! + 4}" y="30">${name}</text></g>`).join('')
  const links = [0, 1].map(i => { const a = positions[i]!, b = positions[i + 1]!, right = b > a; return `<path d="M${a + (right ? 60 : 0)} 25 L${b + (right ? 0 : 60)} 25" fill="none" stroke="black" marker-end="url(#arrow)"/>` }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80"><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z"/></marker></defs>${nodes}${links}</svg>`
}
export const structureControlTerminal = '┌───────┐     ┌──────┐     ┌───────┐\n│       │     │      │     │       │\n│ Alpha ├────►│ Beta ├────►│ Gamma │\n│       │     │      │     │       │\n└───────┘     └──────┘     └───────┘'

export function familyStructureControl(family: 'class' | 'state' | 'er' | 'sequence') {
  const chain = 'Alpha-->Beta\nBeta-->Gamma'
  const source = family === 'class' ? 'classDiagram\nclass Alpha\nclass Beta\nclass Gamma\nAlpha --> Beta\nBeta --> Gamma' : family === 'state' ? 'stateDiagram-v2\n' + chain : family === 'sequence' ? 'sequenceDiagram\nAlpha->>Beta: hi\nBeta->>Gamma: ok' : 'erDiagram\nAlpha ||--|| Beta : links\nBeta ||--|| Gamma : links'
  const edges = family === 'er' ? structureControlCase.expected.edges!.map(e => ({ ...e, directed: false, startMarker: 'none', endMarker: 'none', label: 'links' })) : family === 'sequence' ? structureControlCase.expected.edges!.map((e, i) => ({ ...e, label: i ? 'ok' : 'hi' })) : structureControlCase.expected.edges
  const expected = { ...structureControlCase.expected, labels: [...structureControlCase.expected.labels, ...(family === 'er' ? ['links'] : family === 'sequence' ? ['hi', 'ok'] : [])], edges }
  const { contract, graph } = analyseTerminalSource(source, family)
  const test = { ...structureControlCase, family, source, expected, terminal: { expected: { contract, graph } } } as DrawingCase
  let svg = structureControlSvg()
  if (family === 'er') svg = svg.replaceAll(' marker-end="url(#arrow)"', '').replace('</svg>', '<text x="95" y="18">links</text><text x="235" y="18">links</text></svg>')
  if (family === 'sequence') svg = svg.replace('height="80"', 'height="200"').replace('M70 25 L150 25', 'M40 80 L180 80').replace('M210 25 L290 25', 'M180 130 L320 130').replace('</svg>', '<line x1="40" y1="40" x2="40" y2="180" stroke="black" stroke-dasharray="4 4"/><line x1="180" y1="40" x2="180" y2="180" stroke="black" stroke-dasharray="4 4"/><line x1="320" y1="40" x2="320" y2="180" stroke="black" stroke-dasharray="4 4"/><text x="95" y="72">hi</text><text x="235" y="122">ok</text></svg>')
  return { test, svg }
}

export function sequenceStructureTerminal() {
  const grid = Array.from({ length: 14 }, () => Array(46).fill(' ')), write = (x: number, y: number, text: string) => { [...text].forEach((c, i) => grid[y]![x + i] = c) }
  for (const [index, name] of ['Alpha', 'Beta', 'Gamma'].entries()) {
    const x = index * 18
    write(x, 0, '┌───────┐'); write(x, 1, '│' + name.padStart(6).padEnd(7) + '│'); write(x, 2, '└───┬───┘')
    for (let y = 3; y < 14; y++) write(x + 4, y, '│')
  }
  write(4, 5, '│─────────────────▶'); write(11, 4, 'hi')
  write(22, 10, '│─────────────────▶'); write(29, 9, 'ok')
  return grid.map(row => row.join('').trimEnd()).join('\n')
}
export const erStructureTerminal = '┌───────┐\n│ Alpha │\n└───┬───┘\n    │1\n    │ links\n    │\n    │1\n┌───┴───┐\n│ Beta  │\n└───┬───┘\n    │1\n    │ links\n    │\n    │1\n┌───┴───┐\n│ Gamma │\n└───────┘'

export const quadrantStructureControl = {
  ...structureControlCase, id: 'quadrant-clearance-control', family: 'quadrant', source: 'quadrantChart\nquadrant-1 Q1\nquadrant-2 Q2\nquadrant-3 Q3\nquadrant-4 Q4\nAlpha: [0.25, 0.75]',
  expected: { labels: ['Alpha', 'Q1', 'Q2', 'Q3', 'Q4'], facts: { points: [{ label: 'Alpha', x: .25, y: .75 }], quadrants: [1, 2, 3, 4].map(number => ({ number, label: 'Q' + number })) } },
} as unknown as DrawingCase
export function quadrantStructureSvg(collision = false) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" style="font:14px sans-serif">' + [20, 120].flatMap(x => [20, 120].map(y => `<rect x="${x}" y="${y}" width="100" height="100" fill="#eee" stroke="#888"/>`)).join('') + '<circle cx="70" cy="70" r="5" fill="black"/><text x="84" y="75">Alpha</text><text x="165" y="45">Q1</text>' + (collision ? '<text x="64" y="75">Q2</text>' : '<text x="55" y="45">Q2</text>') + '<text x="55" y="195">Q3</text><text x="165" y="195">Q4</text></svg>'
}

export async function qualifyStructureObserver(context: any) {
  const base = structureControlSvg()
  const svgControls = [
    { name: 'complete-graph', svg: base, topology: 'passed', layout: 'passed' },
    { name: 'reversed-edge', svg: base.replace('M70 25 L150 25', 'M150 25 L70 25'), topology: 'failed' },
    { name: 'missing-arrowhead', svg: base.replace(' marker-end="url(#arrow)"', ''), topology: 'failed' },
    { name: 'hidden-route', svg: base.replaceAll('stroke="black" marker-end', 'stroke="black" stroke-opacity="0" marker-end'), topology: 'failed' },
    { name: 'occluded-route', svg: base.replace('</svg>', '<rect x="90" y="15" width="30" height="20" fill="white"/></svg>'), topology: 'unassessed' },
    { name: 'duplicated-edge', svg: base.replace('</svg>', '<path d="M70 25 L150 25" fill="none" stroke="black" marker-end="url(#arrow)"/></svg>'), topology: 'failed' },
    { name: 'wrong-source-order', svg: structureControlSvg(true), layout: 'failed' },
  ]
  const observed: { name: string; format: string; topology: string; layout: string }[] = []
  for (const control of svgControls) {
    const page = await context.newPage()
    try {
      await page.setContent(control.svg)
      const result = await assessSvgStructure(structureControlCase, page)
      if (control.topology && result.topology.status !== control.topology || control.layout && result.layout.status !== control.layout) throw Error('Structural SVG observer failed ' + control.name + ': ' + JSON.stringify(result))
      observed.push({ name: control.name, format: 'svg', topology: result.topology.status, layout: result.layout.status })
    } finally { await page.close() }
  }
  for (const family of ['class', 'state', 'er', 'sequence'] as const) {
    const control = familyStructureControl(family), page = await context.newPage()
    try {
      await page.setContent(control.svg)
      const positive = await assessSvgStructure(control.test, page)
      if (positive.topology.status !== 'passed') throw Error('Structural family control failed ' + family + ': ' + JSON.stringify(positive))
      const damaged = family === 'sequence' ? control.svg.replace('M40 80 L180 80', 'M40 80 L120 80') : control.svg.replace('M70 25 L150 25', 'M70 25 L100 25')
      await page.setContent(damaged)
      const negative = await assessSvgStructure(control.test, page)
      if (negative.topology.status === 'passed') throw Error('Disconnected family control earned a pass: ' + family)
      observed.push({ name: family + '-complete', format: 'svg', topology: positive.topology.status, layout: positive.layout.status }, { name: family + '-disconnected', format: 'svg', topology: negative.topology.status, layout: negative.layout.status })
    } finally { await page.close() }
    const terminal = family === 'sequence' ? sequenceStructureTerminal() : family === 'er' ? erStructureTerminal : structureControlTerminal
    const positive = assessTerminalStructure(control.test, terminal)
    if (positive.topology.status !== 'passed') throw Error('Structural terminal family control failed ' + family + ': ' + JSON.stringify(positive))
    const damaged = family === 'er' ? terminal.replace('│1', '│0..1') : terminal.replace(/[►▶]/, '◄')
    const negative = assessTerminalStructure(control.test, damaged)
    if (negative.topology.status === 'passed') throw Error('Damaged terminal family control earned a pass: ' + family)
    observed.push({ name: family + '-complete', format: 'terminal', topology: positive.topology.status, layout: positive.layout.status }, { name: family + '-damaged', format: 'terminal', topology: negative.topology.status, layout: negative.layout.status })
  }
  for (const variant of ['clear', 'marker-first', 'marker-last']) {
    const page = await context.newPage()
    try {
      const collision = variant !== 'clear'
      let svg = quadrantStructureSvg(collision)
      if (variant === 'marker-last') svg = svg.replace('<circle cx="70" cy="70" r="5" fill="black"/>', '').replace('</svg>', '<circle cx="70" cy="70" r="5" fill="black"/></svg>')
      await page.setContent(svg)
      const result = await assessSvgStructure(quadrantStructureControl, page)
      if (result.layout.status !== (collision ? 'failed' : 'passed')) throw Error('Quadrant structural qualification failed: ' + JSON.stringify(result))
      observed.push({ name: 'quadrant-' + (variant === 'clear' ? 'clear' : variant === 'marker-first' ? 'marker-over-caption' : 'marker-occludes-caption'), format: 'svg', topology: result.topology.status, layout: result.layout.status })
    } finally { await page.close() }
  }
  for (const control of [
    { name: 'complete-graph', text: structureControlTerminal, topology: 'passed' },
    { name: 'reversed-arrow', text: structureControlTerminal.replace('►', '◄'), topology: 'failed' },
    { name: 'labels-without-routes', text: 'Alpha Beta Gamma', topology: 'unassessed' },
    { name: 'closed-wire-loop-is-not-an-extra-caption', text: structureControlTerminal + '\n┌───┐\n│ │ │\n└───┘', topology: 'unassessed' },
  ]) {
    const result = assessTerminalStructure(structureControlCase, control.text)
    if (result.topology.status !== control.topology) throw Error('Structural terminal observer failed ' + control.name + ': ' + JSON.stringify(result))
    observed.push({ name: control.name, format: 'terminal', topology: result.topology.status, layout: result.layout.status })
  }
  return observed
}
