# Terminal checker completion, 1 November 2026

The [ordinary saved-mode result](result.json.gz) regrades the existing active
116 drawings for each of 18 frozen projects. It adds no drawing or source-reference
calls. The [summary](summary.json) is derived from that result with the normal
best-first verified-count reducer. It retains the prior result hash and every
changed drawing verdict: 41 unknowns become correct and seven become incorrect;
no previously decided drawing changes. Complete accuracy remains unresolved.

The new checks observe cycle-free, single-target merge trees, disjoint extra node
containers, authored node breaks and node order independently of route tracing.
Wrong-output controls reverse heads, break source branches, remove source
obligations, add targets, merge hard lines and invent closed nodes. Multiple
sources plus multiple heads, cycles and repeated source paths retain unknown.

| Minimum terminal cohort | Correct drawings | Incorrect | Unknown: returned output unverified | Unknown: no retained output | Planned drawings |
|---|---:|---:|---:|---:|---:|
| Termaid 0.10.0, Python public API | 59 | 20 | 37 | 0 | 116 |
| Mermaid ASCII 1.6.1, native public CLI | 42 | 21 | 13 | 40 | 116 |

Thirty-eight of Mermaid ASCII's missing-output cases have its actual public
unsupported-family diagnostic; two have other recorded failures. These remain
unknown drawing outcomes. All projects' missing/output-present splits and the
raw reasons for every remaining gap are in the summary and
[compressed dispositions](unknown-dispositions.json.gz). The explicit unsupported
subset is conservative: only the frozen CLI diagnostic is classified. A declared
unsupported preflight is separately labelled and does not imply a public call.

Exactly eight new public calls collect the four invalid controls on these two
artifacts. The [control transcript](invalid-control-calls.json) retains complete
sources, original transport observations, durable start/outcome frames and all
[output/stream bytes](control-outputs/). It preserves actual per-call times and
artifact identities; the October drawing collection is unchanged. Mermaid ASCII's
exact diagnostic is bound to its frozen binary, source and stdin binding, then
classified offline without another call. The normal rejection assessor credits
only the two inputs with no diagram family. Unsupported pie/Gitgraph rejection
supplies no syntax credit. Termaid actually returned for all four invalid inputs.

| Invalid controls, separate population | Correct typed rejection | Accepted invalid source | Unknown | Planned controls |
|---|---:|---:|---:|---:|
| Mermaid ASCII 1.6.1 | 2 | 0 | 2 | 4 |
| Termaid 0.10.0 | 0 | 4 | 0 | 4 |

Other projects were not recollected. Their 64 invalid-control cells remain
unknown. Tests cover wrong executable identity, mixed stdout, generic errors,
transport interruption, stale source identity and successful invalid-source
acceptance. No runtime Codex, renderer agreement or source echo supplies a pass.
