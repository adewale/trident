// Latias94/merman: the native CLI's own `parse` command prints its semantic model.
// The CLI runs once per parse; serve mode only saves this wrapper's own start-up.
import { spawnSync } from 'node:child_process'
import { familyMatches, serve } from './common.mjs'

const cli = process.argv[2]
await serve(async (family, source) => {
  const result = spawnSync(cli, ['parse', '--meta', '-'], { input: source, encoding: 'utf8', timeout: 8000, maxBuffer: 64 * 1024 * 1024 })
  if (result.error) return { adapterGap: 'merman-cli could not run: ' + result.error.message }
  if (result.status !== 0) {
    const message = result.stderr.trim()
    if (/No Mermaid diagram type detected|unsupported diagram|unknown diagram/i.test(message)) return { unsupported: message }
    if (/parse error/i.test(message)) return { error: { name: 'ParseError', message } }
    return { adapterGap: 'Unclassified merman-cli failure: ' + message.slice(0, 300) }
  }
  let parsed
  try {
    parsed = JSON.parse(result.stdout)
  } catch {
    return { adapterGap: 'merman-cli printed no JSON model' }
  }
  const type = parsed.meta?.diagram_type ?? parsed.model?.type
  if (!familyMatches(type, family)) return { unsupported: `merman parsed this source as ${type}, not ${family}` }
  return { value: { ...parsed.model, ...(parsed.meta?.title !== undefined && parsed.model?.title === undefined ? { title: parsed.meta.title } : {}) } }
})
