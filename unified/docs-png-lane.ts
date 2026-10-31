import { selectDocsCases } from './docs-selection.ts'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { checkCollectionBudget, CollectionCheckpoint, CollectionBudgetExhausted } from '../portable/checkpoint.ts'
import { admitPreparedFidelityEngine } from '../fidelity/community.ts'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import { callDocsPage, closeDocsContext, withDocsDeadline, docsArtifactServer, docsRoundOrder, type docsInventory } from './docs-benchmark.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { publicDocsPngAction } from './docs-png-browser.ts'
import { inspectPng } from './png-inspection.ts'
import { assessDocsPng, type DocsPngReview } from './docs-png-drawings.ts'
import { runCommunityCli, runCommunityNodeRound, verifyProvidedCommunityArtifact, communityModuleOutputSupported } from './community.ts'
import { runExternalCommunity } from './community-external.ts'
import type { DocsDrawingReview } from './docs-drawings.ts'
import type { PreparedCommunity } from './community-types.ts'
import type { PreparedCommunityBrowser } from './community-browser.ts'
import type { BenchmarkObservation, UnifiedRunOptions, UnifiedSuiteResult } from './types.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'

export function docsPngTransport(peer?: PreparedCommunity, browser?: PreparedCommunityBrowser) {
  const png = peer?.node.benchmark?.outputs?.includes('png')
  if (png && peer?.artifact?.kind === 'jsonl-worker') return 'native' as const
  if (png && peer?.artifact?.kind === 'node' && communityModuleOutputSupported(peer.node, 'png')) return 'node' as const
  if (png && peer?.artifact?.kind === 'cli') return 'cli' as const
  if (browser?.browserStatus === 'prepared') return 'svg-conversion' as const
  return 'unavailable' as const
}

/** PNG has exactly the same literal source inventory as the SVG lane. Native
 * PNG producers are admitted without an SVG API or SVG browser preparation. */
export async function runDocsPngLane(options: UnifiedRunOptions, inventory: ReturnType<typeof docsInventory>, sourceReviews: readonly DocsDrawingReview[], imageReviews: readonly DocsPngReview[]): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
  const selectedCases = selectDocsCases(inventory.cases, options)
  const startedAt = new Date().toISOString(), observations: BenchmarkObservation[] = [], gaps: string[] = []
  const prepared: PreparedCommunity[] = options.communityPreparedFile ? JSON.parse(readFileSync(options.communityPreparedFile, 'utf8')) : []
  const browsers: PreparedCommunityBrowser[] = options.communityBrowserPreparedFile ? JSON.parse(readFileSync(options.communityBrowserPreparedFile, 'utf8')) : []
  for (const rows of [prepared, browsers]) if (!Array.isArray(rows) || new Set(rows.map(row => row.node.id)).size !== rows.length) throw Error('PNG preparation requires unique frozen project identities')
  const projects = options.communityProjects ?? [...new Set([...prepared, ...browsers].map(row => row.node.id))]
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'community-prepared.json'), JSON.stringify(prepared))
  const retained = join(options.out, 'drawings'); mkdirSync(retained, { recursive: true })
  const conversionRequired = projects.some(project => docsPngTransport(prepared.find(row => row.node.id === project), browsers.find(row => row.node.id === project)) === 'svg-conversion')
  const context = { format: 'png', driver: process.versions, browser: conversionRequired ? executableIdentity(options.executable ?? defaultChromium(chromium)) : null, artifacts: prepared, preparedBrowsers: browsers, rounds: options.rounds, selectedCaseIds: selectedCases.map(input => input.id), calls: 'One actual output call per occurrence per round; no adaptive repetition or implicit artifact acquisition.', timing: 'Descriptive only: browser includes public SVG render + serialization/raster/PNG encoding; native/Node API clocks exclude startup; CLI includes startup. Clocks with different boundaries do not share a speed ranking.', correctness: 'Actual PNG/source/expectation hashes need a full content review. Decoding and nonblank checks alone never pass content.' }
  writeFileSync(join(options.out, 'context.json'), JSON.stringify(context, null, 2))
  const checkpoint = new CollectionCheckpoint(options.out, { inventory, sourceReviews, imageReviews, context, projects, rounds: options.rounds, producers: protocolIdentity(options.harnessRoot ?? options.root, ['unified/docs-png-lane.ts', 'unified/community-worker.mjs']) }, options.collectionDeadline)
  let budgetError: CollectionBudgetExhausted | undefined
  let browserHost: Awaited<ReturnType<typeof chromium.launch>> | undefined
  try {
    for (let round = 1; round <= options.rounds; round++) for (const project of docsRoundOrder(projects, round)) {
      checkCollectionBudget(options.collectionDeadline)
      const unit = await checkpoint.collect(JSON.stringify([project, round]), async () => {
      const peer = prepared.find(row => row.node.id === project), browser = browsers.find(row => row.node.id === project), transport = docsPngTransport(peer, browser)
      const version = transport === 'svg-conversion' ? browser!.browser!.version : peer?.artifact?.version ?? 'unavailable'
      const own: BenchmarkObservation[] = []
      let conversion: { close: () => Promise<void>; invoke: (source: string, id: string) => Promise<any> } | undefined
      let rendered: BenchmarkObservation[] = []
      try {
        if (transport === 'svg-conversion') {
          const engine = browser!.browser!; admitPreparedFidelityEngine(browser!)
          browserHost ??= await chromium.launch({ headless: true, executablePath: options.executable ?? defaultChromium(chromium) })
          const server = docsArtifactServer(engine.root, engine.zenuml)
          await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
          const origin = 'http://127.0.0.1:' + (server.address() as any).port
          const context = await browserHost.newContext({ viewport: { width: 1400, height: 1000 } }), page = await context.newPage()
          context.setDefaultTimeout(20_000)
          await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
          conversion = { close: () => closeDocsContext(context, server), invoke: (source, id) => callDocsPage(page, publicDocsPngAction, { source, id }) }
          await page.goto(origin + '/blank')
          if (engine.kind === 'franken' || engine.kind === 'merman') await callDocsPage(page, publicSvgBrowserAction, { type: 'initialize-module', kind: engine.kind, url: origin + '/' + engine.entry, wasm: origin + '/' + engine.wasm })
          else { await withDocsDeadline(() => page.addScriptTag({ url: origin + '/' + engine.entry, ...(engine.scriptType ? { type: engine.scriptType } : {}) }), () => { void page.close().catch(() => {}) }); await callDocsPage(page, publicSvgBrowserAction, { type: 'initialize-global', engine, addonUrl: engine.zenuml ? origin + '/__addon/' + engine.zenuml.entry : undefined }) }
        } else if (transport !== 'unavailable') {
          verifyProvidedCommunityArtifact(peer!.artifact!)
          const workloads = selectedCases.map(input => ({ id: input.id, family: input.family, source: input.source, expectedLabels: [], features: ['retain-output-witness'], provenance: 'Pinned Mermaid syntax documentation; source path/line in inventory.json' }))
          rendered = transport === 'native' ? await runExternalCommunity(peer!, workloads, 'png', round, { ...options, communityCoverageOnce: true }) : transport === 'node' ? await runCommunityNodeRound(peer!, 'png', workloads, round, { ...options, communityCoverageOnce: true }) : workloads.map(input => runCommunityCli(peer!, 'png', input, round, options.out))
        }
        for (const [index, input] of selectedCases.entries()) {
          checkCollectionBudget(options.collectionDeadline)
          const expected = sourceReviews.find(review => review.id === input.id) ?? null
          let bytes: Uint8Array | undefined, status: BenchmarkObservation['status'] = 'blocked', detail: string | undefined, durationMs: number | undefined
          if (conversion) {
            const value = await conversion.invoke(input.source, `docs_png_${round}_${index}`)
            if (value.status === 'ok') { bytes = Uint8Array.from(value.png); durationMs = value.totalMs; status = 'passed' } else { status = value.status === 'blocked' ? 'blocked' : 'failed'; detail = value.detail }
          } else {
            const row = rendered.find(row => row.caseId === input.id)
            status = row?.status ?? 'blocked'; detail = row ? row.detail : peer?.error ?? browser?.browserDetail ?? 'No frozen native PNG or SVG-to-PNG transport is available'
            const file = row?.metrics?.outputFile
            if (typeof file === 'string' && existsSync(file)) bytes = readFileSync(file)
            if (typeof row?.metrics?.firstMs === 'number') durationMs = row.metrics.firstMs
          }
          if (bytes) {
            const inspection = inspectPng(bytes, false)
            if (inspection.findings.length) { status = inspection.unavailable ? 'blocked' : 'failed'; detail = inspection.findings.join('; ') }
          }
          const witness = bytes ? 'drawings/' + createHash('sha256').update(bytes).digest('hex') + '.png' : undefined
          if (bytes && witness && !existsSync(join(options.out, witness))) writeFileSync(join(options.out, witness), bytes)
          const metrics = { project, version, round, measuredAt: new Date().toISOString(), transport, timingQualified: false, ...(witness ? { witness } : {}) }
          own.push({ suite: 'docs', surface: transport === 'svg-conversion' ? 'browser:png-export' : 'public:png', runtime: transport === 'svg-conversion' ? 'Chromium' : 'see retained transport observations', family: input.family, caseId: input.id, operation: 'render', format: 'png', mode: 'one-public-output-call', status, detail, ...(status === 'passed' && durationMs !== undefined ? { samplesMs: [durationMs] } : {}), metrics: { ...metrics, bytes: bytes?.length ?? null } })
          if (round === 1) {
            const assessment = assessDocsPng(input, expected, bytes, imageReviews)
            own.push({ suite: 'docs', surface: 'png:reviewed-content', runtime: 'retained PNG', family: input.family, caseId: input.id, operation: 'drawing-checks', format: 'png', mode: 'reviewed-first-round-output', status: assessment.status === 'correct' ? 'passed' : assessment.status === 'incorrect' ? 'failed' : assessment.status === 'not-applicable' ? 'not-applicable' : 'blocked', detail: JSON.stringify(assessment), metrics: { ...metrics, reviewedSource: !!expected } })
          }
        }
        if (browser && transport === 'svg-conversion') admitPreparedFidelityEngine(browser)
        else if (peer?.artifact) verifyProvidedCommunityArtifact(peer.artifact)
      } catch (error) {
        if (error instanceof CollectionBudgetExhausted) { writeFileSync(join(options.out, `interrupted-${encodeURIComponent(project)}-r${round}.json`), JSON.stringify(own)); throw error }
        gaps.push(project + ': ' + String(error))
        own.push({ suite: 'docs', surface: 'public:png', runtime: transport, family: '*', caseId: project, operation: 'round', format: 'png', mode: 'not-completed', status: 'blocked', detail: String(error), metrics: { project, version, round, plannedOccurrences: inventory.occurrences } })
      } finally { try { await conversion?.close() } catch (error) { gaps.push(project + ': bounded browser cleanup: ' + String(error)) } }
      writeFileSync(join(options.out, `transport-${encodeURIComponent(project)}-r${round}.json`), JSON.stringify(rendered))
      return own
      })
      observations.push(...unit)
      writeFileSync(join(options.out, 'observations.json'), JSON.stringify(observations))
    }
  } catch (error) { if (error instanceof CollectionBudgetExhausted) budgetError = error; else throw error } finally { await browserHost?.close() }
  const result: UnifiedSuiteResult = { id: 'docs', startedAt: checkpoint.startedAt ?? startedAt, finishedAt: new Date().toISOString(), status: budgetError ? 'blocked' : observations.some(row => row.status === 'failed') ? 'failed' : observations.some(row => row.status === 'blocked') ? 'blocked' : 'passed', observations, artifacts: [retained], gaps: [...gaps, 'PNG return/decode and reviewed source-content are separate. Native PNG needs no SVG. SVG conversion, native API and CLI clocks retain different boundaries; no qualified speed ranking.'] }
  writeFileSync(join(options.out, 'result.json'), JSON.stringify(result))
  if (budgetError) throw budgetError
  return result
}
