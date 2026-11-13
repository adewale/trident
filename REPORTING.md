# Reading Trident results

[RESULTS.md](RESULTS.md) contains league tables for DaveBench, Drawing Correctness
and Mermaid Fidelity. DaveBench has separate SVG, PNG and terminal-text tables;
Drawing Correctness has SVG and terminal-text tables. Project name and version form one display label; there
is no separate Version column.

Method, corpus, qualification rules, blockers and limitations belong in
[the details](docs/benchmark-results-details.md). The landing page contains only
headings, tables and that details link. Unassessed work stays distinct from
observed failure and never becomes a zero score. The equal-weight synthesis shows component and overall score bounds, ordered by
verified minimum. Exact overall scores remain withheld while required measurements
are unresolved.

The page reads the current numeric results directly. Regenerate or check it with
`bun commands.ts results:snapshot` or `bun commands.ts results:snapshot --check`.
Neither command runs renderers or rebuilds historical evidence. See
[results instructions](results/README.md) for the input files.

To contest a row, follow [Dispute a result](CONTRIBUTING.md#dispute-a-result).
