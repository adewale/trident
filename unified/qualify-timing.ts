import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { timingFromRetainedBundle } from '../portable/qualified-timing.ts'
import { readCheckpointEntries } from '../portable/checkpoint.ts'
import { admitInvocationEvidence, evidenceBytesDigest, type InvocationEvidence } from '../portable/evidence-contract.ts'

/** Offline reduction; collection and correctness observers own these inputs.
 * This command runs no renderer, substitutes no source and invents no clock. */
export function qualifyRetainedTiming(file: string) {
  const root = dirname(resolve(file)), bundle = JSON.parse(readFileSync(file, 'utf8'))
  return qualifyRetainedTimingBundle(bundle, root)
}
export function qualifyRetainedTimingBundle(bundle: any, root: string) {
  if (!bundle?.plan || !Array.isArray(bundle.samples)) throw Error('Timing bundle requires its frozen plan and every raw sample')
  if (typeof bundle.journalDirectory !== 'string') throw Error('Timing bundle requires its owning exhaustive raw journal')
  const journalDirectory = realpathSync(resolve(root, bundle.journalDirectory)), journalPath = relative(realpathSync(root), journalDirectory)
  if (isAbsolute(journalPath) || journalPath === '..' || journalPath.startsWith('../')) throw Error('Timing journal is outside the owning bundle')
  const frames = readCheckpointEntries<InvocationEvidence>(journalDirectory, { schema: 'trident-invocation-journal-v1' }).map(([_key, value]) => admitInvocationEvidence(value))
  const readOwned = (output: NonNullable<InvocationEvidence['output']>) => {
    const path = resolve(root, output.path), owned = relative(root, path)
    const actual = relative(realpathSync(root), realpathSync(path))
    if (isAbsolute(owned) || owned === '..' || owned.startsWith('../') || isAbsolute(actual) || actual === '..' || actual.startsWith('../')) throw Error('Timing output is outside the owning bundle')
    return readFileSync(path)
  }
  // Validate every raw reference before any selected-sample reduction. Extra
  // failures/streams cannot hide behind a successful sample list.
  for (const frame of frames) for (const output of [frame.output, frame.streams?.stdout, frame.streams?.stderr]) if (output) {
    const bytes = readOwned(output)
    if (bytes.byteLength !== output.bytes || evidenceBytesDigest(bytes) !== output.sha256) throw Error('Raw timing journal output bytes changed')
  }
  return timingFromRetainedBundle(bundle, readOwned, frames)
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
