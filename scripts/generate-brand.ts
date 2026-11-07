// Rebuild the approved datum/trident mark and the Inter Black wordmark.
// Run from any directory: bun /path/to/trident/scripts/generate-brand.ts
import { Resvg } from '@resvg/resvg-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const output = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/brand')
const green = '#205653'
const ink = '#161919'
const paper = '#F7F5EF'
const font = { loadSystemFonts: false, fontFiles: [resolve(output, 'fonts/Inter-Black.ttf')], defaultFontFamily: 'Inter' }

// One continuous fan, three shouldered arrowheads, and a separate datum bar.
// The 17-unit gap below the square-ended stem is part of the mark.
const symbol = `<g fill="${green}">
  <path d="M500 64 575 218H538V482L666 301 645 283 786 201 752 368 728 350 540 627V692H460V627L272 350 248 368 214 201 356 283 334 301 462 482V218H425Z"/>
  <path d="M270 709H730V759H270Z"/>
</g>`

// Resolve the bundled, static weight-900 font to paths. Shipped SVGs need no
// font installation, network request, embedded font, or platform fallback.
const type = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400" viewBox="0 -200 1600 400">
  <text x="0" y="0" fill="${ink}" font-family="Inter" font-weight="900" font-size="150" letter-spacing="-0.8">TRIDENT</text>
</svg>`, { font })
const bounds = type.getBBox()
const outlined = type.toString()
if (!bounds || bounds.height <= 0 || !outlined.includes('<path') || outlined.includes('<text')) throw Error('Inter Black did not resolve to wordmark outlines')
const scale = 108 / bounds.height
const x = 500 - scale * (bounds.x + bounds.width / 2)
const y = 810 - scale * bounds.y
const wordmark = `<g transform="translate(${x} ${y}) scale(${scale})">${outlined.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g>`

function svg(description: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-labelledby="title description">
  <title id="title">Trident</title>
  <desc id="description">${description}</desc>
${body}
</svg>\n`
}

const logo = svg('Three green arrow-tipped spears above a detached datum line, with an Inter Black wordmark.', symbol + '\n' + wordmark)
// For dark backgrounds (the README's prefers-color-scheme: dark source), the wordmark
// takes the paper colour instead of ink; the mark keeps the brand green.
const darkWordmark = wordmark.replaceAll(`fill="${ink}"`, `fill="${paper}"`)
if (darkWordmark === wordmark) throw Error('Wordmark ink colour not found for the dark variant')
const darkLogo = svg('Three green arrow-tipped spears above a detached datum line, with an Inter Black wordmark in light lettering for dark backgrounds.', symbol + '\n' + darkWordmark)
const mark = svg('Three green arrow-tipped spears above a detached datum line.', `<g transform="translate(0 88.5)">${symbol}</g>`)
mkdirSync(output, { recursive: true })
writeFileSync(resolve(output, 'trident.svg'), logo)
writeFileSync(resolve(output, 'trident-dark.svg'), darkLogo)
writeFileSync(resolve(output, 'trident-mark.svg'), mark)
writeFileSync(resolve(output, 'trident.png'), new Resvg(logo, { font: { loadSystemFonts: false }, background: paper }).render().asPng())
writeFileSync(resolve(output, 'trident-mark.png'), new Resvg(mark, { font: { loadSystemFonts: false }, fitTo: { mode: 'width', value: 512 } }).render().asPng())
console.log('Generated Trident SVG/PNG lockup, dark-background lockup and mark in ' + output)
