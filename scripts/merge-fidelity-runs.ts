// Merge mermaid:fidelity output directories that share one control run into the
// published Fidelity result file. No tests are executed.
//
//   bun scripts/merge-fidelity-runs.ts --out FILE --catalog FROZEN_CATALOG [--blocked REASONS.json] RUN_DIR...
//   bun scripts/merge-fidelity-runs.ts --out FILE --base PUBLISHED.json RUN_DIR...
//
// The first RUN_DIR must contain the Mermaid control; later directories must
// have been collected with --reuse-reference pointing at it (or contain it).
// With --base, only the projects in RUN_DIRs are replaced in a published result,
// and only when their control run is the one the published result was scored
// against (same pin, selection and reference outcome digest).
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/** Identity of one control run: every reference callback and its outcome. */
export function referenceDigest(reference: any) {
  if (!reference?.cases?.length) throw Error('The Mermaid control row has no per-callback outcomes')
  const lines = reference.cases.map((c: any) => `${c.file}\u0000${c.name}\u0000${c.status}`).sort()
  return createHash('sha256').update(lines.join('\n')).digest('hex')
}

/** File completion order can vary; callback ordinals within a file identify
 * repeated titles and must retain the same reference qualification. */
function referenceFiles(reference: any) {
  const files = new Map<string, any[]>()
  for (const c of reference.cases) {
    const callbacks = files.get(c.file) ?? []
    callbacks.push([c.name, c.status])
    files.set(c.file, callbacks)
  }
  return JSON.stringify([...files].sort(([a], [b]) => a.localeCompare(b)))
}

/** Replace the re-run projects of a published result; every other row is kept unchanged. */
export function mergeIntoPublished(published: any, runs: any[], extras: { catalog?: any } = {}) {
  if (!published.referenceDigest) throw Error('The published result records no control digest; merge a full campaign first')
  const fresh: any = mergeFidelityRuns(runs, extras)
  for (const key of ['pin', 'selection', 'selectedFiles', 'referenceVersion', 'expandedCallbacks', 'referenceQualifiedCallbacks', 'referenceDigest'])
    if (JSON.stringify(fresh[key]) !== JSON.stringify(published[key])) throw Error(`Re-run differs from the published result in ${key}; re-run against the published control`)
  const replaced = new Set(fresh.results.map((r: any) => r.project).concat(fresh.blocked.map((r: any) => r.project)).filter((p: string) => p !== "mermaid-js/mermaid"))
  const keep = (row: any) => !replaced.has(row.project)
  const order = published.results.map((r: any) => r.project)
  const results = [...published.results.filter(keep), ...fresh.results.filter((r: any) => r.project !== 'mermaid-js/mermaid')].sort((a: any, b: any) => (order.indexOf(a.project) + 1 || Infinity) - (order.indexOf(b.project) + 1 || Infinity))
  return {
    ...published,
    blocked: [...published.blocked.filter(keep), ...fresh.blocked],
    results,
    updatedAt: [published.updatedAt, fresh.updatedAt].sort().at(-1),
    collectedThrough: [published.collectedThrough, fresh.collectedThrough].sort().at(-1),
    partialReruns: [...(published.partialReruns ?? []), { projects: [...replaced].sort(), collectedThrough: fresh.collectedThrough }],
  }
}

export function mergeFidelityRuns(runs: any[], extras: { catalog?: any; blocked?: any[] } = {}) {
  if (!runs.length) throw Error('Supply at least one Fidelity run')
  const base = runs[0]
  for (const run of runs) if (run.pin !== base.pin || run.selectedFiles !== base.selectedFiles || run.selection !== base.selection) throw Error('Fidelity runs must share one pin and file selection')
  const reference = base.results.find((row: any) => row.project === 'mermaid-js/mermaid')
  if (!reference) throw Error('Merged Fidelity runs have no Mermaid control')
  const digest = referenceDigest(reference)
  const files = referenceFiles(reference)
  const byProject = new Map<string, any>()
  for (const run of runs) {
    const control = run.results.find((row: any) => row.project === 'mermaid-js/mermaid')
    if (!control || control.version !== reference.version || referenceDigest(control) !== digest) throw Error('Fidelity runs must share one referenceDigest and reference version')
    if (referenceFiles(control) !== files) throw Error('Fidelity runs must preserve reference callback order within each file')
    for (const row of run.results) {
      if (byProject.has(row.project)) {
        if (row.project !== 'mermaid-js/mermaid') throw Error('Duplicate Fidelity candidate ' + row.project)
        continue
      }
      byProject.set(row.project, { row, control })
    }
  }
  const qualified = reference.cases.filter((c: any) => c.status === 'passed').length
  const statuses = ['passed', 'failed', 'unsupported', 'trident-blocked', 'reference-unqualified', 'upstream-skipped', 'upstream-expected-failure']
  const results = [...byProject.values()].map(({ row, control: ownReference }) => {
    if (row.cases?.length !== ownReference.cases.length) throw Error(row.project + ' must account for every reference callback')
    const counts: Record<string, number> = Object.fromEntries(statuses.map(status => [status, 0]))
    const perFile = new Map<string, Record<string, number>>(), gapReasons: Record<string, number> = {}
    for (const [index, c] of row.cases.entries()) {
      const control = ownReference.cases[index]
      if (c.file !== control.file || c.name !== control.name || !statuses.includes(c.status) || (control.status === 'passed' ? !statuses.slice(0, 4).includes(c.status) : c.status !== control.status)) throw Error(row.project + ' differs from its reference callback population')
      counts[c.status]!++
      const fileCounts = perFile.get(c.file) ?? {}
      fileCounts[c.status] = (fileCounts[c.status] ?? 0) + 1
      perFile.set(c.file, fileCounts)
      if (c.status === 'trident-blocked' && c.reason) {
        const reason = String(c.reason).split('\n')[0]!.replace(/\d+/g, 'N').slice(0, 160)
        gapReasons[reason] = (gapReasons[reason] ?? 0) + 1
      }
    }
    return { project: row.project, version: row.version, counts, missingFiles: row.missingFiles, perFile: [...perFile].map(([path, counts]) => ({ path, counts })), gapReasons }
  })
  // A candidate with no assessable callback has no working operation binding:
  // report it as unassessed with its dominant gap, not as a measured zero.
  const unbound = results.filter(r => r.project !== 'mermaid-js/mermaid' && r.counts.passed! + r.counts.failed! + r.counts.unsupported! === 0)
  const scored = results.filter(r => !unbound.includes(r))
  const measured = new Set(scored.map(r => r.project))
  const dominant = (r: any) => Object.entries(r.gapReasons as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'no callback reached a candidate operation'
  const blocked = [...unbound.map(r => ({ project: r.project, reason: 'No original test reached a candidate operation: ' + dominant(r) })), ...runs.flatMap(run => run.blocked ?? []), ...(extras.blocked ?? [])].filter((row, index, all) => !measured.has(row.project) && all.findIndex(other => other.project === row.project) === index)
  const expanded = reference.cases.length
  return {
    benchmark: 'Mermaid Fidelity',
    pin: base.pin,
    selection: base.selection,
    inventory: base.inventory,
    selectedFiles: base.selectedFiles,
    outsideSelectedRunner: base.outsideSelectedRunner,
    blocked,
    versionsFrozenAt: extras.catalog?.benchmarkVersionsCheckedAt ?? base.versionsFrozenAt,
    scope: `Every candidate attempted all ${base.selectedFiles} selected core-package files against one shared Mermaid ${reference.version} control run. Scores use the ${qualified} expanded callbacks the control passes.`,
    referenceVersion: reference.version,
    expandedCallbacks: expanded,
    referenceQualifiedCallbacks: qualified,
    referenceDigest: digest,
    results: scored,
    updatedAt: runs.map(run => run.updatedAt).sort().at(-1),
    collectedThrough: runs.map(run => run.collectedThrough).sort().at(-1),
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2), take = (flag: string) => { const i = args.indexOf(flag); if (i < 0) return undefined; const [, value] = args.splice(i, 2); return value }
  const out = take('--out'), catalogFile = take('--catalog'), blockedFile = take('--blocked'), baseFile = take('--base')
  if (!out || !args.length) throw Error('merge-fidelity-runs --out FILE [--catalog FROZEN_CATALOG] [--blocked UNMEASURED_REASONS.json] [--base PUBLISHED.json] RUN_DIR...')
  if (existsSync(out) && out !== baseFile) throw Error('Choose a fresh output file')
  const runs = args.map(dir => JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8')))
  const catalog = catalogFile ? JSON.parse(readFileSync(catalogFile, 'utf8')) : undefined
  const blocked = blockedFile ? JSON.parse(readFileSync(blockedFile, 'utf8')) : undefined
  const merged = baseFile ? mergeIntoPublished(JSON.parse(readFileSync(baseFile, 'utf8')), runs, { catalog }) : mergeFidelityRuns(runs, { catalog, blocked })
  writeFileSync(out, JSON.stringify(merged, null, 2) + '\n')
}
