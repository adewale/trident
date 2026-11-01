import { terminalRetainedUnsupported } from './terminal-unsupported.ts'
import { terminalKnownEncodingContext } from '../fidelity/terminal-encoding.ts'
import { createHash } from 'node:crypto'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { bindTerminalAdaptationInvocation } from './terminal-adaptation-invocation.ts'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { mermaidOracleDirectory } from '../portable/mermaid-oracle.ts'
import { createMeaningAdapter } from '../fidelity/adapters.ts'
import { type TerminalProjectCase } from '../fidelity/terminal-corpus.ts'
import { terminalActiveProfileId, terminalOriginalProfileId, terminalProfileCorpus, terminalProfileCorpusForRecord } from '../fidelity/terminal-active-corpus.ts'
import { assessTerminalDrawing, assessTerminalSourceRejection } from '../fidelity/terminal-assessment.ts'
import { terminalSourceObservable } from '../fidelity/terminal-facts.ts'
import { terminalSourceInterpretationHold } from '../fidelity/terminal-source-holds.ts'
import { communityModuleOutputSupported, runCommunityCli, runCommunityNodeRound, verifyProvidedCommunityArtifact } from './community.ts'
import { verifyReleaseCli } from './release-cli.ts'
import { runExternalCommunity } from './community-external.ts'
import { communityCliBinding, communityCliRequest } from './community-cli-request.ts'
import type { PreparedCommunity } from './community-types.ts'
import type { BenchmarkObservation, UnifiedRunOptions, UnifiedWorkload } from './types.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { tridentDirectory } from './trident-paths.ts'
import { comparisonProjects } from './lineage.ts'
import { rankResults } from './result-ranking.ts'
import catalog from '../catalog/mermaid-community.json' with { type: 'json' }
const ascii = 'AlexanderGrooff/mermaid-ascii', defaults = [ascii, 'fasouto/termaid']
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex')
const invocationObserved = (row?: BenchmarkObservation) => !!row && row.metrics?.failureStage !== 'transport' && (typeof row.metrics?.firstMs === 'number' || row.metrics?.failureStage === 'public-api')
const ready = (input: TerminalProjectCase) => !terminalSourceInterpretationHold(input) && input.intent !== 'invalid' && input.expected.status === 'independently-reviewed' && !input.expected.unverifiedFacts?.length && (input.expected.contract ? terminalSourceObservable(input.expected.contract, input.expected.graph) : input.family === 'flowchart' && !!input.expected.graph)
export const terminalProfileId = terminalActiveProfileId
export const terminalLegacyProfileId = terminalOriginalProfileId

/** This release prints a precise public parser diagnostic rather than exposing
 * an exception type. Bind its narrow decoder to the actual frozen executable,
 * stdin binding and durable completed call; a CLI exit alone is never typed
 * rejection. The ordinary rejection assessor decides whether an unknown-family
 * result answers the independently invalid control (unsupported pie/Gitgraph
 * syntax receives no grammar credit).
 * Source: AlexanderGrooff/mermaid-ascii@5f00e3d9ac9fc96a19859d502333e35b87d2ffea,
 * pkg/graph/parse.go:526-529 and cmd/root.go:73-79. */
export function terminalCliSourceOutcome(peer: PreparedCommunity, workload: UnifiedWorkload, row: BenchmarkObservation, out: string) {
  if (workload.intent !== 'negative-admission' || row.format !== 'terminal' || peer.artifact?.kind !== 'cli' || typeof row.metrics?.rawInvocationDirectory !== 'string' || typeof row.metrics?.rawInvocationId !== 'string') return undefined
  const artifact = peer.artifact, journal = new InvocationJournal(row.metrics.rawInvocationDirectory), frame = journal.outcome(row.metrics.rawInvocationId)
  if (!frame || !frame.finishedAt || frame.identity.project !== peer.node.id || frame.identity.caseId !== workload.id || frame.identity.sourceSha256 !== evidenceBytesDigest(workload.source) || frame.identity.artifactSha256 !== artifact.sha256 || frame.identity.format !== 'terminal' || frame.identity.bindingSha256 !== communityCliBinding(artifact.executable!, 'terminal', communityCliRequest(artifact, 'terminal', out))) return undefined
  bindTerminalAdaptationInvocation(journal.records().filter(record => record.attemptId === frame.attemptId), frame.attemptId, frame.identity)
  const observerSha256 = evidenceBytesDigest(readFileSync(import.meta.filename)), base = { project: peer.node.id, caseId: workload.id, sourceSha256: frame.identity.sourceSha256, publicBoundary: 'Frozen public CLI stdin → completed command outcome', observerSha256, measuredAt: frame.finishedAt }
  if (frame.state === 'returned') return { ...base, kind: 'accepted' as const, detail: 'Actual public CLI returned successfully for independently invalid source' }
  if (frame.state !== 'public-error' || peer.node.id !== ascii || artifact.version !== '1.6.1' || artifact.sha256 !== 'e940686912699c015358f0b86f7bad61816067c9ccce655d787fe1fde9a1b6e8' || !frame.streams) return undefined
  // records() authenticates every retained stream before its contents classify
  // this exact call. Reject extra lines, transport diagnostics and generic errors.
  if (frame.streams.stdout.bytes !== 0) return undefined
  const stderr = readFileSync(frame.streams.stderr.path, 'utf8'), logged = /^time="[^"\r\n]+" level=fatal msg=("(?:[^"\\\r\n]|\\.)*")\r?\n?$/.exec(stderr)
  if (!logged) return undefined
  let detail: string
  try { detail = JSON.parse(logged[1]!) } catch { return undefined }
  if (!/^failed to parse graph diagram: unsupported graph type '[^\r\n]+'. Supported types: 'graph' or 'flowchart' with an optional direction \(TD, TB, BT, LR, RL\)$/.test(detail)) return undefined
  return { ...base, kind: 'unknown-family' as const, detail }
}

/** A collection interval is not a per-call clock. Retained legacy cases without
 * their own timestamp remain null when regraded. */
export function terminalCaseMeasuredAt(record: any, project: string, caseId: string): string | null {
  const valid = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value))
  const own = record.outputs?.find((row: any) => row.project === project && row.caseId === caseId)
  if (valid(own?.measuredAt)) return own.measuredAt
  if (valid(own?.typedSourceOutcome?.measuredAt)) return own.typedSourceOutcome.measuredAt
  const clocks = [...new Set((record.transportObservations ?? []).filter((row: any) => row.caseId === caseId && (row.metrics?.implementation === project || row.metrics?.project === project)).map((row: any) => row.metrics?.measuredAt).filter(valid))]
  return clocks.length === 1 ? clocks[0] as string : null
}


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
    for (const row of rows) {
      const workload = workloads.find(input => input.id === row.caseId), typed = workload && terminalCliSourceOutcome(peer, workload, row, options.out)
      if (typed) row.metrics = { ...row.metrics, typedSourceOutcome: JSON.stringify(typed), measuredAt: typed.measuredAt }
    }
    results.push({ peer, rows })
  }
  return results
}


export function assessTerminalRecord(record: any, directory: string, cases = terminalProfileCorpusForRecord(record).cases) {
  // Grade and identify the same JSON representation saved in raw.json. Live
  // collection records can still contain optional properties set to undefined.
  record = JSON.parse(JSON.stringify(record))
  const encodingOwnerSha256 = evidenceDigest(record)
  const inventory = cases.map(input => [input.id, input.sourceSha256])
  if (!['terminal-project-corpus-v1', terminalLegacyProfileId, terminalProfileId].includes(record.profile) || JSON.stringify(record.inventory) !== JSON.stringify(inventory)) throw Error('Saved terminal source inventory differs; keep its original corpus/version')
  if (record.profile === terminalProfileId) terminalProfileCorpusForRecord(record)
  if (!Array.isArray(record.artifacts) || !record.artifacts.length || !Array.isArray(record.outputs) || !Array.isArray(record.sourceReference) || (!record.targetedExtension && !record.artifacts.some((entry: any) => entry.project === ascii)) || new Set(record.artifacts.map((entry: any) => entry.project)).size !== record.artifacts.length || record.artifacts.some((entry: any) => entry.project === 'mermaid-js/mermaid')) throw Error('Terminal profile needs unique terminal artifacts, including Mermaid ASCII outside explicit targeted extensions, with Mermaid reference unscored')
  if (record.sourceReference.length !== cases.length || cases.some(input => record.sourceReference.filter((row: any) => row.caseId === input.id && row.project === 'mermaid-js/mermaid').length !== 1)) throw Error('Terminal profile omitted mandatory Mermaid source-reference evidence')
  const keys = new Set<string>()
  for (const row of record.outputs) {
    const key = JSON.stringify([row.project, row.caseId])
    if (keys.has(key) || !record.artifacts.some((entry: any) => entry.project === row.project) || !cases.some(input => input.id === row.caseId)) throw Error('Duplicate or undeclared terminal witness coordinate')
    keys.add(key)
  }
  const assess = (project: string, input: TerminalProjectCase) => {
    const row = record.outputs.find((entry: any) => entry.project === project && entry.caseId === input.id)
    let output: Uint8Array | undefined
    if (row?.witness) {
      const path = resolve(directory, row.witness)
      if (relative(resolve(directory), path).startsWith('..') || !existsSync(path) || relative(realpathSync(directory), realpathSync(path)).startsWith('..')) throw Error('Terminal witness escapes its owning evidence directory')
      const bytes = readFileSync(path)
      if (hash(bytes) !== row.sha256) throw Error('Terminal witness bytes changed')
      output = bytes
    }
    // The reference is a source diagnostic. Its optional model projection is
    // neither ground truth nor a veto over independently authored facts.
    const owner = record.artifacts.find((artifact: any) => artifact.project === project), encoding = output && row?.runtimeExecuted === true && row.publicStatus === 'passed' ? terminalKnownEncodingContext(owner, { sourceSha256: input.sourceSha256, outputSha256: hash(Buffer.from(output)), owningRawSha256: encodingOwnerSha256 }) : undefined
    const drawing = assessTerminalDrawing(input, output, encoding), unsupported = !output ? terminalRetainedUnsupported(record, input, owner, row) : undefined, verdict = unsupported ? { ...drawing, ...unsupported } : drawing
    return { caseId: input.id, family: input.family, ...verdict, measuredAt: terminalCaseMeasuredAt(record, project, input.id), ...(row?.witness ? { witness: row.witness, sha256: row.sha256 } : {}) }
  }
  return record.artifacts.map((artifact: any) => {
    const full = cases.filter(input => input.intent !== 'invalid').map(input => assess(artifact.project, input)), reviewed = full.filter(input => cases.some(source => source.id === input.caseId && ready(source)))
    const summary = (rows: typeof full) => { const count = (status: string) => rows.filter(input => input.status === status).length; return { correct: count('correct'), incorrect: count('incorrect'), unsupported: count('unsupported'), unknown: count('unknown'), planned: rows.length, cases: rows } }
    const rejection = cases.filter(input => input.intent === 'invalid').map(input => {
      const retained = record.outputs.find((row: any) => row.project === artifact.project && row.caseId === input.id)
      return { family: input.family, ...assessTerminalSourceRejection(input, retained?.typedSourceOutcome, artifact.project), caseId: input.id, measuredAt: terminalCaseMeasuredAt(record, artifact.project, input.id) }
    })
    return { project: artifact.project, version: artifact.version, full: summary(full), reviewed: summary(reviewed), rejection: summary(rejection) }
  })
}

/** Parser-only reference control. The source contract is authored separately;
 * reference acceptance never constructs a terminal drawing pass. */
export async function collectTerminalSourceReference(cases = terminalProfileCorpus().cases) {
  const referenceRoot = mermaidOracleDirectory(), addon = join(referenceRoot, 'node_modules/@mermaid-js/mermaid-zenuml')
  const reference = await createMeaningAdapter({ tool: 'mermaid', packageRoot: join(referenceRoot, 'node_modules/mermaid'), referenceRoot, ...(existsSync(join(addon, 'package.json')) ? { zenumlRoot: addon } : {}) })
  const sourceReference = []
  for (const input of cases) {
    const parsed = await reference.acquireRaw(input.source, input.family)
    sourceReference.push({ project: 'mermaid-js/mermaid', version: reference.version, role: 'source-reference-only', caseId: input.id, sourceSha256: input.sourceSha256, sourceAccepted: parsed.publicAccepted, status: parsed.status, declaredGraphMatches: null, error: parsed.error ?? null, checkedAt: new Date().toISOString(), terminalScore: null, scope: 'Public source acquisition only; optional model projection and renderer outputs supply no expected facts' })
  }
  return sourceReference
}

export async function runTerminalProfile(argv: string[]) {
  if (argv.includes('--help')) { console.log('bench --terminal --community-prepared FILE --out FRESH_DIR [--projects ID,... | --all-projects] [--all-inputs] [--corpus active|original]\nbench --terminal --saved-terminal DIR --out FRESH_DIR [--refresh-source-reference]\nbench --terminal --plan [--corpus active|original]\nDefault: named active v3 corpus, 120 calls per project: 115 unambiguous original drawings, one independently reviewed authored adaptation, and four original invalid controls. The ambiguous original remains diagnostic/provenance in the 121-entry research inventory. Original 120 v1/v2 saved cohorts retain their exact source IDs. Mermaid ASCII and Termaid are default projects. No acquisition, warmups or speed score; Mermaid is an unscored source reference.'); return }
  const options = new Map<string, string>(), flags = new Set<string>()
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index]!
    if (options.has(key) || flags.has(key)) throw Error('Duplicate terminal option')
    if (['--all-inputs', '--all-projects', '--refresh-source-reference', '--plan'].includes(key)) { flags.add(key); continue }
    const value = argv[++index]
    if (!['--community-prepared', '--saved-terminal', '--out', '--projects', '--corpus'].includes(key) || !value || value.startsWith('--')) throw Error('Use bench --terminal --help')
    options.set(key, value)
  }
  if (flags.has('--all-projects') && options.has('--projects')) throw Error('Choose --projects or --all-projects, not both')
  const allTerminal = comparisonProjects(catalog as any, catalog.nodes.map(node => node.id)).included.filter(id => catalog.nodes.find(node => node.id === id)!.outputs.some(output => ['terminal', 'ascii-unicode', 'unicode', 'ascii'].includes(output)))
  const projectSelection = options.get('--projects')?.split(',') ?? (flags.has('--all-projects') ? allTerminal : defaults)
  const target = options.get('--out'), saved = options.get('--saved-terminal'), preparedFile = options.get('--community-prepared')
  const selection = options.get('--corpus')
  if (selection !== undefined && !['active', 'original'].includes(selection)) throw Error('Terminal --corpus must be active or original')
  const savedBytes = saved ? readFileSync(join(resolve(saved), 'raw.json')) : undefined, savedRecord = savedBytes ? JSON.parse(savedBytes.toString()) : undefined
  const corpus = savedRecord ? terminalProfileCorpusForRecord(savedRecord) : terminalProfileCorpus(selection as 'active' | 'original' | undefined)
  if (savedRecord && selection && (selection === 'active') !== (corpus.profile === terminalProfileId)) throw Error('Saved terminal mode keeps its original source corpus; --corpus cannot substitute new bytes')
  const cases = corpus.cases, planned = cases.filter(ready), profileId = corpus.profile
  if (flags.has('--plan')) { const projects = projectSelection; console.log(JSON.stringify({ profile: profileId, corpus: corpus.corpusFile, corpusVersion: corpus.version, corpusSha256: corpus.corpusSha256, sources: cases.length, researchEntries: cases.length + corpus.diagnostics.length, diagnostics: corpus.diagnostics.map(input => ({ id: input.id, sourceSha256: input.sourceSha256 })), sourceRepositories: corpus.projects.length, reviewedObservableDrawings: planned.length, plannedTerminalCalls: cases.length * projects.length, drawingCases: cases.filter(input => input.intent !== 'invalid').length, invalidControls: cases.filter(input => input.intent === 'invalid').length, sourceReferenceCalls: cases.length, selectedProjects: projects, timing: 'unqualified; CLI and warm Python API remain different boundaries' }, null, 2)); return }
  if (flags.has('--refresh-source-reference') && !saved) throw Error('Source-reference refresh is for a saved-output recheck; ordinary collection always checks sources')
  if (!target || !!saved === !!preparedFile || saved && (options.has('--projects') || flags.has('--all-inputs') || flags.has('--all-projects'))) throw Error('Choose --out and exactly one frozen preparation or saved terminal directory; saved mode keeps the original cohort')
  const out = resolve(target)
  if (existsSync(out)) throw Error('Choose a fresh terminal output directory')
  const source = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tridentDirectory, encoding: 'utf8' }).trim()
  const producers = protocolIdentity(tridentDirectory, ['unified/terminal-profile.ts', 'unified/community-python-worker.py', 'unified/community-worker.mjs', 'corpus/terminal-project-examples.json', 'corpus/terminal-project-reviews.json', 'corpus/terminal-active-profile.json', 'corpus/terminal-source-adaptations.json'])
  let record: any, parentSha256: string | undefined
  if (saved) {
    const directory = resolve(saved); record = savedRecord; parentSha256 = hash(savedBytes!)
    assessTerminalRecord(record, directory, cases)
    if (flags.has('--refresh-source-reference')) {
      const historical = record.sourceReference
      record.sourceReference = await collectTerminalSourceReference(cases)
      record.sourceReferenceHistory = [...(record.sourceReferenceHistory ?? []), { sha256: hash(JSON.stringify(historical)), rows: historical }]
    }
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
    const startedAt = new Date().toISOString(), sourceReference = await collectTerminalSourceReference(cases)
    mkdirSync(out, { recursive: true })
    const targets = cases
    const workloads = targets.map(input => ({ id: input.id, family: input.family, source: input.source, ...(input.intent === 'invalid' ? { intent: 'negative-admission' as const } : {}), expectedLabels: input.expected.graph?.nodes.map(node => node.label) ?? [], features: ['terminal-project-example', 'retain-output-witness', ...(input.features.includes('expected-empty-drawing') ? ['expected-empty-drawing'] : [])], provenance: input.origins.map(origin => origin.url).join('; ') }))
    const outputs: any[] = [], transportObservations: BenchmarkObservation[] = []
    const collected = await collectTerminalWorkloads(selected, workloads, { root: tridentDirectory, harnessRoot: tridentDirectory, out, profile: 'full', rounds: 1, communityCoverageOnce: true })
    for (const { peer, rows: raw } of collected) {
      transportObservations.push(...raw)
      for (const input of targets) {
        const observation = raw.find(row => row.caseId === input.id), path = observation?.metrics?.outputFile
        const bytes = typeof path === 'string' ? readFileSync(path) : undefined, witness = bytes ? hash(bytes) + '.txt' : undefined
        if (bytes) writeFileSync(join(out, witness!), bytes)
        const typed = observation?.metrics?.typedSourceOutcome
        const typedSourceOutcome = typeof typed === 'string' ? JSON.parse(typed) : undefined
        if (typedSourceOutcome && input.intent === 'invalid') assessTerminalSourceRejection(input, typedSourceOutcome, peer.node.id)
        outputs.push({ project: peer.node.id, caseId: input.id, measuredAt: typeof observation?.metrics?.measuredAt === 'string' ? observation.metrics.measuredAt : null, ...(typedSourceOutcome ? { typedSourceOutcome } : {}), witness, sha256: bytes ? hash(bytes) : undefined, runtimeExecuted: invocationObserved(observation), publicStatus: observation?.status ?? 'blocked', detail: observation?.detail ?? peer.error })
      }
    }
    record = { profile: profileId, source, producers, startedAt, finishedAt: new Date().toISOString(), inventory: cases.map(input => [input.id, input.sourceSha256]), corpusFile: corpus.corpusFile, corpusVersion: corpus.version, corpusSha256: corpus.corpusSha256, sourceInventorySha256: corpus.sourceInventorySha256, diagnosticSources: corpus.diagnostics, originalCorpus: { file: 'corpus/terminal-project-examples.json', sources: corpus.originals.length, sha256: hash(readFileSync(join(tridentDirectory, 'corpus/terminal-project-examples.json'))) }, reviewsSha256: hash(readFileSync(join(tridentDirectory, 'corpus/terminal-project-reviews.json'))), selectedCaseIds: targets.map(input => input.id), allInputs: true, targetedExtension: options.has('--projects'), artifacts: selected.map(peer => ({ project: peer.node.id, version: peer.artifact?.version ?? 'unavailable', artifact: peer.artifact ?? null, error: peer.error })), sourceReference, outputs, transportObservations }
  }
  // Preserve completed collection even if the observer or report reducer fails.
  writeFileSync(join(out, 'raw.json'), JSON.stringify(record, null, 2) + '\n')
  const assessments = assessTerminalRecord(record, out, cases), updatedAt = new Date().toISOString()
  const terminalCoverage = record.artifacts.map((artifact: any) => { const own = record.outputs.filter((row: any) => row.project === artifact.project), invocationUnknown = own.filter((row: any) => row.runtimeExecuted === null).length, attempted = own.filter((row: any) => row.runtimeExecuted ?? invocationObserved(record.transportObservations?.find((observation: any) => observation.metrics?.implementation === row.project && observation.caseId === row.caseId))).length; return { project: artifact.project, requested: own.length, attempted, returnedText: own.filter((row: any) => row.witness).length, publicFailed: own.filter((row: any) => row.publicStatus === 'failed').length, publicBlocked: own.filter((row: any) => row.publicStatus === 'blocked').length, invocationUnknown, notAttempted: cases.length - attempted - invocationUnknown, planned: cases.length } })
  const observations: BenchmarkObservation[] = assessments.flatMap((project: any) => project.full.cases.map((input: any) => ({ suite: 'community', surface: 'terminal:cell-grid', runtime: 'retained terminal text', family: input.family, caseId: input.caseId, operation: 'graph-correctness', format: 'terminal', mode: profileId, status: input.status === 'correct' ? 'passed' : input.status === 'incorrect' ? 'failed' : input.status === 'unsupported' ? 'unsupported' : 'blocked', detail: input.reason, metrics: { project: project.project, version: project.version, measuredAt: input.measuredAt, collectionFrom: record.startedAt ?? null, collectionTo: record.finishedAt ?? null, observerCheckedAt: updatedAt } })))
  for (const project of assessments) for (const input of project.rejection.cases) observations.push({ suite: 'community', surface: 'terminal:public-rejection', runtime: 'retained typed public outcome', family: input.family, caseId: input.caseId, operation: 'typed-source-rejection', format: 'terminal', mode: profileId, status: input.status === 'correct' ? 'passed' : input.status === 'incorrect' ? 'failed' : 'blocked', detail: input.reason, metrics: { project: project.project, version: project.version, measuredAt: input.measuredAt, collectionFrom: record.startedAt ?? null, collectionTo: record.finishedAt ?? null, observerCheckedAt: updatedAt } })
  const suite = join(out, 'terminal'); mkdirSync(suite)
  const result = { suite: 'community', terminalCoverage, startedAt: record.startedAt, finishedAt: record.finishedAt, observations, artifacts: ['../raw.json'], terminalProfile: { id: profileId, corpusVersion: corpus.version, sourceInventorySha256: corpus.sourceInventorySha256, diagnosticSources: corpus.diagnostics, researchEntryCount: cases.length + corpus.diagnostics.length, originalCorpus: { file: 'corpus/terminal-project-examples.json', sources: corpus.originals.length, sha256: hash(readFileSync(join(tridentDirectory, 'corpus/terminal-project-examples.json'))) }, sourceRepositories: corpus.projects.map(project => ({ repository: project.repository, commit: project.commit })), cases: cases.map(input => ({ id: input.id, sourceSha256: input.sourceSha256, family: input.family, intent: input.intent })), drawingCaseIds: cases.filter(input => input.intent !== 'invalid').map(input => input.id), rejectionCaseIds: cases.filter(input => input.intent === 'invalid').map(input => input.id), reviewedCaseIds: planned.map(input => input.id), producers, corpusFile: record.corpusFile, corpusSha256: record.corpusSha256, reviewsSha256: hash(readFileSync(join(tridentDirectory, 'corpus/terminal-project-reviews.json'))) }, terminalAssessments: assessments.map((project: any) => ({ project: project.project, version: project.version, ...project.full })), terminalReviewedAssessments: assessments.map((project: any) => ({ project: project.project, version: project.version, ...project.reviewed })), terminalRejectionAssessments: assessments.map((project: any) => ({ project: project.project, version: project.version, ...project.rejection })), sourceReference: record.sourceReference, recheck: parentSha256 ? { parentSha256, originalSource: record.source, observerSource: source, checkedAt: updatedAt, rendererInvocations: 0, sourceReferenceCalls: flags.has('--refresh-source-reference') ? cases.length : 0, originalProfile: record.profile } : null }
  writeFileSync(join(suite, 'result.json'), JSON.stringify(result, null, 2) + '\n')
  writeFileSync(join(out, 'report.json'), JSON.stringify({ schema: 'trident-campaign-v2', options: { out }, startedAt: record.startedAt, updatedAt, projects: assessments.map((project: any) => project.project), profile: 'full', rounds: 1, requestedSuites: ['community'], results: [{ suite: 'community', cohort: profileId, out: suite, status: 'blocked', completed: true }], scope: 'Real project examples; full inventory retains unmeasured/unknown cells. Reviewed subset is separately bounded. Mermaid reference is unscored. Unlike invocation boundaries are not compared.' }, null, 2) + '\n')
  const lines = ['# Terminal project corpus qualification', '', `Corpus ${profileId} / ${corpus.version}: ${cases.length} active inputs and ${corpus.diagnostics.length} separately retained diagnostic sources. Research: ${corpus.projects.length} frozen terminal-project repositories; ${cases.length} inputs from ${new Set(cases.flatMap(input => input.origins.map(origin => origin.repository))).size} contributors, mixing terminal-specific and shared-renderer robustness sources. No usage-frequency claim. Original collection ${record.startedAt && record.finishedAt ? record.startedAt + ' to ' + record.finishedAt : 'timestamps not retained (offline recovery)'}; observer checked ${updatedAt}. Mermaid reference receives no terminal score.`, '']
  const drawingIds = new Set(cases.filter(input => input.intent !== 'invalid').map(input => input.id)), reviewedIds = new Set(planned.map(input => input.id))
  const sameDrawingPopulation = drawingIds.size === reviewedIds.size && [...drawingIds].every(id => reviewedIds.has(id))
  for (const scope of sameDrawingPopulation ? ['full'] as const : ['full', 'reviewed'] as const) {
    lines.push('## ' + (scope === 'full' ? 'Positive drawing population (all planned valid inputs)' : 'Observable-source diagnostic subset'), '', '| Verified-count rank | Project | Version | Correct | Incorrect | Unsupported | Unknown | Planned |', '|---:|---|---|---:|---:|---:|---:|---:|')
    const ranked = rankResults<any>(assessments, { direction: 'descending', name: project => project.project, score: project => { const row = project[scope]; return row.correct || row.incorrect || row.unsupported ? row.correct : null } })
    for (const { row: project, rank } of ranked) { const row = project[scope]; lines.push(`| ${rank ?? '—'} | ${project.project} | ${project.version} | ${row.correct} | ${row.incorrect} | ${row.unsupported} | ${row.unknown} | ${row.planned} |`) }
    lines.push('')
  }
  lines.push('## Invalid-source controls (separate population)', '', '| Verified-count rank | Project | Typed rejection correct | Incorrect | Unknown | Planned |', '|---:|---|---:|---:|---:|---:|')
  const rejectionSorted = rankResults<any>(assessments, { direction: 'descending', name: project => project.project, score: project => project.rejection.correct || project.rejection.incorrect ? project.rejection.correct : null })
  for (const { row: project, rank } of rejectionSorted) { const row = project.rejection; lines.push(`| ${rank ?? '—'} | ${project.project} | ${row.correct} | ${row.incorrect} | ${row.unknown} | ${row.planned} |`) }
  lines.push('')
  lines.push('Ranks order verified correct counts within each displayed population; unknown outcomes leave complete accuracy unresolved. A diagnostic subset is shown separately only when its exact input set differs from the full drawing population. Rows without any verified drawing observation remain unranked. Source-derived labels/tags never supply correctness credit. Typed invalid-input controls have a separate population; a generic process exit supplies no grammar credit. Missing family/fact projections remain unknown. Core correctness counts cover required source content. Unknown layout/style advisories are retained separately and supply no correctness credit. No general language, aesthetics or speed claim.', '', '[Original artifacts, source reference, transport observations and witness identities](raw.json) · [Observer verdicts and corpus/review identity](terminal/result.json)')
  writeFileSync(join(out, 'README.md'), lines.join('\n') + '\n'); console.log(lines.join('\n'))
}
if (import.meta.main) await runTerminalProfile(process.argv.slice(2))
