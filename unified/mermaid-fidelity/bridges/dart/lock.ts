// The package versions Mermaid Flutter's native app resolves, read from its pubspec.lock,
// so the Fidelity row names the mermaid_flutter and mermaid_core versions actually built.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const flutterLockFile = join(import.meta.dirname, '../../../../native-flutter/app/pubspec.lock')

/** Hosted package versions from a pubspec.lock (`packages: name: ... version: "x"`). */
export function lockedVersions(text: string): Record<string, string> {
  const versions: Record<string, string> = {}
  let current: string | undefined
  for (const line of text.split('\n')) {
    const name = line.match(/^ {2}([A-Za-z0-9_]+):\s*$/)
    if (name) { current = name[1]; continue }
    const version = line.match(/^ {4}version: "?([^"\s]+)"?\s*$/)
    if (version && current) versions[current] = version[1]!
  }
  return versions
}

export function flutterLock(path = flutterLockFile) {
  const versions = lockedVersions(readFileSync(path, 'utf8'))
  const mermaid_core = versions.mermaid_core, mermaid_flutter = versions.mermaid_flutter
  if (!mermaid_core || !mermaid_flutter) throw Error('Mermaid Flutter pubspec.lock does not resolve mermaid_core and mermaid_flutter: ' + path)
  return { mermaid_core, mermaid_flutter }
}
