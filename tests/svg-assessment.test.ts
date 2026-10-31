import { expect, test } from 'bun:test'
import { assessSvgCases, summarizeSvgCases } from '../fidelity/svg-assessment.ts'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import type { BenchmarkObservation } from '../unified/types.ts'

const authored = expandedFidelityCases().find(item => item.id === 'meaning:family:flowchart')!
const rows = (): BenchmarkObservation[] => planFidelityCriteria([authored]).map(item => ({ suite: 'fidelity', surface: item.surface, operation: item.criterion, family: item.family, caseId: item.caseId + ':' + item.criterion, format: 'svg', mode: 'test', runtime: 'test', status: item.surface === 'native-public-api' ? 'blocked' : 'passed', metrics: { authoredCase: item.caseId, svgSha256: 'a'.repeat(64), observerSha256: 'b'.repeat(64) } }))

test('complete SVG evidence survives unavailable public-model APIs; one missing drawing check withholds a rank', () => {
  expect(summarizeSvgCases(assessSvgCases([authored], rows()))).toMatchObject({ correct: 1, unknown: 0, rankable: true })
  const missing = rows().filter(row => row.operation !== 'painted-relationships')
  expect(summarizeSvgCases(assessSvgCases([authored], missing))).toMatchObject({ correct: 0, unknown: 1, rankable: false })
  expect(assessSvgCases([authored], missing)[0]!.plannedChecks).toBe(assessSvgCases([authored], rows())[0]!.plannedChecks)
})

test('an incorrect drawing cannot hide behind unknown observations, and explicit unsupported admission stays distinct', () => {
  const incorrect = rows().map(row => ({ ...row, status: row.operation === 'painted-relationships' ? 'failed' as const : row.operation === 'paint-opacity-and-color' ? 'blocked' as const : row.status }))
  expect(assessSvgCases([authored], incorrect)[0]!.status).toBe('incorrect')
  const unsupported = rows().filter(row => row.operation === 'public-svg-admission').map(row => ({ ...row, status: 'unsupported' as const }))
  expect(summarizeSvgCases(assessSvgCases([authored], unsupported))).toMatchObject({ unsupported: 1, correct: 0 })
  expect(assessSvgCases([authored], [])[0]!.status).toBe('unknown')
})


test('status rows cannot construct a correct verdict without actual output and observer identities', () => {
  const unbound = rows().map(row => ({ ...row, metrics: { authoredCase: String(row.metrics!.authoredCase) } }))
  expect(assessSvgCases([authored], unbound)[0]).toMatchObject({ status: 'unknown', evidence: { outputSha256: null, observerSha256: null } })
  const explicit = { [authored.id]: { svgSha256: 'a'.repeat(64), observerSha256: 'b'.repeat(64) } }
  expect(assessSvgCases([authored], unbound, explicit)[0]!.status).toBe('correct')
  const stale = rows(); stale.find(row => row.surface !== 'native-public-api')!.metrics!.observerSha256 = 'c'.repeat(64)
  expect(() => assessSvgCases([authored], stale)).toThrow('different output/observer')
})
