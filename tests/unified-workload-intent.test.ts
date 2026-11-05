import { expect, test } from 'bun:test'
import { declaredWorkloadIntent, positiveRenderInput, workloadAppliesToOutput } from '../unified/workload-intent.ts'
import type { BenchmarkObservation, UnifiedWorkload } from '../unified/types.ts'

const workload = (id: string, intent?: UnifiedWorkload['intent'], accepted?: boolean): UnifiedWorkload => ({ id, family: 'xychart', source: 'xychart\nx-axis X', features: [], provenance: 'Independently authored scope example', ...(intent ? { intent } : {}), ...(accepted === undefined ? {} : { referenceAdmission: { accepted } }) })
const row = (caseId: string, status: BenchmarkObservation['status']): BenchmarkObservation => ({ suite: 'community', surface: 'node:public-api', runtime: 'fixture', family: 'xychart', caseId, operation: 'render', format: 'svg', mode: 'feature', status })

test('a parser-owned fragment never promises drawable output despite a generated layout assertion', () => {
  const declaration = declaredWorkloadIntent({ assertions: { nodeCount: 0, groupCount: 1 } }, ['packages/mermaid/src/diagrams/xychart/parser/xychart.jison.spec.ts'])
  expect(declaration.intent).toBe('parse-only')
  const input = { ...workload('axis-fragment', undefined, true), ...declaration }
  expect(workloadAppliesToOutput(input, 'parse')).toBe(true)
  for (const output of ['svg', 'png', 'terminal']) expect(workloadAppliesToOutput(input, output)).toBe(false)
  expect(declaredWorkloadIntent({}, ['packages/mermaid/src/diagrams/flowchart/renderer.spec.ts']).intent).toBe('render')
  expect(declaredWorkloadIntent({ expected: { kind: 'error' } }).intent).toBe('negative-admission')
  expect(declaredWorkloadIntent({ assertions: { renderError: 'expected rejection' } }).intent).toBe('diagnostic')
  expect(declaredWorkloadIntent({ reference: { ok: false }, expected: { kind: 'parse' } }).intent).toBe('parse-only')
  expect(declaredWorkloadIntent({ reference: { ok: false }, diagnosticOnly: true }).intent).toBe('render')
})

test('pinned rejection is an observed input boundary, not a positive renderer failure or an intentional-invalid declaration', () => {
  const rejected = workload('legacy-input', 'render', false)
  expect(rejected.intent).toBe('render')
  expect(positiveRenderInput(rejected)).toBe(false)
  expect(workloadAppliesToOutput(rejected, 'svg')).toBe(false)
  expect(workloadAppliesToOutput(rejected, 'parse')).toBe(true)
})

