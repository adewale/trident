/** Prepare the actual pinned source runner without depending on a session-only kit. */
import { execFileSync, spawnSync } from 'node:child_process'
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, delimiter, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { parse } from 'yaml'
import { mermaidOracleDirectory, mermaidUpstreamDirectory, admitMermaidOracle } from '../portable/mermaid-oracle.ts'
import { currentReferencePin as REVIEWED_REFERENCE } from '../reference/source.ts'
import { lockedImporterDependency, NPM_CLOSURE_SCOPE, preflightUpstreamCanvas, qualifyOriginalRuntime, UPSTREAM_RUNTIME_PROTOCOL, upstreamFileDigest, upstreamInstalledClosureDigest, upstreamRuntimePlan, verifyUpstreamInstalledSelections } from './upstream-runtime-qualification.ts'

const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
/** Resolve the original source runner's actual package operand. The addon's
 * semver minimum is not the engine selected by the pinned monorepo lock. */
export function upstreamZenCoreVersion(source: string): string {
  return lockedImporterDependency(parse(readFileSync(join(source, 'pnpm-lock.yaml'), 'utf8')), 'packages/mermaid-zenuml', 'dependencies', '@zenuml/core').version
}
export function upstreamRuntimeDependencies(source: string): Record<string, string> {
  return upstreamRuntimePlan(source).dependencies
}
export function prepareUpstream(source: string, runtime: string, reference: string, node = process.env.NODE_BIN ?? 'node'): void {
  source = realpathSync(source)
  // Resolve existing symlink ancestors before the containment guard, including
  // when the selected runtime directory has not been created yet.
  let ancestor = resolve(runtime)
  const missing: string[] = []
  while (!existsSync(ancestor)) { missing.unshift(basename(ancestor)); ancestor = dirname(ancestor) }
  runtime = join(realpathSync(ancestor), ...missing)
  const inside = (parent: string, child: string) => { const path = relative(parent, child); return !path || (!isAbsolute(path) && path !== '..' && !path.startsWith('..' + sep)) }
  if (inside(source, runtime) || inside(runtime, source)) throw Error('Use a dedicated runtime directory outside the pinned source tree')
  const git = (...args: string[]) => execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim()
  if (git('rev-parse', 'HEAD') !== REVIEWED_REFERENCE.commit || git('status', '--porcelain')) throw Error('Prepare only the clean pinned Mermaid source ' + REVIEWED_REFERENCE.commit)
  admitMermaidOracle(reference)
  mkdirSync(runtime, { recursive: true })
  const lock = join(runtime, '.preparation.lock')
  let descriptor: number
  try { descriptor = openSync(lock, 'wx') } catch { throw Error('Original runtime preparation is active or interrupted: ' + lock + '. Check its processes before removing an interrupted lock.') }
  try {
    writeFileSync(descriptor, JSON.stringify({ pid: process.pid, source, runtime }) + '\n')
    const plan = upstreamRuntimePlan(source)
    const manifest = { name: 'trident-pinned-original-runner', private: true, type: 'module', dependencies: plan.dependencies }, file = join(runtime, 'package.json')
    if (existsSync(file) && JSON.stringify(read(file)) !== JSON.stringify(manifest)) throw Error('Runtime directory has different dependencies; select a fresh --runtime directory')
    const modules = join(source, 'node_modules'), destination = join(runtime, 'node_modules')
    if (existsSync(modules) && (!lstatSync(modules).isSymbolicLink() || realpathSync(modules) !== resolve(destination))) throw Error('Preserve the existing source runtime; prepare a separate pinned checkout instead')
    if (existsSync(join(runtime, 'preparation.json'))) {
      const previous = read(join(runtime, 'preparation.json'))
      if (previous.protocol !== UPSTREAM_RUNTIME_PROTOCOL || previous.source !== source || previous.runtime !== runtime || !existsSync(modules)) throw Error('Preserve the existing prepared runtime; choose fresh source/runtime directories')
      qualifyOriginalRuntime(source, runtime, node)
      console.log('Existing original runtime qualified read-only; no installation or rebuild performed: ' + runtime)
      return
    }
    writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')
    const environment: NodeJS.ProcessEnv = { ...process.env, npm_config_cache: process.env.npm_config_cache ?? join(runtime, 'npm-cache') }
    const run = (command: string, args: string[], cwd: string) => execFileSync(command, args, { cwd, stdio: 'inherit', env: environment })
    run('npm', [existsSync(join(runtime, 'package-lock.json')) ? 'ci' : 'install', '--ignore-scripts', '--no-audit', '--no-fund'], runtime)
    verifyUpstreamInstalledSelections(runtime, plan)
    // Only this required native adapter may run its explicit installation step.
    // npm --ignore-scripts otherwise leaves canvas.node absent.
    const nativeNode = execFileSync(node, ['-p', 'process.execPath'], { encoding: 'utf8' }).trim()
    const nativeArguments = ['rebuild', 'canvas', '--foreground-scripts', '--ignore-scripts=false']
    const nativeLog = join(runtime, 'canvas-install.log')
    const provision = spawnSync('npm', nativeArguments, { cwd: runtime, env: { ...environment, PATH: dirname(nativeNode) + delimiter + (environment.PATH ?? '') }, encoding: 'utf8', timeout: 600_000, maxBuffer: 4 * 1024 * 1024 })
    writeFileSync(nativeLog, (provision.stdout ?? '') + (provision.stderr ?? ''))
    if (provision.error || provision.status !== 0) throw Error(`Real pinned Canvas native provisioning failed; inspect ${nativeLog}. ${provision.error?.message ?? provision.status}`)
    const nativeProvisioning = { command: 'npm', arguments: nativeArguments, nodeExecutable: nativeNode, log: { path: 'canvas-install.log', sha256: upstreamFileDigest(nativeLog) }, integrityScope: 'The pinned npm SRI authenticates the Canvas wrapper tarball. Its install step separately downloads or builds a native addon; the qualified native SHA records that observed platform artifact, not a pnpm-authenticated binary.' }
    const canvas = preflightUpstreamCanvas(runtime, node)
    if (canvas.canvasVersion !== plan.dependencies.canvas || canvas.jsdomVersion !== plan.dependencies.jsdom) throw Error('Qualified Canvas/jsdom differs from the pinned importer selections')
    if (existsSync(modules) || (() => { try { return lstatSync(modules).isSymbolicLink() } catch { return false } })()) {
      if (!lstatSync(modules).isSymbolicLink()) throw Error('Existing source node_modules is not a symlink; preserve it and use its original workspace install')
      if (existsSync(modules) && realpathSync(modules) !== realpathSync(destination)) throw Error('Existing source runtime differs; do not replace an active runtime')
      unlinkSync(modules)
    }
    symlinkSync(destination, modules, 'dir')
    const patches = []
    for (const [name, patch] of Object.entries(read(join(source, 'package.json')).pnpm?.patchedDependencies ?? {}) as [string, string][]) {
      const cwd = join(destination, name), file = join(source, patch)
      if (spawnSync('git', ['apply', '--check', file], { cwd }).status === 0) run('git', ['apply', file], cwd)
      else if (spawnSync('git', ['apply', '--reverse', '--check', file], { cwd }).status !== 0) throw Error('Upstream dependency patch cannot be applied or verified: ' + name)
      patches.push({ name, path: patch, sha256: upstreamFileDigest(file) })
    }
    const require = createRequire(file)
    run(process.execPath, [join(require.resolve('langium-cli/package.json'), '..', 'bin/langium.js'), 'generate'], join(source, 'packages/parser'))
    const elk = join(source, 'packages/mermaid-layout-elk')
    run(process.execPath, ['--input-type=module', '-e', "import {build} from 'esbuild'; import {defaultOptions,getBuildConfig} from './.esbuild/util.ts'; import {packageOptions} from './.build/common.ts'; await build(getBuildConfig({...defaultOptions,core:true,minify:false,sourcemap:false,options:packageOptions['mermaid-layout-elk']}))"], source)
    const scope = join(destination, '@mermaid-js'); mkdirSync(scope, { recursive: true })
    const elkLink = join(scope, 'layout-elk')
    if (!existsSync(elkLink)) symlinkSync(elk, elkLink, 'dir')
    if (git('status', '--porcelain')) throw Error('Source preparation altered tracked pinned files; inspect before running original tests')
    const npmLock = verifyUpstreamInstalledSelections(runtime, plan)
    const installedClosure = upstreamInstalledClosureDigest(runtime)
    writeFileSync(join(runtime, 'preparation.json'), JSON.stringify({ sourceCommit: REVIEWED_REFERENCE.commit, runtime, source, reference, runner: manifest.dependencies.vitest, zenCoreVersion: manifest.dependencies['@zenuml/core'], protocol: UPSTREAM_RUNTIME_PROTOCOL, sourceLock: plan.sourceLock, operands: plan.operands, bridges: plan.bridges, npmLock, installedClosure, patches, nativeProvisioning, canvas, closureScope: NPM_CLOSURE_SCOPE, notes: 'Original vite.config.ts and test expectations are unchanged. Selected direct registry versions and required Canvas come from actual pinned source lock operands. npm package-lock, direct tarball integrities and qualified installed package bytes are verified separately; original patches, generated grammar and compiled layout plugin remain explicit. Native Canvas and jsdom pixel readback run in the selected Node executable before test collection.' }, null, 2) + '\n')
    console.log('Prepared original runner; pass --upstream-runner-root ' + runtime)
  } finally { closeSync(descriptor); unlinkSync(lock) }
}
if (import.meta.main) {
  const usage = 'upstream:prepare --runtime DIR [--source PINNED_SOURCE] [--reference ORACLE] [--node-executable NODE]'
  if (process.argv.length === 3 && process.argv[2] === '--help') { console.log(usage); process.exit(0) }
  const args = new Map<string, string>()
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index]!, value = process.argv[index + 1]
    if (!['--source', '--runtime', '--reference', '--node-executable'].includes(key) || args.has(key) || !value || value.startsWith('--')) throw Error('Use ' + usage)
    args.set(key, key === '--node-executable' ? value : resolve(value))
  }
  if (!args.has('--runtime')) throw Error('upstream:prepare requires a dedicated --runtime directory')
  prepareUpstream(args.get('--source') ?? mermaidUpstreamDirectory(), args.get('--runtime')!, args.get('--reference') ?? mermaidOracleDirectory(), args.get('--node-executable'))
}
