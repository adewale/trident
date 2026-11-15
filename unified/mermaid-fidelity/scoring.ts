/** How a Mermaid Fidelity result is scored, separately from how it was observed.
 *
 * Result files keep every callback's raw disposition as observed (passed, failed,
 * unsupported, trident-blocked, ...). Scoring reads those dispositions under one of three
 * recorded definitions:
 *
 * - `fidelity-scored-population-v3` (current): Fidelity measures a candidate's public
 *   parse contract, source text in and parsed model out. The scored population is the v2
 *   population minus every callback that tests Mermaid's internals: one that, for any
 *   candidate, called, spied on or inspected Mermaid's database API, relied on the parser
 *   -> database call protocol, used a Mermaid helper or module export, depended on host
 *   configuration supplied outside the source, read a renderer or styles, or asked for
 *   Mermaid's own detection pipeline (runtime.ts records these surfaces where the binding
 *   is reached, whichever candidate runs); one whose file no candidate can load because
 *   it imports a Mermaid internal at setup; and one that exercised no candidate operation
 *   for any candidate. Those callbacks are inventory. Known nonpasses are assertion
 *   failures and candidate faults, native refusals of sources Mermaid recognises as
 *   diagrams (the pinned oracle accepts them, or its detector classifies them before it
 *   rejects the content: the candidate did not recognise what Mermaid recognises), and capability assessments
 *   a recorded review confirmed. Unverified refusals, unconfirmed assessments and missing
 *   Trident bindings stay unassessed.
 * - `fidelity-scored-population-v2`: the scored population is the
 *   reference-qualified callbacks whose file is under `packages/mermaid/src/diagrams/`
 *   or `packages/parser/`. Other qualified callbacks (rendering utilities, Mermaid's
 *   website and docs specs, top-level modules) are inventory: executed and shown in the
 *   coverage report, not scored. Only an assertion or candidate fault is a known nonpass;
 *   an operation the candidate's side reports as unsupported is unassessed, like a
 *   missing Trident binding, because no per-assertion review has separated the
 *   candidate's real limits from Trident binding gaps for every candidate. Result rows
 *   record which unsupported verdicts the candidate's own code reported and which are
 *   Trident's capability assessments (outcome-kinds.ts); both stay unassessed here.
 * - legacy (results published before v2, which record no `scoring`): every
 *   reference-qualified callback is scored and an unsupported operation is a known
 *   nonpass. Those results are read under the definition they were published with.
 *
 * A project whose Fidelity is not applicable (no public parse interface) has no row in
 * the ranking and no Fidelity component in the synthesis. */
import { assessmentBasis } from './outcome-kinds.ts'
import { unsupportedVerdicts } from './verification.ts'

export const FIDELITY_SCORING_PROTOCOL = 'fidelity-scored-population-v3'
const FIDELITY_SCORING_PROTOCOL_V2 = 'fidelity-scored-population-v2'
/** Mermaid surfaces besides parse-and-read (runtime.ts Surface) that put a callback out of scope. */
export const FIDELITY_SCOPED_SURFACES = ['database-api', 'parser-protocol', 'helper-import', 'host-config', 'renderer', 'pipeline'] as const
/** Why a callback of the scored areas is not in the v3 scored population. */
export type ScopeReason = (typeof FIDELITY_SCOPED_SURFACES)[number] | 'internal-import-at-setup' | 'no-candidate-operation'
export const FIDELITY_SCORED_AREAS = ['packages/mermaid/src/diagrams/', 'packages/parser/'] as const
export const FIDELITY_RAW_STATUSES = ['passed', 'failed', 'unsupported', 'trident-blocked', 'reference-unqualified', 'upstream-skipped', 'upstream-expected-failure'] as const
/** Dispositions a reference-qualified callback can take for a candidate. */
export const FIDELITY_QUALIFIED_STATUSES = ['passed', 'failed', 'unsupported', 'trident-blocked'] as const
export type ScoredCounts = Record<(typeof FIDELITY_QUALIFIED_STATUSES)[number], number>

export const fidelityScoringDefinition = {
  protocol: FIDELITY_SCORING_PROTOCOL,
  scoredAreas: [...FIDELITY_SCORED_AREAS],
  scope: 'public parse contract: callbacks that test Mermaid internals are inventory',
  scopedOut: [...FIDELITY_SCOPED_SURFACES, 'internal-import-at-setup', 'no-candidate-operation'],
  knownNonpass: ['failed', 'verified-refusal', 'confirmed-absence'],
  unassessed: ['unsupported', 'trident-blocked'],
} as const

/** A file every candidate failed to load because the file imports a Mermaid internal at
 * setup: the deferred export of a relative module (runtime.ts boundModule), a constructed
 * one, or an unbound namespace read. A database getter (`radar.db.getDiagramTitle`) is a
 * model read, not an internal. */
const INTERNAL_IMPORT_AT_SETUP = /^TRIDENT_ADAPTER_GAP: (?:(?:new )?\.{1,2}\/|Unavailable namespace export read during setup|Native module namespace is not bound)/

/** Capability-assessment bases that state the test reads a Mermaid internal: a field
 * Mermaid's renderer decides, or Mermaid's own detection pipeline (outcome-kinds.ts).
 * Views report these, so the runtime's binding layer does not record them as surfaces. */
const INTERNAL_BASES: Record<string, ScopeReason> = { 'renderer-layout': 'renderer', 'mermaid-pipeline': 'pipeline' }

/** Each case's identity within its file (file + ordinal among the file's callbacks), which
 * separate runs keep even when they complete files in another order. */
export function callbackKeys(cases: readonly { file: string }[]) {
  const seen = new Map<string, number>()
  return cases.map(c => { const n = seen.get(c.file) ?? 0; seen.set(c.file, n + 1); return c.file + '\u0000' + n })
}

/** Which reference callbacks of the scored areas are out of the v3 scope, and why, keyed
 * by callbackKeys. A surface recorded for any candidate puts the callback out of scope for
 * all: the same test code reaches the same Mermaid surface, and a candidate that stops
 * earlier records less. */
export function fidelityScope(referenceCases: readonly { file: string; status: string }[], candidates: readonly { cases: readonly any[]; missingFiles?: readonly { path: string; reason: string }[] }[]) {
  const out = new Map<string, ScopeReason[]>()
  const missing = candidates.map(row => new Map((row.missingFiles ?? []).map(entry => [entry.path, entry.reason])))
  const setupInternal = new Set<string>()
  for (const path of new Set(referenceCases.map(c => c.file)))
    if (candidates.length && missing.every(files => INTERNAL_IMPORT_AT_SETUP.test(files.get(path) ?? ''))) setupInternal.add(path)
  const byKey = candidates.map(row => { const keys = callbackKeys(row.cases); return new Map(keys.map((key, i) => [key, row.cases[i]])) })
  const referenceKeys = callbackKeys(referenceCases)
  referenceCases.forEach((control, index) => {
    if (control.status !== 'passed' || !isScoredFidelityFile(control.file)) return
    const key = referenceKeys[index]!, observations = byKey.map(cases => cases.get(key))
    const reasons = new Set<ScopeReason>()
    for (const c of observations) {
      for (const surface of c?.surfaces ?? []) if ((FIDELITY_SCOPED_SURFACES as readonly string[]).includes(surface)) reasons.add(surface)
      if (c?.status === 'unsupported' && c.unsupportedKind !== 'native') for (const verdict of unsupportedVerdicts(c)) { const internal = INTERNAL_BASES[assessmentBasis(verdict)]; if (internal) reasons.add(internal) }
    }
    if (setupInternal.has(control.file)) reasons.add('internal-import-at-setup')
    if (!reasons.size && observations.length && observations.every(c => c && c.calls === 0 && !['passed', 'failed', 'unsupported'].includes(c.status))) reasons.add('no-candidate-operation')
    if (reasons.size) out.set(key, [...reasons].sort())
  })
  return out
}

/** Whether an upstream test file (a path relative to the Mermaid checkout) is scored. */
export function isScoredFidelityFile(file: string) {
  const path = file.replaceAll('\\', '/')
  return FIDELITY_SCORED_AREAS.some(prefix => path.startsWith(prefix))
}

/** Raw dispositions of the scored population. A qualified disposition only ever
 * follows a passing reference control, so a candidate's cases alone identify it. */
export function scoredFidelityCounts(cases: readonly { file: string; status: string }[]): ScoredCounts {
  const counts: ScoredCounts = { passed: 0, failed: 0, unsupported: 0, 'trident-blocked': 0 }
  for (const c of cases) if (isScoredFidelityFile(c.file) && (FIDELITY_QUALIFIED_STATUSES as readonly string[]).includes(c.status)) counts[c.status as keyof ScoredCounts]++
  return counts
}

/** The scored and inventory sizes from the reference control's own cases. */
export function fidelityPopulationSizes(referenceCases: readonly { file: string; status: string }[]) {
  const qualified = referenceCases.filter(c => c.status === 'passed')
  const scoredPopulation = qualified.filter(c => isScoredFidelityFile(c.file)).length
  return { referenceQualifiedCallbacks: qualified.length, scoredPopulation, inventoryCallbacks: qualified.length - scoredPopulation }
}

/** A project's catalog entry declares Fidelity not applicable, with its reason. */
export function fidelityNotApplicableReason(node: any): string | undefined {
  const reason = node?.benchmark?.notApplicable?.fidelity
  if (reason === undefined) return undefined
  if (typeof reason !== 'string' || !reason.trim()) throw Error('A not-applicable Fidelity declaration needs a reason: ' + node?.id)
  return reason
}

export interface FidelityScore {
  /** Verified passes. */
  passed: number
  /** Known nonpasses: assertion failures and candidate faults; in v3 also verified refusals
   * and confirmed absences; in legacy results, unsupported operations. */
  nonpasses: number
  /** v3: native refusals of sources Mermaid recognises as diagrams (verification.ts). */
  verifiedRefusals: number
  /** v3: capability assessments a recorded review confirmed. */
  confirmedAbsences: number
  /** Callbacks that could still pass or fail once assessed. */
  unassessed: number
  failed: number
  unsupported: number
  tridentBlocked: number
}

/** One reading of a Fidelity result file for tables and the synthesis. */
export function fidelityScoring(fidelity: any, catalog?: any) {
  const protocol = fidelity.scoring?.protocol, v3 = protocol === FIDELITY_SCORING_PROTOCOL
  const current = v3 || protocol === FIDELITY_SCORING_PROTOCOL_V2
  if (fidelity.scoring !== undefined && !current) throw Error('Unknown Fidelity scoring protocol: ' + JSON.stringify(fidelity.scoring?.protocol))
  const population = current ? fidelity.scoredPopulation : fidelity.referenceQualifiedCallbacks
  if (!Number.isInteger(population) || population <= 0) throw Error(current ? 'Fidelity needs a positive scored population' : 'Fidelity needs a positive reference-qualified population')
  const notApplicable = new Map<string, string>()
  for (const row of fidelity.notApplicable ?? []) notApplicable.set(row.project, row.reason)
  for (const node of catalog?.nodes ?? []) {
    const reason = fidelityNotApplicableReason(node)
    if (reason && !notApplicable.has(node.id)) notApplicable.set(node.id, reason)
  }
  const score = (row: any): FidelityScore => {
    const c = current ? row.scored : row.counts
    if (!c) throw Error('Fidelity row has no scored counts: ' + row.project)
    const failed = c.failed, unsupported = c.unsupported, tridentBlocked = c['trident-blocked'], passed = c.passed
    if (![passed, failed, unsupported, tridentBlocked].every(n => Number.isInteger(n) && n >= 0)) throw Error('Invalid Fidelity counts for ' + row.project)
    if (passed + failed + unsupported + tridentBlocked !== population) throw Error(`Fidelity counts for ${row.project} cover ${passed + failed + unsupported + tridentBlocked} callbacks, not the ${population}-callback ${current ? 'scored' : 'qualified'} population`)
    if (v3) {
      const verifiedRefusals = row.known?.verifiedRefusals, confirmedAbsences = row.known?.confirmedAbsences
      if (![verifiedRefusals, confirmedAbsences].every(n => Number.isInteger(n) && n >= 0) || verifiedRefusals + confirmedAbsences > unsupported) throw Error('Fidelity row has no valid known-nonpass counts: ' + row.project)
      return { passed, nonpasses: failed + verifiedRefusals + confirmedAbsences, unassessed: unsupported - verifiedRefusals - confirmedAbsences + tridentBlocked, failed, unsupported, tridentBlocked, verifiedRefusals, confirmedAbsences }
    }
    return current
      ? { passed, nonpasses: failed, unassessed: unsupported + tridentBlocked, failed, unsupported, tridentBlocked, verifiedRefusals: 0, confirmedAbsences: 0 }
      : { passed, nonpasses: failed + unsupported, unassessed: tridentBlocked, failed, unsupported, tridentBlocked, verifiedRefusals: 0, confirmedAbsences: 0 }
  }
  const applicable = (fidelity.results ?? []).filter((row: any) => !notApplicable.has(row.project))
  return { current, v3, population, inventory: current ? fidelity.inventoryCallbacks : undefined, notApplicable, results: applicable, score }
}
