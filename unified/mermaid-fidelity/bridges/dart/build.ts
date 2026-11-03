// mermaid_core 0.3.2, the parser behind both orestesgaolin/mermaid (Mermaid Dart) and
// pub:mermaid_flutter (which calls core's parser unchanged). One build serves both peers.
// The bridge is an AOT executable: start-up is a few milliseconds, against ~200 ms for
// the JIT VM. Model field lists are generated at build time by tool/gen.dart (dart:mirrors
// over mermaid_core's own classes), since AOT code cannot use mirrors.
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CORE_VERSION = '0.3.2'
const peers = ['orestesgaolin/mermaid', 'pub:mermaid_flutter']
const here = import.meta.dirname
const sources = ['pubspec.yaml', 'lib/families.dart', 'bin/bridge.dart', 'tool/gen.dart']

const run = (command: string, args: string[], cwd?: string, env?: Record<string, string>) =>
  execFileSync(command, args, { cwd, env: env && { ...process.env, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim()

function dartTool(): string {
  for (const candidate of [process.env.AM_BENCH_DART, process.env.DART, 'dart']) {
    if (!candidate) continue
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' })
    if (probe.error || probe.status !== 0) continue
    const version = probe.stdout + probe.stderr
    const [major, minor] = (version.match(/Dart SDK version: (\d+)\.(\d+)/) ?? []).slice(1).map(Number)
    if (major > 3 || (major === 3 && minor >= 12)) return candidate
  }
  throw Error('Dart bridge: no Dart SDK >= 3.12 found (set AM_BENCH_DART, as the Dart community adapter does, or put dart on PATH)')
}

/** mermaid_core's directory: the prepared Mermaid Dart package config first, then the pub cache. */
function locateCore(peer: any): string {
  const candidates: string[] = []
  const config = peer.artifact?.root && join(peer.artifact.root, '.dart_tool/package_config.json')
  if (config && existsSync(config)) {
    const entry = JSON.parse(readFileSync(config, 'utf8')).packages?.find((p: any) => p.name === 'mermaid_core')
    if (entry) candidates.push(entry.rootUri.startsWith('file:') ? fileURLToPath(entry.rootUri) : resolve(dirname(config), entry.rootUri))
  }
  for (const cache of [process.env.PUB_CACHE, join(homedir(), '.pub-cache')]) if (cache) candidates.push(join(cache, 'hosted/pub.dev/mermaid_core-' + CORE_VERSION))
  for (const dir of candidates) {
    const pubspec = join(dir, 'pubspec.yaml')
    if (!existsSync(pubspec)) continue
    const text = readFileSync(pubspec, 'utf8')
    if (!/^name: mermaid_core\s*$/m.test(text)) throw Error('Dart bridge: ' + dir + ' is not the mermaid_core package')
    const version = text.match(/^version: (\S+)\s*$/m)?.[1]
    if (version !== CORE_VERSION) throw Error(`Dart bridge: ${dir} is mermaid_core ${version}, not ${CORE_VERSION}`)
    return dir
  }
  throw Error('Dart bridge: mermaid_core ' + CORE_VERSION + ' not found in the prepared package config or the pub cache (looked in ' + candidates.join(', ') + ')')
}

export async function build(peer: any, outDir: string): Promise<string[]> {
  const id = peer?.node?.id
  if (!peers.includes(id)) throw Error('Dart bridge: expected one of ' + peers.join(', ') + ', got ' + id)
  const recorded = id === 'orestesgaolin/mermaid'
    ? peer.artifact?.version ?? peer.node.packages?.find((p: any) => p.name === 'mermaid_core')?.version
    : peer.node.benchmark?.version ?? peer.node.packages?.find((p: any) => p.name === 'mermaid_flutter')?.version
  if (recorded !== CORE_VERSION) throw Error(`Dart bridge: ${id} records version ${recorded}; the bridge is pinned to mermaid_core ${CORE_VERSION}`)

  const core = locateCore(peer)
  if (!core.endsWith(join('hosted', 'pub.dev', 'mermaid_core-' + CORE_VERSION))) throw Error('Dart bridge: ' + core + ' is not inside a pub cache (hosted/pub.dev)')
  const pubCache = resolve(core, '../../..')
  const dart = dartTool()
  mkdirSync(outDir, { recursive: true })
  const binary = join(outDir, 'mermaid-core-bridge')
  const stamp = createHash('sha256').update([core, spawnSync(dart, ['--version'], { encoding: 'utf8' }).stdout, ...sources.map(f => readFileSync(join(here, f), 'utf8'))].join('\0')).digest('hex')
  const stampFile = join(outDir, 'bridge.stamp')
  if (existsSync(binary) && existsSync(stampFile) && readFileSync(stampFile, 'utf8') === stamp) return [binary]

  const work = join(outDir, 'bridge')
  for (const f of sources) {
    mkdirSync(dirname(join(work, f)), { recursive: true })
    copyFileSync(join(here, f), join(work, f))
  }
  run(dart, ['pub', 'get', '--offline'], work, { PUB_CACHE: pubCache })
  const resolved = JSON.parse(readFileSync(join(work, '.dart_tool/package_config.json'), 'utf8')).packages.find((p: any) => p.name === 'mermaid_core')
  if (!resolved || resolve(fileURLToPath(resolved.rootUri)) !== resolve(core)) throw Error('Dart bridge: pub resolved mermaid_core to ' + resolved?.rootUri + ', not ' + core)
  run(dart, ['run', 'tool/gen.dart', 'lib/model_fields.g.dart'], work, { PUB_CACHE: pubCache })
  run(dart, ['compile', 'exe', '--verbosity=error', 'bin/bridge.dart', '-o', binary], work, { PUB_CACHE: pubCache })
  writeFileSync(stampFile, stamp)
  return [binary]
}
