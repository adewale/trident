import { closeSync, mkdirSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Reserve ownership, rather than checking existence before a recursive mkdir. */
export function reserveResultDirectory(path: string) {
  mkdirSync(dirname(path), { recursive: true })
  mkdirSync(path)
}

export function atomicWrite(path: string, contents: string) {
  const temporary = path + '.pending-' + randomUUID()
  try {
    writeFileSync(temporary, contents, { flag: 'wx' })
    renameSync(temporary, path)
  } finally { rmSync(temporary, { force: true }) }
}

/** At most 25 cases or five seconds of progress between checkpoint opportunities.
 * Boundaries and completion force a write. No timer runs during measured calls. */
export function checkpointDue(every = 25, intervalMs = 5000) {
  let count = 0, last = performance.now()
  return (force = false) => {
    count++
    if (!force && count < every && performance.now() - last < intervalMs) return false
    count = 0; last = performance.now()
    return true
  }
}

/** An interrupted SIGKILL can leave a lock: inspect its owner before removing it.
 * Never guess that a live collector or build is stale. */
export function exclusiveFile(path: string) {
  let descriptor: number
  try { descriptor = openSync(path, 'wx') } catch { throw Error('Operation already owned or interrupted; inspect the owner before removing ' + path) }
  writeFileSync(descriptor, JSON.stringify({ pid: process.pid, executable: process.execPath, startedAt: new Date().toISOString() }) + '\n')
  let closed = false
  const release = () => { if (closed) return; closed = true; closeSync(descriptor); rmSync(path, { force: true }); process.off('exit', release) }
  process.once('exit', release)
  return { [Symbol.dispose]: release }
}

export function timingSession() { return exclusiveFile(join(tmpdir(), 'trident-timing-' + (process.getuid?.() ?? 'user') + '.lock')) }
