import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { CollectionCheckpoint, writeDurableEvidence } from './checkpoint.ts'
import { admitInvocationEvidence, evidenceBytesDigest, evidenceDigest, type InvocationEvidence, type InvocationIdentity } from './evidence-contract.ts'

/** One durable raw stream per worker/collector. A returned frame is committed
 * before qualification, with exact bytes and only the clock actually measured. */
export class InvocationJournal {
  private checkpoint: CollectionCheckpoint
  readonly directory: string
  constructor(directory: string) { this.directory = directory; this.checkpoint = new CollectionCheckpoint(directory, { schema: 'trident-invocation-journal-v1' }) }
  start(identity: InvocationIdentity): Readonly<InvocationEvidence> {
    const frame = admitInvocationEvidence({ schema: 'trident-invocation-evidence-v1', attemptId: randomUUID(), identity, state: 'started', recordedAt: new Date().toISOString(), startedAt: new Date().toISOString(), finishedAt: null, durationMs: null, output: null, detail: 'Public-call entry is about to run; no return, rejection or duration is inferred' })
    this.checkpoint.record(frame.attemptId + ':started', frame)
    return frame
  }
  returned(started: InvocationEvidence, output: string | Uint8Array, durationMs: number | null, streams?: InvocationEvidence['streams']) {
    started = this.ownStart(started)
    const retained = this.retain(typeof output === 'string' ? Buffer.from(output) : output)
    const frame = admitInvocationEvidence({ ...started, state: 'returned', recordedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), durationMs, output: retained, ...(streams ? { streams } : {}), detail: 'Actual public return retained before grading. Timestamps are call-entry/retention bounds; durationMs is the separately measured public clock.' })
    this.checkpoint.record(frame.attemptId + ':returned', frame)
    return frame
  }
  failed(started: InvocationEvidence, error: unknown, durationMs: number | null, state: 'public-error' | 'interrupted' = 'public-error', streams?: InvocationEvidence['streams']) {
    started = this.ownStart(started)
    const frame = admitInvocationEvidence({ ...started, state, recordedAt: new Date().toISOString(), finishedAt: state === 'interrupted' ? null : new Date().toISOString(), durationMs, output: null, ...(streams ? { streams } : {}), detail: String(error) })
    this.checkpoint.record(frame.attemptId + ':' + state, frame)
    return frame
  }
  /** Scheduled call entries with no retained outcome are not inferred to have
   * returned or even crossed the public API boundary. A retry gets a new UUID. */
  pending(identity?: InvocationIdentity): Readonly<InvocationEvidence>[] {
    return this.checkpoint.entries<InvocationEvidence>().filter(([key, value]) => key.endsWith(':started') && (!identity || evidenceDigest(value.identity) === evidenceDigest(identity)) && !['returned', 'public-error', 'interrupted'].some(state => this.checkpoint.has(value.attemptId + ':' + state))).map(([_key, value]) => admitInvocationEvidence(value))
  }
  adopt(raw: InvocationEvidence): Readonly<InvocationEvidence> {
    const value = admitInvocationEvidence(raw)
    const existingStart = this.checkpoint.get<InvocationEvidence>(value.attemptId + ':started')
    if (existingStart && evidenceDigest(existingStart.identity) !== evidenceDigest(value.identity)) throw Error('External invocation identity differs from its durable start')
    const previous = this.outcome(value.attemptId)
    if (previous && value.state === 'started' && (!existingStart || evidenceDigest(existingStart) !== evidenceDigest(value))) throw Error('External start appeared after a terminal outcome')
    if (previous && value.state !== 'started' && previous.state !== value.state) throw Error('External invocation has contradictory outcomes')
    const own = (reference: NonNullable<InvocationEvidence['output']>) => { const bytes = readFileSync(reference.path); if (bytes.byteLength !== reference.bytes || evidenceBytesDigest(bytes) !== reference.sha256) throw Error('External invocation output bytes differ'); return this.retain(bytes) }
    const frame = admitInvocationEvidence({ ...value, output: value.output ? own(value.output) : null, ...(value.streams ? { streams: { stdout: own(value.streams.stdout), stderr: own(value.streams.stderr) } } : {}) })
    this.checkpoint.record(frame.attemptId + ':' + frame.state, frame)
    return frame
  }
  outcome(attemptId: string): Readonly<InvocationEvidence> | undefined {
    const frames = ['returned', 'public-error', 'interrupted'].flatMap(state => { const frame = this.checkpoint.get<InvocationEvidence>(attemptId + ':' + state); return frame ? [admitInvocationEvidence(frame)] : [] })
    if (frames.length > 1) throw Error('Invocation has contradictory terminal outcomes')
    return frames[0]
  }
  streams(stdout: Uint8Array, stderr: Uint8Array): NonNullable<InvocationEvidence['streams']> { return { stdout: this.retain(stdout), stderr: this.retain(stderr) } }
  private retain(bytes: Uint8Array) {
    const sha256 = evidenceBytesDigest(bytes), path = join(this.directory, 'outputs', sha256)
    writeDurableEvidence(path, bytes)
    return { path, sha256, bytes: bytes.byteLength }
  }
  private ownStart(started: InvocationEvidence) {
    const frame = admitInvocationEvidence(started), original = this.checkpoint.get<InvocationEvidence>(frame.attemptId + ':started')
    if (frame.state !== 'started' || !original || evidenceDigest(original) !== evidenceDigest(frame)) throw Error('Invocation completion has no matching durable start')
    if (this.checkpoint.has(frame.attemptId + ':returned') || this.checkpoint.has(frame.attemptId + ':public-error') || this.checkpoint.has(frame.attemptId + ':interrupted')) throw Error('Invocation attempt already has a terminal outcome')
    return frame
  }
}
