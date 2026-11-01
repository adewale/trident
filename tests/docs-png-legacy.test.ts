import { afterAll, expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { CollectionCheckpoint } from '../portable/checkpoint.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { retainedLegacyNativePngContext, requireLegacyNativePngOwnership } from '../unified/docs-png-legacy.ts'

const directories: string[] = []
afterAll(() => directories.forEach(directory => rmSync(directory, { recursive: true, force: true })))
const write = (path: string, value: unknown) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(value)) }
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'trident-legacy-png-')); directories.push(root)
  const pngRoot = join(root, 'docs/png'), rawRoot = join(pngRoot, 'community-raw'), source = { id: 'synthetic/native-only', family: 'flowchart', source: 'flowchart LR\nA[Alpha]-->B[Beta]' }
  const png = Buffer.from('The ownership layer does not interpret image content'), imageSha256 = evidenceBytesDigest(png)
  const worker = readFileSync(join(import.meta.dir, 'fixtures/native-png-legacy-worker.mjs')), workerSha256 = evidenceBytesDigest(worker)
  const executable = '/old/native/native_bench', executableBytes = Buffer.from('frozen native executable'), library = '/old/native/lib/libapp.so', libraryBytes = Buffer.from('frozen native library')
  const declared = { schema: 'trident-native-png-launch-v1', executable, version: '0.3.2', entrypoint: 'mermaid_flutter.renderToPng', pixelRatio: 1, startupExcludedFromApiClocks: true }
  const launchBytes = Buffer.from(JSON.stringify(declared)), launchPath = '/old/launch.json'
  const artifact = { kind: 'jsonl-worker', version: '0.3.2', sha256: workerSha256, files: [{ path: '/old/community-worker.mjs', sha256: workerSha256 }, { path: launchPath, sha256: evidenceBytesDigest(launchBytes) }, { path: executable, sha256: evidenceBytesDigest(executableBytes) }, { path: library, sha256: evidenceBytesDigest(libraryBytes) }] }
  const inventory = Buffer.from(JSON.stringify({ docs: { cases: [source] } })), files: Record<string, { path: string; sha256: string }> = {}
  for (const [key, bytes] of [['inventories', inventory], ...[worker, launchBytes, executableBytes, libraryBytes].map(bytes => ['artifact:' + evidenceBytesDigest(bytes), bytes])] as [string, Buffer][]) {
    const sha256 = evidenceBytesDigest(bytes), path = 'preparation/blobs/' + sha256
    mkdirSync(join(root, 'preparation/blobs'), { recursive: true }); writeFileSync(join(root, path), bytes); files[key] = { path, sha256 }
  }
  write(join(root, 'preparation.json'), { schema: 'trident-campaign-preparation-v1', files, artifacts: [{ project: 'pub:mermaid_flutter', identity: { artifact } }] })
  write(join(pngRoot, 'context.json'), { artifacts: [{ node: { id: 'pub:mermaid_flutter' }, artifact }] })
  const stem = 'pub_mermaid_flutter-png-r1-features-a1', jobFile = join(rawRoot, stem + '.job.json'), resultFile = join(rawRoot, stem + '.jsonl'), nativeDirectory = resultFile + '.native'
  write(jobFile, { output: 'png', coverageOnly: true, timing: { warmCalls: 1, warmupMs: 0, minSampleMs: 0 }, workloads: [{ id: source.id, source: source.source }] })
  mkdirSync(nativeDirectory, { recursive: true })
  const image = join(nativeDirectory, 'case-0.png'), first = image + '.first.png'
  writeFileSync(image, png); writeFileSync(first, png)
  const row = { workload: source.id, sequence: 0, release: true, status: 'ok', pngReturned: true, png: image, firstPng: first, outputBytes: png.length, firstOutputBytes: png.length, samplesMs: [], sampleIterations: [], timingProtocol: 'native-png-api-one-call-qualification-v1' }
  writeFileSync(resultFile, JSON.stringify(row) + '\n'); writeFileSync(join(nativeDirectory, 'raw.jsonl'), JSON.stringify(row) + '\n')
  write(join(nativeDirectory, 'launch.json'), { launchManifest: launchPath, executable, version: declared.version, entrypoint: declared.entrypoint, sha256: evidenceBytesDigest(executableBytes), libappSha256: evidenceBytesDigest(libraryBytes) })
  write(join(nativeDirectory, 'runtime.json'), { runtime: 'native Linux Flutter', packageVersion: declared.version, entrypoint: declared.entrypoint, release: true, pixelRatio: 1, startupExcludedFromApiClocks: true })
  write(join(pngRoot, 'transport-pub%3Amermaid_flutter-r1.json'), [{ caseId: source.id, status: 'passed', metrics: { implementation: 'pub:mermaid_flutter', round: 1, workerAttempt: 1, outputFile: image } }])
  new CollectionCheckpoint(pngRoot, { original: 'legacy fixture' }).record(JSON.stringify(['pub:mermaid_flutter', 1]), [{ caseId: source.id, operation: 'render', format: 'png', status: 'passed', metrics: { project: 'pub:mermaid_flutter', round: 1, version: '0.3.2', transport: 'native', witness: 'drawings/' + imageSha256 + '.png', bytes: png.length } }])
  const context = () => retainedLegacyNativePngContext(root, pngRoot, path => path)
  const assess = () => requireLegacyNativePngOwnership({ context: context(), project: 'pub:mermaid_flutter', source, round: 1, actualPng: png })
  return { root, pngRoot, source, png, image, first, nativeDirectory, jobFile, resultFile, context, assess }
}

test('native PNG-only source ownership uses retained original job and per-source returns without SVG or new clocks', () => {
  const f = fixture(), result = f.assess()
  expect(result).toMatchObject({ schema: 'trident-legacy-source-owned-png-v1', project: 'pub:mermaid_flutter', caseId: f.source.id, sourceSha256: evidenceBytesDigest(f.source.source), pngSha256: evidenceBytesDigest(f.png), timingQualified: false })
  expect(result).not.toHaveProperty('attemptId')
  expect(result).not.toHaveProperty('durationMs')
  expect(result).not.toHaveProperty('originalSvgSha256')
})
test('different literal source, peer, round or PNG cannot borrow legacy native receipts', () => {
  const f = fixture(), own = { context: f.context(), project: 'pub:mermaid_flutter', source: f.source, round: 1, actualPng: f.png }
  expect(() => requireLegacyNativePngOwnership({ ...own, source: { ...f.source, source: 'flowchart LR\nB-->A' } })).toThrow('sealed original input')
  expect(() => requireLegacyNativePngOwnership({ ...own, project: 'mermaid-js/mermaid' })).toThrow('No legacy')
  expect(() => requireLegacyNativePngOwnership({ ...own, round: 2 })).toThrow('per-source return')
  expect(() => requireLegacyNativePngOwnership({ ...own, actualPng: Buffer.from('different PNG') })).toThrow('original project/source')
})
test('changed job, dropped native return, duplicate result or substituted runtime withholds ownership', () => {
  const changed = fixture(), job = JSON.parse(readFileSync(changed.jobFile, 'utf8')); job.workloads[0].source += '\nB-->C'; write(changed.jobFile, job)
  expect(changed.assess).toThrow('literal source/order')
  const dropped = fixture(); writeFileSync(join(dropped.nativeDirectory, 'raw.jsonl'), '')
  expect(dropped.assess).toThrow('incomplete')
  const duplicate = fixture(); writeFileSync(duplicate.resultFile, readFileSync(duplicate.resultFile, 'utf8').repeat(2))
  expect(duplicate.assess).toThrow('incomplete')
  const runtime = fixture(); write(join(runtime.nativeDirectory, 'runtime.json'), { runtime: 'native Linux Flutter', release: true, packageVersion: '0.4.0' })
  expect(runtime.assess).toThrow('launch/runtime')
})
test('missing first pixels, changed sealed worker and escaping retained image cannot certify a reviewed PNG', () => {
  const first = fixture(); writeFileSync(first.first, 'different first return')
  expect(first.assess).toThrow('actual reviewed PNG')
  const changed = fixture(), prep = JSON.parse(readFileSync(join(changed.root, 'preparation.json'), 'utf8')), receipt = prep.files['artifact:b252543c4af59af3cb71c39d6a231c0dd0b1e7b7a582e8446179717c59037780']; writeFileSync(join(changed.root, receipt.path), 'changed sealed wrapper')
  expect(changed.assess).toThrow('Frozen preparation component changed')
  const escaping = fixture(), other = fixture(); rmSync(escaping.image); symlinkSync(other.image, escaping.image)
  expect(escaping.assess).toThrow('escapes')
})
