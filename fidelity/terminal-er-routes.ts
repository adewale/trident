import { terminalCellWidth } from './terminal-display.ts'
import { terminalAuthoredLinesObserved } from './terminal-text.ts'
import { inspectTerminalMeaning, type TerminalMeaning } from './terminal.ts'
import type { TerminalEntity } from './terminal-er.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
const range = (value: string) => ({ '||': '1', 'o|': '0..1', '|o': '0..1', '}o': '0..*', 'o{': '0..*', '}|': '1..*', '|{': '1..*' } as Record<string, string>)[value]
/** Inline Mermaid cardinality glyph pairs are semantic endpoint labels, not
 * arrows. Normalize their ink to continuous cells, then trace both directions
 * from every real entity port; expected relationships never select a junction. */
export function inspectTerminalErRoutes(grid: string[][], entities: TerminalEntity[], contract: TerminalSourceContract): TerminalFactCheck | undefined {
  const expected = contract.facts.find(fact => fact.criterion === 'entity-relations')?.expected as { source: string; target: string; sourceCardinality: string; targetCardinality: string; identifying: boolean; caption: string }[] | undefined
  if (!expected?.length) return
  const normalized = grid.map(row => [...row]), inside = (x: number, y: number) => entities.some(box => x >= box.x && x <= box.right && y >= box.y && y <= box.bottom), tokens: { x: number; y: number; value: string }[] = []
  const point: Record<string, number[]> = { '─': [1, 3], '-': [1, 3], '│': [0, 2], '|': [0, 2], '┌': [1, 2], '┐': [2, 3], '└': [0, 1], '┘': [0, 3], '╭': [1, 2], '╮': [2, 3], '╰': [0, 1], '╯': [0, 3], '┄': [1, 3], '┈': [1, 3], '╌': [1, 3], '┆': [0, 2], '┊': [0, 2], '╎': [0, 2], '┬': [1, 2, 3], '┴': [0, 1, 3], '├': [0, 1, 2], '┤': [0, 2, 3], '┼': [0, 1, 2, 3] }
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length - 1; x++) {
    const value = grid[y]![x]! + grid[y]![x + 1]!
    if (inside(x, y) || inside(x + 1, y) || !range(value) || !point[grid[y]?.[x - 1] ?? '']?.includes(1) || !point[grid[y]?.[x + 2] ?? '']?.includes(3)) continue
    tokens.push({ x, y, value }); const adjacent = [grid[y]?.[x - 1], grid[y]?.[x + 2]], stroke = adjacent.find(glyph => glyph && /^[┄┈╌]$/.test(glyph)) ?? '─'; normalized[y]![x] = normalized[y]![x + 1] = stroke; x++
  }
  if (!tokens.length) return
  // Preserve independent entity body ownership, replacing only compartment ink.
  for (const box of entities) {
    for (let y = box.y + 1; y < box.bottom; y++) { for (let x = box.x + 1; x < box.right; x++) normalized[y]![x] = ' '; if (/^[├+]$/.test(normalized[y]![box.x]!)) normalized[y]![box.x] = '│'; if (/^[┤+]$/.test(normalized[y]![box.right]!)) normalized[y]![box.right] = '│' }
    let column = box.x + 1; for (const glyph of box.id) { normalized[box.y + 1]![column] = glyph; if (terminalCellWidth(glyph) === 2) normalized[box.y + 1]![column + 1] = ''; column += terminalCellWidth(glyph) }
  }
  const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0], heads = ['▲', '►', '▼', '◄']
  for (const box of entities) for (let y = box.y; y <= box.bottom; y++) for (let x = box.x; x <= box.right; x++) {
    const outward = y === box.y && x > box.x && x < box.right ? 0 : x === box.right && y > box.y && y < box.bottom ? 1 : y === box.bottom && x > box.x && x < box.right ? 2 : x === box.x && y > box.y && y < box.bottom ? 3 : undefined
    if (outward === undefined) continue
    const col = x + dx[outward]!, row = y + dy[outward]!, glyph = normalized[row]?.[col] ?? ' '
    if (point[glyph]?.includes((outward + 2) % 4) && !inside(col, row)) normalized[y]![x] = heads[(outward + 2) % 4]!
  }
  const edges: TerminalMeaning['edges'] = expected.flatMap(edge => [{ source: edge.source, target: edge.target, label: edge.caption, ...(!edge.identifying ? { stroke: 'dotted' } : {}) }, { source: edge.target, target: edge.source, label: edge.caption, ...(!edge.identifying ? { stroke: 'dotted' } : {}) }])
  const verdict = inspectTerminalMeaning(normalized.map(row => row.join('')).join('\n'), { nodes: entities.map(box => ({ id: box.id, label: box.id })), edges })
  const row: TerminalFactCheck = { criterion: 'entity-relations', expected, status: verdict.status === 'incorrect' ? 'failed' : 'unknown', detail: 'Inline cardinality pairs and orthogonal entity ports: ' + verdict.reason, actual: verdict.edges }
  if (verdict.status !== 'correct') return row
  let mismatch = false, ambiguous = false
  const observed = verdict.edges.map(edge => {
    const route = edge.route ?? [], found = tokens.map(token => ({ token, index: route.findIndex(cell => cell.y === token.y && (cell.x === token.x || cell.x === token.x + 1)) })).filter(item => item.index >= 0).sort((a, b) => a.index - b.index)
    if (found.length !== 2) { ambiguous = true; return { ...edge, cardinalities: found.map(item => item.token.value) } }
    const targetCardinality = range(found[0]!.token.value), sourceCardinality = range(found[1]!.token.value), candidates = expected.filter(want => want.source === edge.source && want.target === edge.target || want.target === edge.source && want.source === edge.target)
    if (candidates.length !== 1) ambiguous = true
    else { const wanted = candidates[0]!, forward = wanted.source === edge.source; if (sourceCardinality !== range(forward ? wanted.sourceCardinality : wanted.targetCardinality) || targetCardinality !== range(forward ? wanted.targetCardinality : wanted.sourceCardinality) || !terminalAuthoredLinesObserved((edge.label ?? '').split('\n'), wanted.caption.split('\n'))) mismatch = true }
    return { source: edge.source, target: edge.target, sourceCardinality, targetCardinality, caption: edge.label }
  })
  return { ...row, status: mismatch ? 'failed' : ambiguous ? 'unknown' : 'passed', detail: 'Every traced entity link owns exactly two inline endpoint cardinalities, its exact caption and identifying stroke; crossings retain unknown ownership', actual: observed }
}
