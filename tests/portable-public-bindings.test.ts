import { expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { artifactIdentity } from '../portable/artifacts.ts'
import { portableAdapter, portableBinding } from '../unified/support.ts'

test('portable admission uses a declared factory and disposes its real receiver', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-public-factory-'))
  try {
    const entry = join(root, 'renderer.mjs'), events = join(root, 'events.txt'), resultFile = join(root, 'result.json'), input = join(root, 'job.json')
    writeFileSync(entry, `import{appendFileSync}from'node:fs';export async function createEngine(){appendFileSync(${JSON.stringify(events)},'factory\\n');return{label:'Visible',draw(){appendFileSync(${JSON.stringify(events)},'render\\n');return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><text>'+this.label+'</text></svg>'},async close(){appendFileSync(${JSON.stringify(events)},'dispose\\n')}}}`)
    writeFileSync(input, JSON.stringify({ artifact: { project: 'fixture/engine', root, entry, version: '1.0.0', adapter: 'declared', binding: { factory: 'createEngine', export: 'draw', dispose: 'close' } }, testCase: { id: 'factory-call', family: 'flowchart', cohort: 'family', source: 'flowchart LR\nA[Visible]', expected: { accept: true, labels: ['Visible'] } }, mode: 'cold', samples: 1, round: 1, replica: 'B', sample: 0, resultFile }))
    const child = spawnSync(process.env.NODE_BIN ?? 'node', [resolve(import.meta.dir, '../portable/worker.mjs'), input], { encoding: 'utf8', timeout: 10000 })
    expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' })
    expect(readFileSync(events, 'utf8')).toBe('factory\nrender\ndispose\n')
    expect(JSON.parse(readFileSync(resultFile, 'utf8')).qualification.evidence.outputAdmission).toBe('passed')
    const node = { id: 'fixture/engine', roles: ['renderer'], outputs: ['svg'], benchmark: { adapter: 'other-runtime', portable: { adapter: 'declared' as const, binding: { factory: 'createEngine', export: 'draw', dispose: 'close' } } } }
    expect(portableAdapter(node)).toBe('declared')
    expect(portableBinding(node)?.factory).toBe('createEngine')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('portable public-pipeline identity includes separately installed companion bytes', () => {
  const base = mkdtempSync(join(tmpdir(), 'trident-pipeline-identity-'))
  try {
    const modules = join(base, 'node_modules'), root = join(modules, '@crafter/mermaid-renderer')
    const packages = [['@crafter/mermaid-renderer', '0.0.3'], ['@crafter/mermaid-parser', '0.0.4'], ['@crafter/mermaid-layout', '0.0.3'], ['@crafter/mermaid-themes', '0.0.3']]
    for (const [name, version] of packages) {
      const directory = join(modules, name!); mkdirSync(directory, { recursive: true })
      writeFileSync(join(directory, 'package.json'), JSON.stringify({ name, version, type: 'module', main: 'index.js' }))
      writeFileSync(join(directory, 'index.js'), 'export const fixture = 1;\n')
    }
    const artifact = { project: 'fixture/pipeline', root, entry: join(root, 'index.js'), version: '0.0.3', adapter: 'public-package' as const, publicConfig: { package: '@crafter/mermaid-renderer' } }
    const before = artifactIdentity(artifact)
    expect(before.adapterCompanions?.map(companion => companion.packageName)).toContain('@crafter/mermaid-parser')
    writeFileSync(join(modules, '@crafter/mermaid-parser/index.js'), 'export const fixture = 2;\n')
    expect(artifactIdentity(artifact)).not.toEqual(before)
    writeFileSync(join(modules, '@crafter/mermaid-parser/package.json'), JSON.stringify({ name: '@crafter/mermaid-parser', version: '9.0.0' }))
    expect(() => artifactIdentity(artifact)).toThrow('companion version differs')
  } finally { rmSync(base, { recursive: true, force: true }) }
})
