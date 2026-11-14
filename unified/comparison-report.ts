// Narrower comparisons that name their exact population. A league table with
// unassessed cases is a set of ranges, not a ranking; comparing a few projects on the
// cases every one of them has a verdict for gives a decided comparison, but only over
// that common population. Each comparison states its group rule and population size.
import { fidelityScoring, isScoredFidelityFile } from './mermaid-fidelity/scoring.ts'

export interface CommonComparison {
  rule: string
  unit: string
  population: number
  /** Population before restriction: the cases or callbacks each member could be assessed on. */
  of: number
  rows: { project: string; version?: string; passed: number }[]
}

const ASSESSED_DRAWING = ['correct', 'incorrect', 'renderer-failure', 'invalid-format']
export const COMPARISON_GROUP_SIZE = 5

/** Drawing: the members with the most correct cases in a format, compared on the cases
 * every member has a verdict for (correct, incorrect, renderer failure or invalid). */
export function commonDrawingComparison(drawing: any, format: string, size = COMPARISON_GROUP_SIZE): CommonComparison | undefined {
  const lanes = drawing.results.filter((lane: any) => lane.format === format && lane.caseOutcomes)
  if (lanes.length < 2) return undefined
  const members = [...lanes].sort((a: any, b: any) => b.counts.correct - a.counts.correct || String(a.project).localeCompare(String(b.project))).slice(0, size)
  const assessed = (lane: any) => new Set(ASSESSED_DRAWING.flatMap(status => lane.caseOutcomes[status] ?? []))
  const sets = members.map(assessed)
  const common = [...sets[0]!].filter(id => sets.every(set => set.has(id)))
  return {
    rule: `the ${members.length} projects with the most correct ${format === 'terminal' ? 'terminal' : format.toUpperCase()} cases`,
    unit: 'cases', population: common.length, of: drawing.corpus.cases,
    rows: members.map((lane: any) => ({ project: lane.project, version: lane.version, passed: common.filter(id => (lane.caseOutcomes.correct ?? []).includes(id)).length })).sort((a, b) => b.passed - a.passed),
  }
}

/** Mermaid Fidelity: the candidates with the most verified passes, compared on the scored
 * files in which every member has no unassessed callback, so every callback in the
 * common population has a pass or a known nonpass for every member. Per-file counts are
 * exact, so the comparison is exact at file granularity. */
export function commonFidelityComparison(fidelity: any, catalog?: any, size = COMPARISON_GROUP_SIZE): CommonComparison | undefined {
  const scoring = fidelityScoring(fidelity, catalog)
  if (!scoring.current) return undefined
  const candidates = scoring.results.filter((row: any) => row.project !== 'mermaid-js/mermaid' && Array.isArray(row.perFile))
  if (candidates.length < 2) return undefined
  const members = [...candidates].sort((a: any, b: any) => scoring.score(b).passed - scoring.score(a).passed || String(a.project).localeCompare(String(b.project))).slice(0, size)
  const files = (row: any) => new Map<string, Record<string, number>>(row.perFile.filter((entry: any) => isScoredFidelityFile(entry.path)).map((entry: any) => [entry.path, entry.counts]))
  const byMember = members.map(files)
  const decided = (counts: Record<string, number> | undefined) => !!counts && !(counts.unsupported ?? 0) && !(counts['trident-blocked'] ?? 0) && (counts.passed ?? 0) + (counts.failed ?? 0) > 0
  const commonFiles = [...byMember[0]!.keys()].filter(path => byMember.every(map => decided(map.get(path))))
  const population = commonFiles.reduce((sum, path) => sum + (byMember[0]!.get(path)!.passed ?? 0) + (byMember[0]!.get(path)!.failed ?? 0), 0)
  for (const map of byMember) if (commonFiles.reduce((sum, path) => sum + (map.get(path)!.passed ?? 0) + (map.get(path)!.failed ?? 0), 0) !== population) throw Error('Fidelity members disagree on the qualified callbacks of a common file')
  return {
    rule: `the ${members.length} candidates with the most verified passes, on the scored files in which none of them has an unassessed callback (${commonFiles.length} files)`,
    unit: 'callbacks', population, of: scoring.population,
    rows: members.map((row: any, index: number) => ({ project: row.project, version: row.version, passed: commonFiles.reduce((sum, path) => sum + (byMember[index]!.get(path)!.passed ?? 0), 0) })).sort((a, b) => b.passed - a.passed),
  }
}

/** Markdown for one comparison, using the league tables' project labels. */
export function renderCommonComparison(comparison: CommonComparison | undefined, label: (row: { project: string; version?: string }) => string) {
  if (!comparison) return []
  const lines = [`**Common population:** ${comparison.rule}, compared on the ${comparison.population.toLocaleString('en-GB')} of ${comparison.of.toLocaleString('en-GB')} ${comparison.unit} that every one of them has a verdict for. Outside this population their order is not decided.`, '']
  if (!comparison.population) return [...lines.slice(0, 1), '', 'No case has a verdict for every member, so no narrower comparison is decided.', '']
  lines.push(`| Project | Passed / ${comparison.population} |`, '| --- | --- |', ...comparison.rows.map(row => `| ${label(row).replaceAll('|', '\\|')} | ${row.passed} |`), '')
  return lines
}
