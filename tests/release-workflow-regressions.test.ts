import { expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { verifyKitSmoke, verifySourceSmoke, verifyReleaseSmokeParity } from '../scripts/package-release.ts'
import { PORTABLE_MEASUREMENT_PROTOCOL, type PortableWorkerResult } from '../portable/protocol.ts'
import type { ProjectBenchmarkRecord } from '../portable/project-records.ts'
import type { BenchmarkObservation } from '../unified/types.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import { portableCases, PORTABLE_COHORT_PROTOCOL, FAMILY_SUPPORT_PROTOCOL } from '../portable/cohorts.ts'
import { communityCoreWorkloads } from '../unified/community.ts'
import { runCommunityCliCohort, runCommunityResourceDiagnostic } from '../unified/community-cli.ts'

const temp = useTempDirs('trident-release-workflow-')
const caseIds = ['family:flowchart', 'adversarial:label-edit', 'adversarial:configuration-reset', 'adversarial:invalid-recovery']
function sourceRow(project: string, format: string, status: BenchmarkObservation['status'] = 'passed'): BenchmarkObservation {
  return { suite: 'community', surface: 'fixture-public-api', runtime: 'fixture', family: 'flowchart', caseId: 'support:flowchart', format, operation: 'render', mode: 'fixture', status, metrics: { implementation: project } }
}

test('source smoke requires the selected SVG and terminal interfaces independently', () => {
  const svg = 'fixture/svg', terminal = 'fixture/dual-output'
  const rows = [sourceRow(svg, 'svg'), sourceRow(terminal, 'svg'), sourceRow(terminal, 'terminal', 'failed')]
  expect(() => verifySourceSmoke(rows, svg, terminal)).toThrow('terminal flowchart output')
  rows.push(sourceRow(terminal, 'terminal'))
  expect(() => verifySourceSmoke(rows, svg, terminal)).not.toThrow()
  expect(() => verifySourceSmoke(rows.filter(row => row.metrics?.implementation !== svg || row.format !== 'svg'), svg, terminal)).toThrow('svg flowchart output')
})

function kitFixture() {
  const root = temp.dir(), directory = join(root, 'attempts', 'fixture-attempt'), file = join(root, 'report.json')
  mkdirSync(directory, { recursive: true })
  const project = 'fixture/svg', results: PortableWorkerResult[] = caseIds.map((caseId, index) => ({
    protocol: PORTABLE_MEASUREMENT_PROTOCOL, caseId, family: 'flowchart', mode: 'warm', round: 1, replica: 'B', sample: 0,
    status: index === 0 ? 'passed' : 'blocked', importMs: 0, tracks: {}, outputBytes: index === 0 ? 100 : 0,
    qualification: index === 0 ? { accepted: true, passed: true, semanticComplete: false, evidence: { outputAdmission: 'passed', nativeModel: 'unavailable', paintedMeaning: 'unavailable' }, checks: [], unmeasuredScopes: [], scope: 'Synthetic output admission' } : null,
    prelude: [], runtime: { executable: '/fixture/node', node: '24', platform: 'linux', arch: 'x64' },
  }))
  const record: ProjectBenchmarkRecord = {
    schemaVersion: 1, id: 'fixture-attempt', identity: { project, lane: 'portable-svg-subset', protocol: {}, artifact: {}, measurement: {} },
    startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T00:00:01Z', status: 'blocked', evidenceDirectory: directory, evidenceFiles: ['result.json.gz'],
    observations: results.map(result => ({ ...sourceRow(project, 'svg', result.status === 'passed' ? 'passed' : 'blocked'), caseId: result.caseId })), gaps: ['Synthetic blocked option mappings'],
    provenance: { workerProtocol: PORTABLE_MEASUREMENT_PROTOCOL, results },
  }
  const report = { project, protocol: PORTABLE_MEASUREMENT_PROTOCOL, recordId: record.id, evidenceDirectory: directory,
    summary: { counts: { cases: caseIds.length }, cases: caseIds.map((id, index) => ({ id, checkedWorkers: index === 0 ? 1 : 0, outputAdmission: index === 0 ? 'passed' : 'incomplete' })) } }
  const save = () => {
    writeFileSync(file, JSON.stringify(report))
    writeFileSync(join(directory, 'result.json.gz'), gzipSync(Buffer.from(JSON.stringify(record))))
  }
  save()
  return { project, file, report, record, results, save }
}

test('kit smoke retains blocked mapping attempts even when they have no qualification-bearing workers', () => {
  const fixture = kitFixture()
  expect(() => verifyKitSmoke(fixture.file, fixture.project, caseIds)).not.toThrow()
})

test.each(['missing', 'probe', 'baseline'] as const)('planned kit cases cannot replace execution with %s evidence', kind => {
  const fixture = kitFixture()
  if (kind === 'missing') fixture.results.pop()
  else fixture.results.at(-1)!.mode = kind
  fixture.save()
  expect(() => verifyKitSmoke(fixture.file, fixture.project, caseIds)).toThrow('did not attempt the declared case: adversarial:invalid-recovery')
})

test('kit smoke binds exact case identities and the owning attempt rather than inventory length', () => {
  const fixture = kitFixture()
  fixture.report.summary.cases[1]!.id = 'family:flowchart'; fixture.save()
  expect(() => verifyKitSmoke(fixture.file, fixture.project, caseIds)).toThrow('case inventory')
  fixture.report.summary.cases[1]!.id = caseIds[1]!; fixture.report.recordId = 'another-attempt'; fixture.save()
  expect(() => verifyKitSmoke(fixture.file, fixture.project, caseIds)).toThrow('owning worker record')
})

test('a passing derived flowchart row still needs actual output admission in its worker evidence', () => {
  const fixture = kitFixture()
  fixture.results[0]!.qualification = null; fixture.save()
  expect(() => verifyKitSmoke(fixture.file, fixture.project, caseIds)).toThrow('independently admit the flowchart output')
})

test('an expired allowance can retain unavailable CLI views without starting a child', async () => {
  const root = temp.dir(), run = join(root, 'prepared'); mkdirSync(run)
  writeFileSync(join(run, 'community-prepared.json'), JSON.stringify([{ node: { id: 'fixture/terminal', roles: ['renderer'], outputs: ['terminal'], benchmark: { adapter: 'source-cli', outputs: ['terminal'] } }, artifact: { kind: 'cli', executable: join(root, 'missing-executable'), version: '1.0.0' } }]))
  writeFileSync(join(run, 'community-inputs.json'), JSON.stringify({ workloads: communityCoreWorkloads() }))
  const result = await runCommunityCliCohort({ run, out: join(root, 'out'), target: process.cwd(), packageRoot: process.cwd(), rounds: 1, collectionDeadline: Date.now() - 1, observerExecutable: join(root, 'missing-observer') })
  expect(result.observations).toHaveLength(3)
  expect(result.observations.every(row => row.status === 'blocked' && !row.samplesMs)).toBe(true)
  expect(result.diagnostics.every(row => row.status === 'blocked')).toBe(true)
})

test('the resource deadline gates actual commands after unavailable observations are recorded', () => {
  const root = temp.dir(), variant = { prepared: { node: { id: 'fixture/terminal', roles: [], outputs: ['terminal'] }, artifact: { kind: 'cli' as const, executable: '/never-run', version: '1.0.0' } }, variantOf: 'fixture/terminal', variant: 'public-cli', outputs: ['terminal'] }
  const workload = communityCoreWorkloads()[0]!
  expect(runCommunityResourceDiagnostic(variant, 'terminal', workload, { path: '/missing', version: null, error: 'Observer unavailable' }, root, 0).status).toBe('blocked')
  expect(() => runCommunityResourceDiagnostic(variant, 'terminal', workload, { path: '/never-run', version: 'fixture GNU Time' }, root, 0)).toThrow('Collection budget exhausted')
})


function parityFixture() {
  const fixture = kitFixture(), cases = structuredClone(portableCases(undefined, caseIds))
  fixture.record.identity.protocol = { measurement: PORTABLE_MEASUREMENT_PROTOCOL, cohort: PORTABLE_COHORT_PROTOCOL, cases, familySupport: { protocol: FAMILY_SUPPORT_PROTOCOL } }
  fixture.record.identity.artifact = { project: fixture.project, sha256: 'a'.repeat(64) }
  fixture.record.identity.measurement = { environment: { runtime: { node: '24', executable: '/fixture/node' } }, sampling: { rounds: 1, samples: 1, coldSamples: 1, minSampleMs: 0 } }
  for (const worker of fixture.results) {
    const testCase = cases.find(row => row.id === worker.caseId)!
    worker.prelude = (testCase.prelude ?? []).map(row => ({ source: row.source, expectedAccepted: row.accept, actualAccepted: row.accept, passed: true }))
    if (worker.caseId === 'adversarial:configuration-reset') { worker.error = 'Error: Adapter gap: no reviewed public font-size configuration binding for declared'; continue }
    if (worker.caseId !== 'family:flowchart') { worker.status = 'partial'; worker.error = undefined; worker.qualification = { accepted: true, passed: false, semanticComplete: false, evidence: { outputAdmission: 'passed', nativeModel: 'unavailable', paintedMeaning: 'unavailable' }, checks: [], unmeasuredScopes: ['Synthetic model and paint remain unknown'], scope: 'Synthetic output admission; no benchmark score' } }
  }
  const svgPath = join(fixture.record.evidenceDirectory, 'svg', 'family_flowchart.svg'); mkdirSync(join(fixture.record.evidenceDirectory, 'svg'))
  writeFileSync(svgPath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="10" y="20">Alpha</text><text x="70" y="20">Beta</text><text x="120" y="20">Gamma</text></svg>')
  fixture.record.evidenceFiles.push('svg/family_flowchart.svg')
  for (const testCase of cases.filter(row => ['adversarial:label-edit', 'adversarial:invalid-recovery'].includes(row.id))) {
    const path = 'svg/' + testCase.id.replaceAll(':', '_') + '.svg'
    writeFileSync(join(fixture.record.evidenceDirectory, path), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">' + testCase.expected.labels.map((label, index) => '<text x="10" y="' + (20 + index * 20) + '">' + label + '</text>').join('') + '</svg>')
    fixture.record.evidenceFiles.push(path)
  }
  fixture.save()
  return { ...fixture, cases, svgPath }
}

test('release parity preserves identical renderer findings and known option gaps without calling them workflow passes', () => {
  const source = parityFixture(), kit = parityFixture()
  const result = verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds)
  expect(result.status).toBe('package-parity-verified')
  expect(result.sourceRecord.sha256).toHaveLength(64)
  expect(result.kitWitnesses).toHaveLength(3)
})

test.each(['failed', 'blocked', 'partial'] as const)('shipped kit cannot turn a source workflow into a fresh %s result', changed => {
  const source = parityFixture(), kit = parityFixture()
  source.results[1]!.status = 'passed'; source.results[1]!.qualification!.passed = true; source.results[1]!.error = undefined; source.save()
  kit.results[1]!.status = changed; kit.save()
  expect(() => verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds)).toThrow()
})

test('release parity rejects changed artifact bytes, old source expectations and missing negative preludes', () => {
  for (const mutation of ['artifact', 'expectation', 'prelude'] as const) {
    const source = parityFixture(), kit = parityFixture()
    if (mutation === 'artifact') (kit.record.identity.artifact as any).sha256 = 'b'.repeat(64)
    else if (mutation === 'expectation') (kit.record.identity.protocol as any).cases[1].edit.expected.labels = ['Base label', 'Stable label']
    else kit.results[3]!.prelude = []
    kit.save()
    expect(() => verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds)).toThrow()
  }
})

test('equal worker summaries cannot hide an extracted kit witness missing declared source text', () => {
  const source = parityFixture(), kit = parityFixture()
  writeFileSync(kit.svgPath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text>Alpha</text></svg>')
  expect(() => verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds)).toThrow('independently rechecked')
})

test('contradictory rejection evidence and unqualified transport failures cannot get packaging parity', () => {
  const source = parityFixture(), kit = parityFixture()
  kit.results[3]!.prelude[0]!.actualAccepted = true; kit.results[3]!.prelude[0]!.passed = false; kit.save()
  expect(() => verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds)).toThrow('workflow outcome')
  source.results[1]!.status = 'blocked'; source.results[1]!.error = 'Error: Cannot import shipped driver'; source.save()
  kit.results[1]!.status = 'blocked'; kit.results[1]!.error = 'Error: Cannot import shipped driver'; kit.save()
  expect(() => verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds)).toThrow('unqualified harness failure')
})


test('an identical failed host error cannot become a renderer finding through packaging parity', () => {
  const source = parityFixture(), kit = parityFixture()
  for (const fixture of [source, kit]) { fixture.results[1]!.status = 'failed'; fixture.results[1]!.error = 'ReferenceError: missingHarnessVariable is not defined'; fixture.results[1]!.qualification = null; fixture.save() }
  expect(() => verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds)).toThrow('cause remains unclassified')
})

test('a preserved output failure needs both actual returned bytes and an independently confirmed violated fact', () => {
  const source = parityFixture(), kit = parityFixture()
  for (const fixture of [source, kit]) {
    fixture.results[1]!.status = 'failed'; fixture.results[1]!.qualification = { accepted: true, passed: false, semanticComplete: false, evidence: { outputAdmission: 'failed', nativeModel: 'unavailable', paintedMeaning: 'unavailable' }, checks: [{ name: 'label:Stable label', status: 'failed', expected: true, actual: false, scope: 'Missing authored text in the actual public return' }], unmeasuredScopes: [], scope: 'Synthetic independently observable renderer finding' }
    const path = join(fixture.record.evidenceDirectory, 'svg', 'adversarial_label-edit.svg'); writeFileSync(path, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text>Base label</text></svg>'); fixture.save()
  }
  expect(verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds).status).toBe('package-parity-verified')
  writeFileSync(join(kit.record.evidenceDirectory, 'svg', 'adversarial_label-edit.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text>Base label</text><text>Stable label</text></svg>')
  expect(() => verifyReleaseSmokeParity(source.file, kit.file, source.project, caseIds)).toThrow('cause remains unclassified')
})
