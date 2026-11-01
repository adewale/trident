import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectQuantitativePaint } from '../fidelity/paint-values.ts'
import { inspectSourceFacts } from '../fidelity/paint-facts.ts'
import { projectVisualExpectation } from '../fidelity/visual-expectation.ts'
import { reviewDocumentationSource } from '../unified/docs-source-review.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import { chromiumExecutable } from './helpers/environment.ts'

let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const fixture = (family: string) => readFileSync(new URL('./fixtures/fidelity/mermaid-' + family + '-values.svg', import.meta.url), 'utf8')
async function inspect(family: string, value: string, expectation?: MeaningExpectation) {
  const input = expandedFidelityCases().find(item => item.id === 'meaning:family:' + family)!, expected = expectation ?? input.expected
  const page = await browser.newPage()
  try {
    await page.setContent(value)
    const paint = await page.evaluate(inspectFidelityPaint, { family, expected })
    const quantitative = await page.evaluate(inspectQuantitativePaint, { family, expected, nodes: paint.nodes })
    const facts = await page.evaluate(inspectSourceFacts, { family, expected, source: input.source, paint, quantitative }) as PaintCheck[]
    return { paint, quantitative, facts }
  } finally { await page.close() }
}
const status = (checks: PaintCheck[], key: string) => checks.find(check => check.criterion === 'source-fact:' + key)?.status
test('retained Sankey separately proves proportional ribbons and default printed node totals', async () => {
  const svg = fixture('sankey'), valid = await inspect('sankey', svg)
  expect(status(valid.facts, 'links')).toBe('passed')
  expect(status(valid.facts, 'displayed-node-values')).toBe('passed')
  expect(status(valid.facts, 'show-values')).toBe('passed')
  expect([...valid.paint.checks, ...valid.quantitative, ...valid.facts].filter(check => check.status !== 'passed')).toEqual([])
  const wrong = await inspect('sankey', svg.replace('Alpha\n5</text>', 'Alpha\n4</text>'))
  expect(status(wrong.facts, 'displayed-node-values')).toBe('failed')
  expect(status(wrong.facts, 'links')).toBe('passed')
  const borrowed = svg.replace('Alpha\n5</text>', 'Alpha\n4</text>').replace('</svg>', '<text x="100" y="40">Alpha 5</text></svg>')
  expect(status((await inspect('sankey', borrowed)).facts, 'displayed-node-values')).not.toBe('passed')
  expect(status((await inspect('sankey', svg.replace(/stop-color="[^"]+"/g, 'stop-color="white"'))).facts, 'links')).not.toBe('passed')
  const coveredBackdrop = svg.replace(/<svg\b[^>]*>/, '$&<rect x="0" y="0" width="1000" height="1000" fill="black"/>')
  expect((await inspect('sankey', coveredBackdrop)).paint.checks.find((check: PaintCheck) => check.criterion === 'paint-opacity-and-color')?.status).toBe('unavailable')
})
test('common rescaling is equivalent when Sankey value printing is explicitly disabled', async () => {
  const input = expandedFidelityCases().find(item => item.id === 'meaning:family:sankey')!, original = reviewDocumentationSource(input, { visual: false }).expected!, expected = projectVisualExpectation('sankey', { ...original, facts: { ...original.facts, 'authored-config': { sankey: { showValues: false } } } }).expected
  const svg = fixture('sankey').replaceAll('\n5</text>', '</text>')
  expect(status((await inspect('sankey', svg, expected)).facts, 'links')).toBe('passed')
  expect(status((await inspect('sankey', svg, expected)).facts, 'show-values')).toBe('passed')
  expect(status((await inspect('sankey', fixture('sankey'), expected)).facts, 'show-values')).toBe('failed')
})
test('retained treemap areas and printed values are separate independent obligations', async () => {
  const svg = fixture('treemap'), valid = await inspect('treemap', svg)
  expect(status(valid.facts, 'values')).toBe('passed')
  expect(status(valid.facts, 'hierarchy')).toBe('passed')
  expect(status(valid.facts, 'displayed-values')).toBe('passed')
  expect(status(valid.facts, 'show-values')).toBe('passed')
  expect([...valid.paint.checks, ...valid.quantitative, ...valid.facts].filter(check => check.status !== 'passed')).toEqual([])
  const wrong = await inspect('treemap', svg.replace('>7</text>', '>6</text>'))
  expect(status(wrong.facts, 'displayed-values')).toBe('failed')
  expect(status(wrong.facts, 'values')).toBe('passed')
  const expected = structuredClone(expandedFidelityCases().find(item => item.id === 'meaning:family:treemap')!.expected)
  expected.facts!.values = [{ id: 'Root', value: 1 }, { id: 'Root/Alpha', value: .65 }, { id: 'Root/Beta', value: .35 }]
  expect(status((await inspect('treemap', svg, expected)).facts, 'values')).toBe('failed')
  for (const hiding of ['opacity="0"', 'opacity="0.000000001"']) {
    const hidden = svg.replace(/(<text\b[^>]*)(>7<\/text>)/, '$1 ' + hiding + '$2')
    expect(status((await inspect('treemap', hidden)).facts, 'displayed-values')).not.toBe('passed')
  }
  const clipped = svg.replace(/(<text\b[^>]*clip-path=")[^"]+("[^>]*>7<\/text>)/, '$1url(#empty-value)$2').replace('</svg>', '<defs><clipPath id="empty-value"><rect width="0" height="0"/></clipPath></defs></svg>')
  expect(status((await inspect('treemap', clipped)).facts, 'displayed-values')).not.toBe('passed')
})
