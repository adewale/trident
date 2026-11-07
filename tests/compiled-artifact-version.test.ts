import { createHash } from 'node:crypto'
import { expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { prepareCommunityArtifact, compiledPreparationIdentity } from '../unified/community-artifact-prepare.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('trident-compiled-version-')

test.each(['dart', 'bezel', 'termaid'] as const)('an explicit %s release cutoff survives a newer registry latest and ambient latest policy', async adapter => {
  const directory = temp.dir(), entry = join(directory, 'entry.js'), cache = join(directory, 'cache'), savedFetch = globalThis.fetch
  const names = ['AM_COMMUNITY_VERSION_POLICY', 'AM_BENCH_DART', 'AM_BENCH_PYTHON'], saved = names.map(name => process.env[name])
  writeFileSync(entry, 'sealed compiled fixture')
  const [registry, name] = adapter === 'dart' ? ['pub.dev', 'mermaid_core'] : adapter === 'bezel' ? ['crates.io', 'bezel-mermaid'] : ['pypi', 'termaid']
  const selected = { id: 'fixture/' + adapter, roles: [], outputs: ['svg'], benchmark: { adapter, version: '1.0.0', versionPolicy: 'recorded', outputs: ['svg'] }, packages: [{ registry: registry!, name: name!, version: '0.5.0' }] }
  const artifact = { kind: 'global' as const, module: entry, version: '1.0.0', sha256: createHash('sha256').update('sealed compiled fixture').digest('hex') }

  try {
    process.env.AM_COMMUNITY_VERSION_POLICY = 'latest'
    process.env.AM_BENCH_DART = '/nonexistent/forbidden-acquisition'
    process.env.AM_BENCH_PYTHON = '/nonexistent/forbidden-acquisition'
    globalThis.fetch = (async (_url: string | URL | Request) => { throw Error('Frozen cache hit must not contact a registry') }) as unknown as typeof fetch
    const cached = { ...artifact, preparationIdentity: compiledPreparationIdentity(selected, '1.0.0') }
    const location = join(cache, 'fixture--' + adapter + '@1.0.0-' + cached.preparationIdentity.slice(0, 16)); mkdirSync(location, { recursive: true }); writeFileSync(join(location, 'artifact.json'), JSON.stringify(cached))
    const result = await prepareCommunityArtifact(selected, cache)
    expect(result).toEqual(cached)
  } finally {
    globalThis.fetch = savedFetch
    names.forEach((name, index) => { if (saved[index] === undefined) delete process.env[name]; else process.env[name] = saved[index] })
  }
})
