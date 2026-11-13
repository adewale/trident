import type { DrawingCase } from './corpus.ts'

/** Empty diagrams require absence of differentiated visible ink, not labels. */
export async function inspectEmptySvgDrawing(page: any, test: DrawingCase) {
  const profile = await page.evaluate(() => {
    const roots = document.querySelectorAll('svg'),
      svg = roots[0]
    if (roots.length !== 1 || !svg) return { error: 'Expected one actual SVG canvas' }
    const box = svg.getBoundingClientRect(),
      style = getComputedStyle(svg)
    if (box.width === 0 || box.height === 0) return style.overflow === 'hidden' ? { clippedEmpty: true } : { error: 'Zero-area SVG has unqualified visible overflow' }
    if (
      box.width * box.height > 4000000 ||
      style.backgroundImage !== 'none' ||
      style.boxShadow !== 'none' ||
      [...svg.querySelectorAll('*')].some(e => {
        if (e.closest('defs')) return false
        const rect = e.getBoundingClientRect()
        if (!(rect.width > 0 && rect.height > 0)) return false
        const css = getComputedStyle(e)
        return css.filter !== 'none' || /url\(/.test(css.fill)
      })
    )
      return { error: 'Empty-canvas paint is outside the uniform-background profile' }
    return {}
  })
  const criterion = 'empty-drawing-ink'
  let status: 'correct' | 'incorrect' | 'unknown' = profile.error ? 'unknown' : 'correct'
  if (!profile.error && !profile.clippedEmpty) {
    const png = await page.locator('svg').screenshot({ type: 'png', omitBackground: true, timeout: 5000 })
    const uniform = await page.evaluate(async (url: string) => {
      const image = new Image()
      image.src = url
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')!
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      for (let i = 4; i < pixels.length; i += 4) if (pixels[i + 3] !== pixels[3] || (pixels[i + 3] && (pixels[i] !== pixels[0] || pixels[i + 1] !== pixels[1] || pixels[i + 2] !== pixels[2]))) return false
      return true
    }, 'data:image/png;base64,' + png.toString('base64'))
    if (!uniform) status = 'incorrect'
  }
  if (test.sourceGaps.length) status = 'unknown'
  return {
    status,
    failed: status === 'incorrect' ? [criterion] : [],
    unknown: status === 'unknown' ? [profile.error ?? 'Source obligations are incomplete'] : [],
    sourceGaps: test.sourceGaps,
    required: [criterion],
    checks: [{ criterion, status: status === 'correct' ? 'passed' : status === 'incorrect' ? 'failed' : 'unavailable', expected: 'No differentiated drawing ink', scope: 'Actual isolated SVG pixels, with a uniform canvas background permitted' }],
  }
}
