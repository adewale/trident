import type { PortableCase } from './cohorts.ts'

export const PORTABLE_MEASUREMENT_PROTOCOL = 'portable-svg-processes-v7'
/** Median comparisons across independent rounds; no individual-call tail claim. */
export const FULL_SAMPLING = Object.freeze({ rounds: 6, samples: 31, coldSamples: 5 })
export const PORTABLE_ADAPTER_IDS = ['pele', 'agentic', 'beautiful', 'ondine', 'declared', 'public-package'] as const
export type Replica = 'A0' | 'A1' | 'B'
export type Track = 'first-use' | 'warm-repeat' | 'warm-new-source' | 'warm-label-edit'
export interface PortableBinding { export: string; result?: string; options?: unknown; fontSizePath?: string[]; factory?: string; dispose?: string }
export interface PortableArtifact {
  project: string
  root: string
  entry: string
  version: string
  adapter: typeof PORTABLE_ADAPTER_IDS[number]
  publicConfig?: Record<string, unknown>
  binding?: PortableBinding
}
export interface PortableJob {
  artifact: PortableArtifact
  testCase: PortableCase
  mode: 'probe' | 'warm' | 'cold' | 'memory' | 'baseline' | 'retention'
  samples: number
  round: number
  replica: Replica
  sample: number
  /** Legacy direct-worker file destination; controllers now use dedicated pipes. */
  resultFile?: string
  diagnosticFile?: string
  svgFile?: string
  fullEvidence?: boolean
  minSampleMs?: number
  /** Complete worker lifecycle budget, including all requested samples and qualification. */
  workerTimeoutMs?: number
}
export interface MemorySnapshot {
  rss: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
}
export interface PortableWorkerResult {
  protocol: typeof PORTABLE_MEASUREMENT_PROTOCOL | 'portable-svg-processes-v6' | 'portable-svg-processes-v4' | 'portable-svg-processes-v3' | 'portable-svg-processes-v2' | 'portable-svg-processes-v1'
  caseId: string
  family: string
  mode: PortableJob['mode']
  round: number
  replica: Replica
  sample: number
  /** A probe reports passed when the renderer accepts its family's canonical source, otherwise unsupported. */
  status: 'passed' | 'failed' | 'blocked' | 'partial' | 'unsupported'
  importMs: number
  tracks: Partial<Record<Track, number[]>>
  outputBytes: number
  qualification: { observer?: string; accepted: boolean; passed: boolean; semanticComplete: boolean; evidence?: { outputAdmission: string; nativeModel: string; paintedMeaning: string }; checks: { name: string; status: string; expected: unknown; actual: unknown; scope: string }[]; unmeasuredScopes: string[]; scope: string } | null
  prelude: { source: string; expectedAccepted: boolean; actualAccepted: boolean; passed: boolean }[]
  memory?: { before: MemorySnapshot; atReturn: MemorySnapshot; afterGc: MemorySnapshot; gcAvailable: boolean }
  retention?: { calls: number; snapshot: MemorySnapshot }[]
  iterations?: Partial<Record<Track, number[]>>
  apiWindow?: { startNs: string; endNs: string }
  resource?: { userSeconds: number; systemSeconds: number; peakRssBytes: number; scope: string }
  error?: string
  runtime: { executable: string; node: string; platform: string; arch: string }
}
