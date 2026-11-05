/**
 * The vmForks pool runs each test file in its own V8 realm, but Node's structuredClone
 * is the host's and builds its result from host-realm constructors. Inside a test,
 * `structuredClone(new Map()) instanceof Map` is then false, and Mermaid code that
 * validates its own clones (usecaseDb.commit checks `instanceof Map`) rejects them.
 * This rebuilds each clone from this realm's constructors, after the host clone has
 * applied structuredClone's own rules (and thrown its own errors for uncloneable values).
 */
export function realmStructuredClone(host: typeof structuredClone): typeof structuredClone {
  const tag = (value: object) => Object.prototype.toString.call(value).slice(8, -1)
  const rebuild = (value: any, seen: Map<any, any>): any => {
    if (value === null || typeof value !== 'object') return value
    if (seen.has(value)) return seen.get(value)
    const kind = tag(value)
    const keep = (made: any) => (seen.set(value, made), made)
    if (Array.isArray(value)) { const made = keep(new Array(value.length)); for (const key of Object.keys(value)) made[key] = rebuild(value[key], seen); return made }
    if (kind === 'Map') { const made = keep(new Map()); for (const [key, entry] of value) made.set(rebuild(key, seen), rebuild(entry, seen)); return made }
    if (kind === 'Set') { const made = keep(new Set()); for (const entry of value) made.add(rebuild(entry, seen)); return made }
    if (kind === 'Date') return keep(new Date(value.getTime()))
    if (kind === 'RegExp') return keep(new RegExp(value.source, value.flags))
    if (kind === 'ArrayBuffer') return keep(value.slice(0))
    if (ArrayBuffer.isView(value)) { const Made = (globalThis as any)[kind] ?? DataView; return keep(kind === 'DataView' ? new DataView(rebuild(value.buffer, seen), value.byteOffset, value.byteLength) : new Made(rebuild(value.buffer, seen), value.byteOffset, (value as any).length)) }
    if (kind === 'Error') { const Made = (globalThis as any)[value.name] ?? Error; const made = keep(new Made(value.message)); if ('stack' in value) made.stack = value.stack; if ('cause' in value) made.cause = rebuild(value.cause, seen); return made }
    if (kind === 'Boolean' || kind === 'Number' || kind === 'String' || kind === 'BigInt') return keep(Object(value.valueOf()))
    const made = keep({})
    for (const key of Object.keys(value)) made[key] = rebuild(value[key], seen)
    return made
  }
  return ((value: any, options?: StructuredSerializeOptions) => rebuild(host(value, options), new Map())) as typeof structuredClone
}

if (typeof globalThis.structuredClone === 'function' && !(globalThis.structuredClone(new Map()) instanceof Map)) globalThis.structuredClone = realmStructuredClone(globalThis.structuredClone)
