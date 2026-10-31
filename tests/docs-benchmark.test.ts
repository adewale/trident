import { expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { docsArtifactServer, docsRoundOrder } from '../unified/docs-benchmark.ts'
import { chromium } from 'playwright'
import { publicSvgBrowserAction } from '../unified/public-svg-browser.ts'
import { chromiumExecutable } from './helpers/environment.ts'

test('docs rounds balance pairwise order after each round pair and positions over a full rotation', () => {
  for (const peers of [['a', 'b'], ['b', 'a'], ['a', 'b', 'c'], ['c', 'b', 'a'], ['a', 'b', 'c', 'd']]) {
    const rounds = Array.from({ length: 2 * peers.length }, (_, index) => docsRoundOrder(peers, index + 1))
    for (let position = 0; position < peers.length; position++) {
      for (const project of peers) expect(rounds.filter(round => round[position] === project)).toHaveLength(2)
    }
    for (let prefix = 1; prefix <= rounds.length; prefix++) {
      for (let a = 0; a < peers.length; a++) for (let b = a + 1; b < peers.length; b++) {
        const preceding = rounds.slice(0, prefix).filter(round => round.indexOf(peers[a]!) < round.indexOf(peers[b]!)).length
        expect(Math.abs(2 * preceding - prefix)).toBeLessThanOrEqual(prefix % 2)
      }
    }
    for (const round of rounds) expect([...round].sort()).toEqual([...peers].sort())
    expect(peers).toEqual(rounds[0]!)
  }
  expect(Array.from({ length: 6 }, (_, index) => docsRoundOrder(['a', 'b', 'c'], index + 1).join(''))).toEqual(['abc', 'cba', 'bca', 'acb', 'cab', 'bac'])
  expect(docsRoundOrder(['a', 'b'], 2)).toEqual(['b', 'a'])
  expect(docsRoundOrder([], 1)).toEqual([])
  expect(docsRoundOrder(['a'], 3)).toEqual(['a'])
})

test('a method name supplies no option contract; reviewed browser mappings reach the actual public renderer', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  try {
    const page = await browser.newPage()
    await page.evaluate(() => {
      const host = globalThis as any
      host.calls = 0
      host.publicRenderer = { renderMermaidSVG(_source: string, options: any) { host.calls++; host.actualOptions = options; return '<svg xmlns="http://www.w3.org/2000/svg"/>' } }
      host.publicPele = { render(_source: string, options: any) { host.actualOptions = options; return { svg: '<svg xmlns="http://www.w3.org/2000/svg"/>' } } }
    })
    expect((await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine: { kind: 'beautiful', global: 'publicRenderer' } })).fontOptions).toBe(false)
    expect((await page.evaluate(publicSvgBrowserAction, { type: 'render', source: 'source', id: 'unmapped', options: { fontSize: 24 } })).kind).toBe('unavailable')
    expect(await page.evaluate(() => (globalThis as any).calls)).toBe(0)
    await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine: { kind: 'beautiful', global: 'publicRenderer' }, fontSizePath: ['style', 'roles', 'node', 'fontSize'] })
    expect((await page.evaluate(publicSvgBrowserAction, { type: 'render', source: 'source', id: 'mapped', options: { fontSize: 24 } })).kind).toBe('returned')
    expect(await page.evaluate(() => (globalThis as any).actualOptions)).toEqual({ style: { roles: { node: { fontSize: 24 } } } })
    await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine: { kind: 'pele', global: 'publicPele' }, fontSizePath: ['fontSize'] })
    await page.evaluate(publicSvgBrowserAction, { type: 'render', source: 'source', id: 'pele', options: { fontSize: 18 } })
    expect(await page.evaluate(() => (globalThis as any).actualOptions)).toEqual({ fontSize: 18 })
  } finally { await browser.close() }
})

test('UTF-8 public bundles initialize before docs clocks await the real public return and exclude post-call cleanup; failures earn no successful sample', async () => {
  const root = mkdtempSync(join(tmpdir(), 'docs-artifact-'))
  const server = docsArtifactServer(root, { root })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const origin = 'http://127.0.0.1:' + (server.address() as { port: number }).port
  writeFileSync(join(root, 'public.js'), `const actualCjkRange=/[一-龥]/u;globalThis.fixture=async source=>{if(source==='throw')throw Error('Actual public rejection');await new Promise(resolve=>setTimeout(resolve,25));return source==='bad'?'not SVG':'<svg xmlns="http://www.w3.org/2000/svg"/>'}`)
  writeFileSync(join(root, 'addon.mjs'), 'export default {id:"authored-backend"}')
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  try {
    const page = await browser.newPage()
    await page.goto(origin + '/blank')
    await page.addScriptTag({ url: origin + '/public.js' })
    await page.evaluate(() => {
      const host = globalThis as any
      host.__communityAfterCall = () => { host.cleanupAt = performance.now(); const end = performance.now() + 40; while (performance.now() < end) {} }
    })
    await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine: { kind: 'function', global: 'fixture' } })
    const started = performance.now()
    const value = await page.evaluate(publicSvgBrowserAction, { type: 'measure-docs', source: 'accepted', id: 'actual', retainSvg: true })
    const wallMs = performance.now() - started
    expect(wallMs - value.durationMs).toBeGreaterThanOrEqual(30)
    expect(value.status).toBe('passed')
    expect(value.durationMs).toBeGreaterThanOrEqual(20)
    expect(value.bytes).toBeGreaterThan(0)
    expect(value.svg).toBe('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const cleanupElapsed = await page.evaluate(() => performance.now() - (globalThis as any).cleanupAt)
    expect(cleanupElapsed).toBeGreaterThanOrEqual(35)
    for (const source of ['bad', 'throw']) {
      const rejected = await page.evaluate(publicSvgBrowserAction, { type: 'measure-docs', source, id: source })
      expect(rejected.status).toBe('failed')
      expect(rejected.durationMs).toBeUndefined()
    }
    await page.evaluate(() => {
      let registered = false
      ;(globalThis as any).declaredCore = { initialize() {}, async registerExternalDiagrams(plugins: any[]) { registered = plugins[0]?.id === 'authored-backend' }, render() { if (!registered) throw Error('Declared backend was not registered'); return { svg: '<svg xmlns="http://www.w3.org/2000/svg"/>' } } }
    })
    await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine: { kind: 'mermaid', global: 'declaredCore' }, addonUrl: origin + '/__addon/addon.mjs' })
    const addonRender = await page.evaluate(publicSvgBrowserAction, { type: 'render', source: 'backend-owned diagram', id: 'addon' })
    expect(addonRender.kind).toBe('returned')
  } finally { await browser.close(); await new Promise<void>(done => server.close(() => done())); rmSync(root, { recursive: true, force: true }) }
})


import { withDocsDeadline, closeDocsContext } from '../unified/docs-benchmark.ts'
test('script loading and cleanup have host deadlines and close HTTP connections before awaiting context teardown', async () => {
  let cancelled = 0
  await expect(withDocsDeadline(() => new Promise<never>(() => {}), () => { cancelled++ }, 5)).rejects.toThrow('host deadline')
  expect(cancelled).toBe(1)
  const events: string[] = []
  const context = { close: async () => { events.push('context'); await new Promise<never>(() => {}) } }
  const server = { closeAllConnections: () => { events.push('connections') }, close: (done: () => void) => { events.push('server'); done() } }
  await expect(closeDocsContext(context, server as any, 5)).rejects.toThrow('host deadline')
  expect(events[0]).toBe('connections')
  expect(events).toContain('server')
})
