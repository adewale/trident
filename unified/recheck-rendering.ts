import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { completeCriterionLedger, planFidelityCriteria } from '../fidelity/ledger.ts'
import type { AuthoredFidelityCase } from '../fidelity/meaning.ts'
import type { BenchmarkObservation } from './types.ts'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { inspectQuantitativePaint } from '../fidelity/paint-values.ts'
import { inspectSourceFacts, mergePaintChecks } from '../fidelity/paint-facts.ts'
import { inspectChartFacts } from '../fidelity/paint-chart-facts.ts'
import { evidenceDigest } from '../portable/evidence-contract.ts'
import { assessSvgCases, summarizeSvgCases, makeSvgObservationBinding, type SvgEvidenceBinding } from '../fidelity/svg-assessment.ts'
import { admitDocsReviews, assessDocsDrawing, reviewedDocsCase, type DocsDrawingReview } from './docs-drawings.ts'
import { admitPngReviews, assessDocsPng, type DocsPngReview } from './docs-png-drawings.ts'
import { qualifyOutput } from './qualification.ts'
import { readDocsPngRasterProfile, readRetainedPngSvg, readRetainedPng, bindDocsPngConversionReturn, qualifyRetainedDocsPngConversion } from './docs-png-qualification.ts'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { withDocsDeadline } from './docs-benchmark.ts'
import { tridentDirectory } from './trident-paths.ts'
import { readCampaign } from './campaign-publication.ts'

const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const read = (file: string): any => readBenchmarkDocument(file)
const write = (file: string, value: unknown) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(value) + '\n') }
const safe = (root: string, path: string) => { const file = resolve(root, path); if (relative(root, file).startsWith('..')) throw Error('Retained witness escapes its campaign'); return file }

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

/** Fresh paint evidence replaces every required paint observation. A missing
 * checker result or observer exception can never borrow an earlier pass. */
export async function recheckFeaturePaint(input: AuthoredFidelityCase, project: string, observations: readonly BenchmarkObservation[], inspect: () => Promise<PaintCheck[]>, checkedAt: string, fontOptions = true, binding?: SvgEvidenceBinding) {
  const own = observations.filter(row => row.metrics?.authoredCase === input.id && row.surface === 'browser-owned-ink')
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
  // Unplanned old paint diagnostics are historical too; they must not retain a
  // pass or failure under the identity of the new observer.
  for (const row of own.filter(row => !planned.some(item => item.criterion === row.operation))) fresh.push({ ...row, status: 'blocked', detail: 'Historical paint diagnostic is outside the current required observation plan', metrics: { ...row.metrics, originalCriterionStatus: row.status, recheckedAt: checkedAt, recheckObservation: 'unplanned-historical' } })
  return { completed: !error, ...(error ? { error } : {}), observations: observations.filter(row => !(row.metrics?.authoredCase === input.id && row.surface === 'browser-owned-ink')).concat(fresh) }
}

/** Public return and standalone bytes can be revalidated from their retained
 * receipt. Prelude acceptance/rejection lacks a complete retained contract here
 * and deliberately remains unknown rather than borrowing the old status. */
export function recheckFeatureAdmission(input: AuthoredFidelityCase, project: string, observations: readonly BenchmarkObservation[], svg: string, publicKind: unknown, binding: SvgEvidenceBinding, checkedAt: string): BenchmarkObservation[] {
  const qualification = qualifyOutput({ id: input.id, family: input.family, source: input.source, expectedLabels: input.expected.labels, features: [], provenance: 'Original authored inventory and retained public-return receipt' }, svg, 'svg')
  return observations.map(row => {
    if (row.metrics?.implementation !== project || row.metrics?.authoredCase !== input.id || row.surface !== 'browser-public-api' || !['public-svg-admission', 'standalone-svg-and-labels'].includes(row.operation)) return row
    const receiptReturned = publicKind === 'returned', status: BenchmarkObservation['status'] = !receiptReturned ? 'blocked' : row.operation === 'public-svg-admission' ? 'passed' : qualification.unavailable ? 'blocked' : qualification.ok ? 'passed' : 'failed'
    return { ...row, status, detail: !receiptReturned ? 'Retained receipt does not prove an actual public SVG return' : row.operation === 'public-svg-admission' ? 'Actual public returned SVG bytes and original authored source inventory revalidated; no new renderer call' : qualification.scope + ': ' + qualification.findings.join('; '), metrics: { ...row.metrics, ...binding, originalCriterionStatus: row.metrics?.originalCriterionStatus ?? row.status, recheckedAt: checkedAt, recheckObservation: receiptReturned ? 'retained-public-receipt-revalidated' : 'missing-public-return-receipt' } }
  })
}

/** Reassess retained bytes only. No artifact acquisition, public render call or
 * reference parser call occurs here; every original result remains alongside it. */
export async function recheckRendering(directory: string, out: string, pngReviewFile?: string, executable?: string, pngRasterProfileFile?: string) {
  directory = resolve(directory); out = resolve(out)
  if (existsSync(out) || !relative(directory, out).startsWith('..')) throw Error('Choose a fresh output outside the input campaign')
  const recorded = read(join(directory, 'report.json'))
  const recordedRoot = resolve(recorded.options?.out ?? directory)
  const previous = join(directory, 'report.collected.json')
  const aliases = [recordedRoot, ...(recorded.recheck?.recordedSourceRoots ?? []), ...(existsSync(previous) && read(previous).options?.out ? [resolve(read(previous).options.out)] : [])]
  const report = readCampaign(directory), began = new Date().toISOString()
  const inventoryFile = join(directory, 'preparation/inventories.json'), authored = expandedFidelityCases()
  const sourceInventory = read(inventoryFile)
  const contract = (cases: any[]) => cases.map(({ id, source, expected, paint, prelude }) => ({ id, source, expected, paint, prelude }))
  if (JSON.stringify(contract(sourceInventory.fidelity)) !== JSON.stringify(contract(authored))) throw Error('Authored source/expectation inventory changed; recheck needs its original contracts')
  const docsInventory = read(join(directory, 'docs/inventory.json'))
  const sourceReviews = read(join(tridentDirectory, 'corpus/docs-reviewed.json')) as DocsDrawingReview[]
  admitDocsReviews(docsInventory.cases, sourceReviews)
  const pngBytes = pngReviewFile ? readFileSync(pngReviewFile) : Buffer.from('[]')
  const pngReviews = admitPngReviews(docsInventory.cases, sourceReviews, JSON.parse(pngBytes.toString()) as DocsPngReview[])
  const raster = pngRasterProfileFile ? readDocsPngRasterProfile(pngRasterProfileFile) : undefined
  const producer = { source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tridentDirectory, encoding: 'utf8' }).trim(), producers: protocolIdentity(tridentDirectory, ['unified/recheck-rendering.ts']), browser: executableIdentity(executable ?? defaultChromium(chromium)), rendererInvocations: 0, environment: Object.fromEntries(['LANG', 'LC_ALL', 'LD_LIBRARY_PATH', 'FONTCONFIG_FILE', 'FONTCONFIG_PATH'].map(name => [name, process.env[name] ?? null])), fontReadiness: 'Await document.fonts.ready; only frozen campaign font assets can load', ...(raster ? { pngRasterProfileSha256: raster.fileSha256, pngRasterProfile: raster.profile, referenceRasterizerMode: 'Offline resvg preservation only; no project API calls' } : {}), startedAt: began }
  const observerSha256 = evidenceDigest({ producers: producer.producers, browser: producer.browser, environment: producer.environment, fontReadiness: producer.fontReadiness })
  cpSync(directory, out, { recursive: true, dereference: false, filter: path => !['node_modules', '.git'].includes(path.split('/').at(-1)!) })
  const remap = (path: string) => retainedPath(directory, out, aliases, path)
  const prepared = read(join(directory, 'preparation/community-browser-prepared.json')) as any[]
  const browser = await chromium.launch({ headless: true, executablePath: executable ?? defaultChromium(chromium) })
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, serviceWorkers: 'block' })
  let peer: any, page = await context.newPage()
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.hostname === 'trident.invalid' && url.pathname === '/observer') return route.fulfill({ contentType: 'text/html', headers: { 'content-security-policy': "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: blob: http://127.0.0.1:*; font-src data: blob: http://127.0.0.1:*; connect-src 'none'" }, body: '<!doctype html><meta charset="utf-8"><body>' })
    if (['127.0.0.1', 'trident.invalid'].includes(url.hostname) && peer?.browser) {
      const file = resolve(peer.browser.root, '.' + decodeURIComponent(url.pathname)), asset = peer.browser.files?.find((item: any) => resolve(item.path) === file)
      const blob = asset && join(out, 'preparation/blobs', asset.sha256)
      if (asset && blob && existsSync(blob) && hash(readFileSync(blob)) === asset.sha256) return route.fulfill({ body: readFileSync(blob), contentType: /\.woff2?$/.test(file) ? 'font/woff2' : /\.ttf$/.test(file) ? 'font/ttf' : 'application/octet-stream' })
    }
    return route.abort()
  })
  const inspect = async (project: string, svg: string, input: any): Promise<PaintCheck[]> => {
    peer = prepared.find(item => item.node.id === project)
    if (page.isClosed()) page = await context.newPage()
    await page.goto('http://trident.invalid/observer')
    await page.setContent(svg, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await withDocsDeadline(() => page.evaluate(async () => { await document.fonts.ready }), () => { void page.close().catch(() => {}) })
    const paint = await withDocsDeadline(() => page.evaluate(inspectFidelityPaint, { family: input.family, expected: input.expected, paint: input.paint }), () => { void page.close().catch(() => {}) })
    const quantitative = await withDocsDeadline(() => page.evaluate(inspectQuantitativePaint, { family: input.family, expected: input.expected, source: input.source, nodes: paint.nodes as NonNullable<Parameters<typeof inspectQuantitativePaint>[0]['nodes']> }), () => { void page.close().catch(() => {}) })
    const facts = await withDocsDeadline(() => page.evaluate(inspectSourceFacts, { family: input.family, source: input.source, expected: input.expected, paint, quantitative }), () => { void page.close().catch(() => {}) })
    const charts = await withDocsDeadline(() => page.evaluate(inspectChartFacts, { family: input.family, source: input.source, expected: input.expected, paint, quantitative }), () => { void page.close().catch(() => {}) })
    return mergePaintChecks(paint.checks, quantitative, facts, charts)
  }
  let docsChecked = 0, featureChecked = 0
  try {
    for (const boundary of report.results) {
      if (!boundary.out) continue
      const source = join(boundary.out, 'result.json')
      if (!existsSync(source)) continue
      const destination = remap(source), result = structuredClone(read(source)), originalSha256 = hash(readFileSync(source))
      cpSync(source, join(dirname(destination), 'result.collected.json'))
      if (boundary.suite === 'docs') {
        for (const row of result.observations) {
          if (row.operation !== 'drawing-checks') continue
          const input = docsInventory.cases.find((item: any) => item.id === row.caseId), expected = sourceReviews.find(item => item.id === row.caseId) ?? null
          if (!input) throw Error('Retained drawing observation has no declared documentation input')
          const witness = row.metrics?.witness ? safe(join(out, 'docs'), row.metrics.witness) : undefined
          let assessment: any
          if (row.format === 'png') {
            const bytes = witness && existsSync(witness) ? readRetainedPng(join(out, 'docs'), row.metrics.witness) : undefined
            assessment = assessDocsPng(input, expected, bytes, pngReviews)
            if (assessment.status === 'unknown' && raster && expected?.intent === 'drawing' && bytes && row.metrics?.transport === 'svg-conversion') {
              try {
                const root = join(out, 'docs'), originalSvg = readRetainedPngSvg(root, row.metrics.originalSvgWitness), rasterizedSvg = readRetainedPngSvg(root, row.metrics.rasterizedSvgWitness)
                const render = result.observations.find((item: any) => item.operation === 'render' && item.format === 'png' && item.caseId === row.caseId && item.metrics?.project === row.metrics.project && item.metrics?.round === row.metrics.round && item.metrics?.variant === row.metrics.variant)
                const returnEvidence = render?.status === 'passed' ? bindDocsPngConversionReturn({ root: join(root, 'png'), project: row.metrics.project, round: Number(row.metrics.round), variant: row.metrics.variant, source: input, actualPng: bytes, originalSvg, rasterizedSvg, attemptId: row.metrics.rawInvocationId }) : undefined
                const qualification = await qualifyRetainedDocsPngConversion({ source: input, review: expected, actualPng: bytes, originalSvg, rasterizedSvg, returnEvidence, profile: raster.profile, pngReviews, observerSha256, inspectSvg: (svg, authored) => inspect(row.metrics.project, svg, authored) })
                const { referencePng, ...verdict } = qualification as typeof qualification & { referencePng?: Uint8Array }
                if (referencePng) {
                  const path = 'png/referencePng/' + hash(referencePng) + '.png'
                  mkdirSync(join(root, 'png/referencePng'), { recursive: true }); writeFileSync(join(root, path), referencePng)
                  row.metrics.referencePngWitness = path
                }
                assessment = { ...verdict, originalContentAssessment: assessment }
              } catch (error) { assessment = { status: 'unknown', reason: 'Retained conversion proof did not complete: ' + String(error), originalContentAssessment: assessment } }
            }
          }
          else if (expected?.intent === 'drawing' && witness && existsSync(witness)) {
            const svg = gunzipSync(readFileSync(witness)).toString('utf8')
            if (witness.split('/').at(-1) !== hash(svg) + '.svg.gz') throw Error('Retained SVG content hash differs')
            const authored = reviewedDocsCase(input, expected)
            const render = result.observations.find((item: any) => item.format === 'svg' && item.operation === 'render' && item.caseId === input.id && item.metrics?.project === row.metrics.project && item.metrics?.round === 1)
            const admission = qualifyOutput({ id: input.id, family: authored.family, source: input.source, expectedLabels: authored.expected.labels, features: [], provenance: expected.review }, svg, 'svg')
            try { assessment = assessDocsDrawing(input, expected, render?.status ?? 'blocked', admission.ok, await inspect(row.metrics.project, svg, authored), makeSvgObservationBinding(authored, hash(svg), observerSha256)); docsChecked++ }
            catch (error) { assessment = { status: 'unknown', reason: 'Retained SVG observer did not complete: ' + String(error) } }
          } else assessment = assessDocsDrawing(input, expected, 'blocked', false, [])
          row.metrics = { ...row.metrics, originalDrawingStatus: row.status, recheckedAt: began }
          row.status = assessment.status === 'correct' ? 'passed' : assessment.status === 'incorrect' ? 'failed' : assessment.status === 'not-applicable' ? 'not-applicable' : 'blocked'
          row.detail = JSON.stringify(assessment)
        }
        const updatedInventory = { ...docsInventory, pngReviewSha256: hash(pngBytes), drawingObserver: producer }
        write(join(out, 'docs/inventory.json'), updatedInventory)
      } else if (boundary.suite === 'fidelity') {
        const selected = authored.filter(item => result.selectedCaseIds.includes(item.id))
        const original = result.observations as BenchmarkObservation[]
        // Invalidate old paint evidence before loading any witnesses. Missing
        // receipts/witnesses therefore remain unknown instead of surviving as passes.
        result.observations = original.map(row => {
          if (row.surface === 'native-public-api') return row
          const metrics: NonNullable<BenchmarkObservation['metrics']> = { ...row.metrics, originalCriterionStatus: row.status, originalEvidenceBinding: JSON.stringify({ sourceSha256: row.metrics?.sourceSha256, expectationsSha256: row.metrics?.expectationsSha256, svgSha256: row.metrics?.svgSha256, observerSha256: row.metrics?.observerSha256 }), recheckedAt: began, recheckObservation: 'missing-witness' }
          // A new observer may freshly validate retained bytes. It cannot relabel
          // a historical API/prelude status as if that call had happened again.
          delete metrics.svgSha256; delete metrics.observerSha256
          return { ...row, status: 'blocked', detail: 'No freshly validated retained evidence is available; original status is preserved separately', metrics }
        })
        const witnessed = new Set<string>(), bindings: Record<string, Record<string, SvgEvidenceBinding>> = {}
        for (const receiptPath of result.artifacts ?? []) {
          if (!receiptPath.endsWith('community-fidelity-cases.json')) continue
          const receipt = read(remap(receiptPath))
          for (const entry of receipt.rows ?? []) {
            if (!entry.svgEvidence) continue
            const input = authored.find(item => item.id === entry.caseId)
            if (!input) throw Error('Retained SVG has no original authored contract')
            const svg = gunzipSync(readFileSync(remap(entry.svgEvidence.path))).toString('utf8')
            if (hash(svg) !== entry.svgEvidence.sha256) throw Error('Retained SVG content hash differs')
            const coordinate = JSON.stringify([receipt.project, input.id])
            if (witnessed.has(coordinate)) throw Error('Duplicate retained SVG witness coordinate')
            witnessed.add(coordinate)
            if (entry.family !== undefined && entry.family !== input.family) throw Error('Retained SVG receipt contradicts the authored family')
            const binding = makeSvgObservationBinding(input, hash(svg), observerSha256)
            ;(bindings[receipt.project] ??= {})[input.id] = binding
            result.observations = recheckFeatureAdmission(input, receipt.project, result.observations, svg, entry.publicResult?.kind, binding, began)
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
      } else continue
      result.recheck = { ...producer, originalResultSha256: originalSha256, originalMeasurementFinishedAt: result.finishedAt }
      result.status = result.observations.some((row: any) => row.status === 'failed') ? 'failed' : result.observations.some((row: any) => row.status === 'blocked') ? 'blocked' : 'passed'
      write(destination, result)
    }
  } finally { await context.close(); await browser.close() }
  const updated = { ...report, options: { ...(report as any).options, out }, updatedAt: new Date().toISOString(), results: report.results.map(boundary => ({ ...boundary, ...(boundary.out ? { out: remap(boundary.out) } : {}) })), recheck: { ...producer, recordedSourceRoots: aliases, originalReportSha256: hash(readFileSync(join(directory, 'report.json'))), pngReviewSha256: hash(pngBytes), docsSvgChecked: docsChecked, featureSvgChecked: featureChecked }, scope: 'Coverage receipts with current retained-output checks. Original measurements and collected results remain present; SVG/PNG checks call no project renderer; optional offline resvg preservation is recorded separately. Clock comparisons remain unqualified.' }
  write(join(out, 'report.collected.json'), report); write(join(out, 'report.json'), updated)
  write(join(out, 'recheck-receipt.json'), updated.recheck)
  return updated.recheck
}

if (import.meta.main) {
  if (process.argv.includes('--help')) console.log('bun unified/recheck-rendering.ts --campaign DIR --out FRESH_DIR [--png-reviews FILE] [--png-raster-profile FILE] [--executable CHROMIUM]\nRechecks retained SVGs and reviewed PNGs without project renderer or reference-parser calls. Original results remain alongside the new verdicts.')
  else {
    const args = new Map<string, string>()
    for (let index = 2; index < process.argv.length; index += 2) { const key = process.argv[index]!, value = process.argv[index + 1]; if (!['--campaign', '--out', '--png-reviews', '--png-raster-profile', '--executable'].includes(key) || !value || args.has(key)) throw Error('Use --help'); args.set(key, value) }
    if (!args.has('--campaign') || !args.has('--out')) throw Error('Use --help')
    console.log(JSON.stringify(await recheckRendering(args.get('--campaign')!, args.get('--out')!, args.get('--png-reviews'), args.get('--executable'), args.get('--png-raster-profile'))))
  }
}
