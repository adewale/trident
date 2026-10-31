/** Freeze already downloaded, capped research. No network, renderer or target code executes. */
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { gzipSync } from 'node:zlib'
import ts from 'typescript'
const hash = (text: string | Buffer) => createHash('sha256').update(text).digest('hex')
const headed = (source: string) => /^(?:---\r?\n[\s\S]*?\r?\n---\s*)?(?:\s*%%[^\n]*\n)*\s*(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|block(?:-beta)?|xychart(?:-beta)?|pie|mindmap|gantt|timeline|gitGraph|requirementDiagram|architecture(?:-beta)?|packet(?:-beta)?|kanban|sankey(?:-beta)?|quadrantChart|radar(?:-beta)?|C4(?:Context|Container|Component|Dynamic|Deployment)|treemap(?:-beta)?|zenuml|journey|ishikawa|eventmodeling)\b/i.test(source)
const familyOf = (source: string) => {
  const header = source.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, '').replace(/(?:^|\n)\s*%%[^\n]*/g, '').trim().split(/[\s;]+/)[0]?.toLowerCase().replace(/:$/, '') ?? ''
  if (/^(?:this is not|not (?:a )?(?:valid )?(?:mermaid|diagram)|invalid (?:mermaid|diagram))/i.test(source.trim())) return 'invalid'
  return ({ graph: 'flowchart', 'statediagram-v2': 'state', statediagram: 'state', sequencediagram: 'sequence', classdiagram: 'class', erdiagram: 'er', 'block-beta': 'block', 'xychart-beta': 'xychart', gitgraph: 'gitgraph', requirementdiagram: 'requirement', 'architecture-beta': 'architecture', 'packet-beta': 'packet', 'sankey-beta': 'sankey', quadrantchart: 'quadrant', 'radar-beta': 'radar', 'treemap-beta': 'treemap' } as Record<string, string>)[header] ?? (/^c4/.test(header) ? 'c4' : header || 'invalid')
}
export function terminalSourceTags(source: string) {
  const tags = new Set<string>(), family = familyOf(source)
  const add = (condition: boolean, tag: string) => { if (condition) tags.add(tag) }
  for (const direction of ['LR', 'RL', 'TD', 'TB', 'BT']) add(new RegExp('(?:flowchart|graph|direction)\\s+' + direction + '\\b').test(source), 'direction:' + direction)
  add(/subgraph\b/.test(source), 'groups'); add((source.match(/\bsubgraph\b/g)?.length ?? 0) > 1, 'multiple-groups')
  add(/--\s*[^\n>-]+\s*-->|--?>\|[^|]+\|/.test(source), 'edge-labels'); add(/-\.->|\.->|--x|--o|==>|---|<-->|<->/.test(source), 'edge-styles')
  add(/<br\s*\/?\s*>|\\n|[\[(]"[^"]*\n[^"]*"[\])]/.test(source), 'multiline-labels')
  add(/[^\x00-\x7f]/.test(source), 'unicode'); add(/[\u2e80-\u9fff\uac00-\ud7af]/.test(source), 'wide-labels')
  add(/\p{Mark}/u.test(source), 'combining-labels'); add(/[\x1b\x08\x00]|\\x1b|\\u001b/.test(source), 'terminal-controls')
  add(/&(?:amp|lt|gt|quot|#\d+);|\\["\\]|["'][^\n]*[(){}][^\n]*["']/.test(source), 'escaping')
  add(source.split('\n').length >= 24 || source.length >= 1000, 'large-source'); add(/\bwidth\b|.{60,}/.test(source), 'width-pressure'); add(/\bcolumns\s+\d{3,}/.test(source), 'large-scale-request')
  add(/\bstyle\b|\bclassDef\b|\blinkStyle\b|%%\{|^---/.test(source), 'configuration')
  if (family === 'flowchart') {
    const edges = [...source.matchAll(/\b([A-Za-z_]\w*)(?:\[[^\]\n]*\]|\([^\)\n]*\)|\{[^}\n]*\})?\s*(?:-->|---|-\.->|==>|--[^\n]*?-->)\s*(?:\|[^|\n]*\|\s*)?([A-Za-z_]\w*)/g)].map(m => [m[1]!, m[2]!] as const)
    const starts = edges.map(e => e[0]), ends = edges.map(e => e[1])
    add(new Set(starts).size < starts.length, 'branching'); add(new Set(ends).size < ends.length, 'merging'); add(edges.some(([a, b]) => a === b), 'self-edge')
    const reachable = (start: string, current: string, seen: Set<string>): boolean => edges.some(([a, b]) => a === current && (b === start || !seen.has(b) && reachable(start, b, new Set([...seen, b]))))
    add(edges.some(([a]) => reachable(a, a, new Set([a]))), 'cycle')
  }
  return [...tags].sort()
}
/** Text ranges describe source extraction, never visual correctness. */
export function extractTerminalSources(body: string, format: string) {
  const inputs: { source: string; offset: number; extraction: string }[] = []
  const add = (source: string, offset: number, extraction: string, explicit = false) => {
    const separator = source.indexOf('\n---\n')
    if (separator >= 0 && /expected output|[┌┐└┘]/i.test(source.slice(separator + 5))) { source = source.slice(0, separator + 1); extraction += '-input-before-golden-separator' }
    const negative = /^(?:this is not (?:a )?(?:valid )?(?:mermaid|diagram)|not (?:a )?(?:valid )?(?:mermaid|diagram)|invalid (?:mermaid|diagram))/i.test(source.trim())
    if (!explicit && !negative && (/%[sdv]|\$\{/.test(source) || /^(?:flowchart|graph)-/.test(source.trim()) || !/[\n;]/.test(source) && !/^(?:graph|flowchart)\s+(?:LR|RL|TD|TB|BT)\b[ \t]+\S/.test(source.trim()))) return
    if (headed(source) || negative) inputs.push({ source, offset, extraction })
  }
  const literals = (code: string, base: number, language: string) => {
    if (/^(?:ts|tsx|typescript|js|jsx|javascript)$/.test(language)) {
      const file = ts.createSourceFile('source.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const visit = (node: ts.Node) => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
          const parent = node.parent, title = ts.isCallExpression(parent) && parent.arguments[0] === node && /(?:^|\.)(?:test|it|describe)(?:\.|$)/.test(parent.expression.getText(file))
          const fragment = ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.PlusToken
          if (!title && !fragment) add(node.text, base + node.getStart(file), 'decoded-static-' + language + '-literal')
        }
        ts.forEachChild(node, visit)
      }; visit(file)
    } else {
      for (const match of code.matchAll(/(?:echo|printf)\s+'([^']+)'/g)) add(match[1]!, base + match.index!, 'literal-shell-single-quoted-source')
      const raw = /r(#{0,8})"([\s\S]*?)"\1/g
      for (const match of code.matchAll(raw)) add(match[2]!, base + match.index!, 'static-Rust-raw-literal')
      for (const match of code.matchAll(/`([^`]+)`/g)) add(match[1]!, base + match.index!, 'static-Go-raw-literal')
      for (const match of code.matchAll(/(?:^|[^\w])(?:r)?(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')/gm)) add(match[1] ?? match[2]!, base + match.index!, 'static-Python-triple-literal')
      for (const match of code.matchAll(/"(?:[^"\\]|\\.)*"/g)) { try { add(JSON.parse(match[0]), base + match.index!, 'JSON-compatible-static-string-literal') } catch { /* Language-specific escapes remain unextracted. */ } }
    }
  }
  if (format === 'mmd') add(body, 0, 'literal-file', true)
  else if (format === 'txt') { const separator = body.indexOf('\n---\n'); add(separator >= 0 ? body.slice(0, separator + 1) : body, 0, separator >= 0 ? 'literal-input-before-golden-separator' : 'literal-file', true) }
  else if (['ts', 'tsx', 'js', 'jsx', 'rs', 'go', 'py'].includes(format)) literals(body, 0, format)
  else for (const fence of body.matchAll(/^```([^\r\n]*)\r?\n([\s\S]*?)^```[^\S\r\n]*$/gm)) {
    const language = fence[1]!.trim().toLowerCase(), offset = fence.index! + fence[0].indexOf(fence[2]!)
    if (['mermaid', 'mermaid-example', '', 'text', 'txt'].includes(language)) add(fence[2]!, offset, 'literal-fenced-source', ['mermaid', 'mermaid-example'].includes(language))
    else literals(fence[2]!, offset, language)
  }
  return inputs.filter((input, index) => inputs.findIndex(other => other.offset === input.offset && other.source === input.source) === index)
}
export function freezeTerminalCorpus(research: string, destination: string) {
  const policy = JSON.parse(readFileSync(join(research, 'policy.json'), 'utf8')), projects: any[] = [], bySource = new Map<string, any>()
  mkdirSync(join(destination, 'terminal-research'), { recursive: true })
  for (const name of readdirSync(join(research, 'projects')).sort()) {
    const path = join(research, 'projects', name, 'receipt.json'), bytes = readFileSync(path), receipt = JSON.parse(bytes.toString()), sha256 = hash(bytes)
    writeFileSync(join(destination, 'terminal-research', sha256 + '.json.gz'), gzipSync(bytes))
    let occurrences = 0
    const recordInput = (origin: any, body: string, format: string) => {
      if (hash(body) !== origin.bodySha256) throw Error('Research source bytes changed: ' + origin.url)
      for (const input of extractTerminalSources(body, format)) {
        const sourceSha256 = hash(input.source), candidate = bySource.get(sourceSha256) ?? { id: 'terminal:' + sourceSha256.slice(0, 16), sourceSha256, source: input.source, family: familyOf(input.source), features: terminalSourceTags(input.source), intent: 'unreviewed', expected: { status: 'unreviewed', reason: 'No independently reviewed drawing contract; source tags are selection metadata only.' }, origins: [] }
        candidate.origins.push({ ...origin, body: undefined, line: body.slice(0, input.offset).split('\n').length, extraction: input.extraction, researchSnapshotSha256: sha256 }); bySource.set(sourceSha256, candidate); occurrences++
      }
    }
    for (const file of receipt.files) recordInput({ ...file, channel: /test|spec|fixture/i.test(file.path) ? 'project-regression-fixture' : 'project-docs-example' }, file.body, file.path.split('.').at(-1) ?? 'md')
    for (const record of receipt.records) recordInput({ ...record, channel: record.kind === 'pull' ? 'pull-request-body' : 'issue-reproducer' }, record.body, 'md')
    for (const diff of receipt.pullDiffs) {
      const added = diff.patch.split('\n').filter((line: string) => line.startsWith('+') && !line.startsWith('+++')).map((line: string) => line.slice(1)).join('\n')
      if (!added) continue
      recordInput({ ...diff, patch: undefined, channel: 'pull-added-source', bodySha256: hash(added), adaptation: 'Added patch lines only; diff prefixes removed. Partial literals may remain invalid and are not filtered by renderer success.' }, added, diff.path.split('.').at(-1) ?? 'md')
    }
    projects.push({ repository: receipt.repository, commit: receipt.commit, license: receipt.license, sourceSnapshot: 'terminal-research/' + sha256 + '.json.gz', sha256, files: receipt.files.map(({ body: _body, ...file }: any) => file), fetchedRecordCounts: receipt.fetchedRecordCounts, channelCounts: receipt.channelCounts, supplementalSearch: receipt.supplementalSearch, eligibleFileCount: receipt.eligibleFileCount, omittedFilesByCap: receipt.omittedFilesByCap, occurrences, gaps: receipt.gaps })
  }
  const adaptationFile = join(research, 'adaptations.json')
  for (const adapted of JSON.parse(readFileSync(adaptationFile, 'utf8'))) {
    const sourceSha256 = hash(adapted.source), candidate = bySource.get(sourceSha256) ?? { id: 'terminal:' + sourceSha256.slice(0, 16), sourceSha256, source: adapted.source, family: familyOf(adapted.source), features: terminalSourceTags(adapted.source), intent: 'unreviewed', expected: { status: 'unreviewed', reason: 'Real issue stimulus requires a reviewed terminal-state observer.' }, origins: [] }
    candidate.origins.push(adapted.origin); bySource.set(sourceSha256, candidate)
  }
  const schema = (candidate: any) => /<(?:text|label|value|name|number|period|task|section)>|^\s*\.\.\.\s*$/m.test(candidate.source)
  const excludedSchemas = [...bySource.values()].filter(schema).map(candidate => ({ id: candidate.id, sourceSha256: candidate.sourceSha256, reason: 'Documentation syntax schema with placeholder fields, not a concrete executable example', origins: candidate.origins }))
  const candidates = [...bySource.values()].filter(candidate => !schema(candidate)).sort((a, b) => a.id.localeCompare(b.id)), selected = new Set<string>(), strata = new Map<string, number>()
  const stratum = (candidate: any) => JSON.stringify([candidate.family, candidate.features, candidate.source.split('\n').length <= 3 ? 'short' : candidate.source.split('\n').length <= 12 ? 'medium' : 'long'])
  const choose = (candidate: any) => { if (selected.has(candidate.id)) return; selected.add(candidate.id); const key = stratum(candidate); strata.set(key, (strata.get(key) ?? 0) + 1) }
  // Coverage-driven selection is fixed without renderer outcomes: every observed
  // family, then every static feature, then contributor/family round-robin.
  for (const family of [...new Set(candidates.map(c => c.family))].sort()) choose(candidates.filter(c => c.family === family).sort((a, b) => a.source.length - b.source.length || a.id.localeCompare(b.id))[0])
  for (const feature of [...new Set(candidates.flatMap(c => c.features))].sort()) choose(candidates.filter(c => c.features.includes(feature)).sort((a, b) => a.source.length - b.source.length || a.id.localeCompare(b.id))[0])
  for (let round = 0; round < 8 && selected.size < 120; round++) for (const project of projects) {
    if (selected.size >= 120) break
    const candidate = candidates.filter(c => !selected.has(c.id) && c.origins.some((o: any) => o.repository === project.repository) && (strata.get(stratum(c)) ?? 0) < 3).sort((a, b) => (strata.get(stratum(a)) ?? 0) - (strata.get(stratum(b)) ?? 0) || a.source.length - b.source.length || a.id.localeCompare(b.id))[0]
    if (candidate) choose(candidate)
  }
  const result = { protocol: 'terminal-project-corpus-v1', policy, selection: { rule: 'One shortest source per observed family and static feature; then at most eight contributor rounds up to 120 distinct source byte strings, with at most three per family/static-feature/line-count stratum. Ties by source hash. No renderer outcome participates.', candidates: candidates.length, selected: selected.size, exactSourceDeduplication: true, sourceTagsAreNotCorrectnessExpectations: true, noFrequencyClaim: true }, projects, excludedSchemas, cases: candidates.filter(c => selected.has(c.id)), omittedCandidates: candidates.filter(c => !selected.has(c.id)).map(c => ({ id: c.id, sourceSha256: c.sourceSha256, family: c.family, features: c.features, origins: c.origins.map(({ body: _body, ...origin }: any) => origin) })) }
  writeFileSync(join(destination, 'terminal-project-examples.json'), JSON.stringify(result, null, 2) + '\n')
  return result
}
if (import.meta.main) {
  const [research, destination] = process.argv.slice(2)
  if (!research || !destination) throw Error('Use bun scripts/freeze-terminal-corpus.ts RESEARCH_DIRECTORY CORPUS_DIRECTORY')
  const result = freezeTerminalCorpus(resolve(research), resolve(destination))
  console.log(JSON.stringify({ projects: result.projects.length, candidates: result.selection.candidates, selected: result.cases.length, families: [...new Set(result.cases.map(c => c.family))], features: [...new Set(result.cases.flatMap(c => c.features))].sort() }, null, 2))
}
