export interface TerminalRectangle { x: number; y: number; right: number; bottom: number; lines: string[]; shape?: string }
interface ContainerProfile { horizontal: RegExp; vertical: RegExp; primitives?: boolean; ports?: boolean }
/** Structural observation only: node/participant/card roles and ownership are
 * assigned by the family observer, never by an expected edge or label. */
export function terminalRectangles(grid: string[][], profile: ContainerProfile = { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/ }): TerminalRectangle[] {
  const cell = (x: number, y: number) => grid[y]?.[x] ?? ' ', boxes: TerminalRectangle[] = []
  const forms = [['┌', '┐', '└', '┘', 'rectangle'], ['╭', '╮', '╰', '╯', 'rounded'], ['+', '+', '+', '+', 'rectangle']]
  if (profile.primitives) forms.push(['◇', '◇', '◇', '◇', 'diamond'], ['◯', '◯', '◯', '◯', 'circle'], ['◎', '◎', '◎', '◎', 'double-circle'], ['(', ')', '(', ')', 'stadium'], ['/', '/', '/', '/', 'parallelogram'], ['▷', '┐', '▷', '┘', 'asymmetric'], ['⌜', '⌝', '⌞', '⌟', 'unqualified-primitive'], ['╟', '╢', '╟', '╢', 'unqualified-double-wall'])
  const topPorts = profile.primitives ? /^[─┬┴┼+\-◇◯◎▼v↓]+$/ : /^[─┬┴┼+\-▼v↓]+$/, bottomPorts = profile.primitives ? /^[─┬┴┼+\-◇◯◎▲^↑]+$/ : /^[─┬┴┼+\-▲^↑]+$/
  const horizontal = (text: string, side: 'top' | 'bottom') => !!profile.ports && (side === 'top' ? topPorts : bottomPorts).test(text) || profile.horizontal.test(text) || !!profile.primitives && /^[─┬┴┼+\-◇◯◎]+$/.test(text)
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const form = forms.find(form => form[0] === cell(x, y))
    if (!form) continue
    for (let right = x + 2; right < grid[y]!.length; right++) {
      if (cell(right, y) !== form[1] || !horizontal(grid[y]!.slice(x + 1, right).join(''), 'top')) continue
      for (let bottom = y + 2; bottom < grid.length; bottom++) {
        if (cell(x, bottom) !== form[2] || cell(right, bottom) !== form[3] || !horizontal(grid[bottom]!.slice(x + 1, right).join(''), 'bottom') || !Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1).every(row => (profile.vertical.test(cell(x, row)) || profile.ports && /^[▶►>→]$/.test(cell(x, row)) || profile.primitives && cell(x, row) === '(') && (profile.vertical.test(cell(right, row)) || profile.ports && /^[◀◄<←]$/.test(cell(right, row)) || profile.primitives && cell(right, row) === ')'))) continue
        let lines = grid.slice(y + 1, bottom).map(row => row.slice(x + 1, right).join('').trim()), shape = form[4]!
        if (profile.primitives) {
          const upper = grid[y]!.slice(x + 1, right), lower = grid[bottom]!.slice(x + 1, right), markers = ['◇', '◯', '◎'].filter(glyph => upper.includes(glyph) || lower.includes(glyph))
          if (markers.length) { const glyph = markers[0]!, top = upper.filter(value => value === glyph), down = lower.filter(value => value === glyph); shape = markers.length === 1 && top.length === 1 && down.length === 1 && upper.indexOf(glyph) === lower.indexOf(glyph) ? ({ '◇': 'diamond', '◯': 'circle', '◎': 'double-circle' } as Record<string, string>)[glyph]! : 'unqualified-primitive' }
          if (Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1).some(row => cell(x, row) === '(' || cell(right, row) === ')')) shape = 'stadium'
          if (shape === 'rounded' && lines.length >= 2 && /^╭─+╮$/.test(lines[0]!) && /^╰─+╯$/.test(lines.at(-1)!)) { shape = 'double-circle'; lines = lines.slice(1, -1) }
          else if (shape === 'rounded' && /^╰─+╯$/.test(lines[0] ?? '')) { shape = 'database'; lines = lines.slice(1) }
          else if (lines.length && lines.every(line => /^│.*│$/.test(line))) { shape = 'subroutine'; lines = lines.map(line => line.slice(1, -1).trim()) }
        }
        while (lines.length && !lines[0]) lines.shift()
        while (lines.length && !lines.at(-1)) lines.pop()
        boxes.push({ x, y, right, bottom, lines, shape }); break
      }
    }
  }
  return boxes
}
