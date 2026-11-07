// A synchronous client for a long-lived parser bridge (TRIDENT_BRIDGE_SERVE=1).
// The original tests call parsers synchronously, so the test thread blocks on
// Atomics.wait while a worker thread owns the child process and its pipes. A
// bridge that hangs or exits is killed and restarted, and that call reports a
// failure for the runtime to record as a Trident gap, never a result.
import { MessageChannel, Worker, receiveMessageOnPort } from 'node:worker_threads'
import { randomUUID } from 'node:crypto'

const MARK = '\u0001TRIDENT\u0001'
const WORKER = `
const { workerData, parentPort } = require('node:worker_threads')
const { spawn } = require('node:child_process')
const { StringDecoder } = require('node:string_decoder')
const { command, args, cwd, state, port, mark } = workerData
const child = spawn(command, args, { cwd, detached: process.platform !== 'win32', env: { ...process.env, TRIDENT_BRIDGE_SERVE: '1' }, stdio: ['pipe', 'pipe', 'pipe'] })
let buffer = '', stderr = '', pending
const decoder = new StringDecoder('utf8')
const wake = message => { port.postMessage({ ...message, requestId: pending }); pending = undefined; Atomics.store(state, 0, 1); Atomics.notify(state, 0) }
child.stderr.on('data', data => { stderr = (stderr + data).slice(-2000) })
child.stdout.on('data', data => {
  buffer += decoder.write(data)
  if (Buffer.byteLength(buffer) > 32 * 1024 * 1024) return wake({ failure: 'bridge frame exceeds byte budget' })
  for (let end; (end = buffer.indexOf('\\n')) >= 0; ) {
    const line = buffer.slice(0, end)
    buffer = buffer.slice(end + 1)
    if (line.startsWith(mark)) {
      let reply
      try { reply = JSON.parse(line.slice(mark.length)) } catch { return wake({ failure: 'invalid bridge reply' }) }
      if (!pending || reply.requestId !== pending) return wake({ failure: 'unexpected bridge reply identity' })
      wake({ line: line.slice(mark.length) })
    }
  }
})
child.on('error', error => wake({ failure: 'bridge could not start: ' + error.message }))
child.on('exit', code => wake({ failure: 'bridge exited with ' + code + (stderr ? ': ' + stderr.slice(-400) : '') }))
child.stdin.on('error', () => {})
Atomics.store(state, 1, child.pid ?? 0)
parentPort.on('message', ({ request, requestId }) => {
  if (pending) return wake({ failure: 'overlapping bridge request' })
  pending = requestId
  child.stdin.write(JSON.stringify({ ...request, requestId }).replace(/[\\u2028\\u2029]/g, c => '\\\\u' + c.charCodeAt(0).toString(16)) + '\\n')
})
`

export function persistentBridge(command, args, cwd, timeoutMs = 10_000) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw Error('Bridge timeout must be finite and positive')
  let worker, port, state, closed = false, sequence = 0
  const epoch = randomUUID()
  const start = () => {
    // [0]: reply ready flag, [1]: the child's process id
    state = new Int32Array(new SharedArrayBuffer(8))
    const channel = new MessageChannel()
    port = channel.port1
    worker = new Worker(WORKER, { eval: true, workerData: { command, args, cwd, state, port: channel.port2, mark: MARK }, transferList: [channel.port2] })
    worker.unref()
    worker.on('error', () => {}) // The bounded wait reports a worker failure as a gap.
  }
  const stop = () => {
    const pid = state && Atomics.load(state, 1)
    try { if (pid) process.kill(process.platform === 'win32' ? pid : -pid, 'SIGKILL') } catch {}
    worker?.terminate()
    port?.close()
    worker = undefined
  }
  return {
    /** The reply line for one request, or { failure } when the bridge did not answer. */
    call(request) {
      if (closed) return { failure: 'bridge is closed' }
      // A message left over from a bridge that exited between calls means restart first.
      if (worker && receiveMessageOnPort(port)) stop()
      if (!worker) start()
      Atomics.store(state, 0, 0)
      const requestId = epoch + ':' + sequence++
      worker.postMessage({ request, requestId })
      if (Atomics.wait(state, 0, 0, timeoutMs) === 'timed-out') {
        stop()
        return { failure: `bridge gave no reply within ${timeoutMs} ms` }
      }
      const reply = receiveMessageOnPort(port)?.message
      if (!reply || reply.failure || reply.requestId !== requestId) {
        stop()
        return { failure: reply?.failure ?? 'bridge reply identity was lost' }
      }
      return reply ?? { failure: 'bridge reply was lost' }
    },
    close() { closed = true; stop() },
  }
}
