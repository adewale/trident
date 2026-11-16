import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { prepareCommunity, verifyProvidedCommunityArtifact } from '../unified/community.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temp = useTempDirs('trident-candidate-source-')
test('npm preparation retains declared packed source provenance and frozen loading rejects another source claim for the same bytes', async () => {
  const root = temp.dir(), contents = join(root, 'contents'), tarball = join(root, 'candidate.tgz')
  mkdirSync(join(contents, 'package'), { recursive: true })
  writeFileSync(join(contents, 'package/package.json'), JSON.stringify({ name: 'trident-local-source-fixture', version: '1.0.0', type: 'module', exports: './index.js' }))
  writeFileSync(join(contents, 'package/index.js'), 'export const parse = source => ({ source })\n')
  execFileSync('tar', ['-czf', tarball, '-C', contents, 'package'])
  const sha256 = createHash('sha256').update(readFileSync(tarball)).digest('hex')
  const project = 'fixture/local-source', packedFrom = '1234567890abcdef1234567890abcdef12345678', catalog = join(root, 'catalog.json')
  writeFileSync(catalog, JSON.stringify({ nodes: [{ id: project, head: 'abcdef1234567890abcdef1234567890abcdef12', roles: [], outputs: ['parse'], benchmark: { adapter: 'declared', package: 'trident-local-source-fixture', version: '1.0.0', entry: 'index.js', outputs: ['parse'], api: { parse: { export: 'parse' } } } }] }))
  const options = { root, out: join(root, 'prepared'), rounds: 1, profile: 'smoke' as const, communityCatalogFile: catalog, communityProjects: [project], communityCandidate: { project, tarball, sha256, packedFrom } }
  const [prepared] = await prepareCommunity(options)
  expect(prepared?.error).toBeUndefined()
  expect(prepared?.artifact?.revision).toBe(packedFrom)
  expect(prepared?.artifact?.candidate).toMatchObject({ sha256, packedFrom })
  expect(() => verifyProvidedCommunityArtifact({ ...prepared!.artifact!, revision: 'fedcba0987654321fedcba0987654321fedcba09' })).toThrow('source provenance')
  const communityPreparedFile = join(options.out, 'community-prepared.json')
  const [frozen] = await prepareCommunity({ ...options, out: join(root, 'frozen'), communityPreparedFile })
  expect(frozen?.artifact?.revision).toBe(packedFrom)
  const [changed] = await prepareCommunity({ ...options, out: join(root, 'changed'), communityPreparedFile, communityCandidate: { ...options.communityCandidate, packedFrom: 'fedcba0987654321fedcba0987654321fedcba09' } })
  expect(changed?.artifact).toBeUndefined()
  expect(changed?.error).toContain('source provenance')
  const [invalid] = await prepareCommunity({ ...options, out: join(root, 'invalid'), communityCandidate: { ...options.communityCandidate, packedFrom: 'mutable-branch' } })
  expect(invalid?.artifact).toBeUndefined()
  expect(invalid?.error).toContain('full source revision')
  const [unclaimed] = await prepareCommunity({ ...options, out: join(root, 'unclaimed'), communityCandidate: { project, tarball, sha256 } })
  expect(unclaimed?.error).toBeUndefined()
  expect(unclaimed?.artifact?.revision).toBeUndefined()
})
