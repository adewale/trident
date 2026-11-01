export type MeaningJson = null | boolean | number | string | MeaningJson[] | { [key: string]: MeaningJson }
export interface MeaningNode { id: string; label: string }
export interface MeaningEdge { source: string; target: string; directed: boolean; label?: string; startMarker?: string; endMarker?: string }
export interface MeaningGroup { id: string; label: string; members: string[] }
export interface PaintExpectation { fontSize?: number; nodeFill?: string; edgeStroke?: string; edgeStrokeWidth?: number; images?: { href: string; count: number }[] }
export interface MeaningExpectation {
  labels: string[]
  /** Explicitly hidden source content, such as a collapsed group's members. */
  forbiddenLabels?: string[]
  nodes?: MeaningNode[]
  edges?: MeaningEdge[]
  groups?: MeaningGroup[]
  facts?: Record<string, MeaningJson>
  /** Literal presentation hints without a qualified normative visual constraint. */
  advisoryFacts?: Record<string, MeaningJson>
  unorderedFacts?: string[]
}
export interface AuthoredFidelityCase {
  id: string
  family: string
  required: boolean
  source: string
  features: string[]
  provenance: string
  expected: MeaningExpectation
  /** Original authored public-model profile; source enrollment extends SVG
   * obligations without silently rewriting the native API contract. */
  profileExpected?: MeaningExpectation
  sourceReview?: { protocol: string; sourceSha256: string; expectedSha256: string; expectedFactsComplete: boolean; requiredObligations: string[]; unresolved: string[]; provenance: string; visualProjections?: string[] }
  renderOptions?: Record<string, MeaningJson>
  paint?: PaintExpectation
  prelude?: { source: string; accept: boolean }[]
  edit?: { source: string; expected: MeaningExpectation; renderOptions?: Record<string, MeaningJson>; paint?: PaintExpectation }
}
export interface NormalizedMeaning {
  family: string
  nodes?: MeaningNode[]
  edges?: MeaningEdge[]
  groups?: MeaningGroup[]
  facts: Record<string, MeaningJson>
  unavailable: Record<string, string>
}
export interface MeaningCheck {
  criterion: string
  status: 'passed' | 'failed' | 'unavailable'
  expected: unknown
  actual: unknown
  scope: string
}

/** Missing capability/host evidence cannot become a failed positive prelude
 * or earn successful source-rejection credit for a negative prelude. */
export function assessPrelude(accepted: boolean, actual: 'accepted' | 'rejected' | 'unsupported' | 'unavailable'): 'passed' | 'failed' | 'unsupported' | 'unavailable' {
  if (actual === 'unsupported' || actual === 'unavailable') return actual
  return (actual === 'accepted') === accepted ? 'passed' : 'failed'
}
const display = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
const normalize = (value: unknown): unknown => Array.isArray(value) ? value.map(normalize) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, normalize(item)])) : value
const stable = (value: unknown) => JSON.stringify(normalize(value))
const ordered = (values: unknown[]) => values.map(stable).sort()

/** Authored literals choose the facts. Tool agreement never supplies an expectation. */
export function assessMeaning(testCase: Pick<AuthoredFidelityCase, 'family' | 'expected' | 'profileExpected'>, observed?: NormalizedMeaning): { complete: boolean; passed: boolean; checks: MeaningCheck[] } {
  const expectation = testCase.profileExpected ?? testCase.expected
  const checks: MeaningCheck[] = []
  const check = (criterion: string, expected: unknown, actual: unknown, scope: string, available = actual !== undefined) => {
    checks.push({ criterion, status: !available ? 'unavailable' : stable(expected) === stable(actual) ? 'passed' : 'failed', expected, actual: actual ?? null, scope: observed?.unavailable[criterion] ?? scope })
  }
  check('family', testCase.family, observed?.family, 'Returned native family; a source-preservation envelope is not native admission.')
  if (expectation.nodes) {
    check('identities', ordered(expectation.nodes.map(node => node.id)), observed?.nodes && ordered(observed.nodes.map(node => node.id)), 'Exact authored identity multiset, including duplicate and omitted identities.')
    const labels = (nodes: MeaningNode[]) => ordered(nodes.map(node => ({ ...node, label: display(node.label) })))
    check('node-labels', labels(expectation.nodes), observed?.nodes && labels(observed.nodes), 'Authored identity-to-label binding; NFC/whitespace normalization applies to display labels, never identity strings.')
  }
  if (expectation.edges) {
    // Every edge uses the union of declared fields. Dropping a direction/label
    // from one member must not quietly weaken other members' comparisons.
    const keys = [...new Set(expectation.edges.flatMap(edge => Object.keys(edge)))].sort()
    const project = (edge: MeaningEdge) => Object.fromEntries(keys.map(key => [key, key === 'label' ? display(edge.label ?? '') : edge[key as keyof MeaningEdge] ?? null]))
    check('relationships', ordered(expectation.edges.map(project)), observed?.edges && ordered(observed.edges.map(project)), 'Exact endpoint/direction/declared-marker/label multiset; parallel and reciprocal relationships remain distinct.')
  }
  if (expectation.groups) {
    const groups = (values: MeaningGroup[]) => ordered(values.map(group => ({ ...group, label: display(group.label), members: [...group.members].sort() })))
    check('groups', groups(expectation.groups), observed?.groups && groups(observed.groups), 'Exact immediate membership and label binding; nested groups are identities, not flattened leaves.')
  }
  for (const [key, expected] of Object.entries(expectation.facts ?? {})) {
    const unordered = expectation.unorderedFacts?.includes(key)
    const actual = observed?.facts[key]
    const compared = (value: unknown) => unordered && Array.isArray(value) ? ordered(value) : value
    check('fact:' + key, compared(expected), compared(actual), unordered ? 'Declared unordered family-content multiset; duplicates remain significant.' : 'Independently declared family content with meaningful ordering retained.', !!observed && Object.hasOwn(observed.facts, key))
  }
  return { complete: checks.every(item => item.status !== 'unavailable'), passed: checks.length > 0 && checks.every(item => item.status === 'passed'), checks }
}
