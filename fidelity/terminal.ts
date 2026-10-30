/** A bounded terminal observer: single-cell labels in rectangular boxes joined
 * by orthogonal directed routes. Unsupported display/layout features are
 * unknown. Text presence alone never establishes a relationship. */
export interface TerminalMeaning {
  nodes: readonly { id: string; label: string }[]
  edges: readonly { source: string; target: string; label?: string }[]
}
type Box = { x: number; y: number; right: number; bottom: number; label: string; id?: string }
const scope = 'Rectangular flowcharts, single-cell ASCII labels, orthogonal non-crossing directed routes and inline horizontal edge labels. ANSI terminal state, wide/combining text, groups and ambiguous junctions are unqualified.'

export function inspectTerminalMeaning(output: string, expected: TerminalMeaning) {
  const verdict = (status: 'correct' | 'incorrect' | 'unknown', reason: string, edges: { source: string; target: string; label?: string }[] = []) => ({ status, reason, scope, edges })
  if (!expected.nodes.length || new Set(expected.nodes.map(node => node.id)).size !== expected.nodes.length || new Set(expected.nodes.map(node => node.label)).size !== expected.nodes.length || expected.nodes.some(node => !node.label || /[^\x20-\x7e]/.test(node.label)) || expected.edges.some(edge => !expected.nodes.some(node => node.id === edge.source) || !expected.nodes.some(node => node.id === edge.target))) return verdict('unknown', 'Expected identities/labels are ambiguous or outside the declared display scope')
  const text = output.replaceAll('\r\n', '\n')
  if (text.length > 200_000 || /[^\x20-\x7e\n┌┐└┘┬┴┼├┤─│►◄▼▲▶◀→←↓↑]/u.test(text)) return verdict('unknown', 'Output needs terminal-state or display-cell interpretation outside this profile')
  const grid = text.split('\n').map(line => [...line]), cell = (x: number, y: number) => grid[y]?.[x] ?? ' '
  if (grid.length > 256 || grid.some(line => line.length > 512) || [...text].filter(character => character === '┌' || character === '+').length > 64 || expected.nodes.length > 32) return verdict('unknown', 'Output exceeds the bounded grid profile')
  const boxes: Box[] = []
  const horizontal = (line: string) => /^[─┬┴┼+\-]+$/.test(line)
  const vertical = (character: string) => ['│', '|', '├', '┤', '┼', '+'].includes(character)
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const left = cell(x, y)
    if (!['┌', '+'].includes(left)) continue
    for (let right = x + 2; right < grid[y]!.length; right++) {
      if (cell(right, y) !== (left === '+' ? '+' : '┐') || !horizontal(grid[y]!.slice(x + 1, right).join(''))) continue
      for (let bottom = y + 2; bottom < grid.length; bottom++) {
        if (cell(x, bottom) !== (left === '+' ? '+' : '└') || cell(right, bottom) !== (left === '+' ? '+' : '┘') || !horizontal((grid[bottom] ?? []).slice(x + 1, right).join('')) || !Array.from({ length: bottom - y - 1 }, (_, index) => y + index + 1).every(row => vertical(cell(x, row)) && vertical(cell(right, row)))) continue
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
  const points: Record<string, number[]> = { '─': [1, 3], '-': [1, 3], '│': [0, 2], '|': [0, 2], '┌': [1, 2], '┐': [2, 3], '└': [0, 1], '┘': [0, 3], '┬': [1, 2, 3], '┴': [0, 1, 3], '├': [0, 1, 2], '┤': [0, 2, 3], '┼': [0, 1, 2, 3], '+': [0, 1, 2, 3] }
  const arrows: Record<string, number> = { '▲': 0, '^': 0, '↑': 0, '►': 1, '▶': 1, '>': 1, '→': 1, '▼': 2, 'v': 2, '↓': 2, '◄': 3, '◀': 3, '<': 3, '←': 3 }
  const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0], key = (x: number, y: number) => x + ',' + y
  const captions = new Map<string, { label: string; token: string }>()
  for (const label of new Set(expected.edges.map(edge => edge.label).filter((value): value is string => !!value))) {
    if (/[^\x20-\x7e]/.test(label)) return verdict('unknown', 'Edge label is outside the display-cell scope')
    for (let y = 0; y < grid.length; y++) {
      const line = grid[y]!.join('')
      for (let x = line.indexOf(label); x >= 0; x = line.indexOf(label, x + 1)) {
        if (inside(x, y) || !(points[cell(x - 1, y)]?.includes(1)) || !(points[cell(x + label.length, y)]?.includes(3) || arrows[cell(x + label.length, y)] === 1)) continue
        for (let offset = 0; offset < label.length; offset++) {
          const coordinate = key(x + offset, y)
          if (captions.has(coordinate)) return verdict('unknown', 'Overlapping edge-label spans are ambiguous')
          captions.set(coordinate, { label, token: key(x, y) })
        }
      }
    }
  }
  const actual: { source: string; target: string; label?: string }[] = [], used = new Set<string>()
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const heading = arrows[cell(x, y)]
    if (heading === undefined || inside(x, y) || captions.has(key(x, y))) continue
    const target = boundary(x + dx[heading]!, y + dy[heading]!)
    if (!target?.id) return verdict('incorrect', 'Arrowhead does not meet a drawn target node', actual)
    used.add(key(x, y))
    let currentX = x - dx[heading]!, currentY = y - dy[heading]!, towardPrevious = heading, source: Box | undefined
    const visited = new Set<string>(), labels = new Map<string, string>()
    while (true) {
      source = boundary(currentX, currentY)
      if (source) break
      const coordinate = key(currentX, currentY)
      if (visited.has(coordinate)) return verdict('incorrect', 'Route loops without reaching a source node', actual)
      visited.add(coordinate); used.add(coordinate)
      const caption = captions.get(coordinate)
      if (caption) labels.set(caption.token, caption.label)
      const exits = caption ? [1, 3] : points[cell(currentX, currentY)]
      if (!exits?.includes(towardPrevious)) return verdict('incorrect', 'Arrow stem is disconnected from its source node', actual)
      const next = exits.filter(direction => direction !== towardPrevious)
      if (next.length !== 1) return verdict('unknown', 'Junction or crossing has ambiguous route ownership', actual)
      const direction = next[0]!
      currentX += dx[direction]!; currentY += dy[direction]!; towardPrevious = (direction + 2) % 4
    }
    if (!source.id || labels.size > 1) return verdict('unknown', 'Source or relationship label ownership is ambiguous', actual)
    actual.push({ source: source.id, target: target.id, ...(labels.size ? { label: [...labels.values()][0]! } : {}) })
  }
  const canonical = (edges: readonly { source: string; target: string; label?: string }[]) => edges.map(edge => JSON.stringify([edge.source, edge.target, edge.label ?? ''])).sort()
  if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected.edges))) return verdict('incorrect', 'Drawn directed relationships or their labels differ from the authored graph', actual)
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) if (cell(x, y) !== ' ' && !inside(x, y) && !used.has(key(x, y))) return verdict('unknown', 'Unassigned output ink or text remains outside the verified nodes and routes', actual)
  return verdict('correct', 'Every declared node and directed route is present with its owned label', actual)
}
