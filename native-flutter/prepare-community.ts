import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { nativePngArtifact } from './community-launch.mjs'
import { communityCatalogFile } from '../unified/trident-paths.ts'
import type { CommunityNode } from '../unified/community-types.ts'

/** Select a published public runtime without replacing the catalog's Dart SVG default. */
export function nativePngNode(node: CommunityNode): CommunityNode {
  return { ...node, outputs: ['png'], packages: node.packages?.map(pkg => pkg.registry === 'pub.dev' ? { ...pkg, version: '0.3.2' } : pkg), benchmark: { adapter: 'native-flutter', outputs: ['png'], version: '0.3.2', runtime: 'native Linux Flutter release', apiBoundary: 'mermaid_flutter.renderToPng(source,pixelRatio:1)' } }
}
export function prepareNativeCommunity(bundle: string, out: string) {
  if (existsSync(out)) throw Error('Choose a fresh native preparation directory')
  const original = JSON.parse(readFileSync(communityCatalogFile, 'utf8'))
  const node = nativePngNode(original.nodes.find((node: CommunityNode) => node.id === 'orestesgaolin/mermaid'))
  mkdirSync(out, { recursive: true })
  const artifact = nativePngArtifact(bundle, join(out, 'native-launch.json'))
  const catalog = join(out, 'catalog.json'), prepared = join(out, 'prepared.json')
  writeFileSync(catalog, JSON.stringify({ ...original, nodes: [node], edges: [] }, null, 2) + '\n')
  writeFileSync(prepared, JSON.stringify([{ node, artifact }], null, 2) + '\n')
  return { catalog, prepared, artifact }
}
if (import.meta.main) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') console.log('bun native-flutter/prepare-community.ts --bundle RELEASE_BUNDLE --out FRESH_DIRECTORY\nSeals an existing community_worker.dart native release bundle for normal support:verify or bench --suites community. Builds and renders nothing.')
  else {
    const values = new Map<string, string>()
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i]!, value = args[i + 1]
      if (!['--bundle', '--out'].includes(key) || !value || value.startsWith('--') || values.has(key)) throw Error('Use --bundle RELEASE_BUNDLE --out FRESH_DIRECTORY')
      values.set(key, value)
    }
    if (values.size !== 2) throw Error('Use --bundle RELEASE_BUNDLE --out FRESH_DIRECTORY')
    console.log(JSON.stringify(prepareNativeCommunity(resolve(values.get('--bundle')!), resolve(values.get('--out')!))))
  }
}
