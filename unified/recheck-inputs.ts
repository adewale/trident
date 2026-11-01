import { readFileSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import type { Route } from 'playwright'
import type { AuthoredFidelityCase } from '../fidelity/meaning.ts'
import { makeSvgCaseContract } from '../fidelity/svg-assessment.ts'
import { admitInvocationEvidence, evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { readCheckpointValue } from '../portable/checkpoint.ts'
import { admitDocsResourceUrl } from './docs-resources.ts'
import { docsObserverPolicy } from './docs-runtime.ts'
import { communityCliRequest, communityCliBinding } from './community-cli-request.ts'
import type { CommunityArtifact } from './community-types.ts'

const normalized = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** These are inputs to the original public adapter, rather than assertions
 * about its return. Paint expectations were never sent by this SVG collector:
 * the requested font size is frozen in renderOptions (including preludes). */
export function retainedSvgStimulus(input: AuthoredFidelityCase) {
  return normalized({ id: input.id, family: input.family, source: input.source, renderOptions: input.renderOptions ?? null, prelude: input.prelude ?? [] })
}

/** Regrading explicitly changes the observer contract while keeping every
 * actual source/options/prelude stimulus fixed. A changed oracle cannot require
 * another project call, and cannot turn a historical status into new evidence. */
export function planRetainedSvgRegrade(original: readonly AuthoredFidelityCase[], current: readonly AuthoredFidelityCase[]) {
  const index = (cases: readonly AuthoredFidelityCase[]) => {
    if (!Array.isArray(cases) || cases.some(input => !input || typeof input.id !== 'string' || typeof input.source !== 'string' || typeof input.family !== 'string') || new Set(cases.map(input => input.id)).size !== cases.length) throw Error('Retained SVG source inventory has invalid or duplicate cases')
    return [...cases].sort((a, b) => a.id.localeCompare(b.id))
  }
  const before = index(original), after = index(current)
  if (evidenceDigest(before.map(retainedSvgStimulus)) !== evidenceDigest(after.map(retainedSvgStimulus))) throw Error('Actual authored SVG source/options/prelude stimuli changed; retained bytes cannot qualify a different public request')
  return {
    schema: 'trident-retained-svg-regrade-v1' as const,
    stimulusSha256: evidenceDigest(before.map(retainedSvgStimulus)),
    originalContractsSha256: evidenceDigest(normalized(before)), gradingContractsSha256: evidenceDigest(normalized(after)),
    cases: after.map(input => ({ caseId: input.id, sourceSha256: evidenceBytesDigest(input.source), stimulusSha256: evidenceDigest(retainedSvgStimulus(input)), originalContractSha256: evidenceDigest(normalized(before.find(old => old.id === input.id)!)), gradingContract: makeSvgCaseContract(input) })),
    gradingContracts: normalized(after),
    scope: 'Fresh observation of retained public returns under current source-derived expectations. Original inventories, receipts, UUIDs, checks and clocks remain historical evidence; no renderer is called.',
  }
}

const owned = (root: string, path: string) => {
  const file = resolve(root, path), suffix = relative(resolve(root), file)
  if (isAbsolute(suffix) || suffix === '..' || suffix.startsWith('../')) throw Error('Retained preparation input escapes its campaign')
  const actual = relative(realpathSync(root), realpathSync(file))
  if (isAbsolute(actual) || actual === '..' || actual.startsWith('../')) throw Error('Retained preparation symlink escapes its campaign')
  return file
}

export function readRetainedPreparationInput(root: string, key: string) {
  const manifest = JSON.parse(readFileSync(join(root, 'preparation.json'), 'utf8')), receipt = manifest.files?.[key]
  if (manifest.schema !== 'trident-campaign-preparation-v1' || !receipt || typeof receipt.path !== 'string' || !/^[a-f0-9]{64}$/.test(receipt.sha256)) throw Error('No owning frozen preparation component: ' + key)
  const file = owned(root, receipt.path), bytes = readFileSync(file)
  if (evidenceBytesDigest(bytes) !== receipt.sha256) throw Error('Frozen preparation component changed: ' + key)
  return { file, bytes, sha256: receipt.sha256, manifest }
}

/** Only the archived preparation's owned blobs can satisfy image/font inputs.
 * In particular, an absolute old machine path or today's default corpus assets
 * are never an implicit fallback for an archived experiment. */
export function retainedObserverAssets(root: string) {
  const preparation = JSON.parse(readFileSync(join(root, 'preparation.json'), 'utf8'))
  if (preparation.schema !== 'trident-campaign-preparation-v1' || !preparation.files) throw Error('Retained observer has no frozen preparation')
  const blob = (sha256: string) => {
    if (!/^[a-f0-9]{64}$/.test(sha256)) throw Error('Invalid frozen asset identity')
    const expected = join('preparation', 'blobs', sha256)
    const receipts = Object.values(preparation.files).filter((receipt: any) => receipt?.sha256 === sha256 && receipt.path === expected)
    if (!receipts.length) throw Error('No owned preparation blob for frozen asset ' + sha256)
    const body = readFileSync(owned(root, expected))
    if (evidenceBytesDigest(body) !== sha256) throw Error('Frozen observer asset bytes changed')
    return body
  }
  const resources: { url: string; sha256: string; contentType: string; body?: Uint8Array; gap?: string }[] = []
  const gaps: string[] = []
  let manifestSha256: string | null = null
  if (preparation.files.docsResources) {
    try {
      const manifest = readRetainedPreparationInput(root, 'docsResources'), rows = JSON.parse(manifest.bytes.toString())
      manifestSha256 = manifest.sha256
      if (!Array.isArray(rows)) throw Error('Frozen documentation resources are not an array')
      for (const row of rows) {
        const url = admitDocsResourceUrl(row?.url)
        if (resources.some(resource => resource.url === url) || row.path !== 'blobs/' + row.sha256 || !/^[a-f0-9]{64}$/.test(row.sha256) || typeof row.contentType !== 'string') throw Error('Invalid or duplicate frozen documentation resource')
        try { resources.push({ url, sha256: row.sha256, contentType: row.contentType, body: blob(row.sha256) }) }
        catch (error) { resources.push({ url, sha256: row.sha256, contentType: row.contentType, gap: String(error) }) }
      }
    } catch (error) { gaps.push('Frozen documentation resource manifest unavailable: ' + String(error)); resources.length = 0 }
  }
  return { blob, resources, manifestSha256, gaps, policy: docsObserverPolicy(resources.map(resource => resource.url)) }
}

/** Exact source-authored image prerequisites. Source hyperlinks and click
 * targets are not image dependencies. Output-only requests are checked by the
 * route as well, including fonts and CSS resources. */
export function retainedImagePrerequisites(input: AuthoredFidelityCase, assets: ReturnType<typeof retainedObserverAssets>) {
  const attributes = input.expected.facts?.['node-attributes']
  const imageNodes = Array.isArray(attributes) ? attributes.flatMap((node: any) => typeof node?.attributes?.img === 'string' ? [{ href: node.attributes.img }] : []) : []
  const requests = [...(input.paint?.images ?? []), ...(Array.isArray(input.expected.facts?.['image-requests']) ? input.expected.facts['image-requests'] : []), ...imageNodes] as { href?: unknown }[]
  return requests.flatMap(request => {
    if (typeof request?.href !== 'string' || !/^https?:/.test(request.href)) return []
    const resource = assets.resources.find(resource => resource.url === request.href)
    return resource?.body ? [] : ['Source image prerequisite unavailable: ' + request.href + (resource?.gap ? ': ' + resource.gap : '; no owned frozen preparation resource')]
  })
}

function retainedPeerAsset(url: URL, peer: any) {
  if (!['http:', 'https:'].includes(url.protocol) || !['127.0.0.1', 'trident.invalid'].includes(url.hostname) || !peer?.browser) return undefined
  const addon = url.pathname.startsWith('/__addon/'), root = addon ? peer.browser.zenuml?.root : peer.browser.root
  const file = root && resolve(root, '.' + decodeURIComponent(url.pathname.slice(addon ? '/__addon'.length : 0)))
  return peer.browser.files?.find((item: any) => resolve(item.path) === file) ?? peer.browser.zenuml?.files?.find((item: any) => resolve(item.path) === file)
}

/** Preserve exact old absolute font URLs only when their path resolves to a
 * sealed peer asset. Their bytes still come from this archive's owned blob.
 * Every other old CSS dependency requires its explicit frozen resource. */
export function retainedSvgResourcePolicy(svg: string, assets: ReturnType<typeof retainedObserverAssets>, peer: any) {
  const fonts: string[] = [], gaps: string[] = []
  for (const match of svg.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^'"\s)]*))\s*\)/g)) {
    const value = match[1] ?? match[2] ?? match[3] ?? ''
    if (!/^https?:/.test(value)) continue
    try {
      const literal = admitDocsResourceUrl(value), url = new URL(literal), asset = retainedPeerAsset(url, peer)
      const resource = assets.resources.find(resource => resource.url === literal)
      if (asset) assets.blob(asset.sha256)
      if (!asset && !resource?.body) gaps.push('CSS resource prerequisite unavailable: ' + literal)
      else if (/\.(?:woff2?|ttf|otf)$/i.test(url.pathname)) fonts.push(literal)
    } catch (error) { gaps.push('Frozen CSS resource prerequisite unavailable: ' + String(error)) }
  }
  return { policy: assets.policy.replace("font-src 'self' data: blob:", "font-src 'self' data: blob:" + (fonts.length ? ' ' + [...new Set(fonts)].join(' ') : '')), gaps }
}

/** A route has no network fallback. Missing prerequisites make the entire
 * fresh observation unknown, rather than a false project paint failure. */
export async function routeRetainedObserver(route: Route, assets: ReturnType<typeof retainedObserverAssets>, peer: any, gaps: string[], policy = assets.policy) {
  const url = new URL(route.request().url()), resource = assets.resources.find(resource => resource.url === url.href)
  if (url.origin === 'http://trident.invalid' && url.pathname === '/observer') return route.fulfill({ contentType: 'text/html', headers: { 'content-security-policy': policy }, body: '<!doctype html><meta charset="utf-8"><body>' })
  if (resource?.body) return route.fulfill({ body: Buffer.from(resource.body), contentType: resource.contentType })
  if (['data:', 'blob:'].includes(url.protocol)) return route.continue()
  if (['127.0.0.1', 'trident.invalid'].includes(url.hostname) && peer?.browser) {
    try {
      const asset = retainedPeerAsset(url, peer)
      if (asset) return route.fulfill({ body: assets.blob(asset.sha256), contentType: /\.woff2?$/.test(asset.path) ? 'font/woff2' : /\.ttf$/.test(asset.path) ? 'font/ttf' : /\.svg$/.test(asset.path) ? 'image/svg+xml' : 'application/octet-stream' })
    } catch (error) { gaps.push('Frozen observer asset unavailable: ' + String(error)); return route.abort() }
  }
  gaps.push('Observer resource prerequisite unavailable: ' + url.href + (resource?.gap ? ': ' + resource.gap : ''))
  return route.abort()
}

/** Recover the selected engine only from the original sealed preparation and
 * collection context. A journal's self-declared artifact/binding is not its own
 * authority for a project, round or output variant. */
export function retainedDocsSvgOwnershipContext(campaign: string) {
  const browsers = readRetainedPreparationInput(campaign, 'browsers'), prepared = JSON.parse(browsers.bytes.toString())
  const inventory = JSON.parse(readRetainedPreparationInput(campaign, 'inventories').bytes.toString()).docs
  const context = JSON.parse(readFileSync(owned(campaign, 'docs/context.json'), 'utf8'))
  const variants = browsers.manifest.files.variants ? JSON.parse(readRetainedPreparationInput(campaign, 'variants').bytes.toString()) : []
  if (!Array.isArray(prepared) || !inventory?.cases || !Array.isArray(context.artifacts) || new Set(context.artifacts.map((row: any) => row.project)).size !== context.artifacts.length || new Set(prepared.map((peer: any) => peer.node?.id)).size !== prepared.length) throw Error('Original documentation SVG artifact/source context is ambiguous')
  if (!Array.isArray(variants) || new Set(variants.map((row: any) => JSON.stringify([row.project, row.output]))).size !== variants.length) throw Error('Original documentation output-variant context is ambiguous')
  const engines = new Map<string, { engine: any; variant: string; cliArtifact?: CommunityArtifact }>()
  for (const artifact of context.artifacts) {
    const peer = prepared.find((peer: any) => peer.node?.id === artifact.project), admission = artifact.admission
    if (!peer || !admission?.artifactSha256) continue
    const variant = variants.find((row: any) => row.project === artifact.project && row.output === 'svg')?.variant ?? peer.artifact?.transportVariant ?? 'primary'
    const extras = peer.artifact?.additionalCli?.filter((extra: any) => extra.id === variant && extra.outputs?.includes('svg') && !extra.error && extra.artifact?.kind === 'cli')
    const selected = variant === 'primary' ? peer.artifact : extras?.length === 1 ? extras[0].artifact : undefined
    let engine = selected?.kind === 'cli' ? undefined : variant === 'primary' ? peer.browser : undefined
    const cliSha256 = selected?.sha256 ?? selected?.files?.find((file: any) => file.path === admission.entry)?.sha256
    if (selected?.kind === 'cli' && selected.executable === admission.entry && (selected.root ?? dirname(selected.executable)) === admission.root && selected.version === admission.version && cliSha256 === admission.artifactSha256) engine = { kind: 'cli', root: admission.root, entry: admission.entry, version: admission.version, artifactSha256: admission.artifactSha256 }
    if (!engine || engine.root !== admission.root || resolve(engine.root, engine.entry) !== resolve(admission.entry) || engine.version !== admission.version || engine.artifactSha256 !== admission.artifactSha256) continue
    engines.set(artifact.project, { engine, variant, ...(selected?.kind === 'cli' ? { cliArtifact: selected as CommunityArtifact } : {}) })
  }
  return { collectionIdentity: { context, inventory }, engines }
}

/** DaveBench ownership uses the original durable public-call capture. A prior
 * render status or content-addressed witness pointer is insufficient on its own. */
export function requireRetainedDocsSvgReturn(input: { root: string; project: string; source: { id: string; source: string }; round: number; variant: string; svg: string; attemptId?: string; remap: (path: string) => string; ownership: ReturnType<typeof retainedDocsSvgOwnershipContext> }) {
  const frozen = input.ownership.engines.get(input.project)
  if (!frozen || frozen.variant !== input.variant || !Number.isSafeInteger(input.round) || input.round < 1) throw Error('SVG return has no matching sealed original engine/round/variant context')
  const raw = readCheckpointValue<any>(input.root, JSON.stringify(['raw-svg', input.round, input.project, input.variant, input.source.id]), input.ownership.collectionIdentity)
  if (!raw || raw.value?.status !== 'passed' || raw.value?.svg !== input.svg || typeof raw.invocationId !== 'string' || input.attemptId !== raw.invocationId) throw Error('SVG witness differs from its own source/project/round raw return')
  const external = raw.value?.transportObservation?.metrics?.rawInvocationDirectory
  const directory = external ? input.remap(external) : join(input.root, 'invocations')
  owned(input.root, relative(input.root, directory))
  const identity = { schema: 'trident-invocation-journal-v1' }
  const started = admitInvocationEvidence(readCheckpointValue(directory, raw.invocationId + ':started', identity)), returned = admitInvocationEvidence(readCheckpointValue(directory, raw.invocationId + ':returned', identity))
  for (const terminal of ['public-error', 'interrupted']) if (readCheckpointValue(directory, raw.invocationId + ':' + terminal, identity)) throw Error('SVG public invocation has contradictory terminal outcomes')
  let bindingSha256: string, invokedCaseId = input.source.id
  if (frozen.cliArtifact) {
    const selected = input.ownership.collectionIdentity.context.selectedCaseIds
    if (!Array.isArray(selected) || new Set(selected).size !== selected.length || !selected.includes(input.source.id) || typeof external !== 'string' || resolve(directory) !== resolve(input.root, 'raw-cli-invocations')) throw Error('CLI SVG has no original selected-case/render-ID association')
    // The shared docs wrapper passes its original selected-case render ID to
    // runCommunityCli. Its inner process round is 1; the outer docs round lives
    // in that render ID, not a fabricated reinterpretation of the inner clock.
    invokedCaseId = 'docs_' + input.round + '_' + selected.indexOf(input.source.id)
    bindingSha256 = communityCliBinding(frozen.engine.entry, 'svg', communityCliRequest(frozen.cliArtifact, 'svg', dirname(external)))
    if (returned.identity.coordinate !== 'round:1') throw Error('CLI SVG differs from its original public process coordinate')
  } else bindingSha256 = evidenceDigest({ format: 'svg', engine: frozen.engine, round: input.round, variant: input.variant })
  if (started.state !== 'started' || returned.state !== 'returned' || started.attemptId !== raw.invocationId || returned.attemptId !== raw.invocationId || evidenceDigest(started.identity) !== evidenceDigest(returned.identity) || returned.startedReceiptSha256 !== undefined && returned.startedReceiptSha256 !== evidenceDigest(started) || returned.identity.project !== input.project || returned.identity.caseId !== invokedCaseId || returned.identity.sourceSha256 !== evidenceBytesDigest(input.source.source) || returned.identity.artifactSha256 !== frozen.engine.artifactSha256 || returned.identity.bindingSha256 !== bindingSha256 || returned.identity.format !== 'svg' || returned.output?.sha256 !== evidenceBytesDigest(input.svg) || returned.output.bytes !== Buffer.byteLength(input.svg)) throw Error('SVG public invocation differs from the literal source, project, frozen engine, round, variant or actual bytes')
  const bytes = readFileSync(owned(input.root, relative(input.root, input.remap(returned.output.path))))
  if (evidenceBytesDigest(bytes) !== returned.output.sha256 || bytes.byteLength !== returned.output.bytes) throw Error('SVG public invocation output bytes changed')
  return { schema: 'trident-owned-svg-return-v1' as const, project: input.project, caseId: input.source.id, invokedCaseId, round: input.round, variant: input.variant, artifactSha256: returned.identity.artifactSha256, bindingSha256, sourceSha256: returned.identity.sourceSha256, svgSha256: returned.output.sha256, attemptId: raw.invocationId, rawUnitSha256: evidenceDigest(raw), startedFrameSha256: evidenceDigest(started), returnedFrameSha256: evidenceDigest(returned) }
}
