import { readFileSync } from 'node:fs'
import { evidenceBytesDigest, evidenceDigest } from '../../portable/evidence-contract.ts'
import type { DrawingCase } from './corpus.ts'
import { assessSvgLabels, assessTerminalLabels, labelPolicy, terminalLabelWorkBudget } from './labels.ts'
import { svgLabelProfile } from './svg-label-observer.ts'

const controls = [
  { name: 'visible-label', text: 'Alpha', status: 'correct' },
  { name: 'missing-label', text: 'Beta', status: 'incorrect' },
  { name: 'source-leak', text: 'Alpha flowchart LR A[Alpha]', status: 'incorrect' },
] as const
export function drawingAssessmentProfiles(formats: readonly string[]) {
  return Object.fromEntries(formats.map(format => [format, evidenceDigest({ policy: labelPolicy, controls, ...(format === 'svg' ? { profile: svgLabelProfile, visiblePaintRequired: true, glyphWitnessRequiredForOutlines: true } : { terminalRectangleWork: terminalLabelWorkBudget, displayCells: true }) })]))
}
/** Producer bytes are provenance, separate from the observable assessment policy. */
export function drawingObserverSources(formats: readonly string[]) {
  const common = ['labels.ts', 'observer-contract.ts']
  return Object.fromEntries(formats.map(format => [format, Object.fromEntries([...common, ...(format === 'svg' ? ['svg-label-observer.ts', 'svg-glyph-witness.ts', 'empty.ts', '../paint.ts'] : ['../terminal-display.ts', '../terminal-rectangles.ts'])].map(file => [file, evidenceBytesDigest(readFileSync(new URL(file, import.meta.url)))]))]))
}
export async function verifyDrawingObserver(format: string, context?: any) {
  // Independently authored source facts and counterexamples, not renderer output.
  const test = { id: 'observer-control', source: 'flowchart LR\nA[Alpha]', family: 'flowchart', expected: { nodes: [{ id: 'A', label: 'Alpha' }], edges: [] }, sourceGaps: [], terminal: { expected: { graph: { nodes: [{ id: 'A', label: 'Alpha' }], edges: [] } } } } as unknown as DrawingCase
  const observed = []
  for (const control of controls) {
    let verdict
    if (format === 'terminal') verdict = assessTerminalLabels(test, control.text)
    else {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"><text x="10" y="40" font-size="20">' + control.text + '</text></svg>'
      const page = await context.newPage()
      try { await page.setContent(svg); verdict = await assessSvgLabels(test, page, svg) } finally { await page.close() }
    }
    if (verdict.status !== control.status) throw Error('Drawing observer failed independent control: ' + format + ' ' + control.name + ' (' + verdict.status + ')')
    observed.push({ name: control.name, status: verdict.status })
  }
  return observed
}
