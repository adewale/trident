import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
/** Public output-code dictionaries, not expected source answers. The exact
 * owning wheel was inspected without executing its parser or renderer. Its
 * four member hashes were independently checked against the archive bytes. */
export const termaidUnicodeEncoding = {
  project: 'fasouto/termaid', version: '0.10.0', artifactSha256: 'fa67443527ed9647f760d807e2a38f26340757123e643c4639cf273ed15d5ea7', wheelSha256: 'b884a616d30071643f8e93528b0ad68bd5696b41a7b5d31cd0554d2f990f28f2',
  sourceFiles: {
    'termaid/renderer/journey.py': '9d3124ed5cba6a98d45ef2ac289129f332d926aea2e0ef357fb6dee72efec5bb',
    'termaid/renderer/gantt.py': '5df4acb0ca6126d84b7343d8296128fd662ff770af7ec0704b483dbf2f83051c',
    'termaid/renderer/gitgraph.py': 'bedcd48ca9cc1e74956d9e5ff87d27fbd97325a8f84f52d2119413d1a54d2eec',
    'termaid/parser/gitgraph.py': 'e0968686ccf3ed13c9421332fdb24e10c3d5da4471ae6edd5b15667000c4fa59',
  },
} as const
export interface TerminalEncodingContext {
  encoding: 'termaid-unicode-0.10.0'; artifactSha256: string; wheelSha256: string; sourceFiles: Record<string, string>
  sourceSha256: string; outputSha256: string; owningRawSha256: string
}
/** The normal saved/live binding owns this artifact declaration and the exact
 * output. A project name or version alone cannot select a private glyph code. */
export function terminalKnownEncodingContext(owner: any, binding: { sourceSha256: string; outputSha256: string; owningRawSha256: string }): TerminalEncodingContext | undefined {
  const policy = termaidUnicodeEncoding, artifact = owner?.artifact
  if (owner?.project !== policy.project || owner?.version !== policy.version || artifact?.kind !== 'python' || artifact.version !== policy.version || artifact.sha256 !== policy.artifactSha256 || !artifact.files?.some((file: any) => file.sha256 === policy.wheelSha256 && /(?:^|\/)termaid-0\.10\.0-py3-none-any\.whl$/.test(file.path)) || !Object.values(binding).every(value => /^[a-f0-9]{64}$/.test(value))) return
  return { encoding: 'termaid-unicode-0.10.0', artifactSha256: policy.artifactSha256, wheelSha256: policy.wheelSha256, sourceFiles: { ...policy.sourceFiles }, ...binding }
}
export function admittedTerminalEncoding(context: TerminalEncodingContext | undefined, output: string | Uint8Array, sourceSha256?: string) {
  const policy = termaidUnicodeEncoding
  return context?.encoding === 'termaid-unicode-0.10.0' && context.artifactSha256 === policy.artifactSha256 && context.wheelSha256 === policy.wheelSha256 && evidenceDigest(context.sourceFiles) === evidenceDigest(policy.sourceFiles) && /^[a-f0-9]{64}$/.test(context.sourceSha256) && /^[a-f0-9]{64}$/.test(context.owningRawSha256) && (!sourceSha256 || context.sourceSha256 === sourceSha256) && context.outputSha256 === evidenceBytesDigest(output) ? context : undefined
}
