/** Exact selected direct operands, with an explicitly separate npm closure. */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { currentReferencePin as REVIEWED_REFERENCE } from '../reference/source.ts'
import { captureInstalledDependencyClosure, type InstalledDependencyClosure } from '../portable/artifact-dependencies.ts'

type Section = 'dependencies' | 'devDependencies' | 'optionalDependencies'
export interface LockedOperand {
  kind: 'importer' | 'required-environment-peer'
  name: string
  importer: string
  section: Section
  manifestSpecifier?: string
  specifier: string
  operand: string
  version: string
  integrity: string | null
  requiredBy?: { name: string; operand: string; section: 'optionalDependencies' }
}
export const UPSTREAM_RUNTIME_PROTOCOL = 'locked-direct-original-runner-preparation-v3'
export const NPM_CLOSURE_SCOPE = 'Exact selected pinned-source importer versions plus its selected required jsdom Canvas adapter; remaining npm transitive/peer resolution is recorded separately. This is not the stock pnpm workspace closure.'
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
export const upstreamFileDigest = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')

/** Reuse the owning byte-level closure observer, retaining only its digest in
 * preparation receipts. Full observations already belong to original runs. */
export function upstreamInstalledClosureDigest(runtime: string, observed = captureInstalledDependencyClosure(runtime)) {
  // A caller's symlink spelling must not look like changed installed bytes.
  // Full observed logical paths remain available in the owning run evidence.
  const physical = { root: { realRoot: observed.root.realRoot, name: observed.root.name, version: observed.root.version }, nodes: observed.nodes.map(({ logicalRoots: _logicalRoots, ...node }) => node), edges: observed.edges.map(({ resolution, ...edge }) => ({ ...edge, resolution: resolution ? { realRoot: resolution.realRoot } : null })) }
  return { sha256: createHash('sha256').update(JSON.stringify(physical)).digest('hex'), packages: observed.nodes.length, files: observed.nodes.reduce((count, node) => count + node.files.length, 0) }
}

export function verifyUpstreamInstalledClosure(runtime: string, expected: { sha256?: unknown } | undefined, observed?: InstalledDependencyClosure) {
  if (typeof expected?.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(expected.sha256)) throw Error('Prepared installed package byte receipt is missing')
  const actual = upstreamInstalledClosureDigest(runtime, observed)
  if (expected.sha256 !== actual.sha256) throw Error('Prepared installed package bytes changed after qualification; use a fresh runtime')
  return actual
}

/** Preserve the complete peer/patch-qualified operand in receipts. Only the
 * registry version is sent to npm; links and aliases need a separate recipe. */
export function lockedRegistryVersion(operand: unknown): string {
  if (typeof operand !== 'string') throw Error('Missing pinned registry operand')
  const match = operand.match(/^(\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?)(?=\(|$)/)
  if (!match) throw Error('Unsupported pinned registry operand: ' + operand)
  let depth = 0
  for (const character of operand.slice(match[1]!.length)) {
    if (character === '(') depth++
    else if (character === ')') { if (--depth < 0) throw Error('Unbalanced pinned operand: ' + operand) }
    else if (!depth || /\s/.test(character)) throw Error('Malformed pinned operand: ' + operand)
  }
  if (depth) throw Error('Unbalanced pinned operand: ' + operand)
  return match[1]!
}

export function lockedImporterDependency(lock: any, importer: string, section: Section, name: string, manifestSpecifier?: string): LockedOperand {
  const entry = lock?.importers?.[importer]?.[section]?.[name]
  if (!entry || typeof entry.specifier !== 'string') throw Error(`Missing pinned operand: ${importer}/${section}/${name}`)
  const version = lockedRegistryVersion(entry.version)
  return { kind: 'importer', name, importer, section, ...(manifestSpecifier === undefined ? {} : { manifestSpecifier }), specifier: entry.specifier, operand: entry.version, version, integrity: lock.packages?.[`${name}@${version}`]?.resolution?.integrity ?? null }
}

/** jsdom without its selected native Canvas is a different test environment. */
export function lockedJsdomCanvas(lock: any): LockedOperand {
  const jsdom = lockedImporterDependency(lock, '.', 'devDependencies', 'jsdom')
  const operand = lock.snapshots?.[`jsdom@${jsdom.operand}`]?.optionalDependencies?.canvas
  if (!operand) throw Error('Pinned jsdom snapshot must select its Canvas optional dependency')
  const version = lockedRegistryVersion(operand)
  if (!jsdom.operand.includes(`(canvas@${operand})`)) throw Error('Canvas dependency differs from pinned jsdom peer operand')
  return { kind: 'required-environment-peer', name: 'canvas', importer: '.', section: 'optionalDependencies', specifier: `selected by jsdom@${jsdom.operand}`, operand, version, integrity: lock.packages?.[`canvas@${version}`]?.resolution?.integrity ?? null, requiredBy: { name: 'jsdom', operand: jsdom.operand, section: 'optionalDependencies' } }
}

export function upstreamRuntimePlan(source: string) {
  const lockFile = join(source, 'pnpm-lock.yaml'), lock = parse(readFileSync(lockFile, 'utf8'))
  const root = read(join(source, 'package.json')), parser = read(join(source, 'packages/parser/package.json')), core = read(join(source, 'packages/mermaid/package.json'))
  const operands: LockedOperand[] = [], dependencies: Record<string, string> = {}
  const add = (operand: LockedOperand) => {
    if (!operand.integrity) throw Error(`Pinned package integrity missing: ${operand.name}@${operand.version}`)
    if (dependencies[operand.name] && dependencies[operand.name] !== operand.version) throw Error(`Selected importers need different ${operand.name} versions; one flat npm runtime cannot represent them`)
    dependencies[operand.name] = operand.version
    operands.push(operand)
  }
  const select = (importer: string, section: Section, name: string, manifest: any) => {
    if (typeof manifest[section]?.[name] !== 'string') throw Error(`Source manifest does not declare ${importer}/${section}/${name}`)
    add(lockedImporterDependency(lock, importer, section, name, manifest[section][name]))
  }
  for (const [name, version] of Object.entries(core.dependencies as Record<string, string>)) if (!version.startsWith('workspace:')) select('packages/mermaid', 'dependencies', name, core)
  for (const name of ['vitest', 'vite', '@rollup/plugin-typescript', 'typescript', 'tslib', 'jison', 'js-yaml', 'ajv', 'esbuild', 'jsdom', 'langium-cli', 'sharp']) select('.', 'devDependencies', name, root)
  for (const name of ['langium', 'chevrotain']) select('packages/parser', 'devDependencies', name, parser)
  for (const name of ['fastdom', 'csstree-validator', 'js-base64', 'micromatch', 'path-browserify', 'remark', 'remark-frontmatter', 'remark-gfm', 'unist-util-flatmap', 'unist-util-visit', 'globby', 'prettier', '@adobe/jsonschema2md']) select('packages/mermaid', 'devDependencies', name, core)
  select('packages/mermaid-zenuml', 'dependencies', '@zenuml/core', read(join(source, 'packages/mermaid-zenuml/package.json')))
  select('packages/mermaid-layout-tidy-tree', 'devDependencies', 'non-layered-tidy-tree-layout', read(join(source, 'packages/mermaid-layout-tidy-tree/package.json')))
  add(lockedJsdomCanvas(lock))
  // These published tooling bridges do not replace the original source aliases.
  const bridges = [{ name: '@mermaid-js/parser', version: parser.version }, { name: 'mermaid', version: REVIEWED_REFERENCE.version }]
  for (const bridge of bridges) dependencies[bridge.name] = bridge.version
  return { dependencies, operands, bridges, sourceLock: { path: 'pnpm-lock.yaml', sha256: upstreamFileDigest(lockFile) }, closureScope: NPM_CLOSURE_SCOPE }
}

/** Check the installed direct packages and downloaded tarball integrities,
 * not just the requested manifest or a top-level Mermaid version string. */
export function verifyUpstreamInstalledSelections(runtime: string, plan: ReturnType<typeof upstreamRuntimePlan>) {
  const npmLock = read(join(runtime, 'package-lock.json'))
  for (const operand of plan.operands) {
    const installed = read(join(runtime, 'node_modules', operand.name, 'package.json'))
    const resolved = npmLock.packages?.[`node_modules/${operand.name}`]
    if (installed.name !== operand.name || installed.version !== operand.version || resolved?.version !== operand.version || resolved?.integrity !== operand.integrity) throw Error('Installed package does not match pinned operand/integrity: ' + operand.name)
  }
  for (const bridge of plan.bridges) if (read(join(runtime, 'node_modules', bridge.name, 'package.json')).version !== bridge.version) throw Error('Published tooling bridge differs: ' + bridge.name)
  return { path: 'package-lock.json', sha256: upstreamFileDigest(join(runtime, 'package-lock.json')) }
}

export function preflightUpstreamCanvas(runtime: string, node = process.env.NODE_BIN ?? 'node') {
  const script = fileURLToPath(new URL('./upstream-canvas-preflight.mjs', import.meta.url))
  return JSON.parse(execFileSync(node, [script, runtime], { encoding: 'utf8', maxBuffer: 128 * 1024 })) as { canvasVersion: string; jsdomVersion: string; nativeBindings: { path: string; sha256: string; bytes: number }[]; [key: string]: unknown }
}

export function upstreamRunnerVersion(runtime: string, expectedVersion: string): string {
  const require = createRequire(join(runtime, 'package.json'))
  const { version } = read(require.resolve('vitest/package.json'))
  if (typeof version !== 'string' || version !== expectedVersion) throw Error(`Original runner differs from pinned importer selection: expected=${expectedVersion}, actual=${version}`)
  return version
}

/** A package name cannot select a weaker qualification policy. Every original
 * baseline needs the same prepared seal, including caller-supplied runtimes. */
export function verifySealedUpstreamRuntime(source: string, runtime: string, plan: ReturnType<typeof upstreamRuntimePlan>, observedClosure?: InstalledDependencyClosure) {
  const file = join(runtime, 'preparation.json'), receipt = existsSync(file) ? read(file) : undefined
  if (receipt?.protocol !== UPSTREAM_RUNTIME_PROTOCOL || receipt.sourceCommit !== REVIEWED_REFERENCE.commit || receipt.sourceLock?.sha256 !== plan.sourceLock.sha256 || JSON.stringify(receipt.operands) !== JSON.stringify(plan.operands)) throw Error('Original baseline requires a sealed locked-direct preparation and real Canvas qualification; use upstream:prepare with fresh runtime/source directories')
  if (typeof receipt.source !== 'string' || typeof receipt.runtime !== 'string' || realpathSync(receipt.source) !== realpathSync(source) || realpathSync(receipt.runtime) !== realpathSync(runtime)) throw Error('Prepared original source/runtime binding differs; use its sealed source/runtime directories')
  const npmLock = verifyUpstreamInstalledSelections(runtime, plan)
  if (receipt.npmLock?.sha256 !== npmLock.sha256) throw Error('Prepared npm closure changed after qualification')
  verifyUpstreamInstalledClosure(runtime, receipt.installedClosure, observedClosure)
  if (receipt.nativeProvisioning?.log?.sha256 !== upstreamFileDigest(join(runtime, 'canvas-install.log'))) throw Error('Canvas provisioning log changed after qualification')
  return { preparation: receipt, npmLock }
}

export function qualifyOriginalRuntime(source: string, runtime: string, node: string, observedClosure?: InstalledDependencyClosure) {
  const plan = upstreamRuntimePlan(source)
  const { preparation, npmLock } = verifySealedUpstreamRuntime(source, runtime, plan, observedClosure)
  const runnerVersion = upstreamRunnerVersion(runtime, plan.dependencies.vitest!)
  const canvas = preflightUpstreamCanvas(runtime, node)
  if (canvas.canvasVersion !== plan.dependencies.canvas || canvas.jsdomVersion !== plan.dependencies.jsdom || !canvas.nativeBindings.length) throw Error('Original runner Canvas/jsdom differs from the pinned source operands')
  if (JSON.stringify(canvas.nativeBindings) !== JSON.stringify(preparation.canvas?.nativeBindings)) throw Error('Prepared Canvas native binding changed after qualification')
  return { protocol: UPSTREAM_RUNTIME_PROTOCOL, closureScope: NPM_CLOSURE_SCOPE, sourceLock: plan.sourceLock, npmLock, preparation, canvas, runnerVersion, expectedRunnerVersion: plan.dependencies.vitest }
}
