import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { withAgenticWorkspace } from '../integration/workspace.ts'
import { newerFamilies } from '../portable/cohorts.ts'
import { MERMAID_ORACLE_PIN, mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'
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

/** Syntax pages for the newer families, which Agentic's registry does not cover. */
const NEWER_FAMILY_DOCS: Record<string, string> = { venn: 'venn.md', treeview: 'treeView.md', wardley: 'wardley.md', eventmodeling: 'eventmodeling.md', cynefin: 'cynefin.md', railroad: 'railroad.md', swimlane: 'swimlanes.md', agentflow: 'agentflow.md', usecase: 'usecase.md' }

/** Every example on the newer families' syntax pages, read from Git at the release the oracle
 * pins, so the checkout's working tree and branch do not matter. */
export function mermaidDocsWorkloads(upstream: string): { upstream: NonNullable<CommunityCorpus['upstream']>; workloads: CommunityCorpus['workloads']; smoke: string[] } {
  const tag = `mermaid@${MERMAID_ORACLE_PIN.version}`
  const git = (...args: string[]) => execFileSync('git', args, { cwd: upstream, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  let commit: string
  try { commit = git('rev-parse', '--verify', `refs/tags/${tag}^{commit}`).trim() } catch { throw Error(`MERMAID_UPSTREAM_DIR (${upstream}) has no ${tag} tag; fetch Mermaid's tags`) }
  const missing = newerFamilies().filter(family => !NEWER_FAMILY_DOCS[family])
  if (missing.length) throw Error('No syntax page declared for ' + missing.join(', '))
  const files: Record<string, string> = {},
    workloads: CommunityCorpus['workloads'] = [],
    smoke: string[] = []
  for (const family of newerFamilies()) {
    const file = `packages/mermaid/src/docs/syntax/${NEWER_FAMILY_DOCS[family]}`
    files[family] = file
    const seen = new Set<string>()
    ;[...git('show', `${commit}:${file}`).matchAll(/^```mermaid(?:-example)?\n([\s\S]*?)^```/gm)].forEach((match, index) => {
      const source = match[1]!
      if (seen.has(source)) return
      seen.add(source)
      const id = `docs:${family}:${index}`
      if (!smoke.some(entry => entry.startsWith(`docs:${family}:`))) smoke.push(id)
      workloads.push({ id, family, source, features: ['mermaid-syntax-docs-example'], provenance: `${tag}:${file}#${index}`, evidence: null })
    })
    if (!seen.size) throw Error(`${tag}:${file} has no Mermaid examples`)
  }
  return { upstream: { repository: 'mermaid-js/mermaid', tag, commit, files }, workloads, smoke }
}

/** Freeze an Agentic Mermaid checkout's community workload corpus into Trident, with the
 * newer families' documented examples. Agentic owns its inputs (its family registry,
 * portfolios and imported Mermaid suites). Agentic
 * no longer carries the workload owners, so they run in Trident's source workspace, and
 * Trident measures the result without that checkout. Labels are not copied: each run
 * derives them from the pinned Mermaid oracle. */
export function importCommunityCorpus(agentic: string, out = corpusFile, upstream = mermaidUpstreamDirectory()): CommunityCorpus {
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
  const docs = mermaidDocsWorkloads(upstream)
  const corpus: CommunityCorpus = {
    schemaVersion: 1,
    source: { repository: 'adewale/agentic-mermaid', commit, dirty: false },
    upstream: docs.upstream,
    core: workloads.core,
    profiles: { smoke: [...workloads.profiles.smoke, ...docs.smoke], full: [...workloads.profiles.full, ...docs.workloads.map(workload => workload.id)] },
    workloads: [...workloads.workloads, ...docs.workloads],
  }
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
