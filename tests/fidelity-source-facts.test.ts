import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectQuantitativePaint } from '../fidelity/paint-values.ts'
import { inspectSourceFacts, plannedSourceFactCriteria } from '../fidelity/paint-facts.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { chromiumExecutable } from './helpers/environment.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'

let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const source = 'flowchart LR\nA[Alpha] --> B[Beta]'
const expected: MeaningExpectation = { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true }], facts: { direction: 'LR' } }
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100"><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z"/></marker></defs><g><rect x="10" y="30" width="70" height="30" fill="white" stroke="black"/><text x="14" y="50">Alpha</text></g><g><rect x="150" y="30" width="70" height="30" fill="white" stroke="black"/><text x="154" y="50">Beta</text></g><path d="M80 45 L150 45" fill="none" stroke="black" marker-end="url(#arrow)"/></svg>'
async function inspect(value: string, expectation = expected, inputSource = source) {
  const page = await browser.newPage()
  try {
    await page.setContent(value)
    const paint = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected: expectation })
    const quantitative = await page.evaluate(inspectQuantitativePaint, { family: 'flowchart', expected: expectation })
    return await page.evaluate(inspectSourceFacts, { family: 'flowchart', source: inputSource, expected: expectation, paint, quantitative }) as PaintCheck[]
  } finally { await page.close() }
}

test('every source fact is fixed in the required SVG plan, including facts without a qualified observer', () => {
  const expectation = { ...expected, facts: { ...expected.facts, invented: ['not inferable from labels'] } }
  expect(plannedSourceFactCriteria({ expected: expectation })).toEqual(['source-fact:direction', 'source-fact:invented'])
  const plan = planFidelityCriteria([{ id: 'test', family: 'flowchart', source, expected: expectation, required: true, features: [], provenance: 'independent synthetic observer control' }])
  expect(plan.filter(check => check.surface === 'browser-owned-ink').map(check => check.criterion)).toContain('source-fact:invented')
})
test('owned geometry verifies global direction without treating a public model or source echo as layout', async () => {
  expect((await inspect(svg))[0]?.status).toBe('passed')
  expect((await inspect(svg, { ...expected, facts: { direction: 'RL' } }))[0]?.status).toBe('failed')
  expect((await inspect(svg, { ...expected, edges: [...expected.edges!, { source: 'B', target: 'A', directed: true }] }))[0]?.status).toBe('unavailable')
  expect((await inspect(svg, expected, source + '\nsubgraph inner\ndirection TB\nend'))[0]?.status).toBe('unavailable')
})
test('unsupported source semantics stay unknown despite matching nodes, labels and direction', async () => {
  const checks = await inspect(svg, { ...expected, facts: { direction: 'LR', members: [{ id: 'A', values: ['+secret()'] }] } })
  expect(checks.find(check => check.criterion === 'source-fact:direction')?.status).toBe('passed')
  expect(checks.find(check => check.criterion === 'source-fact:members')?.status).toBe('unavailable')
})
test('source title requires painted text rather than SVG metadata', async () => {
  const e = { ...expected, facts: { title: 'The title' } }
  expect((await inspect(svg.replace('<defs>', '<title>The title</title><defs>'), e))[0]?.status).toBe('failed')
  const actual = svg.replace('</svg>', '<text x="60" y="18">The title</text></svg>')
  expect((await inspect(actual, e))[0]?.status).toBe('passed')
  expect((await inspect(actual.replace('x="60" y="18"', 'x="60" y="18" display="none"'), e))[0]?.status).toBe('failed')
})

test('transparent source titles and unbound accessibility metadata cannot supply fact credit', async () => {
  const e = { ...expected, facts: { title: 'The title' } }
  const transparent = svg.replace('</svg>', '<text x="60" y="18" fill="none" stroke="none">The title</text></svg>')
  expect((await inspect(transparent, e))[0]?.status).toBe('failed')
  const accessible = svg.replace('<svg ', '<svg aria-labelledby="arbitrary-name" aria-describedby="arbitrary-description" ').replace('<defs>', '<title id="arbitrary-name">The title</title><desc id="arbitrary-description">A description</desc><defs>')
  const facts = { 'accessibility-title': 'The title', 'accessibility-description': 'A description' }
  expect((await inspect(accessible, { ...expected, facts })).map(check => check.status)).toEqual(['passed', 'passed'])
  expect((await inspect(accessible.replace('aria-labelledby="arbitrary-name"', 'aria-labelledby="missing"'), { ...expected, facts })).find(check => check.criterion === 'source-fact:accessibility-title')?.status).toBe('failed')
})

test('a source title cannot borrow an identically named node or survive a proved empty clip', async () => {
  const borrowed = { ...expected, facts: { title: 'Alpha' } }
  expect((await inspect(svg, borrowed))[0]?.status).toBe('failed')
  const valid = svg.replace('</svg>', '<text x="60" y="18">Alpha</text></svg>')
  expect((await inspect(valid, borrowed))[0]?.status).toBe('passed')
  const clipped = valid.replace('</defs>', '<clipPath id="empty"><rect width="0" height="0"/></clipPath></defs>').replace('x="60" y="18"', 'x="60" y="18" clip-path="url(#empty)"')
  expect((await inspect(clipped, borrowed))[0]?.status).toBe('failed')
})
