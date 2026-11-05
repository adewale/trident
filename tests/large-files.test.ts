import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const policy = JSON.parse(readFileSync(join(root, 'tests/large-files.json'), 'utf8')) as { limitBytes: number; allow: Record<string, string> }

/** Tracked files plus untracked files that are not ignored, i.e. what the next commit could add. */
function candidateFiles() {
  return execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter(path => path && existsSync(join(root, path)) && statSync(join(root, path)).isFile())
}

test('no file over the size limit is committed without a listed reason', () => {
  expect(policy.limitBytes).toBe(2_000_000)
  const large = candidateFiles()
    .map(path => ({ path, bytes: statSync(join(root, path)).size }))
    .filter(file => file.bytes > policy.limitBytes && !Object.hasOwn(policy.allow, file.path))
  expect(large).toEqual([])
})

test('every allowlist entry names a large tracked file and gives a reason', () => {
  const files = new Set(candidateFiles())
  for (const [path, reason] of Object.entries(policy.allow)) {
    expect({ path, tracked: files.has(path), reasoned: reason.trim().length > 20 }).toEqual({ path, tracked: true, reasoned: true })
    expect({ path, large: statSync(join(root, path)).size > policy.limitBytes }).toEqual({ path, large: true })
  }
})
