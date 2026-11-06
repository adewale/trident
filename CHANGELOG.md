# Changelog

## Unreleased

- **A fresh collection of all three benchmarks (6 November).** Zombie Mermaid 5.14.4,
  Termaid 0.12.0 and a new OpenCode commit are measured at their new releases. Latias
  Merman's SVG and PNG are now measured through its browser SDK, which has caught up with
  its CLI, so it leads both formats with 1,338. Frankenmermaid is measured at its v0.4.0
  tag. Pele leads Mermaid Fidelity with 3,143. `results/release/README.md` explains each
  change from 0.2.0.
- `versions` takes a distribution from its CLI release tag when the default branch
  carries an untagged version, so all of a project's outputs measure one release.
- `campaign:results --native-png` adds the Mermaid Flutter native PNG runs to the image
  results, so a campaign has no manual step. `versions --since FROZEN_CATALOG` lists the
  projects that have released since a published campaign, installing nothing.
- Mermaid Fidelity: 11 tests that Trident could not assess for Pele and Bezel are now
  assessed through reviewed views of their own models (event modeling relations, XY
  charts, requirement edges, Bezel's empty sequence accessibility description).
- CI runs browser tests on Playwright's Chromium instead of the runner image's unrelated
  Chromium snapshot, the likely cause of the intermittent browser-test timeouts.
  `AM_CHROMIUM_EXECUTABLE` is renamed `TRIDENT_CHROMIUM_EXECUTABLE`; the unused
  `AM_BROWSER_TESTS` is gone.
- `versions` keeps Mermaid's row at the oracle pin (12.2.0), which `prepare` requires,
  and reports Mermaid's newest release beside it. It used to select Mermaid's latest
  release, which `prepare` then refused.

## 0.2.1 — 6 November 2026

A documentation and usability release for people building or choosing Mermaid
implementations. No benchmark result changes: the published results are still the 0.2.0
collection.

- The README opens with what Trident is and who it is for, explains each benchmark by the
  question it answers and what it leaves open, and lists the current leader in each
  benchmark. DaveBench is credited to Dave Kiss's posts, with links.
- A quick start reproduces Ondine's DaveBench row from a fresh clone in about two minutes.
  The install and campaign instructions name the Mermaid checkout each benchmark needs,
  define every placeholder, and state that merging the Mermaid Flutter runs into the
  image results is a manual step.
- The limitations are collected in one section, including the maintainer's Agentic
  Mermaid conflict of interest. Maintainer working notes moved to `CONTRIBUTING.md`, and
  the README states the MIT license and where to report problems.
- The leaders, the SVG completion range and the campaign's collection dates are
  generated facts, so `results:snapshot --check` fails when they drift from the result
  files. A lead that unassessed cases could still overturn is marked "not yet settled".
- DaveBench, its terminal collector and the native PNG counter now name the missing
  Mermaid checkout or commit, instead of failing with `posix_spawn 'git'`.

## 0.2.0 — 5 November 2026

The first published Trident release. It benchmarks Mermaid implementations with three
benchmarks and publishes one consistent collection of them.

- **DaveBench**: completions and time for the 1,342 Mermaid documentation examples, in
  SVG, PNG and terminal text. A completion needs usable output, and fallback renders drawn
  from the source text are rejected.
- **Drawing Correctness**: whether 127 reviewed cases draw their labels without raw
  syntax, in SVG and terminal text.
- **Mermaid Fidelity**: Mermaid's own test suite, run against each candidate's parser
  through reviewed views. It is scored over the 3,618 tests the pinned Mermaid passes.
- **Results**: the [release campaign](results/release/README.md) covers 27 projects on
  one machine at the versions frozen on 2 November. Every number in the docs is generated
  from it, and CI checks that the result files reconcile with each other.
- **Commands**: `prepare`, `davebench`, `davebench:terminal`, `davebench:native-png`,
  `drawing:correctness`, `mermaid:fidelity`, `campaign:results`, `results:snapshot`,
  `versions`, `upstream:prepare` and `mermaid:install`. Earlier designs' commands and
  pipelines are removed (see below).

Known limits:

- Trident cannot assess 94 Fidelity tests, in 10 projects.
- Results use the versions frozen on 2 November, collected on one machine; absolute times
  compare only within the campaign.
- Benchmarks never run in CI.
- Fidelity needs a pinned Mermaid checkout and a locked Vitest runtime (`upstream:prepare`).

The `v0.1.0` tag (an unpublished draft of an earlier design) is unchanged.

### Detailed changes

- **Release campaign (5 November).** All three benchmarks were collected on one machine against the frozen 2 November catalog, and the results live at fixed paths in `results/release/`. File names no longer carry a hand-chosen date (a file named 2026-11-04 had held data from 5 November); published dates come from each file's own timestamps. Every number quoted in the docs is generated from these files, and `results:snapshot --check` fails when the docs drift from them.
- **DaveBench rejects fallback renders.** Output that shows the source's header line verbatim, or at least three and at least half of its syntax-bearing statements, was drawn from the source text, not from an understood diagram. It no longer counts as a completion. Calibration: Mermaid 0 rejections, Agentic Mermaid 0. Rejections by project:
  - DSH GB SVG, 956 (it draws every diagram as a flowchart): 1,340 → 384 SVG/PNG completions.
  - Frankenmermaid, 157 (block, swimlane, agentflow and railroad headers drawn as nodes): 1,342 → 1,185 SVG/PNG.
  - Latias Merman, 68 (its terminal CLI prints a debug dump of git-graph models).
  - Termaid, 26.
  - Grok and MermaidText, 6 each.
  - A few each for Mermaid RS Renderer, Crafter and XMermaid.

  Each run records which inputs were rejected and why.
- **Mermaid Fidelity: Trident gaps fall from 843 to 94**, and 16 of the 26 candidates have none.
  - **New views:** Mermaid Dart's railroad, wardley, venn, cynefin and ishikawa; more Frankenmermaid families; the ports' class members, namespaces, Treemap and Radar ASTs; XMermaid sequence, cynefin, wardley and ishikawa.
  - **Defects fixed where Trident, not the project, decided a result:**
    - Values a failed assertion prints in its message no longer turn the failure into an unsupported verdict.
    - The control no longer counts setup (`setGen('gen-2')`) as an operation.
    - Reading `setGen` before a parse no longer marks a whole test unsupported for parsers that reject a header-only flowchart (Grok, MermaidText, Loom).
    - A test file that fails on the candidate's own unsupported operation counts as unsupported, not as a gap.
    - C4 records keep their identity across getters, as Mermaid's do.
  - **Scored population:** 3,599 → 3,618 tests Mermaid passes.
  - **Passes:** Pele 3,100 → 3,135, Bezel 2,980 → 3,033, Latias Merman 2,815 → 2,851, Agentic Mermaid 2,196 → 2,202, Mermaid Dart and Flutter 2,023 → 2,101, Frankenmermaid 1,251 → 1,313, Loom 711 → 747, Grok and MermaidText 614 → 638.
- **Fidelity speed.**
  - The census records each test's identifiers, so workers no longer load TypeScript.
  - 291 candidate test files that never touch the DOM run without jsdom.
  - Native Bun parsers are called through one persistent process (Merslim 120 → 77 s, Kitlangton Merman 158 → 103 s).
  - Running test files in VM contexts (vmForks) was measured and rejected: it was no faster with two or more workers and changed outcomes.
- **Drawing Correctness.**
  - A dead worker pipe no longer records a case as unrun: the worker restarts and the case is called again.
  - Case ids are `drawing:` instead of `terminal:`.
  - Runs record when they started and finished, and a merge takes its date from the run.
- **CI and tooling.**
  - CI runs every test file except a reviewed skip list, each entry with a reason; it previously ran a hand-maintained list that left 61 files out.
  - New `scripts/rescore-fidelity.ts` applies the current outcome rules to a recorded Fidelity run.
- Remove the machinery of earlier benchmark designs, keeping only DaveBench, Drawing Correctness, Mermaid Fidelity, their synthesis and league tables. Removed commands: `bench`, `support`, `support:verify`, `community:update`, `run`/`build`/`portable`, `export`, `fidelity:report`, `rankings`, `measurements`, `measurements:replay`, `verify:measurements*`, `verify:harness`, `timing:*`, `mermaid:behaviour`, `mermaid:public-tests*`, `results:publish`, `results:compare`, `results:campaign`, `corpus:freeze`, `release:check`. Removed with them: the B0 baseline and legacy results snapshot (`results/latest.json`, `results/tables/`), the portable kit, `qualification/`, `davebench-png/`, the standalone native Flutter campaign and its prepared-artifact launcher, the old community suite runner (`runCommunitySuite`, its CLI, worker and external-worker rounds, its browser suite and the invocation journal and checkpoint modules only it used), superseded campaign pages and their evidence; all remain in the repository history. `results:snapshot` now only regenerates `RESULTS.md` and the generated numbers. A new `prepare` command installs the frozen versions with the shared community preparation that `bench --prepare` and `community:update` used. CI fails on any tracked file over 2 MB not listed in `tests/large-files.json`.
- Mermaid Fidelity (5 November, second full re-run): Trident gaps across the 26 candidates fall from 9,108 to 843; every Fidelity rank is decided except exact ties. Reviewed views now cover every family each project parses (sequence, state, git graph, C4, kanban, gantt, architecture, mindmap, requirement, pie, packet, block, journey, the ports' agentflow, usecase, railroad, wardley, venn, cynefin, ishikawa and treeView, and the Langium ASTs), in per-area modules under `unified/mermaid-fidelity/views/`; `scripts/fidelity-probe.ts` prints the native model a view receives. Runtime: an unparsed database is the candidate's own parse of a header-only diagram (unsupported when the candidate does not parse the family); a getter read but never used is not an observation; requirement constants are supplied to every candidate; Mermaid's public `parse()` and `Diagram.fromText` use the candidate's own parser and the file's own database. Several false failures were Trident's: Agentic Mermaid's authored shape names, Pele and Bezel C4 records read untranslated, whole-record comparisons against a model that keeps no wrap flag. The control no longer counts `clear()` as an operation, so three tests that exercise nothing leave the scored population (3,602 → 3,599).
- Drawing Correctness: labels are compared as visible text; the escape-sequence case, which only a renderer echoing raw control characters could pass, was re-rendered for every project (21 rows incorrect → correct).
- DaveBench: failed calls are counted by their first error line (diagnostic, not ranked); every recorded failure in the audited runs is the renderer's own. A renderer process past 2 GB resident memory is stopped and the call fails with `memory limit` (Figurehead grew to 11 GB on 16 inputs), which also shortens the terminal run from 33 to about 12 minutes.

- Mermaid Fidelity (5 November, all 26 candidates re-run on one code version): Trident gaps fall from 17,688 to 9,108 while the Mermaid control is unchanged (3,602). Three policies: Mermaid database calls, spies and `getConfig` are unsupported; Mermaid enum constants are supplied where a project's values are already in Mermaid's vocabulary; host configuration is reset per test as in the control. New reviewed views: flowcharts for XMermaid, Frankenmermaid, Zombie, Beautiful and ASCII Mermaid; class views for Agentic, VitePress and Merslim; Merslim ER; C4 for mermaid-rs-renderer, Zombie, Agentic, Merslim and mermaid_core; sequence message lists for Termaid and mermaid_core and participants for Grok, MermaidText, Loom, mermaid-rs-renderer and mermaid-ascii; kanban and treeView for the three Mermaid ports; flowchart layout data and Langium AST views. A getter imported by name from a database module (`getAccDescription` from commonDb) now reads the parsed diagram when called, and fields Mermaid leaves undefined read as undefined. Passes rise for every project with new views (Pele 2,378 → 2,685, Agentic 1,257 → 1,579, XMermaid 388 → 781); most newly assessed tests are failures or unsupported operations that had been hidden as gaps. `scripts/fidelity-gaps.ts` lists the remaining gaps per project and cause.
- Drawing Correctness: a case with no labels is judged only on raw-syntax leakage; SVG and terminal were recollected and the 20 unknown rows are correct. DaveBench terminal takes `--projects`.
- Drawing Correctness checks labels instead of measured geometry: every label named by the reviewed source facts must appear, with no raw Mermaid syntax. Unassessed results fall from 2,805 to 20; the check agrees with every result the geometry checkers had confirmed correct. PNG is dropped from Drawing Correctness because OCR cannot read diagram labels reliably; it stays in DaveBench. The synthesis treats Drawing as not applicable to PNG-only renderers.
- Discard the 1 November raw-output archive instead of publishing it. Results are verified by re-running frozen versions against pinned inputs; references to a downloadable archive are removed and the evidence rule is documented.
- DaveBench: a completion now needs an output that passes mechanical admission after the clock stops (sized SVG, valid PNG, terminal text that is not empty, an error message or the source printed back). Two terminal CLIs printed unsupported input back inside a box and exited 0, which had counted as 861 completed renders each. Time now separates equal completion counts only between rows with the same boundary kind (fresh process or persistent API).
- Mermaid Fidelity: score the callbacks the pinned Mermaid control passes. Callbacks the control cannot pass were everyone's unknowns and capped Mermaid at 54.6% of its own tests. Every bindable candidate now attempts all selected files against one shared control run; ten had previously been run on 42 of 316 files. Add `--reuse-reference`, a configurable per-target timeout and a merge script.
- Mermaid Fidelity: parser bridges for Zombie Mermaid, XMermaid (its WASM parse_dsl), VitePress Plugin Diagram, DSH Mermaid GB SVG, OpenCode Merman, MermaidTUI and Beautiful Mermaid, each calling the project's own per-family parsers; families outside a project's own detector are unsupported. Reviewed views for Zombie, Beautiful, XMermaid and Frankenmermaid ER and class models. Unassessed callbacks for the six JavaScript projects fall from 2,200–2,660 to 96–1,290.
- Mermaid Fidelity speed: lazy TypeScript loading in per-file modules, `--workers N` parallel test files, persistent Node/Bun/Python bridges (`TRIDENT_BRIDGE_SERVE=1`, called synchronously from the runtime), indexed outcome matching, and `merge-fidelity-runs --base` for partial re-runs checked against a control-run digest. A project's full suite takes about 2 minutes instead of 9–19, with identical outcomes.
- Re-collect all three benchmarks on 4 November: every DaveBench completion count and rank and every Drawing Correctness row reproduce 3 November.
- Mermaid Fidelity reference adapter: bind the diagram families added to Mermaid since the adapter's example list (agentflow, railroad and its variants, usecase, treeView, cynefin, venn, wardley, swimlanes; eventmodeling's header), `addDiagrams`, `setLogLevel`, `Diagram.fromText`, diagram definition and Chevrotain parser modules, and test spies; stop a commented-out call from marking every test in its file; run from Mermaid's repository root on the `upstream:prepare` locked runtime. The scored population grows from 2,894 to 3,602 of 5,737 expanded callbacks and unloaded files fall from 23 to 15. The 2,034 callbacks still unqualified test Mermaid internals the public package does not expose and are accounted for outside the scored population.
- Mermaid Fidelity candidates: a family the candidate does not parse, Mermaid's mutable database API, the jison `yy` callback protocol and concepts a native model does not carry are unsupported operations (known nonpasses) that outrank Trident gaps. Reviewed per-project schema views map the bridged models for flowchart, class, ER and git graph diagrams and the radar and info ASTs; Ondine exposes no model. Unassessed callbacks for bridged projects fall to 250–1,000 each, and a false-failure path in the generic class projection (unmapped member fields read as candidate errors) is closed for bridged projects.
- CI: update the two legacy snapshot tests whose expected table rows predated the merged project/version column.
- Mermaid Fidelity: add parser bridges for the 13 projects whose parsers are not importable JavaScript (Rust, Go, Dart, Python, native CLIs and module-private TypeScript). Each bridge calls the project's own parser and verifies the prepared revision, checksum or version; no project is left without a Fidelity binding. All 26 candidates attempted all 316 selected files against one shared control run. Native enum spellings of Mermaid shape names now match case-insensitively, raising Frankenmermaid from 308 to 367 passes; no other existing row changed.
- Recollect DaveBench for all 27 projects with output admission (3 November). Grok renderer and MermaidText fall from 1,342 to 481 terminal completions; empty returns and zero-size SVGs cost 10–162 completions for eight more projects; every other count reproduces 2 November. Mermaid Flutter's native PNG counter is measured for the first time (1,114/1,342), built from the committed lockfile and run under host Xvfb (`davebench:native-png --host-display`).
- Drawing Correctness records empty, error, echoed or zero-size outputs as invalid-format nonpasses instead of observer gaps; all terminal cases were recollected (unresolved 730 → 681).
- Equal-weight synthesis: show each project's possible rank instead of ranking by verified minimum, which treated unmeasured work as zero. DaveBench contributes its absolute completion rate, not a participant-relative rank percentile. Drawing and Fidelity tables also show possible ranks beside verified ranks.

- Replace the results overview with separate compact benchmark rankings, explicit paired timing tables, unassessed states and illustrated retained PNG examples. Keep detailed diagnostics linked and explain what archive verification establishes.

- Publish the full 27-project campaign with separate SVG, PNG, terminal and behaviour tables, scoped timing and downloadable raw evidence; preserve B0.
- Import standard timing bundles through normal reporting, retaining each pair’s controls and withholding unqualified speed ranks.
- Fix terminal report serialization and SVG journal lookup; replay blocked stylesheet imports under the collection policy.
- Regrade selected formats without changing the others, retain prior completion receipts and avoid hashing an immutable SVG context for every case.

- Make DaveBench coverage one retained call per input and format, without warmups; reserve repetition for qualified timing.
- Remove unused reverse PNG-to-SVG scoring machinery; keep historical evidence intact.
- Consolidate benchmark descriptions and current PNG evidence links; distinguish core workloads from maintenance diagnostics.
- Cancel superseded CI runs.
- Seal shipped npm modules and installed dependencies for future captures; retain explicit limits on historical artifacts.
- Add 49 portable Mermaid behaviour cases with upstream provenance, native public adapters and saved-output replay, separate from exact API compatibility.
- Independently validate SVG, PNG and terminal observations; fix requirement direction, packet-span checks, overpaint and equivalent document/state styles.
- Publish disjoint drawing outcomes, observer coverage and correctness bounds; keep the original B0 baseline immutable.

The first public 0.1 release has not been published. B0 freezes the bounded
benchmark results and their observation limits; release publication remains a
separate step.

### Benchmarks and measurement

- Freeze B0 with exact corpora, contract epochs, owned
  outcomes and raw evidence. Generate current tables through the ordinary
  reducers, and verify B0 input/output hashes alongside the rolling results.
- Extend SVG graph, sequence, grammar and chart observers with independent
  wrong-output controls. Correct two PNG false positives and terminal failures
  based on unqualified marker spellings. Regrade saved outputs instead of
  repeating renderer campaigns; preserve prior verdicts and actual call dates.

- Retain every authored prelude and main return before grading. Replay completed
  workflows without new calls, preserve interrupted attempts, and keep shared-session
  claims unknown across separate CLI processes. Verify recovery after a grading crash.
- Add cold terminal-CLI and complete PNG-export timing through the shared collector
  and offline qualifier. Keep their workloads, startup boundaries and intervals
  separate from first-use browser SVG timing. Sealed timing targets need no extra
  Mermaid oracle installation.
- Correct quadrant canvas dimensions and unrequested axis-side assumptions; admit
  only qualified C4 connector endpoint contact and reject foreign overpaint. Prune
  disjoint contour layers before route matching. Extend Git cover checks to images,
  instances and primitive strokes, and verify source-defined radar curve controls.

- Make the 100 AM/Trident-authored feature/edit cases unscored harness/observer
  regressions. Keep sources, raw evidence and historical reports; remove their
  renderer ranks, charts and overview score. Ordinary collection defaults to
  DaveBench; regressions require explicit `--suites fidelity`. Pinned public API
  tests and terminal results retain their separate populations, and timing stays
  in qualified scoped tables.

- Publish the minimum-cohort qualification results
  and restorable source/output evidence. Tables rank named verified counts and
  retain unresolved facts. Re-review source-frozen PNG holds from actual pixels,
  with admitted decisions, required-fact gaps and native no-image outcomes kept
  separate in the owning report. Historical restoration checks retain their
  exact revisions and original review populations.

- Freeze all 548 DaveBench syntax-documentation occurrences, including 546
  whitespace-trimmed sources (547 exact bodies), with exact source hashes and structured expectations. The
  source census records drawing contracts,
  configuration-only inputs, unresolved interpretations and review scope. Source
  coverage supplies no output pass.
- Require every declared drawing fact, actual output hash and observer identity
  for correctness. Missing projections remain unknown instead of shrinking the
  criterion denominator. Independent source audits fixed grammar, geometry,
  containment, activation and source-order transcription defects.
- Bind reviewed PNG evidence to exact canonical RGBA16 samples and display
  metadata. Strict SVG-to-PNG preservation additionally requires the actual
  rasterized SVG, frozen rasterizer/fonts and an independently reviewed reference
  image. A native PNG without complete content evidence remains unknown.
- Qualify 154 unchanged Mermaid public callbacks from 37 declarations against
  original-source and installed-reference controls. Keep the 4,060-declaration
  census and historical 41-callback scope separate; this is public API evidence.
- Use the versioned active terminal corpus in ordinary benchmark collection:
  115 original drawings, one reviewed adaptation and four invalid controls.
  Preserve all 120 original sources and the ambiguous original state example
  in the 121-entry research inventory. Historical runs keep their original IDs.
- Separate visible drawing facts from native metadata, including raw Git
  operation history and layout identifiers. Keep one ambiguous documentation
  example unknown without removing it from the 546-drawing denominator.
- Allow each renderer's default skin. Require explicit paint overrides and named
  palette tokens without imposing Mermaid's unrequested opacity, border widths
  or brightness. Keep visible-owner checks and monochrome relationships required.
- Inspect all 997 returned images in the two-project PNG qualification cohort.
  Bind each accepted judgment to its current source contract and actual pixels;
  unresolved facts remain unknown. Review files can be authored without Codex.
- Embed frozen image resources during browser PNG conversion. The targeted
  favicon example now retains its image; the former blank export was a Trident
  conversion defect, with the same Mermaid artifact before and after.
- Prevent hidden node bodies, covered connectors and erased arrowheads from
  earning a complete SVG certificate. Measure dash paint using actual path
  lengths and cap scaling; omitted marker orientation is fixed zero degrees.
- Dispose of timed-out documentation pages before later calls, and bind frozen
  capture inputs to calls that actually entered after the capture began.
- Verify 16 public execution paths across six complementary project artifacts,
  using 56 output calls and separate model operations. Bound harness collection
  to five minutes after preparation; invocation coverage is not a quality score.
- Add first-use browser SVG collection from sealed artifact pairs, with fresh
  contexts, actual fontconfig inputs, retained returns and a declared RPC/public
  call boundary. Offline timing qualification checks every captured output and
  A/A controls. Fresh grading reuses unchanged raw outputs and clocks, including
  returns omitted by a crashed observer. Historical return-only clocks remain
  unqualified.

- Retain first-round DaveBench SVG witnesses and bind reviewed content checks to
  exact source bytes. Missing expectations remain unknown; successful SVG return
  cannot supply a correctness pass. Separate full inventory and reviewed-subset tables.
- Fix the shared paint observer for bounded SourceGraphic-preserving drop shadows
  and group-container ownership. Check explicitly hidden source content, including
  collapsed-group members, with positive and broken-output regression controls.
- Retire Assertion Replay and the nonblank-only PNG exporter from new comparative
  runs. Performance, optional models and reference tests require explicit selection.
- Retain the earlier terminal flowchart prototype and its original results;
  expanded terminal contracts do not rewrite that evidence.

- Complete a targeted six-round Mermaid 12.2.0 DaveBench rerun: 547/548 SVG
  returns in every round, with the original image-decoding failure retained.
  Rolling coverage preserves comparable peer scores, dates and row evidence
  when importing a one-project rerun; changed input bytes cannot join the cohort.
- Publish the 30 October 39-project campaign, ranked tables and a checksummed raw
  download. The rolling overview uses the current 27-project selection and links
  the archive for projects excluded later. Large reports have linked detail pages.
- Keep interrupted DaveBench rounds unranked, distinguish partial observations
  from unexecuted inputs, retain CLI variant ownership, and resolve owning reports
  relative to an extracted evidence archive.
- Historical results retain the seven original suite identities. Current
  comparisons use documentation SVG/PNG, pinned public API tests and terminal
  rendering. Authored feature/edit cases are unscored diagnostics; optional
  public-model contracts and qualified timing tracks retain separate scopes.
- Portable SVG process protocol v7 separates output admission, public-model facts,
  painted evidence and timing calibration. Its bounded route/marker checks inspect
  actual ink; unavailable projections and failed qualification remain visible.
- Qualification observer `portable-owned-topology-v3-agentic-class-er` reads the
  actual public Class/ER model and independently checks owned SVG routes, directed
  Class arrows, and simple ER cardinality/identifying ink. Marker overrides cannot
  hide behind SVG attributes. Unsupported profiles remain unmeasured; historical
  qualifications keep their original observer and timing identities.
- Shared public-output verification v2 runs six positive inputs and two separately
  counted invalid controls. API rejection, accepted output, transport failure and
  unavailable observation retain different outcomes. Raster decoding earns no SVG
  label, topology or editable-model credit.
- Balanced project ordering, frozen input provenance, independent invalid controls
  and explicit artifact/runtime identities support comparisons on matched work.
  Timings, resource domains and correctness measures retain separate units and scopes.
- Published artifacts and explicit source/npm candidates use recorded byte and
  dependency identities. Workspace dependencies, prepared-worker arguments and
  native launch manifests are sealed; candidates never replace release scores.

### Projects and public interfaces

- The catalog contains 89 identities: 27 renderers are normally scheduled and
  62 entries remain excluded. Twelve former participants are catalogue-only;
  validator, parser, formatter and conversion-only entries are outside renderer scope. Distinct branding, source lineage, application exclusions
  and skips remain explicit. Beautiful Mermaid is a derivative, rather than a Git fork.
- Mermaid Dart SVG and Mermaid Flutter native PNG have separate branded identities.
  Their shared parser/layout core remains documented. Native Flutter preparation
  selects the regular catalog entry without an override; saved bindings select
  and verify the actual release bundle and runtime facts.
- Additional bindings exercise terminal output, native PNG and Excalidraw conversion
  through public APIs or release CLIs. Image fallbacks earn no editable-model credit.
  Public factories retain their receivers and dispose instances; companion artifacts
  join the measured dependency identity.
- Rusty Mermaid 0.42.0 remains skipped because its published package omits the
  runtime. A separately identified source candidate cannot stand in for that release.
  Whole-editor workflows and Agentic-only product/release checks stay outside core.

### Results, checks and release preparation

- Lineage artwork records its Agentic Mermaid version and uses the public PNG API
  with verified bundled fonts; style and palette controls are available separately.

- RESULTS.md and its machine-readable source provide dated, per-benchmark tables
  and charts. Comparable results are stack-ranked by the named metric, with tied
  ranks and explicit unmeasured, blocked, failed and withheld cells. Historical
  measurements and candidate tables keep their original identities and dates.
- Real native Flutter checks passed six positive PNG inputs and two rejection
  controls, including saved-binding replay and a blocked conflicting executable
  override. Dated receipts retain the actual bundle, outputs and producer sources.
- GitHub CI runs static checks, result-snapshot consistency and offline fixture
  tests. Artifact acquisition, renderer execution and benchmark measurements remain
  local. Shared launcher and CI policy remove duplicated command decisions.
- Campaign preparation now creates one hashed manifest for artifact/dependency
  identities, input inventories, applicability and retained compiled files/locks.
  Collection and resume use that entry point instead of session-specific scripts.
  Browser snapshots are bound to the selected primary artifact; missing browser
  support cannot remove the primary artifact's seal. Source-only CLI pins and
  observed catalog entries remain valid without inventing a published release.
- Portable v7 uses six independent rounds and five fresh processes per replica;
  invalid controls run once, and failed/blocked admission withholds repeated clocks.
  The 54-case workload remains. The current ten-project Node SVG selection plans
  45,900 cold launches; the preceding eleven-project selection planned 50,490.
  Sampling is unchanged. Historical qualification remains versioned; noise and correctness gates still withhold unsupported claims.
- One deadline covers external examples and the seven-suite campaign. Checkpoints
  retain portable jobs and completed DaveBench project-rounds; resumed allowances
  and runtime identities are recorded without silently restarting the budget.
  Forced resumes reuse their own completed records across cache-history changes.
  Completed calls can publish after the deadline, and pilot collection costs add
  active windows while excluding idle pauses. Failed admission retains any returned SVG.
- Campaign imports generate ranked tables and charts from owning observations.
  Pilot headlines are reduced from owning reports; the original preparation
  summary incorrectly said zero cases completed semantic checks. Pele completed
  them for its one flowchart case. The corrected reduction preserves original data.
  Fresh DaveBench rows retain their overview ranks and literal percentages;
  candidate attempts and fully blocked rows cannot replace release scores with
  a new rank or a fabricated zero. Extracted pilot reports use relative paths.
- `release:check` builds once and verifies source collection/reporting and the
  extracted shipped archive, producing one receipt alongside checksums. Separate
  manually coordinated smoke checks are no longer the documented release path.
  Its `package-parity-verified` receipt requires source/extracted-kit workflow
  parity against the same frozen artifact and rechecked SVG admission. It
  preserves witnessed renderer findings and rejects unclassified host failures;
  it does not establish full source-harness or benchmark correctness. Temporary
  build staging preserves clean-source provenance when the chosen output directory
  is inside the checkout.
- Peer admission uses each artifact's recorded version while retaining reference
  and tool pins. OpenCode seals its actual renderer runtime dependencies. Public
  release CLIs accept reviewed dot-prefixed archive members; versionless executables
  explicitly bind their version to a matching release tag and archive checksum.
  CLI resource passes preserve output-specific arguments and file/stdin bindings
  when GNU time wraps the command.
- BASELINE.md defines B0 as immutable evidence for the declared benchmark scopes,
  with frozen artifacts, inputs, observers, raw witnesses and limits. It separates
  six-project transport verification from correctness, matched timing and
  packaging. B0 retains every unknown in its declared populations. Later releases reuse unchanged evidence and
  recheck only affected claims; an ecosystem campaign is not an automatic gate.

The original 0.1 invocation receipt exercised 37 of 42 selected entries. Later
bindings and brand-specific verification are separate dated evidence in
SUPPORT-QUALITY.md. Those checks establish invocation for
bounded inputs, not complete family support, full painted meaning or timing
qualification. Public development inputs are not a validated holdout. Optional
model observers and interface coverage vary; Trident claims no overall winner or
complete neutrality.

## 0.1.0 source tag — unpublished release

The existing tag records preparation snapshot
[`f255b6845da0d327ecc071cc86ef53a6fb809736`](https://github.com/adewale/trident/tree/f255b6845da0d327ecc071cc86ef53a6fb809736),
which introduced standalone public-artifact benchmarking, the portable Node kit,
seven documented suites, lineage selection and the original support receipt.
The changes above are not present in that tag. Preserve it when publishing newer
code under an unused version. The GitHub release is still a draft without assets.
