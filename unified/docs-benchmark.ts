import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { docsArtifactServer, callDocsPage, withDocsDeadline, closeDocsContext, initializeDocsPage } from './docs-runtime.ts'
export { docsArtifactServer, callDocsPage, withDocsDeadline, closeDocsContext } from './docs-runtime.ts'
import { readDocsResources, routeDocsResource } from './docs-resources.ts'
import { artifactVariants, selectArtifactVariant } from './artifact-variants.ts'
import { selectDocsCases } from './docs-selection.ts'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { inspectFidelityPaint } from '../fidelity/paint.ts'
import { inspectQuantitativePaint } from '../fidelity/paint-values.ts'
import { inspectSourceFacts, mergePaintChecks } from '../fidelity/paint-facts.ts'
import { inspectChartFacts } from '../fidelity/paint-chart-facts.ts'
import { evidenceDigest } from '../portable/evidence-contract.ts'
import { makeSvgObservationBinding } from '../fidelity/svg-assessment.ts'
import { admitDocsReviews, assessDocsDrawing, reviewedDocsCase, type DocsDrawingReview } from './docs-drawings.ts'
import { qualifyOutput } from './qualification.ts'
import { tridentDirectory } from './trident-paths.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { CollectionBudgetExhausted, CollectionCheckpoint, checkCollectionBudget } from '../portable/checkpoint.ts'
import { admitCurrentReference, currentReferencePin } from '../reference/source.ts'
import { admitPreparedSvgEngine, isSvgCli, preparedSvgInvocation, renderPreparedSvgCli } from '../fidelity/community.ts'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import type { PreparedCommunityBrowser } from './community-browser.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { protocolIdentity } from './protocol-identity.ts'
import type { UnifiedRunOptions, UnifiedSuiteResult, BenchmarkObservation } from './types.ts'
import { mermaidOracleDirectory, mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'
import { runDocsPngLane } from './docs-png-lane.ts'
import { admitPngReviews, type DocsPngReview } from './docs-png-drawings.ts'
import { readDocsPngRasterProfile, readRetainedPngSvg, readRetainedPng, bindDocsPngConversionReturn, retainPngReference, qualifyRetainedDocsPngConversion } from './docs-png-qualification.ts'
import type { FrozenRasterProfile } from './png-preservation.ts'

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

async function runSvgDocsBenchmark(options: UnifiedRunOptions, suppliedInventory?: ReturnType<typeof docsInventory>): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed()
  const startedAt = new Date().toISOString(), observations: BenchmarkObservation[] = [], gaps: string[] = []
  if (!options.communityBrowserPreparedFile) throw Error('Docs benchmark needs a frozen public browser preparation manifest')
  admitCurrentReference(options.mermaidDir ?? mermaidUpstreamDirectory(), options.referenceDir ?? mermaidOracleDirectory())
  const inventory = suppliedInventory ?? docsInventory(options.mermaidDir)
  const reviewFile = options.docsReviewFile ?? join(tridentDirectory, 'corpus/docs-reviewed.json')
  const reviewBytes = readFileSync(reviewFile), reviews = JSON.parse(reviewBytes.toString()) as DocsDrawingReview[]
  const drawingInventory = admitDocsReviews(inventory.cases, reviews)
  const selectedCases = selectDocsCases(inventory.cases, options)
  const drawingReview = { protocol: 'reviewed-docs-svg-content-v1', sha256: createHash('sha256').update(reviewBytes).digest('hex'), cases: drawingInventory }
  const original = JSON.parse(readFileSync(options.communityBrowserPreparedFile, 'utf8')) as PreparedCommunityBrowser[]
  const selections = artifactVariants(options, original)
  const prepared = original.map(peer => selectArtifactVariant(peer, 'svg', selections))
  if (!Array.isArray(prepared) || new Set(prepared.map(peer => peer.node.id)).size !== prepared.length) throw Error('Prepared project identities must be a unique array')
  for (const project of options.communityProjects ?? []) if (!prepared.some(peer => peer.node.id === project)) {
    observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: '*', caseId: project, operation: 'artifact-admission', format: 'svg', mode: 'not-executed', status: 'blocked', detail: 'Selected project is absent from frozen preparation', metrics: { project, plannedOccurrences: inventory.occurrences, runtimeExecuted: false } })
    gaps.push(project + ': missing frozen preparation')
  }
  const selected = prepared.filter(peer => !options.communityProjects || options.communityProjects.includes(peer.node.id))
  const producers = protocolIdentity(options.harnessRoot ?? options.root, ['unified/docs-benchmark.ts'])
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'inventory.json'), JSON.stringify({ ...inventory, protocol: 'public-docs-svg-return-v1', producers, drawingReview }, null, 2))
  const resources = readDocsResources(options.docsResourcesFile)
  const executable = options.executable ?? defaultChromium(chromium)
  const targets: PreparedCommunityBrowser[] = []
  for (const peer of selected) {
    try { admitPreparedSvgEngine(peer); targets.push(peer) }
    catch (error) {
      const detail = String(error), status = !peer.node.outputs.includes('svg') ? 'unsupported' as const : 'blocked' as const
      observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: '*', caseId: peer.node.id, operation: 'artifact-admission', format: 'svg', mode: 'not-executed', status, detail, metrics: { project: peer.node.id, plannedOccurrences: inventory.occurrences, runtimeExecuted: false } })
      gaps.push(peer.node.id + ': ' + detail)
    }
  }
  writeFileSync(join(options.out, 'context.json'), JSON.stringify({
    protocol: 'public-docs-svg-return-v1', resources: { manifestSha256: resources.manifestSha256, files: resources.identity }, producers, drawingReview, browser: executableIdentity(executable), driver: process.versions,
    selectedCaseIds: selectedCases.map(input => input.id), rounds: options.rounds, warmupAttemptsPerRound: options.rounds === 1 ? 0 : 30, pinnedSource: inventory.pin,
    projectOrderByRound: Array.from({ length: options.rounds }, (_, index) => docsRoundOrder(targets, index + 1).map(peer => peer.node.id)),
    artifacts: targets.map(peer => ({ project: peer.node.id, admission: admitPreparedSvgEngine(peer) })),
    timing: 'Public SVG call through returned output. Browser API excludes process startup; CLI includes spawn through drained output. Unlike boundaries have no shared speed ranking. Output observation follows the clock; no A/A performance qualification.',
    hostDeadlineMs: 20000, network: 'Prepared artifact origin only',
  }, null, 2))
  const checkpoint = new CollectionCheckpoint(options.out, { context: JSON.parse(readFileSync(join(options.out, 'context.json'), 'utf8')), inventory }, options.collectionDeadline)
  const journal = new InvocationJournal(join(options.out, 'invocations'))
  let budgetError: CollectionBudgetExhausted | undefined
  const browser = targets.length ? await chromium.launch({ headless: true, executablePath: executable }) : undefined
  try {
    for (let round = 1; round <= options.rounds; round++) {
      const order = docsRoundOrder(targets, round)
      for (const peer of order) {
        const key = JSON.stringify([round, peer.node.id])
        const recorded = await checkpoint.collect(key, async () => {
        const roundObservations: BenchmarkObservation[] = []
        const engine = preparedSvgInvocation(peer, admitPreparedSvgEngine(peer)), root = resolve(engine.root)
        console.log(`docs round ${round}/${options.rounds}: ${peer.node.id} (${inventory.occurrences} occurrences)`)
        const server = docsArtifactServer(root, engine.zenuml)
        await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
        const origin = 'http://127.0.0.1:' + (server.address() as { port: number }).port
        const context = await browser!.newContext({ viewport: { width: 1400, height: 1000 } })
        let page = await context.newPage(), healthy = false
        let observer: any = await context.newPage()
        await observer.goto(origin + '/observer')
        const invoke = async (input: any) => isSvgCli(peer) ? renderPreparedSvgCli(peer, input.source, input.id, options.out) : callDocsPage(page, publicSvgBrowserAction, input)
        page.setDefaultTimeout(20_000)
        await context.route('**/*', route => routeDocsResource(route, origin, resources))
        const initialize = async () => {
          if (page.isClosed() || !healthy) { void page.close().catch(() => {}); page = await context.newPage(); page.setDefaultTimeout(20_000) }
          if (engine.kind === 'cli') await page.goto(origin + '/blank')
          else await initializeDocsPage(page, engine, origin)
          healthy = true
        }
        try {
          await initialize()
          let warmupPassed = 0
          for (let index = 0; index < (options.rounds === 1 ? 0 : 30); index++) {
            checkCollectionBudget(options.collectionDeadline)
            const value = await invoke({ type: 'measure-docs', source: inventory.cases[index % inventory.cases.length]!.source, id: `warmup_${round}_${index}` })
            if (value.status === 'passed') warmupPassed++
          }
          for (const [index, testCase] of selectedCases.entries()) {
            checkCollectionBudget(options.collectionDeadline)
            if (!healthy || page.isClosed()) await initialize()
            const rawKey = JSON.stringify(['raw-svg', round, peer.node.id, peer.artifact?.transportVariant ?? 'primary', testCase.id])
            let raw = checkpoint.get<{ value: any; measuredAt: string | null; invocationId: string | null }>(rawKey)
            if (!raw) {
              let value: any
              const identity = { project: peer.node.id, caseId: testCase.id, sourceSha256: evidenceBytesDigest(testCase.source), artifactSha256: engine.artifactSha256!, bindingSha256: evidenceDigest({ format: 'svg', engine, round, variant: peer.artifact?.transportVariant ?? 'primary' }), format: 'svg' }
              if (engine.kind !== 'cli') for (const pending of journal.pending(identity)) journal.failed(pending, 'Prior invocation has no recorded return; resumed with a new attempt', null, 'interrupted')
              const attempt = engine.kind === 'cli' ? undefined : journal.start(identity)
              try { value = await invoke({ type: 'measure-docs', source: testCase.source, id: `docs_${round}_${index}`, retainSvg: true }) }
              catch (error) { healthy = false; server.closeAllConnections?.(); value = { status: 'blocked', error: 'Host transport deadline/closure: ' + String(error) } }
              if (attempt) {
                if (typeof value.svg === 'string') journal.returned(attempt, value.svg, Number.isFinite(value.durationMs) ? value.durationMs : null)
                else journal.failed(attempt, value.error ?? 'Public call returned no SVG witness', null, value.status === 'blocked' ? 'interrupted' : 'public-error')
              }
              const inner = value.transportObservation?.metrics
              const invocationId = attempt?.attemptId ?? (typeof inner?.rawInvocationId === 'string' ? inner.rawInvocationId : null)
              const owner = attempt ? journal : typeof inner?.rawInvocationDirectory === 'string' ? new InvocationJournal(inner.rawInvocationDirectory) : undefined
              const measuredAt = invocationId ? owner?.outcome(invocationId)?.finishedAt ?? null : null
              raw = checkpoint.record(rawKey, { value, measuredAt, invocationId, recordedAt: new Date().toISOString() })
            }
            const { value } = raw
            roundObservations.push({ suite: 'docs', surface: engine.kind === 'cli' ? 'public:svg' : 'browser:svg', runtime: engine.kind === 'cli' ? 'public CLI' : 'Chromium', family: testCase.family, caseId: testCase.id, operation: 'render', format: 'svg', mode: 'one-public-call', status: value.status, ...(value.status === 'passed' ? { samplesMs: [value.durationMs] } : { detail: value.error }), metrics: { project: peer.node.id, version: engine.version, measuredAt: raw.measuredAt, rawInvocationId: raw.invocationId, round, variant: peer.artifact?.transportVariant ?? 'primary', bytes: value.bytes ?? null, warmupAttempts: options.rounds === 1 ? 0 : 30, warmupPassed, ...(value.transportObservation ? { transportObservation: value.transportObservation } : {}) } })
            if (round === 1) {
              const review = drawingInventory.find(input => input.id === testCase.id)!.review
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
                        const facts = await currentObserver.evaluate(inspectSourceFacts, { family: authored.family, source: testCase.source, expected: authored.expected, paint, quantitative })
                        const chartFacts = await currentObserver.evaluate(inspectChartFacts, { family: authored.family, source: testCase.source, expected: authored.expected, paint, quantitative })
                        return assessDocsDrawing(testCase, review, value.status, admission.ok, mergePaintChecks(paint.checks, quantitative, facts, chartFacts), makeSvgObservationBinding(authored, createHash('sha256').update(value.svg).digest('hex'), evidenceDigest(producers)))
                      })(),
                      new Promise<never>((_, reject) => { inspectionTimer = setTimeout(() => { void currentObserver.close().catch(() => {}); reject(Error('Drawing observer exceeded20s deadline')) }, 20_000) }),
                    ])
                  } finally { if (inspectionTimer) clearTimeout(inspectionTimer) }
                } else assessment = assessDocsDrawing(testCase, review, value.status, false, [])
              } catch (error) { assessment = { status: 'unknown', reason: 'Drawing observer did not complete: ' + String(error) } }
              roundObservations.push({ suite: 'docs', surface: engine.kind === 'cli' ? 'public:svg' : 'browser:svg', runtime: engine.kind === 'cli' ? 'public CLI' : 'Chromium', family: testCase.family, caseId: testCase.id, operation: 'drawing-checks', format: 'svg', mode: 'reviewed-first-round-output', status: assessment.status === 'correct' ? 'passed' : assessment.status === 'incorrect' ? 'failed' : assessment.status === 'not-applicable' ? 'not-applicable' : 'blocked', detail: JSON.stringify(assessment), metrics: { project: peer.node.id, version: engine.version, measuredAt: raw.measuredAt, rawInvocationId: raw.invocationId, round, variant: peer.artifact?.transportVariant ?? 'primary', reviewedSource: !!review, ...(witness ? { witness } : {}) } })
            }
          }
        } catch (error) {
          if (error instanceof CollectionBudgetExhausted) {
            writeFileSync(join(options.out, `interrupted-round-${round}-${encodeURIComponent(peer.node.id)}-${Date.now()}.json`), JSON.stringify({ project: peer.node.id, round, status: 'incomplete', observations: roundObservations }))
            throw error
          }
          roundObservations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: '*', caseId: peer.node.id, operation: 'round', format: 'svg', mode: 'not-completed', status: 'blocked', detail: String(error), metrics: { project: peer.node.id, round, plannedOccurrences: inventory.occurrences } })
          gaps.push(`${peer.node.id} round ${round}: ${error}`)
        } finally { try { await closeDocsContext(context, server) } catch (error) { gaps.push(peer.node.id + ': bounded browser cleanup: ' + String(error)) } }
        admitPreparedSvgEngine(peer)
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

/** Optional post-collection proof inspects only retained exact conversion
 * inputs. It invokes neither a renderer nor another project's SVG lane. */
export async function qualifyCollectedDocsPng(options: UnifiedRunOptions, result: UnifiedSuiteResult, inventory: ReturnType<typeof docsInventory>, reviews: readonly DocsDrawingReview[], pngReviews: readonly DocsPngReview[], raster: { profile: FrozenRasterProfile; fileSha256: string }) {
  const candidates = result.observations.filter(row => row.operation === 'drawing-checks' && row.format === 'png' && row.metrics?.transport === 'svg-conversion' && row.status === 'blocked')
  if (!candidates.length) return result
  const executable = options.executable ?? defaultChromium(chromium), producers = protocolIdentity(options.harnessRoot ?? options.root, ['unified/docs-benchmark.ts'])
  const observerSha256 = evidenceDigest({ producers, browser: executableIdentity(executable), profileSha256: raster.fileSha256, mode: 'isolated retained conversion SVG; no network or project scripts' })
  const browser = await chromium.launch({ headless: true, executablePath: executable })
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, serviceWorkers: 'block' })
  await context.route('**/*', route => route.request().url() === 'http://trident.invalid/observer' ? route.fulfill({ contentType: 'text/html', headers: { 'content-security-policy': "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:; connect-src 'none'; object-src 'none'" }, body: '<!doctype html><meta charset="utf-8"><body>' }) : route.abort())
  let page: any = await context.newPage()
  let correct = 0
  try {
    for (const row of candidates) {
      const input = inventory.cases.find(item => item.id === row.caseId), review = reviews.find(item => item.id === row.caseId)
      if (!input || !review || review.intent !== 'drawing' || typeof row.metrics?.witness !== 'string') continue
      const originalAssessment = row.detail
      try {
        checkCollectionBudget(options.collectionDeadline)
        const originalSvg = readRetainedPngSvg(options.out, typeof row.metrics.originalSvgWitness === 'string' ? row.metrics.originalSvgWitness : undefined), rasterizedSvg = readRetainedPngSvg(options.out, typeof row.metrics.rasterizedSvgWitness === 'string' ? row.metrics.rasterizedSvgWitness : undefined)
        const returned = result.observations.find(item => item.operation === 'render' && item.format === 'png' && item.caseId === row.caseId && item.metrics?.project === row.metrics?.project && item.metrics?.round === row.metrics?.round && item.metrics?.variant === row.metrics?.variant)
        const actualPng = readRetainedPng(options.out, row.metrics.witness)
        const returnEvidence = returned?.status === 'passed' ? bindDocsPngConversionReturn({ root: options.out, project: String(row.metrics.project), round: Number(row.metrics.round), variant: typeof row.metrics.variant === 'string' ? row.metrics.variant : undefined, source: input, actualPng, originalSvg, rasterizedSvg, attemptId: typeof row.metrics.rawInvocationId === 'string' ? row.metrics.rawInvocationId : undefined }) : undefined
        const qualification = await qualifyRetainedDocsPngConversion({ source: input, review, actualPng, originalSvg, rasterizedSvg, returnEvidence, profile: raster.profile, pngReviews, observerSha256, inspectSvg: async (svg, authored) => {
          if (page.isClosed()) page = await context.newPage()
          await page.goto('http://trident.invalid/observer')
          return withDocsDeadline(async () => {
            await page.setContent(svg, { waitUntil: 'domcontentloaded' })
            await page.evaluate(async () => { await document.fonts.ready })
            const paint = await page.evaluate(inspectFidelityPaint, { family: authored.family, expected: authored.expected })
            const quantitative = await page.evaluate(inspectQuantitativePaint, { family: authored.family, expected: authored.expected, source: authored.source, nodes: paint.nodes })
            const facts = await page.evaluate(inspectSourceFacts, { family: authored.family, expected: authored.expected, source: authored.source, paint, quantitative })
            const charts = await page.evaluate(inspectChartFacts, { family: authored.family, expected: authored.expected, source: authored.source, paint, quantitative })
            return mergePaintChecks(paint.checks, quantitative, facts, charts)
          }, () => { void page.close().catch(() => {}) })
        } })
        const { referencePng, ...assessment } = qualification as typeof qualification & { referencePng?: Uint8Array }
        if (referencePng) {
          row.metrics.referencePngWitness = retainPngReference(options.out, referencePng)
        }
        row.detail = JSON.stringify({ ...assessment, originalContentAssessment: originalAssessment })
        row.status = assessment.status === 'correct' ? 'passed' : assessment.status === 'incorrect' ? 'failed' : 'blocked'
        row.metrics = { ...row.metrics, preservationObserverSha256: observerSha256, rasterProfileSha256: raster.fileSha256 }
        if (assessment.status === 'correct') correct++
      } catch (error) { if (error instanceof CollectionBudgetExhausted) throw error; row.detail = JSON.stringify({ status: 'unknown', reason: 'Retained conversion proof did not complete: ' + String(error), originalContentAssessment: originalAssessment }); row.status = 'blocked' }
    }
  } finally { await context.close(); await browser.close() }
  const receipt = join(options.out, 'png-preservation-receipt.json')
  writeFileSync(receipt, JSON.stringify({ schema: 'trident-docs-png-preservation-run-v1', observerSha256, rasterProfileSha256: raster.fileSha256, profile: raster.profile, projectRendererInvocations: 0, referenceRasterizerMode: 'Offline deterministic reference only', attempted: candidates.length, correct, unknownOrIncorrect: candidates.length - correct }))
  const qualified = { ...result, status: result.observations.some(row => row.status === 'failed') ? 'failed' as const : result.observations.some(row => row.status === 'blocked') ? 'blocked' as const : 'passed' as const, artifacts: [...(result.artifacts ?? []), receipt], gaps: [...result.gaps, 'Optional conversion proof freshly checks exact retained raster input and requires an independent full PNG content review of its reference image. Native PNG remains independently reviewed.'] }
  writeFileSync(join(options.out, 'result.json'), JSON.stringify(qualified))
  return qualified
}

/** One corpus, two independently selectable output lanes. A PNG-only artifact
 * never goes through SVG admission. Raw output and correctness stay separate. */
export async function runDocsBenchmark(options: UnifiedRunOptions): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed()
  admitCurrentReference(options.mermaidDir ?? mermaidUpstreamDirectory(), options.referenceDir ?? mermaidOracleDirectory())
  const formats = options.docsFormats ?? ['svg', 'png']
  if (!formats.length || new Set(formats).size !== formats.length || formats.some(format => !['svg', 'png'].includes(format))) throw Error('DaveBench formats must be unique svg,png lanes')
  const inventory = docsInventory(options.mermaidDir), reviewBytes = readFileSync(options.docsReviewFile ?? join(tridentDirectory, 'corpus/docs-reviewed.json'))
  options = { ...options, docsCaseIds: selectDocsCases(inventory.cases, options).map(input => input.id) }
  const reviews = JSON.parse(reviewBytes.toString()) as DocsDrawingReview[], reviewed = admitDocsReviews(inventory.cases, reviews)
  const pngBytes = formats.includes('png') && options.docsPngReviewFile ? readFileSync(options.docsPngReviewFile) : Buffer.from('[]')
  const pngReviews = admitPngReviews(inventory.cases, reviews, JSON.parse(pngBytes.toString()) as DocsPngReview[])
  const raster = formats.includes('png') && options.docsPngRasterProfileFile ? readDocsPngRasterProfile(options.docsPngRasterProfileFile) : undefined
  const prepared = options.communityPreparedFile ? JSON.parse(readFileSync(options.communityPreparedFile, 'utf8')) : []
  const browsers = options.communityBrowserPreparedFile ? JSON.parse(readFileSync(options.communityBrowserPreparedFile, 'utf8')) : []
  for (const entries of [prepared, browsers]) if (!Array.isArray(entries) || new Set(entries.map((peer: any) => peer.node.id)).size !== entries.length) throw Error('DaveBench frozen identities must be unique')
  const projects: string[] = options.communityProjects ?? [...new Set([...prepared, ...browsers].map((peer: any) => peer.node.id))] as string[]
  if (!projects.length) throw Error('DaveBench requires selected frozen public artifacts')
  const startedAt = new Date().toISOString(), results: UnifiedSuiteResult[] = []
  mkdirSync(options.out, { recursive: true })
  const producers = protocolIdentity(options.harnessRoot ?? options.root, ['unified/docs-benchmark.ts'])
  const identity = { ...inventory, protocol: 'public-docs-output-lanes-v2', formats, producers, selectedCaseIds: options.docsCaseIds, drawingReview: { protocol: 'reviewed-docs-svg-content-v1', sha256: createHash('sha256').update(reviewBytes).digest('hex'), cases: reviewed }, pngReviewSha256: createHash('sha256').update(pngBytes).digest('hex'), ...(raster ? { pngRasterProfile: raster } : {}) }
  const inventoryPath = join(options.out, 'inventory.json')
  if (existsSync(inventoryPath) && JSON.stringify(JSON.parse(readFileSync(inventoryPath, 'utf8'))) !== JSON.stringify(identity)) throw Error('Documentation source, output lanes or review identity changed; use a fresh campaign')
  writeFileSync(inventoryPath, JSON.stringify(identity, null, 2))
  let budgetError: CollectionBudgetExhausted | undefined
  for (const format of formats) {
    const out = join(options.out, format)
    try {
      if (format === 'svg') {
        const svgProjects = projects.filter(project => { const peer = [...prepared, ...browsers].find((peer: any) => peer.node.id === project); return !peer || peer.node.outputs.includes('svg') || peer.node.benchmark?.outputs?.includes('svg') })
        if (svgProjects.length) results.push(await runSvgDocsBenchmark({ ...options, out, communityProjects: svgProjects }, inventory))
      } else {
        const pngProjects = projects.filter(project => { const peer = [...prepared, ...browsers].find((peer: any) => peer.node.id === project); return !peer || [...peer.node.outputs, ...(peer.node.benchmark?.outputs ?? [])].some(output => ['svg', 'png'].includes(output)) })
        if (pngProjects.length) {
          const pngOptions = { ...options, out, communityProjects: pngProjects }, collected = await runDocsPngLane(pngOptions, inventory, reviews, pngReviews)
          results.push(raster ? await qualifyCollectedDocsPng(pngOptions, collected, inventory, reviews, pngReviews, raster) : collected)
        }
      }
    } catch (error) {
      if (!(error instanceof CollectionBudgetExhausted)) throw error
      budgetError = error
      if (existsSync(join(out, 'result.json'))) results.push(JSON.parse(readFileSync(join(out, 'result.json'), 'utf8')))
      break
    }
  }
  const observations: BenchmarkObservation[] = results.flatMap(result => result.observations.map(row => ({ ...row, metrics: row.metrics ? { ...row.metrics, ...Object.fromEntries(['witness', 'originalSvgWitness', 'rasterizedSvgWitness', 'referencePngWitness'].flatMap(key => typeof row.metrics?.[key] === 'string' ? [[key, row.format + '/' + row.metrics[key]]] : [])) } : row.metrics })))
  for (const project of projects) for (const format of formats) {
    const peer = [...prepared, ...browsers].find((peer: any) => peer.node.id === project)
    if (!peer) continue
    const outputs = [...peer.node.outputs, ...(peer.node.benchmark?.outputs ?? [])]
    if (format === 'svg' ? outputs.includes('svg') : outputs.some(output => ['svg', 'png'].includes(output))) continue
    observations.push({ suite: 'docs', surface: 'declared-capability', runtime: 'not-invoked', family: '*', caseId: project, operation: 'format-admission', format, mode: 'format-not-applicable', status: 'not-applicable', detail: 'The requested output lane is not declared; no render call or zero score is inferred.', metrics: { project, version: peer.artifact?.version ?? 'unavailable' } })
  }
  const result: UnifiedSuiteResult = { id: 'docs', startedAt: results.map(row => row.startedAt).sort()[0] ?? startedAt, finishedAt: new Date().toISOString(), status: budgetError ? 'blocked' : results.some(row => row.status === 'failed') ? 'failed' : results.some(row => row.status === 'blocked') ? 'blocked' : observations.length && observations.every(row => row.status === 'not-applicable') ? 'not-applicable' : 'passed', observations, gaps: results.flatMap(row => row.gaps), artifacts: [inventoryPath, ...formats.map(format => join(options.out, format))] }
  writeFileSync(join(options.out, 'result.json'), JSON.stringify(result))
  const rows = formats.flatMap(format => projects.map(project => { const own = observations.filter(row => row.format === format && row.metrics?.project === project), returned = inventory.cases.filter(input => { const calls = own.filter(row => row.operation === 'render' && row.caseId === input.id); return calls.length === options.rounds && calls.every(row => row.status === 'passed') }).length, checked = own.filter(row => row.operation === 'drawing-checks'), correct = checked.filter(row => row.status === 'passed').length; return { format, project, returned, correct, incorrect: checked.filter(row => row.status === 'failed').length, notDrawing: checked.filter(row => row.status === 'not-applicable').length, unknown: inventory.occurrences - checked.filter(row => ['passed', 'failed', 'not-applicable'].includes(row.status)).length, measured: own.some(row => row.operation === 'render' || row.operation === 'drawing-checks') } })).sort((a, b) => a.format.localeCompare(b.format) || b.correct - a.correct || b.returned - a.returned || a.project.localeCompare(b.project))
  writeFileSync(join(options.out, 'report.md'), '# DaveBench: documentation examples\n\nCorpus: Mermaid ' + inventory.pin.commit + '; ' + inventory.occurrences + ' occurrences / ' + inventory.pages.length + ' syntax pages; ' + options.rounds + ' rounds. Source paths, line numbers, reviews and producer hashes: inventory.json. Same sources in each output lane. Ranks count first-round verified correct drawings; unknowns remain visible and cannot supply complete accuracy.\n\n| Format | Rank | Project | Correct | Incorrect | Unknown | Not a drawing | Returned in all rounds | Planned |\n|---|---:|---|---:|---:|---:|---:|---:|---:|\n' + rows.map(row => `| ${row.format} | ${row.correct + row.incorrect > 0 ? 1 + rows.filter(other => other.format === row.format && other.correct > row.correct).length : '—'} | ${row.project} | ${row.measured ? row.correct : 'N/A'} | ${row.measured ? row.incorrect : 'N/A'} | ${row.measured ? row.unknown : 'N/A'} | ${row.measured ? row.notDrawing : 'N/A'} | ${row.measured ? row.returned : 'N/A'} | ${inventory.occurrences} |`).join('\n') + '\n\nPNG decode/nonblank and SVG witnesses do not establish PNG content. SVG return, native PNG and SVG-plus-conversion clocks retain their declared boundaries; all new timing is descriptive until correctness and calibration qualify a comparison.\n')
  if (budgetError) throw budgetError
  return result
}
