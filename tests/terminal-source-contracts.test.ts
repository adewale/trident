import { expect, test } from 'bun:test'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { readTerminalCorpus, reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { assessTerminalDrawing, assessTerminalSourceRejection } from '../fidelity/terminal-assessment.ts'
import { terminalSourceReviews } from '../scripts/review-terminal-contracts.ts'

const source = (id: string) => reviewedTerminalCases().find(input => input.id === 'terminal:' + id)!
test('all120 immutable source inputs have complete explicit obligations, with no renderer-output facts or silently omitted families', () => {
  const cases = readTerminalCorpus().cases, reviews = terminalSourceReviews()
  expect(reviews).toHaveLength(120)
  expect(reviews.map(review => review.caseId)).toEqual(cases.map(input => input.id))
  expect(new Set(reviews.map(review => review.contract.family))).toHaveLength(21)
  expect(reviews.every(review => review.contract.facts.length && !review.contract.sourceUncertainties.length && review.sourceSha256 === cases.find(input => input.id === review.caseId)!.sourceSha256)).toBe(true)
  expect(reviews.filter(review => review.intent === 'invalid')).toHaveLength(4)
})
test('source ampersands inside labels do not become graph operators; real fan-in expands independently', () => {
  const literal = analyseTerminalSource('graph LR\nA[Track & Commit] & B(Author & Skill) --> E', 'flowchart')
  expect(literal.graph?.nodes.map(node => node.label)).toEqual(['Track & Commit', 'Author & Skill', 'E'])
  expect(literal.graph?.edges).toEqual([{ source: 'A', target: 'E' }, { source: 'B', target: 'E' }])
  const compact = source('c18237e0a535bdb7')
  expect(compact.expected.graph?.nodes.map(node => node.id)).toEqual(['A', 'B'])
  expect(compact.expected.graph?.edges).toEqual([{ source: 'A', target: 'B' }])
  expect(source('dbc553f665d05c10').expected.graph?.nodes).toHaveLength(100)
})
test('source contracts retain chart values, ER cardinality, packet bit ranges and hierarchy ownership', () => {
  expect(source('587429a5094fbb28').expected.contract?.facts.find(fact => fact.criterion === 'slice-values')?.expected).toContainEqual({ label: 'ML', value: 12.5 })
  expect(source('278dccc21dd27020').expected.contract?.facts.find(fact => fact.criterion === 'entity-relations')?.expected).toContainEqual({ source: 'ORDER', target: 'LINE-ITEM', sourceCardinality: '||', targetCardinality: '|{', identifying: true, caption: 'contains' })
  expect(source('ddef9c7af192e428').expected.contract?.facts[0]?.expected).toContainEqual({ firstBit: 32, lastBit: 63, label: 'Sequence Number' })
  expect(source('2598092a6e404821').expected.contract?.facts[0]?.expected).toContainEqual({ id: 'Leaf3', label: 'Leaf3', parent: 'Branch2', order: 5 })
})
test('empty valid source is not subject to a nonblank drawing requirement', () => {
  const empty = source('a5204531005bef25')
  expect(empty.intent).toBe('valid')
  expect(assessTerminalDrawing(empty, '').status).toBe('correct')
  expect(assessTerminalDrawing(empty, 'unexpected node').status).toBe('incorrect')
  expect(assessTerminalDrawing(empty).status).toBe('unknown')
})
test('unimplemented family facts remain unknown even when every source label and number is echoed', () => {
  const er = source('278dccc21dd27020')
  const outcome = assessTerminalDrawing(er, 'CUSTOMER ORDER LINE-ITEM places contains || o{ |{ TB')
  expect(outcome.status).toBe('unknown')
  expect('checks' in outcome && outcome.checks?.every(check => check.status === 'unknown')).toBe(true)
})
test('actual pie bar values need owned weights, percentages and complete output, not a source echo', () => {
  const pie = source('6f0f134c3b965095'), valid = 'A  █████  33.3%\nB  █████  33.3%\nC  █████  33.3%'
  expect(assessTerminalDrawing(pie, valid).status).toBe('correct')
  expect(assessTerminalDrawing(pie, valid.replace('B  █████  33.3%', 'B  █  33.3%')).status).toBe('incorrect')
  expect(assessTerminalDrawing(pie, valid.replace('C  █████  33.3%', 'C  █████  55.5%')).status).toBe('incorrect')
  expect(assessTerminalDrawing(pie, valid + '\nAdditional fake chart').status).toBe('unknown')
})
test('invalid source rejection is separate and requires typed public evidence', () => {
  const invalid = source('486d9d241d7bf98f')
  expect(assessTerminalDrawing(invalid, 'renderer error').status).toBe('unknown')
  expect(assessTerminalSourceRejection(invalid).status).toBe('unknown')
  const typed = { project: 'fixture/terminal', caseId: invalid.id, sourceSha256: invalid.sourceSha256, publicBoundary: 'synthetic public typed parser control', detail: 'UnknownDiagramError', observerSha256: 'a'.repeat(64), kind: 'unknown-family' as const }
  expect(assessTerminalSourceRejection(invalid, typed, 'fixture/terminal').status).toBe('correct')
  expect(assessTerminalSourceRejection(invalid, { ...typed, kind: 'accepted' }, 'fixture/terminal').status).toBe('incorrect')
  expect(() => assessTerminalSourceRejection(invalid, { ...typed, sourceSha256: '0'.repeat(64) }, 'fixture/terminal')).toThrow('stale')
})
