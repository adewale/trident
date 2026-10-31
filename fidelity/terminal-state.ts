import { interpretTerminal } from './terminal-display.ts'
import { terminalRectangles } from './terminal-rectangles.ts'
import { inspectTerminalMeaning, type TerminalMeaning } from './terminal.ts'
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
    for (const criterion of ['states', 'transitions']) set(criterion, verdict.status === 'correct' ? 'passed' : verdict.status === 'incorrect' && (/node labelled/.test(verdict.reason) ? criterion === 'states' : criterion === 'transitions') ? 'failed' : 'unknown', 'Ordinary state containers, explicit initial/final glyphs and continuous self/cross transitions retain owned captions: ' + verdict.reason, verdict.edges)
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
export function terminalStateSourceObservable(contract: TerminalSourceContract) {
  const states = contract.facts.find(fact => fact.criterion === 'states')?.expected as { id: string; label: string; scope: string[] }[] | undefined
  return !!states?.length && states.length <= 128 && !contract.sourceUncertainties.length && contract.facts.every(fact => fact.required === false || ['states', 'transitions', 'state-enclosures'].includes(fact.criterion))
}
