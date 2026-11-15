import { expect, test } from 'bun:test'
import { mergeFidelityRuns } from '../scripts/merge-fidelity-runs.ts'
import { refusedSources } from '../scripts/verify-fidelity-refusals.ts'
import { fidelityScope, fidelityScoring } from '../unified/mermaid-fidelity/scoring.ts'
import { assessmentConfirmations, REFUSAL_VERIFICATION_PROTOCOL, sourceDigest } from '../unified/mermaid-fidelity/verification.ts'

const file = 'packages/mermaid/src/diagrams/flowchart/flow.spec.ts'
const referenceCases = ['parse', 'db', 'spy', 'helper', 'refused', 'fragment', 'family', 'concept', 'unconfirmed', 'nothing'].map(name => ({ file, name, status: 'passed' }))
const reference = { project: 'mermaid-js/mermaid', version: '12.3.0', missingFiles: [], cases: referenceCases }
const run = (results: any[]) => ({ pin: 'p', selection: 'all', selectedFiles: 1, inventory: {}, outsideSelectedRunner: [], blocked: [], updatedAt: '2026-11-15T00:00:00Z', collectedThrough: '2026-11-15T00:00:00Z', results })
const cases = (outcomes: Record<string, any>) => referenceCases.map(c => ({ ...c, calls: 1, ...outcomes[c.name] }))
// a binds Mermaid's database natively (no verdict recorded), b does not: the surface is recorded for both.
const a = { project: 'a', version: '1', missingFiles: [], cases: cases({ db: { surfaces: ['database-api'] }, spy: { surfaces: ['database-api', 'parser-protocol'] }, helper: { status: 'trident-blocked', reason: 'x', surfaces: ['helper-import'] }, refused: { status: 'unsupported', unsupportedKind: 'native', reason: 'Unrecognized diagram type', refusedSources: ['graph TD;A-->B'] }, fragment: { status: 'unsupported', unsupportedKind: 'native', reason: 'Unrecognized diagram type', refusedSources: ['A-->B'] }, family: { status: 'unsupported', unsupportedKind: 'assessment', reason: 'a has no flowchart parser' }, concept: { status: 'unsupported', unsupportedKind: 'assessment', reason: "a's flowchart model keeps no edge ids" }, unconfirmed: { status: 'unsupported', unsupportedKind: 'assessment', reason: "a's flowchart model keeps no click events" }, nothing: { status: 'trident-blocked', reason: 'No candidate operation was exercised by this test', calls: 0 } }) }
const b = { project: 'b', version: '1', missingFiles: [], cases: cases({ db: { status: 'unsupported', unsupportedKind: 'assessment', reason: "flowchart database addVertex (the candidate exposes a parser, not Mermaid's database API)", surfaces: ['database-api'] }, spy: { status: 'unsupported', unsupportedKind: 'assessment', reason: 'x', surfaces: ['parser-protocol'] }, helper: { status: 'trident-blocked', reason: 'x' }, nothing: { status: 'trident-blocked', reason: 'No candidate operation was exercised by this test', calls: 0 } }) }
const refusals = { protocol: REFUSAL_VERIFICATION_PROTOCOL, oracle: {}, verdicts: { [sourceDigest('graph TD;A-->B')]: { accepted: true, diagramType: 'flowchart-v2' }, [sourceDigest('A-->B')]: { accepted: false, error: 'No diagram type detected' } } }
const reviews = assessmentConfirmations([
  { assessments: [{ basis: 'family-table', verdict: 'confirmed', projects: ['a'] }, { basis: 'family-table', verdict: 'confirmed that it cannot parse them, but the verdict was Trident\'s table', projects: ['b'] }] },
  { protocol: 'fidelity-model-concept-review-v1', concepts: [{ verdict: 'confirmed', projects: { a: { "a's flowchart model keeps no edge ids": 1 } } }, { verdict: 'disproved', projects: { a: { "a's flowchart model keeps no click events": 1 } } }] },
])

test('a callback that touches a Mermaid internal for any candidate is out of scope for all', () => {
  const scope = fidelityScope(reference.cases, [a, b])
  expect([...scope]).toEqual([[file + '\u00001', ['database-api']], [file + '\u00002', ['database-api', 'parser-protocol']], [file + '\u00003', ['helper-import']], [file + '\u00009', ['no-candidate-operation']]])
  // A file every candidate fails to load on an internal import at setup is out of scope.
  const missing = (reason: string) => ({ ...b, missingFiles: [{ path: file, reason }] })
  expect(fidelityScope(reference.cases, [missing('TRIDENT_ADAPTER_GAP: ../common/colorThemeGate.js.COLOR_THEMES'), missing('TRIDENT_ADAPTER_GAP: new ../src/language/x.js.Validator')]).get(file + '\u00000')).toEqual(['internal-import-at-setup'])
  // A model getter at setup is a model read, and one candidate loading the file keeps it in scope.
  expect(fidelityScope(reference.cases, [missing('TRIDENT_ADAPTER_GAP: radar.db.getDiagramTitle')]).has(file + '\u00000')).toBe(false)
  expect(fidelityScope(reference.cases, [missing('TRIDENT_ADAPTER_GAP: ../x.js.y'), a]).has(file + '\u00000')).toBe(false)
})

test('verified refusals and confirmed absences are known nonpasses; the rest stay unassessed', () => {
  const merged = mergeFidelityRuns([run([reference, a, b])], { refusals, reviews })
  expect([merged.scoredPopulation, merged.inventoryCallbacks, merged.scopedOut.internals]).toEqual([6, 4, 4])
  const row = merged.results.find((r: any) => r.project === 'a')!
  // refused: the oracle accepts the source; fragment: the oracle rejects it too.
  // family: confirmed by basis and project; concept: confirmed by exact reason; unconfirmed: disproved.
  expect(row.known).toEqual({ verifiedRefusals: 1, confirmedAbsences: 2 })
  const score = fidelityScoring(merged).score(row)
  expect([score.passed, score.nonpasses, score.unassessed]).toEqual([1, 3, 2])
  // b's family-table entry is not exactly "confirmed", so it does not count.
  expect(fidelityScoring(merged).score(merged.results.find((r: any) => r.project === 'b'))).toMatchObject({ passed: 6, nonpasses: 0, unassessed: 0 })
  // Without evidence nothing becomes known.
  const bare = mergeFidelityRuns([run([reference, a, b])])
  expect(fidelityScoring(bare).score(bare.results.find((r: any) => r.project === 'a'))).toMatchObject({ nonpasses: 0, unassessed: 5 })
})

test('refusal verification reads the refused sources of native refusals only', () => {
  expect([...refusedSources([run([reference, a, b])]).values()].map(entry => [entry.source, [...entry.projects]])).toEqual([['graph TD;A-->B', ['a']], ['A-->B', ['a']]])
})

test('a verdict whose wording contains the separator is one verdict; repeats collapse', async () => {
  const { unsupportedVerdicts } = await import('../unified/mermaid-fidelity/verification.ts')
  const ondine = 'Ondine exposes no parsed model; render() reports acceptance or rejection only'
  expect(unsupportedVerdicts({ reason: ondine })).toEqual([ondine])
  expect(unsupportedVerdicts({ reason: ondine + '; ' + ondine })).toEqual([ondine])
  expect(unsupportedVerdicts({ reason: 'a; b', unsupportedVerdicts: ['a', 'b', 'a'] })).toEqual(['a', 'b'])
  const reviews = assessmentConfirmations([{ assessments: [{ basis: 'no-model', verdict: 'confirmed', projects: ['o'] }] }])
  const { confirmedAbsence } = await import('../unified/mermaid-fidelity/verification.ts')
  expect(confirmedAbsence('o', { status: 'unsupported', unsupportedKind: 'assessment', reason: ondine }, reviews)).toBe(true)
  // With the verdict array, every distinct verdict must be confirmed.
  expect(confirmedAbsence('o', { status: 'unsupported', unsupportedKind: 'assessment', reason: 'x', unsupportedVerdicts: [ondine, "o's model keeps no notes"] }, reviews)).toBe(false)
})

test('an assessment that a field is renderer output or pipeline behaviour scopes the callback out', () => {
  const rows = [{ project: 'v', version: '1', missingFiles: [], cases: cases({ parse: { status: 'unsupported', unsupportedKind: 'assessment', reason: "Mermaid's renderer assigns container colour slots; they are not part of a parse result" }, db: { status: 'unsupported', unsupportedKind: 'assessment', reason: "Diagram.fromText in a shared test (Mermaid's diagram detection, type ids and registry)" } }) }]
  const scope = fidelityScope(reference.cases, rows)
  expect(scope.get(file + '\u00000')).toEqual(['renderer'])
  expect(scope.get(file + '\u00001')).toEqual(['pipeline'])
})
