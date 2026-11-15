/** Fixed source-path slices over the unchanged reference-qualified population. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { FIDELITY_SCORED_AREAS, fidelityScoringDefinition, isScoredFidelityFile } from './mermaid-fidelity/scoring.ts'
export const fidelitySlicePolicy = 'upstream-source-path-slices-v1'
const slices = ['parser-model', 'rendering-layout', 'host-internals'] as const
export function fidelitySlice(file: string): typeof slices[number] {
  const path = file.replaceAll('\\', '/')
  if (/^packages\/parser\/tests\//.test(path) || /^packages\/mermaid\/src\/diagrams\/[^/]+\/parser\//.test(path) || /^packages\/mermaid\/src\/diagrams\/[^/]+\/(?:[^/]*(?:Db|DB|Ast|AST|Diagram)|[^/]*\.parser)\.(?:spec|test)\.[cm]?[jt]s$/.test(path)) return 'parser-model'
  if (/^packages\/mermaid-layout-|\/(?:rendering|rendering-util|renderer)\/|(?:Renderer|Layout|Sizing|svgDraw)\.(?:spec|test)\./.test(path)) return 'rendering-layout'
  return 'host-internals'
}
export function fidelityCoverage(run: any) {
  const reference = run.results?.find((r: any) => r.project === 'mermaid-js/mermaid')
  if (!reference?.cases?.length) throw Error('Coverage needs the raw run with reference callback outcomes')
  const population = reference.cases.filter((c: any) => c.status === 'passed').length
  if (!population) throw Error('No reference-qualified callbacks')
  const results = run.results.map((row: any) => {
    if (row.cases?.length !== reference.cases.length) throw Error('Candidate must account for every reference callback: ' + row.project)
    const counts = Object.fromEntries(slices.map(slice => [slice, { population: 0, passed: 0, failed: 0, unsupported: 0, unassessed: 0 }]))
    const scopes = { scored: { population: 0, passed: 0, failed: 0, unsupported: 0, unassessed: 0 }, inventory: { population: 0, passed: 0, failed: 0, unsupported: 0, unassessed: 0 } }
    const byFile = new Map<string, any>(), missing = new Map((row.missingFiles ?? []).map((f: any) => [f.path, f.reason]))
    reference.cases.forEach((control: any, index: number) => {
      const actual = row.cases[index]
      if (actual.file !== control.file || actual.name !== control.name) throw Error('Candidate callback ordinal differs from its reference')
      if (control.status !== 'passed') return
      const slice = fidelitySlice(control.file), group = counts[slice]!
      const status = actual.status === 'trident-blocked' ? 'unassessed' : actual.status
      if (!['passed', 'failed', 'unsupported', 'unassessed'].includes(status)) throw Error('Unknown disposition for a qualified callback: ' + status)
      const scope = scopes[isScoredFidelityFile(control.file) ? 'scored' : 'inventory']
      group.population++; group[status as 'passed' | 'failed' | 'unsupported' | 'unassessed']++
      scope.population++; scope[status as 'passed' | 'failed' | 'unsupported' | 'unassessed']++
      // An unsupported verdict is unassessed in scoring: list it with the gaps it may hide.
      if (status === 'unassessed' || status === 'unsupported') {
        if (!byFile.has(control.file)) byFile.set(control.file, { file: control.file, slice, inventory: !isScoredFidelityFile(control.file), unassessed: 0, unsupported: 0, notCollected: missing.has(control.file), reasons: {} })
        const entry = byFile.get(control.file), reason = (status === 'unsupported' ? 'Unsupported: ' : '') + (missing.get(control.file) ?? actual.reason ?? 'No qualified candidate observation')
        entry[status]++; entry.reasons[String(reason)] = (entry.reasons[String(reason)] ?? 0) + 1
      }
    })
    // Score bounds follow the scoring rule: unsupported verdicts are unassessed.
    const bounds = (c: { population: number; passed: number; unsupported: number; unassessed: number }) => {
      const p = c.population, open = c.unassessed + c.unsupported
      return { lowerScore: p ? 100 * c.passed / p : null, upperScore: p ? 100 * (c.passed + open) / p : null, assessedPercent: p ? 100 * (p - open) / p : null }
    }
    return { project: row.project, version: row.version, ...(row.sharedParserWith ? { sharedParserWith: row.sharedParserWith } : {}), scopes: Object.fromEntries(Object.entries(scopes).map(([scope, c]) => [scope, { ...c, ...bounds(c) }])), slices: slices.map(slice => {
      const c = counts[slice]!
      return { slice, ...c, ...bounds(c) }
    }), gaps: [...byFile.values()].sort((a, b) => b.unassessed + b.unsupported - a.unassessed - a.unsupported || a.file.localeCompare(b.file)) }
  })
  const scoredPopulation = reference.cases.filter((c: any) => c.status === 'passed' && isScoredFidelityFile(c.file)).length
  return { protocol: fidelitySlicePolicy, scoring: fidelityScoringDefinition, pin: run.pin, controlIdentity: run.controlIdentity, referenceQualifiedCallbacks: population, scoredPopulation, inventoryCallbacks: population - scoredPopulation, policy: `Slices are selected only by original source paths, independently of candidate outcomes. Parser/model includes packages/parser/tests, diagram parser folders and database/AST/diagram test files. Rendering/layout includes rendering folders, layout packages and renderer/layout/sizing/svgDraw test files. Remaining tests are host/internals. Every reference-qualified callback belongs to exactly one slice; no zero-observation pass or missing callback is removed. Separately, the scored population is the qualified callbacks under ${FIDELITY_SCORED_AREAS.join(' or ')}; the rest are inventory, executed and shown here but not scored. Score bounds count unsupported verdicts as unassessed.`, blocked: run.blocked ?? [], notApplicable: run.notApplicable ?? [], results }
}
export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) { console.log('fidelity:coverage --run RAW_FIDELITY_RUN --out FRESH_DIRECTORY\nRead recorded callbacks; show fixed parser/model, rendering/layout and host/internals slices with score bounds, assessed coverage and per-file gaps. Runs no tests.'); return }
  const opts = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) { if (!['--run', '--out'].includes(args[i]!) || !args[i + 1] || opts.has(args[i]!)) throw Error('Use fidelity:coverage --help'); opts.set(args[i]!, args[i + 1]!) }
  if (!opts.has('--run') || !opts.has('--out')) throw Error('Supply --run and --out')
  const out = resolve(opts.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  const report = fidelityCoverage(JSON.parse(readFileSync(join(resolve(opts.get('--run')!), 'results.json'), 'utf8')))
  mkdirSync(out, { recursive: true }); writeFileSync(join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n')
  const lines = ['# Fidelity coverage by source slice', '', report.policy, '', `Scored population: ${report.scoredPopulation} callbacks; inventory: ${report.inventoryCallbacks}.`, '', '| Project | Version | Slice | Population | Passed | Failed | Unsupported | Unassessed | Assessed % | Score bounds |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |']
  const cell = (c: any) => `${c.population} | ${c.passed} | ${c.failed} | ${c.unsupported} | ${c.unassessed} | ${c.assessedPercent === null ? 'n/a' : c.assessedPercent.toFixed(2)} | ${c.lowerScore === null ? 'n/a' : c.lowerScore.toFixed(2) + '–' + c.upperScore!.toFixed(2)}`
  for (const row of report.results) {
    for (const scope of ['scored', 'inventory']) lines.push(`| ${row.project} | ${row.version} | ${scope === 'scored' ? 'scored population' : 'inventory (not scored)'} | ${cell(row.scopes[scope])} |`)
    for (const c of row.slices) lines.push(`| ${row.project} | ${row.version} | ${c.slice} | ${cell(c)} |`)
  }
  writeFileSync(join(out, 'report.md'), lines.join('\n') + '\n')
}
if (import.meta.main) await main()
