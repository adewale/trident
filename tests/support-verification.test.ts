import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runCommunityNodeRound, communityModuleOutputSupported } from '../unified/community.ts'
import { parseOptions } from '../unified/options.ts'
import { verifySupport, partitionVerificationRows } from '../unified/support-verification.ts'

test('support admission retains its narrow scope, strips timing claims and rejects changed artifact bytes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-support-contract-'))
  try {
    const module = join(root, 'renderer.mjs'), catalog = join(root, 'catalog.json'), prepared = join(root, 'prepared.json')
    const bytes = 'export function draw(){return \'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><text>Alpha</text><text>Beta</text></svg>\'}'
    writeFileSync(module, bytes)
    writeFileSync(join(root, 'package.json'), '{"name":"support-contract-fixture","version":"1.0.0","type":"module"}')
    const node = { id: 'fixture/renderer', outputs: ['svg'], roles: ['renderer'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'draw' } } } }
    writeFileSync(catalog, JSON.stringify({ nodes: [node] }))
    writeFileSync(prepared, JSON.stringify([{ node, artifact: { kind: 'node', root, module, version: '1.0.0', sha256: createHash('sha256').update(bytes).digest('hex') } }]))
    const out = join(root, 'admitted')
    await verifySupport(prepared, out, { catalog })
    const report = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8'))
    expect(report.projects[0].state).toBe('partially-verified')
    expect(report.projects[0].outputs[0].plannedInputs).toBe(6)
    expect(report.projects[0].outputs[0].observations.every((row: any) => !row.samplesMs && !row.metrics.firstMs)).toBe(true)
    expect(report.limits).toContain('No timing comparisons, full family support')
    writeFileSync(module, bytes + '\nthrow Error("changed artifact must not execute")')
    const rejected = join(root, 'rejected')
    await verifySupport(prepared, rejected, { catalog })
    const bad = JSON.parse(readFileSync(join(rejected, 'report.json'), 'utf8'))
    expect(bad.projects[0].state).toBe('blocked')
    expect(bad.projects[0].gaps.join(' ')).toContain('Frozen artifact validation failed')
    expect(existsSync(join(rejected, encodeURIComponent(node.id), 'svg'))).toBe(false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('support denominators keep controls separate and withhold duplicate input credit', () => {
  const row: any = { suite: 'community', surface: 'node:public-api', runtime: 'fixture', family: 'flowchart', caseId: 'support:flowchart', operation: 'render', format: 'svg', mode: 'feature-corpus-qualification', status: 'passed', samplesMs: [123], metrics: { firstMs: 123 } }
  const result = partitionVerificationRows([row, { ...row, caseId: 'parser-negative-1' }, { ...row, caseId: 'parser-negative-2' }])
  expect(result).toMatchObject({ plannedInputs: 6, passed: 1, recordedInputObservations: 1 })
  expect(result.controls).toHaveLength(2)
  expect('samplesMs' in result.observations[0]!).toBe(false)
  expect(partitionVerificationRows([row, row])).toMatchObject({ passed: 0, duplicateCaseIds: ['support:flowchart'] })
})

test('a browser-only output never executes a guessed module API', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-module-boundary-'))
  try {
    const module = join(root, 'browser-only.mjs'), loaded = join(root, 'must-not-load')
    writeFileSync(module, `import{writeFileSync}from'node:fs';writeFileSync(${JSON.stringify(loaded)},'wrong host');throw Error('browser host required')`)
    const node = { id: 'fixture/browser-only', outputs: ['svg'], roles: ['renderer'], benchmark: { adapter: 'declared', moduleOutputs: [], outputs: ['svg'], api: { svg: { export: 'draw' } } } }
    expect(communityModuleOutputSupported(node, 'svg')).toBe(false)
    const options = parseOptions(['--out', root, '--profile', 'smoke'])
    const rows = await runCommunityNodeRound({ node, artifact: { kind: 'node', root, module, version: '1.0.0' } }, 'svg', [{ id: 'authored-input', family: 'flowchart', source: 'flowchart LR\nA-->B', features: [], provenance: 'authored host boundary' }], 1, options)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.status).toBe('not-applicable')
    expect(existsSync(loaded)).toBe(false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
