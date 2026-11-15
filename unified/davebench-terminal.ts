import { executionEnvironment } from './execution-environment.ts'
import { comparisonProjects } from './lineage.ts'
import { campaignPlan, assertTimingCollection } from './campaign-plan.ts'
import { atomicWrite, reserveResultDirectory, timingSession } from './result-storage.ts'
import { davebenchFamily, davebenchInputs, davebenchReferenceRejected } from './davebench-inputs.ts'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { CommunityArtifact, PreparedCommunity } from './community-types.ts'
import { communityCliRequest } from './community-cli-request.ts'
import { davebenchAdmissionProfile, davebenchAdmission, davebenchRankings, recordOutcome, type DavebenchRun } from './davebench-model.ts'
import { watchMemory } from './process-memory.ts'
import { killCommunityProcess, spawnCommunityProcess } from './community-process.ts'
import { davebenchEmptyOutputCorpus, davebenchEmptyOutputRule, davebenchTerminalValidity } from './davebench-validity.ts'
import { tridentDirectory } from './trident-paths.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { communityDeclaresOutput, communityModuleOutputSupported } from './community.ts'
import { plannedBenchmarkVersion, verifiedBenchmarkBinding, refreshBenchmarkVersions } from './benchmark-versions.ts'
import { communityCatalogFile } from './trident-paths.ts'

import { TerminalCallWorker } from './terminal-call-worker.ts'
export { TerminalCallWorker } from './terminal-call-worker.ts'

/** Fresh terminal CLI process. Text goes to a regular scratch file and is read
 * for admission after the clock stops, then deleted. Measurement passes no onOutput. */
export async function terminalCliCall(artifact: CommunityArtifact, source: string, directory: string, timeoutMs: number, onOutput?: (text: string) => void) {
  const request = communityCliRequest(artifact, 'terminal', directory)
  if (request.inputMode === 'file') writeFileSync(request.input, source)
  const destination = join(directory, 'davebench-output.txt'), captured = join(directory, 'davebench-stdout.txt')
  rmSync(destination, { force: true })
  const args = request.args.map(arg => arg.replaceAll(request.destination, destination)), stdout = openSync(captured, 'w'), started = performance.now()
  let stderr = ''
  const result = await new Promise<{ outcome: string; ms: number; error?: string }>(done => {
    let timeout = false, finished = false
    const child = spawnCommunityProcess(artifact.executable!, args, { detached: process.platform !== 'win32', stdio: ['pipe', stdout, 'pipe'] })
    child.stderr!.on('data', chunk => { if (stderr.length < 4096) stderr += String(chunk) })
    const timer = setTimeout(() => { timeout = true; killCommunityProcess(child, 'SIGKILL') }, timeoutMs)
    let memory = false
    const unwatch = watchMemory(child.pid, () => { memory = true; killCommunityProcess(child, 'SIGKILL') })
    const finish = (outcome: string, error?: string) => { if (finished) return; finished = true; clearTimeout(timer); unwatch(); done({ outcome: memory ? 'error' : outcome, ms: performance.now() - started, ...(memory ? { error: 'memory limit' } : error ? { error } : {}) }) }
    child.once('error', thrown => finish('error', String(thrown.message).slice(0, 160))); child.once('close', code => finish(timeout ? 'timeout' : code === 0 ? 'completed' : 'error', code === 0 || timeout ? undefined : (stderr.trim().split('\n').at(-1) || 'exit code ' + code).slice(0, 160)))
    child.stdin!.on('error', () => {}); child.stdin!.end(request.inputMode === 'stdin' ? source : undefined)
  })
  closeSync(stdout)
  try {
    if (result.outcome !== 'completed') return result
    const text = args.some(arg => arg.includes(destination)) && existsSync(destination) ? readFileSync(destination, 'utf8') : readFileSync(captured, 'utf8')
    onOutput?.(text)
    const validity = davebenchTerminalValidity(text, source)
    return validity.valid ? result : { ...result, outcome: 'invalid', invalid: validity.reason }
  } finally { rmSync(destination, { force: true }); rmSync(captured, { force: true }); if (request.inputMode === 'file') rmSync(request.input, { force: true }) }
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('davebench:terminal --prepared FILE --out FRESH_DIRECTORY [--upstream CHECKOUT] [--catalog FROZEN_CAMPAIGN_CATALOG] [--projects IDS]\nThree documentation runs; native text output discarded without assessment. --projects measures only the named projects; times are comparable only within one collection on one machine.'); return }
  assertBenchmarkExecutionAllowed()
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) { if (!['--out', '--prepared', '--upstream', '--catalog', '--projects'].includes(args[i]!) || !args[i + 1] || options.has(args[i]!)) throw Error('Invalid terminal DaveBench arguments'); options.set(args[i]!, args[i + 1]!) }
  if (!options.has('--out') || !options.has('--prepared')) throw Error('Choose --out and a current frozen --prepared artifact list')
  const out = resolve(options.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  reserveResultDirectory(out)
  const wanted = options.get('--projects')?.split(',')
  const all: PreparedCommunity[] = JSON.parse(readFileSync(options.get('--prepared')!, 'utf8'))
  const recorded = JSON.parse(readFileSync(options.get('--catalog') ?? communityCatalogFile, 'utf8'))
  // Only projects whose catalog binding declares terminal output take part, so the full list
  // that prepare writes can be passed unchanged.
  const ids = comparisonProjects(recorded, wanted ?? recorded.nodes.map((node: any) => node.id)).included.filter(id => communityDeclaresOutput(recorded.nodes.find((node: any) => node.id === id), 'terminal'))
  if (wanted) for (const id of wanted) if (!ids.includes(id)) throw Error(id + ' declares no terminal output')
  if (!ids.length) throw Error('No applicable terminal projects selected')
  const selected = options.has('--catalog') ? recorded : (await refreshBenchmarkVersions(recorded, ids)).catalog
  const prepared: PreparedCommunity[] = ids.map(id => {
    const node = selected.nodes.find((node: any) => node.id === id)
    if (!node || node.benchmark?.preparationError) throw Error('Current terminal artifact selection is incomplete: ' + id)
    const supplied = all.filter(peer => peer.node.id === id)
    if (supplied.length > 1) throw Error('Duplicate prepared terminal artifact: ' + id)
    if (!supplied.length) return { node, error: 'No prepared terminal artifact supplied' }
    const peer = supplied[0]!
    if (peer.artifact) peer.artifact = verifiedBenchmarkBinding(peer, node)
    return { ...peer, node }
  })
  const inventory = davebenchInputs(resolve(options.get('--upstream') ?? join(tridentDirectory, '../mermaid'))), runs: DavebenchRun[] = [], blocked: { project: string; reason: string }[] = []
  const plan = campaignPlan(prepared.map(peer => ({ project: peer.node.id, version: plannedBenchmarkVersion(peer.node, peer.artifact?.kind === 'cli' ? peer.artifact : !communityModuleOutputSupported(peer.node, 'terminal') ? peer.artifact?.additionalCli?.find(cli => cli.outputs.includes('terminal'))?.artifact ?? peer.artifact : peer.artifact), format: 'terminal' })), inventory.cases.map(input => input.id), 3, { commit: inventory.commit, sources: inventory.cases, admission: davebenchAdmission, admissionProfile: davebenchAdmissionProfile }, wanted ? 'subset' : 'full')
  const workerIdentities: any[] = [], emptyCorpus = davebenchEmptyOutputCorpus(inventory.cases, inventory.cases.map(input => davebenchEmptyOutputRule(input.source)))
  const startedAt = new Date().toISOString(), timeoutMs = 15_000, referenceRejected = await davebenchReferenceRejected(inventory.cases)
  const save = (state: string) => {
    const report = { schema: 'davebench-terminal-v2', state, plan, environment: executionEnvironment(), workerIdentities, startedAt, updatedAt: new Date().toISOString(), corpus: { commit: inventory.commit, occurrences: inventory.cases.length, files: inventory.files, families: inventory.cases.map(input => davebenchFamily(input.source)), ...emptyCorpus, referenceRejected }, method: { runs: 3, warmupsPerRun: 30, timeoutMs, outputsRetained: false, outputsAssessed: false, admission: davebenchAdmission, admissionProfile: davebenchAdmissionProfile, elapsed: 'Sum of awaited public render calls including failures; initialization, warm-ups, IPC and reporting excluded. Native CLI includes per-call process startup.', failures: 'Each run lists its failed inputs by reason as ranges of plan.cases positions (failures); completed inputs are implied.' }, runs, rankings: davebenchRankings(runs, inventory.cases.length), blocked }
    if (state === 'complete') assertTimingCollection(report)
    atomicWrite(join(out, 'results.json'), JSON.stringify(report, null, 2) + '\n')
  }
  using measurement = timingSession()
  save('running')
  for (const peer of prepared) {
    const a = peer.artifact, extra = a?.additionalCli?.find(cli => cli.outputs.includes('terminal'))?.artifact
    const native = a?.kind === 'cli' ? a : !communityModuleOutputSupported(peer.node, 'terminal') ? extra : undefined
    if (!a) { blocked.push({ project: peer.node.id, reason: peer.error ?? 'No prepared terminal artifact' }); save('running'); continue }
    let boundary = native ? 'public CLI terminal; process startup included' : a.kind === 'python' ? 'persistent Python public terminal API' : /bun/i.test(a.runtime ?? '') || /\.tsx?$/.test(a.module ?? '') ? 'persistent Bun public terminal API' : 'persistent Node public terminal API'
    const directory = join(out, encodeURIComponent(peer.node.id)); mkdirSync(directory, { recursive: true })
    let worker: TerminalCallWorker | undefined
    const open = async () => { worker = new TerminalCallWorker(peer, join(directory, 'operand.json'), undefined, davebenchTerminalValidity); await worker.ready; workerIdentities.push(worker.identity); if (worker.identity?.boundary) boundary = worker.identity.boundary }
    try {
      for (let round = 1; round <= 3; round++) {
        if (!native) await open()
        const call = async (input: { source: string }, index: number): Promise<import('./terminal-call-worker.ts').TimedCall> => {
          const row = native ? await terminalCliCall(native, input.source, directory, timeoutMs) : await worker!.call(input.source, `${round}:${index}`, timeoutMs)
          if ('failureKind' in row && ['protocol', 'transport', 'closed'].includes(String(row.failureKind))) throw Error('Unqualified worker transport: ' + row.error)
          if (row.outcome === 'cleanup-error') throw Error('Terminal host cleanup failed; no further timing from accumulated drawings is admitted')
          if (!native && ('failureKind' in row || row.outcome === 'timeout' || typeof worker!.child.exitCode === 'number' || typeof worker!.child.signalCode === 'string')) { await worker!.close(); await open() }
          return row
        }
        for (const [index, input] of inventory.cases.slice(0, 30).entries()) await call(input, -index - 1)
        const row: DavebenchRun = { project: peer.node.id, version: native?.version ?? a.version, format: 'terminal', run: round, boundary, boundaryKind: native ? 'fresh-process' : 'persistent-api', attempted: 0, completed: 0, failed: 0, timeouts: 0, totalMs: 0, invalid: 0, invalidReasons: {}, errorReasons: {}, failures: {} }; runs.push(row)
        console.log(`${peer.node.id} terminal ${round}/3`)
        for (const [index, input] of inventory.cases.entries()) {
          recordOutcome(row, index, input.id, await call(input, index))
          if ((index + 1) % 100 === 0) save('running')
        }
        await worker?.close(); worker = undefined; save('running')
        console.log(`  ${row.completed}/${row.attempted}, ${(row.totalMs / 1000).toFixed(3)} s`)
      }
    } catch (error) { blocked.push({ project: peer.node.id, reason: String(error).slice(0, 500) }); save('running') }
    finally { await worker?.close() }
  }
  save('complete')
}
if (import.meta.main) await main()
