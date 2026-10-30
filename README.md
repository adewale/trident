# Mermaid ecosystem results — 30 October 2026

[All 39 projects and ranked benchmark tables](RESULTS.md) · [Raw evidence download](https://github.com/adewale/trident/releases/tag/ecosystem-evidence-2026-10-30) · [Frozen identities and measurement receipt](PUBLICATION.json)

The full campaign collected seven benchmark suites from **03:05 to 11:37 UTC**: six rounds, 39 frozen projects and 122 completed collection boundaries. The cutoff was **29 October 2026 at 18:42:38 UTC**. This is the original scope, before regular campaigns narrowed to 27 renderers. Later exclusions do not erase these measurements.

## Grok renderer and its ports

Ranked by passed terminal-output checks on the same 718 inputs. Each check requires terminal output and expected authored labels. Runtime and API boundaries differ, so this table makes no speed comparison.

| Rank | Project | Version | Passed | Failed | Unsupported |
|---:|---|---|---:|---:|---:|
| 1 | Lovely Mermaid | 0.3.3 | 242 | 55 | 421 |
| 2 | Grok renderer | git-2bdd1d6a6369 | 179 | 73 | 466 |
| 2 | MermaidText | git-a6b0c7657b94 | 179 | 73 | 466 |
| 4 | TUI Mermaid | 0.1.0 | 174 | 78 | 466 |

Lovely Mermaid also passed timeline, pie, mindmap and gitgraph family probes. Grok, MermaidText and TUI Mermaid passed flowchart, sequence, state, class and ER probes. These are bounded output checks, rather than complete layout or syntax guarantees.

## Every benchmark

| Benchmark | Ranked tables and attempt details |
|---|---|
| Mermaid Compatibility | [Read results](results/tables/community.md) |
| DaveBench: Documentation Examples | [Read results](results/tables/docs.md) |
| Diagram Meaning | [Read results](results/tables/fidelity.md) |
| Model and Editing Contracts | [Read results](results/tables/native-fidelity.md) |
| Mermaid Assertion Replay | [Read results](results/tables/upstream-fidelity.md) |
| Mermaid Reference Tests | [Read results](results/tables/upstream-original.md) |
| Render Cost and Scaling | [Read results](results/tables/portable.md) |

Each table retains its own interface, input population, version and qualification. All 843 reduced tables and 274 project/benchmark attempt entries are available in the [machine-readable snapshot](results/latest.json). There is no combined quality score.

## Incomplete work and limits

- Mermaid 12.2.0 timed out in one DaveBench round. Five rounds returned SVG for 547 of 548 examples; one example failed. Its six-round result is incomplete and unranked, with no fabricated 0% score.
- A missing public-model adapter is a Trident coverage gap, not a failed renderer capability. Blocked and unsupported cells remain visible.
- Portable timing is reported per case and mode only when output admission and A/A calibration pass. Collection completion does not establish release qualification.
- The 39-project scope and all original dates are retained. The regular repository overview applies today’s selection policy.

## Download and reproduce

Download `ecosystem-2026-10-30.tar.gz` from the linked evidence release. Archive SHA-256:

```text
4419415d846849903ff1a150bcc3a6c2fcc026301baf01324a1eed205f832199
```

The archive contains the frozen preparation, raw observations, input inventories, failure outputs, images, sampling identities and runtime facts. Its `SHA256SUMS` verifies the extracted original publication. The `SHA256SUMS` in this metadata branch refers to those archive contents; this branch contains a smaller browseable set of owning reports.

```sh
tar -xzf ecosystem-2026-10-30.tar.gz -C EXTRACTED
cd EXTRACTED
sha256sum --check SHA256SUMS
```

From a Trident checkout containing the publication fixes, reimport the extracted campaign with `results:snapshot --campaign EXTRACTED/evidence/1 --evidence-url HTTPS_EVIDENCE_DIRECTORY`. No measurements run during this reduction. Absolute workspace paths inside the raw records are preserved provenance; the reader resolves owning reports relative to the extracted campaign root.

Collection source: [`f764f2ab653f1fb6998b0fd8ca014b16d034a921`](https://github.com/adewale/trident/tree/f764f2ab653f1fb6998b0fd8ca014b16d034a921). All 83 frozen producer-file entries were checked against that commit. The renderer versions in these results are frozen artifacts, including Agentic Mermaid 0.5.1; the separate README artwork upgrade to 0.5.4 does not change these measurements.
