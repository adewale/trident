import { expect, test } from 'bun:test'
import { overallScore } from '../unified/overall-score.ts'

test('overall scoring gives each measured benchmark equal weight', () => {
  expect(overallScore({ davebench: 100, drawing: 40, fidelity: 40 })).toBe(60)
  expect(overallScore({ davebench: 60, drawing: 70, fidelity: 80 })).toBe(70)
  expect(overallScore({ davebench: 0, drawing: 0, fidelity: 0 })).toBe(0)
})
test('missing or invalid measurements cannot produce an overall score', () => {
  for (const key of ['davebench', 'drawing', 'fidelity']) expect(overallScore({ davebench: 100, drawing: 100, fidelity: 100, [key]: null })).toBeNull()
  expect(() => overallScore({ davebench: 101, drawing: 80, fidelity: 80 })).toThrow()
  expect(() => overallScore({ davebench: Number.NaN, drawing: null, fidelity: null })).toThrow()
})

import { synthesiseBenchmarks } from '../unified/overall-score.ts'
function synthesisFixture() {
  const runs = ['a', 'b'].map(project => ({ project, version: '1', format: 'terminal' }))
  const davebench = { runs, blocked: [], rankings: { svg: [], png: [], terminal: runs.map((r, i) => ({ ...r, rank: i + 1 })) } }
  const drawing = { corpus: { cases: 10 }, blocked: [], results: runs.map((r, i) => ({ ...r, counts: { correct: i ? 10 : 8, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: i ? 0 : 2, unrun: 0 } })) }
  const fidelity = { referenceQualifiedCallbacks: 10, results: [{ project: 'a', version: '1', counts: { passed: 5, failed: 1, unsupported: 0, 'trident-blocked': 4, 'reference-unqualified': 0 } }], blocked: [{ project: 'b' }] }
  const catalog = { nodes: runs.map(r => ({ id: r.project, benchmark: { outputs: ['terminal'] } })) }
  return { davebench, drawing, fidelity, catalog }
}
test('synthesis gives equal benchmark weight, preserving gaps as bounds rather than zero scores', () => {
  const { davebench, drawing, fidelity, catalog } = synthesisFixture()
  const rows = synthesiseBenchmarks(davebench, drawing, fidelity, catalog)
  const a = rows.find(r => r.project === 'a')!, b = rows.find(r => r.project === 'b')!
  expect(a.davebench).toEqual({ lower: 100, upper: 100 })
  expect(a.drawing).toEqual({ lower: 80, upper: 100 })
  expect(a.fidelity).toEqual({ lower: 50, upper: 90 })
  expect(a.overall.lower).toBeCloseTo((100 + 80 + 50) / 3)
  expect(a.overall.upper).toBeCloseTo((100 + 100 + 90) / 3)
  expect(a.score).toBeNull()
  expect(b.fidelity).toEqual({ lower: 0, upper: 100 })
  expect(b.score).toBeNull()
  expect(rows.map(r => [r.project, r.minimumRank])).toEqual([['a', 1], ['b', 2]])
})
test('applicable formats cannot disappear from a synthesis when their measurements are missing', () => {
  const { davebench, drawing, fidelity, catalog } = synthesisFixture()
  catalog.nodes[0]!.benchmark.outputs.push('svg')
  const a = synthesiseBenchmarks(davebench, drawing, fidelity, catalog).find(r => r.project === 'a')!
  expect(a.formats).toEqual(['svg', 'png', 'terminal'])
  expect(a.davebench.lower).toBeCloseTo(100 / 3)
  expect(a.davebench.upper).toBe(100)
  expect(a.drawing.lower).toBeCloseTo(80 / 3)
  expect(a.score).toBeNull()
})
test('complete observations yield a point score while different versions cannot be combined', () => {
  const { davebench, drawing, fidelity, catalog } = synthesisFixture()
  drawing.results[0]!.counts.unknown = 0; drawing.results[0]!.counts.incorrect = 2
  fidelity.results[0]!.counts['trident-blocked'] = 0; fidelity.results[0]!.counts.failed = 5
  const a = synthesiseBenchmarks(davebench, drawing, fidelity, catalog).find(r => r.project === 'a')!
  expect(a.score).toBeCloseTo((100 + 80 + 50) / 3)
  fidelity.results[0]!.version = '2'
  expect(() => synthesiseBenchmarks(davebench, drawing, fidelity, catalog)).toThrow('different project versions')
})
