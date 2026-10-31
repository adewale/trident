import { terminalRectangles } from './terminal-rectangles.ts'
import { interpretTerminal, terminalTextWidth } from './terminal-display.ts'
/** A bounded terminal observer: grapheme-aware labels in rectangular boxes joined
 * by orthogonal directed routes. Unsupported display/layout features are
 * unknown. Text presence alone never establishes a relationship. */
export interface TerminalMeaning {
  nodes: readonly { id: string; label: string }[]
  edges: readonly { source: string; target: string; label?: string }[]
  layout?: readonly { before: string; after: string; axis: 'x' | 'y' }[]
}
type Box = { x: number; y: number; right: number; bottom: number; label: string; id?: string }
const scope = 'Rectangular flowcharts in bounded display cells, NFC grapheme labels, qualified terminal-state controls and orthogonal directed routes with a unique drawn source and uniquely owned captions. Groups, other family facts and ambiguous junctions require their own qualified projections.'

export function inspectTerminalMeaning(output: string, expected: TerminalMeaning, options = { primitiveShapes: false }) {
  const verdict = (status: 'correct' | 'incorrect' | 'unknown', reason: string, edges: { source: string; target: string; label?: string }[] = []) => ({ status, reason, scope, edges })
  if (!expected.nodes.length || new Set(expected.nodes.map(node => node.id)).size !== expected.nodes.length || new Set(expected.nodes.map(node => node.label)).size !== expected.nodes.length || expected.nodes.some(node => !node.label || /[\n\r\x00-\x1f]/.test(node.label)) || expected.edges.some(edge => !expected.nodes.some(node => node.id === edge.source) || !expected.nodes.some(node => node.id === edge.target))) return verdict('unknown', 'Expected identities/labels are ambiguous or outside the declared display scope')
  const display = interpretTerminal(output)
  if (display.status !== 'available') return verdict('unknown', display.reason ?? 'No qualified terminal-state interpretation')
  const text = display.text, grid = display.cells, cell = (x: number, y: number) => grid[y]?.[x] ?? ' '
  if (grid.length > 256 || grid.some(line => line.length > 512) || [...text].filter(character => (options.primitiveShapes ? ['┌', '╭', '+', '◇', '◯', '◎', '(', '/', '▷', '⌜', '╟'] : ['┌', '╭', '+']).includes(character)).length > (options.primitiveShapes ? 256 : 64) || expected.nodes.length > 32) return verdict('unknown', 'Output exceeds the bounded grid profile')
  const boxes: Box[] = terminalRectangles(grid, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: options.primitiveShapes, ports: true }).map(({ lines, ...box }) => ({ ...box, label: lines.join(' ').replace(/\s+/g, ' ').trim() }))
  for (const node of expected.nodes) {
    const matches = boxes.filter(box => box.label.normalize('NFC') === node.label.normalize('NFC'))
    if (!matches.length && (text.includes(node.label) || boxes.some(box => box.label.replace(/\s/g, '') === node.label.replace(/\s/g, '')))) return verdict('unknown', 'Visible authored label lacks a qualified node-container or wrapping projection: ' + node.label)
    if (matches.length !== 1) return verdict('incorrect', 'Expected exactly one drawn node labelled ' + node.label + '; found ' + matches.length)
    matches[0]!.id = node.id
  }
  if (boxes.length !== expected.nodes.length) return verdict('unknown', 'Additional or nested containers need a reviewed ownership projection')
  const inside = (x: number, y: number) => boxes.find(box => x >= box.x && x <= box.right && y >= box.y && y <= box.bottom)
  const boundary = (x: number, y: number) => boxes.find(box => (x === box.x || x === box.right) && y > box.y && y < box.bottom || (y === box.y || y === box.bottom) && x > box.x && x < box.right)
  const points: Record<string, number[]> = { '─': [1, 3], '-': [1, 3], '│': [0, 2], '|': [0, 2], '┌': [1, 2], '┐': [2, 3], '└': [0, 1], '┘': [0, 3], '╭': [1, 2], '╮': [2, 3], '╰': [0, 1], '╯': [0, 3], '┬': [1, 2, 3], '┴': [0, 1, 3], '├': [0, 1, 2], '┤': [0, 2, 3], '┼': [0, 1, 2, 3], '+': [0, 1, 2, 3] }
  const arrows: Record<string, number> = { '▲': 0, '^': 0, '↑': 0, '►': 1, '▶': 1, '>': 1, '→': 1, '▼': 2, 'v': 2, '↓': 2, '◄': 3, '◀': 3, '<': 3, '←': 3 }
  const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0], key = (x: number, y: number) => x + ',' + y
  const captions = new Map<string, { label: string; token: string; exits: number[] }>(), captionCells = new Set<string>(), captionSpans = new Map<string, string[]>()
  const floating: { label: string; x: number; y: number; width: number }[] = []
  let uncertainCaption = false
  for (const label of new Set(expected.edges.map(edge => edge.label).filter((value): value is string => !!value))) {
    if (/[\n\r\x00-\x1f]/.test(label)) return verdict('unknown', 'Multiline edge labels need a qualified route ownership projection')
    for (let y = 0; y < grid.length; y++) {
      const line = grid[y]!.join(''), hits: { x: number; width: number; uncertain: boolean }[] = []
      for (let offset = line.indexOf(label.normalize('NFC')); offset >= 0; offset = line.indexOf(label.normalize('NFC'), offset + 1)) {
        const prefix = line.slice(0, offset), column = terminalTextWidth(prefix)
        hits.push({ x: column, width: terminalTextWidth(label), uncertain: false })
      }
      if (!hits.length && /\s/.test(label)) {
        const escaped = label.split(/(\s+)/).map(part => /^\s+$/.test(part) ? '[ ─-]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')
        for (const match of line.matchAll(new RegExp(escaped, 'g'))) hits.push({ x: terminalTextWidth(line.slice(0, match.index!)), width: terminalTextWidth(match[0]), uncertain: true })
      }
      for (const hit of hits) {
        const { x, width } = hit
        if (Array.from({ length: width }, (_, offset) => inside(x + offset, y)).some(Boolean)) continue
        uncertainCaption ||= hit.uncertain
        const token = key(x, y), span = Array.from({ length: width }, (_, offset) => key(x + offset, y))
        for (const coordinate of span) captionCells.add(coordinate)
        captionSpans.set(token, span)
        const horizontal = points[cell(x - 1, y)]?.includes(1) && (points[cell(x + width, y)]?.includes(3) || arrows[cell(x + width, y)] === 1)
        if (horizontal) {
          for (const coordinate of span) {
            if (captions.has(coordinate)) return verdict('unknown', 'Overlapping edge-label spans are ambiguous')
            captions.set(coordinate, { label, token, exits: [1, 3] })
          }
          continue
        }
        const midpoint = x + (width - 1) / 2
        const vertical = Array.from({ length: width }, (_, offset) => x + offset).filter(column => Math.abs(column - midpoint) <= .5 && points[cell(column, y - 1)]?.includes(2) && points[cell(column, y + 1)]?.includes(0))
        if (vertical.length === 1) { captions.set(key(vertical[0]!, y), { label, token, exits: [0, 2] }); continue }
        floating.push({ label, x, y, width })
      }
    }
  }
  const actual: { source: string; target: string; label?: string }[] = [], used = new Set<string>()
  const paths: { x: number; y: number }[][] = []
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const heading = arrows[cell(x, y)]
    if (heading === undefined || boxes.some(box => x > box.x && x < box.right && y > box.y && y < box.bottom) || captionCells.has(key(x, y))) continue
    const port = boundary(x, y), inward = port && (x === port.x && heading === 1 || x === port.right && heading === 3 || y === port.y && heading === 2 || y === port.bottom && heading === 0)
    const target = inward ? port : boundary(x + dx[heading]!, y + dy[heading]!)
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
      if (arrows[cell(cursor.x, cursor.y)] !== undefined && !captions.has(coordinate)) continue
      const caption = captions.get(coordinate), exits = caption?.exits ?? points[cell(cursor.x, cursor.y)]
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
    for (const token of found.labels.keys()) for (const coordinate of captionSpans.get(token) ?? []) used.add(coordinate)
    actual.push({ source: found.source.id, target: target.id, ...(found.labels.size ? { label: [...found.labels.values()][0]! } : {}) })
    paths.push([{ x, y }, ...[...found.path].map(coordinate => { const [x, y] = coordinate.split(',').map(Number); return { x: x!, y: y! } })])
  }
  for (const caption of floating) {
    const midpoint = caption.x + (caption.width - 1) / 2
    const candidates = paths.map((path, index) => ({ index, near: path.some(point => Math.abs(point.y - caption.y) === 1 && Math.abs(point.x - midpoint) <= .5 || point.y === caption.y && (point.x === caption.x - 1 || point.x === caption.x + caption.width)) })).filter(item => item.near)
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
  if (uncertainCaption) return verdict('unknown', 'Caption whitespace overlaps route ink; exact text projection is unqualified', actual)
  return verdict('correct', 'Every declared node and directed route is present with its owned label', actual)
}
