import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import type { Page } from 'playwright'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
/** Serve the actual distribution with declared UTF-8. Classic scripts inherit
 * the document encoding: omitting it can turn Unicode regex ranges into syntax
 * errors before the package's public global is assigned. */
export function docsArtifactServer(root: string, addon?: { root: string }) {
  root = resolve(root)
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    if (url.pathname === '/blank' || url.pathname === '/observer') { response.setHeader('content-type', 'text/html; charset=utf-8'); if (url.pathname === '/observer') response.setHeader('content-security-policy', "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data: blob:; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'"); response.end('<!doctype html><meta charset="utf-8"><body>'); return }
    const backend = addon && url.pathname.startsWith('/__addon/')
    const base = backend ? resolve(addon.root) : root
    let file: string
    try { file = resolve(base, decodeURIComponent(url.pathname.slice(backend ? '/__addon/'.length : 1))) } catch { response.writeHead(400).end(); return }
    if (!file.startsWith(base + sep) || !existsSync(file)) { response.writeHead(404).end(); return }
    response.setHeader('content-type', ({ '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.json': 'application/json', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.ttf': 'font/ttf' } as Record<string, string>)[extname(file)] ?? 'application/octet-stream')
    try { response.end(readFileSync(file)) } catch { response.writeHead(404).end() }
  })
}

/** Includes asynchronous module/addon initialization, whose evaluate promises
 * have no Playwright timeout. A stalled renderer cannot hold the campaign open. */
export async function callDocsPage(page: Pick<Page, 'evaluate' | 'close'>, action: (input: any) => Promise<any>, input: any, deadlineMs = 20_000): Promise<any> {
  return withDocsDeadline(() => page.evaluate(action, input), () => { void page.close().catch(() => {}) }, deadlineMs)
}

export async function withDocsDeadline<T>(operation: () => Promise<T>, cancel: () => void, deadlineMs = 20_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { return await Promise.race([operation(), new Promise<never>((_, reject) => { timer = setTimeout(() => { cancel(); reject(Error('Browser call exceeded its declared host deadline')) }, deadlineMs) })]) }
  finally { if (timer) clearTimeout(timer) }
}

/** Drop keep-alive requests before closing pages. A stuck close remains a
 * recorded harness gap instead of holding every later project open. */
export async function closeDocsContext(context: { close: () => Promise<void> }, server: ReturnType<typeof docsArtifactServer>, deadlineMs = 20_000) {
  server.closeAllConnections?.()
  try { await withDocsDeadline(() => context.close(), () => server.closeAllConnections?.(), deadlineMs) }
  finally { server.closeAllConnections?.(); await withDocsDeadline(() => new Promise<void>(done => server.close(() => done())), () => server.closeAllConnections?.(), deadlineMs) }
}

export async function initializeDocsPage(page: Page, engine: any, origin: string) {
  await page.goto(origin + '/blank')
  if (engine.kind === 'franken' || engine.kind === 'merman') await callDocsPage(page, publicSvgBrowserAction, { type: 'initialize-module', kind: engine.kind, url: origin + '/' + engine.entry, wasm: origin + '/' + engine.wasm })
  else {
    await withDocsDeadline(() => page.addScriptTag({ url: origin + '/' + engine.entry, ...(engine.scriptType ? { type: engine.scriptType } : {}) }), () => { void page.close().catch(() => {}) })
    await callDocsPage(page, publicSvgBrowserAction, { type: 'initialize-global', engine, addonUrl: engine.zenuml ? origin + '/__addon/' + engine.zenuml.entry : undefined })
  }
}
