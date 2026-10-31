import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {retainedLegacyNativePngContext, requireLegacyNativePngOwnership} from '../unified/docs-png-legacy.ts'
import {evidenceBytesDigest} from '../portable/evidence-contract.ts'

// Replay ownership from restored bytes only. No project process is started.
const restored = resolve(process.argv[2] ?? '')
const output = process.argv[3]
if (!process.argv[2] || !output) throw Error('Usage: bun scripts/verify-restored-native-png.ts RESTORED OUT.json')
const map = JSON.parse(readFileSync(restored + '/path-map.json', 'utf8'))
const locate = (original: string): string => {
  const logical = map.paths[resolve(original)]
  if (typeof logical !== 'string') throw Error('Missing exact restored provenance mapping: ' + original)
  const path = resolve(restored, logical)
  if (!path.startsWith(restored + '/')) throw Error('Restored provenance path escapes the restored tree')
  return path
}
const original = '/workspace/trident-ecosystem-2026-10-31-campaign'
const campaign = dirname(locate(original + '/preparation.json'))
const pngRoot = dirname(locate(original + '/docs/png/context.json'))
const context = retainedLegacyNativePngContext(campaign, pngRoot, locate)
const cases = []
for (const batch of context.batches) {
  for (const [index, row] of batch.results.entries()) {
    if (row.status !== 'ok') continue
    cases.push(requireLegacyNativePngOwnership({context, source: context.cases[index]!, round: batch.round, project: 'pub:mermaid_flutter', actualPng: readFileSync(locate(row.png!))}))
  }
}
if (cases.length !== 449) throw Error('Restored native coverage differs from the 449 actual returned images')
const result = {
  schema: 'trident-restored-original-native-ownership-verification-v1',
  archiveSha256: map.archiveSha256,
  pathMapSha256: evidenceBytesDigest(readFileSync(restored + '/path-map.json')),
  validatorSha256: evidenceBytesDigest(readFileSync(new URL('../unified/docs-png-legacy.ts', import.meta.url))),
  launcherSha256: evidenceBytesDigest(readFileSync(import.meta.path)),
  ownedNativePngs: cases.length,
  sourceInventorySha256: context.inventorySha256,
  nativeArtifactSha256: context.artifactSha256,
  cases,
  scope: 'Every original native return is revalidated using only restored sealed preparation, the exact original native job/source order/producer files, raw native and emitted transport/checkpoint receipts, and first/final PNG bytes. This is legacy content ownership, with no invented call clock or fallback to original campaign paths.',
  rendererInvocations: 0,
  codexApiInvocations: 0,
}
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ownedNativePngs: cases.length, nativeArtifactSha256: context.artifactSha256, rendererInvocations: 0, codexApiInvocations: 0}))
