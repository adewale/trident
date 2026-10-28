import { expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { coverageRows, writeUnifiedReport, type UnifiedReport } from '../unified/report.ts'
import type { UnifiedSuiteResult } from '../unified/types.ts'

test('coverage keeps explicit artifact variants separate when suite and case names match', () => {
  const result = (version: string, variant?: string): UnifiedSuiteResult => ({
    id: 'fidelity', status: 'passed', startedAt: '2026-10-27T00:00:00Z', finishedAt: '2026-10-27T00:00:01Z', gaps: [],
    toolVersions: [{ tool: 'example/renderer', version, source: 'actual artifact fixture', ...(variant ? { variant } : {}) }],
    observations: [{ suite: 'fidelity', surface: 'browser-owned-ink', runtime: 'Chromium', family: 'flowchart', caseId: 'same-authored-case', operation: 'visible-label', format: 'svg', mode: 'independent-criteria', status: 'passed', metrics: { project: 'example/renderer', version, ...(variant ? { variant } : {}) } }],
  })
  const candidate = result('2.0.0'), catalog = result('1.0.0', 'catalog-release')
  const coverage = coverageRows([...candidate.observations, ...catalog.observations])
  expect(coverage).toHaveLength(2)
  expect(new Set(coverage.map(row => row.variant))).toEqual(new Set(['default', 'catalog-release']))
  expect(coverage.every(row => row.cases === 1 && row.statuses.passed === 1)).toBe(true)
  const out = mkdtempSync(join(tmpdir(), 'report-artifact-variants-'))
  try {
    const report: UnifiedReport = {
      schemaVersion: 1, startedAt: candidate.startedAt, profile: 'full', rounds: 5, driverRoot: '/driver', targetRoot: '/candidate', driverDirty: false, targetDirty: false, status: 'passed', policy: 'Explicit comparison roles remain distinct.', exports: { tables: true },
      suites: [candidate, catalog].map((value, index) => ({ id: index ? 'catalog' : 'source', title: value.id, source: 'actual artifact fixtures', policy: 'same authored case, different declared artifact role', target: 'candidate' as const, status: value.status, selected: true, prerequisites: [], result: value })),
    }
    writeUnifiedReport(out, report)
    expect(readBenchmarkDocument(join(out, 'coverage.json')).rows).toHaveLength(2)
    const csv = readFileSync(join(out, 'coverage.csv'), 'utf8').trim().split('\n')
    const variantColumn = csv[0]!.split(',').indexOf('"variant"')
    expect(variantColumn).toBeGreaterThanOrEqual(0)
    expect(new Set(csv.slice(1).map(line => line.split(',')[variantColumn]))).toEqual(new Set(['"default"', '"catalog-release"']))
    const markdown = readFileSync(join(out, 'report.md'), 'utf8')
    expect(markdown).toContain('| Variant |')
    expect(markdown).toContain('| example/renderer | default | 2.0.0 |')
    expect(markdown).toContain('| example/renderer | catalog-release | 1.0.0 |')
    expect(candidate.toolVersions![0]!.version).toBe('2.0.0')
    expect(catalog.toolVersions![0]!.version).toBe('1.0.0')
  } finally { rmSync(out, { recursive: true, force: true }) }
  const defaults = coverageRows(['candidate', 'default'].map((variant, index) => ({ ...candidate.observations[0]!, metrics: { ...candidate.observations[0]!.metrics, variant, round: index + 1 } })))
  expect(defaults).toHaveLength(1)
  expect(defaults[0]!.variant).toBe('default')
  expect(defaults[0]!.statuses.passed).toBe(2)
})

test('report admits observed versions without treating catalog declarations as executions', () => {
  const observed: UnifiedSuiteResult = {
    id: 'community', status: 'blocked', startedAt: '2026-10-28T00:00:00Z', finishedAt: '2026-10-28T00:00:01Z', gaps: [],
    observations: [
      { suite: 'community', surface: 'public-api', runtime: 'Node', family: 'flowchart', caseId: 'rendered', operation: 'render', format: 'svg', mode: 'public-call', status: 'passed', metrics: { project: 'example/renderer', version: '1.0.0' } },
      { suite: 'community', surface: 'catalog:capability', runtime: 'unmeasured', family: '*', caseId: 'capability:png', operation: 'capability', format: 'png', mode: 'capability', status: 'blocked', metrics: { implementation: 'unbound/renderer', measured: false } },
      { suite: 'community', surface: 'catalog', runtime: 'unmeasured', family: '*', caseId: 'unconfigured', operation: 'enroll', format: '*', mode: 'metadata', status: 'blocked', metrics: { implementation: 'unconfigured/renderer' } },
      { suite: 'community', surface: 'catalog:capability', runtime: 'Node', family: '*', caseId: 'declared-only', operation: 'capability', format: 'png', mode: 'capability', status: 'blocked', metrics: { implementation: 'declared/renderer', measured: false } },
      { suite: 'community-browser', surface: 'browser:public-api', runtime: 'Chromium V8', family: '*', caseId: 'heap', operation: 'memory', format: 'svg', mode: 'after-round-1', status: 'passed', metrics: { project: 'example/renderer', jsHeapUsedBytes: 1000 } },
      { suite: 'community', surface: 'cli:end-to-end', runtime: 'Node', family: 'flowchart', caseId: 'rejected', operation: 'render', format: 'svg', mode: 'qualification', status: 'failed', metrics: { project: 'example/renderer', rejected: true } },
    ],
  }
  const report: UnifiedReport = {
    schemaVersion: 1, startedAt: observed.startedAt, profile: 'full', rounds: 5, driverRoot: '/driver', targetRoot: '/candidate', driverDirty: false, targetDirty: false, status: 'incomplete', policy: 'Unavailable capabilities remain gaps.', exports: { tables: true },
    suites: [{ id: 'community', title: 'Public artifacts', source: 'independent fixture', policy: '', target: 'candidate', status: observed.status, selected: true, prerequisites: [], result: observed }],
  }
  const out = mkdtempSync(join(tmpdir(), 'report-declared-capabilities-'))
  try {
    writeUnifiedReport(out, report)
    const coverage = readBenchmarkDocument(join(out, 'coverage.json')).rows
    expect(coverage).toHaveLength(6)
    expect(coverage.filter((row: any) => row.statuses.blocked === 1)).toHaveLength(3)
    const markdown = readFileSync(join(out, 'report.md'), 'utf8')
    expect(markdown).toContain('| example/renderer | default | 1.0.0 |')
    const admitted = markdown.split('## Artifact versions')[1]!.split('## Suites')[0]!
    expect(admitted).not.toContain('unbound/renderer')
    expect(admitted).not.toContain('unconfigured/renderer')
    expect(admitted).not.toContain('declared/renderer')
    expect(coverage.find((row: any) => row.surface === 'cli:end-to-end').statuses.failed).toBe(1)
    observed.observations.push({ ...observed.observations[0]!, caseId: 'other-version', metrics: { project: 'example/renderer', version: '2.0.0' } })
    expect(() => writeUnifiedReport(out, report)).toThrow('Mixed tool versions')
    observed.observations.pop()
    observed.observations[0]!.metrics!.variant = 'catalog-release'
    expect(() => writeUnifiedReport(out, report)).toThrow('Missing artifact version for example/renderer')
    delete observed.observations[0]!.metrics!.variant
    // A broad "ignore missing versions" fix would hide a real execution error.
    observed.observations[0]!.metrics = { project: 'example/renderer' }
    expect(() => writeUnifiedReport(out, report)).toThrow('Missing artifact version for example/renderer')
  } finally { rmSync(out, { recursive: true, force: true }) }
})
