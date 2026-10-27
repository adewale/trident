import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'

/** This Trident package, wherever it is checked out. */
export const tridentDirectory = resolve(import.meta.dirname, '..')
/** The owning Git repository, including an explicitly assembled source-adapter workspace. */
export const harnessRepository = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: tridentDirectory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }
  catch { return tridentDirectory }
})()
export const communityCatalogFile = join(tridentDirectory, 'catalog/mermaid-community.json')
