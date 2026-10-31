import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import { terminalSourceInterpretationHold } from '../fidelity/terminal-source-holds.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { inspectTerminalBlock } from '../fidelity/terminal-family-layout.ts'

test('disputed nested-state interpretation retains every original obligation as unknown', () => {
  const cases = reviewedTerminalCases(), input = cases.find(row => row.id === 'terminal:9972eaa8ca8692d8')!
  const original = readFileSync(new URL('./fixtures/terminal/state-nesting-module.txt', import.meta.url), 'utf8')
  for (const output of [original, input.source, '', 'unrelated drawing']) {
    const verdict = assessTerminalDrawing(input, output)
    expect(verdict.status).toBe('unknown')
    expect(verdict).toHaveProperty('sourceInterpretationHold.status', 'incomplete-source-review')
    expect('checks' in verdict && verdict.checks?.length).toBe(input.expected.contract!.facts.filter(fact => fact.required !== false).length)
    expect('checks' in verdict && verdict.checks?.every(check => check.status === 'unknown')).toBe(true)
  }
  expect(cases).toHaveLength(120)
  expect(cases.filter(row => row.intent !== 'invalid')).toHaveLength(116)
  expect(terminalSourceInterpretationHold({ ...input, sourceSha256: '0'.repeat(64) })).toBeUndefined()
  expect(terminalSourceInterpretationHold(cases.find(row => row.family === 'state' && row.id !== input.id)!)).toBeUndefined()
})

// Independent hand-authored display, with unequal physical column widths. The
// four labels and routes are not copied from a source-derived expected array.
const grid = `┌───┐  ┌───────┐
│ A │  │   B   │
└───┘  └───────┘

┌───┐  ┌───────┐
│ C │  │   D   │
└───┘  └───────┘`
test('independent block audit distinguishes wrong rows, columns, missing walls and extra owners', () => {
  const contract = analyseTerminalSource('block-beta\ncolumns 2\nA B\nC D\n', 'block').contract
  const passed = (output: string) => inspectTerminalBlock(output, contract).every(check => check.status === 'passed')
  expect(passed(grid)).toBe(true)
  expect(passed(grid.replace('│   B   │', '│   C   │').replace('│ C │', '│ B │'))).toBe(false)
  expect(passed(grid.replace('│ C │  │   D   │', '│ D │  │   C   │'))).toBe(false)
  expect(passed(grid.split('\n').map((line, index) => index >= 4 ? line.replace('  ┌', '     ┌').replace('  │', '     │').replace('  └', '     └') : line).join('\n'))).toBe(false)
  expect(passed(grid.replace('└───┘', '└─ ─┘'))).toBe(false)
  expect(passed(grid + '\n┌───┐\n│ X │\n└───┘')).toBe(false)
  expect(passed('A B C D')).toBe(false)
})
