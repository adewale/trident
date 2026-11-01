import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { serveQualifiedTimingProcess } from '../portable/qualified-timing-collection.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { docsArtifactServer, initializeDocsPage } from './docs-runtime.ts'
import { publicDocsPngAction } from './docs-png-browser.ts'

/** One source request per actual fork. Engines start only inside that request.
 * This is a complete export workflow clock, not an isolated renderToPng clock. */
const settings = JSON.parse(readFileSync(process.argv[2]!, 'utf8'))
let browser: Browser | undefined, native: ChildProcess | undefined, server: ReturnType<typeof docsArtifactServer> | undefined
process.once('SIGTERM', () => { void (async () => {
  if (native && native.exitCode === null && native.signalCode === null) { const stopped = once(native, 'close'); native.kill('SIGKILL'); await stopped }
  await browser?.close().catch(() => {})
  server?.closeAllConnections?.(); server?.close()
  writeFileSync(join(settings.directory, 'cleanup.json'), JSON.stringify({ status: !browser?.isConnected() && (!native || native.exitCode !== null || native.signalCode !== null) ? 'passed' : 'failed', nativePid: native?.pid ?? null, nativeExitCode: native?.exitCode ?? null, nativeSignal: native?.signalCode ?? null, browserConnected: browser?.isConnected() ?? false }))
  process.exit(0)
})() })
const pause = () => new Promise<void>(done => setTimeout(done, 5))
serveQualifiedTimingProcess(async source => {
  if (evidenceBytesDigest(source) !== settings.sourceSha256) throw Error('Actual export request differs from the frozen source')
  let bytes: Buffer
  if (settings.kind === 'browser') {
    server = docsArtifactServer(settings.engine.root)
    await new Promise<void>(done => server!.listen(0, '127.0.0.1', done))
    const origin = 'http://127.0.0.1:' + (server.address() as { port: number }).port
    browser = await chromium.launch({ headless: true, executablePath: settings.executable, timeout: 20_000 })
    const context = await browser.newContext(settings.rendering)
    await context.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue()
      return route.abort()
    })
    const page = await context.newPage()
    await initializeDocsPage(page, settings.engine, origin)
    await page.evaluate(async () => { await document.fonts.ready })
    const result = await page.evaluate(publicDocsPngAction, { source, id: 'trident_timed_png' })
    if (result.status !== 'ok' || !Array.isArray(result.png)) throw Error('Actual browser PNG export failed: ' + JSON.stringify(result))
    bytes = Buffer.from(result.png)
    writeFileSync(join(settings.directory, 'public-return.json'), JSON.stringify({ kind: 'browser', calls: 1, sourceSha256: settings.sourceSha256, outputSha256: evidenceBytesDigest(bytes), outputBytes: bytes.length, width: result.width, height: result.height }))
  } else if (settings.kind === 'native') {
    const job = { coverageOnly: true, timing: {}, invocationRunId: settings.runId, observerSha256: settings.observerSha256, workloads: [{ id: settings.caseId, source, invocationIdentity: settings.identity }] }
    const jobFile = join(settings.directory, 'job.json')
    writeFileSync(jobFile, JSON.stringify(job))
    const stderr: Buffer[] = [], stdout: Buffer[] = []
    native = spawn(settings.executable, [], { env: { ...process.env, FLUTTER_COMMUNITY_JOB: jobFile, FLUTTER_COMMUNITY_DIR: settings.directory, FLUTTER_COMMUNITY_RAW: join(settings.directory, 'raw.jsonl') }, stdio: ['ignore', 'pipe', 'pipe'] })
    native.stderr!.on('data', chunk => stderr.push(Buffer.from(chunk)))
    native.stdout!.on('data', chunk => stdout.push(Buffer.from(chunk)))
    let failure: Error | undefined
    native.once('error', error => { failure = error })
    const deadline = performance.now() + 25_000, ledger = join(settings.directory, 'public-invocations.jsonl')
    while (true) {
      if (failure || native.exitCode !== null || performance.now() > deadline) throw failure ?? Error('Native PNG export exited or timed out: ' + Buffer.concat(stderr).toString())
      const rows = existsSync(ledger) ? readFileSync(ledger, 'utf8').split('\n').filter(Boolean).flatMap(line => { try { return [JSON.parse(line)] } catch { return [] } }) : []
      const returned = rows.filter(row => row.state === 'returned')
      if (rows.some(row => row.state === 'public-error')) throw Error('Native public API rejected the actual source')
      if (returned.length) {
        if (rows.length !== 2 || returned.length !== 1 || rows[0].state !== 'started' || rows[1].state !== 'returned' || rows.some(row => row.schema !== 'trident-invocation-evidence-v1' || row.attemptId !== settings.runId + ':0:0' || evidenceDigest(row.identity) !== evidenceDigest(settings.identity)) || returned[0].outputPath !== join(settings.directory, 'return-0-0.png')) throw Error('Native ledger is not exactly one owned public PNG return')
        bytes = readFileSync(returned[0].outputPath)
        if (bytes.length !== returned[0].outputBytes) throw Error('Native return byte count differs')
        writeFileSync(join(settings.directory, 'ack-0'), '')
        writeFileSync(join(settings.directory, 'stdout'), Buffer.concat(stdout)); writeFileSync(join(settings.directory, 'stderr'), Buffer.concat(stderr))
        writeFileSync(join(settings.directory, 'public-return.json'), JSON.stringify({ kind: 'native', calls: 1, sourceSha256: settings.sourceSha256, outputSha256: evidenceBytesDigest(bytes), outputBytes: bytes.length, nativePid: native.pid, ledgerRows: rows.length }))
        break
      }
      await pause()
    }
  } else throw Error('Unsupported public PNG binding')
  return bytes
})
