import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { writeDurableEvidence } from '../portable/checkpoint.ts'

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
