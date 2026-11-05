// Numbers quoted in prose are generated, never typed. A doc marks each one as
//   <!-- fact:NAME -->value<!-- /fact -->
// and results:snapshot fills it from the current result files; results:snapshot --check
// (run in CI) fails when a published number no longer matches them.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Docs that may quote generated numbers. */
export const factDocuments = ['README.md', 'docs/benchmark-portfolio.md', 'docs/benchmark-results-details.md', 'docs/davebench-definition.md', 'docs/overall-scoring.md']

const count = (n: number) => n.toLocaleString('en-US')
const day = (iso: string | undefined) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'unknown')

/** Every generated fact, from the three current result files [DaveBench report, Drawing, Fidelity]. */
export function publishedFacts(davebench: any, drawing: any, fidelity: any): Record<string, string> {
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
    projects: count(projects.size),
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
