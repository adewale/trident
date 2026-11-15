/** Independent admission controls for the observers that decide source
 * obligations beyond those already qualified by the structure observer. The
 * pictures and source facts are hand-authored; no renderer supplies an oracle. */
import type { DrawingCase } from './corpus.ts'
import { classifyObligations, type ObligationCategory } from './obligations.ts'
import { observeLayoutInContext, observeSvgObligations, observeTerminalObligations } from './obligation-observe.ts'
import { quadrantStructureControl, quadrantStructureSvg, structureControlCase } from './structure-controls.ts'

const nodes = ['Alpha', 'Beta', 'Gamma'].map(id => ({ id, label: id }))
/** Alpha → Gamma with Beta between them, plus a regression geometry list. */
export const obligationControlCase = {
  ...structureControlCase, id: 'obligation-control', source: 'flowchart LR\nAlpha-->Gamma\nBeta',
  geometry: ['distinct-node-bodies', 'edge-node-clearance', 'orthogonal-node-approach'],
  expected: { labels: ['Alpha', 'Beta', 'Gamma'], nodes, edges: [{ source: 'Alpha', target: 'Gamma', directed: true, startMarker: 'none', endMarker: 'arrow' }] },
  terminal: { expected: { status: 'independently-reviewed', graph: { nodes, edges: [{ source: 'Alpha', target: 'Gamma', directed: true }] }, contract: { family: 'flowchart', sourceUncertainties: [], facts: [{ criterion: 'nodes', expected: nodes }, { criterion: 'relationships', expected: [{ source: 'Alpha', target: 'Gamma' }] }] } } },
} as unknown as DrawingCase

/** Variants: `clear` routes around Beta and enters Gamma horizontally;
 * `through` crosses Beta's body; `diagonal` enters Gamma's left side steeply;
 * `overlap` moves Beta onto Gamma. */
export function obligationControlSvg(variant: 'clear' | 'through' | 'diagonal' | 'overlap' = 'clear') {
  const beta = variant === 'overlap' ? 270 : 150
  const box = (x: number, y: number, name: string) => `<g><rect x="${x}" y="${y}" width="60" height="30" fill="white" stroke="black"/><text x="${x + 4}" y="${y + 20}">${name}</text></g>`
  const route = variant === 'through' ? 'M70 25 L289 25' : variant === 'diagonal' ? 'M70 25 L100 25 L100 90 L260 90 L289 30' : 'M70 25 L100 25 L100 90 L260 90 L260 25 L289 25'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120"><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z"/></marker></defs>${box(10, 10, 'Alpha')}${box(beta, variant === 'overlap' ? 20 : 10, 'Beta')}${box(290, 10, 'Gamma')}<path d="${route}" fill="none" stroke="black" marker-end="url(#arrow)"/></svg>`
}
export const obligationControlTerminal = '┌───────┐   ┌──────┐   ┌───────┐\n│ Alpha │   │ Beta │   │ Gamma │\n└───┬───┘   └──────┘   └───────┘\n    │                      ▲\n    └──────────────────────┘'

/** Two-slice pie with a colour legend: Alpha 75, Beta 25. */
export const pieObligationCase = {
  ...structureControlCase, id: 'pie-obligation-control', family: 'pie', source: 'pie\n"Alpha" : 75\n"Beta" : 25', geometry: [],
  expected: { labels: ['Alpha', 'Beta'], facts: { slices: [{ label: 'Alpha', value: 75 }, { label: 'Beta', value: 25 }] } },
  terminal: { expected: { status: 'independently-reviewed', contract: { family: 'pie', sourceUncertainties: [], facts: [{ criterion: 'slice-values', expected: [{ label: 'Alpha', value: 75 }, { label: 'Beta', value: 25 }] }] } } },
} as unknown as DrawingCase
/** `swapped` paints Alpha's colour on the 25% arc. */
export function pieObligationSvg(swapped = false) {
  const [alpha, beta] = swapped ? ['#08c', '#c00'] : ['#c00', '#08c']
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" style="font:14px sans-serif"><path d="M100 100 L100 20 A80 80 0 1 1 20 100 Z" fill="${alpha}"/><path d="M100 100 L20 100 A80 80 0 0 1 100 20 Z" fill="${beta}"/><rect x="220" y="40" width="12" height="12" fill="#c00"/><text x="238" y="51">Alpha</text><rect x="220" y="70" width="12" height="12" fill="#08c"/><text x="238" y="81">Beta</text></svg>`
}

type Expectation = Partial<Record<string, 'passed' | 'failed' | 'unassessed'>>
const obligation = (assessment: ReturnType<typeof classifyObligations>, category: ObligationCategory, name: string) => assessment.categories[category].obligations.find(o => o.name === name)?.status

/** Production qualification of the obligation observers. Throws on any
 * control that does not reproduce its independently expected verdict. */
export async function qualifyObligationObservers(context: any, layoutContext: any) {
  const observed: { name: string; format: string; obligations: Record<string, string | undefined> }[] = []
  const svgControls: { name: string; svg: string; expect: Expectation }[] = [
    { name: 'regression-geometry-clear', svg: obligationControlSvg('clear'), expect: { 'distinct-node-bodies': 'passed', 'edge-node-clearance': 'passed', 'orthogonal-node-approach': 'passed', relationships: 'passed' } },
    { name: 'route-through-unrelated-node', svg: obligationControlSvg('through'), expect: { 'edge-node-clearance': 'failed', 'distinct-node-bodies': 'passed' } },
    { name: 'steep-approach-into-side', svg: obligationControlSvg('diagonal'), expect: { 'orthogonal-node-approach': 'failed', 'edge-node-clearance': 'passed' } },
    { name: 'overlapping-node-bodies', svg: obligationControlSvg('overlap'), expect: { 'distinct-node-bodies': 'failed' } },
    { name: 'reversed-relationship', svg: obligationControlSvg('clear').replace('M70 25 L100 25 L100 90 L260 90 L260 25 L289 25', 'M289 25 L260 25 L260 90 L100 90 L100 25 L70 25'), expect: { relationships: 'failed' } },
  ]
  for (const control of svgControls) {
    const page = await context.newPage()
    try {
      await page.setContent('<!doctype html><style>body{margin:0}</style>' + control.svg)
      const evidence = await observeSvgObligations(obligationControlCase, page, () => observeLayoutInContext(layoutContext, obligationControlCase, control.svg))
      const result = classifyObligations(obligationControlCase, 'svg', { producerStatus: 'correct', ...evidence })
      const actual = Object.fromEntries(Object.keys(control.expect).map(name => [name, obligation(result, name === 'relationships' ? 'relationships' : 'geometry', name)]))
      for (const [name, expected] of Object.entries(control.expect)) if (actual[name] !== expected) throw Error('Obligation SVG control failed ' + control.name + ' ' + name + ': ' + actual[name] + ' ' + JSON.stringify(result.categories))
      observed.push({ name: control.name, format: 'svg', obligations: actual })
    } finally { await page.close() }
  }
  for (const [name, svg, expected] of [['pie-weights-match', pieObligationSvg(), 'passed'], ['pie-weights-swapped', pieObligationSvg(true), 'failed'], ['pie-without-legend', pieObligationSvg().replace(/<rect[^>]*>/g, ''), 'unassessed']] as const) {
    const page = await context.newPage()
    try {
      await page.setContent('<!doctype html><style>body{margin:0}</style>' + svg)
      const result = classifyObligations(pieObligationCase, 'svg', { producerStatus: 'correct', ...await observeSvgObligations(pieObligationCase, page) })
      const actual = obligation(result, 'geometry', 'slice-weights')
      if (actual !== expected) throw Error('Obligation SVG control failed ' + name + ': ' + actual + ' ' + JSON.stringify(result.categories))
      observed.push({ name, format: 'svg', obligations: { 'slice-weights': actual } })
    } finally { await page.close() }
  }
  // Quadrant point positions come from the structure observer's qualified coordinate check.
  const quadrant = { ...quadrantStructureControl, terminal: { expected: { contract: { family: 'quadrant', sourceUncertainties: [], facts: [{ criterion: 'quadrant-chart', expected: { points: [{ label: 'Alpha', x: .25, y: .75 }] } }] } } } } as unknown as DrawingCase
  for (const [name, svg, expected] of [['quadrant-point-in-place', quadrantStructureSvg(), 'passed'], ['quadrant-point-moved', quadrantStructureSvg().replace('cx="70" cy="70"', 'cx="170" cy="170"').replace('x="84" y="75"', 'x="184" y="175"'), 'failed']] as const) {
    const page = await context.newPage()
    try {
      await page.setContent('<!doctype html><style>body{margin:0}</style>' + svg)
      const result = classifyObligations(quadrant, 'svg', { producerStatus: 'correct', ...await observeSvgObligations(quadrant, page) })
      const actual = obligation(result, 'geometry', 'quadrant-points')
      if (actual !== expected) throw Error('Obligation SVG control failed ' + name + ': ' + actual + ' ' + JSON.stringify(result.categories))
      observed.push({ name, format: 'svg', obligations: { 'quadrant-points': actual } })
    } finally { await page.close() }
  }
  const terminalControls: { name: string; text: string; expect: Expectation }[] = [
    { name: 'regression-geometry-clear', text: obligationControlTerminal, expect: { 'distinct-node-bodies': 'passed', 'edge-node-clearance': 'passed', relationships: 'passed' } },
    { name: 'reversed-relationship', text: obligationControlTerminal.replace('▲', '│').replace('└───┬───┘', '└───▲───┘'), expect: { relationships: 'failed' } },
    { name: 'labels-without-frames', text: 'Alpha Beta Gamma', expect: { 'distinct-node-bodies': 'unassessed', 'edge-node-clearance': 'unassessed', relationships: 'unassessed' } },
  ]
  for (const control of terminalControls) {
    const result = classifyObligations(obligationControlCase, 'terminal', { producerStatus: 'correct', ...observeTerminalObligations(obligationControlCase, control.text) })
    const actual = Object.fromEntries(Object.keys(control.expect).map(name => [name, obligation(result, name === 'relationships' ? 'relationships' : 'geometry', name)]))
    for (const [name, expected] of Object.entries(control.expect)) if (actual[name] !== expected) throw Error('Obligation terminal control failed ' + control.name + ' ' + name + ': ' + actual[name] + ' ' + JSON.stringify(result.categories))
    observed.push({ name: control.name, format: 'terminal', obligations: actual })
  }
  return observed
}
