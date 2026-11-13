import { TerminalRectangleBudgetExceeded } from './terminal-rectangles.ts'
import { terminalObservation } from './terminal-observation.ts'
import { inspectTerminalGrouping, type TerminalGroup } from './terminal-groups.ts'
import { terminalTextWidth } from './terminal-display.ts'
import { normalizedTerminalText, terminalAuthoredLinesObserved } from './terminal-text.ts'
/** A bounded terminal observer: grapheme-aware labels in rectangular boxes joined
 * by orthogonal directed routes. Unsupported display/layout features are
 * unknown. Text presence alone never establishes a relationship. */
export interface TerminalMeaning {
  nodes: readonly { id: string; label: string }[]
  edges: readonly { source: string; target: string; label?: string; directed?: boolean; stroke?: string; endMarker?: string; visible?: boolean }[]
  groups?: readonly TerminalGroup[]
  layout?: readonly { before: string; after: string; axis: 'x' | 'y' }[]
}
type Box = { x: number; y: number; right: number; bottom: number; label: string; id?: string; shape?: string; lines?: string[] }
const scope = 'Closed graph containers in at most 128 nodes, 4096 columns, 2048 rows and 2 MB of terminal input; NFC grapheme labels, qualified terminal-state controls, exact solid/dotted/thick strokes and owned arrow/circle/cross/class markers on orthogonal routes. Plain undirected links use a straight horizontal projection; multiline captions retain contiguous owned rows. Labelled enclosing groups use independently observed direct membership and source/end ports; remaining family facts and ambiguous junctions require their own qualified projections.'

function inspectTerminalMeaningUnchecked(output: string, expected: TerminalMeaning, options: { primitiveShapes: boolean; pointMarkers?: readonly string[] } = { primitiveShapes: false }, observation = terminalObservation(output)) {
  observation.assertOutput(output)
  const verdict = (status: 'correct' | 'incorrect' | 'unknown', reason: string, edges: { source: string; target: string; label?: string; route?: { x: number; y: number }[] }[] = []) => ({ status, reason, scope, edges })
  const known = [...expected.nodes, ...(expected.groups ?? [])]
  if (!expected.nodes.length && !expected.groups?.length || new Set(expected.nodes.map(node => node.id)).size !== expected.nodes.length || new Set(expected.nodes.map(node => normalizedTerminalText(node.label))).size !== expected.nodes.length || expected.nodes.some(node => !normalizedTerminalText(node.label) || /[\r\x00-\x09\x0b-\x1f]/.test(node.label)) || expected.edges.some(edge => !known.some(node => node.id === edge.source) || !known.some(node => node.id === edge.target))) return verdict('unknown', 'Expected identities/labels are ambiguous or outside the declared display scope')
  const display = observation.display({ columns: 4096, rows: 2048, inputBytes: 2_000_000 })
  if (display.status !== 'available') return verdict('unknown', display.reason ?? 'No qualified terminal-state interpretation')
  const text = display.text, grid = display.cells, cell = (x: number, y: number) => grid[y]?.[x] ?? ' '
  if (grid.length > 2048 || grid.some(line => line.length > 4096) || [...text].filter(character => (options.primitiveShapes ? ['┌', '╭', '+', '◇', '◯', '◎', '(', '/', '▷', '⌜', '╟'] : ['┌', '╭', '+']).includes(character)).length > (options.primitiveShapes ? 1024 : 512) || expected.nodes.length > 128) return verdict('unknown', 'Output exceeds the bounded grid profile')
  const grouping = expected.groups?.length ? inspectTerminalGrouping(output, expected.nodes, expected.groups, observation) : undefined
  if (grouping && grouping.status !== 'passed') return verdict('unknown', grouping.reason)
  const groupBoxes = grouping?.groups ?? []
  const boxes: Box[] = observation.rectangles(display, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: options.primitiveShapes, ports: true, cornerPorts: true }).filter(box => !groupBoxes.some(group => group.x === box.x && group.y === box.y && group.right === box.right && group.bottom === box.bottom)).map(box => Object.assign(box, { label: normalizedTerminalText(box.lines.join(' ')) }))
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) if ((options.pointMarkers ?? ['●', '◉']).includes(cell(x, y)) && expected.nodes.some(node => node.label === cell(x, y)) && !boxes.some(box => x >= box.x && x <= box.right && y >= box.y && y <= box.bottom)) boxes.push({ x, y, right: x, bottom: y, label: cell(x, y) })
  if (!boxes.length) return verdict('unknown', 'No qualified closed node containers or explicit state markers are inspectable in this output representation')
  const disjoint = boxes.every((box, index) => boxes.every((other, at) => at === index || box.right < other.x || other.right < box.x || box.bottom < other.y || other.bottom < box.y))
  // Wire crossings can close a rectangle containing only more wire ink. That
  // is not an independently labelled extra node. Symbol-only captions retain
  // ambiguity here; literal letters/numbers provide the negative witness.
  const hasCaption = (box: Box) => /[\p{Letter}\p{Number}]/u.test(box.label)
  if (!groupBoxes.length && disjoint && boxes.every(hasCaption) && boxes.length > expected.nodes.length) return verdict('incorrect', 'Additional independently closed, labelled node containers are absent from the authored node inventory')
  for (const node of expected.nodes) {
    const label = normalizedTerminalText(node.label), matches = boxes.filter(box => box.label.normalize('NFC') === label)
    if (!matches.length && (text.includes(node.label) || boxes.some(box => box.label.replace(/\s/g, '') === node.label.replace(/\s/g, '')))) return verdict('unknown', 'Visible authored label lacks a qualified node-container or wrapping projection: ' + node.label)
    if (matches.length !== 1) return verdict('incorrect', 'Expected exactly one drawn node labelled ' + node.label + '; found ' + matches.length)
    const rows = matches[0]!.lines
    if (node.label.includes('\n')) {
      const observed = rows && terminalAuthoredLinesObserved(rows, node.label.split('\n'))
      if (observed === undefined) return verdict('unknown', 'Authored blank node lines require a qualified padding projection: ' + node.label)
      if (!observed) return verdict('incorrect', 'Authored node line breaks differ from owned display rows: ' + node.label)
    }
    matches[0]!.id = node.id
  }
  if (boxes.length !== expected.nodes.length) {
    if (!groupBoxes.length && disjoint && boxes.some(box => !box.id && hasCaption(box))) return verdict('incorrect', 'Additional independently closed, labelled node containers are absent from the authored node inventory')
    return verdict('unknown', 'Additional or nested containers need a reviewed ownership projection')
  }
  const inside = (x: number, y: number) => boxes.find(box => x >= box.x && x <= box.right && y >= box.y && y <= box.bottom)
  const groupBoundary = (x: number, y: number) => groupBoxes.find(box => (x === box.x || x === box.right) && y > box.y && y < box.bottom || (y === box.y || y === box.bottom) && x > box.x && x < box.right)
  const groupExits = (x: number, y: number) => { const group = groupBoundary(x, y); if (!group) return undefined; const perpendicular = y === group.y || y === group.bottom ? [0, 2] : [1, 3]; return (points[cell(x, y)] ?? []).filter(direction => perpendicular.includes(direction)) }
  const boundary = (x: number, y: number, sourceDirection?: number): Box | undefined => {
    const corner = boxes.filter(box => (x === box.x || x === box.right) && (y === box.y || y === box.bottom) && sourceDirection !== undefined && (x === box.x && sourceDirection === 3 || x === box.right && sourceDirection === 1 || y === box.y && sourceDirection === 0 || y === box.bottom && sourceDirection === 2) && points[cell(x, y)]?.includes(sourceDirection))
    if (corner.length === 1) return corner[0]
    const node = boxes.find(box => box.x === box.right && box.y === box.bottom && x === box.x && y === box.y || (x === box.x || x === box.right) && y > box.y && y < box.bottom || (y === box.y || y === box.bottom) && x > box.x && x < box.right)
    if (node) return node
    const group = groupBoundary(x, y), exits = groupExits(x, y)
    return group && (sourceDirection === undefined || exits?.length === 1 && exits[0] === sourceDirection) ? group : undefined
  }

  const points: Record<string, number[]> = { '┄': [1, 3], '┈': [1, 3], '╌': [1, 3], '━': [1, 3], '┆': [0, 2], '┊': [0, 2], '╎': [0, 2], '┃': [0, 2], '─': [1, 3], '-': [1, 3], '│': [0, 2], '|': [0, 2], '┌': [1, 2], '┐': [2, 3], '└': [0, 1], '┘': [0, 3], '╭': [1, 2], '╮': [2, 3], '╰': [0, 1], '╯': [0, 3], '┬': [1, 2, 3], '┴': [0, 1, 3], '├': [0, 1, 2], '┤': [0, 2, 3], '┼': [0, 1, 2, 3], '+': [0, 1, 2, 3] }
  const arrows: Record<string, number> = { '▲': 0, '^': 0, '↑': 0, '►': 1, '▶': 1, '>': 1, '→': 1, '▼': 2, 'v': 2, '↓': 2, '◄': 3, '◀': 3, '<': 3, '←': 3 }
  const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0], key = (x: number, y: number) => x + ',' + y
  const special = new Map<string, { heading: number; directed?: boolean; endMarker?: string }>()
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const glyph = cell(x, y)
    if (!/[△▽◁▷◇◆○◯●×✕]/.test(glyph) || boxes.some(box => box.x === box.right && box.y === box.bottom && x === box.x && y === box.y || x > box.x && x < box.right && y > box.y && y < box.bottom)) continue
    const port = boundary(x, y)
    if (port && ['diamond', 'circle', 'double-circle'].includes(port.shape ?? '')) continue
    const inward = port ? y === port.bottom ? 0 : x === port.x ? 1 : y === port.y ? 2 : x === port.right ? 3 : undefined : undefined
    const triangleDirection = ({ '△': 0, '▷': 1, '▽': 2, '◁': 3 } as Record<string, number>)[glyph]
    const directions = inward !== undefined ? [inward] : [0, 1, 2, 3].filter(direction => { const box = boundary(x + dx[direction]!, y + dy[direction]!); return box && (direction === 0 && y - 1 === box.bottom || direction === 1 && x + 1 === box.x || direction === 2 && y + 1 === box.y || direction === 3 && x - 1 === box.right) })
    if (directions.length !== 1 || triangleDirection !== undefined && triangleDirection !== directions[0]) continue
    const endMarker = glyph === '△' || glyph === '▽' || glyph === '◁' || glyph === '▷' ? 'inheritance' : glyph === '◇' ? 'aggregation' : glyph === '◆' ? 'composition' : /[×✕]/.test(glyph) ? 'cross' : 'circle'
    special.set(key(x, y), { heading: directions[0]!, endMarker, ...(['cross', 'circle'].includes(endMarker) ? { directed: false } : {}) })
  }
  // Plain undirected horizontal links have two independently observed box
  // contacts and a continuous stroke. No expected edge chooses their endpoints.
  for (const left of boxes) for (const right of boxes) if (expected.edges.some(edge => edge.directed === false) && left.right < right.x) for (let y = Math.max(left.y, right.y) + 1; y < Math.min(left.bottom, right.bottom); y++) {
    const cells = grid[y]!.slice(left.right + 1, right.x)
    if (arrows[cell(left.right, y)] === undefined && arrows[cell(right.x, y)] === undefined && cells.length >= 2 && cells.every(glyph => /^[─━┄┈╌-]$/.test(glyph))) special.set(key(right.x - 1, y), { heading: 1, directed: false })
  }
  const arrowAt = (x: number, y: number) => cell(x, y) === '>' && boxes.some(box => box.shape === 'asymmetric' && x === box.x && y > box.y && y < box.bottom) ? undefined : special.get(key(x, y))?.heading ?? arrows[cell(x, y)]
  const captions = new Map<string, { label: string; token: string; exits: number[] }>(), captionCells = new Set<string>(), captionSpans = new Map<string, string[]>()
  const floating: { label: string; x: number; y: number; width: number }[] = []
  const ambiguousCaptionCells = new Set<string>()
  let uncertainCaption = false
  for (const label of new Set(expected.edges.map(edge => edge.label).filter((value): value is string => !!value))) {
    if (/[\r\x00-\x09\x0b-\x1f]/.test(label)) return verdict('unknown', 'Edge labels contain unqualified controls')
    if (label.includes('\n')) {
      const authored = label.split('\n')
      for (let top = 0; top <= grid.length - authored.length; top++) {
        const hits = authored.map((line, offset) => {
          const row = grid[top + offset]!.join(''), offsetInRow = row.indexOf(line)
          if (offsetInRow < 0 || row.indexOf(line, offsetInRow + 1) >= 0) return undefined
          const x = terminalTextWidth(row.slice(0, offsetInRow)), width = terminalTextWidth(line)
          if (Array.from({ length: width }, (_, n) => inside(x + n, top + offset)).some(Boolean)) return undefined
          return { x, width, y: top + offset }
        })
        if (hits.some(hit => !hit)) continue
        const concrete = hits as { x: number; width: number; y: number }[], left = Math.max(...concrete.map(hit => hit.x)), right = Math.min(...concrete.map(hit => hit.x + hit.width - 1)), candidates = []
        for (let column = left; column <= right; column++) if (concrete.every(hit => Math.abs(column - (hit.x + (hit.width - 1) / 2)) <= .5) && points[cell(column, top - 1)]?.includes(2) && (points[cell(column, top + authored.length)]?.includes(0) || arrowAt(column, top + authored.length) === 2)) candidates.push(column)
        if (candidates.length !== 1) continue
        const token = key(candidates[0]!, top), span: string[] = []
        for (const hit of concrete) for (let n = 0; n < hit.width; n++) { const coordinate = key(hit.x + n, hit.y); captionCells.add(coordinate); span.push(coordinate) }
        captionSpans.set(token, span)
        for (const hit of concrete) captions.set(key(candidates[0]!, hit.y), { label, token, exits: [0, 2] })
      }
      continue
    }
    const needle = label.normalize('NFC'), labelWidth = terminalTextWidth(label)
    for (let y = 0; y < grid.length; y++) {
      const line = grid[y]!.join(''), hits: { x: number; width: number; uncertain: boolean }[] = []
      for (let offset = line.indexOf(needle); offset >= 0; offset = line.indexOf(needle, offset + 1)) {
        const prefix = line.slice(0, offset), column = terminalTextWidth(prefix)
        hits.push({ x: column, width: labelWidth, uncertain: false })
      }
      if (!hits.length && /\s/.test(label)) {
        const escaped = label.split(/(\s+)/).map(part => /^\s+$/.test(part) ? '[ ─-]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')
        for (const match of line.matchAll(new RegExp(escaped, 'g'))) hits.push({ x: terminalTextWidth(line.slice(0, match.index!)), width: terminalTextWidth(match[0]), uncertain: true })
      }
      for (const hit of hits) {
        const { x, width } = hit
        if (Array.from({ length: width }, (_, offset) => inside(x + offset, y) || grouping?.headers.has(key(x + offset, y))).some(Boolean)) continue
        uncertainCaption ||= hit.uncertain
        const token = key(x, y), span = Array.from({ length: width }, (_, offset) => key(x + offset, y))
        for (const coordinate of span) captionCells.add(coordinate)
        captionSpans.set(token, span)
        const horizontal = points[cell(x - 1, y)]?.includes(1) && (points[cell(x + width, y)]?.includes(3) || arrowAt(x + width, y) === 1)
        if (horizontal) {
          for (const coordinate of span) {
            if (captions.has(coordinate)) return verdict('unknown', 'Overlapping edge-label spans are ambiguous')
            captions.set(coordinate, { label, token, exits: [1, 3] })
          }
          continue
        }
        const midpoint = x + (width - 1) / 2
        const vertical = Array.from({ length: width }, (_, offset) => x + offset).filter(column => Math.abs(column - midpoint) <= .5 && (points[cell(column, y - 1)]?.includes(2) || arrowAt(column, y - 1) === 0) && (points[cell(column, y + 1)]?.includes(0) || arrowAt(column, y + 1) === 2))
        if (vertical.length === 1) { captions.set(key(vertical[0]!, y), { label, token, exits: [0, 2] }); continue }
        // A caption can occupy a bend rather than a straight segment. Its
        // two visible wire contacts determine the bridge independently of
        // expected endpoints; three contacts cannot determine a pairing.
        const contacts: { column: number; direction: number }[] = []
        const contact = (column: number, direction: number) => {
          const cx = column + dx[direction]!, cy = y + dy[direction]!
          if (points[cell(cx, cy)]?.includes((direction + 2) % 4) || arrowAt(cx, cy) === direction) contacts.push({ column, direction })
        }
        contact(x, 3); contact(x + width - 1, 1)
        for (let column = x; column < x + width; column++) { contact(column, 0); contact(column, 2) }
        if (contacts.length === 2) {
          const left = Math.min(...contacts.map(port => port.column)), right = Math.max(...contacts.map(port => port.column))
          for (let column = left; column <= right; column++) {
            const coordinate = key(column, y)
            if (captions.has(coordinate)) return verdict('unknown', 'Overlapping edge-label spans are ambiguous')
            captions.set(coordinate, { label, token, exits: [...(column > left ? [3] : []), ...(column < right ? [1] : []), ...contacts.filter(port => port.column === column).map(port => port.direction)] })
          }
          continue
        }
        if (contacts.length > 2) for (const coordinate of span) ambiguousCaptionCells.add(coordinate)
        floating.push({ label, x, y, width })
      }
    }
  }
  const actual: { source: string; target: string; label?: string; stroke?: string; directed?: boolean; endMarker?: string; route?: { x: number; y: number }[] }[] = [], used = new Set<string>()
  const paths: { x: number; y: number }[][] = []
  const targets: { x: number; y: number; heading: number; target: string }[] = []
  // Validate every observed head contact before exploring any shared component.
  // One ambiguous crossing cannot hide a different visibly dangling arrowhead.
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) {
    const heading = arrowAt(x, y)
    if (heading === undefined || boxes.some(box => x > box.x && x < box.right && y > box.y && y < box.bottom) || captionCells.has(key(x, y)) || grouping?.headers.has(key(x, y))) continue
    const port = boundary(x, y), inward = port && (x === port.x && heading === 1 || x === port.right && heading === 3 || y === port.y && heading === 2 || y === port.bottom && heading === 0)
    const target = inward ? port : boundary(x + dx[heading]!, y + dy[heading]!)
    if (target && groupBoxes.some(group => group.id === target.id)) {
      const contactX = inward ? x : x + dx[heading]!, contactY = inward ? y : y + dy[heading]!, normal = contactX === target.x && heading === 1 || contactX === target.right && heading === 3 || contactY === target.y && heading === 2 || contactY === target.bottom && heading === 0
      if (!normal) return verdict('unknown', 'Arrowhead meets a group border without a qualified inward port', actual)
    }
    if (!target?.id) return verdict('incorrect', 'Arrowhead does not meet a drawn target node', actual)
    targets.push({ x, y, heading, target: target.id })
  }
  for (const { x, y, heading, target } of targets) {
    used.add(key(x, y))
    // Do not use expected edges to choose a branch. A shared outgoing stem is
    // qualified by one source, or a cycle-free merge with only one target head.
    const pending = [{ x: x - dx[heading]!, y: y - dy[heading]!, towardPrevious: heading, path: new Set<string>(), labels: new Map<string, string>() }]
    const sources: { source: Box; path: Set<string>; labels: Map<string, string> }[] = []
    const headSources: typeof sources = []
    const otherHeads = new Set<string>()
    let steps = 0, cycle = false, unqualifiedGroupPort = false, unqualifiedCaption = false
    while (pending.length) {
      if (++steps > 4096) return verdict('unknown', 'Route exploration exceeds the bounded graph profile', actual)
      const cursor = pending.pop()!, source = boundary(cursor.x, cursor.y, cursor.towardPrevious)
      if (source) { sources.push({ source, path: cursor.path, labels: cursor.labels }); continue }
      const coordinate = key(cursor.x, cursor.y)
      if (ambiguousCaptionCells.has(coordinate)) unqualifiedCaption = true
      if (cursor.path.has(coordinate)) { cycle = true; continue }
      if (arrowAt(cursor.x, cursor.y) !== undefined && !captions.has(coordinate)) { otherHeads.add(coordinate); const heading = arrowAt(cursor.x, cursor.y)!, node = boundary(cursor.x + dx[heading]!, cursor.y + dy[heading]!); if (node) { const path = new Set(cursor.path); path.add(coordinate); headSources.push({ source: node, path, labels: cursor.labels }) }; continue }
      const caption = captions.get(coordinate), groupWire = groupExits(cursor.x, cursor.y), exits = caption?.exits ?? groupWire ?? points[cell(cursor.x, cursor.y)]
      if (groupWire && !groupWire.length) unqualifiedGroupPort = true
      if (!exits?.includes(cursor.towardPrevious)) continue
      const path = new Set(cursor.path); path.add(coordinate)
      const labels = new Map(cursor.labels)
      if (caption) labels.set(caption.token, caption.label)
      for (const direction of exits.filter(direction => direction !== cursor.towardPrevious)) pending.push({ x: cursor.x + dx[direction]!, y: cursor.y + dy[direction]!, towardPrevious: (direction + 2) % 4, path, labels })
    }
    if (!sources.length) sources.push(...headSources)
    // A tree with one target head and distinct independently contacted sources
    // is an unambiguous merge. A component with multiple sources AND target
    // heads still cannot choose pairings from expected edges. Repeated paths
    // to one source and cycles likewise retain their ambiguity.
    if (cycle || sources.length > 1 && (otherHeads.size || new Set(sources.map(found => found.source.id)).size !== sources.length)) return verdict('unknown', 'Junction, crossing or cycle has ambiguous source ownership', actual)
    if (!sources.length && unqualifiedGroupPort) return verdict('unknown', 'Group border has no qualified source endpoint or pass-through projection', actual)
    if (!sources.length) return verdict(unqualifiedCaption ? 'unknown' : 'incorrect', unqualifiedCaption ? 'A caption has more than two wire contacts; its route pairing is ambiguous' : 'Arrow stem is disconnected from its source node', actual)
    for (const found of sources) {
      if (!found.source.id || found.labels.size > 1) return verdict('unknown', 'Source or relationship label ownership is ambiguous', actual)
      for (const coordinate of found.path) used.add(coordinate)
      for (const token of found.labels.keys()) for (const coordinate of captionSpans.get(token) ?? []) used.add(coordinate)
      const strokes = new Set([...found.path].map(coordinate => { const [col, row] = coordinate.split(',').map(Number); const glyph = cell(col!, row!); return /[┄┈╌┆┊╎]/.test(glyph) ? 'dotted' : /[━┃]/.test(glyph) ? 'thick' : /[─│|-]/.test(glyph) ? 'solid' : undefined }).filter(Boolean))
      if (strokes.size > 1) return verdict('unknown', 'Mixed line strokes have no qualified style ownership', actual)
      const stroke = [...strokes][0], marker = special.get(key(x, y)), route = [{ x, y }, ...[...found.path].map(coordinate => { const [x, y] = coordinate.split(',').map(Number); return { x: x!, y: y! } })]
      actual.push({ source: found.source.id, target, ...(found.labels.size ? { label: [...found.labels.values()][0]! } : {}), ...(stroke && stroke !== 'solid' ? { stroke } : {}), ...(marker?.directed === false ? { directed: false } : {}), ...(marker?.endMarker ? { endMarker: marker.endMarker } : {}), route })
      paths.push(route)
    }
  }
  for (const caption of floating) {
    const midpoint = caption.x + (caption.width - 1) / 2
    const candidates = paths.map((path, index) => ({ index, near: path.some(point => Math.abs(point.y - caption.y) === 1 && Math.abs(point.x - midpoint) <= .5 || point.y === caption.y && (point.x === caption.x - 1 || point.x === caption.x - 2 && cell(point.x + 1, point.y) === ' ' || point.x === caption.x + caption.width || point.x === caption.x + caption.width + 1 && cell(point.x - 1, point.y) === ' ')) })).filter(item => item.near)
    if (candidates.length !== 1 || actual[candidates[0]!.index]!.label) return verdict('unknown', 'Floating relationship label has no unique adjacent route owner', actual)
    actual[candidates[0]!.index]!.label = caption.label
    for (let offset = 0; offset < caption.width; offset++) used.add(key(caption.x + offset, caption.y))
  }
  const canonical = (edges: readonly { source: string; target: string; label?: string; directed?: boolean; stroke?: string; endMarker?: string; visible?: boolean }[]) => edges.map(edge => { const endpoints = edge.directed === false && !edge.endMarker ? [edge.source, edge.target].sort() : [edge.source, edge.target]; return JSON.stringify([...endpoints, edge.label ?? '', edge.stroke ?? 'solid', edge.directed !== false, edge.endMarker ?? '']) }).sort()
  if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected.edges))) return verdict('incorrect', 'Drawn directed relationships or their labels differ from the authored graph', actual)
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y]!.length; x++) if (cell(x, y) !== ' ' && !inside(x, y) && !used.has(key(x, y)) && !grouping?.decor.has(key(x, y))) return verdict('unknown', 'Unassigned output ink or text remains outside the verified nodes and routes', actual)
  for (const constraint of expected.layout ?? []) {
    const before = boxes.find(box => box.id === constraint.before), after = boxes.find(box => box.id === constraint.after)
    if (!before || !after || !['x', 'y'].includes(constraint.axis)) return verdict('unknown', 'Authored layout relation has no unique node ownership', actual)
    const coordinate = (box: Box) => constraint.axis === 'x' ? (box.x + box.right) / 2 : (box.y + box.bottom) / 2
    if (!(coordinate(before) < coordinate(after))) return verdict('incorrect', 'Drawn node order violates an independently declared layout relation', actual)
  }
  if (uncertainCaption) return verdict('unknown', 'Caption whitespace overlaps route ink; exact text projection is unqualified', actual)
  return verdict('correct', 'Every declared node and directed route is present with its owned label', actual)
}

export function inspectTerminalMeaning(...args: Parameters<typeof inspectTerminalMeaningUnchecked>) {
  try { return inspectTerminalMeaningUnchecked(...args) }
  catch (error) {
    if (!(error instanceof TerminalRectangleBudgetExceeded)) throw error
    return { status: 'unknown' as const, reason: error.message, scope, edges: [] }
  }
}
