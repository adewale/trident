import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { chromium } from 'playwright'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { admitCurrentReference, currentReferencePin } from '../reference/source.ts'
import { admitPreparedFidelityEngine } from '../fidelity/community.ts'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import type { PreparedCommunityBrowser } from './community-browser.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { protocolIdentity } from './protocol-identity.ts'
import type { UnifiedRunOptions, UnifiedSuiteResult, BenchmarkObservation } from './types.ts'
import { mermaidOracleDirectory, mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'

/** Every occurrence from every syntax page of the pinned upstream release.
 * Duplicates remain in the acceptance denominator; no product registry chooses it. */
export function docsInventory(upstream = mermaidUpstreamDirectory()) {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: upstream, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const prefix = 'packages/mermaid/src/docs/syntax/'
  const pages = git('ls-tree', '-r', '--name-only', currentReferencePin.commit, '--', prefix).trim().split('\n').filter(path => path.endsWith('.md')).sort()
  const cases = pages.flatMap(file => {
    const text = git('show', `${currentReferencePin.commit}:${file}`)
    return [...text.matchAll(/^```(mermaid(?:-example)?)[^\S\r\n]*\r?\n([\s\S]*?)^```[^\S\r\n]*$/gm)].map(match => {
      const line = text.slice(0, match.index).split('\n').length
      return { id: `${file}:${line}`, family: file.slice(prefix.length, -3), source: match[2]!, file, line }
    })
  })
  if (!cases.length) throw Error('Pinned upstream syntax pages contain no Mermaid fences')
  return { pin: currentReferencePin, pages, occurrences: cases.length, distinct: new Set(cases.map(value => value.source.trim())).size, cases }
}

export async function runDocsBenchmark(options: UnifiedRunOptions): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed()
  const startedAt = new Date().toISOString(), observations: BenchmarkObservation[] = [], gaps: string[] = []
  if (!options.communityBrowserPreparedFile) throw Error('Docs benchmark needs a frozen public browser preparation manifest')
  admitCurrentReference(options.mermaidDir ?? mermaidUpstreamDirectory(), options.referenceDir ?? mermaidOracleDirectory())
  const inventory = docsInventory(options.mermaidDir)
  const prepared = JSON.parse(readFileSync(options.communityBrowserPreparedFile, 'utf8')) as PreparedCommunityBrowser[]
  if (!Array.isArray(prepared) || new Set(prepared.map(peer => peer.node.id)).size !== prepared.length) throw Error('Prepared project identities must be a unique array')
  for (const project of options.communityProjects ?? []) if (!prepared.some(peer => peer.node.id === project)) {
    observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: '*', caseId: project, operation: 'artifact-admission', format: 'svg', mode: 'not-executed', status: 'blocked', detail: 'Selected project is absent from frozen preparation', metrics: { project, plannedOccurrences: inventory.occurrences, runtimeExecuted: false } })
    gaps.push(project + ': missing frozen preparation')
  }
  const selected = prepared.filter(peer => !options.communityProjects || options.communityProjects.includes(peer.node.id))
  const producers = protocolIdentity(options.harnessRoot ?? options.root, ['unified/docs-benchmark.ts'])
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'inventory.json'), JSON.stringify({ ...inventory, protocol: 'public-docs-svg-return-v1', producers }, null, 2))
  const executable = options.executable ?? defaultChromium(chromium)
  const targets: PreparedCommunityBrowser[] = []
  for (const peer of selected) {
    try { admitPreparedFidelityEngine(peer); targets.push(peer) }
    catch (error) {
      const detail = String(error), status = !peer.node.outputs.includes('svg') ? 'unsupported' as const : 'blocked' as const
      observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: '*', caseId: peer.node.id, operation: 'artifact-admission', format: 'svg', mode: 'not-executed', status, detail, metrics: { project: peer.node.id, plannedOccurrences: inventory.occurrences, runtimeExecuted: false } })
      gaps.push(peer.node.id + ': ' + detail)
    }
  }
  writeFileSync(join(options.out, 'context.json'), JSON.stringify({
    protocol: 'public-docs-svg-return-v1', producers, browser: executableIdentity(executable), driver: process.versions,
    rounds: options.rounds, warmupAttemptsPerRound: 30, pinnedSource: inventory.pin,
    artifacts: targets.map(peer => ({ project: peer.node.id, admission: admitPreparedFidelityEngine(peer) })),
    timing: 'Elapsed browser public call through awaited return; output check and cleanup after stopped clock. No A/A performance qualification.',
    hostDeadlineMs: 20000, network: 'Prepared artifact origin only',
  }, null, 2))
  const browser = targets.length ? await chromium.launch({ headless: true, executablePath: executable }) : undefined
  try {
    for (let round = 1; round <= options.rounds; round++) {
      const order = [...targets.slice((round - 1) % Math.max(1, targets.length)), ...targets.slice(0, (round - 1) % Math.max(1, targets.length))]
      if (round % 2 === 0) order.reverse()
      for (const peer of order) {
        const engine = peer.browser!, root = resolve(engine.root)
        console.log(`docs round ${round}/${options.rounds}: ${peer.node.id} (${inventory.occurrences} occurrences)`)
        const server = createServer((request, response) => {
          const url = new URL(request.url ?? '/', 'http://localhost')
          if (url.pathname === '/blank') { response.setHeader('content-type', 'text/html'); response.end('<!doctype html><body>'); return }
          let file: string
          try { file = resolve(root, decodeURIComponent(url.pathname.slice(1))) } catch { response.writeHead(400).end(); return }
          if (!file.startsWith(root + sep) || !existsSync(file)) { response.writeHead(404).end(); return }
          response.setHeader('content-type', extname(file) === '.wasm' ? 'application/wasm' : 'text/javascript')
          response.end(readFileSync(file))
        })
        await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
        const origin = 'http://127.0.0.1:' + (server.address() as { port: number }).port
        const context = await browser!.newContext(), page = await context.newPage()
        const invoke = async (input: any) => {
          let timer: ReturnType<typeof setTimeout> | undefined
          try { return await Promise.race([page.evaluate(publicSvgBrowserAction, input), new Promise<never>((_, reject) => { timer = setTimeout(() => { void page.close().catch(() => {}); reject(Error('Browser call exceeded20s host deadline')) }, 20_000) })]) }
          finally { if (timer) clearTimeout(timer) }
        }
        page.setDefaultTimeout(20_000)
        await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
        try {
          await page.goto(origin + '/blank')
          if (engine.kind === 'franken' || engine.kind === 'merman') await invoke({ type: 'initialize-module', kind: engine.kind, url: origin + '/' + engine.entry, wasm: origin + '/' + engine.wasm })
          else {
            await page.addScriptTag({ url: origin + '/' + engine.entry, ...(engine.scriptType ? { type: engine.scriptType } : {}) })
            await invoke({ type: 'initialize-global', engine })
          }
          let warmupPassed = 0
          for (let index = 0; index < 30; index++) {
            const value = await invoke({ type: 'measure-docs', source: inventory.cases[index % inventory.cases.length]!.source, id: `warmup_${round}_${index}` })
            if (value.status === 'passed') warmupPassed++
          }
          for (const [index, testCase] of inventory.cases.entries()) {
            const value = await invoke({ type: 'measure-docs', source: testCase.source, id: `docs_${round}_${index}` })
            observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: testCase.family, caseId: testCase.id, operation: 'render', format: 'svg', mode: 'one-public-call', status: value.status, ...(value.status === 'passed' ? { samplesMs: [value.durationMs] } : { detail: value.error }), metrics: { project: peer.node.id, version: engine.version, round, bytes: value.bytes ?? null, warmupAttempts: 30, warmupPassed } })
          }
        } catch (error) {
          observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: '*', caseId: peer.node.id, operation: 'round', format: 'svg', mode: 'not-completed', status: 'blocked', detail: String(error), metrics: { project: peer.node.id, round, plannedOccurrences: inventory.occurrences } })
          gaps.push(`${peer.node.id} round ${round}: ${error}`)
        } finally { await context.close(); await new Promise<void>(done => server.close(() => done())) }
        admitPreparedFidelityEngine(peer)
        writeFileSync(join(options.out, 'observations.json'), JSON.stringify(observations))
      }
    }
  } finally { await browser?.close() }
  const result: UnifiedSuiteResult = { id: 'docs', status: observations.some(value => value.status === 'failed') ? 'failed' : observations.some(value => value.status === 'blocked') ? 'blocked' : observations.length && observations.every(value => value.status === 'unsupported') ? 'not-applicable' : 'passed', startedAt, finishedAt: new Date().toISOString(), observations, gaps: [...gaps, 'SVG return only; no meaning/paint qualification. Distinct protocol from historical AM Davebench: complete pinned upstream syntax directory, all catalog browser bindings. Latency comparisons require pairwise common successes; no overall speed score.'], artifacts: [join(options.out, 'inventory.json'), join(options.out, 'observations.json')] }
  const rows = selected.flatMap(peer => Array.from({ length: options.rounds }, (_, index) => {
    const own = observations.filter(row => row.metrics?.project === peer.node.id && row.metrics?.round === index + 1 && row.operation === 'render')
    const passed = own.filter(row => row.status === 'passed').length
    return `| ${peer.node.id} | ${index + 1} | ${passed} | ${own.length - passed} | ${inventory.occurrences - own.length} |`
  }))
  writeFileSync(join(options.out, 'report.md'), '# Official documentation SVG return\n\n' + `${inventory.occurrences} occurrences; ${inventory.distinct} distinct inputs; ${inventory.pages.length} pinned syntax pages.\n\n` + '| Project | Round | SVG returned | Failed | Unexecuted |\n|---|---|---|---|---|\n' + rows.join('\n') + '\n\nA returned SVG is weak compatibility evidence. Timing samples are in result.json; compare only pairwise common successful inputs. No overall speed rank or calibrated performance pass.\n')
  writeFileSync(join(options.out, 'result.json'), JSON.stringify(result))
  return result
}
