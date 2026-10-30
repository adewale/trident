import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { comparisonProjects, type LineageCatalog } from '../unified/lineage.ts'
import { lineageDiagram } from '../unified/lineage-diagram.ts'

const flags = new Map<string, string>()
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]!, value = process.argv[index + 1]
  if (!['--renderer-entry', '--out'].includes(key) || !value || flags.has(key)) throw Error('Use --renderer-entry INSTALLED_AGENTIC_ENTRY --out FRESH.svg')
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
const api = await import(pathToFileURL(entry).href)
const options = { padding: 100, style: ['publication-figure', 'nord-light', { font: 'Inter', roles: { node: { fontSize: 18, fontWeight: 600, fillColor: '#fffdf8', borderColor: '#7891a6', textColor: '#233448' }, edge: { fontSize: 14, strokeColor: '#5e81ac', textColor: '#456079' }, group: { fontSize: 15, fontWeight: 700, borderColor: '#a3b4c3' } } }] }
const svg = await api.renderMermaidSVG(source, options)
if (typeof svg !== 'string' || !svg.includes('<svg')) throw Error('The public renderer did not return SVG')
writeFileSync(out, svg, { flag: 'wx' })
writeFileSync(png, new Resvg(svg, { fitTo: { mode: 'width', value: 1800 }, font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' } }).render().asPng(), { flag: 'wx' })
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
writeFileSync(receipt, JSON.stringify({ generator: 'Agentic Mermaid', entrySha256: digest(entry), source: 'docs/lineage-overview.mmd', sourceSha256: digest(sourcePath), projects, options, svgSha256: digest(out), pngSha256: digest(png), scope: 'Every normally scheduled renderer, with its configured rendering output checks. Failed and blocked interfaces remain possible; labels are not passes or qualified timing claims. Derivative, fork, component port and native renderer have distinct meanings. All catalog entities and exclusions remain in LINEAGE.md.' }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ out, png, receipt }))
