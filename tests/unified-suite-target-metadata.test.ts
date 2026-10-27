import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseOptions } from '../unified/run.ts'
import { benchmarkSuites } from '../unified/suites.ts'

test('artifact release scope and extracted peer protocols retain distinct driver and target identity', () => {
  const directory = mkdtempSync(join(tmpdir(), 'am-suite-target-'))
  try {
    const driver = join(directory, 'driver'),
      target = join(directory, 'target')
    for (const path of ['src/__tests__', 'docs/project', 'eval/benchmark', 'eval/mermaid-upstream-suite-bench', 'e2e']) mkdirSync(join(driver, path), { recursive: true })
    mkdirSync(target)
    writeFileSync(join(driver, 'package.json'), JSON.stringify({ scripts: { 'bench:release:browser': 'bun run eval/benchmark/release-browser-bench.ts', 'bench:endpoint-marker': 'bun run eval/benchmark/endpoint-marker-compare.ts', 'bench:performance-profile': 'bun run eval/benchmark/qualify-performance-profile.ts' } }))
    writeFileSync(join(driver, 'docs/project/upstream-mermaid-policy.json'), JSON.stringify({ pin: { version: 'fixture', commit: 'fixture' } }))
    writeFileSync(join(driver, 'eval/mermaid-upstream-suite-bench/manifest.json'), JSON.stringify({ upstream: { revision: 'fixture' } }))
    writeFileSync(join(driver, 'eval/benchmark/qualify-peer-performance.ts'), 'throw new Error("Qualification requires exact artifacts before execution")')
    for (const file of ['endpoint-marker-compare.ts', 'qualify-performance-profile.ts']) writeFileSync(join(driver, 'eval/benchmark', file), 'throw new Error("Diagnostic must not run without its declared inputs")')
    writeFileSync(join(driver, 'e2e/dist-artifact.e2e.test.ts'), 'throw new Error("Discovery must not execute an owning product test")')
    const options = { ...parseOptions([]), harnessRoot: driver, root: target }
    const suites = benchmarkSuites(options)
    const distribution = suites.find(suite => suite.id === 'distribution-dist-artifact')!
    expect(distribution).toBeDefined()
    expect(distribution.kind).toBe('test')
    expect(distribution.source).toBe('e2e/dist-artifact.e2e.test.ts')
    expect(distribution.cwd).toBe(join(driver, 'e2e'))
    expect(distribution.command).toEqual(['bun', 'test', 'dist-artifact.e2e.test.ts', '--timeout', '400000'])
    expect(suites.some(suite => suite.id === 'distribution-dist-fuzz')).toBe(false)
    rmSync(join(driver, 'e2e/dist-artifact.e2e.test.ts'))
    expect(benchmarkSuites(options).some(suite => suite.id === 'distribution-dist-artifact')).toBe(false)
    expect(suites.find(suite => suite.id === 'release:browser')?.target).toBe('candidate')
    const endpoint = suites.find(suite => suite.id === 'endpoint-marker')!
    expect(endpoint.prerequisites.join(' ')).toContain('immutable built Agentic checkout')
    expect(endpoint.command).toContain(join(options.out, 'endpoint-marker'))
    expect(suites.find(suite => suite.id === 'performance-profile')?.command).toContain(join(options.out, 'performance-profile/report.json'))
    const peer = suites.find(suite => suite.id === 'peers:qualify')!
    expect(peer.target).toBe('driver')
    expect(peer.cwd).toBe(driver)
    expect(peer.source).toBe(join(driver, 'eval/benchmark/qualify-peer-performance.ts'))
    expect(peer.command?.slice(peer.command.indexOf('--runtime-source'), peer.command.indexOf('--runtime-source') + 2)).toEqual(['--runtime-source', target])
    expect(peer.prerequisites.some(reason => reason.includes('exact candidate tarball'))).toBe(true)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
