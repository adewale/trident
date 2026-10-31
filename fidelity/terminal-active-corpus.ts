import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { readTerminalCorpus, reviewedTerminalCases } from './terminal-corpus.ts'
import { readTerminalSourceAdaptations, terminalSourceAdaptationStatus } from './terminal-adaptations.ts'
import { terminalSourceInterpretationHold } from './terminal-source-holds.ts'

export const terminalActiveProfileId = 'terminal-project-corpus-v3'
export const terminalOriginalProfileId = 'terminal-project-corpus-v2'
export const terminalActiveCorpusFile = 'corpus/terminal-active-profile.json'
const root = resolve(import.meta.dir, '..')
interface Coordinate { id: string; sourceSha256: string }
export interface TerminalActiveManifest {
  schema: 'terminal-active-corpus-v1'
  profile: typeof terminalActiveProfileId
  version: string
  policy: string
  inputs: { file: string; sha256: string }[]
  active: { cases: Coordinate[]; drawingCount: number; invalidControlCount: number }
  diagnostics: (Coordinate & { finding: string; reason: string })[]
  substitutions: { diagnosticCaseId: string; activeCaseId: string; sourceOnlyReason: string }[]
}

/** Explicit versioned membership, independent of renderer outcomes. Original
 * literal sources are still read and authenticated by the original loader;
 * authored sources retain their own independent adaptation admission. */
export function readActiveTerminalCorpus(file = resolve(root, terminalActiveCorpusFile)) {
  const manifestBytes = readFileSync(file), manifest = JSON.parse(manifestBytes.toString()) as TerminalActiveManifest
  const expectedInputs = ['corpus/terminal-project-examples.json', 'corpus/terminal-project-reviews.json', 'docs/evidence/terminal-source-review-2026-10-31/receipt.json', 'corpus/terminal-source-adaptations.json']
  if (manifest.schema !== 'terminal-active-corpus-v1' || manifest.profile !== terminalActiveProfileId || !manifest.version?.trim() || !manifest.policy?.trim() || !Array.isArray(manifest.inputs) || JSON.stringify(manifest.inputs.map(row => row.file).sort()) !== JSON.stringify(expectedInputs.sort()) || manifest.inputs.some(row => evidenceBytesDigest(readFileSync(resolve(root, row.file))) !== row.sha256)) throw Error('Active terminal corpus has stale or missing source/review identities')
  const corpus = readTerminalCorpus(), originals = reviewedTerminalCases(corpus), adaptations = readTerminalSourceAdaptations()
  const candidates = [...originals, ...adaptations], byId = new Map(candidates.map(input => [input.id, input]))
  if (byId.size !== candidates.length || !Array.isArray(manifest.active?.cases) || !Array.isArray(manifest.diagnostics) || !Array.isArray(manifest.substitutions)) throw Error('Active terminal corpus has duplicate or missing membership')
  const coordinates = [...manifest.active.cases, ...manifest.diagnostics]
  if (coordinates.length !== candidates.length || new Set(coordinates.map(row => row.id)).size !== coordinates.length || coordinates.some(row => byId.get(row.id)?.sourceSha256 !== row.sourceSha256)) throw Error('Active and diagnostic terminal memberships must partition every original and authored source exactly')
  const diagnostics = manifest.diagnostics.map(row => {
    const input = byId.get(row.id)!, hold = terminalSourceInterpretationHold(input)
    if (!originals.some(original => original.id === input.id) || !hold || row.finding !== hold.finding || !row.reason?.trim()) throw Error('Terminal diagnostic exclusion needs its exact independent source-interpretation hold')
    return { ...input, diagnostic: row }
  })
  if (manifest.substitutions.length !== diagnostics.length || new Set(manifest.substitutions.map(row => row.diagnosticCaseId)).size !== diagnostics.length || new Set(manifest.substitutions.map(row => row.activeCaseId)).size !== adaptations.length || manifest.substitutions.some(row => !diagnostics.some(input => input.id === row.diagnosticCaseId) || !adaptations.some(input => input.id === row.activeCaseId) || !row.sourceOnlyReason?.trim())) throw Error('Active terminal substitution lacks a unique source-only authored counterpart')
  const cases = manifest.active.cases.map(row => byId.get(row.id)!)
  if (cases.some(input => terminalSourceInterpretationHold(input)) || adaptations.some(input => !cases.some(row => row.id === input.id) || !terminalSourceAdaptationStatus(input).admitted) || cases.filter(input => input.intent !== 'invalid').length !== manifest.active.drawingCount || cases.filter(input => input.intent === 'invalid').length !== manifest.active.invalidControlCount || originals.filter(input => input.intent === 'invalid').some(input => !cases.some(row => row.id === input.id))) throw Error('Active terminal drawing/control population or adaptation admission differs')
  return { profile: terminalActiveProfileId, version: manifest.version, cases, diagnostics, originals, projects: corpus.projects, manifest, corpusFile: terminalActiveCorpusFile, corpusSha256: evidenceBytesDigest(manifestBytes), sourceInventorySha256: evidenceDigest(manifest.active.cases) }
}

export function terminalProfileCorpus(profile: 'active' | 'original' = 'active') {
  if (profile === 'active') return readActiveTerminalCorpus()
  const corpus = readTerminalCorpus(), cases = reviewedTerminalCases(corpus)
  return { profile: terminalOriginalProfileId, version: 'terminal-original-literal-120-v1', cases, diagnostics: [], originals: cases, projects: corpus.projects, corpusFile: 'corpus/terminal-project-examples.json', corpusSha256: evidenceBytesDigest(readFileSync(resolve(root, 'corpus/terminal-project-examples.json'))), sourceInventorySha256: evidenceDigest(cases.map(input => ({ id: input.id, sourceSha256: input.sourceSha256 }))) }
}

/** Saved original cohorts never silently acquire new bytes or source IDs. */
export function terminalProfileCorpusForRecord(record: { profile: string; corpusVersion?: string; corpusSha256?: string; inventory?: unknown }) {
  if (['terminal-project-corpus-v1', terminalOriginalProfileId].includes(record.profile)) return terminalProfileCorpus('original')
  if (record.profile !== terminalActiveProfileId) throw Error('Unknown terminal source profile; retain its original corpus/version')
  const active = readActiveTerminalCorpus()
  if (record.corpusVersion !== active.version || record.corpusSha256 !== active.corpusSha256 || JSON.stringify(record.inventory) !== JSON.stringify(active.cases.map(input => [input.id, input.sourceSha256]))) throw Error('Active terminal record has stale corpus membership or source identities')
  return active
}

/** Preserve a research union separately from the ordinary active benchmark.
 * Only the exact original120 plus reviewed authored sources may be projected;
 * this does not relabel, edit or erase the caller's121-entry raw record. */
export function activeTerminalGradeRecord(research: any) {
  const active = readActiveTerminalCorpus(), expected = [...active.originals, ...readTerminalSourceAdaptations()].map(input => [input.id, input.sourceSha256])
  if (JSON.stringify(research.inventory) !== JSON.stringify(expected)) throw Error('Terminal research inventory differs from the exact original and reviewed authored sources')
  const ids = new Set(active.cases.map(input => input.id)), researchIds = new Set(expected.map(([id]) => id)), diagnostics = new Set(active.diagnostics.map(input => input.id))
  if (!Array.isArray(research.outputs) || !Array.isArray(research.sourceReference) || research.outputs.some((row: any) => !researchIds.has(row.caseId)) || research.sourceReference.some((row: any) => !researchIds.has(row.caseId))) throw Error('Terminal research has undeclared output or source-reference coordinates')
  const { schema: researchSchema, ...record } = research
  return { ...record, researchSchema, profile: active.profile, corpusFile: active.corpusFile, corpusVersion: active.version, corpusSha256: active.corpusSha256, sourceInventorySha256: active.sourceInventorySha256, inventory: active.cases.map(input => [input.id, input.sourceSha256]), selectedCaseIds: active.cases.map(input => input.id), diagnosticSources: active.diagnostics, outputs: research.outputs.filter((row: any) => ids.has(row.caseId)), sourceReference: research.sourceReference.filter((row: any) => ids.has(row.caseId)), transportObservations: (research.transportObservations ?? []).filter((row: any) => !diagnostics.has(row.caseId)) }
}
