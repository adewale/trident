import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { docsArtifactServer, docsObserverPolicy, closeDocsContext } from '../unified/docs-runtime.ts'
import { readDocsResources, routeDocsResource } from '../unified/docs-resources.ts'
import { inspectFidelityPaint } from '../fidelity/paint.ts'
import { chromiumExecutable } from './helpers/environment.ts'

test('the isolated observer can decode exact pinned images while scripts and other remote assets remain blocked', async () => {
  const resources = readDocsResources(), urls = resources.resources.map((item: any) => item.url), server = docsArtifactServer(import.meta.dir, undefined, urls)
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const origin = 'http://127.0.0.1:' + (server.address() as any).port, browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }), context = await browser.newContext(), page = await context.newPage()
  try {
    await context.route('**/*', route => routeDocsResource(route, origin, resources))
    await page.goto(origin + '/observer')
    const url = urls[0]!
    await page.setContent('<script>window.forgedObserver=true</script><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><image href="' + url + '" width="64" height="64"/></svg>')
    const paint = await page.evaluate(inspectFidelityPaint, { family: 'flowchart', expected: { labels: [] }, paint: { images: [{ href: url, count: 1 }] } })
    expect(paint.checks.find(check => check.criterion === 'embedded-images')?.status).toBe('passed')
    expect(await page.evaluate(() => (globalThis as any).forgedObserver)).toBeUndefined()
    expect(await page.evaluate(async (url: string) => { const image = new Image(); image.src = url + '?not-frozen'; try { await image.decode(); return true } catch { return false } }, url)).toBe(false)
  } finally { await closeDocsContext(context, server); await browser.close() }
}, 30_000)

test('resource policy sources cannot introduce another CSP directive', () => {
  expect(() => docsObserverPolicy(["https://example.test/image.svg; script-src *"])).toThrow()
  expect(() => docsObserverPolicy(['https://user:password@example.test/image.svg'])).toThrow()
  expect(docsObserverPolicy(['https://example.test/image.svg'])).toContain("script-src 'none'")
})
