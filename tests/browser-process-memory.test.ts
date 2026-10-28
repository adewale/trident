import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { browserProcessMemory, parseProcessMemory } from '../unified/browser-process-memory.ts'

test('Chromium RSS/PSS ownership deduplicates process IDs and refuses a partial total', async () => {
  const root = mkdtempSync(join(tmpdir(), 'browser-process-memory-'))
  let detached = 0
  const browser = { async newBrowserCDPSession() { return { async send() { return { processInfo: [{ id: 10, type: 'browser' }, { id: 20, type: 'renderer' }, { id: 20, type: 'renderer' }] } }, async detach() { detached++ } } } }
  try {
    for (const [pid, rss, pss] of [[10, 100, 60], [20, 200, 140]]) {
      mkdirSync(join(root, String(pid)))
      writeFileSync(join(root, String(pid), 'smaps_rollup'), `Rss: ${rss} kB\nPss: ${pss} kB\n`)
    }
    const complete = await browserProcessMemory(browser, { platform: 'linux', procRoot: root })
    expect(complete).toMatchObject({ status: 'measured', rssBytes: 300 * 1024, pssBytes: 200 * 1024 })
    expect(complete.processes).toHaveLength(2)
    rmSync(join(root, '20'), { recursive: true })
    const partial = await browserProcessMemory(browser, { platform: 'linux', procRoot: root })
    expect(partial).toMatchObject({ status: 'partial', rssBytes: null, pssBytes: null })
    expect(partial.processes.find(item => item.pid === 10)?.rssBytes).toBe(100 * 1024)
    expect(partial.processes.find(item => item.pid === 20)?.error).toBeDefined()
    expect(detached).toBe(2)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('unsupported platform, invalid counters and failed CDP are explicit unavailable evidence', async () => {
  const browser = { async newBrowserCDPSession(): Promise<never> { throw Error('CDP unavailable') } }
  expect(await browserProcessMemory(browser, { platform: 'darwin' })).toMatchObject({ status: 'unavailable', rssBytes: null, pssBytes: null })
  expect(await browserProcessMemory(browser, { platform: 'linux' })).toMatchObject({ status: 'unavailable', rssBytes: null, detail: 'Error: CDP unavailable' })
  expect(() => parseProcessMemory('Rss: 10 kB\nPss: -1 kB\n')).toThrow('Pss')
  expect(() => parseProcessMemory('Rss: 10 kB\nPss: 5 kB\nPss: 5 kB\n')).toThrow('Pss')
})
