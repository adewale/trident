import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, chmodSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { CommunityArtifact, CommunityNode } from './community-types.ts'

export interface ReleaseCli {
  repository: string
  tag: string
  version: string
  revision: string
  outputs: Record<string, { args: string[]; input?: 'stdin' | 'file' }>
  platforms: Record<string, { asset: string; sha256: string; executable: string }>
}
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
export function verifyReleaseCli(node: CommunityNode, artifact: CommunityArtifact): void {
  const spec = node.benchmark?.cliRelease
  if (!spec) return
  for (const extra of artifact.additionalCli ?? []) {
    if (!extra.artifact) continue
    const cli = extra.artifact, platform = spec.platforms[`${process.platform}-${process.arch}`]
    if (!platform || extra.id !== 'native-release' || cli.kind !== 'cli' || cli.version !== spec.version || cli.revision !== spec.revision || JSON.stringify(extra.outputs) !== JSON.stringify(Object.keys(spec.outputs)) || JSON.stringify(cli.outputBindings) !== JSON.stringify(spec.outputs)) throw Error('Frozen release CLI differs from its declared public binding')
    const archive = cli.files?.find(file => file.path === join(cli.root!, platform.asset))
    if (!archive || archive.sha256 !== platform.sha256 || digest(readFileSync(archive.path)) !== platform.sha256) throw Error('Frozen release CLI archive differs from its reviewed SHA-256')
    const bytes = execFileSync('tar', ['-xOf', archive.path, '--', platform.executable], { maxBuffer: 128 * 1024 * 1024 })
    if (cli.sha256 !== digest(bytes) || !cli.executable || digest(readFileSync(cli.executable)) !== digest(bytes)) throw Error('Frozen release CLI executable differs from its reviewed archive')
  }
}
/** A separately identified public CLI transport; never relabel a WASM artifact
 * as native code just because both distributions use the same version string. */
export async function prepareReleaseCli(node: CommunityNode, cache: string): Promise<NonNullable<CommunityArtifact['additionalCli']>[number]> {
  const spec = node.benchmark!.cliRelease!
  const outputs = Object.keys(spec.outputs), id = 'native-release'
  try {
    const platform = spec.platforms[`${process.platform}-${process.arch}`]
    if (!platform) throw Error('No reviewed public CLI asset for this platform')
    if (spec.repository !== node.id || !/^[a-f0-9]{40}$/.test(spec.revision) || !/^[a-f0-9]{64}$/.test(platform.sha256)) throw Error('Release CLI requires reviewed repository, source revision and archive SHA-256')
    const safe = (path: string) => /^[\w.-]+(?:\/[\w.-]+)*$/.test(path) && !path.split('/').some(part => part === '..' || part === '.')
    const memberPath = platform.executable.replace(/^(?:\.\/)+/, '')
    if (!safe(memberPath) || !safe(platform.asset) || !safe(spec.tag)) throw Error('Unsafe public release path')
    const root = resolve(cache, 'public-release-cli', node.id.replaceAll('/', '--'), spec.tag, platform.sha256)
    mkdirSync(root, { recursive: true })
    const archive = join(root, platform.asset), executable = join(root, platform.executable)
    const url = `https://github.com/${spec.repository}/releases/download/${spec.tag}/${platform.asset}`
    if (!existsSync(archive)) {
      const response = await fetch(url, { signal: AbortSignal.timeout(120_000) })
      if (!response.ok) throw Error('Release CLI download HTTP ' + response.status)
      const bytes = new Uint8Array(await response.arrayBuffer())
      if (digest(bytes) !== platform.sha256) throw Error('Release CLI archive SHA-256 mismatch')
      writeFileSync(archive, bytes, { flag: 'wx' })
    }
    if (digest(readFileSync(archive)) !== platform.sha256) throw Error('Retained release CLI archive SHA-256 mismatch')
    // Extract only the reviewed regular-file member, without trusting archive paths or links.
    const bytes = execFileSync('tar', ['-xOf', archive, '--', platform.executable], { maxBuffer: 128 * 1024 * 1024 })
    if (!existsSync(executable)) { mkdirSync(join(executable, '..'), { recursive: true }); writeFileSync(executable, bytes, { flag: 'wx' }); chmodSync(executable, 0o755) }
    if (digest(readFileSync(executable)) !== digest(bytes)) throw Error('Release CLI executable differs from its authenticated archive')
    const observedVersion = execFileSync(executable, ['--version'], { encoding: 'utf8', timeout: 10_000 }).trim()
    if (!observedVersion.split(/\s+/).includes(spec.version)) throw Error('Release CLI version differs: ' + observedVersion)
    const first = spec.outputs[outputs[0]!]!
    return { id, outputs, artifact: { kind: 'cli', root, executable, args: first.args, input: first.input ?? 'stdin', outputBindings: spec.outputs, version: spec.version, revision: spec.revision, sha256: digest(bytes), files: [{ path: executable, sha256: digest(bytes) }, { path: archive, sha256: platform.sha256 }], runtime: `${process.platform}-${process.arch} public native CLI`, apiBoundary: 'public release executable; fresh process, stdin/file through drained output', detail: `Archive ${url}; SHA-256 ${platform.sha256}. Source revision names the release tag, not a reproducible-build assertion.` } }
  } catch (error) { return { id, outputs, error: String(error) } }
}
