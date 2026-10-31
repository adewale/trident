import { readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { readCheckpointValue } from '../portable/checkpoint.ts'
import { admitInvocationEvidence, evidenceDigest, evidenceBytesDigest, type CaseEvidenceContract, type CheckedEvidence } from '../portable/evidence-contract.ts'
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

const ownedWitness = (root: string, witness: string) => {
  const file = resolve(root, witness), suffix = relative(resolve(root), file)
  if (isAbsolute(suffix) || suffix === '..' || suffix.startsWith('../')) throw Error('PNG witness escapes its result directory')
  const actual = relative(realpathSync(root), realpathSync(file))
  if (isAbsolute(actual) || actual === '..' || actual.startsWith('../')) throw Error('PNG witness symlink escapes its result directory')
  return file
}

/** Retained SVG names bind decompressed bytes. A sibling/escaping witness or
 * an encoded hash with different content is a corrupt receipt, never evidence. */
export function readRetainedPngSvg(root: string, witness?: string) {
  if (!witness) return undefined
  const file = ownedWitness(root, witness)
  const svg = gunzipSync(readFileSync(file), { maxOutputLength: 4 * 1024 * 1024 }).toString('utf8')
  if (basename(file) !== evidenceBytesDigest(svg) + '.svg.gz') throw Error('PNG SVG witness hash differs from retained bytes')
  return svg
}

export function readRetainedPng(root: string, witness: string) {
  const file = ownedWitness(root, witness)
  const bytes = readFileSync(file)
  if (basename(file) !== evidenceBytesDigest(bytes) + '.png') throw Error('PNG witness hash differs from retained bytes')
  return bytes
}

/** Also used for native PNG: an image review establishes content, while the
 * owning raw checkpoint establishes which project/case/round returned it. */
export function requireRetainedPngOwnership(input: { root: string; project: string; round: number; source: DocsInput; actualPng: Uint8Array; attemptId?: string }) {
  if (!input.project || !Number.isSafeInteger(input.round) || input.round < 1) throw Error('PNG has no owning project/case/round')
  const raw = readCheckpointValue<any>(input.root, JSON.stringify(['raw-png', input.project, input.round, input.source.id]))
  if (!raw || raw.status !== 'passed' || typeof raw.bytesBase64 !== 'string' || evidenceBytesDigest(Buffer.from(raw.bytesBase64, 'base64')) !== evidenceBytesDigest(input.actualPng) || input.attemptId !== undefined && raw.invocationId !== input.attemptId) throw Error('PNG witness differs from its own project/case/round raw return')
  return { schema: 'trident-owned-png-return-v1' as const, project: input.project, caseId: input.source.id, round: input.round, sourceSha256: sourceHash(input.source.source), pngSha256: evidenceBytesDigest(input.actualPng), rawUnitSha256: evidenceDigest(raw), attemptId: typeof raw.invocationId === 'string' ? raw.invocationId : null }
}

export interface DocsPngConversionReturn {
  schema: 'trident-docs-png-return-v1'
  project: string; caseId: string; round: number; variant: string; attemptId: string
  sourceSha256: string; artifactSha256: string; bindingSha256: string
  originalSvgSha256: string; rasterizedSvgSha256: string; pngSha256: string
  rawUnitSha256: string; startedFrameSha256: string; returnedFrameSha256: string
}
/** A derived witness pointer is not proof of ownership. Match it to that exact
 * project/case/round raw capture and its source-bound public invocation. No old
 * absolute output path is opened while replaying an archived campaign. */
export function bindDocsPngConversionReturn(input: { root: string; project: string; round: number; variant?: string; source: DocsInput; actualPng: Uint8Array; originalSvg?: string; rasterizedSvg?: string; attemptId?: string }) {
  const { root, source, project, round } = input
  if (!project || !Number.isSafeInteger(round) || round < 1 || !input.originalSvg || !input.rasterizedSvg || !input.attemptId) throw Error('Conversion lacks its owning raw project/case/round/attempt evidence')
  const raw = readCheckpointValue<any>(root, JSON.stringify(['raw-png', project, round, source.id]))
  if (!raw || raw.status !== 'passed' || raw.invocationId !== input.attemptId || raw.originalSvg !== input.originalSvg || raw.rasterizedSvg !== input.rasterizedSvg || typeof raw.bytesBase64 !== 'string' || evidenceBytesDigest(Buffer.from(raw.bytesBase64, 'base64')) !== evidenceBytesDigest(input.actualPng)) throw Error('Conversion witnesses differ from their owning raw PNG return')
  const context = JSON.parse(readFileSync(join(root, 'context.json'), 'utf8')), peers = context.preparedBrowsers?.filter((peer: any) => peer.node?.id === project)
  if (peers?.length !== 1 || !peers[0].browser) throw Error('Conversion has no unique frozen browser artifact')
  const variant = input.variant ?? 'primary', expectedVariant = context.artifacts?.find((peer: any) => peer.node?.id === project)?.artifact?.transportVariant ?? 'primary'
  if (variant !== expectedVariant) throw Error('Conversion variant differs from its frozen artifact context')
  const engine = peers[0].browser, journalIdentity = { schema: 'trident-invocation-journal-v1' }
  const started = admitInvocationEvidence(readCheckpointValue(join(root, 'invocations'), input.attemptId + ':started', journalIdentity)), returned = admitInvocationEvidence(readCheckpointValue(join(root, 'invocations'), input.attemptId + ':returned', journalIdentity))
  const identity = returned.identity, bindingSha256 = evidenceDigest({ format: 'png', transport: 'svg-conversion', engine, round })
  if (started.state !== 'started' || returned.state !== 'returned' || started.attemptId !== input.attemptId || returned.attemptId !== input.attemptId || evidenceDigest(started.identity) !== evidenceDigest(identity) || identity.project !== project || identity.caseId !== source.id || identity.sourceSha256 !== sourceHash(source.source) || identity.format !== 'png' || identity.artifactSha256 !== engine.artifactSha256 || identity.bindingSha256 !== bindingSha256 || returned.output?.sha256 !== evidenceBytesDigest(input.actualPng) || returned.output.bytes !== input.actualPng.byteLength) throw Error('Conversion invocation differs from the source, project, round or actual PNG bytes')
  return Object.freeze({ schema: 'trident-docs-png-return-v1' as const, project, caseId: source.id, round, variant, attemptId: input.attemptId, sourceSha256: identity.sourceSha256, artifactSha256: identity.artifactSha256, bindingSha256, originalSvgSha256: evidenceBytesDigest(input.originalSvg), rasterizedSvgSha256: evidenceBytesDigest(input.rasterizedSvg), pngSha256: evidenceBytesDigest(input.actualPng), rawUnitSha256: evidenceDigest(raw), startedFrameSha256: evidenceDigest(started), returnedFrameSha256: evidenceDigest(returned) })
}

/** Observe the exact retained raster input anew under its PNG/source-review
 * contract. Historical SVG-lane verdicts and peer drawings are never copied. */
export async function qualifyRetainedDocsPngConversion(input: {
  source: DocsInput
  review: DocsDrawingReview
  actualPng: Uint8Array
  originalSvg?: string
  rasterizedSvg?: string
  returnEvidence?: DocsPngConversionReturn
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
  const owned = input.returnEvidence
  if (!owned || owned.schema !== 'trident-docs-png-return-v1' || owned.caseId !== input.source.id || owned.sourceSha256 !== sourceHash(input.source.source) || owned.originalSvgSha256 !== evidenceBytesDigest(input.originalSvg) || owned.rasterizedSvgSha256 !== evidenceBytesDigest(input.rasterizedSvg) || owned.pngSha256 !== evidenceBytesDigest(input.actualPng)) return unknown('No matching raw public conversion return binds the exact source, PNG and both SVG witnesses')
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
  const qualification = assessSvgPngConversion({ input: input.source, expected: input.review, originalSvg: input.originalSvg, rasterizedSvg: input.rasterizedSvg, actualPng: input.actualPng, svgContract: contract, svgEvidence: evidence, profile: input.profile, referencePngReviews: input.pngReviews })
  return qualification.status === 'correct' ? { ...qualification, evidence: { ...qualification.evidence, publicReturn: owned } } : qualification
}
