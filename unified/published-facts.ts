// Numbers quoted in prose are generated, never typed. A doc marks each one as
//   <!-- fact:NAME -->value<!-- /fact -->
// and results:snapshot fills it from the current result files; results:snapshot --check
// (run in CI) fails when a published number no longer matches them.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Docs that may quote generated numbers. */
export const factDocuments = ['README.md', 'docs/benchmark-portfolio.md', 'docs/benchmark-results-details.md', 'docs/davebench-definition.md', 'docs/overall-scoring.md', 'results/release/README.md']

const count = (n: number) => n.toLocaleString('en-US')
const day = (iso: string | undefined) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'unknown')

const series = (items: string[]) => (items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' and ' + items.at(-1))

/** "Name with N", or "A, B and C with N each" for a tie. A leader that an
 * unassessed case could still overtake is marked, never stated as settled. */
function leader(rows: { project: string; score: number; gaps?: number }[], names: Record<string, string>) {
  const best = Math.max(...rows.map(row => row.score)), top = rows.filter(row => row.score === best)
  const open = rows.some(row => row.score < best && row.score + (row.gaps ?? 0) >= best)
  return series(top.map(row => names[row.project] ?? row.project).sort()) + ' with ' + count(best) + (top.length > 1 ? ' each' : '') + (open ? ' (not yet settled)' : '')
}

/** Every generated fact, from the three current result files [DaveBench report, Drawing, Fidelity].
 * names maps project ids to display names for the leader facts. */
export function publishedFacts(davebench: any, drawing: any, fidelity: any, names: Record<string, string> = {}): Record<string, string> {
  const control = fidelity.results.find((row: any) => row.project === 'mermaid-js/mermaid')
  const candidates = fidelity.results.filter((row: any) => row.project !== 'mermaid-js/mermaid')
  const assessed = drawing.results.reduce((sum: number, row: any) => sum + Object.values(row.counts as Record<string, number>).reduce((a, n) => a + n, 0), 0)
  const projects = new Set([...(davebench.runs ?? []).map((run: any) => run.project), ...drawing.results.map((row: any) => row.project), ...fidelity.results.map((row: any) => row.project)])
  return {
    'davebench-inputs': count(davebench.corpus.occurrences),
    'davebench-collected': day(davebench.collection?.terminal?.finishedAt ?? davebench.collection?.images?.finishedAt),
    'drawing-cases': count(drawing.corpus.cases),
    'drawing-rows': count(assessed),
    'drawing-unassessed': count((drawing.totals.unknown ?? 0) + (drawing.totals.unrun ?? 0)),
    'drawing-correct': count(drawing.totals.correct),
    'drawing-collected': day(drawing.updatedAt),
    'fidelity-expanded': count(fidelity.expandedCallbacks),
    'fidelity-population': count(control.counts.passed),
    'fidelity-unqualified': count(control.counts['reference-unqualified']),
    'fidelity-skipped': count(control.counts['upstream-skipped']),
    'fidelity-files': count(fidelity.selectedFiles),
    'fidelity-candidates': count(candidates.length),
    'fidelity-gaps': count(candidates.reduce((sum: number, row: any) => sum + row.counts['trident-blocked'], 0)),
    'fidelity-collected': day(fidelity.collectedThrough ?? fidelity.updatedAt),
    // One date, or the span from the first benchmark collected to the last.
    'campaign-collected': [...new Set([davebench.collection?.terminal?.finishedAt ?? davebench.collection?.images?.finishedAt, drawing.updatedAt, fidelity.collectedThrough ?? fidelity.updatedAt].filter(Boolean).sort().map(day))].filter((value, index, all) => index === 0 || index === all.length - 1).join(' to ') || 'unknown',
    projects: count(projects.size),
    'davebench-svg-renderers': count(davebench.rankings.svg.length),
    'davebench-svg-range': count(Math.min(...davebench.rankings.svg.map((row: any) => row.completed))) + ' to ' + count(Math.max(...davebench.rankings.svg.map((row: any) => row.completed))),
    // Leaders exactly as RESULTS.md ranks them: DaveBench rank 1, the most correct
    // Drawing cases, and the candidate passing the most Fidelity tests.
    ...Object.fromEntries(['svg', 'png', 'terminal'].map(format => ['davebench-' + format + '-leader', leader(davebench.rankings[format].filter((row: any) => row.rank === 1).map((row: any) => ({ project: row.project, score: row.completed })), names)])),
    ...Object.fromEntries(['svg', 'terminal'].map(format => ['drawing-' + format + '-leader', leader(drawing.results.filter((row: any) => row.format === format).map((row: any) => ({ project: row.project, score: row.counts.correct, gaps: (row.counts.unknown ?? 0) + (row.counts.unrun ?? 0) })), names)])),
    'fidelity-leader': leader(candidates.map((row: any) => ({ project: row.project, score: row.counts.passed, gaps: row.counts['trident-blocked'] })), names),
  }
}

const marker = /<!-- fact:([a-z0-9-]+) -->([\s\S]*?)<!-- \/fact -->/g

/** The document with every fact marker filled; an unknown fact name is an error. */
export function fillFacts(text: string, facts: Record<string, string>, file = 'document') {
  return text.replace(marker, (_whole, name: string) => {
    if (!(name in facts)) throw Error(`${file}: unknown published fact "${name}"`)
    return `<!-- fact:${name} -->${facts[name]}<!-- /fact -->`
  })
}

/** [path, filled content] for every fact document that differs from its filled form. */
export function factOutputs(root: string, facts: () => Record<string, string>) {
  const documents = factDocuments.map(file => join(root, file)).filter(path => existsSync(path))
  if (!documents.length) return []
  const values = facts()
  return documents.map(path => [path, fillFacts(readFileSync(path, 'utf8'), values, path)] as [string, string])
}
