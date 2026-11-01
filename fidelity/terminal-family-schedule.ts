import { inspectTerminalGanttAxis } from './terminal-gantt-axis.ts'
import type { TerminalEncodingContext } from './terminal-encoding.ts'
import { FamilyCanvas, expectedFact, familyChecks, familyTitle, same, setFamilyCheck } from './terminal-family-canvas.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
export function inspectTerminalGantt(output: string, contract: TerminalSourceContract, encoding?: TerminalEncodingContext) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) return checks
  familyTitle(canvas, checks)
  const expected = expectedFact<any>(contract, 'gantt-tasks'), rows = canvas.grid.map((row, y) => ({ text: row.join('').trimEnd(), y })), header = rows.find(row => /^Task\s+Start\s+End\s+Timeline$/.test(row.text.trim())); if (!header) { inspectTerminalGanttAxis(canvas, checks, contract, encoding); return checks }
  canvas.claimRow(header.y); let section = '', qualified = false, failed = false, uncertain = false
  const sections: string[] = [], tasks: any[] = [], geometry: { start: number; end: number; left: number; right: number; milestone: boolean }[] = []
  for (const row of rows.filter(row => row.y > header.y)) {
    if (!row.text.trim()) continue
    if (/^[─ ]+$/.test(row.text)) { canvas.claimRow(row.y); continue }
    const heading = /^▼\s+(.+)$/.exec(row.text), task = /^(.*?)\s{2,}(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})(\s+)([█▓░◆]+)(?:\s+\[(.+)\])?$/.exec(row.text)
    if (heading) { section = heading[1]!; sections.push(section); canvas.claimRow(row.y); continue }
    if (!task) return checks
    const label = task[1]!.trim(), matches = expected.tasks.filter((item: any) => item.label === label); if (matches.length !== 1) failed = true
    const source = matches[0], start = Date.parse(task[2] + 'T00:00:00Z'), end = Date.parse(task[3] + 'T00:00:00Z'), glyphs = task[5]!, milestone = glyphs === '◆', left = row.text.indexOf(glyphs), annotations = Object.fromEntries((task[6] ?? '').split(';').filter(Boolean).map(token => token.trim().split('='))), status = milestone ? ['milestone'] : /^█+$/.test(glyphs) ? ['done'] : /^▓+$/.test(glyphs) ? ['active'] : /^░+$/.test(glyphs) ? [] : null
    if (Object.keys(annotations).some(key => !['after', 'duration', 'at'].includes(key))) failed = true
    if (status === null || !Number.isFinite(start) || !Number.isFinite(end) || end < start) failed = true
    const durationDays = milestone ? annotations.duration ? Number(annotations.duration) : null : (end - start) / 86_400_000, after = annotations.after
    if (source?.after && !after || milestone && (durationDays === null || !annotations.at)) uncertain = true
    const actual = { label, section, id: source?.id ?? null, status, startDate: task[2], endDate: milestone && durationDays !== null ? new Date(start + durationDays * 86_400_000).toISOString().slice(0, 10) : task[3], durationDays, ...(milestone && annotations.at ? { milestoneAt: annotations.at } : {}), ...(after ? { after } : {}) }
    // Observable fields can decisively fail while invisible dependency metadata stays unknown.
    if (!source || label !== source.label || section !== source.section || !same(status, source.status) || task[2] !== source.startDate || !milestone && task[3] !== source.endDate) failed = true
    if (milestone && annotations.at && (Date.parse(annotations.at) !== start + (durationDays ?? 0) * 43_200_000)) failed = true
    const drawingStart = milestone && annotations.at ? Date.parse(annotations.at) : start
    tasks.push(actual); geometry.push({ start: drawingStart, end: milestone ? drawingStart : end, left, right: left + glyphs.length, milestone }); canvas.claimRow(row.y); qualified = true
  }
  if (!qualified) return checks
  // Date rows and bar spans are jointly owned. A common linear date scale must
  // explain all ordinary bar positions to one display cell; a printed date-only
  // table or detached bar cannot qualify.
  const ordinary = geometry.filter(row => !row.milestone), origin = Math.min(...geometry.map(row => row.start)), points = ordinary.flatMap(row => [{ day: (row.start - origin) / 86_400_000, x: row.left }, { day: (row.end - origin) / 86_400_000, x: row.right }]), meanDay = points.reduce((sum, point) => sum + point.day, 0) / points.length, meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length, scale = points.reduce((sum, point) => sum + (point.day - meanDay) * (point.x - meanX), 0) / points.reduce((sum, point) => sum + (point.day - meanDay) ** 2, 0), column = meanX - scale * meanDay
  if (!Number.isFinite(scale) || scale <= 0 || geometry.some(row => Math.abs(row.left - (column + (row.start - origin) / 86_400_000 * scale)) > 1.01 || !row.milestone && Math.abs(row.right - (column + (row.end - origin) / 86_400_000 * scale)) > 1.01)) failed = true
  if (!same(sections, expected.sections) || !same(tasks.map(task => task.label), expected.tasks.map((task: any) => task.label)) || tasks.length !== expected.tasks.length || canvas.leftovers()) failed = true
  if (failed) setFamilyCheck(checks, 'gantt-tasks', 'failed', 'Task/date/status rows or their common linear bar geometry differ from the authored schedule', { sections, tasks })
  else if (uncertain) setFamilyCheck(checks, 'gantt-tasks', 'unknown', 'Retained chart omits dependency provenance or a milestone duration/instant; coincident dates cannot prove those facts', { sections, tasks })
  else setFamilyCheck(checks, 'gantt-tasks', same(tasks, expected.tasks) ? 'passed' : 'failed', 'Ordered section/date/status rows own continuous proportional time bars; explicit row annotations retain dependency and milestone semantics', { sections, tasks })
  return checks
}
export function inspectTerminalZenUml(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) return checks
  familyTitle(canvas, checks)
  const actors = expectedFact<any[]>(contract, 'zenuml-actors'), required = expectedFact<any[]>(contract, 'zenuml-calls'), headers = canvas.boxes.filter(box => !canvas.boxes.some(parent => parent !== box && parent.y < box.y && parent.bottom > box.bottom)).sort((a, b) => a.x - b.x)
  if (!headers.length || !headers.every(box => box.y === headers[0]!.y)) return checks
  const observedActors: any[] = [], positions: { id: string; x: number; bottom: number }[] = []
  for (const box of headers) {
    const lines = box.lines.filter(Boolean), role = /^\[(Actor|Control|Database)\]$/.exec(lines[1] ?? ''), match = actors.filter(actor => actor.label === lines[0]); if (!role || lines.length !== 2) return checks
    if (match.length !== 1) { setFamilyCheck(checks, 'zenuml-actors', 'failed', 'A participant header has a missing or changed label'); return checks }
    const x = (box.x + box.right) / 2; if (!Number.isInteger(x)) return checks
    observedActors.push({ id: match[0].id, label: lines[0], role: role[1] }); positions.push({ id: match[0].id, x, bottom: box.bottom }); canvas.claimBox(box)
  }
  setFamilyCheck(checks, 'zenuml-actors', same(observedActors, actors) ? 'passed' : 'failed', 'Independent header compartments retain actor, control and database roles', observedActors)
  const stack: { sender: string; target: string }[] = [], calls: any[] = []; let failed = false, recognized = false
  for (let y = headers[0]!.bottom + 1; y < canvas.grid.length; y++) {
    if (stack.some(call => { const actor = positions.find(actor => actor.id === call.target)!; return canvas.cell(actor.x, y) !== '█' && !/[─┄▶◀]/.test(canvas.cell(actor.x, y)) })) failed = true
    const arrows = canvas.grid[y]!.map((glyph, x) => ({ glyph, x })).filter(item => ['▶', '◀'].includes(item.glyph)); if (!arrows.length) continue
    if (arrows.length !== 1) return checks
    const arrow = arrows[0]!, direction = arrow.glyph === '▶' ? 1 : -1, target = positions.find(actor => actor.x === arrow.x + direction), stem: string[] = []; let x = arrow.x - direction
    while (/[─┄]/.test(canvas.cell(x, y))) { stem.push(canvas.cell(x, y)); x -= direction }
    const sender = positions.find(actor => actor.x === x); if (!sender || !target || !stem.length) { failed = true; continue }
    const caption = canvas.grid[y - 1]!.map((c, x) => positions.some(actor => actor.x === x) ? ' ' : c).join('').trim(), invocation = /^(\w+)\(([^)]*)\)$/.exec(caption), returning = stem.every(g => g === '┄')
    if (returning) { const active = stack.pop(); if (!active || active.sender !== target.id || active.target !== sender.id || caption !== 'return') failed = true }
    else if (!stem.every(g => g === '─') || !invocation || canvas.cell(target.x, y) !== '█') failed = true
    else { if (stack.length && stack.at(-1)!.target !== sender.id) failed = true; calls.push({ sender: sender.id, target: target.id, method: invocation[1], arguments: invocation[2], depth: stack.length }); stack.push({ sender: sender.id, target: target.id }); recognized = true }
    for (let col = Math.min(sender.x, target.x); col <= Math.max(sender.x, target.x); col++) canvas.claim(col, y)
    for (let col = 0; col < canvas.grid[y - 1]!.length; col++) if (!positions.some(actor => actor.x === col)) canvas.claim(col, y - 1)
  }
  const end = canvas.grid.length - 1
  for (const actor of positions) for (let y = actor.bottom + 1; y <= end; y++) {
    if (/[│█├┤┼]/.test(canvas.cell(actor.x, y))) canvas.claim(actor.x, y)
    else if (!canvas.owned.has(`${actor.x},${y}`) && canvas.row(y).trim()) failed = true
  }
  if (recognized) setFamilyCheck(checks, 'zenuml-calls', !failed && same(calls, required) && !canvas.leftovers() ? 'passed' : 'failed', 'Synchronous filled heads, continuous stems/lifelines, recipient activations and explicit returns establish methods, arguments and call-stack depth', calls)
  return checks
}
