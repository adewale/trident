import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join, dirname, relative } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { assertCurrentBenchmarkArtifact, latestBenchmarkRenderingArtifact } from './benchmark-versions.ts'
import { inventoryOriginalDeclarations } from './upstream-fidelity-census.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { parserBridge } from './mermaid-fidelity/bridges.ts'
import './mermaid-fidelity/bridge-registry.ts'

const PIN = '1fb7869866dd619168d840291c9c54b4f129758b'
export function fidelityOutcomes(reference: any, candidate: any, audit: any[], referenceAudit?: any[]) {
  const tests = (report: any) => (report?.testResults ?? []).flatMap((f: any) => f.assertionResults.map((t: any, index: number) => ({ ...t, file: f.name, index })))
  const controls = tests(reference),
    attempted = tests(candidate)
  return controls.map((control: any) => {
    const result = attempted.find((t: any) => t.file === control.file && t.index === control.index && t.fullName === control.fullName)
    const evidence = audit.find((t: any) => t.file === control.file && t.index === control.index && t.name.replaceAll(' > ', ' ') === control.fullName)
    const referenceEvidence = referenceAudit?.find((t: any) => t.file === control.file && t.index === control.index && t.name.replaceAll(' > ', ' ') === control.fullName)
    const controlGap = referenceAudit && (!referenceEvidence || referenceEvidence.gaps.length || !referenceEvidence.calls)
    const unmappedMemberCall = result?.failureMessages?.some(
      (message: string) =>
        /^TypeError:.*getDisplayDetails.*not a function/.test(message) &&
        message
          .split('\n')
          .find(line => line.trim().startsWith('at '))
          ?.includes(control.file),
    )
    const skipped = ['pending', 'todo', 'skipped'].includes(control.status)
    const status = skipped
      ? 'upstream-skipped'
      : referenceEvidence?.expectedFailure
        ? 'upstream-expected-failure'
        : control.status !== 'passed' || controlGap
          ? 'reference-unqualified'
          : !result || !evidence || evidence.gaps.length || !evidence.calls || unmappedMemberCall
            ? 'trident-blocked'
            : evidence?.unsupported?.length
              ? 'unsupported'
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
            : evidence?.gaps?.join('; ') || evidence?.unsupported?.join('; ') || result?.failureMessages?.join('\n').slice(0, 1000) || (result ? undefined : 'Candidate test not collected'),
    }
  })
}
export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    console.log('mermaid:fidelity --upstream DIR --reference DIR --runtime DIR --prepared FILE --out FRESH_DIR [--projects IDS] [--filter PATH_FRAGMENT] [--reuse-reference PRIOR_OUT] [--timeout-minutes N]\nExecute original pinned tests in Vitest, once per candidate and control. --reuse-reference reads an earlier complete control run for the same selection instead of repeating it.')
    return
  }
  assertBenchmarkExecutionAllowed()
  const opts = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) {
    if (!['--upstream', '--reference', '--runtime', '--prepared', '--out', '--projects', '--filter', '--catalog', '--reuse-reference', '--timeout-minutes'].includes(args[i]!) || !args[i + 1]) throw Error('Invalid fidelity arguments')
    opts.set(args[i]!, args[i + 1]!)
  }
  for (const key of ['--upstream', '--reference', '--runtime', '--prepared', '--out']) if (!opts.has(key)) throw Error('Missing ' + key)
  const upstream = resolve(opts.get('--upstream')!),
    reference = resolve(opts.get('--reference')!),
    runtime = resolve(opts.get('--runtime')!),
    out = resolve(opts.get('--out')!)
  if (existsSync(out)) throw Error('Use a fresh output directory')
  if (execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim() !== PIN) throw Error('Wrong Mermaid suite pin')
  execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'packages'], { cwd: upstream })
  const referenceRequire = createRequire(join(reference, 'package.json'))
  if (JSON.parse(readFileSync(referenceRequire.resolve('mermaid/package.json'), 'utf8')).version !== '12.2.0') throw Error('Reference Mermaid must match the pinned suite version')
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
    .map(f => ({ ...f, absolute: join(upstream, f.path) }))
  if (!files.length) throw Error('No original tests selected')
  mkdirSync(out, { recursive: true })
  const prepared = JSON.parse(readFileSync(opts.get('--prepared')!, 'utf8'))
  if (opts.has('--catalog')) {
    const catalog = JSON.parse(readFileSync(opts.get('--catalog')!, 'utf8'))
    for (const peer of prepared)
      if (peer.artifact) {
        const selected = catalog.nodes.find((n: any) => n.id === peer.node.id)
        if (selected) assertCurrentBenchmarkArtifact(peer, selected)
      }
  }
  const targets: any[] = [{ project: 'mermaid-js/mermaid', version: '12.2.0', tool: 'mermaid' }]
  const blocked: any[] = []
  for (const peer of prepared) {
    const project = peer.node.id
    if (project === 'mermaid-js/mermaid' || (opts.has('--projects') && !opts.get('--projects')!.split(',').includes(project))) continue
    // A registered out-of-process bridge calls the project's own parser in its own language.
    const bridge = await parserBridge(peer, join(dirname(import.meta.dirname), 'node_modules/.cache/fidelity-bridges'))
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
    targets.push({ project, version: artifact.version, tool, root, peer: { ...peer, artifact }, bun: process.execPath, parserEntries, entry: tool === 'agentic' ? join(root, 'dist/agent-core.js') : tool === 'pele' ? join(root, 'dist/pele.js') : artifact.module })
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
  const collected: any[] = []
  const timeout = 60_000 * Number(opts.get('--timeout-minutes') ?? 60)
  if (!(timeout > 0)) throw Error('--timeout-minutes must be positive')
  if (opts.has('--reuse-reference')) {
    // An unchanged control run for the identical file selection, collected earlier.
    const prior = join(resolve(opts.get('--reuse-reference')!), encodeURIComponent('mermaid-js/mermaid'))
    const priorJob = read(join(prior, 'job.json'))
    if (!priorJob || JSON.stringify(priorJob.files.map((f: any) => f.path)) !== JSON.stringify(files.map(f => f.path)) || priorJob.upstream !== upstream || priorJob.reference !== reference) throw Error('Reused reference run must cover the same upstream, reference and file selection')
    const native = read(join(prior, 'vitest.json'))
    if (!native?.numTotalTests) throw Error('Reused reference run has no collected Vitest results')
    collected.push({ target: targets[0], native, audit: audit(join(prior, 'audit.jsonl')), exit: 0, reused: prior })
    targets.shift()
  }
  for (const target of targets) {
    const directory = join(out, encodeURIComponent(target.project))
    mkdirSync(directory)
    const job = { upstream, reference, runtime, files, target, results: join(directory, 'vitest.json'), audit: join(directory, 'audit.jsonl') }
    const jobPath = join(directory, 'job.json')
    writeFileSync(jobPath, JSON.stringify(job))
    console.log('Original Vitest tests:', target.project, files.length, 'files')
    const child = spawnSync('node', [cli, 'run', '--config', join(import.meta.dirname, 'mermaid-fidelity/config.ts')], { cwd: runtime, env: { ...process.env, CI: 'true', TRIDENT_FIDELITY_JOB: jobPath }, encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024 })
    writeFileSync(join(directory, 'runner.log'), child.stdout + '\n' + child.stderr)
    if (child.error) writeFileSync(join(directory, 'runner-error.txt'), String(child.error))
    collected.push({ target, native: read(job.results), audit: audit(job.audit), exit: child.status })
    if (target.tool === 'mermaid' && !collected[0].native?.numTotalTests) {
      blocked.push(...targets.slice(1).map(t => ({ project: t.project, reason: 'Reference Vitest control did not collect; candidate collection withheld' })))
      break
    }
  }
  const referenceRun = collected[0]!,
    results = collected.map(c => {
      const rows = fidelityOutcomes(referenceRun.native, c.native, c.audit, referenceRun.audit),
        counts = Object.fromEntries(['passed', 'failed', 'unsupported', 'trident-blocked', 'reference-unqualified', 'upstream-skipped', 'upstream-expected-failure'].map(status => [status, rows.filter((r: any) => r.status === status).length]))
      const missingFiles = files
        .filter(f => !c.native?.testResults?.some((r: any) => r.name === f.absolute && r.assertionResults.length))
        .map(f => ({ path: f.path, declaredTests: f.declarations.length, reason: c.native?.testResults?.find((r: any) => r.name === f.absolute)?.message ?? 'No expanded test callbacks collected' }))
      return { project: c.target.project, version: c.target.version, counts, missingFiles, cases: rows.map((r: any) => ({ ...r, file: relative(upstream, r.file) })) }
    })
  writeFileSync(
    join(out, 'results.json'),
    JSON.stringify(
      {
        benchmark: 'Mermaid Fidelity',
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
