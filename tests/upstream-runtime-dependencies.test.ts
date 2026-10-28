import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareUpstream, upstreamZenCoreVersion } from '../unified/prepare-upstream.ts'
import { lockedImporterDependency, lockedJsdomCanvas, lockedRegistryVersion, UPSTREAM_RUNTIME_PROTOCOL, upstreamFileDigest, upstreamInstalledClosureDigest, upstreamRunnerVersion, verifySealedUpstreamRuntime, verifyUpstreamInstalledClosure, verifyUpstreamInstalledSelections } from '../unified/upstream-runtime-qualification.ts'
import { currentReferencePin as REVIEWED_REFERENCE } from '../reference/source.ts'

test('the original runner uses the locked ZenUML engine rather than its semver minimum', () => {
  const source = mkdtempSync(join(tmpdir(), 'trident-source-lock-'))
  try {
    writeFileSync(join(source, 'pnpm-lock.yaml'), `importers:

  packages/mermaid-zenuml:
    dependencies:
      '@zenuml/core':
        specifier: ^3.47.9
        version: 3.49.2(@babel/core@7.29.7)

  packages/another-package:
    dependencies:
      '@zenuml/core':
        specifier: ^3.47.9
        version: 3.47.9
`)
    expect(upstreamZenCoreVersion(source)).toBe('3.49.2')
    writeFileSync(join(source, 'pnpm-lock.yaml'), `importers:
  packages/another-package:
    dependencies:
      '@zenuml/core':
        specifier: ^3.47.9
        version: 3.47.9
`)
    expect(() => upstreamZenCoreVersion(source)).toThrow('Missing pinned operand')
  } finally { rmSync(source, { recursive: true, force: true }) }
})

test('direct source operands select the actual locked uuid override, not a declared range minimum or another importer', () => {
  const lock = { importers: { 'packages/mermaid': { dependencies: { uuid: { specifier: '^11.1.0 || ^12 || ^13 || ^14.0.0', version: '14.0.0' } } }, '.': { devDependencies: { uuid: { specifier: '^11.1.0', version: '11.1.0' } } } }, packages: { 'uuid@14.0.0': { resolution: { integrity: 'sha512-locked-uuid' } } } }
  expect(lockedImporterDependency(lock, 'packages/mermaid', 'dependencies', 'uuid', '^11.1.0 || ^12 || ^13 || ^14.0.0')).toEqual({ kind: 'importer', name: 'uuid', importer: 'packages/mermaid', section: 'dependencies', manifestSpecifier: '^11.1.0 || ^12 || ^13 || ^14.0.0', specifier: '^11.1.0 || ^12 || ^13 || ^14.0.0', operand: '14.0.0', version: '14.0.0', integrity: 'sha512-locked-uuid' })
  expect(() => lockedImporterDependency(lock, 'packages/parser', 'dependencies', 'uuid')).toThrow('Missing pinned operand')
})

test('receipt keeps peer/patch-qualified operands and source overrides while npm receives only a registry version', () => {
  const operand = '3.49.2(@babel/core@7.29.7(@babel/template@7.29.7))(patch_hash=abc123)'
  const lock = { importers: { 'packages/mermaid-zenuml': { dependencies: { '@zenuml/core': { specifier: '^3.47.9', version: operand } } } } }
  expect(lockedImporterDependency(lock, 'packages/mermaid-zenuml', 'dependencies', '@zenuml/core')).toMatchObject({ version: '3.49.2', operand })
  const overridden = { importers: { 'packages/mermaid': { dependencies: { dompurify: { specifier: '3.4.12', version: '3.4.12' } } } } }
  expect(lockedImporterDependency(overridden, 'packages/mermaid', 'dependencies', 'dompurify', '^3.3.0')).toMatchObject({ manifestSpecifier: '^3.3.0', specifier: '3.4.12', version: '3.4.12' })
  for (const invalid of ['link:../parser', 'npm:uuid@14.0.0', '14.0.0(peer@1.0.0', '14.0.0junk']) expect(() => lockedRegistryVersion(invalid)).toThrow()
})

test('jsdom requires the Canvas adapter selected by its actual locked peer snapshot', () => {
  const lock = { importers: { '.': { devDependencies: { jsdom: { specifier: '^26.1.0', version: '26.1.0(canvas@3.2.3)' } } } }, snapshots: { 'jsdom@26.1.0(canvas@3.2.3)': { optionalDependencies: { canvas: '3.2.3' } } }, packages: { 'canvas@3.2.3': { resolution: { integrity: 'sha512-locked-canvas' } } } }
  expect(lockedJsdomCanvas(lock)).toMatchObject({ kind: 'required-environment-peer', name: 'canvas', version: '3.2.3', integrity: 'sha512-locked-canvas', requiredBy: { name: 'jsdom', operand: '26.1.0(canvas@3.2.3)', section: 'optionalDependencies' } })
  expect(() => lockedJsdomCanvas({ ...lock, snapshots: {} })).toThrow('must select its Canvas')
  expect(() => lockedJsdomCanvas({ ...lock, snapshots: { 'jsdom@26.1.0(canvas@3.2.3)': { optionalDependencies: { canvas: '3.2.4' } } } })).toThrow('differs from pinned jsdom peer')
})

test('installed versions and tarball integrity must agree with selected operands, not merely the requested manifest', () => {
  const runtime = mkdtempSync(join(tmpdir(), 'trident-installed-lock-'))
  try {
    const pkg = join(runtime, 'node_modules/uuid'); mkdirSync(pkg, { recursive: true })
    const operand = { kind: 'importer' as const, name: 'uuid', importer: 'packages/mermaid', section: 'dependencies' as const, specifier: '^11.1.0 || ^14.0.0', operand: '14.0.0', version: '14.0.0', integrity: 'sha512-locked-uuid' }
    const plan = { operands: [operand], dependencies: { uuid: '14.0.0' }, bridges: [], sourceLock: { path: 'pnpm-lock.yaml', sha256: 'fixture' }, closureScope: 'fixture' }
    writeFileSync(join(runtime, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/uuid': { version: '14.0.0', integrity: operand.integrity } } }))
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'uuid', version: '11.1.0' }))
    expect(() => verifyUpstreamInstalledSelections(runtime, plan)).toThrow('Installed package does not match')
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'uuid', version: '14.0.0' }))
    expect(verifyUpstreamInstalledSelections(runtime, plan).sha256).toMatch(/^[a-f0-9]{64}$/)
    writeFileSync(join(runtime, 'package.json'), JSON.stringify({ name: 'fixture', dependencies: { uuid: '14.0.0' } }))
    writeFileSync(join(pkg, 'index.js'), 'export const id = "original"\n')
    const qualified = upstreamInstalledClosureDigest(runtime)
    expect(verifyUpstreamInstalledClosure(runtime, qualified)).toEqual(qualified)
    const alias = join(runtime, 'same-runtime-alias')
    symlinkSync(runtime, alias, 'dir')
    expect(verifyUpstreamInstalledClosure(alias, qualified)).toEqual(qualified)
    writeFileSync(join(pkg, 'index.js'), 'export const id = "changed without version or lock edits"\n')
    expect(() => verifyUpstreamInstalledClosure(runtime, qualified)).toThrow('package bytes changed')
    // The SRI/version declarations themselves cannot witness installed-byte mutation.
    expect(() => verifyUpstreamInstalledSelections(runtime, plan)).not.toThrow()
    writeFileSync(join(runtime, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/uuid': { version: '14.0.0', integrity: 'sha512-different-tarball' } } }))
    expect(() => verifyUpstreamInstalledSelections(runtime, plan)).toThrow('Installed package does not match')
  } finally { rmSync(runtime, { recursive: true, force: true }) }
})

test('original runner records the installed Vitest version and refuses another tool version for a pinned runner', () => {
  const runtime = mkdtempSync(join(tmpdir(), 'trident-actual-vitest-'))
  try {
    const pkg = join(runtime, 'node_modules/vitest'); mkdirSync(pkg, { recursive: true })
    writeFileSync(join(runtime, 'package.json'), '{"name":"caller-supplied-runtime"}')
    writeFileSync(join(pkg, 'package.json'), '{"name":"vitest","version":"3.2.6"}')
    expect(() => upstreamRunnerVersion(runtime, '3.2.7')).toThrow('expected=3.2.7, actual=3.2.6')
    writeFileSync(join(pkg, 'package.json'), '{"name":"vitest","version":"3.2.7"}')
    expect(upstreamRunnerVersion(runtime, '3.2.7')).toBe('3.2.7')
  } finally { rmSync(runtime, { recursive: true, force: true }) }
})

test('a symlink ancestor cannot route a supposedly external runtime into the pinned source', () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-runtime-path-'))
  try {
    const source = join(directory, 'source'), alias = join(directory, 'alias')
    mkdirSync(source); symlinkSync(source, alias, 'dir')
    expect(() => prepareUpstream(source, join(alias, 'runtime-not-created'), '/must-not-read-reference')).toThrow('outside the pinned source tree')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('renaming a runtime never bypasses the sealed original baseline dependency or byte checks', () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-sealed-runtime-'))
  try {
    const source = join(directory, 'source'), runtime = join(directory, 'runtime'), pkg = join(runtime, 'node_modules/uuid')
    mkdirSync(source); mkdirSync(pkg, { recursive: true })
    const manifest = (name: string) => JSON.stringify({ name, dependencies: { uuid: '14.0.0' } })
    writeFileSync(join(runtime, 'package.json'), manifest('caller-supplied-runtime'))
    writeFileSync(join(pkg, 'package.json'), '{"name":"uuid","version":"11.1.0"}')
    writeFileSync(join(pkg, 'index.js'), 'export const value = 1\n')
    writeFileSync(join(runtime, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/uuid': { version: '14.0.0', integrity: 'sha512-selected-uuid' } } }))
    writeFileSync(join(runtime, 'canvas-install.log'), 'fixture installation provenance\n')
    const operand = { kind: 'importer' as const, name: 'uuid', importer: 'packages/mermaid', section: 'dependencies' as const, specifier: '^11.1.0 || ^14.0.0', operand: '14.0.0', version: '14.0.0', integrity: 'sha512-selected-uuid' }
    const plan = { operands: [operand], dependencies: { uuid: '14.0.0' }, bridges: [], sourceLock: { path: 'pnpm-lock.yaml', sha256: 'fixture-source-lock' }, closureScope: 'fixture' }
    expect(() => verifySealedUpstreamRuntime(source, runtime, plan)).toThrow('requires a sealed')
    const seal = { protocol: UPSTREAM_RUNTIME_PROTOCOL, sourceCommit: REVIEWED_REFERENCE.commit, source, runtime, sourceLock: plan.sourceLock, operands: plan.operands, npmLock: { sha256: upstreamFileDigest(join(runtime, 'package-lock.json')) }, installedClosure: upstreamInstalledClosureDigest(runtime), nativeProvisioning: { log: { sha256: upstreamFileDigest(join(runtime, 'canvas-install.log')) } } }
    writeFileSync(join(runtime, 'preparation.json'), JSON.stringify({ ...seal, protocol: 'declared-original-core-runner-preparation-v2' }))
    expect(() => verifySealedUpstreamRuntime(source, runtime, plan)).toThrow('requires a sealed')
    writeFileSync(join(runtime, 'preparation.json'), JSON.stringify(seal))
    expect(() => verifySealedUpstreamRuntime(source, runtime, plan)).toThrow('Installed package does not match')
    writeFileSync(join(pkg, 'package.json'), '{"name":"uuid","version":"14.0.0"}')
    writeFileSync(join(runtime, 'package.json'), manifest('trident-pinned-original-runner'))
    const qualifiedSeal = { ...seal, installedClosure: upstreamInstalledClosureDigest(runtime) }
    writeFileSync(join(runtime, 'preparation.json'), JSON.stringify(qualifiedSeal))
    expect(verifySealedUpstreamRuntime(source, runtime, plan).npmLock.sha256).toBe(seal.npmLock.sha256)
    writeFileSync(join(runtime, 'package.json'), manifest('renamed-runtime'))
    expect(() => verifySealedUpstreamRuntime(source, runtime, plan)).toThrow('package bytes changed')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
