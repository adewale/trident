// mermaid_core, the parser behind both orestesgaolin/mermaid (Mermaid Dart, which is
// mermaid_core itself) and pub:mermaid_flutter (which calls core's parser unchanged, at
// the mermaid_core version its native app resolves in pubspec.lock). One build serves
// both peers when their mermaid_core versions agree.
// The bridge is an AOT executable: start-up is a few milliseconds, against ~200 ms for
// the JIT VM. Model field lists are generated at build time by tool/gen.dart (dart:mirrors
// over mermaid_core's own classes), since AOT code cannot use mirrors.
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { flutterLock, flutterLockFile } from './lock.ts'

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
    const [major = 0, minor = 0] = (version.match(/Dart SDK version: (\d+)\.(\d+)/) ?? []).slice(1).map(Number)
    if (major > 3 || (major === 3 && minor >= 12)) return candidate
  }
  throw Error('Dart bridge: no Dart SDK >= 3.12 found (set AM_BENCH_DART, as the Dart community adapter does, or put dart on PATH)')
}

/** The mermaid_core directory a Dart package config resolves, if it names one. */
function configuredCore(config: string): string | undefined {
  if (!existsSync(config)) return undefined
  const entry = JSON.parse(readFileSync(config, 'utf8')).packages?.find((p: any) => p.name === 'mermaid_core')
  return entry && (entry.rootUri.startsWith('file:') ? fileURLToPath(entry.rootUri) : resolve(dirname(config), entry.rootUri))
}
/** The package config of Mermaid Flutter's native app: the mermaid_core its build used. */
export const flutterPackageConfig = (lockFile = flutterLockFile) => join(dirname(lockFile), '.dart_tool/package_config.json')

/** mermaid_core's directory. Mermaid Flutter's is the copy its native app resolved
 * (native-flutter/app/.dart_tool/package_config.json, beside the pubspec.lock that names its
 * version), never another project's. Mermaid Dart's is its prepared package config's, then
 * the pub cache. */
export function locateCore(peer: any, CORE_VERSION: string, flutterConfig = flutterPackageConfig()): string {
  const candidates: string[] = []
  if (peer?.node?.id === 'pub:mermaid_flutter') {
    const core = configuredCore(flutterConfig)
    if (!core) throw Error('Dart bridge: Mermaid Flutter\'s native app has no resolved mermaid_core (' + flutterConfig + '); run its pub get or build first')
    candidates.push(core)
  } else {
    const config = peer.artifact?.root && join(peer.artifact.root, '.dart_tool/package_config.json')
    const core = config && configuredCore(config)
    if (core) candidates.push(core)
    for (const cache of [process.env.PUB_CACHE, join(homedir(), '.pub-cache')]) if (cache) candidates.push(join(cache, 'hosted/pub.dev/mermaid_core-' + CORE_VERSION))
  }
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

/** The top-level parseX functions mermaid_core's public library exports (one level of
 * `export 'src/...'`, which is how the library is organised). */
export function publicCoreParsers(core: string): Set<string> {
  const library = readFileSync(join(core, 'lib/mermaid_core.dart'), 'utf8')
  const parsers = new Set<string>()
  for (const [, file, show] of library.matchAll(/^export '([^']+)'(?:\s+show\s+([^;]+))?;/gm)) {
    const text = readFileSync(join(core, 'lib', file!), 'utf8')
    for (const [, name] of text.matchAll(/^[A-Z]\w*(?:<[^>]*>)?\??\s+(parse[A-Z]\w*)\s*\(/gm)) if (!show || show.split(',').map(s => s.trim()).includes(name!)) parsers.add(name!)
  }
  return parsers
}

/** The bridge calls only public parsers, and lists every unexported one as private. */
export function checkPublicFamilies(core: string, families = readFileSync(join(here, 'lib/families.dart'), 'utf8')) {
  const exported = publicCoreParsers(core)
  const called = [...families.matchAll(/^\s*'[\w:]+': \('(parse\w+)', parse\w+\),$/gm)].map(match => match[1]!)
  const declaredPrivate = [...families.slice(families.indexOf('privateFamilies')).matchAll(/^\s*'[\w:]+': '(parse\w+)',$/gm)].map(match => match[1]!)
  const notPublic = called.filter(name => !exported.has(name)), nowPublic = declaredPrivate.filter(name => exported.has(name))
  if (!called.length || notPublic.length || nowPublic.length) throw Error(`Dart bridge: mermaid_core's public library ${notPublic.length ? 'does not export ' + notPublic.join(', ') : ''}${nowPublic.length ? 'now exports ' + nowPublic.join(', ') + '; review those families' : ''}`)
  return { called, declaredPrivate }
}

export async function build(peer: any, outDir: string): Promise<string[]> {
  const id = peer?.node?.id
  if (!peers.includes(id)) throw Error('Dart bridge: expected one of ' + peers.join(', ') + ', got ' + id)
  // The mermaid_core version this peer's parser is: Mermaid Dart's own recorded version,
  // or the one Mermaid Flutter's app resolves, whose mermaid_flutter must be the version recorded.
  let CORE_VERSION: string
  if (id === 'orestesgaolin/mermaid') CORE_VERSION = peer.artifact?.version ?? peer.node.packages?.find((p: any) => p.name === 'mermaid_core')?.version
  else {
    const lock = flutterLock(), recorded = peer.node.benchmark?.version ?? peer.node.packages?.find((p: any) => p.name === 'mermaid_flutter')?.version
    if (recorded !== undefined && recorded !== lock.mermaid_flutter) throw Error(`Dart bridge: ${id} records mermaid_flutter ${recorded}, but its app resolves ${lock.mermaid_flutter}`)
    CORE_VERSION = lock.mermaid_core
  }
  if (!/^\d+\.\d+\.\d+$/.test(String(CORE_VERSION))) throw Error(`Dart bridge: ${id} records no mermaid_core version`)

  const core = locateCore(peer, CORE_VERSION)
  if (!core.endsWith(join('hosted', 'pub.dev', 'mermaid_core-' + CORE_VERSION))) throw Error('Dart bridge: ' + core + ' is not inside a pub cache (hosted/pub.dev)')
  checkPublicFamilies(core)
  const pubCache = resolve(core, '../../..')
  const dart = dartTool()
  mkdirSync(outDir, { recursive: true })
  const binary = join(outDir, 'mermaid-core-bridge')
  const stamp = createHash('sha256').update([core, CORE_VERSION, spawnSync(dart, ['--version'], { encoding: 'utf8' }).stdout, ...sources.map(f => readFileSync(join(here, f), 'utf8'))].join('\0')).digest('hex')
  const stampFile = join(outDir, 'bridge.stamp')
  if (existsSync(binary) && existsSync(stampFile) && readFileSync(stampFile, 'utf8') === stamp) return [binary]

  const work = join(outDir, 'bridge')
  for (const f of sources) {
    mkdirSync(dirname(join(work, f)), { recursive: true })
    copyFileSync(join(here, f), join(work, f))
  }
  // The bridge depends on exactly the peer's mermaid_core version; the reply wording names it.
  const pubspec = readFileSync(join(work, 'pubspec.yaml'), 'utf8')
  if (!/^ {2}mermaid_core: \S+$/m.test(pubspec)) throw Error('Dart bridge: pubspec.yaml does not pin mermaid_core')
  writeFileSync(join(work, 'pubspec.yaml'), pubspec.replace(/^ {2}mermaid_core: \S+$/m, '  mermaid_core: ' + CORE_VERSION))
  writeFileSync(join(work, 'lib/core_version.dart'), `// Generated by build.ts.\nconst coreVersion = '${CORE_VERSION}';\n`)
  run(dart, ['pub', 'get', '--offline'], work, { PUB_CACHE: pubCache })
  const resolved = JSON.parse(readFileSync(join(work, '.dart_tool/package_config.json'), 'utf8')).packages.find((p: any) => p.name === 'mermaid_core')
  if (!resolved || resolve(fileURLToPath(resolved.rootUri)) !== resolve(core)) throw Error('Dart bridge: pub resolved mermaid_core to ' + resolved?.rootUri + ', not ' + core)
  run(dart, ['run', 'tool/gen.dart', 'lib/model_fields.g.dart'], work, { PUB_CACHE: pubCache })
  run(dart, ['compile', 'exe', '--verbosity=error', 'bin/bridge.dart', '-o', binary], work, { PUB_CACHE: pubCache })
  writeFileSync(stampFile, stamp)
  return [binary]
}
