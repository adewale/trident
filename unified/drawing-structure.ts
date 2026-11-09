/** Assess actual retained drawings; no renderer or parser model supplies facts. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { readDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { assessSvgStructure, assessTerminalStructure, unavailableStructure, structureProfile, structureGraphFamilies, type StructureAssessment } from '../fidelity/drawing/structure.ts'
import { qualifyStructureObserver } from '../fidelity/drawing/structure-controls.ts'
import { fidelityHarnessSources } from './fidelity-control.ts'
import { planDigest } from './campaign-plan.ts'
import { atomicWrite } from './result-storage.ts'
import { defaultChromium } from './benchmark-context.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'

export function aggregateStructure(rows: (StructureAssessment & { project: string; version: string; format: string })[]) {
  const groups = new Map<string, any>()
  for (const row of rows) {
    const key = JSON.stringify([row.project, row.version, row.format])
    if (!groups.has(key)) groups.set(key, { project: row.project, version: row.version, format: row.format, topology: { passed: 0, failed: 0, unassessed: 0, 'not-applicable': 0 }, layout: { passed: 0, failed: 0, unassessed: 0, 'not-applicable': 0 } })
    const group = groups.get(key)
    for (const axis of ['topology', 'layout'] as const) group[axis][row[axis].status]++
  }
  return [...groups.values()].sort((a, b) => a.project.localeCompare(b.project) || a.format.localeCompare(b.format))
}
export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) { console.log('drawing:structure --run RETAINED_DRAWING_RUN --out FRESH_DIRECTORY [--projects IDS] [--case ID_FRAGMENT]\nReplay captured SVG/terminal drawings for qualified flowchart, class, state, ER and sequence topology; SVG quadrant point/caption box clearance and graph layout constraints. Other representations remain unassessed. No renderers, timing collection or overall-score changes.'); return }
  assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
  const opts = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) {
    if (!['--run', '--out', '--projects', '--case'].includes(args[i]!) || !args[i + 1] || opts.has(args[i]!)) throw Error('Use drawing:structure --help')
    opts.set(args[i]!, args[i + 1]!)
  }
  if (!opts.has('--run') || !opts.has('--out')) throw Error('Supply --run and --out')
  const root = resolve(opts.get('--run')!), out = resolve(opts.get('--out')!), run = JSON.parse(readFileSync(join(root, 'results.json'), 'utf8'))
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  if (run.state !== 'complete' || !run.outputs?.length || !run.rows?.length) throw Error('A complete retained Drawing run is required')
  const cases = drawingCases().filter(test => run.corpus.ids.includes(test.id))
  if (cases.length !== run.corpus.ids.length || planDigest(cases.map(test => ({ id: test.id, source: test.source, expected: test.expected, sourceGaps: test.sourceGaps }))) !== run.corpus.contractSha256) throw Error('Capture differs from the current independent source contracts')
  const key = (r: any) => JSON.stringify([r.project, r.format, r.caseId]), outputs = new Map<string, any>()
  for (const output of run.outputs) { if (outputs.has(key(output))) throw Error('Duplicate captured output'); outputs.set(key(output), output) }
  const seen = new Set<string>()
  for (const row of run.rows) { if (seen.has(key(row))) throw Error('Duplicate captured observation'); seen.add(key(row)) }
  const projects = opts.get('--projects')?.split(',')
  if (projects?.some(p => !run.rows.some((r: any) => r.project === p))) throw Error('Unknown captured project')
  const selected = run.rows.filter((r: any) => (!projects || projects.includes(r.project)) && (!opts.has('--case') || r.caseId.includes(opts.get('--case')!)))
  if (!selected.length) throw Error('No captured observations selected')
  mkdirSync(out, { recursive: true })
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) }), context = await browser.newContext({ javaScriptEnabled: false })
  await context.route('**/*', route => route.abort())
  const startedAt = new Date().toISOString(), rows: any[] = [], sources = fidelityHarnessSources(resolve(import.meta.dirname, '..'), ['unified/drawing-structure.ts'])
  let qualification: Awaited<ReturnType<typeof qualifyStructureObserver>>
  try {
    qualification = await qualifyStructureObserver(context)
    const save = (state: string) => atomicWrite(join(out, 'results.json'), JSON.stringify({ benchmark: 'Rendered structure', profile: structureProfile, state, startedAt, assessedAt: new Date().toISOString(), collection: { startedAt: run.startedAt, finishedAt: run.updatedAt }, sourceRun: root, corpus: run.corpus, selection: { projects: projects ?? 'all', case: opts.get('--case') ?? null }, method: { renderersInvoked: false, timingsCollected: false, qualifiedFamilies: structureGraphFamilies, additionalSvgLayoutFamilies: ['quadrant'], scope: 'Actual painted SVG routes, arrowheads, visibility and multiplicity; measured leaf-node box overlap, canvas clipping and explicitly required acyclic source order. Terminal source-owned family facts and explicit order. SVG quadrant point/caption and marker/text box clearance after visible point inventory and coordinates qualify. Other families and unsupported representations remain unassessed. Diagnostic axes do not alter the existing overall score.' }, observerSources: sources, runtime: { node: process.versions.node, bun: process.versions.bun, chromium: browser.version(), platform: process.platform }, qualification, rows, results: aggregateStructure(rows) }, null, 2) + '\n')
    for (const row of selected) {
      const test = cases.find(c => c.id === row.caseId)
      if (!test) throw Error('Unknown captured source')
      let assessment: StructureAssessment
      const output = outputs.get(key(row))
      if (['renderer-failure', 'invalid-format'].includes(row.status)) assessment = unavailableStructure(test, row.status + ': ' + (row.reason ?? ''), true)
      else if (row.status === 'unrun') assessment = unavailableStructure(test, 'Renderer was not run')
      else {
        if (!output) throw Error('Missing captured output: ' + key(row))
        const text = readDrawingOutput(root, output, test.source)
        if (row.format === 'terminal') assessment = assessTerminalStructure(test, text)
        else if (row.format === 'svg') {
          const page = await context.newPage()
          let timer: ReturnType<typeof setTimeout> | undefined
          try {
            await page.setContent('<!doctype html><style>body{margin:0}</style>' + text)
            assessment = await Promise.race([assessSvgStructure(test, page), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('Structural observer deadline exceeded')), 8000) })])
          } catch (error) { assessment = unavailableStructure(test, 'SVG structural observation unavailable: ' + String(error)) }
          finally { clearTimeout(timer); await page.close() }
        } else assessment = unavailableStructure(test, 'Unqualified output format')
      }
      rows.push({ project: row.project, version: row.version, format: row.format, caseId: row.caseId, producerStatus: row.status, ...(output ? { sourceSha256: output.sourceSha256, outputSha256: output.outputSha256 } : {}), ...assessment })
      if (rows.length % 100 === 0) { save('running'); console.log(rows.length + '/' + selected.length) }
    }
    if (JSON.stringify(sources) !== JSON.stringify(fidelityHarnessSources(resolve(import.meta.dirname, '..'), ['unified/drawing-structure.ts']))) throw Error('Observer source changed during replay')
    save('complete')
    const lines = ['# Rendered structure diagnostics', '', 'Counts are passed / failed / unassessed / not applicable. The profile covers flowchart, class, state, ER and sequence topology, plus SVG quadrant point/caption box clearance. Other families and representations remain explicit gaps. These axes do not change the existing overall score.', '', '| Project | Version | Format | Topology | Layout constraints |', '| --- | --- | --- | --- | --- |']
    const counts = (v: any) => ['passed', 'failed', 'unassessed', 'not-applicable'].map(s => v[s]).join(' / ')
    for (const row of aggregateStructure(rows)) lines.push(`| ${row.project} | ${row.version} | ${row.format} | ${counts(row.topology)} | ${counts(row.layout)} |`)
    writeFileSync(join(out, 'report.md'), lines.join('\n') + '\n')
  } finally { await context.close(); await browser.close() }
}
if (import.meta.main) await main()
