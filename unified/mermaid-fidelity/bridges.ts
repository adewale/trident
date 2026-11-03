// Out-of-process parser bridges for projects whose parser is not a JavaScript
// module the original Vitest tests can import. Each bridge program calls the
// project's own parser and prints its native model; it parses nothing itself.
//
// Protocol (one process per parse): stdin {"family", "source"}; the last stdout
// line is {"value"} | {"error": {"name", "message"}} | {"unsupported"} | {"adapterGap"}.
// A bridge reports `error` with name "ParseError" only for the parser's own
// syntax rejection, `unsupported` for a family the project does not parse, and
// `adapterGap` for anything it cannot classify.
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export interface ParserBridge { command: string[]; cwd?: string; version: string; description: string }
type Resolver = (peer: any, directory: string) => ParserBridge | undefined

const resolvers: Record<string, Resolver> = {}

/** Register a resolver; it returns undefined when the prepared artifact lacks what the bridge needs. */
export function registerBridge(project: string, resolve: Resolver) { resolvers[project] = resolve }

export function parserBridge(peer: any, directory = join(import.meta.dirname, 'bridges')): ParserBridge | undefined {
  const resolve = resolvers[peer?.node?.id]
  const bridge = resolve?.(peer, directory)
  if (bridge && bridge.command.every((part, index) => index > 0 || existsSync(part))) return bridge
  return undefined
}

export const bridgedProjects = () => Object.keys(resolvers)
