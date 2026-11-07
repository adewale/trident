// A renderer process that grows without bound (a layout loop allocating until the
// machine runs out of memory) is stopped once its process tree's resident memory passes a limit,
// instead of waiting for the call timeout while the kernel kills other processes. The
// call then fails with reason "memory limit". Polls /proc; elsewhere it does nothing.
import { existsSync, readFileSync, readdirSync } from 'node:fs'

export function memoryLimit(value = process.env.TRIDENT_RENDERER_MEMORY_MB ?? '2048') {
  const limit = Number(value)
  if (!Number.isFinite(limit) || limit <= 0) throw Error('TRIDENT_RENDERER_MEMORY_MB must be finite and positive')
  return limit
}
export const rendererMemoryLimitMb = memoryLimit()
const threadChildren = existsSync(`/proc/self/task/${process.pid}/children`)
export const rendererMemoryGuard = { limitMb: rendererMemoryLimitMb, scope: 'owned process tree RSS', pollMs: threadChildren ? 100 : 1000, availability: process.platform === 'linux' ? 'available' : 'unavailable', discovery: threadChildren ? 'proc thread children' : 'proc process table' }

function residentMb(pid: number) {
  try {
    const match = /VmRSS:\s+(\d+)\s+kB/.exec(readFileSync(`/proc/${pid}/status`, 'utf8'))
    return match ? Number(match[1]) / 1024 : 0
  } catch {
    return 0
  }
}

/** Read the worker's children, including children created by other threads.
 * Avoid scanning unrelated host processes on every poll. A worker exit retires
 * its session, which kills its private group, including reparented descendants. */
function residentTreeMb(pid: number) {
  // Some kernels omit task/children. Scan their process table less often rather
  // than silently watching only a small shell wrapper.
  const children = threadChildren ? undefined : new Map<number, number[]>()
  if (children) for (const name of readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue
    try {
      const stat = readFileSync('/proc/' + name + '/stat', 'utf8'), fields = stat.slice(stat.lastIndexOf(')') + 2).split(' '), parent = Number(fields[1])
      const list = children.get(parent) ?? []; list.push(Number(name)); children.set(parent, list)
    } catch {}
  }
  const pending = [pid], seen = new Set<number>()
  let total = 0
  for (let index = 0; index < pending.length; index++) {
    const child = pending[index]!
    if (seen.has(child)) continue
    seen.add(child); total += residentMb(child)
    if (children) { pending.push(...children.get(child) ?? []); continue }
    try {
      for (const thread of readdirSync(`/proc/${child}/task`)) {
        try { for (const value of readFileSync(`/proc/${child}/task/${thread}/children`, 'utf8').trim().split(/\s+/)) if (/^\d+$/.test(value)) pending.push(Number(value)) } catch {}
      }
    } catch {}
  }
  return total
}

/** Watch an owned worker tree; calls `exceeded` once. Returns a stop function. */
export function watchMemory(pid: number | undefined, exceeded: () => void, limitMb = rendererMemoryLimitMb) {
  if (!pid || process.platform !== 'linux') return () => {}
  let fired = false
  const timer = setInterval(() => {
    if (!fired && residentTreeMb(pid) > limitMb) {
      fired = true
      exceeded()
    }
  }, rendererMemoryGuard.pollMs)
  timer.unref?.()
  return () => clearInterval(timer)
}
