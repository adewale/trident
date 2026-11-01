import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { inspectTerminalMeaning } from '../fidelity/terminal.ts'
import { inspectTerminalGraphFacts } from '../fidelity/terminal-graph-facts.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'

const fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const nodes = ['A', 'B', 'C'].map(id => ({ id, label: id }))
// Independent hand drawing: no decoder output, source geometry or expected-edge
// array constructs this positive. Both upper sources visibly merge at one head.
const merge = `┌───┐   ┌───┐
│ A │   │ B │
└─┬─┘   └─┬─┘
  │       │
  └───┬───┘
      │
      ▼
    ┌───┐
    │ C │
    └───┘`
const mergeGraph = { nodes, edges: [{ source: 'A', target: 'C' }, { source: 'B', target: 'C' }] }

test('one-target merge observes every actual source without choosing from expected edges', () => {
  expect(inspectTerminalMeaning(merge, mergeGraph).status).toBe('correct')
  expect(inspectTerminalMeaning(merge, { ...mergeGraph, edges: [mergeGraph.edges[0]!] }).status).toBe('incorrect')
  expect(inspectTerminalMeaning(merge, { ...mergeGraph, edges: [{ source: 'A', target: 'B' }, { source: 'B', target: 'C' }] }).status).toBe('incorrect')
  expect(inspectTerminalMeaning(merge.replace('  │       │', '  │        '), mergeGraph).status).toBe('incorrect')
  expect(inspectTerminalMeaning(merge.replace('▼', '▲'), mergeGraph).status).toBe('incorrect')
})

test('multi-source multi-target crossings retain ambiguous ownership', () => {
  const drawing = `┌───┐   ┌───┐
│ A │   │ B │
└─┬─┘   └─┬─┘
  │       │
  ├───────┤
  ▼       ▼
┌───┐   ┌───┐
│ C │   │ D │
└───┘   └───┘`
  const graph = { nodes: [...nodes, { id: 'D', label: 'D' }], edges: [{ source: 'A', target: 'C' }, { source: 'B', target: 'D' }] }
  expect(inspectTerminalMeaning(drawing, graph).status).toBe('unknown')
})

test('hard node breaks retain their own display rows while wrapping can add rows', () => {
  const drawing = `┌───────┐    ┌───┐
│ first │    │   │
│ line  ├───►│ B │
└───────┘    └───┘`
  const graph = { nodes: [{ id: 'A', label: 'first\nline' }, { id: 'B', label: 'B' }], edges: [{ source: 'A', target: 'B' }] }
  expect(inspectTerminalMeaning(drawing, graph).status).toBe('correct')
  const merged = `┌────────────┐    ┌───┐
│ first line ├───►│ B │
└────────────┘    └───┘`
  expect(inspectTerminalMeaning(merged, graph).status).toBe('incorrect')
})

test('closed disjoint extra nodes fail the exact inventory, while nested ownership remains unknown', () => {
  const drawing = fixture('chain'), graph = { nodes: ['Alpha', 'Beta', 'Gamma'].map(id => ({ id, label: id })), edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Beta', target: 'Gamma' }] }
  expect(inspectTerminalMeaning(drawing + '\n┌───┐\n│ X │\n└───┘', graph).status).toBe('incorrect')
  expect(inspectTerminalMeaning('┌───────────┐\n│           │\n│ ┌───────┐ │\n│ │ Alpha │ │\n│ └───────┘ │\n└───────────┘', { nodes: [{ id: 'A', label: 'Alpha' }], edges: [] }).status).toBe('unknown')
})

test('node order is observed independently when caption ink or routes remain unknown', () => {
  const { contract, graph } = analyseTerminalSource('flowchart LR\nA -->|Save & Exit| B', 'flowchart')
  const drawing = fixture('ascii-overlaid-caption')
  const facts = inspectTerminalGraphFacts(drawing, contract, graph!)
  expect(facts.find(f => f.criterion === 'relationships')!.status).toBe('unknown')
  expect(facts.find(f => f.criterion === 'layout-order')!.status).toBe('passed')
  const reversed = drawing.replace('│ A ', '│ Z ').replace('│ B ', '│ A ').replace('│ Z ', '│ B ')
  expect(inspectTerminalGraphFacts(reversed, contract, graph!).find(f => f.criterion === 'layout-order')!.status).toBe('failed')
})

test('authenticated retained merge and invented-node outputs exercise whole source obligations', () => {
  const corpus = reviewedTerminalCases(), provenance = JSON.parse(readFileSync(new URL('./fixtures/terminal/completion-provenance.json', import.meta.url), 'utf8'))
  for (const p of provenance) expect(evidenceBytesDigest(fixture(p.fixture.slice(0, -4)))).toBe(p.outputSha256)
  const input = (id: string) => corpus.find(c => c.id === 'terminal:' + id)!
  const mergeInput = input('bf9642a4ab479973'), retained = fixture('merge-ascii-retained')
  expect(assessTerminalDrawing(mergeInput, retained).status).toBe('correct')
  expect(assessTerminalDrawing(mergeInput, retained.replace('SourceB', 'Missing')).status).toBe('incorrect')
  expect(assessTerminalDrawing(mergeInput, retained.replace('     ├───────┘', '     │        ')).status).toBe('incorrect')
  expect(assessTerminalDrawing(input('4ab6c5415bc7a24c'), fixture('extra-node-ascii-retained')).status).toBe('incorrect')
  expect(assessTerminalDrawing(input('29fc1dab07164509'), fixture('invented-node-ascii-retained')).status).toBe('incorrect')
})
