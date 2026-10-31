import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assessTerminalRecord, terminalProfileId } from '../unified/terminal-profile.ts'
import type { TerminalProjectCase } from '../fidelity/terminal-corpus.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('terminal-record-'), project = 'AlexanderGrooff/mermaid-ascii'
const hash = (bytes: string) => createHash('sha256').update(bytes).digest('hex')
function fixture() {
  const directory = temp.dir(), source = 'flowchart LR\nAlpha --> Beta\nBeta --> Gamma', output = readFileSync(new URL('./fixtures/terminal/chain.txt', import.meta.url), 'utf8')
  const cases: TerminalProjectCase[] = [{ id: 'fixture:chain', source, sourceSha256: hash(source), family: 'flowchart', features: [], intent: 'valid', expected: { status: 'independently-reviewed', graph: { nodes: ['Alpha', 'Beta', 'Gamma'].map(id => ({ id, label: id })), edges: [{ source: 'Alpha', target: 'Beta' }, { source: 'Beta', target: 'Gamma' }], layout: [{ before: 'Alpha', after: 'Beta', axis: 'x' }] }, unverifiedFacts: [] }, origins: [] }]
  writeFileSync(join(directory, 'chain.txt'), output)
  const record = { profile: terminalProfileId, inventory: cases.map(input => [input.id, input.sourceSha256]), artifacts: [{ project, version: 'synthetic transport fixture' }], sourceReference: [{ project: 'mermaid-js/mermaid', caseId: 'fixture:chain', declaredGraphMatches: true, role: 'source-reference-only', sourceAccepted: true }], outputs: [{ project, caseId: 'fixture:chain', witness: 'chain.txt', sha256: hash(output) }] }
  return { directory, cases, record }
}
test('terminal regrading uses retained ink and independent facts, not the old admission status', () => {
  const { directory, cases, record } = fixture()
  expect(assessTerminalRecord(record, directory, cases)[0].full).toMatchObject({ correct: 1, incorrect: 0, unknown: 0, planned: 1 })
  const text = readFileSync(join(directory, 'chain.txt'), 'utf8').replace('►', '◄')
  writeFileSync(join(directory, 'chain.txt'), text); record.outputs[0]!.sha256 = hash(text)
  expect(assessTerminalRecord(record, directory, cases)[0].full).toMatchObject({ correct: 0, incorrect: 1, planned: 1 })
})
test('source-reference diagnostics cannot replace or veto independently authored drawing facts', () => {
  const { directory, cases, record } = fixture()
  record.sourceReference[0]!.declaredGraphMatches = false
  record.sourceReference[0]!.sourceAccepted = false
  expect(assessTerminalRecord(record, directory, cases)[0].full).toMatchObject({ correct: 1, planned: 1 })
})
test('a targeted extension regrades without rerunning ASCII while an unmarked cohort still requires it', () => {
  const { directory, cases, record } = fixture(), target = 'fixture/targeted-repair'
  const extension = { ...record, targetedExtension: true, artifacts: [{ project: target, version: 'synthetic fixture' }], outputs: record.outputs.map(output => ({ ...output, project: target })) }
  expect(assessTerminalRecord(extension, directory, cases)[0].full).toMatchObject({ correct: 1, planned: 1 })
  expect(() => assessTerminalRecord({ ...extension, targetedExtension: false }, directory, cases)).toThrow('including Mermaid ASCII')
})
test('omitted work stays in the denominator and unverifiable facts cannot receive a pass', () => {
  const { directory, cases, record } = fixture()
  record.outputs = []
  expect(assessTerminalRecord(record, directory, cases)[0].full).toMatchObject({ correct: 0, unknown: 1, planned: 1 })
  cases[0]!.expected.unverifiedFacts = ['Source requires a display-width observer']
  expect(assessTerminalRecord(record, directory, cases)[0].reviewed.planned).toBe(0)
})
test('typed rejection keeps its own denominator and rejects stale project/source evidence', () => {
  const { directory, cases, record } = fixture(), source = 'not a diagram', invalid = { ...cases[0]!, id: 'fixture:invalid', family: 'invalid', source, sourceSha256: hash(source), intent: 'invalid', expected: { status: 'independently-reviewed', reason: 'Independently no Mermaid family header' } }
  const inputs = [...cases, invalid], typedSourceOutcome = { project, caseId: invalid.id, sourceSha256: invalid.sourceSha256, kind: 'unknown-family', publicBoundary: 'Synthetic typed public parser control', detail: 'UnknownDiagramError', observerSha256: 'b'.repeat(64) }
  const retained = { ...record, inventory: inputs.map(input => [input.id, input.sourceSha256]), outputs: [...record.outputs, { project, caseId: invalid.id, typedSourceOutcome }], sourceReference: [...record.sourceReference, { ...record.sourceReference[0]!, caseId: invalid.id }] }
  expect(assessTerminalRecord(retained, directory, inputs)[0]).toMatchObject({ full: { correct: 1, planned: 1 }, rejection: { correct: 1, planned: 1 } })
  typedSourceOutcome.project = 'different/project'
  expect(() => assessTerminalRecord(retained, directory, inputs)).toThrow('stale')
})
test('changed witnesses, duplicate coordinates, missing reference and changed inventory reject regrading', () => {
  const { directory, cases, record } = fixture()
  record.outputs.push(record.outputs[0]!)
  expect(() => assessTerminalRecord(record, directory, cases)).toThrow('Duplicate')
  record.outputs.pop(); writeFileSync(join(directory, 'chain.txt'), 'untrusted changed bytes')
  expect(() => assessTerminalRecord(record, directory, cases)).toThrow('bytes changed')
  record.outputs = []; record.sourceReference = []
  expect(() => assessTerminalRecord(record, directory, cases)).toThrow('source-reference')
  record.inventory = []
  expect(() => assessTerminalRecord(record, directory, cases)).toThrow('inventory')
})

import { runExternalCommunity } from '../unified/community-external.ts'
test('existing external transport forwards an opt-in raw terminal witness from its completed worker record', async () => {
  const directory = temp.dir(), worker = join(directory, 'synthetic-worker.cjs')
  writeFileSync(worker, `const fs=require('node:fs');const [job,out]=process.argv.slice(2);const tasks=JSON.parse(fs.readFileSync(job));fs.writeFileSync(out,'');for(const w of tasks.workloads){const file=out+'.txt';fs.writeFileSync(file,'retained synthetic transport text');fs.appendFileSync(out,JSON.stringify({workload:w.id,status:'ok',outputFile:file})+'\\n')}`)
  const rows = await runExternalCommunity({ node: { id: 'fixture/terminal-transport', roles: [], outputs: ['terminal'] }, artifact: { kind: 'jsonl-worker', executable: process.execPath, args: [worker], version: 'synthetic-fixture' } }, [{ id: 'transport-only', source: 'source', family: 'flowchart', expectedLabels: [], features: ['retain-output-witness'], provenance: 'synthetic transport test, outside scored corpus' }], 'terminal', 1, { root: directory, out: directory, profile: 'full', rounds: 1, communityCoverageOnce: true })
  expect(rows[0]?.status).toBe('passed')
  expect(typeof rows[0]?.metrics?.outputFile).toBe('string')
  expect(readFileSync(rows[0]!.metrics!.outputFile as string, 'utf8')).toBe('retained synthetic transport text')
})

import { spawnSync } from 'node:child_process'
import { readTerminalCorpus } from '../fidelity/terminal-corpus.ts'
test('public saved-output launcher works in CI without oracle or renderer; collection remains guarded', () => {
  const directory = temp.dir(), out = join(temp.dir(), 'recheck'), corpus = readTerminalCorpus()
  const record: any = { profile: 'terminal-project-corpus-v1', inventory: corpus.cases.map(input => [input.id, input.sourceSha256]), artifacts: [{ project, version: 'synthetic archived fixture' }], outputs: [{ project, caseId: corpus.cases[0]!.id, publicStatus: 'blocked' }], transportObservations: [], sourceReference: corpus.cases.map(input => ({ project: 'mermaid-js/mermaid', caseId: input.id, sourceAccepted: null, declaredGraphMatches: null, role: 'source-reference-only' })), startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T00:00:01Z' }
  const known = '2026-01-01T00:00:00.250Z', transport = '2026-01-01T00:00:00.500Z'
  record.outputs[0].measuredAt = known
  record.outputs.push({ project, caseId: corpus.cases[1]!.id, measuredAt: null, publicStatus: 'blocked' }, { project, caseId: corpus.cases[2]!.id, publicStatus: 'blocked' })
  record.transportObservations.push({ caseId: corpus.cases[2]!.id, metrics: { implementation: project, measuredAt: transport } })
  writeFileSync(join(directory, 'raw.json'), JSON.stringify(record))
  const command = new URL('../commands.ts', import.meta.url).pathname, env = { ...process.env, CI: 'true', GITHUB_ACTIONS: 'true', MERMAID_REFERENCE_DIR: '/missing/terminal-reference', TRIDENT_MERMAID_ORACLE: '' }
  const recheck = spawnSync(process.execPath, [command, 'bench', '--terminal', '--saved-terminal', directory, '--out', out], { env, encoding: 'utf8', timeout: 20_000 })
  expect({ code: recheck.status, stderr: recheck.stderr }).toEqual({ code: 0, stderr: '' })
  const result = JSON.parse(readFileSync(join(out, 'terminal/result.json'), 'utf8'))
  expect(result.terminalAssessments[0]).toMatchObject({ correct: 0, unknown: 116, planned: 116 })
  expect(result.terminalRejectionAssessments[0]).toMatchObject({ correct: 0, unknown: 4, planned: 4 })
  expect(result.terminalProfile.cases).toHaveLength(120)
  expect(result.terminalProfile.drawingCaseIds).toHaveLength(116)
  expect(result.terminalProfile.rejectionCaseIds).toHaveLength(4)
  expect(result.terminalCoverage[0]).toMatchObject({ requested: 3, attempted: 0, notAttempted: 120 })
  const clocks = new Map(result.observations.map((row: any) => [row.caseId, row.metrics.measuredAt]))
  expect(clocks.get(corpus.cases[0]!.id)).toBe(known)
  expect(clocks.get(corpus.cases[1]!.id)).toBeNull()
  expect(clocks.get(corpus.cases[2]!.id)).toBe(transport)
  expect(result.observations.filter((row: any) => ![corpus.cases[0]!.id, corpus.cases[2]!.id].includes(row.caseId)).every((row: any) => row.metrics.measuredAt === null)).toBe(true)
  expect(result.observations.every((row: any) => row.metrics.collectionFrom === record.startedAt && row.metrics.collectionTo === record.finishedAt && row.metrics.observerCheckedAt)).toBe(true)
  expect(result.recheck).toMatchObject({ rendererInvocations: 0, sourceReferenceCalls: 0, originalProfile: 'terminal-project-corpus-v1' })
  expect(result.terminalProfile.id).toBe('terminal-project-corpus-v2')
  expect(result.startedAt).toBe(record.startedAt)
  expect(result.finishedAt).toBe(record.finishedAt)
  const collect = spawnSync(process.execPath, [command, 'bench', '--terminal', '--community-prepared', '/missing/prepared.json', '--out', join(temp.dir(), 'collection')], { env, encoding: 'utf8', timeout: 10_000 })
  expect(collect.status).not.toBe(0)
  expect(collect.stderr).toContain('excluded from CI')
}, 30_000)

import { collectTerminalWorkloads } from '../unified/terminal-profile.ts'
import { prepareCommunity, verifyProvidedCommunityArtifact } from '../unified/community.ts'
import { packageCliVariants } from '../unified/community-cli.ts'
test('preparation freezes the declared package CLI and its dependency closure for terminal-only repair', async () => {
  const directory = temp.dir(), root = join(directory, 'node_modules/fixture-diagram'), dependency = join(directory, 'node_modules/terminal-helper')
  mkdirSync(root, { recursive: true }); mkdirSync(dependency, { recursive: true })
  const text = readFileSync(new URL('./fixtures/terminal/chain.txt', import.meta.url), 'utf8')
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-diagram', version: '1.0.0', type: 'module', bin: { 'fixture-diagram': './cli.js' }, dependencies: { 'terminal-helper': '1.0.0' } }))
  writeFileSync(join(root, 'index.js'), 'export function draw(){throw Error("SVG binding must not be invoked")}')
  writeFileSync(join(root, 'cli.js'), 'import output from "terminal-helper";if(process.argv[2]!=="--ascii")throw Error("binding args missing");process.stdout.write(output)')
  writeFileSync(join(dependency, 'package.json'), JSON.stringify({ name: 'terminal-helper', version: '1.0.0', type: 'module', main: 'index.js' }))
  writeFileSync(join(dependency, 'index.js'), 'export default '+JSON.stringify(text))
  const integrity = 'sha512-synthetic-fixture-lock'
  writeFileSync(join(directory, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/fixture-diagram': { version: '1.0.0', integrity } } }))
  const node = { id: 'fixture/terminal-package-cli', roles: ['renderer'], outputs: ['svg', 'terminal'], benchmark: { adapter: 'declared', package: 'fixture-diagram', version: '1.0.0', outputs: ['svg'], moduleOutputs: ['svg'], api: { svg: { export: 'draw' } }, cli: { bin: 'fixture-diagram', args: ['--ascii'], outputs: ['terminal'] } } }
  const catalog = join(directory, 'catalog.json'), artifacts = join(directory, 'provided.json')
  writeFileSync(catalog, JSON.stringify({ nodes: [node] }))
  writeFileSync(artifacts, JSON.stringify({ [node.id]: { kind: 'node', root, module: join(root, 'index.js'), version: '1.0.0', integrity, sha256: hash(readFileSync(join(root, 'index.js'), 'utf8')) } }))
  const [peer] = await prepareCommunity({ root: directory, out: join(directory, 'preparation'), rounds: 1, profile: 'smoke', communityProjects: [node.id], communityCatalogFile: catalog, communityArtifacts: artifacts, communityArtifactPolicy: 'frozen' })
  expect(peer?.error).toBeUndefined()
  expect(peer?.artifact?.additionalCli?.[0]).toMatchObject({ id: 'node-cli', outputs: ['terminal'], artifact: { version: '1.0.0', input: 'stdin' } })
  expect(packageCliVariants([peer!])).toHaveLength(1)
  verifyProvidedCommunityArtifact(peer!.artifact!)
  const rows = await collectTerminalWorkloads([peer!], [{ id: 'fixture-only', source: 'flowchart LR\nAlpha --> Beta\nBeta --> Gamma', family: 'flowchart', expectedLabels: ['Alpha', 'Beta', 'Gamma'], features: ['retain-output-witness'], provenance: 'Synthetic transport control outside scored corpus' }], { root: directory, out: join(directory, 'collection'), rounds: 1, profile: 'smoke' })
  expect(rows[0]?.rows[0]?.status).toBe('passed')
  expect(rows[0]?.rows[0]?.surface).toBe('cli:end-to-end')
  writeFileSync(join(dependency, 'index.js'), 'export default "changed dependency"')
  expect(() => verifyProvidedCommunityArtifact(peer!.artifact!)).toThrow('closure changed')
})
test('terminal profile reuses a sealed Node binding and skips browser-only capability rows', async () => {
  const directory = temp.dir(), module = join(directory, 'renderer.mjs'), calls = join(directory, 'calls.txt')
  const text = readFileSync(new URL('./fixtures/terminal/chain.txt', import.meta.url), 'utf8')
  writeFileSync(module, `import fs from 'node:fs';export function draw(){fs.appendFileSync(${JSON.stringify(calls)},'call\\n');return ${JSON.stringify(text)}}`)
  const peer = { node: { id: 'fixture/terminal-node', roles: ['renderer'], outputs: ['terminal'], benchmark: { adapter: 'declared', api: { terminal: { export: 'draw' } }, moduleOutputs: ['terminal'] } }, artifact: { kind: 'node' as const, root: directory, module, version: 'synthetic-fixture', sha256: hash(readFileSync(module, 'utf8')) } }
  const workloads = [{ id: 'transport-only', source: 'flowchart LR\nAlpha --> Beta\nBeta --> Gamma', family: 'flowchart', expectedLabels: ['Alpha', 'Beta', 'Gamma'], features: ['retain-output-witness'], provenance: 'Synthetic transport control outside scored corpus' }]
  const records = await collectTerminalWorkloads([peer], workloads, { root: directory, harnessRoot: new URL('..', import.meta.url).pathname, out: directory, profile: 'full', rounds: 1, communityCoverageOnce: true })
  expect(records[0]?.rows[0]?.status).toBe('passed')
  expect(readFileSync(calls, 'utf8')).toBe('call\n')
  expect(readFileSync(records[0]!.rows[0]!.metrics!.outputFile as string, 'utf8')).toBe(text)
  expect(JSON.parse(readFileSync(join(directory, 'community-prepared.json'), 'utf8'))[0].artifact.sha256).toBe(peer.artifact.sha256)
  peer.node.benchmark.moduleOutputs = ['svg']
  const unavailable = await collectTerminalWorkloads([peer], workloads, { root: directory, out: directory, profile: 'full', rounds: 1, communityCoverageOnce: true })
  expect(unavailable[0]?.rows[0]?.mode).toBe('capability')
  expect(unavailable[0]?.rows[0]?.metrics?.firstMs).toBeUndefined()
  expect(readFileSync(calls, 'utf8')).toBe('call\n')
})

test('terminal collection uses an admitted additional CLI for a browser-only primary instead of calling its SVG module', async () => {
  const directory = temp.dir(), executable = join(directory, 'terminal.mjs')
  const text = readFileSync(new URL('./fixtures/terminal/chain.txt', import.meta.url), 'utf8')
  writeFileSync(executable, '#!/usr/bin/env node\nprocess.stdout.write('+JSON.stringify(text)+')')
  chmodSync(executable, 0o755)
  const cli = { kind: 'cli' as const, executable, args: [], input: 'stdin' as const, version: 'synthetic-fixture', sha256: hash(readFileSync(executable, 'utf8')) }
  const peer = { node: { id: 'fixture/additional-terminal', roles: ['renderer'], outputs: ['svg', 'terminal'], benchmark: { adapter: 'declared', outputs: ['svg', 'terminal'], moduleOutputs: ['svg'] } }, artifact: { kind: 'node' as const, root: directory, module: join(directory, 'missing-svg.mjs'), version: 'synthetic-fixture', additionalCli: [{ id: 'native-release', outputs: ['terminal'], artifact: cli }] } }
  const workloads = [{ id: 'transport-only', source: 'flowchart LR\nAlpha --> Beta\nBeta --> Gamma', family: 'flowchart', expectedLabels: ['Alpha', 'Beta', 'Gamma'], features: ['retain-output-witness'], provenance: 'Synthetic transport control outside scored corpus' }]
  const records = await collectTerminalWorkloads([peer], workloads, { root: directory, out: directory, profile: 'full', rounds: 1 })
  expect(records[0]?.rows[0]?.status).toBe('passed')
  expect(readFileSync(records[0]!.rows[0]!.metrics!.outputFile as string, 'utf8')).toBe(text)
  expect(records[0]?.rows[0]?.surface).toBe('cli:end-to-end')
})


test('all-project terminal planning follows normal renderer and branding eligibility without scoring Mermaid as a terminal renderer', () => {
  const planned = spawnSync(process.execPath, [new URL('../commands.ts', import.meta.url).pathname, 'bench', '--terminal', '--all-projects', '--all-inputs', '--plan'], { encoding: 'utf8' })
  expect(planned.status).toBe(0)
  const plan = JSON.parse(planned.stdout)
  expect(plan.selectedProjects).toHaveLength(18)
  expect(plan.selectedProjects).toContain('AlexanderGrooff/mermaid-ascii')
  expect(plan.selectedProjects).not.toContain('mermaid-js/mermaid')
  expect(plan.plannedTerminalCalls).toBe(2160)
  const targeted = spawnSync(process.execPath, [new URL('../commands.ts', import.meta.url).pathname, 'bench', '--terminal', '--projects', 'crafter-station/mermaid,wevm/ondine,Latias94/merman', '--all-inputs', '--plan'], { encoding: 'utf8' })
  expect(targeted.status).toBe(0)
  expect(JSON.parse(targeted.stdout).plannedTerminalCalls).toBe(360)
}, 20_000)
