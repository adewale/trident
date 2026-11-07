import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process'

// Community workers use private process groups so a stuck API can be killed.
// Forward cancellation through that extra group boundary before exiting.
type GroupChild = { pid?: number; kill(signal: NodeJS.Signals): unknown }
declare const groupOwnership: unique symbol
type OwnedGroup<T extends GroupChild = GroupChild> = T & { readonly [groupOwnership]: true }
const ownedGroups = new WeakSet<GroupChild>()
const active = new Set<OwnedGroup>()
function own<T extends GroupChild>(child: T): OwnedGroup<T> { ownedGroups.add(child); return child as OwnedGroup<T> }
let interrupted: NodeJS.Signals | undefined
let listening = false
export function killCommunityProcess(child: OwnedGroup, signal: NodeJS.Signals): void {
  if (!ownedGroups.has(child)) throw Error('Cannot kill an unowned process group')
  try {
    if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, signal)
    else child.kill(signal)
  } catch {}
}
function cancel(signal: NodeJS.Signals): void {
  if (interrupted) return
  interrupted = signal
  for (const child of active) killCommunityProcess(child, signal)
  // Keep this timer referenced: cleanup must finish even if all parents exit
  // before grandchildren that ignored the first signal.
  setTimeout(() => {
    for (const child of active) killCommunityProcess(child, 'SIGKILL')
    process.exit(signal === 'SIGINT' ? 130 : 143)
  }, 1000)
}
const onInt = () => cancel('SIGINT')
const onTerm = () => cancel('SIGTERM')
export function assertCommunityNotInterrupted(): void {
  if (interrupted) throw new Error(`Community campaign cancelled by ${interrupted}; no further workers may start`)
}
function trackCommunityProcess(child: OwnedGroup<ChildProcess>): void {
  register(child)
  child.once('close', () => release(child))
}
function register(child: OwnedGroup) {
  if (interrupted) {
    killCommunityProcess(child, 'SIGKILL')
    assertCommunityNotInterrupted()
  }
  active.add(child)
  if (!listening) {
    process.once('SIGINT', onInt)
    process.once('SIGTERM', onTerm)
    listening = true
  }
}
function release(child: OwnedGroup) {
    // During cancellation retain the group identity for forced descendant
    // cleanup even if the immediate child already stopped.
    if (interrupted) return
    active.delete(child)
    if (!active.size) {
      process.off('SIGINT', onInt)
      process.off('SIGTERM', onTerm)
      listening = false
    }
}

/** Process-group creation and cancellation registration are one operation. */
export function spawnCommunityProcess(command: string, args: readonly string[], options: SpawnOptions) {
  assertCommunityNotInterrupted()
  const child = own(spawn(command, [...args], { ...options, detached: process.platform !== 'win32' }))
  trackCommunityProcess(child)
  return child
}
export function spawnCommunitySubprocess(args: string[]) {
  assertCommunityNotInterrupted()
  const child = own(Bun.spawn(args, { stdin: 'pipe', stdout: 'pipe', stderr: 'pipe', detached: process.platform !== 'win32' }))
  register(child)
  void child.exited.then(() => release(child))
  return child
}
