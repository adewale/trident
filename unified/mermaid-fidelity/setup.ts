import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const job = JSON.parse(readFileSync(process.env.TRIDENT_FIDELITY_JOB!, 'utf8'))
const { beforeEach, afterEach, expect } = await import(resolve(job.runtime, 'node_modules/vitest/dist/index.js'))
const { initialize, begin, finish } = await import('./runtime.ts')
await initialize(expect.getState().testPath)
beforeEach((context: any) => begin(context.task))
afterEach((context: any) => finish(context.task))
