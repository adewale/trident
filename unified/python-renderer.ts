import type { PreparedCommunity } from './community-types.ts'
import { bindParserBridge, pythonBridgeCommand } from './mermaid-fidelity/bridges.ts'
import { planDigest } from './campaign-plan.ts'
import { tridentDirectory } from './trident-paths.ts'

/** Couple the isolated command to the installed source it will actually load. */
export function pythonRenderer(peer: PreparedCommunity, script: string) {
  const artifact = peer.artifact, executable = artifact?.python ?? artifact?.executable
  if (artifact?.kind !== 'python' || !executable || !artifact.version) throw Error('Python renderer requires a versioned interpreter binding')
  const identity = bindParserBridge({ command: pythonBridgeCommand(executable, script), version: artifact.version, description: 'public Python render API' }, tridentDirectory, peer)
  const expected = planDigest(identity)
  return { command: identity.command, identity, assertUnchanged() {
    if (planDigest(bindParserBridge(identity, tridentDirectory, peer)) !== expected) throw Error('Python render runtime changed during collection')
  } }
}
