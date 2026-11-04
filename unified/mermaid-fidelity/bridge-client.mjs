// A synchronous client for a long-lived parser bridge (TRIDENT_BRIDGE_SERVE=1).
// The original tests call parsers synchronously, so the test thread blocks on
// Atomics.wait while a worker thread owns the child process and its pipes. A
// bridge that hangs or exits is killed and restarted, and that call reports a
// failure for the runtime to record as a Trident gap, never a result.
import { MessageChannel, Worker, receiveMessageOnPort } from 'node:worker_threads'

const MARK = '\u0001TRIDENT\u0001'
const WORKER = `
const { workerData, parentPort } = require('node:worker_threads')
const { spawn } = require('node:child_process')
const { command, args, cwd, state, port, mark } = workerData
const child = spawn(command, args, { cwd, env: { ...process.env, TRIDENT_BRIDGE_SERVE: '1' }, stdio: ['pipe', 'pipe', 'pipe'] })
let buffer = '', stderr = ''
const wake = message => { port.postMessage(message); Atomics.store(state, 0, 1); Atomics.notify(state, 0) }
child.stderr.on('data', data => { stderr = (stderr + data).slice(-2000) })
child.stdout.on('data', data => {
  buffer += data
  for (let end; (end = buffer.indexOf('\\n')) >= 0; ) {
    const line = buffer.slice(0, end)
    buffer = buffer.slice(end + 1)
    if (line.startsWith(mark)) wake({ line: line.slice(mark.length) })
  }
})
child.on('error', error => wake({ failure: 'bridge could not start: ' + error.message }))
child.on('exit', code => wake({ failure: 'bridge exited with ' + code + (stderr ? ': ' + stderr.slice(-400) : '') }))
child.stdin.on('error', () => {})
Atomics.store(state, 1, child.pid ?? 0)
parentPort.on('message', request => child.stdin.write(JSON.stringify(request) + '\\n'))
`

export function persistentBridge(command, args, cwd, timeoutMs = 10_000) {
  let worker, port, state
  const start = () => {
    // [0]: reply ready flag, [1]: the child's process id
    state = new Int32Array(new SharedArrayBuffer(8))
    const channel = new MessageChannel()
    port = channel.port1
    worker = new Worker(WORKER, { eval: true, workerData: { command, args, cwd, state, port: channel.port2, mark: MARK }, transferList: [channel.port2] })
    worker.unref()
  }
  const stop = () => {
    const pid = state && Atomics.load(state, 1)
    try { if (pid) process.kill(pid, 'SIGKILL') } catch {}
    worker?.terminate()
    worker = undefined
  }
  return {
    /** The reply line for one request, or { failure } when the bridge did not answer. */
    call(request) {
      // A message left over from a bridge that exited between calls means restart first.
      for (let stale; worker && (stale = receiveMessageOnPort(port)); ) if (stale.message.failure) stop()
      if (!worker) start()
      Atomics.store(state, 0, 0)
      worker.postMessage(request)
      if (Atomics.wait(state, 0, 0, timeoutMs) === 'timed-out') {
        stop()
        return { failure: `bridge gave no reply within ${timeoutMs} ms` }
      }
      const reply = receiveMessageOnPort(port)?.message
      if (!reply || reply.failure) stop()
      return reply ?? { failure: 'bridge reply was lost' }
    },
    close: stop,
  }
}
