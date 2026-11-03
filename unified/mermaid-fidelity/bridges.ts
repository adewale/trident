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
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export interface ParserBridge { command: string[]; version: string; description: string }
/** Returns the bridge for a prepared peer, building it into outDir if needed, or undefined when it does not apply. */
export type Resolver = (peer: any, outDir: string) => Promise<ParserBridge | undefined>

const resolvers: Record<string, Resolver> = {}
export function registerBridge(project: string, resolve: Resolver) { resolvers[project] = resolve }
export const bridgedProjects = () => Object.keys(resolvers)

/** Bridges run under the Node used by the Vitest runner, not Bun. */
export const nodeExecutable = () => process.env.NODE_BIN ?? execFileSync('which', ['node'], { encoding: 'utf8' }).trim()

export async function parserBridge(peer: any, outRoot: string): Promise<ParserBridge | undefined> {
  const resolve = resolvers[peer?.node?.id]
  if (!resolve) return undefined
  // Plain directory names: some linkers mishandle '%' in paths.
  const outDir = join(outRoot, peer.node.id.replace(/[^A-Za-z0-9._-]+/g, '-'))
  mkdirSync(outDir, { recursive: true })
  const bridge = await resolve(peer, outDir)
  if (bridge && !existsSync(bridge.command[0]!)) throw Error(`Parser bridge for ${peer.node.id} has no executable ${bridge.command[0]}`)
  return bridge
}
