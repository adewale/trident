import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'
import { timingFromRetainedBundle } from '../portable/qualified-timing.ts'
import { readCheckpointEntries } from '../portable/checkpoint.ts'
import { admitInvocationEvidence, evidenceBytesDigest, evidenceDigest, type InvocationEvidence } from '../portable/evidence-contract.ts'
import { qualifiedTimingCoordinates } from '../portable/qualified-timing-collection.ts'

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
    let path = resolve(root, output.path)
    const owned = relative(root, path)
    if (isAbsolute(owned) || owned === '..' || owned.startsWith('../')) {
      // Raw frames remain immutable when a complete bundle is copied. Resolve
      // only the journal's original content-addressed output convention into
      // this bundle; never read the former machine's absolute path.
      if (basename(path) !== output.sha256 || basename(dirname(path)) !== 'outputs') throw Error('Timing output is outside the owning bundle')
      path = resolve(journalDirectory, 'outputs', output.sha256)
    }
    const actual = relative(realpathSync(root), realpathSync(path))
    if (isAbsolute(actual) || actual === '..' || actual.startsWith('../')) throw Error('Timing output is outside the owning bundle')
    return readFileSync(path)
  }
  // Validate every raw reference before any selected-sample reduction. Extra
  // failures/streams cannot hide behind a successful sample list.
  for (const frame of frames) for (const output of [frame.output, frame.streams?.stdout, frame.streams?.stderr]) if (output) {
    const bytes = readOwned(output)
    if (bytes.byteLength !== output.bytes || evidenceBytesDigest(bytes) !== output.sha256) throw Error('Raw timing journal output bytes changed')
  }
  let driverFinalization: unknown, driverFinalizationSha256: string | undefined
  if (bundle.plan.driverFinalization) {
    const file = resolve(root, 'driver-finalization.json')
    if (existsSync(file)) {
      const owned = relative(realpathSync(root), realpathSync(file))
      if (isAbsolute(owned) || owned === '..' || owned.startsWith('../')) throw Error('Timing driver finalization is outside the owning bundle')
      const bytes = readFileSync(file)
      driverFinalization = JSON.parse(bytes.toString()); driverFinalizationSha256 = evidenceBytesDigest(bytes)
    }
  }
  const result = timingFromRetainedBundle(bundle, readOwned, frames, driverFinalization)!
  if (!bundle.captureProtocol || typeof bundle.collectionDirectory !== 'string') return { ...result, status: 'unqualified' as const, medianMs: null, perRoundMs: null, gaps: [...result.gaps, 'Owned capture protocol and collection lifecycle receipts are required'] }
  const collectionDirectory = realpathSync(resolve(root, bundle.collectionDirectory)), ownedCollection = relative(realpathSync(root), collectionDirectory)
  if (isAbsolute(ownedCollection) || ownedCollection === '..' || ownedCollection.startsWith('../')) throw Error('Timing collection receipts are outside the owning bundle')
  const units = new Map(readCheckpointEntries<any>(collectionDirectory, { schema: 'trident-qualified-timing-collection-v1', planSha256: result.planSha256, captureProtocol: bundle.captureProtocol }))
  const complete = units.get('raw-complete'), errors = units.get('capture-errors'), schedule = qualifiedTimingCoordinates(bundle.plan)
  const gaps = [...result.gaps]
  if (!complete || complete.planned !== result.planned || complete.attempts !== result.planned) gaps.push('Raw timing capture did not complete its full fixed schedule')
  if (!Array.isArray(errors)) gaps.push('Capture and cleanup outcomes were not retained')
  else if (errors.length) gaps.push(...errors.map(error => 'Capture ' + String(error.phase) + ': ' + String(error.detail)))
  if (bundle.captureProtocol.name !== 'fresh-instance-per-call-six-orders-v1' || bundle.captureProtocol.coordinateScheduleSha256 !== evidenceDigest(schedule)) gaps.push('Capture schedule differs from the declared balanced first-use protocol')
  const captured = frames.filter(frame => frame.state === 'started')
  for (const frame of captured) {
    const clock = frame.measurement, coordinate = clock && schedule[clock.sequence]
    if (!clock || clock.captureProtocolSha256 !== evidenceDigest(bundle.captureProtocol) || clock.clockDomainId !== complete?.clockDomainId || !coordinate || frame.identity.coordinate !== JSON.stringify([result.planSha256, coordinate.round, coordinate.replica, coordinate.caseId, coordinate.sample])) gaps.push('Raw calls differ from the captured protocol, controller or predeclared order')
  }
  const qualified = { ...result, ...(driverFinalizationSha256 ? { driverFinalizationSha256 } : {}) }
  return gaps.length ? { ...qualified, status: 'unqualified' as const, medianMs: null, perRoundMs: null, gaps: [...new Set(gaps)] } : qualified
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
