import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { evidenceDigest } from '../portable/evidence-contract.ts'
import { readTerminalSourceAdaptations, terminalSourceAdaptationStatus } from '../fidelity/terminal-adaptations.ts'
import { readTerminalCorpus } from '../fidelity/terminal-corpus.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { inspectTerminalState } from '../fidelity/terminal-state.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'

const [input] = readTerminalSourceAdaptations()
const drawing = readFileSync(new URL('./fixtures/terminal/state-alias-adaptation-synthetic.txt', import.meta.url), 'utf8')
test('fresh state adaptation independently binds exact source, aliases, scope, parent provenance and complete facts', () => {
  expect(input!.id).toBe('terminal-adaptation:3bf5fbf5ea7c5486')
  expect(readTerminalCorpus().cases).toHaveLength(120)
  expect(input!.origins[0]!.kind).toBe('source-adaptation')
  expect(input!.origins[0]!.extraction).toBe('source-only-explicit-identifier-adaptation')
  expect(input!.origins[0]!.author).toContain('OpenAI Codex')
  expect(input!.origins[0]!.line).toBe(1)
  expect(terminalSourceAdaptationStatus(input!).admitted).toBe(true)
  const parsed = analyseTerminalSource(input!.source, 'state')
  expect(evidenceDigest(parsed.contract)).toBe(evidenceDigest(input!.expected.contract))
  expect(parsed.contract.sourceUncertainties).toEqual([])
  expect((parsed.contract.facts.find(fact => fact.criterion === 'states')!.expected as unknown[])).toHaveLength(9)
  expect((parsed.contract.facts.find(fact => fact.criterion === 'transitions')!.expected as unknown[])).toHaveLength(4)
})

test('independent nine-state display owns repeated labels, both nested groups, and all four aliased routes', () => {
  const checks = (output: string) => inspectTerminalState(output, input!.expected.contract!)
  expect(checks(drawing).every(check => check.status === 'passed')).toBe(true)
  expect(assessTerminalDrawing(input!, drawing).status).toBe('correct')
  for (const wrong of [drawing.replace('►', '◄'), drawing.replace('│ F', '│ X'), drawing.replace('│ E', '│ Z'), drawing.replace('▼', '▲')]) expect(checks(wrong).every(check => check.status === 'passed')).toBe(false)
  expect(checks(input!.source).every(check => check.status === 'passed')).toBe(false)
  expect(assessTerminalDrawing({ ...input!, expected: { ...input!.expected, contract: { ...input!.expected.contract!, facts: [] } } }, drawing).status).toBe('unknown')
})

test('two aliases with indistinguishable labels in one lexical scope remain unknown', () => {
  const contract = analyseTerminalSource('stateDiagram-v2\nstate D {\nstate "B" as Left\nstate "B" as Right\nLeft --> Right\n}', 'state').contract
  expect(inspectTerminalState(drawing, contract).every(check => check.status === 'unknown')).toBe(true)
})
