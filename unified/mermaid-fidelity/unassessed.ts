/** Who can close an unassessed Mermaid Fidelity callback, and how.
 *
 * Under scoring v3 (scoring.ts) a callback of the scored population is a known outcome when
 * it passed, failed natively, is a verified refusal or a confirmed absence
 * (verification.ts). Every other in-scope callback is unassessed, and each one has an owner:
 *
 * - `trident-binding`: an adapter limitation where the candidate exposes something Trident
 *   does not read (an unbound parser export, a database getter no view maps). Closed by a
 *   reviewed binding or view.
 * - `trident-collection`: the candidate's test file did not load (`Candidate test not
 *   collected`; the file-level reason is in the row's missingFiles). Closed by fixing the
 *   setup binding.
 * - `trident-defect`: Trident itself errored (`Trident error: ...`). Closed by fixing Trident.
 * - `evidence-assessment`: a capability assessment no recorded review confirmed. Closed by a
 *   review entry.
 * - `evidence-refusal`: a native refusal whose refused source Mermaid's detector does not
 *   recognise either, or that recorded no refused source. Closed only by better evidence;
 *   it may legitimately stay unassessed.
 *
 * Adapter limitations that match neither the collection nor the defect pattern are binding
 * or view work. */
import { outcomeKind } from './outcome-kinds.ts'

export const UNASSESSED_OWNERS = ['trident-binding', 'trident-collection', 'trident-defect', 'evidence-assessment', 'evidence-refusal'] as const
export type UnassessedOwner = (typeof UNASSESSED_OWNERS)[number]
/** Per owner, normalised reason -> callbacks. */
export type UnassessedBreakdown = Record<UnassessedOwner, Record<string, number>>

export const UNASSESSED_OWNER_LABELS: Record<UnassessedOwner, { owner: string; title: string; closedBy: string }> = {
  'trident-binding': { owner: 'Trident', title: 'binding or view', closedBy: 'a reviewed Trident binding or view that reads what the candidate exposes' },
  'trident-collection': { owner: 'Trident', title: 'file did not load', closedBy: "fixing the setup binding that stopped the candidate's test file loading (the file's reason is in the row's missingFiles)" },
  'trident-defect': { owner: 'Trident', title: 'defect', closedBy: 'fixing the Trident error' },
  'evidence-assessment': { owner: 'Evidence', title: 'unreviewed assessment', closedBy: 'a review entry that confirms or disproves the capability assessment' },
  'evidence-refusal': { owner: 'Evidence', title: 'unrecognised refusal', closedBy: "better evidence only. Mermaid's detector does not recognise the refused source either, or no refused source was recorded, so the callback may legitimately stay unassessed" },
}

/** The reason tables' form: first line, numbers as N, at most 160 characters. */
export const normaliseReason = (reason: string) => reason.trim().split('\n')[0]!.replace(/\d+/g, 'N').slice(0, 160)

export const NOT_COLLECTED = 'Candidate test not collected'
const TRIDENT_ERROR = /^Trident error:/

/** The owner of one unassessed callback ({status, reason, unsupportedKind?}): one that is
 * unsupported or trident-blocked and that evidence did not turn into a known nonpass. */
export function unassessedOwner(row: { status: string; reason?: unknown; unsupportedKind?: any }): UnassessedOwner {
  switch (outcomeKind(row)) {
    case 'adapter-limitation': {
      const reason = String(row.reason ?? '').trim()
      if (reason === NOT_COLLECTED) return 'trident-collection'
      if (TRIDENT_ERROR.test(reason)) return 'trident-defect'
      return 'trident-binding'
    }
    case 'native-unsupported': return 'evidence-refusal'
    case 'capability-assessment': return 'evidence-assessment'
    default: throw Error('Only an unsupported or trident-blocked callback can be unassessed, not ' + row.status)
  }
}

export const emptyUnassessedBreakdown = (): UnassessedBreakdown => Object.fromEntries(UNASSESSED_OWNERS.map(owner => [owner, {}])) as UnassessedBreakdown

/** Callbacks per owner, and in all. */
export function unassessedTotals(breakdown: UnassessedBreakdown) {
  const owners = Object.fromEntries(UNASSESSED_OWNERS.map(owner => [owner, Object.values(breakdown[owner] ?? {}).reduce((sum, n) => sum + n, 0)])) as Record<UnassessedOwner, number>
  return { owners, total: Object.values(owners).reduce((sum, n) => sum + n, 0) }
}
