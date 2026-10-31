import type { MeaningExpectation } from './meaning.ts'
import type { PaintCheck, PaintEvidence } from './paint.ts'

/** Browser-serializable source fact checks. Geometry and visible labels establish
 * ownership; renderer IDs/classes and source/model metadata supply no facts. */
export function inspectDomainFacts(input: { family: string; source: string; expected: MeaningExpectation; paint: PaintEvidence; quantitative: PaintCheck[] }): PaintCheck[] {
  if (!['requirement', 'timeline', 'packet', 'kanban', 'journey', 'gantt', 'treeview', 'venn', 'cynefin', 'wardley', 'mindmap', 'ishikawa', 'gitgraph', 'eventmodeling', 'zenuml', 'radar', 'xychart', 'quadrant', 'pie', 'sankey', 'usecase'].includes(input.family) && !input.family.startsWith('railroad')) return []
  const svg = document.querySelector('svg'), facts: any = input.expected.facts ?? {}, checks: PaintCheck[] = []
  if (!svg || input.paint.labelRepresentation === 'uninspectable' && input.family !== 'requirement') return checks
  // A fully inspectable typed requirement row may supply a negative even when
  // another expected label has an uninspectable alternative representation.
  // That global uncertainty can never be upgraded to a positive full claim.
  let uncertain = input.paint.labelRepresentation === 'uninspectable'
  const add = (key: string, actual: unknown, passed: boolean | null, scope: string) => { if (Object.hasOwn(facts, key)) checks.push({ criterion: 'source-fact:' + key, expected: facts[key], actual, status: passed === null || passed && uncertain ? 'unavailable' : passed ? 'passed' : 'failed', scope }) }
  const quantitative = (criterion: string, expected: unknown, actual: unknown, passed: boolean | null, scope: string) => checks.push({ criterion, expected, actual, status: passed === null || passed && uncertain ? 'unavailable' : passed ? 'passed' : 'failed', scope })
  const norm = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
  const canvas = document.createElement('canvas').getContext('2d')!
  const color = (value: string) => { if (value === 'none' || value === 'transparent') return null; if (/url\(|var\(|context-/.test(value)) { uncertain = true; return null }; canvas.clearRect(0, 0, 1, 1); canvas.fillStyle = value; canvas.fillRect(0, 0, 1, 1); const rgba = canvas.getImageData(0, 0, 1, 1).data; return rgba[3] ? { rgb: [...rgba].slice(0, 3).join(','), alpha: rgba[3]! / 255 } : null }
  const preservesSourceGraphic = (setting: string): boolean => {
    if (/^brightness\((?:[1-9]\d*(?:\.\d*)?|0?\.\d*[1-9]\d*)%?\)$/.test(setting)) return true
    if (/^drop-shadow\((?:rgba?\([^)]*\)|[^()])*\)$/.test(setting)) return true

    const match = /^url\(["']?#([^\s"')]+)["']?\)$/.exec(setting)
    if (!match) return false
    let filter: Element | null
    try { filter = document.getElementById(decodeURIComponent(match[1]!)) } catch { return false }
    if (!filter || !svg.contains(filter) || filter.localName !== 'filter' || filter.children.length !== 1 || filter.hasAttribute('href') || filter.hasAttribute('filterRes')) return false
    const shadow = filter.children[0]!
    if (shadow.localName !== 'feDropShadow' || shadow.children.length || shadow.hasAttribute('x') || shadow.hasAttribute('y') || shadow.hasAttribute('width') || shadow.hasAttribute('height') || !['', 'SourceGraphic'].includes(shadow.getAttribute('in') ?? '')) return false
    if (filter.getAttribute('filterUnits') && filter.getAttribute('filterUnits') !== 'objectBoundingBox') return false
    const fraction = (name: string, fallback: number) => {
      const value = filter.getAttribute(name)
      if (value === null) return fallback
      return /^[-+]?(?:\d*\.)?\d+%$/.test(value) ? Number.parseFloat(value) / 100 : NaN
    }
    const x = fraction('x', -.1), y = fraction('y', -.1), width = fraction('width', 1.2), height = fraction('height', 1.2)
    return x < 0 && y < 0 && x + width > 1 && y + height > 1 && getComputedStyle(shadow).display !== 'none'
  }
  const filled = (element: Element) => element.localName !== 'line' && Number(getComputedStyle(element).fillOpacity) > 0 && !!color(getComputedStyle(element).fill)
  const visible = (element: Element) => {
    let effectiveOpacity = 1, localUncertain = false
    let foreignInk: ReturnType<typeof color> | undefined
    if (element.localName === 'foreignObject') {
      const leaves = [...element.querySelectorAll('*')].filter(leaf => norm(leaf.textContent ?? '') && ![...leaf.children].some(child => norm(child.textContent ?? ''))), inks: NonNullable<ReturnType<typeof color>>[] = []
      for (const leaf of leaves) { const css = getComputedStyle(leaf), ink = color(css.color); if (!ink || !leaf.getBoundingClientRect().width || !leaf.getBoundingClientRect().height) return false; for (let owner: Element | null = leaf; owner && owner !== element; owner = owner.parentElement) { const css = getComputedStyle(owner); if (css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || Number(css.opacity) < 1 / 255 || css.clipPath && css.clipPath !== 'none' || css.maskImage && css.maskImage !== 'none' || css.filter && css.filter !== 'none' && !preservesSourceGraphic(css.filter)) return false }; inks.push(ink) }
      if (inks.length && inks.every(ink => ink.rgb === inks[0]!.rgb && ink.alpha === inks[0]!.alpha)) foreignInk = inks[0]
      else if (inks.length) return false
    }
    for (let owner: Element | null = element; owner; owner = owner.parentElement) {
      const style = getComputedStyle(owner)
      if (['defs', 'marker', 'clipPath', 'mask', 'title', 'desc'].includes(owner.localName) || style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility) || Number(style.opacity) === 0) return false
      if (style.clipPath && style.clipPath !== 'none' || style.maskImage && style.maskImage !== 'none' || style.filter && style.filter !== 'none' && !preservesSourceGraphic(style.filter)) localUncertain = true
      effectiveOpacity *= Number(style.opacity)
      if (owner === svg) break
    }
    const bounds = element.getBoundingClientRect()
    const canvasBounds = svg.getBoundingClientRect(), structuralBackground = element.localName === 'rect' && bounds.width >= canvasBounds.width * .9 && bounds.height >= canvasBounds.height * .9
    for (const cover of structuralBackground ? [] : svg.querySelectorAll('rect')) {
      if (cover === element || !(element.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING) || cover.closest('defs,marker,clipPath,mask')) continue
      const b = cover.getBoundingClientRect(), style = getComputedStyle(cover), fill = color(style.fill)
      if (!fill || !b.width || !b.height || b.x >= bounds.right || b.right <= bounds.x || b.y >= bounds.bottom || b.bottom <= bounds.y) continue
      if (!['text', 'foreignObject'].includes(element.localName) && b.x > bounds.x + 1 && b.y > bounds.y + 1 && b.right < bounds.right - 1 && b.bottom < bounds.bottom - 1) continue
      let opacity = fill.alpha * Number(style.fillOpacity), projected = true
      for (let owner: Element | null = cover; owner; owner = owner.parentElement) {
        const s = getComputedStyle(owner)
        if (s.display === 'none' || ['hidden', 'collapse'].includes(s.visibility)) opacity = 0
        opacity *= Number(s.opacity)
        if (s.clipPath && s.clipPath !== 'none' || s.maskImage && s.maskImage !== 'none' || s.filter && s.filter !== 'none' && !preservesSourceGraphic(s.filter)) projected = false
        if (owner === svg) break
      }
      if (!opacity) continue
      if (element.localName === 'circle') {
        const cx = bounds.x + bounds.width / 2, cy = bounds.y + bounds.height / 2, r = bounds.width / 2, near = Math.hypot(cx - Math.max(b.x, Math.min(b.right, cx)), cy - Math.max(b.y, Math.min(b.bottom, cy))), far = Math.max(...[[b.x, b.y], [b.right, b.y], [b.x, b.bottom], [b.right, b.bottom]].map(([x, y]) => Math.hypot(x! - cx, y! - cy))), elementStyle = getComputedStyle(element), filled = color(elementStyle.fill), stroke = Number.parseFloat(elementStyle.strokeWidth)
        if (near > r + stroke || !filled && far < r - stroke) continue
      }
      if (input.family === 'journey' && element.localName === 'line' && bounds.width < 1 && b.y <= bounds.y + 1 && b.bottom < bounds.bottom - bounds.height * .75 && b.x < bounds.x && b.right > bounds.x) continue
      if (['line', 'path', 'polyline', 'polygon', 'circle', 'ellipse'].includes(element.localName)) {
        const geometry = element as SVGGeometryElement, transform = geometry.getScreenCTM(), coverTransform = cover.getScreenCTM(), length = geometry.getTotalLength()
        if (transform && coverTransform && length > 0) {
          const covered = Array.from({ length: 513 }, (_, i) => { const p = geometry.getPointAtLength(length * i / 512).matrixTransform(transform).matrixTransform(coverTransform.inverse()); return cover.isPointInFill(p) ? i : -1 }).filter(i => i >= 0)
          if (!covered.length) continue
        }
      }
      if (element.localName === 'line') {
        const line = element as SVGGeometryElement, matrix = line.getScreenCTM(), length = line.getTotalLength()
        const covered = matrix && length > 0 ? Array.from({ length: 513 }, (_, i) => { const p = line.getPointAtLength(length * i / 512).matrixTransform(matrix); return p.x >= b.x && p.x <= b.right && p.y >= b.y && p.y <= b.bottom ? i : -1 }).filter(i => i >= 0) : []
        if (!covered.length || covered.every(i => i <= 2) || covered.every(i => i >= 510)) continue
      }
      const matrix = cover.getScreenCTM()
      const rectangular = matrix && Math.abs(matrix.b) < 1e-8 && Math.abs(matrix.c) < 1e-8 && !Number(cover.getAttribute('rx')) && !Number(cover.getAttribute('ry'))
      if (opacity >= 1 && projected && rectangular && b.x <= bounds.x && b.y <= bounds.y && b.right >= bounds.right && b.bottom >= bounds.bottom) return false
      localUncertain = true
    }
    const style = getComputedStyle(element), fill = element.localName === 'line' ? null : foreignInk ?? color(element.namespaceURI === 'http://www.w3.org/1999/xhtml' ? style.color : style.fill), stroke = color(style.stroke)
    const paints = [fill && fill.alpha * Number(style.fillOpacity) * effectiveOpacity > 0 ? { ...fill, effectiveAlpha: fill.alpha * Number(style.fillOpacity) * effectiveOpacity } : null, stroke && stroke.alpha * Number(style.strokeOpacity) * effectiveOpacity > 0 && Number.parseFloat(style.strokeWidth) > 0 ? { ...stroke, effectiveAlpha: stroke.alpha * Number(style.strokeOpacity) * effectiveOpacity } : null].filter((paint): paint is { rgb: string; alpha: number; effectiveAlpha: number } => !!paint)
    if (!paints.length) return false
    if (paints.every(paint => paint.effectiveAlpha < 1 / 255)) { localUncertain = true; return false }
    if (!fill && stroke && Number.parseFloat(style.strokeWidth) < .25) { localUncertain = true; return false }
    // A flat opaque rectangle establishes a bounded camouflage negative. Any
    // intervening complex paint may make it visible, so withhold rather than
    // inventing a semantic failure or a general contrast score.
    for (const background of svg.querySelectorAll('rect')) {
      if (background === element || !(background.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) || background.closest('defs,marker,clipPath,mask')) continue
      const b = background.getBoundingClientRect(), css = getComputedStyle(background), ink = color(css.fill)
      if (!ink || ink.alpha * Number(css.fillOpacity) < 1 || b.x > bounds.x || b.y > bounds.y || b.right < bounds.right || b.bottom < bounds.bottom || !paints.every(paint => paint.rgb === ink.rgb)) continue
      let opaque = true
      for (let owner: Element | null = background; owner; owner = owner.parentElement) {
        const css = getComputedStyle(owner)
        if (Number(css.opacity) !== 1 || css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || css.clipPath !== 'none' || css.maskImage !== 'none' || css.filter !== 'none') opaque = false
        if (owner === svg) break
      }
      if (opaque) { localUncertain = true; return false }
    }
    return !localUncertain
  }
  const box = (element: Element) => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
  type Box = ReturnType<typeof box>
  const center = (b: Box) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 })
  const text = [...svg.querySelectorAll('text,foreignObject')].filter(element => visible(element) && box(element).width > 0 && box(element).height > 0 && norm(element.textContent ?? ''))
  const label = (value: string) => { const found = text.filter(element => norm(element.textContent ?? '') === norm(value)); return found.length === 1 ? found[0] : undefined }
  const point = (element: SVGGraphicsElement, x: number, y: number) => { const matrix = element.getScreenCTM(); return matrix ? new DOMPoint(x, y).matrixTransform(matrix) : new DOMPoint(NaN, NaN) }
  const anchor = (element: Element) => { const item = element as SVGTextElement; return item.x?.baseVal && item.y?.baseVal ? point(item, item.x.baseVal.numberOfItems ? item.x.baseVal.getItem(0).value : 0, item.y.baseVal.numberOfItems ? item.y.baseVal.getItem(0).value : 0) : center(box(element)) }
  const rectangles = [...svg.querySelectorAll('rect')].filter(element => visible(element) && box(element).width > 0 && box(element).height > 0)
  const paths = [...svg.querySelectorAll('path,polyline,polygon,line')].filter(element => visible(element)) as SVGGeometryElement[]
  const sample = (element: SVGGeometryElement, count = 2048) => { const length = element.getTotalLength(), matrix = element.getScreenCTM(); return matrix ? Array.from({ length: count + 1 }, (_, i) => element.getPointAtLength(length * i / count).matrixTransform(matrix)) : [] }
  const endPoints = (element: SVGGeometryElement) => { const length = element.getTotalLength(), matrix = element.getScreenCTM(); return matrix ? [element.getPointAtLength(0).matrixTransform(matrix), element.getPointAtLength(length).matrixTransform(matrix)].map(p => ({ x: p.x, y: p.y })) : [] }
  const numeric = (value: string) => { const match = /^([-+]?(?:\d[\d,]*\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*([kMBGT]?)$/.exec(norm(value).replaceAll('−', '-')); return match ? Number(match[1]!.replaceAll(',', '')) * ({ '': 1, k: 1e3, M: 1e6, B: 1e9, G: 1e9, T: 1e12 }[match[2]!] ?? 1) : NaN }
  const numericLabel = (value: number) => { const found = text.filter(element => Math.abs(numeric(element.textContent ?? '') - value) < Math.max(1e-8, Math.abs(value) * 1e-10)); return found.length === 1 ? found[0] : undefined }
  const tickCoordinate = (element: Element, axis: 'x' | 'y') => {
    const origin = anchor(element), font = Number.parseFloat(getComputedStyle(element).fontSize)
    const ticks = paths.map(path => { const ends = endPoints(path); if (ends.length !== 2) return null; const [a, b] = ends as [DOMPoint, DOMPoint], length = Math.hypot(a.x - b.x, a.y - b.y); return length >= 2 && length <= 25 && (axis === 'y' ? Math.abs(a.y - b.y) < .2 : Math.abs(a.x - b.x) < .2) ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : null }).filter((tick): tick is { x: number; y: number } => !!tick && Math.abs(tick.x - origin.x) <= font * 3 && Math.abs(tick.y - origin.y) <= font * 2).sort((a, b) => Math.abs(a[axis] - origin[axis]) - Math.abs(b[axis] - origin[axis]))
    return ticks[0]?.[axis]
  }
  const swatch = (value: string) => {
    const owner = label(value); if (!owner) return null
    const b = box(owner), c = center(b)
    const glyphs = [...rectangles, ...paths, ...svg.querySelectorAll('circle')].filter(element => visible(element) && element !== owner && box(element).width <= 45 && box(element).height <= 30 && box(element).x + box(element).width <= b.x + 2 && Math.abs(center(box(element)).y - c.y) <= Math.max(8, b.height))
    const ranked = glyphs.map(element => ({ element, distance: Math.hypot(b.x - box(element).x - box(element).width, c.y - center(box(element)).y) })).sort((a, b) => a.distance - b.distance)
    if (!ranked[0] || ranked[0].distance > 45 || ranked[1] && ranked[1].distance - ranked[0].distance < 1) return null
    const style = getComputedStyle(ranked[0].element); return color(style.fill)?.rgb ?? color(style.stroke)?.rgb ?? null
  }
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  const inside = (outer: Box, inner: Box, slack = 1.5) => inner.x >= outer.x - slack && inner.y >= outer.y - slack && inner.x + inner.width <= outer.x + outer.width + slack && inner.y + inner.height <= outer.y + outer.height + slack
  const distance = (p: { x: number; y: number }, b: Box) => Math.hypot(Math.max(b.x - p.x, 0, p.x - b.x - b.width), Math.max(b.y - p.y, 0, p.y - b.y - b.height))
  const shapes = [...svg.querySelectorAll('rect,circle,ellipse,polygon,path,polyline')].filter(element => visible(element) && box(element).width > 1 && box(element).height > 1 && filled(element)) as SVGGeometryElement[]
  const body = (element: Element | undefined) => {
    if (!element) return undefined
    const b = box(element), candidates = shapes.filter(shape => inside(box(shape), b)).sort((a, b) => box(a).width * box(a).height - box(b).width * box(b).height)
    return candidates[0]
  }
  const ownedText = (owner: Element) => text.filter(element => inside(box(owner), box(element))).sort((a, b) => box(a).y - box(b).y || box(a).x - box(b).x)
  const exactText = (wanted: string[], actual: Element[] = text) => same(wanted.map(norm).sort(), actual.map(element => norm(element.textContent ?? '')).sort())
  const findText = (value: string) => text.filter(element => norm(element.textContent ?? '') === norm(value))
  const ordered = (values: ({ x: number; y: number } | null)[], axis: 'x' | 'y') => values.every((p, i) => p && (!i || values[i - 1] && p[axis] > values[i - 1]![axis] + 1))
  const geometryKey = (shape: Element) => { const b = box(shape); return [b.x, b.y, b.width, b.height].map(v => Math.round(v * 2) / 2).join(',') }
  const uniqueShapes = (items: SVGGeometryElement[]) => [...new Map(items.map(shape => [geometryKey(shape), shape])).values()]
  const outlineKind = (shape: SVGGeometryElement | undefined): string | null => {
    if (!shape) return null
    if (shape.localName === 'rect') return Number(shape.getAttribute('rx')) > 0 || Number(shape.getAttribute('ry')) > 0 ? 'rounded' : 'rectangle'
    if (shape.localName === 'circle') return 'circle'
    if (shape.localName === 'ellipse') return 'ellipse'
    const b = box(shape), c = center(b), pts = sample(shape, 128)
    if (Math.abs(b.width - b.height) < Math.max(1, b.width * .005) && pts.slice(1, -1).every(p => Math.abs(Math.hypot(p.x - c.x, p.y - c.y) - b.width / 2) < Math.max(1, b.width * .005))) return 'circle'
    const ellipse = pts.every(p => Math.abs(((p.x - c.x) / (b.width / 2)) ** 2 + ((p.y - c.y) / (b.height / 2)) ** 2 - 1) < .025)
    if (ellipse) return 'ellipse'
    const corners = [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]]
    if (corners.every(([x, y]) => pts.some(p => Math.hypot(p.x - x!, p.y - y!) < 2)) && pts.every(p => Math.min(Math.abs(p.x - b.x), Math.abs(p.x - b.x - b.width), Math.abs(p.y - b.y), Math.abs(p.y - b.y - b.height)) < 2)) return 'rectangle'
    if (shape.localName === 'path' && (shape.getAttribute('d')?.match(/[qQ]/g)?.length ?? 0) === 4 && !/[CcAaSsTt]/.test((shape.getAttribute('d') ?? '').replace(/e[-+]?\d+/gi, '')) && /[zZ]\s*$/.test(shape.getAttribute('d') ?? '')) return 'rounded'
    return null
  }
  const inkAtPoint = (element: SVGGeometryElement, p: { x: number; y: number }) => {
    for (let owner: Element | null = element; owner; owner = owner.parentElement) { const css = getComputedStyle(owner); if (css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || Number(css.opacity) < 1 / 255 || css.clipPath && css.clipPath !== 'none' || css.maskImage && css.maskImage !== 'none' || css.filter && css.filter !== 'none' && !preservesSourceGraphic(css.filter)) return false; if (owner === svg) break }
    const css = getComputedStyle(element), stroke = color(css.stroke); if (!stroke || stroke.alpha * Number(css.strokeOpacity) < 1 / 255) return false
    return !rectangles.some(rect => { if (!(element.compareDocumentPosition(rect) & Node.DOCUMENT_POSITION_FOLLOWING)) return false; const b = box(rect), c = getComputedStyle(rect), fill = color(c.fill); return fill && fill.alpha * Number(c.fillOpacity) >= 1 && Number(c.opacity) === 1 && p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height })
  }
  const linearSegments = (element: SVGGeometryElement): { x: number; y: number }[][] => {
    if (element.localName === 'line') return [endPoints(element)]
    if (element.localName !== 'path') return []
    const data = element.getAttribute('d') ?? '', tokens = data.match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/g) ?? []
    if (data.replace(/[MmLlHhVvZz]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?|[\s,]/g, '')) return []
    const result: { x: number; y: number }[][] = []; let at = 0, command = '', x = 0, y = 0, sx = 0, sy = 0
    while (at < tokens.length) {
      if (/^[a-z]$/i.test(tokens[at]!)) command = tokens[at++]!
      const relative = command === command.toLowerCase(), name = command.toUpperCase(), previous = { x, y }
      if (name === 'Z') { x = sx; y = sy; command = ''; result.push([point(element, previous.x, previous.y), point(element, x, y)].map(p => ({ x: p.x, y: p.y }))); continue }
      const amount = ['M', 'L'].includes(name) ? 2 : ['H', 'V'].includes(name) ? 1 : 0
      if (!amount || at + amount > tokens.length || tokens.slice(at, at + amount).some(token => !Number.isFinite(Number(token)))) return []
      const a = Number(tokens[at++]!), b = amount === 2 ? Number(tokens[at++]!) : 0
      if (name === 'M' || name === 'L') { x = relative ? x + a : a; y = relative ? y + b : b }
      if (name === 'H') x = relative ? x + a : a
      if (name === 'V') y = relative ? y + a : a
      if (name === 'M') { sx = x; sy = y; command = relative ? 'l' : 'L' }
      else result.push([point(element, previous.x, previous.y), point(element, x, y)].map(p => ({ x: p.x, y: p.y })))
    }
    return result
  }
  const sourceTitle = typeof facts.title === 'string' ? [facts.title] : []
  const themeCommitOwners = new Map<string, SVGGeometryElement>()
  const themeCurveOwners = new Map<string, SVGGeometryElement>()
  const themeHierarchyRoutes = new Map<string, SVGGeometryElement | null>()
  let radarProfile: { axisScaleFactor: number } | null = null
  if (input.family === 'requirement') {
    const definitions: any[] = facts.definitions ?? [], aliases = new Map([['verifymethod', 'Verification'], ['docref', 'Doc. Ref.'], ['id', 'ID'], ['text', 'Text'], ['risk', 'Risk'], ['type', 'Type']])
    const kinds: Record<string, string> = { requirement: 'Requirement', functionalrequirement: 'Functional Requirement', interfacerequirement: 'Interface Requirement', performancerequirement: 'Performance Requirement', physicalrequirement: 'Physical Requirement', designconstraint: 'Design Constraint', element: 'Element' }
    const canonicalRow = (value: string) => { value = norm(value).replaceAll('«', '<<').replaceAll('»', '>>'); if (/^<<.*>>$/.test(value)) return value.toLowerCase().replace(/\s/g, ''); const row = /^([^:]+):\s*(.*)$/.exec(value); if (!row) return value; const names: Record<string, string> = { id: 'id', text: 'text', risk: 'risk', verification: 'verifymethod', verifymethod: 'verifymethod', type: 'type', 'doc. ref.': 'docref', docref: 'docref' }, heading = names[row[1]!.toLowerCase()]; return heading ? heading + ': ' + (['risk', 'verifymethod'].includes(heading) ? row[2]!.toLowerCase() : row[2]) : value }
    const observed = definitions.map(definition => {
      const header = label(definition.name), owner = body(header), elements = owner ? ownedText(owner) : [], rows: { y: number; cells: Element[] }[] = []
      for (const element of elements) { const y = center(box(element)).y, row = rows.find(row => Math.abs(row.y - y) < 2); if (row) row.cells.push(element); else rows.push({ y, cells: [element] }) }
      const actual = owner ? rows.map(row => { const values = row.cells.sort((a, b) => box(a).x - box(b).x).map(element => norm(element.textContent ?? '')); return canonicalRow(values.length > 1 && [...aliases.values()].includes(values[0]!) ? values[0] + ': ' + values.slice(1).join(' ') : values.join(' ')) }) : null
      const fields = Object.entries(definition.fields ?? {}).map(([key, value]) => { const formatted = ['risk', 'verifymethod'].includes(key) ? String(value).replace(/^./, x => x.toUpperCase()) : String(value); return (aliases.get(key) ?? key) + ': ' + formatted })
      const wanted = ['<<' + kinds[String(definition.kind).toLowerCase()] + '>>', definition.name, ...fields].map(canonicalRow)
      const typedRows = !!actual && !!owner && ['rectangle', 'rounded'].includes(outlineKind(owner) ?? '') && actual.filter(row => row === wanted[0]).length === 1 && actual.filter(row => row === definition.name).length === 1 && Object.keys(definition.fields ?? {}).every(key => actual.filter(row => row.startsWith(key + ': ') && row.slice(key.length + 2).trim()).length === 1)
      return { name: definition.name, body: owner ? box(owner) : null, actual, wanted, available: !!owner && !!kinds[String(definition.kind).toLowerCase()] && !definition.classes && (input.paint.labelRepresentation !== 'uninspectable' || typedRows) }
    })
    const available = definitions.length > 0 && observed.every(entry => entry.available)
    const valid = available && observed.every(entry => same(entry.actual?.filter(value => !/^(?:id|text|risk|verifymethod|type|docref):\s*$/.test(value)).sort(), entry.wanted.sort()))
    add('definitions', observed, available ? valid : null, 'Each typed requirement/element stereotype and complete field row inventory belongs to its independently measured enclosing body. Field heading and enum capitalization are presentation conventions; swapped, extra and borrowed rows fail. Unsupported classes or uninspectable bodies stay unknown.')
    for (const key of ['requirements', 'elements']) if (Array.isArray(facts[key])) {
      const translated = facts[key].map((entry: any) => ({ name: entry.name, kind: key === 'elements' ? 'element' : entry.type, fields: key === 'elements' ? Object.fromEntries([['type', entry.type], ['docref', entry.docRef]].filter(([, value]) => value)) : { id: entry.id, text: entry.text, risk: entry.risk, verifymethod: entry.verify } }))
      const agrees = translated.every((entry: any) => definitions.some(def => def.name === entry.name && def.kind.toLowerCase() === entry.kind.toLowerCase() && same(def.fields, entry.fields))) && translated.length === definitions.filter(def => key === 'elements' ? def.kind === 'element' : def.kind !== 'element').length
      add(key, { translated, ownedDefinitions: observed }, available ? agrees && valid : null, 'Authored native-profile aliases must agree with the independently transcribed full definitions and the same actual owned visible rows; an alias never replaces a conflicting source fact.')
    }
  }
  if (input.family === 'timeline') {
    const periods: any[] = facts.periods ?? [], sections: string[] = facts.sections ?? []
    const observations = periods.map(period => {
      const header = label(period.period ?? period.label), owner = body(header), region = owner ? box(owner) : null
      const events = (period.events ?? []).map((value: string) => { const found = findText(value).filter(e => region && center(box(e)).x >= region.x && center(box(e)).x <= region.x + region.width && box(e).y > region.y + region.height); return { label: value, box: found.length === 1 ? box(found[0]!) : null } })
      return { label: period.period ?? period.label, section: period.section ?? '', box: region, events }
    })
    const available = observations.length > 0 && observations.every(p => p.box) && periods.every(period => [period.period ?? period.label, ...(period.events ?? [])].every((value: string) => findText(value).length > 0))
    let valid = ordered(observations.map(p => p.box && center(p.box)), 'x') && observations.every(p => ordered(p.events.map((e: any) => e.box && center(e.box)), 'y'))
    const headings = sections.map(section => { const e = label(section), b = body(e); return { section, box: b ? box(b) : e ? box(e) : null } })
    const sectionOwned = !sections.length || headings.every(section => section.box && observations.filter(p => p.section === section.section).every(p => p.box && center(p.box).x >= section.box!.x - 2 && center(p.box).x <= section.box!.x + section.box!.width + 2 && p.box.y > section.box!.y))
    const wanted = [...sourceTitle, ...sections, ...periods.flatMap(period => [period.period ?? period.label, ...(period.events ?? [])])]
    valid &&= exactText(wanted) && sectionOwned
    add('periods', observations, available ? valid : null, 'Complete exact period/event text inventory; each event lies in its own measured period column below its body, periods progress left-to-right and events top-to-bottom. Sections independently own the corresponding horizontal span.')
    add('sections', headings, available ? sectionOwned && ordered(headings.map(h => h.box && center(h.box)), 'x') && exactText(wanted) : null, 'Exact section headings and source order own their period columns; no sections preserves the exact unsectioned inventory.')
  }
  if (input.family === 'packet') {
    const fields: any[] = facts.fields ?? [], settings = facts['authored-config']?.packet ?? {}, bitsPerRow = settings.bitsPerRow ?? 32
    const owners = fields.flatMap(field => findText(field.label).map(element => ({ field, element, shape: body(element) }))).filter(item => item.shape).sort((a, b) => box(a.shape!).y - box(b.shape!).y || box(a.shape!).x - box(b.shape!).x)
    const observed = owners.map(item => {
      const b = box(item.shape!), numbers = text.filter(element => /^\d+$/.test(norm(element.textContent ?? '')) && box(element).y + box(element).height <= b.y + 2 && b.y - box(element).y - box(element).height <= Math.max(20, box(element).height * 2) && center(box(element)).x >= b.x - 2 && center(box(element)).x <= b.x + b.width + 2).sort((a, b) => box(a).x - box(b).x)
      return { label: item.field.label, body: b, offsets: numbers.map(element => Number(norm(element.textContent ?? ''))), numberBoxes: numbers.map(box) }
    })
    const segments = fields.flatMap(field => { const entries: any[] = []; for (let start = field.start; start <= field.end;) { const end = Math.min(field.end, (Math.floor(start / bitsPerRow) + 1) * bitsPerRow - 1); entries.push({ label: field.label, start, end }); start = end + 1 }; return entries }).sort((a, b) => Math.floor(a.start / bitsPerRow) - Math.floor(b.start / bitsPerRow) || (settings.bitOrder === 'descending' ? b.start - a.start : a.start - b.start))
    let available = Number.isSafeInteger(bitsPerRow) && bitsPerRow > 0 && owners.length === segments.length && observed.every(entry => entry.offsets.length === 1 || entry.offsets.length === 2)
    const bitRows = [...new Set(observed.map(item => Math.round(item.body.y)))], rowBounds = bitRows.map(y => { const cells = observed.filter(item => Math.abs(item.body.y - y) < 2); return { y, left: Math.min(...cells.map(item => item.body.x)), right: Math.max(...cells.map(item => item.body.x + item.body.width)) } })
    const gapCandidates = observed.flatMap((a, index) => observed.slice(index + 1).filter(b => Math.abs(a.body.y - b.body.y) < 2 && b.body.x >= a.body.x + a.body.width).map(b => b.body.x - a.body.x - a.body.width)), gap = gapCandidates.length ? Math.min(...gapCandidates) : 0
    const scaleSamples = observed.map((item, index) => (item.body.width + gap) / (item.offsets.length === 2 ? Math.abs(item.offsets[1]! - item.offsets[0]!) + 1 : 1)), scale = scaleSamples.length ? scaleSamples.reduce((a, b) => a + b, 0) / scaleSamples.length : NaN
    const valid = observed.length === segments.length && observed.every((item, index) => { const expected = segments[index]!, row = rowBounds[bitRows.indexOf(Math.round(item.body.y))]!, start = settings.bitOrder === 'descending' ? expected.end : expected.start, end = settings.bitOrder === 'descending' ? expected.start : expected.end; return item.label === expected.label && same(item.offsets, expected.start === expected.end ? [expected.start] : [start, end]) && Math.abs(scaleSamples[index]! - scale) <= Math.max(.15, scale * .01) && Math.abs(item.body.x - row.left - (settings.bitOrder === 'descending' ? bitsPerRow - expected.end % bitsPerRow - 1 : expected.start % bitsPerRow) * scale) <= Math.max(2, scale * .02) && bitRows.indexOf(Math.round(item.body.y)) === Math.floor(expected.start / bitsPerRow) - Math.floor(segments[0]!.start / bitsPerRow) })
    const actualBlocks = uniqueShapes(rectangles.filter(rect => observed.some(item => Math.abs(box(rect).y - item.body.y) < 2 && Math.abs(box(rect).height - item.body.height) < 2)))
    if (actualBlocks.length !== segments.length) available = false
    add('fields', { segments: observed, measuredBitUnit: scale, gap, rowBounds }, available ? valid : null, 'Absolute printed bit endpoints bind each field rectangle, including every wrapped source segment; complete rectangle inventory, row number and common measured bit unit verify spans and positions. Unprinted offsets, unfamiliar numbering and ambiguous repeated labels stay unknown.')
    if (facts.fields) quantitative('painted-bit-field-spans', facts.fields, observed, available ? valid : null, 'Absolute owned offsets, complete wrapped segments and measured bit geometry supersede a relative-width-only profile.')
  }
  if (input.family === 'kanban') {
    const columns: any[] = facts.columns ?? [], observations = columns.map(column => {
      const header = label(column.label), owner = body(header), b = owner ? box(owner) : null
      const cards = column.tasks.map((task: any) => { const entries = findText(task.label), shape = entries.length === 1 ? body(entries[0]) : undefined; return { id: task.id, label: task.label, body: shape ? box(shape) : null, rows: shape ? ownedText(shape).map(e => norm(e.textContent ?? '')) : null, attributes: task.attributes ?? {} } })
      return { id: column.id, label: column.label, body: b, cards }
    })
    let available = columns.length > 0 && observations.every(column => column.body && column.cards.every((card: any) => card.body))
    let valid = ordered(observations.map(column => column.body && center(column.body)), 'x') && observations.every(column => ordered(column.cards.map((card: any) => card.body && center(card.body)), 'y'))
    for (const column of observations) for (const card of column.cards) {
      if (!column.body || !card.body || !inside(column.body, card.body)) valid = false
      const wanted = [card.label, ...['assigned', 'ticket'].flatMap(key => card.attributes[key] ? [String(card.attributes[key])] : [])]
      if (Object.keys(card.attributes).some(key => !['assigned', 'ticket', 'priority'].includes(key))) available = false
      if (card.attributes.priority) available = false // priority is an unlabelled colored glyph, not literal text.
      if (!same(wanted.map(norm).sort(), card.rows?.map((row: string) => row.replace(/^@/, '')).sort())) valid = false
    }
    const wanted = columns.flatMap(column => [column.label, ...column.tasks.flatMap((task: any) => [task.label, ...['assigned', 'ticket'].flatMap(key => task.attributes?.[key] ? [String(task.attributes[key])] : [])])])
    const countBadges = text.filter(element => /^\d+$/.test(norm(element.textContent ?? '')) && observations.some(column => column.body && inside(column.body, box(element)) && !column.cards.some((card: any) => card.body && inside(card.body, box(element))))); for (const badge of countBadges) { const column = observations.find(column => column.body && inside(column.body, box(badge))); if (!column || Number(norm(badge.textContent ?? '')) !== column.cards.length) valid = false }; if (!exactText([...wanted, ...countBadges.map(element => norm(element.textContent ?? ''))])) valid = false
    add('columns', observations, available ? valid : null, 'Measured column rectangles own exact ordered card bodies and all printed assignee/ticket metadata; a complete text inventory rejects extra or borrowed cards. Unlabelled priority glyph semantics and other attributes remain unknown.')
    if (facts.metadata) add('metadata', observations.flatMap(column => column.cards), available ? valid && facts.metadata.length === observations.reduce((n, column) => n + column.cards.length, 0) && facts.metadata.every((entry: any) => observations.flatMap(column => column.cards).some((card: any) => card.id === entry.id && ['assigned', 'priority', 'ticket'].every(key => (entry[key] ?? '') === (card.attributes[key] ?? '')))) : null, 'Metadata aliases agree independently with full card attributes and measured card-owned output; unspecified priority glyphs remain unknown.')
  }
  if (input.family === 'journey') {
    const tasks: any[] = facts.tasks ?? [], sections: string[] = facts.sections ?? [], circles = shapes.filter(shape => shape.localName === 'circle'), observed: any[] = []
    const actorNames = [...new Set<string>(tasks.flatMap(task => task.actors ?? []))]
    const numericTicks = text.filter(element => Number.isFinite(numeric(element.textContent ?? '')) && box(element).x < Math.min(...tasks.map(task => { const e = label(task.label); return e ? box(e).x : Infinity }))).map(element => { const p = anchor(element), segments = paths.flatMap(linearSegments).filter(ends => ends.length === 2 && Math.abs(ends[0]!.y - ends[1]!.y) < 1 && Math.min(ends[0]!.x, ends[1]!.x) >= box(element).x && Math.min(ends[0]!.x, ends[1]!.x) <= box(element).x + box(element).width + 30 && Math.abs(ends[0]!.y - p.y) < 10); return { element, value: numeric(element.textContent ?? ''), y: segments[0]?.[0]?.y ?? NaN } }).filter(tick => Number.isFinite(tick.y)).sort((a, b) => a.value - b.value)
    const firstTick = numericTicks[0], lastTick = numericTicks.at(-1), scoreUnit = firstTick && lastTick && lastTick.value > firstTick.value ? (lastTick.y - firstTick.y) / (lastTick.value - firstTick.value) : NaN, calibrated = Number.isFinite(scoreUnit) && scoreUnit < 0 && numericTicks.every(tick => Math.abs(tick.y - firstTick!.y - (tick.value - firstTick!.value) * scoreUnit) < 1)
    const legend = actorNames.map(name => { const element = label(name), b = element ? box(element) : null, near = b ? circles.filter(circle => box(circle).x + box(circle).width < b.x && Math.abs(center(box(circle)).y - center(b).y) < 3 && b.x - box(circle).x - box(circle).width < 45).sort((a, b) => box(b).x - box(a).x) : []; return { name, ink: near[0] ? color(getComputedStyle(near[0]).fill)?.rgb : null } })
    let available = tasks.length > 0 && legend.every(item => item.ink) && new Set(legend.map(item => item.ink)).size === legend.length, valid = true
    for (const task of tasks) {
      const element = label(task.label), shape = body(element), b = shape ? box(shape) : null, cx = b ? center(b).x : NaN
      const faces = circles.filter(circle => { const c = box(circle); return b && Math.abs(center(c).x - cx) < 2 && c.y > b.y + b.height && c.width >= 18 && c.width <= b.width / 2 && circles.filter(eye => eye !== circle && inside(c, box(eye)) && box(eye).width < c.width / 3).length === 2 })
      const face = faces.length === 1 ? faces[0] : undefined
      const lines = paths.filter(path => { const ends = endPoints(path); return ends.length === 2 && Math.abs(ends[0]!.x - cx) < 2 && Math.abs(ends[1]!.x - cx) < 2 && b && Math.min(ends[0]!.y, ends[1]!.y) >= b.y - 2 && Math.min(ends[0]!.y, ends[1]!.y) <= b.y + b.height && face && Math.max(ends[0]!.y, ends[1]!.y) > center(box(face)).y })
      // The pinned journey vocabulary uses a full-height task stem whose lower
      // endpoint is score zero and one visible face diameter is one score step.
      const line = lines.length === 1 ? lines[0] : undefined, score = face && calibrated ? firstTick!.value + (center(box(face)).y - firstTick!.y) / scoreUnit : face && line ? (Math.max(...endPoints(line).map(p => p.y)) - center(box(face)).y) / box(face).height : null
      const badges = b ? circles.filter(circle => { const c = box(circle); return c.width <= 18 && center(c).x >= b.x && center(c).x <= b.x + b.width && (Math.abs(center(c).y - b.y) < 2 || inside(b, c)) }) : []
      const actors = badges.map(badge => legend.find(item => item.ink === color(getComputedStyle(badge).fill)?.rgb)?.name ?? null)
      const sectionLabel = task.section ? label(task.section) : undefined, sectionBody = body(sectionLabel)
      if (!b || !face || !line && !calibrated || score === null || actors.some(name => name === null) || task.section && !sectionBody) available = false
      if (score !== null && Math.abs(score - task.score) > .03 || !same([...actors].sort(), [...(task.actors ?? [])].sort()) || b && sectionBody && (center(b).x < box(sectionBody).x || center(b).x > box(sectionBody).x + box(sectionBody).width || b.y < box(sectionBody).y + box(sectionBody).height - 2)) valid = false
      observed.push({ label: task.label, section: task.section, body: b, face: face ? box(face) : null, stem: line ? endPoints(line) : null, absoluteScore: score, actors })
    }
    // A conventional legend heading is structural only when it is visibly
    // above the complete actor legend and to the left of the task domain.
    const legendHeading = findText('Actors').filter(heading => { const h = box(heading), actorLabels = actorNames.map(label); return actorLabels.length > 0 && actorLabels.every(e => e && box(e).y > h.y + h.height && box(e).x >= h.x && box(e).x < h.x + h.width + 45) && observed.every(task => task.body && h.x + h.width < task.body.x) })
    valid &&= ordered(observed.map(task => task.body && center(task.body)), 'x') && exactText([...sourceTitle, ...sections, ...tasks.map(task => task.label), ...actorNames, ...numericTicks.map(tick => norm(tick.element.textContent ?? '')), ...legendHeading.map(e => norm(e.textContent ?? ''))])
    add('tasks', observed, available ? valid : null, 'Exact task/section/actor inventory and source order; every actor badge binds its printed legend color. Printed numeric ticks calibrate the absolute score axis when available. In the qualified unlabelled journey stem/face vocabulary, the lower stem endpoint is zero and one face diameter is one score unit, so absolute scores are measured independently rather than compared only by rank. Other score encodings remain unknown.')
    if (new Set(tasks.map(task => task.score)).size > 1) {
      const scoreAvailable = observed.length === tasks.length && observed.every(task => task.body && task.face && task.absoluteScore !== null), scoreOrder = observed.every((a, i) => observed.every((b, j) => tasks[i]!.score === tasks[j]!.score ? Math.abs(a.absoluteScore - b.absoluteScore) < .03 : tasks[i]!.score > tasks[j]!.score ? a.absoluteScore > b.absoluteScore + .03 : a.absoluteScore < b.absoluteScore - .03))
      quantitative('painted-score-order', tasks, observed.map(task => ({ label: task.label, absoluteScore: task.absoluteScore, face: task.face })), scoreAvailable ? scoreOrder : null, 'Independently calibrated, uniquely task-owned face centers also attest the complete relative score/equality order. Absolute score correctness remains the separate required full task fact; actor or section checks cannot substitute for score geometry.')
    }
    add('sections', sections.map(section => { const e = label(section), b = body(e); return { section, body: b ? box(b) : null } }), available ? valid : null, 'Each full-width section header owns its complete consecutive task span; the exact printed inventory prevents unrelated headings from supplying section credit.')
  }
  if (input.family === 'gantt') {
    const tasks: any[] = facts.tasks ?? [], sections: string[] = facts.sections ?? [], settings = facts['calendar-settings'] ?? {}, day = 86400000
    const parseDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(value + 'T00:00:00Z') / day : NaN
    const ticks = text.map(element => ({ element, day: parseDate(norm(element.textContent ?? '')), x: anchor(element).x })).filter(tick => Number.isFinite(tick.day) && [...svg.querySelectorAll('line,path')].some(raw => { const path = raw as SVGGeometryElement; return linearSegments(path).some(ends => ends.length === 2 && inkAtPoint(path, ends[0]!.y > ends[1]!.y ? ends[0]! : ends[1]!) && Math.abs(ends[0]!.x - tick.x) < 2 && Math.abs(ends[1]!.x - tick.x) < 2 && Math.max(ends[0]!.y, ends[1]!.y) <= box(tick.element).y + 3 && Math.max(ends[0]!.y, ends[1]!.y) >= box(tick.element).y - 10) })).sort((a, b) => a.day - b.day)
    const first = ticks[0], last = ticks.at(-1), unit = first && last && first !== last ? (last.x - first.x) / (last.day - first.day) : NaN
    let available = tasks.length > 0 && ticks.length >= 2 && unit > 0 && ticks.every(tick => Math.abs(tick.x - first!.x - (tick.day - first!.day) * unit) < 1.5) && ['YYYY-MM-DD', undefined].includes(settings.dateFormat), valid = true
    const excluded = String(settings.excludes ?? '').split(/[ ,]+/).filter(Boolean), included = String(settings.includes ?? '').split(/[ ,]+/).filter(Boolean)
    const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], isExcluded = (date: number) => { const iso = new Date(date * day).toISOString().slice(0, 10), weekday = new Date(date * day).getUTCDay(); return !included.includes(iso) && (excluded.includes(iso) || excluded.includes(names[weekday]!) || excluded.includes('weekends') && (weekday === 0 || weekday === 6)) }
    if (excluded.some(value => value !== 'weekends' && !names.includes(value.toLowerCase()) && !Number.isFinite(parseDate(value))) || included.some(value => !Number.isFinite(parseDate(value)))) available = false
    const schedules = new Map<string, { start: number; end: number }>(), visiting = new Set<string>()
    const schedule = (task: any): { start: number; end: number } | null => {
      if (schedules.has(task.id)) return schedules.get(task.id)!
      if (visiting.has(task.id)) return null
      visiting.add(task.id)
      let start = parseDate(task.start)
      const after = /^after\s+(.+)$/.exec(task.start)
      if (after) { const parents = after[1]!.split(/\s+/).map(id => tasks.find(candidate => candidate.id === id)).map(parent => parent ? schedule(parent) : null); if (parents.every(Boolean)) start = Math.max(...parents.map(parent => parent!.end)) }
      let end = parseDate(task.end), duration = /^(\d+(?:\.\d+)?)(d|h|m|w)$/.exec(task.end)
      if (duration && Number.isFinite(start)) {
        let remaining = Number(duration[1]) * ({ d: 1, h: 1 / 24, m: 1 / 1440, w: 7 }[duration[2]!] ?? NaN); end = start
        if (!excluded.length) end += remaining
        else if (Number.isSafeInteger(remaining)) { let limit = 0; while (remaining > 0 && limit++ < 100000) { if (!isExcluded(end)) remaining--; end++ }; if (remaining) end = NaN }
        else end = NaN
      }
      if (!Number.isFinite(start) || !Number.isFinite(end)) { visiting.delete(task.id); return null }
      if (settings.inclusiveEndDates && !duration) end++
      const result = { start, end }; schedules.set(task.id, result); visiting.delete(task.id); return result
    }
    const observed = tasks.map(task => {
      const element = label(task.label), c = element ? center(box(element)) : null
      const candidates = c ? shapes.filter(shape => { const b = box(shape); return Math.abs(center(b).y - c.y) < 3 && b.height <= Math.max(40, box(element!).height * 3) && b.width > 1 && (inside(b, box(element!)) || distance(c, b) <= Math.max(40, box(element!).width + 10)) }).sort((a, b) => distance(c, box(a)) - distance(c, box(b)) || box(a).width * box(a).height - box(b).width * box(b).height) : []
      const shape = candidates[0], b = shape ? box(shape) : null, dates = schedule(task)
      if (!shape || !dates || candidates[1] && Math.abs(distance(c!, box(candidates[1])) - distance(c!, box(shape))) < 1 && !inside(box(shape), box(element!))) available = false
      if ((task.tags ?? []).some((tag: string) => !['milestone'].includes(tag))) available = false
      const milestone = task.tags?.includes('milestone'), start = dates && first ? first.x + (dates.start - first.day) * unit : NaN, end = dates && first ? first.x + (dates.end - first.day) * unit : NaN
      let glyph: string | null = null
      if (shape && milestone) { const points = sample(shape, 128), bb = box(shape), corners = [[center(bb).x, bb.y], [bb.x + bb.width, center(bb).y], [center(bb).x, bb.y + bb.height], [bb.x, center(bb).y]]; glyph = corners.every(([x, y]) => points.some(p => Math.hypot(p.x - x!, p.y - y!) < 1.5)) ? 'diamond' : null; if (glyph !== 'diamond' || Math.abs(center(bb).x - start) > 2) valid = false }
      else if (b && (Math.abs(b.x - start) > 2 || Math.abs(b.x + b.width - end) > 2)) valid = false
      return { id: task.id, label: task.label, body: b, calendar: dates, expectedStartX: start, expectedEndX: end, glyph, tags: task.tags ?? [], section: task.section }
    })
    const taskY = observed.map(task => task.body && center(task.body).y)
    if (!taskY.every((y, i) => y !== null && (!i || y > taskY[i - 1]! + 1))) valid = false
    const sectionRows = sections.map(section => { const element = label(section), y = element ? center(box(element)).y : NaN, members = observed.filter(task => task.section === section); return { section, y, members: members.map(task => task.body && center(task.body).y), valid: Number.isFinite(y) && members.length > 0 && members.every(task => task.body) && y >= Math.min(...members.map(task => task.body!.y)) - 3 && y <= Math.max(...members.map(task => task.body!.y + task.body!.height)) + 3 } })
    if (!sectionRows.every(row => row.valid)) valid = false
    const taskShapes = uniqueShapes(shapes.filter(shape => { const b = box(shape); return observed.some(task => task.body && Math.abs(center(b).y - center(task.body).y) < 2 && b.height <= task.body.height + 1 && b.width < svg.getBoundingClientRect().width * .98) }))
    if (taskShapes.length !== tasks.length) available = false
    add('tasks', { ticks: ticks.map(tick => ({ day: tick.day, x: tick.x })), measuredDayWidth: unit, tasks: observed }, available ? valid : null, 'Visible ISO calendar ticks independently calibrate absolute bar starts/ends; source dependencies and supported weekday/date exclusions are resolved before measuring output. Exact bar inventory, task chronology and milestone diamonds are checked. Unlabelled status colors, other date grammars and ambiguous external labels stay unknown.')
    add('sections', sectionRows, available ? sectionRows.every(row => row.valid) : null, 'Each section caption lies beside its complete consecutive task-row span, in source section order.')
    const settingKeys = Object.keys(settings), supported = settingKeys.every(key => ['dateFormat', 'excludes', 'includes', 'inclusiveEndDates', 'todayMarker'].includes(key))
    add('calendar-settings', { projected: settings, ticks: ticks.map(tick => ({ label: norm(tick.element.textContent ?? ''), x: tick.x })), tasks: observed }, available && supported ? valid && (settings.todayMarker !== 'off' || !paths.some(path => { const ends = endPoints(path); return ends.length === 2 && Math.abs(ends[0]!.x - ends[1]!.x) < 1 && !ticks.some(tick => Math.abs(tick.x - ends[0]!.x) < 2) && Math.min(...ends.map(p => p.y)) < Math.min(...observed.map(task => task.body!.y)) && Math.max(...ends.map(p => p.y)) > Math.max(...observed.map(task => task.body!.y + task.body!.height)) })) : null, 'Date format and inclusion/exclusion settings must produce the independently calibrated task calendar; todayMarker off requires no non-tick full-height date marker. Other display/axis/tick/weekend configuration stays required and unknown.')
  }
  if (input.family === 'treeview') {
    const hierarchy: any[] = facts.hierarchy ?? [], observations = hierarchy.map(entry => { const node = input.expected.nodes?.find(node => node.id === entry.id), e = label(node?.label || (entry.parent ? entry.id.split('/').at(-1)! : '/')); return { ...entry, label: node?.label, box: e ? box(e) : null, weight: e ? getComputedStyle(e).fontWeight : null } })
    const depth = (id: string, seen = new Set<string>()): number => { const entry = hierarchy.find(entry => entry.id === id); if (!entry?.parent) return 0; if (seen.has(id)) return NaN; seen.add(id); return 1 + depth(entry.parent, seen) }
    const all = observations.every(entry => entry.box), origins = observations.filter(entry => entry.box).map(entry => ({ id: entry.id, depth: depth(entry.id), x: entry.box!.x, y: center(entry.box!).y })), root = origins.find(entry => entry.depth === 0)
    const steps = origins.filter(entry => entry.depth > 0).map(entry => (entry.x - root!.x) / entry.depth), step = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : NaN
    const lines = paths.filter(path => { const ends = endPoints(path); return ends.length === 2 && (Math.abs(ends[0]!.x - ends[1]!.x) < 1 || Math.abs(ends[0]!.y - ends[1]!.y) < 1) })
    let available = all && root && Number.isFinite(step) && step > 0, valid = ordered(origins, 'y') && origins.every(entry => Math.abs(entry.x - root!.x - entry.depth * step) < 1.5)
    for (const entry of origins) {
      const labelBox = observations.find(node => node.id === entry.id)!.box!, h = lines.filter(line => { const b = box(line); return b.height < 1 && Math.abs(center(b).y - entry.y) < labelBox.height * .25 && b.x + b.width <= labelBox.x && labelBox.x - b.x - b.width < step })
      if (h.length !== 1) available = false
      if (entry.depth > 0) { const parent = origins.find(parent => parent.id === hierarchy.find(node => node.id === entry.id)?.parent); if (!parent) available = false; else { const connected = lines.some(line => { const b = box(line); return b.width < 1 && Math.abs(b.x - (h[0] ? box(h[0]).x : NaN)) < 1 && b.y > parent.y && b.y < entry.y && b.y + b.height >= entry.y - 1 }); if (!connected) valid = false } }
    }
    const labels = observations.map(entry => entry.label || '/'); if (label('/') && !labels.includes('/')) labels.unshift('/'); valid &&= exactText(labels)
    // Directories have a physical bold distinction in this finite icon-free
    // representation; an icon-only alternative needs its own asset observer.
    const dirWeights = observations.filter(entry => entry.directory).map(entry => Number(entry.weight)), fileWeights = observations.filter(entry => !entry.directory).map(entry => Number(entry.weight))
    if (dirWeights.some(weight => !Number.isFinite(weight)) || fileWeights.some(weight => !Number.isFinite(weight))) available = false
    if (dirWeights.length && fileWeights.length && Math.min(...dirWeights) <= Math.max(...fileWeights)) available = false
    add('hierarchy', { nodes: observations, measuredIndent: step, connectorCount: lines.length }, available ? valid : null, 'Exact visible row inventory and preorder plus a common measured indentation unit reconstruct immediate parents. Every child owns its physical horizontal connector and shared parent stem; directory/file distinctions require measured bold contrast in the icon-free profile. Icons, ambiguous directories and alternate tree vocabularies stay unknown.')
  }
  if (input.family === 'venn') {
    const sets: any[] = facts.sets ?? [], intersections: any[] = facts.intersections ?? [], texts: any[] = facts['region-texts'] ?? [], circles = shapes.filter(shape => outlineKind(shape) === 'circle'), used = new Set<Element>()
    const contains = (shape: SVGGeometryElement, p: { x: number; y: number }) => { const matrix = shape.getScreenCTM(); return !!matrix && shape.isPointInFill(new DOMPoint(p.x, p.y).matrixTransform(matrix.inverse())) }
    const observed = sets.map(set => { const element = label(set.label), c = element ? center(box(element)) : null, candidates = c ? circles.filter(circle => contains(circle, c)) : [], owner = candidates.length === 1 ? candidates[0] : undefined; if (owner) used.add(owner); return { id: set.id, label: set.label, owner, box: owner ? box(owner) : null, size: set.size } })
    let available = sets.length > 0 && observed.every(set => set.owner) && used.size === sets.length, valid = circles.length === sets.length
    const area = (shape: SVGGeometryElement) => { const points = sample(shape, 1024); return Math.abs(points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]!; return sum + p.x * q.y - p.y * q.x }, 0)) / 2 }
    const setAreas = observed.map(set => set.owner ? area(set.owner) : NaN), knownSizes = observed.filter(set => Number.isFinite(set.size)), scale = knownSizes.length ? knownSizes.reduce((sum, set) => sum + area(set.owner!), 0) / knownSizes.reduce((sum, set) => sum + set.size, 0) : NaN
    if (knownSizes.some(set => !set.owner || Math.abs(area(set.owner) / scale - set.size) > Math.max(.02, set.size * .04))) valid = false
    const unionObservations = intersections.map(intersection => {
      const element = label(intersection.label), c = element ? center(box(element)) : null, members = observed.filter(set => intersection.members.includes(set.id)), membership = c ? observed.filter(set => set.owner && contains(set.owner, c)).map(set => set.id).sort() : null
      if (!c || members.length !== intersection.members.length || members.some(set => !set.owner)) { available = false; return { members: intersection.members, label: intersection.label, membership, sampledArea: null } }
      const outer = { x: Math.max(...members.map(set => box(set.owner!).x)), y: Math.max(...members.map(set => box(set.owner!).y)), right: Math.min(...members.map(set => box(set.owner!).x + box(set.owner!).width)), bottom: Math.min(...members.map(set => box(set.owner!).y + box(set.owner!).height)) }
      let count = 0
      if (outer.right > outer.x && outer.bottom > outer.y) for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const p = { x: outer.x + (x + .5) / 128 * (outer.right - outer.x), y: outer.y + (y + .5) / 128 * (outer.bottom - outer.y) }; if (members.every(set => contains(set.owner!, p))) count++ }
      const sampledArea = count / (128 * 128) * Math.max(0, outer.right - outer.x) * Math.max(0, outer.bottom - outer.y)
      if (!same(membership, [...intersection.members].sort()) || sampledArea <= 0 || intersection.size !== undefined && Number.isFinite(scale) && Math.abs(sampledArea / scale - intersection.size) > Math.max(.03, intersection.size * .05)) valid = false
      return { members: intersection.members, label: intersection.label, membership, sampledArea }
    })
    const regionTexts = texts.map(entry => { const element = label(entry.label), c = element ? center(box(element)) : null, members = entry.owner.kind === 'set' ? [entry.owner.id] : entry.owner.members, actual = c ? observed.filter(set => set.owner && contains(set.owner, c)).map(set => set.id).sort() : null; if (!same(actual, [...members].sort())) valid = false; return { label: entry.label, wantedMembers: members, actualMembers: actual } })
    if (!exactText([...sourceTitle, ...sets.map(set => set.label), ...intersections.map(item => item.label), ...texts.map(item => item.label)])) valid = false
    if (circles.length !== sets.length) valid = false
    add('sets', observed.map(({ owner: _, ...entry }) => entry), available ? valid : null, 'Each set label uniquely owns a measured circular set outline; exact circle inventory and authored relative set areas are checked independently. Set names never borrow intersection labels.')
    add('intersections', unionObservations, available ? valid : null, 'Each region label has exactly its declared set membership. Actual overlap area is reconstructed as the boolean intersection of the owned painted set circles on a 128×128 grid, with authored proportional sizes within5%. Invisible overlay paths supply no region credit. Complete region and text inventories reject extra regions.')
    add('region-texts', regionTexts, available ? valid : null, 'Additional region text owns exactly its declared set or intersection membership in the actual filled set geometry.')
  }
  if (input.family === 'cynefin') {
    const names = ['complex', 'complicated', 'clear', 'chaotic', 'confusion'], domains: any[] = facts['framework-domains'] ?? [], entries: any[] = facts['domain-entries'] ?? [], transitions: any[] = facts['domain-transitions'] ?? []
    const owners = names.map(name => { const e = label(name[0]!.toUpperCase() + name.slice(1)), candidates = e && name !== 'confusion' ? [...svg.querySelectorAll('rect')].filter(rect => filled(rect) && inside(box(rect), box(e)) && box(rect).width > 100 && box(rect).height > 100).sort((a, b) => box(a).width * box(a).height - box(b).width * box(b).height) : [], shape = name === 'confusion' ? body(e) : candidates[0]; return { id: name, label: e, shape: shape as SVGGeometryElement | undefined, box: shape ? box(shape) : null } })
    const quadrants = owners.slice(0, 4), bounds = quadrants.every(domain => domain.box) ? { x: Math.min(...quadrants.map(domain => domain.box!.x)), y: Math.min(...quadrants.map(domain => domain.box!.y)), right: Math.max(...quadrants.map(domain => domain.box!.x + domain.box!.width)), bottom: Math.max(...quadrants.map(domain => domain.box!.y + domain.box!.height)) } : null
    let available = !!bounds && owners.every(domain => domain.shape), valid = true
    const positions = owners.map(domain => { const c = domain.box ? center(domain.box) : null; return { id: domain.id, x: c && bounds ? (c.x - bounds.x) / (bounds.right - bounds.x) : null, y: c && bounds ? (c.y - bounds.y) / (bounds.bottom - bounds.y) : null, kind: outlineKind(domain.shape) } })
    for (const item of positions) { const wanted = ({ complex: [.25, .25], complicated: [.75, .25], clear: [.75, .75], chaotic: [.25, .75], confusion: [.5, .5] } as Record<string, number[]>)[item.id]!; if (item.x === null || item.y === null || Math.abs(item.x - wanted[0]!) > .015 || Math.abs(item.y - wanted[1]!) > .015 || (item.id === 'confusion' ? item.kind !== 'ellipse' : item.kind !== 'rectangle')) valid = false }
    const observed = entries.map(entry => { const e = label(entry.label), c = e ? center(box(e)) : null, confusion = owners[4]!, inConfusion = c && confusion.shape ? (() => { const m = confusion.shape!.getScreenCTM(); return !!m && confusion.shape!.isPointInFill(new DOMPoint(c.x, c.y).matrixTransform(m.inverse())) })() : false, member = c ? inConfusion ? 'confusion' : quadrants.find(domain => domain.box && inside(domain.box, box(e!)))?.id : null; if (member !== entry.domain) valid = false; return { label: entry.label, domain: member, box: e ? box(e) : null } })
    const boundaryVocabulary = [...svg.querySelectorAll('path')].filter(path => !path.closest('defs,marker,clipPath,mask') && endPoints(path).some(p => inkAtPoint(path, p)))
    const boundaryPaths = bounds ? boundaryVocabulary.filter(path => { const b = box(path); return !filled(path) && (b.height > (bounds.bottom - bounds.y) * .9 && b.width < (bounds.right - bounds.x) * .08 || b.width > (bounds.right - bounds.x) * .9 && b.height < (bounds.bottom - bounds.y) * .08) }) : []
    const cliff = bounds ? boundaryVocabulary.filter(path => { const b = box(path); return !filled(path) && b.height > (bounds.bottom - bounds.y) * .45 && b.height < (bounds.bottom - bounds.y) * .55 && b.width > 2 && b.width < (bounds.right - bounds.x) * .1 && Math.abs(b.y - (bounds.y + bounds.bottom) / 2) < 2 }) : []
    const wave = boundaryPaths.map(path => { const pts = sample(path, 256).filter(p => inkAtPoint(path, p)), b = box(path), vertical = b.height > b.width, positions = pts.map(p => vertical ? p.x : p.y), extent = Math.max(...positions) - Math.min(...positions); return { box: b, crossAxisExcursion: extent, turns: positions.slice(2).filter((value, i) => (value - positions[i + 1]!) * (positions[i + 1]! - positions[i]!) < 0).length } })
    const boundariesOkay = boundaryPaths.length === 2 && wave.every(item => item.crossAxisExcursion > 2 && item.turns >= 4) && cliff.length === 1
    const defaults = ['Complex', 'Complicated', 'Clear', 'Chaotic', 'Confusion', 'Probe → Sense → Respond', 'Emergent Practices', 'Sense → Analyse → Respond', 'Good Practices', 'Act → Sense → Respond', 'Novel Practices', 'Sense → Categorise → Respond', 'Best Practices', 'Disorder']
    const inventory = exactText([...sourceTitle, ...defaults, ...entries.map(entry => entry.label), ...transitions.map(entry => entry.label)])
    add('framework-domains', positions, available ? valid && domains.length === 5 : null, 'Four separately owned rectangular quadrants and a central ellipse reconstruct the five fixed framework domains from geometry and their visible conventional names.')
    add('framework-boundaries', { waves: wave, cliff: cliff.map(box) }, available && boundaryPaths.length === 2 && cliff.length === 1 ? boundariesOkay : null, 'Actual upper/lower and left/right partition strokes require repeated cross-axis turns; the lower central cliff is a separate visibly curved boundary. Straight lines and missing cliff geometry cannot substitute.')
    add('domain-entries', observed, available ? valid && inventory : null, 'Every exact entry label belongs to its declared measured quadrant or central ellipse, with complete conventional and source text inventories.')
    add('domain-transitions', null, transitions.length ? null : available ? paths.filter(path => !boundaryPaths.includes(path) && !cliff.includes(path) && !owners.some(owner => owner.shape === path) && box(path).width > 10 && box(path).height > 10).length === 0 && inventory : null, 'An empty transition contract requires no extra visible routes. Directed inter-domain transition glyph/caption ownership remains unknown until its endpoint/marker vocabulary is qualified.')
  }
  if (input.family === 'wardley') {
    const components: any[] = facts.components ?? [], links: any[] = facts.links ?? [], axisX = label('Evolution'), axisY = label('Visibility')
    const axisSegments = paths.flatMap(path => linearSegments(path).filter(ends => ends.length === 2 && ends.every(p => inkAtPoint(path, p))).map(ends => ({ x: Math.min(...ends.map(p => p.x)), y: Math.min(...ends.map(p => p.y)), width: Math.abs(ends[1]!.x - ends[0]!.x), height: Math.abs(ends[1]!.y - ends[0]!.y) })))
    const horizontal = axisSegments.filter(b => b.height < 1 && b.width > 100 && axisX && b.y < box(axisX).y && b.y >= box(axisX).y - 50).sort((a, b) => b.width - a.width)[0]
    const plot = horizontal ? (() => { const h = horizontal, vertical = axisSegments.filter(b => b.width < 1 && Math.abs(b.x - h.x) < 1 && Math.abs(b.y + b.height - h.y) < 1 && b.height > 100).sort((a, b) => b.height - a.height)[0]; return vertical && axisY && box(axisY).x < h.x ? { x: h.x, y: vertical.y, width: h.width, height: vertical.height } : null })() : null
    const glyphs = [...shapes, ...paths.filter(path => path.localName === 'polyline')].filter(shape => box(shape).width >= 3 && box(shape).width <= 40 && box(shape).height >= 3 && box(shape).height <= 40)
    const memberGlyph = (name: string) => { const e = label(name), candidates = e ? glyphs.filter(glyph => outlineKind(glyph) === 'circle').map(glyph => ({ glyph, d: distance(center(box(glyph)), box(e)) })).filter(item => item.d <= Math.max(25, box(e).height * 2)).sort((a, b) => a.d - b.d) : []; return candidates[0] && (!candidates[1] || candidates[1].d - candidates[0].d > 2) ? candidates[0].glyph : undefined }
    const pipelineObservations = (facts.pipelines ?? []).map((pipeline: any) => {
      const parent = components.find(component => component.name === pipeline.component), e = label(pipeline.component), members = pipeline.members.map((member: any) => { const glyph = memberGlyph(member.name), c = glyph ? center(box(glyph)) : null; return { ...member, glyph, point: c, observed: c && plot ? { visibility: (plot.y + plot.height - c.y) / plot.height, evolution: (c.x - plot.x) / plot.width } : null } })
      const headerCandidates = e ? glyphs.filter(glyph => outlineKind(glyph) === 'rectangle').map(glyph => ({ glyph, distance: distance(center(box(glyph)), box(e)) })).filter(item => item.distance < 25).sort((a, b) => a.distance - b.distance) : [], header = headerCandidates.length === 1 ? headerCandidates[0]!.glyph : undefined
      const candidates = [...svg.querySelectorAll('rect')].filter(rect => { const b = box(rect); return plot && b.width > 40 && b.height > 4 && b.height < plot.height * .15 && members.length > 1 && members.every((member: any) => member.glyph && inside(b, box(member.glyph))) && e && box(e).y + box(e).height <= b.y + 2 && b.y - box(e).y < Math.max(40, box(e).height * 3) && center(box(e)).x >= b.x && center(box(e)).x <= b.x + b.width && sample(rect, 256).every(p => header && distance(p, box(header)) < 1 || inkAtPoint(rect, p)) }).sort((a, b) => box(a).width * box(a).height - box(b).width * box(b).height), owner = candidates[0], b = owner ? box(owner) : null, visibility = b && plot ? (plot.y + plot.height - center(b).y) / plot.height : null
      const available = parent?.kind === 'pipeline-group' && Number.isFinite(parent.visibility) && !!b && members.every((member: any) => member.observed && member.kind === 'component' && outlineKind(member.glyph) === 'circle') && new Set(members.map((member: any) => member.glyph)).size === members.length
      const valid = available && Math.abs(visibility! - parent.visibility) < .008 && members.every((member: any) => Math.abs(member.observed.visibility - parent.visibility) < .008 && Math.abs(member.observed.evolution - member.coordinates[0]) < .008)
      return { component: pipeline.component, owner, body: b, visibility, members, available, valid }
    })
    const observed = components.map(component => {
      const e = label(component.name), candidates = e ? glyphs.map(glyph => ({ glyph, d: distance(center(box(glyph)), box(e)) })).filter(item => item.d <= 25).sort((a, b) => a.d - b.d) : [], glyph = candidates[0] && (!candidates[1] || candidates[1].d - candidates[0].d > 2) ? candidates[0].glyph : undefined, c = glyph ? center(box(glyph)) : component.kind === 'anchor' && e?.localName === 'text' && (e as SVGTextElement).x.baseVal.numberOfItems && (e as SVGTextElement).y.baseVal.numberOfItems ? point(e as SVGTextElement, (e as SVGTextElement).x.baseVal.getItem(0).value, (e as SVGTextElement).y.baseVal.getItem(0).value + 3) : null
      const pipeline = pipelineObservations.find((entry: any) => entry.component === component.name)
      const textMatrix = e?.localName === 'text' ? (e as SVGTextElement).getScreenCTM() : null, origin = e && c && textMatrix && getComputedStyle(e).textAnchor === 'start' && ['auto', 'alphabetic'].includes(getComputedStyle(e).dominantBaseline) && (e as SVGTextElement).getNumberOfChars() ? (e as SVGTextElement).getStartPositionOfChar(0).matrixTransform(textMatrix) : null
      const labelOffsetActual = component.labelOffset && origin && c && textMatrix && Math.abs(textMatrix.b) < 1e-8 && Math.abs(textMatrix.c) < 1e-8 ? [(origin.x - c.x) / textMatrix.a, (origin.y - c.y) / textMatrix.d] : null
      return { ...component, glyph, glyphKind: outlineKind(glyph), point: component.kind === 'pipeline-group' && pipeline?.body ? center(pipeline.body) : c, coordinates: component.kind === 'pipeline-group' ? null : c && plot ? [(plot.y + plot.height - c.y) / plot.height, (c.x - plot.x) / plot.width] : null, pipelineVisibility: pipeline?.visibility ?? null, labelOffsetActual, labelBox: e ? box(e) : null }
    })
    let available = !!plot && components.length > 0 && observed.every(component => component.kind === 'pipeline-group' ? pipelineObservations.some((entry: any) => entry.component === component.name && entry.available) : component.coordinates && !component.inertia && !component.strategy && (!component.labelOffset || component.labelOffsetActual) && component.coordinates.length === 2), valid = true
    for (const component of observed) { if (component.kind === 'pipeline-group') { if (!pipelineObservations.some((entry: any) => entry.component === component.name && entry.valid)) valid = false; continue }; if (!component.coordinates || component.coordinates.some((value: number, i: number) => Math.abs(value - components.find(c => c.name === component.name).coordinates[i]) > .008)) valid = false; if (component.kind === 'component' && component.glyphKind !== 'circle' || component.labelOffsetActual?.some((value: number, i: number) => Math.abs(value - component.labelOffset[i]) > 1)) valid = false }
    const bind = (p: { x: number; y: number }) => { const nearest = observed.filter(component => component.point).map(component => ({ name: component.name, d: Math.hypot(component.point!.x - p.x, component.point!.y - p.y) })).sort((a, b) => a.d - b.d); return nearest[0] && nearest[0].d <= 22 && (!nearest[1] || nearest[1].d - nearest[0].d > 2) ? nearest[0].name : null }
    const linkCandidates = plot ? paths.filter(path => {
      const ends = endPoints(path)
      if (ends.length !== 2 || !ends.every(p => p.x > plot.x - 2 && p.x < plot.x + plot.width + 2 && p.y > plot.y - 2 && p.y < plot.y + plot.height + 2) || Math.hypot(ends[0]!.x - ends[1]!.x, ends[0]!.y - ends[1]!.y) < 2) return false
      if (bind(ends[0]!) && bind(ends[1]!) && bind(ends[0]!) !== bind(ends[1]!)) return true
      const segments = linearSegments(path), frameOnly = segments.length > 0 && segments.every(segment => segment.every(p => Math.abs(p.x - plot.x) < 1) || segment.every(p => Math.abs(p.y - plot.y - plot.height) < 1))
      return !frameOnly && Math.abs(ends[0]!.y - ends[1]!.y) > 1 && Math.abs(ends[0]!.x - ends[1]!.x) > 1
    }) : []
    const routes = linkCandidates.map(path => { const ends = endPoints(path); return { source: bind(ends[0]!), target: bind(ends[1]!), ends: ends.map(p => ({ x: p.x, y: p.y })) } })
    const linkAvailable = available && links.every(link => link.kind === '->' && !link.label) && routes.every(route => route.source && route.target), canonical = (edge: any) => [edge.source, edge.target].sort().join('\0')
    const linksOkay = same(links.map(canonical).sort(), routes.map(canonical).sort())
    const paintedTip = (route: SVGGeometryElement) => {
      const id = /#([^\s)"']+)/.exec(getComputedStyle(route).markerEnd)?.[1], marker = id ? document.getElementById(decodeURIComponent(id)) as SVGMarkerElement | null : null
      if (!marker || marker.localName !== 'marker' || marker.children.length !== 1 || !['auto', 'auto-start-reverse'].includes(marker.getAttribute('orient') ?? '') || marker.hasAttribute('transform')) return null
      const head = marker.children[0]!, data = head.getAttribute('d') ?? '', commands = data.match(/[MmLlZz]/g), values = data.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/g)?.map(Number), css = getComputedStyle(head)
      if (head.localName !== 'path' || head.hasAttribute('transform') || !same(commands, ['M', 'L', 'L', 'z']) && !same(commands, ['M', 'L', 'L', 'Z']) || values?.length !== 6 || !color(css.fill) || Number(css.fillOpacity) * Number(css.opacity) < 1 / 255 || css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility)) return null
      const vertices = Array.from({ length: 3 }, (_, i) => ({ x: values[i * 2]!, y: values[i * 2 + 1]! })).sort((a, b) => b.x - a.x), tip = vertices[0]!, base = vertices.slice(1)
      if (Math.abs(base[0]!.x - base[1]!.x) > .1 || tip.x <= base[0]!.x || tip.y <= Math.min(...base.map(p => p.y)) || tip.y >= Math.max(...base.map(p => p.y))) return null
      const view = marker.viewBox.baseVal, mw = marker.markerWidth.baseVal.value, mh = marker.markerHeight.baseVal.value, matrix = route.getScreenCTM(), endpoints = endPoints(route), unit = marker.getAttribute('markerUnits') === 'userSpaceOnUse' ? 1 : Number.parseFloat(getComputedStyle(route).strokeWidth)
      if (!matrix || view.width <= 0 || view.height <= 0 || mw <= 0 || mh <= 0 || endpoints.length !== 2 || !Number.isFinite(unit)) return null
      const zoom = Math.min(mw / view.width, mh / view.height) * unit * Math.hypot(matrix.a, matrix.b), dx = endpoints[1]!.x - endpoints[0]!.x, dy = endpoints[1]!.y - endpoints[0]!.y, length = Math.hypot(dx, dy), forward = (tip.x - marker.refX.baseVal.value) * zoom, sideways = (tip.y - marker.refY.baseVal.value) * zoom
      return length > 0 ? { x: endpoints[1]!.x + forward * dx / length - sideways * dy / length, y: endpoints[1]!.y + forward * dy / length + sideways * dx / length } : null
    }
    const evolution = (facts.evolution ?? []).map((entry: any) => { const component = observed.find(component => component.name === entry.component), p = component?.point, candidates = p && plot ? paths.filter(path => { const ends = endPoints(path); return ends.length === 2 && Math.abs(ends[0]!.x - p.x) < 2 && Math.abs(ends[0]!.y - p.y) < 2 && Math.abs(ends[1]!.y - p.y) < 2 && ends[1]!.x > p.x + 2 }) : [], route = candidates.length === 1 ? candidates[0] : undefined, endpoint = route ? endPoints(route)[1] : undefined, tip = route ? paintedTip(route) : null, wantedX = plot ? plot.x + entry.target * plot.width : NaN; return { component: entry.component, stemEndpoint: endpoint ?? null, visibleTip: tip, target: tip && plot ? (tip.x - plot.x) / plot.width : null, expected: entry.target, expectedVisibleX: wantedX, errorCSSPixels: tip ? Math.abs(tip.x - wantedX) : null } })
    const notes = (facts.notes ?? []).map((entry: any) => { const e = label(entry.text), p = e ? anchor(e) : null; return { text: entry.text, point: p && plot ? [(plot.y + plot.height - p.y) / plot.height, (p.x - plot.x) / plot.width] : null, wanted: entry.coordinates } })
    add('map-axes', { plot, xCaption: axisX ? box(axisX) : null, yCaption: axisY ? box(axisY) : null }, plot ? true : null, 'The separately captioned actual Evolution/Visibility axis strokes establish the complete [0,1] rightward/upward map frame in the qualified Wardley vocabulary, independent of authored component positions.')
    add('components', observed.map(({ glyph: _, ...component }) => component), available ? valid && glyphs.length === components.filter(component => component.kind !== 'anchor').length + (facts.pipelines ?? []).reduce((n: number, pipeline: any) => n + pipeline.members.length, 0) : null, 'Each uniquely owned component/anchor glyph is measured in the independent painted map frame within0.8%. Complete glyph inventory prevents matching labels from borrowing positions; strategy, inertia, offsets and unknown glyph vocabularies remain unknown.')
    add('pipelines', pipelineObservations.map(({ owner: _, members, ...pipeline }: any) => ({ ...pipeline, members: members.map(({ glyph: __, ...member }: any) => member) })), available && pipelineObservations.every((entry: any) => entry.available) ? pipelineObservations.every((entry: any) => entry.valid) && valid : null, 'A separately captioned actual horizontal range encloses the exact pipeline member glyphs; its vertical center and every member center share authored visibility, while each member center preserves its own evolution. The source-reviewed pipeline-group representation replaces the parent standalone evolution point; the original point coordinate remains native/advisory metadata.')
    add('links', routes, linkAvailable ? linksOkay : null, 'Exact dependency inventory binds actual route endpoints to independently owned map glyphs; unheaded ordinary links encode endpoint pairs. Directed/decorated/value-chain relationship vocabulary needs separate marker evidence.')
    add('evolution', evolution, available && evolution.every((entry: any) => entry.target !== null) ? evolution.every((entry: any) => entry.errorCSSPixels <= 2) : null, 'Evolution routes start at the owned source component; their actual painted marker tip, reconstructed from visible triangle geometry and SVG marker viewport/ref transforms, must reach the authored normalized target within2 CSS pixels. A shortened stem or hypothetical unpainted target circle supplies no target credit.')
    add('notes', notes, plot && notes.every((entry: any) => entry.point) ? notes.every((entry: any) => entry.point.every((value: number, i: number) => Math.abs(value - entry.wanted[i]) < .012)) : null, 'Each note owns its separate visible text origin in the painted map coordinate frame within1.2%; no native coordinate metadata is observed.')
    if (facts.size) { const view = svg.viewBox.baseVal; add('size', { width: view.width, height: view.height }, view.width > 0 && view.height > 0 ? Math.abs(view.width - facts.size[0]) < .01 && Math.abs(view.height - facts.size[1]) < .01 : null, 'Authored map size binds actual SVG viewBox user dimensions, independent of browser CSS scaling.') }
    if (facts['evolution-stages']) { const stages = facts['evolution-stages'].map((entry: any, i: number, all: any[]) => { const e = label(entry.label), p = e ? center(box(e)) : null, lower = entry.position ?? i / all.length, upper = all[i + 1]?.position ?? (i + 1) / all.length; return { label: entry.label, position: p && plot ? (p.x - plot.x) / plot.width : null, lower, upper, belowAxis: p && plot ? p.y > plot.y + plot.height : null } }); add('evolution-stages', stages, plot && stages.every((entry: any) => entry.position !== null) ? stages.every((entry: any) => entry.belowAxis && entry.position >= entry.lower && entry.position <= entry.upper) : null, 'Each stage caption owns its measured interval along the independently established evolution axis; explicit boundary positions require corresponding physical separators.') }
  }
  if (input.family.startsWith('railroad')) {
    type P = { x: number; y: number }
    type Expression = { ast: any; left: P; right: P; box: Box; elements: Element[] }
    const near = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y) <= 1.5
    const directPaths = (element: Element) => [...element.children].filter(child => paths.includes(child as SVGGeometryElement)) as SVGGeometryElement[]
    const directGroups = (element: Element) => [...element.children].filter(child => child.localName === 'g' && [...child.querySelectorAll('text')].some(e => text.includes(e)))
    const parsed = new Map<Element, Expression | null>()
    const expression = (element: Element): Expression | null => {
      if (parsed.has(element)) return parsed.get(element)!
      parsed.set(element, null)
      const ownText = [...element.children].filter(child => text.includes(child)), ownRects = [...element.children].filter(child => shapes.includes(child as SVGGeometryElement) && child.localName === 'rect'), groups = directGroups(element), routes = directPaths(element)
      if (ownText.length === 1 && ownRects.length === 1 && !groups.length && !routes.length) {
        const rect = ownRects[0]!, b = box(rect), labelBox = box(ownText[0]!)
        if (!inside(b, labelBox)) return null
        const kind = outlineKind(rect as SVGGeometryElement), ast = { kind: kind === 'rounded' ? 'terminal' : kind === 'rectangle' ? 'reference' : null, value: norm(ownText[0]!.textContent ?? '') }
        if (!ast.kind) return null
        const result = { ast, left: { x: b.x, y: center(b).y }, right: { x: b.x + b.width, y: center(b).y }, box: b, elements: [rect, ownText[0]!] }; parsed.set(element, result); return result
      }
      if (ownText.length || ownRects.length) return null
      const children = groups.map(expression)
      if (children.some(child => !child)) return null
      const items = children as Expression[]
      if (items.length === 1 && routes.length === 0) { parsed.set(element, items[0]!); return items[0]! }
      if (items.length > 1) {
        const byX = [...items].sort((a, b) => a.left.x - b.left.x), byY = [...items].sort((a, b) => a.box.y - b.box.y)
        const sequence = byX.every((item, i) => !i || item.left.x > byX[i - 1]!.right.x && Math.abs(item.left.y - byX[i - 1]!.right.y) < 1.5)
        if (sequence && routes.length === items.length - 1 && byX.slice(1).every((item, i) => routes.some(route => { const ends = endPoints(route); return ends.length === 2 && (near(ends[0]!, byX[i]!.right) && near(ends[1]!, item.left) || near(ends[1]!, byX[i]!.right) && near(ends[0]!, item.left)) }))) {
          const result = { ast: { kind: 'sequence', items: byX.map(item => item.ast) }, left: byX[0]!.left, right: byX.at(-1)!.right, box: box(element), elements: [...routes, ...items.flatMap(item => item.elements)] }; parsed.set(element, result); return result
        }
        if (routes.length !== items.length * 2 || !byY.every((item, i) => !i || item.box.y >= byY[i - 1]!.box.y + byY[i - 1]!.box.height - 1)) return null
        const leftEnds: P[] = [], rightEnds: P[] = []
        for (const item of byY) {
          for (const [port, ends] of [[item.left, leftEnds], [item.right, rightEnds]] as const) {
            const candidate = routes.filter(route => endPoints(route).some(p => near(p, port)))
            if (candidate.length !== 1) return null
            const other = endPoints(candidate[0]!).find(p => !near(p, port)); if (!other) return null; ends.push({ x: other.x, y: other.y })
          }
        }
        if (!leftEnds.every(p => near(p, leftEnds[0]!)) || !rightEnds.every(p => near(p, rightEnds[0]!)) || leftEnds[0]!.x >= Math.min(...items.map(item => item.left.x)) || rightEnds[0]!.x <= Math.max(...items.map(item => item.right.x))) return null
        const result = { ast: { kind: input.family === 'railroad-peg' ? 'ordered-choice' : 'choice', items: byY.map(item => item.ast) }, left: leftEnds[0]!, right: rightEnds[0]!, box: box(element), elements: [...routes, ...items.flatMap(item => item.elements)] }; parsed.set(element, result); return result
      }
      if (items.length === 1 && routes.length >= 3 && routes.length <= 4) {
        const child = items[0]!, straight = routes.filter(route => { const b = box(route); return b.height < 1 && b.width > 1 }), left = straight.find(route => endPoints(route).some(p => near(p, child.left))), right = straight.find(route => endPoints(route).some(p => near(p, child.right)))
        if (!left || !right || left === right) return null
        const leftOuter = endPoints(left).find(p => !near(p, child.left)), rightOuter = endPoints(right).find(p => !near(p, child.right)); if (!leftOuter || !rightOuter) return null
        const others = routes.filter(route => route !== left && route !== right), bypass = others.filter(route => { const ends = endPoints(route); return ends.some(p => near(p, leftOuter)) && ends.some(p => near(p, rightOuter)) && box(route).y < child.box.y - 2 }), loops = others.filter(route => { const ends = endPoints(route); return ends.some(p => near(p, child.left)) && ends.some(p => near(p, child.right)) && box(route).y + box(route).height > child.box.y + child.box.height + 2 })
        if (bypass.length > 1 || loops.length > 1 || bypass.length + loops.length !== others.length || !bypass.length && !loops.length) return null
        const result = { ast: { kind: 'repeat', minimum: bypass.length ? 0 : 1, maximum: loops.length ? null : 1, expression: child.ast }, left: { x: leftOuter.x, y: leftOuter.y }, right: { x: rightOuter.x, y: rightOuter.y }, box: box(element), elements: [...routes, ...child.elements] }; parsed.set(element, result); return result
      }
      return null
    }
    const rules: any[] = facts['grammar-rules'] ?? [], observations = rules.map(rule => {
      const names = text.filter(element => /\s=\s*$/.test(norm(element.textContent ?? '')) && norm(element.textContent ?? '').replace(/\s*=\s*$/, '') === rule.name), name = names.length === 1 ? names[0] : undefined
      let result: Expression | null = null, owner: Element | null = name?.parentElement ?? null
      while (owner && owner !== svg && !result) { const groups = directGroups(owner).filter(group => !group.contains(name!)); const candidates = groups.map(expression).filter((item): item is Expression => !!item); if (candidates.length === 1) result = candidates[0]!; else owner = owner.parentElement }
      if (!result || !owner) return { name: rule.name, actual: null, ports: null, inventory: null }
      const dots = [...owner.querySelectorAll('circle')].filter(dot => visible(dot) && box(dot).width <= 12), routes = directPaths(owner), connected = dots.length === 2 && routes.length === 2 && [result.left, result.right].every(port => routes.some(route => endPoints(route).some(p => near(p, port)) && endPoints(route).some(p => dots.some(dot => Math.hypot(p.x - center(box(dot)).x, p.y - center(box(dot)).y) <= box(dot).width / 2 + 1))))
      return { name: rule.name, actual: result.ast, ports: [result.left, result.right], connected, inventory: result.elements.length, y: box(name!).y }
    })
    const available = rules.length > 0 && observations.every(rule => rule.actual && rule.connected)
    const observedNames = text.filter(element => /\s=\s*$/.test(norm(element.textContent ?? '')))
    add('grammar-rules', observations, available ? same(rules.map(rule => ({ name: rule.name, expression: rule.expression })), observations.map(rule => ({ name: rule.name, expression: rule.actual }))) && observedNames.length === rules.length && ordered(observations.map(rule => ({ x: 0, y: rule.y! })), 'y') : null, 'Actual owned terminal/reference outlines and physical connector endpoints recursively reconstruct sequence, vertical alternative order, optional bypasses and repetition loops for every rule. Start/end dots must connect each rule, inventories are exact, and renderer IDs/classes provide no grammar fact. Lookahead, finite repeat bounds and unfamiliar wiring remain unknown.')
    add('grammar-dialect', null, null, 'Grammar syntax dialect is not uniquely printed by equivalent railroad drawings; the complete semantic grammar AST is observed separately and the declared dialect remains required unknown.')
  }
  if (input.family === 'mindmap') {
    const hierarchy: any[] = facts.hierarchy ?? []
    const observed = hierarchy.map(entry => { const declared = input.expected.nodes?.find(node => node.id === entry.id), e = label(declared?.label ?? entry.id), shape = body(e); return { ...entry, label: declared?.label ?? entry.id, owner: shape, box: shape ? box(shape) : null, actualShape: outlineKind(shape) } })
    const bind = (p: { x: number; y: number }) => { const candidates = observed.filter(node => node.box && distance(p, node.box) < 3); return candidates.length === 1 ? candidates[0]!.id : null }
    // Node bodies may intentionally cover only route ends. Inspect the actual
    // exposed interval between those bodies instead of discarding the route
    // merely because its mathematical endpoint lies underneath its owner.
    let routesAvailable = true
    const connections = [...svg.querySelectorAll('path,line,polyline')].filter(element => !element.closest('defs,marker,clipPath,mask')).flatMap(element => {
      const path = element as SVGGeometryElement, ends = endPoints(path), css = getComputedStyle(path), stroke = color(css.stroke)
      if (ends.length !== 2 || Math.hypot(ends[0]!.x - ends[1]!.x, ends[0]!.y - ends[1]!.y) < 1 || !stroke || Number(css.strokeOpacity) * stroke.alpha < 1 / 255 || Number.parseFloat(css.strokeWidth) < .25) return []
      const source = bind(ends[0]!), target = bind(ends[1]!)
      if (source && source === target) return []
      const exposed = sample(path, 256).filter(p => !observed.some(node => node.box && distance(p, node.box) < 1))
      if (!exposed.length) return []
      if (!source || !target || !exposed.every(p => inkAtPoint(path, p))) routesAvailable = false
      else { const key = [source, target].sort().join('\0'); themeHierarchyRoutes.set(key, themeHierarchyRoutes.has(key) ? null : path) }
      return [{ source, target }]
    })
    const canonical = (edge: any) => [edge.source, edge.target].sort().join('\0'), expectedEdges = hierarchy.filter(entry => entry.parent).map(entry => ({ source: entry.parent, target: entry.id })), available = hierarchy.length > 0 && routesAvailable && observed.every(entry => entry.box && (!entry.shape || ['circle', 'rectangle', 'rounded'].includes(entry.shape) && entry.actualShape)) && connections.every(edge => edge.source && edge.target)
    const valid = new Set(observed.map(entry => entry.owner)).size === hierarchy.length && same(expectedEdges.map(canonical).sort(), connections.map(canonical).sort()) && observed.every(entry => !entry.shape || entry.actualShape === entry.shape || entry.shape === 'rectangle' && entry.actualShape === 'rounded') && exactText(input.expected.labels)
    add('hierarchy', { nodes: observed.map(({ owner: _, ...entry }) => entry), connections }, available ? valid : null, 'The complete rooted hierarchy is reconstructed from independently owned bodies and exact actual connector endpoint pairs; requested primitive shapes are measured from their outlines. Radial sibling placement is not invented from DOM order; compound shapes and unbound connectors stay unknown.')
    const edgeContract = input.expected.edges ?? [], edgeProfile = edgeContract.every(edge => !edge.directed && !edge.label) && same(edgeContract.map(canonical).sort(), expectedEdges.map(canonical).sort())
    if (edgeContract.length) quantitative('painted-relationships', edgeContract, connections, available && edgeProfile ? valid : null, 'Complete mindmap relationship multiplicity comes from actual exposed strokes between uniquely owned node bodies. Endpoint portions may be covered only by their independently measured owner bodies; extra, missing, hidden or unbound routes cannot gain relationship credit.')
    for (const group of input.expected.groups ?? []) {
      const children = hierarchy.filter(entry => entry.parent === group.id).map(entry => entry.id)
      quantitative('painted-group:' + group.id, group, { id: group.id, members: children, representation: 'connector-owned hierarchy' }, available && same([...group.members].sort(), [...children].sort()) ? valid : null, 'Mindmap membership is the immediate rooted connector hierarchy, measured from owned bodies and exposed route inventory. An authored parent is not required to draw a separate enclosing container.')
    }
    add('tree-order', null, null, 'A radial mindmap drawing does not uniquely print a depth-first source traversal; exact hierarchy is observed independently, while source traversal remains a required unknown.')
  }
  if (input.family === 'ishikawa') {
    const hierarchy: any[] = facts['cause-hierarchy'] ?? [], lines = paths.filter(path => path.localName === 'line'), effect = hierarchy.find(entry => entry.kind === 'effect')
    const longest = [...lines].filter(line => box(line).height < 1).sort((a, b) => box(b).width - box(a).width)[0], lineEnds = lines.map(line => ({ line, ends: endPoints(line) }))
    const distanceToSegment = (p: { x: number; y: number }, ends: { x: number; y: number }[]) => { const [a, b] = ends as [{ x: number; y: number }, { x: number; y: number }], dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))); return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) }
    const bindings = hierarchy.filter(entry => entry.kind !== 'effect').map(entry => {
      const compact = (value: string) => norm(value).replace(/\s/g, ''), labels = text.filter(e => compact(e.textContent ?? '') === compact(entry.label)), e = labels.length === 1 ? labels[0] : undefined, b = e ? box(e) : null
      const ranked = b ? lineEnds.filter(item => item.line !== longest).flatMap(item => item.ends.map((p, end) => ({ ...item, end, point: p, distance: distance(p, b) }))).sort((a, b) => a.distance - b.distance) : []
      const binding = ranked[0] && ranked[0].distance <= Math.max(5, b!.height * .4) && (!ranked[1] || ranked[1].distance - ranked[0].distance > 1.5) ? ranked[0] : undefined
      return { ...entry, labelBox: b, binding }
    })
    let available = !!longest && !!effect && bindings.every(entry => entry.binding) && new Set(bindings.map(entry => entry.binding?.line)).size === bindings.length, valid = lines.length === hierarchy.length
    const observed = bindings.map(entry => { const far = entry.binding?.ends[1 - entry.binding.end], parentLine = entry.parent === effect?.id ? longest : bindings.find(parent => parent.id === entry.parent)?.binding?.line, parent = lineEnds.find(item => item.line === parentLine), attachment = far && parent ? distanceToSegment(far, parent.ends) : null; if (attachment !== null && attachment > 2) valid = false; if (attachment === null) available = false; return { id: entry.id, label: entry.label, parent: entry.parent, labelBox: entry.labelBox, branch: entry.binding?.ends ?? null, parentAttachmentDistance: attachment } })
    const effectLabel = effect ? text.find(e => norm(e.textContent ?? '').replace(/\s/g, '') === norm(effect.label).replace(/\s/g, '')) : undefined, effectShape = body(effectLabel)
    if (!effectShape || !longest || !endPoints(longest).some(p => distance(p, box(effectShape)) <= 2)) available = false
    add('cause-hierarchy', { effect: effectShape ? box(effectShape) : null, causes: observed }, available ? valid : null, 'Every cause owns a unique visible branch endpoint beside its label, and the other endpoint attaches to the measured parent branch or main spine within2px. Exact branch inventory and a separately owned effect head prevent label-only hierarchy credit. Ambiguous labels/endpoints remain unknown.')
    add('effect', effectShape ? { label: effect?.label, box: box(effectShape) } : null, available ? valid : null, 'The effect label owns the distinct head outline attached to the main spine; a matching cause label cannot supply the effect role.')
  }
  if (input.family === 'gitgraph') {
    const commits: any[] = facts.commits ?? [], branches: any[] = facts.branches ?? [], vertical = ['TB', 'BT'].includes(input.expected.advisoryFacts?.direction as string), reverse = input.expected.advisoryFacts?.direction === 'BT', axis = vertical ? 'y' : 'x', lane = vertical ? 'x' : 'y'
    const laneCenters = branches.map(branch => { const e = label(branch.id); return e ? center(box(e))[lane] : null }).filter((value): value is number => value !== null)
    const candidates = shapes.filter(shape => laneCenters.some(value => Math.abs(center(box(shape))[lane] - value) < 3) && ['circle', 'rect'].includes(shape.localName) && box(shape).width >= 8 && box(shape).width <= 32 && Math.abs(box(shape).width - box(shape).height) < 1)
    const glyphs = candidates.filter(shape => !candidates.some(other => other !== shape && Math.hypot(center(box(shape)).x - center(box(other)).x, center(box(shape)).y - center(box(other)).y) < 1 && box(other).width > box(shape).width + 1)).sort((a, b) => (reverse ? -1 : 1) * (center(box(a))[axis] - center(box(b))[axis]))
    const branchRows = branches.map(branch => { const e = label(branch.id), c = e ? center(box(e)) : null; return { ...branch, center: c } })
    let available = commits.length > 0 && glyphs.length === commits.length && branchRows.every(branch => branch.center), valid = true
    const observed = commits.map((commit, i) => {
      const glyph = glyphs[i], c = glyph ? center(box(glyph)) : null, branch = c ? branchRows.filter(branch => branch.center && Math.abs(branch.center[lane] - c[lane]) < 3) : []
      const authored = commit.authoredId ?? (!/^commit:\d+$/.test(commit.id) ? commit.id : null), e = authored ? label(authored) : undefined, nearLabel = e && c ? distance(c, box(e)) <= 55 : !authored
      if (!glyph || branch.length !== 1 || !nearLabel) available = false
      else if (commit.type === 'NORMAL' && branch[0]?.id === commit.branch) themeCommitOwners.set(commit.id, glyph)
      if (branch[0]?.id !== commit.branch) valid = false
      const nested = glyph ? candidates.filter(other => other !== glyph && Math.hypot(center(box(other)).x - c!.x, center(box(other)).y - c!.y) < 1 && box(other).width < box(glyph).width - 1) : []
      const type = glyph?.localName === 'rect' && nested.some(other => other.localName === 'rect') ? 'HIGHLIGHT' : glyph?.localName === 'circle' && !paths.some(path => { const b = box(path); return c && b.width < 18 && b.height < 18 && Math.hypot(center(b).x - c.x, center(b).y - c.y) < 1 }) ? 'NORMAL' : null
      if (!type || !['NORMAL', 'HIGHLIGHT'].includes(commit.type)) available = false
      if (type && type !== commit.type) valid = false
      const tags = (commit.tags ?? []).map((tag: string) => { const t = label(tag), b = t ? box(t) : null; return { label: tag, box: b, owned: !!b && !!c && distance(c, b) <= 45 } }); if (tags.some((tag: any) => !tag.owned)) valid = false
      return { id: commit.id, label: authored, branch: branch[0]?.id ?? null, center: c, type, tags }
    })
    const bind = (p: { x: number; y: number }) => { const ranked = observed.filter(item => item.center).map(item => ({ id: item.id, d: Math.hypot(item.center!.x - p.x, item.center!.y - p.y) })).sort((a, b) => a.d - b.d); return ranked[0] && ranked[0].d <= 14 && (!ranked[1] || ranked[1].d - ranked[0].d > 2) ? ranked[0].id : null }
    const routes = paths.filter(path => !filled(path) && path.localName === 'path' && endPoints(path).length === 2 && endPoints(path).every(p => bind(p))).map(path => { const ends = endPoints(path); const a = observed.findIndex(item => item.id === bind(ends[0]!)), b = observed.findIndex(item => item.id === bind(ends[1]!)); return { source: observed[Math.min(a, b)]?.id, target: observed[Math.max(a, b)]?.id } })
    const wanted = commits.flatMap(commit => commit.parents.map((parent: string) => ({ source: parent, target: commit.id }))), key = (edge: any) => edge.source + '\0' + edge.target
    if (routes.length !== wanted.length) available = false
    valid &&= same(routes.map(key).sort(), wanted.map(key).sort())
    add('commits', { commits: observed, parents: routes }, available ? valid : null, 'Actual commit glyphs establish physical chronology and lane ownership; authored labels/tags bind nearby glyphs, normal circles and nested highlight squares are measured, and exact connector endpoint pairs reconstruct all parents. Anonymous identities bind only chronological positions, never generated SVG IDs. Reverse/cherry-pick glyphs, ambiguous labels and alternate layouts stay unknown.')
    const heads = branchRows.map(branch => ({ id: branch.id, head: [...observed].reverse().find(commit => commit.branch === branch.id)?.id ?? null, expectedHead: branch.head }))
    add('branches', heads, available && heads.every(branch => branch.head) ? valid && heads.every(branch => branch.head === branch.expectedHead) : null, 'Every visible branch heading owns an actual commit lane and its latest physically ordered head; empty/unlabelled branches and unprinted branch order remain unknown.')
    add('git-operation-order', null, null, 'Individual checkout/branch commands are not uniquely printed by the resulting graph. Actual commit chronology, parents, lanes and heads are checked independently; operation history remains a required unknown.')
  }
  if (input.family === 'eventmodeling') {
    const frames: any[] = facts.frames ?? [], data: any[] = facts['data-definitions'] ?? [], config = facts['authored-config']?.themeVariables ?? {}
    const palette: Record<string, string> = { ui: config.emUiFill ?? 'white', processor: config.emProcessorFill ?? '#edb3f6', 'read-model': config.emReadModelFill ?? '#d3f1a2', command: config.emCommandFill ?? '#bcd6fe', event: config.emEventFill ?? '#ffb778' }
    const laneKind = (kind: string) => ['ui', 'processor'].includes(kind) ? 'UI/Automation' : ['command', 'read-model'].includes(kind) ? 'Command/Read Model' : 'Events'
    const observed = frames.map(frame => {
      const displayed = frame.label.split('.').at(-1)!, html = [...svg.querySelectorAll('foreignObject b')].filter(element => norm(element.textContent ?? '') === norm(displayed) && visible(element)), head = html.length === 1 ? html[0] : label(displayed), owner = body(head), b = owner ? box(owner) : null
      const content = owner ? [...svg.querySelectorAll('foreignObject')].filter(e => inside(box(owner), box(e))).map(e => norm((e.querySelector('div') as HTMLElement)?.innerText ?? e.textContent ?? '')) : []
      const colors = owner ? Object.entries(palette).filter(([, value]) => color(value)?.rgb === color(getComputedStyle(owner).fill)?.rgb).map(([kind]) => kind) : []
      const lanes = b ? rectangles.filter(rect => rect !== owner && inside(box(rect), b) && box(rect).width > b.width + 30).sort((a, b) => box(a).width * box(a).height - box(b).width * box(b).height) : []
      const lane = lanes[0], laneText = lane ? ownedText(lane).filter(e => !b || !inside(b, box(e))).filter(e => box(e).x < (b?.x ?? Infinity)) : []
      const reference = frame.dataReference ? data.find(item => item.id === frame.dataReference) : null, fields = frame.fields.length ? frame.fields : reference?.fields ?? []
      const wanted = norm([displayed, ...fields.map((field: any) => field.name + ': ' + field.value)].join(' ')), actual = norm(content.join(' '))
      return { id: frame.id, label: frame.label, box: b, owner, kind: colors.length === 1 ? colors[0] : null, actual, wanted, fields, lane: laneText.map(e => norm(e.textContent ?? '')), laneKey: lane ? geometryKey(lane) : null }
    })
    let available = frames.length > 0 && observed.every(frame => frame.owner && frame.kind && frame.laneKey), valid = ordered(observed.map(frame => frame.box && center(frame.box)), 'x')
    for (const item of observed) { const expected = frames.find(frame => frame.id === item.id); if (item.kind !== expected.kind || item.actual !== item.wanted) valid = false; const namespace = expected.label.includes('.') ? expected.label.split('.')[0] : null; if (!item.lane.some((value: string) => namespace ? value === ({ 'UI/Automation': 'UI/A: ', 'Command/Read Model': 'C/RM: ', Events: 'Stream: ' }[laneKind(expected.kind)] ?? '') + namespace || value === namespace : value === laneKind(expected.kind))) valid = false }
    const bind = (p: { x: number; y: number }) => { const candidates = observed.filter(frame => frame.box && distance(p, frame.box) <= 3); return candidates.length === 1 ? candidates[0]!.id : null }
    const routes = paths.filter(path => path.localName === 'path' && !filled(path) && endPoints(path).every(p => bind(p))).map(path => { const ends = endPoints(path), first = bind(ends[0]!), last = bind(ends[1]!); return { source: first, target: last } })
    const expectedRoutes = frames.flatMap((frame, index) => { if (frame.readsFrom.length) return frame.readsFrom.map((source: string) => ({ source, target: frame.id })); if (frame.resets) return []; const previous = observed.slice(0, index).reverse().find(item => item.laneKey !== observed[index]!.laneKey); return previous ? [{ source: previous.id, target: frame.id }] : [] }), routeKey = (route: any) => route.source + '\0' + route.target
    valid &&= same(routes.map(routeKey).sort(), expectedRoutes.map(routeKey).sort())
    const ownedBodies = uniqueShapes(rectangles.filter(rect => observed.some(frame => frame.box && box(rect).width < svg.getBoundingClientRect().width * .8 && Math.abs(box(rect).height - frame.box.height) < 2 && !observed.some(other => other.owner === rect && other.id !== frame.id))))
    if (ownedBodies.length !== frames.length) available = false
    add('frames', { frames: observed.map(({ owner: _, ...frame }) => frame), routes, expectedRelations: expectedRoutes }, available ? valid : null, 'Exact frame bodies, source order, complete owned inline/referenced data and measured lane membership. Type colors use the public pinned event vocabulary (or explicit source color overrides); other skins remain unknown. Reset frames suppress implicit predecessors and explicit reads bind actual endpoint-owned routes; no frame ID/class/native model is observed.')
    for (const key of ['frame-order', 'frame-content', 'data-definitions']) if (facts[key]) add(key, observed.map(({ owner: _, ...frame }) => frame), available && key === 'frame-order' ? valid && same(facts[key], observed.map(frame => frame.label.split('.').at(-1))) : null, 'Additional authored/source aliases require the same complete frame, data, order and relation projection; unresolved or unpainted data representations remain unknown.')
  }
  if (input.family === 'zenuml') {
    const participants = input.expected.nodes ?? [], events: any[] = facts['zenuml-event-order'] ?? [], participantBoxes = participants.map(participant => { const e = label(participant.label), shape = body(e); return { id: participant.id, label: participant.label, shape, box: shape ? box(shape) : null } })
    const heads = paths.filter(path => { const b = box(path); return path.localName === 'path' && b.width >= 3 && b.width <= 18 && b.height >= 3 && b.height <= 20 }), horizontal = paths.filter(path => path.localName === 'line' && box(path).height < 1 && box(path).width > 10)
    const bind = (x: number) => { const near = participantBoxes.filter(participant => participant.box && Math.abs(center(participant.box).x - x) <= 10); return near.length === 1 ? near[0]!.id : null }
    const routes = horizontal.map(route => { const ends = endPoints(route); return { route, ends, left: bind(Math.min(...ends.map(p => p.x))), right: bind(Math.max(...ends.map(p => p.x))) } }).filter(item => item.left && item.right && item.left !== item.right && participantBoxes.every(participant => !participant.box || item.ends[0]!.y > participant.box.y + participant.box.height)).sort((a, b) => a.ends[0]!.y - b.ends[0]!.y)
    const observed = routes.map(item => {
      const ends = item.ends, nearHeads = heads.filter(head => { const b = box(head); return ends.some(p => distance(p, b) < 4) && Math.abs(center(b).y - ends[0]!.y) < 3 }), head = nearHeads.length === 1 ? nearHeads[0] : undefined, points = head ? sample(head, 32) : [], terminal = head ? endPoints(head) : [], tipRight = head && terminal.length === 2 ? (terminal[0]!.x + terminal[1]!.x) / 2 < center(box(head)).x : null
      const side = head ? Math.abs(center(box(head)).x - Math.max(...ends.map(p => p.x))) < Math.abs(center(box(head)).x - Math.min(...ends.map(p => p.x))) ? 'right' : 'left' : null
      const labels = text.filter(e => { const b = box(e), c = center(b); return !/^\d+$/.test(norm(e.textContent ?? '')) && c.x > Math.min(...ends.map(p => p.x)) + 2 && c.x < Math.max(...ends.map(p => p.x)) - 2 && b.y + b.height >= ends[0]!.y - 20 && b.y + b.height <= ends[0]!.y + 2 })
      const caption = labels.length === 1 ? norm(labels[0]!.textContent ?? '') : null, css = getComputedStyle(item.route), dotted = css.strokeDasharray !== 'none' && css.strokeDasharray.split(/[ ,]+/).some(value => Number.parseFloat(value) > 0), headFilled = head ? filled(head) : null
      return { from: side === 'right' ? item.left : side === 'left' ? item.right : null, to: side === 'right' ? item.right : side === 'left' ? item.left : null, caption, y: ends[0]!.y, mode: dotted ? 'reply' : headFilled ? 'sync' : head ? 'async' : null, arrow: head ? { box: box(head), filled: headFilled, sampledPoints: points.length, tipRight } : null }
    })
    const eventText = (event: any) => event.kind === 'sync' ? (event.assignment ? event.assignment + ' = ' : '') + event.method + '(' + (event.arguments ?? '') + ')' : ['return', 'reply'].includes(event.kind) ? event.value ?? event.text ?? '' : event.text ?? null
    let available = participants.length > 0 && participantBoxes.every(participant => participant.box) && events.length === observed.length && observed.every(message => message.from && message.to && message.caption && message.mode) && events.every(event => ['sync', 'async', 'return', 'reply'].includes(event.kind) && event.from && event.to && !event.assignmentType && !event.assignment && (!event.scope?.length || !facts['control-regions']))
    const actualParticipants = [...participantBoxes].sort((a, b) => center(a.box!).x - center(b.box!).x).map(participant => participant.id), valid = same(actualParticipants, facts['participant-order']) && events.every((event, i) => { const actual = observed[i]!; return actual.from === event.from && actual.to === event.to && actual.caption === norm(eventText(event) ?? '') && actual.mode === (event.kind === 'return' ? 'reply' : event.kind) && actual.arrow?.tipRight === (center(participantBoxes.find(p => p.id === actual.to)!.box!).x > center(participantBoxes.find(p => p.id === actual.from)!.box!).x) }) && exactText([...sourceTitle, ...participants.map(p => p.label), ...events.map(event => eventText(event) ?? ''), ...(facts['zenuml-message-comments'] ?? []).map((entry: any) => entry.text)], text.filter(e => !/^\d+$/.test(norm(e.textContent ?? ''))))
    add('participant-order', participantBoxes.map(({ shape: _, ...participant }) => participant), participantBoxes.every(participant => participant.box) ? same(actualParticipants, facts['participant-order']) : null, 'Distinct actual participant header bodies establish left-to-right source order independently of SVG/generated IDs.')
    add('participant-kinds', null, facts['participant-kinds']?.length ? null : participantBoxes.every(participant => participant.box) ? participantBoxes.every(participant => outlineKind(participant.shape) === 'rectangle' || outlineKind(participant.shape) === 'rounded') : null, 'The qualified unannotated participant vocabulary uses ordinary measured boxes. Actor/database annotations require separately qualified iconic geometry and remain unknown.')
    add('zenuml-event-order', observed, available ? valid : null, 'Actual chronological message routes bind participant centerlines, uniquely owned captions, physical open/filled arrow glyphs and solid/dashed stroke. These reconstruct the complete simple sync/async/reply event inventory. Lifecycles, self-loops, control scope, typed assignments and other unqualified representations remain unknown.')
    if (facts['message-order']) add('message-order', observed.map(message => ({ from: message.from, to: message.to, text: message.caption })), available ? same(facts['message-order'], observed.map(message => ({ from: message.from, to: message.to, text: message.caption }))) : null, 'Every authored message alias independently agrees with the same actual chronological endpoint/caption projection.')
    if (facts['message-modes']) add('message-modes', observed.map(message => message.mode), available ? same(facts['message-modes'], observed.map(message => message.mode)) : null, 'Actual open/filled heads and dash paint establish each simple message mode; source/native mode strings supply no credit.')
    if (facts['zenuml-message-comments']) { const comments = facts['zenuml-message-comments'].map((comment: any) => { const e = label(comment.text), b = e ? box(e) : null, owner = observed[comment.event]; return { event: comment.event, text: comment.text, box: b, ownerY: owner?.y ?? null } }); add('zenuml-message-comments', comments, available && comments.every((comment: any) => comment.box && comment.ownerY !== null) ? comments.every((comment: any) => comment.box.y + comment.box.height <= comment.ownerY && (comment.event === 0 || comment.box.y > observed[comment.event - 1]!.y)) : null, 'Every separately painted message comment is owned by the chronological gap immediately before its event; matching text elsewhere cannot supply comment ownership.') }
  }
  if (input.family === 'radar') {
    const axes: any[] = facts.axes ?? [], curves: any[] = facts.curves ?? [], range: number[] = facts.range ?? []
    const straight = paths.filter(path => { const ends = endPoints(path); return ends.length === 2 && path.getTotalLength() > 20 && Math.abs(path.getTotalLength() - Math.hypot(ends[1]!.x - ends[0]!.x, ends[1]!.y - ends[0]!.y) / Math.hypot(path.getScreenCTM()?.a ?? 1, path.getScreenCTM()?.b ?? 0)) < 1 })
    const endpoints = straight.flatMap(endPoints), clusters = endpoints.map(seed => endpoints.filter(p => Math.hypot(p.x - seed.x, p.y - seed.y) < 1)).sort((a, b) => b.length - a.length), seed = (clusters[0]?.length ?? 0) >= 3 ? clusters[0]![0] : null
    const origin = seed ? { x: seed.x, y: seed.y } : null, spokes = origin ? straight.filter(path => endPoints(path).some(p => Math.hypot(p.x - origin.x, p.y - origin.y) < 1)) : [], tips = origin ? spokes.map(path => endPoints(path).sort((a, b) => Math.hypot(b.x - origin.x, b.y - origin.y) - Math.hypot(a.x - origin.x, a.y - origin.y))[0]!) : []; let radius = origin && tips.length ? Math.max(...tips.map(p => Math.hypot(p.x - origin.x, p.y - origin.y))) : NaN
    const ringCandidates = origin ? [...svg.querySelectorAll('circle,polygon,path')].filter(element => { if (!visible(element) || !['circle', 'polygon'].includes(element.localName) && !/[zZ]\s*$/.test(element.getAttribute('d') ?? '')) return false; const b = box(element), points = sample(element as SVGGeometryElement, 128), centroid = element.localName === 'circle' ? center(b) : { x: points.reduce((n, p) => n + p.x, 0) / points.length, y: points.reduce((n, p) => n + p.y, 0) / points.length }; return b.width > 20 && b.height > 20 && Math.hypot(centroid.x - origin.x, centroid.y - origin.y) < Math.max(2, b.width * .01) }) as SVGGeometryElement[] : []
    const gridGroups = [...new Set(ringCandidates.map(ring => color(getComputedStyle(ring).stroke)?.rgb))].map(ink => ({ ink, rings: ringCandidates.filter(ring => color(getComputedStyle(ring).stroke)?.rgb === ink) })).filter(group => group.ink && group.rings.length >= 2).sort((a, b) => b.rings.length - a.rings.length)
    const rings = gridGroups[0] && (!gridGroups[1] || gridGroups[0].rings.length > gridGroups[1].rings.length) ? gridGroups[0].rings : []
    if (origin && rings.length) radius = Math.max(...rings.flatMap(ring => sample(ring, 256).map(p => Math.hypot(p.x - origin.x, p.y - origin.y))))
    const spokeLengths = origin ? tips.map(p => Math.hypot(p.x - origin.x, p.y - origin.y)) : []
    if (radius > 0 && spokeLengths.length && spokeLengths.every(length => Math.abs(length - spokeLengths[0]!) < 1)) radarProfile = { axisScaleFactor: spokeLengths[0]! / radius }
    const axisOwners = axes.map(axis => { const e = label(axis.label), c = e ? center(box(e)) : null, ranked = c && origin ? tips.map((tip, i) => { const ux = tip.x - origin.x, uy = tip.y - origin.y, vx = c.x - origin.x, vy = c.y - origin.y; return { i, tip, d: Math.abs(ux * vy - uy * vx) / Math.max(1, Math.hypot(vx, vy)), forward: ux * vx + uy * vy > 0 } }).filter(item => item.forward).sort((a, b) => a.d - b.d) : [], selected = ranked[0] && ranked[0].d < 20 && (!ranked[1] || ranked[1].d - ranked[0].d > 2) ? ranked[0] : null; return { ...axis, center: c, tip: selected?.tip ?? null, spoke: selected ? spokes[selected.i] : null } })
    const prepared = !!origin && radius > 20 && rings.length >= 2 && spokes.length === axes.length && axes.length >= 3 && axisOwners.every(axis => axis.tip && axis.center && Math.hypot(axis.center.x - origin!.x, axis.center.y - origin!.y) > radius) && new Set(axisOwners.map(axis => axis.spoke)).size === axes.length
    const angles = prepared ? axisOwners.map(axis => (Math.atan2(axis.tip!.y - origin!.y, axis.tip!.x - origin!.x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) : [], orderedAxes = angles.every((angle, i) => !i || angle > angles[i - 1]! + .01)
    add('axes', { axes: axisOwners.map(({ spoke: _, ...axis }) => axis), center: origin, ringCount: rings.length, spokeCount: spokes.length, radius }, prepared ? orderedAxes : null, 'A common actual spoke intersection establishes the radar center; every source axis label owns one distinct radial spoke in clockwise order from the top. Circular and concentric polygon grids share this measured frame.')
    const gridShapes = rings.map(ring => ring.localName === 'circle' || outlineKind(ring) === 'circle' ? 'circle' : ring.localName === 'polygon' || /[zZ]\s*$/.test(ring.getAttribute('d') ?? '') ? 'polygon' : null)
    const closed = origin ? paths.filter(path => { const b = box(path); return !rings.includes(path) && (path.localName === 'polygon' || /[zZ]\s*$/.test(path.getAttribute('d') ?? '')) && b.width > 1 && b.height > 1 && b.x >= origin.x - radius - 2 && b.y >= origin.y - radius - 2 && b.x + b.width <= origin.x + radius + 2 && b.y + b.height <= origin.y + radius + 2 }) : []
    let available = prepared && range.length === 2 && range[1]! > range[0]! && curves.every(curve => curve.values.length === axes.length), valid = closed.length === curves.length && orderedAxes
    const used = new Set<Element>(), observations: any[] = []
    for (const curve of curves) {
      const ink = curve.label ? swatch(curve.label) : curves.length === 1 ? undefined : null, candidates = closed.filter(path => ink === undefined || color(getComputedStyle(path).fill)?.rgb === ink || color(getComputedStyle(path).stroke)?.rgb === ink), owner = ink !== null && candidates.length === 1 ? candidates[0] : null
      if (!owner || used.has(owner)) { available = false; continue }; used.add(owner)
      themeCurveOwners.set(curve.id, owner)
      const points = sample(owner, 4096)
      axes.forEach((axis, i) => { const tip = axisOwners[i]?.tip; if (!tip || !origin) { available = false; return }; const spokeLength = Math.hypot(tip.x - origin.x, tip.y - origin.y), ux = (tip.x - origin.x) / spokeLength, uy = (tip.y - origin.y) / spokeLength, distances: number[] = []
        for (let j = 1; j < points.length; j++) { const a = points[j - 1]!, b = points[j]!, ax = a.x - origin.x, ay = a.y - origin.y, dx = b.x - a.x, dy = b.y - a.y, denominator = dx * uy - dy * ux; if (Math.abs(denominator) < 1e-8) continue; const t = -(ax * uy - ay * ux) / denominator, projected = (ax + t * dx) * ux + (ay + t * dy) * uy; if (t >= 0 && t <= 1 && projected >= -.1 && projected <= radius + 2 && !distances.some(value => Math.abs(value - projected) < .5)) distances.push(projected) }
        const wanted = (curve.values[i] - range[0]!) / (range[1]! - range[0]!) * radius
        if (distances.length !== 1) available = false; else if (Math.abs(distances[0]! - wanted) > 3) valid = false
        observations.push({ curve: curve.id, label: curve.label, axis: axis.id, radialCoordinate: distances, expectedCoordinate: wanted })
      })
    }
    add('curves', observations, available ? valid : null, 'Exact complete curve inventory and visible legend/color ownership bind each curve to the actual circular or polygon-grid spoke frame. Physical ray intersections agree with source-scaled values within3px; unprinted numeric scale bounds remain separate unknown obligations.')
    if (typeof facts['show-legend'] === 'boolean') {
      const legend = curves.map(curve => { const e = curve.label ? label(curve.label) : undefined, ink = curve.label ? swatch(curve.label) : null; return { id: curve.id, label: curve.label, box: e ? box(e) : null, color: ink, owned: !!e && !!ink && themeCurveOwners.has(curve.id), inCanvas: !!e && inside(box(svg), box(e)) } })
      add('show-legend', legend, prepared && curves.length > 0 ? facts['show-legend'] ? legend.every(entry => entry.owned) ? legend.every(entry => entry.inCanvas) : null : legend.every(entry => !entry.box && !entry.color) : null, 'Legend visibility binds every complete printed curve name and adjacent color swatch to that actual curve, inside the canvas. Missing or unfamiliar legend ownership stays unknown; curve identifiers and renderer classes never stand in for a painted legend.')
    }
    if (facts.curves) quantitative('painted-radar-values', facts.curves, observations, available ? valid : null, 'Complete owned radar curve/ray intersections in the independently reconstructed grid frame.')
    add('graticule', gridShapes, prepared ? gridShapes.every(kind => kind === facts.graticule) : null, 'Every visible concentric grid outline must use the requested circular or polygon vocabulary; renderer classes provide no grid-kind credit.')
    if (facts.ticks) add('ticks', { count: rings.length }, prepared && /^\d+$/.test(String(facts.ticks)) ? rings.length === Number(facts.ticks) : null, 'An explicitly numeric tick-count request binds the exact independently measured radial ring inventory; other tick grammars remain unknown.')
    const numbers = text.filter(element => Number.isFinite(numeric(element.textContent ?? '')) && origin && Math.hypot(center(box(element)).x - origin.x, center(box(element)).y - origin.y) <= radius + 10).map(element => ({ value: numeric(element.textContent ?? ''), radius: origin ? Math.hypot(anchor(element).x - origin.x, anchor(element).y - origin.y) : NaN }))
    const low = numbers.find(item => Math.abs(item.value - range[0]!) < 1e-8 && item.radius < 10), high = numbers.find(item => Math.abs(item.value - range[1]!) < 1e-8 && Math.abs(item.radius - radius) < 10)
    add('range', { ticks: numbers, center: origin, outerRadius: radius }, prepared && low && high ? true : null, 'Only independently painted numeric min/max ticks at the center and outer ring attest an absolute radar range. Unlabelled rings cannot supply numeric bounds.')
  }
  if (input.family === 'xychart' && (facts['displayed-bar-values'] || facts['series-annotations'])) {
    const series: any[] = facts.series ?? [], prior = input.quantitative.find(check => check.criterion === 'source-fact:series'), geometry: any[] = Array.isArray(prior?.actual) ? prior.actual : [], used = new Set<Element>()
    const bars = (facts['displayed-bar-values'] ?? []).map((entry: any) => {
      const sourceSeries = series[entry.series], category = entry.category ?? facts['x-categories']?.[entry.index], candidates = geometry.filter(item => item.kind === 'bar' && item.category === category && (sourceSeries?.label === undefined || item.label === sourceSeries.label)), b: Box | null = candidates.length === 1 ? candidates[0].box : null
      const labels = b ? text.filter(element => { const c = center(box(element)), near = Math.abs(c.x - center(b).x) <= Math.max(3, b.width / 2) && c.y >= b.y - box(element).height * 2 && c.y <= b.y + b.height; return near && Number.isFinite(numeric(element.textContent ?? '')) && !facts['x-categories']?.includes(norm(element.textContent ?? '')) }) : []
      const element = labels.length === 1 ? labels[0] : undefined, printed = element ? numeric(element.textContent ?? '') : null, placement = b && element ? inside(b, box(element)) ? 'inside' : box(element).y + box(element).height <= b.y + 2 ? 'outside' : null : null, duplicate = element ? used.has(element) : false
      if (element) used.add(element)
      return { series: entry.series, index: entry.index, value: printed, placement, wanted: entry, body: b, owned: !!element && !duplicate }
    })
    const available = prior?.status === 'passed' && bars.every((entry: any) => entry.body) && bars.some((entry: any) => entry.owned)
    add('displayed-bar-values', bars, available ? bars.every((entry: any) => entry.owned && Math.abs(entry.value - entry.wanted.value) < 1e-8 && entry.placement === entry.wanted.placement) : null, 'Each printed numeric value uniquely owns its independently calibrated actual bar and requested inside/outside placement. Geometry selects the label before comparing numbers; borrowed values, duplicates and missing values among inspectable labels fail.')
    const annotations = (facts['series-annotations'] ?? []).flatMap((entry: any) => entry.labels.flatMap((value: string | null, index: number) => { if (value === null) return []; const category = facts['x-categories']?.[index], sourceSeries = series[entry.series], item = geometry.find(item => item.category === category && item.kind === sourceSeries?.kind && (sourceSeries?.label === undefined || item.label === sourceSeries.label)), p = item?.actual ?? (item?.box ? { x: center(item.box).x, y: item.box.y } : null), e = label(value); return [{ series: entry.series, index, label: value, point: p, labelBox: e ? box(e) : null, distance: e && p ? distance(p, box(e)) : null }] }))
    add('series-annotations', annotations, prior?.status === 'passed' && annotations.every((entry: any) => entry.point && entry.labelBox) ? annotations.every((entry: any) => entry.distance <= 24) : null, 'Every authored annotation owns a unique visible text block beside its independently measured series/category point; a matching label elsewhere supplies no annotation credit.')
  }
  if (input.family === 'quadrant' && facts['point-appearance']) {
    const definitions: any[] = facts['authored-style'] ?? [], observations = facts['point-appearance'].map((entry: any) => {
      const properties: Record<string, string> = {}
      for (const name of String(entry.classes).split(',')) for (const rule of definitions.filter(rule => rule.kind === 'classDef' && rule.selection === name)) for (const attribute of rule.attributes) properties[attribute.property] = attribute.value
      Object.assign(properties, entry.properties)
      const e = label(entry.label), c = e ? center(box(e)) : null, ranked = c ? [...svg.querySelectorAll('circle')].filter(visible).map(circle => ({ circle, d: distance(center(box(circle)), box(e!)) })).sort((a, b) => a.d - b.d) : [], owner = ranked[0] && (!ranked[1] || ranked[1].d - ranked[0].d > 2) ? ranked[0].circle : undefined
      const measured = Object.entries(properties).map(([property, value]) => { const css = owner ? getComputedStyle(owner) : null, matrix = owner?.getScreenCTM(), actual = property === 'radius' ? owner && matrix ? box(owner).width / 2 / Math.hypot(matrix.a, matrix.b) : null : property === 'color' ? css ? color(css.fill)?.rgb : null : property === 'stroke-color' ? css ? color(css.stroke)?.rgb : null : property === 'stroke-width' ? css ? Number.parseFloat(css.strokeWidth) : null : null, wanted = ['color', 'stroke-color'].includes(property) ? color(value)?.rgb : Number.parseFloat(value); return { property, expected: wanted, actual, available: actual !== null && actual !== undefined && wanted !== undefined && !Number.isNaN(wanted), passed: typeof wanted === 'number' ? typeof actual === 'number' && Math.abs(actual - wanted) < .1 : actual === wanted } })
      return { label: entry.label, body: owner ? box(owner) : null, properties: measured }
    })
    const available = observations.every((entry: any) => entry.body && entry.properties.every((p: any) => p.available)), passed = observations.every((entry: any) => entry.properties.every((p: any) => p.passed))
    add('point-appearance', observations, available ? passed : null, 'Source class definitions and inline point overrides compile independently to actual owned dot radius/fill/stroke/width. Physical geometry and computed paint establish output values; renderer class spelling is ignored, and unsupported properties remain unknown.')
    if (definitions.length) add('authored-style', observations, available && definitions.every(rule => rule.kind === 'classDef' && facts['point-appearance'].some((entry: any) => String(entry.classes).split(',').includes(rule.selection))) ? passed : null, 'Every source class definition must be exercised by a measured point-owned appearance projection; unused selectors or unsupported rule kinds remain required unknowns.')
  }
  if (facts['theme-paint']) {
    const policy = facts['theme-paint'], roles: any[] = Array.isArray(policy.roles) ? policy.roles : []
    const genericLabelsClear = input.paint.checks.some(check => check.criterion === 'unclipped-authored-labels' && check.status === 'passed') && input.paint.checks.some(check => check.criterion === 'visible-authored-labels' && check.status === 'passed')
    const measuredShape = (bounds: Box | undefined) => bounds ? [...svg.querySelectorAll('rect,circle,ellipse,path,polygon')].filter(e => !e.closest('defs,marker,clipPath,mask')).find(e => inside(bounds, box(e), .1) && inside(box(e), bounds, .1)) : undefined
    const nearestLabel = (owner: string, ordinal?: number, kind?: string) => {
      const matches = findText(owner).sort((a, b) => box(a).x - box(b).x || box(a).y - box(b).y)
      if (matches.length === 1) return matches[0]
      const occurrences = roles.filter(role => role.owner === owner && role.kind === kind).sort((a, b) => a.sourceOrdinal - b.sourceOrdinal)
      return ordinal !== undefined && occurrences.length === matches.length ? matches[occurrences.findIndex(role => role.sourceOrdinal === ordinal)] : undefined
    }
    const effective = (element: Element, property: 'fill' | 'stroke' | 'foreground') => {
      const leaves = property === 'foreground' && element.localName === 'foreignObject' ? [...element.querySelectorAll('*')].filter(e => norm(e.textContent ?? '') && ![...e.children].some(child => norm(child.textContent ?? ''))) : [element]
      const paints = leaves.map(leaf => {
        const css = getComputedStyle(leaf), value = color(property === 'foreground' ? leaf.namespaceURI === 'http://www.w3.org/1999/xhtml' ? css.color : css.fill : css[property]) ?? (property === 'fill' && css.fill === 'none' ? { rgb: '0,0,0', alpha: 0 } : null)
        if (!value) return null
        let opacity = value.alpha * Number(property === 'stroke' ? css.strokeOpacity : css.fillOpacity), brightness = 1, known = true
        for (let e: Element | null = leaf; e; e = e.parentElement) {
          const s = getComputedStyle(e); opacity *= Number(s.opacity)
          if (s.filter && s.filter !== 'none') { const match = /^brightness\(([-+.\d]+)(%?)\)$/.exec(s.filter); if (match) brightness *= Number(match[1]) / (match[2] ? 100 : 1); else if (!preservesSourceGraphic(s.filter)) known = false }
          if (s.clipPath && s.clipPath !== 'none' && !(property === 'foreground' && genericLabelsClear) || s.maskImage && s.maskImage !== 'none' || s.display === 'none' || ['hidden', 'collapse'].includes(s.visibility)) known = false
          if (e === svg) break
        }
        return { channels: value.rgb.split(',').map(Number).map(channel => Math.min(255, channel * brightness)), opacity, brightness, known }
      })
      return paints.length && paints.every(paint => paint && paint.known && same(paint.channels, paints[0]?.channels) && Math.abs(paint.opacity - paints[0]!.opacity) < 1e-8) ? paints[0] : null
    }
    const observations = roles.map(role => {
      let e: Element | undefined, owner: Element | undefined, route: any
      const declared = input.expected.nodes?.find(node => node.id === role.owner), measured: any = input.paint.nodes.find((node: any) => node.id === role.owner), heading = nearestLabel(declared?.label ?? role.owner, role.sourceOrdinal, role.kind) ?? (genericLabelsClear && measured?.box && declared ? [...svg.querySelectorAll('text,foreignObject')].find(e => norm(e.textContent ?? '') === norm(declared.label) && inside(measured.box, box(e))) : undefined)
      if (input.family === 'timeline' && ['period', 'event', 'section'].includes(role.kind)) { e = heading; owner = body(e) }
      if (input.family === 'treemap' && ['section', 'leaf'].includes(role.kind) && declared) { const section = (facts.hierarchy ?? []).some((entry: any) => entry.parent === role.owner); if (section === (role.kind === 'section')) { e = heading; owner = measuredShape(measured?.box) ?? body(e) } }
      if (input.family === 'gitgraph' && role.kind === 'branch' && (facts.branches ?? []).some((branch: any) => branch.id === role.owner)) { e = heading; owner = body(e) }
      if (input.family === 'gitgraph' && role.kind === 'commit') { owner = themeCommitOwners.get(role.owner); e = heading }
      if (input.family === 'mindmap' && role.kind === 'node' && declared) { e = heading; owner = measuredShape(measured?.box) ?? body(e) }
      if (input.family === 'mindmap' && role.kind === 'edge') { const key = String(role.owner).split('->').sort().join('\0'); owner = themeHierarchyRoutes.get(key) ?? undefined }
      if (input.family === 'radar' && role.kind === 'curve') { owner = themeCurveOwners.get(role.owner); const curve = (facts.curves ?? []).find((curve: any) => curve.id === role.owner); e = curve?.label ? nearestLabel(curve.label) : undefined }
      if (input.family === 'usecase' && ['actor', 'usecase'].includes(role.kind) && declared) {
        e = heading
        owner = measuredShape(measured?.box) ?? body(e)
      }
      if (input.family === 'usecase' && role.kind === 'boundary') {
        const group = input.expected.groups?.find(group => group.id === role.owner), measured = input.paint.groups?.find(group => group.id === role.owner)
        e = group ? nearestLabel(group.label) : undefined
        if (measured) owner = rectangles.filter(rect => inside(measured.box, box(rect)) && inside(box(rect), measured.box))[0]
      }
      if (input.family === 'usecase' && ['include', 'extend'].includes(role.kind)) {
        const [source, target] = String(role.owner).split('->'), matches = input.paint.connections.filter((edge: any) => edge.source === source && edge.target === target)
        if (matches.length === 1) route = matches[0]
      }
      const properties = Object.entries(role).filter(([key]) => ['fill', 'stroke', 'foreground', 'fillOpacity', 'strokeOpacity', 'strokeWidth', 'brightness'].includes(key)).map(([property, wanted]) => {
        const paintProperty = property === 'foreground' ? 'foreground' : property.startsWith('stroke') ? 'stroke' : 'fill', target = property === 'foreground' ? e : owner, paint = target ? effective(target, paintProperty) : null
        let actual: unknown = paint
        let passed: boolean | null = null
        if (['fill', 'stroke', 'foreground'].includes(property)) {
          const value = color(String(wanted)), actualChannels = paint?.channels ?? (route && property === 'stroke' ? color(route.stroke)?.rgb.split(',').map(Number) : undefined), factor = Number(role.brightness ?? 1), expectedChannels = value?.rgb.split(',').map(Number).map(channel => Math.min(255, channel * factor))
          actual = actualChannels ?? null
          if (actualChannels && expectedChannels) { const expectedOpacity = value!.alpha * Number(property === 'fill' ? role.fillOpacity ?? 1 : property === 'stroke' ? role.strokeOpacity ?? 1 : 1); passed = (expectedOpacity === 0 && paint ? paint.opacity === 0 : actualChannels.every((channel: number, i: number) => Math.abs(channel - expectedChannels[i]!) <= 1.01)) && (!paint || Math.abs(paint.opacity - expectedOpacity) < 1 / 255) }
        } else if (property === 'brightness') {
          // The observable contract is the resulting paint, so a renderer may
          // precompute brighter colors instead of retaining a CSS filter.
          const foreground = e ? effective(e, 'foreground') : null, fillExpected = color(String(role.fill ?? 'none')), foreExpected = color(String(role.foreground ?? 'none')), factor = Number(wanted)
          actual = { fill: paint?.channels ?? null, foreground: foreground?.channels ?? null }
          if (paint && foreground && fillExpected && foreExpected) passed = [ [paint.channels, fillExpected.rgb.split(',').map(Number)], [foreground.channels, foreExpected.rgb.split(',').map(Number)] ].every(([channels, original]) => channels!.every((channel, i) => Math.abs(channel - Math.min(255, original![i]! * factor)) <= 1.01))
        }
        else if (property === 'strokeWidth') { actual = owner ? Number.parseFloat(getComputedStyle(owner).strokeWidth) : route?.strokeWidth ?? null; if (typeof actual === 'number') passed = Math.abs(actual - Number(wanted)) < .1 }
        else { actual = paint?.opacity ?? null; if (paint) passed = Math.abs(paint.opacity - Number(wanted)) < 1 / 255 }
        return { property, expected: wanted, actual, passed }
      })
      return { kind: role.kind, owner: role.owner, body: owner ? box(owner) : route?.box ?? null, label: e ? box(e) : null, properties }
    })
    const properties = observations.flatMap(role => role.properties), available = policy.family === input.family && roles.length > 0 && properties.length > 0 && properties.every(property => property.passed !== null), valid = properties.every(property => property.passed === true)
    add('theme-paint', observations, properties.some(property => property.passed === false) ? false : available ? valid : null, 'An independently transcribed source policy supplies only concrete owned fill/stroke/foreground/alpha/width/brightness roles. Actual node, period, event, hierarchy and branch ownership selects measured ink before color comparison, allowing one RGB channel unit of serialization quantization. Theme identifiers, generated classes and renderer model echoes supply no credit; unbound or unsupported roles stay unknown.')
  }
  let pieProfile: any = null
  if (input.family === 'pie' && facts['authored-config']) {
    const slices: any[] = facts.slices ?? [], outline = [...svg.querySelectorAll('circle')].filter(element => visible(element) && !filled(element) && Number.parseFloat(getComputedStyle(element).strokeWidth) > 0).sort((a, b) => box(b).width - box(a).width)[0]
    const centerPoint = outline ? center(box(outline)) : null, outlineMatrix = outline?.getScreenCTM(), scale = outlineMatrix ? Math.hypot(outlineMatrix.a, outlineMatrix.b) : NaN, borderWidth = outline ? Number.parseFloat(getComputedStyle(outline).strokeWidth) : NaN, radius = outline ? box(outline).width / 2 - borderWidth * scale / 2 : NaN
    const arcs = shapes.filter(shape => shape.localName === 'path' && /[aA]/.test(shape.getAttribute('d') ?? ''))
    const observations = slices.map(slice => {
      const legend = text.filter(element => norm(element.textContent ?? '').replace(/\s*\[[-+\d.e,]+\]$/, '') === norm(slice.label)), item = legend.length === 1 ? legend[0] : undefined, lb = item ? box(item) : null, swatches = lb ? rectangles.filter(rect => { const b = box(rect); return b.width <= 40 && b.height <= 40 && b.x + b.width <= lb.x + 2 && lb.x - b.x - b.width < 30 && Math.abs(center(b).y - center(lb).y) < Math.max(b.height, lb.height) }).sort((a, b) => box(b).x - box(a).x) : [], ink = swatches[0] ? color(getComputedStyle(swatches[0]).fill)?.rgb : null, owners = arcs.filter(arc => color(getComputedStyle(arc).fill)?.rgb === ink), owner = owners.length === 1 ? owners[0] : null
      const ownCenter = owner ? point(owner, 0, 0) : null, samples = owner ? sample(owner, 2048) : [], radii = ownCenter ? samples.map(p => Math.hypot(p.x - ownCenter.x, p.y - ownCenter.y)) : [], outer = radii.length ? Math.max(...radii) : null, inner = radii.length ? Math.min(...radii) : null
      const labels = owner ? text.filter(element => /%$/.test(norm(element.textContent ?? '')) && (() => { const p = anchor(element), matrix = owner.getScreenCTM(); return !!matrix && owner.isPointInFill(new DOMPoint(p.x, p.y).matrixTransform(matrix.inverse())) })()) : [], percent = labels.length === 1 ? labels[0] : null, at = percent ? anchor(percent) : null
      return { label: slice.label, owner, center: ownCenter ? { x: ownCenter.x, y: ownCenter.y } : null, inner, outer, hole: inner !== null && outer ? inner / outer : null, textPosition: at && centerPoint && radius ? Math.hypot(at.x - centerPoint.x, at.y - centerPoint.y) / radius : null, scale: outer !== null && radius ? outer / radius : null, opacity: owner ? Number(getComputedStyle(owner).opacity) : null }
    })
    pieProfile = { center: centerPoint, radius, outlineWidth: borderWidth, observations: observations.map(({ owner: _, ...item }) => item), ready: !!outline && radius > 10 && arcs.length === slices.length && observations.every(item => item.owner && item.center && centerPoint && Math.hypot(item.center.x - centerPoint.x, item.center.y - centerPoint.y) < 1 && item.hole !== null) }
  }
  if (facts['authored-config']) {
    const config = facts['authored-config'], observations: { path: string; expected: unknown; actual: unknown; passed: boolean | null }[] = []
    const record = (path: string, expected: unknown, actual: unknown, passed: boolean | null) => observations.push({ path, expected, actual, passed })
    const leaves = (value: any, path = ''): [string, any][] => value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value).flatMap(([key, item]) => leaves(item, path ? path + '.' + key : key)) : [[path, value]]
    const equalColor = (actual: string | undefined, expected: string) => actual === undefined ? null : color(actual)?.rgb === color(expected.startsWith('#') || !/^[\da-f]{6}$/i.test(expected) ? expected : '#' + expected)?.rgb
    for (const [path, wanted] of leaves(config)) {
      let actual: unknown = null, passed: boolean | null = null
      if (input.family === 'radar' && path === 'radar.axisScaleFactor' && radarProfile) { actual = radarProfile.axisScaleFactor; passed = Math.abs(radarProfile.axisScaleFactor - Number(wanted)) < .005 }
      if (input.family === 'packet' && path.startsWith('packet.')) {
        const result = checks.find(check => check.criterion === 'source-fact:fields'), printed = text.filter(element => /^\d+$/.test(norm(element.textContent ?? '')))
        if (path === 'packet.showBits') { actual = printed.length > 0; passed = actual === wanted }
        if (['packet.bitsPerRow', 'packet.bitOrder'].includes(path) && result?.status === 'passed') { actual = result.actual; passed = true }
      }
      if (input.family === 'sankey') {
        const nodes = input.expected.nodes ?? [], owned = nodes.map(node => { const e = label(node.label), measured = (input.paint.nodes as any[]).find(item => item.id === node.id), candidates = measured?.box ? rectangles.filter(rect => Math.abs(box(rect).x - measured.box.x) < 1 && Math.abs(box(rect).y - measured.box.y) < 1 && Math.abs(box(rect).width - measured.box.width) < 1 && Math.abs(box(rect).height - measured.box.height) < 1) : e ? rectangles.filter(rect => { const b = box(rect), t = box(e), gap = Math.min(Math.abs(b.x - t.x - t.width), Math.abs(t.x - b.x - b.width)); return b.width <= 40 && b.height > 2 && gap < 20 && Math.abs(center(b).y - center(t).y) <= Math.max(t.height * 2, b.height / 2) }).sort((a, b) => Math.abs(center(box(a)).y - center(box(e)).y) - Math.abs(center(box(b)).y - center(box(e)).y)) : []; return { id: node.id, shape: candidates.length === 1 ? candidates[0] : body(e) } }), boxes = owned.filter(node => node.shape).map(node => ({ id: node.id, b: box(node.shape!), shape: node.shape! }))
        if (path === 'sankey.nodeWidth') { actual = boxes.map(node => { const matrix = node.shape.getScreenCTM(); return matrix ? node.b.width / Math.hypot(matrix.a, matrix.b) : null }); passed = boxes.length === nodes.length && boxes.length > 0 ? (actual as (number | null)[]).every(value => value !== null && Math.abs(value - Number(wanted)) < .1) : null }
        if (path === 'sankey.nodePadding') { const gaps = boxes.flatMap((a, i) => boxes.slice(i + 1).filter(b => Math.abs(a.b.x - b.b.x) < 2).map(b => { const matrix = a.shape.getScreenCTM(); return matrix ? Math.max(b.b.y - a.b.y - a.b.height, a.b.y - b.b.y - b.b.height) / Math.hypot(matrix.c, matrix.d) : NaN })); actual = gaps; passed = gaps.length ? Math.min(...gaps) >= Number(wanted) - .5 : null }
        if (path.startsWith('sankey.nodeColors.')) { const id = path.slice('sankey.nodeColors.'.length), node = boxes.find(node => node.id === id); actual = node ? getComputedStyle(node.shape).fill : null; passed = node ? equalColor(String(actual), String(wanted)) : null }
      }
      if (input.family === 'treeview') {
        const nodes = (facts.hierarchy ?? []).map((entry: any) => { const declared = input.expected.nodes?.find(node => node.id === entry.id), e = label(declared?.label ?? entry.id.split('/').at(-1)); return { entry, e } }).filter((item: any) => item.e)
        if (['themeVariables.treeView.labelColor', 'themeVariables.treeView.labelFontSize'].includes(path)) { actual = nodes.map((item: any) => path.endsWith('labelColor') ? getComputedStyle(item.e).fill : Number.parseFloat(getComputedStyle(item.e).fontSize)); passed = nodes.length === facts.hierarchy?.length ? (actual as any[]).every(value => path.endsWith('labelColor') ? equalColor(value, String(wanted)) : Math.abs(value - Number.parseFloat(wanted)) < .1) : null }
        const lines = paths.filter(path => path.localName === 'line')
        if (['treeView.lineThickness', 'themeVariables.treeView.lineColor'].includes(path)) { actual = lines.map(line => path.endsWith('lineColor') ? getComputedStyle(line).stroke : Number.parseFloat(getComputedStyle(line).strokeWidth)); passed = lines.length ? (actual as any[]).every(value => path.endsWith('lineColor') ? equalColor(value, String(wanted)) : Math.abs(value - Number(wanted)) < .1) : null }
        if (path === 'treeView.rowIndent') { const fact = checks.find(check => check.criterion === 'source-fact:hierarchy'), matrix = svg.getScreenCTM(); actual = matrix && (fact?.actual as any)?.measuredIndent ? (fact!.actual as any).measuredIndent / Math.hypot(matrix.a, matrix.b) - Number(config.treeView?.paddingX ?? 5) : null; passed = typeof actual === 'number' ? Math.abs(actual - Number(wanted)) < .1 : null }
      }
      if (input.family === 'xychart' && ['xyChart.showDataLabel', 'xyChart.showDataLabelOutsideBar'].includes(path)) { const check = checks.find(check => check.criterion === 'source-fact:displayed-bar-values'); actual = check?.actual ?? null; passed = check?.status === 'passed' ? true : check?.status === 'failed' ? false : null }
      if (input.family === 'quadrant' && ['quadrantChart.chartWidth', 'quadrantChart.chartHeight'].includes(path)) { const regionBoxes = rectangles.map(box).filter(b => rectangles.filter(other => Math.abs(box(other).width - b.width) < 2 && Math.abs(box(other).height - b.height) < 2).length === 4), matrix = svg.getScreenCTM(); actual = regionBoxes.length === 4 && matrix ? path.endsWith('Width') ? (Math.max(...regionBoxes.map(b => b.x + b.width)) - Math.min(...regionBoxes.map(b => b.x))) / Math.hypot(matrix.a, matrix.b) : (Math.max(...regionBoxes.map(b => b.y + b.height)) - Math.min(...regionBoxes.map(b => b.y))) / Math.hypot(matrix.c, matrix.d) : null; passed = typeof actual === 'number' ? Math.abs(actual - Number(wanted)) < 1 : null }
      if (input.family === 'pie' && pieProfile?.ready) {
        if (path === 'pie.donutHole') { actual = pieProfile.observations.map((item: any) => item.hole); passed = (actual as number[]).every(value => Math.abs(value - Number(wanted)) < .008) }
        if (path === 'pie.textPosition') { actual = pieProfile.observations.map((item: any) => item.textPosition); passed = (actual as (number | null)[]).every(value => value !== null) ? (actual as number[]).every(value => Math.abs(value - Number(wanted)) < .025) : null }
        if (path === 'themeVariables.pieOuterStrokeWidth') { actual = pieProfile.outlineWidth; passed = Math.abs(Number(actual) - Number.parseFloat(String(wanted))) < .1 }
        if (path === 'pie.highlightSlice' && wanted !== 'hover') { actual = pieProfile.observations.map((item: any) => ({ label: item.label, scale: item.scale, opacity: item.opacity })); const known = (actual as any[]).every(item => (Math.abs(item.scale - 1) < .008 || Math.abs(item.scale - 1.05) < .008) && (Math.abs(item.opacity - .7) < .01 || Math.abs(item.opacity - 1) < .01)); passed = known ? (actual as any[]).every(item => item.label === wanted ? Math.abs(item.scale - 1.05) < .008 && Math.abs(item.opacity - 1) < .01 : Math.abs(item.scale - 1) < .008 && Math.abs(item.opacity - .7) < .01) : null }
      }
      record(path, wanted, actual, passed)
    }
    const decisiveFailure = observations.some(entry => entry.passed === false), complete = observations.length > 0 && observations.every(entry => entry.passed !== null)
    add('authored-config', observations, decisiveFailure ? false : complete ? true : null, 'Each authored configuration leaf retains its own independently measured visible projection. Supported owned geometry, printed values and explicit colors are checked directly; theme names, layout engines, invisible settings, unknown asset identities and other unprojected properties remain required unknowns. A visible contrary leaf cannot be hidden by unsupported siblings.')
  }
  return checks
}
