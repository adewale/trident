import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import type { BenchmarkObservation } from './types.ts'
import { verifiedOutputObservations } from './output-evidence.ts'

export interface TerminalMeasurementCase { id: string; sourceSha256: string }
/** Reconstruct mechanical measurements from owned raw text bytes. Stored
 * admission/content flags do not establish either return or format validity. */
export function terminalOutputMeasurements(record: any, directory: string, expected: { profile: string; cases: readonly TerminalMeasurementCase[]; projects: readonly string[] }) {
  // The saved-output regrader upgrades original v1 assessments to v2 while
  // preserving the original raw record. This one migration keeps exactly the
  // same literal source population; the inventory comparison still applies.
  const sameProfile = record?.profile === expected.profile || record?.profile === 'terminal-project-corpus-v1' && expected.profile === 'terminal-project-corpus-v2'
  if (!record || !sameProfile || !Array.isArray(record.inventory) || JSON.stringify(record.inventory) !== JSON.stringify(expected.cases.map(input => [input.id, input.sourceSha256]))
    || !Array.isArray(record.artifacts) || !Array.isArray(record.outputs) || new Set(record.artifacts.map((entry: any) => entry.project)).size !== record.artifacts.length
    || JSON.stringify(record.artifacts.map((entry: any) => entry.project).sort()) !== JSON.stringify([...expected.projects].sort())) throw Error('Terminal output measurement has a different source/artifact population')
  const root = realpathSync(directory), coordinates = new Set<string>()
  for (const output of record.outputs) {
    const key = JSON.stringify([output.project, output.caseId])
    if (coordinates.has(key) || !expected.projects.includes(output.project) || !expected.cases.some(input => input.id === output.caseId)) throw Error('Duplicate or foreign terminal output coordinate')
    coordinates.add(key)
  }
  return record.artifacts.map((artifact: any) => ({ project: String(artifact.project), version: String(artifact.version ?? 'unavailable'),
    observations: verifiedOutputObservations(root, expected.cases, expected.cases.map((input): BenchmarkObservation => {
      const output = record.outputs.find((row: any) => row.project === artifact.project && row.caseId === input.id)
      let bytes: Buffer | undefined, formatValid: boolean | null = null
      if (output?.witness !== undefined && output.witness !== null) {
        if (typeof output.witness !== 'string' || !output.witness) throw Error('Invalid terminal witness path')
        const path = resolve(root, output.witness), within = relative(root, path)
        if (isAbsolute(within) || within === '..' || within.startsWith('../') || !existsSync(path)) throw Error('Terminal output is missing or outside its owning record')
        const actual = relative(root, realpathSync(path))
        if (isAbsolute(actual) || actual === '..' || actual.startsWith('../')) throw Error('Terminal output symlink escapes its owning record')
        bytes = readFileSync(path)
        if (evidenceBytesDigest(bytes) !== output.sha256) throw Error('Terminal output bytes differ from the owning raw record')
        try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); formatValid = true } catch { formatValid = false }
      }
      return { suite: 'community', surface: 'terminal:raw-return', runtime: 'retained terminal bytes', family: 'fixed corpus', caseId: input.id, operation: 'render', format: 'terminal', mode: 'raw-output-reduction',
        status: bytes ? 'passed' : 'blocked', metrics: { project: String(artifact.project), round: 1, rawInvocationId: typeof output?.rawInvocationId === 'string' ? output.rawInvocationId : null, ...(typeof output?.outputEvidence === 'string' ? { outputEvidence: output.outputEvidence } : {}), publicOutputReturned: bytes ? true : null, formatValid, returnedBytes: bytes?.byteLength ?? null,
          sourceSha256: input.sourceSha256, outputSha256: bytes ? evidenceBytesDigest(bytes) : null, measuredAt: typeof output?.measuredAt === 'string' ? output.measuredAt : null } }
    })) }))
}
