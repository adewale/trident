import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
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
test('omitted work stays in the denominator and unverifiable facts cannot receive a pass', () => {
  const { directory, cases, record } = fixture()
  record.outputs = []
  expect(assessTerminalRecord(record, directory, cases)[0].full).toMatchObject({ correct: 0, unknown: 1, planned: 1 })
  cases[0]!.expected.unverifiedFacts = ['Source requires a display-width observer']
  expect(assessTerminalRecord(record, directory, cases)[0].reviewed.planned).toBe(0)
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
  const record = { profile: terminalProfileId, inventory: corpus.cases.map(input => [input.id, input.sourceSha256]), artifacts: [{ project, version: 'synthetic archived fixture' }], outputs: [{ project, caseId: corpus.cases[0]!.id, publicStatus: 'blocked' }], transportObservations: [], sourceReference: corpus.cases.map(input => ({ project: 'mermaid-js/mermaid', caseId: input.id, sourceAccepted: null, declaredGraphMatches: null, role: 'source-reference-only' })), startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T00:00:01Z' }
  writeFileSync(join(directory, 'raw.json'), JSON.stringify(record))
  const command = new URL('../commands.ts', import.meta.url).pathname, env = { ...process.env, CI: 'true', GITHUB_ACTIONS: 'true', MERMAID_REFERENCE_DIR: '/missing/terminal-reference', TRIDENT_MERMAID_ORACLE: '' }
  const recheck = spawnSync(process.execPath, [command, 'bench', '--terminal', '--saved-terminal', directory, '--out', out], { env, encoding: 'utf8', timeout: 20_000 })
  expect({ code: recheck.status, stderr: recheck.stderr }).toEqual({ code: 0, stderr: '' })
  const result = JSON.parse(readFileSync(join(out, 'terminal/result.json'), 'utf8'))
  expect(result.terminalAssessments[0]).toMatchObject({ correct: 0, unknown: 120, planned: 120 })
  expect(result.terminalCoverage[0]).toMatchObject({ requested: 1, attempted: 0, notAttempted: 120 })
  expect(result.recheck.rendererInvocations).toBe(0)
  const collect = spawnSync(process.execPath, [command, 'bench', '--terminal', '--community-prepared', '/missing/prepared.json', '--out', join(temp.dir(), 'collection')], { env, encoding: 'utf8', timeout: 10_000 })
  expect(collect.status).not.toBe(0)
  expect(collect.stderr).toContain('excluded from CI')
})
