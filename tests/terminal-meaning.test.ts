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
  expect(inspectTerminalMeaning('Alpha Beta Gamma', chain).status).toBe('unknown')
})

test('a relationship label belongs to its traced route, not an unrelated text occurrence', () => {
  const expected = { nodes: nodes.slice(0, 2), edges: [{ source: 'Alpha', target: 'Beta', label: 'send' }] }
  expect(inspectTerminalMeaning(fixture('labelled'), expected).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('termaid-labelled'), expected).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('labelled').replace('send', 'lost'), expected).status).toBe('incorrect')
  expect(inspectTerminalMeaning(fixture('termaid-labelled').replace('send', '    '), expected).status).toBe('incorrect')
  const misplaced = fixture('chain').split('\n').map((line, index) => index === 1 ? line.replace('│     │', '│send │') : line).join('\n')
  expect(inspectTerminalMeaning(misplaced, { nodes, edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Beta', target: 'Gamma', label: 'send' }] }).status).toBe('incorrect')
  expect(inspectTerminalMeaning(fixture('termaid-branch'), { nodes, edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Alpha', target: 'Gamma' }] }).status).toBe('correct')
})

test('terminal-state interpretation observes cleared and concealed ink instead of stripping controls', () => {
  expect(inspectTerminalMeaning('\x1b[2J' + fixture('chain'), chain).status).toBe('correct')
  expect(inspectTerminalMeaning('\x1b[8m' + fixture('chain'), chain).status).not.toBe('correct')
  const drawing = '┌──────┐    ┌──────┐\n│ 工程 │───►│ 終了 │\n└──────┘    └──────┘'
  expect(inspectTerminalMeaning(drawing, { nodes: [{ id: 'A', label: '工程' }, { id: 'B', label: '終了' }], edges: [{ source: 'A', target: 'B' }] }).status).toBe('correct')
})


test('shared stems require one actual source and cannot borrow expected topology', () => {
  const expected = { nodes, edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Alpha', target: 'Gamma' }] }, drawing = fixture('termaid-branch')
  expect(inspectTerminalMeaning(drawing, expected).status).toBe('correct')
  expect(inspectTerminalMeaning(drawing.replace('╰►', '╰◄'), expected).status).toBe('incorrect')
  expect(inspectTerminalMeaning(drawing.replace('├──┬►', '├  ┬►'), expected).status).toBe('incorrect')
  expect(inspectTerminalMeaning(drawing.replace('┬►', '┬─'), expected).status).toBe('unknown')
})
test('floating captions containing arrow-like letters retain owned-label and layout requirements', () => {
  const expected = { nodes: nodes.slice(0, 2), edges: [{ source: 'Alpha', target: 'Beta', label: 'save' }] }, drawing = fixture('termaid-labelled').replace('send', 'save')
  expect(inspectTerminalMeaning(drawing, expected).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('labelled').replace('send', 'save'), expected).status).toBe('correct')
  expect(inspectTerminalMeaning(drawing.replace('save', '    '), expected).status).toBe('incorrect')
  expect(inspectTerminalMeaning('save\n\n' + drawing.replace('save', '    '), expected).status).toBe('unknown')
  expect(inspectTerminalMeaning(fixture('chain'), { ...chain, layout: [{ before: 'Alpha', after: 'Beta', axis: 'x' }] }).status).toBe('correct')
  expect(inspectTerminalMeaning(fixture('chain'), { ...chain, layout: [{ before: 'Beta', after: 'Alpha', axis: 'x' }] }).status).toBe('incorrect')
})

test('actual vertical captions belong to a continuous route and missing captions cannot pass', () => {
  const graph = { nodes: ['A', 'B', 'C', 'D'].map(id => ({ id, label: id })), edges: [{ source: 'A', target: 'B', label: 'alpha' }, { source: 'A', target: 'C', label: 'beta' }, { source: 'A', target: 'D', label: 'gamma' }] }
  const drawing = fixture('ascii-vertical-captions')
  expect(inspectTerminalMeaning(drawing, graph).status).toBe('correct')
  expect(inspectTerminalMeaning(drawing.replace('alpha', '     '), graph).status).toBe('incorrect')
  expect(inspectTerminalMeaning(drawing.replace('beta', 'lost'), graph).status).not.toBe('correct')
})
test('caption spaces painted over by route ink stay unknown while a reversed arrow still fails', () => {
  const graph = { nodes: ['A', 'B'].map(id => ({ id, label: id })), edges: [{ source: 'A', target: 'B', label: 'Save & Exit' }] }, drawing = fixture('ascii-overlaid-caption')
  expect(inspectTerminalMeaning(drawing, graph).status).toBe('unknown')
  expect(inspectTerminalMeaning(drawing.replace('►', '◄'), graph).status).toBe('incorrect')
})

test('a caption beside one vertical route is owned, while an absent or detached caption cannot pass', () => {
  const graph = { nodes: ['A', 'B'].map(id => ({ id, label: id })), edges: [{ source: 'A', target: 'B', label: 'Label' }] }, drawing = fixture('termaid-vertical-caption')
  expect(inspectTerminalMeaning(drawing, graph).status).toBe('correct')
  expect(inspectTerminalMeaning(drawing.replace('Label', '     '), graph).status).toBe('incorrect')
  expect(inspectTerminalMeaning('Label\n\n' + drawing.replace('Label', '     '), graph).status).toBe('unknown')
})
