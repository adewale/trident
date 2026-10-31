# Benchmark scope audit — 31 October 2026

Audited main at [`d50e200`](https://github.com/adewale/trident/tree/d50e20032609cc14ccffbc0d2daf3034aac65d3c).
The six named suites cover useful questions, but several collect the same work or
perform harness checks rather than compare renderers. An AM origin alone does
not make a test AM-specific.

## What each component provides

| Component on main | Corpus origin and measured question | Recommendation |
|---|---|---|
| Diagram Meaning | [AM/Trident-authored cases](../fidelity/cases.ts): does actual SVG preserve declared labels, relationships, values, visibility and grouping? | Keep the shared observers and negative controls. Use them inside corpus benchmarks, including reviewed DaveBench inputs, rather than count each criterion as a separate benchmark or overall quality vote. |
| Model and Editing Contracts | The same authored cases through public parser/model/configuration/edit APIs. | Keep shared public contracts as optional tests and conformance support. Missing bindings are measurement gaps. Remove duplicate SVG collection and move currently AM-only serializer orchestration back to AM. |
| Mermaid Assertion Replay | [Original Mermaid tests at `1fb7869`](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b), adapted through parser/model projections. | Keep the upstream corpus and the conformance question. Replace the flawed replay interpretation with a predeclared public-behaviour test inventory. Count tests and disclose exclusions; private import/projection/matcher compatibility cannot become renderer conformance. |
| Mermaid Reference Tests | The same pinned Mermaid tests executed by their original core runner. | Keep as reference/environment validation when its pin or runtime changes. It provides no comparative peer score and need not run in every campaign. |
| Render Cost and Scaling | [AM/Trident-authored family, scaling, adversarial and invalid inputs](../portable/cohorts.ts): public Node SVG latency and resources across call modes. | Keep shared timing, resource and calibration machinery. Apply it to verified corpus work. Keep scaling, cache-key, retention and editing investigations explicit and optional; they are not additional universal renderer scores. |
| PNG Export — standalone v1 | The 548 documentation occurrences at the same Mermaid source pin, through four hard-coded published versions. | Replace the collector with DaveBench's PNG lane. Reuse native transports, conversion and decoding. Retain old evidence with its original limits; do not revive nonblank-only correctness or withdrawn timings. |

## Actual AM-specific remnants

Two operations in [fidelity/run.ts](../fidelity/run.ts) check
`serialized-meaning-readback` and `serialized-pinned-reference-readback`.
Only AM currently receives the `serialize` binding in
[fidelity/adapters.ts](../fidelity/adapters.ts). These are AM SDK regression
checks, already excluded from shared comparison credit. Their orchestration and
product expectations belong in AM, using Trident's generic fact-checking helpers
as a pinned dependency if useful. A future multi-project Mermaid-source round-trip
task would need reviewed bindings and the same contract for each participant.
The current code also serializes the same source twice; one retained result can
feed both readers.

[unified/community.ts](../unified/community.ts) forcibly sets
`AGENTIC_MERMAID_ELK_CACHE=1` and `AGENTIC_MERMAID_SCENE_ASSERTIONS=0` in the shared
Node worker. This is AM-specific runtime configuration, not a benchmark. Remove
these forced settings from neutral collection; a deliberate project configuration
must be explicit in the task and receipt. The audit identifies this cleanup;
the output-format change does not silently rewrite historical measurements.

AM-specific invocation/MCP matrices, editor/session flows, private backend
profiles and release budgets already belong outside Trident's core scope under
[SCOPE.md](../SCOPE.md). They should not be recreated as neutral benchmark suites.
Public AM adapter code remains necessary to invoke AM under the same task as peers.

## Where collection is duplicated

- `fidelity/community.ts` and `fidelity/run.ts` both render SVG and run the shared
  paint/value observers on overlapping authored cases. The latter is the
  model-contract collector for its three bound projects. Reuse compatible SVG
  evidence; rerender only when an edit/configuration workflow requests new output.
- Replay and the original test runner use the same upstream test source for
  different purposes. Run the original runner to validate the reference, then
  compare eligible public behaviours through adapters. Do not publish two
  conformance scores for these two stages.
- Portable cost cases overlap authored family/feature probes. Timing and
  correctness should consume the same declared input and retain separate units.
  Appending comments changes a cache key, not the semantic diagram; keep that
  experiment labelled as a cache diagnostic.
- The old PNG collector repeats documentation extraction, browser setup, artifact
  selection and reporting with its own fixed project/version list. The PNG lane
  now shares DaveBench's literal source inventory and existing public transports.

## Useful combinations

**DaveBench:** one pinned documentation corpus, separate SVG and PNG lanes.
Drawing observers and image reviews establish content; timing measures completed
work on matched, verified inputs. Native PNG-only renderers participate without
an SVG API. SVG-to-PNG conversion is an explicit path with its own clock boundary.

**Mermaid Conformance:** a pinned original-test inventory, predeclared eligibility,
and adapter-equivalence checks against the reference. Shared public-model tests
can support this work. Internal-only tests remain excluded with reasons; an
unsupported public language feature stays in the eligible denominator. The
replacement conformance comparison is not implemented by renaming old replay data.

**Terminal Rendering:** the [120-input source corpus](terminal-corpus.md) now
retains docs, regression fixtures, issues and PRs from capped research across 18
repositories (17 contribute selected inputs), with independent contracts for a
subset of 16 reviewed drawings. Terminal-specific evidence is labelled separately from shared
SVG/renderer robustness; none of these counts establish usage frequency. A cell-grid observer checks
actual text layout and graph connections. Checker mutations are tests of the
observer, outside the corpus score. Correctness and speed keep the same source
population visible; unlike invocation boundaries do not share a speed ranking.

**Optional investigations:** common public edit/model contracts, large-diagram
scaling, cold start, memory and cache behaviour answer narrower engineering
questions. Run them when that question matters rather than repeat every one as
a release ritual.

The [seven-project fixed-PNG study](davebench-png-seven-results.md) remains useful
dated evidence for its 13 common reviewed inputs and 1200×900 export task. Its
fit/paint coverage and end-to-end cost cannot be substituted for full DaveBench
accuracy, intrinsic PNG export, or isolated renderer speed.

## Status of the output-format change

The new collector implements two selectable DaveBench output lanes over the same
literal inventory, frozen artifact selection, retained PNGs, source/image-bound
content reviews and independent SVG/PNG reporting histories. It does not invent
reviews for 531 unreviewed documentation occurrences, infer PNG content from SVG,
or qualify descriptive clocks as speed results. Shared model collection,
AM-specific worker settings and upstream-conformance eligibility remain explicit
follow-up work identified by this audit.

## Cleanup following this audit

The follow-on cleanup removes the AM serializer binding and both serializer/readback
operations, removes forced AM cache/assertion settings from neutral workers, and
makes model contracts Node-only. They no longer repeat the SVG collector or require
a browser bundle. The old standalone PNG collector and its AM-specific worker are
deleted; shared PNG conversion and the dated evidence remain. The retired command
points to DaveBench's PNG lane.

One-round documentation coverage skips performance warmups. Broader repeated cost,
cache, memory and scaling profiles remain optional diagnostics; their sampling is
not silently reduced or presented as full performance qualification. Upstream test
conformance remains an unimplemented benchmark, rather than old replay under a new name.
