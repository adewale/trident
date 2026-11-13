import type { MeaningExpectation } from './meaning.ts'
import type { PaintCheck, PaintEvidence } from './paint.ts'

/** Browser-serializable source fact checks. Geometry and visible labels establish
 * ownership; renderer IDs/classes and source/model metadata supply no facts. */
export function inspectDomainFacts(input: { family: string; source: string; expected: MeaningExpectation; paint: PaintEvidence; quantitative: PaintCheck[] }): PaintCheck[] {
  if (!['requirement', 'timeline', 'packet', 'kanban', 'journey', 'gantt', 'treeview', 'treemap', 'venn', 'cynefin', 'wardley', 'mindmap', 'ishikawa', 'gitgraph', 'eventmodeling', 'zenuml', 'radar', 'xychart', 'quadrant', 'pie', 'sankey', 'usecase'].includes(input.family) && !input.family.startsWith('railroad')) return []
  const svg = document.querySelector('svg'), facts: any = input.expected.facts ?? {}, checks: PaintCheck[] = []
  if (!svg || input.paint.labelRepresentation === 'uninspectable' && !['requirement','zenuml'].includes(input.family) && !input.family.startsWith('railroad')) return checks
  // A fully inspectable typed requirement row may supply a negative even when
  // another expected label has an uninspectable alternative representation.
  // That global uncertainty can never be upgraded to a positive full claim.
  let uncertain = input.paint.labelRepresentation === 'uninspectable' && !['zenuml'].includes(input.family) && !input.family.startsWith('railroad')
  const add = (key: string, actual: unknown, passed: boolean | null, scope: string) => { if (Object.hasOwn(facts, key)) checks.push({ criterion: 'source-fact:' + key, expected: facts[key], actual, status: passed === null || passed && uncertain ? 'unavailable' : passed ? 'passed' : 'failed', scope }) }
  const quantitative = (criterion: string, expected: unknown, actual: unknown, passed: boolean | null, scope: string) => checks.push({ criterion, expected, actual, status: passed === null || passed && uncertain ? 'unavailable' : passed ? 'passed' : 'failed', scope })
  const norm = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
  const textValue = (element: Element): string => {
    if (element.namespaceURI !== 'http://www.w3.org/2000/svg') return (element as HTMLElement).innerText ?? element.textContent ?? ''
    let result = '', previous: DOMRect | undefined
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) { result += child.textContent ?? ''; const range = document.createRange(); range.selectNodeContents(child); const bounds = range.getBoundingClientRect(); if (bounds.width && bounds.height) previous = bounds; continue }
      if (!(child instanceof Element)) continue
      const bounds = child.getBoundingClientRect()
      if (previous && Math.abs(bounds.y - previous.y) > Math.max(1, Math.min(bounds.height, previous.height) * .4)) result += ' '
      result += textValue(child); previous = bounds
    }
    return result
  }
  const canvas = document.createElement('canvas').getContext('2d')!
  const color = (value: string) => { if (value === 'none' || value === 'transparent') return null; if (/url\(|var\(|context-|currentcolor/i.test(value) || !CSS.supports('color', value)) { uncertain = true; return null }; canvas.clearRect(0, 0, 1, 1); canvas.fillStyle = value; canvas.fillRect(0, 0, 1, 1); const rgba = canvas.getImageData(0, 0, 1, 1).data; return rgba[3] ? { rgb: [...rgba].slice(0, 3).join(','), alpha: rgba[3]! / 255 } : null }
  const visiblePaint = (value: string): { rgb: string | null; alpha: number } | null => {
    if(input.family==='sankey'&&/url\(/.test(value)&&input.paint.checks.some(check=>check.criterion==='paint-opacity-and-color'&&check.status==='passed')){
      const id=/#([^\s)"']+)/.exec(value)?.[1],gradient=id?document.getElementById(decodeURIComponent(id)):null,stops=gradient&&svg.contains(gradient)&&gradient.localName==='linearGradient'&&!gradient.hasAttribute('href')&&!gradient.hasAttributeNS('http://www.w3.org/1999/xlink','href')?[...gradient.children].filter(e=>e.localName==='stop'):[],alphas=stops.map(stop=>{const css=getComputedStyle(stop),ink=color(css.stopColor);return ink?ink.alpha*Number(css.stopOpacity):0})
      if(alphas.length&&alphas.every(alpha=>alpha>=1/255))return{rgb:null,alpha:Math.min(...alphas)}
    }
    return color(value)
  }
  const textClip = (element: Element, owner: Element, setting: string) => {
    if(!['text','foreignObject'].includes(element.localName)&&element.namespaceURI!=='http://www.w3.org/1999/xhtml')return false
    const id=/#([^\s)"']+)/.exec(setting)?.[1],clip=id?document.getElementById(decodeURIComponent(id)):null,children=clip?[...clip.children]:[],shape=children.length===1&&['rect','circle','ellipse'].includes(children[0]!.localName)?children[0] as SVGGeometryElement:null,matrix=(owner as SVGGraphicsElement).getScreenCTM?.()
    if(!shape||!matrix||clip?.getAttribute('clipPathUnits')==='objectBoundingBox'||shape.hasAttribute('transform')||clip?.hasAttribute('transform'))return false
    const css=getComputedStyle(shape);if(css.display==='none'||css.visibility!=='visible'||css.clipPath!=='none'||css.maskImage!=='none'||css.filter!=='none')return false
    const b=element.getBoundingClientRect();return [[b.x,b.y],[b.right,b.y],[b.x,b.bottom],[b.right,b.bottom]].every(([x,y])=>shape.isPointInFill(new DOMPoint(x,y).matrixTransform(matrix.inverse())))
  }
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
      if (style.clipPath && style.clipPath !== 'none' && !textClip(element, owner, style.clipPath) || style.maskImage && style.maskImage !== 'none' || style.filter && style.filter !== 'none' && !preservesSourceGraphic(style.filter)) localUncertain = true
      effectiveOpacity *= Number(style.opacity)
      if (owner === svg) break
    }
    const bounds = element.getBoundingClientRect()
    // Intrinsic/image-instance paint cannot be projected as a transparent box.
    // Its later overlapping extent withholds this carrier's fact credit; the
    // generic observer's separate unknown cannot justify a local positive.
    for (const cover of svg.querySelectorAll('image,use')) {
      if (cover === element || cover.contains(element) || element.contains(cover) || cover.closest('defs,marker,clipPath,mask') || !(element.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING)) continue
      const b = cover.getBoundingClientRect()
      if (b.width <= 0 || b.height <= 0 || b.x >= bounds.right || b.right <= bounds.x || b.y >= bounds.bottom || b.bottom <= bounds.y) continue
      let opacity = 1, shown = true
      for (let owner: Element | null = cover; owner; owner = owner.parentElement) { const css = getComputedStyle(owner); opacity *= Number(css.opacity); if (css.display === 'none' || ['hidden','collapse'].includes(css.visibility)) shown = false; if (owner === svg) break }
      if (shown && opacity > 0) localUncertain = true
    }
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
    const style = getComputedStyle(element), fill = element.localName === 'line' ? null : foreignInk ?? color(element.namespaceURI === 'http://www.w3.org/1999/xhtml' ? style.color : style.fill), stroke = visiblePaint(style.stroke)
    const paints = [fill && fill.alpha * Number(style.fillOpacity) * effectiveOpacity > 0 ? { ...fill, effectiveAlpha: fill.alpha * Number(style.fillOpacity) * effectiveOpacity } : null, stroke && stroke.alpha * Number(style.strokeOpacity) * effectiveOpacity > 0 && Number.parseFloat(style.strokeWidth) > 0 ? { ...stroke, effectiveAlpha: stroke.alpha * Number(style.strokeOpacity) * effectiveOpacity } : null].filter((paint): paint is { rgb: string | null; alpha: number; effectiveAlpha: number } => !!paint)
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
  const label = (value: string) => { const found = text.filter(element => norm(textValue(element)) === norm(value)); return found.length === 1 ? found[0] : undefined }
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
  const exactText = (wanted: string[], actual: Element[] = text) => same(wanted.map(norm).sort(), actual.map(element => norm(textValue(element))).sort())
  const findText = (value: string) => text.filter(element => norm(textValue(element)) === norm(value))
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
  const gitConfig = new Map<string, { actual: unknown; passed: boolean | null }>()
  const themeCurveOwners = new Map<string, SVGGeometryElement>()
  const themeHierarchyRoutes = new Map<string, SVGGeometryElement | null>()
  let radarProfile: { axisScaleFactor: number } | null = null
  let radarTensionProfile: { profile: string; expected: number; curves: any[]; passed: boolean | null } | null = null
  if (input.family === 'requirement') {
    const definitions: any[] = facts.definitions ?? [], aliases = new Map([['verifymethod', 'Verification'], ['docref', 'Doc. Ref.'], ['id', 'ID'], ['text', 'Text'], ['risk', 'Risk'], ['type', 'Type']])
    const kinds: Record<string, string> = { requirement: 'Requirement', functionalrequirement: 'Functional Requirement', interfacerequirement: 'Interface Requirement', performancerequirement: 'Performance Requirement', physicalrequirement: 'Physical Requirement', designconstraint: 'Design Constraint', element: 'Element' }
    const canonicalRow = (value: string) => { value = norm(value).replaceAll('«', '<<').replaceAll('»', '>>'); if (/^<<.*>>$/.test(value)) return value.toLowerCase().replace(/\s/g, ''); const row = /^([^:]+):\s*(.*)$/.exec(value); if (!row) return value; const names: Record<string, string> = { id: 'id', text: 'text', risk: 'risk', verification: 'verifymethod', verifymethod: 'verifymethod', type: 'type', 'doc. ref.': 'docref', 'doc ref': 'docref', docref: 'docref' }, heading = names[row[1]!.toLowerCase()]; return heading ? heading + ': ' + (['risk', 'verifymethod'].includes(heading) ? row[2]!.toLowerCase() : row[2]) : value }
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
    const periods: any[] = facts.periods ?? [], sections: string[] = facts.sections ?? [], vertical = /^\s*timeline\s+TD\b/m.test(input.source)
    const headers = periods.map(period => { const header = label(period.period ?? period.label), owner = body(header); return owner ? box(owner) : null })
    const observations = periods.map((period, index) => {
      const region = headers[index] ?? null, next = headers[index + 1]
      const events = (period.events ?? []).map((value: string) => { const found = findText(value).filter(e => {
        const b = box(e), c = center(b)
        return region && (vertical ? b.x > region.x + region.width && b.y >= region.y - 2 && (!next || b.y + b.height < next.y + 2) : c.x >= region.x && c.x <= region.x + region.width && b.y > region.y + region.height)
      }); return { label: value, box: found.length === 1 ? box(found[0]!) : null } })
      return { label: period.period ?? period.label, section: period.section ?? '', box: region, events }
    })
    const available = observations.length > 0 && observations.every(p => p.box) && periods.every(period => [period.period ?? period.label, ...(period.events ?? [])].every((value: string) => findText(value).length > 0))
    let valid = ordered(observations.map(p => p.box && center(p.box)), vertical ? 'y' : 'x') && observations.every(p => ordered(p.events.map((e: any) => e.box && center(e.box)), 'y'))
    const headings = sections.map(section => { const e = label(section), b = body(e); return { section, box: b ? box(b) : e ? box(e) : null } })
    const sectionOwned = !sections.length || headings.every((section, index) => section.box && observations.filter(p => p.section === section.section).every(p => p.box && (vertical ? p.box.y >= section.box!.y + section.box!.height - 2 && (!headings[index + 1]?.box || p.box.y < headings[index + 1]!.box!.y) : center(p.box).x >= section.box!.x - 2 && center(p.box).x <= section.box!.x + section.box!.width + 2 && p.box.y > section.box!.y)))
    const wanted = [...sourceTitle, ...sections, ...periods.flatMap(period => [period.period ?? period.label, ...(period.events ?? [])])]
    valid &&= exactText(wanted) && sectionOwned
    add('periods', observations, available ? valid : null, 'Complete exact period/event text inventory, including measured multiline glyph rows. Each event lies in its measured period column below its body, or in its right-hand bounded row band for authored TD; period and event order are independently geometric. Sections own the corresponding complete span.')
    add('sections', headings, available ? sectionOwned && ordered(headings.map(h => h.box && center(h.box)), vertical ? 'y' : 'x') && exactText(wanted) : null, 'Exact section headings and source order own their period columns or authored TD row bands; no sections preserves the exact unsectioned inventory.')
  }
  if (input.family === 'treemap' && Array.isArray(facts['authored-style'])) {
    const measured=input.paint.nodes as {id:string;label:string;box:Box}[],hierarchy:any[]=facts.hierarchy??[],rules=facts['authored-style'],observations:any[]=[]
    let available=measured.length===input.expected.nodes?.length&&(input.expected.nodes??[]).every(node=>measured.some(actual=>actual.id===node.id&&actual.label===node.label))&&input.paint.checks.some(check=>check.criterion==='unclipped-authored-labels'&&check.status==='passed')&&input.paint.checks.some(check=>check.criterion==='paint-opacity-and-color'&&check.status==='passed'),valid=true
    for(const rule of rules){const targets=hierarchy.filter(entry=>String(entry.class??'').split(',').includes(rule.selection));if(rule.kind!=='classDef'||!targets.length){available=false;continue}
      for(const target of targets){const node=measured.find(node=>node.id===target.id),owners=node?uniqueShapes(shapes.filter(shape=>{const b=box(shape);return inside(node.box,b,.25)&&inside(b,node.box,.25)})):[],owner=owners.length===1?owners[0]:undefined,rows=node?text.filter(e=>{const b=box(e);return inside(node.box,b)&&!measured.some(child=>child.id!==node.id&&child.box.width*child.box.height<node.box.width*node.box.height-1&&inside(child.box,b))}):[]
        const properties=rule.attributes.map((attribute:any)=>{const property=attribute.property,carriers=property==='color'?rows:owner?[owner]:[],wanted=color(attribute.value),actual=carriers.map(e=>{const css=getComputedStyle(e);return color(property==='color'?e.localName==='foreignObject'?getComputedStyle(e.querySelector('*')!).color:css.fill:property==='fill'?css.fill:css.stroke)?.rgb??null});if(!['fill','stroke','color'].includes(property)||!wanted||wanted.alpha!==1||/^(?:#[\da-f]{4}|#[\da-f]{8}|transparent|none)$/i.test(attribute.value)||/^(?:rgba|hsla)\(/i.test(attribute.value)||/\//.test(attribute.value)||!actual.length||actual.some(value=>value===null)||!owner)available=false;else if(actual.some(value=>value!==wanted.rgb))valid=false;return{property,expected:attribute.value,actual}})
        observations.push({id:target.id,body:owner?box(owner):null,properties})
      }
    }
    add('authored-style',observations,available?valid:null,'Every effective treemap classDef color binds each exact source hierarchy attachment to its independently owned body and own caption/value rows; descendants cannot borrow class membership. Computed base RGB is compared without imposing unrequested default alpha or width. Unsupported properties and unused selectors stay unknown.')
  }
  if (input.family === 'packet') {
    const fields: any[] = facts.fields ?? [], settings = facts['authored-config']?.packet ?? {}, bitsPerRow = settings.bitsPerRow ?? 32
    const owners = fields.flatMap(field => findText(field.label).map(element => ({ field, element, shape: body(element) }))).filter(item => item.shape).sort((a, b) => box(a.shape!).y - box(b.shape!).y || box(a.shape!).x - box(b.shape!).x)
    const observed = owners.map(item => {
      const b = box(item.shape!), numbers = text.filter(element => { if (!/^\d+$/.test(norm(element.textContent ?? ''))) return false; const t = box(element), c = center(t); return t.y + t.height <= b.y + 2 && b.y - t.y - t.height <= Math.max(20, t.height * 2) && c.x >= b.x - 2 && c.x <= b.x + b.width + 2 }).sort((a, b) => box(a).x - box(b).x)
      return { label: item.field.label, body: b, offsets: numbers.map(element => Number(norm(element.textContent ?? ''))), numberBoxes: numbers.map(box) }
    })
    const segments = fields.flatMap(field => { const entries: any[] = []; for (let start = field.start; start <= field.end;) { const end = Math.min(field.end, (Math.floor(start / bitsPerRow) + 1) * bitsPerRow - 1); entries.push({ label: field.label, start, end }); start = end + 1 }; return entries }).sort((a, b) => Math.floor(a.start / bitsPerRow) - Math.floor(b.start / bitsPerRow) || (settings.bitOrder === 'descending' ? b.start - a.start : a.start - b.start))
    let available = Number.isSafeInteger(bitsPerRow) && bitsPerRow > 0 && owners.length === segments.length && observed.every(entry => entry.offsets.length === 1 || entry.offsets.length === 2)
    const bitRows = [...new Set(observed.map(item => Math.round(item.body.y)))], rowBounds = bitRows.map(y => { const cells = observed.filter(item => Math.abs(item.body.y - y) < 2); return { y, left: Math.min(...cells.map(item => item.body.x)), right: Math.max(...cells.map(item => item.body.x + item.body.width)) } })
    const gapCandidates = observed.flatMap((a, index) => observed.slice(index + 1).filter(b => Math.abs(a.body.y - b.body.y) < 2 && b.body.x >= a.body.x + a.body.width).map(b => b.body.x - a.body.x - a.body.width)), gap = gapCandidates.length ? Math.min(...gapCandidates) : 0
    const scaleSamples = observed.map((item, index) => (item.body.width + gap) / (item.offsets.length === 2 ? Math.abs(item.offsets[1]! - item.offsets[0]!) + 1 : 1)), scale = scaleSamples.length ? scaleSamples.reduce((a, b) => a + b, 0) / scaleSamples.length : NaN
    const valid = observed.length === segments.length && observed.every((item, index) => { const expected = segments[index]!, rowIndex = bitRows.indexOf(Math.round(item.body.y)), row = rowBounds[rowIndex]!, start = settings.bitOrder === 'descending' ? expected.end : expected.start, end = settings.bitOrder === 'descending' ? expected.start : expected.end; return item.label === expected.label && same(item.offsets, expected.start === expected.end ? [expected.start] : [start, end]) && Math.abs(scaleSamples[index]! - scale) <= Math.max(.15, scale * .01) && Math.abs(item.body.x - row.left - (settings.bitOrder === 'descending' ? bitsPerRow - expected.end % bitsPerRow - 1 : expected.start % bitsPerRow) * scale) <= Math.max(2, scale * .02) && rowIndex === Math.floor(expected.start / bitsPerRow) - Math.floor(segments[0]!.start / bitsPerRow) })
    const actualBlocks = uniqueShapes(rectangles.filter(rect => { const b = box(rect); return observed.some(item => Math.abs(b.y - item.body.y) < 2 && Math.abs(b.height - item.body.height) < 2) }))
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
      if (card.attributes.priority && card.body) {
        const vocabulary: Record<string, string> = { 'Very High': 'red', High: 'orange', Medium: 'none', Low: 'blue', 'Very Low': 'lightblue' }
        const stripes = paths.filter(path => path.localName === 'line' && (() => { const b = box(path); return b.width < .5 && Math.abs(b.x - card.body.x) <= 5 && b.y >= card.body.y - 1 && b.y + b.height <= card.body.y + card.body.height + 1 && b.height >= card.body.height * .8 && Number.parseFloat(getComputedStyle(path).strokeWidth) >= .25 })())
        const actual = stripes.length === 1 ? color(getComputedStyle(stripes[0]!).stroke)?.rgb : null, wanted = vocabulary[card.attributes.priority]
        if (wanted === 'none') { if (stripes.length) valid = false }
        else if (!wanted || !actual) available = false
        else if (actual !== color(wanted)?.rgb) { if (Object.values(vocabulary).some(value => color(value)?.rgb === actual)) valid = false; else available = false }
      }
      if (!same(wanted.map(norm).sort(), card.rows?.map((row: string) => row.replace(/^@/, '')).sort())) valid = false
    }
    const wanted = columns.flatMap(column => [column.label, ...column.tasks.flatMap((task: any) => [task.label, ...['assigned', 'ticket'].flatMap(key => task.attributes?.[key] ? [String(task.attributes[key])] : [])])])
    const countBadges = text.filter(element => { if (!/^\d+$/.test(norm(element.textContent ?? ''))) return false; const b = box(element); return observations.some(column => column.body && inside(column.body, b) && !column.cards.some((card: any) => card.body && inside(card.body, b))) }); for (const badge of countBadges) { const b = box(badge), column = observations.find(column => column.body && inside(column.body, b)); if (!column || Number(norm(badge.textContent ?? '')) !== column.cards.length) valid = false }; if (!exactText([...wanted, ...countBadges.map(element => norm(element.textContent ?? ''))])) valid = false
    add('columns', observations, available ? valid : null, 'Measured column rectangles own exact ordered card bodies and all printed assignee/ticket metadata; a complete text inventory rejects extra or borrowed cards. Unlabelled priority glyph semantics and other attributes remain unknown.')
    if (facts.metadata) { const cards = observations.flatMap(column => column.cards); add('metadata', cards, available ? valid && facts.metadata.length === cards.length && facts.metadata.every((entry: any) => cards.some((card: any) => card.id === entry.id && ['assigned', 'priority', 'ticket'].every(key => (entry[key] ?? '') === (card.attributes[key] ?? '')))) : null, 'Metadata aliases agree independently with full card attributes and measured card-owned output; unspecified priority glyphs remain unknown.') }
  }
  if (input.family === 'journey') {
    const tasks: any[] = facts.tasks ?? [], sections: string[] = facts.sections ?? [], circles = shapes.filter(shape => shape.localName === 'circle'), observed: any[] = []
    const actorNames = [...new Set<string>(tasks.flatMap(task => task.actors ?? []))]
    const taskLeft = Math.min(...tasks.map(task => { const e = label(task.label); return e ? box(e).x : Infinity })), allSegments = paths.flatMap(linearSegments), numericTicks = text.filter(element => Number.isFinite(numeric(element.textContent ?? '')) && box(element).x < taskLeft).map(element => { const p = anchor(element), b = box(element), segments = allSegments.filter(ends => ends.length === 2 && Math.abs(ends[0]!.y - ends[1]!.y) < 1 && Math.min(ends[0]!.x, ends[1]!.x) >= b.x && Math.min(ends[0]!.x, ends[1]!.x) <= b.x + b.width + 30 && Math.abs(ends[0]!.y - p.y) < 10); return { element, value: numeric(element.textContent ?? ''), y: segments[0]?.[0]?.y ?? NaN } }).filter(tick => Number.isFinite(tick.y)).sort((a, b) => a.value - b.value)
    const firstTick = numericTicks[0], lastTick = numericTicks.at(-1), scoreUnit = firstTick && lastTick && lastTick.value > firstTick.value ? (lastTick.y - firstTick.y) / (lastTick.value - firstTick.value) : NaN, calibrated = Number.isFinite(scoreUnit) && scoreUnit < 0 && numericTicks.every(tick => Math.abs(tick.y - firstTick!.y - (tick.value - firstTick!.value) * scoreUnit) < 1)
    const legend = actorNames.map(name => { const element = label(name), b = element ? box(element) : null, near = b ? circles.filter(circle => { const c = box(circle); return c.x + c.width < b.x && Math.abs(center(c).y - center(b).y) < 3 && b.x - c.x - c.width < 45 }).sort((a, b) => box(b).x - box(a).x) : []; return { name, ink: near[0] ? color(getComputedStyle(near[0]).fill)?.rgb : null } })
    let available = tasks.length > 0 && legend.every(item => item.ink) && new Set(legend.map(item => item.ink)).size === legend.length, valid = true
    for (const task of tasks) {
      const element = label(task.label), shape = body(element), b = shape ? box(shape) : null, cx = b ? center(b).x : NaN
      const faces = circles.filter(circle => { const c = box(circle); return b && Math.abs(center(c).x - cx) < 2 && c.y > b.y + b.height && c.width >= 18 && c.width <= b.width / 2 && circles.filter(eye => { if (eye === circle) return false; const e = box(eye); return inside(c, e) && e.width < c.width / 3 }).length === 2 })
      const face = faces.length === 1 ? faces[0] : undefined, faceBox = face ? box(face) : null
      const lines = paths.filter(path => { const ends = endPoints(path); return ends.length === 2 && Math.abs(ends[0]!.x - cx) < 2 && Math.abs(ends[1]!.x - cx) < 2 && b && Math.min(ends[0]!.y, ends[1]!.y) >= b.y - 2 && Math.min(ends[0]!.y, ends[1]!.y) <= b.y + b.height && faceBox && Math.max(ends[0]!.y, ends[1]!.y) > center(faceBox).y })
      // The pinned journey vocabulary uses a full-height task stem whose lower
      // endpoint is score zero and one visible face diameter is one score step.
      const line = lines.length === 1 ? lines[0] : undefined, stem = line ? endPoints(line) : null, score = faceBox && calibrated ? firstTick!.value + (center(faceBox).y - firstTick!.y) / scoreUnit : faceBox && stem ? (Math.max(...stem.map(p => p.y)) - center(faceBox).y) / faceBox.height : null
      const badges = b ? circles.filter(circle => { const c = box(circle); return c.width <= 18 && center(c).x >= b.x && center(c).x <= b.x + b.width && (Math.abs(center(c).y - b.y) < 2 || inside(b, c)) }) : []
      const actors = badges.map(badge => legend.find(item => item.ink === color(getComputedStyle(badge).fill)?.rgb)?.name ?? null)
      const sectionLabel = task.section ? label(task.section) : undefined, sectionBody = body(sectionLabel), sectionBox = sectionBody ? box(sectionBody) : null
      if (!b || !face || !line && !calibrated || score === null || actors.some(name => name === null) || task.section && !sectionBody) available = false
      if (score !== null && Math.abs(score - task.score) > .03 || !same([...actors].sort(), [...(task.actors ?? [])].sort()) || b && sectionBox && (center(b).x < sectionBox.x || center(b).x > sectionBox.x + sectionBox.width || b.y < sectionBox.y + sectionBox.height - 2)) valid = false
      observed.push({ label: task.label, section: task.section, body: b, face: faceBox, stem, absoluteScore: score, actors })
    }
    // A conventional legend heading is structural only when it is visibly
    // above the complete actor legend and to the left of the task domain.
    const actorLabels = actorNames.map(label), legendHeading = findText('Actors').filter(heading => { const h = box(heading); return actorLabels.length > 0 && actorLabels.every(e => { if (!e) return false; const a = box(e); return a.y > h.y + h.height && a.x >= h.x && a.x < h.x + h.width + 45 }) && observed.every(task => task.body && h.x + h.width < task.body.x) })
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
    const clock = settings.dateFormat === 'HH:mm' && settings.axisFormat === '%H:%M'
    const parseDate = (value: string) => clock ? /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? (Number(value.slice(0, 2)) * 60 + Number(value.slice(3))) / 1440 : NaN : /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(value + 'T00:00:00Z') / day : NaN
    const tickLines = [...svg.querySelectorAll('line,path')], ticks = text.map(element => ({ element, day: parseDate(norm(element.textContent ?? '')), x: anchor(element).x })).filter(tick => { if (!Number.isFinite(tick.day)) return false; const tickY = box(tick.element).y; return tickLines.some(raw => { const path = raw as SVGGeometryElement; return linearSegments(path).some(ends => ends.length === 2 && inkAtPoint(path, ends[0]!.y > ends[1]!.y ? ends[0]! : ends[1]!) && Math.abs(ends[0]!.x - tick.x) < 2 && Math.abs(ends[1]!.x - tick.x) < 2 && Math.max(ends[0]!.y, ends[1]!.y) <= tickY + 3 && Math.max(ends[0]!.y, ends[1]!.y) >= tickY - 10) }) }).sort((a, b) => a.day - b.day)
    const first = ticks[0], last = ticks.at(-1), unit = first && last && first !== last ? (last.x - first.x) / (last.day - first.day) : NaN
    let available = tasks.length > 0 && ticks.length >= 2 && unit > 0 && ticks.every(tick => Math.abs(tick.x - first!.x - (tick.day - first!.day) * unit) < 1.5) && (clock || ['YYYY-MM-DD', undefined].includes(settings.dateFormat)), valid = true
    const excluded = String(settings.excludes ?? '').split(/[ ,]+/).filter(Boolean), included = String(settings.includes ?? '').split(/[ ,]+/).filter(Boolean)
    // gantt.md146-149 explicitly selects Fri/Sat or Sat/Sun; this calendar is
    // derived from the authored setting, never fitted from the drawn endpoints.
    const weekend=settings.weekend??'saturday',weekendDays=weekend==='friday'?[5,6]:[6,0]
    if(!['friday','saturday'].includes(weekend))available=false
    const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], isExcluded = (date: number) => { const at = new Date(date * day), iso = at.toISOString().slice(0, 10), weekday = at.getUTCDay(); return !included.includes(iso) && (excluded.includes(iso) || excluded.includes(names[weekday]!) || excluded.includes('weekends') && weekendDays.includes(weekday)) }
    if (excluded.some(value => value !== 'weekends' && !names.includes(value.toLowerCase()) && !Number.isFinite(parseDate(value))) || included.some(value => !Number.isFinite(parseDate(value)))) available = false
    const schedules = new Map<string, { start: number; end: number }>(), visiting = new Set<string>()
    const schedule = (task: any): { start: number; end: number } | null => {
      if (schedules.has(task.id)) return schedules.get(task.id)!
      if (visiting.has(task.id)) return null
      visiting.add(task.id)
      let start = parseDate(task.start)
      const after = /^after\s+(.+)$/.exec(task.start)
      if (after) { const parents = after[1]!.split(/\s+/).map(id => tasks.find(candidate => candidate.id === id)).map(parent => parent ? schedule(parent) : null); if (parents.every(Boolean)) start = Math.max(...parents.map(parent => parent!.end)) }
      let end = parseDate(task.end)
      const until = /^until\s+([\w:-]+)$/.exec(task.end)
      if (until) { const target = tasks.find(candidate => candidate.id === until[1]), interval = target ? schedule(target) : null; if (interval) end = interval.start }
      const duration = /^(\d+(?:\.\d+)?)(d|h|m|w)$/.exec(task.end)
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
      const element = label(task.label), eb = element ? box(element) : null, c = eb ? center(eb) : null
      const candidates = c ? shapes.filter(shape => { const b = box(shape); return Math.abs(center(b).y - c.y) < 3 && b.height <= Math.max(40, eb!.height * 3) && b.width > 1 && (inside(b, eb!) || distance(c, b) <= Math.max(40, eb!.width + 10)) }).sort((a, b) => distance(c, box(a)) - distance(c, box(b)) || box(a).width * box(a).height - box(b).width * box(b).height) : []
      const shape = candidates[0], b = shape ? box(shape) : null, dates = schedule(task)
      if (!shape || !dates || candidates[1] && Math.abs(distance(c!, box(candidates[1])) - distance(c!, b!)) < 1 && !inside(b!, eb!)) available = false
      if ((task.tags ?? []).some((tag: string) => !['milestone'].includes(tag))) available = false
      const milestone = task.tags?.includes('milestone'), start = dates && first ? first.x + (dates.start - first.day) * unit : NaN, end = dates && first ? first.x + (dates.end - first.day) * unit : NaN
      let glyph: string | null = null
      if (shape && milestone) { const points = sample(shape, 128), bb = b!, corners = [[center(bb).x, bb.y], [bb.x + bb.width, center(bb).y], [center(bb).x, bb.y + bb.height], [bb.x, center(bb).y]]; glyph = corners.every(([x, y]) => points.some(p => Math.hypot(p.x - x!, p.y - y!) < 1.5)) ? 'diamond' : null; if (glyph !== 'diamond' || Math.abs(center(bb).x - (start + end) / 2) > 2) valid = false }
      else if (b && (Math.abs(b.x - start) > 2 || Math.abs(b.x + b.width - end) > 2)) valid = false
      return { id: task.id, label: task.label, body: b, calendar: dates, expectedStartX: start, expectedEndX: end, glyph, tags: task.tags ?? [], section: task.section }
    })
    const taskY = observed.map(task => task.body && center(task.body).y),compact=facts['frontmatter:displayMode']==='compact'
    const sharedRows=observed.flatMap((left,i)=>observed.slice(i+1).flatMap(right=>{
      if(!left.body||!right.body||!left.calendar||!right.calendar)return[]
      const verticalOverlap=Math.min(left.body.y+left.body.height,right.body.y+right.body.height)-Math.max(left.body.y,right.body.y),calendarOverlap=left.calendar.start<right.calendar.end&&right.calendar.start<left.calendar.end
      return verticalOverlap>1?[{left:left.id,right:right.id,sameSection:left.section===right.section,calendarOverlap,sameCenter:Math.abs(center(left.body).y-center(right.body).y)<=1}]:[]
    })),compactRowsValid=sharedRows.every(pair=>pair.sameSection&&!pair.calendarOverlap)
    if (compact?!compactRowsValid:!taskY.every((y, i) => y !== null && (!i || y > taskY[i - 1]! + 1))) valid = false
    const sectionRows = sections.map(section => { const element = label(section), y = element ? center(box(element)).y : NaN, members = observed.filter(task => task.section === section); return { section, y, members: members.map(task => task.body && center(task.body).y), valid: Number.isFinite(y) && members.length > 0 && members.every(task => task.body) && y >= Math.min(...members.map(task => task.body!.y)) - 3 && y <= Math.max(...members.map(task => task.body!.y + task.body!.height)) + 3 } })
    if (!sectionRows.every(row => row.valid)) valid = false
    const svgWidth = svg.getBoundingClientRect().width, taskShapes = uniqueShapes(shapes.filter(shape => { const b = box(shape); return observed.some(task => task.body && Math.abs(center(b).y - center(task.body).y) < 2 && b.height <= task.body.height + 1 && b.width < svgWidth * .98) }))
    if (taskShapes.length !== tasks.length) available = false
    add('tasks', { ticks: ticks.map(tick => ({ day: tick.day, x: tick.x })), measuredDayWidth: unit, tasks: observed }, available ? valid : null, 'Visible ISO date or authored HH:mm calendar ticks independently calibrate absolute bar starts/ends; source dependencies and supported weekday/date exclusions are resolved before measuring output. Exact bar inventory and milestone diamonds at initial-date plus half-duration are checked. Ordinary mode keeps task row order; authored compact mode permits same-section row reuse only for nonoverlapping independently resolved calendar spans. Unlabelled status colors, other date grammars and ambiguous external labels stay unknown.')
    if(Object.hasOwn(facts,'frontmatter:displayMode'))add('frontmatter:displayMode',{rows:taskY,sharedRows},available&&compact?compactRowsValid?(sharedRows.some(pair=>pair.sameCenter)?true:null):false:null,'Pinned gantt.md301-303 permits compact same-row tasks. An actual shared row of nonoverlapping task spans proves that visible effect; separate rows alone cannot inverse-identify the internal mode and remain unknown. Overlapping calendar spans cannot borrow a compact row.')
    const ordinaryDayRatios = !/\bexcludes\b/i.test(input.source) && tasks.length > 1 && tasks.every(task => /^(\d+(?:\.\d+)?)d$/.test(task.end) && Number.parseFloat(task.end) > 0)
    // The existing ordinary-day observer verifies scale-invariant width ratios.
    // This calendar extension owns only its additional source grammars, and
    // never folds row/section placement into a duration assertion. Absolute
    // starts, full row order and compact collisions stay required task facts.
    const durationValid = observed.every(task => task.body && (task.tags.includes('milestone') ? task.glyph === 'diamond' && Math.abs(center(task.body).x - (task.expectedStartX + task.expectedEndX) / 2) <= 2 : Math.abs(task.body.width - Math.abs(task.expectedEndX - task.expectedStartX)) <= 2))
    if (!ordinaryDayRatios) quantitative('painted-duration-ratios', facts.tasks, { ticks: ticks.map(tick => ({ day: tick.day, x: tick.x })), measuredDayWidth: unit, tasks: observed }, available ? durationValid : null, 'For excluded calendars, date endpoints and clock/milestone grammars, independently printed ticks project bar elapsed widths or the documented joint milestone midpoint. Row/section placement is checked by the separate complete task fact; no expected duration is fitted as an observed scale. Ordinary positive explicit-day ratios retain their separate scale-invariant observer.')
    add('sections', sectionRows, available ? sectionRows.every(row => row.valid) : null, 'Each section caption lies beside its complete consecutive task-row span, in source section order.')
    const settingKeys = Object.keys(settings), supported = settingKeys.every(key => ['dateFormat', 'excludes', 'includes', 'inclusiveEndDates', 'todayMarker','weekend', ...(clock ? ['axisFormat'] : [])].includes(key))
    add('calendar-settings', { projected: settings, ticks: ticks.map(tick => ({ label: norm(tick.element.textContent ?? ''), x: tick.x })), tasks: observed }, available && supported ? valid && (settings.todayMarker !== 'off' || !(() => { const top = Math.min(...observed.map(task => task.body!.y)), bottom = Math.max(...observed.map(task => task.body!.y + task.body!.height)); return paths.some(path => { const ends = endPoints(path); return ends.length === 2 && Math.abs(ends[0]!.x - ends[1]!.x) < 1 && !ticks.some(tick => Math.abs(tick.x - ends[0]!.x) < 2) && Math.min(...ends.map(p => p.y)) < top && Math.max(...ends.map(p => p.y)) > bottom }) })()) : null, 'Date format, source-selected Fri/Sat or Sat/Sun weekends, and inclusion/exclusion settings must produce the independently calibrated task calendar; todayMarker off requires no non-tick full-height date marker. Other display/axis/tick configuration stays required and unknown.')
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
      if (entry.depth > 0) { const parent = origins.find(parent => parent.id === hierarchy.find(node => node.id === entry.id)?.parent); if (!parent) available = false; else { const stemX = h[0] ? box(h[0]).x : NaN, connected = lines.some(line => { const b = box(line); return b.width < 1 && Math.abs(b.x - stemX) < 1 && b.y > parent.y && b.y < entry.y && b.y + b.height >= entry.y - 1 }); if (!connected) valid = false } }
    }
    const labels = observations.map(entry => entry.label || '/'); if (label('/') && !labels.includes('/')) labels.unshift('/')
    // An authored annotation is a separate row decoration, not an extra tree
    // node. Retain it in the exact text inventory without borrowing its text
    // as evidence for the hierarchy's indentation or connector ownership.
    const annotations: any[] = Array.isArray(facts.decorations) ? facts.decorations.filter((entry: any) => entry && typeof entry.annotation === 'string' && hierarchy.some(node => node.id === entry.id) && Object.keys(entry).every(key => ['id', 'annotation'].includes(key))) : []
    valid &&= exactText([...labels, ...annotations.map(entry => entry.annotation)])
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
    const setAreas = observed.map(set => set.owner ? area(set.owner) : NaN), knownSizes = observed.flatMap((set, i) => Number.isFinite(set.size) ? [{ set, area: set.owner ? setAreas[i]! : area(set.owner!) }] : []), scale = knownSizes.length ? knownSizes.reduce((sum, known) => sum + known.area, 0) / knownSizes.reduce((sum, known) => sum + known.set.size, 0) : NaN
    if (knownSizes.some(({ set, area }) => !set.owner || Math.abs(area / scale - set.size) > Math.max(.02, set.size * .04))) valid = false
    const unionObservations = intersections.map(intersection => {
      const element = label(intersection.label), c = element ? center(box(element)) : null, members = observed.filter(set => intersection.members.includes(set.id)), membership = c ? observed.filter(set => set.owner && contains(set.owner, c)).map(set => set.id).sort() : null
      if (!c || members.length !== intersection.members.length || members.some(set => !set.owner)) { available = false; return { members: intersection.members, label: intersection.label, membership, sampledArea: null } }
      const boxes = members.map(set => box(set.owner!)), outer = { x: Math.max(...boxes.map(b => b.x)), y: Math.max(...boxes.map(b => b.y)), right: Math.min(...boxes.map(b => b.x + b.width)), bottom: Math.min(...boxes.map(b => b.y + b.height)) }
      const inverses = members.map(set => set.owner!.getScreenCTM()?.inverse()); let count = 0
      if (outer.right > outer.x && outer.bottom > outer.y) for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const p = { x: outer.x + (x + .5) / 128 * (outer.right - outer.x), y: outer.y + (y + .5) / 128 * (outer.bottom - outer.y) }; if (members.every((set, i) => !!inverses[i] && set.owner!.isPointInFill(new DOMPoint(p.x, p.y).matrixTransform(inverses[i])))) count++ }
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
    if(Array.isArray(facts['authored-style'])){
      const styles=facts['authored-style'].map((rule:any)=>{const set=observed.find(set=>set.id===rule.selection),region=intersections.find(item=>[...item.members].sort().join(',')===rule.selection.split(',').sort().join(',')),entry=texts.find(item=>item.id===rule.selection),caption=label(set?.label??region?.label??entry?.label??''),owner=set?.owner
        const properties=rule.attributes.map((attribute:any)=>{const property=attribute.property,wanted=color(attribute.value),carriers=property==='color'&&caption?caption.localName==='foreignObject'?[...caption.querySelectorAll('*')].filter(e=>norm(e.textContent??'')&&![...e.children].some(child=>norm(child.textContent??''))):[caption]:['fill','stroke'].includes(property)&&owner?[owner]:[],actual=carriers.map(e=>{const css=getComputedStyle(e);return color(property==='color'?e.namespaceURI==='http://www.w3.org/1999/xhtml'?css.color:css.fill:css[property as 'fill'|'stroke'])?.rgb??null});return{property,expected:attribute.value,actual,available:!!wanted&&wanted.alpha===1&&!/^(?:#[\da-f]{4}|#[\da-f]{8}|transparent|none)$/i.test(attribute.value)&&!/^(?:rgba|hsla)\(/i.test(attribute.value)&&!/\//.test(attribute.value)&&actual.length>0&&actual.every(value=>value!==null)&&!!caption,passed:!!wanted&&actual.every(value=>value===wanted.rgb)}})
        return{selection:rule.selection,properties,available:rule.kind==='style'&&properties.every((p:any)=>p.available)}})
      add('authored-style',styles,available&&styles.every((rule:any)=>rule.available)&&input.paint.checks.some(check=>check.criterion==='unclipped-authored-labels'&&check.status==='passed')&&input.paint.checks.some(check=>check.criterion==='paint-opacity-and-color'&&check.status==='passed')?styles.every((rule:any)=>rule.properties.every((p:any)=>p.passed)):null,'Set fill/stroke and exact set/union/region-text foreground styles bind independently measured membership owners. A comma selection identifies the exact intersection, not every individual set; foreignObject foreground comes from its actual painted HTML leaves. Unrequested alpha remains free; other style properties stay unknown.')
    }
  }
  if (input.family === 'cynefin') {
    const names = ['complex', 'complicated', 'clear', 'chaotic', 'confusion'], domains: any[] = facts['framework-domains'] ?? [], entries: any[] = facts['domain-entries'] ?? [], transitions: any[] = facts['domain-transitions'] ?? []
    const allRects = [...svg.querySelectorAll('rect')], owners = names.map(name => { const e = label(name[0]!.toUpperCase() + name.slice(1)), eb = e ? box(e) : null, candidates = eb && name !== 'confusion' ? allRects.filter(rect => { if (!filled(rect)) return false; const b = box(rect); return inside(b, eb) && b.width > 100 && b.height > 100 }).sort((a, b) => box(a).width * box(a).height - box(b).width * box(b).height) : [], shape = name === 'confusion' ? body(e) : candidates[0]; return { id: name, label: e, shape: shape as SVGGeometryElement | undefined, box: shape ? box(shape) : null } })
    const quadrants = owners.slice(0, 4), bounds = quadrants.every(domain => domain.box) ? { x: Math.min(...quadrants.map(domain => domain.box!.x)), y: Math.min(...quadrants.map(domain => domain.box!.y)), right: Math.max(...quadrants.map(domain => domain.box!.x + domain.box!.width)), bottom: Math.max(...quadrants.map(domain => domain.box!.y + domain.box!.height)) } : null
    let available = !!bounds && owners.every(domain => domain.shape), valid = true
    const positions = owners.map(domain => { const c = domain.box ? center(domain.box) : null; return { id: domain.id, x: c && bounds ? (c.x - bounds.x) / (bounds.right - bounds.x) : null, y: c && bounds ? (c.y - bounds.y) / (bounds.bottom - bounds.y) : null, kind: outlineKind(domain.shape) } })
    for (const item of positions) { const wanted = ({ complex: [.25, .25], complicated: [.75, .25], clear: [.75, .75], chaotic: [.25, .75], confusion: [.5, .5] } as Record<string, number[]>)[item.id]!; if (item.x === null || item.y === null || Math.abs(item.x - wanted[0]!) > .015 || Math.abs(item.y - wanted[1]!) > .015 || (item.id === 'confusion' ? item.kind !== 'ellipse' : item.kind !== 'rectangle')) valid = false }
    const observed = entries.map(entry => { const e = label(entry.label), eb = e ? box(e) : null, c = eb ? center(eb) : null, confusion = owners[4]!, inConfusion = c && confusion.shape ? (() => { const m = confusion.shape!.getScreenCTM(); return !!m && confusion.shape!.isPointInFill(new DOMPoint(c.x, c.y).matrixTransform(m.inverse())) })() : false, member = c ? inConfusion ? 'confusion' : quadrants.find(domain => domain.box && inside(domain.box, eb!))?.id : null; if (member !== entry.domain) valid = false; return { label: entry.label, domain: member, box: eb } })
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
    add('domain-transitions', null, transitions.length ? null : available ? paths.filter(path => { if (boundaryPaths.includes(path) || cliff.includes(path) || owners.some(owner => owner.shape === path)) return false; const b = box(path); return b.width > 10 && b.height > 10 }).length === 0 && inventory : null, 'An empty transition contract requires no extra visible routes. Directed inter-domain transition glyph/caption ownership remains unknown until its endpoint/marker vocabulary is qualified.')
  }
  if (input.family === 'wardley') {
    const components: any[] = facts.components ?? [], links: any[] = facts.links ?? [], axisX = label('Evolution'), axisY = label('Visibility')
    const axisSegments = paths.flatMap(path => linearSegments(path).filter(ends => ends.length === 2 && ends.every(p => inkAtPoint(path, p))).map(ends => ({ x: Math.min(...ends.map(p => p.x)), y: Math.min(...ends.map(p => p.y)), width: Math.abs(ends[1]!.x - ends[0]!.x), height: Math.abs(ends[1]!.y - ends[0]!.y) })))
    const axisXBox = axisX ? box(axisX) : null, horizontal = axisSegments.filter(b => b.height < 1 && b.width > 100 && axisXBox && b.y < axisXBox.y && b.y >= axisXBox.y - 50).sort((a, b) => b.width - a.width)[0]
    const plot = horizontal ? (() => { const h = horizontal, vertical = axisSegments.filter(b => b.width < 1 && Math.abs(b.x - h.x) < 1 && Math.abs(b.y + b.height - h.y) < 1 && b.height > 100).sort((a, b) => b.height - a.height)[0]; return vertical && axisY && box(axisY).x < h.x ? { x: h.x, y: vertical.y, width: h.width, height: vertical.height } : null })() : null
    const glyphs = [...shapes, ...paths.filter(path => path.localName === 'polyline')].filter(shape => { const b = box(shape); return b.width >= 3 && b.width <= 40 && b.height >= 3 && b.height <= 40 })
    const glyphBoxes = glyphs.map(box), outerGlyphs = glyphs.filter((glyph, i) => { const g = glyphBoxes[i]!; return !glyphs.some((other, j) => { const o = glyphBoxes[j]!; return other !== glyph && o.width * o.height > g.width * g.height + 1 && inside(o, g, .5) }) })
    const mapLabel = (name: string) => { const candidates = findText(name).filter(e => { if (!plot) return false; const b = box(e); return b.y < plot.y + plot.height && b.y + b.height > plot.y - 25 }); return candidates.length === 1 ? candidates[0] : undefined }
    const memberGlyph = (name: string) => { const e = mapLabel(name), eb = e ? box(e) : null, candidates = eb ? glyphs.filter(glyph => outlineKind(glyph) === 'circle').map(glyph => ({ glyph, d: distance(center(box(glyph)), eb) })).filter(item => item.d <= Math.max(25, eb.height * 2)).sort((a, b) => a.d - b.d) : []; return candidates[0] && (!candidates[1] || candidates[1].d - candidates[0].d > 2) ? candidates[0].glyph : undefined }
    const allRects = [...svg.querySelectorAll('rect')], pipelineObservations = (facts.pipelines ?? []).map((pipeline: any) => {
      const parent = components.find(component => component.name === pipeline.component), e = label(pipeline.component), eb = e ? box(e) : null, members = pipeline.members.map((member: any) => { const glyph = memberGlyph(member.name), c = glyph ? center(box(glyph)) : null; return { ...member, glyph, point: c, observed: c && plot ? { visibility: (plot.y + plot.height - c.y) / plot.height, evolution: (c.x - plot.x) / plot.width } : null } })
      const headerCandidates = eb ? glyphs.filter(glyph => outlineKind(glyph) === 'rectangle').map(glyph => ({ glyph, distance: distance(center(box(glyph)), eb) })).filter(item => item.distance < 25).sort((a, b) => a.distance - b.distance) : [], header = headerCandidates.length === 1 ? headerCandidates[0]!.glyph : undefined, headerBox = header ? box(header) : null
      const candidates = allRects.filter(rect => { const b = box(rect); return plot && b.width > 40 && b.height > 4 && b.height < plot.height * .15 && members.length > 1 && members.every((member: any) => member.glyph && inside(b, box(member.glyph))) && eb && eb.y + eb.height <= b.y + 2 && b.y - eb.y < Math.max(40, eb.height * 3) && center(eb).x >= b.x && center(eb).x <= b.x + b.width && sample(rect, 256).every(p => headerBox && distance(p, headerBox) < 1 || inkAtPoint(rect, p)) }).sort((a, b) => box(a).width * box(a).height - box(b).width * box(b).height), owner = candidates[0], b = owner ? box(owner) : null, visibility = b && plot ? (plot.y + plot.height - center(b).y) / plot.height : null
      const available = parent?.kind === 'pipeline-group' && Number.isFinite(parent.visibility) && !!b && members.every((member: any) => member.observed && member.kind === 'component' && outlineKind(member.glyph) === 'circle') && new Set(members.map((member: any) => member.glyph)).size === members.length
      const valid = available && Math.abs(visibility! - parent.visibility) < .008 && members.every((member: any) => Math.abs(member.observed.visibility - parent.visibility) < .008 && Math.abs(member.observed.evolution - member.coordinates[0]) < .008)
      return { component: pipeline.component, owner, body: b, visibility, members, available, valid }
    })
    const observed = components.map(component => {
      const e = mapLabel(component.name), eb = e ? box(e) : null, candidates = eb ? outerGlyphs.map(glyph => ({ glyph, d: distance(center(box(glyph)), eb) })).filter(item => item.d <= 25).sort((a, b) => a.d - b.d) : [], glyph = candidates[0] && (!candidates[1] || candidates[1].d - candidates[0].d > 2) ? candidates[0].glyph : undefined, c = glyph ? center(box(glyph)) : component.kind === 'anchor' && e?.localName === 'text' && (e as SVGTextElement).x.baseVal.numberOfItems && (e as SVGTextElement).y.baseVal.numberOfItems ? point(e as SVGTextElement, (e as SVGTextElement).x.baseVal.getItem(0).value, (e as SVGTextElement).y.baseVal.getItem(0).value + 3) : null
      const pipeline = pipelineObservations.find((entry: any) => entry.component === component.name)
      const textMatrix = e?.localName === 'text' ? (e as SVGTextElement).getScreenCTM() : null, textStyle = e ? getComputedStyle(e) : null, origin = e && c && textMatrix && textStyle!.textAnchor === 'start' && ['auto', 'alphabetic'].includes(textStyle!.dominantBaseline) && (e as SVGTextElement).getNumberOfChars() ? (e as SVGTextElement).getStartPositionOfChar(0).matrixTransform(textMatrix) : null
      const labelOffsetActual = component.labelOffset && origin && c && textMatrix && Math.abs(textMatrix.b) < 1e-8 && Math.abs(textMatrix.c) < 1e-8 ? [(origin.x - c.x) / textMatrix.a, (origin.y - c.y) / textMatrix.d] : null
      return { ...component, glyph, glyphKind: outlineKind(glyph), point: component.kind === 'pipeline-group' && pipeline?.body ? center(pipeline.body) : c, coordinates: component.kind === 'pipeline-group' ? null : c && plot ? [(plot.y + plot.height - c.y) / plot.height, (c.x - plot.x) / plot.width] : null, pipelineVisibility: pipeline?.visibility ?? null, labelOffsetActual, labelBox: eb }
    })
    const inertiaBars = paths.filter(path => path.localName === 'line' && (() => { const b = box(path); return plot && b.width < .5 && b.height >= 3 && b.height <= 40 && Number.parseFloat(getComputedStyle(path).strokeWidth) >= 3 && inside(plot, b) })())
    const inertia = observed.map(component => ({ name: component.name, bars: component.point ? inertiaBars.filter(bar => { const b = box(bar), c = center(b); return c.x > component.point!.x && c.x - component.point!.x <= 30 && Math.abs(c.y - component.point!.y) < 1.5 }) : [] }))
    const inertiaKnown = inertiaBars.every(bar => inertia.filter(entry => entry.bars.includes(bar)).length === 1)
    const strategies: Record<string, string> = { build: 'triangle', buy: 'diamond', outsource: 'rectangle', market: 'circle' }
    const strategyContradiction = observed.some(component => component.strategy && component.glyph && strategies[component.strategy] && ['circle', 'rectangle', 'diamond', 'triangle'].includes(component.glyphKind ?? '') && component.glyphKind !== strategies[component.strategy])
    let available = !!plot && inertiaKnown && observed.every(component => component.kind === 'pipeline-group' ? pipelineObservations.some((entry: any) => entry.component === component.name && entry.available) : component.coordinates && (!component.strategy || component.glyphKind === strategies[component.strategy]) && inertia.find(entry => entry.name === component.name)?.bars.length === (component.inertia ? 1 : 0) && (!component.labelOffset || component.labelOffsetActual) && component.coordinates.length === 2), valid = true
    for (const component of observed) { if (component.kind === 'pipeline-group') { if (!pipelineObservations.some((entry: any) => entry.component === component.name && entry.valid)) valid = false; continue }; const authored = components.find(c => c.name === component.name); if (!component.coordinates || component.coordinates.some((value: number, i: number) => Math.abs(value - authored.coordinates[i]) > .008)) valid = false; if (component.kind === 'component' && component.glyphKind !== 'circle' || component.labelOffsetActual?.some((value: number, i: number) => Math.abs(value - component.labelOffset[i]) > 1)) valid = false }
    const bind = (p: { x: number; y: number }) => { const nearest = observed.filter(component => component.point).map(component => ({ name: component.name, d: Math.hypot(component.point!.x - p.x, component.point!.y - p.y) })).sort((a, b) => a.d - b.d); return nearest[0] && nearest[0].d <= 22 && (!nearest[1] || nearest[1].d - nearest[0].d > 2) ? nearest[0].name : null }
    const routes = plot ? paths.flatMap(path => {
      const ends = endPoints(path)
      if (ends.length !== 2 || !ends.every(p => p.x > plot.x - 2 && p.x < plot.x + plot.width + 2 && p.y > plot.y - 2 && p.y < plot.y + plot.height + 2) || Math.hypot(ends[0]!.x - ends[1]!.x, ends[0]!.y - ends[1]!.y) < 2) return []
      const source = bind(ends[0]!), target = bind(ends[1]!)
      if (source && target && source !== target) return [{ source, target, ends }]
      if (source && source === target) return []
      const segments = linearSegments(path), frameOnly = segments.length > 0 && segments.every(segment => segment.every(p => Math.abs(p.x - plot.x) < 1) || segment.every(p => Math.abs(p.y - plot.y - plot.height) < 1))
      return !frameOnly && Math.abs(ends[0]!.y - ends[1]!.y) > 1 && Math.abs(ends[0]!.x - ends[1]!.x) > 1 ? [{ source, target, ends }] : []
    }) : []
    const linkAvailable = !!plot && observed.every(component => component.point) && links.every(link => link.source !== link.target && link.kind === '->' && !link.label) && routes.every(route => route.source && route.target), canonical = (edge: any) => [edge.source, edge.target].sort().join('\0')
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
    add('components', observed.map(({ glyph: _, ...component }) => ({ ...component, inertiaBars: inertia.find(entry => entry.name === component.name)?.bars.map(box) })), strategyContradiction ? false : available ? valid && outerGlyphs.length === components.filter(component => component.kind !== 'anchor').length + (facts.pipelines ?? []).reduce((n: number, pipeline: any) => n + pipeline.members.length, 0) : null, 'Each uniquely owned component/anchor glyph is measured in the independent painted map frame within0.8%. Complete glyph inventory prevents matching labels from borrowing positions; an adjacent owned heavy vertical inertia marker is independently counted. Explicit strategy symbols follow the documented triangle/diamond/square/circle vocabulary; an independently owned contrary recognizable symbol fails while unfamiliar compounds stay unknown.')
    add('pipelines', pipelineObservations.map(({ owner: _, members, ...pipeline }: any) => ({ ...pipeline, members: members.map(({ glyph: __, ...member }: any) => member) })), available && pipelineObservations.every((entry: any) => entry.available) ? pipelineObservations.every((entry: any) => entry.valid) && valid : null, 'A separately captioned actual horizontal range encloses the exact pipeline member glyphs; its vertical center and every member center share authored visibility, while each member center preserves its own evolution. The source-reviewed pipeline-group representation replaces the parent standalone evolution point; the original point coordinate remains native/advisory metadata.')
    add('links', routes, linkAvailable ? linksOkay : null, 'Exact dependency inventory binds actual route endpoints to independently owned map glyphs; unheaded ordinary links encode endpoint pairs. Directed/decorated/value-chain relationship vocabulary needs separate marker evidence.')
    add('evolution', evolution, available && evolution.every((entry: any) => entry.target !== null) ? evolution.every((entry: any) => entry.errorCSSPixels <= 2) : null, 'Evolution routes start at the owned source component; their actual painted marker tip, reconstructed from visible triangle geometry and SVG marker viewport/ref transforms, must reach the authored normalized target within2 CSS pixels. A shortened stem or hypothetical unpainted target circle supplies no target credit.')
    add('notes', notes, plot && notes.every((entry: any) => entry.point) ? notes.every((entry: any) => entry.point.every((value: number, i: number) => Math.abs(value - entry.wanted[i]) < .012)) : null, 'Each note owns its separate visible text origin in the painted map coordinate frame within1.2%; no native coordinate metadata is observed.')
    if (Array.isArray(facts.annotations)) {
      if (facts.annotations.every((entry: any) => ['accelerator', 'deaccelerator'].includes(entry.kind))) {
        const forces = facts.annotations.map((entry: any) => {
          const caption = label(entry.label), t = caption ? box(caption) : null, candidates = t ? paths.filter(path => {
            const b = box(path); return path.localName === 'path' && b.width >= 30 && b.width <= 100 && b.height >= 15 && b.height <= 100 && Math.abs(center(b).x - center(t).x) < 3 && t.y >= b.y + b.height - 4 && t.y - b.y - b.height < t.height * 2
          }) : [], path = candidates.length === 1 ? candidates[0]! : null, matrix = path?.getScreenCTM(), raw = path?.getAttribute('d') ?? '', commands = raw.match(/[A-Za-z]/g), numbers = raw.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [], vertices = path && matrix && same(commands, ['M','L','L','L','L','L','L','Z']) && numbers.length === 14 ? Array.from({length: 7}, (_,i) => new DOMPoint(numbers[i*2],numbers[i*2+1]).matrixTransform(matrix)) : []
          const b = path ? box(path) : null, middle = b ? center(b).y : NaN, tip = b ? vertices.filter(p => Math.abs(p.y - middle) < .5 && (Math.abs(p.x-b.x)<.5 || Math.abs(p.x-b.x-b.width)<.5)) : [], kind = b && tip.length === 1 ? Math.abs(tip[0]!.x-b.x-b.width)<.5 ? 'accelerator' : 'deaccelerator' : null, coordinate = b && plot ? [(plot.y+plot.height-middle)/plot.height,(b.x-plot.x)/plot.width] : null
          return { label: entry.label, kind, box: b, coordinate, expected: entry.coordinates, available: !!b && vertices.length === 7 && vertices.every(p => inkAtPoint(path!, p)) && !!kind && !!coordinate }
        })
        add('annotations', forces, forces.every((entry: any) => entry.available) ? forces.every((actual: any,i:number) => actual.kind === facts.annotations[i].kind && actual.coordinate.every((v:number,j:number)=>Math.abs(v-actual.expected[j])<.008)) : null, 'Finite seven-corner force arrows bind a uniquely centered adjacent caption, actual left-edge/midheight map anchor, and right/left physical arrow tip. Complete actual contour exposure and the independently painted map frame are required; classes and source coordinates supply no observed geometry.')
      } else add('annotations', { unavailableBecause: plot ? 'Numbered-circle legend ownership and anchor convention are not qualified' : 'Opaque annotation legend obscures the full axis endpoint; no independent complete map frame' }, null, 'Numbered annotations retain every source number, text and position; obscured axes and unqualified legend anchors remain unknown rather than fitting source positions to a frame.')
    }
    if (facts['annotation-legend-position']) add('annotation-legend-position', { unavailableBecause: 'Source position has no uniquely specified corner/overflow-clamping anchor in the public syntax' }, null, 'The literal legend position remains required; no inferred corner or renderer clamping rule substitutes for a qualified source coordinate anchor.')
    if (facts.size) { const view = svg.viewBox.baseVal; add('size', { width: view.width, height: view.height }, view.width > 0 && view.height > 0 ? Math.abs(view.width - facts.size[0]) < .01 && Math.abs(view.height - facts.size[1]) < .01 : null, 'Authored map size binds actual SVG viewBox user dimensions, independent of browser CSS scaling.') }
    if (facts['evolution-stages']) { const stages = facts['evolution-stages'].map((entry: any, i: number, all: any[]) => { const labels = findText(entry.label).filter(e => plot && box(e).y > plot.y + plot.height), e = labels.length === 1 ? labels[0] : undefined, p = e ? center(box(e)) : null, lower = i ? all[i - 1].position ?? i / all.length : 0, upper = entry.position ?? (i + 1) / all.length, separators = plot && upper < 1 ? axisSegments.filter(b => b.width < 1 && Math.abs(b.y - plot.y) < 1 && Math.abs(b.height - plot.height) < 1 && Math.abs((b.x - plot.x) / plot.width - upper) < .003) : []; return { label: entry.label, position: p && plot ? (p.x - plot.x) / plot.width : null, lower, upper, separator: upper === 1 || separators.length === 1 } }); add('evolution-stages', stages, plot && stages.every((entry: any) => entry.position !== null) ? stages.every((entry: any) => entry.position >= entry.lower && entry.position <= entry.upper && entry.separator) : null, 'Each below-axis caption owns its cumulative-upper-boundary stage interval and every internal source boundary has a complete actual separator. A component with the same caption cannot substitute for a stage label.') }
  }
  if (input.family.startsWith('railroad')) {
    type P = { x: number; y: number }
    type Expression = { ast: any; left: P; right: P; box: Box; elements: Element[] }
    const near = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y) <= 1.5
    const directPaths = (element: Element) => [...element.children].filter(child => paths.includes(child as SVGGeometryElement)) as SVGGeometryElement[]
    const directGroups = (element: Element) => [...element.children].filter(child => child.localName === 'g' && ([...child.querySelectorAll('text')].some(e => text.includes(e)) || [...child.querySelectorAll('rect')].some(e=>shapes.includes(e))))
    const parsed = new Map<Element, Expression | null>()
    const expression = (element: Element): Expression | null => {
      if (parsed.has(element)) return parsed.get(element)!
      parsed.set(element, null)
      const ownText = [...element.children].filter(child => text.includes(child) || child.localName === 'text' && /^ *$/.test(child.textContent ?? '') && getComputedStyle(child).display !== 'none'), ownRects = [...element.children].filter(child => shapes.includes(child as SVGGeometryElement) && child.localName === 'rect'), groups = directGroups(element), routes = directPaths(element)
      if (ownText.length <= 1 && ownRects.length === 1 && !groups.length && !routes.length) {
        const rect = ownRects[0]!, b = box(rect), labelBox = ownText[0] ? box(ownText[0]) : b
        if (norm(ownText[0]?.textContent ?? '') && !inside(b, labelBox)) return null
        const kind = outlineKind(rect as SVGGeometryElement), value = ownText[0]?.textContent ?? '', special = input.family==='railroad-peg'&&kind==='rectangle'?/^\?\s+(!|&)([A-Za-z_]\w*)\s+\?$/.exec(norm(value)):null, ast = special ? {kind:special[1]==='!'?'negative-lookahead':'positive-lookahead',expression:{kind:'reference',value:special[2]}} : kind === 'rounded' && /^ *$/.test(value) ? { kind: 'blank-terminal' } : { kind: kind === 'rounded' ? 'terminal' : kind === 'rectangle' ? 'reference' : null, value: norm(value) }
        if (!ast.kind) return null
        const result = { ast, left: { x: b.x, y: center(b).y }, right: { x: b.x + b.width, y: center(b).y }, box: b, elements: [rect, ...ownText] }; parsed.set(element, result); return result
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
            const other = endPoints(candidate[0]!).find(p => !near(p, port)); if (!other) return null; ends.push(other)
          }
        }
        if (!leftEnds.every(p => near(p, leftEnds[0]!)) || !rightEnds.every(p => near(p, rightEnds[0]!)) || leftEnds[0]!.x >= Math.min(...items.map(item => item.left.x)) || rightEnds[0]!.x <= Math.max(...items.map(item => item.right.x))) return null
        const result = { ast: { kind: input.family === 'railroad-peg' ? 'ordered-choice' : 'choice', items: byY.map(item => item.ast) }, left: leftEnds[0]!, right: rightEnds[0]!, box: box(element), elements: [...routes, ...items.flatMap(item => item.elements)] }; parsed.set(element, result); return result
      }
      if (items.length === 1 && routes.length >= 3 && routes.length <= 4) {
        const child = items[0]!, straight = routes.filter(route => { const b = box(route); return b.height < 1 && b.width > 1 }), left = straight.find(route => endPoints(route).some(p => near(p, child.left))), right = straight.find(route => endPoints(route).some(p => near(p, child.right)))
        if (!left || !right || left === right) return null
        const leftOuter = endPoints(left).find(p => !near(p, child.left)), rightOuter = endPoints(right).find(p => !near(p, child.right)); if (!leftOuter || !rightOuter) return null
        const others = routes.filter(route => route !== left && route !== right), bypass = others.filter(route => { const ends = endPoints(route); return ends.some(p => near(p, leftOuter)) && ends.some(p => near(p, rightOuter)) && box(route).y < child.box.y - 2 }), loops = others.filter(route => { const ends = endPoints(route); if (!ends.some(p => near(p, child.left)) || !ends.some(p => near(p, child.right))) return false; const b = box(route); return b.y + b.height > child.box.y + child.box.height + 2 })
        if (bypass.length > 1 || loops.length > 1 || bypass.length + loops.length !== others.length || !bypass.length && !loops.length) return null
        const result = { ast: { kind: 'repeat', minimum: bypass.length ? 0 : 1, maximum: loops.length ? null : 1, expression: child.ast }, left: leftOuter, right: rightOuter, box: box(element), elements: [...routes, ...child.elements] }; parsed.set(element, result); return result
      }
      return null
    }
    const grammarOwned = new Set<Element>(); const rules: any[] = facts['grammar-rules'] ?? [], observations = rules.map(rule => {
      const names = text.filter(element => { const value = norm(element.textContent ?? ''); return /\s=\s*$/.test(value) && value.replace(/\s*=\s*$/, '') === rule.name }), name = names.length === 1 ? names[0] : undefined
      let result: Expression | null = null, owner: Element | null = name?.parentElement ?? null
      while (owner && owner !== svg && !result) { const groups = directGroups(owner).filter(group => !group.contains(name!)); const candidates = groups.map(expression).filter((item): item is Expression => !!item); if (candidates.length === 1) result = candidates[0]!; else owner = owner.parentElement }
      if (!result || !owner) return { name: rule.name, actual: null, ports: null, inventory: null }
      const dots = [...owner.querySelectorAll('circle')].filter(dot => visible(dot) && box(dot).width <= 12), routes = directPaths(owner), orderedDots=dots.sort((a,b)=>center(box(a)).x-center(box(b)).x), entryBox=orderedDots[0]?box(orderedDots[0]):null, exitBox=orderedDots[1]?box(orderedDots[1]):null, boundEntry=entryBox?routes.filter(route=>{const ends=endPoints(route);return ends.some(p=>near(p,result!.left))&&ends.some(p=>distance(p,entryBox)<=1)}):[],boundExit=exitBox?routes.filter(route=>{const ends=endPoints(route);return ends.some(p=>near(p,result!.right))&&ends.some(p=>distance(p,exitBox)<=1)}):[],connected=dots.length===2&&routes.length===2&&center(entryBox!).x<result.left.x&&center(exitBox!).x>result.right.x&&boundEntry.length===1&&boundExit.length===1&&boundEntry[0]!==boundExit[0]
      for(const element of [...result.elements,...dots,...routes,name!])grammarOwned.add(element); return { name: rule.name, actual: result.ast, ports: [result.left, result.right], connected, inventory: result.elements.length, y: box(name!).y }
    })
    const available = rules.length > 0 && observations.every(rule => rule.actual && rule.connected)
    const observedNames = text.filter(element => /\s=\s*$/.test(norm(element.textContent ?? '')))
    add('grammar-rules', observations, available ? same(rules.map(rule => ({ name: rule.name, expression: rule.expression })), observations.map(rule => ({ name: rule.name, expression: rule.actual }))) && observedNames.length === rules.length && ordered(observations.map(rule => ({ x: 0, y: rule.y! })), 'y') : null, 'Actual owned terminal/reference outlines and physical connector endpoints recursively reconstruct sequence, vertical alternative order, optional bypasses and repetition loops for every rule. Start/end dots must connect each rule, inventories are exact, and renderer IDs/classes provide no grammar fact. Lookahead, finite repeat bounds and unfamiliar wiring remain unknown.')
    const uncoveredGlyphs=[...svg.querySelectorAll('path,polyline,polygon,image,use,foreignObject,rect,circle,ellipse,line,text')].filter(element=>{if(grammarOwned.has(element)||element.closest('defs,marker,clipPath,mask'))return false;const b=box(element);if(b.width+b.height<=0)return false;for(let owner:Element|null=element;owner;owner=owner.parentElement){const css=getComputedStyle(owner);if(css.display==='none'||['hidden','collapse'].includes(css.visibility)||Number(css.opacity)===0)return false;if(owner===svg)break}return true});if(typeof facts.title==='string'&&available&&!uncoveredGlyphs.length&&!text.some(element=>norm(element.textContent??'')===norm(facts.title)))add('title',{missing:facts.title,closedGrammarGlyphInventory:grammarOwned.size},false,'Every actual path/outline and terminal/reference caption belongs to the independently reconstructed grammar. No remaining image/use/path glyph can encode the absent requested title; grammar content or accessibility metadata cannot substitute for it.')
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
    const canonical = (edge: any) => [edge.source, edge.target].sort().join('\0'), expectedEdges = hierarchy.filter(entry => entry.parent).map(entry => ({ source: entry.parent, target: entry.id })), expectedKeys = expectedEdges.map(canonical).sort(), available = hierarchy.length > 0 && routesAvailable && observed.every(entry => entry.box && (!entry.shape || ['circle', 'rectangle', 'rounded'].includes(entry.shape) && entry.actualShape)) && connections.every(edge => edge.source && edge.target)
    const valid = new Set(observed.map(entry => entry.owner)).size === hierarchy.length && same(expectedKeys, connections.map(canonical).sort()) && observed.every(entry => !entry.shape || entry.actualShape === entry.shape || entry.shape === 'rectangle' && entry.actualShape === 'rounded') && exactText(input.expected.labels)
    add('hierarchy', { nodes: observed.map(({ owner: _, ...entry }) => entry), connections }, available ? valid : null, 'The complete rooted hierarchy is reconstructed from independently owned bodies and exact actual connector endpoint pairs; requested primitive shapes are measured from their outlines. Radial sibling placement is not invented from DOM order; compound shapes and unbound connectors stay unknown.')
    const edgeContract = input.expected.edges ?? [], edgeProfile = edgeContract.every(edge => !edge.directed && !edge.label) && same(edgeContract.map(canonical).sort(), expectedKeys)
    if (edgeContract.length) quantitative('painted-relationships', edgeContract, connections, available && edgeProfile ? valid : null, 'Complete mindmap relationship multiplicity comes from actual exposed strokes between uniquely owned node bodies. Endpoint portions may be covered only by their independently measured owner bodies; extra, missing, hidden or unbound routes cannot gain relationship credit.')
    for (const group of input.expected.groups ?? []) {
      const children = hierarchy.filter(entry => entry.parent === group.id).map(entry => entry.id)
      quantitative('painted-group:' + group.id, group, { id: group.id, members: children, representation: 'connector-owned hierarchy' }, available && same([...group.members].sort(), [...children].sort()) ? valid : null, 'Mindmap membership is the immediate rooted connector hierarchy, measured from owned bodies and exposed route inventory. An authored parent is not required to draw a separate enclosing container.')
    }
    add('tree-order', null, null, 'A radial mindmap drawing does not uniquely print a depth-first source traversal; exact hierarchy is observed independently, while source traversal remains a required unknown.')
  }
  if (input.family === 'ishikawa') {
    const hierarchy: any[] = facts['cause-hierarchy'] ?? [], lines = paths.filter(path => path.localName === 'line'), effect = hierarchy.find(entry => entry.kind === 'effect')
    const longest = lines.filter(line => box(line).height < 1).sort((a, b) => box(b).width - box(a).width)[0], lineEnds = lines.map(line => ({ line, ends: endPoints(line) }))
    const distanceToSegment = (p: { x: number; y: number }, ends: { x: number; y: number }[]) => { const [a, b] = ends as [{ x: number; y: number }, { x: number; y: number }], dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))); return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) }
    const bindings = hierarchy.filter(entry => entry.kind !== 'effect').map(entry => {
      const compact = (value: string) => norm(value).replace(/\s/g, ''), wanted = compact(entry.label), labels = text.filter(e => compact(e.textContent ?? '') === wanted), e = labels.length === 1 ? labels[0] : undefined, b = e ? box(e) : null
      const ranked = b ? lineEnds.filter(item => item.line !== longest).flatMap(item => item.ends.map((p, end) => ({ ...item, end, point: p, distance: distance(p, b) }))).sort((a, b) => a.distance - b.distance) : []
      const binding = ranked[0] && ranked[0].distance <= Math.max(5, b!.height * .4) && (!ranked[1] || ranked[1].distance - ranked[0].distance > 1.5) ? ranked[0] : undefined
      return { ...entry, labelBox: b, binding }
    })
    let available = !!longest && !!effect && bindings.every(entry => entry.binding) && new Set(bindings.map(entry => entry.binding?.line)).size === bindings.length, valid = lines.length === hierarchy.length
    const observed = bindings.map(entry => {
      const far = entry.binding?.ends[1 - entry.binding.end], parents = [{ id: effect?.id, line: longest }, ...bindings.filter(parent => parent.id !== entry.id).map(parent => ({ id: parent.id, line: parent.binding?.line }))].flatMap(parent => { const ends = parent.line ? lineEnds.find(item => item.line === parent.line)?.ends : null; return far && ends ? [{ id: parent.id, distance: distanceToSegment(far, ends), interior: parent.id === effect?.id || ends.every(p => Math.hypot(p.x - far.x, p.y - far.y) > 2) }] : [] }).filter(parent => parent.distance <= 2 && parent.interior), actualParent = parents.length === 1 ? parents[0]!.id : null
      if (!actualParent) available = false
      else if (actualParent !== entry.parent) valid = false
      return { id: entry.id, label: entry.label, parent: actualParent, expectedParent: entry.parent, labelBox: entry.labelBox, branch: entry.binding?.ends ?? null, parentAttachmentDistance: parents.length === 1 ? parents[0]!.distance : null, candidateParents: parents.map(parent => parent.id) }
    })
    const effectKey = effect ? norm(effect.label).replace(/\s/g, '') : '', effectLabel = effect ? text.find(e => norm(e.textContent ?? '').replace(/\s/g, '') === effectKey) : undefined, effectShape = body(effectLabel), effectBox = effectShape ? box(effectShape) : null
    if (!effectBox || !longest || !endPoints(longest).some(p => distance(p, effectBox) <= 2)) available = false
    add('cause-hierarchy', { effect: effectBox, causes: observed }, available ? valid : null, 'Every cause owns a unique visible branch endpoint beside its label, and the other endpoint attaches to the measured parent branch or main spine within2px. Exact branch inventory and a separately owned effect head prevent label-only hierarchy credit. Ambiguous labels/endpoints remain unknown.')
    add('effect', effectBox ? { label: effect?.label, box: effectBox } : null, available ? valid : null, 'The effect label owns the distinct head outline attached to the main spine; a matching cause label cannot supply the effect role.')
    const edgeContract = input.expected.edges ?? [], inferred = observed.map(entry => ({ source: entry.parent, target: entry.id, label: '', directed: true })), edgeKey = (edge: any) => [edge.source, edge.target, edge.label ?? '', edge.directed].join('\0'), edgeProfile = edgeContract.every(edge => edge.directed && !edge.label)
    if (edgeContract.length) quantitative('painted-relationships', edgeContract, inferred, available && edgeProfile ? valid && same(edgeContract.map(edgeKey).sort(), inferred.map(edgeKey).sort()) : null, 'A fishbone relationship is the rooted cause hierarchy: the actual far endpoint of each owned cause branch has exactly one parent branch/spine attachment among all candidates. This independently reconstructs logical parent direction and exact multiplicity without inventing painted arrowheads.')
    const canvasBounds = box(svg), unfamiliarBodies = shapes.filter(shape => { if (shape === effectShape) return false; const b = box(shape); return !bindings.some(entry => entry.labelBox && inside(b, entry.labelBox)) && !(b.width >= canvasBounds.width * .9 && b.height >= canvasBounds.height * .9) }), nodeContract = input.expected.nodes ?? [], identities = [effect?.id, ...observed.map(entry => entry.id)], exactCaptions = exactText(input.expected.labels)
    if (nodeContract.length) quantitative('painted-node-ownership', nodeContract.map(node => node.id), { effect: effectBox ? { id: effect?.id, body: effectBox } : null, causes: observed }, available && !unfamiliarBodies.length && exactCaptions ? lines.length === hierarchy.length && same(nodeContract.map(node => node.id).sort(), identities.sort()) : null, 'In the finite fishbone profile, the effect owns its distinct head and each cause owns a unique text/branch endpoint, with optional enclosing label box. Exact source caption, branch and identity inventories establish node ownership without requiring a rectangle around every cause; compound extra bodies and ambiguous text remain unknown.')
  }
  if (input.family === 'gitgraph') {
    const commits: any[] = facts.commits ?? [], branches: any[] = facts.branches ?? [], settings = facts['authored-config']?.gitGraph ?? {}, hidden = facts['hidden-git-labels'] ?? []
    const vertical = ['TB', 'BT'].includes(input.expected.advisoryFacts?.direction as string), reverse = input.expected.advisoryFacts?.direction === 'BT', axis = vertical ? 'y' : 'x', lane = vertical ? 'x' : 'y', sign = reverse ? -1 : 1
    const hiddenBranches = settings.showBranches === false, hiddenCommits = settings.showCommitLabel === false
    const allGeometry = [...svg.querySelectorAll('path,line,polyline')].filter(e => !e.closest('defs,marker,clipPath,mask')) as SVGGeometryElement[]
    const candidates = shapes.filter(shape => {
      if (!['circle', 'rect'].includes(shape.localName)) return false
      const b = box(shape), local = shape.getBBox()
      return b.width >= 8 && b.width <= 32 && Math.abs(b.width - b.height) < 1 && Math.abs(local.width - local.height) < .5
    })
    const candidateBoxes = candidates.map(box), glyphs = candidates.filter((shape, i) => { const s = candidateBoxes[i]!, sc = center(s); return !candidates.some((other, j) => { if (other === shape) return false; const o = candidateBoxes[j]!, oc = center(o); return Math.hypot(sc.x - oc.x, sc.y - oc.y) < 1 && o.width > s.width + 1 }) })
    const expectedOrder = [...branches].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)).map(branch => branch.id), laneValues: number[] = []
    for (const glyph of glyphs) { const value = center(box(glyph))[lane]; if (!laneValues.some(old => Math.abs(old - value) < 3)) laneValues.push(value) }
    laneValues.sort((a, b) => a - b)
    const branchRows = branches.map(branch => { const e = label(branch.id), enclosing = body(e), eb = e ? box(e) : null, enclosingBox = enclosing ? box(enclosing) : null, heading = eb && enclosingBox && enclosingBox.width <= eb.width + 30 && enclosingBox.height <= eb.height + 15 ? enclosing : undefined, c = eb ? center(heading ? enclosingBox! : eb) : null, index = expectedOrder.indexOf(branch.id); return { ...branch, element: e, center: c, lane: hiddenBranches && laneValues.length === branches.length ? laneValues[index] : c?.[lane] ?? null } })
    const laneFor = (glyph: SVGGeometryElement) => { const value = center(box(glyph))[lane]; return branchRows.filter(branch => branch.lane !== null && Math.abs(branch.lane - value) < 3) }
    const laneRows = new Map<string, SVGGeometryElement[]>(), laneGlyphs = (id: string) => { if (!laneRows.has(id)) laneRows.set(id, glyphs.filter(glyph => { const owners = laneFor(glyph); return owners.length === 1 && owners[0]!.id === id }).sort((a, b) => sign * (center(box(a))[axis] - center(box(b))[axis]))); return laneRows.get(id)! }
    const rankings = new Map<Element, { item: SVGGeometryElement; d: number }[]>(), uniqueNear = (e: Element, glyph: SVGGeometryElement) => {
      if (!rankings.has(e)) { const c = center(box(e)); rankings.set(e, glyphs.map(item => { const p = center(box(item)); return { item, d: Math.hypot(p.x - c.x, p.y - c.y) } }).sort((a, b) => a.d - b.d)) }
      const ranked = rankings.get(e)!
      return ranked[0]?.item === glyph && ranked[0].d <= 55 && (!ranked[1] || ranked[1].d - ranked[0].d > 2)
    }
    const captions = new Map<SVGGeometryElement, Element>(), captionBackgrounds = new Map<SVGGeometryElement, Element>()
    const printedTags = new Set(commits.flatMap(commit => commit.tags ?? []).map(norm)), printedBranches = new Set(branches.map(branch => norm(branch.id))), captionTexts = text.filter(e => { const value = norm(e.textContent ?? ''); return !printedBranches.has(value) && !printedTags.has(value) && !/^cherry-pick:.*\|parent:/.test(value) })
    for (const glyph of glyphs) {
      const found = captionTexts.filter(e => uniqueNear(e, glyph))
      if (found.length !== 1) continue
      captions.set(glyph, found[0]!)
      const fb = box(found[0]!), owners = rectangles.filter(rect => { const b = box(rect); return inside(b, fb) && b.width <= fb.width + 12 && b.height <= fb.height + 12 }).sort((a, b) => box(a).width * box(a).height - box(b).width * box(b).height)
      if (owners[0] && !glyphs.includes(owners[0] as SVGGeometryElement)) captionBackgrounds.set(glyph, owners[0])
    }
    const ordinals = new Map<unknown, number>(), glyphFor = commits.map(commit => {
      const ordinal = ordinals.get(commit.branch) ?? 0; ordinals.set(commit.branch, ordinal + 1)
      return laneGlyphs(commit.branch)[ordinal]
    })
    const glyphForBoxes = glyphFor.map(glyph => glyph ? box(glyph) : null), captionProfile = glyphFor.every((glyph, index) => commits[index].mergedBranch && !commits[index].authoredId || !!glyph && captions.has(glyph))
    const identityAvailable = commits.length > 0 && glyphs.length === commits.length && branchRows.every(branch => branch.lane !== null) && glyphs.every(glyph => laneFor(glyph).length === 1) && new Set(glyphFor).size === commits.length && glyphFor.every(Boolean)
    const glyphParts = new Map<SVGGeometryElement, Set<Element>>()
    let labelsKnown = identityAvailable, authoredKnown = identityAvailable, typesKnown = true, labelsValid = true, typesValid = true
    const observed = commits.map((commit, i) => {
      const glyph = glyphFor[i], gb = glyphForBoxes[i] ?? null, c = gb ? center(gb) : null, branch = glyph ? laneFor(glyph) : [], caption = glyph ? captions.get(glyph) : undefined
      const authored = commit.authoredId ?? (!/^commit:\d+$/.test(commit.id) ? commit.id : null)
      if (authored && !hiddenCommits) { if (!caption) { labelsKnown = false; authoredKnown = false }; if (caption && norm(caption.textContent ?? '') !== norm(authored)) labelsValid = false }
      if (glyph && commit.type === 'NORMAL' && branch[0]?.id === commit.branch) themeCommitOwners.set(commit.id, glyph)
      const nested = gb ? candidates.filter((other, j) => { if (other === glyph) return false; const o = candidateBoxes[j]!, oc = center(o); return Math.hypot(oc.x - c!.x, oc.y - c!.y) < 1 && o.width < gb.width - 1 }) : []
      const marks = gb ? allGeometry.filter(mark => { const b = box(mark); return b.width >= gb.width * .25 && b.width < gb.width * .8 && b.height >= gb.height * .25 && b.height < gb.height * .8 && Math.hypot(center(b).x - c!.x, center(b).y - c!.y) < 1 }) : []
      const crosses = marks.filter(mark => {
        const segments = linearSegments(mark); if (segments.length !== 2 || !visible(mark)) return false
        const [a, b] = segments as [{ x: number; y: number }[], { x: number; y: number }[]], midpoint = (ends: { x: number; y: number }[]) => ({ x: (ends[0]!.x + ends[1]!.x) / 2, y: (ends[0]!.y + ends[1]!.y) / 2 })
        return segments.every(ends => Math.abs(Math.abs(ends[1]!.x - ends[0]!.x) - Math.abs(ends[1]!.y - ends[0]!.y)) < 1) && Math.hypot(midpoint(a).x - c!.x, midpoint(a).y - c!.y) < 1 && Math.hypot(midpoint(b).x - c!.x, midpoint(b).y - c!.y) < 1 && (a[1]!.x - a[0]!.x) * (a[1]!.y - a[0]!.y) * (b[1]!.x - b[0]!.x) * (b[1]!.y - b[0]!.y) < 0 && color(getComputedStyle(mark).stroke)?.rgb !== color(getComputedStyle(glyph!).fill)?.rgb
      })
      const fruit = gb ? shapes.filter(shape => { if (shape.localName !== 'circle' || shape === glyph) return false; const s = box(shape); return inside(gb, s) && s.width >= gb.width * .2 && s.width <= gb.width * .35 && center(s).y > c!.y && color(getComputedStyle(shape).fill)?.rgb !== color(getComputedStyle(glyph!).fill)?.rgb }) : []
      const stems = glyph && fruit.length === 2 ? allGeometry.filter(mark => mark.localName === 'line' && inside(gb!, box(mark)) && visible(mark) && color(getComputedStyle(mark).stroke)?.rgb !== color(getComputedStyle(glyph).fill)?.rgb).map(mark => endPoints(mark)) : []
      const cherryIcon = fruit.length === 2 && stems.length === 2 && Math.abs(center(box(fruit[0]!)).y - center(box(fruit[1]!)).y) < 1 && Math.abs((center(box(fruit[0]!)).x + center(box(fruit[1]!)).x) / 2 - c!.x) < 1 && fruit.every(item => { const f = box(item), fc = center(f); return stems.some(ends => ends.some(p => Math.hypot(p.x - fc.x, p.y - fc.y) < f.width / 2)) }) && stems.every(ends => ends.some(p => Math.abs(p.x - c!.x) < 1 && p.y < c!.y))
      const annotations = glyph ? text.flatMap(e => { const parsed = /^cherry-pick:(.+)\|parent:(.+)$/.exec(norm(e.textContent ?? '')); return parsed && uniqueNear(e, glyph) ? [{ source: parsed[1]!, parent: parsed[2]!, box: box(e) }] : [] }) : []
      const type = cherryIcon ? 'CHERRY_PICK' : glyph?.localName === 'rect' && nested.some(other => other.localName === 'rect') ? 'HIGHLIGHT' : glyph?.localName === 'circle' && crosses.length === 1 ? 'REVERSE' : glyph?.localName === 'circle' && !marks.length ? 'NORMAL' : null
      if (glyph && type) glyphParts.set(glyph, new Set<Element>([glyph, ...(type === 'NORMAL' ? nested : type === 'HIGHLIGHT' ? nested.filter(part => part.localName === 'rect') : type === 'REVERSE' ? crosses : [...fruit, ...allGeometry.filter(mark => mark.localName === 'line' && inside(gb!, box(mark)) && visible(mark))])]))
      if (!type || !['NORMAL', 'HIGHLIGHT', 'REVERSE', 'CHERRY_PICK'].includes(commit.type)) typesKnown = false
      if (type && ['NORMAL', 'HIGHLIGHT', 'REVERSE'].includes(commit.type) && type !== commit.type) typesValid = false
      const tags = (commit.tags ?? []).map((tag: string) => { const t = label(tag), b = t ? box(t) : null; return { label: tag, box: b, owned: !!b && !!glyph && uniqueNear(t!, glyph) } })
      if (tags.some((tag: any) => !tag.owned)) labelsKnown = false
      return { id: commit.id, label: authored, branch: branch[0]?.id ?? null, center: c, type, tags, cherryAnnotation: annotations.length === 1 ? annotations[0] : null, caption: caption ? norm(caption.textContent ?? '') : null }
    })
    const bind = (p: { x: number; y: number }) => { const ranked = glyphForBoxes.flatMap((g, index) => g ? [{ index, d: Math.hypot(center(g).x - p.x, center(g).y - p.y), radius: g.width / 2 }] : []).sort((a, b) => a.d - b.d); return ranked[0] && ranked[0].d <= ranked[0].radius + 3 && (!ranked[1] || ranked[1].d - ranked[0].d > 2) ? ranked[0].index : null }
    const state = (element: Element): number | false | null => {
      let alpha = 1
      for (let owner: Element | null = element; owner; owner = owner.parentElement) { const css = getComputedStyle(owner); if (css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || Number(css.opacity) === 0) return false; if (css.clipPath !== 'none' || css.maskImage !== 'none' || css.filter !== 'none' || css.mixBlendMode !== 'normal' || css.vectorEffect !== 'none') return null; alpha *= Number(css.opacity); if (owner === svg) break }
      return alpha
    }
    const baselineFor = (geometry: SVGGeometryElement, branch: any) => { const ends = endPoints(geometry), row = laneGlyphs(branch.id); return linearSegments(geometry).length === 1 && state(geometry) !== false && !!color(getComputedStyle(geometry).stroke) && ends.length === 2 && branch.lane !== null && ends.every(p => Math.abs(p[lane] - branch.lane) < 3) && Math.abs(ends[1]![axis] - ends[0]![axis]) > 30 && (bind(ends[0]!) === null || bind(ends[1]!) === null) && (!row.length || Math.min(ends[0]![axis], ends[1]![axis]) < Math.min(...row.map(glyph => center(box(glyph))[axis])) - 3 && Math.max(ends[0]![axis], ends[1]![axis]) > Math.max(...row.map(glyph => center(box(glyph))[axis])) + 3) }
    // Image pixels and referenced use content are not decoded here. Their
    // computed fill:none cannot prove transparency; only overlapping owned
    // geometry loses exposure proof, rather than rejecting every such SVG.
    const coverRecords = [...svg.querySelectorAll('rect,circle,ellipse,polygon,path,line,polyline,image,use,foreignObject,text')].filter(cover => !cover.closest('defs,marker,clipPath,mask')).map(cover => { const css = getComputedStyle(cover), matrix = (cover as SVGGraphicsElement).getScreenCTM(), measured = box(cover), stroke = color(css.stroke), padding = stroke && Number(css.strokeOpacity) > 0 && matrix ? Number.parseFloat(css.strokeWidth) / 2 * Math.hypot(matrix.a, matrix.b, matrix.c, matrix.d) : 0, bounds = { x: measured.x - padding, y: measured.y - padding, width: measured.width + padding * 2, height: measured.height + padding * 2 }; return { cover, css, fill: color(css.fill), stroke, opacity: state(cover), bounds, matrix, unprojectedPaint: ['image', 'use'].includes(cover.localName) } })
    for (const [glyph, parts] of glyphParts) for (const part of parts) {
      if (!(part instanceof SVGGeometryElement) || state(part) === null) { typesKnown = false; continue }
      const css = getComputedStyle(part), partBox = box(part), fill = color(css.fill), stroke = color(css.stroke), painted = [fill && Number(css.fillOpacity) > 0 ? fill : null, stroke && Number(css.strokeOpacity) > 0 && Number.parseFloat(css.strokeWidth) > 0 ? stroke : null].filter(Boolean), prior = coverRecords.filter(item => item.cover !== part && item.cover.localName === 'rect' && item.matrix && Math.abs(item.matrix.b) < 1e-8 && Math.abs(item.matrix.c) < 1e-8 && !Number(item.cover.getAttribute('rx')) && !Number(item.cover.getAttribute('ry')) && item.opacity !== null && item.opacity !== false && item.fill && item.fill.alpha * Number(item.css.fillOpacity) * item.opacity >= 1 && !!(item.cover.compareDocumentPosition(part) & Node.DOCUMENT_POSITION_FOLLOWING) && inside(box(item.cover), partBox)).at(-1), background = part !== glyph ? color(getComputedStyle(glyph).fill) : prior?.fill ?? color(getComputedStyle(svg).backgroundColor) ?? color(getComputedStyle(document.body).backgroundColor) ?? color('Canvas')
      if (!painted.length || background && painted.every(paint => paint!.rgb === background.rgb)) typesKnown = false
      const points = sample(part, 128)
      for (const item of coverRecords) {
        if (parts.has(item.cover) || item.opacity === false || !(part.compareDocumentPosition(item.cover) & Node.DOCUMENT_POSITION_FOLLOWING) || !item.matrix) continue
        const fillPaint = item.fill && Number(item.css.fillOpacity) > 0, strokePaint = item.stroke && Number(item.css.strokeOpacity) > 0 && Number.parseFloat(item.css.strokeWidth) > 0
        if (!fillPaint && !strokePaint && !item.unprojectedPaint) continue
        const opacity = item.opacity === null ? 1 : item.opacity, strength = (item.unprojectedPaint ? 1 : Math.max((item.fill?.alpha ?? 0) * Number(item.css.fillOpacity), (item.stroke?.alpha ?? 0) * Number(item.css.strokeOpacity))) * opacity
        if (strength < 1 / 255) continue
        const inverse = item.matrix.inverse(), covered = points.some(p => { if (!inside(item.bounds, { x: p.x, y: p.y, width: 0, height: 0 }, 0)) return false; const local = new DOMPoint(p.x, p.y).matrixTransform(inverse); return item.cover instanceof SVGGeometryElement ? !!(fillPaint && item.cover.isPointInFill(local) || strokePaint && item.cover.isPointInStroke(local)) : true })
        if (covered) typesKnown = false
      }
    }
    const routeGaps = new Map<SVGGeometryElement, string>()
    const routeVisible = (route: SVGGeometryElement, a: number, b: number): boolean | null => {
      const unavailable = (reason: string) => { routeGaps.set(route, reason); return null }
      const css = getComputedStyle(route), ink = color(css.stroke), alpha = state(route), matrix = route.getScreenCTM()
      if (alpha === false || !ink || !Number.parseFloat(css.strokeWidth) || !Number(css.strokeOpacity)) return false
      if (alpha === null || !matrix || ink.alpha * Number(css.strokeOpacity) * alpha < 1 / 255 || Number.parseFloat(css.strokeWidth) * Math.min(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)) < .25) return null
      const points = sample(route, 512), endpoints = [glyphFor[a]!, glyphFor[b]!], endpointBoxes = [glyphForBoxes[a]!, glyphForBoxes[b]!]
      const routeBounds = box(route), backdrop = color(getComputedStyle(svg).backgroundColor) ?? color(getComputedStyle(document.body).backgroundColor) ?? color('Canvas')
      if (backdrop?.alpha === 1 && backdrop.rgb === ink.rgb) return unavailable('Stroke has no independently proven contrast from the actual host canvas')
      if (coverRecords.some(item => item.cover !== route && item.fill?.rgb === ink.rgb && item.opacity !== null && item.opacity !== false && item.fill.alpha * Number(item.css.fillOpacity) * item.opacity >= 1 && item.cover.compareDocumentPosition(route) & Node.DOCUMENT_POSITION_FOLLOWING && inside(item.bounds, routeBounds))) return unavailable('Stroke matches an independently painted enclosing background')
      for (const { cover, css: cs, fill, stroke, opacity, bounds, matrix: transform, unprojectedPaint } of coverRecords) {
        if (cover === route || !(route.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING) || opacity === false || !(unprojectedPaint || fill && Number(cs.fillOpacity) > 0 || stroke && Number(cs.strokeOpacity) > 0 && Number.parseFloat(cs.strokeWidth) > 0) || bounds.x > routeBounds.x + routeBounds.width || bounds.x + bounds.width < routeBounds.x || bounds.y > routeBounds.y + routeBounds.height || bounds.y + bounds.height < routeBounds.y) continue
        if (!transform) return null
        const inverse = transform.inverse(), hits = points.flatMap((p, index) => { if (p.x < bounds.x || p.x > bounds.x + bounds.width || p.y < bounds.y || p.y > bounds.y + bounds.height) return []; const local = new DOMPoint(p.x, p.y).matrixTransform(inverse); return 'isPointInFill' in cover ? fill && Number(cs.fillOpacity) > 0 && (cover as SVGGeometryElement).isPointInFill(local) || stroke && Number(cs.strokeOpacity) > 0 && Number.parseFloat(cs.strokeWidth) > 0 && (cover as SVGGeometryElement).isPointInStroke(local) ? [index] : [] : [index] })
        if (!hits.length) continue
        const exposedHits = hits.filter(index => !endpoints.some((glyph, k) => { const g = endpointBoxes[k]!, c = center(g); return glyph.localName === 'circle' ? Math.hypot(points[index]!.x - c.x, points[index]!.y - c.y) <= g.width / 2 + 1 : distance(points[index]!, g) <= 1 }))
        if (!exposedHits.length) continue
        if (unprojectedPaint) return unavailable('Unprojected overlapping ' + cover.localName + ' paint; its bounds cannot prove exposed route ink')
        if (endpoints.includes(cover as SVGGeometryElement) || endpointBoxes.some(g => inside(g, box(cover)) && hits.every(index => distance(points[index]!, g) < 1))) continue
        // A commit is a compound painted owner: glyph plus its uniquely nearby
        // caption/backdrop. Only the route's own endpoint compound may cover its
        // initial/final interval; an interior or unrelated caption cannot.
        const owner = endpoints.find(glyph => captions.get(glyph) === cover || captionBackgrounds.get(glyph) === cover)
        if (owner) { const endpoint = owner === glyphFor[a] ? points[0]! : points.at(-1)!, ob = box(owner), c = center(ob); if (Math.hypot(endpoint.x - c.x, endpoint.y - c.y) <= ob.width / 2 + 3 && (owner === glyphFor[a] ? Math.max(...hits) < 256 : Math.min(...hits) > 256)) continue }
        if (opacity !== null && stroke && stroke.alpha * Number(cs.strokeOpacity) * opacity >= 1 / 255 && stroke.rgb !== backdrop?.rgb && cover instanceof SVGGeometryElement && allGeometry.includes(cover) && !/[zZ]/.test(cover.getAttribute('d') ?? '') && !fill && stroke) { const ends = endPoints(cover), other = ends.length === 2 ? ends.map(bind) : []; const common = [a, b].find(index => other.includes(index)); if (other.length === 2 && other[0] !== other[1] && other.every(index => index !== null)) {
          const connectorWidth = Number.parseFloat(cs.strokeWidth) * Math.max(Math.hypot(transform.a, transform.b), Math.hypot(transform.c, transform.d)), singleInterval = hits.every((index, i) => !i || index - hits[i - 1]! <= 2)
          if (common !== undefined && singleInterval && hits.length < points.length - 2 && connectorWidth <= Math.min(...other.map(index => glyphForBoxes[index!]!.width)) && (common === a ? Math.min(...hits) <= 2 : Math.max(...hits) >= 510)) continue
          const first = Math.min(...hits), last = Math.max(...hits), routeLength = route.getTotalLength() * Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)), otherPoints = sample(cover, 256), middle = points[Math.round((first + last) / 2)]!, nearest = otherPoints.map((p, index) => ({ index, d: Math.hypot(p.x - middle.x, p.y - middle.y) })).sort((a, b) => a.d - b.d)[0], at = Math.max(1, Math.min(255, nearest?.index ?? 0)), i = Math.max(1, Math.min(511, Math.round((first + last) / 2))), u = { x: points[i + 1]!.x - points[i - 1]!.x, y: points[i + 1]!.y - points[i - 1]!.y }, v = { x: otherPoints[at + 1]!.x - otherPoints[at - 1]!.x, y: otherPoints[at + 1]!.y - otherPoints[at - 1]!.y }, sine = Math.abs(u.x * v.y - u.y * v.x) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)), ownWidth = Number.parseFloat(css.strokeWidth) * Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)), otherWidth = Number.parseFloat(cs.strokeWidth) * Math.max(Math.hypot(transform.a, transform.b), Math.hypot(transform.c, transform.d))
          if (first > 2 && last < 510 && last - first < 128 && sine > .5 && (last - first) / 512 * routeLength <= 3 * (ownWidth + otherWidth) && otherWidth <= Math.min(...other.map(index => glyphForBoxes[index!]!.width))) continue
        } }
        if (cover.localName === 'text') return unavailable('Unowned/interior text overpaint: ' + norm(cover.textContent ?? ''))
        if (opacity === null || cs.filter !== 'none' || cs.mixBlendMode !== 'normal') return null
        const coverAlpha = Math.max((fill?.alpha ?? 0) * Number(cs.fillOpacity), (stroke?.alpha ?? 0) * Number(cs.strokeOpacity)) * opacity
        // Unrelated opaque bodies or unfamiliar compound paint do not qualify.
        if (coverAlpha >= 1 / 255) return unavailable('Unowned/interior ' + cover.localName + ' fill overpaint, alpha=' + coverAlpha + ', bounds=' + JSON.stringify(bounds))
      }
      return true
    }
    let routesKnown = identityAvailable
    const routes: { source: string; target: string; visible: boolean | null; unavailableBecause?: string }[] = []
    for (const path of allGeometry) {
      if (path.localName === 'path' && (/[zZ]/.test(path.getAttribute('d') ?? '') || (path.getAttribute('d')?.match(/[mM]/g)?.length ?? 0) !== 1)) continue
      const ends = endPoints(path); if (ends.length !== 2) { routesKnown = false; continue }
      const a = bind(ends[0]!), b = bind(ends[1]!); if (a === null || b === null) { const baseline = branchRows.some(branch => baselineFor(path, branch)); if (!baseline && state(path) !== false) routesKnown = false; continue }; if (a === b) continue
      if (filled(path) && linearSegments(path).length !== 1) { routesKnown = false; continue }
      const earlier = Math.min(a, b), later = Math.max(a, b), painted = routeVisible(path, a, b)
      if (painted === null) routesKnown = false
      if (painted !== false) routes.push({ source: commits[earlier].id, target: commits[later].id, visible: painted, ...(painted === null ? { unavailableBecause: routeGaps.get(path) ?? 'Unsupported stroke/transform/compositing' } : {}) })
    }
    const picked = observed.flatMap((item, index) => { if (commits[index].type !== 'CHERRY_PICK') return []; const annotation = item.cherryAnnotation, source = annotation ? observed.find(other => other.label === annotation.source)?.id : null, parent = annotation ? observed.find(other => other.label === annotation.parent)?.id : null; return [{ id: item.id, type: item.type, source, parent, expectedSource: commits[index].cherryPickSource, expectedParent: commits[index].cherryPickParent }] })
    const pickedKnown = picked.every(item => item.type === 'CHERRY_PICK' && item.source && (item.expectedParent === undefined || item.parent)), pickedValid = picked.every(item => item.source === item.expectedSource && (item.expectedParent === undefined || item.parent === item.expectedParent))
    const wanted = commits.flatMap(commit => [...commit.parents.map((parent: string) => ({ source: parent, target: commit.id })), ...(commit.type === 'CHERRY_PICK' ? [{ source: commit.cherryPickSource, target: commit.id }] : [])]), key = (edge: any) => edge.source + '\0' + edge.target
    const parentsValid = same(routes.map(key).sort(), wanted.map(key).sort())
    const physicalChronology = observed.map(commit => commit.center ? sign * commit.center[axis] : null), chronologyValid = settings.parallelCommits === true || physicalChronology.every((value, index) => value !== null && (!index || value > physicalChronology[index - 1]! + 1))
    const available = identityAvailable && labelsKnown && typesKnown && routesKnown && pickedKnown
    add('commits', { commits: observed, parents: routes, picked }, !labelsValid || !typesValid || pickedKnown && !pickedValid ? false : available ? parentsValid && chronologyValid && pickedValid : null, 'Unique physical lanes and per-lane chronology bind all commit glyphs; exact authored captions/tags have unique nearby owners. Measured circles, nested highlight squares and contrasting crossed diagonals establish supported types; actual exposed connector endpoints establish the complete parent multiset. Only each route endpoint’s independently owned glyph/caption compound may cover its adjacent interval; unrelated or interior overpaint remains unknown. Renderer IDs/classes and generated commit text supply no identity; Cherry-picks additionally require a physical two-fruit/stem mark and an independently owned visible origin/selected-parent annotation; its physical provenance connector is counted separately from its ordinary parent. Missing selected-parent encodings and unfamiliar glyphs remain unknown.')
    const heads = branchRows.map(branch => ({ id: branch.id, head: observed.findLast(commit => commit.branch === branch.id)?.id ?? null, requiresHead: Object.hasOwn(branch, 'head'), expectedHead: branch.head, lane: branch.lane }))
    const actualOrder = [...heads].sort((a, b) => Number(a.lane) - Number(b.lane)).map(branch => branch.id), orderProfile = branches.length <= 10 && branches.every((branch, index) => branch.order === undefined || Number.isFinite(branch.order) && (index === 0 ? branch.order >= 0 : branch.order > 0))
    const branchAvailable = identityAvailable && authoredKnown && heads.every(branch => !branch.requiresHead || branch.expectedHead !== null && branch.head !== null) && orderProfile
    add('branches', { heads, expectedOrder, actualOrder }, branchAvailable ? labelsValid && heads.every(branch => !branch.requiresHead || branch.head === branch.expectedHead) && same(expectedOrder, actualOrder) : null, 'Every visible branch heading owns one physical lane and complete glyph inventory; explicit hidden headings use only documented lane precedence and must have one nonempty measured lane each. Latest per-lane glyphs independently establish heads and source-owned stable branch order. Parent routing and special glyph type uncertainty cannot erase an otherwise proven lane/head fact; empty native pointers remain unknown.')
    const config = (path: string, actual: unknown, passed: boolean | null) => gitConfig.set(path, { actual, passed })
    const baselineLanes = branchRows.map(branch => { const matched = allGeometry.filter(line => baselineFor(line, branch)); return { id: branch.id, lines: matched.length, uninspectable: matched.some(line => { if (state(line) === null || !visible(line)) return true; const b = box(line); return coverRecords.some(item => item.cover !== line && !candidates.includes(item.cover as SVGGeometryElement) && !!(line.compareDocumentPosition(item.cover) & Node.DOCUMENT_POSITION_FOLLOWING) && item.stroke && Number(item.css.strokeOpacity) > 0 && Number.parseFloat(item.css.strokeWidth) > 0 && item.opacity !== false && inside(item.bounds, b)) }) } })
    config('gitGraph.showBranches', branchRows.map((branch, index) => ({ id: branch.id, visible: !!branch.element, baselines: baselineLanes[index]!.lines })), identityAvailable && !baselineLanes.some(row => row.uninspectable) ? branchRows.every((branch, index) => hiddenBranches ? !branch.element && baselineLanes[index]!.lines === 0 : !!branch.element && baselineLanes[index]!.lines > 0) : null)
    config('gitGraph.showCommitLabel', observed.map(commit => commit.caption), identityAvailable ? hiddenCommits ? glyphFor.every(glyph => !captions.has(glyph!)) : captionProfile : null)
    config('gitGraph.mainBranchName', branchRows[0]?.id, identityAvailable && branchRows[0]?.element ? norm(branchRows[0].element.textContent ?? '') === norm(settings.mainBranchName ?? branchRows[0].id) : null)
    config('gitGraph.mainBranchOrder', { expectedOrder, actualOrder }, branchAvailable ? same(expectedOrder, actualOrder) : null)
    const captionAngles = [...captions.values()].map(e => { const matrix = (e as SVGGraphicsElement).getScreenCTM(); return matrix ? Math.abs(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI) % 180 : null })
    config('gitGraph.rotateCommitLabel', captionAngles, identityAvailable && captionProfile && captionAngles.every(value => value !== null) ? captionAngles.every(value => settings.rotateCommitLabel ? Math.abs(value! - 45) < 1 || Math.abs(value! - 135) < 1 : value! < 1 || value! > 179) : null)
    const coordinates = observed.map(commit => commit.center ? sign * commit.center[axis] : null), generations = commits.map((commit, i) => { const parents = commit.parents.map((id: string) => commits.findIndex(parent => parent.id === id)); return parents.every((index: number) => index >= 0 && index < i) ? parents : null }), depths: number[] = []
    for (const parents of generations) depths.push(parents ? parents.length ? 1 + Math.max(...parents.map((index: number) => depths[index]!)) : 0 : NaN)
    const levelsValid = coordinates.every(value => value !== null) && (settings.parallelCommits ? coordinates.every((value, i) => coordinates.every((other, j) => depths[i] === depths[j] ? Math.abs(value! - other!) < 2 : Math.sign(value! - other!) === Math.sign(depths[i]! - depths[j]!))) : coordinates.every((value, i) => !i || value! > coordinates[i - 1]! + 1))
    config('gitGraph.parallelCommits', { coordinates, depths }, identityAvailable && depths.every(Number.isFinite) ? levelsValid : null)
    const captionPaint = (property: string) => [...captions.values()].map(e => getComputedStyle(e)[property as any]), captionFills = [...captionBackgrounds.values()].map(e => getComputedStyle(e).fill)
    const paintLeaf = (path: string, values: any[], numeric = false) => { const wanted = facts['authored-config']?.themeVariables?.[path.split('.').at(-1)!]; if (wanted === undefined) return; config(path, values, values.length && captionProfile && values.length === captions.size ? values.every(value => numeric ? Math.abs(Number.parseFloat(value) - Number.parseFloat(wanted)) < .1 : color(value)?.rgb === color(wanted)?.rgb) : null) }
    paintLeaf('themeVariables.commitLabelColor', captionPaint('fill')); paintLeaf('themeVariables.commitLabelFontSize', captionPaint('fontSize'), true); paintLeaf('themeVariables.commitLabelBackground', captionFills)
    const tags = commits.flatMap(commit => commit.tags ?? []), tagElements = tags.map((tag: string) => label(tag)), tagOwners = tagElements.map(e => body(e)), tagStyles = tagElements.map(e => e ? getComputedStyle(e) : null), ownerStyles = tagOwners.map(e => e ? getComputedStyle(e) : null)
    for (const [name, values] of [['tagLabelColor', tagStyles.map(css => css ? css.fill : null)], ['tagLabelFontSize', tagStyles.map(css => css ? css.fontSize : null)], ['tagLabelBackground', ownerStyles.map(css => css ? css.fill : null)], ['tagLabelBorder', ownerStyles.map(css => css ? css.stroke : null)]] as [string, (string | null)[]][]) { const wanted = facts['authored-config']?.themeVariables?.[name]; if (wanted !== undefined) config('themeVariables.' + name, values, tags.length && values.every(value => value !== null) ? values.every(value => name.endsWith('FontSize') ? Math.abs(Number.parseFloat(value!) - Number.parseFloat(wanted)) < .1 : color(value!)?.rgb === color(wanted)?.rgb) : null) }
    const hiddenPresence = hidden.map((entry: any) => ({ ...entry, present: text.some(e => norm(e.textContent ?? '') === norm(entry.kind === 'branch' ? entry.id : entry.authoredId)) })); add('hidden-git-labels', hiddenPresence, identityAvailable ? hiddenPresence.every((entry: any) => !entry.present) : null, 'Only explicitly source-suppressed branch headings/commit captions are absent. Their complete measured glyph topology and all tags remain required; missing ordinary labels never gain suppression credit.')
    add('git-operation-order', null, null, 'Individual checkout/branch command history has no unique printed inverse; the independent physical commit chronology, parents, lanes and heads retain their own checks.')
  }
  if (input.family === 'eventmodeling') {
    const frames: any[] = facts.frames ?? [], data: any[] = facts['data-definitions'] ?? [], config = facts['authored-config']?.themeVariables ?? {}
    const palette: Record<string, string> = { ui: config.emUiFill ?? 'white', processor: config.emProcessorFill ?? '#edb3f6', 'read-model': config.emReadModelFill ?? '#d3f1a2', command: config.emCommandFill ?? '#bcd6fe', event: config.emEventFill ?? '#ffb778' }
    const laneKind = (kind: string) => ['ui', 'processor'].includes(kind) ? 'UI/Automation' : ['command', 'read-model'].includes(kind) ? 'Command/Read Model' : 'Events'
    const boldCaptions = [...svg.querySelectorAll('foreignObject b')], foreignObjects = [...svg.querySelectorAll('foreignObject')], observed = frames.map(frame => {
      const parts = String(frame.label).split('.'), displayed = parts.length === 2 ? parts[1]! : frame.label, namespace = parts.length === 2 ? parts[0]! : null, html = boldCaptions.filter(element => norm(element.textContent ?? '') === norm(displayed) && visible(element))
      const prefix = { 'UI/Automation': 'UI/A: ', 'Command/Read Model': 'C/RM: ', Events: 'Stream: ' }[laneKind(frame.kind)]
      const typedLaneHeadings = (element: Element) => { const owner = body(element); if (!owner) return []; const ob = box(owner), rows = rectangles.filter(rect => { if (rect === owner) return false; const b = box(rect); return inside(b, ob) && b.width > ob.width + 30 }); return [...new Set(rows.flatMap(row => ownedText(row).filter(heading => box(heading).x < ob.x).map(heading => norm(textValue(heading))).filter(value => value.startsWith(prefix) && value.slice(prefix.length).trim())))] }
      const laneHeadings = namespace ? html.map(element => typedLaneHeadings(element)) : null, qualified = html.filter((element, i) => !namespace || laneHeadings![i]!.includes(prefix + namespace))
      // A unique caption with one complete actual typed namespace row also
      // binds a contrary identity. Expected namespace text must not filter
      // that negative witness away. Duplicate captions still need their exact
      // namespace lane; missing/ambiguous headings remain unavailable.
      const contrary = namespace && html.length === 1 && laneHeadings![0]!.length === 1 ? html[0] : undefined
      const head = qualified.length === 1 ? qualified[0] : !qualified.length ? contrary : undefined, owner = body(head), b = owner ? box(owner) : null
      const content = owner ? foreignObjects.filter(e => inside(b!, box(e))).map(e => norm((e.querySelector('div') as HTMLElement)?.innerText ?? e.textContent ?? '')) : []
      const colors = owner ? (ink => Object.entries(palette).filter(([, value]) => color(value)?.rgb === ink).map(([kind]) => kind))(color(getComputedStyle(owner).fill)?.rgb) : []
      const lanes = b ? rectangles.filter(rect => { if (rect === owner) return false; const r = box(rect); return inside(r, b) && r.width > b.width + 30 }).sort((a, b) => box(a).width * box(a).height - box(b).width * box(b).height) : []
      const lane = lanes[0], laneText = lane ? ownedText(lane).filter(e => !b || !inside(b, box(e))).filter(e => box(e).x < (b?.x ?? Infinity)) : []
      const rowHeadings = laneText.map(e => /^(UI\/A|C\/RM|Stream):\s*(.+)$/.exec(norm(e.textContent ?? ''))).filter(Boolean), decodedKind = colors.length === 1 ? colors[0]! : null, rowPrefix = decodedKind ? ({ 'UI/Automation': 'UI/A', 'Command/Read Model': 'C/RM', Events: 'Stream' }[laneKind(decodedKind)]) : null, namespaces = rowHeadings.filter(heading => heading![1] === rowPrefix).map(heading => heading![2]!)
      const actualNamespace = namespaces.length === 1 ? namespaces[0]! : null, actualCaption = head ? norm(head.textContent ?? '') : null
      const reference = frame.dataReference ? data.find(item => item.id === frame.dataReference) : null, fields = frame.fields.length ? frame.fields : reference?.fields ?? []
      const wanted = norm([displayed, ...fields.map((field: any) => field.name + ': ' + field.value)].join(' ')), actual = norm(content.join(' '))
      return { id: frame.id, label: frame.label, displayed: actualCaption, namespace: actualNamespace, expectedNamespace: namespace, reconstructedIdentity: actualCaption ? actualNamespace ? actualNamespace + '.' + actualCaption : actualCaption : null, box: b, owner, kind: decodedKind, actual, wanted, fields, lane: laneText.map(e => norm(e.textContent ?? '')), laneKey: lane ? geometryKey(lane) : null }
    })
    let available = frames.length > 0 && frames.every(frame => Object.keys(frame).every(key => ['id', 'resets', 'kind', 'label', 'dataReference', 'fields', 'readsFrom', 'displayLabel', 'namespace'].includes(key))) && observed.every(frame => frame.owner && frame.kind && frame.laneKey), valid = ordered(observed.map(frame => frame.box && center(frame.box)), 'x')
    for (const item of observed) { const expected = frames.find(frame => frame.id === item.id); if (item.kind !== expected.kind || item.actual !== item.wanted || item.reconstructedIdentity !== expected.label || Object.hasOwn(expected, 'displayLabel') && item.displayed !== expected.displayLabel || Object.hasOwn(expected, 'namespace') && item.namespace !== expected.namespace) valid = false; const namespace = item.expectedNamespace; if (!item.lane.some((value: string) => namespace ? value === ({ 'UI/Automation': 'UI/A: ', 'Command/Read Model': 'C/RM: ', Events: 'Stream: ' }[laneKind(expected.kind)] ?? '') + namespace || value === namespace : value === laneKind(expected.kind))) valid = false }
    const bind = (p: { x: number; y: number }) => { const candidates = observed.filter(frame => frame.box && distance(p, frame.box) <= 3); return candidates.length === 1 ? candidates[0]!.id : null }
    const routes = paths.flatMap(path => { if (path.localName !== 'path' || filled(path)) return []; const ends = endPoints(path); return ends.every(p => bind(p)) ? [{ source: bind(ends[0]!), target: bind(ends[1]!) }] : [] })
    const expectedRoutes = frames.flatMap((frame, index) => { if (frame.readsFrom.length) return frame.readsFrom.map((source: string) => ({ source, target: frame.id })); if (frame.resets) return []; const previous = observed.slice(0, index).findLast(item => item.laneKey !== observed[index]!.laneKey); return previous ? [{ source: previous.id, target: frame.id }] : [] }), routeKey = (route: any) => route.source + '\0' + route.target
    valid &&= same(routes.map(routeKey).sort(), expectedRoutes.map(routeKey).sort())
    const svgWidth = svg.getBoundingClientRect().width, ownedBodies = uniqueShapes(rectangles.filter(rect => { const r = box(rect); return observed.some(frame => frame.box && r.width < svgWidth * .8 && Math.abs(r.height - frame.box.height) < 2 && !observed.some(other => other.owner === rect && other.id !== frame.id)) }))
    if (ownedBodies.length !== frames.length) available = false
    add('frames', { frames: observed.map(({ owner: _, ...frame }) => frame), routes, expectedRelations: expectedRoutes }, available ? valid : null, 'Exact frame bodies, source order, complete owned inline/referenced data and measured lane membership. Type colors use the public pinned event vocabulary (or explicit source color overrides); other skins remain unknown. Reset frames suppress implicit predecessors and explicit reads bind actual endpoint-owned routes; no frame ID/class/native model is observed.')
    if (Array.isArray(facts['event-namespace-presentation'])) {
      const wanted: any[] = facts['event-namespace-presentation'], records = wanted.map(entry => ({ expected: entry, actual: observed.find(frame => frame.id === entry.id) }))
      add('event-namespace-presentation', records.map(({ expected, actual }) => ({ id: expected.id, entityIdentifier: actual?.reconstructedIdentity ?? null, displayLabel: actual?.displayed ?? null, namespace: actual?.namespace ?? null, entityType: actual?.kind ?? null, body: actual?.box ?? null, lane: actual?.lane ?? [] })), available && records.every(record => record.actual) ? valid && records.every(({ expected, actual }) => actual!.reconstructedIdentity === expected.entityIdentifier && actual!.displayed === expected.displayLabel && actual!.namespace === expected.namespace && actual!.kind === (expected.entityType === 'readmodel' ? 'read-model' : expected.entityType)) : null, 'A two-part qualified entity is independently reconstructed from the actual owned bold frame caption plus its actual enclosing type-owned namespace row. The full qualified identity stays required; source/native identifier strings and generated SVG IDs supply no paint evidence. Multi-dot names retain their literal caption.')
    }
    for (const key of ['frame-order', 'frame-content', 'data-definitions']) if (facts[key]) {
      let aliasAvailable = key === 'frame-order', agrees = key === 'frame-order' && same(facts[key], observed.map(frame => frame.displayed))
      if (key === 'frame-content' && Array.isArray(facts[key])) {
        const parseFields = (raw: any): { name: string; value: string }[] | null => {
          if (raw === null || raw === undefined) return []
          if (Object.keys(raw).length !== 1 || typeof raw.text !== 'string') return null
          const fields = raw.text.split(/[,;\n]+/).map((line: string) => line.trim()).filter(Boolean).map((line: string) => /^([A-Za-z_]\w*)\s*:\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+)|true|false|null|[A-Za-z_]\w*)$/.exec(line))
          return fields.length && fields.every(Boolean) ? fields.map((field: RegExpExecArray) => ({ name: field[1]!, value: field[2]! })) : null
        }
        const aliases = facts[key].map((entry: any) => ({ entry, fields: Object.hasOwn(entry, 'fields') ? Array.isArray(entry.fields) && entry.fields.every((field: any) => field && typeof field.name === 'string' && typeof field.value === 'string' && Object.keys(field).every(key => ['name', 'value'].includes(key))) ? entry.fields : null : parseFields(entry.data), canonical: frames.find(frame => frame.id === entry.id) }))
        aliasAvailable = aliases.length === frames.length && aliases.every((alias: any) => alias.canonical && alias.fields && Object.keys(alias.entry).every(key => ['id', 'entityType', 'entity', 'reset', 'sources', 'data', 'dataReference', 'fields', 'displayLabel', 'namespace'].includes(key)))
        const kind = (value: string) => value === 'readmodel' ? 'read-model' : value
        agrees = aliasAvailable && aliases.every(({ entry, fields, canonical }: any) => { const painted = observed.find(frame => frame.id === entry.id); if (!painted) return false; return painted.reconstructedIdentity === entry.entity && (!Object.hasOwn(entry, 'displayLabel') || painted.displayed === entry.displayLabel) && (!Object.hasOwn(entry, 'namespace') || painted.namespace === entry.namespace) && kind(entry.entityType) === canonical.kind && entry.reset === canonical.resets && same(entry.sources, canonical.readsFrom) && (entry.dataReference ?? null) === (canonical.dataReference ?? null) && same(fields, canonical.fields) })
      }
      add(key, observed.map(({ owner: _, ...frame }) => frame), available && aliasAvailable ? valid && agrees : null, 'Complete frame-content aliases retain exact qualified identity through the independently measured basename/type-owned namespace lane, every owned inline scalar field, reset effect, source order and actual relation inventory. Raw source text is parsed independently into supported field tuples; unsupported data syntax, unreferenced definitions and unpainted representations stay unknown.')
    }
  }
  if (input.family === 'zenuml') {
    // Borders are paint contours, not their filled bounding boxes. Compact
    // interior header panels do not erase an enclosing stroked frame.
    const allRects = [...svg.querySelectorAll('rect')]
    const contourVisible = (element: SVGGeometryElement) => {
      let opacity=1
      for(let owner:Element|null=element;owner;owner=owner.parentElement){const css=getComputedStyle(owner);opacity*=Number(css.opacity);if(css.display==='none'||['hidden','collapse'].includes(css.visibility)||opacity<1/255||css.clipPath!=='none'||css.maskImage!=='none'||css.filter!=='none'&&!preservesSourceGraphic(css.filter))return false;if(owner===svg)break}
      const css=getComputedStyle(element),ink=color(css.stroke);if(!ink||ink.alpha*Number(css.strokeOpacity)*opacity<1/255||Number.parseFloat(css.strokeWidth)<.25)return false
      const points=sample(element,128)
      return points.length>0&&!points.some(p=>allRects.some(cover=>{if(cover===element||!(element.compareDocumentPosition(cover)&Node.DOCUMENT_POSITION_FOLLOWING))return false;const cs=getComputedStyle(cover),fill=color(cs.fill),matrix=cover.getScreenCTM();if(!fill||fill.alpha*Number(cs.fillOpacity)<1/255||cs.display==='none'||Number(cs.opacity)===0||!matrix)return false;if(!cover.isPointInFill(new DOMPoint(p.x,p.y).matrixTransform(matrix.inverse())))return false;let opacity=fill.alpha*Number(cs.fillOpacity);for(let owner:Element|null=cover;owner;owner=owner.parentElement){const css=getComputedStyle(owner);if(css.clipPath!=='none'||css.maskImage!=='none'||css.filter!=='none')return true;opacity*=Number(css.opacity);if(owner===svg)break}return opacity>=1-1/255}))
    }
    const zenLines=[...svg.querySelectorAll('line,path,polyline,polygon')].filter(e=>visible(e)||contourVisible(e as SVGGeometryElement)) as SVGGeometryElement[]
    const zenRects=allRects.filter(e=>visible(e)||contourVisible(e))
    const participants = input.expected.nodes ?? [], events: any[] = facts['zenuml-event-order'] ?? []
    const participantBoxes = participants.map(participant => { const e = label(participant.label), shape = body(e); return { id: participant.id, label: participant.label, shape, box: shape ? box(shape) : null } })
    const bodiesReady = participants.length > 0 && participantBoxes.every(participant => participant.box)
    const headContour=(path:SVGGeometryElement)=>{const matrix=path.getScreenCTM();const ps=path.localName==='polyline'||path.localName==='polygon'?[...(path as SVGPolylineElement).points].map(p=>matrix?new DOMPoint(p.x,p.y).matrixTransform(matrix):new DOMPoint(NaN,NaN)):null;const segments=ps?ps.slice(1).map((p,i)=>[ps[i]!,p]):linearSegments(path);const unique=segments.flat().filter((p,i,a)=>!a.slice(0,i).some(q=>Math.hypot(p.x-q.x,p.y-q.y)<.2));if(unique.length!==3||![2,3].includes(segments.length)||filled(path)&&segments.length!==3)return null;const b=box(path),tips=unique.filter(p=>unique.filter(q=>q!==p).every(q=>Math.abs(q.x-p.x)>b.width*.7)&&Math.abs(p.y-center(b).y)<b.height*.15);return tips.length===1?{tip:tips[0]!,right:tips[0]!.x>center(b).x}:null};const heads = zenLines.filter(path => { const b = box(path); return ['path','polyline','polygon'].includes(path.localName) && b.width >= 3 && b.width <= 18 && b.height >= 3 && b.height <= 20 && !!headContour(path) })
    const straight = zenLines.filter(path => { const ps = endPoints(path); return ps.length === 2 && Math.abs(ps[0]!.y-ps[1]!.y)<.5 && Math.abs(ps[0]!.x-ps[1]!.x)>10 && sample(path,8).every(p=>Math.abs(p.y-ps[0]!.y)<.5) })
    const complexCover=[...svg.querySelectorAll('image,use,foreignObject')].some(cover=>{const b=box(cover);if(b.width<=0||b.height<=0)return false;for(let owner:Element|null=cover;owner;owner=owner.parentElement){const css=getComputedStyle(owner);if(css.display==='none'||['hidden','collapse'].includes(css.visibility)||Number(css.opacity)===0)return false;if(owner===svg)break}return [...text,...zenLines].some(element=>{if(cover.contains(element)||!(element.compareDocumentPosition(cover)&Node.DOCUMENT_POSITION_FOLLOWING))return false;const e=box(element);return Math.min(e.x+e.width,b.x+b.width)>Math.max(e.x,b.x)&&Math.min(e.y+e.height,b.y+b.height)>Math.max(e.y,b.y)})})
    const headerBottom = Math.min(...participantBoxes.map(participant=>participant.box ? participant.box.y+participant.box.height : Infinity))
    // An external caller is a distinct anonymous, painted header with a
    // physical vertical lifeline. Neither _STARTER_ nor a data attribute binds it.
    const anonymous = zenRects.filter(rect=>{ const b=box(rect); return b.width>=30&&b.height>=20&&b.height<=100&&b.y+b.height<=headerBottom+2&&!participantBoxes.some(p=>p.shape===rect)&&!text.some(t=>inside(b,box(t)))&&zenLines.some(path=>{const ends=endPoints(path);return ends.length===2&&Math.abs(ends[0]!.x-ends[1]!.x)<1&&Math.abs(ends[0]!.x-center(b).x)<2&&Math.min(ends[0]!.y,ends[1]!.y)<=b.y+b.height+2&&Math.max(ends[0]!.y,ends[1]!.y)>b.y+b.height+10}) })
    const external = anonymous.length===1 ? box(anonymous[0]!) : null
    const lane = (p: {x:number;y:number}, creation=false): string | null | undefined => {
      const found=participantBoxes.filter(participant=>participant.box&&(creation ? distance(p,participant.box)<=2&&p.y>=participant.box.y&&p.y<=participant.box.y+participant.box.height : Math.abs(center(participant.box).x-p.x)<=10&&p.y>participant.box.y+participant.box.height))
      if(found.length===1)return found[0]!.id
      if(!found.length&&external&&Math.abs(center(external).x-p.x)<=2&&p.y>external.y+external.height)return null
      return undefined
    }
    const badgeCaptions=text.filter(t=>['Loop','Alt','Opt','Par','Try'].includes(norm(t.textContent??'')))
    const observed=straight.filter(route=>box(route).y>Math.min(headerBottom,external?external.y+external.height:Infinity)+2).map(route=>{
      const ends=endPoints(route), minX=Math.min(...ends.map(p=>p.x)), maxX=Math.max(...ends.map(p=>p.x)), nearHeads=heads.filter(head=>{const b=box(head);return ends.some(p=>distance(p,b)<3)&&Math.abs(center(b).y-ends[0]!.y)<2}),head=nearHeads.length===1?nearHeads[0]:undefined,tipRight=head?headContour(head)?.right??null:null
      const headCenter=head?center(box(head)):null, right=headCenter?Math.abs(headCenter.x-maxX)<Math.abs(headCenter.x-minX):null
      const destination=right===null?null:ends.reduce((a,b)=>right?b.x>a.x?b:a:b.x<a.x?b:a),origin=destination===ends[0]?ends[1]:ends[0]
      const captions=text.filter(e=>{const b=box(e),c=center(b);return !/^\d+(?:\.\d+)*$/.test(norm(e.textContent??''))&&c.x>minX+2&&c.x<maxX-2&&b.y+b.height>=ends[0]!.y-22&&b.y+b.height<=ends[0]!.y+2})
      const sortedCaptions=captions.sort((a,b)=>box(b).y+box(b).height-box(a).y-box(a).height);const nearest=sortedCaptions[0],uniqueNearest=nearest&&(n=>!sortedCaptions.slice(1).some(other=>{const o=box(other);return Math.abs(o.y+o.height-n.y-n.height)<1}))(box(nearest));const caption=uniqueNearest?(nearest!.textContent??'').normalize('NFC').trim():null,css=getComputedStyle(route),dotted=css.strokeDasharray!=='none'&&css.strokeDasharray.split(/[ ,]+/).some(value=>Number.parseFloat(value)>0),headFilled=head?filled(head):null
      const to=destination?lane(destination):undefined,created=destination&&to===undefined?lane(destination,true):undefined
      return {from:origin?lane(origin):undefined,to:created??to,caption,y:ends[0]!.y,mode:created!==undefined?'create':dotted?'reply':headFilled?'sync':head?'async':null,tipRight,route,head,origin,destination}
    }).filter(item=>{if(item.head)return true;const r=box(item.route);return !zenRects.some(rect=>{const b=box(rect);return r.width>b.width*.65&&inside(b,r)&&badgeCaptions.some(t=>inside(b,box(t)))})}).filter(item=>item.from!==undefined||item.to!==undefined).sort((a,b)=>a.y-b.y)
    const eventText=(event:any)=>event.kind==='sync'?event.method+(event.arguments===null?'':'('+(event.arguments??'')+')'):event.kind==='create'?'«'+(event.arguments??'create')+'»':['return','reply'].includes(event.kind)?event.value??event.text??'':event.text??null
    const parameterTokens=(value:string)=>{let result='',quote='',escaped=false;for(let i=0;i<value.length;i++){const char=value[i]!;if(quote){result+=char;if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char===quote)quote='';continue}if(char==='"'||char==="'"){quote=char;result+=char;continue}if(/[ \t]/.test(char)){let next=i+1;while(next<value.length&&/[ \t]/.test(value[next]!))next++;if(!/[(),]/.test(result.at(-1)??'')&&!/[(),]/.test(value[next]??''))result+=' ';i=next-1;continue}result+=char}return result}
    const projectedKinds=['sync','async','return','reply','create']
    const unprojectedSourceEvents=events.flatMap((event,index)=>!event||!projectedKinds.includes(event.kind)||event.assignment||event.assignmentType||/[\r\n]/.test(event.arguments??'')||/["'][^"']*(?:[ \t]{2}|\u00a0)[^"']*["']/.test(event.arguments??'')?[{index,kind:event?.kind??null,reason:'Unqualified event kind or typed/assigned return projection'}]:[])
    let available=bodiesReady&&!complexCover&&unprojectedSourceEvents.length===0&&observed.every(message=>message.from!==undefined&&message.to!==undefined&&message.caption&&message.mode&&message.tipRight!==null)
    const actualParticipants=bodiesReady?[...participantBoxes].sort((a,b)=>center(a.box!).x-center(b.box!).x).map(p=>p.id):[]
    let valid=events.length===observed.length&&same(actualParticipants,facts['participant-order'])
    const records=events.map((event,i)=>{const actual=observed[i],from=event.kind==='create'?event.caller:event.from,to=event.kind==='create'?event.target:event.to;return {event:i,from:actual?.from,to:actual?.to,caption:actual?.caption,mode:actual?.mode,y:actual?.y,matches:!!actual&&actual.from===from&&actual.to===to&&(['sync','create'].includes(event.kind)?parameterTokens(actual.caption??'')===parameterTokens((eventText(event)??'').normalize('NFC').trim()):actual.caption===norm(eventText(event)??''))&&actual.mode===(event.kind==='return'?'reply':event.kind)&&actual.tipRight===(actual.destination!.x>actual.origin!.x)}})
    valid&&=records.every(record=>record.matches)
    // Call scope is actual activation containment, independently of source event
    // indices. Sibling calls may share a lane but not borrow one another's body.
    const activations=zenRects.filter(rect=>{const b=box(rect);return b.width>=3&&b.width<=25&&b.height>3&&b.y>headerBottom+1})
    const calls=events.map((event,i)=>({event,i,end:event.endEvent??i+1})).filter(item=>item.event.kind==='sync')
    const callBodies=new Map<number,Box>()
    for(const call of calls){const first=observed[call.i],last=observed[call.end-1],p=participantBoxes.find(p=>p.id===call.event.to);if(!first||!last||!p?.box){available=false;continue}const candidates=activations.filter(rect=>{const b=box(rect);return Math.abs(center(b).x-center(p.box!).x)<=12&&Math.abs(b.y-first.y)<=3&&b.y+b.height>=last.y-2&&(call.end>=observed.length||b.y+b.height<observed[call.end]!.y+2)});if(candidates.length!==1){available=false;continue}callBodies.set(call.i,box(candidates[0]!))}
    for(const [i,event]of events.entries())for(const scope of event.scope??[])if(scope.kind==='call'){const b=callBodies.get(scope.id),actual=observed[i];if(!b||!actual){available=false;continue}valid&&=actual.y>=b.y-2&&actual.y<=b.y+b.height+2}
    const regionFacts:any[]=facts['control-regions']??[],regionFrames=new Map<number,{box:Box;top:number;bottom:number}>()
    const badges:Record<string,string>={while:'Loop',for:'Loop',loop:'Loop',if:'Alt',opt:'Opt',par:'Par',try:'Try'}
    const regions=regionFacts.map((region,i)=>{
      const branch=['else','catch','finally'].includes(region.kind),badge=badges[region.kind],labelText=branch?region.kind==='else'?'[else]':region.kind:badge
      const labels=text.filter(t=>norm(t.textContent??'')===labelText),first=observed[region.beginEvent],last=observed[region.endEvent-1]
      const candidates=zenRects.filter(rect=>{const b=box(rect),css=getComputedStyle(rect);return b.width>40&&b.height>30&&color(css.stroke)&&labels.some(t=>inside(b,box(t)))&&first&&last&&first.y>b.y&&last.y<b.y+b.height})
      const frame=candidates.sort((a,b)=>box(a).width*box(a).height-box(b).width*box(b).height)[0],b=frame?box(frame):null
      const ownedLabel=b?labels.filter(t=>inside(b,box(t))).sort((a,b)=>box(a).y-box(b).y)[0]:null, ownedLabelBox=ownedLabel?box(ownedLabel):null
      const separators=b?straight.filter(path=>{const ps=endPoints(path);return ps[0]!.y>b.y+25&&ps[0]!.y<b.y+b.height-1&&Math.min(...ps.map(p=>p.x))>=b.x-1&&Math.max(...ps.map(p=>p.x))<=b.x+b.width+1&&box(path).width>b.width*.65}):[]
      const boundary=branch&&ownedLabelBox?separators.filter(path=>box(path).y<ownedLabelBox.y+ownedLabelBox.height).sort((a,b)=>box(b).y-box(a).y)[0]:null
      const top=branch?boundary?box(boundary).y:NaN:b?.y??NaN,nextSeparator=separators.filter(path=>box(path).y>top+2&&region.kind!=='par').sort((a,b)=>box(a).y-box(b).y)[0],bottom=nextSeparator?box(nextSeparator).y:b?b.y+b.height:NaN
      const condition=region.condition?text.filter(t=>{if(!b)return false;const tb=box(t);return inside(b,tb)&&norm(t.textContent??'')===norm(region.condition)&&tb.y>=top&&tb.y<first!.y}):[]
      const inspected=!!b&&!!ownedLabel&&Number.isFinite(top)&&(!region.condition||condition.length===1)
      const matches=inspected&&observed.every((message,j)=>(message.y>top&&message.y<bottom)===(j>=region.beginEvent&&j<region.endEvent))&&(region.scope??[]).filter((s:any)=>s.kind==='region').every((s:any)=>{const parent=regionFrames.get(s.id);return parent&&top>parent.top&&bottom<=parent.bottom})
      if(inspected)regionFrames.set(i,{box:b!,top,bottom})
      return {kind:region.kind,box:b,top,bottom,condition:condition.map(t=>norm(t.textContent??'')),matches:inspected?matches:null}
    })
    if(regionFacts.length){const ready=regions.every(region=>region.matches!==null);add('control-regions',regions,available&&ready?regions.every(region=>region.matches):null,'A visible control badge owns an actual stroked frame and branch separators; exact message intervals, authored conditions and nested interval ownership are required. Geometry and captions, never SVG classes, determine scope.');if(!ready)available=false;else valid&&=regions.every(region=>region.matches)}
    add('participant-order',participantBoxes.map(({shape:_,...p})=>p),bodiesReady&&!complexCover?same(actualParticipants,facts['participant-order']):null,'Unique source-labelled actual header bodies establish physical left-to-right lane order.')
    const iconKind=(participant:typeof participantBoxes[number]):string|null=>{
      const caption=label(participant.label);if(!caption||!participant.box)return null
      const captionX=box(caption).x,own=zenLines.filter(path=>{const b=box(path);return inside(participant.box!,b)&&b.width>=2&&b.height>=2&&b.width<=30&&b.height<=30&&b.x+b.width<=captionX-1})
      if(!own.length)return ['rectangle','rounded'].includes(outlineKind(participant.shape!)??'')?'participant':null
      const round=own.filter(path=>{const b=box(path),ps=sample(path,64);return b.width>3&&b.height>3&&Math.abs(b.width-b.height)<1&&ps.every(p=>Math.abs(((p.x-b.x)/b.width-.5)**2*4+((p.y-b.y)/b.height-.5)**2*4-1)<.08)})
      if(round.length===1&&own.length===2){const head=box(round[0]!),cx=center(head).x,lines=own.filter(path=>path!==round[0]).flatMap(linearSegments).filter(([a,b])=>Math.hypot(a!.x-b!.x,a!.y-b!.y)>.3),unique=lines.filter(([a,b],i)=>!lines.slice(0,i).some(([p,q])=>Math.hypot(a!.x-p!.x,a!.y-p!.y)<.3&&Math.hypot(b!.x-q!.x,b!.y-q!.y)<.3||Math.hypot(a!.x-q!.x,a!.y-q!.y)<.3&&Math.hypot(b!.x-p!.x,b!.y-p!.y)<.3)),spine=unique.filter(([a,b])=>Math.abs(a!.x-cx)<.5&&Math.abs(b!.x-cx)<.5&&Math.min(a!.y,b!.y)>=head.y+head.height-.5),arms=unique.filter(([a,b])=>Math.abs(a!.y-b!.y)<.3&&Math.min(a!.x,b!.x)<cx-2&&Math.max(a!.x,b!.x)>cx+2)
        if(spine.length===1&&arms.length===1&&unique.length===4){const hip=Math.max(spine[0]![0]!.y,spine[0]![1]!.y),legs=unique.filter(([a,b])=>Math.abs(a!.x-b!.x)>2&&Math.abs(a!.y-b!.y)>2&&[a!,b!].some(p=>Math.hypot(p.x-cx,p.y-hip)<.5));if(legs.length===2)return 'Actor'}
      }
      if(own.length===1&&own[0]!.localName==='path'){
        const path=own[0]!,parts=(path.getAttribute('d')??'').match(/[Mm][^Mm]*/g)??[],matrix=path.getScreenCTM(),b=box(path)
        if(parts.length>=2&&matrix){const contours=parts.map(d=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);const length=p.getTotalLength();return Array.from({length:513},(_,i)=>p.getPointAtLength(length*i/512).matrixTransform(matrix))}),outer=contours[0]!,cross=(axis:'x'|'y',at:number)=>{const other=axis==='x'?'y':'x',values:number[]=[];for(let i=1;i<outer.length;i++){const a=outer[i-1]!,c=outer[i]!,span=c[axis]-a[axis];if(Math.abs(span)<1e-8||at<Math.min(a[axis],c[axis])||at>Math.max(a[axis],c[axis]))continue;values.push(a[other]+(at-a[axis])/span*(c[other]-a[other]))}return values.sort((a,b)=>a-b)},top=[.1,.3,.5,.7,.9].map(x=>cross('x',b.x+b.width*x)[0]!),bottom=[.1,.3,.5,.7,.9].map(x=>cross('x',b.x+b.width*x).at(-1)!),sides=[.3,.4,.5,.6,.7].map(y=>cross('y',b.y+b.height*y)),rim=contours.slice(1).some(ps=>Math.max(...ps.map(p=>p.y))<b.y+b.height*.4&&Math.max(...ps.map(p=>p.x))-Math.min(...ps.map(p=>p.x))>b.width*.7)
          if(top.every(Number.isFinite)&&bottom.every(Number.isFinite)&&top[2]!<top[0]!-.5&&top[2]!<top[4]!-.5&&bottom[2]!>bottom[0]!+.5&&bottom[2]!>bottom[4]!+.5&&Math.max(...top)-Math.min(...top)<b.height*.3&&Math.max(...bottom)-Math.min(...bottom)<b.height*.3&&sides.every(values=>values.length>=2&&Math.abs(values[0]!-b.x)<.5&&Math.abs(values.at(-1)!-b.x-b.width)<.5)&&rim)return 'Database'
        }
      }
      return null
    }
    const actualKinds=participantBoxes.map(p=>({id:p.id,kind:iconKind(p)})),requestedKinds:any[]=facts['participant-kinds']??[],kindsReady=bodiesReady&&!complexCover&&actualKinds.every(p=>p.kind!==null),kindsMatch=actualKinds.every(p=>p.kind===(requestedKinds.find(e=>e.id===p.id)?.kind??'participant'))&&requestedKinds.every(e=>!e.attributes)
    add('participant-kinds',actualKinds,kindsReady?kindsMatch:null,'Each actual header owns its exact icon inventory: measured round head/spine/arms/legs establish Actor; symmetric shallow cylinder caps, flat sides and a separately visible internal rim establish Database. Unknown icons, hidden parts and role metadata provide no credit.')
    add('zenuml-event-order',{events:records,declaredEventCount:events.length,unprojectedSourceEvents,callBodies:[...callBodies]},available?valid:null,'Each chronological visible route owns a unique caption, physical arrow and independently bound participant or anonymous caller lane. Creation terminates on the new labelled header; sync scope binds actual activation bodies; exact event multiplicity and all required control regions remain strict. Unsupported assignment/type or glyph projections stay unknown.')
    if(facts['message-order']){const messages=records.map(r=>({from:r.from,to:r.to,text:r.caption}));add('message-order',messages,available?same(facts['message-order'],messages):null,'Actual chronological endpoint/caption projection.')}
    if(facts['message-modes']){const modes=records.map(r=>r.mode);add('message-modes',modes,available?same(facts['message-modes'],modes):null,'Actual arrow fill and stroke dash establish message mode.')}
    if(facts['zenuml-message-comments']){const grouped=new Map<number,string[]>();for(const comment of facts['zenuml-message-comments'])grouped.set(comment.event,[...(grouped.get(comment.event)??[]),comment.text]);const comments=[...grouped].map(([index,parts])=>{const e=label(parts.join(' ')),b=e?box(e):null,owner=observed[index];return {event:index,text:parts,box:b,matches:b&&owner?center(b).y<=owner.y+Math.max(3,b.height/2)&&(index===0||b.y>observed[index-1]!.y)&&(index+1>=observed.length||b.y+b.height<observed[index+1]!.y):null}});add('zenuml-message-comments',comments,available&&comments.every(c=>c.matches!==null)?comments.every(c=>c.matches):null,'Complete painted comment blocks occupy the physical chronological gap directly before their event. Adjacent comment lines may share one block; unrelated matching strings do not establish ownership.')}
  }
  if (input.family === 'radar') {
    const axes: any[] = facts.axes ?? [], curves: any[] = facts.curves ?? [], range: number[] = facts.range ?? []
    const straight = paths.filter(path => { const ends = endPoints(path); if (ends.length !== 2) return false; const length = path.getTotalLength(), matrix = path.getScreenCTM(); return length > 20 && Math.abs(length - Math.hypot(ends[1]!.x - ends[0]!.x, ends[1]!.y - ends[0]!.y) / Math.hypot(matrix?.a ?? 1, matrix?.b ?? 0)) < 1 })
    const straightEnds = straight.map(path => endPoints(path)), endpoints = straightEnds.flat(), clusters = endpoints.map(seed => endpoints.filter(p => Math.hypot(p.x - seed.x, p.y - seed.y) < 1)).sort((a, b) => b.length - a.length), seed = (clusters[0]?.length ?? 0) >= 3 ? clusters[0]![0] : null
    const origin = seed ? { x: seed.x, y: seed.y } : null, spokes = origin ? straight.filter((path, i) => straightEnds[i]!.some(p => Math.hypot(p.x - origin.x, p.y - origin.y) < 1)) : [], tips = origin ? spokes.map(path => endPoints(path).sort((a, b) => Math.hypot(b.x - origin.x, b.y - origin.y) - Math.hypot(a.x - origin.x, a.y - origin.y))[0]!) : []; let radius = origin && tips.length ? Math.max(...tips.map(p => Math.hypot(p.x - origin.x, p.y - origin.y))) : NaN
    const ringCandidates = origin ? [...svg.querySelectorAll('circle,polygon,path')].filter(element => { if (!visible(element) || !['circle', 'polygon'].includes(element.localName) && !/[zZ]\s*$/.test(element.getAttribute('d') ?? '')) return false; const b = box(element), points = sample(element as SVGGeometryElement, 128), centroid = element.localName === 'circle' ? center(b) : { x: points.reduce((n, p) => n + p.x, 0) / points.length, y: points.reduce((n, p) => n + p.y, 0) / points.length }; return b.width > 20 && b.height > 20 && Math.hypot(centroid.x - origin.x, centroid.y - origin.y) < Math.max(2, b.width * .01) }) as SVGGeometryElement[] : []
    const ringInks = ringCandidates.map(ring => color(getComputedStyle(ring).stroke)?.rgb), gridGroups = [...new Set(ringInks)].map(ink => ({ ink, rings: ringCandidates.filter((_, i) => ringInks[i] === ink) })).filter(group => group.ink && group.rings.length >= 2).sort((a, b) => b.rings.length - a.rings.length)
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
      const svgBox = box(svg), legend = curves.map(curve => { const e = curve.label ? label(curve.label) : undefined, eb = e ? box(e) : null, ink = curve.label ? swatch(curve.label) : null; return { id: curve.id, label: curve.label, box: eb, color: ink, owned: !!e && !!ink && themeCurveOwners.has(curve.id), inCanvas: !!e && inside(svgBox, eb!) } })
      add('show-legend', legend, prepared && curves.length > 0 ? facts['show-legend'] ? legend.every(entry => entry.owned) ? legend.every(entry => entry.inCanvas) : null : legend.every(entry => !entry.box && !entry.color) : null, 'Legend visibility binds every complete printed curve name and adjacent color swatch to that actual curve, inside the canvas. Missing or unfamiliar legend ownership stays unknown; curve identifiers and renderer classes never stand in for a painted legend.')
    }
    if (facts.curves) quantitative('painted-radar-values', facts.curves, observations, available ? valid : null, 'Complete owned radar curve/ray intersections in the independently reconstructed grid frame.')
    add('graticule', gridShapes, prepared ? gridShapes.every(kind => kind === facts.graticule) : null, 'Every visible concentric grid outline must use the requested circular or polygon vocabulary; renderer classes provide no grid-kind credit.')
    if (facts.ticks) add('ticks', { count: rings.length }, prepared && /^\d+$/.test(String(facts.ticks)) ? rings.length === Number(facts.ticks) : null, 'An explicitly numeric tick-count request binds the exact independently measured radial ring inventory; other tick grammars remain unknown.')
    const numbers = text.flatMap(element => { const value = numeric(element.textContent ?? ''); if (!Number.isFinite(value) || !origin) return []; const c = center(box(element)); if (!(Math.hypot(c.x - origin.x, c.y - origin.y) <= radius + 10)) return []; const p = anchor(element); return [{ value, radius: Math.hypot(p.x - origin.x, p.y - origin.y) }] })
    const low = numbers.find(item => Math.abs(item.value - range[0]!) < 1e-8 && item.radius < 10), high = numbers.find(item => Math.abs(item.value - range[1]!) < 1e-8 && Math.abs(item.radius - radius) < 10)
    const tension = facts['authored-config']?.radar?.curveTension
    let jointRangeProfile: { curves: any[]; passed: boolean | null } | null = null
    const similarity = (shape: SVGGraphicsElement) => { const m=shape.getScreenCTM();if(!m)return false;const a=Math.hypot(m.a,m.b),b=Math.hypot(m.c,m.d);return a>0&&Math.abs(a-b)<1e-6&&Math.abs(m.a*m.c+m.b*m.d)<1e-6 }
    if (prepared && rings.every(similarity) && spokes.every(similarity) && range.length === 2 && Number.isFinite(range[0]) && Number.isFinite(range[1]) && range[1]! > range[0]! && curves.length && curves.every(curve => curve.values.length === axes.length && curve.values.every((v: number) => Number.isFinite(v) && v >= range[0]! && v <= range[1]!))) {
      const hasTension = typeof tension === 'number' && Number.isFinite(tension) && tension >= 0 && tension <= 1
      // Named public Mermaid parameter convention at pin1fb7869, renderer.ts
      //185–207; see the independently reviewed source-mapping receipt. Generic
      // Catmull-Rom "tension" conventions differ. No default is introduced.
      type P = { x: number; y: number }
      type Cubic = { start: P; c1: P; c2: P; end: P }
      const distance = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y)
      const cubics = (path: SVGGeometryElement): Cubic[] | null => {
        if (path instanceof SVGPolygonElement && !hasTension) {
          const matrix = path.getScreenCTM(), vertices = Array.from({ length: path.points.numberOfItems }, (_, i) => path.points.getItem(i)).map(p => matrix ? new DOMPoint(p.x, p.y).matrixTransform(matrix) : null)
          if (!matrix || vertices.length < 3 || vertices.some(p => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null
          if (distance(vertices[0]!, vertices.at(-1)!) < 1e-5) vertices.pop()
          return vertices.map((p, i) => { const next = vertices[(i + 1) % vertices.length]!; return { start: p!, c1: { x: p!.x + (next.x - p!.x) / 3, y: p!.y + (next.y - p!.y) / 3 }, c2: { x: p!.x + (next.x - p!.x) * 2 / 3, y: p!.y + (next.y - p!.y) * 2 / 3 }, end: next } })
        }
        if (path.localName !== 'path') return null
        const d = path.getAttribute('d') ?? '', tokens = d.match(/[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?|[A-Za-z]/g) ?? [], matrix = path.getScreenCTM()
        if (!matrix || tokens.join('') !== d.replace(/[\s,]/g, '')) return null
        const screen = (p: P): P => { const s = new DOMPoint(p.x, p.y).matrixTransform(matrix); return { x: s.x, y: s.y } }
        const result: Cubic[] = []; let i = 0, command = '', current: P | null = null, initial: P | null = null
        while (i < tokens.length) {
          if (/^[A-Za-z]$/.test(tokens[i]!)) command = tokens[i++]!
          const kind = command.toUpperCase(), relative = command !== kind
          if (kind === 'Z') return i === tokens.length && initial && current && distance(initial, current) < 1e-5 ? result : null
          if (kind !== 'M' && kind !== 'C' || kind === 'M' && current) return null
          const count = kind === 'M' ? 2 : 6, values = tokens.slice(i, i + count).map(Number); i += count
          if (values.length !== count || values.some(v => !Number.isFinite(v))) return null
          const point = (index: number): P => ({ x: values[index]! + (relative ? current?.x ?? 0 : 0), y: values[index + 1]! + (relative ? current?.y ?? 0 : 0) })
          if (kind === 'M') { initial = current = point(0); command = ''; continue }
          if (!current) return null
          const c1 = point(0), c2 = point(2), end = point(4)
          result.push({ start: screen(current), c1: screen(c1), c2: screen(c2), end: screen(end) }); current = end
        }
        return null
      }
      const ownedCurves = curves.map(curve => ({ curve, owner: themeCurveOwners.get(curve.id) })), observed: any[] = [], rangeObserved: any[] = [], coverElements = [...svg.querySelectorAll('rect,circle,ellipse,path,polygon,image,use,foreignObject')]
      for (const { curve, owner } of ownedCurves) {
        const actual = owner ? cubics(owner) : null, vertices: P[] = prepared ? curve.values.map((value: number, i: number) => { const tip = axisOwners[i]!.tip!, length = Math.hypot(tip.x - origin!.x, tip.y - origin!.y), r = (value - range[0]!) / (range[1]! - range[0]!) * radius; return { x: origin!.x + (tip.x - origin!.x) / length * r, y: origin!.y + (tip.y - origin!.y) / length * r } }) : []
        if (!owner || !similarity(owner) || !actual || actual.length !== axes.length || vertices.length !== axes.length) { observed.push({ id: curve.id, available: false, reason: 'Unique visible complete cubic path and independently measured similarity grid are required' }); continue }
        const onAxis = (p: P, i: number) => { const tip = axisOwners[i]!.tip!, dx = tip.x - origin!.x, dy = tip.y - origin!.y, n = Math.hypot(dx,dy), x = p.x - origin!.x, y = p.y - origin!.y; return Math.abs(dx*y-dy*x)/n < .25 && (x*dx+y*dy)/n >= -.25 }
        const reversed = [...actual].reverse().map(s => ({ start: s.end, c1: s.c2, c2: s.c1, end: s.start })), orderings = [actual, reversed].flatMap(segments => segments.map((_, offset) => [...segments.slice(offset), ...segments.slice(0, offset)])).filter(segments => segments.every((s, i) => onAxis(s.start,i) && onAxis(s.end,(i+1)%vertices.length)))
        if (orderings.length !== 1) { observed.push({ id: curve.id, available: false, reason: 'Cyclic source-vertex ownership is absent or ambiguous' }); continue }
        const segments = orderings[0]!, expected = hasTension ? vertices.map((p, i) => { const before = vertices[(i + vertices.length - 1) % vertices.length]!, next = vertices[(i + 1) % vertices.length]!, after = vertices[(i + 2) % vertices.length]!; return { start: p, c1: { x: p.x + tension * (next.x - before.x), y: p.y + tension * (next.y - before.y) }, c2: { x: next.x - tension * (after.x - p.x), y: next.y - tension * (after.y - p.y) }, end: next } }) : []
        const covers = coverElements.filter(e => e !== owner && !e.contains(owner) && !owner.contains(e) && !e.closest('defs,marker,clipPath,mask') && !!(owner.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)).map(e => { const s = getComputedStyle(e); let opacity = 1, shown = true; for (let p: Element | null = e; p; p = p.parentElement) { const c = getComputedStyle(p); opacity *= Number(c.opacity); if (c.display === 'none' || ['hidden','collapse'].includes(c.visibility)) shown = false; if (p === svg) break }; return { e, b: box(e), matrix: (e as SVGGraphicsElement).getScreenCTM?.(), fill: (color(s.fill)?.alpha ?? 0) * Number(s.fillOpacity) * opacity, stroke: (color(s.stroke)?.alpha ?? 0) * Number(s.strokeOpacity) * opacity * (Number.parseFloat(s.strokeWidth) > 0 ? 1 : 0), shown, boundCurve: ownedCurves.some(curve => curve.owner === e) } }).filter(c => c.shown && (c.fill >= .999 || c.stroke >= .999 || ['image','use','foreignObject'].includes(c.e.localName)))
        let unqualifiedCover = false
        const inverses = covers.map(c => c.matrix ? c.matrix.inverse() : null), exposedSegments = segments.map(s => { let exposed = 0; for (let k = 0; k <= 16; k++) { const u = k / 16, v = 1 - u, p = { x: v ** 3 * s.start.x + 3 * v * v * u * s.c1.x + 3 * v * u * u * s.c2.x + u ** 3 * s.end.x, y: v ** 3 * s.start.y + 3 * v * v * u * s.c1.y + 3 * v * u * u * s.c2.y + u ** 3 * s.end.y }; let covered = false; for (const [index, c] of covers.entries()) { const shape = c.e, inverse = inverses[index], local = inverse ? new DOMPoint(p.x, p.y).matrixTransform(inverse) : null, hit = shape instanceof SVGGeometryElement && local ? c.fill >= .999 && shape.isPointInFill(local) || c.stroke >= .999 && shape.isPointInStroke(local) : p.x >= c.b.x && p.x <= c.b.x + c.b.width && p.y >= c.b.y && p.y <= c.b.y + c.b.height; if (hit) { covered = true; if (!c.boundCurve) unqualifiedCover = true } }; if (!covered) exposed++ }; return exposed })
        const carrier = visible(owner) && !unqualifiedCover && exposedSegments.every(n => n > 0), vertexErrors = segments.map((s,i)=>distance(s.start,vertices[i]!)), controlErrors = hasTension ? segments.map((s, i) => Math.max(distance(s.c1, expected[i]!.c1), distance(s.c2, expected[i]!.c2))) : []
        rangeObserved.push({id:curve.id,available:carrier,sourceValues:curve.values,actualVertices:segments.map(s=>s.start),expectedVertices:vertices,vertexErrors,matches:vertexErrors.every(error=>error<=3)})
        observed.push({ id: curve.id, available: carrier && vertexErrors.every(error=>error<=.25), actual: segments, expected, controlErrors, exposedSamplesPerSegment: exposedSegments, unqualifiedCover, matches: controlErrors.every(error => error <= .25) })
      }
      // Endpoint/range effects are independent of cubic controls. A wrong
      // tension may preserve every source vertex and must not fail range.
      const rangeReady = orderedAxes && closed.length === curves.length && rangeObserved.length === curves.length && rangeObserved.every(curve=>curve.available)
      jointRangeProfile = {curves:rangeObserved,passed:rangeObserved.some(curve=>curve.available&&!curve.matches)?false:rangeReady?true:null}
      const ready = jointRangeProfile.passed === true && observed.length === curves.length && observed.every(curve => curve.available)
      if(hasTension)radarTensionProfile = { profile: 'mermaid-radar-cubic-coefficient-1fb7869-v1', expected: tension, curves: observed, passed: observed.some(curve=>curve.available&&!curve.matches)?false:ready?true:null }
    }
    const projectedRange = jointRangeProfile?.passed ?? null, printedRange = !!low && !!high
    add('range', {profile:'source-normalized-radar-grid-and-vertices-v1',sourceRange:range,curves:jointRangeProfile?.curves??null,ticks:numbers,center:origin,outerRadius:radius}, projectedRange === false ? false : projectedRange === true && (!numbers.length || printedRange) ? true : prepared && printedRange ? true : null, 'The complete literal data/range pair predicts every independently owned polygon or cubic vertex as R*(v-min)/(max-min) in the independently measured grid frame, within3CSSpx. This proves the visible combined effect rather than hidden stored numbers; jointly rescaled values/range are equivalent when numeric labels are absent. Cubic controls/tension remain a separate obligation. Printed numeric endpoint labels retain their own scale check; unsupported vertex/paint ownership stays unknown.')
  }
  if (input.family === 'xychart' && (facts['displayed-bar-values'] || facts['series-annotations'])) {
    const series: any[] = facts.series ?? [], prior = input.quantitative.find(check => check.criterion === 'source-fact:series'), geometry: any[] = Array.isArray(prior?.actual) ? prior.actual : [], used = new Set<Element>()
    const bars = (facts['displayed-bar-values'] ?? []).map((entry: any) => {
      const sourceSeries = series[entry.series], category = entry.category ?? facts['x-categories']?.[entry.index], candidates = geometry.filter(item => item.kind === 'bar' && item.category === category && (sourceSeries?.label === undefined || item.label === sourceSeries.label)), b: Box | null = candidates.length === 1 ? candidates[0].box : null
      const labels = b ? text.filter(element => { const eb = box(element), c = center(eb), near = Math.abs(c.x - center(b).x) <= Math.max(3, b.width / 2) && c.y >= b.y - eb.height * 2 && c.y <= b.y + b.height; return near && Number.isFinite(numeric(element.textContent ?? '')) && !facts['x-categories']?.includes(norm(element.textContent ?? '')) }) : []
      const element = labels.length === 1 ? labels[0] : undefined, printed = element ? numeric(element.textContent ?? '') : null, elementBox = element ? box(element) : null, placement = b && elementBox ? inside(b, elementBox) ? 'inside' : elementBox.y + elementBox.height <= b.y + 2 ? 'outside' : null : null, duplicate = element ? used.has(element) : false
      if (element) used.add(element)
      return { series: entry.series, index: entry.index, value: printed, placement, wanted: entry, body: b, owned: !!element && !duplicate }
    })
    const available = prior?.status === 'passed' && bars.every((entry: any) => entry.body) && bars.some((entry: any) => entry.owned)
    add('displayed-bar-values', bars, available ? bars.every((entry: any) => entry.owned && Math.abs(entry.value - entry.wanted.value) < 1e-8 && entry.placement === entry.wanted.placement) : null, 'Each printed numeric value uniquely owns its independently calibrated actual bar and requested inside/outside placement. Geometry selects the label before comparing numbers; borrowed values, duplicates and missing values among inspectable labels fail.')
    const annotations = (facts['series-annotations'] ?? []).flatMap((entry: any) => entry.labels.flatMap((value: string | null, index: number) => { if (value === null) return []; const category = facts['x-categories']?.[index], sourceSeries = series[entry.series], item = geometry.find(item => item.category === category && item.kind === sourceSeries?.kind && (sourceSeries?.label === undefined || item.label === sourceSeries.label)), p = item?.actual ?? (item?.box ? { x: center(item.box).x, y: item.box.y } : null), e = label(value), eb = e ? box(e) : null; return [{ series: entry.series, index, label: value, point: p, labelBox: eb, distance: eb && p ? distance(p, eb) : null }] }))
    add('series-annotations', annotations, prior?.status === 'passed' && annotations.every((entry: any) => entry.point && entry.labelBox) ? annotations.every((entry: any) => entry.distance <= 24) : null, 'Every authored annotation owns a unique visible text block beside its independently measured series/category point; a matching label elsewhere supplies no annotation credit.')
  }
  if (input.family === 'quadrant' && facts['point-appearance']) {
    let visibleCircles: SVGCircleElement[] | undefined
    const definitions: any[] = facts['authored-style'] ?? [], observations = facts['point-appearance'].map((entry: any) => {
      const properties: Record<string, string> = {}
      for (const name of String(entry.classes).split(',')) for (const rule of definitions.filter(rule => rule.kind === 'classDef' && rule.selection === name)) for (const attribute of rule.attributes) properties[attribute.property] = attribute.value
      Object.assign(properties, entry.properties)
      const e = label(entry.label), eb = e ? box(e) : null, c = eb ? center(eb) : null, ranked = c ? (visibleCircles ??= [...svg.querySelectorAll('circle')].filter(visible)).map(circle => ({ circle, d: distance(center(box(circle)), eb!) })).sort((a, b) => a.d - b.d) : [], owner = ranked[0] && (!ranked[1] || ranked[1].d - ranked[0].d > 2) ? ranked[0].circle : undefined
      const css = owner ? getComputedStyle(owner) : null, matrix = owner?.getScreenCTM(), ownerBox = owner ? box(owner) : null, measured = Object.entries(properties).map(([property, value]) => { const actual = property === 'radius' ? owner && matrix ? ownerBox!.width / 2 / Math.hypot(matrix.a, matrix.b) : null : property === 'color' ? css ? color(css.fill)?.rgb : null : property === 'stroke-color' ? css ? color(css.stroke)?.rgb : null : property === 'stroke-width' ? css ? Number.parseFloat(css.strokeWidth) : null : null, wanted = ['color', 'stroke-color'].includes(property) ? color(value)?.rgb : Number.parseFloat(value); return { property, expected: wanted, actual, available: actual !== null && actual !== undefined && wanted !== undefined && !Number.isNaN(wanted), passed: typeof wanted === 'number' ? typeof actual === 'number' && Math.abs(actual - wanted) < .1 : actual === wanted } })
      return { label: entry.label, body: ownerBox, properties: measured }
    })
    const available = observations.every((entry: any) => entry.body && entry.properties.every((p: any) => p.available)), passed = observations.every((entry: any) => entry.properties.every((p: any) => p.passed))
    add('point-appearance', observations, available ? passed : null, 'Source class definitions and inline point overrides compile independently to actual owned dot radius/fill/stroke/width. Physical geometry and computed paint establish output values; renderer class spelling is ignored, and unsupported properties remain unknown.')
    if (definitions.length) add('authored-style', observations, available && definitions.every(rule => rule.kind === 'classDef' && facts['point-appearance'].some((entry: any) => String(entry.classes).split(',').includes(rule.selection))) ? passed : null, 'Every source class definition must be exercised by a measured point-owned appearance projection; unused selectors or unsupported rule kinds remain required unknowns.')
  }
  if (facts['theme-paint']) {
    const policy = facts['theme-paint'], roles: any[] = Array.isArray(policy.roles) ? policy.roles : [], tokenMode = policy.comparison === 'source-paint-tokens'
    const genericLabelsClear = input.paint.checks.some(check => check.criterion === 'unclipped-authored-labels' && check.status === 'passed') && input.paint.checks.some(check => check.criterion === 'visible-authored-labels' && check.status === 'passed')
    const measuredShape = (bounds: Box | undefined) => bounds ? [...svg.querySelectorAll('rect,circle,ellipse,path,polygon')].filter(e => !e.closest('defs,marker,clipPath,mask')).find(e => { const b = box(e); return inside(bounds, b, .1) && inside(b, bounds, .1) }) : undefined
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
        const rawChannels = value.rgb.split(',').map(Number), channels = rawChannels.map(channel => Math.min(255, channel * brightness))
        return { rawChannels, channels, opacity, brightness, known: known && Number.isFinite(opacity) && Number.isFinite(brightness) && brightness > 0 }
      })
      return paints.length && paints.every(paint => paint && paint.known && same(tokenMode ? paint.rawChannels : paint.channels, tokenMode ? paints[0]?.rawChannels : paints[0]?.channels) && (tokenMode || Math.abs(paint.opacity - paints[0]!.opacity) < 1e-8)) ? { ...paints[0]!, parts: paints as NonNullable<typeof paints[number]>[] } : null
    }
    const exposedCarrier = (element: Element | undefined, property: 'fill' | 'stroke' | 'foreground', paint: ReturnType<typeof effective>, ownerId: string): boolean => {
      if (!element || !paint || !paint.parts.every(part => part.opacity >= 1 / 255)) return false
      const bounds = box(element); if (bounds.width + bounds.height <= 0) return false
      if (property === 'foreground') return genericLabelsClear && !input.paint.camouflagedText?.some(item => norm(item.text) === norm(element.textContent ?? '') && inside(item.box, bounds) && inside(bounds, item.box))
      if (!visible(element)) return false
      if (property === 'stroke' && !(Number.parseFloat(getComputedStyle(element).strokeWidth) > 0)) return false
      const visibility = input.paint.checks.find(check => check.criterion === 'painted-node-visibility'), owned = Array.isArray(visibility?.actual) ? (visibility.actual as any[]).find(row => row.id === ownerId) : undefined
      if (owned && owned.exposed !== true) return false
      if (!(element instanceof SVGGeometryElement)) return false
      const matrix = element.getScreenCTM(), length = element.getTotalLength()
      if (!matrix || !(length > 0)) return false
      const points: { x: number; y: number }[] = property === 'stroke' ? Array.from({ length: 257 }, (_, index) => element.getPointAtLength(length * index / 256).matrixTransform(matrix)) : []
      if (property === 'fill') { const inverse = matrix.inverse(), textBoxes = text.map(box); for (const x of [.1, .3, .5, .7, .9]) for (const y of [.1, .3, .5, .7, .9]) { const p = new DOMPoint(bounds.x + bounds.width * x, bounds.y + bounds.height * y), local = p.matrixTransform(inverse); if (element.isPointInFill(local) && !element.isPointInStroke(local) && !textBoxes.some(t => inside(t, { x: p.x, y: p.y, width: 0, height: 0 }))) points.push(p) } }
      if (!points.length) return false
      const elementStyle = getComputedStyle(element)
      for (const cover of svg.querySelectorAll('rect,circle,ellipse,path,polygon,image,use,foreignObject')) {
        if (cover === element || cover.contains(element) || element.contains(cover) || cover.closest('defs,marker,clipPath,mask') || !(element.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING)) continue
        const b = box(cover), css = getComputedStyle(cover), fill = color(css.fill), stroke = color(css.stroke); let opacity = 1, shown = true
        for (let e: Element | null = cover; e; e = e.parentElement) { const css = getComputedStyle(e); opacity *= Number(css.opacity); if (css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility)) shown = false; if (e === svg) break }
        const fillAlpha = (fill?.alpha ?? 0) * Number(css.fillOpacity) * opacity, strokeAlpha = Number.parseFloat(css.strokeWidth) > 0 ? (stroke?.alpha ?? 0) * Number(css.strokeOpacity) * opacity : 0
        const complex = ['image', 'use', 'foreignObject'].includes(cover.localName)
        if (!shown || opacity <= 0 || !complex && Math.max(fillAlpha, strokeAlpha) < .999) continue
        const sameBox = inside(bounds, b, .1) && inside(b, bounds, .1), equivalent = sameBox && fill?.rgb === color(elementStyle.fill)?.rgb && css.stroke === elementStyle.stroke && css.strokeWidth === elementStyle.strokeWidth
        const child = (input.paint.nodes as any[]).some(node => node.id !== ownerId && inside(bounds, node.box) && inside(node.box, b, .1) && inside(b, node.box, .1)), caption = b.width * b.height < bounds.width * bounds.height * .98 && text.some(label => inside(b, box(label)))
        if (equivalent || child || caption) continue
        if (input.family === 'radar' && property === 'stroke' && [...themeCurveOwners.values()].includes(element) && [...themeCurveOwners.values()].includes(cover as SVGGeometryElement) && checks.some(check => check.criterion === 'source-fact:range' && check.status === 'passed')) continue
        const transform = (cover as SVGGraphicsElement).getScreenCTM?.(), inverse = transform?.inverse()
        const padding = strokeAlpha >= .999 ? Number.parseFloat(css.strokeWidth) / 2 * (transform ? Math.hypot(transform.a, transform.b, transform.c, transform.d) : 1) : 0
        if (points.some(p => inside(b, { x: p.x, y: p.y, width: 0, height: 0 }, padding) && (complex || !transform || !(cover instanceof SVGGeometryElement) || (() => { const local = new DOMPoint(p.x, p.y).matrixTransform(inverse); return fillAlpha >= .999 && cover.isPointInFill(local) || strokeAlpha >= .999 && cover.isPointInStroke(local) })()))) return false
      }
      return true
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
        if (measured) owner = rectangles.filter(rect => { const b = box(rect); return inside(measured.box, b) && inside(b, measured.box) })[0]
      }
      if (input.family === 'usecase' && ['include', 'extend'].includes(role.kind)) {
        const [source, target] = String(role.owner).split('->'), matches = input.paint.connections.filter((edge: any) => edge.source === source && edge.target === target)
        if (matches.length === 1) { route = matches[0]; const candidates = [...svg.querySelectorAll('path,line,polyline')].filter(element => { const geometry = element as SVGGeometryElement, matrix = geometry.getScreenCTM(), length = geometry.getTotalLength(); if (!route.box || !matrix || !(length > 0)) return false; const eb = box(element); if (!inside(route.box, eb, .1) || !inside(eb, route.box, .1)) return false; const a = geometry.getPointAtLength(0).matrixTransform(matrix), b = geometry.getPointAtLength(length).matrixTransform(matrix); return route.start && route.end && Math.hypot(a.x-route.start.x,a.y-route.start.y)<.5 && Math.hypot(b.x-route.end.x,b.y-route.end.y)<.5 }); if (candidates.length === 1) owner = candidates[0] }
      }
      const roleFill = owner ? effective(owner, 'fill') : null, roleStroke = owner ? effective(owner, 'stroke') : null, roleForeground = e ? effective(e, 'foreground') : null
      const fillVisible = tokenMode ? exposedCarrier(owner, 'fill', roleFill, role.owner) : !!roleFill, strokeVisible = tokenMode ? exposedCarrier(owner, 'stroke', roleStroke, role.owner) : !!roleStroke, foregroundVisible = tokenMode ? exposedCarrier(e, 'foreground', roleForeground, role.owner) : !!roleForeground, bodyVisible = fillVisible || strokeVisible
      const properties = Object.entries(role).filter(([key]) => ['fill', 'stroke', 'foreground', 'fillOpacity', 'strokeOpacity', 'strokeWidth', 'brightness'].includes(key)).map(([property, wanted]) => {
        const paintProperty = property === 'foreground' ? 'foreground' : property.startsWith('stroke') ? 'stroke' : 'fill', paint = paintProperty === 'foreground' ? roleForeground : paintProperty === 'stroke' ? roleStroke : roleFill, visible = paintProperty === 'foreground' ? foregroundVisible : paintProperty === 'stroke' ? strokeVisible : fillVisible
        let actual: unknown = paint
        let passed: boolean | null = null
        if (['fill', 'stroke', 'foreground'].includes(property)) {
          const value = color(String(wanted)), transformed = !tokenMode || role.brightness !== undefined, actualChannels = (transformed ? paint?.channels : paint?.rawChannels) ?? (!tokenMode && route && property === 'stroke' ? color(route.stroke)?.rgb.split(',').map(Number) : undefined), factor = transformed ? Number(role.brightness ?? 1) : 1, expectedChannels = value?.rgb.split(',').map(Number).map(channel => Math.min(255, channel * factor))
          actual = actualChannels ?? null
          if (actualChannels && expectedChannels) { const scalar = property === 'fill' ? role.fillOpacity : property === 'stroke' ? role.strokeOpacity : undefined, explicitAlpha = /^(?:#[\da-f]{4}|#[\da-f]{8}|transparent)$/i.test(String(wanted)) || /^(?:rgba|hsla)\(/i.test(String(wanted)) || /\//.test(String(wanted)), expectedOpacity = value!.alpha * Number(scalar ?? 1), absence = expectedOpacity === 0, carrier = !tokenMode || absence ? !tokenMode || bodyVisible : visible, degenerate = tokenMode && !absence && paint?.parts.some(part => [0,255].some(end => part.channels.every(channel => Math.round(channel) === end) && !value!.rgb.split(',').map(Number).every(channel => channel === end)))
            if (carrier && !degenerate) passed = (absence && paint ? paint.parts.every(part => part.opacity === 0) : actualChannels.every((channel: number, i: number) => Math.abs(channel - expectedChannels[i]!) <= 1.01)) && (!paint || tokenMode && scalar === undefined && !explicitAlpha || paint.parts.every(part => Math.abs(part.opacity - expectedOpacity) < 1 / 255)) }
        } else if (property === 'brightness') {
          // The observable contract is the resulting paint, so a renderer may
          // precompute brighter colors instead of retaining a CSS filter.
          const foreground = roleForeground, fillExpected = color(String(role.fill ?? 'none')), foreExpected = color(String(role.foreground ?? 'none')), factor = Number(wanted)
          actual = { fill: paint?.channels ?? null, foreground: foreground?.channels ?? null }
          if (paint && foreground && fillExpected && foreExpected && (!tokenMode || fillVisible && foregroundVisible)) passed = [ [paint.channels, fillExpected.rgb.split(',').map(Number)], [foreground.channels, foreExpected.rgb.split(',').map(Number)] ].every(([channels, original]) => channels!.every((channel, i) => Math.abs(channel - Math.min(255, original![i]! * factor)) <= 1.01))
        }
        else if (property === 'strokeWidth') { actual = owner ? Number.parseFloat(getComputedStyle(owner).strokeWidth) : route?.strokeWidth ?? null; if (typeof actual === 'number' && (!tokenMode || bodyVisible)) passed = Math.abs(actual - Number(wanted)) < .1 }
        else { actual = paint?.opacity ?? null; if (paint && (!tokenMode || bodyVisible)) passed = paint.parts.every(part => Math.abs(part.opacity - Number(wanted)) < 1 / 255) }
        return { property, expected: wanted, actual, passed }
      })
      return { kind: role.kind, owner: role.owner, body: owner ? box(owner) : route?.box ?? null, label: e ? box(e) : null, properties, visibleCarrier: bodyVisible || foregroundVisible, equalityFill: roleFill && (fillVisible || roleFill.parts.every(part => part.opacity === 0) && bodyVisible) ? roleFill.parts.every(part => part.opacity === 0) ? 'none' : roleFill.rawChannels : null }
    })
    const equalities = tokenMode && Array.isArray(policy.equalities) ? policy.equalities.map((entry: any) => { const indices: any[] = entry.roleIndices ?? [], values = indices.map(index => Number.isInteger(index) ? observations[index]?.equalityFill ?? null : null), ready = entry.property === 'fill' && indices.length >= 2 && new Set(indices).size === indices.length && values.every(value => value !== null); return { property: entry.property, roleIndices: indices, actual: values, passed: ready ? values.every(value => same(value, values[0])) : null } }) : []
    const properties = observations.flatMap(role => role.properties), results = [...properties, ...equalities], available = policy.family === input.family && roles.length > 0 && results.length > 0 && results.every(property => property.passed !== null), valid = results.every(property => property.passed === true)
    add('theme-paint', tokenMode ? { roles: observations, equalities } : observations, results.some(property => property.passed === false) ? false : available ? valid : null, 'Source token mode compares independently measured base RGB without imposing unrequested default opacity, width or neutral brightness. Actual owned exposed carriers remain required; invisible, covered, degenerate all-white/all-black transformations and hue-changing unknown filters supply no token credit. Explicit alpha/width/brightness and same-kind fill equalities remain separate exact obligations. Legacy explicit effect policies retain composed paint comparison; identifiers, classes and model echoes earn no credit.')
  }
  let pieProfile: any = null
  if (input.family === 'pie' && facts['authored-config']) {
    const slices: any[] = facts.slices ?? [], outline = [...svg.querySelectorAll('circle')].filter(element => visible(element) && !filled(element) && Number.parseFloat(getComputedStyle(element).strokeWidth) > 0).sort((a, b) => box(b).width - box(a).width)[0]
    const outlineBox = outline ? box(outline) : null, centerPoint = outlineBox ? center(outlineBox) : null, outlineMatrix = outline?.getScreenCTM(), scale = outlineMatrix ? Math.hypot(outlineMatrix.a, outlineMatrix.b) : NaN, borderWidth = outline ? Number.parseFloat(getComputedStyle(outline).strokeWidth) : NaN, radius = outlineBox ? outlineBox.width / 2 - borderWidth * scale / 2 : NaN
    const arcs = shapes.filter(shape => shape.localName === 'path' && /[aA]/.test(shape.getAttribute('d') ?? ''))
    let arcInks: (string | undefined)[] | undefined
    const observations = slices.map(slice => {
      const legend = text.filter(element => norm(element.textContent ?? '').replace(/\s*\[[-+\d.e,]+\]$/, '') === norm(slice.label)), item = legend.length === 1 ? legend[0] : undefined, lb = item ? box(item) : null, swatches = lb ? rectangles.filter(rect => { const b = box(rect); return b.width <= 40 && b.height <= 40 && b.x + b.width <= lb.x + 2 && lb.x - b.x - b.width < 30 && Math.abs(center(b).y - center(lb).y) < Math.max(b.height, lb.height) }).sort((a, b) => box(b).x - box(a).x) : [], ink = swatches[0] ? color(getComputedStyle(swatches[0]).fill)?.rgb : null, arcFills = arcInks ??= arcs.map(arc => color(getComputedStyle(arc).fill)?.rgb), owners = arcs.filter((_, i) => arcFills[i] === ink), owner = owners.length === 1 ? owners[0] : null
      const ownCenter = owner ? point(owner, 0, 0) : null, samples = owner ? sample(owner, 2048) : [], radii = ownCenter ? samples.map(p => Math.hypot(p.x - ownCenter.x, p.y - ownCenter.y)) : [], outer = radii.length ? Math.max(...radii) : null, inner = radii.length ? Math.min(...radii) : null
      const ownerInverse = owner?.getScreenCTM()?.inverse(), labels = owner ? text.filter(element => /%$/.test(norm(element.textContent ?? '')) && (() => { const p = anchor(element); return !!ownerInverse && owner.isPointInFill(new DOMPoint(p.x, p.y).matrixTransform(ownerInverse)) })()) : [], percent = labels.length === 1 ? labels[0] : null, at = percent ? anchor(percent) : null
      return { label: slice.label, owner, center: ownCenter ? { x: ownCenter.x, y: ownCenter.y } : null, inner, outer, hole: inner !== null && outer ? inner / outer : null, textPosition: at && centerPoint && radius ? Math.hypot(at.x - centerPoint.x, at.y - centerPoint.y) / radius : null, scale: outer !== null && radius ? outer / radius : null, opacity: owner ? Number(getComputedStyle(owner).opacity) : null }
    })
    pieProfile = { center: centerPoint, radius, outlineWidth: borderWidth, observations: observations.map(({ owner: _, ...item }) => item), ready: !!outline && radius > 10 && arcs.length === slices.length && observations.every(item => item.owner && item.center && centerPoint && Math.hypot(item.center.x - centerPoint.x, item.center.y - centerPoint.y) < 1 && item.hole !== null) }
  }
  if (facts['authored-config']) {
    const config = facts['authored-config'], observations: { path: string; expected: unknown; actual: unknown; passed: boolean | null }[] = []
    const record = (path: string, expected: unknown, actual: unknown, passed: boolean | null) => observations.push({ path, expected, actual, passed })
    const leaves = (value: any, path = ''): [string, any][] => value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value).flatMap(([key, item]) => leaves(item, path ? path + '.' + key : key)) : [[path, value]]
    const equalColor = (actual: string | undefined, expected: string) => actual === undefined ? null : color(actual)?.rgb === color(expected.startsWith('#') || !/^[\da-f]{6}$/i.test(expected) ? expected : '#' + expected)?.rgb
    let sankeyBoxes: { id: string; b: Box; shape: SVGGeometryElement }[] | undefined, treeNodes: any[] | undefined
    for (const [path, wanted] of leaves(config)) {
      let actual: unknown = null, passed: boolean | null = null
      if (input.family === 'radar' && path === 'radar.axisScaleFactor' && radarProfile) { actual = radarProfile.axisScaleFactor; passed = Math.abs(radarProfile.axisScaleFactor - Number(wanted)) < .005 }
      if (input.family === 'radar' && path === 'radar.curveTension' && radarTensionProfile) { actual = radarTensionProfile; passed = radarTensionProfile.passed }
      if (input.family === 'packet' && path.startsWith('packet.')) {
        const result = checks.find(check => check.criterion === 'source-fact:fields'), printed = text.filter(element => /^\d+$/.test(norm(element.textContent ?? '')))
        if (path === 'packet.showBits') { actual = printed.length > 0; passed = actual === wanted }
        if (['packet.bitsPerRow', 'packet.bitOrder'].includes(path) && result?.status === 'passed') { actual = result.actual; passed = true }
      }
      if (input.family === 'packet' && path === 'themeVariables.packet.startByteColor') {
        const result = checks.find(check => check.criterion === 'source-fact:fields'), segments = (result?.actual as any)?.segments ?? []
        const starts = segments.map((segment: any) => text.filter(element => { if (norm(textValue(element)) !== String(segment.offsets[0])) return false; const b = box(element); return Math.abs(b.x - segment.body.x) < 1 && b.y + b.height <= segment.body.y + 1 && segment.body.y - b.y - b.height <= 25 }))
        actual = starts.map((elements: Element[]) => elements.length === 1 ? getComputedStyle(elements[0]!).fill : null)
        passed = result?.status === 'passed' && starts.length > 0 && starts.every((elements: Element[]) => elements.length === 1) ? (actual as string[]).every(value => equalColor(value, String(wanted))) : null
      }
      if (input.family === 'sankey') {
        const nodes = input.expected.nodes ?? [], boxes = sankeyBoxes ??= nodes.map(node => { const e = label(node.label), measured = (input.paint.nodes as any[]).find(item => item.id === node.id), candidates = measured?.box ? rectangles.filter(rect => Math.abs(box(rect).x - measured.box.x) < 1 && Math.abs(box(rect).y - measured.box.y) < 1 && Math.abs(box(rect).width - measured.box.width) < 1 && Math.abs(box(rect).height - measured.box.height) < 1) : e ? rectangles.filter(rect => { const b = box(rect), t = box(e), gap = Math.min(Math.abs(b.x - t.x - t.width), Math.abs(t.x - b.x - b.width)); return b.width <= 40 && b.height > 2 && gap < 20 && Math.abs(center(b).y - center(t).y) <= Math.max(t.height * 2, b.height / 2) }).sort((a, b) => Math.abs(center(box(a)).y - center(box(e)).y) - Math.abs(center(box(b)).y - center(box(e)).y)) : []; return { id: node.id, shape: candidates.length === 1 ? candidates[0] : body(e) } }).filter(node => node.shape).map(node => ({ id: node.id, b: box(node.shape!), shape: node.shape! }))
        if (path === 'sankey.showValues' && typeof wanted === 'boolean' && facts['show-values'] === wanted && boxes.length === nodes.length) {
          const displayed: any[] = facts['displayed-node-values'] ?? [], labels = nodes.map(node => wanted ? displayed.some(entry=>entry.id===node.id) ? node.label+' '+displayed.find(entry=>entry.id===node.id).display : null : node.label)
          actual=text.map(e=>norm(textValue(e)))
          passed=labels.every(Boolean) ? exactText([...sourceTitle,...labels as string[]]) : null
        }
        if (path === 'sankey.labelStyle' && wanted === 'outlined') {
          const observations=nodes.map(node=>{const owner=boxes.find(entry=>entry.id===node.id),labels=findText(node.label).filter(e=>owner&&Math.abs(center(box(e)).y-center(owner.b).y)<=Math.max(3,box(e).height*.5)&&Math.max(owner.b.x-box(e).x-box(e).width,box(e).x-owner.b.x-owner.b.width,0)<=30),paint=labels.map(e=>{const css=getComputedStyle(e);return{element:e,fill:color(css.fill)?.rgb,stroke:color(css.stroke)?.rgb,alpha:color(css.stroke)?.alpha,width:Number.parseFloat(css.strokeWidth),paintOrder:css.paintOrder,font:css.font}}),single=paint.length===1&&paint[0]!.stroke&&paint[0]!.stroke!=='255,255,255'&&paint[0]!.fill!==paint[0]!.stroke&&paint[0]!.paintOrder.startsWith('stroke'),back=paint.filter(entry=>entry.stroke&&entry.stroke!=='255,255,255'&&entry.alpha!>=1/255&&entry.width>=.25&&entry.stroke!==entry.fill),front=paint.filter(entry=>!entry.stroke),paired=paint.length===2&&back.length===1&&front.length===1&&back[0]!.fill===front[0]!.fill&&back[0]!.font===front[0]!.font&&inside(box(back[0]!.element),box(front[0]!.element),.25)&&inside(box(front[0]!.element),box(back[0]!.element),.25)&&!!(back[0]!.element.compareDocumentPosition(front[0]!.element)&Node.DOCUMENT_POSITION_FOLLOWING)
            return{id:node.id,labels:paint.map(({element:_,...entry})=>entry),outlined:!!single||!!paired}})
          actual=observations
          passed=boxes.length===nodes.length&&input.paint.checks.some(check=>check.criterion==='unclipped-authored-labels'&&check.status==='passed') ? observations.every(entry=>entry.outlined) ? true : null : null
        }
        if (path === 'sankey.nodeWidth') { actual = boxes.map(node => { const matrix = node.shape.getScreenCTM(); return matrix ? node.b.width / Math.hypot(matrix.a, matrix.b) : null }); passed = boxes.length === nodes.length && boxes.length > 0 ? (actual as (number | null)[]).every(value => value !== null && Math.abs(value - Number(wanted)) < .1) : null }
        if (path === 'sankey.nodePadding') { const gaps = boxes.flatMap((a, i) => boxes.slice(i + 1).filter(b => Math.abs(a.b.x - b.b.x) < 2).map(b => { const matrix = a.shape.getScreenCTM(); return matrix ? Math.max(b.b.y - a.b.y - a.b.height, a.b.y - b.b.y - b.b.height) / Math.hypot(matrix.c, matrix.d) : NaN })); actual = gaps; passed = gaps.length ? Math.min(...gaps) >= Number(wanted) - .5 : null }
        if (path.startsWith('sankey.nodeColors.')) { const id = path.slice('sankey.nodeColors.'.length), node = boxes.find(node => node.id === id); actual = node ? getComputedStyle(node.shape).fill : null; passed = node ? equalColor(String(actual), String(wanted)) : null }
      }
      if (input.family === 'treeview') {
        const nodes = treeNodes ??= (facts.hierarchy ?? []).map((entry: any) => { const declared = input.expected.nodes?.find(node => node.id === entry.id), e = label(declared?.label ?? entry.id.split('/').at(-1)); return { entry, e } }).filter((item: any) => item.e)
        if (['themeVariables.treeView.labelColor', 'themeVariables.treeView.labelFontSize'].includes(path)) { actual = nodes.map((item: any) => path.endsWith('labelColor') ? getComputedStyle(item.e).fill : Number.parseFloat(getComputedStyle(item.e).fontSize)); passed = nodes.length === facts.hierarchy?.length ? (actual as any[]).every(value => path.endsWith('labelColor') ? equalColor(value, String(wanted)) : Math.abs(value - Number.parseFloat(wanted)) < .1) : null }
        const lines = paths.filter(path => path.localName === 'line')
        if (['treeView.lineThickness', 'themeVariables.treeView.lineColor'].includes(path)) { actual = lines.map(line => path.endsWith('lineColor') ? getComputedStyle(line).stroke : Number.parseFloat(getComputedStyle(line).strokeWidth)); passed = lines.length ? (actual as any[]).every(value => path.endsWith('lineColor') ? equalColor(value, String(wanted)) : Math.abs(value - Number(wanted)) < .1) : null }
        if (path === 'treeView.rowIndent') { const fact = checks.find(check => check.criterion === 'source-fact:hierarchy'), matrix = svg.getScreenCTM(); actual = matrix && (fact?.actual as any)?.measuredIndent ? (fact!.actual as any).measuredIndent / Math.hypot(matrix.a, matrix.b) - Number(config.treeView?.paddingX ?? 5) : null; passed = typeof actual === 'number' ? Math.abs(actual - Number(wanted)) < .1 : null }
      }
      if (input.family === 'xychart' && ['xyChart.showDataLabel', 'xyChart.showDataLabelOutsideBar'].includes(path)) { const check = checks.find(check => check.criterion === 'source-fact:displayed-bar-values'); actual = check?.actual ?? null; passed = check?.status === 'passed' ? true : check?.status === 'failed' ? false : null }
      if (input.family === 'treemap' && path === 'treemap.diagramPadding') {
        const matrix = svg.getScreenCTM(), view = svg.viewBox.baseVal, ink = [...svg.querySelectorAll('rect,circle,ellipse,path,polygon,line,polyline,text,foreignObject')].filter(e => visible(e)).map(box).filter(b => b.width + b.height > 0)
        if (matrix && Math.abs(matrix.b)<1e-8 && Math.abs(matrix.c)<1e-8 && matrix.a>0 && matrix.d>0 && view.width>0 && view.height>0 && ink.length) {
          const left = Math.min(...ink.map(b=>b.x)), top=Math.min(...ink.map(b=>b.y)), right=Math.max(...ink.map(b=>b.x+b.width)), bottom=Math.max(...ink.map(b=>b.y+b.height)), inverse=matrix.inverse(), a=new DOMPoint(left,top).matrixTransform(inverse), b=new DOMPoint(right,bottom).matrixTransform(inverse)
          actual=[a.x-view.x,a.y-view.y,view.x+view.width-b.x,view.y+view.height-b.y]
          passed=Number.isFinite(Number(wanted)) && Number(wanted)>=0 ? (actual as number[]).every(value=>value>=Number(wanted)-1) : null
        }
      }
      if (input.family === 'xychart' && ['xyChart.width', 'xyChart.height'].includes(path)) {
        const view = svg.viewBox.baseVal, measure = path.endsWith('width') ? view.width : view.height
        actual = measure > 0 ? measure : null
        passed = actual !== null && input.paint.checks.some(check => check.criterion === 'canvas' && check.status === 'passed') ? Math.abs(measure - Number(wanted)) < 1 : null
      }
      if (input.family === 'xychart' && path === 'themeVariables.xyChart.titleColor') {
        const e = typeof facts.title === 'string' ? label(facts.title) : undefined
        actual = e ? getComputedStyle(e).fill : null
        passed = e && input.quantitative.some(check => check.criterion === 'source-fact:series' && check.status === 'passed') && input.paint.checks.some(check => check.criterion === 'visible-authored-labels' && check.status === 'passed') ? equalColor(String(actual), String(wanted)) : null
      }
      if (input.family === 'quadrant' && ['quadrantChart.chartWidth', 'quadrantChart.chartHeight'].includes(path)) {
        const rectBoxes = rectangles.map(box), regionBoxes = rectBoxes.filter(b => rectBoxes.filter(other => Math.abs(other.width - b.width) < 2 && Math.abs(other.height - b.height) < 2).length === 4), matrix = svg.getScreenCTM(), view = svg.viewBox.baseVal
        const xs = [...new Set(regionBoxes.map(b => Math.round(b.x)))].sort((a, b) => a - b), ys = [...new Set(regionBoxes.map(b => Math.round(b.y)))].sort((a, b) => a - b)
        const grid = regionBoxes.length === 4 && xs.length === 2 && ys.length === 2 && xs.every(x => ys.every(y => regionBoxes.filter(b => Math.abs(b.x - x) < 1 && Math.abs(b.y - y) < 1).length === 1)) && Math.abs(xs[1]! - xs[0]! - regionBoxes[0]!.width) < 2 && Math.abs(ys[1]! - ys[0]! - regionBoxes[0]!.height) < 2
        const corners = matrix && view.width > 0 && view.height > 0 ? [new DOMPoint(view.x, view.y).matrixTransform(matrix), new DOMPoint(view.x + view.width, view.y + view.height).matrixTransform(matrix)] : null
        const canvas = corners ? { x: corners[0]!.x, y: corners[0]!.y, width: corners[1]!.x - corners[0]!.x, height: corners[1]!.y - corners[0]!.y } : null
        // Public chartWidth/Height define the complete SVG viewBox; axis/title
        // gutters and quadrantPadding are subtracted only from the inner plot.
        actual = grid && canvas && matrix && Math.abs(matrix.b) < 1e-8 && Math.abs(matrix.c) < 1e-8 && canvas.width > 0 && canvas.height > 0 && regionBoxes.every(b => inside(canvas, b)) ? path.endsWith('Width') ? view.width : view.height : null
        passed = typeof actual === 'number' ? Math.abs(actual - Number(wanted)) < 1 : null
      }
      if (input.family === 'pie' && pieProfile?.ready) {
        if (path === 'pie.donutHole') { actual = pieProfile.observations.map((item: any) => item.hole); passed = (actual as number[]).every(value => Math.abs(value - Number(wanted)) < .008) }
        if (path === 'pie.textPosition') { actual = pieProfile.observations.map((item: any) => item.textPosition); passed = (actual as (number | null)[]).every(value => value !== null) ? (actual as number[]).every(value => Math.abs(value - Number(wanted)) < .025) : null }
        if (path === 'themeVariables.pieOuterStrokeWidth') { actual = pieProfile.outlineWidth; passed = Math.abs(Number(actual) - Number.parseFloat(String(wanted))) < .1 }
        if (path === 'pie.highlightSlice' && wanted !== 'hover') { actual = pieProfile.observations.map((item: any) => ({ label: item.label, scale: item.scale, opacity: item.opacity })); const known = (actual as any[]).every(item => (Math.abs(item.scale - 1) < .008 || Math.abs(item.scale - 1.05) < .008) && (Math.abs(item.opacity - .7) < .01 || Math.abs(item.opacity - 1) < .01)); passed = known ? (actual as any[]).every(item => item.label === wanted ? Math.abs(item.scale - 1.05) < .008 && Math.abs(item.opacity - 1) < .01 : Math.abs(item.scale - 1) < .008 && Math.abs(item.opacity - .7) < .01) : null }
      }
      if (input.family === 'gitgraph' && gitConfig.has(path)) { const projected = gitConfig.get(path)!; actual = projected.actual; passed = projected.passed }
      record(path, wanted, actual, passed)
    }
    const decisiveFailure = observations.some(entry => entry.passed === false), complete = observations.length > 0 && observations.every(entry => entry.passed !== null)
    add('authored-config', observations, decisiveFailure ? false : complete ? true : null, 'Each authored configuration leaf retains its own independently measured visible projection. Supported owned geometry, printed values and explicit colors are checked directly; theme names, layout engines, invisible settings, unknown asset identities and other unprojected properties remain required unknowns. A visible contrary leaf cannot be hidden by unsupported siblings.')
  }
  return checks
}
