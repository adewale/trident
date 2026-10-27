# Benchmark guides

[All scorecards](results/SCORECARDS.md) · [Inventory](INVENTORY.md) · [Measurement rules](MEASUREMENT.md)

This index covers the 63 entries resolved on 27 October 2026 plus the conditional `distribution-dist-fuzz` entry: 64 entries in total. `modern-summary` is a report reader, not another benchmark. Enrollment depends on the selected source checkout; `--list` is authoritative for a new run. Documentation coverage does not imply measurement coverage or a passing result.

## Run and retain evidence

Community collection runs directly in Trident; source diagnostics require the explicit Agentic Mermaid adapter. Install Trident dependencies with `bun install`; install the pinned oracle/addon with `node commands.ts mermaid:install`. Follow [source setup](README.md#optional-agentic-source-adapter) to install/build the selected Agentic Mermaid checkout. For source suites, set `TRIDENT_AGENTIC_ROOT` once in the shell:

```sh
export TRIDENT_AGENTIC_ROOT=/checkouts/agentic-mermaid
bun commands.ts agentic --list --profile full
bun commands.ts agentic --profile full --suites ID --out /evidence/ID --rounds 5
```

Replace `ID` with the exact entry below and supply its additional inputs. `--list` resolves prerequisites without collecting measurements. A selected test or source diagnostic uses its declared driver; `--target` alone does not redirect static imports. Keep the campaign `report.json` pointer **and** `report.json.gz`, each suite directory and its `run.log`, owning artifacts and any retained record store. The Markdown alone cannot validate original samples or drawings. Internal suites can embed observations in the campaign document; script suites retain their own files/logs.

Every row below links its owning implementation and the applicable setup/interpretation guide. The scope states what is scored. Read the owning result for actual case counts, unavailable criteria, samples and qualification. Process wall time includes preparation and is never substituted for renderer latency. Missing scores stay unavailable.

## Meaning and reference

Use [fidelity methods and commands](fidelity/README.md), the [original-test scope](OVERVIEW.md#fidelity-and-original-tests) and [unified runner reference](unified/README.md). Supply `--mermaid-dir /checkouts/mermaid --reference-dir /evidence/mermaid-reference` when these are outside the default sibling locations. `community-fidelity` additionally requires `--community-browser-prepared FILE`, the real frozen browser manifest; it does not acquire missing tools. Its owning identity and artifact versions must match the prepared tools.

Scores count declared criteria or original callbacks, as named, with failed/unavailable/skipped outcomes. A callback is not an individual assertion; label acceptance is not paint or native-model correctness. The original core Vitest runner is separate from public-model projections and historical imported tests. Retained records preserve the original source and package pin.

## Public APIs and resources

Community: `bun commands.ts community:update --projects OWNER/TOOL --profile full --rounds 5 --records /evidence/records --out /evidence/community`, followed by `bun commands.ts results:publish --records /evidence/records --out /evidence/results`. See [community methods](METHODOLOGY.md), [entry startup](visualizations/README.md) and [pinned browser/Node baseline](visualizations/MERMAID-BASELINE.md). `community-cli` requires the completed sibling community preparation. Browser runs accept `--executable /path/to/chromium`; canonical product browser tests use their own managed engines.

`entry-startup` uses `--rounds 5 --startup-samples 5` for 25 fresh samples per interface. Invocation needs a built installed package; independent Node 22 requires `NODE22_EXECUTABLE`. Hosted transports and native executables require their actual services/artifacts. Resource probes are separate from latency; document V8 heap is not whole-browser/native/GPU memory.

Portable: `node commands.ts run --project obsidianmd/pele --artifact-root /artifacts/pele --records /evidence/records --out /evidence/portable --rounds 5 --samples 31 --cold-samples 20 --allow-partial`. See [portable setup](README.md#run-the-portable-kit-without-an-agentic-checkout). Partial or uncalibrated reports do not pass a release performance gate. Dave uses the separate [Davebench guide](docs/davebench.md), with the full docs occurrence denominator.

## Performance diagnostics

Use the common single-ID command above and [runner argument reference](unified/README.md). Built source/package artifacts are required. Release and `peers:qualify` comparisons need exact candidate/baseline tarballs and their verified SHA-256 digests, or the explicitly supported baseline lock/directory. `renderer-profile` additionally needs the verified `--bezel-dir`; it is not an optional empty placeholder. `palette-performance` requires a clean committed source checkout.

`micro`, `samples`, `pipeline`, `render-stages`, experiments and profiling retain their own workload/sample protocols and outputs. Inspect the per-input distributions and owning gates rather than comparing whole process wall times. Paired controls, qualification, cold/warm/cache-hit work and separately instrumented resource passes remain distinct. `performance-profile` is a correctness qualifier, not a speed score.

## Editor applications

Build the selected site before collecting; pass `--site /artifacts/site` and, where supported, `--executable /path/to/chromium`. Preview, session and delivery retain distinct DOM/request/interaction clocks. Ownership additionally needs `--ownership-site /artifacts/frozen-pair` containing reviewed real `original.html` and `candidate.html` plus assets; copying one page twice is not a comparison. See [editor measurement rules](MEASUREMENT.md) and [runner inputs](unified/README.md).

Modern Mermaid requires `--modern-editor-root /checkouts/modern-mermaid` and an output directory outside the source repository. Its application, themes, exports and dependency-engine probes are separate. Summarize completed evidence with `bun commands.ts source bench:modern-summary /evidence/modern/modern-editor`; the reader validates completion and writes `summary.json` and prints JSON without new clocks. Do not treat a reader exit as a second measurement.

## Correctness and output quality

Use the common single-ID command and [inventory scopes](INVENTORY.md#functionality-and-correctness-suites). Build the source/package/site required by the owning tests. Canonical browser contracts need all managed Playwright engines; the benchmark Chromium override does not replace them. Native distribution checks need the compiled executable; the independent Node 22 consumer needs `NODE22_EXECUTABLE`. Some test owners are only enrolled when their files exist in the driver checkout.

`endpoint-marker` requires `--baseline /checkouts/base --package-root /checkouts/head`, both immutable committed built checkouts; it writes geometry `metrics.json`. `output-identity` instead uses `--baseline-ref GIT_REF`; byte equality is not proof of fidelity. Geometry, styles, routing, visual heuristics and snapshot quality have their own rules and are not a weighted perceptual ranking. Owning-test pass/fail/skip counts certify only executed tests.

## Preparation and agent campaigns

`family-portfolio` builds corpus/provenance evidence; it does not time a renderer. Agent replay executes stored/scripted tasks. Live/subagent evaluations require the named provider/model, configured credentials and actual task/transcript evidence; blocked work earns neither success nor a zero token/dollar score. MCP conformance tests wire behavior. `prs` is an explicit campaign: freeze heads/artifacts and supply its real baseline/controls; it is excluded from automatic nesting. See [campaign reference](unified/README.md) and [additional external evaluations](INVENTORY.md#direct-entry-points-report-tools-and-external-evaluations). Callable judges, corpus research and report reducers listed there are not additional completed benchmark runs.

## Entry reference

The common command uses each exact ID below. Additional prerequisites are described in the linked guide and resolved by `--list`. Trident owns paths inside this repository; product tests and source corpora remain in the explicitly selected Agentic Mermaid checkout.

### Meaning and reference entries

| ID | What is scored or retained | Owner | Guide |
|---|---|---|---|
| `mermaid-fidelity` | 91 authored cases/edits, native public-model meaning, actual workflows and owned visible/quantitative SVG criteria. Per-project records, isolated observer and raw/reference-qualified ledgers; no performance clocks. | [run.ts](fidelity/run.ts) | [Run and interpret](#meaning-and-reference) |
| `community-fidelity` | Same authored universe on frozen prepared public SVG artifacts; all catalog boundaries, independent alias attribution, lossless SVG/PNG evidence, explicit missing native projections. | [community.ts](fidelity/community.ts) | [Run and interpret](#meaning-and-reference) |
| `upstream-fidelity` | Expanded original callbacks through actual peer public parser/models; private and helper-only assertions remain unavailable. Distinct from genuine Mermaid's own runner. | [upstream-fidelity.ts](unified/upstream-fidelity.ts) | [Run and interpret](#meaning-and-reference) |
| `upstream-original` | Genuine pinned Mermaid source core Vitest/Vite execution, unchanged expectations, read-only snapshots, declaration/callback accounting and actual dependency admission. | [upstream-fidelity-original.ts](unified/upstream-fidelity-original.ts) | [Run and interpret](#meaning-and-reference) |
| `stable-support` | Runtime required-family SVG/label admission, policy maturity review and separate supplements; per-project retained results. | [stable-support-run.ts](unified/stable-support-run.ts) | [Run and interpret](#meaning-and-reference) |
| `upstream-test-assertions` | Original current-pinned Mindmap/GitGraph assertions, full monorepo declaration census, separate unscored literal replay; per-project retained results. | [upstream-test-score.ts](unified/upstream-test-score.ts) | [Run and interpret](#meaning-and-reference) |
| `pinned-reference-score` | Same positive fixtures and criteria against pinned public Mermaid, plus separate portable parser timing. Reviewed diagnostics are unscored. | [reference-score.ts](unified/reference-score.ts) | [Run and interpret](#meaning-and-reference) |
| `pinned-semantic-tests` | Current-reference semantic and label assertions. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/mermaid-modern-compat/semantic.test.ts) | [Run and interpret](#meaning-and-reference) |
| `pinned-operation-tests` | Current-reference ordered native writes. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/mermaid-modern-compat/native-operations.test.ts) | [Run and interpret](#meaning-and-reference) |
| `pinned-grammar-tests` | Current-reference grammar regressions. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/mermaid-modern-compat/grammar-regressions.test.ts) | [Run and interpret](#meaning-and-reference) |
| `pinned-semantic-corpus` | Independent reference corpus, authored labels and deterministic fuzz. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/mermaid-modern-compat/run.ts) | [Run and interpret](#meaning-and-reference) |
| `pinned-grammar-corpus` | Independent current-reference grammar/native observations and deterministic fuzz. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/mermaid-modern-compat/grammar-run.ts) | [Run and interpret](#meaning-and-reference) |
| `upstream-imported` | Historical Mermaid parser/DB cases and family companions, retaining their individual pins. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/src/__tests__/agent-mermaidseqbench.test.ts) | [Run and interpret](#meaning-and-reference) |

### Public APIs and resources entries

| ID | What is scored or retained | Owner | Guide |
|---|---|---|---|
| `invocation` | Installed library entries across runtimes; browser, worker and editor paths; Node/native CLI; MCP transports. Output/functionality qualification accompanies invocation clocks. | [invocation.ts](unified/invocation.ts) | [Run and interpret](#public-apis-and-resources) |
| `entry-startup` | Manifest-derived public entries and real operations; fresh first-result latency plus separate paired memory/CPU diagnostics; per-project retained results. | [entry-startup.ts](unified/entry-startup.ts) | [Run and interpret](#public-apis-and-resources) |
| `mermaid-baseline-browser` | Pinned Mermaid browser SVG reference, five renderer rounds with A/A controls, 25 fresh startups and five separate document-heap passes; same authored cases across tools. | [baseline-browser.ts](unified/baseline-browser.ts) | [Run and interpret](#public-apis-and-resources) |
| `mermaid-baseline-compatibility` | Public parser admission, explicit required DOM host for Mermaid, 25 first-result processes and five child resource passes; existing original-assertion records retained. | [mermaid-baseline-compatibility.ts](unified/mermaid-baseline-compatibility.ts) | [Run and interpret](#public-apis-and-resources) |
| `community` | Catalog-driven API/browser comparisons, fixed core timing, broader feature qualification, shipped payloads and scoped memory diagnostics. | [community.ts](unified/community.ts) | [Run and interpret](#public-apis-and-resources) |
| `community-cli` | Matched fresh CLI latency; a separate GNU time pass measures child CPU and peak RSS. Requires prepared community artifacts. | [community-cli.ts](unified/community-cli.ts) | [Run and interpret](#public-apis-and-resources) |
| `portable-community` | Explicit project-artifact campaign with authored family/scaling/adversarial cases, scoped semantic/paint checks, repeated controls, fresh-process first-use samples and separate resource probes. Requires `--portable-project` and `--portable-artifact-root`; excluded from automatic nesting. | [run.ts](portable/run.ts) | [Run and interpret](#public-apis-and-resources) |
| `dave` | Original Dave-style browser comparison on pinned Mermaid source cases. Exact candidate-archive mode uses the release-browser runner. Acceptance and shared-success timing are separate. | [dave-bench.ts](dave-bench.ts) | [Run and interpret](docs/davebench.md) |

### Performance diagnostics entries

| ID | What is scored or retained | Owner | Guide |
|---|---|---|---|
| `samples` | Small local source-render timing sample; useful for smoke diagnosis, not broad competitive ranking. | [sample-bench.ts](sample-bench.ts) | [Run and interpret](#performance-diagnostics) |
| `micro` | Fixed small-to-large graph API microbenchmarks. | [micro-bench.ts](micro-bench.ts) | [Run and interpret](#performance-diagnostics) |
| `experiments` | Paired experimental configuration matrix, including optional broad/PNG workloads. | [experiment-matrix.ts](experiment-matrix.ts) | [Run and interpret](#performance-diagnostics) |
| `pipeline` | Instrumented stages and attribution; its clocks are not the uninstrumented community API metric. | [pipeline-audit.ts](pipeline-audit.ts) | [Run and interpret](#performance-diagnostics) |
| `peers` | Legacy warmed peer comparison or explicit first-use/new-source/repeat/label-edit tracks with consumed SVG and receipt boundaries. | [peer-bench.ts](peer-bench.ts) | [Run and interpret](#performance-diagnostics) |
| `peers:qualify` | Two A/A controls followed by candidate comparison, semantic completeness, per-case latency/allocation/scaling gates and calibration. Uses the selected target's protocol. | [qualify-peer-performance.ts](qualify-peer-performance.ts) | [Run and interpret](#performance-diagnostics) |
| `release` | Candidate versus admitted release baseline: correctness, timing, memory and distribution budgets. Dependency policy is part of the comparison. | [release-bench.ts](release-bench.ts) | [Run and interpret](#performance-diagnostics) |
| `release:browser` | Exact archived browser candidates/baselines, pinned corpus acceptance and time, delivery and scoped browser diagnostics. | [release-browser-bench.ts](release-browser-bench.ts) | [Run and interpret](#performance-diagnostics) |
| `render-stages` | Official-corpus SVG receipt stage costs. | [render-stage-bench.ts](render-stage-bench.ts) | [Run and interpret](#performance-diagnostics) |
| `renderer-profile` | Packaged/browser attribution and CPU profiles; requires the verified Bezel wrapper. | [renderer-profile.ts](renderer-profile.ts) | [Run and interpret](#performance-diagnostics) |
| `palette-performance` | Warm palette-generation timing by built-in theme/category count. Requires a clean committed checkout and retains its own recorded work scope. | [palette-performance.ts](palette-performance.ts) | [Run and interpret](#performance-diagnostics) |
| `performance-profile` | Correctness qualification of the experimental performance profile. | [qualify-performance-profile.ts](qualify-performance-profile.ts) | [Run and interpret](#performance-diagnostics) |

### Editor applications entries

| ID | What is scored or retained | Owner | Guide |
|---|---|---|---|
| `editor-preview` | Actual editor preview lifecycle and request/DOM boundaries. | [editor-preview-bench.ts](editor-preview-bench.ts) | [Run and interpret](#editor-applications) |
| `editor-session` | Cold editor sessions and subsequent interactions. | [editor-session-bench.ts](editor-session-bench.ts) | [Run and interpret](#editor-applications) |
| `editor-ownership` | Frozen original/candidate ownership pages; requires both real variants and their assets. | [editor-ownership-bench.ts](editor-ownership-bench.ts) | [Run and interpret](#editor-applications) |
| `editor-delivery` | Per-interaction requested graph, worker work, compressed delivered bytes and official-corpus editor behavior. Requires the selected built site. | [editor-delivery-bench.ts](editor-delivery-bench.ts) | [Run and interpret](#editor-applications) |
| `modern-editor` | Explicit external application/dependency-engine comparison with its own frozen resume identity; requires its separately supplied checkout. | [run.mjs](modern-editor/run.mjs) | [Run and interpret](#editor-applications) |
| `modern-summary` | Read existing completed Modern Mermaid application evidence; no renderer executions or new clocks. | [summarize.mjs](modern-editor/summarize.mjs) | [Run and interpret](#editor-applications) |

### Correctness and output quality entries

| ID | What is scored or retained | Owner | Guide |
|---|---|---|---|
| `family` | All-family source lifecycle, rendering, independently declared fixture assertions and direct operation witnesses. | [family-suite.ts](unified/family-suite.ts) | [Run and interpret](#correctness-and-output-quality) |
| `family-contracts` | Family capability and Scene/mutation contracts. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/src/__tests__/section-a-family-descriptor-conformance.test.ts) | [Run and interpret](#correctness-and-output-quality) |
| `family-functionality` | Scoped owning behavior selected by family IDs and filename conventions. This selection is not a direct operation-coverage map. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/src/__tests__/agent-analysis.test.ts) | [Run and interpret](#correctness-and-output-quality) |
| `endpoint-marker` | Endpoint marker geometry across two immutable built checkouts; geometric metrics, not a latency rank. | [endpoint-marker-compare.ts](endpoint-marker-compare.ts) | [Run and interpret](#correctness-and-output-quality) |
| `output-identity` | Cross-revision output byte identity across styles/formats; equality does not establish independent correctness. | [output-identity.ts](output-identity.ts) | [Run and interpret](#correctness-and-output-quality) |
| `browser-contracts` | Canonical managed-browser editor/security contracts. Driver-owned, including website setup. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/e2e/run-browser-contracts.ts) | [Run and interpret](#correctness-and-output-quality) |
| `distribution-cli` | CLI and offline fresh-checkout behavior. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/e2e/cli-smoke.e2e.test.ts) | [Run and interpret](#correctness-and-output-quality) |
| `distribution-native` | Compiled single-binary contracts. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/e2e/single-binary.e2e.test.ts) | [Run and interpret](#correctness-and-output-quality) |
| `distribution-dist-fuzz` | Plain-Node built artifact differential fuzzing. | [conditional selector](unified/suites.ts) | [Run and interpret](#correctness-and-output-quality) |
| `distribution-tarball` | Installed archive library, CLI, MCP and getting-started contracts. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/e2e/tarball-consumer-fuzz.e2e.test.ts) | [Run and interpret](#correctness-and-output-quality) |
| `distribution-tarball-node22` | Distinct runtime evidence; requires `NODE22_EXECUTABLE`. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/e2e/tarball-consumer-fuzz.e2e.test.ts) | [Run and interpret](#correctness-and-output-quality) |
| `browser-lazy-delivery` | Actual built module/request closures, compression and delivery budgets. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/scripts/build/browser-lazy-report.ts) | [Run and interpret](#correctness-and-output-quality) |
| `style-audit` | Public style behavior. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/src/__tests__/style-options.test.ts) | [Run and interpret](#correctness-and-output-quality) |
| `sketch-check` | Sketch behavior and own contrast criteria. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/scripts/sketch-prototype/styles.test.ts) | [Run and interpret](#correctness-and-output-quality) |
| `layout-compare` | Own-quality snapshot; comparison requires a separately admitted baseline. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/layout-compare/run.ts) | [Run and interpret](#correctness-and-output-quality) |
| `route-enumeration` | Degenerate-route structure and certificate enumeration. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/degenerate-etn/enumerate.ts) | [Run and interpret](#correctness-and-output-quality) |
| `visual-rubric` | Own layout/rendering invariants, independent of Mermaid pixel equality. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/visual-rubric/run.ts) | [Run and interpret](#correctness-and-output-quality) |
| `heuristic-tracker` | Per-fixture own layout-quality diagnostics; no baseline reset implied. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/heuristic-tracker/run.ts) | [Run and interpret](#correctness-and-output-quality) |
| `ugly-audit` | Own aesthetic/layout diagnostics. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/ugly-detector/audit.ts) | [Run and interpret](#correctness-and-output-quality) |

### Preparation and agent campaigns entries

| ID | What is scored or retained | Owner | Guide |
|---|---|---|---|
| `family-portfolio` | Builds registry-derived balanced inputs outside the checkout; preparation, not a speed result. | [portfolio.ts](unified/portfolio.ts) | [Run and interpret](#preparation-and-agent-campaigns) |
| `agent-replay` | Stored/scripted safe mutation and agent usage paths. No new model calls. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/src/__tests__/agent-usage.test.ts) | [Run and interpret](#preparation-and-agent-campaigns) |
| `agent-live` | Actual provider/model task behavior and observed token usage. Explicit model and credentials required. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/agent-usage/live.ts) | [Run and interpret](#preparation-and-agent-campaigns) |
| `agent-subagent` | External prompt dispatch and transcript evaluation. Templates alone are not a completed model evaluation. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/eval/agent-usage/capture-subagent-prompt-eval.ts) | [Run and interpret](#preparation-and-agent-campaigns) |
| `mcp-conformance` | Official pinned MCP wire conformance, independent of diagram fidelity. | [product owner](https://github.com/adewale/agentic-mermaid/blob/9d341c568d8462e1ae8aaf22b7d3b66e39673c86/scripts/ci/mcp-conformance.ts) | [Run and interpret](#preparation-and-agent-campaigns) |
| `prs` | Explicit frozen-head main/PR campaign, paired controls and optional functionality/invocation evidence. Excluded from automatic nesting to avoid repeating campaigns. | [pr-campaign.ts](unified/pr-campaign.ts) | [Run and interpret](#preparation-and-agent-campaigns) |

The conditional `distribution-dist-fuzz` owner is absent in the audited product checkout, so it is documented here but not in that checkout’s 63-entry list. `modern-summary` is currently discovered from its source launcher shortcut; it is listed for transparency, with no independent score.

Documentation provides scope and a run path for every entry. Raw historical samples and witness files are not all bundled; see the scorecards for evidence availability. New tools or changed source checkout shortcuts can change this list, so inspect `--list` before claiming a full run.
