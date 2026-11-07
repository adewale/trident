import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { observeSvgLabels } from '../fidelity/drawing/svg-label-observer.ts'

test('opaque gradient backdrops qualify only with a separating label colour channel', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  const page = await browser.newPage({ javaScriptEnabled: false })
  const gradient = (stops: string, attributes = '') => `<defs><linearGradient id="g" ${attributes}>${stops}</linearGradient></defs>`
  const stop = (offset: number, color: string, extra = '') => `<stop offset="${offset}" stop-color="${color}" ${extra}/>`
  const body = '<rect width="300" height="100" fill="url(#g)"/><text x="20" y="45" fill="black">Alpha</text>'
  const cases: [string, string, 'passed' | 'unavailable'][] = [
    ['light', gradient(stop(0, '#eee') + stop(1, 'white')), 'passed'],
    ['linear RGB', gradient(stop(0, '#ddd') + stop(1, 'white'), 'color-interpolation="linearRGB"'), 'passed'],
    ['source-preserving shadow', gradient(stop(0, '#eee') + stop(1, 'white')) + '<defs><filter id="shadow" x="-6%" y="-6%" width="116%" height="128%"><feDropShadow dx="0" dy="2" stdDeviation="3"/></filter></defs><style>rect{filter:url(#shadow)}</style>', 'passed'],
    ['clipped shadow region', gradient(stop(0, '#eee') + stop(1, 'white')) + '<defs><filter id="shadow" x="0" width="50%"><feDropShadow/></filter></defs><style>rect{filter:url(#shadow)}</style>', 'unavailable'],
    ['source-removing filter', gradient(stop(0, '#eee') + stop(1, 'white')) + '<defs><filter id="shadow"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0"/></filter></defs><style>rect{filter:url(#shadow)}</style>', 'unavailable'],
    ['wide-gamut stops', gradient(stop(0, 'color(display-p3 0.8 0.8 0.8)') + stop(1, 'color(display-p3 1 1 1)')), 'unavailable'],
    ['wide-gamut label', gradient(stop(0, '#eee') + stop(1, 'white')) + '<style>text{fill:color(display-p3 0 0 0)}</style>', 'unavailable'],
    ['same channel interval', gradient(stop(0, 'black') + stop(1, 'white')), 'unavailable'],
    ['intermediate dark plateau', gradient(stop(0, 'white') + stop(.2, 'black') + stop(.8, 'black') + stop(1, 'white')), 'unavailable'],
    ['transparency', gradient(stop(0, 'white', 'stop-opacity="0.5"') + stop(1, 'white')), 'unavailable'],
    ['inherited gradient', gradient('', 'href="#other"') + '<defs><linearGradient id="other">' + stop(0, '#eee') + stop(1, 'white') + '</linearGradient></defs>', 'unavailable'],
    ['animated gradient', gradient(stop(0, 'white') + '<stop offset="1" stop-color="white"><animate attributeName="stop-color" values="white;black" dur="1s" repeatCount="indefinite"/></stop>'), 'unavailable'],
  ]
  try {
    for (const [name, definitions, status] of cases) {
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">' + definitions + body + '</svg>')
      const result = await observeSvgLabels(page, 'flowchart', ['Alpha'])
      expect(result['paint-opacity-and-color'], name).toBe(status)
      if (status === 'passed') expect(Object.values(result), name).toEqual(['passed', 'passed', 'passed', 'passed'])
    }
    const light = gradient(stop(0, '#eee') + stop(1, 'white'))
    for (const cover of ['<rect width="300" height="100" fill="white"/>', '<rect x="20" y="20" width="15" height="30" fill="white"/>']) {
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">' + light + body + cover + '</svg>')
      expect((await observeSvgLabels(page, 'flowchart', ['Alpha']))['unclipped-authored-labels']).not.toBe('passed')
    }
  } finally { await browser.close() }
})
