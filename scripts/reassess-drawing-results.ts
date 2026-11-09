/** Reassess retained drawings with the current observer; invoke no renderer. */
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { assessSvgLabels, assessTerminalLabels, expectsEmptyDrawing, labelPolicy } from '../fidelity/drawing/labels.ts'
import { drawingAssessmentProfiles, drawingObserverSources, verifyDrawingObserver } from '../fidelity/drawing/observer-contract.ts'
import { readDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { planDigest } from '../unified/campaign-plan.ts'
import { qualifyOutputFormat } from '../unified/qualification.ts'
import { svgTextValidity, terminalTextValidity } from '../unified/davebench-validity.ts'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { atomicWrite } from '../unified/result-storage.ts'

export async function reassessDrawingRun(run: any, root: string, formats: string[], context?: any) {
  if (run.state !== 'complete' || !Array.isArray(run.rows) || !run.outputs?.length) throw Error('Reassessment needs a completed raw run with retained outputs; recollect older runs without outputs')
  const cases = drawingCases().filter(test => run.corpus.ids.includes(test.id))
  if (cases.length !== run.corpus.ids.length || planDigest(cases.map(test => ({ id: test.id, source: test.source, expected: test.expected, sourceGaps: test.sourceGaps }))) !== run.corpus.contractSha256) throw Error('Retained run differs from the current reviewed source contract')
  const outputs = new Map<string, any>()
  const key = (row: any) => JSON.stringify([row.project, row.caseId, row.format])
  for (const record of run.outputs) {
    if (outputs.has(key(record))) throw Error('Duplicate retained drawing output')
    outputs.set(key(record), record)
  }
  const observerChecks: Record<string, unknown> = { ...run.observerChecks }
  for (const format of formats) observerChecks[format] = await verifyDrawingObserver(format, context)
  const rows = []
  for (const row of run.rows) {
    if (!formats.includes(row.format) || ['renderer-failure', 'unrun'].includes(row.status)) { rows.push(row); continue }
    const test = cases.find(test => test.id === row.caseId)!, record = outputs.get(key(row))
    if (!test || !record) throw Error('Missing retained drawing output: ' + key(row))
    const text = readDrawingOutput(root, record, test.source)
    const empty = expectsEmptyDrawing(test), format = empty && row.format === 'svg' ? qualifyOutputFormat(text, 'svg') : undefined
    const admission = row.format === 'svg' ? format ? { valid: format.ok, reason: format.findings.join('; ') } : svgTextValidity(text, test.source) : empty ? { valid: true, reason: '' } : terminalTextValidity(text, test.source)
    let verdict
    if (!admission.valid) verdict = { status: 'invalid-format', reason: 'Inadmissible ' + row.format + ' output: ' + admission.reason }
    else if (row.format === 'terminal') verdict = assessTerminalLabels(test, text)
    else {
      const page = await context.newPage()
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        await page.setContent('<!doctype html><style>body{margin:0}</style>' + text)
        verdict = await Promise.race([assessSvgLabels(test, page, text), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('SVG observer deadline exceeded')), 8000) })])
      } catch (error) { verdict = { status: 'unknown', reason: 'SVG observer could not assess retained output: ' + String(error) } }
      finally { clearTimeout(timer); await page.close() }
    }
    const { status: _status, reason: _reason, failed: _failed, leaked: _leaked, evidence: _evidence, ...identity } = row
    rows.push({ ...identity, status: verdict.status, reason: verdict.reason, evidence: 'evidence' in verdict ? verdict.evidence : undefined, failed: 'missing' in verdict ? verdict.missing : undefined, leaked: 'leaked' in verdict ? verdict.leaked : undefined })
  }
  const assessmentPolicies = Object.fromEntries([...new Set<string>(run.rows.map((row: any) => row.format))].map(format => [format, formats.includes(format) ? labelPolicy : run.assessmentPolicies?.[format] ?? run.assessmentPolicy]))
  const policies = Object.values(assessmentPolicies), common = policies.length && policies.every(policy => policy === policies[0]) ? policies[0] : undefined
  const { assessmentPolicy: _priorPolicy, ...metadata } = run
  return { ...metadata, ...(common ? { assessmentPolicy: common } : {}), assessmentPolicies, rows, assessmentProfiles: { ...run.assessmentProfiles, ...drawingAssessmentProfiles(formats) }, observerSources: { ...run.observerSources, ...drawingObserverSources(formats) }, observerChecks, reassessedAt: new Date().toISOString(), reassessment: { sourceRun: root, scope: formats, renderersInvoked: false } }
}
if (import.meta.main) {
  const [input, destination, selection = 'svg,terminal'] = process.argv.slice(2)
  if (!input || !destination || existsSync(destination)) throw Error('reassess-drawing-results RAW_RUN FRESH_OUTPUT [svg,terminal]')
  const formats = selection.split(',')
  if (formats.some(format => !['svg', 'terminal'].includes(format))) throw Error('Unsupported drawing format')
  const root = resolve(input), run = JSON.parse(readFileSync(join(root, 'results.json'), 'utf8'))
  const browser = formats.includes('svg') ? await chromium.launch({ headless: true, executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium) }) : undefined
  const context = await browser?.newContext({ javaScriptEnabled: false })
  await context?.route('**/*', route => route.abort())
  try {
    const result = await reassessDrawingRun(run, root, formats, context)
    mkdirSync(destination, { recursive: true }); cpSync(join(root, 'outputs'), join(destination, 'outputs'), { recursive: true })
    atomicWrite(join(destination, 'results.json'), JSON.stringify(result, null, 2) + '\n')
  } finally { await context?.close(); await browser?.close() }
}
