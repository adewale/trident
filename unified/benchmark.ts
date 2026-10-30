import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { environmentIdentity } from '../portable/environment.ts'
import { executableIdentity } from './benchmark-context.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { runPortable, parsePortableOptions } from '../portable/run.ts'
import { FULL_SAMPLING } from '../portable/protocol.ts'
import { CollectionBudgetExhausted, checkCollectionBudget } from '../portable/checkpoint.ts'
import { writePilotSummary } from './pilot-summary.ts'
import { readBenchmarkDocument, stableValue, writeBenchmarkDocument } from '../portable/project-records.ts'
import { runCommunityFidelitySuite } from '../fidelity/community.ts'
import { runMermaidFidelitySuite } from './fidelity-suite.ts'
import { runUpstreamFidelitySuite } from './upstream-fidelity.ts'
import { runUpstreamOriginalSuite } from './upstream-fidelity-original.ts'
import { runDocsBenchmark } from './docs-benchmark.ts'
import { selectCommunityProjects } from './community.ts'
import type { PreparedCommunity } from './community-types.ts'
import { runIncrementalCommunitySuite } from './project-update.ts'
import { parseOptions } from './options.ts'
import { communityCatalogFile } from './trident-paths.ts'
import type { UnifiedSuiteResult } from './types.ts'
import { PUBLIC_SUITES, nativeAdapter, portableAdapter, portableBinding, projectSupport, type CatalogMember, type PublicSuite } from './support.ts'
import { comparisonProjects } from './lineage.ts'
import { campaignPlan } from './campaign-plan.ts'
import { loadCampaignPreparation, prepareCampaign } from './campaign-preparation.ts'
import { resolveReleaseCatalog } from './release-selection.ts'
import { protocolIdentity } from './protocol-identity.ts'

const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const PILOT_CASES = ['family:flowchart', 'scaling:class:128']
export function publicPackageRoot(peer: PreparedCommunity | undefined): string | undefined {
  if (!peer?.artifact) return undefined
  if (peer.artifact.root && existsSync(join(peer.artifact.root, 'package.json'))) return resolve(peer.artifact.root)
  if (!peer.artifact.module) return undefined
  let root = dirname(resolve(peer.artifact.module))
  while (root !== dirname(root)) { if (existsSync(join(root, 'package.json'))) return root; root = dirname(root) }
}

/** Prepare once, then collect/resume with one frozen manifest and shared budget. */
export async function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help')) {
    console.log(`bun commands.ts bench --projects OWNER/TOOL,... [--all-projects instead] --profile full --out DIR
  --plan                         inspect selection without acquisition or rendering
  --prepare [--cutoff UTC]        freeze release selection, artifacts and inputs only
  --pilot                        diagnostic flowchart/scaling pilot; never ecosystem scores
  --prepared FILE                use one preparation.json; no latest lookups
  --external-inputs FILE          separate frozen compatibility cohort, collected first
  --budget-minutes N --resume     add an explicitly recorded allowance to a paused campaign
  --suites ${PUBLIC_SUITES.join(',')}
  --rounds N --executable CHROMIUM --upstream-runner-root INSTALLED_VITEST_KIT
  --list --include-excluded-descendants
  --pilot-summary CONTROLLER_JSON --out DIR  reduce owning pilot reports without collection
Full portable sampling: ${FULL_SAMPLING.rounds} rounds, ${FULL_SAMPLING.samples} warm means and ${FULL_SAMPLING.coldSamples} fresh processes per replica/round/case. Missing bindings, failures and unqualified timing remain visible. Measurements run locally and serially. Budgets stop new work at collector checkpoints; active workers retain their deadlines.`)
    return
  }
  const forwarded: string[] = [], selected: string[] = [], seen = new Set<string>()
  let list = false, planOnly = false, allProjects = false, includeExcluded = false, prepareOnly = false, resume = false, pilotOnly = false
  let budgetMinutes: number | undefined, upstreamRunnerRoot: string | undefined, preparedFile: string | undefined, externalInputs: string | undefined, cutoff: string | undefined, pilot: string | undefined
  const take = (index: number) => { const value = argv[index + 1]; if (!value || value.startsWith('--')) throw Error('Missing value for ' + argv[index]); return value }
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]!
    if (seen.has(flag)) throw Error('Duplicate option ' + flag)
    seen.add(flag)
    if (flag === '--list') { list = true; continue }
    if (flag === '--plan') { planOnly = true; continue }
    if (flag === '--prepare') { prepareOnly = true; continue }
    if (flag === '--pilot') { pilotOnly = true; continue }
    if (flag === '--resume') { resume = true; continue }
    if (flag === '--include-excluded-descendants') { includeExcluded = true; continue }
    if (flag === '--all-projects') { allProjects = true; continue }
    if (flag === '--budget-minutes') { budgetMinutes = Number(take(index++)); if (!Number.isFinite(budgetMinutes) || budgetMinutes <= 0) throw Error('--budget-minutes requires a positive number'); continue }
    if (flag === '--suites') { selected.push(...take(index++).split(',')); continue }
    if (flag === '--upstream-runner-root') { upstreamRunnerRoot = resolve(take(index++)); continue }
    if (flag === '--prepared') { preparedFile = resolve(take(index++)); continue }
    if (flag === '--external-inputs') { externalInputs = resolve(take(index++)); continue }
    if (flag === '--cutoff') { cutoff = take(index++); continue }
    if (flag === '--pilot-summary') { pilot = resolve(take(index++)); continue }
    forwarded.push(flag === '--records' ? '--community-records' : flag)
    if (!['--community-force', '--allow-incomplete'].includes(flag)) forwarded.push(take(index++))
  }
  if (selected.some(id => !PUBLIC_SUITES.includes(id as PublicSuite)) || new Set(selected).size !== selected.length) throw Error('Unknown or duplicate suite')
  if (cutoff && (!Number.isFinite(Date.parse(cutoff)) || Date.parse(cutoff) > Date.now())) throw Error('Cutoff must be a valid past timestamp')
  if (!forwarded.includes('--profile')) forwarded.push('--profile', 'full')
  let options = parseOptions(forwarded)
  if (pilot) { console.log(JSON.stringify(writePilotSummary(pilot, options.out).counts)); return }
  const reportFile = join(options.out, 'report.json')
  if (resume && (!existsSync(reportFile) || prepareOnly || planOnly)) throw Error('--resume requires an existing campaign report and cannot prepare or plan')
  const previous = resume ? read(reportFile) : undefined
  if (previous) {
    if (previous.schema !== 'trident-campaign-v2') throw Error('This campaign predates resumable collection; retain it and start a new campaign')
    if (!previous.options || [...seen].some(flag => !['--resume', '--out', '--budget-minutes'].includes(flag))) throw Error('Resume keeps the recorded invocation; supply only --out and an optional --budget-minutes')
    options = { ...previous.options, out: options.out }
    preparedFile = previous.preparationFile
    upstreamRunnerRoot = previous.upstreamRunnerRoot
    includeExcluded = previous.includeExcluded ?? false
    pilotOnly = previous.pilot ?? false
  }
  if (preparedFile) {
    const frozen = loadCampaignPreparation(preparedFile)
    if (cutoff && cutoff !== frozen.manifest.cutoff) throw Error('A frozen preparation cannot change its release cutoff')
    if (seen.has('--profile') && options.profile !== frozen.manifest.profile || seen.has('--rounds') && options.rounds !== frozen.manifest.rounds) throw Error('A prepared campaign freezes sampling; create a new preparation for another profile')
    options = { ...options, ...frozen.options, profile: frozen.manifest.profile as 'smoke' | 'full', rounds: frozen.manifest.rounds, communityProjects: options.communityProjects ?? frozen.manifest.projects }
    externalInputs ??= frozen.externalInputs
    cutoff ??= frozen.manifest.cutoff ?? undefined
  }
  if (pilotOnly && selected.length) throw Error('--pilot selects its diagnostic portable cases; do not supply --suites')
  const chosen = previous?.requestedSuites ?? (pilotOnly ? ['portable'] : selected.length ? selected : [...PUBLIC_SUITES])
  if (allProjects && options.communityProjects && !preparedFile) throw Error('Use --projects or --all-projects, not both')
  if (!list && !options.communityProjects && !allProjects) throw Error('Choose --projects OWNER/TOOL,..., explicitly --all-projects, or --prepared before starting')
  let catalog = read(options.communityCatalogFile ?? communityCatalogFile)
  if (cutoff && !preparedFile && !options.communityPreparedFile && !planOnly && !list) {
    const resolved = await resolveReleaseCatalog(catalog, selectCommunityProjects(catalog.nodes, options.communityProjects).map(peer => peer.id), cutoff, join(options.out, 'preparation/registry'))
    catalog = resolved.catalog
    writeFileSync(join(options.out, 'preparation/registry/selection.json'), JSON.stringify({ cutoff, ledger: resolved.ledger }, null, 2))
  }
  let projects = selectCommunityProjects(catalog.nodes, options.communityProjects).map(peer => peer.id)
  if (list) { console.log(JSON.stringify({ suites: chosen, projects, profile: options.profile, rounds: options.rounds, support: catalog.nodes.filter((node: CatalogMember) => projects.includes(node.id)).map(projectSupport) }, null, 2)); return }
  const comparisonSelection = comparisonProjects(catalog, projects, includeExcluded)
  projects = comparisonSelection.included; options.communityProjects = projects
  if (!projects.length && !planOnly) throw Error('No projects remain after scope/lineage/branding exclusions or release skips: ' + comparisonSelection.excluded.map(node => node.project + ': ' + node.comparison).join('; '))
  const plan = { ...campaignPlan({ catalog, projects: catalog.nodes.filter((node: CatalogMember) => projects.includes(node.id)), suites: chosen as PublicSuite[], profile: options.profile, rounds: options.rounds, executable: options.executable, upstreamRunnerRoot, budgetMinutes, portableCaseIds: pilotOnly ? PILOT_CASES : undefined }), comparisonSelection, pilot: pilotOnly, portableCaseIds: pilotOnly ? PILOT_CASES : undefined }
  if (planOnly) { console.log(JSON.stringify(plan, null, 2)); return }
  options.executable ??= plan.tools.chromium ?? undefined
  assertBenchmarkExecutionAllowed()
  if (!resume && existsSync(reportFile)) throw Error('Choose a fresh campaign directory or --resume')
  mkdirSync(options.out, { recursive: true })
  const preparation = preparedFile && (resume || preparedFile === join(options.out, 'preparation.json')) ? loadCampaignPreparation(preparedFile) : await prepareCampaign(options, catalog, { cutoff, externalInputs, plan })
  preparedFile = resume ? preparedFile! : join(options.out, 'preparation.json')
  if (stableValue([...projects].sort()) !== stableValue([...preparation.manifest.projects].sort())) throw Error('Prepared project selection differs; use a new output directory for a subset study')
  const preparationSha256 = createHash('sha256').update(readFileSync(preparedFile)).digest('hex')
  if (previous && preparationSha256 !== previous.preparationSha256) throw Error('The resumed campaign preparation changed')
  if (stableValue(preparation.manifest.producers) !== stableValue(protocolIdentity(options.harnessRoot ?? options.root, ['unified/benchmark.ts']))) throw Error('Prepared collection producers changed; create a new preparation manifest')
  options = { ...options, ...preparation.options }
  externalInputs = preparation.externalInputs
  if (prepareOnly) { console.log('Prepared campaign: ' + preparedFile); return }
  const prepared = read(options.communityPreparedFile!) as PreparedCommunity[], browsers = read(options.communityBrowserPreparedFile!)
  const deadline = budgetMinutes !== undefined ? Date.now() + budgetMinutes * 60_000 : previous?.deadline
  const runtime = { environment: environmentIdentity(options.nodeExecutable ?? process.env.NODE_BIN ?? 'node'), driver: executableIdentity(process.execPath), browser: executableIdentity(options.executable ?? plan.tools.chromium ?? undefined),
    selectors: Object.fromEntries(['LD_LIBRARY_PATH', 'DISPLAY', 'FONTCONFIG_FILE', 'FONTCONFIG_PATH', 'LIBGL_ALWAYS_SOFTWARE', 'NODE_COMPILE_CACHE', 'UV_THREADPOOL_SIZE', 'NODE_BIN', 'BUN_BIN', 'BUN_OPTIONS', 'AM_BENCH_OBSERVER', 'MERMAID_REFERENCE_DIR', 'MERMAID_UPSTREAM_DIR', 'MERMAID_UPSTREAM_RUNNER_ROOT'].map(name => [name, process.env[name] ?? null])) }
  if (previous && stableValue(previous.runtime) !== stableValue(runtime)) throw Error('Resume runtime or environment changed; retain the old campaign and start a separate comparison')
  const windows = [...(previous?.windows ?? []), { startedAt: new Date().toISOString(), budgetMinutes: budgetMinutes ?? null, deadline: deadline ?? null }]
  const results: any[] = previous?.results ?? [], startedAt = previous?.startedAt ?? windows[0].startedAt
  const save = () => {
    const report = { schema: 'trident-campaign-v2', pilot: pilotOnly, includeExcluded, startedAt, updatedAt: new Date().toISOString(), projects, profile: options.profile, rounds: options.rounds, requestedSuites: chosen, options, preparationFile: preparedFile, preparationSha256, upstreamRunnerRoot, runtime, deadline, windows, results }
    writeFileSync(reportFile, JSON.stringify(report, null, 2))
    writeFileSync(join(options.out, 'report.md'), '# Public-artifact campaign\n\n' + `Profile ${options.profile}; ${options.rounds} rounds. Owning result tables are generated by results:snapshot.\n\n` + '| Suite | Cohort | Project | Status | Detail |\n|---|---|---|---|---|\n' + results.map(row => `| ${row.suite} | ${row.cohort ?? 'core'} | ${row.project ?? projects.join(', ')} | ${row.status} | ${String(row.detail ?? row.out ?? '').replaceAll('|', '/').replaceAll('\n', ' ')} |`).join('\n') + '\n')
  }
  const collect = async (suite: string, project: string | undefined, out: string, run: () => Promise<any>, cohort = 'core') => {
    const index = results.findIndex(row => row.suite === suite && row.project === project && (row.cohort ?? 'core') === cohort)
    if (index >= 0 && results[index].completed) return
    let value: any, launched = false
    const began = Date.now()
    try { checkCollectionBudget(deadline); launched = true; value = { ...await run(), completed: true } }
    catch (error) { value = { status: 'blocked', detail: String(error), ...(error instanceof CollectionBudgetExhausted ? { completed: false, disposition: 'budget-exhausted' } : { completed: true }) } }
    const row = { suite, project, cohort, out, launched, elapsedSeconds: (Date.now() - began) / 1000, ...(cohort.startsWith('pilot:') ? { caseId: cohort.slice(6) } : {}), ...value }
    if (index >= 0) results[index] = row; else results.push(row)
    save()
  }
  const base = { ...options, collectionDeadline: deadline, collectionResume: resume, benchmarkRecordStore: join(options.out, 'records'), fidelityZenumlRoot: browsers.find((peer: any) => peer.node.id === 'mermaid-js/mermaid')?.browser?.zenuml?.root, upstreamRunnerRoot }
  const resultSummary = (result: UnifiedSuiteResult, out: string) => {
    mkdirSync(out, { recursive: true })
    if (!existsSync(join(out, 'result.json'))) writeBenchmarkDocument(join(out, 'result.json'), result)
    return { status: result.status, out, observations: result.observations.length, counts: Object.fromEntries([...new Set(result.observations.map(row => row.status))].map(status => [status, result.observations.filter(row => row.status === status).length])), gaps: result.gaps }
  }
  const compatibility = async (out: string, inputs: string, cohort: string) => {
    const community = await runIncrementalCommunitySuite({ ...base, out, communityInputsFile: inputs, communityRecordStore: options.communityRecordStore ?? join(options.out, 'project-records', cohort) })
    const cli = readBenchmarkDocument(join(out, 'retained-cli-suite.json')) as UnifiedSuiteResult
    return resultSummary({ ...community, status: [community.status, cli.status].includes('failed') ? 'failed' : [community.status, cli.status].includes('blocked') ? 'blocked' : community.status,
      observations: [...community.observations, ...cli.observations], gaps: [...community.gaps, ...cli.gaps] }, out)
  }
  save()
  if (externalInputs && chosen.includes('community')) {
    const out = join(options.out, 'community-external')
    await collect('community', undefined, out, () => compatibility(out, externalInputs!, 'external'), 'external')
  }
  for (const suite of chosen) {
    const out = join(options.out, suite)
    if (suite === 'community') await collect(suite, undefined, out, () => compatibility(out, options.communityInputsFile!, 'core'))
    else if (suite === 'docs') await collect(suite, undefined, out, async () => resultSummary(await runDocsBenchmark({ ...base, out }), out))
    else if (suite === 'fidelity') await collect(suite, undefined, out, async () => resultSummary(await runCommunityFidelitySuite({ ...base, out }), out))
    else if (suite === 'upstream-original') await collect(suite, 'mermaid-js/mermaid', out, async () => resultSummary(await runUpstreamOriginalSuite({ ...base, out }), out))
    else if (suite === 'native-fidelity' || suite === 'upstream-fidelity') for (const peer of prepared) {
      const targetOut = join(out, encodeURIComponent(peer.node.id))
      await collect(suite, peer.node.id, targetOut, async () => {
        if (!nativeAdapter(peer.node)) return { status: 'blocked', disposition: 'adapter-missing', detail: 'No reviewed public-model projection for this binding; no project capability failure is inferred.' }
        const packageRoot = publicPackageRoot(peer)
        if (!packageRoot) throw Error(peer.error ?? 'No installed public package')
        const target = { ...base, out: targetOut, communityProjects: [peer.node.id], ...(peer.node.benchmark?.adapter === 'agentic' ? { packageRoot } : peer.node.benchmark?.adapter === 'pele' ? { portableArtifactRoot: packageRoot } : {}) }
        return resultSummary(await (suite === 'native-fidelity' ? runMermaidFidelitySuite(target) : runUpstreamFidelitySuite(target)), targetOut)
      })
    }
    else if (suite === 'portable') {
      const peers = pilotOnly ? prepared.filter(peer => portableAdapter(peer.node)).sort((a, b) => {
        const hash = (id: string) => createHash('sha256').update('ecosystem-b0-pilot:' + id).digest('hex')
        return hash(a.node.id).localeCompare(hash(b.node.id))
      }) : prepared
      const units = pilotOnly ? PILOT_CASES.flatMap(caseId => peers.map(peer => ({ peer, caseId }))) : peers.map(peer => ({ peer, caseId: undefined }))
      for (const { peer, caseId } of units) {
      const targetOut = join(out, encodeURIComponent(peer.node.id), ...(caseId ? [encodeURIComponent(caseId)] : []))
      await collect(suite, peer.node.id, targetOut, async () => {
        const adapter = portableAdapter(peer.node)
        if (!adapter) return { status: peer.node.outputs.includes('svg') ? 'blocked' : 'unsupported', disposition: peer.node.outputs.includes('svg') ? 'adapter-missing' : 'project-unsupported', detail: 'No reviewed portable Node SVG binding.' }
        const packageRoot = publicPackageRoot(peer)
        if (!packageRoot || !peer.artifact?.module) throw Error(peer.error ?? 'No installed public Node entry')
        const sampling = options.profile === 'full' ? FULL_SAMPLING : { samples: 1, coldSamples: 1 }
        const portable = parsePortableOptions(['--project', peer.node.id, '--artifact-root', packageRoot, '--entry', peer.artifact.module, '--adapter', adapter, ...(adapter === 'declared' ? ['--binding', JSON.stringify(portableBinding(peer.node))] : []), ...(adapter === 'public-package' ? ['--public-config', JSON.stringify(peer.node.benchmark)] : []), '--node', options.nodeExecutable ?? process.env.NODE_BIN ?? 'node', '--out', targetOut, '--records', join(base.benchmarkRecordStore, 'portable'), '--rounds', String(options.rounds), '--samples', String(sampling.samples), '--cold-samples', String(sampling.coldSamples), '--allow-partial'])
        if (caseId) portable.caseIds = [caseId]
        const result = await runPortable({ ...portable, collectionDeadline: deadline, resume })
        if (!('summary' in result)) throw Error('Portable collector returned only a plan')
        return { status: result.status === 'incomplete' ? 'blocked' : result.status, detail: `Portable qualification: ${result.summary.status}`, counts: result.summary.counts }
      }, caseId ? 'pilot:' + caseId : 'core')
      }
    }
  }
  const incomplete = results.some(row => !row.completed)
  writeFileSync(join(options.out, incomplete ? 'incomplete.json' : 'completed.json'), JSON.stringify({ finishedAt: new Date().toISOString(), completedBoundaries: results.filter(row => row.completed).length, pausedBoundaries: results.filter(row => !row.completed).length, windows }))
  if (!incomplete && existsSync(join(options.out, 'incomplete.json'))) (await import('node:fs')).unlinkSync(join(options.out, 'incomplete.json'))
  process.exitCode = results.some(value => value.status === 'failed') ? 1 : results.some(value => value.status === 'blocked') ? 2 : 0
  if (pilotOnly) writePilotSummary(reportFile, options.out)
  console.log('Campaign evidence: ' + join(options.out, 'report.md'))
}
if (import.meta.main) await main()
