import { once } from 'node:events'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { admitCaseEvidenceContract, evidenceBytesDigest, evidenceDigest, type CheckedEvidence } from '../portable/evidence-contract.ts'
import { collectQualifiedTiming, forkOwnedTimingProcess, type QualifiedTimingPublicDriver, type TimingCoordinate } from '../portable/qualified-timing-collection.ts'
import { admitTimingPlan } from '../portable/qualified-timing.ts'
import { environmentIdentity } from '../portable/environment.ts'
import { captureInstalledDependencyClosure } from '../portable/artifact-dependencies.ts'
import { admitPreparedFidelityEngine } from '../fidelity/community.ts'
import { admitNativeLaunch } from '../native-flutter/community-launch.mjs'
import { defaultChromium, executableIdentity } from './benchmark-context.ts'
import { docsPngCaptureEnvironment } from './docs-png-capture.ts'
import { admitDocsReviews, type DocsInput, type DocsDrawingReview } from './docs-drawings.ts'
import { assessDocsPng, bindPngReviewPixels, docsExpectationsHash, type DocsPngReview } from './docs-png-drawings.ts'
import { inspectPng } from './png-inspection.ts'
import { docsSourcePin } from './docs-source-review.ts'
import { protocolIdentity } from './protocol-identity.ts'
import type { PreparedCommunityBrowser } from './community-browser.ts'

export const pngExportTimingBoundary = 'Host source request through fresh owned fork RPC, cold engine/process startup and complete public PNG export bytes returned through RPC; Mermaid includes public SVG render plus XML serialization, Image.decode, white canvas draw and PNG encoding; native uses public renderToPng(source,pixelRatio:1) plus its durable byte bridge. Includes required in-call source/job and returned-byte bridge, hash/receipt writes, common IPC transport. Common worker module initialization, artifact verification, engine teardown, controller retention and full grading excluded. OS/filesystem caches uncontrolled; no warm renderer; display service already running.'
interface Options { preparedFile: string; nativeLaunch: string; prerequisites: string; caseIds: string[]; displayExecutable: string; out: string }
const root = resolve(import.meta.dir, '..')
const key = (c: TimingCoordinate) => [c.round, c.replica, evidenceBytesDigest(c.caseId).slice(0, 12), c.sample].join('-')
export function pngTimingContract(input: DocsInput, review: DocsDrawingReview) {
  return admitCaseEvidenceContract({ schema: 'trident-case-evidence-v1', caseId: input.id, sourceSha256: evidenceBytesDigest(input.source), expectationsSha256: docsExpectationsHash(review), requiredChecks: [{ surface: 'png:public-export', criterion: 'one-complete-png-return' }, { surface: 'png:decoded-image', criterion: 'complete-png-decode' }, { surface: 'png:source-content', criterion: 'full-source-image-review' }] })
}
export function observeTimingPng(input: DocsInput, review: DocsDrawingReview, bytes: Uint8Array, reviews: DocsPngReview[], observerSha256: string, publicReturn?: any): CheckedEvidence {
  const contract = pngTimingContract(input, review), decoded = inspectPng(bytes, true), content = assessDocsPng(input, review, bytes, reviews)
  const returned = publicReturn?.calls === 1 && publicReturn.sourceSha256 === contract.sourceSha256 && publicReturn.outputSha256 === evidenceBytesDigest(bytes) && publicReturn.outputBytes === bytes.length && publicReturn.cleanup?.status === 'passed'
  return { schema: 'trident-checked-evidence-v1', caseId: input.id, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: evidenceBytesDigest(bytes), observerSha256, checks: contract.requiredChecks.map(check => ({ ...check, status: check.criterion === 'one-complete-png-return' ? returned ? 'passed' : 'unknown' : check.criterion === 'complete-png-decode' ? decoded.unavailable ? 'unknown' : decoded.findings.length ? 'failed' : 'passed' : content.status === 'correct' ? 'passed' : content.status === 'incorrect' ? 'failed' : 'unknown', detail: check.criterion === 'one-complete-png-return' ? JSON.stringify(publicReturn ?? { missing: true }) : check.criterion === 'complete-png-decode' ? JSON.stringify(decoded) : JSON.stringify(content) })) }
}
export async function runPngExportTiming(options: Options) {
  assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
  if (existsSync(options.out)) throw Error('PNG timing requires a fresh output directory')
  const inventory = JSON.parse(gunzipSync(readFileSync(join(root, 'corpus/docs-source-inventory.json.gz'))).toString()) as { pin: { commit: string }; cases: DocsInput[] }
  if (inventory.pin.commit !== docsSourcePin || !options.caseIds.length || new Set(options.caseIds).size !== options.caseIds.length) throw Error('Pinned unique documentation cases required')
  const sourceReviews = JSON.parse(readFileSync(join(root, 'corpus/docs-reviewed.json'), 'utf8')) as DocsDrawingReview[]
  const cases = options.caseIds.map(id => inventory.cases.find(input => input.id === id)!), reviews = options.caseIds.map(id => sourceReviews.find(input => input.id === id)!)
  if (cases.some(input => !input) || reviews.some(review => !review || review.intent !== 'drawing' || review.sourceReview?.expectedFactsComplete !== true || review.sourceReview.unresolved.length || review.unverifiedFacts?.length)) throw Error('Complete literal documentation source contracts required')
  const admissions = admitDocsReviews(cases, reviews)
  if (admissions.some(input => !input.sourceAdmission?.matched)) throw Error('Documentation source admission did not match')
  const prepared = JSON.parse(readFileSync(options.preparedFile, 'utf8')) as PreparedCommunityBrowser[], peer = prepared.find(peer => peer.node.id === 'mermaid-js/mermaid')!
  if (!peer?.browser || peer.browserStatus !== 'prepared' || peer.browser.zenuml) throw Error('Frozen ordinary Mermaid browser engine required')
  const engine = admitPreparedFidelityEngine(peer), native = admitNativeLaunch(options.nativeLaunch), executable = defaultChromium(chromium)
  const prerequisiteBytes = readFileSync(options.prerequisites), originals = JSON.parse(prerequisiteBytes.toString()) as { project: string; input: DocsInput; sourceReview: DocsDrawingReview; review: DocsPngReview }[]
  const imageReviews = originals.map(row => bindPngReviewPixels(row.input, row.sourceReview, row.review, Buffer.from(row.review.reviewedPngBase64!, 'base64')))
  for (const input of cases) for (const project of ['mermaid-js/mermaid', 'pub:mermaid_flutter']) {
    const match = originals.filter(row => row.project === project && row.input.id === input.id)
    if (match.length !== 1 || match[0]!.review.status !== 'correct' || match[0]!.review.sourceSha256 !== evidenceBytesDigest(input.source) || match[0]!.review.expectationsSha256 !== docsExpectationsHash(reviews.find(review => review.id === input.id)!)) throw Error('Both bindings require an actual correct current source/image prerequisite: ' + input.id)
  }
  const rendering = { viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light', serviceWorkers: 'block' }
  const producers = protocolIdentity(root, ['unified/timing-png.ts', 'unified/png-export-timing-worker.ts'])
  const environment = { host: environmentIdentity(process.execPath), browser: executableIdentity(executable), fonts: docsPngCaptureEnvironment(), dependencies: captureInstalledDependencyClosure(root), display: { DISPLAY: process.env.DISPLAY ?? null, configuredResolution: '1280x1024x24', executable: executableIdentity(options.displayExecutable) }, rendering, scope: pngExportTimingBoundary }
  if (!environment.display.DISPLAY || environment.display.executable.status !== 'available' || environment.browser.status !== 'available') throw Error('Frozen actual browser and native display required')
  const environmentSha256 = evidenceDigest(environment), observerSha256 = evidenceDigest({ producers, prerequisitesSha256: evidenceBytesDigest(prerequisiteBytes), environment, protocol: 'full-source-png-image-review-exact-bytes-or-verified-decoded-pixels-v1' })
  const baseline = { project: peer.node.id, artifactSha256: engine.artifactSha256, bindingSha256: evidenceDigest({ engine: peer.browser, worker: producers, rendering, publicExport: 'publicDocsPngAction' }) }, candidate = { project: 'pub:mermaid_flutter', artifactSha256: evidenceDigest(native), bindingSha256: evidenceDigest({ worker: producers, publicExport: native.entrypoint, launch: evidenceBytesDigest(readFileSync(options.nativeLaunch)), coverageOnly: true, calls: 1, pixelRatio: 1 }) }
  const plan = admitTimingPlan({ schema: 'trident-qualified-timing-plan-v1', boundary: pngExportTimingBoundary, format: 'png', track: 'first-use', environmentSha256, observerSha256, rounds: 6, samplesPerRound: 1, maximumControlSpread: .25, cases: cases.map(input => pngTimingContract(input, reviews.find(review => review.id === input.id)!)), artifacts: { A0: baseline, A1: baseline, B: candidate } })
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'png-inputs.json'), JSON.stringify({ schema: 'trident-png-export-timing-inputs-v1', sourcePin: docsSourcePin, sources: cases, sourceReviews: reviews, prerequisitesSha256: evidenceBytesDigest(prerequisiteBytes), originalReviews: originals, environment, producers, prepared: peer, admission: engine, native, nativeLaunchFileSha256: evidenceBytesDigest(readFileSync(options.nativeLaunch)), scope: pngExportTimingBoundary }, null, 2) + '\n')
  const directory = (c: TimingCoordinate) => join(options.out, 'public-returns', key(c))
  const driver: QualifiedTimingPublicDriver = { context: { boundary: plan.boundary, format: 'png', track: plan.track, environmentSha256, artifacts: plan.artifacts }, async open(c) {
    const dir = directory(c); mkdirSync(dir, { recursive: true })
    const input = cases.find(input => input.id === c.caseId)!, settings = { kind: c.replica === 'B' ? 'native' : 'browser', directory: dir, engine: peer.browser, executable: c.replica === 'B' ? native.executable : executable, rendering, sourceSha256: evidenceBytesDigest(input.source), caseId: input.id, observerSha256, runId: key(c), identity: { ...c.artifact, caseId: input.id, sourceSha256: evidenceBytesDigest(input.source), format: 'png' } }
    const file = join(dir, 'settings.json'); writeFileSync(file, JSON.stringify(settings))
    const handle = forkOwnedTimingProcess(new URL('./png-export-timing-worker.ts', import.meta.url), [file], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
    c.own({ kind: 'child-process', handle })
    const stdout = join(dir, 'host.stdout'), stderr = join(dir, 'host.stderr')
    handle.stdout?.on('data', chunk => { writeFileSync(stdout, chunk, { flag: 'a' }) }); handle.stderr?.on('data', chunk => { writeFileSync(stderr, chunk, { flag: 'a' }) })
    const [ready] = await once(handle, 'message'); if (ready?.schema !== 'trident-qualified-timing-ready-v1') throw Error('Fresh PNG host did not initialize')
    return { artifact: c.artifact, execution: { kind: 'child-process', handle } }
  } }
  let verified = false
  return collectQualifiedTiming(plan, cases.map(input => ({ caseId: input.id, source: input.source, provenance: 'https://github.com/mermaid-js/mermaid/blob/' + docsSourcePin + '/' + input.id.replace(/:(\d+)$/, '#L$1') })), driver, ({ contract, bytes, coordinate }) => {
    if (!verified) {
      if (evidenceDigest(admitPreparedFidelityEngine(peer)) !== evidenceDigest(engine) || evidenceDigest(admitNativeLaunch(options.nativeLaunch)) !== evidenceDigest(native) || evidenceDigest(protocolIdentity(root, ['unified/timing-png.ts', 'unified/png-export-timing-worker.ts'])) !== evidenceDigest(producers) || evidenceDigest(docsPngCaptureEnvironment()) !== evidenceDigest(environment.fonts) || evidenceDigest(executableIdentity(executable)) !== evidenceDigest(environment.browser) || evidenceDigest(executableIdentity(options.displayExecutable)) !== evidenceDigest(environment.display.executable) || evidenceDigest(captureInstalledDependencyClosure(root)) !== evidenceDigest(environment.dependencies) || evidenceDigest(environmentIdentity(process.execPath)) !== evidenceDigest(environment.host)) throw Error('Actual artifact/producer/font/browser/display/SDK inputs changed across capture')
      writeFileSync(join(options.out, 'post-capture.json'), JSON.stringify({ status: 'passed', artifacts: true, producers: true, fonts: true, browser: true, display: true, sdk: true, capturedAt: new Date().toISOString() }))
      verified = true
    }
    const input = cases.find(input => input.id === contract.caseId)!, file = join(directory(coordinate), 'public-return.json'), cleanup = join(directory(coordinate), 'cleanup.json')
    const publicReturn = existsSync(file) ? { ...JSON.parse(readFileSync(file, 'utf8')), cleanup: existsSync(cleanup) ? JSON.parse(readFileSync(cleanup, 'utf8')) : null } : undefined
    return observeTimingPng(input, reviews.find(review => review.id === input.id)!, bytes, imageReviews, observerSha256, publicReturn)
  }, options.out, { collectionBudgetMs: 600_000 })
}
if (import.meta.main) {
  const config = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as Options
  console.log(JSON.stringify(await runPngExportTiming(config), null, 2))
}
