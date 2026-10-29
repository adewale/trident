import { assertMermaidOracle } from './mermaid-oracle.ts'

/** Collection and artifact acquisition require a local session. Collection also
 * needs the pinned oracle unless its caller declares a different reference boundary.
 * Offline checks and evidence readers do not call this execution guard. */
export function assertBenchmarkExecutionAllowed(environment: NodeJS.ProcessEnv = process.env, requirements: { mermaidOracle?: boolean } = {}): void {
  const enabled = (value: string | undefined) => value !== undefined && value !== '' && !/^(?:0|false|no)$/i.test(value)
  const indicators = ['CI', 'GITHUB_ACTIONS', 'GITLAB_CI', 'BUILDKITE', 'CIRCLECI', 'TF_BUILD', 'JENKINS_URL', 'TEAMCITY_VERSION']
  const active = indicators.filter(name => enabled(environment[name]))
  if (active.length) throw new Error(`Benchmarks are excluded from CI (${active.join(', ')}). Run them in an explicit local measurement session; records can be updated without rerunning unchanged projects.`)
  if (requirements.mermaidOracle ?? true) assertMermaidOracle(environment)
}
