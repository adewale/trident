import { expect, test } from 'bun:test'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runExternalCommunity } from '../unified/community-external.ts'
import type { PreparedCommunity } from '../unified/community-types.ts'
import type { UnifiedRunOptions } from '../unified/types.ts'

test('external observer blocks and raster scopes survive collection without label credit', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-external-disposition-'))
  try {
    const executable = join(directory, 'worker.mjs')
    writeFileSync(
      executable,
      String.raw`#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
const [job,out]=process.argv.slice(2);
writeFileSync(out,JSON.parse(readFileSync(job)).workloads.map((w,i)=>JSON.stringify({workload:w.id,status:i?'blocked':'ok',qualificationScope:'decoded-raster-content',detail:i?'PNG observer budget exceeded':undefined})).join('\n')+'\n');
`,
    )
    chmodSync(executable, 0o755)
    const prepared = { node: { id: 'test/native' }, artifact: { kind: 'jsonl-worker', executable, runtime: 'test native transport', version: 'test' } } as PreparedCommunity
    const workloads = ['painted', 'observer-blocked'].map(id => ({ id, source: 'flowchart LR; A-->B', family: 'flowchart', features: [], expectedLabels: ['A', 'B'], provenance: 'transport regression fixture' }))
    const rows = await runExternalCommunity(prepared, workloads, 'png', 1, { out: directory, communityCoverageOnce: true } as UnifiedRunOptions)
    expect(rows.map(row => row.status)).toEqual(['passed', 'blocked'])
    expect(rows.map(row => row.metrics?.qualification)).toEqual(['decoded-raster-content', 'decoded-raster-content'])
    expect(rows[1]?.detail).toBe('PNG observer budget exceeded')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('JSONL interruption retains explicit API failures and blocks an uncertain next case', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-external-interruption-'))
  try {
    const executable = join(directory, 'worker.mjs')
    writeFileSync(executable, String.raw`#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
const [job,out]=process.argv.slice(2),workloads=JSON.parse(readFileSync(job)).workloads;
writeFileSync(out,JSON.stringify({workload:workloads[0].id,status:'ok',qualificationScope:'decoded-raster-content'})+'\n'+JSON.stringify({workload:workloads[1].id,status:'error',rejected:true,detail:'Explicit API rejection'})+'\n');
process.exit(7);
`)
    chmodSync(executable, 0o755)
    const prepared = { node: { id: 'test/native' }, artifact: { kind: 'jsonl-worker', executable, runtime: 'test transport', version: 'test' } } as PreparedCommunity
    const workloads = ['painted', 'api-failed', 'not-started'].map(id => ({ id, source: 'flowchart LR; A-->B', family: 'flowchart', features: [], provenance: 'interruption regression fixture' }))
    const rows = await runExternalCommunity(prepared, workloads, 'png', 1, { out: directory, communityCoverageOnce: true } as UnifiedRunOptions)
    expect(rows.map(row => row.status)).toEqual(['passed', 'failed', 'blocked'])
    expect(rows[1]?.metrics?.rejected).toBe(true)
    expect(rows[2]?.detail).toContain('exit 7')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
