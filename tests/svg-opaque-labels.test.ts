import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectQuantitativePaint } from '../fidelity/paint-values.ts'
import { inspectSourceFacts, mergePaintChecks } from '../fidelity/paint-facts.ts'
import { inspectChartFacts } from '../fidelity/paint-chart-facts.ts'
import { assessSvgCases, makeSvgCaseContract, makeSvgObservationBinding } from '../fidelity/svg-assessment.ts'
import { qualifyOutput } from '../unified/qualification.ts'
import { assessDocsDrawing, reviewedDocsCase } from '../unified/docs-drawings.ts'
import { reviewDocumentationSource } from '../unified/docs-source-review.ts'
import { recheckFeatureAdmission } from '../unified/recheck-rendering.ts'
import { observeBrowserTimingSvg } from '../unified/timing-browser.ts'
import { constructEvidenceVerdict, evidenceBytesDigest } from '../portable/evidence-contract.ts'
import type { BenchmarkObservation } from '../unified/types.ts'
import { chromiumExecutable } from './helpers/environment.ts'
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const input = { id: 'docs:opaque-label-control', family: 'flowchart', source: 'flowchart LR\nA-->B' }, review = reviewDocumentationSource(input), authored = reviewedDocsCase(input, review)
const workload = { ...input, features: [], provenance: 'Retained RS source686 fixture with offline glyph-only mutation', expectedLabels: ['A', 'B'] }
const fixture = readFileSync(new URL('./fixtures/fidelity/rs-outlined-labels.svg', import.meta.url), 'utf8')
async function inspect(svg: string) {
  const page = await browser.newPage()
  try {
    await page.setContent(svg)
    const paint = await page.evaluate(inspectFidelityPaint, { family: input.family, expected: authored.expected })
    const quantitative = await page.evaluate(inspectQuantitativePaint, { family: input.family, expected: authored.expected, labelRepresentation: paint.labelRepresentation })
    const facts = await page.evaluate(inspectSourceFacts, { ...input, expected: authored.expected, paint, quantitative })
    const charts = await page.evaluate(inspectChartFacts, { ...input, expected: authored.expected, paint, quantitative })
    const checks: PaintCheck[] = mergePaintChecks(paint.checks, quantitative, facts, charts)
    const admission = qualifyOutput(workload, svg, 'svg'), binding = makeSvgObservationBinding(authored, evidenceBytesDigest(svg), evidenceBytesDigest('independent fixture observer'))
    return { paint, checks, admission, binding }
  } finally { await page.close() }
}
test('retained actual outlines need an unqualified glyph observer, not a missing-label renderer fault', async () => {
  const { paint, checks, admission, binding } = await inspect(fixture)
  expect(admission).toMatchObject({ ok: false, unavailable: true })
  expect(paint.labelRepresentation).toBe('uninspectable')
  expect(paint.checks.find((check: PaintCheck) => check.criterion === 'visible-ink')?.status).toBe('passed')
  expect(checks.some(check => check.status === 'failed')).toBe(false)
  expect(checks.filter(check => check.criterion.startsWith('source-fact:')).length).toBeGreaterThan(0)
  expect(checks.filter(check => check.criterion.startsWith('source-fact:')).every(check => check.status === 'unavailable')).toBe(true)
  const rows: BenchmarkObservation[] = [{ suite: 'fidelity', surface: 'browser-public-api', runtime: 'fixture', family: input.family, caseId: input.id, operation: 'public-svg-admission', format: 'svg', mode: 'fixture', status: 'passed', metrics: { implementation: 'fixture/renderer', authoredCase: input.id, ...binding } }, ...checks.map(check => ({ suite: 'fidelity', surface: 'browser-owned-ink', runtime: 'fixture', family: input.family, caseId: input.id + ':' + check.criterion, operation: check.criterion, format: 'svg', mode: 'fixture', status: check.status === 'unavailable' ? 'blocked' as const : check.status, metrics: { implementation: 'fixture/renderer', authoredCase: input.id, ...binding } }))]
  rows.push({ ...rows[0]!, operation: 'standalone-svg-and-labels', status: 'passed' })
  const rechecked = recheckFeatureAdmission(authored, 'fixture/renderer', rows, fixture, 'returned', binding, '2026-10-31T00:00:00Z')
  expect(rechecked.find(row => row.operation === 'standalone-svg-and-labels')?.status).toBe('blocked')
  expect(assessSvgCases([authored], rechecked)[0]).toMatchObject({ status: 'unknown', evidence: { status: 'unknown' } })
  expect(assessDocsDrawing(input, review, 'passed', 'unavailable', checks, binding).status).toBe('unknown')
  const page = await browser.newPage()
  try {
    await page.setContent(fixture)
    const hidden = await page.evaluate(inspectFidelityPaint, { family: input.family, expected: { ...authored.expected, forbiddenLabels: ['Secret'] } })
    expect(hidden.checks.find((check: PaintCheck) => check.criterion === 'hidden-authored-content')?.status).toBe('unavailable')
    const contract = makeSvgCaseContract(authored), evidence = await observeBrowserTimingSvg(page, authored, contract, Buffer.from(fixture), binding.observerSha256)
    expect(constructEvidenceVerdict(contract, evidence).status).toBe('unknown')
    expect(evidence.checks.find(check => check.criterion === 'standalone-svg-and-labels')?.status).toBe('unknown')
  } finally { await page.close() }
})
test('image-only labels also stay unknown; recognized wrong and hidden DOM text still fail', async () => {
  const image = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><image width="200" height="70" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=="/></svg>'
  const opaque = await inspect(image)
  expect(opaque.admission.unavailable).toBe(true)
  expect(opaque.checks.some(check => check.status === 'failed')).toBe(false)
  for (const text of ['<text x="20" y="25">Wrong</text>', '<text display="none">A</text><text display="none">B</text>']) {
    const known = await inspect(fixture.replace('</svg>', text + '</svg>'))
    expect(known.paint.labelRepresentation).toBeUndefined()
    expect(known.paint.checks.find((check: PaintCheck) => check.criterion === 'visible-authored-labels')?.status).toBe('failed')
  }
  expect(qualifyOutput(workload, '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>', 'svg').unavailable).toBeUndefined()
  expect(qualifyOutput(workload, '<svg>', 'svg').unavailable).toBeUndefined()
})
