# Changelog

## Unreleased

- DaveBench: a completion now needs an output that passes mechanical admission after the clock stops (sized SVG, valid PNG, terminal text that is not empty, an error message or the source printed back). Two terminal CLIs printed unsupported input back inside a box and exited 0, which had counted as 861 completed renders each. Time now separates equal completion counts only between rows with the same boundary kind (fresh process or persistent API).
- Mermaid Fidelity: score the callbacks the pinned Mermaid control passes. Callbacks the control cannot pass were everyone's unknowns and capped Mermaid at 54.6% of its own tests. Every bindable candidate now attempts all selected files against one shared control run; ten had previously been run on 42 of 316 files. Add `--reuse-reference`, a configurable per-target timeout and a merge script.
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

- Freeze [B0](results/baseline.json) with exact corpora, contract epochs, owned
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

- Publish the [minimum-cohort qualification results](docs/qualification-results-2026-10-31.md)
  and restorable source/output evidence. Tables rank named verified counts and
  retain unresolved facts. Re-review source-frozen PNG holds from actual pixels,
  with admitted decisions, required-fact gaps and native no-image outcomes kept
  separate in the owning report. Historical restoration checks retain their
  exact revisions and original review populations.

- Freeze all 548 DaveBench syntax-documentation occurrences, including 546
  whitespace-trimmed sources (547 exact bodies), with exact source hashes and structured expectations. The
  [source census](docs/docs-source-expectations.md) records drawing contracts,
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
[SUPPORT-QUALITY.md](SUPPORT-QUALITY.md). Those checks establish invocation for
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
