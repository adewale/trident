import { expect, test } from 'bun:test'
import { assertCurrentBenchmarkArtifact, latestBenchmarkRenderingArtifact, refreshBenchmarkVersions, versionChanges } from '../unified/benchmark-versions.ts'
import { extraPackagePreparation } from '../unified/community-extra-adapters.mjs'
import type { CommunityNode } from '../unified/community-types.ts'

const node = <T extends object = object>(id: string, benchmark: any, extra: T = {} as T): CommunityNode & { benchmark: any } & T => ({ id, outputs: ['svg'], roles: ['observed'], benchmark, ...extra })
const npm = (version: string) => ({ 'dist-tags': { latest: version }, versions: { [version]: { dist: { integrity: 'sha512-fixture' } } }, time: { [version]: '2026-11-01' } })

test('fresh selection replaces old pins, keeps Mermaid at the oracle pin, freezes companions and leaves historical catalog untouched', async () => {
  const { MERMAID_ORACLE_PIN } = await import('../portable/mermaid-oracle.ts')
  const original = { nodes: [node('fixture/peer', { adapter: 'published-extra', package: 'peer', version: '1.0.0', operationPackages: [{ package: 'helper', version: '1.0.0', operation: 'layout' }] }), node('mermaid-js/mermaid', { adapter: 'mermaid', package: 'mermaid', version: '1.0.0' })] }
  const result = await refreshBenchmarkVersions(original, original.nodes.map(n => n.id), { json: async url => (url.endsWith('/mermaid') ? npm(MERMAID_ORACLE_PIN.version) : npm(url.endsWith('/helper') ? '3.0.0' : '2.0.0')), refs: async () => { throw Error('Unexpected source call') } })
  expect(result.report.complete).toBe(true)
  expect(result.catalog.nodes.map(n => n.benchmark.version)).toEqual(['2.0.0', MERMAID_ORACLE_PIN.version])
  expect(result.catalog.nodes[0]!.benchmark.operationPackages[0].version).toBe('3.0.0')
  expect(original.nodes[0]!.benchmark.version).toBe('1.0.0')
  expect(original.nodes[0]!.benchmark.operationPackages[0].version).toBe('1.0.0')
})

test('release selection dereferences annotated stable tags rather than selecting a prerelease', async () => {
  const sha = 'a'.repeat(40), peeled = 'b'.repeat(40)
  const original = { nodes: [node('fixture/cli', { adapter: 'source-cli' })] }
  const result = await refreshBenchmarkVersions(original, ['fixture/cli'], { json: async () => { throw Error('Unexpected registry call') }, refs: async () => `${sha}\trefs/tags/v1.0.0\n${sha}\trefs/tags/v2.0.0\n${peeled}\trefs/tags/v2.0.0^{}\n${sha}\trefs/tags/v3.0.0-rc.1\n` })
  expect(result.report.complete).toBe(true)
  expect(result.catalog.nodes[0]!.release).toEqual({ tag: 'v2.0.0', commit: peeled })
})

test('a repository-hosted distribution follows current shipped files even when its version number has not changed', async () => {
  const original = { nodes: [node('fixture/franken', { adapter: 'franken' }, { distribution: { version: '2.0.0', revision: 'a'.repeat(40), wasmSha256: 'obsolete' } })] }
  const result = await refreshBenchmarkVersions(original, ['fixture/franken'], { json: async () => ({ version: '2.0.0' }), refs: async (_repo, pattern) => { expect(pattern).toBe('HEAD'); return `${'b'.repeat(40)}\tHEAD\n` } })
  expect(result.report.complete).toBe(true)
  expect(result.catalog.nodes[0]!.distribution.revision).toBe('b'.repeat(40))
  expect(result.catalog.nodes[0]!.distribution).not.toHaveProperty('wasmSha256')
})

test('registry errors and newly published unbound CLIs block selection rather than silently reusing old releases', async () => {
  const original = { nodes: [node('fixture/npm', { adapter: 'published-extra', package: 'peer', version: '1.0.0' }), node('fixture/cli', { adapter: 'source-cli', cliRelease: { repository: 'fixture/cli', version: '1.0.0', revision: 'a'.repeat(40) } })] }
  const result = await refreshBenchmarkVersions(original, original.nodes.map(n => n.id), { json: async () => { throw Error('registry offline') }, refs: async () => `${'b'.repeat(40)}\trefs/tags/v2.0.0\n` })
  expect(result.report.complete).toBe(false)
  expect(result.catalog.nodes[0]!.benchmark.preparationError).toContain('registry offline')
  expect(result.catalog.nodes[1]!.benchmark.preparationError).toContain('refusing the old CLI')
})

test('cached packages, source revisions and pipeline companions must match newly selected artifacts', () => {
  const selected = node('fixture/peer', { adapter: 'published-extra', package: 'peer', version: '2.0.0', operationPackages: [{ package: 'helper', version: '2.0.0' }] })
  const peer: any = { node: selected, artifact: { kind: 'node', version: '1.0.0' } }
  expect(() => assertCurrentBenchmarkArtifact(peer, selected)).toThrow('stale prepared artifact')
  peer.artifact.version = '2.0.0'
  expect(() => assertCurrentBenchmarkArtifact(peer, selected)).toThrow('prepared companion')
  peer.artifact.adapterCompanions = [{ name: 'helper', version: '2.0.0' }]
  expect(() => assertCurrentBenchmarkArtifact(peer, selected)).not.toThrow()
  peer.browser = { version: '1.0.0' }
  expect(() => assertCurrentBenchmarkArtifact(peer, selected)).toThrow('prepared browser version')
  delete peer.browser
  const source = node('fixture/source', { adapter: 'extra-source', sourcePin: 'b'.repeat(40) })
  expect(() => assertCurrentBenchmarkArtifact({ node: source, artifact: { kind: 'node', version: 'git-fixture', sourceRevision: 'a'.repeat(40) } }, source)).toThrow('source revision differs')
  const cli = node('fixture/native', { adapter: 'published-extra', package: 'native', version: '2.0.0', cliRelease: { version: '2.0.0', revision: 'b'.repeat(40) } })
  expect(() => assertCurrentBenchmarkArtifact({ node: cli, artifact: { kind: 'node', version: '2.0.0', additionalCli: [{ id: 'native-release', outputs: ['terminal'], artifact: { kind: 'cli', version: '1.0.0', revision: 'a'.repeat(40) } }] } }, cli)).toThrow('prepared native CLI')
})

test('source-only projects resolve current HEAD without inventing a release version', async () => {
  const original = { nodes: [node('fixture/source', { adapter: 'extra-source', sourcePin: 'a'.repeat(40) })] }
  const result = await refreshBenchmarkVersions(original, ['fixture/source'], { json: async () => ({}), refs: async () => `${'b'.repeat(40)}\tHEAD\n` })
  expect(result.catalog.nodes[0]!.benchmark.sourcePin).toBe('b'.repeat(40))
  expect(result.report.rows[0]!.registry).toBe('source-head')
  expect(result.report.rows[0]!.version).toBeUndefined()
})

test('the Crafter preparation installs selected companion versions rather than historical recipe constants', () => {
  const plan = extraPackagePreparation('@crafter/mermaid-renderer', { operationPackages: [{ package: '@crafter/mermaid-layout', version: '0.0.4' }, { package: '@crafter/mermaid-themes', version: '0.0.4' }] })
  expect(plan.companions).toContain('@crafter/mermaid-layout@0.0.4')
  expect(plan.companions).toContain('@crafter/mermaid-themes@0.0.4')
  expect(plan.overrides!['@crafter/mermaid-cli']['@crafter/mermaid-layout']).toBe('0.0.4')
})

test('a newer native rendering release replaces an older SDK and an unavailable new CLI cannot fall back to the old SDK', () => {
  const native: any = { kind: 'cli', version: '0.9.3', revision: 'b'.repeat(40) }
  const peer: any = { node: node('fixture/merman', { adapter: 'merman', version: '0.9.2', cliRelease: { version: '0.9.3', revision: native.revision, outputs: { svg: {}, png: {} } } }), artifact: { kind: 'node', version: '0.9.2', additionalCli: [{ id: 'native-release', artifact: native }] } }
  expect(latestBenchmarkRenderingArtifact(peer)).toBe(native)
  expect(() => assertCurrentBenchmarkArtifact({ node: peer.node, artifact: native }, peer.node)).not.toThrow()
  peer.artifact.additionalCli = []
  expect(() => latestBenchmarkRenderingArtifact(peer)).toThrow('refusing older SDK')
})

test('versions --since lists only the selected projects whose frozen artifact changed', () => {
  const node = (id: string, benchmark: any, extra: any = {}) => ({ id, benchmark, ...extra }) as any
  const before = { nodes: [node('a', { version: '1.0.0' }), node('b', { version: '2.0.0' }), node('c', { sourcePin: 'x'.repeat(40) }), node('d', { adapter: 'franken' }, { distribution: { version: '0.4.0' } }), node('e', { version: '1.0.0' })] }
  const after = { nodes: [node('a', { version: '1.0.0' }), node('b', { version: '2.1.0' }), node('c', { sourcePin: 'y'.repeat(40) }), node('d', { adapter: 'franken' }, { distribution: { version: '0.5.0' } }), node('e', { version: '9.9.9' })] }
  expect(versionChanges(before, after, ['a', 'b', 'c', 'd'])).toEqual([{ project: 'b', previous: '2.0.0', current: '2.1.0' }, { project: 'c', previous: 'x'.repeat(40), current: 'y'.repeat(40) }, { project: 'd', previous: '0.4.0', current: '0.5.0' }])
})

test("Mermaid's row stays at the oracle pin and its newest release is only reported", async () => {
  const { MERMAID_ORACLE_PIN } = await import('../portable/mermaid-oracle.ts')
  const pin = MERMAID_ORACLE_PIN.version
  const catalog = { nodes: [{ id: 'mermaid-js/mermaid', benchmark: { adapter: 'mermaid', package: 'mermaid', outputs: ['svg'], version: '12.1.0' }, packages: [{ name: 'mermaid', version: '12.1.0' }] }] } as any
  const registry = { 'dist-tags': { latest: '99.0.0' }, versions: { [pin]: { dist: { integrity: 'sha512-pin' } }, '99.0.0': { dist: { integrity: 'sha512-new' } } }, time: { [pin]: '2026-10-01T00:00:00Z' } }
  const result = await refreshBenchmarkVersions(catalog, ['mermaid-js/mermaid'], { json: async () => registry, refs: async () => { throw Error('Unexpected source call') } })
  expect(result.catalog.nodes[0].benchmark.version).toBe(pin)
  expect(result.catalog.nodes[0].packages[0].version).toBe(pin)
  expect(result.report.rows[0]).toMatchObject({ registry: 'oracle-pin', version: pin, previousVersion: '12.1.0', latestPublished: '99.0.0', integrity: 'sha512-pin' })
})
