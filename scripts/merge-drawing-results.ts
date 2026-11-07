// Replace the selected formats of a published Drawing Correctness result with a
// fresh drawing:correctness run over the same corpus and frozen catalog. Other
// formats keep their published rows. No renderer is invoked.
//
//   bun scripts/merge-drawing-results.ts --base PUBLISHED.json --run RUN_DIR --formats terminal --out FILE
//   bun scripts/merge-drawing-results.ts --run RUN_DIR --out FILE   (one complete run publishes every format)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assertCampaignCoverage } from '../unified/campaign-plan.ts'

const statuses = ['correct', 'incorrect', 'renderer-failure', 'invalid-format', 'unknown', 'unrun'] as const

/** Per project/format counts, case lists and unknown reasons from raw rows. */
export function aggregateDrawingRows(rows: any[], caseIds: readonly string[]) {
  const expected = new Set(caseIds)
  if (!expected.size || expected.size !== caseIds.length) throw Error('Drawing corpus needs unique case IDs')
  const groups = new Map<string, any[]>()
  for (const row of rows) {
    const key = JSON.stringify([row.project, row.format])
    const group = groups.get(key) ?? []
    group.push(row); groups.set(key, group)
  }
  return [...groups.values()].map(group => {
    const seen = new Set<string>()
    const versions = new Set(group.map(row => row.version))
    if (versions.size !== 1) throw Error('Mixed versions for ' + group[0].project + ' ' + group[0].format)
    const counts = Object.fromEntries(statuses.map(status => [status, 0])) as Record<string, number>
    const caseOutcomes = Object.fromEntries(statuses.map(status => [status, [] as string[]])) as Record<string, string[]>
    const assessmentGapReasons: Record<string, number> = {}
    for (const row of group) {
      if (!expected.has(row.caseId) || seen.has(row.caseId)) throw Error('Unknown or duplicate drawing case: ' + row.caseId)
      seen.add(row.caseId)
      if (!statuses.includes(row.status)) throw Error('Unknown drawing status ' + row.status)
      counts[row.status]!++
      caseOutcomes[row.status]!.push(row.caseId)
      if (row.status === 'unknown') for (const reason of row.format === 'svg' && row.unknown?.length ? row.unknown : [row.reason ?? 'Unassessed']) assessmentGapReasons[reason] = (assessmentGapReasons[reason] ?? 0) + 1
    }
    if (seen.size !== expected.size) throw Error(`${group[0].project} ${group[0].format} does not account for every case`)
    return { project: group[0].project, version: group[0].version, format: group[0].format, counts, caseOutcomes, assessmentGapReasons }
  })
}

export function mergeDrawingResults(base: any, run: any, formats: string[]) {
  if (run.state !== 'complete') throw Error('Drawing run is not complete')
  if (base.corpus.ids.length !== base.corpus.cases) throw Error('Drawing population differs from its case IDs')
  if (JSON.stringify(run.corpus.ids) !== JSON.stringify(base.corpus.ids)) throw Error('Drawing run must use the published corpus')
  if (run.versionsFrozenAt !== base.versionsFrozenAt) throw Error('Drawing run must use the published version freeze')
  validateDrawingCoverage(run)
  if (base.corpus.contractSha256 && run.corpus.contractSha256 !== base.corpus.contractSha256) throw Error('Drawing run must use the published reviewed expectations')
  const fresh = aggregateDrawingRows(run.rows.filter((row: any) => formats.includes(row.format)), base.corpus.ids).map(row => ({ ...row, ...(run.assessmentPolicy ? { assessmentPolicy: run.assessmentPolicy } : {}) }))
  const blocks = run.blocked.flatMap((row: any) => { const selected = String(row.format).split('/').filter(format => formats.includes(format)); return selected.length ? [{ ...row, format: selected.join('/') }] : [] })
  const key = (project: string, format: string) => JSON.stringify([project, format])
  const replaced = new Set([...fresh.map(row => key(row.project, row.format)), ...blocks.flatMap((row: any) => row.format.split('/').map((format: string) => key(row.project, format)))])
  const priorLanes = [...base.results, ...base.blocked.flatMap((row: any) => row.format.split('/').map((format: string) => ({ ...row, format })))]
  if (run.corpus.contractSha256 && !base.corpus.contractSha256 && priorLanes.some((row: any) => !replaced.has(key(row.project, row.format)))) throw Error('Prior results lack reviewed expectation identity; publish a fresh complete campaign')
  for (const format of formats) if (run.assessmentProfiles?.[format] && base.assessmentProfiles?.[format] !== run.assessmentProfiles[format] && priorLanes.some((row: any) => row.format === format && !replaced.has(key(row.project, format)))) throw Error('Changed observer profile requires recollecting every published lane in ' + format)
  const results = [...base.results.filter((row: any) => !replaced.has(key(row.project, row.format))), ...fresh]
  const totals = Object.fromEntries(statuses.map(status => [status, results.reduce((sum: number, row: any) => sum + row.counts[status], 0)]))
  const blocked = [...base.blocked.flatMap((row: any) => { const kept = String(row.format).split('/').filter(format => !replaced.has(key(row.project, format))); return kept.length ? [{ ...row, format: kept.join('/') }] : [] }), ...blocks]
  return { ...base, ...(run.assessmentProfiles ? { assessmentProfiles: { ...base.assessmentProfiles, ...Object.fromEntries(formats.map(format => [format, run.assessmentProfiles[format]])) } } : {}), results, totals, blocked, updatedAt: collectedAt(run), recollectedFormats: { formats, at: collectedAt(run), reason: 'Replaced only the supplied project/format results from the same corpus and frozen versions; all other observations are preserved.' } }
}

/** When a run finished collecting. A run from before runs recorded their times has none,
 * and the caller must say when it finished; a merge's own time is never a collection date. */
function collectedAt(run: any): string {
  if (!run.updatedAt) throw Error('Drawing run records no collection time; pass --collected-at ISO_TIME (when its results.json was last written)')
  return run.updatedAt
}

/** The published result of one complete run over every format: no earlier result is kept. */
export function publishDrawingRun(run: any) {
  if (run.state !== 'complete') throw Error('Drawing run is not complete')
  if (run.corpus.ids.length !== run.corpus.cases) throw Error('Drawing population differs from its case IDs')
  validateDrawingCoverage(run)
  const results = aggregateDrawingRows(run.rows, run.corpus.ids)
  const formats = [...new Set(run.plan ? run.plan.lanes.map((lane: any) => lane.format) : [...results.map(row => row.format), ...run.blocked.flatMap((row: any) => row.format.split('/'))])]
  const totals = Object.fromEntries(statuses.map(status => [status, results.reduce((sum: number, row: any) => sum + row.counts[status], 0)]))
  const { rows: _rows, state, startedAt, updatedAt: _updated, ...metadata } = run
  return { ...metadata, state, formats, collection: { ...Object.fromEntries(formats.map(format => [format, {}])), outputsRetained: false, startedAt, finishedAt: collectedAt(run) }, results, totals, updatedAt: collectedAt(run) }
}

function validateDrawingCoverage(run: any) {
  if (run.assessmentPolicy && !run.plan) throw Error('New Drawing assessment requires its campaign plan')
  if (run.plan) {
    if (JSON.stringify(run.plan.cases) !== JSON.stringify(run.corpus.ids)) throw Error('Drawing plan differs from corpus IDs')
    assertCampaignCoverage(run.plan, run.rows, run.blocked, 'drawing')
  } else if (!run.rows.length && !run.blocked.length) throw Error('Empty Drawing run has no accounted-for campaign')
}

if (import.meta.main) {
  const args = process.argv.slice(2), take = (flag: string) => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i + 1] }
  const base = take('--base'), run = take('--run'), formats = take('--formats')?.split(','), out = take('--out'), collected = take('--collected-at')
  if (!run || !out || (base && !formats?.length)) throw Error('merge-drawing-results [--base PUBLISHED.json --formats FORMATS] --run RUN_DIR --out FILE [--collected-at ISO_TIME]')
  if (existsSync(out)) throw Error('Choose a fresh output file')
  const recorded = JSON.parse(readFileSync(join(run, 'results.json'), 'utf8'))
  if (collected && recorded.updatedAt) throw Error('The run records its own collection time; --collected-at is only for runs that do not')
  if (collected) recorded.updatedAt = new Date(collected).toISOString()
  const merged = base ? mergeDrawingResults(JSON.parse(readFileSync(base, 'utf8')), recorded, formats!) : publishDrawingRun(recorded)
  writeFileSync(out, JSON.stringify(merged, null, 2) + '\n')
}
