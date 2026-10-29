import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runCommunityNodeRound, runCommunityCli, communityModuleOutputSupported } from '../unified/community.ts'
import { runExternalCommunity } from '../unified/community-external.ts'
import { parseOptions } from '../unified/options.ts'
import { verifySupport, partitionVerificationRows, supportControls } from '../unified/support-verification.ts'

test('support admission retains its narrow scope, strips timing claims and rejects changed artifact bytes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-support-contract-'))
  try {
    const module = join(root, 'renderer.mjs'), catalog = join(root, 'catalog.json'), prepared = join(root, 'prepared.json')
    const bytes = 'export function draw(){return \'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><text>Alpha</text><text>Beta</text></svg>\'}'
    writeFileSync(module, bytes)
    writeFileSync(join(root, 'package.json'), '{"name":"support-contract-fixture","version":"1.0.0","type":"module","bin":{"fixture-render":"cli.mjs"}}')
    writeFileSync(join(root, 'cli.mjs'), `import {readFileSync} from 'node:fs';if(!readFileSync(0,'utf8'))process.exit(2);process.stdout.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><text>Alpha</text><text>Beta</text></svg>')`)
    const node = { id: 'fixture/renderer', outputs: ['svg'], roles: ['renderer'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'draw' } }, cli: { bin: 'fixture-render', args: [], outputs: ['svg'] } } }
    writeFileSync(catalog, JSON.stringify({ nodes: [node] }))
    writeFileSync(prepared, JSON.stringify([{ node, artifact: { kind: 'node', root, module, version: '1.0.0', sha256: createHash('sha256').update(bytes).digest('hex') } }]))
    const out = join(root, 'admitted')
    await verifySupport(prepared, out, { catalog })
    const report = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8'))
    expect(report.projects[0].state).toBe('partially-verified')
    expect(report.projects[0].outputs[0].plannedInputs).toBe(6)
    expect(report.projects[0].outputs.find((output: any) => output.transport === 'public-package-cli')).toMatchObject({ plannedInputs: 6, recordedInputObservations: 6, state: 'invocation-verified' })
    expect(report.projects[0].outputs[0].observations.every((row: any) => !row.samplesMs && !row.metrics.firstMs)).toBe(true)
    expect(report.limits).toContain('No timing comparisons, full family support')
    for (const producer of ['community-worker.mjs', 'community-python-worker.py', 'mermaid-oracle-worker.mjs', 'declared-adapter.mjs']) expect(report.producers.some((row: string) => row.endsWith('/' + producer))).toBe(true)
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
  const row: any = { suite: 'community', surface: 'node:public-api', runtime: 'fixture', family: 'flowchart', caseId: 'support:flowchart', operation: 'render', format: 'svg', mode: 'feature-corpus-qualification', status: 'passed', samplesMs: [123], metrics: { firstMs: 123, outputFile: '/owning/failure.svg', diagnosticAdmissionFailed: true } }
  const result = partitionVerificationRows([row, { ...row, caseId: 'parser-negative-1' }, { ...row, caseId: 'parser-negative-2' }])
  expect(result).toMatchObject({ plannedInputs: 6, passed: 1, recordedInputObservations: 1 })
  expect(result.controls).toHaveLength(2)
  expect(result.observations[0]?.metrics).toMatchObject({ outputFile: '/owning/failure.svg', diagnosticAdmissionFailed: true })
  expect(result.observations[0]?.metrics?.firstMs).toBeUndefined()
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

test('support controls keep source rejection, accepted output, observer failures and missing evidence distinct', () => {
  const row: any = { suite: 'community', surface: 'native:in-process-api', runtime: 'fixture', family: 'invalid-source', caseId: 'support:negative-header', operation: 'render', format: 'png', mode: 'fixture', status: 'failed', samplesMs: [123], metrics: { rejected: true, qualification: 'decoded-raster-content' } }
  expect(partitionVerificationRows([row]).controlCounts).toEqual({ planned: 2, passed: 1, failed: 0, blocked: 0, missing: 1 })
  expect(partitionVerificationRows([{ ...row, status: 'passed', metrics: { rejected: false } }]).controlCounts.failed).toBe(1)
  expect(partitionVerificationRows([{ ...row, status: 'blocked' }]).controlCounts.blocked).toBe(1)
  expect(partitionVerificationRows([{ ...row, status: 'blocked', metrics: { pngReturned: true, rejected: false, failureStage: 'qualification' } }]).controlCounts.failed).toBe(1)
  expect(partitionVerificationRows([{ ...row, metrics: { rejected: true, pngReturned: true } }]).controlCounts.failed).toBe(1)
  expect(partitionVerificationRows([{ ...row, status: 'passed', metrics: { rejected: true, pngReturned: true, expectedAccepted: false } }]).controlCounts.failed).toBe(1)
  expect(partitionVerificationRows([{ ...row, metrics: { rejected: false } }]).controlCounts.failed).toBe(1)
  expect(partitionVerificationRows([{ ...row, metrics: {} }]).controlState).toBe('incomplete')
  expect(partitionVerificationRows([row, row]).controlCounts).toEqual({ planned: 2, passed: 0, failed: 0, blocked: 1, missing: 1 })
  expect(partitionVerificationRows([row, row]).duplicateControlIds).toEqual(['support:negative-header'])
})


test('invalid CLI controls distinguish completed command rejection from broken transport and missing output', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-cli-controls-'))
  try {
    const node = { id: 'fixture/cli', outputs: ['svg'], roles: ['renderer'], benchmark: { adapter: 'declared', outputs: ['svg'] } }
    const attempt = (executable: string, args: string[]) => partitionVerificationRows([runCommunityCli({ node, artifact: { kind: 'cli', version: 'fixture', executable, args } }, 'svg', supportControls[0]!, 1, root)])
    expect(attempt(process.execPath, ['-e', 'process.exit(2)']).controlCounts.passed).toBe(1)
    expect(attempt(join(root, 'missing-command'), []).controlCounts.blocked).toBe(1)
    expect(attempt(process.execPath, ['-e', 'process.kill(process.pid, "SIGTERM")']).controlCounts.blocked).toBe(1)
    expect(attempt(process.execPath, ['-e', 'process.exit(0)', '{output}']).controlCounts.failed).toBe(1)
    expect(attempt(process.execPath, ['-e', 'process.stdout.write("broken SVG")']).controlCounts.failed).toBe(1)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('invalid public parser controls admit explicit false returns without requiring a positive model', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-parser-controls-'))
  try {
    const module = join(root, 'parser.mjs')
    writeFileSync(module, 'export function parse(){return {ok:false,error:"invalid source"}}')
    const node = { id: 'fixture/parser', outputs: ['parse'], roles: ['parser'], benchmark: { adapter: 'declared', outputs: ['parse'], api: { parse: { export: 'parse' } } } }
    const rows = await runCommunityNodeRound({ node, artifact: { kind: 'node', module, version: 'fixture' } }, 'parse', supportControls, 1, parseOptions(['--out', root, '--profile', 'smoke']))
    expect(partitionVerificationRows(rows).controlCounts).toEqual({ planned: 2, passed: 2, failed: 0, blocked: 0, missing: 0 })
    expect(rows.every(row => !row.samplesMs)).toBe(true)
  } finally { rmSync(root, { recursive: true, force: true }) }
})


test('diagnostic response inspection cannot masquerade as source rejection', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-diagnostic-controls-'))
  try {
    const module = join(root, 'diagnostics.mjs')
    writeFileSync(module, 'let calls=0;export function validate(){calls++;return calls<=2?{diagnostics:[{severity:"error",message:"source rejected"}]}:null}')
    const node = { id: 'fixture/validator', outputs: ['diagnostics'], roles: ['validator'], benchmark: { adapter: 'declared', outputs: ['diagnostics'], api: { diagnostics: { export: 'validate' } } } }
    const rows = await runCommunityNodeRound({ node, artifact: { kind: 'node', module, version: 'fixture' } }, 'diagnostics', supportControls, 1, parseOptions(['--out', root, '--profile', 'smoke']))
    expect(partitionVerificationRows(rows).controlCounts).toEqual({ planned: 2, passed: 0, failed: 0, blocked: 2, missing: 0 })
    expect(rows.filter(row => supportControls.some(control => control.id === row.caseId)).every(row => row.metrics?.rejected === false)).toBe(true)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('Python controls separate public ValueError rejection, accepted returns and missing transport or API', async () => {
  for (const behavior of ['reject', 'accept', 'missing-command', 'missing-api', 'import-error']) {
    const root = mkdtempSync(join(tmpdir(), 'trident-python-controls-'))
    try {
      const module = join(root, 'termaid.py'), executable = join(root, 'python-wrapper')
      writeFileSync(module, behavior === 'missing-api' ? 'not_render = True' : behavior === 'import-error' ? 'raise RuntimeError("import failed")' : behavior === 'reject' ? 'def render(source):\n raise ValueError("source rejected")' : 'def render(source):\n return "not terminal ink"')
      writeFileSync(executable, `#!/usr/bin/env python3
import os, sys
os.environ['PYTHONPATH']=${JSON.stringify(root)}
os.execvp('python3', ['python3', *sys.argv[1:]])
`)
      chmodSync(executable, 0o755)
      const node = { id: 'fixture/python', outputs: ['terminal'], roles: ['renderer'] }
      const rows = await runExternalCommunity({ node, artifact: { kind: 'python', version: 'fixture', python: behavior === 'missing-command' ? join(root, 'missing') : executable } }, supportControls, 'terminal', 1, parseOptions(['--out', root, '--profile', 'smoke']))
      expect(partitionVerificationRows(rows).controlCounts).toEqual({ planned: 2, passed: behavior === 'reject' ? 2 : 0, failed: behavior === 'accept' ? 2 : 0, blocked: behavior.startsWith('missing') || behavior === 'import-error' ? 2 : 0, missing: 0 })
    } finally { rmSync(root, { recursive: true, force: true }) }
  }
})
