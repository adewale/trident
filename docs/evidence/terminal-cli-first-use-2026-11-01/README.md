# Qualified cold public CLI timing, 1 November 2026

The [ordinary timing summary](summary.json) ranks median round totals for six fixed sources, after every measured UTF-8 return passed the complete source-owned drawing checks. Both artifacts use a fresh public CLI process per call, including startup/import/render and fully drained stdout through the common host request/return boundary. Worker initialization, retention and offline grading are outside the clock. OS/filesystem caches are uncontrolled; this is process-first-use timing, not cold-storage timing.

| Rank: median six-source round | Frozen public CLI | Correct inputs | Measured calls | Median round total |
|---|---|---:|---:|---:|
| 1 | Mermaid ASCII 1.6.1 | 6/6 | 72 | 104.129 ms |
| 2 | Termaid 0.10.0, Python 3.12.14 | 6/6 | 36 | 754.053 ms |

The existing balanced A0/A1/B collector ran six rounds, 108 serialized calls, with 108 distinct CLI PIDs. Control totals use each round's geometric mean of matched A0/A1 totals. The median paired Termaid/control ratio is 7.2244 (96.875% exact round-median interval 5.6967–7.5173); the observed A/A band is 0.8499–1.1767. All 108 calls qualify with zero gaps. These results cover four flowcharts, one ER diagram and one sequence diagram, not all terminal families or projects. All 12 untimed console prerequisites passed; no selected source was substituted. Source literals, upstream origins, independently reviewed fact hashes, executable/runtime/dependency identities and round statistics are in the summary and archive.

Raw calls ran from 01:46:12.094 to 01:46:22.773 UTC on 1 November. The controller was paused only after all raw returns to reserve the host for another timing surface. That pause exhausted the grading budget: the original bundle remains unqualified with one live check. Existing offline derived grading then inspected all 108 unchanged returns, preserving the original clocks, invocation IDs, partial grade and capture-producer identities; it made zero new renderer calls. [Pause](controller-pause.json) and [resume](controller-resume.json) receipts document this history. The current [qualified bundle](qualified-result.json.gz) and ordinary qualifier receipt are retained alongside both historical bundles in the archive. Later code changes do not rewrite the capture producer.

[raw-capture.tar.gz](raw-capture.tar.gz) contains all raw output bytes, journals, collection checkpoints, sources, CLI receipts, frozen prepared identities and prerequisite calls. The [manifest](archive-manifest.json) pins every restored file; package executables are identified rather than redistributed. To independently reduce the restored clocks and checks without invoking a renderer:

```sh
mkdir /tmp/trident-terminal-clock-proof
tar -xzf docs/evidence/terminal-cli-first-use-2026-11-01/raw-capture.tar.gz -C /tmp/trident-terminal-clock-proof
bun commands.ts timing:qualify --bundle /tmp/trident-terminal-clock-proof/trident-terminal-cli-first-use-2026-11-01/timing-regraded-30f8f57a52c660f2d8b698e6.json --out /tmp/trident-terminal-clock-proof/rechecked.json
```

The [full retained drawing qualification](../terminal-present-gaps-2026-11-01/README.md) uses 116 drawings per artifact. Its correctness population and unresolved facts are separate from this timing subset.
