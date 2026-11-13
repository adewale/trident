export const normalizedTerminalText = (value: string) => value.replace(/\s+/g, ' ').trim().normalize('NFC')
/** Necessary visible text only, never a positive caption/owner observation.
 * An absent letter/number cannot be supplied by wrapping, bidi order, wire
 * overlap or a different container profile. Ignore marks and punctuation whose
 * raster spelling can vary, and never interpret literal control-bearing text. */
export function terminalMissingLiteralGlyphs(rows: readonly (readonly string[])[], captions: readonly string[]) {
  const letters = (text: string) => [...text.normalize('NFC')].filter(glyph => /[\p{Letter}\p{Number}]/u.test(glyph)), counts = (glyphs: string[]) => { const result = new Map<string, number>(); for (const glyph of glyphs) result.set(glyph, (result.get(glyph) ?? 0) + 1); return result }
  const visible = counts(letters(rows.map(row => row.join('')).join('\n')))
  return captions.filter(caption => !/[\x00-\x09\x0b-\x1f\x7f-\x9f]/.test(caption)).flatMap(caption => {
    const missing = [...counts(letters(caption))].flatMap(([glyph, needed]) => needed > (visible.get(glyph) ?? 0) ? [{ glyph, needed, visible: visible.get(glyph) ?? 0 }] : [])
    return missing.length ? [{ caption, missing }] : []
  })
}
/** Soft wrapping can add rows within an authored line. A hard authored break
 * must still separate two runs of actual display rows. */
export function terminalAuthoredLinesObserved(rows: readonly string[], wanted: readonly string[]) {
  if (wanted.some(line => !normalizedTerminalText(line))) return undefined // Blank rows need a padding projection.
  const memo = new Map<string, boolean>()
  const match = (row: number, at: number): boolean => {
    if (at === wanted.length) return row === rows.length
    const key = row + ',' + at
    if (memo.has(key)) return memo.get(key)!
    const target = normalizedTerminalText(wanted[at]!)
    for (let end = row + 1; end <= rows.length; end++) if (normalizedTerminalText(rows.slice(row, end).join(' ')) === target && match(end, at + 1)) { memo.set(key, true); return true }
    memo.set(key, false); return false
  }
  return match(0, 0)
}
