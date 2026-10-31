import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'
import { CollectionCheckpoint } from '../portable/checkpoint.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { reviewedDocsCase, sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { docsExpectationsHash } from '../unified/docs-png-drawings.ts'
import type { OfflinePngReviewReceipt } from '../unified/docs-png-offline-review.ts'
import { auditDocsPngSvgSerialization, mergeOwnedPngSvgStaticChecks, observeOwnedPngSvgStaticFrame, readBrowserPngCaptureProfile } from '../unified/docs-png-svg-static.ts'
import { beginDocsPngCapture, completeDocsPngCapture } from '../unified/docs-png-capture.ts'
import { makeSvgCaseContract } from '../fidelity/svg-assessment.ts'
import { chromiumExecutable } from './helpers/environment.ts'
import type { PaintCheck } from '../fidelity/paint.ts'

setDefaultTimeout(30_000)
let browser: Browser, page: Page
const dirs: string[] = []
const executable = chromiumExecutable ?? '/usr/bin/chromium'
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: executable }); page = await browser.newPage() })
afterAll(async () => { await browser?.close(); for (const dir of dirs) rmSync(dir, { recursive: true, force: true }) })
const source = { id: 'synthetic/same-call-static', family: 'flowchart', source: 'flowchart LR\nA[Alpha]' }
const review: DocsDrawingReview = { id: source.id, sourceSha256: sourceHash(source.source), family: 'flowchart', intent: 'drawing', expected: { labels: ['Alpha'], nodes: [{ id: 'A', label: 'Alpha' }] }, review: 'Independent complete literal synthetic control, never a benchmark score.', sourceReview: { protocol: 'literal-documentation-facts-v1', sourcePin: '1fb7869866dd619168d840291c9c54b4f129758b', method: 'Literal one-labelled-box source control', expectedFactsComplete: true, requiredObligations: ['visible-labels', 'node-identities-and-labels'], unresolved: [], excludedNonvisual: [] } }
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><rect x="5" y="5" width="160" height="50" fill="white" stroke="black"/><text x="15" y="35">Alpha</text></svg>'
async function fixture(originalSvg = svg, project = 'synthetic/eligible-svg') {
  const root = mkdtempSync(join(tmpdir(), 'trident-static-svg-')); dirs.push(root)
  const rasterizedSvg = await page.evaluate(original => { const host = document.createElement('div'); host.innerHTML = original; const root = host.querySelector('svg')!; root.setAttribute('width', '180'); root.setAttribute('height', '60'); root.style.maxWidth = 'none'; return new XMLSerializer().serializeToString(root) }, originalSvg)
  const file = join(root, 'font-control'); writeFileSync(file, 'Synthetic environment byte identity control, not a font correctness assertion')
  const fontManifest = { schema: 'synthetic-frozen-font-control', files: [{ path: file, sha256: evidenceBytesDigest(readFileSync(file)), bytes: readFileSync(file).length }] }, fontsFile = join(root, 'fonts.json'); writeFileSync(fontsFile, JSON.stringify(fontManifest))
  const engine = { artifactSha256: 'c'.repeat(64), kind: 'synthetic-owned-static-control' }
  const context = { browser: { status: 'available', path: executable, sha256: evidenceBytesDigest(readFileSync(executable)), version: 'Synthetic control of actual browser invocation', companions: [{ path: file, sha256: fontManifest.files[0]!.sha256 }] }, resources: { manifestSha256: 'a'.repeat(64), files: [] }, preparedBrowsers: [{ node: { id: project }, browser: engine }] }
  writeFileSync(join(root, 'context.json'), JSON.stringify(context)); writeFileSync(join(root, 'result.json'), '{}')
  const snapshot = () => ({ fonts: fontManifest.files, configuration: fontManifest.files, variables: {} })
  const capture = beginDocsPngCapture(root, ['100644 blob ' + 'a'.repeat(40) + '\tunified/docs-png-browser.ts'], snapshot)
  const identity = { project, caseId: source.id, sourceSha256: sourceHash(source.source), artifactSha256: engine.artifactSha256, bindingSha256: evidenceDigest({ format: 'png', transport: 'svg-conversion', engine, round: 1 }), format: 'png' }
  const journal = new InvocationJournal(join(root, 'invocations')), started = journal.start(identity)
  const actualPng = Buffer.from(await page.evaluate(async serialized => { const image = new Image(); image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized); await image.decode(); const c = document.createElement('canvas'); c.width = 180; c.height = 60; const ctx = c.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0,0,180,60); ctx.drawImage(image,0,0); return Array.from(new Uint8Array(await (await new Promise<Blob>(done => c.toBlob(blob => done(blob!), 'image/png'))).arrayBuffer())) }, rasterizedSvg))
  journal.returned(started, actualPng, 1)
  new CollectionCheckpoint(root, { schema: 'synthetic-static-control' }).record(JSON.stringify(['raw-png', project, 1, source.id]), { status: 'passed', invocationId: started.attemptId, bytesBase64: actualPng.toString('base64'), originalSvg, rasterizedSvg })
  const completionFile = completeDocsPngCapture(capture,[started.attemptId],snapshot).file
  const profile = readBrowserPngCaptureProfile({root,completionFile})
  const receipt: OfflinePngReviewReceipt = { schema: 'trident-offline-png-image-review-v1', project, source: source.source, reviewedSourceContract: review, actualImage: { path: 'synthetic-box.png', sha256: evidenceBytesDigest(actualPng), width: 180, height: 60 }, inspection: { method: 'Synthetic view_image explicit full source/image control; not benchmark image evidence', packet: 'synthetic-packet.png', packetSha256: evidenceBytesDigest(actualPng), checkedAt: '2026-10-31T18:00:00Z' }, review: { id: source.id, sourceSha256: sourceHash(source.source), expectationsSha256: docsExpectationsHash(review), pngSha256: evidenceBytesDigest(actualPng), status: 'correct', reviewedBy: 'Independent synthetic full-source control author', review: 'Known authored control contains exactly one visible Alpha label in a stroked box. This tests evidence gates and does not claim a general image oracle or a benchmark image review.' } }
  return { root, source, review, receipt, actualPng, packet: actualPng, originalSvg, rasterizedSvg, attemptId: started.attemptId, round: 1, profile, evaluate: <T>(fn: typeof auditDocsPngSvgSerialization, value: { originalSvg: string; rasterizedSvg: string }) => page.evaluate(fn, value) as Promise<T>, fontsFile, completionFile }
}
const unknown = (criterion: string): PaintCheck => ({ criterion, status: 'unavailable', expected: 'Full authored fact', actual: 'DOM representation unavailable', scope: 'Independent SVG observer' })
function mergeInput(f: Awaited<ReturnType<typeof fixture>>, frame: Awaited<ReturnType<typeof observeOwnedPngSvgStaticFrame>>, checks: PaintCheck[]) {
  const contract = makeSvgCaseContract(reviewedDocsCase(f.source, f.review)), svgSha256 = evidenceBytesDigest(f.rasterizedSvg)
  return { checks, frame, source: f.source, review: f.review, svgSha256, binding: { sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, svgSha256 }, target: 'rasterized' as const }
}

test('same-call independent PNG evidence fills only unavailable closed painted checks and preserves contradictions', async () => {
  const f = await fixture(), frame = await observeOwnedPngSvgStaticFrame(f)
  const failed = { ...unknown('painted-relationships'), status: 'failed' as const, actual: 'Actual arrow points the wrong way' }
  const result = mergeOwnedPngSvgStaticChecks(mergeInput(f, frame, [unknown('visible-authored-labels'), unknown('painted-node-ownership'), unknown('source-fact:node-shapes'), failed, unknown('svg-root'), unknown('svg-unique-ids'), unknown('canvas'), unknown('source-fact:size'), unknown('source-fact:authored-config'), unknown('source-fact:node-attributes'), unknown('source-fact:accessibility-title'), unknown('emitted-image-decoding'), unknown('future-new-criterion')]))
  expect(result.supplied).toEqual(['visible-authored-labels', 'painted-node-ownership'])
  expect(result.conflicts).toEqual(['painted-relationships'])
  expect(result.checks[2]!.status).toBe('unavailable')
  expect(result.checks[3]).toBe(failed)
  expect(result.checks.slice(4).every(check => check.status === 'unavailable')).toBe(true)
  expect(Object.isFrozen(frame.transformation)).toBe(true)
})

test('native PNGs, reference/preservation labels, unknown decisions and changed source/image cannot supply a static SVG proof', async () => {
  const f = await fixture()
  for (const mutate of [
    (r: OfflinePngReviewReceipt) => { r.project = 'pub:mermaid_flutter' },
    (r: OfflinePngReviewReceipt) => { r.inspection.method = 'Generated resvg reference agrees with SVG' },
    (r: OfflinePngReviewReceipt) => { (r.review as any).status = 'unknown' },
    (r: OfflinePngReviewReceipt) => { r.source += '\nB[Beta]' },
    (r: OfflinePngReviewReceipt) => { r.review.expectationsSha256 = '0'.repeat(64) },
  ]) { const receipt = structuredClone(f.receipt); mutate(receipt); await expect(observeOwnedPngSvgStaticFrame({ ...f, receipt })).rejects.toThrow() }
  await expect(observeOwnedPngSvgStaticFrame({ ...f, packet: Buffer.from('changed packet') })).rejects.toThrow('image or inspection packet changed')
  await expect(observeOwnedPngSvgStaticFrame({ ...f, attemptId: 'separate-call' })).rejects.toThrow()
  await expect(observeOwnedPngSvgStaticFrame({ ...f, rasterizedSvg: f.rasterizedSvg.replace('Alpha','Beta') })).rejects.toThrow('raw PNG return')
})

test('capture environment and opaque certificate identities cannot be substituted', async () => {
  const f = await fixture(), frame = await observeOwnedPngSvgStaticFrame(f)
  await expect(observeOwnedPngSvgStaticFrame({ ...f, profile: structuredClone(f.profile) })).rejects.toThrow('admitted capture profile')
  expect(() => mergeOwnedPngSvgStaticChecks({ ...mergeInput(f, frame, [unknown('visible-ink')]), frame: structuredClone(frame) })).toThrow('admitted same-call')
  expect(() => mergeOwnedPngSvgStaticChecks({ ...mergeInput(f, frame, [unknown('visible-ink')]), svgSha256: '0'.repeat(64) })).toThrow()
  const changed = structuredClone(f.review); changed.expected!.facts = { direction: 'LR' }
  expect(() => mergeOwnedPngSvgStaticChecks({ ...mergeInput(f, frame, [unknown('visible-ink')]), review: changed })).toThrow('stale source')
  expect(() => mergeOwnedPngSvgStaticChecks(mergeInput(f, frame, [unknown('visible-ink'),unknown('visible-ink')]))).toThrow('duplicate')
  writeFileSync(join(f.root, 'font-control'), 'altered actual environment bytes')
  expect(() => readBrowserPngCaptureProfile({ root: f.root, completionFile: f.completionFile })).toThrow('environment bytes changed')
})

test('bounded serialization distinguishes retained raster frame from changed intrinsic original presentation', async () => {
  const f = await fixture(svg.replace('width="180"', 'width="100%"').replace('height="60"','height="60" viewBox="0 0 180 60"')), frame = await observeOwnedPngSvgStaticFrame(f)
  expect(frame.transformation.matched).toBe(true); expect(frame.originalStaticTransfer).toBe('unavailable')
  const originalHash = evidenceBytesDigest(f.originalSvg)
  expect(() => mergeOwnedPngSvgStaticChecks({ ...mergeInput(f, frame, [unknown('visible-ink')]), svgSha256: originalHash, binding: { ...mergeInput(f,frame,[]).binding, svgSha256: originalHash }, target: 'original' })).toThrow('cannot transfer')
  expect((await page.evaluate(auditDocsPngSvgSerialization, { originalSvg: svg, rasterizedSvg: f.rasterizedSvg.replace('Alpha','Beta') })).matched).toBe(false)
})


test('well-formed foreignObject XML can change text ownership under HTML repair and cannot transfer original paint', async () => {
  const originalSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60" style="max-width:none"><foreignObject width="200" height="60"><div xmlns="http://www.w3.org/1999/xhtml" style="color:black;font:20px sans-serif"><span style="color:red"/>Text</div></foreignObject></svg>'
  const rasterizedSvg = await page.evaluate(original => { const host=document.createElement('div');host.innerHTML=original;const root=host.querySelector('svg')!;root.setAttribute('width','200');root.setAttribute('height','60');root.style.maxWidth='none';return new XMLSerializer().serializeToString(root) }, originalSvg)
  const audit = await page.evaluate(auditDocsPngSvgSerialization, { originalSvg, rasterizedSvg })
  expect(audit).toMatchObject({ matched: true, originalXmlWellFormed: true, unchangedIntrinsicSizing: true, originalTreeEquivalent: false })
  const unchanged = await fixture(); const frame = await observeOwnedPngSvgStaticFrame(unchanged)
  expect(frame.originalStaticTransfer).toBe('bounded-intrinsic-frame')
})


test('eligible SVG projects share the same evidence method and cannot borrow another capture execution', async () => {
  const f = await fixture(svg,'another/eligible-svg-project'), frame = await observeOwnedPngSvgStaticFrame(f)
  expect(frame.returnEvidence.project).toBe('another/eligible-svg-project')
  const snapshot = () => ({fonts:f.profile.fontFiles.map(file=>({...file})),configuration:f.profile.fontFiles.map(file=>({...file})),variables:{}})
  const later = beginDocsPngCapture(f.root,['100644 blob '+ 'a'.repeat(40)+'\tunified/docs-png-browser.ts'],snapshot)
  const completed=completeDocsPngCapture(later,[],snapshot),profile=readBrowserPngCaptureProfile({root:f.root,completionFile:completed.file})
  await expect(observeOwnedPngSvgStaticFrame({...f,profile})).rejects.toThrow('not covered by this capture execution')
  const retroactive=beginDocsPngCapture(f.root,['producer'],snapshot), rejected=completeDocsPngCapture(retroactive,[f.attemptId],snapshot)
  expect(rejected.receipt).toMatchObject({status:'unavailable'});expect(rejected.receipt.reason).toContain('already present')
  expect(()=>readBrowserPngCaptureProfile({root:f.root,completionFile:rejected.file})).toThrow()
})


test('one outer SVG can retain nested SVG icon content without accepting sibling roots or outside text',async()=>{
 const originalSvg='<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><svg x="5" y="5" width="20" height="20"><rect width="20" height="20" fill="red"/></svg><text x="30" y="35">Alpha</text></svg>'
 const serialized=await page.evaluate(original=>{const host=document.createElement('div');host.innerHTML=original;const root=host.querySelector('svg')!;root.style.maxWidth='none';return new XMLSerializer().serializeToString(root)},originalSvg)
 expect(await page.evaluate(auditDocsPngSvgSerialization,{originalSvg,rasterizedSvg:serialized})).toMatchObject({matched:true,originalTreeEquivalent:true})
 expect((await page.evaluate(auditDocsPngSvgSerialization,{originalSvg:originalSvg+originalSvg,rasterizedSvg:serialized})).matched).toBe(false)
 expect((await page.evaluate(auditDocsPngSvgSerialization,{originalSvg:'outside'+originalSvg,rasterizedSvg:serialized})).matched).toBe(false)
})
