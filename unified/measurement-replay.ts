import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'

function physical(path: string): string {
  const absolute = resolve(path)
  if (existsSync(absolute)) return realpathSync(absolute)
  return join(physical(dirname(absolute)), absolute.slice(dirname(absolute).length + 1))
}
export function freshOutputOutside(source: string, output: string) {
  if (existsSync(output)) throw Error('Choose a fresh replay/report output directory')
  const within = relative(realpathSync(source), physical(output))
  if (!isAbsolute(within) && within !== '..' && !within.startsWith('../')) throw Error('Replay/report output must be outside input evidence')
}
export const REPLAY_HELP = `measurements:replay --kind docs|terminal|behaviour|timing --campaign DIRECTORY --out FRESH_DIRECTORY
  docs: [--formats svg,png] [--png-reviews FILE] [--png-raster-profile FILE] [--executable CHROMIUM]
Regrades actual retained outputs using the existing source-bound observers. Preserves original evidence and writes a new replay receipt. No acquisition, renderer calls, reference-parser calls or implicit retries. Unqualified timing remains unqualified. Observer-control qualification is separate.`
export async function replayMeasurements(options: { kind: string; campaign: string; out: string; formats?: ('svg' | 'png')[]; pngReviews?: string; pngRasterProfile?: string; executable?: string }) {
  const source = realpathSync(options.campaign), out = resolve(options.out)
  if (!['docs', 'terminal', 'behaviour', 'timing'].includes(options.kind)) throw Error(REPLAY_HELP)
  if (options.kind !== 'docs' && [options.formats, options.pngReviews, options.pngRasterProfile, options.executable].some(value => value !== undefined)) throw Error('SVG/PNG observer options apply only to docs replay')
  freshOutputOutside(source, out)
  const timingFile = options.kind === 'timing' ? (await import('./native-timing-report.ts')).nativeTimingFile(source) : undefined
  if (options.kind === 'timing' && !timingFile) throw Error('No unambiguous native timing capture found')
  const sourceFile = join(source, options.kind === 'terminal' ? 'raw.json' : timingFile ?? 'report.json')
  const owned = relative(source, realpathSync(sourceFile))
  if (isAbsolute(owned) || owned === '..' || owned.startsWith('../')) throw Error('Replay input escapes its owning directory')
  const sourceSha256 = evidenceBytesDigest(readFileSync(sourceFile))
  let qualification: unknown
  if (options.kind === 'docs') {
    const { recheckRendering } = await import('./recheck-rendering.ts')
    qualification = await recheckRendering(source, out, options.pngReviews, options.executable, options.pngRasterProfile, options.formats)
  } else if (options.kind === 'terminal') {
    const { runTerminalProfile } = await import('./terminal-profile.ts')
    await runTerminalProfile(['--saved-terminal', source, '--out', out])
  } else if (options.kind === 'behaviour') {
    const report = JSON.parse(readFileSync(sourceFile, 'utf8'))
    const { ownedBehaviourFile, replayMermaidBehaviours } = await import('./mermaid-behaviour.ts')
    if (report.captureMode === 'retained-upstream-public-calls') {
      qualification = replayMermaidBehaviours({ evidence: ownedBehaviourFile(source, report.parent.directory), out, projects: report.targets.map((target: any) => target.project) })
    } else if (['native-stdio', 'retained-native-stdio'].includes(report.captureMode)) {
      const { runNativeBehaviours } = await import('./mermaid-behaviour-capture.ts')
      qualification = runNativeBehaviours({ capture: ownedBehaviourFile(source, report.capture.directory), reference: ownedBehaviourFile(source, report.referenceEvidence.directory), out })
    } else throw Error('Unknown retained behaviour capture; no collection fallback is allowed')
  } else {
    const { readNativeTiming } = await import('./native-timing-report.ts')
    const result = readNativeTiming(source)
    if (!result || result.file !== timingFile) throw Error('Native timing capture changed during replay')
    qualification = { qualified: result.qualified, status: result.status, gaps: result.gaps, scope: result.scope, rows: result.rows }
    mkdirSync(out, { recursive: true })
    writeFileSync(join(out, 'timing-qualification.json'), JSON.stringify(qualification, null, 2) + '\n', { flag: 'wx' })
  }
  if (evidenceBytesDigest(readFileSync(sourceFile)) !== sourceSha256) throw Error('Replay input changed during grading; no completion receipt was written')
  const receipt = { schema: 'trident-measurement-replay-v1', kind: options.kind, source, sourceFile: relative(source, sourceFile), sourceSha256, rendererInvocations: 0,
    limits: 'Fresh grading keeps original call clocks and artifacts. Successful replay is not full observer or workload qualification; inspect the new outcome ledger and property controls.', ...(qualification ? { qualification } : {}) }
  writeFileSync(join(out, 'measurement-replay.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' })
  return receipt
}
export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--help') { console.log(REPLAY_HELP); return }
  const options = new Map<string, string>()
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]!, value = argv[i + 1]
    if (!['--kind', '--campaign', '--out', '--formats', '--png-reviews', '--png-raster-profile', '--executable'].includes(key) || !value || value.startsWith('--') || options.has(key)) throw Error(REPLAY_HELP)
    options.set(key, value)
  }
  if (!options.has('--kind') || !options.has('--campaign') || !options.has('--out')) throw Error(REPLAY_HELP)
  const receipt = await replayMeasurements({ kind: options.get('--kind')!, campaign: options.get('--campaign')!, out: options.get('--out')!, formats: options.has('--formats') ? options.get('--formats')!.split(',') as ('svg' | 'png')[] : undefined, pngReviews: options.get('--png-reviews'), pngRasterProfile: options.get('--png-raster-profile'), executable: options.get('--executable') })
  console.log(JSON.stringify({ out: resolve(options.get('--out')!), kind: receipt.kind, rendererInvocations: receipt.rendererInvocations }))
}
if (import.meta.main) await main()
