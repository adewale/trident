// Builds the bezel parser bridge (src/main.rs) against the prepared bezel-mermaid
// crate archive, re-extracted from the checksum-verified .crate into outDir. See ../../bridges.ts for the protocol.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const here = import.meta.dirname
const BIN = 'bezel-bridge'

function run(command: string, args: string[], options: { cwd?: string; env?: Record<string, string> } = {}) {
  const env = { ...process.env, PATH: `${process.env.PATH ?? ''}:${join(homedir(), '.cargo', 'bin')}`, ...options.env }
  return spawnSync(command, args, { cwd: options.cwd, env, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
}

function writeIfChanged(path: string, content: string) {
  if (!existsSync(path) || readFileSync(path, 'utf8') !== content) writeFileSync(path, content)
}

/** Copy the bridge sources and render Cargo.toml.template into outDir. */
function stage(outDir: string, fill: Record<string, string>, lockFrom: string) {
  mkdirSync(join(outDir, 'src'), { recursive: true })
  for (const name of readdirSync(join(here, 'src'))) writeIfChanged(join(outDir, 'src', name), readFileSync(join(here, 'src', name), 'utf8'))
  let manifest = readFileSync(join(here, 'Cargo.toml.template'), 'utf8')
  for (const [key, value] of Object.entries(fill)) manifest = manifest.replaceAll(`{{${key}}}`, value)
  if (/\{\{\w+\}\}/.test(manifest)) throw new Error(`bezel bridge: unfilled placeholder in Cargo.toml.template`)
  writeIfChanged(join(outDir, 'Cargo.toml'), manifest)
  // Start from the project's own lockfile so dependencies resolve to the versions it ships with.
  if (!existsSync(join(outDir, 'Cargo.lock')) && existsSync(lockFrom)) copyFileSync(lockFrom, join(outDir, 'Cargo.lock'))
}

function cargoBuild(outDir: string): string {
  const env = { CARGO_TARGET_DIR: join(outDir, 'target') }
  let result = run('cargo', ['build', '--release', '--offline'], { cwd: outDir, env })
  if (result.status !== 0) result = run('cargo', ['build', '--release'], { cwd: outDir, env })
  if (result.status !== 0) throw new Error(`bezel bridge: cargo build failed in ${outDir}:\n${(result.stderr || String(result.error)).slice(-4000)}`)
  const binary = join(outDir, 'target', 'release', BIN)
  if (!existsSync(binary)) throw new Error(`bezel bridge: cargo build did not produce ${binary}`)
  return binary
}

/** Build (idempotently) into outDir and return the argv that runs the bridge. Throw with a clear message if the prepared artifact is not what the bridge needs. */
export async function build(peer: any, outDir: string): Promise<string[]> {
  if (peer?.node?.id !== 'crabtalk/bezel') throw new Error(`bezel bridge: peer is ${peer?.node?.id}, not crabtalk/bezel`)
  const artifact = peer.artifact ?? {}
  const version = artifact.version
  if (!version) throw new Error('bezel bridge: prepared artifact records no version')
  const name = `bezel-mermaid-${version}`
  const archive = (artifact.files ?? []).find((file: any) => String(file.path).endsWith(`/${name}.crate`))
  if (!archive || !existsSync(archive.path)) throw new Error(`bezel bridge: prepared artifact lists no existing ${name}.crate`)
  const digest = createHash('sha256').update(readFileSync(archive.path)).digest('hex')
  if (digest !== archive.sha256) throw new Error(`bezel bridge: ${archive.path} has sha256 ${digest}, artifact records ${archive.sha256}`)
  const sourceDir = join(outDir, 'source')
  const crate = join(sourceDir, name)
  if (!existsSync(join(crate, 'Cargo.toml'))) {
    mkdirSync(sourceDir, { recursive: true })
    const untar = run('tar', ['-xzf', archive.path, '-C', sourceDir])
    if (untar.status !== 0) throw new Error(`bezel bridge: could not extract ${archive.path}: ${untar.stderr}`)
  }
  const manifest = readFileSync(join(crate, 'Cargo.toml'), 'utf8')
  if (!/\nname = "bezel-mermaid"\n/.test(manifest) || !manifest.includes(`\nversion = "${version}"\n`)) throw new Error(`bezel bridge: ${crate}/Cargo.toml is not bezel-mermaid ${version}`)
  const vcs = JSON.parse(readFileSync(join(crate, '.cargo_vcs_info.json'), 'utf8'))?.git?.sha1
  if (artifact.revision && vcs !== artifact.revision) throw new Error(`bezel bridge: crate was published from ${vcs}, artifact records ${artifact.revision}`)
  stage(outDir, { BEZEL_CRATE: crate }, join(crate, 'Cargo.lock'))
  return [cargoBuild(outDir)]
}
