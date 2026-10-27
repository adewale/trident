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
import { candidateIdentity, communityCandidate, projectPackageIdentity, updateProjectRecords } from '../unified/project-update.ts'
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
  const [packed] = JSON.parse(execFileSync('npm', ['pack', source, '--ignore-scripts', '--json', '--pack-destination', destination], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, npm_config_cache: join(destination, 'npm-cache') } }))
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
  const installed = entry!.artifact!.candidate as { sha256: string; tarball: string }
  expect(installed.sha256).toBe(digest)
  expect(sha256(installed.tarball)).toBe(digest)
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

test('candidate mode takes one project, a tarball for npm and a revision for a source build, and checks it before acquisition', () => {
  const catalog = JSON.parse(readFileSync(communityCatalogFile, 'utf8')).nodes as CommunityNode[],
    tarballOf = (project: string) => ({ project, tarball: 'candidate.tgz' }),
    revisionOf = (project: string) => ({ project, revision: 'a'.repeat(40) })
  expect(assertCommunityCandidate(catalog, tarballOf('lukilabs/beautiful-mermaid')).benchmark!.package).toBe('beautiful-mermaid')
  expect(() => assertCommunityCandidate(catalog, tarballOf('mermaid-js/mermaid'))).toThrow('pinned oracle')
  expect(() => assertCommunityCandidate(catalog, revisionOf('mermaid-js/mermaid'))).toThrow('pinned oracle')
  expect(() => assertCommunityCandidate(catalog, tarballOf('rohitg00/beautiful-mermaid'))).toThrow('use --candidate-revision')
  expect(() => assertCommunityCandidate(catalog, tarballOf('pgavlin/mermaid-ascii'))).toThrow('use --candidate-revision')
  expect(assertCommunityCandidate(catalog, revisionOf('pgavlin/mermaid-ascii')).benchmark!.adapter).toBe('source-cli')
  expect(assertCommunityCandidate(catalog, revisionOf('rohitg00/beautiful-mermaid')).benchmark!.adapter).toBe('extra-source')
  expect(() => assertCommunityCandidate(catalog, revisionOf('lukilabs/beautiful-mermaid'))).toThrow('not built from source')
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
  const packed = communityCandidate({ directory }, options) as { tarball: string; sha256: string; packedFrom?: string }
  expect(packed.packedFrom).toBe(directory)
  expect(packed.tarball.startsWith(join(out, 'candidate-packs'))).toBe(true)
  expect(packed.sha256).toBe(sha256(packed.tarball))
})

const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=Trident', '-c', 'user.email=trident@localhost', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8' }).trim()
function sourceClone(): { clone: string; release: string; candidate: string } {
  const clone = temp.dir()
  git(clone, 'init', '-q')
  writeFileSync(join(clone, 'main.go'), 'package main\n')
  git(clone, 'add', '.')
  git(clone, 'commit', '-qm', 'release')
  const release = git(clone, 'rev-parse', 'HEAD')
  writeFileSync(join(clone, 'main.go'), 'package main\n// unreleased\n')
  git(clone, 'commit', '-qam', 'unreleased')
  return { clone, release, candidate: git(clone, 'rev-parse', 'HEAD') }
}

test('a source candidate is one Git commit, from GitHub by default or from a named remote or clean clone', () => {
  const { clone, release, candidate } = sourceClone(),
    tool = 'AlexanderGrooff/mermaid-ascii',
    options = { out: temp.dir(), communityProjects: [tool] }
  expect(communityCandidate({ revision: 'b'.repeat(40) }, options)).toEqual({ project: tool, revision: 'b'.repeat(40), remote: `https://github.com/${tool}.git` })
  expect(communityCandidate({ revision: 'b'.repeat(40), remote: 'https://example.com/fork.git' }, options)).toEqual({ project: tool, revision: 'b'.repeat(40), remote: 'https://example.com/fork.git' })
  expect(() => communityCandidate({ revision: release.slice(0, 8) }, options)).toThrow('full 40-character')
  // A local clone resolves HEAD or a short revision itself.
  expect(communityCandidate({ remote: clone }, options)).toEqual({ project: tool, revision: candidate, remote: clone })
  expect(communityCandidate({ remote: clone, revision: release.slice(0, 8) }, options)).toEqual({ project: tool, revision: release, remote: clone })
  expect(() => communityCandidate({ remote: clone, revision: 'c'.repeat(40) }, options)).toThrow('has no commit')
  expect(() => communityCandidate({ remote: join(clone, 'missing') }, options)).toThrow('does not exist')
  expect(() => communityCandidate({ revision: candidate, tarball: 'x.tgz' }, options)).toThrow('not both')
  writeFileSync(join(clone, 'main.go'), 'package main\n// uncommitted\n')
  expect(() => communityCandidate({ remote: clone }, options)).toThrow('uncommitted changes')
  expect(communityCandidate({ remote: clone, revision: candidate }, options)).toEqual({ project: tool, revision: candidate, remote: clone })
})

test('a source candidate is built with the release recipe from its own commit, and frozen preparation keeps it', async () => {
  const { clone, candidate } = sourceClone(),
    catalogNodes = JSON.parse(readFileSync(communityCatalogFile, 'utf8')).nodes as CommunityNode[],
    tool = catalogNodes.find(node => node.id === 'AlexanderGrooff/mermaid-ascii')!,
    root = temp.dir(),
    catalog = join(root, 'catalog.json'),
    go = join(root, 'go')
  writeFileSync(catalog, JSON.stringify({ nodes: [tool] }))
  // Stands in for `go build -trimpath -o EXECUTABLE .`: records the commit it built.
  writeFileSync(go, '#!/bin/sh\nprintf "#!/bin/sh\\necho %s\\n" "$(git rev-parse HEAD)" > "$4"\nchmod +x "$4"\n', { mode: 0o755 })
  const saved = { go: process.env.AM_BENCH_GO, cache: process.env.AM_COMMUNITY_SOURCE_CACHE }
  process.env.AM_BENCH_GO = go
  process.env.AM_COMMUNITY_SOURCE_CACHE = join(root, 'source-cache')
  try {
    const options = { out: join(root, 'out'), root, harnessRoot: root, rounds: 1, profile: 'smoke' as const, communityCatalogFile: catalog, communityProjects: [tool.id] },
      request = { project: tool.id, revision: candidate, remote: clone }
    const [entry] = await prepareCommunity({ ...options, communityCandidate: request })
    expect(entry!.error).toBeUndefined()
    expect(entry!.artifact!.revision).toBe(candidate)
    expect(entry!.artifact!.version).toBe(`git-${candidate.slice(0, 12)}`)
    expect(entry!.artifact!.candidate).toEqual({ revision: candidate, remote: clone })
    expect(entry!.artifact!.detail).toContain(`unreleased candidate revision ${candidate}`)
    expect(execFileSync(entry!.artifact!.executable!, { encoding: 'utf8' }).trim()).toBe(candidate)
    expect(candidateIdentity(entry!, { communityCandidate: request }, null)).toEqual({ source: 'revision', revision: candidate })
    // The same commit fetched elsewhere reuses the record: the remote is not identity.
    const keyed = projectPackageIdentity(entry!)
    expect((keyed as { artifact: { candidate?: unknown } }).artifact.candidate).toEqual({ revision: candidate })
    expect(projectPackageIdentity({ ...entry!, artifact: { ...entry!.artifact!, candidate: { revision: candidate, remote: 'https://example.com/fork.git' } } })).toEqual(keyed)
    const frozen = join(root, 'frozen.json')
    writeFileSync(frozen, JSON.stringify([entry]))
    const [inside] = await prepareCommunity({ ...options, out: join(root, 'inside'), communityPreparedFile: frozen, communityCandidate: request })
    expect(inside!.error).toBeUndefined()
    const [outside] = await prepareCommunity({ ...options, out: join(root, 'outside'), communityPreparedFile: frozen })
    expect(outside!.error).toContain('differs from recorded source pin')
  } finally {
    for (const [key, value] of [['AM_BENCH_GO', saved.go], ['AM_COMMUNITY_SOURCE_CACHE', saved.cache]] as const) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}, 60_000)


test.each(['candidate-first', 'release-first'] as const)('source cache keeps release and candidate labels separate in %s order', async order => {
  const { clone, candidate } = sourceClone(),
    original = (JSON.parse(readFileSync(communityCatalogFile, 'utf8')).nodes as CommunityNode[]).find(node => node.id === 'AlexanderGrooff/mermaid-ascii')!,
    tool = { ...original, head: candidate, release: { commit: candidate, tag: '1.6.1' } },
    root = temp.dir(),
    catalog = join(root, 'catalog.json'),
    go = join(root, 'go')
  writeFileSync(catalog, JSON.stringify({ nodes: [tool] }))
  writeFileSync(go, '#!/bin/sh\nprintf "#!/bin/sh\\necho %s\\n" "$(git rev-parse HEAD)" > "$4"\nprintf build >> "$4.count"\nchmod +x "$4"\n', { mode: 0o755 })
  const saved = { go: process.env.AM_BENCH_GO, cache: process.env.AM_COMMUNITY_SOURCE_CACHE }
  process.env.AM_BENCH_GO = go
  process.env.AM_COMMUNITY_SOURCE_CACHE = join(root, 'source-cache')
  // The fixture's recorded release lives in this local clone too. Seed only
  // acquisition, not a compiled artifact or manifest, before either ordering.
  const checkout = join(root, 'source-cache', tool.id.replaceAll('/', '--') + '@' + candidate, 'source')
  mkdirSync(checkout, { recursive: true })
  git(checkout, 'init', '-q')
  git(checkout, 'remote', 'add', 'origin', clone)
  try {
    const options = { root, harnessRoot: root, rounds: 1, profile: 'smoke' as const, communityCatalogFile: catalog, communityProjects: [tool.id] },
      request = { project: tool.id, revision: candidate, remote: clone },
      prepare = async (kind: 'candidate' | 'release', attempt: string) => (await prepareCommunity({ ...options, out: join(root, attempt), ...(kind === 'candidate' ? { communityCandidate: request } : {}) }))[0]!
    // Both calls use the exact same physical compiled commit, in either order.
    const first = await prepare(order === 'candidate-first' ? 'candidate' : 'release', 'first'),
      second = await prepare(order === 'candidate-first' ? 'release' : 'candidate', 'second'),
      unreleased = order === 'candidate-first' ? first : second,
      release = order === 'candidate-first' ? second : first
    expect(first.error).toBeUndefined()
    expect(second.error).toBeUndefined()
    expect(unreleased.artifact!.version).toBe(`git-${candidate.slice(0, 12)}`)
    expect(release.artifact!.version).toBe('1.6.1')
    expect(release.artifact!.candidate).toBeUndefined()
    expect(candidateIdentity(unreleased, { communityCandidate: request }, null)).toEqual({ source: 'revision', revision: candidate })
    expect(candidateIdentity(release, {}, null)).toBeUndefined()
    expect(unreleased.artifact!.sha256).toBe(release.artifact!.sha256)
    expect((await prepare('candidate', 'candidate-again')).artifact!.version).toBe(`git-${candidate.slice(0, 12)}`)
    expect((await prepare('release', 'release-again')).artifact!.version).toBe('1.6.1')
    expect(readFileSync(release.artifact!.executable! + '.count', 'utf8')).toBe('build')
  } finally {
    for (const [key, value] of [['AM_BENCH_GO', saved.go], ['AM_COMMUNITY_SOURCE_CACHE', saved.cache]] as const) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}, 60_000)

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

test('same-project candidates need the same API binding and declared outputs before comparing', () => {
  const protocol = { context: 'same', adapter: { adapter: 'declared', api: { svg: { export: 'render' } } }, outputs: ['svg'] }
  const release = record('release', { ...base(), protocol, measurement: { rounds: 5 } }, '1.0.0', { a: 'passed' })
  release.observations.push(...communityCoreWorkloads().flatMap(workload => Array.from({ length: 5 }, (_, index) => ({ ...row(workload.id, 'passed', '1.0.0'), mode: 'core-api-repeat', samplesMs: [5], metrics: { implementation: project, round: index + 1, firstMs: 5 } }))))
  for (const changed of [
    { ...protocol, adapter: { adapter: 'declared', api: { svg: { export: 'renderFast' } } } },
    { ...protocol, outputs: ['svg', 'png'] },
  ]) {
    const candidate = record('candidate', candidateOf({ ...base(), protocol: changed, measurement: { rounds: 5 } }, 'c'.repeat(64)), '1.1.0-rc', { a: 'failed' })
    candidate.observations.push(...communityCoreWorkloads().flatMap(workload => Array.from({ length: 5 }, (_, index) => ({ ...row(workload.id, 'passed', '1.1.0-rc'), mode: 'core-api-repeat', samplesMs: [2], metrics: { implementation: project, round: index + 1, firstMs: 2 } }))))
    const markdown = renderCandidateComparison(candidate, release)
    expect(markdown).toContain('times are withheld')
    expect(markdown.split('\n').find(line => line.startsWith('| Node API |'))).not.toContain('ms')
    expect(markdown).not.toContain('Now failing')
  }
})

test('candidate case changes retain blocked, unsupported, missing and newly measured outcomes', () => {
  const release = record('release', base(), '1.0.0', { a: 'passed', b: 'passed', c: 'passed', d: 'passed', e: 'passed', f: 'passed' })
  const candidate = record('candidate', candidateOf(base(), 'c'.repeat(64)), '1.1.0-rc', { a: 'passed', b: 'passed', c: 'passed', d: 'passed', f: 'passed', g: 'failed' })
  const statuses = { a: 'blocked', b: 'unsupported', c: 'skipped', d: 'not-applicable' } as const
  for (const observation of candidate.observations) {
    if (Object.hasOwn(statuses, observation.caseId)) observation.status = statuses[observation.caseId as keyof typeof statuses]
  }
  const markdown = renderCandidateComparison(candidate, release)
  expect(markdown).not.toContain('No case or family changed')
  for (const transition of ['`a`: passed → blocked', '`b`: passed → unsupported', '`c`: passed → skipped', '`d`: passed → not-applicable', '`e`: passed → not measured', '`g`: not measured → failed']) expect(markdown).toContain(transition)
})
