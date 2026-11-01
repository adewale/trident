import { FamilyCanvas, coordinate, type FamilyBox } from './terminal-family-canvas.ts'
export interface FamilyNode { box: FamilyBox; id: string; label: string }
export interface FamilyRoute { source: string; target: string; caption: string; sourcePort: string; targetPort: string }
const points: Record<string, number[]> = { '─': [1, 3], '-': [1, 3], '│': [0, 2], '|': [0, 2], '┌': [1, 2], '┐': [2, 3], '└': [0, 1], '┘': [0, 3], '╭': [1, 2], '╮': [2, 3], '╰': [0, 1], '╯': [0, 3], '┬': [1, 2, 3], '┴': [0, 1, 3], '├': [0, 1, 2], '┤': [0, 2, 3], '┼': [0, 1, 2, 3], '+': [0, 1, 2, 3] }
const arrows: Record<string, number> = { '▲': 0, '^': 0, '↑': 0, '►': 1, '▶': 1, '>': 1, '→': 1, '▼': 2, 'v': 2, '↓': 2, '◄': 3, '◀': 3, '<': 3, '←': 3 }
const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0]
/** The drawing supplies endpoints and caption owners before comparison. Expected
 * relationships are deliberately absent from this decoder. */
export function familyRoutes(canvas: FamilyCanvas, nodes: FamilyNode[]) {
  const routes: FamilyRoute[] = [], paths: Set<string>[] = [], captions: { x: number; y: number; right: number; text: string; used: boolean }[] = []
  const boundary = (x: number, y: number) => nodes.find(({ box: b }) => (x === b.x || x === b.right) && y > b.y && y < b.bottom || (y === b.y || y === b.bottom) && x > b.x && x < b.right)
  const interior = (x: number, y: number) => nodes.some(({ box: b }) => x > b.x && x < b.right && y > b.y && y < b.bottom)
  const port = (box: FamilyBox, x: number, y: number) => x === box.x ? 'L' : x === box.right ? 'R' : y === box.y ? 'T' : 'B'
  for (let y = 0; y < canvas.grid.length; y++) {
    let start = -1
    const finish = (right: number) => { if (start < 0) return; const text = canvas.grid[y]!.slice(start, right).join('').trimEnd(); if (text.trim()) captions.push({ x: start, y, right: start + text.length - 1, text, used: false }); start = -1 }
    for (let x = 0; x <= (canvas.grid[y]?.length ?? 0); x++) {
      const glyph = canvas.cell(x, y), owned = canvas.owned.has(coordinate(x, y)), route = points[glyph] || arrows[glyph] !== undefined
      if (owned || route || x === canvas.grid[y]!.length) finish(x)
      else if (glyph.trim() && start < 0) start = x
      else if (!glyph.trim() && start >= 0 && canvas.cell(x + 1, y) === ' ') finish(x)
    }
  }
  const inline = new Map<string, { exits: number[]; caption: number }>()
  for (let i = 0; i < captions.length; i++) {
    const c = captions[i]!, horizontal = points[canvas.cell(c.x - 1, c.y)]?.includes(1) && (points[canvas.cell(c.right + 1, c.y)]?.includes(3) || arrows[canvas.cell(c.right + 1, c.y)] === 1)
    if (horizontal) for (let x = c.x; x <= c.right; x++) inline.set(coordinate(x, c.y), { exits: [1, 3], caption: i })
    else {
      const through = Array.from({ length: c.right - c.x + 1 }, (_, i) => c.x + i).filter(x => points[canvas.cell(x, c.y - 1)]?.includes(2) && (points[canvas.cell(x, c.y + 1)]?.includes(0) || arrows[canvas.cell(x, c.y + 1)] === 2))
      if (through.length === 1) inline.set(coordinate(through[0]!, c.y), { exits: [0, 2], caption: i })
    }
  }
  for (let y = 0; y < canvas.grid.length; y++) for (let x = 0; x < canvas.grid[y]!.length; x++) {
    const heading = arrows[canvas.cell(x, y)]; if (heading === undefined || interior(x, y) || canvas.owned.has(coordinate(x, y)) && !boundary(x, y)) continue
    const at = boundary(x, y), inward = at && (x === at.box.x && heading === 1 || x === at.box.right && heading === 3 || y === at.box.y && heading === 2 || y === at.box.bottom && heading === 0)
    const tx = inward ? x : x + dx[heading]!, ty = inward ? y : y + dy[heading]!, target = inward ? at : boundary(tx, ty)
    if (!target) return { status: 'failed' as const, reason: 'A drawn arrow has no container endpoint', routes }
    const pending = [{ x: x - dx[heading]!, y: y - dy[heading]!, toward: heading, path: new Set<string>(), captions: new Set<number>() }], found: { node: FamilyNode; x: number; y: number; path: Set<string>; captions: Set<number> }[] = []; let count = 0
    while (pending.length) {
      if (++count > 8192) return { status: 'unknown' as const, reason: 'Route exceeds bounded exploration', routes }
      const p = pending.pop()!, node = boundary(p.x, p.y), key = coordinate(p.x, p.y)
      if (node) { found.push({ node, ...p }); continue }
      if (p.path.has(key) || interior(p.x, p.y)) continue
      const token = inline.get(key), exits = token?.exits ?? points[canvas.cell(p.x, p.y)]
      if (!exits?.includes(p.toward)) continue
      const path = new Set(p.path); path.add(key); const labels = new Set(p.captions); if (token) labels.add(token.caption)
      for (const direction of exits.filter(d => d !== p.toward)) pending.push({ x: p.x + dx[direction]!, y: p.y + dy[direction]!, toward: (direction + 2) % 4, path, captions: labels })
    }
    if (found.length > 1) return { status: 'unknown' as const, reason: 'Route junction has multiple drawn source owners', routes }
    if (!found.length) return { status: 'failed' as const, reason: 'Arrow stem is disconnected from its drawn source', routes }
    const f = found[0]!, path = f.path; path.add(coordinate(x, y)); paths.push(path)
    routes.push({ source: f.node.id, target: target.id, caption: '', sourcePort: port(f.node.box, f.x, f.y), targetPort: port(target.box, tx, ty) })
    for (const i of f.captions) captions[i]!.used = true
    for (const key of path) canvas.owned.add(key)
  }
  // Adjacent caption lines belong to a single route; multiline text keeps row order.
  const assigned = routes.map(() => [] as typeof captions)
  for (let i = 0; i < captions.length; i++) {
    const c = captions[i]!, owners = paths.map((path, index) => ({ index, near: [...path].some(key => { const [x, y] = key.split(',').map(Number); return Math.abs(y! - c.y) <= 1 && x! >= c.x - 2 && x! <= c.right + 2 }) })).filter(o => o.near)
    if (owners.length !== 1) return { status: 'unknown' as const, reason: 'Visible route caption has no unique adjacent route owner: ' + c.text, routes }
    assigned[owners[0]!.index]!.push(c)
    for (let x = c.x; x <= c.right; x++) canvas.claim(x, c.y)
  }
  for (let i = 0; i < routes.length; i++) routes[i]!.caption = assigned[i]!.sort((a, b) => a.y - b.y || a.x - b.x).map(c => c.text).join(' ')
  return { status: 'passed' as const, reason: 'Continuous directed stems supply independently drawn endpoints, wall ports and uniquely owned captions', routes }
}
