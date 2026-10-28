import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { mermaidOracleDirectory, mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'

const command = resolve(import.meta.dir, '../commands.ts')
const help = (args: string[]) => spawnSync(process.execPath, [command, ...args], {
  encoding: 'utf8', timeout: 10_000,
  env: { ...process.env, TRIDENT_AGENTIC_ROOT: '/missing/product-checkout', MERMAID_REFERENCE_DIR: '/missing/oracle', TRIDENT_MERMAID_ORACLE: '' },
})

test('public help and artifact help require no product checkout, oracle or compiled kit', () => {
  const result = help(['--help'])
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
  expect(result.stdout).toContain('community:update')
  expect(result.stdout).not.toContain('TRIDENT_AGENTIC_ROOT')
  expect(result.stdout).not.toContain('commands.ts agentic')
  expect(result.stdout).not.toContain('commands.ts prs')
  const artifact = help(['run', '--help'])
  expect(artifact.status).toBe(0)
  expect(artifact.stdout).toContain('--artifact-root')
  const community = help(['community:update', '--help'])
  expect(community.status).toBe(0)
  expect(community.stdout).toContain('--candidate-dir')
})

test('project-specific source commands are rejected by the public CLI', () => {
  for (const args of [['adapter', 'agentic', '--help'], ['agentic', '--list'], ['source', 'bench:dave']]) {
    const result = help(args)
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Unknown Trident command')
  }
})

test('a product source environment cannot relocate Trident oracle defaults', () => {
  const ordinary = { ...process.env }
  delete ordinary.MERMAID_REFERENCE_DIR
  delete ordinary.MERMAID_UPSTREAM_DIR
  const product = { ...ordinary, TRIDENT_AGENTIC_ROOT: '/unrelated/product', AM_BENCH_REPOSITORY_ROOT: '/different/product' }
  expect(mermaidOracleDirectory(product)).toBe(mermaidOracleDirectory(ordinary))
  expect(mermaidUpstreamDirectory(product)).toBe(mermaidUpstreamDirectory(ordinary))
})
