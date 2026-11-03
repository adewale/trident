import { inspectEmptySvgDrawing } from './empty.ts'
import type { DrawingCase } from './corpus.ts'
import { plannedPaintCriteria, type PaintCheck, type PaintEvidence } from '../paint.ts'
import { plannedQuantitativeCriteria } from '../paint-values.ts'
import { inspectSvgDrawing as observeSvg } from '../inspect-svg.ts'
import { plannedSourceFactCriteria, mergePaintChecks } from '../paint-facts.ts'

export function wholeDrawing(checks: Pick<PaintCheck, 'criterion' | 'status'>[], required: string[], sourceGaps: string[] = []) {
  required = required.filter(key => key !== 'svg-unique-ids')
  const relevant = required.map(key => checks.find(c => c.criterion === key))
  const failed = relevant.filter(c => c?.status === 'failed').map(c => c!.criterion)
  const unknown = required.filter((_key, i) => !relevant[i] || !['passed', 'failed'].includes(relevant[i]!.status))
  return { status: sourceGaps.length ? 'unknown' : failed.length ? 'incorrect' : unknown.length || !required.length ? 'unknown' : 'correct', failed, unknown, sourceGaps }
}
/** Samples the actual stroked route, including curved paths. It uses no renderer IDs. */
export function inspectRegressionGeometry(input: { paint: PaintEvidence; geometry: string[]; layout?: any[] }): PaintCheck[] {
  const nodes = input.paint.nodes as any[],
    routes = input.paint.connections as any[],
    checks: PaintCheck[] = []
  const add = (criterion: string, passed: boolean | null, actual: unknown) => checks.push({ criterion, status: passed === null ? 'unavailable' : passed ? 'passed' : 'failed', expected: true, actual, scope: 'Measured source-owned node boxes and actual painted route geometry' })
  const inside = (b: any, p: any, inset = 1) => p.x > b.x + inset && p.y > b.y + inset && p.x < b.x + b.width - inset && p.y < b.y + b.height - inset
  if (input.geometry.includes('distinct-node-bodies')) {
    const collisions = nodes.flatMap((a, i) =>
      nodes
        .slice(i + 1)
        .filter(b => Math.min(a.box.x + a.box.width, b.box.x + b.box.width) - Math.max(a.box.x, b.box.x) > 2 && Math.min(a.box.y + a.box.height, b.box.y + b.box.height) - Math.max(a.box.y, b.box.y) > 2)
        .map(b => [a.id, b.id]),
    )
    add('distinct-node-bodies', nodes.length ? !collisions.length : null, collisions)
  }
  for (const criterion of ['edge-node-clearance', 'orthogonal-node-approach'])
    if (input.geometry.includes(criterion)) {
      let unavailable = !routes.length,
        bad: any[] = []
      for (const route of routes) {
        const candidates = [...document.querySelectorAll('svg path,svg polyline,svg line')].filter((p: any) => {
          if (p.closest('defs,marker,clipPath') || !p.getTotalLength || getComputedStyle(p).stroke === 'none' || p.getAttribute('d')?.trim().endsWith('Z')) return false
          const m = p.getScreenCTM()
          if (!m || !route.start || !route.end) return false
          const a = p.getPointAtLength(0).matrixTransform(m),
            b = p.getPointAtLength(p.getTotalLength()).matrixTransform(m)
          return Math.hypot(a.x - route.start.x, a.y - route.start.y) < 2 && Math.hypot(b.x - route.end.x, b.y - route.end.y) < 2
        }) as SVGGeometryElement[]
        if (candidates.length !== 1) {
          unavailable = true
          continue
        }
        const path = candidates[0]!,
          m = path.getScreenCTM()!,
          length = path.getTotalLength(),
          at = (t: number) => path.getPointAtLength(t).matrixTransform(m)
        if (criterion === 'edge-node-clearance') {
          const others = nodes.filter(n => ![route.source, route.target].includes(n.id)),
            samples = Math.min(10000, Math.ceil(length * 2))
          for (let j = 1; j < samples; j++) {
            const p = at((length * j) / samples),
              hit = others.find(n => inside(n.box, p))
            if (hit) {
              bad.push({ source: route.source, target: route.target, obstructedBy: hit.id })
              break
            }
          }
        } else {
          const target = nodes.find(n => n.id === route.target)
          if (!target) {
            unavailable = true
            continue
          }
          const end = at(length),
            before = at(Math.max(0, length - 1)),
            b = target.box
          const sides = [
            { distance: Math.abs(end.x - b.x), vertical: false },
            { distance: Math.abs(end.x - b.x - b.width), vertical: false },
            { distance: Math.abs(end.y - b.y), vertical: true },
            { distance: Math.abs(end.y - b.y - b.height), vertical: true },
          ].sort((a, b) => a.distance - b.distance)
          if (Math.abs(sides[0]!.distance - sides[1]!.distance) < 1) {
            unavailable = true
            continue
          }
          const dx = Math.abs(end.x - before.x),
            dy = Math.abs(end.y - before.y)
          if (sides[0]!.vertical ? dx > dy * 0.25 : dy > dx * 0.25) bad.push({ source: route.source, target: route.target, dx, dy })
        }
      }
      add(criterion, bad.length ? false : unavailable ? null : true, bad)
    }
  if (input.layout?.length) {
    const bad: any[] = []
    let unknown = false
    for (const item of input.layout) {
      const a = nodes.find(n => n.id === item.before),
        b = nodes.find(n => n.id === item.after)
      if (!a || !b) {
        unknown = true
        continue
      }
      const axis = item.axis === 'x' ? 'x' : 'y'
      if (a.box[axis] >= b.box[axis]) bad.push(item)
    }
    add('seed:layout-order', bad.length ? false : unknown ? null : true, bad)
  }
  return checks
}
export async function inspectSvgDrawing(page: any, test: DrawingCase) {
  if (test.family === 'flowchart' && test.terminal.expected.graph?.nodes.length === 0 && test.terminal.expected.graph.edges.length === 0 && !test.terminal.expected.graph.groups?.length && !test.expected.groups?.length && !Object.keys(test.expected.facts ?? {}).length) return inspectEmptySvgDrawing(page, test)
  const paint = await observeSvg(page, test)
  const layout = test.terminal.expected.contract?.facts.find(f => f.criterion === 'layout-order' && f.required !== false)?.expected as any[] | undefined
  const geometry = await page.evaluate(inspectRegressionGeometry, { paint, geometry: test.geometry, layout })
  const checks = mergePaintChecks(paint.checks, geometry)
  // A topology mismatch needs qualified endpoint ownership. Grid/glyph and
  // other unrecognized body representations are observer gaps, not proof
  // that a renderer omitted or reversed an edge.
  if (test.expected.nodes?.length && paint.checks.find((c: PaintCheck) => c.criterion === 'painted-node-visibility')?.status !== 'passed') {
    const dependent = new Set(['painted-relationships', 'painted-relationship-markers', 'painted-relationship-label-counts', 'painted-relationship-label-ownership', 'edge-node-clearance', 'orthogonal-node-approach', 'distinct-node-bodies'])
    for (const check of checks)
      if ((dependent.has(check.criterion) || check.criterion.startsWith('source-fact:')) && check.status === 'failed') {
        check.status = 'unavailable'
        check.scope = 'Endpoint body/paint ownership is unqualified for this representation; topology failure is not established'
      }
  }
  for (const check of checks)
    if (check.criterion === 'painted-node-ownership' && check.status === 'failed' && (test.family !== 'flowchart' || /^\s*---/.test(test.source))) {
      check.status = 'unavailable'
      check.scope = 'Additional body-caption ownership needs a qualified family representation; the generic observer cannot establish an extra source object'
    }
  const required = [...new Set([...plannedPaintCriteria(test).filter(key => key !== 'svg-unique-ids'), ...plannedQuantitativeCriteria(test), ...plannedSourceFactCriteria(test), ...test.geometry, ...(layout?.length ? ['seed:layout-order'] : [])])]
  return { ...wholeDrawing(checks, required, test.sourceGaps), checks, paint, required }
}
