import { readFileSync } from 'node:fs'
import type { UnifiedRunOptions } from './types.ts'

/** Repair only named missing inputs while keeping the full corpus denominator.
 * No project result chooses a smaller scoring population. */
export function selectDocsCases<T extends { id: string }>(cases: readonly T[], options: Pick<UnifiedRunOptions, 'docsCaseIds' | 'docsCasesFile'>): T[] {
  const ids: unknown = options.docsCaseIds ?? (options.docsCasesFile ? JSON.parse(readFileSync(options.docsCasesFile, 'utf8')) : undefined)
  if (ids === undefined) return [...cases]
  if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string' || !cases.some(input => input.id === id)) || new Set(ids).size !== ids.length) throw Error('Documentation repair selection needs unique literal IDs from the pinned inventory')
  return cases.filter(input => ids.includes(input.id))
}
