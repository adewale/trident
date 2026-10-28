import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { admitMermaidOracle, mermaidOracleDirectory } from '../portable/mermaid-oracle.ts'
import { portableCases } from '../portable/cohorts.ts'
import { projectSupport, type CatalogMember, type PublicSuite } from './support.ts'

export interface CampaignPlanOptions { projects: CatalogMember[]; suites: readonly PublicSuite[]; rounds: number; profile: 'smoke' | 'full'; executable?: string; upstreamRunnerRoot?: string; budgetMinutes?: number }
export function campaignPlan(options: CampaignPlanOptions) {
  const binary = (name: string) => { try { return execFileSync('which', [name], { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return null } }
  const browser = options.executable ?? chromium.executablePath()
  let oracle: string | null = null, oracleError: string | undefined
  try { oracle = admitMermaidOracle(mermaidOracleDirectory()).directory } catch (error) { oracleError = String(error) }
  const tools = { bun: binary('bun'), node: binary('node'), npm: binary('npm'), git: binary('git'), go: binary('go'), cargo: binary('cargo'), dart: binary('dart'), chromium: existsSync(browser) ? browser : null, gnuTime: existsSync('/usr/bin/time') ? '/usr/bin/time' : null, oracle, originalRunner: options.upstreamRunnerRoot && existsSync(options.upstreamRunnerRoot) ? options.upstreamRunnerRoot : null }
  const versions = Object.fromEntries(Object.entries(tools).filter(([key, path]) => path && !['oracle', 'originalRunner'].includes(key)).map(([key, path]) => { try { return [key, execFileSync(path!, ['--version'], { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n')[0]] } catch { return [key, null] } }))
  const rows = options.projects.flatMap(node => {
    const support = projectSupport(node)
    return options.suites.map(suite => {
      const capability = support.suites[suite]
      const required = ['bun', 'node', 'git', ...(node.benchmark?.package ? ['npm'] : []), ...(['docs', 'fidelity'].includes(suite) ? ['chromium'] : []), 'oracle', ...(suite === 'upstream-original' ? ['originalRunner'] : [])]
      const runtime = (node.runtime ?? '').toLowerCase()
      if (runtime.includes('dart')) required.push('dart')
      if (runtime.includes('rust')) required.push('cargo')
      if (runtime.includes('go ') || runtime.startsWith('go')) required.push('go')
      if (['dart', 'franken', 'source-cli', 'extra-source', 'mermaid-rs-wasm'].includes(node.benchmark?.adapter ?? '')) required.push('declared project toolchain/build recipe')
      const missing = required.filter(key => key in tools && !tools[key as keyof typeof tools])
      const portable = suite === 'portable' && capability.state === 'configured'
      const cases = portable ? portableCases() : []
      const freshWorkers = portable ? cases.length * options.rounds * 3 * (options.profile === 'full' ? 20 : 1) : 0
      // Planning range, not a measured duration. No project-specific speed assumption.
      const range = capability.state === 'adapter-missing' || capability.state === 'project-unsupported' || capability.state === 'reference-only' ? [0, 0] : portable ? [Math.ceil(freshWorkers / 600), Math.ceil(freshWorkers / 6)] : suite === 'upstream-original' ? [5, 45] : [1, 30]
      return { project: node.id, suite, capability, prerequisites: required, missing, acquisition: 'not attempted', freshWorkers,
        estimatedMinutes: { low: range[0]!, high: range[1]!, basis: portable ? '0.1–10 seconds per fresh worker, plus warm/resource/qualification work; actual time depends on artifact and machine.' : 'Planning allowance per suite boundary; not a project performance prediction.' } }
    })
  })
  const estimatedMinutes = { low: rows.reduce((sum, row) => sum + row.estimatedMinutes.low, 0), high: rows.reduce((sum, row) => sum + row.estimatedMinutes.high, 0) }
  return { protocol: 'trident-campaign-plan-v1', selection: options.projects.map(node => node.id), suites: options.suites, rounds: options.rounds, profile: options.profile, tools, versions, oracleError, rows, estimatedMinutes, budgetMinutes: options.budgetMinutes ?? null,
    budgetExceededByEstimate: options.budgetMinutes !== undefined && estimatedMinutes.high > options.budgetMinutes,
    policy: 'Planning performs no acquisition or rendering. Estimates are deliberately broad and do not establish feasibility or a maximum. A runtime budget stops at suite boundaries; an active worker retains its declared deadline. Missing external observers are unavailable counters, not free work.' }
}
export function readCampaignPlan(file: string) { return JSON.parse(readFileSync(file, 'utf8')) }
