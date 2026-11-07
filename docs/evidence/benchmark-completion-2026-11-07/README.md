# Benchmark evidence completion

PR [#88](https://github.com/adewale/trident/pull/88) merged as
`2e1bf0a76e026a54ef427127e6bc8f30e91d57bc`. Its published observations remain
available at that commit. This collection uses the same
[frozen product catalog](../benchmark-campaign-2026-11-07/catalog.json).

## SVG label qualification

The `svg-label-paint-v2` profile can prove separation between a flat opaque
label and an enclosing static opaque sRGB gradient. At least one colour channel
must lie outside every stop's channel interval, allowing a two-unit rounding
margin. This suffices for both sRGB and linearRGB interpolation. Transparent,
inherited, animated and wider-colour-space gradients remain unavailable. A single
SVG `feDropShadow` can preserve an already opaque backdrop's source graphic;
filters that erase, clip or otherwise alter that source receive no such proof.

Independent fixtures cover a visibly separated label, a label camouflaged by
the same gradient, alpha, inheritance, animation, wide-gamut colour, filters and
opaque covers. The proof extends the existing observer; it does not infer
visibility from SVG text or a bounding box alone.

Static SVG label assessment now avoids constructing shape inventories used only
by the separate visible-ink profile. It still checks every primitive's paint and
all label, canvas, clipping and occlusion obligations. The original and optimized
paths agreed on all 1,882 captured label probes, with zero mismatches and zero
observer budget exceptions. This is finite decision-equivalence evidence, not a
performance measurement. The [review receipt](svg-label-review.json) records the
source hash and comparison digest; rendered outputs were discarded.

The complete Drawing collection has 4,318 outputs across 34 project/format lanes,
with zero preparation blocks: 3,074 correct, 374 incorrect, 86 invalid-format,
634 renderer failures and 150 unassessed. Compared with the merged campaign,
44 previously unassessed outputs now pass and three now fail. Stronger reviewed
label obligations revoke 41 old passes and leave another 11 unassessed. Earlier
scores were not reinterpreted.

Of the 150 unassessed outputs, 149 are SVG and one exceeds the terminal rectangle
work budget. The SVG receipt identifies every project/case and its unavailable
checks. The following counts overlap:

| Missing evidence | Outputs |
|---|---:|
| Missing inspectable DOM labels alongside path/image/use content | 67 |
| Qualified canvas containment | 69 |
| Qualified clipping/overflow/occlusion | 145 |
| Explicit partial or complex later-paint occlusion | 56 |
| Pattern paint | 6 |
| CSS `drop-shadow(...)` | 2 |
| Unique SVG identities | 1 |

Resolving these requires a qualified glyph/image observer, actual glyph-ink
clipping and occlusion evidence, or paint-specific proofs. Missing text,
unresolved paint and box overlap cannot safely be turned into correctness
credit. General masks, complex clip paths and other representations outside the
observer's profile remain unsupported even when absent from this particular
cohort. PNG is outside Drawing Correctness's scope.

## Pinned native Flutter bundle

The successful [native verification run](https://github.com/adewale/trident/actions/runs/42393795835)
built Flutter 3.47.8 / Dart 3.13.7 with the committed `mermaid_flutter` 0.3.2
lockfile. Its artifact archive SHA-256 is
`296208a79ab08f0e602dc16e3e74138464cd8fcdfcdf2dafc8506697b01458fc`;
the verified bundle file-map digest is
`a25b5d496209135c633ee1d0c0d58ef49b7cec11c54c34266acf2c6ac166cff4`.

The complete relocated bundle was verified against current source, SDK, lockfile
and every bundle file before use. On this host, the native Linux release worker
passed all nine independent PNG admission controls and the fixed `renderToPng`
smoke request under Xvfb. A separate production JSON-line worker call completed
and exited normally after EOF. This supersedes the earlier compatibility-SDK
probe; no dependency substitutions were needed. CI supplies build and smoke
evidence. Corpus timings are collected separately outside CI.

The process memory guard counts the owned worker tree, including renderer and
Xvfb children behind shell wrappers. Docker collection also sets a container
memory limit. RSS polling is a best-effort resource guard, with its scope, limit
and availability recorded in the collection environment; it is not an exact
peak-memory measurement.
