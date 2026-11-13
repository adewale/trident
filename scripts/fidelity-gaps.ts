// Remaining Trident gaps in a published Mermaid Fidelity result, grouped by cause.
// No tests are executed.
//
//   bun scripts/fidelity-gaps.ts RESULT.json                  # every project, by cause
//   bun scripts/fidelity-gaps.ts RESULT.json --cause PATTERN  # projects whose gaps match
//   bun scripts/fidelity-gaps.ts RESULT.json --cause PATTERN --projects
//       prints a comma-separated list for mermaid:fidelity --projects
//
// A change that removes one cause affects only the projects with gaps of that cause, so
// they are the only ones to re-run (and merge with merge-fidelity-runs --base).
import { readFileSync } from 'node:fs'

export const GAP_CAUSES: [name: string, pattern: RegExp][] = [
  ['Langium AST view', /Langium AST|AST field|Native AST type/],
  ['Layout data (getData)', /getData/],
  ['Host configuration', /configuration/i],
  ['No parser binding', /no synchronous|adapter is unavailable|asynchronous|No native parser export/i],
  ['Unmapped field of a returned model', /Native IR schema|Unmapped native|schema projection failed|\.db\.\w+|^\w+( member)?\.\w+$|vertex\.|edge\.|class\.|entity\.|subgraph\./],
  ['Mermaid value the test imports', /Unavailable imported value/],
  ['Bridge failure', /Parser bridge failed/],
  ['Unclassified parser refusal', /Unclassified native parser/],
  ['Reaches no candidate operation', /No candidate operation was exercised/],
]

export const gapCause = (reason: string) => GAP_CAUSES.find(([, pattern]) => pattern.test(reason))?.[0] ?? 'Other'

/** Unassessed callbacks per project and cause, from each row's gapReasons. */
export function gapsByCause(result: any) {
  const table: Record<string, Record<string, number>> = {}
  for (const row of result.results) {
    if (row.project === 'mermaid-js/mermaid') continue
    const causes: Record<string, number> = {}
    for (const [reason, count] of Object.entries(row.gapReasons ?? {}) as [string, number][]) { const cause = gapCause(reason); causes[cause] = (causes[cause] ?? 0) + count }
    table[row.project] = causes
  }
  return table
}

if (import.meta.main) {
  const [file, ...args] = process.argv.slice(2)
  if (!file) throw Error('fidelity-gaps RESULT.json [--cause PATTERN [--projects]]')
  const table = gapsByCause(JSON.parse(readFileSync(file, 'utf8')))
  const cause = args.includes('--cause') ? new RegExp(args[args.indexOf('--cause') + 1]!, 'i') : undefined
  if (cause) {
    const hits = Object.entries(table)
      .map(([project, causes]) => [project, Object.entries(causes).filter(([name]) => cause.test(name)).reduce((sum, [, n]) => sum + n, 0)] as const)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
    if (args.includes('--projects')) console.log(hits.map(([project]) => project).join(','))
    else for (const [project, n] of hits) console.log(String(n).padStart(6), project)
  } else {
    const names = [...new Set(Object.values(table).flatMap(causes => Object.keys(causes)))]
    for (const [project, causes, total] of Object.entries(table).map(([project, causes]) => [project, causes, Object.values(causes).reduce((sum, n) => sum + n, 0)] as const).sort((a, b) => b[2] - a[2])) {
      console.log(`${String(total).padStart(6)} ${project}: ${names.filter(name => causes[name]).map(name => `${name} ${causes[name]}`).join(', ')}`)
    }
  }
}
