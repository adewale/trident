// AlexanderGrooff/mermaid-ascii: the prepared artifact is the release binary, so the
// bridge is compiled from the project's source at exactly the artifact's release tag.
// pkg/graph, pkg/sequence and pkg/er are called unchanged; the only addition is a
// generated table of each package's integer-constant names, injected with
// `go build -overlay` so the checkout itself is never written to.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const here = import.meta.dirname
const sources = ['main.go', 'walk.go', 'enumgen.go', 'go.sum', 'go.mod.in']
const packages = ['graph', 'sequence', 'er']

const run = (command: string, args: string[], cwd?: string) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim()

function goTool(): string {
  for (const candidate of [process.env.GO, 'go', '/usr/local/go/bin/go']) {
    if (!candidate) continue
    try { run(candidate, ['version']); return candidate } catch {}
  }
  throw Error('mermaid-ascii bridge: no Go toolchain found (set GO or put go on PATH)')
}

export async function build(peer: any, outDir: string): Promise<string[]> {
  if (peer?.node?.id !== 'AlexanderGrooff/mermaid-ascii') throw Error('mermaid-ascii bridge: expected the AlexanderGrooff/mermaid-ascii peer, got ' + peer?.node?.id)
  const version: string | undefined = peer.artifact?.version
  const revision: string | undefined = peer.artifact?.revision ?? peer.node?.release?.commit
  const repo: string = peer.node.repo ?? 'https://github.com/AlexanderGrooff/mermaid-ascii'
  if (!version || !revision) throw Error('mermaid-ascii bridge: prepared artifact records no release version and revision')
  if (peer.artifact.versionSource && peer.artifact.versionSource !== 'release-tag') throw Error('mermaid-ascii bridge: artifact version is not a release tag: ' + peer.artifact.versionSource)

  mkdirSync(outDir, { recursive: true })
  const source = join(outDir, 'mermaid-ascii-' + version)
  if (!existsSync(join(source, '.git'))) run('git', ['-c', 'advice.detachedHead=false', 'clone', '--quiet', '--depth', '1', '--branch', version, repo, source])
  const head = run('git', ['-C', source, 'rev-parse', 'HEAD'])
  if (head !== revision) throw Error(`mermaid-ascii bridge: checkout of tag ${version} is ${head}, but the artifact was built from ${revision}`)
  if (run('git', ['-C', source, 'status', '--porcelain', '--untracked-files=all'])) throw Error('mermaid-ascii bridge: source checkout ' + source + ' has local changes')
  for (const p of packages) if (!existsSync(join(source, 'pkg', p))) throw Error('mermaid-ascii bridge: tag ' + version + ' has no pkg/' + p)

  const go = goTool()
  const binary = join(outDir, 'mermaid-ascii-bridge')
  const stamp = createHash('sha256').update([revision, run(go, ['version']), ...sources.map(f => readFileSync(join(here, f), 'utf8'))].join('\0')).digest('hex')
  const stampFile = join(outDir, 'bridge.stamp')
  if (existsSync(binary) && existsSync(stampFile) && readFileSync(stampFile, 'utf8') === stamp) return [binary]

  const work = join(outDir, 'bridge'), overlayDir = join(outDir, 'overlay')
  mkdirSync(work, { recursive: true })
  mkdirSync(overlayDir, { recursive: true })
  for (const f of sources) if (f !== 'go.mod.in') copyFileSync(join(here, f), join(work, f))
  writeFileSync(join(work, 'go.mod'), readFileSync(join(here, 'go.mod.in'), 'utf8').replace('@SOURCE@', source))
  const replace: Record<string, string> = {}
  for (const p of packages) {
    const generated = join(overlayDir, p + '_enums.go')
    run(go, ['run', 'enumgen.go', join(source, 'pkg', p), generated], work)
    replace[join(source, 'pkg', p, 'zz_trident_bridge_enums.go')] = generated
  }
  writeFileSync(join(outDir, 'overlay.json'), JSON.stringify({ Replace: replace }, null, 1))
  run(go, ['build', '-trimpath', '-overlay', join(outDir, 'overlay.json'), '-o', binary, '.'], work)
  writeFileSync(stampFile, stamp)
  return [binary]
}
