# Trident scope

Trident compares Mermaid implementations through their public interfaces. Its
core work is acquiring identified artifacts, invoking those interfaces, checking
declared output, measuring comparable work and publishing readable evidence.

## Core work

- Public SVG, PNG, terminal, parser, formatting and conversion APIs or CLIs.
- Independent inputs, applicable meaning/model checks and invalid controls.
- Explicit artifact, version, runtime, workload and measurement identities.
- Bounded campaigns, named case selection and honest missing/blocked outcomes.
- Per-benchmark ranked tables, reproducible reductions and retained failures.
- Harness checks and packaging for the particular source revision being released.

Each benchmark applies only where its interface and observation contract fit.
Every catalog entry does not need every benchmark, format or optional model API.
The first public 0.1 release requires [B0](BASELINE.md), covering every normally
selected brand and applicable benchmark with explicit gaps and qualification.
Later releases assess whether retained baseline evidence remains compatible or
needs new measurements or a bridge run; they do not automatically repeat the
entire ecosystem campaign. Claimed timing comparisons require their stated checks.

## Outside core requirements

Whole-editor journeys, VS Code extension hosts, webviews, clipboard/share flows,
PWA behavior and editor persistence are application testing. VS Code Mermaid
Editor, Mermaid Live Editor and Modern Mermaid remain discovery entries; they
are excluded from core comparison and are not missing benchmark adapters. The
descendant investigation override cannot enable these application workflows.
An embedded Mermaid dependency does not supply an editor score.

APIs actually exposed by an artifact stay in scope. This includes Mermaid Flutter's
native PNG API and Mermaid-to-Excalidraw's conversion API. A complete Flutter
widget or browser interaction campaign is a separately scoped experiment, rather
than a prerequisite for supporting the public output operation.

Trident does not implement missing features in benchmarked products or require
an exporter that the selected package does not expose. A broken published package
is a recorded artifact blocker. Source candidates stay separately identified;
they cannot stand in for the broken release or block releasing the harness.

Agentic-specific PR matrices, source-workspace checks and strict internal-backend
experiments belong in Agentic Mermaid. Generic runner fixes and public-artifact
comparisons belong in Trident under the same rules for every project.

## Optional maintenance

GitHub Pages and registry version alerts are backlog improvements. The repository
already publishes readable results. Neither feature is a release prerequisite;
neither should grow a second reporting system or automatically change measured
versions. CI may check or publish retained data, without acquiring benchmarked
projects or collecting benchmark timings.

[Benchmark methods](BENCHMARKS.md) · [Catalog policy](CATALOG.md) ·
[Release checks](RELEASE.md)
