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

test('owned node silhouettes cannot earn correctness beneath an opaque cover painted before the label', async () => {
  const page = await browser.newPage()
  try {
    const body = '<path d="M20 40 A50 10 0 1 1 120 40 A50 10 0 1 1 20 40 L20 100 A50 10 0 0 0 120 100 L120 40" fill="white" stroke="black"/>'
    const input = { family: 'flowchart', source: 'flowchart TB\nS@{shape:cyl,label:Store}', expected: { labels: ['Store'], nodes: [{ id: 'S', label: 'Store' }], facts: { 'node-shapes': [{ id: 'S', shape: 'cylinder' }] } } }
    for (const cover of ['', '<rect x="20" y="30" width="100" height="80" fill="white" stroke="white" stroke-width="4"/>', '<rect x="21" y="42" width="98" height="55" fill="red"/>']) {
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><g>' + body + cover + '<text x="40" y="80">Store</text></g></svg>')
      const result = await inspectSvgDrawing(page, input)
      expect(status(result, 'source-fact:node-shapes')).toBe('passed')
      expect(status(result, 'painted-node-visibility')).toBe(cover ? 'unavailable' : 'passed')
      if (cover) expect(result.passed).toBe(false)
    }
  } finally { await page.close() }
})

test('an unowned camouflaged cover over a connector stem withholds the integrated route pass', async () => {
  const page = await browser.newPage()
  try {
    const input = { family: 'flowchart', source: 'flowchart LR\nA[Alpha]-->B[Beta]', expected: { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true, startMarker: 'none', endMarker: 'arrow' }], facts: { direction: 'LR', 'node-shapes': [{ id: 'A', shape: 'rectangle' }, { id: 'B', shape: 'rectangle' }] } } }
    for (const pose of ['', ' transform="translate(10 10) scale(.8 .9)"']) for (const cover of ['', '<rect x="90" y="40" width="100" height="20" fill="white"/>', '<path d="M90 40 H190 V60 H90 Z" fill="white"/>', '<rect x="193" y="46" width="6.9" height="3.8" fill="white"/><rect x="193" y="50.2" width="6.9" height="3.8" fill="white"/>']) {
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160"><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="black"/></marker></defs><g' + pose + '><path class="edge" d="M80 50 H200" stroke="black" fill="none" marker-end="url(#arrow)"/>' + cover + '<g><rect x="20" y="30" width="60" height="40" fill="white" stroke="black"/><text x="25" y="55">Alpha</text></g><g><rect x="200" y="30" width="60" height="40" fill="white" stroke="black"/><text x="205" y="55">Beta</text></g></g></svg>')
      const result = await inspectSvgDrawing(page, input)
      expect(status(result, 'painted-node-ownership')).toBe('passed')
      expect(status(result, 'painted-node-visibility')).toBe('passed')
      expect(status(result, 'painted-route-visibility')).toBe(cover ? 'unavailable' : 'passed')
      expect(result.passed).toBe(!cover)
    }
  } finally { await page.close() }
})

for (const renderer of ['mermaid', 'pele']) {
  test(renderer + ' retained state discs and multi-layer final rings survive the integrated route reinspection', async () => {
    const result = await inspect(renderer + '-state-pseudostates.svg', 'features:state:initial-final-pseudostates')
    for (const criterion of ['painted-node-ownership', 'painted-node-visibility', 'painted-relationships', 'source-fact:pseudostates', 'source-fact:state-kinds', 'painted-route-visibility']) expect(status(result, criterion)).toBe('passed')
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
    expect(status(result, 'painted-node-visibility')).toBe('passed')
    expect(status(result, 'source-fact:elements')).toBe('passed')
    expect(status(result, 'source-fact:relations')).toBe('passed')
    expect(status(result, 'painted-relationships')).toBe('passed')
    const swapped = await inspect(renderer + '-c4-elements.svg', 'meaning:family:c4', page => page.evaluate(() => {
      for (const element of document.querySelectorAll('text')) {
        if (element.textContent?.trim() === 'API') element.textContent = 'Service'
        else if (element.textContent?.trim() === 'Service') element.textContent = 'API'
      }
    }))
    expect(status(swapped, 'source-fact:elements')).toBe('failed')
    const wrong = await inspect(renderer + '-c4-elements.svg', 'meaning:family:c4', page => page.evaluate(() => {
      for (const element of document.querySelectorAll('circle,ellipse')) if (!element.closest('defs,marker')) element.setAttribute('opacity', '0')
    }))
    expect(status(wrong, 'source-fact:elements')).not.toBe('passed')
    expect(wrong.passed).toBe(false)
  }, 30_000)
}

test('native retained UML field notation preserves actual name, type and access without requiring source spelling', async () => {
  const result = await inspect('native-class-members.svg', 'features:class:namespace-members-cardinality')
  expect(status(result, 'source-fact:members')).toBe('passed')
  const wrong = await inspect('native-class-members.svg', 'features:class:namespace-members-cardinality', page => page.evaluate(() => {
    let changed = 0
    for (const element of document.querySelectorAll('text')) if (element.textContent?.replace(/\s+/g, '').includes('name:String')) for (const part of element.querySelectorAll('tspan')) if (part.textContent === 'String') { part.textContent = 'Int'; changed++ }
    if (changed !== 1) throw Error('Immutable typed member control did not change exactly one visible type')
  }))
  expect(status(wrong, 'source-fact:members')).toBe('failed')
})

test('native composite header panels remain body ink when every renderer-specific class is removed', async () => {
  const result = await inspect('native-state-composite.svg', 'features:state:nesting-reciprocal-alias')
  expect(status(result, 'painted-relationships')).toBe('passed')
  const flat = await inspect('native-state-composite.svg', 'features:state:nesting-reciprocal-alias', page => page.evaluate(() => {
    for (const element of document.querySelectorAll('[class]')) element.removeAttribute('class')
    for (const element of document.querySelectorAll('[data-role],[data-id],[data-from],[data-to],[data-relationship]')) for (const name of ['data-role', 'data-id', 'data-from', 'data-to', 'data-relationship']) element.removeAttribute(name)
  }))
  expect(status(flat, 'painted-relationships')).toBe('passed')
})

for (const renderer of ['mermaid', 'pele']) test(renderer + ' retained composite span calibration uses differing actual widths at the same column', async () => {
  const result = await inspect(renderer + '-block-composite.svg', 'features:block:composite-membership')
  for (const criterion of ['painted-node-ownership', 'painted-group-membership', 'source-fact:grid-cell-order', 'source-fact:grid-columns', 'source-fact:columns', 'source-fact:spans']) expect(status(result, criterion)).toBe('passed')
  const wrong = await inspect(renderer + '-block-composite.svg', 'features:block:composite-membership', page => page.evaluate(() => {
    const caption = [...document.querySelectorAll('text,foreignObject *')].find(element => element.textContent?.trim() === 'Gamma')
    if (!caption) throw Error('Missing immutable Gamma caption')
    let owner: Element | null = caption.parentElement
    while (owner && owner.localName !== 'svg') {
      const body = [...owner.children].find(element => element.localName === 'rect' && element.getBoundingClientRect().width > 1 && element.getBoundingClientRect().height > 1)
      if (body) { body.setAttribute('width', String(Number(body.getAttribute('width')) * 3)); return }
      owner = owner.parentElement
    }
    throw Error('No directly owned Gamma body')
  }))
  expect(status(wrong, 'source-fact:grid-cell-order')).not.toBe('passed')
}, 30_000)
