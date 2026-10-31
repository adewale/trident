import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { chromium } from 'playwright'
import { chromiumExecutable } from './helpers/environment.ts'
import { inspectFidelityPaint, type PaintEvidence } from '../fidelity/paint.ts'

let browser: any
setDefaultTimeout(30_000)
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser.close() })
const expected = { labels: ['A', 'B'], nodes: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], edges: [{ source: 'A', target: 'B', directed: false }] }
async function inspect(dash: string, cap = 'butt'): Promise<PaintEvidence> {
  const page = await browser.newPage()
  try {
    await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><rect x="20" y="20" width="60" height="60" fill="white" stroke="black"/><text x="50" y="55" text-anchor="middle">A</text><rect x="200" y="20" width="60" height="60" fill="white" stroke="black"/><text x="230" y="55" text-anchor="middle">B</text><path class="relation" d="M80 50H200" fill="none" stroke="black" stroke-width="2" stroke-dasharray="${dash}" stroke-linecap="${cap}"/></svg>`)
    return await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected })
  } finally { await page.close() }
}

test('zero-gap reveal masks and gaps beyond the actual route remain solid paint', async () => {
  for (const pattern of ['0 0 120 0', '120 120', '0 0']) {
    const paint = await inspect(pattern)
    expect((paint.connections[0] as any)?.strokePattern).toBe('solid')
    expect(paint.checks.find(row => row.criterion === 'painted-relationships')?.status).toBe('passed')
  }
})

test('visible dash gaps are distinct from a zero-ink butt-capped path', async () => {
  expect(((await inspect('12 12')).connections[0] as any)?.strokePattern).toBe('dotted')
  const invisible = await inspect('0 120')
  expect(invisible.connections).toHaveLength(0)
  expect(invisible.checks.find(row => row.criterion === 'painted-relationships')?.status).toBe('failed')
})

test('unresolved percentage dash lengths cannot certify relationships', async () => {
  const paint = await inspect('2% 2%')
  expect((paint.connections[0] as any)?.strokePattern).toBe('unavailable')
  expect(paint.checks.find(row => row.criterion === 'painted-relationships')?.status).toBe('unavailable')
})
