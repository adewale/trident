import { expect, test } from 'bun:test'
import { Resvg } from '@resvg/resvg-js'
import { createHash } from 'node:crypto'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { defineCaseEvidenceContract, type CaseEvidenceContract, type CheckedEvidence } from '../portable/evidence-contract.ts'
import { reviewedDocsCase, sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { bindPngReviewPixels, docsExpectationsHash, type DocsPngReview } from '../unified/docs-png-drawings.ts'
import { assessSvgPngConversion, type SvgPngConversionRequest, type FrozenRasterProfile } from '../unified/png-preservation.ts'

// Constructor/trust-boundary controls, not scores or a substitute for a qualified
// SVG observer. Empty source legitimately permits an empty PNG. Passing check
// records below model a completed independent observer, including its full plan.
const input = { id: 'synthetic:empty-gantt', family: 'gantt', source: 'gantt\n' }
const expected = { id: input.id, sourceSha256: sourceHash(input.source), family: 'gantt', intent: 'drawing', expected: { labels: [], nodes: [], edges: [], facts: { tasks: [] } }, unverifiedFacts: [], sourceReview: { protocol: 'literal-documentation-facts-v1', sourcePin: '1fb7869866dd619168d840291c9c54b4f129758b', method: 'Synthetic empty-source constructor control; no benchmark score.', expectedFactsComplete: true, requiredObligations: ['node-identities-and-labels', 'relationship-endpoints-directions-labels', 'fact:tasks'], unresolved: [], excludedNonvisual: [] }, review: 'Independent source contract: no tasks, labels or visible marks are required.' } as DocsDrawingReview & { sourceReview: { protocol: 'literal-documentation-facts-v1'; sourcePin: string; method: string; expectedFactsComplete: boolean; requiredObligations: string[]; unresolved: string[]; excludedNonvisual: string[] } }
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="1"><rect width="2" height="1" fill="white"/></svg>'
const profile: FrozenRasterProfile = { schema: 'trident-raster-profile-v1', background: '#ffffff', defaultFontFamily: '', fontFiles: [] }
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const raster = (value = svg) => new Resvg(value, { background: '#ffffff', fitTo: { mode: 'original' }, font: { loadSystemFonts: false, fontFiles: [], defaultFontFamily: '' }, dpi: 96, logLevel: 'off' }).render().asPng()
function request() {
  const requiredChecks = planFidelityCriteria([reviewedDocsCase(input, expected)]).filter(item => item.surface !== 'native-public-api').map(({ surface, criterion }) => ({ surface, criterion }))
  const contract: CaseEvidenceContract = { ...defineCaseEvidenceContract({ caseId: input.id, source: input.source, expectations: expected, requiredChecks }), expectationsSha256: docsExpectationsHash(expected) }
  const svgEvidence: CheckedEvidence = { schema: 'trident-checked-evidence-v1', caseId: input.id, sourceSha256: sourceHash(input.source), expectationsSha256: docsExpectationsHash(expected), outputSha256: hash(svg), observerSha256: '1'.repeat(64), checks: requiredChecks.map(item => ({ ...item, status: 'passed', detail: 'Synthetic complete observer record outside benchmark scores.' })) }
  const png = raster()
  const review: DocsPngReview = { id: input.id, sourceSha256: sourceHash(input.source), expectationsSha256: docsExpectationsHash(expected), pngSha256: hash(png), status: 'correct', reviewedBy: 'independent empty-source trust control', review: 'Opaque white empty canvas is consistent with this no-mark source. This unit fixture is not a benchmark result.' }
  return { input, expected, originalSvg: svg, rasterizedSvg: svg, actualPng: png, svgContract: contract, svgEvidence, profile, referencePngReviews: [bindPngReviewPixels(input, expected, review, png)] } satisfies SvgPngConversionRequest
}

test('conversion certificate binds the exact fully checked SVG, independently checked raster, profile and actual PNG', () => {
  const control = request(), result = assessSvgPngConversion(control)
  expect(result.status).toBe('correct')
  if (result.status !== 'correct') throw Error(result.reason)
  expect(result.evidence).toMatchObject({ sourceSha256: hash(input.source), originalSvgSha256: hash(svg), rasterizedSvgSha256: hash(svg), actualPngSha256: hash(control.actualPng), referencePngSha256: hash(control.actualPng), rasterizer: { package: '@resvg/resvg-js', version: '2.6.2' } })
  expect(result.evidence.svgVerdict.missingChecks).toEqual([])
  expect(result.evidence.svgVerdict.planned).toBe(control.svgContract.requiredChecks.length)
})

test('matching raster bytes and a complete SVG alone cannot manufacture PNG content evidence', () => {
  expect(assessSvgPngConversion({ ...request(), referencePngReviews: [] }).status).toBe('unknown')
  const control = request()
  expect(assessSvgPngConversion({ ...control, svgEvidence: undefined }).status).toBe('unknown')
  expect(assessSvgPngConversion({ ...control, svgEvidence: { ...control.svgEvidence!, checks: control.svgEvidence!.checks.slice(1) } }).status).toBe('unknown')
  expect(assessSvgPngConversion({ ...control, svgEvidence: { ...control.svgEvidence!, checks: control.svgEvidence!.checks.map((check, index) => index ? check : { ...check, status: 'failed' }) } }).status).toBe('unknown')
})

test('peer SVGs, missing source checks, stale expected facts and guessed fonts cannot receive certificates', () => {
  const control = request()
  expect(() => assessSvgPngConversion({ ...control, rasterizedSvg: svg.replace('white', 'black') })).toThrow('exact rasterized SVG')
  expect(() => assessSvgPngConversion({ ...control, svgContract: { ...control.svgContract, requiredChecks: control.svgContract.requiredChecks.slice(1) } })).toThrow('required source check')
  expect(() => assessSvgPngConversion({ ...control, svgContract: { ...control.svgContract, expectationsSha256: '0'.repeat(64) } })).toThrow('source expectations')
  expect(() => assessSvgPngConversion({ ...control, profile: { ...profile, fontFiles: [{ path: import.meta.filename, sha256: '0'.repeat(64) }] } })).toThrow('font bytes')
  expect(assessSvgPngConversion({ ...control, expected: { ...expected, sourceReview: { ...expected.sourceReview, expectedFactsComplete: false } } } as SvgPngConversionRequest).status).toBe('unknown')
})

test('pixel inequality with a trusted reference withholds a preservation claim rather than inventing semantic failure', () => {
  const control = request(), changed = raster(svg.replace('white', 'black'))
  const result = assessSvgPngConversion({ ...control, actualPng: changed })
  expect(result.status).toBe('unknown')
  expect(result.reason).toContain('differs')
})
