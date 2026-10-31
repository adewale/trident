import type { MeaningExpectation } from './meaning.ts'
import type { PaintCheck, PaintEvidence } from './paint.ts'

/** Browser-serializable source fact checks. Geometry and visible labels establish
 * ownership; renderer IDs/classes and source/model metadata supply no facts. */
export function inspectChartFacts(input: { family: string; source: string; expected: MeaningExpectation; paint: PaintEvidence; quantitative: PaintCheck[] }): PaintCheck[] {
  const svg = document.querySelector('svg'), facts: any = input.expected.facts ?? {}, checks: PaintCheck[] = []
  if (!svg || input.paint.labelRepresentation === 'uninspectable' || !['xychart', 'quadrant', 'radar'].includes(input.family)) return checks
  let uncertain = false
  const add = (key: string, actual: unknown, passed: boolean | null, scope: string) => { if (Object.hasOwn(facts, key)) checks.push({ criterion: 'source-fact:' + key, expected: facts[key], actual, status: passed === null || passed && uncertain ? 'unavailable' : passed ? 'passed' : 'failed', scope }) }
  const quantitative = (criterion: string, expected: unknown, actual: unknown, passed: boolean | null, scope: string) => checks.push({ criterion, expected, actual, status: passed === null || passed && uncertain ? 'unavailable' : passed ? 'passed' : 'failed', scope })
  const norm = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
  const canvas = document.createElement('canvas').getContext('2d')!
  const color = (value: string) => { if (value === 'none' || value === 'transparent') return null; if (/url\(|var\(|context-/.test(value)) { uncertain = true; return null }; canvas.clearRect(0, 0, 1, 1); canvas.fillStyle = value; canvas.fillRect(0, 0, 1, 1); const rgba = canvas.getImageData(0, 0, 1, 1).data; return rgba[3] ? { rgb: [...rgba].slice(0, 3).join(','), alpha: rgba[3]! / 255 } : null }
  const visible = (element: Element) => {
    let effectiveOpacity = 1
    for (let owner: Element | null = element; owner; owner = owner.parentElement) {
      const style = getComputedStyle(owner)
      if (['defs', 'marker', 'clipPath', 'mask', 'title', 'desc'].includes(owner.localName) || style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility) || Number(style.opacity) === 0) return false
      if (style.clipPath && style.clipPath !== 'none' || style.maskImage && style.maskImage !== 'none' || style.filter && style.filter !== 'none') uncertain = true
      effectiveOpacity *= Number(style.opacity)
      if (owner === svg) break
    }
    const bounds = element.getBoundingClientRect()
    const canvasBounds = svg.getBoundingClientRect(), structuralBackground = element.localName === 'rect' && bounds.width >= canvasBounds.width * .9 && bounds.height >= canvasBounds.height * .9
    for (const cover of structuralBackground ? [] : svg.querySelectorAll('rect')) {
      if (cover === element || !(element.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING) || cover.closest('defs,marker,clipPath,mask')) continue
      const b = cover.getBoundingClientRect(), style = getComputedStyle(cover), fill = color(style.fill)
      if (!fill || !b.width || !b.height || b.x >= bounds.right || b.right <= bounds.x || b.y >= bounds.bottom || b.bottom <= bounds.y) continue
      let opacity = fill.alpha * Number(style.fillOpacity), projected = true
      for (let owner: Element | null = cover; owner; owner = owner.parentElement) {
        const s = getComputedStyle(owner)
        if (s.display === 'none' || ['hidden', 'collapse'].includes(s.visibility)) opacity = 0
        opacity *= Number(s.opacity)
        if (s.clipPath && s.clipPath !== 'none' || s.maskImage && s.maskImage !== 'none' || s.filter && s.filter !== 'none') projected = false
        if (owner === svg) break
      }
      if (!opacity) continue
      if (element.localName === 'circle') {
        const cx = bounds.x + bounds.width / 2, cy = bounds.y + bounds.height / 2, r = bounds.width / 2, near = Math.hypot(cx - Math.max(b.x, Math.min(b.right, cx)), cy - Math.max(b.y, Math.min(b.bottom, cy))), far = Math.max(...[[b.x, b.y], [b.right, b.y], [b.x, b.bottom], [b.right, b.bottom]].map(([x, y]) => Math.hypot(x! - cx, y! - cy))), elementStyle = getComputedStyle(element), filled = color(elementStyle.fill), stroke = Number.parseFloat(elementStyle.strokeWidth)
        if (near > r + stroke || !filled && far < r - stroke) continue
      }
      const matrix = cover.getScreenCTM()
      const rectangular = matrix && Math.abs(matrix.b) < 1e-8 && Math.abs(matrix.c) < 1e-8 && !Number(cover.getAttribute('rx')) && !Number(cover.getAttribute('ry'))
      if (opacity >= 1 && projected && rectangular && b.x <= bounds.x && b.y <= bounds.y && b.right >= bounds.right && b.bottom >= bounds.bottom) return false
      uncertain = true
    }
    const style = getComputedStyle(element), fill = color(style.fill), stroke = color(style.stroke)
    const paints = [fill && fill.alpha * Number(style.fillOpacity) * effectiveOpacity > 0 ? { ...fill, effectiveAlpha: fill.alpha * Number(style.fillOpacity) * effectiveOpacity } : null, stroke && stroke.alpha * Number(style.strokeOpacity) * effectiveOpacity > 0 && Number.parseFloat(style.strokeWidth) > 0 ? { ...stroke, effectiveAlpha: stroke.alpha * Number(style.strokeOpacity) * effectiveOpacity } : null].filter((paint): paint is { rgb: string; alpha: number; effectiveAlpha: number } => !!paint)
    if (!paints.length) return false
    if (paints.every(paint => paint.effectiveAlpha < 1 / 255)) { uncertain = true; return false }
    if (!fill && stroke && Number.parseFloat(style.strokeWidth) < .25) { uncertain = true; return false }
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
      if (opaque) { uncertain = true; return false }
    }
    return true
  }
  const box = (element: Element) => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
  type Box = ReturnType<typeof box>
  const center = (b: Box) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 })
  const text = [...svg.querySelectorAll('text,tspan')].filter(element => visible(element) && box(element).width > 0 && box(element).height > 0 && ![...element.children].some(child => norm(child.textContent ?? '') === norm(element.textContent ?? '')))
  const label = (value: string) => { const found = text.filter(element => norm(element.textContent ?? '') === norm(value)); return found.length === 1 ? found[0] : undefined }
  const point = (element: SVGGraphicsElement, x: number, y: number) => { const matrix = element.getScreenCTM(); return matrix ? new DOMPoint(x, y).matrixTransform(matrix) : new DOMPoint(NaN, NaN) }
  const anchor = (element: Element) => { const item = element as SVGTextElement; return point(item, item.x.baseVal.numberOfItems ? item.x.baseVal.getItem(0).value : 0, item.y.baseVal.numberOfItems ? item.y.baseVal.getItem(0).value : 0) }
  const rectangles = [...svg.querySelectorAll('rect')].filter(element => visible(element) && box(element).width > 0 && box(element).height > 0)
  const paths = [...svg.querySelectorAll('path,polyline,polygon,line')].filter(element => visible(element)) as SVGGeometryElement[]
  const sample = (element: SVGGeometryElement, count = 2048) => { const length = element.getTotalLength(), matrix = element.getScreenCTM(); return matrix ? Array.from({ length: count + 1 }, (_, i) => element.getPointAtLength(length * i / count).matrixTransform(matrix)) : [] }
  const endPoints = (element: SVGGeometryElement) => { const length = element.getTotalLength(), matrix = element.getScreenCTM(); return matrix ? [element.getPointAtLength(0).matrixTransform(matrix), element.getPointAtLength(length).matrixTransform(matrix)] : [] }
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
  if (input.family === 'xychart') {
    const categories: string[] = facts['x-categories'] ?? [], range: number[] = facts['y-range'] ?? [], series: { kind: string; label?: string; values: number[] }[] = facts.series ?? []
    const horizontal = facts.orientation === 'horizontal', categoryAxis = horizontal ? 'y' : 'x', valueAxis = horizontal ? 'x' : 'y'
    const categoryLabels = categories.map(label), categoryTicks = categoryLabels.map(element => element ? tickCoordinate(element, categoryAxis) : undefined), minimum = range.length === 2 ? numericLabel(range[0]!) : undefined, maximum = range.length === 2 ? numericLabel(range[1]!) : undefined
    const ticks = text.map(element => ({ element, value: numeric(element.textContent ?? ''), coordinate: tickCoordinate(element, valueAxis), perpendicular: anchor(element)[categoryAxis] })).filter(item => Number.isFinite(item.value) && item.coordinate !== undefined && !categoryLabels.includes(item.element))
    const clusters = ticks.map(seed => ticks.filter(tick => Math.abs(tick.perpendicular - seed.perpendicular) < 1)).filter(group => group.length > 1 && new Set(group.map(tick => tick.value)).size === group.length)
    const distinct = [...new Map(clusters.map(group => [group.map(tick => tick.value).sort((a, b) => a - b).join(','), group])).values()].sort((a, b) => b.length - a.length)
    const calibrated = distinct[0] && (!distinct[1] || distinct[0].length > distinct[1].length) ? [...distinct[0]].sort((a, b) => a.value - b.value) : null
    const first = calibrated?.[0], last = calibrated?.at(-1), slope = first && last ? (last.coordinate! - first.coordinate!) / (last.value - first.value) : NaN
    const calibrationOkay = first && Number.isFinite(slope) && slope !== 0 && calibrated!.every(tick => Math.abs(tick.coordinate! - (first.coordinate! + (tick.value - first.value) * slope)) < 1)
    const ready = calibrationOkay && categories.length > 1 && new Set(categories).size === categories.length && categoryLabels.every(Boolean) && categoryTicks.every(coordinate => coordinate !== undefined) && range.length === 2 && range[1]! > range[0]! && series.length > 0 && series.every(item => ['bar', 'line'].includes(item.kind) && item.values.length === categories.length && item.values.every(value => Number.isFinite(value) && value >= range[0]! && value <= range[1]!))
    if (!ready) {
      for (const key of ['x-categories', 'y-range', 'orientation', 'series', 'x-axis-label', 'y-axis-label', 'series-annotations']) add(key, null, null, 'XY profile needs unique category labels, at least two independently bound numeric ticks and finite in-range series; numeric categories, implicit scales and clipping need additional evidence')
      if (facts.series) quantitative('painted-series-values', facts.series, null, null, 'Complete XY geometry profile is unavailable')
      return checks
    }
    const positions = categoryTicks as number[], low = first!.coordinate! + (range[0]! - first!.value) * slope, high = first!.coordinate! + (range[1]! - first!.value) * slope
    const step = Math.min(...positions.slice(1).map((value, i) => Math.abs(value - positions[i]!))), tolerance = 3, baselineTolerance = Math.max(3, Number.parseFloat(getComputedStyle(first!.element).fontSize) * .65)
    const increasing = positions.every((value, i) => !i || value > positions[i - 1]!), decreasing = positions.every((value, i) => !i || value < positions[i - 1]!)
    const positioned = Number.isFinite(low) && Number.isFinite(high) && Math.abs(high - low) > 1 && step > 1 && (increasing || decreasing)
    const scale = (value: number) => low + (value - range[0]!) / (range[1]! - range[0]!) * (high - low)
    const categoryCenter = (b: Box) => horizontal ? b.y + b.height / 2 : b.x + b.width / 2
    const valueMin = (b: Box) => horizontal ? b.x : b.y, valueMax = (b: Box) => horizontal ? b.x + b.width : b.y + b.height
    const bars = rectangles.filter(rect => { const b = box(rect), breadth = horizontal ? b.height : b.width; return breadth < step * 1.3 && positions.some(value => Math.abs(categoryCenter(b) - value) <= step * .35) && valueMin(b) >= Math.min(low, high) - baselineTolerance && valueMax(b) <= Math.max(low, high) + baselineTolerance })
    const lines = paths.filter(path => {
      if (color(getComputedStyle(path).fill)) return false
      const ends = endPoints(path); if (ends.length !== 2) return false
      const [a] = ends as [DOMPoint, DOMPoint], bounds = box(path), start = horizontal ? bounds.y : bounds.x, breadth = horizontal ? bounds.height : bounds.width, span = horizontal ? bounds.width : bounds.height
      if (breadth < step * .2 || start > Math.max(...positions) + tolerance || start + breadth < Math.min(...positions) - tolerance) return false
      return span > .2 || Math.abs(a[valueAxis] - low) > baselineTolerance && Math.abs(a[valueAxis] - high) > baselineTolerance
    })
    const expectedBars = series.filter(item => item.kind === 'bar'), expectedLines = series.filter(item => item.kind === 'line'), colorOf = (element: Element) => color(getComputedStyle(element).fill)?.rgb ?? color(getComputedStyle(element).stroke)?.rgb
    const observed: unknown[] = []; let available = !!positioned, passed = true
    const selected = new Set<Element>()
    for (const item of series) {
      const peers = item.kind === 'bar' ? expectedBars : expectedLines, key = item.label ? swatch(item.label) : peers.length > 1 ? null : undefined
      if ((item.label || peers.length > 1) && !key) { available = false; continue }
      if (item.label && !label(item.label)) { passed = false; continue }
      const candidates = (item.kind === 'bar' ? bars : lines).filter(element => key === undefined || colorOf(element) === key)
      if (item.kind === 'bar') {
        const nonzero = item.values.filter(value => Math.abs(value - Math.max(range[0]!, Math.min(range[1]!, 0))) > 1e-9).length
        if (candidates.length !== nonzero) passed = false
        item.values.forEach((value, index) => {
          const nearby = candidates.filter(bar => Math.abs(categoryCenter(box(bar)) - positions[index]!) <= step * .35), b = nearby.length === 1 ? box(nearby[0]!) : null
          const baseline = scale(Math.max(range[0]!, Math.min(range[1]!, 0))), expectedTip = scale(value)
          const okay = value === Math.max(range[0]!, Math.min(range[1]!, 0)) && !b || !!b && Math.abs((expectedTip < baseline ? valueMin(b) : valueMax(b)) - expectedTip) <= tolerance && Math.abs((expectedTip < baseline ? valueMax(b) : valueMin(b)) - baseline) <= baselineTolerance
          if (nearby[0]) { if (selected.has(nearby[0])) available = false; selected.add(nearby[0]) }
          if (!okay) passed = false
          observed.push({ kind: item.kind, label: item.label ?? null, category: categories[index], sourceValue: value, box: b, expectedTip })
        })
      } else {
        if (candidates.length !== 1) { available = false; continue }
        const path = candidates[0]!; if (selected.has(path)) available = false; selected.add(path)
        const samples = sample(path, Math.min(8192, Math.max(2048, categories.length * 256)))
        item.values.forEach((value, index) => {
          const near = samples.filter(p => Math.abs(p[categoryAxis] - positions[index]!) <= .75).sort((a, b) => Math.abs(a[categoryAxis] - positions[index]!) - Math.abs(b[categoryAxis] - positions[index]!))
          const actual = near[0], wanted = scale(value)
          if (!actual || Math.abs(actual[valueAxis] - wanted) > tolerance) passed = false
          observed.push({ kind: item.kind, label: item.label ?? null, category: categories[index], sourceValue: value, actual: actual ? { x: actual.x, y: actual.y } : null, expectedTip: wanted })
        })
      }
    }
    if (bars.length !== series.filter(item => item.kind === 'bar').reduce((sum, item) => sum + item.values.filter(value => value !== Math.max(range[0]!, Math.min(range[1]!, 0))).length, 0) || lines.length !== expectedLines.length) available = false
    const scope = 'Exact category/series inventory with label-to-legend color ownership for repeated series kinds, visible numeric tick calibration, value positions within 3 CSS pixels and bounded baseline overhang. No series order or DOM class supplies ownership.'
    add('series', observed, available ? passed : null, scope); quantitative('painted-series-values', facts.series, observed, available ? passed : null, scope)
    add('x-categories', positions, positioned ? increasing : null, 'Unique authored category labels occur in source order on the actual category axis; horizontal category charts progress top-to-bottom, vertical charts left-to-right')
    add('y-range', { low, high, minimum: minimum?.textContent, maximum: maximum?.textContent }, positioned && calibrated!.some(tick => tick.element === minimum) && calibrated!.some(tick => tick.element === maximum) ? horizontal ? high > low : high < low : null, 'The explicit numeric range binds visible min/max tick labels and their actual axis orientation')
    add('orientation', { categoryAxis, valueAxis, positions, low, high }, positioned ? horizontal ? high > low && increasing : high < low && increasing : null, 'Requested orientation follows independently calibrated category and numeric axes')
    for (const [key, axis] of [['x-axis-label', categoryAxis], ['y-axis-label', valueAxis]] as const) if (Object.hasOwn(facts, key)) {
      const element = label(String(facts[key])), b = element ? center(box(element)) : null
      const outside = b && (axis === 'x' ? b.y > Math.max(...categoryLabels.map(item => box(item!).y)) : b.x < Math.min(...categoryLabels.map(item => box(item!).x)))
      add(key, b, element ? !!outside : false, 'Axis caption is separately painted beyond the corresponding tick-label region; a matching data label cannot borrow the axis role')
    }
    if (facts['series-annotations']) add('series-annotations', null, null, 'Full per-point annotation ownership needs a separate unambiguous label-to-series profile')
  }
  if (input.family === 'quadrant') {
    const boxes = rectangles.map(box), regions = boxes.filter(b => boxes.filter(other => Math.abs(other.width - b.width) < 2 && Math.abs(other.height - b.height) < 2).length === 4)
    const available = regions.length === 4 && new Set(regions.map(b => Math.round(b.x))).size === 2 && new Set(regions.map(b => Math.round(b.y))).size === 2
    const plot = available ? { x: Math.min(...regions.map(b => b.x)), y: Math.min(...regions.map(b => b.y)), right: Math.max(...regions.map(b => b.x + b.width)), bottom: Math.max(...regions.map(b => b.y + b.height)) } : null
    const dots = [...svg.querySelectorAll('circle')].filter(element => visible(element) && plot && center(box(element)).x >= plot.x && center(box(element)).x <= plot.right && center(box(element)).y >= plot.y && center(box(element)).y <= plot.bottom)
    const used = new Set<Element>(), observed = (facts.points ?? []).map((p: any) => {
      const element = label(p.label), c = element ? center(box(element)) : null
      const nearest = c ? dots.map(dot => ({ dot, distance: Math.hypot(center(box(dot)).x - c.x, center(box(dot)).y - c.y) })).sort((a, b) => a.distance - b.distance) : []
      const dot = nearest[0] && (!nearest[1] || nearest[1].distance - nearest[0].distance > 2) && nearest[0].distance < Math.max(30, element ? box(element).width + box(element).height : 0) ? nearest[0].dot : undefined
      if (dot && used.has(dot)) return { label: p.label, actual: null, expected: p }
      if (dot) used.add(dot)
      const actual = dot && plot ? { x: (center(box(dot)).x - plot.x) / (plot.right - plot.x), y: 1 - (center(box(dot)).y - plot.y) / (plot.bottom - plot.y) } : null
      return { label: p.label, actual, expected: p }
    })
    const ready = !!plot && observed.every((p: any) => p.actual), passed = ready && dots.length === observed.length && observed.every((p: any) => Math.abs(p.actual.x - p.expected.x) < .015 && Math.abs(p.actual.y - p.expected.y) < .015)
    add('points', observed, ready ? passed : null, 'Every authored point uniquely owns an actual visible dot; exact point inventory and coordinates normalize to the four painted regions within 1.5%')
    if (facts.points) quantitative('painted-quadrant-coordinates', facts.points, observed, ready ? passed : null, 'Complete owned point inventory and normalized quadrant coordinates')
    for (const [criterion, axes] of [['axes', facts.axes], ['axis-labels', Array.isArray(facts['axis-labels']) && facts['axis-labels'].length === 4 ? { x: facts['axis-labels'].slice(0, 2), y: facts['axis-labels'].slice(2) } : null]] as const) if (axes) {
      const positions = { x: (axes.x ?? []).map((name: string) => { const e = label(name); return e ? center(box(e)) : null }), y: (axes.y ?? []).map((name: string) => { const e = label(name); return e ? center(box(e)) : null }) }
      const owned = plot && positions.x.length === 2 && positions.y.length === 2 && [...positions.x, ...positions.y].every(Boolean)
      const okay = owned && positions.x[0]!.x < (plot.x + plot.right) / 2 && positions.x[1]!.x > (plot.x + plot.right) / 2 && positions.x.every((p: any) => p.y > plot.bottom) && positions.y[0]!.y > (plot.y + plot.bottom) / 2 && positions.y[1]!.y < (plot.y + plot.bottom) / 2 && positions.y.every((p: any) => p.x < plot.x)
      add(criterion, positions, owned ? !!okay : null, 'Each declared axis fact independently binds source left/right and bottom/top endpoint labels outside the correct plot side. A second alias cannot override contradictory authored labels')
    }
    if (Array.isArray(facts.quadrants)) {
      const captions = facts.quadrants.map((q: any) => { const e = label(q.label); return { number: q.number, label: q.label, center: e ? center(box(e)) : null } })
      const okay = plot && captions.every((q: any) => q.center && [1, 2, 3, 4].includes(q.number) && q.center.x > plot.x && q.center.x < plot.right && q.center.y > plot.y && q.center.y < plot.bottom && ([1, 4].includes(q.number) ? q.center.x > (plot.x + plot.right) / 2 : q.center.x < (plot.x + plot.right) / 2) && ([1, 2].includes(q.number) ? q.center.y < (plot.y + plot.bottom) / 2 : q.center.y > (plot.y + plot.bottom) / 2))
      add('quadrants', captions, plot ? !!okay : null, 'Each explicitly authored quadrant caption belongs to its numbered painted region; no captions declares no absence claim about renderer defaults')
    }
  }
  if (input.family === 'radar') {
    const axes: { id: string; label: string }[] = facts.axes ?? [], curves: { id: string; label?: string; values: number[] }[] = facts.curves ?? [], range: number[] = facts.range ?? []
    const circles = [...svg.querySelectorAll('circle')].filter(element => visible(element) && box(element).width > 20 && Math.abs(box(element).width - box(element).height) < 1)
    const outer = [...circles].sort((a, b) => box(b).width - box(a).width)[0], origin = outer ? center(box(outer)) : null, radius = outer ? box(outer).width / 2 : 0
    const rings = origin ? circles.filter(element => Math.hypot(center(box(element)).x - origin.x, center(box(element)).y - origin.y) < 1) : []
    const spokes = origin ? paths.filter(path => {
      const ends = endPoints(path); if (ends.length !== 2) return false
      return ends.some(p => Math.hypot(p.x - origin.x, p.y - origin.y) < 1) && ends.some(p => Math.abs(Math.hypot(p.x - origin.x, p.y - origin.y) - radius) < 2) && Math.abs(path.getTotalLength() - radius) < 2
    }) : []
    const endpoint = (path: SVGGeometryElement) => endPoints(path).sort((a, b) => Math.hypot(b.x - origin!.x, b.y - origin!.y) - Math.hypot(a.x - origin!.x, a.y - origin!.y))[0]!
    const axisOwners = axes.map(axis => {
      const e = label(axis.label), c = e ? center(box(e)) : null
      const nearest = c && origin ? spokes.map(spoke => { const p = endpoint(spoke), lx = c.x - origin.x, ly = c.y - origin.y; return { spoke, p, distance: Math.abs((p.x - origin.x) * ly - (p.y - origin.y) * lx) / Math.max(1, Math.hypot(lx, ly)), sameRay: (p.x - origin.x) * lx + (p.y - origin.y) * ly > 0 } }).filter(item => item.sameRay).sort((a, b) => a.distance - b.distance) : []
      return { ...axis, labelCenter: c, spoke: nearest[0] && nearest[0].distance < 20 && (!nearest[1] || nearest[1].distance - nearest[0].distance > 2) ? nearest[0].spoke : null }
    })
    const prepared = !!origin && radius > 10 && rings.length >= 2 && axes.length >= 3 && spokes.length === axes.length && axisOwners.every(axis => axis.spoke && Math.hypot(axis.labelCenter!.x - origin!.x, axis.labelCenter!.y - origin!.y) > radius) && new Set(axisOwners.map(axis => axis.spoke)).size === axes.length
    const angle = (p: { x: number; y: number }) => (Math.atan2(p.y - origin!.y, p.x - origin!.x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)
    const angles = prepared ? axisOwners.map(axis => angle(endpoint(axis.spoke!))) : []
    const ordered = angles.every((value, i) => !i || value > angles[i - 1]! + .01)
    add('axes', axisOwners.map(axis => ({ id: axis.id, label: axis.label, center: axis.labelCenter, endpoint: axis.spoke ? endpoint(axis.spoke) : null })), prepared ? ordered : null, 'Each authored axis label owns a distinct actual radial spoke outside the outer ring, in clockwise source order from the top; no SVG class or axis ID supplies ownership')
    const closed = origin ? paths.filter(path => {
      if (!/[zZ]\s*$/.test(path.getAttribute('d') ?? '') && path.localName !== 'polygon') return false
      const bounds = box(path); return bounds.width > 1 && bounds.height > 1 && bounds.x >= origin.x - radius - 2 && bounds.y >= origin.y - radius - 2 && bounds.x + bounds.width <= origin.x + radius + 2 && bounds.y + bounds.height <= origin.y + radius + 2
    }) : []
    let available = prepared && range.length === 2 && range[1]! > range[0]! && curves.length > 0 && curves.every(curve => curve.values.length === axes.length && curve.values.every(value => Number.isFinite(value) && value >= range[0]! && value <= range[1]!)), passed = closed.length === curves.length
    const owned = new Set<Element>(), observations: unknown[] = []
    for (const curve of curves) {
      const ink = curve.label ? swatch(curve.label) : curves.length > 1 ? null : undefined
      if ((curve.label || curves.length > 1) && !ink) { available = false; continue }
      if (curve.label && !label(curve.label)) passed = false
      const candidates = closed.filter(path => ink === undefined || color(getComputedStyle(path).fill)?.rgb === ink || color(getComputedStyle(path).stroke)?.rgb === ink)
      if (candidates.length !== 1) { available = false; continue }
      const path = candidates[0]!; if (owned.has(path)) available = false; owned.add(path)
      if (!available) continue
      const points = sample(path, 4096)
      axes.forEach((axis, index) => {
        const end = endpoint(axisOwners[index]!.spoke!), ux = (end.x - origin!.x) / radius, uy = (end.y - origin!.y) / radius, intersections: number[] = []
        for (let j = 1; j < points.length; j++) {
          const a = points[j - 1]!, b = points[j]!, ax = a.x - origin!.x, ay = a.y - origin!.y, dx = b.x - a.x, dy = b.y - a.y, denominator = dx * uy - dy * ux
          if (Math.abs(denominator) < 1e-8) continue
          const t = -(ax * uy - ay * ux) / denominator, projected = (ax + t * dx) * ux + (ay + t * dy) * uy
          if (t >= 0 && t <= 1 && projected >= -.1 && projected <= radius + 2 && !intersections.some(value => Math.abs(value - projected) < .5)) intersections.push(projected)
        }
        const wanted = (curve.values[index]! - range[0]!) / (range[1]! - range[0]!) * radius
        if (intersections.length !== 1) available = false
        else if (Math.abs(intersections[0]! - wanted) > 3) passed = false
        observations.push({ curve: curve.id, label: curve.label ?? null, axis: axis.id, sourceValue: curve.values[index], radialCoordinate: intersections, expectedCoordinate: wanted })
      })
    }
    const scope = 'Exact curve and axis inventory; every curve is sampled against its owned radial spokes and the authored scale within 3 CSS pixels. Every named curve requires visible legend-to-color ownership; multiple curves need distinct ownership. Unlabelled radial rings do not independently prove a numeric range.'
    add('curves', observations, available ? passed && ordered : null, scope)
    if (facts.curves) quantitative('painted-radar-values', facts.curves, observations, available ? passed && ordered : null, scope)
    add('range', null, null, 'Radial position checks use the authored scale, but unlabelled rings cannot independently attest numeric min/max values; a qualified numeric tick profile is required')
    for (const key of ['graticule', 'ticks']) add(key, null, null, 'Authored graticule/tick configuration requires an independently mapped visible grid and tick-label profile')
  }
  return checks
}
