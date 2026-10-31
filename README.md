# Terminal project corpus qualification

Corpus: 18 frozen terminal-project repositories, documentation/issues/PRs; 120 selected inputs, no usage-frequency claim. Original collection 2026-10-31T02:31:44.133Z to 2026-10-31T02:31:46.512Z; observer checked 2026-10-31T02:49:12.816Z. Mermaid reference receives no terminal score.

## Full planned inventory

| Rank | Project | Version | Correct | Incorrect | Unsupported | Unknown | Planned |
|---:|---|---|---:|---:|---:|---:|---:|
| — | fasouto/termaid | 0.10.0 | 12 | 1 | 0 | 107 | 120 |
| — | AlexanderGrooff/mermaid-ascii | git-5f00e3d9ac9f | 11 | 3 | 0 | 106 | 120 |

## Independently reviewed observable subset

| Rank | Project | Version | Correct | Incorrect | Unsupported | Unknown | Planned |
|---:|---|---|---:|---:|---:|---:|---:|
| — | fasouto/termaid | 0.10.0 | 12 | 1 | 0 | 3 | 16 |
| — | AlexanderGrooff/mermaid-ascii | git-5f00e3d9ac9f | 11 | 3 | 0 | 2 | 16 |

Unknowns withhold rank. Source-derived labels/tags never supply correctness credit. Typed invalid-input rejection is unmeasured; missing observer families, display state and unreviewed facts stay unknown. No general language, aesthetics or speed claim.

[Original artifacts, source reference, transport observations and witness identities](publication/evidence/1/raw.json) · [Observer verdicts and corpus/review identity](publication/evidence/1/terminal/result.json)

## Evidence boundaries

Corpus: 120 real sources selected from 488 candidates across documentation, issues and PRs of 18 catalog-selected terminal-rendering projects; 20 diagram families plus invalid inputs. All repository commits, body/patch hashes, extraction steps, caps and gaps are retained under `inputs/`. This is a development-exposed coverage sample, not production-frequency evidence or a holdout.

Independent source review supplies 22 contracts: 20 drawings and two actual invalid-source tests. Sixteen drawings have a bounded current observer; the other 104 planned cells were not rendered in this qualification. All 120 sources were checked once by Mermaid 12.2.0; the reference receives no terminal score.

One pass made exactly 32 terminal public calls through the existing transports. Source collection commit: `3b9bc96`. Original collection: `2026-10-31T02:31:44.133Z` to `2026-10-31T02:31:46.512Z`. No acquisition, build, warmups, timing qualification or repeated renderer campaign. Source clocks in retained transport diagnostics are not compared across the cold ASCII CLI and warm Python API.

The ASCII artifact is the cached source build `git-5f00e3d9ac9f`, binary SHA-256 `42f116149cc3485a72bb4eea174a71ca52179d8eb8c6fdb9c87e62d62151f1e2`, not the earlier release executable. Termaid is the cached 0.10.0 wheel, hash `b884a616d30071643f8e93528b0ad68bd5696b41a7b5d31cd0554d2f990f28f2`.

Original records are under `original-collection/`. Its Python worker wrote all text witnesses but the parent transport omitted their pointers. `recover-pointers.py` promotes those already recorded JSONL paths into the separate `pointer-recovery/` receipt; hashes and original timestamps remain intact, with zero renderer calls. The final `publication/evidence/1/` view uses corrected caption/layout observers and preserves the original collection identity. Final observer source: `fe38a8a`.

Confirmed bounded findings: ASCII ignores the requested RL/BT node order on three sources; Termaid mirrors the characters of multiword RL node labels (`Deploy` becomes `yolpeD`). Ambiguous source merges, shared-stem caption ownership, overpainted caption whitespace and unreviewed drawing facts remain unknown. No full-corpus winner or speed ranking.

## Recheck without renderers or Mermaid

```sh
sha256sum --check SHA256SUMS
# Trident checkout at fe38a8a or descendant, with frozen Bun dependencies:
bun commands.ts bench --terminal --saved-terminal EXTRACTED/publication/evidence/1 --out FRESH_DIR
```

The final observer verifies retained witness bytes, source/review identities and the recorded Mermaid role. It makes no project call. Existing `results:campaign --copy-evidence` and `results:snapshot` reduction were exercised.
