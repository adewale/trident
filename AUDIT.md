# PNG DaveBench audit and attempt disposition

Two independent agents reviewed the measurement transport and reporting. They
found no confirmed normal-path public-API or timing-endpoint blocker. The full
run was completed from source 2d99f3f38941275036c108ff1ead165bcdd8f5c2 before any
measurement-producer changes. Its source snapshot and native release bundle own
all published observations.

The reporter selects occurrence IDs qualified for every participant in every
round, takes each occurrence's five-call median, then reports median, nearest-rank
p95 and sum across those medians. The p95 is a workload distribution, not a
single-call tail. Runtime and output pixels remain visible. Full coverage remains
548 occurrences per participant per round, with 546 distinct source strings.

The reporting review found partial preflights could lose their warning. The
publisher now refuses preflight evidence. It also renames aggregate timing CSVs
as per-occurrence summaries, provides per-call observations separately and puts
runtime directly beside costs. These changes do not alter measured clocks.

The transport review identified three unobserved failure paths. The PR now marks
harness raster-budget exhaustion blocked, preserves native returned bytes before
SDK image decoding, and keeps a missing native startup attestation with no rows
blocked rather than aborting all remaining work. A contradictory/mismatched
attestation still cannot pass. Every measured child attempt exited zero, all five
native launch receipts match sealed bundles, all native rows are release-mode
records with acknowledgement barriers, and no native decode or browser raster-
budget failure occurred. The later hardening is not relabelled as measured source.

Manual inspection found that the collapsed-subgraph occurrence 1065 expands its
A/B/C contents in Agentic/Flutter, while Mermaid/Pele hide them. All four qualify
under the nonblank gate. The report therefore withholds matched-fidelity speed
claims. A separate ordinary flowchart occurrence 1449 supplies the representative
same-input gallery; actual output bytes are copied without rerendering or editing.

The initial three-occurrence preflight and positive API probes remain separate.
Their timings are not in the full-run summary. Full-run API errors, unsupported
inputs, uniform PNGs, original SVGs, blocked external-request receipts, sources,
warmups and successful exports are retained. The offline asset failure and the
task-free Gantt nonblank failures are not automatically diagnosed as library bugs.

Validation logs include focused browser/transport tests, TypeScript checking,
Dart analysis and native release compilation. The wider repository suite has a
previously retained stall without a final summary; no new full-suite pass is
claimed. This is a simple documentation-export protocol, not a calibrated or
held-out visual-fidelity benchmark.
