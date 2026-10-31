import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { reviewDocumentationSource, requiredDocumentationObligations } from '../unified/docs-source-review.ts'
import type { AuthoredFidelityCase } from './meaning.ts'
import { projectVisualExpectation } from './visual-expectation.ts'

const stable = (value: unknown): string => JSON.stringify(value && typeof value === 'object' ? Array.isArray(value) ? value.map(item => JSON.parse(stable(item))) : Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, JSON.parse(stable(item))])) : value)
const display = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
const canonical = (value: any, key = ''): any => {
  if (typeof value === 'string') return display(value).replace(/\)\s*:\s*/g, ') ')
  if (Array.isArray(value)) {
    const result = value.map(item => canonical(item))
    if (result.every(item => item && typeof item === 'object' && typeof item.id === 'string')) return result.sort((a, b) => a.id.localeCompare(b.id))
    return ['keys', 'members'].includes(key) ? result.sort((a, b) => stable(a).localeCompare(stable(b))) : result
  }
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([name, item]) => [name === 'label' && key === 'fragment' ? 'caption' : name, canonical(item, name)]))
}

/** Extend independently authored declarations with literal source obligations.
 * An incompatible fact is retained and explicitly prevents a whole-source
 * certificate. Candidate render/model output never enters this function. */
export function enrollAuthoredSource(input: AuthoredFidelityCase): AuthoredFidelityCase {
  const review = reviewDocumentationSource({ id: input.id, family: input.family, source: input.source }, { visual: false }), literal = structuredClone(review.expected), unresolved = [...review.sourceReview.unresolved]
  if (review.family !== input.family) unresolved.push('Authored family conflicts with literal source family: ' + input.family + ' / ' + review.family)
  if (!literal || review.intent !== 'drawing') unresolved.push('Authored drawing lacks an independently transcribed drawing source')
  const expected = structuredClone(input.expected), facts: Record<string, any> = expected.facts ??= {}
  // These are source-transcriber identities, not renderer IDs. Retain the
  // authored explicit commit names while adding type/head/operation facts.
  if (input.family === 'gitgraph' && literal?.facts?.commits) {
    const commits = literal.facts.commits as any[], names = new Map(commits.map(commit => [commit.id, commit.authoredId || commit.id]))
    const rewrite = (value: any): any => typeof value === 'string' ? names.get(value) ?? value : Array.isArray(value) ? value.map(rewrite) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewrite(item)])) : value
    literal.facts = rewrite(literal.facts)
  }
  // The authored native profile expresses parent->child hierarchy; a visible
  // mindmap connector has no arrow. Verify the same ordered hierarchy first,
  // then use its literal undirected connector obligations for the SVG plane.
  if (input.family === 'mindmap' && literal?.nodes && literal.edges && expected.nodes && expected.edges) {
    const aliases = new Map(literal.nodes.map(node => { const matching = expected.nodes!.filter(authored => authored.label === node.label); return [node.id, node.id.includes('/') && matching.length === 1 ? matching[0]!.id : node.id] }))
    const id = (value: string) => aliases.get(value) ?? value
    literal.nodes = literal.nodes.map(node => ({ ...node, id: id(node.id) })); literal.edges = literal.edges.map(edge => ({ ...edge, source: id(edge.source), target: id(edge.target) }))
    if (Array.isArray(literal.facts?.hierarchy)) literal.facts.hierarchy = (literal.facts.hierarchy as any[]).map(entry => ({ ...entry, id: id(entry.id), parent: id(entry.parent) }))
    const ordered = (edges: typeof literal.edges) => edges.map(edge => stable([edge.source, edge.target, display(edge.label ?? '')])).sort()
    if (stable(ordered(expected.edges)) === stable(ordered(literal.edges))) expected.edges = expected.edges.map(edge => ({ ...edge, directed: false }))
  }
  const merge = (authored: any, source: any, path: string): any => {
    if (stable(canonical(authored)) === stable(canonical(source))) return authored
    if (Array.isArray(authored) && Array.isArray(source)) {
      if (path === 'facts/branches' && authored.every(value => typeof value === 'string') && source.every(value => value && typeof value.id === 'string') && stable([...authored].sort()) === stable(source.map(value => value.id).sort())) return source
      if (authored.every(value => value && typeof value === 'object' && typeof value.id === 'string') && source.every(value => value && typeof value === 'object' && typeof value.id === 'string')) return [...authored.map(value => { const other = source.find(item => item.id === value.id); if (!other) { unresolved.push('Authored/source identity conflict: ' + path + '/' + value.id); return value }; return merge(value, other, path + '/' + value.id) }), ...source.filter(value => !authored.some(item => item.id === value.id))]
      if (authored.length !== source.length) { unresolved.push('Authored/source inventory conflict: ' + path); return authored }
      return authored.map((value, index) => merge(value, source[index], path + '/' + index))
    }
    if (authored && source && typeof authored === 'object' && typeof source === 'object' && !Array.isArray(authored) && !Array.isArray(source)) {
      const merged = { ...authored }
      for (const [key, value] of Object.entries(source)) {
        const alias = key === 'caption' && Object.hasOwn(authored, 'label') && path.startsWith('facts/fragments') ? 'label' : key
        if (!Object.hasOwn(authored, alias)) merged[key] = value
        else { merged[alias] = merge(authored[alias], value, path + '/' + alias); if (alias !== key) merged[key] = value }
      }
      return merged
    }
    unresolved.push('Authored/source literal conflict: ' + path); return authored
  }
  if (literal) {
    expected.labels = [...new Set([...expected.labels, ...literal.labels])]
    if (literal.forbiddenLabels?.length) expected.forbiddenLabels = [...new Set([...(expected.forbiddenLabels ?? []), ...literal.forbiddenLabels])]
    for (const field of ['nodes', 'groups'] as const) if (literal[field]) {
      const authored = expected[field]
      if (!authored) (expected as any)[field] = structuredClone(literal[field])
      else {
        for (const entry of literal[field]!) {
          const existing = authored.find(value => value.id === entry.id)
          if (!existing) (authored as any[]).push(structuredClone(entry))
          else Object.assign(existing, merge(existing, entry, field + '/' + entry.id))
        }
        for (const entry of input.expected[field] ?? []) if (!literal[field]!.some(value => value.id === entry.id) && !(field === 'nodes' && literal.groups?.some(group => group.id === entry.id))) unresolved.push('Authored identity absent from literal source: ' + field + '/' + entry.id)
      }
    }
    if (literal.edges) {
      const edges = expected.edges ??= [], ordered: typeof edges = []
      const coordinate = (edge: any) => stable([edge.source, edge.target, edge.directed, edge.label === undefined ? null : display(edge.label)])
      const available = [...edges]
      for (const source of literal.edges) { const index = available.findIndex(edge => source.source === edge.source && source.target === edge.target && source.directed === edge.directed && (edge.label === undefined || display(edge.label) === display(source.label ?? ''))); ordered.push(index < 0 ? structuredClone(source) : merge(available.splice(index, 1)[0], source, 'relationships/' + coordinate(source))) }
      for (const edge of available) unresolved.push('Authored relationship absent from literal source: ' + coordinate(edge))
      expected.edges = [...ordered, ...available]
    }
    for (const [key, value] of Object.entries(literal.facts ?? {})) facts[key] = Object.hasOwn(facts, key) ? merge(facts[key], value, 'facts/' + key) : structuredClone(value)
    if (facts['axis-labels'] && facts.axes && stable(facts['axis-labels']) !== stable([...(facts.axes.x ?? []), ...(facts.axes.y ?? [])])) unresolved.push('Authored flattened quadrant axes conflict with literal axis endpoints')
  }
  const visual = projectVisualExpectation(input.family, expected)
  const sourceReview = { protocol: 'authored-full-source-v1', sourceSha256: evidenceBytesDigest(input.source), expectedSha256: evidenceDigest(visual.expected), expectedFactsComplete: review.sourceReview.expectedFactsComplete && unresolved.length === 0, requiredObligations: requiredDocumentationObligations(visual.expected), unresolved: [...new Set(unresolved)], provenance: input.provenance + '; independent literal source transcriber; its documentation grammar pin is not the origin of this authored case', visualProjections: visual.projections }
  return { ...input, profileExpected: structuredClone(input.profileExpected ?? input.expected), expected: visual.expected, sourceReview }
}

export function sourceContractComplete(input: AuthoredFidelityCase): boolean {
  return !!input.sourceReview?.expectedFactsComplete && input.sourceReview.sourceSha256 === evidenceBytesDigest(input.source) && input.sourceReview.expectedSha256 === evidenceDigest(input.expected) && input.sourceReview.unresolved.length === 0 && stable(input.sourceReview.requiredObligations) === stable(requiredDocumentationObligations(input.expected))
}

export function sourceContractScope(input: Pick<AuthoredFidelityCase, 'sourceReview'>) {
  return input.sourceReview?.expectedFactsComplete ? 'Every independently transcribed source obligation is enrolled; each still needs output evidence' : 'Bounded authored profile only; full source obligations remain unresolved: ' + (input.sourceReview?.unresolved.join('; ') ?? 'no complete source review')
}
