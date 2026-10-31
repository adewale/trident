import { createHash } from 'node:crypto'
import { parse as parseYaml } from 'yaml'
import { decodeHTML, decodeHTMLStrict } from 'entities'
import { projectVisualExpectation } from '../fidelity/visual-expectation.ts'
import type { MeaningExpectation, MeaningJson } from '../fidelity/meaning.ts'
import type { DocsDrawingReview, DocsInput } from './docs-drawings.ts'

export const docsSourcePin = '1fb7869866dd619168d840291c9c54b4f129758b'
export const docsSourceReviewProtocol = 'literal-documentation-facts-v1'
export interface DocsSourceReview {
  protocol: typeof docsSourceReviewProtocol
  sourcePin: string
  method: string
  expectedFactsComplete: boolean
  requiredObligations: string[]
  unresolved: string[]
  excludedNonvisual: string[]
  visualProjections?: string[]
}
export type SourceReviewedDrawing = DocsDrawingReview & { sourceReview: DocsSourceReview }
export function requiredDocumentationObligations(expected?: MeaningExpectation) {
  return [
    ...(expected?.labels.length ? ['visible-labels'] : []),
    ...(expected?.forbiddenLabels?.length ? ['hidden-authored-content'] : []),
    ...(expected?.nodes ? ['node-identities-and-labels'] : []),
    ...(expected?.edges ? ['relationship-endpoints-directions-labels'] : []),
    ...(expected?.groups ? ['group-membership-and-labels'] : []),
    ...Object.keys(expected?.facts ?? {}).sort().map(key => 'fact:' + key),
  ]
}
const hash = (source: string) => createHash('sha256').update(source).digest('hex')
const familyNames: Record<string, string> = { graph: 'flowchart', flowchart: 'flowchart', classdiagram: 'class', sequencediagram: 'sequence', statediagram: 'state', 'statediagram-v2': 'state', erdiagram: 'er', requirementdiagram: 'requirement', gitgraph: 'gitgraph', journey: 'journey', quadrantchart: 'quadrant', xychart: 'xychart', 'xychart-beta': 'xychart' }
const cleanLabel = (label: string) => {
  let value = label.trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
  if (value.startsWith('`') && value.endsWith('`')) value = value.slice(1, -1).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/(^|[^\p{L}\p{N}_])__([^_]+)__(?=$|[^\p{L}\p{N}_])/gu, '$1$2').replace(/(^|[^\p{L}\p{N}_])_([^_]+)_(?=$|[^\p{L}\p{N}_])/gu, '$1$2').replace(/\*([^*]+)\*/g, '$1')
  return decodeHTML(value.replace(/#([A-Za-z][A-Za-z0-9]*);/g, (original, name: string) => { const entity = '&' + name + ';'; return decodeHTMLStrict(entity) === entity ? original : entity }).replace(/#(\d+);/g, '&#$1;').replace(/<br\s*\/?\s*>/gi, '\n')).replace(/\r/g, '')
}
const quoted = (line: string) => [...line.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(match => cleanLabel('"' + match[1]! + '"'))
const csv = (source: string) => {
  const values: string[] = []; let value = '', quote = false
  for (let index = 0; index < source.length; index++) {
    const char = source[index]!
    if (char === '"') { if (quote && source[index + 1] === '"') { value += '"'; index++ } else quote = !quote }
    else if (char === ',' && !quote) { values.push(value.trim()); value = '' } else value += char
  }
  values.push(value.trim()); if (quote) throw Error('Unclosed CSV quote'); return values
}
const syntaxList = (source: string) => {
  const result: string[] = []; let value = '', quote = '', depth = 0
  for (let index = 0; index < source.length; index++) {
    const char = source[index]!
    if (quote) { value += char; if (char === quote && source[index - 1] !== '\\') quote = ''; continue }
    if (char === '"' || char === "'") quote = char
    if ('[({'.includes(char)) depth++
    if ('])}'.includes(char)) depth--
    if (char === ',' && depth === 0) { result.push(value.trim()); value = '' } else value += char
  }
  if (value.trim()) result.push(value.trim()); return result
}
type FactMap = NonNullable<MeaningExpectation['facts']>
class LiteralReview {
  expected: MeaningExpectation = { labels: [], facts: {} }
  unresolved: string[] = []
  excludedNonvisual: string[] = []
  family = ''
  body = ''
  lines: string[] = []
  constructor(readonly input: DocsInput) {
    let source = input.source
    if (source.startsWith('---\n') || source.startsWith('---\r\n')) {
      const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)
      if (!match) this.unresolved.push('Unterminated frontmatter')
      else {
        try {
          const front = parseYaml(match[1]!) as any
          if (front?.title !== undefined) this.fact('title', String(front.title))
          // Configuration is explicit source intent, never an inferred render option.
          if (front?.config !== undefined) {
            const visible = JSON.parse(JSON.stringify(front.config))
            for (const path of [['logLevel'], ['kanban', 'ticketBaseUrl']]) { let parent = visible; for (const key of path.slice(0, -1)) parent = parent?.[key]; const key = path.at(-1)!; if (parent && typeof parent === 'object' && Object.hasOwn(parent, key)) { this.excludedNonvisual.push('Configuration affects logging or navigation, not the static drawing: ' + path.join('.') + '=' + JSON.stringify(parent[key])); delete parent[key] } }
            if (visible?.kanban && !Object.keys(visible.kanban).length) delete visible.kanban
            if (Object.keys(visible).length) this.fact('authored-config', visible)
          }
          for (const [key, value] of Object.entries(front ?? {})) if (!['title', 'config'].includes(key)) this.fact('frontmatter:' + key, value as MeaningJson)
        } catch (error) { this.unresolved.push('Frontmatter syntax requires review: ' + String(error)) }
        source = source.slice(match[0].length)
      }
    }
    source = source.replace(/^\s*%%\{[^\n]*\}\s*$/gm, line => { this.unresolved.push('Legacy initialization directive needs explicit option interpretation: ' + line.trim()); return '' })
    source = source.replace(/^\s*accDescr\s*\{([\s\S]*?)^\s*\}\s*$/gm, (_statement, content: string) => { this.fact('accessibility-description', content.trim()); return '' })
    source = source.replace(/^\s*acc(Title|Descr)\s*:\s*(.*)$/gm, (_statement, field: string, value: string) => { this.fact(field === 'Title' ? 'accessibility-title' : 'accessibility-description', cleanLabel(value)); return '' })
    const markdownLabels = [...source.matchAll(/"`([\s\S]*?)`"/g)].map(match => ({ source: match[1]!, text: cleanLabel('`' + match[1] + '`') }))
    if (markdownLabels.length) this.fact('markdown-source-labels', markdownLabels)
    this.body = source
    this.lines = source.split(/\r?\n/).map(line => line.replace(/\s+$/, '')).filter(line => line.trim() && !/^\s*%%/.test(line))
    const header = this.lines[0]?.trim().split(/[\s:;]+/)[0]?.toLowerCase() ?? ''
    this.family = Object.hasOwn(familyNames, header) ? familyNames[header]! : header.replace(/-beta$/, '')
    if (/^c4/.test(header)) this.family = 'c4'
  }
  fact(key: string, value: MeaningJson) { this.expected.facts![key] = value }
  labels(...values: string[]) { for (const value of values) if (value && !this.expected.labels.includes(value)) this.expected.labels.push(value) }
  unknown(line: string) { this.unresolved.push('Uninterpreted ' + this.family + ' construct: ' + line.trim()) }
  title(line: string) { const match = /^\s*title\s+(.+)$/.exec(line); if (!match) return false; const title = cleanLabel(match[1]!); this.fact('title', title); this.labels(title); return true }
  style(line: string) {
    const match = /^\s*(classDef|style|linkStyle|class)\s+(.+?)\s*;?\s*$/.exec(line)
    if (!match) return false
    if (match[1] === 'class' && !/^[\w.,-]+(?:,\s*[\w.-]+)*\s+[\w,-]+$/.test(match[2]!)) return false
    const styles = (this.expected.facts!['authored-style'] ?? []) as MeaningJson[]
    const classDirective = match[1] === 'class' ? /^(.+)\s+([\w,-]+)$/.exec(match[2]!) : null
    const [selected = '', ...rest] = match[2]!.split(/\s+/), selection = classDirective ? classDirective[1]!.replace(/\s/g, '') : selected, expression = classDirective ? classDirective[2]! : rest.join(' ')
    const attributes: MeaningJson[] = expression.split(/(?<!\\),/).filter(Boolean).map((value): MeaningJson => { const index = value.indexOf(':'); if (index < 0 && match[1] !== 'class') this.unresolved.push('Style declaration has no property/value separator: ' + value.trim()); return index < 0 ? { class: value.trim() } : { property: value.slice(0, index).trim(), value: value.slice(index + 1).trim() } })
    styles.push({ kind: match[1]!, selection, attributes }); this.fact('authored-style', styles); return true
  }
  finish(): SourceReviewedDrawing {
    const facts = this.expected.facts!
    if (typeof facts.title === 'string') this.labels(facts.title)
    const requiredObligations = requiredDocumentationObligations(this.expected)
    const unresolved = [...new Set(this.unresolved)]
    return {
      id: this.input.id, sourceSha256: hash(this.input.source), intent: 'drawing', family: this.family,
      review: 'Literal source expectations extracted independently of renderer outputs. Each handled construct has an explicit semantic interpretation; every remaining construct blocks a complete source contract. No reference-renderer result supplies an expected answer.',
      expected: this.expected,
      ...(unresolved.length ? { unverifiedFacts: unresolved } : {}),
      sourceReview: { protocol: docsSourceReviewProtocol, sourcePin: docsSourcePin, method: 'Independent literal syntax transcription with fail-closed unhandled-construct accounting; source-specific regression and mutation controls in tests/docs-source-review.test.ts', expectedFactsComplete: unresolved.length === 0 && requiredObligations.length > 0, requiredObligations, unresolved, excludedNonvisual: this.excludedNonvisual },
    }
  }
}

function numericCharts(r: LiteralReview) {
  const facts = r.expected.facts!
  if (r.family === 'pie') {
    const slices: MeaningJson[] = []
    const header = r.lines[0]!.trim(), inlineTitle = /^pie(?:\s+showData)?\s+title\s+(.+)$/.exec(header)
    if (inlineTitle) r.fact('title', cleanLabel(inlineTitle[1]!))
    r.fact('show-data', /^pie\s+showData\b/.test(header))
    for (const line of r.lines.slice(1)) {
      const slice = /^\s*"([^"]*)"\s*:\s*([-+]?\d+(?:\.\d+)?)\s*$/.exec(line)
      if (slice) { const label = cleanLabel('"' + slice[1]! + '"'); slices.push({ label, value: Number(slice[2]) }); r.labels(label) }
      else if (!r.title(line)) r.unknown(line)
    }
    r.fact('slices', slices); return true
  }
  if (r.family === 'packet') {
    const fields: MeaningJson[] = []; let previous = -1
    for (const line of r.lines.slice(1)) {
      if (r.title(line)) continue
      const match = /^\s*(?:(\d+)(?:\s*-\s*(\d+))?|\+(\d+))\s*:\s*"([^"]*)"\s*$/.exec(line)
      if (!match) { r.unknown(line); continue }
      const start = match[3] ? previous + 1 : Number(match[1]), end = match[3] ? start + Number(match[3]) - 1 : Number(match[2] ?? match[1]); previous = end
      const label = cleanLabel('"' + match[4]! + '"'); r.labels(label); fields.push({ label, start, end })
    }
    r.fact('fields', fields); return true
  }
  if (r.family === 'quadrant') {
    const points: MeaningJson[] = [], quadrants: MeaningJson[] = [], axes: FactMap = {}
    for (const line of r.lines.slice(1)) {
      if (r.title(line) || r.style(line)) continue
      let match = /^\s*([xy])-axis\s+(.+?)\s*-->\s*(.+?)\s*$/.exec(line)
      if (match) { const labels = [cleanLabel(match[2]!), cleanLabel(match[3]!)]; axes[match[1]!] = labels; r.labels(...labels); continue }
      match = /^\s*quadrant-([1-4])\s+(.+)$/.exec(line)
      if (match) { const label = cleanLabel(match[2]!); quadrants.push({ number: Number(match[1]), label }); r.labels(label); continue }
      match = /^\s*(.+?)(?::::([\w,-]+))?\s*:\s*\[\s*([-+\d.]+)\s*,\s*([-+\d.]+)\s*\]\s*(.*)$/.exec(line)
      if (match) { const label = cleanLabel(match[1]!); points.push({ label, x: Number(match[3]), y: Number(match[4]) }); r.labels(label); const properties: Record<string, string> = {}; for (const item of syntaxList(match[5]!)) { const property = /^([\w-]+)\s*:\s*(.+)$/.exec(item); if (!property) r.unknown(item); else properties[property[1]!] = property[2]! }; if (match[2] || Object.keys(properties).length) r.fact('point-appearance', [...(r.expected.facts!['point-appearance'] as MeaningJson[] ?? []), { label, classes: match[2] ?? '', properties }]); continue }
      r.unknown(line)
    }
    r.fact('points', points); r.fact('quadrants', quadrants); r.fact('axes', axes); return true
  }
  if (r.family === 'xychart') {
    const series: MeaningJson[] = [], annotations: MeaningJson[] = []
    r.fact('orientation', /\bhorizontal\b/.test(r.lines[0]!) ? 'horizontal' : 'vertical')
    for (const line of r.lines.slice(1)) {
      if (r.title(line)) continue
      let match = /^\s*([xy])-axis\s+(?:("[^"]*")\s*)?(.*)$/.exec(line)
      if (match) {
        if (match[2]) { const label = cleanLabel(match[2]); r.fact(match[1]! + '-axis-label', label); r.labels(label) }
        const rest = match[3]!.trim()
        if (/^\[.*\]$/.test(rest)) { const categories = csv(rest.slice(1, -1)).map(cleanLabel); r.fact(match[1]! + '-categories', categories); r.labels(...categories) }
        else if (/^[-+\d.]+\s*-->\s*[-+\d.]+$/.test(rest)) r.fact(match[1]! + '-range', rest.split(/\s*-->\s*/).map(Number))
        else r.unknown(line)
        continue
      }
      match = /^\s*(bar|line)\s*(?:"([^"]*)"\s*)?\[(.*)\]\s*$/.exec(line)
      if (match) {
        const values: number[] = [], labels: (string | null)[] = []
        for (const token of syntaxList(match[3]!)) { const item = /^([-+\d.]+)(?:\s+"([^"]*)")?$/.exec(token); if (!item) { r.unknown(line); break }; values.push(Number(item[1])); labels.push(item[2] ?? null); if (item[2]) r.labels(item[2]) }
        const entry: any = { kind: match[1]!, values }; if (match[2]) { entry.label = match[2]; r.labels(match[2]) }; series.push(entry)
        if (labels.some(Boolean)) annotations.push({ series: series.length - 1, labels })
        continue
      }
      r.unknown(line)
    }
    r.fact('series', series); if (annotations.length) r.fact('series-annotations', annotations)
    const settings = (r.expected.facts!['authored-config'] as any)?.xyChart ?? {}
    if (settings.showDataLabel === true) {
      const categories = r.expected.facts!['x-categories'] as string[] | undefined
      r.fact('displayed-bar-values', series.flatMap((entry: any, series) => entry.kind !== 'bar' ? [] : entry.values.map((value: number, index: number) => ({ series, index, ...(categories?.[index] !== undefined ? { category: categories[index]! } : {}), value, placement: settings.showDataLabelOutsideBar === true ? 'outside' : 'inside' }))))
    }
    return true
  }
  if (r.family === 'radar') {
    const axes: MeaningJson[] = [], curves: MeaningJson[] = []; let min = 0, max: number | undefined
    for (const line of r.lines.slice(1)) {
      if (r.title(line)) continue
      let match = /^\s*axis\s+(.+)$/.exec(line)
      if (match) { for (const token of syntaxList(match[1]!)) { const axis = /^([^\[\s]+)(?:\["([^"]*)"\])?$/.exec(token); if (!axis) { r.unknown(line); continue }; const label = axis[2] ?? axis[1]!; axes.push({ id: axis[1]!, label }); r.labels(label) }; continue }
      match = /^\s*curve\s+([^\[\s{]+)(?:\["([^"]*)"\])?\s*\{([\d.,+\s-]+)\}\s*$/.exec(line)
      if (match) { const label = match[2] ?? match[1]!; curves.push({ id: match[1]!, label, values: match[3]!.split(',').map(Number) }); r.labels(label); continue }
      match = /^\s*(min|max)\s+([-+\d.]+)\s*$/.exec(line)
      if (match) { if (match[1] === 'min') min = Number(match[2]); else max = Number(match[2]); continue }
      match = /^\s*showLegend\s+(true|false)\s*$/.exec(line)
      if (match) { r.fact('show-legend', match[1] === 'true'); continue }
      match = /^\s*(graticule|ticks)\s+(.+)$/.exec(line)
      if (match) { r.fact(match[1]!, cleanLabel(match[2]!)); continue }
      r.unknown(line)
    }
    r.fact('axes', axes); r.fact('curves', curves); if (max !== undefined) r.fact('range', [min, max]); else r.fact('range', [min, Math.max(...curves.flatMap((curve: any) => curve.values))])
    return true
  }
  if (r.family === 'sankey') {
    const links: MeaningJson[] = [], names = new Set<string>()
    for (const line of r.lines.slice(1)) {
      if (r.title(line)) continue
      try { const row = csv(line); if (row.length !== 3 || !Number.isFinite(Number(row[2]))) { r.unknown(line); continue }; names.add(row[0]!); names.add(row[1]!); links.push({ source: row[0]!, target: row[1]!, value: Number(row[2]) }) } catch { r.unknown(line) }
    }
    r.expected.nodes = [...names].map(id => ({ id, label: id })); r.labels(...names); r.fact('links', links); return true
  }
  return false
}

function orderedCharts(r: LiteralReview) {
  if (r.family === 'timeline') {
    const periods: MeaningJson[] = [], sections: string[] = []; let section = '', current: { section: string; period: string; events: string[] } | undefined
    for (const line of r.lines.slice(1)) {
      if (r.title(line)) continue
      const group = /^\s*section\s+(.+)$/.exec(line)
      if (group) { section = cleanLabel(group[1]!); sections.push(section); r.labels(section); continue }
      const match = /^\s*([^:]*?)\s*:\s*(.+)$/.exec(line)
      if (!match) { r.unknown(line); continue }
      const events = match[2]!.split(/\s+:\s+/).map(cleanLabel)
      if (match[1]!.trim()) { current = { section, period: cleanLabel(match[1]!), events }; periods.push(current); r.labels(current.period) }
      else if (current) current.events.push(...events)
      else r.unresolved.push('Timeline continuation has no preceding period')
      r.labels(...events)
    }
    r.fact('periods', periods); r.fact('sections', sections); return true
  }
  if (r.family === 'journey') {
    const tasks: MeaningJson[] = [], sections: string[] = []; let section = ''
    for (const line of r.lines.slice(1)) {
      if (r.title(line)) continue
      const group = /^\s*section\s+(.+)$/.exec(line)
      if (group) { section = cleanLabel(group[1]!); sections.push(section); r.labels(section); continue }
      const match = /^\s*([^:]+)\s*:\s*([-+\d.]+)\s*:\s*(.+)$/.exec(line)
      if (!match) { r.unknown(line); continue }
      const label = cleanLabel(match[1]!), actors = csv(match[3]!).map(cleanLabel); tasks.push({ label, score: Number(match[2]), actors, section }); r.labels(label, ...actors)
    }
    r.fact('tasks', tasks); r.fact('sections', sections); return true
  }
  if (r.family === 'treemap') {
    const nodes: { id: string; label: string }[] = [], hierarchy: MeaningJson[] = [], values: MeaningJson[] = [], stack: { indent: number; id: string }[] = []
    for (const line of r.lines.slice(1)) {
      if (r.title(line) || r.style(line)) continue
      const match = /^(\s*)"([^"]*)"(?:\s*:\s*([-+\d.]+))?\s*(?::::([\w-]+))?\s*$/.exec(line)
      if (!match) { r.unknown(line); continue }
      const indent = match[1]!.length, label = cleanLabel('"' + match[2]! + '"'); while (stack.length && stack.at(-1)!.indent >= indent) stack.pop()
      const parent = stack.at(-1)?.id ?? '', id = parent ? parent + '/' + label : label; nodes.push({ id, label }); hierarchy.push({ id, parent, ...(match[4] ? { class: match[4] } : {}) }); r.labels(label)
      if (match[3] !== undefined) values.push({ id, value: Number(match[3]) })
      stack.push({ indent, id })
    }
    r.expected.nodes = nodes; r.fact('hierarchy', hierarchy); r.fact('values', values); return true
  }
  if (r.family === 'ishikawa') {
    const hierarchy: MeaningJson[] = [], stack: { indent: number; path: string }[] = []
    for (const [index, line] of r.lines.slice(1).entries()) {
      const label = cleanLabel(line.trim()), indent = /^\s*/.exec(line)![0].length
      if (index === 0) { r.fact('effect', { id: label, label }); hierarchy.push({ id: label, label, parent: '', kind: 'effect' }); r.labels(label); stack.push({ indent: -1, path: label }); continue }
      while (stack.length > 1 && stack.at(-1)!.indent >= indent) stack.pop()
      const parent = stack.at(-1)?.path ?? '', path = parent ? parent + '/' + label : label; hierarchy.push({ id: path, label, parent, kind: 'cause' }); r.labels(label); stack.push({ indent, path })
    }
    if (!stack.length) r.unresolved.push('Ishikawa source has no effect/problem')
    r.fact('cause-hierarchy', hierarchy); return true
  }
  if (r.family === 'cynefin') {
    const entries: MeaningJson[] = [], transitions: MeaningJson[] = []; let domain = ''
    for (const line of r.lines.slice(1)) {
      if (r.title(line) || r.style(line)) continue
      if (/^\s*(complex|complicated|clear|chaotic|confusion)\s*$/.test(line)) { domain = line.trim(); continue }
      const label = /^\s*"([^"]*)"\s*$/.exec(line)
      if (label && domain) { const text = cleanLabel('"' + label[1]! + '"'); entries.push({ domain, label: text }); r.labels(text); continue }
      const edge = /^\s*(complex|complicated|clear|chaotic|confusion)\s*-->\s*(complex|complicated|clear|chaotic|confusion)\s*:\s*(.+)$/.exec(line)
      if (edge) { const caption = cleanLabel(edge[3]!); transitions.push({ source: edge[1]!, target: edge[2]!, label: caption }); r.labels(caption); continue }
      r.unknown(line)
    }
    r.fact('framework-domains', [{ id: 'complex', position: 'top-left' }, { id: 'complicated', position: 'top-right' }, { id: 'clear', position: 'bottom-right' }, { id: 'chaotic', position: 'bottom-left' }, { id: 'confusion', position: 'center', shape: 'ellipse' }])
    r.fact('framework-boundaries', [{ kind: 'wavy', unordered: ['complex', 'chaotic'], ordered: ['complicated', 'clear'] }, { kind: 'cliff', domains: ['clear', 'chaotic'] }])
    r.fact('domain-entries', entries); r.fact('domain-transitions', transitions); return true
  }
  if (r.family === 'venn') {
    const sets: MeaningJson[] = [], unions: MeaningJson[] = [], textNodes: MeaningJson[] = []; let owner: MeaningJson = null
    for (const line of r.lines.slice(1)) {
      if (r.title(line) || r.style(line)) continue
      const match = /^\s*(set|union|text)\s+([^\[:]+?)(?:\["([^"]*)"\])?(?:\s*:\s*([-+\d.]+))?\s*$/.exec(line)
      if (!match) { r.unknown(line); continue }
      const ids = match[2]!.trim().split(/\s*,\s*/), label = match[3] !== undefined ? cleanLabel('"' + match[3] + '"') : ids.join(','); r.labels(label)
      if (match[1] === 'text') { if (!owner || ids.length !== 1) { r.unknown(line); continue }; textNodes.push({ id: ids[0]!, label, owner }); continue }
      const size: Record<string, MeaningJson> = match[4] === undefined ? {} : { size: Number(match[4]) }
      if (match[1] === 'set' && ids.length === 1) { sets.push({ id: ids[0]!, label, ...size }); owner = { kind: 'set', id: ids[0]! } }
      else if (match[1] === 'union' && ids.length >= 2) { unions.push({ members: ids, label, ...size }); owner = { kind: 'intersection', members: ids } }
      else r.unknown(line)
    }
    r.fact('sets', sets); r.fact('intersections', unions); if (textNodes.length) r.fact('region-texts', textNodes); return true
  }
  return false
}

/** Split outside node labels, attribute objects and quoted/markdown strings.
 * Returning an unclosed construct is a review blocker, never a guessed repair. */
function statements(source: string) {
  const result: string[] = [], stack: string[] = []; let text = '', quote = '', escaped = false
  for (let index = 0; index < source.length; index++) {
    const char = source[index]!
    if (quote) {
      text += char
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
      continue
    }
    if ((char === '"' || char === '`') && !escaped) { quote = char; text += char; continue }
    if ('[({'.includes(char)) stack.push(char)
    if ('])}'.includes(char)) { const opening = stack.at(-1); if (opening && '])}'.indexOf(char) === '[({'.indexOf(opening)) stack.pop() }
    if ((char === '\n' || char === ';') && !stack.length) { if (text.trim()) result.push(text.trim()); text = '' } else text += char
  }
  if (text.trim()) result.push(text.trim())
  return { values: result, unclosed: stack.length > 0 || !!quote }
}

function flowchart(r: LiteralReview) {
  if (r.family !== 'flowchart') return false
  const parsed = statements(r.body), nodes = new Map<string, { id: string; label: string }>(), shapes = new Map<string, string>(), attributes = new Map<string, MeaningJson>(), groups: { id: string; label: string; members: string[] }[] = [], stack: typeof groups = [], edges: NonNullable<MeaningExpectation['edges']> = [], layouts: MeaningJson[] = [], edgeAppearance: MeaningJson[] = []
  const groupById = new Map<string, (typeof groups)[number]>(), rankRequests: MeaningJson[] = []
  const markdown = (r.expected.facts!['markdown-source-labels'] ?? []) as { source: string; text: string; owners?: MeaningJson[] }[], reservedMarkdown = new Set(markdown.flatMap((item, index) => item.owners?.length ? [index] : []))
  const reserveMarkdown = (raw: string) => {
    const match = /^["']?`([\s\S]*?)`["']?$/.exec(raw.trim()); if (!match) return undefined
    const index = markdown.findIndex((item, index) => !reservedMarkdown.has(index) && item.source === match[1])
    if (index < 0) { r.unresolved.push('Markdown label lacks its literal source occurrence: ' + raw); return undefined }
    reservedMarkdown.add(index); return index
  }
  const ownMarkdown = (index: number | undefined, owner: MeaningJson) => { if (index !== undefined) (markdown[index]!.owners ??= []).push(owner) }
  if (parsed.unclosed) r.unresolved.push('Unclosed flowchart label, quote or attribute syntax')
  const addNode = (id: string, label?: string) => {
    if (!nodes.has(id)) nodes.set(id, { id, label: label ?? id }); else if (label !== undefined) nodes.get(id)!.label = label
    if (stack.length && stack.at(-1)!.id !== id && !stack.at(-1)!.members.includes(id)) stack.at(-1)!.members.push(id)
  }
  const nodeAt = (source: string, offset: number): { id: string; end: number } | undefined => {
    let at = offset; while (/\s/.test(source[at] ?? '') && at < source.length) at++
    const idMatch = /^[\p{L}\p{N}_][\p{L}\p{N}_:.\/-]*/u.exec(source.slice(at))
    if (!idMatch) return
    // A, B and an edge identifier are separate tokens; never consume the arrow.
    const boundary = idMatch[0].search(/:::|--|-\./), id = (boundary < 0 ? idMatch[0] : idMatch[0].slice(0, boundary)).replace(/[-.]+$/, ''); if (!id) return
    at += id.length; let label: string | undefined, shape: string | undefined, markdownIndex: number | undefined
    const forms: [string, string, string][] = [['(((', ')))', 'double-circle'], ['([', '])', 'stadium'], ['[[', ']]', 'subroutine'], ['[(', ')]', 'cylinder'], ['((', '))', 'circle'], ['{{', '}}', 'hexagon'], ['[', ']', 'rectangle'], ['(', ')', 'rounded'], ['{', '}', 'diamond'], ['>', ']', 'asymmetric']]
    const form = forms.find(([opening]) => source.startsWith(opening, at))
    if (form) {
      const begin = at + form[0].length; let end = -1, quote = '', escaped = false
      for (let i = begin; i < source.length; i++) {
        const char = source[i]!
        if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = ''; continue }
        if (char === '"' || char === '`') { quote = char; continue }
        if (source.startsWith(form[1], i)) { end = i; break }
      }
      if (end < 0) return
      let content = source.slice(begin, end); shape = form[2]
      if (form[0] === '[' && /^[\/\\]/.test(content) && /[\/\\]$/.test(content)) {
        const first = content[0], last = content.at(-1); shape = first === '/' ? last === '/' ? 'parallelogram' : 'trapezoid' : last === '\\' ? 'parallelogram-alt' : 'trapezoid-alt'; content = content.slice(1, -1)
      }
      markdownIndex = reserveMarkdown(content); label = cleanLabel(content); const embeddedIcons = [...label.matchAll(/\b(?:fa|fab|fas|far|fal|fad|fak):fa-[\w-]+/g)].map(match => ({ reference: match[0], textOffset: match.index! })); if (embeddedIcons.length) { r.fact('embedded-icons', [...(r.expected.facts!['embedded-icons'] as MeaningJson[] ?? []), { id, icons: embeddedIcons }]); label = label.replace(/\b(?:fa|fab|fas|far|fal|fad|fak):fa-[\w-]+/g, '').replace(/\s+/g, ' ').trim() }; at = end + form[1].length
    }
    while (/\s/.test(source[at] ?? '') && at < source.length) at++
    if (source.startsWith('@{', at)) {
      let end = at + 2, quote = '', depth = 1
      for (; end < source.length; end++) { const char = source[end]!; if (quote) { if (char === quote && source[end - 1] !== '\\') quote = ''; continue }; if (char === '"' || char === "'") quote = char; else if (char === '{') depth++; else if (char === '}' && --depth === 0) break }
      if (depth !== 0) return
      try {
        const attr = parseYaml(source.slice(at + 1, end + 1)) as Record<string, MeaningJson>
        if (!attr || typeof attr !== 'object' || Array.isArray(attr)) return
        if (typeof attr.label === 'string') { markdownIndex = reserveMarkdown(attr.label); label = cleanLabel(attr.label) }
        if (typeof attr.shape === 'string') shape = attr.shape
        attributes.set(id, { ...(attributes.get(id) as any ?? {}), ...attr }); at = end + 1
      } catch { return }
    }
    if (source.startsWith(':::', at)) { const classes = /^:::([\w,-]+)/.exec(source.slice(at)); if (!classes) return; const edgeBoundary = classes[1]!.search(/--|-\./), value = edgeBoundary < 0 ? classes[1]! : classes[1]!.slice(0, edgeBoundary); if (!value) return; attributes.set(id, { ...(attributes.get(id) as any ?? {}), classes: value }); at += 3 + value.length }
    addNode(id, label); ownMarkdown(markdownIndex, { kind: 'node', id }); if (shape) shapes.set(id, shape)
    return { id, end: at }
  }
  const edgeAt = (source: string, offset: number) => {
    const tail = source.slice(offset); const match = /^\s*(?:(\w+)@)?((?:<)?[ox]?(?:-{2,}|={2,}|-\.+-?|~{3,})(?:[>ox])?)\s*(?:\|([^|]*)\|\s*)?/.exec(tail)
    if (!match) return
    let token = match[2]!, lengthToken = token, labelSource = match[3], label = labelSource === undefined ? undefined : cleanLabel(labelSource), end = offset + match[0].length
    // Captions can be delimited by the two halves of a long arrow.
    if (!/[>ox]$/.test(token) && !/^~~~/.test(token)) {
      const split = /^(.+?)\s+(-{2,}|={2,}|\.->)([>ox])?\s+/.exec(source.slice(end))
      if (split && !/^[\w]+\s*(?:\[|\(|@\{|&|$)/.test(split[1]!)) { labelSource = split[1]!; label = cleanLabel(labelSource); lengthToken = split[2]! + (split[3] ?? ''); token += lengthToken; end += split[0].length }
      else {
        const caption = /^(.+?)\s+(-{2,}>?|-{3,}|==>|\.->|--x|--o)\s*/.exec(source.slice(end))
        if (caption) { labelSource = caption[1]!; label = cleanLabel(labelSource); lengthToken = caption[2]!; token += lengthToken; end += caption[0].length }
      }
    }
    const marker = (char?: string) => char === 'o' ? 'circle' : char === 'x' ? 'cross' : char === '<' || char === '>' ? 'arrow' : 'none'
    const markdownIndex = labelSource === undefined ? undefined : reserveMarkdown(labelSource), marked = /^[<ox]|[>ox]$/.test(lengthToken), minimumRanks = lengthToken.includes('.') ? (lengthToken.match(/\./g)?.length ?? 0) : (lengthToken.match(lengthToken.includes('=') ? /=/g : /-/g)?.length ?? 0) - (marked ? 1 : 2)
    return { end, token, lengthToken, minimumRanks, markdownIndex, label, id: match[1], startMarker: marker(token[0]), endMarker: marker(token.at(-1)) }
  }
  for (const statement of parsed.values) {
    if (/^\s*%%/.test(statement)) continue
    const header = /^(?:graph|flowchart)\s+(LR|RL|TD|TB|BT)(?:\s+([\s\S]*))?$/.exec(statement)
    if (header) { r.fact('direction', header[1]!); if (!header[2]) continue }
    let line = header?.[2] ?? statement
    if (/^(?:accTitle|accDescr)\s*[:{]/.test(line)) { r.excludedNonvisual.push('Accessibility metadata retained in literal input, outside visible drawing content: ' + line); continue }
    if (/^click\s/.test(line)) { r.excludedNonvisual.push('Click/navigation behavior is outside a static SVG/PNG drawing task: ' + line); continue }
    if (r.style(line)) continue
    const direction = /^direction\s+(LR|RL|TD|TB|BT)$/.exec(line)
    if (direction) { layouts.push({ group: stack.at(-1)?.id ?? null, direction: direction[1]! }); continue }
    if (line === 'end') { if (!stack.pop()) r.unknown(line); continue }
    const subgraph = /^subgraph\s+([\s\S]+)$/.exec(line)
    if (subgraph) {
      const text = subgraph[1]!.trim(), match = /^([\w.-]+)\s*\[(.*)\]$/.exec(text), id = match?.[1] ?? cleanLabel(text), label = cleanLabel(match?.[2] ?? text)
      if (groupById.has(id)) { r.unresolved.push('Duplicate subgraph declaration needs explicit source review: ' + id); continue }
      const group = { id, label, members: [] as string[] }; ownMarkdown(reserveMarkdown(match?.[2] ?? text), { kind: 'group', id }); groups.push(group); groupById.set(id, group); if (stack.length) stack.at(-1)!.members.push(id); stack.push(group); continue
    }
    let cursor = 0, first = nodeAt(line, cursor)
    if (!first) { r.unknown(line); continue }
    cursor = first.end; let left = [first.id], valid = true
    while (cursor < line.length) {
      while (/\s/.test(line[cursor] ?? '') && cursor < line.length) cursor++
      if (cursor >= line.length) break
      if (line[cursor] === '&') { const next = nodeAt(line, cursor + 1); if (!next) { valid = false; break }; left.push(next.id); cursor = next.end; continue }
      const relation = edgeAt(line, cursor)
      if (!relation) { valid = false; break }
      const target = nodeAt(line, relation.end); if (!target) { valid = false; break }
      cursor = target.end; const right = [target.id]
      while (/^\s*&/.test(line.slice(cursor))) { const next = nodeAt(line, cursor + line.slice(cursor).indexOf('&') + 1); if (!next) { valid = false; break }; right.push(next.id); cursor = next.end }
      for (const source of left) for (const target of right) {
        if (/^~~~/.test(relation.token)) layouts.push({ source, target, relation: 'invisible' })
        else {
          ownMarkdown(relation.markdownIndex, { kind: 'edge', index: edges.length, source, target });
          if (relation.minimumRanks > 1) rankRequests.push({ index: edges.length, source, target, minimumRanks: relation.minimumRanks, controllingDelimiter: relation.lengthToken });
          edges.push({ source, target, directed: relation.startMarker === 'arrow' || relation.endMarker === 'arrow', ...(relation.label !== undefined ? { label: relation.label } : {}), startMarker: relation.startMarker, endMarker: relation.endMarker })
          if (/=|\./.test(relation.token) || relation.id || /x|o/.test(relation.token)) edgeAppearance.push({ source, target, ...(relation.id ? { id: relation.id } : {}), stroke: relation.token.includes('=') ? 'thick' : relation.token.includes('.') ? 'dotted' : 'solid', markerStart: relation.startMarker, markerEnd: relation.endMarker })
        }
      }
      left = right
    }
    if (!valid) r.unknown(line.slice(cursor))
  }
  if (stack.length) r.unresolved.push('Unclosed subgraph declaration')
  const edgeIds = new Set(edgeAppearance.map((edge: any) => edge.id).filter(Boolean))
  const edgeAttributes: MeaningJson[] = []
  for (const id of edgeIds) if (attributes.has(id)) { if (shapes.has(id)) r.unresolved.push('Identifier is both an edge and explicitly shaped node: ' + id); else nodes.delete(id); edgeAttributes.push({ id, attributes: attributes.get(id)! }); attributes.delete(id) }
  if (edgeAttributes.length) r.fact('edge-attributes', edgeAttributes)
  // A group is not an extra visible node unless the source collapses it.
  for (const group of groups) nodes.delete(group.id)
  const collapsed = groups.filter(group => (attributes.get(group.id) as any)?.view === 'collapsed')
  for (const group of collapsed) {
    const hidden = new Set<string>(), visit = (id: string) => { hidden.add(id); groupById.get(id)?.members.forEach(visit) }; group.members.forEach(visit)
    r.expected.forbiddenLabels ??= []; for (const id of hidden) { const node = nodes.get(id); if (node) r.expected.forbiddenLabels.push(node.label); nodes.delete(id) }
    nodes.set(group.id, { id: group.id, label: group.label })
    for (let index = edges.length - 1; index >= 0; index--) { const edge = edges[index]!; if (hidden.has(edge.source) && hidden.has(edge.target)) edges.splice(index, 1); else { if (hidden.has(edge.source)) edge.source = group.id; if (hidden.has(edge.target)) edge.target = group.id } }
  }
  r.expected.nodes = [...nodes.values()]; r.expected.edges = edges
  if (groups.length) r.expected.groups = groups.filter(group => !collapsed.includes(group) && !collapsed.some(parent => parent.members.includes(group.id)))
  r.labels(...r.expected.nodes.map(node => node.label), ...r.expected.edges.map(edge => edge.label ?? ''), ...(r.expected.groups ?? []).map(group => group.label))
  if (shapes.size) r.fact('node-shapes', [...shapes].filter(([id]) => nodes.has(id)).map(([id, shape]) => ({ id, shape })))
  if (attributes.size) r.fact('node-attributes', [...attributes].map(([id, value]) => ({ id, attributes: value })))
  const directionRequests = layouts.filter((item: any) => item.direction !== undefined), remainingLayouts = layouts.filter((item: any) => item.direction === undefined)
  if (remainingLayouts.length) r.fact('layout-constraints', remainingLayouts)
  if (directionRequests.length) (r.expected.advisoryFacts ??= {})['subgraph-direction-requests'] = directionRequests
  if (rankRequests.length) (r.expected.advisoryFacts ??= {})['edge-length-requests'] = rankRequests
  for (const item of markdown) if (!item.owners?.length) r.unresolved.push('Markdown source label has no proven node, edge or group owner: ' + item.source)
  if (edgeAppearance.length) r.fact('edge-appearance', edgeAppearance)
  return true
}

function stateDiagram(r: LiteralReview) {
  if (r.family !== 'state') return false
  const nodes = new Map<string, { id: string; label: string }>(), groups: NonNullable<MeaningExpectation['groups']> = [], edges: NonNullable<MeaningExpectation['edges']> = [], stack: string[] = [], pseudostates: MeaningJson[] = [], kinds: MeaningJson[] = [], notes: MeaningJson[] = [], regions: MeaningJson[] = [], directions: MeaningJson[] = []
  const regionNumbers = new Map<string, number>(), regionMembers = new Map<string, Map<number, string[]>>()
  const add = (id: string, label?: string) => {
    if (!nodes.has(id)) nodes.set(id, { id, label: label ?? id }); else if (label !== undefined) nodes.get(id)!.label = label
    const scope = stack.at(-1) ?? 'root', group = groups.find(group => group.id === scope)
    if (group && !group.members.includes(id)) group.members.push(id)
    const number = regionNumbers.get(scope) ?? 0, own = regionMembers.get(scope) ?? new Map<number, string[]>(), members = own.get(number) ?? []
    if (!members.includes(id)) members.push(id)
    own.set(number, members); regionMembers.set(scope, own)
  }
  const endpoint = (text: string, side: 'start' | 'end') => {
    if (text !== '[*]') { add(text); return text }
    const scope = stack.at(-1) ?? 'root', region = regionNumbers.get(scope) ?? 0, id = `[${side}:${scope}${region ? ':region-' + region : ''}]`; add(id, ''); if (!pseudostates.some((item: any) => item.id === id)) pseudostates.push({ id, kind: side, scope }); return id
  }
  const lines = r.lines.slice(1)
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!.trim().replace(/\s+%%.*$/, '')
    if (r.title(line) || r.style(line)) continue
    if (/^acc(?:Title|Descr)\s*:/.test(line)) { r.excludedNonvisual.push('Accessibility metadata outside visible drawing content: ' + line); continue }
    let match = /^direction\s+(LR|RL|TB|TD|BT)$/.exec(line)
    if (match) { if (!stack.length) r.fact('direction', match[1]!); else directions.push({ group: stack.at(-1)!, direction: match[1]! }); continue }
    if (line === '}') { if (!stack.pop()) r.unknown(line); continue }
    if (line === '--') { const scope = stack.at(-1) ?? 'root'; regionNumbers.set(scope, (regionNumbers.get(scope) ?? 0) + 1); continue }
    match = /^state\s+(?:"([^"]*)"\s+as\s+)?([\w.-]+)(?:\s+<<(\w+)>>)?\s*(\{)?$/.exec(line)
    if (match) {
      const id = match[2]!, special = ['choice', 'fork', 'join'].includes(match[3] ?? ''), label = match[1] !== undefined ? cleanLabel('"' + match[1] + '"') : special ? '' : nodes.get(id)?.label ?? id; add(id, label)
      if (special && match[1] !== undefined) r.unresolved.push('Explicit special pseudostate caption requires review: ' + line)
      if (match[3]) kinds.push({ id, kind: match[3] })
      if (match[4]) { groups.push({ id, label, members: [] }); stack.push(id) }
      continue
    }
    match = /^note\s+(left|right)\s+of\s+([\w.-]+)(?:\s*:\s*(.*))?$/.exec(line)
    if (match) {
      let text = match[3]
      if (text === undefined) { const body: string[] = []; let ended = false; while (++index < lines.length) { if (/^\s*end note\s*$/.test(lines[index]!)) { ended = true; break }; body.push(lines[index]!.trim()) }; if (!ended) r.unresolved.push('Unterminated state note'); text = body.join('\n') }
      const label = cleanLabel(text); notes.push({ id: match[2]!, side: match[1]!, text: label }); r.labels(label); continue
    }
    match = /^(\[\*\]|[\w.-]+)(?:\s*:::[\w-]+)?\s*-->\s*(\[\*\]|[\w.-]+)(?:\s*:::[\w-]+)?(?:\s*:\s*(.*))?$/.exec(line)
    if (match) { const source = endpoint(match[1]!, 'start'), target = endpoint(match[2]!, 'end'), label = match[3] !== undefined ? cleanLabel(match[3]) : undefined; edges.push({ source, target, directed: true, ...(label !== undefined ? { label } : {}) }); if (label) r.labels(label); const classes = [...line.matchAll(/([\w.-]+):::([\w-]+)/g)].map(item => ({ id: item[1]!, class: item[2]! })); if (classes.length) r.fact('state-classes', [...(r.expected.facts!['state-classes'] as MeaningJson[] ?? []), ...classes]); continue }
    match = /^([\w.-]+)\s*:(?!:)\s*(.+)$/.exec(line)
    if (match) { add(match[1]!, cleanLabel(match[2]!)); continue }
    if (/^[\w.-]+$/.test(line)) { add(line); continue }
    r.unknown(line)
  }
  if (stack.length) r.unresolved.push('Unclosed composite state')
  for (const [scope, last] of regionNumbers) if (last > 0) for (let region = 0; region <= last; region++) regions.push({ scope, region, members: regionMembers.get(scope)?.get(region) ?? [] })
  for (const group of groups) group.label = nodes.get(group.id)?.label ?? group.label
  r.expected.nodes = [...nodes.values()]; r.expected.edges = edges; if (groups.length) r.expected.groups = groups
  for (const node of r.expected.nodes) if (!kinds.some((item: any) => item.id === node.id)) { const pseudo = pseudostates.find((item: any) => item.id === node.id) as any; kinds.push({ id: node.id, kind: pseudo ? 'pseudostate-' + pseudo.kind : groups.some(group => group.id === node.id) ? 'composite-state' : 'state' }) }
  r.labels(...r.expected.nodes.map(node => node.label)); if (pseudostates.length) r.fact('pseudostates', pseudostates); if (kinds.length) r.fact('state-kinds', kinds); if (notes.length) r.fact('notes', notes); if (regions.length) r.fact('parallel-regions', regions); if (directions.length) r.fact('group-directions', directions)
  return true
}

function architecture(r: LiteralReview) {
  if (r.family !== 'architecture') return false
  const nodes: NonNullable<MeaningExpectation['nodes']> = [], groups: NonNullable<MeaningExpectation['groups']> = [], edges: NonNullable<MeaningExpectation['edges']> = [], icons: MeaningJson[] = [], ports: MeaningJson[] = [], alignments: MeaningJson[] = [], junctions: string[] = []
  for (const line of r.lines.slice(1)) {
    if (r.title(line)) continue
    let match = /^\s*(group|service)\s+([\w.-]+)\(([^)]+)\)\[([^\]]*)\](?:\s+in\s+([\w.-]+))?\s*$/.exec(line)
    if (match) { const id = match[2]!, label = cleanLabel(match[4]!); r.labels(label); icons.push({ id, icon: match[3]! }); if (match[1] === 'group') groups.push({ id, label, members: [] }); else nodes.push({ id, label }); if (match[5]) { const group = groups.find(item => item.id === match![5]); if (!group) r.unresolved.push('Service/group references an undeclared containing group: ' + match[5]); else group.members.push(id) }; continue }
    match = /^\s*junction\s+([\w.-]+)(?:\s+in\s+([\w.-]+))?\s*$/.exec(line)
    if (match) { nodes.push({ id: match[1]!, label: '' }); junctions.push(match[1]!); if (match[2]) groups.find(item => item.id === match![2])?.members.push(match[1]!); continue }
    match = /^\s*([\w.-]+)(?:\{group\})?:([LRTB])\s*(<)?--(>)?\s*([LRTB]):([\w.-]+)(?:\{group\})?\s*$/.exec(line)
    if (match) { edges.push({ source: match[1]!, target: match[6]!, directed: !!(match[3] || match[4]), startMarker: match[3] ? 'arrow' : 'none', endMarker: match[4] ? 'arrow' : 'none' }); ports.push({ from: match[1]!, to: match[6]!, fromSide: match[2]!, toSide: match[5]! }); continue }
    match = /^\s*align\s+(row|column)\s+(.+)\s*$/.exec(line)
    if (match) { alignments.push({ axis: match[1]!, ids: match[2]!.trim().split(/\s+/) }); continue }
    r.unknown(line)
  }
  r.expected.nodes = nodes; r.expected.groups = groups; r.expected.edges = edges; r.fact('icons', icons); r.fact('ports', ports); if (junctions.length) r.fact('junctions', junctions); if (alignments.length) r.fact('alignments', alignments)
  return true
}

/** Bind the exact authored occurrence before a dialect removes its statement.
 * Equal text elsewhere is not a substitute for this owner's formatting. */
function ownLiteralMarkdown(r: LiteralReview, statement: string, owner: MeaningJson, from = 0) {
  const offset = r.body.indexOf(statement, from), rows = r.expected.facts!['markdown-source-labels'] as any[] | undefined
  if (offset < 0) { r.unresolved.push('Markdown owner source occurrence is unresolved: ' + statement); return from }
  const matches = [...r.body.matchAll(/"`([\s\S]*?)`"/g)]
  for (const [index, match] of matches.entries()) if (match.index! >= offset && match.index! < offset + statement.length && rows?.[index]) rows[index].owners = [...(rows[index].owners ?? []), owner]
  return offset + statement.length
}

function hierarchy(r: LiteralReview) {
  if (!['treeview', 'mindmap'].includes(r.family)) return false
  const nodes: NonNullable<MeaningExpectation['nodes']> = [], edges: NonNullable<MeaningExpectation['edges']> = [], hierarchy: MeaningJson[] = [], stack: { indent: number; id: string }[] = [], decorations: MeaningJson[] = []
  const compound = statements(r.body), lines = r.family === 'mindmap' ? compound.values.slice(1) : r.lines.slice(1)
  // statements() deliberately trims; recover original indentation for mindmap's grammar.
  const original = r.body.split(/\r?\n/).slice(1); let originalCursor = 0, markdownCursor = 0
  if (r.family === 'mindmap' && compound.unclosed && !r.lines.slice(1).every(line => /^\s*[\w.-]+\)\)?[\s\S]*?\(\(?\s*$/.test(line))) r.unresolved.push('Unclosed mindmap label')
  for (const text of lines) {
    let line = text
    if (r.family === 'mindmap') { while (originalCursor < original.length && !original[originalCursor]!.trim()) originalCursor++; const at = original[originalCursor]?.search(/\S/) ?? 0; line = ' '.repeat(Math.max(0, at)) + text; originalCursor += text.split('\n').length }
    if (/^\s*::(?:icon|:)/.test(line)) { if (!nodes.length) { r.unknown(line); continue }; decorations.push({ id: nodes.at(-1)!.id, decoration: line.trim() }); continue }
    const box = /^(.*?)[├└]──\s*(.*)$/.exec(line)
    const indent = box ? box[1]!.length + 1 : /^\s*/.exec(line)![0].length
    let label = box ? box[2]! : line.trim(), annotation = '', icon = '', classes = ''
    const note = /\s+##\s*(.*)$/.exec(label); if (note) { annotation = note[1]!; label = label.slice(0, note.index) }
    const symbol = /\s+icon\(([^)]+)\)/.exec(label); if (symbol) { icon = symbol[1]!; label = label.replace(symbol[0], '') }
    const klass = /\s*:::\s*(.+)$/.exec(label); if (klass) { classes = klass[1]!; label = label.slice(0, klass.index) }
    let explicit: string | undefined, shape: string | undefined
    if (r.family === 'mindmap') {
      const form = /^([\w.-]+)(\(\(|\[|\(|\{\{|\)\)|\))([\s\S]*?)(\)\)|\]|\)|\}\}|\(\(|\()$/.exec(label)
      if (form) { explicit = form[1]!; shape = ({ '((': 'circle', '[': 'rectangle', '(': 'rounded', '{{': 'hexagon', '))': 'bang', ')': 'cloud' } as Record<string, string>)[form[2]!]; label = form[3]! }
    }
    const sourceLabel = label
    label = cleanLabel(label); const directory = r.family === 'treeview' && label.endsWith('/'); if (directory) label = label.slice(0, -1)
    while (stack.length && stack.at(-1)!.indent >= indent) stack.pop()
    const parent = stack.at(-1)?.id ?? '', id = explicit ?? (parent ? parent + '/' + label : label)
    if (nodes.some(node => node.id === id)) r.unresolved.push('Duplicate implicit hierarchical identity needs source disambiguation: ' + id)
    nodes.push({ id, label }); hierarchy.push({ id, parent, ...(r.family === 'treeview' ? { directory } : {}), ...(shape ? { shape } : {}) }); if (parent) edges.push({ source: parent, target: id, directed: false }); r.labels(label, annotation)
    if (r.family === 'mindmap' && sourceLabel.startsWith('"`')) markdownCursor = ownLiteralMarkdown(r, sourceLabel, { kind: 'node', id }, markdownCursor)
    if (annotation || icon || classes) decorations.push({ id, ...(annotation ? { annotation } : {}), ...(icon ? { icon } : {}), ...(classes ? { classes } : {}) })
    stack.push({ indent, id })
  }
  r.expected.nodes = nodes; r.expected.edges = edges; r.fact('hierarchy', hierarchy); if (decorations.length) r.fact('decorations', decorations)
  return true
}

function wardley(r: LiteralReview) {
  if (r.family !== 'wardley') return false
  const components: MeaningJson[] = [], links: MeaningJson[] = [], evolution: MeaningJson[] = [], notes: MeaningJson[] = [], annotations: MeaningJson[] = [], pipelines: MeaningJson[] = []; let pipeline: { component: string; members: MeaningJson[] } | undefined
  for (let line of r.lines.slice(1)) {
    line = line.replace(/\s+%%.*$/, '')
    if (r.title(line) || r.style(line)) continue
    let match = /^\s*size\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]\s*$/.exec(line)
    if (match) { r.fact('size', [Number(match[1]), Number(match[2])]); continue }
    match = /^\s*(anchor|component)\s+(.+?)\s*\[\s*([-+\d.]+)(?:\s*,\s*([-+\d.]+))?\s*\](?:\s+label\s*\[\s*([-+\d.]+)\s*,\s*([-+\d.]+)\s*\])?(?:\s*\(([^)]+)\))?(?:\s*\((inertia)\))?\s*$/.exec(line)
    if (match) {
      const name = cleanLabel(match[2]!), item = { name, kind: match[1]!, coordinates: match[4] === undefined ? [Number(match[3])] : [Number(match[3]), Number(match[4])], ...(match[5] ? { labelOffset: [Number(match[5]), Number(match[6])] } : {}), ...(match[7] ? match[7] === 'inertia' ? { inertia: true } : { strategy: match[7] } : {}), ...(match[8] ? { inertia: true } : {}) }; r.labels(name)
      if (pipeline) pipeline.members.push(item); else components.push(item); continue
    }
    match = /^\s*pipeline\s+(.+?)\s*\{\s*$/.exec(line)
    if (match) { pipeline = { component: cleanLabel(match[1]!), members: [] }; pipelines.push(pipeline); continue }
    if (line.trim() === '}') { if (!pipeline) r.unknown(line); pipeline = undefined; continue }
    match = /^\s*evolve\s+(.+?)\s+([-+\d.]+)\s*$/.exec(line)
    if (match) { evolution.push({ component: cleanLabel(match[1]!), target: Number(match[2]) }); continue }
    match = /^\s*evolution\s+(.+)\s*$/.exec(line)
    if (match) { const stages = match[1]!.split(/\s*->\s*/).map(stage => { const [label, position] = stage.split('@'); r.labels(label!.trim()); return { label: label!.trim(), ...(position !== undefined ? { position: Number(position) } : {}) } }); r.fact('evolution-stages', stages); continue }
    match = /^\s*note\s+"([^"]*)"\s*\[\s*([-+\d.]+)\s*,\s*([-+\d.]+)\s*\]\s*$/.exec(line)
    if (match) { const text = cleanLabel('"' + match[1] + '"'); notes.push({ text, coordinates: [Number(match[2]), Number(match[3])] }); r.labels(text); continue }
    match = /^\s*(.+?)\s+(->|\+<>|\+>|\+'([^']*)'>)\s+(.+?)\s*$/.exec(line)
    if (match) { const source = cleanLabel(match[1]!), target = cleanLabel(match[4]!), label = match[3] ?? ''; links.push({ source, target, kind: match[2]!, label }); r.labels(label); continue }
    match = /^\s*(accelerator|deaccelerator)\s+"([^"]*)"\s*\[\s*([-+\d.]+)\s*,\s*([-+\d.]+)\s*\]\s*$/.exec(line)
    if (match) { annotations.push({ kind: match[1]!, label: match[2]!, coordinates: [Number(match[3]), Number(match[4])] }); r.labels(match[2]!); continue }
    match = /^\s*annotations\s*\[\s*([-+\d.]+)\s*,\s*([-+\d.]+)\s*\]\s*$/.exec(line)
    if (match) { r.fact('annotation-legend-position', [Number(match[1]), Number(match[2])]); continue }
    match = /^\s*annotation\s+(\d+)\s*,\s*\[\s*([-+\d.]+)\s*,\s*([-+\d.]+)\s*\]\s*"([^"]*)"\s*$/.exec(line)
    if (match) { annotations.push({ kind: 'numbered-annotation', number: Number(match[1]), coordinates: [Number(match[2]), Number(match[3])], text: match[4]! }); r.labels(match[1]!, match[4]!); continue }
    r.unknown(line)
  }
  if (pipeline) r.unresolved.push('Unclosed Wardley pipeline')
  r.fact('map-axes', [{ axis: 'x', quantity: 'evolution', range: [0, 1], increases: 'right' }, { axis: 'y', quantity: 'visibility', range: [0, 1], increases: 'up' }])
  r.fact('components', components); r.fact('links', links); if (evolution.length) r.fact('evolution', evolution); if (notes.length) r.fact('notes', notes); if (pipelines.length) r.fact('pipelines', pipelines); if (annotations.length) r.fact('annotations', annotations)
  return true
}

function gitgraph(r: LiteralReview) {
  if (r.family !== 'gitgraph') return false
  const config = (r.expected.facts!['authored-config'] as any)?.gitGraph ?? {}, main = String(config.mainBranchName ?? 'main'), branches = new Map<string, { id: string; order?: number; head: string | null }>([[main, { id: main, head: null, ...(config.mainBranchOrder !== undefined ? { order: config.mainBranchOrder } : {}) }]])
  const commits: any[] = [], operations: MeaningJson[] = []; let current = main
  const attributes = (text: string) => {
    const out: Record<string, string> = {}, matched: string[] = []
    const bareMessage = /^\s*("(?:[^"\\]|\\.)*")\s*$/.exec(text); if (bareMessage) return { message: cleanLabel(bareMessage[1]!) }
    for (const match of text.matchAll(/\b(id|tag|type|parent|order)\s*:\s*("(?:[^"\\]|\\.)*"|[^\s]+)/g)) { out[match[1]!] = cleanLabel(match[2]!); matched.push(match[0]) }
    let rest = text; for (const match of matched) rest = rest.replace(match, '')
    if (rest.trim()) r.unresolved.push('Uninterpreted git command attribute: ' + rest.trim())
    return out
  }
  const addCommit = (attr: Record<string, string>, parents: string[], extra: Record<string, MeaningJson> = {}) => {
    const id = 'commit:' + commits.length, item = { id, ...(attr.id ? { authoredId: attr.id } : {}), ...(attr.message ? { message: attr.message } : {}), branch: current, parents, type: attr.type ?? 'NORMAL', tags: attr.tag ? [attr.tag] : [], ...extra }; commits.push(item); branches.get(current)!.head = id; if (attr.id && config.showCommitLabel !== false) r.labels(attr.id); if (attr.tag) r.labels(attr.tag); return id
  }
  const headerDirection = /^\s*gitGraph\s+(LR|TB|BT)\s*:?/i.exec(r.lines[0]!); if (headerDirection) r.fact('direction', headerDirection[1]!); else r.fact('direction', 'LR')
  for (const line of r.lines.slice(1)) {
    if (r.title(line)) continue
    const match = /^\s*(commit|branch|checkout|switch|merge|cherry-pick)\b\s*(.*?)\s*$/.exec(line)
    if (!match) { r.unknown(line); continue }
    const kind = match[1]!, tail = match[2]!
    if (kind === 'commit') { const attr = attributes(tail), head = branches.get(current)!.head; addCommit(attr, head ? [head] : []); operations.push({ kind, commit: commits.at(-1).id }); continue }
    if (kind === 'branch' || kind === 'checkout' || kind === 'switch' || kind === 'merge') {
      const name = /^("[^"]*"|[^\s]+)(.*)$/.exec(tail)
      if (!name) { r.unknown(line); continue }
      const branch = cleanLabel(name[1]!), attr = attributes(name[2]!)
      if (kind === 'branch') {
        if (branches.has(branch)) { r.unresolved.push('Duplicate git branch requires source review: ' + branch); continue }
        branches.set(branch, { id: branch, head: branches.get(current)!.head, ...(attr.order ? { order: Number(attr.order) } : {}) }); current = branch; operations.push({ kind, branch }); continue
      }
      if (!branches.has(branch)) { r.unresolved.push('Git command references an undeclared branch: ' + branch); continue }
      if (kind === 'checkout' || kind === 'switch') { current = branch; operations.push({ kind: 'checkout', branch }); continue }
      const head = branches.get(current)!.head, other = branches.get(branch)!.head
      if (branch === current || !head || !other) { r.unresolved.push('Git merge preconditions require independent invalid-source review: ' + line.trim()); continue }
      addCommit(attr, [head, other], { mergedBranch: branch }); operations.push({ kind, branch, commit: commits.at(-1).id }); continue
    }
    const attr = attributes(tail), originals = commits.filter(item => item.authoredId === attr.id), original = originals.at(-1), head = branches.get(current)!.head
    if (originals.length !== 1 || !original || !head) { r.unresolved.push('Cherry-pick identity/precondition requires review: ' + line.trim()); continue }
    const parent = attr.parent ? commits.filter(item => item.authoredId === attr.parent).at(-1)?.id : undefined
    addCommit({ type: 'CHERRY_PICK', ...(attr.tag ? { tag: attr.tag } : {}) }, [head], { cherryPickSource: original.id, ...(parent ? { cherryPickParent: parent } : {}) }); operations.push({ kind: 'cherry-pick', commit: commits.at(-1).id })
  }
  if (config.showBranches !== false) r.labels(...branches.keys())
  const hidden: MeaningJson[] = []
  if (config.showBranches === false) for (const id of branches.keys()) { hidden.push({ kind: 'branch', id }); if (!r.expected.labels.includes(id)) (r.expected.forbiddenLabels ??= []).push(id) }
  if (config.showCommitLabel === false) for (const commit of commits) if (commit.authoredId) { hidden.push({ kind: 'commit', id: commit.id, authoredId: commit.authoredId }); if (!r.expected.labels.includes(commit.authoredId)) (r.expected.forbiddenLabels ??= []).push(commit.authoredId) }
  if (hidden.length) r.fact('hidden-git-labels', hidden)
  r.fact('commits', commits); r.fact('branches', [...branches.values()]); r.fact('git-operation-order', operations)
  return true
}

function sequence(r: LiteralReview) {
  if (r.family !== 'sequence') return false
  const nodes = new Map<string, { id: string; label: string }>(), actorKinds = new Map<string, MeaningJson>(), edges: NonNullable<MeaningExpectation['edges']> = [], messages: MeaningJson[] = [], styles: string[] = [], fragments: MeaningJson[] = [], notes: MeaningJson[] = [], lifecycles: MeaningJson[] = [], boxes: NonNullable<MeaningExpectation['groups']> = [], stack: { kind: string; index: number; branch?: number }[] = []
  const node = (id: string, label?: string) => { if (!nodes.has(id)) { nodes.set(id, { id, label: label ?? id }); actorKinds.set(id, { id, kind: 'participant' }) } else if (label !== undefined) nodes.get(id)!.label = label; const box = stack.filter(item => item.kind === 'box').at(-1); if (box && !boxes[box.index]!.members.includes(id)) boxes[box.index]!.members.push(id) }
  for (let index = 1; index < r.lines.length; index++) {
    const line = r.lines[index]!.trim()
    if (r.title(line)) continue
    if (/^(?:link|links|properties)\s+/.test(line)) { r.excludedNonvisual.push('Actor navigation/context-menu data outside static visible drawing: ' + line); continue }
    let match = /^(?:(create)\s+)?(participant|actor)\s+([\w.-]+)(?:\s*@\{(.*?)\})?(?:\s+as\s+(.+))?$/.exec(line)
    if (match) {
      const id = match[3]!, attributes = match[4] ? parseYaml('{' + match[4] + '}') as any : {}, label = cleanLabel(match[5] ?? attributes.alias ?? id); node(id, label); const unresolvedAttributes = Object.fromEntries(Object.entries(attributes).filter(([key]) => !['type', 'alias'].includes(key))); actorKinds.set(id, { id, kind: attributes.type ?? match[2]!, ...(Object.keys(unresolvedAttributes).length ? { attributes: unresolvedAttributes as MeaningJson } : {}) }); if (attributes.alias !== undefined) r.excludedNonvisual.push('Sequence inline alias is syntax input resolved to the node label, with external as taking precedence: ' + id + '=' + JSON.stringify(attributes.alias)); if (match[1]) lifecycles.push({ kind: 'create', actor: id, beforeMessage: messages.length }); continue
    }
    match = /^([\w.-]+?)(\(\))?\s*(<<-->>|<<->>|-->>|->>|-->|->|--x|-x|--\)|-\))([+-])?(\(\))?\s*([\w.-]+)\s*:\s*(.*)$/.exec(line)
    if (match) {
      const source = match[1]!, target = match[6]!, text = cleanLabel(match[7]!), token = match[3]!, startMarker = token.startsWith('<<') ? 'arrow' : 'none', endMarker = /^--?>$/.test(token) ? 'none' : token.endsWith('x') ? 'cross' : token.endsWith(')') ? 'open-arrow' : 'arrow'; node(source); node(target); edges.push({ source, target, directed: startMarker === 'arrow' || endMarker === 'arrow' || endMarker === 'open-arrow', label: text, startMarker, endMarker }); messages.push({ from: source, to: target, text }); styles.push(match[3]!); r.labels(text)
      if (match[2] || match[5]) lifecycles.push({ kind: 'central-lifeline-connection', message: messages.length - 1, from: !!match[2], to: !!match[5] })
      if (match[4]) lifecycles.push({ kind: match[4] === '+' ? 'activate' : 'deactivate', actor: match[4] === '+' ? target : source, beforeMessage: messages.length })
      continue
    }
    match = /^(activate|deactivate|destroy)\s+([\w.-]+)$/.exec(line)
    if (match) { node(match[2]!); lifecycles.push({ kind: match[1]!, actor: match[2]!, beforeMessage: messages.length }); continue }
    match = /^Note\s+(over|left of|right of)\s+([^:]+)\s*:\s*(.*)$/i.exec(line)
    if (match) { const actors = match[2]!.split(',').map(item => item.trim()), text = cleanLabel(match[3]!); actors.forEach(id => node(id)); notes.push({ side: match[1]!.toLowerCase(), actors, text, afterMessage: messages.length, fragmentScope: stack.filter(open => open.kind !== 'box').map(open => ({ fragment: open.index, ...(open.branch !== undefined ? { branch: open.branch } : {}) })) }); r.labels(text); continue }
    match = /^(loop|alt|opt|par|critical|break|rect|box)\b\s*(.*)$/.exec(line)
    if (match) {
      const kind = match[1]!, caption = cleanLabel(match[2]!)
      if (kind === 'box') { const color = /^(transparent|purple|aqua|red|blue|green|yellow|black|white|gray|grey|orange|pink|cyan|magenta|lime|teal|navy|maroon|olive|silver|#[\da-fA-F]{3,8}|rgba?\([^)]*\))(?:\s+(.+))?$/i.exec(caption); const boxCaption = color ? color[2] ?? '' : caption; if (color) r.fact('box-appearance', [...(r.expected.facts!['box-appearance'] as MeaningJson[] ?? []), { id: 'box:' + boxes.length, color: color[1]! }]); const box = { id: 'box:' + boxes.length, label: boxCaption, members: [] as string[] }; boxes.push(box); stack.push({ kind, index: boxes.length - 1 }); r.labels(boxCaption) }
      else { fragments.push({ kind, caption, beginMessage: messages.length, nesting: stack.filter(item => item.kind !== 'box').map(item => item.index) }); stack.push({ kind, index: fragments.length - 1 }); if (kind !== 'rect') r.labels(caption) }
      continue
    }
    if (line === 'end') { const open = stack.pop(); if (!open) { r.unknown(line); continue }; if (open.kind !== 'box') { (fragments[open.index] as any).endMessage = messages.length; for (const fragment of fragments as any[]) if (fragment.parent === open.index && fragment.endMessage === undefined) fragment.endMessage = messages.length }; continue }
    match = /^(else|and|option)\b\s*(.*)$/.exec(line)
    if (match && stack.length) { for (const fragment of fragments as any[]) if (fragment.parent === stack.at(-1)!.index && fragment.endMessage === undefined) fragment.endMessage = messages.length; const caption = cleanLabel(match[2]!); stack.at(-1)!.branch = fragments.length; fragments.push({ kind: match[1]!, caption, beginMessage: messages.length, parent: stack.at(-1)!.index }); r.labels(caption); continue }
    match = /^autonumber(?:\s+(.*))?$/.exec(line)
    if (match) { r.fact('autonumber', match[1]?.trim() || true); continue }
    r.unknown(line)
  }
  if (stack.length) r.unresolved.push('Unclosed sequence fragment or actor box')
  r.expected.nodes = [...nodes.values()]; r.expected.edges = edges; r.labels(...r.expected.nodes.map(item => item.label)); if (boxes.length) r.expected.groups = boxes
  r.fact('message-order', messages); r.fact('message-style', styles); r.fact('participant-order', [...nodes.keys()]); r.fact('participant-kinds', [...actorKinds.values()]); if (fragments.length) r.fact('fragments', fragments); if (notes.length) r.fact('notes', notes); if (lifecycles.length) r.fact('lifecycles', lifecycles)
  const breaks: MeaningJson[] = []
  const lineBreaks = (owner: Record<string, MeaningJson>, text: string) => { if (text.includes('\n')) breaks.push({ owner, lines: text.split('\n') }) }
  messages.forEach((message: any, index) => lineBreaks({ kind: 'message', index }, message.text)); notes.forEach((note: any, index) => lineBreaks({ kind: 'note', index }, note.text)); for (const item of nodes.values()) lineBreaks({ kind: 'participant', id: item.id }, item.label); fragments.forEach((fragment: any, index) => { if (fragment.kind !== 'rect') lineBreaks({ kind: 'fragment', index }, fragment.caption) }); boxes.forEach(box => lineBreaks({ kind: 'box', id: box.id }, box.label))
  if (breaks.length) r.fact('text-line-breaks', breaks)
  const comments = [...r.body.matchAll(/^\s*%%(?!\{)(.*)$/gm)].map(match => cleanLabel(match[1]!)).filter(Boolean)
  for (const comment of comments) {
    if (r.expected.labels.includes(comment)) r.unresolved.push('A comment repeats visible text; proving its nonvisual ownership requires an independently qualified scoped observer: ' + comment)
    else { (r.expected.forbiddenLabels ??= []).push(comment); r.excludedNonvisual.push('Sequence comment text must not be painted: ' + comment) }
  }
  return true
}

function entityRelationship(r: LiteralReview) {
  if (r.family !== 'er') return false
  const nodes = new Map<string, { id: string; label: string }>(), edges: NonNullable<MeaningExpectation['edges']> = [], attributes = new Map<string, MeaningJson[]>(), cardinalities: MeaningJson[] = [], groups: NonNullable<MeaningExpectation['groups']> = [], stack: string[] = [], directions: MeaningJson[] = []
  let owner: string | undefined
  const node = (id: string, label?: string) => { if (!nodes.has(id)) nodes.set(id, { id, label: label ?? id }); else if (label !== undefined) nodes.get(id)!.label = label; if (!attributes.has(id)) attributes.set(id, []); const group = groups.find(item => item.id === stack.at(-1)); if (group && !group.members.includes(id)) group.members.push(id) }
  const cardinality = (value: string) => ['||', '1|', '|1', 'only one', '1'].includes(value) ? 'one-only' : ['o|', '|o', 'zero or one', 'one or zero'].includes(value) ? 'zero-or-one' : ['}|', '|{', 'one or more', 'one or many', '1+', 'many(1)'].includes(value) ? 'one-or-many' : ['}o', 'o{', 'zero or more', 'zero or many', '0+', 'many(0)'].includes(value) ? 'zero-or-many' : value
  const endpoint = '("[^"\\n]*"|[\\p{L}\\p{N}_-]+)', symbolic = new RegExp('^' + endpoint + '\\s*([|o}{1]+)(--|\\.\\.)([|o}{1]+)\\s*' + endpoint + '\\s*:\\s*(.+)$', 'u')
  for (const raw of r.lines.slice(1)) {
    let line = raw.trim()
    if (r.title(line) || r.style(line)) continue
    if (line === '}') { if (!owner) r.unknown(line); owner = undefined; continue }
    if (owner) { const match = /^(\S+)\s+(\S+)(?:\s+((?:(?:PK|FK|UK)(?:,\s*)?)+))?(?:\s+"([^"]*)")?$/.exec(line); if (!match) { r.unknown(line); continue }; const name = cleanLabel(match[2]!), type = match[1]!, keys = match[3] ? match[3].split(/,\s*/) : [], comment = match[4]; attributes.get(owner)!.push({ name, type, keys, ...(comment !== undefined ? { comment } : {}) }); r.labels(name, type, ...(comment ? [comment] : [])); continue }
    line = line.replace(/([\w.-]+):::([\w,-]+)/g, (_all, id: string, classes: string) => { r.fact('entity-classes', [...(r.expected.facts!['entity-classes'] as MeaningJson[] ?? []), { id, classes }]); return id })
    if (line === 'end') { if (!stack.pop()) r.unknown(line); continue }
    let match = /^subgraph\s+(?:([\w.-]+)\s*\[([^\]]+)\]|("[^"]*"|[\w.-]+))$/.exec(line)
    if (match) { const id = match[1] ?? cleanLabel(match[3]!), label = cleanLabel(match[2] ?? match[3]!); const parent = groups.find(item => item.id === stack.at(-1)); if (parent) parent.members.push(id); groups.push({ id, label, members: [] }); stack.push(id); continue }
    match = /^direction\s+(LR|RL|TB|TD|BT)$/.exec(line)
    if (match) { if (!stack.length) r.fact('direction', match[1]!); else directions.push({ group: stack.at(-1)!, direction: match[1]! }); continue }
    match = new RegExp('^' + endpoint + '(?:\\s*\\[([^\\]]*)\\])?(?::::([\\w,-]+))?\\s*(\\{)?$', 'u').exec(line)
    if (match) { const id = cleanLabel(match[1]!); node(id, quotedDiagramMarkdown(r, match[2] ?? match[1]!, { kind: 'node', id })); if (match[3]) r.fact('entity-classes', [...(r.expected.facts!['entity-classes'] as MeaningJson[] ?? []), { id, classes: match[3] }]); if (match[4]) owner = id; continue }
    // Natural-language aliases are documented spellings of the cardinality tokens.
    let relation: string[] | null = symbolic.exec(line)
    if (!relation) {
      const aliases = new RegExp('^' + endpoint + '\\s+(one or zero|zero or one|only one|one or more|one or many|zero or more|zero or many|many\\([01]\\)|[01]\\+|1)\\s+(optionally to|to)\\s+(one or zero|zero or one|only one|one or more|one or many|zero or more|zero or many|many\\([01]\\)|[01]\\+|1)\\s+' + endpoint + '\\s*:\\s*(.+)$', 'u').exec(line)
      if (aliases) relation = [aliases[0], aliases[1]!, aliases[2]!, aliases[3] === 'optionally to' ? '..' : '--', aliases[4]!, aliases[5]!, aliases[6]!]
    }
    if (relation) { const source = cleanLabel(relation[1]!), target = cleanLabel(relation[5]!), label = quotedDiagramMarkdown(r, relation[6]!, { kind: 'edge', index: edges.length, source, target }); node(source, nodes.has(source) ? undefined : quotedDiagramMarkdown(r, relation[1]!, { kind: 'node', id: source })); node(target, nodes.has(target) ? undefined : quotedDiagramMarkdown(r, relation[5]!, { kind: 'node', id: target })); edges.push({ source, target, directed: false, label }); cardinalities.push({ from: source, to: target, left: cardinality(relation[2]!), right: cardinality(relation[4]!), identifying: relation[3] === '--' }); r.labels(label); continue }
    r.unknown(line)
  }
  if (owner) r.unresolved.push('Unclosed entity attribute block'); if (stack.length) r.unresolved.push('Unclosed ER group')
  for (const group of groups) nodes.delete(group.id)
  r.expected.nodes = [...nodes.values()]; r.expected.edges = edges; if (groups.length) r.expected.groups = groups; r.labels(...r.expected.nodes.map(item => item.label), ...groups.map(item => item.label)); r.fact('attributes', [...attributes].filter(([id]) => nodes.has(id)).map(([id, values]) => ({ id, values }))); r.fact('cardinalities', cardinalities); if (directions.length) r.fact('layout-constraints', directions)
  return true
}

/** ER and requirement quoted strings explicitly support Markdown without the
 * flowchart backtick opt-in. Raw identifiers stay separate from displayed text. */
function quotedDiagramMarkdown(r: LiteralReview, raw: string, owner: MeaningJson) {
  const source = raw.trim(), quoted = source.startsWith('"') && source.endsWith('"'), content = quoted ? source.slice(1, -1) : source
  if (!quoted) return cleanLabel(source)
  const strongUnderscores = content.replace(/(^|[^\p{L}\p{N}_])__(?=\S)([\s\S]*?\S)__(?=$|[^\p{L}\p{N}_])/gu, '$1$2')
  const text = cleanLabel('`' + strongUnderscores + '`')
  if (text !== cleanLabel(source)) r.fact('markdown-source-labels', [...(r.expected.facts!['markdown-source-labels'] as MeaningJson[] ?? []), { source: content, text, owners: [owner] }])
  return text
}

function requirements(r: LiteralReview) {
  if (r.family !== 'requirement') return false
  const nodes: NonNullable<MeaningExpectation['nodes']> = [], edges: NonNullable<MeaningExpectation['edges']> = [], definitions: any[] = []; let current: any
  for (const raw of r.lines.slice(1)) {
    const line = raw.trim()
    if (r.title(line) || r.style(line)) continue
    const direction = /^direction\s+(LR|RL|TB|TD|BT)$/.exec(line); if (direction) { r.fact('direction', direction[1]!); continue }
    if (line === '}') { if (!current) r.unknown(line); current = undefined; continue }
    let match = /^(requirement|functionalRequirement|interfaceRequirement|performanceRequirement|physicalRequirement|designConstraint|element)\s+("[^"]*"|[\w.-]+)(?::::([\w,-]+))?\s*\{$/i.exec(line)
    if (match) { const id = cleanLabel(match[2]!), label = quotedDiagramMarkdown(r, match[2]!, { kind: 'node', id }); current = { name: id, kind: match[1]!, fields: {}, ...(match[3] ? { classes: match[3] } : {}) }; definitions.push(current); nodes.push({ id, label }); r.labels(label); continue }
    if (current) { match = /^(id|text|risk|verifymethod|type|docref)\s*:\s*(.*)$/i.exec(line); if (!match) { r.unknown(line); continue }; const field = match[1]!.toLowerCase(), value = quotedDiagramMarkdown(r, match[2]!, { kind: 'requirement-field', id: current.name, field }); current.fields[field] = value; r.labels(value); continue }
    match = /^([\w.-]+)\s+-(\s*(?:contains|copies|derives|satisfies|verifies|refines|traces)\s*)->\s+([\w.-]+)$/i.exec(line)
    if (match) { const label = match[2]!.trim(); edges.push({ source: match[1]!, target: match[3]!, directed: true, label }); r.labels(label); continue }
    match = /^([\w.-]+)\s+<-\s*(contains|copies|derives|satisfies|verifies|refines|traces)\s*-\s+([\w.-]+)$/i.exec(line)
    if (match) { edges.push({ source: match[3]!, target: match[1]!, directed: true, label: match[2]! }); r.labels(match[2]!); continue }
    r.unknown(line)
  }
  if (current) r.unresolved.push('Unclosed requirement/element definition')
  r.expected.nodes = nodes; r.expected.edges = edges; r.fact('definitions', definitions)
  return true
}

function c4(r: LiteralReview) {
  if (r.family !== 'c4') return false
  const nodes: NonNullable<MeaningExpectation['nodes']> = [], groups: NonNullable<MeaningExpectation['groups']> = [], edges: NonNullable<MeaningExpectation['edges']> = [], elements: MeaningJson[] = [], relations: MeaningJson[] = [], styles: MeaningJson[] = [], stack: string[] = []
  for (const raw of r.lines.slice(1)) {
    const line = raw.trim()
    if (r.title(line)) continue
    if (line === '}') { if (!stack.pop()) r.unknown(line); continue }
    const call = /^(\w+)\((.*)\)\s*(\{)?\s*$/.exec(line)
    if (!call) { r.unknown(line); continue }
    const name = call[1]!, args = syntaxList(call[2]!).map(cleanLabel).filter(arg => {
      if (/^Update/.test(name) || !arg.startsWith('$')) return true
      if (/^\$(?:tags|link)=/.test(arg)) r.excludedNonvisual.push('C4 named metadata is not static label text: ' + name + ':' + arg)
      else r.unresolved.push('C4 named argument requires explicit field interpretation: ' + name + ':' + arg)
      return false
    })
    if (/^(?:Enterprise_Boundary|System_Boundary|Container_Boundary|Boundary|Deployment_Node)$/.test(name)) {
      const id = args[0]!, label = args[1] ?? id; const group = { id, label, members: [] as string[] }; groups.push(group); r.labels(label, ...args.slice(2)); elements.push({ id, kind: name, label, extraVisibleFields: args.slice(2) }); if (stack.length) groups.find(item => item.id === stack.at(-1))!.members.push(id); if (call[3]) stack.push(id); continue
    }
    if (/^(?:Person|System|Container|Component)(?:Db|Queue)?(?:_Ext)?$/.test(name)) {
      const id = args[0]!, label = args[1] ?? id; nodes.push({ id, label }); elements.push({ id, kind: name, label, extraVisibleFields: args.slice(2) }); r.labels(label, ...args.slice(2)); if (stack.length) groups.find(item => item.id === stack.at(-1))!.members.push(id); continue
    }
    if (/^(?:BiRel|Rel(?:_(?:Back|U|R|L|D))?)$/.test(name)) {
      const source = name === 'Rel_Back' ? args[1]! : args[0]!, target = name === 'Rel_Back' ? args[0]! : args[1]!, label = args[2] ?? ''; edges.push({ source, target, directed: true, label, ...(name === 'BiRel' ? { startMarker: 'arrow', endMarker: 'arrow' } : {}) }); relations.push({ source, target, kind: name, label, technology: args[3] ?? '' }); r.labels(label, ...args.slice(3)); continue
    }
    if (/^Update(?:ElementStyle|RelStyle|LayoutConfig)$/.test(name)) { const positions: string[] = [], attributes: Record<string, string> = {}; for (const arg of args) { const match = /^\$(\w+)=(.*)$/.exec(arg); if (match) attributes[match[1]!] = cleanLabel(match[2]!); else positions.push(arg) }; styles.push({ kind: name, positions, attributes }); continue }
    r.unknown(line)
  }
  if (stack.length) r.unresolved.push('Unclosed C4 boundary')
  r.expected.nodes = nodes; r.expected.groups = groups; r.expected.edges = edges; r.fact('elements', elements); r.fact('relations', relations); if (styles.length) r.fact('authored-style', styles)
  return true
}

function classes(r: LiteralReview) {
  if (r.family !== 'class') return false
  const nodes = new Map<string, { id: string; label: string }>(), members = new Map<string, string[]>(), edges: NonNullable<MeaningExpectation['edges']> = [], groups: NonNullable<MeaningExpectation['groups']> = [], notes: MeaningJson[] = [], cardinalities: MeaningJson[] = [], annotations: MeaningJson[] = [], generics: MeaningJson[] = [], appearance: MeaningJson[] = [], stack: { kind: 'class' | 'namespace'; id: string }[] = []
  const idValue = (text: string) => text.startsWith('`') && text.endsWith('`') ? text.slice(1, -1) : text
  const node = (raw: string, label?: string) => { const id = idValue(raw); if (!nodes.has(id)) nodes.set(id, { id, label: label ?? id }); else if (label !== undefined) nodes.get(id)!.label = label; if (!members.has(id)) members.set(id, []); const group = stack.filter(item => item.kind === 'namespace').at(-1); if (group) { const namespace = groups.find(item => item.id === group.id)!; if (!namespace.members.includes(id)) namespace.members.push(id) }; return id }
  const idPattern = '(?:`[^`]+`|[\\w.-]+)', edgePattern = new RegExp('^(' + idPattern + ')\\s*(?:"([^"]*)"\\s*)?(<\\|--\\|>|<\\|\\.\\.|<\\|--|--\\|>|\\.\\.\\|>|\\(\\)--|--\\(\\)|\\*--|--\\*|o--|--o|<--|-->|<\\.\\.|\\.\\.>|--|\\.\\.)\\s*(?:"([^"]*)"\\s*)?(' + idPattern + ')(?:\\s*:\\s*(.*))?$')
  const marker = (symbol: string) => /<\||\|>/.test(symbol) ? 'triangle' : /\*/.test(symbol) ? 'diamond' : /o/.test(symbol) ? 'open-diamond' : /\(\)/.test(symbol) ? 'circle' : /[<>]/.test(symbol) ? 'arrow' : 'none'
  const hierarchical = (r.expected.facts!['authored-config'] as any)?.class?.hierarchicalNamespaces !== false, interfaces: MeaningJson[] = []
  const namespace = (name: string, display?: string) => {
    const containing = stack.filter(item => item.kind === 'namespace').at(-1)?.id
    if (!hierarchical && containing) r.unresolved.push('Explicit nesting with hierarchicalNamespaces:false requires review')
    const path = hierarchical && containing && !name.startsWith(containing + '.') ? containing + '.' + name : name
    const segments = hierarchical ? path.split('.') : [path]
    let parent: string | undefined, id = ''
    for (const [index, part] of segments.entries()) {
      id = hierarchical ? segments.slice(0, index + 1).join('.') : path
      let group = groups.find(item => item.id === id)
      if (!group) { group = { id, label: index === segments.length - 1 && display !== undefined ? cleanLabel(display) : part, members: [] }; groups.push(group) }
      else if (index === segments.length - 1 && display !== undefined) group.label = cleanLabel(display)
      if (parent) { const outer = groups.find(item => item.id === parent)!; if (!outer.members.includes(id)) outer.members.push(id) }
      parent = id
    }
    return id
  }
  const lollipop = (raw: string, owner: string, side: string) => {
    const label = idValue(raw), id = 'lollipop:' + interfaces.length + ':' + label
    nodes.set(id, { id, label }); interfaces.push({ id, label, owner, side }); return id
  }
  for (const raw of r.lines.slice(1)) {
    const line = raw.trim().replace(/;$/, '')
    if (line === '}') { if (!stack.pop()) r.unknown(line); continue }
    // A colon in a class block belongs to its member signature. It is not the
    // top-level `Class: member` shorthand and must never invent another class.
    const owner = stack.at(-1)
    if (owner?.kind === 'class') { const annotation = /^<<([^>]+)>>$/.exec(line); if (annotation) { annotations.push({ id: owner.id, annotation: annotation[1]! }); r.labels(annotation[1]!) } else members.get(owner.id)!.push(line); continue }
    if (r.title(line) || r.style(line)) continue
    if (/^(?:click|callback|link)\s/.test(line)) { r.excludedNonvisual.push('Class click/callback/navigation behavior outside a static drawing: ' + line); continue }
    let match = /^direction\s+(LR|RL|TB|TD|BT)$/.exec(line)
    if (match) { r.fact('direction', match[1]!); continue }
    match = /^namespace\s+([\w.-]+)(?:\s*\[([^\]]+)\])?\s*\{$/.exec(line)
    if (match) { stack.push({ kind: 'namespace', id: namespace(match[1]!, match[2]) }); continue }
    const inlineAnnotation = /^class\s+([\w.-]+)\s+<<([^>]+)>>$/.exec(line); if (inlineAnnotation) { annotations.push({ id: node(inlineAnnotation[1]!), annotation: inlineAnnotation[2]! }); r.labels(inlineAnnotation[2]!); continue }
    const classShorthand = /^class\s+([\w.-]+):::([\w,-]+)\s*(\{)?$/.exec(line); if (classShorthand) { const id = node(classShorthand[1]!); r.fact('node-attributes', [...(r.expected.facts!['node-attributes'] as MeaningJson[] ?? []), { id, attributes: { classes: classShorthand[2]! } }]); if (classShorthand[3]) stack.push({ kind: 'class', id }); continue }
    match = new RegExp('^class\\s+(' + idPattern + ')(?:~([^~]+)~)?(?:\\[(.*?)\\])?\\s*(\\{)?$').exec(line)
    if (match) { const id = node(match[1]!, match[3] === undefined ? undefined : cleanLabel(match[3])); if (match[2]) generics.push({ id, parameter: match[2] }); if (match[4]) stack.push({ kind: 'class', id }); continue }
    match = /^note(?:\s+for\s+(`[^`]+`|[\w.-]+))?\s+"([\s\S]*)"$/.exec(line)
    if (match) { const text = cleanLabel('"' + match[2] + '"'); notes.push({ target: match[1] ? node(match[1]) : '', text }); r.labels(text); continue }
    match = edgePattern.exec(line)
    if (match) {
      const token = match[3]!, source = token === '()--' ? lollipop(match[1]!, idValue(match[5]!), 'left') : node(match[1]!), target = token === '--()' ? lollipop(match[5]!, source, 'right') : node(match[5]!), label = cleanLabel(match[6] ?? ''), boundary = token.indexOf('--') >= 0 ? token.indexOf('--') : token.indexOf('..'), a = marker(token.slice(0, boundary)), b = marker(token.slice(boundary + 2))
      edges.push({ source, target, directed: [a, b].some(value => value === 'arrow' || value === 'triangle'), ...(label ? { label } : {}), startMarker: a, endMarker: b }); if (match[2] !== undefined || match[4] !== undefined) { cardinalities.push({ from: source, to: target, left: match[2] ?? '', right: match[4] ?? '' }); r.labels(match[2] ?? '', match[4] ?? '') }; appearance.push({ from: source, to: target, stroke: token.includes('..') ? 'dashed' : 'solid' }); r.labels(label); continue
    }
    match = new RegExp('^(' + idPattern + ')\\s*:\\s*(.+)$').exec(line)
    if (match) { const id = node(match[1]!); members.get(id)!.push(match[2]!.trim()); continue }
    match = /^<<(\w+)>>\s+(`[^`]+`|[\w.-]+)$/.exec(line)
    if (match) { annotations.push({ id: node(match[2]!), annotation: match[1]! }); r.labels(match[1]!); continue }
    match = /^cssClass\s+"([^"]+)"\s+(.+)$/.exec(line)
    if (match) { r.fact('css-classes', [...(r.expected.facts!['css-classes'] as MeaningJson[] ?? []), { ids: match[1]!.split(/,\s*/), class: match[2]! }]); continue }
    r.unknown(line)
  }
  if (stack.length) r.unresolved.push('Unclosed class or namespace block')
  r.expected.nodes = [...nodes.values()]; r.expected.edges = edges; if (groups.length) r.expected.groups = groups; r.labels(...r.expected.nodes.map(item => item.label), ...groups.map(group => group.label)); r.fact('members', [...members].map(([id, values]) => ({ id, values }))); if (interfaces.length) r.fact('lollipop-interfaces', interfaces); if (notes.length) r.fact('notes', notes); if (cardinalities.length) r.fact('cardinalities', cardinalities); if (annotations.length) r.fact('annotations', annotations); if (generics.length) r.fact('generics', generics); if (appearance.length) r.fact('edge-appearance', appearance)
  return true
}

function gantt(r: LiteralReview) {
  if (r.family !== 'gantt') return false
  const tasks: MeaningJson[] = [], sections: string[] = [], settings: Record<string, MeaningJson> = {}; let section = '', previousId = ''
  for (const raw of r.lines.slice(1)) {
    let quote = '', limit = raw.length
    for (let index = 0; index < raw.length; index++) {
      const char = raw[index]!
      if (quote) { if (char === quote && raw[index - 1] !== '\\') quote = ''; continue }
      if (char === '"' || char === "'") { quote = char; continue }
      if (char === '%' && raw[index + 1] === '%' && (index === 0 || /\s/.test(raw[index - 1]!))) { limit = index; break }
    }
    const line = raw.slice(0, limit).trim()
    if (r.title(line)) continue
    let match = /^section\s+(.+)$/.exec(line)
    if (match) { section = cleanLabel(match[1]!); sections.push(section); r.labels(section); continue }
    match = /^(dateFormat|axisFormat|tickInterval|weekday|excludes|includes|todayMarker|displayMode|weekend|inclusiveEndDates|topAxis)\b\s*(.*)$/.exec(line)
    if (match) { settings[match[1]!] = match[2]!.trim() || true; continue }
    match = /^([^:]+)\s*:\s*(.+)$/.exec(line)
    if (match) {
      const label = cleanLabel(match[1]!), tokens = csv(match[2]!), tags: string[] = []
      while (tokens.length && /^(?:crit|active|done|milestone|vert)$/.test(tokens[0]!)) tags.push(tokens.shift()!)
      let id = '', start = '', end = ''
      if (tokens.length >= 3) { id = tokens[0]!; start = tokens[1]!; end = tokens.slice(2).join(',') }
      else if (tokens.length === 2) { start = tokens[0]!; end = tokens[1]! }
      else if (tokens.length === 1) { start = previousId ? 'after ' + previousId : 'implicit-chart-start'; end = tokens[0]! }
      else { r.unknown(line); continue }
      if (!id) id = 'task:' + tasks.length
      tasks.push({ id, label, section, start, end, tags }); previousId = id; r.labels(label); continue
    }
    if (/^click\s/.test(line)) { r.excludedNonvisual.push('Gantt click/navigation behavior outside static drawing: ' + line); continue }
    r.unknown(line)
  }
  r.fact('tasks', tasks); r.fact('sections', sections); r.fact('calendar-settings', settings)
  if (tasks.some((task: any) => task.start === 'implicit-chart-start')) r.unresolved.push('Gantt implicit start depends on current date; freeze an explicit calendar anchor before correctness/timing comparison')
  return true
}

/** Strict JSON with source-order object properties, including numeric keys.
 * JavaScript object enumeration is deliberately not the table oracle. */
function jsonTableRows(source: string) {
  type Value = { kind: 'object'; entries: [string, Value][] } | { kind: 'array'; values: Value[] } | { kind: 'scalar'; value: string | number | boolean | null }
  JSON.parse(source) // Full strict-JSON lexical validation; not object enumeration.
  let at = 0
  const whitespace = () => { while (/\s/.test(source[at] ?? '') && at < source.length) at++ }
  const string = () => { const match = /^"(?:[^"\\]|\\.)*"/.exec(source.slice(at)); if (!match) throw Error('Expected JSON string'); at += match[0].length; return JSON.parse(match[0]) as string }
  const value = (): Value => {
    whitespace()
    if (source[at] === '{') { at++; whitespace(); const entries = new Map<string, Value>(); while (source[at] !== '}') { const key = string(); whitespace(); if (source[at++] !== ':') throw Error('Expected JSON property separator'); entries.set(key, value()); whitespace(); if (source[at] === ',') { at++; whitespace() } else break }; if (source[at++] !== '}') throw Error('Expected JSON object end'); return { kind: 'object', entries: [...entries] } }
    if (source[at] === '[') { at++; whitespace(); const values: Value[] = []; while (source[at] !== ']') { values.push(value()); whitespace(); if (source[at] === ',') { at++; whitespace() } else break }; if (source[at++] !== ']') throw Error('Expected JSON array end'); return { kind: 'array', values } }
    if (source[at] === '"') return { kind: 'scalar', value: string() }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(at)); if (!token) throw Error('Expected JSON scalar'); at += token[0].length; return { kind: 'scalar', value: JSON.parse(token[0]) }
  }
  const root = value(); whitespace(); if (at !== source.length || root.kind !== 'object') throw Error('JSON table must be an object')
  const rows: { path: string; value: string; kind: string }[] = []
  const visit = (entry: Value, path: string) => { if (entry.kind === 'object' && entry.entries.length) for (const [key, child] of entry.entries) visit(child, path ? path + '.' + key : key); else if (entry.kind === 'array' && entry.values.length) entry.values.forEach((child, index) => visit(child, path + '[' + index + ']')); else rows.push({ path, value: entry.kind === 'scalar' ? typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value) : entry.kind === 'object' ? '{}' : '[]', kind: entry.kind === 'scalar' ? entry.value === null ? 'null' : typeof entry.value : entry.kind }) }
  visit(root, ''); return rows
}

/** These dialects explicitly extend flowchart syntax in the pinned source docs.
 * Adaptations preserve every extra source facet instead of erasing it. */
function flowchartDialects(r: LiteralReview) {
  if (!['swimlane', 'agentflow', 'usecase', 'block'].includes(r.family)) return false
  const originalFamily = r.family, originalBody = r.body
  const extra: Record<string, MeaningJson> = {}, adapted: string[] = []
  const kinds: MeaningJson[] = [], annotations: MeaningJson[] = [], grid: MeaningJson[] = [], columns: MeaningJson[] = []
  const stack: string[] = []; let anonymous = 0
  const parsed = statements(r.body)
  if (parsed.unclosed) r.unresolved.push('Unclosed dialect label, annotation or object')
  const header = parsed.values[0] ?? '', direction = /\b(LR|RL|TB|TD|BT)\b/.exec(header)?.[1] ?? (originalFamily === 'swimlane' ? 'LR' : 'TB')
  adapted.push('flowchart ' + direction)
  for (const raw of parsed.values.slice(1)) {
    let line = raw.trim()
    if (/^%%/.test(line)) continue
    if (originalFamily === 'swimlane') { if (/^subgraph\b/.test(line)) kinds.push({ kind: 'lane', declaration: kinds.length }); adapted.push(line); continue }
    if (originalFamily === 'agentflow') {
      const flow = /^flow\s+([\w.-]+)(?:\[([\s\S]*)\])?$/.exec(line)
      if (flow) { kinds.push({ id: flow[1]!, kind: 'agent-flow' }); adapted.push('subgraph ' + flow[1] + '[' + (flow[2] ?? flow[1]) + ']'); continue }
      if (line === 'global') { const id = 'global-scope-' + anonymous++; kinds.push({ id, kind: 'shared-global-scope' }); adapted.push('subgraph ' + id + '[]'); continue }
      if (/^connector\s+/.test(line)) { const id = /^connector\s+([\w.-]+)/.exec(line)?.[1]; if (id) kinds.push({ id, kind: 'connector' }); line = line.replace(/^connector\s+/, '') }
      adapted.push(line); continue
    }
    if (originalFamily === 'block') {
      const composite = /^block(?::([\w.-]+))?(?::(\d+))?$/.exec(line)
      if (composite) { const id = composite[1] ?? 'block-group-' + anonymous++; grid.push({ kind: 'group', id, parent: stack.at(-1) ?? null, span: Number(composite[2] ?? 1) }); stack.push(id); adapted.push('subgraph ' + id + '[]'); continue }
      if (line === 'end') { if (!stack.pop()) r.unresolved.push('Unmatched block end'); adapted.push(line); continue }
      const column = /^columns\s+(auto|\d+)$/.exec(line)
      if (column) { columns.push({ group: stack.at(-1) ?? null, value: column[1] === 'auto' ? 'auto' : Number(column[1]) }); continue }
      if (/^(?:classDef|style|class|linkStyle)\s/.test(line) || /(?:--|==|\.\.)/.test(line)) { adapted.push(line); continue }
      // Whitespace separates cells only outside all source labels and attributes.
      const cells: string[] = []; let cell = '', quote = '', depth = 0
      for (let index = 0; index < line.length; index++) { const char = line[index]!; if (quote) { cell += char; if (char === quote && line[index - 1] !== '\\') quote = ''; continue }; if (char === '"' || char === '`') quote = char; if ('[({'.includes(char)) depth++; if ('])}'.includes(char)) depth--; if (/\s/.test(char) && !depth) { if (cell) cells.push(cell); cell = '' } else cell += char }; if (cell) cells.push(cell)
      for (let cell of cells) {
        const gap = /^space(?::(\d+))?$/.exec(cell)
        if (gap) { grid.push({ kind: 'space', parent: stack.at(-1) ?? null, span: Number(gap[1] ?? 1) }); continue }
        const arrow = /^([\w.-]+)<\[([\s\S]*)\]>\(([^)]*)\)(?::(\d+))?$/.exec(cell)
        if (arrow) { grid.push({ kind: 'block-arrow', id: arrow[1]!, parent: stack.at(-1) ?? null, span: Number(arrow[4] ?? 1), directions: arrow[3]!.split(/,\s*/) }); kinds.push({ id: arrow[1]!, kind: 'block-arrow', directions: arrow[3]!.split(/,\s*/) }); adapted.push(arrow[1] + '[' + arrow[2] + ']'); continue }
        const span = /:(\d+)$/.exec(cell); if (span) cell = cell.slice(0, -span[0].length)
        const id = /^[\w.-]+/.exec(cell)?.[0]
        if (!id) { r.unknown(cell); continue }
        grid.push({ kind: 'node', id, parent: stack.at(-1) ?? null, span: Number(span?.[1] ?? 1) }); adapted.push(cell)
      }
      continue
    }
    // Use case: explicit actors, boundaries, stereotypes and special relationships.
    if (/^json\s/.test(line)) {
      const declaration = /^json\s+([\w.-]+)@(\{[\s\S]*\})(?::::([\w,-]+))?$/.exec(line)
      if (!declaration) { r.unknown(line); continue }
      try { const id = declaration[1]!, rows = jsonTableRows(declaration[2]!); kinds.push({ id, kind: 'json-table', rows, ...(declaration[3] ? { classes: declaration[3] } : {}) }); r.labels(id, ...rows.flatMap(row => [row.path, row.value])); adapted.push(id + '[' + id + ']' + (declaration[3] ? ':::' + declaration[3] : '')) } catch (error) { r.unresolved.push('JSON table interpretation: ' + String(error)) }
      continue
    }
    const boundary = /^systemBoundary\s+([\s\S]*)$/.exec(line)
    if (boundary) {
      const value = boundary[1]!, quotedName = /^"([^"]+)"$/.exec(value)
      if (quotedName) { const id = quotedName[1]!.replace(/\s+/g, '_'); kinds.push({ id, kind: 'system-boundary' }); adapted.push('subgraph ' + id + '["' + quotedName[1] + '"]') }
      else { const declaration = /^([\w.-]+)(?:\[([^\]]*)\])?(@\{[\s\S]*\})?(:::[\w,-]+)?$/.exec(value); if (!declaration) { r.unknown(line); continue }; const id = declaration[1]!; kinds.push({ id, kind: 'system-boundary' }); adapted.push('subgraph ' + id + '[' + (declaration[2] ?? id) + ']'); if (declaration[3] || declaration[4]) adapted.push(id + (declaration[3] ?? '') + (declaration[4] ?? '')) }
      continue
    }
    const note = /^note\s+for\s+([\w.-]+)\s+([\s\S]+)$/.exec(line)
    if (note) { const text = cleanLabel(note[2]!); annotations.push({ target: note[1]!, text }); r.labels(text); if (note[2]!.startsWith('"`')) ownLiteralMarkdown(r, note[0], { kind: 'note', target: note[1]!, index: annotations.length - 1 }); continue }
    const actor = /^actor\s+/.test(line); if (actor) line = line.replace(/^actor\s+/, '')
    const stereotype = /\s*<<([^>]+)>>/.exec(line)
    if (stereotype) { const id = /^[\w.-]+/.exec(line)?.[0]; kinds.push({ id: id ?? '', kind: 'stereotype', value: stereotype[1]! }); r.labels(stereotype[1]!); line = line.replace(stereotype[0], '') }
    const relation = /^(.+?)\s+(?:([\w]+)@)?\.\.>\s*:\s*(include|extend)\s+([\w.-]+)$/.exec(line)
    if (relation) { kinds.push({ source: relation[1]!.trim(), target: relation[4]!, kind: relation[3]!, ...(relation[2] ? { id: relation[2] } : {}) }); line = relation[1] + ' ' + (relation[2] ? relation[2] + '@' : '') + '-.->|' + relation[3] + '| ' + relation[4] }
    if (line.includes('--|>')) { const ids = line.split(/\s*--\|>\s*/); if (ids.length === 2) kinds.push({ source: ids[0]!, target: ids[1]!, kind: 'generalization' }); line = line.replace('--|>', '-->') }
    if (/^"[^"\n]+"$/.test(line)) { const label = cleanLabel(line); const id = label.replace(/\W/g, '_'); if (!id) r.unresolved.push('Anonymous usecase has empty identifier'); line = id + '(' + line + ')'; kinds.push({ id, kind: 'anonymous-use-case', label }) }
    if (actor) { const id = /^[\w.-]+/.exec(line)?.[0]; if (!id) r.unknown(line); else kinds.push({ id, kind: 'actor' }) }
    adapted.push(line)
  }
  if (originalFamily === 'block' && stack.length) r.unresolved.push('Unclosed block group')
  r.body = adapted.join('\n'); r.family = 'flowchart'; flowchart(r); r.body = originalBody; r.family = originalFamily
  const globalIds = new Set(kinds.filter((kind: any) => kind.kind === 'shared-global-scope').map((kind: any) => kind.id)), globalNodes = new Set((r.expected.groups ?? []).filter(group => globalIds.has(group.id)).flatMap(group => group.members))
  if (globalIds.size) { r.expected.groups = (r.expected.groups ?? []).filter(group => !globalIds.has(group.id)).map(group => ({ ...group, members: group.members.filter(id => !globalNodes.has(id) && !globalIds.has(id)) })); extra['global-node-scope'] = [...globalNodes] }
  if (originalFamily === 'usecase') {
    const shapes = new Map(((r.expected.facts!['node-shapes'] ?? []) as any[]).map(item => [item.id, item.shape]))
    const attrs = new Map(((r.expected.facts!['node-attributes'] ?? []) as any[]).map(item => [item.id, item.attributes]))
    for (const node of r.expected.nodes ?? []) {
      const kind = kinds.find((item: any) => item.id === node.id && ['actor', 'json-table'].includes(item.kind)) as any
      if (kind?.kind === 'actor') { const attribute = attrs.get(node.id) as any; shapes.set(node.id, attribute?.icon ? 'actor-icon' : 'actor-' + (attribute?.type ?? 'stick')) }
      else if (kind?.kind === 'json-table') shapes.set(node.id, 'json-table')
      else { const shape = shapes.get(node.id); if (shape && !['rounded', 'rectangle'].includes(shape)) r.unresolved.push('Usecase shape is not defined by the source dialect: ' + shape); shapes.set(node.id, shape === 'rectangle' ? 'rectangle' : 'ellipse') }
    }
    r.fact('node-shapes', [...shapes].map(([id, shape]) => ({ id, shape })))
    for (const kind of kinds as any[]) if (kind.kind === 'generalization') {
      const matches = (r.expected.edges ?? []).filter(edge => edge.source === kind.source && edge.target === kind.target && !edge.label)
      if (matches.length !== 1) r.unresolved.push('Parallel unlabeled usecase generalization needs per-edge source identity: ' + kind.source + '→' + kind.target)
      else matches[0]!.endMarker = 'triangle'
    }
  }
  if (originalFamily === 'block') {
    const arrows = new Set(kinds.filter((item: any) => item.kind === 'block-arrow').map((item: any) => item.id))
    r.fact('node-shapes', ((r.expected.facts!['node-shapes'] ?? []) as any[]).map(item => arrows.has(item.id) ? { ...item, shape: 'block-arrow' } : item))
  }
  if (originalFamily === 'swimlane') extra['lane-order'] = (r.expected.groups ?? []).map(group => group.id)
  if (kinds.length) extra['dialect-kinds'] = kinds
  if (annotations.length) extra.notes = annotations
  if (originalFamily === 'block') { for (const group of [null, ...(r.expected.groups ?? []).map(group => group.id)]) if (!columns.some((entry: any) => entry.group === group)) columns.push({ group, value: 'auto' }); extra['grid-cell-order'] = grid; extra['grid-columns'] = columns }
  for (const [key, value] of Object.entries(extra)) r.fact(key, value)
  return true
}

function kanban(r: LiteralReview) {
  if (r.family !== 'kanban') return false
  const columns: MeaningJson[] = [], identities = new Set<string>(); let current: { id: string; label: string; tasks: MeaningJson[] } | undefined, baseIndent: number | undefined
  for (const raw of r.lines.slice(1)) {
    const indent = raw.match(/^\s*/)![0].length, line = raw.trim()
    const match = /^(?:([\w.-]+))?(?:\[([^\]]*)\])?\s*(@\{[\s\S]*\})?$/.exec(line)
    if (!match || !match[1] && match[2] === undefined) { r.unknown(line); continue }
    const label = cleanLabel(match[2] ?? match[1]!), id = match[1] ?? 'anonymous:' + columns.length + ':' + (current?.tasks.length ?? 0)
    if (identities.has(id)) r.unresolved.push('Kanban identifiers must be unique; duplicate source identity needs clarification: ' + id)
    identities.add(id)
    if (baseIndent === undefined) baseIndent = indent
    if (indent <= baseIndent) { current = { id, label, tasks: [] }; columns.push(current); r.labels(label); continue }
    if (!current) { r.unknown(line); continue }
    let attributes: MeaningJson = {}
    if (match[3]) { try { attributes = parseYaml(match[3].slice(1)) as MeaningJson } catch { r.unknown(line) } }
    current.tasks.push({ id, label, attributes }); r.labels(label)
    if (attributes && typeof attributes === 'object' && !Array.isArray(attributes)) for (const key of ['ticket', 'assigned', 'priority']) { const value = attributes[key]; if (typeof value === 'string') r.labels(value) }
  }
  r.fact('columns', columns); return true
}

function eventModeling(r: LiteralReview) {
  if (r.family !== 'eventmodeling') return false
  const frames: MeaningJson[] = [], data: MeaningJson[] = []; let current: { id: string; fields: MeaningJson[] } | undefined
  const type: Record<string, string> = { ui: 'ui', cmd: 'command', command: 'command', evt: 'event', event: 'event', pcr: 'processor', processor: 'processor', rmo: 'read-model', readmodel: 'read-model' }
  for (const raw of r.lines.slice(1)) {
    const line = raw.trim()
    if (r.title(line) || r.style(line)) continue
    const direction = /^direction\s+(LR|RL|TB|TD|BT)$/.exec(line); if (direction) { r.fact('direction', direction[1]!); continue }
    if (line === '}') { if (!current) r.unknown(line); current = undefined; continue }
    if (current) { const field = /^([\w.-]+)\s*:\s*(.*)$/.exec(line); if (!field) { r.unknown(line); continue }; current.fields.push({ name: field[1]!, value: cleanLabel(field[2]!) }); r.labels(field[1]!, cleanLabel(field[2]!)); continue }
    const block = /^data\s+([\w.-]+)\s*\{$/.exec(line)
    if (block) { current = { id: block[1]!, fields: [] }; data.push(current); continue }
    const frame = /^(tf|rf|timeframe|resetframe)\s+(\d+)\s+(\w+)\s+([\w.-]+)(?:\s*\[\[([^\]]+)\]\])?(?:\s*\{([^}]*)\})?\s*((?:->>\s*\d+\s*)*)(?:\{([^}]*)\})?$/.exec(line)
    if (!frame || !type[frame[3]!]) { r.unknown(line); continue }
    const fields: MeaningJson[] = []
    if (frame[6] || frame[8]) for (const field of syntaxList([frame[6], frame[8]].filter(Boolean).join(', '))) { const item = /^([\w.-]+)\s*:\s*(.+)$/.exec(field); if (!item) r.unknown(field); else { fields.push({ name: item[1]!, value: cleanLabel(item[2]!) }); r.labels(item[1]!, cleanLabel(item[2]!)) } }
    frames.push({ id: frame[2]!, resets: frame[1] === 'rf' || frame[1] === 'resetframe', kind: type[frame[3]!]!, label: frame[4]!, dataReference: frame[5] ?? null, fields, readsFrom: [...frame[7]!.matchAll(/->>\s*(\d+)/g)].map(match => match[1]!) }); r.labels(frame[4]!)
  }
  if (current) r.unresolved.push('Unclosed event data block')
  const referenced = new Set((frames as any[]).map(frame => frame.dataReference).filter(Boolean)); for (const reference of referenced) if (!(data as any[]).some(item => item.id === reference)) r.unresolved.push('Missing event data definition: ' + reference)
  r.fact('frames', frames); if (data.length) r.fact('data-definitions', data); return true
}

/** A grammar AST is the expected drawing: alternatives, sequence, repetitions,
 * lookahead and referenced rules cannot be replaced by a bag of labels. */
function railroad(r: LiteralReview) {
  if (!r.family.startsWith('railroad')) return false
  type Token = { kind: 'literal' | 'word' | 'symbol'; value: string }
  const rules: MeaningJson[] = [], dialect = r.family.replace('railroad', '').replace(/^-/, '') || 'constructor'
  const tokenize = (source: string): Token[] => {
    const tokens: Token[] = []; let at = 0
    while (at < source.length) {
      if (/\s/.test(source[at]!)) { at++; continue }
      const literal = /^"((?:[^"\\]|\\.)*)"/.exec(source.slice(at))
      if (literal) { tokens.push({ kind: 'literal', value: literal[1]!.replace(/\\"/g, '"').replace(/\\\\/g, '\\') }); at += literal[0].length; continue }
      const word = /^[\w-]+/.exec(source.slice(at))
      if (word) { tokens.push({ kind: 'word', value: word[0] }); at += word[0].length; continue }
      const symbol = source[at]!
      if (!'()[]|/*+?!,'.includes(symbol)) throw Error('Unknown grammar token: ' + source.slice(at))
      tokens.push({ kind: 'symbol', value: symbol }); at++
    }
    return tokens
  }
  for (const statement of statements(r.body).values.slice(1)) {
    if (r.title(statement)) continue
    const rule = /^([\w-]+)\s*(?:=|<-)\s*([\s\S]*)$/.exec(statement)
    if (!rule) { r.unknown(statement); continue }
    try {
      const tokens = tokenize(rule[2]!); let at = 0
      const peek = (value: string) => tokens[at]?.kind === 'symbol' && tokens[at]?.value === value
      const expect = (value: string) => { if (!peek(value)) throw Error('Expected ' + value); at++ }
      const collapse = (kind: string, items: MeaningJson[]) => items.length === 1 ? items[0]! : { kind, items }
      const choice = (): MeaningJson => { const items = [sequence()]; while (peek(dialect === 'ebnf' ? '|' : '/')) { at++; items.push(sequence()) }; return collapse(dialect === 'peg' ? 'ordered-choice' : 'choice', items) }
      const sequence = (): MeaningJson => { const items: MeaningJson[] = []; while (at < tokens.length && ![')', ']', ',', '|', '/'].some(peek)) items.push(atom()); if (!items.length) throw Error('Empty expression'); return collapse('sequence', items) }
      const atom = (): MeaningJson => {
        let minimum: number | undefined, maximum: number | null | undefined
        if (dialect === 'abnf') { if (tokens[at]?.kind === 'word' && /^\d+$/.test(tokens[at]!.value) && tokens[at + 1]?.value === '*') { minimum = Number(tokens[at++]!.value); at++; if (tokens[at]?.kind === 'word' && /^\d+$/.test(tokens[at]!.value)) maximum = Number(tokens[at++]!.value); else maximum = null } else if (peek('*')) { at++; minimum = 0; maximum = tokens[at]?.kind === 'word' && /^\d+$/.test(tokens[at]!.value) ? Number(tokens[at++]!.value) : null } }
        let value: MeaningJson
        if (peek('!') || peek('&')) { const operator = tokens[at++]!.value; value = { kind: operator === '!' ? 'negative-lookahead' : 'positive-lookahead', expression: atom() } }
        else if (peek('(')) { at++; value = choice(); expect(')') }
        else if (peek('[')) { at++; value = { kind: 'repeat', minimum: 0, maximum: 1, expression: choice() }; expect(']') }
        else {
          const token = tokens[at++]; if (!token || token.kind === 'symbol') throw Error('Expected grammar atom')
          if (dialect === 'constructor' && token.kind === 'word' && peek('(')) {
            at++; const args: MeaningJson[] = []; if (!peek(')')) { args.push(choice()); while (peek(',')) { at++; args.push(choice()) } }; expect(')')
            const name = token.value
            if (['terminal', 'nonterminal', 'comment'].includes(name)) { const literal = args[0] as any; if (args.length !== 1 || literal?.kind !== 'terminal') throw Error('Expected single literal constructor argument'); value = { kind: name === 'nonterminal' ? 'reference' : name, value: literal.value }; r.labels(literal.value) }
            else if (['sequence', 'choice'].includes(name)) value = { kind: name, items: args }
            else if (['zeroOrMore', 'oneOrMore', 'optional'].includes(name) && args.length === 1) value = { kind: 'repeat', minimum: name === 'oneOrMore' ? 1 : 0, maximum: name === 'optional' ? 1 : null, expression: args[0]! }
            else throw Error('Unknown railroad constructor: ' + name)
          } else { value = { kind: token.kind === 'literal' ? 'terminal' : 'reference', value: token.value }; r.labels(token.value) }
        }
        if (minimum !== undefined) value = { kind: 'repeat', minimum, maximum: maximum ?? null, expression: value }
        if (dialect !== 'abnf' && (peek('*') || peek('+') || peek('?'))) { const repeat = tokens[at++]!.value; value = { kind: 'repeat', minimum: repeat === '+' ? 1 : 0, maximum: repeat === '?' ? 1 : null, expression: value } }
        return value
      }
      const expression = choice(); if (at !== tokens.length) throw Error('Unconsumed grammar tokens'); rules.push({ name: rule[1]!, expression }); r.labels(rule[1]!)
    } catch (error) { r.unresolved.push('Railroad grammar interpretation requires review: ' + rule[1] + ': ' + String(error)) }
  }
  r.fact('grammar-dialect', dialect); r.fact('grammar-rules', rules); return true
}

function zenuml(r: LiteralReview) {
  if (r.family !== 'zenuml') return false
  const actors = new Map<string, { id: string; label: string }>(), kinds: MeaningJson[] = [], events: MeaningJson[] = [], regions: MeaningJson[] = [], stack: { kind: 'call' | 'region'; id: number; target?: string; caller?: string | null }[] = []
  let reply = false, comments: string[] = []
  const actor = (id: string, label?: string) => { if (!actors.has(id)) actors.set(id, { id, label: label ?? id }); else if (label !== undefined) actors.get(id)!.label = label }
  const scope = () => stack.map(item => ({ kind: item.kind, id: item.id }))
  const commentFor = (kind: string) => { const result = comments; comments = []; if (result.length && kind === 'participant') r.excludedNonvisual.push('ZenUML participant comment is not painted: ' + result.join('\n')); return result }
  for (const raw of r.lines.slice(1)) {
    let line = raw.trim()
    if (line.startsWith('//')) { comments.push(line.slice(2).trim()); continue }
    if (r.title(line)) continue
    if (line === '@return' || line === '@reply') { reply = true; continue }
    while (line.startsWith('}')) { const closed = stack.pop(); if (!closed) r.unknown('Unmatched ZenUML closing block'); else { const collection = closed.kind === 'call' ? events : regions; (collection[closed.id] as any).endEvent = events.length }; line = line.slice(1).trim() }
    if (!line) continue
    let match = /^(while|if)\((.*)\)\s*\{$/.exec(line) ?? /^(else|opt|par|try|catch|finally)\s*\{$/.exec(line)
    if (match) { const region = { kind: match[1]!, condition: match[2] ?? '', beginEvent: events.length, scope: scope() }; regions.push(region); stack.push({ kind: 'region', id: regions.length - 1 }); r.labels(match[2] ?? ''); continue }
    match = /^(?:@(Actor|Database)\s+)?([\w.-]+)(?:\s+as\s+(.+))?$/.exec(line)
    if (match && !line.includes('.') && !['return', 'new', 'opt', 'par', 'try', 'catch', 'finally', 'else'].includes(match[2]!)) { actor(match[2]!, match[3]); if (match[1]) kinds.push({ id: match[2]!, kind: match[1]! }); commentFor('participant'); continue }
    match = /^new\s+([\w.-]+)(?:\((.*)\))?$/.exec(line)
    if (match) { actor(match[1]!); const caller = stack.filter(item => item.kind === 'call').at(-1)?.target ?? null; events.push({ kind: 'create', target: match[1]!, caller, arguments: match[2] ?? null, scope: scope(), comments: commentFor('message') }); continue }
    match = /^(?:([\w.-]+)\s+)?(?:([\w.-]+)\s*=\s*)?(?:([\w.-]+)->)?([\w.-]+)\.([\w.-]+)(?:\((.*)\))?\s*(\{)?$/.exec(line)
    if (match) {
      const caller = match[3] ?? stack.filter(item => item.kind === 'call').at(-1)?.target ?? null, target = match[4]!, method = match[5]!, params = match[6] ?? null
      if (caller) actor(caller); actor(target)
      events.push({ kind: 'sync', from: caller, to: target, method, arguments: params, assignment: match[2] ?? null, assignmentType: match[1] ?? null, scope: scope(), comments: commentFor('message') }); r.labels(method)
      if (match[7]) stack.push({ kind: 'call', id: events.length - 1, target, caller }); continue
    }
    match = /^([\w.-]+)\s*->\s*([\w.-]+)\s*:\s*(.*)$/.exec(line)
    if (match) { actor(match[1]!); actor(match[2]!); const text = cleanLabel(match[3]!); events.push({ kind: reply ? 'reply' : 'async', from: match[1]!, to: match[2]!, text, scope: scope(), comments: commentFor('message') }); reply = false; r.labels(text); continue }
    match = /^return(?:\s+(.*))?$/.exec(line)
    if (match) { const call = stack.filter(item => item.kind === 'call').at(-1); if (!call) r.unresolved.push('ZenUML return has no enclosing synchronous call'); events.push({ kind: 'return', from: call?.target ?? null, to: call?.caller ?? null, value: match[1] ?? '', scope: scope(), comments: commentFor('message') }); r.labels(match[1] ?? ''); continue }
    r.unknown(line)
  }
  const messageComments: MeaningJson[] = []; for (let index = 0; index < events.length; index++) for (const source of ((events[index] as any).comments ?? []) as string[]) { const text = cleanLabel('`' + source + '`'); messageComments.push({ event: index, source, text }); r.labels(text) }; if (messageComments.length) r.fact('zenuml-message-comments', messageComments)
  if (reply) r.unresolved.push('Unconsumed ZenUML reply annotation'); if (stack.length) r.unresolved.push('Unclosed ZenUML block')
  r.expected.nodes = [...actors.values()]; r.labels(...r.expected.nodes.map(item => item.label)); r.fact('participant-order', [...actors.keys()]); r.fact('participant-kinds', kinds); r.fact('zenuml-event-order', events); if (regions.length) r.fact('control-regions', regions)
  return true
}

/** Source interpretation only: no renderer, target parser or model executes. */
export function reviewDocumentationSource(input: DocsInput, options: { visual?: boolean } = {}): SourceReviewedDrawing {
  if (input.id === 'packages/mermaid/src/docs/syntax/gantt.md:291' && hash(input.source) === 'b651c090529ba2c6f4e065203d75ffb3f4638219d65b2474c41082ca106319d7') return { id: input.id, sourceSha256: hash(input.source), intent: 'configuration-only', family: 'gantt', review: 'The pinned source fence only declares tickInterval and weekday; it contains no tasks and supplies no drawing accuracy denominator.', sourceReview: { protocol: docsSourceReviewProtocol, sourcePin: docsSourcePin, method: 'Literal source inspection: no authored tasks or drawing content', expectedFactsComplete: true, requiredObligations: [], unresolved: [], excludedNonvisual: ['Configuration-only fence; no drawing is asserted'] } }
  const review = new LiteralReview(input)
  if (!numericCharts(review) && !orderedCharts(review) && !flowchart(review) && !stateDiagram(review) && !architecture(review) && !hierarchy(review) && !wardley(review) && !gitgraph(review) && !sequence(review) && !entityRelationship(review) && !requirements(review) && !c4(review) && !classes(review) && !gantt(review) && !flowchartDialects(review) && !kanban(review) && !eventModeling(review) && !railroad(review) && !zenuml(review)) {
    for (const line of review.lines.slice(1)) if (!review.title(line)) review.unknown(line)
    review.unresolved.push('This family has no complete independent source interpreter yet')
  }
  const result = review.finish()
  if (options.visual !== false && result.expected) { const projected = projectVisualExpectation(result.family, result.expected); result.expected = projected.expected; result.sourceReview.requiredObligations = requiredDocumentationObligations(result.expected); if (projected.projections.length) result.sourceReview.visualProjections = projected.projections }
  return result
}
