// Merge mermaid:fidelity output directories that share one control run into the
// published Fidelity result file. No tests are executed.
//
//   bun scripts/merge-fidelity-runs.ts --out FILE --catalog FROZEN_CATALOG [--blocked REASONS.json]
//     [--refusal-verification VERIFIED.json] [--assessment-reviews REVIEW.json,...] RUN_DIR...
//   bun scripts/merge-fidelity-runs.ts --out FILE --base PUBLISHED.json RUN_DIR...
//
// The first RUN_DIR must contain the Mermaid control; later directories must
// have been collected with --reuse-reference pointing at it (or contain it).
// With --base, only the projects in RUN_DIRs are replaced in a published result,
// and only when their control run is the one the published result was scored
// against (same pin, selection and reference outcomes, including callback ordinals).
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { callbackKeys, fidelityNotApplicableReason, fidelityPopulationSizes, fidelityScope, fidelityScoring, fidelityScoringDefinition, isScoredFidelityFile } from '../unified/mermaid-fidelity/scoring.ts'
import { assessmentBasis, OUTCOME_KINDS, outcomeKind, type OutcomeCounts } from '../unified/mermaid-fidelity/outcome-kinds.ts'
import { assessmentConfirmations, checkRefusalVerification, confirmedAbsence, verifiedRefusal, type AssessmentConfirmations, type RefusalVerification } from '../unified/mermaid-fidelity/verification.ts'
import { emptyUnassessedBreakdown, normaliseReason, unassessedOwner, unassessedTotals } from '../unified/mermaid-fidelity/unassessed.ts'

/** Identity of one control run: every reference callback and its outcome. */
export function referenceDigest(reference: any) {
  if (!reference?.cases?.length) throw Error('The Mermaid control row has no per-callback outcomes')
  const lines = reference.cases.map((c: any) => `${c.file}\u0000${c.name}\u0000${c.status}`).sort()
  return createHash('sha256').update(lines.join('\n')).digest('hex')
}

/** File completion order can vary; callback ordinals within a file identify
 * repeated titles and must retain the same reference qualification. */
function callbacksByFile(cases: any[]) {
  const files = new Map<string, any[]>()
  for (const callback of cases) {
    const callbacks = files.get(callback.file) ?? []
    callbacks.push(callback)
    files.set(callback.file, callbacks)
  }
  return files
}
function referenceFiles(reference: any) {
  return JSON.stringify([...callbacksByFile(reference.cases)].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([path, callbacks]) => [path, callbacks.map(callback => [callback.name, callback.status])]))
}

/** Replace the re-run projects of a published result; every other row is kept unchanged. */
export function mergeIntoPublished(published: any, runs: any[], extras: { catalog?: any; refusals?: RefusalVerification; reviews?: AssessmentConfirmations; evidence?: Record<string, unknown> } = {}) {
  if (!published.referenceDigest) throw Error('The published result records no control digest; merge a full campaign first')
  if (!published.referenceOrdinalDigest) throw Error('The published result records no ordinal control digest; merge a full campaign first')
  const fresh: any = mergeFidelityRuns(runs, extras)
  if (JSON.stringify(published.scoring) !== JSON.stringify(fresh.scoring)) throw Error('The published result was scored under a different Fidelity definition; merge a full campaign instead')
  for (const key of ['pin', 'selection', 'selectedFiles', 'referenceMode', 'controlIdentity', 'referenceVersion', 'expandedCallbacks', 'referenceQualifiedCallbacks', 'scoredPopulation', 'inventoryCallbacks', 'referenceDigest', 'referenceOrdinalDigest'])
    if (JSON.stringify(fresh[key]) !== JSON.stringify(published[key])) throw Error(`Re-run differs from the published result in ${key}; re-run against the published control`)
  const replaced = new Set(fresh.results.map((r: any) => r.project).concat(fresh.blocked.map((r: any) => r.project), fresh.notApplicable.map((r: any) => r.project)).filter((p: string) => p !== "mermaid-js/mermaid"))
  const keep = (row: any) => !replaced.has(row.project)
  const order = published.results.map((r: any) => r.project)
  const results = [...published.results.filter(keep), ...fresh.results.filter((r: any) => r.project !== 'mermaid-js/mermaid')].sort((a: any, b: any) => (order.indexOf(a.project) + 1 || Infinity) - (order.indexOf(b.project) + 1 || Infinity))
  // Aggregated old rows cannot reconstruct callback intersections after a
  // replacement. Keep totals; recompute the shared breakdown from full raw runs.
  const { coverage: _coverage, ...prior } = published
  const merged = {
    ...prior,
    blocked: [...published.blocked.filter(keep), ...fresh.blocked],
    notApplicable: [...(published.notApplicable ?? []).filter(keep), ...fresh.notApplicable],
    results,
    updatedAt: [published.updatedAt, fresh.updatedAt].sort().at(-1),
    collectedThrough: [published.collectedThrough, fresh.collectedThrough].sort().at(-1),
    partialReruns: [...(published.partialReruns ?? []), { projects: [...replaced].sort(), collectedThrough: fresh.collectedThrough }],
  }
  checkUnassessedBreakdowns(merged)
  return merged
}

export function mergeFidelityRuns(runs: any[], extras: { catalog?: any; blocked?: any[]; refusals?: RefusalVerification; reviews?: AssessmentConfirmations; evidence?: Record<string, unknown> } = {}) {
  if (!runs.length) throw Error('Supply at least one Fidelity run')
  const base = runs[0]
  for (const run of runs) if (run.pin !== base.pin || run.selectedFiles !== base.selectedFiles || run.selection !== base.selection || run.referenceMode !== base.referenceMode || run.controlIdentity !== base.controlIdentity) throw Error('Fidelity runs must share one pin and file selection, with the same executing control identity')
  const reference = base.results.find((row: any) => row.project === 'mermaid-js/mermaid')
  if (!reference) throw Error('Merged Fidelity runs have no Mermaid control')
  const digest = referenceDigest(reference)
  const files = referenceFiles(reference)
  // Fidelity applies only through a public parse interface: a project the catalog or a
  // run declares not applicable has no row, whatever an older run collected for it.
  const notApplicable = new Map<string, string>()
  for (const run of runs) for (const row of run.notApplicable ?? []) notApplicable.set(row.project, row.reason)
  for (const node of extras.catalog?.nodes ?? []) { const reason = fidelityNotApplicableReason(node); if (reason) notApplicable.set(node.id, reason) }
  const byProject = new Map<string, any>()
  for (const run of runs) {
    const control = run.results.find((row: any) => row.project === 'mermaid-js/mermaid')
    if (!control || control !== reference && (control.version !== reference.version || referenceDigest(control) !== digest)) throw Error('Fidelity runs must share one referenceDigest and reference version')
    if (control !== reference && referenceFiles(control) !== files) throw Error('Fidelity runs must preserve reference callback order within each file')
    for (const row of run.results) {
      if (notApplicable.has(row.project)) continue
      if (byProject.has(row.project)) {
        if (row.project !== 'mermaid-js/mermaid') throw Error('Duplicate Fidelity candidate ' + row.project)
        continue
      }
      byProject.set(row.project, { row, control })
    }
  }
  const sizes = fidelityPopulationSizes(reference.cases), qualified = sizes.referenceQualifiedCallbacks
  // The v3 scope: callbacks of the scored areas that test Mermaid internals are inventory.
  const candidateRows = [...byProject.values()].map(value => value.row).filter(row => row.project !== 'mermaid-js/mermaid')
  const scope = fidelityScope(reference.cases, candidateRows)
  const referenceKeys = callbackKeys(reference.cases)
  const inScopeKeys = new Set(referenceKeys.filter((key, index) => reference.cases[index].status === 'passed' && isScoredFidelityFile(reference.cases[index].file) && !scope.has(key)))
  const scoredPopulation = inScopeKeys.size
  const statuses = ['passed', 'failed', 'unsupported', 'trident-blocked', 'reference-unqualified', 'upstream-skipped', 'upstream-expected-failure']
  const results = [...byProject.values()].map(({ row, control: ownReference }) => {
    if (row.cases?.length !== ownReference.cases.length) throw Error(row.project + ' must account for every reference callback')
    const counts: Record<string, number> = Object.fromEntries(statuses.map(status => [status, 0]))
    const perFile = new Map<string, Record<string, number>>(), gapReasons: Record<string, number> = {}, unsupportedReasons: Record<string, number> = {}
    // Unsupported verdicts of the scored population by kind (outcome-kinds.ts): the
    // candidate's own refusal, or Trident's capability assessment by its basis.
    const nativeUnsupportedReasons: Record<string, number> = {}, assessmentReasons: Record<string, number> = {}, assessmentBases: Record<string, number> = {}
    const keys = callbackKeys(row.cases), zero = (): OutcomeCounts => Object.fromEntries(OUTCOME_KINDS.map(kind => [kind, 0])) as OutcomeCounts
    const scored = { passed: 0, failed: 0, unsupported: 0, 'trident-blocked': 0 }, known = { verifiedRefusals: 0, confirmedAbsences: 0 }, outcomeKinds = { scored: zero(), qualified: zero() }
    const scoredPerFile = new Map<string, { passed: number; nonpass: number; unassessed: number }>()
    // Each unassessed in-scope callback by who can close it (unassessed.ts) and its reason.
    const unassessedReasons = emptyUnassessedBreakdown()
    for (const [index, c] of row.cases.entries()) {
      const control = ownReference.cases[index]
      if (c.file !== control.file || c.name !== control.name || !statuses.includes(c.status) || (control.status === 'passed' ? !statuses.slice(0, 4).includes(c.status) : c.status !== control.status)) throw Error(row.project + ' differs from its reference callback population')
      counts[c.status]!++
      const inScope = inScopeKeys.has(keys[index]!), kind = outcomeKind(c)
      if (kind) outcomeKinds.qualified[kind]++
      if (inScope && kind) {
        outcomeKinds.scored[kind]++
        scored[c.status as keyof typeof scored]++
        const refusal = verifiedRefusal(c, extras.refusals), absence = confirmedAbsence(row.project, c, extras.reviews)
        if (refusal) known.verifiedRefusals++
        if (absence) known.confirmedAbsences++
        const file = scoredPerFile.get(c.file) ?? { passed: 0, nonpass: 0, unassessed: 0 }
        if (c.status === 'passed') file.passed++
        else if (c.status === 'failed' || refusal || absence) file.nonpass++
        else {
          file.unassessed++
          const owner = unassessedOwner(c), reason = normaliseReason(String(c.reason ?? c.status))
          unassessedReasons[owner][reason] = (unassessedReasons[owner][reason] ?? 0) + 1
        }
        scoredPerFile.set(c.file, file)
      }
      const fileCounts = perFile.get(c.file) ?? {}
      fileCounts[c.status] = (fileCounts[c.status] ?? 0) + 1
      perFile.set(c.file, fileCounts)
      if (c.status === 'trident-blocked') {
        if (typeof c.reason !== 'string' || !c.reason.trim()) throw Error(row.project + ' has an unassessed callback without a reason: ' + c.file + ' ' + c.name)
        const reason = normaliseReason(c.reason)
        gapReasons[reason] = (gapReasons[reason] ?? 0) + 1
      }
      // Unreviewed unsupported verdicts are unassessed in scoring; keep their reasons beside the gaps.
      if (c.status === 'unsupported' && inScope) {
        const reason = normaliseReason(String(c.reason ?? 'unsupported'))
        unsupportedReasons[reason] = (unsupportedReasons[reason] ?? 0) + 1
        if (outcomeKind(c) === 'native-unsupported') nativeUnsupportedReasons[reason] = (nativeUnsupportedReasons[reason] ?? 0) + 1
        else {
          assessmentReasons[reason] = (assessmentReasons[reason] ?? 0) + 1
          const basis = assessmentBasis(String(c.reason ?? ''))
          assessmentBases[basis] = (assessmentBases[basis] ?? 0) + 1
        }
      }
    }
    if (Object.values(scored).reduce((sum, n) => sum + n, 0) !== scoredPopulation) throw Error(row.project + ' does not account for the scored population')
    const shared = row.sharedParserWith ? { sharedParserWith: row.sharedParserWith, parserVersion: row.parserVersion } : {}
    // Outcome kinds over the scored population and all qualified callbacks: what the
    // candidate's own code decided against what Trident assessed or could not bind.
    return { project: row.project, version: row.version, ...(row.revision ? { revision: row.revision } : {}), ...shared, counts, scored, known, outcomeKinds, environments: row.environments, missingFiles: row.missingFiles, perFile: [...perFile].map(([path, counts]) => ({ path, counts, ...(scoredPerFile.has(path) ? { scored: scoredPerFile.get(path) } : {}) })), gapReasons, unsupportedReasons, nativeUnsupportedReasons, assessmentReasons, assessmentBases, unassessed: unassessedReasons }
  })
  for (const row of results) if (row.sharedParserWith) {
    const owner = results.find(other => other.project === row.sharedParserWith)
    if (owner && owner.version !== row.parserVersion) throw Error(`${row.project} records ${row.sharedParserWith}'s parser ${row.parserVersion}, but that row measured ${owner.version}`)
  }
  // A candidate with no assessed callback in the scored population has no working
  // operation binding: report it as unassessed with its dominant gap, not a measured zero.
  const unbound = results.filter(r => r.project !== 'mermaid-js/mermaid' && r.scored.passed + r.scored.failed === 0)
  const scored = results.filter(r => !unbound.includes(r))
  const candidates = [...byProject.values()].map(value => value.row).filter(row => row.project !== 'mermaid-js/mermaid')
  // Callbacks of the scored population that no candidate's observation assessed.
  const unassessed = (project: string, c: any) => (c.status === 'unsupported' || c.status === 'trident-blocked') && !verifiedRefusal(c, extras.refusals) && !confirmedAbsence(project, c, extras.reviews)
  const sharedByFile = new Map<string, { path: string; unassessed: number; uncollected: number }>()
  const candidateFiles = candidates.map(row => ({ project: row.project, files: callbacksByFile(row.cases) }))
  for (const [path, callbacks] of callbacksByFile(reference.cases)) for (const [ordinal, callback] of callbacks.entries()) {
    const observations = candidateFiles.map(({ project, files }) => ({ project, c: files.get(path)![ordinal] }))
    if (callback.status !== 'passed' || !inScopeKeys.has(path + '\u0000' + ordinal) || !observations.length || !observations.every(({ project, c }) => unassessed(project, c))) continue
    const ownObservations = observations.map(({ c }) => c)
    const file = sharedByFile.get(path) ?? { path, unassessed: 0, uncollected: 0 }
    file.unassessed++
    if (ownObservations.every(observation => observation.reason === 'Candidate test not collected')) file.uncollected++
    sharedByFile.set(path, file)
  }
  const commonUnassessedCallbacks = [...sharedByFile.values()].reduce((sum, file) => sum + file.unassessed, 0)
  const commonUncollectedCallbacks = [...sharedByFile.values()].reduce((sum, file) => sum + file.uncollected, 0)
  const coverage = { candidates: candidates.length, commonUnassessedCallbacks, commonUncollectedCallbacks,
    additionalGapObservations: results.filter(row => row.project !== 'mermaid-js/mermaid').reduce((sum, row) => sum + row.scored.unsupported + row.scored['trident-blocked'] - row.known.verifiedRefusals - row.known.confirmedAbsences, 0) - commonUnassessedCallbacks * candidates.length,
    perFile: [...sharedByFile.values()].sort((a, b) => a.path.localeCompare(b.path)) }
  const measured = new Set(scored.map(r => r.project))
  const dominant = (r: any) => Object.entries(r.gapReasons as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'no callback reached a candidate operation'
  const blocked = [...unbound.map(r => ({ project: r.project, reason: 'No original test reached a candidate operation: ' + dominant(r) })), ...runs.flatMap(run => run.blocked ?? []), ...(extras.blocked ?? [])].filter((row, index, all) => !measured.has(row.project) && !notApplicable.has(row.project) && all.findIndex(other => other.project === row.project) === index)
  const expanded = reference.cases.length
  const merged = {
    benchmark: 'Mermaid Fidelity',
    referenceMode: base.referenceMode,
    controlIdentity: base.controlIdentity,
    pin: base.pin,
    selection: base.selection,
    inventory: base.inventory,
    selectedFiles: base.selectedFiles,
    outsideSelectedRunner: base.outsideSelectedRunner,
    blocked,
    versionsFrozenAt: extras.catalog?.benchmarkVersionsCheckedAt ?? base.versionsFrozenAt,
    scope: `Every candidate attempted all ${base.selectedFiles} selected core-package files against one shared Mermaid ${reference.version} control run. The control passes ${qualified} expanded callbacks. ${sizes.scoredPopulation} are in ${fidelityScoringDefinition.scoredAreas.join(' and ')}; ${sizes.scoredPopulation - scoredPopulation} of those test Mermaid internals, so scores use the other ${scoredPopulation}, and the remaining ${qualified - scoredPopulation} are inventory. A native refusal of a source the pinned Mermaid oracle accepts, and a capability assessment a recorded review confirmed, are known nonpasses; other unsupported verdicts and missing Trident bindings are unassessed.`,
    scoring: fidelityScoringDefinition,
    referenceVersion: reference.version,
    expandedCallbacks: expanded,
    referenceQualifiedCallbacks: qualified,
    scoredPopulation,
    inventoryCallbacks: qualified - scoredPopulation,
    scopedOut: { areaCallbacks: sizes.scoredPopulation, internals: sizes.scoredPopulation - scoredPopulation, bySurface: Object.fromEntries([...fidelityScoringDefinition.scopedOut].map(reason => [reason, [...scope.values()].filter(reasons => reasons.includes(reason as any)).length])), byFile: Object.entries([...scope.keys()].reduce((acc: Record<string, number>, key) => { const path = key.split('\u0000')[0]!; acc[path] = (acc[path] ?? 0) + 1; return acc }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([path, callbacks]) => ({ path, callbacks })) },
    ...(extras.evidence ? { verification: extras.evidence } : {}),
    notApplicable: [...notApplicable].map(([project, reason]) => ({ project, reason })).sort((a, b) => a.project.localeCompare(b.project)),
    referenceDigest: digest,
    referenceOrdinalDigest: createHash('sha256').update(files).digest('hex'),
    coverage,
    results: scored,
    updatedAt: runs.map(run => run.updatedAt).sort().at(-1),
    collectedThrough: runs.map(run => run.collectedThrough).sort().at(-1),
  }
  checkUnassessedBreakdowns(merged)
  return merged
}

/** Every row's owner breakdown accounts for exactly the callbacks scoring calls unassessed. */
export function checkUnassessedBreakdowns(fidelity: any) {
  const scoring = fidelityScoring(fidelity)
  for (const row of scoring.results) {
    if (!row.unassessed) continue
    const total = unassessedTotals(row.unassessed).total, expected = scoring.score(row).unassessed
    if (total !== expected) throw Error(`${row.project}'s unassessed breakdown covers ${total} callbacks, not the ${expected} scoring leaves unassessed`)
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2), take = (flag: string) => { const i = args.indexOf(flag); if (i < 0) return undefined; const [, value] = args.splice(i, 2); return value }
  const out = take('--out'), catalogFile = take('--catalog'), blockedFile = take('--blocked'), baseFile = take('--base'), refusalFile = take('--refusal-verification'), reviewFiles = take('--assessment-reviews')
  if (!out || !args.length) throw Error('merge-fidelity-runs --out FILE [--catalog FROZEN_CATALOG] [--blocked UNMEASURED_REASONS.json] [--base PUBLISHED.json] RUN_DIR...')
  if (existsSync(out) && out !== baseFile) throw Error('Choose a fresh output file')
  const runs = args.map(dir => JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8')))
  const catalog = catalogFile ? JSON.parse(readFileSync(catalogFile, 'utf8')) : undefined
  const blocked = blockedFile ? JSON.parse(readFileSync(blockedFile, 'utf8')) : undefined
  const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
  const refusals = refusalFile ? checkRefusalVerification(JSON.parse(readFileSync(refusalFile, 'utf8'))) : undefined
  const reviewPaths = reviewFiles ? reviewFiles.split(',') : []
  const reviews = reviewPaths.length ? assessmentConfirmations(reviewPaths.map(path => JSON.parse(readFileSync(path, 'utf8')))) : undefined
  // Which evidence made unsupported verdicts known nonpasses, by path and digest.
  const evidence = refusalFile || reviewPaths.length ? { refusals: refusalFile ? { path: refusalFile, sha256: sha(refusalFile) } : null, assessmentReviews: reviewPaths.map(path => ({ path, sha256: sha(path) })) } : undefined
  const merged = baseFile ? mergeIntoPublished(JSON.parse(readFileSync(baseFile, 'utf8')), runs, { catalog, refusals, reviews, evidence }) : mergeFidelityRuns(runs, { catalog, blocked, refusals, reviews, evidence })
  writeFileSync(out, JSON.stringify(merged, null, 2) + '\n')
}
