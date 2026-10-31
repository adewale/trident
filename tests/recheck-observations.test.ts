import { expect, test } from 'bun:test'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { assessSvgCases } from '../fidelity/svg-assessment.ts'
import { recheckFeaturePaint } from '../unified/recheck-rendering.ts'
import type { BenchmarkObservation } from '../unified/types.ts'

const input = expandedFidelityCases()[0]!, project = 'fixture/renderer'
const prior = () => planFidelityCriteria([input]).filter(item => item.surface !== 'native-public-api').map(item => ({ suite: 'fidelity', surface: item.surface, runtime: 'fixture', family: item.family, caseId: input.id + ':' + item.criterion, operation: item.criterion, format: 'svg', mode: 'fixture', status: 'passed', metrics: { implementation: project, authoredCase: input.id } }) as BenchmarkObservation)
const at = '2026-01-01T00:00:00Z'

test('an observer exception cannot preserve a prior correct SVG verdict', async () => {
  const before = prior(), saved = JSON.stringify(before)
  expect(assessSvgCases([input], before)[0]!.status).toBe('correct')
  const result = await recheckFeaturePaint(input, project, before, async () => { throw Error('Injected observer failure') }, at)
  expect(result.completed).toBe(false)
  expect(result.error).toContain('Injected observer failure')
  expect(assessSvgCases([input], result.observations)[0]!.status).toBe('unknown')
  const paint = result.observations.filter(row => row.surface === 'browser-owned-ink')
  expect(paint.length).toBeGreaterThan(0)
  expect(paint.every(row => row.status === 'blocked' && row.metrics?.originalCriterionStatus === 'passed' && row.metrics?.observerError)).toBe(true)
  expect(JSON.stringify(before)).toBe(saved)
})

test('an omitted new criterion cannot borrow the old passing check', async () => {
  const before = prior(), required = planFidelityCriteria([input]).filter(item => item.surface === 'browser-owned-ink'), omitted = required[0]!.criterion
  const result = await recheckFeaturePaint(input, project, before, async () => required.filter(item => item.criterion !== omitted).map(item => ({ criterion: item.criterion, status: 'passed', expected: true, actual: true, scope: 'Synthetic fresh checker control' })), at)
  expect(result.completed).toBe(true)
  expect(result.observations.find(row => row.operation === omitted)!.status).toBe('blocked')
  expect(assessSvgCases([input], result.observations)[0]!.status).toBe('unknown')
})

test('duplicate checker coordinates invalidate the whole new observation', async () => {
  const check = { criterion: 'svg-root', status: 'passed' as const, expected: true, actual: true, scope: 'Synthetic duplicate' }
  const result = await recheckFeaturePaint(input, project, prior(), async () => [check, check], at)
  expect(result.completed).toBe(false)
  expect(result.error).toContain('duplicate')
  expect(result.observations.filter(row => row.surface === 'browser-owned-ink').every(row => row.status === 'blocked')).toBe(true)
})

test('fresh failing evidence replaces an earlier pass and missing previous rows are constructed', async () => {
  const required = planFidelityCriteria([input]).filter(item => item.surface === 'browser-owned-ink'), failed = required[0]!.criterion
  const before = prior().filter(row => row.surface !== 'browser-owned-ink')
  const result = await recheckFeaturePaint(input, project, before, async () => required.map(item => ({ criterion: item.criterion, status: item.criterion === failed ? 'failed' : 'passed', expected: true, actual: item.criterion !== failed, scope: 'Synthetic fresh evidence' })), at)
  expect(result.observations.find(row => row.operation === failed)!.status).toBe('failed')
  expect(assessSvgCases([input], result.observations)[0]!.status).toBe('incorrect')
})
