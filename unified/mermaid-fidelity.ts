import { planDigest } from './campaign-plan.ts'
import { fidelityControlIdentity, fidelityTargetIdentity, assertReusableControl } from './fidelity-control.ts'
import { byteDigest, runtimeIdentity } from '../portable/artifacts.ts'
import { atomicWrite, reserveResultDirectory } from './result-storage.ts'
import { executionEnvironment } from './execution-environment.ts'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve, join, dirname, relative, basename } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { verifyBenchmarkArtifact, latestBenchmarkRenderingArtifact } from './benchmark-versions.ts'
import { inventoryOriginalDeclarations } from './upstream-fidelity-census.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { parserBridge, parserBridgeDirectory, bindParserBridge } from './mermaid-fidelity/bridges.ts'
import './mermaid-fidelity/bridge-registry.ts'
import { currentReferencePin } from '../reference/source.ts'
import { environmentSummary } from './mermaid-fidelity/environments.ts'
import { qualifyOriginalRuntime } from './upstream-runtime-qualification.ts'

// The pinned Mermaid suite: one reviewed version and commit, shared with upstream:prepare.
const PIN = currentReferencePin.commit
// Trident's own source tree, to tell its exceptions from a candidate's.
const TRIDENT_SOURCE = resolve(import.meta.dirname, '..') + '/'
const expandedTests = (report: any) => (report?.testResults ?? []).flatMap((file: any) => file.assertionResults.map((test: any, index: number) => ({ ...test, file: file.name, index })))
const outcomeIndex = (rows: any[], name: (row: any) => string) => {
  const map = new Map<string, any>()
  for (const row of rows) {
    const key = `${row.file}\u0000${row.index}\u0000${name(row)}`
    if (!map.has(key)) map.set(key, row)
  }
  return map
}
/** One reference population and qualification index for all candidate reductions. */
export function compileFidelityReference(reference: any, audit?: any[]) {
  return { protocol: 'indexed-fidelity-reference-v1' as const, native: reference, controls: expandedTests(reference), guarded: audit !== undefined, referenceBy: audit && outcomeIndex(audit, row => row.fullName ?? row.name.replaceAll(' > ', ' ')) }
}
export function fidelityOutcomes(reference: any, candidate: any, audit: any[], referenceAudit?: any[]) {
  const compiled = reference?.protocol === 'indexed-fidelity-reference-v1' ? reference : compileFidelityReference(reference, referenceAudit)
  const controls = compiled.controls, attempted = expandedTests(candidate)
  // A candidate file that failed to load on the candidate's own unsupported operation (a
  // radar spec whose module-level setup parses radar, for a candidate with no radar
  // parser) collects no tests; each of them is that unsupported operation, not a gap.
  const unsupportedFiles = new Map<string, string>(
    (candidate?.testResults ?? [])
      .filter((f: any) => !f.assertionResults.length && /^Unsupported candidate operation: /.test(f.message ?? ''))
      .map((f: any) => [f.name, String(f.message).split('\n')[0]!.replace(/^Unsupported candidate operation: /, '')]),
  )
  const attemptedBy = outcomeIndex(attempted, t => t.fullName),
    auditBy = outcomeIndex(audit, t => t.fullName ?? t.name.replaceAll(' > ', ' ')),
    referenceBy = compiled.referenceBy
  return controls.map((control: any) => {
    const key = `${control.file}\u0000${control.index}\u0000${control.fullName}`
    const result = attemptedBy.get(key)
    const evidence = auditBy.get(key)
    const referenceEvidence = referenceBy?.get(key)
    // Source controls run the sealed original imports directly. They need no
    // proxy-operation counter: original assertions can inspect values produced
    // during suite setup or test.each collection. Candidate guards still apply.
    const controlGap = compiled.guarded && (!referenceEvidence || referenceEvidence.gaps.length || referenceEvidence.protocol !== 'pinned-source-control-v1' && !referenceEvidence.calls)
    const unmappedMemberCall = result?.failureMessages?.some(
      (message: string) =>
        /^TypeError:.*getDisplayDetails.*not a function/.test(message) &&
        message
          .split('\n')
          .find(line => line.trim().startsWith('at '))
          ?.includes(control.file),
    )
    // A programming error (TypeError, ReferenceError, RangeError) raised inside Trident's
    // own code, such as a view or an assertion helper, is Trident's defect, never a candidate
    // failure: the test is unassessed. A candidate's refusal re-thrown by the runtime is a
    // plain Error and stays the candidate's.
    const tridentError = result?.status !== 'passed' && result?.failureMessages?.find((message: string) => {
      // Vitest can encounter a deferred gap while formatting a failed assertion,
      // after the callback audit has closed. Require both our explicit marker and
      // an owned first frame; candidate exceptions cannot claim adapter ownership.
      if (!/^(?:TypeError|ReferenceError|RangeError):/.test(message) && !/^(?:Error|AdapterGap): TRIDENT_ADAPTER_GAP:/.test(message)) return false
      const frame = message.split('\n').find(line => line.trim().startsWith('at '))
      return !!frame && frame.includes(TRIDENT_SOURCE) && !frame.includes('/node_modules/')
    })
    const skipped = ['pending', 'todo', 'skipped'].includes(control.status)
    const status = skipped
      ? 'upstream-skipped'
      : referenceEvidence?.expectedFailure
        ? 'upstream-expected-failure'
        : control.status !== 'passed' || controlGap
          ? 'reference-unqualified'
          : evidence?.faults?.length
            ? 'failed'
          : // A refused parse, an operation the candidate does not offer or a concept its
            // model does not carry means the test cannot pass, whatever else Trident maps.
            (result && evidence?.unsupported?.length) || (!result && unsupportedFiles.has(control.file))
            ? 'unsupported'
            : !result || !evidence || evidence.gaps.length || !evidence.calls && !(candidate === compiled.native && evidence.protocol === 'pinned-source-control-v1') || unmappedMemberCall || tridentError
              ? 'trident-blocked'
              : result.status === 'passed'
                ? 'passed'
                : 'failed'
    return {
      file: control.file,
      name: control.fullName,
      status,
      calls: evidence?.calls ?? 0,
      rejections: evidence?.rejections ?? 0,
      reason: referenceEvidence?.expectedFailure
        ? 'Original test is marked expected-failure'
        : controlGap
          ? 'Reference native-operation/adapter guard did not qualify'
          : unmappedMemberCall
            ? 'Original ClassMember.getDisplayDetails has no native schema binding; no renderer defect is established'
            : tridentError && status === 'trident-blocked' && !evidence?.gaps?.length
              ? 'Trident error: ' + tridentError.split('\n')[0]!.slice(0, 300)
            : evidence?.faults?.length
              ? evidence.faults.join('; ')
            : (status === 'unsupported' && (evidence?.unsupported?.join('; ') || unsupportedFiles.get(control.file))) || evidence?.gaps?.join('; ') || evidence?.unsupported?.join('; ') || result?.failureMessages?.join('\n').slice(0, 1000) || (result ? undefined : unsupportedFiles.get(control.file) ?? 'Candidate test not collected'),
    }
  })
}
// Test files whose outcomes are identical without jsdom for every candidate (measured on
// in-process and bridged candidates at the pinned Mermaid; see dom-free-files.json).
// TRIDENT_FIDELITY_ENVIRONMENT=node runs every candidate file without jsdom, to measure.
const domFreeFile = join(import.meta.dirname, 'mermaid-fidelity/dom-free-files.json')
const domFreeRecord = existsSync(domFreeFile) ? JSON.parse(readFileSync(domFreeFile, 'utf8')) : undefined
// Automatic reuse also checks the control and each actual candidate binding below.
export function qualifiedNodeFiles(record: any, controlIdentity: string, target: any): Set<string> {
  return new Set(record?.protocol === 'dom-free-qualification-v3' && record.commit === currentReferencePin.commit && record.controlIdentity === controlIdentity && record.targets?.[target.project] === fidelityTargetIdentity(target) ? [...(record.files ?? []), ...(record.additionalFiles?.[target.project] ?? [])] : [])
}
export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    console.log('mermaid:fidelity --upstream DIR --reference DIR --runtime DIR --prepared FILE --out FRESH_DIR [--projects IDS] [--filter PATH_FRAGMENT] [--reuse-reference PRIOR_OUT] [--timeout-minutes N] [--workers N]\nExecute original pinned tests in Vitest, once per candidate and control. --reuse-reference reads an earlier complete control run for the same selection instead of repeating it. --workers runs that many test files at once (default 1); tests inside a file always run one at a time.')
    return
  }
  assertBenchmarkExecutionAllowed()
  if (process.env.TRIDENT_FIDELITY_ENVIRONMENT && !['node', 'jsdom'].includes(process.env.TRIDENT_FIDELITY_ENVIRONMENT)) throw Error('TRIDENT_FIDELITY_ENVIRONMENT must be node or jsdom')
  const opts = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) {
    if (!['--upstream', '--reference', '--runtime', '--prepared', '--out', '--projects', '--filter', '--catalog', '--reuse-reference', '--timeout-minutes', '--workers'].includes(args[i]!) || !args[i + 1]) throw Error('Invalid fidelity arguments')
    opts.set(args[i]!, args[i + 1]!)
  }
  for (const key of ['--upstream', '--reference', '--runtime', '--prepared', '--out']) if (!opts.has(key)) throw Error('Missing ' + key)
  const upstream = resolve(opts.get('--upstream')!),
    reference = resolve(opts.get('--reference')!),
    runtime = resolve(opts.get('--runtime')!),
    out = resolve(opts.get('--out')!)
  if (existsSync(out)) throw Error('Use a fresh output directory')
  if (execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim() !== PIN) throw Error('Wrong Mermaid suite pin')
  execFileSync('git', ['diff', '--quiet', 'HEAD'], { cwd: upstream })
  qualifyOriginalRuntime(upstream, runtime, process.env.NODE_BIN ?? 'node')
  const referenceRequire = createRequire(join(reference, 'package.json'))
  if (JSON.parse(readFileSync(referenceRequire.resolve('mermaid/package.json'), 'utf8')).version !== currentReferencePin.version) throw Error('Reference Mermaid must match the pinned suite version')
  const inventory = inventoryOriginalDeclarations(upstream)
  const files = inventory.files
    .filter(
      f =>
        /^packages\/[^/]+\/(?:src|tests)\//.test(f.path) &&
        (!opts.has('--filter') ||
          opts
            .get('--filter')!
            .split(',')
            .some(fragment => f.path.includes(fragment))),
    )
    .map(f => ({ ...f, absolute: join(upstream, f.path), ...(process.env.TRIDENT_FIDELITY_ENVIRONMENT === 'node' ? { environment: 'node' } : {}) }))
  if (!files.length) throw Error('No original tests selected')
  reserveResultDirectory(out)
  const prepared = JSON.parse(readFileSync(opts.get('--prepared')!, 'utf8'))
  if (opts.has('--catalog')) {
    const catalog = JSON.parse(readFileSync(opts.get('--catalog')!, 'utf8'))
    for (const peer of prepared)
      if (peer.artifact) {
        const selected = catalog.nodes.find((n: any) => n.id === peer.node.id)
        if (!selected) throw Error('Prepared project is absent from the selected catalog: ' + peer.node.id)
        verifyBenchmarkArtifact(peer, selected)
      }
  }
  const targets: any[] = [{ project: 'mermaid-js/mermaid', version: currentReferencePin.version, tool: 'mermaid' }]
  const bunSha256 = byteDigest(process.execPath)
  const bridgeCache = join(dirname(import.meta.dirname), 'node_modules/.cache/fidelity-bridges')
  const blocked: any[] = []
  for (const peer of prepared) {
    const project = peer.node.id
    if (project === 'mermaid-js/mermaid' || (opts.has('--projects') && !opts.get('--projects')!.split(',').includes(project))) continue
    if (!opts.has('--catalog')) verifyBenchmarkArtifact(peer, peer.node)
    // A registered out-of-process bridge calls the project's own parser in its own language.
    const bridge = await parserBridge(peer, bridgeCache)
    if (bridge) {
      targets.push({ project, version: bridge.version, tool: 'bridge', bridge, peer })
      continue
    }
    const artifact = latestBenchmarkRenderingArtifact(peer)
    const tool = project === 'adewale/agentic-mermaid' ? 'agentic' : project === 'obsidianmd/pele' ? 'pele' : project === 'lukilabs/beautiful-mermaid' ? 'beautiful' : project === 'dfadler/zombie-mermaid' ? 'zombie' : (artifact?.kind === 'node' || artifact?.kind === 'franken') && artifact.module ? 'native' : undefined
    if (!tool || !artifact?.root) {
      blocked.push({ project, reason: 'Trident has no native database/schema adapter for this public artifact yet' })
      continue
    }
    const root = artifact.root
    const parserEntries: Record<string, string> = {}
    if (tool === 'native')
      for (const family of ['flowchart', 'sequence', 'class', 'er', 'state', 'gantt', 'timeline', 'gitgraph']) {
        const candidates = [join(root, 'src', family, 'parser.ts'), ...(family === 'flowchart' ? [join(root, 'src/parser.ts')] : [])]
        const entry = candidates.find(p => existsSync(p))
        if (entry) parserEntries[family] = entry
      }
    targets.push({ project, version: artifact.version, tool, root, peer: { ...peer, artifact }, bun: process.execPath, bunSha256, parserEntries, entry: tool === 'agentic' ? join(root, 'dist/agent-core.js') : tool === 'pele' ? join(root, 'dist/pele.js') : artifact.module })
  }
  const require = createRequire(join(runtime, 'package.json')),
    cli = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs')
  const read = (path: string) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null)
  const audit = (path: string) =>
    existsSync(path)
      ? readFileSync(path, 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map(s => JSON.parse(s))
      : []
  const workers = Number(opts.get('--workers') ?? 1)
  if (!Number.isInteger(workers) || workers < 1) throw Error('--workers must be a positive integer')
  // Parallel files append to one audit part per worker process; recombine them.
  const combineAudit = (path: string) => {
    const parts = readdirSync(dirname(path)).filter(name => name.startsWith(basename(path) + '.')).map(name => join(dirname(path), name))
    if (!parts.length) return
    writeFileSync(path, parts.map(part => readFileSync(part, 'utf8')).join(''), { flag: 'a' })
    for (const part of parts) rmSync(part)
  }
  const runnerCommand = process.env.NODE_BIN ?? 'node'
  const runnerEnvironment = runtimeIdentity(runnerCommand)
  const controlIdentity = fidelityControlIdentity(upstream, reference, runtime, files, PIN, runnerEnvironment)
  let referenceRun: any, indexedReference: ReturnType<typeof compileFidelityReference> | undefined
  const results: any[] = []
  const retainOutcome = (candidate: any) => {
    const suites = candidate.native?.testResults ?? [], seenFiles = new Set<string>()
    for (const suite of suites) {
      if (seenFiles.has(suite.name) || !files.some(file => file.absolute === suite.name)) throw Error('Fidelity runner collected an unexpected or duplicate file: ' + suite.name)
      seenFiles.add(suite.name)
    }
    referenceRun ??= candidate
    indexedReference ??= compileFidelityReference(referenceRun.native, referenceRun.audit)
    const rows = fidelityOutcomes(indexedReference, candidate.native, candidate.audit)
    const counts = Object.fromEntries(['passed', 'failed', 'unsupported', 'trident-blocked', 'reference-unqualified', 'upstream-skipped', 'upstream-expected-failure'].map(status => [status, rows.filter((row: any) => row.status === status).length]))
    const byFile = new Map<string, any>((candidate.native?.testResults ?? []).map((row: any) => [row.name, row]))
    const missingFiles = files.filter(file => !byFile.get(file.absolute)?.assertionResults.length).map(file => ({ path: file.path, declaredTests: file.declarations.length, reason: byFile.get(file.absolute)?.message ?? 'No expanded test callbacks collected' }))
    results.push({ project: candidate.target.project, version: candidate.target.version, counts, environments: candidate.environments, missingFiles, cases: rows.map((row: any) => ({ ...row, file: relative(upstream, row.file) })) })
  }
  const timeout = 60_000 * Number(opts.get('--timeout-minutes') ?? 60)
  if (!(timeout > 0)) throw Error('--timeout-minutes must be positive')
  if (opts.has('--reuse-reference')) {
    // An unchanged control run for the identical file selection, collected earlier.
    const prior = join(resolve(opts.get('--reuse-reference')!), encodeURIComponent('mermaid-js/mermaid'))
    const priorJob = read(join(prior, 'job.json'))
    if (!priorJob || JSON.stringify(priorJob.files.map((f: any) => f.path)) !== JSON.stringify(files.map(f => f.path))) throw Error('Reused reference run must cover the same file selection')
    assertReusableControl(prior, controlIdentity)
    const native = read(join(prior, 'vitest.json'))
    if (!native?.numTotalTests) throw Error('Reused reference run has no collected Vitest results')
    for (const suite of native.testResults ?? []) suite.name = join(upstream, relative(priorJob.upstream, suite.name))
    const priorAudit = audit(join(prior, 'audit.jsonl')).map(row => ({ ...row, file: join(upstream, relative(priorJob.upstream, row.file)) }))
    const environments = environmentSummary(priorJob.files, audit(join(prior, 'environments.jsonl')), true)
    if (environments.unobserved) throw Error('Reused reference lacks complete environment receipts; recollect')
    retainOutcome({ target: targets[0], native, audit: priorAudit, environments, exit: 0, reused: prior })
    targets.shift()
  }
  for (const target of targets) {
    const directory = join(out, encodeURIComponent(target.project))
    mkdirSync(directory)
    const domFree = qualifiedNodeFiles(domFreeRecord, controlIdentity, target)
    const candidateFiles = files.map(file => ({ ...file, ...(!process.env.TRIDENT_FIDELITY_ENVIRONMENT && domFree.has(file.path) ? { environment: 'node' } : {}) }))
    const job = { upstream, reference, runtime, files: candidateFiles, target, workers, controlIdentity, pin: PIN, results: join(directory, 'vitest.json'), audit: join(directory, 'audit.jsonl'), environmentAudit: join(directory, 'environments.jsonl') }
    const jobPath = join(directory, 'job.json')
    writeFileSync(jobPath, JSON.stringify(job))
    console.log('Original Vitest tests:', target.project, files.length, 'files')
    // Mermaid's own suite runs from its repository root; tests that read source files
    // relative to the working directory need the same.
    const child = spawnSync(runnerCommand, [cli, 'run', '--config', join(import.meta.dirname, 'mermaid-fidelity/config.ts')], { cwd: upstream, env: { ...process.env, CI: 'true', TRIDENT_FIDELITY_JOB: jobPath }, encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024 })
    writeFileSync(join(directory, 'runner.log'), child.stdout + '\n' + child.stderr)
    if (child.error) writeFileSync(join(directory, 'runner-error.txt'), String(child.error))
    combineAudit(job.audit)
    combineAudit(job.environmentAudit)
    if (target.tool === 'bridge' && planDigest(bindParserBridge(target.bridge, parserBridgeDirectory(target.project, bridgeCache), target.peer)) !== planDigest(target.bridge)) throw Error('Parser bridge runtime changed during collection: ' + target.project)
    if (target.bun && byteDigest(target.bun) !== target.bunSha256) throw Error('Candidate Bun runtime changed during collection: ' + target.project)
    if (target.peer?.artifact) verifyBenchmarkArtifact(target.peer, target.peer.node)
    const native = read(job.results)
    const environments = environmentSummary(candidateFiles, audit(job.environmentAudit), target.tool === 'mermaid')
    retainOutcome({ target, native, audit: audit(job.audit), environments, exit: child.status })
    if (target.tool === 'mermaid' && !child.error && native?.numTotalTests > 0 && files.every(file => native.testResults?.some((suite: any) => suite.name === file.absolute)) && !environments.unobserved) atomicWrite(join(directory, 'control.json'), JSON.stringify({ protocol: 'fidelity-control-v1', identity: controlIdentity, resultsSha256: byteDigest(job.results), auditSha256: byteDigest(job.audit), environmentSha256: byteDigest(job.environmentAudit) }) + '\n')
    if (target.tool === 'mermaid' && !referenceRun.native?.numTotalTests) {
      blocked.push(...targets.slice(1).map(t => ({ project: t.project, reason: 'Reference Vitest control did not collect; candidate collection withheld' })))
      break
    }
  }
  if (fidelityControlIdentity(upstream, reference, runtime, files, PIN, runnerEnvironment) !== controlIdentity) throw Error('Fidelity inputs or harness changed during collection; recollect')
  atomicWrite(
    join(out, 'results.json'),
    JSON.stringify(
      {
        benchmark: 'Mermaid Fidelity',
        referenceMode: 'pinned-production-source-v1',
        controlIdentity,
        environment: { controller: executionEnvironment(), runner: runnerEnvironment },
        updatedAt: new Date().toISOString(),
        collectedThrough: new Date().toISOString(),
        versionsFrozenAt: opts.has('--catalog') ? JSON.parse(readFileSync(opts.get('--catalog')!, 'utf8')).benchmarkVersionsCheckedAt : undefined,
        pin: PIN,
        selection: opts.get('--filter') ?? 'all core package tests',
        inventory: inventory.counts,
        selectedFiles: files.length,
        outsideSelectedRunner: inventory.files.filter(f => !files.some(x => x.path === f.path)).map(f => ({ path: f.path, declaredTests: f.declarations.length, reason: opts.has('--filter') ? 'Functional subset only' : 'Outside core package Vitest suites; browser/application runner not adapted' })),
        results,
        blocked,
      },
      null,
      2,
    ),
  )
  console.log(JSON.stringify(results.map(({ project, counts, missingFiles }) => ({ project, ...counts, missingFiles: missingFiles.length }))))
}
if (import.meta.main) await main()
