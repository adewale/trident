import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { davebenchAdmission, davebenchInputs, davebenchRankings, type DavebenchRun } from './davebench.ts'
import { TerminalCallWorker } from './davebench-terminal.ts'
import { tridentDirectory } from './trident-paths.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { parse as parseYaml } from 'yaml'

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
  const app = resolve(bundle, '../../../../..'), lock = join(app, 'pubspec.lock')
  if (!existsSync(lock) || parseYaml(readFileSync(lock, 'utf8'))?.packages?.mermaid_flutter?.version !== '0.3.2') throw Error('The native counter requires the locked mermaid_flutter 0.3.2 package')
  mkdirSync(out, { recursive: true })
  const inventory = davebenchInputs(join(tridentDirectory, '../mermaid')), runs: DavebenchRun[] = [], startedAt = new Date().toISOString(), timeoutMs = 15_000
  const digest = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
  const artifact = { image, executableSha256: digest(join(bundle, 'native_bench')), applicationSha256: digest(join(bundle, 'lib/libapp.so')), counterSourceSha256: digest(join(tridentDirectory, 'native-flutter/app/lib/davebench_worker.dart')), packageLockSha256: digest(lock), nativePackage: 'mermaid_flutter', version: '0.3.2' }
  if (digest(join(app, 'lib/davebench_worker.dart')) !== artifact.counterSourceSha256) throw Error('Prepared native counter source differs from the current counter')
  const save = (state: string) => writeFileSync(join(out, 'results.json'), JSON.stringify({ schema: 'davebench-native-png-v1', state, startedAt, updatedAt: new Date().toISOString(), corpus: { commit: inventory.commit, occurrences: inventory.cases.length, files: inventory.files }, artifact, method: { runs: 3, warmupsPerRun: 30, timeoutMs, outputsRetained: false, outputsAssessed: false, boundary: host ? 'Native Linux Flutter renderToPng(source,pixelRatio:1); Stopwatch inside release app on the host under a private Xvfb display. App startup, warm-ups, IPC, admission and reporting excluded.' : 'Native Linux Flutter renderToPng(source,pixelRatio:1); Stopwatch inside release app. Container/app startup, warm-ups, IPC, admission and reporting excluded. Runtime network disabled.', admission: davebenchAdmission }, runs, rankings: davebenchRankings(runs, inventory.cases.length), blocked: [] }, null, 2) + '\n')
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
    const invocation = host ? ['env', 'LIBGL_ALWAYS_SOFTWARE=1', 'xvfb-run', '-a', '-s', '-screen 0 1280x720x24', join(bundle, 'native_bench')] : [...prefix, 'run', '--rm', '-i', '--name', container, '--network', 'none', '--mount', `type=bind,src=${bundle},dst=/app,readonly`, '-e', 'LIBGL_ALWAYS_SOFTWARE=1', '-w', '/app', image, 'xvfb-run', '-a', '-s', '-screen 0 1280x720x24', './native_bench']
    const peer: any = { node: { id: 'pub:mermaid_flutter', benchmark: { adapter: 'native-flutter' } }, artifact: { kind: 'jsonl-worker', version: artifact.version, root: bundle, executable: join(bundle, 'native_bench'), runtime: host ? 'native Linux Flutter release on host Xvfb' : 'native Linux Flutter release in pinned SDK image' } }
    worker = new TerminalCallWorker(peer, join(out, 'operand.json'), invocation)
    await worker.ready
    if (worker.identity?.package !== artifact.nativePackage || worker.identity?.version !== artifact.version) throw Error('Native worker identity differs from the locked package')
  }
  save('running')
  try {
    for (let round = 1; round <= 3; round++) {
      await open()
      const call = async (source: string, index: number) => {
        const value = await worker!.call(source, `${round}:${index}`, timeoutMs)
        if (value.outcome === 'timeout' || typeof worker!.child.exitCode === 'number' || typeof worker!.child.signalCode === 'string') { await close(); await open() }
        return value
      }
      for (const [index, input] of inventory.cases.slice(0, 30).entries()) await call(input.source, -index - 1)
      const row: DavebenchRun = { project: 'pub:mermaid_flutter', version: artifact.version, format: 'png', run: round, boundary: 'native Flutter renderToPng API; ' + (host ? 'app' : 'container/app') + ' startup excluded', attempted: 0, completed: 0, failed: 0, timeouts: 0, totalMs: 0, invalid: 0, invalidReasons: {} }; runs.push(row)
      console.log(`pub:mermaid_flutter png ${round}/3`)
      for (const [index, input] of inventory.cases.entries()) {
        const value = await call(input.source, index); row.attempted++; row.totalMs += value.ms
        if (value.outcome === 'completed') row.completed++; else row.failed++
        if (value.outcome === 'invalid') { row.invalid!++; const reason = value.invalid ?? 'invalid'; row.invalidReasons![reason] = (row.invalidReasons![reason] ?? 0) + 1 }
        if (value.outcome === 'timeout') row.timeouts++
        if ((index + 1) % 100 === 0) save('running')
      }
      await close(); save('running'); console.log(`  ${row.completed}/${row.attempted}, ${(row.totalMs / 1000).toFixed(3)} s`)
    }
    save('complete')
  } finally { await close() }
}
if (import.meta.main) await main()
