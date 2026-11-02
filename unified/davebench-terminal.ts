import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { CommunityArtifact, PreparedCommunity } from './community-types.ts'
import { communityCliRequest } from './community-cli-request.ts'
import { davebenchInputs, davebenchRankings, type DavebenchRun } from './davebench.ts'
import { tridentDirectory } from './trident-paths.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { communityModuleOutputSupported } from './community.ts'
import { assertCurrentBenchmarkArtifact, refreshBenchmarkVersions } from './benchmark-versions.ts'
import { communityCatalogFile } from './trident-paths.ts'

export class TerminalCallWorker {
  child: Bun.Subprocess<'pipe', 'pipe', 'pipe'>
  pending = new Map<string, (value: any) => void>()
  ready: Promise<void>
  identity: any
  constructor(peer: PreparedCommunity, file: string, invocation?: string[]) {
    writeFileSync(file, JSON.stringify(peer))
    const python = peer.artifact?.kind === 'python'
    const bun = /bun/i.test(peer.artifact?.runtime ?? '') || /\.tsx?$/.test(peer.artifact?.module ?? '')
    const command = python ? peer.artifact!.python ?? peer.artifact!.executable! : bun ? process.execPath : process.env.NODE_BIN ?? 'node'
    const args = python ? [join(tridentDirectory, 'unified/davebench-terminal-worker.py')] : [join(tridentDirectory, 'unified/davebench-terminal-worker.mjs'), file]
    this.child = Bun.spawn(invocation ?? [command, ...args], { stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' })
    void this.child.stderr.pipeTo(new WritableStream({ write() {} })).catch(() => {})
    let buffer = '', ready = false
    this.ready = new Promise((done, reject) => {
      const timeout = setTimeout(() => { this.close(); reject(Error('Terminal worker initialization timed out')) }, 30_000)
      void (async () => {
        const decoder = new TextDecoder(), reader = this.child.stdout.getReader()
        try {
          for (;;) {
            const chunk = await reader.read()
            if (chunk.done) break
            buffer += decoder.decode(chunk.value, { stream: true })
            let end
            while ((end = buffer.indexOf('\n')) >= 0) {
              const line = buffer.slice(0, end); buffer = buffer.slice(end + 1)
              try {
                const row = JSON.parse(line)
                if (row.type === 'ready') { this.identity = row; ready = true; clearTimeout(timeout); done() }
                else if (row.type === 'blocked') { clearTimeout(timeout); reject(Error(row.detail)) }
                else if (row.type === 'result') { this.pending.get(row.id)?.(row); this.pending.delete(row.id) }
              } catch { /* Library logs supply no outcome. */ }
            }
          }
        } catch (error) { if (!ready) reject(error) }
      })()
      void this.child.exited.then(() => { clearTimeout(timeout); if (!ready) reject(Error('Terminal worker stopped during initialization')); for (const done of this.pending.values()) done({ outcome: 'error', ms: 0 }); this.pending.clear() })
    })
  }
  async call(source: string, id: string, timeoutMs: number): Promise<{ outcome: string; ms: number }> {
    await this.ready
    if (typeof this.child.exitCode === 'number' || typeof this.child.signalCode === 'string') throw Error('Terminal worker has stopped')
    const started = performance.now()
    return new Promise(done => {
      const timer = setTimeout(() => { this.pending.delete(id); this.close(); done({ outcome: 'timeout', ms: performance.now() - started }) }, timeoutMs)
      this.pending.set(id, value => { clearTimeout(timer); done({ outcome: value.outcome, ms: value.outcome === 'error' && value.ms === 0 ? performance.now() - started : value.ms }) })
      this.child.stdin.write(JSON.stringify({ source, id }) + '\n')
      void this.child.stdin.flush()
    })
  }
  close() { this.child.kill('SIGKILL'); return this.child.exited }
}

export async function terminalCliCall(artifact: CommunityArtifact, source: string, directory: string, timeoutMs: number) {
  const request = communityCliRequest(artifact, 'terminal', directory)
  if (request.inputMode === 'file') writeFileSync(request.input, source)
  const args = request.args.map(arg => arg.replaceAll(request.destination, '/dev/null')), started = performance.now()
  return new Promise<{ outcome: string; ms: number }>(done => {
    let timeout = false, finished = false
    const child = spawn(artifact.executable!, args, { stdio: ['pipe', 'ignore', 'ignore'] })
    const timer = setTimeout(() => { timeout = true; child.kill('SIGKILL') }, timeoutMs)
    const finish = (outcome: string) => { if (finished) return; finished = true; clearTimeout(timer); done({ outcome, ms: performance.now() - started }) }
    child.once('error', () => finish('error')); child.once('exit', code => finish(timeout ? 'timeout' : code === 0 ? 'completed' : 'error'))
    child.stdin.on('error', () => {}); child.stdin.end(request.inputMode === 'stdin' ? source : undefined)
  })
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log('davebench:terminal --prepared FILE --out FRESH_DIRECTORY [--upstream CHECKOUT] [--catalog FROZEN_CAMPAIGN_CATALOG]\nThree documentation runs; native text output discarded without assessment.'); return }
  assertBenchmarkExecutionAllowed()
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) { if (!['--out', '--prepared', '--upstream', '--catalog'].includes(args[i]!) || !args[i + 1] || options.has(args[i]!)) throw Error('Invalid terminal DaveBench arguments'); options.set(args[i]!, args[i + 1]!) }
  if (!options.has('--out') || !options.has('--prepared')) throw Error('Choose --out and a current frozen --prepared artifact list')
  const out = resolve(options.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  mkdirSync(out, { recursive: true })
  const prepared: PreparedCommunity[] = JSON.parse(readFileSync(options.get('--prepared')!, 'utf8'))
  const recorded = JSON.parse(readFileSync(options.get('--catalog') ?? communityCatalogFile, 'utf8'))
  const selected = options.has('--catalog') ? recorded : (await refreshBenchmarkVersions(recorded, prepared.map(peer => peer.node.id))).catalog
  for (const peer of prepared) {
    const node = selected.nodes.find((node: any) => node.id === peer.node.id)
    if (!node || node.benchmark?.preparationError) throw Error('Current terminal artifact selection is incomplete: ' + peer.node.id)
    assertCurrentBenchmarkArtifact(peer, node); peer.node = node
  }
  const inventory = davebenchInputs(resolve(options.get('--upstream') ?? join(tridentDirectory, '../mermaid'))), runs: DavebenchRun[] = [], blocked: { project: string; reason: string }[] = []
  const startedAt = new Date().toISOString(), timeoutMs = 15_000
  const save = (state: string) => writeFileSync(join(out, 'results.json'), JSON.stringify({ schema: 'davebench-terminal-v1', state, startedAt, updatedAt: new Date().toISOString(), corpus: { commit: inventory.commit, occurrences: inventory.cases.length, files: inventory.files }, method: { runs: 3, warmupsPerRun: 30, timeoutMs, outputsRetained: false, outputsAssessed: false, elapsed: 'Sum of awaited public render calls including failures; initialization, warm-ups, IPC and reporting excluded. Native CLI includes per-call process startup.' }, runs, rankings: davebenchRankings(runs, inventory.cases.length), blocked }, null, 2) + '\n')
  save('running')
  for (const peer of prepared) {
    const a = peer.artifact, extra = a?.additionalCli?.find(cli => cli.outputs.includes('terminal'))?.artifact
    const native = a?.kind === 'cli' ? a : !communityModuleOutputSupported(peer.node, 'terminal') ? extra : undefined
    if (!a) { blocked.push({ project: peer.node.id, reason: peer.error ?? 'No prepared terminal artifact' }); save('running'); continue }
    let boundary = native ? 'public CLI terminal; process startup included' : a.kind === 'python' ? 'persistent Python public terminal API' : /bun/i.test(a.runtime ?? '') || /\.tsx?$/.test(a.module ?? '') ? 'persistent Bun public terminal API' : 'persistent Node public terminal API'
    const directory = join(out, encodeURIComponent(peer.node.id)); mkdirSync(directory, { recursive: true })
    let worker: TerminalCallWorker | undefined
    const open = async () => { worker = new TerminalCallWorker(peer, join(directory, 'operand.json')); await worker.ready; if (worker.identity?.boundary) boundary = worker.identity.boundary }
    try {
      for (let round = 1; round <= 3; round++) {
        if (!native) await open()
        const call = async (input: { source: string }, index: number) => {
          const row = native ? await terminalCliCall(native, input.source, directory, timeoutMs) : await worker!.call(input.source, `${round}:${index}`, timeoutMs)
          if (row.outcome === 'cleanup-error') throw Error('Terminal host cleanup failed; no further timing from accumulated drawings is admitted')
          if (!native && (row.outcome === 'timeout' || typeof worker!.child.exitCode === 'number' || typeof worker!.child.signalCode === 'string')) { await worker!.child.exited; await open() }
          return row
        }
        for (const [index, input] of inventory.cases.slice(0, 30).entries()) await call(input, -index - 1)
        const row: DavebenchRun = { project: peer.node.id, version: native?.version ?? a.version, format: 'terminal', run: round, boundary, attempted: 0, completed: 0, failed: 0, timeouts: 0, totalMs: 0 }; runs.push(row)
        console.log(`${peer.node.id} terminal ${round}/3`)
        for (const [index, input] of inventory.cases.entries()) {
          const result = await call(input, index); row.attempted++; row.totalMs += result.ms
          if (result.outcome === 'completed') row.completed++; else row.failed++
          if (result.outcome === 'timeout') row.timeouts++
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
