import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { comparisonProjects, type LineageCatalog } from '../unified/lineage.ts'
import { lineageColours, lineageDiagram } from '../unified/lineage-diagram.ts'

// The key is page furniture, outside the graph, so it cannot affect its layout.
function withLegend(svg: string): string {
  const bounds = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  if (!bounds) throw Error('Expected an SVG viewBox starting at the origin')
  const width = Number(bounds[1]), height = Number(bounds[2]), column = (width - 200) / 3
  const background = /--bg:(#[\da-fA-F]{6})/.exec(svg)?.[1]
  if (!background) throw Error('Expected the renderer palette background')
  const text = (x: number, y: number, label: string) => `<text x="${x}" y="${y}">${label}</text>`
  const swatches = Object.values(lineageColours).map((colours, index) => {
    const x = 100 + index * column
    return `<rect x="${x}" y="${height - 9}" width="20" height="14" fill="${colours.fill}" stroke="${colours.stroke}"/>` + text(x + 32, height + 4, ['SVG renderer', 'Terminal-only renderer', 'Native PNG renderer'][index]!)
  }).join('')
  const line = (x: number, dashed: boolean) => `<path d="M${x},${height + 34} h36" fill="none" stroke="#5e81ac" stroke-width="1.45"${dashed ? ' stroke-dasharray="4 3"' : ''}/><path d="M${x + 36},${height + 30} l7,4 -7,4 Z" fill="#5e81ac"/>`
  const key = `<g id="lineage-legend" role="group" aria-label="Legend" font-family="Inter" font-size="16" fill="#233448">
    <rect x="0" y="${height - 60}" width="${width}" height="140" fill="${background}"/>
    <path d="M100,${height - 55} H${width - 100}" stroke="#a3b4c3"/>
    <text x="100" y="${height - 27}" font-size="15" font-weight="700">LEGEND</text>
    ${swatches}
    ${line(100, false)}${text(155, height + 40, 'Project lineage')}
    ${line(100 + column, true)}${text(155 + column, height + 40, 'ASCII component port')}
    <rect x="${100 + column * 2}" y="${height + 25}" width="20" height="16" fill="none" stroke="#a3b4c3"/>
    ${text(132 + column * 2, height + 40, 'Project group')}
  </g>`
  return svg.replace(/<svg\b[^>]*>/, root => root.replace(/height="[^"]*"/, `height="${height + 80}"`).replace(bounds[0], `viewBox="0 0 ${width} ${height + 80}"`)).replace(/<\/svg>\s*$/, key + '</svg>')
}

const flags = new Map<string, string>()
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]!, value = process.argv[index + 1]
  if (!['--renderer-entry', '--out', '--look', '--palette'].includes(key) || !value || flags.has(key)) throw Error('Use --renderer-entry INSTALLED_AGENTIC_ENTRY --out FRESH.svg [--look NAME] [--palette NAME]')
  flags.set(key, value)
}
if (!flags.has('--renderer-entry') || !flags.has('--out')) throw Error('Supply the installed public renderer and a fresh output path')
const entry = resolve(flags.get('--renderer-entry')!), out = resolve(flags.get('--out')!)
const png = out.replace(/\.svg$/, '.png'), receipt = out.replace(/\.svg$/, '.json')
if (!out.endsWith('.svg') || [out, png, receipt].some(existsSync)) throw Error('Choose fresh SVG, PNG and receipt paths')
const sourcePath = resolve(import.meta.dirname, '../docs/lineage-overview.mmd'), source = readFileSync(sourcePath, 'utf8')
const catalog = JSON.parse(readFileSync(resolve(import.meta.dirname, '../catalog/mermaid-community.json'), 'utf8')) as LineageCatalog
if (source !== lineageDiagram(catalog)) throw Error('Regenerate the selected lineage source with support --lineage --out FRESH.mmd')
const projects = comparisonProjects(catalog, catalog.nodes.map(node => node.id)).included
let packageRoot = dirname(entry), generatorVersion: string | undefined
while (packageRoot !== dirname(packageRoot)) {
  const manifest = join(packageRoot, 'package.json')
  if (existsSync(manifest)) { const pkg = JSON.parse(readFileSync(manifest, 'utf8')); if (pkg.name === 'agentic-mermaid') { generatorVersion = pkg.version; break } }
  packageRoot = dirname(packageRoot)
}
if (!generatorVersion) throw Error('Renderer entry must belong to an installed agentic-mermaid package')
const api = await import(pathToFileURL(entry).href)
if (typeof api.renderMermaidSVG !== 'function') throw Error('Renderer entry must expose the public SVG API')
const options = { padding: 100, style: [flags.get('--look') ?? 'publication-figure', flags.get('--palette') ?? 'nord-light', { font: 'Inter', roles: { node: { fontSize: 18, fontWeight: 600, fillColor: '#fffdf8', borderColor: '#7891a6', textColor: '#233448' }, edge: { fontSize: 14, strokeColor: '#5e81ac', textColor: '#456079' }, group: { fontSize: 15, fontWeight: 700, borderColor: '#a3b4c3' } } }] }
const diagramSvg = await api.renderMermaidSVG(source, options)
if (typeof diagramSvg !== 'string' || !diagramSvg.includes('<svg')) throw Error('The public renderer did not return SVG')
const svg = withLegend(diagramSvg)
writeFileSync(out, svg, { flag: 'wx' })
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
const fonts = (api.HOSTED_FONT_RESOURCES as { family: string; path: string; sha256: string }[]).filter(font => font.family === 'Inter')
if (!fonts.length) throw Error('Expected bundled Inter fonts in the renderer manifest')
const fontFiles = fonts.map(font => {
  const path = join(packageRoot, font.path)
  if (digest(path) !== font.sha256) throw Error('Bundled font hash mismatch: ' + font.path)
  return path
})
const pngOptions = { fitTo: { mode: 'width' as const, value: 1800 }, font: { loadSystemFonts: false, defaultFontFamily: 'Inter', fontFiles } }
writeFileSync(png, new Resvg(svg, pngOptions).render().asPng(), { flag: 'wx' })
writeFileSync(receipt, JSON.stringify({ generator: 'Agentic Mermaid', generatorVersion, entrySha256: digest(entry), source: 'docs/lineage-overview.mmd', sourceSha256: digest(sourcePath), projects, options, legend: 'SVG footer with colour swatches and line samples; outside the graph layout', diagramSvgSha256: createHash('sha256').update(diagramSvg).digest('hex'), png: { api: '@resvg/resvg-js', version: JSON.parse(readFileSync(resolve(import.meta.dirname, '../node_modules/@resvg/resvg-js/package.json'), 'utf8')).version, fonts: 'verified renderer bundle', fontSha256: fonts.map(font => ({ path: font.path, sha256: font.sha256 })), fitTo: pngOptions.fitTo, loadSystemFonts: false }, svgSha256: digest(out), pngSha256: digest(png), scope: 'Every normally scheduled renderer, with its configured rendering output checks. Failed and blocked interfaces remain possible; labels are not passes or qualified timing claims. Derivative, fork, component port and native renderer have distinct meanings. All catalog entities and exclusions remain in LINEAGE.md.' }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ out, png, receipt }))
