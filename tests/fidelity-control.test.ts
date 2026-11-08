import { expect, test } from 'bun:test'
import { cpSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fidelityControlIdentity, fidelityHarnessSources, assertReusableControl } from '../unified/fidelity-control.ts'
import { byteDigest } from '../portable/artifacts.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import { execFileSync } from 'node:child_process'
import { captureInstalledDependencyClosure } from '../portable/artifact-dependencies.ts'

const temporary = useTempDirs('fidelity-control-')
test('the executing import rewriter belongs to the sealed runtime dependency closure', () => {
  const root = join(import.meta.dirname, '..')
  const compiler = realpathSync(dirname(createRequire(import.meta.url).resolve('typescript/package.json')))
  const observed = captureInstalledDependencyClosure(root).nodes.find(node => node.realRoot === compiler)
  expect(observed?.name).toBe('typescript')
  expect(observed?.files.some(file => file.path === 'lib/typescript.js' && /^[a-f0-9]{64}$/.test(file.sha256 ?? ''))).toBe(true)
})
test('control reuse binds selected source and installed bytes while allowing relocation', () => {
  const first = temporary.dir(), second = temporary.dir()
  for (const name of ['upstream', 'reference', 'runtime']) mkdirSync(join(first, name))
  execFileSync('git', ['init', '--quiet'], { cwd: join(first, 'upstream') })
  writeFileSync(join(first, 'upstream/pnpm-lock.yaml'), 'pinned lock')
  writeFileSync(join(first, 'upstream/test.spec.ts'), 'original selected assertions')
  for (const name of ['reference', 'runtime']) {
    writeFileSync(join(first, name, 'package.json'), '{"name":"fixture","version":"1","dependencies":{"helper":"1"}}')
    mkdirSync(join(first, name, 'node_modules/helper'), { recursive: true })
    writeFileSync(join(first, name, 'node_modules/helper/package.json'), '{"name":"helper","version":"1"}')
    writeFileSync(join(first, name, 'node_modules/helper/index.js'), 'original installed runner bytes')
  }
  cpSync(first, second, { recursive: true })
  const identity = (root: string) => fidelityControlIdentity(join(root, 'upstream'), join(root, 'reference'), join(root, 'runtime'), [{ path: 'test.spec.ts', absolute: join(root, 'upstream/test.spec.ts'), declarations: [] }], 'pinned')
  const initial = identity(first)
  expect(identity(second)).toBe(initial)
  mkdirSync(join(first, 'upstream/.vite'))
  writeFileSync(join(first, 'upstream/.vite/jisonPlugin.ts'), 'changed source compiler')
  expect(identity(first)).not.toBe(initial)
  rmSync(join(first, 'upstream/.vite'), { recursive: true })
  expect(identity(first)).toBe(initial)
  mkdirSync(join(first, 'upstream/packages/parser/src/language/generated'), { recursive: true })
  writeFileSync(join(first, 'upstream/.gitignore'), 'packages/parser/src/language/generated/\n')
  const withoutGenerated = identity(first)
  writeFileSync(join(first, 'upstream/packages/parser/src/language/generated/parser.ts'), 'ignored executing parser')
  expect(identity(first)).not.toBe(withoutGenerated)
  rmSync(join(first, 'upstream/packages'), { recursive: true }); rmSync(join(first, 'upstream/.gitignore'))
  expect(identity(first)).toBe(initial)
  writeFileSync(join(second, 'upstream/test.spec.ts'), 'different assertions at the same path')
  expect(identity(second)).not.toBe(initial)
  writeFileSync(join(first, 'runtime/node_modules/helper/index.js'), 'different installed runner bytes')
  expect(identity(first)).not.toBe(initial)
})
test('a reuse receipt cannot bless altered or missing native/audit evidence', () => {
  const root = temporary.dir()
  expect(() => assertReusableControl(root, 'identity')).toThrow('recollect')
  writeFileSync(join(root, 'vitest.json'), '{}'); writeFileSync(join(root, 'audit.jsonl'), '{}\n'); writeFileSync(join(root, 'environments.jsonl'), '{}\n')
  writeFileSync(join(root, 'control.json'), JSON.stringify({ protocol: 'fidelity-control-v1', identity: 'identity', resultsSha256: byteDigest(join(root, 'vitest.json')), auditSha256: byteDigest(join(root, 'audit.jsonl')), environmentSha256: byteDigest(join(root, 'environments.jsonl')) }))
  expect(() => assertReusableControl(root, 'identity')).not.toThrow()
  writeFileSync(join(root, 'audit.jsonl'), '{"changed":true}\n')
  expect(() => assertReusableControl(root, 'identity')).toThrow('recollect')
})

test('release labels and notes preserve Node qualification; dependency bytes and assertions revoke it', async () => {
  const { fidelityTargetIdentity } = await import('../unified/fidelity-control.ts')
  const { qualifiedNodeFiles } = await import('../unified/mermaid-fidelity.ts')
  const { currentReferencePin } = await import('../reference/source.ts')
  const root = temporary.dir()
  for (const name of ['upstream', 'reference', 'runtime', 'tooling']) mkdirSync(join(root, name))
  execFileSync('git', ['init', '--quiet'], { cwd: join(root, 'upstream') })
  writeFileSync(join(root, 'upstream/pnpm-lock.yaml'), 'lock')
  const selected = join(root, 'upstream/test.spec.ts'); writeFileSync(selected, 'assertion')
  for (const name of ['reference', 'runtime', 'tooling']) writeFileSync(join(root, name, 'package.json'), '{"name":"fixture","version":"0.2.1"}')
  const helper = join(root, 'tooling/node_modules/helper'); mkdirSync(helper, { recursive: true })
  writeFileSync(join(root, 'tooling/package.json'), '{"name":"trident","version":"0.2.1","dependencies":{"helper":"1"}}')
  writeFileSync(join(helper, 'package.json'), '{"name":"helper","version":"1"}'); writeFileSync(join(helper, 'index.js'), 'implementation')
  const entry = { path: 'test.spec.ts', absolute: selected, family: 'flowchart', helperIdentifiers: [] as string[], fileIdentifiers: [] as string[] }
  const identity = () => fidelityControlIdentity(join(root, 'upstream'), join(root, 'reference'), join(root, 'runtime'), [entry], 'pin', undefined, join(root, 'tooling'))
  const initial = identity(), target = { project: 'fixture', tool: 'native', version: '1', peer: { node: { description: 'before' }, artifact: { sha256: 'a'.repeat(64), detail: 'before' } } }
  const proof = { protocol: 'dom-free-qualification-v3', commit: currentReferencePin.commit, controlIdentity: initial, targets: { fixture: fidelityTargetIdentity(target) }, additionalFiles: { fixture: ['test.spec.ts'] }, qualifierSha256: 'old reporter bytes' }
  writeFileSync(join(root, 'tooling/package.json'), '{"name":"trident","version":"0.3.0","description":"release wording","dependencies":{"helper":"1"}}')
  writeFileSync(join(root, 'upstream/audit-notes.txt'), 'untracked notes')
  target.peer.node.description = 'after'; target.peer.artifact.detail = 'after'
  expect(identity()).toBe(initial)
  expect([...qualifiedNodeFiles(proof, identity(), target)]).toEqual(['test.spec.ts'])
  for (const change of [{ family: 'sequence' }, { helperIdentifiers: ['log'] }, { fileIdentifiers: ['log'] }]) {
    Object.assign(entry, change)
    expect([...qualifiedNodeFiles(proof, identity(), target)]).toEqual([])
    Object.assign(entry, { family: 'flowchart', helperIdentifiers: [], fileIdentifiers: [] })
  }
  writeFileSync(join(helper, 'index.js'), 'changed implementation')
  expect([...qualifiedNodeFiles(proof, identity(), target)]).toEqual([])
  writeFileSync(join(helper, 'index.js'), 'implementation'); writeFileSync(selected, 'different assertion')
  expect(identity()).not.toBe(initial)
  target.peer.artifact.sha256 = 'b'.repeat(64)
  expect([...qualifiedNodeFiles(proof, initial, target)]).toEqual([])
})

test('worker identity follows transitive imports and reexports without including inactive sources', () => {
  const root = temporary.dir()
  writeFileSync(join(root, 'entry.ts'), "import './view.mjs'\n")
  writeFileSync(join(root, 'view.mjs'), "export { value } from './leaf.mjs'\n")
  writeFileSync(join(root, 'leaf.mjs'), 'export const value = 1\n')
  const initial = fidelityHarnessSources(root, ['entry.ts'])
  writeFileSync(join(root, 'inactive.mjs'), 'unbuilt recipe')
  expect(fidelityHarnessSources(root, ['entry.ts'])).toEqual(initial)
  writeFileSync(join(root, 'leaf.mjs'), 'export const value = 2\n')
  expect(fidelityHarnessSources(root, ['entry.ts'])).not.toEqual(initial)
  const actual = fidelityHarnessSources(join(import.meta.dirname, '../unified/mermaid-fidelity'))
  expect(actual['view-core.mjs']).toBeDefined()
  expect(actual['views/dart.mjs']).toBeDefined()
})

test('a changed bridge invalidates only its own candidate qualification', async () => {
  const { bindParserBridge } = await import('../unified/mermaid-fidelity/bridges.ts')
  const { fidelityTargetIdentity } = await import('../unified/fidelity-control.ts')
  const { qualifiedNodeFiles } = await import('../unified/mermaid-fidelity.ts')
  const { currentReferencePin } = await import('../reference/source.ts')
  const root = temporary.dir(), script = join(root, 'active.mjs')
  writeFileSync(script, 'original bridge')
  const target = () => ({ project: 'active', version: '1', tool: 'bridge', bridge: bindParserBridge({ command: [process.execPath, script], version: '1', description: 'bridge' }, root, {}) })
  const other = { project: 'other', version: '1', tool: 'native' }
  const record = { protocol: 'dom-free-qualification-v3', commit: currentReferencePin.commit, controlIdentity: 'control', targets: { active: fidelityTargetIdentity(target()), other: fidelityTargetIdentity(other) }, additionalFiles: { active: ['a'], other: ['b'] } }
  writeFileSync(join(root, 'inactive.rs'), 'unbuilt unrelated bridge')
  expect([...qualifiedNodeFiles(record, 'control', target())]).toEqual(['a'])
  writeFileSync(script, 'different bridge')
  expect([...qualifiedNodeFiles(record, 'control', target())]).toEqual([])
  expect([...qualifiedNodeFiles(record, 'control', other)]).toEqual(['b'])
})

test('package scope affects execution even though the release label does not', async () => {
  const { dependencyExecutionInputs } = await import('../portable/artifact-dependencies.ts')
  const root = temporary.dir(), manifest = { name: 'tool', version: '1', type: 'module', imports: { '#helper': './first.js' } }
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
  const identity = () => dependencyExecutionInputs(captureInstalledDependencyClosure(root))
  const original = identity()
  writeFileSync(join(root, 'package.json'), JSON.stringify({ ...manifest, version: '2' }))
  expect(identity()).toEqual(original)
  writeFileSync(join(root, 'package.json'), JSON.stringify({ ...manifest, type: 'commonjs' }))
  expect(identity()).not.toEqual(original)
  writeFileSync(join(root, 'package.json'), JSON.stringify({ ...manifest, imports: { '#helper': './other.js' } }))
  expect(identity()).not.toEqual(original)
})
