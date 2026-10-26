/** What a corpus workload's owning fixture asserts beyond its source and labels. */
export interface WorkloadAssertions {
  expectStructured?: boolean
  renderError?: string
  nodeCount?: number
  edgeCount?: number
  groupCount?: number
  minNodes?: number
  minEdges?: number
  minGroups?: number
  labelsContain?: readonly string[]
}
export interface WorkloadEvidence {
  assertions?: WorkloadAssertions
  reference?: Record<string, unknown>
  expected?: Record<string, unknown>
  diagnosticOnly?: boolean
  parserOnly?: boolean
  emptyDiagramExpected?: boolean
  labelsContainScope?: 'layout'
  origins: string[]
}
