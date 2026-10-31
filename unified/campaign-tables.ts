import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { campaignResults, campaignProjectId, campaignArtifactRole, type CampaignEnvelope } from './campaign-publication.ts'
import type { SnapshotTable } from './results-snapshot.ts'
import type { PublicSuite } from './support.ts'
import { summarizeSvgCases } from '../fidelity/svg-assessment.ts'

const measuredAt = (rows: any[], fallback: string): string => rows.map(row => row.metrics?.measuredAt).filter((value): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? fallback
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
/** Tables are reductions of owning observations, with interfaces and observed
 * populations separated. No hand-transcribed numbers or pooled overall score. */
export function campaignTables(report: CampaignEnvelope, receipt: SnapshotTable['receipt']): SnapshotTable[] {
  const projectId = (value: unknown) => campaignProjectId(value, report.projects ?? [])
  const artifactRole = campaignArtifactRole(report), candidate = artifactRole === 'candidate'
  const tables = new Map<string, SnapshotTable>()
  const add = (key: unknown[], suite: PublicSuite, measuredAt: string, caption: string, columns: string[], project: string, values: (string | number)[], ranking: SnapshotTable['ranking'], extra: Partial<SnapshotTable> = {}, unrankedReason?: string) => {
    const id = 'run-' + hash([receipt.sha256, ...key]).slice(0, 24)
    const entry = tables.get(id) ?? { id, suite, measuredAt, campaignUpdatedAt: report.updatedAt, historical: (report as any).schema !== 'trident-campaign-v2', unit: 'observations', caption, columns, rows: [], receipt, ranking, ...(artifactRole ? { artifactRole } : {}), ...extra }
    if (entry.rows.some(row => row.project === project)) throw Error('Duplicate project in reduced campaign cohort')
    if (Date.parse(measuredAt) > Date.parse(entry.measuredAt)) entry.measuredAt = measuredAt
    entry.rows.push({ project, values, ...(unrankedReason ? { unrankedReason } : {}) }); tables.set(id, entry)
  }
  for (const boundary of report.results) {
    if (!boundary.out) continue
    const cohort = (boundary as typeof boundary & { cohort?: string }).cohort ?? 'core'
    if (boundary.suite === 'portable') {
      const file = join(boundary.out, 'report.json')
      if (!existsSync(file)) continue
      const result = readBenchmarkDocument(file) as any
      if (!result.summary?.timing || !result.version || !result.finishedAt) continue
      const cases = result.summary.cases as any[]
      if (Array.isArray(cases) && cases.every(row => typeof row.expectedAccepted === 'boolean')) {
        if (new Set(cases.map(row => row.id)).size !== cases.length) throw Error('Portable case inventory is duplicated')
        const positive = cases.filter(row => row.expectedAccepted), negative = cases.filter(row => !row.expectedAccepted)
        const admitted = positive.filter(row => row.outputAdmission === 'passed').length
        const unsupported = positive.filter(row => row.outputAdmission !== 'passed' && row.unsupported).length
        const failed = positive.filter(row => row.outputAdmission !== 'passed' && !row.unsupported && (row.failedWorkers > 0 || row.outputAdmission === 'failed')).length
        const blocked = positive.filter(row => row.outputAdmission !== 'passed' && !row.unsupported && !row.failedWorkers && row.outputAdmission !== 'failed' && row.blockedWorkers > 0).length
        add(['portable-admission', cohort, result.protocol, result.sampling, hash(cases.map(row => [row.id, row.expectedAccepted]))], 'portable', result.finishedAt,
          'Public Node SVG output admission on the same planned cases and sampling. Invalid rejection and declared semantics remain separate from SVG return; no overall quality score is inferred.',
          ['Version', 'Admitted', 'Failed', 'Unsupported', 'Blocked', 'Unmeasured', 'Planned positive', 'Invalid rejected', 'Planned invalid', 'Declared semantics complete', 'Measured'], result.project,
          [result.version, admitted, failed, unsupported, blocked, positive.length - admitted - failed - unsupported - blocked, positive.length,
            negative.filter(row => row.acceptanceMatches && !row.failedWorkers && !row.blockedWorkers).length, negative.length, positive.filter(row => row.semanticComplete).length, result.finishedAt],
          { column: 'Admitted', denominator: 'Planned positive', direction: 'descending' },
          { unit: 'cases', population: { total: 'Planned positive', outcomes: ['Admitted', 'Failed', 'Unsupported', 'Blocked', 'Unmeasured'] } })
      }
      for (const row of result.summary.timing) {
        if (!row.expectedAccepted) continue
        const qualified = row.outputAdmissionComplete && row.outputCalibration?.status === 'calibrated'
        add(['portable', cohort, row.caseId, row.track, result.protocol, result.sampling], 'portable', result.finishedAt,
          `${row.caseId}; ${row.track}. ${row.scope} SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.`,
          ['Version', 'Median ms', 'Samples', 'Declared semantics', 'Output calibration', 'Measured'], result.project,
          [result.version, qualified && Number.isFinite(row.medianMs) ? row.medianMs : 'withheld', row.samples, row.semanticComplete ? 'complete for this case' : 'partial', row.outputCalibration?.status ?? 'unavailable', result.finishedAt],
          { column: 'Median ms', direction: 'ascending' }, { unit: 'ms' })
      }
      continue
    }
    const results = campaignResults(boundary)
    for (const result of results) {
      const terminal = (result as any).terminalAssessments, terminalProfile = (result as any).terminalProfile
      if (boundary.suite === 'community' && Array.isArray(terminal)) {
        if (!terminalProfile?.id || !Array.isArray(terminalProfile.cases) || !terminalProfile.cases.length || !Array.isArray(terminalProfile.producers) || !terminalProfile.producers.length) throw Error('Terminal profile lacks source/observer identity')
        const allIds = terminalProfile.cases.map((input: any) => input.id), reviewedIds = terminalProfile.reviewedCaseIds
        if (new Set(allIds).size !== allIds.length || !Array.isArray(reviewedIds) || new Set(reviewedIds).size !== reviewedIds.length || reviewedIds.some((id: string) => !allIds.includes(id))) throw Error('Terminal profile has an invalid planned inventory')
        for (const [scope, assessments, planned] of [['full', terminal, allIds], ['reviewed', (result as any).terminalReviewedAssessments, reviewedIds]] as const) {
          if (!Array.isArray(assessments)) throw Error('Terminal result omitted a declared profile')
          for (const assessment of assessments) {
            const cases = assessment.cases
            if (!Array.isArray(cases) || JSON.stringify(cases.map((input: any) => input.caseId).sort()) !== JSON.stringify([...planned].sort()) || cases.some((input: any) => !['correct', 'incorrect', 'unsupported', 'unknown'].includes(input.status))) throw Error('Terminal verdicts omit or duplicate planned inputs')
            const project = projectId(assessment.project), count = (status: string) => cases.filter((input: any) => input.status === status).length, unknown = count('unknown')
            if (project === 'mermaid-js/mermaid') throw Error('Mermaid source reference cannot receive a terminal renderer score')
            const own = result.observations.filter(row => projectId(row.metrics?.project) === project && row.format === 'terminal' && row.operation === 'graph-correctness')
            add(['terminal-case-verdicts', cohort, scope, hash(terminalProfile)], 'community', measuredAt(own, result.finishedAt),
              (scope === 'full' ? 'Full planned terminal corpus, retaining unmeasured and unreviewed inputs.' : 'Independently reviewed drawing subset, ranked by verified correct count only. Unknown outcomes leave complete accuracy unresolved; this count rank cannot establish full-corpus correctness.') + ` Corpus: ${allIds.length} selected inputs from pinned terminal-project documentation, issues and PRs, without selection on renderer outcomes. Source/review hashes and all origins remain in the owning receipt. Full-inventory accuracy ranks are withheld for unknown work; reviewed-subset ranks order only verified counts. Mermaid source reference is unscored; no speed or aesthetics score.`,
              ['Version', 'Correct', 'Incorrect', 'Unsupported', 'Unknown', 'Planned', 'Measured'], project,
              [assessment.version, count('correct'), count('incorrect'), count('unsupported'), unknown, planned.length, measuredAt(own, result.finishedAt)],
              scope === 'reviewed' ? { column: 'Correct', direction: 'descending' } : { column: 'Correct', denominator: 'Planned', direction: 'descending' },
              { cohort, unit: 'terminal input cases', ...(scope === 'reviewed' ? { overview: { numerator: 'Correct', denominator: 'Planned', suffix: '' } } : {}), population: { total: 'Planned', outcomes: ['Correct', 'Incorrect', 'Unsupported', 'Unknown'] } }, !planned.length || scope === 'full' && unknown || scope === 'reviewed' && !count('correct') && !count('incorrect') && !count('unsupported') ? 'Terminal source/display/drawing evidence is incomplete' : undefined)
          }
        }
        continue
      }
      const svg = (result as any).svgAssessments
      if (boundary.suite === 'fidelity' && Array.isArray(svg)) {
        for (const assessment of svg) {
          const cases = assessment.cases
          if (!Array.isArray(cases) || new Set(cases.map(item => item.caseId)).size !== cases.length || cases.some(item => !['correct', 'incorrect', 'unsupported', 'unknown'].includes(item.status))) throw Error('SVG case assessment inventory is invalid')
          const selected = (result as any).selectedCaseIds
          if (!Array.isArray(selected) || JSON.stringify([...selected].sort()) !== JSON.stringify(cases.map(item => item.caseId).sort())) throw Error('SVG assessments omit a declared case')
          const summary = summarizeSvgCases(cases), project = projectId(assessment.project)
          const protocol = (result as any).criteriaProtocol
          const own = result.observations.filter(row => projectId(row.metrics?.project ?? row.metrics?.implementation) === project)
          add(['svg-case-verdicts', cohort, hash([...selected].sort()), hash(protocol ?? null)], 'fidelity', measuredAt(own, result.finishedAt),
            'Whole-diagram outcomes for the same authored case inventory and planned SVG checks. Public-model APIs confer no drawing credit. Unknown observations withhold a correctness rank; raw criterion evidence remains in the owning report.',
            ['Version', 'Correct', 'Incorrect', 'Unsupported', 'Unknown', 'Planned', 'Measured'], project,
            [assessment.version, summary.correct, summary.incorrect, summary.unsupported, summary.unknown, summary.planned, measuredAt(own, result.finishedAt)],
            { column: 'Correct', direction: 'descending' },
            { summary: true, unit: 'authored diagrams', overview: { numerator: 'Correct', denominator: 'Planned', suffix: '' }, population: { total: 'Planned', outcomes: ['Correct', 'Incorrect', 'Unsupported', 'Unknown'] } },
            summary.correct + summary.incorrect + summary.unsupported === 0 ? 'No verified SVG observations' : !protocol ? 'Observer protocol is unqualified' : undefined)
        }
        continue
      }
      if (boundary.suite === 'native-fidelity' && (result as any).criteriaProtocol?.mode === 'public-model-contracts-v2') {
        const protocol = (result as any).criteriaProtocol, planned = protocol.planned as { caseId: string; criterion: string; surface: string }[]
        if (!Array.isArray(planned) || !planned.length || planned.some(item => item.surface !== 'native-public-api')) throw Error('Public-model summary needs its complete native-only plan')
        const caseIds = [...new Set(planned.map(item => item.caseId))].sort()
        for (const project of new Set(result.observations.map(row => projectId(row.metrics?.implementation)))) {
          const own = result.observations.filter(row => projectId(row.metrics?.implementation) === project)
          let correct = 0, incorrect = 0, unknown = 0
          for (const caseId of caseIds) {
            const criteria = planned.filter(item => item.caseId === caseId), rows = own.filter(row => row.metrics?.authoredCase === caseId && row.surface === 'native-public-api')
            if (new Set(criteria.map(item => item.criterion)).size !== criteria.length || new Set(rows.map(row => row.operation)).size !== rows.length) throw Error('Duplicate public-model criterion')
            if (rows.some(row => row.status === 'failed')) incorrect++
            else if (criteria.every(item => rows.some(row => row.operation === item.criterion && row.status === 'passed'))) correct++
            else unknown++
          }
          const version = result.toolVersions?.find(row => projectId(row.tool) === project)?.version ?? 'unavailable'
          add(['public-model-contracts-v2', cohort, hash(protocol)], 'native-fidelity', measuredAt(own, result.finishedAt),
            'Corpus: the same AM/Trident-authored feature cases, evaluated through public Node models. One correct case requires every declared native criterion. Missing projections remain unknown. These are optional model contracts, not drawing accuracy, editor integration or an overall renderer score.',
            ['Version', 'Correct', 'Incorrect', 'Unknown', 'Planned', 'Measured'], project,
            [version, correct, incorrect, unknown, caseIds.length, measuredAt(own, result.finishedAt)], { column: 'Correct', direction: 'descending' },
            { summary: true, unit: 'public-model cases', overview: { numerator: 'Correct', denominator: 'Planned', suffix: '' }, population: { total: 'Planned', outcomes: ['Correct', 'Incorrect', 'Unknown'] } }, correct + incorrect === 0 ? 'No verified model observations' : undefined)
        }
        continue
      }
      if (boundary.suite === 'docs') {
        const file = join(boundary.out, 'inventory.json')
        if (!existsSync(file)) continue
        const inventory = JSON.parse(readFileSync(file, 'utf8'))
        if (!Array.isArray(inventory.cases) || new Set(inventory.cases.map((c: any) => c.id)).size !== inventory.cases.length) throw Error('Docs inventory IDs are missing or duplicated')
        const projects = new Set(result.observations.map(row => projectId(String(row.metrics?.project ?? row.metrics?.implementation ?? boundary.project))))
        for (const project of projects) {
          for (const format of [...new Set(result.observations.map(row => row.format ?? 'svg'))]) {
          const own = result.observations.filter(row => projectId(String(row.metrics?.project ?? row.metrics?.implementation ?? boundary.project)) === project && (row.format ?? 'svg') === format)
          if (!['svg', 'png'].includes(format)) throw Error('Unexpected documentation output format')
          if (!own.some(row => row.operation === 'render' || row.status === 'blocked')) continue
          const coordinates = new Set<string>(), byCase = new Map<string, typeof own>()
          for (const row of own.filter(row => row.operation === 'render')) {
            const coordinate = JSON.stringify([row.caseId, row.metrics?.round])
            if (coordinates.has(coordinate) || !Number.isInteger(row.metrics?.round) || Number(row.metrics?.round) < 1 || Number(row.metrics?.round) > report.rounds || !inventory.cases.some((c: any) => c.id === row.caseId)) throw Error('Docs observations do not match the declared inventory/rounds')
            coordinates.add(coordinate); byCase.set(row.caseId, [...(byCase.get(row.caseId) ?? []), row])
          }
          const counts = { passed: 0, failed: 0, unsupported: 0, blocked: 0, missing: 0, partial: 0 }
          for (const input of inventory.cases) {
            const observations = byCase.get(input.id) ?? []
            if (observations.length === report.rounds && observations.every(row => row.status === 'passed')) counts.passed++
            else if (observations.some(row => row.status === 'failed')) counts.failed++
            else if (observations.some(row => row.status === 'unsupported')) counts.unsupported++
            else if (observations.some(row => row.status === 'blocked') || own.some(row => row.operation === 'artifact-admission' && row.status === 'blocked')) counts.blocked++
            else if (observations.length) counts.partial++
            else counts.missing++
          }
          const completeRounds = Array.from({ length: report.rounds }, (_, index) => index + 1).filter(round => inventory.cases.every((input: any) => coordinates.has(JSON.stringify([input.id, round])))).length
          const incomplete = coordinates.size !== inventory.cases.length * report.rounds || counts.blocked > 0
          const unrankedReason = incomplete ? `${counts.blocked === inventory.cases.length ? 'blocked' : 'incomplete'} (${completeRounds}/${report.rounds} complete rounds)` : undefined
          const version = own.find(row => typeof row.metrics?.version === 'string')?.metrics?.version ?? result.toolVersions?.find(row => projectId(row.tool) === project)?.version ?? 'unavailable'
          const laneKey = format === 'svg' ? [] : ['png']
          const laneProtocol = inventory.protocol === 'public-docs-output-lanes-v2' ? (format === 'svg' ? 'public-docs-svg-return-v1' : 'public-docs-png-return-v2') : inventory.protocol ?? 'public-docs-svg-return-v1'
          add(['docs', ...laneKey, cohort, hash(inventory.cases), report.rounds], 'docs', measuredAt(own, result.finishedAt),
            `Corpus: Mermaid syntax documentation at ${inventory.pin?.commit ?? 'the owning inventory pin'}; ${inventory.cases.length} occurrences, retaining duplicates. ${format.toUpperCase()} output lane. Returned means the occurrence returned ${format.toUpperCase()} in all ${report.rounds} declared rounds. Failures and unexecuted work retain the full inventory. Output return does not certify drawing content.`,
            ['Version', 'Returned in all rounds', 'Failed', 'Unsupported', 'Blocked', 'Unexecuted', 'Partially observed', 'Planned', 'Measured'], project,
            [String(version), counts.passed, counts.failed, counts.unsupported, counts.blocked, counts.missing, counts.partial, inventory.cases.length, measuredAt(own, result.finishedAt)],
            { column: 'Returned in all rounds', denominator: 'Planned', direction: 'descending' },
            { outputFormat: format as 'svg' | 'png', comparisonKey: hash(['docs', ...laneKey, cohort, laneProtocol, inventory.pin ?? null, inventory.cases, report.rounds]), unit: 'documentation occurrences', population: { total: 'Planned', outcomes: ['Returned in all rounds', 'Failed', 'Unsupported', 'Blocked', 'Unexecuted', 'Partially observed'] }, ...(candidate ? { artifactRole: 'candidate' } : format === 'svg' ? { overview: { numerator: 'Returned in all rounds', denominator: 'Planned', suffix: '%' } } : {}) }, unrankedReason)
          const drawings = own.filter(row => row.operation === 'drawing-checks')
          if (drawings.length) {
            if (new Set(drawings.map(row => row.caseId)).size !== drawings.length || drawings.some(row => !inventory.cases.some((input: any) => input.id === row.caseId))) throw Error('Documentation drawing observations do not match the inventory')
            const correct = drawings.filter(row => row.status === 'passed').length, incorrect = drawings.filter(row => row.status === 'failed').length, notDrawing = drawings.filter(row => row.status === 'not-applicable').length
            const unknown = inventory.cases.length - correct - incorrect - notDrawing
            add(['docs-drawings', ...laneKey, cohort, hash(inventory.cases), hash(inventory.drawingReview ?? null), hash(inventory.producers ?? []), ...(format === 'png' ? [inventory.pngReviewSha256 ?? null] : [])], 'docs', measuredAt(drawings, result.finishedAt),
              `Corpus: the same pinned Mermaid documentation inventory. First-round actual ${format.toUpperCase()} witnesses checked against source expectations. ${format === 'svg' ? 'Shared SVG paint/meaning observer.' : 'PNG content reviews bind actual image, source and expected-fact hashes; SVG and nonblank checks supply no raster correctness credit.'} Rank counts verified correct drawings; unknown sources/observers remain visible, and full accuracy and speed are unqualified.`,
              ['Version', 'Correct', 'Incorrect', 'Unknown', 'Not a drawing', 'Planned', 'Measured'], project,
              [String(version), correct, incorrect, unknown, notDrawing, inventory.cases.length, measuredAt(drawings, result.finishedAt)],
              { column: 'Correct', direction: 'descending' },
              { outputFormat: format as 'svg' | 'png', unit: 'documentation occurrences', population: { total: 'Planned', outcomes: ['Correct', 'Incorrect', 'Unknown', 'Not a drawing'] } }, correct + incorrect === 0 ? 'No verified drawing-content observations' : undefined)
            const reviewedIds = new Set((inventory.drawingReview?.cases ?? []).filter((input: any) => input.intent === 'drawing').map((input: any) => input.id))
            if (reviewedIds.size) {
              const subset = drawings.filter(row => reviewedIds.has(row.caseId)), passed = subset.filter(row => row.status === 'passed').length, failed = subset.filter(row => row.status === 'failed').length, missing = reviewedIds.size - passed - failed
              add(['docs-reviewed-profile', ...laneKey, cohort, hash(inventory.drawingReview), hash(inventory.producers ?? []), ...(format === 'png' ? [inventory.pngReviewSha256 ?? null] : [])], 'docs', measuredAt(subset, result.finishedAt),
                `Corpus: reviewed ${reviewedIds.size}-occurrence subset of ${inventory.cases.length} Mermaid documentation occurrences, bound to exact source hashes; ${format.toUpperCase()} lane. This development-exposed profile ranks verified correct counts and keeps unresolved observations explicit. It supplies no full DaveBench accuracy, holdout or speed claim.`,
                ['Version', 'Correct', 'Incorrect', 'Unknown', 'Planned reviewed', 'Measured'], project,
                [String(version), passed, failed, missing, reviewedIds.size, measuredAt(subset, result.finishedAt)],
                { column: 'Correct', denominator: 'Planned reviewed', direction: 'descending' },
                { outputFormat: format as 'svg' | 'png', overview: { numerator: 'Correct', denominator: 'Planned reviewed', suffix: '' }, unit: 'reviewed documentation occurrences', population: { total: 'Planned reviewed', outcomes: ['Correct', 'Incorrect', 'Unknown'] } }, passed + failed === 0 ? 'No verified drawing-content observations' : undefined)
            }
          }
          }
        }
        continue
      }
      if (boundary.suite === 'community') {
        const qualified = new Map<string, typeof result.observations>()
        for (const row of result.observations.filter(row => row.operation === 'render' && row.mode === 'feature-corpus-qualification')) {
          const project = projectId(row.metrics?.implementation ?? row.metrics?.project)
          const key = JSON.stringify([project, row.format, row.metrics?.variant ?? 'default', row.surface, row.runtime])
          qualified.set(key, [...(qualified.get(key) ?? []), row])
        }
        for (const [key, observations] of qualified) {
          const [project, format, variant] = JSON.parse(key)
          const population = observations.map(row => JSON.stringify([row.caseId, row.metrics?.round ?? null])).sort()
          if (new Set(population).size !== population.length) throw Error('Duplicate compatibility qualification input')
          const count = (status: string) => observations.filter(row => row.status === status).length
          const version = observations.find(row => row.metrics?.version)?.metrics?.version ?? 'unavailable'
          add(['compatibility-inputs', cohort, format, variant, format === 'terminal' ? 'terminal-output-checks' : observations[0]!.surface, hash(population)], 'community', measuredAt(observations, result.finishedAt),
            `${cohort}; ${format} compatibility. The same recorded inputs are checked for output format and authored labels. Runtime boundaries are listed per row; this compares output checks, not speed or complete layout correctness.`,
            ['Version', 'Interface', 'Runtime', 'Passed', 'Failed', 'Unsupported', 'Blocked', 'Other', 'Planned inputs'], project,
            [String(version), observations[0]!.surface, observations[0]!.runtime, count('passed'), count('failed'), count('unsupported'), count('blocked'), observations.length - count('passed') - count('failed') - count('unsupported') - count('blocked'), observations.length],
            { column: 'Passed', denominator: 'Planned inputs', direction: 'descending' },
            { summary: true, unit: 'inputs', population: { total: 'Planned inputs', outcomes: ['Passed', 'Failed', 'Unsupported', 'Blocked', 'Other'] } })
        }
      }
      const groups = new Map<string, typeof result.observations>()
      for (const row of result.observations) {
        const project = projectId(String(row.metrics?.project ?? row.metrics?.implementation ?? boundary.project ?? 'unattributed'))
        if (project === 'unattributed') continue
        const surface = row.surface.startsWith(project + ':') ? row.surface.slice(project.length + 1) : row.surface
        const key = JSON.stringify([project, surface, row.runtime, row.format ?? '', row.operation ?? '', row.metrics?.variant ?? 'default'])
        groups.set(key, [...(groups.get(key) ?? []), row])
      }
      for (const [key, observations] of groups) {
        const [project, surface, runtime, format, operation, variant] = JSON.parse(key)
        // Equal recorded coordinates are necessary for comparing check counts.
        // Different projections or populations get their own cohort, never a rate
        // purporting to cover an inferred whole-diagram inventory.
        const population = observations.map(row => JSON.stringify([row.caseId, row.mode, row.metrics?.round ?? null])).sort()
        const counts = (status: string) => observations.filter(row => row.status === status).length
        const passed = counts('passed'), failed = counts('failed'), unsupported = counts('unsupported'), blocked = counts('blocked'), inapplicable = counts('not-applicable'), skipped = counts('skipped')
        const version = observations.find(row => typeof row.metrics?.version === 'string')?.metrics?.version ?? result.toolVersions?.find(row => projectId(row.tool) === project)?.version ?? 'unavailable'
        add([boundary.suite, cohort, result.id, surface, runtime, format, operation, variant, hash(population)], boundary.suite as PublicSuite, measuredAt(observations, result.finishedAt),
          `${cohort}; ${variant}; ${surface}; ${runtime}; ${format || 'no format'}; ${operation || 'declared checks'}. Compared rows have the same recorded check coordinates. Counts are observations, not inferred diagram passes or full-inventory coverage. Missing bindings remain in campaign attempts.`,
          ['Version', 'Passed', 'Failed', 'Unsupported', 'Blocked', 'Not applicable', 'Skipped', 'Unavailable', 'Recorded', 'Measured'], project,
          [String(version), passed, failed, unsupported, blocked, inapplicable, skipped, observations.length - passed - failed - unsupported - blocked - inapplicable - skipped, observations.length, measuredAt(observations, result.finishedAt)],
          { column: 'Passed', direction: 'descending' }, { ...(candidate ? { artifactRole: 'candidate' } : {}), population: { total: 'Recorded', outcomes: ['Passed', 'Failed', 'Unsupported', 'Blocked', 'Not applicable', 'Skipped', 'Unavailable'] } })
      }
    }
  }
  // Charts use exactly the table's verified numeric rows. Fully unobserved rows
  // stay visible and unranked in the table, without a fabricated zero bar.
  for (const table of tables.values()) {
    if (table.suite === 'docs' && table.columns.includes('Returned in all rounds')) table.chart = { numerator: 'Returned in all rounds', denominator: 'Planned', title: table.caption.includes('PNG output lane') ? 'Documentation PNG return' : 'Documentation SVG return', axis: '%', maximum: 100 }
  }
  return [...tables.values()]
}
