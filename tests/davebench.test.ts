import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { davebenchBrowserCall, davebenchCliCall, davebenchInputs, davebenchRankings, type DavebenchRun } from '../unified/davebench.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import { defaultChromium } from '../unified/benchmark-context.ts'

const temp = useTempDirs('simple-davebench-')
test('native PNG stdout bindings reach a discard device without retaining an output file', async () => {
  const root = temp.dir(), fixture = join(root, 'export.mjs')
  writeFileSync(fixture, `import { fstatSync } from 'node:fs';
if (process.argv[2] !== '-' || !fstatSync(1).isCharacterDevice()) process.exit(7);
for await (const chunk of process.stdin) {}
process.stdout.write(Buffer.alloc(1024 * 1024));
`)
  const peer: any = { artifact: { executable: 'node', outputBindings: { png: { args: [fixture, '-'] } } } }
  const result = await davebenchCliCall(peer, 'flowchart TD; A-->B', 'png', 5000)
  expect(result.outcome).toBe('completed')
  expect(Object.keys(result).sort()).toEqual(['ms', 'outcome'])
})
test('completion wins before speed, speed breaks equal completion, exact ties share ranks and incomplete runs remain unranked', () => {
  const runs = (project: string, completed: number[], times: number[], format = 'svg'): DavebenchRun[] => completed.map((count, index) => ({ project, version: 'fixture', format, run: index + 1, boundary: 'fixture public API', attempted: 10, completed: count, failed: 10 - count, timeouts: 0, totalMs: times[index]! }))
  const result = davebenchRankings([
    ...runs('fast-partial', [8, 8, 8], [1, 1, 1]),
    ...runs('complete-slow', [10, 10, 10], [100, 100, 100]),
    ...runs('complete-fast', [10, 10, 10], [15, 20, 90]),
    ...runs('complete-tie', [10, 10, 10], [20, 20, 20]),
    ...runs('flaky', [10, 10, 9], [1, 1, 1]),
    ...runs('incomplete', [10, 10], [1, 1]),
    ...runs('png-only', [10, 10, 10], [1, 1, 1], 'png'),
  ], 10)
  expect(result.svg.map(row => [row.project, row.rank, row.completed])).toEqual([
    ['complete-fast', 1, 10], ['complete-tie', 1, 10], ['complete-slow', 3, 10], ['flaky', 4, 9], ['fast-partial', 5, 8],
  ])
  expect(result.png.map(row => [row.project, row.rank])).toEqual([['png-only', 1]])
  expect(result.unranked.map(row => row.project)).toEqual(['incomplete'])
})
test('documentation extraction retains duplicate blocks and excludes a Mermaid fence inside a Markdown example', () => {
  const root = temp.dir(); mkdirSync(join(root, 'docs'))
  writeFileSync(join(root, 'docs/example.md'), '```mermaid\ngraph LR; A-->B\n```\n```mermaid-example\ngraph LR; A-->B\n```\n````markdown\n```mermaid\nnot a separate block\n```\n````\n')
  execFileSync('git', ['init', '--quiet'], { cwd: root }); execFileSync('git', ['add', '.'], { cwd: root })
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'Fixture docs'], { cwd: root })
  const inputs = davebenchInputs(root, 'HEAD')
  expect(inputs.cases).toHaveLength(2)
  expect(inputs.cases[0]!.source).toBe(inputs.cases[1]!.source)
})
test('the browser runner awaits completion, includes failed-call time and returns no output or drawing verdict', async () => {
  const browser = await chromium.launch({ executablePath: process.env.AM_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium), headless: true })
  try {
    const page = await browser.newPage()
    await page.evaluate(() => { (globalThis as any).__fidelityCommunity = { render: async (source: string) => { await new Promise(done => setTimeout(done, 20)); if (source === 'reject') throw Error('Expected fixture failure'); return '' } } })
    const complete = await page.evaluate(davebenchBrowserCall, { source: 'empty public return', id: 'fixture', format: 'svg' })
    expect(complete.outcome).toBe('completed'); expect(complete.ms).toBeGreaterThanOrEqual(15)
    expect(Object.keys(complete).sort()).toEqual(['ms', 'outcome'])
    const failed = await page.evaluate(davebenchBrowserCall, { source: 'reject', id: 'fixture', format: 'svg' })
    expect(failed.outcome).toBe('error'); expect(failed.ms).toBeGreaterThanOrEqual(15)
    await page.evaluate(() => { (globalThis as any).__davebenchNativePng = async () => { await new Promise(done => setTimeout(done, 20)); (globalThis as any).__pngCompleted = true; return new Blob(['fixture bytes']) } })
    const png = await page.evaluate(davebenchBrowserCall, { source: 'PNG fixture', id: 'fixture', format: 'png' })
    expect(png.outcome).toBe('completed'); expect(png.ms).toBeGreaterThanOrEqual(15)
    expect(await page.evaluate(() => (globalThis as any).__pngCompleted)).toBe(true)
    expect(Object.keys(png).sort()).toEqual(['ms', 'outcome'])
  } finally { await browser.close() }
})
