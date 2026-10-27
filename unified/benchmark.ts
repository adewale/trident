import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { runPortable, parsePortableOptions } from '../portable/run.ts'
import { runCommunityFidelitySuite } from '../fidelity/community.ts'
import { runMermaidFidelitySuite } from './fidelity-suite.ts'
import { runUpstreamFidelitySuite } from './upstream-fidelity.ts'
import { runUpstreamOriginalSuite } from './upstream-fidelity-original.ts'
import { runDocsBenchmark } from './docs-benchmark.ts'
import { prepareCommunity, selectCommunityProjects } from './community.ts'
import { prepareCommunityBrowsers } from './community-browser.ts'
import type { PreparedCommunity } from './community-types.ts'
import { runProjectUpdates } from './project-update.ts'
import { parseOptions } from './options.ts'
import { communityCatalogFile } from './trident-paths.ts'
import type { UnifiedSuiteResult } from './types.ts'

const suites = ['community', 'docs', 'fidelity', 'native-fidelity', 'upstream-fidelity', 'upstream-original', 'portable'] as const
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
export function publicPackageRoot(peer: PreparedCommunity | undefined): string | undefined {
  if (!peer?.artifact) return undefined
  if (peer.artifact.root && existsSync(join(peer.artifact.root, 'package.json'))) return resolve(peer.artifact.root)
  if (!peer.artifact.module) return undefined
  let root = dirname(resolve(peer.artifact.module))
  while (root !== dirname(root)) {
    if (existsSync(join(root, 'package.json'))) return root
    root = dirname(root)
  }
}

/** All applicable public-artifact suites, serially. Every requested boundary is
 * retained, including absent adapters and setup failures. Product checks live
 * in their own repository and never enter this project comparison. */
export async function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help')) {
    console.log('bun commands.ts bench --projects OWNER/TOOL,... --profile full --rounds 5 --out DIRECTORY [--records DIRECTORY] [--suites ' + suites.join(',') + '] [--executable CHROMIUM] [--upstream-runner-root INSTALLED_VITEST_KIT] [--list]\nRuns applicable public-artifact suites serially; full portable sampling uses31 warm means and20 fresh processes per replica/round/case. Missing capabilities and dependencies remain blocked or unsupported. No source checkout of any candidate is inferred. AM product diagnostics run in AM. Failed/blocked suites do not stop subsequent collection; report.json preserves their status.')
    return
  }
  const forwarded: string[] = [], selected: string[] = [], seen = new Set<string>()
  let list = false, upstreamRunnerRoot: string | undefined
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]!
    if (seen.has(flag)) throw Error('Duplicate option ' + flag)
    seen.add(flag)
    if (flag === '--list') { list = true; continue }
    if (flag === '--suites') { selected.push(...(argv[++index] ?? '').split(',')); continue }
    if (flag === '--upstream-runner-root') { const value = argv[++index]; if (!value || value.startsWith('--')) throw Error('Missing upstream runner root'); upstreamRunnerRoot = resolve(value); continue }
    forwarded.push(flag === '--records' ? '--community-records' : flag)
    if (!['--community-force', '--allow-incomplete'].includes(flag)) forwarded.push(argv[++index] ?? '')
  }
  if (selected.length && (selected.some(id => !suites.includes(id as any)) || new Set(selected).size !== selected.length)) throw Error('Unknown or duplicate suite; use --help')
  if (!forwarded.includes('--profile')) forwarded.push('--profile', 'full')
  const options = parseOptions(forwarded), chosen = selected.length ? selected : [...suites]
  const catalog = read(options.communityCatalogFile ?? communityCatalogFile)
  const projects = selectCommunityProjects(catalog.nodes, options.communityProjects).map(peer => peer.id)
  if (list) { console.log(JSON.stringify({ suites: chosen, projects, profile: options.profile, rounds: options.rounds }, null, 2)); return }
  assertBenchmarkExecutionAllowed()
  if (existsSync(join(options.out, 'report.json'))) throw Error('Choose a fresh campaign output directory; retained project records are reused separately')
  mkdirSync(options.out, { recursive: true })
  const startedAt = new Date().toISOString(), results: any[] = []
  const save = () => {
    const report = { startedAt, updatedAt: new Date().toISOString(), projects, profile: options.profile, rounds: options.rounds, requestedSuites: chosen, results }
    writeFileSync(join(options.out, 'report.json'), JSON.stringify(report, null, 2))
    writeFileSync(join(options.out, 'report.md'), '# Public-artifact benchmark campaign\n\n' + `Profile: ${options.profile}; rounds: ${options.rounds}. All clocks run serially.\n\n` + '| Suite | Project | Status | Detail |\n|---|---|---|---|\n' + results.map(value => `| ${value.suite} | ${value.project ?? projects.join(', ')} | ${value.status} | ${String(value.detail ?? value.out ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')} |`).join('\n') + '\n\nFailures are observed findings; blocked or unsupported cells are not passing evidence. See each owning result and its literal case denominator.\n')
  }
  const collect = async (suite: string, project: string | undefined, run: () => Promise<any>) => {
    console.log('benchmark suite ' + suite + (project ? ': ' + project : ''))
    try {
      const value = await run()
      results.push({ suite, project, ...value })
    } catch (error) { results.push({ suite, project, status: 'blocked', detail: String(error) }) }
    save()
  }
  const preparation = join(options.out, 'preparation')
  mkdirSync(preparation, { recursive: true })
  const prepared = await prepareCommunity({ ...options, out: preparation })
  const browsers = options.communityBrowserPreparedFile ? read(options.communityBrowserPreparedFile) : await prepareCommunityBrowsers(prepared, { ...options, out: preparation })
  const preparedFile = join(preparation, 'community-prepared.json'), browserFile = join(preparation, 'community-browser-prepared.json')
  writeFileSync(preparedFile, JSON.stringify(prepared, null, 2)); writeFileSync(browserFile, JSON.stringify(browsers, null, 2))
  const base = { ...options, communityPreparedFile: preparedFile, communityBrowserPreparedFile: browserFile, benchmarkRecordStore: join(options.out, 'records'), upstreamRunnerRoot }
  const resultSummary = (result: UnifiedSuiteResult, out: string) => ({ status: result.status, out, observations: result.observations.length, counts: Object.fromEntries([...new Set(result.observations.map(row => row.status))].map(status => [status, result.observations.filter(row => row.status === status).length])), gaps: result.gaps })
  for (const suite of chosen) {
    const out = join(options.out, suite)
    if (suite === 'community') await collect(suite, undefined, async () => {
      const value = await runProjectUpdates({ ...base, out })
      return { status: value.updates.some(item => item.record.status === 'failed') ? 'failed' : value.updates.some(item => item.record.status === 'blocked') ? 'blocked' : 'passed', out, attempt: value.attempt, projects: value.updates.map(item => ({ project: item.project, status: item.record.status, record: item.record.id })) }
    })
    else if (suite === 'docs') await collect(suite, undefined, async () => resultSummary(await runDocsBenchmark({ ...base, out }), out))
    else if (suite === 'fidelity') await collect(suite, undefined, async () => resultSummary(await runCommunityFidelitySuite({ ...base, out }), out))
    else if (suite === 'upstream-original') await collect(suite, 'mermaid-js/mermaid', async () => resultSummary(await runUpstreamOriginalSuite({ ...base, out }), out))
    else if (suite === 'native-fidelity' || suite === 'upstream-fidelity') for (const peer of prepared) await collect(suite, peer.node.id, async () => {
      const adapter = peer.node.benchmark?.adapter
      if (!['agentic', 'pele', 'mermaid'].includes(adapter ?? '')) return { status: 'unsupported', detail: 'No reviewed public-model projection for this artifact binding; SVG paint evidence is collected separately.' }
      const packageRoot = publicPackageRoot(peer)
      if (!packageRoot) throw Error(peer.error ?? 'No actual installed public package')
      const target = { ...base, out: join(out, encodeURIComponent(peer.node.id)), communityProjects: [peer.node.id], ...(adapter === 'agentic' ? { packageRoot } : adapter === 'pele' ? { portableArtifactRoot: packageRoot } : {}) }
      return resultSummary(await (suite === 'native-fidelity' ? runMermaidFidelitySuite(target) : runUpstreamFidelitySuite(target)), target.out)
    })
    else if (suite === 'portable') for (const peer of prepared) await collect(suite, peer.node.id, async () => {
      const adapter = peer.node.benchmark?.adapter
      if (!['agentic', 'pele', 'beautiful', 'ondine'].includes(adapter ?? '')) return { status: 'unsupported', detail: 'No reviewed portable Node SVG adapter for this artifact binding. Community/docs browser or CLI evidence remains separate.' }
      const packageRoot = publicPackageRoot(peer)
      if (!packageRoot || !peer.artifact?.module) throw Error(peer.error ?? 'No actual installed public Node entry')
      const targetOut = join(out, encodeURIComponent(peer.node.id))
      const result = await runPortable(parsePortableOptions(['--project', peer.node.id, '--artifact-root', packageRoot, '--entry', peer.artifact.module, '--adapter', adapter!, '--out', targetOut, '--records', join(base.benchmarkRecordStore, 'portable'), '--rounds', String(options.rounds), '--samples', options.profile === 'full' ? '31' : '1', '--cold-samples', options.profile === 'full' ? '20' : '1', '--allow-partial']))
      if (!('summary' in result)) throw Error('Portable measurement produced only a plan')
      return { status: result.summary.status === 'failed' ? 'failed' : result.summary.status !== 'measured' || result.summary.counts.completeSemanticCases !== result.summary.counts.positiveCases ? 'blocked' : 'passed', detail: `Portable qualification: ${result.summary.status}`, out: targetOut, counts: result.summary.counts }
    })
  }
  writeFileSync(join(options.out, 'completed.json'), JSON.stringify({ finishedAt: new Date().toISOString(), requestedSuites: chosen, completedSuiteBoundaries: results.length }))
  process.exitCode = results.some(value => value.status === 'failed') ? 1 : results.some(value => value.status === 'blocked') ? 2 : 0
  console.log('Campaign evidence: ' + join(options.out, 'report.md'))
}
if (import.meta.main) await main()
