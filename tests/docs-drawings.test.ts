import { expect, test } from 'bun:test'
import { admitDocsReviews, assessDocsDrawing, sourceHash, reviewedDocsCase, type DocsDrawingReview } from '../unified/docs-drawings.ts'
import { makeSvgObservationBinding } from '../fidelity/svg-assessment.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { reviewDocumentationSource } from '../unified/docs-source-review.ts'

const input = { id: 'docs:flowchart', family: 'flowchart', source: 'flowchart LR\nA-->B' }
const review: DocsDrawingReview = reviewDocumentationSource(input)
const binding = makeSvgObservationBinding(reviewedDocsCase(input, review), 'a'.repeat(64), 'b'.repeat(64))
const checks = () => planFidelityCriteria([reviewedDocsCase(input, review)]).filter(item => item.surface === 'browser-owned-ink').map(({ criterion }) => ({ criterion, status: 'passed' as const, expected: null, actual: null, scope: 'Declared fixture observation; tests exercise evidence assembly, not the browser observer' }))

test('successful SVG return without source review never supplies a correctness pass; stale reviews fail admission', () => {
  expect(assessDocsDrawing(input, null, 'passed', true, checks(), binding).status).toBe('unknown')
  expect(admitDocsReviews([input], [review])[0]!.intent).toBe('drawing')
  expect(() => admitDocsReviews([{ ...input, source: input.source + '\nB-->C' }], [review])).toThrow('stale')
  expect(() => admitDocsReviews([input], [review, review])).toThrow('duplicate')
  expect(() => admitDocsReviews([input], [{ ...review, expected: { labels: [] } }])).toThrow()
})

test('drawing correctness requires all planned content checks, with wrong arrows and missing evidence kept distinct', () => {
  expect(assessDocsDrawing(input, review, 'passed', true, checks(), binding).status).toBe('correct')
  expect(assessDocsDrawing(input, { ...review, unverifiedFacts: ['Required decision shape'] }, 'passed', true, checks(), binding).status).toBe('unknown')
  expect(assessDocsDrawing(input, review, 'passed', true, checks().filter(row => row.criterion !== 'painted-relationships'), binding).status).toBe('unknown')
  const reversed = checks().map(row => ({ ...row, status: row.criterion === 'painted-relationships' ? 'failed' as const : row.status }))
  expect(assessDocsDrawing(input, review, 'passed', true, reversed, binding).status).toBe('incorrect')
  expect(assessDocsDrawing(input, review, 'failed', false, []).status).toBe('unknown')
})

test('a configuration-only example has no nonblank-image requirement or correctness credit', () => {
  const empty = { ...review, intent: 'configuration-only' as const, expected: undefined }
  expect(assessDocsDrawing(input, empty, 'passed', false, []).status).toBe('not-applicable')
})


test('a source-bound checker receipt cannot be reused after changing documentation expectations', () => {
  const reversed = { ...review, expected: { ...review.expected!, edges: [{ source: 'B', target: 'A', directed: true }] } }
  expect(() => assessDocsDrawing(input, reversed, 'passed', true, checks(), binding)).toThrow('stale')
})
