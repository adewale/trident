import { existsSync, readFileSync } from 'node:fs'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { admitInvocationEvidence, evidenceBytesDigest, evidenceDigest, type InvocationEvidence, type InvocationIdentity } from '../portable/evidence-contract.ts'

/** A transport receipt never substitutes its own wall time for an API clock.
 * Only newline-complete, identity-bound raw frames can be recovered. */
export function recoverExternalInvocations(result: string, identities: ReadonlyMap<string, InvocationIdentity>, journal: InvocationJournal): Readonly<InvocationEvidence>[] {
  const file = result + '.invocations.jsonl'
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n') : []; lines.pop()
  const frames: Readonly<InvocationEvidence>[] = recoverNativeInvocations(result, identities, journal), seen = new Map<string, string>()
  for (const line of lines) {
    if (!line.trim()) continue
    const frame = admitInvocationEvidence(JSON.parse(line)), expected = identities.get(frame.identity.caseId)
    if (!expected || evidenceDigest(frame.identity) !== evidenceDigest(expected)) throw Error('External invocation has stale or unowned source/artifact/binding identity')
    const key = frame.attemptId + ':' + frame.state, digest = evidenceDigest(frame)
    if (seen.has(key) && seen.get(key) !== digest) throw Error('External invocation has conflicting duplicate frames')
    seen.set(key, digest)
    for (const output of [frame.output, frame.streams?.stdout, frame.streams?.stderr]) {
      if (!output) continue
      const bytes = readFileSync(output.path)
      if (bytes.byteLength !== output.bytes || evidenceBytesDigest(bytes) !== output.sha256) throw Error('External raw output differs from its retained receipt')
    }
    frames.push(journal.adopt(frame))
  }
  return frames
}

/** Native Dart flushes each call's bytes and receipt before decoding or the
 * transport's observer. Hashing/adoption can therefore recover after a bridge
 * crash without claiming a clock that the native call did not record. */
export function recoverNativeInvocations(result: string, identities: ReadonlyMap<string, InvocationIdentity>, journal: InvocationJournal): Readonly<InvocationEvidence>[] {
  const file = result + '.native/public-invocations.jsonl'
  if (!existsSync(file)) return []
  const lines = readFileSync(file, 'utf8').split('\n'); lines.pop()
  return lines.filter(line => line.trim()).map(line => {
    const receipt = JSON.parse(line), expected = identities.get(receipt.identity?.caseId)
    if (!expected || evidenceDigest(receipt.identity) !== evidenceDigest(expected)) throw Error('Native receipt has stale or unowned invocation identity')
    if (receipt.state === 'returned') {
      const bytes = readFileSync(receipt.outputPath)
      if (bytes.byteLength !== receipt.outputBytes) throw Error('Native returned bytes differ from their receipt')
      receipt.output = { path: receipt.outputPath, sha256: evidenceBytesDigest(bytes), bytes: bytes.byteLength }
    }
    delete receipt.outputPath; delete receipt.outputBytes
    return journal.adopt(admitInvocationEvidence(receipt))
  })
}
