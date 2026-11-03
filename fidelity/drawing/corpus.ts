import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { readTerminalCorpus, reviewedTerminalCases, type TerminalProjectCase } from '../terminal-corpus.ts'
import { analyseTerminalSource } from '../terminal-source.ts'
import { reviewedDrawingSource } from './source-review.ts'
import type { MeaningExpectation } from '../meaning.ts'

export interface DrawingCase {
  id: string
  source: string
  family: string
  origins: any[]
  expected: MeaningExpectation
  sourceGaps: string[]
  terminal: TerminalProjectCase
  geometry: string[]
}
const hash = (source: string) => createHash('sha256').update(source).digest('hex')
export function drawingCases(): DrawingCase[] {
  const seed = reviewedTerminalCases(readTerminalCorpus()).filter(c => c.intent !== 'invalid')
  const regressions = JSON.parse(readFileSync(new URL('../../corpus/drawing-regressions.json', import.meta.url), 'utf8')).cases
  const extra = regressions.map((c: any) => {
    const literal = analyseTerminalSource(c.source, c.family)
    if (c.terminalContract) {
      literal.contract = c.terminalContract
      literal.graph = { nodes: c.expected.nodes, edges: c.expected.edges, groups: c.expected.groups }
    }
    return {
      id: c.id,
      family: c.family,
      source: c.source,
      sourceSha256: hash(c.source),
      intent: 'valid',
      features: ['project-regression'],
      expected: { status: 'independently-reviewed', reason: c.review, graph: literal.graph, contract: literal.contract, unverifiedFacts: [] },
      origins: c.origins,
      geometry: c.geometry ?? [],
      drawingExpected: c.expected,
    }
  })
  const cases: DrawingCase[] = [],
    seen = new Map<string, DrawingCase>()
  for (const input of [...seed, ...extra]) {
    const key = input.source.trim().replaceAll('\r\n', '\n'),
      previous = seen.get(key)
    if (previous) {
      previous.origins.push(...input.origins)
      previous.geometry = [...new Set([...previous.geometry, ...((input as any).geometry ?? [])])]
      continue
    }
    const literal = reviewedDrawingSource(input)
    const expected = (input as any).drawingExpected ?? literal.expected
    const sourceGaps = [...((input as any).drawingExpected ? [] : literal.unresolved), ...(input.expected.unverifiedFacts ?? [])]
    if (input.expected.status !== 'independently-reviewed') sourceGaps.push('Seed source expectations have not been admitted')
    if (!(input as any).drawingExpected && !literal.complete) sourceGaps.push('Common drawing source transcription is incomplete')
    if (!input.expected.contract || input.expected.contract.sourceUncertainties.length) sourceGaps.push(...(input.expected.contract?.sourceUncertainties ?? ['No shared source contract']))
    const item = { id: input.id, family: input.family, source: input.source, origins: [...input.origins], expected, sourceGaps, terminal: input, geometry: (input as any).geometry ?? [] }
    cases.push(item)
    seen.set(key, item)
  }
  return cases
}
