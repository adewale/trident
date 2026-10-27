import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface BrowserProcess { id: number; type: string; cpuTime?: number }
interface BrowserSession { send(method: 'SystemInfo.getProcessInfo'): Promise<{ processInfo?: BrowserProcess[] }>; detach(): Promise<void> }
interface BrowserConnection { newBrowserCDPSession(): Promise<BrowserSession> }
export interface BrowserProcessMemory {
  status: 'measured' | 'partial' | 'unavailable'
  rssBytes: number | null
  pssBytes: number | null
  processes: { pid: number; type: string; rssBytes: number | null; pssBytes: number | null; error?: string }[]
  scope: string
  detail?: string
}

/** Linux smaps_rollup, not V8 counters. RSS double-counts shared pages across
 * processes; PSS apportions them. Neither counter isolates native/WASM/GPU. */
export function parseProcessMemory(text: string): { rssBytes: number; pssBytes: number } {
  const bytes = (name: string) => {
    const fields = [...text.matchAll(new RegExp(`^${name}:\\s+(\\d+) kB$`, 'gm'))]
    const value = fields.length === 1 ? Number(fields[0]![1]) * 1024 : NaN
    if (!Number.isSafeInteger(value) || value < 0) throw Error(`Missing or invalid smaps_rollup ${name}`)
    return value
  }
  return { rssBytes: bytes('Rss'), pssBytes: bytes('Pss') }
}

/** A serial, post-clock checkpoint of every process Chromium names. A process
 * disappearing or an unreadable mapping makes the aggregate unavailable,
 * rather than rewarding a tool with a spuriously small memory total. */
export async function browserProcessMemory(browser: BrowserConnection, options: { platform?: string; procRoot?: string } = {}): Promise<BrowserProcessMemory> {
  const scope = 'Instantaneous Linux RSS/PSS summed over distinct Chromium CDP process IDs (browser, renderer, GPU and utility where reported). Reads are serial, not simultaneous or a peak. RSS includes duplicated shared pages; PSS apportions resident shared pages. Includes resident native/WASM allocations in those processes but does not isolate them or include GPU device memory. Not renderer-only incremental allocation.'
  const unavailable = (detail: string): BrowserProcessMemory => ({ status: 'unavailable', rssBytes: null, pssBytes: null, processes: [], scope, detail })
  if ((options.platform ?? process.platform) !== 'linux') return unavailable('Linux procfs smaps_rollup is unavailable on this platform')
  let session: BrowserSession | undefined
  try {
    session = await browser.newBrowserCDPSession()
    const info = (await session.send('SystemInfo.getProcessInfo')).processInfo
    if (!info?.length || info.some(item => !Number.isSafeInteger(item.id) || item.id <= 0)) return unavailable('Chromium did not return valid process identities')
    const unique = [...new Map(info.map(item => [item.id, item])).values()]
    const processes = unique.map(item => {
      try { return { pid: item.id, type: item.type, ...parseProcessMemory(readFileSync(join(options.procRoot ?? '/proc', String(item.id), 'smaps_rollup'), 'utf8')) } }
      catch (error) { return { pid: item.id, type: item.type, rssBytes: null, pssBytes: null, error: String(error) } }
    })
    const complete = processes.every(item => item.rssBytes !== null && item.pssBytes !== null)
    return { status: complete ? 'measured' : 'partial', rssBytes: complete ? processes.reduce((sum, item) => sum + item.rssBytes!, 0) : null, pssBytes: complete ? processes.reduce((sum, item) => sum + item.pssBytes!, 0) : null, processes, scope }
  } catch (error) { return unavailable(String(error)) }
  finally { try { await session?.detach() } catch {} }
}
