import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PreparedCommunity } from './community-types.ts'
import { JsonLineSession, SessionFailure } from './json-line-session.ts'
import { tridentDirectory } from './trident-paths.ts'

export interface TimedCall { outcome: string; ms: number | null; controllerMs?: number; invalid?: string; error?: string; failureKind?: SessionFailure['kind'] }

/** Timing is supplied by the worker's API clock, never synthesized from IPC time. */
export class TerminalCallWorker {
  readonly child: JsonLineSession['child']
  readonly ready: Promise<void>
  identity: any
  private session: JsonLineSession
  private readonly epoch = randomUUID()
  private sequence = 0
  private admit?: (output: unknown, source: string) => { valid: boolean; reason?: string }
  constructor(peer: PreparedCommunity, file: string, invocation?: string[], admit?: TerminalCallWorker['admit']) {
    this.admit = admit
    writeFileSync(file, JSON.stringify(peer))
    const python = peer.artifact?.kind === 'python'
    const bun = /bun/i.test(peer.artifact?.runtime ?? '') || /\.tsx?$/.test(peer.artifact?.module ?? '')
    const command = python ? peer.artifact!.python ?? peer.artifact!.executable! : bun ? process.execPath : process.env.NODE_BIN ?? 'node'
    const args = python ? [join(tridentDirectory, 'unified/davebench-terminal-worker.py')] : [join(tridentDirectory, 'unified/davebench-terminal-worker.mjs'), file]
    this.session = new JsonLineSession(invocation ?? [command, ...args], {
      ready: row => { if (row.type !== 'ready') return false; this.identity = row; return true },
      reply: row => row.type === 'result' && typeof row.id === 'string' && ['completed', 'error', 'invalid', 'cleanup-error'].includes(row.outcome) && typeof row.ms === 'number' && Number.isFinite(row.ms) && row.ms >= 0,
    })
    this.child = this.session.child; this.ready = this.session.ready
  }
  async call(source: string, _id: string, timeoutMs: number): Promise<TimedCall> {
    await this.ready
    const started = performance.now()
    let value: any
    try { value = await this.session.call({ source }, this.epoch + ':' + this.sequence++, timeoutMs) }
    catch (error) {
      if (!(error instanceof SessionFailure)) throw error
      return { outcome: error.kind === 'timeout' ? 'timeout' : 'error', ms: null, controllerMs: performance.now() - started, error: error.message, failureKind: error.kind }
    }
    const { outcome, ms } = value
    if (outcome !== 'completed' || !this.admit) return { outcome, ms, ...(typeof value.invalid === 'string' ? { invalid: value.invalid } : {}), ...(typeof value.error === 'string' ? { error: value.error } : {}) }
    const validity = this.admit(value.output, source)
    return validity.valid ? { outcome: 'completed', ms } : { outcome: 'invalid', ms, invalid: validity.reason }
  }
  close() { return this.session.close() }
}
