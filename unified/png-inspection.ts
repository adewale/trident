import { crc32, inflateSync } from 'node:zlib'

export interface PngInspection { unavailable?: boolean; findings: string[]; width?: number; height?: number; visiblePixels?: number; distinctCompositedColors?: number; scope: 'decoded-raster-content' | 'binary-envelope' }
const paeth = (a: number, b: number, c: number) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c }

/** Decode actual PNG payloads after API clocks, rather than accepting an IHDR
 * with invented dimensions. Bounded work prevents compressed-image bombs.
 * Raster paint is a content witness, never OCR/topology or pixel fidelity. */
export function inspectPng(output: unknown, requireContent: boolean): PngInspection {
  const result: PngInspection = { findings: [], scope: 'binary-envelope' }
  try {
    if (!(output instanceof Uint8Array) || output.length < 45 || [137, 80, 78, 71, 13, 10, 26, 10].some((byte, index) => output[index] !== byte)) throw Error('Invalid PNG signature or truncated PNG')
    if (output.length > 64 * 1024 * 1024) throw Error('PNG exceeds the declared 64 MiB encoded qualification budget')
    const bytes = output, view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), chunks: Uint8Array[] = []
    let cursor = 8, width = 0, height = 0, depth = 0, color = 0, interlace = 0, ended = false, idatEnded = false, palette: Uint8Array | undefined, transparency: Uint8Array | undefined
    while (cursor < bytes.length) {
      if (cursor + 12 > bytes.length) throw Error('Truncated PNG chunk')
      const length = view.getUint32(cursor), end = cursor + length + 12
      if (end > bytes.length) throw Error('PNG chunk length exceeds actual bytes')
      const type = String.fromCharCode(...bytes.subarray(cursor + 4, cursor + 8)), data = bytes.subarray(cursor + 8, end - 4)
      if (!/^[A-Za-z]{4}$/.test(type) || crc32(bytes.subarray(cursor + 4, end - 4)) !== view.getUint32(end - 4)) throw Error('PNG chunk type or CRC is invalid: ' + type)
      if (cursor === 8 && type !== 'IHDR') throw Error('PNG has no leading IHDR')
      if (type === 'IHDR') {
        if (cursor !== 8 || length !== 13) throw Error('PNG has invalid/repeated IHDR')
        width = view.getUint32(cursor + 8); height = view.getUint32(cursor + 12); depth = data[8]!; color = data[9]!; interlace = data[12]!
        const depths: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] }
        if (!width || !height || !depths[color]?.includes(depth) || data[10] !== 0 || data[11] !== 0 || interlace > 1) throw Error('PNG has invalid dimensions or encoding')
        if (width * height > 16 * 1024 * 1024) throw Error('PNG exceeds the declared 16 megapixel decoded qualification budget')
        result.width = width; result.height = height
      } else if (type === 'IDAT') {
        if (idatEnded) throw Error('PNG IDAT chunks must be consecutive')
        chunks.push(data)
      } else {
        if (chunks.length) idatEnded = true
        if (type === 'IEND') { if (length || end !== bytes.length) throw Error('PNG has invalid IEND or trailing bytes'); ended = true }
        else if (type === 'PLTE') { if (chunks.length || palette || !length || length % 3 || length > 768) throw Error('PNG has invalid palette'); palette = data }
        else if (type === 'tRNS') { if (chunks.length || transparency || color === 3 && !palette) throw Error('PNG has invalid transparency order'); transparency = data }
        else if (type[0] === type[0]!.toUpperCase()) throw Error('Unknown critical PNG chunk: ' + type)
      }
      cursor = end
    }
    if (!ended || !chunks.length || color === 3 && !palette) throw Error('PNG is missing image data, palette or IEND')
    const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[color]!, bits = channels * depth
    const passes = interlace ? [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]] : [[0, 0, 1, 1]]
    const rows = passes.map(([x, y, dx, dy]) => ({ width: Math.max(0, Math.ceil((width - x!) / dx!)), height: Math.max(0, Math.ceil((height - y!) / dy!)) }))
    const expectedBytes = rows.reduce((sum, pass) => sum + (pass.width ? (Math.ceil(pass.width * bits / 8) + 1) * pass.height : 0), 0)
    if (!Number.isSafeInteger(expectedBytes) || expectedBytes > 256 * 1024 * 1024) throw Error('PNG exceeds the declared 256 MiB decoded qualification budget')
    const raw = inflateSync(Buffer.concat(chunks), { maxOutputLength: expectedBytes + 1 })
    if (raw.length !== expectedBytes) throw Error('PNG decompressed scanlines do not match dimensions')
    let offset = 0, visiblePixels = 0
    const colors = new Set<number>(), max = 2 ** depth - 1
    const convert = (value: number) => Math.round(value * 255 / max)
    const composite = (value: number, alpha: number) => Math.round((value * alpha + 255 * (255 - alpha)) / 255)
    if (palette && ([0, 4].includes(color) || color === 3 && palette.length / 3 > 2 ** depth)) throw Error('PNG palette is not valid for its color type/depth')
    if (transparency && (color === 3 ? !palette || !transparency.length || transparency.length > palette.length / 3 : color === 0 ? transparency.length !== 2 : color === 2 ? transparency.length !== 6 : true)) throw Error('PNG transparency is invalid for its color type')
    const transparent = transparency && color !== 3 ? Array.from({ length: transparency.length / 2 }, (_, i) => transparency[i * 2]! * 256 + transparency[i * 2 + 1]!) : undefined
    if (transparent?.some(sample => sample > max)) throw Error('PNG transparent sample exceeds its bit depth')
    for (const pass of rows) {
      if (!pass.width || !pass.height) continue
      const stride = Math.ceil(pass.width * bits / 8), bpp = Math.max(1, Math.ceil(bits / 8)), previous = new Uint8Array(stride), decoded = new Uint8Array(stride)
      const sample = (x: number, channel = 0): number => {
        const index = x * channels + channel
        if (depth === 16) return decoded[index * 2]! * 256 + decoded[index * 2 + 1]!
        if (depth === 8) return decoded[index]!
        return decoded[Math.floor(index * depth / 8)]! >>> (8 - depth - index * depth % 8) & max
      }
      for (let y = 0; y < pass.height; y++) {
        const filter = raw[offset++]!
        if (filter > 4) throw Error('PNG has invalid scanline filter')
        for (let i = 0; i < stride; i++) {
          const a = i >= bpp ? decoded[i - bpp]! : 0, b = previous[i]!, c = i >= bpp ? previous[i - bpp]! : 0
          decoded[i] = (raw[offset++]! + (filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : filter === 4 ? paeth(a, b, c) : 0)) & 255
        }
        for (let x = 0; x < pass.width; x++) {
          let r: number, g: number, b: number, alpha = 255
          if (color === 3) {
            const index = sample(x)
            if (index * 3 + 2 >= palette!.length) throw Error('PNG palette index is outside the declared palette')
            r = palette![index * 3]!; g = palette![index * 3 + 1]!; b = palette![index * 3 + 2]!; alpha = transparency?.[index] ?? 255
          } else {
            r = convert(sample(x)); g = color === 0 || color === 4 ? r : convert(sample(x, 1)); b = color === 0 || color === 4 ? r : convert(sample(x, 2))
            if (color === 4 || color === 6) alpha = convert(sample(x, channels - 1))
            else if (transparent && transparent.every((value, channel) => value === sample(x, channel))) alpha = 0
          }
          if (alpha) visiblePixels++
          // Every Adam7 pass contributes actual decoded pixels. Low-bit-depth
          // and interlaced blanks receive exactly the same content criterion.
          if (colors.size < 2) colors.add(composite(r, alpha) * 65536 + composite(g, alpha) * 256 + composite(b, alpha))
        }
        previous.set(decoded)
      }
    }
    result.scope = 'decoded-raster-content'; result.visiblePixels = visiblePixels; result.distinctCompositedColors = colors.size
    if (requireContent && (!visiblePixels || colors.size < 2)) result.findings.push('PNG has no nonuniform visible diagram content despite declared authored labels')
  } catch (error) { const detail = error instanceof Error ? error.message : String(error); if (detail.startsWith('PNG exceeds the declared')) result.unavailable = true; result.findings.push(detail) }
  return result
}
