export interface BenchmarkScores { davebench: number | null; drawing: number | null; fidelity: number | null }

/** Equal weights; missing measurements cannot become zero or disappear. */
export function overallScore(scores: BenchmarkScores): number | null {
  const values = [scores.davebench, scores.drawing, scores.fidelity]
  if (values.some(value => value !== null && (!Number.isFinite(value) || value < 0 || value > 100))) throw Error('Benchmark scores must be between 0 and 100')
  return values.some(value => value === null) ? null : values.reduce<number>((sum, value) => sum + value!, 0) / 3
}

export interface ScoreBounds { lower: number; upper: number }
const unknownBounds = (): ScoreBounds => ({ lower: 0, upper: 100 })
const meanBounds = (values: ScoreBounds[]): ScoreBounds => ({ lower: values.reduce((sum, value) => sum + value.lower, 0) / values.length, upper: values.reduce((sum, value) => sum + value.upper, 0) / values.length })
const caseBounds = (passed: number, gaps: number, total: number): ScoreBounds => {
  if (![passed, gaps, total].every(Number.isInteger) || !(total > 0) || passed < 0 || gaps < 0 || passed + gaps > total) throw Error('Invalid synthesis population')
  return { lower: 100 * passed / total, upper: 100 * (passed + gaps) / total }
}
const epsilon = 1e-9

/** Fidelity scores only callbacks whose pinned Mermaid control passes. A callback
 * the reference cannot pass is unpassable for every participant by definition,
 * so it is reported as reference coverage work instead of a shared unknown. */
export function fidelityPopulation(fidelity: any) {
  const population = fidelity.referenceQualifiedCallbacks
  if (!Number.isInteger(population) || population <= 0) throw Error('Fidelity needs a positive reference-qualified population')
  for (const row of fidelity.results) {
    const c = row.counts, accounted = c.passed + c.failed + c.unsupported + c['trident-blocked']
    if (accounted !== population) throw Error(`Fidelity counts for ${row.project} cover ${accounted} callbacks, not the ${population}-callback qualified population`)
  }
  return population
}

/**
 * Best and worst rank a row can still reach once its unresolved work is
 * measured. Another row certainly ranks above only when its verified minimum
 * exceeds this row's maximum; it can rank above whenever its maximum exceeds
 * this row's minimum. No unresolved measurement is treated as a zero.
 */
export function possibleRanks<T extends { overall: ScoreBounds }>(rows: T[]) {
  return rows.map(row => ({
    ...row,
    bestRank: 1 + rows.filter(other => other !== row && other.overall.lower > row.overall.upper + epsilon).length,
    worstRank: 1 + rows.filter(other => other !== row && other.overall.upper > row.overall.lower + epsilon).length,
  }))
}

/** Equal-weight synthesis of the three current benchmarks. Bounds preserve
 * missing work. DaveBench contributes its absolute completion rate per format,
 * so the score cannot move when other participants are added or removed and
 * unlike CLI/API timing boundaries do not enter the overall score. */
export function synthesiseBenchmarks(davebench: any, drawing: any, fidelity: any, catalog: any) {
  const formats = ['svg', 'png', 'terminal']
  const ids = new Set<string>([...drawing.results, ...drawing.blocked, ...fidelity.results, ...fidelity.blocked, ...(davebench.runs ?? []), ...(davebench.blocked ?? [])].map((r: any) => r.project))
  const planned = davebench.corpus?.occurrences
  if (!Number.isInteger(planned) || planned <= 0) throw Error('DaveBench synthesis needs the planned occurrence count')
  const faithfulPopulation = fidelityPopulation(fidelity)
  const rows = [...ids].map(project => {
    const declared = catalog.nodes.find((n: any) => n.id === project)?.benchmark?.outputs ?? []
    const applicable = formats.filter(format => declared.includes(format) || format === 'png' && declared.includes('svg') || drawing.results.some((r: any) => r.project === project && r.format === format) || davebench.rankings[format]?.some((r: any) => r.project === project))
    if (!applicable.length) throw Error('No declared synthesis formats for ' + project)
    const observations = [...drawing.results, ...fidelity.results, ...(davebench.runs ?? [])].filter((r: any) => r.project === project)
    if (new Set(observations.map((r: any) => r.version)).size > 1) throw Error('Cannot synthesise different project versions: ' + project)
    const dave = meanBounds(applicable.map(format => {
      const row = davebench.rankings[format]?.find((r: any) => r.project === project)
      if (!row) return unknownBounds()
      if (!Number.isInteger(row.completed) || row.completed < 0 || row.completed > planned) throw Error('Invalid DaveBench synthesis completion count')
      const score = 100 * row.completed / planned
      return { lower: score, upper: score }
    }))
    const draw = meanBounds(applicable.map(format => {
      const row = drawing.results.find((r: any) => r.project === project && r.format === format)
      return row ? caseBounds(row.counts.correct, row.counts.unknown + row.counts.unrun, drawing.corpus.cases) : unknownBounds()
    }))
    const native = fidelity.results.find((r: any) => r.project === project)
    const faithful = native ? caseBounds(native.counts.passed, native.counts['trident-blocked'], faithfulPopulation) : unknownBounds()
    const overall = meanBounds([dave, draw, faithful])
    return { project, formats: applicable, davebench: dave, drawing: draw, fidelity: faithful, overall, observed: observations.length > 0,
      score: overallScore({ davebench: dave.lower === dave.upper ? dave.lower : null, drawing: draw.lower === draw.upper ? draw.lower : null, fidelity: faithful.lower === faithful.upper ? faithful.lower : null }) }
  })
  // Order by the position each row is guaranteed to reach, then by its best
  // reachable position. The displayed range, not this order, is the claim.
  return possibleRanks(rows).sort((a, b) => a.worstRank - b.worstRank || a.bestRank - b.bestRank || a.project.localeCompare(b.project))
}
