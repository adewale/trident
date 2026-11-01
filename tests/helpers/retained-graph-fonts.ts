import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import type { Page } from 'playwright'
import provenance from '../fixtures/graph-completion/fonts/provenance.json' with { type: 'json' }

// Own the fallback font bytes instead of silently substituting the host OS's
// similarly named typeface. Aliases preserve the unchanged SVG's CSS requests.
const fonts = provenance.fonts.map(record => {
  const bytes = gunzipSync(readFileSync(new URL('../fixtures/graph-completion/fonts/' + record.file, import.meta.url)))
  if (bytes.length !== record.bytes || createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw Error('Retained graph font fixture changed')
  return { weight: record.weight, source: 'url(data:font/ttf;base64,' + bytes.toString('base64') + ')' }
})
export async function retainedGraphFonts(page: Page) {
  return page.evaluate(async ({ fonts, aliases }) => {
    const faces = aliases.flatMap(family => fonts.map(font => new FontFace(family, font.source, { weight: String(font.weight), style: 'normal' })))
    await Promise.all(faces.map(async face => { await face.load(); document.fonts.add(face) }))
    await document.fonts.ready
    return { loaded: faces.map(face => ({ family: face.family, weight: face.weight, status: face.status })), runs: [...document.querySelectorAll('svg text,svg foreignObject *')].filter(element => element.textContent?.trim()).map(element => { const css = getComputedStyle(element), box = element.getBoundingClientRect();return { text: element.textContent, font: css.font, lineHeight: css.lineHeight, box: { x: box.x, y: box.y, width: box.width, height: box.height } } }) }
  }, { fonts, aliases: provenance.aliases })
}
