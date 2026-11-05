import { admitMermaidOracle, mermaidOracleDirectory } from '../portable/mermaid-oracle.ts'

/** Whether the pinned Mermaid oracle is installed. CI deliberately has none
 * (MERMAID_REFERENCE_DIR points nowhere, because Trident runs no benchmark in CI), so the
 * tests that need it are reported as skipped there and run wherever it is installed. */
export const pinnedOracle = (() => {
  try {
    admitMermaidOracle(mermaidOracleDirectory())
    return true
  } catch {
    return false
  }
})()
