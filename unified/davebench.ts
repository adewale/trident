import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { performance } from 'node:perf_hooks'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { comparisonProjects } from './lineage.ts'
import { refreshBenchmarkVersions, assertCurrentBenchmarkArtifact, latestBenchmarkRenderingArtifact } from './benchmark-versions.ts'
import { prepareCommunity } from './community.ts'
import { prepareCommunityBrowsers, type PreparedCommunityBrowser } from './community-browser.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { communityCatalogFile, tridentDirectory } from './trident-paths.ts'
import { assertBenchmarkExecutionAllowed } from '../portable/ci-policy.ts'
import { defaultChromium } from './benchmark-context.ts'

const revision = '370c4af57f43cb0bda05f4a9fe2d99c912ba16dd'
export function davebenchInputs(upstream: string, commit = revision) {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: upstream, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const files = git('ls-tree', '-r', '--name-only', commit, '--', 'docs/').trim().split('\n').filter(file => /\.mdx?$/.test(file))
  const cases: { id: string; source: string }[] = []
  for (const file of files) {
    let fence: { char: string; length: number; language: string; line: number } | undefined, body: string[] = []
    for (const [index, line] of git('show', `${commit}:${file}`).split(/(?<=\n)/).entries()) {
      if (fence) {
        if (new RegExp('^ {0,3}' + fence.char + '{' + fence.length + ',}[ \\t]*\\r?\\n?$').test(line)) {
          if (['mermaid', 'mermaid-example'].includes(fence.language)) cases.push({ id: file + ':' + fence.line, source: body.join('') })
          fence = undefined; body = []
        } else body.push(line)
      } else {
        const match = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)/.exec(line)
        if (match) fence = { char: match[1]![0]!, length: match[1]!.length, language: match[2]!.trim().split(/\s+/)[0]!, line: index + 1 }
      }
    }
  }
  if (!cases.length) throw Error('No documentation examples found')
  return { commit, files: new Set(cases.map(input => input.id.slice(0, input.id.lastIndexOf(':')))).size, cases }
}

/** Runs in the renderer page. Returns counters only; outputs never leave it. */
export async function davebenchBrowserCall(input: { source: string; id: string; format: string }) {
  const host = globalThis as any, state = host.__fidelityCommunity, started = performance.now()
  let outcome = 'completed'
  try {
    if (input.format === 'png' && host.__davebenchNativePng) {
      await host.__davebenchNativePng(input.source, input.id, 'png')
    } else {
      const value = await state.render(input.source, input.id)
      if (input.format === 'png') {
        // This parsing is part of conversion, not a drawing assessment.
        const container = document.createElement('div')
        container.innerHTML = typeof value === 'string' ? value : value.svg
        const svg = container.querySelector('svg')!
        const box = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
        const width = Math.ceil(box?.length === 4 ? box[2]! : Number.parseFloat(svg.getAttribute('width') ?? ''))
        const height = Math.ceil(box?.length === 4 ? box[3]! : Number.parseFloat(svg.getAttribute('height') ?? ''))
        svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height)); svg.style.maxWidth = 'none'
        const image = new Image()
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg))
        await image.decode()
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(image, 0, 0)
        await new Promise<void>((done, reject) => canvas.toBlob(blob => blob ? done() : reject(Error('PNG encoding failed')), 'image/png'))
        canvas.width = 0; canvas.height = 0
      }
    }
  } catch { outcome = 'error' }
  const ms = performance.now() - started
  try { host.__communityAfterCall?.() } catch {}
  for (const node of document.querySelectorAll('body > div:not([data-community-host])')) node.remove()
  return { outcome, ms }
}

export interface DavebenchRun {
  project: string; version: string; format: string; run: number; boundary: string
  attempted: number; completed: number; failed: number; timeouts: number; totalMs: number
}
type Run = DavebenchRun
export const davebenchRankingRule = {
  primary: 'More completed examples is better; use the minimum completion count across three complete runs.',
  secondary: 'For equal completion counts, lower median total render/export time is better.',
  ties: 'Identical completion counts and median times share a rank.',
  scope: 'Rank SVG and PNG separately through the declared public execution paths. Native CLI time includes per-example process startup.',
  incomplete: 'Fewer than three complete runs, or mixed versions/boundaries, remain unranked.',
} as const
function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]! }
export function davebenchSummary(runs: Run[]) {
  const keys = [...new Set(runs.map(run => JSON.stringify([run.project, run.format])))]
  return keys.map(key => {
    const rows = runs.filter(run => JSON.stringify([run.project, run.format]) === key)
    return { project: rows[0]!.project, version: rows[0]!.version, format: rows[0]!.format, boundary: rows[0]!.boundary,
      completed: rows.map(row => row.completed), failed: rows.map(row => row.failed), totalMs: rows.map(row => row.totalMs), medianTotalMs: median(rows.map(row => row.totalMs)), runs: rows.length }
  })
}

export function davebenchRankings(runs: Run[], planned: number) {
  const ranked: { project: string; version: string; format: string; boundary: string; completed: number; failed: number; medianTotalMs: number; rank: number }[] = []
  const unranked: { project: string; format: string; reason: string }[] = []
  for (const summary of davebenchSummary(runs)) {
    const rows = runs.filter(row => row.project === summary.project && row.format === summary.format)
    if (rows.length !== 3 || JSON.stringify(rows.map(row => row.run).sort()) !== '[1,2,3]' || rows.some(row => row.attempted !== planned || row.completed + row.failed !== planned || row.version !== summary.version || row.boundary !== summary.boundary)) {
      unranked.push({ project: summary.project, format: summary.format, reason: 'Three complete runs with one version and boundary are required.' }); continue
    }
    if (rows.some(row => !Number.isSafeInteger(row.completed) || row.completed < 0 || row.completed > planned || !Number.isFinite(row.totalMs) || row.totalMs < 0)) throw Error('Invalid DaveBench ranking measurements')
    const completed = Math.min(...rows.map(row => row.completed))
    ranked.push({ project: summary.project, version: summary.version, format: summary.format, boundary: summary.boundary, completed, failed: planned - completed, medianTotalMs: summary.medianTotalMs, rank: 0 })
  }
  const format = (name: string) => {
    const rows = ranked.filter(row => row.format === name).sort((a, b) => b.completed - a.completed || a.medianTotalMs - b.medianTotalMs || a.project.localeCompare(b.project))
    for (const [index, row] of rows.entries()) { const previous = rows[index - 1]; row.rank = previous && row.completed === previous.completed && row.medianTotalMs === previous.medianTotalMs ? previous.rank : index + 1 }
    return rows
  }
  return { svg: format('svg'), png: format('png'), terminal: format('terminal'), unranked }
}

function rankingMarkdown(rankings: ReturnType<typeof davebenchRankings>, planned: number, blocked: { project: string; reason: string }[]) {
  const lines = ['# DaveBench rankings', '', `${planned} examples per format; three runs after 30 warm-ups. Outputs are discarded without assessment.`, '', ...Object.values(davebenchRankingRule).map(rule => '- ' + rule), '']
  for (const format of ['svg', 'png'] as const) {
    lines.push('## ' + format.toUpperCase(), '', '| Rank | Project | Version | Completed | Failed | Median total seconds | Path |', '|---:|---|---|---:|---:|---:|---|')
    for (const row of rankings[format]) lines.push(`| ${row.rank} | ${row.project} | ${row.version} | ${row.completed} | ${row.failed} | ${(row.medianTotalMs / 1000).toFixed(3)} | ${row.boundary.includes('CLI') ? 'Native CLI' : 'Browser API'} |`)
    lines.push('')
  }
  if (blocked.length || rankings.unranked.length) {
    lines.push('## Unranked', '')
    for (const row of blocked) lines.push('- ' + row.project + ': ' + row.reason.replaceAll('\n', ' '))
    for (const row of rankings.unranked) lines.push('- ' + row.project + ' (' + row.format + '): ' + row.reason)
  }
  return lines.join('\n') + '\n'
}

async function browserHost(browser: Browser, peer: PreparedCommunityBrowser, format: string) {
  const engine = peer.browser!, root = resolve(engine.root)
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    if (url.pathname === '/blank') { response.setHeader('content-type', 'text/html'); response.end('<!doctype html><body>'); return }
    const addon = url.pathname.startsWith('/zenuml/') && engine.zenuml
    const base = addon ? resolve(engine.zenuml!.root) : root
    const file = resolve(base, decodeURIComponent(url.pathname.slice(addon ? 8 : 1)))
    if (!file.startsWith(base + sep) || !existsSync(file)) { response.writeHead(404).end(); return }
    response.setHeader('content-type', ({ '.wasm': 'application/wasm', '.css': 'text/css' } as Record<string, string>)[extname(file)] ?? 'text/javascript')
    response.end(readFileSync(file))
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
      else await page.addScriptTag({ content: readFileSync(resolve(engine.root, engine.entry), 'utf8') })
      await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine, ...(engine.zenuml ? { addonUrl: origin + '/zenuml/' + engine.zenuml.entry } : {}) })
      if (format === 'png' && engine.additionalOutputs?.includes('png')) await page.evaluate(async () => { const host = globalThis as any; host.__davebenchNativePng = await host.__fidelityCommunity.api.createRenderer() })
    }
    return { context, page }
  }
  return { open, close: () => new Promise<void>(done => server.close(() => done())) }
}

async function cliCall(peer: PreparedCommunityBrowser, source: string, format: string, timeoutMs: number) {
  const artifact = peer.artifact!, binding = artifact.outputBindings![format]!, started = performance.now()
  return new Promise<{ outcome: string; ms: number }>(done => {
    // Bun/libuv stdout can be a socket, which native file exporters cannot
    // reopen through /dev/stdout. /dev/null accepts the fully encoded PNG
    // without retaining it or requiring a temporary image file.
    const child = spawn(artifact.executable!, binding.args.map(arg => arg.replaceAll('{output}', '/dev/null')), { stdio: ['pipe', 'pipe', 'pipe'] })
    child.stdout.resume(); child.stderr.resume(); child.stdin.on('error', () => {}); child.stdin.end(source)
    let timeout = false
    const timer = setTimeout(() => { timeout = true; child.kill('SIGKILL') }, timeoutMs)
    child.once('error', () => { clearTimeout(timer); done({ outcome: 'error', ms: performance.now() - started }) })
    child.once('close', code => { clearTimeout(timer); done({ outcome: timeout ? 'timeout' : code === 0 ? 'completed' : 'error', ms: performance.now() - started }) })
  })
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('davebench --out FRESH_DIRECTORY [--prepared FILE] [--upstream MERMAID_CHECKOUT] [--projects IDS]\nThree runs of every pinned documentation example, SVG and PNG. Reports completion and time only; discards outputs without assessment.'); return }
  assertBenchmarkExecutionAllowed()
  const options = new Map<string, string>()
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]!, value = args[index + 1]
    if (!['--out', '--prepared', '--upstream', '--projects'].includes(key) || !value || options.has(key)) throw Error('davebench --out FRESH_DIRECTORY [--prepared FILE] [--upstream MERMAID_CHECKOUT] [--projects IDS]')
    options.set(key, value)
  }
  if (!options.has('--out')) throw Error('Choose --out FRESH_DIRECTORY')
  const out = resolve(options.get('--out')!), upstream = resolve(options.get('--upstream') ?? join(tridentDirectory, '../mermaid'))
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  mkdirSync(out, { recursive: true })
  const inventory = davebenchInputs(upstream), recorded = JSON.parse(readFileSync(communityCatalogFile, 'utf8'))
  const enrolled = comparisonProjects(recorded, options.get('--projects')?.split(',') ?? recorded.nodes.map((node: any) => node.id))
  const applicable = recorded.nodes.filter((node: any) => enrolled.included.includes(node.id) && node.benchmark?.outputs.some((format: string) => ['svg', 'png'].includes(format))).map((node: any) => node.id)
  const current = await refreshBenchmarkVersions(recorded, applicable), catalog = current.catalog
  writeFileSync(join(out, 'versions.json'), JSON.stringify(current.report, null, 2) + '\n')
  if (!current.report.complete) throw Error('Latest-version selection is incomplete; see ' + join(out, 'versions.json'))
  const nodes = catalog.nodes.filter((node: any) => enrolled.included.includes(node.id) && node.benchmark?.outputs.some((format: string) => ['svg', 'png'].includes(format)))
  if (!nodes.length) throw Error('No applicable SVG/PNG projects selected')
  let prepared: PreparedCommunityBrowser[]
  if (options.has('--prepared')) {
    prepared = JSON.parse(readFileSync(options.get('--prepared')!, 'utf8')).filter((peer: PreparedCommunityBrowser) => nodes.some((node: any) => node.id === peer.node.id))
    for (const peer of prepared) {
      const selected = nodes.find((node: any) => node.id === peer.node.id)!
      assertCurrentBenchmarkArtifact(peer, selected)
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
  const startedAt = new Date().toISOString(), runs: Run[] = [], blocked: { project: string; reason: string }[] = [], timeoutMs = 15_000
  const save = (state: string) => {
    const report = { schema: 'davebench-simple-v1', state, startedAt, updatedAt: new Date().toISOString(), corpus: { commit: inventory.commit, directory: 'docs/', occurrences: inventory.cases.length, files: inventory.files },
      method: { runs: 3, warmupsPerRun: 30, timeoutMs, outputsRetained: false, outputsAssessed: false, elapsed: 'Sum of awaited render/export calls, including failures; initialization, warm-up, reporting and cleanup excluded. Native CLI includes process startup.', png: 'Browser SVG + shared Chromium canvas PNG conversion unless a prepared native PNG path is available. No image inspection.' },
      environment: { node: process.versions.node, bun: process.versions.bun, platform: process.platform, architecture: process.arch, chromium: browser.version() },
      runs, summary: davebenchSummary(runs), rankingRule: davebenchRankingRule, rankings: davebenchRankings(runs, inventory.cases.length), blocked }
    writeFileSync(join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n')
    if (state === 'complete') writeFileSync(join(out, 'rankings.md'), rankingMarkdown(report.rankings, inventory.cases.length, blocked))
  }
  const browser = await chromium.launch({ executablePath: process.env.AM_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium), headless: true })
  try {
    save('running')
    for (const peer of prepared) {
      const cli = peer.artifact?.kind === 'cli' && peer.artifact.outputBindings?.svg
      if (!peer.browser && !cli) { blocked.push({ project: peer.node.id, reason: peer.error ?? peer.browserDetail ?? 'Public artifact unavailable' }); save('running'); continue }
      for (const format of ['svg', 'png']) {
        const boundary = cli ? 'native CLI ' + format + '; process startup included' : format === 'svg' ? 'Chromium public SVG API' : peer.browser!.additionalOutputs?.includes('png') ? 'Chromium public PNG API' : 'Chromium SVG API + canvas PNG conversion'
        let host: Awaited<ReturnType<typeof browserHost>> | undefined, session: Awaited<ReturnType<Awaited<ReturnType<typeof browserHost>>['open']>> | undefined
        const open = async () => { session = await host!.open() }
        try {
          if (!cli) host = await browserHost(browser, peer, format)
          for (let round = 1; round <= 3; round++) {
            if (!cli) await open()
            const call = async (input: { id: string; source: string }, index: number) => {
              if (cli) return cliCall(peer, input.source, format, timeoutMs)
              let timer: ReturnType<typeof setTimeout> | undefined
              const started = performance.now()
              try {
                return await Promise.race([session!.page.evaluate(davebenchBrowserCall, { ...input, id: 'dave_' + round + '_' + index, format }), new Promise<{ outcome: string; ms: number }>(done => { timer = setTimeout(() => { void session!.context.close().catch(() => {}); done({ outcome: 'timeout', ms: performance.now() - started }) }, timeoutMs) })])
              } catch { return { outcome: 'error', ms: performance.now() - started } }
              finally { if (timer) clearTimeout(timer) }
            }
            for (const [index, input] of inventory.cases.slice(0, 30).entries()) { const value = await call(input, -index - 1); if (value.outcome === 'timeout' && !cli) await open() }
            const row: Run = { project: peer.node.id, version: peer.artifact!.version, format, run: round, boundary, attempted: 0, completed: 0, failed: 0, timeouts: 0, totalMs: 0 }
            runs.push(row)
            console.log(`${peer.node.id} ${format} run ${round}/3`)
            for (const [index, input] of inventory.cases.entries()) {
              const value = await call(input, index)
              row.attempted++; row.totalMs += value.ms
              if (value.outcome === 'completed') row.completed++; else row.failed++
              if (value.outcome === 'timeout') { row.timeouts++; if (!cli) await open() }
              if ((index + 1) % 100 === 0) { save('running'); console.log(`  ${index + 1}/${inventory.cases.length}: ${row.completed} completed, ${row.failed} failed, ${(row.totalMs / 1000).toFixed(2)} s`) }
            }
            console.log(`  done: ${row.completed}/${row.attempted}, ${(row.totalMs / 1000).toFixed(3)} s`)
            if (session) { await session.context.close(); session = undefined }
            save('running')
          }
        } catch (error) { blocked.push({ project: peer.node.id, reason: format + ': ' + String(error).slice(0, 500) }); save('running') }
        finally { if (session) await session.context.close().catch(() => {}); if (host) await host.close() }
      }
    }
    save('complete')
  } finally { await browser.close() }
  console.log(JSON.stringify({ out, runs: runs.length, blocked: blocked.length }))
}
if (import.meta.main) await main()
