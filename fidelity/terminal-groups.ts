import { interpretTerminal } from './terminal-display.ts'
import { terminalRectangles, type TerminalRectangle } from './terminal-rectangles.ts'
export interface TerminalGroup { id: string; label: string; members: string[]; parent?: string }
export interface ObservedTerminalGroup extends TerminalRectangle { id: string; label: string }
/** Enclosure and direct membership come from actual geometry. Expected edges
 * never decide whether a leaf or nested group belongs to a container. */
export function inspectTerminalGrouping(output: string, nodes: readonly { id: string; label: string }[], expected: readonly TerminalGroup[]) {
  const display = interpretTerminal(output), groups: ObservedTerminalGroup[] = [], decor = new Set<string>(), headers = new Set<string>(), actual: TerminalGroup[] = []
  const result = (status: 'passed' | 'failed' | 'unknown', reason: string) => ({ status, reason, groups, decor, headers, actual })
  if (display.status !== 'available') return result('unknown', display.reason!)
  const grid = display.cells, cell = (x: number, y: number) => grid[y]?.[x] ?? ' ', normalize = (text: string) => text.replace(/\s+/g, ' ').trim().normalize('NFC'), key = (x: number, y: number) => x + ',' + y
  if (grid.length > 256 || grid.some(row => row.length > 512) || [...display.text].filter(glyph => /[┌╭+◇◯◎(/▷⌜╟]/.test(glyph)).length > 256 || !expected.length || new Set(expected.map(group => group.label)).size !== expected.length || new Set(expected.map(group => group.id)).size !== expected.length || new Set(nodes.map(node => normalize(node.label))).size !== nodes.length) return result('unknown', 'Group profile exceeds bounds or source labels are ambiguous')
  const boxes = terminalRectangles(grid, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true }), contains = (outer: TerminalRectangle, inner: TerminalRectangle) => outer !== inner && outer.x < inner.x && outer.right > inner.right && outer.y < inner.y && outer.bottom > inner.bottom
  const candidates = boxes.filter(box => boxes.some(child => contains(box, child))).map(box => {
    const firstChild = Math.min(...boxes.filter(child => contains(box, child)).map(child => child.y)), titleRows: number[] = [], labels: string[] = []
    for (let y = box.y + 1; y < firstChild; y++) {
      const text = grid[y]!.slice(box.x + 1, box.right).map(glyph => /^[│|─┌┐└┘╭╮╰╯┬┴├┤┼+▲▼▶◀►◄]$/.test(glyph) ? ' ' : glyph).join('').trim()
      if (text) { labels.push(text); titleRows.push(y) }
    }
    return { ...box, label: normalize(labels.join(' ')), titleRows }
  })
  for (const group of expected) {
    const matched = candidates.filter(box => box.label === normalize(group.label))
    if (matched.length !== 1) return result(expected.length === 1 && candidates.length === 1 ? 'failed' : 'unknown', 'No unique enclosing container has the exact authored group label: ' + group.label + '; observed container labels: ' + JSON.stringify(candidates.map(candidate => candidate.label)))
    const box = matched[0]!
    groups.push({ ...box, id: group.id })
    for (let y = box.y; y <= box.bottom; y++) for (const x of [box.x, box.right]) decor.add(key(x, y))
    for (let x = box.x; x <= box.right; x++) for (const y of [box.y, box.bottom]) decor.add(key(x, y))
    for (const y of box.titleRows) for (let x = box.x + 1; x < box.right; x++) if (!/^[│|─┌┐└┘╭╮╰╯┬┴├┤┼+▲▼▶◀►◄]$/.test(cell(x, y))) { headers.add(key(x, y)); decor.add(key(x, y)) }
  }
  if (candidates.length !== groups.length) return result('unknown', 'Additional enclosing containers need a source ownership contract')
  if (groups.some((a, index) => groups.slice(index + 1).some(b => Math.max(a.x, b.x) < Math.min(a.right, b.right) && Math.max(a.y, b.y) < Math.min(a.bottom, b.bottom) && !contains(a, b) && !contains(b, a)))) return result('unknown', 'Overlapping non-nested group frames do not establish unique ownership')
  const leafBoxes = boxes.filter(box => !candidates.some(group => group.x === box.x && group.y === box.y && group.right === box.right && group.bottom === box.bottom)), mapped: { id: string; box: TerminalRectangle }[] = []
  for (const node of nodes) {
    const matched = leafBoxes.filter(box => normalize(box.lines.join(' ')) === normalize(node.label))
    if (matched.length !== 1) return result('unknown', 'A group member has no unique independently observed node container: ' + node.label)
    mapped.push({ id: node.id, box: matched[0]! })
  }
  if (leafBoxes.length !== mapped.length) return result('unknown', 'Additional or decorative leaf containers need an ownership projection')
  const owner = (box: TerminalRectangle) => groups.filter(group => contains(group, box)).sort((a, b) => (a.right - a.x) * (a.bottom - a.y) - (b.right - b.x) * (b.bottom - b.y))[0]
  for (const group of groups) {
    const parent = owner(group), members = [...mapped.filter(node => owner(node.box)?.id === group.id).map(node => node.id), ...groups.filter(child => owner(child)?.id === group.id).map(child => child.id)]
    actual.push({ id: group.id, label: group.label, members, ...(parent ? { parent: parent.id } : {}) })
  }
  const canonical = (items: readonly TerminalGroup[]) => items.map(group => JSON.stringify([group.id, normalize(group.label), [...group.members].sort(), group.parent ?? null])).sort()
  const matches = JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected))
  return result(matches ? 'passed' : 'failed', matches ? 'Exact group labels, enclosure, direct leaf membership and nested-group parentage are independently observed' : 'Observed direct group membership or nested parentage differs from the source contract')
}
