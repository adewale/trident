// Builds the figurehead parser bridge (src/main.rs) against the prepared
// figurehead-rs source checkout. See ../../bridges.ts for the protocol.
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const here = import.meta.dirname
const BIN = 'figurehead-bridge'

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
  if (/\{\{\w+\}\}/.test(manifest)) throw new Error(`figurehead bridge: unfilled placeholder in Cargo.toml.template`)
  writeIfChanged(join(outDir, 'Cargo.toml'), manifest)
  // Start from the project's own lockfile so dependencies resolve to the versions it ships with.
  if (!existsSync(join(outDir, 'Cargo.lock')) && existsSync(lockFrom)) copyFileSync(lockFrom, join(outDir, 'Cargo.lock'))
}

function cargoBuild(outDir: string): string {
  const env = { CARGO_TARGET_DIR: join(outDir, 'target') }
  let result = run('cargo', ['build', '--release', '--offline'], { cwd: outDir, env })
  if (result.status !== 0) result = run('cargo', ['build', '--release'], { cwd: outDir, env })
  if (result.status !== 0) throw new Error(`figurehead bridge: cargo build failed in ${outDir}:\n${(result.stderr || String(result.error)).slice(-4000)}`)
  const binary = join(outDir, 'target', 'release', BIN)
  if (!existsSync(binary)) throw new Error(`figurehead bridge: cargo build did not produce ${binary}`)
  return binary
}

/** Build (idempotently) into outDir and return the argv that runs the bridge. Throw with a clear message if the prepared artifact is not what the bridge needs. */
export async function build(peer: any, outDir: string): Promise<string[]> {
  if (peer?.node?.id !== 'Mootikins/figurehead-rs') throw new Error(`figurehead bridge: peer is ${peer?.node?.id}, not Mootikins/figurehead-rs`)
  const artifact = peer.artifact ?? {}
  const source: string | undefined = artifact.sourceRoot
  if (!source || !existsSync(join(source, 'crates', 'figurehead', 'Cargo.toml'))) throw new Error(`figurehead bridge: prepared artifact has no figurehead source (sourceRoot ${source})`)
  const head = run('git', ['-C', source, 'rev-parse', 'HEAD'])
  if (head.status !== 0) throw new Error(`figurehead bridge: ${source} is not a git checkout: ${head.stderr}`)
  if (artifact.revision && head.stdout.trim() !== artifact.revision) throw new Error(`figurehead bridge: source is at ${head.stdout.trim()}, artifact records ${artifact.revision}`)
  if (run('git', ['-C', source, 'diff', '--quiet', 'HEAD', '--', 'crates/figurehead']).status !== 0) throw new Error(`figurehead bridge: ${source}/crates/figurehead has local modifications`)
  const version = readFileSync(join(source, 'Cargo.toml'), 'utf8').match(/\[workspace\.package\][^[]*?\nversion\s*=\s*"([^"]+)"/)?.[1]
  if (artifact.version && version !== String(artifact.version).replace(/^v/, '')) throw new Error(`figurehead bridge: source version ${version} does not match artifact ${artifact.version}`)
  stage(outDir, { FIGUREHEAD_CRATE: join(source, 'crates', 'figurehead') }, join(source, 'Cargo.lock'))
  return [cargoBuild(outDir)]
}
