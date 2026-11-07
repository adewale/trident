// A renderer process that grows without bound (a layout loop allocating until the
// machine runs out of memory) is stopped once its resident memory passes a limit,
// instead of waiting for the call timeout while the kernel kills other processes. The
// call then fails with reason "memory limit". Polls /proc; elsewhere it does nothing.
import { readFileSync } from 'node:fs'

export function memoryLimit(value = process.env.TRIDENT_RENDERER_MEMORY_MB ?? '2048') {
  const limit = Number(value)
  if (!Number.isFinite(limit) || limit <= 0) throw Error('TRIDENT_RENDERER_MEMORY_MB must be finite and positive')
  return limit
}
export const rendererMemoryLimitMb = memoryLimit()

function residentMb(pid: number) {
  try {
    const match = /VmRSS:\s+(\d+)\s+kB/.exec(readFileSync(`/proc/${pid}/status`, 'utf8'))
    return match ? Number(match[1]) / 1024 : 0
  } catch {
    return 0
  }
}

/** Watch one child process; calls `exceeded` once if it passes the limit. Returns a stop function. */
export function watchMemory(pid: number | undefined, exceeded: () => void, limitMb = rendererMemoryLimitMb) {
  if (!pid || process.platform !== 'linux') return () => {}
  let fired = false
  const timer = setInterval(() => {
    if (!fired && residentMb(pid) > limitMb) {
      fired = true
      exceeded()
    }
  }, 100)
  timer.unref?.()
  return () => clearInterval(timer)
}
