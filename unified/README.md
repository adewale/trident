# Runner and retained records

Public artifact benchmarks run directly in Trident. Source-coupled experiments use an explicit project adapter. [Choose a benchmark and assess its value](../BENCHMARKS.md), then use the matching boundary below.

## Public community records

```sh
bun commands.ts community:update --projects OWNER/TOOL --profile full --rounds 5 \
  --records /evidence/records --out /evidence/run
bun commands.ts results:publish --records /evidence/records --out /evidence/report
```

An unchanged project/artifact/input/qualifier/runtime/protocol reuses its owning record and dates. `--plan` performs acquisition/preparation and shows reuse decisions without clocks; `--force` records a new attempt. A candidate selects exactly one project and uses a verified tarball/directory or reviewed source revision, with the same options for every project. Candidates never replace releases in the league. `results:compare` reads the same project's candidate and release while withholding comparisons across incompatible protocols.

Collection failures remain observations. Unsupported, failed, blocked, skipped and unavailable outcomes are distinct. Old output directories cannot supply fresh completion evidence. Keep the record store and its referenced evidence; a missing witness prevents reuse. Report generation starts no renderer or timing worker. Publishing a record does not qualify all of its timings.

## Optional source controller

See [source-adapter setup](../adapters/agentic/README.md). Its `run --list --profile full` lists actual commands, prerequisites, target ownership and selection. `run --profile full --suites ID --out DIR` executes selected workloads sequentially. The full profile selects automatic entries; explicit campaigns need their own inputs. A failed suite does not erase later evidence.

Source-owned diagnostics and product tests use the driver checkout's imports. `--target CHECKOUT --package-root PACKAGE` does not redirect those imports. Exact candidate archives matter for target-aware protocols. A modern-summary reader, portfolio builder or campaign controller is not another independent benchmark.

Each campaign writes `report.md`, a `report.json` pointer and `report.json.gz`, plus owning suite logs/artifacts. Keep both JSON files and all witnesses. Owning-test counts describe pass/fail/skip totals; test process wall time includes setup and is not renderer latency. Optional `--export-tables` writes executed observation/coverage tables. Missing cells are unmeasured.

## Evidence readers

```sh
node commands.ts export --input /evidence/run/report.json --out /evidence/report-full.json
node commands.ts fidelity:report --core /evidence/core --community /evidence/community \
  --out /evidence/fidelity-report
```

Export accepts canonical compressed/reference documents and legacy JSON. Fresh file output prevents accidental overwrites. Fidelity reports enforce their owning criterion, observer, browser and artifact identities before composition. Source chart/scorecard reducers require their own admitted completed input contracts. They cannot turn partial experiments into a newly passing full run.

Old result bundles have been removed. Generated evidence belongs outside the source tree; raw failures and measurement dates remain part of any new published result. [Measurement rules](../MEASUREMENT.md) define permitted claims.
