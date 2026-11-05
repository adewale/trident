import fs from 'node:fs'
import readline from 'node:readline'
import { terminalRenderer } from './terminal-renderer.mjs'

const send = value => process.stdout.write(JSON.stringify(value) + '\n')
let renderer
try { renderer = await terminalRenderer(JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))); send({ type: 'ready', boundary: renderer.boundary }) }
catch (error) { send({ type: 'blocked', detail: String(error).slice(0, 500) }); process.exit(1) }
for await (const line of readline.createInterface({ input: process.stdin })) {
  const job = JSON.parse(line), started = performance.now()
  let outcome = 'completed', value, error
  try { value = await renderer.invoke(job.source) } catch (thrown) { outcome = 'error'; error = String(thrown?.message ?? thrown).split('\n')[0].slice(0, 160) }
  const ms = performance.now() - started
  // Text is returned only for mechanical admission by the host; it is not retained.
  const output = typeof value === 'string' ? value : value instanceof Uint8Array ? new TextDecoder().decode(value) : typeof value?.output === 'string' ? value.output : typeof value?.text === 'string' ? value.text : null
  try { await renderer.afterCall?.() } catch (error) { send({ type: 'result', id: job.id, outcome: 'cleanup-error', ms }); process.exit(2) }
  send({ type: 'result', id: job.id, outcome, ms, output, ...(error ? { error } : {}) })
}
await renderer.close()
