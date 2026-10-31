import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectSourceFacts } from '../fidelity/paint-facts.ts'
import { chromiumExecutable } from './helpers/environment.ts'

let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const fixtures = (name: string) => readFileSync(new URL('./fixtures/fidelity/' + name + '.svg', import.meta.url), 'utf8')
async function inspect(svg: string, id: string) {
  const testCase = expandedFidelityCases().find(item => item.id === id)!
  const page = await browser.newPage()
  try {
    await page.setContent(svg)
    const paint = await page.evaluate(inspectFidelityPaint, { family: testCase.family, expected: testCase.expected })
    return await page.evaluate(inspectSourceFacts, { family: testCase.family, source: testCase.source, expected: testCase.expected, paint, quantitative: [] }) as PaintCheck[]
  } finally { await page.close() }
}
const status = (checks: PaintCheck[], fact: string) => checks.find(check => check.criterion === 'source-fact:' + fact)?.status
for (const renderer of ['mermaid', 'pele']) {
  test(renderer + ' retained class members require complete owned signatures, not matching method names', async () => {
    const svg = fixtures(renderer + '-class-members'), id = 'features:class:namespace-members-cardinality'
    expect(status(await inspect(svg, id), 'members')).toBe('passed')
    expect(status(await inspect(svg.replaceAll('bool', 'int'), id), 'members')).toBe('failed')
    expect(status(await inspect(svg.replaceAll('+String name', '+String age'), id), 'members')).toBe('failed')
    expect(status(await inspect(svg.replaceAll('pele', 'garden').replaceAll('community-fidelity', 'unrelated-prefix'), id), 'members')).toBe('passed')
  })
  test(renderer + ' retained ER attributes bind types, names and keys to complete entity rows', async () => {
    const svg = fixtures(renderer + '-er-attributes'), id = 'features:er:attributes-identifying-cardinality'
    expect(status(await inspect(svg, id), 'attributes')).toBe('passed')
    expect(status(await inspect(svg.replaceAll('PK', 'FK'), id), 'attributes')).toBe('failed')
    expect(status(await inspect(svg.replaceAll('>string<', '>int<'), id), 'attributes')).toBe('failed')
  })
  test(renderer + ' retained sequence order and styles come from owned painted routes', async () => {
    const svg = fixtures(renderer + '-sequence-messages'), id = 'features:sequence:notes-loop-reciprocal'
    const valid = await inspect(svg, id)
    expect(status(valid, 'message-order')).toBe('passed')
    expect(status(valid, 'message-style')).toBe('passed')
    const renamed = await inspect(svg.replaceAll('pele', 'garden').replaceAll('community-fidelity', 'unrelated-prefix'), id)
    expect(status(renamed, 'message-order')).toBe('passed')
    expect(status(renamed, 'message-style')).toBe('passed')
    const swapped = svg.replaceAll('Request', 'TEMP').replaceAll('Finish', 'Request').replaceAll('TEMP', 'Finish')
    expect(status(await inspect(swapped, id), 'message-order')).toBe('failed')
    const solidReply = svg.replaceAll('stroke-dasharray="4 4"', 'stroke-dasharray="none"').replaceAll('stroke-dasharray: 3, 3;', 'stroke-dasharray: none;')
    expect(status(await inspect(solidReply, id), 'message-style')).toBe('failed')
  })
}

test('a repeated class header cannot conceal an additional member with the same spelling', async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><g><rect x="10" y="10" width="160" height="130" fill="white" stroke="black"/><text x="20" y="30">User</text><text x="20" y="60">+String name</text><text x="20" y="90">+save() : bool</text></g><g><rect x="220" y="10" width="100" height="130" fill="white" stroke="black"/><text x="230" y="30">Store</text><text x="230" y="60">Store</text></g></svg>'
  expect(status(await inspect(svg, 'features:class:namespace-members-cardinality'), 'members')).toBe('failed')
  const hiddenMember = svg.replace('<text x="230" y="60">Store</text>', '').replace('</svg>', '<rect x="15" y="45" width="130" height="20" fill="white" pointer-events="none"/></svg>')
  expect(status(await inspect(hiddenMember, 'features:class:namespace-members-cardinality'), 'members')).toBe('unavailable')
  for (const style of ['fill="white"', 'opacity="0.000000001"']) {
    const hidden = svg.replace('<text x="230" y="60">Store</text>', '').replace('<text x="20" y="60">', '<text x="20" y="60" ' + style + '>')
    expect(status(await inspect(hidden, 'features:class:namespace-members-cardinality'), 'members')).not.toBe('passed')
  }
})
