import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { prepareCommunity, verifyProvidedCommunityArtifact } from '/workspace/trident-terminal-preparation-repair/unified/community.ts'
import { prepareReleaseCli, verifyReleaseCli } from '/workspace/trident-terminal-preparation-repair/unified/release-cli.ts'
const out = '/workspace/trident-ecosystem-2026-10-31-campaign/terminal-repair/preparation'
const root = '/workspace/trident-terminal-preparation-repair'
const original = '/workspace/trident-ecosystem-2026-10-31-campaign/preparation/community-prepared.json'
const ids = ['crafter-station/mermaid', 'wevm/ondine', 'Latias94/merman']
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
const catalog = read(join(root, 'catalog/mermaid-community.json'))
const latias = catalog.nodes.find((node: any) => node.id === ids[2])
const source = read(join(out, 'source-receipts/latias-release-v0.9.2.json'))
const asset = source.assets.find((item: any) => item.name === 'merman-cli-x86_64-unknown-linux-gnu.tar.xz')
if (asset.digest !== 'sha256:' + latias.benchmark.cliRelease.platforms['linux-x64'].sha256) throw Error('GitHub release digest differs from reviewed pin')
if (read(join(out, 'source-receipts/latias-tag-v0.9.2.json')).object.sha !== latias.benchmark.cliRelease.revision) throw Error('GitHub tag differs from reviewed source revision')
const release = await prepareReleaseCli(latias, '/workspace/trident-ecosystem-2026-10-31-artifacts')
if (!release.artifact) throw Error(release.error)
const provided: Record<string, any> = {}
for (const peer of read(original)) if (ids.slice(1).includes(peer.node.id)) provided[peer.node.id] = peer.artifact
provided[latias.id] = { ...provided[latias.id], additionalCli: [release] }
const providedFile = join(out, 'provided-artifacts.json')
writeFileSync(providedFile, JSON.stringify(provided, null, 2) + '\n')
const prepared = await prepareCommunity({ root, harnessRoot: root, out, rounds: 1, profile: 'full', communityProjects: ids, communityCatalogFile: join(root, 'catalog/mermaid-community.json'), communityArtifacts: providedFile, communityArtifactPolicy: 'frozen' })
for (const peer of prepared) { if (!peer.artifact) throw Error(peer.error); verifyProvidedCommunityArtifact(peer.artifact); verifyReleaseCli(peer.node, peer.artifact) }
const receipt = { schema: 'trident-terminal-preparation-repair-v1', preparedAt: new Date().toISOString(), projects: ids, originalManifest: { path: original, sha256: digest(original) }, preparedManifest: { path: join(out, 'community-prepared.json'), sha256: digest(join(out, 'community-prepared.json')) }, publicReleaseSource: { repository: latias.id, tag: 'v0.9.2', revision: latias.benchmark.cliRelease.revision, url: asset.browser_download_url, archiveSha256: asset.digest.replace('sha256:', '') }, preparationCalls: { drawingCalls: 0, packageAcquisitions: 0, nativeReleaseDownloads: 1, nativeVersionChecks: 1 }, sourceReceipts: ['latias-release-v0.9.2.json', 'latias-tag-v0.9.2.json', 'latias-cli-readme.json'].map(name => ({ path: 'source-receipts/' + name, sha256: digest(join(out, 'source-receipts', name)) })), changes: ['Crafter selects existing recipe cache with published CLI0.0.4; renderer0.0.3 bytes unchanged.', 'Ondine0.0.3 uses its existing public --ascii package CLI with sealed dependency closure.', 'Latias0.9.2 retains its Node artifact and adds the authenticated public native release CLI; no native/Node speed equivalence.'] }
writeFileSync(join(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
console.log(JSON.stringify(prepared.map(peer => ({ project: peer.node.id, version: peer.artifact?.version, additionalCli: peer.artifact?.additionalCli?.map(cli => ({ id: cli.id, outputs: cli.outputs, error: cli.error, version: cli.artifact?.version, sha256: cli.artifact?.sha256 })) })), null, 2))
