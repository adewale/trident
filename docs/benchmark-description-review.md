# Benchmark descriptions: before and after

The README should describe the task and its results before explaining measurement mechanics. Limits stay in the benchmark guide and beside the example where they change its meaning.

Descriptions name the work; result columns name the measurements. The examples now use [comparative tables](benchmark-examples.md), with research and rationale in [reporting research](reporting-research.md).

## Mermaid Compatibility

**Before**

> Which frozen examples produce SVG, terminal text, PNG or a parser result? Use it to find unsupported syntax, broken interfaces and output failures. Format and label checks do not prove a faithful drawing.

**After**

> Tests shared Mermaid inputs through each project's SVG, PNG, terminal and parser interfaces.

**Result columns:** Passed, failed, unsupported and blocked inputs, by format and diagram type.

**Reason:** The description identifies the shared task; result columns carry the outcomes and keep formats separate.

**Example:** see the [Mermaid Compatibility table](benchmark-examples.md#mermaid-compatibility).

## DaveBench: Documentation Examples

**Before**

> Which examples in the pinned Mermaid syntax documentation return SVG? Reports coverage and public render-call time on each pair's common successful examples. Use it for a broad documentation workload; returning SVG does not prove correct paint.

**After**

> Tests SVG generation for diagrams in Mermaid's own documentation, inspired by [Dave Kiss's benchmark](https://x.com/davekiss/status/2111512440106078554).

**Result columns:** SVG return rate (%); render time (ms) on matched inputs.

**Reason:** Credit stays beside the task. Coverage and matched-input time get separate columns rather than an implied overall performance score.

**Example:** see the [DaveBench: Documentation Examples table](benchmark-examples.md#davebench-documentation-examples).

## Diagram Meaning

**Before**

> Does the actual SVG preserve authored relationships, labels, values and visible geometry? Use it to find wrong or missing drawn meaning. It covers declared criteria, not every aesthetic or accessibility concern.

**After**

> Checks rendered SVGs against expected labels, relationships, values and visible geometry.

**Result columns:** Passed, failed and blocked checks, by diagram type.

**Reason:** The description names the diagram content being checked. The table counts criteria rather than pretending they are whole diagrams.

**Example:** see the [Diagram Meaning table](benchmark-examples.md#diagram-meaning).

## Model and Editing Contracts

**Before**

> Do reviewed public model APIs preserve identities, relationships and edit/configuration behavior? Use it for deeper diagnostics where a model projection exists. A missing projection is a Trident support gap, not evidence of a bad renderer.

**After**

> Tests how public diagram models preserve identities and relationships through parsing, edits and configuration changes.

**Result columns:** Shared checks passed, failed, unsupported or blocked; API-specific checks separately.

**Reason:** Shared checks and additional API contracts must be separate, so richer optional APIs confer no comparison bonus.

**Example:** see the [Model and Editing Contracts table](benchmark-examples.md#model-and-editing-contracts).

## Mermaid Assertion Replay

**Before**

> Which original Mermaid test assertions work through another project's public model/parser API? Use it to examine compatibility. Private API and diagnostic-wording differences can fail without proving a wrong drawing.

**After**

> Replays Mermaid's original tests through public parser and model APIs.

**Result columns:** Declarations and callbacks passed, failed or unavailable; excluded tests.

**Reason:** The task remains original-test replay, while tables distinguish source declarations, expanded callbacks and unavailable work. Raw matcher counters are diagnostic, not a headline percentage.

**Example:** see the [Mermaid Assertion Replay table](benchmark-examples.md#mermaid-assertion-replay).

## Mermaid Reference Tests

**Before**

> Does pinned Mermaid pass its own original core test runner? Use it to validate the reference environment. It runs Mermaid's tests against Mermaid, so it is not a peer-project score.

**After**

> Runs Mermaid's own core tests to validate the reference environment.

**Result columns:** Passed, failed, pending and todo callbacks; files executed.

**Reason:** The reference-only purpose is explicit. Its table shows original callbacks and files rather than borrowing peer compatibility scores.

**Example:** see the [Mermaid Reference Tests table](benchmark-examples.md#mermaid-reference-tests).

## Render Cost and Scaling

**Before**

> What do fresh calls, repeated calls, edits and larger diagrams cost through a public Node SVG API? Reports latency, CPU and memory separately, with output checks and A/A noise controls. Use it for controlled regressions; it is not a production-traffic forecast.

**After**

> Measures SVG rendering through public Node APIs across first calls, repeated calls, edits and diagram sizes.

**Result columns:** Latency (ms), CPU (ms), memory (MiB) and comparison qualification.

**Reason:** Name the public API work in the description and put units, call modes and qualification into the table headers and cells.

**Example:** see the [Render Cost and Scaling table](benchmark-examples.md#render-cost-and-scaling).
