import { expect, test } from 'bun:test'
import { crc32, deflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { assessDocsPng, admitPngReviews, docsExpectationsHash, type DocsPngReview } from '../unified/docs-png-drawings.ts'
import { sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { docsPngTransport } from '../unified/docs-png-lane.ts'
import { parseOptions } from '../unified/options.ts'
import { projectSupport } from '../unified/support.ts'
import { callDocsPage } from '../unified/docs-benchmark.ts'

const input = { id: 'source', family: 'flowchart', source: 'flowchart LR\nA-->B' }
const expected: DocsDrawingReview = { ...input, sourceSha256: sourceHash(input.source), intent: 'drawing', expected: { labels: ['A', 'B'], nodes: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], edges: [{ source: 'A', target: 'B', directed: true }] }, review: 'Independently declared A-to-B graph' }
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
