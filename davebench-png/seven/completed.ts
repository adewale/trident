/** Completed PNG response only. SVG/text evidence is fetched after the client clock. */
export async function completedPng(input: { source: string; id: string }) {
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-20000px;top:0;'
  let stage = 'public-api',
    svg: string | undefined
  const started = performance.now()
  try {
    const result = await (globalThis as any).controlledRender(input.source, input.id)
    svg = typeof result === 'string' ? result : result?.svg
    ;(globalThis as any).sevenEvidence = { svg }
    const apiMs = performance.now() - started
    if (typeof svg !== 'string') throw Error('No public SVG string returned')
    stage = 'fixed-canvas'
    host.innerHTML = svg
    const root = host.querySelector('svg')
    if (!root) throw Error('No SVG root')
    document.body.appendChild(host)
    await document.fonts.ready
    const box = root
      .getAttribute('viewBox')
      ?.trim()
      .split(/[\s,]+/)
      .map(Number)
    const width = Math.ceil(box?.length === 4 ? box[2]! : Number.parseFloat(root.getAttribute('width') ?? ''))
    const height = Math.ceil(box?.length === 4 ? box[3]! : Number.parseFloat(root.getAttribute('height') ?? ''))
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) throw Error('Invalid intrinsic bounds')
    if (width > 1140 || height > 840) return { status: 'contract-failed', detail: 'contract-fit: no downscaling/clipping allowed', naturalWidth: width, naturalHeight: height }
    root.setAttribute('width', String(width))
    root.setAttribute('height', String(height))
    if (box?.length === 4) root.setAttribute('viewBox', `${box[0]} ${box[1]} ${width} ${height}`)
    root.style.width = width + 'px'
    root.style.height = height + 'px'
    root.style.maxWidth = 'none'
    const serialized = new XMLSerializer().serializeToString(root)
    const preparedAt = performance.now()
    const image = new Image()
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized)
    await image.decode()
    const decodedAt = performance.now()
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 900
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 1200, 900)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, Math.floor((1200 - width) / 2), Math.floor((900 - height) / 2))
    const drawnAt = performance.now()
    // A synchronous export avoids the document's idle-encoding schedule.
    // Base64 production and decoding are both inside the completed-PNG timer.
    const url = canvas.toDataURL('image/png')
    if (!url.startsWith('data:image/png;base64,')) throw Error('No encoded PNG data URL')
    const encodedAt = performance.now()
    const binary = atob(url.slice(url.indexOf(',') + 1))
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0)),
      outputBytes = bytes.length
    const totalMs = performance.now() - started
    return { status: 'ok', totalMs, apiMs, normalizationMs: totalMs - apiMs, svgPreparationMs: preparedAt - started - apiMs, svgDecodeMs: decodedAt - preparedAt, canvasDrawMs: drawnAt - decodedAt, pngRasterReadbackEncodeMs: encodedAt - drawnAt, encodedByteReadMs: started + totalMs - encodedAt, bytes: outputBytes, pngBase64: url.slice(url.indexOf(',') + 1), naturalWidth: width, naturalHeight: height }
  } catch (error) {
    return { status: 'error', stage, detail: String(error) }
  } finally {
    host.remove()
    for (const node of document.querySelectorAll('body > div:not([data-controlled])')) node.remove()
  }
}
