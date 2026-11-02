/** Public benchmark questions and score direction. No combined renderer score. */
export const benchmarkDefinitions = {
  terminal: {
    name: 'Terminal Drawing Facts',
    task: 'Render the fixed 116 terminal drawing examples and satisfy every required fact in each whole case.',
    score: 'Verified whole-case passes, highest first.',
    why: 'More of the fixed examples satisfy their specified drawing checks.',
    ties: 'Equal pass counts share a rank. No comparable time tie-break was recorded.',
  },
  behaviour: {
    name: 'Mermaid Behaviour Tests',
    task: 'Pass all assertions in each of 49 selected public family-detection and SVG naming cases.',
    score: 'Passed whole cases, highest first.',
    why: 'More of the selected observable Mermaid behaviours work through the public interface.',
    ties: 'Equal pass counts share a rank. Individual assertions are not extra votes.',
  },
  api: {
    name: 'Mermaid API Compatibility',
    task: 'Pass the 154 selected unchanged Mermaid public API test callbacks.',
    score: 'Passed callbacks, highest first.',
    why: 'More of these specific Mermaid API contracts can be used unchanged.',
    ties: 'Equal pass counts share a rank. No comparable time tie-break was recorded.',
  },
  rejection: {
    name: 'Terminal Invalid-input Rejection',
    task: 'Explicitly reject the four independently invalid terminal-source controls.',
    score: 'Verified correct rejections, highest first.',
    why: 'More known-invalid sources receive the required rejection. Generic crashes and untyped failures earn no credit.',
    ties: 'Equal correct-rejection counts share a rank.',
  },
  timing: {
    name: 'Matched-workload Rendering Time',
    task: 'Complete the same fixed rendering workload in a paired run with qualified sampled outputs and reference measurements.',
    score: 'Paired time ratio, lowest first, within each matched run.',
    why: 'The same qualified work takes less time relative to that run’s repeated reference.',
    ties: 'Equal ratios share a rank. Different pairs and workloads do not share a speed rank.',
  },
} as const
export type BenchmarkDefinition = keyof typeof benchmarkDefinitions

/** A sparse collected cohort is not proof of narrow project applicability. */
export const benchmarkBreadthPolicy = 'Retire a standalone benchmark if a reviewed eligibility census establishes that at most two projects can meaningfully participate and no Trident collection, binding or assessment gap explains the limit. Missing evidence does not establish ineligibility. Known failures count as measured results.'
export const benchmarkReadiness: Partial<Record<BenchmarkDefinition, { status: string; reviewedOn: string; gap: string; repair: string }>> = {
  api: {
    status: 'Trident coverage-repair diagnostic', reviewedOn: '2026-11-02',
    gap: 'Only two projects were collected. Public-test campaign bindings are not enrolled; Trident reports adapter-missing rather than measured project incapability.',
    repair: 'Enroll reviewed public-operation bindings for additional projects, recording real incompatible or unsupported APIs as nonpasses. Establish eligibility before deciding whether to retire the standalone comparison.',
  },
  rejection: {
    status: 'Trident coverage-repair diagnostic', reviewedOn: '2026-11-02',
    gap: 'The corpus includes 18 projects, but 15 have no resolved rejection outcomes. Missing typed-outcome capture/classification leaves them unknown; it does not establish that they cannot participate.',
    repair: 'Complete public acceptance/rejection capture for each existing terminal transport. Preserve the distinction between source rejection and crashes, transport errors or unsupported families.',
  },
  timing: {
    status: 'Trident coverage-repair diagnostic', reviewedOn: '2026-11-02',
    gap: 'Two latest paired SVG comparisons qualify, covering three distinct projects. Reference noise and capture/runtime failures withhold other pairs; broader qualification has not been established.',
    repair: 'Repair and stabilize collection on the same predeclared workload, then extend adapter/assessment coverage. DaveBench already supplies broad completion-and-time rankings; retain these stricter comparisons as diagnostics during repair.',
  },
}
