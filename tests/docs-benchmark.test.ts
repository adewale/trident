import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { publicSvgBrowserAction } from '../unified/public-svg-browser.ts'
import { chromiumExecutable } from './helpers/environment.ts'

test('docs clocks await the real public return and exclude post-call cleanup; failures earn no successful sample', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  try {
    const page = await browser.newPage()
    await page.evaluate(() => {
      const host = globalThis as any
      host.fixture = async (source: string) => {
        if (source === 'throw') throw Error('Actual public rejection')
        await new Promise(resolve => setTimeout(resolve, 25))
        return source === 'bad' ? 'not SVG' : '<svg xmlns="http://www.w3.org/2000/svg"/>'
      }
      host.__communityAfterCall = () => { host.cleanupAt = performance.now(); const end = performance.now() + 40; while (performance.now() < end) {} }
    })
    await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine: { kind: 'function', global: 'fixture' } })
    const started = performance.now()
    const value = await page.evaluate(publicSvgBrowserAction, { type: 'measure-docs', source: 'accepted', id: 'actual' })
    const wallMs = performance.now() - started
    expect(wallMs - value.durationMs).toBeGreaterThanOrEqual(30)
    expect(value.status).toBe('passed')
    expect(value.durationMs).toBeGreaterThanOrEqual(20)
    expect(value.bytes).toBeGreaterThan(0)
    const cleanupElapsed = await page.evaluate(() => performance.now() - (globalThis as any).cleanupAt)
    expect(cleanupElapsed).toBeGreaterThanOrEqual(35)
    for (const source of ['bad', 'throw']) {
      const rejected = await page.evaluate(publicSvgBrowserAction, { type: 'measure-docs', source, id: source })
      expect(rejected.status).toBe('failed')
      expect(rejected.durationMs).toBeUndefined()
    }
  } finally { await browser.close() }
})
