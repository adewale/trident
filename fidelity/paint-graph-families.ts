import type { MeaningExpectation } from './meaning.ts'
import type { PaintCheck, PaintEvidence } from './paint.ts'

export const graphPaintFamilies = ['flowchart', 'agentflow', 'usecase', 'swimlane', 'class', 'er', 'sequence', 'state', 'block', 'c4', 'architecture']

export function plannedGraphFamilyCriteria(input: { family: string; expected: MeaningExpectation }): string[] {
  return graphPaintFamilies.includes(input.family) ? [...(input.expected.nodes?.length ? ['painted-node-visibility'] : []), ...(input.expected.groups !== undefined ? ['painted-group-membership'] : []), ...(input.expected.edges?.length ? ['painted-route-visibility'] : [])] : []
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
    for (const criterion of [...(input.expected.nodes?.length ? ['painted-node-visibility'] : []), ...(input.expected.groups !== undefined ? ['painted-group-membership'] : []), ...(input.expected.edges?.length ? ['painted-route-visibility'] : [])]) add(criterion, criterion === 'painted-group-membership' ? input.expected.groups : criterion === 'painted-node-visibility' ? input.expected.nodes : input.expected.edges, null, null, 'Source-owned glyph/body inspection is unavailable. Path, use and rasterized labels receive neither positive credit nor a false wrong-text failure.')
    return { checks, nodes: input.paint.nodes, connections: input.paint.connections, groups: input.paint.groups ?? [] }
  }
  type Point = { x: number; y: number }
  type Box = Point & { width: number; height: number }
  type Owned = { id: string; label: string; box: Box; anchorParts?: { tag: string; box: Box }[]; outline?: { tag: string; vertices?: Point[] | null; rx: number; ry: number }; style?: any }
  type Route = { source: string; target: string; directed: boolean; startMarker: string; endMarker: string; startFilled?: boolean; endFilled?: boolean; box?: Box; start?: Point; end?: Point; dash?: string; strokePattern?: string; strokeWidth?: number; labels?: string[]; style?: any }
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
  const geometry = [...svg.querySelectorAll('rect,circle,ellipse,polygon,polyline,path,line')].filter((element, layer) => paintable(element) && !input.paint.camouflagedGeometry?.some(item => (item.layer === undefined || item.layer === layer) && item.tag === element.localName && nearBox(item.box, box(element)))) as SVGGeometryElement[]
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
  const completeBlocks=new Map<Element,Element[]>()
  const textBounds=(element:Element):Box=>{const rows=completeBlocks.get(element);if(!rows)return box(element);const bs=rows.map(box),x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y));return {x,y,width:Math.max(...bs.map(b=>b.x+b.width))-x,height:Math.max(...bs.map(b=>b.y+b.height))-y}}
  const completeLabel=(value:string)=>{
    const exact=label(value).filter(safeText);if(exact.length)return exact
    const wanted=normalize(value),result:Element[]=[]
    for(const first of paintedText.filter(e=>safeText(e)&&wanted.startsWith(normalize(readText(e))))){const rows=[first];while(rows.length<=16){const combined=normalize(rows.map(readText).join(' '));if(combined===wanted){completeBlocks.set(first,rows);result.push(first);break}const previous=box(rows.at(-1)!),next=paintedText.filter(e=>!rows.includes(e)&&safeText(e)&&wanted.startsWith(combined+' '+normalize(readText(e)))).filter(e=>{const b=box(e);return b.y>previous.y+Math.min(b.height,previous.height)*.4&&b.y<=previous.y+Math.max(b.height,previous.height)*2&&Math.abs(center(b).x-center(previous).x)<2});if(next.length!==1)break;rows.push(next[0]!)}}
    return result
  }
  const ownedText = (id: string) => {
    const owner = node.get(id) ?? group.get(id)
    return owner ? paintedText.filter(element => contains(owner.box, box(element)) && ![...nodes, ...groups].some(other => other.id !== id && area(other.box) < area(owner.box) - 1 && contains(other.box, box(element)))) : null
  }
  const bodies = (id: string) => { const owner = node.get(id) ?? group.get(id); return owner ? geometry.filter(element => nearBox(box(element), owner.box)) : [] }
  const parts = (id: string) => { const owner = node.get(id) ?? group.get(id); return owner ? geometry.filter(element => contains(owner.box, box(element)) && !nodes.some(other => other.id !== id && area(other.box) < area(owner.box) - 1 && contains(other.box, box(element)))) : [] }
  const qualifiedParts = new Map<string, SVGGeometryElement[]>()
  const qualifiedInlineRouteParts = new Map<Route, Map<string, SVGGeometryElement[]>>()
  if (input.family === 'c4') for (const entry of facts.elements ?? []) if (/^Person(?:_Ext)?$/.test(entry.kind)) {
    const owner = node.get(entry.id), torso = owner ? bodies(entry.id).filter(element => element.localName === 'rect') : []
    if (!owner || !torso.length) continue
    const heads = geometry.filter(element => ['circle', 'ellipse'].includes(element.localName) && Math.abs(box(element).width - box(element).height) <= 1 && box(element).width >= 4 && box(element).width < owner.box.width * .6 && Math.abs(center(box(element)).x - center(owner.box).x) <= 2 && center(box(element)).y < owner.box.y + 2 && Math.abs(box(element).y + box(element).height - owner.box.y) <= Math.max(4, box(element).height * .5))
    if (heads.length !== 1) continue
    const ink = [...torso, heads[0]!], boxes = ink.map(box), x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y)), union = { x, y, width: Math.max(...boxes.map(b => b.x + b.width)) - x, height: Math.max(...boxes.map(b => b.y + b.height)) - y }
    const actual: Owned = { ...owner, box: union, anchorParts: ink.map(element => ({ tag: element.localName, box: box(element) })) }; nodes[nodes.findIndex(node => node.id === owner.id)] = actual; node.set(owner.id, actual); qualifiedParts.set(owner.id, ink)
  }
  const samples = (element: SVGGeometryElement, count = 128): Point[] => {
    const matrix = element.getScreenCTM(), length = element.getTotalLength()
    return matrix && length > 0 ? Array.from({ length: count + 1 }, (_, index) => { const p = element.getPointAtLength(length * index / count).matrixTransform(matrix); return { x: p.x, y: p.y } }) : []
  }
  const strokes = (element: SVGGeometryElement, count = 96): Point[][] => {
    const matrix = element.getScreenCTM(); if (!matrix) return []
    if (element.localName !== 'path') return [samples(element, count)]
    const d = element.getAttribute('d') ?? '', paths = d.match(/[mM][^mM]*/g)
    if (!paths || paths.some(path => path[0] === 'm')) return []
    return paths.map(d => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', d)
      try { const length = path.getTotalLength(); return length > 0 ? Array.from({ length: count + 1 }, (_, i) => { const point = path.getPointAtLength(length * i / count).matrixTransform(matrix); return { x: point.x, y: point.y } }) : [] } catch { return [] }
    })
  }
  const straight = (points: Point[]) => points.length > 1 && points.every(p => { const a = points[0]!, b = points.at(-1)!; return Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x) / Math.max(.01, distance(a, b)) <= .6 })
  const relation = (from: string, to: string, caption?: string) => routes.filter(route => (route.source === from && route.target === to || route.source === to && route.target === from) && (!caption || route.labels?.includes(normalize(caption))))
  const ends = (route: Route, id: string) => route.source === id ? route.start : route.target === id ? route.end : undefined
  const solid = (dash?: string) => !dash || dash === 'none' || dash.split(/[ ,]+/).every(value => Number.parseFloat(value) === 0)
  const routePattern = (route: Route): 'solid' | 'dotted' | null => route.strokePattern === 'solid' || route.strokePattern === 'dotted' ? route.strokePattern : route.strokePattern ? null : solid(route.dash) ? 'solid' : route.dash?.split(/[ ,]+/).every(value => Number.parseFloat(value) > 0) ? 'dotted' : null
  const orderedRoutes = [...routes].sort((a, b) => (a.box?.y ?? Infinity) - (b.box?.y ?? Infinity))
  const routesBound = evidence.get('painted-relationships')?.status === 'passed' && routes.every(route => route.box && route.start && route.end)
  const messagesBound = routesBound && ((input.expected.edges?.length??0)===0 || evidence.get('painted-relationship-label-ownership')?.status === 'passed') && orderedRoutes.every((route, i) => route.labels?.length === 1 && (!i || route.box!.y > orderedRoutes[i - 1]!.box!.y + 1))
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
    const declaredGroups = new Map((input.expected.groups ?? []).map(owner => [owner.id, owner])), closure = (id: string, seen = new Set<string>()): string[] | null => { if (seen.has(id)) return null; const owner = declaredGroups.get(id); if (!owner) return [id]; const next = new Set([...seen, id]), descendants = owner.members.map(member => closure(member, next)); return descendants.some(values => values === null) ? null : [...new Set(owner.members.flatMap((member, index) => [member, ...descendants[index]!]))].sort() }
    const inclusions = expected.map(pair => { const parent = group.get(pair.parent), member = all.find(item => item.id === pair.id); return { ...pair, contained: parent && member ? contains(parent.box, member.box) : null } })
    const scopes = (input.expected.groups ?? []).map(owner => ({ id: owner.id, expectedDescendants: closure(owner.id), actualDescendants: group.has(owner.id) ? all.filter(item => item.id !== owner.id && contains(group.get(owner.id)!.box, item.box)).map(item => item.id).sort() : null }))
    const actual = { inclusions, scopes, immediateParents: observed.filter(item => item.parent !== null).map(({ id, parent }) => ({ id, parent })).sort((a, b) => a.id.localeCompare(b.id)) }
    const coincident = all.some(item => groups.some(parent => parent.id !== item.id && nearBox(parent.box, item.box)))
    const ready = exactNodes && groups.length === input.expected.groups.length && (input.expected.groups ?? []).every(item => group.has(item.id)) && inclusions.every(pair => pair.contained !== null) && scopes.every(scope => scope.expectedDescendants !== null && scope.actualDescendants !== null) && !observed.some(item => item.ambiguous) && !coincident
    add('painted-group-membership', expected, actual, ready ? inclusions.every(pair => pair.contained) && scopes.every(scope => same(scope.expectedDescendants, scope.actualDescendants)) : null, 'Every original source inclusion pair must hold in actual measured containment, and each group must own exactly the complete source-reachable descendant inventory. Source references may include the same node through an ancestor and a nested subgroup; both obligations remain required instead of inventing two exclusive immediate parents. Smallest-enclosure immediate parents are diagnostic only. Extra/misplaced descendants, ambiguous boundaries and unbound groups cannot earn a pass.')
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
    if (element.localName === 'polygon' || element.localName === 'polyline') { const points = [...(element as SVGPolygonElement).points].map(p => { const point = new DOMPoint(p.x, p.y).matrixTransform(matrix); return { x: point.x, y: point.y } }); if (element.localName === 'polygon' && points.length > 1 && distance(points[0]!, points.at(-1)!) <= .25) points.pop(); return points }
    if (element.localName === 'rect' && (element as SVGRectElement).rx.baseVal.value === 0 && (element as SVGRectElement).ry.baseVal.value === 0) { const b = box(element); return [{ x: b.x, y: b.y }, { x: b.x + b.width, y: b.y }, { x: b.x + b.width, y: b.y + b.height }, { x: b.x, y: b.y + b.height }] }
    if (element.localName !== 'path') return null
    const data = element.getAttribute('d') ?? ''
    if (/[aqst]/i.test(data.replace(/[eE][-+]?\d+/g, ''))) return null
    if (/[cC]/.test(data)) {
      // A cubic with monotone collinear controls is exactly a straight
      // segment. Its command spelling does not change polygon topology.
      const tokens = data.match(/[MLHVCZ]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) ?? []
      if (tokens.join('').toLowerCase() !== data.replace(/[\s,]/g, '').toLowerCase()) return null
      let at = 0, command = '', current = { x: 0, y: 0 }, start = current, contour: Point[] | null = null
      const contours: Point[][] = []
      while (at < tokens.length) {
        if (/^[MLHVCZ]$/i.test(tokens[at]!)) command = tokens[at++]!
        const kind = command.toUpperCase(), relative = command !== kind
        if (kind === 'Z') { current = start; command = ''; continue }
        const count = kind === 'C' ? 6 : ['M', 'L'].includes(kind) ? 2 : ['H', 'V'].includes(kind) ? 1 : 0, values = tokens.slice(at, at + count).map(Number); at += count
        if (!count || values.length !== count || values.some(v => !Number.isFinite(v))) return null
        const p = (i: number) => ({ x: values[i]! + (relative ? current.x : 0), y: values[i + 1]! + (relative ? current.y : 0) })
        const end = kind === 'H' ? { x: values[0]! + (relative ? current.x : 0), y: current.y } : kind === 'V' ? { x: current.x, y: values[0]! + (relative ? current.y : 0) } : p(kind === 'C' ? 4 : 0)
        if (kind === 'C') {
          const dx = end.x - current.x, dy = end.y - current.y, length = Math.hypot(dx, dy), controls = [p(0), p(2)]
          if (length < 1e-8 ? controls.some(p => distance(p, current) > 1e-8) : controls.some(p => Math.abs(dx * (p.y - current.y) - dy * (p.x - current.x)) > length * 1e-7 || ((p.x - current.x) * dx + (p.y - current.y) * dy) / length < -1e-8 || ((p.x - current.x) * dx + (p.y - current.y) * dy) / length > length + 1e-8)) return null
        }
        current = end
        if (kind === 'M') { start = current; command = relative ? 'l' : 'L'; contour = []; contours.push(contour) }
        if (!contour) return null
        if (!contour.length || distance(contour.at(-1)!, current) > 1e-8) contour.push(current)
      }
      if (contours.length === 1) {
        const exact = contours[0]!.map(p => { const point = new DOMPoint(p.x, p.y).matrixTransform(matrix); return { x: point.x, y: point.y } })
        if (exact.length > 1 && distance(exact[0]!, exact.at(-1)!) < 1e-5) exact.pop()
        for (let changed = true; changed && exact.length > 3;) { changed = false; for (let i = 0; i < exact.length; i++) { const a = exact[(i + exact.length - 1) % exact.length]!, b = exact[i]!, c = exact[(i + 1) % exact.length]!, length = distance(a, c); if (length > 0 && Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) <= length * 1e-7 && (b.x - a.x) * (b.x - c.x) + (b.y - a.y) * (b.y - c.y) <= 0) { exact.splice(i, 1); changed = true; break } } }
        return exact
      }
    }
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
  // Flat SVGs may have no group wrappers at all. A group is still observable
  // through its own boundary, header and exact independently owned leaves.
  if (input.expected.groups?.length) {
    const descendants = (id: string, seen = new Set<string>()): string[] => { if (seen.has(id)) return []; const expected = input.expected.groups?.find(owner => owner.id === id); return expected ? expected.members.flatMap(member => [member, ...descendants(member, new Set([...seen, id]))]) : [] }
    for (const expected of input.expected.groups) {
      const ids = descendants(expected.id), leaves = ids.filter(id => !input.expected.groups?.some(owner => owner.id === id)), children = leaves.map(id => node.get(id))
      if (!children.length || children.some(child => !child)) continue
      const headers = expected.label ? label(expected.label).filter(element => safeText(element) && !children.some(child => contains(child!.box, box(element)))) : []
      if (expected.label && headers.length !== 1) continue
      const existing = group.get(expected.id)
      if (existing && children.every(child => contains(existing.box, child!.box)) && (!expected.label || contains(existing.box, box(headers[0]!)))) continue
      const candidates = geometry.filter(shape => {
        const b = box(shape), closed = ['rect', 'polygon', 'circle', 'ellipse'].includes(shape.localName) || /z\s*$/i.test(shape.getAttribute('d') ?? '')
        return closed && strokePaint(shape) && children.every(child => area(b) > area(child!.box) + 1 && contains(b, child!.box)) && (!expected.label || contains(b, box(headers[0]!))) && nodes.every(owner => owner.id === expected.id || ids.includes(owner.id) || !contains(b, owner.box))
      }).sort((a, b) => area(box(a)) - area(box(b)))
      if (!candidates[0] || candidates[1] && Math.abs(area(box(candidates[0])) - area(box(candidates[1]))) <= 1) continue
      const actual = { id: expected.id, label: expected.label, box: box(candidates[0]) }, index = groups.findIndex(owner => owner.id === expected.id)
      if (index < 0) groups.push(actual); else groups[index] = actual
      group.set(expected.id, actual)
      add('painted-group:' + expected.id, expected.members, actual, true, 'A flat group owns the unique smallest actual closed boundary containing its separate painted header and exact descendant bodies, excluding outsider nodes. Empty headers qualify through the same unique membership witness. Wrappers, data IDs and renderer group classes are not required; ambiguous/coincident enclosures remain unknown.')
    }
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
        actorProfiles.set(expected.id, observed); qualifiedParts.set(expected.id, observed.ink)
        if (!node.has(expected.id)) { const actual: Owned = { ...expected, box: observed.box, anchorParts: observed.ink.map(element => ({ tag: element.localName, box: box(element) })), outline: { tag: 'compound-actor', vertices: null, rx: 0, ry: 0 } }; nodes.push(actual); node.set(expected.id, actual) }
        break
      }
    }
    if (actorProfiles.size && (input.expected.nodes ?? []).every(expected => node.has(expected.id))) {
      exactNodes = evidence.get('painted-node-ownership')?.status !== 'failed'
      add('painted-node-ownership', input.expected.nodes, nodes, exactNodes ? true : null, 'An external actor label owns a unique nearby measured head/torso/limb glyph within the smallest ancestor containing no other authored node label. The circle, spine, arms and two connected legs or hollow/filled torso establish its body. Invisible layout rectangles, generated IDs and actor CSS classes supply no ownership.')
    }
  }
  const sequenceRoutePorts=new Map<Route,SVGGeometryElement[]>();const sequenceKinds = new Map<string, { kind: string | null; parts: SVGGeometryElement[] }>()
  if (input.family === 'sequence') {
    for (const expected of input.expected.nodes ?? []) {
      const occurrence = label(expected.label).filter(safeText).sort((a,b)=>box(a).y-box(b).y)[0]
      if (!occurrence) continue
      const caption = box(occurrence)
      for(let owner:Element|null=occurrence.parentElement;owner&&owner!==svg;owner=owner.parentElement){
        if((input.expected.nodes??[]).some(other=>other.id!==expected.id&&label(other.label).some(t=>owner!.contains(t))))break
        const ink=geometry.filter(e=>owner!.contains(e)&&box(e).y<caption.y+caption.height&&Math.abs(center(box(e)).x-center(caption).x)<=Math.max(80,caption.width)&&box(e).height<110)
        if(!ink.length)continue
        const stick=actorKind(ink),circles=ink.filter(e=>e.localName==='circle'),lines=ink.filter(e=>e.localName==='line'&&strokePaint(e)),rects=ink.filter(e=>e.localName==='rect'),curves=ink.filter(e=>e.localName==='path'&&/[aAcCqQ]/.test(e.getAttribute('d')??''))
        let kind:string|null=stick?'actor':null
        if(circles.length===1&&lines.length===2&&ink.length===3){const c=box(circles[0]!),vertical=lines.find(e=>box(e).width<1&&box(e).height>4),horizontal=lines.find(e=>box(e).height<1&&box(e).width>4);if(vertical&&horizontal&&box(vertical).x<c.x&&Math.abs(center(box(horizontal)).y-center(c).y)<1&&box(horizontal).x<=box(vertical).x+1&&box(horizontal).x+box(horizontal).width>=c.x)kind='boundary'}
        if(circles.length===1&&lines.length===1&&ink.length===2){const c=box(circles[0]!),l=box(lines[0]!);if(l.height<1&&Math.abs(l.y-c.y-c.height)<1&&Math.abs(l.width-c.width)<2)kind='entity'}
        if(circles.length===1&&ink.length===1){const c=box(circles[0]!),markers=[...owner.querySelectorAll('line')].filter(line=>{const css=getComputedStyle(line);return css.display!=='none'&&css.markerEnd!=='none'&&Number(css.opacity)>0});if(markers.length===1){const line=markers[0]!,css=getComputedStyle(line),id=/#([^\s)"']+)/.exec(css.markerEnd)?.[1],marker=id?document.getElementById(id):null,shape=marker?.children.length===1?marker.children[0]:null,raw=shape?.getAttribute('d')??'',numbers=raw.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number)??[],points=shape?.localName==='path'&&/^\s*M[\s\d.,+-]+(?:L[\s\d.,+-]+){3}Z\s*$/.test(raw.replace(/\s+/g,' ').trim())&&numbers.length===8?Array.from({length:4},(_,i)=>({x:numbers[i*2]!,y:numbers[i*2+1]!})):null,matrix=line.getScreenCTM(),angle=Number(marker?.getAttribute('orient'))*Math.PI/180,units=marker?.getAttribute('markerUnits')==='userSpaceOnUse'?1:Number.parseFloat(css.strokeWidth),refX=Number(marker?.getAttribute('refX')??0),refY=Number(marker?.getAttribute('refY')??0);if(marker?.localName==='marker'&&!marker.hasAttribute('viewBox')&&points?.length===4&&matrix&&Number.isFinite(angle)&&units>0&&shape&&getComputedStyle(shape).display!=='none'&&Number(getComputedStyle(shape).opacity)>0&&((rgba(getComputedStyle(shape).fill)?.[3]??0)*Number(getComputedStyle(shape).fillOpacity)>=1||(rgba(getComputedStyle(shape).stroke)?.[3]??0)*Number(getComputedStyle(shape).strokeOpacity)*(Number.parseFloat(getComputedStyle(shape).strokeWidth)>0?1:0)>=1)&&points.some((p,i)=>{const a=points[(i+1)%4]!,b=points[(i+2)%4]!;return (a.x-p.x)*(b.y-a.y)-(a.y-p.y)*(b.x-a.x)>0})&&points.some((p,i)=>{const a=points[(i+1)%4]!,b=points[(i+2)%4]!;return (a.x-p.x)*(b.y-a.y)-(a.y-p.y)*(b.x-a.x)<0})){const transformed=points.map(p=>{const x=(p.x-refX)*units,y=(p.y-refY)*units;return new DOMPoint(x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)).matrixTransform(matrix)}),b={x:Math.min(...transformed.map(p=>p.x)),y:Math.min(...transformed.map(p=>p.y)),width:Math.max(...transformed.map(p=>p.x))-Math.min(...transformed.map(p=>p.x)),height:Math.max(...transformed.map(p=>p.y))-Math.min(...transformed.map(p=>p.y))};if(b.width>3&&b.height>3&&b.width<c.width*.6&&Math.abs(center(b).x-center(c).x)<c.width*.3&&b.y<c.y+c.height*.25&&b.y+b.height>c.y-2)kind='control'}}}
        if(rects.length===2&&ink.length===2){const [a,b]=rects.map(box) as [Box,Box];if(Math.abs(a.width-b.width)<1&&Math.abs(a.height-b.height)<1&&Math.abs(a.x-b.x)>2&&Math.abs(a.x-b.x)<15&&Math.abs(a.y-b.y)>2&&Math.abs(a.y-b.y)<15)kind='collections'}
        if(!kind&&!(curves.length>=1&&curves.length<=2&&curves.length===ink.length)&&!(circles.length===1&&ink.length===1))continue
        const bounds=ink.map(box),x=Math.min(...bounds.map(b=>b.x)),y=Math.min(...bounds.map(b=>b.y)),union={x,y,width:Math.max(...bounds.map(b=>b.x+b.width))-x,height:Math.max(...bounds.map(b=>b.y+b.height))-y}
        if(caption.y-union.y-union.height>Math.max(20,caption.height*2)||Math.abs(center(union).x-center(caption).x)>Math.max(12,union.width*.6))continue
        sequenceKinds.set(expected.id,{kind,parts:ink});qualifiedParts.set(expected.id,ink)
        const anchorInk=['boundary','entity'].includes(kind??'')?circles:ink,anchorBounds=anchorInk.map(box),ax=Math.min(...anchorBounds.map(b=>b.x)),ay=Math.min(...anchorBounds.map(b=>b.y)),anchorBox={x:ax,y:ay,width:Math.max(...anchorBounds.map(b=>b.x+b.width))-ax,height:Math.max(...anchorBounds.map(b=>b.y+b.height))-ay};const actual:Owned={...expected,box:anchorBox,anchorParts:anchorInk.map(e=>({tag:e.localName,box:box(e)})),outline:{tag:ink.length===1?ink[0]!.localName:'compound-participant',rx:0,ry:0}}
        const previous=nodes.findIndex(n=>n.id===expected.id);if(previous>=0)nodes[previous]=actual;else nodes.push(actual);node.set(expected.id,actual)
        break
      }
    }
    if(sequenceKinds.size&&(input.expected.nodes??[]).every(expected=>node.has(expected.id))){exactNodes=evidence.get('painted-node-ownership')?.status!=='failed';add('painted-node-ownership',input.expected.nodes,nodes,exactNodes?true:null,'Each top participant caption owns a unique nearby measured symbolic header. Actual circle/limb, boundary, entity, stacked-box or curved-outline parts establish a physical anchor; source kinds, IDs and invisible layout boxes provide no ownership.')}
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
    if (wanted === 'rounded' || wanted === 'stadium') {
      const ratio = outline?.tag === 'rect' ? Math.max(outline.rx / b.width, outline.ry / b.height) : null
      if (ratio !== null) return { matches: wanted === 'stadium' ? ratio >= .48 : ratio > .01 && ratio < .48, actual: { ...actual, cornerRatio: ratio } }
      const contour = samples(body, 2048), radius = Math.min(b.width, b.height) / 2, horizontal = b.width >= b.height
      const capsuleErrors = contour.map(p => horizontal ? Math.abs(Math.hypot(Math.max(b.x + radius - p.x, 0, p.x - b.x - b.width + radius), p.y - center(b).y) - radius) : Math.abs(Math.hypot(p.x - center(b).x, Math.max(b.y + radius - p.y, 0, p.y - b.y - b.height + radius)) - radius))
      const capsule = contour.length > 32 && Math.max(...capsuleErrors) <= .75
      return { matches: wanted === 'stadium' ? capsule ? true : normalized.length ? false : null : null, actual: { ...actual, cornerRatio: null, capsuleMaximumError: Math.max(...capsuleErrors) } }
    }
    if (wanted === 'double-circle' || wanted === 'crossed-circle') {
      const rings = ink.filter(element => ['circle', 'ellipse'].includes(element.localName) && distance(center(box(element)), center(b)) <= 1.5 && Math.abs(box(element).width - box(element).height) < 2)
      const diagonals = ink.filter(element => { const ps = samples(element, 2); return ps.length === 3 && distance(ps[0]!, ps[2]!) > Math.min(b.width, b.height) * .6 && distance(ps[1]!, { x: (ps[0]!.x + ps[2]!.x) / 2, y: (ps[0]!.y + ps[2]!.y) / 2 }) < 1 && distance(ps[1]!, center(b)) < 2 })
      return { matches: wanted === 'double-circle' ? rings.length === 2 && Math.abs(box(rings[0]!).width - box(rings[1]!).width) > 2 : rings.length === 1 && diagonals.length === 2, actual }
    }
    if (wanted === 'subroutine' || wanted === 'lined-rectangle' || wanted === 'divided-rectangle' || wanted === 'window-pane') {
      const segments = ink.filter(strokePaint).flatMap(element => { const points = element.localName === 'path' && (element.getAttribute('d')?.match(/[mM]/g)?.length ?? 0) > 1 ? null : vertices(element), closed = ['polygon', 'rect'].includes(element.localName) || /z\s*$/i.test(element.getAttribute('d') ?? ''); return points ? points.slice(0, closed ? points.length : -1).map((p, i) => [p, points[(i + 1) % points.length]!]) : strokes(element).filter(straight).map(points => [points[0]!, points.at(-1)!]) })
      const unique = segments.filter(([a, c], index) => !segments.slice(0, index).some(([p, q]) => distance(a!, p!) <= .5 && distance(c!, q!) <= .5 || distance(a!, q!) <= .5 && distance(c!, p!) <= .5))
      const vertical = unique.filter(([a, c]) => Math.abs(a!.x - c!.x) < 1 && Math.abs(a!.y - c!.y) > b.height * .65 && a!.x > b.x + 1 && a!.x < b.x + b.width - 1), horizontal = unique.filter(([a, c]) => Math.abs(a!.y - c!.y) < 1 && Math.abs(a!.x - c!.x) > b.width * .65 && a!.y > b.y + 1 && a!.y < b.y + b.height - 1)
      const frame = normalized.length >= 4 && polygonTemplates.rectangle!.every(p => normalized.some(q => Math.abs(p.x - q.x) < .02 && Math.abs(p.y - q.y) < .02))
      return { matches: normalized.length ? frame && (wanted === 'subroutine' ? vertical.length === 2 : wanted === 'lined-rectangle' ? vertical.length === 1 : wanted === 'divided-rectangle' ? horizontal.length === 1 : horizontal.length === 1 && vertical.length === 1) : null, actual }
    }
    if (['cylinder', 'lined-cylinder', 'document', 'lined-document', 'paper-tape', 'flag', 'delay', 'curved-trapezoid', 'bowtie-rectangle', 'das'].includes(wanted)) {
      const contours = strokes(body, 2048).map(points => points.map(p => ({ x: (p.x - b.x) / b.width, y: (p.y - b.y) / b.height })))
      const intersections = (axis: 'x' | 'y', at: number) => {
        const other = axis === 'x' ? 'y' : 'x', values: number[] = []
        for (const points of contours) for (let i = 1; i < points.length; i++) { const a = points[i - 1]!, c = points[i]!, span = c[axis] - a[axis]; if (Math.abs(span) < 1e-8 || at < Math.min(a[axis], c[axis]) || at > Math.max(a[axis], c[axis])) continue; const value = a[other] + (at - a[axis]) / span * (c[other] - a[other]); if (!values.some(other => Math.abs(other - value) < .008)) values.push(value) }
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
      const capShifts = xs.slice(2, -2).map(values => values.length === 4 ? values[2]! - values[1]! : NaN), capRidge = capShifts.every(Number.isFinite) && Math.min(...capShifts) > 1.5 / b.height && range(capShifts) < Math.max(.012, 1.5 / b.height)
      if (cylinder) measured = capRidge ? 'lined-cylinder' : xs.slice(2, -2).every(values => values.length === 3) ? 'cylinder' : null
      else if (flat(top) && wave(bottom) && flat(left.slice(2, -2)) && flat(right.slice(2, -2))) measured = interiorVertical ? 'lined-document' : 'document'
      else if (wave(top) && wave(bottom) && flat(left.slice(2, -2)) && flat(right.slice(2, -2))) measured = 'paper-tape'
      else if (flat(top.slice(0, 3)) && flat(bottom.slice(0, 3)) && flat(left) && symmetric(right) && right[4]! > Math.max(right[0]!, right[8]!) + .02) measured = 'delay'
      else if (symmetric(left) && symmetric(right) && left[4]! < Math.min(left[0]!, left[8]!) - .02 && right[4]! > Math.max(right[0]!, right[8]!) + .02 && ys.slice(2, -2).every(values => values.length >= 3)) measured = 'das'
      else if (flat(top) && flat(bottom) && symmetric(left) && symmetric(right) && left[4]! > Math.max(left[0]!, left[8]!) + .015 && right[4]! < Math.min(right[0]!, right[8]!) - .015) measured = 'bowtie-rectangle'
      const requested = wanted === 'flag' ? 'paper-tape' : wanted, recognizedOther = ['rect', 'circle', 'ellipse'].includes(body.localName) || normalized.length > 0 && normalized.length <= 6
      return { actual: { ...actual, measured, top, bottom, left, right, interiorVertical, capRidge, capShifts }, matches: measured ? measured === requested : recognizedOther ? false : null }
    }
    // Curved compound/symbolic profiles require explicit topology evidence;
    // a bounding box or source shape string cannot silently satisfy them.
    return { matches: null, actual }
  }
  if (input.family === 'state') {
    let compositeAdded = false
    for (const entry of facts['state-kinds'] ?? []) if (entry.kind === 'composite-state' && group.has(entry.id) && (!node.has(entry.id) || !nearBox(node.get(entry.id)!.box, group.get(entry.id)!.box))) {
      const owner = group.get(entry.id)!, previous = node.get(entry.id), ink = geometry.filter(shape => nearBox(box(shape), owner.box) || !!previous && nearBox(box(shape), previous.box))
      if (!ink.length || label(owner.label).filter(element => contains(owner.box, box(element)) && safeText(element)).length !== 1) continue
      const actual: Owned = { id: entry.id, label: owner.label, box: owner.box, anchorParts: ink.map(element => ({ tag: element.localName, box: box(element) })), outline: { tag: ink[0]!.localName, vertices: vertices(ink[0]!), rx: 0, ry: 0 } }; node.set(entry.id, actual); const index = nodes.findIndex(node => node.id === entry.id); if (index < 0) nodes.push(actual); else nodes[index] = actual; compositeAdded = true
    }
    const missing = (input.expected.nodes ?? []).filter(expected => !expected.label && !node.has(expected.id)), blankCandidates: { shape: SVGGeometryElement; parts: SVGGeometryElement[]; box: Box; kind: string; index: number }[] = []
    // Reconstruct bounded flat SVG paint at physical sample points. A black
    // disc hidden by a later white disc cannot remain a visible start glyph.
    const rawInk = [...svg.querySelectorAll('rect,circle,ellipse,polygon,polyline,path,line')].filter(paintable) as SVGGeometryElement[]
    const layers = rawInk.map(element => {
      const css = getComputedStyle(element); let opacity = 1
      for (let parent: Element | null = element; parent; parent = parent.parentElement) { opacity *= Number(getComputedStyle(parent).opacity); if (parent === svg) break }
      return { element, matrix: element.getScreenCTM(), fill: rgba(css.fill), stroke: rgba(css.stroke), fillOpacity: opacity * Number(css.fillOpacity), strokeOpacity: opacity * Number(css.strokeOpacity), strokeWidth: Number.parseFloat(css.strokeWidth) }
    })
    let canvasColor = [255, 255, 255, 255]
    for (let parent: Element | null = svg; parent; parent = parent.parentElement) { const color = rgba(getComputedStyle(parent).backgroundColor); if (color?.[3] === 255) { canvasColor = color; break } }
    const rgbSame = (a: number[], b: number[]) => a.slice(0, 3).every((value, i) => Math.abs(value - b[i]!) <= 2)
    const pointColor = (point: Point) => {
      const color = [...canvasColor]
      const composite = (ink: number[], opacity: number) => { const alpha = ink[3]! / 255 * opacity; for (let i = 0; i < 3; i++) color[i] = color[i]! * (1 - alpha) + ink[i]! * alpha }
      for (const layer of layers) {
        if (!layer.matrix) continue
        const local = new DOMPoint(point.x, point.y).matrixTransform(layer.matrix.inverse())
        if (layer.fill && layer.fill[3] && layer.element.localName !== 'line' && layer.element.isPointInFill(local)) composite(layer.fill, layer.fillOpacity)
        if (layer.stroke && layer.stroke[3] && layer.strokeWidth > 0 && layer.element.isPointInStroke(local)) composite(layer.stroke, layer.strokeOpacity)
      }
      return color
    }
    const visibleCircleKind = (shape: SVGGeometryElement, b: Box): string | null => {
      if (evidence.get('paint-opacity-and-color')?.status !== 'passed' || [...svg.querySelectorAll('image,use')].some(element => { const other = box(element); return paintable(element) && Math.min(b.x + b.width, other.x + other.width) > Math.max(b.x, other.x) && Math.min(b.y + b.height, other.y + other.height) > Math.max(b.y, other.y) })) return null
      const origin = center(b), radius = Math.min(b.width, b.height) / 2, ring = (r: number) => Array.from({ length: 8 }, (_, i) => pointColor({ x: origin.x + Math.cos(i * Math.PI / 4) * r, y: origin.y + Math.sin(i * Math.PI / 4) * r }))
      const outerStrokes = layers.filter(layer => nearBox(box(layer.element), b) && layer.stroke?.[3] && layer.strokeOpacity > 0).map(layer => layer.strokeWidth * (layer.matrix ? Math.max(Math.hypot(layer.matrix.a, layer.matrix.b), Math.hypot(layer.matrix.c, layer.matrix.d)) : 1)), edgeInset = Math.max(.01, Math.min(radius * .04, Math.max(...outerStrokes, .1) / 4)), border = ring(radius - edgeInset), middle = pointColor(origin)
      for (const fraction of [.2, .3, .4, .5, .6, .7, .8]) {
        const gap = ring(radius * (fraction + 1) / 2), disc = ring(radius * fraction * .5)
        if (gap.every(color => rgbSame(color, gap[0]!)) && disc.every(color => rgbSame(color, middle)) && !rgbSame(middle, gap[0]!) && border.every(color => !rgbSame(color, gap[0]!))) return 'pseudostate-end'
      }
      const backdrops = layers.filter(layer => layer.matrix && layer.fill?.[3] === 255 && layer.fillOpacity >= .999 && area(box(layer.element)) > area(b) + 1 && !!(layer.element.compareDocumentPosition(shape) & Node.DOCUMENT_POSITION_FOLLOWING) && [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].every(([x, y]) => layer.element.isPointInFill(new DOMPoint(x, y).matrixTransform(layer.matrix!.inverse())))), background = backdrops.at(-1)?.fill ?? canvasColor
      const disc = [middle, ...ring(radius * .25), ...ring(radius * .5), ...ring(radius * .75)]
      return disc.every(color => rgbSame(color, middle) && !rgbSame(color, background)) ? 'pseudostate-start' : null
    }
    const round = (element: SVGGeometryElement) => { const b = box(element), points = samples(element, 128); return b.width > 2 && Math.abs(b.width - b.height) < 1.5 && points.length > 20 && points.every(p => Math.abs(((p.x - b.x) / b.width - .5) ** 2 * 4 + ((p.y - b.y) / b.height - .5) ** 2 * 4 - 1) < .07) }
    for (const shape of geometry) {
      const b = box(shape)
      if (nodes.some(owner => contains(owner.box, b)) || paintedText.some(element => contains(b, box(element))) || blankCandidates.some(candidate => nearBox(candidate.box, b))) continue
      if (round(shape)) {
        if (geometry.some(other => other !== shape && round(other) && contains(box(other), b, 0) && area(box(other)) > area(b) + 1)) continue
        const contained = geometry.filter(other => other !== shape && contains(b, box(other), .25)), clean = contained.every(other => round(other) && distance(center(box(other)), center(b)) < 1)
        const kind = clean ? visibleCircleKind(shape, b) ?? 'unclassified-round' : 'unclassified-round'
        blankCandidates.push({ shape, parts: [shape, ...contained], box: b, kind, index: blankCandidates.length })
      } else {
        const points = vertices(shape), norm = points?.map(p => ({ x: (p.x - b.x) / b.width, y: (p.y - b.y) / b.height })), diamond = norm?.length === 4 && polygonTemplates.diamond!.every(p => norm.some(q => distance(p, q) <= .04))
        const bar = shape.localName === 'rect' && Math.min(b.width, b.height) >= 2 && Math.max(b.width, b.height) >= Math.min(b.width, b.height) * 4 && (rgba(getComputedStyle(shape).fill)?.[3] ?? 0) > 0
        if (diamond || bar) {
          const contained = geometry.filter(other => other !== shape && contains(b, box(other), .25)), clean = contained.every(other => nearBox(box(other), b) && (diamond ? vertices(other)?.length === 4 && polygonTemplates.diamond!.every(p => vertices(other)!.some(q => distance(p, { x: (q.x - b.x) / b.width, y: (q.y - b.y) / b.height }) < .04)) : other.localName === 'rect'))
          blankCandidates.push({ shape, parts: [shape, ...contained], box: b, kind: clean ? diamond ? 'choice' : 'bar' : 'unclassified-symbol', index: blankCandidates.length })
        }
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
        nodes.push(observed); node.set(id, observed); qualifiedParts.set(id, candidate.parts)
      }
      exactNodes = evidence.get('painted-node-ownership')?.status !== 'failed' && (input.expected.nodes ?? []).every(expected => node.has(expected.id)) && mappings[0]!.size === blankCandidates.length
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
    let compositeAdded = false
    for (const expected of input.expected.nodes ?? []) if (!expected.label && !node.has(expected.id) && group.has(expected.id)) {
      const owner = group.get(expected.id)!, ink = geometry.filter(shape => nearBox(box(shape), owner.box))
      if (!ink.length) continue
      const actual: Owned = { ...expected, box: owner.box, anchorParts: ink.map(element => ({ tag: element.localName, box: box(element) })), outline: { tag: ink[0]!.localName, vertices: vertices(ink[0]!), rx: 0, ry: 0 } }; node.set(expected.id, actual); nodes.push(actual); compositeAdded = true
    }
    if (compositeAdded && (input.expected.nodes ?? []).every(expected => node.has(expected.id))) {
      exactNodes = evidence.get('painted-node-ownership')?.status !== 'failed'
      add('painted-node-ownership', input.expected.nodes, nodes, exactNodes ? true : null, 'A source composite block can also serve as a graph endpoint. Its independently qualified anonymous enclosing boundary is the actual endpoint body, with exact descendant ownership; an empty source label needs no invented text or public SVG identity.')
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
    let stereotypeRows: { text: string; box: Box; safe: boolean }[] | undefined
    const quotedRows = () => stereotypeRows ??= paintedText.flatMap(element => {
      const rows: { text: string; box: Box; safe: boolean }[] = [], walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      for (let child = walker.nextNode(); child; child = walker.nextNode()) { let offset = 0; for (const character of child.textContent ?? '') {
        const range = document.createRange(); range.setStart(child, offset); offset += character.length; range.setEnd(child, offset)
        const rects = [...range.getClientRects()].filter(b => b.width > 0 && b.height > 0); if (rects.length !== 1) continue
        const b = rects[0]!, row = rows.find(row => Math.abs(center(row.box).y - (b.y + b.height / 2)) < Math.min(row.box.height, b.height) * .35)
        if (!row) rows.push({ text: character, box: { x: b.x, y: b.y, width: b.width, height: b.height }, safe: safeText(element) })
        else { row.text += character; const right = Math.max(row.box.x + row.box.width, b.x + b.width), bottom = Math.max(row.box.y + row.box.height, b.y + b.height); row.box.x = Math.min(row.box.x, b.x); row.box.y = Math.min(row.box.y, b.y); row.box.width = right - row.box.x; row.box.height = bottom - row.box.y }
      } }
      return rows.filter(row => /^[«<]+[^«»<>]+[»>]+$/.test(normalize(row.text)))
    }).filter((row, index, all) => !all.slice(0, index).some(other => normalize(other.text) === normalize(row.text) && nearBox(other.box, row.box, .25)))
    const actual = facts['dialect-kinds'].map((entry: any) => {
      if (entry.kind === 'lane') { const owner = input.expected.groups?.[entry.declaration]; return { expected: entry, actual: owner ? group.get(owner.id) ?? null : null, matches: owner ? group.has(owner.id) : null } }
      if (['agent-flow', 'system-boundary'].includes(entry.kind)) return { expected: entry, actual: group.get(entry.id) ?? null, matches: group.has(entry.id) ? true : null }
      if (entry.kind === 'shared-global-scope') { const globals = checks.find(check => check.criterion === 'source-fact:global-node-scope'); return { expected: entry, actual: globals?.actual ?? null, matches: globals?.status === 'passed' ? true : globals?.status === 'failed' ? false : null } }
      if (entry.kind === 'actor') { const actor = actorProfiles.get(entry.id); return { expected: entry, actual: actor ? { kind: actor.kind, box: actor.box } : null, matches: actor ? true : null } }
      if (entry.kind === 'anonymous-use-case') { const shape = silhouette(entry.id, 'ellipse'); return { expected: entry, actual: shape.actual, matches: shape.matches } }
      if (entry.kind === 'stereotype') {
        const owner = node.get(entry.id), values = ownedText(entry.id), inside = values?.filter(element => normalize(readText(element)).replace(/^[«<]+|[»>]+$/g, '') === normalize(entry.value)) ?? []
        const rows = quotedRows().filter(row => normalize(row.text).replace(/^[«<]+|[»>]+$/g, '') === normalize(entry.value)).map(row => {
          const candidates = nodes.map(owner => { const a = owner.box, b = row.box, gap = Math.max(a.y - b.y - b.height, b.y - a.y - a.height, 0), horizontal = Math.abs(center(a).x - center(b).x), distance = Math.hypot(Math.max(a.x - b.x - b.width, b.x - a.x - a.width, 0), gap); return { id: owner.id, distance, qualifies: contains(a, b) || horizontal <= Math.max(2, a.width * .15) && gap <= b.height * 2 } }).filter(owner => owner.qualifies).sort((a, b) => a.distance - b.distance)
          return { text: normalize(row.text), box: row.box, safe: row.safe, owner: candidates[0] && (!candidates[1] || candidates[1].distance > candidates[0].distance + 1.5) ? candidates[0].id : null }
        })
        const attached = rows.filter(row => row.owner === entry.id), complete = !!owner && rows.length > 0 && rows.every(row => row.safe && row.owner !== null)
        return { expected: entry, actual: { inside: inside.map(element => normalize(readText(element))), glyphRows: rows }, matches: rows.length ? complete ? attached.length === 1 : null : owner && inside.length && inside.every(safeText) ? inside.length === 1 : null }
      }
      if (entry.kind === 'json-table') {
        const values = ownedText(entry.id), owner = node.get(entry.id), rows: { y: number; height: number; cells: { x: number; value: string }[] }[] = []
        for (const element of values?.filter(element => normalize(readText(element)) !== normalize(owner?.label ?? '')).sort((a, b) => box(a).y - box(b).y) ?? []) {
          const b = box(element), y = center(b).y, row = rows.find(row => Math.abs(row.y - y) < Math.min(row.height, b.height) * .35), cell = { x: b.x, value: normalize(readText(element)) }
          if (row) row.cells.push(cell); else rows.push({ y, height: b.height, cells: [cell] })
        }
        const observed = rows.sort((a, b) => a.y - b.y).map(row => { const cells = row.cells.sort((a, b) => a.x - b.x); return { path: cells[0]?.value, value: cells[1]?.value, unresolved: cells.length !== 2 } }), expected = entry.rows.map((row: any) => ({ path: normalize(String(row.path)), value: normalize(String(row.value)), unresolved: false }))
        return { expected: entry, actual: observed, matches: owner && values?.every(safeText) && observed.length > 0 && observed.every(row => !row.unresolved) ? same(expected, observed) : null }
      }
      if (['include', 'extend', 'generalization'].includes(entry.kind)) {
        const candidates = relation(entry.source, entry.target, entry.kind === 'generalization' ? undefined : entry.kind), route = candidates.length === 1 ? candidates[0] : null, marker = route ? route.source === entry.source ? route.endMarker : route.startMarker : null
        return { expected: entry, actual: route, matches: routesBound && route ? entry.kind === 'generalization' ? marker === 'triangle' && routePattern(route) === 'solid' : ['arrow', 'triangle'].includes(marker ?? '') && routePattern(route) === 'dotted' && route.labels?.includes(entry.kind) : null }
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
      const stroke = routePattern(route), thick = entry.stroke === 'thick'
      if (stroke === null&&entry.stroke!==undefined) available = false
      const thickPeers = new Set<Route>(facts['edge-appearance'].filter((item: any) => item.stroke === 'thick').flatMap((item: any) => relation(item.source ?? item.from, item.target ?? item.to)))
      const baseline = routes.filter(other => other !== route && routePattern(other) === 'solid' && !thickPeers.has(other)).map(other => other.strokeWidth).filter((value): value is number => Number.isFinite(value))
      if (thick && !baseline.length) available = false
      const patternMatches=entry.stroke===undefined||(thick?Number.isFinite(route.strokeWidth)&&baseline.every(width=>route.strokeWidth!>width+.1):['dashed','dotted'].includes(entry.stroke)?stroke==='dotted':stroke===entry.stroke)
      return { expected: entry, actual: { stroke, startMarker, endMarker, width: route.strokeWidth }, matches: patternMatches && (entry.markerStart === undefined || startMarker === entry.markerStart) && (entry.markerEnd === undefined || endMarker === entry.markerEnd) }
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
      if (kind && !marker) { const owned = qualifiedInlineRouteParts.get(route) ?? new Map(); owned.set(id, shapes); qualifiedInlineRouteParts.set(route, owned) }
      return { kind, bars, circles, forks }
    }
    const actual = facts.cardinalities.map((entry: any) => { const candidates = relation(entry.from, entry.to), route = candidates.length === 1 ? candidates[0] : null; return { from: entry.from, to: entry.to, left: route ? glyph(route, entry.from) : null, right: route ? glyph(route, entry.to) : null, identifying: route && routePattern(route) !== null ? routePattern(route) === 'solid' : null } })
    const ready = exactNodes && actual.every((entry: any) => entry.left?.kind && entry.right?.kind && entry.identifying !== null)
    const passed = ready && actual.every((entry: any, i: number) => entry.left.kind === facts.cardinalities[i].left && entry.right.kind === facts.cardinalities[i].right && entry.identifying === facts.cardinalities[i].identifying)
    const scope = 'Each exact entity pair owns its measured stem and endpoint decorations. Two bars, optional circle, three-way foot topology and the identifying/nonidentifying dash are counted from actual marker content or physically adjacent inline glyphs; marker IDs and class names have no semantic meaning. Unprojected glyph topology stays unknown.'
    fact('cardinalities', actual, ready ? passed : null, scope)
    add('painted-cardinality-decorations', facts.cardinalities, actual, ready ? passed : null, scope)
  }

  if (input.family === 'sequence') {
    for(const route of routes){const ps=[route.start,route.end].filter((p):p is Point=>!!p),ports=geometry.filter(e=>e.localName==='circle'&&box(e).width>=4&&box(e).width<=16&&Math.abs(box(e).width-box(e).height)<1&&ps.some(p=>Math.abs(center(box(e)).y-p.y)<1&&distance(center(box(e)),p)<=15)&&[route.source,route.target].some(id=>{const owner=node.get(id);return owner&&Math.abs(center(owner.box).x-center(box(e)).x)<2}));sequenceRoutePorts.set(route,ports)}
    if(Array.isArray(facts['box-appearance'])){const actual=facts['box-appearance'].map((entry:any)=>{const owner=group.get(entry.id),rects=owner?geometry.filter(e=>e.localName==='rect'&&nearBox(box(e),owner.box)):[],wanted=rgba(entry.color),colors=rects.map(e=>rgba(getComputedStyle(e).fill));return {id:entry.id,wanted,colors,matches:owner&&colors.length===1&&wanted&&colors[0]?wanted.slice(0,3).every((v:number,i:number)=>v===colors[0]![i]):null}});fact('box-appearance',actual,actual.every((a:any)=>a.matches!==null)?actual.every((a:any)=>a.matches):null,'Each source box color binds the actual independently owned enclosing group rectangle. Authored RGB components stay strict; unrequested skin alpha is free only while real fill ink remains inspectable.')}
    if (Array.isArray(facts['participant-order'])) {
      const actual = facts['participant-order'].map((id: string) => ({ id, x: node.get(id) ? center(node.get(id)!.box).x : null }))
      fact('participant-order', actual, exactNodes && actual.every((item: any) => item.x !== null) ? actual.every((item: any, i: number) => !i || item.x > Number(actual[i - 1]?.x) + 1) : null, 'Source participant order binds distinct owned header bodies; actual left-to-right header centers establish order, independent of DOM declaration order and lifeline IDs.')
    }
    if (Array.isArray(facts['participant-kinds'])) {
      const actual = facts['participant-kinds'].map((entry: any) => { const profile=sequenceKinds.get(entry.id),curved=entry.kind==='database'?silhouette(entry.id,'cylinder'):null; if(entry.kind==='queue'&&profile){const outer=profile.parts.find(e=>/[zZ]\s*$/.test(e.getAttribute('d')??'')),arc=profile.parts.find(e=>e!==outer),b=outer?box(outer):null,ps=arc?samples(arc):[],ends=ps.length?[ps[0]!,ps.at(-1)!]:[];const matches=!!outer&&!!arc&&!!b&&profile.parts.length===2&&Math.abs(box(arc).height-b.height)<1&&box(arc).x>b.x+b.width*.65&&ends.length===2&&Math.abs(ends[0]!.x-ends[1]!.x)<1&&Math.abs(ends[0]!.y-ends[1]!.y)>b.height*.95&&ps.some(p=>p.x<ends[0]!.x-2)&&ps.every(p=>p.x<=ends[0]!.x+1);return {id:entry.id,kind:entry.kind,shape:{matches,actual:{parts:profile.parts.map(e=>({tag:e.localName,box:box(e)}))}},extraAttributes:entry.attributes}}; const shape=profile?.kind ? {matches:profile.kind===entry.kind,actual:{kind:profile.kind,parts:profile.parts.map(e=>({tag:e.localName,box:box(e)}))}} : curved??silhouette(entry.id,entry.kind==='participant'?'rectangle':entry.kind);return {id:entry.id,kind:entry.kind,shape,extraAttributes:entry.attributes} })
      fact('participant-kinds', actual, actual.every((entry: any) => !entry.extraAttributes && entry.shape.matches !== null) ? actual.every((entry: any) => entry.shape.matches) : null, 'Each participant kind needs its actual owned header glyph. A rectangular participant is measured as a rectangle; symbolic actor/database/boundary/control/entity/collection/queue glyphs need their explicit compound topology, never the source kind or generated class.')
    }
    if (Array.isArray(facts['message-style']) && facts['message-style'].some((style: string) => !['->>', '-->>', '->', '-->'].includes(style))) {
      const actual = orderedRoutes.map(route => {
        const pattern = routePattern(route); if (pattern === null) return null
        const prefix = pattern === 'solid' ? '-' : '--', a = route.startMarker, b = route.endMarker
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
      const frames: Box[] = geometry.filter(element => element.localName === 'rect' && textBounds(element).width > 30 && textBounds(element).height > 20).map(box)
      for (const top of horizontal) for (const bottom of horizontal) {
        const x = Math.min(top.a.x, top.b.x), right = Math.max(top.a.x, top.b.x), y = top.a.y, lower = bottom.a.y
        if (lower <= y + 20 || Math.abs(Math.min(bottom.a.x, bottom.b.x) - x) > 1 || Math.abs(Math.max(bottom.a.x, bottom.b.x) - right) > 1) continue
        if ([x, right].every(side => vertical.some(line => Math.abs(line.a.x - side) < 1 && Math.abs(Math.min(line.a.y, line.b.y) - y) <= 1 && Math.abs(Math.max(line.a.y, line.b.y) - lower) <= 1))) frames.push({ x, y, width: right - x, height: lower - y })
      }
      const unique = frames.filter((candidate, i) => !frames.slice(0, i).some(other => nearBox(candidate, other)))
      const caption = (value: string) => {const exact=completeLabel(value);return exact.length?exact:completeLabel('['+value+']')}
      const actual = facts.fragments.map((entry: any, index: number) => {
        const text = entry.caption ?? entry.label ?? '', branch = ['else', 'and', 'option'].includes(entry.kind), parent = branch ? fragmentOwners.get(entry.parent) : undefined
        const captions = entry.kind === 'rect' ? [] : caption(text), badges = label(entry.kind).filter(safeText)
        const matching = unique.filter(frame => {
          if (branch) return parent && nearBox(parent, frame)
          const first = orderedRoutes[entry.beginMessage]?.box, last = orderedRoutes[entry.endMessage - 1]?.box
          const inside = (b: Box) => contains(frame, b, 2)
          if (entry.kind === 'rect') { const colors = geometry.filter(element => nearBox(textBounds(element), frame)).map(element => rgba(getComputedStyle(element).fill)); return colors.some(color => color && same(color, rgba(text))) && (!first || inside(first)) && (!last || inside(last)) }
          return captions.filter(element => contains(frame, textBounds(element))).length === 1 && badges.filter(element => contains(frame, textBounds(element)) && textBounds(element).y < frame.y + 35).length === 1
        }).sort((a, b) => area(a) - area(b))
        const frame = matching[0], header = frame && captions.filter(element => contains(frame, textBounds(element))).sort((a, b) => box(a).y - box(b).y)[0], boundary = branch && header ? textBounds(header).y + textBounds(header).height : frame?.y
        if (!frame || matching[1] && Math.abs(area(matching[1]) - area(frame)) <= 1) return { index, expected: entry, box: null, matches: null }
        fragmentOwners.set(index, frame); if (header) fragmentCaptions.set(index, header)
        const before = entry.beginMessage > 0 ? orderedRoutes[entry.beginMessage - 1]?.box : null, next = orderedRoutes[entry.endMessage]?.box
        const lower=branch&&header?horizontal.filter(line=>Math.abs(Math.min(line.a.x,line.b.x)-frame.x)<2&&Math.abs(Math.max(line.a.x,line.b.x)-frame.x-frame.width)<2&&line.a.y>textBounds(header).y+textBounds(header).height).sort((a,b)=>a.a.y-b.a.y)[0]?.a.y??frame.y+frame.height:frame.y+frame.height;const inside = orderedRoutes.slice(entry.beginMessage, entry.endMessage).every(route => contains(frame, route.box!, 2) && (!branch || route.box!.y >= boundary! - 2&&route.box!.y+route.box!.height<lower+2))
        const outside = (!before || before.y < boundary! + 2) && (!next || next.y > lower - 2)
        const nesting = (entry.nesting ?? []).every((parent: number) => fragmentOwners.has(parent) && contains(fragmentOwners.get(parent)!, frame) && area(fragmentOwners.get(parent)!) > area(frame) + 1)
        return { index, expected: entry, box: frame, header: header ? textBounds(header) : null, matches: inside && outside && nesting }
      })
      fact('fragments', actual, messagesBound && actual.every((entry: any) => entry.matches !== null) ? actual.every((entry: any) => entry.matches) : null, 'Complete fragment/branch intervals bind physical closed frames, painted kind badges/captions, separators and the exact chronological message interval; nested regions must be strictly contained. Four measured border strokes can establish a frame without a rect or renderer wrapper. Unbound/ambiguous branch geometry remains unknown.')
    }
    if (Array.isArray(facts.lifecycles)) {
      const activations = geometry.filter(element => element.localName === 'rect' && box(element).width >= 2 && box(element).width <= 30 && box(element).height > 2 && !nodes.some(owner => nearBox(owner.box, box(element))))
      const slot = (y: number, beforeMessage: number) => { const before = orderedRoutes[beforeMessage - 1]?.box, after = orderedRoutes[beforeMessage]?.box; return (!before || y >= before.y - 3) && (!after || y <= after.y + 3) }
      const paired=new Map<number,{start:any;end:any}>(), stacks=new Map<string,{entry:any;index:number}[]>();facts.lifecycles.forEach((entry:any,index:number)=>{if(entry.kind==='activate')stacks.set(entry.actor,[...(stacks.get(entry.actor)??[]),{entry,index}]);if(entry.kind==='deactivate'){const start=stacks.get(entry.actor)?.pop();if(start){const pair={start:start.entry,end:entry};paired.set(start.index,pair);paired.set(index,pair)}}}); const used = new Set<Element>(), actual = facts.lifecycles.map((entry: any,index:number) => {
        const owner = node.get(entry.actor)
        if (entry.kind === 'central-lifeline-connection') { const route=orderedRoutes[entry.message], ports=route?sequenceRoutePorts.get(route)??[]:[],a=route&&node.get(route.source),b=route&&node.get(route.target);return {expected:entry,ports:ports.map(box),matches:route&&a&&b?(!entry.from||ports.some(p=>Math.abs(center(box(p)).x-center(a.box).x)<2))&&(!entry.to||ports.some(p=>Math.abs(center(box(p)).x-center(b.box).x)<2)):null} }
        if (!owner || !['activate', 'deactivate'].includes(entry.kind)) return { expected: entry, matches: null }
        const pair=paired.get(index), candidates = activations.filter(element => Math.abs(center(box(element)).x - center(owner.box).x) <= 12 && (pair ? slot(box(element).y,pair.start.beforeMessage)&&slot(box(element).y+box(element).height,pair.end.beforeMessage) : slot(entry.kind === 'activate' ? box(element).y : box(element).y + box(element).height, entry.beforeMessage)))
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
      if (!pitches.length) for (const a of ink) for (const b of ink) if (a.span !== b.span) pitches.push((b.body.width - a.body.width) / (b.span - a.span))
      const pitch = pitches.length ? pitches.reduce((sum, value) => sum + value, 0) / pitches.length : null
      const gaps = pitch === null ? [] : ink.map((entry: any) => entry.span * pitch - entry.body.width), gap = gaps.length ? gaps.reduce((sum: number, value: number) => sum + value, 0) / gaps.length : null
      const origin = pitch === null ? null : ink[0].body.x - ink[0].column * pitch
      const rows = [...new Set(ink.map((entry: any) => entry.row))].map(row => ({ row, values: ink.filter((entry: any) => entry.row === row).map((entry: any) => entry.body) })) as { row: number; values: Box[] }[]
      const rowOkay = rows.every(row => row.values.every(b => Math.abs(center(b).y - center(row.values[0]!).y) <= 2)) && rows.every((row, i) => !i || Math.min(...row.values.map(b => b.y)) >= Math.max(...rows[i - 1]!.values.map(b => b.y + b.height)) - 1.5)
      const latticeOkay = pitch === null ? ink.every((entry: any) => entry.column === 0 && entry.span === columns) : pitch > 0 && gap! >= -1.5 && gaps.every((value: number) => Math.abs(value - gap!) <= 2) && ink.every((entry: any) => Math.abs(entry.body.x - origin! - entry.column * pitch) <= 2)
      if (pitch === null && !latticeOkay) available = false
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
    if (typeof facts.columns === 'number') {
      const root = facts['grid-columns'].find((entry: any) => entry.group === null)
      fact('columns', observations, !root || facts.columns !== root.value ? null : available ? passed : null, 'The authored root column-count profile uses the complete measured grid traversal, row wrapping and width/span lattice. A conflicting alias is unresolved rather than a renderer failure; no matching source number supplies geometry credit.')
    }
    if (Array.isArray(facts.spans)) {
      const measured = facts.spans.map((entry: any) => {
        const candidates = (observations as any[]).flatMap(observation => observation.cells?.filter((cell: any) => cell.id === entry.id).map((cell: any) => ({ cell, observation })) ?? []), selected = candidates.length === 1 ? candidates[0] : null, columns = selected?.cell.body && Number.isFinite(selected.observation.pitch) ? (selected.cell.body.width + selected.observation.gap) / selected.observation.pitch : selected?.cell.span === 1 && selected.observation.config.value === 1 ? 1 : null
        return { id: entry.id, expected: entry.columns, measuredColumns: columns, matches: selected?.cell.span !== entry.columns ? null : columns !== null ? Math.abs(columns - entry.columns) <= .025 : null }
      })
      fact('spans', measured, available && measured.every((entry: any) => entry.matches !== null) ? measured.every((entry: any) => entry.matches) : null, 'Every original authored span independently binds its actual body width on the enclosing grid pitch after restoring the measured common gutter. Missing pitch evidence and conflicting aliases remain unknown; group IDs and source span numbers are not observations.')
    }
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
        const owner = node.get(entry.id) ?? group.get(entry.id), values = ownedText(entry.id), fields = values?.map(element => ({ text: normalize(readText(element)), element, weight: Number(getComputedStyle(element).fontWeight), size: Number.parseFloat(getComputedStyle(element).fontSize) })) ?? [], expectedType = typeName(entry.kind)
        const typeCandidates = fields.filter(field => /^[«\[].*[»\]]$/.test(field.text) && /^(?:person|system|container|component|enterprise|boundary|deployment[ _]?node)(?::|$)/.test(field.text.toLowerCase().replace(/^[«\[]|[»\]]$/g, '').replace(/^(?:external\s+)?software\s+|^external\s+/, ''))), smallestType = Math.min(...typeCandidates.map(field => field.size)), typeRows = typeCandidates.filter(field => Math.abs(field.size - smallestType) < .1)
        const nonType = fields.filter(field => !typeRows.includes(field)), greatestWeight = Math.max(...nonType.map(field => field.weight)), weighted = nonType.filter(field => field.weight === greatestWeight), largestHeading = Math.max(...weighted.map(field => field.size)), emphasized = weighted.filter(field => greatestWeight >= 600 && Math.abs(field.size - largestHeading) < .1), orderedFields = [...nonType].sort((a, b) => box(a.element).y - box(b.element).y), first = orderedFields[0], rowStack = orderedFields.every((field, i) => !i || box(field.element).y >= box(orderedFields[i - 1]!.element).y + box(orderedFields[i - 1]!.element).height - 1.5), header = emphasized.length === 1 ? emphasized : first && rowStack && first.text === normalize(entry.label) ? [first] : []
        const boundary = /Boundary/.test(entry.kind), consumeType = !boundary || entry.extraVisibleFields.length === 0, contents = fields.filter(field => !header.includes(field) && (!consumeType || !typeRows.includes(field))), technology = consumeType ? typeRows.flatMap(field => { const match = /:\s*(.+?)[»\]]?$/.exec(field.text); return match ? [match[1]!] : [] }) : []
        const observedFields = [...contents.map(field => boundary ? field.text.replace(/^[«\[]|[»\]]$/g, '') : field.text), ...technology].filter(Boolean).sort(), expectedFields = entry.extraVisibleFields.map((value: string) => normalize(value)).filter(Boolean).sort(), actualType = typeRows.length === 1 ? typeRows[0]!.text.toLowerCase().replace(/^[«\[]|[»\]]$/g, '').replace(/^(?:external\s+)?software\s+|^external\s+/, '').split(':')[0]!.trim() : null
        const technologyKind = /^(?:Container|Component)/.test(entry.kind), expectedTechnology = normalize(entry.extraVisibleFields[0] ?? ''), firstContent = [...contents].sort((a, b) => box(a.element).y - box(b.element).y)[0], technologyMatches = !technologyKind ? true : technology.length === 1 ? normalize(technology[0]!) === expectedTechnology : !expectedTechnology ? technology.length === 0 : !technology.length && firstContent?.text === expectedTechnology ? true : null
        const ink = parts(entry.id), heads = ink.filter(shape => ['circle', 'ellipse'].includes(shape.localName) && ink.some(torso => torso.localName === 'rect' && box(torso).width > box(shape).width && center(box(shape)).y < box(torso).y + 2)), torsos = ink.filter(shape => shape.localName === 'rect' && heads.some(head => center(box(head)).y < box(shape).y + 2) && box(shape).width > 0 && box(shape).height > 0)
        let kind: boolean | null = expectedType === 'person' ? heads.length === 1 && torsos.length === 1 : entry.kind.includes('Boundary') ? !!group.get(entry.id) : /Db|Queue/.test(entry.kind) ? null : silhouette(entry.id, 'rectangle').matches
        if (expectedType === 'person' && kind === true) qualifiedParts.set(entry.id, [...heads, ...torsos])
        if (/_Ext$/.test(entry.kind)) {
          const peers = facts.elements.filter((peer: any) => !/_Ext$/.test(peer.kind) && typeName(peer.kind) === expectedType).map((peer: any) => node.get(peer.id)).filter(Boolean), own = node.get(entry.id)
          const printed = fields.some(field => /external/i.test(field.text)), contrast = own?.style && peers.length ? peers.every((peer: Owned) => peer.style && !same([peer.style.fill, peer.style.stroke], [own.style.fill, own.style.stroke])) : null
          kind = kind === false ? false : printed || contrast === true ? kind : null
        }
        return { id: entry.id, expectedKind: entry.kind, header: header.map(field => field.text), observedFields, typeRows: typeRows.map(field => field.text), technologyMatches, shapeMatches: kind, safe: values?.every(safeText) ?? false, rolesReady: header.length === 1 && (typeRows.length === 1 || boundary) && technologyMatches !== null, matches: !!owner && header.length === 1 && header[0]!.text === normalize(entry.label) && (boundary || actualType === expectedType) && technologyMatches === true && same(expectedFields, observedFields) && kind === true }
      })
      fact('elements', actual, actual.every((entry: any) => entry.safe && entry.rolesReady && entry.shapeMatches !== null) ? actual.every((entry: any) => entry.matches) : null, 'Every C4 element owns its measured header, bracketed type/technology, exact remaining field inventory and actual person/box/boundary geometry. Unique weight/size hierarchy establishes the header before text comparison; a separated plain row stack additionally qualifies a matching first non-type header, while an ambiguous alternate order stays unknown. External variants without visible distinction and database/queue topology remain unknown; source/model kind strings earn no credit.')
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
      const canonical = (value: string) => {
        // A generic type opens immediately after its type name. Closing tildes
        // unwind that nesting; a flat pair replacement corrupts List~List~T~~.
        const source = normalize(value), chars = [...source]; let depth = 0, typed = ''
        for (const [index, char] of chars.entries()) {
          if (char !== '~' || index === 0) { typed += char; continue }
          if (/[\p{L}\p{N}_.$]/u.test(chars[index - 1] ?? '') && /[\p{L}_$]/u.test(chars[index + 1] ?? '')) { typed += '<'; depth++ }
          else if (depth) { typed += '>'; depth-- } else return null
        }
        if (depth) return null
        const member = typed.replace(/[$*]$/, '').replace(/^([+\-#~])\s+/, '$1').replace(/\)\s*:\s*/g, ') ').replace(/\s*:\s*/g, ':')
        if (member.includes('(')) return member
        const access = /^([+\-#~])/.exec(member)?.[1] ?? '', body = member.slice(access.length), name = '[\\p{L}_$][\\p{L}\\p{N}_$]*', type = '[\\p{L}_$][\\p{L}\\p{N}_.$]*(?:<[\\p{L}\\p{N}_.$?,<>\\[\\] ]+>)?(?:\\[\\])*'
        const suffix = new RegExp('^(' + name + '):(' + type + ')$', 'u').exec(body), prefix = new RegExp('^(' + type + ')\\s+(' + name + ')$', 'u').exec(body)
        const compactType = (value: string) => value.replace(/\s*([<>,\[\]])\s*/g, '$1')
        return suffix ? access + suffix[1] + ':' + compactType(suffix[2]!) : prefix ? access + prefix[2] + ':' + compactType(prefix[1]!) : member
      }
      const actual = facts.members.map((entry: any) => {
        const owner = node.get(entry.id), elements = ownedText(entry.id), generic = facts.generics?.find((generic: any) => generic.id === entry.id), header = owner ? normalize(owner.label + (generic ? '<' + generic.parameter.replaceAll('~', '') + '>' : '')) : null
        const annotations = (facts.annotations ?? []).filter((annotation: any) => annotation.id === entry.id).map((annotation: any) => normalize(annotation.annotation))
        const content = elements?.filter(element => { const value = normalize(readText(element)); return value !== header && !annotations.includes(value.replace(/^[«<]+|[»>]+$/g, '')) }) ?? []
        const observed = content.map(element => { const css = getComputedStyle(element), children = [...element.querySelectorAll('*')], styles = [css, ...children.map(child => getComputedStyle(child))]; return { value: canonical(readText(element)), italic: styles.some(style => ['italic', 'oblique'].includes(style.fontStyle)), underline: styles.some(style => style.textDecorationLine.split(' ').includes('underline')), safe: safeText(element) } })
        const expected = entry.values.map((value: string) => ({ value: canonical(value), italic: /\*$/.test(value), underline: /\$$/.test(value) }))
        const key = (value: any) => JSON.stringify([value.value, value.italic, value.underline])
        return { id: entry.id, expected, observed, ready: !!owner && !!elements && expected.every((value: any) => value.value !== null) && observed.every(value => value.safe && value.value !== null), matches: same(expected.map(key).sort(), observed.map(key).sort()) }
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
      const routeEnds = routes.flatMap(route => [{ route, id: route.source, point: route.start }, { route, id: route.target, point: route.end }]).filter(end => end.point)
      const actual = facts.cardinalities.map((entry: any) => {
        const candidates = relation(entry.from, entry.to), route = candidates.length === 1 ? candidates[0] : null
        const values = ['left', 'right'].map(side => { const id = side === 'left' ? entry.from : entry.to, endpoint = route && ends(route, id), otherEndpoint = route && ends(route, side === 'left' ? entry.to : entry.from), owner = node.get(id), value = entry[side]; let ambiguous = false; const found = value && endpoint && otherEndpoint ? label(value).filter(element => {
          const b = box(element), p = center(b), d = distance(p, endpoint)
          if (nodes.some(n => contains(n.box, b)) || d > Math.max(35, b.width + b.height) || d + 2 >= distance(p, otherEndpoint)) return false
          const peers = routeEnds.filter(end => end.route !== route || end.id !== id).map(end => distance(p, end.point!)), nearest = Math.min(...peers)
          if (Math.abs(d - nearest) <= 2) ambiguous = true
          return d + 2 < nearest
        }) : []; return { side, value, occurrences: found.length, safe: found.every(safeText), owner: !!owner, ambiguous } })
        return { from: entry.from, to: entry.to, route: !!route, values, matches: values.every(item => item.owner && item.safe && (!item.value || item.occurrences === 1)) }
      })
      fact('cardinalities', actual, routesBound && actual.every((entry: any) => entry.route && entry.values.every((value: any) => !value.ambiguous)) ? actual.every((entry: any) => entry.matches) : null, 'Every nonempty class cardinality is a visible route-end caption outside node bodies, uniquely nearer its own measured endpoint than all other actual relation ends. Exact endpoint pairs and unique occurrences reject swapped, extra, and borrowed labels; tied/crowded endpoint ownership remains unknown.')
    }
  }

  // A note must own physical text inside a distinct note body and a measured
  // side/attachment. A matching string elsewhere is insufficient.
  if (Array.isArray(facts.notes)) {
    const actual = facts.notes.map((entry: any, index: number) => {
      const declaredLines=(facts['text-line-breaks']??[]).find((item:any)=>item.owner?.kind==='note'&&item.owner.index===index)?.lines, wanted=Array.isArray(declaredLines)?declaredLines.join(' '):entry.text,occurrences = completeLabel(wanted), texts = occurrences.filter(element => !nodes.some(owner => contains(owner.box, box(element))))
      const element = texts.length === 1 ? texts[0] : null, b = element ? textBounds(element) : null
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
        if (entry.fragmentScope?.length) attached = attached && entry.fragmentScope.every((scope:any)=>{const frame=fragmentOwners.get(typeof scope==='number'?scope:scope.fragment);return frame&&bounds&&bounds.y>=frame.y&&bounds.y+bounds.height<=frame.y+frame.height})
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
      const lines = existing?.length === 1 && existing[0]!.lines ? existing[0]!.lines : element ? (()=>{const parts=completeBlocks.get(element)??[element],rows=parts.map(glyphRows);return rows.every(Boolean)?(rows as string[][]).flat():null})() : null, valid = Array.isArray(entry.lines) && entry.lines.every((line: any) => typeof line === 'string' && normalize(line))
      return { owner: entry.owner, lines, matches: lines && valid ? partition(entry.lines, lines) : null }
    })
    fact('text-line-breaks', actual, actual.some((entry: any) => entry.matches === false) ? false : actual.some((entry: any) => entry.matches === null) ? null : true, 'Every explicit note/fragment/box break partitions actual per-character glyph rows on its independently qualified physical owner. Existing qualified node/message rows are retained. Soft wrapping can add rows, while two authored lines cannot collapse together; ambiguous ownership and empty-line spacing remain unknown.')
  }
  if (input.expected.nodes?.length) {
    const raw = [...svg.querySelectorAll('rect,circle,ellipse,polygon,polyline,path,line,image,use,foreignObject')].filter(paintable)
    const layers = raw.map(element => { const css = getComputedStyle(element); let opacity = 1; for (let parent: Element | null = element; parent; parent = parent.parentElement) { opacity *= Number(getComputedStyle(parent).opacity); if (parent === svg) break }; return { element, box: box(element), matrix: (element as SVGGraphicsElement).getScreenCTM?.(), fill: rgba(css.fill), stroke: rgba(css.stroke), fillOpacity: Number(css.fillOpacity) * opacity, strokeOpacity: Number(css.strokeOpacity) * opacity, width: Number.parseFloat(css.strokeWidth) } })
    const sameGeometry = (a: SVGGeometryElement, b: Element) => {
      if (!nearBox(box(a), box(b), .25)) return false
      if (a.localName === 'path' && b.localName === 'path') { const first = a.getScreenCTM(), second = (b as SVGGraphicsElement).getScreenCTM(); return a.getAttribute('d') === b.getAttribute('d') && !!first && !!second && (['a', 'b', 'c', 'd', 'e', 'f'] as const).every(key => Math.abs(first[key] - second[key]) < 1e-8) }
      if (a.localName !== b.localName) return false
      return ['circle', 'ellipse'].includes(a.localName) || a.localName === 'rect' && (a as SVGRectElement).rx.baseVal.value === (b as SVGRectElement).rx.baseVal.value && (a as SVGRectElement).ry.baseVal.value === (b as SVGRectElement).ry.baseVal.value || ['polygon', 'polyline'].includes(a.localName) && a.getAttribute('points') === b.getAttribute('points')
    }
    // SVG lines have no filled area. A path made only of straight, collinear
    // subpaths also paints no fill: each open subpath closes back along its
    // own line. Inherited fill on such a border is not an interior body layer.
    const zeroFillArea = (shape: SVGGeometryElement) => {
      if (shape.localName === 'line') return true
      if (shape.localName !== 'path') return false
      const data = shape.getAttribute('d') ?? '', numbers = /[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi
      if (!data || data.replace(numbers, '').replace(/[MLCZ\s,]/g, '')) return false
      const tokens = data.match(/[MLCZ]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) ?? [], paths: Point[][] = []; let at = 0, command = '', current: Point[] | null = null
      while (at < tokens.length) {
        if (/^[MLCZ]$/.test(tokens[at]!)) command = tokens[at++]!
        if (command === 'Z') { command = ''; continue }
        const count = command === 'C' ? 6 : ['M','L'].includes(command) ? 2 : 0
        if (!count || at + count > tokens.length || tokens.slice(at, at + count).some(token => !Number.isFinite(Number(token)))) return false
        const values = tokens.slice(at, at + count).map(Number); at += count
        if (command === 'M') { current = []; paths.push(current); command = 'L' }
        if (!current) return false
        for (let index = 0; index < values.length; index += 2) current.push({ x: values[index]!, y: values[index + 1]! })
      }
      return paths.length > 0 && paths.every(points => { const origin = points[0]!, other = points.find(point => distance(point, origin) > 1e-8); if (!other) return true; const length = distance(other, origin); return points.every(point => Math.abs((other.x - origin.x) * (point.y - origin.y) - (other.y - origin.y) * (point.x - origin.x)) <= length * 1e-8) })
    }
    const minimumScreenScale = (matrix: DOMMatrix | null | undefined) => { const trace = matrix ? matrix.a ** 2 + matrix.b ** 2 + matrix.c ** 2 + matrix.d ** 2 : 0, determinant = matrix ? matrix.a * matrix.d - matrix.b * matrix.c : 0; return Math.sqrt(Math.max(0, (trace - Math.sqrt(Math.max(0, trace ** 2 - 4 * determinant ** 2))) / 2)) }
    const observations = (input.expected.nodes ?? []).map(expected => {
      const owner = node.get(expected.id), declared = owner?.anchorParts?.flatMap(part => geometry.filter(element => element.localName === part.tag && nearBox(box(element), part.box, .25))), ink = declared?.length ? declared : qualifiedParts.get(expected.id) ?? bodies(expected.id).filter(element => !owner?.outline || element.localName === owner.outline.tag)
      if (!owner || !ink.length) return { id: expected.id, exposed: null, coveredParts: [] }
      const known = new Set(qualifiedParts.get(expected.id) ?? []), coveredParts: unknown[] = []
      for (const shape of ink) {
        const css = getComputedStyle(shape), fill = rgba(css.fill), stroke = rgba(css.stroke), strokeWidth = Number.parseFloat(css.strokeWidth), matrix = shape.getScreenCTM(), points = samples(shape, Math.min(8192, Math.max(128, Math.ceil(shape.getTotalLength() * (matrix ? Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)) : 1) * 2))))
        const later = layers.filter(layer => layer.element !== shape && !!(shape.compareDocumentPosition(layer.element) & Node.DOCUMENT_POSITION_FOLLOWING) && !known.has(layer.element as SVGGeometryElement) && Math.min(layer.box.x + layer.box.width, owner.box.x + owner.box.width) >= Math.max(layer.box.x, owner.box.x) && Math.min(layer.box.y + layer.box.height, owner.box.y + owner.box.height) >= Math.max(layer.box.y, owner.box.y) && (['image', 'use', 'foreignObject'].includes(layer.element.localName) || layer.fill?.[3] === 255 && layer.fillOpacity >= .999))
        const hits = later.map(layer => {
          const unknown = ['image', 'use', 'foreignObject'].includes(layer.element.localName) || !layer.matrix || !(layer.element instanceof SVGGeometryElement), equivalent = !unknown && sameGeometry(shape, layer.element) && same(fill, layer.fill) && same(stroke, layer.stroke) && Math.abs(strokeWidth - layer.width) < .1
          if (equivalent) return { layer, count: 0 }
          const count = points.filter(point => {
            if (point.x < layer.box.x - .25 || point.y < layer.box.y - .25 || point.x > layer.box.x + layer.box.width + .25 || point.y > layer.box.y + layer.box.height + .25) return false
            if (unknown) return true
            const local = new DOMPoint(point.x, point.y).matrixTransform(layer.matrix!.inverse()), item = layer.element as SVGGeometryElement
            if (!item.isPointInFill(local)) return false
            // A compartment cell may repaint exactly the same visible border.
            return !(stroke?.[3] && layer.stroke?.[3] && layer.strokeOpacity >= .999 && same(stroke, layer.stroke) && Math.abs(strokeWidth - layer.width) < .1 && item.isPointInStroke(local))
          }).length
          return { layer, count }
        }).filter(item => item.count > 0)
        // An opaque stroke can erase another outline even when its fill is
        // none. Inspect the actual later stroke region, including paint laid
        // down before the label, rather than accepting exposed centerlines.
        if (stroke?.[3] && strokeWidth > 0) {
          const sourceGraphicStroke = (element: Element) => { for (let parent: Element | null = element; parent; parent = parent.parentElement) { const filter = getComputedStyle(parent).filter; if (filter !== 'none' && !/^drop-shadow\((?:rgba?\([^)]*\)|[^()])*\)$/.test(filter) && !(/^url\(["']?#([^\s"')]+)["']?\)$/.test(filter) && evidence.get('paint-opacity-and-color')?.status === 'passed')) return false; if (parent === svg) break }; return true }
          const overpaint = layers.filter(layer => layer.element !== shape && !known.has(layer.element as SVGGeometryElement) && !!(shape.compareDocumentPosition(layer.element) & Node.DOCUMENT_POSITION_FOLLOWING) && layer.stroke?.[3] === 255 && layer.strokeOpacity >= .999 && layer.width > 0 && layer.matrix && layer.element instanceof SVGGeometryElement).filter(layer => {
            if (same(stroke, layer.stroke) && Math.abs(strokeWidth - layer.width) < .1 && !!matrix && (['a','b','c','d'] as const).every(key => Math.abs(matrix[key] - layer.matrix![key]) < 1e-8) && getComputedStyle(layer.element).vectorEffect === css.vectorEffect && Math.abs((layers.find(item => item.element === shape)?.strokeOpacity ?? 0) - layer.strokeOpacity) < 1 / 255 && sourceGraphicStroke(shape) && sourceGraphicStroke(layer.element)) return false
            const padding = layer.width / 2 * Math.hypot(layer.matrix!.a, layer.matrix!.b, layer.matrix!.c, layer.matrix!.d), b = layer.box
            if (!points.some(point => point.x >= b.x - padding && point.x <= b.x + b.width + padding && point.y >= b.y - padding && point.y <= b.y + b.height + padding && (getComputedStyle(layer.element).vectorEffect !== 'none' || (layer.element as SVGGeometryElement).isPointInStroke(new DOMPoint(point.x, point.y).matrixTransform(layer.matrix!.inverse()))))) return false
            // A C4 connector may be painted after its endpoint body. Admit
            // only the complete independently source-qualified measured stem,
            // and only its tiny contact with this particular owned contour.
            if (input.family === 'c4' && routesBound && checks.some(check => check.criterion === 'source-fact:relations' && check.status === 'passed') && ['line', 'path', 'polyline'].includes(layer.element.localName) && (!layer.fill?.[3] || !layer.fillOpacity || zeroFillArea(layer.element as SVGGeometryElement)) && getComputedStyle(layer.element).vectorEffect === 'none' && sourceGraphicStroke(layer.element)) {
              const stem = layer.element as SVGGeometryElement, length = stem.getTotalLength(), ends = length > 0 ? [stem.getPointAtLength(0), stem.getPointAtLength(length)].map(point => point.matrixTransform(layer.matrix!)) : []
              const owned = routes.filter(route => (route.source === expected.id || route.target === expected.id) && route.start && route.end && route.box && nearBox(route.box, layer.box, .25) && same(rgba((route as any).stroke ?? route.style?.stroke ?? 'none'), layer.stroke) && Math.abs((route.strokeWidth ?? route.style?.strokeWidth ?? NaN) - layer.width) < .01 && Math.abs((route.style?.strokeOpacity ?? 0) * (route.style?.opacity ?? 0) - layer.strokeOpacity) < 1 / 255 && ends.length === 2 && (distance(ends[0]!, route.start) < .25 && distance(ends[1]!, route.end) < .25 || distance(ends[0]!, route.end) < .25 && distance(ends[1]!, route.start) < .25))
              if (owned.length === 1) {
                const route = owned[0]!, endpoint = route.source === expected.id ? route.start! : route.end!, touched = points.filter(point => stem.isPointInStroke(new DOMPoint(point.x, point.y).matrixTransform(layer.matrix!.inverse())))
                const contact = Math.min(3, Math.max(2, (strokeWidth * minimumScreenScale(matrix) + layer.width * minimumScreenScale(layer.matrix)) / 2 + .25))
                if (touched.length && touched.every(point => distance(point, endpoint) <= contact)) return false
              }
            }
            return true
          })
          if (overpaint.length) coveredParts.push({ part: { tag: shape.localName, box: box(shape) }, opaqueStrokeCovers: overpaint.map(layer => ({ tag: layer.element.localName, box: layer.box })) })
        }
        const solidStroke = css.strokeDasharray === 'none' || css.strokeDasharray.split(/[ ,]+/).every(value => Number.parseFloat(value) === 0)
        const actualLayer = layers.find(layer => layer.element === shape), screenScale = minimumScreenScale(matrix)
        // A white cover can become the smallest label-enclosing candidate.
        // Its positive fill alpha is not evidence of a visible node body when
        // its whole outer contour meets the same clear white canvas. Earlier
        // ink wholly inside that cover does not provide an exposed outline.
        const white = (color: number[] | null) => !!color && color.slice(0, 3).every(value => value === 255)
        const contrastsWhite = (color: number[] | null, opacity: number) => !!color && color[3]! * opacity >= 1 && Math.max(...color.slice(0, 3).map(value => 255 - value)) * color[3]! / 255 * opacity >= 1
        const clearWhiteCanvas = () => { for (let parent: Element | null = shape; parent; parent = parent.parentElement) { const style = getComputedStyle(parent), background = rgba(style.backgroundColor); if (style.backgroundImage !== 'none' || !background || background[3] !== 0 && !(background[3] === 255 && white(background))) return false }; return true }
        const contrastingStroke = contrastsWhite(stroke, actualLayer?.strokeOpacity ?? 0) && strokeWidth * screenScale >= .25 && css.vectorEffect === 'none' && solidStroke || layers.some(layer => layer.element !== shape && !!(shape.compareDocumentPosition(layer.element) & Node.DOCUMENT_POSITION_FOLLOWING) && layer.element instanceof SVGGeometryElement && sameGeometry(shape, layer.element) && contrastsWhite(layer.stroke, layer.strokeOpacity) && layer.width * minimumScreenScale(layer.matrix) >= .25 && getComputedStyle(layer.element).vectorEffect === 'none' && (getComputedStyle(layer.element).strokeDasharray === 'none' || getComputedStyle(layer.element).strokeDasharray.split(/[ ,]+/).every(value => Number.parseFloat(value) === 0)))
        if (white(fill) && fill![3] === 255 && (actualLayer?.fillOpacity ?? 0) >= .999 && !contrastingStroke && points.length && clearWhiteCanvas()) {
          const priorContourPaint = layers.filter(layer => layer.element !== shape && !!(layer.element.compareDocumentPosition(shape) & Node.DOCUMENT_POSITION_FOLLOWING) && points.some(point => {
            const padding = layer.width / 2 * (layer.matrix ? Math.hypot(layer.matrix.a, layer.matrix.b, layer.matrix.c, layer.matrix.d) : 1), b = layer.box
            if (point.x < b.x - padding || point.x > b.x + b.width + padding || point.y < b.y - padding || point.y > b.y + b.height + padding) return false
            if (!layer.matrix || !(layer.element instanceof SVGGeometryElement)) return true
            const local = new DOMPoint(point.x, point.y).matrixTransform(layer.matrix.inverse())
            return !!(layer.fill?.[3] && layer.fillOpacity > 0 && !zeroFillArea(layer.element) && layer.element.isPointInFill(local) || layer.stroke?.[3] && layer.strokeOpacity > 0 && layer.width > 0 && layer.element.isPointInStroke(local))
          })), backdrop = priorContourPaint.at(-1)
          // Only the latest actual contour layer may supply a flat backdrop;
          // older dark paint cannot be borrowed through a newer white cover.
          const contrastingBackdrop = backdrop?.matrix && backdrop.element instanceof SVGGeometryElement && backdrop.fill?.[3] === 255 && backdrop.fillOpacity >= .999 && contrastsWhite(backdrop.fill, backdrop.fillOpacity) && !zeroFillArea(backdrop.element) && points.every(point => (backdrop.element as SVGGeometryElement).isPointInFill(new DOMPoint(point.x, point.y).matrixTransform(backdrop.matrix!.inverse())))
          if (!contrastingBackdrop) coveredParts.push({ part: { tag: shape.localName, box: box(shape) }, fillExposure: 'White fill has no contrasting outline or qualified backdrop on the clear white canvas' })
        }
        const exposedStrokeOnly = zeroFillArea(shape) && shape.getTotalLength() > 0 && solidStroke && css.vectorEffect === 'none' && !!stroke?.[3] && stroke[3]! * (actualLayer?.strokeOpacity ?? 0) >= 1 && strokeWidth * screenScale >= .25
        if (matrix && fill?.[3] && Number(css.fillOpacity) > 0 && !exposedStrokeOnly) {
          const bounds = box(shape), probes = [.03, .12, .3, .5, .7, .88, .97].flatMap(x => [.03, .12, .3, .5, .7, .88, .97].map(y => ({ x: bounds.x + x * bounds.width, y: bounds.y + y * bounds.height }))).filter(point => shape.isPointInFill(new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse())) && !shape.isPointInStroke(new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse())) && !paintedText.some(element => contains(box(element), { ...point, width: 0, height: 0 }, 0)))
          const textBackground = (layer: typeof layers[number]) => area(layer.box) < area(owner.box) * .98 && ownedText(expected.id)?.some(element => contains(layer.box, box(element)))
          const descendant = (layer: typeof layers[number]) => !!group.get(expected.id) && nodes.some(child => child.id !== expected.id && contains(owner.box, child.box) && nearBox(child.box, layer.box))
          const routeHead = (layer: typeof layers[number]) => routesBound && !!layer.matrix && layer.element instanceof SVGGeometryElement && vertices(layer.element)?.length === 3 && routes.some(route => same(layer.fill, rgba((route as any).stroke ?? route.style?.stroke ?? 'none')) && [{ point: route.start, kind: route.startMarker }, { point: route.end, kind: route.endMarker }].some(end => end.point && ['arrow', 'triangle'].includes(end.kind) && (layer.element as SVGGeometryElement).isPointInFill(new DOMPoint(end.point.x, end.point.y).matrixTransform(layer.matrix!.inverse()))))
          const unqualified = later.filter(layer => !known.has(layer.element as SVGGeometryElement) && !textBackground(layer) && !descendant(layer) && !routeHead(layer) && !same(fill, layer.fill)).filter(layer => probes.some(point => point.x >= layer.box.x && point.x <= layer.box.x + layer.box.width && point.y >= layer.box.y && point.y <= layer.box.y + layer.box.height && (!layer.matrix || !(layer.element instanceof SVGGeometryElement) || layer.element.isPointInFill(new DOMPoint(point.x, point.y).matrixTransform(layer.matrix.inverse())))))
          if (unqualified.length || !probes.length) coveredParts.push({ part: { tag: shape.localName, box: bounds }, fillExposure: 'unqualified opaque overpaint or no unborrowed exposed fill sample', covers: unqualified.map(layer => ({ tag: layer.element.localName, box: layer.box })) })
        }
        if (hits.length) coveredParts.push({ part: { tag: shape.localName, box: box(shape) }, covers: hits.map(item => ({ tag: item.layer.element.localName, box: item.layer.box, contourSamples: item.count })) })
      }
      return { id: expected.id, exposed: coveredParts.length === 0, coveredParts }
    })
    add('painted-node-visibility', 'Every independently owned body/glyph has qualified exposed contour paint', observations, exactNodes && evidence.get('paint-opacity-and-color')?.status === 'passed' && observations.every(item => item.exposed === true) ? true : null, 'Actual owned contour samples reject credit beneath later opaque covers, including covers painted before the label. Exactly equivalent co-located fill/stroke layers and qualified same-owner compound glyph parts are allowed; matching compartment borders must preserve their actual stroke. Opaque/complex image, use and HTML covers or unresolved exposure stay unknown, without inventing a renderer failure or accepting source geometry that never reaches the canvas.')
  }
  if (input.expected.edges?.length) {
    const qualifiedMarkerInk = new Map<Route, Set<SVGGeometryElement>>()
    const ownMarkerParts = (route: Route, parts: SVGGeometryElement[]) => { const owned = qualifiedMarkerInk.get(route) ?? new Set(); parts.forEach(part => owned.add(part)); qualifiedMarkerInk.set(route, owned) }
    const localGlyphInk = (shape: SVGGeometryElement) => {
      const total = shape.getTotalLength(), points = total > 0 ? Array.from({ length: 257 }, (_, index) => shape.getPointAtLength(total * index / 256)).map(p => ({ x: p.x, y: p.y })) : [], css = getComputedStyle(shape)
      if (css.fill !== 'none' && Number(css.fillOpacity) > 0) { const b = shape.getBBox(); for (const x of [.1, .25, .5, .75, .9]) for (const y of [.1, .25, .5, .75, .9]) { const p = { x: b.x + b.width * x, y: b.y + b.height * y }; if (shape.isPointInFill(new DOMPoint(p.x, p.y))) points.push(p) } }
      return points
    }
    const screenGlyphInk = (shape: SVGGeometryElement) => { const matrix = shape.getScreenCTM(); return matrix ? localGlyphInk(shape).map(p => { const point = new DOMPoint(p.x, p.y).matrixTransform(matrix); return { x: point.x, y: point.y } }) : [] }
    const markerContours = (stem: SVGGeometryElement, route: Route, side: 'start' | 'end'): Point[] | null => {
      const kind = side === 'start' ? route.startMarker : route.endMarker, endpoint = side === 'start' ? route.start : route.end
      const classifiedParts = qualifiedInlineRouteParts.get(route)?.get(side === 'start' ? route.source : route.target)
      if (classifiedParts?.length) { ownMarkerParts(route, classifiedParts); return classifiedParts.flatMap(screenGlyphInk) }
      if (kind === 'none') return []
      if (!endpoint) return null
      const reference = side === 'start' ? getComputedStyle(stem).markerStart : getComputedStyle(stem).markerEnd
      if (reference === 'none') {
        const inline = geometry.filter(shape => {
          if (shape === stem || nodes.some(owner => nearBox(owner.box, box(shape)))) return false
          const vertexCount = vertices(shape)?.length, css = getComputedStyle(shape), stroke = rgba(getComputedStyle(stem).stroke), painted = same(rgba(css.fill), stroke) || strokePaint(shape) && same(rgba(css.stroke), stroke), topology = ['arrow', 'triangle', 'open-arrow'].includes(kind) ? vertexCount === 3 : kind === 'diamond' ? vertexCount === 4 : kind === 'circle' ? ['circle', 'ellipse'].includes(shape.localName) : false
          if (!painted || !topology || !shape.getScreenCTM()) return false
          const local = new DOMPoint(endpoint.x, endpoint.y).matrixTransform(shape.getScreenCTM()!.inverse())
          return shape.isPointInFill(local) || shape.isPointInStroke(local) || samples(shape, 64).some(point => distance(point, endpoint) <= 1.5)
        })
        if (inline.length === 1) { ownMarkerParts(route, inline); return screenGlyphInk(inline[0]!) }
        return null
      }
      const id = /#([^\s"')]+)["']?\)$/.exec(reference)?.[1], marker = id ? document.getElementById(id) : null
      if (!(marker instanceof SVGMarkerElement) || !svg.contains(marker)) return null
      const width = marker.markerWidth.baseVal, height = marker.markerHeight.baseVal, refX = marker.refX.baseVal, refY = marker.refY.baseVal, view = marker.viewBox.baseVal
      if ([width, height, refX, refY].some(value => !([SVGLength.SVG_LENGTHTYPE_NUMBER, SVGLength.SVG_LENGTHTYPE_PX] as number[]).includes(value.unitType)) || !(width.value > 0 && height.value > 0)) return null
      let sx = view.width > 0 ? width.value / view.width : 1, sy = view.height > 0 ? height.value / view.height : 1
      if (marker.preserveAspectRatio.baseVal.align !== SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_NONE) sx = sy = marker.preserveAspectRatio.baseVal.meetOrSlice === SVGPreserveAspectRatio.SVG_MEETORSLICE_SLICE ? Math.max(sx, sy) : Math.min(sx, sy)
      const length = stem.getTotalLength(), a = stem.getPointAtLength(side === 'start' ? 0 : Math.max(0, length - .01)), b = stem.getPointAtLength(side === 'start' ? Math.min(length, .01) : length), end = stem.getPointAtLength(side === 'start' ? 0 : length), orientation = marker.getAttribute('orient') ?? '0'
      let angle = orientation.startsWith('auto') ? Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI : marker.orientAngle.baseVal.value
      if (orientation === 'auto-start-reverse' && side === 'start') angle += 180
      const units = marker.markerUnits.baseVal === SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH ? Number.parseFloat(getComputedStyle(stem).strokeWidth) : marker.markerUnits.baseVal === SVGMarkerElement.SVG_MARKERUNITS_USERSPACEONUSE ? 1 : NaN, screen = stem.getScreenCTM()
      if (!screen || !Number.isFinite(units) || units <= 0 || !Number.isFinite(angle) || getComputedStyle(marker).transform !== 'none') return null
      const instance = new DOMMatrix([screen.a, screen.b, screen.c, screen.d, screen.e, screen.f]).translate(end.x, end.y).rotate(angle).scale(units).scale(sx, sy).translate(-refX.value, -refY.value), ink: Point[] = []
      for (const shape of marker.querySelectorAll('path,polygon,polyline,rect,circle,ellipse,line')) {
        if (!(shape instanceof SVGGeometryElement)) return null
        const css = getComputedStyle(shape)
        if (css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || Number(css.opacity) === 0) continue
        let relative = new DOMMatrix()
        for (let current: Element | null = shape; current && current !== marker; current = current.parentElement) { const css = getComputedStyle(current); if (css.transformOrigin !== '0px 0px') return null; const local = new DOMMatrix(css.transform === 'none' ? undefined : css.transform); if (!local.is2D) return null; relative = local.multiply(relative) }
        const total = shape.getTotalLength()
        if (!(total > 0)) continue
        for (const local of localGlyphInk(shape)) { const p = new DOMPoint(local.x, local.y).matrixTransform(relative).matrixTransform(instance); ink.push({ x: p.x, y: p.y }) }
      }
      return ink.length ? ink : null
    }
    const covers = [...svg.querySelectorAll('rect,circle,ellipse,polygon,polyline,path,image,use,foreignObject')].filter(paintable).map(element => {
      const css = getComputedStyle(element); let opacity = Number(css.fillOpacity)
      for (let parent: Element | null = element; parent; parent = parent.parentElement) { opacity *= Number(getComputedStyle(parent).opacity); if (parent === svg) break }
      return { element, box: box(element), matrix: (element as SVGGraphicsElement).getScreenCTM?.(), fill: rgba(css.fill), opacity }
    }).filter(cover => ['image', 'use', 'foreignObject'].includes(cover.element.localName) || cover.fill && cover.fill[3]! * cover.opacity >= 254)
    const actual = routes.map(route => {
      const candidates = geometry.filter(element => route.box && nearBox(box(element), route.box) && ['path', 'line', 'polyline'].includes(element.localName) && (() => { const p = samples(element, 1); return p.length === 2 && route.start && route.end && distance(p[0]!, route.start) < 1 && distance(p[1]!, route.end) < 1 })())
      if (candidates.length !== 1) return { source: route.source, target: route.target, obscuredBy: null }
      const stem = candidates[0]!, matrix = stem.getScreenCTM(), points = samples(stem, Math.min(16384, Math.max(512, Math.ceil(stem.getTotalLength() * (matrix ? Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)) : 1) * 2)))), markerParts = [markerContours(stem, route, 'start'), markerContours(stem, route, 'end')], exposedInk = [...points, ...markerParts.flatMap(part => part ?? [])], blockers: { id: string; points: number }[] = []
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
      const endpointParts = [...[route.source, route.target].flatMap(id => [...parts(id), ...bodies(id), ...(qualifiedParts.get(id) ?? [])]),...(sequenceRoutePorts.get(route)??[])], routeLabels = evidence.get('painted-relationship-label-ownership')?.status === 'passed' ? paintedText.filter(element => route.labels?.includes(normalize(readText(element))) && safeText(element)) : []
      const unqualified = covers.filter(cover => cover.element !== stem && !!(stem.compareDocumentPosition(cover.element) & Node.DOCUMENT_POSITION_FOLLOWING) && !endpointParts.includes(cover.element as SVGGeometryElement) && !qualifiedMarkerInk.get(route)?.has(cover.element as SVGGeometryElement)).filter(cover => {
        const equivalentEndpointFill = [route.source, route.target].some(id => { const owner = node.get(id); return owner && contains(owner.box, cover.box) && same(cover.fill, rgba(owner.style?.fill ?? 'none')) })
        if (equivalentEndpointFill) return false
        // An actual, uniquely owned route caption may have a compact backdrop.
        // Its matching string alone cannot excuse an arbitrary large cover.
        const captionBackdrop = routeLabels.some(element => { const b = box(element), font = Number.parseFloat(getComputedStyle(element).fontSize); return contains(cover.box, b) && cover.box.width <= b.width + font * 2 && cover.box.height <= b.height + font })
        if (captionBackdrop) return false
        return exposedInk.some(point => {
          if (!contains(cover.box, { ...point, width: 0, height: 0 }, 0)) return false
          return !cover.matrix || !(cover.element instanceof SVGGeometryElement) || cover.element.isPointInFill(new DOMPoint(point.x, point.y).matrixTransform(cover.matrix.inverse()))
        })
      }).map(cover => ({ tag: cover.element.localName, box: cover.box }))
      return { source: route.source, target: route.target, obscuredBy: blockers, unqualifiedCovers: unqualified, markerExposureInspectable: markerParts.every(part => part !== null) }
    })
    add('painted-route-visibility', 'Every required owned route has exposed stem and endpoint-glyph contour paint', actual, actual.some(route => route.obscuredBy?.length) ? false : routesBound && evidence.get('paint-opacity-and-color')?.status === 'passed' && actual.length === input.expected.edges.length && actual.every(route => route.obscuredBy !== null && !route.unqualifiedCovers?.length && route.markerExposureInspectable) ? true : null, 'Actual dense stem and marker contour samples reject credit beneath later opaque covers. Referenced marker contours use their real viewport, aspect ratio, ref point, stroke units, orientation, child transforms and stem screen transform; inline triangles require independently attached actual geometry. Unprojected marker units/parts and any unqualified opaque primitive, image, use or HTML cover withhold a pass. Endpoint bodies and compact independently owned caption backdrops are permitted; arbitrary masks, filters and unresolved ownership remain unknown.')
  }
  checkGroupMembership()
  return { checks, nodes, connections: routes, groups }
}
