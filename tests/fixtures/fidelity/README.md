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
