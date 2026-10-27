# Legacy benchmark work disposition

Reviewed 27 October 2026 against the extracted Trident implementation. The eleven
modified or untracked files in the original Agentic checkout contain benchmark
work, rather than an unmerged production renderer change. They should not be
reintroduced into Agentic Mermaid.

| Original file | Maintained boundary and disposition |
| --- | --- |
| `docs/mermaid-community.json` | `catalog/mermaid-community.json` already includes Bezel and its Pele relationship, with newer catalog metadata. Do not restore a product-owned catalog. |
| `eval/benchmark/peer-bench.ts` | Trident's `peer-bench.ts` owns cache policy, exact candidate/baseline archives, dependency receipts and consumed tracks. Community adapters own Dart and ASCII acquisition. The old additional Go in-process timing path is a different experimental boundary from the maintained CLI comparison; it is retained only for recovery, not credited as current evidence. |
| `eval/benchmark/release-bench.ts` | Trident's `release-bench.ts` already supports both verified archives and retained installed-dependency locks. The newer implementation also declares runtime-comparison policy. |
| `eval/benchmark/sketch-worker.go` | Trident retains its maintained Sketch worker. The old split relied on the accompanying experimental Go worker; replacing only this file would break the current owner. |
| `src/__tests__/release-benchmark.test.ts` | Owning admission regressions belong in Trident's `tests/release-benchmark.test.ts`, alongside the benchmark implementation. Existing archive admission tests cover both comparison identities and stale/failure behavior. |
| `eval/benchmark/README.md` | Trident's README, OVERVIEW, METHODOLOGY and inventory own setup, scopes and interpretation. Session-specific campaign commands are historical recipes, not installation requirements. |
| `eval/benchmark/community-geometry-audit.ts` | Historical saved-SVG diagnostic with approximate text-box observations. Current `fidelity/paint.ts` observes live owned ink, visibility, endpoints, quantitative geometry and styling. Text-box intersection alone is not a correctness or timing gate. |
| `eval/benchmark/community-scorecard.py` | Historical reducer for a different campaign schema. Current league, scorecard and chart readers retain exact cohorts and caveats; `portable/costs.ts` accepts explicit rates. Do not make obsolete session data a prerequisite of current reports. |
| `eval/benchmark/dart-wrapper.dart` | `unified/dart-wrapper.dart` and the reviewed community source recipe own Dart's compiled-JS boundary and toolchain provenance. |
| `eval/benchmark/go-peer-worker.go` | Experimental common in-process Go timer from the old peer protocol. No current comparison is relabeled as that API measurement. Restoring it would require a separately admitted native-library lane, rather than substituting it for CLI startup. |
| `eval/benchmark/mermaid-ascii-worker.go` | Same experimental Go API boundary; current community/source adapters measure the actual public CLI and keep it outside browser SVG ranks. |

No product code was discarded or silently migrated. All eleven original files
(263,044 bytes) were saved in a local Git stash, including untracked files, and
compared byte-for-byte with their saved objects before declaring the original
worktree clean. The local recovery receipt records its original source commit
and stash object. Neither that stash nor any session archive is a build or test
dependency of Trident. If historical investigation needs those files, restore
in an isolated checkout at their original source revision, rather than applying
the obsolete patch to current Agentic main.

The actionable extraction defects found during this review were fixed at the
controller: report-only Modern Mermaid summarization is excluded from benchmark
enrollment, and semantic peer qualification executes Trident's maintained
protocol while explicitly selecting the candidate checkout's runtime dependency
policy. Both supplied archives remain independently verified.
