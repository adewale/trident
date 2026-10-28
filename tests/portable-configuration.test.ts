import { expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { portableRenderOptions } from '../portable/configuration.ts'
import { qualifyPortable } from '../portable/fidelity.ts'
import type { PortableCase } from '../portable/cohorts.ts'

test('semantic configuration uses each reviewed public path and keeps declared options immutable', () => {
  expect(portableRenderOptions({ adapter: 'agentic' }, { fontSize: 24 })).toEqual({ style: { roles: { node: { fontSize: 24 } } } })
  expect(portableRenderOptions({ adapter: 'pele' }, { fontSize: 24 })).toEqual({ fontSize: 24 })
  const binding = { export: 'draw', options: { color: 'blue', typography: { family: 'Inter' } }, fontSizePath: ['typography', 'size'] }
  expect(portableRenderOptions({ adapter: 'declared', binding }, { fontSize: 24 })).toEqual({ color: 'blue', typography: { family: 'Inter', size: 24 } })
  expect(binding.options.typography).toEqual({ family: 'Inter' })
  for (const adapter of ['beautiful', 'ondine', 'declared'] as const) expect(() => portableRenderOptions({ adapter }, { fontSize: 24 })).toThrow('Adapter gap')
  expect(() => portableRenderOptions({ adapter: 'declared', binding: { export: 'draw', fontSizePath: ['__proto__', 'size'] } }, { fontSize: 24 })).toThrow('Adapter gap')
})

const configured: PortableCase = { id: 'configured-label', family: 'flowchart', cohort: 'adversarial', source: 'flowchart LR\nA[Visible]', renderOptions: { fontSize: 24 }, expected: { accept: true, labels: ['Visible'] } }
const svg = (root: number, text: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" style="font:${root}px sans-serif"><text font-size="${text}">Visible</text></svg>`
test('font checks follow actual authored labels rather than the root or unrelated text', () => {
  const check = (output: string) => qualifyPortable(configured, { svg: output }).checks.find(check => check.name === 'svg-label-font-size:Visible')
  expect(check(svg(14, 24))?.status).toBe('passed')
  expect(check(svg(24, 14))?.status).toBe('failed')
  expect(check(svg(24, 14).replace('</svg>', '<text font-size="24">Unrelated</text></svg>'))?.status).toBe('failed')
  expect(check(svg(24, 24).replace('</svg>', '<style>text{font-size:12px}</style></svg>'))?.status).toBe('unmeasured')
})

test('the real Node worker translates seed and edited font options; unavailable bindings remain blocked', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trident-font-api-'))
  try {
    const entry = join(dir, 'renderer.mjs')
    writeFileSync(entry, `export function renderMermaidSVG(source,options){if(options?.fontSize)throw Error('unknown render option fontSize');const size=options?.style?.roles?.node?.fontSize??14;return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><text font-size="'+size+'">Visible</text></svg>'}export const renderMermaidSync=renderMermaidSVG`)
    const testCase = { ...configured, renderOptions: { fontSize: 14 }, edit: { source: configured.source, expected: configured.expected, renderOptions: { fontSize: 24 } } }
    for (const adapter of ['agentic', 'beautiful']) {
      const resultFile = join(dir, adapter + '.json'), input = join(dir, adapter + '-job.json')
      writeFileSync(input, JSON.stringify({ artifact: { project: 'fixture/public-api', root: dir, entry, adapter, version: '1.0.0' }, testCase, mode: 'warm', samples: 2, minSampleMs: 0, round: 1, replica: 'B', sample: 0, resultFile }))
      const child = spawnSync(process.env.NODE_BIN ?? 'node', [resolve(import.meta.dir, '../portable/worker.mjs'), input], { encoding: 'utf8', timeout: 10000 })
      const result = JSON.parse(readFileSync(resultFile, 'utf8'))
      if (adapter === 'agentic') {
        expect(child.status).toBe(0)
        expect(result.qualification.checks.find((check: any) => check.name === 'svg-label-font-size:Visible')?.status).toBe('passed')
        expect(result.qualification.evidence.outputAdmission).toBe('passed')
        expect(result.tracks['warm-label-edit']).toHaveLength(2)
      } else {
        expect(child.status).toBe(2)
        expect(result.status).toBe('blocked')
        expect(result.error).toContain('Adapter gap')
        expect(result.qualification).toBeNull()
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
