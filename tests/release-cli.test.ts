import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { prepareReleaseCli, verifyReleaseCli } from '../unified/release-cli.ts'
import type { CommunityNode } from '../unified/community-types.ts'
for (const member of ['tool', './tool']) test(`public CLI archive member ${member} retains archive ownership, version and binding checks`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-release-cli-'))
  try {
    const executable = join(root, 'tool'); writeFileSync(executable, '#!/bin/sh\necho "tool 1.0.0"\n'); chmodSync(executable, 0o755)
    const archive = join(root, 'tool.tar'); execFileSync('tar', ['-cf', archive, '-C', root, member])
    const sha256 = createHash('sha256').update(readFileSync(archive)).digest('hex')
    const directory = join(root, 'public-release-cli/fixture--tool/v1', sha256); mkdirSync(directory, { recursive: true }); writeFileSync(join(directory, 'tool.tar'), readFileSync(archive))
    const node: CommunityNode = { id: 'fixture/tool', roles: ['renderer'], outputs: ['terminal'], benchmark: { adapter: 'fixture', cliRelease: { repository: 'fixture/tool', tag: 'v1', version: '1.0.0', revision: 'a'.repeat(40), outputs: { terminal: { args: ['render'], input: 'stdin' } }, platforms: { [`${process.platform}-${process.arch}`]: { asset: 'tool.tar', executable: member, sha256 } } } } }
    const result = await prepareReleaseCli(node, root)
    expect(result.error).toBeUndefined(); expect(result.artifact?.version).toBe('1.0.0')
    const parent: any = { additionalCli: [result] }
    expect(() => verifyReleaseCli(node, parent)).not.toThrow()
    expect(() => verifyReleaseCli(node, { ...parent, additionalCli: [{ ...result, artifact: { ...result.artifact, outputBindings: { terminal: { args: ['different'] } } } }] })).toThrow('binding')
    const wrong = { ...node, benchmark: { ...node.benchmark!, cliRelease: { ...node.benchmark!.cliRelease!, version: '2.0.0' } } }
    expect((await prepareReleaseCli(wrong, root)).error).toContain('version differs')
    for (const unsafe of ['../tool', './../tool', './nested/../tool', '/tmp/tool']) {
      const escaped = { ...node, benchmark: { ...node.benchmark!, cliRelease: { ...node.benchmark!.cliRelease!, platforms: { [`${process.platform}-${process.arch}`]: { asset: 'tool.tar', executable: unsafe, sha256 } } } } }
      expect((await prepareReleaseCli(escaped, root)).error).toContain('Unsafe public release path')
    }
    writeFileSync(join(directory, 'tool.tar'), 'changed archive')
    expect(() => verifyReleaseCli(node, parent)).toThrow('SHA-256')
    expect((await prepareReleaseCli(node, root)).error).toContain('SHA-256')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
