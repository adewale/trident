import { expect, test } from 'bun:test'
import { checkUnassessedBreakdowns, mergeFidelityRuns } from '../scripts/merge-fidelity-runs.ts'
import { fidelityScoring } from '../unified/mermaid-fidelity/scoring.ts'
import { assessmentConfirmations, sourceDigest } from '../unified/mermaid-fidelity/verification.ts'
import { normaliseReason, unassessedOwner, unassessedTotals } from '../unified/mermaid-fidelity/unassessed.ts'
import { FIDELITY_UNASSESSED_PAGE, hasUnassessedBreakdown, renderFidelityUnassessed } from '../unified/fidelity-unassessed.ts'

const file = 'packages/mermaid/src/diagrams/x/x.spec.ts'
const run = (results: any[]) => ({ pin: 'p', selection: 'all core package tests', selectedFiles: 1, inventory: {}, outsideSelectedRunner: [], blocked: [], updatedAt: '2026-11-15T08:00:00Z', collectedThrough: '2026-11-15T08:59:56.926Z', results })
// One callback per outcome: known outcomes first, then one per unassessed owner.
const outcomes: any[] = [
  { status: 'passed' },
  { status: 'failed', reason: 'expected 1 to be 2' },
  { status: 'trident-blocked', reason: 'Candidate test not collected' },
  { status: 'trident-blocked', reason: "Trident error: TypeError: Cannot read properties of undefined (reading 'length')\n    at view.mjs:12" },
  { status: 'trident-blocked', reason: 'block.db.getBlocks' },
  { status: 'unsupported', unsupportedKind: 'native', reason: 'Unrecognized diagram type', refusedSources: ['graph TD\nA-->B'] },
  { status: 'unsupported', unsupportedKind: 'native', reason: 'Unrecognized diagram type', refusedSources: ['rule = "a"'] },
  { status: 'unsupported', unsupportedKind: 'native', reason: 'No diagram type detected' },
  { status: 'unsupported', unsupportedKind: 'assessment', reason: 'a has no gitGraph parser' },
  { status: 'unsupported', unsupportedKind: 'assessment', reason: 'a keeps these 3 statements only as unparsed source lines' },
]
const reference = { project: 'mermaid-js/mermaid', version: '12.3.0', missingFiles: [], cases: outcomes.map((_, i) => ({ file, name: 't' + i, status: 'passed' })) }
const candidate = (project: string) => ({ project, version: '1.0.0', missingFiles: [{ path: file, reason: 'TRIDENT_ADAPTER_GAP: radar.db.getAxes' }], cases: outcomes.map((outcome, i) => ({ file, name: 't' + i, ...outcome })) })
const refusals = { protocol: 'fidelity-refusal-verification-v2', oracle: {}, verdicts: { [sourceDigest('graph TD\nA-->B')]: { accepted: true }, [sourceDigest('rule = "a"')]: { accepted: false, detectedType: null } } }
const reviews = assessmentConfirmations([{ assessments: [{ verdict: 'confirmed', basis: 'family-table', projects: ['a'] }] }])
const merged = () => mergeFidelityRuns([run([reference, candidate('a')])], { refusals, reviews })

test('each unassessed callback has one owner by its outcome kind and reason', () => {
  expect(unassessedOwner({ status: 'trident-blocked', reason: 'Candidate test not collected' })).toBe('trident-collection')
  expect(unassessedOwner({ status: 'trident-blocked', reason: 'Trident error: TypeError: x' })).toBe('trident-defect')
  expect(unassessedOwner({ status: 'trident-blocked', reason: 'zombie-mermaid exports parseGitGraph for gitgraph, which has no reviewed Trident binding' })).toBe('trident-binding')
  expect(unassessedOwner({ status: 'trident-blocked', reason: 'block.db.getBlocks' })).toBe('trident-binding')
  // Any other adapter limitation is binding or view work, even one that mentions an error.
  expect(unassessedOwner({ status: 'trident-blocked', reason: 'Native schema projection failed: Error: TRIDENT_ADAPTER_GAP: x' })).toBe('trident-binding')
  expect(unassessedOwner({ status: 'trident-blocked', reason: 'Candidate callback has no native-operation audit (reported skipped)' })).toBe('trident-binding')
  expect(unassessedOwner({ status: 'unsupported', unsupportedKind: 'native', reason: 'anything' })).toBe('evidence-refusal')
  expect(unassessedOwner({ status: 'unsupported', reason: 'Unrecognized diagram type' })).toBe('evidence-refusal') // classified from the text
  expect(unassessedOwner({ status: 'unsupported', unsupportedKind: 'assessment', reason: 'Unrecognized diagram type' })).toBe('evidence-assessment')
  expect(unassessedOwner({ status: 'unsupported', reason: 'a records a link and an arrow the same way' })).toBe('evidence-assessment')
  expect(() => unassessedOwner({ status: 'passed' })).toThrow('Only an unsupported or trident-blocked callback')
  expect(normaliseReason('  Trident error: 12 of 345\nstack')).toBe('Trident error: N of N')
  expect(normaliseReason('x'.repeat(200))).toHaveLength(160)
})

test('the merge breaks every row\'s unassessed callbacks down by owner and reason, summing to its score', () => {
  const fidelity = merged(), scoring = fidelityScoring(fidelity)
  const row: any = fidelity.results.find(r => r.project === 'a')
  expect(row.unassessed).toEqual({
    'trident-binding': { 'block.db.getBlocks': 1 },
    'trident-collection': { 'Candidate test not collected': 1 },
    'trident-defect': { "Trident error: TypeError: Cannot read properties of undefined (reading 'length')": 1 },
    'evidence-assessment': { 'a keeps these N statements only as unparsed source lines': 1 },
    'evidence-refusal': { 'Unrecognized diagram type': 1, 'No diagram type detected': 1 },
  })
  for (const result of fidelity.results) expect(unassessedTotals((result as any).unassessed).total).toBe(scoring.score(result).unassessed)
  expect(scoring.score(row)).toMatchObject({ unassessed: 6, verifiedRefusals: 1, confirmedAbsences: 1 })
  // Existing fields are unchanged beside the breakdown.
  expect(row.gapReasons).toEqual({ 'Candidate test not collected': 1, "Trident error: TypeError: Cannot read properties of undefined (reading 'length')": 1, 'block.db.getBlocks': 1 })
  const tampered = structuredClone(fidelity) as any
  tampered.results[1].unassessed['trident-binding']['block.db.getBlocks'] = 2
  expect(() => checkUnassessedBreakdowns(tampered)).toThrow("a's unassessed breakdown covers 7 callbacks, not the 6 scoring leaves unassessed")
  // A result merged before the breakdown existed is still accepted.
  for (const result of tampered.results) delete result.unassessed
  expect(() => checkUnassessedBreakdowns(tampered)).not.toThrow()
})

test('the unassessed page groups every callback by owner, candidate and reason, and needs the breakdown', () => {
  const fidelity: any = mergeFidelityRuns([run([reference, candidate('a'), { ...candidate('b'), version: '2.0.0' }])], { refusals, reviews })
  // The capability review confirms the family-table assessment for a only, so b keeps it unassessed.
  const b = fidelity.results.find((r: any) => r.project === 'b')
  expect(hasUnassessedBreakdown(fidelity)).toBe(true)
  const page = renderFidelityUnassessed(fidelity, (project, version) => `${project.toUpperCase()} ${version}`)!
  expect(page).toBe(renderFidelityUnassessed(structuredClone(fidelity), (project, version) => `${project.toUpperCase()} ${version}`)!) // stable
  expect(page.endsWith('|\n')).toBe(true)
  expect(page).toStartWith('# Unassessed Mermaid Fidelity callbacks\n')
  expect(page).toContain('(collected through 2026-11-15)')
  expect(page).not.toContain('08:59')
  expect(page).toContain('Each of the 2 ranked candidates is scored on the same 10 callbacks')
  expect(page).toContain('| Trident: binding or view | 2 | 2 |')
  expect(page).toContain('| Evidence: unreviewed assessment | 3 | 2 |')
  expect(page).toContain('| Evidence: unrecognised refusal | 4 | 2 |')
  expect(page).toContain('| **Total** | **13** | 2 |')
  expect(page).toContain('| Project | Unassessed ↓ | Trident: binding or view | Trident: file did not load | Trident: defect | Evidence: unreviewed assessment | Evidence: unrecognised refusal |')
  expect(page).toContain('| B 2.0.0 | 7 | 1 | 1 | 1 | 2 | 2 |\n| A 1.0.0 | 6 | 1 | 1 | 1 | 1 | 2 |') // most unassessed first
  expect(page).toContain('| a has no gitGraph parser | 1 | B 2.0.0 (1) |')
  expect(page).toContain('### Trident: defect (2)')
  expect(page).toContain("| Trident error: TypeError: Cannot read properties of undefined (reading 'length') | 2 | A 1.0.0 (1), B 2.0.0 (1) |")
  expect(page).toContain('| block.db.getBlocks | 2 | A 1.0.0 (1), B 2.0.0 (1) |')
  expect(page).not.toContain('MERMAID-JS') // the control has nothing unassessed and is not listed
  expect(b.unassessed['trident-collection']).toEqual({ 'Candidate test not collected': 1 })
  // A file with a non-collected callback is listed with its setup failure only when every
  // callback in it is an adapter limitation.
  expect(page).not.toContain('Files that did not load')
  const uncollected = structuredClone(fidelity)
  for (const row of uncollected.results) if (row.project !== 'mermaid-js/mermaid') row.perFile[0].counts = { 'trident-blocked': 10 }
  expect(renderFidelityUnassessed(uncollected)).toContain(`| ${file} | a 1.0.0 | 6 | TRIDENT_ADAPTER_GAP: radar.db.getAxes |`)
  // Older result files without the breakdown render no page.
  const older = structuredClone(fidelity)
  for (const row of older.results) delete row.unassessed
  expect(hasUnassessedBreakdown(older)).toBe(false)
  expect(renderFidelityUnassessed(older)).toBeUndefined()
  // A breakdown that disagrees with the score is not published.
  b.unassessed['evidence-refusal']['Unrecognized diagram type'] = 5
  expect(() => renderFidelityUnassessed(fidelity)).toThrow("b's unassessed breakdown covers 11 callbacks, not the 7")
  expect(FIDELITY_UNASSESSED_PAGE).toBe('docs/fidelity-unassessed.md')
})
