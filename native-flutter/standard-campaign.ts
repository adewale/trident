/** Execute existing Trident suite collectors; native transport renders PNG in Flutter. */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { runCommunitySuite, installedNpmIntegrity } from '../unified/community.ts'
import { prepareCommunityBrowsers } from '../unified/community-browser.ts'
import { runDocsBenchmark } from '../unified/docs-benchmark.ts'
import { runCommunityFidelitySuite } from '../fidelity/community.ts'
const root = resolve(import.meta.dirname, '..'),
  out = resolve(process.argv[2] ?? 'native-flutter-standard-results')
mkdirSync(out)
const prep = join(out, 'preparation')
mkdirSync(prep)
const digest = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const catalog = JSON.parse(readFileSync(join(root, 'catalog/mermaid-community.json'), 'utf8'))
const native = catalog.nodes.find((n: any) => n.id === 'orestesgaolin/mermaid'),
  pele = catalog.nodes.find((n: any) => n.id === 'obsidianmd/pele')
native.outputs = ['png']
native.benchmark = { adapter: 'native-flutter', outputs: ['png'], version: '0.3.2', runtime: 'native Linux Flutter release', apiBoundary: 'mermaid_flutter.renderToPng(source,pixelRatio:1)' }
for (const p of native.packages) p.version = '0.3.2'
native.notes += ' Explicit native Flutter PNG runtime investigation; no compiled JavaScript/SVG binding is used.'
pele.benchmark.moduleOutputs = [] // This campaign admits the actual Chromium transport, never Node SVG.
const runtimeCatalog = join(prep, 'runtime-catalog.json')
writeFileSync(runtimeCatalog, JSON.stringify(catalog, null, 2))
const bundle = resolve(process.env.FLUTTER_COMMUNITY_BUNDLE ?? join(root, 'native-flutter/app/build/linux/x64/release/bundle'))
const nativeExecutable = join(bundle, 'native_bench')
if (process.env.FLUTTER_COMMUNITY_EXECUTABLE && resolve(process.env.FLUTTER_COMMUNITY_EXECUTABLE) !== nativeExecutable) throw Error('Executable must belong to the sealed FLUTTER_COMMUNITY_BUNDLE')
process.env.FLUTTER_COMMUNITY_EXECUTABLE = nativeExecutable
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
const launcher = join(root, 'native-flutter/community-worker.mjs')
const nativeArtifact = {
  kind: 'jsonl-worker',
  executable: launcher,
  version: '0.3.2',
  runtime: 'Native Linux Flutter release',
  sha256: digest(launcher),
  files: [launcher, ...files(bundle)].map(path => ({ path, sha256: digest(path) })),
  apiBoundary: 'mermaid_flutter.renderToPng; native Flutter release, API startup excluded',
}
const pkgroot = join(root, 'native-flutter/node_modules/pele'),
  module = join(pkgroot, 'dist/pele.js')
const peleArtifact = { kind: 'node', root: pkgroot, module, version: '1.9.0', runtime: 'Chromium-only campaign', sha256: digest(module), files: [{ path: module, sha256: digest(module) }], integrity: installedNpmIntegrity(join(root, 'native-flutter'), pkgroot, 'pele', '1.9.0') }
const prepared = [
  { node: native, artifact: nativeArtifact },
  { node: pele, artifact: peleArtifact },
]
const preparedFile = join(prep, 'community-prepared.json')
writeFileSync(preparedFile, JSON.stringify(prepared, null, 2))
const browserFile = join(prep, 'community-browser-prepared.json')
const browserPreparation = await prepareCommunityBrowsers(prepared as any, { root, harnessRoot: root, out: prep, profile: 'full', rounds: 5, referenceDir: resolve(process.env.MERMAID_REFERENCE_DIR ?? join(root, '../mermaid-reference')) })
writeFileSync(browserFile, JSON.stringify(browserPreparation, null, 2))
const base = {
  root,
  harnessRoot: root,
  profile: 'full' as const,
  rounds: 5,
  executable: process.env.CHROMIUM_EXECUTABLE ?? '/usr/bin/chromium',
  communityProjects: (process.env.STANDARD_PROJECTS ?? [native.id, pele.id].join(',')).split(','),
  communityArtifactPolicy: 'frozen' as const,
  communityPreparedFile: preparedFile,
  communityBrowserPreparedFile: browserFile,
  communityCatalogFile: runtimeCatalog,
  communityCoverageOnce: true,
  mermaidDir: resolve(process.env.MERMAID_SOURCE_DIR ?? join(root, '../mermaid')),
  referenceDir: resolve(process.env.MERMAID_REFERENCE_DIR ?? join(root, '../mermaid-reference')),
  benchmarkForce: true,
}
const campaign: any = { startedAt: new Date().toISOString(), projects: base.communityProjects, profile: 'full', rounds: 5, contract: 'Existing standard collectors; native Flutter PNG versus Chromium SVG have separate format/runtime tables; no cross-runtime speed ratio', results: [] }
const save = () => writeFileSync(join(out, 'report.json'), JSON.stringify({ ...campaign, updatedAt: new Date().toISOString() }, null, 2))
for (const [suite, collect] of [
  ['community', runCommunitySuite],
  ['docs', runDocsBenchmark],
  ['fidelity', runCommunityFidelitySuite],
] as const) {
  if (process.env.STANDARD_SUITES && !process.env.STANDARD_SUITES.split(',').includes(suite)) continue
  const target = join(out, suite)
  mkdirSync(target)
  console.log('STANDARD SUITE', suite, new Date().toISOString())
  try {
    const result = await collect({ ...base, out: target, benchmarkRecordStore: join(target, 'records') })
    writeFileSync(join(target, 'result.json'), JSON.stringify(result, null, 2))
    campaign.results.push({ suite, status: result.status, out: target, observations: result.observations.length, counts: Object.fromEntries([...new Set(result.observations.map(r => r.status))].map(s => [s, result.observations.filter(r => r.status === s).length])), gaps: result.gaps })
  } catch (error) {
    campaign.results.push({ suite, status: 'blocked', detail: String(error) })
    console.error(suite, error)
  }
  save()
}
campaign.finishedAt = new Date().toISOString()
save()
writeFileSync(join(out, 'completed.json'), JSON.stringify({ finishedAt: campaign.finishedAt, collectionComplete: true, qualificationPassed: campaign.results.every((r: any) => r.status === 'passed') }, null, 2))
console.log('STANDARD CAMPAIGN COMPLETE', out)
