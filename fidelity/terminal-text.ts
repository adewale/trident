export const normalizedTerminalText = (value: string) => value.replace(/\s+/g, ' ').trim().normalize('NFC')
/** Soft wrapping can add rows within an authored line. A hard authored break
 * must still separate two runs of actual display rows. */
export function terminalAuthoredLinesObserved(rows: readonly string[], wanted: readonly string[]) {
  if (wanted.some(line => !normalizedTerminalText(line))) return undefined // Blank rows need a padding projection.
  const memo = new Map<string, boolean>()
  const match = (row: number, at: number): boolean => {
    if (at === wanted.length) return row === rows.length
    const key = row + ',' + at
    if (memo.has(key)) return memo.get(key)!
    for (let end = row + 1; end <= rows.length; end++) if (normalizedTerminalText(rows.slice(row, end).join(' ')) === normalizedTerminalText(wanted[at]!) && match(end, at + 1)) { memo.set(key, true); return true }
    memo.set(key, false); return false
  }
  return match(0, 0)
}
