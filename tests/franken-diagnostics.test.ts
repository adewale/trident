import { diagnosticSummary } from '../unified/community-extra-adapters.mjs'
import { expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

test('Franken diagnostics preserve public warnings without inventing syntax rejection', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-franken-diagnostics-'))
  try {
    const module = join(root, 'public-api.mjs'), wasm = join(root, 'fixture.wasm'), out = join(root, 'result.json'), input = join(root, 'job.json')
    writeFileSync(module, `export default async function init(){};export function parse(source){return{ir:{diagram_type:'Flowchart',diagnostics:[]},warnings:source.includes('Alpha')?[]:['No parseable nodes or edges were found'],confidence:1}}`)
    writeFileSync(wasm, 'fixture module controls its initialization')
    writeFileSync(join(root, 'package.json'), '{"type":"module"}')
    writeFileSync(input, JSON.stringify({ prepared: { node: { id: 'fixture/franken', outputs: ['diagnostics'], roles: ['validator'], benchmark: { adapter: 'franken', outputs: ['diagnostics'] } }, artifact: { kind: 'node', root, module, wasm, version: '1.0.0' } }, workloads: [{ id: 'authored-valid', family: 'flowchart', source: 'flowchart LR\nA[Alpha] --> B[Beta]', features: ['core-graph-batch'], expectedLabels: ['Alpha','Beta'] }], output: 'diagnostics', out, harnessRoot: resolve(import.meta.dir, '..'), samples: 1, warmupMs: 0, minSampleMs: 0 }))
    const child = spawnSync(process.env.NODE_BIN ?? 'node', [resolve(import.meta.dir, '../unified/community-worker.mjs'), input], { encoding: 'utf8', timeout: 10000 })
    expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' })
    const result = JSON.parse(readFileSync(out, 'utf8'))
    expect(result.publicApiAvailable).toBe(true)
    expect(result.diagnosticAdmissionFailed).toBe(true)
    expect(result.diagnosticAdmission[0].value.diagnostics[0]).toEqual({ severity: 'warning', message: 'No parseable nodes or edges were found' })
    expect(result.diagnosticAdmission[0].status).toBe('failed')
    expect(result.rows[0]).toMatchObject({ diagnosticAdmissionFailed: true, diagnosticAccepted: true, status: 'failed' })
    expect(result.rows[0].samplesMs).toBeUndefined()
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a public snake-case rejection flag cannot become successful validation', () => {
  expect(diagnosticSummary({ is_valid: false, errors: [] }).accepted).toBe(false)
  expect(diagnosticSummary({ is_valid: true, errors: [] }).accepted).toBe(true)
})
