import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** This Trident package, wherever it is checked out. Its own files resolve from here. */
export const tridentDirectory = resolve(import.meta.dirname, '..')
const packageName = (directory: string) => {
  try {
    return JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')).name as string
  } catch {
    return undefined
  }
}
/** The repository whose Git identity a run records: the Agentic Mermaid checkout when
 * Trident is its eval/benchmark, otherwise the Trident checkout itself. */
export const harnessRepository = packageName(resolve(tridentDirectory, '../..')) === 'agentic-mermaid' ? resolve(tridentDirectory, '../..') : tridentDirectory
/** Trident owns the community catalog: one declaration per benchmarked project. */
export const communityCatalogFile = join(tridentDirectory, 'catalog/mermaid-community.json')
