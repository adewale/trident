# Mermaid DaveBench rerun — 30 October 2026

**Mermaid 12.2.0 returned SVG for 547 of 548 documentation examples in every one of six completed rounds: 99.8%.** The earlier 20-second browser-call timeout did not recur. The original incomplete campaign remains unchanged.

| Round | SVG returned | Failed | Unexecuted |
|---:|---:|---:|---:|
| 1 | 547 | 1 | 0 |
| 2 | 547 | 1 | 0 |
| 3 | 547 | 1 | 0 |
| 4 | 547 | 1 | 0 |
| 5 | 547 | 1 | 0 |
| 6 | 547 | 1 | 0 |

The failure in every round is `packages/mermaid/src/docs/syntax/flowchart.md:674`: `EncodingError: The source image cannot be decoded.` All 3,288 planned calls were recorded; 3,282 returned SVG and six failed.

## What stayed fixed

The exact original Mermaid artifact and its dependency identity, all 548 input occurrences (546 distinct sources), six rounds, 30 warmup attempts per round, the 20-second host deadline and `public-docs-svg-return-v1` protocol. The release cutoff remains 29 October 2026 at 18:42:38 UTC. [The rerun receipt](rerun.json) records the identity comparisons, source commit and timing limits. Acquisition was disabled; no newer Mermaid release was substituted.

Only Mermaid was scheduled in this rerun. It is coverage evidence, with no cross-run speed claim. Returning SVG does not establish correct diagram meaning, paint or layout.

## Evidence and reproduction

[Owning campaign](evidence/1/report.json) · [Per-round report](evidence/1/docs/report.md) · [Raw observations](evidence/1/docs/result.json) · [Frozen preparation](evidence/1/preparation.json)

[Download the complete raw archive](mermaid-davebench-2026-10-30.tar.gz?raw=true) and its [SHA-256](mermaid-davebench-2026-10-30.tar.gz.sha256). After extraction, `SHA256SUMS` verifies every retained file. Absolute workspace paths remain original provenance; Trident reads owning reports relative to the extracted root.

The [original 39-project campaign](https://github.com/adewale/trident/blob/8b2404b0bf2940e571ca0e14e54eeff0517a98ca/README.md) retains the five completed rounds and one blocked round. The [rolling ecosystem results](https://github.com/adewale/trident/blob/main/RESULTS.md) use each project's latest comparable coverage, retaining row dates and owning evidence.

Collection source: `338cf856d52370c1e01a93b3b19d308d4b057b25`. The recorded invocation is in [invocation.json](invocation.json); recreating a measurement needs the admitted artifacts and pinned source/runtime, not just this report archive.
