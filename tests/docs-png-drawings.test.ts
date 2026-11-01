import { expect, test } from 'bun:test'
import { crc32, deflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { assessDocsPng, admitPngReviews, docsExpectationsHash, type DocsPngReview } from '../unified/docs-png-drawings.ts'
import { reviewDocumentationSource } from '../unified/docs-source-review.ts'
import { sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { docsPngTransport } from '../unified/docs-png-lane.ts'
import { parseOptions } from '../unified/options.ts'
import { projectSupport } from '../unified/support.ts'
import { callDocsPage } from '../unified/docs-benchmark.ts'

const input = { id: 'source', family: 'flowchart', source: 'flowchart LR\nA-->B' }
const expected: DocsDrawingReview = reviewDocumentationSource(input)
function png(pixels: number[]) {
  const chunk = (type: string, data: Uint8Array) => { const b = Buffer.alloc(data.length + 12); b.writeUInt32BE(data.length); b.write(type, 4); b.set(data, 8); b.writeUInt32BE(crc32(b.subarray(4, -4)), b.length - 4); return b }
  const header = Buffer.alloc(13); header.writeUInt32BE(2); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0, ...pixels]))), chunk('IEND', Buffer.alloc(0))])
}
const nonblank = png([0, 0, 0, 255, 255, 255, 255, 255])
const review: DocsPngReview = { id: input.id, sourceSha256: sourceHash(input.source), pngSha256: createHash('sha256').update(nonblank).digest('hex'), expectationsSha256: docsExpectationsHash(expected), status: 'correct', reviewedBy: 'unit-test trust-record fixture', review: 'Admission fixture, not a claim that two pixels draw this source' }

test('PNG decode/nonblank and a reviewed SVG cannot supply PNG content credit', () => {
  expect(assessDocsPng(input, expected, nonblank, []).status).toBe('unknown')
  expect(assessDocsPng(input, null, nonblank, [review]).status).toBe('unknown')
  expect(assessDocsPng(input, expected, undefined, [review]).status).toBe('unknown')
  expect(assessDocsPng(input, expected, png([255, 255, 255, 255, 255, 255, 255, 255]), []).status).toBe('incorrect')
  expect(assessDocsPng(input, { ...expected, intent: 'configuration-only' }, png([255, 255, 255, 255, 255, 255, 255, 255]), []).status).toBe('not-applicable')
})

test('image content reviews bind actual PNG, exact source and all declared expectations', () => {
  expect(admitPngReviews([input], [expected], [review])).toHaveLength(1)
  expect(assessDocsPng(input, expected, nonblank, [review]).status).toBe('correct')
  expect(assessDocsPng(input, expected, png([255, 255, 255, 255, 0, 0, 0, 255]), [review]).status).toBe('unknown')
  for (const changed of [{ ...review, expectationsSha256: '0'.repeat(64) }, { ...review, sourceSha256: '0'.repeat(64) }, { ...review, reviewedBy: '' }]) expect(() => admitPngReviews([input], [expected], [changed])).toThrow('stale')
  expect(() => admitPngReviews([input], [expected], [review, review])).toThrow('duplicate')
})

test('PNG-only artifacts are applicable to DaveBench without any SVG binding or browser', () => {
  const node = { id: 'fixture/png', roles: ['renderer'], outputs: ['png'], benchmark: { adapter: 'fixture-native', outputs: ['png'] } }
  expect(projectSupport(node).suites.docs.state).toBe('conditional')
  expect(projectSupport(node).suites.fidelity.state).toBe('project-unsupported')
  expect(docsPngTransport({ node, artifact: { kind: 'jsonl-worker', executable: '/frozen/fixture', version: '1' } })).toBe('native')
  expect(docsPngTransport({ node, artifact: { kind: 'cli', executable: '/frozen/fixture', version: '1' } })).toBe('cli')
  expect(parseOptions(['--docs-formats', 'png']).docsFormats).toEqual(['png'])
  expect(() => parseOptions(['--docs-formats', 'png,png'])).toThrow('unique')
  expect(() => parseOptions(['--docs-formats', 'jpeg'])).toThrow('unique')
})

test('an initializer that never resolves is bounded and its page is closed', async () => {
  let closed = false
  const page = { evaluate: () => new Promise(() => {}), close: async () => { closed = true } }
  await expect(callDocsPage(page as any, async () => {}, {}, 10)).rejects.toThrow('host deadline')
  expect(closed).toBe(true)
})


test('PNG full-content credit requires validated complete source metadata, including direct assessment', () => {
  const { sourceReview: _metadata, ...legacy } = expected
  const legacyImage = { ...review, expectationsSha256: docsExpectationsHash(legacy) }
  expect(admitPngReviews([input], [legacy], [legacyImage])).toHaveLength(1)
  expect(assessDocsPng(input, legacy, nonblank, [legacyImage]).status).toBe('unknown')
  for (const metadata of [
    { ...expected.sourceReview!, protocol: 'unreviewed-source-protocol' },
    { ...expected.sourceReview!, sourcePin: '0'.repeat(40) },
    { ...expected.sourceReview!, requiredObligations: ['visible-labels'] },
    { ...expected.sourceReview!, unresolved: ['Unsettled source fact'] },
  ]) {
    const malformed = { ...expected, sourceReview: metadata } as DocsDrawingReview
    const image = { ...review, expectationsSha256: docsExpectationsHash(malformed) }
    expect(() => admitPngReviews([input], [malformed], [image])).toThrow('source contract')
    expect(() => assessDocsPng(input, malformed, nonblank, [image])).toThrow('source contract')
  }
})


test('unsettled source intent cannot become a nonblank-image failure', () => {
  const partialInput = { id: 'ambiguous', family: 'pie', source: 'pie\n"Known": 1\nUnsettled source construct' }, partial = reviewDocumentationSource(partialInput)
  const blank = png([255, 255, 255, 255, 255, 255, 255, 255])
  expect(partial.sourceReview.expectedFactsComplete).toBe(false)
  expect(assessDocsPng(partialInput, partial, blank, []).status).toBe('unknown')
  const { sourceReview: _metadata, ...legacy } = expected
  expect(assessDocsPng(input, legacy, blank, []).status).toBe('unknown')
})
