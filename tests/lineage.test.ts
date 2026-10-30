import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { comparisonProjects, lineageInventory, lineageMarkdown, type LineageCatalog } from '../unified/lineage.ts'
import { lineageDiagram } from '../unified/lineage-diagram.ts'

const node = (id: string, extra: object = {}) => ({ id, outputs: ['svg'], roles: ['peer'], ...extra })
test('non-renderers and explicit catalogue exclusions cannot be enabled as descendant investigations', async () => {
  const { projectSupport } = await import('../unified/support.ts')
  const { releaseSelectionProjects } = await import('../unified/benchmark.ts')
  const nodes = [node('validator', { outputs: ['diagnostics'] }), node('formatter', { outputs: ['mermaid-text'] }), node('converter', { outputs: ['excalidraw'] }), node('removed', { comparisonScope: { kind: 'catalog-only', reason: 'Explicit project selection' } }), node('renderer', { outputs: ['svg', 'diagnostics'] }), node('terminal', { outputs: ['ascii-unicode'] }), node('native', { outputs: ['png'] })]
  for (const override of [false, true]) {
    expect(comparisonProjects({ nodes }, nodes.map(node => node.id), override).included).toEqual(['native', 'renderer', 'terminal'])
    expect(releaseSelectionProjects({ nodes }, nodes.map(node => node.id), override)).toEqual(['native', 'renderer', 'terminal'])
  }
  for (const entry of nodes.slice(0, 4)) expect(Object.values(projectSupport(entry).suites).every(cell => cell.state === 'out-of-scope')).toBe(true)
})

test('the measured diagram covers every selected renderer and omits the twelve removals and validator-only Rusty', () => {
  const catalog = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8')) as LineageCatalog
  const removed = ['excalidraw/mermaid-to-excalidraw', 'aj-archipelago/merval', 'chenyanchen/mermaid-formatter', 'inkeep/visimer', 'neongreen/mermaid-ast', 'probelabs/maid', 'taoche/mermaid-reactflow-render', 'kingsword09/mermansi', 'zhenhuaa/mdv', '4nkitd/opencode-merman', 'npm:tui-mermaid', 'xl0/lovely-mermaid', 'justsml/rusty-mermaid']
  const selection = comparisonProjects(catalog, catalog.nodes.map(node => node.id)), diagram = lineageDiagram(catalog)
  expect(readFileSync(new URL('../docs/lineage-overview.mmd', import.meta.url), 'utf8')).toBe(diagram)
  expect(selection.included).toHaveLength(27)
  for (const id of removed) {
    expect(selection.included).not.toContain(id)
    expect(comparisonProjects(catalog, [id], true).included).toEqual([])
    expect(diagram).not.toContain('%% ' + id + '\n')
  }
  for (const id of selection.included) expect(diagram.split('\n').filter(line => line.trim() === '%% ' + id)).toHaveLength(1)
  expect(diagram).toContain('Mermaid Flutter<br/>PNG')
  expect(diagram).toContain('Mermaid Dart<br/>SVG')
  expect(diagram).toContain('Mermaid ASCII<br/>terminal')
  expect(diagram).toContain('VitePress Plugin Diagram<br/>SVG')
  expect(diagram).toContain('|derivative|')
  expect(diagram).toContain('|ASCII component port|')
})
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
  expect(result.entities).toBe(89)
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

test('catalog scope retains discovery while selecting only the 27 requested renderers', () => {
  const catalog = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8')) as LineageCatalog
  const inventory = lineageInventory(catalog)
  expect(inventory.entities).toBe(89)
  expect(inventory.excludedProjects).toHaveLength(62)
  for (const id of ['tomoyukim/vscode-mermaid-editor', 'mermaid-js/mermaid-live-editor', 'gotoailab/modern_mermaid']) expect(inventory.nodes.find(entry => entry.project === id)?.exclusionReasons).toContain('application-workflow')
  for (const id of ['orestesgaolin/mermaid', 'pub:mermaid_flutter', 'adewale/agentic-mermaid', 'obsidianmd/pele']) expect(inventory.nodes.find(entry => entry.project === id)?.excludedFromComparison).toBe(false)
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

// CI rejects measurement commands at the launcher; local checks reach selection.
test.skipIf(Boolean(process.env.CI || process.env.GITHUB_ACTIONS))('both public CLIs enforce exclusions before preparation and the plan records the override', async () => {
  const { mkdtempSync, writeFileSync, existsSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join, resolve } = await import('node:path')
  const { spawnSync } = await import('node:child_process')
  const directory = mkdtempSync(join(tmpdir(), 'trident-brand-selection-'))
  try {
    const catalog = join(directory, 'catalog.json'), out = join(directory, 'must-not-prepare')
    writeFileSync(catalog, JSON.stringify({ nodes: [node('root'), node('unbranded', { relation: 'fork', parent: 'root', vsParent: { ahead: 900, behind: 0 } }), node('editor', { comparisonScope: { kind: 'application', reason: 'Whole editor workflow' } }), node('validator', { outputs: ['diagnostics'] }), node('excluded', { comparisonScope: { kind: 'catalog-only', reason: 'Explicit project selection' } })] }))
    const command = resolve(import.meta.dir, '../commands.ts')
    const run = (args: string[]) => spawnSync(process.execPath, [command, ...args], { encoding: 'utf8', timeout: 10000 })
    const requested = ['unbranded', 'editor', 'validator', 'excluded']
    const planned = run(['bench', '--projects', requested.join(','), '--community-catalog', catalog, '--plan'])
    expect(planned.status).toBe(0)
    const plan = JSON.parse(planned.stdout)
    expect(plan.selection).toEqual([])
    expect(plan.comparisonSelection.excluded.find((entry: any) => entry.project === 'unbranded').exclusionReasons).toContain('no-distinct-branding')
    const override = run(['bench', '--projects', requested.join(','), '--community-catalog', catalog, '--include-excluded-descendants', '--plan'])
    expect(override.status).toBe(0)
    const overridden = JSON.parse(override.stdout)
    expect(overridden).toMatchObject({ selection: ['unbranded'], comparisonSelection: { includeExcluded: true } })
    for (const [project, reason] of [['editor', 'application-workflow'], ['validator', 'non-renderer'], ['excluded', 'catalog-only']]) expect(overridden.comparisonSelection.excluded.find((entry: any) => entry.project === project).exclusionReasons).toContain(reason)
    const listing = run(['bench', '--all-projects', '--community-catalog', catalog, '--list'])
    expect(listing.status).toBe(0)
    expect(JSON.parse(listing.stdout).projects).toEqual(['root'])
    for (const project of requested) {
      const investigation = project === 'unbranded' ? [] : ['--include-excluded-descendants']
      for (const args of [['bench', '--projects', project, '--community-catalog', catalog, '--out', out, ...investigation], ['community:update', '--projects', project, '--catalog', catalog, '--out', out, ...investigation]]) {
        const rejected = run(args)
        expect(rejected.status).not.toBe(0)
        expect(rejected.stderr).toContain('No projects remain after scope/lineage/branding exclusions')
        expect(existsSync(out)).toBe(false)
      }
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}, 30000)

test('maintainer lineage corrections preserve a derivative relationship and the Mermaid Dart brand', () => {
  const catalog = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8')) as LineageCatalog
  const result = lineageInventory(catalog)
  expect(result.nodes.find(node => node.project === 'lukilabs/beautiful-mermaid')).toMatchObject({ parent: 'mermaid-js/mermaid', relation: 'derivative', excludedFromComparison: false })
  expect(result.relationships.find(edge => edge.from === 'lukilabs/beautiful-mermaid' && edge.to === 'AlexanderGrooff/mermaid-ascii')?.relation).toBe('component-port')
  expect(result.nodes.find(node => node.project === 'orestesgaolin/mermaid')).toMatchObject({ branding: { distinct: true, name: 'Mermaid Dart' }, excludedFromComparison: false })
})


test('Dart and Flutter are distinct eligible brands with separate outputs and shared-core ancestry', () => {
  const catalog = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8'))
  const inventory = lineageInventory(catalog)
  const dart = catalog.nodes.find((node: any) => node.id === 'orestesgaolin/mermaid')
  const flutter = catalog.nodes.find((node: any) => node.id === 'pub:mermaid_flutter')
  expect(dart.outputs).toEqual(['svg'])
  expect(dart.packages.map((pkg: any) => pkg.name)).toEqual(['mermaid_core'])
  expect(flutter.outputs).toEqual(['png'])
  expect(flutter.packages.map((pkg: any) => pkg.name)).toEqual(['mermaid_flutter'])
  expect(inventory.nodes.find(node => node.project === flutter.id)).toMatchObject({ parent: dart.id, relation: 'native-renderer', branding: { distinct: true, name: 'Mermaid Flutter' }, excludedFromComparison: false })
  expect(comparisonProjects(catalog, [dart.id, flutter.id]).included).toEqual([dart.id, flutter.id].sort())
  expect(lineageMarkdown(inventory)).toContain('pub:mermaid_flutter [native-renderer')
})
