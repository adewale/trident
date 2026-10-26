import { expect, test } from 'bun:test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

// tsconfig.standalone.json's exclude list is the Agentic adapter set: every file whose
// import closure, cycles and type-only imports included, leaves this package.
const root = resolve(import.meta.dir, '..')

function sources(directory = root): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) return []
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sources(path)
    return /\.(ts|mts|mjs)$/.test(entry.name) && !entry.name.endsWith('.d.ts') && !entry.name.endsWith('.d.mts') ? [path] : []
  })
}

function adapterSet(): string[] {
  const local = new Map<string, string[]>(), leaving = new Set<string>()
  for (const file of sources()) {
    const specifiers = [...readFileSync(file, 'utf8').matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)['"](\.[^'"]*)['"]/g)].map(match => match[1]!)
    local.set(file, [])
    for (const specifier of specifiers) {
      const target = resolve(dirname(file), specifier)
      if (!target.startsWith(root + '/')) leaving.add(file)
      const found = [target, target + '.ts', target + '.mjs'].find(path => existsSync(path) && statSync(path).isFile())
      if (found) local.get(file)!.push(found)
    }
  }
  const importers = new Map<string, string[]>()
  for (const [file, imports] of local) for (const imported of imports) importers.set(imported, [...(importers.get(imported) ?? []), file])
  for (const queue = [...leaving]; queue.length; ) for (const importer of importers.get(queue.pop()!) ?? []) if (!leaving.has(importer)) leaving.add(importer), queue.push(importer)
  return [...leaving].map(file => relative(root, file)).sort()
}

test('the standalone exclude list is exactly the files that import Agentic source', () => {
  const exclude: string[] = JSON.parse(readFileSync(join(root, 'tsconfig.standalone.json'), 'utf8')).exclude
  expect(exclude.filter(entry => entry !== 'node_modules' && entry !== 'dist')).toEqual(adapterSet())
})
