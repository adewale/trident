import { assessTerminalDrawing } from '../terminal-assessment.ts'
import { interpretTerminal } from '../terminal-display.ts'
import { terminalRectangles } from '../terminal-rectangles.ts'
import { inspectTerminalMeaning } from '../terminal.ts'
import type { DrawingCase } from './corpus.ts'

/** Regression geometry is an additional obligation, never implied by labels. */
export function assessTextDrawing(test: DrawingCase, text: string) {
  const base = assessTerminalDrawing(test.terminal, text)
  if (!test.geometry.length || base.status !== 'correct') return base
  const graph = test.terminal.expected.graph,
    display = interpretTerminal(text)
  if (!graph || display.status !== 'available') return { ...base, status: 'unknown', reason: 'Regression geometry has no qualified terminal ownership' }
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().normalize('NFC')
  const containers = terminalRectangles(display.cells, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true, cornerPorts: true })
  const nodes = graph.nodes.map(n => ({ ...n, matches: containers.filter(b => normalize(b.lines.join(' ')) === normalize(n.label)) }))
  if (nodes.some(n => n.matches.length !== 1)) return { ...base, status: 'unknown', reason: 'Regression geometry requires uniquely owned node frames' }
  const boxes = nodes.map(n => ({ id: n.id, ...n.matches[0]! })),
    failed: string[] = [],
    unknown: string[] = []
  const routes = inspectTerminalMeaning(text, graph, { primitiveShapes: true })
  for (const criterion of test.geometry) {
    if (criterion === 'distinct-node-bodies') {
      if (boxes.some((a, i) => boxes.slice(i + 1).some(b => Math.min(a.right, b.right) > Math.max(a.x, b.x) && Math.min(a.bottom, b.bottom) > Math.max(a.y, b.y)))) failed.push(criterion)
    } else if (criterion === 'edge-node-clearance' || criterion === 'orthogonal-node-approach') {
      if (routes.status !== 'correct' || !routes.edges.length) {
        unknown.push(criterion)
        continue
      }
      for (const edge of routes.edges) {
        if (!edge.route?.length) {
          unknown.push(criterion)
          continue
        }
        if (criterion === 'edge-node-clearance') {
          if (edge.route.some(p => boxes.some(b => b.id !== edge.source && b.id !== edge.target && p.x > b.x && p.x < b.right && p.y > b.y && p.y < b.bottom))) failed.push(criterion)
        } else {
          const b = boxes.find(n => n.id === edge.target),
            head = edge.route[0]!
          if (!b) {
            unknown.push(criterion)
            continue
          }
          const glyph = display.cells[head.y]?.[head.x] ?? ''
          const normal =
            (head.x <= b.x && head.y > b.y && head.y < b.bottom && /[▶►>→▷]/.test(glyph)) ||
            (head.x >= b.right && head.y > b.y && head.y < b.bottom && /[◀◄<←◁]/.test(glyph)) ||
            (head.y <= b.y && head.x > b.x && head.x < b.right && /[▼v↓▽]/.test(glyph)) ||
            (head.y >= b.bottom && head.x > b.x && head.x < b.right && /[▲^↑△]/.test(glyph))
          if (!normal) unknown.push(criterion)
        }
      }
    } else unknown.push(criterion)
  }
  return {
    ...base,
    status: failed.length ? 'incorrect' : unknown.length ? 'unknown' : 'correct',
    reason: failed.length ? 'Regression geometry failed: ' + [...new Set(failed)].join(', ') : unknown.length ? 'Regression geometry unqualified: ' + [...new Set(unknown)].join(', ') : 'Every source fact and required terminal regression geometry passed',
  }
}
