export interface BenchmarkScores { davebench: number | null; drawing: number | null; fidelity: number | null }

/** Equal weights; missing measurements cannot become zero or disappear. */
export function overallScore(scores: BenchmarkScores): number | null {
  const values = [scores.davebench, scores.drawing, scores.fidelity]
  if (values.some(value => value !== null && (!Number.isFinite(value) || value < 0 || value > 100))) throw Error('Benchmark scores must be between 0 and 100')
  return values.some(value => value === null) ? null : values.reduce<number>((sum, value) => sum + value!, 0) / 3
}
