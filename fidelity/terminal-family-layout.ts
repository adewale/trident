import { FamilyCanvas, contains, expectedFact, familyChecks, same, setFamilyCheck } from './terminal-family-canvas.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
export function inspectTerminalBlock(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) return checks
  const expected = expectedFact<any>(contract, 'block-layout'), groupBoxes = canvas.boxes.filter(box => canvas.boxes.some(child => contains(box, child))), nodes = canvas.boxes.filter(box => !groupBoxes.includes(box)); if (!nodes.length) return checks
  const actual: any[] = [], ids = new Map<any, string>(); let changed = false
  for (const box of groupBoxes) { const label = box.lines.find(Boolean), group = expected.groups.find((g: any) => g.id === label); if (!group) { changed = true; continue }; ids.set(box, group.id); canvas.claimBorder(box); const first = Math.min(...nodes.filter(child => contains(box, child)).map(child => child.y)); for (let y = box.y + 1; y < first; y++) for (let x = box.x + 1; x < box.right; x++) canvas.claim(x, y) }
  for (const box of nodes) {
    const database = box.rounded && /^╰─+╯$/.test(box.lines[0] ?? ''), label = box.lines.filter(line => line && !/^╰─+╯$/.test(line)).join(' '), matches = expected.nodes.filter((node: any) => node.label === label), parent = groupBoxes.filter(group => contains(group, box)).sort((a, b) => a.right - a.x - b.right + b.x)[0]
    if (matches.length !== 1) { changed = true; continue }
    ids.set(box, matches[0].id); actual.push({ id: matches[0].id, label, shape: database ? 'database' : 'rectangle', group: parent ? ids.get(parent) ?? 'unassigned' : null, box }); canvas.claimBox(box)
  }
  if (changed || actual.length !== expected.nodes.length) { setFamilyCheck(checks, 'block-layout', 'failed', 'A block container has a changed or missing exact label', actual.map(({ box, ...node }) => node)); return checks }
  const projection = projectTerminalBlockLayout(expected)
  if (!projection) { setFamilyCheck(checks, 'block-layout', 'unknown', 'The source grid contains an unsupported empty/interleaved scope or invalid capacity/span'); return checks }
  let failed = false
  const observedGroups = groupBoxes.map(box => {
    const parent = groupBoxes.filter(group => contains(group, box)).sort((a, b) => a.right - a.x - b.right + b.x)[0]
    return { id: ids.get(box)!, parent: parent ? ids.get(parent)! : null, box }
  })
  for (const scope of projection) {
    const elements = scope.items.map(item => ({ ...item, box: item.kind === 'node' ? actual.find(node => node.id === item.id)?.box : observedGroups.find(group => group.id === item.id)?.box }))
    if (elements.some(item => !item.box)) { failed = true; continue }
    for (const a of elements) for (const b of elements) {
      if (a === b) continue
      const left = a.box!, right = b.box!
      // These constraints are projected solely from source slots. Columns may
      // have different physical widths; no cell unit is fitted from the SUT.
      if (a.row === b.row && left.y !== right.y) failed = true
      if (a.row < b.row && left.bottom >= right.y) failed = true
      if (a.start === b.start && Math.abs(left.x - right.x) > 1) failed = true
      if (a.end === b.end && Math.abs(left.right - right.right) > 1) failed = true
      if (a.start < b.start && left.x >= right.x) failed = true
      if (a.end < b.end && left.right >= right.right) failed = true
      if (a.end <= b.start && left.right >= right.x) failed = true
      if (a.start < b.end && b.start < a.end && (left.right <= right.x || right.right <= left.x)) failed = true
    }
  }
  const observed = actual.map(({ box, ...node }) => ({ ...node, walls: { left: box.x, top: box.y, right: box.right, bottom: box.bottom } }))
  const canonical = (items: any[]) => items.map(item => [item.id, item.label, item.shape, item.group]).sort((a, b) => a[0].localeCompare(b[0]))
  const good = !failed && same(canonical(actual), canonical(expected.nodes)) && same(observedGroups.map(({ box, ...group }) => group).sort((a, b) => a.id.localeCompare(b.id)), expected.groups.map(({ span, ...group }: any) => group).sort((a: any, b: any) => a.id.localeCompare(b.id))) && !canvas.leftovers()
  setFamilyCheck(checks, 'block-layout', good ? 'passed' : 'failed', 'Full source capacities/spans project occupied row order, rational slot intervals, shared boundary alignment and nesting; unused capacity has no visible marks and column widths may vary', observed)

  return checks
}
/** Source-forward occupied grid. Numerators retain literal capacities/spans;
 * an interval [start/columns,end/columns] describes placement, not printed text.
 * Nonempty scope ordering follows the first descendant's source node order. */
export function projectTerminalBlockLayout(expected: any): { scope: string | null; columns: number; items: { id: string; kind: 'node' | 'group'; span: number; row: number; start: number; end: number }[] }[] | undefined {
  const all = [...expected.nodes, ...expected.groups], ids = all.map(item => item.id), scopes = expected.columns.map((column: any) => column.scope)
  if (new Set(ids).size !== ids.length || new Set(scopes).size !== scopes.length) return
  const groups = new Map<string, any>(expected.groups.map((group: any) => [group.id, group]))
  for (const item of all) {
    let parent = 'group' in item ? item.group : item.parent
    const seen = new Set<string>([item.id])
    while (parent !== null) {
      if (!groups.has(parent) || seen.has(parent)) return
      seen.add(parent); parent = groups.get(parent).parent
    }
  }
  if (scopes.some((scope: string | null) => scope !== null && !groups.has(scope))) return
  const descendants = (id: string): number[] => expected.nodes.flatMap((node: any, index: number) => {
    let parent = node.group
    while (parent) { if (parent === id) return [index]; parent = expected.groups.find((group: any) => group.id === parent)?.parent }
    return []
  })
  const projectedScopes = []
  for (const column of expected.columns) {
    if (!Number.isSafeInteger(column.columns) || column.columns < 1) return
    const items = [...expected.nodes.flatMap((node: any, index: number) => node.group === column.scope ? [{ id: node.id, kind: 'node' as const, span: node.span, order: index }] : []), ...expected.groups.filter((group: any) => group.parent === column.scope).map((group: any) => ({ id: group.id, kind: 'group' as const, span: group.span, order: Math.min(...descendants(group.id)) - 0.5 }))].sort((a, b) => a.order - b.order)
    if (items.some(item => !Number.isFinite(item.order) || !Number.isSafeInteger(item.span) || item.span < 1 || item.span > column.columns)) return
    let row = 0, start = 0
    projectedScopes.push({ scope: column.scope, columns: column.columns, items: items.map(({ order, ...item }) => {
      if (start + item.span > column.columns) { row++; start = 0 }
      const placed = { ...item, row, start, end: start + item.span }; start += item.span; return placed
    }) })
  }
  if (projectedScopes.reduce((count, scope) => count + scope.items.length, 0) !== expected.nodes.length + expected.groups.length) return
  return projectedScopes
}
export function inspectTerminalPacket(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) return checks
  const fields: any[] = [], units: number[] = []; let qualified = false
  for (let y = 1; y + 2 < canvas.grid.length; y++) {
    const row = canvas.row(y), start = row.indexOf('╭'), end = row.indexOf('╮'); if (start < 0 || end <= start || !/^[─┬]+$/.test(row.slice(start + 1, end))) continue
    const bottom = y + 2; if (canvas.cell(start, bottom) !== '╰' || canvas.cell(end, bottom) !== '╯') return checks
    const boundaries = [start, ...Array.from({ length: end - start - 1 }, (_, i) => start + i + 1).filter(x => canvas.cell(x, y) === '┬'), end], headings = [...canvas.row(y - 1).matchAll(/\d+/g)].map(match => ({ value: Number(match[0]), x: match.index!, right: match.index! + match[0].length - 1 }))
    if (headings.length !== (boundaries.length - 1) * 2) { setFamilyCheck(checks, 'packet-fields', 'failed', 'Every packet field needs two owned bit endpoint labels'); return checks }
    for (let i = 0; i + 1 < boundaries.length; i++) {
      const x = boundaries[i]!, right = boundaries[i + 1]!, first = headings[i * 2]!, last = headings[i * 2 + 1]!
      if (canvas.cell(x, y + 1) !== '│' || canvas.cell(right, y + 1) !== '│' || (i && canvas.cell(x, bottom) !== '┴') || !/^─+$/.test(canvas.grid[bottom]!.slice(x + 1, right).join(''))) return checks
      if (Math.abs(first.x - x) > 1 || Math.abs(last.right - (right - 1)) > 1 || last.value < first.value) { setFamilyCheck(checks, 'packet-fields', 'failed', 'Bit labels are detached from their field walls'); return checks }
      const label = canvas.grid[y + 1]!.slice(x + 1, right).join('').trim(), bits = last.value - first.value + 1
      units.push((right - x) / bits); fields.push({ firstBit: first.value, lastBit: last.value, label }); qualified = true
    }
    for (let row = y - 1; row <= bottom; row++) canvas.claimRow(row)
    y = bottom
  }
  if (!qualified) return checks
  const width = units[0]!, proportional = units.every(unit => Math.abs(unit - width) < 1e-9), sequential = fields.every((field, i) => !i || field.firstBit === fields[i - 1].lastBit + 1)
  setFamilyCheck(checks, 'packet-fields', same(fields, expectedFact(contract, 'packet-fields')) && proportional && sequential && !canvas.leftovers() ? 'passed' : 'failed', 'Continuous field walls own exact bit endpoints and labels; one cell scale establishes proportional bit widths', fields)
  return checks
}
