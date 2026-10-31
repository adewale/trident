import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { captureInstalledDependencyClosure } from '../portable/artifact-dependencies.ts'
import { admitCaseEvidenceContract, constructEvidenceVerdict, evidenceDigest, type CaseEvidenceContract, type CheckedEvidence } from '../portable/evidence-contract.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { assessDocsPng, docsExpectationsHash, type DocsPngReview } from './docs-png-drawings.ts'
import { admitDocsReviews, reviewedDocsCase, sourceHash, type DocsDrawingReview, type DocsInput } from './docs-drawings.ts'
import { inspectPng } from './png-inspection.ts'

export interface FrozenRasterProfile {
  schema: 'trident-raster-profile-v1'
  background: '#ffffff' | 'transparent'
  fontFiles: readonly { path: string; sha256: string }[]
  defaultFontFamily: string
}
export interface SvgPngConversionRequest {
  input: DocsInput
  expected: DocsDrawingReview
  /** Both returned public bytes and the exact serialized bytes given to Image.decode. */
  originalSvg: string
  rasterizedSvg: string
  actualPng: Uint8Array
  svgContract: CaseEvidenceContract
  svgEvidence?: CheckedEvidence
  profile: FrozenRasterProfile
  /** Independent source-grounded PNG content reviews, not merely SVG reviews. */
  referencePngReviews: readonly DocsPngReview[]
}
const bytesHash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const require = createRequire(import.meta.url)
const rasterizerIdentity = () => {
  const root = dirname(require.resolve('@resvg/resvg-js/package.json'))
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const closure = captureInstalledDependencyClosure(root)
  const files = ['index.js', 'js-binding.js', 'package.json'].map(path => ({ path, sha256: bytesHash(readFileSync(join(root, path))) }))
  const dependencies = closure.nodes.map(node => ({ name: node.name, version: node.version, files: node.files.map(file => ({ path: file.path, sha256: file.sha256, bytes: file.bytes })) }))
  return { package: manifest.name as string, version: manifest.version as string, sha256: evidenceDigest({ files, dependencies }), platform: process.platform, arch: process.arch }
}
const coordinate = ({ surface, criterion }: { surface: string; criterion: string }) => JSON.stringify([surface, criterion])

/** A pixel-preservation certificate never manufactures semantic credit. Both
 * the exact rasterized SVG and an independently content-checked reference raster
 * must already satisfy the complete source facts. The second requirement catches
 * a rasterizer that drops a feature in both its reference and candidate image. */
export function assessSvgPngConversion(request: SvgPngConversionRequest) {
  const { input, expected, originalSvg, rasterizedSvg, actualPng, svgEvidence, profile, referencePngReviews } = request
  const unknown = (reason: string) => ({ status: 'unknown' as const, reason })
  const sourceReview = (expected as DocsDrawingReview & { sourceReview?: { expectedFactsComplete?: boolean; unresolved?: unknown[] } }).sourceReview
  admitDocsReviews([input], [expected])
  if (expected.intent !== 'drawing' || expected.id !== input.id || expected.sourceSha256 !== sourceHash(input.source)) throw Error('PNG conversion source contract is stale or not a drawing')
  if (sourceReview?.expectedFactsComplete !== true || sourceReview.unresolved?.length || expected.unverifiedFacts?.length) return unknown('Full source-fact obligations are not independently complete')
  const contract = admitCaseEvidenceContract(request.svgContract)
  if (contract.caseId !== input.id || contract.sourceSha256 !== sourceHash(input.source) || contract.expectationsSha256 !== docsExpectationsHash(expected)) throw Error('PNG conversion SVG evidence differs from the source expectations')
  const required = planFidelityCriteria([reviewedDocsCase(input, expected)]).filter(item => item.surface !== 'native-public-api').map(coordinate).sort()
  if (JSON.stringify(contract.requiredChecks.map(coordinate).sort()) !== JSON.stringify(required)) throw Error('PNG conversion SVG contract omits or changes a required source check')
  const svgVerdict = constructEvidenceVerdict(contract, svgEvidence)
  if (svgVerdict.status !== 'correct') return unknown('The exact rasterized SVG lacks complete passing semantic evidence')
  if (typeof originalSvg !== 'string' || !originalSvg.length || typeof rasterizedSvg !== 'string' || !rasterizedSvg.length || svgVerdict.outputSha256 !== bytesHash(rasterizedSvg)) throw Error('PNG conversion is not bound to the exact rasterized SVG')
  if (Buffer.byteLength(rasterizedSvg) > 4 * 1024 * 1024) return unknown('Independent raster SVG exceeds its declared 4 MiB input budget')
  if (!profile || profile.schema !== 'trident-raster-profile-v1' || !['#ffffff', 'transparent'].includes(profile.background) || typeof profile.defaultFontFamily !== 'string' || !Array.isArray(profile.fontFiles) || new Set(profile.fontFiles.map(file => file.path)).size !== profile.fontFiles.length) throw Error('PNG conversion raster profile is invalid')
  for (const file of profile.fontFiles) if (!file.path || !/^[a-f0-9]{64}$/.test(file.sha256) || bytesHash(readFileSync(file.path)) !== file.sha256) throw Error('PNG conversion font bytes differ from the frozen profile')
  const actual = inspectPng(actualPng, false)
  if (actual.unavailable) return unknown('Actual PNG cannot be fully inspected: ' + actual.findings.join('; '))
  if (actual.findings.length || !actual.pixelIdentity) return { status: 'incorrect' as const, reason: 'Actual PNG cannot be decoded: ' + actual.findings.join('; ') }
  let renderer: Resvg
  try {
    renderer = new Resvg(rasterizedSvg, { background: profile.background === 'transparent' ? undefined : profile.background, fitTo: { mode: 'original' }, font: { loadSystemFonts: false, fontFiles: profile.fontFiles.map(file => file.path), defaultFontFamily: profile.defaultFontFamily }, dpi: 96, logLevel: 'off' })
  } catch (error) { return unknown('Independent rasterizer cannot admit this SVG profile: ' + String(error)) }
  if (!Number.isSafeInteger(renderer.width) || !Number.isSafeInteger(renderer.height) || renderer.width < 1 || renderer.height < 1 || renderer.width * renderer.height > 16 * 1024 * 1024) return unknown('Independent raster exceeds its declared 16 megapixel budget')
  if (renderer.imagesToResolve().length) return unknown('Independent raster has unresolved image resources; no omission can receive a certificate')
  let referencePng: Uint8Array
  try { referencePng = renderer.render().asPng() } catch (error) { return unknown('Independent rasterizer did not complete: ' + String(error)) }
  const reference = inspectPng(referencePng, false)
  if (reference.findings.length || !reference.pixelIdentity) return unknown('Independent raster cannot be fully decoded')
  const independentContent = assessDocsPng(input, expected, referencePng, referencePngReviews)
  if (independentContent.status !== 'correct') return { ...unknown('Independent reference raster lacks a complete passing PNG content review'), referencePng }
  if (reference.pixelIdentity.sha256 !== actual.pixelIdentity.sha256 || reference.pixelIdentity.width !== actual.pixelIdentity.width || reference.pixelIdentity.height !== actual.pixelIdentity.height) return { ...unknown('Actual PNG differs from the independently qualified raster; pixel inequality alone does not prove a semantic error'), referencePng }
  const rasterizer = rasterizerIdentity()
  return {
    status: 'correct' as const,
    reason: 'Actual decoded pixels equal an independently content-qualified raster of the exact fully checked SVG',
    referencePng,
    evidence: {
      schema: 'trident-svg-png-preservation-v1', caseId: input.id, sourceSha256: sourceHash(input.source), expectationsSha256: docsExpectationsHash(expected),
      originalSvgSha256: bytesHash(originalSvg), rasterizedSvgSha256: bytesHash(rasterizedSvg), actualPngSha256: bytesHash(actualPng), referencePngSha256: bytesHash(referencePng),
      pixels: actual.pixelIdentity, svgVerdict, rasterizer, profile: { ...profile, fontFiles: profile.fontFiles.map(({ path, sha256 }) => ({ path, sha256 })) }, profileSha256: evidenceDigest({ ...profile, fontFiles: profile.fontFiles.map(file => ({ sha256: file.sha256 })) }),
      independentReferenceReview: independentContent,
    },
  }
}
