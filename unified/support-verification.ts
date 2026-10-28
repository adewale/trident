import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { parseOptions } from './options.ts'
import { communityModuleOutputSupported, prepareCommunity, runCommunityNodeRound, runCommunityCli, verifyProvidedCommunityArtifact, verifyFrozenBrowserEngine } from './community.ts'
import { runCommunityBrowserSuite, type PreparedCommunityBrowser } from './community-browser.ts'
import { runExternalCommunity } from './community-external.ts'
import { outputName, readCatalog } from './support.ts'
import { packageCliVariants } from './community-cli.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { communityProtocolIdentity } from './community-protocol-identity.ts'
import { harnessRepository } from './trident-paths.ts'
import { communityCatalogFile } from './trident-paths.ts'
import type { PreparedCommunity } from './community-types.ts'
import type { BenchmarkObservation, UnifiedWorkload } from './types.ts'
import { assertMermaidOracle, assertOracleAgrees } from '../portable/mermaid-oracle.ts'

export const SUPPORT_VERIFICATION_PROTOCOL = 'public-output-contract-verification-v1'
export const supportWorkloads: UnifiedWorkload[] = [
  { id: 'support:flowchart', family: 'flowchart', source: 'flowchart LR\nA[Alpha] --> B[Beta]', expectedLabels: ['Alpha', 'Beta'], features: [], provenance: 'Independent authored two-node output admission' },
  { id: 'support:sequence', family: 'sequence', source: 'sequenceDiagram\nparticipant A as Alpha\nparticipant B as Beta\nA->>B: Request', expectedLabels: ['Alpha', 'Beta', 'Request'], features: [], provenance: 'Independent authored message output admission' },
  { id: 'support:class', family: 'class', source: 'classDiagram\nclass Alpha\nclass Beta\nAlpha --> Beta: uses', expectedLabels: ['Alpha', 'Beta', 'uses'], features: [], provenance: 'Independent authored class output admission' },
  { id: 'support:state', family: 'state', source: 'stateDiagram-v2\nstate "Alpha" as A\nstate "Beta" as B\nA --> B: advance', expectedLabels: ['Alpha', 'Beta', 'advance'], features: [], provenance: 'Independent authored state output admission' },
  { id: 'support:er', family: 'er', source: 'erDiagram\nALPHA ||--o{ BETA : owns', expectedLabels: ['ALPHA', 'BETA', 'owns'], features: [], provenance: 'Independent authored relationship output admission' },
  { id: 'support:pie', family: 'pie', source: 'pie\n"Alpha":7\n"Beta":3', expectedLabels: ['Alpha', 'Beta'], features: [], provenance: 'Independent authored numeric output admission' },
]
export function partitionVerificationRows(rows: BenchmarkObservation[]) {
  const ids = new Set(supportWorkloads.map(workload => workload.id))
  const clean: BenchmarkObservation[] = rows.map(({ samplesMs: _samples, ...row }) => ({ ...row, metrics: { ...Object.fromEntries(Object.entries(row.metrics ?? {}).filter(([key]) => ['implementation', 'outputFile', 'apiBoundary', 'rejected', 'diagnosticAdmissionFailed', 'parserAdmissionFailed', 'diagnosticsCount', 'diagnosticAccepted', 'workerAttempt'].includes(key))), verification: SUPPORT_VERIFICATION_PROTOCOL }, mode: 'output-contract-verification' }))
  const observations = clean.filter(row => ids.has(row.caseId)), controls = clean.filter(row => !ids.has(row.caseId))
  const duplicateCaseIds = [...ids].filter(id => observations.filter(row => row.caseId === id).length > 1)
  const passed = duplicateCaseIds.length ? 0 : [...ids].filter(id => observations.some(row => row.caseId === id && row.status === 'passed')).length
  return { plannedInputs: supportWorkloads.length, passed, recordedInputObservations: observations.length, duplicateCaseIds, observations, controls }
}
/** Preparation is explicit and separate. An admitted call is not a complete
 * family/paint/model qualification and never supplies a performance score. */
export async function verifySupport(preparedFile: string, out: string, settings: { projects?: string[]; catalog?: string; browserPrepared?: string; executable?: string } = {}) {
  if (existsSync(out)) throw Error('Support verification output must be fresh')
  const catalog = readCatalog(settings.catalog ?? communityCatalogFile)
  if (settings.projects?.some(id => !catalog.nodes.some(node => node.id === id)) || (settings.projects && new Set(settings.projects).size !== settings.projects.length)) throw Error('Choose unique known catalog projects')
  const supplied = JSON.parse(readFileSync(preparedFile, 'utf8')) as PreparedCommunity[]
  if (!Array.isArray(supplied) || new Set(supplied.map(entry => entry.node.id)).size !== supplied.length) throw Error('Prepared projects must be unique')
  await assertOracleAgrees(assertMermaidOracle(), supportWorkloads.map(workload => ({ id: workload.id, source: workload.source, accept: true })))
  mkdirSync(out, { recursive: true })
  const browserPrepared = settings.browserPrepared ? JSON.parse(readFileSync(settings.browserPrepared, 'utf8')) as PreparedCommunityBrowser[] : []
  if (!Array.isArray(browserPrepared) || new Set(browserPrepared.map(peer => peer.node.id)).size !== browserPrepared.length) throw Error('Prepared browser projects must be unique')
  const producers = [...new Set([...communityProtocolIdentity(), ...protocolIdentity(harnessRepository, ['unified/support-verification.ts', 'unified/declared-adapter.mjs', 'unified/failure-outputs.ts'])])].sort()
  const projects: any[] = []
  const selected = catalog.nodes.filter(node => !settings.projects || settings.projects.includes(node.id))
  const preparation = join(out, 'preparation'); mkdirSync(preparation)
  const prepared = await prepareCommunity(parseOptions(['--out', preparation, '--community-catalog', settings.catalog ?? communityCatalogFile, '--community-projects', selected.map(node => node.id).join(','), '--community-prepared', preparedFile]))
  const save = () => writeFileSync(join(out, 'report.json'), JSON.stringify({ protocol: SUPPORT_VERIFICATION_PROTOCOL, producers, catalogSha256: createHash('sha256').update(readFileSync(settings.catalog ?? communityCatalogFile)).digest('hex'), generatedAt: new Date().toISOString(), preparedSha256: createHash('sha256').update(readFileSync(preparedFile)).digest('hex'), plannedProjects: selected.length, completedProjects: projects.length, workloads: supportWorkloads, projects, limits: 'Six authored output-admission inputs per bound format. No timing comparisons, full family support, model/paint completeness or overall top-tier support is inferred. Missing bindings and artifacts remain gaps.' }, null, 2) + '\n')
  save()
  for (const node of selected) {
    const entry = prepared.find(entry => entry.node.id === node.id)
    const project: any = { project: node.id, state: 'blocked', version: entry?.artifact?.version ?? null, declaredOutputs: node.outputs.map(outputName), boundOutputs: (node.benchmark?.outputs ?? []).map(outputName), outputs: [], gaps: [] }
    projects.push(project)
    if (!entry?.artifact) { project.gaps.push(entry?.error ?? 'No admitted artifact or adapter supplied'); save(); continue }
    try {
      if (JSON.stringify(entry.node.benchmark) !== JSON.stringify(node.benchmark)) throw Error('Prepared public binding differs from the catalog')
      verifyProvidedCommunityArtifact(entry.artifact)
      const dir = join(out, encodeURIComponent(node.id)); mkdirSync(dir)
      for (const output of project.boundOutputs) {
        const target = join(dir, output); mkdirSync(target)
        const options = parseOptions(['--out', target, '--profile', 'smoke', '--rounds', '1'])
        let rows: BenchmarkObservation[]
        if (entry.artifact.kind === 'cli') {
          if (entry.artifact.format && entry.artifact.format !== output && !entry.artifact.outputBindings?.[output]) {
            project.outputs.push({ output, state: 'adapter-missing', reason: 'No public command binding for this declared format' }); continue
          }
          rows = supportWorkloads.map(workload => runCommunityCli(entry, output, workload, 1, target))
        } else if (['jsonl-worker', 'python'].includes(entry.artifact.kind)) rows = await runExternalCommunity(entry, supportWorkloads, output, 1, options)
        else if (!communityModuleOutputSupported(node, output)) { project.outputs.push({ output, state: 'other-transport-required', reason: 'The reviewed module transport does not expose this output; no unsupported invocation is attempted' }); continue }
        else rows = await runCommunityNodeRound(entry, output, supportWorkloads, 1, options)
        const facts = partitionVerificationRows(rows)
        project.outputs.push({ output, state: facts.passed ? 'invocation-verified' : facts.observations.every(row => row.status === 'blocked') ? 'blocked' : 'no-positive-witness', ...facts })
      }
      for (const variant of packageCliVariants([entry])) {
        if (variant.error) { project.gaps.push('Public CLI preparation: ' + variant.error); continue }
        verifyProvidedCommunityArtifact(variant.prepared.artifact!)
        for (const output of variant.outputs) {
          const target = join(dir, 'cli-' + output); mkdirSync(target)
          const facts = partitionVerificationRows(supportWorkloads.map(workload => runCommunityCli(variant.prepared, output, workload, 1, target)))
          project.outputs.push({ output, transport: 'public-package-cli', state: facts.passed ? 'invocation-verified' : 'no-positive-witness', ...facts })
        }
        verifyProvidedCommunityArtifact(variant.prepared.artifact!)
      }
      const browser = browserPrepared.find(peer => peer.node.id === node.id)
      if (browser?.browserStatus === 'prepared') {
        if (JSON.stringify(browser.node.benchmark) !== JSON.stringify(node.benchmark) || ['version', 'revision', 'module', 'sha256', 'integrity'].some(key => (browser.artifact as any)?.[key] !== (entry.artifact as any)?.[key])) throw Error('Browser and source artifact identities differ')
        verifyFrozenBrowserEngine(browser)
        const target = join(dir, 'browser'); mkdirSync(target)
        const browserResult = await runCommunityBrowserSuite([browser], supportWorkloads, { ...parseOptions(['--out', target, '--profile', 'smoke', '--rounds', '1']), executable: settings.executable })
        const formats = [...new Set(browserResult.observations.filter(row => supportWorkloads.some(workload => workload.id === row.caseId)).map(row => row.format))]
        for (const output of formats) {
          const facts = partitionVerificationRows(browserResult.observations.filter(row => row.format === output))
          project.outputs.push({ output, transport: 'browser', state: facts.passed ? 'invocation-verified' : facts.observations.every(row => row.status === 'blocked') ? 'blocked' : 'no-positive-witness', ...facts })
        }
        verifyFrozenBrowserEngine(browser)
      } else if (browser?.browserStatus === 'blocked') project.gaps.push('Browser preparation: ' + browser.browserDetail)
      verifyProvidedCommunityArtifact(entry.artifact)
      project.gaps.push(...project.declaredOutputs.filter((output: string) => !project.boundOutputs.includes(output)).map((output: string) => 'Declared output has no binding: ' + output))
      project.state = project.outputs.some((output: any) => output.state === 'invocation-verified') ? 'partially-verified' : 'blocked'
    } catch (error) { project.gaps.push(String(error)) }
    save()
    console.log(JSON.stringify({ project: node.id, state: project.state, outputs: project.outputs.map((output: any) => ({ output: output.output, state: output.state, passed: output.passed })) }))
  }
  return { out, projects: projects.length }
}
if (import.meta.main) {
  const args = process.argv.slice(2), values = new Map<string, string>()
  if (args.length === 1 && args[0] === '--help') console.log('support:verify --prepared FILE --out FRESH_DIRECTORY [--projects ID,...] [--catalog FILE] [--browser-prepared FILE] [--executable CHROMIUM]\nVerify public output invocations from supplied admitted artifacts; no acquisition or timing scores. Defaults to every catalog entity, retaining gaps.')
  else {
    for (let index = 0; index < args.length; index += 2) { const key = args[index]!, value = args[index + 1]; if (!['--prepared', '--out', '--projects', '--catalog', '--browser-prepared', '--executable'].includes(key) || !value || value.startsWith('--') || values.has(key)) throw Error('Use support:verify --prepared FILE --out FRESH_DIRECTORY'); values.set(key, value) }
    if (!values.has('--prepared') || !values.has('--out')) throw Error('Supply --prepared and --out')
    console.log(JSON.stringify(await verifySupport(resolve(values.get('--prepared')!), resolve(values.get('--out')!), { projects: values.get('--projects')?.split(','), catalog: values.get('--catalog'), browserPrepared: values.get('--browser-prepared'), executable: values.get('--executable') })))
  }
}
