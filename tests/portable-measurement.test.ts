import { afterEach, expect, test } from 'bun:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { portableSummary } from '../portable/report.ts'
import { calibrate, roundRatioUncertainty } from '../portable/statistics.ts'
import { modelCost, processCpuCost } from '../portable/costs.ts'
import { resetPortableCancellation, runFirstUseBatch, runSerialJob, terminatePortableWorkers, measurePortableProject, CollectionCheckpoint } from '../portable/execution.ts'
import { portableDirectory } from '../portable/artifacts.ts'
import { parsePortableOptions } from '../portable/run.ts'
import { inspectCurrentProjectRecords, readProjectBenchmarkRecord } from '../portable/project-records.ts'
import { pathToFileURL } from 'node:url'
import type { PortableJob, PortableWorkerResult } from '../portable/protocol.ts'
import { portableCases } from '../portable/cohorts.ts'

const directories: string[] = []
afterEach(() => {
  resetPortableCancellation()
  for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true })
})
const stableRounds = () => Array.from({ length: 5 }, (_, index) => ({ round: index + 1, A0: Array(31).fill(10) as number[], A1: Array(31).fill(10) as number[], B: Array(31).fill(10) as number[] }))
test('explicit case selection retains corpus order and refuses unknown, empty or excluded cases', () => {
  const selected = ['invalid:unfinished-sequence', 'adversarial:configuration-reset']
  const options = parsePortableOptions(['--project', 'owner/tool', '--artifact-root', '/missing/artifact', '--cases', selected.join(',')])
  expect(options.caseIds).toEqual(selected)
  expect(portableCases(undefined, options.caseIds).map(item => item.id)).toEqual([...selected].reverse())
  for (const ids of [[], [''], ['missing'], [selected[0]!, selected[0]!]]) expect(() => portableCases(undefined, ids)).toThrow()
  expect(() => portableCases(['family'], selected)).toThrow('excluded')
})

test('subset family counts describe exercised positive families and keep canonical representatives separate', () => {
  const settings = { rounds: 6, samples: 31, coldSamples: 20, maximumControlSpread: .25 }
  const positive = portableCases().filter(item => item.id === 'adversarial:configuration-reset')
  expect(portableSummary(positive, [], settings).counts).toMatchObject({ cases: 1, positiveCases: 1, families: 1, canonicalFamilyRepresentatives: 0 })
  expect(portableSummary(portableCases(['invalid']), [], settings).counts.families).toBe(0)
})

test('sampling and independent A/A noise govern calibration rather than successful process exit', () => {
  expect(calibrate(stableRounds(), 31).status).toBe('calibrated')
  expect(calibrate(stableRounds().slice(0, 3), 31).status).toBe('uncalibrated')
  const missing = stableRounds()
  missing[2]!.A1.pop()
  expect(calibrate(missing, 31).status).toBe('uncalibrated')
  const duplicate = stableRounds()
  duplicate[4]!.round = 1
  expect(calibrate(duplicate, 31).status).toBe('uncalibrated')
  const noisy = stableRounds()
  noisy[1]!.A1 = Array(31).fill(20) as number[]
  expect(calibrate(noisy, 31).status).toBe('uncalibrated')
  expect(calibrate(stableRounds(), 31).roundRatioUncertainty?.replicaB.interval).toBeNull()
  expect(roundRatioUncertainty([.8, .85, .9, .95, 1, 1.05])).toMatchObject({ independentRounds: 6, interval: { lower: .8, upper: 1.05, confidence: .96875 } })
  // Increasing calls inside existing rounds cannot manufacture more independent evidence.
  const manyCalls = stableRounds().map(round => ({ ...round, A0: Array(1000).fill(10), A1: Array(1000).fill(10), B: Array(1000).fill(9) }))
  expect(calibrate(manyCalls, 31).roundRatioUncertainty?.replicaB).toMatchObject({ independentRounds: 5, medianRatio: .9, interval: null })
  expect(() => calibrate(stableRounds(), NaN)).toThrow('sample count')
  expect(() => roundRatioUncertainty([1, 0])).toThrow('positive')
})
test('missing provider evidence and censored zero CPU counters never become free observed work', () => {
  expect(modelCost().dollars).toBeNull()
  const censored = processCpuCost(0, 0, 1)
  expect(censored.status).toBe('below-counter-resolution')
  expect(censored.dollars).toBeNull()
  expect(censored.upperDollars).toBeGreaterThan(0)
  expect(() => processCpuCost(-1, 0)).toThrow()
  expect(
    modelCost({ provider: 'fixture-provider', model: 'fixture-model', transcript: 'observed-transcript', measuredAt: '2026-10-25T00:00:00Z', inputTokens: 1000, outputTokens: 500, price: { observedAt: '2026-10-25T00:00:00Z', source: 'dated fixture price', inputPerMillionUsd: 2, outputPerMillionUsd: 4 } }).dollars,
  ).toBe(0.004)
})
test('portable CLI keeps insufficient sampling explicit and rejects ambiguous selection', () => {
  const options = parsePortableOptions(['--project', 'owner/tool', '--artifact-root', '/tmp/tool', '--rounds', '1'])
  expect(options.rounds).toBe(1)
  expect(options.samples).toBe(31)
  expect(options.workerTimeoutMs).toBe(300_000)
  expect(() => parsePortableOptions(['--project', 'owner/tool', '--artifact-root', '/tmp/tool', '--worker-timeout-ms', '0'])).toThrow('positive integer')
  expect(() => parsePortableOptions(['--project', 'owner/tool', '--project', 'other/tool', '--artifact-root', '/tmp/tool'])).toThrow('Duplicate')
  expect(() => parsePortableOptions(['--project', 'owner/tool', '--artifact-root', '/tmp/tool', '--cohort', 'family,family'])).toThrow('repeated')
})
test('architecture scale preserves authored group membership', () => {
  const cases = portableCases(['scaling']).filter(testCase => testCase.family === 'architecture')
  expect(cases.map(testCase => testCase.scale)).toEqual([8, 32, 128])
  const large = cases[2]!
  expect(large.expected.topology?.nodes).toHaveLength(128)
  expect(large.expected.topology?.edges).toHaveLength(127)
  expect(large.expected.topology?.groups).toHaveLength(16)
  expect(large.expected.topology?.groups?.[15]).toEqual({ id: 'G15', members: Array.from({ length: 8 }, (_, index) => `N${120 + index}`) })

})
test('prepared fresh processes execute first-use API windows serially', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'portable-api-barrier-'))
  directories.push(directory)
  const root = join(directory, 'api')
  mkdirSync(root)
  writeFileSync(join(root, 'package.json'), '{"name":"portable-barrier-fixture","version":"1.0.0","type":"module"}')
  const entry = join(root, 'index.mjs')
  writeFileSync(entry, 'export function render(){Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,20);return {svg:\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><text x="1" y="20">Visible</text></svg>\'}}')
  const node = execFileSync(process.env.NODE_BIN ?? 'node', ['-p', 'process.execPath'], { encoding: 'utf8' }).trim()
  const jobs: PortableJob[] = [0, 1].map(sample => ({
    artifact: { project: 'fixture/api', root, entry, version: '1.0.0', adapter: 'pele' },
    testCase: { id: 'fixture:barrier', family: 'flowchart', cohort: 'adversarial', source: 'flowchart LR\nA[Visible]', expected: { accept: true, labels: ['Visible'] } },
    mode: 'cold',
    samples: 1,
    round: 1,
    replica: 'B',
    sample,
    resultFile: join(directory, `sample-${sample}.json`),
  }))
  const results = await runFirstUseBatch(jobs, node, 2)
  expect(results).toHaveLength(2)
  expect(results.every(result => result.apiWindow && result.tracks['first-use']?.length === 1)).toBe(true)
  expect(BigInt(results[1]!.apiWindow!.startNs) >= BigInt(results[0]!.apiWindow!.endNs)).toBe(true)
  expect(results.every(result => result.tracks['first-use']![0]! >= 18)).toBe(true)
  expect(readdirSync(directory)).toEqual(['api'])
}, 30_000)

function workerFixture(body: string) {
  const directory = mkdtempSync(join(tmpdir(), 'portable-worker-invariant-'))
  directories.push(directory)
  const entry = join(directory, 'index.mjs')
  writeFileSync(join(directory, 'package.json'), '{"name":"portable-invariant-fixture","version":"1.0.0","type":"module"}')
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><text x="1" y="20">Visible</text></svg>'
  writeFileSync(entry, `const good=${JSON.stringify(svg)};let calls=0;${body}`)
  const node = execFileSync(process.env.NODE_BIN ?? 'node', ['-p', 'process.execPath'], { encoding: 'utf8' }).trim()
  const job = (mode: PortableJob['mode'], suffix: string = mode): PortableJob => ({
    artifact: { project: 'fixture/api', root: directory, entry, version: '1.0.0', adapter: 'pele' },
    testCase: { id: 'fixture:invariant', family: 'flowchart', cohort: 'adversarial', source: 'flowchart LR\nA[Visible]', expected: { accept: true, labels: ['Visible'] } },
    mode,
    samples: 2,
    minSampleMs: 0,
    round: 1,
    replica: 'B',
    sample: 0,
    resultFile: join(directory, suffix + '.json'),
    fullEvidence: true,
  })
  return { node, job, directory }
}
function agenticParserFixture(rejectEdit = false, rejectNewSource = false) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50"><defs><marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" overflow="visible"><polyline points="0 0,8 3,0 6" fill="none" stroke="#111"/></marker></defs><polyline class="class-relationship" data-id="owned" data-from="A" data-to="B" points="30,20 110,20" fill="none" stroke="#111" marker-end="url(#arrow)"/><g class="class-node" data-id="A"><rect x="10" y="10" width="20" height="20" fill="#fff"/><text>A</text></g><g class="class-node" data-id="B"><rect x="110" y="10" width="20" height="20" fill="#fff"/><text>B</text></g></svg>'
  const fixture = workerFixture(`import{appendFileSync}from'node:fs';
const log=value=>appendFileSync(new URL('./observations.jsonl',import.meta.url),JSON.stringify({...value,at:process.hrtime.bigint().toString()})+'\\n');
const memory=process.memoryUsage;process.memoryUsage=(...args)=>{log({kind:'memory'});return memory(...args)};
export function renderMermaidSVG(source){return ${JSON.stringify(svg)}.replace('<text>A</text>','<text>'+(source.includes('Edited')?'Edited':'A')+'</text>')}
export async function parseRegisteredMermaid(source){log({kind:'parse',source});${rejectEdit ? "if(source.includes('Edited'))throw Error('edited native parse fault');" : ''}${rejectNewSource ? "if(source.includes('portable-source-'))throw Error('new-source native parse fault');" : ''}return{ok:true,value:{kind:'class',body:{kind:'class',classes:[{id:'A',label:source.includes('Edited')?'Edited':'A'},{id:'B',label:'B'}],relations:[{from:'A',to:'B',kind:'association',markerAt:'to'}]}}}}
`)
  const expected = (label: string) => ({ accept: true, labels: [label, 'B'], topology: { nodes: ['A', 'B'], edges: [{ source: 'A', target: 'B' }], nodeLabels: { A: label, B: 'B' } } })
  const job = (mode: PortableJob['mode']): PortableJob => ({ ...fixture.job(mode), artifact: { ...fixture.job(mode).artifact, adapter: 'agentic' }, testCase: { id: 'fixture:agentic-parser', family: 'class', cohort: 'adversarial', source: 'classDiagram\nclass A\nclass B\nA --> B', expected: expected('A'), edit: { source: 'classDiagram\nclass A["Edited"]\nclass B\nA --> B', expected: expected('Edited') } } })
  return { ...fixture, job, observations: () => readFileSync(join(fixture.directory, 'observations.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line) as { kind: string; at: string; source?: string }) }
}
test('Agentic native qualification uses its actual root parser outside render clocks and memory snapshots', async () => {
  for (const mode of ['cold', 'memory', 'warm'] as const) {
    const f = agenticParserFixture(), result = await runSerialJob(f.job(mode), f.node)
    expect(result.status).toBe('passed')
    expect(result.qualification?.semanticComplete).toBe(true)
    expect(result.qualification?.observer).toBe('portable-owned-topology-v3-agentic-class-er')
    const observations = f.observations(), parses = observations.filter(item => item.kind === 'parse')
    expect(parses.length).toBeGreaterThan(0)
    if (mode === 'cold') expect(parses.every(item => BigInt(item.at) > BigInt(result.apiWindow!.endNs))).toBe(true)
    if (mode === 'memory') expect(observations.filter(item => item.kind === 'memory').every(item => BigInt(item.at) < BigInt(parses[0]!.at))).toBe(true)
    if (mode === 'warm') expect(parses.some(item => item.source?.includes('Edited'))).toBe(true)
  }
})
test('an edited native parse failure stays separate from a valid consumed SVG result', async () => {
  const f = agenticParserFixture(true), result = await runSerialJob(f.job('warm'), f.node)
  expect(result.status).toBe('failed')
  expect(result.qualification?.evidence?.outputAdmission).toBe('passed')
  expect(result.qualification?.checks.find(check => check.name === 'model-native-result')?.status).toBe('failed')
  expect(result.qualification?.semanticComplete).toBe(false)
})
test('Agentic source variants cannot reuse another source native qualification merely because SVG bytes match', async () => {
  const f = agenticParserFixture(false, true), result = await runSerialJob(f.job('warm'), f.node)
  expect(result.status).toBe('failed')
  expect(result.qualification?.evidence?.outputAdmission).toBe('passed')
  expect(result.qualification?.checks.find(check => check.name === 'model-native-result')?.status).toBe('failed')
  expect(f.observations().some(item => item.kind === 'parse' && item.source?.includes('portable-source-'))).toBe(true)
})
test('a failed memory-measured call is not hidden by later successful qualification', async () => {
  const f = workerFixture('export function render(){if(++calls===1)throw Error("first-call fault");return {svg:good}}')
  const result = await runSerialJob(f.job('memory'), f.node)
  expect(result.status).toBe('failed')
  expect(result.error).toContain('Memory-measured invocation')
  expect(result.outputBytes).toBe(0)
})
test('retention captures intermediate faults and warm timing rejects transient bad SVG', async () => {
  const retention = workerFixture('export function render(){if(++calls===17)throw Error("middle fault");return {svg:good}}')
  const resource = await runSerialJob(retention.job('retention'), retention.node)
  expect(resource.status).toBe('failed')
  expect(resource.error).toContain('Retention invocation17')
  const warm = workerFixture('export function render(){return {svg:++calls===2?good.replace("Visible","Wrong"):good}}')
  expect((await runSerialJob(warm.job('warm'), warm.node)).status).toBe('failed')
})
test('a worker deadline reaps the child before another launch', async () => {
  const f = workerFixture('export function render(){return {svg:good}}')
  const timed = { ...f.job('warm'), workerTimeoutMs: 1 }
  await expect(runSerialJob(timed, f.node)).rejects.toThrow('exceeded 1 ms')
  expect(() => resetPortableCancellation()).not.toThrow()
  const next = await runSerialJob(f.job('warm', 'next-project'), f.node)
  expect(next.status).not.toBe('blocked')
  expect(next.tracks['warm-repeat']?.length).toBeGreaterThan(0)
})

test('a valid result followed by failed worker cleanup never qualifies', async () => {
  const f = workerFixture('export function render(){setImmediate(()=>{process.exitCode=1});return {svg:good}}')
  await expect(runSerialJob(f.job('warm'), f.node)).rejects.toThrow('lifecycle')
  await expect(runFirstUseBatch([f.job('cold')], f.node, 1)).rejects.toThrow('lifecycle')
})
test('cancellation aborts the current worker and latches against subsequent launches', async () => {
  const f = workerFixture('export async function render(){await new Promise(resolve=>setTimeout(resolve,2000));return {svg:good}}')
  const timer = setTimeout(terminatePortableWorkers, 80)
  try {
    await expect(runSerialJob(f.job('warm'), f.node)).rejects.toThrow('cancelled')
    await expect(runSerialJob(f.job('cold', 'not-launched'), f.node)).rejects.toThrow('cancelled')
  } finally {
    clearTimeout(timer)
  }
})
test('the direct worker entry rejects CI before reading a job or loading a target', () => {
  const f = workerFixture('export function render(){return {svg:good}}')
  const result = spawnSync(f.node, [join(portableDirectory, 'worker.mjs'), join(f.directory, 'does-not-exist.json')], { encoding: 'utf8', env: { ...process.env, CI: 'true' }, timeout: 10_000 })
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('Benchmarks are excluded from CI')
})

test('missing execution never becomes a vacuous acceptance or semantic pass', () => {
  const summary = portableSummary([{ id: 'unexecuted', family: 'flowchart', cohort: 'family', source: 'flowchart LR\nA', expected: { accept: true, labels: ['A'] } }], [], { rounds: 5, samples: 31, coldSamples: 20, maximumControlSpread: 0.25 })
  expect(summary.status).toBe('uncalibrated')
  expect(summary.cases[0]!.acceptanceMatches).toBe(false)
  expect(summary.cases[0]!.semanticComplete).toBe(false)
  expect(summary.timing.every(row => !row.semanticComplete && row.calibration.status === 'uncalibrated')).toBe(true)
  expect(summary.counts.completeSemanticCases).toBe(0)
})

test('duplicated fresh-process identities cannot replace missing samples', () => {
  const cases = [{ id: 'identity-grid', family: 'flowchart', cohort: 'family' as const, source: 'flowchart LR\nA', expected: { accept: true, labels: ['A'] } }]
  const results: PortableWorkerResult[] = []
  for (let round = 1; round <= 5; round++)
    for (const replica of ['A0', 'A1', 'B'] as const)
      for (const mode of ['warm', 'cold'] as const)
        for (let sample = 0; sample < (mode === 'cold' ? 20 : 1); sample++)
          results.push({ protocol: 'portable-svg-processes-v1', caseId: 'identity-grid', family: 'flowchart', mode, round, replica, sample, status: 'passed', importMs: 1, tracks: mode === 'cold' ? { 'first-use': [1] } : { 'warm-repeat': Array(31).fill(1), 'warm-new-source': Array(31).fill(1) }, outputBytes: 40, qualification: { accepted: true, passed: true, semanticComplete: true, checks: [], unmeasuredScopes: [], scope: 'fixture declared criteria' }, prelude: [], runtime: { executable: '/fixture/node', node: '24', platform: 'linux', arch: 'x64' } })
  const settings = { rounds: 5, samples: 31, coldSamples: 20, maximumControlSpread: 0.25 }
  expect(portableSummary(cases, results, settings).status).toBe('measured')
  expect(() => portableSummary(cases, [{ ...results[0]!, protocol: 'portable-svg-processes-v2' }, ...results.slice(1)], settings)).toThrow('protocol')
  const first = results.find(result => result.mode === 'cold')!
  const missing = results.findIndex(result => result.mode === 'cold' && result.sample === 19)
  results[missing] = { ...first }
  const incomplete = portableSummary(cases, results, settings)
  expect(incomplete.status).toBe('uncalibrated')
  expect(incomplete.cases[0]!.acceptanceMatches).toBe(false)
  expect(incomplete.cases[0]!.semanticComplete).toBe(false)
})


test('dedicated result pipe retains large Unicode errors despite renderer stdout noise', async () => {
  const f = workerFixture('export function render(){console.log("unrelated renderer output");throw Error("λ漢".repeat(40000)+"error-end")}')
  const result = await runSerialJob(f.job('cold'), f.node)
  expect(result.status).toBe('failed')
  const payload = JSON.stringify(result)
  expect(payload).toContain('λ漢λ漢')
  expect(payload).toContain('error-end')
  expect(payload).not.toContain('\ufffd')
  expect(readdirSync(f.directory).sort()).toEqual(['index.mjs', 'package.json'])
})

test('resource counters use a terminal observer frame without per-worker files', async () => {
  const f = workerFixture('export function render(){return {svg:good}}')
  const observer = join(f.directory, 'observer.mjs')
  writeFileSync(observer, `#!/usr/bin/env node
import{spawn}from'node:child_process';const args=process.argv.slice(2),at=args.indexOf('--')+1;const child=spawn(args[at],args.slice(at+1),{stdio:['inherit','inherit','inherit','inherit']});child.once('close',code=>{process.stderr.write('renderer diagnostic\\nTRIDENT_RESOURCE 0.25 0.5 2048\\n');process.exitCode=code??1})`)
  chmodSync(observer, 0o755)
  const result = await runSerialJob(f.job('memory'), f.node, observer)
  expect(result.resource).toMatchObject({ userSeconds: .25, systemSeconds: .5, peakRssBytes: 2097152 })
  expect(readdirSync(f.directory).sort()).toEqual(['index.mjs', 'observer.mjs', 'package.json'])
  writeFileSync(observer, readFileSync(observer, 'utf8').replace('0.25 0.5 2048', 'NaN 0.5 2048'))
  await expect(runSerialJob(f.job('memory', 'bad-observer'), f.node, observer)).rejects.toThrow('GNU time')
})

test('an import failure retains its terminal blocked payload without first-use credit', async () => {
  const f = workerFixture('throw Error("backend-unavailable-at-import")')
  await expect(runFirstUseBatch([f.job('cold')], f.node, 1)).rejects.toThrow('blocked before readiness')
  const evidence = JSON.parse(readFileSync(join(f.directory, 'cold.json.failure.json'), 'utf8'))
  expect(evidence.result.status).toBe('blocked')
  expect(evidence.result.error).toContain('backend-unavailable-at-import')
  expect(evidence.result.apiWindow).toBeUndefined()
  expect(evidence.result.tracks).toEqual({})
})

test('a later cold worker cleanup failure does not lose earlier completed worker evidence', async () => {
  const f = workerFixture('export function render(source){if(source.includes("cleanup-failure"))setImmediate(()=>{process.exitCode=1});return {svg:good}}')
  const first = f.job('cold', 'first'), second = { ...f.job('cold', 'second'), sample: 1, testCase: { ...f.job('cold').testCase, source: 'flowchart LR\nA[Visible]\n%% cleanup-failure' } }
  const retained: PortableWorkerResult[] = []
  await expect(runFirstUseBatch([first, second], f.node, 2, result => retained.push(result))).rejects.toThrow('lifecycle')
  expect(retained).toHaveLength(1)
  expect(retained[0]).toMatchObject({ sample: 0, status: 'partial' })
  expect(retained[0]!.tracks['first-use']).toHaveLength(1)
  expect(existsSync(join(f.directory, 'second.json.failure.json'))).toBe(true)
})

test('unserializable jobs are rejected before any serial or batch worker can be left alive', async () => {
  const f = workerFixture('export function render(){return {svg:good}}')
  const invalid = { ...f.job('cold'), testCase: { ...f.job('cold').testCase, renderOptions: { invalid: 1n } } }
  await expect(runSerialJob(invalid as any, f.node)).rejects.toThrow()
  expect(() => resetPortableCancellation()).not.toThrow()
  await expect(runFirstUseBatch([f.job('cold', 'valid'), invalid as any], f.node, 2)).rejects.toThrow()
  expect(() => resetPortableCancellation()).not.toThrow()
  expect(readdirSync(f.directory).sort()).toEqual(['index.mjs', 'package.json'])
})

test('a family whose canonical source the renderer rejects is unsupported and none of its cases run', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'portable-family-support-'))
  directories.push(directory)
  const tool = join(directory, 'tool'), calls = join(directory, 'calls.txt')
  mkdirSync(tool)
  writeFileSync(join(tool, 'package.json'), '{"name":"family-support-fixture","version":"1.0.0","type":"module"}')
  writeFileSync(join(tool, 'index.mjs'), `import{appendFileSync}from'node:fs';export function render(source){appendFileSync(${JSON.stringify(calls)},source.split('\\n')[0]+'\\n');if(!source.startsWith('flowchart'))throw Error('Invalid mermaid header');return{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Alpha Beta Gamma</text></svg>'}}`)
  // The compiled kit measures without Git; the source runner requires committed protocol files.
  const kit = join(directory, 'kit')
  execFileSync(process.execPath, [join(portableDirectory, 'build.ts'), '--out', kit], { stdio: 'ignore' })
  const { runPortable } = await import(pathToFileURL(join(kit, 'run.mjs')).href)
  const options = parsePortableOptions(['--project', 'fixture/family-support', '--artifact-root', tool, '--entry', 'index.mjs', '--cohort', 'family', '--rounds', '1', '--samples', '1', '--cold-samples', '1', '--min-sample-ms', '0', '--preparation-concurrency', '1', '--out', join(directory, 'out'), '--records', join(directory, 'records'), '--allow-partial'])
  const report = await runPortable({ ...options, observer: undefined })
  if (!('summary' in report)) throw Error('Expected a measured report')
  const families: string[] = report.summary.familyTimings.map((row: { family: string }) => row.family)
  expect(report.summary.counts.unsupportedFamilies).toEqual(families.filter((family: string) => family !== 'flowchart'))
  expect(report.summary.status).not.toBe('failed')
  // Each rejected family's source reached the renderer once, as its probe; no measured case ran.
  const rejectedCalls = readFileSync(calls, 'utf8').split('\n').filter(line => line && !line.startsWith('flowchart'))
  expect(rejectedCalls).toHaveLength(families.length - 1)
  const record = readProjectBenchmarkRecord(join(report.evidenceDirectory, 'result.json.gz'))
  const pie = record.observations.filter(row => row.family === 'pie')
  expect(pie.map(row => [row.operation, row.status])).toEqual([['family-support', 'unsupported'], ['render', 'unsupported']])
  expect(pie[1]!.detail).toContain('Invalid mermaid header')
  expect(record.observations.filter(row => row.family === 'flowchart' && row.operation === 'family-support').map(row => row.status)).toEqual(['passed'])
  const subset = await runPortable({ ...options, caseIds: ['family:flowchart'], out: join(directory, 'subset'), observer: undefined })
  const current = inspectCurrentProjectRecords(options.records).map(item => item.record)
  expect(current.find(item => item.identity.lane === 'portable-svg')?.id).toBe(record.id)
  expect(current.find(item => item.identity.lane === 'portable-svg-subset')?.id).toBe(subset.recordId)
  expect(subset.sampling.caseSelection).toEqual({ scope: 'explicit subset; no whole-portfolio score', requestedIds: ['family:flowchart'], selectedIds: ['family:flowchart'] })
  expect(subset.summary.counts).toMatchObject({ cases: 1, families: 1, canonicalFamilyRepresentatives: 1 })
}, 60_000)

test('v7 admits its declared five-process median profile without upgrading historical v6 qualification', () => {
  const cases = [{ id: 'versioned-sampler', family: 'flowchart', cohort: 'family' as const, source: 'flowchart LR\nA', expected: { accept: true, labels: ['A'] } }]
  const results: PortableWorkerResult[] = []
  for (let round = 1; round <= 6; round++) for (const replica of ['A0', 'A1', 'B'] as const) for (let sample = 0; sample < 5; sample++) results.push({
    protocol: 'portable-svg-processes-v7', caseId: cases[0]!.id, family: 'flowchart', mode: 'cold', round, replica, sample, status: 'passed', importMs: 1, tracks: { 'first-use': [1] }, outputBytes: 40,
    qualification: { accepted: true, passed: true, semanticComplete: true, checks: [], unmeasuredScopes: [], scope: 'fixture', evidence: { outputAdmission: 'passed', nativeModel: 'unavailable', nativeAndPaintScopes: [] } } as any,
    prelude: [], runtime: { executable: '/fixture/node', node: '24', platform: 'linux', arch: 'x64' },
  })
  const settings = { rounds: 6, samples: 31, coldSamples: 5, maximumControlSpread: .25 }
  const first = portableSummary(cases, results, settings).timing.find(row => row.track === 'first-use')!
  expect(first.outputCalibration.status).toBe('calibrated')
  expect(first.outputCalibration.roundRatioUncertainty?.replicaB.interval).not.toBeNull()
  const legacy = portableSummary(cases, results.map(row => ({ ...row, protocol: 'portable-svg-processes-v6' })), settings)
  expect(legacy.timing.find(row => row.track === 'first-use')!.outputCalibration.status).toBe('uncalibrated')
  const invalid = portableCases(['invalid'])
  expect(portableSummary(invalid, [], settings).timing).toHaveLength(0)
})

test('invalid controls retain one real public invocation without repeated timing or resource workers', async () => {
  const invalid = portableCases(['invalid']).find(row => row.id === 'invalid:unknown-header')!
  for (const rejected of [true, false]) {
    const fixture = workerFixture(`import{appendFileSync}from'node:fs';export function render(){appendFileSync(new URL('./calls.txt',import.meta.url),'call\\n');${rejected ? 'throw new Error("Parse error on line 1: invalid source")' : 'return {svg:good}'}}`)
    const options = parsePortableOptions(['--project', 'fixture/api', '--artifact-root', fixture.directory, '--rounds', '2', '--samples', '1', '--cold-samples', '1'])
    const results: PortableWorkerResult[] = []
    await measurePortableProject(fixture.job('warm').artifact, [invalid], options, fixture.directory, result => results.push(result), new CollectionCheckpoint(fixture.directory, { fixture: 'invalid-control' }))
    expect(results).toHaveLength(1)
    expect(results[0]!.mode).toBe('warm')
    expect(results[0]!.qualification?.accepted).toBe(!rejected)
    expect(results[0]!.status).toBe(rejected ? 'passed' : 'failed')
    expect(readFileSync(join(fixture.directory, 'calls.txt'), 'utf8').trim().split('\n')).toHaveLength(1)
    const summary = portableSummary([invalid], results, { ...options, usage: undefined })
    expect(summary.timing).toHaveLength(0)
    expect(summary.counts.negativeAdmissionCases).toBe(rejected ? 1 : 0)
    expect(summary.counts.failedWorkers).toBe(rejected ? 0 : 1)
  }
}, 30_000)

test('a budget-paused portable invocation resumes its existing attempt directory', async () => {
  const fixture = workerFixture('export function render(){throw new Error("Parse error on line 1: invalid source")}')
  const tool = join(fixture.directory, 'tool'); mkdirSync(tool)
  for (const name of ['package.json', 'index.mjs']) writeFileSync(join(tool, name), readFileSync(join(fixture.directory, name)))
  const kit = join(fixture.directory, 'kit')
  execFileSync(process.execPath, [join(portableDirectory, 'build.ts'), '--out', kit], { stdio: 'ignore' })
  const { runPortable } = await import(pathToFileURL(join(kit, 'run.mjs')).href)
  const options = { ...parsePortableOptions(['--project', 'fixture/api', '--artifact-root', tool, '--entry', 'index.mjs', '--cases', 'invalid:unknown-header', '--rounds', '1', '--samples', '1', '--cold-samples', '1', '--out', join(fixture.directory, 'out'), '--records', join(fixture.directory, 'records'), '--allow-partial']), observer: undefined }
  await expect(runPortable({ ...options, collectionDeadline: Date.now() - 1 })).rejects.toThrow('Collection budget exhausted')
  const paused = JSON.parse(readFileSync(join(options.out, 'report.json'), 'utf8'))
  expect(paused.status).toBe('budget-exhausted')
  expect(existsSync(join(options.out, 'attempts', paused.pendingAttempt, 'svg'))).toBe(true)
  const resumed = await runPortable({ ...options, resume: true })
  expect(resumed.recordId).toBe(paused.pendingAttempt)
  expect(resumed.summary.counts.negativeAdmissionCases).toBe(1)
  expect(resumed.summary.timing).toHaveLength(0)
  const record = readProjectBenchmarkRecord(join(resumed.evidenceDirectory, 'result.json.gz'))
  expect(record.observations.map(row => [row.operation, row.status, row.samplesMs])).toEqual([['admission', 'passed', undefined]])
}, 30_000)
