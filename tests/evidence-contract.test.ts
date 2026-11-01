import { expect, test } from 'bun:test'
import { admitCaseEvidenceContract, admitCheckedEvidence, admitInvocationEvidence, constructEvidenceVerdict, defineCaseEvidenceContract, evidenceBytesDigest, type CheckedEvidence, type InvocationEvidence } from '../portable/evidence-contract.ts'
const hash = evidenceBytesDigest
const contract = () => defineCaseEvidenceContract({ caseId: 'independent:chain', source: 'flowchart LR\nA-->B', expectations: { nodes: ['A', 'B'], edges: [['A', 'B']] }, requiredChecks: [{ surface: 'paint', criterion: 'nodes' }, { surface: 'paint', criterion: 'directed-route' }] })
const evidence = (): CheckedEvidence => ({ schema: 'trident-checked-evidence-v1', caseId: contract().caseId, sourceSha256: contract().sourceSha256, expectationsSha256: contract().expectationsSha256, outputSha256: hash('actual SVG bytes'), observerSha256: hash('qualified checker'), checks: contract().requiredChecks.map(check => ({ ...check, status: 'passed', detail: 'Independently observed fixture ink' })) })
test('a correct verdict is constructed only from the complete bound observation set', () => {
  const complete = constructEvidenceVerdict(contract(), evidence())
  expect(complete).toMatchObject({ status: 'correct', planned: 2, passed: 2, failed: 0, unknown: 0 })
  const missing = evidence(); missing.checks = [missing.checks[0]!]
  expect(constructEvidenceVerdict(contract(), missing)).toMatchObject({ status: 'unknown', planned: 2, passed: 1, unknown: 1 })
  expect(constructEvidenceVerdict(contract())).toMatchObject({ status: 'unknown', passed: 0, unknown: 2, outputSha256: null })
  const bad = evidence(); bad.checks = [{ ...bad.checks[0]!, status: 'failed' }]
  expect(constructEvidenceVerdict(contract(), bad).status).toBe('incorrect')
})
test('stale source/expectations, duplicate or unplanned checks cannot earn passing credit', () => {
  for (const field of ['sourceSha256', 'expectationsSha256', 'caseId'] as const) expect(() => admitCheckedEvidence(contract(), { ...evidence(), [field]: hash('stale') })).toThrow('stale')
  const row = evidence()
  expect(() => admitCheckedEvidence(contract(), { ...row, checks: [...row.checks, row.checks[0]] })).toThrow('duplicate')
  expect(() => admitCheckedEvidence(contract(), { ...row, checks: [{ ...row.checks[0], criterion: 'source-echo' }] })).toThrow('unplanned')
  expect(() => admitCaseEvidenceContract({ ...contract(), requiredChecks: [] })).toThrow('required checks')
})
test('admitted evidence is immutable and cannot be upgraded after validation', () => {
  const input = evidence(), admitted = admitCheckedEvidence(contract(), input)
  ;(input.checks as any)[0].status = 'failed'
  expect(admitted.checks[0]!.status).toBe('passed')
  expect(() => { (admitted.checks as any)[0].status = 'passed' }).toThrow()
})
const invocation = (): InvocationEvidence => ({ schema: 'trident-invocation-evidence-v1', attemptId: 'one', identity: { project: 'fixture/renderer', caseId: 'independent:chain', sourceSha256: hash('source'), artifactSha256: hash('binary'), bindingSha256: hash('public operation'), format: 'svg' }, state: 'returned', startedAt: null, finishedAt: null, durationMs: null, output: { path: 'retained.svg', bytes: 12, sha256: hash('actual bytes') }, detail: 'Recovered output; clock was not recorded' })
test('recovered output can retain unknown clocks without inventing zero or a measurement window', () => {
  expect(admitInvocationEvidence(invocation())).toMatchObject({ durationMs: null, startedAt: null, finishedAt: null })
  expect(() => admitInvocationEvidence({ ...invocation(), durationMs: NaN })).toThrow('finite')
  expect(() => admitInvocationEvidence({ ...invocation(), output: null })).toThrow('retained output')
  expect(() => admitInvocationEvidence({ ...invocation(), state: 'not-invoked' })).toThrow('uninvoked')
  expect(() => admitInvocationEvidence({ ...invocation(), startedAt: '2026-01-02T00:00:00Z', finishedAt: '2026-01-01T00:00:00Z' })).toThrow('clocks')
})
