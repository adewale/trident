import { availableParallelism, cpus, release, totalmem } from 'node:os'

/** Describe this process. A Bun Node compatibility version is never a Node runtime. */
export function executionEnvironment() {
  return { engine: process.versions.bun ? 'bun' : 'node', version: process.versions.bun ?? process.versions.node, executable: process.execPath, platform: process.platform, architecture: process.arch, kernel: release(), cpu: cpus()[0]?.model, parallelism: availableParallelism(), memoryBytes: totalmem(), locale: Intl.DateTimeFormat().resolvedOptions().locale, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, memoryGuard: process.platform === 'linux' ? 'proc-parent-rss' : 'unavailable' }
}
