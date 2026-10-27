/** Native browser decode, after the production API clock. A painted raster is
 * only a content witness: no OCR, semantic topology or perceptual equality. */
export async function inspectBrowserPng(input: { bytes: Uint8Array | number[]; requireContent: boolean }): Promise<string[]> {
  let bitmap: ImageBitmap | undefined
  let canvas: OffscreenCanvas | undefined
  try {
    const bytes = Uint8Array.from(input.bytes)
    if (bytes.length < 45 || [137, 80, 78, 71, 13, 10, 26, 10].some((byte, index) => bytes[index] !== byte) || String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR') return ['Invalid PNG signature or missing IHDR']
    const header = new DataView(bytes.buffer), width = header.getUint32(16), height = header.getUint32(20)
    if (!width || !height || bytes.length > 64 * 1024 * 1024 || width * height > 16 * 1024 * 1024) return ['PNG exceeds the declared qualification dimensions/64 MiB raster budget or has empty dimensions']
    bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
    if (bitmap.width !== width || bitmap.height !== height) return ['Decoded PNG dimensions differ from its declared IHDR']
    canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return ['Browser PNG qualification has no 2D canvas decoder']
    context.drawImage(bitmap, 0, 0)
    const pixels = context.getImageData(0, 0, width, height).data
    let first: number | undefined, varied = false
    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3]!, composite = (channel: number) => Math.round((channel * alpha + 255 * (255 - alpha)) / 255)
      const value = composite(pixels[index]!) * 65536 + composite(pixels[index + 1]!) * 256 + composite(pixels[index + 2]!)
      if (first === undefined) first = value
      else if (value !== first) { varied = true; break }
    }
    return input.requireContent && !varied ? ['PNG has no nonuniform visible diagram content despite declared authored labels'] : []
  } catch (error) { return ['PNG native browser decode/content qualification failed: ' + String(error)] }
  finally { bitmap?.close(); if (canvas) { canvas.width = 0; canvas.height = 0 } }
}
