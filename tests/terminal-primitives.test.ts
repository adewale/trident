import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import { inspectTerminalMeaning } from '../fidelity/terminal.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import provenance from './fixtures/terminal/primitive-provenance.json'
const cases = reviewedTerminalCases(), fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const input = (name: string) => cases.find(item => item.id === provenance.find(row => row.file === name + '.txt')!.caseId)!
const assess = (name: string, output = fixture(name)) => assessTerminalDrawing(input(name), output)
test('primitive controls preserve retained source, artifact, output and collection identities', () => {
  for (const row of provenance) { expect(createHash('sha256').update(fixture(row.file.slice(0, -4))).digest('hex')).toBe(row.sha256); expect(cases.some(item => item.id === row.caseId)).toBe(true); expect(row.originalStartedAt < row.originalFinishedAt).toBe(true) }
})
test('explicit break boundaries survive multiline CLI and module output; printed HTML does not stand for a line break', () => {
  expect(assess('lines-cli').status).toBe('correct')
  expect(assess('lines-module').status).toBe('correct')
  expect(assess('lines-python-literal-tags').status).toBe('incorrect')
  const original = fixture('lines-module'), collapsed = original.replace('│ First  ', '│ First S').replace('│ Second ', '│ econd  ')
  expect(assess('lines-module', collapsed).status).not.toBe('correct')
  expect(assess('lines-module', original + '\nFirst Second').status).not.toBe('correct')
})
test('diamond shape annotations have matching ownership across corner and midpoint conventions', () => {
  expect(assess('primitive-python-midpoint').status).toBe('correct')
  expect(assess('primitive-module-corners').status).toBe('correct')
  expect(assess('primitive-cli-lost-decision').status).toBe('incorrect')
  for (const name of ['primitive-python-midpoint', 'primitive-module-corners']) {
    expect(assess(name, fixture(name).replaceAll('◇', '◯')).status).toBe('incorrect')
    expect(assess(name, fixture(name).replace('Approve?', 'Different')).status).not.toBe('correct')
    expect(assess(name, fixture(name).replace('◇', '─')).status).not.toBe('correct')
  }
})
test('circle and double-circle primitives keep distinct glyphs and authored lines', () => {
  const name = 'primitive-circles-module'
  expect(assess(name).status).toBe('correct')
  expect(assess(name, fixture(name).replaceAll('◎', '◯')).status).toBe('incorrect')
  expect(assess(name, fixture(name).replace('double', 'wrong!')).status).not.toBe('correct')
})
test('arrowheads painted on node boundaries retain their actual source and target', () => {
  const source = 'flowchart LR\nA[Alpha] --> B[Beta]', expected = analyseTerminalSource(source, 'flowchart').graph!, output = '┌───────┐    ┌──────┐\n│ Alpha ├────► Beta │\n└───────┘    └──────┘'
  expect(inspectTerminalMeaning(output, expected).status).toBe('correct')
  expect(inspectTerminalMeaning(output.replace('►', '◄'), expected).status).not.toBe('correct')
  expect(inspectTerminalMeaning(output.replace('────►', '── ─►'), expected).status).not.toBe('correct')
})
test('global direction does not invent mandatory precedence for a branched DAG', () => {
  const source = 'flowchart TD\nA-->B\nA-->C\nB-->C', analysis = analyseTerminalSource(source, 'flowchart')
  expect(analysis.graph?.layout).toBeUndefined()
  expect(analysis.contract.facts.find(fact => fact.criterion === 'layout-direction')).toMatchObject({ required: false, expected: { root: 'TD' } })
  const chain = analyseTerminalSource('flowchart RL\nA-->B\nB-->C', 'flowchart')
  expect(chain.graph?.layout).toEqual([{ before: 'B', after: 'A', axis: 'x' }, { before: 'C', after: 'B', axis: 'x' }])
})
test('isolated parentheses, disconnected nested curves and misaligned inner walls cannot supply a primitive', () => {
  const score = (source: string, output: string) => { const analysis = analyseTerminalSource(source, 'flowchart'); return assessTerminalDrawing({ ...cases[0]!, id: 'synthetic:source-control', source, sourceSha256: createHash('sha256').update(source).digest('hex'), family: 'flowchart', expected: { status: 'independently-reviewed', graph: analysis.graph, contract: analysis.contract } }, output).status }
  expect(score('flowchart\nA([Alpha])', '┌───────┐\n( Alpha │\n└───────┘')).not.toBe('correct')
  expect(score('flowchart\nA([Alpha])', '╭───────╮\n( Alpha )\n╰───────╯')).toBe('correct')
  expect(score('flowchart\nA(((Alpha)))', '╭─────────╮\n│ ╭─╮     │\n│ Alpha   │\n│   ╰───╯ │\n╰─────────╯')).not.toBe('correct')
  expect(score('flowchart\nA[(Alpha)]', '╭───────╮\n│╰─────╯│\n│ Alpha │\n╰───────╯')).toBe('correct')
  expect(score('flowchart\nA[(Alpha)]', '╭─────────╮\n│ ╰─╯     │\n│ Alpha   │\n╰─────────╯')).not.toBe('correct')
  expect(score('flowchart\nA[[Alpha]]', '┌─────────┐\n│ │Alpha│ │\n│  │   │  │\n└─────────┘')).not.toBe('correct')
})
