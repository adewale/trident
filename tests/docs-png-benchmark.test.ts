import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { chromiumExecutable } from './helpers/environment.ts'
import { publicDocsPngAction } from '../unified/docs-png-browser.ts'
import { inspectPng } from '../unified/png-inspection.ts'

test('PNG docs export awaits actual encoded bytes, retains intrinsic dimensions and rejects invalid SVG', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  try {
    const page = await browser.newPage()
    await page.evaluate(() => {
      ;(globalThis as any).__fidelityCommunity = {
        render: async (source: string) => {
          await new Promise(done => setTimeout(done, 20))
          if (source === 'throw') throw Error('Public API rejected source')
          if (source === 'bad') return 'not SVG'
          if (source === 'huge') return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16385 1"/>'
          return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect width="120" height="60" fill="white"/>' + (source === 'blank' ? '' : '<circle cx="60" cy="30" r="20" fill="black"/>') + '</svg>'
        },
      }
    })
    const rendered = await page.evaluate(publicDocsPngAction, { source: 'circle', id: 'circle' })
    expect(rendered.status).toBe('ok')
    expect(rendered.totalMs).toBeGreaterThanOrEqual(20)
    expect(rendered.totalMs).toBeGreaterThanOrEqual(Object.values(rendered.stages).reduce((a: number, b: any) => a + b, 0) as number)
    const bytes = Uint8Array.from(rendered.png)
    expect(bytes.length).toBe(rendered.outputBytes)
    expect(inspectPng(bytes, true)).toMatchObject({ width: 120, height: 60, findings: [], distinctCompositedColors: 2 })
    const blank = await page.evaluate(publicDocsPngAction, { source: 'blank', id: 'blank' })
    expect(inspectPng(Uint8Array.from(blank.png), true).findings.length).toBeGreaterThan(0)
    const huge = await page.evaluate(publicDocsPngAction, { source: 'huge', id: 'huge' })
    expect(huge.status).toBe('blocked')
    expect(huge.stage).toBe('raster-budget')
    expect(huge.png).toBeUndefined()
    for (const source of ['throw', 'bad']) {
      const result = await page.evaluate(publicDocsPngAction, { source, id: source })
      expect(result.status).toBe('error')
      expect(result.totalMs).toBeUndefined()
      expect(result.png).toBeUndefined()
    }
  } finally {
    await browser.close()
  }
})
