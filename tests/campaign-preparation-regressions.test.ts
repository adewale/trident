import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { reconcileCampaignBrowsers, loadCampaignPreparation } from '../unified/campaign-preparation.ts'
import { projectPackageIdentity } from '../unified/project-update.ts'
import { resolveReleaseCatalog } from '../unified/release-selection.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import type { CommunityNode, PreparedCommunity } from '../unified/community-types.ts'
import type { PreparedCommunityBrowser } from '../unified/community-browser.ts'

const temp = useTempDirs('trident-canonical-browser-')
const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
const write = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value))
function fixture() {
  const root = temp.dir()
  const node: CommunityNode = { id: 'fixture/renderer', roles: ['renderer'], outputs: ['svg'], benchmark: { adapter: 'declared', package: 'fixture-renderer', version: '2.0.0', outputs: ['svg'], api: { svg: { export: 'render' } } } }
  const artifact = (version: string) => {
    const directory = join(root, version); mkdirSync(directory)
    write(join(directory, 'package.json'), { name: 'fixture-renderer', version, type: 'module' })
    const module = join(directory, 'bundle.js'); writeFileSync(module, 'globalThis.fixtureRender=()=>"<svg/>"')
    return { kind: 'node' as const, root: directory, module, version, sha256: sha(module), files: [{ path: module, sha256: sha(module) }] }
  }
  const current = artifact('2.0.0'), old = artifact('1.0.0'), prepared: PreparedCommunity = { node, artifact: current }
  const browser = (primary = current): PreparedCommunityBrowser => ({ node, artifact: primary, browserStatus: 'prepared', browser: { root: primary.root, entry: 'bundle.js', kind: 'function', global: 'fixtureRender', version: primary.version, artifactSha256: primary.sha256, files: primary.files } })
  return { root, node, current, old, prepared, browser }
}

test('release resolution retains observed-only catalog entries without acquisition or a crash', async () => {
  let calls = 0
  const node: CommunityNode = { id: 'fixture/observed', roles: ['observed'], outputs: ['svg'] }
  const resolved = await resolveReleaseCatalog({ nodes: [node] }, [node.id], '2026-01-01', temp.dir(), async () => { calls++; throw Error('must not acquire') })
  expect(calls).toBe(0)
  expect(resolved.catalog.nodes).toEqual([node])
  expect(resolved.ledger).toEqual([{ project: node.id, selection: 'Catalog observation; no benchmark artifact configured' }])
})

test('a source-only CLI retains the actual reviewed head when GitHub has no releases', async () => {
  const catalog = JSON.parse(readFileSync(new URL('../catalog/mermaid-community.json', import.meta.url), 'utf8'))
  const node = catalog.nodes.find((entry: CommunityNode) => entry.id === 'pgavlin/mermaid-ascii') as CommunityNode
  expect(node.release).toBeUndefined()
  const selected = await resolveReleaseCatalog({ nodes: [node] }, [node.id], '2026-10-29T18:42:38Z', temp.dir(), async () => [])
  expect(selected.catalog.nodes[0]!.benchmark!.preparationError).toBeUndefined()
  expect((selected.ledger[0] as any).sourcePin).toBe(node.head)
})

test('canonical preparation blocks an independently valid browser from another primary release', () => {
  const f = fixture(), good = f.browser(), stale = f.browser(f.old)
  expect(reconcileCampaignBrowsers([f.prepared], [good])[0]!.browserStatus).toBe('prepared')
  const rejected = reconcileCampaignBrowsers([f.prepared], [stale])[0]!
  expect(rejected.browserStatus).toBe('blocked')
  expect(rejected.browserDetail).toContain('primary artifact differs')
  expect(rejected.browser).toBeUndefined()
  expect(rejected.artifact?.version).toBe('2.0.0')
  const staleConfig = { ...good, node: { ...f.node, benchmark: { ...f.node.benchmark!, version: '1.0.0' } } }
  expect(reconcileCampaignBrowsers([f.prepared], [staleConfig])[0]!.browserDetail).toContain('catalog/config differs')
})

test('canonical browser reconciliation preserves separate SDK versions and non-browser dispositions', () => {
  const f = fixture(), separate = f.browser()
  separate.browser = { ...separate.browser!, kind: 'merman', root: f.old.root, version: '1.0.0', artifactSha256: f.old.sha256, files: f.old.files }
  expect(reconcileCampaignBrowsers([f.prepared], [separate])[0]!.browserStatus).toBe('prepared')
  const terminal: PreparedCommunity = { node: { id: 'fixture/terminal', roles: ['renderer'], outputs: ['terminal'] }, error: 'Native preparation unavailable' }
  const rows = reconcileCampaignBrowsers([f.prepared, terminal], [{ ...terminal, error: 'Earlier preparation detail', browserStatus: 'not-applicable', browserDetail: 'No SVG interface' }])
  expect(rows.map(row => row.browserStatus)).toEqual(['blocked', 'not-applicable'])
  expect(rows[1]!.browserDetail).toBe('No SVG interface')
  expect(() => reconcileCampaignBrowsers([f.prepared], [f.browser(), f.browser()])).toThrow('unique project identities')
})

test('a loaded canonical manifest rejects stale browser ownership and changed live browser bytes', () => {
  const f = fixture(), files: Record<string, { path: string; sha256: string }> = {}
  const data = { catalog: { nodes: [f.node] }, prepared: [f.prepared], browsers: [f.browser()], inputs: { workloads: [] }, inventories: {} }
  const save = (key: string, value: unknown) => { const file = join(f.root, key + '.json'); write(file, value); files[key] = { path: key + '.json', sha256: sha(file) } }
  for (const [key, value] of Object.entries(data)) save(key, value)
  const file = join(f.root, 'preparation.json')
  const manifest = () => ({ schema: 'trident-campaign-preparation-v1', projects: [f.node.id], profile: 'full', rounds: 6, files, artifacts: [{ project: f.node.id, version: '2.0.0', identity: projectPackageIdentity(f.prepared) }] })
  write(file, manifest())
  expect(loadCampaignPreparation(file).manifest.projects).toEqual([f.node.id])
  save('browsers', [f.browser(f.old)]); write(file, manifest())
  expect(() => loadCampaignPreparation(file)).toThrow('Prepared browser selection')
  // The separately reviewed component can differ in version, but its bytes stay frozen.
  const separate = f.browser(); separate.browser = { ...separate.browser!, root: f.old.root, kind: 'merman', version: '1.0.0', artifactSha256: f.old.sha256, files: f.old.files }
  save('browsers', [separate]); write(file, manifest())
  expect(loadCampaignPreparation(file).manifest.projects).toEqual([f.node.id])
  writeFileSync(f.old.module, 'changed browser SDK bytes')
  expect(() => loadCampaignPreparation(file)).toThrow('Prepared browser selection')
})


test('identical browser metadata cannot bypass a missing or failed primary identity receipt', () => {
  const f = fixture(), files: Record<string, { path: string; sha256: string }> = {}
  const browser: PreparedCommunityBrowser = { ...f.prepared, browserStatus: 'blocked', browserDetail: 'No browser binding' }
  const save = (key: string, value: unknown) => { const file = join(f.root, key + '.json'); write(file, value); files[key] = { path: key + '.json', sha256: sha(file) } }
  for (const [key, value] of Object.entries({ catalog: { nodes: [f.node] }, prepared: [f.prepared], browsers: [browser], inputs: {}, inventories: {} })) save(key, value)
  const file = join(f.root, 'preparation.json'), identity = projectPackageIdentity(f.prepared)
  const manifest = (artifacts: unknown[]) => write(file, { schema: 'trident-campaign-preparation-v1', projects: [f.node.id], profile: 'full', rounds: 6, files, artifacts })
  manifest([{ project: f.node.id, identity }])
  expect(loadCampaignPreparation(file).manifest.projects).toEqual([f.node.id])
  manifest([])
  expect(() => loadCampaignPreparation(file)).toThrow('cover each selected project once')
  manifest([{ project: f.node.id, identity }, { project: f.node.id, identity }])
  expect(() => loadCampaignPreparation(file)).toThrow('cover each selected project once')
  // Legacy partial preparations could retain an artifact behind an error-only receipt.
  manifest([{ project: f.node.id, error: 'Primary admission failed' }])
  writeFileSync(f.current.module, 'changed primary bytes after freeze')
  expect(() => loadCampaignPreparation(file)).toThrow('owning identity receipt differ')
  manifest([{ project: f.node.id, identity }])
  expect(() => loadCampaignPreparation(file)).toThrow('digest mismatch')
  const unavailable: PreparedCommunity = { node: f.node, error: 'No primary artifact acquired' }
  save('prepared', [unavailable]); save('browsers', [{ ...unavailable, browserStatus: 'blocked', browserDetail: 'No browser binding' }])
  manifest([{ project: f.node.id, error: unavailable.error }])
  expect(loadCampaignPreparation(file).manifest.projects).toEqual([f.node.id])
})
