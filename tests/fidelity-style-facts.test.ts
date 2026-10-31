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
