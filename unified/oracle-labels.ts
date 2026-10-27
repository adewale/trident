import { decodeHTML } from 'entities'
import type { MermaidSnapshot } from '../portable/mermaid-oracle.ts'

// Authored label expectations, read from the pinned Mermaid oracle's diagram DB getters.
// Ported from Agentic's eval/mermaid-modern-compat/label-census.ts; no renderer under
// measurement, label helper or harvested local expectation participates.

type Row = Record<string, unknown>
const row = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.map(row) : []
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : []
const pairs = (value: unknown): Row[] => list(value).map(item => row(list(item)[1]))
const text = (value: unknown): string => typeof value === 'string' ? value : ''

export interface ReferenceLabel { path: string; text: string; markdown?: boolean }

/** Read authored label fields from independent DB getters. No Agentic parser,
 * renderer, label helper or harvested local expectation participates here. */
export function referenceLabels(family: string, reply: MermaidSnapshot): ReferenceLabel[] | undefined {
  if (!reply.accepted || !reply.snapshot) return undefined
  const db = reply.snapshot.data
  const out: ReferenceLabel[] = []
  const add = (path: string, value: unknown, markdown = false): void => {
    if (typeof value === 'string' && value.trim()) out.push({ path, text: value, ...(markdown ? { markdown: true } : {}) })
    else if (Array.isArray(value)) value.forEach((part, index) => add(`${path}[${index}]`, part, markdown))
  }
  const fields = (path: string, values: Row[], ...keys: string[]): void => {
    values.forEach((value, index) => keys.forEach(key => add(`${path}[${index}].${key}`, value[key])))
  }
  const tree = (path: string, value: unknown, key: string): void => {
    const item = row(value)
    add(`${path}.${key}`, item[key])
    list(item.children).forEach((child, index) => tree(`${path}.children[${index}]`, child, key))
  }
  // Mermaid 12.2.0's railroad renderer stores a title but never draws it.
  if (family !== 'railroad' && family !== 'eventmodeling') add('getDiagramTitle', db.getDiagramTitle)
  switch (family) {
    case 'flowchart':
    case 'state':
    case 'class':
    case 'er':
    case 'mindmap':
    case 'kanban':
    case 'swimlane':
    case 'agentflow':
    case 'usecase': {
      const data = row(db.getData)
      rows(data.nodes).filter(node => !['stateStart', 'stateEnd', 'fork', 'join', 'choice', 'divider'].includes(text(node.shape))).forEach((node, index) => add(`getData.nodes[${index}].label`, family === 'er' && node.alias ? node.alias : node.label, node.labelType === 'markdown'))
      rows(data.edges).forEach((edge, index) => add(`getData.edges[${index}].label`, edge.label, edge.labelType === 'markdown'))
      if (!Array.isArray(data.nodes)) return undefined
      break
    }
    case 'sequence':
      fields('getActors', pairs(db.getActors), 'description')
      fields('getMessages', rows(db.getMessages).filter(message => typeof message.from === 'string' && typeof message.to === 'string' && message.type !== 2), 'message')
      break
    case 'timeline':
    case 'journey':
    case 'gantt':
      add('getSections', db.getSections)
      fields('getTasks', rows(db.getTasks), 'task', 'events', 'people')
      break
    case 'architecture':
      fields('getServices', rows(db.getServices), 'title')
      fields('getGroups', rows(db.getGroups), 'title')
      fields('getEdges', rows(db.getEdges), 'title')
      break
    case 'xychart': {
      const chart = row(db.getXYChartData)
      for (const name of ['xAxis', 'yAxis']) {
        const axis = row(chart[name])
        add(`getXYChartData.${name}.title`, axis.title)
        add(`getXYChartData.${name}.categories`, axis.categories)
      }
      fields('getXYChartData.plots', rows(chart.plots), 'title', 'pointLabels')
      break
    }
    case 'pie':
      list(db.getSections).forEach((section, index) => add(`getSections[${index}][0]`, list(section)[0]))
      break
    case 'quadrant': {
      const data = row(db.getQuadrantData)
      fields('getQuadrantData.axisLabels', rows(data.axisLabels), 'text')
      rows(data.quadrants).forEach((item, index) => add(`getQuadrantData.quadrants[${index}].text`, row(item.text).text))
      rows(data.points).forEach((item, index) => add(`getQuadrantData.points[${index}].text`, row(item.text).text))
      break
    }
    case 'gitgraph':
      fields('getBranchesAsObjArray', rows(db.getBranchesAsObjArray), 'name')
      rows(db.getCommitsArray).forEach((commit, index) => {
        // The reference marks generated commits; their random id is not an
        // authored label. A custom id or explicit tag is stable evidence.
        if (commit.customId === true || !/^\d+-[0-9a-f]{7}$/.test(text(commit.id))) add(`getCommitsArray[${index}].id`, commit.id)
        add(`getCommitsArray[${index}].tags`, commit.tags)
      })
      break
    case 'radar':
      fields('getAxes', rows(db.getAxes), 'label')
      fields('getCurves', rows(db.getCurves), 'label')
      break
    case 'sankey':
      fields('getGraph.nodes', rows(row(db.getGraph).nodes), 'id')
      break
    case 'c4': {
      add('getTitle', db.getTitle)
      for (const [name, values] of [['getC4ShapeArray', rows(db.getC4ShapeArray)], ['getBoundaries', rows(db.getBoundaries)], ['getRels', rows(db.getRels)]] as const) {
        values.filter(value => !(value.alias === 'global' && row(value.label).text === 'global')).forEach((item, index) => {
          for (const field of ['label', 'techn', 'descr']) add(`${name}[${index}].${field}.text`, row(item[field]).text)
        })
      }
      if (!Array.isArray(db.getC4ShapeArray)) return undefined
      break
    }
    case 'packet':
      list(db.getPacket).forEach((word, index) => fields(`getPacket[${index}]`, rows(word), 'label'))
      break
    case 'requirement':
      // Requirement's pinned renderer always renders these fields as Markdown.
      for (const [name, values] of [['getRequirements', pairs(db.getRequirements)], ['getElements', pairs(db.getElements)]] as const)
        values.forEach((value, index) => { for (const key of name === 'getRequirements' ? ['name', 'text'] : ['name']) add(`${name}[${index}].${key}`, value[key], true) })
      fields('getRelationships', rows(db.getRelationships), 'type')
      break
    case 'treemap': tree('getRoot', db.getRoot, 'name'); break
    case 'ishikawa': tree('getRoot', db.getRoot, 'text'); break
    case 'block':
      fields('getBlocksFlat', rows(db.getBlocksFlat).filter(node => node.type !== 'space' && node.type !== 'composite'), 'label')
      fields('getEdges', rows(db.getEdges), 'label')
      break
    case 'venn':
      // A single set without a display label is drawn with its own name.
      rows(db.getSubsetData).forEach((subset, index) => add(`getSubsetData[${index}].label`, subset.label ?? (list(subset.sets).length === 1 ? list(subset.sets)[0] : undefined)))
      fields('getTextData', rows(db.getTextData), 'label')
      break
    case 'treeview':
      // The root is the implicit container, not an authored entry.
      list(row(db.getRoot).children).forEach((child, index) => tree(`getRoot.children[${index}]`, child, 'name'))
      break
    case 'wardley': {
      const data = row(db.getWardleyData)
      fields('getWardleyData.nodes', rows(data.nodes), 'label')
      fields('getWardleyData.notes', rows(data.notes), 'text')
      fields('getWardleyData.annotations', rows(data.annotations), 'text')
      break
    }
    case 'cynefin':
      pairs(db.getDomains).forEach((domain, index) => fields(`getDomains[${index}].items`, rows(domain.items), 'label'))
      fields('getTransitions', rows(db.getTransitions), 'label')
      break
    case 'railroad': {
      const visit = (path: string, value: unknown): void => {
        const item = row(value)
        if (item.type === 'terminal') add(`${path}.value`, item.value)
        if (item.type === 'nonterminal') add(`${path}.name`, item.name)
        for (const key of ['element', 'elements', 'alternatives']) {
          const child = item[key]
          if (Array.isArray(child)) child.forEach((part, index) => visit(`${path}.${key}[${index}]`, part))
          else if (child) visit(`${path}.${key}`, child)
        }
      }
      rows(db.getRules).forEach((rule, index) => {
        add(`getRules[${index}].name`, rule.name)
        visit(`getRules[${index}].definition`, rule.definition)
      })
      break
    }
    case 'eventmodeling': {
      const ast = row(db.eventModelAst)
      if (!Array.isArray(ast.frames)) return undefined
      rows(ast.frames).forEach((frame, index) => {
        const parts = text(frame.entityIdentifier).split('.')
        // The pinned renderer treats exactly two components as namespace/name;
        // three or more remain one visible identifier rather than losing prefixes.
        add(`eventModelAst.frames[${index}].entityIdentifier`, parts.length === 2 ? parts[1] : frame.entityIdentifier)
        if (parts.length === 2) add(`eventModelAst.frames[${index}].namespace`, parts[0])
      })
      break
    }
    default: return undefined
  }
  return out
}

/** Keep raw values in the report; compare display whitespace separately.
 * This independently expands the upstream entity markers, rather than using
 * Agentic's display conversion as its own expected result. */
export function censusDisplayText(value: string): string {
  return decodeHTML(value.replace(/ﬂ°°(\d+)¶ß/g, '&#$1;').replace(/ﬂ°([^¶]+)¶ß/g, '&$1;').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/?(?:b|i|u|s|strong|em|span)(?:\s[^>]*)?>/gi, '').replace(/\\[nt]/g, ' ')).replace(/\s+/g, ' ').trim()
}
