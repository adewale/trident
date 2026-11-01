# Qualified timing: six pinned documentation examples

All 108 returns passed every required source, SVG and owned-paint check. The ordinary offline qualifier reports **qualified**, with zero gaps and successful artifact/SDK/font/resource/cleanup finalization. Mermaid 12.2.0 and Pele 1.9.0 use six unchanged examples from Mermaid source pin `1fb7869866dd619168d840291c9c54b4f129758b`.

| Rank | Renderer | Correct returns | Median six-example corpus ms | Paired ratio to Mermaid | 96.875% median-ratio interval |
|---:|---|---:|---:|---:|---|
| 1 | obsidianmd/pele 1.9.0 | 36/36 | 130.942 | 0.113 | 0.092–0.161 |
| 2 | mermaid-js/mermaid 12.2.0 | 72/72 | 1087.116 | 1.000 | reference |

Ranks order the measured median corpus duration, best first. Each corpus duration sums six separate fresh-context public calls. Mermaid's twelve A0/A1 replica-rounds and Pele's six B replica-rounds retain all 108 individual calls. The paired ratio uses each round's geometric mean of the two Mermaid controls; its median need not equal the ratio of the displayed medians. The A/A envelope is 0.820–1.219, within the predeclared 25% ceiling. The confidence interval is the exact six-round sign/order-statistic interval, separate from that descriptive control envelope.

| Family | Unchanged documentation occurrence | Mermaid median call ms (12 returns) | Pele median call ms (6 returns) |
|---|---|---:|---:|
| flowchart | packages/mermaid/src/docs/syntax/flowchart.md:45 | 440.453 | 26.390 |
| sequence | packages/mermaid/src/docs/syntax/sequenceDiagram.md:89 | 80.535 | 18.246 |
| journey | packages/mermaid/src/docs/syntax/userJourney.md:7 | 64.619 | 17.765 |
| pie | packages/mermaid/src/docs/syntax/pie.md:8 | 160.620 | 22.860 |
| packet | packages/mermaid/src/docs/syntax/packet.md:34 | 135.699 | 22.697 |
| treemap | packages/mermaid/src/docs/syntax/treemap.md:63 | 187.042 | 21.374 |

The selection spans topology/text, participant aliases and messages, scored multi-actor journeys, numerical pie proportions, TCP field offsets/widths and nested weighted hierarchy. Every case passed a fresh full-contract inspection of already retained outputs in both engines before timing. State example403 was screened but excluded because Pele route visibility remains unknown; its evidence is retained in `preflight.json.gz`. No timed failure was dropped, retried or replaced.

The actual raw-call window was 2026-11-01T00:47:41.889Z through 2026-11-01T00:49:20.731Z, with 108 distinct execution contexts in one controller clock domain. Six balanced A0/A1/B rounds used the existing first-use driver. Boundary: Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded.

This is a deliberately diverse, correctness-conditioned exposed six-example corpus. It supports this matched comparison on this host and these frozen versions. It does not establish random-workload representativeness, whole-language coverage, steady-state speed, percentiles, memory use or aesthetics. The interval assumes independent representative rounds and does not remove systematic host/artifact/workload effects.

## Evidence and reproduction

- [result.json](result.json): shared-ranker rows, every case/count, exact ratio uncertainty and identities.
- [selection.json](selection.json): predeclared sources, pin/hashes, prerequisites and excluded state403.
- [preflight.json.gz](preflight.json.gz): complete retained-output prerequisite checks, including the unresolved state case.
- [capture.tar.gz](capture.tar.gz): portable ordinary-qualifier proof, all 108 raw outputs, 216 causal start/return frames, lifecycle and per-return checks, frozen input metadata and the 85-file observer source closure. It preserves the provisional bundle as history and the final bundle separately. Engine/font bodies remain in the original full collection; the portable proof rechecks retained outputs and clocks without executing a renderer.
- [archive-manifest.json](archive-manifest.json): archive hash and full original-capture file hashes.

Extract `capture.tar.gz` into a fresh directory, then run from this repository:

```sh
bun commands.ts timing:qualify --bundle /ABS/EXTRACT/collection/timing-bundle-0bfebb48c5c0d78f59356f73.json --out /ABS/EXTRACT/qualification.json
bun docs/evidence/qualified-docs-timing-2026-11-01/reproduce.ts /ABS/EXTRACT/collection /ABS/EXTRACT/selection.json /ABS/EXTRACT
```

Both commands are offline and make no renderer or model calls. The raw frames remain unchanged when copied; the ordinary qualifier resolves their content-addressed outputs within the extracted journal. Runtime producer commit: `2c580e6ce65a5986bf64ccc0396b5b2195466f5d`.
