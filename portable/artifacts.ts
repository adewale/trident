import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { closeSync, openSync, readSync } from 'node:fs'

export function byteDigest(path: string): string {
  const hash = createHash('sha256'),
    fd = openSync(path, 'r'),
    buffer = Buffer.alloc(1024 * 1024)
  try {
    let count: number
    while ((count = readSync(fd, buffer, 0, buffer.length, null))) hash.update(buffer.subarray(0, count))
  } finally {
    closeSync(fd)
  }
  return hash.digest('hex')
}
export function runtimeIdentity(node: string) {
  return JSON.parse(execFileSync(node, ['-e', 'process.stdout.write(JSON.stringify({executable:process.execPath,node:process.versions.node,v8:process.versions.v8,platform:process.platform,arch:process.arch}))'], { encoding: 'utf8', timeout: 10_000 }))
}
