# Publishing benchmark results

[RESULTS.md](../RESULTS.md) is the repository's ecosystem overview. It lists all
eligible projects and the latest corpus comparisons. The 1 November campaign covers the 27 eligible projects and separates DaveBench SVG/PNG returns and content, pinned public API tests and
Terminal Rendering. Authored SVG feature/edit cases remain unscored diagnostics;
optional public-model contracts retain separate reports. Historical studies and
the previous overview remain linked at immutable revisions.

[`latest.json`](latest.json) stores the table values, dates, interfaces,
qualification notes, receipt hashes and campaign attempts. The generator uses
those same numeric rows for the Markdown tables and Mermaid charts. Do not edit
`RESULTS.md` by hand.

Large snapshots put the complete ranked tables and attempt records in generated
pages under `results/tables/`, linked from the overview. Each page stays small
enough for GitHub to render. `results:snapshot --check` checks those pages too.
Incomplete documentation rounds remain unranked, with partial observations
counted separately from inputs never executed. Their bars and percentages are
withheld rather than shown as zero.

Results are stack-ranked by the metric named above each table. Coverage and
passed-check rates run highest first; latency and memory run lowest first.
Ties share a rank. Unavailable measurements are unranked below measured rows.
The ecosystem overview uses DaveBench's reviewed SVG correct count; each other benchmark
keeps its own scoped ranking. The 100 authored feature/edit cases have no rank,
chart or ecosystem overview score; their diagnostic rows are alphabetical. The charts follow their table order. The small historical examples snapshot keeps its original provenance digest;
older campaign views remain available at their immutable links.

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

[results/baseline.json](baseline.json) freezes B0 separately from this rolling
overview. [Its receipt](../docs/evidence/b0/receipt.json) binds actual corpus and
outcome files, not just scores. `results:snapshot --check` verifies both the
rolling snapshot and the linked baseline. New imports keep B0 bytes unchanged.
[BASELINE.md](../BASELINE.md) explains the verified scopes, unknowns and rules for
comparing later counts and timings.

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

These commands also accept a single attempt directory from `timing:browser`,
`timing:png` or `timing:terminal`. The importer reads its native bundle and
revalidates the owned raw journal and A/A controls. Speed ranks also require the
full current source contracts; output-only checks cannot qualify them. Each
table keeps its output format, clock boundary, corpus and exact artifact hashes.
Unqualified attempts remain visible with speed values withheld. Provisional and
final summaries of one capture are accepted only when every recorded input,
sample and ownership field agrees. Distinct attempts need separate directories;
the importer never chooses the best saved verdict.

Commit `RESULTS.md` and `results/latest.json` together. Repeat the
`--campaign DIR --evidence-url URL` pair to import multiple campaigns. Reimporting
an unchanged campaign does not duplicate its attempts. A changed or partial
campaign is retained alongside the earlier attempt. The overview uses the most
recent recorded attempt for that project and benchmark, including failures,
blocks and requested boundaries with no result; it keeps older tables below.
Different public interfaces remain separate in the observation tables.

A one-project DaveBench rerun updates that project's coverage without removing
comparable peers. Rolling coverage joins only matching protocol, pinned input
bytes and round counts. Each row keeps its own date and evidence receipt; a newer
partial attempt still supersedes an older score. Different workloads and source
candidates stay separate. This merge supplies no cross-run timing comparison.

Campaign imports now generate the comparative tables from owning suite results.
DaveBench reconciles the complete frozen inventory across the declared rounds;
portable latency retains case/mode and output-calibration scope. Other comparative suites
compare recorded observations only where the public interface and observed check
coordinates match. Different populations stay in separate cohorts. Missing bindings,
blocked work, failed checks and original measurement dates remain visible.

Comparative table rows produce ranks and charts. Authored regression tables
retain outcomes and evidence without ranks or comparative charts. There is no per-run transcription of
`SnapshotTable` values. Hand-entered historical tables remain immutable legacy
imports; they are not a template for adding fresh campaign results. Pilot campaigns
are rejected by the ecosystem importer.

Regrade saved outputs when a checker or review changes. Use
`bun unified/recheck-rendering.ts --campaign DIR --out FRESH_DIR --formats png --png-reviews FILE`
to update PNG alone, or `--formats svg` to update SVG alone. Unselected formats
keep their grades and observer identities. Changed source-review facts require
rechecking all affected formats. A completion receipt appears only after the
regrade succeeds; prior receipts remain in its history.

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
