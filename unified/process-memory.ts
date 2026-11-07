// A renderer process that grows without bound (a layout loop allocating until the
// machine runs out of memory) is stopped once its process group's resident memory passes a limit,
// instead of waiting for the call timeout while the kernel kills other processes. The
// call then fails with reason "memory limit". Polls /proc; elsewhere it does nothing.
import { readFileSync, readdirSync } from 'node:fs'

export function memoryLimit(value = process.env.TRIDENT_RENDERER_MEMORY_MB ?? '2048') {
  const limit = Number(value)
  if (!Number.isFinite(limit) || limit <= 0) throw Error('TRIDENT_RENDERER_MEMORY_MB must be finite and positive')
  return limit
}
export const rendererMemoryLimitMb = memoryLimit()
export const rendererMemoryGuard = { limitMb: rendererMemoryLimitMb, scope: 'owned process group RSS', pollMs: 100, availability: process.platform === 'linux' ? 'available' : 'unavailable' }

function residentMb(pid: number) {
  try {
    const match = /VmRSS:\s+(\d+)\s+kB/.exec(readFileSync(`/proc/${pid}/status`, 'utf8'))
    return match ? Number(match[1]) / 1024 : 0
  } catch {
    return 0
  }
}

/** Wrapper processes such as xvfb-run are small; the renderer is their child.
 * Private groups also retain descendants whose immediate parent has exited.
 * For a caller without a private group, count only its own process subtree. */
function residentGroupMb(pid: number) {
  const processes = new Map<number, { parent: number; group: number }>()
  for (const name of readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue
    try { const stat = readFileSync('/proc/' + name + '/stat', 'utf8'), fields = stat.slice(stat.lastIndexOf(')') + 2).split(' '); processes.set(Number(name), { parent: Number(fields[1]), group: Number(fields[2]) }) } catch {}
  }
  const root = processes.get(pid)
  if (!root) return 0
  const owned = new Set([pid])
  if (root.group === pid) for (const [child, record] of processes) { if (record.group === pid) owned.add(child) }
  else for (let size = 0; size !== owned.size;) { size = owned.size; for (const [child, record] of processes) if (owned.has(record.parent)) owned.add(child) }
  return [...owned].reduce((sum, child) => sum + residentMb(child), 0)
}

/** Watch an owned worker group; calls `exceeded` once. Returns a stop function. */
export function watchMemory(pid: number | undefined, exceeded: () => void, limitMb = rendererMemoryLimitMb) {
  if (!pid || process.platform !== 'linux') return () => {}
  let fired = false
  const timer = setInterval(() => {
    if (!fired && residentGroupMb(pid) > limitMb) {
      fired = true
      exceeded()
    }
  }, 100)
  timer.unref?.()
  return () => clearInterval(timer)
}
