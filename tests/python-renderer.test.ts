import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TerminalCallWorker } from '../unified/terminal-call-worker.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('python-renderer-')

test('public Python rendering ignores environment/bytecode overrides and rejects installed-source changes', async () => {
  const root = temporary.dir(), venv = join(root, 'venv')
  execFileSync('python3', ['-m', 'venv', '--without-pip', venv])
  const executable = join(venv, 'bin/python'), site = execFileSync(executable, ['-I', '-c', 'import sysconfig;print(sysconfig.get_path("purelib"))'], { encoding: 'utf8' }).trim()
  const module = join(site, 'termaid', '__init__.py'), metadata = join(site, 'termaid-0.0.0.dist-info')
  mkdirSync(join(site, 'termaid'), { recursive: true }); mkdirSync(metadata)
  writeFileSync(metadata + '/METADATA', 'Metadata-Version: 2.1\nName: termaid\nVersion: 0.0.0\n')
  execFileSync(executable, ['-I', '-c', `
import os,py_compile,sys
from pathlib import Path
p=Path(sys.argv[1])
p.write_text("def render(source): return 'STALE'\\n")
os.utime(p,(1000000000,1000000000))
py_compile.compile(str(p),doraise=True,invalidation_mode=py_compile.PycInvalidationMode.TIMESTAMP)
p.write_text("def render(source): return 'FRESH'\\n")
os.utime(p,(1000000000,1000000000))
`, module])
  expect(execFileSync(executable, ['-c', 'import termaid;print(termaid.render("source"))'], { env: { ...process.env, PYTHONPATH: '' }, encoding: 'utf8' }).trim()).toBe('STALE')
  const shadow = join(root, 'shadow'); mkdirSync(shadow); writeFileSync(join(shadow, 'termaid.py'), "def render(source): return 'SHADOW'\n")
  const previous = process.env.PYTHONPATH
  let worker: TerminalCallWorker | undefined
  try {
    process.env.PYTHONPATH = shadow
    const peer: any = { node: { id: 'fasouto/termaid' }, artifact: { kind: 'python', python: executable, executable, version: '0.0.0' } }
    worker = new TerminalCallWorker(peer, join(root, 'operand.json'), undefined, value => ({ valid: value === 'FRESH' }))
    expect((await worker.call('source', 'fixture', 2000)).outcome).toBe('completed')
    expect(worker.identity).toMatchObject({ package: 'termaid', version: '0.0.0', runtime: { isolated: true } })
    expect(worker.identity.binding.installedRuntimeSha256).toMatch(/^[a-f0-9]{64}$/)
    writeFileSync(module, "def render(source): return 'OTHER'\n")
    await expect(worker.close()).rejects.toThrow('Python render runtime changed')
  } finally {
    if (previous === undefined) delete process.env.PYTHONPATH; else process.env.PYTHONPATH = previous
    await worker?.close().catch(() => {})
  }
})
