import { expect, test } from 'bun:test'
import { mergeFidelityRuns } from '../scripts/merge-fidelity-runs.ts'
import { capabilityAssessmentCause, gapCause, gapsByCause, NATIVE_UNSUPPORTED } from '../scripts/fidelity-gaps.ts'
import { unboundNativeCapability } from '../unified/mermaid-fidelity/native-capabilities.mjs'
import { fidelityOutcomes } from '../unified/mermaid-fidelity.ts'
import { assessmentBasis, callbackUnsupportedKind, outcomeKind, unsupportedKind } from '../unified/mermaid-fidelity/outcome-kinds.ts'
import { fidelityScoring } from '../unified/mermaid-fidelity/scoring.ts'
import { renderBindingCoverage } from '../unified/fidelity-report.ts'

test("an unsupported verdict is native only when the candidate's own code reported it", () => {
  // Recorded provenance: the candidate's own exception, a bridge's reply, Trident's judgement.
  expect(unsupportedKind('anything the parser threw', 'native')).toBe('native')
  expect(unsupportedKind('Unable to detect diagram type', 'bridge')).toBe('native')
  expect(unsupportedKind('mermaidtui has no er parser (it parses flowchart)', 'bridge')).toBe('assessment')
  expect(unsupportedKind('mermaid_core 0.3.2 does not export its radar parser (parseRadar) from its public library', 'bridge')).toBe('assessment')
  expect(unsupportedKind("flowchart database addVertex (the candidate exposes a parser, not Mermaid's database API)", 'trident')).toBe('assessment')
  expect(unsupportedKind("Crafter's class model keeps no notes", 'trident')).toBe('assessment')
  // A verdict that reports what the candidate's own parser returned is native, whoever words it.
  expect(unsupportedKind('Frankenmermaid does not recognise agentflow diagrams; its parser read the source as a Flowchart diagram', 'trident')).toBe('native')
  expect(unsupportedKind('Crafter parsed this source as flowchart, not state', 'bridge')).toBe('native')
  // Results collected before provenance was recorded: classified from the text alone.
  for (const reason of ['Unrecognized diagram type', 'Unable to detect diagram type', 'Could not detect diagram kind. Expected the first non-empty line', "Line 1: Unsupported diagram type or missing direction (Suggestion: Use 'flowchart LR')", 'Actual native parse returned opaque', 'No diagram type detected for the given text.'])
    expect(unsupportedKind(reason), reason).toBe('native')
  for (const reason of ['Ondine exposes no parsed model; render() reports acceptance or rejection only', 'xychart parser driving a caller-supplied database (Mermaid jison yy callback protocol)', 'termaid has no radar parser', "Diagram.fromText in a shared test (Mermaid's diagram detection, type ids and registry)"])
    expect(unsupportedKind(reason), reason).toBe('assessment')
  // A callback is native when any of its verdicts is.
  expect(callbackUnsupportedKind(['a', 'b'], ['assessment', 'native'])).toBe('native')
  expect(callbackUnsupportedKind(['a'], ['assessment'])).toBe('assessment')
})

test('every capability assessment names its basis', () => {
  expect(assessmentBasis('mermaidtui has no er parser (it parses flowchart)')).toBe('family-table')
  expect(assessmentBasis('mermaid_core 0.3.2 does not export its block parser (parseBlock) from its public library')).toBe('public-library')
  expect(assessmentBasis('xychart parser driving a caller-supplied database (Mermaid jison yy callback protocol)')).toBe('jison-callback')
  expect(assessmentBasis("class database setLink spied on or inspected (Mermaid's parser -> database protocol)")).toBe('database-protocol')
  expect(assessmentBasis("gantt database setDateFormat (the candidate exposes a parser, not Mermaid's database API)")).toBe('database-api')
  expect(assessmentBasis("Mermaid's mindmap getData() is its renderer's layout data")).toBe('renderer-layout')
  expect(assessmentBasis('Pele keeps text wrapping as a renderer setting, not per CN element')).toBe('model-concept')
  expect(assessmentBasis('Ondine exposes no parsed model; render() reports acceptance or rejection only')).toBe('no-model')
})

const file = '/up/packages/mermaid/src/diagrams/x/x.spec.ts'
const native = (statuses: string[]) => ({ testResults: [{ name: file, assertionResults: statuses.map((status, i) => ({ fullName: 't' + i, status })) }] })
const audit = (index: number, extra: any) => ({ file, index, fullName: 't' + index, gaps: [], calls: 1, unsupported: [], faults: [], ...extra })

test('case rows carry the kind of an unsupported verdict from the audit, else from its reason', () => {
  const rows = fidelityOutcomes(native(['passed', 'passed', 'passed', 'passed']), native(['failed', 'failed', 'passed', 'failed']), [
    audit(0, { unsupported: ['Line 1: Unsupported diagram type'], unsupportedKinds: ['native'] }),
    audit(1, { unsupported: ['family absent from a table'], unsupportedKinds: ['assessment'] }),
    audit(2, {}),
    audit(3, { unsupported: ['Unrecognized diagram type'] }),
  ])
  expect(rows.map((row: any) => [row.status, row.unsupportedKind])).toEqual([['unsupported', 'native'], ['unsupported', 'assessment'], ['passed', undefined], ['unsupported', 'native']])
  expect(rows.map(outcomeKind)).toEqual(['native-unsupported', 'capability-assessment', 'passed', 'native-unsupported'])
})

const DIAGRAM = 'packages/mermaid/src/diagrams/flowchart/parser/flow.spec.js'
const WEBSITE = 'packages/mermaid/src/docs/.vitepress/redirect.spec.ts'
const referenceCases = [DIAGRAM, DIAGRAM, DIAGRAM, DIAGRAM, DIAGRAM, WEBSITE, WEBSITE].map((path, i) => ({ file: path, name: 't' + i, status: 'passed' }))
const run = (results: any[]) => ({ pin: 'p', selection: 'all core package tests', selectedFiles: 2, inventory: {}, outsideSelectedRunner: [], blocked: [], updatedAt: '2026-11-14T00:00:00Z', collectedThrough: '2026-11-14T00:00:00Z', results })
const reference = { project: 'mermaid-js/mermaid', version: '12.3.0', missingFiles: [], cases: referenceCases }
const row = (project: string, outcomes: [string, string?, string?][]) => ({ project, version: '1', missingFiles: [], cases: referenceCases.map((c, i) => { const [status, reason, unsupportedKind] = outcomes[i]!; return { ...c, status, ...(reason ? { reason } : {}), ...(unsupportedKind ? { unsupportedKind } : {}) } }) })

test('merged results count each outcome kind per project; scoring is unchanged', () => {
  const merged = mergeFidelityRuns([run([reference, row('a', [
    ['passed'], ['failed', 'AssertionError'], ['unsupported', 'Unrecognized diagram type', 'native'], ['unsupported', "flowchart database addVertex (the candidate exposes a parser, not Mermaid's database API)", 'assessment'], ['trident-blocked', 'flowchart.db.getX'],
    ['unsupported', 'a has no flowchart parser', 'assessment'], ['passed'],
  ])])])
  const a = merged.results.find(r => r.project === 'a')!
  expect(a.outcomeKinds).toEqual({
    scored: { passed: 1, 'native-failure': 1, 'native-unsupported': 1, 'capability-assessment': 1, 'adapter-limitation': 1 },
    qualified: { passed: 2, 'native-failure': 1, 'native-unsupported': 1, 'capability-assessment': 2, 'adapter-limitation': 1 },
  })
  expect(a.nativeUnsupportedReasons).toEqual({ 'Unrecognized diagram type': 1 })
  expect(a.assessmentBases).toEqual({ 'database-api': 1 })
  expect(gapsByCause(merged).a).toMatchObject({ [NATIVE_UNSUPPORTED]: 1, [capabilityAssessmentCause('database-api')]: 1 })
  // Native unsupported and capability assessments are both unassessed, as before.
  expect(fidelityScoring(merged).score(a)).toMatchObject({ passed: 1, nonpasses: 1, unassessed: 3 })
  const table = renderBindingCoverage(merged)
  expect(table).toContain('## Binding coverage')
  expect(table).toContain('| Project | Version | Passed (scored) | Native failures (scored) | Native unsupported (scored) | Capability assessments (scored) | Adapter limitations (scored) | Passed (all) |')
  expect(table).toContain('| a | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 2 | 1 |')
  expect(table).not.toContain('mermaid-js/mermaid')
  // A row merged before outcome kinds were recorded cannot be rendered as if it had them.
  const { outcomeKinds: _kinds, ...legacy } = a
  expect(() => renderBindingCoverage({ ...merged, results: [legacy] })).toThrow('records no outcome kinds')
})

test('a withdrawn assessment is listed as a native capability Trident has not bound yet', () => {
  expect(gapCause(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'flowchart', 'addVertex')!)).toBe('Native capability not yet bound')
})

test('a family parse reported against the shared request is Trident\'s mismatch, not a native refusal', () => {
  for (const provenance of [undefined, 'native', 'bridge'] as const) {
    expect(unsupportedKind('bezel detected this source as flowchart, not <shared>', provenance)).toBe('assessment')
    expect(unsupportedKind('merman parsed this source as flowchart-v2, not <shared>', provenance)).toBe('assessment')
  }
  expect(assessmentBasis('merman parsed this source as venn, not <shared>')).toBe('mermaid-pipeline')
  // A real family mismatch stays the candidate's own observation.
  expect(unsupportedKind('bezel detected this source as flowchart, not sequence', 'bridge')).toBe('native')
})
