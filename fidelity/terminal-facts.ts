import { terminalRectangles } from './terminal-rectangles.ts'
import { inspectTerminalKanban } from './terminal-kanban.ts'
import { inspectTerminalSequence } from './terminal-sequence.ts'
import { interpretTerminal, terminalTextWidth } from './terminal-display.ts'
import { inspectTerminalMeaning } from './terminal.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
import type { TerminalMeaning } from './terminal.ts'

export interface TerminalFactCheck { criterion: string; status: 'passed' | 'failed' | 'unknown'; detail: string; expected: unknown; actual?: unknown }
/** Each source obligation receives a disposition. A missing family/representation
 * checker is an unknown, never an omitted obligation or a text-only pass. */
export function inspectTerminalFacts(output: string, contract: TerminalSourceContract, graph?: TerminalMeaning): TerminalFactCheck[] {
  if (contract.family === 'sequence') return inspectTerminalSequence(output, contract)
  const display = interpretTerminal(output)
  const checks = contract.facts.filter(fact => fact.required !== false).map(fact => ({ criterion: fact.criterion, expected: fact.expected, status: 'unknown' as TerminalFactCheck['status'], detail: 'No qualified observer for this source fact and output representation' }))
  if (contract.family === 'kanban') { const board = inspectTerminalKanban(output, contract); return checks.map(check => check.criterion === board.criterion ? board : check) }
  const set = (criterion: string, status: TerminalFactCheck['status'], detail: string, actual?: unknown) => { const target = checks.find(check => check.criterion === criterion); if (target) Object.assign(target, { status, detail, ...(actual === undefined ? {} : { actual }) }) }
  if (display.status !== 'available') { for (const check of checks) check.detail = display.reason ?? 'No qualified terminal state'; return checks }
  const text = display.text, lines = text.split('\n').map(line => line.trimEnd())
  if (graph) {
    if (!graph.nodes.length && !graph.edges.length && contract.facts.every(fact => fact.required === false || ['nodes', 'relationships', 'title'].includes(fact.criterion))) {
      const title = contract.facts.find(fact => fact.criterion === 'title')?.expected, body = typeof title === 'string' ? lines.filter(line => line.trim() !== title).join('\n') : text
      const blank = !body.trim(); set('nodes', blank ? 'passed' : 'failed', 'An independently empty drawing must remain empty', text); set('relationships', blank ? 'passed' : 'failed', 'Empty source contains no relationships', text)
    } else if (!graph.edges.some(edge => (edge as any).directed === false || (edge as any).endMarker || (edge as any).stroke || (edge as any).visible === false)) {
      const verdict = inspectTerminalMeaning(output, graph, { primitiveShapes: contract.facts.some(fact => fact.criterion === 'node-shapes') })
      if (verdict.status === 'correct') for (const name of ['nodes', 'relationships', 'layout-order']) set(name, 'passed', verdict.reason)
      else if (verdict.status === 'incorrect') set(/node labelled/.test(verdict.reason) ? 'nodes' : /node order/.test(verdict.reason) ? 'layout-order' : 'relationships', 'failed', verdict.reason)
      else for (const name of ['nodes', 'relationships', 'layout-order']) set(name, 'unknown', verdict.reason)
    }
  }
  if (graph && graph.nodes.length && graph.nodes.length <= 32 && display.cells.length <= 256 && display.cells.every(row => row.length <= 512) && [...text].filter(glyph => /[┌╭+◇◯◎(/▷⌜╟]/.test(glyph)).length <= 64) {
    const containers = terminalRectangles(display.cells, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true }), normalize = (value: string) => value.replace(/\s+/g, ' ').trim().normalize('NFC')
    const owned = (id: string) => { const node = graph.nodes.find(node => node.id === id); if (!node) return []; return containers.filter(box => normalize(box.lines.join(' ')) === normalize(node.label)) }
    const shapes = contract.facts.find(fact => fact.criterion === 'node-shapes')?.expected as { id: string; shape: string }[] | undefined
    if (shapes?.length && shapes.every(item => owned(item.id).length === 1)) {
      const actual = shapes.map(item => ({ id: item.id, shape: owned(item.id)[0]!.shape })), unknown = actual.some(item => item.shape?.startsWith('unqualified-')), mismatch = actual.some((item, n) => !item.shape?.startsWith('unqualified-') && item.shape !== shapes[n]!.shape)
      set('node-shapes', mismatch ? 'failed' : unknown ? 'unknown' : 'passed', 'Unique node containers retain explicit primitive boundaries or unambiguous matching shape glyphs; arbitrary decorations supply no shape credit', actual)
    }
    const breaks = contract.facts.find(fact => fact.criterion === 'node-line-breaks')?.expected as { id: string; lines: string[] }[] | undefined
    if (breaks?.length && breaks.every(item => owned(item.id).length === 1 && item.lines.every(line => normalize(line)))) {
      const actual = breaks.map(item => ({ id: item.id, lines: owned(item.id)[0]!.lines })), partitions = (rows: string[], wanted: string[]) => { const memo = new Map<string, boolean>(); const match = (row: number, at: number): boolean => { if (at === wanted.length) return row === rows.length; const key = row + ',' + at; if (memo.has(key)) return memo.get(key)!; for (let end = row + 1; end <= rows.length; end++) if (normalize(rows.slice(row, end).join(' ')) === normalize(wanted[at]!) && match(end, at + 1)) { memo.set(key, true); return true }; memo.set(key, false); return false }; return match(0, 0) }
      set('node-line-breaks', actual.every((item, n) => partitions(item.lines, breaks[n]!.lines)) ? 'passed' : 'failed', 'Each authored line retains a distinct contiguous run of display rows; soft wrapping may add rows but cannot merge an authored break', actual)
    }
  }
  if (contract.family === 'class') {
    const classes = contract.facts.find(fact => fact.criterion === 'class-bodies')?.expected as { id: string; members: string[] }[] | undefined, relations = contract.facts.find(fact => fact.criterion === 'class-relations')?.expected as unknown[] | undefined
    if (classes?.length && classes.every(item => !item.members.length && /^[\p{Letter}\p{Number}_.-]+$/u.test(item.id)) && relations?.length === 0) {
      const verdict = inspectTerminalMeaning(output, { nodes: classes.map(item => ({ id: item.id, label: item.id })), edges: [] })
      if (verdict.status === 'correct') for (const criterion of ['class-bodies', 'class-relations']) set(criterion, 'passed', 'Isolated empty classes require exact owned rectangles and no unexpected members or relationships: ' + verdict.reason)
      else if (verdict.status === 'incorrect') set(/node labelled/.test(verdict.reason) ? 'class-bodies' : 'class-relations', 'failed', verdict.reason)
    }
  }
  const title = contract.facts.find(fact => fact.criterion === 'title')?.expected
  if (typeof title === 'string') set('title', lines.filter(line => line.trim() === title).length === 1 ? 'passed' : 'unknown', 'Exact visible title needs its own line; other layouts remain unqualified')
  if (contract.family === 'pie') {
    const slices = contract.facts.find(fact => fact.criterion === 'slice-values')?.expected as { label: string; value: number }[] | undefined
    if (slices?.length) {
      const rows = lines.flatMap(line => { const m = /^\s*(.+?)\s+([█▓▒░▉▊▋▌▍▎▏]+)\s+(\d+(?:\.\d+)?)%\s*$/.exec(line); return m ? [{ label: m[1]!.trim(), bar: [...m[2]!].reduce((sum, glyph) => sum + (({ '▉': .875, '▊': .75, '▋': .625, '▌': .5, '▍': .375, '▎': .25, '▏': .125 } as Record<string, number>)[glyph] ?? 1), 0), quantum: /[▉▊▋▌▍▎▏]/.test(m[2]!) ? .125 : 1, percent: Number(m[3]), precision: m[3]!.includes('.') ? m[3]!.split('.')[1]!.length : 0 }] : [] })
      const unknownInk = lines.some(line => line.trim() && line.trim() !== title && !/^\s*(.+?)\s+([█▓▒░▉▊▋▌▍▎▏]+)\s+(\d+(?:\.\d+)?)%\s*$/.test(line))
      if (rows.length && !unknownInk) {
        const total = slices.reduce((sum, item) => sum + item.value, 0)
        const exactLabels = rows.length === slices.length && rows.every(row => slices.filter(slice => slice.label === row.label).length === 1) && new Set(rows.map(row => row.label)).size === rows.length
        const quantum = Math.min(...rows.map(row => row.quantum))
        let lowerScale = 0, upperScale = Infinity
        if (exactLabels) for (const row of rows) { const value = slices.find(slice => slice.label === row.label)!.value; if (!(value > 0)) { upperScale = -1; break }; lowerScale = Math.max(lowerScale, row.bar === quantum ? 0 : (row.bar - quantum / 2) / value); upperScale = Math.min(upperScale, (row.bar + quantum / 2) / value) }
        const values = exactLabels && total > 0 && lowerScale <= upperScale && rows.every(row => { const expected = slices.find(slice => slice.label === row.label)!; return Math.abs(row.percent - 100 * expected.value / total) <= .5 * 10 ** -row.precision + 1e-8 })
        const unresolvedWeight = values && new Set(slices.map(slice => slice.value)).size > 1 && new Set(rows.map(row => row.bar)).size === 1
        set('slice-values', unresolvedWeight ? 'unknown' : values ? 'passed' : 'failed', 'Owned label/bar/percentage rows share one feasible scale, nearest displayed-quantum rounding and an explicit minimum visible bar (whole cell or eighth-block); unequal weights with indistinguishable bars cannot prove drawn proportions', rows)
      }
    }
  }
  if (contract.family === 'journey') {
    const tasks = contract.facts.find(fact => fact.criterion === 'journey-tasks')?.expected as { section: string; label: string; score: number; actors: string[] }[] | undefined
    const actual: any[] = [], sections: string[] = []; let section = '', orphanInk = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim(), group = /^\[([^\]]+)\]$/.exec(line), task = /^([●○]{5})\s+(.+)$/.exec(line)
      if (group) { section = group[1]!; sections.push(section) }
      else if (task) { const owner = /^by\s+(.+)$/.exec(lines[i + 1]?.trim() ?? ''); actual.push({ section, label: task[2], score: [...task[1]!].filter(value => value === '●').length, actors: owner?.[1]!.split(',').map(actor => actor.trim()) ?? [] }); if (owner) i++ }
      else if (/^by\s+/.test(line)) orphanInk = true
    }
    const unknownInk = lines.some(line => line.trim() && line.trim() !== title && !/^\s*\[[^\]]+\]\s*$/.test(line) && !/^\s*[●○]{5}\s+.+$/.test(line) && !/^\s*by\s+.+$/.test(line))
    const canonical = (items: typeof actual) => items.map(item => ({ ...item, actors: [...item.actors].sort() }))
    if (actual.length && !unknownInk && !orphanInk && JSON.stringify(sections) === JSON.stringify([...new Set((tasks ?? []).map(task => task.section))])) set('journey-tasks', JSON.stringify(canonical(actual)) === JSON.stringify(canonical(tasks ?? [])) ? 'passed' : 'failed', 'Ordered task rows own five explicit score cells and the following actor row within a visible section', actual)
  }
  if (contract.family === 'timeline') {
    const expected = contract.facts.find(fact => fact.criterion === 'timeline-periods')?.expected, actual: any[] = [], sections: string[] = []; let section = '', qualified = false, orphanInk = false
    for (const raw of lines) {
      const line = raw.trim(), group = /^\[([^\]]+)\]$/.exec(line), period = /^[○●]\s+(\S.*)$/.exec(line), event = /^│\s*[├└]─\s*(.+)$/.exec(line)
      if (group) { section = group[1]!; sections.push(section) }
      else if (period) { qualified = true; actual.push({ section, label: period[1], events: [] }) }
      else if (event && actual.length) actual.at(-1)!.events.push(event[1])
      else if (event) orphanInk = true
    }
    const unknownInk = lines.some(line => line.trim() && line.trim() !== title && !/^\s*\[[^\]]+\]\s*$/.test(line) && !/^\s*[○●]\s+\S.*$/.test(line) && !/^\s*│\s*[├└]─\s*.+$/.test(line))
    if (qualified && !unknownInk && !orphanInk && JSON.stringify(sections) === JSON.stringify([...new Set((expected as any[] ?? []).map(period => period.section))])) set('timeline-periods', JSON.stringify(actual) === JSON.stringify(expected) ? 'passed' : 'failed', 'Visible section headers, period bullets and owned tree-stroke event rows retain order and membership', actual)
  }
  return checks
}
/** This controls a labelled diagnostic subset only. It never removes a source
 * from the full drawing inventory or supplies any output pass. */
export function terminalSourceObservable(contract: TerminalSourceContract, graph?: TerminalMeaning) {
  if (contract.sourceUncertainties.length) return false
  const supported = contract.family === 'flowchart' ? ['nodes', 'relationships', 'layout-order', 'node-shapes', 'node-line-breaks'] : contract.family === 'pie' ? ['title', 'slice-values'] : contract.family === 'journey' ? ['title', 'journey-tasks'] : contract.family === 'timeline' ? ['title', 'timeline-periods'] : contract.family === 'sequence' ? ['participants', 'ordered-messages', 'owned-notes', 'fragments'] : contract.family === 'kanban' ? ['kanban-hierarchy'] : contract.family === 'class' ? ['class-bodies', 'class-relations'] : []
  if (contract.facts.some(fact => fact.required !== false && !supported.includes(fact.criterion))) return false
  if (contract.family === 'class') { const classes = contract.facts.find(fact => fact.criterion === 'class-bodies')?.expected as any[] ?? [], relations = contract.facts.find(fact => fact.criterion === 'class-relations')?.expected as any[] ?? []; if (!classes.length || classes.length > 32 || classes.some(item => item.members.length || !/^[\p{Letter}\p{Number}_.-]+$/u.test(item.id)) || relations.length) return false }
  if (contract.family === 'sequence' && (contract.facts.find(fact => fact.criterion === 'ordered-messages')?.expected as any[] ?? []).some(message => !['->>', '-->>'].includes(message.marker))) return false
  if (contract.family === 'sequence' && (contract.facts.find(fact => fact.criterion === 'fragments')?.expected as any[] ?? []).some(fragment => fragment.nesting?.length)) return false
  if (graph && (graph.nodes.length > 32 || new Set(graph.nodes.map(node => node.label)).size !== graph.nodes.length || graph.nodes.some(node => !node.label || terminalTextWidth(node.label) > 510 || /[\x00-\x1f]/.test(node.label)) || graph.edges.some(edge => /[\n\r]/.test(edge.label ?? '') || (edge as any).directed === false || (edge as any).endMarker || (edge as any).stroke || (edge as any).visible === false))) return false
  return supported.length > 0
}
