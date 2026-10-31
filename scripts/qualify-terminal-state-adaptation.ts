import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { readTerminalSourceAdaptations } from '../fidelity/terminal-adaptations.ts'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { terminalSourceInterpretationHold } from '../fidelity/terminal-source-holds.ts'
import { assessTerminalRecord, collectTerminalWorkloads, terminalProfileId } from '../unified/terminal-profile.ts'
import { verifyProvidedCommunityArtifact } from '../unified/community.ts'
import { verifyReleaseCli } from '../unified/release-cli.ts'
import { protocolIdentity } from '../unified/protocol-identity.ts'
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
  collection = read(resolve(options.get('--saved-collection')!))
  if (collection.schema !== 'terminal-authored-adaptation-collection-v1' || evidenceDigest(collection.inventory) !== evidenceDigest(adaptations.map(input => [input.id, input.sourceSha256])) || evidenceDigest(collection.artifacts) !== evidenceDigest(selected.map(peer => ({ project: peer.node.id, artifact: peer.artifact })))) throw Error('Saved adaptation collection belongs to different sources or artifacts')
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
  const path = row.metrics?.outputFile
  return { project: row.metrics?.implementation ?? row.metrics?.project, caseId: row.caseId, measuredAt: row.metrics?.measuredAt ?? null, ...(typeof path === 'string' ? copyWitness(path) : {}), runtimeExecuted: row.metrics?.failureStage !== 'transport' && (typeof row.metrics?.firstMs === 'number' || row.metrics?.failureStage === 'public-api'), publicStatus: row.status, detail: row.detail, collectionId: 'authored-adaptation', producerSource: collection.producerSource }
})
if (addedOutputs.length !== 3 || projects.some(project => addedOutputs.filter((row: any) => row.project === project && row.caseId === adaptations[0]!.id).length !== 1)) throw Error('Adaptation collection omitted or duplicated a requested coordinate')
const cases = [...originalCases, ...adaptations]
const combined = { ...original, profile: terminalProfileId, source: producerSource, producers, inventory: cases.map(input => [input.id, input.sourceSha256]), selectedCaseIds: cases.map(input => input.id), outputs: [...originalOutputs, ...addedOutputs], transportObservations: [...(original.transportObservations ?? []), ...collection.observations], sourceReference: [...original.sourceReference, ...adaptations.map(input => ({ project: 'mermaid-js/mermaid', caseId: input.id, sourceSha256: input.sourceSha256, sourceAccepted: null, declaredGraphMatches: null, role: 'source-reference-only', status: 'not-collected', detail: 'Fresh authored input has independent complete source review; no new source-reference call or reference agreement supplies facts', terminalScore: null }))], collections: [{ id: 'original-120', source: original.source, rawSha256: evidenceBytesDigest(originalBytes), from: original.startedAt, to: original.finishedAt }, { id: 'authored-adaptation', source: collection.producerSource, from: collection.startedAt, to: collection.finishedAt }], populationPolicy: 'Original120 preserved; source9972 held diagnostic, fresh authored adaptation has independent identity. Active drawing table115 unambiguous original plus1 authored;4 invalid controls and1 ambiguous diagnostic remain separate.' }
writeFileSync(join(out, 'original-raw.json'), originalBytes)
writeFileSync(join(out, 'raw.json'), JSON.stringify(combined, null, 2) + '\n')
const assessments: ProjectAssessment[] = assessTerminalRecord(combined, out, cases)
writeFileSync(join(out, 'combined-assessments.json'), JSON.stringify(assessments, null, 2) + '\n')
const summary = (rows: any[]) => ({ correct: rows.filter(row => row.status === 'correct').length, incorrect: rows.filter(row => row.status === 'incorrect').length, unknown: rows.filter(row => row.status === 'unknown').length, planned: rows.length })
const result = { schema: 'terminal-authored-state-adaptation-qualification-v1', checkedAt: new Date().toISOString(), producerSource, producers, sourceReviewFile: 'corpus/terminal-source-adaptations.json', sourceReviewSha256: evidenceBytesDigest(readFileSync(new URL('../corpus/terminal-source-adaptations.json', import.meta.url))), originalRawSha256: evidenceBytesDigest(originalBytes), newRendererCallsRequested: options.has('--saved-collection') ? 0 : 3, newSourceReferenceCalls: 0, population: { totalEntries: 121, originalLiteralEntries: 120, authoredAdaptations: 1, activeUnambiguousDrawings: 116, invalidControls: 4, ambiguousSourceDiagnostics: 1 }, original120: originalAssessments.map(project => ({ project: project.project, version: project.version, ...summary(project.full.cases) })), active: assessments.map(project => ({ project: project.project, version: project.version, ...summary(project.full.cases.filter(input => !terminalSourceInterpretationHold({ id: input.caseId, sourceSha256: cases.find(source => source.id === input.caseId)!.sourceSha256 }))) })), diagnostics: assessments.map(project => ({ project: project.project, cases: project.full.cases.filter(input => input.caseId === 'terminal:9972eaa8ca8692d8') })), newInput: assessments.map(project => ({ project: project.project, ...summary(project.full.cases.filter(input => input.caseId === adaptations[0]!.id)), cases: project.full.cases.filter(input => input.caseId === adaptations[0]!.id) })), invalid: assessments.map(project => ({ project: project.project, ...summary(project.rejection.cases) })), collections: combined.collections, allEntriesSha256: evidenceDigest(combined.inventory), rawSha256: evidenceBytesDigest(readFileSync(join(out, 'raw.json'))), assessmentSha256: evidenceBytesDigest(readFileSync(join(out, 'combined-assessments.json'))) }
writeFileSync(join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n')
const table = (label: string, rows: any[]) => ['## ' + label, '', '| Project | Correct | Incorrect | Unknown | Planned |', '|---|---:|---:|---:|---:|', ...[...rows].sort((a, b) => b.correct - a.correct || a.project.localeCompare(b.project)).map(row => `| ${row.project} | ${row.correct} | ${row.incorrect} | ${row.unknown} | ${row.planned} |`), ''].join('\n')
const report = ['# Authored nested-state qualification control', '', 'All original120 literal entries and original outcomes remain retained. The fresh121st source is explicitly authored, independently reviewed and collected only on three original frozen artifacts. Active unambiguous drawing table contains115 original sources plus1 authored control. Four typed invalid controls and the original ambiguous state source remain separately reported. Unknown cells retain their full denominators; verified counts do not establish complete accuracy ranks. No performance comparison is made.', '', table('Original120:116 drawing obligations retained, including held diagnostic', result.original120), table('Active116 unambiguous drawings:115 original plus1 authored', result.active), table('Fresh authored control only (15 projects not recollected remain unknown)', result.newInput), '[Exact source/provenance and producer identities](result.json) · [Combined original and new raw records](raw.json) · [Every fact disposition](combined-assessments.json)', ''].join('\n')
writeFileSync(join(out, 'README.md'), report)
console.log(JSON.stringify({ out, population: result.population, newInput: result.newInput.map(({ cases: _cases, ...row }) => row), newRendererCallsRequested: result.newRendererCallsRequested }, null, 2))
