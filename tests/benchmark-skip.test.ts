import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { comparisonProjects } from '../unified/lineage.ts'
import { prepareCommunity } from '../unified/community.ts'
import { projectSupport } from '../unified/support.ts'
import { verifySupport } from '../unified/support-verification.ts'

const paused = { id: 'fixture/broken', roles: ['parser'], outputs: ['diagnostics'], benchmark: { adapter: 'published-extra', package: 'fixture-do-not-acquire', version: '1.0.0', outputs: ['diagnostics'], skip: { version: '1.0.0', reason: 'Published runtime missing' } } }
test('a release pause skips before acquisition, survives descendant overrides, and permits a separately selected candidate', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-release-skip-'))
  try {
    const catalog = join(root, 'catalog.json'), out = join(root, 'must-not-prepare')
    writeFileSync(catalog, JSON.stringify({ nodes: [paused] }))
    for (const override of [false, true]) {
      const result = comparisonProjects({ nodes: [paused] }, [paused.id], override)
      expect(result.included).toEqual([])
      expect(result.excluded[0]?.exclusionReasons).toContain('disabled-release')
      expect(result.excluded[0]?.comparison).toContain('Published runtime missing')
      expect(comparisonProjects({ nodes: [paused] }, [paused.id], override, paused.id).included).toEqual([paused.id])
    }
    expect(comparisonProjects({ nodes: [{ ...paused, benchmark: { ...paused.benchmark, version: '1.0.1' } }] }, [paused.id]).included).toEqual([paused.id])
    expect(projectSupport(paused).suites.community).toEqual({ state: 'disabled', reason: 'Published runtime missing' })
    const options = { root, harnessRoot: root, out, rounds: 1, profile: 'smoke' as const, communityCatalogFile: catalog, communityProjects: [paused.id], communityPreparedFile: join(root, 'missing-prepared.json') }
    await expect(prepareCommunity(options)).rejects.toThrow('Benchmark release skipped')
    await expect(verifySupport(options.communityPreparedFile, out, { catalog, projects: [paused.id] })).rejects.toThrow('Benchmark release skipped')
    const command = resolve(import.meta.dir, '../commands.ts')
    const run = (args: string[]) => spawnSync(process.execPath, [command, ...args], { encoding: 'utf8', timeout: 10000 })
    const plan = run(['bench', '--projects', paused.id, '--community-catalog', catalog, '--plan', '--include-excluded-descendants'])
    expect(plan.status).toBe(0)
    expect(JSON.parse(plan.stdout).selection).toEqual([])
    expect(JSON.parse(plan.stdout).comparisonSelection.excluded[0].comparison).toContain('Published runtime missing')
    for (const args of [
      ['bench', '--projects', paused.id, '--community-catalog', catalog, '--out', out],
      ['community:update', '--projects', paused.id, '--catalog', catalog, '--out', out, '--include-excluded-descendants'],
    ]) {
      const result = run(args)
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('Published runtime missing')
    }
    expect(existsSync(out)).toBe(false)
    const actual = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8'))
    const requested = actual.nodes.map((node: { id: string }) => node.id)
    const selected = comparisonProjects(actual, requested)
    expect(selected.included).toHaveLength(38)
    expect(selected.included).not.toContain('justsml/rusty-mermaid')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
