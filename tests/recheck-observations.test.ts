import { expect, test } from 'bun:test'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { assessSvgCases, makeSvgObservationBinding } from '../fidelity/svg-assessment.ts'
import { recheckFeaturePaint, recheckFeatureAdmission } from '../unified/recheck-rendering.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import type { BenchmarkObservation } from '../unified/types.ts'

const input = expandedFidelityCases()[0]!, project = 'fixture/renderer'
const binding = makeSvgObservationBinding(input, evidenceBytesDigest('synthetic retained output bytes'), evidenceBytesDigest('synthetic observer identity'))
const prior = () => planFidelityCriteria([input]).filter(item => item.surface !== 'native-public-api').map(item => ({ suite: 'fidelity', surface: item.surface, runtime: 'fixture', family: item.family, caseId: input.id + ':' + item.criterion, operation: item.criterion, format: 'svg', mode: 'fixture', status: 'passed', metrics: { implementation: project, authoredCase: input.id, ...binding } }) as BenchmarkObservation)
const at = '2026-01-01T00:00:00Z'
const bindings = { [input.id]: binding }

test('an observer exception cannot preserve a prior correct SVG verdict', async () => {
  const before = prior(), saved = JSON.stringify(before)
  expect(assessSvgCases([input], before, bindings)[0]!.status).toBe('correct')
  const result = await recheckFeaturePaint(input, project, before, async () => { throw Error('Injected observer failure') }, at, true, binding)
  expect(result.completed).toBe(false)
  expect(result.error).toContain('Injected observer failure')
  expect(assessSvgCases([input], result.observations, bindings)[0]!.status).toBe('unknown')
  const paint = result.observations.filter(row => row.surface === 'browser-owned-ink')
  expect(paint.length).toBeGreaterThan(0)
  expect(paint.every(row => row.status === 'blocked' && row.metrics?.originalCriterionStatus === 'passed' && row.metrics?.observerError)).toBe(true)
  expect(JSON.stringify(before)).toBe(saved)
})

test('an omitted new criterion cannot borrow the old passing check', async () => {
  const before = prior(), required = planFidelityCriteria([input]).filter(item => item.surface === 'browser-owned-ink'), omitted = required[0]!.criterion
  const result = await recheckFeaturePaint(input, project, before, async () => required.filter(item => item.criterion !== omitted).map(item => ({ criterion: item.criterion, status: 'passed', expected: true, actual: true, scope: 'Synthetic fresh checker control' })), at, true, binding)
  expect(result.completed).toBe(true)
  expect(result.observations.find(row => row.operation === omitted)!.status).toBe('blocked')
  expect(assessSvgCases([input], result.observations, bindings)[0]!.status).toBe('unknown')
})

test('duplicate checker coordinates invalidate the whole new observation', async () => {
  const check = { criterion: 'svg-root', status: 'passed' as const, expected: true, actual: true, scope: 'Synthetic duplicate' }
  const result = await recheckFeaturePaint(input, project, prior(), async () => [check, check], at, true, binding)
  expect(result.completed).toBe(false)
  expect(result.error).toContain('duplicate')
  expect(result.observations.filter(row => row.surface === 'browser-owned-ink').every(row => row.status === 'blocked')).toBe(true)
})

test('fresh failing evidence replaces an earlier pass and missing previous rows are constructed', async () => {
  const required = planFidelityCriteria([input]).filter(item => item.surface === 'browser-owned-ink'), failed = required[0]!.criterion
  const before = prior().filter(row => row.surface !== 'browser-owned-ink')
  const result = await recheckFeaturePaint(input, project, before, async () => required.map(item => ({ criterion: item.criterion, status: item.criterion === failed ? 'failed' : 'passed', expected: true, actual: item.criterion !== failed, scope: 'Synthetic fresh evidence' })), at, true, binding)
  expect(result.observations.find(row => row.operation === failed)!.status).toBe('failed')
  expect(assessSvgCases([input], result.observations, bindings)[0]!.status).toBe('incorrect')
})


test('retained admission is newly checked from the actual receipt and source, while preludes receive no new evidence', () => {
  const testCase = expandedFidelityCases().find(item => item.prelude?.length)!, fresh = makeSvgObservationBinding(testCase, evidenceBytesDigest('retained SVG'), evidenceBytesDigest('current observer'))
  const rows = planFidelityCriteria([testCase]).filter(item => item.surface === 'browser-public-api').map(item => ({ suite: 'fidelity', surface: item.surface, runtime: 'fixture', family: testCase.family, caseId: testCase.id + ':' + item.criterion, operation: item.criterion, format: 'svg', mode: 'fixture', status: 'blocked', metrics: { implementation: project, authoredCase: testCase.id } }) as BenchmarkObservation)
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40"/></svg>'
  const checked = recheckFeatureAdmission(testCase, project, rows, svg, 'returned', fresh, at)
  expect(checked.find(row => row.operation === 'public-svg-admission')!.status).toBe('passed')
  expect(checked.find(row => row.operation === 'public-svg-admission')!.metrics!.sourceSha256).toBe(fresh.sourceSha256)
  expect(checked.filter(row => row.operation.startsWith('prelude-')).every(row => row.status === 'blocked' && row.metrics?.observerSha256 === undefined)).toBe(true)
  const absent = recheckFeatureAdmission(testCase, project, rows, svg, undefined, fresh, at)
  expect(absent.filter(row => !row.operation.startsWith('prelude-')).every(row => row.status === 'blocked')).toBe(true)
})
