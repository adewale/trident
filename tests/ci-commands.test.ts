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

test('CI runs deterministic checks, help, support and a no-acquisition campaign plan without an oracle', () => {
  for (const args of [['lint'], ['typecheck'], ['results:snapshot', '--check'], ['support'], ['community:update', '--help'], ['bench', '--projects', 'mermaid-js/mermaid', '--plan']]) {
    const result = run(args)
    expect({ args, status: result.status, stderr: result.stderr }).toEqual({ args, status: 0, stderr: '' })
    expect(result.stderr).not.toContain('excluded from CI')
  }
}, 60_000)

test('CI still rejects measurement, artifact acquisition and the local full suite before creating output', () => {
  for (const indicators of [{ CI: 'true', GITHUB_ACTIONS: 'true' }, { CI: 'false', GITHUB_ACTIONS: 'true' }]) {
    for (const args of [['bench', '--projects', 'mermaid-js/mermaid'], ['community:update', '--projects', 'mermaid-js/mermaid', '--plan'], ['mermaid:install', '--dir'], ['upstream:prepare'], ['portable'], ['docs:png'], ['test']]) {
      const out = join(temp.dir(), 'must-not-exist')
      const result = run(args.includes('--dir') ? [...args, out] : [...args, '--out', out], indicators)
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('excluded from CI')
      expect(existsSync(out)).toBe(false)
    }
  }
})
