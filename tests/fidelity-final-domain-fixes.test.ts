import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import type { PaintEvidence } from '../fidelity/paint.ts'
import { chromiumExecutable } from './helpers/environment.ts'
setDefaultTimeout(30_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const directory = new URL('./fixtures/final-domain-fixes/', import.meta.url)
const provenance = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8')) as any[]
const reviewed = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8')) as any[]
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as any[]
async function inspect(index: number, change?: string): Promise<PaintEvidence> {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
  try { await page.setContent(readFileSync(new URL(index + '.svg', directory), 'utf8')); if (change) await page.evaluate(change); return await inspectSvgDrawing(page, { family: reviewed[index].family, source: sources[index].source, expected: reviewed[index].expected }) } finally { await page.close() }
}
const check = (paint: PaintEvidence, criterion: string) => paint.checks.find(check => check.criterion === criterion)!
test('retained public output and authored source identities are exact', () => {
  for (const row of provenance) {
    expect(reviewed[row.index].id).toBe(row.caseId)
    expect(createHash('sha256').update(readFileSync(new URL(row.file, directory))).digest('hex')).toBe(row.svgSha256)
    expect(createHash('sha256').update(sources[row.index].source).digest('hex')).toBe(row.sourceSha256)
  }
})
for (const index of [330, 497, 498, 499]) test('an exposed title uses already qualified actual glyph ink: ' + index, async () => {
  const paint = await inspect(index)
  expect(check(paint, 'source-fact:title').status).toBe('passed')
  const text = reviewed[index].expected.facts.title
  expect(paint.textInkBoxes?.some(row => row.text === text && row.layoutBox.y < row.inkBox.y)).toBe(true)
  const moved = `const title=${JSON.stringify(text)};const e=[...document.querySelectorAll('text')].find(e=>e.textContent===title);e.setAttribute('y',String(parseFloat(e.getAttribute('y'))-25))`
  expect(check(await inspect(index, moved), 'source-fact:title').status).not.toBe('passed')
  const hidden = `const title=${JSON.stringify(text)};[...document.querySelectorAll('text')].find(e=>e.textContent===title).style.opacity='0'`
  expect(check(await inspect(index, hidden), 'source-fact:title').status).not.toBe('passed')
})
test('Doc Ref heading presentation preserves complete owned reference values', async () => {
  expect(check(await inspect(351), 'source-fact:definitions').status).toBe('passed')
  const wrong = `const e=[...document.querySelectorAll('foreignObject p')].find(e=>e.textContent.includes('reqs/test_entity'));e.textContent=e.textContent.replace('reqs/test_entity','borrowed/reference')`
  expect(check(await inspect(351, wrong), 'source-fact:definitions').status).toBe('failed')
  const risk = `const e=[...document.querySelectorAll('foreignObject p')].find(e=>e.textContent==='Risk: High');e.textContent='Risk: Low'`
  expect(check(await inspect(351, risk), 'source-fact:definitions').status).toBe('failed')
})
for (const index of [48, 49, 52, 53]) test('C4 complete bracket rows are presentations owned by actual header stacks: ' + index, async () => {
  const paint = await inspect(index)
  expect(check(paint, 'painted-node-ownership').status).not.toBe('failed')
  expect(check(paint, 'source-fact:elements').status).not.toBe('passed')
})
test('a known C4 badge cannot exempt a separate undeclared body', async () => {
  const extra = `document.querySelector('svg').insertAdjacentHTML('beforeend','<g class="node"><rect x="14" y="12" width="160" height="30" fill="yellow" stroke="black"/><text x="20" y="34" fill="black">[ENTERPRISE]</text></g>')`
  expect(check(await inspect(48, extra), 'painted-node-ownership').status).toBe('failed')
  const wrong = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='[ENTERPRISE]');e.textContent='[UNREQUESTED KIND]'`
  expect(check(await inspect(48, wrong), 'painted-node-ownership').status).toBe('failed')
})
