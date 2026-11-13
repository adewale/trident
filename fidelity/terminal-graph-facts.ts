import { terminalObservation } from './terminal-observation.ts'
import { terminalTextWidth } from './terminal-display.ts'
import { terminalRaggedSingleLineFrames } from './terminal-rectangles.ts'
import { terminalAuthoredLinesObserved, terminalMissingLiteralGlyphs } from './terminal-text.ts'
import { inspectTerminalMeaning, type TerminalMeaning } from './terminal.ts'
import { inspectTerminalGrouping } from './terminal-groups.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().normalize('NFC')
/** The containers whose text is a node's label, computed once per node id. */
export function terminalLabelOwners<T extends { lines: string[] }>(nodes: readonly { id: string; label: string }[], boxes: readonly T[]) {
  const byId = new Map<string, T[]>()
  return (id: string) => { let found = byId.get(id); if (!found) { const node = nodes.find(node => node.id === id), label = node && normalize(node.label); found = node ? boxes.filter(box => normalize(box.lines.join(' ')) === label) : []; byId.set(id, found) } return found }
}
/** Full flowchart facts remain separate even when one relationship is ambiguous.
 * Primitive boundaries and authored lines use actual owned display containers. */
export function inspectTerminalGraphFacts(output: string, contract: TerminalSourceContract, graph: TerminalMeaning, observation = terminalObservation(output)): TerminalFactCheck[] {
  observation.assertOutput(output)
  const checks = contract.facts.filter(fact => fact.required !== false).map(fact => ({ criterion: fact.criterion, expected: fact.expected, status: 'unknown' as TerminalFactCheck['status'], detail: 'Graph representation has no qualified display ownership' }))
  const set = (criterion: string, status: TerminalFactCheck['status'], detail: string, actual?: unknown) => { const row = checks.find(row => row.criterion === criterion); if (row) Object.assign(row, { status, detail, actual }) }
  const display = observation.display( { columns: 4096, rows: 2048, inputBytes: 2_000_000 })
  if (display.status !== 'available') { for (const check of checks) check.detail = display.reason!; return checks }
  const containers = observation.rectangles(display, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true, cornerPorts: true })
  const controlled = graph.nodes.filter(node => /[\x00-\x1f]/.test(node.label))
  if (controlled.length) {
    const escape = (text: string, style: string) => text.replace(/[\x00-\x1f]/g, glyph => glyph === '\x1b' ? style : '\\x' + glyph.charCodeAt(0).toString(16).padStart(2, '0'))
    const rawControl = controlled.some(node => output.includes(node.label))
    const spellings = ['\\x1b', '\\u001b', '^[', '␛'], candidates = spellings.map(style => ({ ...graph, nodes: graph.nodes.map(node => ({ ...node, label: escape(node.label, style) })) })).filter(candidate => candidate.nodes.every(node => containers.filter(box => normalize(box.lines.join(' ')) === normalize(node.label)).length === 1))
    set('literal-control-safety', rawControl ? 'failed' : candidates.length === 1 ? 'passed' : 'unknown', rawControl ? 'Source-owned literal control bytes reached the terminal stream and execute as display state' : 'A control-bearing node needs an explicit visible escape spelling in its own container; generic substitution cannot establish the source label')
    if (candidates.length !== 1) return checks
    graph = candidates[0]!
  }
  const grouping = graph.groups?.length ? inspectTerminalGrouping(output, graph.nodes, graph.groups, observation) : undefined
  if (grouping) set('groups', grouping.status, grouping.reason, grouping.actual)
  const boxes = containers.filter(box => !grouping?.groups.some(group => group.x === box.x && group.y === box.y && group.right === box.right && group.bottom === box.bottom)), owned = terminalLabelOwners(graph.nodes, boxes)
  if (graph.nodes.length && boxes.length === graph.nodes.length && graph.nodes.every(node => owned(node.id).length === 1)) set('nodes', 'passed', 'The exact node multiset has one independently observed closed container per authored identity', boxes.map(box => box.lines))
  const verdict = inspectTerminalMeaning(output, graph, { primitiveShapes: contract.facts.some(fact => fact.criterion === 'node-shapes') }, observation)
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
  } else if (shapes?.length === graph.nodes.length && !graph.groups?.length && boxes.length === graph.nodes.length && boxes.every(box => box.lines.some(line => line.trim()) && box.shape && !box.shape.startsWith('unqualified-')) && boxes.every((box, n) => boxes.every((other, at) => n === at || box.right < other.x || other.right < box.x || box.bottom < other.y || other.bottom < box.y))) {
    // Even an unresolved caption cannot turn five observed rectangles into a
    // stadium/database inventory. Require a complete bounded representation:
    // every other cell is wire ink or one unique literal edge-caption span.
    // Inventory equality alone never gives source-specific shape credit.
    const captions = new Set<string>(), inside = (x: number, y: number) => boxes.some(box => x >= box.x && x <= box.right && y >= box.y && y <= box.bottom)
    for (const caption of new Set(graph.edges.map(edge => edge.label).filter((label): label is string => !!label))) {
      if (graph.nodes.some(node => normalize(node.label) === normalize(caption)) || caption.includes('\n')) continue
      const found: { x: number; y: number; width: number }[] = []
      for (let y = 0; y < display.cells.length; y++) { const row = display.cells[y]!.join(''); for (let at = row.indexOf(caption); at >= 0; at = row.indexOf(caption, at + 1)) { const x = terminalTextWidth(row.slice(0, at)), width = terminalTextWidth(caption); if (Array.from({ length: width }, (_, n) => inside(x + n, y)).every(value => !value)) found.push({ x, y, width }) } }
      if (found.length === 1) for (let x = found[0]!.x; x < found[0]!.x + found[0]!.width; x++) captions.add(x + ',' + found[0]!.y)
    }
    const complete = display.cells.every((row, y) => row.every((glyph, x) => !glyph.trim() || inside(x, y) || captions.has(x + ',' + y) || /^[─│┬┴┼┌┐└┘╭╮╰╯├┤┄┈╌┆┊╎━┃▶►>→◀◄<←▲^↑▼v↓|-]$/.test(glyph)))
    const wanted = shapes.map(item => item.shape).sort(), actual = boxes.map(box => box.shape!).sort()
    if (complete && JSON.stringify(wanted) !== JSON.stringify(actual)) set('node-shapes', 'failed', 'The complete independently closed leaf-container shape multiset differs from all authored node primitives; unresolved labels cannot repair a primitive inventory mismatch', actual)
  }
  const breaks = contract.facts.find(fact => fact.criterion === 'node-line-breaks')?.expected as { id: string; lines: string[] }[] | undefined
  if (breaks?.length && breaks.every(item => owned(item.id).length === 1 && item.lines.every(line => normalize(line)))) set('node-line-breaks', breaks.every(item => terminalAuthoredLinesObserved(owned(item.id)[0]!.lines, item.lines)) ? 'passed' : 'failed', 'Authored line breaks own distinct contiguous display rows', breaks.map(item => ({ id: item.id, lines: owned(item.id)[0]!.lines })))
  if (shapes?.length === graph.nodes.length && shapes.every(item => item.shape === 'rectangle') && !graph.groups?.length) {
    const frames = terminalRaggedSingleLineFrames(display.cells), disjoint = frames.every((frame, at) => frames.every((other, n) => at === n || frame.right < other.x || other.right < frame.x || frame.bottom < other.y || other.bottom < frame.y))
    const exact = frames.length === graph.nodes.length && graph.nodes.every(node => frames.filter(frame => normalize(frame.label) === normalize(node.label)).length === 1)
    const inside = (x: number, y: number) => frames.some(frame => y >= frame.y && y <= frame.bottom && x >= (y === frame.row ? Math.min(frame.x, frame.leftWall) : frame.x) && x <= (y === frame.row ? Math.max(frame.right, frame.rightWall) : frame.right))
    const complete = display.cells.every((row, y) => row.every((glyph, x) => !glyph.trim() || inside(x, y) || /^[─│┌┐└┘╭╮╰╯┬┴┼├┤┄┈╌┆┊╎━┃▲^↑►▶>→▼v↓◄◀<←]$/.test(glyph)))
    if (disjoint && exact && complete && frames.some(frame => frame.ragged)) set('node-shapes', 'failed', 'Exact one-line node captions own aligned top/bottom rectangular rails and blank side rows, but caption-row walls shift to different columns and disconnect those rectangular sides; no cells are repaired', frames)
  }
  // A damaged wall can prevent a complete container observation while the
  // aligned top/bottom rails and one continuous side still identify drawing
  // ink. This is used only for necessary missing-text negatives, never to
  // reconstruct the other wall or admit a node/route.
  const frameRails = !containers.length && display.cells.some((row, y) => row.some((glyph, x) => glyph === '┌' && row.some((rightGlyph, right) => right > x + 1 && rightGlyph === '┐' && /^[─┬┴┼-]+$/.test(row.slice(x + 1, right).join('')) && display.cells.some((lower, bottom) => bottom > y + 1 && lower[x] === '└' && lower[right] === '┘' && /^[─┬┴┼-]+$/.test(lower.slice(x + 1, right).join('')) && [x, right].some(column => display.cells.slice(y + 1, bottom).every(body => /^[│├┤┼|]$/.test(body[column] ?? '')))))))
  if (containers.length || frameRails) {
    // Missing visible literal glyphs can be decisive even when damaged walls or
    // junctions prevent identity/route attribution. Presence supplies no credit.
    const missingNodes = terminalMissingLiteralGlyphs(display.cells, graph.nodes.map(node => node.label)), missingCaptions = terminalMissingLiteralGlyphs(display.cells, graph.edges.flatMap(edge => edge.label ? [edge.label] : []))
    if (missingNodes.length) set('nodes', 'failed', 'Required node-caption letters/numbers are absent from the entire interpreted display, even without assigning any container or wrapping projection', missingNodes)
    if (missingCaptions.length) set('relationships', 'failed', 'Required relationship-caption letters/numbers are absent from the entire interpreted display; no endpoint or junction pairing is inferred', missingCaptions)
    const requiresHead = graph.edges.some(edge => edge.directed !== false && edge.visible !== false && !edge.endMarker), hasHead = /[▲^↑►▶>→▼v↓◄◀<←△▽▷◁]/u.test(display.text)
    const knownInk = display.cells.every(row => row.every(glyph => !glyph.trim() || /^[\p{Letter}\p{Number}\p{Mark}\s]+$/u.test(glyph) || /^[─│┌┐└┘╭╮╰╯┬┴┼├┤┄┈╌┆┊╎━┃◇◯◎●◉'".,:;!?()[\]{}_#*&/%\\+\-=]$/.test(glyph)))
    if (requiresHead && !hasHead && knownInk) set('relationships', 'failed', 'A complete bounded frame/text/stroke vocabulary contains no directional head for a required visible arrowheaded relationship; layout or an undirected tee cannot supply the missing head', [])
  }
  return checks
}
export function terminalGraphSourceObservable(contract: TerminalSourceContract, graph?: TerminalMeaning) {
  const criteria = ['nodes', 'relationships', 'layout-order', 'node-shapes', 'node-line-breaks', 'groups', 'literal-control-safety'], shapes = ['rectangle', 'rounded', 'stadium', 'diamond', 'circle', 'double-circle', 'asymmetric', 'parallelogram', 'database', 'subroutine', 'hexagon']
  return !!graph && graph.nodes.length <= 128 && !contract.sourceUncertainties.length && contract.facts.every(fact => fact.required === false || criteria.includes(fact.criterion)) && (contract.facts.find(fact => fact.criterion === 'node-shapes')?.expected as { shape: string }[] ?? []).every(item => shapes.includes(item.shape))
}
