import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { upstreamZenCoreVersion } from '../unified/prepare-upstream.ts'

test('the original runner uses the locked ZenUML engine rather than its semver minimum', () => {
  const source = mkdtempSync(join(tmpdir(), 'trident-source-lock-'))
  try {
    writeFileSync(join(source, 'pnpm-lock.yaml'), `importers:

  packages/mermaid-zenuml:
    dependencies:
      '@zenuml/core':
        specifier: ^3.47.9
        version: 3.49.2(@babel/core@7.29.7)

  packages/another-package:
    dependencies:
      '@zenuml/core':
        specifier: ^3.47.9
        version: 3.47.9
`)
    expect(upstreamZenCoreVersion(source)).toBe('3.49.2')
    writeFileSync(join(source, 'pnpm-lock.yaml'), `importers:
  packages/another-package:
    dependencies:
      '@zenuml/core':
        specifier: ^3.47.9
        version: 3.47.9
`)
    expect(() => upstreamZenCoreVersion(source)).toThrow('exactly one ZenUML core engine')
  } finally { rmSync(source, { recursive: true, force: true }) }
})
