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
