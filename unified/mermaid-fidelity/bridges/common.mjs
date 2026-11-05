// Shared plumbing for parser bridges written in JavaScript. See ../bridges.ts.
import { readFileSync } from 'node:fs'

export const request = () => JSON.parse(readFileSync(0, 'utf8'))

/** One reply as JSON, preserving Map, Set and Date values for the runtime. */
export function encode(reply) {
  return JSON.stringify(reply, function (key, item) {
    if (this[key] instanceof Date) return { __tridentNativeDate: this[key].toISOString() }
    return item instanceof Map ? { __tridentNativeMap: [...item] } : item instanceof Set ? { __tridentNativeSet: [...item] } : item
  })
}
/** Print one reply line. */
export function emit(reply) {
  process.stdout.write(encode(reply) + '\n')
}

// In serve mode a reply line carries this marker, so output a project library prints
// to stdout while parsing can never be mistaken for a reply.
export const REPLY_MARK = '\u0001TRIDENT\u0001'

/** Run a bridge's handler: one request from stdin, or, with TRIDENT_BRIDGE_SERVE=1,
 * one JSON request per stdin line until stdin closes (the project loads once). */
export async function serve(handle) {
  const answer = async ({ family, source }) => {
    try {
      return await handle(family, source)
    } catch (error) {
      return { adapterGap: 'Parser bridge failed: ' + String(error).slice(0, 400) }
    }
  }
  if (process.env.TRIDENT_BRIDGE_SERVE !== '1') return emit(await answer(request()))
  const { createInterface } = await import('node:readline')
  for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    if (!line.trim()) continue
    process.stdout.write(REPLY_MARK + encode(await answer(JSON.parse(line))) + '\n')
  }
}

const norm = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(?:v2|beta|diagram|chart)+$/g, '')
const aliases = { er: ['er', 'entityrelationship'], gitgraph: ['git', 'gitgraph'], c4: ['c4', 'c4context', 'c4container', 'c4component', 'c4dynamic', 'c4deployment'], state: ['state', 'statediagram'], class: ['class', 'classdiagram'], swimlanes: ['swimlane', 'swimlanes'] }
/** Whether a diagram type the project itself reported is the requested family. */
export function familyMatches(reported, family) {
  const r = norm(reported), wanted = aliases[family] ?? [norm(family)]
  return wanted.some(name => r === name || r.startsWith(name))
}
