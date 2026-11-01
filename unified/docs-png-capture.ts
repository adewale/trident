import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { readCheckpointEntries, writeDurableEvidence } from '../portable/checkpoint.ts'

interface CaptureEnvironment { fonts: { path: string; sha256: string; bytes: number }[]; configuration: { path: string; sha256: string; bytes: number }[]; variables: Record<string, string | null> }
const files = (paths: string[]) => [...new Set(paths)].sort().map(path => { const bytes = readFileSync(path); return { path, sha256: evidenceBytesDigest(bytes), bytes: bytes.length } })
export function docsPngCaptureEnvironment(): CaptureEnvironment {
  const fonts = files(execFileSync('fc-list', ['-f', '%{file}\n'], { encoding: 'utf8', timeout: 10_000 }).split('\n').filter(Boolean))
  const configuration = files(execFileSync('fc-conflist', [], { encoding: 'utf8', timeout: 10_000 }).split('\n').flatMap(line => /^\+\s+([^:]+):/.exec(line)?.[1] ? [/^\+\s+([^:]+):/.exec(line)![1]!] : []))
  if (!fonts.length || !configuration.length) throw Error('Actual fontconfig font and configuration bytes are unavailable')
  return { fonts, configuration, variables: Object.fromEntries(['FONTCONFIG_FILE','FONTCONFIG_PATH','LANG','LC_ALL'].map(name => [name,process.env[name] ?? null])) }
}
export interface DocsPngCaptureStart { directory: string; root: string; before: { schema: 'trident-browser-png-capture-before-v2'; status: 'available' | 'unavailable'; contextSha256: string; producers: readonly string[]; baselineAttemptIds: string[]; baselineJournalSha256: string; environment?: CaptureEnvironment; reason?: string } }
/** Optional extra evidence. Failure never removes or prevents a raw public call.
 * A fresh capture directory covers only attempts entered during this execution;
 * resumed outputs cannot borrow a later font snapshot. */
export function beginDocsPngCapture(root: string, producers: readonly string[], snapshot = docsPngCaptureEnvironment): DocsPngCaptureStart {
  const baseline = new InvocationJournal(join(root,'invocations')).records()
  const directory = join(root, 'captures', randomUUID()), before: DocsPngCaptureStart['before'] = { schema: 'trident-browser-png-capture-before-v2', status: 'unavailable', contextSha256: evidenceBytesDigest(readFileSync(join(root,'context.json'))), producers: [...producers], baselineAttemptIds: [...new Set(baseline.map(frame=>frame.attemptId))], baselineJournalSha256: evidenceDigest(baseline) }
  try { before.environment = snapshot(); before.status = 'available' } catch (error) { before.reason = String(error) }
  writeDurableEvidence(join(directory,'before.json'),Buffer.from(JSON.stringify(before)))
  return { root, directory, before }
}
export function completeDocsPngCapture(capture: DocsPngCaptureStart, attemptIds: readonly string[], snapshot = docsPngCaptureEnvironment) {
  let status: 'available' | 'unavailable' = 'unavailable', reason = capture.before.reason, afterEnvironmentSha256: string | null = null
  let coverage: { attemptId: string; startedFrameSha256: string; outcomeFrameSha256: string }[] = []
  try {
    const after = snapshot(); afterEnvironmentSha256 = evidenceDigest(after)
    if (capture.before.status !== 'available' || !capture.before.environment || evidenceDigest(capture.before.environment) !== afterEnvironmentSha256) throw Error('Browser PNG font/configuration inputs changed across these actual calls')
    if (!capture.before.producers.length || evidenceBytesDigest(readFileSync(join(capture.root,'context.json'))) !== capture.before.contextSha256 || new Set(attemptIds).size !== attemptIds.length || attemptIds.some(id=>!id.trim())) throw Error('Browser PNG capture context, producer closure or actual attempt coverage differs')
    const journal = new InvocationJournal(join(capture.root,'invocations')).records()
    coverage = attemptIds.map(attemptId=>{
      if(capture.before.baselineAttemptIds.includes(attemptId))throw Error('Capture cannot cover an invocation already present before this execution')
      const rows=journal.filter(frame=>frame.attemptId===attemptId),starts=rows.filter(frame=>frame.state==='started'),outcomes=rows.filter(frame=>['returned','public-error','interrupted'].includes(frame.state))
      if(starts.length!==1||outcomes.length!==1||starts[0]!.identity.format!=='png'||evidenceDigest(starts[0]!.identity)!==evidenceDigest(outcomes[0]!.identity)||outcomes[0]!.startedReceiptSha256!==evidenceDigest(starts[0]))throw Error('Capture coverage lacks actual unique started/outcome PNG invocation frames')
      return{attemptId,startedFrameSha256:evidenceDigest(starts[0]),outcomeFrameSha256:evidenceDigest(outcomes[0])}
    })
    status = 'available'; reason = undefined
  } catch(error) { reason = String(error) }
  const receipt = { schema: 'trident-browser-png-capture-v2', status, beforeSha256: evidenceBytesDigest(readFileSync(join(capture.directory,'before.json'))), contextSha256: capture.before.contextSha256, resultSha256: evidenceBytesDigest(readFileSync(join(capture.root,'result.json'))), afterEnvironmentSha256, attemptIds: [...attemptIds], coverage, ...(reason ? { reason } : {}), scope: 'Font/configuration before/after byte identities for exactly the listed actual SVG-to-PNG invocation attempts. No image correctness, font identity from pixels or comparative timing credit.' }
  const file = join(capture.directory,'complete.json'); writeDurableEvidence(file,Buffer.from(JSON.stringify(receipt))); return { file, receipt }
}

const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const frozen = <T>(value: T): T => { if (value && typeof value === 'object') { for (const child of Object.values(value)) frozen(child); Object.freeze(value) } return value }
export interface BrowserPngCaptureProfile {
  schema: 'trident-owned-browser-png-capture-profile-v1'
  contextSha256: string
  completionSha256: string
  fontManifestSha256: string
  browser: unknown
  fontFiles: readonly { path: string; sha256: string; bytes: number }[]
  resources: unknown
  rasterization: { protocol: 'legacy-no-inline' | 'owned-image-inlining-v1'; resourceManifestSha256?: string }
  producerClosure: readonly string[]
  attemptIds?: readonly string[]
  legacyCheckpointSha256?: string
  claim: 'Static captured frame on an opaque white canvas at intrinsic raster dimensions; no font identity, animation, metadata, structural or independent resvg preservation claim'
}

/** Read the completed collection's actual capture environment. The collector
 * checked this same font manifest before/after capture; replay rechecks bytes.
 * This is environment provenance, never a pixel-derived font assertion. */
export function readBrowserPngCaptureProfile(input: { root: string; fontsFile?: string; completionFile: string; legacyProducerProofFile?: string }): Readonly<BrowserPngCaptureProfile> {
  const contextBytes = readFileSync(join(input.root, 'context.json')), context = JSON.parse(contextBytes.toString())
  const completionBytes = readFileSync(input.completionFile), completion = JSON.parse(completionBytes.toString())
  let fontManifestSha256: string, fontFiles: BrowserPngCaptureProfile['fontFiles'], configuration: any[] = [], producerClosure: string[], attemptIds: string[] | undefined, legacyCheckpointSha256: string | undefined
  if (completion.schema === 'trident-browser-png-capture-v2') {
    const beforeBytes = readFileSync(join(dirname(input.completionFile), 'before.json')), before = JSON.parse(beforeBytes.toString())
    if (completion.status !== 'available' || before.status !== 'available' || completion.beforeSha256 !== evidenceBytesDigest(beforeBytes) || completion.contextSha256 !== evidenceBytesDigest(contextBytes) || before.contextSha256 !== completion.contextSha256 || completion.afterEnvironmentSha256 !== evidenceDigest(before.environment) || !Array.isArray(completion.attemptIds) || new Set(completion.attemptIds).size !== completion.attemptIds.length) throw Error('Static SVG capture lacks unchanged before/after environment and actual invocation coverage')
    if (before.schema !== 'trident-browser-png-capture-before-v2' || !Array.isArray(before.baselineAttemptIds) || !hash(before.baselineJournalSha256) || !Array.isArray(completion.coverage) || completion.coverage.length !== completion.attemptIds.length) throw Error('Static SVG capture lacks its durable pre-call journal baseline')
    const journal = readCheckpointEntries(join(input.root,'invocations'), {schema:'trident-invocation-journal-v1'}).map(([_key,frame])=>admitInvocationEvidence(frame))
    for (const attemptId of completion.attemptIds) {
      const own = completion.coverage.filter((item:any)=>item.attemptId===attemptId), rows=journal.filter(frame=>frame.attemptId===attemptId), starts=rows.filter(frame=>frame.state==='started'),outcomes=rows.filter(frame=>['returned','public-error','interrupted'].includes(frame.state))
      if (before.baselineAttemptIds.includes(attemptId) || own.length!==1 || starts.length!==1 || outcomes.length!==1 || own[0].startedFrameSha256!==evidenceDigest(starts[0]) || own[0].outcomeFrameSha256!==evidenceDigest(outcomes[0]) || outcomes[0]!.startedReceiptSha256!==evidenceDigest(starts[0])) throw Error('Static SVG capture coverage differs from actual new invocation frames')
    }
    fontManifestSha256 = evidenceBytesDigest(beforeBytes); fontFiles = before.environment?.fonts; configuration = before.environment?.configuration; producerClosure = before.producers; attemptIds = completion.attemptIds
  } else {
    // Compatibility for the already executed externally audited collection.
    // Reconstructing its immutable checkpoint proves the old producer closure;
    // no retrospective font timestamp or invocation is manufactured.
    if (completion.schema !== 'trident-owned-full-png-collection-v1' || !input.fontsFile || !input.legacyProducerProofFile) throw Error('Static SVG capture lacks its completed frozen-font collection receipt')
    const fontBytes = readFileSync(input.fontsFile), fonts = JSON.parse(fontBytes.toString()), proof = JSON.parse(readFileSync(input.legacyProducerProofFile, 'utf8')), checkpointBytes = readFileSync(join(input.root, 'checkpoint.json')), checkpoint = JSON.parse(checkpointBytes.toString())
    if (proof.schema !== 'trident-audited-external-png-capture-producer-v1' || proof.identitySha256 !== evidenceBytesDigest(JSON.stringify(proof.identity)) || proof.identitySha256 !== checkpoint.identitySha256 || evidenceDigest(proof.identity.context) !== evidenceDigest(context) || proof.completionSha256 !== evidenceBytesDigest(completionBytes) || proof.fontManifestSha256 !== evidenceBytesDigest(fontBytes) || proof.externalCollector?.sha256 !== evidenceBytesDigest(readFileSync(join(dirname(input.legacyProducerProofFile), proof.externalCollector.path))) || !proof.identity.projects.includes(completion.project) || completion.fontsSha256 !== evidenceBytesDigest(fontBytes)) throw Error('External PNG capture producer/checkpoint or font proof differs')
    fontManifestSha256 = evidenceBytesDigest(fontBytes); fontFiles = fonts.files; producerClosure = proof.identity.producers; legacyCheckpointSha256 = evidenceBytesDigest(checkpointBytes)
    const rows = JSON.parse(readFileSync(join(input.root,'result.json'),'utf8')).observations
    if (!Array.isArray(rows)) throw Error('External PNG capture has no exact result invocation coverage')
    attemptIds = rows.filter((row:any)=>row.operation==='render' && row.metrics?.transport==='svg-conversion').map((row:any)=>row.metrics.rawInvocationId)
    if (!attemptIds?.length || attemptIds.some(id=>typeof id!=='string'||!id.trim()) || new Set(attemptIds).size!==attemptIds.length) throw Error('External PNG capture has incomplete or duplicated result invocation coverage')
  }
  if (completion.resultSha256 !== evidenceBytesDigest(readFileSync(join(input.root, 'result.json'))) || !Array.isArray(fontFiles) || !fontFiles.length || !Array.isArray(configuration) || !Array.isArray(producerClosure) || !producerClosure.length || producerClosure.some(item => typeof item !== 'string' || !/^[0-9]{6} blob [a-f0-9]{40}\t.+$/.test(item))) throw Error('Static SVG capture lacks its exact result, fonts or producer closure')
  const browser = context.browser
  if (browser?.status !== 'available' || !browser.version || !browser.path || !hash(browser.sha256) || evidenceBytesDigest(readFileSync(browser.path)) !== browser.sha256 || !Array.isArray(browser.companions) || !browser.companions.length) throw Error('Static SVG capture lacks its frozen browser bytes')
  for (const file of [...browser.companions, ...fontFiles, ...configuration, ...(context.resources?.files ?? [])]) {
    if (!file?.path || !hash(file.sha256)) throw Error('Static SVG capture has an invalid frozen environment file')
    const bytes = readFileSync(file.path)
    if (evidenceBytesDigest(bytes) !== file.sha256 || file.bytes !== undefined && file.bytes !== bytes.length) throw Error('Static SVG capture environment bytes changed')
  }
  if (new Set(fontFiles.map(file => file.path)).size !== fontFiles.length || !hash(context.resources?.manifestSha256)) throw Error('Static SVG capture font/resource identity is incomplete')
  const profile: BrowserPngCaptureProfile = { schema: 'trident-owned-browser-png-capture-profile-v1', contextSha256: evidenceBytesDigest(contextBytes), completionSha256: evidenceBytesDigest(completionBytes), fontManifestSha256, browser, fontFiles, resources: context.resources, rasterization: context.rasterization ?? { protocol: 'legacy-no-inline' }, producerClosure, ...(attemptIds ? { attemptIds } : {}), ...(legacyCheckpointSha256 ? { legacyCheckpointSha256 } : {}), claim: 'Static captured frame on an opaque white canvas at intrinsic raster dimensions; no font identity, animation, metadata, structural or independent resvg preservation claim' }
  if (!['legacy-no-inline','owned-image-inlining-v1'].includes(profile.rasterization.protocol) || profile.rasterization.protocol === 'owned-image-inlining-v1' && profile.rasterization.resourceManifestSha256 !== context.resources.manifestSha256) throw Error('Static SVG capture has an unknown conversion or image-resource policy')
  frozen(profile); return profile
}

