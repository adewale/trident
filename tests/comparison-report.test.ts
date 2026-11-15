import { expect, test } from 'bun:test'
import { commonDrawingComparison, commonFidelityComparison, renderCommonComparison } from '../unified/comparison-report.ts'

test('a Drawing comparison uses only cases every member has a verdict for', () => {
  const lane = (project: string, correct: string[], unknown: string[] = [], incorrect: string[] = []) => ({ project, version: '1', format: 'svg', counts: { correct: correct.length }, caseOutcomes: { correct, unknown, incorrect } })
  const drawing = { corpus: { cases: 4 }, results: [lane('a', ['c1', 'c2', 'c3'], ['c4']), lane('b', ['c1', 'c4'], ['c3'], ['c2'])] }
  const comparison = commonDrawingComparison(drawing, 'svg')!
  // c3 and c4 are unknown for one member each, so only c1 and c2 are common.
  expect(comparison.population).toBe(2)
  expect(comparison.rows).toEqual([{ project: 'a', version: '1', passed: 2 }, { project: 'b', version: '1', passed: 1 }])
})

test('a Fidelity comparison keeps only scored files with no unassessed callback for any member', () => {
  const row = (project: string, files: [string, Record<string, number>][]) => ({ project, version: '1', scored: { passed: 0, failed: 0, unsupported: 0, 'trident-blocked': 0 }, perFile: files.map(([path, counts]) => ({ path, counts })) })
  const scoredA = 'packages/parser/a.spec.ts', scoredB = 'packages/mermaid/src/diagrams/b.spec.ts', inventory = 'packages/mermaid/src/utils.spec.ts'
  const results = [
    row('x', [[scoredA, { passed: 3, failed: 1 }], [scoredB, { passed: 2, 'trident-blocked': 2 }], [inventory, { passed: 5 }]]),
    row('y', [[scoredA, { passed: 2, failed: 2 }], [scoredB, { passed: 4 }], [inventory, { passed: 5 }]]),
  ]
  for (const r of results) r.scored = { passed: 7, failed: 1, unsupported: 0, 'trident-blocked': 0 }
  const fidelity = { scoring: { protocol: 'fidelity-scored-population-v2' }, scoredPopulation: 8, inventoryCallbacks: 5, results }
  const comparison = commonFidelityComparison(fidelity)!
  // Only scoredA is decided for both; the inventory file is never part of the comparison.
  expect(comparison.population).toBe(4)
  expect(comparison.rows.map(r => [r.project, r.passed])).toEqual([['x', 3], ['y', 2]])
  expect(renderCommonComparison(comparison, r => r.project).join('\n')).toContain('compared on the 4 of 8 callbacks')
})

test('older Fidelity results and an empty common population produce no ranking claim', () => {
  expect(commonFidelityComparison({ referenceQualifiedCallbacks: 10, results: [] })).toBeUndefined()
  const lane = (project: string, correct: string[], unknown: string[]) => ({ project, version: '1', format: 'svg', counts: { correct: correct.length }, caseOutcomes: { correct, unknown } })
  const none = commonDrawingComparison({ corpus: { cases: 2 }, results: [lane('a', ['c1'], ['c2']), lane('b', ['c2'], ['c1'])] }, 'svg')!
  expect(none.population).toBe(0)
  expect(renderCommonComparison(none, r => r.project).join('\n')).toContain('no narrower comparison is decided')
})
