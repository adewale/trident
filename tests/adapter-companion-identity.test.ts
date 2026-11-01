import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { evidenceDigest } from '../portable/evidence-contract.ts'
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

test('an unchanged entry cannot hide a changed imported module or installed dependency', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-shipped-modules-'))
  try {
    mkdirSync(join(root, 'dist'))
    const module = join(root, 'dist/index.mjs'), imported = join(root, 'dist/parser.mjs')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-renderer', version: '1.0.0', dependencies: { 'fixture-dependency': '1.0.0' } }))
    writeFileSync(module, 'export { render } from "./parser.mjs"')
    writeFileSync(imported, 'export const render = () => "original"')
    const dependency = join(root, 'node_modules/fixture-dependency')
    mkdirSync(dependency, { recursive: true })
    writeFileSync(join(dependency, 'package.json'), '{"name":"fixture-dependency","version":"1.0.0"}')
    const dependencyEntry = join(dependency, 'index.js')
    writeFileSync(dependencyEntry, 'module.exports = "original dependency"')
    const artifact: any = { kind: 'node', root, module, version: '1.0.0', sha256: createHash('sha256').update('export { render } from "./parser.mjs"').digest('hex'), installedClosureSha256: evidenceDigest(adapterCompanionIdentity(root)) }
    expect(() => verifyProvidedCommunityArtifact(artifact)).not.toThrow()
    writeFileSync(imported, 'export const render = () => "changed"')
    expect(() => verifyProvidedCommunityArtifact(artifact)).toThrow('Installed package closure changed')
    writeFileSync(imported, 'export const render = () => "original"')
    writeFileSync(dependencyEntry, 'module.exports = "changed dependency"')
    expect(() => verifyProvidedCommunityArtifact(artifact)).toThrow('Installed package closure changed')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('bundled nested modules are sealed even without a dependency declaration', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-bundled-runtime-'))
  try {
    const module = join(root, 'index.mjs'), privateRoot = join(root, 'node_modules/private')
    mkdirSync(privateRoot, { recursive: true })
    writeFileSync(join(root, 'package.json'), '{"name":"fixture-bundled","version":"1.0.0","bundledDependencies":["private"]}')
    const entry = 'export { value } from "./node_modules/private/index.mjs"'
    writeFileSync(module, entry)
    const imported = join(privateRoot, 'index.mjs')
    writeFileSync(imported, 'export const value = 1')
    const artifact: any = { kind: 'node', root, module, version: '1.0.0', sha256: createHash('sha256').update(entry).digest('hex'), installedClosureSha256: evidenceDigest(adapterCompanionIdentity(root)) }
    expect(() => verifyProvidedCommunityArtifact(artifact)).not.toThrow()
    writeFileSync(imported, 'export const value = 2')
    expect(() => verifyProvidedCommunityArtifact(artifact)).toThrow('Installed package closure changed')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
