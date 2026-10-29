import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { adapterCompanionIdentity, verifyProvidedCommunityArtifact } from '../unified/community.ts'
test('changing an executed companion invalidates the owning public artifact', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-companion-'))
  try {
    const module = join(root, 'main.mjs'), companion = join(root, 'companion'), bytes = 'export const ready = true'
    writeFileSync(module, bytes); mkdirSync(companion)
    writeFileSync(join(companion, 'package.json'), '{"name":"companion","version":"1.0.0","main":"index.js"}')
    writeFileSync(join(companion, 'index.js'), 'exports.render = () => "actual"')
    const closureSha256 = createHash('sha256').update(JSON.stringify(adapterCompanionIdentity(companion))).digest('hex')
    const artifact: any = { kind: 'node', root, module, version: '1.0.0', sha256: createHash('sha256').update(bytes).digest('hex'), adapterCompanions: [{ root: companion, name: 'companion', version: '1.0.0', integrity: 'sha512-fixture', closureSha256 }] }
    expect(() => verifyProvidedCommunityArtifact(artifact)).not.toThrow()
    writeFileSync(join(companion, 'index.js'), 'exports.render = () => "changed"')
    expect(() => verifyProvidedCommunityArtifact(artifact)).toThrow('Adapter companion closure changed')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
