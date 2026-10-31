import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import type { TerminalMeaning } from './terminal.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
export interface TerminalProjectCase {
  id: string
  source: string
  sourceSha256: string
  family: string
  features: string[]
  intent: string
  expected: { status: string; reason?: string; graph?: TerminalMeaning; contract?: TerminalSourceContract; unverifiedFacts?: string[] }
  origins: { repository: string; url: string; researchSnapshotSha256: string; bodySha256: string; line: number; extraction: string; channel?: string; kind: string; [key: string]: unknown }[]
}
export interface TerminalProjectCorpus {
  protocol: 'terminal-project-corpus-v1'
  cases: TerminalProjectCase[]
  projects: { repository: string; commit: string; sourceSnapshot: string; sha256: string; [key: string]: unknown }[]
  policy: unknown
  selection: unknown
}
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex')
/** Source acquisition, parsing and output correctness have separate evidence.
 * A provenance record or a source-derived tag cannot supply a drawing pass. */
export function readTerminalCorpus(file = resolve(import.meta.dir, '../corpus/terminal-project-examples.json')): TerminalProjectCorpus {
  const corpus = JSON.parse(readFileSync(file, 'utf8')) as TerminalProjectCorpus
  if (corpus.protocol !== 'terminal-project-corpus-v1' || !corpus.cases.length || new Set(corpus.cases.map(input => input.id)).size !== corpus.cases.length) throw Error('Terminal corpus has no unique planned inventory')
  const snapshots = new Map<string, any>()
  for (const project of corpus.projects) {
    if (!/^[a-f0-9]{40}$/.test(project.commit) || !/^[a-f0-9]{64}$/.test(project.sha256) || project.sourceSnapshot !== 'terminal-research/' + project.sha256 + '.json.gz') throw Error('Terminal research project lacks immutable source identity')
    const bytes = gunzipSync(readFileSync(join(dirname(file), project.sourceSnapshot)))
    if (hash(bytes) !== project.sha256) throw Error('Terminal research snapshot bytes changed')
    const snapshot = JSON.parse(bytes.toString('utf8'))
    if (snapshot.repository !== project.repository || snapshot.commit !== project.commit) throw Error('Terminal research snapshot belongs to a different project/revision')
    snapshots.set(project.sha256, snapshot)
  }
  for (const input of corpus.cases) {
    if (hash(input.source) !== input.sourceSha256 || input.id !== 'terminal:' + input.sourceSha256.slice(0, 16) || !input.origins.length) throw Error('Terminal source bytes or provenance changed: ' + input.id)
    for (const origin of input.origins) {
      const snapshot = snapshots.get(origin.researchSnapshotSha256)
      if (!snapshot || snapshot.repository !== origin.repository || !/^https:\/\/github\.com\//.test(origin.url) || !/^[a-f0-9]{64}$/.test(origin.bodySha256) || !Number.isInteger(origin.line) || origin.line < 1 || !origin.extraction) throw Error('Terminal source lacks authenticated origin metadata: ' + input.id)
      const entries = origin.kind === 'repository-file' ? snapshot.files : origin.kind === 'pull-diff' ? snapshot.pullDiffs : snapshot.records
      const entry = entries?.find((item: any) => item.kind === origin.kind && item.url === origin.url && (origin.kind === 'repository-file' ? item.path === origin.path && item.blob === origin.blob : origin.kind === 'pull-diff' ? item.number === origin.number && item.path === origin.path && item.headCommit === origin.headCommit : item.number === origin.number))
      if (!entry) throw Error('Terminal origin pointer has no matching authenticated source record: ' + input.id)
      for (const key of ['repository', 'commit', 'path', 'blob', 'number', 'url', 'title', 'author', 'state', 'createdAt', 'updatedAt', 'closedAt', 'baseCommit', 'headCommit', 'fileSha']) if (origin[key] !== undefined && entry[key] !== origin[key]) throw Error('Terminal origin metadata differs from its authenticated record: ' + key)
      const body = origin.kind === 'pull-diff' ? entry.patch.split('\n').filter((line: string) => line.startsWith('+') && !line.startsWith('+++')).map((line: string) => line.slice(1)).join('\n') : entry.body
      if (typeof body !== 'string' || hash(body) !== origin.bodySha256 || origin.kind !== 'pull-diff' && entry.bodySha256 !== origin.bodySha256 || origin.kind === 'pull-diff' && (hash(entry.patch) !== entry.patchSha256 || entry.patchSha256 !== origin.patchSha256)) throw Error('Terminal origin body or patch hash differs from its authenticated bytes: ' + input.id)
      if (origin.line > body.split('\n').length + 1) throw Error('Terminal origin line escapes its authenticated source body')
    }
    if (input.expected.status !== 'unreviewed' && input.expected.status !== 'independently-reviewed') throw Error('Terminal drawing expectation has an unknown review status')
  }
  return corpus
}

export interface TerminalSourceReview { caseId: string; sourceSha256: string; intent: 'valid' | 'invalid' | 'dialect'; review: string; graph?: TerminalMeaning; contract?: TerminalSourceContract; unverifiedFacts: string[] }
export function reviewedTerminalCases(corpus = readTerminalCorpus(), reviewFile = resolve(import.meta.dir, '../corpus/terminal-project-reviews.json')) {
  const reviews = JSON.parse(readFileSync(reviewFile, 'utf8')) as TerminalSourceReview[], byId = new Map<string, TerminalSourceReview>()
  for (const review of reviews) {
    const input = corpus.cases.find(item => item.id === review.caseId)
    if (!input || byId.has(review.caseId) || review.sourceSha256 !== input.sourceSha256 || !review.review.trim() || !['valid', 'invalid', 'dialect'].includes(review.intent) || !Array.isArray(review.unverifiedFacts)) throw Error('Terminal review is duplicate, stale or has no matching source')
    if (review.intent === 'valid' && !review.graph && !review.contract) throw Error('Terminal source review has no declared semantic contract')
    if (review.graph && (new Set(review.graph.nodes.map(node => node.id)).size !== review.graph.nodes.length || review.graph.edges.some(edge => ![...review.graph!.nodes, ...((review.graph as any).groups ?? [])].some(node => node.id === edge.source) || ![...review.graph!.nodes, ...((review.graph as any).groups ?? [])].some(node => node.id === edge.target)))) throw Error('Terminal graph review has missing or ambiguous identities')
    if (review.contract && (review.contract.schema !== 'terminal-source-contract-v2' || review.contract.family !== input.family || !review.contract.facts.length || !review.contract.facts.some(fact => fact.required !== false) || !Array.isArray(review.contract.sourceUncertainties) || new Set(review.contract.facts.map(fact => fact.criterion)).size !== review.contract.facts.length || review.contract.facts.some(fact => !fact.criterion || !fact.scope?.trim() || fact.expected === undefined || fact.required !== undefined && typeof fact.required !== 'boolean'))) throw Error('Terminal source obligations are missing, duplicate or unscoped')
    byId.set(review.caseId, review)
  }
  return corpus.cases.map(input => {
    const review = byId.get(input.id)
    let graph = review?.graph
    if (!graph && review?.contract?.family === 'flowchart') {
      const value = (criterion: string) => review.contract!.facts.find(fact => fact.criterion === criterion)?.expected
      graph = { nodes: value('nodes') as TerminalMeaning['nodes'], edges: value('relationships') as TerminalMeaning['edges'], ...(value('layout-order') ? { layout: value('layout-order') as TerminalMeaning['layout'] } : {}), ...(value('groups') ? { groups: value('groups') } : {}) }
    }
    return review ? { ...input, intent: review.intent, expected: { status: 'independently-reviewed', reason: review.review, ...(graph ? { graph } : {}), ...(review.contract ? { contract: review.contract } : {}), unverifiedFacts: review.unverifiedFacts } } : input
  })
}
