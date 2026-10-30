import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { inspectTerminalMeaning, type TerminalMeaning } from '../fidelity/terminal.ts'
import { qualifyOutput } from '../unified/qualification.ts'

const fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const nodes = ['Alpha', 'Beta', 'Gamma'].map(id => ({ id, label: id }))
const chain: TerminalMeaning = { nodes, edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Beta', target: 'Gamma' }] }

test('real terminal boxes, continuous routes and arrowheads establish directed relationships across layouts', () => {
  expect(inspectTerminalMeaning(fixture('chain'), chain).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('chain').split('\n').map(line => '  ' + line).join('\n'), chain).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('branch'), { nodes, edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Alpha', target: 'Gamma' }] }).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('vertical'), { nodes: nodes.slice(0, 2), edges: [{ source: 'Alpha', target: 'Beta' }] }).status).toBe('correct')
  const ascii = fixture('chain').replace(/[┌┐└┘┬┴┼├┤]/g, '+').replaceAll('─', '-').replaceAll('│', '|').replaceAll('►', '>')
  expect(inspectTerminalMeaning(ascii, chain).status).toBe('correct')
})

test('correct labels cannot conceal wrong direction, disconnected stems, missing nodes or incorrect topology', () => {
  const drawing = fixture('chain')
  const wrongArrow = drawing.replace('►', '◄')
  expect(qualifyOutput({ id: 'terminal-control', family: 'flowchart', source: 'flowchart LR\nAlpha --> Beta\nBeta --> Gamma', expectedLabels: nodes.map(node => node.label), features: [], provenance: 'Independently authored chain' }, wrongArrow, 'terminal').ok).toBe(true)
  expect(inspectTerminalMeaning(wrongArrow, chain).status).toBe('incorrect')
  expect(inspectTerminalMeaning(drawing.replace('├────►', '├─ ──►'), chain).status).toBe('incorrect')
  expect(inspectTerminalMeaning(drawing.replace('Beta', 'Gone'), chain).status).toBe('incorrect')
  expect(inspectTerminalMeaning(drawing, { nodes, edges: [{ source: 'Alpha', target: 'Gamma' }, { source: 'Beta', target: 'Gamma' }] }).status).toBe('incorrect')
  expect(inspectTerminalMeaning('Alpha Beta Gamma', chain).status).toBe('incorrect')
})

test('a relationship label belongs to its traced route, not an unrelated text occurrence', () => {
  const expected = { nodes: nodes.slice(0, 2), edges: [{ source: 'Alpha', target: 'Beta', label: 'send' }] }
  expect(inspectTerminalMeaning(fixture('labelled'), expected).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('termaid-labelled'), expected).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('labelled').replace('send', 'lost'), expected).status).toBe('incorrect')
  expect(inspectTerminalMeaning(fixture('termaid-labelled').replace('send', '    '), expected).status).toBe('incorrect')
  const misplaced = fixture('chain').split('\n').map((line, index) => index === 1 ? line.replace('│     │', '│send │') : line).join('\n')
  expect(inspectTerminalMeaning(misplaced, { nodes, edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Beta', target: 'Gamma', label: 'send' }] }).status).toBe('incorrect')
  expect(inspectTerminalMeaning(fixture('termaid-branch'), { nodes, edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Alpha', target: 'Gamma' }] }).status).toBe('unknown')
})

test('ANSI concealment, cursor movement and wide or combining text cannot receive guessed cell coordinates', () => {
  for (const drawing of ['\x1b[8m' + fixture('chain'), '\x1b[2J' + fixture('chain'), fixture('chain').replace('Beta', '工程'), fixture('chain').replace('Beta', 'Be\u0301ta')]) expect(inspectTerminalMeaning(drawing, chain).status).toBe('unknown')
})
