import { expect, test } from 'bun:test'
import { crc32, deflateSync } from 'node:zlib'
import { chromium } from 'playwright'
import { inspectBrowserPng } from '../unified/browser-png-inspection.ts'
import { chromiumExecutable } from './helpers/environment.ts'

function png(pixels: number[]) {
  const chunk = (name: string, data: Uint8Array) => {
    const bytes = Buffer.alloc(data.length + 12)
    bytes.writeUInt32BE(data.length, 0); bytes.write(name, 4); bytes.set(data, 8)
    bytes.writeUInt32BE(crc32(bytes.subarray(4, bytes.length - 4)), bytes.length - 4)
    return bytes
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(2, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Uint8Array.from([0, ...pixels]))), chunk('IEND', Buffer.alloc(0))])
}

test('native browser PNG admission decodes real content and rejects blank/transparent/fabricated envelopes', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  try {
    const page = await browser.newPage()
    const inspect = (bytes: Uint8Array, requireContent = true) => page.evaluate(inspectBrowserPng, { bytes: [...bytes], requireContent })
    const content = png([0, 0, 0, 255, 255, 255, 255, 255])
    expect(await inspect(content)).toEqual([])
    const blank = png([255, 255, 255, 255, 255, 255, 255, 255])
    expect((await inspect(blank)).join(' ')).toContain('no nonuniform visible diagram content')
    expect(await inspect(blank, false)).toEqual([])
    const transparent = png([0, 0, 0, 0, 255, 255, 255, 0])
    expect((await inspect(transparent)).join(' ')).toContain('no nonuniform visible diagram content')
    expect((await inspect(content.subarray(0, 45))).join(' ')).toContain('decode/content qualification failed')
    const huge = Buffer.from(content); huge.writeUInt32BE(100000, 16); huge.writeUInt32BE(100000, 20)
    expect((await inspect(huge))[0]).toStartWith('PNG qualification unavailable:')
  } finally { await browser.close() }
}, 20_000)
