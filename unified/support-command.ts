import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { communityCatalogFile } from './trident-paths.ts'
import { readCatalog, supportInventory, supportMarkdown } from './support.ts'

const args = process.argv.slice(2)
if (args.includes('--help')) console.log('bun commands.ts support [--catalog FILE] [--out FRESH_FILE.md|json]\nConfiguration coverage for every catalog entity; no install, build, benchmark or oracle required.')
else {
  const options = new Map<string, string>()
  for (let index = 0; index < args.length; index += 2) {
    if (!['--catalog', '--out'].includes(args[index]!) || !args[index + 1] || options.has(args[index]!)) throw Error('Use support --catalog FILE --out FRESH_FILE')
    options.set(args[index]!, args[index + 1]!)
  }
  const inventory = supportInventory(readCatalog(options.get('--catalog') ?? communityCatalogFile).nodes)
  const out = options.get('--out')
  if (out) { const path = resolve(out); if (existsSync(path)) throw Error('Choose a fresh support report path'); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, out.endsWith('.md') ? supportMarkdown(inventory) : JSON.stringify(inventory, null, 2) + '\n', { flag: 'wx' }) }
  else console.log(JSON.stringify(inventory, null, 2))
}
