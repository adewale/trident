import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { inspectFidelityPaint, plannedPaintCriteria, type PaintCheck } from '../fidelity/paint.ts'
import { inspectSourceFacts } from '../fidelity/paint-facts.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import { chromiumExecutable } from './helpers/environment.ts'
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const fixture = (name: string) => readFileSync(new URL('./fixtures/fidelity/' + name + '.svg', import.meta.url), 'utf8')
async function inspect(svg: string, expected: MeaningExpectation) {
  const page = await browser.newPage()
  try {
    await page.setContent(svg)
    const paint = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected })
    const facts = await page.evaluate(inspectSourceFacts, { family: 'flowchart', source: 'Independent bounded profile from source literals', expected, paint, quantitative: [] }) as PaintCheck[]
    return { paint, facts, status: paint.checks.find((check: PaintCheck) => check.criterion === 'painted-text-inventory')?.status }
  } finally { await page.close() }
}
const controls: [string, MeaningExpectation][] = [
  ['mermaid-flowchart-drop-shadow', expandedFidelityCases().find(item => item.id === 'meaning:family:flowchart')!.expected],
  ['pele-owned-styles', expandedFidelityCases().find(item => item.id === 'features:flowchart:owned-style-effect')!.expected],
  ...['rs-flat-flowchart', 'merslim-flat-flowchart'].map(name => [name, { labels: ['A', 'B'], nodes: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }] }] as [string, MeaningExpectation]),
]
for (const [name, expected] of controls) test(name + ' actual plain flowchart rejects an extra caption despite correct labels and topology', async () => {
  const svg = fixture(name)
  expect(plannedPaintCriteria({ family: 'flowchart', expected })).toContain('painted-text-inventory')
  expect((await inspect(svg, expected)).status).toBe('passed')
  const extra = svg.replace('</svg>', '<text x="10" y="20" style="fill:black;stroke:none;font-size:16px">Bogus relation</text></svg>')
  expect((await inspect(extra, expected)).status).toBe('failed')
})
test('an extra header or annotation cannot borrow its containing node owner', async () => {
  const expected = { labels: ['Alpha'], nodes: [{ id: 'A', label: 'Alpha' }] }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><g><rect x="10" y="10" width="180" height="100" fill="white" stroke="black"/><text x="20" y="35">Alpha</text></g></svg>'
  expect((await inspect(svg, expected)).status).toBe('passed')
  for (const extra of ['Alpha', 'Wrong annotation']) expect((await inspect(svg.replace('</g>', '<text x="20" y="65">' + extra + '</text></g>'), expected)).status).toBe('failed')
})
test('a source title needs its own occurrence outside an identically named route caption', async () => {
  const expected: MeaningExpectation = { labels: ['Alpha', 'Beta', 'Relation'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: false, label: 'Relation' }], facts: { title: 'Relation' } }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="150"><g><rect x="10" y="60" width="70" height="40" fill="white" stroke="black"/><text x="20" y="85">Alpha</text></g><g><rect x="230" y="60" width="70" height="40" fill="white" stroke="black"/><text x="240" y="85">Beta</text></g><path d="M80 80H230" stroke="black" fill="none"/><text x="125" y="73">Relation</text></svg>'
  expect((await inspect(svg, expected)).facts.find(check => check.criterion === 'source-fact:title')?.status).toBe('failed')
  const distinct = svg.replace('</svg>', '<text x="120" y="25">Relation</text></svg>')
  const result = await inspect(distinct, expected)
  expect(result.facts.find(check => check.criterion === 'source-fact:title')?.status).toBe('passed')
  expect(result.status).toBe('passed')
})
