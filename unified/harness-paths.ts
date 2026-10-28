import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tridentDirectory } from './trident-paths.ts'

/** Resolve producers in their actual owning checkout. Product runners may use
 * shared Trident workers, but never assemble a second product source tree. */
export function harnessFile(root: string, path: string, ...parts: string[]): string {
  const local = resolve(root, path, ...parts)
  if (existsSync(local)) return local
  if (path === 'eval/benchmark' || path.startsWith('eval/benchmark/')) return join(tridentDirectory, path.slice('eval/benchmark'.length), ...parts)
  if (path === 'docs/project/upstream-mermaid-policy.json') return join(tridentDirectory, 'data/upstream-mermaid-policy.json')
  return local
}
