import { expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { CollectionCheckpoint, readCheckpointEntries, readCheckpointValue } from '../portable/checkpoint.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'

test('readonly checkpoint readers admit all attempts and preserve files; keyed reads retain exact values', () => {
  const dir = mkdtempSync(join(tmpdir(), 'checkpoint-reader-')), identity = { schema: 'control' }
  try {
    const checkpoint = new CollectionCheckpoint(dir, identity); checkpoint.record('first', { status: 'failed' }); checkpoint.record('second', { status: 'passed' })
    const before = readFileSync(join(dir, 'checkpoint.json'))
    expect(readCheckpointEntries(dir, identity)).toHaveLength(2)
    expect(readCheckpointValue<{ status: string }>(dir, 'first', identity)).toEqual({ status: 'failed' })
    expect(readCheckpointValue(dir, 'missing', identity)).toBeUndefined()
    expect(() => readCheckpointEntries(dir, { schema: 'other' })).toThrow('identity')
    expect(readFileSync(join(dir, 'checkpoint.json'))).toEqual(before)
    const file = join(dir, 'checkpoint-units', evidenceBytesDigest('first') + '.json.gz')
    writeFileSync(file, gzipSync(JSON.stringify({ key: 'first', value: { status: 'passed' }, sha256: '0'.repeat(64) })))
    expect(() => readCheckpointValue(dir, 'first')).toThrow('hash')
    expect(() => readCheckpointEntries(dir)).toThrow('hash')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
test('legacy gzip units, duplicate keys and missing headers are handled without creating evidence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'checkpoint-reader-'))
  try {
    expect(() => readCheckpointEntries(dir)).toThrow('header')
    expect(readdirSync(dir)).toEqual([])
    const value = { status: 'failed' }, row = { key: 'attempt', value, sha256: evidenceBytesDigest(JSON.stringify(value)) }
    writeFileSync(join(dir, 'checkpoint.json'), JSON.stringify({ schema: 'collection-checkpoint-v1', identitySha256: '1'.repeat(64), startedAt: new Date().toISOString() }))
    writeFileSync(join(dir, 'checkpoint.jsonl.gz'), gzipSync(JSON.stringify(row) + '\n'))
    expect(readCheckpointEntries(dir)).toEqual([['attempt', value]])
    writeFileSync(join(dir, 'checkpoint.jsonl.gz'), gzipSync(JSON.stringify(row) + '\n' + JSON.stringify(row) + '\n'))
    expect(() => readCheckpointValue(dir, 'attempt')).toThrow('duplicated')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
