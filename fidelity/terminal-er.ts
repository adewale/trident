import { terminalErAttributeValue, type TerminalErAttribute as Attribute } from './terminal-er-values.ts'
export { terminalErSourceAttribute } from './terminal-er-values.ts'
import { terminalAuthoredLinesObserved } from './terminal-text.ts'
import { interpretTerminal } from './terminal-display.ts'
import { terminalRectangles, type TerminalRectangle } from './terminal-rectangles.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
export interface TerminalEntity extends TerminalRectangle { id: string; attributes: Attribute[] }
const keys = (raw: string) => raw ? /^(?:PK|FK|UK)(?:\s*[,/]\s*(?:PK|FK|UK))*$/.test(raw) ? raw.split(/\s*[,/]\s*/).sort() : undefined : []
function observedAttribute(raw: string): Attribute | undefined {
  if (/[│|]/.test(raw)) {
    const fields = raw.split(/[│|]/).map(field => field.trim())
    if (fields.length < 2 || fields.length > 4 || !fields[0] || !fields[1]) return
    const tags = keys(fields[2] ?? ''); if (!tags) return
    return terminalErAttributeValue(fields[0], fields[1], tags, fields[3] || undefined)
  }
  const candidates: Attribute[] = [], plain = /^(\S+)\s+(\S+)$/.exec(raw), prefix = /^((?:PK|FK|UK)(?:\s*[,/]\s*(?:PK|FK|UK))*)\s+(\S+)\s+(\S+)$/.exec(raw), suffix = /^(\S+)\s+(\S+)\s+((?:PK|FK|UK)(?:\s*[,/]\s*(?:PK|FK|UK))*)$/.exec(raw)
  if (plain) candidates.push(terminalErAttributeValue(plain[1]!, plain[2]!, []))
  if (prefix) candidates.push(terminalErAttributeValue(prefix[2]!, prefix[3]!, keys(prefix[1]!)!))
  if (suffix) candidates.push(terminalErAttributeValue(suffix[1]!, suffix[2]!, keys(suffix[3]!)!))
  const unique = [...new Map(candidates.map(item => [JSON.stringify(item), item])).values()]
  return unique.length === 1 ? unique[0] : undefined
}
/** Header compartments and field rows are observed before matching source
 * expectations. Candidate output cannot choose field roles from expected names. */
export function inspectTerminalEr(output: string, contract: TerminalSourceContract): { checks: TerminalFactCheck[]; entities: TerminalEntity[] } {
  const checks = contract.facts.filter(fact => fact.required !== false).map(fact => ({ criterion: fact.criterion, expected: fact.expected, status: 'unknown' as TerminalFactCheck['status'], detail: 'ER representation has no qualified projection' })), entities: TerminalEntity[] = []
  const result = () => ({ checks, entities }), set = (criterion: string, status: TerminalFactCheck['status'], detail: string, actual?: unknown) => { const target = checks.find(check => check.criterion === criterion); if (target) Object.assign(target, { status, detail, ...(actual === undefined ? {} : { actual }) }) }
  const display = interpretTerminal(output)
  if (display.status !== 'available') { for (const check of checks) check.detail = display.reason!; return result() }
  const grid = display.cells, expected = contract.facts.find(fact => fact.criterion === 'entity-bodies')?.expected as { id: string; attributes: string[]; attributeFacts?: Attribute[] }[] | undefined
  if (!expected?.length || expected.length > 32 || grid.length > 256 || grid.some(row => row.length > 512) || [...display.text].filter(glyph => /[┌╭+]/.test(glyph)).length > 64) return result()
  const boxes = terminalRectangles(grid)
  if (!boxes.length) return result()
  for (const box of boxes) {
    const rows = grid.slice(box.y + 1, box.bottom).map(row => row.slice(box.x + 1, box.right).join('').trim()), divider = rows.findIndex(row => /^[─┬┴┼+\-]+$/.test(row)), header = (divider < 0 ? rows : rows.slice(0, divider)).filter(Boolean), body = divider < 0 ? [] : rows.slice(divider + 1).filter(row => row && !/^[─┬┴┼+\-]+$/.test(row))
    if (header.length !== 1 || /[│|┌┐└┘├┤┬┴┼]/.test(header[0]!)) return result()
    const attributes = body.map(observedAttribute)
    if (attributes.some(attribute => !attribute)) return result()
    entities.push({ ...box, id: header[0]!.normalize('NFC'), attributes: attributes as Attribute[] })
  }
  if (new Set(entities.map(entity => entity.id)).size !== entities.length) return result()
  const wanted = expected.map(entity => ({ id: entity.id.normalize('NFC'), attributes: entity.attributeFacts ?? [] }))
  if (expected.some(entity => !entity.attributeFacts || entity.attributeFacts.length !== entity.attributes.length)) return result()
  const canonical = (items: { id: string; attributes: (Attribute | undefined)[] }[]) => items.map(entity => JSON.stringify([entity.id, entity.attributes.map(attribute => JSON.stringify(attribute)).sort()])).sort()
  const wantedIds = new Set(wanted.map(entity => entity.id))
  if (entities.some(entity => !wantedIds.has(entity.id)) && wanted.every(entity => entities.some(actual => actual.id === entity.id))) { set('entity-bodies', 'unknown', 'Additional entity or legend containers have no qualified semantic ownership'); return result() }
  const equal = JSON.stringify(canonical(entities)) === JSON.stringify(canonical(wanted))
  const styledKeyAmbiguity = !equal && /\x1b\[[\d;:]*m/.test(output) && wanted.every(entity => { const actual = entities.find(item => item.id === entity.id); const withoutKeys = (attrs: Attribute[]) => attrs.map(({ keys: _keys, ...attribute }) => JSON.stringify(attribute)).sort(); return actual && JSON.stringify(withoutKeys(actual.attributes)) === JSON.stringify(withoutKeys(entity.attributes)) })
  set('entity-bodies', styledKeyAmbiguity ? 'unknown' : equal ? 'passed' : 'failed', 'Exact entity identities and attribute type/name/key/comment multisets, with independently observed table columns or unambiguous inline key placement; field order is not scored', entities.map(({ id, attributes }) => ({ id, attributes })))
  const relations = contract.facts.find(fact => fact.criterion === 'entity-relations')?.expected as { source: string; target: string; sourceCardinality: string; targetCardinality: string; identifying: boolean; caption: string }[] | undefined
  if (relations && equal) {
    const inside = (x: number, y: number) => entities.some(entity => x >= entity.x && x <= entity.right && y >= entity.y && y <= entity.bottom), outside = grid.some((row, y) => row.some((glyph, x) => glyph.trim() && !inside(x, y)))
    if (!outside) set('entity-relations', relations.length ? 'failed' : 'passed', relations.length ? 'No relationship ink is present outside the exact entity tables' : 'The complete entity table has no outside ink and source declares no relationships', [])
    else {
      // A deliberately explicit second representation: vertically stacked
      // entities joined by one continuous straight link, with adjacent numeric
      // cardinalities at both ends and owned caption rows between them.
      const ordered = [...entities].sort((a, b) => a.y - b.y), used = new Set<string>(), coordinate = (x: number, y: number) => x + ',' + y, actual: { source: string; target: string; sourceRange: string; targetRange: string; identifying: boolean; caption: string[] }[] = []
      const numeric = new Set(['1', '0..1', '0..*', '1..*']), solid = /^[│|]$/, dashed = /^[┆┊╎╏]$/
      let qualified = ordered.length > 1 && ordered.every((entity, n) => !n || entity.y > ordered[n - 1]!.bottom)
      for (let n = 0; qualified && n < ordered.length - 1; n++) {
        const upper = ordered[n]!, lower = ordered[n + 1]!, top = upper.bottom + 1, bottom = lower.y - 1
        if (bottom - top < 2) { qualified = false; break }
        const columns = Array.from({ length: Math.max(0, Math.min(upper.right, lower.right) - Math.max(upper.x, lower.x) - 1) }, (_, col) => Math.max(upper.x, lower.x) + col + 1).filter(x => Array.from({ length: bottom - top + 1 }, (_, offset) => top + offset).every(y => solid.test(grid[y]?.[x] ?? '') || dashed.test(grid[y]?.[x] ?? '')))
        if (columns.length !== 1) { qualified = false; break }
        const x = columns[0]!, fields: string[] = [], strokes: string[] = []
        for (let y = top; y <= bottom; y++) {
          const row = grid[y]!, field = row.slice(x + 1).join('').trim(), firstInk = row.findIndex((glyph, col) => col > x && glyph.trim())
          if (row.slice(0, x).some(glyph => glyph.trim()) || firstInk > x + 2) { qualified = false; break }
          fields.push(field); strokes.push(row[x]!); for (let col = x; col < row.length; col++) used.add(coordinate(col, y))
        }
        const sourceRange = fields[0]!, targetRange = fields.at(-1)!, caption = fields.slice(1, -1).filter(Boolean), identifying = strokes.every(glyph => solid.test(glyph))
        if (!qualified || !numeric.has(sourceRange) || !numeric.has(targetRange) || !identifying && !strokes.every(glyph => dashed.test(glyph))) { qualified = false; break }
        actual.push({ source: upper.id, target: lower.id, sourceRange, targetRange, identifying, caption })
      }
      const unexplained = grid.some((row, y) => row.some((glyph, x) => glyph.trim() && !inside(x, y) && !used.has(coordinate(x, y))))
      if (qualified && !unexplained) {
        const range = (value: string) => ({ '||': '1', 'o|': '0..1', '|o': '0..1', '}o': '0..*', 'o{': '0..*', '}|': '1..*', '|{': '1..*' } as Record<string, string>)[value]
        const desired = relations.map(edge => ({ source: edge.source, target: edge.target, sourceRange: range(edge.sourceCardinality), targetRange: range(edge.targetCardinality), identifying: edge.identifying, caption: edge.caption ? edge.caption.split('\n') : [] }))
        const canonical = (rows: typeof actual) => rows.map(edge => JSON.stringify(edge.source < edge.target ? [edge.source, edge.target, edge.sourceRange, edge.targetRange, edge.identifying] : [edge.target, edge.source, edge.targetRange, edge.sourceRange, edge.identifying])).sort()
        if (desired.every(edge => edge.sourceRange && edge.targetRange)) {
          const topology = JSON.stringify(canonical(actual)) === JSON.stringify(canonical(desired as typeof actual)), labels = topology ? actual.map(edge => { const matches = desired.filter(want => canonical([edge])[0] === canonical([want as typeof actual[number]])[0]); return matches.length === 1 ? terminalAuthoredLinesObserved(edge.caption, matches[0]!.caption) : undefined }) : []
          set('entity-relations', !topology || labels.some(value => value === false) ? 'failed' : labels.some(value => value === undefined) ? 'unknown' : 'passed', 'Actual straight link endpoints own adjacent numeric cardinalities, complete captions and solid/dashed identifying status; source edges never choose a route', actual)

        }
      }
    }
  }
  return result()
}

/** A source-only diagnostic bound for the straight-link projection. It never
 * supplies output facts or removes other ER sources from the population. */
export function terminalErSourceObservable(contract: TerminalSourceContract) {
  const entities = contract.facts.find(fact => fact.criterion === 'entity-bodies')?.expected as { id: string; attributes: string[]; attributeFacts?: Attribute[] }[] | undefined
  const relations = contract.facts.find(fact => fact.criterion === 'entity-relations')?.expected as { source: string; target: string; sourceCardinality: string; targetCardinality: string }[] | undefined
  if (!entities?.length || entities.length > 32 || !relations || entities.some(entity => !entity.attributeFacts || entity.attributeFacts.length !== entity.attributes.length)) return false
  if (!relations.length) return true
  const degree = new Map(entities.map(entity => [entity.id, 0])), adjacent = new Map(entities.map(entity => [entity.id, [] as string[]])), card = new Set(['||', 'o|', '|o', '}o', 'o{', '}|', '|{'])
  if (relations.length !== entities.length - 1) return false
  for (const edge of relations) {
    if (edge.source === edge.target || !degree.has(edge.source) || !degree.has(edge.target) || !card.has(edge.sourceCardinality) || !card.has(edge.targetCardinality)) return false
    degree.set(edge.source, degree.get(edge.source)! + 1); degree.set(edge.target, degree.get(edge.target)! + 1); adjacent.get(edge.source)!.push(edge.target); adjacent.get(edge.target)!.push(edge.source)
  }
  const seen = new Set<string>(), pending = [entities[0]!.id]
  while (pending.length) { const id = pending.pop()!; if (seen.has(id)) continue; seen.add(id); pending.push(...adjacent.get(id)!) }
  return seen.size === entities.length && [...degree.values()].every(count => count <= 2)
}
