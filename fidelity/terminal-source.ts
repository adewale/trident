import { decodeHTML } from 'entities'
import { parse as parseYaml } from 'yaml'
import type { TerminalMeaning } from './terminal.ts'

export interface TerminalFact { criterion: string; expected: unknown; scope: string; required?: boolean }
export interface TerminalSourceContract { schema: 'terminal-source-contract-v2'; family: string; facts: TerminalFact[]; presentation: unknown[]; sourceUncertainties: string[] }
export interface TerminalSourceAnalysis { intent: 'valid' | 'invalid' | 'dialect'; contract: TerminalSourceContract; graph?: TerminalMeaning }
export function visibleTerminalLabel(raw: string) {
  return decodeHTML(raw.trim().replace(/^"|"$/g, '').replace(/^`|`$/g, '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')).normalize('NFC')
}
function bodySource(source: string) {
  let body = source.replace(/^\s*---\r?\n[\s\S]*?\r?\n---\s*\r?\n/, '')
  body = body.replace(/^\s*%%[^\n]*(?:\n|$)/gm, '')
  return body
}
/** Independent source transcription for the finite frozen corpus. This helper
 * reads source tokens, never a renderer, its AST, or candidate output. */
export function analyseTerminalSource(source: string, family: string): TerminalSourceAnalysis {
  const facts: TerminalFact[] = [], presentation: unknown[] = [], sourceUncertainties: string[] = []
  const contract: TerminalSourceContract = { schema: 'terminal-source-contract-v2', family, facts, presentation, sourceUncertainties }
  const fact = (criterion: string, expected: unknown, scope: string, required = true) => facts.push({ criterion, expected, scope, ...(required ? {} : { required: false }) })
  const body = bodySource(source), lines = body.trim().split('\n'), labels = (values: string[]) => [...new Set(values.map(visibleTerminalLabel).filter(Boolean))]
  const header = /^\s*---\r?\n([\s\S]*?)\r?\n---/.exec(source)
  if (header) { const metadata = parseYaml(header[1]!) as any; if (metadata?.title) fact('title', visibleTerminalLabel(String(metadata.title)), 'Authored frontmatter title'); if (metadata?.config) presentation.push({ configuration: metadata.config }) }
  const base = (): TerminalSourceAnalysis => ({ intent: 'valid', contract })
  if (family === 'invalid') { fact('typed-source-rejection', true, 'No Mermaid family header or diagram syntax'); return { intent: 'invalid', contract } }
  if (family === 'flowchart') {
    const parsed = readFlowchart(body)
    presentation.push(...parsed.presentation); sourceUncertainties.push(...parsed.uncertainties)
    fact('nodes', parsed.graph.nodes, 'Exact declared node identities and source-decoded labels')
    fact('relationships', parsed.graph.edges, 'Exact source/target multiplicity, captions and marker semantics')
    if (parsed.groups.length) fact('groups', parsed.groups, 'Declared group labels, enclosure and membership')
    if (parsed.graph.layout?.length) fact('layout-order', parsed.graph.layout, 'Acyclic source direction imposes relative drawn positions')
    else if (parsed.graph.edges.length || parsed.directions.length) fact('layout-direction', { root: parsed.direction, groups: parsed.directions }, 'Requested root/subgraph direction remains an obligation when cycles or grouping prevent the simple per-edge node-order projection')
    if (parsed.shapes.some(item => item.shape !== 'rectangle')) fact('node-shapes', parsed.shapes, 'Explicit node shape declarations')
    if (parsed.lines.some(item => item.lines.length > 1)) fact('node-line-breaks', parsed.lines.filter(item => item.lines.length > 1), 'Explicit HTML/Markdown line breaks, not renderer wrapping')
    if (parsed.graph.nodes.some(node => /\x1b|[\x00-\x08\x0b-\x1f]/.test(node.label))) fact('literal-control-safety', 'escape-or-typed-reject', 'Source label controls must not become executable terminal state')
    return { intent: 'valid', contract, graph: parsed.graph }
  }
  if (family === 'pie') {
    const title = /^\s*pie\s+(?:showData\s+)?title\s+(.+)$/m.exec(body)
    if (title) fact('title', visibleTerminalLabel(title[1]!), 'Literal authored title')
    const slices = [...body.matchAll(/^\s*"([^"]+)"\s*:\s*(\d+(?:\.\d+)?)\s*$/gm)].map(match => ({ label: visibleTerminalLabel(match[1]!), value: Number(match[2]) }))
    if (!slices.length) { fact('typed-source-rejection', true, 'Pinned Mermaid pie grammar requires quoted slice labels'); return { intent: 'invalid', contract } }
    fact('slice-values', slices, 'Literal slice labels and numeric weights; compare values and drawn proportions')
    return base()
  }
  if (family === 'sequence') {
    const participants: { id: string; label: string }[] = [], messages: { source: string; target: string; marker: string; label: string }[] = [], notes: any[] = [], fragments: any[] = [], stack: number[] = []
    const participant = (id: string, label = id) => { if (!participants.some(item => item.id === id)) participants.push({ id, label: visibleTerminalLabel(label) }) }
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*participant\s+(\S+)(?:\s+as\s+(.+))?\s*$/.exec(line))) participant(m[1]!, m[2] ?? m[1])
      else if ((m = /^\s*(\S+?)\s*(--?>>?|--?x|--?\))\s*(\S+?)\s*:\s*(.+)$/.exec(line))) { participant(m[1]!); participant(m[3]!); messages.push({ source: m[1]!, target: m[3]!, marker: m[2]!, label: visibleTerminalLabel(m[4]!) }) }
      else if ((m = /^\s*Note\s+(right of|left of|over)\s+([^:]+):\s*(.+)$/i.exec(line))) notes.push({ position: m[1]!.toLowerCase(), actors: m[2]!.split(',').map(x => x.trim()), text: visibleTerminalLabel(m[3]!), afterMessage: messages.length })
      else if ((m = /^\s*(alt|else|loop|opt|par)\s*(.*)$/.exec(line))) {
        if (m[1] === 'else') { const parent = stack.at(-1); if (parent === undefined) sourceUncertainties.push('Sequence else has no fragment'); const previous = fragments.at(-1); if (previous?.kind === 'else') previous.afterMessage = messages.length; fragments.push({ kind: m[1], label: visibleTerminalLabel(m[2]!), beforeMessage: messages.length, parent }) }
        else { fragments.push({ kind: m[1], label: visibleTerminalLabel(m[2]!), beforeMessage: messages.length, nesting: [...stack] }); stack.push(fragments.length - 1) }
      }
      else if (line.trim() === 'end') { const index = stack.pop(); if (index === undefined) sourceUncertainties.push('Sequence end has no fragment'); else { fragments[index].afterMessage = messages.length; for (const fragment of fragments) if (fragment.parent === index && fragment.afterMessage === undefined) fragment.afterMessage = messages.length } }
      else if (line.trim()) sourceUncertainties.push('Untranscribed sequence statement: ' + line.trim())
    }
    if (stack.length) sourceUncertainties.push('Sequence fragment has no end')
    fact('participants', participants, 'Declared and implicit participant identities/labels')
    fact('ordered-messages', messages, 'Chronological directed messages, captions and solid/dashed marker semantics')
    if (notes.length) fact('owned-notes', notes, 'Note text, actor ownership and explicit line breaks')
    if (fragments.length) fact('fragments', fragments, 'Branch/fragment labels and message spans')
    return base()
  }
  if (family === 'state') {
    const states = new Map<string, { id: string; label: string; scope: string[] }>(), transitions: any[] = [], groups: any[] = [], parents: string[] = []; let direction = 'TB'
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*direction\s+(\S+)/.exec(line))) direction = m[1]!
      else if ((m = /^\s*state\s+(\S+)\s*\{/.exec(line))) { const id = m[1]!; states.set(JSON.stringify([parents, id]), { id, label: id, scope: [...parents] }); groups.push({ id, parent: parents.at(-1) ?? null }); parents.push(id) }
      else if (line.trim() === '}') parents.pop()
      else if ((m = /^\s*(\S+)\s*-->\s*([^:\s]+)(?:\s*:\s*(.+))?\s*$/.exec(line))) { for (const id of [m[1]!, m[2]!]) if (id !== '[*]') states.set(JSON.stringify([parents, id]), { id, label: id, scope: [...parents] }); transitions.push({ source: m[1], target: m[2], caption: visibleTerminalLabel(m[3] ?? ''), scope: [...parents] }) }
      else if (line.trim()) sourceUncertainties.push('Untranscribed state statement: ' + line.trim())
    }
    fact('states', [...states.values()], 'State identities, including composite states')
    fact('transitions', transitions, 'Exact directed transitions/captions, initial/final pseudostates and lexical scopes')
    fact('direction', direction, 'Authored state layout direction')
    if (groups.length) fact('state-enclosures', groups, 'Composite-state containment')
    return base()
  }
  if (family === 'class') {
    const classes: any[] = [], relations: any[] = []; let current: any
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*class\s+([^\s{]+)(?:\s*\{)?\s*$/.exec(line))) { current = { id: m[1], members: [] }; classes.push(current); if (!line.includes('{')) current = undefined }
      else if (line.trim() === '}') current = undefined
      else if (current && line.trim()) current.members.push(line.trim())
      else if ((m = /^\s*(\S+?)(?:\s+"([^"]+)")?\s+(<\|--|\*--|o--|\.\.>|-->|--)(?:\s+"([^"]+)")?\s+(\S+?)(?:\s*:\s*(.+))?\s*$/.exec(line))) relations.push({ source: m[1], target: m[5], marker: m[3], leftCardinality: m[2] ?? '', rightCardinality: m[4] ?? '', caption: visibleTerminalLabel(m[6] ?? '') })
      else if (line.trim()) sourceUncertainties.push('Untranscribed class statement: ' + line.trim())
    }
    fact('class-bodies', classes, 'Exact class identities, generic parameters, stereotypes and members/methods')
    fact('class-relations', relations, 'Association/inheritance/composition/dependency markers, captions and cardinalities')
    return base()
  }
  if (family === 'er') {
    const entities: any[] = [], relations: any[] = []; let current: any, direction = 'TB'
    const entity = (id: string) => { let item = entities.find(item => item.id === id); if (!item) { item = { id, attributes: [] }; entities.push(item) }; return item }
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*direction\s+(\S+)/.exec(line))) direction = m[1]!
      else if ((m = /^\s*([^\s]+)\s+\{\s*$/.exec(line))) current = entity(m[1]!)
      else if (line.trim() === '}') current = undefined
      else if (current && line.trim()) current.attributes.push(line.trim())
      else if ((m = /^\s*(\S+)\s+([|o}{]+)(--|\.\.)([|o}{]+)\s+(\S+)\s*:\s*(.+)\s*$/.exec(line))) { entity(m[1]!); entity(m[5]!); relations.push({ source: m[1], target: m[5], sourceCardinality: m[2], targetCardinality: m[4], identifying: m[3] === '--', caption: visibleTerminalLabel(m[6]!) }) }
      else if (line.trim()) sourceUncertainties.push('Untranscribed ER statement: ' + line.trim())
    }
    fact('entity-bodies', entities, 'Entity identities and exact attribute/type/key declarations')
    fact('entity-relations', relations, 'Relationship endpoints, both cardinalities, captions and identifying status')
    fact('direction', direction, 'Authored ER layout direction')
    return base()
  }
  if (family === 'c4') {
    const nodes: any[] = [], relations: any[] = [], boundaries: any[] = []; let boundary: string | null = null
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*title\s+(.+)/.exec(line))) fact('title', visibleTerminalLabel(m[1]!), 'Literal C4 title')
      else if ((m = /^\s*(Person|System|System_Ext|SystemDb|Container|Boundary)\((.*)\)\s*\{?/.exec(line))) {
        const args = m[2]!.match(/"[^"]*"|[^,]+/g)!.map(x => visibleTerminalLabel(x.trim()))
        if (m[1] === 'Boundary') { boundary = args[0]!; boundaries.push({ id: args[0], label: args[1] }) } else nodes.push({ kind: m[1], id: args[0], label: args[1], description: args[2] ?? '', boundary })
      } else if ((m = /^\s*Rel\((.*)\)/.exec(line))) { const args = m[1]!.match(/"[^"]*"|[^,]+/g)!.map(x => visibleTerminalLabel(x.trim())); relations.push({ source: args[0], target: args[1], caption: args[2] }) }
      else if (line.trim() === '}') boundary = null
      else if (line.trim()) sourceUncertainties.push('Untranscribed C4 statement: ' + line.trim())
    }
    fact('c4-elements', nodes, 'C4 role/label/description and boundary membership'); fact('relationships', relations, 'Directed labelled C4 relationships'); if (boundaries.length) fact('groups', boundaries, 'Boundary labels/enclosure')
    return base()
  }
  if (family === 'gantt') {
    const tasks: any[] = [], sections: string[] = []; let section = '', dateFormat = 'YYYY-MM-DD'
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*title\s+(.+)/.exec(line))) fact('title', visibleTerminalLabel(m[1]!), 'Literal Gantt title')
      else if ((m = /^\s*dateFormat\s+(.+)/.exec(line))) dateFormat = m[1]!.trim()
      else if ((m = /^\s*section\s+(.+)/.exec(line))) { section = visibleTerminalLabel(m[1]!); sections.push(section) }
      else if ((m = /^\s*([^:]+):\s*(.+)$/.exec(line))) tasks.push({ label: visibleTerminalLabel(m[1]!), section, declaration: m[2]!.split(',').map(x => x.trim()) })
      else if (line.trim()) sourceUncertainties.push('Untranscribed Gantt statement: ' + line.trim())
    }
    const ends = new Map<string, string>()
    for (const task of tasks) {
      const tokens: string[] = [...task.declaration], status = tokens.filter(token => ['done', 'active', 'crit', 'milestone'].includes(token))
      const values = tokens.filter(token => !status.includes(token)); let id: string | null = null
      if (values[0] && !/^(?:after\s|\d{4}-\d{2}-\d{2}|\d+(?:\.\d+)?d$)/.test(values[0])) id = values.shift()!
      const start = values[0]?.startsWith('after ') ? ends.get(values[0].slice(6).trim()) : values[0], duration = values[1] && /^(\d+)d$/.exec(values[1]), startMs = typeof start === 'string' ? Date.parse(start + 'T00:00:00Z') : NaN
      const end = startMs !== undefined && Number.isFinite(startMs) && duration ? new Date(startMs + (status.includes('milestone') ? 0 : Number(duration[1])) * 86_400_000).toISOString().slice(0, 10) : undefined
      Object.assign(task, { id, status, startDate: start ?? null, endDate: end ?? null, durationDays: duration ? Number(duration[1]) : null, ...(values[0]?.startsWith('after ') ? { after: values[0].slice(6).trim() } : {}) }); delete task.declaration
      if (id && end) ends.set(id, end)
      if (!start || !end) sourceUncertainties.push('Unresolved Gantt date declaration: ' + task.label)
    }
    fact('gantt-tasks', { dateFormat, sections, tasks }, 'Task identity/order, section, status, dates, durations and after-dependencies; milestone type remains distinct')
    return base()
  }
  if (family === 'quadrant') {
    const axes: any[] = [], quadrants: any[] = [], points: any[] = []
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*title\s+(.+)/.exec(line))) fact('title', visibleTerminalLabel(m[1]!), 'Literal chart title')
      else if ((m = /^\s*([xy])-axis\s+(.+?)\s*-->\s*(.+)/.exec(line))) axes.push({ axis: m[1], low: visibleTerminalLabel(m[2]!), high: visibleTerminalLabel(m[3]!) })
      else if ((m = /^\s*quadrant-(\d)\s+(.+)/.exec(line))) quadrants.push({ number: Number(m[1]), label: visibleTerminalLabel(m[2]!) })
      else if ((m = /^\s*([^:]+):\s*\[([\d.]+),\s*([\d.]+)\]/.exec(line))) points.push({ label: visibleTerminalLabel(m[1]!), x: Number(m[2]), y: Number(m[3]) })
      else if (line.trim()) sourceUncertainties.push('Untranscribed quadrant statement: ' + line.trim())
    }
    fact('quadrant-chart', { axes, quadrants, points }, 'Axis direction/labels, quadrant placement and point coordinates/ownership')
    return base()
  }
  if (family === 'xychart') {
    const horizontal = /xychart-beta\s+horizontal/.test(body), series: any[] = []; let categories: string[] = []
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*title\s+(.+)/.exec(line))) fact('title', visibleTerminalLabel(m[1]!), 'Literal chart title')
      else if ((m = /^\s*x-axis\s+\[([^\]]+)\]/.exec(line))) categories = m[1]!.split(',').map(visibleTerminalLabel)
      else if ((m = /^\s*(bar|line)\s+\[([^\]]+)\]/.exec(line))) series.push({ kind: m[1], values: m[2]!.split(',').map(Number) })
      else if (line.trim()) sourceUncertainties.push('Untranscribed XY-chart statement: ' + line.trim())
    }
    fact('xy-series', { horizontal, categories, series }, 'Series kind, values, category ownership and axis orientation')
    return base()
  }
  if (family === 'packet') {
    const fields = [...body.matchAll(/^\s*(\d+)-(\d+):\s*"([^"]+)"\s*$/gm)].map(m => ({ firstBit: Number(m[1]), lastBit: Number(m[2]), label: visibleTerminalLabel(m[3]!) }))
    fact('packet-fields', fields, 'Bit ranges, exact labels, order and proportional field widths')
    return base()
  }
  if (family === 'journey') {
    const tasks: any[] = []; let section = ''
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*title\s+(.+)/.exec(line))) fact('title', visibleTerminalLabel(m[1]!), 'Literal journey title')
      else if ((m = /^\s*section\s+(.+)/.exec(line))) section = visibleTerminalLabel(m[1]!)
      else if ((m = /^\s*([^:]+):\s*(\d+)\s*:\s*(.+)/.exec(line))) tasks.push({ section, label: visibleTerminalLabel(m[1]!), score: Number(m[2]), actors: m[3]!.split(',').map(visibleTerminalLabel) })
      else if (line.trim()) sourceUncertainties.push('Untranscribed journey statement: ' + line.trim())
    }
    fact('journey-tasks', tasks, 'Ordered section/task labels, scores and actor ownership')
    return base()
  }
  if (family === 'timeline') {
    const periods: any[] = []; let section = ''
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*title\s+(.+)/.exec(line))) fact('title', visibleTerminalLabel(m[1]!), 'Literal timeline title')
      else if ((m = /^\s*section\s+(.+)/.exec(line))) section = visibleTerminalLabel(m[1]!)
      else if ((m = /^\s*([^:]*):\s*(.+)/.exec(line))) { const events = m[2]!.split(':').map(visibleTerminalLabel); if (m[1]!.trim()) periods.push({ section, label: visibleTerminalLabel(m[1]!), events }); else if (periods.length) periods.at(-1)!.events.push(...events); else sourceUncertainties.push('Timeline continuation has no period') }
      else if (line.trim()) sourceUncertainties.push('Untranscribed timeline statement: ' + line.trim())
    }
    fact('timeline-periods', periods, 'Section/period/event membership and chronological order')
    return base()
  }
  if (family === 'gitgraph') {
    const operations: any[] = [], frontmatter = header ? parseYaml(header[1]!) as any : {}, branches = new Set<string>([frontmatter?.config?.gitGraph?.mainBranchName ?? 'main'])
    let branch = [...branches][0]!, invalidReference = false
    const argumentsOf = (text: string) => Object.fromEntries([...text.matchAll(/(id|tag|msg|type|order):\s*("[^"]*"|\S+)/g)].map(m => [m[1], visibleTerminalLabel(m[2]!)]))
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*accTitle:\s*(.+)/.exec(line))) fact('accessible-title', visibleTerminalLabel(m[1]!), 'Source accessibility title; separate from visible title', false)
      else if ((m = /^\s*(commit|branch|checkout|merge|cherry-pick)\s*(.*)/.exec(line))) {
        const args = m[2]!.trim(), attributes = argumentsOf(args), named = /^("[^"]*"|\S+)/.exec(args)?.[0], name = named ? visibleTerminalLabel(named) : ''
        if (['branch', 'checkout', 'merge'].includes(m[1]!) && named && !named.startsWith('"') && /[^\x20-\x7e]/.test(named)) invalidReference = true
        if (m[1] === 'branch') { branches.add(name); branch = name }
        else if (m[1] === 'checkout') branch = name
        operations.push({ operation: m[1], branch, ...(['branch', 'checkout', 'merge'].includes(m[1]!) ? { namedBranch: name } : {}), ...attributes })
      } else if (line.trim()) sourceUncertainties.push('Untranscribed Git graph statement: ' + line.trim())
    }
    fact('git-operations', { mainBranch: [...branches][0], branches: [...branches], operations }, 'Branch/commit identities and membership, chronology, tags/messages, merge/cherry-pick provenance')
    if (invalidReference) { fact('typed-source-rejection', true, 'Pinned Git graph reference grammar requires non-ASCII branch references to be quoted'); return { intent: 'invalid', contract } }
    return base()
  }
  if (family === 'mindmap' || family === 'treemap' || family === 'kanban') {
    const items: any[] = [], stack: { indentation: number; id: string }[] = []
    for (const [index, line] of lines.slice(1).entries()) if (line.trim()) {
      const indentation = /^\s*/.exec(line)![0].length, declaration = line.trim(); let id: string, label: string, weight: number | undefined, shape: string | undefined
      while (stack.length && stack.at(-1)!.indentation >= indentation) stack.pop()
      if (family === 'treemap') { const m = /^"([^"]+)"(?:\s*:\s*(\d+(?:\.\d+)?))?$/.exec(declaration); if (!m) { sourceUncertainties.push('Untranscribed treemap item: ' + declaration); continue }; id = m[1]!; label = id; if (m[2]) weight = Number(m[2]) }
      else { const m = /^(\S+?)(?:\[([^\]]+)\]|\(\((.+)\)\))$/.exec(declaration); id = m?.[1] ?? declaration; label = visibleTerminalLabel(m?.[2] ?? m?.[3] ?? declaration); if (m?.[3]) shape = 'circle' }
      items.push({ id, label, parent: stack.at(-1)?.id ?? null, order: index, ...(weight === undefined ? {} : { weight }), ...(shape ? { shape } : {}) }); stack.push({ indentation, id })
    }
    fact(family + '-hierarchy', items, 'Literal identities/labels, parent-child membership and declaration order' + (family === 'treemap' ? ', with numeric leaf weights and proportional areas' : ''))
    return base()
  }
  if (family === 'architecture') {
    const groups: any[] = [], services: any[] = [], links: any[] = []
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*(accTitle|accDescr):\s*(.+)/.exec(line))) fact(m[1] === 'accTitle' ? 'accessible-title' : 'accessible-description', visibleTerminalLabel(m[2]!), 'Accessibility text is separate from visible diagram labels', false)
      else if ((m = /^\s*title\s+(.+)/.exec(line))) fact('title', visibleTerminalLabel(m[1]!), 'Literal architecture title')
      else if ((m = /^\s*(group|service)\s+(\w+)\(([^)]+)\)\[([^\]]+)\](?:\s+in\s+(\w+))?/.exec(line))) (m[1] === 'group' ? groups : services).push({ id: m[2], icon: m[3], label: visibleTerminalLabel(m[4]!), parent: m[5] ?? null })
      else if ((m = /^\s*(\w+):([LRTB])\s*-(?:\[([^\]]+)\])?->\s*([LRTB]):(\w+)/.exec(line))) links.push({ source: m[1], sourcePort: m[2], caption: visibleTerminalLabel(m[3] ?? ''), targetPort: m[4], target: m[5] })
      else if (line.trim()) sourceUncertainties.push('Untranscribed architecture statement: ' + line.trim())
    }
    fact('architecture-elements', { groups, services }, 'Service/group identities, labels, icons and enclosure'); fact('port-routes', links, 'Exact directed service routes, captions and requested ports')
    return base()
  }
  if (family === 'block') {
    const nodes: any[] = [], groups: any[] = [], columns: any[] = [], stack: string[] = []
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*columns\s+(\d+)/.exec(line))) columns.push({ scope: stack.at(-1) ?? null, columns: Number(m[1]) })
      else if ((m = /^\s*block:([^:\s]+)(?::(\d+))?/.exec(line))) { groups.push({ id: m[1], parent: stack.at(-1) ?? null, span: Number(m[2] ?? 1) }); stack.push(m[1]!) }
      else if (line.trim() === 'end') stack.pop()
      else if (line.trim()) {
        const pattern = /([A-Za-z_]\w*)(?:\[\("([^"]+)"\)\]|\["([^"]+)"\]|\[([^\]]+)\])?(?::(\d+))?/g
        for (const item of line.matchAll(pattern)) nodes.push({ id: item[1], label: visibleTerminalLabel(item[2] ?? item[3] ?? item[4] ?? item[1]!), shape: item[2] ? 'database' : 'rectangle', span: Number(item[5] ?? 1), group: stack.at(-1) ?? null })
      }
    }
    fact('block-layout', { nodes, groups, columns }, 'Node labels/shapes, column capacity, spans and nested block membership')
    return base()
  }
  if (family === 'zenuml') {
    const actors: any[] = [], calls: any[] = [], stack: string[] = []
    for (const line of lines.slice(1)) {
      let m: RegExpExecArray | null
      if ((m = /^\s*title\s+(.+)/.exec(line))) fact('title', visibleTerminalLabel(m[1]!), 'Literal ZenUML title')
      else if ((m = /^\s*@(Actor|Control|Database)\s+(\S+)/.exec(line))) actors.push({ id: m[2], label: m[2], role: m[1] })
      else if (line.trim() === '}') stack.pop()
      else if ((m = /^\s*(?:(\w+)->)?(\w+)\.([\w]+)\(([^)]*)\)\s*(\{)?/.exec(line))) { const sender = m[1] ?? stack.at(-1); calls.push({ sender, target: m[2], method: m[3], arguments: m[4], depth: stack.length }); if (m[5]) stack.push(m[2]!) }
      else if (line.trim()) sourceUncertainties.push('Untranscribed ZenUML statement: ' + line.trim())
    }
    fact('zenuml-actors', actors, 'Actor identities and actor/control/database roles'); fact('zenuml-calls', calls, 'Ordered call endpoints, method labels, nesting and arguments')
    return base()
  }
  sourceUncertainties.push('No independent source transcription for family: ' + family)
  return { intent: 'dialect', contract }
}

function readFlowchart(source: string) {
  type Node = { id: string; label: string; shape?: string }
  const nodes = new Map<string, Node>(), edges: any[] = [], groups: { id: string; label: string; members: string[]; parent?: string }[] = [], stack: string[] = [], presentation: unknown[] = [], directions: { group: string | null; direction: string }[] = [], uncertainties: string[] = []
  const header = /^\s*(?:flowchart|graph)(?:\s+(LR|RL|TD|TB|BT))?/.exec(source), direction = header?.[1] ?? 'TD'
  let body = source.slice(header?.[0].length ?? 0), cursor = 0
  const skip = () => { while (/\s|;/.test(body[cursor] ?? '') && cursor < body.length) cursor++ }
  const line = () => { const end = body.indexOf('\n', cursor); const value = body.slice(cursor, end < 0 ? body.length : end); cursor = end < 0 ? body.length : end + 1; return value }
  const membership = (id: string) => { const group = groups.find(group => group.id === stack.at(-1)); if (group && !group.members.includes(id)) group.members.push(id) }
  const node = (): Node | undefined => {
    const id = /^[\p{Letter}\p{Number}_][\p{Letter}\p{Number}_./]*/u.exec(body.slice(cursor))?.[0]
    if (!id) return
    cursor += id.length; let label = id, shape = 'rectangle'
    const open = body[cursor]
    if (open && '[({>'.includes(open)) {
      const start = cursor, pairs: Record<string, string> = { '[': ']', '(': ')', '{': '}', '>': ']' }, close = pairs[open]!, count = body[cursor + 2] === open && body[cursor + 1] === open ? 3 : body[cursor + 1] === open ? 2 : 1
      cursor += count; let quote = false, depth = count
      const contentStart = cursor
      while (cursor < body.length) {
        if (body[cursor] === '"' && body[cursor - 1] !== '\\') quote = !quote
        if (!quote && body[cursor] === open && open !== '>') depth++
        if (!quote && body[cursor] === close) { depth--; if (!depth) break }
        cursor++
      }
      if (cursor >= body.length) { uncertainties.push('Unclosed node shape at ' + id); return }
      let raw = body.slice(contentStart, cursor - count + 1)
      cursor++
      const shapeSource = body.slice(start, cursor)
      if (open === '(' && raw.startsWith('[') && raw.endsWith(']')) { raw = raw.slice(1, -1); shape = 'stadium' }
      else if (open === '(' && count === 1) shape = 'rounded'
      else if (open === '(') shape = count === 3 ? 'double-circle' : 'circle'
      else if (open === '{') shape = count === 2 ? 'hexagon' : 'diamond'
      else if (open === '>') shape = 'asymmetric'
      else if (raw.startsWith('(') && raw.endsWith(')')) { raw = raw.slice(1, -1); shape = 'database' }
      else if (shapeSource.startsWith('[[')) shape = 'subroutine'
      else if (/^\[\//.test(shapeSource)) { raw = raw.replace(/^\//, '').replace(/\/$/, ''); shape = 'parallelogram' }
      label = visibleTerminalLabel(raw)
    }
    const previous = nodes.get(id), value = { id, label: label === id && previous ? previous.label : label, shape: label === id && previous ? previous.shape : shape }
    nodes.set(id, value); membership(id); return value
  }
  const arrow = (): { token: string; caption: string } | undefined => {
    let match = /^(<-->|<[-.]+|[-.=~]{2,}[>ox]?)/.exec(body.slice(cursor))
    if (!match) return
    let token = match[0], caption = ''; cursor += token.length
    if (token === '--' && /^\s+"/.test(body.slice(cursor))) {
      const named = /^\s+"([^"]+)"\s*(-->)/.exec(body.slice(cursor))
      if (named) { caption = visibleTerminalLabel(named[1]!); token = named[2]!; cursor += named[0].length }
    }
    if (body[cursor] === '|') { const end = body.indexOf('|', cursor + 1); if (end < 0) { uncertainties.push('Unclosed relationship caption'); return }; caption = visibleTerminalLabel(body.slice(cursor + 1, end)); cursor = end + 1 }
    return { token, caption }
  }
  while (cursor < body.length) {
    skip(); if (cursor >= body.length) break
    const rest = body.slice(cursor)
    if (/^(?:classDef|class|style|linkStyle|click)\b/.test(rest)) { presentation.push(line().trim()); continue }
    if (/^direction\b/.test(rest)) { const declaration = /^direction\s+(LR|RL|TD|TB|BT)\s*$/.exec(line().trim()); if (!declaration) uncertainties.push('Untranscribed group direction'); else directions.push({ group: stack.at(-1) ?? null, direction: declaration[1]! }); continue }
    if (/^subgraph\b/.test(rest)) {
      const declaration = line().replace(/^subgraph\s*/, '').trim(); const m = /^(\S+)\s*\[([^\]]+)\]$/.exec(declaration)
      const label = visibleTerminalLabel(m?.[2] ?? declaration), id = m?.[1] ?? label
      groups.push({ id, label, members: [], ...(stack.length ? { parent: stack.at(-1)! } : {}) }); if (stack.length) groups.find(group => group.id === stack.at(-1))!.members.push(id); stack.push(id); continue
    }
    if (/^end\b/.test(rest)) { line(); stack.pop(); continue }
    const first = node(); if (!first) { uncertainties.push('Untranscribed flowchart syntax: ' + line().trim()); continue }
    let left = [first]
    while (cursor < body.length) {
      while (/[ \t]/.test(body[cursor] ?? '') && cursor < body.length) cursor++
      if (body[cursor] === '&') { cursor++; while (/[ \t]/.test(body[cursor] ?? '') && cursor < body.length) cursor++; const next = node(); if (!next) { uncertainties.push('Missing source node after &'); break }; left.push(next); continue }
      const relation = arrow(); if (!relation) break
      while (/[ \t]/.test(body[cursor] ?? '') && cursor < body.length) cursor++
      const rightFirst = node(); if (!rightFirst) { uncertainties.push('Missing relationship target'); break }
      const right = [rightFirst]
      while (true) { const at = cursor; while (/[ \t]/.test(body[cursor] ?? '') && cursor < body.length) cursor++; if (body[cursor] !== '&') { cursor = at; break }; cursor++; while (/[ \t]/.test(body[cursor] ?? '') && cursor < body.length) cursor++; const next = node(); if (!next) { uncertainties.push('Missing target node after &'); break }; right.push(next) }
      for (const a of left) for (const b of right) {
        const reversed = relation.token.startsWith('<') && relation.token !== '<-->', directed = relation.token.endsWith('>') || reversed
        const source = reversed ? b.id : a.id, target = reversed ? a.id : b.id
        const edge: any = { source, target, ...(relation.caption ? { label: relation.caption } : {}), ...(directed ? {} : { directed: false }), ...(relation.token.endsWith('x') ? { endMarker: 'cross' } : relation.token.endsWith('o') ? { endMarker: 'circle' } : {}), ...(relation.token.includes('.') ? { stroke: 'dotted' } : relation.token.includes('=') ? { stroke: 'thick' } : {}), ...(relation.token.includes('~') ? { visible: false } : {}) }
        edges.push(edge); if (relation.token === '<-->') edges.push({ ...edge, source: b.id, target: a.id })
      }
      left = right
    }
  }
  const claimed = new Set<string>()
  for (const group of groups) { nodes.delete(group.id); group.members = group.members.filter(id => !claimed.has(id)); for (const id of group.members) claimed.add(id) }
  const graph: TerminalMeaning = { nodes: [...nodes.values()].map(({ id, label }) => ({ id, label: label.replace(/\s+/g, ' ').trim() })), edges }
  const reachable = (from: string, to: string, seen = new Set<string>()): boolean => { if (from === to) return true; if (seen.has(from)) return false; seen.add(from); return edges.filter(edge => edge.source === from).some(edge => reachable(edge.target, to, new Set(seen))) }
  const directed = edges.filter(edge => edge.directed !== false && edge.visible !== false), acyclic = directed.every(edge => !reachable(edge.target, edge.source))
  if (acyclic && directed.length && !groups.length) graph.layout = directed.map(edge => ({ before: ['RL', 'BT'].includes(direction) ? edge.target : edge.source, after: ['RL', 'BT'].includes(direction) ? edge.source : edge.target, axis: ['LR', 'RL'].includes(direction) ? 'x' : 'y' }))
  if (groups.length) (graph as any).groups = groups
  return { graph, groups, direction, directions, shapes: [...nodes.values()].map(({ id, shape }) => ({ id, shape })), lines: [...nodes.values()].map(({ id, label }) => ({ id, lines: label.split('\n') })), presentation, uncertainties }
}
