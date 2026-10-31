import { afterAll, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CollectionCheckpoint } from '../portable/checkpoint.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { externalPngInvocation, recoverRetainedNativePngOwnership } from '../unified/docs-png-transport-ownership.ts'

const directories: string[] = []
afterAll(() => directories.forEach(root => rmSync(root, { recursive: true, force: true })))
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'trident-native-png-recovery-')); directories.push(root)
  const project = 'synthetic/native-png', source = { id: 'synthetic/recovery-source', family: 'flowchart', source: 'flowchart LR\nA[Alpha]-->B[Beta]' }, actualPng = Buffer.from('ownership control bytes; no content grade')
  const artifact = { kind: 'jsonl-worker', executable: '/frozen/worker.mjs', args: ['/frozen/launch.json'], sha256: 'a'.repeat(64), files: [{ path: '/frozen/worker.mjs', sha256: 'a'.repeat(64) }] }
  writeFileSync(join(root, 'context.json'), JSON.stringify({ artifacts: [{ node: { id: project }, artifact }] }))
  const journal = new InvocationJournal(join(root, 'native-invocations')), started = journal.start({ project, caseId: source.id, sourceSha256: evidenceBytesDigest(source.source), artifactSha256: artifact.sha256, bindingSha256: evidenceDigest({ output: 'png', kind: artifact.kind, args: artifact.args, worker: artifact.sha256 }), format: 'png' }), returned = journal.returned(started, actualPng, null)
  const raw = new CollectionCheckpoint(root, { schema: 'original-control-collection' }); raw.record(JSON.stringify(['raw-png', project, 1, source.id]), { status: 'passed', bytesBase64: actualPng.toString('base64'), measuredAt: null })
  const file = join(root, 'transport-' + encodeURIComponent(project) + '-r1.json'), row = { caseId: source.id, format: 'png', operation: 'render', status: 'passed', metrics: { implementation: project, round: 1, invocationId: started.attemptId, invocationDirectory: journal.directory, outputFile: returned.output!.path } }
  writeFileSync(file, JSON.stringify([row]))
  const request = { root, project, source, round: 1, actualPng }
  return { root, project, source, actualPng, file, row, request, raw, started, journal, assess: () => recoverRetainedNativePngOwnership(request) }
}

test('external PNG metric names preserve actual native journal coordinates and reject conflicting aliases', () => {
  expect(externalPngInvocation({ invocationId: 'actual', invocationDirectory: '/actual' })).toEqual({ invocationId: 'actual', invocationDirectory: '/actual' })
  expect(externalPngInvocation({ rawInvocationId: 'actual', rawInvocationDirectory: '/actual' })).toEqual({ invocationId: 'actual', invocationDirectory: '/actual' })
  expect(() => externalPngInvocation({ rawInvocationId: 'a', invocationId: 'b' })).toThrow('conflicting')
  expect(() => externalPngInvocation({ rawInvocationDirectory: '/a', invocationDirectory: '/b' })).toThrow('conflicting')
})
test('recovery binds the already retained public native call without rewriting its original raw PNG or adding a clock', () => {
  const f = fixture(), before = readFileSync(join(f.root, 'checkpoint-units', evidenceBytesDigest(JSON.stringify(['raw-png', f.project, 1, f.source.id])) + '.json.gz')), result = f.assess()
  expect(result).toMatchObject({ schema: 'trident-recovered-native-png-invocation-v1', attemptId: f.started.attemptId, sourceSha256: evidenceBytesDigest(f.source.source), pngSha256: evidenceBytesDigest(f.actualPng), timingQualified: false })
  expect(result).not.toHaveProperty('durationMs')
  expect(readFileSync(join(f.root, 'checkpoint-units', evidenceBytesDigest(JSON.stringify(['raw-png', f.project, 1, f.source.id])) + '.json.gz'))).toEqual(before)
})
test('another source, image, round or duplicate transport row cannot borrow a native recovery', () => {
  const f = fixture()
  expect(() => recoverRetainedNativePngOwnership({ ...f.request, source: { ...f.source, source: 'flowchart LR\nB-->A' } })).toThrow('literal source')
  expect(() => recoverRetainedNativePngOwnership({ ...f.request, actualPng: Buffer.from('different pixels') })).toThrow('matching immutable raw')
  expect(() => recoverRetainedNativePngOwnership({ ...f.request, round: 2 })).toThrow('matching immutable raw')
  writeFileSync(f.file, JSON.stringify([f.row, f.row])); expect(f.assess).toThrow('unique successful')
})
test('missing durable output and altered artifact or journal path prevent recovery', () => {
  const output = fixture(); rmSync(output.row.metrics.outputFile); expect(output.assess).toThrow()
  const changed = fixture(), context = JSON.parse(readFileSync(join(changed.root, 'context.json'), 'utf8')); context.artifacts[0].artifact.args = ['/other/launch.json']; writeFileSync(join(changed.root, 'context.json'), JSON.stringify(context)); expect(changed.assess).toThrow('literal source, artifact')
  const escaping = fixture(), other = fixture(); escaping.row.metrics.invocationDirectory = other.journal.directory; writeFileSync(escaping.file, JSON.stringify([escaping.row])); expect(escaping.assess).toThrow('escapes')
})
