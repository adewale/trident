import { interpretTerminal, terminalCellWidth, terminalTextWidth } from './terminal-display.ts'
import { terminalRectangles } from './terminal-rectangles.ts'
import { inspectTerminalMeaning, type TerminalMeaning } from './terminal.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
const generic = (value: string) => value.replace(/~([^~]+)~/g, '<$1>').replace(/\s+/g, ' ').trim().normalize('NFC')
/** Independent field/method spelling projection. Roles follow visible syntax,
 * never a source member name. Colons explicitly reverse name/type display order. */
export function terminalClassMember(raw: string) {
  const text = generic(raw).replace(/^«(.*)»$/, '<<$1>>'), annotation = /^<<(.+)>>$/.exec(text)
  if (annotation) return ['annotation', annotation[1]]
  const method = /^([+~#-]?)\s*([^\s(]+)\(([^)]*)\)\s*:?[ ]*(.*)$/.exec(text)
  if (method) return ['method', method[1], method[2], method[3]!.replace(/\s*,\s*/g, ','), method[4]!.replace(/^\*\s*/, '*')]
  const colon = /^([+~#-]?)\s*([^\s:]+)\s*:\s*(.+)$/.exec(text)
  if (colon) return ['field', colon[1], colon[3], colon[2]]
  const field = /^([+~#-]?)\s*(\S+)\s+(\S+)$/.exec(text)
  if (field) return ['field', field[1], field[2], field[3]]
  const bare = /^([+~#-]?)\s*(\w+)$/.exec(text)
  if (bare) return ['field', bare[1], '', bare[2]]
}
export function inspectTerminalClass(output: string, contract: TerminalSourceContract): TerminalFactCheck[] {
  const checks = contract.facts.filter(fact => fact.required !== false).map(fact => ({ criterion: fact.criterion, expected: fact.expected, status: 'unknown' as TerminalFactCheck['status'], detail: 'Class output has no qualified compartment/relationship projection' }))
  const set = (criterion: string, status: TerminalFactCheck['status'], detail: string, actual?: unknown) => { const row = checks.find(row => row.criterion === criterion); if (row) Object.assign(row, { status, detail, actual }) }
  const display = interpretTerminal(output), expected = contract.facts.find(fact => fact.criterion === 'class-bodies')?.expected as { id: string; members: string[]; genericParameters?: string }[] | undefined
  if (display.status !== 'available' || !expected?.length || expected.length > 128) return checks
  const grid = display.cells, boxes = terminalRectangles(grid, { horizontal: /^[─┬┴┼+\-△]+$/, vertical: /^[│|├┤┼+]$/, ports: true, primitives: true }), actual: { id: string; genericParameters: string; members: unknown[] }[] = []
  for (const box of boxes) {
    const rows = grid.slice(box.y + 1, box.bottom).map(row => row.slice(box.x + 1, box.right).join('').trim()), divider = rows.findIndex(row => /^[─┬┴┼+\-]+$/.test(row)), headers = (divider < 0 ? rows : rows.slice(0, divider)).filter(Boolean), names = headers.filter(row => !/^<<.*>>$|^«.*»$/.test(row))
    if (names.length !== 1) return checks
    const name = /^([\p{Letter}\p{Number}_.-]+)(?:<(.+)>|~(.+)~)?$/u.exec(names[0]!)
    if (!name) return checks
    const members = [...headers.filter(row => row !== names[0]), ...(divider < 0 ? [] : rows.slice(divider + 1).filter(row => row && !/^[─┬┴┼+\-]+$/.test(row)))].map(terminalClassMember)
    if (members.some(member => !member)) return checks
    actual.push({ id: name[1]!, genericParameters: generic(name[2] ?? name[3] ?? ''), members })
  }
  if (new Set(actual.map(item => item.id)).size !== actual.length || !actual.length) return checks
  const canonical = (items: typeof actual) => items.map(item => JSON.stringify([item.id, item.genericParameters, item.members.map(member => JSON.stringify(member)).sort()])).sort()
  const wanted = expected.map(item => ({ id: item.id, genericParameters: generic(item.genericParameters ?? ''), members: item.members.map(terminalClassMember) }))
  if (wanted.some(item => item.members.some(member => !member))) return checks
  set('class-bodies', JSON.stringify(canonical(actual)) === JSON.stringify(canonical(wanted)) ? 'passed' : 'failed', 'Closed class header/member compartments retain exact identities, generic parameters, visibility, field roles, method arguments/return markers and stereotypes', actual)
  // Erase only independently parsed member/header compartments. Outer borders,
  // contacts and all relationship ink retain their original display columns.
  const normalized = grid.map(row => [...row])
  for (const [index, box] of boxes.entries()) {
    for (let y = box.y + 1; y < box.bottom; y++) { for (let x = box.x + 1; x < box.right; x++) normalized[y]![x] = ' '; if (/^[├+]$/.test(normalized[y]![box.x]!)) normalized[y]![box.x] = '│'; if (/^[┤+]$/.test(normalized[y]![box.right]!)) normalized[y]![box.right] = '│' }
    const label = actual[index]!.id; let column = box.x + 1; for (const glyph of label) { normalized[box.y + 1]![column] = glyph; if (terminalCellWidth(glyph) === 2) normalized[box.y + 1]![column + 1] = ''; column += terminalCellWidth(glyph) }
  }
  const relations = contract.facts.find(fact => fact.criterion === 'class-relations')?.expected as { source: string; target: string; marker: string; caption: string; leftCardinality: string; rightCardinality: string }[] | undefined
  if (!relations) return checks
  const cards: { x: number; y: number; width: number; value: string }[] = []
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]!.join('')
    for (const match of row.matchAll(/(?:\d+\.\.(?:\d+|\*)|\d+|\*)/g)) {
      const x = terminalTextWidth(row.slice(0, match.index!)), width = terminalTextWidth(match[0])
      if (boxes.some(box => x >= box.x && x <= box.right && y >= box.y && y <= box.bottom)) continue
      // Restrict this projection to a complete separate numeric token. Digits
      // embedded in a relationship caption retain their caption role.
      if (/[\p{Letter}\p{Number}_]/u.test(row[x - 1] ?? '') || /[\p{Letter}\p{Number}_]/u.test(row[x + width] ?? '')) continue
      cards.push({ x, y, width, value: match[0] }); for (let n = 0; n < width; n++) normalized[y]![x + n] = ' '
    }
  }
  const edges: TerminalMeaning['edges'] = relations.map(edge => edge.marker === '<|--' || edge.marker === 'o--' || edge.marker === '*--' ? { source: edge.target, target: edge.source, label: edge.caption, endMarker: edge.marker === '<|--' ? 'inheritance' : edge.marker === 'o--' ? 'aggregation' : 'composition' } : { source: edge.source, target: edge.target, label: edge.caption, ...(edge.marker === '..>' ? { stroke: 'dotted' } : edge.marker === '--' ? { directed: false } : {}) })
  const verdict = inspectTerminalMeaning(normalized.map(row => row.join('')).join('\n'), { nodes: actual.map(item => ({ id: item.id, label: item.id })), edges }, { primitiveShapes: true })
  if (verdict.status === 'correct') {
    const endpoints = verdict.edges.flatMap((edge, index) => edge.route?.length ? [{ edge: index, end: 'target', point: edge.route[0]! }, { edge: index, end: 'source', point: edge.route.at(-1)! }] : [])
    const assigned = new Map<string, string[]>(), unassigned: string[] = []; let ambiguous = false
    for (const card of cards) {
      const near = endpoints.map(endpoint => ({ ...endpoint, distance: Math.abs(endpoint.point.y - card.y) + Math.max(card.x - endpoint.point.x, 0, endpoint.point.x - card.x - card.width + 1) })).filter(endpoint => endpoint.distance <= 2)
      if (near.length !== 1) { ambiguous = true; unassigned.push(card.value); continue }
      const key = near[0]!.edge + ':' + near[0]!.end; assigned.set(key, [...(assigned.get(key) ?? []), card.value])
    }
    let mismatch = false
    for (const [index, edge] of verdict.edges.entries()) {
      const candidates = relations.filter(want => want.source === edge.source && want.target === edge.target || want.source === edge.target && want.target === edge.source)
      if (candidates.length !== 1) { ambiguous = true; continue }
      const want = candidates[0]!, forward = want.source === edge.source
      for (const [end, desired] of [['source', forward ? want.leftCardinality : want.rightCardinality], ['target', forward ? want.rightCardinality : want.leftCardinality]]) {
        const seen = assigned.get(index + ':' + end) ?? []
        if (seen.length > 1) ambiguous = true
        else if ((seen[0] ?? '') !== desired) {
          // A visible required token outside the bounded ownership radius is
          // unresolved, not proved missing. A uniquely owned wrong value or a
          // value absent from the entire outside-node inventory still fails.
          if (!seen.length && desired && unassigned.includes(desired)) ambiguous = true
          else mismatch = true
        }
      }
    }
    set('class-relations', mismatch ? 'failed' : ambiguous ? 'unknown' : 'passed', 'Traced class endpoints own their marker, stroke, caption and separate numeric cardinality tokens; each token must have one nearby endpoint owner', verdict.edges)
    return checks
  }
  set('class-relations', verdict.status === 'incorrect' ? 'failed' : 'unknown', 'Class relation markers and captions belong to their independently traced endpoints and solid/dotted routes: ' + verdict.reason, verdict.edges)
  return checks
}
export function terminalClassSourceObservable(contract: TerminalSourceContract) {
  const classes = contract.facts.find(fact => fact.criterion === 'class-bodies')?.expected as { id: string; members: string[] }[] | undefined
  return !!classes?.length && classes.length <= 128 && classes.every(item => /^[\p{Letter}\p{Number}_.-]+$/u.test(item.id) && item.members.every(member => terminalClassMember(member)))
}
