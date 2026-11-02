import { expect, test } from 'bun:test'
import { meanScores, missingScore, overallScorecards, passFractionScore } from '../unified/overall-score.ts'

const measured = (score: number) => ({ score, lower: score, upper: score })
test('the requested three benchmarks have equal weight and exact ties share a rank', () => {
  const report = overallScorecards([
    { project: 'fast', components: { davebench: measured(100), drawing: measured(40), fidelity: measured(40) } },
    { project: 'balanced', components: { davebench: measured(60), drawing: measured(70), fidelity: measured(80) } },
    { project: 'tie', components: { davebench: measured(80), drawing: measured(70), fidelity: measured(60) } },
  ])
  expect(report.ranked.map(row => [row.project, row.rank, row.overall.score])).toEqual([['balanced', 1, 70], ['tie', 1, 70], ['fast', 3, 60]])
  expect(report.overallWinner).toBeNull()
})
test('a missing benchmark cannot become zero, disappear from the average or produce an overall rank', () => {
  const report = overallScorecards([{ project: 'only-dave', components: { davebench: measured(100), drawing: missingScore('not collected'), fidelity: missingScore('not implemented') } }])
  expect(report.ranked).toEqual([])
  expect(report.unranked[0]!.overall.score).toBeNull()
  expect(report.unranked[0]!.overall.lower).toBeCloseTo(100 / 3)
  expect(report.unranked[0]!.overall.upper).toBe(100)
  expect(report.overallWinner).toBeNull()
})
test('unknown case checks preserve score bounds and can prevent a claimed winner', () => {
  const partial = passFractionScore(65, 18, 116)
  expect(partial.score).toBeNull(); expect(partial.lower).toBeCloseTo(100 * 65 / 116); expect(partial.upper).toBeCloseTo(100 * 83 / 116)
  const report = overallScorecards([
    { project: 'known', components: { davebench: measured(80), drawing: measured(80), fidelity: measured(80) } },
    { project: 'unassessed', components: { davebench: measured(100), drawing: missingScore('unknown'), fidelity: measured(100) } },
  ])
  expect(report.ranked[0]!.project).toBe('known'); expect(report.overallWinner).toBeNull()
  expect(() => passFractionScore(100, 30, 116)).toThrow()
  expect(() => meanScores([measured(101)])).toThrow()
})
