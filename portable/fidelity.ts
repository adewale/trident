import { SaxesParser } from 'saxes'
import type { PortableCase, PortableEdge } from './cohorts.ts'

/** Qualification identity is separate from the unchanged SVG timing protocol. */
export const PORTABLE_QUALIFICATION_OBSERVER = 'portable-owned-topology-v2-agentic-class-er'

export interface FidelityCheck {
  name: string
  status: 'passed' | 'failed' | 'unmeasured'
  expected: unknown
  actual: unknown
  scope: string
}
export interface PortableOutput {
  svg?: unknown
  model?: unknown
  modelError?: unknown
  error?: unknown
  adapter?: string
}
export interface PortableQualification {
  observer?: string
  accepted: boolean
  passed: boolean
  semanticComplete: boolean
  evidence?: { outputAdmission: 'passed' | 'failed'; nativeModel: 'passed' | 'failed' | 'unmeasured'; paintedMeaning: 'passed' | 'failed' | 'unmeasured' }
  checks: FidelityCheck[]
  unmeasuredScopes: string[]
  scope: string
}
interface Element {
  tag: string
  uri: string
  attributes: Record<string, string>
  children: Element[]
  text: string
  parent?: Element
}
interface Bounds {
  x: number
  y: number
  width: number
  height: number
}
interface Point {
  x: number
  y: number
}
interface NativeTopology {
  nodes: string[]
  edges: (PortableEdge & { svgId?: string })[]
  groups?: { id: string; members: string[] }[]
  labels?: Record<string, string>
}
const namespace = 'http://www.w3.org/2000/svg'
const normalizedText = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').trim()
const ordered = (values: readonly unknown[]) => [...values].map(value => JSON.stringify(value)).sort()
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)
const multiset = (values: readonly unknown[]) => ordered(values)
const pair = (value: PortableEdge) => [value.source, value.target]
const object = (value: unknown): Record<string, any> | undefined => (value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : undefined)
const entries = (value: unknown): [string, any][] => {
  const record = object(value)
  return value instanceof Map ? [...value.entries()] : record ? Object.entries(record) : []
}
const array = (value: unknown): any[] => (Array.isArray(value) ? value : [])

function parseSvg(svg: string): Element {
  let root: Element | undefined, current: Element | undefined, problem: Error | undefined
  const parser = new SaxesParser({ xmlns: true })
  parser.on('error', error => {
    problem ??= error
  })
  parser.on('opentag', tag => {
    const element: Element = { tag: tag.local, uri: tag.uri, attributes: Object.fromEntries(Object.values(tag.attributes).map(attribute => [attribute.name, attribute.value])), children: [], text: '', ...(current ? { parent: current } : {}) }
    if (!root) root = element
    current?.children.push(element)
    current = element
  })
  parser.on('text', text => {
    if (current) current.text += text
  })
  parser.on('cdata', text => {
    if (current) current.text += text
  })
  parser.on('closetag', () => {
    current = current?.parent
  })
  parser.write(svg).close()
  if (problem) throw problem
  if (!root || root.tag !== 'svg' || root.uri !== namespace) throw Error('Output is not a namespaced SVG root')
  return root
}
const all = (element: Element): Element[] => [element, ...element.children.flatMap(all)]
const hasClass = (element: Element, value: string) => element.attributes.class?.split(/\s+/).includes(value) ?? false
function visible(element: Element, definitions = false): boolean {
  for (let current: Element | undefined = element; current; current = current.parent) {
    const attributes = current.attributes,
      style = attributes.style ?? ''
    if (
      ((!definitions && current.tag === 'defs') || ['metadata', 'style', 'script', 'title', 'desc'].includes(current.tag)) ||
      attributes.display === 'none' ||
      ['hidden', 'collapse'].includes(attributes.visibility ?? '') ||
      attributes.opacity === '0' ||
      /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|opacity\s*:\s*0(?:[;\s]|$)|font-size\s*:\s*0(?:px)?(?:[;\s]|$))/i.test(style)
    )
      return false
  }
  return true
}
function renderedText(element: Element): boolean {
  for (let current: Element | undefined = element; current; current = current.parent) {
    if (current.uri === namespace && ['text', 'tspan', 'textPath'].includes(current.tag)) return true
    if (element.uri === 'http://www.w3.org/1999/xhtml' && current.uri === namespace && current.tag === 'foreignObject') return true
  }
  return false
}
const textIn = (element: Element) =>
  normalizedText(
    all(element)
      .filter(item => visible(item) && renderedText(item))
      .map(item => item.text)
      .join(' '),
  )
const finiteLength = (value: string | undefined): number | undefined => (value !== undefined && /^[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?(?:px)?$/i.test(value.trim()) && Number.isFinite(Number.parseFloat(value)) ? Number.parseFloat(value) : undefined)
/** Bounded SVG number-list grammar; unsupported syntax is not geometry evidence. */
function numberList(data: string | undefined): number[] | undefined {
  if (data === undefined) return undefined
  const tokens = data.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '').split(/[ \t\r\n]*,[ \t\r\n]*|[ \t\r\n]+/)
  if (!tokens.every(token => /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(token))) return undefined
  const values = tokens.map(Number)
  return values.every(Number.isFinite) ? values : undefined
}
function canvas(root: Element): boolean {
  const box = numberList(root.attributes.viewBox)
  if (box?.length === 4 && box.every(Number.isFinite) && box[2]! > 0 && box[3]! > 0) return true
  return (finiteLength(root.attributes.width) ?? 0) > 0 && (finiteLength(root.attributes.height) ?? 0) > 0
}
function translation(element: Element): Point | undefined {
  const point = { x: 0, y: 0 }
  for (let current: Element | undefined = element; current; current = current.parent) {
    const transform = current.attributes.transform
    if (!transform) continue
    const match = /^translate\(([^()]*)\)$/.exec(transform), values = match ? numberList(match[1]) : undefined
    if (!values || ![1, 2].includes(values.length)) return undefined
    point.x += values[0]!
    point.y += values[1] ?? 0
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return undefined
  }
  return point
}
function shapeBounds(owner: Element): Bounds | undefined {
  const shape = owner.children.find(child => child.uri === namespace && visible(child) && ['rect', 'circle', 'ellipse', 'polygon'].includes(child.tag))
  if (!shape) return undefined
  const position = translation(shape)
  if (!position) return undefined
  const a = shape.attributes,
    n = (key: string, fallback = 0) => finiteLength(a[key]) ?? fallback
  let box: Bounds
  if (shape.tag === 'rect') box = { x: n('x'), y: n('y'), width: n('width'), height: n('height') }
  else if (shape.tag === 'circle' || shape.tag === 'ellipse') {
    const rx = n(shape.tag === 'circle' ? 'r' : 'rx'),
      ry = n(shape.tag === 'circle' ? 'r' : 'ry')
    box = { x: n('cx') - rx, y: n('cy') - ry, width: 2 * rx, height: 2 * ry }
  } else {
    const values = numberList(a.points)
    if (!values || values.length < 6 || values.length % 2) return undefined
    const xs = values.filter((_value, index) => index % 2 === 0),
      ys = values.filter((_value, index) => index % 2 === 1)
    box = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
  }
  const projected = { ...box, x: box.x + position.x, y: box.y + position.y }
  return projected.width > 0 && projected.height > 0 && [...Object.values(projected), projected.x + projected.width, projected.y + projected.height].every(Number.isFinite) ? projected : undefined
}
/** Every character must belong to a command, finite-number token or SVG
 * separator. A comma can only separate operands, never commands or empty values. */
function pathTokens(data: string | undefined): string[] | undefined {
  if (!data) return undefined
  const tokens: string[] = [],
    pattern = /[a-zA-Z]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/gi
  let end = 0
  for (const match of data.matchAll(pattern)) {
    const gap = data.slice(end, match.index), token = match[0], previous = tokens.at(-1)
    if (!/^[ \t\r\n]*(?:,[ \t\r\n]*)?$/.test(gap)) return undefined
    if (gap.includes(',') && (!previous || /^[a-z]$/i.test(previous) || /^[a-z]$/i.test(token))) return undefined
    tokens.push(token)
    end = match.index + token.length
  }
  return tokens.length && /^[ \t\r\n]*$/.test(data.slice(end)) ? tokens : undefined
}

/** Endpoint projection only. Curve interiors and crossings need a separate oracle. */
function pathEndpoints(path: Element): { start: Point; end: Point; beforeEnd?: Point } | undefined {
  const tokens = pathTokens(path.attributes.d)
  const shift = translation(path)
  if (!tokens?.length || !shift) return undefined
  let cursor = 0,
    command = '',
    current = { x: 0, y: 0 },
    start: Point | undefined,
    subpath = { x: 0, y: 0 },
    hasSegment = false, beforeEnd: Point | undefined
  const arity: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 }
  while (cursor < tokens.length) {
    if (/^[a-z]$/i.test(tokens[cursor]!)) command = tokens[cursor++]!
    const upper = command.toUpperCase(),
      relative = command !== upper
    if (!start && upper !== 'M') return undefined
    if (upper === 'Z') {
      current = { ...subpath }
      beforeEnd = undefined
      command = ''
      continue
    }
    const count = arity[upper]
    if (!count || cursor + count > tokens.length) return undefined
    const operands = tokens.slice(cursor, cursor + count), values = operands.map(Number)
    if (!values.every(Number.isFinite)) return undefined
    if (upper === 'A' && (values[0]! < 0 || values[1]! < 0 || !['0', '1'].includes(operands[3]!) || !['0', '1'].includes(operands[4]!))) return undefined
    cursor += count
    const previous = { ...current },
      origin = relative ? current : { x: 0, y: 0 }
    if (upper === 'H') current = { x: origin.x + values[0]!, y: current.y }
    else if (upper === 'V') current = { x: current.x, y: origin.y + values[0]! }
    else current = { x: origin.x + values[count - 2]!, y: origin.y + values[count - 1]! }
    if (!Number.isFinite(current.x) || !Number.isFinite(current.y)) return undefined
    if (upper === 'M') {
      // A second move may continue at the previous endpoint, but cannot make
      // disconnected subpaths look like one connecting authored relation.
      if (start && (current.x !== previous.x || current.y !== previous.y)) return undefined
      start ??= { ...current }
      subpath = { ...current }
      command = relative ? 'l' : 'L'
    } else {
      hasSegment ||= current.x !== previous.x || current.y !== previous.y || (['C', 'S', 'Q'].includes(upper) && values.slice(0, -2).some((value, index) => value + (index % 2 ? origin.y : origin.x) !== (index % 2 ? previous.y : previous.x)))
      beforeEnd = ['C', 'S', 'Q'].includes(upper) ? { x: origin.x + values[count - 4]!, y: origin.y + values[count - 3]! } : ['L', 'H', 'V'].includes(upper) ? previous : undefined
    }
  }
  if (!start || !hasSegment) return undefined
  const projected = { start: { x: start.x + shift.x, y: start.y + shift.y }, end: { x: current.x + shift.x, y: current.y + shift.y } }
  return [...Object.values(projected.start), ...Object.values(projected.end)].every(Number.isFinite) ? { ...projected, ...(beforeEnd ? { beforeEnd: { x: beforeEnd.x + shift.x, y: beforeEnd.y + shift.y } } : {}) } : undefined
}

/** Pele ER's two cardinality bars are disconnected glyph strokes. They must
 * never authorize a disconnected relation route. This reviewed profile only
 * witnesses visible finite marker ink; exact cardinality meaning is unmeasured. */
function erMarkerPoints(path: Element): Point[] | undefined {
  if (path.tag === 'circle') {
    const shift = translation(path), radius = finiteLength(path.attributes.r), x = finiteLength(path.attributes.cx ?? '0'), y = finiteLength(path.attributes.cy ?? '0')
    if (!shift || radius === undefined || radius <= 0 || radius > 12 || x === undefined || y === undefined) return undefined
    const points = [{ x: x - radius, y }, { x: x + radius, y }, { x, y: y - radius }, { x, y: y + radius }].map(point => ({ x: point.x + shift.x, y: point.y + shift.y }))
    return points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)) ? points : undefined
  }
  if (path.tag !== 'path') return undefined
  const connected = pathEndpoints(path)
  if (connected) return [connected.start, connected.end]
  const tokens = pathTokens(path.attributes.d), shift = translation(path)
  if (!tokens || !shift || tokens.length !== 12 || tokens[0] !== 'M' || tokens[3] !== 'L' || tokens[6] !== 'M' || tokens[9] !== 'L') return undefined
  const values = [tokens[1], tokens[2], tokens[4], tokens[5], tokens[7], tokens[8], tokens[10], tokens[11]].map(Number)
  if (!values.every(Number.isFinite)) return undefined
  const [ax, ay, bx, by, cx, cy, dx, dy] = values as [number, number, number, number, number, number, number, number]
  const first = { x: bx - ax, y: by - ay }, second = { x: dx - cx, y: dy - cy }, separation = { x: cx - ax, y: cy - ay }
  const length = Math.hypot(first.x, first.y), spacing = Math.hypot(separation.x, separation.y)
  if (length < 1 || length > 16 || spacing < 1 || spacing > 12 || Math.abs(first.x - second.x) > 1e-6 || Math.abs(first.y - second.y) > 1e-6 || Math.abs(first.x * separation.x + first.y * separation.y) > 1e-6) return undefined
  const points = [{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }, { x: dx, y: dy }].map(point => ({ x: point.x + shift.x, y: point.y + shift.y }))
  return points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)) ? points : undefined
}
/** The reviewed Pele arrow head is a filled three-point path, with its tip first. */
interface Triangle { tip: Point; base: Point; corners: [Point, Point] }
function markerTriangle(path: Element): Triangle | undefined {
  const values = pathTokens(path.attributes.d),
    shift = translation(path)
  if (!values || !shift || values.length !== 10 || values[0] !== 'M' || values[3] !== 'L' || values[6] !== 'L' || values[9]!.toUpperCase() !== 'Z') return undefined
  const [x, y, ax, ay, bx, by] = [values[1], values[2], values[4], values[5], values[7], values[8]].map(Number)
  const triangle: Triangle = { tip: { x: x! + shift.x, y: y! + shift.y }, base: { x: (ax! + bx!) / 2 + shift.x, y: (ay! + by!) / 2 + shift.y }, corners: [{ x: ax! + shift.x, y: ay! + shift.y }, { x: bx! + shift.x, y: by! + shift.y }] },
    [a, b] = triangle.corners, area = (a.x - triangle.tip.x) * (b.y - triangle.tip.y) - (a.y - triangle.tip.y) * (b.x - triangle.tip.x)
  if (![area, ...[triangle.tip, triangle.base, a, b].flatMap(Object.values), triangle.tip.x - triangle.base.x, triangle.tip.y - triangle.base.y].every(Number.isFinite) || Math.abs(area) < 1e-6) return undefined
  return triangle
}
function markerAttached(marker: Triangle, endpoint: Point): boolean {
  const vertices = [marker.tip, ...marker.corners], sides = vertices.map((a, index) => {
    const b = vertices[(index + 1) % 3]!, dx = b.x - a.x, dy = b.y - a.y,
      fraction = Math.max(0, Math.min(1, ((endpoint.x - a.x) * dx + (endpoint.y - a.y) * dy) / (dx * dx + dy * dy)))
    return { cross: dx * (endpoint.y - a.y) - dy * (endpoint.x - a.x), distance: Math.hypot(endpoint.x - a.x - fraction * dx, endpoint.y - a.y - fraction * dy) }
  })
  // One pixel accounts for serialized coordinate rounding and stem stroke.
  return sides.every(side => Number.isFinite(side.cross) && Number.isFinite(side.distance)) && (sides.every(side => side.cross >= 0) || sides.every(side => side.cross <= 0) || sides.some(side => side.distance <= 1))
}
function arrowPointsInto(marker: Triangle, box: Bounds, endpoint: Point): boolean {
  const direction = { x: marker.tip.x - marker.base.x, y: marker.tip.y - marker.base.y },
    toward = { x: box.x + box.width / 2 - marker.tip.x, y: box.y + box.height / 2 - marker.tip.y },
    alignment = direction.x * toward.x + direction.y * toward.y
  if (!Number.isFinite(alignment) || !markerAttached(marker, endpoint) || distance(marker.tip, box) > 12 || alignment <= 0) return false
  let near = 0, far = Infinity
  for (const axis of ['x', 'y'] as const) {
    const minimum = box[axis], maximum = minimum + (axis === 'x' ? box.width : box.height)
    if (direction[axis] === 0) {
      if (marker.tip[axis] < minimum || marker.tip[axis] > maximum) return false
    } else {
      const a = (minimum - marker.tip[axis]) / direction[axis], b = (maximum - marker.tip[axis]) / direction[axis]
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false
      near = Math.max(near, Math.min(a, b))
      far = Math.min(far, Math.max(a, b))
    }
  }
  return far >= near
}
function distance(point: Point, box: Bounds): number {
  const dx = Math.max(box.x - point.x, 0, point.x - box.x - box.width),
    dy = Math.max(box.y - point.y, 0, point.y - box.y - box.height)
  return dx || dy ? Math.hypot(dx, dy) : Math.min(point.x - box.x, box.x + box.width - point.x, point.y - box.y, box.y + box.height - point.y)
}
function contained(inner: Bounds, outer: Bounds) {
  return inner.x >= outer.x - 1 && inner.y >= outer.y - 1 && inner.x + inner.width <= outer.x + outer.width + 1 && inner.y + inner.height <= outer.y + outer.height + 1
}
function nativeTopology(model: Record<string, any>): NativeTopology | undefined {
  const links = (items: any[], from: string, to: string) => items.map(item => ({ source: String(item[from]), target: String(item[to]), ...(typeof item.id === 'string' ? { svgId: item.id } : {}) }))
  switch (model.type) {
    case 'flowchart':
      return { nodes: entries(model.nodes).map(([key]) => key), edges: links(array(model.edges), 'start', 'end'), labels: Object.fromEntries(entries(model.nodes).map(([key, node]) => [key, node.text])), groups: array(model.subgraphs).map(group => ({ id: group.id, members: group.nodes })) }
    case 'sequence':
      return {
        nodes: entries(model.actors).map(([key]) => key),
        labels: Object.fromEntries(entries(model.actors).map(([key, actor]) => [key, actor.description ?? actor.name ?? key])),
        edges: links(
          array(model.messages).filter(item => item.from !== undefined && item.to !== undefined),
          'from',
          'to',
        ),
      }
    case 'class':
      return { nodes: entries(model.classes).map(([key]) => key), edges: links(array(model.relations), 'id1', 'id2'), labels: Object.fromEntries(entries(model.classes).map(([key, item]) => [key, item.label ?? key])) }
    case 'state':
      return { nodes: entries(model.states).map(([key]) => key), edges: links(array(model.relations), 'id1', 'id2'), labels: Object.fromEntries(entries(model.states).map(([key, item]) => [key, array(item.descriptions).join('\n') || key])) }
    case 'er': {
      const names = new Map(entries(model.entities).map(([key, entity]) => [entity.id, key]))
      return {
        nodes: entries(model.entities).map(([key]) => key),
        edges: array(model.relationships).map(item => ({ source: names.get(item.entityA) ?? String(item.entityA), target: names.get(item.entityB) ?? String(item.entityB) })),
        labels: Object.fromEntries(entries(model.entities).map(([key, item]) => [key, item.alias || item.label || key])),
      }
    }
    case 'architecture':
      return {
        nodes: entries(model.nodes).map(([key]) => key),
        edges: links(array(model.edges), 'lhsId', 'rhsId'),
        groups: entries(model.groups).map(([id]) => ({
          id,
          members: entries(model.nodes)
            .filter(([_key, node]) => node.in === id)
            .map(([key]) => key),
        })),
      }
    case 'requirement':
      return { nodes: [...entries(model.requirements), ...entries(model.elements)].map(([key]) => key), edges: links(array(model.relations), 'src', 'dst') }
    case 'sankey':
      return { nodes: array(model.nodes).map(node => node.id), edges: array(model.links).map(item => ({ source: item.source.id, target: item.target.id })) }
    case 'c4':
      return { nodes: array(model.shapes).map(item => item.alias), edges: links(array(model.rels), 'from', 'to') }
    default:
      return undefined
  }
}

/** Agentic's root export returns a Result containing a typed body, not a
 * Mermaid/Pele database. Read actual public fields without inventing getters. */
function agenticTopology(result: Record<string, any> | undefined, family: string): NativeTopology | undefined {
  const value = object(result?.value), body = object(value?.body)
  if (result?.ok !== true || value?.kind !== family || body?.kind !== family) return undefined
  const nodes = family === 'class' ? body.classes : body.entities
  if (!Array.isArray(nodes) || !Array.isArray(body.relations)
    || !nodes.every(node => typeof node?.id === 'string' && node.id.length > 0)
    || !body.relations.every((rel: any) => typeof rel?.from === 'string' && typeof rel?.to === 'string')) return undefined
  return { nodes: nodes.map(node => node.id), edges: body.relations.map((rel: any) => ({ source: rel.from, target: rel.to })), labels: Object.fromEntries(nodes.map(node => [node.id, node.label ?? node.id])) }
}

function presentation(element: Element, name: string): string | undefined {
  for (let current: Element | undefined = element; current; current = current.parent) {
    const inline = (current.attributes.style ?? '').split(';').map(item => item.split(':').map(part => part.trim())).filter(([key]) => key === name).at(-1)?.[1]
    const value = inline ?? current.attributes[name]
    if (value !== undefined) return value
  }
  return undefined
}
/** Only finite presentation-attribute paint is observed here. Computed CSS,
 * clipping, filters and host styles require the separate browser paint lane. */
function visiblePaint(element: Element, stroke: boolean, definitions = false): boolean | undefined {
  for (let current: Element | undefined = element; current; current = current.parent) {
    if (['clip-path', 'mask', 'filter'].some(key => current!.attributes[key] && current!.attributes[key] !== 'none') || /(?:^|;)\s*(?:transform|clip-path|mask|filter)\s*:/i.test(current.attributes.style ?? '')) return undefined
    const opacity = finiteLength(presentation(current, 'opacity') ?? '1')
    if (opacity === undefined) return undefined
    if (opacity <= 0) return false
  }
  const opacity = finiteLength(presentation(element, stroke ? 'stroke-opacity' : 'fill-opacity') ?? '1')
  if (opacity === undefined) return undefined
  if (opacity <= 0 || !visible(element, definitions)) return false
  if (stroke) {
    const width = finiteLength(presentation(element, 'stroke-width') ?? '1')
    if (width === undefined) return undefined
    if (width <= 0) return false
    const dash = presentation(element, 'stroke-dasharray')
    if (dash && dash !== 'none') {
      const values = numberList(dash)
      if (!values || values.some(value => value < 0)) return undefined
      const repeated = values.length % 2 ? [...values, ...values] : values
      if (repeated.some(value => value > 0) && !repeated.some((value, index) => index % 2 === 0 && value > 0)) return false
    }
  }
  const color = presentation(element, stroke ? 'stroke' : 'fill') ?? (stroke ? 'none' : '#000')
  if (color === 'none' || color === 'transparent') return false
  if (/^#[\da-f]{3}(?:[\da-f](?:[\da-f]{2}(?:[\da-f]{2})?)?)?$/i.test(color)) {
    return !((color.length === 5 && color.at(-1) === '0') || (color.length === 9 && color.slice(-2) === '00'))
  }
  return undefined
}
function routeEndpoints(element: Element): { start: Point; end: Point; beforeEnd?: Point; afterStart?: Point } | undefined {
  if (element.tag === 'path') return pathEndpoints(element)
  const points = numberList(element.attributes.points), shift = translation(element)
  if (!points || points.length < 4 || points.length % 2 || !shift || !points.slice(2).some((value, index) => value !== points[index]!)) return undefined
  const end = { x: points.at(-2)! + shift.x, y: points.at(-1)! + shift.y }
  let beforeEnd: Point | undefined
  for (let index = points.length - 4; index >= 0; index -= 2) if (points[index] !== points.at(-2) || points[index + 1] !== points.at(-1)) { beforeEnd = { x: points[index]! + shift.x, y: points[index + 1]! + shift.y }; break }
  let afterStart: Point | undefined
  for (let index = 2; index < points.length; index += 2) if (points[index] !== points[0] || points[index + 1] !== points[1]) { afterStart = { x: points[index]! + shift.x, y: points[index + 1]! + shift.y }; break }
  if (beforeEnd && !Object.values(beforeEnd).every(Number.isFinite) || afterStart && !Object.values(afterStart).every(Number.isFinite)) return undefined
  const result = { start: { x: points[0]! + shift.x, y: points[1]! + shift.y }, end, beforeEnd, afterStart }
  return [...Object.values(result.start), ...Object.values(result.end)].every(Number.isFinite) ? result : undefined
}
/** Reviewed open association/dependency arrow: actual referenced V-shaped ink,
 * aligned by SVG's automatic end orientation and anchored at the written tip. */
function agenticArrow(edge: Element, elements: Element[]): boolean | undefined {
  const reference = /^url\(#([^\s()]+)\)$/.exec(edge.attributes['marker-end'] ?? '')
  if (!reference) return false
  const resources = elements.filter(item => item.uri === namespace && item.tag === 'marker' && item.attributes.id === reference[1])
  if (resources.length !== 1) return false
  const marker = resources[0]!, geometry = marker.children.filter(item => item.uri === namespace && !['title', 'desc'].includes(item.tag))
  if (!['auto', 'auto-start-reverse'].includes(marker.attributes.orient ?? '') || marker.attributes.viewBox || marker.attributes.overflow !== 'visible' || marker.attributes.transform || ![undefined, 'strokeWidth', 'userSpaceOnUse'].includes(marker.attributes.markerUnits) || geometry.length !== 1 || geometry[0]!.tag !== 'polyline' || geometry[0]!.attributes.transform) return undefined
  const shape = geometry[0]!, points = numberList(shape.attributes.points), paint = visiblePaint(shape, true, true)
  if (paint !== true) return paint
  if (presentation(shape, 'fill') !== 'none') return undefined
  if (!points || points.length !== 6) return false
  const [ax, ay, tx, ty, bx, by] = points as [number, number, number, number, number, number]
  return ax === bx && tx > ax && (ay - ty) * (by - ty) < 0 && Math.abs((ay + by) / 2 - ty) < 1e-6
    && finiteLength(marker.attributes.refX) === tx && finiteLength(marker.attributes.refY) === ty
    && (finiteLength(marker.attributes.markerWidth) ?? 0) > 0 && (finiteLength(marker.attributes.markerHeight) ?? 0) > 0
}

type ErMeaning = PortableEdge & { left: string; right: string; dashed: boolean }
/** Independently authored simple ER relation profile. This deliberately does
 * not reinterpret an opaque parse envelope or infer meaning from SVG tags. */
function authoredEr(testCase: PortableCase): ErMeaning[] | undefined {
  const cards: Record<string, string> = { '||': 'one-only', 'o|': 'zero-or-one', '|o': 'zero-or-one', '}|': 'one-or-many', '|{': 'one-or-many', '}o': 'zero-or-many', 'o{': 'zero-or-many' }
  const result: ErMeaning[] = []
  for (const line of testCase.source.split('\n')) {
    const match = /^\s*([A-Za-z_][\w]*)\s+(\|\||o\||\|o|\}\||\|\{|\}o|o\{)(--|\.\.)(\|\||o\||\|o|\}\||\|\{|\}o|o\{)\s+([A-Za-z_][\w]*)\s*:\s*[^\r]*$/.exec(line)
    if (match) result.push({ source: match[1]!, target: match[5]!, left: cards[match[2]!]!, right: cards[match[4]!]!, dashed: match[3] === '..' })
  }
  return same(multiset(result.map(pair)), multiset(testCase.expected.topology!.edges.map(pair))) ? result : undefined
}
const erMeaningKey = (edge: ErMeaning) => JSON.stringify([edge.source, edge.target, edge.left, edge.right, edge.dashed])

/** Match the reviewed tick/fan/circle vocabulary in route-local coordinates.
 * Every primitive is consumed once globally, so overlapping relations cannot
 * borrow one another's cardinality ink. Generated ownership IDs are irrelevant. */
function erGlyph(point: Point, toward: Point, kind: string, candidates: Element[], consumed: Set<Element>): boolean | undefined {
  const length = Math.hypot(toward.x - point.x, toward.y - point.y)
  if (!Number.isFinite(length) || length === 0) return undefined
  const ux = (toward.x - point.x) / length, uy = (toward.y - point.y) / length
  const local = (x: number, y: number): Point => ({ x: point.x + ux * x - uy * y, y: point.y + uy * x + ux * y })
  const segments: [Point, Point][] = [], circles: [Point, number][] = []
  const tick = (at: number) => segments.push([local(at, -6), local(at, 6)])
  if (kind === 'one-only') { tick(4); tick(8) }
  else if (kind === 'zero-or-one') { tick(4); circles.push([local(12, 0), 4]) }
  else if (kind === 'one-or-many' || kind === 'zero-or-many') {
    for (const side of [-7, 0, 7]) segments.push([local(4, side), local(16, 0)])
    if (kind === 'one-or-many') tick(20)
    else circles.push([local(20, 0), 4])
  } else return undefined
  const near = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) < .02
  const read = (shape: Element, names: string[]) => {
    const shift = translation(shape), values = names.map(name => finiteLength(shape.attributes[name]))
    return shift && values.every(value => value !== undefined) ? { shift, values: values as number[] } : undefined
  }
  for (const expected of [...segments.map(segment => ({ segment })), ...circles.map(circle => ({ circle }))]) {
    const matches = candidates.filter(shape => {
      if (consumed.has(shape)) return false
      if ('segment' in expected && shape.tag === 'line') {
        const data = read(shape, ['x1', 'y1', 'x2', 'y2'])
        if (!data) return false
        const [x1, y1, x2, y2] = data.values, a = { x: x1! + data.shift.x, y: y1! + data.shift.y }, b = { x: x2! + data.shift.x, y: y2! + data.shift.y }, [c, d] = expected.segment
        return near(a, c) && near(b, d) || near(a, d) && near(b, c)
      }
      if ('circle' in expected && shape.tag === 'circle') {
        const data = read(shape, ['cx', 'cy', 'r'])
        return !!data && near({ x: data.values[0]! + data.shift.x, y: data.values[1]! + data.shift.y }, expected.circle[0]) && Math.abs(data.values[2]! - expected.circle[1]) < .02
      }
      return false
    })
    const painted = matches.filter(shape => visiblePaint(shape, true) === true)
    if (!painted.length) return matches.some(shape => visiblePaint(shape, true) === undefined) ? undefined : false
    consumed.add(painted[0]!)
  }
  return true
}
function modelPath(model: unknown, path: (string | number | { map: string })[]): unknown {
  let current: any = model
  for (const key of path) {
    if (typeof key === 'object') {
      if (!(current instanceof Map)) return undefined
      current = current.get(key.map)
    } else {
      if (current === null || current === undefined) return undefined
      current = current[key]
    }
  }
  return current
}
const displayValue = (value: unknown): unknown => (typeof value === 'string' ? normalizedText(value) : Array.isArray(value) ? value.map(displayValue) : value)
function leafMembers(group: { id: string; members: string[] }, groups: { id: string; members: string[] }[], seen = new Set<string>()): string[] {
  if (seen.has(group.id)) return []
  seen.add(group.id)
  return [
    ...new Set(
      group.members.flatMap(member => {
        const child = groups.find(item => item.id === member)
        return child ? leafMembers(child, groups, new Set(seen)) : [member]
      }),
    ),
  ].sort()
}

function qualifyPortableUnchecked(testCase: PortableCase, output: PortableOutput): PortableQualification {
  const checks: FidelityCheck[] = [],
    unmeasuredScopes = ['Perceptual legibility, font metrics, text clipping and complete shape/path paint correspondence are not measured.']
  const accepted = output.error === undefined
  const check = (name: string, expected: unknown, actual: unknown, scope: string, available = true) => checks.push({ name, status: !available ? 'unmeasured' : same(expected, actual) ? 'passed' : 'failed', expected, actual: actual === undefined ? null : actual, scope })
  check('acceptance', testCase.expected.accept, accepted, 'Actual public renderer return versus exception; a non-SVG return is still acceptance and fails format separately.')
  if (!testCase.expected.accept || !accepted) return { accepted, passed: checks.every(item => item.status === 'passed'), semanticComplete: false, checks, unmeasuredScopes, scope: 'Public acceptance/rejection only; no positive rendered semantic witness.' }
  let root: Element | undefined
  try {
    if (typeof output.svg !== 'string') throw Error('Public renderer returned no SVG string')
    root = parseSvg(output.svg)
    check('svg-format', true, true, 'Strict XML and SVG root namespace.')
  } catch (error) {
    check('svg-format', 'valid namespaced SVG', String(error), 'Strict XML and SVG root namespace.')
  }
  check('positive-canvas', true, root ? canvas(root) : false, 'Positive finite viewBox or explicit width/height.')
  const nodes = root ? all(root) : [],
    visibleText = root ? textIn(root) : ''
  for (const label of testCase.expected.labels) check('label:' + label, true, visibleText.includes(normalizedText(label)), 'Authored rendered text, excluding hidden/metadata/defs text; computed CSS and clipping remain unmeasured.')
  if (typeof testCase.renderOptions?.fontSize === 'number') {
    const cssOverrides = nodes.some(element => element.tag === 'style' && /(?:^|[;{])\s*font(?:-size)?\s*:/i.test(element.text))
    const fontSize = (element: Element): number | undefined => {
      for (let current: Element | undefined = element; current; current = current.parent) {
        const style = current.attributes.style ?? ''
        const inline = /(?:^|;)\s*font-size\s*:\s*([\d.]+)(?:px)?(?:\s*!important)?\s*(?:;|$)/i.exec(style)?.[1] ?? /(?:^|;)\s*font\s*:\s*(?:normal\s+|bold\s+|italic\s+|[1-9]00\s+)*([\d.]+)px\b/i.exec(style)?.[1]
        const value = inline ?? current.attributes['font-size']
        if (value !== undefined) return /^(?:\d+(?:\.\d+)?)(?:px)?$/.test(value) ? Number.parseFloat(value) : undefined
      }
      return undefined
    }
    for (const label of testCase.expected.labels) {
      const matches = nodes.filter(element => ['text', 'tspan'].includes(element.tag) && visible(element) && textIn(element) === normalizedText(label))
      const sizes = matches.map(fontSize)
      const available = !cssOverrides && matches.length > 0 && sizes.every(size => size !== undefined)
      check('svg-label-font-size:' + label, true, available && sizes.every(size => size === testCase.renderOptions!.fontSize), 'Font size on visible authored SVG labels, including inherited presentation and inline declarations. Stylesheet overrides, relative units, glyph metrics and clipping remain unmeasured.', available)
    }
  }
  const ids = nodes.map(element => element.attributes.id).filter((id): id is string => !!id)
  check('svg-unique-ids', ids.length, new Set(ids).size, 'Document IDs must be unique; repeated data-id values are renderer-specific.')
  const model = object(output.model), agentic = output.adapter === 'agentic' && ['class', 'er'].includes(testCase.family),
    topology = agentic ? agenticTopology(model, testCase.family) : model ? nativeTopology(model) : undefined,
    expected = testCase.expected.topology, erExpected = agentic && testCase.family === 'er' && expected ? authoredEr(testCase) : undefined
  const modelChecks = checks.length
  const outputAdmission = checks.every(item => item.status === 'passed') ? 'passed' as const : 'failed' as const
  if (agentic) check('model-native-result', true, output.modelError === undefined && topology !== undefined, 'Actual parseRegisteredMermaid Result must contain the requested typed Class/ER body and complete identity/endpoint fields. Renderer acceptance is independent of native model availability; preserved/opaque bodies earn no native credit.', output.model !== undefined || output.modelError !== undefined)
  for (const assertion of testCase.expected.model ?? []) {
    const value = modelPath(output.model, assertion.path),
      display = assertion.comparison === 'display-text'
    check(
      'model:' + JSON.stringify(assertion.path),
      display ? displayValue(assertion.value) : assertion.value,
      display ? displayValue(value) : value,
      'Authored expected value against separately invoked public parse model; not a claim about painted output.' + (display ? ' Declared display-text comparison normalizes whitespace/NFC.' : ''),
      model !== undefined,
    )
  }
  if (expected) {
    check('model-node-identities', multiset(expected.nodes), multiset(topology?.nodes ?? []), 'Exact authored node identity multiset in public parse model.', topology !== undefined)
    check('model-edge-endpoints-and-multiplicity', multiset(expected.edges.map(pair)), multiset((topology?.edges ?? []).map(pair)), 'Directed endpoint pair multiset; parallel and reciprocal edges stay distinct.', topology !== undefined)
    if (agentic && testCase.family === 'er') {
      const relations = object(object(model?.value)?.body)?.relations
      const meaning = Array.isArray(relations) ? relations.map((rel: any) => erMeaningKey({ source: rel.from, target: rel.to, left: rel.leftCard, right: rel.rightCard, dashed: rel.dashed })) : []
      check('model-er-cardinality-and-identifying', multiset(erExpected?.map(erMeaningKey) ?? []), multiset(meaning), 'Independently authored simple ER cardinality and identifying relation multiset against the typed public model.', !!erExpected && !!topology)
    }
    if (model?.type === 'sequence') check('model-message-order', expected.edges.map(pair), (topology?.edges ?? []).map(pair), 'Authored message endpoint order is significant in a sequence diagram.', topology !== undefined)
    for (const [id, label] of Object.entries(expected.nodeLabels ?? {})) check('model-node-label:' + id, label, topology?.labels?.[id], 'Authored label belongs to its authored public-model node identity.', topology?.labels !== undefined)
    for (const group of expected.groups ?? []) {
      const actual = topology?.groups?.find(item => item.id === group.id)
      check('model-group-membership:' + group.id, leafMembers(group, expected.groups ?? []), actual ? leafMembers(actual, topology!.groups!) : null, 'Descendant leaf membership, normalizing nested group representation.', topology?.groups !== undefined)
    }
  }
  const nativeChecks = checks.slice(modelChecks)
  const nativeComplete = nativeChecks.length > 0 && nativeChecks.every(item => item.status === 'passed')
  let paintComplete = false
  if (agentic && expected && root) {
    const paintChecks = checks.length, nodeClass = testCase.family === 'class' ? 'class-node' : 'entity', edgeClass = `${testCase.family}-relationship`
    const drawnNodes = nodes.filter(element => element.uri === namespace && element.tag === 'g' && visible(element) && hasClass(element, nodeClass))
    const drawnEdges = nodes.filter(element => element.uri === namespace && ['path', 'polyline'].includes(element.tag) && visible(element) && hasClass(element, edgeClass))
    const stylesheet = nodes.some(element => element.tag === 'style' && /(?:^|[;{])\s*(?:fill|stroke(?:-width|-opacity)?|opacity|display|visibility|transform|clip-path|mask|filter)\s*:/i.test(element.text))
    check('svg-owned-node-identities', multiset(expected.nodes), multiset(drawnNodes.map(node => node.attributes['data-id'])), 'Visible Agentic Class/ER node owner multiset; labels or metadata alone do not establish identity.')
    const bounds = new Map<string, Bounds | undefined>()
    for (const [index, node] of drawnNodes.entries()) {
      const shape = node.children.find(child => child.uri === namespace && visible(child) && ['rect', 'circle', 'ellipse', 'polygon'].includes(child.tag)), box = shapeBounds(node)
      const fill = shape ? visiblePaint(shape, false) : false, stroke = shape ? visiblePaint(shape, true) : false
      const supported = !stylesheet && (!shape || translation(shape) !== undefined) && (fill === true || stroke === true || fill !== undefined && stroke !== undefined)
      check(`svg-node-owned-ink:${index}`, true, !!box && (fill === true || stroke === true), 'Finite visible owned card geometry under the reviewed presentation-attribute/translation profile; arbitrary CSS and clipping are unmeasured.', supported)
      bounds.set(node.attributes['data-id']!, supported && box && (fill === true || stroke === true) ? box : undefined)
    }
    for (const [id, label] of Object.entries(expected.nodeLabels ?? {})) {
      const owners = drawnNodes.filter(node => node.attributes['data-id'] === id)
      check('svg-owned-node-label:' + id, true, owners.length === 1 && textIn(owners[0]!).includes(normalizedText(label)), 'Independently authored label belongs to its visible authored node owner.')
    }
    const geometryAvailable = bounds.size === expected.nodes.length && [...bounds.values()].every(Boolean)
    const ownersAt = (point: Point) => [...bounds].filter(([, box]) => box && distance(point, box) <= 1).map(([id]) => id)
    check('svg-owned-edge-identities', true, drawnEdges.every(edge => !!edge.attributes['data-id']) && new Set(drawnEdges.map(edge => edge.attributes['data-id'])).size === drawnEdges.length, 'Every visible route has one nonempty unique owner; parallel relations remain distinct without interpreting generated ID spellings.')
    check('svg-owned-edge-count', expected.edges.length, drawnEdges.length, 'Exact visible route count, independently of public model and retained labels.')
    const observed: PortableEdge[] = []
    const erObserved: ErMeaning[] = [], consumedGlyphs = new Set<Element>()
    const glyphs = nodes.filter(element => {
      if (element.uri !== namespace || !['line', 'circle'].includes(element.tag)) return false
      for (let owner: Element | undefined = element; owner; owner = owner.parent) if (owner.tag === 'defs' || hasClass(owner, nodeClass)) return false
      return true
    })
    let erMeasured = !!erExpected && !stylesheet
    let bindingsMeasured = geometryAvailable
    for (const [index, edge] of drawnEdges.entries()) {
      const points = routeEndpoints(edge), paint = visiblePaint(edge, true), supported = !stylesheet && translation(edge) !== undefined && paint !== undefined
      check(`svg-edge-owned-ink:${index}`, true, !!points && paint === true, 'The owned route must contain finite nondegenerate continuous path/polyline ink with a visible stroke; an endpoint tag is not a connecting path.', supported)
      const source = points && geometryAvailable ? ownersAt(points.start) : [], target = points && geometryAvailable ? ownersAt(points.end) : []
      const measurable = supported && !!points && geometryAvailable && source.length <= 1 && target.length <= 1
      if (!measurable) bindingsMeasured = false
      if (source.length === 1 && target.length === 1 && paint === true) observed.push({ source: source[0]!, target: target[0]! })
      check(`svg-edge-attachment:${index}`, true, source.length === 1 && target.length === 1 && source[0] === edge.attributes['data-from'] && target[0] === edge.attributes['data-to'], 'Actual written route endpoints must each identify the corresponding declared owned card within1px. Ambiguous or unsupported geometry earns no correspondence credit.', measurable)
      if (testCase.family === 'class') {
        const body = object(object(model?.value)?.body), profile = Array.isArray(body?.relations) && body.relations.every((rel: any) => ['association', 'dependency'].includes(rel.kind) && rel.markerAt === 'to')
        const arrow = agenticArrow(edge, nodes), box = target.length === 1 ? bounds.get(target[0]!) : undefined, tangent = points?.beforeEnd
        const inward = points && tangent && box ? (points.end.x - tangent.x) * (box.x + box.width / 2 - points.end.x) + (points.end.y - tangent.y) * (box.y + box.height / 2 - points.end.y) > 0 : false
        check(`svg-edge-target-marker:${index}`, true, arrow === true && inward, 'Reviewed directed association/dependency routes need visible referenced open-arrow ink anchored at their end, with automatic orientation pointing into the target card. Other marker profiles remain unmeasured.', profile && arrow !== undefined && measurable && !!tangent)
      } else {
        const classify = (point: Point | undefined, toward: Point | undefined): string | false | undefined => {
          if (!point || !toward) return undefined
          let unknown = false
          const matches: { kind: string; trial: Set<Element> }[] = []
          for (const kind of ['one-only', 'zero-or-one', 'one-or-many', 'zero-or-many']) {
            const trial = new Set(consumedGlyphs), matched = erGlyph(point, toward, kind, glyphs, trial)
            if (matched === true) matches.push({ kind, trial })
            unknown ||= matched === undefined
          }
          if (matches.length > 1) return undefined
          if (matches.length === 1) { for (const item of matches[0]!.trial) consumedGlyphs.add(item); return matches[0]!.kind }
          return unknown ? undefined : false
        }
        const left = classify(points?.start, points?.afterStart), right = classify(points?.end, points?.beforeEnd)
        const dash = presentation(edge, 'stroke-dasharray'), values = dash && dash !== 'none' ? numberList(dash) : []
        const dashed = values && values.every(value => value > 0) ? values.length > 0 : undefined
        const available = measurable && !!erExpected && !stylesheet && left !== undefined && right !== undefined && dashed !== undefined
        check(`svg-er-cardinality-ink:${index}`, true, !!left && !!right, 'Actual endpoint-local tick/fan/circle geometry, with finite visible stroked pieces consumed once globally; generated cardinality IDs and metadata do not establish meaning.', available)
        if (!available) erMeasured = false
        if (typeof left === 'string' && typeof right === 'string' && dashed !== undefined && source.length === 1 && target.length === 1) erObserved.push({ source: source[0]!, target: target[0]!, left, right, dashed })
      }
    }
    check('svg-owned-edge-endpoints-and-multiplicity', multiset(expected.edges.map(pair)), multiset(observed.map(pair)), 'Authored endpoint pair multiset versus independently bound written route geometry; duplicate and reciprocal routes remain significant.', bindingsMeasured)
    if (testCase.family === 'er') {
      check('svg-er-cardinality-and-identifying', multiset(erExpected?.map(erMeaningKey) ?? []), multiset(erObserved.map(erMeaningKey)), 'Independent authored relation meanings versus geometrically classified endpoint glyphs and actual route dash appearance.', erMeasured)
      check('svg-er-cardinality-piece-count', glyphs.length, consumedGlyphs.size, 'The reviewed emitted profile has no missing, extra, hidden or shared endpoint glyph primitives.', erMeasured)
    }
    paintComplete = checks.slice(paintChecks).every(item => item.status === 'passed')
    unmeasuredScopes.push('Agentic Class/ER qualification covers declared node/route identity, optional owned labels, endpoint multiplicity and finite connecting geometry. Class requires the reviewed directed open-arrow profile; simple ER relations require exact tick/fan/circle cardinality and solid/dashed identifying appearance. Full CSS/font/clipping/curve-interior paint, member/attribute content, other Class markers and unsupported ER source/glyph profiles remain unmeasured.')
  } else if (expected && root && hasClass(root, 'pele') && ['flowchart', 'class', 'state', 'er'].includes(model?.type)) {
    const drawnNodes = nodes.filter(element => element.uri === namespace && visible(element) && hasClass(element, 'pele-node'))
    const drawnEdges = nodes.filter(element => element.uri === namespace && visible(element) && hasClass(element, 'pele-edge'))
    const drawnGroups = nodes.filter(element => element.uri === namespace && visible(element) && hasClass(element, 'pele-cluster'))
    const paintChecks = checks.length
    const flowchart = model!.type === 'flowchart'
    check('svg-family-owner', true, model!.type === testCase.family && hasClass(root, 'pele-' + testCase.family), 'The public model and owned SVG root identify the authored diagram family.')
    check('svg-owned-node-identities', multiset(expected.nodes), multiset(drawnNodes.map(element => element.attributes['data-id'])), 'Pele owned node groups; each authored node appears exactly once.')
    for (const [id, label] of Object.entries(expected.nodeLabels ?? {})) {
      const owners = drawnNodes.filter(element => element.attributes['data-id'] === id)
      check('svg-owned-node-label:' + id, true, owners.length === 1 && textIn(owners[0]!).includes(normalizedText(label)), 'Authored label is painted under its authored node owner.')
    }
    const bounds = new Map(drawnNodes.map(element => [element.attributes['data-id']!, shapeBounds(element)]))
    const geometryAvailable = drawnNodes.length === expected.nodes.length && [...bounds.values()].every(Boolean)
    const endpointOwner = (point: Point): string | undefined => {
      const candidates = [...bounds].filter(([_id, box]) => box && distance(point, box) <= 12)
      return candidates.length === 1 ? candidates[0]![0] : undefined
    }
    const observedEdges: PortableEdge[] = []
    let bindingsMeasured = true
    check(
      'svg-owned-edge-identities',
      true,
      drawnEdges.every(owner => !!owner.attributes['data-id']) && new Set(drawnEdges.map(owner => owner.attributes['data-id'])).size === drawnEdges.length,
      'Every drawn relation has a nonempty unique owner identity; duplicate data-id values cannot impersonate distinct parallel relations.',
    )
    for (const [index, owner] of drawnEdges.entries()) {
      const id = owner.attributes['data-id']
      const matches = (topology?.edges ?? []).filter(item => item.svgId === id)
      const ink = owner.children.filter(element => element.uri === namespace && element.tag === 'path' && !hasClass(element, 'pele-marker') && visible(element) && !!element.attributes.d)
      check(`svg-edge-owned-ink:${index}`, true, ink.length > 0, 'An owned edge needs rendered path data; IDs or text sidecars alone do not qualify.')
      const endpoints = ink[0] ? pathEndpoints(ink[0]) : undefined
      const geometricSource = endpoints ? endpointOwner(endpoints.start) : undefined,
        geometricTarget = endpoints ? endpointOwner(endpoints.end) : undefined
      const binding = flowchart ? (matches.length === 1 ? matches[0] : undefined) : geometricSource && geometricTarget ? { source: geometricSource, target: geometricTarget } : undefined
      if (!binding) bindingsMeasured = false
      else observedEdges.push(binding)
      const source = binding ? bounds.get(binding.source) : undefined,
        target = binding ? bounds.get(binding.target) : undefined
      const attachment = endpoints && source && target ? distance(endpoints.start, source) <= 12 && distance(endpoints.end, target) <= 12 : !flowchart && geometryAvailable && endpoints ? false : null
      check(
        `svg-edge-attachment:${index}`,
        true,
        attachment,
        'Connecting path endpoints touch their owned node bounding boxes within12px, allowing marker inset. Class/state/ER endpoints must each identify a unique visible owner. Curve interiors and exact shape boundaries remain unmeasured.',
        !!endpoints && (flowchart ? !!source && !!target : geometryAvailable),
      )
      const markers = owner.children.filter(element => element.uri === namespace && hasClass(element, 'pele-marker') && visible(element))
      if (model!.type === 'er') {
        const projectedMarkers = markers.map(erMarkerPoints),
          ends = projectedMarkers.flatMap(points => points ?? [])
        check(
          `svg-edge-end-markers:${index}`,
          true,
          source && target ? ends.some(point => distance(point, source) <= 12) && ends.some(point => distance(point, target) <= 12) && projectedMarkers.every(points => points?.some(point => Math.min(distance(point, source), distance(point, target)) <= 12)) : null,
          'Visible cardinality ink is attached to both entity ends and each observed marker attaches to an entity. Reviewed glyphs include finite positive-radius circles and two aligned parallel strokes. Relation routes remain continuous. Exact cardinality glyph meaning is not independently asserted by this topology projection.',
          !!source && !!target && projectedMarkers.every(Boolean),
        )
      } else {
        const projectedMarkers = markers.map(marker => marker.tag === 'path' ? markerTriangle(marker) : undefined),
          triangles = projectedMarkers.filter((triangle): triangle is Triangle => !!triangle)
        const classProfile = model!.type !== 'class' || array(model!.relations).every(relation => relation.relation?.type1 === 'none' && relation.relation?.type2 === 3)
        check(
          `svg-edge-target-marker:${index}`,
          true,
          target && endpoints ? triangles.some(triangle => arrowPointsInto(triangle, target, endpoints.end)) : null,
          'The reviewed triangular arrowhead overlaps its stem endpoint within1px, and its forward ray reaches the target box within12px of the tip. Other marker encodings and class relation profiles are unmeasured.',
          !!target && !!endpoints && classProfile && projectedMarkers.every(Boolean),
        )
      }
    }
    check(
      'svg-owned-edge-endpoints-and-multiplicity',
      multiset(expected.edges.map(pair)),
      multiset(observedEdges.map(pair)),
      flowchart ? 'Pele flowchart SVG edge ownership bound to public parse IDs and actual path ink.' : 'Class/state/ER actual path endpoints bind independently to unique owned node bounds; directed pair multiplicity is compared with authored expectations without guessing generated relation IDs.',
      bindingsMeasured,
    )
    check('svg-owned-edge-count', expected.edges.length, drawnEdges.length, 'Exact number of drawn edge owners, independently of model and labels.')
    for (const group of expected.groups ?? []) {
      const owner = drawnGroups.find(element => element.attributes['data-id'] === group.id),
        groupBox = owner ? shapeBounds(owner) : undefined
      const children = group.members.map(id => bounds.get(id) ?? (drawnGroups.find(element => element.attributes['data-id'] === id) ? shapeBounds(drawnGroups.find(element => element.attributes['data-id'] === id)!) : undefined))
      check('svg-group-containment:' + group.id, true, groupBox && children.every(Boolean) ? children.every(child => contained(child!, groupBox)) : null, 'Authored direct members are painted inside their owner cluster bounding box.', !!groupBox && children.every(Boolean))
    }
    paintComplete = checks.slice(paintChecks).every(item => item.status === 'passed')
    unmeasuredScopes.push(
      'Graph checks cover owner identity, declared label ownership, edge count/endpoints, approximate attachment, ordinary directed markers or ER endpoint marker ink, and optional group containment. Crossings, full curve geometry, arbitrary transforms, unasserted class member/ER cardinality meaning and undeclared label-owner assignments remain unmeasured.',
    )
  } else if (expected && root && hasClass(root, 'pele') && model?.type === 'sequence') {
    const paintChecks = checks.length
    const messages = array(model.messages),
      connections = messages.filter(message => message.from !== undefined && message.to !== undefined)
    const profile =
      connections.length === messages.length &&
      connections.every(message => [0, 1].includes(message.type) && message.from !== message.to && !message.activate && !message.centralConnection) &&
      !array(model.notes).length &&
      !array(model.boxes).length &&
      !entries(model.createdActors).length &&
      !entries(model.destroyedActors).length &&
      !entries(model.active).length &&
      entries(model.actors).every(([_id, actor]) => actor.type === 'participant')
    check('svg-sequence-message-profile', true, profile, 'Reviewed simple directed participant messages only; self, bidirectional, lifecycle, notes, boxes and control-block paint remain unmeasured.', profile)
    check('svg-family-owner', true, testCase.family === 'sequence' && hasClass(root, 'pele-sequence'), 'Public sequence model and owned SVG root identify the authored family.')
    const headers = nodes.filter(element => element.uri === namespace && visible(element) && hasClass(element, 'pele-actor') && !hasClass(element, 'pele-actor-footer'))
    const lifelines = nodes.filter(element => element.uri === namespace && visible(element) && hasClass(element, 'pele-lifeline'))
    check('svg-owned-node-identities', multiset(expected.nodes), multiset(headers.map(owner => owner.attributes['data-id'])), 'Exactly one actor header owns each identity; legitimate repeated footer actors are excluded from header counting.')
    check('svg-sequence-lifeline-identities', multiset(expected.nodes), multiset(lifelines.map(owner => owner.attributes['data-id'])), 'Each actor has exactly one visible owned lifeline.')
    const lines = new Map<string, { x: number; top: number; bottom: number }>()
    for (const owner of lifelines) {
      const points = owner.tag === 'path' ? pathEndpoints(owner) : undefined
      if (points && Math.abs(points.start.x - points.end.x) < 1e-6 && points.end.y > points.start.y) lines.set(owner.attributes['data-id']!, { x: points.start.x, top: points.start.y, bottom: points.end.y })
    }
    for (const [id, actor] of entries(model.actors)) {
      const owners = headers.filter(owner => owner.attributes['data-id'] === id),
        header = owners.length === 1 ? owners[0] : undefined
      const box = header ? shapeBounds(header) : undefined,
        line = lines.get(id)
      check('svg-sequence-actor-label:' + id, normalizedText(String(actor.description ?? actor.name ?? id)), header ? textIn(header) : null, 'Header text is owned by the corresponding public actor identity; independent authored label-owner fields remain separate.')
      check('svg-sequence-lifeline-header:' + id, true, box && line ? Math.abs(box.x + box.width / 2 - line.x) <= 1 && Math.abs(box.y + box.height - line.top) <= 1 : null, 'The owned vertical lifeline begins at the bottom center of its corresponding actor header.', !!box && !!line)
    }
    const ownerAt = (point: Point): string | undefined => {
      const candidates = [...lines].filter(([_id, line]) => Math.abs(point.x - line.x) <= 12 && point.y >= line.top - 1 && point.y <= line.bottom + 1)
      return candidates.length === 1 ? candidates[0]![0] : undefined
    }
    const drawn = nodes.filter(element => element.uri === namespace && visible(element) && hasClass(element, 'pele-edge') && hasClass(element, 'pele-message'))
    const projected = drawn
      .map(owner => {
        const ink = owner.children.filter(element => element.uri === namespace && visible(element) && element.tag === 'path' && !hasClass(element, 'pele-marker') && !!element.attributes.d)
        return { owner, ink, points: ink.length === 1 ? pathEndpoints(ink[0]!) : undefined }
      })
      .sort((left, right) => (left.points?.start.y ?? Infinity) - (right.points?.start.y ?? Infinity))
    check('svg-owned-edge-count', expected.edges.length, drawn.length, 'Exact painted message count, independent of public model and global labels.')
    check('svg-owned-edge-identities', true, drawn.every(owner => !!owner.attributes['data-id']) && new Set(drawn.map(owner => owner.attributes['data-id'])).size === drawn.length, 'Every painted message has a nonempty unique owner ID.')
    const observed: PortableEdge[] = [],
      order: number[] = []
    let endpointsMeasured = true
    for (const [index, item] of projected.entries()) {
      const points = item.points,
        from = points ? ownerAt(points.start) : undefined,
        to = points ? ownerAt(points.end) : undefined
      const horizontal = points ? Math.abs(points.start.y - points.end.y) <= 1 : false
      check('svg-sequence-message-attachment:' + index, true, !!from && !!to && horizontal, 'A simple message path connects two unique owned lifelines within12px. Self/control/lifecycle geometry is outside this projection.', !!points && lines.size === expected.nodes.length)
      if (from && to && horizontal) {
        observed.push({ source: from, target: to })
        order.push(points!.start.y)
      } else endpointsMeasured = false
      const sourceLine = from ? lines.get(from) : undefined,
        targetLine = to ? lines.get(to) : undefined
      const projectedMarkers = item.owner.children
        .filter(element => element.uri === namespace && visible(element) && hasClass(element, 'pele-marker'))
        .map(element => element.tag === 'path' ? markerTriangle(element) : undefined),
        triangles = projectedMarkers.filter((triangle): triangle is Triangle => !!triangle)
      check(
        'svg-sequence-target-marker:' + index,
        true,
        sourceLine && targetLine && points ? triangles.some(marker => markerAttached(marker, points.end) && Math.abs(marker.tip.x - targetLine.x) <= 12 && Math.abs(marker.tip.y - points.end.y) <= 1 && (marker.tip.x - marker.base.x) * (targetLine.x - sourceLine.x) > 0) : null,
        'The nondegenerate message arrowhead points from its observed source toward the target lifeline.',
        !!sourceLine && !!targetLine && !!points && profile && projectedMarkers.every(Boolean),
      )
      const labels = nodes.filter(element => element.uri === namespace && visible(element) && hasClass(element, 'pele-edge-label') && element.attributes['data-id'] === item.owner.attributes['data-id'])
      check(
        'svg-sequence-owned-message-label:' + index,
        normalizedText(String(connections[index]?.message ?? '')),
        labels.length === 1 ? textIn(labels[0]!) : null,
        'Message text belongs to the same SVG owner as the geometrically ordered public message; an unowned global text copy cannot substitute.',
        connections[index] !== undefined,
      )
    }
    check('svg-owned-edge-endpoints-and-multiplicity', expected.edges.map(pair), observed.map(pair), 'Authored directed message order and multiplicity are checked against actual path-to-lifeline bindings, without guessing renderer-generated message IDs.', endpointsMeasured)
    check(
      'svg-sequence-row-order',
      true,
      order.every((value, index) => index === 0 || value > order[index - 1]! + 1),
      'Simple messages occupy distinct successive rows in authored order; simultaneous/control-block layouts are outside this projection.',
      endpointsMeasured,
    )
    paintComplete = checks.slice(paintChecks).every(item => item.status === 'passed')
    unmeasuredScopes.push(
      'Sequence checks cover simple participant headers/lifelines and directed message geometry, order, multiplicity and public-model label ownership. Lifecycle/self/bidirectional/control-block/activation/box/note geometry, unasserted native label assignments and complete path/text paint remain unmeasured.',
    )
  } else {
    check('painted-semantic-correspondence', 'native semantic facts correspond to owned visible geometry', null, 'No reviewed renderer/family paint projection is available; label retention alone does not establish it.', false)
  }
  const complete = nativeComplete && paintComplete && checks.every(item => item.status === 'passed')
  const dimension = (rows: FidelityCheck[]) => rows.some(row => row.status === 'failed') ? 'failed' as const : rows.length && rows.every(row => row.status === 'passed') ? 'passed' as const : 'unmeasured' as const
  return {
    accepted,
    passed: checks.every(item => item.status === 'passed'),
    semanticComplete: complete,
    evidence: { outputAdmission, nativeModel: dimension(nativeChecks), paintedMeaning: dimension(checks.slice(modelChecks + nativeChecks.length)) },
    checks,
    unmeasuredScopes,
    scope: complete
      ? agentic
        ? 'Declared Agentic Class/ER native identities/endpoints and owned visible route geometry, directed Class open arrows and simple ER cardinality/identifying appearance; complete only for these authored criteria, not complete Mermaid, CSS or visual fidelity.'
        : model?.type === 'sequence'
        ? 'Declared simple sequence actor identities, ordered message endpoints and multiplicity plus owned lifelines, connecting path geometry, target arrows and public-model message label correspondence; not complete Mermaid or visual fidelity.'
        : `Declared ${testCase.family} native identities/endpoints plus owned SVG identities/ink/bounding-box attachment, scoped endpoint markers and optional group criteria; not complete Mermaid or visual fidelity.`
      : 'Public model facts and SVG admission, with painted semantic correspondence explicitly unmeasured where no reviewed projection exists.',
  }
}

/** An unreviewed result shape must fail its own record, not abort other projects. */
export function qualifyPortable(testCase: PortableCase, output: PortableOutput): PortableQualification {
  try {
    return { observer: PORTABLE_QUALIFICATION_OBSERVER, ...qualifyPortableUnchecked(testCase, output) }
  } catch (error) {
    return {
      observer: PORTABLE_QUALIFICATION_OBSERVER,
      accepted: output.error === undefined,
      passed: false,
      semanticComplete: false,
      checks: [{ name: 'qualification-protocol', status: 'failed', expected: 'Inspectable public result', actual: (error instanceof Error ? error.message : String(error)).slice(0, 1000), scope: 'The qualifier could not inspect the actual result; no semantic or timing qualification is inferred.' }],
      unmeasuredScopes: ['Qualification failed before all declared criteria could be checked.'],
      scope: 'Qualifier failure; partial observations are not a fidelity certificate.',
    }
  }
}
