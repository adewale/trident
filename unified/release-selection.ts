import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CommunityNode } from './community-types.ts'

const version = (value: string) => /^v?\d+\.\d+\.\d+$/.test(value) ? value.replace(/^v/, '').split('.').map(Number) : null
const compare = (a: string, b: string) => { const x = version(a)!, y = version(b)!; return x[0]! - y[0]! || x[1]! - y[1]! || x[2]! - y[2]! }
export function stableReleaseBefore<T>(rows: T[], cutoff: string, name: (row: T) => string, date: (row: T) => string | undefined): T {
  const end = Date.parse(cutoff)
  if (!Number.isFinite(end)) throw Error('Invalid release cutoff')
  const eligible = rows.filter(row => version(name(row)) && date(row) && Date.parse(date(row)!) <= end)
  eligible.sort((a, b) => compare(name(b), name(a)))
  if (!eligible.length) throw Error('No stable published artifact at the release cutoff')
  return eligible[0]!
}
export async function releaseMetadata(kind: string, name: string, url: string): Promise<any> {
  if (kind === 'github') return JSON.parse(execFileSync('gh', ['api', url], { encoding: 'utf8', timeout: 90_000, maxBuffer: 64 * 1024 * 1024 }))
  const response = await fetch(url, { signal: AbortSignal.timeout(90_000), headers: { 'User-Agent': 'Trident artifact preparation (https://github.com/adewale/trident)' } })
  if (!response.ok) throw Error(`${kind} metadata HTTP ${response.status}: ${name}`)
  return response.json()
}
/** Foreground release selection for a declared campaign, not a version watcher.
 * New source/CLI bindings still require review; selection never invents one. */
export async function resolveReleaseCatalog<T extends { nodes: CommunityNode[] }>(catalog: T, projects: string[], cutoff: string, out: string, request = releaseMetadata): Promise<{ catalog: T; ledger: unknown[] }> {
  const frozen = structuredClone(catalog), ledger: unknown[] = []
  mkdirSync(out, { recursive: true })
  for (const node of frozen.nodes.filter(node => projects.includes(node.id))) {
    const b = node.benchmark!
    try {
      let kind: string, name: string, url: string
      if (b.package) { kind = 'npm'; name = b.package; url = 'https://registry.npmjs.org/' + encodeURIComponent(name) }
      else if (['dart', 'native-flutter'].includes(b.adapter)) { kind = 'pub'; name = b.adapter === 'dart' ? 'mermaid_core' : 'mermaid_flutter'; url = 'https://pub.dev/api/packages/' + name }
      else if (b.adapter === 'termaid') { kind = 'pypi'; name = 'termaid'; url = 'https://pypi.org/pypi/termaid/json' }
      else if (b.adapter === 'bezel') { kind = 'crates'; name = 'bezel-mermaid'; url = 'https://crates.io/api/v1/crates/' + name }
      else if (['source-cli', 'franken'].includes(b.adapter)) { kind = 'github'; name = node.id; url = 'repos/' + node.id + '/releases?per_page=100' }
      else { ledger.push({ project: node.id, sourcePin: b.sourcePin, selection: 'Reviewed immutable source; no separately published benchmark component' }); continue }
      const data = await request(kind, name, url)
      const metadata = kind + '--' + encodeURIComponent(name) + '.json'
      writeFileSync(join(out, metadata), JSON.stringify(data) + '\n')
      let selected: any, selectedVersion: string
      if (kind === 'npm') {
        selectedVersion = stableReleaseBefore<string>(Object.keys(data.versions), cutoff, value => value, value => data.time?.[value])
        // The language oracle stays pinned. A later product version needs its
        // own reviewed identity rather than silently replacing the reference.
        if (node.id === 'mermaid-js/mermaid') selectedVersion = b.version ?? node.packages!.find(pkg => pkg.name === name)!.version
        selected = data.versions[selectedVersion]
      } else if (kind === 'pub') { selected = stableReleaseBefore<any>(data.versions, cutoff, row => row.version, row => row.published); selectedVersion = selected.version }
      else if (kind === 'crates') { selected = stableReleaseBefore<any>(data.versions, cutoff, row => row.num, row => row.created_at); selectedVersion = selected.num }
      else if (kind === 'pypi') {
        selectedVersion = stableReleaseBefore<string>(Object.keys(data.releases), cutoff, value => value, value => data.releases[value].filter((file: any) => Date.parse(file.upload_time_iso_8601) <= Date.parse(cutoff)).map((file: any) => file.upload_time_iso_8601).sort()[0])
        selected = data.releases[selectedVersion]
      } else {
        selected = stableReleaseBefore<any>(data.filter((row: any) => !row.draft && !row.prerelease), cutoff, row => row.tag_name, row => row.published_at)
        selectedVersion = selected.tag_name
        // A reviewed published Git tag may be newer than GitHub Release objects.
        if (node.release && version(node.release.tag) && compare(node.release.tag, selectedVersion) > 0) selectedVersion = node.release.tag
        const revision = node.release?.tag === selectedVersion ? node.release.commit : (await request('github', node.id, 'repos/' + node.id + '/commits/' + encodeURIComponent(selectedVersion))).sha
        if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('Release tag has no immutable commit')
        if (b.adapter === 'franken') { node.distribution = { ...node.distribution, version: selectedVersion.replace(/^v/, ''), revision }; delete node.distribution.wasmSha256 }
        else node.release = { tag: selectedVersion, commit: revision }
        if (b.cliRelease && (b.cliRelease.version !== selectedVersion.replace(/^v/, '') || b.cliRelease.revision !== revision)) throw Error('New release requires a reviewed CLI archive/binding; source builds cannot replace its published executable')
      }
      if (kind !== 'github') {
        b.version = selectedVersion; b.versionPolicy = 'recorded'
        for (const pkg of node.packages ?? []) if (pkg.name === name) {
          pkg.version = selectedVersion
          for (const field of ['gitHead', 'provenanceCommit', 'publishedFromDefaultBranch']) delete (pkg as any)[field]
          if (selected?.gitHead) (pkg as any).gitHead = selected.gitHead
        }
      }
      ledger.push({ project: node.id, registry: kind, package: name, version: selectedVersion, metadata })
    } catch (error) {
      b.preparationError = String(error)
      ledger.push({ project: node.id, error: String(error) })
    }
  }
  return { catalog: frozen, ledger }
}
