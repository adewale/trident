import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync, gunzipSync } from 'node:zlib'
import { evidenceBytesDigest } from '../../portable/evidence-contract.ts'

export interface RetainedDrawingOutput { project: string; caseId: string; format: string; sourceSha256: string; outputSha256: string }
export class DrawingOutputStorageError extends Error {}
/** Text outputs are stored as UTF-8; a PNG output is stored as its bytes. */
export function retainDrawingOutput(root: string, project: string, test: { id: string; source: string }, format: string, output: string | Uint8Array): RetainedDrawingOutput {
  const outputSha256 = evidenceBytesDigest(output), directory = join(root, 'outputs')
  try {
    mkdirSync(directory, { recursive: true })
    const path = join(directory, outputSha256 + '.gz')
    if (!existsSync(path)) writeFileSync(path, gzipSync(output))
  } catch (cause) { throw new DrawingOutputStorageError('Drawing output storage failed: ' + String(cause), { cause }) }
  return { project, caseId: test.id, format, sourceSha256: evidenceBytesDigest(test.source), outputSha256 }
}
export function readDrawingOutputBytes(root: string, record: RetainedDrawingOutput, source: string) {
  if (!/^[a-f0-9]{64}$/.test(record.outputSha256) || record.sourceSha256 !== evidenceBytesDigest(source)) throw Error('Retained drawing source/output binding differs')
  const output = gunzipSync(readFileSync(join(root, 'outputs', record.outputSha256 + '.gz')))
  if (evidenceBytesDigest(output) !== record.outputSha256) throw Error('Retained drawing output changed')
  return output
}
export function readDrawingOutput(root: string, record: RetainedDrawingOutput, source: string) {
  if (record.format === 'png') throw Error('A retained PNG drawing is binary: use readDrawingOutputBytes')
  return readDrawingOutputBytes(root, record, source).toString()
}
