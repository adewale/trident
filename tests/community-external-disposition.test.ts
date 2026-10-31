import { expect, test } from 'bun:test'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runExternalCommunity } from '../unified/community-external.ts'
import type { PreparedCommunity } from '../unified/community-types.ts'
import type { UnifiedRunOptions } from '../unified/types.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { syntheticExternalWorkerSource } from './helpers/synthetic-external-worker.ts'

test('external observer blocks and raster scopes survive collection without label credit', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-external-disposition-'))
  try {
    const executable = join(directory, 'worker.mjs')
    writeFileSync(executable, syntheticExternalWorkerSource({ output: 'png', observerBlockedCase: 'observer-blocked' }))
    chmodSync(executable, 0o755)
    const prepared = { node: { id: 'test/native' }, artifact: { kind: 'jsonl-worker', executable, runtime: 'test native transport', version: 'test' } } as PreparedCommunity
    const workloads = ['painted', 'observer-blocked'].map(id => ({ id, source: 'flowchart LR; A-->B', family: 'flowchart', features: [], expectedLabels: ['A', 'B'], provenance: 'transport regression fixture' }))
    const rows = await runExternalCommunity(prepared, workloads, 'png', 1, { out: directory, communityCoverageOnce: true } as UnifiedRunOptions)
    expect(rows.map(row => row.status)).toEqual(['passed', 'blocked'])
    expect(rows.map(row => row.metrics?.qualification)).toEqual(['decoded-raster-content', 'decoded-raster-content'])
    expect(rows[1]?.detail).toBe('PNG observer budget exceeded')
    for (const row of rows) {
      const outcome = new InvocationJournal(row.metrics!.invocationDirectory as string).outcome(row.metrics!.invocationId as string)!
      expect(outcome.state).toBe('returned')
      expect(outcome.durationMs).toBeGreaterThan(0)
      expect(readFileSync(outcome.output!.path).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    }
    expect(new InvocationJournal(rows[0]!.metrics!.invocationDirectory as string).records().filter(frame => frame.state !== 'started')).toHaveLength(2)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('JSONL interruption retains explicit API failures and blocks an uncertain next case', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-external-interruption-'))
  try {
    const executable = join(directory, 'worker.mjs')
    writeFileSync(executable, syntheticExternalWorkerSource({ output: 'png', rejectedCase: 'api-failed', exitAfterRejection: 7 }))
    chmodSync(executable, 0o755)
    const prepared = { node: { id: 'test/native' }, artifact: { kind: 'jsonl-worker', executable, runtime: 'test transport', version: 'test' } } as PreparedCommunity
    const workloads = ['painted', 'api-failed', 'not-started'].map(id => ({ id, source: 'flowchart LR; A-->B', family: 'flowchart', features: [], provenance: 'interruption regression fixture' }))
    const rows = await runExternalCommunity(prepared, workloads, 'png', 1, { out: directory, communityCoverageOnce: true } as UnifiedRunOptions)
    expect(rows.map(row => row.status)).toEqual(['passed', 'failed', 'blocked'])
    expect(rows[1]?.metrics?.rejected).toBe(true)
    expect(rows[2]?.detail).toContain('exit 7')
    const journal = new InvocationJournal(rows[0]!.metrics!.invocationDirectory as string)
    expect(journal.records().filter(frame => frame.state !== 'started').map(frame => frame.state).sort()).toEqual(['public-error', 'returned'])
    expect(journal.records().some(frame => frame.identity.caseId === 'not-started')).toBe(false)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
