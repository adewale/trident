import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { documentationPopulation, documentationDrawingScore } from '../unified/docs-population.ts'
import type { BenchmarkObservation } from '../unified/types.ts'

const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString())
const grade = (caseId: string, status: BenchmarkObservation['status']): BenchmarkObservation => ({ suite: 'docs', surface: 'review', runtime: 'retained', caseId, operation: 'drawing-checks', status })

test('full literal docs inventory has a fixed drawing population and separate invalid/configuration controls', () => {
  const population = documentationPopulation(inventory.cases)
  expect(population.literalOccurrences).toBe(548)
  expect(population.drawings.size).toBe(546)
  expect(population.invalid.size).toBe(1)
  expect(population.configuration).toBe(1)
  const changedRoles = inventory.cases.map((row: any) => ({ id: row.id, intent: 'configuration-only' }))
  expect(documentationPopulation(inventory.cases, changedRoles).drawings).toEqual(population.drawings)
  const changedBytes = inventory.cases.map((row: any) => ({ ...row, source: row.source + '\n%% changed' }))
  expect(documentationPopulation(changedBytes, changedRoles).drawings.size).toBe(548)
})

test('accepting invalid source earns no drawing credit and duplicate or excluded drawings are rejected', () => {
  const population = documentationPopulation(inventory.cases), drawing = [...population.drawings][0]!, invalid = [...population.invalid][0]!
  const score = documentationDrawingScore([grade(drawing, 'passed'), grade(invalid, 'passed')], population)
  expect({ correct: score.correct, incorrect: score.incorrect, unknown: score.unknown, planned: score.planned }).toEqual({ correct: 1, incorrect: 0, unknown: 545, planned: 546 })
  expect(() => documentationDrawingScore([grade(drawing, 'passed'), grade(drawing, 'failed')], population)).toThrow('Duplicate')
  expect(() => documentationDrawingScore([grade(drawing, 'not-applicable')], population)).toThrow('excluded')
})
