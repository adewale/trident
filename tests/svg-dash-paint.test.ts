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

test('an omitted marker orient cannot borrow automatic rotation on a vertical edge', async () => {
  const page = await browser.newPage()
  try {
    const drawing = (orientation: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="300" viewBox="0 0 100 300"><defs><marker id="arrow" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="8" refY="4" markerUnits="userSpaceOnUse" ${orientation}><path d="M0 0L8 4L0 8Z" fill="black"/></marker></defs><rect x="20" y="20" width="60" height="60" fill="white" stroke="black"/><text x="50" y="55" text-anchor="middle">A</text><rect x="20" y="200" width="60" height="60" fill="white" stroke="black"/><text x="50" y="235" text-anchor="middle">B</text><path class="relation" d="M50 80V200" fill="none" stroke="black" marker-end="url(#arrow)"/></svg>`
    const requested = { ...expected, edges: [{ source: 'A', target: 'B', directed: true, endMarker: 'arrow' }] }
    await page.setContent(drawing('orient="auto"'))
    const automatic = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected: requested }) as PaintEvidence
    expect(automatic.checks.find(row => row.criterion === 'painted-relationship-markers')?.status).toBe('passed')
    // SVG's omitted orient is fixed 0deg: this triangle points right, while
    // the declared relation and actual stem point down.
    await page.setContent(drawing(''))
    const fixed = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected: requested }) as PaintEvidence
    expect(fixed.checks.find(row => row.criterion === 'painted-relationship-markers')?.status).toBe('unavailable')
    expect(fixed.passed).toBe(false)
    await page.evaluate(() => {
      const svg = document.querySelector('svg')!; svg.setAttribute('width', '300'); svg.setAttribute('height', '100'); svg.setAttribute('viewBox', '0 0 300 100')
      const body = svg.querySelectorAll('rect')[1]!; body.setAttribute('x', '200'); body.setAttribute('y', '20')
      const label = svg.querySelectorAll('text')[1]!; label.setAttribute('x', '230'); label.setAttribute('y', '55')
      svg.querySelector('.relation')!.setAttribute('d', 'M80 50H200')
    })
    const aligned = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected: requested }) as PaintEvidence
    expect(aligned.checks.find(row => row.criterion === 'painted-relationship-markers')?.status).toBe('passed')
  } finally { await page.close() }
})
