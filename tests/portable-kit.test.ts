import { describe, expect, test } from 'bun:test'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
test('a copied Trident package builds relative outputs and runs its compiled worker without Agentic source, docs or Git', () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-copied-package-')),
    packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    copied = join(directory, 'standalone', 'trident'),
    empty = join(directory, 'empty')
  try {
    mkdirSync(copied, { recursive: true })
    mkdirSync(empty)
    cpSync(packageDirectory, copied, {
      recursive: true,
      filter: path =>
        !relative(packageDirectory, path)
          .split(sep)
          .some(part => ['node_modules', 'dist', '__pycache__', '.cache', '.git'].includes(part)),
    })
    const require = createRequire(join(packageDirectory, 'package.json'))
    mkdirSync(join(copied, 'node_modules'))
    for (const name of ['esbuild', 'saxes']) {
      let installed = dirname(require.resolve(name))
      while (!existsSync(join(installed, 'package.json')) || JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).name !== name) {
        const parent = dirname(installed)
        if (parent === installed) throw Error('Installed build dependency unavailable: ' + name)
        installed = parent
      }
      symlinkSync(installed, join(copied, 'node_modules', name), 'dir')
    }
    const env = { ...process.env }
    delete env.TRIDENT_AGENTIC_ROOT
    delete env.AM_BENCH_REPOSITORY_ROOT
    const node = execFileSync(process.env.NODE_BIN ?? 'node', ['-p', 'process.execPath'], { encoding: 'utf8' }).trim()
    const missingKit = spawnSync(node, [join(copied, 'commands.ts'), 'run', '--project', 'fixture/tool'], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect(missingKit.status).not.toBe(0)
    expect(missingKit.stderr).toContain('compiled kit is missing')
    const built = spawnSync(node, [join(copied, 'commands.ts'), 'build', '--out', 'portable/dist'], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect(built.status).toBe(0)
    expect(existsSync(join(copied, 'portable/dist/run.mjs'))).toBe(true)
    expect(existsSync(join(empty, 'portable/dist/run.mjs'))).toBe(false)
    expect(JSON.parse(readFileSync(join(copied, 'portable/dist/harness-artifact.json'), 'utf8')).sourceRevision).toBeNull()
    rmSync(join(copied, 'node_modules'), { recursive: true })
    const entry = spawnSync(node, [join(copied, 'commands.ts'), 'run', '--help'], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect(entry.status).toBe(0)
    const help = spawnSync(node, [join(copied, 'portable/dist/run.mjs'), '--help'], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect(help.status).toBe(0)
    expect(help.stdout).toContain('--artifact-root')
    const toy = join(empty, 'toy'),
      called = join(empty, 'called.txt'),
      resultFile = join(empty, 'result.json')
    mkdirSync(toy)
    writeFileSync(join(toy, 'package.json'), '{"name":"trident-copy-fixture","version":"1.0.0","type":"module"}')
    writeFileSync(join(toy, 'index.mjs'), `import{appendFileSync}from'node:fs';export function render(){appendFileSync(${JSON.stringify(called)},'actual public render\\n');return{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text x="2" y="20">Visible</text></svg>'}}`)
    const plan = spawnSync(node, [join(copied, 'commands.ts'), 'run', '--project', 'fixture/trident', '--artifact-root', toy, '--adapter', 'pele', '--entry', 'index.mjs', '--out', 'plan-evidence', '--records', 'plan-records', '--plan'], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect({ status: plan.status, stderr: plan.stderr }).toEqual({ status: 0, stderr: '' })
    expect(JSON.parse(plan.stdout).action).toBe('measure')
    expect(existsSync(called)).toBe(false)
    const job = join(empty, 'job.json')
    writeFileSync(
      job,
      JSON.stringify({
        artifact: { project: 'fixture/trident', root: toy, entry: join(toy, 'index.mjs'), version: '1.0.0', adapter: 'pele' },
        testCase: { id: 'standalone-render', family: 'flowchart', cohort: 'family', source: 'flowchart LR\nA[Visible]', expected: { accept: true, labels: ['Visible'] } },
        mode: 'cold',
        samples: 1,
        round: 1,
        replica: 'B',
        sample: 0,
        resultFile,
      }),
    )
    const rendered = spawnSync(node, [join(copied, 'portable/dist/worker.mjs'), job], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect({ status: rendered.status, stderr: rendered.stderr }).toEqual({ status: 0, stderr: '' })
    const result = JSON.parse(readFileSync(resultFile, 'utf8'))
    expect(readFileSync(called, 'utf8')).toBe('actual public render\n')
    expect(result.qualification.accepted).toBe(true)
    expect(result.qualification.checks.filter((check: any) => check.status === 'failed')).toEqual([])
    expect(result.qualification.checks.find((check: any) => check.name === 'label:Visible')?.status).toBe('passed')
    expect(result.qualification.semanticComplete).toBe(false)
    expect(result.tracks['first-use']).toHaveLength(1)
    const campaign = join(empty, 'campaign'), records = join(empty, 'records')
    const campaignArgs = ['--project', 'fixture/trident', '--artifact-root', toy, '--adapter', 'pele', '--entry', 'index.mjs', '--node', node, '--out', campaign, '--records', records, '--rounds', '1', '--samples', '1', '--cold-samples', '1', '--min-sample-ms', '0', '--preparation-concurrency', '1', '--cohort', 'invalid', '--allow-partial']
    const measured = spawnSync(node, [join(copied, 'commands.ts'), 'run', ...campaignArgs], { cwd: empty, env, encoding: 'utf8', timeout: 25_000 })
    // This intentionally permissive toy accepts invalid sources: the failed
    // record is retained, never promoted to a successful fidelity result.
    expect(measured.status).toBe(1)
    const first = JSON.parse(measured.stdout.slice(measured.stdout.lastIndexOf('\n{\n') + 1)), callsBeforeReuse = readFileSync(called, 'utf8')
    expect(first.reused).toBe(false)
    const cached = spawnSync(node, [join(copied, 'commands.ts'), 'run', ...campaignArgs], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect(cached.status).toBe(1)
    const second = JSON.parse(cached.stdout)
    expect(second.reused).toBe(true)
    expect(second.recordId).toBe(first.recordId)
    expect(readFileSync(called, 'utf8')).toBe(callsBeforeReuse)
    const indexFile = join(records, 'current.json'), indexBefore = readFileSync(indexFile), cancelScript = join(empty, 'cancel-cached.mjs')
    writeFileSync(cancelScript, `import{parsePortableOptions,runPortable}from${JSON.stringify(pathToFileURL(join(copied, 'portable/dist/run.mjs')).href)};import{PortableCancelled,terminatePortableWorkers}from${JSON.stringify(pathToFileURL(join(copied, 'portable/dist/execution.mjs')).href)};process.once('SIGTERM',terminatePortableWorkers);process.kill(process.pid,'SIGTERM');try{await runPortable(parsePortableOptions(${JSON.stringify(campaignArgs)}));throw Error('Cached campaign ignored pending cancellation')}catch(error){if(!(error instanceof PortableCancelled))throw error;console.log('cancelled')}`)
    const cancelled = spawnSync(node, [cancelScript], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect({ status: cancelled.status, stdout: cancelled.stdout.trim(), stderr: cancelled.stderr }).toEqual({ status: 0, stdout: 'cancelled', stderr: '' })
    expect(readFileSync(called, 'utf8')).toBe(callsBeforeReuse)
    expect(readFileSync(indexFile).equals(indexBefore)).toBe(true)
    const core = join(empty, 'core.json'),
      comparison = join(empty, 'comparison')
    writeFileSync(
      core,
      JSON.stringify({
        criteriaProtocol: { producers: ['authored-reader-fixture'] },
        cases: [{ id: 'reader-case', family: 'flowchart', required: true, source: 'flowchart LR\nA[Visible]', expected: { labels: ['Visible'] } }],
        targets: [{ project: 'mermaid-js/mermaid' }],
        toolVersions: [{ tool: 'mermaid-js/mermaid', version: '12.2.0', source: 'authored-reader-fixture' }],
        observations: [],
        artifacts: [],
      }),
    )
    const reported = spawnSync(node, [join(copied, 'commands.ts'), 'fidelity:report', '--core', core, '--out', comparison], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect({ status: reported.status, stderr: reported.stderr }).toEqual({ status: 0, stderr: '' })
    const document = join(comparison, 'comparison.json'),
      original = readFileSync(document, 'utf8')
    const exported = spawnSync(node, [join(copied, 'commands.ts'), 'export', '--input', document], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect({ status: exported.status, stderr: exported.stderr }).toEqual({ status: 0, stderr: '' })
    expect(JSON.parse(exported.stdout).declaredCaseCount).toBe(1)
    const fresh = join(empty, 'full.json'),
      written = spawnSync(node, [join(copied, 'commands.ts'), 'export', '--input', document, '--out', fresh], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect(written.status).toBe(0)
    expect(JSON.parse(readFileSync(fresh, 'utf8')).declaredCaseCount).toBe(1)
    const clobber = spawnSync(node, [join(copied, 'commands.ts'), 'export', '--input', document, '--out', document], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect(clobber.status).not.toBe(0)
    expect(readFileSync(document, 'utf8')).toBe(original)
    const missing = spawnSync(process.execPath, [join(copied, 'commands.ts'), 'agentic', '--list'], { cwd: empty, env, encoding: 'utf8', timeout: 30_000 })
    expect(missing.status).not.toBe(0)
    expect(missing.stderr).toContain('Unknown Trident command')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 90_000)

