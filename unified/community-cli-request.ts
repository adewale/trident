import { join } from 'node:path'
import { evidenceDigest } from '../portable/evidence-contract.ts'
import type { CommunityArtifact } from './community-types.ts'

/** The existing public CLI transport request, shared by capture and offline
 * ownership checks. This computes paths/arguments only; it never launches code. */
export function communityCliRequest(artifact: Pick<CommunityArtifact, 'args' | 'input' | 'outputBindings'>, output: string, out: string) {
  const input = join(out, 'cli-input.mmd'), destination = join(out, `cli-output.${output === 'png' ? 'png' : output === 'svg' ? 'svg' : 'txt'}`)
  const binding = artifact.outputBindings?.[output]
  const args = (binding?.args ?? artifact.args ?? []).map(arg => arg.replaceAll('{input}', input).replaceAll('{output}', destination).replaceAll('{format}', output === 'terminal' ? 'unicode' : output))
  return { input, destination, args, inputMode: binding?.input ?? artifact.input ?? 'stdin', fileOutput: (binding?.args ?? artifact.args)?.some(arg => arg.includes('{output}')) ?? false }
}
export function communityCliBinding(executable: string, output: string, request: ReturnType<typeof communityCliRequest>) {
  return evidenceDigest({ executable, args: request.args, output, input: request.inputMode })
}
