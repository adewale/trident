import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { writeDurableEvidence } from '../portable/checkpoint.ts'

interface CaptureEnvironment { fonts: { path: string; sha256: string; bytes: number }[]; configuration: { path: string; sha256: string; bytes: number }[]; variables: Record<string, string | null> }
const files = (paths: string[]) => [...new Set(paths)].sort().map(path => { const bytes = readFileSync(path); return { path, sha256: evidenceBytesDigest(bytes), bytes: bytes.length } })
export function docsPngCaptureEnvironment(): CaptureEnvironment {
  const fonts = files(execFileSync('fc-list', ['-f', '%{file}\n'], { encoding: 'utf8', timeout: 10_000 }).split('\n').filter(Boolean))
  const configuration = files(execFileSync('fc-conflist', [], { encoding: 'utf8', timeout: 10_000 }).split('\n').flatMap(line => /^\+\s+([^:]+):/.exec(line)?.[1] ? [/^\+\s+([^:]+):/.exec(line)![1]!] : []))
  if (!fonts.length || !configuration.length) throw Error('Actual fontconfig font and configuration bytes are unavailable')
  return { fonts, configuration, variables: Object.fromEntries(['FONTCONFIG_FILE','FONTCONFIG_PATH','LANG','LC_ALL'].map(name => [name,process.env[name] ?? null])) }
}
export interface DocsPngCaptureStart { directory: string; root: string; before: { schema: 'trident-browser-png-capture-before-v1'; status: 'available' | 'unavailable'; contextSha256: string; producers: readonly string[]; environment?: CaptureEnvironment; reason?: string } }
/** Optional extra evidence. Failure never removes or prevents a raw public call.
 * A fresh capture directory covers only attempts entered during this execution;
 * resumed outputs cannot borrow a later font snapshot. */
export function beginDocsPngCapture(root: string, producers: readonly string[], snapshot = docsPngCaptureEnvironment): DocsPngCaptureStart {
  const directory = join(root, 'captures', randomUUID()), before: DocsPngCaptureStart['before'] = { schema: 'trident-browser-png-capture-before-v1', status: 'unavailable', contextSha256: evidenceBytesDigest(readFileSync(join(root,'context.json'))), producers: [...producers] }
  try { before.environment = snapshot(); before.status = 'available' } catch (error) { before.reason = String(error) }
  writeDurableEvidence(join(directory,'before.json'),Buffer.from(JSON.stringify(before)))
  return { root, directory, before }
}
export function completeDocsPngCapture(capture: DocsPngCaptureStart, attemptIds: readonly string[], snapshot = docsPngCaptureEnvironment) {
  let status: 'available' | 'unavailable' = 'unavailable', reason = capture.before.reason, afterEnvironmentSha256: string | null = null
  try {
    const after = snapshot(); afterEnvironmentSha256 = evidenceDigest(after)
    if (capture.before.status !== 'available' || !capture.before.environment || evidenceDigest(capture.before.environment) !== afterEnvironmentSha256) throw Error('Browser PNG font/configuration inputs changed across these actual calls')
    if (!capture.before.producers.length || evidenceBytesDigest(readFileSync(join(capture.root,'context.json'))) !== capture.before.contextSha256 || new Set(attemptIds).size !== attemptIds.length || attemptIds.some(id=>!id.trim())) throw Error('Browser PNG capture context, producer closure or actual attempt coverage differs')
    status = 'available'; reason = undefined
  } catch(error) { reason = String(error) }
  const receipt = { schema: 'trident-browser-png-capture-v1', status, beforeSha256: evidenceBytesDigest(readFileSync(join(capture.directory,'before.json'))), contextSha256: capture.before.contextSha256, resultSha256: evidenceBytesDigest(readFileSync(join(capture.root,'result.json'))), afterEnvironmentSha256, attemptIds: [...attemptIds], ...(reason ? { reason } : {}), scope: 'Font/configuration before/after byte identities for exactly the listed actual SVG-to-PNG invocation attempts. No image correctness, font identity from pixels or comparative timing credit.' }
  const file = join(capture.directory,'complete.json'); writeDurableEvidence(file,Buffer.from(JSON.stringify(receipt))); return { file, receipt }
}
