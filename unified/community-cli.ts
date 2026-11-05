// A project's npm package can declare a Node CLI in its catalog binding; preparation attaches
// it to the prepared artifact as an additional CLI that DaveBench terminal and Drawing call.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { adapterCompanionIdentity } from './community.ts'
import type { PreparedCommunity } from './community-types.ts'

interface Variant {
  prepared: PreparedCommunity
  variantOf: string
  variant: string
  outputs: string[]
  error?: string
}
const read = readBenchmarkDocument
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
function shippedFiles(root: string, directory = root): Array<{ path: string; sha256: string }> {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git'].includes(entry.name)) return []
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return shippedFiles(root, path)
    return entry.isFile() ? [{ path, sha256: digest(path) }] : []
  })
}
/** A catalog binding selects the installed package's declared Node CLI, for any project. */
export function packageCliVariants(prepared: PreparedCommunity[]): Variant[] {
  const packages = prepared.filter(base => base.node.benchmark?.cli && !base.artifact?.additionalCli?.some(cli => cli.id === 'node-cli')).map<Variant>(base => {
    const binding = base.node.benchmark!.cli!, variant = 'node-cli'
    const unavailable = (error: string): Variant => ({ variantOf: base.node.id, variant, outputs: binding.outputs,
      prepared: { node: { ...base.node, id: `${base.node.id}#${variant}` }, error }, error })
    try {
      if (!base.artifact?.root) return unavailable(base.error ?? 'Prepared package has no installed root')
      const root = base.artifact.root, pkg = read(join(root, 'package.json'))
      const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.[binding.bin]
      if (typeof bin !== 'string') return unavailable('Installed package does not declare the requested bin: ' + binding.bin)
      const cli = resolve(root, bin)
      if (!existsSync(cli)) return unavailable('Declared package CLI is missing')
      const subpath = relative(realpathSync(root), realpathSync(cli))
      if (subpath === '..' || subpath.startsWith('..' + sep)) return unavailable('Declared package CLI is outside its artifact')
      if (!binding.outputs.length || binding.outputs.some(output => !['svg', 'terminal', 'png'].includes(output))) return unavailable('CLI binding requires declared SVG, terminal or PNG outputs')
      const node = JSON.parse(execFileSync(process.env.NODE_BIN ?? 'node', ['-p', 'JSON.stringify({executable:process.execPath,version:process.versions.node})'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
      return { variantOf: base.node.id, variant, outputs: binding.outputs,
        prepared: { node: { ...base.node, id: `${base.node.id}#${variant}`, benchmark: { ...base.node.benchmark!, outputs: binding.outputs } },
          artifact: { kind: 'cli', root, executable: node.executable, sha256: digest(node.executable), args: [cli, ...binding.args], input: 'stdin', version: pkg.version, runtime: `node:${node.version} installed public CLI`, files: shippedFiles(root), ...(base.artifact.integrity ? { adapterCompanions: [{ root, name: pkg.name, version: pkg.version, integrity: base.artifact.integrity, closureSha256: createHash('sha256').update(JSON.stringify(adapterCompanionIdentity(root))).digest('hex') }] } : {}) } } }
    } catch (error) { return unavailable(String(error)) }
  })
  const releases: Variant[] = prepared.flatMap(base => (base.artifact?.additionalCli ?? []).map(extra => ({ variantOf: base.node.id, variant: extra.id, outputs: extra.outputs, ...(extra.error ? { error: extra.error } : {}), prepared: { node: { ...base.node, id: `${base.node.id}#${extra.id}`, benchmark: { ...base.node.benchmark!, outputs: extra.outputs } }, artifact: extra.artifact, error: extra.error } })))
  return [...packages, ...releases]
}
