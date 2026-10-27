import { expect, test } from 'bun:test'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync, watch, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { awaitInvocationArtifact } from '../unified/invocation.ts'

function coalescedDirectoryObserver() {
  let notify: (() => void) | undefined, closed = false
  const watcher = Object.assign(new EventEmitter(), { close() { closed = true } })
  // The real filesystem contains both writes. This signal source deliberately
  // exposes only the first change, modeling the documented fs.watch event-loss
  // boundary without changing or mocking the artifact bytes.
  const observe = ((_directory: string, changed: () => void) => { notify = changed; return watcher }) as unknown as typeof watch
  return { observe, notify() { notify?.() }, get closed() { return closed } }
}

test('artifact readback observes a completed current SVG after a partial write with no second directory event', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-coalesced-artifact-')), observer = coalescedDirectoryObserver(), file = join(directory, 'out.svg')
  let partial: ReturnType<typeof setTimeout> | undefined, complete: ReturnType<typeof setTimeout> | undefined
  try {
    const expected = '<svg xmlns="http://www.w3.org/2000/svg"><title>Current</title><text>Start End</text></svg>'
    const pending = awaitInvocationArtifact(file, 'Current', 500, undefined, observer.observe)
    partial = setTimeout(() => { writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg"><title>Current</title>'); observer.notify() }, 5)
    complete = setTimeout(() => { writeFileSync(file, expected) }, 25)
    expect(await pending).toBe(expected)
    expect(observer.closed).toBe(true)
  } finally { clearTimeout(partial); clearTimeout(complete); rmSync(directory, { recursive: true, force: true }) }
}, 2000)

test('artifact readback keeps the same deadline and rejects a complete stale SVG or a never-completed current artifact', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-unmatched-artifact-'))
  try {
    for (const content of ['<svg><title>Stale</title></svg>', '<svg><title>Current</title>']) {
      const file = join(directory, 'out.svg'), observer = coalescedDirectoryObserver()
      writeFileSync(file, content)
      await expect(awaitInvocationArtifact(file, 'Current', 40, undefined, observer.observe)).rejects.toThrow('Watch did not emit current authored artifact')
      expect(observer.closed).toBe(true)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}, 2000)
