import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { admitNativeLaunch, nativePngArtifact } from '../native-flutter/community-launch.mjs'
import { publishCampaigns } from '../unified/campaign-publication.ts'
import { communityCandidate } from '../unified/project-update.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

// Paths reached through a symlink must compare as the files they name. macOS temporary
// folders are /var -> /private/var, so these fixtures make their own links and fail the
// same way on every platform. Each needs no oracle and runs no renderer.
const temp = useTempDirs('trident-physical-')
const linkTo = (target: string) => {
  const link = join(temp.dir(), 'link')
  symlinkSync(target, link, 'dir')
  return link
}

test('campaign publication copies evidence named through a symlink and refuses output inside it', () => {
  const source = temp.dir(),
    linked = linkTo(source)
  mkdirSync(join(source, 'docs'))
  writeFileSync(join(source, 'docs/samples.json'), '{"samples":[1]}\n')
  writeFileSync(join(source, 'report.json'), JSON.stringify({ startedAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', profile: 'full', rounds: 5, projects: ['other/svg'], results: [{ suite: 'docs', status: 'passed', observations: 1, out: join(linked, 'docs') }] }))
  const out = join(temp.dir(), 'publication')
  publishCampaigns([source], out, { copyEvidence: true })
  expect(readFileSync(join(out, 'evidence/1/docs/samples.json'), 'utf8')).toBe('{"samples":[1]}\n')
  expect(() => publishCampaigns([source], join(linked, 'publication'))).toThrow('outside input evidence')
})

test('a native launch refuses a manifest inside its bundle through a symlink and accepts its executable through one', () => {
  const root = temp.dir(),
    bundle = join(root, 'bundle')
  mkdirSync(join(bundle, 'lib'), { recursive: true })
  writeFileSync(join(bundle, 'lib/libapp.so'), 'synthetic library')
  writeFileSync(join(bundle, 'native_bench'), '#!/bin/sh\n', { mode: 0o755 })
  const linked = linkTo(bundle)
  expect(() => nativePngArtifact(bundle, join(linked, 'launch.json'))).toThrow('outside the sealed native bundle')
  expect(existsSync(join(bundle, 'launch.json'))).toBe(false)
  const manifest = join(root, 'launch.json')
  nativePngArtifact(bundle, manifest)
  const saved = process.env.FLUTTER_COMMUNITY_EXECUTABLE
  process.env.FLUTTER_COMMUNITY_EXECUTABLE = join(linked, 'native_bench')
  try {
    expect(admitNativeLaunch(manifest).version).toBe('0.3.2')
  } finally {
    if (saved === undefined) delete process.env.FLUTTER_COMMUNITY_EXECUTABLE
    else process.env.FLUTTER_COMMUNITY_EXECUTABLE = saved
  }
})

test('a candidate directory reached through a symlink keeps its bundled dependencies', () => {
  const directory = temp.dir(),
    leaf = join(directory, 'node_modules', 'trident-fixture-leaf')
  mkdirSync(leaf, { recursive: true })
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: 'trident-fixture-renderer', version: '3.0.0-dev', dependencies: { 'trident-fixture-leaf': '1.0.0' }, bundleDependencies: ['trident-fixture-leaf'] }))
  writeFileSync(join(leaf, 'package.json'), JSON.stringify({ name: 'trident-fixture-leaf', version: '1.0.0' }))
  const packed = communityCandidate({ directory: linkTo(directory) }, { out: temp.dir(), communityProjects: ['owner/fixture-renderer'] }) as { tarball: string }
  expect(execFileSync('tar', ['-tzf', packed.tarball], { encoding: 'utf8' })).toContain('package/node_modules/trident-fixture-leaf/package.json')
})
