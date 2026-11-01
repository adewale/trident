# Two retained Wardley force images qualified

The complete current source contract for case521 (`wardley.md:352`) is correct in both actual retained PNGs. Fresh direct-image reviews passed the existing official importer and normal PNG assessor. The physical force anchors are within0.31px of their literal source positions in an independently measured plot frame.

Current drawing totals (546 per project): Mermaid **493 correct,42 incorrect,11 unknown**; native Flutter **294 correct,136 incorrect,116 unknown**. Native unknowns include **99 observed no-image outcomes** and17 actual-image holds. Across both projects28 actual-image holds remain, including2 source-incomplete Boston cases. Controls remain separate. This two-row overlay follows the prior [13-review supplement](../png-holds-2026-11-01/summary.json); its963 admissions remain unchanged. There are965 current admitted decisions.

`source-mapping.json` pins the independently approved positive-only public encoding: right-facing accelerator left-tail midpoint and left-facing deaccelerator left tip. `frame-force-measurements.json` contains physical shaft/tail/head and gray-axis measurements before source projection. No actual SVG x/y, renderer agreement or default font/size/palette is used. The native image needs no SVG artifact.

Both case519 note images remain unknown. `note-anchor-measurements.json` retains the failed fixed glyph-profile gates: the Mermaid first note has0.927536 IoU against a0.97 requirement; native glyph fits also fail. No gate was tuned and no renderer fault is inferred from an unavailable anchor decoder. Case520 is untouched.

`reviews.jsonl` is the exact new v2 direct review evidence; its2 original packets are included. `admitted-reviews.json.gz` and `admitted-reviews.json.receipt.json` retain the existing official importer output. `origins.jsonl` preserves original authorship paths and raw line hashes. `normal-delta.json.gz` contains only2 normal affected grades, retaining original per-row dates, samples and ownership. `summary.json` hashes the exact decompressed published bytes. The separate28-row pending ledger does not include99 unchanged native no-image returns.

The probes under `probes/` are exact historical source snapshots; `.ts.txt` explicitly prevents TypeScript build inclusion. Their original workspace imports and measured input paths are retained as provenance. No renderer call, old951/963 decode pass or174MB archive rebuild occurred.

For portable re-admission, extract the bound JSON with `gzip -dc admitted-reviews.json.gz`. To rerun the normal importer on only these2 raw reviews, generate local selection-origin metadata from the unchanged `reviews.jsonl` lines (absolute current file/directory, one-based line and SHA256 of the line excluding newline), then use the existing command from the repository root:

```sh
bun unified/import-png-review-selection.ts --inventory corpus/docs-source-inventory.json.gz --contracts corpus/docs-reviewed.json --origins LOCAL_ORIGINS.jsonl --image-root docs/evidence/png-wardley-anchors-2026-11-01 --out FRESH_ADMITTED.json
```

The two content-addressed drawing aliases point to the original packet bytes. New origin metadata does not change or restamp any review. All files and aliases are pinned by `files.json`; earlier datasets and their audit receipts remain immutable.
