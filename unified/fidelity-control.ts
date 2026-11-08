import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'
import { planDigest } from './campaign-plan.ts'
import { byteDigest, runtimeIdentity } from '../portable/artifacts.ts'
import { captureInstalledDependencyClosure, dependencyExecutionInputs } from '../portable/artifact-dependencies.ts'
import { execFileSync } from 'node:child_process'

/** Source imports and the pinned project's grammar/schema compilers execute in
 * the control. Include generated parser sources as well as tracked inputs. */
export function fidelityReferenceSources(root: string): { path: string; sha256: string }[] {
  const paths = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(path => /^(?:packages|docs|\.vite|\.build|e2e\/platform)\//.test(path) || !path.includes('/') && /\.(?:[cm]?[jt]s|json|ya?ml)$/.test(path))
  const walk = (directory: string) => {
    if (!existsSync(directory)) return
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (['node_modules', '.cache', '__pycache__'].includes(entry.name)) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.isFile()) paths.push(relative(root, path))
    }
  }
  // Runtime preparation generates ignored parsers, schemas and documentation
  // that original tests read. Git's tracked inventory alone cannot seal them.
  for (const directory of ['packages', 'docs', '.vite', '.build', 'e2e/platform']) walk(join(root, directory))
  return [...new Set(paths)].sort().map(path => ({ path, sha256: byteDigest(join(root, path)) }))
}

/** Follow local imports from the worker entry points, including schema views.
 * Candidate executables and dynamically loaded artifacts are bound separately. */
export function fidelityHarnessSources(root: string, entries = ['config.ts', 'setup.ts', 'runtime.ts']) {
  const sources = new Map<string, string>()
  const visit = (path: string) => {
    const name = relative(root, path)
    if (sources.has(name)) return
    const code = readFileSync(path, 'utf8')
    sources.set(name, byteDigest(path))
    for (const imported of ts.preProcessFile(code, true, true).importedFiles) {
      if (imported.fileName.startsWith('.')) visit(resolve(dirname(path), imported.fileName))
    }
  }
  for (const entry of entries) visit(resolve(root, entry))
  return Object.fromEntries([...sources].sort(([a], [b]) => a.localeCompare(b)))
}

/** Bind reusable controls to their executing inputs, not their directory names.
 * Byte observation runs once before collection; timing results are never cached. */
export function fidelityExecutionInputs(upstream: string, reference: string, runtime: string, files: readonly any[], pin: string, engine = runtimeIdentity(process.env.NODE_BIN ?? 'node'), tooling = join(import.meta.dirname, '..')) {
  const harness = join(import.meta.dirname, 'mermaid-fidelity')
  const normalize = (value: unknown) => JSON.parse(JSON.stringify(value).replaceAll(upstream, '<upstream>').replaceAll(reference, '<reference>').replaceAll(runtime, '<runtime>'))
  return normalize({
    protocol: 'fidelity-execution-v2', referenceMode: 'pinned-production-source-v1', pin,
    source: fidelityReferenceSources(upstream),
    files: files.map(file => ({ path: file.path, sha256: byteDigest(file.absolute), family: file.family, declarations: file.declarations, helperIdentifiers: file.helperIdentifiers, fileIdentifiers: file.fileIdentifiers })),
    // Only modules actually loaded by the worker belong to execution identity.
    // Bridge recipes bind their generated executable/scripts on each target.
    harness: fidelityHarnessSources(harness),
    runtime: { ...engine, executable: undefined, executableSha256: byteDigest(engine.executable) },
    environment: { locale: process.env.LANG, timezone: process.env.TZ, nodeOptions: process.env.NODE_OPTIONS, bunOptions: process.env.BUN_OPTIONS },
    sourceLock: byteDigest(join(upstream, 'pnpm-lock.yaml')),
    reference: dependencyExecutionInputs(captureInstalledDependencyClosure(reference)), runner: dependencyExecutionInputs(captureInstalledDependencyClosure(runtime)), tooling: dependencyExecutionInputs(captureInstalledDependencyClosure(tooling)),
  })
}

export function fidelityControlIdentity(...args: Parameters<typeof fidelityExecutionInputs>) { return planDigest(fidelityExecutionInputs(...args)) }

/** Only data consumed by the worker or identifying its actual artifacts. */
export function fidelityTargetIdentity(target: any) {
  const { description: _description, ...bridge } = target.bridge ?? {}
  const owned = target.peer?.artifact ?? {}
  const artifact = Object.fromEntries(['kind', 'sha256', 'integrity', 'files', 'installedClosureSha256', 'root', 'module', 'executable', 'python', 'wasm', 'adapterCompanions', 'candidate', 'sourceFiles', 'dependencyPatches'].filter(key => owned[key] !== undefined).map(key => [key, owned[key]]))
  const helpers = target.tool === 'mermaid' ? [] : target.tool !== 'bridge' ? ['native-call.mjs', 'bridges/common.mjs'] : target.bridge.command.some((argument: string) => /\.[cm]?[jt]s$/.test(argument)) ? ['bridges/common.mjs'] : []
  return planDigest({ project: target.project, version: target.version, sha256: target.sha256, tool: target.tool, root: target.root, entry: target.entry, parserEntries: target.parserEntries, configInterface: target.configInterface, usesBun: /Bun/.test(owned.runtime ?? ''), bunSha256: target.bunSha256, bridge, artifact, helpers: fidelityHarnessSources(join(import.meta.dirname, 'mermaid-fidelity'), helpers) })
}

export function assertReusableControl(directory: string, identity: string) {
  const path = join(directory, 'control.json')
  const receipt = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined
  if (receipt?.protocol !== 'fidelity-control-v1' || receipt.identity !== identity || !existsSync(join(directory, 'environments.jsonl')) || receipt.resultsSha256 !== byteDigest(join(directory, 'vitest.json')) || receipt.auditSha256 !== byteDigest(join(directory, 'audit.jsonl')) || receipt.environmentSha256 !== byteDigest(join(directory, 'environments.jsonl'))) throw Error('Reused reference requires the same qualified control identity and unchanged evidence; recollect the reference')
}
