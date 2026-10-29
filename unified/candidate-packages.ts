import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export interface CandidateArchive { tarball: string; sha256: string }
export interface NpmCandidate extends CandidateArchive { dependencies?: CandidateArchive[] }
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

/** Check path safety, not registry naming policy: scoped leaves may start with _. */
function safePackageName(name: unknown): name is string {
  if (typeof name !== 'string') return false
  const scoped = name.startsWith('@'), parts = name.split('/')
  if (parts.length !== (scoped ? 2 : 1)) return false
  if (scoped) parts[0] = parts[0]!.slice(1)
  return parts.every(part => part.length > 0 && part !== '.' && part !== '..' && encodeURIComponent(part) === part)
}

/** Public packed archives only: no workspace links or source-directory imports. */
export function candidatePackage(tarball: string): { name: string; version: string } {
  const pkg = JSON.parse(execFileSync('tar', ['-xOzf', tarball, 'package/package.json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }))
  if (!safePackageName(pkg.name) || typeof pkg.version !== 'string' || !pkg.version.trim()) throw Error('Candidate tarball has no valid package name and version')
  return pkg
}
export function verifyCandidateArchive(archive: CandidateArchive) {
  if (!/^[a-f0-9]{64}$/.test(archive.sha256) || digest(archive.tarball) !== archive.sha256) throw Error('Candidate tarball differs from its supplied SHA-256')
}
/** An existing cache's lockfile is insufficient proof of its installed payload. */
export function verifyCandidateDependencyPayload(archive: CandidateArchive, root: string) {
  const files = execFileSync('tar', ['-tzf', archive.tarball], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim().split('\n').filter(path => !path.endsWith('/'))
  if (new Set(files).size !== files.length || files.some(path => !path.startsWith('package/') || path.slice(8).split('/').some(part => !part || part === '..' || part === '.'))) throw Error('Invalid candidate dependency archive paths')
  const archived = files.map(path => path.slice(8)), ownedPaths = new Set<string>()
  for (const file of archived) {
    const parts = file.split('/')
    for (let count = 1; count <= parts.length; count++) ownedPaths.add(parts.slice(0, count).join('/'))
  }
  const installed = (directory: string, prefix = ''): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    const name = prefix ? prefix + '/' + entry.name : entry.name
    // Traverse bundled packages from the archive, excluding separately installed
    // dependencies and npm's generated .bin/.package-lock metadata.
    if (entry.name === '.git' || (entry.name === 'node_modules' || /(?:^|\/)node_modules(?:\/@[^/]+)?$/.test(prefix)) && !ownedPaths.has(name)) return []
    if (entry.isSymbolicLink()) throw Error('Candidate dependency payload contains a symlink')
    return entry.isDirectory() ? installed(path, name) : [name]
  })
  if (JSON.stringify(installed(root).sort()) !== JSON.stringify(archived.sort())) throw Error('Installed candidate dependency payload differs from its tarball')
  return files.map(file => {
    const expected = execFileSync('tar', ['-xOzf', archive.tarball, file], { maxBuffer: 64 * 1024 * 1024 })
    const path = join(root, file.slice(8)), actual = readFileSync(path)
    if (!expected.equals(actual)) throw Error('Installed candidate dependency payload differs from its tarball: ' + file)
    return { path, sha256: createHash('sha256').update(actual).digest('hex') }
  })
}
export function candidateDependencies(manifest: string): CandidateArchive[] {
  const entries: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
  if (!Array.isArray(entries) || !entries.length) throw Error('--candidate-dependencies needs a nonempty JSON array of {tarball, sha256}')
  return entries.map(entry => {
    if (!entry || typeof entry.tarball !== 'string' || typeof entry.sha256 !== 'string') throw Error('Invalid candidate dependency archive')
    const archive = { tarball: resolve(dirname(manifest), entry.tarball), sha256: entry.sha256 }
    verifyCandidateArchive(archive)
    return archive
  })
}
/** Paths and input ordering do not change identity; every archive's bytes do. */
export function candidateKey(candidate: NpmCandidate | { revision: string }): string {
  if ('revision' in candidate) return candidate.revision
  if (!candidate.dependencies?.length) return candidate.sha256
  return createHash('sha256').update(JSON.stringify({ root: candidate.sha256, dependencies: candidate.dependencies.map(entry => entry.sha256).sort() })).digest('hex')
}
