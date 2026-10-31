import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { readTerminalSourceAdaptations } from '../fidelity/terminal-adaptations.ts'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { terminalSourceInterpretationHold } from '../fidelity/terminal-source-holds.ts'
import { activeTerminalGradeRecord, readActiveTerminalCorpus } from '../fidelity/terminal-active-corpus.ts'
import { assessTerminalRecord, collectTerminalWorkloads } from '../unified/terminal-profile.ts'
import { verifyProvidedCommunityArtifact } from '../unified/community.ts'
import { verifyReleaseCli } from '../unified/release-cli.ts'
import { protocolIdentity } from '../unified/protocol-identity.ts'
import { bindTerminalAdaptationInvocation } from '../unified/terminal-adaptation-invocation.ts'
import { tridentDirectory } from '../unified/trident-paths.ts'
import type { CommunityNode, PreparedCommunity } from '../unified/community-types.ts'
import catalog from '../catalog/mermaid-community.json' with { type: 'json' }

const options = new Map<string, string>()
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i]!, value = process.argv[i + 1]
  if (!['--original', '--out', '--saved-collection'].includes(key) || options.has(key) || !value || value.startsWith('--')) throw Error('Use --original DIR --out FRESH_DIR [--saved-collection COLLECTION_JSON]')
  options.set(key, value)
}
if (!options.has('--original') || !options.has('--out')) throw Error('Original retained cohort and fresh output directory are required')
const originalDirectory = resolve(options.get('--original')!), out = resolve(options.get('--out')!)
if (existsSync(out)) throw Error('Choose a fresh output directory; earlier failures and collection evidence are never overwritten')
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const originalBytes = readFileSync(join(originalDirectory, 'raw.json')), original = JSON.parse(originalBytes.toString()), originalCases = reviewedTerminalCases(), adaptations = readTerminalSourceAdaptations()
if (adaptations.length !== 1 || adaptations[0]!.id !== 'terminal-adaptation:3bf5fbf5ea7c5486') throw Error('This collection is limited to the one independently reviewed new state source')
// Validate the complete original source inventory, artifacts and retained bytes
// before making any new call. Nothing from this table is recollected or erased.
type ProjectAssessment = { project: string; version: string; full: { cases: any[] }; rejection: { cases: any[] } }
const originalAssessments: ProjectAssessment[] = assessTerminalRecord(original, originalDirectory, originalCases)
const projects = ['AlexanderGrooff/mermaid-ascii', 'fasouto/termaid', 'adewale/agentic-mermaid']
const selected: PreparedCommunity[] = projects.map(project => {
  const node = catalog.nodes.find(node => node.id === project) as unknown as CommunityNode | undefined, artifact = original.artifacts.find((entry: any) => entry.project === project)?.artifact
  if (!node || !artifact) throw Error('Missing original frozen artifact for ' + project)
  verifyProvidedCommunityArtifact(artifact); verifyReleaseCli(node, artifact)
  return { node, artifact } as PreparedCommunity
})
const producerSource = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tridentDirectory, encoding: 'utf8' }).trim()
const producers = protocolIdentity(tridentDirectory, ['scripts/qualify-terminal-state-adaptation.ts', 'unified/community-worker.mjs', 'unified/community-python-worker.py', 'corpus/terminal-source-adaptations.json'])
mkdirSync(out, { recursive: true })
let collection: any
if (options.has('--saved-collection')) {
  const retainedCollection = readFileSync(resolve(options.get('--saved-collection')!))
  collection = JSON.parse(retainedCollection.toString())
  if (collection.schema !== 'terminal-authored-adaptation-collection-v1' || evidenceDigest(collection.inventory) !== evidenceDigest(adaptations.map(input => [input.id, input.sourceSha256])) || evidenceDigest(collection.artifacts) !== evidenceDigest(selected.map(peer => ({ project: peer.node.id, artifact: peer.artifact })))) throw Error('Saved adaptation collection belongs to different sources or artifacts')
  writeFileSync(join(out, 'adaptation-collection.json'), retainedCollection)
} else {
  assertBenchmarkExecutionAllowed()
  const startedAt = new Date().toISOString(), collectionDirectory = join(out, 'collection')
  const workloads = adaptations.map(input => ({ id: input.id, source: input.source, family: input.family, expectedLabels: [], features: ['terminal-project-example', 'retain-output-witness'], provenance: 'Independently reviewed authored source adaptation, separate from original literal issue' }))
  const results = await collectTerminalWorkloads(selected, workloads, { root: tridentDirectory, out: collectionDirectory, profile: 'full', rounds: 1, communityCoverageOnce: true })
  collection = { schema: 'terminal-authored-adaptation-collection-v1', producerSource, producers, startedAt, finishedAt: new Date().toISOString(), inventory: adaptations.map(input => [input.id, input.sourceSha256]), artifacts: selected.map(peer => ({ project: peer.node.id, artifact: peer.artifact })), observations: results.flatMap(result => result.rows), rendererCallsRequested: 3, sourceReferenceCalls: 0, timingQualification: 'One new-input correctness collection; no performance or repeated timing claim' }
  // Write completed public outcomes before any semantic reducer can fail.
  writeFileSync(join(out, 'adaptation-collection.json'), JSON.stringify(collection, null, 2) + '\n')
}
const witnesses = join(out, 'witnesses'); mkdirSync(witnesses)
const copyWitness = (path: string, expectedHash?: string) => {
  const bytes = readFileSync(path), sha256 = evidenceBytesDigest(bytes)
  if (expectedHash && sha256 !== expectedHash) throw Error('Retained witness bytes changed')
  const file = join(witnesses, sha256 + '.txt'); writeFileSync(file, bytes)
  return { witness: relative(out, file), sha256 }
}
const originalOutputs = original.outputs.map((row: any) => ({ ...row, ...(row.witness ? copyWitness(resolve(originalDirectory, row.witness), row.sha256) : {}), collectionId: 'original-120', originalProducerSource: original.source, originalRawSha256: evidenceBytesDigest(originalBytes) }))
const addedOutputs = collection.observations.map((row: any) => {
  const path = row.metrics?.outputFile, project = row.metrics?.implementation ?? row.metrics?.project
  const directory = row.metrics?.rawInvocationDirectory ?? row.metrics?.invocationDirectory, attemptId = row.metrics?.rawInvocationId ?? row.metrics?.invocationId
  if (typeof directory !== 'string' || typeof attemptId !== 'string') throw Error('New public call lacks its durable invocation receipt; collection is retained for inspection')
  const records = new InvocationJournal(directory).records()
  const artifact = selected.find(peer => peer.node.id === project)?.artifact
  if (!artifact?.sha256) throw Error('New correctness call lacks its exact frozen artifact hash')
  const outcome = bindTerminalAdaptationInvocation(records, attemptId, { project, caseId: row.caseId, sourceSha256: adaptations[0]!.sourceSha256, artifactSha256: artifact.sha256, format: 'terminal' })
  if (typeof path === 'string' && (!outcome.output || outcome.output.sha256 !== evidenceBytesDigest(readFileSync(path)))) throw Error('New witness differs from its original public return receipt')
  return { project, caseId: row.caseId, measuredAt: outcome.startedAt, measuredAtOrigin: 'Actual public call-entry receipt; never the collection endpoint', ...(typeof path === 'string' ? copyWitness(path) : {}), runtimeExecuted: true, publicStatus: row.status, detail: row.detail, collectionId: 'authored-adaptation', producerSource: collection.producerSource, invocation: { directory, attemptId, state: outcome.state, startedAt: outcome.startedAt, finishedAt: outcome.finishedAt, identity: outcome.identity, receiptSha256: evidenceDigest(outcome), output: outcome.output, streams: outcome.streams ?? null } }
})
if (addedOutputs.length !== 3 || projects.some(project => addedOutputs.filter((row: any) => row.project === project && row.caseId === adaptations[0]!.id).length !== 1)) throw Error('Adaptation collection omitted or duplicated a requested coordinate')
const cases = [...originalCases, ...adaptations]
const { profile: originalProfile, ...originalResearch } = original
const combined = { ...originalResearch, schema: 'terminal-authored-state-adaptation-research-v1', originalProfile, source: producerSource, producers, inventory: cases.map(input => [input.id, input.sourceSha256]), selectedCaseIds: cases.map(input => input.id), outputs: [...originalOutputs, ...addedOutputs], transportObservations: [...(original.transportObservations ?? []), ...collection.observations], sourceReference: [...original.sourceReference, ...adaptations.map(input => ({ project: 'mermaid-js/mermaid', caseId: input.id, sourceSha256: input.sourceSha256, sourceAccepted: null, declaredGraphMatches: null, role: 'source-reference-only', status: 'not-collected', detail: 'Fresh authored input has independent complete source review; no new source-reference call or reference agreement supplies facts', terminalScore: null }))], collections: [{ id: 'original-120', source: original.source, rawSha256: evidenceBytesDigest(originalBytes), from: original.startedAt, to: original.finishedAt }, { id: 'authored-adaptation', source: collection.producerSource, from: collection.startedAt, to: collection.finishedAt }], populationPolicy: 'Original120 preserved; source9972 held diagnostic, fresh authored adaptation has independent identity. Active drawing table115 unambiguous original plus1 authored;4 invalid controls and1 ambiguous diagnostic remain separate.' }
writeFileSync(join(out, 'original-raw.json'), originalBytes)
writeFileSync(join(out, 'raw.json'), JSON.stringify(combined, null, 2) + '\n')
const activeRecord = activeTerminalGradeRecord(combined), activeCases = readActiveTerminalCorpus().cases
writeFileSync(join(out, 'active-raw.json'), JSON.stringify(activeRecord, null, 2) + '\n')
const activeAssessments: ProjectAssessment[] = assessTerminalRecord(activeRecord, out, activeCases)
writeFileSync(join(out, 'active-assessments.json'), JSON.stringify(activeAssessments, null, 2) + '\n')
// The diagnostic gets its existing original-source verdict, never an active-v3
// slot. Research counts retain it alongside the separately admitted active set.
const assessments: ProjectAssessment[] = activeAssessments.map(project => {
  const rows = cases.filter(input => input.intent !== 'invalid').map(input => {
    const active = project.full.cases.find(row => row.caseId === input.id)
    if (active) return active
    const diagnostic = originalAssessments.find(row => row.project === project.project)?.full.cases.find(row => row.caseId === input.id), retained = originalOutputs.find((row: any) => row.project === project.project && row.caseId === input.id)
    if (!diagnostic || !terminalSourceInterpretationHold(input)) throw Error('Research grading omitted an unambiguous source')
    return { ...diagnostic, ...(retained?.witness ? { witness: retained.witness, sha256: retained.sha256 } : {}) }
  })
  return { ...project, full: { ...project.full, cases: rows, planned: rows.length, correct: rows.filter(row => row.status === 'correct').length, incorrect: rows.filter(row => row.status === 'incorrect').length, unsupported: rows.filter(row => row.status === 'unsupported').length, unknown: rows.filter(row => row.status === 'unknown').length } }
})
writeFileSync(join(out, 'combined-assessments.json'), JSON.stringify(assessments, null, 2) + '\n')
const summary = (rows: any[]) => ({ correct: rows.filter(row => row.status === 'correct').length, incorrect: rows.filter(row => row.status === 'incorrect').length, unknown: rows.filter(row => row.status === 'unknown').length, planned: rows.length })
const result = { schema: 'terminal-authored-state-adaptation-qualification-v1', checkedAt: new Date().toISOString(), producerSource, producers, sourceReviewFile: 'corpus/terminal-source-adaptations.json', sourceReviewSha256: evidenceBytesDigest(readFileSync(new URL('../corpus/terminal-source-adaptations.json', import.meta.url))), originalRawSha256: evidenceBytesDigest(originalBytes), activeGrade: { profile: activeRecord.profile, corpusVersion: activeRecord.corpusVersion, corpusSha256: activeRecord.corpusSha256, rawFile: 'active-raw.json', rawSha256: evidenceBytesDigest(readFileSync(join(out, 'active-raw.json'))), assessmentsFile: 'active-assessments.json', assessmentsSha256: evidenceBytesDigest(readFileSync(join(out, 'active-assessments.json'))) }, retainedAdaptationCollection: { file: 'adaptation-collection.json', sha256: evidenceBytesDigest(readFileSync(join(out, 'adaptation-collection.json'))), producerSource: collection.producerSource, actualPublicInvocations: addedOutputs.length }, uncollectedNewInputProjects: original.artifacts.filter((artifact: any) => !projects.includes(artifact.project)).map((artifact: any) => artifact.project), newRendererCallsRequested: options.has('--saved-collection') ? 0 : 3, newSourceReferenceCalls: 0, population: { totalEntries: 121, originalResearchEntries: 120, authoredAdaptations: 1, activeUnambiguousDrawings: 116, invalidControls: 4, ambiguousSourceDiagnostics: 1 }, original120: originalAssessments.map(project => ({ project: project.project, version: project.version, ...summary(project.full.cases) })), active: activeAssessments.map(project => ({ project: project.project, version: project.version, ...summary(project.full.cases) })), diagnostics: assessments.map(project => ({ project: project.project, cases: project.full.cases.filter(input => input.caseId === 'terminal:9972eaa8ca8692d8') })), newInput: assessments.map(project => ({ project: project.project, ...summary(project.full.cases.filter(input => input.caseId === adaptations[0]!.id)), cases: project.full.cases.filter(input => input.caseId === adaptations[0]!.id) })), invalid: assessments.map(project => ({ project: project.project, ...summary(project.rejection.cases) })), collections: combined.collections, allEntriesSha256: evidenceDigest(combined.inventory), rawSha256: evidenceBytesDigest(readFileSync(join(out, 'raw.json'))), assessmentSha256: evidenceBytesDigest(readFileSync(join(out, 'combined-assessments.json'))) }
writeFileSync(join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n')
const table = (label: string, rows: any[]) => ['## ' + label, '', '| Project | Correct | Incorrect | Unknown | Planned |', '|---|---:|---:|---:|---:|', ...[...rows].sort((a, b) => b.correct - a.correct || a.project.localeCompare(b.project)).map(row => `| ${row.project} | ${row.correct} | ${row.incorrect} | ${row.unknown} | ${row.planned} |`), ''].join('\n')
const report = ['# Authored nested-state qualification control', '', 'All original120 frozen research entries and original outcomes remain retained. The fresh121st source is explicitly authored, independently reviewed and collected only on three original frozen artifacts. Active unambiguous drawing table contains115 original sources plus1 authored control. Four typed invalid controls and the original ambiguous state source remain separately reported. Unknown cells retain their full denominators; verified counts do not establish complete accuracy ranks. No performance comparison is made.', '', table('Original120:116 drawing obligations retained, including held diagnostic', result.original120), table('Active116 unambiguous drawings:115 original plus1 authored', result.active), table('Fresh authored control only (15 projects not recollected remain unknown)', result.newInput), '[Exact source/provenance and producer identities](result.json) · [Combined original and new raw records](raw.json) · [Every fact disposition](combined-assessments.json)', ''].join('\n')
writeFileSync(join(out, 'README.md'), report)
console.log(JSON.stringify({ out, population: result.population, newInput: result.newInput.map(({ cases: _cases, ...row }) => row), newRendererCallsRequested: result.newRendererCallsRequested }, null, 2))
