/** A bounded terminal observer: single-cell labels in rectangular boxes joined
 * by orthogonal directed routes. Unsupported display/layout features are
 * unknown. Text presence alone never establishes a relationship. */
export interface TerminalMeaning {
  nodes: readonly { id: string; label: string }[]
  edges: readonly { source: string; target: string; label?: string }[]
  layout?: readonly { before: string; after: string; axis: 'x' | 'y' }[]
}
type Box = { x: number; y: number; right: number; bottom: number; label: string; id?: string }
const scope = 'Rectangular flowcharts, single-cell ASCII labels, orthogonal directed routes with a unique drawn source and uniquely owned horizontal edge labels. ANSI terminal state, wide/combining text, groups and ambiguous junctions are unqualified.'

export function inspectTerminalMeaning(output: string, expected: TerminalMeaning) {
  const verdict = (status: 'correct' | 'incorrect' | 'unknown', reason: string, edges: { source: string; target: string; label?: string }[] = []) => ({ status, reason, scope, edges })
  if (!expected.nodes.length || new Set(expected.nodes.map(node => node.id)).size !== expected.nodes.length || new Set(expected.nodes.map(node => node.label)).size !== expected.nodes.length || expected.nodes.some(node => !node.label || /[^\x20-\x7e]/.test(node.label)) || expected.edges.some(edge => !expected.nodes.some(node => node.id === edge.source) || !expected.nodes.some(node => node.id === edge.target))) return verdict('unknown', 'Expected identities/labels are ambiguous or outside the declared display scope')
  const text = output.replaceAll('\r\n', '\n')
  if (text.length > 200_000 || /[^\x20-\x7e\n┌┐└┘╭╮╰╯┬┴┼├┤─│►◄▼▲▶◀→←↓↑]/u.test(text)) return verdict('unknown', 'Output needs terminal-state or display-cell interpretation outside this profile')
  const grid = text.split('\n').map(line => [...line]), cell = (x: number, y: number) => grid[y]?.[x] ?? ' '
  if (grid.length > 256 || grid.some(line => line.length > 512) || [...text].filter(character => character === '┌' || character === '╭' || character === '+').length > 64 || expected.nodes.length > 32) return verdict('unknown', 'Output exceeds the bounded grid profile')
  const boxes: Box[] = []
  const horizontal = (line: string) => /^[─┬┴┼+\-]+$/.test(line)
  const vertical = (character: string) => ['│', '|', '├', '┤', '┼', '+'].includes(character)
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const left = cell(x, y)
    if (!['┌', '╭', '+'].includes(left)) continue
    const corners = left === '+' ? ['+', '+', '+'] : left === '╭' ? ['╮', '╰', '╯'] : ['┐', '└', '┘']
    for (let right = x + 2; right < grid[y]!.length; right++) {
      if (cell(right, y) !== corners[0] || !horizontal(grid[y]!.slice(x + 1, right).join(''))) continue
      for (let bottom = y + 2; bottom < grid.length; bottom++) {
        if (cell(x, bottom) !== corners[1] || cell(right, bottom) !== corners[2] || !horizontal((grid[bottom] ?? []).slice(x + 1, right).join('')) || !Array.from({ length: bottom - y - 1 }, (_, index) => y + index + 1).every(row => vertical(cell(x, row)) && vertical(cell(right, row)))) continue
        const label = grid.slice(y + 1, bottom).map(row => row.slice(x + 1, right).join('').trim()).filter(Boolean).join(' ')
        boxes.push({ x, y, right, bottom, label })
        break
      }
    }
  }
  for (const node of expected.nodes) {
    const matches = boxes.filter(box => box.label === node.label)
    if (matches.length !== 1) return verdict('incorrect', 'Expected exactly one drawn node labelled ' + node.label + '; found ' + matches.length)
    matches[0]!.id = node.id
  }
  if (boxes.length !== expected.nodes.length) return verdict('unknown', 'Additional or nested containers need a reviewed ownership projection')
  const inside = (x: number, y: number) => boxes.find(box => x >= box.x && x <= box.right && y >= box.y && y <= box.bottom)
  const boundary = (x: number, y: number) => boxes.find(box => (x === box.x || x === box.right) && y > box.y && y < box.bottom || (y === box.y || y === box.bottom) && x > box.x && x < box.right)
  const points: Record<string, number[]> = { '─': [1, 3], '-': [1, 3], '│': [0, 2], '|': [0, 2], '┌': [1, 2], '┐': [2, 3], '└': [0, 1], '┘': [0, 3], '╭': [1, 2], '╮': [2, 3], '╰': [0, 1], '╯': [0, 3], '┬': [1, 2, 3], '┴': [0, 1, 3], '├': [0, 1, 2], '┤': [0, 2, 3], '┼': [0, 1, 2, 3], '+': [0, 1, 2, 3] }
  const arrows: Record<string, number> = { '▲': 0, '^': 0, '↑': 0, '►': 1, '▶': 1, '>': 1, '→': 1, '▼': 2, 'v': 2, '↓': 2, '◄': 3, '◀': 3, '<': 3, '←': 3 }
  const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0], key = (x: number, y: number) => x + ',' + y
  const captions = new Map<string, { label: string; token: string }>()
  const floating: { label: string; x: number; y: number; width: number }[] = [], floatingCells = new Set<string>()
  for (const label of new Set(expected.edges.map(edge => edge.label).filter((value): value is string => !!value))) {
    if (/[^\x20-\x7e]/.test(label)) return verdict('unknown', 'Edge label is outside the display-cell scope')
    for (let y = 0; y < grid.length; y++) {
      const line = grid[y]!.join('')
      for (let x = line.indexOf(label); x >= 0; x = line.indexOf(label, x + 1)) {
        if (Array.from({ length: label.length }, (_, offset) => inside(x + offset, y)).some(Boolean)) continue
        if (!(points[cell(x - 1, y)]?.includes(1)) || !(points[cell(x + label.length, y)]?.includes(3) || arrows[cell(x + label.length, y)] === 1)) {
          floating.push({ label, x, y, width: label.length })
          for (let offset = 0; offset < label.length; offset++) floatingCells.add(key(x + offset, y))
          continue
        }
        for (let offset = 0; offset < label.length; offset++) {
          const coordinate = key(x + offset, y)
          if (captions.has(coordinate)) return verdict('unknown', 'Overlapping edge-label spans are ambiguous')
          captions.set(coordinate, { label, token: key(x, y) })
        }
      }
    }
  }
  const actual: { source: string; target: string; label?: string }[] = [], used = new Set<string>()
  const paths: { x: number; y: number }[][] = []
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const heading = arrows[cell(x, y)]
    if (heading === undefined || inside(x, y) || captions.has(key(x, y)) || floatingCells.has(key(x, y))) continue
    const target = boundary(x + dx[heading]!, y + dy[heading]!)
    if (!target?.id) return verdict('incorrect', 'Arrowhead does not meet a drawn target node', actual)
    used.add(key(x, y))
    // Do not use expected edges to choose a branch. A shared outgoing stem is
    // qualified only when exactly one path reaches a drawn source node.
    const pending = [{ x: x - dx[heading]!, y: y - dy[heading]!, towardPrevious: heading, path: new Set<string>(), labels: new Map<string, string>() }]
    const sources: { source: Box; path: Set<string>; labels: Map<string, string> }[] = []
    let steps = 0, cycle = false
    while (pending.length) {
      if (++steps > 4096) return verdict('unknown', 'Route exploration exceeds the bounded graph profile', actual)
      const cursor = pending.pop()!, source = boundary(cursor.x, cursor.y)
      if (source) { sources.push({ source, path: cursor.path, labels: cursor.labels }); continue }
      const coordinate = key(cursor.x, cursor.y)
      if (cursor.path.has(coordinate)) { cycle = true; continue }
      if (arrows[cell(cursor.x, cursor.y)] !== undefined) continue
      const caption = captions.get(coordinate), exits = caption ? [1, 3] : points[cell(cursor.x, cursor.y)]
      if (!exits?.includes(cursor.towardPrevious)) continue
      const path = new Set(cursor.path); path.add(coordinate)
      const labels = new Map(cursor.labels)
      if (caption) labels.set(caption.token, caption.label)
      for (const direction of exits.filter(direction => direction !== cursor.towardPrevious)) pending.push({ x: cursor.x + dx[direction]!, y: cursor.y + dy[direction]!, towardPrevious: (direction + 2) % 4, path, labels })
    }
    if (cycle || sources.length > 1) return verdict('unknown', 'Junction, crossing or cycle has ambiguous source ownership', actual)
    const found = sources[0]
    if (!found) return verdict('incorrect', 'Arrow stem is disconnected from its source node', actual)
    if (!found.source.id || found.labels.size > 1) return verdict('unknown', 'Source or relationship label ownership is ambiguous', actual)
    for (const coordinate of found.path) used.add(coordinate)
    actual.push({ source: found.source.id, target: target.id, ...(found.labels.size ? { label: [...found.labels.values()][0]! } : {}) })
    paths.push([{ x, y }, ...[...found.path].map(coordinate => { const [x, y] = coordinate.split(',').map(Number); return { x: x!, y: y! } })])
  }
  for (const caption of floating) {
    const midpoint = caption.x + (caption.width - 1) / 2
    const candidates = paths.map((path, index) => ({ index, near: path.some(point => Math.abs(point.y - caption.y) === 1 && Math.abs(point.x - midpoint) <= .5) })).filter(item => item.near)
    if (candidates.length !== 1 || actual[candidates[0]!.index]!.label) return verdict('unknown', 'Floating relationship label has no unique adjacent route owner', actual)
    actual[candidates[0]!.index]!.label = caption.label
    for (let offset = 0; offset < caption.width; offset++) used.add(key(caption.x + offset, caption.y))
  }
  const canonical = (edges: readonly { source: string; target: string; label?: string }[]) => edges.map(edge => JSON.stringify([edge.source, edge.target, edge.label ?? ''])).sort()
  if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected.edges))) return verdict('incorrect', 'Drawn directed relationships or their labels differ from the authored graph', actual)
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) if (cell(x, y) !== ' ' && !inside(x, y) && !used.has(key(x, y))) return verdict('unknown', 'Unassigned output ink or text remains outside the verified nodes and routes', actual)
  for (const constraint of expected.layout ?? []) {
    const before = boxes.find(box => box.id === constraint.before), after = boxes.find(box => box.id === constraint.after)
    if (!before || !after || !['x', 'y'].includes(constraint.axis)) return verdict('unknown', 'Authored layout relation has no unique node ownership', actual)
    const coordinate = (box: Box) => constraint.axis === 'x' ? (box.x + box.right) / 2 : (box.y + box.bottom) / 2
    if (!(coordinate(before) < coordinate(after))) return verdict('incorrect', 'Drawn node order violates an independently declared layout relation', actual)
  }
  return verdict('correct', 'Every declared node and directed route is present with its owned label', actual)
}
