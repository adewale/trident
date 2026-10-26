# Trident

Trident benchmarks Mermaid tool artifacts and reads retained evidence. Its portable
runner, qualification, records and reports live in this private package. Agentic
Mermaid's source diagnostics remain an optional adapter. The package is excluded
from product distribution, product test discovery and CI.

Trident was extracted from Agentic Mermaid's `eval/benchmark` directory
([adewale/agentic-mermaid#492](https://github.com/adewale/agentic-mermaid/pull/492),
commit `e81f405c`). Source diagnostics require a public Agentic source checkout; see
[Optional Agentic source adapter](#optional-agentic-source-adapter).

## Run without an Agentic checkout

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
plain Node 24 and the explicitly supplied tool artifact, without Bun, Git, an
Agentic checkout or a harness dependency installation:

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

Whole-worker CPU and peak RSS need GNU time. `/usr/bin/time` is used by default
only when it is GNU time; macOS ships BSD time, so install `gnu-time` and pass
`--observer "$(command -v gtime)"`. Without an observer these values are recorded
as unavailable, not zero.

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

Source diagnostics, Dave orchestration, original-test comparisons and full
controller tests (including Chromium paint controls) need a public Agentic source checkout with its declared
repository dependencies installed. Git and tar must be on PATH. They do not
require Agentic's old `eval/benchmark` package or local measurement archives:

```sh
git clone https://github.com/adewale/agentic-mermaid.git /checkouts/agentic-mermaid
cd /checkouts/agentic-mermaid
bun install --frozen-lockfile
cd /checkouts/trident
bun install --frozen-lockfile
bunx playwright install chromium
export AM_CHROMIUM_EXECUTABLE="$(node --input-type=module -e 'import {chromium} from "playwright"; process.stdout.write(chromium.executablePath())')"
TRIDENT_AGENTIC_ROOT=/checkouts/agentic-mermaid bun commands.ts agentic --list --profile full
TRIDENT_AGENTIC_ROOT=/checkouts/agentic-mermaid bun commands.ts test
TRIDENT_AGENTIC_ROOT=/checkouts/agentic-mermaid bun commands.ts typecheck
bun commands.ts lint
```

Trident assembles a disposable source workspace under `.cache`, or
`TRIDENT_CACHE_DIR`. It combines the Agentic tracked source and corpus with this
Trident checkout's protocols, records both original revisions, and commits the
combined driver snapshot for source-protocol admission. Installed dependencies,
built distributions and sites remain explicit inputs. No source checkout is
rewritten. An unowned cache directory is never replaced. Concurrent preparation
is refused; an interrupted lock requires checking that its processes stopped
before removing it.

Measurements require clean committed source and harness revisions. Tests,
typechecking and read-only listing can exercise working changes and record that
fact. Keep the source checkout while using its workspace: Git objects and installed
dependencies are referenced there. Default evidence lives in the selected source
checkout's `bench-report`, outside the disposable workspace. Relative output and
record-store options resolve before entering it, so changing harness versions
cannot erase those records.

The complete source suite still needs explicitly prepared reference/tool/site
artifacts for the lanes that use them. Missing prerequisites remain blocked;
listing a suite does not claim it ran. `source SCRIPT` executes a declared
legacy diagnostic through the prepared layout. The scorecard defaults to the
selected source checkout's `bench-report/community-benchmark-ranking.md`; pass an
explicit `--output` to update a maintained Markdown file outside the workspace. The Agentic launcher pins a
Trident Git revision and forwards the actual checkout and original arguments.
`AM_BENCH_REPOSITORY_ROOT` remains an alias for `TRIDENT_AGENTIC_ROOT`.

The generic community catalog belongs to `data/mermaid-community.json`.
`data/upstream-mermaid-policy.json` is this benchmark cohort's pinned Mermaid
policy; Agentic's product compatibility policy remains authoritative for its
source diagnostics. Historical scores live in [COMMUNITY-RANKING.md](COMMUNITY-RANKING.md).
The [included retained-report example](examples/fidelity-2026-10-26/README.md)
regenerates charts and exports without Agentic, a browser, tool installations or
session-local records. Its raw rendered witnesses are not bundled.

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
