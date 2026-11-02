import readline from 'node:readline'
import { terminalRenderer } from '../../unified/terminal-renderer.mjs'
let renderer
for await (const line of readline.createInterface({ input: process.stdin })) {
  const job = JSON.parse(line)
  try {
    if (job.type === 'init') { renderer = await terminalRenderer(job.peer); console.log(JSON.stringify({ id: job.id, ok: true })); continue }
    let text, failure
    try { text = await renderer.invoke(job.source) } catch (error) { failure = String(error) }
    await renderer.afterCall?.()
    console.log(JSON.stringify(failure ? { id: job.id, ok: false, error: failure } : { id: job.id, ok: true, text }))
  } catch (error) { console.log(JSON.stringify({ id: job.id, ok: false, error: String(error) })) }
}
await renderer?.close()
