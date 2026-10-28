export function median(values: readonly number[]): number {
  if (!values.length || values.some(value => !Number.isFinite(value))) throw Error('Finite nonempty samples required')
  const sorted = [...values].sort((a, b) => a - b),
    middle = sorted.length >> 1
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}
export function quantile(values: readonly number[], probability: number): number {
  if (probability < 0 || probability > 1 || !values.length || values.some(value => !Number.isFinite(value))) throw Error('Invalid quantile inputs')
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(probability * sorted.length) - 1))]!
}
export function summarize(values: readonly number[]) {
  if (!values.length) return { samples: 0, medianMs: null, p95Ms: null, minMs: null, maxMs: null }
  return { samples: values.length, medianMs: median(values), p95Ms: quantile(values, 0.95), minMs: Math.min(...values), maxMs: Math.max(...values) }
}
export interface CalibrationRound {
  round: number
  A0: number[]
  A1: number[]
  B: number[]
}
/** Exact sign/order-statistic interval for the population median of independent
 * round ratios. Calls within one process/round are not independent replicas.
 * Five rounds cannot produce a finite two-sided 95% interval, even if each
 * round contains thousands of repeated calls. */
export function roundRatioUncertainty(ratios: readonly number[]) {
  if (!ratios.length || ratios.some(value => !Number.isFinite(value) || value <= 0)) throw Error('Finite positive round ratios required')
  const sorted = [...ratios].sort((a, b) => a - b), n = sorted.length
  let logMass = -n * Math.LN2, cumulative = 0, selected: { lower: number; upper: number; confidence: number } | null = null
  for (let k = 1; k <= Math.floor(n / 2); k++) {
    cumulative += Math.exp(logMass)
    const confidence = 1 - 2 * cumulative
    if (confidence < 0.95) break
    selected = { lower: sorted[k - 1]!, upper: sorted[n - k]!, confidence }
    logMass += Math.log(n - k + 1) - Math.log(k)
  }
  return { independentRounds: n, medianRatio: median(sorted), interval: selected, method: 'Exact two-sided sign/order-statistic interval for the median round ratio; assumes independent representative rounds. No within-round call resampling.', detail: selected ? 'A finite interval does not remove systematic host, workload or artifact differences.' : 'Insufficient independent rounds for a finite two-sided 95% median interval; at least six are required. The observed control envelope remains descriptive.' }
}
/** Replica B uses the same admitted artifact in the calibration case study. */
export function calibrate(rounds: CalibrationRound[], minimumSamples: number, maximumControlSpread = 0.25) {
  if (!Number.isSafeInteger(minimumSamples) || minimumSamples < 1 || !Number.isFinite(maximumControlSpread) || maximumControlSpread < 0) throw Error('A positive sample count and finite nonnegative control spread are required')
  const gaps: string[] = []
  if (rounds.length < 5) gaps.push('At least five independent rounds are required')
  if (new Set(rounds.map(round => round.round)).size !== rounds.length) gaps.push('Round identities must be unique')
  if (rounds.some(round => [round.A0, round.A1, round.B].some(samples => samples.length < minimumSamples || samples.some(value => !Number.isFinite(value) || value <= 0)))) gaps.push('Every replica/round needs the declared finite positive sample count')
  if (rounds.some(round => !Number.isSafeInteger(round.round) || round.round < 1)) gaps.push('Round identities must be positive integers')
  if (gaps.length) return { status: 'uncalibrated' as const, gaps, controlRatios: [], candidateRatios: [], controlBand: null, candidateRatio: null, roundRatioUncertainty: null }
  const controlRatios = rounds.map(round => median(round.A1) / median(round.A0))
  const candidateRatios = rounds.map(round => median(round.B) / Math.sqrt(median(round.A0) * median(round.A1)))
  const controlBand = { lower: Math.min(...controlRatios, ...controlRatios.map(value => 1 / value)), upper: Math.max(...controlRatios, ...controlRatios.map(value => 1 / value)) }
  if (controlBand.upper - 1 > maximumControlSpread) gaps.push('Observed A/A control spread exceeds the declared noise ceiling')
  const candidateRatio = median(candidateRatios)
  return {
    status: gaps.length ? ('uncalibrated' as const) : ('calibrated' as const),
    gaps,
    controlRatios,
    candidateRatios,
    controlBand,
    candidateRatio,
    roundRatioUncertainty: { controls: roundRatioUncertainty(controlRatios), replicaB: roundRatioUncertainty(candidateRatios) },
    interpretation: candidateRatio < controlBand.lower ? 'below observed control band; advisory' : candidateRatio > controlBand.upper ? 'above observed control band; advisory' : 'within observed control band',
  }
}
