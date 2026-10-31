import { expect, test } from 'bun:test'
import { Resvg } from '@resvg/resvg-js'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { assessDocsPng, docsExpectationsHash } from '../unified/docs-png-drawings.ts'
import { hasDirectPngReviewBasis, importOfflinePngReviews, readLegacyPngDirectBasisAudit, type OfflinePngReviewReceipt } from '../unified/docs-png-offline-review.ts'

const source = { id: 'synthetic/png-basis-audit', family: 'flowchart', source: 'flowchart LR\nA[Alpha]' }
const contract: DocsDrawingReview = { id: source.id, sourceSha256: sourceHash(source.source), family: 'flowchart', intent: 'drawing', expected: { labels: ['Alpha'], nodes: [{ id: 'A', label: 'Alpha' }] }, review: 'Independent literal one-labelled-node negative image control; outside benchmark scores.', sourceReview: { protocol: 'literal-documentation-facts-v1', sourcePin: '1fb7869866dd619168d840291c9c54b4f129758b', method: 'Literal synthetic source review', expectedFactsComplete: true, requiredObligations: ['visible-labels', 'node-identities-and-labels'], unresolved: [], excludedNonvisual: [] } }
// Deliberately wrong pixels: an unlabelled solid block, with no Alpha glyphs.
// This hand-authored negative is not a generated reference or renderer call.
const png = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect x="10" y="10" width="60" height="20" fill="black"/></svg>').render().asPng()
const legacy: OfflinePngReviewReceipt = { schema: 'trident-offline-png-image-review-v1', project: 'synthetic/native-png', source: source.source, reviewedSourceContract: contract, actualImage: { path: 'wrong.png', sha256: evidenceBytesDigest(png), width: 80, height: 40 }, inspection: { method: 'Previous SVG verdict reused; actual PNG not inspected', packet: 'wrong.png', packetSha256: evidenceBytesDigest(png), checkedAt: '2026-10-31T18:00:00Z' }, review: { id: source.id, sourceSha256: sourceHash(source.source), expectationsSha256: docsExpectationsHash(contract), pngSha256: evidenceBytesDigest(png), status: 'correct', reviewedBy: 'Synthetic SVG-derived counterexample, never a direct image reviewer', review: 'Automatically inferred from a prior successful SVG; no actual PNG fact inspection.' } }

test('legacy schema cannot promote a wrong PNG from an earlier SVG verdict without an exact direct-image audit', () => {
  expect(hasDirectPngReviewBasis(legacy)).toBe(false)
  expect(() => importOfflinePngReviews([source], [contract], [legacy], () => png, () => png)).toThrow('direct source-and-actual-image basis')
  const restamped = structuredClone(legacy); restamped.inspection.basis = 'source-and-actual-image'; restamped.inspection.method = 'view_image'
  expect(hasDirectPngReviewBasis(restamped)).toBe(false)
  expect(() => importOfflinePngReviews([source], [contract], [restamped], () => png, () => png)).toThrow('direct source-and-actual-image basis')
})

test('exact separately audited historical negative imports without changing its receipt, while changed decisions cannot inherit that audit', () => {
  const directory = mkdtempSync(join(tmpdir(), 'png-basis-independent-'))
  try {
    const direct = structuredClone(legacy)
    direct.inspection.method = 'Independent actual-image inspection of the unlabelled black block'
    direct.review.status = 'incorrect'; direct.review.reviewedBy = 'Independent synthetic negative image author'
    direct.review.review = 'Source requires the visible Alpha label; actual PNG has a solid black block and no label.'
    const originalSha = evidenceDigest(direct), file = join(directory, 'audit.json')
    writeFileSync(file, JSON.stringify({ schema: 'trident-legacy-direct-png-review-basis-v1', basis: 'source-and-actual-image', auditedBy: 'Independent synthetic direct-image basis reader', method: 'Exact historical receipt inspected independently; wrong image/source mismatch retained.', receiptSha256s: [originalSha] }))
    const audit = readLegacyPngDirectBasisAudit(file)
    const imported = importOfflinePngReviews([source], [contract], [direct], () => png, () => png, audit)
    expect(evidenceDigest(direct)).toBe(originalSha)
    expect(assessDocsPng(source, contract, png, imported.reviews).status).toBe('incorrect')
    const changed = structuredClone(direct); changed.review.status = 'correct'
    expect(() => importOfflinePngReviews([source], [contract], [changed], () => png, () => png, audit)).toThrow('direct source-and-actual-image basis')
    expect(() => importOfflinePngReviews([source], [contract], [direct], () => png, () => png, structuredClone(audit))).toThrow('direct source-and-actual-image basis')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
