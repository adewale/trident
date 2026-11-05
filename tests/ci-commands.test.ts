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

test('CI runs help, the results check and command help without an oracle', () => {
  // The Linux CI job already runs lint, typecheck and snapshot checks with missing oracles.
  // Keep this policy test to fast public reads instead of compiling the repository again.
  for (const args of [['--help'], ['results:snapshot', '--check'], ['davebench', '--help'], ['prepare', '--help'], ['campaign:results', '--help']]) {
    const result = run(args)
    expect({ args, status: result.status, stderr: result.stderr }).toEqual({ args, status: 0, stderr: '' })
    expect(result.stderr).not.toContain('excluded from CI')
  }
}, 60_000)

test('CI still rejects measurement, artifact acquisition and the local full suite before creating output', () => {
  for (const indicators of [{ CI: 'true', GITHUB_ACTIONS: 'true' }, { CI: 'false', GITHUB_ACTIONS: 'true' }]) {
    for (const args of [['davebench'], ['davebench:terminal'], ['davebench:native-png'], ['drawing:correctness'], ['mermaid:fidelity'], ['versions'], ['prepare', '--catalog', 'catalog/mermaid-community.json'], ['mermaid:install', '--dir'], ['upstream:prepare'], ['test']]) {
      const out = join(temp.dir(), 'must-not-exist')
      const result = run(args.includes('--dir') ? [...args, out] : [...args, '--out', out], indicators)
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('excluded from CI')
      expect(existsSync(out)).toBe(false)
    }
  }
})

test('removed legacy commands are unknown rather than silently admitted', () => {
  for (const args of [['bench', '--list'], ['support'], ['community:update', '--help'], ['portable'], ['build'], ['run', '--help'], ['results:publish'], ['measurements', '--list'], ['timing:browser', '--help'], ['docs:png']]) {
    const result = run(args)
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Unknown Trident command')
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
