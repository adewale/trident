import { expect, test } from 'bun:test'
import { mkdirSync, readFileSync, writeFileSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { terminalOutputMeasurements } from '../unified/terminal-output-measurements.ts'
import { reduceOutputMeasurements } from '../unified/output-measurements.ts'
import { campaignTables } from '../unified/campaign-tables.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('terminal-output-facts-'), project = 'fixture/terminal'
function fixture() {
  const root = temp.dir(), cases = [{ id: 'case:empty', sourceSha256: evidenceBytesDigest('flowchart LR') }, { id: 'case:text', sourceSha256: evidenceBytesDigest('flowchart LR\nA') }]
  writeFileSync(join(root, 'empty.txt'), ''); writeFileSync(join(root, 'text.txt'), '[A]')
  const record = { profile: 'fixture-terminal-v1', inventory: cases.map(input => [input.id, input.sourceSha256]), artifacts: [{ project, version: 'fixture' }],
    outputs: cases.map((input, index) => ({ project, caseId: input.id, witness: index ? 'text.txt' : 'empty.txt', sha256: evidenceBytesDigest(index ? '[A]' : ''), publicStatus: 'failed', runtimeExecuted: false })) }
  const expected = { profile: record.profile, cases, projects: [project] }
  return { root, cases, record, expected }
}
test('terminal production, UTF-8 validity and bytes come from retained output, never stale admission or drawing flags', () => {
  const f = fixture(), values = terminalOutputMeasurements(f.record, f.root, f.expected)
  const result = reduceOutputMeasurements(f.cases.map(input => input.id), 1, values[0]!.observations)!
  expect(result.production).toEqual({ returned: 2, noOutput: 0, unknown: 0 })
  expect(result.validity).toEqual({ valid: 2, invalid: 0, noOutput: 0, unknown: 0 })
  expect(result.returnedBytes).toBe(3)
  expect(result.measuredReturns).toBe(2)
  expect(result.completeBytePopulation).toBe(true)
  f.record.outputs.pop()
  const incomplete = reduceOutputMeasurements(f.cases.map(input => input.id), 1, terminalOutputMeasurements(f.record, f.root, f.expected)[0]!.observations)!
  expect(incomplete.production.unknown).toBe(1)
  expect(incomplete.completeBytePopulation).toBe(false)
})
test('invalid UTF-8 remains returned bytes while altered bytes, foreign paths and wrong source coordinates are rejected', () => {
  const f = fixture(), bad = Buffer.from([0xff, 0xfe])
  writeFileSync(join(f.root, 'text.txt'), bad); f.record.outputs[1]!.sha256 = evidenceBytesDigest(bad)
  const result = reduceOutputMeasurements(f.cases.map(input => input.id), 1, terminalOutputMeasurements(f.record, f.root, f.expected)[0]!.observations)!
  expect(result.production.returned).toBe(2)
  expect(result.validity.invalid).toBe(1)
  f.record.outputs[1]!.sha256 = evidenceBytesDigest('wrong digest')
  expect(() => terminalOutputMeasurements(f.record, f.root, f.expected)).toThrow('bytes differ')
  const foreign = temp.dir(); writeFileSync(join(foreign, 'foreign.txt'), bad); symlinkSync(join(foreign, 'foreign.txt'), join(f.root, 'link.txt'))
  f.record.outputs[1]!.witness = 'link.txt'; f.record.outputs[1]!.sha256 = evidenceBytesDigest(bad)
  expect(() => terminalOutputMeasurements(f.record, f.root, f.expected)).toThrow('escapes')
  f.record.inventory[0]![1] = evidenceBytesDigest('different source')
  expect(() => terminalOutputMeasurements(f.record, f.root, f.expected)).toThrow('different source')
})
test('ordinary terminal report reductions expose actual output metrics beside separate unresolved drawing assessments', () => {
  const f = fixture(), out = join(f.root, 'terminal'); mkdirSync(out)
  writeFileSync(join(f.root, 'raw.json'), JSON.stringify(f.record))
  const assessment = { project, version: 'fixture', cases: f.cases.map(input => ({ caseId: input.id, status: 'unknown' })) }
  const profile = { id: f.record.profile, cases: f.cases, producers: ['independent synthetic fixture'], reviewedCaseIds: f.cases.map(input => input.id) }
  writeFileSync(join(out, 'result.json'), JSON.stringify({ finishedAt: '2026-01-01', observations: [], artifacts: ['../raw.json'], terminalProfile: profile, terminalAssessments: [assessment], terminalReviewedAssessments: [assessment] }))
  const tables = campaignTables({ startedAt: '2026-01-01', updatedAt: '2026-01-01', profile: 'full', rounds: 1, projects: [project], results: [{ suite: 'community', cohort: 'terminal-fixture', out, status: 'blocked' }] }, { url: 'https://example.test/report', sha256: evidenceBytesDigest('fixture receipt') })
  expect(tables.find(table => table.measurement?.id === 'output-production')!.rows[0]!.values).toEqual(['fixture', 2, 0, 0, 2])
  expect(tables.find(table => table.measurement?.id === 'output-size')!.rows[0]!.values).toEqual(['fixture', 3, 2, 2, 'yes'])
  expect(tables.find(table => table.drawingOutcomePolicy)!.rows[0]!.values[1]).toBe(0)
  expect(readFileSync(join(f.root, 'empty.txt')).length).toBe(0)
})
