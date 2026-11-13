import { inspectFidelityPaint } from '../paint.ts'

export const svgLabelProfile = 'svg-label-paint-v7'
export const labelPaintCriteria = ['visible-authored-labels', 'labels-within-canvas', 'unclipped-authored-labels', 'paint-opacity-and-color'] as const
type Status = 'passed' | 'failed' | 'unavailable'
export interface SvgLabelEvidence { criterion: typeof labelPaintCriteria[number]; status: Status; actual?: unknown; scope?: string }
let source: Promise<string> | undefined

/** Keep a single observer implementation. Minify its serialized function once,
 * and retain the label profile's paint/visibility safeguards in the browser. */
export function labelObserverSource() {
  return source ??= import('esbuild').then(({ transformSync }) => transformSync('(' + inspectFidelityPaint.toString() + ')', { minifyIdentifiers: true, minifyWhitespace: true, minifySyntax: false, treeShaking: false, target: 'es2022' }).code.replace(/;\s*$/, ''))
}
/** CSS generic families always resolve to some installed face. */
export const genericFontFamilies = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong'] as const
export interface LabelFont { label: string; fonts: { family: string; available: boolean | null }[] }
/** In the page: the primary (first) computed font family of each label's original
 * SVG or HTML text, and whether this browser can draw it. A family is unavailable
 * when text set in "<family>", <generic> measures exactly as <generic> alone for
 * monospace, serif and sans-serif; a webfont face of that family that is loaded
 * makes it available, one still pending leaves availability unknown. */
export function labelFontOperation(input: { labels: readonly string[]; generic: readonly string[] }): LabelFont[] | null {
  const svg = document.querySelector('svg')
  if (!svg) return null
  const normalize = (value: string) => value.normalize('NFC').replace(/\s+/g, '')
  const candidates = [...svg.querySelectorAll('text'), ...svg.querySelectorAll('tspan'), ...svg.querySelectorAll('foreignObject *')]
  const primary = (list: string) => { const match = /^\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^,]*))/.exec(list); return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').replace(/\\(.)/g, '$1').trim() }
  const context = document.createElement('canvas').getContext('2d')
  const sample = 'mmmmmmmmmmlli WWW@#0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const cache = new Map<string, boolean | null>()
  const available = (family: string): boolean | null => {
    if (!family) return null
    if (input.generic.includes(family.toLowerCase())) return true
    if (cache.has(family)) return cache.get(family)!
    let result: boolean | null = null
    const faces = [...document.fonts].filter(face => primary(face.family).toLowerCase() === family.toLowerCase())
    if (faces.some(face => face.status === 'loaded')) result = true
    else if (faces.some(face => face.status === 'loading' || face.status === 'unloaded')) result = null
    else if (context) {
      const quoted = '"' + family.replace(/["\\]/g, '\\$&') + '"'
      // An assignment the canvas rejects leaves the 1px sentinel: no comparison.
      const width = (font: string) => { context.font = '1px monospace'; context.font = '72px ' + font; return context.font.startsWith('72px') ? context.measureText(sample).width : NaN }
      const comparisons = ['monospace', 'serif', 'sans-serif'].map(base => [width(quoted + ', ' + base), width(base)] as const)
      result = comparisons.some(([a, b]) => !Number.isFinite(a) || !Number.isFinite(b)) ? null : comparisons.some(([a, b]) => a !== b)
    }
    cache.set(family, result)
    return result
  }
  return input.labels.map(label => {
    const wanted = normalize(label), exact = candidates.filter(element => normalize(element.textContent ?? '') === wanted)
    const matches = exact.length ? exact : candidates.filter(element => normalize(element.textContent ?? '').includes(wanted))
    const families = [...new Set(matches.map(element => primary(getComputedStyle(element).fontFamily)))]
    return { label, fonts: families.map(family => ({ family, available: available(family) })) }
  })
}

const fontDependentScope = 'Declared font '
export const isFontDependentClipping = (check: SvgLabelEvidence) => check.criterion === 'unclipped-authored-labels' && check.status === 'unavailable' && !!check.scope?.startsWith(fontDependentScope)
/** A clipping failure measured with a fallback face says nothing about the declared
 * face: the precomputed boxes were sized for it. When every clipped label's primary
 * family is missing on this machine, clipping is environment-dependent: unavailable. */
async function scopeFontDependentClipping(page: any, checks: SvgLabelEvidence[]): Promise<SvgLabelEvidence[]> {
  const index = checks.findIndex(check => check.criterion === 'unclipped-authored-labels' && check.status === 'failed')
  const clipped = index < 0 ? [] : checks[index]!.actual
  if (!Array.isArray(clipped) || !clipped.length || !clipped.every(label => typeof label === 'string')) return checks
  let fonts: LabelFont[] | null
  try { fonts = await page.evaluate(labelFontOperation, { labels: [...new Set(clipped as string[])], generic: genericFontFamilies }) } catch { return checks }
  if (!fonts?.length || !fonts.every(label => label.fonts.length && label.fonts.every(font => font.available === false))) return checks
  const missing = [...new Set(fonts.flatMap(label => label.fonts.map(font => font.family)))]
  const scoped: SvgLabelEvidence = { criterion: 'unclipped-authored-labels', status: 'unavailable', actual: { clipped, fonts }, scope: fontDependentScope + missing.map(family => JSON.stringify(family)).join(', ') + ' is not installed on the assessing machine, so the labels were measured in a fallback font; clipping is environment-dependent' }
  return checks.map((check, n) => n === index ? scoped : check)
}

export async function observeSvgLabelEvidence(page: any, family: string, labels: readonly string[]): Promise<SvgLabelEvidence[]> {
  return scopeFontDependentClipping(page, await observePaintEvidence(page, family, labels))
}
async function observePaintEvidence(page: any, family: string, labels: readonly string[]): Promise<SvgLabelEvidence[]> {
  const observer = await labelObserverSource()
  const input = JSON.stringify({ family, expected: { labels }, profile: 'labels' })
  return await page.evaluate(`(async () => {
    if (document.querySelectorAll('svg *').length > 16384 || ${labels.length} > 256) return ${JSON.stringify(labelPaintCriteria)}.map(criterion => ({criterion, status:'unavailable', scope:'Label observer work limit exceeded'}));
    const evidence = await (${observer})(${input});
    return ${JSON.stringify(labelPaintCriteria)}.map(criterion => {
      const matches = evidence.checks.filter(check => check.criterion === criterion);
      return matches.length === 1 ? matches[0] : {criterion, status:'unavailable', scope:'Observer did not return one unambiguous criterion'};
    });
  })()`)
}
export async function observeSvgLabels(page: any, family: string, labels: readonly string[]) {
  return Object.fromEntries((await observeSvgLabelEvidence(page, family, labels)).map(check => [check.criterion, check.status])) as Partial<Record<typeof labelPaintCriteria[number], Status>>
}
