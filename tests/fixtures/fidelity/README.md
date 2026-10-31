These are public SVG outputs from pinned Mermaid 12.2.0 (with the first-party
ZenUML addon 1.0.1) and Pele 1.9.0. They retain actual marker paths, nested SVG
transforms, activation bodies, and externally positioned labels. No renderer
needs to run to reproduce these observer defects.

The owning tests state the authored nodes, directions, and relationships
independently, then alter physical arrow orientation or attachment to check
that correct text and metadata cannot supply missing paint evidence. Sources
are the `meaning:family:requirement`, `meaning:family:zenuml`,
`features:zenuml:nested-alternate-return`, and `meaning:family:architecture`
cases in the committed fidelity corpus.

`pele-er-cardinality-bars.svg` is the 1,863-byte public Pele1.9.0 output for
`erDiagram\nALPHA ||--o{ BETA : owns`, retained from the owning functional
requalification's `meaning:family:er` case. Its two one-cardinality bars are
legitimate disconnected strokes inside one marker owner. The relation path
remains continuous. Portable tests independently declare ALPHA→BETA, retain
the real glyphs, and perturb their attachment and individual stroke grammar.
This is endpoint marker-ink evidence; it does not certify exact ER cardinality
meaning or prove complete curve geometry.

`mermaid-flowchart-drop-shadow.svg` is the unchanged Mermaid 12.2.0 output for
`meaning:family:flowchart`, from the 30 October 2026 ecosystem campaign,
`fidelity/bWVybWFpZC1qcy9tZXJtYWlk/attempts/df248ac6-0311-47d9-abd7-e5d824146c53`.
Its sole `feDropShadow` composites SourceGraphic without clipping its bounds.
Tests retain the real drawing and perturb filter bounds, input and alpha.

`bezel-inline-arrow.svg`: actual Bezel 0.2.21 public SVG from the 31 October 2026 campaign, Mermaid documentation `flowchart.md:686` at `1fb7869866dd619168d840291c9c54b4f129758b`; SHA-256 `6842029810a65d26758716992c4e973ca990a17cd1cca10252ae0f9e63f08119`. Unmodified output.

`dart-inline-arrow.svg`: actual Mermaid Dart0.3.2 public SVG from the 31 October2026 campaign, Mermaid documentation `flowchart.md:686` at `1fb7869866dd619168d840291c9c54b4f129758b`; SHA-256 `13137b0758565e29ad7976cb57e3990dfe477638d2f3458dca18f7fc16d725ec`. Unmodified output.

`rs-flat-flowchart.svg` and `merslim-flat-flowchart.svg` are unchanged public SVGs
from Mermaid RS Renderer0.3.1 and Merslim0.2.3 in the31October2026 campaign,
Mermaid documentation `flowchart.md:686` at
`1fb7869866dd619168d840291c9c54b4f129758b`. They deliberately lack node wrapper
classes. The tests bind real label/body geometry, perturb generic identifiers,
and reject an extra visible node and a missing body with a canvas background.
RS SHA256: `5f4dd1c9b0b321baf82eb495c68d99485c25cdb1eac5575c76a5647e530b2ce7`.
Merslim SHA256: `66f920a4c07759a3b57dee24bcff60e2b77ca28576c782483ebb6e4d33f4f25e`.
