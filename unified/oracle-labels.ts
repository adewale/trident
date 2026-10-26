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

export interface ReferenceLabel { path: string; text: string }

/** Read authored label fields from independent DB getters. No Agentic parser,
 * renderer, label helper or harvested local expectation participates here. */
export function referenceLabels(family: string, reply: MermaidSnapshot): ReferenceLabel[] | undefined {
  if (!reply.accepted || !reply.snapshot) return undefined
  const db = reply.snapshot.data
  const out: ReferenceLabel[] = []
  const add = (path: string, value: unknown): void => {
    if (typeof value === 'string' && value.trim()) out.push({ path, text: value })
    else if (Array.isArray(value)) value.forEach((part, index) => add(`${path}[${index}]`, part))
  }
  const fields = (path: string, values: Row[], ...keys: string[]): void => {
    values.forEach((value, index) => keys.forEach(key => add(`${path}[${index}].${key}`, value[key])))
  }
  const tree = (path: string, value: unknown, key: string): void => {
    const item = row(value)
    add(`${path}.${key}`, item[key])
    list(item.children).forEach((child, index) => tree(`${path}.children[${index}]`, child, key))
  }
  add('getDiagramTitle', db.getDiagramTitle)
  switch (family) {
    case 'flowchart':
    case 'state':
    case 'class':
    case 'er':
    case 'mindmap':
    case 'kanban': {
      const data = row(db.getData)
      rows(data.nodes).filter(node => !['stateStart', 'stateEnd', 'fork', 'join', 'choice', 'divider'].includes(text(node.shape))).forEach((node, index) => add(`getData.nodes[${index}].label`, family === 'er' && node.alias ? node.alias : node.label))
      fields('getData.edges', rows(data.edges), 'label')
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
      fields('getRequirements', pairs(db.getRequirements), 'name', 'text')
      fields('getElements', pairs(db.getElements), 'name')
      fields('getRelationships', rows(db.getRelationships), 'type')
      break
    case 'treemap': tree('getRoot', db.getRoot, 'name'); break
    case 'ishikawa': tree('getRoot', db.getRoot, 'text'); break
    case 'block':
      fields('getBlocksFlat', rows(db.getBlocksFlat).filter(node => node.type !== 'space' && node.type !== 'composite'), 'label')
      fields('getEdges', rows(db.getEdges), 'label')
      break
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
