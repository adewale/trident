import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'

export class CollectionBudgetExhausted extends Error {
  constructor() { super('Collection budget exhausted; completed units retained for resume'); this.name = 'CollectionBudgetExhausted' }
}
export function checkCollectionBudget(deadline?: number) {
  if (deadline !== undefined && Date.now() >= deadline) throw new CollectionBudgetExhausted()
}
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
/** Append completed units once. A deadline controls acquisition of new work,
 * never the duration or evidence of an already running worker. */
export class CollectionCheckpoint {
  private values = new Map<string, unknown>()
  private data: string
  readonly startedAt: string
  readonly deadline?: number
  constructor(directory: string, identity: unknown, deadline?: number) {
    this.deadline = deadline
    mkdirSync(directory, { recursive: true })
    const header = join(directory, 'checkpoint.json'), identitySha256 = digest(JSON.stringify(identity))
    this.data = join(directory, 'checkpoint.jsonl.gz')
    if (existsSync(header)) {
      const saved = JSON.parse(readFileSync(header, 'utf8'))
      if (saved.schema !== 'collection-checkpoint-v1' || saved.identitySha256 !== identitySha256) throw Error('Checkpoint artifact, workload, producer or sampling identity changed')
      this.startedAt = saved.startedAt
      if (existsSync(this.data)) for (const line of gunzipSync(readFileSync(this.data)).toString().split('\n').filter(Boolean)) {
        const row = JSON.parse(line)
        if (typeof row.key !== 'string' || this.values.has(row.key) || row.sha256 !== digest(JSON.stringify(row.value))) throw Error('Checkpoint units are duplicated or changed')
        this.values.set(row.key, row.value)
      }
    } else {
      if (existsSync(this.data)) throw Error('Checkpoint data has no owning identity')
      this.startedAt = new Date().toISOString()
      writeFileSync(header, JSON.stringify({ schema: 'collection-checkpoint-v1', identitySha256, startedAt: this.startedAt }) + '\n', { flag: 'wx' })
    }
  }
  has(key: string) { return this.values.has(key) }
  async collect<T>(key: string, measure: () => Promise<T>): Promise<T> {
    if (this.values.has(key)) return this.values.get(key) as T
    checkCollectionBudget(this.deadline)
    const value = await measure()
    appendFileSync(this.data, gzipSync(Buffer.from(JSON.stringify({ key, value, sha256: digest(JSON.stringify(value)) }) + '\n')))
    this.values.set(key, value)
    return value
  }
}
