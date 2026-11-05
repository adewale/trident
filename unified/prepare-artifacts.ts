import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { prepareCommunity } from './community.ts'
import { prepareCommunityBrowsers } from './community-browser.ts'
import { comparisonProjects } from './lineage.ts'
import { tridentDirectory } from './trident-paths.ts'
import type { UnifiedRunOptions } from './types.ts'

const usage = `prepare --catalog FROZEN_CATALOG --out FRESH_DIRECTORY [--projects IDS]
Acquires and installs the catalog version of every selected comparison project
(default: all of them) with the shared community preparation, without running a benchmark.
Writes FRESH_DIRECTORY/community-prepared.json (the --prepared list for davebench:terminal
and --terminal-prepared for drawing:correctness) and community-browser-prepared.json
(the --prepared list for davebench and drawing:correctness). A project that cannot be
prepared stays in both lists with its error.`

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log(usage); return }
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) {
    if (!['--catalog', '--out', '--projects'].includes(args[i]!) || !args[i + 1] || options.has(args[i]!)) throw Error('Use ' + usage.split('\n')[0])
    options.set(args[i]!, args[i + 1]!)
  }
  if (!options.has('--catalog') || !options.has('--out')) throw Error('Use ' + usage.split('\n')[0])
  assertBenchmarkExecutionAllowed()
  const catalogFile = resolve(options.get('--catalog')!), out = resolve(options.get('--out')!)
  if (existsSync(out)) throw Error('Choose a fresh output directory')
  const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'))
  const projects = comparisonProjects(catalog, options.get('--projects')?.split(',') ?? catalog.nodes.map((node: { id: string }) => node.id)).included
  if (!projects.length) throw Error('No comparison projects selected')
  const config = { root: tridentDirectory, harnessRoot: tridentDirectory, out, profile: 'full', rounds: 3, communityCatalogFile: catalogFile, communityProjects: projects } as UnifiedRunOptions
  // prepareCommunity writes community-prepared.json into out.
  const prepared = await prepareCommunity(config)
  const browsers = await prepareCommunityBrowsers(prepared, config)
  writeFileSync(join(out, 'community-browser-prepared.json'), JSON.stringify(browsers, null, 2) + '\n')
  for (const peer of browsers) console.log(peer.node.id + ': ' + (peer.artifact ? 'prepared' : 'not prepared — ' + (peer.error ?? 'no artifact')))
}
if (import.meta.main) await main()
