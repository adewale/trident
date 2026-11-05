/** Same DOM serialization and dimension normalization as DaveBench's shared
 * Chromium exporter, except a zero-area empty diagram exports a 1×1 canvas.
 * Historical DaveBench timing behavior is unchanged. Runs in the candidate page. */
export async function captureDrawingPng(input: { svg: string; source: string }) {
  const host = globalThis as any
  const container = document.createElement('div')
  container.innerHTML = input.svg
  const svg = container.querySelector('svg')
  if (!svg) {
    if (!host.__davebenchNativePng) throw Error('No SVG for PNG export')
    const value = await host.__davebenchNativePng(input.source, 'png_drawing', 'png')
    return { bytes: [...new Uint8Array(value instanceof Blob ? await value.arrayBuffer() : value)], witnessSvg: undefined }
  }
  const box = svg
    .getAttribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map(Number)
  const width = Math.max(1, Math.ceil(box?.length === 4 ? box[2]! : parseFloat(svg.getAttribute('width') ?? '')))
  const height = Math.max(1, Math.ceil(box?.length === 4 ? box[3]! : parseFloat(svg.getAttribute('height') ?? '')))
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.style.maxWidth = 'none'
  const witnessSvg = new XMLSerializer().serializeToString(svg)
  if (host.__davebenchNativePng) {
    const value = await host.__davebenchNativePng(input.source, 'png_drawing', 'png')
    return { bytes: [...new Uint8Array(value instanceof Blob ? await value.arrayBuffer() : value)], witnessSvg }
  }
  const image = new Image()
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(witnessSvg)
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(image, 0, 0)
  const blob = await new Promise<Blob>((done, fail) => canvas.toBlob(b => (b ? done(b) : fail(Error('PNG export failed'))), 'image/png'))
  return { bytes: [...new Uint8Array(await blob.arrayBuffer())], witnessSvg }
}
