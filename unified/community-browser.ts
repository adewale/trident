
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { build } from 'esbuild'
import { extraBrowserEntry } from './community-extra-adapters.mjs'
import type { CommunityArtifact, PreparedCommunity } from './community-types.ts'
import type { UnifiedRunOptions, } from './types.ts'
import { tridentDirectory } from './trident-paths.ts'
import { mermaidOracleDirectory, mermaidZenumlAddon } from '../portable/mermaid-oracle.ts'
import { candidateKey } from './candidate-packages.ts'

type BrowserKind = 'beautiful' | 'pele' | 'mermaid' | 'function' | 'ondine' | 'franken' | 'merman' | 'extra'
export interface CommunityBrowserEngine {
  root: string
  entry: string
  kind: BrowserKind
  global?: string
  wasm?: string
  version: string
  revision?: string
  artifactSha256: string
  integrity?: string
  output?: 'svg' | 'png' | 'excalidraw'
  legacyMermaid?: boolean
  /** Recorded by preparations before 5 November, whose browser suite loaded it; nothing loads it now. */
  qualificationHelper?: string
  apiBoundary?: string
  surface?: string
  files?: { path: string; sha256: string }[]
  scriptType?: 'module'
  synchronousLegacyRender?: boolean
  additionalOutputs?: 'png'[]
  zenuml?: { root: string; entry: string; version: string }
}
export interface PreparedCommunityBrowser extends PreparedCommunity {
  browser?: CommunityBrowserEngine
  browserStatus: 'prepared' | 'blocked' | 'not-applicable'
  browserDetail?: string
}
const digest = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex')
const safe = (id: string): string => encodeURIComponent(id)
/** Read and verify the browser closure once; hosts serve these exact bytes. */
export function verifyCommunityBrowser(engine: CommunityBrowserEngine) {
  const entry = resolve(engine.root, engine.entry)
  const files = engine.files ?? []
  if (!files.some(file => resolve(file.path) === entry && file.sha256 === engine.artifactSha256)) throw Error('Prepared browser manifest does not bind its entry')
  if (engine.wasm && !files.some(file => resolve(file.path) === resolve(engine.root, engine.wasm!))) throw Error('Prepared browser manifest does not bind its WASM')
  if (engine.zenuml && !files.some(file => resolve(file.path) === resolve(engine.zenuml!.root, engine.zenuml!.entry))) throw Error('Prepared browser manifest does not bind its ZenUML entry')
  const verified = new Map<string, Buffer>()
  for (const file of files) {
    const bytes = readFileSync(file.path)
    if (!/^[a-f0-9]{64}$/.test(file.sha256) || digest(bytes) !== file.sha256) throw Error('Prepared browser asset changed: ' + file.path)
    verified.set(resolve(file.path), bytes)
  }
  return verified
}
/** Seal executable/browser assets, not source-tree inputs or node_modules.
 * Delivery totals still use only observed requests, never this overapproximation. */
function browserFiles(engine: CommunityBrowserEngine): { path: string; sha256: string }[] {
  const paths = new Set<string>([resolve(engine.root, engine.entry)])
  if (engine.wasm) paths.add(resolve(engine.root, engine.wasm))
  if (engine.qualificationHelper) paths.add(engine.qualificationHelper)
  const scope = engine.entry.startsWith('dist/') ? join(engine.root, 'dist') : engine.root
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (['node_modules', '.git', 'test', 'tests', '__tests__'].includes(entry.name)) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile()) {
        if (entry.name === 'entry.mjs' && path !== resolve(engine.root, engine.entry)) continue
        if (/\.(?:[cm]?js|wasm|woff2?|ttf|otf|css|svg|png|jpe?g|gif|webp|avif|ico|bin|data)$/i.test(entry.name) || (/\.json$/i.test(entry.name) && (engine.integrity || /(?:^|[/\\])(?:dist|assets|fonts)(?:[/\\])/.test(path)))) paths.add(path)
      }
    }
  }
  visit(scope)
  if (engine.zenuml) { paths.add(resolve(engine.zenuml.root, engine.zenuml.entry)); visit(join(engine.zenuml.root, 'dist')) }
  return [...paths].sort().map(path => ({ path, sha256: digest(readFileSync(path)) }))
}
// A candidate's bundle never shares a directory with the release of the same version.
const bundleDirectory = (cache: string, id: string, artifact: CommunityArtifact) => join(cache, safe(id), artifact.candidate ? `${artifact.version}-candidate-${candidateKey(artifact.candidate)}` : artifact.version)
function packageRoot(artifact: CommunityArtifact): string | undefined {
  if (artifact.root && existsSync(join(artifact.root, 'package.json'))) return artifact.root
  if (!artifact.module) return undefined
  let directory = dirname(resolve(artifact.module))
  for (;;) {
    if (existsSync(join(directory, 'package.json'))) return directory
    const parent = dirname(directory)
    if (parent === directory) return undefined
    directory = parent
  }
}
async function installWebMerman(prepared: PreparedCommunity, cache: string): Promise<string> {
  const declared = prepared.node.packages?.find(pkg => pkg.registry === 'npm' && pkg.name === '@mermanjs/web')
  if (!declared) throw new Error('The community node declares no @mermanjs/web browser package')
  const version = prepared.artifact?.version ?? declared.version,
    prefix = join(cache, 'merman-web', version),
    root = join(prefix, 'node_modules/@mermanjs/web')
  if (!existsSync(join(root, 'package.json'))) {
    mkdirSync(prefix, { recursive: true })
    await new Promise<void>((done, reject) => {
      const child = spawn('npm', ['install', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', `@mermanjs/web@${version}`], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, npm_config_cache: process.env.npm_config_cache ?? join(cache, 'npm-cache') } })
      let error = ''
      child.stdout.on('data', chunk => {
        error = (error + String(chunk)).slice(-5000)
      })
      child.stderr.on('data', chunk => {
        error = (error + String(chunk)).slice(-5000)
      })
      const timer = setTimeout(() => child.kill('SIGKILL'), 120_000)
      child.once('error', cause => {
        clearTimeout(timer)
        reject(cause)
      })
      child.once('close', code => {
        clearTimeout(timer)
        code === 0 ? done() : reject(new Error(`@mermanjs/web acquisition exited ${code}: ${error}`))
      })
    })
  }
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  if (pkg.version !== version) throw new Error('Merman web installed version differs from the pinned candidate')
  return root
}

/** Preparation is deliberately separate from all API clocks. It may bundle
 * actual published JS entries or acquire the separately published browser SDK. */
export async function prepareCommunityBrowsers(prepared: readonly PreparedCommunity[], options: UnifiedRunOptions): Promise<PreparedCommunityBrowser[]> {
  const harness = options.harnessRoot ?? options.root,
    cache = join(harness, 'node_modules/.cache/unified-community-browser'),
    results: PreparedCommunityBrowser[] = []
  mkdirSync(cache, { recursive: true })
  for (const peer of prepared) {
    let result: PreparedCommunityBrowser = { ...peer, browserStatus: 'blocked' }
    try {
      if (!peer.node.benchmark) {
        results.push({ ...peer, browserStatus: 'not-applicable', browserDetail: 'Metadata/lineage/wrapper node: no independent browser renderer adapter is declared.' })
        continue
      }
      const sourceAdapter = (peer.node.benchmark as { sourceAdapter?: string }).sourceAdapter
      const adapter = ['beautiful-source', 'beautiful-fork'].includes(sourceAdapter ?? '') ? 'beautiful' : ['mermaid-source', 'mermaid-fork'].includes(sourceAdapter ?? '') ? 'mermaid' : peer.node.benchmark?.adapter,
        artifact = peer.artifact
      const supported = peer.node.benchmark?.outputs ?? peer.node.outputs
      if (!supported.includes('svg') && !supported.includes('excalidraw')) {
        results.push({ ...peer, browserStatus: 'not-applicable', browserDetail: 'This community capability does not expose SVG rendering.' })
        continue
      }
      const make = (root: string, entry: string, kind: BrowserKind, global?: string, wasm?: string): CommunityBrowserEngine => {
        const file = resolve(root, entry)
        if (!file.startsWith(resolve(root) + sep) || !existsSync(file)) throw new Error(`Browser entry is missing or outside artifact root: ${file}`)
        return {
          root: resolve(root),
          entry,
          kind,
          ...(global ? { global } : {}),
          ...(wasm ? { wasm } : {}),
          version: artifact?.version ?? peer.node.packages?.find(pkg => pkg.registry === 'npm')?.version ?? peer.node.distribution?.version ?? peer.node.release?.tag ?? 'unavailable',
          ...(artifact?.revision ? { revision: artifact.revision } : {}),
          artifactSha256: digest(readFileSync(file)),
          ...(artifact?.integrity ? { integrity: artifact.integrity } : {}),
        }
      }
      let engine: CommunityBrowserEngine | undefined
      if (adapter === 'merman') {
        if (artifact?.candidate) throw new Error('The Merman Node candidate has no matching candidate browser SDK; a released @mermanjs/web cannot represent it')
        const root = await installWebMerman(peer, cache),
          pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
        engine = make(root, pkg.main, 'merman')
        engine.version = pkg.version
        const lock = JSON.parse(readFileSync(join(root, '../../..', 'package-lock.json'), 'utf8'))
        engine.integrity = lock.packages?.['node_modules/@mermanjs/web']?.integrity
      } else if (!artifact) throw new Error(peer.error ?? 'No prepared browser artifact or published package')
      else if (artifact.kind === 'global') {
        if (!artifact.module) throw new Error('Global artifact has no module path')
        const root = artifact.root ?? dirname(artifact.module),
          entry = relative(root, artifact.module),
          global = artifact.global ?? (adapter === 'dart' ? 'mermaidDartRender' : adapter === 'bezel' ? 'bezelRender' : undefined)
        if (!global) throw new Error('Global artifact must declare its public global symbol')
        engine = make(root, entry, adapter === 'dart' || adapter === 'bezel' ? 'function' : 'beautiful', global)
      } else if (artifact.kind === 'franken') {
        if (!artifact.module) throw new Error('Franken artifact has no JS module')
        const root = artifact.root ?? dirname(artifact.module),
          wasm = artifact.wasm ?? join(dirname(artifact.module), 'frankenmermaid_bg.wasm')
        if (!existsSync(wasm)) throw new Error(`Franken WASM missing: ${wasm}`)
        engine = make(root, relative(root, artifact.module), 'franken', undefined, relative(root, wasm))
      } else if (artifact.kind === 'node') {
        const root = packageRoot(artifact)
        if (!root) throw new Error('Cannot resolve prepared published package root')
        const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')),
          zombie = pkg.name === 'zombie-mermaid'
        const browserRecipe = typeof pkg.scripts?.['build:browser'] === 'string' ? (pkg.scripts['build:browser'] as string) : ''
        const declaredBrowser = browserRecipe.match(/--outfile(?:=|\s+)([^\s]+)/)?.[1]?.replace(/^['"]|['"]$/g, '')
        const publicBeautifulBundle =
          adapter === 'beautiful' &&
          sourceAdapter &&
          declaredBrowser?.startsWith('dist/') &&
          existsSync(join(root, declaredBrowser)) &&
          existsSync(join(root, 'README.md')) &&
          readFileSync(join(root, 'README.md'), 'utf8').includes(declaredBrowser) &&
          readFileSync(join(root, declaredBrowser), 'utf8').includes('window.__mermaid')
            ? declaredBrowser
            : undefined
        if (adapter === 'agentic') engine = make(root, 'dist/browser.global.js', 'beautiful', 'agenticMermaid')
        else if (publicBeautifulBundle) {
          engine = make(root, publicBeautifulBundle, 'beautiful', '__mermaid')
          engine.scriptType = 'module'
          engine.apiBoundary = 'Documented tracked public browser distribution window.__mermaid; source package entry remains a separate Bun invocation'
        } else if (adapter === 'mermaid') {
          const publicBundle = ['dist/mermaid.min.js', 'dist/mermaid.js'].find(path => existsSync(join(root, path)))
          if (publicBundle) engine = make(root, publicBundle, 'mermaid', 'mermaid')
          else {
            const output = bundleDirectory(cache, peer.node.id, artifact)
            mkdirSync(output, { recursive: true })
            const entry = join(output, 'entry.mjs')
            writeFileSync(entry, `import api from ${JSON.stringify(artifact.module)};globalThis.unifiedMermaid=api;`)
            await build({ entryPoints: [entry], outfile: join(output, 'bundle.js'), bundle: true, platform: 'browser', format: 'iife', minify: true, target: 'es2022', logLevel: 'silent' })
            engine = make(output, 'bundle.js', 'mermaid', 'unifiedMermaid')
          }
          engine.legacyMermaid = Number.parseInt(pkg.version, 10) < 10
          engine.synchronousLegacyRender = Number.parseInt(pkg.version, 10) < 1
        } else if (adapter === 'pele' && existsSync(join(root, 'dist/pele.global.js'))) engine = make(root, 'dist/pele.global.js', 'pele', 'pele')
        else if (adapter === 'published-extra') {
          const spec = extraBrowserEntry(pkg.name, artifact) as { source: string; assets?: { source: string; name: string }[]; outputs?: string[]; qualification: string; surface?: string } | null
          if (!spec) {
            results.push({ ...peer, browserStatus: 'not-applicable', browserDetail: 'Reviewed published API is terminal/native/diagnostic/source/IR; no browser SVG API is declared by that entry.' })
            continue
          }
          const output = bundleDirectory(cache, peer.node.id, artifact)
          mkdirSync(output, { recursive: true })
          const entry = join(output, 'entry.mjs')
          writeFileSync(entry, spec.source)
          for (const asset of spec.assets ?? []) {
            if (!existsSync(asset.source)) throw new Error(`Published browser asset unavailable: ${asset.source}`)
            copyFileSync(asset.source, join(output, asset.name))
          }
          await build({ entryPoints: [entry], outfile: join(output, 'bundle.js'), bundle: true, platform: 'browser', format: 'iife', globalName: 'unifiedExtra', minify: true, external: ['node:*'], target: 'es2022', logLevel: 'silent' })
          engine = make(output, 'bundle.js', 'extra', 'unifiedExtra')
          if (spec.outputs?.includes('excalidraw') && supported.includes('excalidraw')) engine.output = 'excalidraw'
          engine.apiBoundary = spec.qualification
          engine.surface = spec.surface
          if (spec.outputs?.includes('png') && supported.includes('png')) engine.additionalOutputs = ['png']
        } else if (['beautiful', 'zombie', 'pele', 'ondine'].includes(adapter ?? '') || (adapter === 'declared' && !!peer.node.benchmark?.api?.svg)) {
          const output = bundleDirectory(cache, peer.node.id, artifact)
          mkdirSync(output, { recursive: true })
          const entry = join(output, 'entry.mjs'),
            source = artifact.module && existsSync(artifact.module) ? artifact.module : join(root, typeof pkg.main === 'string' ? pkg.main : 'dist/index.js')
          if (adapter === 'ondine') {
            const renderer = join(root, 'dist/Render.js'),
              wasm = join(root, 'dist/internal/all.generated.wasm')
            if (!existsSync(renderer) || !existsSync(wasm)) throw new Error('Ondine published Render.js/WASM assets unavailable')
            copyFileSync(wasm, join(output, 'all.wasm'))
            writeFileSync(entry, `import{create}from ${JSON.stringify(renderer)};globalThis.unifiedLoadOndine=async()=>create({modules:{all:new WebAssembly.Module(await(await fetch('/all.wasm')).arrayBuffer())}});`)
          } else if (zombie || adapter === 'zombie') {
            const require = createRequire(join(root, 'package.json')),
              elk = require.resolve('elkjs/lib/elk.bundled.js')
            writeFileSync(entry, `import{registerElk}from ${JSON.stringify(source)};import ELK from ${JSON.stringify(elk)};registerElk(ELK);export*from ${JSON.stringify(source)};`)
          } else if (adapter === 'declared') writeFileSync(entry, `import*as api from ${JSON.stringify(source)};import{declaredRenderer}from ${JSON.stringify(join(tridentDirectory, 'unified/declared-adapter.mjs'))};export const renderMermaidSVG=declaredRenderer(api,${JSON.stringify(peer.node.benchmark!.api!.svg)},'svg');`)
          else writeFileSync(entry, `export*from ${JSON.stringify(source)};`)
          await build({ entryPoints: [entry], outfile: join(output, 'bundle.js'), bundle: true, platform: 'browser', format: 'iife', globalName: 'unifiedPeer', minify: true, target: 'es2022', logLevel: 'silent' })
          engine = make(output, 'bundle.js', adapter === 'ondine' ? 'ondine' : adapter === 'pele' ? 'pele' : 'beautiful', adapter === 'ondine' ? 'unifiedLoadOndine' : 'unifiedPeer')
        } else {
          results.push({ ...peer, browserStatus: 'not-applicable', browserDetail: 'Prepared package exposes a native/Node transport; no declared browser rendering API adapter.' })
          continue
        }
      } else {
        results.push({ ...peer, browserStatus: 'not-applicable', browserDetail: 'Prepared native CLI/Python/worker has no browser rendering distribution.' })
        continue
      }
      if (!engine) throw new Error('Browser preparation produced no executable engine')
      if (peer.node.id === 'mermaid-js/mermaid') engine.zenuml = mermaidZenumlAddon(options.referenceDir ?? mermaidOracleDirectory(), options.fidelityZenumlRoot ?? process.env.MERMAID_ZENUML_BENCHMARK_ROOT)
      engine.files = browserFiles(engine)
      result = { ...result, browser: engine, browserStatus: 'prepared' }
    } catch (error) {
      result.browserDetail = String(error)
    }
    results.push(result)
  }
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'community-browser-prepared.json'), JSON.stringify(results, null, 2) + '\n')
  return results
}
