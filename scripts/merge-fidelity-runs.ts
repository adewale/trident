// Merge mermaid:fidelity output directories that share one control run into the
// published Fidelity result file. No tests are executed.
//
//   bun scripts/merge-fidelity-runs.ts --out FILE --catalog FROZEN_CATALOG [--blocked REASONS.json] RUN_DIR...
//
// The first RUN_DIR must contain the Mermaid control; later directories must
// have been collected with --reuse-reference pointing at it (or contain it).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export function mergeFidelityRuns(runs: any[], extras: { catalog?: any; blocked?: any[] } = {}) {
  if (!runs.length) throw Error('Supply at least one Fidelity run')
  const base = runs[0]
  for (const run of runs) if (run.pin !== base.pin || run.selectedFiles !== base.selectedFiles || run.selection !== base.selection) throw Error('Fidelity runs must share one pin and file selection')
  const byProject = new Map<string, any>()
  for (const run of runs) for (const row of run.results) {
    if (byProject.has(row.project)) {
      if (row.project !== 'mermaid-js/mermaid') throw Error('Duplicate Fidelity candidate ' + row.project)
      continue
    }
    byProject.set(row.project, row)
  }
  const reference = byProject.get('mermaid-js/mermaid')
  if (!reference) throw Error('Merged Fidelity runs have no Mermaid control')
  const qualified = reference.counts.passed
  const results = [...byProject.values()].map(row => {
    const perFile = new Map<string, Record<string, number>>(), gapReasons: Record<string, number> = {}
    for (const c of row.cases ?? []) {
      const counts = perFile.get(c.file) ?? {}
      counts[c.status] = (counts[c.status] ?? 0) + 1
      perFile.set(c.file, counts)
      if (c.status === 'trident-blocked' && c.reason) {
        const reason = String(c.reason).split('\n')[0]!.replace(/\d+/g, 'N').slice(0, 160)
        gapReasons[reason] = (gapReasons[reason] ?? 0) + 1
      }
    }
    const accounted = row.counts.passed + row.counts.failed + row.counts.unsupported + row.counts['trident-blocked']
    if (accounted !== qualified) throw Error(`${row.project} accounts for ${accounted} callbacks, not the ${qualified} the control qualifies`)
    return { project: row.project, version: row.version, counts: row.counts, missingFiles: row.missingFiles, perFile: [...perFile].map(([path, counts]) => ({ path, counts })), gapReasons }
  })
  // A candidate with no assessable callback has no working operation binding:
  // report it as unassessed with its dominant gap, not as a measured zero.
  const unbound = results.filter(r => r.project !== 'mermaid-js/mermaid' && r.counts.passed + r.counts.failed + r.counts.unsupported === 0)
  const scored = results.filter(r => !unbound.includes(r))
  const measured = new Set(scored.map(r => r.project))
  const dominant = (r: any) => Object.entries(r.gapReasons as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'no callback reached a candidate operation'
  const blocked = [...unbound.map(r => ({ project: r.project, reason: 'No original test reached a candidate operation: ' + dominant(r) })), ...runs.flatMap(run => run.blocked ?? []), ...(extras.blocked ?? [])].filter((row, index, all) => !measured.has(row.project) && all.findIndex(other => other.project === row.project) === index)
  const expanded = Object.values(reference.counts as Record<string, number>).reduce((sum, value) => sum + value, 0)
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
    results: scored,
    updatedAt: runs.map(run => run.updatedAt).sort().at(-1),
    collectedThrough: runs.map(run => run.collectedThrough).sort().at(-1),
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2), take = (flag: string) => { const i = args.indexOf(flag); if (i < 0) return undefined; const [, value] = args.splice(i, 2); return value }
  const out = take('--out'), catalogFile = take('--catalog'), blockedFile = take('--blocked')
  if (!out || !args.length) throw Error('merge-fidelity-runs --out FILE [--catalog FROZEN_CATALOG] [--blocked UNMEASURED_REASONS.json] RUN_DIR...')
  if (existsSync(out)) throw Error('Choose a fresh output file')
  const runs = args.map(dir => JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8')))
  const catalog = catalogFile ? JSON.parse(readFileSync(catalogFile, 'utf8')) : undefined
  const blocked = blockedFile ? JSON.parse(readFileSync(blockedFile, 'utf8')) : undefined
  writeFileSync(out, JSON.stringify(mergeFidelityRuns(runs, { catalog, blocked }), null, 2) + '\n')
}
