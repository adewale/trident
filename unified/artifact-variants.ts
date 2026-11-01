import { readFileSync } from 'node:fs'
import { verifyProvidedCommunityArtifact } from './community.ts'
import { verifyReleaseCli } from './release-cli.ts'
import type { CommunityArtifact, PreparedCommunity } from './community-types.ts'
import type { UnifiedRunOptions } from './types.ts'

export interface ArtifactVariantSelection { project: string; output: 'svg' | 'png' | 'terminal'; variant: string }
export function readArtifactVariants(file?: string): ArtifactVariantSelection[] {
  if (!file) return []
  const value: unknown = JSON.parse(readFileSync(file, 'utf8'))
  if (!Array.isArray(value)) throw Error('Artifact variants must be an array of project/output/variant selections')
  const keys = new Set<string>()
  for (const row of value) {
    if (!row || typeof row !== 'object' || Object.keys(row).some(key => !['project', 'output', 'variant'].includes(key)) || typeof row.project !== 'string' || !row.project || !['svg', 'png', 'terminal'].includes(row.output) || typeof row.variant !== 'string' || !row.variant) throw Error('Invalid artifact variant selection')
    const key = JSON.stringify([row.project, row.output]); if (keys.has(key)) throw Error('Duplicate project/output variant selection'); keys.add(key)
  }
  return value as ArtifactVariantSelection[]
}
/** Explicit frozen public transport selection. Keep project identity; bind the
 * selected artifact and variant into records. A missing variant never falls back. */
export function selectArtifactVariant<T extends PreparedCommunity>(peer: T, output: ArtifactVariantSelection['output'], selections: readonly ArtifactVariantSelection[]): Omit<T, 'artifact'> & { artifact?: CommunityArtifact } {
  const choice = selections.find(row => row.project === peer.node.id && row.output === output)
  if (!choice || choice.variant === 'primary') return peer
  if (!peer.artifact) throw Error('Cannot select a transport without its owning prepared artifact')
  const extra = peer.artifact.additionalCli?.filter(row => row.id === choice.variant)
  if (extra?.length !== 1 || !extra[0]!.outputs.includes(output) || extra[0]!.error || !extra[0]!.artifact || extra[0]!.artifact.kind !== 'cli') throw Error('Selected frozen variant does not expose the requested output: ' + peer.node.id + '/' + output + '/' + choice.variant)
  verifyProvidedCommunityArtifact(peer.artifact); verifyReleaseCli(peer.node, peer.artifact)
  const artifact = extra[0]!.artifact!
  if (artifact.outputBindings && !artifact.outputBindings[output]) throw Error('Selected CLI has no binding for ' + output)
  return { ...peer, node: { ...peer.node, benchmark: { ...peer.node.benchmark!, outputs: [output] } }, artifact: { ...artifact, transportVariant: choice.variant } }
}
export function artifactVariants(options: Pick<UnifiedRunOptions, 'communityArtifactVariantsFile'>, peers: readonly PreparedCommunity[]) {
  const selections = readArtifactVariants(options.communityArtifactVariantsFile)
  if (selections.some(row => !peers.some(peer => peer.node.id === row.project))) throw Error('Variant selection names an unprepared project')
  return selections
}
