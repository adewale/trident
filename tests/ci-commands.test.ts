import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { useTempDirs } from './helpers/temp-dir.ts'

const root = resolve(import.meta.dir, '..'), command = join(root, 'commands.ts')
const temp = useTempDirs('trident-ci-commands-')
function run(args: string[], indicators = { CI: 'true', GITHUB_ACTIONS: 'true' }) {
  return spawnSync(process.execPath, [command, ...args], { encoding: 'utf8', timeout: 20_000, env: { ...process.env, ...indicators, MERMAID_REFERENCE_DIR: '/missing/ci-oracle', MERMAID_UPSTREAM_DIR: '/missing/ci-source' } })
}

test('CI runs help, support and a no-acquisition campaign plan without an oracle', () => {
  // The Linux CI job already runs lint, typecheck and snapshot checks with missing oracles.
  // Keep this policy test to fast public reads instead of compiling the repository again.
  for (const args of [['support'], ['community:update', '--help'], ['bench', '--projects', 'mermaid-js/mermaid', '--plan']]) {
    const result = run(args)
    expect({ args, status: result.status, stderr: result.stderr }).toEqual({ args, status: 0, stderr: '' })
    expect(result.stderr).not.toContain('excluded from CI')
  }
}, 60_000)

test('CI still rejects measurement, artifact acquisition and the local full suite before creating output', () => {
  for (const indicators of [{ CI: 'true', GITHUB_ACTIONS: 'true' }, { CI: 'false', GITHUB_ACTIONS: 'true' }]) {
    for (const args of [['bench', '--projects', 'mermaid-js/mermaid'], ['community:update', '--projects', 'mermaid-js/mermaid', '--plan'], ['mermaid:install', '--dir'], ['upstream:prepare'], ['portable'], ['timing:browser'], ['timing:terminal'], ['timing:png'], ['test']]) {
      const out = join(temp.dir(), 'must-not-exist')
      const result = run(args.includes('--dir') ? [...args, out] : [...args, '--out', out], indicators)
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('excluded from CI')
      expect(existsSync(out)).toBe(false)
    }
  }
})

test('the retired PNG collector gives migration guidance without admitting benchmark work', () => {
  for (const args of [['docs:png'], ['docs:png', '--help']]) {
    const result = run(args)
    expect(result.status).toBe(args.includes('--help') ? 0 : 2)
    expect(result.stderr).toBe('')
    expect(result.stdout).toContain('standalone PNG collector is retired')
    expect(result.stdout).toContain('bench --suites docs --docs-formats png')
  }
})

test('test:ci runs every test file except the reviewed exclusions, each with a reason', async () => {
  const { ciTestFiles } = await import('../commands.ts')
  const { readdirSync, readFileSync } = await import('node:fs')
  const { resolve, basename } = await import('node:path')
  const root = resolve(import.meta.dir, '..')
  const skip = JSON.parse(readFileSync(resolve(root, 'tests/ci-skip.json'), 'utf8')).skip
  const all = readdirSync(resolve(root, 'tests')).filter(name => name.endsWith('.test.ts'))
  const run = ciTestFiles(root).map(file => basename(file))
  expect(run.length + Object.keys(skip).length).toBe(all.length)
  for (const [name, reason] of Object.entries(skip)) expect([name, String(reason).length > 20]).toEqual([name, true])
})
