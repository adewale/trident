/** One small JSON-lines transport for existing terminal bindings and the raster observer. */
export class DrawingWorker {
  child: Bun.Subprocess<'pipe', 'pipe', 'ignore'>
  pending = new Map<number, { done: (r: any) => void; timer: ReturnType<typeof setTimeout> }>()
  next = 0
  constructor(args: string[]) {
    const child = (this.child = Bun.spawn(args, { stdin: 'pipe', stdout: 'pipe', stderr: 'ignore' }))
    void (async () => {
      const reader = child.stdout.getReader(),
        decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const item = await reader.read()
        if (item.done) break
        buffer += decoder.decode(item.value, { stream: true })
        let end
        while ((end = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, end)
          buffer = buffer.slice(end + 1)
          try {
            const row = JSON.parse(line),
              request = this.pending.get(row.id)
            if (request) {
              clearTimeout(request.timer)
              request.done(row)
              this.pending.delete(row.id)
            }
          } catch {}
        }
      }
      for (const r of this.pending.values()) {
        clearTimeout(r.timer)
        r.done({ ok: false, error: 'Worker exited' })
      }
      this.pending.clear()
    })()
  }
  call(input: any, timeoutMs = 20000): Promise<any> {
    if (this.child.exitCode !== null) return Promise.resolve({ ok: false, error: 'Worker has stopped' })
    const id = this.next++
    return new Promise(done => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        this.close()
        done({ ok: false, error: 'Worker timed out' })
      }, timeoutMs)
      this.pending.set(id, { done, timer })
      this.child.stdin.write(JSON.stringify({ ...input, id }) + '\n')
      void this.child.stdin.flush()
    })
  }
  async close() {
    this.child.kill('SIGKILL')
    await this.child.exited
  }
}
