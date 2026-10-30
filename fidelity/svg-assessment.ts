import { planFidelityCriteria } from './ledger.ts'
import type { AuthoredFidelityCase } from './meaning.ts'
import type { BenchmarkObservation } from '../unified/types.ts'

/** Public-model availability never changes an SVG verdict. The authored plan,
 * rather than the checks that happened to run, fixes the required population. */
export function assessSvgCases(cases: readonly AuthoredFidelityCase[], observations: readonly BenchmarkObservation[]) {
  return cases.map(testCase => {
    const planned = planFidelityCriteria([testCase]).filter(item => item.surface !== 'native-public-api')
    const rows = observations.filter(row => row.metrics?.authoredCase === testCase.id && row.surface !== 'native-public-api')
    const indexed = new Map<string, BenchmarkObservation>()
    for (const row of rows) {
      const key = JSON.stringify([row.surface, row.operation])
      if (indexed.has(key)) throw Error('Duplicate SVG criterion: ' + testCase.id + ' ' + key)
      indexed.set(key, row)
    }
    const required = planned.map(item => indexed.get(JSON.stringify([item.surface, item.criterion])))
    const failed = rows.filter(row => row.status === 'failed')
    const admission = rows.find(row => row.operation === 'public-svg-admission')
    const status = failed.length ? 'incorrect' : admission?.status === 'unsupported' ? 'unsupported' : required.length > 0 && required.every(row => row?.status === 'passed') && rows.every(row => row.status === 'passed') ? 'correct' : 'unknown'
    return { caseId: testCase.id, family: testCase.family, status, plannedChecks: planned.length, passedChecks: required.filter(row => row?.status === 'passed').length, missingChecks: required.filter(row => !row).length, failedChecks: failed.map(row => row.operation), unknownChecks: planned.filter((_item, index) => !required[index] || !['passed', 'failed', 'unsupported'].includes(required[index]!.status)).map(item => item.criterion) }
  })
}

export function summarizeSvgCases(cases: ReturnType<typeof assessSvgCases>) {
  const count = (status: string) => cases.filter(item => item.status === status).length
  const correct = count('correct'), incorrect = count('incorrect'), unsupported = count('unsupported'), unknown = count('unknown')
  return { correct, incorrect, unsupported, unknown, planned: cases.length, rankable: cases.length > 0 && unknown === 0, scope: 'Every planned SVG check must pass. Unknown observations are measurement gaps; public-model criteria and API-specific checks are excluded.' }
}
