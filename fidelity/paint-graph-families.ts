import type { MeaningExpectation } from './meaning.ts'
import type { PaintCheck, PaintEvidence } from './paint.ts'

export const graphPaintFamilies = ['flowchart', 'agentflow', 'usecase', 'swimlane', 'class', 'er', 'sequence', 'state', 'block', 'c4', 'architecture']

export function plannedGraphFamilyCriteria(input: { family: string; expected: MeaningExpectation }): string[] {
  return graphPaintFamilies.includes(input.family) ? [...(input.expected.groups !== undefined ? ['painted-group-membership'] : []), ...(input.expected.edges?.length ? ['painted-route-visibility'] : [])] : []
}

/** Source facts are obligations, not shape/model metadata. This function runs
 * in the mounted SVG's browser. Its only identity witnesses are painted label
 * ownership, actual outlines, route endpoints, and physical glyph rows. */
export function inspectGraphFamilyPaint(input: { family: string; source: string; expected: MeaningExpectation; paint: PaintEvidence; quantitative?: PaintCheck[] }): { checks: PaintCheck[]; nodes: PaintEvidence['nodes']; connections: PaintEvidence['connections']; groups: NonNullable<PaintEvidence['groups']> } {
  const families = ['flowchart', 'agentflow', 'usecase', 'swimlane', 'class', 'er', 'sequence', 'state', 'block', 'c4', 'architecture']
  if (!families.includes(input.family)) return { checks: [], nodes: input.paint.nodes, connections: input.paint.connections, groups: input.paint.groups ?? [] }
  const svg = document.querySelector('svg'), facts: any = input.expected.facts ?? {}, checks: PaintCheck[] = []
  const add = (criterion: string, expected: unknown, actual: unknown, passed: boolean | null, scope: string) => checks.push({ criterion, expected, actual, status: passed === null ? 'unavailable' : passed ? 'passed' : 'failed', scope })
  const fact = (key: string, actual: unknown, passed: boolean | null, scope: string) => { if (Object.hasOwn(facts, key)) add('source-fact:' + key, facts[key], actual, passed, scope) }
  if (!svg || input.paint.labelRepresentation === 'uninspectable') {
    for (const criterion of [...(input.expected.groups !== undefined ? ['painted-group-membership'] : []), ...(input.expected.edges?.length ? ['painted-route-visibility'] : [])]) add(criterion, criterion === 'painted-group-membership' ? input.expected.groups : input.expected.edges, null, null, 'Source-owned glyph/body inspection is unavailable. Path, use and rasterized labels receive neither positive credit nor a false wrong-text failure.')
    return { checks, nodes: input.paint.nodes, connections: input.paint.connections, groups: input.paint.groups ?? [] }
  }
  type Point = { x: number; y: number }
  type Box = Point & { width: number; height: number }
  type Owned = { id: string; label: string; box: Box; anchorParts?: { tag: string; box: Box }[]; outline?: { tag: string; vertices?: Point[] | null; rx: number; ry: number }; style?: any }
  type Route = { source: string; target: string; directed: boolean; startMarker: string; endMarker: string; startFilled?: boolean; endFilled?: boolean; box?: Box; start?: Point; end?: Point; dash?: string; strokeWidth?: number; labels?: string[]; style?: any }
  const nodes = input.paint.nodes as Owned[], groups = input.paint.groups ?? [], routes = input.paint.connections as Route[], node = new Map(nodes.map(item => [item.id, item])), group = new Map(groups.map(item => [item.id, item]))
  const evidence = new Map([...input.paint.checks, ...(input.quantitative ?? [])].map(item => [item.criterion, item]))
  const normalize = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  const box = (element: Element): Box => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
  const area = (b: Box) => b.width * b.height
  const center = (b: Box): Point => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 })
  const contains = (a: Box, b: Box, e = 1.5) => b.x >= a.x - e && b.y >= a.y - e && b.x + b.width <= a.x + a.width + e && b.y + b.height <= a.y + a.height + e
  const nearBox = (a: Box, b: Box, e = 1.5) => ['x', 'y', 'width', 'height'].every(key => Math.abs(a[key as keyof Box] - b[key as keyof Box]) <= e)
  const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
  const canvas = document.createElement('canvas').getContext('2d')!
  const rgba = (value: string): number[] | null => {
    if (value === 'none' || value === 'transparent') return [0, 0, 0, 0]
    if (!CSS.supports('color', value)) return null
    canvas.clearRect(0, 0, 1, 1); canvas.fillStyle = value; canvas.fillRect(0, 0, 1, 1); return [...canvas.getImageData(0, 0, 1, 1).data]
  }
  const paintable = (element: Element) => {
    let opacity = 1
    for (let current: Element | null = element; current; current = current.parentElement) {
      const s = getComputedStyle(current); opacity *= Number(s.opacity)
      if (['defs', 'marker', 'clipPath', 'mask', 'symbol', 'title', 'desc'].includes(current.localName) || s.display === 'none' || ['hidden', 'collapse'].includes(s.visibility) || opacity < 1 / 255 || s.clipPath !== 'none' || s.maskImage !== 'none' || s.filter !== 'none' && evidence.get('paint-opacity-and-color')?.status !== 'passed' || s.mixBlendMode !== 'normal') return false
      if (current === svg) break
    }
    const s = getComputedStyle(element), fill = rgba(element.namespaceURI === 'http://www.w3.org/2000/svg' ? s.fill : s.color), stroke = rgba(s.stroke)
    return !!fill && !!stroke && Math.max(element.localName === 'line' ? 0 : fill[3]! * Number(s.fillOpacity), stroke[3]! * Number(s.strokeOpacity) * (Number.parseFloat(s.strokeWidth) > 0 ? 1 : 0)) * opacity >= 1 && box(element).width + box(element).height > 0
  }
  const readText = (element: Element): string => {
    if (element.namespaceURI !== 'http://www.w3.org/2000/svg') return (element as HTMLElement).innerText ?? element.textContent ?? ''
    let value = '', previous: Box | null = null
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) { value += child.textContent ?? ''; const range = document.createRange(); range.selectNodeContents(child); const b = range.getBoundingClientRect(); if (b.width && b.height) previous = { x: b.x, y: b.y, width: b.width, height: b.height }; continue }
      if (!(child instanceof Element)) continue
      const b = box(child); if (previous && Math.abs(b.y - previous.y) > Math.max(1, Math.min(b.height, previous.height) * .4)) value += ' '
      value += readText(child); previous = b
    }
    return value
  }
  const text = [...svg.querySelectorAll('text,foreignObject *')].filter(element => normalize(readText(element)) && (element.localName === 'text' || element.namespaceURI !== 'http://www.w3.org/2000/svg' && ![...element.children].some(child => normalize(readText(child)) === normalize(readText(element)))))
  const paintedText = text.filter(paintable)
  const label = (value: string) => paintedText.filter(element => normalize(readText(element)) === normalize(value))
  const opaqueAlternative = !!svg.querySelector('image,use') || [...svg.querySelectorAll('path')].some(path => paintable(path) && getComputedStyle(path).fill !== 'none')
  const geometry = [...svg.querySelectorAll('rect,circle,ellipse,polygon,polyline,path,line')].filter(element => paintable(element) && !input.paint.camouflagedGeometry?.some(item => item.tag === element.localName && nearBox(item.box, box(element)))) as SVGGeometryElement[]
  const strokePaint = (element: Element) => { const css = getComputedStyle(element); return (rgba(css.stroke)?.[3] ?? 0) * Number(css.strokeOpacity) > 0 && Number.parseFloat(css.strokeWidth) > 0 }
  const safeText = (element: Element) => {
    if (!paintable(element) || !contains(box(svg), box(element)) || input.paint.camouflagedText?.some(item => normalize(item.text) === normalize(readText(element)) && nearBox(item.box, box(element)))) return false
    const b = box(element)
    // An overlapping later opaque body may hide glyphs; no source string can
    // stand in for actual paint through the cover.
    return ![...svg.querySelectorAll('rect,circle,ellipse,polygon,path,image,use,foreignObject')].some(cover => {
      if (cover.contains(element) || element.contains(cover) || !(element.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING) || !paintable(cover)) return false
      const fill = rgba(getComputedStyle(cover).fill), c = box(cover)
      if (!['image', 'use', 'foreignObject'].includes(cover.localName) && (!fill || fill[3] === 0 || Number(getComputedStyle(cover).fillOpacity) === 0)) return false
      return Math.min(b.x + b.width, c.x + c.width) - Math.max(b.x, c.x) > .5 && Math.min(b.y + b.height, c.y + c.height) - Math.max(b.y, c.y) > .5
    })
  }
  const ownedText = (id: string) => {
    const owner = node.get(id) ?? group.get(id)
    return owner ? paintedText.filter(element => contains(owner.box, box(element)) && ![...nodes, ...groups].some(other => other.id !== id && area(other.box) < area(owner.box) - 1 && contains(other.box, box(element)))) : null
  }
  const bodies = (id: string) => { const owner = node.get(id) ?? group.get(id); return owner ? geometry.filter(element => nearBox(box(element), owner.box)) : [] }
  const parts = (id: string) => { const owner = node.get(id) ?? group.get(id); return owner ? geometry.filter(element => contains(owner.box, box(element)) && !nodes.some(other => other.id !== id && area(other.box) < area(owner.box) - 1 && contains(other.box, box(element)))) : [] }
  const samples = (element: SVGGeometryElement, count = 128): Point[] => {
    const matrix = element.getScreenCTM(), length = element.getTotalLength()
    return matrix && length > 0 ? Array.from({ length: count + 1 }, (_, index) => { const p = element.getPointAtLength(length * index / count).matrixTransform(matrix); return { x: p.x, y: p.y } }) : []
  }
  const strokes = (element: SVGGeometryElement): Point[][] => {
    const matrix = element.getScreenCTM(); if (!matrix) return []
    if (element.localName !== 'path') return [samples(element, 96)]
    const d = element.getAttribute('d') ?? '', paths = d.match(/[mM][^mM]*/g)
    if (!paths || paths.some(path => path[0] === 'm')) return []
    return paths.map(d => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', d)
      try { const length = path.getTotalLength(); return length > 0 ? Array.from({ length: 97 }, (_, i) => { const point = path.getPointAtLength(length * i / 96).matrixTransform(matrix); return { x: point.x, y: point.y } }) : [] } catch { return [] }
    })
  }
  const straight = (points: Point[]) => points.length > 1 && points.every(p => { const a = points[0]!, b = points.at(-1)!; return Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x) / Math.max(.01, distance(a, b)) <= .6 })
  const relation = (from: string, to: string, caption?: string) => routes.filter(route => (route.source === from && route.target === to || route.source === to && route.target === from) && (!caption || route.labels?.includes(normalize(caption))))
  const ends = (route: Route, id: string) => route.source === id ? route.start : route.target === id ? route.end : undefined
  const solid = (dash?: string) => !dash || dash === 'none' || dash.split(/[ ,]+/).every(value => Number.parseFloat(value) === 0)
  const orderedRoutes = [...routes].sort((a, b) => (a.box?.y ?? Infinity) - (b.box?.y ?? Infinity))
  const routesBound = evidence.get('painted-relationships')?.status === 'passed' && routes.every(route => route.box && route.start && route.end)
  const messagesBound = routesBound && evidence.get('painted-relationship-label-ownership')?.status === 'passed' && orderedRoutes.every((route, i) => route.labels?.length === 1 && (!i || route.box!.y > orderedRoutes[i - 1]!.box!.y + 1))
  let exactNodes = evidence.get('painted-node-ownership')?.status === 'passed'
  const fragmentOwners = new Map<number, Box>()
  const fragmentCaptions = new Map<number, Element>(), noteOwners = new Map<number, Element>()

  const checkGroupMembership = () => { if (input.expected.groups !== undefined) {
    const all = [...nodes, ...groups.filter(item => !node.has(item.id))]
    const observed = all.map(item => {
      const parents = groups.filter(parent => parent.id !== item.id && area(parent.box) > area(item.box) + 1 && contains(parent.box, item.box)).sort((a, b) => area(a.box) - area(b.box))
      return { id: item.id, parent: parents[0]?.id ?? null, ambiguous: parents.length > 1 && Math.abs(area(parents[0]!.box) - area(parents[1]!.box)) <= 1 }
    })
    const expected = (input.expected.groups ?? []).flatMap(parent => parent.members.map(id => ({ id, parent: parent.id }))).sort((a, b) => a.id.localeCompare(b.id))
    const actual = observed.filter(item => item.parent !== null).map(({ id, parent }) => ({ id, parent })).sort((a, b) => a.id.localeCompare(b.id))
    const ready = exactNodes && groups.length === input.expected.groups.length && (input.expected.groups ?? []).every(item => group.has(item.id)) && !observed.some(item => item.ambiguous)
    add('painted-group-membership', expected, actual, ready ? same(expected, actual) : null, 'Exact immediate parent ownership follows the smallest enclosing painted boundary, including nested groups and outsider nodes. Descendant containment alone cannot prove immediate membership. Anonymous/unbound containers and coincident boundaries remain unknown.')
  } }

  // Symbol classification uses measured silhouettes, independent of element
  // classes, data attributes, generated IDs, or renderer shape strings.
  const aliases: Record<string, string> = { task: 'rounded', input: 'parallelogram', tool: 'subroutine', refdoc: 'lined-document', action: 'hexagon', rect: 'rectangle', round: 'rounded', diam: 'diamond', decision: 'diamond', hex: 'hexagon', odd: 'asymmetric', cyl: 'cylinder', 'dbl-circ': 'double-circle', 'lean-r': 'parallelogram', 'lean-l': 'parallelogram-alt', 'trap-b': 'trapezoid', 'trap-t': 'trapezoid-alt', subproc: 'subroutine', 'fr-rect': 'subroutine', procs: 'processes', docs: 'documents', doc: 'document', 'lin-rect': 'lined-rectangle', 'lin-doc': 'lined-document', 'lin-cyl': 'lined-cylinder', 'sm-circ': 'small-circle', 'f-circ': 'filled-circle', 'framed-circle': 'double-circle', 'cross-circ': 'crossed-circle', 'notch-rect': 'notched-rectangle', 'notch-pent': 'notched-pentagon', tri: 'triangle', 'flip-tri': 'inverted-triangle', 'sl-rect': 'sloped-rectangle', 'curv-trap': 'curved-trapezoid', 'div-rect': 'divided-rectangle', 'tag-rect': 'tagged-rectangle', 'tag-doc': 'tagged-document', 'win-pane': 'window-pane', 'bow-rect': 'bowtie-rectangle', bolt: 'lightning-bolt', 'manual-file': 'inverted-triangle', 'manual-input': 'sloped-rectangle' }
  const polygonTemplates: Record<string, Point[]> = {
    rectangle: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
    diamond: [{ x: .5, y: 0 }, { x: 1, y: .5 }, { x: .5, y: 1 }, { x: 0, y: .5 }],
    triangle: [{ x: .5, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
    'inverted-triangle': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: .5, y: 1 }],
    hexagon: [{ x: .15, y: 0 }, { x: .85, y: 0 }, { x: 1, y: .5 }, { x: .85, y: 1 }, { x: .15, y: 1 }, { x: 0, y: .5 }],
    asymmetric: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: .15, y: .5 }],
    parallelogram: [{ x: .15, y: 0 }, { x: 1, y: 0 }, { x: .85, y: 1 }, { x: 0, y: 1 }],
    'parallelogram-alt': [{ x: 0, y: 0 }, { x: .85, y: 0 }, { x: 1, y: 1 }, { x: .15, y: 1 }],
    trapezoid: [{ x: .15, y: 0 }, { x: .85, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
    'trapezoid-alt': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: .85, y: 1 }, { x: .15, y: 1 }],
    'sloped-rectangle': [{ x: 0, y: .15 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
    'notched-rectangle': [{ x: .15, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: .2 }],
    'notched-pentagon': [{ x: .1, y: 0 }, { x: .9, y: 0 }, { x: 1, y: .2 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: .2 }],
    hourglass: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  }
  const vertices = (element: SVGGeometryElement): Point[] | null => {
    const matrix = element.getScreenCTM(); if (!matrix) return null
    if (element.localName === 'polygon' || element.localName === 'polyline') return [...(element as SVGPolygonElement).points].map(p => { const point = new DOMPoint(p.x, p.y).matrixTransform(matrix); return { x: point.x, y: point.y } })
    if (element.localName === 'rect' && (element as SVGRectElement).rx.baseVal.value === 0 && (element as SVGRectElement).ry.baseVal.value === 0) { const b = box(element); return [{ x: b.x, y: b.y }, { x: b.x + b.width, y: b.y }, { x: b.x + b.width, y: b.y + b.height }, { x: b.x, y: b.y + b.height }] }
    if (element.localName !== 'path' || /[a-cqstv]/i.test((element.getAttribute('d') ?? '').replace(/[eE][-+]?\d+/g, ''))) return null
    const points = samples(element, 1024), kept: Point[] = []
    const simplify = (values: Point[], epsilon: number): Point[] => {
      if (values.length <= 2) return values
      const a = values[0]!, b = values.at(-1)!, dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy)
      const distances = values.map(p => length ? Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / length : distance(a, p)), max = Math.max(...distances), index = distances.indexOf(max)
      return max > epsilon ? [...simplify(values.slice(0, index + 1), epsilon).slice(0, -1), ...simplify(values.slice(index), epsilon)] : [a, b]
    }
    kept.push(...simplify(points, .3)); if (kept.length > 1 && distance(kept[0]!, kept.at(-1)!) < .5) kept.pop()
    return kept
  }
  const actorProfiles = new Map<string, { kind: string; box: Box; ink: SVGGeometryElement[] }>()
  const actorKind = (ink: SVGGeometryElement[]): { kind: string; box: Box; ink: SVGGeometryElement[] } | null => {
    const contours = ink.flatMap(element => strokes(element).map(points => ({ element, points }))).filter(item => item.points.length > 3)
    const bounds = (points: Point[]): Box => { const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y)); return { x, y, width: Math.max(...points.map(p => p.x)) - x, height: Math.max(...points.map(p => p.y)) - y } }
    const round = (points: Point[]) => { const b = bounds(points); return b.width > 4 && Math.abs(b.width - b.height) < 1 && points.every(p => Math.abs(((p.x - b.x) / b.width - .5) ** 2 * 4 + ((p.y - b.y) / b.height - .5) ** 2 * 4 - 1) < .07) }
    const heads = contours.filter(item => round(item.points))
    if (heads.length !== 1) return null
    const head = heads[0]!, h = bounds(head.points), c = center(h), others = contours.filter(item => item !== head), lines = others.filter(item => straight(item.points) && strokePaint(item.element)).map(item => ({ a: item.points[0]!, b: item.points.at(-1)! }))
    const spine = lines.filter(line => Math.abs(line.a.x - c.x) < 1 && Math.abs(line.b.x - c.x) < 1 && Math.min(line.a.y, line.b.y) >= h.y + h.height - 2), arms = lines.filter(line => Math.abs(line.a.y - line.b.y) < 1 && Math.min(line.a.x, line.b.x) < c.x - 2 && Math.max(line.a.x, line.b.x) > c.x + 2)
    const legs = spine.length === 1 ? lines.filter(line => [line.a, line.b].some(p => distance(p, { x: c.x, y: Math.max(spine[0]!.a.y, spine[0]!.b.y) }) < 1) && Math.abs(line.a.x - line.b.x) > 3 && Math.abs(line.a.y - line.b.y) > 3) : []
    let kind: string | null = spine.length === 1 && arms.length === 1 && legs.length === 2 && others.length === 4 ? 'actor-stick' : null
    if (!kind && others.length === 1) {
      const torso = others[0]!, b = bounds(torso.points), css = getComputedStyle(torso.element), filled = (rgba(css.fill)?.[3] ?? 0) * Number(css.fillOpacity) > 0
      if (b.y >= h.y + h.height - 2 && b.width > h.width * 1.3 && b.height > h.height * .8) {
        if (!filled && vertices(torso.element)?.length! >= 10) kind = 'actor-hollow'
        else if (filled && !straight(torso.points) && /[cCqQ]/.test(torso.element.getAttribute('d') ?? '')) kind = 'actor-awesome'
      }
    }
    if (!kind) return null
    return { kind, box: bounds(contours.flatMap(item => item.points)), ink }
  }
  if (input.family === 'usecase') {
    for (const expected of input.expected.nodes ?? []) {
      const requested = (facts['node-shapes'] ?? []).find((entry: any) => entry.id === expected.id)?.shape
      if (!String(requested).startsWith('actor-')) continue
      const occurrences = label(expected.label).filter(safeText)
      if (occurrences.length !== 1) continue
      const textBox = box(occurrences[0]!)
      for (let ancestor: Element | null = occurrences[0]!.parentElement; ancestor && ancestor !== svg; ancestor = ancestor.parentElement) {
        if ((input.expected.nodes ?? []).some(other => other.id !== expected.id && label(other.label).some(element => ancestor!.contains(element)))) break
        const ink = geometry.filter(element => ancestor!.contains(element) && box(element).y + box(element).height <= textBox.y + 2 && Math.abs(center(box(element)).x - center(textBox).x) <= Math.max(35, textBox.width / 2) && textBox.y - box(element).y - box(element).height <= 100)
        const observed = actorKind(ink)
        if (!observed || textBox.y - observed.box.y - observed.box.height > Math.max(20, textBox.height * 2)) continue
        actorProfiles.set(expected.id, observed)
        if (!node.has(expected.id)) { const actual: Owned = { ...expected, box: observed.box, anchorParts: observed.ink.map(element => ({ tag: element.localName, box: box(element) })), outline: { tag: 'compound-actor', vertices: null, rx: 0, ry: 0 } }; nodes.push(actual); node.set(expected.id, actual) }
        break
      }
    }
    if (actorProfiles.size && (input.expected.nodes ?? []).every(expected => node.has(expected.id))) {
      exactNodes = evidence.get('painted-node-ownership')?.status !== 'failed'
      add('painted-node-ownership', input.expected.nodes, nodes, exactNodes ? true : null, 'An external actor label owns a unique nearby measured head/torso/limb glyph within the smallest ancestor containing no other authored node label. The circle, spine, arms and two connected legs or hollow/filled torso establish its body. Invisible layout rectangles, generated IDs and actor CSS classes supply no ownership.')
    }
  }
  const silhouette = (id: string, raw: string): { matches: boolean | null; actual: unknown } => {
    if (raw.startsWith('actor-')) { const observed = actorProfiles.get(id); return { matches: observed ? observed.kind === raw : null, actual: observed ? { kind: observed.kind, box: observed.box } : null } }
    const wanted = aliases[raw] ?? raw, owner = node.get(id), candidates = bodies(id)
    if (!owner || !candidates.length) return { matches: null, actual: null }
    const body = candidates[0]!, b = owner.box, outline = owner.outline, ink = parts(id)
    const normalized = (vertices(body) ?? []).map(p => ({ x: (p.x - b.x) / b.width, y: (p.y - b.y) / b.height }))
    const polygon = (template: Point[]) => {
      if (normalized.length !== template.length) return false
      const coordinate = (expected: number, actual: number, extent: number) => [0, .5, 1].includes(expected) ? Math.abs(expected - actual) <= Math.min(.03, 1.5 / extent) : expected < .5 ? actual > Math.min(.005, .5 / extent) && actual < .49 : actual > .51 && actual < 1 - Math.min(.005, .5 / extent)
      return normalized.some((_, offset) => [1, -1].some(direction => template.every((p, i) => { const q = normalized[(offset + i * direction + normalized.length) % normalized.length]!; return coordinate(p.x, q.x, b.width) && coordinate(p.y, q.y, b.height) })))
    }
    const ellipse = ['circle', 'ellipse'].includes(body.localName) || (() => { const ps = samples(body); return ps.length > 20 && ps.every(p => Math.abs(((p.x - b.x) / b.width - .5) ** 2 * 4 + ((p.y - b.y) / b.height - .5) ** 2 * 4 - 1) < .055) })()
    const actual = { tag: body.localName, vertices: normalized, parts: ink.map(element => ({ tag: element.localName, box: box(element) })) }
    if (wanted === 'rectangle' && body.localName === 'rect') return { matches: !outline || Math.max(outline.rx / b.width, outline.ry / b.height) < .49, actual }
    if (polygonTemplates[wanted]) return { matches: normalized.length ? polygon(polygonTemplates[wanted]!) : ['rect', 'circle', 'ellipse'].includes(body.localName) || ellipse ? false : null, actual }
    if (wanted === 'circle' || wanted === 'ellipse' || wanted === 'small-circle' || wanted === 'filled-circle') return { matches: ellipse && (wanted === 'ellipse' || Math.abs(b.width - b.height) < Math.max(2, b.width * .02)) && (wanted !== 'filled-circle' || (rgba(getComputedStyle(body).fill)?.[3] ?? 0) > 0), actual }
    if (wanted === 'rounded' || wanted === 'stadium') { const ratio = outline?.tag === 'rect' ? Math.max(outline.rx / b.width, outline.ry / b.height) : null; return { matches: ratio === null ? null : wanted === 'stadium' ? ratio >= .48 : ratio > .01 && ratio < .48, actual: { ...actual, cornerRatio: ratio } } }
    if (wanted === 'double-circle' || wanted === 'crossed-circle') {
      const rings = ink.filter(element => ['circle', 'ellipse'].includes(element.localName) && distance(center(box(element)), center(b)) <= 1.5 && Math.abs(box(element).width - box(element).height) < 2)
      const diagonals = ink.filter(element => { const ps = samples(element, 2); return ps.length === 3 && distance(ps[0]!, ps[2]!) > Math.min(b.width, b.height) * .6 && distance(ps[1]!, { x: (ps[0]!.x + ps[2]!.x) / 2, y: (ps[0]!.y + ps[2]!.y) / 2 }) < 1 && distance(ps[1]!, center(b)) < 2 })
      return { matches: wanted === 'double-circle' ? rings.length === 2 && Math.abs(box(rings[0]!).width - box(rings[1]!).width) > 2 : rings.length === 1 && diagonals.length === 2, actual }
    }
    if (wanted === 'subroutine' || wanted === 'lined-rectangle' || wanted === 'divided-rectangle' || wanted === 'window-pane') {
      const segments = ink.filter(strokePaint).flatMap(element => { const points = element.localName === 'path' && (element.getAttribute('d')?.match(/[mM]/g)?.length ?? 0) > 1 ? null : vertices(element), closed = ['polygon', 'rect'].includes(element.localName) || /z\s*$/i.test(element.getAttribute('d') ?? ''); return points ? points.slice(0, closed ? points.length : -1).map((p, i) => [p, points[(i + 1) % points.length]!]) : strokes(element).filter(straight).map(points => [points[0]!, points.at(-1)!]) })
      const vertical = segments.filter(([a, c]) => Math.abs(a!.x - c!.x) < 1 && Math.abs(a!.y - c!.y) > b.height * .65 && a!.x > b.x + 1 && a!.x < b.x + b.width - 1), horizontal = segments.filter(([a, c]) => Math.abs(a!.y - c!.y) < 1 && Math.abs(a!.x - c!.x) > b.width * .65 && a!.y > b.y + 1 && a!.y < b.y + b.height - 1)
      const frame = normalized.length >= 4 && polygonTemplates.rectangle!.every(p => normalized.some(q => Math.abs(p.x - q.x) < .02 && Math.abs(p.y - q.y) < .02))
      return { matches: normalized.length ? frame && (wanted === 'subroutine' ? vertical.length === 2 : wanted === 'lined-rectangle' ? vertical.length === 1 : wanted === 'divided-rectangle' ? horizontal.length === 1 : horizontal.length === 1 && vertical.length === 1) : null, actual }
    }
    if (['cylinder', 'lined-cylinder', 'document', 'lined-document', 'paper-tape', 'flag', 'delay', 'curved-trapezoid', 'bowtie-rectangle', 'das'].includes(wanted)) {
      const points = samples(body, 2048).map(p => ({ x: (p.x - b.x) / b.width, y: (p.y - b.y) / b.height }))
      const intersections = (axis: 'x' | 'y', at: number) => {
        const other = axis === 'x' ? 'y' : 'x', values: number[] = []
        for (let i = 1; i < points.length; i++) { const a = points[i - 1]!, c = points[i]!, span = c[axis] - a[axis]; if (Math.abs(span) < 1e-8 || at < Math.min(a[axis], c[axis]) || at > Math.max(a[axis], c[axis])) continue; const value = a[other] + (at - a[axis]) / span * (c[other] - a[other]); if (!values.some(other => Math.abs(other - value) < .008)) values.push(value) }
        return values.sort((a, b) => a - b)
      }
      const ticks = Array.from({ length: 9 }, (_, i) => (i + 1) / 10), xs = ticks.map(value => intersections('x', value)), ys = ticks.map(value => intersections('y', value)), top = xs.map(values => values[0]!), bottom = xs.map(values => values.at(-1)!), left = ys.map(values => values[0]!), right = ys.map(values => values.at(-1)!)
      if ([...xs, ...ys].some(values => values.length < 2)) return { actual: { ...actual, xs, ys }, matches: null }
      const range = (values: number[]) => Math.max(...values) - Math.min(...values), symmetric = (values: number[]) => values.every((value, i) => Math.abs(value - values[values.length - 1 - i]!) <= .025), flat = (values: number[]) => range(values) < .012
      const wave = (values: number[]) => { const changes = values.slice(1, -1).map((value, i) => values[i]! - 2 * value + values[i + 2]!); return range(values) > .035 && changes.some(value => value > .003) && changes.some(value => value < -.003) }
      const verticalRuns: { x: number; span: number }[] = []
      for (const element of ink.filter(strokePaint)) for (const stroke of strokes(element)) {
        let start = 0
        for (let i = 1; i <= stroke.length; i++) if (i === stroke.length || Math.abs(stroke[i]!.x - stroke[i - 1]!.x) > .1) {
          const run = stroke.slice(start, i), span = run.length ? Math.max(...run.map(p => p.y)) - Math.min(...run.map(p => p.y)) : 0
          if (span > b.height * .4) verticalRuns.push({ x: (run[0]!.x - b.x) / b.width, span: span / b.height }); start = i
        }
      }
      const interiorVertical = [...new Set(verticalRuns.filter(run => run.x > .015 && run.x < .3).map(run => Math.round(run.x * 100)))].length, cylinder = symmetric(top) && symmetric(bottom) && top[4]! < Math.min(top[0]!, top[8]!) - .02 && bottom[4]! > Math.max(bottom[0]!, bottom[8]!) + .02 && flat(left.slice(2, -2)) && flat(right.slice(2, -2)) && xs.slice(2, -2).every(values => values.length >= 3)
      let measured: string | null = null
      if (cylinder) measured = interiorVertical ? 'lined-cylinder' : 'cylinder'
      else if (flat(top) && wave(bottom) && flat(left.slice(2, -2)) && flat(right.slice(2, -2))) measured = interiorVertical ? 'lined-document' : 'document'
      else if (wave(top) && wave(bottom) && flat(left.slice(2, -2)) && flat(right.slice(2, -2))) measured = 'paper-tape'
      else if (flat(top.slice(0, 3)) && flat(bottom.slice(0, 3)) && flat(left) && symmetric(right) && right[4]! > Math.max(right[0]!, right[8]!) + .02) measured = 'delay'
      else if (symmetric(left) && symmetric(right) && left[4]! < Math.min(left[0]!, left[8]!) - .02 && right[4]! > Math.max(right[0]!, right[8]!) + .02 && ys.slice(2, -2).every(values => values.length >= 3)) measured = 'das'
      else if (flat(top) && flat(bottom) && symmetric(left) && symmetric(right) && left[4]! > Math.max(left[0]!, left[8]!) + .015 && right[4]! < Math.min(right[0]!, right[8]!) - .015) measured = 'bowtie-rectangle'
      const requested = wanted === 'flag' ? 'paper-tape' : wanted, recognizedOther = ['rect', 'circle', 'ellipse'].includes(body.localName) || normalized.length > 0 && normalized.length <= 6
      return { actual: { ...actual, measured, top, bottom, left, right, interiorVertical }, matches: measured ? measured === requested : recognizedOther ? false : null }
    }
    // Curved compound/symbolic profiles require explicit topology evidence;
    // a bounding box or source shape string cannot silently satisfy them.
    return { matches: null, actual }
  }
  if (input.family === 'state') {
    let compositeAdded = false
    for (const entry of facts['state-kinds'] ?? []) if (entry.kind === 'composite-state' && !node.has(entry.id) && group.has(entry.id)) {
      const owner = group.get(entry.id)!, ink = geometry.filter(shape => nearBox(box(shape), owner.box))
      if (!ink.length || label(owner.label).filter(element => contains(owner.box, box(element)) && safeText(element)).length !== 1) continue
      const actual: Owned = { id: entry.id, label: owner.label, box: owner.box, anchorParts: ink.map(element => ({ tag: element.localName, box: box(element) })), outline: { tag: ink[0]!.localName, vertices: vertices(ink[0]!), rx: 0, ry: 0 } }; node.set(entry.id, actual); nodes.push(actual); compositeAdded = true
    }
    const missing = (input.expected.nodes ?? []).filter(expected => !expected.label && !node.has(expected.id)), blankCandidates: { shape: SVGGeometryElement; parts: SVGGeometryElement[]; box: Box; kind: string; index: number }[] = []
    const round = (element: SVGGeometryElement) => { const b = box(element), points = samples(element, 128); return b.width > 2 && b.width <= 50 && Math.abs(b.width - b.height) < 1.5 && points.length > 20 && points.every(p => Math.abs(((p.x - b.x) / b.width - .5) ** 2 * 4 + ((p.y - b.y) / b.height - .5) ** 2 * 4 - 1) < .07) }
    for (const shape of geometry) {
      const b = box(shape)
      if (nodes.some(owner => contains(owner.box, b)) || paintedText.some(element => contains(b, box(element))) || blankCandidates.some(candidate => nearBox(candidate.box, b))) continue
      if (round(shape)) {
        if (geometry.some(other => other !== shape && round(other) && contains(box(other), b, 0) && area(box(other)) > area(b) + 1)) continue
        const inner = geometry.filter(other => other !== shape && round(other) && distance(center(box(other)), center(b)) < 1 && area(box(other)) < area(b) - 1)
        const filled = (element: Element) => {
          const css = getComputedStyle(element), ink = rgba(css.fill), b = box(element)
          if (!ink || ink[3] !== 255 || Number(css.fillOpacity) < .999) return false
          const backdrops = geometry.filter(other => other !== element && area(box(other)) > area(b) + 1 && contains(box(other), b) && !!(other.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) && rgba(getComputedStyle(other).fill)?.[3] === 255 && Number(getComputedStyle(other).fillOpacity) === 1)
          let backdrop = backdrops.length ? rgba(getComputedStyle(backdrops.at(-1)!).fill) : null
          if (!backdrop) { for (let parent: Element | null = svg; parent; parent = parent.parentElement) { const color = rgba(getComputedStyle(parent).backgroundColor); if (color?.[3] === 255) { backdrop = color; break } } }
          return !same(ink, backdrop ?? [255, 255, 255, 255])
        }
        const kind = inner.length && inner.some(filled) ? 'pseudostate-end' : filled(shape) ? 'pseudostate-start' : 'unclassified-round'
        if (kind) blankCandidates.push({ shape, parts: [shape, ...inner], box: b, kind, index: blankCandidates.length })
      } else {
        const points = vertices(shape), norm = points?.map(p => ({ x: (p.x - b.x) / b.width, y: (p.y - b.y) / b.height })), diamond = norm?.length === 4 && polygonTemplates.diamond!.every(p => norm.some(q => distance(p, q) <= .04))
        const bar = shape.localName === 'rect' && Math.min(b.width, b.height) >= 2 && Math.max(b.width, b.height) >= Math.min(b.width, b.height) * 4 && (rgba(getComputedStyle(shape).fill)?.[3] ?? 0) > 0
        if (diamond || bar) blankCandidates.push({ shape, parts: [shape], box: b, kind: diamond ? 'choice' : 'bar', index: blankCandidates.length })
      }
    }
    const kinds = new Map((facts['state-kinds'] ?? []).map((entry: any) => [entry.id, entry.kind])), pseudoScope = new Map((facts.pseudostates ?? []).map((entry: any) => [entry.id, entry.scope]))
    const pointDistance = (p: Point, shapes: SVGGeometryElement[]) => Math.min(...shapes.flatMap(shape => samples(shape, 128)).map(q => distance(p, q)))
    const allBodies = [...nodes.map(owner => ({ key: owner.id, parts: bodies(owner.id), box: owner.box })), ...blankCandidates.map(candidate => ({ key: '[glyph:' + candidate.index + ']', parts: candidate.parts, box: candidate.box }))]
    const measured = geometry.filter(element => ['path', 'line', 'polyline'].includes(element.localName) && !allBodies.some(owner => owner.parts.includes(element) || contains(owner.box, box(element))) && element.getTotalLength() > 8).map(element => {
      const ps = samples(element, 128), first = ps[0], last = ps.at(-1)
      const bind = (p: Point | undefined) => p ? allBodies.map(owner => ({ owner, d: pointDistance(p, owner.parts) })).filter(item => item.d <= 8).sort((a, b) => a.d - b.d) : []
      const a = bind(first), b = bind(last)
      return a[0] && b[0] && (!a[1] || a[1].d - a[0].d > 1) && (!b[1] || b[1].d - b[0].d > 1) && a[0].owner.key !== b[0].owner.key ? { element, source: a[0].owner.key, target: b[0].owner.key, start: first!, end: last!, box: box(element) } : null
    }).filter((item): item is NonNullable<typeof item> => !!item)
    const choices = missing.map(expected => ({ expected, choices: blankCandidates.filter(candidate => {
      const wanted = kinds.get(expected.id), kindOkay = wanted === 'fork' || wanted === 'join' ? candidate.kind === 'bar' : candidate.kind === wanted
      const parents = groups.filter(owner => contains(owner.box, candidate.box)).sort((a, b) => area(a.box) - area(b.box)), scope = pseudoScope.get(expected.id)
      return kindOkay && (scope === undefined || scope === 'root' ? scope === undefined || !parents.length : parents[0]?.id === scope)
    }) }))
    const mappings: Map<string, number>[] = [], visit = (index: number, mapped: Map<string, number>, used: Set<number>) => {
      if (mappings.length > 1) return
      if (index === choices.length) { mappings.push(new Map(mapped)); return }
      for (const candidate of choices[index]!.choices) {
        if (used.has(candidate.index)) continue
        const id = choices[index]!.expected.id, key = '[glyph:' + candidate.index + ']', lookup = (id: string) => mapped.has(id) ? '[glyph:' + mapped.get(id) + ']' : node.has(id) ? id : id === choices[index]!.expected.id ? key : null
        const valid = (input.expected.edges ?? []).filter(edge => edge.source === id || edge.target === id).every(edge => { const a = lookup(edge.source), b = lookup(edge.target); return !a || !b || measured.some(route => route.source === a && route.target === b || route.source === b && route.target === a) })
        if (valid) { mapped.set(id, candidate.index); used.add(candidate.index); visit(index + 1, mapped, used); used.delete(candidate.index); mapped.delete(id) }
      }
    }
    if (missing.length && choices.every(item => item.choices.length > 0) && choices.reduce((product, item) => product * item.choices.length, 1) <= 10000) visit(0, new Map(), new Set())
    if (mappings.length === 1) {
      for (const [id, index] of mappings[0]!) {
        const candidate = blankCandidates[index]!, css = getComputedStyle(candidate.shape), outline = { tag: candidate.shape.localName, vertices: vertices(candidate.shape), rx: 0, ry: 0 }, observed: Owned = { id, label: '', box: candidate.box, anchorParts: candidate.parts.map(element => ({ tag: element.localName, box: box(element) })), outline, style: { fill: css.fill, fillOpacity: Number(css.fillOpacity), stroke: css.stroke, strokeOpacity: Number(css.strokeOpacity), strokeWidth: Number.parseFloat(css.strokeWidth), dash: css.strokeDasharray, opacity: Number(css.opacity) } }
        nodes.push(observed); node.set(id, observed)
      }
      exactNodes = (input.expected.nodes ?? []).every(expected => node.has(expected.id)) && mappings[0]!.size === blankCandidates.length
      add('painted-node-ownership', input.expected.nodes, nodes, exactNodes ? true : null, 'Unlabelled state glyphs are first measured as filled discs, concentric final circles, diamonds or bars; a unique adjacency-and-smallest-scope matching then assigns source identities. No public ID or class string chooses a glyph. Extra, unbound or symmetric glyph assignments remain unknown.')
    }
    if (!missing.length && compositeAdded && (input.expected.nodes ?? []).every(expected => node.has(expected.id))) {
      exactNodes = evidence.get('painted-node-ownership')?.status !== 'failed'
      add('painted-node-ownership', input.expected.nodes, nodes, exactNodes ? true : null, 'A composite state has a unique painted state header and the same actual enclosing boundary used for independently qualified group membership. The source identity is assigned only after this visible dual role is established; no surrounding unrelated cluster can become an ordinary state body.')
    }
    const actual = (facts['state-kinds'] ?? []).map((entry: any) => {
      const owner = node.get(entry.id), mapped = mappings[0]?.get(entry.id), candidate = mapped !== undefined && mappings.length === 1 ? blankCandidates[mapped] : null
      const shape = entry.kind === 'state' ? silhouette(entry.id, 'rectangle') : null
      return { id: entry.id, expected: entry.kind, actual: candidate?.kind ?? (group.has(entry.id) ? 'composite-state' : shape?.matches === true ? 'state' : null), box: owner?.box ?? null }
    })
    fact('state-kinds', actual, actual.every((entry: any) => entry.actual !== null && (entry.actual !== 'bar' || routesBound)) ? actual.every((entry: any) => entry.expected === entry.actual || ['fork', 'join'].includes(entry.expected) && entry.actual === 'bar') : null, 'Every ordinary/composite state and blank pseudostate owns its actual measured body. Ordinary states allow rectangle-family cosmetic corners. Start/final/choice/bar topology is independent of labels and renderer names; fork versus join additionally requires the complete source-owned directed route proof.')
    if (Array.isArray(facts.pseudostates)) {
      const actual = facts.pseudostates.map((entry: any) => { const owner = node.get(entry.id), parents = owner ? groups.filter(parent => contains(parent.box, owner.box)).sort((a, b) => area(a.box) - area(b.box)) : []; return { id: entry.id, kind: actualStateKind(entry.id), scope: parents[0]?.id ?? 'root', bound: !!owner } })
      function actualStateKind(id: string) { const index = mappings[0]?.get(id); return index !== undefined && mappings.length === 1 ? blankCandidates[index]!.kind.replace('pseudostate-', '') : null }
      fact('pseudostates', actual, actual.every((entry: any) => entry.bound && entry.kind) ? actual.every((entry: any, i: number) => entry.kind === facts.pseudostates[i].kind && entry.scope === facts.pseudostates[i].scope) : null, 'Pseudostate kind and scope follow actual disc/ring geometry and the smallest painted composite boundary. Unique observed adjacency assigns otherwise unlabelled source roles; indistinguishable symmetric roles remain unknown.')
    }
  }

  if (input.family === 'block') {
    const pending = (input.expected.groups ?? []).filter(expected => !expected.label && !group.has(expected.id)), assigned = new Set(groups.flatMap(owner => geometry.filter(shape => nearBox(box(shape), owner.box))))
    const descendants = (id: string, seen = new Set<string>()): string[] => { if (seen.has(id)) return []; const expected = input.expected.groups?.find(owner => owner.id === id); return expected ? expected.members.flatMap(member => descendants(member, new Set([...seen, id]))) : [id] }
    for (let pass = 0; pass < pending.length; pass++) for (const expected of pending) {
      if (group.has(expected.id)) continue
      const children = expected.members.map(id => node.get(id) ?? group.get(id)), leaves = descendants(expected.id)
      if (!children.length || children.some(child => !child) || leaves.some(id => !node.has(id))) continue
      const candidates = geometry.filter(shape => {
        const b = box(shape), closed = ['rect', 'polygon', 'circle', 'ellipse'].includes(shape.localName) || /z\s*$/i.test(shape.getAttribute('d') ?? '')
        return closed && strokePaint(shape) && !assigned.has(shape) && !nodes.some(owner => nearBox(owner.box, b)) && children.every(child => area(b) > area(child!.box) + 1 && contains(b, child!.box)) && nodes.every(owner => leaves.includes(owner.id) || !contains(b, owner.box))
      }).sort((a, b) => area(box(a)) - area(box(b)))
      if (!candidates[0] || candidates[1] && Math.abs(area(box(candidates[0])) - area(box(candidates[1]))) < 1) continue
      const selected = candidates[0], actual = { id: expected.id, label: '', box: box(selected) }; groups.push(actual); group.set(expected.id, actual); assigned.add(selected)
      add('painted-group:' + expected.id, expected.members, { box: actual.box, children: children.map(child => ({ id: child!.id, box: child!.box })) }, true, 'An anonymous block container owns the unique smallest visible closed boundary enclosing its exact independently owned descendants, including already bound child groups and excluding outsider nodes. Source group IDs are assigned only after this physical membership match; invisible layout rectangles and unbound/empty containers receive no credit.')
    }
  }
  if (input.family === 'state' && Array.isArray(facts['parallel-regions'])) {
    const actual = [...new Set(facts['parallel-regions'].map((entry: any) => entry.scope))].map(scope => {
      const expected = facts['parallel-regions'].filter((entry: any) => entry.scope === scope).sort((a: any, b: any) => a.region - b.region), owner = group.get(String(scope)) ?? node.get(String(scope))
      if (!owner) return { scope, regions: null, matches: null }
      const b = owner.box, dividers = geometry.filter(element => strokePaint(element) && !solid(getComputedStyle(element).strokeDasharray) && contains(b, box(element)) && strokes(element).length === 1 && strokes(element).every(straight)), horizontal = dividers.filter(element => box(element).width > b.width * .65 && box(element).height < 1 && box(element).y > b.y + 5 && box(element).y < b.y + b.height - 5), vertical = dividers.filter(element => box(element).height > b.height * .65 && box(element).width < 1 && box(element).x > b.x + 5 && box(element).x < b.x + b.width - 5)
      const axis = horizontal.length === expected.length - 1 && !vertical.length ? 'y' : vertical.length === expected.length - 1 && !horizontal.length ? 'x' : null
      if (!axis) return { scope, regions: null, matches: null }
      const boundaries = [b[axis], ...(axis === 'y' ? horizontal : vertical).map(element => box(element)[axis]).sort((a, b) => a - b), b[axis] + b[axis === 'y' ? 'height' : 'width']], expectedMembers = expected.flatMap((entry: any) => entry.members), owned = expectedMembers.map((id: string) => node.get(id) ?? group.get(id))
      if (owned.some((owner: any) => !owner)) return { scope, regions: null, matches: null }
      const regions = expected.map((entry: any, index: number) => ({ region: entry.region, members: owned.filter((owner: any) => center(owner.box)[axis] > boundaries[index]! && center(owner.box)[axis] < boundaries[index + 1]!).map((owner: any) => owner.id).sort(), within: owned.filter((owner: any) => entry.members.includes(owner.id)).every((owner: any) => owner.box[axis] >= boundaries[index]! - 1.5 && owner.box[axis] + owner.box[axis === 'y' ? 'height' : 'width'] <= boundaries[index + 1]! + 1.5) }))
      return { scope, axis, boundaries, regions, matches: regions.every((region: any, i: number) => region.within && same(region.members, [...expected[i].members].sort())) }
    })
    fact('parallel-regions', actual, actual.some((entry: any) => entry.matches === false) ? false : actual.some((entry: any) => entry.matches === null) ? null : true, 'Actual dashed partition strokes divide a measured composite boundary into exact source-ordered parallel regions. Every owned state/pseudostate must lie wholly in its corresponding region. Exact divider count, geometric scope and member multisets are required; source region indices and generated SVG region IDs cannot supply the partition.')
  }

  if (Array.isArray(facts['node-shapes'])) {
    const observed = facts['node-shapes'].map((entry: any) => ({ id: entry.id, expected: entry.shape, ...silhouette(entry.id, entry.shape) }))
    // Primitive profiles already have the established ordinary/rounded skin
    // distinction. Only replace the previously unavailable compound profile.
    if (observed.some((entry: any) => !['rectangle', 'rounded', 'circle', 'ellipse', 'diamond'].includes(entry.expected))) fact('node-shapes', observed, observed.every((entry: any) => entry.matches !== null) ? observed.every((entry: any) => entry.matches) : null, 'Every source node owns an actual measured silhouette. Closed polygons compare cyclic corner topology, extrema and centerline positions within 1.5 CSS pixels while allowing variable inset proportions; reversed contour winding is equivalent, crossing and noncrossing contours are distinct. Compound circles and framed rectangles require their internal ink. Source names, SVG classes and renderer models supply no shape credit.')
  }

  if (Array.isArray(facts['authored-style']) && facts['authored-style'].every((entry: any) => ['style', 'class', 'classDef', 'linkStyle'].includes(entry.kind))) {
    const definitions = new Map<string, any[]>(), classes = new Map<string, string[]>(), requests = new Map<string, Map<string, string>>()
    const ids = (value: string) => value.split(/\s*,\s*/).filter(Boolean)
    const apply = (id: string, attributes: any[]) => { const properties = requests.get(id) ?? new Map<string, string>(); for (const attribute of attributes) if (attribute.property && typeof attribute.value === 'string') properties.set(attribute.property, attribute.value); else properties.set('[unparsed]', JSON.stringify(attribute)); requests.set(id, properties) }
    for (const entry of facts['node-attributes'] ?? []) if (entry.attributes?.classes) classes.set(entry.id, ids(entry.attributes.classes))
    for (const entry of facts['state-classes'] ?? []) classes.set(entry.id, [...(classes.get(entry.id) ?? []), entry.class])
    for (const entry of facts['authored-style']) {
      if (entry.kind === 'classDef') for (const name of ids(entry.selection)) definitions.set(name, entry.attributes)
      if (entry.kind === 'class') for (const id of ids(entry.selection)) classes.set(id, [...(classes.get(id) ?? []), ...entry.attributes.flatMap((attribute: any) => attribute.class ? ids(attribute.class) : [])])
    }
    for (const owner of input.expected.nodes ?? []) {
      if (definitions.has('default')) apply(owner.id, definitions.get('default')!)
      for (const name of classes.get(owner.id) ?? []) if (definitions.has(name)) apply(owner.id, definitions.get(name)!)
    }
    for (const entry of facts['authored-style']) {
      if (entry.kind === 'style') for (const id of ids(entry.selection)) if (node.has(id) || group.has(id)) apply(id, entry.attributes)
      if (entry.kind === 'linkStyle') for (const index of entry.selection === 'default' ? (input.expected.edges ?? []).map((_, index) => String(index)) : ids(entry.selection)) apply('[edge:' + index + ']', entry.attributes)
    }
    const actual = [...requests].map(([id, properties]) => {
      const edge = /^\[edge:(\d+)\]$/.exec(id), expectedEdge = edge ? input.expected.edges?.[Number(edge[1])] : null, candidates = expectedEdge ? relation(expectedEdge.source, expectedEdge.target, expectedEdge.label) : [], route = candidates.length === 1 ? candidates[0] : null
      const body = bodies(id)[0], texts = ownedText(id), routeBody = route?.box ? geometry.filter(element => nearBox(box(element), route.box!))[0] : null, target = body ?? routeBody
      const observations = [...properties].map(([property, expected]) => {
        const textProperty = ['color', 'font-weight', 'font-style', 'font-size', 'font-family', 'text-decoration'].includes(property), elements = textProperty ? texts : target ? [target] : null
        if (!elements?.length) return { property, expected, actual: null, matches: null }
        const values = elements.map(element => {
          const css = getComputedStyle(element), actual = property === 'color' ? element.namespaceURI === 'http://www.w3.org/2000/svg' ? css.fill : css.color : css.getPropertyValue(property)
          if (['fill', 'stroke', 'color'].includes(property)) { const a = rgba(actual), b = rgba(expected); return { actual, matches: a && b ? a.every((value, i) => Math.abs(value - b[i]!) <= 1) && (!textProperty || safeText(element)) : null } }
          if (['stroke-width', 'font-size'].includes(property)) return { actual, matches: /^[-+\d.]+(?:px)?$/.test(expected) ? Math.abs(Number.parseFloat(actual) - Number.parseFloat(expected)) <= .1 : null }
          if (property === 'stroke-dasharray') { const dash = (value: string) => value === 'none' ? [] : value.split(/[ ,]+/).map(Number.parseFloat); const a = dash(actual), b = dash(expected); return { actual, matches: [...a, ...b].every(Number.isFinite) ? same(a.length % 2 ? [...a, ...a] : a, b.length % 2 ? [...b, ...b] : b) : null } }
          if (property === 'font-weight') return { actual, matches: Number(actual) === Number(expected === 'bold' ? 700 : expected === 'normal' ? 400 : expected) }
          if (['font-style', 'font-family'].includes(property)) return { actual, matches: actual.replaceAll('"', '').replaceAll("'", '') === expected.replaceAll('"', '').replaceAll("'", '') }
          return { actual, matches: null }
        })
        return { property, expected, values, matches: values.some(value => value.matches === null) ? null : values.every(value => value.matches) }
      })
      return { id, properties: observations, matches: observations.some(item => item.matches === null) ? null : observations.every(item => item.matches) }
    })
    fact('authored-style', actual, actual.every(entry => entry.matches !== null) ? actual.every(entry => entry.matches) : null, 'Source class/default/inline/link selections independently compile to physical node/route/text properties. Actual RGBA, font decoration, stroke widths and dash arrays establish visible effects; unused declarations impose no invented paint. Unsupported CSS and unbound edge identities stay unknown.')
  }

  if (Array.isArray(facts['node-attributes'])) {
    const observed = facts['node-attributes'].map((entry: any) => {
      const owner = node.get(entry.id), requests = Object.entries(entry.attributes).map(([key, value]) => {
        if (key === 'shape' && typeof value === 'string') return { key, expected: value, ...silhouette(entry.id, value) }
        if (key === 'label' && typeof value === 'string') return { key, expected: value, actual: owner?.label ?? null, matches: owner ? normalize(owner.label) === normalize(value) : null }
        if (['class', 'classes'].includes(key)) { const style = checks.find(check => check.criterion === 'source-fact:authored-style'); return { key, expected: value, actual: style?.actual ?? null, matches: style?.status === 'passed' ? true : style?.status === 'failed' ? false : null } }
        return { key, expected: value, actual: null, matches: null }
      })
      return { id: entry.id, attributes: requests, matches: requests.some(request => request.matches === null) ? null : requests.every(request => request.matches) }
    })
    const generic = facts['node-attributes'].every((entry: any) => Object.entries(entry.attributes).every(([key, value]) => key === 'label' || key === 'shape' && typeof value === 'string' && ['rect', 'rectangle', 'round', 'rounded', 'circle', 'ellipse', 'diam', 'diamond'].includes(value)))
    if (!generic) fact('node-attributes', observed, observed.every((entry: any) => entry.matches !== null) ? observed.every((entry: any) => entry.matches) : null, 'Each declared attribute requires its own visible projection: literal label ownership, actual silhouette and compiled owned style. Role metadata, icons, image sizing, collapsed view and unprojected attributes remain required and unknown; source dictionaries never prove paint.')
  }

  if (Array.isArray(facts['global-node-scope']) && input.family === 'agentflow') {
    const actual = facts['global-node-scope'].map((id: string) => ({ id, box: node.get(id)?.box ?? null, containers: node.has(id) ? groups.filter(owner => contains(owner.box, node.get(id)!.box)).map(owner => owner.id) : null }))
    fact('global-node-scope', actual, actual.every((entry: any) => entry.box && entry.containers) ? actual.every((entry: any) => entry.containers.length === 0) : null, 'Every authored global node owns actual ink outside every flow boundary. A global keyword, source scope or model flag cannot substitute for physical scope containment.')
  }
  if (Array.isArray(facts['dialect-kinds'])) {
    const actual = facts['dialect-kinds'].map((entry: any) => {
      if (entry.kind === 'lane') { const owner = input.expected.groups?.[entry.declaration]; return { expected: entry, actual: owner ? group.get(owner.id) ?? null : null, matches: owner ? group.has(owner.id) : null } }
      if (['agent-flow', 'system-boundary'].includes(entry.kind)) return { expected: entry, actual: group.get(entry.id) ?? null, matches: group.has(entry.id) ? true : null }
      if (entry.kind === 'shared-global-scope') { const globals = checks.find(check => check.criterion === 'source-fact:global-node-scope'); return { expected: entry, actual: globals?.actual ?? null, matches: globals?.status === 'passed' ? true : globals?.status === 'failed' ? false : null } }
      if (entry.kind === 'actor') { const actor = actorProfiles.get(entry.id); return { expected: entry, actual: actor ? { kind: actor.kind, box: actor.box } : null, matches: actor ? true : null } }
      if (entry.kind === 'anonymous-use-case') { const shape = silhouette(entry.id, 'ellipse'); return { expected: entry, actual: shape.actual, matches: shape.matches } }
      if (entry.kind === 'stereotype') {
        const owner = node.get(entry.id), values = ownedText(entry.id), candidates = values?.filter(element => normalize(readText(element)).replace(/^[«<]+|[»>]+$/g, '') === normalize(entry.value)) ?? []
        return { expected: entry, actual: candidates.map(element => normalize(readText(element))), matches: owner && values?.every(safeText) ? candidates.length === 1 : null }
      }
      if (entry.kind === 'json-table') {
        const values = ownedText(entry.id), owner = node.get(entry.id), rows: { y: number; height: number; cells: { x: number; value: string }[] }[] = []
        for (const element of values?.filter(element => normalize(readText(element)) !== normalize(owner?.label ?? '')).sort((a, b) => box(a).y - box(b).y) ?? []) {
          const b = box(element), y = center(b).y, row = rows.find(row => Math.abs(row.y - y) < Math.min(row.height, b.height) * .35), cell = { x: b.x, value: normalize(readText(element)) }
          if (row) row.cells.push(cell); else rows.push({ y, height: b.height, cells: [cell] })
        }
        const observed = rows.sort((a, b) => a.y - b.y).map(row => { const cells = row.cells.sort((a, b) => a.x - b.x); return { path: cells[0]?.value, value: cells[1]?.value, unresolved: cells.length !== 2 } }), expected = entry.rows.map((row: any) => ({ path: normalize(String(row.path)), value: normalize(String(row.value)), unresolved: false }))
        return { expected: entry, actual: observed, matches: owner && values?.every(safeText) && observed.every(row => !row.unresolved) ? same(expected, observed) : null }
      }
      if (['include', 'extend', 'generalization'].includes(entry.kind)) {
        const candidates = relation(entry.source, entry.target, entry.kind === 'generalization' ? undefined : entry.kind), route = candidates.length === 1 ? candidates[0] : null, marker = route ? route.source === entry.source ? route.endMarker : route.startMarker : null
        return { expected: entry, actual: route, matches: routesBound && route ? entry.kind === 'generalization' ? marker === 'triangle' && solid(route.dash) : ['arrow', 'triangle'].includes(marker ?? '') && !solid(route.dash) && route.labels?.includes(entry.kind) : null }
      }
      if (entry.kind === 'block-arrow') {
        const owner = node.get(entry.id), body = bodies(entry.id)[0], points = body ? vertices(body) : null, expected = [...new Set(entry.directions.flatMap((direction: string) => direction === 'x' ? ['left', 'right'] : direction === 'y' ? ['up', 'down'] : [direction]))].sort()
        const b = owner?.box, tips = b && points ? points.filter(p => { const i = points.indexOf(p), a = points[(i + points.length - 1) % points.length]!, c = points[(i + 1) % points.length]!, cross = (p.x - a.x) * (c.y - p.y) - (p.y - a.y) * (c.x - p.x); return Math.abs(cross) > .01 && (Math.abs(p.x - b.x) < 1 || Math.abs(p.x - b.x - b.width) < 1 || Math.abs(p.y - b.y) < 1 || Math.abs(p.y - b.y - b.height) < 1) && Math.abs(a.x - c.x) < 1 !== Math.abs(a.y - c.y) < 1 }) : []
        const observed = b ? [...new Set(tips.flatMap(p => Math.abs(p.x - b.x) < 1 && Math.abs(p.y - center(b).y) < 2 ? ['left'] : Math.abs(p.x - b.x - b.width) < 1 && Math.abs(p.y - center(b).y) < 2 ? ['right'] : Math.abs(p.y - b.y) < 1 && Math.abs(p.x - center(b).x) < 2 ? ['up'] : Math.abs(p.y - b.y - b.height) < 1 && Math.abs(p.x - center(b).x) < 2 ? ['down'] : []))].sort() : null
        return { expected: entry, actual: observed, matches: observed?.length ? same(expected, observed) : null }
      }
      return { expected: entry, actual: null, matches: null }
    })
    fact('dialect-kinds', actual, actual.some((entry: any) => entry.matches === false) ? false : actual.some((entry: any) => entry.matches === null) ? null : true, 'Dialect roles require their own physical witnesses: exact lane/flow/boundary containers, actor glyphs, owned stereotypes/JSON cells, dotted include/extend captions, unfilled generalization heads or measured block-arrow tips. Unsupported roles retain unknown obligations; dialect keywords and convenient IDs earn no visible credit.')
  }

  if (Array.isArray(facts['edge-appearance'])) {
    let available = true
    const observed = facts['edge-appearance'].map((entry: any) => {
      const candidates = relation(entry.source ?? entry.from, entry.target ?? entry.to), route = candidates.length === 1 ? candidates[0] : null
      if (!route) { available = false; return { expected: entry, actual: null } }
      const forward = route.source === (entry.source ?? entry.from), startMarker = forward ? route.startMarker : route.endMarker, endMarker = forward ? route.endMarker : route.startMarker
      const stroke = solid(route.dash) ? 'solid' : 'dotted', thick = entry.stroke === 'thick'
      const baseline = routes.filter(other => other !== route && solid(other.dash)).map(other => other.strokeWidth).filter((value): value is number => Number.isFinite(value))
      if (thick && !baseline.length) available = false
      return { expected: entry, actual: { stroke, startMarker, endMarker, width: route.strokeWidth }, matches: (thick ? Number.isFinite(route.strokeWidth) && baseline.every(width => route.strokeWidth! > width + .1) : ['dashed', 'dotted'].includes(entry.stroke) ? stroke === 'dotted' : stroke === entry.stroke) && (entry.markerStart === undefined || startMarker === entry.markerStart) && (entry.markerEnd === undefined || endMarker === entry.markerEnd) }
    })
    fact('edge-appearance', observed, available && routesBound ? observed.every((entry: any) => entry.matches) : null, 'Exact source endpoint pairs bind the actual route, stroke dash and endpoint glyphs. A thick request must preserve a measured width contrast against solid peer routes; route classes and edge IDs supply no paint credit.')
  }

  if (input.family === 'er' && Array.isArray(facts.cardinalities)) {
    const rawRoute = (route: Route) => geometry.filter(element => ['path', 'polyline', 'line'].includes(element.localName) && route.box && nearBox(box(element), route.box) && (() => { const p = samples(element, 1); return p.length === 2 && route.start && route.end && distance(p[0]!, route.start) < 1 && distance(p[1]!, route.end) < 1 })())
    const glyph = (route: Route, id: string): { kind: string | null; bars: number; circles: number; forks: number } => {
      const endpoint = ends(route, id), other = ends(route, id === route.source ? route.target : route.source), stems = rawRoute(route)
      if (!endpoint || !other || stems.length !== 1) return { kind: null, bars: 0, circles: 0, forks: 0 }
      const setting = getComputedStyle(stems[0]!)[id === route.source ? 'markerStart' : 'markerEnd'], reference = /#([^\s)'"#]+)/.exec(setting)?.[1], marker = reference ? document.getElementById(decodeURIComponent(reference)) : null
      let shapes: SVGGeometryElement[], axis: Point
      if (marker?.localName === 'marker') {
        if ([...marker.querySelectorAll('use,image')].length || !['auto', 'auto-start-reverse'].includes(marker.getAttribute('orient') ?? '')) return { kind: null, bars: 0, circles: 0, forks: 0 }
        shapes = [...marker.querySelectorAll('path,line,polyline,circle,ellipse')].filter(element => { const s = getComputedStyle(element); return s.display !== 'none' && s.visibility === 'visible' && Number(s.opacity) > 0 && s.stroke !== 'none' && Number(s.strokeOpacity) > 0 && Number.parseFloat(s.strokeWidth) > 0 }) as SVGGeometryElement[]
        axis = { x: 1, y: 0 }
      } else {
        const length = distance(endpoint, other); axis = { x: (other.x - endpoint.x) / length, y: (other.y - endpoint.y) / length }
        shapes = geometry.filter(element => {
          if (stems.includes(element) || !['path', 'line', 'polyline', 'circle', 'ellipse'].includes(element.localName) || nodes.some(owner => nearBox(owner.box, box(element)))) return false
          const points = samples(element, 16)
          return points.length > 1 && points.every(p => distance(p, endpoint) <= 32 && distance(p, endpoint) + 1 < distance(p, other))
        })
      }
      let bars = 0, circles = 0, forks = 0, unknown = false
      for (const shape of shapes) {
        if (['circle', 'ellipse'].includes(shape.localName)) { const b = box(shape); if (Math.abs(b.width - b.height) > 1.5 || b.width < 1 || getComputedStyle(shape).stroke === 'none') unknown = true; else circles++; continue }
        const pieces = strokes(shape); if (!pieces.length) { unknown = true; continue }
        for (const points of pieces) {
          const first = points[0]!, last = points.at(-1)!, span = distance(first, last), projections = points.map(p => p.x * axis.x + p.y * axis.y), perpendicular = points.map(p => -p.x * axis.y + p.y * axis.x), along = Math.max(...projections) - Math.min(...projections), across = Math.max(...perpendicular) - Math.min(...perpendicular)
          if (straight(points) && span > 2 && along < Math.max(.8, across * .08)) bars++
          else if (!straight(points) && along > 3 && across > 3 && along / across >= .35 && along / across <= 4 && (span <= 1 || Math.abs(projections[0]! - projections.at(-1)!) < 1)) forks++
          else unknown = true
        }
      }
      const kind = unknown ? null : bars === 2 && !circles && !forks ? 'one-only' : bars === 1 && circles === 1 && !forks ? 'zero-or-one' : bars === 1 && !circles && forks === 1 ? 'one-or-many' : !bars && circles === 1 && forks === 1 ? 'zero-or-many' : null
      return { kind, bars, circles, forks }
    }
    const actual = facts.cardinalities.map((entry: any) => { const candidates = relation(entry.from, entry.to), route = candidates.length === 1 ? candidates[0] : null; return { from: entry.from, to: entry.to, left: route ? glyph(route, entry.from) : null, right: route ? glyph(route, entry.to) : null, identifying: route ? solid(route.dash) : null } })
    const ready = exactNodes && actual.every((entry: any) => entry.left?.kind && entry.right?.kind && entry.identifying !== null)
    const passed = ready && actual.every((entry: any, i: number) => entry.left.kind === facts.cardinalities[i].left && entry.right.kind === facts.cardinalities[i].right && entry.identifying === facts.cardinalities[i].identifying)
    const scope = 'Each exact entity pair owns its measured stem and endpoint decorations. Two bars, optional circle, three-way foot topology and the identifying/nonidentifying dash are counted from actual marker content or physically adjacent inline glyphs; marker IDs and class names have no semantic meaning. Unprojected glyph topology stays unknown.'
    fact('cardinalities', actual, ready ? passed : null, scope)
    add('painted-cardinality-decorations', facts.cardinalities, actual, ready ? passed : null, scope)
  }

  if (input.family === 'sequence') {
    if (Array.isArray(facts['participant-order'])) {
      const actual = facts['participant-order'].map((id: string) => ({ id, x: node.get(id) ? center(node.get(id)!.box).x : null }))
      fact('participant-order', actual, exactNodes && actual.every((item: any) => item.x !== null) ? actual.every((item: any, i: number) => !i || item.x > Number(actual[i - 1]?.x) + 1) : null, 'Source participant order binds distinct owned header bodies; actual left-to-right header centers establish order, independent of DOM declaration order and lifeline IDs.')
    }
    if (Array.isArray(facts['participant-kinds'])) {
      const actual = facts['participant-kinds'].map((entry: any) => ({ id: entry.id, kind: entry.kind, shape: silhouette(entry.id, entry.kind === 'participant' ? 'rectangle' : entry.kind), extraAttributes: entry.attributes }))
      fact('participant-kinds', actual, actual.every((entry: any) => !entry.extraAttributes && entry.shape.matches !== null) ? actual.every((entry: any) => entry.shape.matches) : null, 'Each participant kind needs its actual owned header glyph. A rectangular participant is measured as a rectangle; symbolic actor/database/boundary/control/entity/collection/queue glyphs need their explicit compound topology, never the source kind or generated class.')
    }
    if (Array.isArray(facts['message-style']) && facts['message-style'].some((style: string) => !['->>', '-->>', '->', '-->'].includes(style))) {
      const actual = orderedRoutes.map(route => {
        const prefix = solid(route.dash) ? '-' : '--', a = route.startMarker, b = route.endMarker
        if (a === 'none' && b === 'none') return prefix + '>'
        if (a === 'none' && b === 'cross') return prefix + 'x'
        if (a === 'none' && b === 'open-arrow') return prefix + ')'
        if (a === 'none' && ['arrow', 'triangle'].includes(b) && route.endFilled === true) return prefix + '>>'
        if (['arrow', 'triangle'].includes(a) && ['arrow', 'triangle'].includes(b) && route.startFilled && route.endFilled) return '<<' + prefix + '>>'
        return null
      })
      fact('message-style', actual, messagesBound && actual.every(Boolean) ? same(facts['message-style'], actual) : null, 'Message order follows route heights; actual open, closed/filled, cross, double-ended or absent endpoint ink and the stem dash establish each arrow token. Unprojected marker geometry remains unknown.')
    }
    if (Array.isArray(facts.fragments)) {
      const borders = geometry.filter(strokePaint).flatMap(element => strokes(element).filter(straight).map(points => ({ a: points[0]!, b: points.at(-1)! })))
      const horizontal = borders.filter(({ a, b }) => Math.abs(a.y - b.y) < 1 && Math.abs(a.x - b.x) > 30), vertical = borders.filter(({ a, b }) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) > 20)
      const frames: Box[] = geometry.filter(element => element.localName === 'rect' && box(element).width > 30 && box(element).height > 20).map(box)
      for (const top of horizontal) for (const bottom of horizontal) {
        const x = Math.min(top.a.x, top.b.x), right = Math.max(top.a.x, top.b.x), y = top.a.y, lower = bottom.a.y
        if (lower <= y + 20 || Math.abs(Math.min(bottom.a.x, bottom.b.x) - x) > 1 || Math.abs(Math.max(bottom.a.x, bottom.b.x) - right) > 1) continue
        if ([x, right].every(side => vertical.some(line => Math.abs(line.a.x - side) < 1 && Math.min(line.a.y, line.b.y) <= y + 1 && Math.max(line.a.y, line.b.y) >= lower - 1))) frames.push({ x, y, width: right - x, height: lower - y })
      }
      const unique = frames.filter((candidate, i) => !frames.slice(0, i).some(other => nearBox(candidate, other)))
      const caption = (value: string) => paintedText.filter(element => normalize(readText(element)).replace(/^\[\s*|\s*\]$/g, '') === normalize(value) && safeText(element))
      const actual = facts.fragments.map((entry: any, index: number) => {
        const text = entry.caption ?? entry.label ?? '', branch = ['else', 'and', 'option'].includes(entry.kind), parent = branch ? fragmentOwners.get(entry.parent) : undefined
        const captions = entry.kind === 'rect' ? [] : caption(text), badges = label(entry.kind).filter(safeText)
        const matching = unique.filter(frame => {
          if (branch) return parent && nearBox(parent, frame)
          const first = orderedRoutes[entry.beginMessage]?.box, last = orderedRoutes[entry.endMessage - 1]?.box
          const inside = (b: Box) => contains(frame, b, 2)
          if (entry.kind === 'rect') { const colors = geometry.filter(element => nearBox(box(element), frame)).map(element => rgba(getComputedStyle(element).fill)); return colors.some(color => color && same(color, rgba(text))) && (!first || inside(first)) && (!last || inside(last)) }
          return captions.filter(element => contains(frame, box(element))).length === 1 && badges.filter(element => contains(frame, box(element)) && box(element).y < frame.y + 35).length === 1
        }).sort((a, b) => area(a) - area(b))
        const frame = matching[0], header = frame && captions.filter(element => contains(frame, box(element))).sort((a, b) => box(a).y - box(b).y)[0], boundary = branch && header ? box(header).y + box(header).height : frame?.y
        if (!frame || matching[1] && Math.abs(area(matching[1]) - area(frame)) <= 1) return { index, expected: entry, box: null, matches: null }
        fragmentOwners.set(index, frame); if (header) fragmentCaptions.set(index, header)
        const before = entry.beginMessage > 0 ? orderedRoutes[entry.beginMessage - 1]?.box : null, next = orderedRoutes[entry.endMessage]?.box
        const inside = orderedRoutes.slice(entry.beginMessage, entry.endMessage).every(route => contains(frame, route.box!, 2) && (!branch || route.box!.y >= boundary! - 2))
        const outside = (!before || before.y < boundary! + 2) && (!next || next.y > frame.y + frame.height - 2)
        const nesting = (entry.nesting ?? []).every((parent: number) => fragmentOwners.has(parent) && contains(fragmentOwners.get(parent)!, frame) && area(fragmentOwners.get(parent)!) > area(frame) + 1)
        return { index, expected: entry, box: frame, header: header ? box(header) : null, matches: inside && outside && nesting }
      })
      fact('fragments', actual, messagesBound && actual.every((entry: any) => entry.matches !== null) ? actual.every((entry: any) => entry.matches) : null, 'Complete fragment/branch intervals bind physical closed frames, painted kind badges/captions, separators and the exact chronological message interval; nested regions must be strictly contained. Four measured border strokes can establish a frame without a rect or renderer wrapper. Unbound/ambiguous branch geometry remains unknown.')
    }
    if (Array.isArray(facts.lifecycles)) {
      const activations = geometry.filter(element => element.localName === 'rect' && box(element).width >= 2 && box(element).width <= 30 && box(element).height > 2 && !nodes.some(owner => nearBox(owner.box, box(element))))
      const slot = (y: number, beforeMessage: number) => { const before = orderedRoutes[beforeMessage - 1]?.box, after = orderedRoutes[beforeMessage]?.box; return (!before || y >= before.y - 3) && (!after || y <= after.y + 3) }
      const used = new Set<Element>(), actual = facts.lifecycles.map((entry: any) => {
        const owner = node.get(entry.actor)
        if (entry.kind === 'central-lifeline-connection') { const route = orderedRoutes[entry.message], a = route && node.get(route.source), b = route && node.get(route.target); return { expected: entry, matches: route && a && b && route.start && route.end ? (!entry.from || Math.abs(route.start.x - center(a.box).x) < 2) && (!entry.to || Math.abs(route.end.x - center(b.box).x) < 2) : null } }
        if (!owner || !['activate', 'deactivate'].includes(entry.kind)) return { expected: entry, matches: null }
        const candidates = activations.filter(element => Math.abs(center(box(element)).x - center(owner.box).x) <= 12 && slot(entry.kind === 'activate' ? box(element).y : box(element).y + box(element).height, entry.beforeMessage))
        if (candidates.length !== 1) return { expected: entry, matches: null }
        used.add(candidates[0]!); return { expected: entry, box: box(candidates[0]!), matches: true }
      })
      const ready = messagesBound && actual.every((entry: any) => entry.matches !== null)
      fact('lifecycles', { events: actual, extraActivationBodies: activations.filter(element => !used.has(element)).map(box) }, ready ? actual.every((entry: any) => entry.matches) && activations.every(element => used.has(element)) : null, 'Activation/deactivation boundaries must lie in the authored physical message slot on the owned participant lifeline; exact activation-body inventory rejects extras. Central-lifeline requests bind actual route endpoints. Creation/destruction and ambiguous nested activation ownership remain unknown until their glyph profiles qualify.')
    }
    if (facts.autonumber !== undefined) {
      const requested = facts.autonumber === true ? { start: 1, increment: 1 } : /^(-?\d+)(?:\s+(-?\d+))?$/.exec(String(facts.autonumber)), start = requested && ('start' in requested ? requested.start : Number(requested[1])), increment = requested && ('increment' in requested ? requested.increment : Number(requested[2] ?? 1))
      const numbers = orderedRoutes.map((route, index) => { const value = start === null ? NaN : Number(start) + index * Number(increment), found = label(String(value)).filter(element => route.box && Math.abs(center(box(element)).y - route.box.y) <= 22 && Math.min(distance(center(box(element)), route.start!), distance(center(box(element)), route.end!)) <= 28); return { expected: value, occurrences: found.length, safe: found.every(safeText) } })
      fact('autonumber', numbers, requested && messagesBound ? numbers.every(item => item.occurrences === 1 && item.safe) : null, 'Each chronological message has its separately painted source autonumber at an actual route endpoint. Correct unrelated numbers elsewhere and SVG IDs cannot supply numbering credit.')
    }
  }

  if (Array.isArray(facts['lane-order']) && input.family === 'swimlane') {
    const actual = facts['lane-order'].map((id: string) => ({ id, box: group.get(id)?.box ?? null }))
    const xs = actual.map((item: any) => item.box ? center(item.box).x : NaN), ys = actual.map((item: any) => item.box ? center(item.box).y : NaN)
    const horizontal = xs.every((x: number, i: number) => !i || x > xs[i - 1]! + 1) && ys.every((y: number) => Math.abs(y - ys[0]!) < 2)
    const vertical = ys.every((y: number, i: number) => !i || y > ys[i - 1]! + 1) && xs.every((x: number) => Math.abs(x - xs[0]!) < 2)
    fact('lane-order', actual, actual.every((item: any) => item.box) ? horizontal || vertical : null, 'Lane order is read from nonoverlapping actual enclosing containers, proceeding left-to-right or top-to-bottom along their common measured axis. Matching lane captions outside containers cannot supply ownership.')
  }

  if (input.family === 'block' && Array.isArray(facts['grid-cell-order']) && Array.isArray(facts['grid-columns'])) {
    const observations: unknown[] = []; let available = true, passed = true
    for (const config of facts['grid-columns']) {
      const cells = facts['grid-cell-order'].filter((entry: any) => entry.parent === config.group), columns = config.value === 'auto' ? cells.reduce((sum: number, entry: any) => sum + entry.span, 0) : config.value
      if (!Number.isSafeInteger(columns) || columns < 1 || cells.some((entry: any) => !Number.isSafeInteger(entry.span) || entry.span < 1 || entry.span > columns)) { available = false; continue }
      let cursor = 0
      const positioned = cells.map((entry: any) => { if (cursor % columns + entry.span > columns) cursor += columns - cursor % columns; const location = { ...entry, row: Math.floor(cursor / columns), column: cursor % columns, body: entry.kind === 'space' ? null : (node.get(entry.id) ?? group.get(entry.id))?.box ?? null }; cursor += entry.span; return location })
      const ink = positioned.filter((entry: any) => entry.kind !== 'space'), ready = ink.every((entry: any) => entry.body)
      if (!ready) { available = false; observations.push({ config, cells: positioned }); continue }
      // x = origin + column * pitch; width = span * pitch - gap.
      // Infer pitch from different authored columns, then verify every cell.
      const pitches: number[] = []
      for (const a of ink) for (const b of ink) if (a.column !== b.column) pitches.push((b.body.x - a.body.x) / (b.column - a.column))
      const pitch = pitches.length ? pitches.reduce((sum, value) => sum + value, 0) / pitches.length : null
      const gaps = pitch === null ? [] : ink.map((entry: any) => entry.span * pitch - entry.body.width), gap = gaps.length ? gaps.reduce((sum: number, value: number) => sum + value, 0) / gaps.length : null
      const origin = pitch === null ? null : ink[0].body.x - ink[0].column * pitch
      const rows = [...new Set(ink.map((entry: any) => entry.row))].map(row => ({ row, values: ink.filter((entry: any) => entry.row === row).map((entry: any) => entry.body) })) as { row: number; values: Box[] }[]
      const rowOkay = rows.every(row => row.values.every(b => Math.abs(center(b).y - center(row.values[0]!).y) <= 2)) && rows.every((row, i) => !i || Math.min(...row.values.map(b => b.y)) >= Math.max(...rows[i - 1]!.values.map(b => b.y + b.height)) - 1.5)
      const latticeOkay = pitch === null ? ink.every((entry: any) => entry.column === 0 && entry.span === columns) : pitch > 0 && gap! >= -1.5 && gaps.every((value: number) => Math.abs(value - gap!) <= 2) && ink.every((entry: any) => Math.abs(entry.body.x - origin! - entry.column * pitch) <= 2)
      if (!rowOkay || !latticeOkay) passed = false
      // A declared empty cell must occupy an actual unpainted slot. Unknown
      // unrelated artwork in that slot cannot become a positive gap proof.
      const occupied = new Set(ink.flatMap((entry: any) => parts(entry.id)))
      const spaces = positioned.filter((entry: any) => entry.kind === 'space')
      if (spaces.length && (pitch === null || !rows.length)) available = false
      for (const entry of spaces) {
        const row = rows.find(row => row.row === entry.row)
        if (!row || pitch === null) { available = false; continue }
        const slot = { x: origin! + entry.column * pitch, y: Math.min(...row.values.map(b => b.y)), width: entry.span * pitch - gap!, height: Math.max(...row.values.map(b => b.height)) }
        if (geometry.some(element => !occupied.has(element) && !groups.some(owner => nearBox(owner.box, box(element))) && contains(slot, box(element), -1))) passed = false
      }
      observations.push({ config, cells: positioned, pitch, gap, rowOkay, latticeOkay })
    }
    const scope = 'Complete source grid traversal, explicit spans and empty slots bind actual owned cell/group rectangles. A measured common column pitch, cell-width/span equation and row separation establish order within two CSS pixels. Auto means one source row; anonymous/unbound containers and grids with no independent pitch evidence remain unknown.'
    fact('grid-cell-order', observations, available ? passed : null, scope); fact('grid-columns', observations, available ? passed : null, scope)
  }

  if (Array.isArray(facts.alignments) && input.family === 'architecture') {
    const actual = facts.alignments.map((entry: any) => { const values = entry.ids.map((id: string) => node.get(id)).map((owner: Owned | undefined) => owner ? center(owner.box)[entry.axis === 'row' ? 'y' : 'x'] : null); return { ...entry, values, matches: values.every((value: number | null) => value !== null) && Math.max(...values) - Math.min(...values) <= 2 } })
    fact('alignments', actual, actual.every((entry: any) => entry.values.every((value: any) => value !== null)) ? actual.every((entry: any) => entry.matches) : null, 'Each authored row/column alignment binds actual owned service centers within two CSS pixels. Source alignment directives and public IDs are not alignment evidence.')
  }
  if (Array.isArray(facts.ports) && input.family === 'architecture') {
    const side = (owner: Owned, p: Point): string | null => {
      const b = owner.box, distances = [{ side: 'L', d: Math.abs(p.x - b.x) }, { side: 'R', d: Math.abs(p.x - b.x - b.width) }, { side: 'T', d: Math.abs(p.y - b.y) }, { side: 'B', d: Math.abs(p.y - b.y - b.height) }].sort((a, b) => a.d - b.d)
      return distances[0]!.d <= 8 && distances[1]!.d - distances[0]!.d > 1 ? distances[0]!.side : null
    }
    const actual = facts.ports.map((entry: any) => { const candidates = relation(entry.from, entry.to), route = candidates.length === 1 ? candidates[0] : null, a = node.get(entry.from), b = node.get(entry.to), start = route && ends(route, entry.from), end = route && ends(route, entry.to); return { from: entry.from, to: entry.to, fromSide: a && start ? side(a, start) : null, toSide: b && end ? side(b, end) : null } })
    fact('ports', actual, routesBound && actual.every((entry: any) => entry.fromSide && entry.toSide) ? same(facts.ports.map(({ from, to, fromSide, toSide }: any) => ({ from, to, fromSide, toSide })), actual) : null, 'Uniquely owned route endpoints attach to the authored side of each measured service body (at most eight CSS pixels clearance). Corner-ambiguous, group-proxy and unbound junction endpoints stay unknown.')
  }

  if (input.family === 'c4') {
    if (Array.isArray(facts['authored-style']) && facts['authored-style'].some((entry: any) => /^Update/.test(entry.kind))) {
      const colorMatches = (actual: string, expected: string) => { const a = rgba(actual), b = rgba(expected); return a && b ? a.every((value, i) => Math.abs(value - b[i]!) <= 1) : null }
      const actual = facts['authored-style'].map((entry: any) => {
        const attributes = Object.entries(entry.attributes).map(([key, value]: [string, any]) => {
          if (entry.kind === 'UpdateLayoutConfig' && ['c4ShapeInRow', 'c4BoundaryInRow'].includes(key)) {
            const owners = key === 'c4ShapeInRow' ? nodes : groups, maximum = Number(value), parent = (owner: { id: string; box: Box }) => groups.filter(group => group.id !== owner.id && contains(group.box, owner.box)).sort((a, b) => area(a.box) - area(b.box))[0]?.id ?? null
            const rows = owners.map(owner => ({ y: center(owner.box).y, parent: parent(owner), ids: owners.filter(other => parent(other) === parent(owner) && other.box.y < center(owner.box).y + 1 && other.box.y + other.box.height > center(owner.box).y - 1).map(other => other.id) }))
            return { key, expected: maximum, rows, matches: Number.isSafeInteger(maximum) && maximum > 0 && (key === 'c4ShapeInRow' ? exactNodes : groups.length === input.expected.groups?.length) ? rows.every(row => row.ids.length <= maximum) : null }
          }
          if (entry.kind === 'UpdateElementStyle') {
            const id = entry.positions[0], owner = node.get(id) ?? group.get(id), elements = key === 'fontColor' ? ownedText(id) : parts(id).filter(element => bodies(id).includes(element) || ['circle', 'rect'].includes(element.localName)), property = key === 'fontColor' ? 'color' : key === 'bgColor' ? 'fill' : key === 'borderColor' ? 'stroke' : null
            const values = property && owner && elements?.length ? elements.map(element => { const css = getComputedStyle(element); return property === 'color' ? element.namespaceURI === 'http://www.w3.org/2000/svg' ? css.fill : css.color : css.getPropertyValue(property) }) : null
            return { key, expected: value, values, matches: values ? values.every(actual => colorMatches(actual, value) === true) : null }
          }
          if (entry.kind === 'UpdateRelStyle' && ['lineColor', 'textColor'].includes(key)) {
            const candidates = relation(entry.positions[0], entry.positions[1]), route = candidates.length === 1 ? candidates[0] : null
            if (key === 'lineColor') return { key, expected: value, actual: route?.style?.stroke ?? null, matches: route?.style?.stroke ? colorMatches(route.style.stroke, value) : null }
            const labels = route ? paintedText.filter(element => route.labels?.includes(normalize(readText(element))) && !nodes.some(owner => contains(owner.box, box(element))) && route.box && Math.hypot(Math.max(route.box.x - center(box(element)).x, 0, center(box(element)).x - route.box.x - route.box.width), Math.max(route.box.y - center(box(element)).y, 0, center(box(element)).y - route.box.y - route.box.height)) <= 35) : []
            const colors = labels.map(element => { const css = getComputedStyle(element); return element.namespaceURI === 'http://www.w3.org/2000/svg' ? css.fill : css.color })
            return { key, expected: value, values: colors, matches: colors.length === 1 && labels.every(safeText) ? colors.every(color => colorMatches(color, value) === true) : null }
          }
          return { key, expected: value, actual: null, matches: null }
        })
        return { kind: entry.kind, positions: entry.positions, attributes, matches: attributes.some(item => item.matches === false) ? false : attributes.some(item => item.matches === null) ? null : true }
      })
      fact('authored-style', actual, actual.some((entry: any) => entry.matches === false) ? false : actual.some((entry: any) => entry.matches === null) ? null : true, 'C4 source style requests bind actual owned element/route/text colors and explicit maximum shapes/boundaries per measured row within each immediate boundary scope. Source row counts can be falsified by excess actual peers. Exact label offsets have no independently observed unshifted anchor in a single artifact and remain unknown; source offset values cannot attest themselves.')
    }
    if (Array.isArray(facts.elements)) {
      const typeName = (kind: string) => kind.replace(/_Ext$/, '').replace(/(?:Db|Queue)$/, '').replace(/_Boundary$/, '').toLowerCase()
      const actual = facts.elements.map((entry: any) => {
        const owner = node.get(entry.id) ?? group.get(entry.id), values = ownedText(entry.id), fields = values?.map(element => ({ text: normalize(readText(element)), element })) ?? [], expectedType = typeName(entry.kind), typeRows = fields.filter(field => { const value = field.text.toLowerCase().replace(/^[«\[]|[»\]]$/g, '').replace(/^software\s+/, ''); return value === expectedType || value.startsWith(expectedType + ':') })
        const header = fields.filter(field => field.text === normalize(entry.label)), contents = fields.filter(field => !header.includes(field) && !typeRows.includes(field)), technology = typeRows.flatMap(field => { const match = /:\s*(.+?)[»\]]?$/.exec(field.text); return match ? [match[1]!] : [] })
        const observedFields = [...contents.map(field => field.text.replace(/^\[|\]$/g, '')), ...technology].sort(), expectedFields = entry.extraVisibleFields.map((value: string) => normalize(value)).sort()
        const ink = parts(entry.id), heads = ink.filter(shape => ['circle', 'ellipse'].includes(shape.localName) && box(shape).height < (owner?.box.height ?? 0) * .6), torsos = ink.filter(shape => shape.localName === 'rect' && heads.some(head => center(box(head)).y < box(shape).y + 2))
        let kind: boolean | null = expectedType === 'person' ? heads.length === 1 && torsos.length === 1 : entry.kind.includes('Boundary') ? !!group.get(entry.id) : /Db|Queue/.test(entry.kind) ? null : silhouette(entry.id, 'rectangle').matches
        if (/_Ext$/.test(entry.kind)) {
          const peers = facts.elements.filter((peer: any) => !/_Ext$/.test(peer.kind) && typeName(peer.kind) === expectedType).map((peer: any) => node.get(peer.id)).filter(Boolean), own = node.get(entry.id)
          const printed = fields.some(field => /external/i.test(field.text)), contrast = own?.style && peers.length ? peers.every((peer: Owned) => peer.style && !same([peer.style.fill, peer.style.stroke], [own.style.fill, own.style.stroke])) : null
          kind = kind === false ? false : printed || contrast === true ? kind : null
        }
        return { id: entry.id, expectedKind: entry.kind, observedFields, typeRows: typeRows.map(field => field.text), shapeMatches: kind, safe: values?.every(safeText) ?? false, matches: !!owner && header.length === 1 && (typeRows.length === 1 || entry.kind.includes('Boundary')) && same(expectedFields, observedFields) && kind === true }
      })
      fact('elements', actual, actual.every((entry: any) => entry.safe && entry.shapeMatches !== null) ? actual.every((entry: any) => entry.matches) : null, 'Every C4 element independently owns its complete header, printed type/technology, description fields and actual person/box/boundary geometry. External variants need an explicit external caption or measured same-kind appearance distinction. Database/queue compound bodies require additional topology; source kind strings and native model fields earn no credit.')
    }
    if (Array.isArray(facts.relations)) {
      const actual = facts.relations.map((entry: any) => {
        const candidates = relation(entry.source, entry.target, entry.label), route = candidates.length === 1 ? candidates[0] : null, technology = entry.technology ? paintedText.filter(element => normalize(readText(element)).replace(/^\[|\]$/g, '') === normalize(entry.technology) && !nodes.some(owner => contains(owner.box, box(element)))) : []
        const attached = route?.box ? technology.filter(element => { const p = center(box(element)), b = route.box!; return Math.hypot(Math.max(b.x - p.x, 0, p.x - b.x - b.width), Math.max(b.y - p.y, 0, p.y - b.y - b.height)) <= Math.max(35, box(element).height * 2) }) : []
        const endpoint = route && ends(route, entry.target), other = route && ends(route, entry.source), directed = route && endpoint && other ? route.target === entry.target ? ['arrow', 'triangle'].includes(route.endMarker) : ['arrow', 'triangle'].includes(route.startMarker) : false
        const reverse = route ? route.source === entry.source ? route.startMarker : route.endMarker : null, bidirectional = entry.kind === 'BiRel' ? ['arrow', 'triangle'].includes(reverse ?? '') : true
        const direction = /_([URLD])$/.exec(entry.kind)?.[1], a = node.get(entry.source), b = node.get(entry.target), delta = a && b ? { x: center(b.box).x - center(a.box).x, y: center(b.box).y - center(a.box).y } : null
        const placement = !direction ? true : delta ? direction === 'R' ? delta.x > 1 : direction === 'L' ? delta.x < -1 : direction === 'U' ? delta.y < -1 : delta.y > 1 : null
        return { expected: entry, route: !!route, technologyOccurrences: attached.length, directed, bidirectional, placement, matches: !!route && directed && bidirectional && placement === true && (!entry.technology || attached.length === 1 && attached.every(safeText)) }
      })
      fact('relations', actual, routesBound && actual.every((entry: any) => entry.route && entry.placement !== null) ? actual.every((entry: any) => entry.matches) : null, 'Each C4 relationship owns exact measured endpoints, actual arrow direction/multiplicity, route caption and separately attached technology. Explicit directional relation variants additionally constrain measured source-to-target centers. Matching free text or relation model properties provide no credit.')
    }
  }

  if (input.family === 'class') {
    if (Array.isArray(facts.members) && (facts.annotations?.length || facts.generics?.length || facts.members.some((entry: any) => entry.values.some((value: string) => /[~$*]/.test(value))))) {
      const canonical = (value: string) => normalize(value).replace(/~([^~]+)~/g, '<$1>').replace(/[$*]$/, '').replace(/\)\s*:\s*/g, ') ').replace(/\s*:\s*/g, ':')
      const actual = facts.members.map((entry: any) => {
        const owner = node.get(entry.id), elements = ownedText(entry.id), generic = facts.generics?.find((generic: any) => generic.id === entry.id), header = owner ? normalize(owner.label + (generic ? '<' + generic.parameter.replaceAll('~', '') + '>' : '')) : null
        const annotations = (facts.annotations ?? []).filter((annotation: any) => annotation.id === entry.id).map((annotation: any) => normalize(annotation.annotation))
        const content = elements?.filter(element => { const value = normalize(readText(element)); return value !== header && !annotations.includes(value.replace(/^[«<]+|[»>]+$/g, '')) }) ?? []
        const observed = content.map(element => { const css = getComputedStyle(element), children = [...element.querySelectorAll('*')], styles = [css, ...children.map(child => getComputedStyle(child))]; return { value: canonical(readText(element)), italic: styles.some(style => ['italic', 'oblique'].includes(style.fontStyle)), underline: styles.some(style => style.textDecorationLine.split(' ').includes('underline')), safe: safeText(element) } })
        const expected = entry.values.map((value: string) => ({ value: canonical(value), italic: /\*$/.test(value), underline: /\$$/.test(value) }))
        const key = (value: any) => JSON.stringify([value.value, value.italic, value.underline])
        return { id: entry.id, expected, observed, ready: !!owner && !!elements && observed.every(value => value.safe), matches: same(expected.map(key).sort(), observed.map(key).sort()) }
      })
      fact('members', actual, actual.every((entry: any) => entry.ready) ? actual.every((entry: any) => entry.matches) : null, 'Complete owned class member rows preserve names, argument/return types, access and generic angle-bracket types. Source abstract/static suffixes require actual italic/underline glyph style, with exact decorated member multiplicity. Only the separately owned header and authored stereotype rows are excluded; clipping, covers and uncertain glyphs remain unknown.')
    }
    if (Array.isArray(facts.annotations)) {
      const actual = facts.annotations.map((entry: any) => { const values = ownedText(entry.id), found = values?.filter(element => normalize(readText(element)).replace(/^[«<]+|[»>]+$/g, '') === normalize(entry.annotation)) ?? []; return { id: entry.id, annotation: entry.annotation, occurrences: found.length, safe: found.every(safeText) } })
      fact('annotations', actual, actual.every((entry: any) => node.has(entry.id) && entry.safe) ? actual.every((entry: any) => entry.occurrences === 1) : null, 'Each annotation is a separately painted stereotype row inside its uniquely owned class body. Angle/typographic quote delimiters are presentation punctuation; borrowing matching text from another class is rejected.')
    }
    if (Array.isArray(facts.generics)) {
      const actual = facts.generics.map((entry: any) => { const owner = node.get(entry.id), values = owner ? paintedText.filter(element => contains(owner.box, box(element)) && normalize(readText(element)) === normalize(owner.label + '<' + entry.parameter.replaceAll('~', '') + '>')) : []; return { id: entry.id, parameter: entry.parameter, matches: values.length === 1 && values.every(safeText), observed: values.map(element => normalize(readText(element))) } })
      fact('generics', actual, actual.every((entry: any) => node.has(entry.id)) ? actual.every((entry: any) => entry.matches) : null, 'The class header must visibly print its authored generic parameter list inside the owned body. Source tilde syntax is rendered with angle brackets; a matching member row or parameter text in another class earns no credit.')
    }
    if (Array.isArray(facts.cardinalities)) {
      const actual = facts.cardinalities.map((entry: any) => {
        const candidates = relation(entry.from, entry.to), route = candidates.length === 1 ? candidates[0] : null
        const values = ['left', 'right'].map(side => { const id = side === 'left' ? entry.from : entry.to, endpoint = route && ends(route, id), otherEndpoint = route && ends(route, side === 'left' ? entry.to : entry.from), owner = node.get(id), value = entry[side]; const found = value && endpoint && otherEndpoint ? label(value).filter(element => !nodes.some(n => contains(n.box, box(element))) && distance(center(box(element)), endpoint) <= Math.max(35, box(element).width + box(element).height) && distance(center(box(element)), endpoint) + 2 < distance(center(box(element)), otherEndpoint)) : []; return { side, value, occurrences: found.length, safe: found.every(safeText), owner: !!owner } })
        return { from: entry.from, to: entry.to, route: !!route, values, matches: values.every(item => item.owner && item.safe && (!item.value || item.occurrences === 1)) }
      })
      fact('cardinalities', actual, routesBound && actual.every((entry: any) => entry.route) ? actual.every((entry: any) => entry.matches) : null, 'Every nonempty class cardinality is a visible route-end caption outside node bodies, strictly nearer its own endpoint. Exact endpoint pairs and unique occurrences reject swapped, extra, and borrowed labels; crowded parallel routes remain unknown.')
    }
  }

  // A note must own physical text inside a distinct note body and a measured
  // side/attachment. A matching string elsewhere is insufficient.
  if (Array.isArray(facts.notes)) {
    const actual = facts.notes.map((entry: any, index: number) => {
      const occurrences = label(entry.text).filter(safeText), texts = occurrences.filter(element => !nodes.some(owner => contains(owner.box, box(element))))
      const element = texts.length === 1 ? texts[0] : null, b = element ? box(element) : null
      const containers = b ? geometry.filter(shape => { const bounds = box(shape); return bounds.width > 5 && bounds.height > 5 && contains(bounds, b) && !nodes.some(owner => nearBox(owner.box, bounds)) && !groups.some(owner => nearBox(owner.box, bounds)) }).sort((a, b) => area(box(a)) - area(box(b))) : []
      const body = containers[0], bounds = body ? box(body) : null, target = entry.target ?? entry.id, owner = target ? node.get(target) : undefined
      let attached: boolean | null = target ? null : true
      if (owner && bounds) {
        const a = center(owner.box), c = center(bounds), desiredSide = entry.side
        const sideOkay = desiredSide === 'left' || desiredSide === 'left of' ? c.x < owner.box.x : desiredSide === 'right' || desiredSide === 'right of' ? c.x > owner.box.x + owner.box.width : true
        const bridges = geometry.filter(shape => { if (contains(bounds, box(shape)) || contains(owner.box, box(shape))) return false; const ps = samples(shape, 2); if (!ps.length) return false; const near = (p: Point, rect: Box) => Math.hypot(Math.max(rect.x - p.x, 0, p.x - rect.x - rect.width), Math.max(rect.y - p.y, 0, p.y - rect.y - rect.height)) <= 8; return near(ps[0]!, bounds) && near(ps.at(-1)!, owner.box) || near(ps.at(-1)!, bounds) && near(ps[0]!, owner.box) })
        attached = sideOkay && (input.family === 'state' || bridges.length === 1 || distance(a, c) < Math.max(owner.box.width, owner.box.height) + Math.max(bounds.width, bounds.height))
      }
      if (input.family === 'sequence') {
        const actors = (entry.actors ?? []).map((id: string) => node.get(id)), xs = actors.map((owner: Owned | undefined) => owner ? center(owner.box).x : NaN)
        const sideOkay = bounds && xs.every(Number.isFinite) && (entry.side === 'over' ? center(bounds).x >= Math.min(...xs) - 2 && center(bounds).x <= Math.max(...xs) + 2 : entry.side === 'left of' ? bounds.x + bounds.width < Math.min(...xs) + 2 : entry.side === 'right of' ? bounds.x > Math.max(...xs) - 2 : false)
        const before = entry.afterMessage > 0 ? orderedRoutes[entry.afterMessage - 1]?.box : null, after = orderedRoutes[entry.afterMessage]?.box
        attached = messagesBound && bounds && sideOkay ? (!before || bounds.y > before.y - 1) && (!after || bounds.y + bounds.height < after.y + 1) : null
        if (entry.fragmentScope?.length) attached = null
      }
      if (element && body && attached === true) noteOwners.set(index, element)
      return { expected: entry, occurrences: texts.length, body: bounds, attached, matches: !!element && !!body && attached === true }
    })
    fact('notes', actual, actual.every((entry: any) => entry.attached !== null) ? actual.every((entry: any) => entry.matches) : null, 'Each complete note string owns a distinct actual note outline, target-side position/attachment and, for sequence notes, its physical chronological interval. Nested fragment scope requires the fragment ownership profile. Matching free text and source note metadata supply no proof.')
  }
  if (Array.isArray(facts['text-line-breaks']) && facts['text-line-breaks'].some((entry: any) => ['note', 'fragment', 'box'].includes(entry.owner?.kind))) {
    const glyphRows = (element: Element) => {
      if (!safeText(element)) return null
      const glyphs: { value: string; x: number; y: number; height: number }[] = [], walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      for (let child = walker.nextNode(); child; child = walker.nextNode()) {
        if (!child.parentElement || !paintable(child.parentElement)) continue
        let offset = 0
        for (const character of child.textContent ?? '') {
          const range = document.createRange(); range.setStart(child, offset); offset += character.length; range.setEnd(child, offset)
          const boxes = [...range.getClientRects()].filter(b => b.width > 0 && b.height > 0)
          if (boxes.length > 1) return null
          if (boxes[0]) glyphs.push({ value: character, x: boxes[0].x, y: boxes[0].y + boxes[0].height / 2, height: boxes[0].height })
        }
      }
      const rows: { y: number; height: number; glyphs: typeof glyphs }[] = []
      for (const glyph of glyphs) { const matching = rows.filter(row => Math.abs(row.y - glyph.y) < Math.min(row.height, glyph.height) * .4); if (matching.length > 1) return null; if (matching[0]) matching[0].glyphs.push(glyph); else rows.push({ y: glyph.y, height: glyph.height, glyphs: [glyph] }) }
      return rows.sort((a, b) => a.y - b.y).map(row => normalize(row.glyphs.sort((a, b) => a.x - b.x).map(glyph => glyph.value).join(''))).filter(Boolean)
    }
    const ownerKey = (owner: any) => JSON.stringify([owner?.kind, owner?.id ?? null, owner?.index ?? null])
    const partition = (expected: string[], actual: string[]) => { const memo = new Map<string, boolean>(); const visit = (line: number, row: number): boolean => { if (line === expected.length) return row === actual.length; const key = line + ':' + row; if (memo.has(key)) return memo.get(key)!; const matches = actual.slice(row).some((_, offset) => normalize(actual.slice(row, row + offset + 1).join(' ')) === normalize(expected[line]!) && visit(line + 1, row + offset + 1)); memo.set(key, matches); return matches }; return visit(0, 0) }
    const actual = facts['text-line-breaks'].map((entry: any) => {
      const existing = input.paint.textLineBlocks?.filter(block => ownerKey(block.owner) === ownerKey(entry.owner)), kind = entry.owner?.kind
      let element = kind === 'note' ? noteOwners.get(entry.owner.index) : kind === 'fragment' ? fragmentCaptions.get(entry.owner.index) : undefined
      if (kind === 'box') { const owner = group.get(entry.owner.id), headers = owner ? label(owner.label).filter(element => contains(owner.box, box(element)) && !nodes.some(other => contains(other.box, box(element)))) : []; if (headers.length === 1) element = headers[0] }
      const lines = existing?.length === 1 && existing[0]!.lines ? existing[0]!.lines : element ? glyphRows(element) : null, valid = Array.isArray(entry.lines) && entry.lines.every((line: any) => typeof line === 'string' && normalize(line))
      return { owner: entry.owner, lines, matches: lines && valid ? partition(entry.lines, lines) : null }
    })
    fact('text-line-breaks', actual, actual.some((entry: any) => entry.matches === false) ? false : actual.some((entry: any) => entry.matches === null) ? null : true, 'Every explicit note/fragment/box break partitions actual per-character glyph rows on its independently qualified physical owner. Existing qualified node/message rows are retained. Soft wrapping can add rows, while two authored lines cannot collapse together; ambiguous ownership and empty-line spacing remain unknown.')
  }
  if (input.expected.edges?.length) {
    const actual = routes.map(route => {
      const candidates = geometry.filter(element => route.box && nearBox(box(element), route.box) && ['path', 'line', 'polyline'].includes(element.localName) && (() => { const p = samples(element, 1); return p.length === 2 && route.start && route.end && distance(p[0]!, route.start) < 1 && distance(p[1]!, route.end) < 1 })())
      if (candidates.length !== 1) return { source: route.source, target: route.target, obscuredBy: null }
      const stem = candidates[0]!, points = samples(stem, 512), blockers: { id: string; points: number }[] = []
      for (const other of nodes.filter(owner => owner.id !== route.source && owner.id !== route.target)) {
        for (const body of bodies(other.id)) {
          if (!(stem.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING)) continue
          const css = getComputedStyle(body), fill = rgba(css.fill), matrix = body.getScreenCTM()
          let opacity = Number(css.fillOpacity)
          for (let current: Element | null = body; current; current = current.parentElement) { opacity *= Number(getComputedStyle(current).opacity); if (current === svg) break }
          if (!matrix || !fill || fill[3]! * opacity < 254 || !body.isPointInFill) continue
          const hidden = points.filter(point => body.isPointInFill(new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse()))).length
          if (hidden > 1) blockers.push({ id: other.id, points: hidden })
        }
      }
      return { source: route.source, target: route.target, obscuredBy: blockers }
    })
    add('painted-route-visibility', 'Every required owned route has a visible stem between its endpoint bodies', actual, actual.some(route => route.obscuredBy?.length) ? false : routesBound && evidence.get('paint-opacity-and-color')?.status === 'passed' && actual.length === input.expected.edges.length && actual.every(route => route.obscuredBy !== null) ? true : null, 'Actual stem samples reject portions proved hidden beneath later opaque unrelated node interiors. Endpoint bodies and owned caption backdrops are permitted. This is bounded opaque-body occlusion evidence; arbitrary masks, filters, glyph paths and unresolved ownership cannot supply a route-visibility pass.')
  }
  checkGroupMembership()
  return { checks, nodes, connections: routes, groups }
}
