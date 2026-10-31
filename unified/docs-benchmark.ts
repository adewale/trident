import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { chromium } from 'playwright'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { inspectFidelityPaint } from '../fidelity/paint.ts'
import { inspectQuantitativePaint } from '../fidelity/paint-values.ts'
import { admitDocsReviews, assessDocsDrawing, reviewedDocsCase, type DocsDrawingReview } from './docs-drawings.ts'
import { qualifyOutput } from './qualification.ts'
import { tridentDirectory } from './trident-paths.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { CollectionBudgetExhausted, CollectionCheckpoint, checkCollectionBudget } from '../portable/checkpoint.ts'
import { admitCurrentReference, currentReferencePin } from '../reference/source.ts'
import { admitPreparedFidelityEngine } from '../fidelity/community.ts'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import type { PreparedCommunityBrowser } from './community-browser.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { protocolIdentity } from './protocol-identity.ts'
import type { UnifiedRunOptions, UnifiedSuiteResult, BenchmarkObservation } from './types.ts'
import { mermaidOracleDirectory, mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'

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

/** Pair every ordering with its reverse before rotating the next pair. */
export function docsRoundOrder<T>(targets: readonly T[], round: number): T[] {
  const offset = Math.floor((round - 1) / 2) % Math.max(1, targets.length)
  const order = [...targets.slice(offset), ...targets.slice(0, offset)]
  return round % 2 === 0 ? order.reverse() : order
}

export async function runDocsBenchmark(options: UnifiedRunOptions): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed()
  const startedAt = new Date().toISOString(), observations: BenchmarkObservation[] = [], gaps: string[] = []
  if (!options.communityBrowserPreparedFile) throw Error('Docs benchmark needs a frozen public browser preparation manifest')
  admitCurrentReference(options.mermaidDir ?? mermaidUpstreamDirectory(), options.referenceDir ?? mermaidOracleDirectory())
  const inventory = docsInventory(options.mermaidDir)
  const reviewFile = options.docsReviewFile ?? join(tridentDirectory, 'corpus/docs-reviewed.json')
  const reviewBytes = readFileSync(reviewFile), reviews = JSON.parse(reviewBytes.toString()) as DocsDrawingReview[]
  const drawingInventory = admitDocsReviews(inventory.cases, reviews)
  const drawingReview = { protocol: 'reviewed-docs-svg-content-v1', sha256: createHash('sha256').update(reviewBytes).digest('hex'), cases: drawingInventory }
  const prepared = JSON.parse(readFileSync(options.communityBrowserPreparedFile, 'utf8')) as PreparedCommunityBrowser[]
  if (!Array.isArray(prepared) || new Set(prepared.map(peer => peer.node.id)).size !== prepared.length) throw Error('Prepared project identities must be a unique array')
  for (const project of options.communityProjects ?? []) if (!prepared.some(peer => peer.node.id === project)) {
    observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: '*', caseId: project, operation: 'artifact-admission', format: 'svg', mode: 'not-executed', status: 'blocked', detail: 'Selected project is absent from frozen preparation', metrics: { project, plannedOccurrences: inventory.occurrences, runtimeExecuted: false } })
    gaps.push(project + ': missing frozen preparation')
  }
  const selected = prepared.filter(peer => !options.communityProjects || options.communityProjects.includes(peer.node.id))
  const producers = protocolIdentity(options.harnessRoot ?? options.root, ['unified/docs-benchmark.ts'])
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'inventory.json'), JSON.stringify({ ...inventory, protocol: 'public-docs-svg-return-v1', producers, drawingReview }, null, 2))
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
    protocol: 'public-docs-svg-return-v1', producers, drawingReview, browser: executableIdentity(executable), driver: process.versions,
    rounds: options.rounds, warmupAttemptsPerRound: 30, pinnedSource: inventory.pin,
    projectOrderByRound: Array.from({ length: options.rounds }, (_, index) => docsRoundOrder(targets, index + 1).map(peer => peer.node.id)),
    artifacts: targets.map(peer => ({ project: peer.node.id, admission: admitPreparedFidelityEngine(peer) })),
    timing: 'Elapsed browser public call through awaited return; output check and cleanup after stopped clock. No A/A performance qualification.',
    hostDeadlineMs: 20000, network: 'Prepared artifact origin only',
  }, null, 2))
  const checkpoint = new CollectionCheckpoint(options.out, { context: JSON.parse(readFileSync(join(options.out, 'context.json'), 'utf8')), inventory }, options.collectionDeadline)
  let budgetError: CollectionBudgetExhausted | undefined
  const browser = targets.length ? await chromium.launch({ headless: true, executablePath: executable }) : undefined
  try {
    for (let round = 1; round <= options.rounds; round++) {
      const order = docsRoundOrder(targets, round)
      for (const peer of order) {
        const key = JSON.stringify([round, peer.node.id])
        const recorded = await checkpoint.collect(key, async () => {
        const roundObservations: BenchmarkObservation[] = []
        const engine = peer.browser!, root = resolve(engine.root)
        console.log(`docs round ${round}/${options.rounds}: ${peer.node.id} (${inventory.occurrences} occurrences)`)
        const server = docsArtifactServer(root, engine.zenuml)
        await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
        const origin = 'http://127.0.0.1:' + (server.address() as { port: number }).port
        const context = await browser!.newContext({ viewport: { width: 1400, height: 1000 } }), page = await context.newPage()
        let observer: any = await context.newPage()
        await observer.goto(origin + '/observer')
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
            await invoke({ type: 'initialize-global', engine, addonUrl: engine.zenuml ? origin + '/__addon/' + engine.zenuml.entry : undefined })
          }
          let warmupPassed = 0
          for (let index = 0; index < 30; index++) {
            checkCollectionBudget(options.collectionDeadline)
            const value = await invoke({ type: 'measure-docs', source: inventory.cases[index % inventory.cases.length]!.source, id: `warmup_${round}_${index}` })
            if (value.status === 'passed') warmupPassed++
          }
          for (const [index, testCase] of inventory.cases.entries()) {
            checkCollectionBudget(options.collectionDeadline)
            const value = await invoke({ type: 'measure-docs', source: testCase.source, id: `docs_${round}_${index}`, retainSvg: round === 1 })
            roundObservations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: testCase.family, caseId: testCase.id, operation: 'render', format: 'svg', mode: 'one-public-call', status: value.status, ...(value.status === 'passed' ? { samplesMs: [value.durationMs] } : { detail: value.error }), metrics: { project: peer.node.id, version: engine.version, measuredAt: new Date().toISOString(), round, bytes: value.bytes ?? null, warmupAttempts: 30, warmupPassed } })
            if (round === 1) {
              const review = drawingInventory[index]!.review
              let witness: string | undefined, assessment: ReturnType<typeof assessDocsDrawing>
              try {
                if (typeof value.svg === 'string') {
                  const hash = createHash('sha256').update(value.svg).digest('hex')
                  mkdirSync(join(options.out, 'drawings'), { recursive: true })
                  witness = 'drawings/' + hash + '.svg.gz'
                  if (!existsSync(join(options.out, witness))) writeFileSync(join(options.out, witness), gzipSync(value.svg))
                }
                if (review?.intent === 'drawing' && typeof value.svg === 'string') {
                  const authored = reviewedDocsCase(testCase, review)
                  const admission = qualifyOutput({ id: testCase.id, family: authored.family, source: testCase.source, expectedLabels: authored.expected.labels, features: [], provenance: review.review }, value.svg, 'svg')
                  if (observer.isClosed()) { observer = await context.newPage(); await observer.goto(origin + '/observer') }
                  const currentObserver = observer
                  let inspectionTimer: ReturnType<typeof setTimeout> | undefined
                  try {
                    assessment = await Promise.race([
                      (async () => {
                        await currentObserver.setContent(value.svg)
                        const paint = await currentObserver.evaluate(inspectFidelityPaint, { family: authored.family, expected: authored.expected })
                        const quantitative = await currentObserver.evaluate(inspectQuantitativePaint, { family: authored.family, expected: authored.expected, source: testCase.source, nodes: paint.nodes })
                        return assessDocsDrawing(testCase, review, value.status, admission.ok, [...paint.checks, ...quantitative])
                      })(),
                      new Promise<never>((_, reject) => { inspectionTimer = setTimeout(() => { void currentObserver.close().catch(() => {}); reject(Error('Drawing observer exceeded20s deadline')) }, 20_000) }),
                    ])
                  } finally { if (inspectionTimer) clearTimeout(inspectionTimer) }
                } else assessment = assessDocsDrawing(testCase, review, value.status, false, [])
              } catch (error) { assessment = { status: 'unknown', reason: 'Drawing observer did not complete: ' + String(error) } }
              roundObservations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: testCase.family, caseId: testCase.id, operation: 'drawing-checks', format: 'svg', mode: 'reviewed-first-round-output', status: assessment.status === 'correct' ? 'passed' : assessment.status === 'incorrect' ? 'failed' : assessment.status === 'not-applicable' ? 'not-applicable' : 'blocked', detail: JSON.stringify(assessment), metrics: { project: peer.node.id, version: engine.version, measuredAt: new Date().toISOString(), round, reviewedSource: !!review, ...(witness ? { witness } : {}) } })
            }
          }
        } catch (error) {
          if (error instanceof CollectionBudgetExhausted) {
            writeFileSync(join(options.out, `interrupted-round-${round}-${encodeURIComponent(peer.node.id)}-${Date.now()}.json`), JSON.stringify({ project: peer.node.id, round, status: 'incomplete', observations: roundObservations }))
            throw error
          }
          roundObservations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: '*', caseId: peer.node.id, operation: 'round', format: 'svg', mode: 'not-completed', status: 'blocked', detail: String(error), metrics: { project: peer.node.id, round, plannedOccurrences: inventory.occurrences } })
          gaps.push(`${peer.node.id} round ${round}: ${error}`)
        } finally { await context.close(); await new Promise<void>(done => server.close(() => done())) }
        admitPreparedFidelityEngine(peer)
        return roundObservations
        })
        observations.push(...recorded)
        writeFileSync(join(options.out, 'observations.json'), JSON.stringify(observations))
      }
    }
  } catch (error) { if (error instanceof CollectionBudgetExhausted) { budgetError = error; gaps.push(error.message) } else throw error } finally { await browser?.close() }
  const result: UnifiedSuiteResult = { id: 'docs', status: budgetError ? 'blocked' : observations.some(value => value.status === 'failed') ? 'failed' : observations.some(value => value.status === 'blocked') ? 'blocked' : observations.length && observations.every(value => value.status === 'unsupported') ? 'not-applicable' : 'passed', startedAt: checkpoint.startedAt, finishedAt: new Date().toISOString(), observations, gaps: [...gaps, 'SVG return and reviewed drawing content are separate results. First-round SVG witnesses are retained; missing source reviews and incomplete observers remain unknown. Timings are descriptive public return samples, without A/A or per-call semantic qualification; no speed ranking is supported.'], artifacts: [join(options.out, 'inventory.json'), join(options.out, 'observations.json'), join(options.out, 'drawings')] }
  const rows = selected.flatMap(peer => Array.from({ length: options.rounds }, (_, index) => {
    const own = observations.filter(row => row.metrics?.project === peer.node.id && row.metrics?.round === index + 1 && row.operation === 'render')
    const passed = own.filter(row => row.status === 'passed').length
    return `| ${peer.node.id} | ${index + 1} | ${passed} | ${own.length - passed} | ${inventory.occurrences - own.length} |`
  }))
  writeFileSync(join(options.out, 'report.md'), '# Official documentation SVG return\n\n' + `${inventory.occurrences} occurrences; ${inventory.distinct} distinct inputs; ${inventory.pages.length} pinned syntax pages.\n\n` + '| Project | Round | SVG returned | Failed | Unexecuted |\n|---|---|---|---|---|\n' + rows.join('\n') + '\n\nA returned SVG is weak compatibility evidence. Timing samples are in result.json; compare only pairwise common successful inputs. No overall speed rank or calibrated performance pass.\n')
  writeFileSync(join(options.out, 'result.json'), JSON.stringify(result))
  if (budgetError) throw budgetError
  return result
}
