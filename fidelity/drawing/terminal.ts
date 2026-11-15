import { assessTerminalDrawing } from '../terminal-assessment.ts'
import { interpretTerminal } from '../terminal-display.ts'
import { terminalRectangles } from '../terminal-rectangles.ts'
import { inspectTerminalMeaning } from '../terminal.ts'
import type { DrawingCase } from './corpus.ts'

export interface TerminalGeometryCheck { criterion: string; status: 'passed' | 'failed' | 'unassessed'; detail: string }

/** Per-criterion regression geometry on an actual terminal drawing. Each
 * criterion fails only on observed owned frames/routes; anything without
 * uniquely owned frames or traced routes stays unassessed. */
export function inspectTerminalRegressionGeometry(test: Pick<DrawingCase, 'geometry' | 'terminal'>, text: string): TerminalGeometryCheck[] {
  const graph = test.terminal.expected.graph,
    display = interpretTerminal(text)
  const all = (detail: string) => test.geometry.map(criterion => ({ criterion, status: 'unassessed' as const, detail }))
  if (!graph || display.status !== 'available') return all('Regression geometry has no qualified terminal ownership')
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().normalize('NFC')
  const containers = terminalRectangles(display.cells, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true, cornerPorts: true })
  const labels = containers.map(b => normalize(b.lines.join(' ')))
  const nodes = graph.nodes.map(n => { const label = normalize(n.label); return { ...n, matches: containers.filter((_b, i) => labels[i] === label) } })
  if (nodes.some(n => n.matches.length !== 1)) return all('Regression geometry requires uniquely owned node frames')
  const boxes = nodes.map(n => ({ id: n.id, ...n.matches[0]! }))
  const failed = new Set<string>(), unknown = new Set<string>()
  const routes = inspectTerminalMeaning(text, graph, { primitiveShapes: true })
  for (const criterion of test.geometry) {
    if (criterion === 'distinct-node-bodies') {
      if (boxes.some((a, i) => boxes.slice(i + 1).some(b => Math.min(a.right, b.right) > Math.max(a.x, b.x) && Math.min(a.bottom, b.bottom) > Math.max(a.y, b.y)))) failed.add(criterion)
    } else if (criterion === 'edge-node-clearance' || criterion === 'orthogonal-node-approach') {
      if (routes.status !== 'correct' || !routes.edges.length) {
        unknown.add(criterion)
        continue
      }
      for (const edge of routes.edges) {
        if (!edge.route?.length) {
          unknown.add(criterion)
          continue
        }
        if (criterion === 'edge-node-clearance') {
          if (edge.route.some(p => boxes.some(b => b.id !== edge.source && b.id !== edge.target && p.x > b.x && p.x < b.right && p.y > b.y && p.y < b.bottom))) failed.add(criterion)
        } else {
          const b = boxes.find(n => n.id === edge.target),
            head = edge.route[0]!
          if (!b) {
            unknown.add(criterion)
            continue
          }
          const glyph = display.cells[head.y]?.[head.x] ?? ''
          const normal =
            (head.x <= b.x && head.y > b.y && head.y < b.bottom && /[▶►>→▷]/.test(glyph)) ||
            (head.x >= b.right && head.y > b.y && head.y < b.bottom && /[◀◄<←◁]/.test(glyph)) ||
            (head.y <= b.y && head.x > b.x && head.x < b.right && /[▼v↓▽]/.test(glyph)) ||
            (head.y >= b.bottom && head.x > b.x && head.x < b.right && /[▲^↑△]/.test(glyph))
          if (!normal) unknown.add(criterion)
        }
      }
    } else unknown.add(criterion)
  }
  return test.geometry.map(criterion => failed.has(criterion)
    ? { criterion, status: 'failed' as const, detail: 'Observed owned frames or routes violate ' + criterion }
    : unknown.has(criterion) ? { criterion, status: 'unassessed' as const, detail: 'Regression geometry unqualified: ' + criterion }
    : { criterion, status: 'passed' as const, detail: 'Observed owned frames and traced routes satisfy ' + criterion })
}

/** Regression geometry is an additional obligation, never implied by labels. */
export function assessTextDrawing(test: DrawingCase, text: string) {
  const base = assessTerminalDrawing(test.terminal, text)
  if (!test.geometry.length || base.status !== 'correct') return base
  const checks = inspectTerminalRegressionGeometry(test, text)
  const ownership = checks.find(c => c.status === 'unassessed' && !c.detail.startsWith('Regression geometry unqualified'))
  if (ownership) return { ...base, status: 'unknown', reason: ownership.detail }
  const failed = checks.filter(c => c.status === 'failed').map(c => c.criterion), unknown = checks.filter(c => c.status === 'unassessed').map(c => c.criterion)
  return {
    ...base,
    status: failed.length ? 'incorrect' : unknown.length ? 'unknown' : 'correct',
    reason: failed.length ? 'Regression geometry failed: ' + failed.join(', ') : unknown.length ? 'Regression geometry unqualified: ' + unknown.join(', ') : 'Every source fact and required terminal regression geometry passed',
  }
}
