// Builds the mmdr parser bridge (src/main.rs). The prepared mmdr artifact is a
// release binary, so the library source for exactly that version is fetched
// from crates.io into outDir and checked against the index checksum and the
// artifact's recorded revision. See ../../bridges.ts for the protocol.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const here = import.meta.dirname
const BIN = 'mmdr-bridge'
const CRATE = 'mermaid-rs-renderer'

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
  if (/\{\{\w+\}\}/.test(manifest)) throw new Error(`mmdr bridge: unfilled placeholder in Cargo.toml.template`)
  writeIfChanged(join(outDir, 'Cargo.toml'), manifest)
  // Start from the project's own lockfile so dependencies resolve to the versions it ships with.
  if (!existsSync(join(outDir, 'Cargo.lock')) && existsSync(lockFrom)) copyFileSync(lockFrom, join(outDir, 'Cargo.lock'))
}

function cargoBuild(outDir: string): string {
  const env = { CARGO_TARGET_DIR: join(outDir, 'target') }
  let result = run('cargo', ['build', '--release', '--offline'], { cwd: outDir, env })
  if (result.status !== 0) result = run('cargo', ['build', '--release'], { cwd: outDir, env })
  if (result.status !== 0) throw new Error(`mmdr bridge: cargo build failed in ${outDir}:\n${(result.stderr || String(result.error)).slice(-4000)}`)
  const binary = join(outDir, 'target', 'release', BIN)
  if (!existsSync(binary)) throw new Error(`mmdr bridge: cargo build did not produce ${binary}`)
  return binary
}

function fetchText(url: string): string {
  const result = run('curl', ['-fsSL', '--retry', '3', url])
  if (result.status !== 0) throw new Error(`mmdr bridge: could not fetch ${url}: ${result.stderr}`)
  return result.stdout
}

/** Download, checksum and extract the crates.io archive of CRATE@version into sourceDir. */
function fetchCrate(version: string, sourceDir: string) {
  const entry = fetchText(`https://index.crates.io/me/rm/${CRATE}`).split('\n').filter(Boolean).map(line => JSON.parse(line)).find(item => item.vers === version)
  if (!entry) throw new Error(`mmdr bridge: crates.io has no ${CRATE} ${version}`)
  mkdirSync(sourceDir, { recursive: true })
  const archive = join(sourceDir, `${CRATE}-${version}.crate`)
  const download = run('curl', ['-fsSL', '--retry', '3', '-o', archive, `https://static.crates.io/crates/${CRATE}/${CRATE}-${version}.crate`])
  if (download.status !== 0) throw new Error(`mmdr bridge: could not download ${CRATE} ${version}: ${download.stderr}`)
  const digest = createHash('sha256').update(readFileSync(archive)).digest('hex')
  if (digest !== entry.cksum) throw new Error(`mmdr bridge: ${archive} has sha256 ${digest}, crates.io index records ${entry.cksum}`)
  const untar = run('tar', ['-xzf', archive, '-C', sourceDir])
  if (untar.status !== 0) throw new Error(`mmdr bridge: could not extract ${archive}: ${untar.stderr}`)
}

/** Build (idempotently) into outDir and return the argv that runs the bridge. Throw with a clear message if the prepared artifact is not what the bridge needs. */
export async function build(peer: any, outDir: string): Promise<string[]> {
  if (peer?.node?.id !== '1jehuang/mermaid-rs-renderer') throw new Error(`mmdr bridge: peer is ${peer?.node?.id}, not 1jehuang/mermaid-rs-renderer`)
  const artifact = peer.artifact ?? {}
  const version = String(artifact.version ?? '').replace(/^v/, '')
  if (!/^\d+\.\d+\.\d+/.test(version)) throw new Error(`mmdr bridge: prepared artifact records no usable version (${artifact.version})`)
  const sourceDir = join(outDir, 'source')
  const crate = join(sourceDir, `${CRATE}-${version}`)
  if (!existsSync(join(crate, 'Cargo.toml'))) fetchCrate(version, sourceDir)
  const manifest = readFileSync(join(crate, 'Cargo.toml'), 'utf8')
  if (!manifest.includes(`\nname = "${CRATE}"\n`) || !manifest.includes(`\nversion = "${version}"\n`)) throw new Error(`mmdr bridge: ${crate}/Cargo.toml is not ${CRATE} ${version}`)
  const vcs = JSON.parse(readFileSync(join(crate, '.cargo_vcs_info.json'), 'utf8'))?.git?.sha1
  if (artifact.revision && vcs !== artifact.revision) throw new Error(`mmdr bridge: crates.io ${CRATE} ${version} was published from ${vcs}, artifact records ${artifact.revision}`)
  stage(outDir, { MMDR_CRATE: crate }, join(crate, 'Cargo.lock'))
  return [cargoBuild(outDir)]
}
