import { createRequire } from 'node:module'
import { extraPackagePreparation } from '../unified/community-extra-adapters.mjs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { captureInstalledDependencyClosure, type InstalledDependencyClosure } from './artifact-dependencies.ts'
import type { PortableArtifact } from './protocol.ts'

export const portableDirectory = dirname(fileURLToPath(import.meta.url))
export const readJson = (path: string): any => JSON.parse(readFileSync(path, 'utf8'))
export function byteDigest(path: string): string {
  const hash = createHash('sha256'),
    fd = openSync(path, 'r'),
    buffer = Buffer.alloc(1024 * 1024)
  try {
    let count: number
    while ((count = readSync(fd, buffer, 0, buffer.length, null))) hash.update(buffer.subarray(0, count))
  } finally {
    closeSync(fd)
  }
  return hash.digest('hex')
}
export function resolveArtifact(project: string, root: string, adapter: PortableArtifact['adapter'], node: string, entry?: string): PortableArtifact {
  const packageRoot = realpathSync(root),
    pkg = readJson(join(packageRoot, 'package.json'))
  const actualEntry = entry
    ? resolve(packageRoot, entry)
    : fileURLToPath(execFileSync(node, ['--experimental-import-meta-resolve', '--input-type=module', '-e', 'process.stdout.write(import.meta.resolve(process.argv[1], process.argv[2]))', pkg.name, pathToFileURL(join(packageRoot, 'package.json')).href], { encoding: 'utf8', timeout: 10_000 }).trim())
  if (!existsSync(actualEntry) || typeof pkg.version !== 'string') throw Error('A real installed package and public module entry are required')
  return { project, root: packageRoot, entry: realpathSync(actualEntry), version: pkg.version, adapter }
}
export interface PortableArtifactIdentity {
  artifact: PortableArtifact
  packageName: string
  packageMetadata: Record<string, unknown>
  entrySha256: string
  files: Array<{ path: string; sha256: string; bytes: number; gzipBytes: number }>
  dependencies: InstalledDependencyClosure
  adapterCompanions?: PortableArtifactIdentity[]
  deliveryScope: string
}
export function artifactIdentity(artifact: PortableArtifact): PortableArtifactIdentity {
  const pkg = readJson(join(artifact.root, 'package.json'))
  const walk = (directory: string): { path: string; sha256: string; bytes: number; gzipBytes: number }[] =>
    readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap(entry => {
        if (['node_modules', '.git'].includes(entry.name)) return []
        const path = join(directory, entry.name)
        if (entry.isDirectory()) return walk(path)
        if (entry.isSymbolicLink()) throw Error('Package-level symlinks require explicit shipped-artifact admission: ' + path)
        if (!entry.isFile()) return []
        const bytes = readFileSync(path)
        return [{ path: relative(artifact.root, path), sha256: byteDigest(path), bytes: bytes.byteLength, gzipBytes: gzipSync(bytes, { level: 9 }).byteLength }]
      })
  // Source checkouts of any project contribute only their delivered compiled
  // directory. Installed release packages contribute their complete payload.
  let payload = artifact.root
  if (existsSync(join(artifact.root, '.git'))) {
    const directory = relative(artifact.root, artifact.entry).split('/')[0]!
    if (!['dist', 'build', 'pkg'].includes(directory)) throw Error('Use an installed package or a compiled dist/build/pkg artifact, not source files')
    payload = join(artifact.root, directory)
  }
  const files = walk(payload)
  const companionSpecs = artifact.adapter === 'public-package' ? extraPackagePreparation(String(artifact.publicConfig?.package)).companions ?? [] : []
  const req = companionSpecs.length ? createRequire(join(artifact.root, 'package.json')) : undefined
  const adapterCompanions = companionSpecs.map((spec: string) => {
    const split = spec.lastIndexOf('@'), name = spec.slice(0, split), version = spec.slice(split + 1)
    const root = req!.resolve.paths(name)?.map(directory => join(directory, name)).find(directory => existsSync(join(directory, 'package.json')))
    if (!root) throw Error('Public adapter companion is missing: ' + spec)
    const manifest = readJson(join(root, 'package.json'))
    if (manifest.name !== name || manifest.version !== version) throw Error('Public adapter companion version differs: ' + spec)
    return artifactIdentity({ project: name, root: realpathSync(root), entry: join(realpathSync(root), 'package.json'), version, adapter: 'declared' })
  })
  return { artifact, packageName: pkg.name, packageMetadata: pkg, entrySha256: byteDigest(artifact.entry), files, dependencies: captureInstalledDependencyClosure(artifact.root), ...(adapterCompanions.length ? { adapterCompanions } : {}), deliveryScope: 'Per-file package gzip sizes are inventory, not observed network transfer or an npm tarball total.' }
}
export function harnessIdentity(directory = portableDirectory) {
  const manifest = join(directory, 'harness-artifact.json')
  if (existsSync(manifest)) {
    const data = readJson(manifest) as { protocol: string; files: { path: string; sha256: string }[] }
    if (data.protocol !== 'compiled-portable-harness-v1' || !['worker.mjs', 'execution.mjs', 'run.mjs'].every(path => data.files.some(file => file.path === path))) throw Error('Invalid compiled harness manifest')
    for (const file of data.files) if (!['worker.mjs', 'execution.mjs', 'run.mjs', 'mermaid-oracle-worker.mjs', 'package.json'].includes(file.path) || byteDigest(join(directory, file.path)) !== file.sha256) throw Error('Compiled harness bytes differ from their shipped identity')
    return { kind: 'compiled-measurement-artifacts', files: data.files.filter(file => ['worker.mjs', 'execution.mjs'].includes(file.path)) }
  }
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: directory, encoding: 'utf8' }).trim()
  const paths = ['../unified/community-extra-adapters.mjs', 'worker.mjs', 'configuration.ts', 'execution.ts', 'cohorts.ts', 'fidelity.ts', 'protocol.ts', 'ci-policy.ts', 'mermaid-oracle.ts'].map(name => relative(root, join(directory, name)))
  if (execFileSync('git', ['status', '--porcelain', '--', ...paths], { cwd: root, encoding: 'utf8' }).trim()) throw Error('Commit measured protocol files before collecting or reusing timings; use the compiled harness outside Git')
  const objects = execFileSync('git', ['ls-tree', '-r', 'HEAD', '--', ...paths], { cwd: root, encoding: 'utf8' })
    .trim()
    .split('\n')
  if (objects.length !== paths.length) throw Error('Measured protocol files are not committed')
  return { kind: 'git-protocol-objects', objects }
}
export function runtimeIdentity(node: string) {
  return JSON.parse(execFileSync(node, ['-e', 'process.stdout.write(JSON.stringify({executable:process.execPath,node:process.versions.node,v8:process.versions.v8,platform:process.platform,arch:process.arch}))'], { encoding: 'utf8', timeout: 10_000 }))
}
