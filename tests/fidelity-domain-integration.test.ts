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
async function inspect(file: string, change?: string, expectedOverride?: any) {
  const entry = provenance.find(entry => entry.file === file)!, sourceCase = expandedFidelityCases().find(c => c.id === entry.caseId) ?? docs.find(c => c.id === entry.caseId), page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(readFileSync(new URL(file, directory), 'utf8'))
    if (change) await page.evaluate(change)
    return await inspectSvgDrawing(page, { family: entry.family, source: sourceCase.source ?? sources.find(c => c.id === entry.caseId).source, expected: expectedOverride ?? sourceCase.expected })
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

test('qualified event identities require their own typed namespace rows and complete owned scalar data', async () => {
  const expected = structuredClone(expandedFidelityCases().find(c => c.id === 'features:eventmodeling:explicit-sources-data')!.expected), frames = expected.facts!.frames as any[]
  // Reviewed public syntax splits exactly two parts into a basename caption and
  // typed namespace lane. The complete qualified identity remains required.
  expected.labels = expected.labels.filter(label => !frames.some(frame => frame.label === label))
  expected.facts!['event-namespace-presentation'] = frames.map(frame => ({ id: frame.id, entityIdentifier: frame.label, displayLabel: frame.label.split('.')[1], namespace: frame.label.split('.')[0], entityType: frame.kind === 'read-model' ? 'readmodel' : frame.kind }))
  const file = 'eventmodeling-namespaced-mermaid.svg', actual = await inspect(file, undefined, expected)
  expect(status(actual, 'source-fact:frames')).toBe('passed')
  expect(status(actual, 'source-fact:frame-content')).toBe('passed')
  expect(status(actual, 'source-fact:event-namespace-presentation')).toBe('passed')
  const wrong = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='UI/A: Cart');e.textContent='UI/A: Other'`
  expect(status(await inspect(file, wrong, expected), 'source-fact:event-namespace-presentation')).toBe('failed')
})

test('the full observer binds qualified ZenUML creation and external caller routes independently', async () => {
  for (const file of ['zenuml-create-mermaid.svg', 'zenuml-external-comments-mermaid.svg']) {
    const result = await inspect(file)
    expect(status(result, 'source-fact:zenuml-event-order')).toBe('passed')
    expect(result.checks.some(check=>check.status==='failed')).toBe(false)
  }
})

test('packet MSB-first rows obey declared descending order and retain contradictory spans', async () => {
  for (const file of ['packet-config-0-mermaid.svg', 'packet-config-0-pele.svg']) {
    const actual = await inspect(file)
    expect(status(actual, 'source-fact:fields')).toBe('passed')
    expect(status(actual, 'painted-bit-field-spans')).toBe('passed')
    const wrong = `const a=[...document.querySelectorAll('text')].find(e=>e.textContent==='DATA'),b=[...document.querySelectorAll('text')].find(e=>e.textContent==='TYPE');a.textContent='TYPE';b.textContent='DATA'`
    const changed = await inspect(file, wrong)
    expect(status(changed, 'source-fact:fields')).toBe('failed')
    expect(status(changed, 'painted-bit-field-spans')).toBe('failed')
  }
  const wrongWidth = `const rects=[...document.querySelectorAll('rect')];const e=rects.sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];e.setAttribute('width',String(Number(e.getAttribute('width'))*.7))`
  expect(status(await inspect('packet-config-0-mermaid.svg', wrongWidth), 'painted-bit-field-spans')).toBe('failed')
})
