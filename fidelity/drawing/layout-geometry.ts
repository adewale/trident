/** Renderer-independent geometry in CSS pixels. No orthogonal-routing rule or
 * Mermaid layout model is used. Curves are flattened by the browser observer. */
export interface Point { x: number; y: number }
export interface Box extends Point { width: number; height: number }
export interface LayoutGeometry {
  nodes: { id: string; boundary: Point[] }[]
  edges: { id: string; source: string; target: string; points: Point[] }[]
  labels: { id: string; owner: string; box: Box }[]
  groups?: { id: string; boundary: Point[]; title?: Box }[]
  markers?: { id: string; edge: string; terminal: 'start' | 'end'; boundary: Point[] }[]
}
export const layoutMetrics = ['crossings', 'sharedPaths', 'crowdedParallelPaths', 'nodeOverlaps', 'edgeNodeIntersections', 'edgeEndpointNodeIntersections', 'labelOverlaps', 'edgeLabelIntersections', 'labelNodeOverlaps', 'edgeGroupTitleIntersections', 'labelGroupBorderIntersections', 'nodeGroupBorderIntersections', 'labelMarkerOverlaps'] as const
export type LayoutMetric = typeof layoutMetrics[number]
export interface LayoutFinding { metric: LayoutMetric; objects: string[]; point: Point; details?: Record<string, number | string> }
export const layoutPolicy = {
  id: 'flowchart-svg-layout-v2',
  sampleStep: .5, simplifyTolerance: .1, contactTolerance: .5,
  endpointAllowance: 8, parallelGap: 7, parallelSpan: 8, parallelAngleSine: .01,
  maxSamples: 32768, maxElements: 4096, maxComparisons: 2_000_000,
  scope: 'Sampled node/group/filled-marker contours and edge centerlines; measured text layout bounds; CSS pixels. Stroke width, self-crossings, marker-mid and pixel occlusion are not measured.',
} as const

const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const segments = (points: Point[]) => points.slice(1).map((b, index) => ({ a: points[index]!, b }))
function intersection(a: Point, b: Point, c: Point, d: Point): Point | undefined {
  const r = subtract(b, a), s = subtract(d, c), denominator = cross(r, s)
  if (Math.abs(denominator) < 1e-9) return
  const t = cross(subtract(c, a), s) / denominator, u = cross(subtract(c, a), r) / denominator
  if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return
  return { x: a.x + t * r.x, y: a.y + t * r.y }
}
function onSegment(p: Point, a: Point, b: Point, epsilon: number = layoutPolicy.contactTolerance) {
  const v = subtract(b, a), length = distance(a, b)
  return length > 0 && Math.abs(cross(subtract(p, a), v)) / length <= epsilon && p.x >= Math.min(a.x, b.x) - epsilon && p.x <= Math.max(a.x, b.x) + epsilon && p.y >= Math.min(a.y, b.y) - epsilon && p.y <= Math.max(a.y, b.y) + epsilon
}
function inside(p: Point, polygon: Point[], tick: () => void) {
  let result = false
  for (const { a, b } of segments(polygon)) {
    tick()
    if (onSegment(p, a, b)) return false // Boundary contact is not overlap.
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) result = !result
  }
  return result
}
function bounds(points: Point[]): Box {
  const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y))
  return { x, y, width: Math.max(...points.map(p => p.x)) - x, height: Math.max(...points.map(p => p.y)) - y }
}
const rectangle = (b: Box): Point[] => [{ x: b.x, y: b.y }, { x: b.x + b.width, y: b.y }, { x: b.x + b.width, y: b.y + b.height }, { x: b.x, y: b.y + b.height }, { x: b.x, y: b.y }]
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Only a bounded distance along the actual terminal route is exempt. Later
 * re-entry near the same attachment point must not inherit that exemption. */
function trimTerminal(points: Point[], length: number): Point[] {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!, b = points[i]!, segment = distance(a, b)
    if (segment > length) return [{ x: a.x + (b.x - a.x) * length / segment, y: a.y + (b.y - a.y) * length / segment }, ...points.slice(i)]
    length -= segment
  }
  return []
}
function outsideAttachments(edge: LayoutGeometry['edges'][number], node: string) {
  let points = edge.points
  if (edge.source === node) points = trimTerminal(points, layoutPolicy.endpointAllowance)
  if (edge.target === node) points = trimTerminal([...points].reverse(), layoutPolicy.endpointAllowance).reverse()
  return points
}

/** All loops share a deterministic budget. Exhaustion makes the observation
 * unassessed; partial counts must never become an apparently perfect layout. */
export function measureLayout(geometry: LayoutGeometry): { findings: LayoutFinding[]; counts: Record<LayoutMetric, number> } {
  let work = 0
  const tick = () => { if (++work > layoutPolicy.maxComparisons) throw Error('Layout geometry comparison budget exceeded') }
  const findings: LayoutFinding[] = []
  const add = (metric: LayoutMetric, objects: string[], point: Point, details?: LayoutFinding['details']) => {
    if (findings.length >= layoutPolicy.maxElements) throw Error('Layout finding budget exceeded')
    if (!findings.some(f => f.metric === metric && f.objects.join('\0') === objects.join('\0') && distance(f.point, point) <= layoutPolicy.contactTolerance)) findings.push({ metric, objects, point, ...(details ? { details } : {}) })
  }
  const overlaps = (a: Point[], b: Point[]): Point | undefined => {
    const ab = bounds(a), bb = bounds(b)
    if (Math.min(ab.x + ab.width, bb.x + bb.width) - Math.max(ab.x, bb.x) <= layoutPolicy.contactTolerance || Math.min(ab.y + ab.height, bb.y + bb.height) - Math.max(ab.y, bb.y) <= layoutPolicy.contactTolerance) return
    for (const p of a) { tick(); if (inside(p, b, tick)) return p }
    for (const p of b) { tick(); if (inside(p, a, tick)) return p }
    // Coincident contours and aligned rectangles can overlap without a vertex
    // strictly inside. Test the interior of each cut segment as well.
    const center = { x: ab.x + ab.width / 2, y: ab.y + ab.height / 2 }
    const witness = penetrates(a, b) ?? penetrates(b, a) ?? (inside(center, a, tick) && inside(center, b, tick) ? center : undefined)
    if (witness) return witness
    // Coincident concave outlines can have their bounding-box center outside
    // both interiors. Probe both sides of each boundary segment, then require
    // an actual interior witness in BOTH polygons. Shared borders between
    // disjoint bodies therefore cannot become false overlap findings.
    const inset = layoutPolicy.contactTolerance + 1e-4
    for (const polygon of [a, b]) for (const { a: from, b: to } of segments(polygon)) {
      tick()
      const length = distance(from, to)
      if (!length) continue
      const middle = midpoint(from, to)
      for (const sign of [-1, 1]) {
        const p = { x: middle.x - sign * (to.y - from.y) * inset / length, y: middle.y + sign * (to.x - from.x) * inset / length }
        if (inside(p, a, tick) && inside(p, b, tick)) return p
      }
    }
    return undefined
  }
  const penetrates = (path: Point[], polygon: Point[]): Point | undefined => {
    for (const { a, b } of segments(path)) {
      const cuts = [a, b]
      for (const edge of segments(polygon)) { tick(); const hit = intersection(a, b, edge.a, edge.b); if (hit) cuts.push(hit) }
      cuts.sort((p, q) => distance(a, p) - distance(a, q))
      for (let i = 1; i < cuts.length; i++) { tick(); const p = midpoint(cuts[i - 1]!, cuts[i]!); if (inside(p, polygon, tick)) return p }
    }
  }
  for (let i = 0; i < geometry.edges.length; i++) {
    const first = geometry.edges[i]!
    for (const second of geometry.edges.slice(i + 1)) {
      const hits: Point[] = [], shared: Point[] = []
      let crowded: { point: Point; gap: number; span: number } | undefined
      for (const s of segments(first.points)) for (const t of segments(second.points)) {
        tick()
        const hit = intersection(s.a, s.b, t.a, t.b)
        if (hit) hits.push(hit)
        else if (onSegment(s.a, t.a, t.b, .01) || onSegment(s.b, t.a, t.b, .01) || onSegment(t.a, s.a, s.b, .01)) {
          const points = [s.a, s.b, t.a, t.b].filter(p => onSegment(p, s.a, s.b, .01) && onSegment(p, t.a, t.b, .01))
          if (points.some((p, index) => points.slice(index + 1).some(q => distance(p, q) > layoutPolicy.contactTolerance))) shared.push(points[0]!)
        }
        const r = subtract(s.b, s.a), v = subtract(t.b, t.a), rLength = distance(s.a, s.b), vLength = distance(t.a, t.b)
        if (!crowded && rLength > 0 && vLength > 0 && Math.abs(cross(r, v)) / (rLength * vLength) <= layoutPolicy.parallelAngleSine) {
          const projection = (p: Point) => ((p.x - s.a.x) * r.x + (p.y - s.a.y) * r.y) / rLength
          const low = Math.max(0, Math.min(projection(t.a), projection(t.b))), high = Math.min(rLength, Math.max(projection(t.a), projection(t.b)))
          const gap = Math.max(Math.abs(cross(r, subtract(t.a, s.a))), Math.abs(cross(r, subtract(t.b, s.a)))) / rLength
          // The first/last straight stubs of edges sharing a node legitimately
          // fan out together. This does not exempt their later parallel rails.
          const terminal = (edge: typeof first, part: typeof s, id: string) => edge.source === id && distance(part.a, edge.points[0]!) <= .01 || edge.target === id && distance(part.b, edge.points.at(-1)!) <= .01
          const sharedStub = [first.source, first.target].some(id => id && terminal(first, s, id) && terminal(second, t, id))
          if (!sharedStub && high - low >= layoutPolicy.parallelSpan && gap > layoutPolicy.contactTolerance && gap < layoutPolicy.parallelGap) crowded = { point: { x: s.a.x + r.x * (low + high) / (2 * rLength), y: s.a.y + r.y * (low + high) / (2 * rLength) }, gap, span: high - low }
        }
      }
      if (shared.length) add('sharedPaths', [first.id, second.id], shared[0]!) // Edge pairs, not sample-segment counts.
      if (crowded) add('crowdedParallelPaths', [first.id, second.id], crowded.point, { gap: crowded.gap, span: crowded.span })
      for (const hit of hits) {
        // Four local arms must alternate around the contact. Testing against
        // just one incoming segment misses crossings occurring at two bends.
        // Missing arms mean terminal contact; coincident arms mean shared ink.
        const arms = (path: Point[]) => {
          const at = path.findIndex((p, i) => i && onSegment(hit, path[i - 1]!, p, .01))
          if (at < 1) return undefined
          const before = distance(hit, path[at - 1]!) > .01 ? path[at - 1]! : path[at - 2]
          const after = distance(hit, path[at]!) > .01 ? path[at]! : path[at + 1]
          return before && after ? [subtract(before, hit), subtract(after, hit)] : undefined
        }
        const firstArms = arms(first.points), secondArms = arms(second.points)
        if (!firstArms || !secondArms) continue
        const directions = [firstArms, secondArms].flatMap((points, owner) => points.map(p => ({ owner, angle: Math.atan2(p.y, p.x) }))).sort((a, b) => a.angle - b.angle)
        const alternates = directions.every((arm, index) => {
          const next = directions[(index + 1) % directions.length]!
          return arm.owner !== next.owner && (next.angle - arm.angle + 2 * Math.PI) % (2 * Math.PI) > 1e-7
        })
        if (alternates) add('crossings', [first.id, second.id], hit)
      }
    }
  }
  for (let i = 0; i < geometry.nodes.length; i++) {
    const node = geometry.nodes[i]!
    for (const other of geometry.nodes.slice(i + 1)) { tick(); const p = overlaps(node.boundary, other.boundary); if (p) add('nodeOverlaps', [node.id, other.id], p) }
    for (const edge of geometry.edges) if (edge.source !== node.id && edge.target !== node.id) { tick(); const p = penetrates(edge.points, node.boundary); if (p) add('edgeNodeIntersections', [edge.id, node.id], p) }
    else { tick(); const p = penetrates(outsideAttachments(edge, node.id), node.boundary); if (p) add('edgeEndpointNodeIntersections', [edge.id, node.id], p) }
    for (const label of geometry.labels) if (label.owner !== node.id) { tick(); const p = overlaps(rectangle(label.box), node.boundary); if (p) add('labelNodeOverlaps', [label.id, node.id], p) }
  }
  for (let i = 0; i < geometry.labels.length; i++) {
    const label = geometry.labels[i]!, polygon = rectangle(label.box)
    for (const other of geometry.labels.slice(i + 1)) { tick(); const p = overlaps(polygon, rectangle(other.box)); if (p) add('labelOverlaps', [label.id, other.id], p) }
    for (const edge of geometry.edges) if (label.owner !== edge.id) { tick(); const p = penetrates(edge.points, polygon); if (p) add('edgeLabelIntersections', [edge.id, label.id], p) }
    for (const marker of geometry.markers ?? []) { tick(); const p = overlaps(polygon, marker.boundary); if (p) add('labelMarkerOverlaps', [label.id, marker.id], p) }
    for (const group of geometry.groups ?? []) { tick(); const p = penetrates(group.boundary, polygon); if (p) add('labelGroupBorderIntersections', [label.id, group.id], p) }
  }
  for (const group of geometry.groups ?? []) {
    for (const node of geometry.nodes) { tick(); const p = penetrates(group.boundary, node.boundary); if (p) add('nodeGroupBorderIntersections', [node.id, group.id], p) }
    if (group.title) for (const edge of geometry.edges) { tick(); const p = penetrates(outsideAttachments(edge, group.id), rectangle(group.title)); if (p) add('edgeGroupTitleIntersections', [edge.id, group.id], p) }
  }
  return { findings, counts: Object.fromEntries(layoutMetrics.map(metric => [metric, findings.filter(f => f.metric === metric).length])) as Record<LayoutMetric, number> }
}
