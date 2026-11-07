import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { mermaidOracleDirectory, mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'

const command = resolve(import.meta.dir, '../commands.ts')
const help = (args: string[]) => spawnSync(process.execPath, [command, ...args], {
  // Match the existing CI subprocess budget; help loads cold Bun modules, not a renderer.
  encoding: 'utf8', timeout: 20_000,
  env: { ...process.env, TRIDENT_AGENTIC_ROOT: '/missing/product-checkout', MERMAID_REFERENCE_DIR: '/missing/oracle', TRIDENT_MERMAID_ORACLE: '' },
})

test('public help and command help require no product checkout or oracle', () => {
  const result = help(['--help'])
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
  for (const name of ['davebench', 'drawing:correctness', 'mermaid:fidelity', 'campaign:results', 'results:snapshot', 'versions', 'prepare']) expect(result.stdout).toContain(name)
  expect(result.stdout).not.toContain('TRIDENT_AGENTIC_ROOT')
  expect(result.stdout).not.toContain('commands.ts agentic')
  expect(result.stdout).not.toContain('commands.ts prs')
  for (const [args, expected] of [[['davebench', '--help'], '--prepared'], [['davebench:terminal', '--help'], '--prepared'], [['drawing:correctness', '--help'], '--terminal-prepared'], [['mermaid:fidelity', '--help'], '--upstream'], [['campaign:results', '--help'], '--images'], [['versions', '--help'], '--out'], [['prepare', '--help'], '--catalog'], [['upstream:prepare', '--help'], '--runtime']] as const) {
    const out = help([...args])
    expect({ args, status: out.status, stderr: out.stderr }).toEqual({ args, status: 0, stderr: '' })
    expect(out.stdout).toContain(expected)
  }
}, 60_000)

test('project-specific source commands are rejected by the public CLI', () => {
  for (const args of [['adapter', 'agentic', '--help'], ['agentic', '--list'], ['source', 'bench:dave'], ['editor:verify', '--help']]) {
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

test('release version needs no renderer, oracle or compiled kit', () => {
  const result = help(['--version'])
  expect(result.status).toBe(0)
  expect(result.stdout.trim()).toBe('Trident 0.2.1')
})

test('reading a campaign in CI needs neither an oracle nor execution configuration', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'trident-report-command-'))
  try {
    const result = spawnSync(process.execPath, [command, 'campaign:results', '--images', resolve(import.meta.dir, '../results/release/images.json'), '--terminal', resolve(import.meta.dir, '../results/release/terminal.json'), '--out', resolve(root, 'report')], { encoding: 'utf8', timeout: 20_000, env: { ...process.env, CI: 'true', MERMAID_REFERENCE_DIR: '/missing/oracle', TRIDENT_RENDERER_MEMORY_MB: 'NaN' } })
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
  } finally { rmSync(root, { recursive: true, force: true }) }
})
