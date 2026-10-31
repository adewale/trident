import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { CollectionCheckpoint } from '../portable/checkpoint.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('checkpoint-durable-'), digest = (value: string) => createHash('sha256').update(value).digest('hex')

test('raw return survives a grading exception and resumes without calling the renderer again', async () => {
  const directory = temp.dir(), identity = { artifact: 'frozen', corpus: ['one'] }, before = new CollectionCheckpoint(directory, identity)
  before.record('one:raw', { output: '<svg/>', firstMs: null })
  await expect(before.collect('one:graded', async () => { throw Error('Injected grading crash') })).rejects.toThrow('grading crash')
  const recovered = new CollectionCheckpoint(directory, identity)
  expect(recovered.get<any>('one:raw')).toEqual({ output: '<svg/>', firstMs: null })
  expect(recovered.has('one:graded')).toBe(false)
  expect(await recovered.collect<any>('one:raw', async () => { throw Error('Public API must not repeat') })).toEqual({ output: '<svg/>', firstMs: null })
})
test('a torn unpublished unit cannot destroy previously completed units', () => {
  const directory = temp.dir(), checkpoint = new CollectionCheckpoint(directory, { pin: 'a' })
  checkpoint.record('one', { bytes: 'retained' })
  writeFileSync(join(directory, 'checkpoint-units/interrupted.json.gz.pending'), gzipSync('unfinished').subarray(0, 5))
  const resumed = new CollectionCheckpoint(directory, { pin: 'a' })
  expect(resumed.get<any>('one')).toEqual({ bytes: 'retained' })
  expect(() => new CollectionCheckpoint(directory, { pin: 'changed' })).toThrow('identity changed')
})
test('recorded units reject mutation, duplicate overwrite and nonfinite clocks', () => {
  const directory = temp.dir(), checkpoint = new CollectionCheckpoint(directory, { pin: 'a' }), original = { duration: null, bytes: 'same' }
  checkpoint.record('one', original); original.bytes = 'changed'
  expect(checkpoint.get<any>('one')).toEqual({ duration: null, bytes: 'same' })
  expect(() => checkpoint.record('one', original)).toThrow('cannot be overwritten')
  expect(() => checkpoint.record('two', { duration: NaN })).toThrow('finite')
  const value = checkpoint.get<any>('one'); value.bytes = 'also changed'
  expect(checkpoint.get<any>('one').bytes).toBe('same')
})
test('legacy gzip journals remain readable and new units do not rewrite them', () => {
  const directory = temp.dir(), identity = { pin: 'legacy' }, value = { duration: 4 }, row = { key: 'old', value, sha256: digest(JSON.stringify(value)) }
  writeFileSync(join(directory, 'checkpoint.json'), JSON.stringify({ schema: 'collection-checkpoint-v1', identitySha256: digest(JSON.stringify(identity)), startedAt: '2026-01-01T00:00:00Z' }))
  const legacy = gzipSync(JSON.stringify(row) + '\n'); writeFileSync(join(directory, 'checkpoint.jsonl.gz'), legacy)
  const checkpoint = new CollectionCheckpoint(directory, identity); checkpoint.record('new', { duration: null })
  expect(readFileSync(join(directory, 'checkpoint.jsonl.gz'))).toEqual(legacy)
  expect(new CollectionCheckpoint(directory, identity).get<any>('new')).toEqual({ duration: null })
})
test('committed corruption is rejected rather than silently recollected', () => {
  const directory = temp.dir(), checkpoint = new CollectionCheckpoint(directory, { pin: 'a' }); checkpoint.record('one', { value: 'good' })
  const name = readdirSync(join(directory, 'checkpoint-units')).find(name => name.endsWith('.json.gz'))!
  writeFileSync(join(directory, 'checkpoint-units', name), gzipSync(JSON.stringify({ key: 'one', value: { value: 'tampered' }, sha256: digest('wrong') })))
  expect(() => new CollectionCheckpoint(directory, { pin: 'a' })).toThrow('duplicated or changed')
})
