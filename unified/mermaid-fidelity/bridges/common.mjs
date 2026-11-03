// Shared plumbing for parser bridges written in JavaScript. See ../bridges.ts.
import { readFileSync } from 'node:fs'

export const request = () => JSON.parse(readFileSync(0, 'utf8'))

/** Print one reply line, preserving Map, Set and Date values for the runtime. */
export function emit(reply) {
  process.stdout.write(JSON.stringify(reply, function (key, item) {
    if (this[key] instanceof Date) return { __tridentNativeDate: this[key].toISOString() }
    return item instanceof Map ? { __tridentNativeMap: [...item] } : item instanceof Set ? { __tridentNativeSet: [...item] } : item
  }) + '\n')
}

const norm = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(?:v2|beta|diagram|chart)+$/g, '')
const aliases = { er: ['er', 'entityrelationship'], gitgraph: ['git', 'gitgraph'], c4: ['c4', 'c4context', 'c4container', 'c4component', 'c4dynamic', 'c4deployment'], state: ['state', 'statediagram'], class: ['class', 'classdiagram'], swimlanes: ['swimlane', 'swimlanes'] }
/** Whether a diagram type the project itself reported is the requested family. */
export function familyMatches(reported, family) {
  const r = norm(reported), wanted = aliases[family] ?? [norm(family)]
  return wanted.some(name => r === name || r.startsWith(name))
}
