import { nativePngArtifact } from '../native-flutter/community-launch.mjs'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve, relative } from 'node:path'
import { hostname } from 'node:os'
import { parse as parseYaml } from 'yaml'
import { chromium } from 'playwright'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { admitCurrentReference } from '../reference/source.ts'
import { mermaidOracleDirectory, mermaidUpstreamDirectory, mermaidZenumlAddon } from '../portable/mermaid-oracle.ts'
import { docsInventory, docsArtifactServer } from './docs-benchmark.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { publicDocsPngAction } from './docs-png-browser.ts'
import { inspectPng } from './png-inspection.ts'
import { protocolIdentity } from './protocol-identity.ts'

const root = resolve(import.meta.dirname, '..')
const PROTOCOL = 'public-docs-png-export-v1'
const args = process.argv.slice(2),
  flags = new Map<string, string>()
if (args.length === 1 && args[0] === '--help') {
  console.log('docs:png --out FRESH_DIR [--rounds 5] [--native-bundle DIR] [--packages DIR] [--limit N (preflight only)]')
  process.exit(0)
}
for (let i = 0; i < args.length; i += 2) {
  if (!['--out', '--rounds', '--native-bundle', '--packages', '--limit'].includes(args[i]!) || !args[i + 1] || flags.has(args[i]!)) throw Error('Use docs:png --help')
  flags.set(args[i]!, args[i + 1]!)
}
if (!flags.has('--out')) throw Error('A fresh --out directory is required')
const out = resolve(flags.get('--out')!),
  rounds = Number(flags.get('--rounds') ?? 5),
  limit = Number(flags.get('--limit') ?? 0)
if (!Number.isInteger(rounds) || rounds < 1 || !Number.isInteger(limit) || limit < 0) throw Error('Invalid rounds or preflight limit')
assertBenchmarkExecutionAllowed()
const upstream = process.env.MERMAID_SOURCE_DIR ?? mermaidUpstreamDirectory(),
  reference = process.env.MERMAID_REFERENCE_DIR ?? mermaidOracleDirectory()
admitCurrentReference(upstream, reference)
const inventory = docsInventory(upstream),
  cases = limit ? inventory.cases.slice(0, limit) : inventory.cases
const producers = limit ? ['UNCOMMITTED PREFLIGHT; NOT A PUBLISHED MEASUREMENT'] : protocolIdentity(root, ['unified/docs-png-benchmark.ts', 'unified/docs-png-agentic-worker.mjs', 'native-flutter/community-worker.mjs', 'native-flutter/app/lib/community_worker.dart'])
const packages = resolve(flags.get('--packages') ?? join(root, 'davebench-png/node_modules'))
const bundle = resolve(flags.get('--native-bundle') ?? join(root, 'native-flutter/app/build/linux/x64/release/bundle'))
const executable = join(bundle, 'native_bench')
const expected: Record<string, string> = { 'agentic-mermaid': '0.4.1', mermaid: '12.2.0', pele: '1.9.0', '@mermaid-js/mermaid-zenuml': '1.0.1' }
for (const [name, version] of Object.entries(expected)) {
  const pkg = JSON.parse(readFileSync(join(packages, name, 'package.json'), 'utf8'))
  if (pkg.name !== name || pkg.version !== version) throw Error(`Expected ${name} ${version}`)
}
const lock = parseYaml(readFileSync(join(root, 'native-flutter/app/pubspec.lock'), 'utf8'))
for (const name of ['mermaid_flutter', 'mermaid_core']) if (lock.packages[name].version !== '0.3.2') throw Error('Native Flutter packages must be 0.3.2')
if (!existsSync(executable)) throw Error('Build the native community_worker.dart release target first')
mkdirSync(out)
mkdirSync(join(out, 'raw'))
const startedAt = new Date().toISOString()
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
const list = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? list(p) : [p]
  })
const sealedFiles = [...list(packages), ...list(bundle), join(root, 'native-flutter/app/pubspec.lock')].filter(p => !p.endsWith('.map')).map(path => ({ path, sha256: hash(path) }))
const nativeBinding = nativePngArtifact(bundle, join(out, 'native-launch.json'))
sealedFiles.push(...nativeBinding.files!.filter(file => !sealedFiles.some(sealed => sealed.path === file.path)))
const artifactIdentity = join(out, 'artifacts.json')
writeFileSync(artifactIdentity, JSON.stringify({ expected, native: 'mermaid_flutter/mermaid_core 0.3.2', executable, files: sealedFiles }, null, 2))
const addon = mermaidZenumlAddon(reference, join(packages, '@mermaid-js/mermaid-zenuml'))
const participants = [
  { id: 'adewale/agentic-mermaid', version: '0.4.1', kind: 'node', api: 'agentic-mermaid/agent.renderMermaidPNG(source,{scale:1})', runtime: 'Node ' + execFileSync('node', ['--version'], { encoding: 'utf8' }).trim() },
  { id: 'mermaid-js/mermaid', version: '12.2.0', kind: 'mermaid', api: 'mermaid.render -> SVG serialization/decode -> canvas -> PNG bytes', runtime: 'Chromium' },
  { id: 'pub:mermaid_flutter', version: '0.3.2', kind: 'native', api: 'mermaid_flutter.renderToPng(source,pixelRatio:1)', runtime: 'Native Linux Flutter release' },
  { id: 'obsidianmd/pele', version: '1.9.0', kind: 'pele', api: 'pele.render -> SVG serialization/decode -> canvas -> PNG bytes', runtime: 'Chromium' },
]
const chrome = process.env.CHROMIUM_EXECUTABLE ?? '/usr/bin/chromium'
const fonts = ['/usr/share/fonts', '/usr/local/share/fonts'].flatMap(dir =>
  existsSync(dir)
    ? list(dir)
        .filter(p => /\.(ttf|otf|woff2?)$/i.test(p))
        .map(path => ({ path, sha256: hash(path) }))
    : [],
)
writeFileSync(join(out, 'inventory.json'), JSON.stringify({ ...inventory, selectedCases: cases.length, cases, protocol: PROTOCOL, preflight: !!limit, producers }, null, 2))
writeFileSync(
  join(out, 'context.json'),
  JSON.stringify(
    {
      protocol: PROTOCOL,
      producers,
      startedAt,
      hostname: hostname(),
      os: execFileSync('uname', ['-a'], { encoding: 'utf8' }).trim(),
      osRelease: readFileSync('/etc/os-release', 'utf8'),
      cpu: execFileSync('lscpu', { encoding: 'utf8' }),
      cpuMax: readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim(),
      memoryMax: readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim(),
      driver: process.versions,
      chromium: execFileSync(chrome, ['--version'], { encoding: 'utf8' }).trim(),
      fonts,
      rounds,
      warmupAttempts: 30,
      participants,
      nativeExecutable: executable,
      nativeLaunchHashes: { executable: hash(executable), libapp: hash(join(bundle, 'lib/libapp.so')) },
      output: 'Intrinsic bounds, scale1; default themes/fonts. Browser canvas white backdrop. API default/artifact backgrounds for direct PNG. No resizing or matched pixel dimensions.',
      qualification: 'Actual PNG decode plus nonuniform content; 16Mi pixel/64MiB encoded observer budget; not labels, topology or visual equivalence.',
      timing: 'Stop after encoded bytes are consumed; exclude startup/import, transport, validation and files. Browser PNG production includes deferred raster/readback/encode; native/Agentic internal stages opaque. Validation serialized between timed calls.',
      network: 'Browser prepared package origin only; data/blob image URLs; no external asset network',
      allocation: 'Five rounds by default. Rotate/reverse participant order; new worker/page per round, browser process shared. Same documentation order and first30 warmup sources, warmup errors retained. No A/A calibration; no source-update workload.',
    },
    null,
    2,
  ),
)
const observations: any[] = [],
  rawLedger = join(out, 'observations.jsonl')
const safe = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_')
const workloads = () => [...Array.from({ length: 30 }, (_, i) => ({ id: `warmup:${i}`, source: cases[i % cases.length]!.source, expected: [] })), ...cases.map(c => ({ id: c.id, source: c.source, expected: [] }))]
function retain(peer: (typeof participants)[number], round: number, row: any, warmupPassed: number) {
  const testCase = cases.find(c => c.id === row.workload)
  if (!testCase) return
  const status = row.status === 'ok' ? 'passed' : row.status === 'blocked' ? 'blocked' : 'failed'
  const observation = {
    suite: 'docs-png',
    surface: peer.kind === 'native' ? 'native:png' : peer.kind === 'node' ? 'node:png' : 'browser:png',
    runtime: peer.runtime,
    family: testCase.family,
    caseId: testCase.id,
    operation: 'export-png',
    format: 'png',
    mode: 'one-call-after-30-warmup-attempts',
    status,
    ...(status === 'passed' ? { samplesMs: [row.firstMs ?? row.totalMs] } : {}),
    detail: row.detail,
    metrics: {
      project: peer.id,
      version: peer.version,
      round,
      pngReturned: row.pngReturned ?? false,
      outputBytes: row.outputBytes ?? null,
      width: row.width ?? row.qualification?.width ?? null,
      height: row.height ?? row.qualification?.height ?? null,
      png: row.png ?? null,
      failureStage: row.failureStage ?? row.stage ?? (row.status === 'ok' ? null : row.pngReturned ? 'qualification' : row.status === 'blocked' ? 'transport' : 'public-api'),
      qualification: row.qualification?.scope ?? null,
      pngInspection: row.qualification ? JSON.stringify(row.qualification) : null,
      stages: row.stages ? JSON.stringify(row.stages) : null,
      warmupAttempts: 30,
      warmupPassed,
    },
  }
  observations.push(observation)
  appendFileSync(rawLedger, JSON.stringify(observation) + '\n')
}
async function worker(peer: (typeof participants)[number], round: number) {
  const stem = join(out, 'raw', `${safe(peer.id)}-r${round}`),
    jobPath = stem + '.job.json',
    resultPath = stem + '.jsonl'
  const job = { output: 'png', coverageOnly: true, requireNonblankPng: true, timing: { warmCalls: 0, warmupMs: 0, minSampleMs: 0, maxCaseMs: 20000, samples: 0 }, artifactRoot: join(packages, 'agentic-mermaid'), workloads: workloads() }
  writeFileSync(jobPath, JSON.stringify(job))
  const native = peer.kind === 'native',
    entry = join(root, native ? 'native-flutter/community-worker.mjs' : 'unified/docs-png-agentic-worker.mjs')
  const child = spawn('node', [entry, ...(native ? nativeBinding.args! : []), jobPath, resultPath], { detached: true, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] })
  let log = '',
    completed = 0,
    lastProgress = Date.now(),
    timedOut = false
  child.stdout.on('data', data => {
    log += String(data)
  })
  child.stderr.on('data', data => {
    log += String(data)
  })
  const progress = () => {
    if (!existsSync(resultPath)) return
    const count = readFileSync(resultPath, 'utf8').split('\n').length - 1
    if (count > completed) {
      completed = count
      lastProgress = Date.now()
    }
  }
  const timer = setInterval(() => {
    progress()
    if (Date.now() - lastProgress > (completed ? 30000 : 120000)) {
      timedOut = true
      try {
        process.kill(-child.pid!, 'SIGKILL')
      } catch {}
    }
  }, 250)
  let spawnError: string | undefined
  const code = await new Promise<number | null>(done => {
    child.once('error', error => {
      spawnError = String(error)
    })
    child.once('close', done)
  })
  clearInterval(timer)
  if (code !== 0) {
    try {
      process.kill(-child.pid!, 'SIGKILL')
    } catch {}
  }
  progress()
  writeFileSync(stem + '.log', log)
  const values = existsSync(resultPath)
    ? readFileSync(resultPath, 'utf8')
        .split('\n')
        .slice(0, -1)
        .map(line => JSON.parse(line))
    : []
  const byId = new Map(values.map(row => [row.workload, row]))
  if (byId.size !== values.length || values.some(r => !job.workloads.some(w => w.id === r.workload))) throw Error('Unowned/duplicate worker rows')
  const warmupPassed = values.filter(r => r.workload.startsWith('warmup:') && r.status === 'ok').length
  for (const c of cases) retain(peer, round, byId.get(c.id) ?? { workload: c.id, status: 'blocked', detail: `No completed row: worker exit ${code}; timeout=${timedOut}; ${spawnError ?? ''}` }, warmupPassed)
  writeFileSync(stem + '.attempt.json', JSON.stringify({ code, timedOut, spawnError, completed, expected: job.workloads.length, warmupPassed }, null, 2))
  if (native) {
    const launchFile = resultPath + '.native/launch.json'
    if (!existsSync(launchFile) && !values.length) return // Startup never produced an attested row; the blocked attempt above is retained.
    const launched = JSON.parse(readFileSync(launchFile, 'utf8'))
    if (launched.executable !== executable || launched.sha256 !== hash(executable) || launched.libappSha256 !== hash(join(bundle, 'lib/libapp.so'))) throw Error('Native launch differs from sealed bundle')
    if (values.some(v => v.release !== true)) throw Error('Non-release native observation')
  }
}
const browser = await chromium.launch({ headless: true, executablePath: chrome })
async function browserRound(peer: (typeof participants)[number], round: number) {
  const folder = join(out, 'raw', `${safe(peer.id)}-r${round}`)
  mkdirSync(folder)
  const packageRoot = join(packages, peer.kind === 'mermaid' ? 'mermaid' : 'pele'),
    server = docsArtifactServer(packageRoot, peer.kind === 'mermaid' ? addon : undefined)
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const origin = 'http://127.0.0.1:' + (server.address() as any).port
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 1 }),
    page = await context.newPage(),
    blockedRequests: string[] = []
  await context.route('**/*', route => {
    const url = route.request().url()
    if (new URL(url).origin === origin || /^(data|blob):/.test(url)) return route.continue()
    blockedRequests.push(url)
    return route.abort()
  })
  let warmupPassed = 0,
    completed = 0
  try {
    await page.goto(origin + '/blank')
    await page.addScriptTag({ url: origin + (peer.kind === 'mermaid' ? '/dist/mermaid.min.js' : '/dist/pele.global.js') })
    await page.evaluate(publicSvgBrowserAction, { type: 'initialize-global', engine: { kind: peer.kind, global: peer.kind }, addonUrl: peer.kind === 'mermaid' ? origin + '/__addon/' + addon.entry : undefined })
    for (const [index, w] of workloads().entries()) {
      let timer: ReturnType<typeof setTimeout> | undefined
      let value: any
      try {
        value = await Promise.race([
          page.evaluate(publicDocsPngAction, { source: w.source, id: `png_${round}_${index}` }),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              void page.close().catch(() => {})
              reject(Error('PNG export exceeded20s host deadline'))
            }, 20000)
          }),
        ])
      } finally {
        clearTimeout(timer)
      }
      const row: any = { ...value, workload: w.id, pngReturned: value.status === 'ok' }
      if (value.svg) {
        row.svgFile = join(folder, index + '.svg')
        writeFileSync(row.svgFile, value.svg)
      }
      delete row.svg
      if (value.png) {
        const bytes = Uint8Array.from(value.png)
        row.png = join(folder, index + '.png')
        writeFileSync(row.png, bytes)
        const q = inspectPng(bytes, true)
        row.qualification = q
        row.status = q.unavailable ? 'blocked' : q.findings.length ? 'error' : 'ok'
        if (q.findings.length) {
          row.failureStage = 'qualification'
          row.detail = q.findings.join('; ')
        }
      }
      appendFileSync(join(folder, 'rows.jsonl'), JSON.stringify(row) + '\n')
      completed++
      if (w.id.startsWith('warmup:')) {
        if (row.status === 'ok') warmupPassed++
      } else retain(peer, round, row, warmupPassed)
    }
  } catch (error) {
    writeFileSync(join(folder, 'interruption.json'), JSON.stringify({ completed, error: String(error) }))
    const already = new Set(observations.filter(r => r.metrics.project === peer.id && r.metrics.round === round).map(r => r.caseId))
    for (const c of cases) if (!already.has(c.id)) retain(peer, round, { workload: c.id, status: 'blocked', detail: String(error) }, warmupPassed)
  } finally {
    writeFileSync(join(folder, 'network.json'), JSON.stringify({ blockedRequests }))
    await context.close()
    await new Promise<void>(done => server.close(() => done()))
  }
}
try {
  for (let round = 1; round <= rounds; round++) {
    const start = (round - 1) % participants.length,
      order = [...participants.slice(start), ...participants.slice(0, start)]
    if (round % 2 === 0) order.reverse()
    for (const peer of order) {
      console.log(`PNG DaveBench round ${round}/${rounds}: ${peer.id}, ${cases.length} occurrences`)
      await (peer.kind === 'native' || peer.kind === 'node' ? worker(peer, round) : browserRound(peer, round))
    }
  }
} finally {
  await browser.close()
}
for (const f of sealedFiles) if (hash(f.path) !== f.sha256) throw Error('Artifact changed during collection: ' + f.path)
if (!limit) protocolIdentity(root, ['unified/docs-png-benchmark.ts', 'unified/docs-png-agentic-worker.mjs', 'native-flutter/community-worker.mjs', 'native-flutter/app/lib/community_worker.dart'])
const finishedAt = new Date().toISOString(),
  status = observations.some(r => r.status === 'failed') ? 'failed' : observations.some(r => r.status === 'blocked') ? 'blocked' : 'passed'
const result = {
  id: 'docs-png',
  protocol: PROTOCOL,
  startedAt,
  finishedAt,
  status,
  observations,
  gaps: ['PNG content witness only, no text/topology equivalence.', 'Intrinsic output dimensions/default fonts differ; no equal-pixel speed ratio or A/A performance qualification.', 'Documentation occurrences are development-exposed and are not a balanced or held-out workload.'],
  artifacts: [artifactIdentity, join(out, 'inventory.json'), join(out, 'context.json'), rawLedger],
}
writeFileSync(join(out, 'result.json'), JSON.stringify(result))
writeFileSync(
  join(out, 'report.json'),
  JSON.stringify({ startedAt, updatedAt: finishedAt, finishedAt, projects: participants.map(p => p.id), profile: limit ? 'preflight' : 'full-docs', rounds, protocol: PROTOCOL, results: [{ suite: 'docs-png', status, out, observations: observations.length, gaps: result.gaps }] }, null, 2),
)
writeFileSync(join(out, 'completed.json'), JSON.stringify({ collectionComplete: observations.length === rounds * cases.length * participants.length, qualificationPassed: status === 'passed', expected: rounds * cases.length * participants.length, observed: observations.length, preflight: !!limit, finishedAt }, null, 2))
console.log('PNG DAVEbench COMPLETE', out, status)
