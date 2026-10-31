import { afterAll, expect, setDefaultTimeout, test } from 'bun:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { Resvg } from '@resvg/resvg-js'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { sourceHash, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { docsExpectationsHash, assessDocsPng, type DocsPngReview } from '../unified/docs-png-drawings.ts'
import { qualifyCollectedDocsPng } from '../unified/docs-benchmark.ts'
import { readDocsPngRasterProfile, readRetainedPngSvg } from '../unified/docs-png-qualification.ts'
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
  const metrics = { project: 'synthetic/control', round: 1, transport: 'svg-conversion', witness, originalSvgWitness, rasterizedSvgWitness }
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
