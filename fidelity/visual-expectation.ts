import type { MeaningExpectation } from './meaning.ts'
import { compileVisualStyles } from './style-expectation.ts'

/** A drawing encodes proportions and printed values, not an invisible copy of
 * its input database. Literal source bytes remain in the corpus inventory. */
export function projectVisualExpectation(family: string, literal: MeaningExpectation): { expected: MeaningExpectation; projections: string[] } {
  const expected = structuredClone(literal), facts: any = expected.facts ??= {}, projections: string[] = []
  const configuration = facts['authored-config'] ?? {}
  const lineBreaks: any[] = Array.isArray(facts['text-line-breaks']) ? facts['text-line-breaks'] : []
  const addLineBreaks = (owner: Record<string, string | number>, label: string) => { const lines = label.replace(/<br\s*\/?\s*>/gi, '\n').split('\n'); if (lines.length < 2 || lineBreaks.some(entry => entry.owner?.kind === owner.kind && entry.owner?.id === owner.id && entry.owner?.index === owner.index)) return; lineBreaks.push({ owner, lines }) }
  for (const node of expected.nodes ?? []) addLineBreaks({ kind: family === 'sequence' ? 'participant' : 'node', id: node.id }, node.label)
  for (const [index, edge] of (expected.edges ?? []).entries()) if (edge.label) addLineBreaks({ kind: family === 'sequence' ? 'message' : 'edge', index }, edge.label)
  for (const group of expected.groups ?? []) addLineBreaks({ kind: 'group', id: group.id }, group.label)
  if (typeof facts.title === 'string') addLineBreaks({ kind: 'title' }, facts.title)
  if (lineBreaks.length) facts['text-line-breaks'] = lineBreaks
  if (family === 'class' && Array.isArray(facts.members)) {
    const signature = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim().replace(/\)\s*:\s*/g, ') ').replace(/\s*:\s*/g, ':')
    const members = new Set(facts.members.flatMap((entry: any) => entry.values.map((value: string) => signature(value))))
    const owned = new Set([...(expected.nodes ?? []).map(node => node.label), ...(expected.edges ?? []).flatMap(edge => edge.label ? [edge.label] : []), ...(expected.groups ?? []).map(group => group.label), ...(typeof facts.title === 'string' ? [facts.title] : [])].map(signature))
    const labels = expected.labels.filter(label => owned.has(signature(label)) || !members.has(signature(label)))
    if (labels.length !== expected.labels.length) { expected.labels = labels; projections.push('Class member signatures are checked as complete owned member facts; syntax punctuation is not a second literal display-label obligation') }
  }
  if (Object.hasOwn(facts, 'direction')) {
    const edges = expected.edges ?? [], nodes = expected.nodes ?? [], indegree = new Map(nodes.map(node => [node.id, 0])), outdegree = new Map(indegree)
    for (const edge of edges) { indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1); outdegree.set(edge.source, (outdegree.get(edge.source) ?? 0) + 1) }
    const roots = nodes.filter(node => indegree.get(node.id) === 0), visited = new Set<string>()
    let cursor = roots[0]?.id
    while (cursor && !visited.has(cursor)) { visited.add(cursor); cursor = edges.find(edge => edge.source === cursor)?.target }
    const chain = family === 'flowchart' && nodes.length > 1 && edges.length === nodes.length - 1 && roots.length === 1 && visited.size === nodes.length && [...indegree.values(), ...outdegree.values()].every(degree => degree <= 1) && !expected.groups?.length && !facts['layout-constraints']
    if (!chain) { (expected.advisoryFacts ??= {}).direction = facts.direction; delete facts.direction; projections.push('Literal global direction remains an advisory layout hint outside a connected simple flowchart chain without local groups/constraints; it does not impose invented per-edge precedence') }
  }
  for (const key of ['edge-length-requests', 'subgraph-direction-requests', 'group-directions']) if (Object.hasOwn(facts, key)) { (expected.advisoryFacts ??= {})[key] = facts[key]; delete facts[key]; projections.push('Literal ' + key + ' is retained as advisory layout intent; its own syntax does not establish a strict per-edge/rank obligation') }
  if (family === 'sequence' && Array.isArray(facts['message-order']) && Array.isArray(facts['message-style'])) {
    let unprinted = false
    facts['message-order'] = facts['message-order'].map((message: any, index: number) => { if (!['->', '-->'].includes(facts['message-style'][index])) return message; const [from, to] = [message.from, message.to].sort(); unprinted = true; return { ...message, from, to, direction: 'unprinted' } })
    if (unprinted) projections.push('Sequence messages without arrowheads encode unordered endpoint pairs, caption, chronology and solid/dotted stroke; literal sender/receiver remain in source/native data rather than invented visible direction')
  }
  if (family === 'pie' && Array.isArray(facts.slices) && facts['show-data'] !== true) {
    const total = facts.slices.reduce((sum: number, slice: any) => sum + slice.value, 0)
    if (total > 0 && facts.slices.every((slice: any) => Number.isFinite(slice.value) && slice.value >= 0)) {
      facts.slices = facts.slices.map((slice: any) => ({ ...slice, value: slice.value / total }))
      projections.push('Pie without showData encodes each labelled slice fraction; common rescaling of unprinted totals is visually equivalent')
    }
  }
  if (family === 'sankey' && Array.isArray(facts.links)) {
    const links = structuredClone(facts.links) as { source: string; target: string; value: number }[], settings = configuration.sankey ?? {}, total = links.reduce((sum, link) => sum + link.value, 0)
    facts['show-values'] = settings.showValues !== false
    if (facts['show-values']) {
      const ids = [...new Set(links.flatMap(link => [link.source, link.target]))]
      facts['displayed-node-values'] = ids.map(id => { const incoming = links.filter(link => link.target === id).reduce((sum, link) => sum + link.value, 0), outgoing = links.filter(link => link.source === id).reduce((sum, link) => sum + link.value, 0), value = Math.max(incoming, outgoing); return { id, value, display: String(settings.prefix ?? '') + String(Math.round(value * 100) / 100) + String(settings.suffix ?? '') } })
      projections.push('Sankey showValues defaults true at the pinned schema: print each node max(incoming,outgoing), rounded to two decimal places with configured prefix/suffix')
    }
    if (total > 0 && links.every(link => Number.isFinite(link.value) && link.value >= 0)) facts.links = links.map(link => ({ ...link, value: link.value / total }))
    delete expected.edges
    projections.push('Sankey link geometry encodes relative endpoint-owned flow widths and left-to-right source/target ownership, without manufactured arrowheads; hidden absolute link totals are not additional visible facts')
    for (const key of ['showValues', 'prefix', 'suffix']) delete settings[key]
    if (configuration.sankey && !Object.keys(settings).length) delete configuration.sankey
  }
  if (family === 'treemap' && Array.isArray(facts.values)) {
    const literalValues = structuredClone(facts.values) as { id: string; value: number }[], settings = configuration.treemap ?? {}, hierarchy: { id: string; parent: string }[] = facts.hierarchy ?? (expected.nodes ?? []).map(node => ({ id: node.id, parent: node.id.split('/').slice(0, -1).join('/') })), weights = new Map(literalValues.map(entry => [entry.id, entry.value]))
    facts['show-values'] = settings.showValues !== false
    const visiting = new Set<string>()
    const weight = (id: string): number => {
      if (weights.has(id)) return weights.get(id)!
      if (visiting.has(id)) return NaN
      visiting.add(id); const children = hierarchy.filter(entry => entry.parent === id), value = children.reduce((sum, child) => sum + weight(child.id), 0); visiting.delete(id); weights.set(id, value); return value
    }
    hierarchy.forEach(entry => weight(entry.id))
    facts.hierarchy ??= hierarchy
    if (facts['show-values']) facts['displayed-values'] = hierarchy.map(entry => ({ id: entry.id, value: weight(entry.id), format: settings.valueFormat ?? ',' }))
    const normalized = hierarchy.map(entry => { const siblings = hierarchy.filter(other => other.parent === entry.parent), total = siblings.reduce((sum, other) => sum + weight(other.id), 0); return { id: entry.id, value: total > 0 ? weight(entry.id) / total : NaN } })
    if (normalized.every(entry => Number.isFinite(entry.value) && entry.value >= 0)) facts.values = normalized
    // Native hierarchy edges remain in profileExpected. The visible encoding
    // is nested area, so no unrequested arrowhead obligation is manufactured.
    delete expected.edges
    for (const key of ['showValues', 'valueFormat']) delete settings[key]
    if (configuration.treemap && !Object.keys(settings).length) delete configuration.treemap
    projections.push('Treemap area encodes sibling weight fractions including independently derived subtree aggregates; showValues defaults true, so printed source values remain separate obligations unless explicitly disabled')
  }
  if (facts['authored-config'] && !Object.keys(configuration).length) delete facts['authored-config']
  const styles = compileVisualStyles(expected)
  if (styles.active && styles.complete) { projections.push('Known source class/default/inline selectors compile to concrete node fill, stroke, width and dash paint requests; source CSS class spelling is not an additional visible fact'); return { expected: styles.expected, projections } }
  return { expected, projections }
}
