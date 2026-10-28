import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { communityCatalogFile } from './trident-paths.ts'
import { lineageInventory, lineageMarkdown, type LineageCatalog } from './lineage.ts'
import { readCatalog, supportInventory, supportMarkdown } from './support.ts'

const args = process.argv.slice(2)
const lineage = args.includes('--lineage')
if (lineage) args.splice(args.indexOf('--lineage'), 1)
if (args.includes('--help')) console.log('bun commands.ts support [--lineage] [--catalog FILE] [--out FRESH_FILE.md|json]\nConfiguration coverage for every catalog entity; no install, build, benchmark or oracle required.')
else {
  const options = new Map<string, string>()
  for (let index = 0; index < args.length; index += 2) {
    if (!['--catalog', '--out'].includes(args[index]!) || !args[index + 1] || options.has(args[index]!)) throw Error('Use support --catalog FILE --out FRESH_FILE')
    options.set(args[index]!, args[index + 1]!)
  }
  const catalog = readCatalog(options.get('--catalog') ?? communityCatalogFile) as LineageCatalog
  const inventory = lineage ? lineageInventory(catalog) : supportInventory(catalog.nodes)
  const markdown = () => lineage ? lineageMarkdown(inventory as ReturnType<typeof lineageInventory>) : supportMarkdown(inventory as ReturnType<typeof supportInventory>)
  const out = options.get('--out')
  if (out) { const path = resolve(out); if (existsSync(path)) throw Error('Choose a fresh support report path'); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, out.endsWith('.md') ? markdown() : JSON.stringify(inventory, null, 2) + '\n', { flag: 'wx' }) }
  else console.log(lineage ? markdown() : JSON.stringify(inventory, null, 2))
}
