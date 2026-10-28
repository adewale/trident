import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { communityCoreWorkloads } from './community.ts'
import { withReferenceLabels } from './qualification.ts'
import { assertMermaidOracle, mermaidVerdicts } from '../portable/mermaid-oracle.ts'
import referencePolicy from '../data/upstream-mermaid-policy.json' with { type: 'json' }
import ts from 'typescript'
import { protocolIdentity } from './protocol-identity.ts'
import { harnessRepository } from './trident-paths.ts'

export interface ExternalSource { repository: string; commit: string; checkout?: string; license: string }
export interface ExternalPolicy { protocol: 'external-repository-examples-v1'; maxFilesPerProject: number; sources: ExternalSource[] }
const headers = referencePolicy.families.flatMap(family => family.headers.map(header => header.value.toLowerCase()))
const diagramSource = (source: string) => {
  const first = source.trim().replace(/^---[\s\S]*?\r?\n---\s*/, '').split(/\r?\n/).find(line => line.trim() && !line.trim().startsWith('%%'))?.trim().toLowerCase() ?? ''
  return headers.some(header => first === header || first.startsWith(header + ' ') || first.startsWith(header + '\t'))
}
function markdownInputs(text: string) {
  return [...text.matchAll(/^```([^\n\r]*)\r?\n([\s\S]*?)^```[^\S\r\n]*$/gm)].flatMap(match => {
    const language = match[1]!.trim().toLowerCase(), body = match[2]!, line = text.slice(0, match.index).split('\n').length
    if (['mermaid', 'mermaid-example'].includes(language) || ((!language || language === 'text') && diagramSource(body))) return [{ source: body, line, fragment: 0 }]
    if (!['js', 'javascript', 'ts', 'typescript', 'tsx', 'jsx'].includes(language)) return []
    // Static literals only. No interpolation, imports, examples or target code execute.
    const code = ts.createSourceFile('example.ts', body, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const inputs: { source: string; line: number; fragment: number }[] = []
    const visit = (node: ts.Node) => {
      if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && diagramSource(node.text)) inputs.push({ source: node.text, line: line + 1 + body.slice(0, node.getStart(code)).split('\n').length - 1, fragment: inputs.length })
      ts.forEachChild(node, visit)
    }
    visit(code); return inputs
  })
}
/** Selection is frozen in Git before examining any renderer's results. No adapter
 * or tool output participates in choosing examples. Fences retain duplicates. */
export function collectExternalCorpus(policy: ExternalPolicy) {
  if (policy.protocol !== 'external-repository-examples-v1' || !Number.isSafeInteger(policy.maxFilesPerProject) || policy.maxFilesPerProject < 1) throw Error('Invalid external corpus selection policy')
  if (!policy.sources.length || new Set(policy.sources.map(source => source.repository)).size !== policy.sources.length) throw Error('Select unique external repositories')
  const sources = policy.sources.map(source => {
    if (!/^[a-f0-9]{40}$/.test(source.commit) || !source.repository || !source.license) throw Error('Each external source needs a full Git commit, repository and license attribution')
    const checkout = source.checkout ?? resolve('.cache/corpus-sources', source.repository.replaceAll('/', '--'))
    const git = (...args: string[]) => execFileSync('git', args, { cwd: checkout, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
    const tracked = git('ls-tree', '-r', '--name-only', source.commit).trim().split('\n')
    const licenseFiles = tracked.filter(file => /^(?:licen[cs]e|copying|notice)(?:[._-].*)?$/i.test(file)).map(file => ({ file, text: git('show', `${source.commit}:${file}`) }))
    const priority = (file: string) => /^readme[^/]*\.md$/i.test(file) ? 0 : file.endsWith('.mmd') ? 1 : 2
    const eligible = tracked.filter(file => /\.mmd$/i.test(file) || /(?:^|\/)(?:readme[^/]*\.md)$/i.test(file) || /^(?:docs|examples)\/.*\.md$/i.test(file)).sort((a, b) => priority(a) - priority(b) || a.localeCompare(b))
    const files = eligible.slice(0, policy.maxFilesPerProject)
    const workloads = files.flatMap(file => {
      const text = git('show', `${source.commit}:${file}`)
      const inputs = file.endsWith('.mmd') ? [{ source: text, line: 1, fragment: 0 }] : markdownInputs(text)
      return inputs.map(input => ({ id: `external:${source.repository}:${file}:${input.line}:${input.fragment}`, source: input.source, family: 'unclassified', features: ['external-project-example'], provenance: `${source.repository}@${source.commit}:${file}:${input.line}; license ${source.license}` }))
    })
    return { ...source, licenseFiles, files, eligibleFiles: eligible.length, filesOmittedByCap: Math.max(0, eligible.length - files.length), occurrences: workloads.length, workloads }
  })
  return { protocol: policy.protocol, policy: { ...policy, sources: policy.sources.map(({ checkout: _checkout, ...source }) => source) },
    sources, workloads: sources.flatMap(source => source.workloads),
    limitations: ['Public examples and regression fixtures are development-exposed, not production traffic or a validated holdout.', 'Each repository receives the same file cap: root README, then .mmd files, then other README/docs/examples Markdown, lexical order within each class. Duplicates and empty contributors remain visible.', 'Mermaid fences, diagram-headed text fences and static diagram string literals are included. Dynamic/interpolated program examples are not executed or reconstructed.', 'Missing authored-label evidence is format-only admission. Reference-derived labels are compatibility expectations, not an independent visual oracle.', 'Repository contributions are reported separately; prolific forks do not receive extra weight in an aggregate. No overall aggregate is defined.'] }
}
export async function freezeExternalCorpus(policy: ExternalPolicy, out: string) {
  if (existsSync(out)) throw Error('External corpus output must be fresh')
  const producers = protocolIdentity(harnessRepository, ['unified/external-corpus.ts'])
  const collected = collectExternalCorpus(policy)
  const verdicts = await mermaidVerdicts(assertMermaidOracle(), collected.workloads.map(row => row.source))
  const classified = collected.workloads.map((row, index) => ({ ...row, family: referencePolicy.families.find(family => family.upstreamDetectorIds.includes(verdicts[index]!.diagramType ?? ''))?.id ?? verdicts[index]!.diagramType ?? 'unclassified' }))
  const enriched = await withReferenceLabels(classified, {})
  const result = { ...collected, producers, workloads: [...communityCoreWorkloads(), ...enriched.workloads], reference: enriched.provenance, gaps: enriched.gaps,
    timingScope: 'The six historical core cases remain explicitly legacy diagnostics; external workloads receive no pooled speed score.' }
  mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  return result
}
if (import.meta.main) {
  const args = process.argv.slice(2)
  if (args.length !== 4 || args[0] !== '--policy' || args[2] !== '--out') throw Error('Use corpus:freeze --policy FILE --out FRESH_FILE')
  const result = await freezeExternalCorpus(JSON.parse(readFileSync(resolve(args[1]!), 'utf8')), resolve(args[3]!))
  console.log(JSON.stringify({ sources: result.sources.map(source => ({ repository: source.repository, occurrences: source.occurrences, filesOmittedByCap: source.filesOmittedByCap })), workloads: result.workloads.length, out: resolve(args[3]!) }))
}
