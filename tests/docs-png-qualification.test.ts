import { afterAll, expect, setDefaultTimeout, test } from 'bun:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { Resvg } from '@resvg/resvg-js'
import { CollectionCheckpoint } from '../portable/checkpoint.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceDigest, evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { docsExpectationsHash, assessDocsPng, type DocsPngReview } from '../unified/docs-png-drawings.ts'
import { qualifyCollectedDocsPng } from '../unified/docs-benchmark.ts'
import { readDocsPngRasterProfile, readRetainedPngSvg, requireRetainedPngOwnership, retainPngReference } from '../unified/docs-png-qualification.ts'
import type { FrozenRasterProfile } from '../unified/png-preservation.ts'
import type { UnifiedRunOptions, UnifiedSuiteResult } from '../unified/types.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(20_000)
const directories: string[] = []
afterAll(() => { for (const dir of directories) rmSync(dir, { recursive: true, force: true }) })
const input = { id: 'synthetic:complete-flow', family: 'flowchart', source: 'flowchart LR\nA[Alpha]-->B[Beta]' }
const expected = { id: input.id, sourceSha256: sourceHash(input.source), family: 'flowchart', intent: 'drawing', expected: { labels: ['Alpha', 'Beta'], nodes: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }], edges: [{ source: 'A', target: 'B', directed: true }], facts: { direction: 'LR' } }, review: 'Independent synthetic source control: visible Alpha and Beta boxes, directed left-to-right arrow; not a benchmark score.', sourceReview: { protocol: 'literal-documentation-facts-v1', sourcePin: '1fb7869866dd619168d840291c9c54b4f129758b', method: 'Full literal synthetic source facts', expectedFactsComplete: true, requiredObligations: ['visible-labels', 'node-identities-and-labels', 'relationship-endpoints-directions-labels', 'fact:direction'], unresolved: [], excludedNonvisual: [] } } as DocsDrawingReview
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect width="240" height="80" fill="white"/><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z"/></marker></defs><g><rect x="10" y="10" width="60" height="30" fill="white" stroke="black"/><text x="14" y="30">Alpha</text></g><g><rect x="150" y="10" width="60" height="30" fill="white" stroke="black"/><text x="154" y="30">Beta</text></g><path d="M70 25 L150 25" fill="none" stroke="black" marker-end="url(#arrow)"/></svg>'
const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
const profile: FrozenRasterProfile = { schema: 'trident-raster-profile-v1', background: '#ffffff', defaultFontFamily: 'DejaVu Sans', fontFiles: [{ path: font, sha256: evidenceBytesDigest(readFileSync(font)) }] }
const reference = new Resvg(svg, { background: '#ffffff', fitTo: { mode: 'original' }, font: { loadSystemFonts: false, fontFiles: [font], defaultFontFamily: profile.defaultFontFamily }, dpi: 96 }).render().asPng()
const imageReview: DocsPngReview = { id: input.id, sourceSha256: sourceHash(input.source), expectationsSha256: docsExpectationsHash(expected), pngSha256: evidenceBytesDigest(reference), status: 'correct', reviewedBy: 'Synthetic independent trust control', review: 'Complete control: Alpha and Beta labels in distinct boxes with an actual left-to-right arrow. This source-grounded control is not a general image oracle or benchmark score.' }
const reencode = (png: Uint8Array) => {
  const payload = Buffer.from('Comment\0encoding annotation'), data = Buffer.concat([Buffer.from('tEXt'), payload]), chunk = Buffer.alloc(data.length + 8)
  let crc = 0xffffffff
  for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0) }
  chunk.writeUInt32BE(payload.length); data.copy(chunk, 4); chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, chunk.length - 4)
  return Buffer.concat([png.slice(0, -12), chunk, png.slice(-12)])
}
function fixture(rasterized = svg) {
  const out = mkdtempSync(join(tmpdir(), 'trident-png-proof-')); directories.push(out)
  mkdirSync(join(out, 'drawings')); mkdirSync(join(out, 'originalSvg')); mkdirSync(join(out, 'rasterizedSvg'))
  const actualPng = reencode(reference), witness = 'drawings/' + evidenceBytesDigest(actualPng) + '.png', originalSvgWitness = 'originalSvg/' + evidenceBytesDigest(svg) + '.svg.gz', rasterizedSvgWitness = 'rasterizedSvg/' + evidenceBytesDigest(rasterized) + '.svg.gz'
  writeFileSync(join(out, witness), actualPng); writeFileSync(join(out, originalSvgWitness), gzipSync(svg)); writeFileSync(join(out, rasterizedSvgWitness), gzipSync(rasterized))
  const engine = { artifactSha256: 'c'.repeat(64), kind: 'synthetic-control' }, identity = { project: 'synthetic/control', caseId: input.id, sourceSha256: sourceHash(input.source), artifactSha256: engine.artifactSha256, bindingSha256: evidenceDigest({ format: 'png', transport: 'svg-conversion', engine, round: 1 }), format: 'png' }
  writeFileSync(join(out, 'context.json'), JSON.stringify({ preparedBrowsers: [{ node: { id: identity.project }, browser: engine }] }))
  const journal = new InvocationJournal(join(out, 'invocations')), started = journal.start(identity)
  journal.returned(started, actualPng, 1)
  const raw = new CollectionCheckpoint(out, { schema: 'synthetic-owned-png', sourceSha256: identity.sourceSha256 })
  raw.record(JSON.stringify(['raw-png', identity.project, 1, input.id]), { status: 'passed', invocationId: started.attemptId, bytesBase64: actualPng.toString('base64'), originalSvg: svg, rasterizedSvg: rasterized })
  const metrics = { rawInvocationId: started.attemptId, project: 'synthetic/control', round: 1, transport: 'svg-conversion', witness, originalSvgWitness, rasterizedSvgWitness }
  const observations = [{ suite: 'docs', surface: 'browser:png-export', runtime: 'control', family: 'flowchart', caseId: input.id, operation: 'render', format: 'png', mode: 'control', status: 'passed', metrics }, { suite: 'docs', surface: 'png:reviewed-content', runtime: 'control', family: 'flowchart', caseId: input.id, operation: 'drawing-checks', format: 'png', mode: 'control', status: 'blocked', detail: JSON.stringify(assessDocsPng(input, expected, actualPng, [imageReview])), metrics: { ...metrics } }] as UnifiedSuiteResult['observations']
  const result: UnifiedSuiteResult = { id: 'docs', status: 'blocked', startedAt: '', finishedAt: '', observations, artifacts: [], gaps: [] }
  const options: UnifiedRunOptions = { root: resolve(import.meta.dir, '..'), harnessRoot: resolve(import.meta.dir, '..'), out, rounds: 1, profile: 'smoke', executable: chromiumExecutable }
  return { out, actualPng, result, options, inventory: { cases: [input] } as any }
}

test('the collection path builds a real exact-SVG proof, independent raster review and retained reference artifact', async () => {
  const f = fixture()
  expect(assessDocsPng(input, expected, f.actualPng, [imageReview]).status).toBe('unknown')
  const result = await qualifyCollectedDocsPng(f.options, f.result, f.inventory, [expected], [imageReview], { profile, fileSha256: 'a'.repeat(64) })
  const row = result.observations.find(row => row.operation === 'drawing-checks')!, assessment = JSON.parse(row.detail!)
  expect(row.status).toBe('passed')
  expect(assessment.evidence).toMatchObject({ originalSvgSha256: evidenceBytesDigest(svg), rasterizedSvgSha256: evidenceBytesDigest(svg), actualPngSha256: evidenceBytesDigest(f.actualPng), referencePngSha256: evidenceBytesDigest(reference), svgVerdict: { status: 'correct', missingChecks: [] } })
  expect(readFileSync(join(f.out, String(row.metrics!.referencePngWitness)))).toEqual(Buffer.from(reference))
  expect(JSON.parse(readFileSync(join(f.out, 'png-preservation-receipt.json'), 'utf8')).projectRendererInvocations).toBe(0)
})
test('changed rasterized arrow direction cannot borrow original SVG or approved PNG facts', async () => {
  const f = fixture(svg.replace('M70 25 L150 25', 'M150 25 L70 25'))
  const result = await qualifyCollectedDocsPng(f.options, f.result, f.inventory, [expected], [imageReview], { profile, fileSha256: 'a'.repeat(64) })
  expect(result.observations.find(row => row.operation === 'drawing-checks')!.status).toBe('blocked')
  expect(JSON.parse(result.observations[1]!.detail!).reason).toContain('semantic evidence')
})
test('conversion cannot replace independent raster content review, and native PNG never borrows SVG proof', async () => {
  const f = fixture()
  const result = await qualifyCollectedDocsPng(f.options, f.result, f.inventory, [expected], [], { profile, fileSha256: 'a'.repeat(64) })
  expect(result.observations[1]!.status).toBe('blocked')
  expect(JSON.parse(result.observations[1]!.detail!).reason).toContain('PNG content review')
  const native = fixture(); native.result.observations.forEach(row => { row.metrics!.transport = 'native' })
  expect((await qualifyCollectedDocsPng(native.options, native.result, native.inventory, [expected], [imageReview], { profile, fileSha256: 'a'.repeat(64) })).observations[1]!.status).toBe('blocked')
})
test('profile fonts and retained exact SVG hashes cannot be silently substituted', () => {
  const f = fixture(), file = join(f.out, 'profile.json')
  writeFileSync(file, JSON.stringify(profile))
  expect(readDocsPngRasterProfile(file).profile).toEqual(profile)
  writeFileSync(file, JSON.stringify({ ...profile, fontFiles: [{ path: font, sha256: '0'.repeat(64) }] }))
  expect(() => readDocsPngRasterProfile(file)).toThrow('font bytes changed')
  const witness = String(f.result.observations[1]!.metrics!.rasterizedSvgWitness)
  writeFileSync(join(f.out, witness), gzipSync(svg + ' '))
  expect(() => readRetainedPngSvg(f.out, witness)).toThrow('hash differs')
  expect(() => readRetainedPngSvg(f.out, '../outside.svg.gz')).toThrow('escapes')
})


test('derived witness substitutions cannot claim another raw conversion return', async () => {
  const f = fixture(), alternate = svg.replace('fill="white"', 'fill="#ffffff"'), witness = 'rasterizedSvg/' + evidenceBytesDigest(alternate) + '.svg.gz'
  writeFileSync(join(f.out, witness), gzipSync(alternate))
  f.result.observations[1]!.metrics!.rasterizedSvgWitness = witness
  const result = await qualifyCollectedDocsPng(f.options, f.result, f.inventory, [expected], [imageReview], { profile, fileSha256: 'a'.repeat(64) })
  expect(result.observations[1]!.status).toBe('blocked')
  expect(JSON.parse(result.observations[1]!.detail!).reason).toContain('owning raw PNG return')
})


test('native PNG review ownership cannot borrow another project or altered actual image', () => {
  const f = fixture(), row = f.result.observations[1]!
  const owned = { root: f.out, project: 'synthetic/control', round: 1, source: input, actualPng: f.actualPng, attemptId: String(row.metrics!.rawInvocationId) }
  expect(requireRetainedPngOwnership(owned)).toMatchObject({ project: 'synthetic/control', pngSha256: evidenceBytesDigest(f.actualPng) })
  expect(() => requireRetainedPngOwnership({ ...owned, project: 'borrowed/peer' })).toThrow('own project')
  expect(() => requireRetainedPngOwnership({ ...owned, round: 2 })).toThrow('own project')
  expect(() => requireRetainedPngOwnership({ ...owned, actualPng: reference })).toThrow('own project')
  expect(() => requireRetainedPngOwnership({ ...owned, attemptId: 'borrowed-attempt' })).toThrow('own project')
  expect(() => requireRetainedPngOwnership({ ...owned, source: { ...input, source: input.source.replace('-->', '<--') } })).toThrow('literal source')
})


test('retained SVG pointers cannot escape through an owned-looking symlink', () => {
  const f = fixture(), other = fixture(), witness = String(f.result.observations[1]!.metrics!.originalSvgWitness)
  rmSync(join(f.out, witness)); symlinkSync(join(other.out, witness), join(f.out, witness))
  expect(() => readRetainedPngSvg(f.out, witness)).toThrow('symlink escapes')
})


test('saving derived reference PNGs preserves prior bytes and cannot write through a copied symlink', () => {
  const f = fixture(), other = fixture()
  mkdirSync(join(other.out, 'referencePng')); symlinkSync(join(other.out, 'referencePng'), join(f.out, 'referencePng'))
  expect(() => retainPngReference(f.out, reference)).toThrow('escapes')
  expect(() => readFileSync(join(other.out, 'referencePng', evidenceBytesDigest(reference) + '.png'))).toThrow()
  const safe = fixture(), witness = retainPngReference(safe.out, reference)
  writeFileSync(join(safe.out, witness), Buffer.from('changed prior bytes'))
  expect(() => retainPngReference(safe.out, reference)).toThrow('Immutable')
  expect(readFileSync(join(safe.out, witness)).toString()).toBe('changed prior bytes')
})
