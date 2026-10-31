import { expect, test } from 'bun:test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { recoverExternalInvocations } from '../unified/external-invocations.ts'
import { runExternalCommunity } from '../unified/community-external.ts'
import { parseOptions } from '../unified/options.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('external-raw-'), identity = { project: 'fixture/python', caseId: 'case', sourceSha256: evidenceBytesDigest('graph LR; A-->B'), artifactSha256: evidenceBytesDigest('fixture artifact'), bindingSha256: evidenceBytesDigest('fixture binding'), format: 'terminal' }

test('Python crash after return preserves exact bytes, real API clock and stable attempt without retry', async () => {
  const root = temp.dir(), modules = join(root, 'modules'), count = join(root, 'calls')
  mkdirSync(modules)
  writeFileSync(join(modules, 'termaid.py'), `import os\nclass Output(str):\n def strip(self):os._exit(71)\ndef render(source):\n with open(${JSON.stringify(count)},'a') as file:file.write('call\\n')\n return Output('A ---> B')\n`)
  const previous = process.env.PYTHONPATH
  process.env.PYTHONPATH = modules
  try {
    const prepared = { node: { id: 'fixture/python', roles: ['renderer'], outputs: ['terminal'] }, artifact: { kind: 'python' as const, python: 'python3', version: 'fixture' } },
      workloads = [{ id: 'case', family: 'flowchart', source: 'graph LR; A-->B', features: [], provenance: 'Synthetic crash control' }],
      options = parseOptions(['--out', join(root, 'run'), '--profile', 'smoke'])
    const first = await runExternalCommunity(prepared, workloads, 'terminal', 1, options)
    expect(first[0]!.status).toBe('blocked')
    expect(first[0]!.metrics!.measuredAt).toBeString()
    expect(first[0]!.metrics!.firstMs).toBeNumber()
    expect(readFileSync(first[0]!.metrics!.outputFile as string, 'utf8')).toBe('A ---> B')
    const again = await runExternalCommunity(prepared, workloads, 'terminal', 1, options)
    expect(again[0]!.metrics!.invocationId).toBe(first[0]!.metrics!.invocationId)
    expect(readFileSync(count, 'utf8')).toBe('call\n')
  } finally { if (previous === undefined) delete process.env.PYTHONPATH; else process.env.PYTHONPATH = previous }
})

test('native raw receipt survives bridge loss; timestamps are not manufactured', () => {
  const root = temp.dir(), result = join(root, 'worker.jsonl'), native = result + '.native', png = join(root, 'returned.png'), bytes = Buffer.from('synthetic exact PNG bytes')
  mkdirSync(native); writeFileSync(png, bytes)
  writeFileSync(join(native, 'public-invocations.jsonl'), JSON.stringify({ schema: 'trident-invocation-evidence-v1', attemptId: 'native-return', identity, state: 'returned', startedAt: null, finishedAt: null, recordedAt: '2026-10-31T00:00:00Z', durationMs: 3, output: null, outputPath: png, outputBytes: bytes.length, detail: 'Durable native receipt' }) + '\n{"torn":')
  const journal = new InvocationJournal(join(root, 'journal')), frames = recoverExternalInvocations(result, new Map([['case', identity]]), journal)
  expect(frames[0]).toMatchObject({ state: 'returned', startedAt: null, finishedAt: null, durationMs: 3 })
  expect(journal.outcome('native-return')!.output!.sha256).toBe(evidenceBytesDigest(bytes))
  writeFileSync(png, 'changed bytes')
  expect(() => recoverExternalInvocations(result, new Map([['case', identity]]), journal)).toThrow('bytes differ')
})

test('a complete stale external frame is rejected instead of silently dropped', () => {
  const root = temp.dir(), result = join(root, 'worker.jsonl')
  writeFileSync(result + '.invocations.jsonl', JSON.stringify({ schema: 'trident-invocation-evidence-v1', attemptId: 'stale', identity: { ...identity, sourceSha256: evidenceBytesDigest('old source') }, state: 'public-error', startedAt: null, finishedAt: null, durationMs: null, output: null, detail: 'old error' }) + '\n')
  expect(() => recoverExternalInvocations(result, new Map([['case', identity]]), new InvocationJournal(join(root, 'journal')))).toThrow('stale')
})
