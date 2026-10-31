import type { MeaningExpectation, PaintExpectation } from './meaning.ts'

export interface PaintCheck { criterion: string; status: 'passed' | 'failed' | 'unavailable'; expected: unknown; actual: unknown; scope: string }
export interface PaintEvidence { checks: PaintCheck[]; complete: boolean; passed: boolean; nodes: unknown[]; connections: unknown[]; viewBox: string | null; groups?: { id: string; label: string; box: { x: number; y: number; width: number; height: number } }[]; camouflagedText?: { text: string; box: { x: number; y: number; width: number; height: number } }[]; camouflagedGeometry?: { tag: string; box: { x: number; y: number; width: number; height: number } }[] }
export interface PaintInput { family: string; expected: MeaningExpectation; paint?: PaintExpectation }

/** The authored request fixes the denominator before any renderer runs. */
export function plannedPaintCriteria(input: PaintInput): string[] {
  return ['svg-root', 'svg-unique-ids', 'canvas', 'visible-authored-labels', 'labels-within-canvas', 'unclipped-authored-labels', 'visible-ink', 'paint-opacity-and-color',
    ...(input.expected.forbiddenLabels?.length ? ['hidden-authored-content'] : []),
    ...(input.paint?.images?.length ? ['embedded-images'] : []),
    ...(input.paint?.fontSize !== undefined ? ['computed-authored-font-size'] : []),
    ...(input.paint?.nodeFill !== undefined ? ['computed-owned-node-fill'] : []),
    ...(input.paint?.edgeStroke !== undefined || input.paint?.edgeStrokeWidth !== undefined ? ['computed-owned-edge-style'] : []),
    ...(input.expected.nodes?.length ? ['painted-node-ownership'] : []),
    ...(input.expected.edges !== undefined ? ['painted-relationships'] : []),
    ...(input.expected.edges?.some(edge => edge.label) ? ['painted-relationship-label-counts', 'painted-relationship-label-ownership'] : []),
    ...(input.expected.edges?.some(edge => edge.startMarker !== undefined || edge.endMarker !== undefined) ? ['painted-relationship-markers'] : []),
    ...(input.family === 'er' && input.expected.facts?.cardinalities ? ['painted-cardinality-decorations'] : []),
    ...(input.expected.groups ?? []).map(group => 'painted-group:' + group.id)]
}

/** Runs in the actual browser after mounting the returned SVG. All geometry is
 * measured from this implementation's ink; Mermaid coordinates are no oracle. */
export async function inspectFidelityPaint(input: PaintInput): Promise<PaintEvidence> {
  const checks: PaintCheck[] = []
  const check = (criterion: string, expected: unknown, actual: unknown, passed: boolean | null, scope: string) => checks.push({ criterion, expected, actual, status: passed === null ? 'unavailable' : passed ? 'passed' : 'failed', scope })
  const svg = document.querySelector('svg')
  if (!svg) return { checks: [{ criterion: 'svg-root', status: 'failed', expected: 'mounted SVG', actual: null, scope: 'Actual public SVG result; remaining planned paint evidence is unavailable' }], complete: false, passed: false, nodes: [], connections: [], viewBox: null }
  check('svg-root', 'mounted SVG', 'svg', true, 'Actual public SVG result')
  const ids = [...(svg.id ? [svg.id] : []), ...[...svg.querySelectorAll('[id]')].map(element => element.id)]
  check('svg-unique-ids', ids.length, new Set(ids).size, ids.length === new Set(ids).size, 'Duplicate SVG identities can change marker, clip and owned-label references')
  await document.fonts.ready
  const requiredLabels = [...new Set([...input.expected.labels, ...(typeof input.expected.facts?.title === 'string' && input.expected.facts.title ? [input.expected.facts.title] : [])])]
  const normalize = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
  const rect = (element: Element) => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
  const labelBox = (element: Element) => { if (element.namespaceURI === 'http://www.w3.org/2000/svg') return rect(element); const range = document.createRange(); range.selectNodeContents(element); const b = range.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
  type Box = ReturnType<typeof rect>
  const center = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 })
  const contains = (outer: Box, inner: Box, epsilon = 1.5) => inner.x >= outer.x - epsilon && inner.y >= outer.y - epsilon && inner.x + inner.width <= outer.x + outer.width + epsilon && inner.y + inner.height <= outer.y + outer.height + epsilon
  const colorCanvas = document.createElement('canvas').getContext('2d')!
  const colors = new Map<string, number | null>()
  const unknownPaint = new Set<string>()
  // A single SVG drop shadow composites SourceGraphic over its shadow. Admit
  // only that bounded form: arbitrary filter graphs or a clipped filter region
  // can remove the authored ink and must remain unobserved.
  const preservesSourceGraphic = (setting: string): boolean => {
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
  const colorAlpha = (color: string): number | null => {
    if (['none', 'transparent'].includes(color)) return 0
    if (/url\(/.test(color)) {
      const id = /#([^\s)"']+)/.exec(color)?.[1], gradient = id ? document.getElementById(decodeURIComponent(id)) : null
      const stops = gradient && svg.contains(gradient) && ['linearGradient', 'radialGradient'].includes(gradient.localName) && !gradient.hasAttribute('href') && !gradient.hasAttributeNS('http://www.w3.org/1999/xlink', 'href') ? [...gradient.children].filter(child => child.localName === 'stop') : []
      const alphas = stops.map(stop => { const style = getComputedStyle(stop), value = colorAlpha(style.stopColor); return value === null || style.display === 'none' ? null : value * Number(style.stopOpacity) })
      if (alphas.length && alphas.every((alpha): alpha is number => alpha !== null && alpha > 0)) return Math.min(...alphas)
      unknownPaint.add(color); return null
    }
    if (/context-|var\(/.test(color)) { unknownPaint.add(color); return null }
    if (colors.has(color)) return colors.get(color)!
    colorCanvas.clearRect(0, 0, 1, 1); colorCanvas.fillStyle = color; colorCanvas.fillRect(0, 0, 1, 1)
    const alpha = colorCanvas.getImageData(0, 0, 1, 1).data[3]! / 255; colors.set(color, alpha); return alpha
  }
  const multiplyOnWhite = (element: Element) => {
    if (input.family !== 'sankey' || element.localName !== 'path') return false
    const path = element as SVGGeometryElement, matrix = path.getScreenCTM(), length = path.getTotalLength()
    if (!matrix || !length) return false
    const points = Array.from({ length: 9 }, (_, index) => path.getPointAtLength(length * index / 8).matrixTransform(matrix))
    if (points.some(point => Math.abs(point.y - points[0]!.y) > .1)) return false
    for (let parent: Element | null = element; parent; parent = parent.parentElement) { const style = getComputedStyle(parent); if (style.backgroundImage !== 'none' || colorAlpha(style.backgroundColor) !== 0 && style.backgroundColor !== 'rgb(255, 255, 255)') return false }
    const b = rect(element), half = Number.parseFloat(getComputedStyle(element).strokeWidth) * Math.hypot(matrix.c, matrix.d) / 2, painted = { x: b.x, y: b.y - half, width: b.width, height: b.height + half * 2 }
    for (const prior of svg.querySelectorAll('rect,circle,ellipse,polygon,path,line,image,use')) {
      if (prior === element || !(prior.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) || prior.closest('defs,marker,clipPath,mask')) continue
      const style = getComputedStyle(prior), box = rect(prior)
      if (style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility) || Number(style.opacity) === 0) continue
      if (prior.localName === 'rect' && style.fill === 'rgb(255, 255, 255)' && colorAlpha(style.stroke) === 0) continue
      if (colorAlpha(style.fill) === 0 && colorAlpha(style.stroke) === 0) continue
      if (['path', 'line', 'polyline'].includes(prior.localName) && colorAlpha(style.stroke) !== 0) {
        const matrix = (prior as SVGGraphicsElement).getScreenCTM(), width = Number.parseFloat(style.strokeWidth) * (matrix ? Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)) : 1)
        if (box.height <= .1) { box.y -= width / 2; box.height += width }
        else if (box.width <= .1) { box.x -= width / 2; box.width += width }
        else { box.x -= width / 2; box.y -= width / 2; box.width += width; box.height += width }
      }
      if (Math.min(painted.x + painted.width, box.x + box.width) - Math.max(painted.x, box.x) > .5 && Math.min(painted.y + painted.height, box.y + box.height) - Math.max(painted.y, box.y) > .5) return false
    }
    return true
  }
  const visible = (element: Element, definitions = false) => {
    let opacity = 1
    for (let current: Element | null = element; current; current = current.parentElement) {
      const style = getComputedStyle(current)
      opacity *= Number(style.opacity)
      if ((!definitions && ['defs', 'marker', 'clipPath', 'mask', 'symbol'].includes(current.localName)) || ['none'].includes(style.display) || ['hidden', 'collapse'].includes(style.visibility) || Number(style.opacity) === 0) return false
      if (/opacity\(\s*0(?:\.0+)?%?\s*\)/.test(style.filter)) return false
      if (style.filter && style.filter !== 'none' && !preservesSourceGraphic(style.filter)) unknownPaint.add('filter:' + style.filter)
      if (style.mixBlendMode && style.mixBlendMode !== 'normal' && !(style.mixBlendMode === 'multiply' && multiplyOnWhite(element))) unknownPaint.add('blend:' + style.mixBlendMode)
      if (current === svg) break
    }
    if (element.localName === 'image') return true
    const style = getComputedStyle(element)
    const fill = colorAlpha(style.fill), stroke = colorAlpha(style.stroke)
    const fillVisible = element.localName !== 'line' && (fill === null || fill * Number(style.fillOpacity) > 0)
    const strokeVisible = stroke === null || stroke * Number(style.strokeOpacity) > 0 && Number.parseFloat(style.strokeWidth) > 0
    const paintedAlpha = Math.max(fillVisible ? (fill ?? 1) * Number(style.fillOpacity) : 0, strokeVisible ? (stroke ?? 1) * Number(style.strokeOpacity) : 0) * opacity
    if (paintedAlpha > 0 && paintedAlpha < 1 / 255) unknownPaint.add('subpixel-alpha:' + element.localName)
    if (strokeVisible && Number.parseFloat(style.strokeWidth) < 1 / 255) unknownPaint.add('subpixel-stroke:' + element.localName)
    if (element.namespaceURI !== 'http://www.w3.org/2000/svg') { const color = colorAlpha(style.color); if (color !== null && color * opacity > 0 && color * opacity < 1 / 255) unknownPaint.add('subpixel-alpha:HTML'); return color === null || color > 0 }
    return (!['text', 'tspan'].includes(element.localName) || Number.parseFloat(style.fontSize) > 0) && (fillVisible || strokeVisible)
  }
  const rootBox = rect(svg)
  check('canvas', 'positive finite rendered canvas', rootBox, [rootBox.x, rootBox.y, rootBox.width, rootBox.height].every(Number.isFinite) && rootBox.width > 0 && rootBox.height > 0, 'Actual browser viewport of the returned SVG')
  const labelText = (element: Element): string => {
    if (element.namespaceURI !== 'http://www.w3.org/2000/svg') return (element as HTMLElement).innerText ?? element.textContent ?? ''
    let result = '', previous: DOMRect | undefined
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) { result += child.textContent ?? ''; const range = document.createRange(); range.selectNodeContents(child); const box = range.getBoundingClientRect(); if (box.width && box.height) previous = box; continue }
      if (!(child instanceof Element)) continue
      const box = child.getBoundingClientRect()
      if (previous && Math.abs(box.y - previous.y) > Math.max(1, Math.min(box.height, previous.height) * .4)) result += ' '
      result += labelText(child); previous = box
    }
    return result
  }
  const labelElements = [...svg.querySelectorAll('text,foreignObject *')].filter(element => normalize(labelText(element)) && (element.namespaceURI === 'http://www.w3.org/2000/svg' ? element.localName === 'text' : ![...element.children].some(child => normalize(labelText(child)) === normalize(labelText(element)))))
  const matches = (label: string) => {
    const exact = labelElements.filter(element => normalize(labelText(element)) === normalize(label))
    if (exact.length) return exact
    const token = normalize(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp('(?<![\\p{L}\\p{N}_])' + token + '(?![\\p{L}\\p{N}_])', 'u')
    return labelElements.filter(element => pattern.test(normalize(labelText(element))))
  }
  const visibleMatches = (label: string) => matches(label).filter(element => visible(element) && labelBox(element).width > 0 && labelBox(element).height > 0)
  const labelResults = [...new Set(requiredLabels.filter(Boolean))].map(label => {
    const elements = visibleMatches(label)
    return { label, count: elements.length, boxes: elements.map(labelBox), inCanvas: elements.length > 0 && elements.every(element => contains(rootBox, labelBox(element))) }
  })
  const imageBackedLabels = labelElements.length === 0 && !!svg.querySelector('image')
  // A positive-alpha glyph can still be invisible against its own body. This
  // negative control proves exact colour camouflage only on an actual opaque
  // flat backdrop; it does not claim a general contrast/accessibility score.
  const measureCamouflage = (element: Element) => {
    const box = labelBox(element), css = getComputedStyle(element)
    const foreground = element.namespaceURI === 'http://www.w3.org/2000/svg' ? css.fill : css.color
    const strokeVisible = colorAlpha(css.stroke) !== 0 && Number(css.strokeOpacity) > 0 && Number.parseFloat(css.strokeWidth) > 0
    const foregroundAlpha = colorAlpha(foreground), strokeAlpha = colorAlpha(css.stroke)
    if (foregroundAlpha === null || strokeVisible && strokeAlpha === null) return false
    const uniform = (paint: string) => { const id = /#([^\s)"']+)/.exec(paint)?.[1], gradient = id ? document.getElementById(decodeURIComponent(id)) : null, stops = gradient && ['linearGradient', 'radialGradient'].includes(gradient.localName) ? [...gradient.querySelectorAll('stop')] : []; return stops.length && stops.every(stop => getComputedStyle(stop).stopColor === getComputedStyle(stops[0]!).stopColor) ? getComputedStyle(stops[0]!).stopColor : paint }
    const paints = [...(foregroundAlpha && Number(css.fillOpacity) > 0 ? [uniform(foreground)] : []), ...(strokeVisible ? [uniform(css.stroke)] : [])]
    if (!paints.length) return false
    const backdrop = [...svg.querySelectorAll('rect,circle,ellipse,polygon,path')].filter(shape => {
      if (shape.contains(element) || !(shape.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) || !visible(shape)) return false
      const style = getComputedStyle(shape), matrix = (shape as SVGGraphicsElement).getScreenCTM?.()
      if (!matrix || colorAlpha(style.fill) !== 1 || Number(style.fillOpacity) !== 1) return false
      for (let parent: Element | null = shape; parent; parent = parent.parentElement) { const style = getComputedStyle(parent); if (Number(style.opacity) !== 1 || style.maskImage !== 'none' || style.clipPath !== 'none' || style.mixBlendMode !== 'normal' || style.filter !== 'none' && !preservesSourceGraphic(style.filter)) return false; if (parent === svg) break }
      return [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]].every(([x, y]) => (shape as SVGGeometryElement).isPointInFill?.(new DOMPoint(x, y).matrixTransform(matrix.inverse())))
    }).at(-1)
    if (backdrop) return paints.every(color => color === getComputedStyle(backdrop).fill)
    // The observer's browser canvas is white unless an opaque CSS background
    // says otherwise. Use that only when no intervening ink can alter it.
    const intervening = [...svg.querySelectorAll('rect,circle,ellipse,polygon,path,line,image,use,foreignObject')].some(shape => {
      if (shape.contains(element) || !(shape.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) || !visible(shape)) return false
      const b = rect(shape), style = getComputedStyle(shape)
      return Math.min(box.x + box.width, b.x + b.width) > Math.max(box.x, b.x) && Math.min(box.y + box.height, b.y + b.height) > Math.max(box.y, b.y) && (['image', 'use', 'foreignObject'].includes(shape.localName) || colorAlpha(style.fill) !== 0 || colorAlpha(style.stroke) !== 0 && Number.parseFloat(style.strokeWidth) > 0)
    })
    if (intervening) return false
    let background = 'rgb(255, 255, 255)'
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent), alpha = colorAlpha(style.backgroundColor)
      if (style.backgroundImage !== 'none' || alpha !== 0 && alpha !== 1) return false
      if (alpha === 1) { background = style.backgroundColor; break }
    }
    return paints.every(color => color === background)
  }
  const camouflageResults = new Map<Element, boolean>()
  const camouflage = (element: Element) => { if (!camouflageResults.has(element)) camouflageResults.set(element, measureCamouflage(element)); return camouflageResults.get(element)! }
  const camouflagedElements = new Set(labelElements.filter(element => visible(element) && camouflage(element)))
  const camouflagedText = [...camouflagedElements].map(element => ({ text: normalize(labelText(element)), box: labelBox(element) }))
  const camouflaged = requiredLabels.filter(label => visibleMatches(label).some(element => camouflagedElements.has(element)))
  check('visible-authored-labels', input.expected.labels, labelResults.map(item => ({ label: item.label, count: item.count, camouflaged: camouflaged.includes(item.label) })), imageBackedLabels ? null : labelResults.every(item => item.count > 0) && camouflaged.length === 0, imageBackedLabels ? 'Image-backed text needs reviewed image/OCR evidence, not a missing-label verdict' : 'Computed visibility and nonzero browser text bounds, rejecting glyphs proved identical to their own opaque flat backdrop. Metadata/title/defs text earns no credit; this is not general contrast or accessibility certification')
  check('labels-within-canvas', 'every authored label fits the canvas', labelResults.filter(item => !item.inCanvas), imageBackedLabels ? null : labelResults.every(item => item.inCanvas), 'Actual rendered label bounds, with 1.5 CSS-pixel serialization tolerance')
  if (input.expected.forbiddenLabels?.length) {
    const painted: string[] = [], uncertain: string[] = []
    for (const label of input.expected.forbiddenLabels) for (const element of visibleMatches(label)) {
      const box = labelBox(element)
      let unresolved = !contains(rootBox, box)
      for (let parent: Element | null = element; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.clipPath !== 'none' || style.maskImage !== 'none' || style.clip !== 'auto' || ['hidden', 'clip'].includes(style.overflowX) && !contains(rect(parent), box) || ['hidden', 'clip'].includes(style.overflowY) && !contains(rect(parent), box)) unresolved = true
        if (parent === svg) break
      }
      ;(unresolved ? uncertain : painted).push(label)
    }
    check('hidden-authored-content', input.expected.forbiddenLabels, { painted, uncertain }, painted.length ? false : uncertain.length ? null : true, 'Explicitly hidden source labels must not be drawn; metadata and display:none text are excluded, unprojected clipping remains unknown')
  }
  const clipped: string[] = []
  let unknownClipping = false
  for (const label of requiredLabels.filter(Boolean)) for (const element of visibleMatches(label)) {
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent)
      const outer = rect(parent), ink = labelBox(element)
      if (['hidden', 'clip'].includes(style.overflowX) && (ink.x < outer.x - 1.5 || ink.x + ink.width > outer.x + outer.width + 1.5) || ['hidden', 'clip'].includes(style.overflowY) && (ink.y < outer.y - 1.5 || ink.y + ink.height > outer.y + outer.height + 1.5)) clipped.push(label)
      if (style.clip && style.clip !== 'auto') { unknownClipping = true; check('legacy-clip:' + label, 'label survives legacy CSS clipping', style.clip, null, 'Legacy CSS clip rectangles need a reviewed projection') }
      const clip = style.clipPath
      if (clip && clip !== 'none') {
        const id = /#([^\s)"']+)/.exec(clip)?.[1], clipElement = id ? document.getElementById(decodeURIComponent(id)) : null
        const shapes = clipElement ? [...clipElement.children] : []
        const shape = shapes.length === 1 && ['rect', 'circle', 'ellipse'].includes(shapes[0]!.localName) ? shapes[0] as SVGGeometryElement : undefined
        const matrix = (parent as SVGGraphicsElement).getScreenCTM?.()
        if (shape && matrix && clipElement?.getAttribute('clipPathUnits') !== 'objectBoundingBox' && !shape.hasAttribute('transform') && !clipElement?.hasAttribute('transform')) {
          const box = labelBox(element), inverse = matrix.inverse(), points = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
          if (!points.every(([x, y]) => shape.isPointInFill(new DOMPoint(x, y).matrixTransform(inverse)))) clipped.push(label)
        } else { unknownClipping = true; check('clip-path:' + label, 'label remains inside the actual clipping path', clip, null, 'Complex or object-bounding-box clipping requires a reviewed projection; no paint-complete credit') }
      }
      if (style.maskImage && style.maskImage !== 'none') { unknownClipping = true; check('mask:' + label, 'label survives its actual mask', style.maskImage, null, 'Mask alpha is not inferred from a positive text bounding box') }
      if (parent === svg) break
    }
  }
  // Computed visibility is insufficient when later opaque SVG paint hides the
  // label. Prove full occlusion only for simple convex filled primitives; an
  // overlapping unprojected cover withholds completeness instead of passing.
  for (const label of requiredLabels.filter(Boolean)) for (const element of visibleMatches(label)) {
    const ink = labelBox(element)
    for (const cover of svg.querySelectorAll('rect,circle,ellipse,polygon,path,image,use,foreignObject')) {
      if (cover.contains(element) || element.contains(cover) || !(element.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING) || !visible(cover)) continue
      const outer = rect(cover), overlap = Math.min(ink.x + ink.width, outer.x + outer.width) - Math.max(ink.x, outer.x) > .5 && Math.min(ink.y + ink.height, outer.y + outer.height) - Math.max(ink.y, outer.y) > .5
      if (!overlap) continue
      const style = getComputedStyle(cover)
      if (!['image', 'use', 'foreignObject'].includes(cover.localName) && (colorAlpha(style.fill) === 0 || Number(style.fillOpacity) === 0)) continue
      let simple = ['rect', 'circle', 'ellipse'].includes(cover.localName) && colorAlpha(style.fill) === 1 && Number(style.fillOpacity) === 1
      for (let parent: Element | null = cover; parent; parent = parent.parentElement) { const css = getComputedStyle(parent); if (Number(css.opacity) !== 1 || css.clipPath !== 'none' || css.maskImage !== 'none' || css.filter !== 'none' || css.mixBlendMode !== 'normal' || !['auto', '0'].includes(css.zIndex)) simple = false; if (parent === svg) break }
      const matrix = (cover as SVGGraphicsElement).getScreenCTM?.()
      const corners = [[ink.x, ink.y], [ink.x + ink.width, ink.y], [ink.x, ink.y + ink.height], [ink.x + ink.width, ink.y + ink.height]]
      if (simple && matrix && corners.every(([x, y]) => (cover as SVGGeometryElement).isPointInFill?.(new DOMPoint(x, y).matrixTransform(matrix.inverse())))) clipped.push(label)
      else { unknownClipping = true; check('occlusion:' + label, 'required text survives later overlapping paint', { cover: cover.localName, box: outer }, null, 'Partial, translucent, clipped or complex later paint can obscure authored glyphs; no visible-text completeness is inferred from its bounding box') }
    }
  }
  check('unclipped-authored-labels', [], clipped, clipped.length ? false : unknownClipping ? null : true, 'Actual clipping, overflow and later opaque covers; unprojected masks, partial occlusion and clip paths remain unavailable')
  if (input.paint?.fontSize !== undefined) {
    const sizes = requiredLabels.filter(Boolean).map(label => ({ label, values: visibleMatches(label).flatMap(element => {
      const descendants = [...element.querySelectorAll('tspan,span,p')].filter(child => normalize(labelText(child)) && visible(child))
      return (descendants.length ? descendants : [element]).map(child => Number.parseFloat(getComputedStyle(child).fontSize))
    }) }))
    check('computed-authored-font-size', input.paint.fontSize, sizes, sizes.every(item => item.values.length > 0 && item.values.every(size => Number.isFinite(size) && Math.abs(size - input.paint!.fontSize!) <= .1)), 'Every authored text run must receive the requested public font size; one unrelated matching label earns no credit')
  }
  const images: Array<{ href: string; loaded: boolean; visible: boolean; clipUnknown: boolean; box: Box; error?: string }> = []
  for (const element of svg.querySelectorAll('image')) {
    const href = element.getAttribute('href') ?? element.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? ''
    const image = new Image(); image.src = href
    let clipUnknown = false
    for (let current: Element | null = element; current; current = current.parentElement) { const style = getComputedStyle(current); if (style.clipPath && style.clipPath !== 'none' || style.maskImage && style.maskImage !== 'none') clipUnknown = true; if (current === svg) break }
    const box = rect(element), painted = visible(element) && box.width > 0 && box.height > 0 && contains(rootBox, box)
    try { await Promise.race([image.decode(), new Promise((_, reject) => setTimeout(() => reject(Error('Image decode timeout')), 5000))]); images.push({ href, loaded: true, visible: painted, clipUnknown, box }) }
    catch (error) { images.push({ href, loaded: false, visible: painted, clipUnknown, box, error: String(error) }) }
  }
  if (input.paint?.images?.length) {
    const retained = input.paint.images.every(requested => images.filter(image => image.href === requested.href).length === requested.count)
    const requested = images.filter(image => input.paint!.images!.some(expected => image.href === expected.href)), extra = images.filter(image => !requested.includes(image))
    check('embedded-images', input.paint.images, requested, !retained || requested.some(image => !image.visible) ? false : requested.some(image => !image.loaded || image.clipUnknown) ? null : true, 'Exact authored assets and visible geometry are required. Missing/wrong references or nonvisible geometry fail; matching references whose decode/clip cannot be observed stay unavailable because asset or host prerequisites may have failed. No decode credit is inferred from the href alone.')
    if (extra.length) check('emitted-image-decoding', 'extra emitted image prerequisites are inspectable', extra, extra.every(image => image.loaded && image.visible && !image.clipUnknown) ? true : null, 'Diagnostic only: unavailable extra images cannot be attributed to the renderer without separate asset/host evidence and supply no drawing correctness credit')
  } else if (images.length) check('emitted-image-decoding', 'emitted image prerequisites are inspectable', images, images.every(item => item.loaded && item.visible && !item.clipUnknown) ? true : null, 'Diagnostic only: decoding emitted images does not prove retention of an author-requested image; unavailable asset/host evidence stays unknown')
  const geometry = [...svg.querySelectorAll('path,line,rect,circle,ellipse,polygon,polyline')].filter(element => visible(element) && rect(element).width + rect(element).height > 0 && !camouflage(element))
  const camouflagedGeometry = [...svg.querySelectorAll('path,line,rect,circle,ellipse,polygon,polyline')].filter(element => visible(element) && camouflage(element)).map(element => ({ tag: element.localName, box: rect(element) }))
  const paintedText = labelElements.filter(element => visible(element) && !camouflage(element) && labelBox(element).width > 0 && labelBox(element).height > 0)
  check('visible-ink', 'nonempty visible diagram geometry or text', { geometry: geometry.length, text: paintedText.length }, geometry.length + paintedText.length > 0 ? true : svg.querySelector('use,foreignObject,image') ? null : false, 'Actual non-camouflaged geometry/text, including browser-painted HTML labels; image/use-only ink needs a qualified image projection')
  const ownedBox = (element: Element, identity?: string, group = false): { owner: Element; shape: Element; box: Box; outlines?: Element[] } | undefined => {
    const point = center(rect(element))
    for (let current: Element | null = element.parentElement; current && current !== svg; current = current.parentElement) {
      const declaredGroup = current.matches('.cluster,.pele-cluster,[data-role="group"]')
      if (declaredGroup && !group) return undefined
      const shapes = [...current.querySelectorAll('rect,circle,ellipse,polygon,path')].filter(child => visible(child) && !camouflage(child))
      const candidates = shapes.filter(child => { const box = rect(child); return box.width > 0 && box.height > 0 && contains(box, { ...point, width: 0, height: 0 }, 2) })
      // A compartment header is ink inside its node, not the node boundary.
      const shape = candidates.find(candidate => candidates.every(other => contains(rect(candidate), rect(other), 1)))
      if (shape) {
        const body = current.matches('.c4-person') ? current.querySelector(':scope > g.basic.label-container') : null
        const parts = body ? [...body.children].filter(child => ['rect', 'circle', 'ellipse'].includes(child.localName) && visible(child) && rect(child).width > 0 && rect(child).height > 0) : []
        if (parts.length > 1) { const boxes = parts.map(rect), x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y)); return { owner: current, shape, outlines: parts, box: { x, y, width: Math.max(...boxes.map(b => b.x + b.width)) - x, height: Math.max(...boxes.map(b => b.y + b.height)) - y } } }
        return { owner: current, shape, box: rect(shape) }
      }
      if (declaredGroup && group) return undefined
      // Some public SVG nodes place their label immediately below the body.
      // Require an authored SVG identity, a unique direct body outline, and
      // spatial agreement; an enclosing cluster is never their node body.
      if (identity && current.matches('g.node,g.pele-node,[data-role="node"],[data-role="actor"]') && ['data-id', 'data-node-id'].some(name => current.getAttribute(name) === identity)) {
        const bodies = [...current.children].filter(child => ['rect', 'circle', 'ellipse', 'polygon', 'path'].includes(child.localName) && visible(child) && !camouflage(child) && rect(child).width > 0 && rect(child).height > 0)
        if (bodies.length !== 1) return undefined
        const body = bodies[0]!, box = rect(body), label = labelBox(element), midpoint = center(label)
        const verticalGap = Math.max(box.y - label.y - label.height, label.y - box.y - box.height, 0)
        if (midpoint.x >= box.x - 2 && midpoint.x <= box.x + box.width + 2 && verticalGap <= Math.max(12, label.height)) return { owner: current, shape: body, box }
        return undefined
      }
      // Crossing a declared node boundary cannot recover its missing body
      // from a surrounding cluster or another node's artwork.
      if (current.matches('g.node,g.pele-node,g.participant,[data-role="node"],[data-role="actor"]')) return undefined
    }
    // Flat public SVGs need no renderer-specific classes or wrapper groups.
    // Bind only the smallest actual closed outline containing this label. A
    // canvas background or a body enclosing another authored node label cannot
    // supply ownership for a missing node.
    if (!group && identity) {
      const label = labelBox(element)
      if (input.family === 'sankey') {
        const adjacent = geometry.filter(shape => shape.localName === 'rect' && colorAlpha(getComputedStyle(shape).fill) !== 0 && !contains(rect(shape), rootBox, 2)).map(shape => { const b = rect(shape), gap = Math.max(b.x - label.x - label.width, label.x - b.x - b.width, 0), dy = Math.abs(center(b).y - center(label).y); return { shape, box: b, gap, dy } }).filter(item => item.box.width <= Math.max(30, label.height) && item.gap <= Math.max(12, label.height * .75) && item.dy <= Math.max(3, label.height * .35)).sort((a, b) => a.gap + a.dy - b.gap - b.dy)
        if (adjacent[0] && (!adjacent[1] || adjacent[1].gap + adjacent[1].dy - adjacent[0].gap - adjacent[0].dy > 2)) return { owner: adjacent[0].shape, shape: adjacent[0].shape, box: adjacent[0].box }
      }
      const bodyCandidates = geometry.filter(shape => {
        if (!['rect', 'circle', 'ellipse', 'polygon', 'path'].includes(shape.localName)) return false
        const style = getComputedStyle(shape)
        if (shape.localName === 'path' && style.fill === 'none' && !/z\s*$/i.test(shape.getAttribute('d') ?? '')) return false
        const b = rect(shape)
        if (b.width <= 0 || b.height <= 0 || !contains(b, label, 2)) return false
        if (contains(b, rootBox, 2)) return false
        const ownLabels = (input.expected.nodes ?? []).filter(node => visibleMatches(node.label).some(text => contains(b, labelBox(text), 2)))
        if (ownLabels.some(node => node.id !== identity)) return false
        const matrix = (shape as SVGGraphicsElement).getScreenCTM?.()
        if (!matrix || !(shape as SVGGeometryElement).isPointInFill?.(new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse()))) return false
        return true
      }).sort((a, b) => rect(a).width * rect(a).height - rect(b).width * rect(b).height)
      const smallest = bodyCandidates[0]
      if (smallest && bodyCandidates.every(candidate => candidate === smallest || contains(rect(candidate), rect(smallest), 1) && rect(candidate).width * rect(candidate).height > rect(smallest).width * rect(smallest).height + 1)) return { owner: smallest, shape: smallest, box: rect(smallest) }
    }
    return undefined
  }
  const anchors = new Map<string, { id: string; label: string; owner: Element; shape: Element; box: Box; outlines?: Element[] }>()
  const nodeLabelElements = new Set<Element>()
  const missingNodes: string[] = []
  for (const node of input.expected.nodes ?? []) {
    if (!node.label) { missingNodes.push(node.id); continue }
    let elements = visibleMatches(node.label)
    if (['sequence', 'zenuml'].includes(input.family)) elements = elements.sort((a, b) => rect(a).y - rect(b).y).slice(0, 1)
    const owners = new Map<Element, { owner: Element; shape: Element; box: Box }>()
    for (const element of elements) { const owned = ownedBox(element, node.id); if (owned) owners.set(owned.owner, owned) }
    if (owners.size === 1) { const owned = [...owners.values()][0]!; anchors.set(node.id, { ...node, ...owned }); elements.forEach(element => nodeLabelElements.add(element)) }
    else missingNodes.push(node.id)
  }
  // A common ancestor can contain several unrelated labels. It is not a
  // unique ownership witness for two distinct authored nodes.
  const owners = new Map<Element, string[]>()
  for (const node of anchors.values()) owners.set(node.shape, [...(owners.get(node.shape) ?? []), node.id])
  for (const ids of owners.values()) if (ids.length > 1) for (const id of ids) { anchors.delete(id); missingNodes.push(id) }
  const unexpectedNodes: string[] = []
  if (input.expected.nodes?.length && !['sequence', 'zenuml'].includes(input.family)) {
    const allowed = new Set(requiredLabels.map(normalize))
    const candidates = [...svg.querySelectorAll('g.node,g[class$="-node"],g[class*="-node "],[data-role="node"]')].filter(owner => visible(owner))
    for (const owner of candidates) {
      if ([...anchors.values()].some(node => owner.contains(node.shape))) continue
      const body = [...owner.querySelectorAll('rect,circle,ellipse,polygon,path')].some(shape => visible(shape) && rect(shape).width > 0 && rect(shape).height > 0)
      const labels = labelElements.filter(element => owner.contains(element) && visible(element)).map(element => normalize(labelText(element))).filter(Boolean)
      if (body && labels.some(label => !allowed.has(label))) unexpectedNodes.push(...labels)
    }
  }
  if (input.expected.nodes?.length && !['sequence', 'zenuml'].includes(input.family)) {
    const allowed = new Set(requiredLabels.map(normalize))
    for (const [index, element] of labelElements.entries()) {
      const label = normalize(labelText(element))
      if (!label || allowed.has(label) || !visible(element)) continue
      const owned = ownedBox(element, '__unrequested__:' + index)
      if (owned && ![...anchors.values()].some(node => node.shape === owned.shape || node.owner.contains(owned.shape))) unexpectedNodes.push(label)
    }
  }
  if (input.expected.nodes?.length) check('painted-node-ownership', input.expected.nodes.map(node => node.id), [...anchors.keys(), ...unexpectedNodes.map(label => 'unexpected:' + label)], unexpectedNodes.length ? false : missingNodes.length ? null : true, unexpectedNodes.length ? 'Additional visible node bodies carry undeclared labels: ' + unexpectedNodes.join(', ') : missingNodes.length ? 'Ambiguous or absent label-to-shape ownership: ' + missingNodes.join(', ') : 'Unique actual label-to-shape ownership, independently of native model identity; no additional declared node bodies carry unrelated labels')
  const rgba = (color: string): number[] | null => {
    if (!CSS.supports('color', color)) return null
    colorCanvas.clearRect(0, 0, 1, 1); colorCanvas.fillStyle = color; colorCanvas.fillRect(0, 0, 1, 1)
    return [...colorCanvas.getImageData(0, 0, 1, 1).data]
  }
  if (input.paint?.nodeFill !== undefined) {
    const expected = rgba(input.paint.nodeFill), actual = [...anchors.values()].map(node => { const style = getComputedStyle(node.shape); return { id: node.id, color: rgba(style.fill), opacity: Number(style.fillOpacity) } })
    check('computed-owned-node-fill', input.paint.nodeFill, actual, !expected || missingNodes.length || !actual.length ? null : actual.every(item => JSON.stringify(item.color) === JSON.stringify(expected) && (!expected[3] || item.opacity > 0)), 'Requested node fill is checked on each uniquely owned authored node outline; an invisible fill or unrelated matching decoration/text earns no credit')
  }
  const distanceToBox = (point: { x: number; y: number }, box: Box) => {
    const dx = Math.max(box.x - point.x, 0, point.x - box.x - box.width), dy = Math.max(box.y - point.y, 0, point.y - box.y - box.height)
    const inside = dx === 0 && dy === 0
    return inside ? Math.min(point.x - box.x, box.x + box.width - point.x, point.y - box.y, box.y + box.height - point.y) : Math.hypot(dx, dy)
  }
  const pointFor = (element: Element, end: boolean) => {
    const item = element as SVGGeometryElement
    if (typeof item.getTotalLength !== 'function' || typeof item.getPointAtLength !== 'function') return undefined
    const matrix = item.getScreenCTM(), length = item.getTotalLength()
    if (!matrix || !Number.isFinite(length) || length <= 0) return undefined
    const point = item.getPointAtLength(end ? length : 0).matrixTransform(matrix)
    return { x: point.x, y: point.y }
  }
  type Point = { x: number; y: number }
  const sampled = new Map<Element, Point[]>()
  const pointsOn = (element: Element): Point[] => {
    if (sampled.has(element)) return sampled.get(element)!
    const shape = element as SVGGeometryElement, matrix = shape.getScreenCTM?.(), length = shape.getTotalLength?.()
    if (!matrix || !Number.isFinite(length) || length <= 0) return []
    const count = Math.max(2, Math.min(3000, Math.ceil(length)))
    const points = Array.from({ length: count + 1 }, (_, i) => { const point = shape.getPointAtLength(length * i / count).matrixTransform(matrix); return { x: point.x, y: point.y } })
    // SVG fills implicitly close a single open subpath even when its stroke
    // does not. A filled node's actual outline includes that closing edge.
    if (element.localName === 'path' && getComputedStyle(element).fill !== 'none' && (element.getAttribute('d')?.match(/[Mm]/g)?.length ?? 0) === 1) { const first = points[0]!, last = points.at(-1)!, gap = Math.hypot(first.x - last.x, first.y - last.y), steps = Math.min(3000, Math.ceil(gap)); for (let i = 1; i <= steps; i++) points.push({ x: last.x + (first.x - last.x) * i / steps, y: last.y + (first.y - last.y) * i / steps }) }
    sampled.set(element, points); return points
  }
  const distanceToInk = (point: Point, element: Element) => Math.min(...pointsOn(element).map(item => Math.hypot(point.x - item.x, point.y - item.y)))
  const distanceToNode = (point: Point, node: { shape: Element; outlines?: Element[] }) => Math.min(...(node.outlines ?? [node.shape]).map(shape => distanceToInk(point, shape)))
  let ambiguousEndpoints = false, unresolvedProjection = false
  const bind = (point: Point, clearance = 2) => {
    const candidates = [...anchors.values()].map(node => {
      if (!['sequence', 'zenuml'].includes(input.family)) return { id: node.id, distance: distanceToNode(point, node) }
      const lifelines = geometry.filter(element => {
        const start = pointFor(element, false), end = pointFor(element, true)
        return start && end && Math.abs(start.x - end.x) <= 1 && Math.abs(start.x - center(node.box).x) <= 2 && Math.min(start.y, end.y) <= node.box.y + node.box.height + 2 && Math.max(start.y, end.y) >= point.y && Math.min(start.y, end.y) <= point.y
      })
      const candidates = geometry.filter(element => element.matches('rect.occurrence[data-participant]') && element.getAttribute('data-participant') === node.id)
      const activations = new Set(candidates.filter(element => {
        const box = rect(element)
        // The actual activation body must intersect its actor's lifeline;
        // the data attribute alone cannot assign an arbitrary distant shape.
        return lifelines.some(line => { const start = pointFor(line, false); return start && start.x >= box.x - 2 && start.x <= box.x + box.width + 2 })
      }))
      // Nested self calls stack overlapping activation bodies to the right.
      // Follow only actual body intersections back to a proven lifeline.
      let expanded = true
      while (expanded) {
        expanded = false
        for (const candidate of candidates) if (!activations.has(candidate)) {
          const box = rect(candidate)
          if ([...activations].some(body => { const other = rect(body); return box.x <= other.x + other.width + 2 && box.x + box.width >= other.x - 2 && box.y <= other.y + other.height + 2 && box.y + box.height >= other.y - 2 })) { activations.add(candidate); expanded = true }
        }
      }
      if (candidates.some(body => !activations.has(body) && distanceToInk(point, body) <= 2)) ambiguousEndpoints = true
      return { id: node.id, distance: Math.min(...[...lifelines, ...activations].map(element => distanceToInk(point, element))) }
    }).filter(item => item.distance <= Math.max(2, clearance)).sort((a, b) => a.distance - b.distance)
    if (candidates.length > 1 && candidates[1]!.distance - candidates[0]!.distance <= 2) { ambiguousEndpoints = true; return undefined }
    return candidates[0]?.id
  }
  const vertices = (element: Element): Point[] | undefined => {
    if (['polygon', 'polyline'].includes(element.localName)) return [...(element as SVGPolygonElement).points].map(point => ({ x: point.x, y: point.y }))
    if (element.localName !== 'path') return undefined
    const d = element.getAttribute('d') ?? ''
    if (!/^[ \t\r\n]*[Mm]/.test(d) || /[^ \t\r\n,]/.test(d.replace(/[MLHVZmlhvz]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi, '')) || /[A-Za-z][ \t\r\n]*,|,[ \t\r\n]*(?:[,A-Za-z]|$)/.test(d)) return undefined
    const tokens = d.match(/[MLHVZmlhvz]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) ?? [], points: Point[] = []
    let index = 0, command = '', current = { x: 0, y: 0 }, restarted = false
    while (index < tokens.length) {
      if (/^[A-Za-z]$/.test(tokens[index]!)) command = tokens[index++]!
      const kind = command.toUpperCase(), relative = command !== kind
      if (kind === 'Z') { if (restarted || index !== tokens.length) return undefined; command = ''; continue }
      if (!['M', 'L', 'H', 'V'].includes(kind)) return undefined
      const first = Number(tokens[index++]), second = kind === 'M' || kind === 'L' ? Number(tokens[index++]) : 0
      if (!Number.isFinite(first) || !Number.isFinite(second)) return undefined
      const next = kind === 'H' ? { x: first + (relative ? current.x : 0), y: current.y } : kind === 'V' ? { x: current.x, y: first + (relative ? current.y : 0) } : { x: first + (relative ? current.x : 0), y: second + (relative ? current.y : 0) }
      if (kind === 'M' && points.length) { if (next.x !== current.x || next.y !== current.y) return undefined; restarted = true }
      current = next
      // Separate open arrow legs can repeat their shared apex with another
      // moveto. That zero-length join must not become a fourth glyph vertex.
      const previous = points.at(-1)
      if (!previous || previous.x !== current.x || previous.y !== current.y) points.push(current)
      if (kind === 'M') command = relative ? 'l' : 'L'
    }
    return points
  }
  const concaveArrowTip = (points: Point[]) => {
    if (points.length !== 4) return undefined
    const turns = points.map((current, i) => { const previous = points[(i + 3) % 4]!, next = points[(i + 1) % 4]!; return Math.sign((current.x - previous.x) * (next.y - current.y) - (current.y - previous.y) * (next.x - current.x)) })
    const positive = turns.filter(turn => turn > 0).length, negative = turns.filter(turn => turn < 0).length
    if (!(positive === 1 && negative === 3 || negative === 1 && positive === 3)) return undefined
    return points[(turns.findIndex(turn => turn === (positive === 1 ? 1 : -1)) + 2) % 4]
  }
  const shapeKind = (element: Element): string => {
    if (element.localName === 'circle') return 'circle'
    const points = vertices(element)
    if (!points) return 'unknown'
    const style = getComputedStyle(element), closed = element.localName === 'polygon' || /z\s*$/i.test(element.getAttribute('d') ?? '')
    const filled = style.fill !== 'none' && Number(style.fillOpacity) > 0 && colorAlpha(style.fill) !== 0
    if (closed && concaveArrowTip(points)) return 'arrow'
    if (points.length === 3 && Math.abs((points[1]!.x - points[0]!.x) * (points[2]!.y - points[0]!.y) - (points[1]!.y - points[0]!.y) * (points[2]!.x - points[0]!.x)) > 1e-5) return !closed || filled && (style.stroke === 'none' || style.fill === style.stroke) ? 'arrow' : 'triangle'
    if (points.length === 4 && closed && new Set(points.map(point => point.x)).size === 3 && new Set(points.map(point => point.y)).size === 3) return filled && (style.stroke === 'none' || style.fill === style.stroke) ? 'diamond' : 'open-diamond'
    return points.length <= 2 ? 'decoration' : 'unknown'
  }
  const pointedVertex = (points: Point[]): Point | undefined => {
    if (points.length === 4) return concaveArrowTip(points)
    if (points.length !== 3) return undefined
    const axial = points.filter((_, i) => { const a = points[(i + 1) % 3]!, b = points[(i + 2) % 3]!; return Math.abs(a.x - b.x) < 1e-5 || Math.abs(a.y - b.y) < 1e-5 })
    if (axial.length === 1) return axial[0]
    const scored = points.map((point, index) => { const a = points[(index + 1) % 3]!, b = points[(index + 2) % 3]!, base = Math.hypot(a.x - b.x, a.y - b.y); return { point, score: Math.abs((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)) / (base * base) } }).sort((a, b) => b.score - a.score)
    return scored[0]!.score - scored[1]!.score > .03 ? scored[0]!.point : undefined
  }
  const tangentAt = (element: Element, side: 'start' | 'end') => {
    const item = element as SVGGeometryElement, matrix = item.getScreenCTM(), length = item.getTotalLength(), offset = Math.min(1, length / 2)
    if (!matrix || !offset) return undefined
    const a = item.getPointAtLength(side === 'start' ? 0 : length - offset), b = item.getPointAtLength(side === 'start' ? offset : length)
    const first = a.matrixTransform(matrix), last = b.matrixTransform(matrix), magnitude = Math.hypot(last.x - first.x, last.y - first.y), localMagnitude = Math.hypot(b.x - a.x, b.y - a.y)
    return magnitude && localMagnitude ? { x: (last.x - first.x) / magnitude, y: (last.y - first.y) / magnitude, scale: magnitude / localMagnitude } : undefined
  }
  const inlineShape = (element: Element): boolean => {
    if (element.matches('[class$="-marker"],.arrowhead,.return-arrow,[data-role="marker"]') || element.closest('svg.arrow-head')) return true
    const parent = element.parentElement, box = rect(element)
    if (parent?.localName === 'g' && Math.max(box.width, box.height) <= 16 && ['arrow', 'triangle'].includes(shapeKind(element)) && ![...anchors.values()].some(node => node.owner.contains(element))) {
      const siblings = [...parent.children].filter(shape => ['path', 'line', 'polyline', 'polygon'].includes(shape.localName) && visible(shape))
      if (siblings.length >= 2 && siblings.length <= 4 && siblings.some(shape => shape !== element && getComputedStyle(shape).fill === 'none')) return true
    }
    if (Math.max(box.width, box.height) <= 16 && ['arrow', 'triangle'].includes(shapeKind(element)) && ![...anchors.values()].some(node => node.owner.contains(element))) {
      const stems = geometry.filter(shape => shape !== element && ['path', 'line', 'polyline'].includes(shape.localName) && getComputedStyle(shape).fill === 'none' && ![...anchors.values()].some(node => node.owner.contains(shape)))
      const attached = stems.filter(stem => [pointFor(stem, false), pointFor(stem, true)].some(point => point && distanceToInk(point, element) <= 2))
      if (attached.length === 1) return true
    }
    const owner = element.closest('g.message,g.return'), viewport = element.closest('svg[viewBox]')
    if (!owner || !viewport || viewport === svg || !owner.contains(viewport)) return false
    const shapes = [...viewport.querySelectorAll('path,polygon,polyline,circle,line')].filter(shape => visible(shape))
    // A nested SVG can hold a whole self-call route, not just an arrowhead.
    if (shapes.length !== 1 || shapes[0] !== element) return false
    const style = getComputedStyle(element)
    if (style.markerStart !== 'none' || style.markerEnd !== 'none') return false
    const start = pointFor(element, false), end = pointFor(element, true)
    const from = start && bind(start), to = end && bind(end)
    if (from && to && from !== to) return false
    if (['arrow', 'triangle'].includes(shapeKind(element))) return true
    unresolvedProjection = true
    return false
  }
  type Marker = { kind: string; point?: Point; unknown?: string; orientation?: boolean; clearance?: number; filled?: boolean }
  const markerFor = (element: Element, side: 'start' | 'end', endpoint: Point): Marker => {
    const setting = getComputedStyle(element)[side === 'start' ? 'markerStart' : 'markerEnd']
    if (!setting || setting === 'none') return { kind: 'none', point: endpoint }
    const id = /#([^\s)"']+)/.exec(setting)?.[1], marker = id ? document.getElementById(decodeURIComponent(id)) : null
    if (!marker || marker.localName !== 'marker') return { kind: 'none', point: endpoint }
    const shapes = [...marker.querySelectorAll('path,polygon,polyline,circle,line')].filter(shape => visible(shape, true))
    if (!shapes.length) return { kind: 'none', point: endpoint }
    if (input.family === 'er') return { kind: 'decoration', point: endpoint, clearance: Math.min(8, Number(marker.getAttribute('markerWidth') ?? 3) / 2) }
    if (shapes.length !== 1 || shapes[0]!.hasAttribute('transform')) return { kind: 'unknown', point: endpoint, unknown: 'Compound or transformed marker needs a reviewed geometry projection' }
    const shape = shapes[0]!, rawKind = shapeKind(shape), glyphStyle = getComputedStyle(shape), open = input.family === 'sequence' && rawKind === 'arrow' && shape.localName !== 'polygon' && !/z\s*$/i.test(shape.getAttribute('d') ?? '') && colorAlpha(glyphStyle.fill) === 0 && colorAlpha(glyphStyle.stroke) !== 0, kind = open ? 'open-arrow' : rawKind, polygon = vertices(shape), owner = marker as unknown as SVGMarkerElement
    if (!polygon || kind === 'unknown' || !['auto', 'auto-start-reverse', null].includes(marker.getAttribute('orient'))) return { kind, point: endpoint, unknown: 'Marker tip/rotation projection is unavailable' }
    const reference = { x: owner.refX.baseVal.value, y: owner.refY.baseVal.value }
    const directional = ['arrow', 'triangle', 'open-arrow'].includes(kind)
    const tangent = tangentAt(element, side)
    if (!tangent) return { kind, point: endpoint, unknown: 'No stable endpoint tangent for marker placement' }
    const box = owner.viewBox.baseVal, viewScale = box.width && box.height ? Math.min(owner.markerWidth.baseVal.value / box.width, owner.markerHeight.baseVal.value / box.height) : 1
    const units = marker.getAttribute('markerUnits') === 'userSpaceOnUse' ? 1 : Number.parseFloat(getComputedStyle(element).strokeWidth)
    const reverse = side === 'start' && marker.getAttribute('orient') === 'auto-start-reverse' ? -1 : 1
    const projectVertex = (p: Point) => { const dx = (p.x - reference.x) * viewScale * units * tangent.scale * reverse, dy = (p.y - reference.y) * viewScale * units * tangent.scale * reverse; return { x: endpoint.x + tangent.x * dx - tangent.y * dy, y: endpoint.y + tangent.y * dx + tangent.x * dy } }
    const tip = directional ? pointedVertex(polygon) : [...polygon].sort((a, b) => Math.min(...[...anchors.values()].map(node => distanceToNode(projectVertex(a), node))) - Math.min(...[...anchors.values()].map(node => distanceToNode(projectVertex(b), node))))[0]
    if (!tip) return { kind, point: endpoint, unknown: 'No reviewed arrow tip for marker placement' }
    const dx = (tip.x - reference.x) * viewScale * units * tangent.scale * reverse, dy = (tip.y - reference.y) * viewScale * units * tangent.scale * reverse
    const others = polygon.filter(point => point !== tip), base = { x: others.reduce((sum, point) => sum + point.x, 0) / others.length, y: others.reduce((sum, point) => sum + point.y, 0) / others.length }
    const size = Math.max(...polygon.map(point => Math.hypot(point.x - tip.x, point.y - tip.y))) * viewScale * units * tangent.scale
    return { kind, filled: (shape.localName === 'polygon' || /z\s*$/i.test(shape.getAttribute('d') ?? '')) && getComputedStyle(shape).fill !== 'none' && Number(getComputedStyle(shape).fillOpacity) > 0 && colorAlpha(getComputedStyle(shape).fill) !== 0, point: { x: endpoint.x + tangent.x * dx - tangent.y * dy, y: endpoint.y + tangent.y * dx + tangent.x * dy }, clearance: Math.min(8, size / 2), ...(directional ? { orientation: (tip.x - base.x) * reverse * (side === 'start' ? -1 : 1) > 0 } : {}) }
  }
  const inlineMarker = (element: Element, side: 'start' | 'end', endpoint: Point, other: Point): Marker => {
    const parent = element.parentElement
    const owner = element.closest('g[class$="-edge"],g.edge,g[data-edge-id],g.message,g.return') ?? (parent?.localName === 'g' && parent.children.length <= 4 && ![...anchors.values()].some(node => node.owner.contains(element)) ? parent : null)
    const scope = owner ?? svg
    const shapes = [...scope.querySelectorAll('path,polygon,polyline,circle,line')].filter(shape => inlineShape(shape) && visible(shape) && shape !== element && (owner || distanceToInk(endpoint, shape) <= 2) && Math.hypot(center(rect(shape)).x - endpoint.x, center(rect(shape)).y - endpoint.y) < Math.hypot(center(rect(shape)).x - other.x, center(rect(shape)).y - other.y))
    if (!shapes.length) return { kind: 'none', point: endpoint }
    if (input.family === 'er') return { kind: 'decoration', point: endpoint, clearance: 4 }
    if (shapes.length !== 1) return { kind: 'unknown', point: endpoint, unknown: 'Compound inline decoration needs a reviewed projection' }
    const shape = shapes[0]!, rawKind = shapeKind(shape), glyphStyle = getComputedStyle(shape), open = input.family === 'sequence' && rawKind === 'arrow' && shape.localName !== 'polygon' && !/z\s*$/i.test(shape.getAttribute('d') ?? '') && colorAlpha(glyphStyle.fill) === 0 && colorAlpha(glyphStyle.stroke) !== 0, kind = open ? 'open-arrow' : rawKind, points = vertices(shape), matrix = (shape as SVGGraphicsElement).getScreenCTM()
    if (!points || !matrix || kind === 'unknown') return { kind, point: endpoint, unknown: 'Inline marker tip projection is unavailable' }
    const local = new DOMPoint(endpoint.x, endpoint.y).matrixTransform(matrix.inverse()), ink = shape as SVGGeometryElement, style = getComputedStyle(shape)
    const filled = style.fill !== 'none' && Number(style.fillOpacity) > 0 && colorAlpha(style.fill) !== 0
    const stroked = style.stroke !== 'none' && Number(style.strokeOpacity) > 0 && Number.parseFloat(style.strokeWidth) > 0 && colorAlpha(style.stroke) !== 0
    const touches = filled && ink.isPointInFill?.(local) || stroked && ink.isPointInStroke?.(local) || distanceToInk(endpoint, shape) <= 2
    if (!touches) return { kind: 'detached-marker', point: endpoint }
    const screen = points.map(point => new DOMPoint(point.x, point.y).matrixTransform(matrix))
    if (['arrow', 'triangle', 'open-arrow'].includes(kind)) {
      const tip = pointedVertex(screen), tangent = tangentAt(element, side)
      if (!tip || !tangent) return { kind, point: endpoint, unknown: 'Inline arrow has no uniquely projected tip/orientation' }
      const rest = screen.filter(point => point !== tip), base = { x: rest.reduce((sum, point) => sum + point.x, 0) / rest.length, y: rest.reduce((sum, point) => sum + point.y, 0) / rest.length }
      return { kind, filled: (shape.localName === 'polygon' || /z\s*$/i.test(shape.getAttribute('d') ?? '')) && filled, point: tip, clearance: Math.min(8, Math.max(...screen.map(point => Math.hypot(point.x - tip.x, point.y - tip.y))) / 2), orientation: ((tip.x - base.x) * tangent.x + (tip.y - base.y) * tangent.y) * (side === 'start' ? -1 : 1) > 0 }
    }
    const candidates = screen.map(point => ({ point, distance: Math.min(...[...anchors.values()].map(node => distanceToNode(point, node))) })).sort((a, b) => a.distance - b.distance)
    if (!candidates.length || candidates[0]!.distance > 2) return { kind, point: endpoint, unknown: 'No inline marker point is attached to an owned node boundary' }
    void side
    return { kind, point: candidates[0]!.point }
  }
  const connections: Array<{ source: string; target: string; directed: boolean; startMarker: string; endMarker: string; startFilled?: boolean; endFilled?: boolean; element: Element }> = []
  const connectionLabels = new Map<Element, string[]>()
  const edgeSelector = '.edge path,.edgePath path,.edge-path,.edge-paths path,g[class$="-edge"] path,g[class*="-edge "] path,path.flowchart-link,path.relation,path.relationshipLine,path.transition,path.em-relation,g.message line,g.message path,g.return line,g.return path,[data-relationship="sequence-message"],line.messageLine0,line.messageLine1,path.messageLine0,path.messageLine1,[data-edge-id],polyline.class-relationship,polyline.er-relationship'
  let paths = [...svg.querySelectorAll(edgeSelector)].filter(element => visible(element) && !camouflage(element) && ['path', 'line', 'polyline'].includes(element.localName))
  let unboundRelations = false, invalidMarker = false
  if (!paths.length) paths = geometry.filter(element => ['path', 'line', 'polyline'].includes(element.localName) && ![...anchors.values()].some(node => node.owner.contains(element)))
  paths = paths.filter(element => !inlineShape(element))
  for (const element of paths) {
    const start = pointFor(element, false), end = pointFor(element, true)
    if (!start || !end) continue
    let first = markerFor(element, 'start', start), last = markerFor(element, 'end', end)
    if (first.kind === 'none') first = inlineMarker(element, 'start', start, end)
    if (last.kind === 'none') last = inlineMarker(element, 'end', end, start)
    if (first.orientation === false || last.orientation === false || first.kind === 'detached-marker' || last.kind === 'detached-marker') invalidMarker = true
    if (first.orientation === false) first.kind = 'wrong-arrow-orientation'
    if (last.orientation === false) last.kind = 'wrong-arrow-orientation'
    if (first.unknown || last.unknown) unresolvedProjection = true
    const source = bind(first.point ?? start, first.clearance), target = bind(last.point ?? end, last.clearance)
    if (!source || !target) { unboundRelations = true; continue }
    connections.push({ source, target, directed: [first.kind, last.kind].some(kind => ['arrow', 'triangle', 'open-arrow'].includes(kind)), startMarker: first.kind, endMarker: last.kind, startFilled: first.filled, endFilled: last.filled, element })
  }
  unresolvedProjection ||= ambiguousEndpoints || unboundRelations
  if (input.paint?.edgeStroke !== undefined || input.paint?.edgeStrokeWidth !== undefined) {
    const expected = input.paint.edgeStroke === undefined ? undefined : rgba(input.paint.edgeStroke), width = input.paint.edgeStrokeWidth
    const actual = connections.map(edge => { const style = getComputedStyle(edge.element); return { source: edge.source, target: edge.target, color: rgba(style.stroke), width: Number.parseFloat(style.strokeWidth), opacity: Number(style.strokeOpacity) } })
    check('computed-owned-edge-style', { stroke: input.paint.edgeStroke, width }, actual, expected === null || !actual.length || missingNodes.length || unresolvedProjection ? null : actual.every(item => (expected === undefined || JSON.stringify(item.color) === JSON.stringify(expected) && (!expected[3] || item.opacity > 0 && item.width > 0)) && (width === undefined || Number.isFinite(item.width) && Math.abs(item.width - width) <= .1)), 'Computed stroke color/width on every actual owned relation path, with .1 CSS-pixel width tolerance; parser/config acceptance alone supplies no style credit')
  }
  const markerDirected = (kind: string) => ['arrow', 'triangle', 'open-arrow'].includes(kind)
  const pair = (source: string, target: string, directed: boolean, startMarker = 'none', endMarker = directed ? 'arrow' : 'none', decorations = false) => {
    const first = markerDirected(startMarker), last = markerDirected(endMarker)
    if (directed && first && !last) { [source, target] = [target, source]; [startMarker, endMarker] = [endMarker, startMarker] }
    else if ((!directed || first && last) && source > target) { [source, target] = [target, source]; [startMarker, endMarker] = [endMarker, startMarker] }
    return JSON.stringify([source, target, directed, ...(decorations ? [startMarker, endMarker] : [])])
  }
  const decorationExpected = input.expected.edges?.some(edge => edge.startMarker !== undefined || edge.endMarker !== undefined) ?? false
  const keyFor = (edge: { source: string; target: string; directed: boolean; startMarker?: string; endMarker?: string }, decorations = decorationExpected) => pair(edge.source, edge.target, edge.directed, edge.startMarker ?? 'none', edge.endMarker ?? (edge.directed ? 'arrow' : 'none'), decorations)
  if (input.expected.edges !== undefined) {
    const graphFamilies = ['flowchart', 'class', 'state', 'er', 'sequence', 'zenuml', 'block', 'requirement', 'architecture', 'c4', 'eventmodeling']
    if (invalidMarker) check('painted-relationships', input.expected.edges, connections.map(({ element: _, ...edge }) => edge), false, 'An owned arrowhead is detached from its stem or points against the route tangent')
    else if (missingNodes.length || unresolvedProjection || unboundRelations || !graphFamilies.includes(input.family)) check('painted-relationships', input.expected.edges, connections.map(({ element: _, ...edge }) => edge), null, 'This representation needs a reviewed endpoint/marker projection; unbound routes cannot establish missing relationships or earn semantic paint credit')
    else {
      const actual = connections.map(edge => keyFor(edge, false)).sort(), expected = input.expected.edges.map(edge => keyFor(edge, false)).sort()
      const equal = JSON.stringify(expected) === JSON.stringify(actual)
      check('painted-relationships', expected, actual, equal && unboundRelations ? null : equal, equal && unboundRelations ? 'An explicitly identified relation has unbound endpoints; exact multiplicity is unavailable' : 'Owned outline/lifeline endpoint proximity and exact multiplicity. Clearance is at most max(2 CSS pixels, half the observed painted marker length), capped at 8; this is not a strict physical-touch certificate')
    }
    if (decorationExpected) {
      const actual = connections.map(edge => keyFor(edge)).sort(), expected = input.expected.edges.map(edge => keyFor(edge)).sort()
      const equal = JSON.stringify(expected) === JSON.stringify(actual)
      const openAmbiguity = input.expected.edges.some(edge => edge.startMarker === 'open-arrow' || edge.endMarker === 'open-arrow') && connections.some(edge => edge.startMarker === 'triangle' || edge.endMarker === 'triangle')
      check('painted-relationship-markers', expected, actual, missingNodes.length || unresolvedProjection || openAmbiguity || equal && unboundRelations ? null : equal, 'Actual triangle/arrow/diamond/circle glyph geometry and marker ownership; sequence open-arrow profiles qualify an actual unfilled open V, while other outlined variants remain unverified. Unbound relations preclude exact multiplicity and a decoration is not automatically a directed arrow')
    }
    const labels = input.expected.edges.filter(edge => edge.label).map(edge => edge.label!)
    const counts = new Map<string, number>()
    for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1)
    if (labels.length) {
      const matched = new Map<string, Element[]>([...counts.keys()].map(label => [label, visibleMatches(label).filter(element => !nodeLabelElements.has(element))]))
      check('painted-relationship-label-counts', Object.fromEntries(counts), Object.fromEntries([...matched].map(([label, elements]) => [label, elements.length])), [...counts].every(([label, count]) => matched.get(label)!.length === count), 'Each authored relationship label needs its own visible text occurrence, excluding actual node titles')
      const actualLabels: string[] = [], expectedLabels = input.expected.edges.filter(edge => edge.label).map(edge => JSON.stringify([keyFor(edge), normalize(edge.label!)])).sort()
      let ambiguous = false
      const identifiers = (element: Element) => { const values = new Set<string>(); for (let current: Element | null = element; current && current !== svg; current = current.parentElement) for (const name of ['id', 'data-id', 'data-edge-id']) { const id = current.getAttribute(name); if (id) values.add(id) } return values }
      const distance = (element: Element, connection: typeof connections[number]) => { const box = rect(element); return Math.min(...pointsOn(connection.element).map(point => Math.hypot(Math.max(box.x - point.x, 0, point.x - box.x - box.width), Math.max(box.y - point.y, 0, point.y - box.y - box.height)))) }
      for (const [label, elements] of matched) for (const element of elements) {
        const ranked = connections.map(connection => ({ connection, distance: distance(element, connection) })).sort((a, b) => a.distance - b.distance)
        const ids = identifiers(element), owned = ranked.filter(item => [...identifiers(item.connection.element)].some(id => ids.has(id)))
        const threshold = Math.max(6, rect(element).height * .75)
        const candidate = owned.length === 1 && owned[0]!.distance <= threshold && owned[0]!.distance <= (ranked[0]?.distance ?? Infinity) + 2 ? owned[0] : ranked[0] && ranked[0].distance <= threshold && (!ranked[1] || ranked[1].distance - ranked[0].distance > 2) ? ranked[0] : undefined
        if (!candidate) { ambiguous = true; continue }
        connectionLabels.set(candidate.connection.element, [...(connectionLabels.get(candidate.connection.element) ?? []), normalize(label)])
        actualLabels.push(JSON.stringify([keyFor(candidate.connection), normalize(label)]))
      }
      actualLabels.sort()
      check('painted-relationship-label-ownership', expectedLabels, actualLabels, missingNodes.length || unresolvedProjection || ambiguous ? null : JSON.stringify(expectedLabels) === JSON.stringify(actualLabels), 'Visible label must belong to the corresponding actual route: unique geometry or matching public SVG edge identity plus spatial agreement; global text counts cannot bind labels')
    }
    if (input.family === 'er' && input.expected.facts?.cardinalities) check('painted-cardinality-decorations', input.expected.facts.cardinalities, connections.map(({ element: _, ...item }) => item), null, 'Owned endpoints are measured, but exact crow-foot/optional-circle combinations need a reviewed per-marker paint projection; native cardinalities alone earn no paint credit')
  }
  const groupBoxes: { id: string; label: string; box: Box }[] = []
  for (const group of input.expected.groups ?? []) {
    if (input.family === 'mindmap') { check('painted-group:' + group.id, group, null, null, 'Mindmap parent/child membership is a logical hierarchy, not an authored enclosing container; native membership is checked separately and connector ownership needs a reviewed paint projection'); continue }
    if (!group.label) { check('painted-group:' + group.id, group, null, null, 'Anonymous group needs a reviewed SVG identity projection'); continue }
    const owners = visibleMatches(group.label).map(element => ownedBox(element, undefined, true)).filter((item): item is NonNullable<typeof item> => !!item)
    if (owners.length !== 1) { check('painted-group:' + group.id, group, null, null, 'Group-to-owned-container projection is ambiguous or missing'); continue }
    groupBoxes.push({ id: group.id, label: group.label, box: owners[0]!.box })
    const descendantIds = (id: string, visiting: Set<string>): string[] => { if (visiting.has(id)) return []; const found = input.expected.groups?.find(candidate => candidate.id === id); return found ? found.members.flatMap(member => descendantIds(member, new Set([...visiting, id]))) : [id] }
    const members = descendantIds(group.id, new Set()), available = members.every(id => anchors.has(id))
    const outside = members.filter(id => anchors.has(id) && !contains(owners[0]!.box, anchors.get(id)!.box, 2))
    check('painted-group:' + group.id, members, outside, available ? outside.length === 0 : null, 'Authored descendant nodes fit their actual owned group boundary; immediate membership is checked independently in the native model')
  }
  check('paint-opacity-and-color', 'resolved visible paint colors/alpha', [...unknownPaint], unknownPaint.size ? null : true, 'Unresolved paint servers/context colors cannot silently earn a visible-ink or complete-style claim')
  const nodeStyle = (shape: Element) => { const style = getComputedStyle(shape); let opacity = 1; for (let parent: Element | null = shape; parent; parent = parent.parentElement) { opacity *= Number(getComputedStyle(parent).opacity); if (parent === svg) break }; return { fill: style.fill, fillOpacity: Number(style.fillOpacity), stroke: style.stroke, strokeOpacity: Number(style.strokeOpacity), strokeWidth: Number.parseFloat(style.strokeWidth), dash: style.strokeDasharray, opacity } }
  return { checks, complete: checks.every(item => item.status !== 'unavailable'), passed: checks.length > 0 && checks.every(item => item.status === 'passed'), nodes: [...anchors.values()].map(({ owner: _, shape, outlines: ___, ...node }) => { const style = getComputedStyle(shape), matrix = (shape as SVGGraphicsElement).getScreenCTM?.(); return { ...node, outline: { tag: shape.localName, vertices: matrix ? vertices(shape)?.map(p => { const point = new DOMPoint(p.x, p.y).matrixTransform(matrix); return { x: point.x, y: point.y } }) : null, rx: (style.rx === 'auto' ? (shape as SVGRectElement).rx?.baseVal.value ?? 0 : /%/.test(style.rx) ? NaN : Number.parseFloat(style.rx)) * (matrix ? Math.hypot(matrix.a, matrix.b) : 1), ry: (style.ry === 'auto' ? style.rx === 'auto' ? (shape as SVGRectElement).ry?.baseVal.value ?? 0 : /%/.test(style.rx) ? NaN : Number.parseFloat(style.rx) : /%/.test(style.ry) ? NaN : Number.parseFloat(style.ry)) * (matrix ? Math.hypot(matrix.c, matrix.d) : 1) }, style: nodeStyle(shape) } }), connections: connections.map(({ element, ...edge }) => ({ ...edge, box: rect(element), start: pointFor(element, false), end: pointFor(element, true), stroke: getComputedStyle(element).stroke, strokeWidth: Number.parseFloat(getComputedStyle(element).strokeWidth), dash: getComputedStyle(element).strokeDasharray, labels: connectionLabels.get(element) ?? [], style: nodeStyle(element) })), viewBox: svg.getAttribute('viewBox'), groups: groupBoxes, camouflagedText, camouflagedGeometry }
}
