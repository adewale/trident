import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { chromiumExecutable } from './helpers/environment.ts'
import { publicDocsPngAction } from '../unified/docs-png-browser.ts'
import { inspectPng } from '../unified/png-inspection.ts'

test('PNG docs export awaits actual encoded bytes, retains intrinsic dimensions and rejects invalid SVG', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  try {
    const page = await browser.newPage()
    await page.evaluate(() => {
      ;(globalThis as any).__fidelityCommunity = {
        render: async (source: string) => {
          await new Promise(done => setTimeout(done, 20))
          if (source === 'throw') throw Error('Public API rejected source')
          if (source === 'bad') return 'not SVG'
          if (source === 'huge') return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16385 1"/>'
          return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect width="120" height="60" fill="white"/>' + (source === 'blank' ? '' : '<circle cx="60" cy="30" r="20" fill="black"/>') + '</svg>'
        },
      }
    })
    const rendered = await page.evaluate(publicDocsPngAction, { source: 'circle', id: 'circle' })
    expect(rendered.status).toBe('ok')
    expect(rendered.totalMs).toBeGreaterThanOrEqual(20)
    expect(rendered.totalMs).toBeGreaterThanOrEqual(Object.values(rendered.stages).reduce((a: number, b: any) => a + b, 0) as number)
    const bytes = Uint8Array.from(rendered.png)
    expect(bytes.length).toBe(rendered.outputBytes)
    expect(inspectPng(bytes, true)).toMatchObject({ width: 120, height: 60, findings: [], distinctCompositedColors: 2 })
    const blank = await page.evaluate(publicDocsPngAction, { source: 'blank', id: 'blank' })
    expect(inspectPng(Uint8Array.from(blank.png), true).findings.length).toBeGreaterThan(0)
    const huge = await page.evaluate(publicDocsPngAction, { source: 'huge', id: 'huge' })
    expect(huge.status).toBe('blocked')
    expect(huge.stage).toBe('raster-budget')
    expect(huge.png).toBeUndefined()
    for (const source of ['throw', 'bad']) {
      const result = await page.evaluate(publicDocsPngAction, { source, id: source })
      expect(result.status).toBe('error')
      expect(result.totalMs).toBeUndefined()
      expect(result.png).toBeUndefined()
    }
  } finally {
    await browser.close()
  }
})


test('export inlines only exact collector-owned image resources and retains the unmodified public SVG', async () => {
  const browser=await chromium.launch({headless:true,executablePath:chromiumExecutable})
  try{
    const page=await browser.newPage();await page.route('**/*',route=>route.abort())
    await page.evaluate(()=>{(globalThis as any).__fidelityCommunity={render:async()=>'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><image href="https://owned.invalid/red.svg" width="20" height="20"/><image href="https://unowned.invalid/blue.svg" x="20" width="20" height="20"/></svg>'}})
    const image='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>'
    const result=await page.evaluate(publicDocsPngAction,{source:'synthetic-owned-image',id:'synthetic-owned-image',ownedImages:[{url:'https://owned.invalid/red.svg',contentType:'image/svg+xml',bytesBase64:Buffer.from(image).toString('base64')}]})
    expect(result.status).toBe('ok');expect(result.originalSvg).toContain('href="https://owned.invalid/red.svg"');expect(result.rasterizedSvg).toContain('href="data:image/svg+xml;base64,');expect(result.rasterizedSvg).toContain('href="https://unowned.invalid/blue.svg"')
    const pixels=await page.evaluate(async png=>{const image=new Image();image.src='data:image/png;base64,'+btoa(String.fromCharCode(...png));await image.decode();const canvas=document.createElement('canvas');canvas.width=40;canvas.height=20;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);return{owned:Array.from(ctx.getImageData(10,10,1,1).data),unowned:Array.from(ctx.getImageData(30,10,1,1).data)}},result.png)
    expect(pixels.owned).toEqual([255,0,0,255]);expect(pixels.unowned).not.toEqual([255,0,0,255]);expect(result.stages.ownedImageInliningMs).toBeGreaterThanOrEqual(0)
  }finally{await browser.close()}
})
