
import { evidenceDigest, } from '../portable/evidence-contract.ts'
import { releaseBenchmarkSkip } from './benchmark-skip.ts'
import { verifyReleaseCli } from './release-cli.ts'
import { captureInstalledDependencyClosure } from '../portable/artifact-dependencies.ts'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash, } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, readlinkSync, realpathSync, statSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { assertCommunityNotInterrupted, } from './community-process.ts'
import type { CommunityArtifact, CommunityNode, PreparedCommunity } from './community-types.ts'
import { assertMermaidOracle, } from '../portable/mermaid-oracle.ts'
import type { UnifiedRunOptions, UnifiedWorkload } from './types.ts'
import { communityCorpus, } from './corpus.ts'
import { communityCatalogFile } from './trident-paths.ts'
import { candidateKey, candidatePackage, verifyCandidateArchive, verifyCandidateDependencyPayload, type NpmCandidate } from './candidate-packages.ts'
export { candidatePackage } from './candidate-packages.ts'

export const normalizeCommunityOutput = (output: string): string => (({ 'ascii-unicode': 'terminal', ascii: 'terminal', unicode: 'terminal', ast: 'parse', 'mermaid-text': 'source' }) as Record<string, string>)[output] ?? output
const safe = (id: string) => id.replace(/[^a-z0-9._-]+/gi, '_')
function writePreparationCheckpoint(path: string, value: unknown) {
  const temporary = path + `.pending-${process.pid}`
  try {
    writeFileSync(temporary, JSON.stringify(value, null, 2))
    renameSync(temporary, path)
  } catch (error) {
    if (existsSync(temporary)) unlinkSync(temporary)
    throw error
  }
}
const artifactDigest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
/** The fixed core, frozen with the corpus: six independently labelled repeat inputs. */
export function communityCoreWorkloads(): UnifiedWorkload[] {
  return communityCorpus().core.map(workload => ({ ...workload }))
}

/** npm can write physical-prefix keys when --prefix traverses a symlink.
 * Match one concrete installed root; nested or linked identities are not pins. */
export function installedNpmIntegrity(prefix: string, root: string, name: string, version: string): string {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string; version: string }
  if (pkg.name !== name || pkg.version !== version) throw new Error('Installed npm identity differs from the resolved pin')
  const actual = realpathSync(root),
    lock = JSON.parse(readFileSync(join(prefix, 'package-lock.json'), 'utf8')) as { packages?: Record<string, { version?: string; integrity?: string; link?: boolean }> }
  const bases = [...new Set([resolve(prefix), realpathSync(prefix)])]
  const matches = Object.entries(lock.packages ?? {}).filter(([key, entry]) => {
    if (!key || entry.link || entry.version !== version) return false
    return bases.some(base => {
      try {
        return realpathSync(resolve(base, key)) === actual
      } catch {
        return false
      }
    })
  })
  if (matches.length !== 1) throw new Error(`Expected one installed npm lock identity for ${name}@${version}; found ${matches.length}`)
  const integrity = matches[0]![1].integrity
  if (typeof integrity !== 'string' || !integrity.startsWith('sha512-')) throw new Error('Missing installed package SHA-512 integrity')
  const encoded = integrity.slice(7),
    bytes = Buffer.from(encoded, 'base64')
  if (bytes.length !== 64 || bytes.toString('base64') !== encoded) throw new Error('Noncanonical installed package SHA-512 integrity')
  return integrity
}

/** A candidate stands in for one row: a tarball for an npm-backed tool, a Git revision for a tool
 * Trident builds from source. Mermaid is the oracle and takes neither. */
export function assertCommunityCandidate(nodes: CommunityNode[], candidate: { project: string } & ({ tarball: string } | { revision: string })): CommunityNode {
  const node = nodes.find(node => node.id === candidate.project)
  if (!node) throw Error(`Candidate project ${candidate.project} is not in the catalog`)
  if (node.id === 'mermaid-js/mermaid') throw Error('Mermaid is the pinned oracle; it takes no candidate')
  const source = node.benchmark?.adapter === 'source-cli' || node.benchmark?.adapter === 'extra-source'
  if ('revision' in candidate) {
    if (!source) throw Error(`${node.id} is not built from source, so it takes no candidate revision; use --candidate-tarball or --candidate-dir`)
  } else if (!node.benchmark?.package || source) throw Error(`${node.id} is not benchmarked from an npm package, so it takes no candidate tarball${source ? '; use --candidate-revision' : ''}`)
  return node
}
/** Build a candidate revision with the project's own reviewed recipe, exactly as its release is built. */
async function sourceCandidateArtifact(node: CommunityNode, cache: string, candidate: { revision: string; remote: string }): Promise<CommunityArtifact> {
  const root = process.env.AM_COMMUNITY_SOURCE_CACHE ?? cache
  const artifact: CommunityArtifact =
    node.benchmark?.adapter === 'source-cli'
      ? await (await import('./community-source-prepare.ts')).prepareCommunitySource({ ...node, head: candidate.revision, release: { commit: candidate.revision } }, root, candidate.remote)
      : await (await import('./community-extra-source.ts')).prepareExtraCommunitySource({ ...node, head: candidate.revision, benchmark: { ...node.benchmark!, sourcePin: candidate.revision } }, root, candidate.remote)
  return { ...artifact, candidate: { revision: candidate.revision, remote: candidate.remote } }
}
/** Seal all physical shipped payload, including bundled nested modules, plus
 * resolved declared dependencies. Unreviewed payload symlinks fail closed. */
export function adapterCompanionIdentity(root: string) {
  const dependencies = captureInstalledDependencyClosure(root)
  const admittedRoots = [realpathSync(root), ...dependencies.nodes.map(node => node.realRoot)]
  const visit = (directory: string): { path: string; sha256: string }[] => readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    if (entry.name === '.git') return []
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) {
      const target = realpathSync(path)
      // npm's generated command links may point only to sealed shipped files.
      // Bind link spelling and target bytes so retargeting cannot preserve a seal.
      if (basename(directory) !== '.bin' || basename(dirname(directory)) !== 'node_modules' || !statSync(target).isFile() || !admittedRoots.some(base => target.startsWith(base + sep)) || target.split(sep).includes('.git')) throw Error('Adapter companion payload has an unreviewed symlink: ' + path)
      return [{ path, sha256: evidenceDigest({ link: readlinkSync(path), target, sha256: artifactDigest(target) }) }]
    }
    return entry.isDirectory() ? visit(path) : entry.isFile() ? [{ path, sha256: artifactDigest(path) }] : []
  })
  const files = new Map([root, ...dependencies.nodes.map(node => node.realRoot)].flatMap(visit).map(file => [file.path, file]))
  return { files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)), dependencies }
}

async function npmArtifact(node: CommunityNode, cache: string, pinned = false, candidate?: NpmCandidate): Promise<CommunityArtifact> {
  const config = node.benchmark!,
    name = config.package!
  const recorded = config.version ?? node.packages?.find(p => p.registry === 'npm' && p.name === name)?.version
  let version = recorded
  if (candidate) {
    if (node.id === 'mermaid-js/mermaid') throw new Error('Mermaid is the pinned oracle; it takes no candidate')
    if (artifactDigest(candidate.tarball) !== candidate.sha256) throw new Error('Candidate tarball differs from its supplied SHA-256')
    const pkg = candidatePackage(candidate.tarball)
    if (pkg.name !== name) throw new Error(`Candidate tarball holds ${pkg.name}; ${node.id} benchmarks ${name}`)
    version = pkg.version
  } else if (!config.version && config.versionPolicy !== 'recorded' && !pinned && process.env.AM_COMMUNITY_VERSION_POLICY !== 'recorded') {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`)
    if (!response.ok) throw new Error(`${name} registry HTTP ${response.status}`)
    version = ((await response.json()) as { version: string }).version
  }
  if (!version) throw new Error(`No published version recorded for ${name}`)
  const dependencyNames = new Set([name])
  const dependencyArchives = (candidate?.dependencies ?? []).map(archive => {
    verifyCandidateArchive(archive)
    const pkg = candidatePackage(archive.tarball)
    if (dependencyNames.has(pkg.name)) throw Error('Duplicate candidate package: ' + pkg.name)
    dependencyNames.add(pkg.name)
    return { ...archive, ...pkg }
  }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  const extra = await import('./community-extra-adapters.mjs'),
    plan = extra.extraPackagePreparation(name, config)
  // Mermaid's row is the pinned oracle install itself, never a second copy of Mermaid.
  const oracle = node.id === 'mermaid-js/mermaid' ? assertMermaidOracle() : undefined
  if (oracle && version !== oracle.version) throw new Error(`Mermaid's row must be the pinned oracle ${oracle.version}; the catalog records ${version}`)
  // A candidate installs into its own prefix, keyed by its bytes, from Trident's verified copy.
  const prefix = oracle?.directory ?? (candidate ? join(cache, 'candidates', safe(name), candidateKey(candidate)) : join(cache, `${safe(name)}@${version}${plan.overrides ? '-recipe-' + createHash('sha256').update(JSON.stringify(plan)).digest('hex').slice(0, 16) : ''}`)),
    root = join(prefix, 'node_modules', name),
    copy = join(prefix, 'candidate.tgz')
  mkdirSync(prefix, { recursive: true })
  if (candidate && !existsSync(copy)) copyFileSync(candidate.tarball, copy)
  if (candidate && artifactDigest(copy) !== candidate.sha256) throw new Error(`Retained candidate copy differs from its SHA-256: ${copy}`)
  const retainedDependencies = dependencyArchives.map(archive => {
    const tarball = join(prefix, archive.sha256 + '.tgz')
    if (!existsSync(tarball)) copyFileSync(archive.tarball, tarball)
    verifyCandidateArchive({ ...archive, tarball })
    return { ...archive, tarball }
  })
  const companions: string[] = [...(plan.companions ?? []), ...(plan.additionalCompanions ?? [])]
  const needed =
    !existsSync(join(root, 'package.json')) ||
    retainedDependencies.some(pkg => !existsSync(join(prefix, 'node_modules', pkg.name, 'package.json'))) || companions.some(spec => {
      const name = spec.startsWith('@') ? spec.slice(0, spec.lastIndexOf('@')) : spec.split('@')[0]!
      return !existsSync(join(prefix, 'node_modules', name, 'package.json'))
    })
  if (needed && oracle) throw new Error(`The Mermaid oracle at ${prefix} is incomplete; reinstall it with mermaid:install`)
  if (needed) {
    if (plan.overrides) {
      const manifest = join(prefix, 'package.json'), pkg = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : { private: true }
      pkg.overrides = { ...pkg.overrides, ...plan.overrides }
      writeFileSync(manifest, JSON.stringify(pkg, null, 2) + '\n')
    }
    const install = spawnSync('npm', ['install', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', candidate ? copy : `${name}@${version}`, ...retainedDependencies.map(pkg => pkg.tarball), ...companions], {
      encoding: 'utf8',
      timeout: 300_000,
      env: { ...process.env, npm_config_cache: process.env.npm_config_cache ?? process.env.NPM_CONFIG_CACHE ?? join(cache, '.npm-cache') },
    })
    writeFileSync(join(prefix, 'install.log'), install.stdout + install.stderr)
    if (install.status !== 0) throw new Error(`${name} installation failed; ${join(prefix, 'install.log')}`)
  }
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string; version: string }
  if (pkg.name !== name || pkg.version !== version) throw new Error('Installed npm identity differs from resolved pin')
  const integrity = installedNpmIntegrity(prefix, root, name, version)
  if (candidate && integrity !== 'sha512-' + createHash('sha512').update(readFileSync(copy)).digest('base64')) throw new Error('Installed candidate differs from its tarball')
  const bunRuntime = /bun/i.test(config.runtime ?? plan.runtime ?? ''),
    runtime = bunRuntime ? (plan.runtime ?? 'Bun') : 'Node'
  let module: string
  const entryOverride = config.entry ?? plan.entry
  if (entryOverride) module = resolve(root, entryOverride)
  else {
    const specifier = name + ((config.subpath ?? plan.subpath) ? '/' + (config.subpath ?? plan.subpath) : '')
    const command = bunRuntime ? (process.env.BUN_BIN ?? 'bun') : 'node'
    const args = bunRuntime ? ['-e'] : ['--experimental-import-meta-resolve', '--input-type=module', '-e']
    const resolution = spawnSync(command, [...args, 'process.stdout.write(import.meta.resolve(process.argv[1], process.argv[2]))', specifier, pathToFileURL(join(root, 'package.json')).href], { encoding: 'utf8', timeout: 30_000 })
    if (resolution.status !== 0) throw new Error(`Cannot resolve the actual ${bunRuntime ? 'Bun' : 'Node'} import-condition export ${specifier}: ${resolution.stderr}`)
    module = fileURLToPath(resolution.stdout.trim())
  }
  if (!existsSync(module)) throw new Error(`Missing published entry: ${module}`)
  const wasmFiles = [] as { path: string; sha256: string }[]
  const addFile = (path: string) => {
    if (existsSync(path)) wasmFiles.push({ path, sha256: artifactDigest(path) })
  }
  addFile(module)
  for (const relative of [plan.wasmRelativePath, 'pkg/affine_mermaid_renderer_wasm_bg.wasm', 'grok-mermaid.wasm', 'src/grok-mermaid.wasm', 'dist/xmermaid_bg.wasm'].filter((value): value is string => typeof value === 'string')) addFile(join(root, relative))
  const adapterCompanions = companions.map(spec => { const name = spec.slice(0, spec.lastIndexOf('@')), root = join(prefix, 'node_modules', name), pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); if (pkg.version !== spec.slice(spec.lastIndexOf('@') + 1)) throw Error('Adapter companion version differs: ' + spec); return { root, name, version: pkg.version as string, integrity: installedNpmIntegrity(prefix, root, name, pkg.version), closureSha256: createHash('sha256').update(JSON.stringify(adapterCompanionIdentity(root))).digest('hex') } })
  if (retainedDependencies.length) {
    const closure = captureInstalledDependencyClosure(root)
    for (const pkg of retainedDependencies) {
      const dependencyRoot = join(prefix, 'node_modules', pkg.name), realRoot = realpathSync(dependencyRoot)
      if (!closure.nodes.some(node => node.realRoot === realRoot) || closure.edges.some(edge => edge.name === pkg.name && edge.resolution?.realRoot !== realRoot)) throw Error('Candidate dependency is unused or resolves to another package: ' + pkg.name)
      const integrity = installedNpmIntegrity(prefix, dependencyRoot, pkg.name, pkg.version)
      if (integrity !== 'sha512-' + createHash('sha512').update(readFileSync(pkg.tarball)).digest('base64')) throw Error('Installed candidate dependency differs from its tarball: ' + pkg.name)
      wasmFiles.push(...verifyCandidateDependencyPayload(pkg, dependencyRoot))
      adapterCompanions.push({ root: dependencyRoot, name: pkg.name, version: pkg.version, integrity, closureSha256: createHash('sha256').update(JSON.stringify(adapterCompanionIdentity(dependencyRoot))).digest('hex') })
    }
  }
  const prepared: CommunityArtifact = { kind: 'node', root, module, version, integrity, installedClosureSha256: evidenceDigest(adapterCompanionIdentity(root)), runtime, sha256: artifactDigest(module), files: wasmFiles, ...(plan.wasmRelativePath ? { wasm: join(root, plan.wasmRelativePath) } : {}), apiBoundary: plan.boundary, ...(adapterCompanions.length ? { adapterCompanions } : {}), ...(plan.overrides ? { dependencyOverrides: plan.overrides } : {}), ...(candidate ? { candidate: { sha256: candidate.sha256, tarball: copy, ...(retainedDependencies.length ? { dependencies: retainedDependencies.map(({ tarball, sha256 }) => ({ tarball, sha256 })) } : {}) } } : {}) }
  return extra.prepareExtraPublishedArtifact(prepared, { installedIntegrity: (nativeRoot: string, packageName: string, packageVersion: string) => installedNpmIntegrity(prefix, nativeRoot, packageName, packageVersion) })
}

export function verifyProvidedCommunityArtifact(artifact: CommunityArtifact): void {
  if (artifact.candidate && 'tarball' in artifact.candidate) for (const archive of [artifact.candidate, ...(artifact.candidate.dependencies ?? [])]) verifyCandidateArchive(archive)
  for (const variant of artifact.additionalCli ?? []) if (variant.artifact) verifyProvidedCommunityArtifact(variant.artifact)
  const entry = artifact.kind === 'cli' || artifact.kind === 'jsonl-worker' ? artifact.executable : artifact.kind === 'python' ? (artifact.python ?? artifact.executable) : (artifact.module ?? artifact.executable)
  if (!entry || !existsSync(entry)) throw new Error('Provided artifact entry does not exist')
  for (const companion of artifact.adapterCompanions ?? []) {
    const manifest = JSON.parse(readFileSync(join(companion.root, 'package.json'), 'utf8'))
    if (manifest.name !== companion.name || manifest.version !== companion.version || createHash('sha256').update(JSON.stringify(adapterCompanionIdentity(companion.root))).digest('hex') !== companion.closureSha256) throw Error('Adapter companion closure changed: ' + companion.name)
  }
  const sourceFiles = artifact.sourceFiles as { root: string; revision: string; gitPath: string; blob: string }[] | undefined
  const dependencyPatches = artifact.dependencyPatches as { root: string; revision: string; gitPath: string; blob: string }[] | undefined
  if (!artifact.sha256 && !artifact.files?.length && !sourceFiles?.length) throw new Error('Provided artifacts require compiled/shipped byte identity or a clean pinned Git source proof')
  const verified = new Set<string>()
  for (const proof of [...(sourceFiles ?? []), ...(dependencyPatches ?? [])]) {
    if (!/^[a-f0-9]{40}$/.test(proof.revision) || !/^[a-f0-9]{40}$/.test(proof.blob)) throw new Error('Invalid Git source identity')
    const tree = execFileSync('git', ['ls-tree', proof.revision, '--', proof.gitPath], { cwd: proof.root, encoding: 'utf8' }).trim()
    if (!/^100(?:644|755) /.test(tree) || tree.split(/\s+/)[2] !== proof.blob) throw new Error('Interpreted source Git blob differs from its admitted revision')
    execFileSync('git', ['diff', '--quiet', proof.revision, '--', proof.gitPath], { cwd: proof.root })
    if (sourceFiles?.includes(proof)) verified.add(realpathSync(resolve(proof.root, proof.gitPath)))
  }
  for (const file of artifact.files ?? []) {
    if (!/^[a-f0-9]{64}$/.test(file.sha256) || !existsSync(file.path) || artifactDigest(file.path) !== file.sha256) throw new Error(`Artifact digest mismatch: ${file.path}`)
    verified.add(realpathSync(file.path))
  }
  if (artifact.sha256) {
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256) || artifactDigest(entry) !== artifact.sha256) throw new Error('Provided artifact entry digest mismatch')
    verified.add(realpathSync(entry))
  }
  if (!verified.has(realpathSync(entry))) throw new Error('Provided file manifest does not bind the executable/module entry')
  if (artifact.wasm && !verified.has(realpathSync(artifact.wasm))) throw new Error('Provided WASM is absent from the verified artifact file manifest')
  if (artifact.installedClosureSha256 && (!artifact.root || !/^[a-f0-9]{64}$/.test(artifact.installedClosureSha256) || evidenceDigest(adapterCompanionIdentity(artifact.root)) !== artifact.installedClosureSha256)) throw Error('Installed package closure changed')
}

const stableProtocol = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(stableProtocol)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => [key, stableProtocol(item)]),
        )
      : value
const sameProtocol = (left: unknown, right: unknown) => JSON.stringify(stableProtocol(left)) === JSON.stringify(stableProtocol(right))
function validateFrozenCommunityEntry(entry: PreparedCommunity, node: CommunityNode, options: UnifiedRunOptions): PreparedCommunity {
  if (!sameProtocol(entry.node.benchmark, node.benchmark) || !sameProtocol(entry.node.outputs, node.outputs) || entry.node.head !== node.head) throw Error(`Frozen node/config identity differs: ${node.id}`)
  if (!entry.artifact) return { node, error: entry.error ?? 'Frozen preparation did not record an actual artifact attempt; no acquisition is allowed during this run' }
  try {
    const artifact = entry.artifact
    verifyProvidedCommunityArtifact(artifact)
    verifyReleaseCli(node, artifact)
    const candidate = options.communityCandidate?.project === node.id ? options.communityCandidate : undefined
    const revision = candidate && 'revision' in candidate ? candidate.revision : undefined
    if (node.benchmark?.adapter === 'extra-source' && (artifact.reviewed !== true || artifact.sourceRevision !== (revision ?? node.benchmark.sourcePin) || !artifact.buildRecipeId || !artifact.runtimeCommandId)) throw Error('Source artifact has no exact reviewed Git/protocol binding')
    if (node.benchmark?.adapter === 'source-cli' && artifact.revision !== (revision ?? node.release?.commit ?? node.head)) throw Error('Native artifact revision differs from recorded source pin')
    if (node.benchmark?.adapter === 'franken' && artifact.revision !== node.distribution?.revision) throw Error('WASM artifact revision differs from frozen distribution')
    if (!!artifact.candidate !== !!candidate || (candidate && artifact.candidate && candidateKey(artifact.candidate) !== candidateKey(candidate))) throw Error('Frozen artifact and the requested candidate differ')
    if (artifact.candidate && 'tarball' in artifact.candidate && (!existsSync(artifact.candidate.tarball) || artifactDigest(artifact.candidate.tarball) !== artifact.candidate.sha256)) throw Error('Frozen candidate tarball differs from its SHA-256')
    if (node.benchmark?.package) {
      if (!artifact.root) throw Error('Frozen npm artifact has no installed package root')
      const pkg = JSON.parse(readFileSync(join(artifact.root, 'package.json'), 'utf8'))
      if (pkg.name !== node.benchmark.package || pkg.version !== artifact.version || (node.benchmark.version && !artifact.candidate && pkg.version !== node.benchmark.version)) throw Error('Frozen installed npm package identity differs')
      const levels = pkg.name.startsWith('@') ? '../../..' : '../..',
        prefix = resolve(artifact.root, levels)
      if (installedNpmIntegrity(prefix, artifact.root, pkg.name, pkg.version) !== artifact.integrity) throw Error('Frozen npm lock integrity differs')
    }
    return { node, artifact }
  } catch (error) {
    return { node, error: `Frozen artifact validation failed (not reacquired): ${String(error)}` }
  }
}
function loadFrozenCommunity(options: UnifiedRunOptions, nodes: CommunityNode[]): PreparedCommunity[] {
  const path = options.communityPreparedFile!,
    raw = JSON.parse(readFileSync(path, 'utf8')) as PreparedCommunity[]
  if (!Array.isArray(raw) || new Set(raw.map(entry => entry.node.id)).size !== raw.length || (!options.communityProjects && raw.length !== nodes.length) || nodes.some(node => !raw.some(entry => entry.node.id === node.id))) throw Error('Frozen preparation must contain every selected catalog ID exactly once')
  const prepared = nodes.map(node => validateFrozenCommunityEntry(raw.find(entry => entry.node.id === node.id)!, node, options))
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'community-prepared.json'), JSON.stringify(prepared, null, 2))
  writeFileSync(
    join(options.out, 'community-preparation-provenance.json'),
    JSON.stringify(
      { source: resolve(path), sourceSha256: artifactDigest(path), loadedAt: new Date().toISOString(), acquisition: 'forbidden; frozen actual failures are retained without retry', invalidArtifacts: prepared.filter(entry => !entry.artifact).map(entry => ({ id: entry.node.id, error: entry.error })) },
      null,
      2,
    ),
  )
  return prepared
}
export async function prepareCommunity(options: UnifiedRunOptions): Promise<PreparedCommunity[]> {
  const driver = options.harnessRoot ?? options.root,
    cache = resolve(process.env.AM_COMMUNITY_CACHE ?? join(driver, 'node_modules/.cache/unified-community'))
  mkdirSync(cache, { recursive: true })
  const catalog = JSON.parse(readFileSync(options.communityCatalogFile ?? communityCatalogFile, 'utf8')) as { nodes: CommunityNode[] }
  catalog.nodes = selectCommunityProjects(catalog.nodes, options.communityProjects)
  const skipped = catalog.nodes.filter(node => releaseBenchmarkSkip(node, options.communityCandidate?.project))
  if (options.communityProjects && skipped.length === catalog.nodes.length) throw Error('Benchmark release skipped: ' + skipped.map(node => node.id + ': ' + releaseBenchmarkSkip(node)!.reason).join('; '))
  catalog.nodes = catalog.nodes.filter(node => !skipped.includes(node))
  if (options.communityPreparedFile) return loadFrozenCommunity(options, catalog.nodes)
  const manifestPath = options.communityArtifacts ?? process.env.AM_BENCH_COMMUNITY_ARTIFACTS
  const provided = manifestPath ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, CommunityArtifact>) : {}
  const prepared: PreparedCommunity[] = []
  mkdirSync(options.out, { recursive: true })
  const checkpoint = (complete: boolean) => {
    writePreparationCheckpoint(join(options.out, 'community-prepared.json'), prepared)
    writePreparationCheckpoint(join(options.out, 'community-preparation-status.json'), {
      complete,
      updatedAt: new Date().toISOString(),
      expectedIds: catalog.nodes.map(node => node.id),
      attempted: prepared.length,
      ready: prepared.filter(entry => entry.artifact).length,
      failures: prepared.filter(entry => !entry.artifact).map(entry => ({ id: entry.node.id, error: entry.error ?? 'No applicable adapter configured' })),
    })
  }
  checkpoint(false)
  const preparationPriority = (node: CommunityNode) => (node.benchmark?.adapter !== 'extra-source' ? 0 : ['fork-go-cli', 'mermaidtext-go'].includes(node.benchmark.sourceAdapter ?? '') ? 1 : node.benchmark.sourceAdapter === 'grok-source' ? 3 : 2)
  const preparationOrder = process.env.AM_COMMUNITY_SOURCE_PREPARATION_GATE ? [...catalog.nodes].sort((left, right) => preparationPriority(left) - preparationPriority(right)) : catalog.nodes
  for (const node of preparationOrder) {
    console.log(`community preparation ${prepared.length + 1}/${catalog.nodes.length}: ${node.id}`)
    if (!node.benchmark) {
      prepared.push({ node, error: 'Applicable catalog operations have no admitted adapter; explicitly unmeasured' })
      checkpoint(false)
      continue
    }
    try {
      if (node.benchmark.preparationError) throw Error(String(node.benchmark.preparationError))
      if (node.benchmark.adapter === 'declared')
        for (const output of new Set((node.benchmark.outputs ?? []).map(normalizeCommunityOutput))) if (typeof node.benchmark.api?.[output]?.export !== 'string') throw new Error(`Declared adapter has no api.${output}.export binding for its declared ${output} output`)
      const candidate = options.communityCandidate?.project === node.id ? options.communityCandidate : undefined
      let artifact = candidate ? undefined : provided[node.id]
      if (candidate) {
        assertCommunityCandidate([node], candidate)
        artifact = 'revision' in candidate ? await sourceCandidateArtifact(node, cache, candidate) : await npmArtifact(node, cache, true, candidate)
      } else if (artifact) {
        verifyProvidedCommunityArtifact(artifact)
        if (['dart', 'bezel', 'franken', 'termaid'].includes(node.benchmark.adapter)) {
          const { prepareCommunityArtifact } = await import('./community-artifact-prepare.ts')
          if (options.communityArtifactPolicy !== 'frozen') artifact = await prepareCommunityArtifact(node, cache, manifestPath)
          verifyProvidedCommunityArtifact(artifact)
          if (node.benchmark.adapter === 'franken' && artifact.revision !== node.distribution?.revision) throw new Error('Provided Franken distribution revision differs from its recorded immutable pin')
        } else if (node.benchmark.adapter === 'extra-source') {
          if (artifact.reviewed !== true || artifact.sourceRevision !== node.benchmark.sourcePin || !artifact.buildRecipeId || !artifact.runtimeCommandId) throw new Error('Provided source artifact lacks exact reviewed source/protocol identity')
        } else if (node.benchmark.package || artifact.kind === 'node') {
          if (!artifact.root) throw new Error('Provided Node artifact requires an actual package root')
          const pkg = JSON.parse(readFileSync(join(artifact.root, 'package.json'), 'utf8')) as { name: string; version: string },
            expectedName = node.benchmark.package
          if (!expectedName || pkg.name !== expectedName || pkg.version !== artifact.version) throw new Error('Provided Node artifact package name/version does not match its installed metadata')
          if (node.benchmark.package) {
            const recorded = node.benchmark.version ?? node.packages?.find(pkg => pkg.registry === 'npm' && pkg.name === expectedName)?.version
            const pinned = node.id === 'mermaid-js/mermaid' || node.benchmark.versionPolicy === 'recorded' || !!node.benchmark.version || process.env.AM_COMMUNITY_VERSION_POLICY === 'recorded'
            let expectedVersion = recorded
            if (options.communityArtifactPolicy === 'frozen' && !node.benchmark.version) expectedVersion = artifact.version
            else if (!pinned) {
              const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(expectedName)}/latest`)
              if (!response.ok) throw new Error(`Cannot resolve provided package version: HTTP ${response.status}`)
              expectedVersion = ((await response.json()) as { version: string }).version
            }
            if (artifact.version !== expectedVersion) throw new Error('Provided Node artifact differs from the resolved recorded/latest version policy')
          }
        } else if (node.benchmark.adapter === 'source-cli') {
          const revision = node.release?.commit ?? node.head
          if (!revision || artifact.revision !== revision) throw new Error('Provided native artifact revision differs from the recorded immutable source pin')
          if (artifact.kind === 'cli') {
            const { reviewedCommunitySourcePresentation } = await import('./community-source-prepare.ts')
            const presentation = reviewedCommunitySourcePresentation(node)
            artifact = { ...artifact, ...presentation, detail: [artifact.detail, presentation.defaults].filter(Boolean).join('; ') }
          }
        }
      } else if (node.benchmark.adapter === 'extra-source') {
        const goRecipe = ['fork-go-cli', 'mermaidtext-go'].includes(node.benchmark.sourceAdapter ?? '')
        const gate = !goRecipe ? (process.env.AM_COMMUNITY_NON_GO_PREPARATION_GATE ?? process.env.AM_COMMUNITY_SOURCE_PREPARATION_GATE) : process.env.AM_COMMUNITY_SOURCE_PREPARATION_GATE
        if (gate && existsSync(gate)) {
          console.log(`community source-build scheduler waiting for ${gate} to be removed before ${node.id}`)
          while (existsSync(gate)) {
            assertCommunityNotInterrupted()
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        const { prepareExtraCommunitySource } = await import('./community-extra-source.ts')
        artifact = await prepareExtraCommunitySource(node, process.env.AM_COMMUNITY_SOURCE_CACHE ?? cache)
      } else if (node.benchmark.package) artifact = await npmArtifact(node, cache, node.id === 'mermaid-js/mermaid')
      else if (node.benchmark.adapter === 'source-cli') {
        const { prepareCommunitySource } = await import('./community-source-prepare.ts')
        if (node.benchmark.cliRelease) {
          const result = await (await import('./release-cli.ts')).prepareReleaseCli(node, cache)
          if (!result.artifact) throw Error(result.error)
          const { reviewedCommunitySourcePresentation } = await import('./community-source-prepare.ts')
          artifact = { ...result.artifact, ...reviewedCommunitySourcePresentation(node) }
        } else artifact = await prepareCommunitySource(node, process.env.AM_COMMUNITY_SOURCE_CACHE ?? cache)
      } else {
        const { prepareCommunityArtifact } = await import('./community-artifact-prepare.ts')
        artifact = await prepareCommunityArtifact(node, cache)
      }
      if (!artifact) throw new Error('Preparation returned no actual artifact')
      if (node.benchmark.adapter === 'source-cli' && node.benchmark.cliRelease && artifact.kind === 'cli') artifact.outputBindings = { ...node.benchmark.cliRelease.outputs, ...(artifact.outputBindings ?? {}) }
      if (node.benchmark.adapter === 'source-cli' && node.benchmark.cliRelease && !artifact.candidate) {
        const { verifyReleaseCli } = await import('./release-cli.ts')
        verifyReleaseCli(node, artifact)
      }
      if (node.benchmark.cliRelease && node.benchmark.adapter !== 'source-cli' && !(provided[node.id] && options.communityArtifactPolicy === 'frozen')) artifact = { ...artifact, additionalCli: [await (await import('./release-cli.ts')).prepareReleaseCli(node, cache)] }
      if (node.benchmark.cli && !(artifact.additionalCli ?? []).some(cli => cli.id === 'node-cli')) {
        const cli = (await import('./community-cli.ts')).packageCliVariants([{ node, artifact }]).find(variant => variant.variant === 'node-cli')
        if (cli) artifact = { ...artifact, additionalCli: [...(artifact.additionalCli ?? []), { id: cli.variant, outputs: cli.outputs, artifact: cli.prepared.artifact, error: cli.error }] }
      }
      artifact.detail = `${artifact.detail ?? ''}${artifact.detail ? '; ' : ''}Version policy: ${artifact.candidate ? ('revision' in artifact.candidate ? `unreleased candidate revision ${artifact.candidate.revision}, built with the reviewed source recipe; the catalog source pin does not apply` : 'unreleased candidate tarball; the catalog version pin does not apply') : provided[node.id] && options.communityArtifactPolicy === 'frozen' ? 'provided actual artifact version/bytes frozen; no latest lookup' : node.id === 'mermaid-js/mermaid' ? 'pinned current Mermaid' : node.benchmark.adapter === 'source-cli' || node.benchmark.adapter === 'extra-source' || node.benchmark.adapter === 'franken' ? 'recorded immutable source/distribution' : node.benchmark.version || node.benchmark.versionPolicy === 'recorded' || process.env.AM_COMMUNITY_VERSION_POLICY === 'recorded' ? 'recorded registry release' : 'resolved latest registry release'}. Recorded catalog versions remain separately available on the node.`
      prepared.push({ node, artifact })
    } catch (error) {
      prepared.push({ node, error: String(error) })
    }
    checkpoint(false)
  }
  prepared.sort((left, right) => catalog.nodes.findIndex(node => node.id === left.node.id) - catalog.nodes.findIndex(node => node.id === right.node.id))
  checkpoint(true)
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'community-prepared.json'), JSON.stringify(prepared, null, 2))
  return prepared
}

export function selectCommunityProjects(nodes: CommunityNode[], projects?: string[]): CommunityNode[] {
  if (new Set(nodes.map(node => node.id)).size !== nodes.length) throw Error('Duplicate community catalog IDs')
  if (!projects) return nodes
  if (!projects.length || projects.some(id => !id || !nodes.some(node => node.id === id)) || new Set(projects).size !== projects.length) throw Error('Community project selection must contain unique known catalog IDs')
  return nodes.filter(node => projects.includes(node.id))
}

/** Whether a project's catalog binding declares this output anywhere: its module, its npm
 * CLI or its release CLI. Collectors take only the projects that declare their format, so a
 * prepared list that holds every project (the prepare command writes one) is safe to pass. */
export function communityDeclaresOutput(node: CommunityNode, output: string): boolean {
  const binding = node.benchmark
  if (!binding) return false
  const release = binding.cliRelease?.outputs as unknown
  const releaseOutputs = Array.isArray(release) ? release : Object.keys((release as Record<string, unknown>) ?? {})
  return [...(binding.outputs ?? []), ...releaseOutputs, ...(binding.cli?.outputs ?? [])].map(normalizeCommunityOutput).includes(normalizeCommunityOutput(output))
}
export function communityModuleOutputSupported(node: CommunityNode, output: string): boolean {
  const declared = node.benchmark?.moduleOutputs
  if (declared) return declared.map(normalizeCommunityOutput).includes(normalizeCommunityOutput(output))
  const mermaid = node.benchmark?.adapter === 'mermaid' || ['mermaid-source', 'mermaid-fork'].includes(node.benchmark?.sourceAdapter ?? '')
  return !mermaid || normalizeCommunityOutput(output) === 'parse'
}
