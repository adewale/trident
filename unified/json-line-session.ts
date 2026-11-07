import { watchMemory } from './process-memory.ts'
import { spawnCommunitySubprocess, killCommunityProcess } from './community-process.ts'
import { wireLine } from '../portable/json-lines.ts'

export class SessionFailure extends Error {
  readonly kind: 'timeout' | 'memory' | 'exit' | 'protocol' | 'closed' | 'transport'
  constructor(kind: SessionFailure['kind'], message: string) { super(message); this.kind = kind }
}
type Pending = { id: string | number; resolve: (row: any) => void; reject: (error: SessionFailure) => void; timer: ReturnType<typeof setTimeout> }

/** Own one single-flight protocol, process group, pipe reader and all its timers.
 * Non-protocol library log lines are ignored within the same bounded frame budget. */
export class JsonLineSession {
  readonly child: ReturnType<typeof spawnCommunitySubprocess>
  readonly ready: Promise<void>
  private phase: 'starting' | 'idle' | 'busy' | 'retiring' | 'closed'
  private pending?: Pending
  private failure?: SessionFailure
  private stopWatching: () => void
  private startTimer?: ReturnType<typeof setTimeout>
  private readyResolve!: () => void
  private readyReject!: (error: SessionFailure) => void
  private protocol: { ready?: (row: any) => boolean; reply: (row: any) => boolean; maxFrameBytes?: number }
  constructor(args: string[], protocol: JsonLineSession['protocol']) {
    this.protocol = protocol
    this.phase = protocol.ready ? 'starting' : 'idle'
    this.ready = new Promise((resolve, reject) => { this.readyResolve = resolve; this.readyReject = reject })
    // A caller can close before awaiting ready. It still receives its rejection.
    void this.ready.catch(() => {})
    this.child = spawnCommunitySubprocess(args)
    this.stopWatching = watchMemory(this.child.pid, () => this.fail(new SessionFailure('memory', 'memory limit')))
    void this.child.stderr.pipeTo(new WritableStream({ write() {} })).catch(() => {})
    if (protocol.ready) this.startTimer = setTimeout(() => this.fail(new SessionFailure('timeout', 'Worker initialization timed out')), 30_000)
    else this.readyResolve()
    const reading = this.read().catch(error => this.fail(error instanceof SessionFailure ? error : new SessionFailure('transport', String(error))))
    void this.child.exited.then(async () => {
      // Drain the final frame before reporting exit. Kill pipe-holding descendants
      // so a stopped worker cannot defer that drain indefinitely.
      killCommunityProcess(this.child, 'SIGKILL')
      await reading
      this.fail(new SessionFailure('exit', 'Worker exited'))
      this.phase = 'closed'
    })
  }
  private accept(line: string) {
    let row: any
    try { row = JSON.parse(line) } catch { return }
    if (!row || typeof row !== 'object' || Array.isArray(row)) return
    if (row.type === 'blocked') throw new SessionFailure('protocol', String(row.detail ?? 'Worker blocked'))
    if (this.protocol.ready?.(row)) {
      if (this.phase !== 'starting') throw new SessionFailure('protocol', 'Unexpected duplicate worker readiness')
      clearTimeout(this.startTimer); this.phase = 'idle'; this.readyResolve(); return
    }
    // JSON logs are not replies. A marked reply, including a malformed one, must validate.
    if (row.type !== 'result' && !Object.hasOwn(row, 'id')) return
    if (!this.protocol.reply(row)) throw new SessionFailure('protocol', 'Invalid worker reply')
    const pending = this.pending
    if (this.phase !== 'busy' || !pending || row.id !== pending.id) throw new SessionFailure('protocol', 'Unexpected worker reply identity')
    this.pending = undefined; clearTimeout(pending.timer); this.phase = 'idle'; pending.resolve(row)
  }
  private async read() {
    const reader = this.child.stdout.getReader(), pieces: Uint8Array[] = []
    let bytes = 0
    const maximum = this.protocol.maxFrameBytes ?? 32 * 1024 * 1024
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        let start = 0
        for (let i = 0; i <= value.length; i++) if (i === value.length || value[i] === 10) {
          const piece = value.subarray(start, i)
          bytes += piece.length
          if (bytes > maximum) throw new SessionFailure('protocol', 'Worker frame exceeds byte budget')
          if (piece.length) pieces.push(piece)
          if (i < value.length) {
            this.accept(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(pieces, bytes)))
            pieces.length = 0; bytes = 0
          }
          start = i + 1
        }
      }
      if (bytes) throw new SessionFailure('protocol', 'Truncated worker frame')
    } finally { reader.releaseLock() }
  }
  async call(input: object, id: string | number, timeoutMs: number): Promise<any> {
    await this.ready
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw Error('Worker timeout must be finite and positive')
    if (this.phase !== 'idle') throw this.failure ?? Error(this.phase === 'busy' ? 'Worker already has an outstanding call' : 'Worker has stopped')
    const line = wireLine({ ...input, id })
    if (Buffer.byteLength(line) > (this.protocol.maxFrameBytes ?? 32 * 1024 * 1024)) throw Error('Worker request exceeds byte budget')
    this.phase = 'busy'
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new SessionFailure('timeout', 'Worker timed out')), timeoutMs)
      this.pending = { id, resolve, reject, timer }
      try {
        this.child.stdin.write(line)
        void Promise.resolve(this.child.stdin.flush()).catch(error => this.fail(new SessionFailure('transport', 'Worker transport: ' + error)))
      } catch (error) { this.fail(new SessionFailure('transport', 'Worker transport: ' + error)) }
    })
  }
  private fail(error: SessionFailure, graceful = false) {
    if (this.phase === 'retiring' || this.phase === 'closed') return
    this.failure = error; this.phase = 'retiring'
    clearTimeout(this.startTimer); this.stopWatching(); this.readyReject(error)
    const pending = this.pending; this.pending = undefined
    if (pending) { clearTimeout(pending.timer); pending.reject(error) }
    if (!graceful) killCommunityProcess(this.child, 'SIGKILL')
    try { this.child.stdin.end() } catch {}
  }
  async close() {
    // EOF lets an idle worker and wrappers such as xvfb-run clean up their
    // private resources. Busy, failed and unresponsive workers still retire by
    // killing the owned process group; shutdown is outside every API clock.
    const graceful = this.phase === 'idle'
    this.fail(new SessionFailure('closed', 'Worker closed'), graceful)
    const timer = graceful ? setTimeout(() => killCommunityProcess(this.child, 'SIGKILL'), 1000) : undefined
    try { await this.child.exited } finally { clearTimeout(timer) }
  }
}
