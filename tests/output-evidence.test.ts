import { expect, test } from 'bun:test'
import { writeFileSync, cpSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { outputEvidence, verifiedOutputObservations, scopeOutputEvidence } from '../unified/output-evidence.ts'
import type { BenchmarkObservation } from '../unified/types.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('output-return-proof-')
function fixture() {
  const root = temp.dir(), journal = new InvocationJournal(join(root, 'invocations')), source = { id: 'case', source: 'flowchart LR\nA' }, body = '<svg xmlns="http://www.w3.org/2000/svg"/>'
  const frame = journal.start({ project: 'fixture/render', caseId: source.id, sourceSha256: evidenceBytesDigest(source.source), artifactSha256: 'a'.repeat(64), bindingSha256: 'b'.repeat(64), format: 'svg' })
  journal.returned(frame, body, 1); writeFileSync(join(root, 'actual.svg'), body)
  const row: BenchmarkObservation = { suite: 'docs', surface: 'public', runtime: 'fixture', family: 'flowchart', caseId: source.id, operation: 'render', format: 'svg', mode: 'fixture', status: 'failed', metrics: { project: 'fixture/render', round: 1, rawInvocationId: frame.attemptId, publicOutputReturned: false, formatValid: false, returnedBytes: 9999, outputEvidence: outputEvidence(root, journal.directory, frame.attemptId, 'actual.svg') } }
  return { root, journal, source, body, row }
}
test('actual source-bound return bytes override stored summary flags and remain usable after moving', () => {
  const f = fixture(), actual = verifiedOutputObservations(f.root, [f.source], [f.row])[0]!
  expect(actual.metrics).toMatchObject({ publicOutputReturned: true, formatValid: true, returnedBytes: Buffer.byteLength(f.body) })
  const moved = join(temp.dir(), 'moved'); cpSync(f.root, moved, { recursive: true })
  expect(verifiedOutputObservations(moved, [f.source], [f.row])[0]!.metrics).toEqual(actual.metrics)
  const invented = { ...f.row, metrics: { project: 'fixture/render', round: 1, publicOutputReturned: true, formatValid: true, returnedBytes: 9999 } }
  expect(verifiedOutputObservations(f.root, [f.source], [invented])[0]!.metrics).toMatchObject({ publicOutputReturned: null, formatValid: null, returnedBytes: null })
})
test('composite output lanes keep both proof paths relative to the combined capture root', () => {
  const f = fixture(), root = temp.dir(); cpSync(f.root, join(root, 'svg'), { recursive: true })
  const row = { ...f.row, metrics: { ...f.row.metrics, outputEvidence: scopeOutputEvidence(f.row.metrics!.outputEvidence as string, 'svg') } }
  const checked = verifiedOutputObservations(root, [f.source], [row])[0]!
  expect(checked.metrics).toMatchObject({ publicOutputReturned: true, formatValid: true, returnedBytes: Buffer.byteLength(f.body) })
  expect(() => scopeOutputEvidence(JSON.stringify({ schema: 'trident-output-return-v1', journal: '../foreign', witness: 'x.svg' }), 'svg')).toThrow('unowned')
})
test('changed sources, reused calls, altered bytes and foreign symlinks cannot supply measured output', () => {
  const f = fixture()
  expect(() => verifiedOutputObservations(f.root, [{ ...f.source, source: 'different source' }], [f.row])).toThrow('literal source')
  expect(() => verifiedOutputObservations(f.root, [f.source], [f.row, f.row])).toThrow('several planned')
  writeFileSync(join(f.root, 'actual.svg'), 'tampered')
  expect(() => verifiedOutputObservations(f.root, [f.source], [f.row])).toThrow('bytes differ')
  const other = temp.dir(); writeFileSync(join(other, 'outside.svg'), f.body); symlinkSync(join(other, 'outside.svg'), join(f.root, 'foreign.svg'))
  expect(() => outputEvidence(f.root, f.journal.directory, 'any', 'foreign.svg')).toThrow('escapes')
})
