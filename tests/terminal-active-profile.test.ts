import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readActiveTerminalCorpus, terminalActiveProfileId, terminalProfileCorpusForRecord } from '../fidelity/terminal-active-corpus.ts'
import { readTerminalCorpus } from '../fidelity/terminal-corpus.ts'
import { terminalSourceAdaptationStatus } from '../fidelity/terminal-adaptations.ts'
import { assessTerminalRecord } from '../unified/terminal-profile.ts'
import { readCampaign } from '../unified/campaign-publication.ts'
import { campaignTables } from '../unified/campaign-tables.ts'

const adaptationId = 'terminal-adaptation:3bf5fbf5ea7c5486', diagnosticId = 'terminal:9972eaa8ca8692d8'

test('ordinary active corpus preserves all original research and admits only the independently reviewed fresh source identity', () => {
  const original = readTerminalCorpus(), active = readActiveTerminalCorpus()
  expect(original.cases).toHaveLength(120)
  expect(active.cases).toHaveLength(120)
  expect(active.cases.filter(input => input.intent !== 'invalid')).toHaveLength(116)
  expect(active.cases.filter(input => input.intent === 'invalid')).toHaveLength(4)
  expect(active.diagnostics.map(input => input.id)).toEqual([diagnosticId])
  expect(active.cases.some(input => input.id === diagnosticId)).toBe(false)
  const fresh = active.cases.find(input => input.id === adaptationId)!
  expect(terminalSourceAdaptationStatus(fresh).admitted).toBe(true)
  expect(active.cases.filter(input => original.cases.some(parent => parent.id === input.id && parent.source === input.source && parent.sourceSha256 === input.sourceSha256))).toHaveLength(119)
  expect(active.diagnostics[0]!.source).toBe(original.cases.find(input => input.id === diagnosticId)!.source)
  expect(new Set([...active.cases, ...active.diagnostics].map(input => input.id)).size).toBe(121)
  expect(active.cases.filter(input => input.intent === 'invalid').map(input => input.id).sort()).toEqual(active.originals.filter(input => input.intent === 'invalid').map(input => input.id).sort())
})

test('changed membership, missing invalid controls and unheld exclusions cannot silently revise the active corpus', () => {
  const directory = mkdtempSync(join(tmpdir(), 'terminal-active-membership-')), file = join(directory, 'manifest.json'), active = readActiveTerminalCorpus()
  try {
    for (const mutate of [
      (m: any) => { m.diagnostics = [] },
      (m: any) => { m.active.cases.find((row: any) => row.id === adaptationId).sourceSha256 = '0'.repeat(64) },
      (m: any) => { m.active.cases.find((row: any) => row.id === adaptationId).id = diagnosticId },
      (m: any) => { m.active.cases = m.active.cases.filter((row: any) => row.id !== active.cases.find(input => input.intent === 'invalid')!.id) },
      (m: any) => { m.inputs[0].sha256 = '0'.repeat(64) },
      (m: any) => { m.substitutions[0].diagnosticCaseId = active.cases[0]!.id },
    ]) {
      const changed = structuredClone(active.manifest); mutate(changed)
      writeFileSync(file, JSON.stringify(changed))
      expect(() => readActiveTerminalCorpus(file)).toThrow()
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('active records require their named membership identity and cannot inherit old source grades', () => {
  const active = readActiveTerminalCorpus(), original = readTerminalCorpus()
  const record = { profile: terminalActiveProfileId, corpusVersion: active.version, corpusSha256: active.corpusSha256, inventory: active.cases.map(input => [input.id, input.sourceSha256]) }
  expect(terminalProfileCorpusForRecord(record).cases.some(input => input.id === adaptationId)).toBe(true)
  expect(() => terminalProfileCorpusForRecord({ ...record, inventory: original.cases.map(input => [input.id, input.sourceSha256]) })).toThrow('stale corpus membership')
  expect(() => terminalProfileCorpusForRecord({ ...record, corpusSha256: '0'.repeat(64) })).toThrow('stale corpus membership')
  expect(() => assessTerminalRecord({ ...record, profile: 'terminal-project-corpus-v2' }, '.')).toThrow('Saved terminal source inventory differs')
})

test('public planning defaults to active120 and keeps original120 as an explicitly named historical population', () => {
  const command = new URL('../commands.ts', import.meta.url).pathname
  for (const [args, profile, research, diagnostics] of [
    [[], 'terminal-project-corpus-v3', 121, 1],
    [['--corpus', 'original'], 'terminal-project-corpus-v2', 120, 0],
  ] as const) {
    const result = spawnSync(process.execPath, [command, 'bench', '--terminal', '--plan', ...args], { env: { ...process.env, CI: 'true', GITHUB_ACTIONS: 'true' }, encoding: 'utf8', timeout: 15_000 })
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
    const plan = JSON.parse(result.stdout)
    expect(plan).toMatchObject({ profile, sources: 120, drawingCases: 116, invalidControls: 4, researchEntries: research, plannedTerminalCalls: 240, sourceReferenceCalls: 120 })
    expect(plan.diagnostics).toHaveLength(diagnostics)
  }
}, 30_000)

test('public active saved recheck runs without renderers and publishes diagnostics outside every scored population', () => {
  const directory = mkdtempSync(join(tmpdir(), 'terminal-active-recheck-')), out = join(directory, 'rechecked'), active = readActiveTerminalCorpus(), project = 'AlexanderGrooff/mermaid-ascii'
  try {
    const record = { profile: terminalActiveProfileId, corpusVersion: active.version, corpusFile: active.corpusFile, corpusSha256: active.corpusSha256, inventory: active.cases.map(input => [input.id, input.sourceSha256]), artifacts: [{ project, version: 'synthetic uncollected active cohort' }], outputs: [], transportObservations: [], sourceReference: active.cases.map(input => ({ project: 'mermaid-js/mermaid', caseId: input.id, role: 'source-reference-only', sourceAccepted: null })), startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T00:00:01Z' }
    writeFileSync(join(directory, 'raw.json'), JSON.stringify(record))
    const command = new URL('../commands.ts', import.meta.url).pathname
    const result = spawnSync(process.execPath, [command, 'bench', '--terminal', '--saved-terminal', directory, '--out', out], { env: { ...process.env, CI: 'true', GITHUB_ACTIONS: 'true', TRIDENT_MERMAID_ORACLE: '', MERMAID_REFERENCE_DIR: '/missing/terminal-reference' }, encoding: 'utf8', timeout: 20_000 })
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
    const report = JSON.parse(readFileSync(join(out, 'terminal/result.json'), 'utf8'))
    expect(report.terminalProfile).toMatchObject({ id: terminalActiveProfileId, corpusVersion: active.version, researchEntryCount: 121 })
    expect(report.terminalProfile.diagnosticSources.map((input: any) => input.id)).toEqual([diagnosticId])
    expect(report.terminalProfile.drawingCaseIds).toContain(adaptationId)
    expect(report.terminalProfile.drawingCaseIds).not.toContain(diagnosticId)
    expect(report.terminalAssessments[0]).toMatchObject({ planned: 116, correct: 0, incorrect: 0, unknown: 116 })
    expect(report.terminalRejectionAssessments[0]).toMatchObject({ planned: 4, correct: 0, unknown: 4 })
    expect(report.observations.some((row: any) => row.caseId === diagnosticId)).toBe(false)
    expect(report.recheck).toMatchObject({ rendererInvocations: 0, sourceReferenceCalls: 0, originalProfile: terminalActiveProfileId })
    const tables = campaignTables(readCampaign(out), { url: 'https://example.invalid/synthetic-active-corpus', sha256: '0'.repeat(64) })
    const drawing = tables.find(table => table.summary)!
    expect(drawing.rows[0]!.values[drawing.columns.indexOf('Planned')]).toBe(116)
    expect(drawing.caption).toContain('1 source diagnostics are retained separately')
    expect(drawing.rows[0]!.unrankedReason).toBe('No verified terminal drawing observations')
    const invalid = tables.find(table => table.unit === 'invalid-source controls')!
    expect(invalid.rows[0]!.values[invalid.columns.indexOf('Planned')]).toBe(4)
  } finally { rmSync(directory, { recursive: true, force: true }) }
}, 30_000)
