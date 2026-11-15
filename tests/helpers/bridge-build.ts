import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const cacheRoot = resolve(import.meta.dirname, '../../node_modules/.cache/fidelity-bridges')
const bridgesRoot = resolve(import.meta.dirname, '../../unified/mermaid-fidelity/bridges')

/** The path of a Fidelity bridge binary in the shared build cache, only if it was built
 * from this checkout's bridge sources. Other checkouts and worktrees share the cache and
 * stage their own sources into it, so a binary built from different sources is treated
 * as absent: testing it would report that checkout's bridge as this one's failure. */
export function bridgeBuiltFromCheckout(bridge: string, cacheName: string, binary: string) {
  const cache = join(cacheRoot, cacheName), path = join(cache, 'target', 'release', binary)
  if (!existsSync(path)) return undefined
  const built = statSync(path).mtimeMs, sources = join(bridgesRoot, bridge, 'src')
  for (const name of readdirSync(sources)) {
    const staged = join(cache, 'src', name)
    // The build stages only changed files, so a staged file newer than the binary was never built.
    if (!existsSync(staged) || !readFileSync(staged).equals(readFileSync(join(sources, name))) || statSync(staged).mtimeMs > built) return undefined
  }
  return path
}
