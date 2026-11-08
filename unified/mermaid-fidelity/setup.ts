import { readFileSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { attestEnvironment } from './environments.ts'
const job = JSON.parse(readFileSync(process.env.TRIDENT_FIDELITY_JOB!, 'utf8'))
const { beforeEach, afterAll, expect } = await import(resolve(job.runtime, 'node_modules/vitest/dist/index.js'))
const { initialize, begin, finish, shutdown } = await import('./runtime.ts')
const file = expect.getState().testPath
const planned = job.target.tool === 'mermaid' ? 'jsdom' : job.files.find((entry: any) => entry.absolute === file)?.environment ?? 'jsdom'
const environment = attestEnvironment(file, planned, { window: typeof window, document: typeof document })
appendFileSync(`${job.environmentAudit}.${process.pid}`, JSON.stringify(environment) + '\n')
// The reference executes its pinned production imports directly. Candidate
// adapters alone need the public-package/database bridge initialization.
if (job.target.tool !== 'mermaid') await initialize(expect.getState().testPath)
beforeEach((context: any) => {
  begin(context.task)
  // A failing upstream teardown stops the remaining afterEach hooks. Vitest
  // still runs onTestFinished; audit ownership must end on every such path.
  context.onTestFinished(() => finish(context.task))
})
afterAll(() => shutdown())
