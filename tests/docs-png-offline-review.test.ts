import { expect, test } from 'bun:test'
import { Resvg } from '@resvg/resvg-js'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { assessDocsPng, docsExpectationsHash } from '../unified/docs-png-drawings.ts'
import { importOfflinePngReviews, type OfflinePngReviewReceipt } from '../unified/docs-png-offline-review.ts'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { materializeOfflinePngReviews } from '../unified/import-png-reviews.ts'
import { gunzipSync } from 'node:zlib'
import { docsPngStaticProjection } from '../unified/docs-png-static-contract.ts'

const input = { id: 'synthetic/offline-raster-control', family: 'flowchart', source: 'flowchart LR\nA[Alpha]-->B[Beta]' }
const contract: DocsDrawingReview = { id: input.id, sourceSha256: sourceHash(input.source), family: 'flowchart', intent: 'drawing', expected: { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true }] }, review: 'Independent literal synthetic control; not a benchmark judgment.', sourceReview: { protocol: 'literal-documentation-facts-v1', sourcePin: '1fb7869866dd619168d840291c9c54b4f129758b', method: 'Literal source control', expectedFactsComplete: true, requiredObligations: ['visible-labels', 'node-identities-and-labels', 'relationship-endpoints-directions-labels'], unresolved: [], excludedNonvisual: [] } }
const png = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="30"><rect width="120" height="30" fill="white"/><path d="M10 15H110" stroke="black"/></svg>').render().asPng()
// Deliberately incorrect image: the synthetic review identifies missing labels,
// boxes and arrowhead. This test never grants correctness from SVG generation.
const receipt: OfflinePngReviewReceipt = { schema: 'trident-offline-png-image-review-v1', project: 'synthetic/native-png-only', source: input.source, reviewedSourceContract: contract, actualImage: { path: 'image.png', sha256: evidenceBytesDigest(png), width: 120, height: 30 }, inspection: { method: 'Synthetic independent negative image control', packetSha256: evidenceBytesDigest(png), packet: 'packet.png', checkedAt: '2026-10-31T18:00:00Z' }, review: { id: input.id, sourceSha256: sourceHash(input.source), pngSha256: evidenceBytesDigest(png), expectationsSha256: docsExpectationsHash(contract), status: 'incorrect', reviewedBy: 'Synthetic independent negative control author', review: 'Source requires Alpha and Beta labeled boxes with an arrow; actual control image contains only a horizontal line.' } }
const run = (rows: OfflinePngReviewReceipt[] = [receipt], current = contract, image = png, packet = png) => importOfflinePngReviews([input], [current], rows, () => image, () => packet)

test('offline receipt retains source-grounded judgment and reviewed original bytes for exact-pixel replay', () => {
  const result = run(), imported = result.reviews[0]!
  expect(imported.status).toBe('incorrect')
  expect(imported.reviewedPngBase64).toBe(Buffer.from(png).toString('base64'))
  expect(assessDocsPng(input, contract, png, result.reviews).status).toBe('incorrect')
  expect(result.imported[0]).toMatchObject({ project: receipt.project, pngSha256: receipt.review.pngSha256, expectationsSha256: docsExpectationsHash(contract) })
})
test('extended source facts cannot silently upgrade an existing image judgment', () => {
  const changed = structuredClone(contract); changed.expected!.facts = { direction: 'LR' }; changed.sourceReview!.requiredObligations.push('fact:direction')
  expect(() => run([receipt], changed)).toThrow('changed source or source contract')
  const upgraded = structuredClone(receipt); upgraded.reviewedSourceContract = changed
  expect(() => run([upgraded], changed)).toThrow('changed source or source contract')
})
test('actual image, packet, dimensions, source and reviewer provenance remain checked', () => {
  expect(() => run([receipt], contract, Buffer.from('changed actual PNG'))).toThrow('image or inspection packet changed')
  expect(() => run([receipt], contract, png, Buffer.from('different packet'))).toThrow('image or inspection packet changed')
  const dimensions = structuredClone(receipt); dimensions.actualImage.width++
  expect(() => run([dimensions])).toThrow('dimensions differ')
  const source = structuredClone(receipt); source.source += '\nB-->C'
  expect(() => run([source])).toThrow('changed source')
  const anonymous = structuredClone(receipt); anonymous.review.reviewedBy = ''
  expect(() => run([anonymous])).toThrow('content review')
})
test('identical project images keep separate inspection receipts and cannot carry conflicting verdicts', () => {
  const peer = structuredClone(receipt); peer.project = 'synthetic/second-native'
  const result = run([receipt, peer])
  expect(result.reviews).toHaveLength(1)
  expect(result.imported).toHaveLength(2)
  peer.review.status = 'correct'
  expect(() => run([receipt, peer])).toThrow('conflict')
})

test('a newly authored canonical static-frame review must retain its exact named format projection', () => {
  const current = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8')).find((review: DocsDrawingReview) => review.id.endsWith('flowchart.md:818')) as DocsDrawingReview
  const canonical = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases.find((input: { id: string }) => input.id === current.id)
  const projected = { ...structuredClone(receipt), source: canonical.source, reviewedSourceContract: current, review: { ...receipt.review, id: current.id, sourceSha256: current.sourceSha256, expectationsSha256: docsExpectationsHash(current) } }
  expect(() => importOfflinePngReviews([canonical], [current], [projected], () => png, () => png)).toThrow('explicitly reviewed static format claim')
  const fresh: OfflinePngReviewReceipt = { ...projected, reviewedStaticProjection: docsPngStaticProjection(current)! }
  expect(importOfflinePngReviews([canonical], [current], [fresh], () => png, () => png).reviews[0]!.status).toBe('incorrect')
  fresh.reviewedStaticProjection!.expected.labels = []
  expect(() => importOfflinePngReviews([canonical], [current], [fresh], () => png, () => png)).toThrow('static format claim')
})


test('separate independent project receipt files preserve their own packet roots and shared exact image bytes', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-offline-import-'))
  try {
    mkdirSync(join(root,'docs/png/drawings'),{recursive:true}); writeFileSync(join(root,'docs/inventory.json'),JSON.stringify({cases:[input]}))
    const contracts = join(root,'contracts.json');writeFileSync(contracts,JSON.stringify([contract]));writeFileSync(join(root,'docs/png/drawings',receipt.review.pngSha256+'.png'),png)
    const files = ['first','second'].map((name,index) => { const dir=join(root,name);mkdirSync(dir);writeFileSync(join(dir,'packet.png'),png);const row=structuredClone(receipt);row.project='synthetic/project-'+index;const path=join(dir,'review.jsonl');writeFileSync(path,JSON.stringify(row)+'\n');return path })
    const result=materializeOfflinePngReviews({campaign:root,receipts:files,out:join(root,'bound.json'),contracts})
    expect(result).toMatchObject({reviews:1,inspections:2,rendererInvocations:0,codexApiInvocations:0})
    const conflicting=structuredClone(receipt);conflicting.review.status='correct';writeFileSync(files[1]!,JSON.stringify(conflicting)+'\n')
    expect(()=>materializeOfflinePngReviews({campaign:root,receipts:files,out:join(root,'conflict.json'),contracts})).toThrow('conflict')
  } finally { rmSync(root,{recursive:true,force:true}) }
})
