import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { davebenchBrowserCall, davebenchInputs } from '../unified/davebench.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import { defaultChromium } from '../unified/benchmark-context.ts'

const temp = useTempDirs('simple-davebench-')
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
