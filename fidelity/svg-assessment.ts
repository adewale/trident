import { planFidelityCriteria } from './ledger.ts'
import type { AuthoredFidelityCase } from './meaning.ts'
import type { BenchmarkObservation } from '../unified/types.ts'
import { constructEvidenceVerdict, defineCaseEvidenceContract, type CheckedEvidence } from '../portable/evidence-contract.ts'
import { sourceContractComplete, sourceContractScope } from './source-contract.ts'

export interface SvgEvidenceBinding { sourceSha256: string; expectationsSha256: string; svgSha256: string; observerSha256: string }
export type SvgEvidenceBindings = Readonly<Record<string, SvgEvidenceBinding>>

export function makeSvgCaseContract(testCase: AuthoredFidelityCase) {
  const planned = planFidelityCriteria([testCase]).filter(item => item.surface !== 'native-public-api')
  return defineCaseEvidenceContract({ caseId: testCase.id, source: testCase.source, expectations: JSON.parse(JSON.stringify({ family: testCase.family, expected: testCase.expected, paint: testCase.paint, prelude: testCase.prelude, sourceReview: testCase.sourceReview })), requiredChecks: planned.map(item => ({ surface: item.surface, criterion: item.criterion })) })
}

/** Called by the observer producer with the exact request/expectations and
 * retained bytes it is about to inspect; assessors never manufacture this. */
export function makeSvgObservationBinding(testCase: AuthoredFidelityCase, svgSha256: string, observerSha256: string): Readonly<SvgEvidenceBinding> {
  const contract = makeSvgCaseContract(testCase)
  if (![svgSha256, observerSha256].every(value => /^[a-f0-9]{64}$/.test(value))) throw Error('SVG observation needs actual output/observer identities')
  return Object.freeze({ sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, svgSha256, observerSha256 })
}

/** A bound output and a complete authored plan are prerequisites to a new
 * correctness verdict. Public-model availability never changes an SVG verdict.
 * Preserved status rows need independently revalidated evidence before they can
 * qualify; a fresh binding cannot relabel a historical observation. */
export function assessSvgCases(cases: readonly AuthoredFidelityCase[], observations: readonly BenchmarkObservation[], bindings?: SvgEvidenceBindings) {
  return cases.map(testCase => {
    const planned = planFidelityCriteria([testCase]).filter(item => item.surface !== 'native-public-api')
    const rows = observations.filter(row => row.metrics?.authoredCase === testCase.id && row.surface !== 'native-public-api')
    const indexed = new Map<string, BenchmarkObservation>()
    for (const row of rows) {
      const key = JSON.stringify([row.surface, row.operation])
      if (indexed.has(key)) throw Error('Duplicate SVG criterion: ' + testCase.id + ' ' + key)
      if (row.family !== testCase.family || row.metrics?.criterion !== undefined && row.metrics.criterion !== row.operation) throw Error('SVG observation contradicts its declared family/criterion')
      indexed.set(key, row)
    }
    const required = planned.map(item => indexed.get(JSON.stringify([item.surface, item.criterion])))
    const contract = makeSvgCaseContract(testCase)
    const explicit = bindings && Object.hasOwn(bindings, testCase.id) ? bindings[testCase.id] : undefined
    for (const row of rows) if (row.metrics?.sourceSha256 !== undefined && row.metrics.sourceSha256 !== contract.sourceSha256 || row.metrics?.expectationsSha256 !== undefined && row.metrics.expectationsSha256 !== contract.expectationsSha256) throw Error('SVG observation is stale for the actual source/expectations contract')
    if (explicit && (explicit.sourceSha256 !== contract.sourceSha256 || explicit.expectationsSha256 !== contract.expectationsSha256)) throw Error('SVG binding is stale for the actual source/expectations contract')
    const recorded = rows.filter(row => typeof row.metrics?.svgSha256 === 'string' && typeof row.metrics?.observerSha256 === 'string').map(row => ({ svgSha256: String(row.metrics!.svgSha256), observerSha256: String(row.metrics!.observerSha256) }))
    const binding = explicit ?? recorded[0]
    if (binding && recorded.some(item => item.svgSha256 !== binding.svgSha256 || item.observerSha256 !== binding.observerSha256)) throw Error('SVG checks refer to different output/observer bytes')
    const bound = (row: BenchmarkObservation) => binding && row.metrics?.sourceSha256 === contract.sourceSha256 && row.metrics?.expectationsSha256 === contract.expectationsSha256 && row.metrics?.svgSha256 === binding.svgSha256 && row.metrics?.observerSha256 === binding.observerSha256
    const evidence: CheckedEvidence | undefined = binding ? { schema: 'trident-checked-evidence-v1', caseId: testCase.id, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: binding.svgSha256, observerSha256: binding.observerSha256, checks: planned.flatMap((item, index) => { const row = required[index]; return row ? [{ surface: item.surface, criterion: item.criterion, status: !bound(row) ? 'unknown' as const : row.status === 'passed' ? 'passed' as const : row.status === 'failed' ? 'failed' as const : 'unknown' as const, detail: !bound(row) ? 'Observation lacks matching source, expectations, output and observer identities; historical status cannot supply new evidence' : row.detail || 'Recorded ' + row.status + ' result for ' + item.surface + '/' + item.criterion }] : [] }) } : undefined

    const profile = constructEvidenceVerdict(contract, evidence), completeSource = sourceContractComplete(testCase)
    const qualified = completeSource ? profile : constructEvidenceVerdict(contract), failed = rows.filter(row => row.status === 'failed'), admission = rows.find(row => row.operation === 'public-svg-admission')
    const unplanned = rows.filter(row => !planned.some(item => item.surface === row.surface && item.criterion === row.operation) && row.status !== 'passed')
    const status = admission?.status === 'unsupported' ? 'unsupported' : qualified.status === 'correct' && unplanned.length ? 'unknown' : qualified.status
    return { caseId: testCase.id, family: testCase.family, status, profileStatus: profile.status, sourceComplete: completeSource, sourceScope: sourceContractScope(testCase), plannedChecks: planned.length, passedChecks: required.filter(row => row?.status === 'passed' && bound(row)).length, rawPassedChecks: required.filter(row => row?.status === 'passed').length, missingChecks: required.filter(row => !row).length, failedChecks: failed.map(row => row.operation), unknownChecks: planned.filter((_item, index) => !required[index] || !bound(required[index]!) || !['passed', 'failed', 'unsupported'].includes(required[index]!.status)).map(item => item.criterion), evidence: qualified, ...(binding ? {} : { evidenceGap: 'No actual SVG/observer identity binds this assessment; status rows alone cannot supply correctness credit' }), ...(unplanned.length ? { unplannedFindings: unplanned.map(row => row.operation) } : {}) }
  })
}

export function summarizeSvgCases(cases: ReturnType<typeof assessSvgCases>) {
  const count = (status: string) => cases.filter(item => item.status === status).length
  const correct = count('correct'), incorrect = count('incorrect'), unsupported = count('unsupported'), unknown = count('unknown')
  return { correct, incorrect, unsupported, unknown, planned: cases.length, rankable: cases.length > 0 && unknown === 0, scope: 'Every planned SVG check and source fact must pass with bound output/observer evidence. Unknown observations are measurement gaps; public-model criteria and API-specific checks are excluded.' }
}
