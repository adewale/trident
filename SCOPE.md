# Trident scope

Trident compares Mermaid implementations through their public interfaces. Its
core work is acquiring identified artifacts, invoking those interfaces, checking
declared output, measuring comparable work and publishing readable evidence.

## Current priority

All three benchmarks are implemented and collected. The work now is:

1. Freeze the three benchmark definitions (DaveBench, Drawing Correctness and
   Mermaid Fidelity) for one release cycle, under the rule below.
2. Close assessment gaps: unassessed Drawing observations, Fidelity callbacks
   without an operation binding or model translation, and adapter gaps. The
   [methods and coverage details](docs/benchmark-results-details.md#why-coverage-is-incomplete)
   list them.
3. Keep diagnostics (`drawing:structure`, `layout:observe`, `fidelity:coverage`)
   separate from the ranked benchmarks. A diagnostic never changes a score, a rank
   or the synthesis, and it does not become a benchmark without a definition
   change made under the rule below.

Keep development runs small and affected checks focused; run the full workload
after the changed path works. Freeze versions once per campaign, record blockers,
and continue with available projects. Historical evidence stays available without
being regenerated for every change.

## Benchmark definitions change only at a release boundary

A benchmark definition is its corpus or input population, its admission rules,
its scored population and its scoring formula. These change only at a release
boundary. Each change is listed in [CHANGELOG.md](CHANGELOG.md) under the release
that makes it, with its measured effect on the published results (which counts and
ranks moved, and by how much). Results collected under different definitions are
not compared, in tables or prose, without saying that the definitions differ and
how. Observer fixes that correct a wrong verdict under an unchanged definition,
adapter bindings and model translations are not definition changes; they are
recorded in the changelog when they change a published result.

## Core work

- Public SVG, PNG and terminal rendering (DaveBench); visible labels on a shared
  corpus (Drawing Correctness); parser-model fidelity under original Mermaid test
  assertions (Mermaid Fidelity).
- Independent inputs, output-meaning checks and invalid controls.
- Explicit artifact, version, runtime and workload identities.
- Bounded campaigns, named case selection and honest missing/blocked outcomes.
- Per-benchmark ranked tables, reproducible reductions and retained failures.

Each benchmark applies only where its interface and observation contract fit.
Mermaid Fidelity applies only to a project with a public parse interface: an
exported parser, a public CLI command or the parser of a public dependency.
Grok's renderer component, MermaidText and Loom's renderer component expose their
parsers only through private or unexported code, so the catalog declares their
Fidelity not applicable (`benchmark.notApplicable.fidelity`, with the reason).
They are not run, are shown as n/a, and are left out of the Fidelity ranking and
out of the synthesis's Fidelity component, as Mermaid Flutter is left out of
Drawing Correctness. The same rule limits a bridge to a project's public parsers:
Mermaid Dart's bridge calls only the parsers `mermaid_core` exports from its public
library.

Every catalog entry does not need every benchmark, format or optional model API.
Neither a passing invocation nor an entire ecosystem campaign can substitute for
missing correctness proof.

## Outside core requirements

Whole-editor journeys, VS Code extension hosts, webviews, clipboard/share flows,
PWA behavior and editor persistence are application testing. VS Code Mermaid
Editor, Mermaid Live Editor and Modern Mermaid remain discovery entries; they
are excluded from core comparison and are not missing benchmark adapters. The
descendant investigation override cannot enable these application workflows.
An embedded Mermaid dependency does not supply an editor score.

Validator, parser, formatter and conversion-only projects stay outside renderer
campaigns. The catalogue retains their discovery and lineage records. Explicit
catalogue-only selections also remain excluded, even when a renderer is present;
the descendant override cannot enable either class.

Mermaid Flutter's native PNG API remains in scope. Complete widget or browser
interaction campaigns are separate experiments rather than renderer prerequisites.

Trident does not implement missing features in benchmarked products or require
an exporter that the selected package does not expose. A broken published package
is a recorded artifact blocker. Source candidates stay separately identified;
they cannot stand in for the broken release or block releasing the harness.

Agentic-specific PR matrices, source-workspace checks and strict internal-backend
experiments belong in Agentic Mermaid. Generic runner fixes and public-artifact
comparisons belong in Trident under the same rules for every project.

Product-specific editing and serializer contracts belong to their owning projects.
Shared API binding checks remain unscored harness controls. The exact Mermaid
API compatibility diagnostic is optional; its callbacks are not renderer quality.

## Optional maintenance

GitHub Pages and registry version alerts are backlog improvements. The repository
already publishes readable results. Neither feature is a release prerequisite;
neither should grow a second reporting system or automatically change measured
versions. CI may check or publish retained data, without acquiring benchmarked
projects or collecting benchmark timings.

[Benchmark methods](docs/benchmark-results-details.md) · [Catalog policy](CATALOG.md)
