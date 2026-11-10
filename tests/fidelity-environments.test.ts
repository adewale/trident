import { expect, test } from 'bun:test'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { attestEnvironment, environmentSummary } from '../unified/mermaid-fidelity/environments.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-environments-')
test('environment receipts reject wrong globals, duplicate files and receipts outside the plan', () => {
  const node = attestEnvironment('/node.spec.ts', 'node', { window: 'undefined', document: 'undefined' })
  const jsdom = attestEnvironment('/dom.spec.ts', 'jsdom', { window: 'object', document: 'object' })
  const files = [{ absolute: node.file, environment: 'node' }, { absolute: jsdom.file }]
  expect(environmentSummary(files, [node, jsdom])).toEqual({ node: 1, jsdom: 1, unobserved: 0 })
  expect(environmentSummary(files, [node])).toEqual({ node: 1, jsdom: 0, unobserved: 1 })
  expect(() => attestEnvironment(node.file, 'node', { window: 'object', document: 'object' })).toThrow('TRIDENT_RUNNER_ENVIRONMENT')
  expect(() => attestEnvironment(jsdom.file, 'jsdom', { window: 'object', document: 'undefined' })).toThrow('TRIDENT_RUNNER_ENVIRONMENT')
  expect(() => environmentSummary(files, [node, node])).toThrow('duplicate')
  expect(() => environmentSummary([], [node])).toThrow('outside')
})

// Optional pinned-tool integration: no product artifacts or benchmark cases.
// The usual CI guard still checks receipts without installing a second runner.
test.skipIf(!process.env.TRIDENT_FIDELITY_TEST_RUNTIME)('the actual Vitest configuration routes separate files to Node and JSDOM', () => {
  const runtime = resolve(process.env.TRIDENT_FIDELITY_TEST_RUNTIME!), root = temporary.dir(), require = createRequire(join(runtime, 'package.json'))
  mkdirSync(join(root, '.vite'))
  for (const name of ['jisonPlugin', 'jsonSchemaPlugin']) writeFileSync(join(root, '.vite', name + '.ts'), `export default () => ({name:${JSON.stringify(name)}})`)
  const files = ['node', 'jsdom'].map(environment => {
    const absolute = join(root, environment + '.spec.ts')
    const expected = environment === 'node' ? 'undefined' : 'object'
    writeFileSync(absolute, `import {it} from 'vitest'; if(typeof window!==${JSON.stringify(expected)}||typeof document!==${JSON.stringify(expected)})throw Error('wrong environment');it.skip('environment fixture has no candidate operation',()=>{});`)
    return { path: environment + '.spec.ts', absolute, family: '<shared>', declarations: [], ...(environment === 'node' ? { environment } : {}) }
  })
  const job = { upstream: root, reference: runtime, runtime, target: { tool: 'bridge', project: 'fixture' }, files, workers: 1, results: join(root, 'vitest.json'), audit: join(root, 'audit.jsonl'), environmentAudit: join(root, 'environments.jsonl') }
  const jobPath = join(root, 'job.json'); writeFileSync(jobPath, JSON.stringify(job))
  const child = spawnSync('node', [join(require.resolve('vitest/package.json'), '..', 'vitest.mjs'), 'run', '--config', resolve(import.meta.dirname, '../unified/mermaid-fidelity/config.ts')], { cwd: root, env: { ...process.env, TRIDENT_FIDELITY_JOB: jobPath }, encoding: 'utf8', timeout: 30000 })
  const results = JSON.parse(readFileSync(job.results, 'utf8'))
  expect({ status: child.status, error: child.error, stderr: child.stderr, failures: results.testResults.map((suite: any) => suite.message).filter(Boolean) }).toMatchObject({ status: 0, error: undefined, failures: [] })
  expect(results.numPendingTests).toBe(2)
  expect(results.numFailedTests).toBe(0)
  expect(results.testResults).toHaveLength(2)
  const receipts = readdirSync(root).filter(name => name.startsWith('environments.jsonl.')).flatMap(name => readFileSync(join(root, name), 'utf8').trim().split('\n').map(line => JSON.parse(line)))
  expect(environmentSummary(files, receipts)).toEqual({ node: 1, jsdom: 1, unobserved: 0 })
  // A source teardown exception must not prevent the audit finalizer or poison
  // the next callback's ownership. The fixture deliberately exercises no parser.
  // Forward the dynamic namespace through another Promise to exercise the
  // actual rewriter's thenable assimilation without inventing a native export.
  writeFileSync(join(root, 'config.js'), 'globalThis.__borrowedReference = true;export function saveConfigFromInitialize(){throw Error("reference implementation")}')
  writeFileSync(files[0]!.absolute, `import {it,beforeEach,afterEach,expect,vi} from 'vitest';vi.mock(import('./config.js'),()=>({saveConfigFromInitialize(){throw Error('borrowed mock')}}));let call=0;beforeEach(()=>{if(++call===1)throw Error('before sentinel')});afterEach(()=>{throw Error('after sentinel')});it('first > cleanup',()=>{});it('second',async()=>{const {saveConfigFromInitialize}=await import('./config.js').then(module=>module);expect(()=>saveConfigFromInitialize({})).toThrow();expect(globalThis.__borrowedReference).toBeUndefined()});it('namespace',async()=>{const module=await import('./unbound.js');expect(Object.keys(module)).toEqual([])});it('computed import',async()=>{const source='./config.js';try{await import(source)}catch{}expect(globalThis.__borrowedReference).toBeUndefined()});`)
  const lifecycle = { ...job, results: join(root, 'lifecycle-vitest.json'), audit: join(root, 'lifecycle-audit.jsonl'), environmentAudit: join(root, 'lifecycle-environments.jsonl') }
  writeFileSync(jobPath, JSON.stringify(lifecycle))
  const failed = spawnSync('node', [join(require.resolve('vitest/package.json'), '..', 'vitest.mjs'), 'run', '--config', resolve(import.meta.dirname, '../unified/mermaid-fidelity/config.ts')], { cwd: root, env: { ...process.env, TRIDENT_FIDELITY_JOB: jobPath }, encoding: 'utf8', timeout: 30000 })
  expect(failed.status).toBe(1)
  const audit = readFileSync(lifecycle.audit, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  expect(audit.map(row => [row.index, row.fullName])).toEqual([[0, 'first > cleanup'], [1, 'second'], [2, 'namespace'], [3, 'computed import']])
  expect(audit[1]!.gaps).toContain('Native host configuration export is not bound: saveConfigFromInitialize')
  expect(audit[2]!.gaps).toContain('Native module namespace is not bound: ./unbound.js')
  expect(audit[3]!.gaps.some((reason: string) => reason.startsWith('Nonliteral production import has no native binding: '))).toBe(true)
}, 40000)
