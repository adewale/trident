// Re-score a Mermaid Fidelity run with the current outcome rules, from the Vitest reports
// and audits it recorded. No test or renderer runs: only the classification of recorded
// outcomes changes. The control comes from the run itself or, for a run collected with
// --reuse-reference, from --reference-run.
//
//   bun scripts/rescore-fidelity.ts RUN_DIR [--reference-run CONTROL_RUN_DIR]
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { compileFidelityReference, fidelityOutcomes } from '../unified/mermaid-fidelity.ts'
import { fidelityPopulationSizes, fidelityScoringDefinition, scoredFidelityCounts } from '../unified/mermaid-fidelity/scoring.ts'
import { unreviewedViewGap } from '../unified/mermaid-fidelity/views/reviewed-versions.mjs'

const STATUSES = ['passed', 'failed', 'unsupported', 'trident-blocked', 'reference-unqualified', 'upstream-skipped', 'upstream-expected-failure']
const read = (path: string) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null)
const audit = (path: string) => (existsSync(path) ? readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [])
const recorded = (run: string, project: string) => {
  const directory = join(run, encodeURIComponent(project))
  const job = read(join(directory, 'job.json'))
  if (!job) throw Error('No recorded job for ' + project + ' in ' + run)
  return { native: read(join(directory, 'vitest.json')), audit: audit(join(directory, 'audit.jsonl')), upstream: job.upstream as string }
}

export function rescoreFidelityRun(run: string, referenceRun = run) {
  const results = read(join(run, 'results.json'))
  if (!results) throw Error('No results.json in ' + run)
  const control = recorded(referenceRun, 'mermaid-js/mermaid')
  let reference: ReturnType<typeof compileFidelityReference> | undefined
  results.results = results.results.map((row: any) => {
    const candidate = row.project === 'mermaid-js/mermaid' ? control : recorded(run, row.project)
    const viewGap = row.project === 'mermaid-js/mermaid' ? undefined : unreviewedViewGap(row.project, row.version)
    const rows = fidelityOutcomes((reference ??= compileFidelityReference(control.native, control.audit)), candidate.native, candidate.audit, undefined, { viewGap })
    const counts: Record<string, number> = Object.fromEntries(STATUSES.map(status => [status, 0]))
    for (const r of rows as any[]) if (Object.hasOwn(counts, r.status)) counts[r.status]!++
    const cases = rows.map((r: any) => ({ ...r, file: relative(candidate.upstream, r.file) }))
    return { ...row, counts, scored: scoredFidelityCounts(cases), cases }
  })
  const controlRow = results.results.find((row: any) => row.project === 'mermaid-js/mermaid')
  Object.assign(results, { scoring: fidelityScoringDefinition, ...(controlRow ? fidelityPopulationSizes(controlRow.cases) : {}) })
  results.rescoredAt = new Date().toISOString()
  writeFileSync(join(run, 'results.json'), JSON.stringify(results, null, 2))
  return results.results.map((row: any) => ({ project: row.project, ...row.counts, scored: row.scored }))
}

if (import.meta.main) {
  const [run, flag, referenceRun] = process.argv.slice(2)
  if (!run || (flag && flag !== '--reference-run') || (flag && !referenceRun)) throw Error('bun scripts/rescore-fidelity.ts RUN_DIR [--reference-run CONTROL_RUN_DIR]')
  console.log(JSON.stringify(rescoreFidelityRun(run, referenceRun ?? run), null, 1))
}
