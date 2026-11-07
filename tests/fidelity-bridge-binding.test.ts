import { expect, test } from 'bun:test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { bindParserBridge, pythonBridgeCommand } from '../unified/mermaid-fidelity/bridges.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import { build as buildXMermaid } from '../unified/mermaid-fidelity/bridges/xmermaid/build.ts'
const temporary = useTempDirs('fidelity-bridge-binding-')

test('qualification binds bridge executables, scripts and generated WASM at unchanged paths', () => {
  const root = temporary.dir(), cache = join(root, 'cache'), generated = join(cache, 'parser')
  mkdirSync(generated, { recursive: true })
  const executable = join(root, 'runtime'), script = join(root, 'bridge.mjs'), wasm = join(generated, 'parser.wasm')
  for (const file of [executable, script, wasm]) writeFileSync(file, 'original')
  const bridge = { command: [executable, script, generated], version: '1', description: 'fixture' }
  const before = bindParserBridge(bridge, cache, {})
  expect(before.runtimeFiles).toHaveLength(3)
  for (const file of [executable, script, wasm]) {
    writeFileSync(file, 'changed')
    expect(bindParserBridge(bridge, cache, {})).not.toEqual(before)
    writeFileSync(file, 'original')
  }
})

test('Python bridge qualification binds installed package bytes as well as retained wheels', () => {
  const root = temporary.dir(), bin = join(root, 'venv/bin'), site = join(root, 'venv/lib/python3.13/site-packages/parser')
  mkdirSync(bin, { recursive: true }); mkdirSync(site, { recursive: true })
  const executable = join(bin, 'python'), module = join(site, '__init__.py')
  writeFileSync(executable, 'interpreter'); writeFileSync(module, 'original')
  const bridge = { command: [executable, '-I'], version: '1', description: 'fixture' }
  const peer = { artifact: { kind: 'python', python: executable } }
  const before = bindParserBridge(bridge, root, peer)
  writeFileSync(module, 'changed')
  expect(bindParserBridge(bridge, root, peer).installedRuntimeSha256).not.toBe(before.installedRuntimeSha256)
})

test('a completed generated-parser cache cannot hide altered glue or WASM', async () => {
  const root = temporary.dir(), source = join(root, 'source'), cache = join(root, 'cache')
  mkdirSync(join(source, 'dist'), { recursive: true })
  writeFileSync(join(source, 'package.json'), '{"version":"1"}')
  writeFileSync(join(source, 'dist/xmermaid.esm.js'), 'function parse_dsl(input) { return input }')
  writeFileSync(join(source, 'dist/xmermaid_wasm_bg.wasm'), 'original WASM bytes')
  const peer = { artifact: { root: source, version: '1' } }
  const command = await buildXMermaid(peer, cache), generated = command[2]!
  const glue = join(generated, 'xmermaid.mjs'), wasm = join(generated, 'xmermaid_wasm_bg.wasm'), expected = readFileSync(glue, 'utf8')
  writeFileSync(glue, 'different parser'); writeFileSync(wasm, 'different WASM')
  await buildXMermaid(peer, cache)
  expect(readFileSync(glue, 'utf8')).toBe(expected)
  expect(readFileSync(wasm, 'utf8')).toBe('original WASM bytes')
})

test('Python parser execution ignores stale bytecode even when its timestamp still matches', () => {
  const root = temporary.dir()
  execFileSync('python3', ['-c', `
import os,py_compile,sys
from pathlib import Path
p=Path(sys.argv[1])/'example.py'
p.write_text('value = 2')
os.utime(p,(1000000000,1000000000))
py_compile.compile(str(p),doraise=True)
p.write_text('value = 1')
os.utime(p,(1000000000,1000000000))
`, root])
  const program = 'import sys;sys.path.insert(0,sys.argv[1]);import example;print(example.value)'
  expect(execFileSync('python3', ['-I', '-c', program, root], { encoding: 'utf8' }).trim()).toBe('2')
  const command = pythonBridgeCommand('python3', '-c')
  expect(execFileSync(command[0]!, [...command.slice(1), program, root], { encoding: 'utf8' }).trim()).toBe('1')
})
