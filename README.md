# Trident

Trident benchmarks tools that read Mermaid: SVG renderers, terminal renderers and parsers. Start with a question, choose the benchmark that answers it, and keep its failures alongside its measurements.

- [Benchmarks and their value](BENCHMARKS.md): what each workload measures, how to run it, and when to trust it.
- [Methodology](METHODOLOGY.md): corpus, correctness checks, sampling and fair comparisons.
- [Measurement rules](MEASUREMENT.md): interfaces, cache state, overfitting and claims.
- [Catalog and support](CATALOG.md): what the entries mean and which suites have bindings.
- [Verified support](SUPPORT-QUALITY.md): executed public interfaces and remaining gaps for every catalog entry.
- [Comparison contracts](FAIRNESS.md): planning, independent inputs and unranked publication.
- [Results](results/README.md): old snapshots have been removed; no current scores are claimed.

## Project lineage

![Project lineage rendered by Agentic Mermaid: Beautiful is a derivative of Mermaid.js; Mermaid Dart is a distinct Dart port; Agentic and Zombie fork Beautiful; Pele has Ondine and Bezel ports; Frankenmermaid has an independent root.](docs/images/lineage.svg)

Selected renderer lineages. Beautiful Mermaid is a derivative of Mermaid, not a
Git fork; its ASCII component separately ports Mermaid ASCII. Mermaid Dart is a
distinctive brand and remains eligible. Agentic Mermaid rendered this overview
with its publication-figure look and Nord Light palette. Appearance implies no
benchmark rank. See the [complete 88-entity tree](LINEAGE.md), [source](docs/lineage-overview.mmd)
and [generation receipt](docs/images/lineage.json).

## Install 0.1

Use the `v0.1.0` GitHub source release with Bun 1.4+ and Node 24+, or download
its portable Node kit. The repository package is private; no npm publication is
required. The portable kit ships its runtime files and manifest, while target
artifacts and the pinned Mermaid oracle are installed separately.

```sh
node commands.ts --version
```

See [release notes](CHANGELOG.md) and the [release procedure](RELEASE.md) for
validation scope, artifact checksums and known limits.

## Benchmark a project

Install Bun 1.4+, Node 24+, npm and the package dependencies. The oracle is pinned Mermaid 12.2.0, its parser and first-party ZenUML addon. Browser measurements require Chromium; compiled projects also need their declared toolchains.

```sh
bun install --frozen-lockfile
node commands.ts mermaid:install
bunx playwright install chromium
bun commands.ts community:update --projects obsidianmd/pele,mermaid-js/mermaid \
  --profile full --rounds 5 --records /evidence/records --out /evidence/run
bun commands.ts results:publish --records /evidence/records --out /evidence/report
```

Inspect `bun commands.ts support` and `bun commands.ts bench --projects OWNER/TOOL --plan` before collecting. Execution requires a project selection or explicit `--all-projects`. Choose any project in [the catalog](catalog/mermaid-community.json). Use `--executable /path/to/chromium` for an existing browser. Exact matching records are reused with their original dates; `--force` collects a new attempt. `community:update --plan` prepares artifacts and reports reuse decisions without timing; `bench --plan` performs no acquisition or rendering. Measurements are local and reject CI.

Every tool uses its catalog release. To measure an unreleased npm package, select one project and add `--candidate-dir /path/to/built/package`, or `--candidate-tarball FILE --candidate-sha256 HEX`. Source-built projects accept `--candidate-revision COMMIT [--candidate-remote URL_OR_CLONE]`. Candidates stay separate from release rows:

```sh
bun commands.ts community:update --projects OWNER/TOOL --candidate-dir /artifacts/package \
  --profile full --rounds 5 --records /evidence/records --out /evidence/candidate
bun commands.ts results:compare --records /evidence/records --project OWNER/TOOL
```

A checkout, environment variable or local `dist/` never silently replaces a community release. Agentic Mermaid uses these same rules.

## Add a tool

Declare the project and its public bindings in `catalog/mermaid-community.json`. An npm SVG renderer can use the generic adapter:

```json
{
  "id": "owner/tool",
  "roles": ["renderer"],
  "outputs": ["svg"],
  "benchmark": {
    "adapter": "declared",
    "package": "tool-package",
    "version": "1.2.3",
    "outputs": ["svg"],
    "api": { "svg": { "export": "render", "result": "svg" } }
  }
}
```

A reviewed `benchmark.portable` binding can additionally name a public factory
and disposal method; registered package pipelines reuse the community binding
inside the portable Node worker. See [comparison contracts](FAIRNESS.md).

Bindings accept dotted public export paths, an optional JSON `options` argument and an optional returned field. Promises are awaited. Other outputs, source builds, WASM and native tools use their declared adapters. An installed Node CLI can additionally declare `benchmark.cli`: its npm `bin` name, arguments with `{format}`, and outputs. No project gets an implicit local native executable.

## Run the portable kit

The authored family/scaling campaign accepts a built artifact without that project's source checkout:

```sh
node commands.ts build --out /artifacts/trident-kit
node /artifacts/trident-kit/run.mjs --project obsidianmd/pele \
  --artifact-root /artifacts/pele --out /evidence/portable --records /evidence/records \
  --rounds 5 --samples 31 --cold-samples 20 --allow-partial
```

Copy the whole generated directory, including its manifest. It requires Node 24, the actual renderer artifact and the pinned oracle install; no Bun, Git or Trident `node_modules` is needed at runtime. Set `MERMAID_REFERENCE_DIR` for a nondefault install. `--allow-partial` permits incomplete diagnostics to produce a report; it does not turn them into a calibrated pass. See [portable methods](BENCHMARKS.md) and [comparison contracts](FAIRNESS.md).

## Development and ownership

`bun commands.ts test`, `typecheck` and `lint` check all of Trident. Tests need
the pinned oracle. Optional browser tests use `AM_BROWSER_TESTS=1` and
`AM_CHROMIUM_EXECUTABLE=/path/to/chromium` (legacy environment variable names).

Use `bun commands.ts bench --projects OWNER/TOOL,... --profile full --rounds 5
--out /evidence/full` for all applicable public-artifact suites. `bench --list`
lists suites and selected projects without collecting measurements. Adapter gaps,
setup failures and unsupported surfaces stay visible in the campaign report.

Product source tests, editor experiments, AM release budgets, private operation
witnesses and the AM build/pack Dave wrapper live in
[Agentic Mermaid](https://github.com/adewale/agentic-mermaid/tree/main/eval/benchmark).
Trident has no AM source launcher, workspace assembler or implicit local candidate.
AM uses a pinned Trident library for shared observers and measurement utilities.

Trident originated in Agentic Mermaid; its maintainer maintains both. The
[frozen corpus](corpus/community-corpus.json) records that origin and imported
Mermaid inputs. This public development material is not an independent holdout.
