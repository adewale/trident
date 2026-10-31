import { terminalRectangles } from './terminal-rectangles.ts'
import { interpretTerminal } from './terminal-display.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
type Box = { x: number; y: number; right: number; bottom: number }
/** A board projection observes columns and independently enclosed cards. Labels
 * alone cannot supply column membership or card order. */
export function inspectTerminalKanban(output: string, contract: TerminalSourceContract): TerminalFactCheck {
  const expected = contract.facts.find(fact => fact.criterion === 'kanban-hierarchy')?.expected as { id: string; label: string; parent: string | null; order: number }[]
  const unknown = (detail: string): TerminalFactCheck => ({ criterion: 'kanban-hierarchy', status: 'unknown', detail, expected })
  const display = interpretTerminal(output)
  if (display.status !== 'available') return unknown(display.reason!)
  const grid = display.cells, cell = (x: number, y: number) => grid[y]?.[x] ?? ' ', boxes: Box[] = []
  if (grid.length > 256 || grid.some(row => row.length > 512) || [...display.text].filter(glyph => ['┌', '╭', '+'].includes(glyph)).length > 64 || !expected?.length || expected.some(item => item.parent && expected.find(parent => parent.id === item.parent)?.parent) || new Set(expected.map(item => item.label)).size !== expected.length) return unknown('Board exceeds the bounded two-level, unique-label profile')
  const line = (left: number, right: number, y: number) => grid[y]?.slice(left, right).join('') ?? ''
  boxes.push(...terminalRectangles(grid, { horizontal: /^[─-]+$/, vertical: /^[│|]$/ }))
  const contains = (a: Box, b: Box) => a !== b && a.x < b.x && a.right > b.right && a.y < b.y && a.bottom > b.bottom
  const columns = boxes.filter(box => !boxes.some(parent => contains(parent, box))).sort((a, b) => a.x - b.x)
  if (!columns.length || columns.length > 16 || new Set(columns.map(box => box.y)).size !== 1) return unknown('No qualified row of board columns')
  const columnFacts = expected.filter(item => !item.parent).sort((a, b) => a.order - b.order), actual: any[] = [], used = new Set<string>(), key = (x: number, y: number) => x + ',' + y
  const mark = (left: number, right: number, y: number) => { for (let x = left; x <= right; x++) used.add(key(x, y)) }
  let structured = true
  for (const column of columns) {
    const divider = Array.from({ length: column.bottom - column.y - 1 }, (_, n) => column.y + n + 1).find(y => /^[─-]+$/.test(line(column.x + 1, column.right, y)))
    if (!divider) { structured = false; continue }
    const labelRows = Array.from({ length: divider - column.y - 1 }, (_, n) => line(column.x + 1, column.right, column.y + n + 1).trim()).filter(Boolean)
    if (labelRows.length !== 1) { structured = false; continue }
    const children = boxes.filter(box => contains(column, box)), cards = children.filter(box => !children.some(parent => contains(parent, box))).sort((a, b) => a.y - b.y || a.x - b.x)
    if (children.length !== cards.length || cards.some(card => card.y <= divider)) { structured = false; continue }
    actual.push({ label: labelRows[0], cards: cards.map(card => Array.from({ length: card.bottom - card.y - 1 }, (_, n) => line(card.x + 1, card.right, card.y + n + 1).trim()).filter(Boolean).join('\n')) })
    for (let y = column.y; y <= divider; y++) mark(column.x, column.right, y)
    mark(column.x, column.right, column.bottom)
    for (let y = divider + 1; y < column.bottom; y++) { used.add(key(column.x, y)); used.add(key(column.right, y)) }
    for (const card of cards) for (let y = card.y; y <= card.bottom; y++) mark(card.x, card.right, y)
  }
  if (!structured) return unknown('Column headers, dividers or nested cards have no qualified ownership projection')
  const wanted = columnFacts.map(column => ({ label: column.label, cards: expected.filter(item => item.parent === column.id).sort((a, b) => a.order - b.order).map(item => item.label) }))
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) return { criterion: 'kanban-hierarchy', status: 'failed', detail: 'Exact board columns, enclosed card membership or card order differ from source', expected: wanted, actual }
  if (grid.some((row, y) => row.some((glyph, x) => glyph.trim() && !used.has(key(x, y))))) return unknown('Unassigned ink remains outside the verified board columns and cards')
  return { criterion: 'kanban-hierarchy', status: 'passed', detail: 'Each visible column header owns its exact independently enclosed cards in source order', expected: wanted, actual }
}
