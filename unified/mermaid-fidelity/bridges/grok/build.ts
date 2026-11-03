// Builds the grok parser bridge (src/main.rs + build.rs) against the prepared
// grok-build source checkout, whose private mermaid.rs build.rs compiles unmodified. See ../../bridges.ts for the protocol.
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const here = import.meta.dirname
const BIN = 'grok-bridge'
const MERMAID_RS = 'crates/codegen/xai-grok-markdown/src/mermaid.rs'

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
  writeIfChanged(join(outDir, 'build.rs'), readFileSync(join(here, 'build.rs'), 'utf8'))
  let manifest = readFileSync(join(here, 'Cargo.toml.template'), 'utf8')
  for (const [key, value] of Object.entries(fill)) manifest = manifest.replaceAll(`{{${key}}}`, value)
  if (/\{\{\w+\}\}/.test(manifest)) throw new Error(`grok bridge: unfilled placeholder in Cargo.toml.template`)
  writeIfChanged(join(outDir, 'Cargo.toml'), manifest)
  // Start from the project's own lockfile so dependencies resolve to the versions it ships with.
  if (!existsSync(join(outDir, 'Cargo.lock')) && existsSync(lockFrom)) copyFileSync(lockFrom, join(outDir, 'Cargo.lock'))
}

function cargoBuild(outDir: string): string {
  const env = { CARGO_TARGET_DIR: join(outDir, 'target') }
  let result = run('cargo', ['build', '--release', '--offline'], { cwd: outDir, env })
  if (result.status !== 0) result = run('cargo', ['build', '--release'], { cwd: outDir, env })
  if (result.status !== 0) throw new Error(`grok bridge: cargo build failed in ${outDir}:\n${(result.stderr || String(result.error)).slice(-4000)}`)
  const binary = join(outDir, 'target', 'release', BIN)
  if (!existsSync(binary)) throw new Error(`grok bridge: cargo build did not produce ${binary}`)
  return binary
}

/** Build (idempotently) into outDir and return the argv that runs the bridge. Throw with a clear message if the prepared artifact is not what the bridge needs. */
export async function build(peer: any, outDir: string): Promise<string[]> {
  if (peer?.node?.id !== 'xai-org/grok-build') throw new Error(`grok bridge: peer is ${peer?.node?.id}, not xai-org/grok-build`)
  const artifact = peer.artifact ?? {}
  const revision: string | undefined = artifact.sourceRevision ?? artifact.revision
  if (!revision) throw new Error('grok bridge: prepared artifact records no source revision')
  const source = join(artifact.root ?? '', 'source')
  if (!artifact.root || !existsSync(join(source, MERMAID_RS))) throw new Error(`grok bridge: prepared artifact has no ${MERMAID_RS} under ${source}`)
  const head = run('git', ['-C', source, 'rev-parse', 'HEAD'])
  if (head.status !== 0) throw new Error(`grok bridge: ${source} is not a git checkout: ${head.stderr}`)
  if (head.stdout.trim() !== revision) throw new Error(`grok bridge: source is at ${head.stdout.trim()}, artifact records ${revision}`)
  if (run('git', ['-C', source, 'diff', '--quiet', 'HEAD', '--', MERMAID_RS]).status !== 0) throw new Error(`grok bridge: ${MERMAID_RS} differs from revision ${revision}`)
  stage(outDir, {}, join(source, 'Cargo.lock'))
  writeIfChanged(join(outDir, 'grok-mermaid-path.txt'), join(source, MERMAID_RS) + '\n')
  return [cargoBuild(outDir)]
}
