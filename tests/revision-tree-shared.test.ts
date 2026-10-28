import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

test('revision extraction preserves the executable current harness shared-fixture closure', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'revision-shared-'))
  const root = join(directory, 'driver')
  try {
    for (const folder of ['src', 'eval/benchmark', 'eval/shared', 'node_modules']) mkdirSync(join(root, folder), { recursive: true })
    writeFileSync(join(root, 'src/value.ts'), 'export const production = "original"\n')
    writeFileSync(join(root, 'tsconfig.json'), '{}')
    writeFileSync(join(root, 'package.json'), '{"type":"module"}')
    writeFileSync(join(root, 'eval/shared/graph-fixtures.ts'), 'export const witness = "independent fixture reached"\n')
    writeFileSync(join(root, 'eval/benchmark/probe.ts'), 'export { witness } from "../shared/graph-fixtures.ts"\n')
    cpSync(new URL('../revision-tree.ts', import.meta.url), join(root, 'eval/benchmark/revision-tree.ts'))
    const git = (...args: string[]) => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' })
    git('init', '-q')
    git('add', 'src', 'tsconfig.json', 'package.json')
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'original')
    writeFileSync(join(root, 'src/value.ts'), 'export const production = "changed working tree"\n')
    const { extractRevisionTree } = await import(pathToFileURL(join(root, 'eval/benchmark/revision-tree.ts')).href)
    const extracted = extractRevisionTree('HEAD', join(directory, 'scratch'), 'original')
    const probe = await import(pathToFileURL(join(extracted.root, 'eval/benchmark/probe.ts')).href)
    const production = await import(pathToFileURL(join(extracted.root, 'src/value.ts')).href)
    expect(probe.witness).toBe('independent fixture reached')
    expect(production.production).toBe('original')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
