import { expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runStartupChild, parseStartupResource } from '../unified/fresh-process.ts'

test('child milestone decoder preserves Unicode split across stdout buffers and ignores unframed output', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-frame-'))
  try {
    const script = join(root, 'frames.cjs')
    writeFileSync(script, `const fs=require('node:fs'),b=Buffer.from('noise\\n\\u0001entry-startup\\u0001'+JSON.stringify({phase:'first-consumed',label:'漢字'})+'\\n');const cut=b.indexOf(Buffer.from('漢'))+1;fs.writeSync(1,b.subarray(0,cut));setTimeout(()=>fs.writeSync(1,b.subarray(cut)),20)`)
    const result = await runStartupChild('node', [script], { cwd: root })
    expect(result.code).toBe(0)
    expect(result.phases).toHaveLength(1)
    expect(result.phases[0]!.label).toBe('漢字')
    expect(result.phases[0]!.observedMs).toBeGreaterThan(0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('GNU time readings preserve resolution and reject missing counters', () => {
  expect(parseStartupResource('user_seconds=0.01\nsystem_seconds=0.02\npeak_rss_kib=1\n')).toEqual({ userCpuMs: 10, systemCpuMs: 20, peakRssBytes: 1024, cpuResolutionMs: 10 })
  expect(() => parseStartupResource('peak_rss_kib=1')).toThrow('user_seconds')
})
