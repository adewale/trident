import { inspectFidelityPaint, type PaintEvidence } from '../paint.ts'
import type { DrawingCase } from './corpus.ts'
import { layoutMetrics, layoutPolicy, measureLayout, type LayoutGeometry, type LayoutMetric } from './layout-geometry.ts'

export interface LayoutCoverage { expected: number; observed: number; reasons: string[] }
export type LayoutCoveragePart = 'nodes' | 'edges' | 'labels' | 'groups' | 'markers'
export interface LayoutObservation {
  status: 'assessed' | 'unassessed'
  policy: typeof layoutPolicy.id
  coverage: Record<LayoutCoveragePart, LayoutCoverage>
  metrics: Record<LayoutMetric, { status: 'assessed' | 'unassessed'; value: number | null; observed: number }>
  findings: ReturnType<typeof measureLayout>['findings']
  geometry: LayoutGeometry
  reasons: string[]
}

/** Executed in the mounted SVG document. Source-bound anchors come from the
 * existing paint observer; matching a renderer's IDs never supplies geometry. */
export function extractLayoutGeometry(input: { paint: PaintEvidence; policy: typeof layoutPolicy }) {
  const geometry: LayoutGeometry = { nodes: [], edges: [], labels: [], groups: [], markers: [] }
  const gaps: Record<LayoutCoveragePart, string[]> = { nodes: [], edges: [], labels: [], groups: [], markers: [] }
  const svg = document.querySelector('svg')
  if (!svg) { for (const part of Object.keys(gaps) as LayoutCoveragePart[]) gaps[part].push('No SVG root'); return { geometry, gaps } }
  const all = [...svg.querySelectorAll<SVGGeometryElement>('rect,circle,ellipse,polygon,path,polyline,line')].filter(element => !element.closest('defs,marker,clipPath,mask,pattern,symbol'))
  if (all.length > input.policy.maxElements) throw Error('Layout element budget exceeded')
  const box = (element: Element) => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
  const same = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) => (['x', 'y', 'width', 'height'] as const).every(key => Math.abs(a[key] - b[key]) < .25)
  let simplifyWork = 0
  // A single feDropShadow composites SourceGraphic unchanged over its shadow.
  // Admit only an object-bounding-box filter region enclosing the full body.
  // Shadows themselves are outside these centerline/contour measurements.
  const preservesBody = (setting: string) => {
    if (setting === 'none') return true
    const match = /^url\(["']?#([^\s"')]+)["']?\)$/.exec(setting)
    if (!match) return false
    let filter: Element | null
    try { filter = document.getElementById(decodeURIComponent(match[1]!)) } catch { return false }
    if (!filter || !svg.contains(filter) || filter.localName !== 'filter' || filter.hasAttribute('href') || filter.hasAttributeNS('http://www.w3.org/1999/xlink', 'href') || filter.hasAttribute('filterRes') || filter.children.length !== 1 || !['', 'objectBoundingBox'].includes(filter.getAttribute('filterUnits') ?? '')) return false
    const shadow = filter.children[0]!
    if (shadow.localName !== 'feDropShadow' || shadow.children.length || !['', 'SourceGraphic'].includes(shadow.getAttribute('in') ?? '') || ['x', 'y', 'width', 'height'].some(key => shadow.hasAttribute(key))) return false
    const extent = (name: string, fallback: number) => {
      const value = filter.getAttribute(name)
      if (value === null) return fallback
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(value)) return NaN
      return Number.parseFloat(value) / (value.endsWith('%') ? 100 : 1)
    }
    const x = extent('x', -.1), y = extent('y', -.1), width = extent('width', 1.2), height = extent('height', 1.2)
    return [x, y, width, height].every(Number.isFinite) && x <= 0 && y <= 0 && x + width >= 1 && y + height >= 1
  }
  const supported = (element: Element) => {
    for (let owner: Element | null = element; owner; owner = owner.parentElement) {
      const style = getComputedStyle(owner)
      if (owner !== svg && owner.localName === 'svg') return false
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) !== 1 || !preservesBody(style.filter) || style.clipPath !== 'none' || style.maskImage !== 'none' || style.mixBlendMode !== 'normal' || style.animationName !== 'none') return false
      if (owner === svg) break
    }
    return !element.closest('a') && !svg.querySelector('animate,animateTransform,animateMotion,set')
  }
  let samples = 0
  type Point = { x: number; y: number }
  // Ramer–Douglas–Peucker with a fixed CSS-pixel error and bounded stack.
  const simplify = (points: Point[]) => {
    const kept = new Set([0, points.length - 1]), pending = [[0, points.length - 1]]
    while (pending.length) {
      const [start, end] = pending.pop()!, a = points[start!]!, b = points[end!]!
      let largest: number = input.policy.simplifyTolerance, selected = -1
      for (let i = start! + 1; i < end!; i++) {
        if (++simplifyWork > input.policy.maxComparisons) throw Error('Layout simplification budget exceeded')
        const p = points[i]!, dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)))
        const d = Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
        if (d > largest) { largest = d; selected = i }
      }
      if (selected !== -1) { kept.add(selected); pending.push([start!, selected], [selected, end!]) }
    }
    return [...kept].sort((a, b) => a - b).map(i => points[i]!)
  }
  const sample = (element: SVGGeometryElement, closed: boolean) => {
    if (!supported(element)) throw Error('clipped, filtered, animated or hidden geometry')
    const matrix = element.getScreenCTM(), length = element.getTotalLength()
    if (!matrix || ![matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f, length].every(Number.isFinite) || length <= 0) throw Error('nonfinite or empty geometry')
    // Compound paths can join disconnected subpaths in getPointAtLength. Never
    // fabricate the joining segment. Filled open paths are not edge centerlines.
    if (element.localName === 'path' && ((element.getAttribute('d')?.match(/[Mm]/g)?.length ?? 0) !== 1 || !closed && /[Zz]/.test(element.getAttribute('d') ?? ''))) throw Error('compound or closed route path')
    if (element.localName === 'polygon') {
      const list = (element as SVGPolygonElement).points
      if (list.numberOfItems < 3 || list.numberOfItems > 256) throw Error('Unsupported polygon size')
      const points = Array.from({ length: list.numberOfItems }, (_, i) => list.getItem(i))
      const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
      for (let i = 0; i < points.length; i++) for (let j = i + 2; j < points.length; j++) {
        if (i === 0 && j === points.length - 1) continue
        const a = points[i]!, b = points[(i + 1) % points.length]!, c = points[j]!, d = points[(j + 1) % points.length]!
        if (cross(a, b, c) * cross(a, b, d) <= 0 && cross(c, d, a) * cross(c, d, b) <= 0 && Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <= Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) && Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <= Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y))) throw Error('Self-intersecting polygon contour')
      }
    }
    const count = Math.max(2, Math.ceil(length * Math.hypot(matrix.a, matrix.b, matrix.c, matrix.d) / input.policy.sampleStep))
    samples += count + 1
    if (samples > input.policy.maxSamples) throw Error('Layout sample budget exceeded')
    const points = Array.from({ length: count + 1 }, (_, index) => { const p = element.getPointAtLength(length * index / count).matrixTransform(matrix); return { x: p.x, y: p.y } })
    const canvas = svg.getBoundingClientRect()
    if (points.some(p => p.x < canvas.left - .25 || p.x > canvas.right + .25 || p.y < canvas.top - .25 || p.y > canvas.bottom + .25)) throw Error('Geometry extends beyond SVG viewport')
    if (closed) points.push({ ...points[0]! })
    return simplify(points)
  }
  const nodeElements = new Set<Element>()
  for (const node of input.paint.nodes as { id: string; box: ReturnType<typeof box>; outline?: { tag: string } }[]) {
    const matches = all.filter(element => element.localName === node.outline?.tag && same(box(element), node.box))
    if (matches.length !== 1) { gaps.nodes.push(node.id + ': ambiguous node contour'); continue }
    const element = matches[0]!
    // Initially admit simple primitive bodies. Arbitrary filled paths may have
    // holes, disconnected parts or self-intersections and remain unassessed.
    if (!['rect', 'circle', 'ellipse', 'polygon'].includes(element.localName)) { gaps.nodes.push(node.id + ': unsupported node contour ' + element.localName); continue }
    try { geometry.nodes.push({ id: node.id, boundary: sample(element, true) }); nodeElements.add(element) }
    catch (error) { gaps.nodes.push(node.id + ': ' + String(error)) }
  }
  for (const group of input.paint.groups ?? []) {
    const matches = all.filter(element => ['rect', 'polygon'].includes(element.localName) && same(box(element), group.box))
    if (matches.length !== 1) { gaps.groups.push(group.id + ': ambiguous group boundary'); continue }
    try { geometry.groups!.push({ id: group.id, boundary: sample(matches[0]!, true) }) }
    catch (error) { gaps.groups.push(group.id + ': ' + String(error)) }
  }
  const markerContour = (element: SVGGeometryElement, side: 'start' | 'end') => {
    const style = getComputedStyle(element), setting = side === 'start' ? style.markerStart : style.markerEnd
    if (setting === 'none') return undefined
    const match = /^url\(["']?#([^\s"')]+)["']?\)$/.exec(setting)
    const found = match ? document.getElementById(decodeURIComponent(match[1]!)) : null
    if (!found || found.localName !== 'marker' || found.children.length !== 1) throw Error('Unsupported marker reference or compound marker')
    const marker = found as unknown as SVGMarkerElement, shape = marker.children[0] as SVGGeometryElement
    if (![marker.refX, marker.refY, marker.markerWidth, marker.markerHeight].every(length => length.baseVal.unitType === SVGLength.SVG_LENGTHTYPE_NUMBER || length.baseVal.unitType === SVGLength.SVG_LENGTHTYPE_PX)) throw Error('Unsupported marker length units')
    if (!['rect', 'circle', 'ellipse', 'polygon', 'path'].includes(shape.localName) || shape.hasAttribute('transform') || getComputedStyle(shape).transform !== 'none' || getComputedStyle(marker).transform !== 'none' || marker.hasAttribute('href') || !supported(shape)) throw Error('Unsupported marker body or transform')
    if (shape.localName === 'path' && ((shape.getAttribute('d')?.match(/[Mm]/g)?.length ?? 0) !== 1 || !/[Zz]\s*$/.test(shape.getAttribute('d') ?? ''))) throw Error('Only closed single-contour markers are supported')
    const ink = getComputedStyle(shape)
    if (ink.fill === 'none' || Number(ink.fillOpacity) !== 1 || !/^rgb\(/.test(ink.fill)) throw Error('Only opaque filled marker contours are supported')
    const view = marker.viewBox.baseVal, width = marker.markerWidth.baseVal.value, height = marker.markerHeight.baseVal.value
    const hasView = marker.hasAttribute('viewBox'), par = marker.preserveAspectRatio.baseVal
    if (!(width > 0 && height > 0) || hasView && !(view.width > 0 && view.height > 0) || hasView && (par.align !== SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMIDYMID || par.meetOrSlice !== SVGPreserveAspectRatio.SVG_MEETORSLICE_MEET)) throw Error('Unsupported marker viewport')
    const scale = hasView ? Math.min(width / view.width, height / view.height) : 1
    const viewport = hasView ? { x: view.x, y: view.y, width: view.width, height: view.height } : { x: 0, y: 0, width, height }
    const b = shape.getBBox()
    if (b.x < viewport.x || b.y < viewport.y || b.x + b.width > viewport.x + viewport.width || b.y + b.height > viewport.y + viewport.height) throw Error('Marker body may be clipped by its viewport')
    const length = element.getTotalLength(), at = side === 'start' ? 0 : length, point = element.getPointAtLength(at)
    const before = element.getPointAtLength(side === 'start' ? 0 : Math.max(0, length - .01)), after = element.getPointAtLength(side === 'start' ? Math.min(length, .01) : length)
    const orient = marker.getAttribute('orient') ?? '0', automatic = orient === 'auto' || orient === 'auto-start-reverse'
    if (!automatic && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?$/.test(orient)) throw Error('Unsupported marker orientation')
    if (automatic && Math.hypot(after.x - before.x, after.y - before.y) < 1e-9) throw Error('Ambiguous marker tangent')
    const angle = automatic ? Math.atan2(after.y - before.y, after.x - before.x) + (side === 'start' && orient === 'auto-start-reverse' ? Math.PI : 0) : Number.parseFloat(orient) * Math.PI / 180
    const units = marker.getAttribute('markerUnits') === 'userSpaceOnUse' ? 1 : Number.parseFloat(style.strokeWidth), matrix = element.getScreenCTM()
    if (!matrix || !Number.isFinite(units) || units <= 0) throw Error('Unsupported marker scale')
    const refX = marker.refX.baseVal.value, refY = marker.refY.baseVal.value, contourLength = shape.getTotalLength()
    const count = Math.max(8, Math.ceil(contourLength * scale * units * Math.hypot(matrix.a, matrix.b, matrix.c, matrix.d) / input.policy.sampleStep))
    samples += count + 1
    if (samples > input.policy.maxSamples) throw Error('Layout sample budget exceeded')
    const boundary = Array.from({ length: count + 1 }, (_, i) => {
      const p = shape.getPointAtLength(contourLength * i / count), x = (p.x - refX) * scale * units, y = (p.y - refY) * scale * units
      const screen = new DOMPoint(point.x + Math.cos(angle) * x - Math.sin(angle) * y, point.y + Math.sin(angle) * x + Math.cos(angle) * y).matrixTransform(matrix)
      return { x: screen.x, y: screen.y }
    })
    if (!boundary.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) throw Error('Nonfinite marker contour')
    const canvas = svg.getBoundingClientRect()
    if (boundary.some(p => p.x < canvas.left - .25 || p.x > canvas.right + .25 || p.y < canvas.top - .25 || p.y > canvas.bottom + .25)) throw Error('Marker contour extends beyond SVG viewport')
    boundary.push({ ...boundary[0]! })
    const contour = simplify(boundary)
    // The kernel uses simple polygon interiors. A single SVG subpath can still
    // cross itself and have a different winding-rule fill; keep it unassessed.
    const points = contour.filter((p, i) => !i || Math.hypot(p.x - contour[i - 1]!.x, p.y - contour[i - 1]!.y) > 1e-5)
    if (Math.hypot(points[0]!.x - points.at(-1)!.x, points[0]!.y - points.at(-1)!.y) < 1e-4) points.pop()
    if (points.length < 3) throw Error('Degenerate marker contour')
    const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
    for (let i = 0; i < points.length; i++) for (let j = i + 2; j < points.length; j++) {
      if (++simplifyWork > input.policy.maxComparisons) throw Error('Layout marker contour budget exceeded')
      if (i === 0 && j === points.length - 1) continue
      const a = points[i]!, b = points[(i + 1) % points.length]!, c = points[j]!, d = points[(j + 1) % points.length]!
      if (cross(a, b, c) * cross(a, b, d) <= 0 && cross(c, d, a) * cross(c, d, b) <= 0 && Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <= Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) && Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <= Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y))) throw Error('Self-intersecting marker contour')
    }
    return [...points, { ...points[0]! }]
  }
  const used = new Set<Element>()
  for (const [index, edge] of (input.paint.connections as { source: string; target: string; start: Point; end: Point; labels: string[]; startMarker: string; endMarker: string }[]).entries()) {
    const matches = all.filter(element => {
      if (!['path', 'polyline', 'line'].includes(element.localName) || nodeElements.has(element)) return false
      const style = getComputedStyle(element), matrix = element.getScreenCTM()
      if (!matrix || style.stroke === 'none' || Number(style.strokeOpacity) !== 1 || Number.parseFloat(style.strokeWidth) <= 0 || style.fill !== 'none' && element.localName === 'path') return false
      try {
        const a = element.getPointAtLength(0).matrixTransform(matrix), b = element.getPointAtLength(element.getTotalLength()).matrixTransform(matrix)
        return Math.hypot(a.x - edge.start.x, a.y - edge.start.y) < .25 && Math.hypot(b.x - edge.end.x, b.y - edge.end.y) < .25
      } catch { return false }
    })
    if (matches.length !== 1 || used.has(matches[0]!)) { gaps.edges.push('edge:' + index + ': ambiguous painted route'); continue }
    try {
      const element = matches[0]!
      geometry.edges.push({ id: 'edge:' + index, source: edge.source, target: edge.target, points: sample(element, false) }); used.add(element)
      if (getComputedStyle(element).markerMid !== 'none') gaps.markers.push('edge:' + index + ': marker-mid is unsupported')
      for (const terminal of ['start', 'end'] as const) {
        try {
          const boundary = markerContour(element, terminal)
          if (boundary) geometry.markers!.push({ id: 'marker:' + index + ':' + terminal, edge: 'edge:' + index, terminal, boundary })
          else if ((terminal === 'start' ? edge.startMarker : edge.endMarker) !== 'none') gaps.markers.push('edge:' + index + ':' + terminal + ': inline or unqualified marker')
        } catch (error) { gaps.markers.push('edge:' + index + ':' + terminal + ': ' + String(error)) }
      }
    }
    catch (error) { gaps.edges.push('edge:' + index + ': ' + String(error)) }
  }
  // Use measured text layout bounds, including HTML labels. Ink-box admission
  // in the label correctness observer is intentionally narrower (Latin-1 and
  // exact Canvas/SVG font metrics); layout bounds do not claim pixel occlusion.
  const labelBoxes = [...svg.querySelectorAll('text,foreignObject')].flatMap(element => {
    if (!supported(element) || [...element.querySelectorAll('*')].some(child => !supported(child))) { gaps.labels.push('Unsupported text effects'); return [] }
    const text = element.textContent?.normalize('NFC').replace(/\s+/g, ' ').trim()
    if (!text) return []
    let measured = box(element)
    if (element.localName === 'foreignObject') {
      const range = document.createRange(); range.selectNodeContents(element)
      const b = range.getBoundingClientRect(); measured = { x: b.x, y: b.y, width: b.width, height: b.height }
    }
    if (![measured.x, measured.y, measured.width, measured.height].every(Number.isFinite) || measured.width <= 0 || measured.height <= 0) { gaps.labels.push('Empty or nonfinite caption bounds'); return [] }
    return [{ text, layoutBox: measured }]
  })
  for (const [index, label] of labelBoxes.entries()) {
    const owners = [
      ...(input.paint.nodes as { id: string; label: string; box: ReturnType<typeof box> }[]).filter(node => node.label === label.text && label.layoutBox.x >= node.box.x - .25 && label.layoutBox.y >= node.box.y - .25 && label.layoutBox.x + label.layoutBox.width <= node.box.x + node.box.width + .25 && label.layoutBox.y + label.layoutBox.height <= node.box.y + node.box.height + .25).map(node => node.id),
      ...(input.paint.connections as { labels: string[] }[]).flatMap((edge, i) => edge.labels.includes(label.text) ? ['edge:' + i] : []),
      ...(input.paint.groups ?? []).filter(group => group.label === label.text && label.layoutBox.x >= group.box.x - .25 && label.layoutBox.y >= group.box.y - .25 && label.layoutBox.x + label.layoutBox.width <= group.box.x + group.box.width + .25 && label.layoutBox.y + label.layoutBox.height <= group.box.y + group.box.height + .25).map(group => group.id),
    ]
    if (owners.length !== 1) { gaps.labels.push('label:' + index + ': ambiguous caption owner'); continue }
    geometry.labels.push({ id: 'label:' + index, owner: owners[0]!, box: label.layoutBox })
    const group = geometry.groups!.find(group => group.id === owners[0])
    if (group) { if (group.title) gaps.groups.push(group.id + ': ambiguous title bounds'); else group.title = label.layoutBox }
  }
  for (const group of geometry.groups!) if (!group.title) gaps.groups.push(group.id + ': title bounds unavailable')
  return { geometry, gaps }
}

export function unavailableLayout(reason: string, test: Pick<DrawingCase, 'expected'>): LayoutObservation {
  return {
    status: 'unassessed', policy: layoutPolicy.id, reasons: [reason],
    coverage: Object.fromEntries(Object.entries(expectedLayoutCoverage(test)).map(([part, expected]) => [part, { expected, observed: 0, reasons: [reason] }])) as LayoutObservation['coverage'],
    metrics: Object.fromEntries(layoutMetrics.map(key => [key, { status: 'unassessed', value: null, observed: 0 }])) as LayoutObservation['metrics'],
    findings: [], geometry: { nodes: [], edges: [], labels: [], groups: [], markers: [] },
  }
}

function expectedLayoutCoverage(test: Pick<DrawingCase, 'expected'>) {
  const edges = test.expected.edges ?? []
  const hasMarker = (marker: string | undefined) => marker !== undefined && !['none', ''].includes(marker)
  return {
    nodes: test.expected.nodes?.length ?? 0, edges: edges.length,
    labels: (test.expected.nodes?.length ?? 0) + edges.filter(e => e.label).length + (test.expected.groups?.filter(group => group.label).length ?? 0),
    groups: test.expected.groups?.length ?? 0,
    markers: edges.reduce((sum, edge) => sum + Number(hasMarker(edge.startMarker)) + Number(edge.endMarker === undefined ? edge.directed : hasMarker(edge.endMarker)), 0),
  }
}

/** Geometry completeness is separate from semantic correctness: a missing edge
 * cannot improve a renderer's crossing count. Every metric has its own coverage. */
export async function observeSvgLayout(page: { evaluate: (fn: any, input: any) => Promise<any> }, test: Pick<DrawingCase, 'family' | 'expected' | 'sourceGaps'>): Promise<LayoutObservation> {
  if (test.family !== 'flowchart') return unavailableLayout('Only flowchart SVG geometry is supported', test)
  if (test.sourceGaps.length) return unavailableLayout('Source contract is incomplete: ' + test.sourceGaps.join('; '), test)
  const paint: PaintEvidence = await page.evaluate(inspectFidelityPaint, test)
  const extracted: ReturnType<typeof extractLayoutGeometry> = await page.evaluate(extractLayoutGeometry, { paint, policy: layoutPolicy })
  const { geometry, gaps } = extracted
  const check = (criterion: string) => paint.checks.find(c => c.criterion === criterion)?.status === 'passed'
  if (!check('painted-node-ownership')) gaps.nodes.push('Source-owned node inventory is unqualified')
  if (test.expected.edges?.length && !check('painted-relationships')) gaps.edges.push('Source-owned edge inventory is unqualified or differs')
  if (!check('visible-authored-labels') || !check('painted-text-inventory')) gaps.labels.push('Visible caption inventory is unqualified')
  for (const group of test.expected.groups ?? []) {
    // A witnessed member extending beyond its group's frame is a measurable
    // collision. A failed containment check must not erase that geometry.
    const status = paint.checks.find(check => check.criterion === 'painted-group:' + group.id)?.status
    if (!status || status === 'unavailable') gaps.groups.push(group.id + ': source-owned group inventory is unqualified')
  }
  if (test.expected.edges?.some(edge => edge.startMarker !== undefined || edge.endMarker !== undefined) && !check('painted-relationship-markers')) gaps.markers.push('Source marker inventory is unqualified or differs')
  const expected = expectedLayoutCoverage(test)
  const coverage = Object.fromEntries((['nodes', 'edges', 'labels', 'groups', 'markers'] as const).map(key => {
    const observed = geometry[key]?.length ?? 0
    if (expected[key] !== observed) gaps[key].push('Expected ' + expected[key] + ', observed ' + observed)
    return [key, { expected: expected[key], observed, reasons: gaps[key] }]
  })) as LayoutObservation['coverage']
  const dependencies: Record<LayoutMetric, (keyof typeof coverage)[]> = { crossings: ['nodes', 'edges'], sharedPaths: ['nodes', 'edges'], crowdedParallelPaths: ['nodes', 'edges'], nodeOverlaps: ['nodes'], edgeNodeIntersections: ['nodes', 'edges'], edgeEndpointNodeIntersections: ['nodes', 'edges'], labelOverlaps: ['labels'], edgeLabelIntersections: ['nodes', 'edges', 'labels'], labelNodeOverlaps: ['nodes', 'labels'], edgeGroupTitleIntersections: ['nodes', 'edges', 'groups'], labelGroupBorderIntersections: ['labels', 'groups'], nodeGroupBorderIntersections: ['nodes', 'groups'], labelMarkerOverlaps: ['nodes', 'edges', 'labels', 'markers'] }
  const measured = measureLayout(geometry)
  const metrics = Object.fromEntries(layoutMetrics.map(key => {
    const complete = dependencies[key].every(part => !coverage[part].reasons.length)
    return [key, { status: complete ? 'assessed' : 'unassessed', value: complete ? measured.counts[key] : null, observed: measured.counts[key] }]
  })) as LayoutObservation['metrics']
  return { status: layoutMetrics.every(key => metrics[key].status === 'assessed') ? 'assessed' : 'unassessed', policy: layoutPolicy.id, coverage, metrics, findings: measured.findings, geometry, reasons: Object.values(gaps).flat() }
}
