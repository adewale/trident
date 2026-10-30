# Publishing benchmark results

[RESULTS.md](../RESULTS.md) is the repository's ecosystem overview. It lists all
eligible projects, the latest imported attempts and dated result tables for all
seven benchmarks. Its initial measurements are retained 27–28 October 2026
evidence, clearly marked historical; they are not a newly qualified campaign.

[`latest.json`](latest.json) stores the table values, dates, interfaces,
qualification notes, receipt hashes and campaign attempts. The generator uses
those same numeric rows for the Markdown tables and Mermaid charts. Do not edit
`RESULTS.md` by hand.

Results are stack-ranked by the metric named above each table. Coverage and
passed-check rates run highest first; latency and memory run lowest first.
Ties share a rank. Unavailable measurements are unranked below measured rows.
The ecosystem overview uses DaveBench's SVG return rate; each other benchmark
keeps its own ranking. The charts follow their table order. Historical values are maintained only in
`latest.json`; the provenance receipt stores their digest and original source links.

Regenerate or check the tracked page without acquiring projects or running benchmarks:

```sh
bun commands.ts results:snapshot
bun commands.ts results:snapshot --check
```

The check also works in CI without the Mermaid oracle. It validates receipt hashes
and retained table values, and rejects stale Markdown,
invalid chart values and unknown catalog projects. Numeric zero is an observed
value; unmeasured, blocked and not-applicable states are separate.

## Initial release baseline

[BASELINE.md](../BASELINE.md) defines B0 and its required manifest, applicability
ledger, owning evidence, checksums and acceptance checks. Publish that frozen
index separately from the rolling overview before the first public 0.1 release.
Importing a newer campaign here does not amend B0; pilot outputs are not baseline
scores. Later release notes link their baseline compatibility assessment.

## After collecting a campaign

Run measurements locally, serially, with the current qualifier. The source tree
keeps the small overview; publish raw evidence outside it:

```sh
bun commands.ts bench --projects OWNER/TOOL --profile full \
  --records /evidence/records --out /evidence/run
bun commands.ts results:campaign --campaign /evidence/run \
  --out /evidence/publication --copy-evidence
```

Host that publication at a permanent HTTPS location. The copied campaign is
under `evidence/1/`; pass the URL of that directory, where `report.json` lives:

```sh
bun commands.ts results:snapshot --campaign /evidence/run \
  --evidence-url https://YOUR-HOST/CAMPAIGN/evidence/1/
bun commands.ts results:snapshot --check
```

Commit `RESULTS.md` and `results/latest.json` together. Repeat the
`--campaign DIR --evidence-url URL` pair to import multiple campaigns. Reimporting
an unchanged campaign does not duplicate its attempts. A changed or partial
campaign is retained alongside the earlier attempt. The overview uses the most
recent recorded attempt for that project and benchmark, including failures,
blocks and requested boundaries with no result; it keeps older tables below.
Different public interfaces remain separate in the observation tables.

Campaign imports now generate the comparative tables from owning suite results.
DaveBench reconciles the complete frozen inventory across the declared rounds;
portable latency retains case/mode and output-calibration scope. Other suites
compare recorded observations only where the public interface and observed check
coordinates match. Different populations stay in separate cohorts. Missing bindings,
blocked work, failed checks and original measurement dates remain visible.

The same table rows produce ranks and charts. There is no per-run transcription of
`SnapshotTable` values. Hand-entered historical tables remain immutable legacy
imports; they are not a template for adding fresh campaign results. Pilot campaigns
are rejected by the ecosystem importer.

Keep failure outputs, artifact identities and actual measurement dates. A
campaign invocation date can be newer than reused measurements; the linked
owning records retain those original dates. Different workloads, protocols or
machines do not make one matched experiment. The snapshot does not claim an
overall winner, copy parent results to descendants, or penalize terminal tools
for an undeclared SVG interface.

GitHub renders the `xychart-beta` blocks using its Mermaid version. The tables
remain readable if chart syntax is unavailable. The charts do not use a
benchmarked project's renderer and say nothing about its visual quality.

[Choose a benchmark](../BENCHMARKS.md) · [Table conventions](../REPORTING.md) ·
[Comparison contracts](../FAIRNESS.md)

## Source-candidate comparisons

An unreleased comparison table sets `artifactRole: "candidate"`. The generator
labels its table and chart as source candidates and links it from a separate
index. It is ranked only against the other rows in that table; it cannot supply
an `overview` or become `overviewRanking`. Release overview values and ranks
remain unchanged by candidate tables or attempts. Keep source commits, packed
archive identities, planned populations and timing qualification in the receipt
and caption.

The [29 October AM/ZM comparison](../docs/comparison-2026-10-29.md) demonstrates
this path with raw observations published at an immutable evidence commit and
a reducer that reconciles all five tables.
