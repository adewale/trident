import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { withAgenticWorkspace } from '../integration/workspace.ts'
import { corpusFile, type CommunityCorpus } from './corpus.ts'
import type { UnifiedWorkload } from './types.ts'

type AgenticWorkloads = Pick<CommunityCorpus, 'core' | 'profiles' | 'workloads'>

/** Run the workload owners from inside a prepared source workspace, where this directory is
 * Trident's copy at eval/benchmark/unified and its relative imports reach Agentic's sources. */
async function agenticWorkloads(unified: string): Promise<AgenticWorkloads> {
  const owner = (file: string) => import(pathToFileURL(join(unified, file)).href)
  const { communityCoreWorkloads } = await owner('community.ts')
  const { unifiedWorkloads, getWorkloadEvidence } = await owner('workloads.ts')
  const full: UnifiedWorkload[] = unifiedWorkloads('full'),
    smoke: UnifiedWorkload[] = unifiedWorkloads('smoke')
  return {
    core: communityCoreWorkloads(),
    profiles: { smoke: smoke.map(workload => workload.id), full: full.map(workload => workload.id) },
    workloads: full.map(workload => ({ ...workload, evidence: getWorkloadEvidence(workload.id) ?? null })),
  }
}

/** Freeze an Agentic Mermaid checkout's community workload corpus into Trident. Agentic
 * owns those inputs (its family registry, portfolios and imported Mermaid suites). Agentic
 * no longer carries the workload owners, so they run in Trident's source workspace, and
 * Trident measures the result without that checkout. Labels are not copied: each run
 * derives them from the pinned Mermaid oracle. */
export function importCommunityCorpus(agentic: string, out = corpusFile): CommunityCorpus {
  if (JSON.parse(readFileSync(join(agentic, 'package.json'), 'utf8')).name !== 'agentic-mermaid') throw Error('Corpus import needs an Agentic Mermaid checkout: ' + agentic)
  const git = (...args: string[]) => execFileSync('git', args, { cwd: agentic, encoding: 'utf8' }).trim()
  // The workspace also refuses changes, but name the import's own reason first.
  if (git('status', '--porcelain', '--', 'eval', 'src')) throw Error('Import the corpus from committed Agentic sources, so its recorded commit describes it')
  const commit = git('rev-parse', 'HEAD')
  const workloads = withAgenticWorkspace(agentic, false, workspace => {
    const result = spawnSync(process.execPath, ['run', join(workspace, 'eval/benchmark/unified/corpus-import.ts'), '--emit'], { cwd: workspace, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] })
    if (result.error) throw result.error
    if (result.status !== 0) throw Error(`Corpus owners failed in the source workspace (exit ${result.status})`)
    return JSON.parse(result.stdout) as AgenticWorkloads
  })
  const corpus: CommunityCorpus = { schemaVersion: 1, source: { repository: 'adewale/agentic-mermaid', commit, dirty: false }, ...workloads }
  writeFileSync(out, JSON.stringify(corpus, null, 1) + '\n')
  return corpus
}

if (import.meta.main) {
  if (process.argv[2] === '--emit') process.stdout.write(JSON.stringify(await agenticWorkloads(import.meta.dirname)))
  else {
    const agentic = process.env.TRIDENT_AGENTIC_ROOT ?? process.env.AM_BENCH_REPOSITORY_ROOT
    if (!agentic) throw Error('Set TRIDENT_AGENTIC_ROOT to the Agentic Mermaid checkout whose corpus to import')
    const corpus = importCommunityCorpus(resolve(agentic))
    console.log(JSON.stringify({ file: corpusFile, source: corpus.source, core: corpus.core.length, smoke: corpus.profiles.smoke.length, full: corpus.profiles.full.length }))
  }
}
