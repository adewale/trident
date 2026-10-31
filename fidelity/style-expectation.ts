import type { MeaningExpectation, MeaningJson } from './meaning.ts'

interface PaintRule { id: string; properties: Record<string, string> }
/** Compile source selectors to source-owned paint requests. Renderer CSS class
 * names and candidate output never participate in this independent step. */
export function compileVisualStyles(input: MeaningExpectation): { complete: boolean; rules: PaintRule[]; expected: MeaningExpectation; active: boolean } {
  const expected = structuredClone(input), facts: any = expected.facts ??= {}, statements: any[] = facts['authored-style'] ?? [], ids = new Set((expected.nodes ?? []).map(node => node.id)), classes = new Map<string, Set<string>>(), definitions: { names: string[]; attributes: any[] }[] = [], inline: { ids: string[]; attributes: any[] }[] = []
  let complete = true, active = statements.length > 0
  const linkDefaults: any[][] = [], linkIndexed: { indices: number[]; attributes: any[] }[] = []
  const names = (value: unknown) => String(value ?? '').split(/[\s,]+/).filter(Boolean)
  const assign = (id: string, value: unknown) => { active = true; if (!ids.has(id) || typeof value !== 'string' && (!Array.isArray(value) || value.some(item => typeof item !== 'string'))) { complete = false; return }; const current = classes.get(id) ?? new Set<string>(); names(Array.isArray(value) ? value.join(',') : value).forEach(name => current.add(name)); classes.set(id, current) }
  for (const entry of facts['node-attributes'] ?? []) { if (entry.attributes?.classes !== undefined) assign(entry.id, entry.attributes.classes); if (entry.attributes?.class !== undefined) assign(entry.id, entry.attributes.class) }
  for (const entry of facts['entity-classes'] ?? []) assign(entry.id, entry.classes)
  for (const entry of facts['state-classes'] ?? []) assign(entry.id, entry.class)
  for (const entry of facts['css-classes'] ?? []) for (const id of entry.ids ?? [entry.id]) assign(id, entry.class)
  for (const entry of facts.hierarchy ?? []) if (entry.class !== undefined) assign(entry.id, entry.class)
  for (const statement of statements) {
    if (statement.kind === 'classDef') definitions.push({ names: names(statement.selection), attributes: statement.attributes })
    else if (statement.kind === 'class') {
      const selectors = names(statement.selection)
      if (!Array.isArray(statement.attributes) || statement.attributes.some((attribute: any) => typeof attribute.class !== 'string' || Object.keys(attribute).length !== 1)) complete = false
      else for (const id of selectors) for (const attribute of statement.attributes) assign(id, attribute.class)
    } else if (statement.kind === 'style') inline.push({ ids: names(statement.selection), attributes: statement.attributes })
    else if (statement.kind === 'linkStyle') {
      if (statement.selection === 'default') linkDefaults.push(statement.attributes)
      else if (/^\d+(?:\s*,\s*\d+)*$/.test(statement.selection)) linkIndexed.push({ indices: statement.selection.split(',').map(Number), attributes: statement.attributes })
      else complete = false
    }
    else complete = false
  }
  const supported = new Set(['fill', 'stroke', 'stroke-width', 'stroke-dasharray']), rules = new Map<string, Record<string, string>>()
  const properties = (attributes: any[]) => {
    const rule: Record<string, string> = {}
    if (!Array.isArray(attributes)) { complete = false; return rule }
    for (const attribute of attributes) {
      if (typeof attribute.property !== 'string' || typeof attribute.value !== 'string' || !supported.has(attribute.property) || Object.keys(attribute).some(key => !['property', 'value'].includes(key))) { complete = false; continue }
      if (/url\(|var\(|inherit|currentcolor|context-/i.test(attribute.value)) { complete = false; continue }
      if (attribute.property === 'stroke-width' && !/^\d+(?:\.\d+)?(?:px)?$/.test(attribute.value.trim())) { complete = false; continue }
      if (attribute.property === 'stroke-dasharray' && !/^(?:none|\d+(?:\.\d+)?(?:px)?(?:[ ,]+\d+(?:\.\d+)?(?:px)?)*)$/.test(attribute.value.trim())) { complete = false; continue }
      rule[attribute.property] = attribute.value
    }
    return rule
  }
  const apply = (id: string, attributes: any[]) => { if (!ids.has(id)) { complete = false; return }; rules.set(id, { ...rules.get(id), ...properties(attributes) }) }
  // CSS rule order resolves class defaults; inline styles override class rules.
  for (const definition of definitions) for (const id of ids) if (definition.names.some(name => name === 'default' ? !classes.get(id)?.size || classes.get(id)?.has('default') : classes.get(id)?.has(name))) apply(id, definition.attributes)
  for (const rule of inline) for (const id of rule.ids) apply(id, rule.attributes)
  const edgeRules = new Map<number, Record<string, string>>()
  const applyEdge = (index: number, attributes: any[]) => {
    if (!expected.edges?.[index]) { complete = false; return }
    edgeRules.set(index, { ...edgeRules.get(index), ...properties(attributes) })
  }
  for (const attributes of linkDefaults) for (let index = 0; index < (expected.edges?.length ?? 0); index++) applyEdge(index, attributes)
  for (const rule of linkIndexed) for (const index of rule.indices) applyEdge(index, rule.attributes)
  if (linkDefaults.length && expected.edges === undefined) complete = false
  if (!complete) return { complete: false, active, rules: [], expected: structuredClone(input) }
  if (active) {
    delete facts['authored-style']; delete facts['entity-classes']; delete facts['state-classes']; delete facts['css-classes']
    if (facts['node-attributes']) {
      facts['node-attributes'] = facts['node-attributes'].map((entry: any) => { const attributes = { ...entry.attributes }; delete attributes.class; delete attributes.classes; return { ...entry, attributes } }).filter((entry: any) => Object.keys(entry.attributes).length)
      if (!facts['node-attributes'].length) delete facts['node-attributes']
    }
    if (facts.hierarchy) facts.hierarchy = facts.hierarchy.map((entry: any) => { const result = { ...entry }; delete result.class; return result })
    const compiled = [...rules].filter(([, properties]) => Object.keys(properties).length).map(([id, properties]) => ({ id, properties })).sort((a, b) => a.id.localeCompare(b.id))
    if (compiled.length) facts['node-paint'] = compiled as unknown as MeaningJson
    const edges = [...edgeRules].filter(([, properties]) => Object.keys(properties).length).map(([index, properties]) => ({ edge: expected.edges![index], properties }))
    if (edges.length) facts['edge-paint'] = edges as unknown as MeaningJson
  }
  return { complete: true, active, rules: [...rules].map(([id, properties]) => ({ id, properties })), expected }
}
