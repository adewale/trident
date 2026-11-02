export interface ScoreInterval { score: number | null; lower: number; upper: number; reason?: string }
export const overallWeights = { davebench: 1 / 3, drawing: 1 / 3, fidelity: 1 / 3 } as const
export type OverallComponent = keyof typeof overallWeights
export const missingScore = (reason: string): ScoreInterval => ({ score: null, lower: 0, upper: 100, reason })

/** Unknown assessment is a range of possible scores, never an invented zero. */
export function passFractionScore(passed: number, unknown: number, planned: number): ScoreInterval {
  if (!Number.isSafeInteger(planned) || planned <= 0 || !Number.isSafeInteger(passed) || !Number.isSafeInteger(unknown) || passed < 0 || unknown < 0 || passed + unknown > planned) throw Error('Invalid fixed-population score')
  const lower = 100 * passed / planned, upper = 100 * (passed + unknown) / planned
  return { score: unknown ? null : lower, lower, upper }
}
export function meanScores(scores: ScoreInterval[]): ScoreInterval {
  if (!scores.length) return missingScore('No measured applicable formats')
  for (const value of scores) if (!Number.isFinite(value.lower) || !Number.isFinite(value.upper) || value.lower < 0 || value.upper > 100 || value.lower > value.upper || value.score !== null && (!Number.isFinite(value.score) || value.score < value.lower || value.score > value.upper)) throw Error('Invalid benchmark score interval')
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  return { score: scores.every(value => value.score !== null) ? mean(scores.map(value => value.score!)) : null, lower: mean(scores.map(value => value.lower)), upper: mean(scores.map(value => value.upper)) }
}
export function overallScorecards(rows: { project: string; components: Record<OverallComponent, ScoreInterval> }[]) {
  const scores = rows.map(row => {
    const components = Object.keys(overallWeights).map(key => row.components[key as OverallComponent])
    const overall = meanScores(components)
    return { ...row, overall, rank: null as number | null, missingBenchmarks: Object.keys(overallWeights).filter(key => row.components[key as OverallComponent].score === null) }
  })
  const ranked = scores.filter(row => row.overall.score !== null).sort((a, b) => b.overall.score! - a.overall.score! || a.project.localeCompare(b.project))
  for (const [index, row] of ranked.entries()) { const previous = ranked[index - 1]; row.rank = previous?.overall.score === row.overall.score ? previous.rank : index + 1 }
  return { weights: overallWeights, ranked, unranked: scores.filter(row => row.overall.score === null).sort((a, b) => b.overall.lower - a.overall.lower || a.project.localeCompare(b.project)), overallWinner: ranked.length && scores.every(row => row === ranked[0] || row.overall.upper < ranked[0]!.overall.lower) ? ranked[0]!.project : null }
}
