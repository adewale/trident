export interface TerminalRectangle { x: number; y: number; right: number; bottom: number; lines: string[]; shape?: string }
/** Negative-only observation of a single caption row whose wall cells drift
 * away from otherwise aligned rectangular rails. Never repairs cells or
 * supplies a closed node, route, or positive shape observation. */
export function terminalRaggedSingleLineFrames(grid: string[][]) {
  const cell = (x: number, y: number) => grid[y]?.[x] ?? ' ', frames: { x: number; y: number; right: number; bottom: number; label: string; row: number; leftWall: number; rightWall: number; ragged: boolean }[] = []
  const wall = (glyph: string) => /^[│├┤┼|]$/.test(glyph), horizontal = (row: string[], x: number, right: number) => /^[─┬┴┼-]+$/.test(row.slice(x + 1, right).join(''))
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) if (cell(x, y) === '┌') for (let right = x + 2; right < grid[y]!.length; right++) if (cell(right, y) === '┐' && horizontal(grid[y]!, x, right)) for (let bottom = y + 4; bottom < grid.length; bottom++) {
    if (cell(x, bottom) !== '└' || cell(right, bottom) !== '┘' || !horizontal(grid[bottom]!, x, right)) continue
    const captionRows = Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1).filter(row => grid[row]!.slice(Math.max(0, x - 4), right + 5).some(glyph => /[\p{Letter}\p{Number}]/u.test(glyph)))
    if (captionRows.length !== 1) continue
    const row = captionRows[0]!
    if (!Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1).filter(at => at !== row).every(at => wall(cell(x, at)) && wall(cell(right, at)) && !grid[at]!.slice(x + 1, right).join('').trim())) continue
    const pairs: { leftWall: number; rightWall: number; label: string }[] = []
    for (let leftWall = Math.max(0, x - 4); leftWall <= x + 4; leftWall++) for (let rightWall = right - 4; rightWall <= right + 4; rightWall++) {
      if (rightWall <= leftWall || !wall(cell(leftWall, row)) || !wall(cell(rightWall, row))) continue
      const label = grid[row]!.slice(leftWall + 1, rightWall).join('').trim()
      if (label && /^[\p{Letter}\p{Number}\p{Mark}\s]+$/u.test(label)) pairs.push({ leftWall, rightWall, label: label.normalize('NFC') })
    }
    if (pairs.length === 1) { const pair = pairs[0]!; frames.push({ x, y, right, bottom, row, ...pair, ragged: pair.leftWall !== x && !cell(x, row).trim() || pair.rightWall !== right && !cell(right, row).trim() }); break }
  }
  return frames
}
interface ContainerProfile { horizontal: RegExp; vertical: RegExp; primitives?: boolean; ports?: boolean; cornerPorts?: boolean }
/** Structural observation only: node/participant/card roles and ownership are
 * assigned by the family observer, never by an expected edge or label. */
export function terminalRectangles(grid: string[][], profile: ContainerProfile = { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/ }): TerminalRectangle[] {
  const cell = (x: number, y: number) => grid[y]?.[x] ?? ' ', boxes: TerminalRectangle[] = [], ported = new Set<TerminalRectangle>()
  const forms = [['┌', '┐', '└', '┘', 'rectangle'], ['╭', '╮', '╰', '╯', 'rounded'], ['+', '+', '+', '+', 'rectangle']]
  if (profile.primitives) forms.push(['◇', '◇', '◇', '◇', 'diamond'], ['◯', '◯', '◯', '◯', 'circle'], ['◎', '◎', '◎', '◎', 'double-circle'], ['(', ')', '(', ')', 'stadium'], ['/', '/', '/', '/', 'parallelogram'], ['▷', '┐', '▷', '┘', 'asymmetric'], ['\\', '┐', '/', '┘', 'asymmetric'], ['⌜', '⌝', '⌞', '⌟', 'unqualified-primitive'], ['╟', '╢', '╟', '╢', 'unqualified-double-wall'])
  const topPorts = profile.primitives ? /^[─┬┴┼+\-◇◯◎△▼v↓]+$/ : /^[─┬┴┼+\-▼v↓]+$/, bottomPorts = profile.primitives ? /^[─┬┴┼+\-◇◯◎△▲^↑]+$/ : /^[─┬┴┼+\-▲^↑]+$/
  const horizontal = (text: string, side: 'top' | 'bottom') => !!profile.ports && (side === 'top' ? topPorts : bottomPorts).test(text) || profile.horizontal.test(text) || !!profile.primitives && /^[─┬┴┼+\-◇◯◎]+$/.test(text)
  const corner = (glyph: string, form: string[], at: number) => glyph === form[at] || !!profile.cornerPorts && form[0] === '┌' && ['┌┬├┼', '┐┬┤┼', '└┴├┼', '┘┴┤┼'][at]!.includes(glyph)
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const form = forms.find(form => form[0] === cell(x, y))
    if (!form) continue
    for (let right = x + 2; right < grid[y]!.length; right++) {
      if (!corner(cell(right, y), form, 1) || !horizontal(grid[y]!.slice(x + 1, right).join(''), 'top')) continue
      for (let bottom = y + 2; bottom < grid.length; bottom++) {
        if (!corner(cell(x, bottom), form, 2) || !corner(cell(right, bottom), form, 3) || !horizontal(grid[bottom]!.slice(x + 1, right).join(''), 'bottom') || !Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1).every(row => (profile.vertical.test(cell(x, row)) || profile.ports && /^[▶►>→]$/.test(cell(x, row)) || profile.primitives && cell(x, row) === '(' || form[0] === '\\' && /^[\\>/]$/.test(cell(x, row))) && (profile.vertical.test(cell(right, row)) || profile.ports && /^[◀◄<←]$/.test(cell(right, row)) || profile.primitives && cell(right, row) === ')'))) continue
        // A complete left-point primitive has ordered upper/lower slopes and
        // exactly one central point. A lone slash is not a source port or box.
        if (form[0] === '\\' && !/^\\*>\/*$/.test(Array.from({ length: bottom - y - 1 }, (_, n) => cell(x, y + n + 1)).join(''))) continue
        const rawLines = grid.slice(y + 1, bottom).map(row => row.slice(x + 1, right).join(''))
        let lines = rawLines.map(line => line.trim()), shape = form[4]!
        if (profile.primitives) {
          const upper = grid[y]!.slice(x + 1, right), lower = grid[bottom]!.slice(x + 1, right), markers = ['◇', '◯', '◎'].filter(glyph => upper.includes(glyph) || lower.includes(glyph))
          if (markers.length) { const glyph = markers[0]!, top = upper.filter(value => value === glyph), down = lower.filter(value => value === glyph); shape = markers.length === 1 && top.length === 1 && down.length === 1 && upper.indexOf(glyph) === lower.indexOf(glyph) ? ({ '◇': 'diamond', '◯': 'circle', '◎': 'double-circle' } as Record<string, string>)[glyph]! : 'unqualified-primitive' }
          const bodyRows = Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1)
          if (bodyRows.some(row => cell(x, row) === '(' || cell(right, row) === ')')) {
            const paired = bodyRows.some(row => cell(x, row) === '(' && cell(right, row) === ')'), complete = bodyRows.every(row => /^[(▶►>→├┼]$/.test(cell(x, row)) && /^[)◀◄<←┤┼]$/.test(cell(right, row)))
            shape = paired && complete ? 'stadium' : 'unqualified-primitive'
          }
          // Nested curves do not establish an inner ring: its vertical walls
          // must also be connected. Until that whole profile is observed, keep
          // the curve ink in the label and withhold shape evidence.
          if (shape === 'rounded' && /^╭─+╮$/.test(lines[0] ?? '')) shape = 'unqualified-nested-boundary'
          else if (shape === 'rounded' && /^╰─+╯$/.test(rawLines[0] ?? '')) { shape = 'database'; lines = lines.slice(1) }
          else if (lines.length && lines.every(line => /^│.*│$/.test(line))) {
            const leftWall = rawLines[0]!.indexOf('│'), rightWall = rawLines[0]!.lastIndexOf('│'), complete = leftWall >= 0 && rightWall > leftWall && rawLines.every(line => line[leftWall] === '│' && line[rightWall] === '│' && !line.slice(0, leftWall).trim() && !line.slice(rightWall + 1).trim())
            if (complete) { shape = 'subroutine'; lines = rawLines.map(line => line.slice(leftWall + 1, rightWall).trim()) } else shape = 'unqualified-inner-walls'
          }

        }
        while (lines.length && !lines[0]) lines.shift()
        while (lines.length && !lines.at(-1)) lines.pop()
        const box = { x, y, right, bottom, lines, shape }; boxes.push(box)
        if (cell(right, y) !== form[1] || cell(x, bottom) !== form[2] || cell(right, bottom) !== form[3]) ported.add(box)
        if (!ported.has(box)) break
      }
    }
  }
  if (profile.primitives) for (let y = 0; y < grid.length; y++) for (let x = 1; x < grid[y]!.length; x++) if (cell(x, y) === '/') {
    for (let right = x + 2; right + 1 < grid[y]!.length; right++) if (cell(right, y) === '\\' && horizontal(grid[y]!.slice(x + 1, right).join(''), 'top')) {
      for (let bottom = y + 2; bottom < grid.length; bottom++) {
        if (cell(x, bottom) !== '\\' || cell(right, bottom) !== '/' || !horizontal(grid[bottom]!.slice(x + 1, right).join(''), 'bottom')) continue
        if (!Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1).every(row => (profile.vertical.test(cell(x - 1, row)) || profile.ports && /^[▶►>→]$/.test(cell(x - 1, row))) && (profile.vertical.test(cell(right + 1, row)) || profile.ports && /^[◀◄<←]$/.test(cell(right + 1, row))))) continue
        const lines = grid.slice(y + 1, bottom).map(row => row.slice(x, right + 1).join('').trim()); while (lines.length && !lines[0]) lines.shift(); while (lines.length && !lines.at(-1)) lines.pop()
        boxes.push({ x: x - 1, y, right: right + 1, bottom, lines, shape: 'hexagon' }); break
      }
    }
  }
  // A regular closed boundary at the same origin owns the container. An
  // interior divider/port cannot also create a shorter corner-port container.
  return boxes.filter(box => !ported.has(box) || box.lines.some(line => line.trim()) && !boxes.some(other => !ported.has(other) && other.x === box.x && other.y === box.y))
}
