import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import type { PaintCheck } from '../fidelity/paint.ts'
import { reviewedDocsCase, sourceHash, type DocsDrawingReview, type DocsInput } from './docs-drawings.ts'
import { docsExpectationsHash } from './docs-png-drawings.ts'
import { importOfflinePngReviews, type OfflinePngReviewReceipt } from './docs-png-offline-review.ts'
import { bindDocsPngConversionReturn } from './docs-png-qualification.ts'
import { inspectPng } from './png-inspection.ts'
import { readCheckpointEntries } from '../portable/checkpoint.ts'
import { admitInvocationEvidence } from '../portable/evidence-contract.ts'
import { makeSvgCaseContract } from '../fidelity/svg-assessment.ts'

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
  rasterization: { protocol: 'legacy-no-inline' | 'owned-image-inlining-v1'; resourceManifestSha256?: string }
  producerClosure: readonly string[]
  attemptIds?: readonly string[]
  legacyCheckpointSha256?: string
  claim: 'Static captured frame on an opaque white canvas at intrinsic raster dimensions; no font identity, animation, metadata, structural or independent resvg preservation claim'
}

/** Read the completed collection's actual capture environment. The collector
 * checked this same font manifest before/after capture; replay rechecks bytes.
 * This is environment provenance, never a pixel-derived font assertion. */
export function readBrowserPngCaptureProfile(input: { root: string; fontsFile?: string; completionFile: string; legacyProducerProofFile?: string }): Readonly<BrowserPngCaptureProfile> {
  const contextBytes = readFileSync(join(input.root, 'context.json')), context = JSON.parse(contextBytes.toString())
  const completionBytes = readFileSync(input.completionFile), completion = JSON.parse(completionBytes.toString())
  let fontManifestSha256: string, fontFiles: BrowserPngCaptureProfile['fontFiles'], configuration: any[] = [], producerClosure: string[], attemptIds: string[] | undefined, legacyCheckpointSha256: string | undefined
  if (completion.schema === 'trident-browser-png-capture-v2') {
    const beforeBytes = readFileSync(join(dirname(input.completionFile), 'before.json')), before = JSON.parse(beforeBytes.toString())
    if (completion.status !== 'available' || before.status !== 'available' || completion.beforeSha256 !== evidenceBytesDigest(beforeBytes) || completion.contextSha256 !== evidenceBytesDigest(contextBytes) || before.contextSha256 !== completion.contextSha256 || completion.afterEnvironmentSha256 !== evidenceDigest(before.environment) || !Array.isArray(completion.attemptIds) || new Set(completion.attemptIds).size !== completion.attemptIds.length) throw Error('Static SVG capture lacks unchanged before/after environment and actual invocation coverage')
    if (before.schema !== 'trident-browser-png-capture-before-v2' || !Array.isArray(before.baselineAttemptIds) || !hash(before.baselineJournalSha256) || !Array.isArray(completion.coverage) || completion.coverage.length !== completion.attemptIds.length) throw Error('Static SVG capture lacks its durable pre-call journal baseline')
    const journal = readCheckpointEntries(join(input.root,'invocations'), {schema:'trident-invocation-journal-v1'}).map(([_key,frame])=>admitInvocationEvidence(frame))
    for (const attemptId of completion.attemptIds) {
      const own = completion.coverage.filter((item:any)=>item.attemptId===attemptId), rows=journal.filter(frame=>frame.attemptId===attemptId), starts=rows.filter(frame=>frame.state==='started'),outcomes=rows.filter(frame=>['returned','public-error','interrupted'].includes(frame.state))
      if (before.baselineAttemptIds.includes(attemptId) || own.length!==1 || starts.length!==1 || outcomes.length!==1 || own[0].startedFrameSha256!==evidenceDigest(starts[0]) || own[0].outcomeFrameSha256!==evidenceDigest(outcomes[0]) || outcomes[0]!.startedReceiptSha256!==evidenceDigest(starts[0])) throw Error('Static SVG capture coverage differs from actual new invocation frames')
    }
    fontManifestSha256 = evidenceBytesDigest(beforeBytes); fontFiles = before.environment?.fonts; configuration = before.environment?.configuration; producerClosure = before.producers; attemptIds = completion.attemptIds
  } else {
    // Compatibility for the already executed externally audited collection.
    // Reconstructing its immutable checkpoint proves the old producer closure;
    // no retrospective font timestamp or invocation is manufactured.
    if (completion.schema !== 'trident-owned-full-png-collection-v1' || !input.fontsFile || !input.legacyProducerProofFile) throw Error('Static SVG capture lacks its completed frozen-font collection receipt')
    const fontBytes = readFileSync(input.fontsFile), fonts = JSON.parse(fontBytes.toString()), proof = JSON.parse(readFileSync(input.legacyProducerProofFile, 'utf8')), checkpointBytes = readFileSync(join(input.root, 'checkpoint.json')), checkpoint = JSON.parse(checkpointBytes.toString())
    if (proof.schema !== 'trident-audited-external-png-capture-producer-v1' || proof.identitySha256 !== evidenceBytesDigest(JSON.stringify(proof.identity)) || proof.identitySha256 !== checkpoint.identitySha256 || evidenceDigest(proof.identity.context) !== evidenceDigest(context) || proof.completionSha256 !== evidenceBytesDigest(completionBytes) || proof.fontManifestSha256 !== evidenceBytesDigest(fontBytes) || proof.externalCollector?.sha256 !== evidenceBytesDigest(readFileSync(join(dirname(input.legacyProducerProofFile), proof.externalCollector.path))) || !proof.identity.projects.includes(completion.project) || completion.fontsSha256 !== evidenceBytesDigest(fontBytes)) throw Error('External PNG capture producer/checkpoint or font proof differs')
    fontManifestSha256 = evidenceBytesDigest(fontBytes); fontFiles = fonts.files; producerClosure = proof.identity.producers; legacyCheckpointSha256 = evidenceBytesDigest(checkpointBytes)
    const rows = JSON.parse(readFileSync(join(input.root,'result.json'),'utf8')).observations
    if (!Array.isArray(rows)) throw Error('External PNG capture has no exact result invocation coverage')
    attemptIds = rows.filter((row:any)=>row.operation==='render' && row.metrics?.transport==='svg-conversion').map((row:any)=>row.metrics.rawInvocationId)
    if (!attemptIds?.length || attemptIds.some(id=>typeof id!=='string'||!id.trim()) || new Set(attemptIds).size!==attemptIds.length) throw Error('External PNG capture has incomplete or duplicated result invocation coverage')
  }
  if (completion.resultSha256 !== evidenceBytesDigest(readFileSync(join(input.root, 'result.json'))) || !Array.isArray(fontFiles) || !fontFiles.length || !Array.isArray(configuration) || !Array.isArray(producerClosure) || !producerClosure.length || producerClosure.some(item => typeof item !== 'string' || !/^[0-9]{6} blob [a-f0-9]{40}\t.+$/.test(item))) throw Error('Static SVG capture lacks its exact result, fonts or producer closure')
  const browser = context.browser
  if (browser?.status !== 'available' || !browser.version || !browser.path || !hash(browser.sha256) || evidenceBytesDigest(readFileSync(browser.path)) !== browser.sha256 || !Array.isArray(browser.companions) || !browser.companions.length) throw Error('Static SVG capture lacks its frozen browser bytes')
  for (const file of [...browser.companions, ...fontFiles, ...configuration, ...(context.resources?.files ?? [])]) {
    if (!file?.path || !hash(file.sha256)) throw Error('Static SVG capture has an invalid frozen environment file')
    const bytes = readFileSync(file.path)
    if (evidenceBytesDigest(bytes) !== file.sha256 || file.bytes !== undefined && file.bytes !== bytes.length) throw Error('Static SVG capture environment bytes changed')
  }
  if (new Set(fontFiles.map(file => file.path)).size !== fontFiles.length || !hash(context.resources?.manifestSha256)) throw Error('Static SVG capture font/resource identity is incomplete')
  const profile: BrowserPngCaptureProfile = { schema: 'trident-owned-browser-png-capture-profile-v1', contextSha256: evidenceBytesDigest(contextBytes), completionSha256: evidenceBytesDigest(completionBytes), fontManifestSha256, browser, fontFiles, resources: context.resources, rasterization: context.rasterization ?? { protocol: 'legacy-no-inline' }, producerClosure, ...(attemptIds ? { attemptIds } : {}), ...(legacyCheckpointSha256 ? { legacyCheckpointSha256 } : {}), claim: 'Static captured frame on an opaque white canvas at intrinsic raster dimensions; no font identity, animation, metadata, structural or independent resvg preservation claim' }
  if (!['legacy-no-inline','owned-image-inlining-v1'].includes(profile.rasterization.protocol) || profile.rasterization.protocol === 'owned-image-inlining-v1' && profile.rasterization.resourceManifestSha256 !== context.resources.manifestSha256) throw Error('Static SVG capture has an unknown conversion or image-resource policy')
  frozen(profile); admittedProfiles.add(profile); return profile
}

/** Runs in a disconnected document; no renderer/project API is called. Repeats
 * only the exact audited publicDocsPngAction preparation. A matching result
 * proves this bounded serialization, not original SVG well-formedness/security. */
export function auditDocsPngSvgSerialization(input: { originalSvg: string; rasterizedSvg: string; ownedImages?: { url: string; contentType: string; bytesBase64: string }[] }) {
  if (input.originalSvg.length > 4 * 1024 * 1024 || input.rasterizedSvg.length > 4 * 1024 * 1024) return { matched: false, reason: 'SVG exceeds bounded4MiB input', width: 0, height: 0, originalXmlWellFormed: false, unchangedIntrinsicSizing: false, originalTreeEquivalent: false }
  const document = globalThis.document, host = document.createElement('div'); host.innerHTML = input.originalSvg
  const root = host.querySelector('svg')
  if (!root || host.children.length !== 1 || host.firstElementChild !== root || !Array.from(host.childNodes).every(node=>node===root || node.nodeType===Node.COMMENT_NODE || node.nodeType===Node.TEXT_NODE && !node.nodeValue?.trim())) return { matched: false, reason: 'Not one standalone SVG root', width: 0, height: 0, originalXmlWellFormed: false, unchangedIntrinsicSizing: false, originalTreeEquivalent: false }
  const box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  const width = Math.ceil(box?.length === 4 ? box[2]! : Number.parseFloat(root.getAttribute('width') ?? '')), height = Math.ceil(box?.length === 4 ? box[3]! : Number.parseFloat(root.getAttribute('height') ?? ''))
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width > 16384 || height > 16384 || width * height > 64 * 1024 * 1024) return { matched: false, reason: 'No finite bounded intrinsic raster size', width, height, originalXmlWellFormed: false, unchangedIntrinsicSizing: false, originalTreeEquivalent: false }
  const originalXml = new DOMParser().parseFromString(input.originalSvg, 'image/svg+xml'), originalXmlWellFormed = !originalXml.querySelector('parsererror')
  const unchangedIntrinsicSizing = root.getAttribute('width') === String(width) && root.getAttribute('height') === String(height) && (!root.style.maxWidth || root.style.maxWidth === 'none')
  root.setAttribute('width', String(width)); root.setAttribute('height', String(height)); root.style.maxWidth = 'none'
  const inlineImages = (root: Element) => { for (const node of root.querySelectorAll('image,img')) { const attribute = node.tagName.toLowerCase() === 'img' ? 'src' : node.hasAttribute('href') ? 'href' : 'xlink:href', owned = input.ownedImages?.find(resource=>resource.url===node.getAttribute(attribute)); if (owned) node.setAttribute(attribute,'data:'+owned.contentType+';base64,'+owned.bytesBase64) } }
  inlineImages(root)
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
    originalRoot.setAttribute('width', String(width)); originalRoot.setAttribute('height', String(height)); originalRoot.style.maxWidth = 'none'; inlineImages(originalRoot)
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
export async function observeOwnedPngSvgStaticFrame(input: { root: string; source: DocsInput; review: DocsDrawingReview; receipt: OfflinePngReviewReceipt; actualPng: Uint8Array; packet: Uint8Array; originalSvg: string; rasterizedSvg: string; attemptId: string; round: number; profile: Readonly<BrowserPngCaptureProfile>; evaluate: <T>(fn: typeof auditDocsPngSvgSerialization, value: Parameters<typeof auditDocsPngSvgSerialization>[0]) => Promise<T> }): Promise<Readonly<OwnedPngSvgStaticFrame>> {
  if (!admittedProfiles.has(input.profile) || evidenceBytesDigest(readFileSync(join(input.root, 'context.json'))) !== input.profile.contextSha256) throw Error('Static SVG needs its actual admitted capture profile')
  const project = input.receipt.project
  if (!project?.trim() || input.receipt.review.status !== 'correct' || !input.receipt.inspection.method.includes('view_image')) throw Error('Static SVG needs an independent complete actual-PNG image review from its SVG-producing project')
  importOfflinePngReviews([input.source], [input.review], [input.receipt], () => input.actualPng, () => input.packet)
  if (input.receipt.review.pngSha256 !== evidenceBytesDigest(input.actualPng)) throw Error('Static SVG cannot borrow another image or decoded-pixel alias')
  if (input.profile.attemptIds && !input.profile.attemptIds.includes(input.attemptId)) throw Error('Static SVG invocation was not covered by this capture execution')
  const returnEvidence = bindDocsPngConversionReturn({ root: input.root, project, source: input.source, actualPng: input.actualPng, originalSvg: input.originalSvg, rasterizedSvg: input.rasterizedSvg, attemptId: input.attemptId, round: input.round })
  const transformation = await input.evaluate<ReturnType<typeof auditDocsPngSvgSerialization>>(auditDocsPngSvgSerialization, { originalSvg: input.originalSvg, rasterizedSvg: input.rasterizedSvg, ...(input.profile.rasterization.protocol === 'owned-image-inlining-v1' ? { ownedImages: (input.profile.resources as { files: { url: string; contentType: string; path: string }[] }).files.map(file => ({ url: file.url, contentType: file.contentType, bytesBase64: readFileSync(file.path).toString('base64') })) } : {}) })
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
