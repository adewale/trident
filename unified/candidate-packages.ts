import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

export interface CandidateArchive { tarball: string; sha256: string }
export interface NpmCandidate extends CandidateArchive { dependencies?: CandidateArchive[] }
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

/** Public packed archives only: no workspace links or source-directory imports. */
export function candidatePackage(tarball: string): { name: string; version: string } {
  const pkg = JSON.parse(execFileSync('tar', ['-xOzf', tarball, 'package/package.json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }))
  if (typeof pkg.name !== 'string' || !/^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/i.test(pkg.name) || typeof pkg.version !== 'string' || !pkg.version.trim()) throw Error('Candidate tarball has no valid package name and version')
  return pkg
}
export function verifyCandidateArchive(archive: CandidateArchive) {
  if (!/^[a-f0-9]{64}$/.test(archive.sha256) || digest(archive.tarball) !== archive.sha256) throw Error('Candidate tarball differs from its supplied SHA-256')
}
/** An existing cache's lockfile is insufficient proof of its installed payload. */
export function verifyCandidateDependencyPayload(archive: CandidateArchive, root: string) {
  const files = execFileSync('tar', ['-tzf', archive.tarball], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim().split('\n').filter(path => !path.endsWith('/'))
  if (new Set(files).size !== files.length || files.some(path => !path.startsWith('package/') || path.slice(8).split('/').some(part => !part || part === '..' || part === '.'))) throw Error('Invalid candidate dependency archive paths')
  const installed = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git'].includes(entry.name)) return []
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) throw Error('Candidate dependency payload contains a symlink')
    return entry.isDirectory() ? installed(path) : [relative(root, path)]
  })
  if (JSON.stringify(installed(root).sort()) !== JSON.stringify(files.map(path => path.slice(8)).sort())) throw Error('Installed candidate dependency payload differs from its tarball')
  for (const file of files) {
    const expected = execFileSync('tar', ['-xOzf', archive.tarball, file], { maxBuffer: 64 * 1024 * 1024 })
    if (!expected.equals(readFileSync(join(root, file.slice(8))))) throw Error('Installed candidate dependency payload differs from its tarball: ' + file)
  }
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
  return candidate.sha256 + '-' + createHash('sha256').update(JSON.stringify(candidate.dependencies.map(entry => entry.sha256).sort())).digest('hex')
}
