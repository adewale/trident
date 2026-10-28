export type RankDirection = 'ascending' | 'descending'

/** Missing measurements stay distinct from observed zero, including numeric strings. */
export function measurementNumber(value: unknown): number | null {
  const number = typeof value === 'number' ? value
    : typeof value === 'string' && /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) ? Number(value) : NaN
  return Number.isFinite(number) ? number : null
}

/** One ordering and tie rule for every comparable result publisher. */
export function rankResults<T>(rows: readonly T[], options: { score: (row: T) => number | null; direction: RankDirection; name: (row: T) => string }) {
  const ranked = rows.map(row => ({ row, score: measurementNumber(options.score(row)), rank: null as number | null }))
    .sort((a, b) => a.score === null ? b.score === null ? options.name(a.row).localeCompare(options.name(b.row)) : 1
      : b.score === null ? -1 : (options.direction === 'ascending' ? a.score - b.score : b.score - a.score) || options.name(a.row).localeCompare(options.name(b.row)))
  let previous: number | null = null, rank = 0
  ranked.forEach((entry, index) => {
    if (entry.score !== null) { if (entry.score !== previous) rank = index + 1; entry.rank = rank; previous = entry.score }
  })
  return ranked
}
