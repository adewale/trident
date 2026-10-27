/** Prepare the actual pinned source runner without depending on a session-only kit. */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { mermaidOracleDirectory, mermaidUpstreamDirectory, admitMermaidOracle } from '../portable/mermaid-oracle.ts'
import { REVIEWED_REFERENCE } from './reference-eligibility.ts'

const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const minimum = (value: string) => {
  const match = value.match(/^[~^]?(\d+\.\d+\.\d+(?:-[\w.-]+)?)(?:\s*\|\|.*)?$/)
  if (!match) throw Error('Declare an explicit reviewed dependency for ' + value)
  return match[1]!
}
/** Resolve the original source runner's actual package operand. The addon's
 * semver minimum is not the engine selected by the pinned monorepo lock. */
export function upstreamZenCoreVersion(source: string): string {
  const lock = readFileSync(join(source, 'pnpm-lock.yaml'), 'utf8')
  const importer = lock.split(/(?=^ {2}\S)/m).find(section => /^ {2}packages\/mermaid-zenuml:\r?\n/.test(section))
  const matches = [...(importer ?? '').matchAll(/^ {6}'@zenuml\/core':\r?\n {8}specifier:[^\n]*\r?\n {8}version: (\d+\.\d+\.\d+(?:-[\w.-]+)?)(?=[(\s]|$)/gm)]
  if (matches.length !== 1) throw Error('Pinned source lock must select exactly one ZenUML core engine')
  return matches[0]![1]!
}
export function upstreamRuntimeDependencies(source: string): Record<string, string> {
  const root = read(join(source, 'package.json')), parser = read(join(source, 'packages/parser/package.json')),
    core = read(join(source, 'packages/mermaid/package.json'))
  const dependencies = Object.fromEntries(Object.entries(core.dependencies as Record<string, string>).filter(([, version]) => !version.startsWith('workspace:')).map(([name, version]) => [name, minimum(version)]))
  for (const name of ['vitest', 'vite', '@rollup/plugin-typescript', 'typescript', 'tslib', 'jison', 'js-yaml', 'ajv', 'esbuild', 'jsdom', 'langium-cli', 'sharp']) dependencies[name] = minimum(root.devDependencies[name])
  for (const name of ['langium', 'chevrotain']) dependencies[name] = minimum(parser.devDependencies[name])
  for (const name of ['fastdom', 'csstree-validator', 'js-base64', 'micromatch', 'path-browserify', 'remark', 'remark-frontmatter', 'remark-gfm', 'unist-util-flatmap', 'unist-util-visit', 'globby', 'prettier', '@adobe/jsonschema2md']) dependencies[name] = minimum(core.devDependencies[name])
  dependencies['@zenuml/core'] = upstreamZenCoreVersion(source)
  dependencies['non-layered-tidy-tree-layout'] = minimum(read(join(source, 'packages/mermaid-layout-tidy-tree/package.json')).devDependencies['non-layered-tidy-tree-layout'])
  dependencies['@mermaid-js/parser'] = parser.version
  dependencies.mermaid = REVIEWED_REFERENCE.version
  return dependencies
}
export function prepareUpstream(source: string, runtime: string, reference: string): void {
  source = realpathSync(source); runtime = resolve(runtime)
  const inside = (parent: string, child: string) => { const path = relative(parent, child); return !path || (!isAbsolute(path) && path !== '..' && !path.startsWith('..' + sep)) }
  if (inside(source, runtime) || inside(runtime, source)) throw Error('Use a dedicated runtime directory outside the pinned source tree')
  const git = (...args: string[]) => execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim()
  if (git('rev-parse', 'HEAD') !== REVIEWED_REFERENCE.commit || git('status', '--porcelain')) throw Error('Prepare only the clean pinned Mermaid source ' + REVIEWED_REFERENCE.commit)
  admitMermaidOracle(reference)
  mkdirSync(runtime, { recursive: true })
  const manifest = { name: 'trident-pinned-original-runner', private: true, type: 'module', dependencies: upstreamRuntimeDependencies(source) }, file = join(runtime, 'package.json')
  if (existsSync(file) && JSON.stringify(read(file)) !== JSON.stringify(manifest)) throw Error('Runtime directory has different dependencies; select a fresh --runtime directory')
  writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')
  const run = (command: string, args: string[], cwd: string) => execFileSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, npm_config_cache: process.env.npm_config_cache ?? join(runtime, 'npm-cache') } })
  const modules = join(source, 'node_modules'), destination = join(runtime, 'node_modules')
  if (existsSync(modules) && (!lstatSync(modules).isSymbolicLink() || realpathSync(modules) !== resolve(destination))) throw Error('Preserve the existing source runtime; prepare a separate pinned checkout instead')
  run('npm', [existsSync(join(runtime, 'package-lock.json')) ? 'ci' : 'install', '--ignore-scripts', '--no-audit', '--no-fund'], runtime)
  if (existsSync(modules) || (() => { try { return lstatSync(modules).isSymbolicLink() } catch { return false } })()) {
    if (!lstatSync(modules).isSymbolicLink()) throw Error('Existing source node_modules is not a symlink; preserve it and use its original workspace install')
    if (existsSync(modules) && realpathSync(modules) !== realpathSync(destination)) throw Error('Existing source runtime differs; do not replace an active runtime')
    unlinkSync(modules)
  }
  symlinkSync(destination, modules, 'dir')
  for (const [name, patch] of Object.entries(read(join(source, 'package.json')).pnpm?.patchedDependencies ?? {}) as [string, string][]) {
    const cwd = join(destination, name), file = join(source, patch)
    if (spawnSync('git', ['apply', '--check', file], { cwd }).status === 0) run('git', ['apply', file], cwd)
    else if (spawnSync('git', ['apply', '--reverse', '--check', file], { cwd }).status !== 0) throw Error('Upstream dependency patch cannot be applied or verified: ' + name)
  }
  const require = createRequire(file)
  run(process.execPath, [join(require.resolve('langium-cli/package.json'), '..', 'bin/langium.js'), 'generate'], join(source, 'packages/parser'))
  const elk = join(source, 'packages/mermaid-layout-elk')
  run(process.execPath, ['--input-type=module', '-e', "import {build} from 'esbuild'; import {defaultOptions,getBuildConfig} from './.esbuild/util.ts'; import {packageOptions} from './.build/common.ts'; await build(getBuildConfig({...defaultOptions,core:true,minify:false,sourcemap:false,options:packageOptions['mermaid-layout-elk']}))"], source)
  const scope = join(destination, '@mermaid-js'); mkdirSync(scope, { recursive: true })
  const elkLink = join(scope, 'layout-elk')
  if (!existsSync(elkLink)) symlinkSync(elk, elkLink, 'dir')
  if (git('status', '--porcelain')) throw Error('Source preparation altered tracked pinned files; inspect before running original tests')
  writeFileSync(join(runtime, 'preparation.json'), JSON.stringify({ sourceCommit: REVIEWED_REFERENCE.commit, runtime, source, reference, runner: manifest.dependencies.vitest, zenCoreVersion: manifest.dependencies['@zenuml/core'], protocol: 'declared-original-core-runner-preparation-v2', notes: 'Original vite.config.ts and test expectations are unchanged. ZenUML engine uses the pinned source lock selection. Runtime package-lock records resolved dependencies; compiled grammar and layout plugin are built from the pinned source.' }, null, 2) + '\n')
  console.log('Prepared original runner; pass --upstream-runner-root ' + runtime)
}
if (import.meta.main) {
  const args = new Map<string, string>()
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index]!, value = process.argv[index + 1]
    if (!['--source', '--runtime', '--reference'].includes(key) || args.has(key) || !value || value.startsWith('--')) throw Error('Use upstream:prepare --runtime DIR [--source PINNED_SOURCE] [--reference ORACLE]')
    args.set(key, resolve(value))
  }
  if (!args.has('--runtime')) throw Error('upstream:prepare requires a dedicated --runtime directory')
  prepareUpstream(args.get('--source') ?? mermaidUpstreamDirectory(), args.get('--runtime')!, args.get('--reference') ?? mermaidOracleDirectory())
}
