import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectSourceFacts } from '../fidelity/paint-facts.ts'
import { chromiumExecutable } from './helpers/environment.ts'

let browser: any
setDefaultTimeout(30_000)
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const input = expandedFidelityCases().find(item => item.id === 'features:flowchart:owned-style-effect')!
async function inspect(svg: string) {
  const page = await browser.newPage()
  try {
    await page.setContent(svg)
    const paint = await page.evaluate(inspectFidelityPaint, { family: input.family, expected: input.expected, paint: input.paint })
    return await page.evaluate(inspectSourceFacts, { family: input.family, source: input.source, expected: input.expected, paint, quantitative: [] }) as PaintCheck[]
  } finally { await page.close() }
}
const status = (checks: PaintCheck[], key: string) => checks.find(check => check.criterion === 'source-fact:' + key)?.status
for (const renderer of ['mermaid', 'pele']) test(renderer + ' retained authored node and route styles retain complete owned paint requests', async () => {
  const svg = readFileSync(new URL('./fixtures/fidelity/' + renderer + '-owned-styles.svg', import.meta.url), 'utf8')
  const valid = await inspect(svg)
  expect(status(valid, 'node-paint')).toBe('passed')
  expect(status(valid, 'edge-paint')).toBe('passed')
  expect(status(await inspect(svg.replaceAll('#ffcc00', '#00ccff')), 'node-paint')).toBe('failed')
  expect(status(await inspect(svg.replaceAll('#225588', '#882255')), 'edge-paint')).toBe('failed')
  const renamed = await inspect(svg.replaceAll('pele', 'garden').replaceAll('community-fidelity', 'independent-output'))
  expect(status(renamed, 'node-paint')).toBe('passed')
  expect(status(renamed, 'edge-paint')).toBe('passed')
})
test('qualified shadow and endpoint contacts do not excuse clipped filters or foreign route overpaint', async () => {
  const mermaid = readFileSync(new URL('./fixtures/fidelity/mermaid-owned-styles.svg', import.meta.url), 'utf8')
  const pele = readFileSync(new URL('./fixtures/fidelity/pele-owned-styles.svg', import.meta.url), 'utf8')
  expect(status(await inspect(mermaid.replace('height="130%" width="130%"', 'height="50%" width="50%"')), 'node-paint')).toBe('unavailable')
  expect(status(await inspect(mermaid.replace('</filter>', '<feColorMatrix type="hueRotate" values="90"/></filter>')), 'node-paint')).toBe('unavailable')
  const overpaint = (svg: string, body: string) => svg.replace('</svg>', body + '</svg>')
  // Actual endpoint-owned borders/markers are allowed; equally small foreign
  // covers at those same contacts remain unqualified, as do interior covers.
  expect(status(await inspect(overpaint(mermaid, '<rect x="163" y="30" width="3" height="9" fill="white"/>')), 'edge-paint')).toBe('unavailable')
  expect(status(await inspect(overpaint(pele, '<rect x="84" y="29" width="3" height="6" fill="white"/>')), 'edge-paint')).toBe('unavailable')
  expect(status(await inspect(overpaint(pele, '<rect x="100" y="29" width="8" height="6" fill="white"/>')), 'edge-paint')).toBe('unavailable')
  expect(status(await inspect(overpaint(pele, '<path d="M84.92,32L125.92,32" fill="none" stroke="red" stroke-width="8"/>')), 'edge-paint')).not.toBe('passed')
  expect(status(await inspect(pele.replace('fill="#225588" stroke="none"', 'fill="red" stroke="none"')), 'edge-paint')).not.toBe('passed')
})
