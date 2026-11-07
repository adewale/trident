// Calls Loom's own parser for the requested family, with the arguments its
// render() passes on the first attempt (default direction, LIMITS[0]).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { loomParsers } from './build.ts'

const encode = (reply: unknown) => JSON.stringify(reply, (_k, v) => (v instanceof Map ? Object.fromEntries(v) : v instanceof Set ? [...v] : v))
const copy = process.argv[2]!
const modules = new Map<string, any>()
const load = async (file: string) => modules.get(file) ?? modules.set(file, await import(join(copy, file))).get(file)

async function handle(family: string, source: string) {
  const entry = loomParsers[family]
  if (!entry) return { unsupported: 'Loom has no ' + family + ' parser' }
  try {
    const [file, fn] = entry
    const module = await load(join('diagrams', file)), { LIMITS, stripControls } = await load('labels.ts')
    const text = stripControls(source)
    const value = fn === 'parseGraph' ? module[fn](text, false) : ['parseMindmap', 'parseTimeline', 'parseGitGraph'].includes(fn) ? module[fn](text, LIMITS[0]) : module[fn](text)
    return value === null ? { unsupported: 'Loom did not recognize this source as ' + family } : { value }
  } catch (error) {
    return { adapterGap: 'Loom parser threw: ' + String(error) }
  }
}

// One request on stdin, or with TRIDENT_BRIDGE_SERVE=1 one per line (see ../common.mjs).
if (process.env.TRIDENT_BRIDGE_SERVE !== '1') {
  const { family, source } = JSON.parse(readFileSync(0, 'utf8'))
  process.stdout.write(encode(await handle(family, source)) + '\n')
} else
  for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    if (!line.trim()) continue
    const { family, source, requestId } = JSON.parse(line)
    process.stdout.write('\u0001TRIDENT\u0001' + encode({ ...await handle(family, source), requestId }) + '\n')
  }
