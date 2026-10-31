import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import type { PaintCheck, PaintEvidence } from '../fidelity/paint.ts'
import { chromiumExecutable } from './helpers/environment.ts'

let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const manifest = JSON.parse(readFileSync(new URL('./fixtures/graph-families/provenance.json', import.meta.url), 'utf8'))
const status = (paint: PaintEvidence, criterion: string) => paint.checks.find((check: PaintCheck) => check.criterion === criterion)?.status
const fixture = (name: string) => readFileSync(new URL('./fixtures/graph-families/' + name, import.meta.url), 'utf8')
async function inspect(name: string, id: string, mutate?: (page: any) => Promise<void>) {
  const testCase = expandedFidelityCases().find(testCase => testCase.id === id)!, page = await browser.newPage()
  try {
    await page.setContent(fixture(name)); if (mutate) await mutate(page)
    return await inspectSvgDrawing(page, { family: testCase.family, expected: testCase.expected, source: testCase.source })
  } finally { await page.close() }
}

test('retained graph integration bytes and their independent literal source remain immutable', () => {
  const sha = (value: string) => createHash('sha256').update(value).digest('hex')
  for (const retained of manifest.retained) {
    expect(sha(fixture(retained.file))).toBe(retained.svgSha256)
    expect(sha(expandedFidelityCases().find(testCase => testCase.id === retained.caseId)!.source)).toBe(retained.sourceSha256)
    expect(retained.mutation).toBe('none')
  }
})

for (const renderer of ['mermaid', 'pele']) {
  test(renderer + ' retained state discs and multi-layer final rings survive the integrated route reinspection', async () => {
    const result = await inspect(renderer + '-state-pseudostates.svg', 'features:state:initial-final-pseudostates')
    for (const criterion of ['painted-node-ownership', 'painted-relationships', 'source-fact:pseudostates', 'source-fact:state-kinds', 'painted-route-visibility']) expect(status(result, criterion)).toBe('passed')
    const wrong = await inspect(renderer + '-state-pseudostates.svg', 'features:state:initial-final-pseudostates', page => page.evaluate(() => {
      for (const element of document.querySelectorAll('circle,ellipse,path')) {
        if (element.closest('defs,marker,clipPath,mask')) continue
        const b = element.getBoundingClientRect()
        if (b.width >= 2 && b.width <= 12 && Math.abs(b.width - b.height) < .2) element.setAttribute('opacity', '0')
      }
    }))
    expect(status(wrong, 'source-fact:pseudostates')).not.toBe('passed')
    expect(wrong.passed).toBe(false)
  }, 30_000)

  test(renderer + ' retained C4 person owns its actual head and torso across different SVG classes', async () => {
    const result = await inspect(renderer + '-c4-elements.svg', 'meaning:family:c4')
    expect(status(result, 'painted-node-ownership')).toBe('passed')
    expect(status(result, 'source-fact:elements')).toBe('passed')
    expect(status(result, 'source-fact:relations')).toBe('passed')
    expect(status(result, 'painted-relationships')).toBe('passed')
    const wrong = await inspect(renderer + '-c4-elements.svg', 'meaning:family:c4', page => page.evaluate(() => {
      for (const element of document.querySelectorAll('circle,ellipse')) if (!element.closest('defs,marker')) element.setAttribute('opacity', '0')
    }))
    expect(status(wrong, 'source-fact:elements')).not.toBe('passed')
    expect(wrong.passed).toBe(false)
  }, 30_000)
}
