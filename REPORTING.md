# Reading Trident results

[RESULTS.md](RESULTS.md) contains league tables for DaveBench, Drawing Correctness
and Mermaid Fidelity. DaveBench has separate SVG, PNG and terminal-text tables;
Drawing Correctness has SVG and terminal-text tables. Project name and version form one display label; there
is no separate Version column. When the collection recorded them, the DaveBench
SVG table adds a Strict-XML invalid column (admitted SVG that is not strict XML)
and the PNG table a PNG source column (the project's own PNG interface or
Trident's Chromium conversion of its SVG). DaveBench rows with equal completion
counts and the same timing boundary share a rank when their three-run time ranges
overlap. A **Matching outcomes** list names projects whose per-case outcomes are
identical in every DaveBench and Drawing lane they have; it is a fact about
outcomes, not by itself evidence of shared code.
[docs/davebench-families.md](docs/davebench-families.md) gives DaveBench completion
per diagram family and format; `results:snapshot` writes it when the DaveBench
results record each case's family.

Method, corpus, qualification rules, blockers and limitations belong in
[the details](docs/benchmark-results-details.md). The landing page contains only
headings, tables and that details link. Unassessed work stays distinct from
observed failure and never becomes a zero score. The equal-weight synthesis shows component and overall score bounds and each
project's possible rank, listed by worst and then best reachable rank. Exact overall scores remain withheld while required measurements
are unresolved.

The page reads the current numeric results directly. Regenerate or check it with
`bun commands.ts results:snapshot` or `bun commands.ts results:snapshot --check`.
Neither command runs renderers or rebuilds historical evidence. See
[results instructions](results/README.md) for the input files.

To contest a row, follow [Dispute a result](CONTRIBUTING.md#dispute-a-result).
