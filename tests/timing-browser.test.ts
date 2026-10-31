import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { browserSvgTimingCases, browserSvgTimingBoundary, observeBrowserTimingSvg, parseBrowserSvgTimingOptions, prepareBrowserSvgTiming } from '../unified/timing-browser.ts'
import { makeSvgCaseContract } from '../fidelity/svg-assessment.ts'
import { constructEvidenceVerdict, evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { publicSvgBrowserAction } from '../unified/public-svg-browser.ts'
import { chromiumExecutable } from './helpers/environment.ts'
setDefaultTimeout(20_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })

test('first-use selection requires full independently authored source contracts and excludes API/prelude workflows', () => {
  expect(browserSvgTimingCases().map(item => item.id)).toEqual(['meaning:family:flowchart'])
  expect(() => browserSvgTimingCases([])).toThrow('unique nonempty')
  expect(() => browserSvgTimingCases(['missing:case'])).toThrow('complete authored')
  expect(() => browserSvgTimingCases(['meaning:family:flowchart:configuration-reset'])).toThrow('excludes prelude')
  expect(browserSvgTimingBoundary).toContain('RPC serialization')
})
test('CLI accepts explicit frozen prepared identities and rejects duplicate or unknown switches', () => {
  expect(parseBrowserSvgTimingOptions(['--prepared', 'input.json', '--baseline', 'fixture/a', '--candidate', 'fixture/b', '--out', 'new-dir', '--cases', 'meaning:family:flowchart', '--rounds', '6'])).toMatchObject({ baseline: 'fixture/a', candidate: 'fixture/b', rounds: 6, caseIds: ['meaning:family:flowchart'] })
  expect(() => parseBrowserSvgTimingOptions(['--prepared', 'one', '--prepared', 'two'])).toThrow('help')
  expect(() => parseBrowserSvgTimingOptions(['--community-force', 'true'])).toThrow('help')
})
test('shared transport string mode returns one actual result and preserves invalid/exception behavior', async () => {
  const page = await browser.newPage()
  try {
    await page.evaluate(() => { (globalThis as any).__fidelityCommunity = { render: () => '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' } })
    expect(await page.evaluate(publicSvgBrowserAction, { type: 'render', source: 'synthetic transport control', id: 'control', returnSvgString: true })).toContain('<svg')
    expect(await page.evaluate(publicSvgBrowserAction, { type: 'render', source: 'synthetic transport control', id: 'control' })).toMatchObject({ kind: 'returned' })
    await page.evaluate(() => { (globalThis as any).__fidelityCommunity.render = () => 42 })
    await expect(page.evaluate(publicSvgBrowserAction, { type: 'render', source: '', id: 'control', returnSvgString: true })).rejects.toThrow('did not return an SVG string')
    expect(await page.evaluate(publicSvgBrowserAction, { type: 'render', source: '', id: 'control' })).toMatchObject({ kind: 'invalid-return' })
    await page.evaluate(() => { (globalThis as any).__fidelityCommunity.render = () => { throw Error('synthetic public exception') } })
    await expect(page.evaluate(publicSvgBrowserAction, { type: 'render', source: '', id: 'control', returnSvgString: true })).rejects.toThrow('synthetic public exception')
    expect(await page.evaluate(publicSvgBrowserAction, { type: 'render', source: '', id: 'control' })).toMatchObject({ kind: 'exception' })
  } finally { await page.close() }
})
test('every retained timed SVG is independently observed; altered arrows, source bindings and resource gaps cannot qualify', async () => {
  const page = await browser.newPage(), authored = browserSvgTimingCases()[0]!, contract = makeSvgCaseContract(authored)
  const svg = readFileSync(new URL('./fixtures/fidelity/mermaid-flowchart-drop-shadow.svg', import.meta.url), 'utf8'), observer = 'a'.repeat(64)
  try {
    const inspect = (value: string, gaps: string[] = []) => observeBrowserTimingSvg(page, authored, contract, Buffer.from(value), observer, gaps)
    const positive = await inspect(svg)
    expect(positive.outputSha256).toBe(evidenceBytesDigest(svg))
    expect(constructEvidenceVerdict(contract, positive).status).toBe('correct')
    expect(constructEvidenceVerdict(contract, await inspect(svg, ['unfrozen runtime resource'])).status).toBe('unknown')
    const hidden = svg.replace('</svg>', '<rect width="10000" height="10000" fill="white" style="pointer-events:none"/></svg>')
    expect(constructEvidenceVerdict(contract, await inspect(hidden)).status).not.toBe('correct')
    await expect(observeBrowserTimingSvg(page, { ...authored, source: authored.source + '\nC-->A' }, contract, Buffer.from(svg), observer)).rejects.toThrow('complete source contract')
  } finally { await page.close() }
})


test('static preparation freezes selected artifact versions, real fonts/resources and complete first-use contracts without rendering', () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-browser-timing-'))
  try {
    const entries = ['reference', 'candidate'].map(name => {
      const root = join(directory, name); mkdirSync(root)
      const code = 'globalThis.FrozenSvg = () => "synthetic unused SVG binding";'
      writeFileSync(join(root, 'entry.js'), code); writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-' + name, version: '1.2.3' }))
      return { node: { id: 'fixture/' + name, outputs: ['svg'] }, artifact: { root, version: '1.2.3' }, browserStatus: 'prepared', browser: { root, entry: 'entry.js', global: 'FrozenSvg', kind: 'function', version: '1.2.3', artifactSha256: evidenceBytesDigest(code), files: [{ path: join(root, 'entry.js'), sha256: evidenceBytesDigest(code) }] } }
    })
    const preparedFile = join(directory, 'prepared.json'); writeFileSync(preparedFile, JSON.stringify(entries))
    const options = { preparedFile, baseline: 'fixture/reference', candidate: 'fixture/candidate', out: join(directory, 'future-output'), executable: chromiumExecutable }
    const frozen = prepareBrowserSvgTiming(options)
    expect(frozen.plan).toMatchObject({ format: 'svg', track: 'first-use', rounds: 6, samplesPerRound: 1 })
    expect(frozen.plan.artifacts.A0).toEqual(frozen.plan.artifacts.A1)
    expect(frozen.provenance.environment.fonts.length).toBeGreaterThan(0)
    expect(frozen.provenance.preparedSha256).toBe(evidenceBytesDigest(readFileSync(preparedFile)))
    writeFileSync(join(directory, 'candidate/entry.js'), 'changed sealed bytes')
    expect(() => prepareBrowserSvgTiming(options)).toThrow('entry bytes changed')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
