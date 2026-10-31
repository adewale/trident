/** Bounded interpretation of captured terminal output. LF uses the ordinary
 * transcript newline convention (CR+LF). Cells retain graphemes and wide-cell
 * continuations; text offsets are never substituted for display columns. */
export interface TerminalDisplay { status: 'available' | 'unavailable'; reason?: string; cells: string[][]; text: string; protocol: 'terminal-cells-v1' }
const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' })
const wide = (point: number) => point >= 0x1100 && (point <= 0x115f || point === 0x2329 || point === 0x232a || point >= 0x2e80 && point <= 0xa4cf && point !== 0x303f || point >= 0xac00 && point <= 0xd7a3 || point >= 0xf900 && point <= 0xfaff || point >= 0xfe10 && point <= 0xfe19 || point >= 0xfe30 && point <= 0xfe6f || point >= 0xff00 && point <= 0xff60 || point >= 0xffe0 && point <= 0xffe6 || point >= 0x20000 && point <= 0x3fffd)
export function terminalCellWidth(grapheme: string): number {
  if (!grapheme || /^[\p{Mark}\u200d\ufe0e\ufe0f]+$/u.test(grapheme)) return 0
  if (/\p{Emoji_Presentation}/u.test(grapheme) || grapheme.includes('\ufe0f') || grapheme.includes('\u200d') && /\p{Extended_Pictographic}/u.test(grapheme) || [...grapheme].some(character => wide(character.codePointAt(0)!))) return 2
  return 1
}
export const terminalTextWidth = (text: string) => [...segmenter.segment(text.normalize('NFC'))].reduce((sum, part) => sum + terminalCellWidth(part.segment), 0)
const palette = ['0,0,0', '205,0,0', '0,205,0', '205,205,0', '0,0,238', '205,0,205', '0,205,205', '229,229,229', '127,127,127', '255,0,0', '0,255,0', '255,255,0', '92,92,255', '255,0,255', '0,255,255', '255,255,255']
const indexedColour = (n: number) => n < 16 ? palette[n]! : n < 232 ? [Math.floor((n - 16) / 36), Math.floor((n - 16) / 6) % 6, (n - 16) % 6].map(level => level ? 55 + 40 * level : 0).join(',') : [8 + (n - 232) * 10, 8 + (n - 232) * 10, 8 + (n - 232) * 10].join(',')

export function interpretTerminal(output: string, bounds = { columns: 1024, rows: 512, inputBytes: 500_000 }): TerminalDisplay {
  const cells: string[][] = [], result = (status: TerminalDisplay['status'], reason?: string): TerminalDisplay => ({ status, ...(reason ? { reason } : {}), cells, text: cells.map(row => row.join('')).join('\n'), protocol: 'terminal-cells-v1' })
  if (Buffer.byteLength(output) > bounds.inputBytes) return result('unavailable', 'Terminal input exceeds the bounded byte profile')
  let x = 0, y = 0, saved = { x: 0, y: 0 }, foreground = palette[7]!, background = palette[0]!, concealed = false, inverse = false
  let alternate: { cells: string[][]; x: number; y: number; foreground: string; background: string; concealed: boolean; inverse: boolean } | undefined
  const row = () => { while (cells.length <= y) cells.push([]); return cells[y]! }
  const blank = (column: number, target = row()) => {
    if (target[column] === '' && column > 0) target[column - 1] = ' '
    if (target[column + 1] === '') target[column + 1] = ' '
    target[column] = ' '
  }
  const fill = (from: number, to: number, target = row()) => { for (let n = from; n < to; n++) blank(n, target) }
  const within = () => Number.isSafeInteger(x) && Number.isSafeInteger(y) && x >= 0 && x <= bounds.columns && y >= 0 && y < bounds.rows
  const position = () => { if (!within()) throw Error('Terminal cursor escapes the bounded display') }
  const write = (grapheme: string) => {
    const width = terminalCellWidth(grapheme)
    if (!width) { if (x > 0) { const at = row()[x - 1] === '' ? x - 2 : x - 1; if (at >= 0) row()[at] = (row()[at] ?? '') + grapheme } return }
    if (x + width > bounds.columns) throw Error('Terminal line exceeds the bounded display; implicit wrapping is unspecified')
    const target = row(); while (target.length < x) target.push(' ')
    blank(x, target); if (width === 2) blank(x + 1, target)
    const fg = inverse ? background : foreground, bg = inverse ? foreground : background
    target[x] = concealed || fg === bg ? ' '.repeat(width) : grapheme.normalize('NFC')
    if (width === 2) target[x + 1] = ''
    x += width
  }
  const sgr = (values: number[]) => {
    for (let n = 0; n < values.length; n++) {
      const code = values[n]!
      if (code === 0) { foreground = palette[7]!; background = palette[0]!; concealed = false; inverse = false }
      else if (code === 8) concealed = true
      else if (code === 28) concealed = false
      else if (code === 7) inverse = true
      else if (code === 27) inverse = false
      else if (code >= 30 && code <= 37) foreground = palette[code - 30]!
      else if (code >= 40 && code <= 47) background = palette[code - 40]!
      else if (code >= 90 && code <= 97) foreground = palette[code - 90 + 8]!
      else if (code >= 100 && code <= 107) background = palette[code - 100 + 8]!
      else if (code === 39) foreground = palette[7]!
      else if (code === 49) background = palette[0]!
      else if (code === 38 || code === 48) {
        let colour: string
        if (values[n + 1] === 5 && Number.isInteger(values[n + 2]) && values[n + 2]! >= 0 && values[n + 2]! <= 255) { colour = indexedColour(values[n + 2]!); n += 2 }
        else if (values[n + 1] === 2 && values.slice(n + 2, n + 5).length === 3 && values.slice(n + 2, n + 5).every(value => Number.isInteger(value) && value >= 0 && value <= 255)) { colour = values.slice(n + 2, n + 5).join(','); n += 4 }
        else throw Error('Unknown terminal colour sequence')
        if (code === 38) foreground = colour; else background = colour
      } else if (![1, 2, 3, 4, 9, 22, 23, 24, 29].includes(code)) throw Error('Unqualified terminal SGR attribute: ' + code)
    }
  }
  const csi = (body: string, final: string) => {
    if (/^[?>]/.test(body)) {
      if (final === 'h' || final === 'l') { if (body === '?25') return
        if (body === '?1049') {
          if (final === 'h') {
            if (alternate) throw Error('Nested alternate-screen entry is unqualified')
            alternate = { cells: cells.map(row => [...row]), x, y, foreground, background, concealed, inverse }; cells.length = 0; x = 0; y = 0
          } else {
            if (!alternate) throw Error('Alternate-screen exit has no owned entry')
            cells.splice(0, cells.length, ...alternate.cells); ({ x, y, foreground, background, concealed, inverse } = alternate); alternate = undefined
          }
          return
        } }
      throw Error('Unqualified private terminal mode')
    }
    if (!/^[0-9;]*$/.test(body)) throw Error('Unqualified terminal control parameters')
    const values = body ? body.split(';').map(value => Number(value || 0)) : [0], n = values[0] || 1
    if (values.some(value => !Number.isSafeInteger(value) || value < 0 || value > 65_536)) throw Error('Terminal control exceeds bounded arguments')
    if (final === 'm') sgr(values)
    else if (final === 'A') y = Math.max(0, y - n)
    else if (final === 'B') y += n
    else if (final === 'C' || final === 'a') x += n
    else if (final === 'D') x = Math.max(0, x - n)
    else if (final === 'E') { y += n; x = 0 }
    else if (final === 'F') { y = Math.max(0, y - n); x = 0 }
    else if (final === 'G' || final === '`') x = n - 1
    else if (final === 'd') y = n - 1
    else if (final === 'H' || final === 'f') { y = n - 1; x = (values[1] || 1) - 1 }
    else if (final === 's') saved = { x, y }
    else if (final === 'u') { x = saved.x; y = saved.y }
    else if (final === 'K') { if (values[0] === 0) fill(x, row().length); else if (values[0] === 1) fill(0, x + 1); else if (values[0] === 2) row().length = 0; else throw Error('Unqualified erase-line mode') }
    else if (final === 'J') {
      if (values[0] === 2 || values[0] === 3) cells.length = 0
      else if (values[0] === 0) { fill(x, row().length); cells.length = y + 1 }
      else if (values[0] === 1) { for (let i = 0; i < y; i++) cells[i] = []; fill(0, x + 1) }
      else throw Error('Unqualified erase-display mode')
    } else if (final === 'X') fill(x, Math.min(bounds.columns, x + n))
    else if (final === '@' || final === 'P') {
      if (row().some(value => value === '' || terminalCellWidth(value) !== 1)) throw Error('Wide-cell insertion/deletion needs an explicit grapheme projection')
      if (final === '@') row().splice(x, 0, ...Array(Math.min(n, bounds.columns - x)).fill(' ')); else row().splice(x, n)
      if (row().length > bounds.columns) throw Error('Terminal insertion exceeds bounds')
    } else throw Error('Unqualified terminal CSI operation: ' + final)
    position()
  }
  try {
    for (let index = 0; index < output.length;) {
      const character = output[index]!
      if (character === '\x1b') {
        const rest = output.slice(index)
        if (rest.startsWith('\x1b[')) { const match = /^\x1b\[([0-9;?><]*)([@-~])/.exec(rest); if (!match) throw Error('Truncated or unsupported CSI'); csi(match[1]!, match[2]!); index += match[0].length; continue }
        if (rest.startsWith('\x1b]')) { const match = /^\x1b\](8;[^\x07\x1b]*)(?:\x07|\x1b\\)/.exec(rest); if (!match) throw Error('Unqualified or unterminated OSC'); index += match[0].length; continue }
        if (rest.startsWith('\x1b7')) { saved = { x, y }; index += 2; continue }
        if (rest.startsWith('\x1b8')) { x = saved.x; y = saved.y; position(); index += 2; continue }
        throw Error('Unqualified terminal escape')
      }
      if (character === '\n') { y++; x = 0; position(); index++; continue }
      if (character === '\r') { x = 0; index++; continue }
      if (character === '\b') { x = Math.max(0, x - 1); index++; continue }
      if (character === '\t') { x += 8 - x % 8; position(); index++; continue }
      if (/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(character)) throw Error('Bidirectional formatting controls require a reviewed display-order profile')
      if (character < ' ' || character === '\x7f') throw Error('Unqualified terminal control character')
      const stop = output.slice(index).search(/[\x00-\x1f\x7f]/), run = stop < 0 ? output.slice(index) : output.slice(index, index + stop)
      if (/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(run)) throw Error('Bidirectional formatting controls require a reviewed display-order profile')
      for (const part of segmenter.segment(run)) write(part.segment)
      index += run.length
    }
    while (cells.length && !cells.at(-1)!.some(character => character && character.trim())) cells.pop()
    return result('available')
  } catch (error) { return result('unavailable', String(error)) }
}
