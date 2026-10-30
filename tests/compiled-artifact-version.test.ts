import { expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { prepareCommunityArtifact } from '../unified/community-artifact-prepare.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('trident-compiled-version-')

test.each(['dart', 'bezel', 'termaid'] as const)('an explicit %s release cutoff survives a newer registry latest and ambient latest policy', async adapter => {
  const directory = temp.dir(), entry = join(directory, 'entry.js'), cache = join(directory, 'cache'), savedFetch = globalThis.fetch
  const names = ['AM_COMMUNITY_VERSION_POLICY', 'AM_BENCH_DART', 'AM_BENCH_PYTHON'], saved = names.map(name => process.env[name])
  writeFileSync(entry, 'sealed compiled fixture')
  const artifact = { kind: 'global' as const, module: entry, version: '1.0.0' }, location = join(cache, 'fixture--' + adapter + '@1.0.0')
  mkdirSync(location, { recursive: true }); writeFileSync(join(location, 'artifact.json'), JSON.stringify(artifact))
  const [registry, name] = adapter === 'dart' ? ['pub.dev', 'mermaid_core'] : adapter === 'bezel' ? ['crates.io', 'bezel-mermaid'] : ['pypi', 'termaid']
  try {
    process.env.AM_COMMUNITY_VERSION_POLICY = 'latest'
    process.env.AM_BENCH_DART = '/nonexistent/forbidden-acquisition'
    process.env.AM_BENCH_PYTHON = '/nonexistent/forbidden-acquisition'
    globalThis.fetch = (async (url: string | URL | Request) => {
      if (!String(url).endsWith('/mermaid_core') && !String(url).endsWith('/bezel-mermaid') && !String(url).endsWith('/termaid/json')) throw Error('Frozen release was ignored; unexpected acquisition')
      return new Response(JSON.stringify({ latest: { version: '9.0.0' }, crate: { newest_version: '9.0.0' }, info: { version: '9.0.0' } }))
    }) as typeof fetch
    const result = await prepareCommunityArtifact({ id: 'fixture/' + adapter, roles: [], outputs: ['svg'], benchmark: { adapter, version: '1.0.0', versionPolicy: 'recorded', outputs: ['svg'] }, packages: [{ registry, name, version: '0.5.0' }] }, cache)
    expect(result).toEqual(artifact)
  } finally {
    globalThis.fetch = savedFetch
    names.forEach((name, index) => { if (saved[index] === undefined) delete process.env[name]; else process.env[name] = saved[index] })
  }
})
