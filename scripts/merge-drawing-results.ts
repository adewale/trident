// Replace the selected formats of a published Drawing Correctness result with a
// fresh drawing:correctness run over the same corpus and frozen catalog. Other
// formats keep their published rows. No renderer is invoked.
//
//   bun scripts/merge-drawing-results.ts --base PUBLISHED.json --run RUN_DIR --formats terminal --out FILE
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const statuses = ['correct', 'incorrect', 'renderer-failure', 'invalid-format', 'unknown', 'unrun'] as const

/** Per project/format counts, case lists and unknown reasons from raw rows. */
export function aggregateDrawingRows(rows: any[]) {
  const groups = new Map<string, any[]>()
  for (const row of rows) {
    const key = JSON.stringify([row.project, row.format])
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return [...groups.values()].map(group => {
    const versions = new Set(group.map(row => row.version))
    if (versions.size !== 1) throw Error('Mixed versions for ' + group[0].project + ' ' + group[0].format)
    const counts = Object.fromEntries(statuses.map(status => [status, 0])) as Record<string, number>
    const caseOutcomes = Object.fromEntries(statuses.map(status => [status, [] as string[]])) as Record<string, string[]>
    const assessmentGapReasons: Record<string, number> = {}
    for (const row of group) {
      if (!statuses.includes(row.status)) throw Error('Unknown drawing status ' + row.status)
      counts[row.status]!++
      caseOutcomes[row.status]!.push(row.caseId)
      if (row.status === 'unknown') for (const reason of row.format === 'svg' && row.unknown?.length ? row.unknown : [row.reason ?? 'Unassessed']) assessmentGapReasons[reason] = (assessmentGapReasons[reason] ?? 0) + 1
    }
    return { project: group[0].project, version: group[0].version, format: group[0].format, counts, caseOutcomes, assessmentGapReasons }
  })
}

export function mergeDrawingResults(base: any, run: any, formats: string[]) {
  if (run.state !== 'complete') throw Error('Drawing run is not complete')
  if (JSON.stringify(run.corpus.ids) !== JSON.stringify(base.corpus.ids)) throw Error('Drawing run must use the published corpus')
  if (run.versionsFrozenAt !== base.versionsFrozenAt) throw Error('Drawing run must use the published version freeze')
  const fresh = aggregateDrawingRows(run.rows.filter((row: any) => formats.includes(row.format)))
  for (const row of fresh) if (Object.values(row.counts as Record<string, number>).reduce((sum, value) => sum + value, 0) !== base.corpus.cases) throw Error(`${row.project} ${row.format} does not account for every case`)
  const results = [...base.results.filter((row: any) => !formats.includes(row.format)), ...fresh]
  const totals = Object.fromEntries(statuses.map(status => [status, results.reduce((sum: number, row: any) => sum + row.counts[status], 0)]))
  const blocked = [...base.blocked.filter((row: any) => !formats.some(format => String(row.format).includes(format))), ...run.blocked]
  return { ...base, results, totals, blocked, updatedAt: run.rows.length ? new Date().toISOString() : base.updatedAt, recollectedFormats: { formats, at: new Date().toISOString(), reason: 'Inadmissible outputs (empty text, error messages, source printed back, zero-size or error-placeholder SVG) are recorded as invalid-format nonpasses instead of observer gaps; every case of the selected formats was recollected with the same frozen artifacts.' } }
}

if (import.meta.main) {
  const args = process.argv.slice(2), take = (flag: string) => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i + 1] }
  const base = take('--base'), run = take('--run'), formats = take('--formats')?.split(','), out = take('--out')
  if (!base || !run || !formats?.length || !out) throw Error('merge-drawing-results --base PUBLISHED.json --run RUN_DIR --formats FORMATS --out FILE')
  if (existsSync(out)) throw Error('Choose a fresh output file')
  const merged = mergeDrawingResults(JSON.parse(readFileSync(base, 'utf8')), JSON.parse(readFileSync(join(run, 'results.json'), 'utf8')), formats)
  writeFileSync(out, JSON.stringify(merged, null, 2) + '\n')
}
