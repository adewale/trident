import { JsonLineSession, SessionFailure } from '../../unified/json-line-session.ts'

/** Drawing bindings use the same owned single-flight transport as timed workers. */
export class DrawingWorker {
  readonly child: JsonLineSession['child']
  memoryExceeded = false
  private session: JsonLineSession
  private next = 0
  constructor(args: string[], protocol: 'terminal' | 'raster' = 'terminal') {
    this.session = new JsonLineSession(args, { reply: row => Number.isSafeInteger(row.id) && (protocol === 'terminal' ? typeof row.ok === 'boolean' && (row.ok || typeof row.error === 'string') : ['correct', 'incorrect', 'unknown'].includes(row.status) && typeof row.reason === 'string') })
    this.child = this.session.child
  }
  async call(input: any, timeoutMs = 20_000): Promise<any> {
    try { return await this.session.call(input, this.next++, timeoutMs) }
    catch (error) {
      if (!(error instanceof SessionFailure)) throw error
      this.memoryExceeded ||= error.kind === 'memory'
      return { ok: false, error: error.message, failureKind: error.kind }
    }
  }
  close() { return this.session.close() }
}
