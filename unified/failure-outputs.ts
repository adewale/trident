import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const safe = (value: string) => value.replace(/[^a-z0-9._-]+/gi, '_')
/** Keep a failed case's actual output beside its evidence, outside every clock, so a maintainer
 * can see what the tool produced. Passing outputs are not retained. */
export function retainFailedOutput(out: string, project: string, caseId: string, extension: string, value: string | Uint8Array | undefined): string | null {
  if (value === undefined || (typeof value === 'string' && !value.length)) return null
  const file = join(out, 'failure-outputs', `${safe(project)}--${safe(caseId)}.${extension}`)
  mkdirSync(join(out, 'failure-outputs'), { recursive: true })
  writeFileSync(file, value)
  return file
}
