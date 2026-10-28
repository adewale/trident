import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { verifyEditor } from '../unified/editor-verification.ts'
test('an editor cannot borrow an application score from another source revision', async () => {
  const source = mkdtempSync(join(tmpdir(), 'trident-editor-source-'))
  try {
    execFileSync('git', ['init', '--quiet', source]); writeFileSync(join(source, 'source.txt'), 'fixture')
    execFileSync('git', ['add', '.'], { cwd: source }); execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--quiet', '-m', 'Wrong revision'], { cwd: source })
    await expect(verifyEditor({ project: 'gotoailab/modern_mermaid', source, dist: '/missing-build', out: join(source, 'must-not-execute') })).rejects.toThrow('differs from the catalog source pin')
  } finally { rmSync(source, { recursive: true, force: true }) }
})
