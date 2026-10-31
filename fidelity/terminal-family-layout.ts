import { FamilyCanvas, contains, expectedFact, familyChecks, same, setFamilyCheck } from './terminal-family-canvas.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
export function inspectTerminalBlock(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) return checks
  const expected = expectedFact<any>(contract, 'block-layout'), groupBoxes = canvas.boxes.filter(box => canvas.boxes.some(child => contains(box, child))), nodes = canvas.boxes.filter(box => !groupBoxes.includes(box)); if (!nodes.length) return checks
  const actual: any[] = [], actualGroups: any[] = [], ids = new Map<any, string>(); let changed = false
  for (const box of groupBoxes) { const label = box.lines.find(Boolean), group = expected.groups.find((g: any) => g.id === label); if (!group) { changed = true; continue }; ids.set(box, group.id); canvas.claimBorder(box); const first = Math.min(...nodes.filter(child => contains(box, child)).map(child => child.y)); for (let y = box.y + 1; y < first; y++) for (let x = box.x + 1; x < box.right; x++) canvas.claim(x, y) }
  for (const box of nodes) {
    const database = box.rounded && /^╰─+╯$/.test(box.lines[0] ?? ''), label = box.lines.filter(line => line && !/^╰─+╯$/.test(line)).join(' '), matches = expected.nodes.filter((node: any) => node.label === label), parent = groupBoxes.filter(group => contains(group, box)).sort((a, b) => a.right - a.x - b.right + b.x)[0]
    if (matches.length !== 1) { changed = true; continue }
    ids.set(box, matches[0].id); actual.push({ id: matches[0].id, label, shape: database ? 'database' : 'rectangle', group: parent ? ids.get(parent) ?? 'unassigned' : null, box }); canvas.claimBox(box)
  }
  if (changed || actual.length !== expected.nodes.length) { setFamilyCheck(checks, 'block-layout', 'failed', 'A block container has a changed or missing exact label', actual.map(({ box, ...node }) => node)); return checks }
  let uncertain = false, failed = false
  for (const column of expected.columns) {
    const scopeBox = column.scope ? groupBoxes.find(box => ids.get(box) === column.scope) : undefined, elements = [...actual.filter(node => node.group === column.scope).map(node => ({ ...node, kind: 'node' })), ...groupBoxes.filter(box => { const parent = groupBoxes.filter(group => contains(group, box)).sort((a, b) => a.right - a.x - b.right + b.x)[0]; return (parent ? ids.get(parent) : null) === column.scope }).map(box => ({ id: ids.get(box), box, kind: 'group' }))], rows = new Map<number, typeof elements>()
    for (const element of elements) { const row = rows.get(element.box.y) ?? []; row.push(element); rows.set(element.box.y, row) }
    for (const row of rows.values()) row.sort((a, b) => a.box.x - b.box.x)
    const basis = [...rows.values()].sort((a, b) => b.length - a.length)[0]
    if (!basis || basis.length !== column.columns || basis.some(item => (item.kind === 'node' ? expected.nodes : expected.groups).find((n: any) => n.id === item.id)?.span !== 1)) { uncertain = true; continue }
    for (const row of rows.values()) for (const item of row) {
      const start = basis.findIndex(base => Math.abs(base.box.x - item.box.x) <= 1), last = basis.findIndex(base => Math.abs(base.box.right - item.box.right) <= 1), span = last - start + 1, required = (item.kind === 'node' ? expected.nodes : expected.groups).find((node: any) => node.id === item.id)
      if (start < 0 || last < start || span !== required.span) failed = true
      if (item.kind === 'node') (actual.find(node => node.id === item.id)!).span = span
      else actualGroups.push({ id: item.id, parent: column.scope, span })
    }
    if (scopeBox && basis.some(item => !contains(scopeBox, item.box))) failed = true
  }
  const actualNodes = actual.map(({ box, ...node }) => node)
  if (failed) setFamilyCheck(checks, 'block-layout', 'failed', 'Block walls do not align to the independently occupied unit columns and declared spans', actualNodes)
  else if (uncertain) setFamilyCheck(checks, 'block-layout', 'unknown', 'Underfilled or uniformly spanned rows do not expose the declared column capacity; the source keeps this obligation', actualNodes)
  else {
    const rows = [...actual].sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x)
    const canonical = (items: any[]) => items.map(item => [item.id, item.label, item.shape, item.span, item.group])
    const good = same(canonical(rows), canonical(expected.nodes)) && same(actualGroups, expected.groups) && !canvas.leftovers()
    setFamilyCheck(checks, 'block-layout', good ? 'passed' : 'failed', 'Dense unit rows establish column capacity; every node/group owns exact aligned column spans, primitive and enclosure', actualNodes)
  }
  return checks
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
