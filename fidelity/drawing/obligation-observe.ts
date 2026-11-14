/** Run the existing observers that decide source obligations on one retained
 * drawing. Structure, layout and regression-geometry observers are reused as
 * they are; this glue only decides which of them a case needs. */
import type { DrawingCase } from './corpus.ts'
import { assessTerminalStructure, observeSvgStructure, type StructureAssessment } from './structure.ts'
import { inspectRegressionGeometry } from './svg.ts'
import { inspectTerminalRegressionGeometry } from './terminal.ts'
import { observeSvgLayout, unavailableLayout, type LayoutObservation } from './layout-svg.ts'
import { admittedQuantitativeCriteria, sourceObligations, type ObligationCheck, type ObligationEvidence } from './obligations.ts'
import { inspectSvgDrawing } from '../inspect-svg.ts'
import { plannedQuantitativeCriteria } from '../paint-values.ts'
import type { PaintCheck, PaintEvidence } from '../paint.ts'

export type ObservedObligations = Omit<ObligationEvidence, 'producerStatus'> & { structure: StructureAssessment }
const status = (value: string): ObligationCheck['status'] => value === 'passed' ? 'passed' : value === 'failed' ? 'failed' : 'unassessed'

/** Orthogonal approach is read from the same paint evidence the structure
 * observer qualified. As in the full SVG drawing assessment, a failure needs
 * qualified node visibility; otherwise it is not established. */
export async function svgRegressionGeometry(page: any, test: Pick<DrawingCase, 'geometry' | 'expected'>, paint: PaintEvidence | undefined, criteria: readonly string[]): Promise<ObligationCheck[]> {
  if (!criteria.length) return []
  if (!paint) return criteria.map(criterion => ({ criterion, status: 'unassessed', detail: 'No qualified paint evidence for regression geometry' }))
  const checks: PaintCheck[] = await page.evaluate(inspectRegressionGeometry, { paint, geometry: [...criteria] })
  const visible = !test.expected.nodes?.length || paint.checks.find(c => c.criterion === 'painted-node-visibility')?.status === 'passed'
  return criteria.map(criterion => {
    const check = checks.find(c => c.criterion === criterion)
    if (!check) return { criterion, status: 'unassessed', detail: 'Regression geometry observer returned no check' }
    if (check.status === 'failed' && !visible) return { criterion, status: 'unassessed', detail: 'Endpoint body/paint ownership is unqualified for this representation; geometry failure is not established' }
    return { criterion, status: status(check.status), detail: (check.status === 'passed' ? '' : check.status === 'failed' ? 'Failed: ' : 'Unavailable: ') + check.scope + (check.status === 'failed' ? ': ' + JSON.stringify(check.actual).slice(0, 200) : '') }
  })
}

const layoutObligations = ['distinct-node-bodies', 'edge-node-clearance']
/** Whether a case needs the flowchart layout observer for its obligations. */
export const needsLayoutObserver = (test: Pick<DrawingCase, 'family' | 'geometry'>) => test.family === 'flowchart' && test.geometry.some(g => layoutObligations.includes(g))

export async function observeSvgObligations(test: DrawingCase, page: any, layout?: () => Promise<LayoutObservation>): Promise<ObservedObligations> {
  return completeSvgObligations(test, page, await observeSvgStructure(test, page), layout)
}

/** Add regression geometry and layout observations to a structure observation
 * already made on the same mounted page. */
export async function completeSvgObligations(test: DrawingCase, page: any, { assessment, paint }: { assessment: StructureAssessment; paint?: PaintEvidence }, layout?: () => Promise<LayoutObservation>): Promise<ObservedObligations> {
  const regression = await svgRegressionGeometry(page, test, paint, test.geometry.filter(g => g === 'orthogonal-node-approach'))
  let observedLayout: LayoutObservation | null = null
  if (needsLayoutObserver(test)) {
    try { observedLayout = layout ? await layout() : unavailableLayout('No layout observation context', test) }
    catch (error) { observedLayout = unavailableLayout('Layout observer could not assess SVG: ' + String(error), test) }
  }
  return { structure: assessment, layout: observedLayout, regression, quantitative: await svgQuantitativeGeometry(page, test) }
}

/** Chart values encoded as geometry, read by the existing quantitative paint
 * observer, only for criteria admitted with independent controls. The quadrant
 * coordinate check already comes from the structure observer. */
export async function svgQuantitativeGeometry(page: any, test: DrawingCase): Promise<ObligationCheck[]> {
  if (test.sourceGaps.length || !sourceObligations(test).some(o => o.category === 'geometry')) return []
  const planned = plannedQuantitativeCriteria(test).filter(c => admittedQuantitativeCriteria.includes(c) && c !== 'painted-quadrant-coordinates')
  if (!planned.length) return []
  const paint = await inspectSvgDrawing(page, { family: test.family, source: test.source, expected: test.expected })
  return planned.map(criterion => {
    const check = paint.checks.find(c => c.criterion === criterion)
    return check ? { criterion, status: status(check.status), detail: check.scope } : { criterion, status: 'unassessed', detail: 'Quantitative observer returned no check' }
  })
}

export function observeTerminalObligations(test: DrawingCase, text: string): ObservedObligations {
  return { structure: assessTerminalStructure(test, text), regression: test.geometry.length ? inspectTerminalRegressionGeometry(test, text) : [] }
}

/** Mount an SVG in a fixed-viewport page and observe its layout, as layout:observe does. */
export async function observeLayoutInContext(context: any, test: DrawingCase, svg: string, deadline = 8000): Promise<LayoutObservation> {
  const page = await context.newPage()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await page.setContent('<!doctype html><style>body{margin:0}</style>' + svg, { timeout: deadline })
    return await Promise.race([observeSvgLayout(page, test), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('Layout observer deadline exceeded')), deadline) })])
  } finally { clearTimeout(timer); await page.close() }
}
