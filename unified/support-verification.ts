import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { parseOptions } from './options.ts'
import { prepareCommunity, runCommunityNodeRound, runCommunityCli, verifyProvidedCommunityArtifact } from './community.ts'
import { runExternalCommunity } from './community-external.ts'
import { outputName, readCatalog } from './support.ts'
import { protocolIdentity } from './protocol-identity.ts'
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
/** Preparation is explicit and separate. An admitted call is not a complete
 * family/paint/model qualification and never supplies a performance score. */
export async function verifySupport(preparedFile: string, out: string, settings: { projects?: string[]; catalog?: string } = {}) {
  if (existsSync(out)) throw Error('Support verification output must be fresh')
  const catalog = readCatalog(settings.catalog ?? communityCatalogFile)
  if (settings.projects?.some(id => !catalog.nodes.some(node => node.id === id)) || (settings.projects && new Set(settings.projects).size !== settings.projects.length)) throw Error('Choose unique known catalog projects')
  const supplied = JSON.parse(readFileSync(preparedFile, 'utf8')) as PreparedCommunity[]
  if (!Array.isArray(supplied) || new Set(supplied.map(entry => entry.node.id)).size !== supplied.length) throw Error('Prepared projects must be unique')
  await assertOracleAgrees(assertMermaidOracle(), supportWorkloads.map(workload => ({ id: workload.id, source: workload.source, accept: true })))
  mkdirSync(out, { recursive: true })
  const producers = protocolIdentity(harnessRepository, ['unified/support-verification.ts'])
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
        else if (node.benchmark?.adapter === 'mermaid' && output === 'svg') { project.outputs.push({ output, state: 'browser-required', reason: 'Public SVG requires browser geometry; Node/jsdom is not substituted' }); continue }
        else rows = await runCommunityNodeRound(entry, output, supportWorkloads, 1, options)
        const observations = rows.map(({ samplesMs: _samples, ...row }) => ({ ...row, metrics: { implementation: node.id, verification: SUPPORT_VERIFICATION_PROTOCOL }, mode: 'output-contract-verification' }))
        const passed = observations.filter(row => row.status === 'passed').length
        project.outputs.push({ output, state: passed ? 'invocation-verified' : 'no-positive-witness', plannedInputs: supportWorkloads.length, passed, observations })
      }
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
  if (args.length === 1 && args[0] === '--help') console.log('support:verify --prepared FILE --out FRESH_DIRECTORY [--projects ID,...] [--catalog FILE]\nVerify public output invocations from supplied admitted artifacts; no acquisition or timing scores. Defaults to every catalog entity, retaining gaps.')
  else {
    for (let index = 0; index < args.length; index += 2) { const key = args[index]!, value = args[index + 1]; if (!['--prepared', '--out', '--projects', '--catalog'].includes(key) || !value || value.startsWith('--') || values.has(key)) throw Error('Use support:verify --prepared FILE --out FRESH_DIRECTORY'); values.set(key, value) }
    if (!values.has('--prepared') || !values.has('--out')) throw Error('Supply --prepared and --out')
    console.log(JSON.stringify(await verifySupport(resolve(values.get('--prepared')!), resolve(values.get('--out')!), { projects: values.get('--projects')?.split(','), catalog: values.get('--catalog') })))
  }
}
