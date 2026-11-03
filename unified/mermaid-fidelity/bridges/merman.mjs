// Latias94/merman: the native CLI's own `parse` command prints its semantic model.
import { spawnSync } from 'node:child_process'
import { emit, familyMatches, request } from './common.mjs'

const { family, source } = request()
const cli = process.argv[2]
const result = spawnSync(cli, ['parse', '--meta', '-'], { input: source, encoding: 'utf8', timeout: 8000, maxBuffer: 64 * 1024 * 1024 })
if (result.error) emit({ adapterGap: 'merman-cli could not run: ' + result.error.message })
else if (result.status !== 0) {
  const message = result.stderr.trim()
  if (/No Mermaid diagram type detected|unsupported diagram|unknown diagram/i.test(message)) emit({ unsupported: message })
  else if (/parse error/i.test(message)) emit({ error: { name: 'ParseError', message } })
  else emit({ adapterGap: 'Unclassified merman-cli failure: ' + message.slice(0, 300) })
} else {
  let parsed
  try { parsed = JSON.parse(result.stdout) } catch { emit({ adapterGap: 'merman-cli printed no JSON model' }); process.exit(0) }
  const type = parsed.meta?.diagram_type ?? parsed.model?.type
  if (!familyMatches(type, family)) emit({ unsupported: `merman parsed this source as ${type}, not ${family}` })
  else emit({ value: { ...parsed.model, ...(parsed.meta?.title !== undefined && parsed.model?.title === undefined ? { title: parsed.meta.title } : {}) } })
}
