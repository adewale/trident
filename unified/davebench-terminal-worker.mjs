import fs from 'node:fs'
import readline from 'node:readline'
import { terminalRenderer } from './terminal-renderer.mjs'

const send = value => process.stdout.write(JSON.stringify(value) + '\n')
let renderer
try { renderer = await terminalRenderer(JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))); send({ type: 'ready', boundary: renderer.boundary }) }
catch (error) { send({ type: 'blocked', detail: String(error).slice(0, 500) }); process.exit(1) }
for await (const line of readline.createInterface({ input: process.stdin })) {
  const job = JSON.parse(line), started = performance.now()
  let outcome = 'completed'
  try { await renderer.invoke(job.source) } catch { outcome = 'error' }
  const ms = performance.now() - started
  try { await renderer.afterCall?.() } catch (error) { send({ type: 'result', id: job.id, outcome: 'cleanup-error', ms }); process.exit(2) }
  send({ type: 'result', id: job.id, outcome, ms })
}
await renderer.close()
