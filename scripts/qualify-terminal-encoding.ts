/** Invoke the selected artifact's public Python API on independent controls. */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { terminalEncodingControls, qualifyTerminalEncoding } from '../fidelity/terminal-encoding.ts'
import { verifyProvidedCommunityArtifact } from '../unified/community.ts'
import { atomicWrite } from '../unified/result-storage.ts'
import { terminalEncodingCommand, terminalEncodingRuntime } from '../fidelity/terminal-encoding-runtime.ts'
if (import.meta.main) {
  const [input, output] = process.argv.slice(2)
  if (!input || !output || existsSync(output)) throw Error('qualify-terminal-encoding OWNER.json FRESH_OUTPUT.json')
  const owner = JSON.parse(readFileSync(input, 'utf8'))
  if (owner.artifact?.kind !== 'python' || !owner.artifact.python) throw Error('This qualifier requires a public Python render API')
  verifyProvidedCommunityArtifact(owner.artifact)
  const [python, ...arguments_] = terminalEncodingCommand(owner)
  const runtimeSha256 = terminalEncodingRuntime(owner)
  const observations = terminalEncodingControls.map(control => ({ id: control.id, source: control.source, output: execFileSync(python!, arguments_, { input: control.source, encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024 }) }))
  verifyProvidedCommunityArtifact(owner.artifact)
  const qualification = qualifyTerminalEncoding(owner, observations)
  if (qualification.runtimeSha256 !== runtimeSha256) throw Error('Installed terminal runtime changed during qualification')
  atomicWrite(output, JSON.stringify(qualification, null, 2) + '\n')
}
