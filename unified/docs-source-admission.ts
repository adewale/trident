import registry from '../corpus/docs-source-registry.json' with { type: 'json' }
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import type { DocsDrawingReview, DocsInput } from './docs-drawings.ts'

/** Scientific meaning and eligibility, not editorial provenance/method wording.
 * Updating generated contracts does not register them for scoring. The reviewed
 * semantic data must change explicitly; literal regeneration remains available. */
export function docsSourceSemanticHash(review: DocsDrawingReview) {
  const source = review.sourceReview
  return evidenceDigest({ intent: review.intent, family: review.family, expected: review.expected ?? null, unverifiedFacts: review.unverifiedFacts ?? [], sourceReview: source ? { protocol: source.protocol, sourcePin: source.sourcePin, expectedFactsComplete: source.expectedFactsComplete, requiredObligations: source.requiredObligations, unresolved: source.unresolved, excludedNonvisual: source.excludedNonvisual } : null })
}
const registered = new Map(registry.cases.map(entry => [entry.id, Object.freeze({ ...entry })]))
if (registry.schema !== 'trident-docs-source-registry-v1' || registered.size !== 548 || registry.cases.length !== 548) throw Error('Canonical documentation source registry is incomplete or duplicated')
export function docsSourceAdmission(input: DocsInput, review: DocsDrawingReview | null) {
  if (!input.id.startsWith('packages/mermaid/src/docs/syntax/')) return { canonical: false, matched: true, reason: 'Synthetic/custom source controls are outside the canonical DaveBench corpus' }
  const entry = registered.get(input.id), literalMatches = entry?.sourceSha256 === evidenceBytesDigest(input.source)
  const matched = !!entry && literalMatches && !!review && review.sourceSha256 === entry.sourceSha256 && docsSourceSemanticHash(review) === entry.semanticSha256
  return { canonical: true, matched, registeredIntent: literalMatches ? entry!.intent : 'drawing', registeredProfileEligible: entry?.profileEligible ?? false, reason: matched ? 'Exact registered literal source, semantic facts and source role' : 'Canonical documentation source/semantics are unregistered or changed; no score or configuration-only exclusion can be inferred' }
}
