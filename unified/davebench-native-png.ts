import { atomicWrite, reserveResultDirectory, timingSession } from './result-storage.ts'
import { campaignPlan, assertTimingCollection } from './campaign-plan.ts'
import { executionEnvironment } from './execution-environment.ts'
import { davebenchInputs } from './davebench-inputs.ts'
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { davebenchAdmissionProfile, davebenchAdmission, davebenchRankings, type DavebenchRun } from './davebench-model.ts'
import { TerminalCallWorker } from './terminal-call-worker.ts'
import { tridentDirectory } from './trident-paths.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'

/** Verify the complete portable bundle and its native smoke receipt before clocks start. */
export function verifiedNativeBundle(bundle: string) {
  const script = 'import json,sys; from pathlib import Path; sys.path.insert(0,sys.argv[1]); from bundle import verify; print(json.dumps(verify(Path(sys.argv[2]).resolve())))'
  return JSON.parse(execFileSync('python3', ['-c', script, join(tridentDirectory, 'native-flutter'), bundle], { encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024 }))
}

/** Native Flutter's advertised PNG API; the native worker discards bytes. */
export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('davebench:native-png (--image sha256:IMAGE_ID | --host-display) --bundle NATIVE_BUNDLE --out FRESH_DIRECTORY\nRuns a prepared native release counter in the managed Docker daemon, or with --host-display under a private Xvfb display on this machine; stores counts and times only.'); return }
  assertBenchmarkExecutionAllowed()
  const options = new Map<string, string>()
  const host = args.includes('--host-display')
  if (host) args = args.filter(arg => arg !== '--host-display')
  for (let i = 0; i < args.length; i += 2) { if (!['--image', '--bundle', '--out'].includes(args[i]!) || !args[i + 1] || options.has(args[i]!)) throw Error('Invalid native PNG DaveBench arguments'); options.set(args[i]!, args[i + 1]!) }
  if (host === options.has('--image') || !options.has('--bundle') || !options.has('--out')) throw Error('Choose --image or --host-display, a bundle and a fresh output directory')
  const image = host ? 'host' : options.get('--image')!, bundle = realpathSync(options.get('--bundle')!), out = resolve(options.get('--out')!)
  if (!host && !/^sha256:[a-f0-9]{64}$/.test(image)) throw Error('Use an immutable local Docker image ID')
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  for (const file of ['native_bench', 'lib/libapp.so']) if (!existsSync(join(bundle, file))) throw Error('Missing native release bundle file: ' + file)
  const nativeBuild = verifiedNativeBundle(bundle), lock = join(tridentDirectory, 'native-flutter/app/pubspec.lock')
  reserveResultDirectory(out)
  const inventory = davebenchInputs(join(tridentDirectory, '../mermaid')), runs: DavebenchRun[] = [], startedAt = new Date().toISOString(), timeoutMs = 15_000
  const digest = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
  const artifact = { image, nativeBuild, rendering: { softwareRequested: true, backend: 'x11', display: 'private Xvfb, 1280x720x24' }, hostLibraries: host ? execFileSync('ldd', [join(bundle, 'native_bench')], { encoding: 'utf8', timeout: 10_000 }).replace(/\s+\(0x[0-9a-f]+\)/gi, '') : undefined, smokeReceiptSha256: digest(join(bundle, 'trident-smoke.json')), executableSha256: digest(join(bundle, 'native_bench')), applicationSha256: digest(join(bundle, 'lib/libapp.so')), counterSourceSha256: digest(join(tridentDirectory, 'native-flutter/app/lib/davebench_worker.dart')), packageLockSha256: digest(lock), nativePackage: 'mermaid_flutter', version: '0.3.2' }
  const plan = campaignPlan([{ project: 'pub:mermaid_flutter', version: artifact.version, format: 'png' }], inventory.cases.map(input => input.id), 3, { artifact, sources: inventory.cases, admission: davebenchAdmission, admissionProfile: davebenchAdmissionProfile }, 'subset')
  const workerIdentities: any[] = []
  const save = (state: string) => {
    const report = { schema: 'davebench-native-png-v2', state, plan, environment: executionEnvironment(), workerIdentities, startedAt, updatedAt: new Date().toISOString(), corpus: { commit: inventory.commit, occurrences: inventory.cases.length, files: inventory.files }, artifact, method: { runs: 3, warmupsPerRun: 30, timeoutMs, outputsRetained: false, outputsAssessed: false, boundary: host ? 'Native Linux Flutter renderToPng(source,pixelRatio:1); Stopwatch inside release app on the host under a private Xvfb display. App startup, warm-ups, IPC, admission and reporting excluded.' : 'Native Linux Flutter renderToPng(source,pixelRatio:1); Stopwatch inside release app. Container/app startup, warm-ups, IPC, admission and reporting excluded. Runtime network disabled.', admission: davebenchAdmission, admissionProfile: davebenchAdmissionProfile }, runs, rankings: davebenchRankings(runs, inventory.cases.length), blocked: [] }
    if (state === 'complete') assertTimingCollection(report)
    atomicWrite(join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n')
  }
  const dockerEnv = { ...process.env }
  for (const name of ['DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH']) delete dockerEnv[name]
  const prefix = ['env', '-u', 'DOCKER_HOST', '-u', 'DOCKER_CONTEXT', '-u', 'DOCKER_TLS', '-u', 'DOCKER_TLS_VERIFY', '-u', 'DOCKER_CERT_PATH', 'docker', '--host=unix:///var/run/docker.sock']
  let worker: TerminalCallWorker | undefined, container = ''
  const close = async () => {
    await worker?.close(); worker = undefined
    if (container) { try { execFileSync('docker', ['--host=unix:///var/run/docker.sock', 'rm', '-f', container], { env: dockerEnv, stdio: 'ignore', timeout: 15_000 }) } catch {} }
    container = ''
  }
  const open = async () => {
    container = 'trident-davebench-' + randomUUID()
    if (host) container = ''
    const invocation = host ? ['env', 'LIBGL_ALWAYS_SOFTWARE=1', 'GDK_BACKEND=x11', 'xvfb-run', '-a', '-s', '-screen 0 1280x720x24', join(bundle, 'native_bench')] : [...prefix, 'run', '--rm', '-i', '--name', container, '--network', 'none', '--mount', `type=bind,src=${bundle},dst=/app,readonly`, '-e', 'LIBGL_ALWAYS_SOFTWARE=1', '-e', 'GDK_BACKEND=x11', '-w', '/app', image, 'xvfb-run', '-a', '-s', '-screen 0 1280x720x24', './native_bench']
    const peer: any = { node: { id: 'pub:mermaid_flutter', benchmark: { adapter: 'native-flutter' } }, artifact: { kind: 'jsonl-worker', version: artifact.version, root: bundle, executable: join(bundle, 'native_bench'), runtime: host ? 'native Linux Flutter release on host Xvfb' : 'native Linux Flutter release in pinned SDK image' } }
    worker = new TerminalCallWorker(peer, join(out, 'operand.json'), invocation)
    await worker.ready
    workerIdentities.push(worker.identity)
    if (worker.identity?.package !== artifact.nativePackage || worker.identity?.version !== artifact.version || worker.identity?.mode !== 'release' || worker.identity?.runtime?.platform !== 'linux' || worker.identity?.runtime?.dart?.split(' ')[0] !== nativeBuild.sdk.dartSdkVersion.split(' ')[0]) throw Error('Native worker identity differs from the pinned release')
  }
  using measurement = timingSession()
  save('running')
  try {
    for (let round = 1; round <= 3; round++) {
      await open()
      const call = async (source: string, index: number) => {
        const value = await worker!.call(source, `${round}:${index}`, timeoutMs)
        if (value.failureKind && ['protocol', 'transport', 'closed'].includes(value.failureKind)) throw Error('Unqualified native worker transport: ' + value.error)
        if (value.failureKind || value.outcome === 'timeout' || typeof worker!.child.exitCode === 'number' || typeof worker!.child.signalCode === 'string') { await close(); await open() }
        return value
      }
      for (const [index, input] of inventory.cases.slice(0, 30).entries()) await call(input.source, -index - 1)
      const row: DavebenchRun = { project: 'pub:mermaid_flutter', version: artifact.version, format: 'png', run: round, boundaryKind: 'persistent-api', boundary: 'native Flutter renderToPng API; ' + (host ? 'app' : 'container/app') + ' startup excluded', attempted: 0, completed: 0, failed: 0, timeouts: 0, totalMs: 0, invalid: 0, invalidReasons: {} }; runs.push(row)
      console.log(`pub:mermaid_flutter png ${round}/3`)
      for (const [index, input] of inventory.cases.entries()) {
        const value = await call(input.source, index); row.attempted++; if (value.ms === null) row.untimedCalls = (row.untimedCalls ?? 0) + 1; else row.totalMs += value.ms
        if (value.outcome === 'completed') row.completed++; else row.failed++
        if (value.outcome === 'invalid') { row.invalid!++; const reason = value.invalid ?? 'invalid'; row.invalidReasons![reason] = (row.invalidReasons![reason] ?? 0) + 1; (row.rejected ??= {})[input.id] = reason }
        if (value.outcome === 'timeout') row.timeouts++
        if ((index + 1) % 100 === 0) save('running')
      }
      await close(); save('running'); console.log(`  ${row.completed}/${row.attempted}, ${(row.totalMs / 1000).toFixed(3)} s`)
    }
    save('complete')
  } finally { await close() }
}
if (import.meta.main) await main()
