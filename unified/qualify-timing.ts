import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { timingFromRetainedBundle } from '../portable/qualified-timing.ts'

/** Offline reduction; collection and correctness observers own these inputs.
 * This command runs no renderer, substitutes no source and invents no clock. */
export function qualifyRetainedTiming(file: string) {
  const root = dirname(resolve(file)), bundle = JSON.parse(readFileSync(file, 'utf8'))
  if (!bundle?.plan || !Array.isArray(bundle.samples)) throw Error('Timing bundle requires its frozen plan and every raw sample')
  return timingFromRetainedBundle(bundle, output => {
    const path = resolve(root, output.path), owned = relative(root, path)
    if (isAbsolute(owned) || owned === '..' || owned.startsWith('../')) throw Error('Timing output is outside the owning bundle')
    return readFileSync(path)
  })
}
if (import.meta.main) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') console.log('timing:qualify --bundle FILE --out FRESH_FILE\nOffline per-call correctness and A/A timing qualification. Requires original invocation receipts, complete checked outputs and a frozen matched plan. No renderer or Codex required.')
  else {
    if (args.length !== 4 || args[0] !== '--bundle' || args[2] !== '--out') throw Error('Use timing:qualify --help')
    const result = qualifyRetainedTiming(resolve(args[1]!))
    writeFileSync(resolve(args[3]!), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
    if (result?.status !== 'qualified') process.exitCode = 2
  }
}
