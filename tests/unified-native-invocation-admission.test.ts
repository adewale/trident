import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInvocationNativeCli } from '../unified/invocation.ts'
import { admitNativeInvocationArtifact } from '../unified/native-invocation-artifact.ts'

const workload = { id: 'native-admission:authored', family: 'flowchart', source: 'flowchart LR\nA[Start] --> B[End]', expectedLabels: ['Start', 'End'], features: ['directed-edge'], provenance: 'Independent authored native executable selection/transport regression; no claim of real renderer fidelity' }
function executable(path: string, body: string) { writeFileSync(path, `#!${process.execPath}\n${body}\n`); chmodSync(path, 0o755) }
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text>Start End</text></svg>'

test('explicit out-of-package native executable produces consumed output and records its actual canonical bytes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-native-admission-'))
  try {
    const root = join(directory, 'package'), native = join(directory, 'external-executable'), alias = join(directory, 'alias'), log = join(directory, 'argv.json')
    mkdirSync(root)
    executable(native, `const fs=require('node:fs');fs.writeFileSync(${JSON.stringify(log)},JSON.stringify(process.argv.slice(2)));if(fs.readFileSync(0,'utf8')!==${JSON.stringify(workload.source)})process.exit(8);console.log(${JSON.stringify(svg)})`)
    symlinkSync(native, alias)
    const result = await runInvocationNativeCli({ root, nativeExecutable: alias, out: join(directory, 'out'), profile: 'smoke', rounds: 1 }, [workload])
    expect(result.gaps).toEqual([])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]!.status).toBe('passed')
    expect(result.rows[0]!.samplesMs).toHaveLength(1)
    expect(JSON.parse(readFileSync(log, 'utf8'))).toEqual(['render', '-', '--format', 'svg'])
    const identity = JSON.parse(readFileSync(result.artifacts[0]!, 'utf8'))
    expect(identity).toMatchObject({ selection: 'explicit-executable', requestedPath: alias, path: native, bytes: readFileSync(native).length, sha256: createHash('sha256').update(readFileSync(native)).digest('hex'), ownership: 'separately-admitted-executable', sourceEquivalence: 'requires-independent-build-receipt' })
    expect(result.rows[0]!.metrics).toMatchObject({ nativeExecutablePath: native, nativeExecutableSha256: identity.sha256, nativeArtifactStable: true })
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('native fallback belongs to the measured packageRoot and an explicit missing or non-executable path cannot fall back', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-native-fallback-'))
  try {
    const root = join(directory, 'driver'), packageRoot = join(directory, 'candidate'), native = join(packageRoot, 'dist/am')
    mkdirSync(root); mkdirSync(join(packageRoot, 'dist'), { recursive: true })
    executable(native, `console.log(${JSON.stringify(svg)})`)
    const options = { root, packageRoot, out: join(directory, 'out'), profile: 'smoke' as const, rounds: 1 }
    expect(admitNativeInvocationArtifact(options)).toMatchObject({ status: 'available', artifact: { path: native, selection: 'package-root-default' } })
    expect((await runInvocationNativeCli(options, [workload])).rows[0]!.status).toBe('passed')
    for (const explicit of [join(directory, 'missing'), join(directory, 'non-executable'), directory]) {
      if (explicit.endsWith('non-executable')) writeFileSync(explicit, 'not executable', { mode: 0o644 })
      const result = await runInvocationNativeCli({ ...options, nativeExecutable: explicit }, [workload])
      expect(result.rows.map(row => row.status)).toEqual(['blocked'])
      expect(result.rows[0]!.samplesMs).toBeUndefined()
      expect(result.gaps[0]).toContain('never falls back')
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('failed output and changed executable bytes cannot earn a native latency sample', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-native-unstable-'))
  try {
    const native = join(directory, 'native'), options = { root: directory, nativeExecutable: native, out: join(directory, 'out'), profile: 'smoke' as const, rounds: 1 }
    executable(native, "console.log('not SVG')")
    const malformed = (await runInvocationNativeCli(options, [workload])).rows[0]!
    expect(malformed.status).toBe('failed'); expect(malformed.samplesMs).toEqual([])
    executable(native, `require('node:fs').appendFileSync(${JSON.stringify(native)},'\\n//changed\\n');console.log(${JSON.stringify(svg)})`)
    const replaced = (await runInvocationNativeCli(options, [workload])).rows[0]!
    expect(replaced.status).toBe('failed'); expect(replaced.samplesMs).toEqual([])
    expect(replaced.metrics!.nativeArtifactStable).toBe(false)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
