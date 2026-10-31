import { expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { beginDocsPngCapture, completeDocsPngCapture } from '../unified/docs-png-capture.ts'
import { readBrowserPngCaptureProfile } from '../unified/docs-png-svg-static.ts'
import { chromiumExecutable } from './helpers/environment.ts'
import { chromium } from 'playwright'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'trident-independent-capture-'))
  const file = join(root, 'environment-control'), bytes = Buffer.from('Independent capture environment control')
  writeFileSync(file, bytes)
  const owned = { path: file, sha256: evidenceBytesDigest(bytes), bytes: bytes.length }
  const executable = chromiumExecutable ?? chromium.executablePath()
  writeFileSync(join(root, 'context.json'), JSON.stringify({ browser: { status: 'available', version: 'Actual executable byte control; no renderer invoked', path: executable, sha256: evidenceBytesDigest(readFileSync(executable)), companions: [owned] }, resources: { manifestSha256: 'e'.repeat(64), files: [] } }))
  writeFileSync(join(root, 'result.json'), '{}')
  const journal = new InvocationJournal(join(root, 'invocations'))
  const identity = { project: 'synthetic/capture-audit', caseId: 'one', sourceSha256: 'a'.repeat(64), artifactSha256: 'b'.repeat(64), bindingSha256: 'c'.repeat(64), format: 'png' }
  const snapshot = () => ({ fonts: [owned], configuration: [owned], variables: {} })
  const producers = ['100644 blob ' + 'd'.repeat(40) + '\tunified/docs-png-browser.ts']
  return { root, journal, identity, snapshot, producers }
}

test('a native call started before the font snapshot stays ineligible even when it returns during the capture', () => {
  const f = fixture()
  try {
    const oldPending = f.journal.start(f.identity)
    const capture = beginDocsPngCapture(f.root, f.producers, f.snapshot)
    f.journal.returned(oldPending, 'Synthetic older call return; never scored as PNG', null)
    const result = completeDocsPngCapture(capture, [oldPending.attemptId], f.snapshot)
    expect(result.receipt.status).toBe('unavailable')
    expect(result.receipt.reason).toContain('already present before this execution')
    expect(() => readBrowserPngCaptureProfile({ root: f.root, completionFile: result.file })).toThrow('unchanged before/after')
  } finally { rmSync(f.root, { recursive: true, force: true }) }
})

test('capture replay independently rejects changed durable-start and terminal coverage digests', () => {
  const f = fixture()
  try {
    const capture = beginDocsPngCapture(f.root, f.producers, f.snapshot)
    const started = f.journal.start(f.identity)
    f.journal.returned(started, 'Synthetic owned return; no public renderer called', null)
    const complete = completeDocsPngCapture(capture, [started.attemptId], f.snapshot)
    expect(complete.receipt.status).toBe('available')
    expect(readBrowserPngCaptureProfile({ root: f.root, completionFile: complete.file }).attemptIds).toEqual([started.attemptId])
    const original = readFileSync(complete.file, 'utf8')
    for (const key of ['startedFrameSha256', 'outcomeFrameSha256']) {
      const changed = JSON.parse(original)
      changed.coverage[0][key] = '0'.repeat(64)
      writeFileSync(complete.file, JSON.stringify(changed))
      expect(() => readBrowserPngCaptureProfile({ root: f.root, completionFile: complete.file })).toThrow('coverage differs')
    }
    const unowned = JSON.parse(original)
    unowned.attemptIds.push('invented-later-attempt')
    writeFileSync(complete.file, JSON.stringify(unowned))
    expect(() => readBrowserPngCaptureProfile({ root: f.root, completionFile: complete.file })).toThrow('pre-call journal baseline')
  } finally { rmSync(f.root, { recursive: true, force: true }) }
})
