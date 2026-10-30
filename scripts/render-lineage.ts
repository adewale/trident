import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { comparisonProjects, type LineageCatalog } from '../unified/lineage.ts'
import { lineageDiagram } from '../unified/lineage-diagram.ts'

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
if (typeof api.renderMermaidPNG !== 'function') throw Error('Renderer entry must expose the public SVG and PNG APIs')
const options = { padding: 100, style: [flags.get('--look') ?? 'publication-figure', flags.get('--palette') ?? 'nord-light', { font: 'Inter', roles: { node: { fontSize: 18, fontWeight: 600, fillColor: '#fffdf8', borderColor: '#7891a6', textColor: '#233448' }, edge: { fontSize: 14, strokeColor: '#5e81ac', textColor: '#456079' }, group: { fontSize: 15, fontWeight: 700, borderColor: '#a3b4c3' } } }] }
const svg = await api.renderMermaidSVG(source, options)
if (typeof svg !== 'string' || !svg.includes('<svg')) throw Error('The public renderer did not return SVG')
writeFileSync(out, svg, { flag: 'wx' })
const pngOptions = { fitTo: { width: 1800 }, loadSystemFonts: false }
writeFileSync(png, await api.renderMermaidPNG(source, { ...options, ...pngOptions }), { flag: 'wx' })
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
writeFileSync(receipt, JSON.stringify({ generator: 'Agentic Mermaid', generatorVersion, entrySha256: digest(entry), source: 'docs/lineage-overview.mmd', sourceSha256: digest(sourcePath), projects, options, png: { api: 'renderMermaidPNG', fonts: 'verified renderer bundle', ...pngOptions }, svgSha256: digest(out), pngSha256: digest(png), scope: 'Every normally scheduled renderer, with its configured rendering output checks. Failed and blocked interfaces remain possible; labels are not passes or qualified timing claims. Derivative, fork, component port and native renderer have distinct meanings. All catalog entities and exclusions remain in LINEAGE.md.' }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ out, png, receipt }))
