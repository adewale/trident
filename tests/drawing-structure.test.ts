import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { chromiumExecutable } from './helpers/environment.ts'
import { assessSvgStructure, assessTerminalStructure, inspectGraphLayout } from '../fidelity/drawing/structure.ts'
import { structureControlCase, structureControlSvg, structureControlTerminal, qualifyStructureObserver } from '../fidelity/drawing/structure-controls.ts'
import type { PaintEvidence } from '../fidelity/paint.ts'

test('structural checks distinguish edge direction, missing heads, multiplicity and source order from intact labels', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  const page = await browser.newPage()
  try {
    const svg = structureControlSvg()
    for (const [picture, topology, layout] of [
      [svg, 'passed', 'passed'],
      [svg.replace('M70 25 L150 25', 'M150 25 L70 25'), 'failed', 'passed'],
      [svg.replace(' marker-end="url(#arrow)"', ''), 'failed', 'passed'],
      [svg.replaceAll('stroke="black" marker-end', 'stroke="black" stroke-opacity="0" marker-end'), 'failed', 'passed'],
      [svg.replace('</svg>', '<path d="M70 25 L150 25" fill="none" stroke="black" marker-end="url(#arrow)"/></svg>'), 'failed', 'passed'],
      [structureControlSvg(true), 'passed', 'failed'],
    ] as const) {
      await page.setContent(picture)
      const result = await assessSvgStructure(structureControlCase, page)
      expect(result.topology.status).toBe(topology)
      expect(result.layout.status).toBe(layout)
    }
    const otherFamily = { ...structureControlCase, family: 'wardley' }
    expect((await assessSvgStructure(otherFamily, page)).topology.status).toBe('unassessed')
    const sharedMember = { ...structureControlCase, expected: { ...structureControlCase.expected, groups: [{ id: 'One', label: 'One', members: ['Alpha'] }, { id: 'Two', label: 'Two', members: ['Alpha'] }] } }
    expect((await assessSvgStructure(sharedMember, page)).topology.status).toBe('unassessed')
  } finally { await page.close(); await browser.close() }
})

test('production structure qualification covers graph families and real quadrant marker/caption clearance', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }), context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const controls = await qualifyStructureObserver(context)
    expect(controls.find(c => c.name === 'quadrant-marker-over-caption')?.layout).toBe('failed')
    expect(controls.find(c => c.name === 'quadrant-clear')?.layout).toBe('passed')
  } finally { await context.close(); await browser.close() }
}, 20_000)

test('terminal structure needs actual routes and arrow direction; labels alone earn no credit', () => {
  expect(assessTerminalStructure(structureControlCase, structureControlTerminal).topology.status).toBe('passed')
  expect(assessTerminalStructure(structureControlCase, structureControlTerminal.replace('►', '◄')).topology.status).toBe('failed')
  expect(assessTerminalStructure(structureControlCase, 'Alpha Beta Gamma').topology.status).toBe('unassessed')
  expect(assessTerminalStructure(structureControlCase, structureControlTerminal + '\n┌───┐\n│ │ │\n└───┘').topology.status).toBe('unassessed')
  const ambiguousState = { ...structureControlCase, family: 'state', terminal: { expected: { contract: { family: 'state', sourceUncertainties: [], facts: [{ criterion: 'states', expected: [{ id: 'A', scope: [] }, { id: 'A', scope: ['Parent'] }] }] } } } } as any
  expect(assessTerminalStructure(ambiguousState, structureControlTerminal).topology.status).toBe('unassessed')
})

test('layout diagnostics require qualified owners and reject measured overlap and contradictory source orders', () => {
  const paint = { checks: ['painted-node-ownership', 'visible-authored-labels', 'labels-within-canvas', 'unclipped-authored-labels'].map(criterion => ({ criterion, status: 'passed' })), nodes: [{ id: 'Alpha', box: { x: 0, y: 0, width: 60, height: 30 } }, { id: 'Beta', box: { x: 50, y: 0, width: 60, height: 30 } }, { id: 'Gamma', box: { x: 150, y: 0, width: 60, height: 30 } }] } as PaintEvidence
  expect(inspectGraphLayout(structureControlCase, paint).find(c => c.criterion === 'leaf-node-box-overlap')?.status).toBe('failed')
  paint.checks[0]!.status = 'unavailable'
  expect(inspectGraphLayout(structureControlCase, paint).find(c => c.criterion === 'leaf-node-box-overlap')?.status).toBe('unassessed')
})
