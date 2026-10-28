import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { TRIDENT_VERSION } from '../version.ts'

if (process.argv.length !== 4 || process.argv[2] !== '--out') throw Error('Use package-release.ts --out FRESH_DIRECTORY')
const root = resolve(import.meta.dirname, '..'), out = resolve(process.argv[3]!)
if (existsSync(out)) throw Error('Release output must be fresh')
mkdirSync(out, { recursive: true })
const name = 'trident-' + TRIDENT_VERSION, kit = join(out, name)
const node = process.env.NODE_BIN ?? 'node'
execFileSync(node, [join(root, 'commands.ts'), 'build', '--out', kit], { cwd: root, stdio: 'inherit' })
copyFileSync(join(root, 'LICENSE'), join(kit, 'LICENSE'))
writeFileSync(join(kit, 'README.md'), `# Trident ${TRIDENT_VERSION}\n\nRequires Node 24+, an installed target artifact and the pinned Mermaid oracle.\n\nRun \`node run.mjs --version\` or \`node run.mjs --help\`. Set MERMAID_REFERENCE_DIR\nto the installed oracle. Benchmark inputs and target artifacts are separate.\n\nMethods: https://github.com/adewale/trident/blob/v${TRIDENT_VERSION}/BENCHMARKS.md\n`)
const version = execFileSync(node, [join(kit, 'run.mjs'), '--version'], { encoding: 'utf8' }).trim()
if (version !== 'Trident ' + TRIDENT_VERSION) throw Error('Compiled kit version differs from the source release')
const archive = name + '-node24.tar.gz'
execFileSync('tar', ['-czf', join(out, archive), '-C', out, name])
const sha256 = createHash('sha256').update(readFileSync(join(out, archive))).digest('hex')
writeFileSync(join(out, 'SHA256SUMS'), sha256 + '  ' + archive + '\n', { flag: 'wx' })
console.log(JSON.stringify({ version: TRIDENT_VERSION, archive: join(out, archive), sha256, checksums: join(out, 'SHA256SUMS') }))
