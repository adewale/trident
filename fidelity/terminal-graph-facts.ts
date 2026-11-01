import { interpretTerminal } from './terminal-display.ts'
import { terminalRectangles } from './terminal-rectangles.ts'
import { terminalAuthoredLinesObserved } from './terminal-text.ts'
import { inspectTerminalMeaning, type TerminalMeaning } from './terminal.ts'
import { inspectTerminalGrouping } from './terminal-groups.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().normalize('NFC')
/** Full flowchart facts remain separate even when one relationship is ambiguous.
 * Primitive boundaries and authored lines use actual owned display containers. */
export function inspectTerminalGraphFacts(output: string, contract: TerminalSourceContract, graph: TerminalMeaning): TerminalFactCheck[] {
  const checks = contract.facts.filter(fact => fact.required !== false).map(fact => ({ criterion: fact.criterion, expected: fact.expected, status: 'unknown' as TerminalFactCheck['status'], detail: 'Graph representation has no qualified display ownership' }))
  const set = (criterion: string, status: TerminalFactCheck['status'], detail: string, actual?: unknown) => { const row = checks.find(row => row.criterion === criterion); if (row) Object.assign(row, { status, detail, actual }) }
  const display = interpretTerminal(output, { columns: 4096, rows: 2048, inputBytes: 2_000_000 })
  if (display.status !== 'available') { for (const check of checks) check.detail = display.reason!; return checks }
  const containers = terminalRectangles(display.cells, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true, cornerPorts: true })
  const controlled = graph.nodes.filter(node => /[\x00-\x1f]/.test(node.label))
  if (controlled.length) {
    const escape = (text: string, style: string) => text.replace(/[\x00-\x1f]/g, glyph => glyph === '\x1b' ? style : '\\x' + glyph.charCodeAt(0).toString(16).padStart(2, '0'))
    const rawControl = controlled.some(node => output.includes(node.label))
    const spellings = ['\\x1b', '\\u001b', '^[', '␛'], candidates = spellings.map(style => ({ ...graph, nodes: graph.nodes.map(node => ({ ...node, label: escape(node.label, style) })) })).filter(candidate => candidate.nodes.every(node => containers.filter(box => normalize(box.lines.join(' ')) === normalize(node.label)).length === 1))
    set('literal-control-safety', rawControl ? 'failed' : candidates.length === 1 ? 'passed' : 'unknown', rawControl ? 'Source-owned literal control bytes reached the terminal stream and execute as display state' : 'A control-bearing node needs an explicit visible escape spelling in its own container; generic substitution cannot establish the source label')
    if (candidates.length !== 1) return checks
    graph = candidates[0]!
  }
  const grouping = graph.groups?.length ? inspectTerminalGrouping(output, graph.nodes, graph.groups) : undefined
  if (grouping) set('groups', grouping.status, grouping.reason, grouping.actual)
  const boxes = containers.filter(box => !grouping?.groups.some(group => group.x === box.x && group.y === box.y && group.right === box.right && group.bottom === box.bottom)), owned = (id: string) => { const node = graph.nodes.find(node => node.id === id); return node ? boxes.filter(box => normalize(box.lines.join(' ')) === normalize(node.label)) : [] }
  if (graph.nodes.length && boxes.length === graph.nodes.length && graph.nodes.every(node => owned(node.id).length === 1)) set('nodes', 'passed', 'The exact node multiset has one independently observed closed container per authored identity', boxes.map(box => box.lines))
  const verdict = inspectTerminalMeaning(output, graph, { primitiveShapes: contract.facts.some(fact => fact.criterion === 'node-shapes') })
  if (verdict.status === 'correct') for (const criterion of ['nodes', 'relationships', 'layout-order']) set(criterion, 'passed', verdict.reason, criterion === 'relationships' ? verdict.edges : undefined)
  else if (verdict.status === 'incorrect') set(/node labelled|node inventory|node line breaks/.test(verdict.reason) ? 'nodes' : /node order/.test(verdict.reason) ? 'layout-order' : 'relationships', 'failed', verdict.reason, verdict.edges)
  else for (const criterion of ['relationships', 'layout-order']) set(criterion, 'unknown', verdict.reason)
  // Ordering is an independent geometric obligation. An ambiguous wire cannot
  // erase a directly observed wrong node order, nor is connectivity needed to
  // measure the centres of uniquely owned containers.
  if (graph.layout?.length && graph.layout.every(item => ['x', 'y'].includes(item.axis) && owned(item.before).length === 1 && owned(item.after).length === 1)) {
    const actual = graph.layout.map(item => {
      const before = owned(item.before)[0]!, after = owned(item.after)[0]!, centre = (box: typeof before) => item.axis === 'x' ? (box.x + box.right) / 2 : (box.y + box.bottom) / 2
      return { ...item, beforeCoordinate: centre(before), afterCoordinate: centre(after) }
    })
    set('layout-order', actual.every(item => item.beforeCoordinate < item.afterCoordinate) ? 'passed' : 'failed', 'Source-declared order is measured from unique owned container centres independently of relationship tracing', actual)
  }
  const shapes = contract.facts.find(fact => fact.criterion === 'node-shapes')?.expected as { id: string; shape: string }[] | undefined
  if (shapes?.length && shapes.every(item => owned(item.id).length === 1)) {
    const actual = shapes.map(item => ({ id: item.id, shape: owned(item.id)[0]!.shape })), unknown = actual.some(item => item.shape?.startsWith('unqualified-')), mismatch = actual.some((item, n) => !item.shape?.startsWith('unqualified-') && item.shape !== shapes[n]!.shape)
    set('node-shapes', mismatch ? 'failed' : unknown ? 'unknown' : 'passed', 'Closed primitive boundaries or matching shape annotations own their full source labels; hexagons require both sloped ends and connected side walls', actual)
  }
  const breaks = contract.facts.find(fact => fact.criterion === 'node-line-breaks')?.expected as { id: string; lines: string[] }[] | undefined
  if (breaks?.length && breaks.every(item => owned(item.id).length === 1 && item.lines.every(line => normalize(line)))) set('node-line-breaks', breaks.every(item => terminalAuthoredLinesObserved(owned(item.id)[0]!.lines, item.lines)) ? 'passed' : 'failed', 'Authored line breaks own distinct contiguous display rows', breaks.map(item => ({ id: item.id, lines: owned(item.id)[0]!.lines })))
  return checks
}
export function terminalGraphSourceObservable(contract: TerminalSourceContract, graph?: TerminalMeaning) {
  const criteria = ['nodes', 'relationships', 'layout-order', 'node-shapes', 'node-line-breaks', 'groups', 'literal-control-safety'], shapes = ['rectangle', 'rounded', 'stadium', 'diamond', 'circle', 'double-circle', 'asymmetric', 'parallelogram', 'database', 'subroutine', 'hexagon']
  return !!graph && graph.nodes.length <= 128 && !contract.sourceUncertainties.length && contract.facts.every(fact => fact.required === false || criteria.includes(fact.criterion)) && (contract.facts.find(fact => fact.criterion === 'node-shapes')?.expected as { shape: string }[] ?? []).every(item => shapes.includes(item.shape))
}
