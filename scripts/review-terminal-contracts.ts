import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readTerminalCorpus } from '../fidelity/terminal-corpus.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
const target = resolve(import.meta.dir, '../corpus/terminal-project-reviews.json')
export function terminalSourceReviews() {
  return readTerminalCorpus().cases.map(input => {
    const analysis = analyseTerminalSource(input.source, input.family)
    if (analysis.contract.sourceUncertainties.length) throw Error('Unreviewed source syntax: ' + input.id + ' ' + analysis.contract.sourceUncertainties.join('; '))
    return { caseId: input.id, sourceSha256: input.sourceSha256, reviewedBy: 'Codex; literal source transcription, 2026-10-31', review: 'Independent source-token transcription; no candidate output, renderer AST or reference render defines these facts. Diagram data, relationships and qualified source geometry are required. Broad global/subgraph layout hints, CSS/theme configuration and accessibility metadata are retained separately from the core terminal-content requirements. Original source provenance remains in terminal-project-examples.json.', intent: analysis.intent, contract: analysis.contract, unverifiedFacts: [] }
  })
}
if (import.meta.main) {
  const reviews = terminalSourceReviews(), bytes = JSON.stringify(reviews, null, 2) + '\n'
  if (process.argv.includes('--check')) { if (readFileSync(target, 'utf8') !== bytes) throw Error('Terminal source contracts are stale') }
  else writeFileSync(target, bytes)
  console.log(JSON.stringify({ cases: reviews.length, sha256: createHash('sha256').update(bytes).digest('hex'), scope: 'Complete source obligations, not a claim that all output observers are implemented' }))
}
