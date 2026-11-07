# Glyph ink versus font line boxes

These three exact retained Mermaid 12.2.0 rasterized SVGs and actual same-call
PNGs come from documentation occurrences 497–499 at source pin
`1fb7869866dd619168d840291c9c54b4f129758b`. The full literal sources, public
artifact/source/binding identities, invocation IDs and byte hashes are retained
in [provenance.json](provenance.json). Mermaid's MIT license is retained at
`corpus/docs-assets/MERMAID-LICENSE`.

Independent full-size inspection confirms the complete titles, including both
literal quotes in occurrence 499. Exact actual-image probes show white row 0,
title ink in rows 1–30, white rows 31–36, then the set arcs. The SVG font box starts
at CSS y=3.453125 against a canvas starting at y=8; that box contains unpainted font
ascent. It is therefore not evidence of clipped glyphs. Identical computed-font
Canvas metrics, matching SVG advance/font-box height and the measured transform
locate actual title ink at y=9.453125 with height 30, agreeing with the independent
actual-image observation.

The regression qualifies only generic authored-title clipping. It does not grant
full Venn correctness from pixels, reference agreement or this fixture label.
Other source facts and representation checks remain independently required.
Hand-authored plain-SVG controls separately remove actual top/bottom glyph ink;
those still fail. ASCII and Latin-1 runs use the same computed-font, advance and
font-box qualification. Separate raster controls cover fitting accented text and
top/bottom accent clipping; combining marks stay outside that bounded profile.
A zero-area clip remains a proved failure even without font
metrics. Unsupported HTML, complex glyphs or stretched text remain unknown when
only their font boxes overflow. No project renderer was called again to freeze these retained
fixtures or run this qualification.
