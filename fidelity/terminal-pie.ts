import { interpretTerminal, terminalTextWidth } from './terminal-display.ts'
import { normalizedTerminalText } from './terminal-text.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
const glyphs = '█▓▒░▚▞▄▀▉▊▋▌▍▎▏'
const fractions: Record<string, number> = { '▉': .875, '▊': .75, '▋': .625, '▌': .5, '▍': .375, '▎': .25, '▏': .125 }
/** An actual stacked strip plus a glyph-owned bar/percentage legend. Labels
 * may be complete on the plot and abbreviated in the legend; their independent
 * geometry and percentages must bind the two before consulting source facts. */
export function inspectTerminalStackedPie(output: string, contract: TerminalSourceContract): TerminalFactCheck[] | undefined {
  const display = interpretTerminal(output); if (display.status !== 'available') return undefined
  const rows = display.text.split('\n').map((text, y) => ({ text: text.trimEnd(), y })).filter(r => r.text.trim())
  const legendRow = new RegExp('^\\s*(.+?)┃([' + glyphs + ']+)\\s+(\\d+(?:\\.\\d+)?)%$'), stripRow = new RegExp('^\\s*[' + glyphs + ']+$')
  const legend = rows.flatMap(row => { const m = legendRow.exec(row.text); if (!m) return []; const symbols = [...m[2]!]; if (new Set(symbols).size !== 1) return []; const glyph = symbols[0]!, quantum = fractions[glyph] ?? 1; return [{ ...row, label: normalizedTerminalText(m[1]!), glyph, units: symbols.length * quantum, quantum, percent: Number(m[3]), precision: m[3]!.split('.')[1]?.length ?? 0 }] })
  if (!legend.length || legend.length > 32 || new Set(legend.map(r => r.glyph)).size !== legend.length || new Set(legend.map(r => r.label)).size !== legend.length) return undefined
  const strip = rows.filter(r => stripRow.test(r.text)); if (strip.length !== 1 || strip[0]!.y >= legend[0]!.y) return undefined
  const plot = strip[0]!, cells = display.cells[plot.y]!, segments = legend.map(() => ({ start: Infinity, end: -Infinity, units: 0 })); let previous = -1, total = 0
  for (let x = 0; x < cells.length; x++) { const glyph = cells[x]!; if (glyph === ' ') continue; const at = legend.findIndex(row => row.glyph === glyph); if (at < previous || at < 0) return undefined; const segment = segments[at]!; segment.start = Math.min(segment.start, x); segment.end = x; segment.units += fractions[glyph] ?? 1; total += fractions[glyph] ?? 1; previous = at }
  const between = rows.filter(r => r.y > plot.y && r.y < legend[0]!.y); if (between.length !== 1) return undefined
  const captions = between[0]!, seen = new Set<number>()
  for (const token of captions.text.matchAll(/\S(?:.*?\S)?(?= {2,}|$)/g)) {
    const m = /^(.*?)\s*(\d+(?:\.\d+)?)%$/.exec(token[0]); if (!m) return undefined
    const label = normalizedTerminalText(m[1]!), percent = Number(m[2]), precision = m[2]!.split('.')[1]?.length ?? 0, centre = terminalTextWidth(captions.text.slice(0, token.index!)) + (terminalTextWidth(token[0]) - 1) / 2
    const owners = legend.map((row, at) => ({ row, at })).filter(({ row, at }) => centre >= segments[at]!.start && centre <= segments[at]!.end && Math.abs(percent - row.percent) <= .5 * 10 ** -precision + .5 * 10 ** -row.precision + 1e-8 && (!label || label === row.label || label.startsWith(row.label + ' ')))
    if (owners.length !== 1 || seen.has(owners[0]!.at)) return undefined
    const { row, at } = owners[0]!; if (label.length > row.label.length) row.label = label; seen.add(at)
  }
  const other = rows.filter(r => r.y !== plot.y && r.y !== captions.y && !legend.some(l => l.y === r.y)); if (other.length > 1 || other.some(r => r.y > plot.y)) return undefined
  const actualTitle = other[0]?.text.trim(), checks: TerminalFactCheck[] = contract.facts.filter(f => f.required !== false).map(f => ({ criterion: f.criterion, expected: f.expected, status: 'unknown', detail: 'Stacked strip projection does not inspect this obligation' }))
  const title = checks.find(c => c.criterion === 'title'); if (title) Object.assign(title, { status: actualTitle === title.expected ? 'passed' : 'failed', detail: 'Complete strip/legend grammar owns every nonblank row and its optional title', actual: actualTitle ?? null })
  const values = checks.find(c => c.criterion === 'slice-values'); if (!values) return checks
  const expected = values.expected as { label: string; value: number }[], sum = expected.reduce((n, s) => n + s.value, 0), labels = legend.length === expected.length && legend.every(row => expected.filter(s => s.label === row.label).length === 1)
  let lower = 0, upper = Infinity, cumulative = 0, painted = 0, valid = labels && sum > 0
  if (labels) for (let n = 0; n < legend.length; n++) { const row = legend[n]!, wanted = expected.find(s => s.label === row.label)!, value = wanted.value; if (!(value > 0)) { valid = false; continue }; lower = Math.max(lower, row.units === row.quantum ? 0 : (row.units - row.quantum / 2) / value); upper = Math.min(upper, (row.units + row.quantum / 2) / value); cumulative += value; painted += segments[n]!.units; if (Math.abs(painted - total * cumulative / sum) > 1 + 1e-8 || Math.abs(row.percent - 100 * value / sum) > .5 * 10 ** -row.precision + 1e-8) valid = false }
  valid &&= lower <= upper
  const unresolved = valid && new Set(expected.map(s => s.value)).size > 1 && new Set(legend.map(row => row.units)).size === 1
  Object.assign(values, { status: unresolved ? 'unknown' : valid ? 'passed' : 'failed', detail: 'Unique glyph-owned legend bars share one feasible displayed-quantum scale; plot cumulative boundaries retain proportions within one display cell and owned percentages retain their printed precision', actual: { legend, segments, total } })
  return checks
}
