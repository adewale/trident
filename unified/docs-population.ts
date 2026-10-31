import { docsSourceAdmission } from './docs-source-admission.ts'
import type { DocsInput } from './docs-drawings.ts'
import type { BenchmarkObservation } from './types.ts'

/** Canonical roles come from the independently reviewed source registry.
 * Missing or altered reviews cannot shrink the drawing population. Raw return
 * coverage still retains every literal occurrence, including the controls. */
export function documentationPopulation(inputs: readonly DocsInput[], reviews: readonly { id: string; intent?: string; registeredIntent?: string; review?: { intent?: string } | null }[] = []) {
  const roles = inputs.map(input => {
    const admission = docsSourceAdmission(input, null), review = reviews.find(item => item.id === input.id)
    return { id: input.id, intent: admission.canonical ? admission.registeredIntent : review?.registeredIntent ?? review?.intent ?? review?.review?.intent ?? 'drawing' }
  })
  const drawings = new Set(roles.filter(row => !['configuration-only', 'invalid-source'].includes(row.intent ?? '')).map(row => row.id))
  const invalid = new Set(roles.filter(row => row.intent === 'invalid-source').map(row => row.id))
  return { drawings, invalid, configuration: roles.filter(row => row.intent === 'configuration-only').length, literalOccurrences: inputs.length }
}

export function documentationDrawingScore(rows: readonly BenchmarkObservation[], population: ReturnType<typeof documentationPopulation>) {
  const checked = rows.filter(row => row.operation === 'drawing-checks' && population.drawings.has(row.caseId))
  if (new Set(checked.map(row => row.caseId)).size !== checked.length) throw Error('Duplicate documentation drawing grades')
  if (checked.some(row => row.status === 'not-applicable')) throw Error('A registered drawing was excluded from correctness scoring')
  const correct = checked.filter(row => row.status === 'passed').length, incorrect = checked.filter(row => row.status === 'failed').length
  return { checked, correct, incorrect, unknown: population.drawings.size - correct - incorrect, planned: population.drawings.size }
}
