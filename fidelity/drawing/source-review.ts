import { decodeHTML } from 'entities'
import { reviewDocumentationSource } from '../../unified/docs-source-review.ts'
import { projectVisualExpectation } from '../visual-expectation.ts'
import type { TerminalProjectCase } from '../terminal-corpus.ts'
import type { MeaningExpectation } from '../meaning.ts'

/** Reuse already independently reviewed source contracts to bridge lexical gaps
 * in the common transcriber. Only transcription is adapted; renderer input stays
 * byte-for-byte original. No candidate AST or output supplies an expectation. */
export function reviewedDrawingSource(input: TerminalProjectCase) {
  const review = (source: string) => reviewDocumentationSource({ id: input.id, source, family: input.family }, { visual: false })
  let literal = review(input.source)
  const admitted = input.expected.status === 'independently-reviewed' && input.expected.contract && !input.expected.contract.sourceUncertainties.length
  const replacements: [string, string][] = []
  let source = input.source
  const facts = input.expected.contract?.facts ?? []
  const fact = (name: string): any => facts.find(f => f.criterion === name)?.expected
  const empty = input.family === 'flowchart' && input.expected.graph?.nodes.length === 0 && input.expected.graph.edges.length === 0
  if (admitted && empty && /^\s*(?:flowchart|graph)\s*$/.test(source)) source = 'flowchart TD\n'
  if (admitted && !literal.sourceReview.expectedFactsComplete) {
    if (input.family === 'flowchart')
      source = source.replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, entity => {
        const token = 'DRAWING_ENTITY_' + replacements.length + '_'
        replacements.push([token, decodeHTML(entity)])
        return token
      })
    if (input.family === 'state')
      for (const state of fact('states') ?? [])
        if (!/^[\w.-]+$/.test(state.id)) {
          const token = 'DRAWING_STATE_' + replacements.length
          source = source.replaceAll(state.id, token)
          replacements.push([token, state.id])
        }
    if (input.family === 'class') for (const entry of fact('class-bodies') ?? []) if (entry.genericParameters) source = source.replace(new RegExp(entry.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '~[^~]+~(?=\\s*(?:<|>|[-.*o]))', 'g'), entry.id)
    if (input.family === 'architecture') for (const route of fact('port-routes') ?? []) if (route.caption) source = source.replaceAll('-[' + route.caption + ']->', '-->')
    if (input.family === 'zenuml') source = source.replace(/^\s*@Control\s+/gm, '@Actor ')
  }
  if (source !== input.source) literal = review(source)
  let expected: MeaningExpectation = literal.expected ? projectVisualExpectation(input.family, literal.expected).expected : { labels: [] }
  const restore = (value: any): any => (typeof value === 'string' ? replacements.reduce((s, [token, original]) => s.replaceAll(token, original), value) : Array.isArray(value) ? value.map(restore) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, restore(v)])) : value)
  expected = restore(expected)
  if (admitted && source !== input.source && input.family === 'architecture') {
    const routes = fact('port-routes') ?? []
    for (const edge of expected.edges ?? []) {
      const route = routes.find((r: any) => r.source === edge.source && r.target === edge.target)
      if (route?.caption) {
        edge.label = route.caption
        expected.labels.push(route.caption)
      }
    }
  }
  if (admitted && source !== input.source && input.family === 'zenuml')
    for (const kind of (expected.facts?.['participant-kinds'] ?? []) as any[]) {
      const actor = (fact('zenuml-actors') ?? []).find((a: any) => a.id === kind.id)
      if (actor) kind.kind = actor.role
    }
  for (const [sourceKey, visibleKey] of [
    ['accessible-title', 'accessibility-title'],
    ['accessible-description', 'accessibility-description'],
  ])
    if (facts.some(f => f.criterion === sourceKey && f.required === false) && expected.facts?.[visibleKey!] !== undefined) {
      ;(expected.advisoryFacts ??= {})[visibleKey!] = expected.facts[visibleKey!]!
      delete expected.facts[visibleKey!]
    }
  return { expected, unresolved: literal.sourceReview.unresolved, complete: !!literal.expected && literal.sourceReview.expectedFactsComplete, empty: !!empty }
}
