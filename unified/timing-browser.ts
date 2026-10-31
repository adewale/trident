import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium, type Route } from 'playwright'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { writeDurableEvidence } from '../portable/checkpoint.ts'
import { environmentIdentity } from '../portable/environment.ts'
import { evidenceBytesDigest, evidenceDigest, admitCheckedEvidence, type CheckedEvidence } from '../portable/evidence-contract.ts'
import { collectQualifiedTiming, launchOwnedTimingBrowser, type QualifiedTimingPublicDriver, type ObserveTimedOutput, type TimingCoordinate } from '../portable/qualified-timing-collection.ts'
import { admitTimingPlan, type TimingPlan } from '../portable/qualified-timing.ts'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { admitPreparedFidelityEngine } from '../fidelity/community.ts'
import { sourceContractComplete } from '../fidelity/source-contract.ts'
import { makeSvgCaseContract } from '../fidelity/svg-assessment.ts'
import { inspectFidelityPaint } from '../fidelity/paint.ts'
import { inspectQuantitativePaint } from '../fidelity/paint-values.ts'
import { inspectSourceFacts, mergePaintChecks } from '../fidelity/paint-facts.ts'
import { inspectChartFacts } from '../fidelity/paint-chart-facts.ts'
import type { AuthoredFidelityCase } from '../fidelity/meaning.ts'
import type { PreparedCommunityBrowser } from './community-browser.ts'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import { docsArtifactServer, initializeDocsPage, withDocsDeadline, closeDocsContext } from './docs-runtime.ts'
import { readDocsResources } from './docs-resources.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { qualifyOutput } from './qualification.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { tridentDirectory } from './trident-paths.ts'

export const browserSvgTimingBoundary = 'Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded'
const viewport = { width: 1400, height: 1000 }
export interface BrowserSvgTimingOptions {
  preparedFile: string
  baseline: string
  candidate: string
  out: string
  caseIds?: string[]
  rounds?: number
  samplesPerRound?: number
  maximumControlSpread?: number
  resourcesFile?: string
  executable?: string
  collectionBudgetMs?: number
}
export function browserSvgTimingCases(ids = ['meaning:family:flowchart']) {
  if (!ids.length || new Set(ids).size !== ids.length) throw Error('Browser timing needs unique nonempty authored case IDs')
  const all = expandedFidelityCases()
  return ids.map(id => {
    const input = all.find(item => item.id === id)
    if (!input || !sourceContractComplete(input)) throw Error('Browser timing needs an independently complete authored source contract: ' + id)
    if (input.prelude?.length || input.renderOptions && Object.keys(input.renderOptions).length) throw Error('First-use source timing excludes prelude and API-configuration workflows: ' + id)
    return input
  })
}
/** Font fallback is an actual rendering input. Missing font inventory blocks
 * this host profile instead of substituting a label such as "default fonts". */
const fontPaths = () => [...new Set(execFileSync('fc-list', ['-f', '%{file}\n'], { encoding: 'utf8', timeout: 10_000 }).split('\n').filter(Boolean))].sort()
const fontConfigPaths = () => [...new Set(execFileSync('fc-conflist', [], { encoding: 'utf8', timeout: 10_000 }).split('\n').flatMap(line => /^\+\s+([^:]+):/.exec(line)?.[1] ? [/^\+\s+([^:]+):/.exec(line)![1]!] : []))].sort()
const fileStamp = (path: string) => { const file = statSync(path, { bigint: true }); return { size: String(file.size), ino: String(file.ino), device: String(file.dev), modifiedNs: String(file.mtimeNs), changedNs: String(file.ctimeNs) } }
const frozenFontFile = (path: string) => { const before = fileStamp(path), sha256 = evidenceBytesDigest(readFileSync(path)), after = fileStamp(path); if (evidenceDigest(before) !== evidenceDigest(after)) throw Error('Font input changed during its snapshot'); return { path, sha256, stamp: after } }
export function browserTimingFonts() {
  const paths = fontPaths()
  if (!paths.length) throw Error('Browser timing needs an actual fontconfig font inventory')
  return paths.map(frozenFontFile)
}
const browserFontInputStamp = () => ({ fonts: fontPaths().map(path => ({ path, stamp: fileStamp(path) })), configuration: fontConfigPaths().map(path => ({ path, stamp: fileStamp(path) })) })
const artifactAssets = (admission: ReturnType<typeof admitPreparedFidelityEngine>) => [...admission.files, ...admission.manifests, ...(admission.addon ? [{ path: join(admission.addon.root, 'package.json'), sha256: admission.addon.manifestSha256 }] : [])]
const key = (coordinate: TimingCoordinate) => JSON.stringify([coordinate.round, coordinate.replica, coordinate.caseId, coordinate.sample])

/** Offline SVG observation of every timed return. A full source contract and
 * all its planned observations are required; source/model echoes give no pass. */
export async function observeBrowserTimingSvg(page: any, authored: AuthoredFidelityCase, contract: TimingPlan['cases'][number], bytes: Uint8Array, observerSha256: string, resourceGaps: readonly string[] = []): Promise<CheckedEvidence> {
  if (!sourceContractComplete(authored) || evidenceDigest(contract) !== evidenceDigest(makeSvgCaseContract(authored))) throw Error('Timed SVG observation does not own this complete source contract')
  const svg = Buffer.from(bytes).toString('utf8'), outputSha256 = evidenceBytesDigest(bytes)
  const admission = qualifyOutput({ id: authored.id, family: authored.family, source: authored.source, expectedLabels: authored.expected.labels, features: [], provenance: authored.provenance }, svg, 'svg')
  let observed: ReturnType<typeof mergePaintChecks> = [], observationError: string | undefined
  if (admission.ok) try {
    await page.setContent(svg, { waitUntil: 'domcontentloaded' })
    await page.evaluate(async () => { await document.fonts.ready })
    const paint = await page.evaluate(inspectFidelityPaint, { family: authored.family, expected: authored.expected, paint: authored.paint })
    const quantitative = await page.evaluate(inspectQuantitativePaint, { family: authored.family, source: authored.source, expected: authored.expected, nodes: paint.nodes })
    const facts = await page.evaluate(inspectSourceFacts, { family: authored.family, source: authored.source, expected: authored.expected, paint, quantitative })
    const charts = await page.evaluate(inspectChartFacts, { family: authored.family, source: authored.source, expected: authored.expected, paint, quantitative })
    observed = mergePaintChecks(paint.checks, quantitative, facts, charts)
    const unplanned = observed.filter(check => check.status !== 'passed' && !contract.requiredChecks.some(item => item.surface === 'browser-owned-ink' && item.criterion === check.criterion))
    if (unplanned.length) observationError = 'Unplanned observer findings: ' + unplanned.map(check => check.criterion).join(', ')
  } catch (error) { observationError = 'Full SVG observer did not complete: ' + String(error) }
  return admitCheckedEvidence(contract, { schema: 'trident-checked-evidence-v1', caseId: authored.id, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256, observerSha256, checks: contract.requiredChecks.map(item => {
    if (item.surface === 'browser-public-api') return { ...item, status: resourceGaps.length || observationError ? 'unknown' : item.criterion === 'public-svg-admission' ? 'passed' : item.criterion === 'standalone-svg-and-labels' ? admission.ok ? 'passed' : 'failed' : 'unknown', detail: resourceGaps.length ? resourceGaps.join('; ') : observationError ?? (admission.ok ? 'Actual retained timed SVG return and independent standalone admission' : admission.findings.join('; ')) }
    const check = observed.find(check => check.criterion === item.criterion)
    return { ...item, status: observationError ? 'unknown' : check?.status === 'passed' ? 'passed' : check?.status === 'failed' ? 'failed' : 'unknown', detail: observationError ?? check?.scope ?? 'No qualified observer for this complete source criterion' }
  }) })
}

/** Freezes versions, executable assets, host/fonts/resources, source plans and
 * observer before any public render call. It does not acquire or render peers. */
export function prepareBrowserSvgTiming(options: BrowserSvgTimingOptions) {
  const preparedBytes = readFileSync(options.preparedFile), prepared = JSON.parse(preparedBytes.toString()) as PreparedCommunityBrowser[]
  if (!Array.isArray(prepared) || new Set(prepared.map(peer => peer.node.id)).size !== prepared.length) throw Error('Browser timing preparation identities must be a unique array')
  const selected = new Map([options.baseline, options.candidate].map(project => {
    const peer = prepared.find(item => item.node.id === project)
    if (!peer || peer.browserStatus !== 'prepared' || !peer.browser) throw Error('Selected project has no frozen browser SVG artifact: ' + project)
    if (peer.node.benchmark?.skip?.version === peer.browser.version) throw Error('Selected artifact is skipped by its frozen benchmark configuration: ' + peer.node.benchmark.skip.reason)
    return [project, { peer, admission: admitPreparedFidelityEngine(peer) }] as const
  }))
  const assetBodies = new Map<string, { sha256: string; body: Buffer }>()
  for (const { admission } of selected.values()) for (const asset of artifactAssets(admission)) { const body = readFileSync(asset.path); if (evidenceBytesDigest(body) !== asset.sha256) throw Error('Sealed timing input changed during preparation'); assetBodies.set(asset.path, { sha256: asset.sha256, body }) }
  const cases = browserSvgTimingCases(options.caseIds), resources = readDocsResources(options.resourcesFile), executable = options.executable ?? defaultChromium(chromium)
  const executableProof = executableIdentity(executable)
  if (executableProof.status !== 'available') throw Error('Browser timing executable is unavailable')
  const fonts = browserTimingFonts(), fontConfiguration = fontConfigPaths().map(frozenFontFile), fontInputStamp = { fonts: fonts.map(({ path, stamp }) => ({ path, stamp })), configuration: fontConfiguration.map(({ path, stamp }) => ({ path, stamp })) }, producers = protocolIdentity(tridentDirectory, ['unified/timing-browser.ts'])
  const rendering = { viewport, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light' as const, serviceWorkers: 'block' as const }
  const environment = { host: environmentIdentity(process.execPath), browser: executableProof, driver: process.versions, fonts, fontConfiguration, fontconfig: Object.fromEntries(['FONTCONFIG_FILE', 'FONTCONFIG_PATH', 'LANG', 'LC_ALL'].map(name => [name, process.env[name] ?? null])), rendering, resourceManifestSha256: resources.manifestSha256, resources: resources.identity }
  const observerSha256 = evidenceDigest({ protocol: 'complete-source-svg-observer-v1', producers, environment }), environmentSha256 = evidenceDigest(environment)
  const artifact = (project: string) => { const { peer, admission } = selected.get(project)!; return { project, artifactSha256: admission.artifactSha256, bindingSha256: evidenceDigest({ protocol: 'shared-public-browser-svg-first-use-v1', engine: peer.browser, admission, producers, request: { type: 'render', id: 'trident_timed_svg', returnSvgString: true } }) } }
  const baseline = artifact(options.baseline)
  const plan = admitTimingPlan({ schema: 'trident-qualified-timing-plan-v1', boundary: browserSvgTimingBoundary, format: 'svg', track: 'first-use', environmentSha256, observerSha256, rounds: options.rounds ?? 6, samplesPerRound: options.samplesPerRound ?? 1, maximumControlSpread: options.maximumControlSpread ?? .25, cases: cases.map(makeSvgCaseContract), artifacts: { A0: baseline, A1: baseline, B: artifact(options.candidate) } })
  return { plan, cases, selected, resources, executable, fonts, fontConfiguration, fontInputStamp, rendering, assetBodies, provenance: { schema: 'trident-browser-svg-timing-inputs-v1', preparedSha256: evidenceBytesDigest(preparedBytes), environment, producers, retainedAssets: [...assetBodies].map(([path, asset]) => ({ path, sha256: asset.sha256, blob: 'browser-assets/' + asset.sha256 })), retainedFontConfiguration: fontConfiguration.map(file => ({ path: file.path, sha256: file.sha256, blob: 'browser-assets/' + file.sha256 })), retainedResources: resources.resources.map((resource: any) => ({ url: resource.url, sha256: resource.sha256, blob: 'browser-assets/' + resource.sha256 })), selected: [...selected].map(([project, { admission }]) => ({ project, admission })), sources: cases.map(input => ({ id: input.id, source: input.source, provenance: input.provenance, sourceReview: input.sourceReview })), scope: browserSvgTimingBoundary } }
}

export async function runBrowserSvgTiming(options: BrowserSvgTimingOptions) {
  assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
  if (existsSync(options.out)) throw Error('Browser timing needs a fresh output directory')
  const frozen = prepareBrowserSvgTiming(options)
  mkdirSync(options.out, { recursive: true })
  for (const asset of frozen.assetBodies.values()) writeDurableEvidence(join(options.out, 'browser-assets', asset.sha256), asset.body)
  for (const configuration of frozen.fontConfiguration) { const body = readFileSync(configuration.path); if (evidenceBytesDigest(body) !== configuration.sha256) throw Error('Frozen font configuration changed before retention'); writeDurableEvidence(join(options.out, 'browser-assets', configuration.sha256), body) }
  for (const resource of frozen.resources.resources) writeDurableEvidence(join(options.out, 'browser-assets', resource.sha256), resource.body)
  writeFileSync(join(options.out, 'browser-inputs.json'), JSON.stringify(frozen.provenance, null, 2) + '\n')
  let browser: Awaited<ReturnType<typeof launchOwnedTimingBrowser>> | undefined, launch: Promise<Awaited<ReturnType<typeof launchOwnedTimingBrowser>>> | undefined, disposing = false
  const servers = new Map<string, { server: ReturnType<typeof docsArtifactServer>; origin: string }>(), audits = new Map<string, string[]>()
  const getBrowser = () => launch ??= launchOwnedTimingBrowser({ headless: true, executablePath: frozen.executable, timeout: 20_000 }).then(async opened => { browser = opened; if (disposing) { await opened.close(); throw Error('Browser timing capture already closed') }; return opened })
  const runtime = async (project: string) => {
    const target = frozen.selected.get(project)!
    admitPreparedFidelityEngine(target.peer)
    if (!servers.has(project)) {
      const server = docsArtifactServer(target.peer.browser!.root, target.peer.browser!.zenuml)
      await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
      servers.set(project, { server, origin: 'http://127.0.0.1:' + (server.address() as { port: number }).port })
    }
    return { ...target, ...servers.get(project)! }
  }
  const route = async (request: Route, target: Awaited<ReturnType<typeof runtime>>, gaps: string[]) => {
    const url = new URL(request.request().url()), resource = frozen.resources.resources.find((item: any) => item.url === url.href)
    if (resource) return request.fulfill({ body: resource.body, contentType: resource.contentType })
    if (['data:', 'blob:'].includes(url.protocol)) return request.continue()
    if (url.origin === target.origin && ['/blank', '/observer'].includes(url.pathname)) return request.continue()
    const engine = target.peer.browser!, addon = url.pathname.startsWith('/__addon/'), root = addon ? engine.zenuml?.root : engine.root
    let decoded: string
    try { decoded = decodeURIComponent(url.pathname.slice(addon ? '/__addon'.length : 0)) } catch { gaps.push('Invalid browser resource URL: ' + url.href); return request.abort() }
    const file = root && resolve(root, '.' + decoded), asset = artifactAssets(target.admission).find(item => item.path === file)
    if (url.origin !== target.origin || !asset) { gaps.push('Unfrozen browser resource: ' + url.href); return request.abort() }
    const cached = frozen.assetBodies.get(asset.path), bytes = cached?.body
    if (!bytes || cached?.sha256 !== asset.sha256) { gaps.push('Frozen browser resource changed: ' + asset.path); return request.abort() }
    return request.fulfill({ body: bytes, contentType: ({ '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.json': 'application/json' } as Record<string, string>)[extname(asset.path)] ?? 'application/octet-stream' })
  }
  const driver: QualifiedTimingPublicDriver = { context: { boundary: frozen.plan.boundary, format: frozen.plan.format, track: frozen.plan.track, environmentSha256: frozen.plan.environmentSha256, artifacts: frozen.plan.artifacts }, open: async coordinate => {
    if (evidenceDigest(coordinate.artifact) !== evidenceDigest(frozen.plan.artifacts[coordinate.replica])) throw Error('Browser timing artifact differs from its frozen replica')
    if (coordinate.signal.aborted) throw Error('Browser timing factory was cancelled')
    const target = await runtime(coordinate.artifact.project), host = await getBrowser()
    if (coordinate.signal.aborted) throw Error('Browser timing factory was cancelled')
    const execution = await host.newExecution(frozen.rendering, coordinate.signal, coordinate.own), context = execution.handle, page = execution.page, gaps: string[] = []
    audits.set(key(coordinate), gaps)
    try {
      if (coordinate.signal.aborted) throw Error('Browser timing factory was cancelled')
      if (evidenceDigest(browserFontInputStamp()) !== evidenceDigest(frozen.fontInputStamp)) throw Error('Actual browser font inputs changed before a timed call')
      await context.route('**/*', request => route(request, target, gaps))
      context.on('page', () => gaps.push('Additional page created inside the first-use execution context'))
      await initializeDocsPage(page, target.peer.browser!, target.origin)
      await page.evaluate(async () => { await document.fonts.ready })
      if (gaps.length) throw Error(gaps.join('; '))
      return { artifact: frozen.plan.artifacts[coordinate.replica], execution, request: { type: 'render', id: 'trident_timed_svg', returnSvgString: true }, invokeInPage: publicSvgBrowserAction }
    } catch (error) { await context.close(); throw error }
  } }
  const observer: ObserveTimedOutput = async input => {
    if (input.signal.aborted) throw Error('Timed-output grading was cancelled')
    if (evidenceDigest(browserFontInputStamp()) !== evidenceDigest(frozen.fontInputStamp)) throw Error('Actual browser font inputs changed before timed-output grading')
    const authored = frozen.cases.find(item => item.id === input.contract.caseId)!
    if (!authored || input.invocation.identity.project !== frozen.plan.artifacts[input.coordinate.replica].project || input.invocation.output?.sha256 !== evidenceBytesDigest(input.bytes)) throw Error('SVG observer received another source/project/output')
    const target = await runtime(input.invocation.identity.project), context = await (await getBrowser()).browser.newContext(frozen.rendering), gaps = [...(audits.get(key(input.coordinate)) ?? [])]
    const abort = () => { void context.close().catch(() => {}) }
    input.signal.addEventListener('abort', abort, { once: true }); context.on('close', () => input.signal.removeEventListener('abort', abort))
    try {
      if (input.signal.aborted) throw Error('Timed-output grading was cancelled')
      await context.route('**/*', request => route(request, target, gaps))
      const page = await context.newPage(); await page.goto(target.origin + '/observer')
      const checked = await withDocsDeadline(() => observeBrowserTimingSvg(page, authored, input.contract, input.bytes, frozen.plan.observerSha256, gaps), () => { void context.close().catch(() => {}) })
      return checked
    } finally { await context.close() }
  }
  let result: Awaited<ReturnType<typeof collectQualifiedTiming>> | undefined
  const failures: unknown[] = []
  try {
    result = await collectQualifiedTiming(frozen.plan, frozen.cases.map(input => ({ caseId: input.id, source: input.source, provenance: input.provenance })), driver, observer, options.out, { collectionBudgetMs: options.collectionBudgetMs })
    for (const { peer } of frozen.selected.values()) admitPreparedFidelityEngine(peer)
    if (evidenceDigest(browserTimingFonts()) !== evidenceDigest(frozen.fonts) || evidenceDigest(fontConfigPaths().map(frozenFontFile)) !== evidenceDigest(frozen.fontConfiguration)) throw Error('Actual browser font inputs changed during collection')
  } catch (error) { failures.push(error) } finally {
    disposing = true
    try { writeFileSync(join(options.out, 'browser-resource-audits.json'), JSON.stringify({ schema: 'trident-timed-browser-resources-v1', coordinates: [...audits].map(([coordinate, gaps]) => ({ coordinate: JSON.parse(coordinate), gaps })) }, null, 2) + '\n') }
    catch (error) { failures.push(error) }
    finally {
      if (launch && !browser) void launch.then(opened => opened.close()).catch(() => {})
      const closed = await Promise.allSettled([...servers.values()].map(({ server }) => closeDocsContext({ close: async () => {} }, server, 5000)).concat(browser ? [withDocsDeadline(() => browser!.close(), () => {}, 5000)] : []))
      failures.push(...closed.filter((item): item is PromiseRejectedResult => item.status === 'rejected').map(item => item.reason))
    }
  }
  if (failures.length) throw new AggregateError(failures, 'Browser timing collection or bounded disposal failed')
  if (!result) throw Error('Browser timing collection returned no retained result')
  return result
}

export function parseBrowserSvgTimingOptions(argv: string[]): BrowserSvgTimingOptions {
  const values = new Map<string, string>(), allowed = ['--prepared', '--baseline', '--candidate', '--out', '--cases', '--rounds', '--samples', '--maximum-control-spread', '--resources', '--executable', '--budget-minutes']
  for (let i = 0; i < argv.length; i += 2) { const key = argv[i]!, value = argv[i + 1]; if (!allowed.includes(key) || !value || value.startsWith('--') || values.has(key)) throw Error('Use timing:browser --help'); values.set(key, value) }
  for (const required of ['--prepared', '--baseline', '--candidate', '--out']) if (!values.has(required)) throw Error('Missing ' + required)
  return { preparedFile: resolve(values.get('--prepared')!), baseline: values.get('--baseline')!, candidate: values.get('--candidate')!, out: resolve(values.get('--out')!), ...(values.has('--cases') ? { caseIds: values.get('--cases')!.split(',') } : {}), ...(values.has('--rounds') ? { rounds: Number(values.get('--rounds')) } : {}), ...(values.has('--samples') ? { samplesPerRound: Number(values.get('--samples')) } : {}), ...(values.has('--maximum-control-spread') ? { maximumControlSpread: Number(values.get('--maximum-control-spread')) } : {}), ...(values.has('--resources') ? { resourcesFile: resolve(values.get('--resources')!) } : {}), ...(values.has('--executable') ? { executable: resolve(values.get('--executable')!) } : {}), ...(values.has('--budget-minutes') ? { collectionBudgetMs: Number(values.get('--budget-minutes')) * 60_000 } : {}) }
}
if (import.meta.main) {
  if (process.argv.slice(2).join(' ') === '--help') console.log('timing:browser --prepared FILE --baseline PROJECT --candidate PROJECT --out FRESH_DIR [--cases ID,...] [--rounds 6] [--samples 1] [--resources FILE] [--executable CHROMIUM] [--budget-minutes 5]\nFirst-use public SVG calls in fresh browser contexts. Includes controller/page RPC; initialization and full output grading are outside the clock. Uses frozen versions, source contracts, fonts and assets. Missing correctness or A/A evidence withholds speed. Requires Chromium, fontconfig (fc-list/fc-conflist) and existing sealed browser preparation. No Codex required.')
  else { const result = await runBrowserSvgTiming(parseBrowserSvgTimingOptions(process.argv.slice(2))); console.log(JSON.stringify({ bundleFile: result.bundleFile, qualification: result.qualification })); if (result.qualification.status !== 'qualified') process.exitCode = 2 }
}
