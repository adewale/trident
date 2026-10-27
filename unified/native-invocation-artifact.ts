import { createHash } from 'node:crypto'
import { accessSync, closeSync, constants, openSync, readSync, realpathSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** A separately supplied executable is its own artifact. Its location does not
 * establish membership in the npm archive or equivalence to package sources. */
export interface NativeInvocationArtifact {
  selection: 'explicit-executable' | 'package-root-default'
  requestedPath: string
  path: string
  sha256: string
  bytes: number
  ownership: 'separately-admitted-executable'
  sourceEquivalence: 'requires-independent-build-receipt'
}
export type NativeInvocationAdmission = { status: 'available'; artifact: NativeInvocationArtifact } | { status: 'blocked'; requestedPath: string; detail: string }
export function admitNativeInvocationArtifact(options: { root: string; packageRoot?: string; nativeExecutable?: string }): NativeInvocationAdmission {
  const requestedPath = resolve(options.nativeExecutable ?? join(options.packageRoot ?? options.root, 'dist/am'))
  try {
    const path = realpathSync(requestedPath), stat = statSync(path)
    if (!stat.isFile() || stat.size === 0) throw Error('Expected a nonempty executable file')
    accessSync(path, constants.R_OK | constants.X_OK)
    // Bounded reads avoid allocating a complete compiled Bun runtime in the driver.
    const descriptor = openSync(path, 'r'), hash = createHash('sha256'), buffer = Buffer.allocUnsafe(64 * 1024)
    let bytes = 0
    try {
      let size
      while ((size = readSync(descriptor, buffer, 0, buffer.length, null)) > 0) { hash.update(buffer.subarray(0, size)); bytes += size }
    } finally { closeSync(descriptor) }
    if (bytes !== stat.size) throw Error('Executable changed while admitting its bytes')
    return { status: 'available', artifact: { selection: options.nativeExecutable ? 'explicit-executable' : 'package-root-default', requestedPath, path, sha256: hash.digest('hex'), bytes, ownership: 'separately-admitted-executable', sourceEquivalence: 'requires-independent-build-receipt' } }
  } catch (error) {
    return { status: 'blocked', requestedPath, detail: `Native executable admission failed for ${requestedPath}: ${String(error)}. An explicit missing or invalid executable never falls back to another artifact.` }
  }
}
