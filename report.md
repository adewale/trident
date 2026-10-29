# Agentic Mermaid versus Zombie Mermaid — 29 October 2026

Current main source candidates, built and packed through their normal project build commands. Trident source: `bd1c685f32353661243ec55366d69442df19c62b`. Measurements ran serially on the same cloud machine, with Node 24.19.0 and Chromium 154.0.8037.57.

| Project | Package version | Source commit |
|---|---|---|
| Agentic Mermaid | 0.5.1 source candidate | `c4a8eeb8a3c472fd73e6654c0efa151b8f19a7f5` |
| Zombie Mermaid | 5.11.3 source candidate | `51ed1cdf4ee47351090adfa00bdee2baff2c52ee` |

## DaveBench: Documentation Examples

All 548 occurrences, 546 distinct inputs, 34 syntax pages from Mermaid 12.2.0 source `1fb7869866dd619168d840291c9c54b4f129758b`. Two five-round blocks use opposite project order; 30 warmup attempts per project per round. Coverage counts were identical in all ten rounds. Returning SVG does not certify its meaning.

| Rank | Project | SVG returned / planned | Return rate | No SVG |
|---|---|---:|---:|---:|
| 1 | Agentic Mermaid | 441/548 | 80.5% | 107 |
| 2 | Zombie Mermaid | 245/548 | 44.7% | 303 |

AM’s 107 no-SVG occurrences comprise 106 explicit unsupported-family results and one Gantt configuration error. ZM’s 303 no-SVG results are parser errors, including 84 documentation occurrences starting with YAML frontmatter. These are outcomes under the tested public API, not 107 or 303 independently established product bugs.

## Mermaid Compatibility

These tables cover the same 718 positive feature inputs. They exclude six separately timed SVG core inputs and 363 parser-only/reference-rejected inputs. Both Node and browser SVG results agree. Each feature input is counted once; repeated timing calls do not increase coverage.

### SVG output

| Rank | Project | Passed / planned | Passed rate | Failed | Unsupported |
|---|---|---:|---:|---:|---:|
| 1 | Agentic Mermaid | 595/718 | 82.9% | 17 | 106 |
| 2 | Zombie Mermaid | 253/718 | 35.2% | 51 | 414 |

### Terminal output

| Rank | Project | Passed / planned | Passed rate | Failed | Unsupported |
|---|---|---:|---:|---:|---:|
| 1 | Agentic Mermaid | 563/718 | 78.4% | 49 | 106 |
| 2 | Zombie Mermaid | 237/718 | 33.0% | 67 | 414 |

## Diagram Meaning

100 independently authored cases and 1,035 planned SVG paint/meaning criteria for each project. Rank uses passed criteria on that fixed population. Unavailable checks remain in the denominator. The observer checks bounded labels, relationships, values and geometry; this is not an aesthetic or whole-renderer correctness score.

| Rank | Project | Passed / planned | Passed rate | Failed | Unavailable |
|---|---|---:|---:|---:|---:|
| 1 | Agentic Mermaid | 937/1035 | 90.5% | 1 | 97 |
| 2 | Zombie Mermaid | 400/1035 | 38.6% | 13 | 622 |

Both projects failed the controlled-image criterion. ZM also has observed pie clipping, C4/sequence relationship and font-size-control failures. These are criterion-level findings, not a count of distinct root causes. Public-browser API checks were AM 264/269 and ZM 91/269; those have a different boundary and are not added to paint scores. Native-model criteria were unobserved in this SVG-only run for both projects.

## Shared-input SVG render-call cost

Exactly the same 245 docs occurrences returned SVG for both projects in every round. Each input has ten calls across the two project-order blocks. First compute each input’s median call time, then summarize those 245 medians. Rank uses their sum, lowest first. Timers include public API return/await, excluding initialization, qualification, cleanup, transport and paint.

| Rank | Project | Median input call (ms) | p95 of input medians (ms) | Sum of 245 input medians (ms) |
|---|---|---:|---:|---:|
| 1 | Zombie Mermaid | 1.30 | 6.85 | 538.55 |
| 2 | Agentic Mermaid | 3.80 | 24.45 | 1675.75 |

The p95 above describes per-input medians, not individual-call tail latency. One Zombie input median was below timer resolution; it remains recorded as zero, not interpreted as free work. No geometric-mean ratio is invented.

**Descriptive, not A/A-qualified performance:** the common-success subset excludes inputs either renderer could not handle, and a successful SVG return does not establish equivalent paint. No overall speed winner or release qualification follows.

| Project | AM-first block: sum (ms) | ZM-first block: sum (ms) |
|---|---:|---:|
| Zombie Mermaid | 544.10 | 541.90 |
| Agentic Mermaid | 1666.60 | 1686.40 |

The ordering is the same in both blocks. The extra block compensates for a Trident scheduling issue: its rotate-plus-reverse policy leaves the same project first when exactly two projects are selected. Original blocks are retained separately.

## Reproduction and evidence

- `prepare.ts`: public candidate packing, verified installation and frozen browser preparation. Zombie’s five workspace dependency archives are built from the same source and installed together with its umbrella package. Its browser adapter performs the documented ELK registration.
- `run.ts`: serial docs, meaning and compatibility collection.
- `rerun-community.ts`: corrected explicit candidate project selector; the initial Node setup failures remain retained and are not included in the results above.
- `reverse-docs.ts`: second five-round docs block in the opposite project order.
- `summarize.py` and `verify-reduction.mjs`: Python reduction plus independent JavaScript reconciliation of docs coverage and costs.
- `summary.json`, `artifacts.json`, `campaign.json` and `independent-reduction.json`: complete identities, dispositions, timing reductions and checks.
- Raw owning outputs: `docs/`, `docs-reverse/`, `fidelity/`, `community-am-corrected/`, `community-zm-corrected/`.

Example reproduction after both source builds and their pinned dependencies are available:

```sh
source /workspace/.cloud-tools/activate.sh
bun prepare.ts
bun run.ts
bun rerun-community.ts
bun reverse-docs.ts
python3 summarize.py
node verify-reduction.mjs
python3 report.py
```

Use a fresh evidence directory when repeating collection. The local source paths and frozen commits are recorded in the scripts and receipts. Measurements and reports remain outside tracked repository source. This run did not execute the full portable scaling suite or an A/A-calibrated release campaign.
