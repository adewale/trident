import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectSourceFacts } from '../fidelity/paint-facts.ts'
import { chromiumExecutable } from './helpers/environment.ts'
import { projectVisualExpectation } from '../fidelity/visual-expectation.ts'
import type { AuthoredFidelityCase } from '../fidelity/meaning.ts'

let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const fixtures = (name: string) => readFileSync(new URL('./fixtures/fidelity/' + name + '.svg', import.meta.url), 'utf8')
async function inspect(svg: string, id: string, override: Partial<Pick<AuthoredFidelityCase, 'source' | 'expected'>> & { domOnly?: boolean } = {}) {
  const testCase = { ...expandedFidelityCases().find(item => item.id === id)!, ...override }
  const page = await browser.newPage()
  try {
    await page.setContent(svg)
    if (override.domOnly) await page.evaluate(() => {
      // Preserve each retained rectangular body while eliminating all possible
      // glyph paths. Mermaid's rough skin uses paths for its table faces;
      // deleting those faces would invalidate ownership rather than test data.
      for (const path of document.querySelectorAll('path')) {
        if (path.closest('defs,marker,clipPath,mask') || getComputedStyle(path).fill === 'none' || /[CQASTcqast]/.test(path.getAttribute('d') ?? '')) continue
        const box = (path as SVGGraphicsElement).getBBox()
        if (box.width <= 2 || box.height <= 2) continue
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        for (const [key, value] of Object.entries({ x: box.x, y: box.y, width: box.width, height: box.height })) body.setAttribute(key, String(value))
        body.setAttribute('fill', 'white'); body.setAttribute('stroke', 'black')
        if (path.hasAttribute('transform')) body.setAttribute('transform', path.getAttribute('transform')!)
        path.replaceWith(body)
      }
      for (const path of document.querySelectorAll('path')) path.remove()
      if (document.querySelector('path,image,use')) throw Error('DOM-only table control still has opaque label candidates')
    })
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
    const renamedMember = svg.replaceAll('+String name', '+String age')
    expect(status(await inspect(renamedMember, id), 'members')).toBe('unavailable')
    // The DOM-only control preserves table bounds and all text while removing
    // uninterpreted path alternatives; wrong complete member data can fail.
    expect(status(await inspect(svg, id, { domOnly: true }), 'members')).toBe('passed')
    expect(status(await inspect(renamedMember, id, { domOnly: true }), 'members')).toBe('failed')
    expect(status(await inspect(svg.replaceAll('pele', 'garden').replaceAll('community-fidelity', 'unrelated-prefix'), id), 'members')).toBe('passed')
  })
  test(renderer + ' retained ER attributes bind types, names and keys to complete entity rows', async () => {
    const svg = fixtures(renderer + '-er-attributes'), id = 'features:er:attributes-identifying-cardinality'
    expect(status(await inspect(svg, id), 'attributes')).toBe('passed')
    expect(status(await inspect(svg.replaceAll('PK', 'FK'), id), 'attributes')).toBe('failed')
    const changedType = svg.replaceAll('>string<', '>int<')
    expect(status(await inspect(changedType, id), 'attributes')).toBe('unavailable')
    expect(status(await inspect(svg, id, { domOnly: true }), 'attributes')).toBe('passed')
    expect(status(await inspect(changedType, id, { domOnly: true }), 'attributes')).toBe('failed')
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

test('unheaded sequence routes qualify physical endpoint pairs independently of SVG path-writing direction', async () => {
  const id = 'features:sequence:notes-loop-reciprocal', input = expandedFidelityCases().find(item => item.id === id)!, raw = structuredClone(input.profileExpected!)
  raw.edges = raw.edges!.map((edge, index) => ({ ...edge, directed: index === 2, startMarker: 'none', endMarker: index === 2 ? 'arrow' : 'none' }))
  raw.facts!['message-style'] = ['->', '-->', '->>']
  const expected = projectVisualExpectation('sequence', raw).expected
  const source = input.source.replace('A->>B: Request', 'A->B: Request').replace('B-->>A: Reply', 'B-->A: Reply')
  const svg = fixtures('pele-sequence-messages').replace(/<path class="pele-marker" d="M108\.92,165[^>]*\/>/, '').replace(/<path class="pele-marker" d="M0,202[^>]*\/>/, '').replace('M0,165H101.92', 'M0,165H108.92').replace('M108.92,202H7', 'M108.92,202H0')
  const valid = await inspect(svg, id, { expected, source })
  expect(status(valid, 'message-order')).toBe('passed')
  expect(status(valid, 'message-style')).toBe('passed')
  const reversed = await inspect(svg.replace('M0,165H108.92', 'M108.92,165H0'), id, { expected, source })
  expect(status(reversed, 'message-order')).toBe('passed')
  expect(status(reversed, 'message-style')).toBe('passed')
})
