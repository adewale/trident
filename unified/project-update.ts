import { readBenchmarkDocument, writeBenchmarkDocument } from '../portable/project-records.ts'
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { cpus, hostname, release } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { captureInstalledDependencyClosure } from '../portable/artifact-dependencies.ts'
import { assertCommunityCandidate, communityCoreWorkloads, prepareCommunity, rankCommunityObservations, runCommunitySuite, selectCommunityProjects, verifyFrozenBrowserEngine, verifyProvidedCommunityArtifact } from './community.ts'
import { type PreparedCommunityBrowser, prepareCommunityBrowsers } from './community-browser.ts'
import { communityCliCacheIdentity, communityObserver, runCommunityCliSuite } from './community-cli.ts'
import { communityProtocolIdentity } from './community-protocol-identity.ts'
import type { CommunityNode, PreparedCommunity } from './community-types.ts'
import { activateProjectRecord, findProjectRecord, inspectCurrentProjectRecords, type ProjectBenchmarkIdentity, type ProjectBenchmarkRecord, publishProjectRecord, stableValue } from '../portable/project-records.ts'
import { withReferenceLabels } from './qualification.ts'
import { parseOptions } from './options.ts'
import type { BenchmarkObservation, UnifiedRunOptions, UnifiedSuiteResult } from './types.ts'
import { corpusEvidence, corpusWorkloads } from './corpus.ts'
import { comparisonProjects } from './lineage.ts'
import { communityCatalogFile, tridentDirectory } from './trident-paths.ts'

const json = readBenchmarkDocument
const writeJson = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const now = () => new Date().toISOString()
const status = (rows: BenchmarkObservation[]): ProjectBenchmarkRecord['status'] => (rows.some(row => row.status === 'failed') ? 'failed' : rows.some(row => row.status === 'blocked') ? 'blocked' : 'passed')

export interface ProjectUpdateRequest {
  identity: ProjectBenchmarkIdentity
  measure(): Promise<ProjectBenchmarkRecord>
}
/** Timed work is behind the cache lookup; a forced retry retains the old attempt. */
export async function updateProjectRecords(store: string, requests: ProjectUpdateRequest[], force = false) {
  if (new Set(requests.map(request => request.identity.project)).size !== requests.length) throw Error('Duplicate project update')
  const updates: { project: string; action: 'reused' | 'measured'; record: ProjectBenchmarkRecord }[] = []
  for (const request of requests) {
    const retained = force ? undefined : findProjectRecord(store, request.identity)
    if (retained) {
      if ((retained.provenance as { protocol?: string } | undefined)?.protocol === 'community-project-update-v1') {
        const contextFile = (retained.provenance as { contextFile: string }).contextFile
        if (stableValue(json(contextFile)) !== stableValue(json(join(retained.evidenceDirectory, 'context.json')))) throw Error('Retained protocol context differs from its immutable result witness')
        const rows = [json(join(retained.evidenceDirectory, 'community/community-result.json')), json(join(retained.evidenceDirectory, 'community-cli/community-cli-suite.json'))].flatMap(result => result.observations)
        if (stableValue(rows) !== stableValue(retained.observations)) throw Error('Retained owning results differ from the immutable project record: ' + retained.identity.project)
      }
      activateProjectRecord(store, retained)
      updates.push({ project: request.identity.project, action: 'reused', record: retained })
      continue
    }
    const record = await request.measure()
    if (stableValue(record.identity) !== stableValue(request.identity)) throw Error('Measurement returned a different project/protocol identity')
    publishProjectRecord(store, record)
    updates.push({ project: request.identity.project, action: 'measured', record })
  }
  return updates
}

function protocolContext(options: UnifiedRunOptions, inputs: unknown) {
  const root = options.harnessRoot ?? options.root
  // Git object IDs identify committed protocols; compare literal frozen inputs once,
  // rather than hashing our source or maintaining an invalidation version by hand.
  const code = communityProtocolIdentity()
  const require = createRequire(join(tridentDirectory, 'package.json'))
  const dependencies = captureInstalledDependencyClosure(tridentDirectory)
  const version = (command: string) => {
    try {
      return execFileSync(command, ['--version'], { encoding: 'utf8', timeout: 10_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
    } catch {
      return null
    }
  }
  const browserPath = options.executable ?? require('playwright').chromium.executablePath()
  const binary = (command: string) => {
    try {
      const path = command.includes('/') ? command : execFileSync('which', [command], { encoding: 'utf8' }).trim()
      return { path, version: version(path), sha256: existsSync(path) ? byteDigest(path) : null }
    } catch {
      return { path: command, version: null, sha256: null }
    }
  }
  return {
    protocol: 'community-project-records-v1',
    code,
    dependencies,
    inputs,
    measurement: {
      profile: options.profile,
      rounds: options.rounds,
      coverageOnce: options.communityCoverageOnce ?? true,
      outputs: options.communityOutputs ?? null,
      qualification: options.communityQualificationProtocol ?? null,
      host: hostname(),
      platform: process.platform,
      arch: process.arch,
      kernel: release(),
      cpu: cpus().map(cpu => cpu.model),
      node: binary(process.env.NODE_BIN ?? 'node'),
      bun: binary(process.env.BUN_BIN ?? 'bun'),
      python: binary('python3'),
      driver: process.versions,
      browser: binary(browserPath),
      observer: communityCliCacheIdentity({ target: options.root, packageRoot: options.packageRoot ?? options.root, observerExecutable: communityObserver(options) }, []).observer,
      environment: Object.fromEntries(['NODE_OPTIONS', 'BUN_OPTIONS', 'NODE_ENV', 'TZ', 'LANG', 'LC_ALL', 'LC_NUMERIC', 'AGENTIC_MERMAID_EXPERIMENTS'].map(name => [name, process.env[name] ?? null])),
      cpuLimit: existsSync('/sys/fs/cgroup/cpu.max') ? readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim() : null,
      memoryLimit: existsSync('/sys/fs/cgroup/memory.max') ? readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim() : null,
    },
  }
}
/** Only shipped/fetched artifacts are hashed, never our source or corpus inputs. */
function byteDigest(path: string): string {
  const fd = openSync(path, 'r'),
    hash = createHash('sha256'),
    buffer = Buffer.alloc(1024 * 1024)
  try {
    let count: number
    while ((count = readSync(fd, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, count))
  } finally {
    closeSync(fd)
  }
  return hash.digest('hex')
}
function fetchedFiles(root: string, directory = root): { path: string; sha256: string }[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => {
      if (['node_modules', '.git'].includes(entry.name)) return []
      const path = join(directory, entry.name)
      return entry.isDirectory() ? fetchedFiles(root, path) : entry.isFile() ? [{ path: relative(root, path), sha256: byteDigest(path) }] : []
    })
}
function retainContext(store: string, context: unknown): string {
  const directory = join(store, 'contexts')
  mkdirSync(directory, { recursive: true })
  const wanted = stableValue(context)
  for (const name of readdirSync(directory).filter(name => name.endsWith('.json'))) {
    if (stableValue(json(join(directory, name))) === wanted) return name
  }
  const name = randomUUID() + '.json'
  writeBenchmarkDocument(join(directory, name), context)
  return name
}
export function projectPackageIdentity(prepared: PreparedCommunity) {
  if (!prepared.artifact) return { error: prepared.error ?? null, selectors: { benchmark: prepared.node.benchmark ?? null, head: prepared.node.head ?? null, release: prepared.node.release ?? null, distribution: prepared.node.distribution ?? null } }
  verifyProvidedCommunityArtifact(prepared.artifact)
  const artifact = { ...prepared.artifact }
  delete artifact.detail
  // A source candidate is its commit wherever it was fetched from, so the remote is not identity.
  const revision = artifact.candidate && 'revision' in artifact.candidate ? artifact.candidate.revision : undefined
  if (revision) {
    artifact.candidate = { revision } as typeof artifact.candidate
    delete artifact.acquisitionOrigin
  }
  const root = artifact.root
  // Source recipes seal their actual runtime closure separately from build-only
  // declarations in the upstream source manifest. Reuse that admitted closure.
  if (artifact.runtimeDependencyRoots) {
    const source = prepared.node.benchmark
    if (source?.adapter !== 'extra-source' || !source.sourceAdapter || !/^[a-f0-9]{40}$/.test(revision ?? source.sourcePin ?? '') || !artifact.reviewed || artifact.sourceRevision !== (revision ?? source.sourcePin) || !artifact.buildRecipeId?.startsWith(`extra-source-v1:${source.sourceAdapter}:`)) throw Error('Runtime dependency roots require a matching reviewed source recipe')
    const sealed = new Set(artifact.files?.map(file => resolve(file.path)))
    for (const dependency of artifact.runtimeDependencyRoots) {
      if (!sealed.has(resolve(dependency, 'package.json'))) throw Error('Runtime package manifest is absent from the verified artifact closure: ' + dependency)
    }
    return { artifact, files: null, dependencies: { runtimeDependencyRoots: artifact.runtimeDependencyRoots } }
  }
  const files = root && existsSync(join(root, 'package.json')) ? fetchedFiles(root) : null
  return { artifact, files, dependencies: root && existsSync(join(root, 'package.json')) ? captureInstalledDependencyClosure(root) : null }
}
/** Admit each project's runtime independently before any measurement starts. */
export function admitProjectArtifacts(preparedEntry: PreparedCommunity, preparedBrowser: PreparedCommunityBrowser, options: UnifiedRunOptions) {
  let entry = preparedEntry,
    browser = preparedBrowser
  const cliIdentity = () => communityCliCacheIdentity({ target: options.root, packageRoot: options.packageRoot ?? options.root, observerExecutable: communityObserver(options) }, [entry])
  let packageArtifact: ReturnType<typeof projectPackageIdentity>, cli: ReturnType<typeof cliIdentity>
  try {
    verifyFrozenBrowserEngine(browser)
    packageArtifact = projectPackageIdentity(entry)
    cli = cliIdentity()
  } catch (error) {
    // One rejected installation must not prevent other projects from running.
    // Keep its explicit admission failure, with no artifact eligible for clocks.
    entry = { node: entry.node, error: 'Project artifact admission failed: ' + (error instanceof Error ? error.message : String(error)) }
    browser = { ...entry, browserStatus: 'blocked', browserDetail: entry.error }
    packageArtifact = projectPackageIdentity(entry)
    cli = cliIdentity()
  }
  return { entry, browser, packageArtifact, cli }
}
/** An unreleased build says so in its record and is keyed by its bytes: it lives in the
 * candidate lane, so it never reuses, replaces or ranks as the release. */
export function candidateIdentity(entry: PreparedCommunity, options: Pick<UnifiedRunOptions, 'communityCandidate' | 'packageRoot'>, _files: unknown): { source: 'tarball'; sha256: string } | { source: 'revision'; revision: string } | undefined {
  const candidate = options.communityCandidate
  // A revision is the whole identity: where it was fetched from cannot change its bytes.
  if (candidate?.project === entry.node.id) return 'revision' in candidate ? { source: 'revision', revision: candidate.revision } : { source: 'tarball', sha256: candidate.sha256 }
  if (entry.artifact?.candidate) throw Error('A candidate artifact reached a release record: ' + entry.node.id)
  return undefined
}
/** A source candidate is one Git commit, fetched from the project's GitHub repository unless
 * --candidate-remote names another Git URL or a local clone. A clean local clone needs no
 * revision: its HEAD is the candidate. */
function sourceCandidate(project: string, revision: string | undefined, remote: string | undefined): { revision: string; remote: string } {
  const local = remote && !/^(?:[a-z][a-z0-9+.-]*:\/\/|[^/@:]+@[^:]+:)/i.test(remote) ? resolve(remote) : undefined
  if (local) {
    if (!existsSync(local)) throw Error(`--candidate-remote ${local} does not exist`)
    const git = (...args: string[]) => execFileSync('git', args, { cwd: local, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
    if (!revision && git('status', '--porcelain', '--untracked-files=no')) throw Error(`${local} has uncommitted changes; commit them or name a --candidate-revision, because a candidate is a Git commit`)
    try {
      revision = git('rev-parse', '--verify', `${revision ?? 'HEAD'}^{commit}`)
    } catch {
      throw Error(`${local} has no commit ${revision ?? 'HEAD'}`)
    }
  }
  if (!revision) throw Error('--candidate-revision is required unless --candidate-remote is a local clone')
  if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('--candidate-revision must be a full 40-character lowercase Git commit when the remote is not a local clone')
  return { revision, remote: local ?? remote ?? `https://github.com/${project}.git` }
}
/** --candidate-tarball with its --candidate-sha256, or --candidate-dir, which npm packs here without running scripts,
 * for an npm-backed tool; --candidate-revision and/or --candidate-remote for a tool Trident builds from source. */
export function communityCandidate(values: { tarball?: string; sha256?: string; directory?: string; revision?: string; remote?: string }, options: Pick<UnifiedRunOptions, 'communityProjects' | 'communityArtifacts' | 'communityPreparedFile' | 'communityBrowserPreparedFile' | 'out'>): UnifiedRunOptions['communityCandidate'] {
  if (!values.tarball && !values.sha256 && !values.directory && !values.revision && !values.remote) return undefined
  const project = options.communityProjects?.length === 1 ? options.communityProjects[0]! : undefined
  if (!project) throw Error('A candidate needs exactly one --projects OWNER/TOOL')
  if (options.communityArtifacts || options.communityPreparedFile || options.communityBrowserPreparedFile) throw Error('A candidate is acquired from its own tarball or revision; drop --community-artifacts, --community-prepared and --community-browser-prepared')
  if (values.revision || values.remote) {
    if (values.tarball || values.sha256 || values.directory) throw Error('Use --candidate-revision or --candidate-remote for a source build, or a tarball or --candidate-dir for an npm package, not both')
    return { project, ...sourceCandidate(project, values.revision, values.remote) }
  }
  if (values.directory) {
    if (values.tarball || values.sha256) throw Error('Use --candidate-dir, or --candidate-tarball with --candidate-sha256, not both')
    const destination = join(options.out, 'candidate-packs', randomUUID())
    mkdirSync(destination, { recursive: true })
    const packed = JSON.parse(execFileSync('npm', ['pack', resolve(values.directory), '--ignore-scripts', '--json', '--pack-destination', destination], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, npm_config_cache: process.env.npm_config_cache ?? join(options.out, 'npm-cache') } }))
    const tarball = join(destination, packed[0].filename)
    return { project, tarball, sha256: byteDigest(tarball), packedFrom: resolve(values.directory) }
  }
  if (!values.tarball || !values.sha256) throw Error('--candidate-tarball and --candidate-sha256 go together')
  if (!/^[a-f0-9]{64}$/.test(values.sha256)) throw Error('--candidate-sha256 must be a lowercase SHA-256 digest')
  const tarball = resolve(values.tarball)
  if (!existsSync(tarball) || byteDigest(tarball) !== values.sha256) throw Error(`Candidate tarball ${tarball} differs from --candidate-sha256`)
  return { project, tarball, sha256: values.sha256 }
}
function inventoryFiles(directory: string, current = directory): string[] {
  return readdirSync(current, { withFileTypes: true })
    .flatMap(entry => {
      const path = join(current, entry.name)
      return entry.isDirectory() ? inventoryFiles(directory, path) : entry.isFile() ? [relative(directory, path)] : []
    })
    .sort()
}
const escape = (value: unknown) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
const measuredVersion = (record: ProjectBenchmarkRecord) => (record.identity.artifact as { package?: { artifact?: { version?: string } } }).package?.artifact?.version ?? 'unavailable'
export function renderProjectRecords(records: ProjectBenchmarkRecord[], population: CommunityNode[], unavailable: ProjectBenchmarkRecord[] = []): string {
  const lines = [
    '<!-- community-project-records:start -->',
    '## Retained project updates',
    '',
    'These rolling records retain each project’s measurement date, environment and protocol. Updating one project does not retime the others. Historical comparison tables above retain their original snapshots.',
    '',
    '| Project | Measured version | Attempt finished (UTC) | Status | Record |',
    '|---|---|---|---|---|',
    ...records.map(record => `| ${escape(record.identity.project)} | ${escape(measuredVersion(record))} | ${record.finishedAt} | ${record.status} | ${escape(record.id)} |`),
    ...unavailable.map(record => `| ${escape(record.identity.project)} | ${escape(measuredVersion(record))} | ${record.finishedAt} | evidence missing; excluded | ${escape(record.id)} |`),
    '',
    `Current catalog: ${population.length} projects. Retained records: ${records.length}. Records with missing evidence: ${unavailable.length}. Unmeasured in this store: ${
      population
        .filter(node => ![...records, ...unavailable].some(record => record.identity.project === node.id))
        .map(node => node.id)
        .join(', ') || 'none'
    }.`,
    '',
    'Speed ranks below compare only records with the same protocol, literal inputs, runtime environment and measurement settings. They are rolling measurements, not paired same-session experiments. Output admission does not establish equal fidelity.',
    '',
  ]
  const groups = new Map<string, ProjectBenchmarkRecord[]>()
  for (const record of records) {
    const protocol = record.identity.protocol as { context: string; browserQualifier?: string | null }
    const key = stableValue([protocol.context, protocol.browserQualifier ?? null, record.identity.measurement])
    groups.set(key, [...(groups.get(key) ?? []), record])
  }
  let groupNumber = 0
  for (const group of groups.values()) {
    const context = group[0]!.identity.protocol as { context: string }
    const measurement = group[0]!.identity.measurement as { rounds: number }
    lines.push(
      `### Comparable cohort ${++groupNumber}`,
      '',
      `Context: ${escape(context.context)}. Measured ${group.map(record => record.finishedAt).sort()[0]} through ${group
        .map(record => record.finishedAt)
        .sort()
        .at(-1)}.`,
      '',
    )
    const ranks = rankCommunityObservations(
      group.flatMap(record => record.observations.filter(row => row.suite !== 'community-cli')),
      measurement.rounds,
    )
    const lanes = new Set(ranks.map(rank => `${rank.surface} / ${rank.output}`))
    for (const lane of lanes) {
      lines.push(`**${escape(lane)}** — sum of matched core inputs, milliseconds.`, '', '| Rank | Project | Version | Time |', '|---:|---|---|---:|')
      const rows = ranks.filter(rank => `${rank.surface} / ${rank.output}` === lane)
      const qualified = rows.filter(rank => rank.qualified).sort((a, b) => a.medianMs! - b.medianMs!)
      lines.push(...qualified.map((rank, index) => `| ${index + 1} | ${escape(rank.implementation)} | ${escape(rank.version)} | ${rank.medianMs!.toFixed(3)} |`), '')
      const unqualified = rows.filter(rank => !rank.qualified)
      if (unqualified.length) lines.push(`Unranked because the complete core did not qualify: ${unqualified.map(rank => rank.implementation).join(', ')}.`, '')
    }
  }
  lines.push('<!-- community-project-records:end -->', '')
  return lines.join('\n')
}
export function updateProjectMarkdown(path: string, records: ProjectBenchmarkRecord[], population: CommunityNode[], unavailable: ProjectBenchmarkRecord[] = []) {
  const start = '<!-- community-project-records:start -->',
    end = '<!-- community-project-records:end -->'
  const original = existsSync(path) ? readFileSync(path, 'utf8') : '# Mermaid community benchmark records\n'
  const hasStart = original.includes(start),
    hasEnd = original.includes(end)
  if (hasStart !== hasEnd || original.indexOf(start) !== original.lastIndexOf(start) || original.indexOf(end) !== original.lastIndexOf(end)) throw Error('Ambiguous retained-record Markdown markers')
  if (hasStart && original.indexOf(end) < original.indexOf(start)) throw Error('Retained-record Markdown end precedes its start')
  const section = renderProjectRecords(records, population, unavailable)
  const result = hasStart ? original.slice(0, original.indexOf(start)) + section + original.slice(original.indexOf(end) + end.length).trimStart() : original.trimEnd() + '\n\n' + section
  const temporary = path + `.pending-${randomUUID()}`
  writeFileSync(temporary, result, { flag: 'wx' })
  renameSync(temporary, path)
}

export async function runProjectUpdates(options: UnifiedRunOptions, settings: { plan?: boolean; markdown?: string } = {}) {
  assertBenchmarkExecutionAllowed()
  // Preparation and clocks also share caches. Serialize the whole campaign,
  // rather than protecting only the final record-index write.
  const cache = resolve(process.env.AM_COMMUNITY_CACHE ?? join(options.harnessRoot ?? options.root, 'node_modules/.cache/unified-community'))
  mkdirSync(cache, { recursive: true })
  const lock = join(cache, 'project-campaign.lock')
  const fd = openSync(lock, 'wx')
  try {
    writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: now() }))
    return await runProjectUpdatesUnlocked(options, settings)
  } finally {
    closeSync(fd)
    unlinkSync(lock)
  }
}
async function runProjectUpdatesUnlocked(options: UnifiedRunOptions, settings: { plan?: boolean; markdown?: string }) {
  assertBenchmarkExecutionAllowed()
  const driver = options.harnessRoot ?? options.root
  const store = options.communityRecordStore ?? join(driver, 'bench-report/project-records')
  const catalog = json(options.communityCatalogFile ?? communityCatalogFile) as { nodes: CommunityNode[] }
  selectCommunityProjects(catalog.nodes, options.communityProjects) // Reject unknown IDs before acquisition.
  const candidate = options.communityCandidate
  if (candidate) {
    assertCommunityCandidate(catalog.nodes, candidate)
    if (options.communityProjects?.length !== 1 || options.communityProjects[0] !== candidate.project) throw Error('A candidate run selects exactly its own project')
  }
  const startedAt = now(),
    attempt = join(options.out, 'project-attempts', randomUUID()),
    preparation = join(attempt, 'preparation')
  mkdirSync(preparation, { recursive: true })
  let inputs: unknown
  if (options.communityInputsFile) inputs = json(options.communityInputsFile)
  else {
    const enriched = await withReferenceLabels(corpusWorkloads(options.profile), { root: driver })
    inputs = { workloads: [...communityCoreWorkloads(), ...enriched.workloads], reference: enriched.provenance ?? null, gaps: enriched.gaps }
  }
  const inputPath = join(attempt, 'community-inputs.json')
  writeBenchmarkDocument(inputPath, inputs)
  const assertions = Object.fromEntries(((inputs as any).workloads ?? []).map((workload: { id: string }) => [workload.id, corpusEvidence(workload.id) ?? null]))
  const contextValue = protocolContext(options, JSON.parse(JSON.stringify({ literal: inputs, assertions }))),
    context = retainContext(store, contextValue)
  const prepared = await prepareCommunity({ ...options, out: preparation })
  let browsers: PreparedCommunityBrowser[]
  if (options.communityBrowserPreparedFile) {
    const frozen = json(options.communityBrowserPreparedFile) as PreparedCommunityBrowser[]
    browsers = prepared.map(entry => {
      const browser = frozen.find(peer => peer.node.id === entry.node.id)
      if (!browser) throw Error('Frozen browser snapshot omits selected project: ' + entry.node.id)
      return browser
    })
  } else browsers = await prepareCommunityBrowsers(prepared, { ...options, out: preparation })
  const plans = prepared.map(preparedEntry => {
    const { entry, browser, packageArtifact, cli } = admitProjectArtifacts(preparedEntry, browsers.find(peer => peer.node.id === preparedEntry.node.id)!, options)
    const unreleased = candidateIdentity(entry, options, 'files' in packageArtifact ? packageArtifact.files : null)
    const identity: ProjectBenchmarkIdentity = JSON.parse(
      JSON.stringify({
        project: entry.node.id,
        ...(unreleased ? { lane: 'candidate' } : {}),
        protocol: { context, adapter: entry.node.benchmark ?? null, outputs: entry.node.outputs, browserQualifier: browser.browser?.files?.find(file => file.path === browser.browser?.qualificationHelper)?.sha256 ?? null },
        artifact: { ...(unreleased ? { candidate: unreleased } : {}), package: packageArtifact, browser: browser.browser ?? null, browserStatus: browser.browserStatus, cli },
        measurement: contextValue.measurement,
      }),
    )
    return { entry, browser, identity, retained: options.communityForce ? undefined : findProjectRecord(store, identity) }
  })
  const plan = plans.map(item => ({ project: item.entry.node.id, lane: item.identity.lane ?? 'community', action: item.retained ? 'reuse' : 'measure', record: item.retained?.id ?? null }))
  writeJson(join(attempt, 'plan.json'), { startedAt, context, projects: plan })
  if (settings.plan)
    return {
      startedAt,
      plan,
      attempt,
      updates: [],
      records: inspectCurrentProjectRecords(store)
        .filter(item => item.evidenceRetained && (item.record.identity.lane ?? 'community') === 'community')
        .map(item => item.record),
    }
  const updates = await updateProjectRecords(
    store,
    plans.map(item => ({
      identity: item.identity,
      measure: async () => {
        const id = randomUUID(),
          directory = join(attempt, encodeURIComponent(item.entry.node.id)),
          out = join(directory, 'community')
        mkdirSync(out, { recursive: true })
        writeBenchmarkDocument(join(directory, 'context.json'), contextValue)
        const preparedPath = join(directory, 'prepared.json'),
          browserPath = join(directory, 'browser.json')
        writeJson(preparedPath, [item.entry])
        writeJson(browserPath, [item.browser])
        const single = { ...options, communityProjects: [item.entry.node.id], communityPreparedFile: preparedPath, communityBrowserPreparedFile: browserPath, communityInputsFile: inputPath, out }
        const community = await runCommunitySuite(single)
        const outputs = options.communityOutputs?.filter(output => ['svg', 'terminal', 'ascii', 'unicode', 'ascii-unicode'].includes(output))
        const cli = outputs?.length === 0 ? { id: 'community-cli', startedAt: now(), finishedAt: now(), status: 'passed' as const, observations: [], gaps: ['No CLI output is selected for this project record'] } : await runCommunityCliSuite({ ...single, communityOutputs: outputs, out: join(directory, 'community-cli') })
        if (!existsSync(join(directory, 'community-cli'))) mkdirSync(join(directory, 'community-cli'))
        if (!existsSync(join(directory, 'community-cli/community-cli-suite.json'))) writeJson(join(directory, 'community-cli/community-cli-suite.json'), cli)
        // Recheck the admitted artifact after clocks, before publishing a reusable record.
        if (stableValue(projectPackageIdentity(item.entry)) !== stableValue((item.identity.artifact as any).package)) throw Error('Project artifact changed during measurement')
        verifyFrozenBrowserEngine(item.browser)
        if (stableValue(communityCliCacheIdentity({ target: options.root, packageRoot: options.packageRoot ?? options.root, observerExecutable: communityObserver(options) }, [item.entry])) !== stableValue((item.identity.artifact as any).cli)) throw Error('Project CLI artifact changed during measurement')
        const observations = [...community.observations, ...cli.observations]
        const resultStatus = [community.status, cli.status].includes('failed') ? 'failed' : [community.status, cli.status].includes('blocked') ? 'blocked' : status(observations)
        return {
          schemaVersion: 1 as const,
          id,
          identity: item.identity,
          startedAt: community.startedAt,
          finishedAt: cli.finishedAt,
          status: resultStatus,
          evidenceDirectory: directory,
          evidenceFiles: inventoryFiles(directory),
          observations,
          gaps: [...community.gaps, ...cli.gaps],
          provenance: { protocol: 'community-project-update-v1', suiteStatus: { community: community.status, 'community-cli': cli.status }, driverRevision: git(driver, 'rev-parse', 'HEAD'), targetRevision: git(options.root, 'rev-parse', 'HEAD'), contextFile: join(store, 'contexts', context), ...(candidate?.project === item.entry.node.id ? { candidate } : {}) },
        }
      },
    })),
    options.communityForce,
  )
  const inspected = inspectCurrentProjectRecords(store).filter(item => (item.record.identity.lane ?? 'community') === 'community'),
    records = inspected.filter(item => item.evidenceRetained).map(item => item.record),
    unavailable = inspected.filter(item => !item.evidenceRetained).map(item => item.record)
  if (settings.markdown) updateProjectMarkdown(settings.markdown, records, catalog.nodes, unavailable)
  const result = { startedAt, finishedAt: now(), attempt, store, context, plan, updates, records }
  writeJson(join(attempt, 'updates.json'), {
    ...result,
    updates: updates.map(update => ({ project: update.project, action: update.action, id: update.record.id, measuredAt: update.record.finishedAt, status: update.record.status })),
    records: records.map(record => ({ project: record.identity.project, id: record.id, finishedAt: record.finishedAt })),
  })
  return result
}

/** Default orchestrated community execution uses the same per-project records. */
export async function runIncrementalCommunitySuite(options: UnifiedRunOptions): Promise<UnifiedSuiteResult> {
  const result = await runProjectUpdates(options)
  const selected = result.updates.map(update => update.record)
  const envelope = (suite: string): UnifiedSuiteResult => {
    const observations = selected.flatMap(record => record.observations.filter(row => (suite === 'community' ? row.suite !== 'community-cli' : row.suite === suite)))
    const statuses = selected.map(record => (record.provenance as { suiteStatus?: Record<string, string> } | undefined)?.suiteStatus?.[suite])
    const resultStatus = statuses.includes('failed') ? 'failed' : statuses.includes('blocked') ? 'blocked' : status(observations)
    return {
      id: suite,
      startedAt: result.startedAt ?? now(),
      finishedAt: now(),
      status: resultStatus,
      observations,
      gaps: [...new Set(selected.flatMap(record => record.gaps)), 'Rolling per-project records: original observation dates are retained in project-update-manifest.json. This is not a paired same-session comparison.'],
      artifacts: ['project-update-manifest.json'],
    }
  }
  const community = envelope('community'),
    cli = envelope('community-cli')
  // These files deliberately use an incremental envelope, not a fabricated fresh
  // community-evidence.json. Historical single-run chart admission must not infer freshness.
  writeBenchmarkDocument(join(options.out, 'community-result.json'), community)
  writeFileSync(
    join(options.out, 'project-update-manifest.json'),
    JSON.stringify(
      {
        invocationId: options.communityInvocationId ?? null,
        attempt: result.attempt,
        updates: result.updates.map(update => ({ project: update.project, action: update.action, record: update.record.id })),
        records: selected.map(record => ({ project: record.identity.project, id: record.id, measuredAt: record.finishedAt, evidenceDirectory: record.evidenceDirectory })),
      },
      null,
      2,
    ) + '\n',
  )
  writeBenchmarkDocument(join(options.out, 'retained-cli-suite.json'), cli)
  return community
}
export async function runRetainedCommunityCliSuite(options: UnifiedRunOptions): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed()
  const source = join(dirname(options.out), 'community/retained-cli-suite.json')
  const manifest = join(dirname(source), 'project-update-manifest.json')
  if (!existsSync(source) || !existsSync(manifest) || !options.communityInvocationId || json(manifest).invocationId !== options.communityInvocationId)
    return { id: 'community-cli', status: 'blocked', startedAt: now(), finishedAt: now(), observations: [], gaps: ['Run the incremental community suite in this controller invocation first; an old output directory cannot supply fresh CLI results.'] }
  return json(source)
}
export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--help') {
    console.log(
      'bun commands.ts community:update --projects owner/project[,owner/other] --records DIRECTORY --out DIRECTORY [--markdown FILE] [--profile smoke|full] [--rounds N] [--include-excluded-descendants] [--plan] [--force] [--candidate-tarball FILE --candidate-sha256 HEX | --candidate-dir DIRECTORY | --candidate-revision SHA [--candidate-remote URL|CLONE] | --candidate-remote CLONE]\nA candidate is an unreleased build of one selected project: a tarball for an npm-backed tool, a Git commit for one Trident builds from source; its record stays in the candidate lane and never enters the league. Additional artifact options, including --community-inputs, --community-prepared, --community-browser-prepared and --community-catalog, are accepted. Select --projects explicitly or use --all-projects. Unbranded descendants, zero-ahead versions and runtime bindings are excluded before preparation; --include-excluded-descendants enables deliberate fork/version/runtime investigations. Preparation resolves selected artifacts; unchanged matching records skip every timing lane. --plan performs preparation but no timing. --force retains a new attempt. CI execution is refused.',
    )
    return
  }
  const forwarded: string[] = [],
    settings: { plan?: boolean; markdown?: string } = {},
    candidateValues: { tarball?: string; sha256?: string; directory?: string; revision?: string; remote?: string } = {}
  const aliases: Record<string, string> = { '--projects': '--community-projects', '--records': '--community-records', '--catalog': '--community-catalog' }
  const seen = new Set<string>()
  let allProjects = false, includeExcluded = false
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]!
    if (seen.has(flag)) throw Error('Duplicate option ' + flag)
    seen.add(flag)
    if (flag === '--include-excluded-descendants') { includeExcluded = true; continue }
    if (flag === '--all-projects') { allProjects = true; continue }
    if (flag === '--plan') {
      settings.plan = true
      continue
    }
    if (flag === '--force') {
      forwarded.push('--community-force')
      continue
    }
    if (['--candidate-tarball', '--candidate-sha256', '--candidate-dir', '--candidate-revision', '--candidate-remote'].includes(flag)) {
      const value = argv[++index]
      if (!value || value.startsWith('--')) throw Error(flag + ' requires a value')
      candidateValues[({ '--candidate-tarball': 'tarball', '--candidate-sha256': 'sha256', '--candidate-dir': 'directory', '--candidate-revision': 'revision', '--candidate-remote': 'remote' } as const)[flag as '--candidate-dir']] = value
      continue
    }
    if (flag === '--markdown') {
      const value = argv[++index]
      if (!value || value.startsWith('--')) throw Error('--markdown requires a file')
      settings.markdown = resolve(value)
      continue
    }
    if (flag === '--package-root') throw Error('Use --candidate-dir PACKAGE_DIRECTORY with one --projects selection; --package-root is not a public artifact option')
    forwarded.push(aliases[flag] ?? flag)
    if (!['--community-force', '--allow-incomplete'].includes(flag)) forwarded.push(argv[++index] ?? '')
  }
  const options = parseOptions(forwarded)
  if (allProjects && options.communityProjects) throw Error('Use --projects or --all-projects, not both')
  if (!options.communityProjects && !allProjects) throw Error('Choose --projects OWNER/TOOL,... or explicitly --all-projects before preparation')
  const catalog = json(options.communityCatalogFile ?? communityCatalogFile) as import('./lineage.ts').LineageCatalog
  const requested = selectCommunityProjects(catalog.nodes, options.communityProjects).map(node => node.id)
  const comparisonSelection = comparisonProjects(catalog, requested, includeExcluded)
  options.communityProjects = comparisonSelection.included
  if (!options.communityProjects.length) throw Error('No projects remain after scope/lineage/branding exclusions; inspect support --lineage. The descendant override does not enable whole-application workflows')
  if (comparisonSelection.excluded.length) console.error('Scope/lineage/branding exclusions: ' + comparisonSelection.excluded.map(node => node.project).join(', '))
  options.communityCandidate = communityCandidate(candidateValues, options)
  const result = await runProjectUpdates(options, settings)
  console.log(JSON.stringify({ comparisonSelection, attempt: result.attempt, plan: result.plan, updates: result.updates.map(update => ({ project: update.project, lane: update.record.identity.lane ?? 'community', action: update.action, id: update.record.id })) }, null, 2))
  if (options.communityCandidate && !settings.plan) console.log(`Candidate record kept apart from the league. Compare it with the release: bun commands.ts results:compare --records ${'store' in result ? result.store : 'RECORDS'} --project ${options.communityCandidate.project}`)
  if (!settings.plan && result.updates.some(update => update.record.status === 'failed')) process.exitCode = 1
  else if (!settings.plan && !options.allowIncomplete && result.updates.some(update => update.record.status === 'blocked')) process.exitCode = 2
}
if (import.meta.main) await main()
