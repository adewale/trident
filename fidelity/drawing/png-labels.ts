/**
 * Drawing Correctness for a project whose own public interface draws only PNG.
 *
 * The reviewed label contract is the SVG and terminal lanes' contract
 * (compileLabelPlan). A label-blind raster reader (png_text_reader.py) reads the
 * text the pixels show; this module judges those readings. The PNG observer is
 * weaker than the SVG and terminal observers, and its profile name says so:
 * OCR can show that a label is present, but a label it does not read may still
 * be drawn, and raw source syntax it does not read may still be shown. So:
 *   - correct: every label is read whole, in confident words (Tesseract word
 *     confidence ≥ 90), and no raw source syntax is read. Absence of raw syntax
 *     is observed, not proved: that is the "presence-only" in the profile name.
 *   - incorrect: only from positive pixel evidence: raw source syntax read
 *     confidently, a uniform raster where a drawing is required, or
 *     differentiated ink where the correct drawing is empty.
 *   - unknown: every unread, weakly read or ambiguous label. A missing label
 *     is never a failure in this lane.
 * Labels made only of glyphs OCR confuses (I, l, 1, |, O, 0, ...) earn no credit.
 */
import type { DrawingCase } from './corpus.ts'
import { compileLabelPlan, squash, visibleForms, type LabelPlan, type LabelVerdict } from './labels.ts'

export const pngLabelProfile = 'png-ocr-presence-only-v1'
export const pngWordConfidence = 90
type Box = readonly [number, number, number, number]
export interface PngWord { text: string; conf: number; box: readonly number[] }
export interface PngLine { box: Box; words: readonly PngWord[] }
export interface PngReading { status: 'observed' | 'unknown'; reason?: string; uniform?: boolean; width?: number; height?: number; lines?: readonly PngLine[] }

const word = /[\p{L}\p{N}]/u
const ambiguous = /^[Il1|!i.,:;'`´"\-_–—oO0°]+$/u
const confident = (w: PngWord) => w.conf >= pngWordConfidence

/** Lines that can continue a label: the next text on the same row, or a wrapped
 * row directly below that overlaps it horizontally. */
function successors(lines: readonly PngLine[]) {
  return lines.map(a => lines.flatMap((b, j) => {
    if (a === b) return []
    const ha = a.box[3] - a.box[1], hb = b.box[3] - b.box[1], hh = Math.max(ha, hb)
    const sameRow = Math.min(a.box[3], b.box[3]) - Math.max(a.box[1], b.box[1]) >= 0.5 * Math.min(ha, hb) && b.box[0] - a.box[2] >= 0 && b.box[0] - a.box[2] <= hh * 1.5
    const wrapped = b.box[1] - a.box[3] >= 0 && b.box[1] - a.box[3] <= hh * 0.8 && Math.min(a.box[2], b.box[2]) > Math.max(a.box[0], b.box[0])
    return sameRow || wrapped ? [j] : []
  }))
}

/** A label is read when a run of confident words, contiguous within lines and
 * continuing only onto successor lines, spells it exactly (whitespace aside).
 * Only punctuation may adjoin it inside the first or last word: "A[Alpha]" does
 * not read "Alpha". */
export function readsLabel(label: string, lines: readonly PngLine[]) {
  const next = successors(lines)
  return visibleForms(label).some(form => {
    const target = squash(form)
    if (!target || ambiguous.test(target)) return false
    const done = (acc: string) => {
      const at = acc.indexOf(target)
      return at >= 0 && !word.test(acc.slice(0, at)) && !word.test(acc.slice(at + target.length))
    }
    const viable = (acc: string) => { const stripped = acc.replace(/^[^\p{L}\p{N}]+/u, ''); return target.startsWith(acc) || target.startsWith(stripped) || done(acc) }
    const extend = (line: number, from: number, acc: string, depth: number): boolean => {
      const words = lines[line]!.words
      for (let k = from; k < words.length; k++) {
        if (!confident(words[k]!)) return false
        acc += squash(words[k]!.text)
        if (done(acc)) return true
        if (!viable(acc)) return false
      }
      return depth < 12 && next[line]!.some(j => extend(j, 0, acc, depth + 1))
    }
    return lines.some((line, i) => line.words.some((_w, s) => extend(i, s, '', 0)))
  })
}

/** Confident text segments of each row (lines chained on the same row). */
function confidentSegments(lines: readonly PngLine[]) {
  const next = successors(lines), segments: string[] = []
  const walk = (line: number, acc: string, depth: number) => {
    let current = acc
    for (const w of lines[line]!.words) {
      if (confident(w)) current += squash(w.text)
      else { if (current) segments.push(current); current = '' }
    }
    if (current) segments.push(current)
    if (depth < 12) for (const j of next[line]!) if (lines[j]!.box[1] < lines[line]!.box[3]) walk(j, current, depth + 1)
  }
  lines.forEach((_line, i) => walk(i, '', 0))
  return segments
}

export function assessPngLabels(test: DrawingCase, reading: PngReading, plan: LabelPlan = compileLabelPlan(test)): LabelVerdict {
  if (plan.caseId !== test.id || plan.source !== test.source) throw Error('Label plan belongs to another case/source')
  const labels = plan.labels
  if (plan.unavailable) return { status: 'unknown', reason: plan.unavailable, labels: labels.length }
  if (reading.status !== 'observed') return { status: 'unknown', reason: 'PNG text reader could not read this raster: ' + (reading.reason ?? 'unavailable'), labels: labels.length }
  if (plan.empty) return reading.uniform ? { status: 'correct', reason: 'Uniform raster: no differentiated drawing ink', labels: 0 } : { status: 'incorrect', reason: 'An empty diagram shows differentiated ink', labels: 0 }
  if (reading.uniform) return { status: 'incorrect', reason: 'The raster is uniform: nothing is drawn', labels: labels.length }
  const lines = reading.lines ?? [], segments = confidentSegments(lines)
  const leaked = [...new Set([...plan.forbidden.svg, ...(labels.length ? [] : plan.unlabeledStatements.map(line => ({ match: squash(line), label: line })))].filter(pattern => pattern.match && segments.some(segment => segment.includes(pattern.match))).map(pattern => pattern.label))]
  if (leaked.length) return { status: 'incorrect', reason: 'Raw source syntax read in the raster: ' + leaked.join(', '), leaked, labels: labels.length }
  if (!labels.length) {
    const weak = lines.filter(line => !line.words.length || line.words.some(w => !confident(w))).length
    return weak ? { status: 'unknown', reason: `No label to find; absence of raw source syntax is unassessed: ${weak} text line(s) not read confidently`, labels: 0 } : { status: 'correct', reason: 'No label to find; every text line read confidently and none is raw source syntax', labels: 0 }
  }
  const unread = labels.filter(label => !readsLabel(label, lines))
  if (unread.length) {
    const unclear = unread.filter(label => visibleForms(label).every(form => ambiguous.test(squash(form))))
    return { status: 'unknown', reason: 'Not read by OCR, so unassessed rather than missing: ' + unread.join(', ') + (unclear.length ? ' (only OCR-ambiguous glyphs: ' + unclear.join(', ') + ')' : ''), labels: labels.length }
  }
  return { status: 'correct', reason: `Every label read by OCR in confident words (≥ ${pngWordConfidence}); raw source syntax was not read (observed, not proved absent)`, labels: labels.length }
}

/** Independently authored raster controls, rendered by Chromium from fixed SVG
 * (never by a candidate) and read by the same reader and judge as every row.
 * Positive controls must pass; negative controls must not be credited. */
export const pngControls: readonly { name: string; label?: string; empty?: true; svg: string; status: 'correct' | 'incorrect' | 'unknown' }[] = [
  { name: 'visible-label', svg: '<rect x="20" y="20" width="160" height="50" fill="#ececff" stroke="#9370db"/><text x="100" y="50" text-anchor="middle">Alpha</text>', status: 'correct' },
  { name: 'light-label-on-dark-fill', svg: '<rect x="20" y="20" width="160" height="50" fill="#5b5bd6"/><text x="100" y="50" text-anchor="middle" fill="white">Alpha</text>', status: 'correct' },
  { name: 'wrapped-label', label: 'Small rectangle', svg: '<rect x="20" y="10" width="160" height="70" fill="#ececff" stroke="#9370db"/><text x="100" y="40" text-anchor="middle">Small</text><text x="100" y="58" text-anchor="middle">rectangle</text>', status: 'correct' },
  { name: 'different-label-is-unread-not-missing', svg: '<text x="40" y="50">Beta</text>', status: 'unknown' },
  { name: 'near-miss-label', svg: '<text x="40" y="50">Alpho</text>', status: 'unknown' },
  { name: 'wrapped-label-missing-letter', label: 'Small rectangle', svg: '<text x="60" y="40">Small</text><text x="60" y="58">rectang</text>', status: 'unknown' },
  { name: 'glued-source-syntax', svg: '<text x="40" y="50">A[Alpha]</text>', status: 'incorrect' },
  { name: 'source-header-shown', svg: '<text x="20" y="30">flowchart LR</text><rect x="20" y="45" width="160" height="40" fill="#ececff" stroke="#9370db"/><text x="100" y="70" text-anchor="middle">Alpha</text>', status: 'incorrect' },
  { name: 'hidden-label-uniform-raster', svg: '<text x="40" y="50" opacity="0">Alpha</text>', status: 'incorrect' },
  { name: 'camouflaged-label', svg: '<text x="40" y="50" fill="#f4f4f4">Alpha</text>', status: 'unknown' },
  { name: 'clipped-label', svg: '<clipPath id="c"><rect x="0" y="0" width="200" height="45"/></clipPath><text x="40" y="50" font-size="24" clip-path="url(#c)">Alpha</text>', status: 'unknown' },
  { name: 'ocr-ambiguous-label', label: 'Il1', svg: '<text x="40" y="50" font-size="20">Il1</text>', status: 'unknown' },
  { name: 'empty-uniform', empty: true, svg: '', status: 'correct' },
  { name: 'empty-with-ink', empty: true, svg: '<text x="40" y="50">Alpha</text>', status: 'incorrect' },
]
export const pngControlCanvas = { width: 200, height: 100, font: '16px sans-serif', deviceScaleFactor: 1 }

/** Control fixture with the same shape as observer-contract.ts fixtures. */
export function pngControlCase(control: typeof pngControls[number]): DrawingCase {
  const graph = control.empty ? { nodes: [], edges: [] } : { nodes: [{ id: 'A', label: control.label ?? 'Alpha' }], edges: [] }
  return { id: 'png-observer-control', source: control.empty ? 'flowchart TD' : 'flowchart LR\nA[' + (control.label ?? 'Alpha') + ']', family: 'flowchart', expected: graph, sourceGaps: [], terminal: { expected: { graph } } } as unknown as DrawingCase
}

/** The PNG lane applies to a project whose own public interface draws PNG and
 * that has no SVG or terminal output: an SVG or terminal lane already assesses
 * the same drawing, and Trident's own Chromium conversion of an SVG to PNG
 * would only repeat that measurement. */
export const pngDrawingLaneApplies = (declared: readonly string[]) => declared.includes('png') && !declared.includes('svg') && !declared.includes('terminal')
