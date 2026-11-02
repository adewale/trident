import { expect, test } from 'bun:test'
import { reduceOutputMeasurements } from '../unified/output-measurements.ts'
import type { BenchmarkObservation } from '../unified/types.ts'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { campaignTables } from '../unified/campaign-tables.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('output-measurements-')

const row = (id: string, metrics: BenchmarkObservation['metrics'] = {}, status: BenchmarkObservation['status'] = 'passed'): BenchmarkObservation => ({ suite: 'docs', surface: 'public:svg', runtime: 'fixture', family: 'flowchart', caseId: id, operation: 'render', format: 'svg', mode: 'one-call', status, metrics: { round: 1, ...metrics } })
test('public return, format validity and size remain independent of drawing/admission verdicts', () => {
  const value = reduceOutputMeasurements(['bad-format', 'bad-drawing', 'unknown', 'wrong-type'], 1, [
    row('bad-format', { publicOutputReturned: true, formatValid: false, returnedBytes: 4 }, 'failed'),
    row('bad-drawing', { publicOutputReturned: true, formatValid: true, returnedBytes: 100 }, 'failed'),
    row('unknown', {}, 'blocked'), row('wrong-type', { publicOutputReturned: false }, 'failed'),
  ])!
  expect(value.production).toEqual({ returned: 2, noOutput: 1, unknown: 1 })
  expect(value.validity).toEqual({ valid: 1, invalid: 1, noOutput: 1, unknown: 1 })
  expect(value.returnedBytes).toBe(104)
  expect(value.completeBytePopulation).toBe(false)
  expect(value.measuredReturns).toBe(2)
})
test('historical statuses cannot invent return evidence, missing work remains planned and actual empty strings have zero bytes', () => {
  expect(reduceOutputMeasurements(['one'], 1, [row('one')])).toBeUndefined()
  const value = reduceOutputMeasurements(['one', 'two'], 1, [row('one', { publicOutputReturned: true, formatValid: false, returnedBytes: 0 })])!
  expect(value.production.unknown).toBe(1)
  expect(value.returnedBytes).toBe(0)
  expect(value.plannedCalls).toBe(2)
  const missing = reduceOutputMeasurements(['one'], 1, [row('one', { publicOutputReturned: false })])!
  expect(missing.returnedBytes).toBeNull()
})
test('duplicate calls, contradictory flags and incomplete rounds cannot produce a complete metric', () => {
  const returned = row('one', { publicOutputReturned: true, formatValid: true, returnedBytes: 2 })
  expect(() => reduceOutputMeasurements(['one'], 1, [returned, returned])).toThrow('Duplicate')
  expect(() => reduceOutputMeasurements(['one'], 1, [row('one', { publicOutputReturned: false, formatValid: true })])).toThrow('contradict')
  const value = reduceOutputMeasurements(['one'], 2, [returned])!
  expect(value.production.returned).toBe(0)
  expect(value.production.unknown).toBe(1)
  expect(value.completeBytePopulation).toBe(false)
})
test('ordinary campaign reporting compares the same raw population independently of failed admission grades', () => {
  const root = temp.dir(), out = join(root, 'docs'); mkdirSync(out)
  writeFileSync(join(out, 'inventory.json'), JSON.stringify({ cases: [{ id: 'one' }, { id: 'two' }] }))
  const observations = ['fixture/a', 'fixture/b'].flatMap(project => ['one', 'two'].map(id => row(id, { project, publicOutputReturned: true, formatValid: project === 'fixture/a', returnedBytes: project === 'fixture/a' ? 100 : 4 }, project === 'fixture/a' ? 'passed' : 'failed')))
  writeFileSync(join(out, 'result.json'), JSON.stringify({ id: 'docs', finishedAt: '2026-01-01', observations }))
  const tables = campaignTables({ startedAt: '2026-01-01', updatedAt: '2026-01-01', projects: ['fixture/a', 'fixture/b'], profile: 'fixture', rounds: 1, results: [{ suite: 'docs', out, status: 'passed' }] }, { url: 'https://example.test/fixture', sha256: 'a'.repeat(64) })
  const production = tables.find(table => table.measurement?.id === 'output-production')!
  expect(production.rows).toHaveLength(2)
  expect(production.rows.map(row => row.values[1])).toEqual([2, 2])
  const validity = tables.find(table => table.measurement?.id === 'output-validity')!
  expect(validity.rows.map(row => row.values.slice(1, 3))).toEqual([[2, 0], [0, 2]])
  const sizes = tables.find(table => table.measurement?.id === 'output-size')!
  expect(sizes.rows.map(row => row.values[1])).toEqual([200, 8])
  expect(sizes.ranking).toBeUndefined()
})
