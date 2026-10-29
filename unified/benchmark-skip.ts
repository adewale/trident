import type { CommunityNode } from './community-types.ts'

/** A release-specific pause never disables a separately supplied candidate. */
export function releaseBenchmarkSkip(node: CommunityNode, candidateProject?: string) {
  const skip = node.benchmark?.skip
  if (!skip) return undefined
  if (!skip.version?.trim() || !skip.reason?.trim()) throw Error('Benchmark skip needs a version and reason: ' + node.id)
  return node.id !== candidateProject && node.benchmark?.version === skip.version ? skip : undefined
}
