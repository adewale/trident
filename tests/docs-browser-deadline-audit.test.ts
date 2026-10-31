import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium, type Browser, type Page } from 'playwright'
import { callDocsPage } from '../unified/docs-runtime.ts'
import { publicSvgBrowserAction } from '../unified/public-svg-browser.ts'
import { docsPublicRejection } from '../unified/docs-invalid-source.ts'
import { chromiumExecutable } from './helpers/environment.ts'

let browser: Browser
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })

async function controlledPage(): Promise<Page> {
  const page = await browser.newPage()
  await page.clock.install()
  await page.evaluate(() => {
    const host = globalThis as any
    host.configuration = 'fresh'
    host.__fidelityCommunity = {
      kind: 'controlled',
      render: (source: string) => source === 'pending' ? new Promise(resolve => {
        host.finishLate = () => { host.configuration = 'late-first-call'; resolve('<svg xmlns="http://www.w3.org/2000/svg"/>') }
      }) : '<svg xmlns="http://www.w3.org/2000/svg"><text>' + host.configuration + '</text></svg>',
    }
  })
  return page
}

test('the inner browser deadline is an interruption rather than native source rejection or an output return', async () => {
  const page = await controlledPage()
  try {
    const pending = page.evaluate(publicSvgBrowserAction, { type: 'measure-docs', source: 'pending', id: 'first', retainSvg: true })
    await page.waitForFunction(() => !!(globalThis as any).finishLate)
    await page.clock.runFor(15_001)
    const result = await pending
    expect(result).toMatchObject({ status: 'blocked', collectionDeadlineExceeded: true })
    expect(result.nativeError).toBeUndefined()
    expect(result.durationMs).toBeUndefined()
    expect(result.svg).toBeUndefined()
    expect(docsPublicRejection({ id: 'pending', family: 'fixture', source: 'pending' }, false, result.nativeError).outcome).toBe('unavailable')
    // Independent causal counterexample: native work still exists after the
    // deadline and can change this page even after the adapter's cleanup.
    await page.evaluate(() => (globalThis as any).finishLate())
    expect(await page.evaluate(() => (globalThis as any).configuration)).toBe('late-first-call')
  } finally { await page.close() }
})

test('warmup and scored call deadlines discard their page before a fresh source can execute', async () => {
  for (const id of ['warmup_1_0', 'docs_1_0']) {
    const page = await controlledPage()
    const pending = callDocsPage(page, publicSvgBrowserAction, { type: 'measure-docs', source: 'pending', id, retainSvg: true })
    await page.waitForFunction(() => !!(globalThis as any).finishLate)
    await page.clock.runFor(15_001)
    expect(await pending).toMatchObject({ status: 'blocked', collectionDeadlineExceeded: true })
    expect(page.isClosed()).toBe(true)
    const next = await controlledPage()
    try {
      const value = await callDocsPage(next, publicSvgBrowserAction, { type: 'measure-docs', source: 'next', id: id + '_next', retainSvg: true })
      expect(value).toMatchObject({ status: 'passed', svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>fresh</text></svg>' })
    } finally { await next.close() }
  }
})

test('a settled native exception with the same message cannot masquerade as the collector deadline', async () => {
  const page = await controlledPage()
  try {
    await page.evaluate(() => { (globalThis as any).__fidelityCommunity.render = () => { throw Error('Public render exceeded15s') } })
    const result = await callDocsPage(page, publicSvgBrowserAction, { type: 'measure-docs', source: 'native-error', id: 'native-error' })
    expect(result).toMatchObject({ status: 'failed', nativeError: { name: 'Error', message: 'Public render exceeded15s' } })
    expect(result.collectionDeadlineExceeded).toBeUndefined()
    expect(page.isClosed()).toBe(false)
  } finally { await page.close() }
})
