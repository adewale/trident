import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { planDigest } from './campaign-plan.ts'
import { byteDigest, runtimeIdentity } from '../portable/artifacts.ts'
import { captureInstalledDependencyClosure } from '../portable/artifact-dependencies.ts'
import { execFileSync } from 'node:child_process'

/** Source imports and the pinned project's grammar/schema compilers execute in
 * the control. Include generated parser sources as well as tracked inputs. */
export function fidelityReferenceSources(root: string): { path: string; sha256: string }[] {
  const paths = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
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

/** Native bridge sources, build templates and locks are harness inputs too. */
export function fidelityHarnessSources(root: string): { path: string; sha256: string }[] {
  const tree = (directory: string): { path: string; sha256: string }[] => readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.name === '__pycache__' || entry.name === 'dom-free-files.json' || entry.name.endsWith('.md')) return []
    return entry.isDirectory() ? tree(path) : [{ path: relative(root, path), sha256: byteDigest(path) }]
  })
  return tree(root)
}

/** Bind reusable controls to their executing inputs, not their directory names.
 * Byte observation runs once before collection; timing results are never cached. */
export function fidelityControlIdentity(upstream: string, reference: string, runtime: string, files: readonly any[], pin: string, engine = runtimeIdentity(process.env.NODE_BIN ?? 'node')) {
  const harness = join(import.meta.dirname, 'mermaid-fidelity')
  const normalize = (value: unknown) => JSON.parse(JSON.stringify(value).replaceAll(upstream, '<upstream>').replaceAll(reference, '<reference>').replaceAll(runtime, '<runtime>'))
  return planDigest(normalize({
    protocol: 'fidelity-control-v1', referenceMode: 'pinned-production-source-v1', pin,
    source: fidelityReferenceSources(upstream),
    files: files.map(file => ({ path: file.path, sha256: byteDigest(file.absolute), declarations: file.declarations })),
    harness: fidelityHarnessSources(harness), sharedHarness: Object.fromEntries(['upstream-fidelity-census.ts', 'upstream-fidelity-projection.mjs', 'upstream-test-assertions.mjs', 'mermaid-fidelity.ts', 'fidelity-control.ts', 'campaign-plan.ts', '../portable/artifacts.ts', '../portable/artifact-dependencies.ts'].map(file => [file, byteDigest(join(import.meta.dirname, file))])),
    runtime: { ...engine, executableSha256: byteDigest(engine.executable) },
    environment: { locale: process.env.LANG, timezone: process.env.TZ },
    sourceLock: byteDigest(join(upstream, 'pnpm-lock.yaml')),
    packageInputs: [reference, runtime].map(root => ({ manifest: byteDigest(join(root, 'package.json')), lock: existsSync(join(root, 'package-lock.json')) ? byteDigest(join(root, 'package-lock.json')) : null })),
    reference: captureInstalledDependencyClosure(reference), runner: captureInstalledDependencyClosure(runtime), tooling: captureInstalledDependencyClosure(join(import.meta.dirname, '..')),
  }))
}

export function assertReusableControl(directory: string, identity: string) {
  const path = join(directory, 'control.json')
  const receipt = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined
  if (receipt?.protocol !== 'fidelity-control-v1' || receipt.identity !== identity || !existsSync(join(directory, 'environments.jsonl')) || receipt.resultsSha256 !== byteDigest(join(directory, 'vitest.json')) || receipt.auditSha256 !== byteDigest(join(directory, 'audit.jsonl')) || receipt.environmentSha256 !== byteDigest(join(directory, 'environments.jsonl'))) throw Error('Reused reference requires the same qualified control identity and unchanged evidence; recollect the reference')
}
