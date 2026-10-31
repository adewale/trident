import { createHash } from 'node:crypto'
import { readFileSync, realpathSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import type { Route } from 'playwright'
import { tridentDirectory } from './trident-paths.ts'
export const defaultDocsResources = resolve(tridentDirectory, 'corpus/docs-assets.json')
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
export function readDocsResources(file = defaultDocsResources) {
  const bytes = readFileSync(file), rows = JSON.parse(bytes.toString())
  if (!Array.isArray(rows)) throw Error('Documentation resources must be an array')
  const root = realpathSync(dirname(file)), urls = new Set<string>()
  const resources = rows.map((row: any) => {
    if (!row || typeof row.url !== 'string' || !/^https?:\/\//.test(row.url) || urls.has(row.url) || typeof row.path !== 'string' || !/^[a-f0-9]{64}$/.test(row.sha256) || typeof row.contentType !== 'string') throw Error('Invalid or duplicate frozen documentation resource')
    urls.add(row.url)
    const path = realpathSync(resolve(root, row.path))
    if (relative(root, path).startsWith('..')) throw Error('Documentation resource escapes its manifest')
    const body = readFileSync(path)
    if (digest(body) !== row.sha256) throw Error('Frozen documentation resource bytes changed')
    return { ...row, path, body }
  })
  return { manifestSha256: digest(bytes), resources, identity: resources.map(({ body: _body, ...row }: any) => row) }
}
export async function routeDocsResource(route: Route, origin: string, resources: ReturnType<typeof readDocsResources>) {
  const url = route.request().url(), resource = resources.resources.find((row: any) => row.url === url)
  if (resource) return route.fulfill({ body: resource.body, contentType: resource.contentType })
  if (new URL(url).origin === origin) return route.continue()
  return route.abort()
}
