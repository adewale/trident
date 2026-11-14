/** How a Mermaid Fidelity result is scored, separately from how it was observed.
 *
 * Result files keep every callback's raw disposition as observed (passed, failed,
 * unsupported, trident-blocked, ...). Scoring reads those dispositions under one of two
 * recorded definitions:
 *
 * - `fidelity-scored-population-v2` (current): the scored population is the
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
export const FIDELITY_SCORING_PROTOCOL = 'fidelity-scored-population-v2'
export const FIDELITY_SCORED_AREAS = ['packages/mermaid/src/diagrams/', 'packages/parser/'] as const
export const FIDELITY_RAW_STATUSES = ['passed', 'failed', 'unsupported', 'trident-blocked', 'reference-unqualified', 'upstream-skipped', 'upstream-expected-failure'] as const
/** Dispositions a reference-qualified callback can take for a candidate. */
export const FIDELITY_QUALIFIED_STATUSES = ['passed', 'failed', 'unsupported', 'trident-blocked'] as const
export type ScoredCounts = Record<(typeof FIDELITY_QUALIFIED_STATUSES)[number], number>

export const fidelityScoringDefinition = {
  protocol: FIDELITY_SCORING_PROTOCOL,
  scoredAreas: [...FIDELITY_SCORED_AREAS],
  knownNonpass: ['failed'],
  unassessed: ['unsupported', 'trident-blocked'],
} as const

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
  /** Known nonpasses: assertion failures and candidate faults (and, in legacy results, unsupported operations). */
  nonpasses: number
  /** Callbacks that could still pass or fail once assessed. */
  unassessed: number
  failed: number
  unsupported: number
  tridentBlocked: number
}

/** One reading of a Fidelity result file for tables and the synthesis. */
export function fidelityScoring(fidelity: any, catalog?: any) {
  const current = fidelity.scoring?.protocol === FIDELITY_SCORING_PROTOCOL
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
    return current
      ? { passed, nonpasses: failed, unassessed: unsupported + tridentBlocked, failed, unsupported, tridentBlocked }
      : { passed, nonpasses: failed + unsupported, unassessed: tridentBlocked, failed, unsupported, tridentBlocked }
  }
  const applicable = (fidelity.results ?? []).filter((row: any) => !notApplicable.has(row.project))
  return { current, population, inventory: current ? fidelity.inventoryCallbacks : undefined, notApplicable, results: applicable, score }
}
