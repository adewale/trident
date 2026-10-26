import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { UnifiedWorkload } from './types.ts'
import type { WorkloadEvidence } from './workload-evidence.ts'

/** The community workload corpus, frozen from Agentic Mermaid by corpus-import.ts with its
 * source commit. Trident's community lanes read only this file, never that checkout. */
export interface CommunityCorpus {
  schemaVersion: 1
  source: { repository: string; commit: string; dirty: boolean }
  core: UnifiedWorkload[]
  profiles: { smoke: string[]; full: string[] }
  workloads: (UnifiedWorkload & { evidence: WorkloadEvidence | null })[]
}
export const corpusFile = join(import.meta.dirname, '../corpus/community-corpus.json')
let loaded: CommunityCorpus | undefined
export function communityCorpus(): CommunityCorpus {
  loaded ??= JSON.parse(readFileSync(corpusFile, 'utf8')) as CommunityCorpus
  if (loaded.schemaVersion !== 1) throw Error('Unsupported community corpus schema: ' + corpusFile)
  return loaded
}
const strip = ({ evidence: _evidence, ...workload }: CommunityCorpus['workloads'][number]): UnifiedWorkload => workload
/** Positive render cohorts for a profile, without the fixed core. */
export const corpusWorkloads = (profile: 'smoke' | 'full'): UnifiedWorkload[] => {
  const ids = new Set(communityCorpus().profiles[profile])
  return communityCorpus().workloads.filter(workload => ids.has(workload.id)).map(strip)
}
let evidence: Map<string, WorkloadEvidence | null> | undefined
export const corpusEvidence = (id: string): WorkloadEvidence | undefined => (evidence ??= new Map(communityCorpus().workloads.map(workload => [workload.id, workload.evidence]))).get(id) ?? undefined
