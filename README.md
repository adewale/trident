# Trident

Trident benchmarks tools that read Mermaid: SVG renderers, terminal renderers and parsers. Start with a question, choose the benchmark that answers it, and keep its failures alongside its measurements.

- [Benchmarks and their value](BENCHMARKS.md): what each workload measures, how to run it, and when to trust it.
- [Methodology](METHODOLOGY.md): corpus, correctness checks, sampling and fair comparisons.
- [Measurement rules](MEASUREMENT.md): interfaces, cache state, overfitting and claims.
- [Results](results/README.md): old snapshots have been removed; no current scores are claimed.

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

Choose any project in [the catalog](catalog/mermaid-community.json). Use `--executable /path/to/chromium` for an existing browser. Exact matching records are reused with their original dates; `--force` collects a new attempt. `--plan` performs preparation and reports reuse decisions without timing. Measurements are local and reject CI.

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

Bindings accept dotted public export paths, an optional JSON `options` argument and an optional returned field. Promises are awaited. Other outputs, source builds, WASM and native tools use their declared adapters. An installed Node CLI can additionally declare `benchmark.cli`: its npm `bin` name, arguments with `{format}`, and outputs. No project gets an implicit local native executable.

## Run the portable kit

The authored family/scaling campaign accepts a built artifact without that project's source checkout:

```sh
node commands.ts build --out /artifacts/trident-kit
node /artifacts/trident-kit/run.mjs --project obsidianmd/pele \
  --artifact-root /artifacts/pele --out /evidence/portable --records /evidence/records \
  --rounds 5 --samples 31 --cold-samples 20 --allow-partial
```

Copy the whole generated directory, including its manifest. It requires Node 24, the actual renderer artifact and the pinned oracle install; no Bun, Git or Trident `node_modules` is needed at runtime. Set `MERMAID_REFERENCE_DIR` for a nondefault install. `--allow-partial` permits incomplete diagnostics to produce a report; it does not turn them into a calibrated pass. See [portable methods](BENCHMARKS.md#portable-family-and-scaling).

## Qualification and comparison

Render inputs, parser-only fixtures and invalid/diagnostic sources retain their declared intent and actual pinned-Mermaid admission. Failed, blocked, unsupported and unavailable outcomes remain visible. PNG admission decodes the complete bounded image and checks nonblank pixels; readable labels and preserved relationships require separate authored meaning and owned-paint evidence.

Compare the same public operation, requested result and runtime cohort. Fresh import/readiness, first consumed result, repeated-source work, process resources and delivered bytes are different measurements. A new export such as `renderResolvedScene` needs an actual installed-entry observation that consumes both its SVG and structured sidecar; finding its name in a package is insufficient. Source-adapter invocation/startup experiments keep their project-specific scope.

## Development and source adapters

`bun commands.ts test`, `typecheck` and `lint` always check standalone Trident. Tests need the pinned oracle. To exercise optional real-browser tests, set `AM_BROWSER_TESTS=1` and, if needed, `AM_CHROMIUM_EXECUTABLE=/path/to/chromium`.

The original pinned Mermaid runner has independent preparation:

```sh
bun commands.ts upstream:prepare --source /sources/mermaid --runtime /evidence/upstream-runtime --reference /evidence/mermaid-reference
```

Use a clean pinned Mermaid checkout and a dedicated runtime directory. Preparation installs declared dependencies and builds generated upstream pieces before measurements. It refuses to replace an existing different runtime; keep dependency changes in a fresh preparation and cohort.

Some inherited diagnostics still import Agentic Mermaid source or exercise its product/editor contracts. They are isolated behind [the explicit source adapter](adapters/agentic/README.md); `bun commands.ts adapter --help` lists adapters. They are not prerequisites for community benchmarks and their scores cannot be credited to other projects. Legacy product launcher commands remain compatibility aliases, outside the public help.

Trident originated in Agentic Mermaid and its maintainer also maintains that renderer. The [frozen corpus](corpus/community-corpus.json) retains that origin and many imported Mermaid tests. It is public, development-exposed material, not an independent or secret holdout. There are still source-coupled legacy modules; this separation makes their limits explicit rather than claiming that all inherited workloads are neutral.
