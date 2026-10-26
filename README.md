# Trident

Trident benchmarks tools that read Mermaid's diagram language: SVG renderers, terminal
renderers and parsers. It is for the maintainers of those tools, who need failures they
can act on, and for people choosing one, who need to know what each tool draws
correctly and how fast.

- **[League table](results/README.md)**: what each tool supports, how often it is
  right, and calibrated speed, from published records.
- **[Methodology](METHODOLOGY.md)**: the pinned Mermaid oracle, the corpus, family
  support, statuses, ordering, calibration, the reference machine and a disclosure.

Trident was extracted from Agentic Mermaid's `eval/benchmark` directory
([adewale/agentic-mermaid#492](https://github.com/adewale/agentic-mermaid/pull/492)).
Agentic Mermaid is measured here as an ordinary row; its own source-level lanes are an
[optional adapter](#optional-agentic-source-adapter). Measurements never run in CI.

## Benchmark community projects

Install the dependencies (`bun install`) and the pinned Mermaid oracle, then measure
any project in [the catalog](catalog/mermaid-community.json) and publish the table:

```sh
node commands.ts mermaid:install
bun commands.ts community:update --projects obsidianmd/pele,mermaid-js/mermaid \
  --profile full --rounds 5 --records /evidence/records --out /evidence/community
bun commands.ts results:publish --records /evidence/records --out results
```

Each project gets one record. An unchanged project, input and protocol reuses its
record, so updating one tool re-measures only that tool; `--force` re-measures. The
corpus is [`corpus/community-corpus.json`](corpus/community-corpus.json), frozen from
Agentic Mermaid with its commit; `bun commands.ts corpus:import` refreshes it from an
Agentic checkout (`TRIDENT_AGENTIC_ROOT`). Tools built from source need their
toolchains (Go, Rust, Python), and browser lanes use Playwright's Chromium.

`results:publish` writes [`results/`](results/README.md): the league table, a
per-family grid, one compact record per project with no machine paths, and a failure
page per project showing each failing input, what the oracle expects and the tool's
actual output.

## Adding a tool

A tool is one entry in [`catalog/mermaid-community.json`](catalog/mermaid-community.json).
If it is an npm package whose public API renders a Mermaid source string, declare its
exports; no harness code is needed:

```json
{
  "id": "owner/tool",
  "roles": ["renderer"],
  "outputs": ["svg", "terminal"],
  "benchmark": {
    "adapter": "declared",
    "package": "tool-package",
    "version": "1.2.3",
    "outputs": ["svg", "terminal"],
    "api": {
      "svg": { "export": "render", "result": "svg" },
      "terminal": { "export": "default.toText", "options": { "unicode": true } }
    }
  }
}
```

For each output, `export` is the dotted path to a function called with the source,
`options` is an optional JSON second argument, and `result` names the returned field
that holds the output, when the function does not return it directly. Promises are
awaited. A declared output without a binding is refused before anything is installed.
The SVG binding also runs in a browser, from a bundle of the published package. CLIs,
WASM builds and tools that need a build step use the existing adapters in
`unified/community*.ts`; open an issue if yours fits none of them.

## Benchmarking an unreleased version

Agentic Mermaid's lanes take a local candidate (`--package-root`, `--candidate-tarball`).
For other projects see [Candidates](METHODOLOGY.md#candidates).

## Run the portable kit without an Agentic checkout

Install this package's declared dependencies. Build and report commands accept
Node 24 or Bun 1.4 or later. Relative output paths resolve in this package:

```sh
node commands.ts --help
node commands.ts build
node commands.ts run --project obsidianmd/pele --artifact-root /installed/pele \
  --node /path/to/node24 --out /evidence/pele --records /evidence/records
node commands.ts build --out /tmp/trident-kit
```

Copy the complete generated kit, including its artifact manifest. It runs with
plain Node 24, the explicitly supplied tool artifact and the pinned Mermaid oracle,
without Bun, Git, an Agentic checkout or a harness dependency installation:

```sh
node /tmp/trident-kit/run.mjs --help
node /tmp/trident-kit/run.mjs --project obsidianmd/pele \
  --artifact-root /installed/pele --out /evidence/pele --records /evidence/records
```

The `run` entry requires the compiled kit in `portable/dist`; missing artifacts
produce a build-first error. `NODE_BIN` selects its Node executable. This keeps
storage/report changes separate from the worker/execution byte identity.

The `run` entry measures the portable public SVG protocol. Its supported adapters,
authored expectations, sampling, memory boundaries and calibration limits remain
explicit in each report. It does not claim to execute every source diagnostic.
`portable:build` remains an alias for `build`. `portable` retains the legacy
source-mode runner, whose identity requires committed source.

Whole-worker CPU and peak RSS need GNU time. By default Trident uses
`/usr/bin/time` when it is GNU time, otherwise `gtime` on `PATH`: macOS ships BSD
time, so install `gnu-time`. `--observer` names another GNU time. Without one these
values are recorded as unavailable, not zero.

## The Mermaid oracle

Every benchmark run, and `test`, consults one pinned Mermaid: `mermaid` 12.2.0 with
`@mermaid-js/parser` 2.0.1 and `jsdom` 26.1.0, pinned in `tool-versions.json`. It
decides whether each authored source and family-support probe is valid Mermaid,
serves as Dave's Mermaid comparator and backs the tests. A run refuses to start
unless exactly that install is present. Benchmarking a project does not benchmark
Mermaid; the oracle only has to be installed:

```sh
node commands.ts mermaid:install
```

The default directory is `../mermaid-reference` beside the Agentic checkout, or
beside this package or kit, so sibling checkouts share one install. Agentic's
`bun run reference:mermaid` installs the same packages there.
`MERMAID_REFERENCE_DIR`, or the kit's `--mermaid-reference`, names another install.
In an Agentic checkout the pin must equal `docs/project/upstream-mermaid-policy.json`.
`build`, `typecheck`, `lint`, `export` and `fidelity:report` do not need it.

Read existing fidelity evidence without acquiring or rendering tools:

```sh
node commands.ts fidelity:report --core /evidence/core/fidelity-report.json \
  --community /evidence/community/community-fidelity-report.json \
  --out /evidence/comparison
```

Core and community reports must name the same authored cases and actual observer
protocol. Missing projections stay unavailable. A successful SVG call does not
supply native-model or whole-diagram fidelity credit.

Reports store compact gzip documents beside a small JSON reference. Keep these
siblings together when copying a report. Export decoded JSON explicitly for other
tools; stdout is the default and `--out` requires a fresh file:

```sh
node commands.ts export --input /evidence/comparison/comparison.json | jq '.rows'
node commands.ts export --input /evidence/comparison/comparison.json \
  --out /tmp/comparison-full.json
```

The reader also accepts canonical record payloads and legacy JSON. Export does
not rewrite or migrate the input evidence.

## Optional Agentic source adapter

Agentic Mermaid's own orchestrator owns the lanes that measure its source and
build: Dave, pinned Mermaid original tests, entry startup, source-stage, website,
CLI/MCP and candidate campaigns. Supply its checkout to run them:

```sh
TRIDENT_AGENTIC_ROOT=/checkouts/agentic-mermaid \
  bun commands.ts agentic --list --profile full
```

These commands execute that checkout's owning protocol files in that checkout.
An unavailable source adapter produces an explicit error before importing it.
The containing checkout is detected only when its root package is named
`agentic-mermaid`; arbitrary parent directories are not repository defaults.
`AM_BENCH_REPOSITORY_ROOT` remains an alias for `TRIDENT_AGENTIC_ROOT`. `bench`
remains a legacy alias for `agentic`. Existing root `bench:*` shortcuts retain
their suite IDs and options.

Lanes that read Mermaid's upstream tests also need the pinned source checkout
(`MERMAID_UPSTREAM_DIR`, default `../mermaid`); `bun run reference:mermaid`
installs it beside the oracle. Community CLI resource diagnostics use
`--startup-observer`, or the default GNU time above.

## Maintainer checks

Trident checks itself with Bun 1.4 or later and Python 3:

```sh
bun install
bun commands.ts test
bun commands.ts typecheck
bun commands.ts lint
python3 -m unittest discover -s visualizations -p '*_test.py'
```

Standalone, `test` and `typecheck` cover every file whose imports stay in this
package. `tsconfig.standalone.json` excludes the Agentic adapter files: those whose
import closure reaches Agentic source. `tests/standalone-scope.test.ts` fails when
that list and the actual imports disagree. Tests that exercise the Agentic checkout
layout report as skipped. When this package is `eval/benchmark` of an Agentic
checkout, the same commands (or that checkout's `bun run bench:test`,
`bench:typecheck` and `bench:lint`) cover every file. Browser tests use
`AM_CHROMIUM_EXECUTABLE`, then `/usr/bin/chromium`, then Playwright's Chromium.

The local temporary-directory and child-process test support belongs to Trident.
Product runtime code does not import benchmark code. Copying this directory does
not make the optional source adapters, external corpora, product tests or built
website available. Their remaining dependencies are explicit rather than
silently substituted with public-artifact results.

## Retention and extraction contract

An unchanged project reuses its exact completed attempt, including failures and
original dates. Select one project before acquisition to update it independently.
Changed executable bytes, dependencies, selected inputs or measured protocol
invalidate affected records. Analysis-only changes can read existing evidence.
`--force` requests a new attempt; it is not the default update path.

Keep both the record store and its referenced evidence directories. Missing
files prevent reuse. Cancellation, failed cleanup and incomplete publication
cannot become completed measurements. Historical records and raw observations
remain intact when readers or report policies change.

New attempts keep one canonical compressed record in `result.json.gz`. Store
entries and result views use small references that verify the output path,
length and digest before reading it. The shared readers also accept legacy
inline JSON records and results; existing evidence is not rewritten or migrated.
The temporary identity file is removed only after successful publication because
the canonical record already owns that identity. Failed attempts retain their
identity and incomplete-state receipts. Keep referenced output locations intact.
Store manifests and owning suite-result references use absolute paths; derived report-document
references use verified sibling basenames so report directories can be copied.

The portable kit is the extraction boundary that is tested without product
source, documentation or Git. The full optional Agentic orchestrator still uses
its product registry, source/test adapters, reviewed policy and external corpora.
Those adapters can move independently; Trident does not need a second registry
or a replacement framework to run its public-artifact core.

Successful portable workers send jobs and results through stdin, a dedicated
result descriptor or IPC. They do not create individual job/result files. A
compressed journal retains completed workers until the canonical record publishes;
incomplete attempts keep that journal and failure diagnostics. SVGs remain useful
case evidence. Unified CSV/coverage exports are opt-in with `--export-tables`.

A bounded extraction check used the real Node runner and GNU time: 24 workers
and 51 workers each produced six files, with no SVGs for the selected invalid-source
cases. Both repeated invocations reused the same record and dates. This checks
storage behavior, not renderer performance or statistical calibration. Encoding
existing Bezel and Mermaid source-test records with the new format reduced their
payload sizes by 95% and 87%; regenerating the 43-project comparison reduced its
JSON from 28,366,022 bytes to 541,131 compressed bytes with identical scores.
Historical evidence was read, not migrated or deleted.

All measurement entry points reject CI, including hosted manual and scheduled
runs. Reporting never starts a renderer, provider or benchmark worker. Live model
costs require observed usage and dated prices; unavailable costs or memory are
never zero-cost results.

See the [overview](OVERVIEW.md), [inventory](INVENTORY.md),
[measurement rules](MEASUREMENT.md), [assessment](ASSESSMENT.md) and
[optional unified runner](unified/README.md) for suite scope and remaining gaps.
