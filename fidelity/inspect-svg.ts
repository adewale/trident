import { inspectFidelityPaint, type PaintEvidence, type PaintInput, type QualifiedNodeAnchor } from './paint.ts'
import { inspectGraphFamilyPaint } from './paint-graph-families.ts'
import { inspectQuantitativePaint } from './paint-values.ts'
import { inspectSourceFacts, mergePaintChecks } from './paint-facts.ts'
import { inspectChartFacts } from './paint-chart-facts.ts'
import { inspectDomainFacts } from './paint-domain-facts.ts'

/** One source-owned SVG observer for collection, replay and timed outputs.
 * Each browser function inspects actual mounted ink. Graph-specific compound
 * anchors are independently re-bound to their measured SVG parts before the
 * generic route observer may use them. No renderer model or source ID is an
 * identity witness. The caller owns the page, resource policy and deadline. */
export async function inspectSvgGraph(page: { evaluate: (fn: any, input: any) => Promise<any> }, input: PaintInput & { source: string }): Promise<PaintEvidence> {
  let paint: PaintEvidence = await page.evaluate(inspectFidelityPaint, input)
  let graph: ReturnType<typeof inspectGraphFamilyPaint> = await page.evaluate(inspectGraphFamilyPaint, { ...input, paint })
  const initialGraphChecks = graph.checks
  const anchors = graph.nodes.filter((node: any) => node.anchorParts?.length) as QualifiedNodeAnchor[]
  if (anchors.length) {
    paint = await page.evaluate(inspectFidelityPaint, { ...input, qualifiedNodeAnchors: anchors })
    graph = await page.evaluate(inspectGraphFamilyPaint, { ...input, paint })
  }
  const checks = mergePaintChecks(paint.checks, initialGraphChecks, graph.checks)
  return { ...paint, nodes: graph.nodes, connections: graph.connections, groups: graph.groups, checks, complete: checks.every(check => check.status !== 'unavailable'), passed: checks.every(check => check.status === 'passed') }
}

export async function inspectSvgDrawing(page: { evaluate: (fn: any, input: any) => Promise<any> }, input: PaintInput & { source: string }): Promise<PaintEvidence> {
  const paint = await inspectSvgGraph(page, input)
  const quantitative = await page.evaluate(inspectQuantitativePaint, { ...input, labelRepresentation: paint.labelRepresentation, nodes: paint.nodes })
  const facts = await page.evaluate(inspectSourceFacts, { ...input, paint, quantitative })
  const charts = await page.evaluate(inspectChartFacts, { ...input, paint, quantitative })
  const domains = await page.evaluate(inspectDomainFacts, { ...input, paint, quantitative: [...quantitative, ...charts] })
  const checks = mergePaintChecks(paint.checks, quantitative, facts, charts, domains)
  return { ...paint, checks, complete: checks.every(check => check.status !== 'unavailable'), passed: checks.every(check => check.status === 'passed') }
}
