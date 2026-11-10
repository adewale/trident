import { inspectFidelityPaint } from '../paint.ts'

export const svgLabelProfile = 'svg-label-paint-v6'
export const labelPaintCriteria = ['visible-authored-labels', 'labels-within-canvas', 'unclipped-authored-labels', 'paint-opacity-and-color'] as const
type Status = 'passed' | 'failed' | 'unavailable'
let source: Promise<string> | undefined

/** Keep a single observer implementation. Minify its serialized function once,
 * and retain the label profile's paint/visibility safeguards in the browser. */
export function labelObserverSource() {
  return source ??= import('esbuild').then(({ transformSync }) => transformSync('(' + inspectFidelityPaint.toString() + ')', { minifyIdentifiers: true, minifyWhitespace: true, minifySyntax: false, treeShaking: false, target: 'es2022' }).code.replace(/;\s*$/, ''))
}
export async function observeSvgLabels(page: any, family: string, labels: readonly string[]) {
  const observer = await labelObserverSource()
  const input = JSON.stringify({ family, expected: { labels }, profile: 'labels' })
  return await page.evaluate(`(async () => {
    if (document.querySelectorAll('svg *').length > 16384 || ${labels.length} > 256) return {};
    const evidence = await (${observer})(${input});
    return Object.fromEntries(${JSON.stringify(labelPaintCriteria)}.map(criterion => {
      const matches = evidence.checks.filter(check => check.criterion === criterion);
      return [criterion, matches.length === 1 ? matches[0].status : 'unavailable'];
    }));
  })()`) as Partial<Record<typeof labelPaintCriteria[number], Status>>
}
