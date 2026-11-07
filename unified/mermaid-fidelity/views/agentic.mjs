// Agentic Mermaid's 0.5.7 native typed bodies, reviewed against src/<family>/types.ts
// and their actual parsers at c34cd2a. No source is re-parsed here. Renderer-only state,
// discarded source syntax and parser mutation APIs remain unsupported, not invented.
import { record } from '../schema-views.mjs'
import { beautifulGraph } from './misc.mjs'
import { railroadView, railroadAst, wardleyView, vennView, cynefinView, usecaseState, agentflowState, afResolve, AF_RENDERER } from './ports.mjs'

const PROJECT = 'adewale/agentic-mermaid'
const text = raw => ({ getDiagramTitle: () => raw.title ?? '', getAccTitle: () => raw.accessibilityTitle ?? '', getAccDescription: () => raw.accessibilityDescription ?? '' })
const byId = rows => new Map(rows.map(item => [item.id, item]))
const missing = (hooks, reason) => () => hooks.unsupported(`Agentic Mermaid ${reason}`)
const meta = (raw, id) => raw.metadata instanceof Map ? raw.metadata.get(id) : undefined
const SEMANTIC_SKIP = new Set(['shape', 'view', 'icon', 'img', 'form', 'pos', 'w', 'h', 'class', 'style', 'labelType'])
const semanticMeta = value => {
  const kept = Object.fromEntries(Object.entries(value ?? {}).filter(([key]) => !SEMANTIC_SKIP.has(key)))
  return Object.keys(kept).length ? kept : undefined
}

function treeview(raw, hooks) {
  const children = new Map(), ids = new Map(raw.nodes.map((node, index) => [node.id, index + 1]))
  for (const node of raw.nodes) {
    const siblings = children.get(node.parentId) ?? []
    siblings.push(node); children.set(node.parentId, siblings)
  }
  const node = item => record({ id: ids.get(item.id), name: item.label, nodeType: item.nodeType, icon: item.icon, cssClass: item.className, description: item.description, children: (children.get(item.id) ?? []).map(node) }, 'tree node', ['id', 'name', 'nodeType', 'icon', 'cssClass', 'description', 'children'], { level: 'Agentic Mermaid retains tree parents, not the written indentation width' }, hooks)
  return {
    ...text(raw),
    // The database's synthetic root and counter are representation conventions;
    // actual children/order come from the native positional node table.
    getRoot: () => ({ id: 0, level: -1, name: '/', nodeType: 'directory', children: (children.get(undefined) ?? []).map(node) }),
    getCount: () => raw.nodes.length + 1,
  }
}
function treeviewAst(raw, hooks) {
  return record({ $type: 'TreeView', title: raw.title, accTitle: raw.accessibilityTitle, accDescr: raw.accessibilityDescription, nodes: raw.nodes.map(item => record({ $type: 'TreeNode', name: item.label + (item.nodeType === 'directory' ? '/' : ''), classAnnotation: item.className, ...(item.icon !== 'none' ? { iconAnnotation: item.icon } : {}), descAnnotation: item.description }, 'TreeNode', ['name', 'classAnnotation', 'iconAnnotation', 'descAnnotation'], { indent: 'Agentic Mermaid retains tree parents, not the written indentation width', ...(item.icon === 'none' ? { iconAnnotation: 'Agentic Mermaid normalizes both icon() and icon(none) to none' } : {}) }, hooks)) }, 'TreeView', ['nodes', 'title', 'accTitle', 'accDescr'], {}, hooks)
}
function railroad(raw, hooks) {
  return { ...text(raw), ...railroadView(raw, hooks) }
}
function railroadSyntax(raw, hooks) {
  return railroadAst({ ...raw, accTitle: raw.accessibilityTitle, accDescr: raw.accessibilityDescription }, hooks, PROJECT)
}
function venn(raw, hooks) {
  return { ...text(raw), ...vennView(raw, hooks, PROJECT), getCurrentSets: missing(hooks, 'keeps Venn subsets, not the parser cursor'), getIndentMode: missing(hooks, 'keeps Venn ownership, not parser indentation mode') }
}
function usecase(raw, hooks) {
  if (raw.nativeGrammar === 'usecase') return {
    ...usecaseState(raw, hooks, PROJECT),
    getDiagramTitle: () => raw.title ?? '',
    getAccTitle: () => raw.accTitle ?? '',
    getAccDescription: () => raw.accDescr ?? '',
  }
  const view = usecaseState({
    actors: byId(raw.nodes.filter(node => node.kind === 'actor').map(({ kind, ...node }) => node)),
    useCases: byId(raw.nodes.filter(node => node.kind === 'usecase').map(({ kind, ...node }) => node)),
    systemBoundaries: byId(raw.boundaries), relationships: raw.relationships, notes: byId(raw.notes),
    jsonNodes: byId(raw.jsonNodes.map(node => ({ ...node, propertyOrder: new Map(node.propertyOrder) }))),
    classDefs: byId(raw.classDefs), direction: raw.direction,
  }, hooks, PROJECT)
  return { ...text(raw), ...view, getAST: missing(hooks, 'publishes the UseCase semantic body, not source spans and statement occurrences') }
}

function agentflow(raw, hooks) {
  const graph = beautifulGraph(raw.graph, 'Agentic Mermaid', { markers: true, length: true }, hooks)
  const noDiagnostics = missing(hooks, 'keeps its parsed graph and metadata, not Mermaid validation diagnostics')
  const getVertices = () => new Map([...graph.getVertices()].map(([id, vertex]) => {
    const node = raw.graph.nodes.get(id), metadata = meta(raw, id)
    const fields = { id, text: node.label, labelType: node.markdownLabel ? 'markdown' : 'text', styles: vertex.styles, classes: vertex.classes, metadata, isConnector: raw.connectors.has(id), link: node.href }
    Object.defineProperty(fields, 'type', { enumerable: true, get: () => metadata?.shape ? afResolve(metadata.shape) : vertex.type })
    return [id, record(fields, 'agentflow vertex', ['id', 'text', 'type', 'styles', 'classes', 'metadata', 'isConnector', 'link'], { domId: "Agentic Mermaid does not retain Mermaid's renderer DOM ids", props: 'Agentic Mermaid retains AgentFlow metadata, not a separate props object', linkTarget: 'Agentic Mermaid keeps no link target', tooltip: 'Agentic Mermaid keeps no tooltip', dir: 'Agentic Mermaid keeps no per-vertex direction' }, hooks)]
  }))
  const getEdges = () => graph.getEdges().map((edge, index) => {
    const native = raw.graph.edges[index], metadata = native.id ? meta(raw, native.id) : undefined
    const edgeSemantic = edge.type === 'arrow_point' && edge.stroke === 'normal' ? 'sequence' : edge.type === 'arrow_cross' && edge.stroke === 'normal' ? 'failure' : edge.type === 'arrow_open' && edge.stroke === 'dotted' ? 'reference' : undefined
    const fields = { ...edge, edgeSemantic, metadata, interpolate: metadata?.curve ?? native.curve, animate: metadata?.animate ?? native.animate, animation: metadata?.animation ?? native.animation }
    delete fields.labelType
    return record(fields, 'agentflow edge', Object.keys(fields), { labelType: 'Agentic Mermaid retains the edge label, not whether it was written as markdown' }, hooks)
  })
  const getSubGraphs = () => graph.getSubGraphs().map(group => {
    const assigned = raw.graph.classAssignments.get(group.id)
    return record({ ...group, type: 'flow', classes: assigned ? [assigned] : [], metadata: meta(raw, group.id) }, 'agentflow subgraph', ['id', 'title', 'nodes', 'dir', 'classes', 'type', 'metadata'], { labelType: 'Agentic Mermaid retains a group title, not whether it was written as markdown' }, hooks)
  })
  const getConnectors = () => [...getVertices().values()].filter(node => node.isConnector)
  // Native physical columns are one-based UTF-16 boundaries; Jison's public
  // position record uses zero-based columns. Lines and span meanings are unchanged.
  const mappings = () => raw.mappings.map(item => {
    const start = { startLine: item.line, startColumn: item.col - 1 }
    const position = item.type === 'flow' && raw.nativeGrammar !== 'agentflow'
      ? record(start, 'agentflow container position', ['startLine', 'startColumn', 'endLine', 'endColumn'], {
        endLine: 'Agentic Mermaid retains the flow header range, not the complete container extent',
        endColumn: 'Agentic Mermaid retains the flow header range, not the complete container extent',
      }, hooks, ['endLine', 'endColumn'])
      : { ...start, endLine: item.endLine, endColumn: item.endCol - 1 }
    return { id: item.id, type: item.type === 'flow' ? 'subgraph' : item.type, position }
  })
  // Reuse the reviewed AgentFlow structural/layout translation. The normalized
  // record is built only from the actual graph, metadata and source mappings.
  const state = () => agentflowState({ mappings: mappings() }, hooks, PROJECT)
  const getData = () => {
    // A discarded vertex distinction can still determine the same layout shape:
    // both the bare/default and explicit square become AgentFlow roundedRect.
    const nodes = new Map([...getVertices()].map(([id, node]) => [id, {
      id, text: node.text, type: raw.graph.nodes.get(id).shape === 'rectangle' && !meta(raw, id)?.shape ? 'square' : node.type,
      labelType: node.labelType, styles: node.styles, classes: node.classes, metadata: node.metadata, isConnector: node.isConnector, link: node.link,
    }]))
    const normalized = agentflowState({ nodes, edges: getEdges().map(edge => ({ ...edge })), subgraphs: getSubGraphs().map(group => ({ ...group })), connectors: [...nodes.values()].filter(node => node.isConnector), classes: graph.getClasses(), direction: raw.graph.direction }, hooks, PROJECT).getData()
    const absent = { dir: 'Agentic Mermaid keeps no per-vertex direction', linkTarget: 'Agentic Mermaid keeps no link target', tooltip: 'Agentic Mermaid keeps no tooltip', domId: "Agentic Mermaid does not retain Mermaid's renderer DOM ids" }
    return record({ ...normalized, nodes: normalized.nodes.map(node => {
      const fields = { ...node }, unsupported = { ...AF_RENDERER("Mermaid's agentflow renderer decides this layout field; it is not part of a parse result"), ...absent }
      if (fields.isGroup || fields.shape === 'collapsedGroup') { delete unsupported.dir; unsupported.labelType = 'Agentic Mermaid retains a group title, not whether it was written as markdown' }
      for (const key of Object.keys(unsupported)) delete fields[key]
      return record(fields, 'agentflow layout node', Object.keys(fields), unsupported, hooks)
    }), edges: normalized.edges.map(edge => {
      const fields = { ...edge }; delete fields.labelType
      return record(fields, 'agentflow layout edge', Object.keys(fields), { ...AF_RENDERER("Mermaid's agentflow renderer decides this layout field; it is not part of a parse result"), labelType: 'Agentic Mermaid retains the edge label, not whether it was written as markdown' }, hooks)
    }) }, 'agentflow layout data', ['nodes', 'edges', 'other', 'connectors', 'config'], { config: "Mermaid's host configuration is not part of a parse result" }, hooks)
  }
  const semantic = () => {
    const groups = getSubGraphs(), groupIds = new Set(groups.map(group => group.id)), vertices = [], connectors = []
    for (const [id, node] of getVertices()) {
      if (groupIds.has(id)) continue
      const metadata = semanticMeta(node.metadata)
      if (node.isConnector) connectors.push({ id, ...(node.text !== id ? { title: node.text } : {}), ...(metadata ? { metadata } : {}) })
      else vertices.push({ id, label: node.text, shape: afResolve(node.type), vertexKind: raw.roles.get(id), ...(metadata ? { metadata } : {}) })
    }
    const result = { vertices, connectors, edges: getEdges().map(edge => ({ start: edge.start, end: edge.end, id: edge.id, ...(edge.text ? { label: edge.text } : {}), type: edge.type, stroke: edge.stroke, length: edge.length, edgeSemantic: edge.edgeSemantic, ...(edge.metadata ? { metadata: edge.metadata } : {}) })), subGraphs: groups.map(group => ({ id: group.id, nodes: group.nodes, title: group.title, type: group.type, ...(group.dir ? { direction: group.dir } : {}), ...(semanticMeta(group.metadata) ? { metadata: semanticMeta(group.metadata) } : {}) })), direction: raw.graph.direction }
    Object.defineProperty(result, 'diagnostics', { enumerable: true, get: noDiagnostics })
    return result
  }
  return {
    ...graph, getVertices, getEdges, getSubGraphs, getConnectors,
    getTools: () => [...getVertices().values()].filter(node => raw.roles.get(node.id) === 'tool'),
    isToolDefinition: node => raw.roles.get(node.id) === 'tool',
    getDiagnostics: noDiagnostics, emitWarning: missing(hooks, 'exposes parsing, not diagnostic mutation'), emitError: missing(hooks, 'exposes parsing, not diagnostic mutation'),
    getTooltip: missing(hooks, 'keeps no tooltips'),
    getElementMappings: mappings, getElementById: id => mappings().find(item => item.id === id),
    getElementsOnLine: line => mappings().filter(({ position: p }) => line >= p.startLine && line <= p.endLine),
    getElementAtPosition: (line, column) => state().getElementAtPosition(line, column),
    getMappingStats: () => {
      const count = type => raw.mappings.filter(item => item.type === type).length
      return { vertices: count('vertex'), edges: count('edge'), subgraphs: count('flow'), connectors: count('connector'), attachments: count('attachment'), totalElements: raw.mappings.length }
    },
    getData, getSemanticModel: semantic,
  }
}

export default {
  schema: {
    treeview: { [PROJECT]: treeview }, railroad: { [PROJECT]: railroad },
    wardley: { [PROJECT]: raw => ({ ...text(raw), ...wardleyView(raw) }) },
    cynefin: { [PROJECT]: raw => ({ ...text(raw), ...cynefinView(raw) }) },
    venn: { [PROJECT]: venn }, usecase: { [PROJECT]: usecase }, agentflow: { [PROJECT]: agentflow },
    swimlane: { [PROJECT]: (raw, hooks) => beautifulGraph(raw.graph, 'Agentic Mermaid', { markers: true, length: true }, hooks) },
    swimlanes: { [PROJECT]: (raw, hooks) => beautifulGraph(raw.graph, 'Agentic Mermaid', { markers: true, length: true }, hooks) },
  },
  ast: { TreeView: { [PROJECT]: treeviewAst }, Railroad: { [PROJECT]: railroadSyntax } },
}
