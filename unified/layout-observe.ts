/** Observe retained Drawing SVGs; no renderer, parser bridge or reference call. */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium, type BrowserContext } from 'playwright'
import { drawingCases, type DrawingCase } from '../fidelity/drawing/corpus.ts'
import { readDrawingOutput, type RetainedDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { observeSvgLayout, unavailableLayout, type LayoutObservation } from '../fidelity/drawing/layout-svg.ts'
import { layoutMetrics, layoutPolicy } from '../fidelity/drawing/layout-geometry.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { planDigest } from './campaign-plan.ts'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import { atomicWrite, reserveResultDirectory } from './result-storage.ts'
import { svgTextValidity } from './davebench-validity.ts'

export interface LayoutRow { project: string; version: string; caseId: string; sourceSha256: string; outputSha256: string | null; observation: LayoutObservation }

/** Totals use exactly the same assessed case IDs for every selected project,
 * independently per metric. Availability itself never earns a quality score. */
export function summarizeLayouts(rows: LayoutRow[]) {
  const projects = [...new Set(rows.map(row => row.project))].sort(), caseIds = [...new Set(rows.map(row => row.caseId))].sort()
  return layoutMetrics.map(metric => {
    const common = caseIds.filter(caseId => projects.every(project => rows.some(row => row.project === project && row.caseId === caseId && row.observation.metrics[metric].status === 'assessed')))
    return { metric, commonCaseIds: common, projects: projects.map(project => {
      const own = rows.filter(row => row.project === project)
      return { project, version: own[0]!.version, assessed: own.filter(row => row.observation.metrics[metric].status === 'assessed').length, total: own.length, commonCases: common.length, count: common.length ? own.filter(row => common.includes(row.caseId)).reduce((sum, row) => sum + row.observation.metrics[metric].value!, 0) : null }
    }) }
  })
}
export function layoutMarkdown(rows: LayoutRow[], summaries = summarizeLayouts(rows)) {
  const escape = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ')
  const lines = ['# Flowchart SVG layout observations', '', 'Raw geometry measurements, not correctness verdicts or an overall quality ranking. Each metric compares the same assessed cases across every selected project. Counts of zero apply only to measured geometry; unassessed cases remain explicit.', '', 'Observer policy: `' + layoutPolicy.id + '`.', '', layoutPolicy.scope, '', 'Crossings are transverse contacts between different edge centerlines; shared endpoints and tangencies are excluded. Shared and crowded parallel paths count edge pairs. Other overlap metrics count object pairs. Endpoint-node intersections exclude only the first/last ' + layoutPolicy.endpointAllowance + ' pixels of the route at the corresponding node. Parallel sections need at least ' + layoutPolicy.parallelSpan + ' pixels of projected span and a gap below ' + layoutPolicy.parallelGap + ' pixels; shared-node terminal fans are exempt. Group containment and ordinary edge/frame crossings are allowed. Label overlaps concern text layout bounds, not pixel-level occlusion. Curves and node contours use bounded sampling; differences below the published tolerance are unresolved.', '', '| Metric | Project | Version | Assessed / selected | Common cases | Count on common cases |', '| --- | --- | --- | --- | --- | --- |']
  for (const summary of summaries) for (const p of summary.projects) lines.push(`| ${summary.metric} | ${escape(p.project)} | ${escape(p.version)} | ${p.assessed} / ${p.total} | ${p.commonCases} | ${p.count ?? 'unassessed'} |`)
  lines.push('', 'Per-case contours, route samples, collision locations, observed partial counts and gap reasons are retained in `results.json`. Per-metric common case IDs are listed there. Compare the same observer policy, viewport and case selection; a lower count alone does not establish better semantics or a universally better layout.', '')
  return lines.join('\n')
}

export async function observeLayoutRun(run: any, root: string, context: BrowserContext, options: { projects?: string[]; cases?: DrawingCase[]; onProgress?: (completed: number, total: number) => void } = {}): Promise<LayoutRow[]> {
  if (run.state !== 'complete' || !Array.isArray(run.rows) || !Array.isArray(run.outputs) || !Array.isArray(run.corpus?.ids)) throw Error('Layout observation requires a completed raw Drawing run with retained outputs')
  const cases = (options.cases ?? drawingCases()).filter(test => run.corpus.ids.includes(test.id))
  if (cases.length !== run.corpus.ids.length || planDigest(cases.map(({ id, source, expected, sourceGaps }) => ({ id, source, expected, sourceGaps }))) !== run.corpus.contractSha256) throw Error('Retained source contract differs from current Drawing corpus')
  const key = (row: { project: string; caseId: string; format: string }) => JSON.stringify([row.project, row.caseId, row.format])
  const outputs = new Map<string, RetainedDrawingOutput>()
  for (const record of run.outputs) {
    if (outputs.has(key(record))) throw Error('Duplicate retained output')
    outputs.set(key(record), record)
  }
  const selected = cases.filter(test => test.family === 'flowchart'), rows: LayoutRow[] = [], seen = new Set<string>()
  const candidates = run.rows.filter((row: any) => row.format === 'svg' && (!options.projects || options.projects.includes(row.project)))
  const projects = [...new Set<string>(candidates.map((row: any) => row.project))]
  if (!projects.length || !selected.length || options.projects?.some(project => !projects.includes(project))) throw Error('Selection has no retained SVG lane, flowchart cases, or a requested project is absent')
  const versions = new Map<string, string>()
  for (const row of candidates) {
    if (seen.has(key(row))) throw Error('Duplicate Drawing row')
    seen.add(key(row))
    if (!cases.some(test => test.id === row.caseId)) throw Error('Unknown Drawing case')
    if (versions.has(row.project) && versions.get(row.project) !== row.version) throw Error('Mixed project versions')
    versions.set(row.project, row.version)
  }
  for (const project of projects) for (const test of selected) {
    const row = candidates.find((row: any) => row.project === project && row.caseId === test.id)
    const record = outputs.get(key({ project, caseId: test.id, format: 'svg' }))
    let observation: LayoutObservation
    if (!row || ['unrun', 'renderer-failure', 'invalid-format'].includes(row.status)) observation = unavailableLayout('Drawing output unavailable: ' + (row?.status ?? 'missing row'), test)
    else {
      if (!record) throw Error('Missing retained SVG binding: ' + project + ' ' + test.id)
      // Binding failures abort rather than being disguised as observer gaps.
      const text = readDrawingOutput(root, record, test.source)
      const admission = svgTextValidity(text, test.source)
      if (!admission.valid) observation = unavailableLayout('Invalid SVG: ' + admission.reason, test)
      else {
        const page = await context.newPage()
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
          await page.setContent('<!doctype html><style>body{margin:0}</style>' + text, { timeout: 8000 })
          observation = await Promise.race([observeSvgLayout(page, test), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('Layout observer deadline exceeded')), 8000) })])
        } catch (error) { observation = unavailableLayout('Layout observer could not assess SVG: ' + String(error), test) }
        finally { clearTimeout(timer); await page.close() }
      }
    }
    rows.push({ project, version: versions.get(project)!, caseId: test.id, sourceSha256: evidenceBytesDigest(test.source), outputSha256: record?.outputSha256 ?? null, observation })
    options.onProgress?.(rows.length, projects.length * selected.length)
  }
  return rows
}

if (import.meta.main) {
  const usage = 'layout:observe --run RAW_DRAWING_DIRECTORY --out FRESH_DIRECTORY [--projects ID,ID]\nObserve flowchart SVGs from retained Drawing outputs. No renderer calls, no oracle, no timing or quality score. Writes results.json and observations.md.'
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') { console.log(usage) }
  else {
    const options = new Map<string, string>()
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i]!, value = args[i + 1]
      if (!['--run', '--out', '--projects'].includes(key) || !value || value.startsWith('--') || options.has(key)) throw Error(usage)
      options.set(key, value)
    }
    if (!options.has('--run') || !options.has('--out')) throw Error(usage)
    const root = resolve(options.get('--run')!), destination = resolve(options.get('--out')!)
    const input = readFileSync(join(root, 'results.json'), 'utf8'), run = JSON.parse(input)
    reserveResultDirectory(destination)
    const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
    const viewport = { width: 1600, height: 1200 }, context = await browser.newContext({ javaScriptEnabled: false, viewport, deviceScaleFactor: 1, serviceWorkers: 'block' })
    await context.route('**/*', route => route.abort())
    try {
      const rows = await observeLayoutRun(run, root, context, { projects: options.get('--projects')?.split(','), onProgress: (completed, total) => { if (completed % 25 === 0) console.log('Layout observations: ' + completed + '/' + total) } })
      const sources = Object.fromEntries(['../fidelity/drawing/layout-geometry.ts', '../fidelity/drawing/layout-svg.ts', '../fidelity/paint.ts', 'layout-observe.ts'].map(path => [path, evidenceBytesDigest(readFileSync(new URL(path, import.meta.url)))]))
      const report = { schema: 'trident-layout-observations-v1', observedAt: new Date().toISOString(), renderersInvoked: false, policy: layoutPolicy, observerSha256: evidenceDigest({ sources, policy: layoutPolicy }), sources, sourceRunSha256: evidenceBytesDigest(input), corpus: run.corpus, viewport, browser: executableIdentity(defaultChromium(chromium)), summaries: summarizeLayouts(rows), rows }
      atomicWrite(join(destination, 'results.json'), JSON.stringify(report, null, 2) + '\n')
      atomicWrite(join(destination, 'observations.md'), layoutMarkdown(rows, report.summaries))
      console.log('Observed ' + rows.length + ' retained flowchart SVG rows: ' + destination)
    } finally { await context.close(); await browser.close() }
  }
}
