/** Same DOM serialization and dimension normalization as DaveBench's shared
 * Chromium exporter. This function runs in the candidate's browser page. */
export async function captureDrawingPng(input: { svg: string; source: string }) {
  const host = globalThis as any
  if (host.__davebenchNativePng) {
    const value = await host.__davebenchNativePng(input.source, 'png_drawing', 'png')
    return [...new Uint8Array(value instanceof Blob ? await value.arrayBuffer() : value)]
  }
  const container = document.createElement('div')
  container.innerHTML = input.svg
  const svg = container.querySelector('svg')
  if (!svg) throw Error('No SVG for PNG export')
  const box = svg
    .getAttribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map(Number)
  const width = Math.ceil(box?.length === 4 ? box[2]! : parseFloat(svg.getAttribute('width') ?? ''))
  const height = Math.ceil(box?.length === 4 ? box[3]! : parseFloat(svg.getAttribute('height') ?? ''))
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.style.maxWidth = 'none'
  const image = new Image()
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg))
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(image, 0, 0)
  const blob = await new Promise<Blob>((done, fail) => canvas.toBlob(b => (b ? done(b) : fail(Error('PNG export failed'))), 'image/png'))
  return [...new Uint8Array(await blob.arrayBuffer())]
}
