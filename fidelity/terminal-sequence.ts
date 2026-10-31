import { terminalRectangles } from './terminal-rectangles.ts'
import { interpretTerminal } from './terminal-display.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'

type Box = { x: number; y: number; right: number; bottom: number; lines: string[] }
type Message = { source: string; target: string; marker: string; label: string; y: number; captionY: number; left: number; right: number }
/** Observe a bounded, common sequence representation: participant header boxes,
 * continuous lifelines, straight message stems, adjacent captions, notes and
 * framed fragments. Neither expected endpoints nor captions choose a route. */
export function inspectTerminalSequence(output: string, contract: TerminalSourceContract): TerminalFactCheck[] {
  const required = contract.facts.filter(fact => fact.required !== false)
  const result = required.map(fact => ({ criterion: fact.criterion, status: 'unknown' as TerminalFactCheck['status'], detail: 'Sequence representation has no qualified projection', expected: fact.expected }))
  const set = (criterion: string, status: TerminalFactCheck['status'], detail: string, actual?: unknown) => { const check = result.find(check => check.criterion === criterion); if (check) Object.assign(check, { status, detail, ...(actual === undefined ? {} : { actual }) }) }
  const display = interpretTerminal(output), expected = (criterion: string): any => required.find(fact => fact.criterion === criterion)?.expected
  if ((expected('ordered-messages') ?? []).some((message: any) => !['->>', '-->>'].includes(message.marker)) || (expected('fragments') ?? []).some((fragment: any) => fragment.nesting?.length)) { for (const check of result) check.detail = 'Nested fragments or source arrow styles require a separately qualified sequence projection'; return result }
  if (display.status !== 'available') { for (const check of result) check.detail = display.reason!; return result }
  const grid = display.cells, cell = (x: number, y: number) => grid[y]?.[x] ?? ' ', used = new Set<string>(), key = (x: number, y: number) => x + ',' + y
  if (grid.length > 256 || grid.some(row => row.length > 512) || [...display.text].filter(glyph => ['┌', '╭', '+'].includes(glyph)).length > 64) return result
  const mark = (left: number, right: number, y: number) => { for (let x = left; x <= right; x++) used.add(key(x, y)) }
  const rectangle = (box: Box) => { for (let y = box.y; y <= box.bottom; y++) mark(box.x, box.right, y) }
  const vertical = /^[│|├┤┼+]$/, boxes = terminalRectangles(grid)
  if (!boxes.length) return result
  const top = Math.min(...boxes.map(box => box.y)), headers = boxes.filter(box => box.y === top).sort((a, b) => a.x - b.x), participants = expected('participants') as { id: string; label: string }[]
  if (!participants?.length || participants.length > 16 || new Set(participants.map(item => item.label)).size !== participants.length) return result
  const labels = headers.map(box => box.lines.join('\n'))
  if (JSON.stringify(labels) !== JSON.stringify(participants.map(item => item.label))) { set('participants', 'failed', 'Header boxes differ from the exact declared participant order and labels', labels); return result }
  const actors = participants.map((item, n) => { const box = headers[n]!, attachments = Array.from({ length: box.right - box.x - 1 }, (_, col) => box.x + col + 1).filter(x => /[┬┴]/.test(cell(x, box.bottom))), below = Array.from({ length: box.right - box.x - 1 }, (_, col) => box.x + col + 1).filter(x => /[│|┆┊╎╏]/.test(cell(x, box.bottom + 1))); return { ...item, box, x: attachments.length === 1 ? attachments[0]! : below.length === 1 ? below[0]! : (box.x + box.right) / 2 } })
  if (actors.some(actor => !Number.isInteger(actor.x)) || new Set(actors.map(actor => actor.x)).size !== actors.length) return result
  for (const actor of actors) rectangle(actor.box)
  set('participants', 'passed', 'Unique top-row header boxes establish participant labels and left-to-right order', labels)
  const headerBottom = Math.max(...headers.map(box => box.bottom)), lifeline = /^[│|┆┊╎╏├┤┼]$/, solid = /^[─-]$/, dashed = /^[┈┄╌┅┉]$/
  const arrows: Record<string, number> = { '▶': 1, '►': 1, '>': 1, '→': 1, '◀': -1, '◄': -1, '<': -1, '←': -1 }
  const frameBoxes = boxes.filter(box => /^(?:\[(?:alt|loop|opt|par)\]|(?:alt|loop|opt|par):)/.test(box.lines[0] ?? ''))
  const messages: Message[] = []
  let routeUnknown = false
  for (let y = headerBottom + 1; y < grid.length; y++) for (let arrowX = 0; arrowX < grid[y]!.length; arrowX++) {
    const direction = arrows[cell(arrowX, y)]
    if (!direction || boxes.some(box => !frameBoxes.includes(box) && y >= box.y && y <= box.bottom && arrowX >= box.x && arrowX <= box.right)) continue
    if (!['▶', '►', '◀', '◄'].includes(cell(arrowX, y))) { routeUnknown = true; continue }
    const target = actors.filter(actor => actor.x === arrowX || actor.x === arrowX + direction && lifeline.test(cell(actor.x, y)))
    if (target.length !== 1) { routeUnknown = true; continue }
    let x = arrowX - direction; const stem: string[] = []
    while (x >= 0 && x < 512 && (solid.test(cell(x, y)) || dashed.test(cell(x, y)))) { stem.push(cell(x, y)); x -= direction }
    let source = actors.find(actor => actor.x === x && lifeline.test(cell(x, y)))
    if (!source) source = actors.find(actor => actor.x === x + direction && lifeline.test(cell(actor.x, y - 1)))
    if (!source || source.id === target[0]!.id || !stem.length) { routeUnknown = true; continue }
    const stroke = stem.every(glyph => solid.test(glyph)) ? '->>' : stem.every(glyph => dashed.test(glyph)) ? '-->>' : undefined
    if (!stroke) { routeUnknown = true; continue }
    const captionY = y - 1, captionCells = grid[captionY] ?? [], caption = captionCells.map((glyph, col) => actors.some(actor => actor.x === col) && lifeline.test(glyph) || vertical.test(glyph) ? ' ' : glyph).join('').trim()
    // Captions adjacent to one straight message belong to that message. A
    // fragment border, unrelated box or another arrow cannot become caption ink.
    if (!caption || /[┌┐└┘╭╮╰╯─┈┄╌▶►◀◄]/.test(caption)) { routeUnknown = true; continue }
    const left = Math.min(source.x, target[0]!.x), right = Math.max(source.x, target[0]!.x), captionStart = captionCells.findIndex((glyph, col) => glyph.trim() && !vertical.test(glyph) && !actors.some(actor => actor.x === col && lifeline.test(glyph)))
    if (captionStart < left - 1 || captionStart > right) { routeUnknown = true; continue }
    messages.push({ source: source.id, target: target[0]!.id, marker: stroke, label: caption, y, captionY, left, right }); mark(left, right, y)
    for (let col = 0; col < captionCells.length; col++) if (cell(col, captionY).trim() && !vertical.test(cell(col, captionY))) used.add(key(col, captionY))
  }
  if (new Set(messages.map(message => message.y)).size !== messages.length) routeUnknown = true
  const messageFacts = messages.map(({ source, target, marker, label }) => ({ source, target, marker, label }))
  if (!routeUnknown) set('ordered-messages', JSON.stringify(messageFacts) === JSON.stringify(expected('ordered-messages')) ? 'passed' : 'failed', 'Arrowhead and continuous drawn stem establish endpoints, stroke, caption ownership and chronological order', messageFacts)

  // Footers may repeat the participant header once at the same owned lifeline.
  const noteBoxes: Box[] = [], latestMessage = Math.max(headerBottom, ...messages.map(message => message.y))
  for (const box of boxes.filter(box => !headers.includes(box))) {
    const actor = actors.find(actor => box.lines.join('\n') === actor.label && (box.x + box.right) / 2 === actor.x)
    if (actor && box.y > latestMessage && !boxes.some(other => other !== box && other.y > latestMessage && other.y < box.y && other.lines.join('\n') === actor.label)) rectangle(box)
    else if (!frameBoxes.includes(box)) noteBoxes.push(box)
  }
  const notes = expected('owned-notes') as { position: string; actors: string[]; text: string; afterMessage: number }[] | undefined
  if (notes) {
    const actual: any[] = []; let qualified = noteBoxes.length === notes.length
    for (const [index, box] of noteBoxes.sort((a, b) => a.y - b.y).entries()) {
      const note = notes[index]
      if (!note || !note.actors.length || note.actors.some(id => !actors.some(actor => actor.id === id))) { qualified = false; continue }
      const covered = actors.filter(actor => actor.x >= box.x && actor.x <= box.right)
      const adjacent = note.position === 'right of' ? actors.filter(actor => actor.x < box.x).at(-1) : note.position === 'left of' ? actors.find(actor => actor.x > box.right) : undefined
      const owners = note.position === 'over' ? covered.map(actor => actor.id) : adjacent ? [adjacent.id] : []
      // Geometry supplies owners independently. An over-note cannot silently
      // cover extra actors; a side note cannot borrow a more distant lifeline.
      // Side notes crossing a lifeline have no qualified ownership projection.
      if (note.position !== 'over' && covered.length) qualified = false
      actual.push({ position: note.position, actors: owners, text: box.lines.join('\n'), afterMessage: messages.filter(message => message.y < box.y).length }); rectangle(box)
    }
    const expectedOwners = (note: NonNullable<typeof notes>[number]) => { const endpoints = actors.filter(actor => note.actors.includes(actor.id)); return note.position === 'over' && endpoints.length ? actors.filter(actor => actor.x >= Math.min(...endpoints.map(endpoint => endpoint.x)) && actor.x <= Math.max(...endpoints.map(endpoint => endpoint.x))).map(actor => actor.id) : note.actors }
    if (qualified) set('owned-notes', actual.every((note, n) => JSON.stringify([...note.actors].sort()) === JSON.stringify([...expectedOwners(notes[n]!)].sort()) && note.text === notes[n]!.text && note.afterMessage === notes[n]!.afterMessage) ? 'passed' : 'failed', 'Notes retain exact authored lines, chronology and geometric ownership; over-note endpoints include intervening lifelines', actual)
  }

  const frames: { kind: string; label: string; top: number; bottom: number; branches: { label: string; y: number }[] }[] = []
  const frameCaption = (raw: string) => { const text = raw.replace(/^[─\s]+|[─\s]+$/g, ''); return /^(alt|loop|opt|par)\s*\[([^\]]*)\]$/.exec(text) ?? /^\[(alt|loop|opt|par)\]\s*(.*)$/.exec(text) ?? /^\[(alt|loop|opt|par)\s+([^\]]*)\]$/.exec(text) ?? /^(alt|loop|opt|par):\s*(.*)$/.exec(text) }
  for (let y = headerBottom + 1; y < grid.length; y++) for (let left = 0; left < grid[y]!.length; left++) if (['┌', '╭'].includes(cell(left, y))) {
    const right = grid[y]!.findIndex((glyph, x) => x > left && ['┐', '╮'].includes(glyph)); if (right < 0) continue
    const inline = frameCaption(grid[y]!.slice(left + 1, right).join('')), below = frameCaption(grid[y + 1]?.slice(left + 1, right).join('').trim() ?? ''), caption = inline ?? below
    if (!caption) continue
    let bottom = y + 1
    while (bottom < grid.length && !(['└', '╰'].includes(cell(left, bottom)) && ['┘', '╯'].includes(cell(right, bottom)) && /^[─]+$/.test(grid[bottom]!.slice(left + 1, right).join('')))) bottom++
    if (bottom === grid.length) continue
    const branches: { label: string; y: number }[] = []
    let qualified = true
    for (let row = y + 1; row < bottom; row++) {
      if (!['│', '├'].includes(cell(left, row)) || !['│', '┤'].includes(cell(right, row))) { qualified = false; break }
      const interior = grid[row]!.slice(left + 1, right).join('')
      if (cell(left, row) === '├' || /^[┈┄╌─]+\[[^\]]+\][┈┄╌─]*$/.test(interior)) {
        const raw = grid[row]!.slice(left + 1, right).join('').replace(/^[─┈┄╌\s]+|[─┈┄╌\s]+$/g, ''), branch = /^\[([^\]]+)\]$/.exec(raw) ?? /^else:\s*(.*)$/.exec(raw)
        if (!branch) { qualified = false; break }; branches.push({ label: branch[1]!, y: row }); mark(left, right, row)
      }
      used.add(key(left, row)); used.add(key(right, row))
    }
    if (!qualified || messages.some(message => message.y > y && message.y < bottom && (message.left <= left || message.right >= right))) continue
    mark(left, right, y); mark(left, right, bottom); if (!inline) mark(left + 1, right - 1, y + 1)
    frames.push({ kind: caption[1]!, label: caption[2]!, top: y, bottom, branches })
  }
  if (expected('fragments')) {
    const actual: any[] = []
    for (const frame of frames.sort((a, b) => a.top - b.top)) {
      const parent = actual.length, before = (y: number) => messages.filter(message => message.y < y).length
      actual.push({ kind: frame.kind, label: frame.label, beforeMessage: before(frame.top), nesting: [], afterMessage: before(frame.bottom) })
      frame.branches.forEach((branch, index) => actual.push({ kind: 'else', label: branch.label, beforeMessage: before(branch.y), parent, afterMessage: before(frame.branches[index + 1]?.y ?? frame.bottom) }))
    }
    // Field order is irrelevant, but every field and message span is required.
    const canonical = (items: any[]) => items.map(item => [item.kind, item.label, item.beforeMessage, item.afterMessage, item.parent ?? null, item.nesting ?? null])
    if (frames.length) set('fragments', JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected('fragments'))) ? 'passed' : 'failed', 'Framed fragment and branch captions own their exact chronological message spans', actual)
  }
  for (let y = headerBottom + 1; y < grid.length; y++) for (const actor of actors) if (lifeline.test(cell(actor.x, y))) used.add(key(actor.x, y))
  const hasUnassignedInk = grid.some((row, y) => row.some((glyph, x) => glyph.trim() && !used.has(key(x, y))))
  let missingLifeline = false
  const end = Math.max(latestMessage, ...noteBoxes.map(box => box.bottom))
  for (const actor of actors) for (let y = actor.box.bottom + 1; y <= end; y++) if (!lifeline.test(cell(actor.x, y)) && !used.has(key(actor.x, y))) missingLifeline = true
  if (hasUnassignedInk || missingLifeline || routeUnknown) for (const check of result) if (check.status === 'passed') { check.status = 'unknown'; check.detail = hasUnassignedInk ? 'Unassigned ink remains outside owned participants, routes, captions, notes and fragments' : missingLifeline ? 'A participant lifeline is discontinuous in this representation' : 'A message route or caption is outside the qualified representation' }
  return result
}
