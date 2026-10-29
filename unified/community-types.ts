import type { ReleaseCli } from './release-cli.ts'
import type { PortableBinding } from '../portable/protocol.ts'
import type { UnifiedWorkload } from './types.ts'
export interface CommunityBenchmarkConfig {
  adapter: string
  package?: string
  subpath?: string
  terminalSubpath?: string
  outputs?: string[]
  /** Outputs available in the non-DOM module host; other outputs use their declared transport. */
  moduleOutputs?: string[]
  version?: string
  /** Do not acquire or benchmark this known-broken pinned release. */
  skip?: { version: string; reason: string }
  versionPolicy?: string
  sourceAdapter?: string
  sourcePin?: string
  entry?: string
  runtime?: string
  /** The declared adapter's binding per output: no harness code for that tool. */
  api?: Record<string, DeclaredBinding>
  /** Installed npm bin binding; the same contract applies to every project. */
  /** Reviewed public Node SVG binding, independent of community transport. */
  portable?: { adapter: 'declared'; binding: PortableBinding } | { adapter: 'public-package' }
  cliRelease?: ReleaseCli
  cli?: { bin: string; args: string[]; outputs: string[] }
  [key: string]: unknown
}
/** One public export that renders a Mermaid source string. */
export interface DeclaredBinding {
  /** Dotted path to the function, for example `render` or `default.renderSvg`. */
  export: string
  /** Reviewed option path for portable semantic font-size configuration. */
  fontSizePath?: string[]
  /** A JSON second argument, passed unchanged on every call. */
  options?: unknown
  /** The field of the returned object that holds the output, when the return is not the output. */
  result?: string
}
export interface CommunityNode {
  id: string
  repo?: string
  head?: string
  roles: string[]
  outputs: string[]
  packages?: { registry: string; name: string; version: string }[]
  release?: { tag: string; commit: string }
  distribution?: { version: string; revision: string; path?: string; wasmSha256?: string }
  benchmark?: CommunityBenchmarkConfig
}
export interface CommunityArtifact {
  kind: 'node' | 'global' | 'franken' | 'jsonl-worker' | 'cli' | 'python'
  root?: string
  module?: string
  executable?: string
  args?: string[]
  input?: 'stdin' | 'file'
  format?: string
  outputBindings?: Record<string, { args: string[]; input?: 'stdin' | 'file' }>
  global?: string
  version: string
  revision?: string
  sha256?: string
  integrity?: string
  runtime?: string
  python?: string
  wasm?: string
  files?: { path: string; sha256: string }[]
  detail?: string
  apiBoundary?: string
  additionalCli?: { id: string; outputs: string[]; artifact?: CommunityArtifact; error?: string }[]
  adapterCompanions?: { root: string; name: string; version: string; integrity: string; closureSha256: string }[]
  dependencyOverrides?: Record<string, unknown>
  reviewed?: boolean
  buildRecipeId?: string
  runtimeCommandId?: string
  runtimeVersion?: string
  sourceRevision?: string
  runtimeDependencyRoots?: string[]
  buildDependencyPrefix?: string
  sourceFiles?: { root: string; revision: string; gitPath: string; blob: string }[]
  dependencyPatches?: { root: string; revision: string; gitPath: string; blob: string }[]
  sourceProgramClass?: string
  artifactClass?: string
  nativeBinding?: unknown
  dependencies?: unknown
  apiAdmission?: string
  acquisitionOrigin?: string
  supportedFamilies?: readonly string[]
  sourceFallback?: 'framed-source'
  /** An unreleased build, not the catalog's release: a tarball (its SHA-256 and Trident's verified
   * copy), or a source commit built with the release's recipe (its revision and where it was fetched). */
  candidate?: import('./candidate-packages.ts').NpmCandidate | { revision: string; remote: string }
}
export interface PreparedCommunity {
  node: CommunityNode
  artifact?: CommunityArtifact
  error?: string
}
export interface CommunityWorkerJob {
  prepared: PreparedCommunity
  workloads: UnifiedWorkload[]
  output: string
  out: string
  samples: number
  warmupMs: number
  minSampleMs: number
  harnessRoot: string
  packageRoot?: string
  coverageOnce?: boolean
}
