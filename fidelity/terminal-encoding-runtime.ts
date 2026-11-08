import { bindParserBridge, pythonBridgeCommand } from '../unified/mermaid-fidelity/bridges.ts'
import { planDigest } from '../unified/campaign-plan.ts'

export function terminalEncodingCommand(owner: any) {
  if (owner?.artifact?.kind !== 'python' || !owner.artifact.python) throw Error('Encoding qualification requires a public Python render API')
  return [...pythonBridgeCommand(owner.artifact.python, '-c'), 'import sys,termaid; print(termaid.render(sys.stdin.read()))']
}

/** Observe installed code as well as the interpreter and retained archives. */
export function terminalEncodingRuntime(owner: any) {
  return planDigest(bindParserBridge({ command: terminalEncodingCommand(owner), version: owner.artifact.version, description: 'encoding control interpreter' }, '', owner))
}
