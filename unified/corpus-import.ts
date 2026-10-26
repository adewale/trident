import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { corpusFile, type CommunityCorpus } from './corpus.ts'
import type { UnifiedWorkload } from './types.ts'

/** Freeze an Agentic Mermaid checkout's community workload corpus into Trident. Agentic
 * owns those inputs (its family registry, portfolios and imported Mermaid suites); this
 * runs its own modules, so Trident measures them without that checkout. Labels are not
 * copied: each run derives them from the pinned Mermaid oracle. */
export async function importCommunityCorpus(agentic: string, out = corpusFile): Promise<CommunityCorpus> {
  if (JSON.parse(readFileSync(join(agentic, 'package.json'), 'utf8')).name !== 'agentic-mermaid') throw Error('Corpus import needs an Agentic Mermaid checkout: ' + agentic)
  const git = (...args: string[]) => execFileSync('git', args, { cwd: agentic, encoding: 'utf8' }).trim()
  const owner = (file: string) => import(pathToFileURL(join(agentic, 'eval/benchmark/unified', file)).href)
  const { communityCoreWorkloads } = await owner('community.ts')
  const { unifiedWorkloads, getWorkloadEvidence } = await owner('workloads.ts')
  const full: UnifiedWorkload[] = unifiedWorkloads('full'),
    smoke: UnifiedWorkload[] = unifiedWorkloads('smoke')
  const corpus: CommunityCorpus = {
    schemaVersion: 1,
    source: { repository: 'adewale/agentic-mermaid', commit: git('rev-parse', 'HEAD'), dirty: git('status', '--porcelain', '--', 'eval', 'src').length > 0 },
    core: communityCoreWorkloads(),
    profiles: { smoke: smoke.map(workload => workload.id), full: full.map(workload => workload.id) },
    workloads: full.map(workload => ({ ...workload, evidence: getWorkloadEvidence(workload.id) ?? null })),
  }
  if (corpus.source.dirty) throw Error('Import the corpus from committed Agentic sources, so its recorded commit describes it')
  writeFileSync(out, JSON.stringify(corpus, null, 1) + '\n')
  return corpus
}

if (import.meta.main) {
  const agentic = process.env.TRIDENT_AGENTIC_ROOT ?? process.env.AM_BENCH_REPOSITORY_ROOT
  if (!agentic) throw Error('Set TRIDENT_AGENTIC_ROOT to the Agentic Mermaid checkout whose corpus to import')
  const corpus = await importCommunityCorpus(resolve(agentic))
  console.log(JSON.stringify({ file: corpusFile, source: corpus.source, core: corpus.core.length, smoke: corpus.profiles.smoke.length, full: corpus.profiles.full.length }))
}
