import type { MeaningExpectation } from '../meaning.ts'
import type { StructureCheck } from './structure.ts'

/** Browser-serializable box constraints, after the caller has independently
 * qualified visible labels and the actual point inventory/coordinates. These
 * measure layout clearance, not pixel occlusion or an aesthetic score. */
export function inspectQuadrantClearance(expected: MeaningExpectation): StructureCheck[] {
  const svg = document.querySelector('svg'), facts = expected.facts as any
  const unavailable = (detail: string): StructureCheck[] => [{ criterion: 'quadrant-box-clearance', status: 'unassessed', detail }]
  if (!svg || !Array.isArray(facts?.points)) return unavailable('No independent quadrant point contract')
  const norm = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim()
  const box = (e: Element) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
  const texts = [...svg.querySelectorAll('text')].filter(e => !e.closest('defs,marker,clipPath,mask,title,desc'))
  const wanted = [...facts.points.map((p: any) => ({ label: p.label, role: 'point' })), ...(facts.quadrants ?? []).map((q: any) => ({ label: q.label, role: 'caption' }))]
  const owned: { label: string; role: string; box: ReturnType<typeof box> }[] = []
  const used = new Set<Element>()
  for (const item of wanted) {
    const matches = texts.filter(e => norm(e.textContent ?? '') === norm(item.label))
    if (matches.length !== 1 || used.has(matches[0]!)) return unavailable('Label ownership is ambiguous or uses an unqualified representation: ' + item.label)
    const e = matches[0]!, bounds = box(e)
    for (let owner: Element | null = e; owner; owner = owner.parentElement) {
      const css = getComputedStyle(owner)
      if (css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || Number(css.opacity) !== 1 || css.filter !== 'none' || css.maskImage !== 'none' || css.clipPath !== 'none') return unavailable('Unqualified label visibility/paint effects')
      if (owner === svg) break
    }
    if (!(bounds.width > 0 && bounds.height > 0)) return unavailable('No positive label bounds')
    used.add(e); owned.push({ ...item, box: bounds })
  }
  const markers = [...svg.querySelectorAll('circle')].filter(e => !e.closest('defs,marker,clipPath,mask')).filter(e => {
    const b = box(e), css = getComputedStyle(e)
    return b.width > 0 && b.height > 0 && css.display !== 'none' && !['hidden', 'collapse'].includes(css.visibility) && Number(css.opacity) > 0 && (css.fill !== 'none' || css.stroke !== 'none')
  })
  if (markers.length !== facts.points.length) return unavailable('Visible marker inventory needs review')
  const overlaps = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1
  const labels: { first: string; second: string }[] = [], dots: { marker: number; label: string; role: string }[] = []
  for (let i = 0; i < owned.length; i++) for (let j = i + 1; j < owned.length; j++) if (overlaps(owned[i]!.box, owned[j]!.box)) labels.push({ first: owned[i]!.label, second: owned[j]!.label })
  markers.forEach((marker, index) => { for (const label of owned) if (overlaps(box(marker), label.box)) dots.push({ marker: index, label: label.label, role: label.role }) })
  return [
    { criterion: 'quadrant-label-box-clearance', status: labels.length ? 'failed' : 'passed', detail: 'Uniquely owned point and section-caption text boxes must not overlap by more than one CSS pixel on both axes', actual: labels },
    { criterion: 'quadrant-marker-box-clearance', status: dots.length ? 'failed' : 'passed', detail: 'Qualified visible point-marker boxes must not overlap point or section-caption text boxes by more than one CSS pixel on both axes', actual: dots },
  ]
}
