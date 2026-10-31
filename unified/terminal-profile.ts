import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { mermaidOracleDirectory } from '../portable/mermaid-oracle.ts'
import { createMeaningAdapter } from '../fidelity/adapters.ts'
import { assessMeaning } from '../fidelity/meaning.ts'
import { readTerminalCorpus, reviewedTerminalCases, type TerminalProjectCase } from '../fidelity/terminal-corpus.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import { communityModuleOutputSupported, runCommunityCli, runCommunityNodeRound, verifyProvidedCommunityArtifact } from './community.ts'
import { verifyReleaseCli } from './release-cli.ts'
import { runExternalCommunity } from './community-external.ts'
import type { PreparedCommunity } from './community-types.ts'
import type { BenchmarkObservation, UnifiedRunOptions, UnifiedWorkload } from './types.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { tridentDirectory } from './trident-paths.ts'
import { comparisonProjects } from './lineage.ts'
import catalog from '../catalog/mermaid-community.json' with { type: 'json' }
const ascii = 'AlexanderGrooff/mermaid-ascii', defaults = [ascii, 'fasouto/termaid']
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex')
const invocationObserved = (row?: BenchmarkObservation) => !!row && row.metrics?.failureStage !== 'transport' && (typeof row.metrics?.firstMs === 'number' || row.metrics?.failureStage === 'public-api')
const ready = (input: TerminalProjectCase) => input.family === 'flowchart' && input.intent === 'valid' && input.expected.status === 'independently-reviewed' && !!input.expected.graph && !input.expected.unverifiedFacts?.length
export const terminalProfileId = 'terminal-project-corpus-v1'

/** Reuse existing public transports and their frozen-artifact worker proof. */
export async function collectTerminalWorkloads(prepared: PreparedCommunity[], workloads: UnifiedWorkload[], options: UnifiedRunOptions) {
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'community-prepared.json'), JSON.stringify(prepared, null, 2) + '\n')
  const results: { peer: PreparedCommunity; rows: BenchmarkObservation[] }[] = []
  for (const peer of prepared) {
    const kind = peer.artifact?.kind
    const nodeTerminal = (peer.node.benchmark?.outputs ?? peer.node.outputs).some(output => ['terminal', 'ascii-unicode', 'unicode', 'ascii'].includes(output)) && communityModuleOutputSupported(peer.node, 'terminal')
    const extra = !nodeTerminal || !['node', 'global', 'franken'].includes(kind ?? '') ? peer.artifact?.additionalCli?.find(cli => cli.outputs.includes('terminal') && cli.artifact) : undefined
    if (extra?.artifact) { verifyProvidedCommunityArtifact(extra.artifact); verifyReleaseCli(peer.node, peer.artifact!) }
    const rows = extra?.artifact ? workloads.map(input => runCommunityCli({ ...peer, artifact: extra.artifact }, 'terminal', input, 1, options.out))
      : kind === 'python' ? await runExternalCommunity(peer, workloads, 'terminal', 1, options)
        : ['node', 'global', 'franken'].includes(kind ?? '') && nodeTerminal ? await runCommunityNodeRound(peer, 'terminal', workloads, 1, options)
          : kind === 'cli' ? workloads.map(input => runCommunityCli(peer, 'terminal', input, 1, options.out))
            : workloads.map(input => ({ suite: 'community', surface: 'public:terminal', runtime: 'not-invoked', family: input.family, caseId: input.id, operation: 'capability', format: 'terminal', mode: 'capability', status: 'blocked', detail: peer.error ?? 'No reviewed terminal transport for this frozen artifact; no renderer invocation or failure is inferred.', metrics: { implementation: peer.node.id, failureStage: 'transport' } }) as BenchmarkObservation)
    results.push({ peer, rows })
  }
  return results
}


export function assessTerminalRecord(record: any, directory: string, cases = reviewedTerminalCases()) {
  const inventory = cases.map(input => [input.id, input.sourceSha256])
  if (record.profile !== terminalProfileId || JSON.stringify(record.inventory) !== JSON.stringify(inventory)) throw Error('Saved terminal source inventory differs; keep its original corpus/version')
  if (!Array.isArray(record.artifacts) || !record.artifacts.length || !Array.isArray(record.outputs) || !Array.isArray(record.sourceReference) || (!record.targetedExtension && !record.artifacts.some((entry: any) => entry.project === ascii)) || new Set(record.artifacts.map((entry: any) => entry.project)).size !== record.artifacts.length || record.artifacts.some((entry: any) => entry.project === 'mermaid-js/mermaid')) throw Error('Terminal profile needs unique terminal artifacts, including Mermaid ASCII outside explicit targeted extensions, with Mermaid reference unscored')
  if (record.sourceReference.length !== cases.length || cases.some(input => record.sourceReference.filter((row: any) => row.caseId === input.id && row.project === 'mermaid-js/mermaid').length !== 1)) throw Error('Terminal profile omitted mandatory Mermaid source-reference evidence')
  const keys = new Set<string>()
  for (const row of record.outputs) {
    const key = JSON.stringify([row.project, row.caseId])
    if (keys.has(key) || !record.artifacts.some((entry: any) => entry.project === row.project) || !cases.some(input => input.id === row.caseId)) throw Error('Duplicate or undeclared terminal witness coordinate')
    keys.add(key)
  }
  const assess = (project: string, input: TerminalProjectCase) => {
    const row = record.outputs.find((entry: any) => entry.project === project && entry.caseId === input.id), reference = record.sourceReference.find((entry: any) => entry.caseId === input.id)
    let output: string | undefined
    if (row?.witness) {
      const path = resolve(directory, row.witness)
      if (relative(resolve(directory), path).startsWith('..') || !existsSync(path) || relative(realpathSync(directory), realpathSync(path)).startsWith('..')) throw Error('Terminal witness escapes its owning evidence directory')
      const bytes = readFileSync(path)
      if (hash(bytes) !== row.sha256) throw Error('Terminal witness bytes changed')
      output = bytes.toString('utf8')
    }
    if (ready(input) && (reference.sourceAccepted !== true || reference.declaredGraphMatches !== true)) return { caseId: input.id, family: input.family, status: 'unknown', reason: 'Source reference did not establish agreement with the independent graph contract.' }
    const verdict = assessTerminalDrawing(input, output)
    return { caseId: input.id, family: input.family, ...verdict, ...(row?.witness ? { witness: row.witness, sha256: row.sha256 } : {}) }
  }
  return record.artifacts.map((artifact: any) => {
    const full = cases.map(input => assess(artifact.project, input)), reviewed = full.filter(input => cases.some(source => source.id === input.caseId && ready(source)))
    const summary = (rows: typeof full) => { const count = (status: string) => rows.filter(input => input.status === status).length; return { correct: count('correct'), incorrect: count('incorrect'), unsupported: count('unsupported'), unknown: count('unknown'), planned: rows.length, cases: rows } }
    return { project: artifact.project, version: artifact.version, full: summary(full), reviewed: summary(reviewed) }
  })
}

export async function runTerminalProfile(argv: string[]) {
  if (argv.includes('--help')) { console.log('bench --terminal --community-prepared FILE --out FRESH_DIR [--projects ID,... | --all-projects] [--all-inputs]\nbench --terminal --saved-terminal DIR --out FRESH_DIR\nbench --terminal --plan\nDefault: Mermaid ASCII and Termaid; collect independently reviewed observable inputs once, retain all other planned cells as unknown. --all-inputs explicitly attempts every source. No acquisition, warmups or speed score. Mermaid is an unscored source reference.'); return }
  const options = new Map<string, string>(), flags = new Set<string>()
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index]!
    if (options.has(key) || flags.has(key)) throw Error('Duplicate terminal option')
    if (['--all-inputs', '--all-projects', '--plan'].includes(key)) { flags.add(key); continue }
    const value = argv[++index]
    if (!['--community-prepared', '--saved-terminal', '--out', '--projects'].includes(key) || !value || value.startsWith('--')) throw Error('Use bench --terminal --help')
    options.set(key, value)
  }
  if (flags.has('--all-projects') && options.has('--projects')) throw Error('Choose --projects or --all-projects, not both')
  const allTerminal = comparisonProjects(catalog as any, catalog.nodes.map(node => node.id)).included.filter(id => catalog.nodes.find(node => node.id === id)!.outputs.some(output => ['terminal', 'ascii-unicode', 'unicode', 'ascii'].includes(output)))
  const projectSelection = options.get('--projects')?.split(',') ?? (flags.has('--all-projects') ? allTerminal : defaults)
  const cases = reviewedTerminalCases(), corpus = readTerminalCorpus(), planned = cases.filter(ready)
  if (flags.has('--plan')) { const projects = projectSelection; console.log(JSON.stringify({ profile: terminalProfileId, corpus: 'corpus/terminal-project-examples.json', sources: cases.length, sourceRepositories: corpus.projects.length, reviewedObservableDrawings: planned.length, plannedTerminalCalls: (flags.has('--all-inputs') ? cases.length : planned.length) * projects.length, sourceReferenceCalls: cases.length, selectedProjects: projects, timing: 'unqualified; CLI and warm Python API remain different boundaries' }, null, 2)); return }
  const target = options.get('--out'), saved = options.get('--saved-terminal'), preparedFile = options.get('--community-prepared')
  if (!target || !!saved === !!preparedFile || saved && (options.has('--projects') || flags.has('--all-inputs') || flags.has('--all-projects'))) throw Error('Choose --out and exactly one frozen preparation or saved terminal directory; saved mode keeps the original cohort')
  const out = resolve(target)
  if (existsSync(out)) throw Error('Choose a fresh terminal output directory')
  const source = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tridentDirectory, encoding: 'utf8' }).trim()
  const producers = protocolIdentity(tridentDirectory, ['unified/terminal-profile.ts', 'unified/community-python-worker.py', 'unified/community-worker.mjs', 'corpus/terminal-project-examples.json', 'corpus/terminal-project-reviews.json'])
  let record: any, parentSha256: string | undefined
  if (saved) {
    const directory = resolve(saved), bytes = readFileSync(join(directory, 'raw.json')); record = JSON.parse(bytes.toString()); parentSha256 = hash(bytes)
    assessTerminalRecord(record, directory, cases)
    mkdirSync(out, { recursive: true })
    for (const row of record.outputs) if (row.witness) { const bytes = readFileSync(resolve(directory, row.witness)), name = hash(bytes) + '.txt'; writeFileSync(join(out, name), bytes); row.witness = name }
  } else {
    assertBenchmarkExecutionAllowed()
    const projects = projectSelection, prepared = read(resolve(preparedFile!)) as PreparedCommunity[]
    if (!projects.length || new Set(projects).size !== projects.length || projects.includes('mermaid-js/mermaid') || !Array.isArray(prepared) || new Set(prepared.map(entry => entry.node.id)).size !== prepared.length || projects.some(project => !prepared.some(entry => entry.node.id === project))) throw Error('Choose unique frozen terminal identities; Mermaid reference is separate. Default/full cohorts include Mermaid ASCII; explicit projects select a targeted extension.')
    const eligible = comparisonProjects(catalog as any, projects).included
    if (eligible.length !== projects.length) throw Error('Terminal profile respects the catalog branding/selection policy; choose eligible renderer artifacts')
    const selected = prepared.filter(peer => projects.includes(peer.node.id))
    for (const peer of selected) if (peer.artifact) {
      if (!peer.node.outputs.some(output => ['terminal', 'ascii-unicode', 'unicode', 'ascii'].includes(output))) throw Error('No declared terminal output: ' + peer.node.id)
      verifyProvidedCommunityArtifact(peer.artifact)
      verifyReleaseCli(peer.node, peer.artifact)
    }
    const startedAt = new Date().toISOString(), referenceRoot = mermaidOracleDirectory(), reference = await createMeaningAdapter({ tool: 'mermaid', packageRoot: join(referenceRoot, 'node_modules/mermaid'), referenceRoot }), sourceReference: any[] = []
    for (const input of cases) {
      const parsed = await reference.parse(input.source, input.family)
      const declaredGraphMatches = ready(input) ? assessMeaning({ family: 'flowchart', expected: { labels: input.expected.graph!.nodes.map(node => node.label), nodes: [...input.expected.graph!.nodes], edges: input.expected.graph!.edges.map(edge => ({ ...edge, directed: true })) } }, parsed.meaning).passed : null
      sourceReference.push({ project: 'mermaid-js/mermaid', version: reference.version, role: 'source-reference-only', caseId: input.id, sourceAccepted: parsed.publicAccepted, status: parsed.status, declaredGraphMatches, error: parsed.error ?? null, checkedAt: new Date().toISOString(), terminalScore: null })
    }
    mkdirSync(out, { recursive: true })
    const targets = (flags.has('--all-inputs') ? cases : planned).filter(input => !ready(input) || sourceReference.find(row => row.caseId === input.id).declaredGraphMatches === true)
    const workloads = targets.map(input => ({ id: input.id, family: input.family, source: input.source, expectedLabels: input.expected.graph?.nodes.map(node => node.label) ?? [], features: ['terminal-project-example', 'retain-output-witness'], provenance: input.origins.map(origin => origin.url).join('; ') }))
    const outputs: any[] = [], transportObservations: BenchmarkObservation[] = []
    const collected = await collectTerminalWorkloads(selected, workloads, { root: tridentDirectory, harnessRoot: tridentDirectory, out, profile: 'full', rounds: 1, communityCoverageOnce: true })
    for (const { peer, rows: raw } of collected) {
      transportObservations.push(...raw)
      for (const input of targets) {
        const observation = raw.find(row => row.caseId === input.id), path = observation?.metrics?.outputFile
        const bytes = typeof path === 'string' ? readFileSync(path) : undefined, witness = bytes ? hash(bytes) + '.txt' : undefined
        if (bytes) writeFileSync(join(out, witness!), bytes)
        outputs.push({ project: peer.node.id, caseId: input.id, witness, sha256: bytes ? hash(bytes) : undefined, runtimeExecuted: invocationObserved(observation), publicStatus: observation?.status ?? 'blocked', detail: observation?.detail ?? peer.error })
      }
    }
    record = { profile: terminalProfileId, source, producers, startedAt, finishedAt: new Date().toISOString(), inventory: cases.map(input => [input.id, input.sourceSha256]), corpusFile: 'corpus/terminal-project-examples.json', corpusSha256: hash(readFileSync(join(tridentDirectory, 'corpus/terminal-project-examples.json'))), reviewsSha256: hash(readFileSync(join(tridentDirectory, 'corpus/terminal-project-reviews.json'))), selectedCaseIds: targets.map(input => input.id), allInputs: flags.has('--all-inputs'), targetedExtension: options.has('--projects'), artifacts: selected.map(peer => ({ project: peer.node.id, version: peer.artifact?.version ?? 'unavailable', artifact: peer.artifact ?? null, error: peer.error })), sourceReference, outputs, transportObservations }
  }
  // Preserve completed collection even if the observer or report reducer fails.
  writeFileSync(join(out, 'raw.json'), JSON.stringify(record, null, 2) + '\n')
  const assessments = assessTerminalRecord(record, out, cases), updatedAt = new Date().toISOString()
  const terminalCoverage = record.artifacts.map((artifact: any) => { const own = record.outputs.filter((row: any) => row.project === artifact.project), attempted = own.filter((row: any) => row.runtimeExecuted ?? invocationObserved(record.transportObservations?.find((observation: any) => observation.metrics?.implementation === row.project && observation.caseId === row.caseId))).length; return { project: artifact.project, requested: own.length, attempted, returnedText: own.filter((row: any) => row.witness).length, publicFailed: own.filter((row: any) => row.publicStatus === 'failed').length, publicBlocked: own.filter((row: any) => row.publicStatus === 'blocked').length, notAttempted: cases.length - attempted, planned: cases.length } })
  const observations: BenchmarkObservation[] = assessments.flatMap((project: any) => project.full.cases.map((input: any) => ({ suite: 'community', surface: 'terminal:cell-grid', runtime: 'retained terminal text', family: input.family, caseId: input.caseId, operation: 'graph-correctness', format: 'terminal', mode: terminalProfileId, status: input.status === 'correct' ? 'passed' : input.status === 'incorrect' ? 'failed' : 'blocked', detail: input.reason, metrics: { project: project.project, version: project.version, measuredAt: record.finishedAt, observerCheckedAt: updatedAt } })))
  const suite = join(out, 'terminal'); mkdirSync(suite)
  const result = { suite: 'community', terminalCoverage, startedAt: record.startedAt, finishedAt: record.finishedAt, observations, artifacts: ['../raw.json'], terminalProfile: { id: terminalProfileId, sourceRepositories: corpus.projects.map(project => ({ repository: project.repository, commit: project.commit })), cases: cases.map(input => ({ id: input.id, sourceSha256: input.sourceSha256, family: input.family })), reviewedCaseIds: planned.map(input => input.id), producers, corpusFile: record.corpusFile, corpusSha256: record.corpusSha256, reviewsSha256: hash(readFileSync(join(tridentDirectory, 'corpus/terminal-project-reviews.json'))) }, terminalAssessments: assessments.map((project: any) => ({ project: project.project, version: project.version, ...project.full })), terminalReviewedAssessments: assessments.map((project: any) => ({ project: project.project, version: project.version, ...project.reviewed })), sourceReference: record.sourceReference, recheck: parentSha256 ? { parentSha256, originalSource: record.source, observerSource: source, checkedAt: updatedAt, rendererInvocations: 0 } : null }
  writeFileSync(join(suite, 'result.json'), JSON.stringify(result, null, 2) + '\n')
  writeFileSync(join(out, 'report.json'), JSON.stringify({ schema: 'trident-campaign-v2', options: { out }, startedAt: record.startedAt, updatedAt, projects: assessments.map((project: any) => project.project), profile: 'full', rounds: 1, requestedSuites: ['community'], results: [{ suite: 'community', cohort: terminalProfileId, out: suite, status: 'blocked', completed: true }], scope: 'Real project examples; full inventory retains unmeasured/unknown cells. Reviewed subset is separately bounded. Mermaid reference is unscored. Unlike invocation boundaries are not compared.' }, null, 2) + '\n')
  const lines = ['# Terminal project corpus qualification', '', `Research: ${corpus.projects.length} frozen terminal-project repositories; ${cases.length} inputs from ${new Set(cases.flatMap(input => input.origins.map(origin => origin.repository))).size} contributors, mixing terminal-specific and shared-renderer robustness sources. No usage-frequency claim. Original collection ${record.startedAt} to ${record.finishedAt}; observer checked ${updatedAt}. Mermaid reference receives no terminal score.`, '']
  for (const scope of ['full', 'reviewed'] as const) {
    lines.push('## ' + (scope === 'full' ? 'Full planned inventory' : 'Independently reviewed observable subset'), '', scope === 'reviewed' ? '| Verified-count rank | Project | Version | Correct | Incorrect | Unsupported | Unknown | Planned |' : '| Accuracy rank | Project | Version | Correct | Incorrect | Unsupported | Unknown | Planned |', '|---:|---|---|---:|---:|---:|---:|---:|')
    const sorted = [...assessments].sort((a: any, b: any) => b[scope].correct - a[scope].correct || a.project.localeCompare(b.project))
    for (const project of sorted) { const row = project[scope], rank = scope === 'full' && row.unknown || scope === 'reviewed' && !row.correct && !row.incorrect && !row.unsupported ? '—' : 1 + sorted.filter((other: any) => other[scope].correct > row.correct).length; lines.push(`| ${rank} | ${project.project} | ${project.version} | ${row.correct} | ${row.incorrect} | ${row.unsupported} | ${row.unknown} | ${row.planned} |`) }
    lines.push('')
  }
  lines.push('Reviewed-subset ranks order verified correct counts only; complete accuracy remains unknown. Full-inventory accuracy ranks are withheld. Source-derived labels/tags never supply correctness credit. Typed invalid-input rejection is unmeasured; missing observer families, display state and unreviewed facts stay unknown. No general language, aesthetics or speed claim.', '', '[Original artifacts, source reference, transport observations and witness identities](raw.json) · [Observer verdicts and corpus/review identity](terminal/result.json)')
  writeFileSync(join(out, 'README.md'), lines.join('\n') + '\n'); console.log(lines.join('\n'))
}
if (import.meta.main) await runTerminalProfile(process.argv.slice(2))
