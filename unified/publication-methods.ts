import { copyFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** Report-reading methods travel with a publication. The original executable
 * protocol and measurement dates still belong to each retained record. */
export function copyPublicationMethods(out: string) {
  for (const name of ['METHODOLOGY.md', 'MEASUREMENT.md', 'BENCHMARKS.md', 'FAIRNESS.md', 'CATALOG.md', 'LINEAGE.md', 'SUPPORT-QUALITY.md', 'REPORTING.md']) {
    const source = resolve(import.meta.dirname, '..', name)
    if (!existsSync(source)) throw Error('Publication method document is missing: ' + name)
    copyFileSync(source, join(out, name))
  }
}
