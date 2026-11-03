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

/** Existing equal-weight policy, now applied to current observations. Bounds
 * preserve missing work; the minimum is not an imputed point score. DaveBench
 * uses its previously declared completion/time rank percentile per format. */
export function synthesiseBenchmarks(davebench: any, drawing: any, fidelity: any, catalog: any) {
  const formats = ['svg', 'png', 'terminal']
  const ids = new Set<string>([...drawing.results, ...drawing.blocked, ...fidelity.results, ...fidelity.blocked, ...(davebench.runs ?? []), ...(davebench.blocked ?? [])].map((r: any) => r.project))
  const reference = fidelity.results.find((r: any) => r.project === 'mermaid-js/mermaid') ?? fidelity.results[0]
  const fidelityPopulation = fidelity.referenceQualifiedCallbacks + (reference?.counts['reference-unqualified'] ?? 0)
  const rows = [...ids].map(project => {
    const declared = catalog.nodes.find((n: any) => n.id === project)?.benchmark?.outputs ?? []
    const applicable = formats.filter(format => declared.includes(format) || format === 'png' && declared.includes('svg') || drawing.results.some((r: any) => r.project === project && r.format === format) || davebench.rankings[format]?.some((r: any) => r.project === project))
    if (!applicable.length) throw Error('No declared synthesis formats for ' + project)
    const observations = [...drawing.results, ...fidelity.results, ...(davebench.runs ?? [])].filter((r: any) => r.project === project)
    if (new Set(observations.map((r: any) => r.version)).size > 1) throw Error('Cannot synthesise different project versions: ' + project)
    const dave = meanBounds(applicable.map(format => {
      const peers = davebench.rankings[format] ?? [], row = peers.find((r: any) => r.project === project)
      if (!row) return unknownBounds()
      if (!Number.isInteger(row.rank) || row.rank < 1 || row.rank > peers.length) throw Error('Invalid DaveBench synthesis rank')
      const score = peers.length > 1 ? 100 * (peers.length - row.rank) / (peers.length - 1) : 100
      return { lower: score, upper: score }
    }))
    const draw = meanBounds(applicable.map(format => {
      const row = drawing.results.find((r: any) => r.project === project && r.format === format)
      return row ? caseBounds(row.counts.correct, row.counts.unknown + row.counts.unrun, drawing.corpus.cases) : unknownBounds()
    }))
    const native = fidelity.results.find((r: any) => r.project === project)
    const faithful = native ? caseBounds(native.counts.passed, native.counts['trident-blocked'] + (native.counts['reference-unqualified'] ?? 0), fidelityPopulation) : unknownBounds()
    const overall = meanBounds([dave, draw, faithful])
    return { project, formats: applicable, davebench: dave, drawing: draw, fidelity: faithful, overall, observed: observations.length > 0,
      score: overallScore({ davebench: dave.lower === dave.upper ? dave.lower : null, drawing: draw.lower === draw.upper ? draw.lower : null, fidelity: faithful.lower === faithful.upper ? faithful.lower : null }) }
  }).sort((a, b) => Number(b.observed) - Number(a.observed) || b.overall.lower - a.overall.lower || a.project.localeCompare(b.project))
  let rank = 0, previous: number | undefined
  return rows.map((row, index) => {
    if (row.observed && (previous === undefined || Math.abs(row.overall.lower - previous) > 1e-9)) { rank = index + 1; previous = row.overall.lower }
    return { ...row, minimumRank: row.observed ? rank : null }
  })
}
