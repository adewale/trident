import { executionEnvironment } from './execution-environment.ts'
import { campaignPlan, assertTimingCollection } from './campaign-plan.ts'
import { atomicWrite, reserveResultDirectory, timingSession } from './result-storage.ts'
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { performance } from 'node:perf_hooks'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { comparisonProjects } from './lineage.ts'
import { refreshBenchmarkVersions, plannedBenchmarkVersion, verifiedBenchmarkBinding, verifyBenchmarkArtifact, latestBenchmarkRenderingArtifact } from './benchmark-versions.ts'
import { prepareCommunity, communityDeclaresOutput } from './community.ts'
import { prepareCommunityBrowsers, sealCommunityBrowser, type PreparedCommunityBrowser } from './community-browser.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { communityCatalogFile, tridentDirectory } from './trident-paths.ts'
import { assertBenchmarkExecutionAllowed } from '../portable/ci-policy.ts'
import { defaultChromium } from './benchmark-context.ts'
import { davebenchSvgValidity, errorPatternSources, pngBytesValidity, rawStatements } from './davebench-validity.ts'
import { watchMemory } from './process-memory.ts'
import { killCommunityProcess, spawnCommunityProcess } from './community-process.ts'

import { davebenchInputs } from './davebench-inputs.ts'
export { davebenchInputs } from './davebench-inputs.ts'

/** Runs in the renderer page. Returns counters and an admission reason only;
 * outputs never leave the page. The clock stops before admission checks. */
export async function davebenchBrowserCall(input: { source: string; id: string; format: string; errorPatterns?: [string, string][]; raw?: { header?: string; statements: string[] } }) {
  const host = globalThis as any, state = host.__fidelityCommunity, started = performance.now()
  let outcome = 'completed', svgText: string | undefined, pngValue: unknown, pngBytes = 0, error: string | undefined
  const parseSvg = (text: string) => {
    // Match the shared XML validator's admission of HTML-serialized void elements.
    const parser = new DOMParser()
    let document = parser.parseFromString(text, 'image/svg+xml')
    if (document.querySelector('parsererror')) document = parser.parseFromString(text.replace(/<(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)\b([^<>]*?)\/?>/gi, '<$1$2/>'), 'image/svg+xml')
    const svg = document.documentElement
    if (document.querySelector('parsererror') || svg.localName !== 'svg' || svg.namespaceURI !== 'http://www.w3.org/2000/svg') throw Error('Malformed SVG document')
    return svg
  }
  const canvasSize = (svg: Element) => {
    const box = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
    const size = (name: string) => { const value = svg.getAttribute(name)?.trim() ?? ''; return /^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px|pt|pc|cm|mm|in|q)?$/i.test(value) ? Number.parseFloat(value) : NaN }
    return box?.length === 4 && box.every(Number.isFinite) && box[2]! > 0 && box[3]! > 0 ? { width: box[2]!, height: box[3]! } : { width: size('width'), height: size('height') }
  }
  try {
    if (input.format === 'png' && host.__davebenchNativePng) {
      pngValue = await host.__davebenchNativePng(input.source, input.id, 'png')
    } else {
      const value = await state.render(input.source, input.id)
      svgText = typeof value === 'string' ? value : typeof value?.svg === 'string' ? value.svg : undefined
      if (input.format === 'png') {
        // This parsing is part of conversion, not a drawing assessment.
        const svg = parseSvg(svgText ?? '')
        const size = canvasSize(svg), width = Math.ceil(size.width), height = Math.ceil(size.height)
        if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) throw Error('zero-size SVG')
        svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height)); svg.style.maxWidth = 'none'
        const image = new Image()
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg))
        await image.decode()
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(image, 0, 0)
        await new Promise<void>((done, reject) => canvas.toBlob(blob => { pngBytes = blob?.size ?? 0; blob ? done() : reject(Error('PNG encoding failed')) }, 'image/png'))
        canvas.width = 0; canvas.height = 0
      }
    }
  } catch (thrown: any) { outcome = 'error'; error = (input.format === 'png' && svgText !== undefined ? 'PNG conversion: ' : '') + String(thrown?.message ?? thrown ?? 'unknown error').split('\n')[0]!.slice(0, 160) }
  const ms = performance.now() - started
  let invalid: string | undefined
  if (outcome === 'completed') {
    const patterns = (input.errorPatterns ?? []).map(([source, flags]) => new RegExp(source, flags))
    const phrase = (text: string) => {
      const head = text.replace(/\s+/g, ' ').trim().slice(0, 400)
      for (const pattern of patterns) { const match = pattern.exec(head); if (match && !input.source.toLowerCase().includes(match[0].trim().toLowerCase())) return match[0].trim() }
      return undefined
    }
    try {
      if (pngValue !== undefined || (input.format === 'png' && host.__davebenchNativePng)) {
        const value: any = pngValue
        const bytes = value instanceof Blob ? new Uint8Array(await value.arrayBuffer()) : value instanceof ArrayBuffer ? new Uint8Array(value) : ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : typeof value === 'string' && value.startsWith('data:image/png;base64,') ? Uint8Array.from(atob(value.slice(22)), c => c.charCodeAt(0)) : undefined
        const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
        if (!bytes) invalid = 'unrecognised PNG return'
        else if (bytes.length < 33 || signature.some((byte, index) => bytes[index] !== byte) || String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR') invalid = 'not a PNG'
        else if (bytes.length > 64 * 1024 * 1024) invalid = 'PNG exceeds the 64 MiB validation budget'
        else {
          const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
          if (!(view.getUint32(16) > 0 && view.getUint32(20) > 0)) invalid = 'zero-size PNG'
          else if (view.getUint32(16) * view.getUint32(20) > 16 * 1024 * 1024) invalid = 'PNG exceeds the 16 megapixel validation budget'
          else { const image = await createImageBitmap(new Blob([new Uint8Array(bytes)])); image.close() }
        }
      } else if (typeof svgText !== 'string') invalid = 'non-SVG return'
      else if (!svgText.trim()) invalid = 'no SVG document'
      else {
        const svg = parseSvg(svgText)
        const { width, height } = canvasSize(svg)
        if (!svg) invalid = 'no SVG document'
        else if (svg.getAttribute('aria-roledescription') === 'error') invalid = 'error placeholder'
        else if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) invalid = 'zero-size SVG'
        else if (input.format === 'png' && !(pngBytes > 0)) invalid = 'empty PNG encoding'
        else {
          for (const node of svg.querySelectorAll('style,script')) node.remove()
          const found = phrase(svg.textContent ?? '')
          if (found) invalid = 'error message: ' + found
          else if (input.raw) {
            // The fallback check of davebench-validity.ts (fallbackShown), on drawn text only.
            for (const node of svg.querySelectorAll('title,desc,metadata')) node.remove()
            const parts: string[] = [], walker = document.createTreeWalker(svg, NodeFilter.SHOW_TEXT)
            while (walker.nextNode()) parts.push(walker.currentNode.nodeValue ?? '')
            const text = parts.join(' ').replace(/[─-▟]/g, ' ').replace(/\s+/g, ' ').trim()
            const header = input.raw.header, padded = ' ' + text + ' '
            const shown = input.raw.statements.filter(statement => text.includes(statement))
            if (header && padded.includes(' ' + header + ' ')) invalid = 'fallback render: source header shown: ' + header
            else if (shown.length >= 3 && shown.length * 2 >= input.raw.statements.length) invalid = `fallback render: ${shown.length} of ${input.raw.statements.length} source statements shown`
          }
        }
      }
    } catch (error) { invalid = 'admission check failed: ' + String(error).slice(0, 120) }
    if (invalid) outcome = 'invalid'
  }
  try { host.__communityAfterCall?.() } catch {}
  for (const node of document.querySelectorAll('body > div:not([data-community-host])')) node.remove()
  return invalid ? { outcome, ms, invalid } : error ? { outcome, ms, error } : { outcome, ms }
}

import { davebenchAdmissionProfile, davebenchAdmission, davebenchSummary, davebenchRankings, davebenchRankingRule, type DavebenchRun } from './davebench-model.ts'
export { davebenchAdmission, davebenchSummary, davebenchRankings, davebenchRankingRule, boundaryKind, type DavebenchRun } from './davebench-model.ts'
type Run = DavebenchRun

function rankingMarkdown(rankings: ReturnType<typeof davebenchRankings>, planned: number, blocked: { project: string; reason: string }[]) {
  const lines = ['# DaveBench rankings', '', `${planned} examples per format; three runs after 30 warm-ups. Outputs are discarded without assessment.`, '', ...Object.values(davebenchRankingRule).map(rule => '- ' + rule), '']
  for (const format of ['svg', 'png'] as const) {
    lines.push('## ' + format.toUpperCase(), '', '| Rank | Project | Version | Completed | Failed | Median total seconds | Path |', '|---:|---|---|---:|---:|---:|---|')
    for (const row of rankings[format]) lines.push(`| ${row.rank} | ${row.project} | ${row.version} | ${row.completed} | ${row.failed} | ${(row.medianTotalMs === null ? '—' : (row.medianTotalMs / 1000).toFixed(3))} | ${row.boundary.includes('CLI') ? 'Native CLI' : 'Browser API'} |`)
    lines.push('')
  }
  if (blocked.length || rankings.unranked.length) {
    lines.push('## Unranked', '')
    for (const row of blocked) lines.push('- ' + row.project + ': ' + row.reason.replaceAll('\n', ' '))
    for (const row of rankings.unranked) lines.push('- ' + row.project + ' (' + row.format + '): ' + row.reason)
  }
  return lines.join('\n') + '\n'
}

export async function browserHost(browser: Browser, peer: PreparedCommunityBrowser, format: string, assets?: ReturnType<typeof sealCommunityBrowser>) {
  const engine = peer.browser!, root = resolve(engine.root)
  const files = (assets ?? sealCommunityBrowser(engine))(engine)
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    if (url.pathname === '/blank') { response.setHeader('content-type', 'text/html'); response.end('<!doctype html><body>'); return }
    const addon = url.pathname.startsWith('/zenuml/') && engine.zenuml
    const base = addon ? resolve(engine.zenuml!.root) : root
    let file: string
    try { file = resolve(base, decodeURIComponent(url.pathname.slice(addon ? 8 : 1))) } catch { response.writeHead(404).end(); return }
    const bytes = file.startsWith(base + sep) ? files.get(file) : undefined
    if (!bytes) { response.writeHead(404).end(); return }
    response.setHeader('content-type', ({ '.wasm': 'application/wasm', '.css': 'text/css' } as Record<string, string>)[extname(file)] ?? 'text/javascript')
    response.end(bytes)
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const origin = 'http://127.0.0.1:' + (server.address() as { port: number }).port
  const open = async (): Promise<{ context: BrowserContext; page: Page }> => {
    const context = await browser.newContext(), page = await context.newPage()
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
    await page.goto(origin + '/blank')
    if (engine.kind === 'franken' || engine.kind === 'merman') await page.evaluate(publicSvgBrowserAction, { type: 'initialize-module', kind: engine.kind, url: origin + '/' + engine.entry, wasm: origin + '/' + engine.wasm })
    else {
      if (engine.scriptType === 'module') await page.addScriptTag({ url: origin + '/' + engine.entry, type: 'module' })
      else await page.addScriptTag({ content: files.get(resolve(engine.root, engine.entry))!.toString('utf8') })
      await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine, ...(engine.zenuml ? { addonUrl: origin + '/zenuml/' + engine.zenuml.entry } : {}) })
      if (format === 'png' && engine.additionalOutputs?.includes('png')) await page.evaluate(async () => { const host = globalThis as any; host.__davebenchNativePng = await host.__fidelityCommunity.api.createRenderer() })
    }
    return { context, page }
  }
  return { open, close: () => new Promise<void>(done => server.close(() => done())) }
}

let cliScratch: string | undefined
const scratchFile = (name: string) => join(cliScratch ??= mkdtempSync(join(tmpdir(), 'davebench-')), name)

/** Fresh CLI process per call. Output goes to a regular scratch file so native
 * exporters that reopen stdout still work; it is read for admission after the
 * clock stops and then deleted. */
export async function davebenchCliCall(peer: PreparedCommunityBrowser, source: string, format: string, timeoutMs: number) {
  const artifact = peer.artifact!, binding = artifact.outputBindings![format]!
  const output = scratchFile('output.' + format), captured = scratchFile('stdout.' + format)
  rmSync(output, { force: true })
  const stdout = openSync(captured, 'w'), started = performance.now()
  let stderr = ''
  const result = await new Promise<{ outcome: string; ms: number; error?: string }>(done => {
    // Respect explicit stdout '-' bindings; Merman rejects /dev/null as a nonregular output file.
    const child = spawnCommunityProcess(artifact.executable!, binding.args.map(arg => arg.replaceAll('{output}', output)), { detached: process.platform !== 'win32', stdio: ['pipe', stdout, 'pipe'] })
    child.stderr!.on('data', chunk => { if (stderr.length < 4096) stderr += String(chunk) }); child.stdin!.on('error', () => {}); child.stdin!.end(source)
    let timeout = false, memory = false
    const timer = setTimeout(() => { timeout = true; killCommunityProcess(child, 'SIGKILL') }, timeoutMs)
    const unwatch = watchMemory(child.pid, () => { memory = true; killCommunityProcess(child, 'SIGKILL') })
    child.once('error', () => { clearTimeout(timer); unwatch(); done({ outcome: 'error', ms: performance.now() - started }) })
    child.once('close', code => { clearTimeout(timer); unwatch(); const ms = performance.now() - started; done(memory ? { outcome: 'error', ms, error: 'memory limit' } : timeout ? { outcome: 'timeout', ms } : code === 0 ? { outcome: 'completed', ms } : { outcome: 'error', ms, error: (stderr.trim().split('\n').at(-1) || 'exit code ' + code).slice(0, 160) }) })
  })
  closeSync(stdout)
  try {
    if (result.outcome !== 'completed') return result
    const bytes = binding.args.some(arg => arg.includes('{output}')) && existsSync(output) ? readFileSync(output) : readFileSync(captured)
    const validity = format === 'png' ? pngBytesValidity(bytes) : davebenchSvgValidity(bytes.toString('utf8'), source)
    return validity.valid ? result : { ...result, outcome: 'invalid', invalid: validity.reason }
  } finally { rmSync(output, { force: true }); rmSync(captured, { force: true }) }
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('davebench --out FRESH_DIRECTORY [--prepared FILE] [--upstream MERMAID_CHECKOUT] [--projects IDS] [--catalog FROZEN_CATALOG]\nThree runs of every pinned documentation example, SVG and PNG. Reports completion and time only; discards outputs without assessment.'); return }
  assertBenchmarkExecutionAllowed()
  const options = new Map<string, string>()
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]!, value = args[index + 1]
    if (!['--out', '--prepared', '--upstream', '--projects', '--catalog'].includes(key) || !value || options.has(key)) throw Error('davebench --out FRESH_DIRECTORY [--prepared FILE] [--upstream MERMAID_CHECKOUT] [--projects IDS] [--catalog FROZEN_CATALOG]')
    options.set(key, value)
  }
  if (!options.has('--out')) throw Error('Choose --out FRESH_DIRECTORY')
  const out = resolve(options.get('--out')!), upstream = resolve(options.get('--upstream') ?? join(tridentDirectory, '../mermaid'))
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  reserveResultDirectory(out)
  const inventory = davebenchInputs(upstream), recorded = JSON.parse(readFileSync(options.get('--catalog') ?? communityCatalogFile, 'utf8'))
  const enrolled = comparisonProjects(recorded, options.get('--projects')?.split(',') ?? recorded.nodes.map((node: any) => node.id))
  const applicable = recorded.nodes.filter((node: any) => enrolled.included.includes(node.id) && node.benchmark?.outputs.some((format: string) => ['svg', 'png'].includes(format))).map((node: any) => node.id)
  const frozenAudit = options.has('--catalog') ? JSON.parse(readFileSync(join(dirname(resolve(options.get('--catalog')!)), 'versions.json'), 'utf8')) : undefined
  if (frozenAudit && (!frozenAudit.complete || frozenAudit.checkedAt !== recorded.benchmarkVersionsCheckedAt || applicable.some((id: string) => !frozenAudit.rows.some((row: any) => row.project === id && row.component === 'primary' && !row.error)))) throw Error('Frozen catalog has no matching complete version selection')
  const current = frozenAudit ? { catalog: recorded, report: frozenAudit } : await refreshBenchmarkVersions(recorded, applicable), catalog = current.catalog
  writeFileSync(join(out, 'versions.json'), JSON.stringify(current.report, null, 2) + '\n')
  if (!current.report.complete) throw Error('Latest-version selection is incomplete; see ' + join(out, 'versions.json'))
  const nodes = catalog.nodes.filter((node: any) => enrolled.included.includes(node.id) && node.benchmark?.outputs.some((format: string) => ['svg', 'png'].includes(format)))
  if (!nodes.length) throw Error('No applicable SVG/PNG projects selected')
  let prepared: PreparedCommunityBrowser[]
  if (options.has('--prepared')) {
    prepared = JSON.parse(readFileSync(options.get('--prepared')!, 'utf8')).filter((peer: PreparedCommunityBrowser) => nodes.some((node: any) => node.id === peer.node.id))
    for (const peer of prepared) {
      const selected = nodes.find((node: any) => node.id === peer.node.id)!
      verifyBenchmarkArtifact(peer, selected)
      peer.node = selected
    }
  }
  else {
    // Preserve native SVG releases: they may be newer than a browser SDK.
    for (const node of nodes) { if (node.benchmark.adapter !== 'source-cli' && !node.benchmark.cliRelease?.outputs.svg) delete node.benchmark.cliRelease; delete node.benchmark.cli }
    const file = join(out, 'catalog.json'); writeFileSync(file, JSON.stringify({ ...catalog, nodes }))
    const config: any = { root: tridentDirectory, harnessRoot: tridentDirectory, out: join(out, 'preparation'), profile: 'full', rounds: 3, communityCatalogFile: file, communityProjects: nodes.map((node: any) => node.id) }
    prepared = await prepareCommunityBrowsers(await prepareCommunity(config), config)
  }
  for (const peer of prepared) {
    try {
      const artifact = latestBenchmarkRenderingArtifact(peer)
      if (artifact !== peer.artifact) { peer.artifact = artifact; delete peer.browser; peer.browserStatus = 'not-applicable' }
    } catch (error) { delete peer.artifact; delete peer.browser; peer.error = String(error); peer.browserStatus = 'blocked' }
  }
  for (const node of nodes) if (!prepared.some(peer => peer.node.id === node.id)) prepared.push({ node, browserStatus: 'blocked', error: 'No prepared artifact supplied' })
  const plan = campaignPlan(nodes.flatMap((node: any) => (communityDeclaresOutput(node, 'svg') ? ['svg', 'png'] : ['png']).map(format => ({ project: node.id, version: plannedBenchmarkVersion(node, prepared.find(peer => peer.node.id === node.id)?.artifact), format }))), inventory.cases.map(input => input.id), 3, { commit: inventory.commit, sources: inventory.cases, admission: davebenchAdmission, admissionProfile: davebenchAdmissionProfile }, options.has('--projects') ? 'subset' : 'full')
  const startedAt = new Date().toISOString(), runs: Run[] = [], blocked: { project: string; format?: string; reason: string }[] = [], timeoutMs = 15_000
  const save = (state: string) => {
    const report = { schema: 'davebench-simple-v2', state, plan, startedAt, updatedAt: new Date().toISOString(), corpus: { commit: inventory.commit, directory: 'docs/', occurrences: inventory.cases.length, files: inventory.files },
      method: { runs: 3, warmupsPerRun: 30, timeoutMs, outputsRetained: false, outputsAssessed: false, admission: davebenchAdmission, admissionProfile: davebenchAdmissionProfile, elapsed: 'Sum of awaited render/export calls, including failures; initialization, warm-up, reporting and cleanup excluded. Native CLI includes process startup.', png: 'Browser SVG + shared Chromium canvas PNG conversion unless a prepared native PNG path is available. No image inspection.' },
      environment: { ...executionEnvironment(), chromium: browser.version() },
      runs, summary: davebenchSummary(runs), rankingRule: davebenchRankingRule, rankings: davebenchRankings(runs, inventory.cases.length), blocked }
    if (state === 'complete') assertTimingCollection(report)
    atomicWrite(join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n')
    if (state === 'complete') writeFileSync(join(out, 'rankings.md'), rankingMarkdown(report.rankings, inventory.cases.length, blocked))
  }
  using measurement = timingSession()
  const browser = await chromium.launch({ executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium), headless: true })
  try {
    save('running')
    for (const peer of prepared) {
      const cli = peer.artifact?.kind === 'cli' && peer.artifact.outputBindings?.svg
      if (!peer.browser && !cli) { blocked.push({ project: peer.node.id, reason: peer.error ?? peer.browserDetail ?? 'Public artifact unavailable' }); save('running'); continue }
      let assets: ReturnType<typeof sealCommunityBrowser> | undefined
      try { if (peer.browser && !cli) assets = sealCommunityBrowser(peer.browser) }
      catch (error) { blocked.push({ project: peer.node.id, reason: String(error) }); save('running'); continue }
      for (const format of plan.lanes.filter(lane => lane.project === peer.node.id).map(lane => lane.format)) {
        const boundary = cli ? 'native CLI ' + format + '; process startup included' : format === 'svg' ? 'Chromium public SVG API' : peer.browser!.additionalOutputs?.includes('png') ? 'Chromium public PNG API' : 'Chromium SVG API + canvas PNG conversion'
        let host: Awaited<ReturnType<typeof browserHost>> | undefined, session: Awaited<ReturnType<Awaited<ReturnType<typeof browserHost>>['open']>> | undefined
        const open = async () => { session = await host!.open() }
        try {
          if (!cli) host = await browserHost(browser, peer, format, assets)
          for (let round = 1; round <= 3; round++) {
            if (!cli) await open()
            const call = async (input: { id: string; source: string }, index: number): Promise<import('./terminal-call-worker.ts').TimedCall> => {
              if (cli) return davebenchCliCall(peer, input.source, format, timeoutMs)
              let timer: ReturnType<typeof setTimeout> | undefined
              const started = performance.now()
              try {
                return await Promise.race<import('./terminal-call-worker.ts').TimedCall>([session!.page.evaluate(davebenchBrowserCall, { ...input, id: 'dave_' + round + '_' + index, format, errorPatterns: errorPatternSources, raw: rawStatements(input.source) }), new Promise<import('./terminal-call-worker.ts').TimedCall>(done => { timer = setTimeout(() => { void session!.context.close().catch(() => {}); done({ outcome: 'timeout', ms: null, controllerMs: performance.now() - started }) }, timeoutMs) })])
              } catch { return { outcome: 'error', ms: null, controllerMs: performance.now() - started } }
              finally { if (timer) clearTimeout(timer) }
            }
            for (const [index, input] of inventory.cases.slice(0, 30).entries()) { const value = await call(input, -index - 1); if (value.outcome === 'timeout' && !cli) await open() }
            const row: Run = { project: peer.node.id, version: peer.artifact!.version, format, run: round, boundary, boundaryKind: cli ? 'fresh-process' : 'persistent-api', attempted: 0, completed: 0, failed: 0, timeouts: 0, totalMs: 0, invalid: 0, invalidReasons: {}, errorReasons: {} }
            runs.push(row)
            console.log(`${peer.node.id} ${format} run ${round}/3`)
            for (const [index, input] of inventory.cases.entries()) {
              const value = await call(input, index)
              row.attempted++; if (value.ms === null) row.untimedCalls = (row.untimedCalls ?? 0) + 1; else row.totalMs += value.ms
              if (value.outcome === 'completed') row.completed++; else row.failed++
              if (value.outcome === 'error') { const reason = (value.error ?? 'no message').replace(/\d+/g, 'N'); row.errorReasons![reason] = (row.errorReasons![reason] ?? 0) + 1 }
              if (value.outcome === 'invalid') { row.invalid!++; const reason = value.invalid!.replace(/: .*/, ''); row.invalidReasons![reason] = (row.invalidReasons![reason] ?? 0) + 1; (row.rejected ??= {})[input.id] = value.invalid! }
              if (value.outcome === 'timeout') { row.timeouts++; if (!cli) await open() }
              if ((index + 1) % 100 === 0) { save('running'); console.log(`  ${index + 1}/${inventory.cases.length}: ${row.completed} completed, ${row.failed} failed, ${(row.totalMs / 1000).toFixed(2)} s`) }
            }
            console.log(`  done: ${row.completed}/${row.attempted}, ${(row.totalMs / 1000).toFixed(3)} s`)
            if (session) { await session.context.close(); session = undefined }
            save('running')
          }
        } catch (error) { blocked.push({ project: peer.node.id, format, reason: format + ': ' + String(error).slice(0, 500) }); save('running') }
        finally { if (session) await session.context.close().catch(() => {}); if (host) await host.close() }
      }
    }
    save('complete')
  } finally { await browser.close() }
  console.log(JSON.stringify({ out, runs: runs.length, blocked: blocked.length }))
}
if (import.meta.main) await main()
