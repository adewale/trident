import { expect, test } from 'bun:test'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { assessMeaning, type AuthoredFidelityCase } from '../fidelity/meaning.ts'
import { enrollAuthoredSource, sourceContractComplete } from '../fidelity/source-contract.ts'
import { makeSvgCaseContract, assessSvgCases } from '../fidelity/svg-assessment.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import type { BenchmarkObservation } from '../unified/types.ts'

const raw: AuthoredFidelityCase = { id: 'source-enrollment-control', family: 'flowchart', required: true, source: 'flowchart LR\nA[Alpha] --> B[Beta]', features: [], provenance: 'Independent literal source-enrollment control', expected: { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true }] } }
const rows = (input: AuthoredFidelityCase): BenchmarkObservation[] => {
  const contract = makeSvgCaseContract(input)
  return planFidelityCriteria([input]).map(check => ({ suite: 'fidelity', surface: check.surface, runtime: 'test', caseId: input.id + ':' + check.criterion, operation: check.criterion, family: input.family, format: 'svg', mode: 'evidence-assembler-control', status: 'passed', metrics: { authoredCase: input.id, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, svgSha256: 'a'.repeat(64), observerSha256: 'b'.repeat(64) } }))
}
test('all100 authored sources enroll complete literal obligations while retaining their original native contracts', () => {
  const cases = expandedFidelityCases()
  expect(cases).toHaveLength(100)
  expect(cases.every(sourceContractComplete)).toBe(true)
  const input = enrollAuthoredSource(raw)
  expect(input.profileExpected).toEqual(raw.expected)
  expect(input.expected.facts).toMatchObject({ direction: 'LR', 'node-shapes': [{ id: 'A', shape: 'rectangle' }, { id: 'B', shape: 'rectangle' }] })
  expect(planFidelityCriteria([input]).map(item => item.criterion)).toContain('source-fact:node-shapes')
  expect(assessMeaning(input, { family: input.family, nodes: raw.expected.nodes, edges: raw.expected.edges, facts: {}, unavailable: {} }).passed).toBe(true)
})
test('source conflicts and absent or stale completeness metadata cannot turn passed profile rows into whole-source correctness', () => {
  const complete = enrollAuthoredSource(raw)
  expect(assessSvgCases([complete], rows(complete))[0]?.status).toBe('correct')
  const conflict = enrollAuthoredSource({ ...raw, expected: { ...raw.expected, nodes: [{ id: 'A', label: 'Wrong' }, { id: 'B', label: 'Beta' }] } })
  expect(conflict.expected.nodes?.find(node => node.id === 'A')?.label).toBe('Wrong')
  expect(conflict.profileExpected?.nodes?.find(node => node.id === 'A')?.label).toBe('Wrong')
  expect(sourceContractComplete(conflict)).toBe(false)
  expect(assessSvgCases([conflict], rows(conflict))[0]).toMatchObject({ status: 'unknown', profileStatus: 'correct', evidence: { status: 'unknown' } })
  expect(assessSvgCases([raw], rows(raw))[0]?.status).toBe('unknown')
  const changed = { ...complete, expected: { ...complete.expected, facts: { ...complete.expected.facts, direction: 'RL' } } }
  expect(sourceContractComplete(changed)).toBe(false)
  expect(assessSvgCases([changed], rows(changed))[0]?.status).toBe('unknown')
})
test('indexed visible link styles use source declaration order while native unordered assertions retain their original order', () => {
  const input = { ...raw, source: 'flowchart LR\nA[Alpha] --> B[Beta]\nB --> C[Gamma]\nA --> C\nlinkStyle 1 stroke:red', expected: { labels: ['Alpha', 'Beta', 'Gamma'], nodes: [...raw.expected.nodes!, { id: 'C', label: 'Gamma' }], edges: [{ source: 'A', target: 'C', directed: true }, { source: 'A', target: 'B', directed: true }, { source: 'B', target: 'C', directed: true }] } }
  const enrolled = enrollAuthoredSource(input)
  expect(sourceContractComplete(enrolled)).toBe(true)
  expect(enrolled.profileExpected?.edges).toEqual(input.expected.edges)
  expect(enrolled.expected.facts?.['edge-paint']).toMatchObject([{ edge: { source: 'B', target: 'C' }, properties: { stroke: 'red' } }])
})
