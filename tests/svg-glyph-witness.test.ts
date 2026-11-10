import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { observeGlyphWitness, compareGlyphWitness } from '../fidelity/drawing/svg-glyph-witness.ts'

async function proved(page: any, labels: string[]) { return (await observeGlyphWitness(page, labels)).status === 'proved' }

test('observer faults and failed cleanup cannot become a glyph proof', async () => {
  const unavailable = await observeGlyphWitness({ evaluate() { throw Error('browser disconnected') } }, ['Alpha'])
  expect(unavailable).toMatchObject({ status: 'unassessed', stage: 'prepare', kind: 'observer-error' })
  for (const failure of ['compare', 'cleanup']) {
    const page = {
      async evaluate(_fn: unknown, input: any) {
        if (input.step === 'prepare') return { visibleClip: {}, maskClip: {} }
        if (input.step === 'cleanup' && failure === 'cleanup') throw Error('cleanup failed')
        if (input.step === 'mask') return {}
        if (!input.step) return failure !== 'compare'
      },
      async screenshot() { return Buffer.from('fixture') },
    }
    expect(await observeGlyphWitness(page, ['Alpha'])).toMatchObject({ status: 'unassessed', stage: failure, kind: 'observer-error' })
  }
})

test('glyph pixels prove text survives complex backdrops and clips, without trusting font boxes', async () => {
  // This witness requires a grayscale glyph mask. Linux LCD/subpixel text is
  // deliberately outside that profile, so construct matching positive fixtures.
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium), args: ['--disable-lcd-text'] })
  const context = await browser.newContext({ javaScriptEnabled: false }), page = await context.newPage()
  try {
    const text = '<text x="30" y="45" font-family="sans-serif" font-size="20">Alpha</text>'
    const fixtures: [string, boolean][] = [
      [text, true],
      ['<path d="M0 0H300V100H0Z" fill="#eef"/>' + text, true],
      ['<defs><pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="white"/><path d="M0 0L8 8" stroke="#ddd"/></pattern></defs><rect width="300" height="100" fill="url(#p)"/>' + text, true],
      ['<defs><clipPath id="c"><path d="M0 0H300V100H0Z"/></clipPath></defs><g clip-path="url(#c)">' + text + '</g>', true],
      ['<defs><clipPath id="c"><rect width="50" height="100"/></clipPath></defs><g clip-path="url(#c)">' + text + '</g>', false],
      [text + '<path d="M45 20H55V55H45Z" fill="white"/>', false],
      ['<rect width="300" height="100" fill="black"/>' + text, false],
      ['<g opacity="0.2">' + text + '</g>', false],
      ['<g transform="translate(10,5) rotate(12,30,45)">' + text + '</g>', true],
      ['<g style="rotate:8deg;transform-origin:30px 45px">' + text + '</g>', true],
      ['<text x="30" y="45" font-size="20"><tspan x="30">Al</tspan><tspan x="30" dy="22">pha</tspan></text>', true],
      [text.replace('Alpha', 'Al<tspan visibility="hidden">p</tspan>ha'), false],
      [text.replace('Alpha', 'Al<tspan font-size="0">p</tspan>ha'), false],
      [text.replace('Alpha', 'Al<tspan font-size="1">p</tspan>ha'), false],
      ['<style>text[style]~rect{fill:white}</style>' + text + '<rect width="300" height="100" fill="black"/>', false],
      ['<style>body{background:black}body:has(>div){background:white}</style>' + text, false],
    ]
    for (const [body, expected] of fixtures) {
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">' + body + '</svg>')
      const observed = await proved(page, ['Alpha'])
      expect({ body, observed }).toEqual({ body, observed: expected })
      expect(await page.evaluate(() => !!(globalThis as any).__tridentGlyphWitness)).toBe(false)
    }
    await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><text x="20" y="45" font-size="20">東京</text></svg>')
    expect(await proved(page, ['東京'])).toBe(true)
    expect(await proved(page, ['Missing'])).toBe(false)
    await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><text x="20" y="45" font-size="20">Al\u0378pha</text></svg>')
    expect(await proved(page, ['Al\u0378pha'])).toBe(false)
    await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="1300"><text x="30" y="45" font-size="20">Alpha</text><text x="30" y="1290" font-size="20">Beta</text></svg>')
    expect(await proved(page, ['Alpha', 'Beta'])).toBe(true)
    await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><text x="-100 30 50" y="40" font-size="20">ABC</text></svg>')
    expect(await proved(page, ['ABC'])).toBe(false)
    const html = '<foreignObject x="30" y="20" width="160" height="70"><div xmlns="http://www.w3.org/1999/xhtml" style="font:20px/24px sans-serif;color:black">Alpha</div></foreignObject>'
    for (const [body, expected] of [[html, true], [html.replace('Alpha', 'Al<strong>ph</strong>a'), true], [html.replace('Alpha', 'Al<br/>pha'), true], [html.replace('color:black', 'color:white'), false], [html.replace('color:black', 'color:black;-webkit-text-security:disc'), false], [html.replace('color:black', 'color:black;background:white'), true], [html.replace('color:black', 'color:white;background:white'), false], [html + '<path d="M40 0H55V100H40Z" fill="white"/>', false], ['<style>div::first-letter{color:white}</style>' + html, false]] as const) {
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">' + body + '</svg>')
      expect({ body, observed: await proved(page, ['Alpha']) }).toEqual({ body, observed: expected })
    }
    for (const body of [html.replace('Alpha', '<span style="position:absolute;left:-300px">Alpha</span>Beta'), html.replace('color:black', 'color:black;content:url(data:image/svg+xml,%3Csvg/%3E)')]) {
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">' + body + '</svg>')
      expect(await proved(page, [body.includes('Beta') ? 'AlphaBeta' : 'Alpha'])).toBe(false)
    }
    await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">' + html.replace('Alpha', 'Prefix Alpha suffix').replace('color:black', 'color:black;background:white') + '</svg>')
    expect((await observeGlyphWitness(page, ['Alpha'])).status).toBe('proved')
    expect(await observeGlyphWitness(page, ['Alphx'])).toMatchObject({ status: 'unassessed', kind: 'proof-unavailable', stage: 'prepare', reason: 'A required label has no original SVG or HTML text match' })
    await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><image href="data:image/png;base64,"/></svg>')
    expect(await observeGlyphWitness(page, ['Alpha'])).toMatchObject({ status: 'unassessed', kind: 'proof-unavailable', stage: 'prepare', reason: 'Animated or image content is outside the glyph profile' })
    // Erasing a glyph-shaped backdrop can create a counterfactual difference
    // even though the actual image is blank. Literal rasters expose that case.
    const rasters = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 9
      const context = canvas.getContext('2d')!; context.fillStyle = 'white'; context.fillRect(0, 0, 9, 9)
      const blank = canvas.toDataURL(); context.fillStyle = 'black'; context.fillRect(3, 2, 3, 5)
      const glyph = canvas.toDataURL(); context.fillStyle = '#001e00'; context.fillRect(3, 2, 3, 5)
      return { blank, glyph, coloured: canvas.toDataURL(), clip: { x: 0, y: 0, width: 9, height: 9 }, root: { x: 0, y: 0, width: 9, height: 9 }, boxes: [{ x: 3, y: 2, width: 3, height: 5 }] }
    })
    expect(await page.evaluate(compareGlyphWitness, { ...rasters, images: [rasters.glyph, rasters.blank, rasters.glyph, rasters.glyph, rasters.glyph] })).toBe(true)
    await expect(page.evaluate(compareGlyphWitness, { ...rasters, images: [rasters.blank, rasters.glyph, rasters.blank, rasters.glyph, rasters.blank] })).rejects.toThrow('GLYPH_PROOF_UNAVAILABLE')
    await expect(page.evaluate(compareGlyphWitness, { ...rasters, images: [rasters.glyph, rasters.blank, rasters.glyph, rasters.coloured, rasters.glyph] })).rejects.toThrow('GLYPH_PROOF_UNAVAILABLE')
  } finally { await browser.close() }
}, 30000)
