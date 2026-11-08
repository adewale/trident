/** Invoke the selected artifact's public Python API on independent controls. */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { terminalEncodingControls, qualifyTerminalEncoding } from '../fidelity/terminal-encoding.ts'
import { verifyProvidedCommunityArtifact } from '../unified/community.ts'
import { atomicWrite } from '../unified/result-storage.ts'
import { bindParserBridge, pythonBridgeCommand } from '../unified/mermaid-fidelity/bridges.ts'
import { planDigest } from '../unified/campaign-plan.ts'
if (import.meta.main) {
  const [input, output] = process.argv.slice(2)
  if (!input || !output || existsSync(output)) throw Error('qualify-terminal-encoding OWNER.json FRESH_OUTPUT.json')
  const owner = JSON.parse(readFileSync(input, 'utf8'))
  if (owner.artifact?.kind !== 'python' || !owner.artifact.python) throw Error('This qualifier requires a public Python render API')
  verifyProvidedCommunityArtifact(owner.artifact)
  const [python, ...flags] = pythonBridgeCommand(owner.artifact.python, '-c')
  const arguments_ = [...flags, 'import sys,termaid; print(termaid.render(sys.stdin.read()))']
  const observeRuntime = () => bindParserBridge({ command: [python!, ...arguments_], version: owner.artifact.version, description: 'encoding control interpreter' }, '', owner)
  const runtimeSha256 = planDigest(observeRuntime())
  const observations = terminalEncodingControls.map(control => ({ id: control.id, source: control.source, output: execFileSync(python!, arguments_, { input: control.source, encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024 }) }))
  verifyProvidedCommunityArtifact(owner.artifact)
  if (planDigest(observeRuntime()) !== runtimeSha256) throw Error('Installed terminal runtime changed during qualification')
  atomicWrite(output, JSON.stringify({ ...qualifyTerminalEncoding(owner, observations), runtimeSha256 }, null, 2) + '\n')
}
