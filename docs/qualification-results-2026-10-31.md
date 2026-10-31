# Qualification results — 2026-10-31

These minimum qualification cohorts regrade retained outputs on frozen artifacts; they do not establish a new 27-project campaign or baseline. Ordinary reducers and the shared ranker order each named metric best first, with shared ties and no grand aggregate. Verified correct counts are lower bounds while unknowns leave complete drawing accuracy unresolved. The [qualification index](../qualification/README.md) retains detailed provenance and publication links; [runtime tests and archive checks](../RELEASE.md) are pinned separately.

[Raw evidence, checksums and reproduction](https://github.com/adewale/trident/blob/586bc66045cf4f1400b2d2d4aef40b525387b27f/qualification-evidence/completion-2026-10-31/README.md)
include the current outputs, source contracts, direct PNG reviews and archive restoration checks.

## DaveBench documentation drawings — PNG

[DaveBench](../BENCHMARKS.md#documentation-examples--davebench) uses these [548 literal documentation occurrences](../corpus/docs-source-inventory.json.gz) from Mermaid commit `1fb7869866dd619168d840291c9c54b4f129758b`: 546 drawings, one invalid-source control and one configuration-only input. The [source census](docs-source-expectations.md) has 547 complete contracts, including both non-drawing inputs; the sole held duplicate-Boston interpretation remains a planned drawing. [Independent contracts](../corpus/docs-reviewed.json), SHA-256 `2aa8a9ad10d72a5738a52b917c3e14611c99c5b5c514b7767f6b76561612cf6c`, retain required facts and reviewed visual projections. Nonvisual identities and unrequested default skins remain advisory; renderer agreement supplies no expected answer. Mermaid rendering bindings include the declared first-party ZenUML 1.0.1 addon.

| Verified correct rank | Project | Version / public interface | Correct / 546 | Incorrect | Unknown | Returned / 548 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | mermaid-js/mermaid | 12.2.0 / browser PNG exporter | 485 | 41 | 20 | 548 |
| 2 | pub:mermaid_flutter | 0.3.2 / native Flutter renderToPng | 289 | 136 | 121 | 449 |

The 42 returned-image holds are 20 Mermaid and 22 native coordinates, including two source-review-pending outcomes. Native also has 99 no-image outcomes. Both invalid-source controls were incorrectly accepted; configuration-only inputs are unscored. Every content decision binds source, contract and directly inspected PNG bytes. [Reducer summary](evidence/png-full-corpus-2026-10-31/current-content-summary.json), [all 1,096 outcomes](evidence/png-full-corpus-2026-10-31/current-content-grades.json.gz), and [ownership, review and exporter-repair evidence](evidence/png-full-corpus-2026-10-31/README.md) preserve the full provenance. PNG meaning and strict raster preservation remain separate claims.

## DaveBench documentation drawings — public SVG

This lane inspects Mermaid 12.2.0's original public SVGs retained inside the owned PNG-export calls over the same documentation corpus. Ownership comes from those exact enclosing return certificates; no independent SVG-format invocation or timing is invented. Normalized rasterized SVGs are a separate export diagnostic, not another renderer score.

| Verified correct rank | Project | Version / public interface | Correct SVG / 546 | Failed SVG contracts | Unknown |
| --- | --- | --- | --- | --- | --- |
| 1 | mermaid-js/mermaid | 12.2.0 / original SVG companion | 149 | 43 | 354 |

All 546 drawing SVGs were inspected; the two non-drawing inputs remain separate. Failed SVG contracts are not a count of misdrawn PNGs: the 22 cases with correct PNGs but failed original SVGs comprise 12 malformed XML outputs and ten duplicate-ID outputs. The final census has zero unexplained painted-content contradictions. [Current summary and census](evidence/png-full-corpus-2026-10-31/current-svg-content-summary.json) and [all original/raster dispositions](evidence/png-full-corpus-2026-10-31/current-svg-content-grades.json.gz) preserve the checks. A separate raster retry remains unknown and changes no primary grade.

## Mermaid feature cases — SVG

The 100 cases span 25 families and combine inherited AM portable examples, Trident-authored feature/edit cases and pinned public examples. [Case contracts](../fidelity/cases.ts) and [portable cohorts](../portable/cohorts.ts) retain per-case provenance and independently reviewed expected answers. All three bindings use the same literal sources and edit stimuli; the final manifest verifies their unchanged identities. Every mandatory label, shape, topology, ownership and configured paint/metric criterion must pass. [SVG qualification rules](svg-correctness.md) give the method; this exposed corpus is not a validated holdout.

| Verified correct rank | Project | Version / public interface | Correct / 100 | Incorrect | Unknown |
| --- | --- | --- | --- | --- | --- |
| 1 | mermaid-js/mermaid | 12.2.0 / browser SVG API | 66 | 4 | 30 |
| 2 | obsidianmd/pele | 1.9.0 / browser SVG API | 57 | 0 | 43 |
| 3 | adewale/agentic-mermaid | 0.4.1 / browser SVG API | 30 | 5 | 65 |

The completed `authored-final-r3` replay preserves 256 returned SVGs and 300 dispositions. Observation SHA-256: `9b604b3925153951c4060dda94f6e263a05ec458a6729cbb47195cf37d21d09b`; original inventory: `49ab2ff087ec286c78ee6577d42e66284df40bdbd9ec2d7cedfd8db6abfb1837`. Producer, browser and resource identities remained stable. These counts establish the explicit cases, not complete family support or aesthetics.

## Terminal project examples

[Active v3](evidence/terminal-active-profile-2026-10-31/README.md) selects 115 unchanged drawings, one [independently reviewed authored alias adaptation](../corpus/terminal-source-adaptations.json), and four invalid controls. The [original 120 sources](../corpus/terminal-project-examples.json) preserve repository pins, issue/example origins, literal/patch hashes, licenses and expected-fact receipts from 18 repositories (17 contribute inputs). The ambiguous original remains diagnostic, yielding 121 research entries. Only three projects were called on the new adaptation; 15 retain an unknown there. [Committed reducer results](evidence/terminal-state-adaptation-2026-10-31/result.json) preserve versions and both populations.

| Verified correct rank | Project | Version | Retained interface | Correct / 116 | Incorrect | Unknown |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | fasouto/termaid | 0.10.0 | Python API | 57 | 19 | 40 |
| 2 | adewale/agentic-mermaid | 0.4.1 | Node API | 53 | 20 | 43 |
| 3 | dfadler/zombie-mermaid | 5.10.2 | Node API | 52 | 11 | 53 |
| 4 | AlexanderGrooff/mermaid-ascii | 1.6.1 | native CLI | 41 | 18 | 57 |
| 5 | Yassimba/loom | 0.10.0 | Bun component | 36 | 23 | 57 |
| 6 | spacedock-dev/mermaidtext | git-a6b0c7657b94 | native CLI | 34 | 21 | 61 |
| 7 | lukilabs/beautiful-mermaid | 1.1.3 | Node API | 30 | 22 | 64 |
| 8 | kais-radwan/ascii-mermaid | 0.1.0 | Node API | 27 | 32 | 57 |
| 9 | anomalyco/opencode | 2.0.26 | Bun/OpenTUI host | 18 | 32 | 66 |
| 10 | emtyty/merslim | 0.2.3 | Node API | 16 | 40 | 60 |
| 11 | kitlangton/merman | 0.2.1 | Bun API | 14 | 31 | 71 |
| 11 | Mootikins/figurehead-rs | v0.4.3 | native CLI | 14 | 21 | 81 |
| 13 | tariqshams/mermaidtui | 0.0.6 | Node API | 7 | 6 | 103 |
| 14 | Dicklesworthstone/frankenmermaid | 0.4.0 | native CLI | 0 | 1 | 115 |
| 14 | xai-org/grok-build | git-2bdd1d6a6369 | native Markdown CLI | 0 | 21 | 95 |
| — | crafter-station/mermaid | 0.0.3 | Node binding blocked | 0 | 0 | 116 |
| — | Latias94/merman | 0.9.2 | no terminal binding | 0 | 0 | 116 |
| — | wevm/ondine | 0.0.3 | no terminal binding | 0 | 0 | 116 |

All 72 invalid-control outcomes remain unknown, separately from drawing scores. Completely unobserved rows are unranked; observed zero-correct rows share rank. All 116 source profiles have bounded observers, but unavailable output or unresolved facts supply no pass. [Per-fact evidence](evidence/terminal-state-adaptation-2026-10-31/README.md) retains adaptation calls, rejection controls and the diagnostic. No terminal speed claim follows.

## Original public API callbacks

The [source-reviewed selection](../qualification/source-audits/public-expanded-scope.json) preserves 154 unchanged callbacks from 37 declarations at the same Mermaid pin: 102 parse, 32 detection, 19 structural accessibility and one SVG-return callback over 24 inner examples. Original assertions supply expected answers. The owned `expanded-154-bundle-v2` revalidates both disjoint parents and original/public-reference controls; historical 41-callback results stay separate. [Scope and reduction](mermaid-public-conformance.md) retain the 4,060-declaration/368-file census.

| Passed callback rank | Project | Version / public interface | Passed / 154 | Failed | Unsupported | Binding/evidence gaps |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | mermaid-js/mermaid | 12.2.0 / Node public API | 154 | 0 | 0 | 0 |
| 2 | adewale/agentic-mermaid | 0.4.1 / Node public API | 59 | 27 | 63 | 5 |

Original and installed-reference controls pass all 154 callbacks. The selected API contract retains upstream DOM mocks; it establishes neither whole-suite conformance nor drawing content.

## Qualified first-use timing

The ordinary qualifier admits all 18 retained returns from six balanced A0/A1/B rounds on one authored flowchart, source SHA-256 `feda1279ae97f89657702f65c779ff06c669a5cbfb05f2e8f3fc2a3c73b347eb`. Agentic Mermaid 0.4.1 and both Mermaid 12.2.0 replicas use frozen browser SVG bindings. Timing covers host `page.evaluate` through returned SVG serialization and cleanup; import/initialization, browser startup and correctness grading are excluded.

| Median round ratio rank | Qualified comparison | Candidate median ms | Candidate/control median round ratio | 96.875% median-ratio interval | Checked returns |
| --- | --- | --- | --- | --- | --- |
| 1 | Agentic Mermaid 0.4.1 vs Mermaid 12.2.0 | 328.443 | 0.578 | 0.461–0.872 | 18 / 18 |

Lower ratios are faster for this single comparison. The A/A band, 0.844–1.185, is separate from the six-round order-statistic interval. Final grading identity: `00834d2aa2b8678511768f1e979e9c0ca0c206911a2b018dcf021debdbd607a8`. The replay preserves original output, plan, sample and invocation hashes without new clocks or renderer calls. [Measurement limits](../MEASUREMENT.md) preclude a broad workload, steady-state, percentile or memory ranking.
