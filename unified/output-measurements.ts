import type { BenchmarkObservation } from './types.ts'

/** Explicit transport facts only. A failed grade or missing observation says
 * nothing about whether an output was actually returned. */
export function reduceOutputMeasurements(ids: readonly string[], rounds: number, rows: readonly BenchmarkObservation[]) {
  if (!ids.length || new Set(ids).size !== ids.length || !Number.isSafeInteger(rounds) || rounds < 1) throw Error('Output measurement needs a unique fixed population and positive rounds')
  const coordinates = new Map<string, BenchmarkObservation>()
  let explicit = false, returnedBytes = 0, measuredReturns = 0
  const calls = { returned: 0, errors: 0, interrupted: 0, missing: 0 }
  for (const row of rows) {
    if (row.operation !== 'render') continue
    const round = row.metrics?.round
    if (!ids.includes(row.caseId) || typeof round !== 'number' || !Number.isSafeInteger(round) || round < 1 || round > rounds) throw Error('Output coordinate differs from the fixed population')
    const key = JSON.stringify([row.caseId, round])
    if (coordinates.has(key)) throw Error('Duplicate public output coordinate')
    coordinates.set(key, row)
    const returned = row.metrics?.publicOutputReturned, valid = row.metrics?.formatValid, bytes = row.metrics?.returnedBytes
    if (returned === true || returned === false || valid === true || valid === false || row.metrics?.outputState === 'interrupted') explicit = true
    if (returned === true) calls.returned++
    else if (returned === false) calls.errors++
    else if (row.metrics?.outputState === 'interrupted') calls.interrupted++
    if (valid === true && returned !== true || valid === false && returned !== true || typeof bytes === 'number' && (returned !== true || !Number.isSafeInteger(bytes) || bytes < 0)) throw Error('Output measurements contradict the retained public return')
    if (typeof bytes === 'number') { returnedBytes += bytes; measuredReturns++ }
  }
  if (!explicit) return undefined // Old admission grades cannot invent raw facts.
  calls.missing = ids.length * rounds - calls.returned - calls.errors - calls.interrupted
  const production = { returned: 0, noOutput: 0, unknown: 0 }, validity = { valid: 0, invalid: 0, noOutput: 0, unknown: 0 }
  for (const id of ids) {
    const own = Array.from({ length: rounds }, (_, index) => coordinates.get(JSON.stringify([id, index + 1]))?.metrics)
    if (own.every(metrics => metrics?.publicOutputReturned === true)) production.returned++
    else if (own.some(metrics => metrics?.publicOutputReturned === false)) production.noOutput++
    else production.unknown++
    if (own.every(metrics => metrics?.formatValid === true)) validity.valid++
    else if (own.some(metrics => metrics?.formatValid === false)) validity.invalid++
    else if (own.some(metrics => metrics?.publicOutputReturned === false)) validity.noOutput++
    else validity.unknown++
  }
  return { production, validity, calls, returnedBytes: measuredReturns ? returnedBytes : null, measuredReturns, plannedCalls: ids.length * rounds,
    completeBytePopulation: measuredReturns === ids.length * rounds }
}
