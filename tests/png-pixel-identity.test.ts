import { expect, test } from 'bun:test'
import { crc32, deflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { inspectPng } from '../unified/png-inspection.ts'
import { admitPngReviews, assessDocsPng, bindPngReviewPixels, docsExpectationsHash, type DocsPngReview } from '../unified/docs-png-drawings.ts'
import { requiredDocumentationObligations } from '../unified/docs-source-review.ts'
import { sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'

const chunk = (type: string, data: Uint8Array) => {
  const bytes = Buffer.alloc(data.length + 12); bytes.writeUInt32BE(data.length); bytes.write(type, 4); bytes.set(data, 8); bytes.writeUInt32BE(crc32(bytes.subarray(4, -4)), bytes.length - 4); return bytes
}
function image(raw: Uint8Array, { width = 2, height = 1, depth = 8, color = 6, interlace = 0, metadata = [] as [string, Uint8Array][], level = 6, split = false } = {}) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = depth; header[9] = color; header[12] = interlace
  const compressed = deflateSync(raw, { level }), middle = Math.floor(compressed.length / 2)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), ...metadata.map(([type, bytes]) => chunk(type, bytes)), ...(split ? [chunk('IDAT', compressed.subarray(0, middle)), chunk('IDAT', compressed.subarray(middle))] : [chunk('IDAT', compressed)]), chunk('IEND', Buffer.alloc(0))])
}
const pixels = [0, 0, 0, 255, 255, 255, 255, 255], raw = Uint8Array.from([0, ...pixels]), baseline = image(raw)
const identity = (png: Uint8Array) => { const decoded = inspectPng(png, false); expect(decoded.findings).toEqual([]); expect(decoded.pixelIdentity).toBeDefined(); return decoded.pixelIdentity! }
const hash = (png: Uint8Array) => createHash('sha256').update(png).digest('hex')

test('canonical pixel identity ignores IDAT compression, chunk boundaries, filters and nonvisual annotations', () => {
  const annotated = image(raw, { level: 0, split: true, metadata: [['tEXt', Buffer.from('Comment\0a harmless annotation')], ['tIME', Buffer.from([7, 234, 10, 31, 12, 0, 0])]] })
  expect(hash(annotated)).not.toBe(hash(baseline))
  expect(identity(annotated)).toEqual(identity(baseline))
  // Sub filtering stores the white pixel relative to the preceding black one;
  // its alpha byte wraps to zero. This is a different encoding of the same ink.
  expect(identity(image(Uint8Array.from([1, 0, 0, 0, 255, 255, 255, 255, 0])))).toEqual(identity(baseline))
})

test('palette, grayscale and 16-bit encodings agree only on identical full RGBA samples', () => {
  expect(identity(image(Uint8Array.from([0, 0x40]), { color: 0, depth: 1 }))).toEqual(identity(baseline))
  expect(identity(image(Uint8Array.from([0, 0, 1]), { color: 3, metadata: [['PLTE', Uint8Array.from([0, 0, 0, 255, 255, 255])]] }))).toEqual(identity(baseline))
  expect(identity(image(Uint8Array.from([0, 0, 0, 0, 255, 255, 255]), { color: 2 }))).toEqual(identity(baseline))
  const sixteen = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255])
  expect(identity(image(sixteen, { depth: 16 }))).toEqual(identity(baseline))
  sixteen[2] = 1 // A low color bit that an 8-bit thumbnail would discard.
  expect(identity(image(sixteen, { depth: 16 })).sha256).not.toBe(identity(baseline).sha256)
})

test('Adam7 placement reconstructs row-major pixels rather than hashing the pass or color histogram', () => {
  const values = Array.from({ length: 9 }, (_, i) => [i * 21, 255 - i * 20, i * 13, 255])
  const normal = image(Uint8Array.from(Array.from({ length: 3 }, (_, y) => [0, ...values.slice(y * 3, y * 3 + 3).flat()]).flat()), { width: 3, height: 3 })
  const passes = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]]
  const scanlines: number[] = []
  for (const [x, y, dx, dy] of passes) for (let row = y!; row < 3; row += dy!) { if (x! >= 3) continue; scanlines.push(0); for (let column = x!; column < 3; column += dx!) scanlines.push(...values[row * 3 + column]!) }
  expect(identity(image(Uint8Array.from(scanlines), { width: 3, height: 3, interlace: 1 }))).toEqual(identity(normal))
  expect(identity(image(Uint8Array.from([0, ...pixels.slice(4), ...pixels.slice(0, 4)]))).sha256).not.toBe(identity(baseline).sha256)
})

test('dimensions, alpha, color interpretation and unrecognized display metadata remain bound', () => {
  expect(identity(image(Uint8Array.from([0, ...pixels.slice(0, 4), 0, ...pixels.slice(4)]), { width: 1, height: 2 })).sha256).not.toBe(identity(baseline).sha256)
  expect(identity(image(Uint8Array.from([0, 0, 0, 0, 0, 255, 255, 255, 255]))).sha256).not.toBe(identity(baseline).sha256)
  for (const metadata of [[['gAMA', Buffer.from([0, 0, 177, 143])]], [['sRGB', Buffer.from([0])]], [['eXIf', Buffer.from('orientation metadata')]], [['vpAg', Buffer.from('unrecognized visual extension')]]] as [string, Uint8Array][][]) {
    expect(identity(image(raw, { metadata })).sha256).not.toBe(identity(baseline).sha256)
  }
})

test('animation and unsupported or damaged pixels cannot acquire a static pixel certificate', () => {
  const animation = inspectPng(image(raw, { metadata: [['acTL', Buffer.from([0, 0, 0, 2, 0, 0, 0, 0])]] }), false)
  expect(animation.unavailable).toBe(true); expect(animation.pixelIdentity).toBeUndefined()
  const broken = Buffer.from(baseline); broken[broken.length - 1]! ^= 1
  expect(inspectPng(broken, false).pixelIdentity).toBeUndefined()
  const oversized = image(new Uint8Array(), { width: 4200, height: 4000 })
  expect(inspectPng(oversized, false).unavailable).toBe(true)
  expect(inspectPng(oversized, false).pixelIdentity).toBeUndefined()
})

const input = { id: 'pixel-trust-fixture', family: 'flowchart', source: 'flowchart LR\nA-->B' }
const complete = (review: DocsDrawingReview): DocsDrawingReview => ({ ...review, sourceReview: { protocol: 'literal-documentation-facts-v1', sourcePin: '1fb7869866dd619168d840291c9c54b4f129758b', method: 'Complete synthetic source contract outside benchmark scores', expectedFactsComplete: true, requiredObligations: requiredDocumentationObligations(review.expected), unresolved: [], excludedNonvisual: [] } })
const expected: DocsDrawingReview = complete({ id: input.id, sourceSha256: sourceHash(input.source), family: 'flowchart', intent: 'drawing', expected: { labels: ['A', 'B'], nodes: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], edges: [{ source: 'A', target: 'B', directed: true }] }, review: 'Source contract; synthetic pixel trust tests do not claim that two pixels draw this graph.' })
const review: DocsPngReview = { id: input.id, sourceSha256: expected.sourceSha256, expectationsSha256: docsExpectationsHash(expected), pngSha256: hash(baseline), status: 'correct', reviewedBy: 'synthetic trust-record fixture', review: 'Synthetic admission record outside benchmark scores.' }

test('a reviewed original binds exact decoded ink without creating a new semantic review', () => {
  const bound = bindPngReviewPixels(input, expected, review, baseline), reencoded = image(raw, { level: 0, split: true })
  expect(assessDocsPng(input, expected, reencoded, [review]).status).toBe('unknown')
  expect(assessDocsPng(input, expected, reencoded, [bound])).toMatchObject({ status: 'correct', evidence: { method: 'reviewed-exact-decoded-pixels', reviewedPngSha256: hash(baseline), actualPngSha256: hash(reencoded) } })
  expect(() => bindPngReviewPixels(input, expected, review, reencoded)).toThrow('reviewed original')
  const reversed = image(Uint8Array.from([0, ...pixels.slice(4), ...pixels.slice(0, 4)]))
  expect(assessDocsPng(input, expected, reversed, [bound]).status).toBe('unknown')
  const wrongPixels = { ...bound, pixels: { ...bound.pixels!, sha256: '0'.repeat(64) } }
  expect(() => assessDocsPng(input, expected, baseline, [wrongPixels])).toThrow('contradict')
})

test('scope changes, unresolved facts and contradictory or malformed trust records cannot supply a pass', () => {
  const bound = bindPngReviewPixels(input, expected, review, baseline)
  const added = complete({ ...expected, expected: { ...expected.expected!, forbiddenLabels: ['hidden member'] } })
  expect(assessDocsPng(input, added, baseline, [bound]).status).toBe('unknown')
  const unresolved = { ...expected, unverifiedFacts: ['unobserved grouping'], sourceReview: { ...expected.sourceReview!, expectedFactsComplete: false, unresolved: ['unobserved grouping'] } }, sourceReview = { ...review, expectationsSha256: docsExpectationsHash(unresolved) }
  expect(assessDocsPng(input, unresolved, baseline, [sourceReview]).status).toBe('unknown')
  expect(() => admitPngReviews([input], [expected], [bound, { ...bound, reviewedPngBase64: undefined, pngSha256: '1'.repeat(64), status: 'incorrect' }])).toThrow('Conflicting')
  for (const pixels of [null, { ...bound.pixels!, width: 0 }, { ...bound.pixels!, protocol: 'perceptual-thumbnail' }]) {
    expect(() => admitPngReviews([input], [expected], [{ ...review, pixels } as any])).toThrow('Missing')
  }
})


test('explicitly empty drawings can replay a reviewed blank raster without a fictitious nonblank failure', () => {
  const empty = { ...input, source: 'gantt\n' }, blank = image(Uint8Array.from([0, 255, 255, 255, 255, 255, 255, 255, 255]))
  const facts: DocsDrawingReview = complete({ id: empty.id, sourceSha256: sourceHash(empty.source), family: 'gantt', intent: 'drawing', expected: { labels: [], nodes: [], edges: [], facts: { tasks: [] } }, review: 'Independent empty-source contract; no visible marks are required.' })
  const reviewed: DocsPngReview = { ...review, sourceSha256: facts.sourceSha256, expectationsSha256: docsExpectationsHash(facts), pngSha256: hash(blank) }
  expect(assessDocsPng(empty, facts, blank, [reviewed]).status).toBe('correct')
  expect(assessDocsPng(empty, facts, blank, []).status).toBe('unknown')
})


test('persisted pixel aliases cannot replace the actual reviewed original PNG', () => {
  const bad = image(Uint8Array.from([0, ...pixels.slice(4), ...pixels.slice(0, 4)])), badPixels = identity(bad)
  const forged = { ...review, pixels: badPixels }
  expect(assessDocsPng(input, expected, bad, [forged]).status).toBe('unknown')
  const bound = bindPngReviewPixels(input, expected, review, baseline)
  expect(() => admitPngReviews([input], [expected], [{ ...bound, pixels: badPixels }])).toThrow('actual reviewed original')
  expect(() => assessDocsPng(input, expected, bad, [{ ...bound, pixels: badPixels }])).toThrow('reviewed original')
  const reencoded = image(raw, { level: 0, split: true })
  const noOriginal = { ...bound, reviewedPngBase64: undefined }
  expect(assessDocsPng(input, expected, reencoded, [noOriginal]).status).toBe('unknown')
  expect(assessDocsPng(input, expected, baseline, [noOriginal]).status).toBe('correct')
  expect(assessDocsPng(input, expected, reencoded, [bound]).status).toBe('correct')
})
