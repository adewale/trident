import { test, expect, setDefaultTimeout } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { once } from 'node:events'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { gunzipSync } from 'node:zlib'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { constructEvidenceVerdict } from '../portable/evidence-contract.ts'
import { observeTimingPng, pngTimingContract } from '../unified/timing-png.ts'
import type { DocsInput, DocsDrawingReview } from '../unified/docs-drawings.ts'
import { bindPngReviewPixels, type DocsPngReview } from '../unified/docs-png-drawings.ts'
import { forkOwnedTimingProcess } from '../portable/qualified-timing-collection.ts'

setDefaultTimeout(30_000)

const root = new URL('./fixtures/png-timing/', import.meta.url)
const fixtures = JSON.parse(readFileSync(new URL('provenance.json', root), 'utf8')) as { index: number; project: string; source: string; reviewedSourceContract: DocsDrawingReview; review: DocsPngReview; png: string }[]
const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as DocsInput[]
const observer = 'a'.repeat(64)
const receipt = (source: string, bytes: Uint8Array) => ({ calls: 1, sourceSha256: evidenceBytesDigest(source), outputSha256: evidenceBytesDigest(bytes), outputBytes: bytes.length, cleanup: { status: 'passed' } })
test('six independently reviewed PNG prerequisites qualify only their complete source/image identities', () => {
  for (const item of fixtures) {
    const input = inventory.find(input => input.id === item.review.id)!, bytes = readFileSync(new URL(item.png, root))
    const bound = bindPngReviewPixels(input, item.reviewedSourceContract, item.review, bytes)
    const checked = observeTimingPng(input, item.reviewedSourceContract, bytes, [bound], observer, receipt(input.source, bytes))
    expect(constructEvidenceVerdict(pngTimingContract(input, item.reviewedSourceContract), checked).status).toBe('correct')
  }
})
test('decode, a borrowed image and a missing actual public-return receipt cannot earn PNG timing credit', () => {
  const item = fixtures.find(item => item.index === 212 && item.project === 'mermaid-js/mermaid')!, input = inventory.find(input => input.id === item.review.id)!, bytes = readFileSync(new URL(item.png, root))
  const bound = bindPngReviewPixels(input, item.reviewedSourceContract, item.review, bytes), contract = pngTimingContract(input, item.reviewedSourceContract)
  const grade = (bytes: Uint8Array, publicReturn?: any, review = bound) => constructEvidenceVerdict(contract, observeTimingPng(input, item.reviewedSourceContract, bytes, [review], observer, publicReturn))
  expect(grade(bytes).status).toBe('unknown')
  expect(grade(bytes, { ...receipt(input.source, bytes), calls: 2 }).status).toBe('unknown')
  expect(grade(bytes, { ...receipt(input.source, bytes), cleanup: null }).status).toBe('unknown')
  expect(grade(bytes, { ...receipt(input.source, bytes), sourceSha256: 'b'.repeat(64) }).status).toBe('unknown')
  const dotted = fixtures.find(item => item.index === 218 && item.project === 'mermaid-js/mermaid')!, other = readFileSync(new URL(dotted.png, root))
  expect(grade(other, receipt(input.source, other)).status).toBe('unknown')
  expect(grade(Buffer.from('not PNG'), receipt(input.source, Buffer.from('not PNG'))).status).toBe('incorrect')
  expect(grade(bytes, receipt(input.source, bytes), { ...bound, status: 'incorrect', review: 'Independently rejected image control' }).status).toBe('incorrect')
})
test('actual owned fork transports complete PNG bytes and rejects a second source call', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-png-ipc-')), module = join(directory, 'worker.mjs'), bytes = readFileSync(new URL(fixtures[0]!.png, root))
  writeFileSync(module, `import {serveQualifiedTimingProcess} from ${JSON.stringify(new URL('../portable/qualified-timing-collection.ts', import.meta.url).href)};serveQualifiedTimingProcess(()=>Buffer.from(${JSON.stringify(bytes.toString('base64'))},'base64'));`)
  const handle = forkOwnedTimingProcess(module, [], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] })
  try {
    expect((await once(handle, 'message'))[0].schema).toBe('trident-qualified-timing-ready-v1')
    const first = once(handle, 'message'); handle.send!({ schema: 'trident-qualified-timing-call-v1', attemptId: 'first', source: 'literal source' })
    const [returned] = await first
    expect(returned.output).toBeInstanceOf(Uint8Array)
    expect(evidenceBytesDigest(returned.output)).toBe(evidenceBytesDigest(bytes))
    const second = once(handle, 'message'); handle.send!({ schema: 'trident-qualified-timing-call-v1', attemptId: 'second', source: 'literal source' })
    expect((await second)[0].schema).toBe('trident-qualified-timing-error-v1')
  } finally { const stopped = once(handle, 'exit'); handle.kill('SIGTERM'); await stopped; rmSync(directory, { recursive: true, force: true }) }
})
