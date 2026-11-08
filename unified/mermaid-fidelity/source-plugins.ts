import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Use the pinned project's own grammar/schema compilers, rather than replacing
 * production modules with approximations in the reference control. */
export async function sourcePlugins(upstream: string, runtime: string) {
  const require = createRequire(join(runtime, 'package.json'))
  const cache = join(runtime, 'node_modules/.cache')
  mkdirSync(cache, { recursive: true })
  const out = mkdtempSync(join(cache, 'trident-source-plugins-'))
  try {
    require('esbuild').buildSync({ entryPoints: [join(upstream, '.vite/jisonPlugin.ts'), join(upstream, '.vite/jsonSchemaPlugin.ts')], outdir: out, outExtension: { '.js': '.mjs' }, bundle: true, packages: 'external', platform: 'node', format: 'esm', target: 'node24' })
    const [{ default: jison }, { default: schema }] = await Promise.all([import(pathToFileURL(join(out, 'jisonPlugin.mjs')).href), import(pathToFileURL(join(out, 'jsonSchemaPlugin.mjs')).href)])
    return [jison(), schema()]
  } finally { rmSync(out, { recursive: true, force: true }) }
}
