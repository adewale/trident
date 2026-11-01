import { assessDocsInvalidSource, docsPublicRejection } from './docs-invalid-source.ts'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { completeCriterionLedger, planFidelityCriteria } from '../fidelity/ledger.ts'
import type { AuthoredFidelityCase } from '../fidelity/meaning.ts'
import type { BenchmarkObservation } from './types.ts'
import type { PaintCheck } from '../fidelity/paint.ts'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { retainedLegacyNativePngContext, requireLegacyNativePngOwnership } from './docs-png-legacy.ts'
import { evidenceDigest } from '../portable/evidence-contract.ts'
import { assessSvgCases, summarizeSvgCases, makeSvgObservationBinding, type SvgEvidenceBinding } from '../fidelity/svg-assessment.ts'
import { admitDocsReviews, assessDocsDrawing, reviewedDocsCase, type DocsDrawingReview } from './docs-drawings.ts'
import { admitPngReviews, assessDocsPng, type DocsPngReview } from './docs-png-drawings.ts'
import { qualifyOutput } from './qualification.ts'
import { readDocsPngRasterProfile, readRetainedPngSvg, readRetainedPng, bindDocsPngConversionReturn, requireRetainedPngOwnership, retainPngReference, qualifyRetainedDocsPngConversion } from './docs-png-qualification.ts'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { withDocsDeadline } from './docs-benchmark.ts'
import { tridentDirectory } from './trident-paths.ts'
import { authoredSvgAdapterBinding, classifyAuthoredSvgResult, readRetainedAuthoredSvgWorkflow } from '../fidelity/community-raw.ts'
import { reviewedFontSizePath } from '../portable/configuration.ts'
import { assessPrelude } from '../fidelity/meaning.ts'
import type { PreparedCommunityBrowser } from './community-browser.ts'
import { readCampaign } from './campaign-publication.ts'
import { planRetainedSvgRegrade, readRetainedPreparationInput, retainedObserverAssets, retainedImagePrerequisites, retainedSvgResourcePolicy, routeRetainedObserver, requireRetainedDocsSvgReturn, retainedDocsSvgOwnershipContext } from './recheck-inputs.ts'

const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const read = (file: string): any => readBenchmarkDocument(file)
const write = (file: string, value: unknown) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(value) + '\n') }
const safe = (root: string, path: string, campaign = root) => {
  const file = resolve(root, path), suffix = relative(resolve(root), file)
  if (isAbsolute(suffix) || suffix === '..' || suffix.startsWith('../')) throw Error('Retained witness escapes its campaign')
  // Missing witnesses retain their unknown outcome. Validate their nearest
  // existing ancestor so symlinked directories cannot borrow another archive.
  let present = file
  while (!existsSync(present)) { const parent = dirname(present); if (parent === present) throw Error('Retained witness has no owning directory'); present = parent }
  const actual = relative(realpathSync(campaign), realpathSync(present))
  if (isAbsolute(actual) || actual === '..' || actual.startsWith('../')) throw Error('Retained witness symlink escapes its campaign')
  return file
}

/** Resolve only into the new evidence copy, including provenance roots retained
 * by an earlier recheck. Never read the machine named in an archived path. */
export function retainedPath(directory: string, out: string, aliases: string[], path: string) {
  const absolute = resolve(directory, path)
  for (const root of [directory, ...aliases]) {
    const suffix = relative(root, absolute)
    if (!suffix.startsWith('..') && !suffix.startsWith('/')) return safe(out, suffix)
  }
  throw Error('Retained witness is outside its recorded campaign roots')
}

/** Historical evidence is retained as history, with every old binding removed
 * from the new grade. Only freshly inspected rows may acquire the new binding. */
export function invalidateRetainedSvgChecks(observations: readonly BenchmarkObservation[], checkedAt: string): BenchmarkObservation[] {
  return observations.map(row => {
    if (row.surface === 'native-public-api') return row
    const metrics: NonNullable<BenchmarkObservation['metrics']> = { ...row.metrics, originalCriterionStatus: row.metrics?.originalCriterionStatus ?? row.status, originalEvidenceBinding: row.metrics?.originalEvidenceBinding ?? JSON.stringify({ sourceSha256: row.metrics?.sourceSha256, expectationsSha256: row.metrics?.expectationsSha256, svgSha256: row.metrics?.svgSha256, observerSha256: row.metrics?.observerSha256 }), recheckedAt: checkedAt, recheckObservation: 'missing-witness' }
    delete metrics.sourceSha256; delete metrics.expectationsSha256; delete metrics.svgSha256; delete metrics.observerSha256
    return { ...row, status: 'blocked', detail: 'No freshly validated retained evidence is available; original status is preserved separately', metrics }
  })
}

/** The original source inventory and actual public receipt own this output.
 * Legacy receipts predate per-call source hashes; they remain explicitly bound
 * to the SHA-sealed original inventory, rather than the new grading contract. */
export function bindRetainedAuthoredSvgReturn(original: AuthoredFidelityCase, entry: any, project: string, observations: readonly BenchmarkObservation[], svg: string) {
  if (entry.caseId !== original.id || entry.family !== original.family || entry.publicResult?.kind !== 'returned' || entry.svgEvidence?.sha256 !== hash(svg) || entry.svgEvidence?.bytes !== Buffer.byteLength(svg) || entry.svgEvidence?.encoding !== 'gzip') throw Error('Retained SVG does not match its original public receipt/source coordinate')
  const rows = observations.filter(row => row.metrics?.implementation === project && row.metrics?.authoredCase === original.id && row.surface !== 'native-public-api')
  const admission = rows.filter(row => row.operation === 'public-svg-admission')
  if (admission.length !== 1 || admission[0]!.status !== 'passed' || rows.some(row => row.family !== original.family || row.metrics?.sourceSha256 !== undefined && row.metrics.sourceSha256 !== hash(original.source) || row.metrics?.svgSha256 !== undefined && row.metrics.svgSha256 !== hash(svg))) throw Error('Original public SVG observation contradicts its source/project/output receipt')
  return { schema: 'trident-retained-authored-svg-return-v1' as const, project, caseId: original.id, sourceSha256: hash(original.source), svgSha256: hash(svg), originalReceiptRowSha256: evidenceDigest(entry), scope: 'Original preparation source inventory, project-owned actual public return receipt and exact retained SVG bytes; no new invocation or prelude proof' }
}

/** Fresh paint evidence replaces every required paint observation. A missing
 * checker result or observer exception can never borrow an earlier pass. */
export async function recheckFeaturePaint(input: AuthoredFidelityCase, project: string, observations: readonly BenchmarkObservation[], inspect: () => Promise<PaintCheck[]>, checkedAt: string, fontOptions: boolean, binding: SvgEvidenceBinding) {
  if (!binding) throw Error('Fresh paint evidence requires its actual source/expectation/output/observer binding')
  const expectedBinding = makeSvgObservationBinding(input, binding.svgSha256, binding.observerSha256)
  if (binding.sourceSha256 !== expectedBinding.sourceSha256 || binding.expectationsSha256 !== expectedBinding.expectationsSha256) throw Error('Fresh paint evidence binding is stale for this source/expectation')
  const owns = (row: BenchmarkObservation) => row.metrics?.implementation === project && row.metrics?.authoredCase === input.id && row.surface === 'browser-owned-ink'
  const own = observations.filter(owns)
  let checks: PaintCheck[] = [], error: string | undefined
  try {
    checks = await inspect()
    if (!Array.isArray(checks) || checks.some(check => !check || typeof check.criterion !== 'string' || !['passed', 'failed', 'unavailable'].includes(check.status)) || new Set(checks.map(check => check.criterion)).size !== checks.length) throw Error('Observer returned duplicate or invalid paint checks')
  } catch (failure) { error = String(failure); checks = [] }
  const planned = planFidelityCriteria([input]).filter(item => item.surface === 'browser-owned-ink')
  const fresh = planned.map(item => {
    const previous = own.find(row => row.operation === item.criterion), check = checks.find(check => check.criterion === item.criterion)
    const unmappedFont = item.criterion === 'computed-authored-font-size' && !fontOptions
    const status: BenchmarkObservation['status'] = error || !check || unmappedFont ? 'blocked' : check.status === 'unavailable' ? 'blocked' : check.status
    return { ...(previous ?? { suite: 'fidelity', surface: item.surface, runtime: 'retained SVG observer', family: input.family, caseId: input.id + ':' + item.criterion, operation: item.criterion, format: 'svg', mode: 'independent-authored-criteria' }), status,
      detail: error ? 'Retained SVG observer failed: ' + error : unmappedFont ? 'No reviewed public font option mapping; old checks supply no new credit' : !check ? 'Observer omitted a required paint criterion; old checks supply no new credit' : check.scope,
      metrics: { ...previous?.metrics, implementation: project, authoredCase: input.id, originalCriterionStatus: previous?.metrics?.originalCriterionStatus ?? previous?.status ?? null, recheckedAt: checkedAt, recheckObservation: error ? 'observer-error' : unmappedFont || !check ? 'missing' : 'observed', ...(error ? { observerError: error } : {}), ...(binding ?? {}) } } as BenchmarkObservation
  })
  // Historical diagnostics live in the preserved collected/history files.
  // Only the current observer's diagnostics belong in the active grade; its
  // unplanned adverse findings must survive so the verdict cannot hide them.
  for (const check of checks.filter(check => !planned.some(item => item.criterion === check.criterion))) fresh.push({ suite: 'fidelity', surface: 'browser-owned-ink', runtime: 'retained SVG observer', family: input.family, caseId: input.id + ':' + check.criterion, operation: check.criterion, format: 'svg', mode: 'independent-authored-criteria', status: check.status === 'unavailable' ? 'blocked' : check.status, detail: check.scope, metrics: { implementation: project, authoredCase: input.id, recheckedAt: checkedAt, recheckObservation: 'observed-unplanned', ...binding } })
  return { completed: !error, ...(error ? { error } : {}), observations: observations.filter(row => !owns(row)).concat(fresh) }
}

export interface RetainedAuthoredWorkflowContext {
  witness: Parameters<typeof readRetainedAuthoredSvgWorkflow>[2]
  expected: Parameters<typeof readRetainedAuthoredSvgWorkflow>[3]
  remap: (path: string) => string
}

/** Reconstruct only the original sealed public adapter, without reopening its
 * old executable path or trusting an engine declared by the return witness. */
export function retainedAuthoredSvgWorkflowOwner(peer: PreparedCommunityBrowser | undefined): RetainedAuthoredWorkflowContext['expected'] | undefined {
  let engine: unknown, artifactSha256: string | undefined, cli = false
  const artifact = peer?.artifact
  if (artifact?.kind === 'cli' && peer?.node.benchmark?.outputs?.includes('svg')) {
    const entry = artifact.executable, file = artifact.files?.filter(file => file.path === entry)
    const sha256 = artifact.sha256 ?? (file?.length === 1 ? file[0]!.sha256 : undefined)
    if (!entry || !isAbsolute(entry) || !artifact.version || !sha256 || !/^[a-f0-9]{64}$/.test(sha256) || file && (file.length > 1 || file.length === 1 && file[0]!.sha256 !== sha256)) return undefined
    const root = artifact.root ?? dirname(entry)
    if (!isAbsolute(root)) return undefined
    engine = { kind: 'cli', root, entry, version: artifact.version, artifactSha256: sha256 }; artifactSha256 = sha256; cli = true
  } else if (peer?.browserStatus === 'prepared' && peer.browser && (peer.browser.output ?? 'svg') === 'svg') { engine = peer.browser; artifactSha256 = peer.browser.artifactSha256 }
  if (!engine || !artifactSha256 || !/^[a-f0-9]{64}$/.test(artifactSha256)) return undefined
  return { artifactSha256, adapterBindingSha256: authoredSvgAdapterBinding(engine, reviewedFontSizePath(peer!.node.benchmark?.adapter ?? '', peer!.node.benchmark?.api?.svg), cli ? artifact : undefined) }
}

/** Fresh admission may use exact ordered raw public returns from one owned
 * workflow. Legacy kind/status rows cannot supply missing prelude evidence. */
export function recheckFeatureAdmission(input: AuthoredFidelityCase, project: string, observations: readonly BenchmarkObservation[], svg: string, publicKind: unknown, binding: SvgEvidenceBinding, checkedAt: string, retained?: RetainedAuthoredWorkflowContext): BenchmarkObservation[] {
  const qualification = qualifyOutput({ id: input.id, family: input.family, source: input.source, expectedLabels: input.expected.labels, features: [], provenance: 'Original authored inventory and retained public-return receipt' }, svg, 'svg')
  let workflow: ReturnType<typeof readRetainedAuthoredSvgWorkflow> | undefined, workflowError: string | undefined
  if (retained) try {
    workflow = readRetainedAuthoredSvgWorkflow(input, project, retained.witness, retained.expected, retained.remap)
    const main = workflow.steps.find(step => step.step === 'main')
    if (!main || main.result.kind !== 'returned' || main.result.svg !== svg || hash(svg) !== binding.svgSha256) throw Error('Owned workflow main return differs from the actual regraded SVG bytes')
  } catch (error) { workflow = undefined; workflowError = String(error) }
  return observations.map<BenchmarkObservation>(row => {
    if (row.metrics?.implementation !== project || row.metrics?.authoredCase !== input.id || row.surface !== 'browser-public-api') return row
    const preludeIndex = /^prelude-(\d+)$/.exec(row.operation)
    if (preludeIndex) {
      const index = Number(preludeIndex[1]), prelude = input.prelude?.[index], step = workflow?.steps.find(step => step.step === row.operation)
      const metrics: NonNullable<BenchmarkObservation['metrics']> = { ...row.metrics, originalCriterionStatus: row.metrics?.originalCriterionStatus ?? row.status, recheckedAt: checkedAt, recheckObservation: 'missing-prelude-witness' }
      delete metrics.sourceSha256; delete metrics.expectationsSha256; delete metrics.svgSha256; delete metrics.observerSha256
      if (!prelude || !step || !workflow?.sameRuntime) return { ...row, status: 'blocked', detail: workflowError ?? (workflow && !workflow.sameRuntime ? 'Actual prelude/main requests used distinct runtime contexts; the main return is retained independently, while stateful prelude credit remains unavailable' : 'No complete source/options/artifact-bound raw workflow proves this prelude; historical kind/status supplies no passing or rejection credit'), metrics }
      const classification = classifyAuthoredSvgResult(step.result), publicError = step.invocation.state === 'public-error' && !step.result.hostTransportError, admission = step.result.kind === 'returned' && step.invocation.state === 'returned' ? 'accepted' : publicError && classification === 'unsupported' ? 'unsupported' : publicError && step.result.kind === 'exception' && classification === 'failed' ? 'rejected' : 'unavailable'
      let status: ReturnType<typeof assessPrelude> | 'blocked' = assessPrelude(prelude.accept, admission), standalone: ReturnType<typeof qualifyOutput> | undefined
      if (step.result.kind === 'invalid-return' && publicError && prelude.accept) status = 'failed'
      if (step.result.kind === 'returned') {
        standalone = qualifyOutput({ id: input.id + ':' + row.operation, family: input.family, source: prelude.source, expectedLabels: [], features: [], provenance: 'Exact retained public prelude bytes; no diagram paint or native model claim' }, step.result.svg, 'svg')
        if (standalone.unavailable) status = 'blocked'; else if (!standalone.ok) status = 'failed'
      }
      return { ...row, status: status === 'unavailable' ? 'blocked' : status, detail: JSON.stringify({ kind: step.result.kind, error: step.result.error ?? null, standalone: standalone ?? null, scope: 'Exact ordered public prelude outcome in the same completed runtime workflow; generic host/runtime errors earn no source-rejection credit' }), metrics: { ...metrics, ...binding, recheckObservation: 'retained-raw-prelude-revalidated', workflowId: workflow!.workflowId, runtimeInstanceId: workflow!.runtimeInstanceId, preludeInvocationId: step.invocation.attemptId, preludeSourceSha256: step.invocation.identity.sourceSha256, preludeOutputSha256: step.invocation.output?.sha256 ?? null } }
    }
    if (!['public-svg-admission', 'standalone-svg-and-labels'].includes(row.operation)) return row
    const receiptReturned = publicKind === 'returned' && (!retained || !!workflow), status: BenchmarkObservation['status'] = !receiptReturned ? 'blocked' : row.operation === 'public-svg-admission' ? 'passed' : qualification.unavailable ? 'blocked' : qualification.ok ? 'passed' : 'failed'
    return { ...row, status, detail: !receiptReturned ? workflowError ?? 'Retained receipt does not prove an actual public SVG return' : row.operation === 'public-svg-admission' ? 'Actual public returned SVG bytes and original authored source inventory revalidated; no new renderer call' : qualification.scope + ': ' + qualification.findings.join('; '), metrics: { ...row.metrics, ...binding, originalCriterionStatus: row.metrics?.originalCriterionStatus ?? row.status, recheckedAt: checkedAt, recheckObservation: receiptReturned ? 'retained-public-receipt-revalidated' : 'missing-public-return-receipt' } }
  })
}

/** Reassess retained bytes only. No artifact acquisition, public render call or
 * reference parser call occurs here; every original result remains alongside it. */
export async function recheckRendering(directory: string, out: string, pngReviewFile?: string, executable?: string, pngRasterProfileFile?: string, formats: ('svg' | 'png')[] = ['svg', 'png']) {
  if (!formats.length || new Set(formats).size !== formats.length || formats.some(format => !['svg', 'png'].includes(format))) throw Error('Recheck formats must be svg and/or png')
  directory = resolve(directory); out = resolve(out)
  if (existsSync(out) || !relative(directory, out).startsWith('..')) throw Error('Choose a fresh output outside the input campaign')
  const recorded = read(join(directory, 'report.json'))
  const recordedRoot = resolve(recorded.options?.out ?? directory)
  const previous = join(directory, 'report.collected.json')
  const aliases = [recordedRoot, ...(recorded.recheck?.recordedSourceRoots ?? []), ...(existsSync(previous) && read(previous).options?.out ? [resolve(read(previous).options.out)] : [])]
  const report = readCampaign(directory), began = new Date().toISOString()
  const inventory = readRetainedPreparationInput(directory, 'inventories'), authored = expandedFidelityCases()
  const sourceInventory = JSON.parse(inventory.bytes.toString())
  const grading = { ...planRetainedSvgRegrade(sourceInventory.fidelity, authored), originalInventorySha256: inventory.sha256 }
  const gradingSha256 = evidenceDigest(grading)
  const docsInventory = read(join(directory, 'docs/inventory.json'))
  const sourceReviewBytes = readFileSync(join(tridentDirectory, 'corpus/docs-reviewed.json')), sourceReviews = JSON.parse(sourceReviewBytes.toString()) as DocsDrawingReview[]
  const drawingInventory = admitDocsReviews(docsInventory.cases, sourceReviews)
  const pngBytes = pngReviewFile ? readFileSync(pngReviewFile) : Buffer.from('[]')
  const pngReviews = admitPngReviews(docsInventory.cases, sourceReviews, JSON.parse(pngBytes.toString()) as DocsPngReview[])
  const raster = pngRasterProfileFile ? readDocsPngRasterProfile(pngRasterProfileFile) : undefined
  const producer = { formats, source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tridentDirectory, encoding: 'utf8' }).trim(), producers: protocolIdentity(tridentDirectory, ['unified/recheck-rendering.ts']), browser: executableIdentity(executable ?? defaultChromium(chromium)), rendererInvocations: 0, environment: Object.fromEntries(['LANG', 'LC_ALL', 'LD_LIBRARY_PATH', 'FONTCONFIG_FILE', 'FONTCONFIG_PATH'].map(name => [name, process.env[name] ?? null])), fontReadiness: 'Await document.fonts.ready; only frozen campaign font assets can load', ...(raster ? { pngRasterProfileSha256: raster.fileSha256, pngRasterProfile: raster.profile, referenceRasterizerMode: 'Offline resvg preservation only; no project API calls' } : {}), startedAt: began }
  const assets = retainedObserverAssets(directory)
  const observerSha256 = evidenceDigest({ producers: producer.producers, browser: producer.browser, environment: producer.environment, fontReadiness: producer.fontReadiness, resourceManifestSha256: assets.manifestSha256, resourcePolicy: assets.policy })
  cpSync(directory, out, { recursive: true, dereference: false, filter: path => path !== join(directory, 'recheck-receipt.json') && !['node_modules', '.git'].includes(path.split('/').at(-1)!) })
  const priorReceipt = join(directory, 'recheck-receipt.json')
  if (existsSync(priorReceipt)) {
    const retainedReceipt = join(out, 'recheck-history/receipts', hash(readFileSync(priorReceipt)) + '.json')
    mkdirSync(dirname(retainedReceipt), { recursive: true }); cpSync(priorReceipt, retainedReceipt)
  }
  const remap = (path: string) => retainedPath(directory, out, aliases, path)
  const gradingFile = 'recheck-history/gradings/' + gradingSha256 + '.json'
  if (existsSync(join(directory, 'recheck-grading.json'))) {
    const oldGrading = read(join(directory, 'recheck-grading.json'))
    write(join(out, 'recheck-history/gradings', evidenceDigest(oldGrading) + '.json'), oldGrading)
  }
  write(join(out, gradingFile), grading)
  write(join(out, 'recheck-grading.json'), grading)
  // The source archive may itself be a prior regrade. Keep its current views
  // and the first collected views, rather than overwriting the latter.
  mkdirSync(join(out, 'recheck-history/reports'), { recursive: true })
  cpSync(join(directory, 'report.json'), join(out, 'recheck-history/reports', hash(readFileSync(join(directory, 'report.json'))) + '.json'))
  const prepared = JSON.parse(readRetainedPreparationInput(directory, 'browsers').bytes.toString()) as any[]
  const browser = await chromium.launch({ headless: true, executablePath: executable ?? defaultChromium(chromium) })
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, serviceWorkers: 'block' })
  const copiedAssets = retainedObserverAssets(out)
  let peer: any, page = await context.newPage(), resourceGaps: string[] = [], resourcePolicy = copiedAssets.policy
  await context.route('**/*', route => routeRetainedObserver(route, copiedAssets, peer, resourceGaps, resourcePolicy))
  context.on('requestfailed', request => { if (request.resourceType() !== 'stylesheet') resourceGaps.push('Browser resource prerequisite did not load: ' + request.url()) })
  const inspect = async (project: string, svg: string, input: any): Promise<PaintCheck[]> => {
    peer = prepared.find(item => item.node.id === project)
    const resources = retainedSvgResourcePolicy(svg, copiedAssets, peer)
    resourcePolicy = resources.policy
    resourceGaps = retainedImagePrerequisites(input, copiedAssets).concat(resources.gaps)
    if (resourceGaps.length) throw Error('Observer prerequisites unavailable: ' + resourceGaps.join('; '))
    if (page.isClosed()) page = await context.newPage()
    await page.goto('http://trident.invalid/observer')
    await page.setContent(svg, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await withDocsDeadline(() => page.evaluate(async () => { await document.fonts.ready }), () => { void page.close().catch(() => {}) })
    const paint = await withDocsDeadline(() => inspectSvgDrawing(page, { family: input.family, expected: input.expected, source: input.source, paint: input.paint }), () => { void page.close().catch(() => {}) })
    if (resourceGaps.length) throw Error('Observer prerequisites unavailable: ' + resourceGaps.join('; '))
    return paint.checks
  }
  let docsChecked = 0, featureChecked = 0, docsSvgOwnership: ReturnType<typeof retainedDocsSvgOwnershipContext> | undefined
  let legacyPngOwnership: ReturnType<typeof retainedLegacyNativePngContext> | undefined
  const ownPng = (row: any, input: any, bytes: Uint8Array) => {
    const pngRoot = join(out, 'docs/png')
    if (row.metrics.project === 'pub:mermaid_flutter' && typeof row.metrics.rawInvocationId !== 'string') {
      legacyPngOwnership ??= retainedLegacyNativePngContext(out, pngRoot, remap)
      return requireLegacyNativePngOwnership({ context: legacyPngOwnership, project: row.metrics.project, round: Number(row.metrics.round), source: input, actualPng: bytes })
    }
    const transportFile = join(pngRoot, 'transport-' + encodeURIComponent(row.metrics.project) + '-r' + Number(row.metrics.round) + '.json'), transport = existsSync(transportFile) ? read(transportFile) : []
    if (!Array.isArray(transport)) throw Error('PNG transport receipt is malformed')
    const own = transport.filter((entry: any) => entry.caseId === input.id && entry.metrics?.rawInvocationId === row.metrics.rawInvocationId)
    if (own.length > 1) throw Error('PNG transport invocation ownership is ambiguous')
    const directory = own[0]?.metrics?.rawInvocationDirectory, journalDirectory = typeof directory === 'string' ? remap(directory) : undefined
    return requireRetainedPngOwnership({ root: pngRoot, project: row.metrics.project, round: Number(row.metrics.round), source: input, actualPng: bytes, attemptId: typeof row.metrics.rawInvocationId === 'string' ? row.metrics.rawInvocationId : undefined, journalDirectory })
  }
  try {
    for (const boundary of report.results) {
      if (!boundary.out) continue
      const source = join(boundary.out, 'result.json')
      if (!existsSync(source)) continue
      const destination = remap(source), result = structuredClone(read(source)), originalSha256 = hash(readFileSync(source))
      if (!existsSync(join(dirname(destination), 'result.collected.json'))) cpSync(source, join(dirname(destination), 'result.collected.json'))
      mkdirSync(join(out, 'recheck-history/results'), { recursive: true })
      cpSync(source, join(out, 'recheck-history/results', originalSha256 + '.json'), { recursive: false })
      if (boundary.suite === 'docs') {
        const controls: BenchmarkObservation[] = []
        result.observations = result.observations.filter((row: any) => row.operation !== 'source-rejection' || !formats.includes(row.format))
        for (const row of result.observations) {
          if (row.operation !== 'drawing-checks' || !formats.includes(row.format)) continue
          const input = docsInventory.cases.find((item: any) => item.id === row.caseId), expected = sourceReviews.find(item => item.id === row.caseId) ?? null
          if (!input) throw Error('Retained drawing observation has no declared documentation input')
          const witness = row.metrics?.witness ? safe(join(out, 'docs'), row.metrics.witness, out) : undefined
          let assessment: any, ownedInvalidReturn = false
          if (row.format === 'png') {
            const bytes = witness && existsSync(witness) ? readRetainedPng(join(out, 'docs'), row.metrics.witness) : undefined
            assessment = assessDocsPng(input, expected, bytes, pngReviews)
            if ((['correct', 'incorrect'].includes(assessment.status) || expected?.intent === 'invalid-source') && bytes) {
              try { assessment = { ...assessment, publicReturn: ownPng(row, input, bytes) }; ownedInvalidReturn = expected?.intent === 'invalid-source' }
              catch (error) { assessment = { status: 'unknown', reason: 'Reviewed image lacks its owning raw PNG return: ' + String(error) } }
            }
            if (assessment.status === 'unknown' && raster && expected?.intent === 'drawing' && bytes && row.metrics?.transport === 'svg-conversion') {
              try {
                const root = join(out, 'docs'), originalSvg = readRetainedPngSvg(root, row.metrics.originalSvgWitness), rasterizedSvg = readRetainedPngSvg(root, row.metrics.rasterizedSvgWitness)
                const render = result.observations.find((item: any) => item.operation === 'render' && item.format === 'png' && item.caseId === row.caseId && item.metrics?.project === row.metrics.project && item.metrics?.round === row.metrics.round && item.metrics?.variant === row.metrics.variant)
                const returnEvidence = render?.status === 'passed' ? bindDocsPngConversionReturn({ root: join(root, 'png'), project: row.metrics.project, round: Number(row.metrics.round), variant: row.metrics.variant, source: input, actualPng: bytes, originalSvg, rasterizedSvg, attemptId: row.metrics.rawInvocationId }) : undefined
                const qualification = await qualifyRetainedDocsPngConversion({ source: input, review: expected, actualPng: bytes, originalSvg, rasterizedSvg, returnEvidence, profile: raster.profile, pngReviews, observerSha256, inspectSvg: (svg, authored) => inspect(row.metrics.project, svg, authored) })
                const { referencePng, ...verdict } = qualification as typeof qualification & { referencePng?: Uint8Array }
                if (referencePng) {
                  row.metrics.referencePngWitness = 'png/' + retainPngReference(join(root, 'png'), referencePng)
                }
                assessment = { ...verdict, originalContentAssessment: assessment }
              } catch (error) { assessment = { status: 'unknown', reason: 'Retained conversion proof did not complete: ' + String(error), originalContentAssessment: assessment } }
            }
          }
          else if (['drawing', 'invalid-source'].includes(expected?.intent ?? '') && witness && existsSync(witness)) {
            const svg = gunzipSync(readFileSync(witness)).toString('utf8')
            if (witness.split('/').at(-1) !== hash(svg) + '.svg.gz') throw Error('Retained SVG content hash differs')
            try {
              docsSvgOwnership ??= retainedDocsSvgOwnershipContext(out)
              const publicReturn = requireRetainedDocsSvgReturn({ root: join(out, 'docs'), project: row.metrics.project, source: input, round: Number(row.metrics.round), variant: row.metrics.variant ?? 'primary', svg, attemptId: row.metrics.rawInvocationId, remap, ownership: docsSvgOwnership })
              if (expected?.intent === 'invalid-source') { ownedInvalidReturn = true; assessment = { ...assessDocsDrawing(input, expected, 'passed', false, []), publicReturn } }
              else {
                const authored = reviewedDocsCase(input, expected!), admission = qualifyOutput({ id: input.id, family: authored.family, source: input.source, expectedLabels: authored.expected.labels, features: [], provenance: expected!.review }, svg, 'svg')
                assessment = { ...assessDocsDrawing(input, expected, 'passed', admission.unavailable ? 'unavailable' : admission.ok, await inspect(row.metrics.project, svg, authored), makeSvgObservationBinding(authored, hash(svg), observerSha256)), publicReturn }; docsChecked++
              }
            }
            catch (error) { assessment = { status: 'unknown', reason: 'Retained SVG observer did not complete: ' + String(error) } }
          } else assessment = assessDocsDrawing(input, expected, 'blocked', false, [])
          row.metrics = { ...row.metrics, originalDrawingStatus: row.status, recheckedAt: began }
          row.status = assessment.status === 'correct' ? 'passed' : assessment.status === 'incorrect' ? 'failed' : assessment.status === 'not-applicable' ? 'not-applicable' : 'blocked'
          row.detail = JSON.stringify(assessment)
          if (expected?.intent === 'invalid-source') {
            const rejection = docsPublicRejection(input, ownedInvalidReturn), control = assessDocsInvalidSource(input, expected, rejection)
            controls.push({ suite: 'docs', surface: 'public:source-control', runtime: 'retained owning return', family: input.family, caseId: input.id, operation: 'source-rejection', format: row.format, mode: 'reviewed-first-round-control', status: control.status === 'correct' ? 'passed' : control.status === 'incorrect' ? 'failed' : 'blocked', detail: JSON.stringify(control), metrics: { ...row.metrics, sourceSha256: rejection.sourceSha256, rejectionEvidence: JSON.stringify(rejection) } })
          }
        }
        result.observations.push(...controls)
        // Fresh grades cannot keep the old source/observer comparison identity.
        // The owning preparation/context remains untouched for raw-call replay.
        const freshReview = { protocol: 'reviewed-docs-svg-content-v1', sha256: hash(sourceReviewBytes), cases: drawingInventory, observerSha256 }
        for (const format of ['svg', 'png'] as const) if (!formats.includes(format) && result.observations.some((row: any) => row.format === format)) {
          const previous = docsInventory.drawingReviewByFormat?.[format] ?? docsInventory.drawingReview
          if (previous?.sha256 !== freshReview.sha256) throw Error('Unselected format has different or missing source-review identity; recheck both formats')
        }
        const updatedInventory = { ...docsInventory,
          ...(formats.length === 2 ? { drawingReview: freshReview, drawingObserver: producer } : {}),
          drawingReviewByFormat: { ...docsInventory.drawingReviewByFormat, ...Object.fromEntries(formats.map(format => [format, freshReview])) },
          drawingObserverByFormat: { ...docsInventory.drawingObserverByFormat, ...Object.fromEntries(formats.map(format => [format, producer])) },
          ...(formats.includes('png') ? { pngReviewSha256: hash(pngBytes) } : {}) }
        write(join(out, 'docs/inventory.json'), updatedInventory)
      } else if (boundary.suite === 'fidelity' && formats.includes('svg')) {
        const selected = authored.filter(item => result.selectedCaseIds.includes(item.id))
        const original = result.observations as BenchmarkObservation[]
        // Invalidate old paint evidence before loading any witnesses. Missing
        // receipts/witnesses therefore remain unknown instead of surviving as passes.
        result.observations = invalidateRetainedSvgChecks(original, began)
        const witnessed = new Set<string>(), bindings: Record<string, Record<string, SvgEvidenceBinding>> = {}, publicReturns: unknown[] = []
        for (const receiptPath of result.artifacts ?? []) {
          if (!receiptPath.endsWith('community-fidelity-cases.json')) continue
          const receipt = read(remap(receiptPath))
          for (const entry of receipt.rows ?? []) {
            if (!entry.svgEvidence) continue
            const input = authored.find(item => item.id === entry.caseId)
            if (!input) throw Error('Retained SVG has no original authored contract')
            const originalInput = sourceInventory.fidelity.find((item: AuthoredFidelityCase) => item.id === entry.caseId)
            const svg = gunzipSync(readFileSync(remap(entry.svgEvidence.path))).toString('utf8')
            if (hash(svg) !== entry.svgEvidence.sha256) throw Error('Retained SVG content hash differs')
            const coordinate = JSON.stringify([receipt.project, input.id])
            if (witnessed.has(coordinate)) throw Error('Duplicate retained SVG witness coordinate')
            witnessed.add(coordinate)
            if (entry.family !== undefined && entry.family !== input.family) throw Error('Retained SVG receipt contradicts the authored family')
            publicReturns.push(bindRetainedAuthoredSvgReturn(originalInput, entry, receipt.project, original, svg))
            const binding = makeSvgObservationBinding(input, hash(svg), observerSha256)
            ;(bindings[receipt.project] ??= {})[input.id] = binding
            const peer = prepared.find(item => item.node.id === receipt.project), workflow = entry.workflowEvidence ? { witness: entry.workflowEvidence, expected: retainedAuthoredSvgWorkflowOwner(peer) ?? { artifactSha256: '', adapterBindingSha256: '' }, remap } : undefined
            result.observations = recheckFeatureAdmission(input, receipt.project, result.observations, svg, entry.publicResult?.kind, binding, began, workflow)
            const assessed = await recheckFeaturePaint(input, receipt.project, result.observations.filter((row: BenchmarkObservation) => row.metrics?.implementation === receipt.project), () => inspect(receipt.project, svg, input), began, !!receipt.capabilities?.fontOptions, binding)
            result.observations = result.observations.filter((row: BenchmarkObservation) => row.metrics?.implementation !== receipt.project).concat(assessed.observations)
            if (assessed.completed) featureChecked++
          }
        }
        result.observations = result.svgAssessments.flatMap((assessment: any) => completeCriterionLedger(planFidelityCriteria(selected).filter(item => item.surface !== 'native-public-api'), result.observations.filter((row: BenchmarkObservation) => row.metrics?.implementation === assessment.project), assessment.project))
        result.svgAssessments = result.svgAssessments.map((assessment: any) => {
          const cases = assessSvgCases(selected, result.observations.filter((row: any) => row.metrics?.implementation === assessment.project), bindings[assessment.project])
          return { ...assessment, ...summarizeSvgCases(cases), cases }
        })
        result.criteriaProtocol = { ...result.criteriaProtocol, reassessedBy: producer, reassessedPlanned: planFidelityCriteria(selected).filter(item => item.surface !== 'native-public-api') }
        result.recheckBindings = bindings
        result.recheckPublicReturns = publicReturns
      } else continue
      result.recheck = { ...producer, gradingSha256, gradingFile, originalResultSha256: originalSha256, originalMeasurementFinishedAt: result.finishedAt }
      result.status = result.observations.some((row: any) => row.status === 'failed') ? 'failed' : result.observations.some((row: any) => row.status === 'blocked') ? 'blocked' : 'passed'
      write(destination, result)
    }
  } finally { await context.close(); await browser.close() }
  const updated = { ...report, options: { ...(report as any).options, out }, updatedAt: new Date().toISOString(), results: report.results.map(boundary => ({ ...boundary, ...(boundary.out ? { out: remap(boundary.out) } : {}) })), recheck: { ...producer, gradingSha256, gradingFile, originalInventorySha256: inventory.sha256, stimulusSha256: grading.stimulusSha256, originalContractsSha256: grading.originalContractsSha256, gradingContractsSha256: grading.gradingContractsSha256, resourceManifestSha256: assets.manifestSha256, recordedSourceRoots: aliases, originalReportSha256: hash(readFileSync(join(directory, 'report.json'))), ...(formats.includes('png') ? { pngReviewSha256: hash(pngBytes) } : {}), docsSvgChecked: docsChecked, featureSvgChecked: featureChecked }, scope: 'Coverage receipts with fresh grading of the selected formats under current source contracts; unselected formats retain their original grading identities. Original measurements, inventories, public return UUIDs and collected results remain present; SVG/PNG checks call no project renderer; optional offline resvg preservation is recorded separately. Clock comparisons remain unqualified.' }
  if (!existsSync(join(out, 'report.collected.json'))) cpSync(join(directory, 'report.json'), join(out, 'report.collected.json'))
  write(join(out, 'report.json'), updated)
  write(join(out, 'recheck-receipt.json'), updated.recheck)
  return updated.recheck
}

if (import.meta.main) {
  if (process.argv.includes('--help')) console.log('bun unified/recheck-rendering.ts --campaign DIR --out FRESH_DIR [--formats svg,png] [--png-reviews FILE] [--png-raster-profile FILE] [--executable CHROMIUM]\nRechecks retained SVGs and reviewed PNGs without project renderer or reference-parser calls. Original results remain alongside the new verdicts.')
  else {
    const args = new Map<string, string>()
    for (let index = 2; index < process.argv.length; index += 2) { const key = process.argv[index]!, value = process.argv[index + 1]; if (!['--campaign', '--out', '--formats', '--png-reviews', '--png-raster-profile', '--executable'].includes(key) || !value || args.has(key)) throw Error('Use --help'); args.set(key, value) }
    if (!args.has('--campaign') || !args.has('--out')) throw Error('Use --help')
    console.log(JSON.stringify(await recheckRendering(args.get('--campaign')!, args.get('--out')!, args.get('--png-reviews'), args.get('--executable'), args.get('--png-raster-profile'), args.has('--formats') ? args.get('--formats')!.split(',') as ('svg' | 'png')[] : undefined)))
  }
}
