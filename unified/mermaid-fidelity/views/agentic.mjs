// Agentic 0.5.7 (e7cb05b): editable family bodies returned by parseRegisteredMermaid.
// Reviewed against src/{agentflow,railroad,treeview,usecase}/{types,parser}.ts.
// These are projections of native data, never parsers or replacement renderers.
import { record, shapeOf, headOf, edgeType, strokeOf, styleStrings } from '../view-core.mjs'
import { usecaseLookups } from './ports.mjs'

const PROJECT = 'adewale/agentic-mermaid'
const text = raw => ({ getDiagramTitle: () => raw.title ?? '', getAccTitle: () => raw.accessibilityTitle ?? '', getAccDescription: () => raw.accessibilityDescription ?? '' })
const absent = (keys, why) => Object.fromEntries(keys.map(key => [key, why]))

// RailroadBody retains all rule occurrences; common.ts folds singleton sequences
// and choices. Unbounded max is native null, Mermaid Infinity. Neither keeps a
// separator/comment in parsed grammar data; these are optional DB record slots.
function railroad(raw, hooks) {
  const label = value => value.type === 'terminal' ? '"' + value.value + '"' : value.type === 'nonterminal' ? value.name : value.type === 'special' ? value.text : '(...)'
  const node = value => {
    switch (value.type) {
      case 'terminal': return { type: value.type, value: value.value }
      case 'nonterminal': return { type: value.type, name: value.name }
      case 'special': return { type: value.type, text: value.text }
      case 'sequence': return { type: value.type, elements: value.elements.map(node) }
      // pegParser.ts uses the same DB choice record for ordered PEG choice;
      // preserve alternative order, rather than treating its extra native flag
      // as lack of support. These are DB observations, not an IR round trip.
      case 'choice': return { type: value.type, alternatives: value.alternatives.map(node) }
      case 'optional': return { type: value.type, element: node(value.element) }
      case 'repetition': return { type: value.type, element: node(value.element), min: value.min, max: value.max === null ? Infinity : value.max, separator: undefined }
      case 'predicate': return { type: 'special', text: value.operator + label(node(value.element)) }
      case 'any': return { type: 'special', text: '.' }
      case 'exception': return { type: 'sequence', elements: [node(value.base), { type: 'terminal', value: '-' }, node(value.except)] }
      default: return hooks.unavailable('Unreviewed Agentic Railroad expression: ' + value.type)
    }
  }
  const rules = () => raw.rules.map(rule => ({ name: rule.name, definition: node(rule.definition), comment: undefined }))
  return { ...text(raw), getTitle: () => raw.title ?? '', getRules: rules, getRule: name => new Map(rules().map(rule => [rule.name, rule])).get(name) }
}
function railroadAst(raw, hooks) {
  const lost = 'Agentic RailroadBody retains normalized expressions, not whether a singleton sequence or choice was written'
  return record({ $type: 'Railroad', title: raw.title, accTitle: raw.accessibilityTitle, accDescr: raw.accessibilityDescription,
    rules: raw.rules.map(rule => record({ $type: 'RailroadRule', name: rule.name }, 'RailroadRule', ['name', 'definition'], { definition: lost }, hooks)),
  }, 'Railroad', ['title', 'accTitle', 'accDescr', 'rules'], {}, hooks)
}

// TreeviewNode has explicit parentId and source-order positional ids, but does
// not retain indentation widths. Depth is not a substitute for written spaces.
const TREE_INDENT = 'Agentic TreeviewBody keeps parent references, not authored indentation widths'
function treeview(raw, hooks) {
  const byId = new Map(raw.nodes.map((n, i) => [n.id, { ...n, ordinal: i + 1 }]))
  if (byId.size !== raw.nodes.length) return hooks.unavailable('Agentic tree has duplicate native identities')
  const children = new Map()
  for (const n of raw.nodes) {
    if (n.parentId !== undefined && !byId.has(n.parentId)) return hooks.unavailable('Agentic tree parent is absent: ' + n.parentId)
    const list = children.get(n.parentId) ?? []; list.push(n); children.set(n.parentId, list)
  }
  for (const n of raw.nodes) {
    const seen = new Set(); let current = n
    while (current) { if (seen.has(current.id)) return hooks.unavailable('Agentic tree has cyclic parents'); seen.add(current.id); current = byId.get(current.parentId) }
  }
  const visit = (node, ancestors = new Set()) => {
    if (ancestors.has(node.id)) return hooks.unavailable('Agentic tree has cyclic parents')
    const next = new Set(ancestors); next.add(node.id)
    return record({ id: byId.get(node.id).ordinal, name: node.label, nodeType: node.nodeType, icon: node.icon, cssClass: node.className, description: node.description,
      children: (children.get(node.id) ?? []).map(child => visit(child, next)),
    }, 'TreeView node', ['level', 'BBox'], { level: TREE_INDENT, BBox: 'TreeView bounds are renderer data' }, hooks, ['level'])
  }
  return { ...text(raw), getCount: () => raw.nodes.length + 1, getRoot: () => ({ id: 0, level: -1, name: '/', nodeType: 'directory', children: (children.get(undefined) ?? []).map(n => visit(n)) }) }
}
function treeviewAst(raw, hooks) {
  return { $type: 'TreeView', title: raw.title, accTitle: raw.accessibilityTitle, accDescr: raw.accessibilityDescription,
    nodes: raw.nodes.map(n => record({ $type: 'TreeNode', name: n.label + (n.nodeType === 'directory' ? '/' : ''), classAnnotation: n.className, descAnnotation: n.description,
      ...(n.icon !== 'none' ? { iconAnnotation: n.icon } : {}),
    }, 'TreeNode', ['indent', 'iconAnnotation'], { indent: TREE_INDENT, ...(n.icon === 'none' ? { iconAnnotation: 'Agentic normalizes empty icon() and icon(none) to the same value' } : {}) }, hooks, ['indent'])),
  }
}

// UsecaseBody keeps the published records, including JSON property order, but
// drops the grammar model's source/header/statement spans and normalized AST.
function usecase(raw, hooks) {
  const nodes = kind => new Map(raw.nodes.filter(n => n.kind === kind).map(({ kind: _kind, ...n }) => [n.id, n]))
  const keyed = list => new Map(list.map(n => [n.id, n]))
  return usecaseLookups({ ...text(raw), getDirection: () => raw.direction,
    getActors: () => nodes('actor'), getUseCases: () => nodes('usecase'),
    getSystemBoundaries: () => keyed(raw.boundaries), getRelationships: () => raw.relationships,
    getNotes: () => keyed(raw.notes), getClassDefs: () => keyed(raw.classDefs),
    getJsonNodes: () => keyed(raw.jsonNodes.map(n => ({ ...n, propertyOrder: Object.fromEntries(n.propertyOrder) }))),
    getAST: () => hooks.unsupported('Agentic UsecaseBody retains published records, not the normalized AST and source spans'),
  }, hooks)
}

const AF_RENDERER = 'Agentic parsed AgentflowBody does not retain Mermaid renderer/private DB state'
const AF_SKIP = new Set(['shape', 'view', 'icon', 'img', 'form', 'pos', 'w', 'h', 'class', 'style', 'labelType'])
const AF_ROLE_SHAPES = { task: 'roundedRect', tool: 'subroutine', input: 'lean-right', decision: 'diamond', refdoc: 'lin-doc', action: 'hexagon' }
function agentflow(raw, hooks) {
  const graph = raw.graph, groups = []
  const walk = items => { for (const group of items) { groups.push(group); walk(group.children) } }; walk(graph.subgraphs)
  const metadata = id => raw.metadata.get(id)
  const no = keys => absent(keys, AF_RENDERER)
  const vertexType = n => AF_ROLE_SHAPES[metadata(n.id)?.shape] ?? metadata(n.id)?.shape ?? n.authoredShape ?? shapeOf(n.shape) ?? n.shape
  const vertex = n => record({ id: n.id, text: n.label, type: vertexType(n), ...(n.markdownLabel ? { labelType: 'markdown' } : {}), ...(n.href ? { link: n.href } : {}),
    styles: styleStrings(graph.nodeStyles.get(n.id)), classes: (graph.classAssignments.get(n.id) ?? '').split(/\s+/).filter(Boolean),
    ...(metadata(n.id) ? { metadata: metadata(n.id) } : {}), ...(raw.connectors.has(n.id) ? { isConnector: true } : {}),
  }, 'Agentflow vertex', ['labelType', 'props', 'link', 'linkTarget', 'haveCallback', 'domId', 'dir'], no(['labelType', 'props', 'link', 'linkTarget', 'haveCallback', 'domId', 'dir']), hooks)
  const vertices = () => new Map([...graph.nodes].map(([id, n]) => [id, vertex(n)]))
  const edges = () => graph.edges.map(e => record({ start: e.source, end: e.target, text: e.label ?? '', type: edgeType(e.hasArrowStart ? headOf(e.startMarker ?? 'arrow') : 'none', e.hasArrowEnd ? headOf(e.endMarker ?? 'arrow') : 'none'),
    stroke: strokeOf(e.style), length: e.length ?? 1, ...(e.id !== undefined ? { id: e.id } : {}),
    ...(e.id && metadata(e.id) ? { metadata: metadata(e.id) } : {}),
  }, 'Agentflow edge', ['id', 'isUserDefinedId', 'labelType', 'classes', 'style', 'interpolate', 'edgeSemantic'], no(['id', 'isUserDefinedId', 'labelType', 'classes', 'style', 'interpolate', 'edgeSemantic']), hooks))
  const subGraphs = () => groups.map(g => record({ id: g.id, title: g.label, nodes: [...g.nodeIds, ...g.children.map(child => child.id)], type: 'flow', dir: g.direction,
    classes: (graph.classAssignments.get(g.id) ?? '').split(/\s+/).filter(Boolean), ...(metadata(g.id) ? { metadata: metadata(g.id) } : {}),
  }, 'Agentflow flow', ['labelType'], no(['labelType']), hooks))
  const mappings = () => raw.mappings.map(m => ({ id: m.id, type: m.type === 'flow' ? 'subgraph' : m.type, position: record({ startLine: m.line, startColumn: m.col - 1, endLine: m.endLine, endColumn: m.endCol - 1 }, 'Agentflow position', ['startIndex', 'endIndex'], absent(['startIndex', 'endIndex'], 'Agentic Agentflow mappings keep line/column positions, not absolute indices'), hooks) }))
  const byId = id => mappings().find(m => m.id === id)
  const data = () => {
    if (groups.length) return hooks.unsupported('Agentic parsed Agentflow groups are not Mermaid\'s computed group/collapse layout')
    const parent = new Map(groups.flatMap(g => g.nodeIds.map(id => [id, g.id])))
    const observedEdges = edges()
    const node = fields => record(fields, 'Agentflow layout node', [], no(['padding', 'look', 'colorIndex', 'cssCompiledStyles', 'width', 'height', 'labelType', 'cssClasses', 'cssStyles']), hooks)
    return record({ nodes: [...graph.nodes.values()].map(n => node({ id: n.id, label: n.label, shape: AF_ROLE_SHAPES[raw.roles.get(n.id)] ?? hooks.unavailable('No reviewed Agentflow connector layout shape'), parentId: parent.get(n.id), isGroup: false, metadata: metadata(n.id) })),
      edges: graph.edges.map((e, index) => record({ start: e.source, end: e.target, label: e.label ?? '', type: observedEdges[index].type, pattern: strokeOf(e.style), minlen: e.length ?? 1 }, 'Agentflow layout edge', ['id', 'isUserDefinedId', 'labelType', 'labelpos', 'thickness', 'classes', 'arrowTypeStart', 'arrowTypeEnd', 'style', 'animate', 'animation', 'metadata'], no(['id', 'isUserDefinedId', 'labelType', 'labelpos', 'thickness', 'classes', 'arrowTypeStart', 'arrowTypeEnd', 'style', 'animate', 'animation', 'metadata']), hooks)), connectors: [...raw.connectors].map(id => vertex(graph.nodes.get(id))),
    }, 'Agentflow layout data', [], no(['other', 'config']), hooks)
  }
  const meta = id => { const value = Object.fromEntries(Object.entries(metadata(id) ?? {}).filter(([key]) => !AF_SKIP.has(key))); return Object.keys(value).length ? { metadata: value } : {} }
  const edgeSemantic = e => !e.hasArrowStart && e.style === 'solid' && e.hasArrowEnd && (e.endMarker ?? 'arrow') === 'arrow' ? 'sequence' : !e.hasArrowStart && e.style === 'solid' && e.hasArrowEnd && e.endMarker === 'cross' ? 'failure' : !e.hasArrowStart && !e.hasArrowEnd && e.style === 'dotted' ? 'reference' : hooks.unavailable('No reviewed Agentflow canonical edge semantic for native markers')
  const semantic = () => {
    const observedEdges = edges()
    return record({ direction: graph.direction,
    vertices: [...graph.nodes.values()].filter(n => !raw.connectors.has(n.id) && !groups.some(g => g.id === n.id)).map(n => ({ id: n.id, label: n.label, shape: vertexType(n) === 'round' ? 'rect' : vertexType(n), vertexKind: raw.roles.get(n.id), ...meta(n.id) })),
    connectors: [...raw.connectors].map(id => ({ id, ...(graph.nodes.get(id)?.label !== id ? { title: graph.nodes.get(id)?.label } : {}), ...meta(id) })),
    edges: graph.edges.map((e, index) => ({ start: e.source, end: e.target, ...(e.id !== undefined ? { id: e.id } : {}), ...(e.label ? { label: e.label } : {}), type: observedEdges[index].type, stroke: strokeOf(e.style), length: e.length ?? 1, edgeSemantic: edgeSemantic(e), ...(e.id ? meta(e.id) : {}) })),
    subGraphs: groups.map(g => ({ id: g.id, nodes: [...g.nodeIds, ...g.children.map(c => c.id)], title: g.label, type: 'flow', ...(g.direction ? { direction: g.direction } : {}), ...meta(g.id) })),
  }, 'Agentflow semantic model', ['diagnostics'], { diagnostics: 'Agentic AgentflowBody does not retain a diagnostic list' }, hooks, ['diagnostics'])
  }
  return { ...text(raw), getVertices: vertices, getEdges: edges, getSubGraphs: subGraphs, getDirection: () => graph.direction,
    getData: data, getSemanticModel: semantic, getConnectors: () => [...raw.connectors].map(id => vertex(graph.nodes.get(id))),
    getDiagnostics: () => hooks.unsupported('Agentic AgentflowBody does not retain a diagnostic list'),
    getElementMappings: mappings, getElementById: byId,
    getElementsOnLine: line => mappings().filter(m => line >= m.position.startLine && line <= m.position.endLine),
    getElementAtPosition: (line, column) => mappings().filter(({ position: p }) => !(line < p.startLine || line > p.endLine || line === p.startLine && column < p.startColumn || line === p.endLine && column > p.endColumn)).sort((a, b) => a.position.endLine - a.position.startLine - (b.position.endLine - b.position.startLine) || a.position.endColumn - a.position.startColumn - (b.position.endColumn - b.position.startColumn))[0],
    getMappingStats: () => { const all = mappings(), count = type => all.filter(m => m.type === type).length; return { vertices: count('vertex'), edges: count('edge'), subgraphs: count('subgraph'), connectors: count('connector'), attachments: count('attachment'), totalElements: all.length } },
    isToolDefinition: item => raw.roles.get(item?.id) === 'tool', getTools: () => [...vertices().values()].filter(v => raw.roles.get(v.id) === 'tool'),
    getClasses: () => new Map([...graph.classDefs].map(([id, styles]) => [id, { id, styles: styleStrings(styles) }])),
  }
}

export default {
  schema: { railroad: { [PROJECT]: railroad }, treeview: { [PROJECT]: treeview }, usecase: { [PROJECT]: usecase }, agentflow: { [PROJECT]: agentflow } },
  ast: { Railroad: { [PROJECT]: railroadAst }, TreeView: { [PROJECT]: treeviewAst } },
}
