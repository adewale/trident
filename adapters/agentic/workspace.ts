import { execFileSync } from 'node:child_process'
import { closeSync, cpSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import sourceScripts from './agentic-scripts.json' with { type: 'json' }

export const tridentRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const git = (root: string, args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const write = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n')

/** Legacy source probes still use Agentic's repository layout. Assemble that
 * layout from public tracked inputs; never require its old benchmark package. */
export function withAgenticWorkspace<T>(source: string, checks: boolean, use: (workspace: string) => T): T {
  const root = realpathSync(source)
  if (read(join(root, 'package.json')).name !== 'agentic-mermaid') throw Error('TRIDENT_AGENTIC_ROOT must name an Agentic Mermaid source checkout')
  const revision = git(root, ['rev-parse', 'HEAD'])
  const tridentRevision = git(tridentRoot, ['rev-parse', 'HEAD'])
  const sourceDirty = Boolean(git(root, ['status', '--porcelain']))
  const tridentDirty = Boolean(git(tridentRoot, ['status', '--porcelain']))
  if (!checks && (sourceDirty || tridentDirty)) throw Error('Commit source and Trident changes before collecting benchmarks; test/typecheck may exercise working changes')
  const cache = resolve(process.env.TRIDENT_CACHE_DIR ?? join(tridentRoot, '.cache'))
  mkdirSync(cache, { recursive: true })
  const lock = join(cache, 'agentic-workspace.lock')
  let fd: number
  try { fd = openSync(lock, 'wx') } catch { throw Error('Trident source workspace is in use or was interrupted: ' + lock + '. Remove an interrupted lock only after its processes have stopped.') }
  const workspace = join(cache, 'agentic-workspace')
  const receiptFile = join(workspace, '.trident-workspace.json')
  const covers = (path: string) => { const subpath = relative(workspace, path); return subpath === '' || (!isAbsolute(subpath) && subpath !== '..' && !subpath.startsWith('..' + sep)) }
  if (covers(root) || covers(tridentRoot) || (existsSync(workspace) && lstatSync(workspace).isSymbolicLink())) { closeSync(fd); rmSync(lock, { force: true }); throw Error('Source workspace must not replace an input checkout or a symlink') }
  try {
    writeFileSync(fd, JSON.stringify({ pid: process.pid, root, revision, tridentRevision }))
    const receipt = { schemaVersion: 1, state: 'ready', root, revision, tridentRoot, tridentRevision, sourceDirty, tridentDirty, checksOnly: checks }
    const previous = existsSync(receiptFile) ? read(receiptFile) : undefined
    if (!checks && !sourceDirty && !tridentDirty && JSON.stringify(previous) === JSON.stringify(receipt)) {
      if (git(workspace, ['status', '--porcelain'])) throw Error('Prepared source workspace changed; remove its cache directory before retrying')
      return use(workspace)
    }
    // Only a previously owned generated directory may be replaced.
    if (existsSync(workspace) && (previous?.schemaVersion !== 1 || previous.tridentRoot !== tridentRoot)) throw Error('Refusing to replace an unowned source workspace: ' + workspace)
    rmSync(workspace, { recursive: true, force: true })
    mkdirSync(workspace)
    write(receiptFile, { ...receipt, state: 'preparing' })
    const archive = execFileSync('git', ['archive', '--format=tar', revision], { cwd: root, maxBuffer: 128 * 1024 * 1024 })
    execFileSync('tar', ['-x', '-C', workspace], { input: archive })
    // Checks deliberately exercise working files rather than a stale HEAD.
    if (checks && sourceDirty) {
      const changed = [...git(root, ['diff', '--name-only', '-z', 'HEAD']).split('\0'), ...git(root, ['ls-files', '-z', '--others', '--exclude-standard']).split('\0')].filter(Boolean)
      for (const path of new Set(changed)) {
        const destination = join(workspace, path)
        rmSync(destination, { recursive: true, force: true })
        if (existsSync(join(root, path))) { mkdirSync(dirname(destination), { recursive: true }); cpSync(join(root, path), destination) }
      }
    }
    const packageDirectory = join(workspace, 'eval/benchmark')
    rmSync(packageDirectory, { recursive: true, force: true })
    mkdirSync(packageDirectory, { recursive: true })
    const files = git(tridentRoot, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean)
    for (const file of files) {
      // Published measurement outputs remain in Trident, outside the source driver.
      if (file.startsWith('results/') || !existsSync(join(tridentRoot, file))) continue
      const destination = join(packageDirectory, file)
      mkdirSync(dirname(destination), { recursive: true })
      cpSync(join(tridentRoot, file), destination)
    }
    // Generic catalog ownership moved to Trident; the product policy stays in Agentic.
    mkdirSync(join(workspace, 'docs'), { recursive: true })
    cpSync(join(tridentRoot, 'catalog/mermaid-community.json'), join(workspace, 'docs/mermaid-community.json'))
    const pkg = read(join(workspace, 'package.json'))
    for (const key of Object.keys(pkg.scripts)) if (key === 'bench' || key.startsWith('bench:') || key === 'check:output-identity') delete pkg.scripts[key]
    Object.assign(pkg.scripts, sourceScripts)
    write(join(workspace, 'package.json'), pkg)
    const gitDirectory = join(workspace, '.git')
    git(workspace, ['init', '-q'])
    // Reuse immutable Git objects, not working files. The original checkout is
    // an explicit source dependency and remains unchanged by this operation.
    mkdirSync(join(gitDirectory, 'objects/info'), { recursive: true })
    writeFileSync(join(gitDirectory, 'objects/info/alternates'), resolve(root, git(root, ['rev-parse', '--git-path', 'objects'])) + '\n')
    git(workspace, ['update-ref', 'HEAD', revision])
    git(workspace, ['read-tree', revision])
    writeFileSync(join(gitDirectory, 'info/exclude'), '\nnode_modules\n/dist\n/website/public\n/website/src/generated\n/bench-report\n', { flag: 'a' })
    write(receiptFile, receipt)
    git(workspace, ['add', '-A'])
    const hooks = join(gitDirectory, 'trident-no-hooks')
    mkdirSync(hooks)
    git(workspace, ['-c', 'user.name=Trident', '-c', 'user.email=trident@localhost', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=' + hooks, 'commit', '-qm', `Trident ${tridentRevision} with Agentic ${revision}`])
    const remote = git(root, ['remote', 'get-url', 'origin'])
    git(workspace, ['remote', 'add', 'origin', remote])
    try { git(workspace, ['update-ref', 'refs/remotes/origin/main', git(root, ['rev-parse', 'origin/main'])]) } catch {}
    mkdirSync(join(root, 'bench-report'), { recursive: true })
    const links = [['bench-report', join(root, 'bench-report')], ['node_modules', join(root, 'node_modules')], ['eval/benchmark/node_modules', join(tridentRoot, 'node_modules')], ['dist', join(root, 'dist')], ['website/public', join(root, 'website/public')], ['website/src/generated', join(root, 'website/src/generated')]]
    for (const [path, target] of links) if (existsSync(target!)) {
      const destination = join(workspace, path!)
      if (!existsSync(destination)) { mkdirSync(dirname(destination), { recursive: true }); symlinkSync(target!, destination, 'dir') }
    }
    return use(workspace)
  } finally { closeSync(fd); rmSync(lock, { force: true }) }
}
