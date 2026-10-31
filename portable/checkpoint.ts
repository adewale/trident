import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, fsyncSync, linkSync, mkdirSync, openSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'

export class CollectionBudgetExhausted extends Error {
  constructor() { super('Collection budget exhausted; completed units retained for resume'); this.name = 'CollectionBudgetExhausted' }
}
export function checkCollectionBudget(deadline?: number) {
  if (deadline !== undefined && Date.now() >= deadline) throw new CollectionBudgetExhausted()
}
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
function serialize(value: unknown) {
  const result = JSON.stringify(value, (_key, item) => {
    if (typeof item === 'number' && !Number.isFinite(item) || ['bigint', 'function', 'symbol'].includes(typeof item)) throw Error('Checkpoint evidence must contain finite JSON values')
    return item
  })
  if (result === undefined) throw Error('Checkpoint evidence must be a JSON value')
  return result
}
const syncDirectory = (directory: string) => { const fd = openSync(directory, 'r'); try { fsyncSync(fd) } finally { closeSync(fd) } }
function immutableWrite(file: string, bytes: string | Uint8Array, directory: string) {
  const pending = file + '.' + randomUUID() + '.pending', fd = openSync(pending, 'wx')
  try { writeFileSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
  // A killed process can leave a pending file. It never damages an earlier unit,
  // and readers do not treat that unpublished fragment as completed evidence.
  try { linkSync(pending, file); syncDirectory(directory) } finally { if (existsSync(pending)) unlinkSync(pending) }
}
/** Completed raw units are immutable atomic files, not one append-only gzip
 * stream that a torn final write can make wholly unreadable. Legacy v1 evidence
 * remains readable and unchanged; fresh units use the same keyed public API. */
export class CollectionCheckpoint {
  private values = new Map<string, unknown>()
  private units: string
  readonly startedAt: string
  readonly deadline?: number
  constructor(directory: string, identity: unknown, deadline?: number) {
    this.deadline = deadline
    mkdirSync(directory, { recursive: true })
    const header = join(directory, 'checkpoint.json'), identitySha256 = digest(serialize(identity)), legacy = join(directory, 'checkpoint.jsonl.gz')
    this.units = join(directory, 'checkpoint-units')
    const admit = (row: any) => {
      if (!row || typeof row.key !== 'string' || !row.key || this.values.has(row.key) || row.sha256 !== digest(serialize(row.value))) throw Error('Checkpoint units are duplicated or changed')
      this.values.set(row.key, row.value)
    }
    if (existsSync(header)) {
      const saved = JSON.parse(readFileSync(header, 'utf8'))
      if (!['collection-checkpoint-v1', 'collection-checkpoint-v2'].includes(saved.schema) || saved.identitySha256 !== identitySha256 || typeof saved.startedAt !== 'string' || !Number.isFinite(Date.parse(saved.startedAt))) throw Error('Checkpoint artifact, workload, producer or sampling identity changed')
      this.startedAt = saved.startedAt
      if (existsSync(legacy)) for (const line of gunzipSync(readFileSync(legacy)).toString().split('\n').filter(Boolean)) admit(JSON.parse(line))
    } else {
      if (existsSync(legacy) || existsSync(this.units) && readdirSync(this.units).some(name => name.endsWith('.json.gz'))) throw Error('Checkpoint data has no owning identity')
      this.startedAt = new Date().toISOString()
      immutableWrite(header, serialize({ schema: 'collection-checkpoint-v2', identitySha256, startedAt: this.startedAt }) + '\n', directory)
    }
    mkdirSync(this.units, { recursive: true })
    for (const name of readdirSync(this.units).filter(name => name.endsWith('.json.gz')).sort()) {
      const row = JSON.parse(gunzipSync(readFileSync(join(this.units, name))).toString())
      if (name !== digest(row.key) + '.json.gz') throw Error('Checkpoint unit filename differs from its owning key')
      admit(row)
    }
  }
  has(key: string) { return this.values.has(key) }
  get<T>(key: string): T | undefined { return this.values.has(key) ? structuredClone(this.values.get(key)) as T : undefined }
  /** Call immediately after a raw return, before fallible grading/reporting.
   * Replaying identical evidence is idempotent; changing it requires a new key. */
  record<T>(key: string, value: T): T {
    if (typeof key !== 'string' || !key) throw Error('Checkpoint unit needs a nonempty identity')
    const encoded = serialize(value)
    if (this.values.has(key)) {
      if (serialize(this.values.get(key)) !== encoded) throw Error('A completed checkpoint unit cannot be overwritten')
      return structuredClone(this.values.get(key)) as T
    }
    const row = serialize({ key, value: JSON.parse(encoded), sha256: digest(encoded) })
    immutableWrite(join(this.units, digest(key) + '.json.gz'), gzipSync(Buffer.from(row)), this.units)
    const retained = JSON.parse(encoded)
    this.values.set(key, retained)
    return structuredClone(retained) as T
  }
  async collect<T>(key: string, measure: () => Promise<T>): Promise<T> {
    if (this.values.has(key)) return this.get<T>(key)!
    checkCollectionBudget(this.deadline)
    const value = await measure()
    return this.record(key, value)
  }
}
