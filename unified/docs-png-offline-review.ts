import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { admitDocsReviews, sourceHash, type DocsInput, type DocsDrawingReview } from './docs-drawings.ts'
import { admitPngReviews, bindPngReviewPixels, docsExpectationsHash, type DocsPngReview } from './docs-png-drawings.ts'
import { inspectPng } from './png-inspection.ts'
import { docsPngStaticProjection, type DocsPngStaticProjection } from './docs-png-static-contract.ts'
import { evidenceDigest } from '../portable/evidence-contract.ts'

export interface OfflinePngReviewReceipt {
  schema: 'trident-offline-png-image-review-v1'
  project: string
  source: string
  reviewedSourceContract: DocsDrawingReview
  /** Present only for a newly authored review of a named static PNG claim. */
  reviewedStaticProjection?: DocsPngStaticProjection
  actualImage: { path: string; sha256: string; width: number; height: number }
  inspection: { method: string; packetSha256: string; packet: string; checkedAt: string }
  review: DocsPngReview
}

/** Imports independently authored judgments. It verifies their original source
 * contracts and inspected images; it never authors, upgrades or fills a review.
 * Callers resolve image/packet names inside their retained evidence bundle. */
export function importOfflinePngReviews(inputs: readonly DocsInput[], currentContracts: readonly DocsDrawingReview[], receipts: readonly OfflinePngReviewReceipt[], readImage: (receipt: OfflinePngReviewReceipt) => Uint8Array, readPacket: (receipt: OfflinePngReviewReceipt) => Uint8Array) {
  admitDocsReviews(inputs, currentContracts)
  const reviews: DocsPngReview[] = [], imported: { project: string; id: string; pngSha256: string; packetSha256: string; expectationsSha256: string }[] = []
  for (const receipt of receipts) {
    const { review, reviewedSourceContract: approved } = receipt
    const input = inputs.find(input => input.id === review?.id), current = currentContracts.find(contract => contract.id === review?.id)
    if (receipt.schema !== 'trident-offline-png-image-review-v1' || !receipt.project?.trim() || !input || !current || receipt.source !== input.source || approved?.id !== input.id || approved.sourceSha256 !== sourceHash(input.source) || current.sourceSha256 !== approved.sourceSha256 || docsExpectationsHash(approved) !== docsExpectationsHash(current) || review.expectationsSha256 !== docsExpectationsHash(approved)) throw Error('Offline PNG review has a changed source or source contract: ' + review?.id)
    if (current.intent !== 'drawing' || current.sourceReview?.expectedFactsComplete !== true || current.sourceReview.unresolved.length || current.unverifiedFacts?.length) throw Error('Offline PNG review lacks a complete admitted source contract: ' + input.id)
    const projection = docsPngStaticProjection(current)
    if (projection ? !receipt.reviewedStaticProjection || evidenceDigest(receipt.reviewedStaticProjection) !== evidenceDigest(projection) : receipt.reviewedStaticProjection !== undefined) throw Error('Offline PNG review does not retain its explicitly reviewed static format claim: ' + input.id)
    if (!receipt.inspection?.method?.trim() || !/^[a-f0-9]{64}$/.test(receipt.inspection.packetSha256) || !receipt.inspection.packet?.trim() || !Number.isFinite(Date.parse(receipt.inspection.checkedAt)) || !receipt.actualImage?.path?.trim() || receipt.actualImage.sha256 !== review.pngSha256 || !Number.isSafeInteger(receipt.actualImage.width) || !Number.isSafeInteger(receipt.actualImage.height)) throw Error('Offline PNG review has no actual inspected-image receipt: ' + input.id)
    const png = readImage(receipt), packet = readPacket(receipt)
    if (evidenceBytesDigest(png) !== review.pngSha256 || evidenceBytesDigest(packet) !== receipt.inspection.packetSha256) throw Error('Offline PNG reviewed image or inspection packet changed: ' + input.id)
    const decoded = inspectPng(png, false)
    if (decoded.findings.length || decoded.width !== receipt.actualImage.width || decoded.height !== receipt.actualImage.height) throw Error('Offline PNG review dimensions differ from its actual reviewed image: ' + input.id)
    const bound = bindPngReviewPixels(input, current, review, png)
    // Multiple projects can return exactly the same actual bytes. Preserve their
    // separate inspection receipts, while the flat content-review key is unique.
    const previous = reviews.find(item => item.id === bound.id && item.pngSha256 === bound.pngSha256)
    if (previous && previous.status !== bound.status) throw Error('Independent offline PNG judgments conflict for identical actual pixels')
    if (!previous) reviews.push(bound)
    imported.push({ project: receipt.project, id: input.id, pngSha256: bound.pngSha256, packetSha256: receipt.inspection.packetSha256, expectationsSha256: bound.expectationsSha256 })
  }
  admitPngReviews(inputs, currentContracts, reviews)
  return { reviews, imported }
}
