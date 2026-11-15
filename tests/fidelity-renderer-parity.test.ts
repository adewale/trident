import { expect, test } from 'bun:test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fidelityOutcomes } from '../unified/mermaid-fidelity.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-renderer-parity-')

// Fidelity compares parser models. Agentic once had its public SVG renderer bound into
// Mermaid's Diagram renderer protocol while no other candidate had one, so only Agentic
// could pass tests that draw. No candidate's renderer is bound now.
test("a test that draws through Mermaid's Diagram renderer is a Trident gap for Agentic too, and its renderer is never called", () => {
  const root = temporary.dir(), file = join(root, 'sequence.spec.ts'), renderLog = join(root, 'render.log')
  writeFileSync(join(root, 'package.json'), '{"type":"module"}')
  writeFileSync(join(root, 'agent.mjs'), `import { appendFileSync } from 'node:fs'
export function renderMermaidSVG(source) { appendFileSync(${JSON.stringify(renderLog)}, source + '\\n'); return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text x="1" y="5">A</text></svg>' }
export function parseSequenceDiagram() { return { actors: [], messages: [], notes: [] } }`)
  const job = { upstream: root, reference: root, audit: join(root, 'audit.jsonl'), target: { tool: 'agentic', project: 'adewale/agentic-mermaid', root, entry: join(root, 'agent.mjs') }, files: [{ absolute: file, family: 'sequence', helperIdentifiers: [], declarations: [{ name: 'draws', identifiers: [] }] }] }
  const jobPath = join(root, 'job.json'); writeFileSync(jobPath, JSON.stringify(job))
  const script = join(root, 'exercise.ts')
  writeFileSync(script, `
    import {initialize,moduleFor,begin,finish,shutdown} from ${JSON.stringify(resolve(import.meta.dirname, '../unified/mermaid-fidelity/runtime.ts'))}
    const file={filepath:${JSON.stringify(file)},tasks:[] as any[]}
    const task={type:'test',name:'draws',id:'0',file,result:{state:'run'}}; file.tasks=[task]
    await initialize(file.filepath)
    const { Diagram } = moduleFor('sequence','../../Diagram.js',file.filepath,{Diagram:'Diagram'})
    begin(task); let error
    try { const diagram = await Diagram.fromText('sequenceDiagram\\nA->>B: hi'); await diagram.renderer.draw('sequenceDiagram\\nA->>B: hi', 'drawing') } catch (caught) { error = caught }
    task.result.state = error ? 'fail' : 'pass'
    try { finish(task) } catch (caught) { error ??= caught }
    shutdown(); console.log(JSON.stringify([{ fullName: 'draws', status: error ? 'failed' : 'passed', failureMessages: error ? [String(error)] : [] }]))
  `)
  const child = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 10000, env: { ...process.env, TRIDENT_FIDELITY_JOB: jobPath } })
  expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' })
  expect(existsSync(renderLog)).toBe(false)
  const audit = readFileSync(job.audit, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  expect(audit[0].gaps).toEqual(['Mermaid Diagram renderer is not bound to the candidate.draw'])
  const control = { testResults: [{ name: file, assertionResults: [{ fullName: 'draws', status: 'passed' }] }] }
  const candidate = { testResults: [{ name: file, assertionResults: JSON.parse(child.stdout) }] }
  expect(fidelityOutcomes(control, candidate, audit).map((row: any) => row.status)).toEqual(['trident-blocked'])
})
