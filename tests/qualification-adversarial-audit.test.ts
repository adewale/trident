import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { chromiumExecutable } from './helpers/environment.ts'

let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })

async function calibratedDash(pathLength: number, dash: string, expectedStroke: string) {
  const page = await browser.newPage()
  try {
    await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><rect width="300" height="100" fill="white"/><rect x="20" y="20" width="60" height="60" fill="white" stroke="black"/><text x="50" y="55" text-anchor="middle">A</text><rect x="200" y="20" width="60" height="60" fill="white" stroke="black"/><text x="230" y="55" text-anchor="middle">B</text><path class="relation" d="M80 50H200" pathLength="${pathLength}" fill="none" stroke="black" stroke-width="2" stroke-dasharray="${dash}" stroke-linecap="round"/></svg>`)
    const expected = { labels: ['A', 'B'], nodes: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], edges: [{ source: 'A', target: 'B', directed: false }], facts: { 'edge-appearance': [{ source: 'A', target: 'B', stroke: expectedStroke, markerStart: 'none', markerEnd: 'none' }] } }
    const observed = await inspectSvgDrawing(page, { family: 'flowchart', source: 'flowchart LR\nA --- B', expected })
    // Independently sample the actual browser-rasterized edge centreline. This
    // authored SVG is a qualification control; no Mermaid/project API is called.
    const pixels = await page.evaluate(async () => {
      const image = new Image(), svg = document.querySelector('svg')!
      image.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg))
      await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 100
      const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0)
      const row = context.getImageData(90, 50, 100, 1).data
      let dark = 0, white = 0
      for (let x = 0; x < 100; x++) { if (row[x * 4]! < 100) dark++; if (row[x * 4]! > 240) white++ }
      return { dark, white }
    })
    return { observed, pixels }
  } finally { await page.close() }
}

test('pathLength calibration keeps actual round-cap coverage in the same units as dash lengths', async () => {
  // Real length120 / declared12 scales .5/.5 into5px/5px. Two-pixel round
  // strokes leave visible3px gaps; treating their cap radius as1 declared unit
  // would incorrectly erase those gaps and certify solid paint.
  const dashed = await calibratedDash(12, '.5 .5', 'solid')
  expect(dashed.pixels.dark).toBeGreaterThan(0)
  expect(dashed.pixels.white).toBeGreaterThan(0)
  expect((dashed.observed.connections[0] as any).strokePattern).toBe('dotted')
  expect(dashed.observed.checks.find(check => check.criterion === 'source-fact:edge-appearance')?.status).toBe('failed')

  // Inverse calibration scales20/5 into2px/.5px. Actual round caps bridge
  // every gap, so the visible stroke is continuous despite numeric dash gaps.
  const solid = await calibratedDash(1200, '20 5', 'solid')
  expect(solid.pixels.dark).toBe(100)
  expect(solid.pixels.white).toBe(0)
  expect((solid.observed.connections[0] as any).strokePattern).toBe('solid')
  expect(solid.observed.checks.find(check => check.criterion === 'source-fact:edge-appearance')?.status).toBe('passed')
}, 30_000)
