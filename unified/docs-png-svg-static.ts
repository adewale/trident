import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import type { PaintCheck } from '../fidelity/paint.ts'
import { reviewedDocsCase, sourceHash, type DocsDrawingReview, type DocsInput } from './docs-drawings.ts'
import { docsExpectationsHash } from './docs-png-drawings.ts'
import { importOfflinePngReviews, type OfflinePngReviewReceipt } from './docs-png-offline-review.ts'
import { bindDocsPngConversionReturn } from './docs-png-qualification.ts'
import { inspectPng } from './png-inspection.ts'
import { makeSvgCaseContract } from '../fidelity/svg-assessment.ts'

const mermaid = 'mermaid-js/mermaid'
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const admittedProfiles = new WeakSet<object>(), admittedFrames = new WeakSet<object>()
const frozen = <T>(value: T): T => { if (value && typeof value === 'object') { for (const child of Object.values(value)) frozen(child); Object.freeze(value) } return value }
export interface BrowserPngCaptureProfile {
  schema: 'trident-owned-browser-png-capture-profile-v1'
  contextSha256: string
  completionSha256: string
  fontManifestSha256: string
  browser: unknown
  fontFiles: readonly { path: string; sha256: string; bytes: number }[]
  resources: unknown
  claim: 'Static captured frame on an opaque white canvas at intrinsic raster dimensions; no font identity, animation, metadata, structural or independent resvg preservation claim'
}

/** Read the completed collection's actual capture environment. The collector
 * checked this same font manifest before/after capture; replay rechecks bytes.
 * This is environment provenance, never a pixel-derived font assertion. */
export function readBrowserPngCaptureProfile(input: { root: string; fontsFile: string; completionFile: string }): Readonly<BrowserPngCaptureProfile> {
  const contextBytes = readFileSync(join(input.root, 'context.json')), context = JSON.parse(contextBytes.toString())
  const completionBytes = readFileSync(input.completionFile), completion = JSON.parse(completionBytes.toString()), fontBytes = readFileSync(input.fontsFile), fonts = JSON.parse(fontBytes.toString())
  if (completion.schema !== 'trident-owned-full-png-collection-v1' || completion.project !== mermaid || completion.fontsSha256 !== evidenceBytesDigest(fontBytes) || completion.resultSha256 !== evidenceBytesDigest(readFileSync(join(input.root, 'result.json'))) || !Array.isArray(fonts.files) || !fonts.files.length) throw Error('Static SVG capture lacks its completed frozen-font collection receipt')
  const browser = context.browser
  if (browser?.status !== 'available' || !browser.version || !browser.path || !hash(browser.sha256) || evidenceBytesDigest(readFileSync(browser.path)) !== browser.sha256 || !Array.isArray(browser.companions) || !browser.companions.length) throw Error('Static SVG capture lacks its frozen browser bytes')
  for (const file of [...browser.companions, ...fonts.files, ...(context.resources?.files ?? [])]) {
    if (!file?.path || !hash(file.sha256)) throw Error('Static SVG capture has an invalid frozen environment file')
    const bytes = readFileSync(file.path)
    if (evidenceBytesDigest(bytes) !== file.sha256 || file.bytes !== undefined && file.bytes !== bytes.length) throw Error('Static SVG capture environment bytes changed')
  }
  if (new Set(fonts.files.map((file: any) => file.path)).size !== fonts.files.length || !hash(context.resources?.manifestSha256)) throw Error('Static SVG capture font/resource identity is incomplete')
  const profile: BrowserPngCaptureProfile = { schema: 'trident-owned-browser-png-capture-profile-v1', contextSha256: evidenceBytesDigest(contextBytes), completionSha256: evidenceBytesDigest(completionBytes), fontManifestSha256: evidenceBytesDigest(fontBytes), browser, fontFiles: fonts.files, resources: context.resources, claim: 'Static captured frame on an opaque white canvas at intrinsic raster dimensions; no font identity, animation, metadata, structural or independent resvg preservation claim' }
  frozen(profile); admittedProfiles.add(profile); return profile
}

/** Runs in a disconnected document; no renderer/project API is called. Repeats
 * only the exact audited publicDocsPngAction preparation. A matching result
 * proves this bounded serialization, not original SVG well-formedness/security. */
export function auditDocsPngSvgSerialization(input: { originalSvg: string; rasterizedSvg: string }) {
  if (input.originalSvg.length > 4 * 1024 * 1024 || input.rasterizedSvg.length > 4 * 1024 * 1024) return { matched: false, reason: 'SVG exceeds bounded4MiB input', width: 0, height: 0, originalXmlWellFormed: false, unchangedIntrinsicSizing: false, originalTreeEquivalent: false }
  const document = globalThis.document, host = document.createElement('div'); host.innerHTML = input.originalSvg
  const roots = host.querySelectorAll('svg'), root = host.querySelector('svg')
  if (!root || roots.length !== 1 || host.children.length !== 1 || host.firstElementChild !== root) return { matched: false, reason: 'Not one standalone SVG root', width: 0, height: 0, originalXmlWellFormed: false, unchangedIntrinsicSizing: false, originalTreeEquivalent: false }
  const box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  const width = Math.ceil(box?.length === 4 ? box[2]! : Number.parseFloat(root.getAttribute('width') ?? '')), height = Math.ceil(box?.length === 4 ? box[3]! : Number.parseFloat(root.getAttribute('height') ?? ''))
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width > 16384 || height > 16384 || width * height > 64 * 1024 * 1024) return { matched: false, reason: 'No finite bounded intrinsic raster size', width, height, originalXmlWellFormed: false, unchangedIntrinsicSizing: false, originalTreeEquivalent: false }
  const originalXml = new DOMParser().parseFromString(input.originalSvg, 'image/svg+xml'), originalXmlWellFormed = !originalXml.querySelector('parsererror')
  const unchangedIntrinsicSizing = root.getAttribute('width') === String(width) && root.getAttribute('height') === String(height) && (!root.style.maxWidth || root.style.maxWidth === 'none')
  root.setAttribute('width', String(width)); root.setAttribute('height', String(height)); root.style.maxWidth = 'none'
  const matched = new XMLSerializer().serializeToString(root) === input.rasterizedSvg
  // HTML parsing can change a well-formed XML foreignObject tree (e.g. a
  // self-closing XHTML span acquires following text). Original transfer needs
  // strict namespace/content/attribute equivalence after ONLY root sizing.
  const signature = (node: Node): unknown => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      return { namespace: element.namespaceURI, name: element.localName, attributes: Array.from(element.attributes).filter(attribute => attribute.namespaceURI !== 'http://www.w3.org/2000/xmlns/').map(attribute => [attribute.namespaceURI ?? '', attribute.localName, attribute.value]).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))), children: Array.from(element.childNodes).map(signature) }
    }
    return { type: node.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : node.nodeType, value: node.nodeValue }
  }
  let originalTreeEquivalent = false
  if (originalXmlWellFormed && originalXml.documentElement.namespaceURI === 'http://www.w3.org/2000/svg' && Array.from(originalXml.childNodes).every(node => node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.TEXT_NODE && !node.nodeValue?.trim())) {
    const originalRoot = originalXml.documentElement as unknown as SVGSVGElement
    originalRoot.setAttribute('width', String(width)); originalRoot.setAttribute('height', String(height)); originalRoot.style.maxWidth = 'none'
    originalTreeEquivalent = JSON.stringify(signature(originalRoot)) === JSON.stringify(signature(root))
  }
  return { matched, reason: matched ? 'Exact bounded HTML→XML preparation; original-tree equivalence is separately checked' : 'Retained raster SVG differs from the bounded audited serialization', width, height, originalXmlWellFormed, unchangedIntrinsicSizing, originalTreeEquivalent }
}

export interface OwnedPngSvgStaticFrame {
  schema: 'trident-owned-png-svg-static-frame-v1'
  caseId: string
  sourceSha256: string
  svgExpectationsSha256: string
  pngExpectationsSha256: string
  originalSvgSha256: string
  rasterizedSvgSha256: string
  pngSha256: string
  returnEvidence: ReturnType<typeof bindDocsPngConversionReturn>
  captureProfileSha256: string
  reviewReceiptSha256: string
  transformation: ReturnType<typeof auditDocsPngSvgSerialization>
  originalStaticTransfer: 'bounded-intrinsic-frame' | 'unavailable'
  claim: string
}

/** Positive offline actual-image review is the independent content observer.
 * Same-call raw returns bind its exact pixels to this exact rasterized SVG.
 * No historical SVG verdict, generated reference raster or native PNG qualifies.
 */
export async function observeOwnedPngSvgStaticFrame(input: { root: string; source: DocsInput; review: DocsDrawingReview; receipt: OfflinePngReviewReceipt; actualPng: Uint8Array; packet: Uint8Array; originalSvg: string; rasterizedSvg: string; attemptId: string; round: number; profile: Readonly<BrowserPngCaptureProfile>; evaluate: <T>(fn: typeof auditDocsPngSvgSerialization, value: { originalSvg: string; rasterizedSvg: string }) => Promise<T> }): Promise<Readonly<OwnedPngSvgStaticFrame>> {
  if (!admittedProfiles.has(input.profile) || evidenceBytesDigest(readFileSync(join(input.root, 'context.json'))) !== input.profile.contextSha256) throw Error('Static SVG needs its actual admitted capture profile')
  if (input.receipt.project !== mermaid || input.receipt.review.status !== 'correct' || !input.receipt.inspection.method.includes('view_image')) throw Error('Static SVG needs an independent complete actual-PNG image review from its SVG-producing project')
  importOfflinePngReviews([input.source], [input.review], [input.receipt], () => input.actualPng, () => input.packet)
  if (input.receipt.review.pngSha256 !== evidenceBytesDigest(input.actualPng)) throw Error('Static SVG cannot borrow another image or decoded-pixel alias')
  const returnEvidence = bindDocsPngConversionReturn({ root: input.root, project: mermaid, source: input.source, actualPng: input.actualPng, originalSvg: input.originalSvg, rasterizedSvg: input.rasterizedSvg, attemptId: input.attemptId, round: input.round })
  const transformation = await input.evaluate<ReturnType<typeof auditDocsPngSvgSerialization>>(auditDocsPngSvgSerialization, { originalSvg: input.originalSvg, rasterizedSvg: input.rasterizedSvg })
  const png = inspectPng(input.actualPng, false)
  if (!transformation.matched || transformation.width !== png.width || transformation.height !== png.height) throw Error('Static SVG has an unqualified serialization or raster dimension transformation')
  const frame: OwnedPngSvgStaticFrame = { schema: 'trident-owned-png-svg-static-frame-v1', caseId: input.source.id, svgExpectationsSha256: makeSvgCaseContract(reviewedDocsCase(input.source, input.review)).expectationsSha256, sourceSha256: sourceHash(input.source.source), pngExpectationsSha256: docsExpectationsHash(input.review), originalSvgSha256: returnEvidence.originalSvgSha256, rasterizedSvgSha256: returnEvidence.rasterizedSvgSha256, pngSha256: returnEvidence.pngSha256, returnEvidence, captureProfileSha256: evidenceDigest(input.profile), reviewReceiptSha256: evidenceDigest(input.receipt), transformation, originalStaticTransfer: transformation.originalXmlWellFormed && transformation.unchangedIntrinsicSizing && transformation.originalTreeEquivalent ? 'bounded-intrinsic-frame' : 'unavailable', claim: 'Independent full-source review of the exact same-call actual PNG proves the static painted rasterized-SVG frame on white. Original SVG transfer requires bounded unchanged intrinsic sizing, well-formed XML and namespace/attribute/content tree equivalence; structural validity, security, resources, font identity, metadata, animation and size criteria remain independently required. No timing or independent resvg preservation claim.' }
  frozen(frame); admittedFrames.add(frame); return frame
}

// Closed, auditable painted-only checklist. Absent/future criteria stay unknown.
// In particular SVG root/IDs/canvas, font/size/config/style/attributes, resources,
// ARIA and temporal metadata cannot be supplied by a raster picture.
const paintedCriteria = new Set(['visible-authored-labels', 'labels-within-canvas', 'unclipped-authored-labels', 'visible-ink', 'painted-node-ownership', 'painted-relationships', 'painted-relationship-markers', 'painted-route-visibility', 'painted-group-membership', 'painted-relationship-label-counts', 'painted-relationship-label-ownership', 'hidden-authored-content', 'painted-cardinality-decorations', 'painted-slice-weights', 'painted-duration-ratios', 'painted-bit-field-spans', 'painted-quadrant-coordinates', 'painted-radar-values', 'painted-link-weights', 'painted-leaf-weights', 'painted-score-order', 'painted-series-values', 'painted-text-inventory'])
const paintedFacts = new Set(['node-shapes', 'dialect-kinds', 'global-node-scope', 'ports', 'alignments', 'junctions', 'grid-cell-order', 'grid-columns', 'node-paint', 'elements', 'relations', 'title', 'notes', 'members', 'annotations', 'cardinalities', 'generics', 'lollipop-interfaces', 'domain-entries', 'domain-transitions', 'framework-boundaries', 'framework-domains', 'markdown-source-labels', 'layout-constraints', 'frames', 'data-definitions', 'show-data', 'slices', 'participant-order', 'participant-kinds', 'message-style', 'text-line-breaks', 'message-order', 'fragments', 'lifecycles', 'branches', 'commits', 'git-operation-order', 'direction', 'calendar-settings', 'sections', 'tasks', 'frontmatter:displayMode', 'hidden-git-labels', 'cause-hierarchy', 'effect', 'columns', 'decorations', 'hierarchy', 'fields', 'axes', 'points', 'quadrants', 'point-appearance', 'curves', 'range', 'graticule', 'grammar-rules', 'definitions', 'links', 'show-values', 'displayed-node-values', 'autonumber', 'box-appearance', 'state-kinds', 'pseudostates', 'parallel-regions', 'state-classes', 'lane-order', 'periods', 'displayed-values', 'values', 'intersections', 'sets', 'region-texts', 'components', 'evolution', 'map-axes', 'pipelines', 'evolution-stages', 'annotation-legend-position', 'orientation', 'series', 'x-categories', 'y-axis-label', 'y-range', 'x-axis-label', 'displayed-bar-values', 'series-annotations', 'zenuml-event-order', 'zenuml-message-comments', 'control-regions'])
const eligible = (criterion: string) => paintedCriteria.has(criterion) || criterion.startsWith('painted-group:') || criterion.startsWith('occlusion:') || criterion.startsWith('source-fact:') && paintedFacts.has(criterion.slice('source-fact:'.length))

/** Fill only existing unavailable painted checks, preserving every contrary
 * observation. The returned ledger retains both observer and independent frame
 * provenance; it does not remove missing metadata/structural checks. */
export function mergeOwnedPngSvgStaticChecks(input: { checks: readonly PaintCheck[]; frame: Readonly<OwnedPngSvgStaticFrame>; binding: { sourceSha256: string; expectationsSha256: string; svgSha256: string }; source: DocsInput; review: DocsDrawingReview; svgSha256: string; target: 'rasterized' | 'original' }) {
  const contract = makeSvgCaseContract(reviewedDocsCase(input.source, input.review))
  if (input.source.id !== input.frame.caseId || contract.sourceSha256 !== input.frame.sourceSha256 || contract.expectationsSha256 !== input.frame.svgExpectationsSha256 || input.binding.sourceSha256 !== contract.sourceSha256 || input.binding.expectationsSha256 !== contract.expectationsSha256 || input.binding.svgSha256 !== input.svgSha256 || docsExpectationsHash(input.review) !== input.frame.pngExpectationsSha256) throw Error('Static SVG merge has a stale source, expectation or observer binding')
  if (!admittedFrames.has(input.frame) || input.svgSha256 !== (input.target === 'rasterized' ? input.frame.rasterizedSvgSha256 : input.frame.originalSvgSha256)) throw Error('Static SVG merge needs this exact admitted same-call SVG frame')
  if (input.target === 'original' && input.frame.originalStaticTransfer !== 'bounded-intrinsic-frame') throw Error('Static frame cannot transfer to the differently sized or unqualified original SVG')
  if (new Set(input.checks.map(check => check.criterion)).size !== input.checks.length) throw Error('Static SVG merge cannot hide duplicate observer criteria')
  const planned = new Set(contract.requiredChecks.filter(item => item.surface === 'browser-owned-ink').map(item => item.criterion))
  const supplied: string[] = [], conflicts = input.checks.filter(check => check.status === 'failed').map(check => check.criterion)
  const checks = input.checks.map(check => {
    const sourceOwnedOcclusion = check.criterion.startsWith('occlusion:') && input.review.expected?.labels.includes(check.criterion.slice('occlusion:'.length))
    if (check.status !== 'unavailable' || !eligible(check.criterion) || !planned.has(check.criterion) && !sourceOwnedOcclusion) return check
    supplied.push(check.criterion)
    return { ...check, status: 'passed' as const, actual: { independentActualPngFrame: input.frame.pngSha256, reviewReceiptSha256: input.frame.reviewReceiptSha256, sameCallReturnSha256: evidenceDigest(input.frame.returnEvidence), originalObserver: check.actual }, scope: check.scope + '; independently source-reviewed exact same-call static PNG frame on white; structural/font/resource/metadata/motion claims excluded' }
  })
  return { schema: 'trident-owned-png-svg-static-merge-v1' as const, checks, supplied, conflicts, frameSha256: evidenceDigest(input.frame), target: input.target, svgSha256: input.svgSha256, scope: input.frame.claim }
}
