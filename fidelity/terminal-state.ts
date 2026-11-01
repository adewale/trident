import { interpretTerminal } from './terminal-display.ts'
import { terminalRectangles } from './terminal-rectangles.ts'
import { inspectTerminalMeaning, type TerminalMeaning } from './terminal.ts'
import { normalizedTerminalText } from './terminal-text.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
const identity = (scope: string[], id: string) => JSON.stringify([scope, id])
export function inspectTerminalState(output: string, contract: TerminalSourceContract): TerminalFactCheck[] {
  const checks = contract.facts.filter(fact => fact.required !== false).map(fact => ({ criterion: fact.criterion, expected: fact.expected, status: 'unknown' as TerminalFactCheck['status'], detail: 'State representation has no qualified scope/route projection' }))
  const set = (criterion: string, status: TerminalFactCheck['status'], detail: string, actual?: unknown) => { const row = checks.find(row => row.criterion === criterion); if (row) Object.assign(row, { status, detail, actual }) }
  const states = contract.facts.find(fact => fact.criterion === 'states')?.expected as { id: string; label: string; scope: string[] }[] | undefined, transitions = contract.facts.find(fact => fact.criterion === 'transitions')?.expected as { source: string; target: string; caption: string; scope: string[] }[] | undefined
  if (!states || !transitions) return checks
  // Aliases map source IDs to independently owned display labels within the
  // same closed lexical scope. Identical labels in one scope are uninspectable.
  if (new Set(states.map(state => identity(state.scope, state.label))).size !== states.length) return checks
  const groupIds = (contract.facts.find(fact => fact.criterion === 'state-enclosures')?.expected as { id: string }[] | undefined)?.map(group => group.id) ?? []
  if (states.some(state => groupIds.includes(state.id) && state.id !== state.label)) return checks
  if (states.every(state => !state.scope.length)) {
    const initial = transitions.some(edge => edge.source === '[*]'), final = transitions.some(edge => edge.target === '[*]'), start = '\0initial', end = '\0final'
    const verdict = inspectTerminalMeaning(output, { nodes: [...states.map(({ id, label }) => ({ id, label })), ...(initial ? [{ id: start, label: '●' }] : []), ...(final ? [{ id: end, label: '◉' }] : [])], edges: transitions.map(edge => ({ source: edge.source === '[*]' ? start : edge.source, target: edge.target === '[*]' ? end : edge.target, ...(edge.caption ? { label: edge.caption } : {}) })) }, { primitiveShapes: true })
    for (const criterion of ['states', 'transitions']) set(criterion, verdict.status === 'correct' ? 'passed' : verdict.status === 'incorrect' && (/node labelled|node inventory|node line breaks/.test(verdict.reason) ? criterion === 'states' : criterion === 'transitions') ? 'failed' : 'unknown', 'Ordinary state containers, explicit initial/final glyphs and continuous self/cross transitions retain owned captions: ' + verdict.reason, verdict.edges)
    // A crossing cannot erase independently owned ordinary-state identities.
    // Initial/final glyphs remain transition obligations, not invented states.
    const display = interpretTerminal(output, { columns: 4096, rows: 2048, inputBytes: 2_000_000 })
    if (display.status === 'available') {
      const boxes = terminalRectangles(display.cells, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true, cornerPorts: true }), ordinary = boxes.map(box => ({ ...box, label: normalizedTerminalText(box.lines.join(' ')) })).filter(box => !/^[●◉]$/.test(box.label))
      const disjoint = boxes.every((box, at) => boxes.every((other, n) => at === n || box.right < other.x || other.right < box.x || box.bottom < other.y || other.bottom < box.y))
      const exactOrdinary = disjoint && ordinary.length === states.length && states.every(state => ordinary.filter(box => box.label === normalizedTerminalText(state.label)).length === 1)
      if (exactOrdinary) set('states', 'passed', 'Exact ordinary-state labels each own one disjoint closed container in the flat scope, independently of transition tracing', ordinary.map(box => ({ label: box.label, scope: [] })))
      const markers = boxes.map(box => normalizedTerminalText(box.lines.join(' '))).filter(label => /^[●◉]$/.test(label))
      if (exactOrdinary && markers.length === Number(initial) + Number(final) && boxes.length === ordinary.length + markers.length && (markers.filter(label => label === '●').length !== Number(initial) || markers.filter(label => label === '◉').length !== Number(final))) set('transitions', 'failed', 'The complete independently closed known-role marker inventory has the wrong initial/final roles; ordinary-state identity credit cannot erase a typed pseudostate defect', markers)
      const chain = framedStateChain(display.cells, boxes)
      if (chain && transitions.every(edge => !edge.scope.length) && !states.some(state => /^[●◉]$/.test(state.label))) {
        const wantedStates = states.map(state => normalizedTerminalText(state.label)).sort(), actualStates = chain.frames.filter(frame => !/^[●◉]$/.test(frame.label)).map(frame => frame.label).sort(), equal = JSON.stringify(wantedStates) === JSON.stringify(actualStates)
        set('states', equal ? 'passed' : 'failed', 'Disjoint complete rails and one continuous side own each single literal state caption; a ragged unused side supplies no port or shape credit', actualStates)
        if (equal) {
          const label = (id: string) => states.find(state => state.id === id)?.label, wanted = transitions.map(edge => [edge.source === '[*]' ? '●' : label(edge.source), edge.target === '[*]' ? '◉' : label(edge.target), edge.caption]), canonical = (items: unknown[][]) => items.map(item => JSON.stringify(item)).sort()
          set('transitions', chain.broken || JSON.stringify(canonical(chain.edges)) !== JSON.stringify(canonical(wanted)) ? 'failed' : 'passed', 'Actual continuous vertical stems and adjacent directed heads meet existing top/bottom rails; missing side cells are never reconstructed or used as endpoints', chain.edges)
        }
      }
    }
    return checks
  }
  const display = interpretTerminal(output)
  if (display.status !== 'available') return checks
  const grid = display.cells, boxes = terminalRectangles(grid, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true })
  const contains = (a: typeof boxes[number], b: typeof boxes[number]) => a !== b && a.x < b.x && a.right > b.right && a.y < b.y && a.bottom > b.bottom
  if (!boxes.length || boxes.length > 128 || boxes.some((a, i) => boxes.some((b, n) => i !== n && Math.max(a.x, b.x) < Math.min(a.right, b.right) && Math.max(a.y, b.y) < Math.min(a.bottom, b.bottom) && !contains(a, b) && !contains(b, a)))) return checks
  const observed = boxes.map(box => {
    const group = boxes.some(child => contains(box, child)), rows = grid.slice(box.y + 1, box.bottom).map(row => row.slice(box.x + 1, box.right).join(''))
    const text = group ? rows.find(row => row.replace(/[─│┬┴┼├┤┌┐└┘╭╮╰╯▲▼◄►▶◀]/g, '').trim())?.replace(/[─│┬┴┼├┤┌┐└┘╭╮╰╯▲▼◄►▶◀]/g, '').trim() : box.lines.join(' ').replace(/\s+/g, ' ').trim()
    return { box, group, label: text?.normalize('NFC') ?? '', scope: [] as string[] }
  })
  if (observed.some(item => !item.label || !/^[\p{Letter}\p{Number}_.-]+$/u.test(item.label))) return checks
  for (const item of observed) item.scope = observed.filter(parent => parent.group && contains(parent.box, item.box)).sort((a, b) => (b.box.right - b.box.x) * (b.box.bottom - b.box.y) - (a.box.right - a.box.x) * (a.box.bottom - a.box.y)).map(parent => parent.label)
  const canonical = (items: { label: string; scope: string[] }[]) => items.map(item => identity(item.scope, item.label)).sort()
  const exact = JSON.stringify(canonical(observed)) === JSON.stringify(canonical(states))
  set('states', exact ? 'passed' : 'failed', 'Each closed state and composite frame owns its label and exact lexical scope; equal labels in different scopes remain distinct obligations', observed.map(({ label, scope }) => ({ label, scope })))
  const groups = contract.facts.find(fact => fact.criterion === 'state-enclosures')?.expected as { id: string; parent: string | null }[] | undefined
  const actualGroups = observed.filter(item => item.group).map(item => ({ id: item.label, parent: item.scope.at(-1) ?? null }))
  if (groups) set('state-enclosures', JSON.stringify(actualGroups.map(item => JSON.stringify(item)).sort()) === JSON.stringify(groups.map(item => JSON.stringify(item)).sort()) ? 'passed' : 'failed', 'Composite parents come from strict closed-frame containment, independently of source transitions', actualGroups)
  if (!exact) return checks
  const normalized = grid.map(row => [...row]), leaves = observed.filter(item => !item.group)
  for (const [n, item] of leaves.entries()) { const { box } = item; for (let y = box.y + 1; y < box.bottom; y++) for (let x = box.x + 1; x < box.right; x++) normalized[y]![x] = ' '; normalized[box.y + 1]![box.x + 1] = String.fromCodePoint(0xe000 + n) }
  const endpoint = (scope: string[], id: string) => identity(scope, states.find(state => state.id === id && JSON.stringify(state.scope) === JSON.stringify(scope))?.label ?? id)
  const graph: TerminalMeaning = { nodes: leaves.map((item, n) => ({ id: identity(item.scope, item.label), label: String.fromCodePoint(0xe000 + n) })), groups: observed.filter(item => item.group).map(item => ({ id: identity(item.scope, item.label), label: item.label, members: observed.filter(child => child.scope.join('\0') === [...item.scope, item.label].join('\0')).map(child => identity(child.scope, child.label)), ...(item.scope.length ? { parent: identity(item.scope.slice(0, -1), item.scope.at(-1)!) } : {}) })), edges: transitions.map(edge => ({ source: endpoint(edge.scope, edge.source), target: endpoint(edge.scope, edge.target), ...(edge.caption ? { label: edge.caption } : {}) })) }
  const verdict = inspectTerminalMeaning(normalized.map(row => row.join('')).join('\n'), graph, { primitiveShapes: true })
  set('transitions', verdict.status === 'correct' ? 'passed' : verdict.status === 'incorrect' ? 'failed' : 'unknown', 'Scope-qualified states and composite ports own directed transitions: ' + verdict.reason, verdict.edges)
  return checks
}
/** A semantic state-chain projection, independent of a rectangle skin. Only
 * existing horizontal rails can be endpoints; the unused ragged side remains
 * exactly as drawn. Extra routes, text, frames or ambiguous captions decline. */
function framedStateChain(grid: string[][], closed: ReturnType<typeof terminalRectangles>) {
  const cell = (x: number, y: number) => grid[y]?.[x] ?? ' ', frames = closed.map(box => ({ ...box, label: normalizedTerminalText(box.lines.join(' ')) })), horizontal = (row: string[], x: number, right: number) => /^[─┬┴┼-]+$/.test(row.slice(x + 1, right).join(''))
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) if (cell(x, y) === '╭') for (let right = x + 2; right < grid[y]!.length; right++) if (cell(right, y) === '╮' && horizontal(grid[y]!, x, right) && !frames.some(frame => frame.x === x && frame.y === y)) for (let bottom = y + 4; bottom < grid.length; bottom++) {
    if (cell(x, bottom) !== '╰' || cell(right, bottom) !== '╯' || !horizontal(grid[bottom]!, x, right)) continue
    const rows = Array.from({ length: bottom - y - 1 }, (_, n) => y + n + 1)
    if (!rows.every(row => cell(x, row) === '│')) continue
    const captions = rows.flatMap(row => {
      const otherRows = rows.filter(at => at !== row)
      if (!otherRows.every(at => cell(right, at) === '│' && !grid[at]!.slice(x + 1, right).join('').trim())) return []
      const pairs = []
      for (let wall = Math.max(x + 2, right - 4); wall <= right + 4; wall++) if (cell(wall, row) === '│') { const text = grid[row]!.slice(x + 1, wall).join('').trim(); if (text && /^[\p{Letter}\p{Number}\p{Mark}\s]+$/u.test(text)) pairs.push(text) }
      return pairs.length === 1 ? [{ label: normalizedTerminalText(pairs[0]!), row }] : []
    })
    if (captions.length === 1) { frames.push({ x, y, right, bottom, lines: [captions[0]!.label], label: captions[0]!.label }); break }
  }
  frames.sort((a, b) => a.y - b.y)
  if (frames.length < 2 || frames.length > 128 || frames.some(frame => !frame.label || /[─│┬┴┼├┤┌┐└┘╭╮╰╯]/.test(frame.label)) || frames.some((frame, n) => n && frame.y <= frames[n - 1]!.bottom)) return
  const inside = (x: number, y: number) => frames.some(frame => x >= frame.x && x <= frame.right && y >= frame.y && y <= frame.bottom), owned = new Set<string>(), edges: string[][] = []
  let broken = false
  for (let n = 1; n < frames.length; n++) {
    const upper = frames[n - 1]!, lower = frames[n]!, rows = Array.from({ length: lower.y - upper.bottom - 1 }, (_, at) => upper.bottom + at + 1), ink = rows.flatMap(y => (grid[y] ?? []).flatMap((glyph, x) => glyph.trim() ? [{ x, y, glyph }] : [])), columns = [...new Set(ink.map(point => point.x))]
    if (columns.length !== 1 || ink.some(point => !/^[│▲▼]$/.test(point.glyph))) return
    const x = columns[0]!
    if (!(x > upper.x && x < upper.right && x > lower.x && x < lower.right) || !/^[─┬┴┼◯]$/.test(cell(x, upper.bottom)) || !/^[─┬┴┼◯]$/.test(cell(x, lower.y))) return
    const heads = ink.filter(point => point.glyph !== '│'), down = heads.length === 1 && heads[0]!.glyph === '▼' && heads[0]!.y === lower.y - 1, up = heads.length === 1 && heads[0]!.glyph === '▲' && heads[0]!.y === upper.bottom + 1
    if (ink.length !== rows.length || !down && !up) broken = true
    edges.push(down ? [upper.label, lower.label, ''] : [lower.label, upper.label, ''])
    for (const point of ink) owned.add(point.x + ',' + point.y)
  }
  if (grid.some((row, y) => row.some((glyph, x) => glyph.trim() && !inside(x, y) && !owned.has(x + ',' + y)))) return
  return { frames, edges, broken }
}
export function terminalStateSourceObservable(contract: TerminalSourceContract) {
  const states = contract.facts.find(fact => fact.criterion === 'states')?.expected as { id: string; label: string; scope: string[] }[] | undefined
  return !!states?.length && states.length <= 128 && !contract.sourceUncertainties.length && contract.facts.every(fact => fact.required === false || ['states', 'transitions', 'state-enclosures'].includes(fact.criterion))
}
