import type { PortableArtifact } from './protocol.ts'
import type { Json } from './cohorts.ts'

/** Case options describe intent, not one project's option object. Missing
 * translations are harness gaps; silently ignored target options are not passes. */
export function portableRenderOptions(artifact: Pick<PortableArtifact, 'adapter' | 'binding'>, intent?: Record<string, Json>): unknown {
  const base = artifact.binding?.options
  if (!intent) return base === undefined ? undefined : structuredClone(base)
  if (Object.keys(intent).some(key => key !== 'fontSize')) throw Error('No reviewed portable configuration translation for this option')
  if (typeof intent.fontSize !== 'number' || !Number.isFinite(intent.fontSize) || intent.fontSize <= 0) throw Error('Portable font size must be positive and finite')
  const path = artifact.adapter === 'agentic' ? ['style', 'roles', 'node', 'fontSize'] : artifact.adapter === 'pele' ? ['fontSize'] : artifact.adapter === 'declared' ? artifact.binding?.fontSizePath : undefined
  if (!Array.isArray(path) || !path.length || path.some(key => typeof key !== 'string' || !key || ['__proto__', 'prototype', 'constructor'].includes(key))) throw Error('Adapter gap: no reviewed public font-size configuration binding for ' + artifact.adapter)
  if (base !== undefined && (base === null || typeof base !== 'object' || Array.isArray(base))) throw Error('Font-size binding requires an options object')
  const options = structuredClone(base ?? {}) as Record<string, any>
  let target = options
  for (const key of path.slice(0, -1)) {
    if (target[key] !== undefined && (target[key] === null || typeof target[key] !== 'object' || Array.isArray(target[key]))) throw Error('Font-size path collides with declared options')
    target = target[key] ??= {}
  }
  target[path.at(-1)!] = intent.fontSize
  return options
}
