# Benchmark descriptions: before and after

The README should describe the task and its results before explaining measurement mechanics. Limits stay in the benchmark guide and beside the example where they change its meaning.

## Mermaid Compatibility

**Before**

> Which frozen examples produce SVG, terminal text, PNG or a parser result? Use it to find unsupported syntax, broken interfaces and output failures. Format and label checks do not prove a faithful drawing.

**After**

> Runs the same Mermaid examples through each project's supported outputs, including SVG, PNG and terminal diagrams. Reports successful examples, failures and unsupported features.

**Reason:** Names the shared input and output formats before explaining the reported outcomes.

**Recorded example:** Pele 1.9.0: in the 28 October community smoke campaign, **32/33 feature inputs passed and one was unsupported**, separately in Node SVG and browser SVG. All six core inputs passed on each surface. This is a selected smoke workload, not the entire frozen corpus or a semantic-fidelity score.

## DaveBench: Documentation Examples

**Before**

> Which examples in the pinned Mermaid syntax documentation return SVG? Reports coverage and public render-call time on each pair's common successful examples. Use it for a broad documentation workload; returning SVG does not prove correct paint.

**After**

> Inspired by [Dave Kiss's benchmark](https://x.com/davekiss/status/2111512440106078554), DaveBench tests whether an implementation can generate SVGs for the diagrams in Mermaid's own documentation. It reports rendering success rate and render time.

**Reason:** Credits the source, describes the task in one sentence and names the two results. Detailed matching and paint limits belong in the methods.

**Recorded example:** Pele 1.9.0 returned SVG for **532/548 documentation occurrences (97.1%)** and failed 16 in each of five rounds. The first flowchart example (`flowchart.md:23`) took a median **0.60 ms** across five browser calls after warmup. This historical 27 October run reports SVG return and call time; it does not establish correct paint or a calibrated speed comparison.

## Diagram Meaning

**Before**

> Does the actual SVG preserve authored relationships, labels, values and visible geometry? Use it to find wrong or missing drawn meaning. It covers declared criteria, not every aesthetic or accessibility concern.

**After**

> Checks whether rendered diagrams preserve their intended meaning: the right labels, relationships, values and visible marks. Reports incorrect or missing content by diagram type.

**Reason:** Explains meaning with concrete labels and relationships instead of observer terminology.

**Recorded example:** Pele 1.9.0 failed the controlled-image case: its SVG omitted the independently required embedded image. The historical 27 October run also recorded four architecture relationship failures; those are observations under that run's observer, not a claim that the current observer reproduces every finding.

## Model and Editing Contracts

**Before**

> Do reviewed public model APIs preserve identities, relationships and edit/configuration behavior? Use it for deeper diagnostics where a model projection exists. A missing projection is a Trident support gap, not evidence of a bad renderer.

**After**

> Tests an implementation's public diagram model and editing API. Checks that parsing and edits preserve the expected identities, relationships and configuration.

**Reason:** Says what is tested and what must survive an edit; API eligibility and missing projections remain in the guide.

**Recorded example:** Pele 1.9.0: **555 structured-model criteria passed; 6 were unsupported** in the 27 October campaign. Flowchart identities, relationships and configuration-reset criteria passed. These are individual model criteria, not 561 diagrams or a complete editing-API certificate.

## Mermaid Assertion Replay

**Before**

> Which original Mermaid test assertions work through another project's public model/parser API? Use it to examine compatibility. Private API and diagnostic-wording differences can fail without proving a wrong drawing.

**After**

> Runs Mermaid's original test assertions through another implementation's public parser or model API. Reports which assertions pass, fail or cannot run through that API.

**Reason:** Makes the original assertions and the public-API boundary explicit, including tests that cannot run.

**Recorded example:** Pele 1.9.0: **4,908/5,113 executed assertions passed** in the 27 October replay. Expanded callbacks were **1,452 passed, 16 failed, 1,220 unavailable and 12 skipped**. Assertions and callbacks have different denominators; unavailable tests cannot be silently dropped from the report.

## Mermaid Reference Tests

**Before**

> Does pinned Mermaid pass its own original core test runner? Use it to validate the reference environment. It runs Mermaid's tests against Mermaid, so it is not a peer-project score.

**After**

> Runs Mermaid's own core tests against the pinned Mermaid source. Checks that Trident's reference test environment works before its results are used in comparisons.

**Reason:** Explains why a reference-only run exists and avoids presenting it as a peer-project score.

**Recorded example:** Mermaid 12.2.0: **6,677 callbacks passed, zero failed, 16 pending and two todo**, across **331 files**, on 28 October. The sealed npm environment completed the genuine original core runner. Docs-site and browser/e2e tests were outside this run.

## Render Cost and Scaling

**Before**

> What do fresh calls, repeated calls, edits and larger diagrams cost through a public Node SVG API? Reports latency, CPU and memory separately, with output checks and A/A noise controls. Use it for controlled regressions; it is not a production-traffic forecast.

**After**

> Measures render time, CPU and memory through public Node SVG APIs. Tests first calls, repeated calls, edits and larger diagrams, with repeat runs to estimate measurement noise.

**Reason:** Names the resources and workloads directly; explains A/A controls as repeat runs that estimate noise.

**Recorded example:** Pele 1.9.0, authored flowchart: historical median **17.06 ms** for a first API call in a fresh process (import excluded), versus **0.350 ms** for repeated calls. The 27 October protocol-v3 report was **uncalibrated overall**. These numbers illustrate separate workloads; they are not current protocol-v6 scores or evidence of an improvement.
