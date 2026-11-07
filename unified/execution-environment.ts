import { availableParallelism, cpus, release, totalmem } from 'node:os'
import { readFileSync } from 'node:fs'

/** Describe this process. A Bun Node compatibility version is never a Node runtime. */
export function executionEnvironment() {
  const limit = (file: string) => { try { return readFileSync('/sys/fs/cgroup/' + file, 'utf8').trim() } catch { return undefined } }
  return { engine: process.versions.bun ? 'bun' : 'node', version: process.versions.bun ?? process.versions.node, executable: process.execPath, platform: process.platform, architecture: process.arch, kernel: release(), cpu: cpus()[0]?.model, parallelism: availableParallelism(), memoryBytes: totalmem(), ...(process.platform === 'linux' ? { cgroup: { cpuMax: limit('cpu.max'), memoryMax: limit('memory.max') } } : {}), locale: Intl.DateTimeFormat().resolvedOptions().locale, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, memoryGuard: process.platform === 'linux' ? 'proc-parent-rss' : 'unavailable' }
}
