import { FamilyCanvas, contains, expectedFact, familyChecks, familyTitle, same, setFamilyCheck } from './terminal-family-canvas.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
export function inspectTerminalHierarchy(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) { checks.forEach(c => c.detail = canvas.error!); return checks }
  const criterion = contract.family + '-hierarchy', expected: any[] = expectedFact(contract, criterion)
  if (contract.family === 'mindmap') {
    const rows = canvas.grid.map((line, y) => ({ text: line.join('').trimEnd(), y })).filter(row => row.text.trim()), actual: any[] = [], stack: { id: string; open: boolean; x: number }[] = []
    let step = 0, qualified = false
    for (const [index, row] of rows.entries()) {
      if (!index) {
        const root = /^●\s+(.+)$/.exec(row.text); if (!root) return checks
        const found = expected.filter(item => item.label === root[1]); if (found.length !== 1) { setFamilyCheck(checks, criterion, 'failed', 'The independently observed root label differs'); return checks }
        actual.push({ id: found[0].id, label: root[1], parent: null, order: 0, shape: 'circle' }); stack.push({ id: found[0].id, open: false, x: -1 }); canvas.claimRow(row.y); qualified = true; continue
      }
      const branch = /^([│ ]*)([├└])─+\s*(?:·\s*)?(.+)$/.exec(row.text); if (!branch) return checks
      const x = branch[1]!.length; if (x && !step) step = x
      const depth = x ? step && x % step === 0 ? x / step + 1 : -1 : 1
      if (depth < 1 || depth > stack.length) { setFamilyCheck(checks, criterion, 'failed', 'Tree branch skips an independently drawn parent level'); return checks }
      for (let d = 1; d < depth; d++) if ((branch[1]![stack[d]!.x] === '│') !== stack[d]!.open) { setFamilyCheck(checks, criterion, 'failed', 'Tree ancestor continuation is disconnected or crosses a closed branch'); return checks }
      while (stack.length > depth) { const closed = stack.pop()!; if (stack.length === depth ? !closed.open : closed.open) { setFamilyCheck(checks, criterion, 'failed', 'Tree elbow and tee disagree with the following sibling row'); return checks } }
      const found = expected.filter(item => item.label === branch[3]); if (found.length !== 1) { setFamilyCheck(checks, criterion, 'failed', 'The tree contains a changed or repeated label'); return checks }
      actual.push({ id: found[0].id, label: branch[3], parent: stack[depth - 1]!.id, order: index }); stack.push({ id: found[0].id, open: branch[2] === '├', x }); canvas.claimRow(row.y)
    }
    if (qualified) setFamilyCheck(checks, criterion, same(actual, expected) && !stack.some(node => node.open) ? 'passed' : 'failed', 'Tree elbows, continuing ancestor stems and row order independently establish parentage and the circle root', actual)
    return checks
  }
  const groups = canvas.boxes.filter(box => canvas.boxes.some(child => contains(box, child))), leaves = canvas.boxes.filter(box => !groups.includes(box)); if (!leaves.length) return checks
  const actual: any[] = [], bounds = new Map<string, { width: number; height: number }>(); let missing = false
  for (const box of canvas.boxes) {
    const children = canvas.boxes.filter(child => contains(box, child)), firstChild = children.length ? Math.min(...children.map(child => child.y)) : box.bottom
    const text = (children.length ? [box.header, ...box.lines.slice(0, firstChild - box.y - 1)] : box.lines).filter(Boolean)
    const weight = !children.length && /^\d+(?:\.\d+)?$/.test(text.at(-1) ?? '') ? Number(text.pop()) : undefined, label = text.join(' '), found = expected.filter(item => item.label === label)
    if (found.length !== 1) { missing = true; continue }
    const parent = groups.filter(group => contains(group, box)).sort((a, b) => (a.right - a.x) * (a.bottom - a.y) - (b.right - b.x) * (b.bottom - b.y))[0]
    const parentLabel = parent ? [parent.header, ...parent.lines.slice(0, Math.min(...canvas.boxes.filter(child => contains(parent, child)).map(child => child.y)) - parent.y - 1)].filter(Boolean).join(' ') : null
    const parentSource = parentLabel ? expected.find(item => item.label === parentLabel)?.id ?? 'unassigned' : null
    actual.push({ id: found[0].id, label, parent: parentSource, order: found[0].order, ...(weight === undefined ? {} : { weight }) }); bounds.set(found[0].id, { width: box.right - box.x + 1, height: box.bottom - box.y + 1 }); canvas.claimBox(box)
  }
  if (missing || actual.length !== expected.length || new Set(actual.map(item => item.id)).size !== expected.length) { setFamilyCheck(checks, criterion, 'failed', 'A treemap container omits or truncates an exact authored label', actual); return checks }
  actual.sort((a, b) => a.order - b.order)
  // Declaration order must agree with the independently drawn row-major sibling order.
  let areaOkay = true
  for (const parent of new Set(expected.map(item => item.parent))) {
    const siblings = expected.filter(item => item.parent === parent), weightOf = (item: any): number => item.weight ?? expected.filter(child => child.parent === item.id).reduce((sum, child) => sum + weightOf(child), 0), totalWeight = siblings.reduce((sum, item) => sum + weightOf(item), 0), totalArea = siblings.reduce((sum, item) => { const b = bounds.get(item.id)!; return sum + b.width * b.height }, 0)
    for (const item of siblings) { const b = bounds.get(item.id)!, error = b.width + b.height; if (Math.abs(b.width * b.height - totalArea * weightOf(item) / totalWeight) > error) areaOkay = false }
    const drawn = siblings.map(item => ({ item, box: canvas.boxes.find(box => box.lines.some(line => line === item.label))! })).filter(row => row.box).sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x).map(row => row.item.id)
    if (!same(drawn, siblings.map(item => item.id))) areaOkay = false
  }
  setFamilyCheck(checks, criterion, same(actual, expected) && areaOkay && !canvas.leftovers() ? 'passed' : 'failed', 'Exact label/weight rows own closed proportional regions and row-major sibling membership; cell-edge quantization bounds area', actual)
  return checks
}
export function inspectTerminalQuadrant(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) return checks
  familyTitle(canvas, checks)
  const box = canvas.boxes.find(b => canvas.grid.slice(b.y + 1, b.bottom).some(row => row.slice(b.x + 1, b.right).includes('┼'))); if (!box) { inspectUnframedQuadrant(canvas, checks, contract); return checks }
  const center: { x: number; y: number }[] = []; for (let y = box.y + 1; y < box.bottom; y++) for (let x = box.x + 1; x < box.right; x++) if (canvas.cell(x, y) === '┼') center.push({ x, y })
  if (center.length !== 1) return checks
  const mid = center[0]!, expected = expectedFact<any>(contract, 'quadrant-chart'), legends: { label: string; x: number; y: number }[] = [], dots: { x: number; y: number }[] = [], quadrants: { number: number; label: string }[] = [], axes: any[] = []
  canvas.claimBorder(box)
  for (let y = box.y + 1; y < box.bottom; y++) {
    for (let x = box.x + 1; x < box.right; x++) { const c = canvas.cell(x, y); if (c === '●') { dots.push({ x, y }); canvas.claim(x, y) } else if (c === '│' && x === mid.x || c === '─' && y === mid.y || c === '┼' && x === mid.x && y === mid.y) canvas.claim(x, y) }
    const left = canvas.grid[y]!.slice(box.x + 1, mid.x).join('').trim(), right = canvas.grid[y]!.slice(mid.x + 1, box.right).join('').trim()
    for (const [text, highX] of [[left, false], [right, true]] as const) if (text && text !== '●' && !/^[─● ]+$/.test(text)) {
      if (text.includes('●')) return checks
      quadrants.push({ number: y < mid.y ? highX ? 1 : 2 : highX ? 4 : 3, label: text }); for (let x = highX ? mid.x + 1 : box.x + 1; x < (highX ? box.right : mid.x); x++) canvas.claim(x, y)
    }
  }
  for (let y = box.bottom + 1; y < canvas.grid.length; y++) {
    const line = canvas.row(y).trim(), legend = /^●\s+(.+):\s*\[([\d.]+),\s*([\d.]+)\]$/.exec(line), yAxis = /^y-axis\s+bottom:\s*(.+?)\s*\|\s*top:\s*(.+)$/.exec(line)
    if (legend) { legends.push({ label: legend[1]!, x: Number(legend[2]), y: Number(legend[3]) }); canvas.claimRow(y) }
    else if (yAxis) { axes.push({ axis: 'y', low: yAxis[1], high: yAxis[2] }); canvas.claimRow(y) }
    else if (y === box.bottom + 1) { const ends = line.split(/ {2,}/); if (ends.length === 2) { axes.push({ axis: 'x', low: ends[0], high: ends[1] }); canvas.claimRow(y) } }
  }
  if (!legends.length || axes.length !== 2) return checks
  const owners = legends.map(point => dots.map((dot, index) => ({ index, distance: Math.max(Math.abs(dot.x - (box.x + 1 + point.x * (box.right - box.x - 2))), Math.abs(dot.y - (box.bottom - 1 - point.y * (box.bottom - box.y - 2)))) })).filter(row => row.distance <= .75)), placement = owners.every(row => row.length === 1) && new Set(owners.map(row => row[0]?.index)).size === dots.length && dots.length === legends.length
  axes.sort((a, b) => a.axis.localeCompare(b.axis)); quadrants.sort((a, b) => a.number - b.number)
  const actual = { axes, quadrants, points: legends }
  setFamilyCheck(checks, 'quadrant-chart', placement && same(actual, expected) && !canvas.leftovers() ? 'passed' : 'failed', 'Axis endpoint rows, quadrant regions and coordinate legend uniquely own quantized plot dots; a legend alone supplies no geometry credit', actual)
  return checks
}
/** Visible full cross-axis extents define the unit square independently of
 * expected points. Every label belongs to a point, quadrant, title or explicit
 * axis legend; omitted y labels cannot be supplied by the source title. */
function inspectUnframedQuadrant(canvas: FamilyCanvas, checks: ReturnType<typeof familyChecks>, contract: TerminalSourceContract) {
  const crosses = canvas.grid.flatMap((row, y) => row.flatMap((glyph, x) => glyph === '┼' ? [{ x, y }] : [])); if (crosses.length !== 1) return
  const mid = crosses[0]!, horizontal = canvas.grid[mid.y]!, left = horizontal.findIndex(c => c === '─'), right = horizontal.lastIndexOf('─')
  if (left < 0 || right <= mid.x || mid.x <= left || horizontal.some((c, x) => c.trim() && (x < left || x > right || !/[─┼]/.test(c))) || horizontal.slice(left, right + 1).some(c => !/[─┼]/.test(c))) return
  const vertical = canvas.grid.flatMap((row, y) => row[mid.x] === '│' ? [y] : []), top = Math.min(...vertical), bottom = Math.max(...vertical)
  if (!Number.isFinite(top) || !(top < mid.y && mid.y < bottom) || bottom - top < 4 || Array.from({ length: bottom - top + 1 }, (_, n) => top + n).some(y => !/[│┼]/.test(canvas.cell(mid.x, y)))) return
  const quadrants: { number: number; label: string }[] = [], points: { label: string; x: number; y: number }[] = [], axes: { axis: string; low: string; high: string }[] = []
  canvas.claimRow(mid.y)
  for (let y = top; y <= bottom; y++) {
    if (y === mid.y) continue
    canvas.claim(mid.x, y)
    for (const high of [false, true]) {
      const start = high ? mid.x + 1 : 0, end = high ? canvas.grid[y]!.length : mid.x, text = canvas.grid[y]!.slice(start, end).join('').trim()
      if (!text) continue
      const point = /^●\s+(.+)$/.exec(text)
      if (point) { const x = canvas.grid[y]!.findIndex((c, at) => at >= start && at < end && c === '●'); points.push({ label: point[1]!, x, y }) }
      else quadrants.push({ number: y < mid.y ? high ? 1 : 2 : high ? 4 : 3, label: text })
      for (let x = start; x < end; x++) canvas.claim(x, y)
    }
  }
  if (quadrants.length !== 4 || new Set(points.map(p => p.label)).size !== points.length || new Set(quadrants.map(q => q.number)).size !== quadrants.length) return
  const before = canvas.grid.map((row, y) => ({ text: row.join('').trim(), y })).filter(row => row.y < top && row.text)
  if (before.length > 1) return
  if (before[0]) canvas.claimRow(before[0].y)
  for (let y = bottom + 1; y < canvas.grid.length; y++) {
    const text = canvas.row(y).trim(); if (!text) continue
    const yAxis = /^y-axis\s+bottom:\s*(.+?)\s*\|\s*top:\s*(.+)$/.exec(text), xAxis = /^(.+?)\s+->\s+(.+)$/.exec(text)
    if (yAxis) axes.push({ axis: 'y', low: yAxis[1]!, high: yAxis[2]! })
    else if (xAxis) axes.push({ axis: 'x', low: xAxis[1]!, high: xAxis[2]! })
    else return
    canvas.claimRow(y)
  }
  if (canvas.leftovers() || new Set(axes.map(a => a.axis)).size !== axes.length) return
  const title = checks.find(c => c.criterion === 'title'); if (title) setFamilyCheck(checks, 'title', before[0]?.text === title.expected ? 'passed' : 'failed', 'A complete cross-axis row grammar owns its optional title', before[0]?.text ?? null)
  const expected = expectedFact<any>(contract, 'quadrant-chart'), wantedPoints = expected.points as { label: string; x: number; y: number }[]
  axes.sort((a, b) => a.axis.localeCompare(b.axis)); quadrants.sort((a, b) => a.number - b.number)
  const labels = points.length === wantedPoints.length && points.every(point => wantedPoints.filter(wanted => wanted.label === point.label).length === 1), placement = labels && points.every(point => { const wanted = wantedPoints.find(wanted => wanted.label === point.label)!; return Math.abs(point.x - (left + wanted.x * (right - left))) <= 1.01 && Math.abs(point.y - (bottom - wanted.y * (bottom - top))) <= 1.01 })
  setFamilyCheck(checks, 'quadrant-chart', same(axes, expected.axes) && same(quadrants, expected.quadrants) && placement ? 'passed' : 'failed', 'Full visible cross extents own the unit-square coordinates to one display cell; exact quadrant and axis captions remain required, including y-axis labels', { axes, quadrants, points, bounds: { left, right, top, bottom } })
}
