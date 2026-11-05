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

// CI rejects measurement commands at the launcher; local checks reach selection.

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
