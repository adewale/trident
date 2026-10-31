export interface TerminalRectangle { x: number; y: number; right: number; bottom: number; lines: string[] }
/** Structural observation only: node/participant/card roles and ownership are
 * assigned by the family observer, never by an expected edge or label. */
export function terminalRectangles(grid: string[][], profile = { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/ }): TerminalRectangle[] {
  const cell = (x: number, y: number) => grid[y]?.[x] ?? ' ', boxes: TerminalRectangle[] = []
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const corner = cell(x, y), corners = corner === '┌' ? ['┐', '└', '┘'] : corner === '╭' ? ['╮', '╰', '╯'] : corner === '+' ? ['+', '+', '+'] : undefined
    if (!corners) continue
    for (let right = x + 2; right < grid[y]!.length; right++) {
      if (cell(right, y) !== corners[0] || !profile.horizontal.test(grid[y]!.slice(x + 1, right).join(''))) continue
      for (let bottom = y + 2; bottom < grid.length; bottom++) {
        if (cell(x, bottom) !== corners[1] || cell(right, bottom) !== corners[2] || !profile.horizontal.test(grid[bottom]!.slice(x + 1, right).join('')) || !Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1).every(row => profile.vertical.test(cell(x, row)) && profile.vertical.test(cell(right, row)))) continue
        boxes.push({ x, y, right, bottom, lines: grid.slice(y + 1, bottom).map(row => row.slice(x + 1, right).join('').trim()).filter(Boolean) }); break
      }
    }
  }
  return boxes
}
