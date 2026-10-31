import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assessTerminalRecord, terminalProfileId } from '../unified/terminal-profile.ts'
import type { TerminalProjectCase } from '../fidelity/terminal-corpus.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('terminal-record-'), project = 'AlexanderGrooff/mermaid-ascii'
const hash = (bytes: string) => createHash('sha256').update(bytes).digest('hex')
function fixture() {
  const directory = temp.dir(), source = 'flowchart LR\nAlpha --> Beta\nBeta --> Gamma', output = readFileSync(new URL('./fixtures/terminal/chain.txt', import.meta.url), 'utf8')
  const cases: TerminalProjectCase[] = [{ id: 'fixture:chain', source, sourceSha256: hash(source), family: 'flowchart', features: [], intent: 'valid', expected: { status: 'independently-reviewed', graph: { nodes: ['Alpha', 'Beta', 'Gamma'].map(id => ({ id, label: id })), edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Beta', target: 'Gamma' }], layout: [{ before: 'Alpha', after: 'Beta', axis: 'x' }] }, unverifiedFacts: [] }, origins: [] }]
  writeFileSync(join(directory, 'chain.txt'), output)
  const record = { profile: terminalProfileId, inventory: cases.map(input => [input.id, input.sourceSha256]), artifacts: [{ project, version: 'synthetic transport fixture' }], sourceReference: [{ project: 'mermaid-js/mermaid', caseId: 'fixture:chain', declaredGraphMatches: true, role: 'source-reference-only', sourceAccepted: true }], outputs: [{ project, caseId: 'fixture:chain', witness: 'chain.txt', sha256: hash(output) }] }
  return { directory, cases, record }
}
test('terminal regrading uses retained ink and independent facts, not the old admission status', () => {
  const { directory, cases, record } = fixture()
  expect(assessTerminalRecord(record, directory, cases)[0].full).toMatchObject({ correct: 1, incorrect: 0, unknown: 0, planned: 1 })
  const text = readFileSync(join(directory, 'chain.txt'), 'utf8').replace('►', '◄')
  writeFileSync(join(directory, 'chain.txt'), text); record.outputs[0]!.sha256 = hash(text)
  expect(assessTerminalRecord(record, directory, cases)[0].full).toMatchObject({ correct: 0, incorrect: 1, planned: 1 })
})
test('omitted work stays in the denominator and unverifiable facts cannot receive a pass', () => {
  const { directory, cases, record } = fixture()
  record.outputs = []
  expect(assessTerminalRecord(record, directory, cases)[0].full).toMatchObject({ correct: 0, unknown: 1, planned: 1 })
  cases[0]!.expected.unverifiedFacts = ['Source requires a display-width observer']
  expect(assessTerminalRecord(record, directory, cases)[0].reviewed.planned).toBe(0)
})
test('changed witnesses, duplicate coordinates, missing reference and changed inventory reject regrading', () => {
  const { directory, cases, record } = fixture()
  record.outputs.push(record.outputs[0]!)
  expect(() => assessTerminalRecord(record, directory, cases)).toThrow('Duplicate')
  record.outputs.pop(); writeFileSync(join(directory, 'chain.txt'), 'untrusted changed bytes')
  expect(() => assessTerminalRecord(record, directory, cases)).toThrow('bytes changed')
  record.outputs = []; record.sourceReference = []
  expect(() => assessTerminalRecord(record, directory, cases)).toThrow('source-reference')
  record.inventory = []
  expect(() => assessTerminalRecord(record, directory, cases)).toThrow('inventory')
})
