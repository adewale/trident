/** Runs inside Chromium after the existing public SVG adapter initializes. */
export async function publicDocsPngAction(input: { source: string; id: string }): Promise<any> {
  const state = (globalThis as any).__fidelityCommunity
  const stages: Record<string, number> = {}
  const started = performance.now()
  let stage = 'public-svg',
    svg: string | undefined,
    url: string | undefined
  try {
    const value = await state.render(input.source, input.id)
    svg = typeof value === 'string' ? value : value?.svg
    stages.svgReturnMs = performance.now() - started
    if (typeof svg !== 'string') throw Error('Public render did not return SVG')
    stage = 'svg-serialization'
    let t = performance.now()
    // HTML serialization repairs SVG foreignObject void elements without stripping
    // labels. This conversion, explicit intrinsic sizing and URI creation are timed.
    const host = document.createElement('div')
    host.innerHTML = svg
    const root = host.querySelector('svg')
    if (!root) throw Error('Returned text contains no SVG root')
    const box = root
      .getAttribute('viewBox')
      ?.trim()
      .split(/[\s,]+/)
      .map(Number)
    const width = Math.ceil(box?.length === 4 ? box[2]! : Number.parseFloat(root.getAttribute('width') ?? ''))
    const height = Math.ceil(box?.length === 4 ? box[3]! : Number.parseFloat(root.getAttribute('height') ?? ''))
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) throw Error('SVG has no finite intrinsic canvas')
    if (width > 16384 || height > 16384 || width * height > 64 * 1024 * 1024) {
      stage = 'raster-budget'
      throw Error(`PNG raster budget exceeded: ${width}x${height}`)
    }
    root.setAttribute('width', String(width))
    root.setAttribute('height', String(height))
    root.style.maxWidth = 'none'
    const serialized = new XMLSerializer().serializeToString(root)
    url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized)
    stages.svgPreparationMs = performance.now() - t
    stage = 'svg-decode'
    t = performance.now()
    const image = new Image()
    image.src = url
    await image.decode()
    stages.svgDecodeMs = performance.now() - t
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')!
    stage = 'canvas-draw'
    t = performance.now()
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    stages.canvasDrawMs = performance.now() - t
    // Canvas draw may defer work; this clock includes deferred raster/readback and
    // encoding. It is not isolated CPU encoding or a physical-presentation clock.
    stage = 'png-production'
    t = performance.now()
    const blob = await new Promise<Blob>((done, reject) => canvas.toBlob(value => (value ? done(value) : reject(Error('Canvas returned no PNG'))), 'image/png'))
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const outputBytes = bytes.byteLength
    stages.pngProductionMs = performance.now() - t
    const totalMs = performance.now() - started
    return { status: 'ok', totalMs, stages, width, height, outputBytes, png: Array.from(bytes), svg }
  } catch (error) {
    return { status: stage === 'raster-budget' ? 'blocked' : 'error', stage, detail: String(error), stages, svg }
  } finally {
    ;(globalThis as any).__communityAfterCall?.()
    for (const node of document.querySelectorAll('body > div:not([data-community-host])')) node.remove()
  }
}
