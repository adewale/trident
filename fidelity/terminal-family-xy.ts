import { FamilyCanvas, expectedFact, familyChecks, familyTitle, same, setFamilyCheck } from './terminal-family-canvas.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
type Tick = { p: number; value: number }
function linear(ticks: Tick[]) { if (ticks.length < 2 || new Set(ticks.map(t => t.value)).size < 2) return; const a = ticks[0]!, b = ticks.at(-1)!, slope = (b.value - a.value) / (b.p - a.p); if (!Number.isFinite(slope) || !slope || ticks.some(t => Math.abs(a.value + (t.p - a.p) * slope - t.value) > Math.abs(slope) * 1.01)) return; return { value: (p: number) => a.value + (p - a.p) * slope, quantum: Math.abs(slope) } }
export function inspectTerminalXY(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) return checks
  familyTitle(canvas, checks)
  const expected = expectedFact<any>(contract, 'xy-series'), axes = canvas.grid.map((row, y) => ({ text: row.join(''), y })).filter(row => /[└┼]┬?[─┬]+/.test(row.text)), axis = axes.at(-1); if (!axis || !canvas.grid.some(row => row.some(c => /[█▄]/.test(c)))) return checks
  const axisX = Math.min(...[axis.text.indexOf('└'), axis.text.indexOf('┼')].filter(x => x >= 0)), right = axis.text.trimEnd().length - 1, numericRows = canvas.grid.map((row, y) => ({ text: row.join(''), y })).filter(row => /^\s*-?\d+(?:\.\d+)?[ │┤┼]/.test(row.text) && row.y <= axis.y), verticalTicks = numericRows.map(row => ({ p: row.y, value: Number(/^\s*(-?\d+(?:\.\d+)?)/.exec(row.text)![1]) })), orientation = verticalTicks.length >= 2 ? 'vertical' : 'horizontal'
  const actual: any = { horizontal: orientation === 'horizontal', categories: [], series: [] }; let good = expected.series.length === 1 && expected.series[0].kind === 'bar' && expected.horizontal === actual.horizontal
  const intervals: { low: number; high: number }[] = []
  if (orientation === 'vertical') {
    const scale = linear(verticalTicks); if (!scale) return checks
    const xColumns = Array.from({ length: right - axisX }, (_, i) => axisX + i + 1).filter(x => canvas.grid.slice(0, axis.y).some(row => /[█▄]/.test(row[x] ?? ''))), bands: number[][] = []
    for (const x of xColumns) { if (bands.length && x === bands.at(-1)!.at(-1)! + 1) bands.at(-1)!.push(x); else bands.push([x]) }
    const categoryRow = canvas.grid[axis.y + 1]?.join('') ?? '', labels = [...categoryRow.matchAll(/\S+/g)].map(m => ({ label: m[0], center: m.index! + (m[0].length - 1) / 2 })); actual.categories = labels.map(l => l.label)
    if (labels.length !== bands.length || bands.some((band, i) => Math.abs((band[0]! + band.at(-1)!) / 2 - (labels[i]?.center ?? -100)) > 1)) good = false
    for (const band of bands) {
      const tops = band.map(x => { const y = canvas.grid.findIndex(row => /[█▄]/.test(row[x] ?? '')); return y }), top = tops[0]!, value = scale.value(top), half = .5
      if (!tops.every(y => y === top)) good = false
      const last = Math.max(...canvas.grid.map((row, y) => band.some(x => /[█▄]/.test(row[x] ?? '')) ? y : -1))
      for (let y = Math.floor(top); y <= last; y++) for (const x of band) if (!/[█▄]/.test(canvas.cell(x, y)) || y > Math.floor(top) && canvas.cell(x, y) !== '█') good = false
      if (Math.abs(scale.value(last)) > scale.quantum * 1.1) good = false
      intervals.push({ low: value - scale.quantum * half - 1e-9, high: value + scale.quantum * half + 1e-9 })
    }
    canvas.claimRow(axis.y + 1)
    for (let y = 0; y <= axis.y; y++) for (let x = 0; x < canvas.grid[y]!.length; x++) if (/^[\s│┤┼┬└─·█▄\d.\-]$/.test(canvas.cell(x, y))) canvas.claim(x, y)
  } else {
    const tickColumns = [...axis.text.matchAll(/┬/g)].map(m => m.index!), labels = [...(canvas.grid[axis.y + 1]?.join('') ?? '').matchAll(/-?\d+(?:\.\d+)?/g)].map(m => ({ value: Number(m[0]), p: m.index! + (m[0].length - 1) / 2 }))
    if (tickColumns.length !== labels.length || labels.some((label, i) => Math.abs(label.p - tickColumns[i]!) > 1)) return checks
    const scale = linear(labels.map((label, i) => ({ value: label.value, p: tickColumns[i]! }))); if (!scale) return checks
    const barRows = canvas.grid.map((row, y) => ({ row, y })).filter(({ row }) => row.includes('█'))
    for (const { row, y } of barRows) {
      const start = row.indexOf('█'), last = row.lastIndexOf('█'), text = row.slice(0, axisX).join('').trim()
      if (start !== axisX + 1 || row.slice(start, last + 1).some(c => c !== '█') || Math.abs(scale.value(start)) > scale.quantum) good = false
      if (expected.categories.length) actual.categories.push(text)
      else if (text !== String(intervals.length + 1)) good = false
      const value = scale.value(last); intervals.push({ low: value - scale.quantum * .5 - 1e-9, high: value + scale.quantum * .5 + 1e-9 }); canvas.claimRow(y)
    }
    for (let y = 0; y <= axis.y; y++) if (/^[ │·─┼┬└]*$/.test(canvas.row(y))) canvas.claimRow(y)
    canvas.claimRow(axis.y + 1)
  }
  actual.series = [{ kind: 'bar', valueIntervals: intervals }]
  const values = expected.series[0]?.values ?? []
  good &&= same(actual.categories, expected.categories) && intervals.length === values.length && intervals.every((interval, i) => values[i] >= interval.low && values[i] <= interval.high) && !canvas.leftovers()
  setFamilyCheck(checks, 'xy-series', good ? 'passed' : 'failed', 'Continuous bars own category ticks and orientation; independent numeric axis calibration bounds each value by the displayed cell quantum', actual)
  return checks
}
