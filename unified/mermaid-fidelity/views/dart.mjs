// Reviewed schema views for mermaid_core 0.3.2, the parser behind Mermaid Dart
// (orestesgaolin/mermaid) and Mermaid Flutter (pub:mermaid_flutter): the railroad,
// wardley, venn, cynefin and ishikawa families. See views/index.mjs for the module
// contract and schema-views.mjs for the doctrine. Each mapping cites mermaid_core's own
// model (lib/src/diagrams/<family>/<family>.dart) and Mermaid's database at the pinned tag.
import { entriesOf, record } from '../view-core.mjs'

const NAME = 'mermaid_core'
const PROJECTS = ['orestesgaolin/mermaid', 'pub:mermaid_flutter']
const each = view => Object.fromEntries(PROJECTS.map(project => [project, view]))
const unsupportedGetters = (reasons, hooks) => Object.fromEntries(Object.entries(reasons).map(([key, reason]) => [key, () => hooks.unsupported(reason)]))
const optional = value => (value === null ? undefined : value)

// ── Railroad ─────────────────────────────────────────────────────────────────────
// railroad.dart: RailroadRule { name, expr } where expr is one RailroadExpr kind, named by
// the bridge's $class. Its parser, like Mermaid's railroadParser.ts, folds a one-item
// sequence or choice into its item. Mermaid's rule record (railroadDb.addRule) always has
// a comment key and a repetition always has a separator key; no Mermaid parser sets
// either. `x*` and `{ x }` are a zero-or-more repetition, `x+` a one-or-more one
// (min 0 or 1, max Infinity); an empty expression has no Mermaid word and keeps its own.
function railroadNode(expr, hooks) {
  switch (expr?.$class) {
    case 'RailroadTerminal': return { type: 'terminal', value: expr.text }
    case 'RailroadNonTerminal': return { type: 'nonterminal', name: expr.text }
    case 'RailroadSpecial': return { type: 'special', text: expr.text }
    case 'RailroadSequence': return { type: 'sequence', elements: expr.items.map(item => railroadNode(item, hooks)) }
    case 'RailroadChoice': return { type: 'choice', alternatives: expr.options.map(item => railroadNode(item, hooks)) }
    case 'RailroadOptional': return { type: 'optional', element: railroadNode(expr.child, hooks) }
    case 'RailroadRepetition': return { type: 'repetition', element: railroadNode(expr.child, hooks), min: expr.oneOrMore ? 1 : 0, max: Infinity, separator: undefined }
    case 'RailroadEmpty': return { type: 'mermaid_core:RailroadEmpty' }
    default: return hooks.unavailable(`${NAME} railroad expression ${expr?.$class ?? Object.keys(expr ?? {}).join(',')}`)
  }
}
function railroad(raw, hooks) {
  const rules = () => raw.rules.map(rule => ({ name: rule.name, definition: railroadNode(rule.expr, hooks), comment: undefined }))
  return {
    getRules: rules,
    // Mermaid's lookup keeps the last definition of a name.
    getRule: name => new Map(rules().map(rule => [rule.name, rule])).get(name),
    getTitle: () => raw.title ?? '',
    ...unsupportedGetters({ getAccTitle: `${NAME}'s railroad model keeps no accessibility title`, getAccDescription: `${NAME}'s railroad model keeps no accessibility description` }, hooks),
  }
}

// ── Wardley ──────────────────────────────────────────────────────────────────────
// wardley.dart WardleyMap: components in source order with an anchor flag and Mermaid's
// className ('anchor', 'component', 'pipeline-component'), evolution as x and visibility
// as y (both already in percent, toPercent as Mermaid's), signed label offsets, inertia,
// a source strategy, an evolve target per component and isPipelineParent; links keep the
// written endpoint names; pipelines keep the parent and member names; notes, numbered
// annotations, the annotations box, accelerators, stages, size. Mermaid's WardleyBuilder
// (wardleyBuilder.ts, populated by wardleyParser.ts) lists anchors first, then components,
// then each pipeline's members under the id `<parent>_<name>`, marks members inPipeline,
// resolves a link endpoint to a node id or else to the node with that label, and builds a
// node with every addNode argument as a key (an anchor's and a member's inertia and source
// strategy are undefined). It keeps no axis labels. A component written twice is listed
// twice by mermaid_core (Mermaid merges the two), which is mermaid_core's own model.
const CLASS_ORDER = { anchor: 0, component: 1, 'pipeline-component': 2 }
function wardleyNodes(raw, hooks) {
  const members = (raw.pipelines ?? []).flatMap(pipeline => pipeline.componentIds.map(name => ({ parent: pipeline.parent, name })))
  let next = 0
  const nodes = raw.components.map((comp, index) => {
    let id = comp.name
    if (comp.className === 'pipeline-component') {
      const member = members[next++]
      if (!member || member.name !== comp.name) return hooks.unavailable(`${NAME} wardley pipeline member ${comp.name} not in its pipeline list`)
      id = `${member.parent}_${comp.name}`
    }
    const own = comp.className === 'component'
    return {
      index,
      rank: CLASS_ORDER[comp.className] ?? 1,
      evolveTo: comp.evolveTo,
      node: {
        id, label: comp.name, x: comp.x, y: comp.y, className: optional(comp.className),
        labelOffsetX: optional(comp.labelOffsetX), labelOffsetY: optional(comp.labelOffsetY),
        inertia: own || comp.inertia ? comp.inertia : undefined,
        sourceStrategy: optional(comp.sourceStrategy),
        ...(comp.className === 'pipeline-component' ? { inPipeline: true } : {}),
        ...(comp.isPipelineParent ? { isPipelineParent: true } : {}),
      },
    }
  })
  return nodes.sort((a, b) => a.rank - b.rank || a.index - b.index)
}
function wardley(raw, hooks) {
  const data = () => {
    const items = wardleyNodes(raw, hooks), nodes = items.map(item => item.node)
    const resolve = name => (nodes.some(node => node.id === name) ? name : nodes.find(node => node.label === name)?.id ?? name)
    // Mermaid's trend is { nodeId, targetX, targetY: the node's y }, in evolve statement order.
    const trends = items.filter(item => typeof item.evolveTo === 'number').map(item => ({ nodeId: item.node.id, targetX: item.evolveTo, targetY: item.node.y }))
    const fields = {
      nodes,
      links: raw.edges.map(link => ({ source: resolve(link.from), target: resolve(link.to), dashed: link.dashed, label: optional(link.label), flow: optional(link.flow) })),
      ...(trends.length < 2 ? { trends } : {}),
      pipelines: (raw.pipelines ?? []).map(pipeline => ({ nodeId: pipeline.parent, componentIds: pipeline.componentIds.map(name => `${pipeline.parent}_${name}`) })),
      annotations: (raw.annotations ?? []).map(item => ({ number: item.number, coordinates: [{ x: item.x, y: item.y }], text: optional(item.text) })),
      notes: (raw.notes ?? []).map(item => ({ text: item.text, x: item.x, y: item.y })),
      accelerators: (raw.accelerators ?? []).map(item => ({ name: item.name, x: item.x, y: item.y })),
      deaccelerators: (raw.deaccelerators ?? []).map(item => ({ name: item.name, x: item.x, y: item.y })),
      annotationsBox: raw.annotationsBox ? { x: raw.annotationsBox.x, y: raw.annotationsBox.y } : undefined,
      axes: wardleyAxes(raw, hooks),
      size: raw.size ? { width: raw.size.width, height: raw.size.height } : undefined,
    }
    return record(fields, 'wardley data', Object.keys(fields), trends.length < 2 ? {} : { trends: `${NAME} keeps an evolve target on each component, not the order of the evolve statements` }, hooks, ['trends'])
  }
  return {
    getWardleyData: data,
    getDiagramTitle: () => raw.title ?? '',
    ...unsupportedGetters({ getAccTitle: `${NAME}'s wardley model keeps no accessibility title`, getAccDescription: `${NAME}'s wardley model keeps no accessibility description` }, hooks),
  }
}
// Mermaid's axes are {} until an evolution line, then { stages, stageBoundaries } with the
// boundaries of the stages that wrote one; mermaid_core keeps boundaries only when every
// stage wrote one, so none and some cannot be told apart.
function wardleyAxes(raw, hooks) {
  if (!raw.stages) return {}
  if (raw.stageBoundaries) return { stages: raw.stages, stageBoundaries: raw.stageBoundaries }
  return record({ stages: raw.stages }, 'wardley axes', ['stages', 'stageBoundaries'], { stageBoundaries: `${NAME} keeps stage boundaries only when every stage writes one, so no boundaries and some cannot be told apart` }, hooks, ['stageBoundaries'])
}

// ── Venn ─────────────────────────────────────────────────────────────────────────
// venn.dart, a port of vennDB.ts: subsets (sorted sets, size with Mermaid's default
// 10 / n², label), text nodes (sorted sets, id, label) and style entries (sorted targets,
// declarations), title. Mermaid's label is undefined for none and for an empty one
// (`label ? normalizeText(label) : undefined`). The parser cursor and indentation mode
// are locals of mermaid_core's parse, and no accessibility line is read.
function venn(raw, hooks) {
  const label = value => (value ? value : undefined)
  return {
    getSubsetData: () => raw.subsets.map(item => ({ sets: [...item.sets], size: item.size, label: label(item.label) })),
    getTextData: () => raw.textNodes.map(item => ({ sets: [...item.sets], id: item.id, label: label(item.label) })),
    getStyleData: () => raw.styles.map(item => ({ targets: [...item.targets], styles: Object.fromEntries(entriesOf(item.styles)) })),
    getDiagramTitle: () => raw.title ?? '',
    ...unsupportedGetters({
      getCurrentSets: `${NAME} keeps its venn parser cursor (the current set list) local to the parse`,
      getIndentMode: `${NAME} keeps its venn indentation mode local to the parse`,
      getAccTitle: `${NAME}'s venn parser reads no accessibility title`,
      getAccDescription: `${NAME}'s venn parser reads no accessibility description`,
    }, hooks),
  }
}

// ── Cynefin ──────────────────────────────────────────────────────────────────────
// cynefin.dart: domains as a name -> item labels map in first-seen order (a repeated
// domain block appends), transitions { from, to, label } with self-loops dropped and an
// empty label null, title and accessibility text. Mermaid's cynefinDb.ts keeps a Map of
// { name, items: [{ label }] } and transitions with label undefined when none.
function cynefin(raw, hooks) {
  return {
    getDomains: () => new Map(entriesOf(raw.domains).map(([name, items]) => [name, { name, items: items.map(label => ({ label })) }])),
    getTransitions: () => raw.transitions.map(item => ({ from: item.from, to: item.to, label: item.label || undefined })),
    getDiagramTitle: () => raw.title ?? '',
    getAccTitle: () => raw.accTitle ?? '',
    getAccDescription: () => raw.accDescription ?? '',
  }
}

// ── Ishikawa ─────────────────────────────────────────────────────────────────────
// ishikawa.dart, a port of ishikawaDb.ts: the effect line is the root, causes nest by
// indentation relative to the first cause; each node is { text, children }. Mermaid's
// database also makes the root's text the diagram title. No accessibility line is read.
function ishikawa(raw, hooks) {
  const node = item => ({ text: item.text, children: (item.children ?? []).map(node) })
  return {
    getRoot: () => (raw.root ? node(raw.root) : undefined),
    getDiagramTitle: () => raw.root?.text ?? '',
    ...unsupportedGetters({ getAccTitle: `${NAME}'s ishikawa parser reads no accessibility title`, getAccDescription: `${NAME}'s ishikawa parser reads no accessibility description` }, hooks),
  }
}

export default {
  schema: {
    railroad: each(railroad),
    wardley: each(wardley),
    venn: each(venn),
    cynefin: each(cynefin),
    ishikawa: each(ishikawa),
  },
}
