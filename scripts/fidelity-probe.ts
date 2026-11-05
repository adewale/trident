// Print the native model a candidate's parser returns for one source, exactly as the
// Fidelity views receive it. Used to write and check reviewed schema views.
//
//   bun scripts/fidelity-probe.ts RUN_DIR PROJECT FAMILY SOURCE_FILE|-
//
// RUN_DIR is any mermaid:fidelity output that ran PROJECT (its job.json names the
// prepared artifact and bridge). FAMILY is the runtime family key (flowchart, sequence,
// state, gitgraph, c4, ...). The source is read from a file, or from stdin with '-'.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const [run, project, family, sourceFile] = process.argv.slice(2)
if (!run || !project || !family || !sourceFile) throw Error('fidelity-probe RUN_DIR PROJECT FAMILY SOURCE_FILE|-')
const job = join(run, encodeURIComponent(project), 'job.json')
if (!existsSync(job)) throw Error('No job.json for ' + project + ' in ' + run)
process.env.TRIDENT_FIDELITY_JOB = job
const source = sourceFile === '-' ? readFileSync(0, 'utf8') : readFileSync(sourceFile, 'utf8')
const runtime = await import('../unified/mermaid-fidelity/runtime.ts')
const file = JSON.parse(readFileSync(job, 'utf8')).files.find((f: any) => f.family === family)?.absolute
await runtime.initialize(file)
const show = (value: unknown) => JSON.stringify(value, (_key, item) => (item instanceof Map ? { Map: [...item] } : item instanceof Set ? { Set: [...item] } : item), 2)
try {
  console.log(show(runtime.probeNative(family, source)))
} catch (error: any) {
  console.log(show({ thrown: String(error?.message ?? error).slice(0, 500) }))
} finally {
  runtime.shutdown()
}
