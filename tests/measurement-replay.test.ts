import { expect, test } from 'bun:test'
import { readFileSync, mkdirSync, writeFileSync, symlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { replayMeasurements, freshOutputOutside } from '../unified/measurement-replay.ts'
import { replayMermaidBehaviours } from '../unified/mermaid-behaviour.ts'
import { readBehaviourEvidence } from '../unified/mermaid-behaviour-evidence.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('measurement-replay-')
function publicParent() {
  const root = temp.dir(), fixture = JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/conformance/public-tests-expanded154-evidence.json.gz', import.meta.url))).toString())
  for (const file of fixture.files) { const path = join(root, file.path); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, file.text) }
  return root
}
test('one replay entrypoint re-evaluates real retained behaviours, keeps the parent unchanged and calls no renderer', async () => {
  const parent = publicParent(), source = join(temp.dir(), 'behaviours'), out = join(temp.dir(), 'replay')
  replayMermaidBehaviours({ evidence: parent, out: source })
  const before = evidenceBytesDigest(readFileSync(join(source, 'report.json')))
  const receipt = await replayMeasurements({ kind: 'behaviour', campaign: source, out })
  expect(receipt.rendererInvocations).toBe(0)
  expect(receipt.sourceSha256).toBe(before)
  expect(evidenceBytesDigest(readFileSync(join(source, 'report.json')))).toBe(before)
  expect(readBehaviourEvidence(out).targets[0].counts.passed).toBe(49)
  expect(JSON.parse(readFileSync(join(out, 'report.json'), 'utf8')).projectInvocations).toBe(0)
  expect(JSON.parse(readFileSync(join(out, 'measurement-replay.json'), 'utf8')).kind).toBe('behaviour')
  await expect(replayMeasurements({ kind: 'behaviour', campaign: source, out })).rejects.toThrow('fresh')
})
test('replay rejects nested physical outputs and invalid modes before modifying the input', async () => {
  const source = temp.dir(), elsewhere = temp.dir(), alias = join(elsewhere, 'alias')
  symlinkSync(source, alias)
  expect(() => freshOutputOutside(source, join(alias, 'nested'))).toThrow('outside')
  const out = join(elsewhere, 'out')
  await expect(replayMeasurements({ kind: 'collect', campaign: source, out })).rejects.toThrow('measurements:replay')
  await expect(replayMeasurements({ kind: 'timing', campaign: source, out, formats: ['svg'] })).rejects.toThrow('only to docs')
  expect(existsSync(out)).toBe(false)
})
