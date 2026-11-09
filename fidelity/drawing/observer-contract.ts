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
const htmlControls = [
  { name: 'html-font-box-overflow', height: 18, status: 'correct' },
  { name: 'html-clipped-glyphs', height: 12, status: 'incorrect' },
] as const
export function drawingAssessmentProfiles(formats: readonly string[]) {
  return Object.fromEntries(formats.map(format => [format, evidenceDigest({ policy: labelPolicy, controls: format === 'svg' ? [...controls, ...htmlControls] : controls, ...(format === 'svg' ? { profile: svgLabelProfile, visiblePaintRequired: true, glyphWitnessRequiredForOutlines: true } : { terminalRectangleWork: terminalLabelWorkBudget, displayCells: true }) })]))
}
/** Producer bytes are provenance, separate from the observable assessment policy. */
export function drawingObserverSources(formats: readonly string[]) {
  const common = ['labels.ts', 'observer-contract.ts']
  return Object.fromEntries(formats.map(format => [format, Object.fromEntries([...common, ...(format === 'svg' ? ['svg-label-observer.ts', 'svg-glyph-witness.ts', 'empty.ts', '../paint.ts'] : ['../terminal-display.ts', '../terminal-rectangles.ts'])].map(file => [file, evidenceBytesDigest(readFileSync(new URL(file, import.meta.url)))]))]))
}
export async function verifyDrawingObserver(format: string, context?: any) {
  // Independently authored source facts and counterexamples, not renderer output.
  const fixture = (label: string) => {
    const graph = { nodes: [{ id: 'A', label }], edges: [] }
    return { id: 'observer-control', source: 'flowchart LR\nA[' + label + ']', family: 'flowchart', expected: graph, sourceGaps: [], terminal: { expected: { graph } } } as unknown as DrawingCase
  }
  const test = fixture('Alpha')
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
  if (format === 'svg') for (const control of htmlControls) {
    const sample = fixture('ABC')
    const page = await context.newPage()
    try {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><foreignObject x="10" y="10" width="200" height="60"><div xmlns="http://www.w3.org/1999/xhtml" style="font:20px/20px sans-serif;white-space:nowrap;color:black;background:white;overflow:hidden;width:100px;height:${control.height}px">ABC</div></foreignObject></svg>`
      await page.setContent(svg)
      const verdict = await assessSvgLabels(sample, page, svg)
      if (verdict.status !== control.status) throw Error('Drawing observer failed independent control: svg ' + control.name + ' (' + verdict.status + ')')
      observed.push({ name: control.name, status: verdict.status })
    } finally { await page.close() }
  }
  return observed
}
