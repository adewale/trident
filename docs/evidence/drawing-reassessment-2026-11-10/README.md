# Retained SVG label reassessment

This replay reassesses the 0.3.0 Drawing Correctness capture with the current SVG
label observer (`svg-label-paint-v7`). No renderer ran: the retained output bytes,
the 7 November product freeze, Mermaid 12.3.0 and the case population are unchanged.
The [comparison](drawing-reassessment.json) lists every changed verdict.

The observer combines two sets of changes. This replay adds measured glyph ink for
plain, single-line HTML labels, which separates unused font-box overflow from
cropped letters, and records each unavailable criterion with the glyph witness's
stage. Admission includes a positive font-box-overflow control and a negative
clipped-glyph control. The reviewed wrapping and control-label changes from #94 had
not yet been applied to the published results; their own collateral replay reported
six unknown and one failing case becoming correct.

| Disposition | 0.3.0 | Reassessed |
|---|---:|---:|
| Correct | 3,079 | 3,088 |
| Incorrect | 374 | 397 |
| Invalid format | 86 | 86 |
| Renderer failure | 634 | 634 |
| Unassessed | 145 | 113 |

4,318 observations and 3,684 returned outputs (3,437 compressed objects) match the
0.3.0 capture. All 2,286 terminal verdicts are unchanged and no previous pass is lost.

| Project | From | To | Cases |
|---|---|---|---:|
| Latias Merman | unknown | incorrect | 24 |
| Latias Merman | unknown | correct | 2 |
| Agentic Mermaid | incorrect | correct | 1 |
| Bezel | unknown | correct | 1 |
| Zombie Mermaid | unknown | correct | 1 |
| Mermaid | unknown | correct | 1 |
| Pele | unknown | correct | 1 |
| Mermaid Dart | unknown | correct | 1 |
| Ondine | unknown | correct | 1 |

The 24 Latias Merman failures are labels whose measured HTML glyph ink is clipped.
Case `drawing:5c9a50898b1e6ffe` passes for Latias Merman only with both changes: the
wrapping change resolves it for the other renderers, and the HTML ink measurement
removes Latias Merman's clipping doubt.

## Environment

Glyph proofs compare actual pixels, so they depend on the fonts installed where the
assessment runs. The replay used Playwright's pinned Chromium 145.0.7632.6 (build
1208) and excluded the Inter font family through fontconfig. That reproduces every
0.3.0 pass. With Inter installed, Frankenmermaid case `drawing:11426c4cad392dc7`
loses its glyph proof and becomes unknown under the 0.3.0 observer too. Raw runs do
not yet record the assessing machine's fonts.

```sh
mkdir -p .cache/drawing-replay
git show v0.3.0:results/release/captures/drawing-capture-2026-11-09.tar.gz | tar -xzf - -C .cache/drawing-replay
FONTCONFIG_FILE=no-inter.conf bun scripts/reassess-drawing-results.ts .cache/drawing-replay/drawing-retained .cache/drawing-replay/reassessed svg
bun scripts/merge-drawing-results.ts --run .cache/drawing-replay/reassessed --out drawing-correctness.json
```

`no-inter.conf` includes the system fontconfig and rejects the Inter font files.
