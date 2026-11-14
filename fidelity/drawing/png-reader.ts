import { join } from 'node:path'
import { DrawingWorker } from './worker.ts'
import type { PngReading } from './png-labels.ts'

export const pngReaderScript = join(import.meta.dirname, 'png_text_reader.py')

/** The label-blind raster text reader, in its own bounded process. A reader
 * failure is an unreadable raster (unknown), never a renderer result. */
export class PngTextReader {
  private worker?: DrawingWorker
  identity: unknown
  private open() { this.worker = new DrawingWorker(['python3', '-I', pngReaderScript], 'reader'); return this.worker }
  async start() {
    const reply = await (this.worker ?? this.open()).call({ identity: true }, 30_000)
    if (reply.status !== 'identity') throw Error('PNG text reader unavailable: ' + (reply.reason ?? reply.error))
    this.identity = reply.identity
    return this.identity
  }
  async read(png: Uint8Array): Promise<PngReading> {
    const worker = this.worker ?? this.open()
    const reply = await worker.call({ png: Buffer.from(png).toString('base64') }, 180_000)
    if (reply.failureKind) { await worker.close(); this.worker = undefined; return { status: 'unknown', reason: 'PNG text reader ' + reply.failureKind + ': ' + reply.error } }
    const { id: _id, ...reading } = reply
    return reading
  }
  async close() { await this.worker?.close(); this.worker = undefined }
}
