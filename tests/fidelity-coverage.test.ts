import { expect, test } from 'bun:test'
import { fidelityCoverage, fidelitySlice } from '../unified/fidelity-coverage.ts'

test('source slices keep a fixed denominator, repeated callback titles and missing work', () => {
  const file = 'packages/parser/tests/radar.test.ts'
  const cases = [{ file, name: 'repeated', status: 'passed' }, { file, name: 'repeated', status: 'passed' }, { file: 'packages/mermaid/src/rendering-util/a.spec.ts', name: 'draw', status: 'passed' }, { file: 'packages/mermaid/src/config.spec.ts', name: 'skip', status: 'upstream-skipped' }]
  const report = fidelityCoverage({ pin: 'pinned', results: [{ project: 'mermaid-js/mermaid', version: '12.3.0', cases }, { project: 'example/tool', version: '1.0.0', cases: cases.map((c, i) => ({ ...c, status: ['passed', 'trident-blocked', 'unsupported', 'upstream-skipped'][i], reason: 'missing import' })) }] })
  const row = report.results[1]!
  expect(report.referenceQualifiedCallbacks).toBe(3)
  expect(row.slices[0]).toMatchObject({ population: 2, passed: 1, unassessed: 1, lowerScore: 50, upperScore: 100, assessedPercent: 50 })
  expect(row.slices[1]).toMatchObject({ population: 1, unsupported: 1, lowerScore: 0, upperScore: 0, assessedPercent: 100 })
  expect(row.slices[2]).toMatchObject({ population: 0, lowerScore: null })
  expect(row.gaps[0].unassessed).toBe(1)
  expect(fidelitySlice('packages/mermaid/src/diagrams/flowchart/parser/flow.spec.js')).toBe('parser-model')
  expect(fidelitySlice('packages/mermaid/src/diagrams/gantt/ganttDb.spec.ts')).toBe('parser-model')
  expect(fidelitySlice('packages/mermaid/src/mermaidAPI.spec.ts')).toBe('host-internals')
})
