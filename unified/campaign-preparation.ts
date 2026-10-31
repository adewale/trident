import { readDocsResources, defaultDocsResources } from './docs-resources.ts'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { prepareCommunity, communityCoreWorkloads, verifyFrozenBrowserEngine } from './community.ts'
import { prepareCommunityBrowsers, type PreparedCommunityBrowser } from './community-browser.ts'
import { projectPackageIdentity } from './project-update.ts'
import { corpusWorkloads } from './corpus.ts'
import { withReferenceLabels } from './qualification.ts'
import { portableCases } from '../portable/cohorts.ts'
import { FULL_SAMPLING, PORTABLE_MEASUREMENT_PROTOCOL } from '../portable/protocol.ts'
import { mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { docsInventory } from './docs-benchmark.ts'
import { inventoryOriginalDeclarations } from './upstream-fidelity-census.ts'
import { tridentDirectory } from './trident-paths.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { readBenchmarkDocument, stableValue } from '../portable/project-records.ts'
import type { CommunityArtifact, PreparedCommunity } from './community-types.ts'
import { supportControls } from './support-verification.ts'
import type { UnifiedRunOptions } from './types.ts'

const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
interface PreparationManifest {
  schema: 'trident-campaign-preparation-v1'; preparedAt: string; cutoff: string | null
  projects: string[]; profile: string; rounds: number; producers: string[]
  sampling: { protocol: string; rounds: number; samples: number; coldSamples: number }
  files: Record<string, { path: string; sha256: string }>
  artifacts: { project: string; version?: string; identity?: unknown; error?: string }[]
}
type ProofInputOptions = Pick<UnifiedRunOptions, 'docsReviewFile' | 'docsPngReviewFile'> & { docsPngRasterProfileFile?: string }
/** Proof inputs use the existing preparation manifest and content-addressed
 * blobs. The frozen profile contains relative paths so an archive can move. */
export function freezeCampaignProofInputs(options: ProofInputOptions, directory: string): PreparationManifest['files'] {
  mkdirSync(directory, { recursive: true })
  const files: PreparationManifest['files'] = {}
  const save = (key: string, name: string, bytes: Uint8Array) => {
    const path = join(directory, name); mkdirSync(dirname(path), { recursive: true }); if (existsSync(path)) { if (!readFileSync(path).equals(Buffer.from(bytes))) throw Error('Prepared proof input already has different frozen bytes') } else writeFileSync(path, bytes, { flag: 'wx' })
    files[key] = { path: relative(dirname(directory), path), sha256: hash(path) }; return path
  }
  const reviewBytes = readFileSync(options.docsReviewFile ?? join(tridentDirectory, 'corpus/docs-reviewed.json'))
  if (!Array.isArray(JSON.parse(reviewBytes.toString()))) throw Error('Documentation source reviews must be a JSON array')
  save('docsReviews', 'docs-reviewed.json', reviewBytes)
  const imageBytes = options.docsPngReviewFile ? readFileSync(options.docsPngReviewFile) : Buffer.from('[]\n')
  if (!Array.isArray(JSON.parse(imageBytes.toString()))) throw Error('PNG content reviews must be a JSON array')
  save('docsPngReviews', 'docs-png-reviewed.json', imageBytes)
  if (options.docsPngRasterProfileFile) {
    const profile = JSON.parse(readFileSync(options.docsPngRasterProfileFile, 'utf8'))
    if (profile?.schema !== 'trident-raster-profile-v1' || !['#ffffff', 'transparent'].includes(profile.background) || typeof profile.defaultFontFamily !== 'string' || !Array.isArray(profile.fontFiles)) throw Error('Invalid frozen PNG raster profile')
    const seen = new Set<string>()
    const fonts = profile.fontFiles.map((font: { path: string; sha256: string }) => {
      if (!font || typeof font.path !== 'string' || !font.path || !/^[a-f0-9]{64}$/.test(font.sha256)) throw Error('Invalid frozen PNG font entry')
      const source = resolve(dirname(options.docsPngRasterProfileFile!), font.path)
      if (seen.has(source) || hash(source) !== font.sha256) throw Error('Duplicate or changed PNG profile font bytes')
      seen.add(source)
      const name = 'blobs/' + font.sha256, destination = join(directory, name)
      if (existsSync(destination)) { if (hash(destination) !== font.sha256) throw Error('Prepared PNG font blob changed'); files['proof-font:' + font.sha256] = { path: relative(dirname(directory), destination), sha256: font.sha256 } }
      else save('proof-font:' + font.sha256, name, readFileSync(source))
      return { path: name, sha256: font.sha256 }
    })
    save('docsPngRasterProfile', 'docs-png-raster-profile.json', Buffer.from(JSON.stringify({ ...profile, fontFiles: fonts }, null, 2) + '\n'))
  }
  return files
}
function restoredProofInputs(manifestFile: string, files: Record<string, string>, receipts: PreparationManifest['files']): Partial<UnifiedRunOptions> {
  const root = realpathSync(dirname(manifestFile)), owned = (path: string) => { const suffix = relative(root, realpathSync(path)); if (isAbsolute(suffix) || suffix === '..' || suffix.startsWith('../')) throw Error('Prepared proof input borrows an unowned file'); return path }
  for (const key of ['docsReviews', 'docsPngReviews', 'docsPngRasterProfile']) if (files[key]) owned(files[key]!)
  if (files.docsPngRasterProfile) {
    const profile = JSON.parse(readFileSync(files.docsPngRasterProfile, 'utf8'))
    if (profile?.schema !== 'trident-raster-profile-v1' || !['#ffffff', 'transparent'].includes(profile.background) || typeof profile.defaultFontFamily !== 'string' || !Array.isArray(profile.fontFiles)) throw Error('Invalid prepared PNG raster profile')
    const seen = new Set<string>()
    for (const font of profile.fontFiles) {
      if (!font || typeof font.path !== 'string' || isAbsolute(font.path) || !font.path || !/^[a-f0-9]{64}$/.test(font.sha256)) throw Error('Prepared PNG profile has an unowned font path')
      const path = owned(resolve(dirname(files.docsPngRasterProfile), font.path)), key = Object.keys(files).find(key => files[key] === path)
      if (!key || receipts[key]?.sha256 !== font.sha256 || seen.has(path)) throw Error('Prepared PNG font is missing, duplicated or outside the owning manifest')
      seen.add(path)
    }
  }
  return { ...(files.docsReviews ? { docsReviewFile: files.docsReviews } : {}), ...(files.docsPngReviews ? { docsPngReviewFile: files.docsPngReviews } : {}), ...(files.docsPngRasterProfile ? { docsPngRasterProfileFile: files.docsPngRasterProfile } : {}) }
}

/** Bind browser dispositions to the selected primary artifact without requiring
 * separate public components (for example Merman's SDK) to share its version. */
export function reconcileCampaignBrowsers(prepared: PreparedCommunity[], value: unknown): PreparedCommunityBrowser[] {
  if (!Array.isArray(value) || value.some(peer => !peer?.node?.id) || new Set(value.map(peer => peer.node.id)).size !== value.length) throw Error('Browser preparation needs unique project identities')
  const selectors = (entry: PreparedCommunity) => Object.fromEntries(['id', 'benchmark', 'outputs', 'head', 'release', 'distribution', 'packages'].map(key => [key, (entry.node as any)[key] ?? null]))
  const artifactMetadata = (entry: PreparedCommunity) => JSON.stringify({ ...entry.artifact, detail: undefined })
  return prepared.map(entry => {
    const peer = (value as PreparedCommunityBrowser[]).find(peer => peer.node.id === entry.node.id)
    try {
      if (!peer) throw Error('No browser disposition for the selected project')
      if (stableValue(selectors(peer)) !== stableValue(selectors(entry))) throw Error('Browser catalog/config differs from the selected project')
      if (!['prepared', 'blocked', 'not-applicable'].includes(peer.browserStatus)) throw Error('Unknown browser preparation disposition')
      // Equal selectors refer to the primary already sealed by the caller. Only
      // differing representations need another full dependency-closure scan.
      if ((peer.artifact || entry.artifact) && artifactMetadata(peer) !== artifactMetadata(entry) && stableValue(projectPackageIdentity(peer)) !== stableValue(projectPackageIdentity(entry))) throw Error('Browser primary artifact differs from the selected artifact')
      if (peer.browserStatus === 'prepared') verifyFrozenBrowserEngine(peer)
      return JSON.parse(JSON.stringify({ ...peer, ...entry, artifact: entry.artifact, error: entry.error, ...(peer.browserStatus === 'prepared' ? {} : { browser: undefined }) })) as PreparedCommunityBrowser
    } catch (error) {
      return { ...entry, browserStatus: 'blocked', browserDetail: 'Canonical browser admission failed: ' + String(error) }
    }
  })
}
export function loadCampaignPreparation(file: string): { manifest: PreparationManifest; options: Partial<UnifiedRunOptions>; externalInputs?: string } {
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as PreparationManifest
  if (manifest.schema !== 'trident-campaign-preparation-v1' || !Array.isArray(manifest.projects) || new Set(manifest.projects).size !== manifest.projects.length) throw Error('Invalid campaign preparation')
  const files: Record<string, string> = {}
  for (const [key, receipt] of Object.entries(manifest.files)) {
    const path = resolve(dirname(file), receipt.path)
    if (relative(dirname(file), path).startsWith('..') || hash(path) !== receipt.sha256) throw Error('Prepared campaign component changed or escaped its manifest: ' + key)
    files[key] = path
  }
  for (const required of ['catalog', 'prepared', 'browsers', 'inputs', 'inventories']) if (!files[required]) throw Error('Preparation omits ' + required)
  const prepared = readBenchmarkDocument(files.prepared!) as PreparedCommunity[]
  if (!Array.isArray(prepared) || stableValue(prepared.map(entry => entry.node.id).sort()) !== stableValue([...manifest.projects].sort())) throw Error('Prepared project inventory differs from the manifest')
  if (!Array.isArray(manifest.artifacts) || stableValue(manifest.artifacts.map(receipt => receipt.project).sort()) !== stableValue([...manifest.projects].sort())) throw Error('Prepared artifact receipts must cover each selected project once')
  for (const entry of prepared) {
    const receipt = manifest.artifacts.find(receipt => receipt.project === entry.node.id)!
    if (!!entry.artifact !== !!receipt.identity) throw Error('Prepared primary artifact and its owning identity receipt differ: ' + entry.node.id)
  }
  const browsers = readBenchmarkDocument(files.browsers!)
  if (stableValue(reconcileCampaignBrowsers(prepared, browsers)) !== stableValue(browsers)) throw Error('Prepared browser selection, artifact or live bytes differ from the canonical manifest')
  for (const receipt of manifest.artifacts) if (receipt.identity) {
    const entry = prepared.find(entry => entry.node.id === receipt.project)
    if (!entry || stableValue(projectPackageIdentity(entry)) !== stableValue(receipt.identity)) throw Error('Prepared runtime bytes or dependency closure changed: ' + receipt.project)
  }
  return { manifest, options: { communityCatalogFile: files.catalog, communityPreparedFile: files.prepared, communityBrowserPreparedFile: files.browsers, communityInputsFile: files.inputs, communityArtifactPolicy: 'frozen', ...(files.variants ? { communityArtifactVariantsFile: files.variants } : {}), ...(files.docsResources ? { docsResourcesFile: files.docsResources } : {}), ...restoredProofInputs(file, files, manifest.files) }, externalInputs: files.externalInputs }
}
/** One immutable preparation index; component files are owning evidence, never
 * competing "final" manifests. Acquisition and input admission finish before clocks. */
export async function prepareCampaign(options: UnifiedRunOptions, catalog: unknown, settings: { cutoff?: string; externalInputs?: string; plan?: unknown } = {}) {
  const directory = join(options.out, 'preparation'), file = join(options.out, 'preparation.json')
  if (existsSync(file)) throw Error('Preparation already exists; use --prepared or --resume')
  if (settings.cutoff && (!Number.isFinite(Date.parse(settings.cutoff)) || Date.parse(settings.cutoff) > Date.now())) throw Error('Cutoff must be a valid past timestamp')
  mkdirSync(directory, { recursive: true })
  const files: PreparationManifest['files'] = {}
  const write = (key: string, name: string, value: unknown) => {
    const path = join(directory, name)
    writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
    files[key] = { path: relative(options.out, path), sha256: hash(path) }
    return path
  }
  const catalogFile = write('catalog', 'catalog.json', catalog)
  Object.assign(files, freezeCampaignProofInputs(options, directory))
  if (settings.plan) write('plan', 'plan.json', settings.plan)
  if (existsSync(join(directory, 'registry'))) for (const name of readdirSync(join(directory, 'registry')).filter(name => name.endsWith('.json'))) {
    const path = join(directory, 'registry', name)
    files['registry:' + name] = { path: relative(options.out, path), sha256: hash(path) }
  }
  const acquired = await prepareCommunity({ ...options, communityCatalogFile: catalogFile, out: directory })
  const rawBrowsers = options.communityBrowserPreparedFile ? readBenchmarkDocument(options.communityBrowserPreparedFile) : await prepareCommunityBrowsers(acquired, { ...options, communityCatalogFile: catalogFile, out: directory })
  const artifacts: PreparationManifest['artifacts'] = []
  const prepared: PreparedCommunity[] = acquired.map(entry => {
    try {
      if (!entry.artifact) { artifacts.push({ project: entry.node.id, error: entry.error ?? 'No artifact' }); return entry }
      artifacts.push({ project: entry.node.id, version: entry.artifact.version, identity: projectPackageIdentity(entry) })
      return entry
    } catch (error) {
      const detail = 'Canonical artifact admission failed: ' + String(error)
      artifacts.push({ project: entry.node.id, version: entry.artifact?.version, error: detail })
      return { node: entry.node, error: detail }
    }
  })
  const browsers = reconcileCampaignBrowsers(prepared, rawBrowsers)
  const retainFile = (path: string, role: 'artifact' | 'lock' = 'artifact') => {
    const sha256 = hash(path), target = join(directory, 'blobs', sha256)
    mkdirSync(dirname(target), { recursive: true })
    if (!existsSync(target)) copyFileSync(path, target)
    files[role + ':' + (role === 'lock' ? path : sha256)] = { path: relative(options.out, target), sha256 }
  }
  const retain = (artifact: CommunityArtifact) => {
    const paths = new Set([...(artifact.files ?? []).map(file => file.path), ...(['cli', 'global', 'franken'].includes(artifact.kind) ? [artifact.executable, artifact.module, artifact.wasm].filter((path): path is string => !!path) : [])])
    for (const path of paths) retainFile(path)
    for (const root of new Set([artifact.root, artifact.buildDependencyPrefix, (artifact as any).sourceRoot].filter((path): path is string => !!path))) for (const name of ['package-lock.json', 'bun.lock', 'pnpm-lock.yaml', 'yarn.lock', 'Cargo.lock', 'go.sum', 'pubspec.lock']) {
      const path = join(root, name)
      if (existsSync(path)) retainFile(path, 'lock')
    }
    for (const companion of artifact.additionalCli ?? []) if (companion.artifact) retain(companion.artifact)
  }
  for (const entry of prepared) if (entry.artifact) retain(entry.artifact)
  const resources = readDocsResources(options.docsResourcesFile)
  write('docsResources', 'docs-resources.json', resources.resources.map(({ body: _body, ...row }: any) => { retainFile(row.path); const name = 'blobs/' + row.sha256; let license = row.license; if (license?.path) { const path = resolve(dirname(options.docsResourcesFile ?? defaultDocsResources), license.path); retainFile(path); license = { ...license, path: 'blobs/' + hash(path) } } return { ...row, path: name, ...(license ? { license } : {}) } }))
  write('prepared', 'community-prepared.json', prepared)
  write('browsers', 'community-browser-prepared.json', browsers)
  if (options.communityInputsFile) write('inputs', 'community-inputs.json', readBenchmarkDocument(options.communityInputsFile))
  else {
    const enriched = await withReferenceLabels([...corpusWorkloads(options.profile), ...supportControls], { root: options.harnessRoot ?? options.root })
    write('inputs', 'community-inputs.json', { workloads: [...communityCoreWorkloads(), ...enriched.workloads], reference: enriched.provenance ?? null, gaps: enriched.gaps })
  }
  if (options.communityArtifactVariantsFile) write('variants', 'artifact-variants.json', readBenchmarkDocument(options.communityArtifactVariantsFile))
  if (settings.externalInputs) write('externalInputs', 'external-inputs.json', readBenchmarkDocument(settings.externalInputs))
  const fidelity = expandedFidelityCases()
  write('inventories', 'inventories.json', { portable: portableCases(), fidelity, criteria: planFidelityCriteria(fidelity), docs: docsInventory(options.mermaidDir), original: inventoryOriginalDeclarations(options.mermaidDir ?? mermaidUpstreamDirectory()) })
  const manifest: PreparationManifest = { schema: 'trident-campaign-preparation-v1', preparedAt: new Date().toISOString(), cutoff: settings.cutoff ?? null,
    projects: prepared.map(entry => entry.node.id), profile: options.profile, rounds: options.rounds,
    sampling: { protocol: PORTABLE_MEASUREMENT_PROTOCOL, rounds: options.rounds, samples: options.profile === 'full' ? FULL_SAMPLING.samples : 1, coldSamples: options.profile === 'full' ? FULL_SAMPLING.coldSamples : 1 },
    producers: protocolIdentity(options.harnessRoot ?? options.root, ['unified/benchmark.ts']), files, artifacts }
  writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
  return loadCampaignPreparation(file)
}
