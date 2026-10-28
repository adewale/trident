# Methodology

[Choose a benchmark](BENCHMARKS.md) · [Measurement rules](MEASUREMENT.md)

Trident reports capability, correctness, time, memory and delivered bytes separately. It does not produce an overall “best renderer” score. A useful result names its workload, public interface, configuration, artifact, machine, date and failures.

## Equal treatment

Projects come from `catalog/mermaid-community.json`. Each community row uses the actual catalog release, acquired and pinned before timing. Every project's unreleased npm package uses the same candidate tarball/directory options; source candidates use the project's reviewed build recipe. A source checkout or `--package-root` cannot silently substitute a local Agentic Mermaid build. An npm CLI requires an explicit catalog binding; local compiled executables are not automatically added for one project.

Project adapters translate different public APIs; they do not justify doing less work. Compare SVG-return calls with SVG-return calls, parser results with parser results, and whole CLI processes with whole CLI processes. Return shapes, host setup, native/WASM loading and optional plugins matter. The pinned Mermaid oracle has a distinct reference role, not a free pass on its own output checks.

Product source, editor and release-policy experiments live in their owning project. Trident accepts explicit public artifacts and reviewed adapter capabilities; it never creates an Agentic source workspace or infers a local candidate.

## Oracle and inputs

The reference is Mermaid **12.2.0**, `@mermaid-js/parser` **2.0.1**, `jsdom` **26.1.0**, and the first-party ZenUML addon **1.0.1**, from `tool-versions.json`. Install with `node commands.ts mermaid:install`. The install is independent of any product checkout or product compatibility policy.

The community corpus is frozen in `corpus/community-corpus.json`: six fixed timing inputs plus a wider feature portfolio, including examples from Mermaid's syntax pages. Its source commit and provenance remain visible. It came from Agentic Mermaid testing and is biased toward those inputs. The six timing cases cover too little to support a general speed claim. Public docs and tests are external inputs but, once used in development, are not holdouts.

Some imported fixtures are parser-only, oracle-rejected, or lack usable authored-label expectations. These gaps remain in the record. Do not reinterpret a parser fixture's rendering failure as a faithful-rendering defect. Unsupported families remain coverage gaps instead of free successful renders.

## What community admission checks

SVG admission checks its namespace, XML syntax, positive finite canvas and expected text in admitted text containers. HTML-serialized void elements inside `foreignObject` may be closed for inspection; the XML portability exception remains recorded. Attributes, metadata, hidden definition containers and a visible source-code echo cannot substitute for drawn labels. This is text/format admission, not full visibility or correspondence proof.

Literal labels keep their punctuation. Only a fixture or the pinned oracle's label type may declare Markdown. In those declared labels, supported emphasis delimiters may be displayed as formatting; in a pie label such as `__proto__`, the underscores are required. The qualifier never guesses the label type from punctuation. Node and browser inspectors use the same rule. Whitespace/wrapped-row matching preserves word boundaries and does not join unrelated drawing objects. A qualifier change invalidates record reuse; old scores must not be relabelled as current.

Terminal admission checks actual text and source echoes with its own output boundary. PNG admission checks the signature, leading IHDR and nonempty dimensions; it does not verify painted text or diagram meaning. Parser admission/semantic checks have different return contracts. Authored native-model and painted-output fidelity are separate, stronger benchmarks with explicitly unavailable criteria.

## Timing and resources

Preparation, acquisition, oracle expectations and qualification happen outside public API clocks. Consume the requested result before stopping its clock. Separate fresh use, imports/initialization, new-source calls and repeated-source/cache-hit work. Identical-input repetition is a cache workload, not proof of fast uncached layout. A timeout, crash, unsupported source or failed correctness check cannot become a cheap successful render.

The community fixed-core cost sums per-input medians on the complete six-input cohort. Conditional family admission rates use each tool's supported cases, so differing denominators are not a paired fidelity comparison. Reports retain blocked, unsupported and unavailable counts. Any ordinal display order is an admission ordering, not an overall quality or performance winner.

Portable comparisons use balanced family, scaling, interacting-feature and invalid-input cohorts, paired controls and explicit calibration. Five rounds alone do not establish a small improvement. Too few fresh observations cannot establish tail latency. Whole-child RSS/CPU, document V8 heap, retained output and delivered bytes have different scopes; native, worker, WASM and GPU memory may be missing. Zero observed CPU at coarse resolution is censored, not free work. Dollar cost requires actual usage or a declared rate.

## Publication

Keep raw samples, failed outputs, package/dependency identities, protocol, input provenance and original dates. Reuse exact matching records without inventing fresh dates. New artifact, workload, qualifier, runtime or sampling settings require new evidence. Cross-machine records are separate cohorts. A completed collection can contain failures or uncalibrated timings.

Old checked-in snapshots have been removed. Generate reports outside the source tree. Publish a claim only after checking the work at the public boundary, reviewing failure classifications and inspecting representative outputs. The [measurement rules](MEASUREMENT.md) explain why honest scope matters more than a league-table win.

## External cohorts and observation scopes

[Comparison contracts](FAIRNESS.md) define the external repository-example selection policy, retained provenance and limitations. The AM-derived corpus remains a named legacy regression input. Optional model APIs and output admission are separate dimensions; neither is a substitute for painted correspondence. Published scorecards are alphabetical within compatible groups and retain all actual dispositions.
