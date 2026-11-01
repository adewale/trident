import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { median } from '../portable/statistics.ts'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { terminalProfileCorpus } from '../fidelity/terminal-active-corpus.ts'
import { makeSvgCaseContract } from '../fidelity/svg-assessment.ts'
import { sourceContractComplete } from '../fidelity/source-contract.ts'
import { reviewedDocsCase } from './docs-drawings.ts'
import { pngTimingContract } from './timing-png.ts'
import { terminalTimingContract } from './timing-terminal.ts'
import { qualifyRetainedTiming } from './qualify-timing.ts'

/** Standard driver output is already a report input. Never pick one of several
 * attempts or trust a saved qualification flag instead of the owning journal. */
export function nativeTimingFile(directory: string): string | undefined {
  if (!existsSync(directory)) return undefined
  if (existsSync(join(directory, 'report.json')) || existsSync(join(directory, 'report.json.gz'))) return undefined
  const files = readdirSync(directory).filter(name => /^timing-bundle-[a-f0-9]+\.json$/.test(name))
  if (files.length > 1) throw Error('Publish each native timing attempt from its own directory')
  return files[0]
}
const owned = (directory: string, file: string) => {
  const path = relative(realpathSync(directory), realpathSync(join(directory, file)))
  if (path.startsWith('..') || isAbsolute(path)) throw Error('Native timing evidence escapes its owning directory')
  return join(directory, file)
}
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))
const chronological = (a: string, b: string) => Date.parse(a) - Date.parse(b)

export function readNativeTiming(directory: string) {
  const file = nativeTimingFile(directory)
  if (!file) return undefined
  const path = owned(directory, file), bundle = readBenchmarkDocument(path), qualification = qualifyRetainedTiming(path)
  const starts = bundle.samples.map((sample: any) => sample.invocation.startedAt).filter(date).sort(chronological)
  const ends = bundle.samples.map((sample: any) => sample.invocation.finishedAt).filter(date).sort(chronological)
  const checkpoint = join(directory, 'collection/checkpoint.json')
  const collectedAt = existsSync(checkpoint) ? readBenchmarkDocument(owned(directory, 'collection/checkpoint.json')).startedAt : undefined
  if (!starts.length && !date(collectedAt)) throw Error('Native timing has no recorded collection window')
  const startedAt = starts[0] ?? collectedAt, finishedAt = ends.at(-1) ?? startedAt
  let sourceQualified = false
  let sourceGap = 'No matching complete current source contracts for the full fixed workload; saved output-only or partial checks cannot supply a comparative speed score.'
  const sourceIds = bundle.plan.cases.map((input: any) => input.caseId)
  const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString())
  const docsInputs = bundle.plan.cases.map((input: any) => inventory.cases.find((source: any) => source.id === input.caseId && evidenceBytesDigest(source.source) === input.sourceSha256))
  const docs = docsInputs.every((input: any) => !!input)
  const terminal = sourceIds.every((id: string) => id.startsWith('terminal:')) ? terminalProfileCorpus() : undefined
  const terminalInputs = terminal && bundle.plan.cases.map((input: any) => terminal.cases.find(source => source.id === input.caseId && source.sourceSha256 === input.sourceSha256))
  const terminalMatches = terminalInputs?.every((input: any) => !!input)
  try {
    let contracts
    if (docs && ['svg', 'png'].includes(bundle.plan.format)) {
      const reviews = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8'))
      contracts = docsInputs.map((input: any) => {
        const review = reviews.find((review: any) => review.id === input.id), authored = reviewedDocsCase(input, review)
        if (!sourceContractComplete(authored)) throw Error('Incomplete current source contract')
        return bundle.plan.format === 'svg' ? makeSvgCaseContract(authored) : pngTimingContract(input, review)
      })
    } else if (terminalMatches && bundle.plan.format === 'terminal') contracts = terminalInputs.map(terminalTimingContract)
    sourceQualified = !!contracts && evidenceDigest(contracts) === evidenceDigest(bundle.plan.cases)
  } catch (error) { sourceQualified = false; sourceGap += ' Current contract reconstruction: ' + String(error) }
  const gaps = [...qualification.gaps, ...(sourceQualified ? [] : [sourceGap])]
  const qualified = qualification.status === 'qualified' && sourceQualified && starts.length > 0 && ends.length > 0
  const status = qualified ? 'qualified' : qualification.status === 'qualified' ? 'source-unassessed' : qualification.status
  const calibration = qualification.calibration
  const rows = [
    { project: bundle.plan.artifacts.A0.project, artifact: bundle.plan.artifacts.A0, replicas: ['A0', 'A1'], ratio: qualified ? 1 : null, interval: null },
    { project: bundle.plan.artifacts.B.project, artifact: bundle.plan.artifacts.B, replicas: ['B'], ratio: qualified ? calibration?.candidateRatio ?? null : null, interval: qualified ? calibration?.roundRatioUncertainty?.replicaB.interval ?? null : null },
  ].map(row => {
    const samples = bundle.samples.filter((sample: any) => row.replicas.includes(sample.replica))
    const totals = Array.from({ length: bundle.plan.rounds }, (_, index) => row.replicas.map(replica => samples.filter((sample: any) => sample.round === index + 1 && sample.replica === replica).reduce((sum: number, sample: any) => sum + sample.invocation.durationMs, 0))).flat()
    return { ...row, calls: samples.length, plannedSamples: bundle.plan.rounds * bundle.plan.cases.length * bundle.plan.samplesPerRound * row.replicas.length, medianWorkloadMs: qualified ? median(totals) : null, measuredAt: samples.map((sample: any) => sample.invocation.finishedAt).filter(date).sort(chronological).at(-1) ?? null }
  })
  const terminalOrigins = terminalMatches ? [...new Set(terminalInputs.map((input: any) => input.origins.map((origin: any) => `${origin.repository}@${origin.commit}`).join(', ')))].join('; ') : ''
  const corpus = docs ? `Mermaid syntax documentation at ${inventory.pin.commit}; ${sourceIds.length} unchanged examples. Exact source IDs and hashes are in the owning plan.`
    : terminalMatches ? `Terminal project documentation and regression fixtures: ${terminalOrigins}; ${sourceIds.length} exact inputs matched to the committed corpus. Per-file origins and any authored adaptations are retained in the source inventory and terminal-inputs.json; exact source IDs and hashes are in the plan.`
      : `Caller-selected fixed corpus: ${sourceIds.join(', ')}. Consult the owning source inputs for origin; this is not a documentation or whole-suite result.`
  const cohort = 'native-timing:' + bundle.plan.format + ':' + evidenceDigest({ boundary: bundle.plan.boundary, track: bundle.plan.track, cases: bundle.plan.cases, rounds: bundle.plan.rounds, samplesPerRound: bundle.plan.samplesPerRound, maximumControlSpread: bundle.plan.maximumControlSpread, observerSha256: bundle.plan.observerSha256, environmentSha256: bundle.plan.environmentSha256 }).slice(0, 12)
  return { file, bundle, qualification, qualified, status, gaps, rows, startedAt, finishedAt, corpus, cohort, scope: `${bundle.plan.format.toUpperCase()}; ${bundle.plan.track}; ${sourceIds.length} examples; ${bundle.plan.rounds} balanced A0/A1/B rounds; ${bundle.plan.samplesPerRound} sample(s) per example and replica-round. ${bundle.plan.boundary} Corpus: ${corpus} Ranks use the paired normalized ratio, with the reference at 1. Median replica-round time sums actual calls, including all declared samples; control medians include both A replicas. Every planned timed return, A/A control and current complete source contract must qualify; otherwise all speed values and ranks are withheld. Grading remains bound to the recorded observer; importing runs no renderer or new output observer. Intervals describe this fixed exposed workload, not ecosystem-wide speed.` }
}
