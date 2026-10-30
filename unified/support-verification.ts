import { releaseBenchmarkSkip } from './benchmark-skip.ts'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { parseOptions } from './options.ts'
import { communityModuleOutputSupported, prepareCommunity, runCommunityNodeRound, runCommunityCli, verifyProvidedCommunityArtifact, verifyFrozenBrowserEngine } from './community.ts'
import { runCommunityBrowserSuite, type PreparedCommunityBrowser } from './community-browser.ts'
import { runExternalCommunity } from './community-external.ts'
import { coreScopeReason, outputName, readCatalog } from './support.ts'
import { packageCliVariants } from './community-cli.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { communityProtocolIdentity } from './community-protocol-identity.ts'
import { harnessRepository } from './trident-paths.ts'
import { communityCatalogFile } from './trident-paths.ts'
import type { PreparedCommunity } from './community-types.ts'
import type { BenchmarkObservation, UnifiedWorkload } from './types.ts'
import { assertMermaidOracle, assertOracleAgrees } from '../portable/mermaid-oracle.ts'

export const SUPPORT_VERIFICATION_PROTOCOL = 'public-output-contract-verification-v2'
export const supportWorkloads: UnifiedWorkload[] = [
  { id: 'support:flowchart', expectedRelationships: [{ from: 'Alpha', to: 'Beta' }], family: 'flowchart', source: 'flowchart LR\nA[Alpha] --> B[Beta]', expectedLabels: ['Alpha', 'Beta'], features: [], provenance: 'Independent authored two-node output admission' },
  { id: 'support:sequence', expectedRelationships: [{ from: 'Alpha', to: 'Beta', label: 'Request' }], family: 'sequence', source: 'sequenceDiagram\nparticipant A as Alpha\nparticipant B as Beta\nA->>B: Request', expectedLabels: ['Alpha', 'Beta', 'Request'], features: [], provenance: 'Independent authored message output admission' },
  { id: 'support:class', expectedRelationships: [{ from: 'Alpha', to: 'Beta', label: 'uses' }], family: 'class', source: 'classDiagram\nclass Alpha\nclass Beta\nAlpha --> Beta: uses', expectedLabels: ['Alpha', 'Beta', 'uses'], features: [], provenance: 'Independent authored class output admission' },
  { id: 'support:state', family: 'state', source: 'stateDiagram-v2\nstate "Alpha" as A\nstate "Beta" as B\nA --> B: advance', expectedLabels: ['Alpha', 'Beta', 'advance'], features: [], provenance: 'Independent authored state output admission' },
  { id: 'support:er', expectedRelationships: [{ from: 'ALPHA', to: 'BETA', label: 'owns' }], family: 'er', source: 'erDiagram\nALPHA ||--o{ BETA : owns', expectedLabels: ['ALPHA', 'BETA', 'owns'], features: [], provenance: 'Independent authored relationship output admission' },
  { id: 'support:pie', family: 'pie', source: 'pie\n"Alpha":7\n"Beta":3', expectedLabels: ['Alpha', 'Beta'], features: [], provenance: 'Independent authored numeric output admission' },
]
export const supportControls: UnifiedWorkload[] = [
  { id: 'support:negative-header', family: 'invalid-source', source: 'This is deliberately not a Mermaid diagram. @@@ {{{', features: [], provenance: 'Independent malformed-header output control', intent: 'negative-admission' },
  { id: 'support:negative-flowchart', family: 'flowchart', source: 'flowchart LR\n --> -->', features: [], provenance: 'Independent malformed flowchart output control', intent: 'negative-admission' },
]
function normalizeSupportControl(row: BenchmarkObservation): BenchmarkObservation {
  if (!supportControls.some(control => control.id === row.caseId)) return row
  const status = row.metrics?.pngReturned === true ? 'failed'
    : row.status === 'blocked' ? 'blocked'
    : row.metrics?.rejected === true ? 'passed'
    : row.metrics?.rejected === false || row.metrics?.expectedAccepted === false && row.status === 'failed' || row.status === 'passed' ? 'failed'
    : 'blocked'
  return { ...row, operation: 'negative-admission', status, detail: status === 'passed' ? 'Public operation rejected the independently invalid source' : status === 'failed' ? 'Public operation accepted the independently invalid source' : row.detail ?? 'Source rejection could not be established' }
}
export function partitionVerificationRows(rows: BenchmarkObservation[]) {
  const ids = new Set(supportWorkloads.map(workload => workload.id))
  const clean: BenchmarkObservation[] = rows.map(normalizeSupportControl).map(({ samplesMs: _samples, ...row }) => ({ ...row, metrics: { ...Object.fromEntries(Object.entries(row.metrics ?? {}).filter(([key]) => ['implementation', 'outputFile', 'apiBoundary', 'rejected', 'diagnosticAdmissionFailed', 'parserAdmissionFailed', 'diagnosticsCount', 'diagnosticAccepted', 'workerAttempt', 'qualification', 'boundary', 'failureStage', 'pngReturned'].includes(key))), verification: SUPPORT_VERIFICATION_PROTOCOL }, mode: 'output-contract-verification' }))
  const observations = clean.filter(row => ids.has(row.caseId)), controls = clean.filter(row => !ids.has(row.caseId))
  const duplicateCaseIds = [...ids].filter(id => observations.filter(row => row.caseId === id).length > 1)
  const passed = duplicateCaseIds.length ? 0 : [...ids].filter(id => observations.some(row => row.caseId === id && row.status === 'passed')).length
  const negative = controls.filter(row => supportControls.some(control => control.id === row.caseId))
  const duplicateControlIds = supportControls.filter(control => negative.filter(row => row.caseId === control.id).length > 1).map(control => control.id)
  const controlCounts = { planned: supportControls.length, passed: 0, failed: 0, blocked: 0, missing: 0 }
  for (const control of supportControls) {
    const own = negative.filter(row => row.caseId === control.id)
    if (!own.length) controlCounts.missing++
    else if (own.length !== 1) controlCounts.blocked++
    else if (own[0]!.status === 'passed') controlCounts.passed++
    else if (own[0]!.status === 'failed') controlCounts.failed++
    else controlCounts.blocked++
  }
  const controlState = controlCounts.failed ? 'failed' : controlCounts.blocked || controlCounts.missing ? 'incomplete' : 'verified'
  return { plannedInputs: supportWorkloads.length, passed, controlState, controlCounts, duplicateControlIds, recordedInputObservations: observations.length, duplicateCaseIds, observations, controls }
}
/** Preparation is explicit and separate. An admitted call is not a complete
 * family/paint/model qualification and never supplies a performance score. */
export async function verifySupport(preparedFile: string, out: string, settings: { projects?: string[]; catalog?: string; browserPrepared?: string; executable?: string } = {}) {
  if (existsSync(out)) throw Error('Support verification output must be fresh')
  const catalog = readCatalog(settings.catalog ?? communityCatalogFile)
  if (settings.projects?.some(id => !catalog.nodes.some(node => node.id === id)) || (settings.projects && new Set(settings.projects).size !== settings.projects.length)) throw Error('Choose unique known catalog projects')
  const requested = catalog.nodes.filter(node => !settings.projects || settings.projects.includes(node.id))
  const excluded = requested.filter(node => coreScopeReason(node))
  if (settings.projects && excluded.length) throw Error('Projects are outside core support verification: ' + excluded.map(node => node.id + ': ' + coreScopeReason(node)).join('; '))
  const skipped = requested.filter(node => releaseBenchmarkSkip(node))
  if (settings.projects && skipped.length) throw Error('Benchmark release skipped: ' + skipped.map(node => node.id + ': ' + releaseBenchmarkSkip(node)!.reason).join('; '))
  const selected = requested.filter(node => !excluded.includes(node) && !skipped.includes(node))
  if (!selected.length) throw Error('No renderer projects remain for core support verification')
  const supplied = JSON.parse(readFileSync(preparedFile, 'utf8')) as PreparedCommunity[]
  if (!Array.isArray(supplied) || new Set(supplied.map(entry => entry.node.id)).size !== supplied.length) throw Error('Prepared projects must be unique')
  await assertOracleAgrees(assertMermaidOracle(), [...supportWorkloads.map(workload => ({ id: workload.id, source: workload.source, accept: true })), ...supportControls.map(workload => ({ id: workload.id, source: workload.source, accept: false }))])
  mkdirSync(out, { recursive: true })
  const browserPrepared = settings.browserPrepared ? JSON.parse(readFileSync(settings.browserPrepared, 'utf8')) as PreparedCommunityBrowser[] : []
  if (!Array.isArray(browserPrepared) || new Set(browserPrepared.map(peer => peer.node.id)).size !== browserPrepared.length) throw Error('Prepared browser projects must be unique')
  const producers = [...new Set([...communityProtocolIdentity(), ...protocolIdentity(harnessRepository, ['unified/support-verification.ts', 'unified/declared-adapter.mjs', 'unified/failure-outputs.ts'])])].sort()
  const projects: any[] = []
  const preparation = join(out, 'preparation'); mkdirSync(preparation)
  const prepared = await prepareCommunity(parseOptions(['--out', preparation, '--community-catalog', settings.catalog ?? communityCatalogFile, '--community-projects', selected.map(node => node.id).join(','), '--community-prepared', preparedFile]))
  const save = () => writeFileSync(join(out, 'report.json'), JSON.stringify({ protocol: SUPPORT_VERIFICATION_PROTOCOL, producers, catalogSha256: createHash('sha256').update(readFileSync(settings.catalog ?? communityCatalogFile)).digest('hex'), generatedAt: new Date().toISOString(), preparedSha256: createHash('sha256').update(readFileSync(preparedFile)).digest('hex'), plannedProjects: selected.length, completedProjects: projects.length, workloads: supportWorkloads, negativeControls: supportControls, projects, limits: 'Six authored positive inputs and two independent invalid-source controls per bound format. Raster decoding/content supplies no label or topology credit. No timing comparisons, full family support, model/paint completeness or overall top-tier support is inferred. Missing bindings and artifacts remain gaps.' }, null, 2) + '\n')
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
          rows = [...supportWorkloads, ...supportControls].map(workload => runCommunityCli(entry, output, workload, 1, target))
        } else if (['jsonl-worker', 'python'].includes(entry.artifact.kind)) rows = await runExternalCommunity(entry, [...supportWorkloads, ...supportControls], output, 1, options)
        else if (!communityModuleOutputSupported(node, output)) { project.outputs.push({ output, state: 'other-transport-required', reason: 'The reviewed module transport does not expose this output; no unsupported invocation is attempted' }); continue }
        else rows = await runCommunityNodeRound(entry, output, [...supportWorkloads, ...supportControls], 1, options)
        const facts = partitionVerificationRows(rows)
        project.outputs.push({ output, state: facts.passed ? 'invocation-verified' : facts.observations.every(row => row.status === 'blocked') ? 'blocked' : 'no-positive-witness', ...facts })
      }
      for (const variant of packageCliVariants([entry])) {
        if (variant.error) { project.gaps.push('Public CLI preparation: ' + variant.error); continue }
        verifyProvidedCommunityArtifact(variant.prepared.artifact!)
        for (const output of variant.outputs) {
          const target = join(dir, 'cli-' + output); mkdirSync(target)
          const facts = partitionVerificationRows([...supportWorkloads, ...supportControls].map(workload => runCommunityCli(variant.prepared, output, workload, 1, target)))
          project.outputs.push({ output, transport: variant.variant === 'node-cli' ? 'public-package-cli' : 'public-release-cli', artifact: { version: variant.prepared.artifact!.version, revision: variant.prepared.artifact!.revision, sha256: variant.prepared.artifact!.sha256 }, state: facts.passed ? 'invocation-verified' : 'no-positive-witness', ...facts })
        }
        verifyProvidedCommunityArtifact(variant.prepared.artifact!)
      }
      const browser = browserPrepared.find(peer => peer.node.id === node.id)
      if (browser?.browserStatus === 'prepared') {
        if (JSON.stringify(browser.node.benchmark) !== JSON.stringify(node.benchmark) || ['version', 'revision', 'module', 'sha256', 'integrity'].some(key => (browser.artifact as any)?.[key] !== (entry.artifact as any)?.[key])) throw Error('Browser and source artifact identities differ')
        verifyFrozenBrowserEngine(browser)
        const target = join(dir, 'browser'); mkdirSync(target)
        const controls = supportControls
        const browserResult = await runCommunityBrowserSuite([browser], [...supportWorkloads, ...controls], { ...parseOptions(['--out', target, '--profile', 'smoke', '--rounds', '1']), executable: settings.executable })
        const formats = [...new Set(browserResult.observations.filter(row => supportWorkloads.some(workload => workload.id === row.caseId)).map(row => row.format))]
        for (const output of formats) {
          const facts = partitionVerificationRows(browserResult.observations.filter(row => row.format === output).map(row => controls.some(control => control.id === row.caseId) ? { ...row, operation: 'negative-admission' } : row))
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
