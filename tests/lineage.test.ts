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

test('application workflows stay outside core comparisons even under the descendant override', async () => {
  const { projectSupport } = await import('../unified/support.ts')
  const application = node('fixture/editor', { comparisonScope: { kind: 'application', reason: 'Whole editor workflow' } })
  const catalog = { nodes: [node('fixture/renderer'), application] }
  const selected = comparisonProjects(catalog, catalog.nodes.map(entry => entry.id), true)
  expect(selected.included).toEqual(['fixture/renderer'])
  expect(selected.excluded[0]?.exclusionReasons).toEqual(['application-workflow'])
  expect(Object.values(projectSupport(application).suites).every(cell => cell.state === 'out-of-scope')).toBe(true)
  expect(projectSupport(application).missingOutputBindings).toEqual([])
})

test('catalog editor exclusions retain discovery and keep direct native/output/conversion interfaces eligible', () => {
  const catalog = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8')) as LineageCatalog
  const inventory = lineageInventory(catalog)
  expect(inventory.entities).toBe(88)
  expect(inventory.excludedProjects).toHaveLength(49)
  for (const id of ['tomoyukim/vscode-mermaid-editor', 'mermaid-js/mermaid-live-editor', 'gotoailab/modern_mermaid']) expect(inventory.nodes.find(entry => entry.project === id)?.exclusionReasons).toContain('application-workflow')
  for (const id of ['orestesgaolin/mermaid', 'excalidraw/mermaid-to-excalidraw', 'adewale/agentic-mermaid', 'obsidianmd/pele']) expect(inventory.nodes.find(entry => entry.project === id)?.excludedFromComparison).toBe(false)
})

test('explicit application support verification fails before preparation or oracle acquisition', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { verifySupport } = await import('../unified/support-verification.ts')
  const directory = mkdtempSync(join(tmpdir(), 'trident-scope-'))
  try {
    const catalog = join(directory, 'catalog.json')
    writeFileSync(catalog, JSON.stringify({ nodes: [node('fixture/editor', { comparisonScope: { kind: 'application', reason: 'Whole editor workflow' } })] }))
    await expect(verifySupport(join(directory, 'missing-prepared.json'), join(directory, 'out'), { catalog, projects: ['fixture/editor'] })).rejects.toThrow('outside core support verification')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('both public CLIs enforce exclusions before preparation and the plan records the override', async () => {
  const { mkdtempSync, writeFileSync, existsSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join, resolve } = await import('node:path')
  const { spawnSync } = await import('node:child_process')
  const directory = mkdtempSync(join(tmpdir(), 'trident-brand-selection-'))
  try {
    const catalog = join(directory, 'catalog.json'), out = join(directory, 'must-not-prepare')
    writeFileSync(catalog, JSON.stringify({ nodes: [node('root'), node('unbranded', { relation: 'fork', parent: 'root', vsParent: { ahead: 900, behind: 0 } }), node('editor', { comparisonScope: { kind: 'application', reason: 'Whole editor workflow' } })] }))
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
    const editorPlan = run(['bench', '--projects', 'editor', '--community-catalog', catalog, '--include-excluded-descendants', '--plan'])
    expect(editorPlan.status).toBe(0)
    expect(JSON.parse(editorPlan.stdout).selection).toEqual([])
    expect(JSON.parse(editorPlan.stdout).comparisonSelection.excluded[0].exclusionReasons).toContain('application-workflow')
    for (const args of [['bench', '--projects', 'unbranded', '--community-catalog', catalog, '--out', out], ['community:update', '--projects', 'unbranded', '--catalog', catalog, '--out', out], ['bench', '--projects', 'editor', '--community-catalog', catalog, '--out', out, '--include-excluded-descendants'], ['community:update', '--projects', 'editor', '--catalog', catalog, '--out', out, '--include-excluded-descendants']]) {
      const rejected = run(args)
      expect(rejected.status).not.toBe(0)
      expect(rejected.stderr).toContain('No projects remain after scope/lineage/branding exclusions')
      expect(existsSync(out)).toBe(false)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('maintainer lineage corrections preserve a derivative relationship and the Mermaid Dart brand', () => {
  const catalog = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8')) as LineageCatalog
  const result = lineageInventory(catalog)
  expect(result.nodes.find(node => node.project === 'lukilabs/beautiful-mermaid')).toMatchObject({ parent: 'mermaid-js/mermaid', relation: 'derivative', excludedFromComparison: false })
  expect(result.relationships.find(edge => edge.from === 'lukilabs/beautiful-mermaid' && edge.to === 'AlexanderGrooff/mermaid-ascii')?.relation).toBe('component-port')
  expect(result.nodes.find(node => node.project === 'orestesgaolin/mermaid')).toMatchObject({ branding: { distinct: true, name: 'Mermaid Dart' }, excludedFromComparison: false })
})
