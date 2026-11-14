/** What kind of outcome a Mermaid Fidelity callback had, separately from its raw
 * disposition and from how it is scored.
 *
 * A reference-qualified callback ends as one of five kinds:
 *
 * - `passed`: the original assertions passed on the candidate's own operation.
 * - `native-failure`: an original assertion failed, or the candidate's own code faulted
 *   (raw disposition `failed`).
 * - `native-unsupported`: the candidate's own code reported that it cannot do this: its
 *   parser or detector refused the diagram type ("Unrecognized diagram type"), or its own
 *   parse returned another diagram kind or an opaque body (raw `unsupported`).
 * - `capability-assessment`: Trident decided, from the candidate's source, types or
 *   interface, that the capability is absent: a family missing from a bridge's per-family
 *   table, Mermaid's database API, a concept a reviewed view declares absent (raw
 *   `unsupported`). Each one names its basis (CAPABILITY_ASSESSMENTS below); the review in
 *   docs/evidence/fidelity-capability-review-*.json checks them against the installed
 *   artifacts.
 * - `adapter-limitation`: Trident has no binding, view or value for what the test needs
 *   (raw `trident-blocked`).
 *
 * Scoring is unchanged (scoring.ts): a native failure is a known nonpass; native
 * unsupported, capability assessments and adapter limitations are unassessed.
 *
 * The runtime records each unsupported verdict with its provenance (`unsupportedKinds` in
 * the audit, aligned with `unsupported`), and case rows carry the result as
 * `unsupportedKind`. Results collected before provenance was recorded are classified from
 * the reason text alone (`unsupportedKind` with no provenance). */
export const OUTCOME_KINDS = ['passed', 'native-failure', 'native-unsupported', 'capability-assessment', 'adapter-limitation'] as const
export type OutcomeKind = (typeof OUTCOME_KINDS)[number]
export type UnsupportedKind = 'native' | 'assessment'
/** Where an unsupported verdict was recorded: the candidate's own refusal or result
 * (`native`), a bridge's `{unsupported}` reply (`bridge`), or Trident's own judgement
 * (`trident`: an unsupported operation or a view's declared-absent concept). */
export type UnsupportedProvenance = 'native' | 'bridge' | 'trident'

/** Verdicts that report what the candidate's own parser returned, whoever words them: the
 * diagram kind its parser or detector produced for the source, or an opaque body. */
const NATIVE_OBSERVED: RegExp[] = [
  /\b(?:parsed|detected|rendered) this source as \S+, not \S+/,
  /\bdid not recognize this source as\b/,
  /\bdeclined this source\b/,
  /^Actual native parse returned /,
  /\bdoes not recognise [\w-]+ diagrams; its parser read the source as\b/,
  /^Native detector classified this source as\b/,
]
/** A native parse reported against the non-family `<shared>` that a shared test requests. */
const SHARED_REQUEST = /\bnot <shared>(?:\W|$)/
/** Trident-authored bridge refusals: a family absent from the bridge's per-family table
 * or from the public library. Every other `{unsupported}` a bridge relays is the
 * candidate's own message (its UnsupportedDiagram error, its detector's refusal). */
const BRIDGE_TABLE: RegExp[] = [/(?:^|\s)has no [\w:<>-]+ parser\b/, /\bdoes not export its [\w:]+ parser\b/]
/** Candidate messages seen in results collected before provenance was recorded. */
const NATIVE_MESSAGES: RegExp[] = [
  ...NATIVE_OBSERVED,
  /unsupported diagram|unknown diagram|unrecognized diagram type|unsupported .*diagram type/i,
  /detect diagram (?:type|kind)|No (?:Mermaid )?diagram type detected/i,
  /^mermaid-ascii \S+ parser: /,
  /^mermaid_core \S+ parse[A-Z]\w*: /,
]

/** The kind of one unsupported verdict. */
export function unsupportedKind(reason: string, provenance?: UnsupportedProvenance): UnsupportedKind {
  // A shared test asks a family parser for Mermaid's cross-family detection. The
  // candidate parsing the source under its own family is not a refusal: the mismatch is
  // Trident's request, whoever words it.
  if (SHARED_REQUEST.test(reason)) return 'assessment'
  if (provenance === 'native') return 'native'
  if (NATIVE_OBSERVED.some(pattern => pattern.test(reason))) return 'native'
  if (provenance === 'bridge') return BRIDGE_TABLE.some(pattern => pattern.test(reason)) ? 'assessment' : 'native'
  if (provenance === 'trident') return 'assessment'
  return NATIVE_MESSAGES.some(pattern => pattern.test(reason)) ? 'native' : 'assessment'
}

/** A callback's unsupported kind: native when the candidate's own code reported any of its
 * unsupported verdicts, otherwise a capability assessment. `kinds` is the audit's recorded
 * provenance; without it, each reason is classified from its text. */
export function callbackUnsupportedKind(reasons: readonly string[], kinds?: readonly UnsupportedKind[]): UnsupportedKind {
  if (kinds?.length) return kinds.includes('native') ? 'native' : 'assessment'
  return reasons.some(reason => unsupportedKind(reason) === 'native') ? 'native' : 'assessment'
}

/** The basis Trident's capability assessments rest on, so each names its evidence. */
export const CAPABILITY_ASSESSMENTS: { id: string; pattern: RegExp; basis: string }[] = [
  { id: 'family-table', pattern: /(?:^|\s)has no [\w:<>-]+ parser\b/, basis: "the family is absent from the bridge's per-family table, written from the project's own detector, type list or dispatch (bridges/*)" },
  { id: 'public-library', pattern: /\bdoes not export its [\w:]+ parser\b/, basis: "the parser exists only in private code; the project's public library does not export it (SCOPE.md public-interface rule)" },
  { id: 'jison-callback', pattern: /jison yy callback protocol/, basis: "the candidate's parse returns its own model and drives no database the caller supplies (runtime.ts)" },
  { id: 'database-protocol', pattern: /spied on or inspected \(Mermaid's parser -> database protocol\)/, basis: "the candidate's parser makes no calls on a database the test can observe (runtime.ts)" },
  { id: 'database-api', pattern: /\(the candidate exposes a parser, not Mermaid's database API\)/, basis: "the candidate's public interface and model offer no such database member (runtime.ts; the member is absent from the native database class where the candidate has one)" },
  { id: 'mermaid-pipeline', pattern: /Diagram\.fromText in a shared test|preserveCommentsWhenParsing|\bnot <shared>(?:\W|$)/, basis: "Mermaid's own diagram detection, registry and pipeline flags, not a parser operation (4 and 5 November policies)" },
  { id: 'renderer-layout', pattern: /^Mermaid's [\w ]*(?:renderer|getData|getDataStructures|getPacket|host configuration)|Mermaid's maxNodeWidth configuration/, basis: "Mermaid's renderer or host configuration decides the value; it is not a parse result (4 November policy)" },
  { id: 'no-model', pattern: /exposes no parsed model/, basis: "the public interface returns no parsed model (bridges/ondine.mjs)" },
  { id: 'model-concept', pattern: /[\s\S]/, basis: "a reviewed view declares the concept absent from the native model (views/*, view-core.mjs)" },
]
/** The assessment basis a reason rests on (the first matching entry). */
export const assessmentBasis = (reason: string) => CAPABILITY_ASSESSMENTS.find(entry => entry.pattern.test(reason))!.id

export type OutcomeCounts = Record<OutcomeKind, number>
const zero = (): OutcomeCounts => ({ passed: 0, 'native-failure': 0, 'native-unsupported': 0, 'capability-assessment': 0, 'adapter-limitation': 0 })

/** The outcome kind of one qualified case row ({status, reason, unsupportedKind?}), or
 * undefined for a callback that is not reference-qualified. */
export function outcomeKind(row: { status: string; reason?: unknown; unsupportedKind?: UnsupportedKind }): OutcomeKind | undefined {
  switch (row.status) {
    case 'passed': return 'passed'
    case 'failed': return 'native-failure'
    case 'trident-blocked': return 'adapter-limitation'
    case 'unsupported': {
      const reason = String(row.reason ?? '')
      const kind = row.unsupportedKind ?? callbackUnsupportedKind([reason, ...reason.split('; ')])
      return kind === 'native' ? 'native-unsupported' : 'capability-assessment'
    }
    default: return undefined
  }
}

/** Outcome kinds over the scored population and over every qualified callback. */
export function outcomeKindCounts(cases: readonly { file: string; status: string; reason?: unknown; unsupportedKind?: UnsupportedKind }[], isScored: (file: string) => boolean) {
  const scored = zero(), qualified = zero()
  for (const row of cases) {
    const kind = outcomeKind(row)
    if (!kind) continue
    qualified[kind]++
    if (isScored(row.file)) scored[kind]++
  }
  return { scored, qualified }
}
