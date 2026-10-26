import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadCurrentProjectRecords, type ProjectBenchmarkIdentity, type ProjectBenchmarkRecord, publishProjectRecord } from '../portable/project-records.ts'
import { renderCandidateComparison } from '../unified/candidate-comparison.ts'
import { assertCommunityCandidate, communityCoreWorkloads, prepareCommunity } from '../unified/community.ts'
import { prepareCommunityBrowsers } from '../unified/community-browser.ts'
import type { CommunityNode } from '../unified/community-types.ts'
import { publishResults } from '../unified/league.ts'
import { candidateIdentity, communityCandidate, updateProjectRecords } from '../unified/project-update.ts'
import { communityCatalogFile } from '../unified/trident-paths.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temp = useTempDirs('trident-candidate-')
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
const project = 'owner/fixture-renderer'
const node: CommunityNode = { id: project, roles: ['renderer'], outputs: ['svg'], benchmark: { adapter: 'declared', package: 'trident-fixture-renderer', version: '1.0.0', outputs: ['svg'], api: { svg: { export: 'render' } } } }
function pack(name: string, version: string): string {
  const source = temp.dir(),
    destination = temp.dir()
  writeFileSync(join(source, 'package.json'), JSON.stringify({ name, version, type: 'module', main: 'index.js', exports: './index.js' }))
  writeFileSync(join(source, 'index.js'), "export const render = source => '<svg xmlns=\"http://www.w3.org/2000/svg\"><text>' + source.length + '</text></svg>'\n")
  const [packed] = JSON.parse(execFileSync('npm', ['pack', source, '--ignore-scripts', '--json', '--pack-destination', destination], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
  return join(destination, packed.filename)
}
function preparation() {
  const root = temp.dir(),
    catalog = join(root, 'catalog.json')
  writeFileSync(catalog, JSON.stringify({ nodes: [node] }))
  return { root, catalog, options: { out: join(root, 'out'), root, harnessRoot: root, rounds: 1, profile: 'smoke' as const, communityCatalogFile: catalog, communityProjects: [project] } }
}

test('a candidate tarball stands in for the pinned release, verified by its SHA-256', async () => {
  const f = preparation(),
    tarball = pack('trident-fixture-renderer', '2.0.0-rc.1'),
    digest = sha256(tarball)
  const [entry] = await prepareCommunity({ ...f.options, communityCandidate: { project, tarball, sha256: digest } })
  expect(entry!.error).toBeUndefined()
  expect(entry!.artifact!.version).toBe('2.0.0-rc.1')
  expect(entry!.artifact!.candidate!.sha256).toBe(digest)
  expect(sha256(entry!.artifact!.candidate!.tarball)).toBe(digest)
  expect(entry!.artifact!.integrity).toBe('sha512-' + createHash('sha512').update(readFileSync(tarball)).digest('base64'))
  expect(entry!.artifact!.root).toContain(digest)
  expect(entry!.artifact!.detail).toContain('unreleased candidate tarball')
  const [tampered] = await prepareCommunity({ ...f.options, out: join(f.root, 'tampered'), communityCandidate: { project, tarball, sha256: '0'.repeat(64) } })
  expect(tampered!.error).toContain('differs from its supplied SHA-256')
  const other = pack('another-package', '1.0.0')
  const [renamed] = await prepareCommunity({ ...f.options, out: join(f.root, 'renamed'), communityCandidate: { project, tarball: other, sha256: sha256(other) } })
  expect(renamed!.error).toContain('holds another-package')
  // Timing loads the frozen preparation: a candidate artifact needs its own candidate run.
  const frozen = join(f.root, 'frozen.json')
  writeFileSync(frozen, JSON.stringify([entry]))
  const [outside] = await prepareCommunity({ ...f.options, out: join(f.root, 'outside'), communityPreparedFile: frozen })
  expect(outside!.error).toContain('requested candidate differ')
  const [inside] = await prepareCommunity({ ...f.options, out: join(f.root, 'inside'), communityPreparedFile: frozen, communityCandidate: { project, tarball, sha256: digest } })
  expect(inside!.error).toBeUndefined()
  expect(inside!.artifact!.version).toBe('2.0.0-rc.1')
}, 60_000)

test('candidate mode takes one npm-backed project and checks the digest before acquisition', () => {
  const catalog = JSON.parse(readFileSync(communityCatalogFile, 'utf8')).nodes as CommunityNode[]
  expect(assertCommunityCandidate(catalog, { project: 'lukilabs/beautiful-mermaid' }).benchmark!.package).toBe('beautiful-mermaid')
  expect(() => assertCommunityCandidate(catalog, { project: 'mermaid-js/mermaid' })).toThrow('pinned oracle')
  expect(() => assertCommunityCandidate(catalog, { project: 'rohitg00/beautiful-mermaid' })).toThrow('not benchmarked from an npm package')
  expect(() => assertCommunityCandidate(catalog, { project: 'pgavlin/mermaid-ascii' })).toThrow('not benchmarked from an npm package')
  const tarball = pack('trident-fixture-renderer', '2.0.0'),
    out = temp.dir(),
    options = { out, communityProjects: [project] }
  expect(communityCandidate({}, options)).toBeUndefined()
  expect(communityCandidate({ tarball, sha256: sha256(tarball) }, options)).toEqual({ project, tarball, sha256: sha256(tarball) })
  expect(() => communityCandidate({ tarball, sha256: 'f'.repeat(64) }, options)).toThrow('differs from --candidate-sha256')
  expect(() => communityCandidate({ tarball }, options)).toThrow('go together')
  expect(() => communityCandidate({ tarball, sha256: 'ABC' }, options)).toThrow('lowercase SHA-256')
  expect(() => communityCandidate({ tarball, sha256: sha256(tarball) }, { out, communityProjects: [project, 'owner/other'] })).toThrow('exactly one --projects')
  expect(() => communityCandidate({ tarball, sha256: sha256(tarball) }, { ...options, communityArtifacts: 'provided.json' })).toThrow('own tarball')
  const directory = temp.dir()
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: 'trident-fixture-renderer', version: '3.0.0-dev', scripts: { prepack: 'exit 1' } }))
  expect(() => communityCandidate({ directory, tarball }, options)).toThrow('not both')
  const packed = communityCandidate({ directory }, options)!
  expect(packed.packedFrom).toBe(directory)
  expect(packed.tarball.startsWith(join(out, 'candidate-packs'))).toBe(true)
  expect(packed.sha256).toBe(sha256(packed.tarball))
})

const evidence = () => {
  const directory = temp.dir()
  writeFileSync(join(directory, 'result.json'), '{}')
  return directory
}
const row = (caseId: string, status: 'passed' | 'failed', version: string, extra: Record<string, unknown> = {}) => ({ suite: 'community', surface: 'node:public-api', runtime: 'Node', family: 'flowchart', caseId, operation: 'render', format: 'svg', mode: 'feature-corpus-qualification', status, ...extra, metrics: { implementation: project, round: 1, version } })
function record(id: string, identity: ProjectBenchmarkIdentity, version: string, statuses: Record<string, 'passed' | 'failed'>): ProjectBenchmarkRecord {
  const observations = [row('family:flowchart', 'passed', version, { operation: 'family-support' }), ...Object.entries(statuses).map(([caseId, status]) => row(caseId, status, version))] as ProjectBenchmarkRecord['observations']
  return { schemaVersion: 1, id, identity, startedAt: '2026-10-26T00:00:00Z', finishedAt: '2026-10-26T00:01:00Z', status: observations.some(row => row.status === 'failed') ? 'failed' : 'passed', evidenceDirectory: evidence(), evidenceFiles: ['result.json'], observations, gaps: [] }
}
const base = (context = 'context.json'): ProjectBenchmarkIdentity => ({ project, protocol: { context }, artifact: { package: { artifact: { version: '1.0.0' } } }, measurement: { rounds: 1 } })
function candidateOf(identity: ProjectBenchmarkIdentity, digest: string): ProjectBenchmarkIdentity {
  const unreleased = candidateIdentity({ node, artifact: { kind: 'node', version: '1.0.0', candidate: { sha256: digest, tarball: 'candidate.tgz' } } }, { communityCandidate: { project, tarball: 'candidate.tgz', sha256: digest } }, null)!
  return { ...identity, lane: 'candidate', artifact: { candidate: unreleased, package: { artifact: { version: '1.0.0', candidate: { sha256: digest } } } } }
}

test('a candidate record is keyed by its bytes in its own lane, so it never reuses or replaces the release', async () => {
  expect(candidateIdentity({ node, artifact: { kind: 'node', version: '1.0.0' } }, {}, null)).toBeUndefined()
  expect(() => candidateIdentity({ node, artifact: { kind: 'node', version: '1.0.0', candidate: { sha256: 'a'.repeat(64), tarball: 'x.tgz' } } }, {}, null)).toThrow('reached a release record')
  const agentic: CommunityNode = { id: 'adewale/agentic-mermaid', roles: [], outputs: ['svg'], benchmark: { adapter: 'agentic', package: 'agentic-mermaid' } }
  expect(candidateIdentity({ node: agentic }, { packageRoot: '/checkout' }, [{ path: 'dist/agent.js', sha256: 'b'.repeat(64) }])!.source).toBe('package-root')
  const store = temp.dir(),
    release = base(),
    measured: string[] = []
  const request = (identity: ProjectBenchmarkIdentity, id: string, statuses: Record<string, 'passed' | 'failed'>) => ({ identity, measure: async () => (measured.push(id), record(id, identity, '1.0.0', statuses)) })
  await updateProjectRecords(store, [request(release, 'release', { a: 'passed' })])
  const first = candidateOf(release, 'c'.repeat(64))
  expect(first.lane).toBe('candidate')
  expect((first.artifact as { candidate: { sha256: string } }).candidate.sha256).toBe('c'.repeat(64))
  // Same version string, same protocol: the candidate still measures, apart from the release.
  expect((await updateProjectRecords(store, [request(first, 'candidate-1', { a: 'failed' })]))[0]!.action).toBe('measured')
  expect((await updateProjectRecords(store, [request(first, 'never', {})]))[0]!.action).toBe('reused')
  expect((await updateProjectRecords(store, [request(candidateOf(release, 'd'.repeat(64)), 'candidate-2', { a: 'passed' })]))[0]!.action).toBe('measured')
  expect((await updateProjectRecords(store, [request(release, 'never', {})]))[0]!.action).toBe('reused')
  expect(measured).toEqual(['release', 'candidate-1', 'candidate-2'])
  const current = loadCurrentProjectRecords(store)
  expect(current.map(record => [record.identity.lane ?? 'community', record.id])).toEqual([
    ['community', 'release'],
    ['candidate', 'candidate-2'],
  ])
})

test('results:publish leaves candidates out of the league and refuses a candidate in the release lane', () => {
  const store = temp.dir(),
    out = temp.dir()
  publishProjectRecord(store, record('release', base(), '1.0.0', { a: 'passed', b: 'passed' }))
  publishProjectRecord(store, record('candidate', candidateOf(base(), 'c'.repeat(64)), '9.9.9-rc', { a: 'passed', b: 'passed' }))
  const result = publishResults(store, out)
  expect(result.candidates).toEqual([project])
  expect(result.lanes.map(lane => lane.version)).toEqual(['1.0.0'])
  const readme = readFileSync(join(out, 'README.md'), 'utf8')
  expect(readme).toContain('| 1.0.0 |')
  expect(readme).not.toContain('9.9.9-rc')
  const misfiled = temp.dir()
  const { lane: _lane, ...identity } = candidateOf(base(), 'e'.repeat(64))
  publishProjectRecord(misfiled, record('misfiled', identity, '9.9.9-rc', { a: 'passed' }))
  expect(() => publishResults(misfiled, temp.dir())).toThrow('ranks releases only')
  expect(existsSync(join(out, 'records/owner-fixture-renderer.json.gz'))).toBe(true)
})

test('a candidate comparison keeps failures as failures and withholds times that do not compare', () => {
  const release = record('release', base(), '1.0.0', { a: 'passed', b: 'failed', c: 'passed' }),
    candidate = record('candidate', candidateOf(base(), 'c'.repeat(64)), '1.1.0-rc', { a: 'failed', b: 'passed', c: 'passed' })
  expect(candidate.status).toBe('failed')
  const markdown = renderCandidateComparison(candidate, release)
  expect(markdown).toContain('1.1.0-rc')
  expect(markdown).toContain('`' + 'c'.repeat(64) + '`')
  expect(markdown).toContain('66.7% (2/3) → 66.7% (2/3)')
  expect(markdown).toContain('Now failing (1): `a`')
  expect(markdown).toContain('Now passing (1): `b`')
  expect(markdown).toContain('their times compare')
  expect(renderCandidateComparison(record('candidate', candidateOf(base('other.json'), 'c'.repeat(64)), '1.1.0-rc', { a: 'failed' }), release)).toContain('times are withheld')
  expect(renderCandidateComparison(candidate, undefined)).toContain('no release record')
  expect(() => renderCandidateComparison(release, candidate)).toThrow('Not a candidate')
})


test('candidate comparisons withhold browser times and case changes under different visible-output checks', () => {
  const release = record('release', { ...base(), protocol: { context: 'same', browserQualifier: 'old-checks' }, measurement: { rounds: 5 } }, '1.0.0', { a: 'passed' })
  const candidate = record('candidate', candidateOf({ ...base(), protocol: { context: 'same', browserQualifier: 'new-checks' }, measurement: { rounds: 5 } }, 'c'.repeat(64)), '1.1.0-rc', { a: 'failed' })
  for (const [item, ms] of [[release, 5], [candidate, 2]] as const) {
    const features = item.observations
    item.observations = ['node:public-api', 'browser:public-api'].flatMap(surface => [
      ...features.map(row => ({ ...row, surface })),
      ...communityCoreWorkloads().flatMap(workload => Array.from({ length: 5 }, (_, index) => ({ ...row(workload.id, 'passed', '1.0.0'), surface, mode: 'core-api-repeat', samplesMs: [ms], metrics: { implementation: project, round: index + 1, firstMs: ms } }))),
    ])
  }
  const markdown = renderCandidateComparison(candidate, release)
  const browser = markdown.split('\n').find(line => line.startsWith('| browser API |'))!
  const node = markdown.split('\n').find(line => line.startsWith('| Node API |'))!
  expect(node).toContain('30.00 ms → 12.00 ms')
  expect(browser).not.toContain('ms')
  expect(markdown.split('### browser API, SVG')[1]).toContain('Case-level changes are withheld')
  expect(markdown.split('### Node API, SVG')[1]!.split('### browser API')[0]).toContain('Now failing (1): `a`')
})

test('a Merman Node candidate cannot silently acquire the released browser SDK', async () => {
  const root = temp.dir(),
    cache = join(root, 'node_modules/.cache/unified-community-browser'),
    web = join(cache, 'merman-web/1.0.0/node_modules/@mermanjs/web')
  mkdirSync(web, { recursive: true })
  writeFileSync(join(web, 'package.json'), JSON.stringify({ name: '@mermanjs/web', version: '1.0.0', main: 'web.js' }))
  writeFileSync(join(web, 'web.js'), 'globalThis.webMerman = {}')
  writeFileSync(join(web, '../../..', 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/@mermanjs/web': { integrity: 'release-only' } } }))
  const [prepared] = await prepareCommunityBrowsers([{ node: { id: 'fixture/merman', roles: [], outputs: ['svg'], benchmark: { adapter: 'merman', package: '@mermanjs/node' }, packages: [{ registry: 'npm', name: '@mermanjs/web', version: '1.0.0' }] }, artifact: { kind: 'node', version: '1.0.0', candidate: { sha256: 'c'.repeat(64), tarball: 'candidate.tgz' } } }], { root, harnessRoot: root, out: join(root, 'out'), rounds: 5, profile: 'full' })
  expect(prepared!.browserStatus).toBe('blocked')
  expect(prepared!.browserDetail).toContain('candidate')
  expect(prepared!.browser).toBeUndefined()
})
