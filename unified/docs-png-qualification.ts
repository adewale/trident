import { readFileSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { evidenceBytesDigest, type CaseEvidenceContract, type CheckedEvidence } from '../portable/evidence-contract.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { mergePaintChecks } from '../fidelity/paint-facts.ts'
import type { PaintCheck } from '../fidelity/paint.ts'
import type { AuthoredFidelityCase } from '../fidelity/meaning.ts'
import { docsExpectationsHash, type DocsPngReview } from './docs-png-drawings.ts'
import { reviewedDocsCase, sourceHash, type DocsInput, type DocsDrawingReview } from './docs-drawings.ts'
import { qualifyOutput } from './qualification.ts'
import { assessSvgPngConversion, type FrozenRasterProfile } from './png-preservation.ts'

/** File names are provenance; declared font bytes are the rendering identity.
 * Relative paths resolve against the explicit profile, never the working dir. */
export function readDocsPngRasterProfile(file: string) {
  const bytes = readFileSync(file), raw = JSON.parse(bytes.toString()) as FrozenRasterProfile
  if (!raw || raw.schema !== 'trident-raster-profile-v1' || !['#ffffff', 'transparent'].includes(raw.background) || typeof raw.defaultFontFamily !== 'string' || !Array.isArray(raw.fontFiles)) throw Error('Invalid frozen PNG raster profile')
  const profile: FrozenRasterProfile = { ...raw, fontFiles: raw.fontFiles.map((font: { path: string; sha256: string }) => {
    if (!font || typeof font.path !== 'string' || !font.path || !/^[a-f0-9]{64}$/.test(font.sha256)) throw Error('Invalid frozen PNG font entry')
    const path = resolve(dirname(file), font.path)
    if (evidenceBytesDigest(readFileSync(path)) !== font.sha256) throw Error('Frozen PNG profile font bytes changed')
    return { path, sha256: font.sha256 }
  }) }
  if (new Set(profile.fontFiles.map(font => font.path)).size !== profile.fontFiles.length) throw Error('Duplicate frozen PNG font path')
  return { profile, fileSha256: evidenceBytesDigest(bytes) }
}

/** Retained SVG names bind decompressed bytes. A sibling/escaping witness or
 * an encoded hash with different content is a corrupt receipt, never evidence. */
export function readRetainedPngSvg(root: string, witness?: string) {
  if (!witness) return undefined
  const file = resolve(root, witness), suffix = relative(root, file)
  if (suffix.startsWith('..') || suffix.startsWith('/')) throw Error('PNG SVG witness escapes its result directory')
  const svg = gunzipSync(readFileSync(file), { maxOutputLength: 4 * 1024 * 1024 }).toString('utf8')
  if (basename(file) !== evidenceBytesDigest(svg) + '.svg.gz') throw Error('PNG SVG witness hash differs from retained bytes')
  return svg
}

export function readRetainedPng(root: string, witness: string) {
  const file = resolve(root, witness), suffix = relative(root, file)
  if (suffix.startsWith('..') || suffix.startsWith('/')) throw Error('PNG witness escapes its result directory')
  const bytes = readFileSync(file)
  if (basename(file) !== evidenceBytesDigest(bytes) + '.png') throw Error('PNG witness hash differs from retained bytes')
  return bytes
}

/** Observe the exact retained raster input anew under its PNG/source-review
 * contract. Historical SVG-lane verdicts and peer drawings are never copied. */
export async function qualifyRetainedDocsPngConversion(input: {
  source: DocsInput
  review: DocsDrawingReview
  actualPng: Uint8Array
  originalSvg?: string
  rasterizedSvg?: string
  publicOutputReturned: boolean
  profile: FrozenRasterProfile
  pngReviews: readonly DocsPngReview[]
  observerSha256: string
  inspectSvg: (svg: string, authored: AuthoredFidelityCase) => Promise<PaintCheck[]>
}) {
  const unknown = (reason: string) => ({ status: 'unknown' as const, reason })
  const review = input.review as DocsDrawingReview & { sourceReview?: { expectedFactsComplete?: boolean; unresolved?: unknown[] } }
  if (review.sourceReview?.expectedFactsComplete !== true || review.sourceReview.unresolved?.length || review.unverifiedFacts?.length) return unknown('Full source-fact obligations are not independently complete; conversion observation cannot fill missing source expectations')
  if (!input.originalSvg || !input.rasterizedSvg) return unknown('Conversion needs both the exact public SVG and exact SVG bytes used for rasterization')
  if (!/^[a-f0-9]{64}$/.test(input.observerSha256)) throw Error('Conversion observer has no frozen identity')
  if (!input.publicOutputReturned) return unknown('No completed public output call binds the retained conversion')
  const authored = reviewedDocsCase(input.source, input.review)
  const admission = qualifyOutput({ id: input.source.id, family: authored.family, source: input.source.source, expectedLabels: authored.expected.labels, features: [], provenance: input.review.review }, input.rasterizedSvg, 'svg')
  const publicAdmission = qualifyOutput({ id: input.source.id, family: authored.family, source: input.source.source, expectedLabels: [], features: [], provenance: input.review.review }, input.originalSvg, 'svg')
  if (!admission.ok || !publicAdmission.ok) return unknown('The exact retained public/rasterized SVG does not satisfy its standalone output admission')
  const checks = mergePaintChecks(await input.inspectSvg(input.rasterizedSvg, authored))
  const planned = planFidelityCriteria([authored]).filter(item => item.surface !== 'native-public-api')
  const unplanned = checks.filter(check => check.status !== 'passed' && !planned.some(item => item.surface === 'browser-owned-ink' && item.criterion === check.criterion))
  if (unplanned.length) return unknown('Unplanned observer findings prevent conversion qualification: ' + unplanned.map(check => check.criterion).join(', '))
  const contract: CaseEvidenceContract = { schema: 'trident-case-evidence-v1', caseId: input.source.id, sourceSha256: sourceHash(input.source.source), expectationsSha256: docsExpectationsHash(input.review), requiredChecks: planned.map(({ surface, criterion }) => ({ surface, criterion })) }
  const evidence: CheckedEvidence = { schema: 'trident-checked-evidence-v1', caseId: contract.caseId, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: evidenceBytesDigest(input.rasterizedSvg), observerSha256: input.observerSha256, checks: planned.map(item => {
    if (item.surface === 'browser-public-api') return { surface: item.surface, criterion: item.criterion, status: ['public-svg-admission', 'standalone-svg-and-labels'].includes(item.criterion) ? 'passed' : 'unknown', detail: 'Fresh admission of the exact retained public SVG and raster input' }
    const found = checks.find(check => check.criterion === item.criterion)
    return { surface: item.surface, criterion: item.criterion, status: found?.status === 'passed' ? 'passed' : found?.status === 'failed' ? 'failed' : 'unknown', detail: found?.scope ?? 'Required check has no qualified current observer' }
  }) }
  return assessSvgPngConversion({ input: input.source, expected: input.review, originalSvg: input.originalSvg, rasterizedSvg: input.rasterizedSvg, actualPng: input.actualPng, svgContract: contract, svgEvidence: evidence, profile: input.profile, referencePngReviews: input.pngReviews })
}
