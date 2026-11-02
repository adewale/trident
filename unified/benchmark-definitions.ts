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
