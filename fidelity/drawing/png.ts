/** Browser-side equivalence validates a fresh PNG against an independently
 * inspected live SVG screenshot. A mismatch is unknown, since layout may differ. */
export async function compareRasterWitness(input: { png: string; witness: string }) {
  const decode = async (url: string) => {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const c = canvas.getContext('2d')!
    c.drawImage(image, 0, 0)
    return { width: canvas.width, height: canvas.height, pixels: c.getImageData(0, 0, canvas.width, canvas.height).data }
  }
  try {
    const [a, b] = await Promise.all([decode(input.png), decode(input.witness)])
    if (a.width !== b.width || a.height !== b.height) return { status: 'unknown', reason: 'PNG and inspected SVG have different raster dimensions' }
    for (let i = 0; i < a.pixels.length; i++) if (a.pixels[i] !== b.pixels[i]) return { status: 'unknown', reason: 'PNG requires independent assessment; its pixels differ from the inspected SVG witness' }
    return { status: 'correct', reason: 'Decoded PNG exactly preserves the independently checked SVG drawing' }
  } catch {
    return { status: 'unknown', reason: 'PNG raster equivalence could not be decoded' }
  }
}
