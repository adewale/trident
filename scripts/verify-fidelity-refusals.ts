/** Check every native refusal in Mermaid Fidelity runs against the pinned Mermaid oracle.
 * No candidate runs. A refusal counts as a known nonpass in scoring v3 only when the
 * oracle accepts every source the candidate refused in that callback
 * (unified/mermaid-fidelity/verification.ts).
 *
 *   bun scripts/verify-fidelity-refusals.ts --out VERIFIED.json RUN_DIR...
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assertMermaidOracle, MERMAID_ORACLE_PIN, mermaidVerdicts } from '../portable/mermaid-oracle.ts'
import { outcomeKind } from '../unified/mermaid-fidelity/outcome-kinds.ts'
import { REFUSAL_VERIFICATION_PROTOCOL, sourceDigest, type OracleVerdict } from '../unified/mermaid-fidelity/verification.ts'

/** Every distinct source behind a native refusal in the runs, with the projects that refused it. */
export function refusedSources(runs: readonly any[]) {
  const sources = new Map<string, { source: string; projects: Set<string> }>()
  for (const run of runs) for (const row of run.results ?? []) for (const c of row.cases ?? [])
    if (outcomeKind(c) === 'native-unsupported') for (const source of c.refusedSources ?? []) {
      const digest = sourceDigest(source), entry = sources.get(digest) ?? { source, projects: new Set<string>() }
      entry.projects.add(row.project)
      sources.set(digest, entry)
    }
  return sources
}

if (import.meta.main) {
  const args = process.argv.slice(2), at = args.indexOf('--out')
  const out = at >= 0 ? args.splice(at, 2)[1] : undefined
  if (!out || !args.length) throw Error('verify-fidelity-refusals --out VERIFIED.json RUN_DIR...')
  if (existsSync(out)) throw Error('Choose a fresh output file')
  const runs = args.map(dir => JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8')))
  const sources = refusedSources(runs), digests = [...sources.keys()].sort()
  const replies = await mermaidVerdicts(assertMermaidOracle(), digests.map(digest => sources.get(digest)!.source))
  const verdicts: Record<string, OracleVerdict & { projects: string[]; source: string }> = {}
  digests.forEach((digest, index) => {
    const reply = replies[index]!, entry = sources.get(digest)!
    verdicts[digest] = { accepted: reply.accepted === true, ...(reply.diagramType ? { diagramType: reply.diagramType } : {}), ...(reply.error ? { error: reply.error } : {}), projects: [...entry.projects].sort(), source: entry.source }
  })
  const accepted = Object.values(verdicts).filter(verdict => verdict.accepted).length
  // One verdict per line: the refused sources stay in the evidence and diffs stay readable.
  const header = JSON.stringify({
    protocol: REFUSAL_VERIFICATION_PROTOCOL,
    oracle: { mermaid: MERMAID_ORACLE_PIN.version, parser: MERMAID_ORACLE_PIN.parser, dom: MERMAID_ORACLE_PIN.dom },
    method: "Each source a candidate's own code refused (runtime.ts records it beside the refusal) is parsed by the pinned Mermaid oracle's public mermaid.parse. Accepted means the candidate refused valid Mermaid; a source the oracle rejects is not counted against the candidate.",
    checkedAt: new Date().toISOString(),
    runs: runs.map(run => ({ updatedAt: run.updatedAt, controlIdentity: run.controlIdentity })),
    sources: digests.length, accepted, rejected: digests.length - accepted,
  }, null, 2)
  const lines = digests.map(digest => `    ${JSON.stringify(digest)}: ${JSON.stringify(verdicts[digest])}`)
  writeFileSync(out, header.slice(0, -2) + ',\n  "verdicts": {\n' + lines.join(',\n') + '\n  }\n}\n')
  console.log(JSON.stringify({ sources: digests.length, accepted, rejected: digests.length - accepted }))
}
