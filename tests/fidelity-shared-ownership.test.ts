import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { inspectFidelityPaint, type PaintCheck, type PaintEvidence } from '../fidelity/paint.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ executablePath: chromiumExecutable, headless: true }) })
afterAll(async () => { await browser?.close() })
const directory = new URL('./fixtures/shared-ownership/', import.meta.url)
const provenance = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8')) as any[]
const documentation = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-reviewed.json.gz', import.meta.url))).toString()) as any[]
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as any[]
async function inspect(index: number, change?: string, generic = false): Promise<PaintEvidence> {
  const entry = provenance.find(entry => entry.index === index)!, current = documentation[index], page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(readFileSync(new URL(entry.file, directory), 'utf8'))
    if (change) await page.evaluate(change)
    const input = { family: current.family, source: sources[index].source, expected: current.expected }
    return generic ? await page.evaluate(inspectFidelityPaint, input) : await inspectSvgDrawing(page, input)
  } finally { await page.close() }
}
const criterion = (checks: PaintCheck[], name: string) => checks.find(check => check.criterion === name)!

test('same-call retained SVGs and source bytes are immutable', () => {
  for (const row of provenance) {
    expect(documentation[row.index].id).toBe(row.caseId)
    expect(createHash('sha256').update(readFileSync(new URL(row.file, directory))).digest('hex')).toBe(row.svgSha256)
    expect(createHash('sha256').update(sources[row.index].source).digest('hex')).toBe(row.sourceSha256)
  }
})

for (const index of [...Array.from({ length: 13 }, (_, i) => i + 424), 481, 482]) test('actual complete group body owns members: ' + index, async () => {
  const result = await inspect(index)
  const checks = result.checks.filter(check => check.criterion.startsWith('painted-group:'))
  expect(checks.length).toBeGreaterThan(0)
  expect(checks.every(check => check.status === 'passed')).toBe(true)
})

test('a borrowed header cannot manufacture a body and a member outside the actual body fails', async () => {
  const header = `const e=[...document.querySelectorAll('rect')].find(e=>Number(e.getAttribute('width'))<40&&Number(e.getAttribute('height'))>100);e.setAttribute('x',String(Number(e.getAttribute('x'))-60))`
  expect((await inspect(424, header)).checks.filter(check => check.criterion.startsWith('painted-group:')).some(check => check.status !== 'passed')).toBe(true)
  const outside = `const e=[...document.querySelectorAll('foreignObject')].find(e=>e.textContent==='Browse catalogue');const g=e.closest('g.node');g.setAttribute('transform',g.getAttribute('transform')+' translate(0,500)')`
  expect((await inspect(424, outside)).checks.some(check => check.criterion.startsWith('painted-group:') && check.status === 'failed')).toBe(true)
})

test('package top-right tab whitespace is outside its actual main container', async () => {
  const move = `const e=[...document.querySelectorAll('foreignObject')].find(e=>e.textContent==='Authorize payment');const g=e.closest('g.node');g.setAttribute('transform',g.getAttribute('transform')+' scale(.2)');const b=g.getBoundingClientRect();g.setAttribute('transform',g.getAttribute('transform')+' translate('+((480-b.x-b.width/2)/.2)+','+((44-b.y-b.height/2)/.2)+')')`
  expect((await inspect(481, move)).checks.some(check => check.criterion.startsWith('painted-group:') && check.status === 'failed')).toBe(true)
})

for (const index of [477, 479, 487, 494]) test('complete note, caption and stereotype blocks own their nested fragments: ' + index, async () => {
  expect(criterion((await inspect(index)).checks, 'painted-node-ownership').status).not.toBe('failed')
})

test('a nested word does not exempt a separate undeclared body', async () => {
  const extra = `document.querySelector('svg').insertAdjacentHTML('beforeend','<g class="node"><rect x="12" y="340" width="140" height="36" fill="yellow" stroke="black"/><text x="20" y="365" fill="black">active session</text></g>')`
  expect(criterion((await inspect(487, extra)).checks, 'painted-node-ownership').status).toBe('failed')
})

test('only a complete declared caption block owns its bold fragments', async () => {
  const changed = `const p=[...document.querySelectorAll('foreignObject p')].find(e=>e.textContent==='opens form');p.prepend(document.createTextNode('unexpected '))`
  expect(criterion((await inspect(479, changed)).checks, 'painted-node-ownership').status).toBe('failed')
})

test('unqualified note attachment withholds generic exact-inventory credit', async () => {
  const moved = `const e=[...document.querySelectorAll('foreignObject')].find(e=>e.textContent==='Requires an active session');const g=e.parentElement.parentElement;g.setAttribute('transform',(g.getAttribute('transform')||'')+' translate(0,300)')`
  expect(criterion((await inspect(487, moved, true)).checks, 'painted-node-ownership').status).not.toBe('passed')
})

test('tree annotations belong to the declared inventory without becoming hierarchy nodes', async () => {
  const checks = (await inspect(455)).checks
  expect(criterion(checks, 'source-fact:hierarchy').status).toBe('passed')
  expect(criterion(checks, 'source-fact:decorations').status).toBe('unavailable')
  const wrong = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='app entry point');e.textContent='borrowed annotation'`
  expect(criterion((await inspect(455, wrong)).checks, 'source-fact:hierarchy').status).toBe('failed')
  const extra = `document.querySelector('svg').insertAdjacentHTML('beforeend','<text x="10" y="160">undeclared annotation</text>')`
  expect(criterion((await inspect(455, extra)).checks, 'source-fact:hierarchy').status).toBe('failed')
  const stem = `const e=[...document.querySelectorAll('line,path')].find(e=>{const b=e.getBoundingClientRect();return b.width<1&&b.height>10});e.remove()`
  expect(criterion((await inspect(455, stem)).checks, 'source-fact:hierarchy').status).not.toBe('passed')
})
