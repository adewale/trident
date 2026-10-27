import { expect, test } from 'bun:test'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInvocationSuite } from '../unified/invocation.ts'

// Imports only the existing public suite API so the pre-fix implementation
// completes a blocked-native observation, rather than failing on a new export.
test('public invocation enrolls an explicitly supplied executable outside the package', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-public-native-'))
  try {
    const root = join(directory, 'package'), native = join(directory, 'separate-native'), log = join(directory, 'argv.json')
    mkdirSync(root)
    // No installed JS CLI and no dist/am. Those are separate invocation entries.
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'native-public-fixture', type: 'module' }))
    const source = 'flowchart LR\nA[Start] --> B[End]'
    writeFileSync(native, `#!${process.execPath}\nconst fs=require('node:fs');fs.writeFileSync(${JSON.stringify(log)},JSON.stringify(process.argv.slice(2)));if(fs.readFileSync(0,'utf8')!==${JSON.stringify(source)})process.exit(8);console.log('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text>Start End</text></svg>');\n`)
    chmodSync(native, 0o755)
    const result = await runInvocationSuite({ root, out: join(directory, 'out'), profile: 'smoke', rounds: 1, surfaces: ['cli'], nativeExecutable: native, workloads: [{ id: 'public-native:authored', family: 'flowchart', source, expectedLabels: ['Start', 'End'], features: ['directed-edge'], provenance: 'Independent public suite executable-selection regression; pinned oracle supplies its ordinary label admission' }] })
    const rows = result.observations.filter(row => row.surface === 'cli:native-binary')
    expect(rows.map(row => ({ operation: row.operation, status: row.status, findings: row.findings }))).toEqual([{ operation: 'render', status: 'passed', findings: [] }])
    expect(rows[0]!.samplesMs).toHaveLength(1)
    expect(JSON.parse(readFileSync(log, 'utf8'))).toEqual(['render', '-', '--format', 'svg'])
    expect(result.observations.find(row => row.surface === 'cli')!.status).toBe('blocked')
  } finally { rmSync(directory, { recursive: true, force: true }) }
}, 30_000)
