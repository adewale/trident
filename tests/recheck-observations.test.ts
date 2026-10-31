import { expect, test } from 'bun:test'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import { planFidelityCriteria } from '../fidelity/ledger.ts'
import { assessSvgCases, makeSvgObservationBinding } from '../fidelity/svg-assessment.ts'
import { recheckRendering, recheckFeaturePaint, recheckFeatureAdmission, invalidateRetainedSvgChecks, bindRetainedAuthoredSvgReturn } from '../unified/recheck-rendering.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import type { BenchmarkObservation } from '../unified/types.ts'
import { planRetainedSvgRegrade, retainedSvgStimulus, readRetainedPreparationInput, retainedObserverAssets, retainedImagePrerequisites, retainedSvgResourcePolicy, routeRetainedObserver, requireRetainedDocsSvgReturn, retainedDocsSvgOwnershipContext } from '../unified/recheck-inputs.ts'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { chromiumExecutable } from './helpers/environment.ts'
import { inspectFidelityPaint } from '../fidelity/paint.ts'
import { inspectQuantitativePaint } from '../fidelity/paint-values.ts'
import { inspectSourceFacts, mergePaintChecks } from '../fidelity/paint-facts.ts'
import { inspectChartFacts } from '../fidelity/paint-chart-facts.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { CollectionCheckpoint } from '../portable/checkpoint.ts'
import { gzipSync, gunzipSync } from 'node:zlib'
import { communityCliRequest, communityCliBinding } from '../unified/community-cli-request.ts'

const input = expandedFidelityCases()[0]!, project = 'fixture/renderer'
const binding = makeSvgObservationBinding(input, evidenceBytesDigest('synthetic retained output bytes'), evidenceBytesDigest('synthetic observer identity'))
const prior = () => planFidelityCriteria([input]).filter(item => item.surface !== 'native-public-api').map(item => ({ suite: 'fidelity', surface: item.surface, runtime: 'fixture', family: item.family, caseId: input.id + ':' + item.criterion, operation: item.criterion, format: 'svg', mode: 'fixture', status: 'passed', metrics: { implementation: project, authoredCase: input.id, ...binding } }) as BenchmarkObservation)
const at = '2026-01-01T00:00:00Z'
const bindings = { [input.id]: binding }

test('an observer exception cannot preserve a prior correct SVG verdict', async () => {
  const before = prior(), saved = JSON.stringify(before)
  expect(assessSvgCases([input], before, bindings)[0]!.status).toBe('correct')
  const result = await recheckFeaturePaint(input, project, before, async () => { throw Error('Injected observer failure') }, at, true, binding)
  expect(result.completed).toBe(false)
  expect(result.error).toContain('Injected observer failure')
  expect(assessSvgCases([input], result.observations, bindings)[0]!.status).toBe('unknown')
  const paint = result.observations.filter(row => row.surface === 'browser-owned-ink')
  expect(paint.length).toBeGreaterThan(0)
  expect(paint.every(row => row.status === 'blocked' && row.metrics?.originalCriterionStatus === 'passed' && row.metrics?.observerError)).toBe(true)
  expect(JSON.stringify(before)).toBe(saved)
})

test('an omitted new criterion cannot borrow the old passing check', async () => {
  const before = prior(), required = planFidelityCriteria([input]).filter(item => item.surface === 'browser-owned-ink'), omitted = required[0]!.criterion
  const result = await recheckFeaturePaint(input, project, before, async () => required.filter(item => item.criterion !== omitted).map(item => ({ criterion: item.criterion, status: 'passed', expected: true, actual: true, scope: 'Synthetic fresh checker control' })), at, true, binding)
  expect(result.completed).toBe(true)
  expect(result.observations.find(row => row.operation === omitted)!.status).toBe('blocked')
  expect(assessSvgCases([input], result.observations, bindings)[0]!.status).toBe('unknown')
})

test('duplicate checker coordinates invalidate the whole new observation', async () => {
  const check = { criterion: 'svg-root', status: 'passed' as const, expected: true, actual: true, scope: 'Synthetic duplicate' }
  const result = await recheckFeaturePaint(input, project, prior(), async () => [check, check], at, true, binding)
  expect(result.completed).toBe(false)
  expect(result.error).toContain('duplicate')
  expect(result.observations.filter(row => row.surface === 'browser-owned-ink').every(row => row.status === 'blocked')).toBe(true)
})

test('fresh failing evidence replaces an earlier pass and missing previous rows are constructed', async () => {
  const required = planFidelityCriteria([input]).filter(item => item.surface === 'browser-owned-ink'), failed = required[0]!.criterion
  const before = prior().filter(row => row.surface !== 'browser-owned-ink')
  const result = await recheckFeaturePaint(input, project, before, async () => required.map(item => ({ criterion: item.criterion, status: item.criterion === failed ? 'failed' : 'passed', expected: true, actual: item.criterion !== failed, scope: 'Synthetic fresh evidence' })), at, true, binding)
  expect(result.observations.find(row => row.operation === failed)!.status).toBe('failed')
  expect(assessSvgCases([input], result.observations, bindings)[0]!.status).toBe('incorrect')
})



const freshPaint = () => planFidelityCriteria([input]).filter(item => item.surface === 'browser-owned-ink').map(item => ({ criterion: item.criterion, status: 'passed' as const, expected: true, actual: true, scope: 'Independent checker protocol control' }))
test('historical unplanned diagnostics do not contaminate a fresh grade or erase another project', async () => {
  const old = { ...prior().find(row => row.surface === 'browser-owned-ink')!, operation: 'old-diagnostic', caseId: input.id + ':old-diagnostic', status: 'failed' as const }, other = { ...old, metrics: { ...old.metrics, implementation: 'fixture/other-project' } }, before = [...prior(), old, other], saved = JSON.stringify(before)
  const result = await recheckFeaturePaint(input, project, before, async () => freshPaint(), at, true, binding)
  expect(result.observations.filter(row => row.metrics?.implementation === project).some(row => row.operation === 'old-diagnostic')).toBe(false)
  expect(result.observations.find(row => row.metrics?.implementation === 'fixture/other-project')).toEqual(other)
  expect(assessSvgCases([input], result.observations.filter(row => row.metrics?.implementation === project), bindings)[0]!.status).toBe('correct')
  expect(JSON.stringify(before)).toBe(saved)
})
test('fresh unplanned adverse findings withhold the certificate even when every required criterion passes', async () => {
  for (const status of ['failed', 'unavailable'] as const) {
    const result = await recheckFeaturePaint(input, project, prior(), async () => [...freshPaint(), { criterion: 'new-unplanned-adverse-finding', status, expected: 'Independent observed postcondition', actual: false, scope: 'Fresh adverse protocol control' }], at, true, binding)
    const finding = result.observations.find(row => row.operation === 'new-unplanned-adverse-finding')!
    expect(finding.status).toBe(status === 'unavailable' ? 'blocked' : 'failed')
    expect(finding.metrics?.observerSha256).toBe(binding.observerSha256)
    expect(finding.metrics?.recheckObservation).toBe('observed-unplanned')
    expect(assessSvgCases([input], result.observations, bindings)[0]).toMatchObject({ status: 'unknown', profileStatus: 'correct', evidence: { status: 'unknown' } })
  }
})
test('fresh paint cannot reuse historical identities when its binding is absent or stale', async () => {
  await expect(recheckFeaturePaint(input, project, prior(), async () => freshPaint(), at, true, undefined as any)).rejects.toThrow('requires its actual')
  await expect(recheckFeaturePaint(input, project, prior(), async () => freshPaint(), at, true, { ...binding, sourceSha256: '0'.repeat(64) })).rejects.toThrow('stale')
})

test('retained admission is newly checked from the actual receipt and source, while preludes receive no new evidence', () => {
  const testCase = expandedFidelityCases().find(item => item.prelude?.length)!, fresh = makeSvgObservationBinding(testCase, evidenceBytesDigest('retained SVG'), evidenceBytesDigest('current observer'))
  const rows = planFidelityCriteria([testCase]).filter(item => item.surface === 'browser-public-api').map(item => ({ suite: 'fidelity', surface: item.surface, runtime: 'fixture', family: testCase.family, caseId: testCase.id + ':' + item.criterion, operation: item.criterion, format: 'svg', mode: 'fixture', status: 'blocked', metrics: { implementation: project, authoredCase: testCase.id } }) as BenchmarkObservation)
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40"/></svg>'
  const checked = recheckFeatureAdmission(testCase, project, rows, svg, 'returned', fresh, at)
  expect(checked.find(row => row.operation === 'public-svg-admission')!.status).toBe('passed')
  expect(checked.find(row => row.operation === 'public-svg-admission')!.metrics!.sourceSha256).toBe(fresh.sourceSha256)
  expect(checked.filter(row => row.operation.startsWith('prelude-')).every(row => row.status === 'blocked' && row.metrics?.observerSha256 === undefined)).toBe(true)
  const absent = recheckFeatureAdmission(testCase, project, rows, svg, undefined, fresh, at)
  expect(absent.filter(row => !row.operation.startsWith('prelude-')).every(row => row.status === 'blocked')).toBe(true)
})

test('fresh grading permits enriched contracts but freezes every public source/options/prelude stimulus', () => {
  const legacy = { ...input, expected: { labels: input.expected.labels }, sourceReview: undefined, paint: undefined }
  const plan = planRetainedSvgRegrade([legacy], [input])
  expect(plan.originalContractsSha256).not.toBe(plan.gradingContractsSha256)
  expect(plan.stimulusSha256).toBe(evidenceDigest([retainedSvgStimulus(input)]))
  expect(plan.cases[0]!.gradingContract.expectationsSha256).toBe(makeSvgObservationBinding(input, 'a'.repeat(64), 'b'.repeat(64)).expectationsSha256)
  // A newly derived paint assertion is an observer change, never another call.
  expect(() => planRetainedSvgRegrade([legacy], [{ ...input, paint: { nodeFill: '#ffffff', fontSize: 24 } }])).not.toThrow()
  for (const altered of [
    { ...input, source: input.source + '\nC --> A' }, { ...input, family: 'state' },
    { ...input, renderOptions: { fontSize: 24 } }, { ...input, prelude: [{ source: 'flowchart LR\nX-->Y', accept: true }] },
  ]) expect(() => planRetainedSvgRegrade([legacy], [altered])).toThrow('stimuli changed')
  const configured = expandedFidelityCases().find(item => item.renderOptions?.fontSize)!
  expect(() => planRetainedSvgRegrade([configured], [{ ...configured, renderOptions: { fontSize: 33 } }])).toThrow('stimuli changed')
  expect(() => planRetainedSvgRegrade([input, input], [input])).toThrow('duplicate')
})

test('old partial contracts receive only freshly observed full-source SVG checks, preserving bytes and original attempt IDs', async () => {
  const svg = readFileSync(new URL('./fixtures/fidelity/mermaid-flowchart-drop-shadow.svg', import.meta.url), 'utf8')
  const legacy = { ...input, expected: { labels: input.expected.labels }, sourceReview: undefined }, attemptId = 'retained-original-attempt'
  const oldBinding = makeSvgObservationBinding(legacy, evidenceBytesDigest(svg), 'c'.repeat(64))
  const previous = planFidelityCriteria([legacy]).filter(item => item.surface !== 'native-public-api').map(item => ({ suite: 'fidelity', surface: item.surface, runtime: 'fixture', family: item.family, caseId: input.id + ':' + item.criterion, operation: item.criterion, format: 'svg', mode: 'fixture', status: 'passed', metrics: { implementation: project, authoredCase: input.id, rawInvocationId: attemptId, ...oldBinding } }) as BenchmarkObservation)
  const saved = JSON.stringify(previous), entry = { caseId: input.id, family: input.family, publicResult: { kind: 'returned' }, svgEvidence: { sha256: evidenceBytesDigest(svg), encoding: 'gzip', bytes: Buffer.byteLength(svg) } }
  planRetainedSvgRegrade([legacy], [input])
  const owningReturn = bindRetainedAuthoredSvgReturn(legacy, entry, project, previous, svg)
  expect(owningReturn.sourceSha256).toBe(evidenceBytesDigest(input.source))
  expect(() => bindRetainedAuthoredSvgReturn(legacy, { ...entry, publicResult: {} }, project, previous, svg)).toThrow('receipt/source')
  expect(() => bindRetainedAuthoredSvgReturn(legacy, entry, 'fixture/other', previous, svg)).toThrow('contradicts')
  const freshBinding = makeSvgObservationBinding(input, evidenceBytesDigest(svg), 'd'.repeat(64))
  let rows = invalidateRetainedSvgChecks(previous, at)
  expect(rows.every(row => row.status === 'blocked' && row.metrics?.expectationsSha256 === undefined && row.metrics?.observerSha256 === undefined)).toBe(true)
  rows = recheckFeatureAdmission(input, project, rows, svg, 'returned', freshBinding, at)
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  try {
    const page: any = await browser.newPage()
    await page.setContent(svg)
    const paint = await page.evaluate(inspectFidelityPaint, { family: input.family, expected: input.expected, paint: input.paint })
    const quantitative = await page.evaluate(inspectQuantitativePaint, { family: input.family, expected: input.expected, source: input.source, nodes: paint.nodes as NonNullable<Parameters<typeof inspectQuantitativePaint>[0]['nodes']> })
    const facts = await page.evaluate(inspectSourceFacts, { family: input.family, source: input.source, expected: input.expected, paint, quantitative })
    const charts = await page.evaluate(inspectChartFacts, { family: input.family, source: input.source, expected: input.expected, paint, quantitative })
    const checked = await recheckFeaturePaint(input, project, rows, async () => mergePaintChecks(paint.checks, quantitative, facts, charts), at, true, freshBinding)
    expect(assessSvgCases([input], checked.observations, { [input.id]: freshBinding })[0]!.status).toBe('correct')
    expect(checked.observations.find(row => row.operation === 'source-fact:direction')?.metrics?.expectationsSha256).toBe(freshBinding.expectationsSha256)
    expect(checked.observations.filter(row => row.metrics?.rawInvocationId).every(row => row.metrics?.rawInvocationId === attemptId)).toBe(true)
    expect(JSON.stringify(previous)).toBe(saved)
    expect(evidenceBytesDigest(svg)).toBe(owningReturn.svgSha256)
  } finally { await browser.close() }
})

function frozenAssets(root: string) {
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==', 'base64'), sha256 = evidenceBytesDigest(image)
  mkdirSync(join(root, 'preparation/blobs'), { recursive: true })
  writeFileSync(join(root, 'preparation/blobs', sha256), image)
  const resources = [{ url: 'https://images.example.test/owned.png', path: 'blobs/' + sha256, sha256, contentType: 'image/png' }]
  const manifest = JSON.stringify(resources)
  writeFileSync(join(root, 'preparation/docs-resources.json'), manifest)
  writeFileSync(join(root, 'preparation.json'), JSON.stringify({ schema: 'trident-campaign-preparation-v1', files: { docsResources: { path: 'preparation/docs-resources.json', sha256: evidenceBytesDigest(manifest) }, ['artifact:' + sha256]: { path: 'preparation/blobs/' + sha256, sha256 } } }))
  return { sha256, image, resources }
}

test('moved archives load exact frozen image bytes under an image-only CSP and never borrow unowned resources', async () => {
  const root = mkdtempSync(join(tmpdir(), 'recheck-images-')), before = join(root, 'before'), moved = join(root, 'moved')
  try {
    const fixture = frozenAssets(before)
    cpSync(before, moved, { recursive: true }); rmSync(before, { recursive: true })
    const assets = retainedObserverAssets(moved), gaps: string[] = []
    expect(assets.manifestSha256).toBe(readRetainedPreparationInput(moved, 'docsResources').sha256)
    expect(assets.policy).toContain("script-src 'none'")
    expect(assets.policy).toContain("connect-src 'none'")
    expect(assets.policy).toContain('https://images.example.test/owned.png')
    const authored = { ...input, paint: { images: [{ href: fixture.resources[0]!.url, count: 1 }] } }
    expect(retainedImagePrerequisites(authored, assets)).toEqual([])
    expect(retainedImagePrerequisites({ ...authored, paint: { images: [{ href: 'https://unowned.example.test/other.png', count: 1 }] } }, assets)[0]).toContain('no owned frozen')
    const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
    try {
      const context = await browser.newContext({ serviceWorkers: 'block' })
      await context.route('**/*', route => routeRetainedObserver(route, assets, undefined, gaps))
      const page = await context.newPage()
      await page.goto('http://trident.invalid/observer')
      await page.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><image href="https://images.example.test/owned.png" width="40" height="40"/></svg><script>globalThis.untrustedScriptRan=true</script>')
      expect(await page.evaluate(async () => { const image = new Image(); image.src = 'https://images.example.test/owned.png'; await image.decode(); return image.naturalWidth })).toBe(1)
      expect(await page.evaluate(() => (globalThis as any).untrustedScriptRan)).toBeUndefined()
      expect(gaps).toEqual([])
    } finally { await browser.close() }
    rmSync(join(moved, 'preparation/blobs', fixture.sha256))
    writeFileSync(join(root, 'foreign'), fixture.image); symlinkSync(join(root, 'foreign'), join(moved, 'preparation/blobs', fixture.sha256))
    expect(retainedImagePrerequisites(authored, retainedObserverAssets(moved))[0]).toContain('symlink escapes')
    expect(() => retainedObserverAssets(moved).blob(fixture.sha256)).toThrow('symlink escapes')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('old absolute font URLs require sealed peer bytes and exact policy sources', () => {
  const root = mkdtempSync(join(tmpdir(), 'recheck-fonts-'))
  try {
    const fixture = frozenAssets(root), assets = retainedObserverAssets(root)
    const peer = { browser: { root: '/original/renderer', files: [{ path: '/original/renderer/font.woff2', sha256: fixture.sha256 }] } }
    const result = retainedSvgResourcePolicy('<svg><style>@font-face{src:url("http://127.0.0.1:1234/font.woff2")}</style></svg>', assets, peer)
    expect(result.gaps).toEqual([])
    expect(result.policy).toContain("font-src 'self' data: blob: http://127.0.0.1:1234/font.woff2")
    expect(result.policy).not.toContain('127.0.0.1:*')
    expect(retainedSvgResourcePolicy('<svg><style>@font-face{src:url("http://127.0.0.1:1234/other.woff2")}</style></svg>', assets, peer).gaps[0]).toContain('prerequisite unavailable')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('DaveBench regrading requires the original literal-source public return, not another project or round witness', () => {
  const campaign = mkdtempSync(join(tmpdir(), 'recheck-svg-return-')), root = join(campaign, 'docs')
  try {
    const source = { id: 'docs:fixture', source: 'flowchart LR\nA-->B' }, svg = '<svg xmlns="http://www.w3.org/2000/svg"/>'
    const engine = { kind: 'function', root: '/original/renderer', entry: 'api.js', version: 'fixture', artifactSha256: 'a'.repeat(64) }
    const context = { artifacts: [{ project, admission: { root: engine.root, entry: '/original/renderer/api.js', version: engine.version, artifactSha256: engine.artifactSha256 } }] }, inventory = { cases: [source] }
    mkdirSync(join(campaign, 'preparation'), { recursive: true }); mkdirSync(root)
    const files: Record<string, { path: string; sha256: string }> = {}
    for (const [key, path, value] of [['inventories', 'preparation/inventories.json', { docs: inventory }], ['browsers', 'preparation/browsers.json', [{ node: { id: project }, artifact: { transportVariant: 'primary' }, browser: engine }]]] as const) {
      const bytes = JSON.stringify(value); writeFileSync(join(campaign, path), bytes); files[key] = { path, sha256: evidenceBytesDigest(bytes) }
    }
    writeFileSync(join(campaign, 'preparation.json'), JSON.stringify({ schema: 'trident-campaign-preparation-v1', files }))
    writeFileSync(join(root, 'context.json'), JSON.stringify(context))
    const ownership = retainedDocsSvgOwnershipContext(campaign)
    const checkpoint = new CollectionCheckpoint(root, { context, inventory }), journal = new InvocationJournal(join(root, 'invocations'))
    const start = journal.start({ project, caseId: source.id, sourceSha256: evidenceBytesDigest(source.source), artifactSha256: engine.artifactSha256, bindingSha256: evidenceDigest({ format: 'svg', engine, round: 1, variant: 'primary' }), format: 'svg' })
    journal.returned(start, svg, null)
    const raw = { value: { status: 'passed', svg }, invocationId: start.attemptId }
    checkpoint.record(JSON.stringify(['raw-svg', 1, project, 'primary', source.id]), raw)
    const request = { root, project, source, round: 1, variant: 'primary', svg, attemptId: start.attemptId, remap: (path: string) => path, ownership }
    expect(requireRetainedDocsSvgReturn(request).attemptId).toBe(start.attemptId)
    expect(() => requireRetainedDocsSvgReturn({ ...request, source: { ...source, source: source.source + '\nB-->A' } })).toThrow('literal source')
    expect(() => requireRetainedDocsSvgReturn({ ...request, round: 2 })).toThrow('own source/project/round')
    expect(() => requireRetainedDocsSvgReturn({ ...request, project: 'foreign/project' })).toThrow('sealed original')
    expect(() => requireRetainedDocsSvgReturn({ ...request, svg: svg + ' ' })).toThrow('own source/project/round')
    // A copied raw row is not proof that its return occurred at that coordinate.
    checkpoint.record(JSON.stringify(['raw-svg', 2, project, 'primary', source.id]), raw)
    expect(() => requireRetainedDocsSvgReturn({ ...request, round: 2 })).toThrow('frozen engine, round, variant')
    checkpoint.record(JSON.stringify(['raw-svg', 2, project, 'foreign-variant', source.id]), raw)
    expect(() => requireRetainedDocsSvgReturn({ ...request, round: 2, variant: 'foreign-variant' })).toThrow('sealed original')
    const wrongArtifact = journal.start({ ...start.identity, artifactSha256: 'f'.repeat(64), bindingSha256: evidenceDigest({ format: 'svg', engine, round: 3, variant: 'primary' }) })
    journal.returned(wrongArtifact, svg, null)
    checkpoint.record(JSON.stringify(['raw-svg', 3, project, 'primary', source.id]), { ...raw, invocationId: wrongArtifact.attemptId })
    expect(() => requireRetainedDocsSvgReturn({ ...request, round: 3, attemptId: wrongArtifact.attemptId })).toThrow('frozen engine')
    const editedContext = { ...ownership, collectionIdentity: { ...ownership.collectionIdentity, context: { ...context, altered: true } } }
    expect(() => requireRetainedDocsSvgReturn({ ...request, ownership: editedContext })).toThrow('header identity')
  } finally { rmSync(campaign, { recursive: true, force: true }) }
})

test('native CLI SVG replay preserves the original subset render ID, inner process round and frozen output variant after moving', () => {
  const base = mkdtempSync(join(tmpdir(), 'recheck-svg-cli-')), campaign = join(base, 'original'), moved = join(base, 'moved'), root = join(campaign, 'docs')
  try {
    const source = { id: 'docs:second-selected', source: 'flowchart LR\nA-->B' }, other = { id: 'docs:first-selected', source: 'flowchart LR\nX-->Y' }, svg = '<svg xmlns="http://www.w3.org/2000/svg"/>'
    const native = { kind: 'cli' as const, root: '/original/native', executable: '/original/native/render', version: 'fixture-native', sha256: 'f'.repeat(64), outputBindings: { svg: { args: ['--format', '{format}', '--input', '{input}', '--output', '{output}'], input: 'file' as const } } }
    const context = { selectedCaseIds: [other.id, source.id], artifacts: [{ project, admission: { root: native.root, entry: native.executable, version: native.version, artifactSha256: native.sha256 } }] }, inventory = { cases: [source, other] }
    mkdirSync(join(campaign, 'preparation'), { recursive: true }); mkdirSync(root)
    const files: Record<string, { path: string; sha256: string }> = {}
    for (const [key, path, value] of [
      ['inventories', 'preparation/inventories.json', { docs: inventory }],
      ['browsers', 'preparation/browsers.json', [{ node: { id: project }, artifact: { kind: 'global', additionalCli: [{ id: 'native', outputs: ['svg', 'png'], artifact: native }] }, browser: { kind: 'function', root: '/different/browser', entry: 'public.js', artifactSha256: 'a'.repeat(64) } }]],
      ['variants', 'preparation/variants.json', [{ project, output: 'svg', variant: 'native' }]],
    ] as const) { const bytes = JSON.stringify(value); writeFileSync(join(campaign, path), bytes); files[key] = { path, sha256: evidenceBytesDigest(bytes) } }
    writeFileSync(join(campaign, 'preparation.json'), JSON.stringify({ schema: 'trident-campaign-preparation-v1', files }))
    writeFileSync(join(root, 'context.json'), JSON.stringify(context))
    const request = communityCliRequest(native, 'svg', root)
    expect(request).toMatchObject({ args: ['--format', 'svg', '--input', join(root, 'cli-input.mmd'), '--output', join(root, 'cli-output.svg')], inputMode: 'file', fileOutput: true })
    const checkpoint = new CollectionCheckpoint(root, { context, inventory }), journal = new InvocationJournal(join(root, 'raw-cli-invocations'))
    const start = journal.start({ coordinate: 'round:1', project, caseId: 'docs_2_1', sourceSha256: evidenceBytesDigest(source.source), artifactSha256: native.sha256, bindingSha256: communityCliBinding(native.executable, 'svg', request), format: 'svg' })
    journal.returned(start, svg, null)
    const raw = { value: { status: 'passed', svg, transportObservation: { metrics: { rawInvocationDirectory: journal.directory } } }, invocationId: start.attemptId }
    checkpoint.record(JSON.stringify(['raw-svg', 2, project, 'native', source.id]), raw)
    checkpoint.record(JSON.stringify(['raw-svg', 3, project, 'native', source.id]), raw)
    cpSync(campaign, moved, { recursive: true }); rmSync(campaign, { recursive: true })
    const ownership = retainedDocsSvgOwnershipContext(moved), input = { root: join(moved, 'docs'), project, source, round: 2, variant: 'native', svg, attemptId: start.attemptId, ownership, remap: (path: string) => path.replace(campaign, moved) }
    expect(requireRetainedDocsSvgReturn(input)).toMatchObject({ invokedCaseId: 'docs_2_1', caseId: source.id, round: 2, variant: 'native', attemptId: start.attemptId })
    expect(() => requireRetainedDocsSvgReturn({ ...input, round: 3 })).toThrow('round, variant')
    expect(() => requireRetainedDocsSvgReturn({ ...input, variant: 'primary' })).toThrow('sealed original')
    const wrongSubset = { ...ownership, collectionIdentity: { ...ownership.collectionIdentity, context: { ...context, selectedCaseIds: [source.id, other.id] } } }
    expect(() => requireRetainedDocsSvgReturn({ ...input, ownership: wrongSubset })).toThrow('header identity')
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test('the real archive regrader reuses retained SVGs across contract enrichment and preserves every original view', async () => {
  const root = mkdtempSync(join(tmpdir(), 'recheck-archive-')), collected = join(root, 'collected'), out = join(root, 'regraded'), again = join(root, 'again')
  try {
    const save = (path: string, value: unknown) => { mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, JSON.stringify(value)) }
    const cases = expandedFidelityCases().map(input => ({ ...input, expected: { labels: input.expected.labels }, sourceReview: undefined }))
    const docs = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString())
    const inventories = { fidelity: cases, docs }, browsers: unknown[] = []
    save(join(collected, 'preparation/inventories.json'), inventories)
    save(join(collected, 'preparation/community-browser-prepared.json'), browsers)
    save(join(collected, 'preparation.json'), { schema: 'trident-campaign-preparation-v1', files: Object.fromEntries([['inventories', 'preparation/inventories.json'], ['browsers', 'preparation/community-browser-prepared.json']].map(([key, path]) => [key, { path, sha256: evidenceBytesDigest(readFileSync(join(collected, path!))) }])) })
    save(join(collected, 'docs/inventory.json'), docs)
    const fixture = join(collected, 'fidelity/attempts/original-attempt'), receiptPath = join(fixture, 'community-fidelity-cases.json'), witness = join(fixture, 'actual.svg.gz')
    const svg = readFileSync(new URL('./fixtures/fidelity/mermaid-flowchart-drop-shadow.svg', import.meta.url), 'utf8'), legacy = cases.find(value => value.id === input.id)!
    const oldBinding = makeSvgObservationBinding(legacy, evidenceBytesDigest(svg), 'e'.repeat(64))
    const previous = planFidelityCriteria([legacy]).filter(item => item.surface !== 'native-public-api').map(item => ({ suite: 'fidelity', surface: item.surface, runtime: 'retained fixture', family: item.family, caseId: input.id + ':' + item.criterion, operation: item.criterion, format: 'svg', mode: 'fixture', status: 'passed', metrics: { implementation: project, authoredCase: input.id, rawInvocationId: 'original-attempt-id', ...oldBinding } }) as BenchmarkObservation)
    save(receiptPath, { project, capabilities: { fontOptions: false }, rows: [{ caseId: input.id, family: input.family, publicResult: { kind: 'returned' }, svgEvidence: { path: witness, sha256: evidenceBytesDigest(svg), encoding: 'gzip', bytes: Buffer.byteLength(svg) } }] })
    writeFileSync(witness, gzipSync(svg))
    const finishedAt = '2026-01-01T00:01:00Z', result = { selectedCaseIds: [input.id], finishedAt, observations: previous, svgAssessments: [{ project }], artifacts: [receiptPath] }
    save(join(collected, 'fidelity/result.json'), result)
    const report = { startedAt: at, updatedAt: finishedAt, projects: [project], profile: 'synthetic archive regrade control', rounds: 1, options: { out: collected }, results: [{ suite: 'fidelity', out: join(collected, 'fidelity'), status: 'passed' }] }
    save(join(collected, 'report.json'), report)
    const originals = ['preparation/inventories.json', 'report.json', 'fidelity/result.json', 'fidelity/attempts/original-attempt/community-fidelity-cases.json', 'fidelity/attempts/original-attempt/actual.svg.gz'].map(path => ({ path, sha256: evidenceBytesDigest(readFileSync(join(collected, path))) }))
    const regrade = await recheckRendering(collected, out, undefined, chromiumExecutable)
    expect(regrade.rendererInvocations).toBe(0)
    expect(regrade.originalContractsSha256).not.toBe(regrade.gradingContractsSha256)
    const fresh = JSON.parse(readFileSync(join(out, 'fidelity/result.json'), 'utf8'))
    expect(fresh.svgAssessments[0].cases[0].status).toBe('correct')
    expect(fresh.finishedAt).toBe(finishedAt)
    expect(fresh.observations.filter((row: BenchmarkObservation) => row.metrics?.rawInvocationId).every((row: BenchmarkObservation) => row.metrics?.rawInvocationId === 'original-attempt-id')).toBe(true)
    expect(evidenceDigest(JSON.parse(readFileSync(join(out, regrade.gradingFile), 'utf8')))).toBe(regrade.gradingSha256)
    const collectedResult = evidenceBytesDigest(readFileSync(join(out, 'fidelity/result.collected.json'))), collectedReport = evidenceBytesDigest(readFileSync(join(out, 'report.collected.json')))
    await recheckRendering(out, again, undefined, chromiumExecutable)
    expect(evidenceBytesDigest(readFileSync(join(again, 'fidelity/result.collected.json')))).toBe(collectedResult)
    expect(evidenceBytesDigest(readFileSync(join(again, 'report.collected.json')))).toBe(collectedReport)
    for (const original of originals) expect(evidenceBytesDigest(readFileSync(join(collected, original.path)))).toBe(original.sha256)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 30_000)
