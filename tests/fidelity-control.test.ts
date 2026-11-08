import { expect, test } from 'bun:test'
import { cpSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fidelityControlIdentity, assertReusableControl, fidelityHarnessSources } from '../unified/fidelity-control.ts'
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
test('native harness languages and build inputs participate in control identity', () => {
  const root = temporary.dir()
  for (const name of ['parser.rs', 'parser.go', 'parser.dart', 'parser.py', 'Cargo.toml.template', 'Cargo.lock']) writeFileSync(join(root, name), 'original')
  writeFileSync(join(root, 'README.md'), 'documentation')
  writeFileSync(join(root, 'dom-free-files.json'), '{}')
  const before = fidelityHarnessSources(root)
  expect(before).toHaveLength(6)
  for (const name of ['parser.rs', 'parser.go', 'parser.dart', 'parser.py', 'Cargo.toml.template', 'Cargo.lock']) {
    writeFileSync(join(root, name), 'changed')
    expect(fidelityHarnessSources(root)).not.toEqual(before)
    writeFileSync(join(root, name), 'original')
  }
  writeFileSync(join(root, 'dom-free-files.json'), '{"proof":"new"}')
  expect(fidelityHarnessSources(root)).toEqual(before)
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
