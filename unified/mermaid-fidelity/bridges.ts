// Out-of-process parser bridges for projects whose parser is not a JavaScript
// module the original Vitest tests can import. Each bridge program calls the
// project's own parser and prints its native model; it parses nothing itself.
//
// Protocol (one process per parse): stdin {"family", "source"}; the last stdout
// line is {"value"} | {"error": {"name", "message"}} | {"unsupported"} | {"adapterGap"}.
// A bridge reports `error` with name "ParseError" only for the parser's own
// syntax rejection, `unsupported` for a family or source the project does not
// parse, and `adapterGap` for anything it cannot classify.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, sep } from 'node:path'
import { byteDigest } from '../../portable/artifacts.ts'
import { planDigest } from '../campaign-plan.ts'

/** persistent: the bridge also answers one request per line under TRIDENT_BRIDGE_SERVE=1. */
/** sharedParserWith: another catalogued project whose parser this bridge calls unchanged
 * (parserVersion is that parser's version), so the two Fidelity rows are one parser. */
export interface ParserBridge { command: string[]; version: string; description: string; persistent?: boolean; cwd?: string; runtimeFiles?: { path: string; sha256: string }[]; installedRuntimeSha256?: string; sharedParserWith?: string; parserVersion?: string }
/** Returns the bridge for a prepared peer, building it into outDir if needed, or undefined when it does not apply. */
export type Resolver = (peer: any, outDir: string) => Promise<ParserBridge | undefined>

const resolvers: Record<string, Resolver> = {}
export function registerBridge(project: string, resolve: Resolver) { resolvers[project] = resolve }
export const bridgedProjects = () => Object.keys(resolvers)

/** Bridges run under the Node used by the Vitest runner, not Bun. */
export const nodeExecutable = () => process.env.NODE_BIN ?? execFileSync('which', ['node'], { encoding: 'utf8' }).trim()
export const parserBridgeDirectory = (project: string, outRoot: string) => join(outRoot, project.replace(/[^A-Za-z0-9._-]+/g, '-'))
// Use sealed source rather than mutable __pycache__ files. The null device
// cannot contain a bytecode cache; -B also prevents cache writes.
export const pythonBridgeCommand = (executable: string, script: string) => [executable, '-I', '-B', '-X', 'pycache_prefix=' + (process.platform === 'win32' ? 'NUL' : '/dev/null'), script]

/** Bind executables, scripts and generated WASM/glue, not just their names.
 * Installed npm closures are already bound by the prepared peer. Python wheels
 * additionally need their installed files: the archive alone cannot seal a venv. */
export function bindParserBridge(bridge: ParserBridge, outDir: string, peer: any): ParserBridge {
  const files = new Map<string, string>()
  const walk = (root: string): { path: string; sha256: string }[] => {
    const rows: { path: string; sha256: string }[] = []
    const visit = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.name === '__pycache__') continue
        const path = join(directory, entry.name)
        if (entry.isSymbolicLink() && statSync(path).isDirectory()) throw Error('Parser runtime directory symlink requires an explicit closed binding: ' + path)
        if (entry.isDirectory()) visit(path)
        else if (statSync(path).isFile()) rows.push({ path: relative(root, path), sha256: byteDigest(path) })
      }
    }
    visit(root)
    return rows
  }
  for (const argument of bridge.command) {
    if (!isAbsolute(argument) || !existsSync(argument)) continue
    if (statSync(argument).isFile()) files.set(argument, byteDigest(argument))
    else {
      const name = relative(outDir, argument)
      if (name && name !== '..' && !name.startsWith('..' + sep) && !isAbsolute(name)) for (const file of walk(argument)) files.set(join(argument, file.path), file.sha256)
    }
  }
  let installedRuntimeSha256: string | undefined
  if (peer.artifact?.kind === 'python') {
    const lib = join(dirname(dirname(peer.artifact.python ?? peer.artifact.executable)), 'lib')
    const sites = readdirSync(lib).filter(name => /^python\d/.test(name)).map(name => join(lib, name, 'site-packages')).filter(existsSync)
    if (!sites.length) throw Error('Python parser bridge requires a bound installed site-packages tree')
    installedRuntimeSha256 = planDigest(sites.map(root => ({ root, files: walk(root) })))
  }
  return { ...bridge, runtimeFiles: [...files].sort(([a], [b]) => a.localeCompare(b)).map(([path, sha256]) => ({ path, sha256 })), ...(installedRuntimeSha256 ? { installedRuntimeSha256 } : {}) }
}

export async function parserBridge(peer: any, outRoot: string): Promise<ParserBridge | undefined> {
  const resolve = resolvers[peer?.node?.id]
  if (!resolve) return undefined
  // Plain directory names: some linkers mishandle '%' in paths.
  const outDir = parserBridgeDirectory(peer.node.id, outRoot)
  mkdirSync(outDir, { recursive: true })
  const bridge = await resolve(peer, outDir)
  if (bridge && !existsSync(bridge.command[0]!)) throw Error(`Parser bridge for ${peer.node.id} has no executable ${bridge.command[0]}`)
  return bridge ? bindParserBridge(bridge, outDir, peer) : undefined
}
