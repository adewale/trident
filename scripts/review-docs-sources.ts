/** Freeze literal Mermaid documentation source and independent expectations.
 * Reads Git objects only. No renderer, target parser, browser or network executes. */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { docsInventory } from '../unified/docs-benchmark.ts'
import { admitDocsReviews } from '../unified/docs-drawings.ts'
import { docsSourcePin, reviewDocumentationSource } from '../unified/docs-source-review.ts'

export function documentationSourceAudit(inventory: ReturnType<typeof docsInventory>) {
  if (inventory.pin.commit !== docsSourcePin || inventory.occurrences !== 548 || inventory.distinct !== 546 || inventory.cases.length !== 548 || new Set(inventory.cases.map(row => row.id)).size !== 548 || new Set(inventory.cases.map(row => row.source.trim())).size !== 546) throw Error('Pinned documentation census changed; review the source policy before replacing data')
  const reviews = inventory.cases.map(reviewDocumentationSource)
  const admitted = admitDocsReviews(inventory.cases, reviews)
  const family = new Map<string, { total: number; complete: number; pending: number; configuration: number }>()
  for (const row of reviews) { const counts = family.get(row.family) ?? { total: 0, complete: 0, pending: 0, configuration: 0 }; counts.total++; if (row.intent === 'configuration-only') counts.configuration++; else if (row.sourceReview.expectedFactsComplete) counts.complete++; else counts.pending++; family.set(row.family, counts) }
  return { reviews, admitted, families: [...family].sort(([a], [b]) => a.localeCompare(b)), pending: reviews.filter(row => !row.sourceReview.expectedFactsComplete) }
}

export function sourceAuditMarkdown(inventory: ReturnType<typeof docsInventory>, audit: ReturnType<typeof documentationSourceAudit>) {
  return `# DaveBench source expectations\n\nThe corpus contains all **548 occurrences (546 distinct diagrams)** from Mermaid's syntax documentation at [\`${docsSourcePin}\`](https://github.com/mermaid-js/mermaid/tree/${docsSourcePin}/packages/mermaid/src/docs/syntax). Duplicate fences keep their own source locations and acceptance denominator. The frozen literal inputs are in \`corpus/docs-source-inventory.json.gz\`; \`corpus/docs-reviewed.json\` binds each contract to the exact source SHA-256. Upstream's MIT license is retained in \`corpus/docs-assets/MERMAID-LICENSE\`.\n\nExpectations come from an independent literal-source transcriber, not SVGs, candidate parsers or agreement with Mermaid's rendering. Each family records domain facts: topology and markers, hierarchy and grouping, ordered messages or tasks, exact quantities and axes, grammar trees, styles, visibility, metadata and authored configuration. Unknown constructs remain named per source and receive no accuracy credit. A complete transcription does not mean that Trident has a qualified observer for every fact: the SVG/PNG proof must verify every listed obligation against the actual retained output. Unsupported observers leave accuracy unknown.\n\nRegenerate with \`bun scripts/review-docs-sources.ts /path/to/pinned/mermaid-source\`. Use \`--check\` to verify that committed source and expectations match those Git objects. The command reads source only; it does not render or benchmark anything. Source-specific mutation and regression controls live in \`tests/docs-source-review.test.ts\`.\n\n| Family | Occurrences | Transcribed drawing contracts | Pending source facts | Configuration only |\n|---|---:|---:|---:|---:|\n${audit.families.map(([name, counts]) => `| ${name} | ${counts.total} | ${counts.complete} | ${counts.pending} | ${counts.configuration} |`).join('\n')}\n\n## Pending source interpretation\n\n${audit.pending.length ? audit.pending.map(row => `- **${row.id}**: ${row.sourceReview.unresolved.join('; ').replace(/\n/g, ' ')}`).join('\n') : 'No uninterpreted source constructs remain. The separate observer qualification ledger still determines which drawing facts can be scored.'}\n\n## Resource prerequisite\n\nThe documentation's \`https://mermaid.js.org/favicon.svg\` reference is frozen from the same source pin in \`corpus/docs-assets.json\`, with bytes and license hashes. Rendering must route this exact URL to those bytes before timing. Icon packs and authored font requirements remain explicit source facts; a missing required resource is a setup gap, not a renderer defect. Navigation links and callbacks are outside this static drawing task and are listed separately in each contract.\n`
}

if (import.meta.main) {
  const args = process.argv.slice(2), check = args.includes('--check'), source = args.find(arg => arg !== '--check')
  if (!source) throw Error('Usage: bun scripts/review-docs-sources.ts /path/to/pinned/mermaid-source [--check]')
  const root = resolve(import.meta.dir, '..'), inventory = docsInventory(resolve(source)), audit = documentationSourceAudit(inventory)
  const outputs = new Map<string, string | Buffer>([
    ['corpus/docs-reviewed.json', JSON.stringify(audit.reviews, null, 2) + '\n'],
    ['corpus/docs-source-inventory.json.gz', gzipSync(JSON.stringify(inventory) + '\n')],
    ['docs/docs-source-expectations.md', sourceAuditMarkdown(inventory, audit)],
  ])
  for (const [path, value] of outputs) { const file = join(root, path), bytes = Buffer.from(value); if (check) { if (!readFileSync(file).equals(bytes)) throw Error('Stale documentation source artifact: ' + path) } else writeFileSync(file, bytes) }
  console.log(JSON.stringify({ occurrences: inventory.occurrences, distinct: inventory.distinct, transcribed: audit.reviews.length - audit.pending.length, pending: audit.pending.length, check }))
}
