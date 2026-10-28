import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { comparisonProjects, lineageInventory, lineageMarkdown, type LineageCatalog } from '../unified/lineage.ts'

const node = (id: string, extra: object = {}) => ({ id, outputs: ['svg'], roles: ['peer'], ...extra })
test('lineage distinguishes historical versions, exact heads, changed forks, ports and dependencies', () => {
  const result = lineageInventory({ nodes: [node('root'), node('historical', { relation: 'fork', parent: 'root', vsParent: { ahead: 0, behind: 20 } }), node('exact', { relation: 'fork', parent: 'root', vsParent: { ahead: 0, behind: 0 } }), node('changed', { relation: 'fork', parent: 'root', vsParent: { ahead: 1, behind: 0 } }), node('port', { relation: 'independent' }), node('wrapper')], edges: [{ from: 'port', to: 'root', relation: 'port' }, { from: 'wrapper', to: 'root', relation: 'depends-on' }] })
  expect(result.duplicateCandidates).toEqual(['exact', 'historical'])
  expect(result.nodes.find(n => n.project === 'historical')?.selection).toBe('historical-version-candidate')
  expect(result.nodes.find(n => n.project === 'port')).toMatchObject({ parent: 'root', relation: 'port', catalogRelation: 'independent', selection: 'distinct-or-unresolved' })
  expect(result.nodes.find(n => n.project === 'wrapper')?.parent).toBeNull()
  expect(result.nodes.find(n => n.project === 'historical')?.comparison).toContain('No result is inherited')
})
test('invalid ancestry cannot silently vanish from the tree', () => {
  expect(() => lineageInventory({ nodes: [node('a', { parent: 'missing' })] })).toThrow('Missing lineage parent')
  expect(() => lineageInventory({ nodes: [node('a', { parent: 'b' }), node('b', { parent: 'a' })] })).toThrow('Lineage cycle')
  expect(() => lineageInventory({ nodes: [node('a')], edges: [{ from: 'missing', to: 'a', relation: 'port' }] })).toThrow('Missing lineage endpoint')
  expect(() => lineageInventory({ nodes: [node('a'), node('b')], edges: [{ from: 'a', to: 'b', relation: 'port' }, { from: 'a', to: 'b', relation: 'binding' }] })).toThrow('Conflicting lineage relations')
  expect(() => lineageInventory({ nodes: [node('a'), node('a')] })).toThrow('unique')
  expect(() => lineageInventory({ nodes: [node('a', { parent: 'b' }), node('b'), node('c')], edges: [{ from: 'a', to: 'c', relation: 'port' }] })).toThrow('Conflicting lineage')
})
test('the complete catalog tree contains every entity once and retains changed comparison projects', () => {
  const catalog = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8')) as LineageCatalog
  const result = lineageInventory(catalog), markdown = lineageMarkdown(result)
  expect(result.entities).toBe(88)
  expect(result.duplicateCandidates).toHaveLength(25)
  for (const entry of result.nodes) expect(markdown.split('\n').filter(line => line.includes('── ' + entry.project + ' ['))).toHaveLength(1)
  for (const id of ['adewale/agentic-mermaid', 'dfadler/zombie-mermaid', 'lukilabs/beautiful-mermaid', 'wevm/ondine', 'Dicklesworthstone/frankenmermaid']) expect(result.nodes.find(n => n.project === id)?.selection).toBe('distinct-or-unresolved')
})

test('branding excludes even changed descendants; explicit investigation override is visible', () => {
  const catalog = { nodes: [node('root'), node('unbranded', { relation: 'fork', parent: 'root', vsParent: { ahead: 900, behind: 0 } }), node('branded', { relation: 'fork', parent: 'root', comparisonBranding: { distinct: true, name: 'New Brand', evidence: 'Fixture public name' }, vsParent: { ahead: 1, behind: 0 } })] }
  const requested = ['root', 'unbranded', 'branded']
  const selected = comparisonProjects(catalog, requested)
  expect(selected.included).toEqual(['branded', 'root'])
  expect(selected.excluded[0]?.exclusionReasons).toContain('no-distinct-branding')
  expect(comparisonProjects(catalog, requested, true)).toMatchObject({ included: ['branded', 'root', 'unbranded'], excluded: [], includeExcluded: true })
})

test('both public CLIs enforce exclusions before preparation and the plan records the override', async () => {
  const { mkdtempSync, writeFileSync, existsSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join, resolve } = await import('node:path')
  const { spawnSync } = await import('node:child_process')
  const directory = mkdtempSync(join(tmpdir(), 'trident-brand-selection-'))
  try {
    const catalog = join(directory, 'catalog.json'), out = join(directory, 'must-not-prepare')
    writeFileSync(catalog, JSON.stringify({ nodes: [node('root'), node('unbranded', { relation: 'fork', parent: 'root', vsParent: { ahead: 900, behind: 0 } })] }))
    const command = resolve(import.meta.dir, '../commands.ts')
    const run = (args: string[]) => spawnSync(process.execPath, [command, ...args], { encoding: 'utf8', timeout: 10000 })
    const planned = run(['bench', '--projects', 'unbranded', '--community-catalog', catalog, '--plan'])
    expect(planned.status).toBe(0)
    const plan = JSON.parse(planned.stdout)
    expect(plan.selection).toEqual([])
    expect(plan.comparisonSelection.excluded[0].exclusionReasons).toContain('no-distinct-branding')
    const override = run(['bench', '--projects', 'unbranded', '--community-catalog', catalog, '--include-excluded-descendants', '--plan'])
    expect(override.status).toBe(0)
    expect(JSON.parse(override.stdout)).toMatchObject({ selection: ['unbranded'], comparisonSelection: { includeExcluded: true } })
    for (const args of [['bench', '--projects', 'unbranded', '--community-catalog', catalog, '--out', out], ['community:update', '--projects', 'unbranded', '--catalog', catalog, '--out', out]]) {
      const rejected = run(args)
      expect(rejected.status).not.toBe(0)
      expect(rejected.stderr).toContain('No projects remain after lineage/branding exclusions')
      expect(existsSync(out)).toBe(false)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
