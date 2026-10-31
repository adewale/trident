import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ executablePath: chromiumExecutable, headless: true }) })
afterAll(async () => { await browser?.close() })
const directory = new URL('./fixtures/domain-facts/', import.meta.url)
const provenance = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8')) as any[]
const docs = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8')) as any[]
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as any[]
async function inspect(file: string, change?: string) {
  const entry = provenance.find(entry => entry.file === file)!, sourceCase = expandedFidelityCases().find(c => c.id === entry.caseId) ?? docs.find(c => c.id === entry.caseId), page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(readFileSync(new URL(file, directory), 'utf8'))
    if (change) await page.evaluate(change)
    return await inspectSvgDrawing(page, { family: entry.family, source: sourceCase.source ?? sources.find(c => c.id === entry.caseId).source, expected: sourceCase.expected })
  } finally { await page.close() }
}
const status = (result: Awaited<ReturnType<typeof inspect>>, key: string) => result.checks.find(check => check.criterion === key)?.status

test('the full SVG observer binds requirement enum formatting and relationship captions to their owners', async () => {
  const actual = await inspect('requirement-mermaid.svg')
  expect(status(actual, 'source-fact:definitions')).toBe('passed')
  expect(status(actual, 'visible-authored-labels')).toBe('passed')
  expect(status(actual, 'painted-node-ownership')).toBe('passed')
  const wrongRisk = `const e=[...document.querySelectorAll('foreignObject')].find(e=>/^Risk: /i.test(e.textContent));e.querySelector('span').textContent='Risk: Low'`
  expect(status(await inspect('requirement-mermaid.svg', wrongRisk), 'source-fact:definitions')).toBe('failed')
  const missing = `const e=[...document.querySelectorAll('foreignObject')].find(e=>/^Risk: /i.test(e.textContent));e.remove()`
  expect(status(await inspect('requirement-mermaid.svg', missing), 'source-fact:definitions')).toBe('unavailable')
})

test('event lane headings require their enclosing row geometry and cannot hide an extra authored-looking body', async () => {
  const actual = await inspect('eventmodeling-authored-mermaid.svg')
  expect(status(actual, 'source-fact:frames')).toBe('passed')
  expect(status(actual, 'painted-node-ownership')).toBe('passed')
  const extra = `document.querySelector('svg').insertAdjacentHTML('beforeend','<g transform="translate(15,15)"><rect width="130" height="35" fill="#fff" stroke="#000"/><text x="5" y="24" fill="#000">UI/Automation</text></g>')`
  expect(status(await inspect('eventmodeling-authored-mermaid.svg', extra), 'painted-node-ownership')).toBe('failed')
})

test('optional pie percentages are independently quantitative and cannot replace requested absolute data', async () => {
  const actual = await inspect('pie-authored-agentic.svg')
  expect(status(actual, 'source-fact:show-data')).toBe('passed')
  expect(status(actual, 'painted-slice-weights')).toBe('passed')
  const wrong = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent.startsWith('Alpha (70'));e.textContent='Alpha (20.0%)'`
  expect(status(await inspect('pie-authored-agentic.svg', wrong), 'painted-slice-weights')).toBe('failed')
})

test('fishbone nodes and logical edges are owned by complete rooted branch geometry', async () => {
  const actual = await inspect('ishikawa-authored-mermaid.svg')
  expect(status(actual, 'source-fact:cause-hierarchy')).toBe('passed')
  expect(status(actual, 'painted-relationships')).toBe('passed')
  expect(status(actual, 'painted-node-ownership')).toBe('passed')
  const wrong = `const e=document.querySelector('line.ishikawa-sub-branch');e.setAttribute('x1','-34.054');e.setAttribute('y1','350')`
  const changed = await inspect('ishikawa-authored-mermaid.svg', wrong)
  expect(status(changed, 'source-fact:cause-hierarchy')).toBe('failed')
  expect(status(changed, 'painted-relationships')).toBe('failed')
})
