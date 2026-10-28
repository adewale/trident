import { execFileSync } from 'node:child_process'
import { newerFamilies } from '../portable/cohorts.ts'
import { MERMAID_ORACLE_PIN } from '../portable/mermaid-oracle.ts'
import type { CommunityCorpus } from './corpus.ts'

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
      workloads.push({ id, family, source, features: ['mermaid-syntax-docs-example'], provenance: `${tag}:${file}#${index}`, evidence: null, intent: 'render', intentReason: 'Complete example from the pinned Mermaid syntax documentation' })
    })
    if (!seen.size) throw Error(`${tag}:${file} has no Mermaid examples`)
  }
  return { upstream: { repository: 'mermaid-js/mermaid', tag, commit, files }, workloads, smoke }
}

