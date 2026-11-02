# Benchmark readiness after PR #74

Trident can benchmark **public-call outcomes, returned output, mechanical format validity, returned byte size, explicit public behaviours, specified drawing facts and qualified rendering time**. Each needs its own evidence and population. The implementation now makes those distinctions executable rather than relying on a caption to qualify an aggregate score.

## Which existing benchmarks fit?

| Existing benchmark | Retain it for | Qualification still required |
|---|---|---|
| DaveBench: 548 pinned documentation occurrences, SVG and PNG lanes | Call outcomes, production, format, bytes; bounded drawing facts | Source-bound public calls and actual bytes for mechanical results. Independently reviewed expectations and representation controls for drawing claims. Unselected work remains unrun. |
| Terminal Rendering: 120 active inputs | The same mechanical measures; typed invalid-input rejection; supported text drawing facts | Terminal transport controls and literal sources. Validate each geometry/family observer separately. The original and active corpora retain separate identities. |
| Mermaid Behaviour Tests: 49 whole cases | Explicit public behaviours, including family detection and SVG naming | Actual public returns, reference controls and every assertion in the selected case. Detail checks are not additional votes. |
| Selected Mermaid API compatibility: 154 callbacks | Substitutability for the named API assertions | Original/reference controls and retained peer calls. Optional API absence is not general renderer incapability. |
| Strict browser, terminal and PNG timing | Time through the specified boundary; comparison of correctly completed work only when qualified | Predeclared common workload, every sampled output checked, stable A/A controls, matching lifecycle and cache policy. No new speed ranking is issued here. |
| Fidelity, upstream-original and adapter fixtures | Development regression and instrument verification | Keep them out of renderer league tables. Public-model tests retain their optional model-operation scope. |

Resource consumption is also measurable **counter by counter**, given a named unit, process/time boundary, sampling method and resolution. This change neither collects new resource measurements nor establishes a resource ranking. Output-return rates and format validity are diagnostics, not drawing accuracy. Reviewed-image reuse does not assess unseen PNG semantics.

The [existing-table audit](evidence/measurement-readiness-2026-11-02/existing-benchmarks.json) classifies all 42 canonical snapshot tables. Its six output-admission tables do not acquire production or format-only evidence retroactively; legacy and unclassified checks retain their diagnostic scope.

## Implemented reliability repairs

* Bind plans and fresh reductions to immutable measurement definitions; audit legacy tables as inferred scopes. Reports expose values, units, formats, fixed denominators, unresolved assessments and evidence provenance. A failed collection stays visible after successful reduction.
* Reconstruct production, format and bytes from retained causal invocation frames and owned payloads. Check source, project, format, invocation identity, artifact consistency, hashes and paths. Summary booleans cannot supply measurement credit. Completed errors, interrupted calls and missing evidence remain distinct; completed errors confer no grammar-rejection credit or fault attribution.
* Separate mechanical validity from canvas, label and drawing admission. Preserve wrong-format SVG strings as returned output while withholding successful-render duration.
* Freeze the selected documentation IDs and formats in preparation. The acceptance run exposed an actual bug that silently expanded a three-case selection to all 548 occurrences. Collection now restores the frozen selection and rejects conflicting overrides.
* Preserve journal ownership across composite SVG/PNG captures and terminal replay. SVG companions of PNG exports do not become separate SVG calls. Original v1 terminal archives remain reducible after the existing assessment-profile migration, with unchanged source inventories.
* Provide one immutable replay entrypoint and bounded instrument verification, including CI receipts. Positive, deliberately wrong and equivalent-valid controls run the actual observers. Six scopes have controls: static SVG validity, PNG decoding, literal SVG labels, literal terminal labels, terminal block-grid geometry and static SVG accessible names/descriptions. Equivalent ARIA group controls also exposed and fixed a narrow naming-observer gap.

## Actual public-release acceptance, 2 November 2026

The checked-in [selection](../qualification/measurement-smoke.json) was declared before collection: one edge, one class lollipop interface and one unequal-value pie from pinned Mermaid commit `1fb7869866dd619168d840291c9c54b4f129758b`. Three releases received those same sources in SVG and PNG: **18 selected calls**. Beautiful Mermaid also received all **120 active terminal inputs**, including invalid-source controls.

| Public release | Format | Selected calls | Verified returns | Completed errors | Mechanically valid returns | Returned bytes |
|---|---|---:|---:|---:|---:|---:|
| Mermaid 12.2.0 | SVG | 3 | 3 | 0 | 3 | 51,367 |
| Pele 1.9.0 | SVG | 3 | 3 | 0 | 3 | 5,362 |
| Beautiful Mermaid 1.1.3 | SVG | 3 | 2 | 1 | 2 | 4,445 |
| Mermaid 12.2.0 | PNG | 3 | 3 | 0 | 3 | 46,587 |
| Pele 1.9.0 | PNG | 3 | 3 | 0 | 3 | 25,240 |
| Beautiful Mermaid 1.1.3 | PNG | 3 | 1 | 2 | 1 | 1,218 |
| Beautiful Mermaid 1.1.3 | Terminal | 120 | 87 | 33 | 87 | 104,777 |

No selected call was interrupted or missing its causal outcome. The full documentation tables retain **548 planned inputs per project/format**, with **545 unrun**. Terminal validity here means strict UTF-8 decoding. Byte totals cover actual returns only; these partial populations supply no size ranking. Completed errors include invalid controls and unsupported work and do not establish who is at fault.

The docs collection exited **1**, reflecting its failed/unresolved assessment, and that status remains in the evidence. Integration acceptance passed because actual selected calls and retained bytes were established and both docs and terminal replay reproduced **call outcomes, production, format and byte measurements**. Replay invoked no renderer and preserved the original source reports/raw record. This is neither a drawing-accuracy result nor a performance comparison.

The [receipt](evidence/measurement-readiness-2026-11-02/receipt.json), [acceptance](evidence/measurement-readiness-2026-11-02/acceptance.json), [docs values](evidence/measurement-readiness-2026-11-02/docs-measurements.json), [terminal values](evidence/measurement-readiness-2026-11-02/terminal-measurements.json), [instrument verification](evidence/measurement-readiness-2026-11-02/verification.json) and [raw-file manifest](evidence/measurement-readiness-2026-11-02/raw-manifest.json) are retained here. The receipt identifies the exact collection and reporting revisions. Full captures, journals, preparations, replays and logs are packaged in the local `.cache/measurement-readiness-2026-11-02/public-evidence.tar.gz`; its hash is in the receipt. That archive has not been remotely published. The compact receipts alone are not a substitute for its raw bytes.

Unpacking that archive at a different location and auditing both output lanes reproduced the same mechanical values, with zero renderer calls. The receipt records these relocation checks separately from the original collection and replay.

## Remaining work before a broad comparative drawing benchmark

1. Complete independent positive, wrong-output and equivalent-valid controls for every claimed fact and actual SVG/terminal representation. Unknown observer support must withhold qualification, never become a renderer defect. Novel PNG semantics still need an independent assessment method.
2. Exercise each enrolled adapter against its frozen public release: arguments/options, asynchronous completion, consumed output, lifecycle, typed errors and interruptions. This acceptance covers three releases and seven output groups; it does not qualify every catalogue adapter.
3. Predeclare one named accuracy workload whose expectations and observers are qualified for every participant. Replay existing captures to establish assessment coverage before collecting more. Keep renderer support and assessment support separate.
4. Run comparative timing only on that correctly completed common work, through matching boundaries with per-call output evidence and A/A controls. The previously qualified six-example SVG comparisons remain narrow historical results.

See [the executable workflow and contracts](measurement-contracts.md) for commands. The canonical numeric snapshot and frozen baseline were not replaced by this integration exercise.
