// Calls Loom's own parser for the requested family, with the arguments its
// render() passes on the first attempt (default direction, LIMITS[0]).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loomParsers } from './build.ts'

const emit = (reply: unknown) => process.stdout.write(JSON.stringify(reply, (_k, v) => (v instanceof Map ? Object.fromEntries(v) : v instanceof Set ? [...v] : v)) + '\n')
const { family, source } = JSON.parse(readFileSync(0, 'utf8'))
const copy = process.argv[2]!
const entry = loomParsers[family]
if (!entry) emit({ unsupported: 'Loom has no ' + family + ' parser' })
else {
  try {
    const [file, fn] = entry
    const module = await import(join(copy, 'diagrams', file)), { LIMITS, stripControls } = await import(join(copy, 'labels.ts'))
    const text = stripControls(source)
    const value = fn === 'parseGraph' ? module[fn](text, false) : ['parseMindmap', 'parseTimeline', 'parseGitGraph'].includes(fn) ? module[fn](text, LIMITS[0]) : module[fn](text)
    emit(value === null ? { unsupported: 'Loom did not recognize this source as ' + family } : { value })
  } catch (error) {
    emit({ adapterGap: 'Loom parser threw: ' + String(error) })
  }
}
