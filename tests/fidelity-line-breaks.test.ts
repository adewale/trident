import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectSourceFacts } from '../fidelity/paint-facts.ts'
import { projectVisualExpectation } from '../fidelity/visual-expectation.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import { chromiumExecutable } from './helpers/environment.ts'
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
async function inspect(svg: string, expected: MeaningExpectation, family = 'flowchart') {
  const page = await browser.newPage()
  try {
    await page.setContent(svg)
    const paint = await page.evaluate(inspectFidelityPaint, { family, expected })
    const facts = await page.evaluate(inspectSourceFacts, { family, source: 'independent literal profile specified by this test', expected, paint, quantitative: [] })
    return { paint, facts, status: (facts as PaintCheck[]).find(check => check.criterion === 'source-fact:text-line-breaks')?.status }
  } finally { await page.close() }
}
test('owned glyph rows, not DOM newlines, prove explicit source breaks', async () => {
  const expected = projectVisualExpectation('flowchart', { labels: ['Alpha\nBeta'], nodes: [{ id: 'A', label: 'Alpha\nBeta' }] }).expected
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><g><rect x="10" y="10" width="180" height="130" fill="white" stroke="black"/><text x="25" y="40"><tspan x="25" y="40">Alpha</tspan><tspan x="25" y="65">Beta</tspan></text></g></svg>'
  expect((await inspect(svg, expected)).status).toBe('passed')
  const collapsed = svg.replace('<tspan x="25" y="40">Alpha</tspan><tspan x="25" y="65">Beta</tspan>', 'Alpha Beta')
  expect((await inspect(collapsed, expected)).status).toBe('failed')
  expect((await inspect(collapsed.replace('Alpha Beta', 'Alpha\nBeta'), expected)).status).toBe('failed')
  expect((await inspect(svg.replace('Alpha</tspan>', 'TEMP</tspan>').replace('Beta</tspan>', 'Alpha</tspan>').replace('TEMP</tspan>', 'Beta</tspan>'), expected)).status).not.toBe('passed')
  for (const attributes of ['fill="white"', 'display="none"', 'fill="none" stroke="none"', 'opacity="0.000000001"', 'clip-path="url(#empty)"']) {
    const hidden = svg.replace('<g>', '<defs><clipPath id="empty"><rect width="0" height="0"/></clipPath></defs><g>').replace('y="65">Beta', 'y="65" ' + attributes + '>Beta')
    expect((await inspect(hidden, expected)).status).not.toBe('passed')
  }
  const borrowed = collapsed.replace('</svg>', '<text x="205" y="80"><tspan x="205" y="80">Alpha</tspan><tspan x="205" y="105">Beta</tspan></text></svg>')
  expect((await inspect(borrowed, expected)).status).not.toBe('passed')
})
for (const renderer of ['mermaid', 'pele']) test(renderer + ' real sibling text/tspan actor lines qualify the same owned source contract', async () => {
  const expected: MeaningExpectation = { labels: ['Alice\nJohnson', 'John', 'Hello John,\nhow are you?'], nodes: [{ id: 'Alice', label: 'Alice\nJohnson' }, { id: 'John', label: 'John' }], edges: [{ source: 'Alice', target: 'John', directed: false, startMarker: 'none', endMarker: 'none', label: 'Hello John,\nhow are you?' }], facts: { 'text-line-breaks': [{ owner: { kind: 'participant', id: 'Alice' }, lines: ['Alice', 'Johnson'] }, { owner: { kind: 'message', index: 0 }, lines: ['Hello John,', 'how are you?'] }] } }
  const svg = readFileSync(new URL('./fixtures/fidelity/' + renderer + '-sequence-linebreak.svg', import.meta.url), 'utf8')
  const valid = await inspect(svg, expected, 'sequence')
  expect(valid.status).toBe('passed')
  const renamed = await inspect(svg.replaceAll('pele', 'garden').replaceAll('docs_1_388', 'independent-prefix'), expected, 'sequence')
  expect(renamed.status).toBe('passed')
  const wrong = structuredClone(expected); (wrong.facts!['text-line-breaks'] as any[])[0].lines = ['Alice Johnson', 'Alice']
  expect((await inspect(svg, wrong, 'sequence')).status).toBe('failed')
})

test('a route caption equal to a node title remains a separate physically owned text occurrence', async () => {
  const expected: MeaningExpectation = { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: false, label: 'Alpha' }] }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120"><g><rect x="10" y="30" width="70" height="40" fill="white" stroke="black"/><text x="20" y="55">Alpha</text></g><g><rect x="210" y="30" width="70" height="40" fill="white" stroke="black"/><text x="220" y="55">Beta</text></g><path d="M80 50H210" stroke="black" fill="none"/><text x="120" y="43">Alpha</text></svg>'
  const result = await inspect(svg, expected)
  expect(result.paint.checks.find((check: PaintCheck) => check.criterion === 'painted-relationship-label-counts')?.status).toBe('passed')
  expect(result.paint.checks.find((check: PaintCheck) => check.criterion === 'painted-relationship-label-ownership')?.status).toBe('passed')
})
