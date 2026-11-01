import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, symlinkSync, unlinkSync } from 'node:fs'
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

test('hoisted dependencies cannot hide executable bundled payload behind unchanged entry bytes', () => {
  const prefix = mkdtempSync(join(tmpdir(), 'trident-hoisted-bundle-'))
  try {
    const root = join(prefix, 'node_modules/renderer'), dependency = join(prefix, 'node_modules/dependency'), privateRoot = join(dependency, 'node_modules/private')
    mkdirSync(root, { recursive: true }); mkdirSync(privateRoot, { recursive: true })
    writeFileSync(join(root, 'package.json'), '{"name":"renderer","version":"1.0.0","dependencies":{"dependency":"1.0.0"}}')
    writeFileSync(join(dependency, 'package.json'), '{"name":"dependency","version":"1.0.0","bundledDependencies":["private"]}')
    writeFileSync(join(dependency, 'index.mjs'), 'export { value } from "./node_modules/private/index.mjs"')
    const entry = 'export { value } from "dependency"', module = join(root, 'index.mjs'), bundled = join(privateRoot, 'index.mjs')
    writeFileSync(module, entry); writeFileSync(bundled, 'export const value = 1')
    const artifact: any = { kind: 'node', root, module, version: '1.0.0', sha256: createHash('sha256').update(entry).digest('hex'), installedClosureSha256: evidenceDigest(adapterCompanionIdentity(root)) }
    expect(() => verifyProvidedCommunityArtifact(artifact)).not.toThrow()
    writeFileSync(bundled, 'export const value = 2')
    expect(() => verifyProvidedCommunityArtifact(artifact)).toThrow('Installed package closure changed')
  } finally { rmSync(prefix, { recursive: true, force: true }) }
})

test('npm command links bind their target and reject targets outside the sealed packages', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-npm-command-')), outside = mkdtempSync(join(tmpdir(), 'trident-outside-command-'))
  try {
    writeFileSync(join(root, 'package.json'), '{"name":"fixture-command","version":"1.0.0"}')
    const module = join(root, 'index.mjs'), bin = join(root, 'node_modules/.bin/command'), target = join(root, 'cli.mjs'), alternate = join(root, 'alternate.mjs')
    writeFileSync(module, 'export const ready = true'); writeFileSync(target, 'console.log("same bytes")'); writeFileSync(alternate, 'console.log("same bytes")')
    mkdirSync(join(root, 'node_modules/.bin'), { recursive: true }); symlinkSync('../../cli.mjs', bin)
    const artifact: any = { kind: 'node', root, module, version: '1.0.0', sha256: createHash('sha256').update('export const ready = true').digest('hex'), installedClosureSha256: evidenceDigest(adapterCompanionIdentity(root)) }
    expect(() => verifyProvidedCommunityArtifact(artifact)).not.toThrow()
    unlinkSync(bin); symlinkSync('../../alternate.mjs', bin)
    expect(() => verifyProvidedCommunityArtifact(artifact)).toThrow('Installed package closure changed')
    unlinkSync(bin); writeFileSync(join(outside, 'cli.mjs'), 'console.log("same bytes")'); symlinkSync(join(outside, 'cli.mjs'), bin)
    expect(() => verifyProvidedCommunityArtifact(artifact)).toThrow('unreviewed symlink')
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }) }
})
