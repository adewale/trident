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
  const davebench = { corpus: { occurrences: 20 }, runs, blocked: [], rankings: { svg: [], png: [], terminal: runs.map((r, i) => ({ ...r, rank: i + 1, completed: i ? 15 : 20 })) } }
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
  // b's verified minimum (75+100+0)/3 is below a's, but b's unmeasured Fidelity
  // could still lift it above a; neither position is decided.
  expect(b.davebench).toEqual({ lower: 75, upper: 75 })
  expect(rows.map(r => [r.project, r.bestRank, r.worstRank])).toEqual([['a', 1, 2], ['b', 1, 2]])
})
test('possible ranks never treat unresolved work as zero', () => {
  const { davebench, drawing, fidelity, catalog } = synthesisFixture()
  // b's whole Fidelity third is unmeasured: ranking by the lower bound would
  // place it last, although it could finish first.
  const rows = synthesiseBenchmarks(davebench, drawing, fidelity, catalog)
  const b = rows.find(r => r.project === 'b')!
  expect(b.overall.lower).toBeLessThan(rows.find(r => r.project === 'a')!.overall.lower)
  expect(b.bestRank).toBe(1)
  // Once both are fully measured with disjoint scores, the order is decided.
  fidelity.results.push({ project: 'b', version: '1', counts: { passed: 0, failed: 10, unsupported: 0, 'trident-blocked': 0, 'reference-unqualified': 0 } })
  fidelity.blocked = []
  drawing.results[0]!.counts.unknown = 0; drawing.results[0]!.counts.incorrect = 2
  fidelity.results[0]!.counts['trident-blocked'] = 0; fidelity.results[0]!.counts.failed = 5
  const decided = synthesiseBenchmarks(davebench, drawing, fidelity, catalog)
  expect(decided.map(r => [r.project, r.bestRank, r.worstRank])).toEqual([['a', 1, 1], ['b', 2, 2]])
})
test('DaveBench contributes an absolute completion rate, independent of other participants', () => {
  const { davebench, drawing, fidelity, catalog } = synthesisFixture()
  const before = synthesiseBenchmarks(davebench, drawing, fidelity, catalog).find(r => r.project === 'b')!.davebench
  davebench.rankings.terminal.push({ project: 'c', version: '1', format: 'terminal', rank: 1, completed: 20 } as any)
  davebench.runs.push({ project: 'c', version: '1', format: 'terminal' })
  catalog.nodes.push({ id: 'c', benchmark: { outputs: ['terminal'] } })
  fidelity.blocked.push({ project: 'c' })
  expect(synthesiseBenchmarks(davebench, drawing, fidelity, catalog).find(r => r.project === 'b')!.davebench).toEqual(before)
})
test('Fidelity scores the reference-qualified population, so the reference can reach 100', () => {
  const { davebench, drawing, fidelity, catalog } = synthesisFixture()
  fidelity.results.unshift({ project: 'mermaid-js/mermaid', version: '12', counts: { passed: 10, failed: 0, unsupported: 0, 'trident-blocked': 0, 'reference-unqualified': 7 } })
  davebench.runs.push({ project: 'mermaid-js/mermaid', version: '12', format: 'terminal' })
  catalog.nodes.push({ id: 'mermaid-js/mermaid', benchmark: { outputs: ['terminal'] } })
  const reference = synthesiseBenchmarks(davebench, drawing, fidelity, catalog).find(r => r.project === 'mermaid-js/mermaid')!
  expect(reference.fidelity).toEqual({ lower: 100, upper: 100 })
  fidelity.results[0]!.counts.passed = 9
  expect(() => synthesiseBenchmarks(davebench, drawing, fidelity, catalog)).toThrow('qualified population')
})
test('applicable formats cannot disappear from a synthesis when their measurements are missing', () => {
  const { davebench, drawing, fidelity, catalog } = synthesisFixture()
  catalog.nodes[0]!.benchmark.outputs.push('svg')
  const a = synthesiseBenchmarks(davebench, drawing, fidelity, catalog).find(r => r.project === 'a')!
  expect(a.formats).toEqual(['svg', 'png', 'terminal'])
  expect(a.davebench.lower).toBeCloseTo(100 / 3)
  expect(a.davebench.upper).toBe(100)
  expect(a.drawing!.lower).toBeCloseTo(80 / 3)
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

test('Drawing is not applicable, not unknown, for a project with none of its formats', () => {
  const { davebench, drawing, fidelity, catalog } = synthesisFixture()
  ;(drawing as any).formats = ['svg', 'terminal']
  davebench.rankings.png = [{ project: 'p', version: '1', format: 'png', rank: 1, completed: 10 }] as any
  davebench.runs.push({ project: 'p', version: '1', format: 'png' })
  catalog.nodes.push({ id: 'p', benchmark: { outputs: ['png'] } })
  fidelity.results.push({ project: 'p', version: '1', counts: { passed: 10, failed: 0, unsupported: 0, 'trident-blocked': 0, 'reference-unqualified': 0 } })
  const p = synthesiseBenchmarks(davebench, drawing, fidelity, catalog).find(r => r.project === 'p')!
  expect(p.drawing).toBeNull()
  expect(p.overall).toEqual({ lower: 75, upper: 75 })
  expect(p.score).toBe(75)
})
