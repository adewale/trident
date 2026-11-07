import { reserveResultDirectory } from './result-storage.ts'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { CommunityArtifact, CommunityNode, PreparedCommunity } from './community-types.ts'
import { comparisonProjects } from './lineage.ts'
import { communityCatalogFile } from './trident-paths.ts'
import { MERMAID_ORACLE_PIN } from '../portable/mermaid-oracle.ts'
import { verifyProvidedCommunityArtifact } from './community.ts'
import { verifyReleaseCli } from './release-cli.ts'

interface VersionIO {
  json(url: string): Promise<any>
  refs(repository: string, pattern: string): Promise<string>
}
const live: VersionIO = {
  async json(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(45_000), headers: { 'User-Agent': 'Trident benchmark version selection (https://github.com/adewale/trident)' } })
    if (!response.ok) throw Error(`${url}: HTTP ${response.status}`)
    return response.json()
  },
  async refs(repository, pattern) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw Error('Invalid source repository')
    return execFileSync('git', ['ls-remote', `https://github.com/${repository}.git`, pattern], { encoding: 'utf8', timeout: 45_000, maxBuffer: 8 * 1024 * 1024 })
  },
}
const stable = (value: string) => /^v?\d+\.\d+\.\d+$/.test(value)
const compareVersions = (a: string, b: string) => {
  const x = a.replace(/^v/, '').split('.').map(Number), y = b.replace(/^v/, '').split('.').map(Number)
  return x[0]! - y[0]! || x[1]! - y[1]! || x[2]! - y[2]!
}
function latestTag(text: string) {
  const refs = new Map(text.trim().split('\n').filter(Boolean).map(line => { const [sha, ref] = line.split(/\s+/); return [ref!, sha!] }))
  const tags = [...refs.keys()].filter(ref => ref.startsWith('refs/tags/') && stable(ref.slice(10))).sort((a, b) => compareVersions(b.slice(10), a.slice(10)))
  const ref = tags[0]
  if (!ref) throw Error('No stable version tag; cannot claim a latest release')
  const revision = refs.get(ref + '^{}') ?? refs.get(ref)!
  if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('Invalid release revision')
  return { tag: ref.slice(10), version: ref.slice(10).replace(/^v/, ''), revision }
}
export interface BenchmarkVersionRow {
  project: string; component: string; registry: string; package?: string; version?: string; revision?: string
  previousVersion?: string; previousRevision?: string; source?: string; integrity?: string; publishedAt?: string; error?: string
  /** Mermaid's row only: its newest npm release, reported while the row stays at the oracle pin. */
  latestPublished?: string
}

/** Resolve once before a campaign; never refresh versions inside timed work.
 * The syntax/test oracle is a separate pin, not a reason to keep a stale peer. Mermaid's own
 * row is that oracle install (prepare refuses any other version), so it stays at the pin and
 * its newest release is only reported: moving the reference is a separate decision. */
export async function refreshBenchmarkVersions<T extends { nodes: CommunityNode[] }>(catalog: T, projects: string[], io: VersionIO = live) {
  const frozen = structuredClone(catalog), rows: BenchmarkVersionRow[] = [], checkedAt = new Date().toISOString()
  const jsonCache = new Map<string, Promise<any>>(), refsCache = new Map<string, Promise<string>>()
  const json = (url: string) => { if (!jsonCache.has(url)) jsonCache.set(url, io.json(url)); return jsonCache.get(url)! }
  const refs = (repo: string, pattern: string) => { const key = repo + ':' + pattern; if (!refsCache.has(key)) refsCache.set(key, io.refs(repo, pattern)); return refsCache.get(key)! }
  const npm = async (node: CommunityNode, name: string, previousVersion: string | undefined, component: string) => {
    const source = 'https://registry.npmjs.org/' + encodeURIComponent(name), data = await json(source)
    const version = data['dist-tags']?.latest, selected = data.versions?.[version]
    if (!version || !stable(version) || !selected || selected.deprecated) throw Error(`No current stable npm latest for ${name}`)
    rows.push({ project: node.id, component, registry: 'npm', package: name, version, previousVersion, source, integrity: selected.dist?.integrity, publishedAt: data.time?.[version] })
    for (const pkg of node.packages ?? []) if (pkg.name === name) {
      pkg.version = version
      for (const key of ['gitHead', 'provenanceCommit', 'publishedFromDefaultBranch']) delete (pkg as any)[key]
      if (selected.gitHead) (pkg as any).gitHead = selected.gitHead
    }
    return version as string
  }
  await Promise.all(frozen.nodes.filter(node => projects.includes(node.id)).map(async node => {
    const b = node.benchmark
    if (!b) { rows.push({ project: node.id, component: 'primary', registry: 'none', error: 'No artifact binding' }); return }
    delete b.preparationError
    try {
      if (node.id === 'mermaid-js/mermaid') {
        const source = 'https://registry.npmjs.org/mermaid', data = await json(source), pin = MERMAID_ORACLE_PIN.version
        if (!data.versions?.[pin]) throw Error('The oracle pin is not a published Mermaid release: ' + pin)
        rows.push({ project: node.id, component: 'primary', registry: 'oracle-pin', package: 'mermaid', version: pin, previousVersion: b.version, source, integrity: data.versions[pin].dist?.integrity, publishedAt: data.time?.[pin], latestPublished: data['dist-tags']?.latest })
        b.version = pin; b.versionPolicy = 'recorded'
        for (const pkg of node.packages ?? []) if (pkg.name === 'mermaid') pkg.version = pin
      } else if (b.package) {
        b.version = await npm(node, b.package, b.version ?? node.packages?.find(pkg => pkg.name === b.package)?.version, 'primary'); b.versionPolicy = 'recorded'
        if (b.adapter === 'merman') {
          const web = node.packages?.find(pkg => pkg.name === '@mermanjs/web')
          if (!web) throw Error('Missing browser SDK binding')
          const version = await npm(node, web.name, web.version, 'browser-sdk')
          if (version !== b.version) throw Error('Latest Node/browser SDK versions differ; preparation must support the separately selected releases')
        }
      } else if (['dart', 'native-flutter', 'termaid', 'bezel'].includes(b.adapter)) {
        const registry = b.adapter === 'termaid' ? 'pypi' : b.adapter === 'bezel' ? 'crates' : 'pub'
        const name = registry === 'pypi' ? 'termaid' : registry === 'crates' ? 'bezel-mermaid' : b.adapter === 'dart' ? 'mermaid_core' : 'mermaid_flutter'
        const source = registry === 'pypi' ? 'https://pypi.org/pypi/termaid/json' : registry === 'crates' ? 'https://crates.io/api/v1/crates/bezel-mermaid' : 'https://pub.dev/api/packages/' + name
        const data = await json(source), version = registry === 'pypi' ? data.info?.version : registry === 'crates' ? data.crate?.max_stable_version : data.latest?.version
        if (!version || !stable(version)) throw Error('No current stable registry release: ' + name)
        rows.push({ project: node.id, component: 'primary', registry, package: name, version, previousVersion: b.version ?? node.packages?.find(pkg => pkg.name === name)?.version, source })
        b.version = version; b.versionPolicy = 'recorded'
        for (const pkg of node.packages ?? []) if (pkg.name === name) pkg.version = version
      } else if (b.adapter === 'extra-source') {
        const text = await refs(node.id, 'HEAD'), revision = text.trim().split(/\s+/)[0]!
        if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('No immutable current source HEAD')
        rows.push({ project: node.id, component: 'primary', registry: 'source-head', revision, previousRevision: b.sourcePin, source: node.repo })
        b.sourcePin = revision
      } else if (b.adapter === 'franken') {
        let revision = (await refs(node.id, 'HEAD')).trim().split(/\s+/)[0]!
        if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('No immutable current distribution HEAD')
        const path = (node.distribution?.path ?? 'pkg/').replace(/\/$/, '')
        if (!/^[\w.-]+(?:\/[\w.-]+)*$/.test(path) || path.split('/').includes('..')) throw Error('Unsafe distribution path')
        let source = `https://raw.githubusercontent.com/${node.id}/${revision}/${path}/package.json`, pkg = await json(source)
        if (!stable(pkg.version)) throw Error('Current distribution has no stable package version')
        // One project, one release: when it also ships a CLI release, an untagged version on
        // the default branch is not yet a release, so the distribution comes from the CLI's tag.
        if (b.cliRelease) {
          const release = latestTag(await refs(b.cliRelease.repository, 'refs/tags/*'))
          if (pkg.version !== release.version) {
            revision = release.revision
            source = `https://raw.githubusercontent.com/${node.id}/${revision}/${path}/package.json`; pkg = await json(source)
            if (pkg.version !== release.version) throw Error(`Distribution at ${release.tag} is ${pkg.version}, not ${release.version}`)
          }
        }
        rows.push({ project: node.id, component: 'primary', registry: 'source-distribution', version: pkg.version, revision, previousVersion: node.distribution?.version, previousRevision: node.distribution?.revision, source })
        if (node.distribution?.revision !== revision) delete node.distribution?.wasmSha256
        node.distribution = { ...node.distribution, version: pkg.version, revision }
      } else if (b.adapter === 'source-cli') {
        const selected = latestTag(await refs(node.id, 'refs/tags/*'))
        rows.push({ project: node.id, component: 'primary', registry: 'git-tag', version: selected.version, revision: selected.revision, previousVersion: node.distribution?.version ?? node.release?.tag.replace(/^v/, ''), previousRevision: node.distribution?.revision ?? node.release?.commit, source: node.repo })
        node.release = { tag: selected.tag, commit: selected.revision }
      } else throw Error('No latest-version resolver for ' + b.adapter)
      for (const companion of (b.operationPackages ?? []) as { package: string; version: string; operation: string }[]) companion.version = await npm(node, companion.package, companion.version, companion.operation)
      if (b.cliRelease) {
        const selected = latestTag(await refs(b.cliRelease.repository, 'refs/tags/*'))
        rows.push({ project: node.id, component: 'native-cli', registry: 'git-tag', version: selected.version, revision: selected.revision, previousVersion: b.cliRelease.version, previousRevision: b.cliRelease.revision, source: 'https://github.com/' + b.cliRelease.repository })
        if (b.cliRelease.version !== selected.version || b.cliRelease.revision !== selected.revision) throw Error(`Latest CLI ${selected.tag} requires its archive hash/binding to be updated; refusing the old CLI`)
      }
    } catch (error) {
      b.preparationError = String(error)
      rows.push({ project: node.id, component: 'selection', registry: 'unresolved', error: String(error) })
    }
  }))
  rows.sort((a, b) => a.project.localeCompare(b.project) || a.component.localeCompare(b.component))
  return { catalog: frozen, report: { schema: 'trident-benchmark-versions-v1', checkedAt, policy: 'Registry current stable latest; latest stable version tag for native releases; current default-branch HEAD for source-only components and repository-hosted distributions. Freeze exact selections before preparation. No fallback to stale artifacts.', projects: projects.length, complete: !rows.some(row => row.error), rows } }
}

/** A cached preparation must match the freshly selected operand, not its own old node. */
export function assertCurrentBenchmarkArtifact(peer: PreparedCommunity & { browser?: { version: string } }, selected: CommunityNode) {
  const a = peer.artifact, b = selected.benchmark
  if (!a || !b) return
  const native = a.kind === 'cli' && b.cliRelease
  const expected = native ? native.version : b.version ?? (b.adapter === 'franken' ? selected.distribution?.version : b.adapter === 'source-cli' ? selected.release?.tag.replace(/^v/, '') : undefined)
  if (expected && a.version.replace(/^v/, '') !== expected.replace(/^v/, '')) throw Error(`${selected.id}: stale prepared artifact ${a.version}; selected latest is ${expected}`)
  if (peer.browser && peer.browser.version.replace(/^v/, '') !== a.version.replace(/^v/, '')) throw Error(`${selected.id}: prepared browser version differs from its selected artifact`)
  const revision = native ? native.revision : b.adapter === 'extra-source' ? b.sourcePin : b.adapter === 'franken' ? selected.distribution?.revision : b.adapter === 'source-cli' ? selected.release?.commit : undefined
  if (revision && (a.sourceRevision ?? a.revision) !== revision) throw Error(`${selected.id}: prepared source revision differs from the current selection`)
  if (a.kind === 'node') for (const companion of (b.operationPackages ?? []) as { package: string; version: string }[]) {
    if (companion.package === b.package) continue
    if (!a.adapterCompanions?.some(pkg => pkg.name === companion.package && pkg.version === companion.version)) throw Error(`${selected.id}: prepared companion differs from selected ${companion.package}@${companion.version}`)
  }
  if (b.cliRelease) for (const transport of a.additionalCli ?? []) {
    if (transport.id === 'native-release' && transport.artifact && (transport.artifact.version !== b.cliRelease.version || transport.artifact.revision !== b.cliRelease.revision)) throw Error(`${selected.id}: prepared native CLI differs from the latest selected release`)
  }
  if (b.preparationError) throw Error(`${selected.id}: ${b.preparationError}`)
}

/** Admit the actual prepared bytes before any calls or clocks, including cached preparations. */
export function verifyBenchmarkArtifact(peer: PreparedCommunity, selected: CommunityNode) {
  assertCurrentBenchmarkArtifact(peer, selected)
  if (peer.artifact) {
    verifyProvidedCommunityArtifact(peer.artifact)
    verifyReleaseCli(selected, peer.artifact)
  }
}

/** The output's actual frozen version, including native releases and source-only
 * artifacts whose package version is learned from the verified preparation. */
export function plannedBenchmarkVersion(node: CommunityNode, artifact?: CommunityArtifact) {
  const version = artifact?.version ?? node.benchmark?.version ?? node.distribution?.version ?? node.release?.tag.replace(/^v/, '') ?? (node.benchmark?.sourcePin ? 'git-' + node.benchmark.sourcePin.slice(0, 12) : undefined)
  if (!version) throw Error('No frozen version for planned project ' + node.id)
  return version
}

export type VerifiedArtifact = CommunityArtifact & ({ kind: 'node' | 'global' | 'franken'; module: string } | { kind: 'cli' | 'jsonl-worker'; executable: string } | { kind: 'python'; executable: string })
/** Validate external optional-field records once; consumers receive an executable
 * binding. Browser delivery separately seals the bytes it serves. */
export function verifiedBenchmarkBinding(peer: PreparedCommunity, selected: CommunityNode) {
  verifyBenchmarkArtifact(peer, selected)
  const artifact = peer.artifact
  if (!artifact) throw Error('No prepared artifact for ' + selected.id)
  if (!['node', 'global', 'franken', 'cli', 'jsonl-worker', 'python'].includes(artifact.kind)) throw Error('Unknown prepared artifact kind for ' + selected.id)
  const entry = ['node', 'global', 'franken'].includes(artifact.kind) ? artifact.module : artifact.kind === 'python' ? artifact.python ?? artifact.executable : artifact.executable
  if (typeof entry !== 'string' || !entry) throw Error('Missing ' + artifact.kind + ' execution binding for ' + selected.id)
  return Object.freeze({ ...artifact, ...(artifact.kind === 'python' ? { executable: entry } : {}) }) as Readonly<VerifiedArtifact>
}

/** A newer native rendering release takes precedence over an older SDK. */
export function latestBenchmarkRenderingArtifact(peer: PreparedCommunity): CommunityArtifact | undefined {
  const artifact = peer.artifact, spec = peer.node.benchmark?.cliRelease
  if (!artifact || !spec?.outputs.svg || !stable(artifact.version) || !stable(spec.version)) return artifact
  if (compareVersions(spec.version, artifact.version) <= 0) return artifact
  const native = artifact.additionalCli?.find(row => row.id === 'native-release')?.artifact
  if (!native || native.version !== spec.version || native.revision !== spec.revision) throw Error(`${peer.node.id}: latest rendering release ${spec.version} is unavailable; refusing older SDK ${artifact.version}`)
  return native
}

/** The selected projects whose frozen artifact differs between two catalogs: a published
 * campaign's and a fresh selection. Answers whether a new collection is worth running. */
export function versionChanges(previous: { nodes: CommunityNode[] }, current: { nodes: CommunityNode[] }, projects: string[]) {
  const identity = (node: CommunityNode | undefined) => {
    if (!node) return undefined
    const b = node.benchmark
    const version = b?.version ?? node.distribution?.version ?? node.release?.tag.replace(/^v/, '')
    const revision = b?.sourcePin ?? node.distribution?.revision ?? node.release?.commit
    const parts = [version, revision].filter(Boolean).join('@')
    const companions = ((b?.operationPackages ?? []) as { package: string; version: string }[]).map(pkg => `${pkg.package}@${pkg.version}`).sort()
    return [parts, ...(b?.cliRelease ? [`CLI ${b.cliRelease.version}@${b.cliRelease.revision}`] : []), ...companions].filter(Boolean).join(' + ') || undefined
  }
  return projects.flatMap(project => {
    const before = identity(previous.nodes.find(node => node.id === project)), after = identity(current.nodes.find(node => node.id === project))
    return before === after ? [] : [{ project, previous: before ?? null, current: after ?? null }]
  })
}

export async function main(args = process.argv.slice(2)) {
  const usage = 'versions --out FRESH_DIRECTORY [--projects IDS] [--since FROZEN_CATALOG]'
  if (args.length === 1 && args[0] === '--help') { console.log(usage + '\nResolve and freeze current benchmark artifacts; does not install or run anything. --since lists the projects whose release changed since that frozen catalog (a published campaign\'s), to show whether a new collection is worth running.'); return }
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) {
    if (!['--out', '--projects', '--since'].includes(args[i]!) || !args[i + 1] || options.has(args[i]!)) throw Error(usage)
    options.set(args[i]!, args[i + 1]!)
  }
  if (!options.has('--out')) throw Error('Choose --out FRESH_DIRECTORY')
  const out = resolve(options.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  const catalog = JSON.parse(readFileSync(communityCatalogFile, 'utf8'))
  const projects = comparisonProjects(catalog, options.get('--projects')?.split(',') ?? catalog.nodes.map((node: CommunityNode) => node.id)).included
  const result = await refreshBenchmarkVersions(catalog, projects)
  const changes = options.has('--since') ? versionChanges(JSON.parse(readFileSync(options.get('--since')!, 'utf8')), result.catalog, projects) : undefined
  reserveResultDirectory(out)
  writeFileSync(join(out, 'catalog.json'), JSON.stringify({ ...result.catalog, benchmarkVersionsCheckedAt: result.report.checkedAt, benchmarkVersionPolicy: result.report.policy }, null, 2) + '\n')
  writeFileSync(join(out, 'versions.json'), JSON.stringify({ ...result.report, ...(changes ? { changedSince: { catalog: options.get('--since'), changes } } : {}) }, null, 2) + '\n')
  if (changes) {
    console.log(`${changes.length} of ${projects.length} projects changed since ${options.get('--since')}:`)
    for (const change of changes) console.log(`  ${change.project}: ${change.previous} -> ${change.current}`)
    const reference = result.report.rows.find(row => row.registry === 'oracle-pin')
    if (reference?.latestPublished && reference.latestPublished !== reference.version) console.log(`Mermaid ${reference.latestPublished} is published; its row stays at the oracle pin ${reference.version}.`)
  } else console.log(JSON.stringify(result.report, null, 2))
  if (!result.report.complete) process.exitCode = 1
}
if (import.meta.main) await main()
