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

The `mermaid/pele-class-members`, `-er-attributes` and `-sequence-messages`
fixtures are unchanged public Mermaid 12.2.0 and Pele 1.9.0 outputs retained
in the 31 October 2026 ecosystem campaign for the authored cases
`features:class:namespace-members-cardinality`,
`features:er:attributes-identifying-cardinality` and
`features:sequence:notes-loop-reciprocal`. Their source and literal expectations
are committed in `fidelity/cases.ts`; they are not inferred from the SVGs.
Tests inspect actual node-owned rows and endpoint-owned message routes, then
change return types, attributes, keys, message order and dashed strokes.
Fixture SHA-256 digests, in Mermaid/Pele order:

- Class: `c648a838a916da52eee937666427660b09359ff7f18751f8b1006226b7404698`,
  `579f478fa3009d871d364450fdb89ae6554425a8e29ff0933e7d01bc54765ea0`.
- ER: `a083d0b5dcd72ca73a3ed0844df67113d2e134694813b933bb72684f91cb4a3a`,
  `a39526c99197056517f19e67e58c8c83e53936eb6feca9591ea7ae1bfc3d2bc7`.
- Sequence: `ae998ddda27010cf3d0fd43437926d595b63ba374ebf9a8a106941131e005654`,
  `6395ad724bc2d55870ac3e2e31417690a841883a781928b6a33b90a5e96a1a7b`.

These qualify bounded fact profiles, not every class, ER or sequence feature.
Static/abstract/generic member decorations, ER cardinality glyph meaning,
notes/fragments and unsupported message arrow styles remain separate required
obligations and cannot inherit credit from the passing rows.

`mermaid-sankey-values.svg` and `mermaid-treemap-values.svg` are unchanged
Mermaid 12.2.0 public outputs for `meaning:family:sankey` and
`meaning:family:treemap`, retained in the same 31 October campaign. The source
and original native expectations are in `fidelity/cases.ts`. New visual
expectations derive from those literals and the pinned public defaults, not
from these SVGs. Tests independently mutate printed quantities, borrow a
correct value from unrelated text, hide/clamp value text and change source
area ratios. A wrong printed number fails independently of correct geometry.

- Sankey SHA-256: `aba95796af83af915d18a63801d38e71528857514d302b85a3ad9f5d6ed80ef4`.
- Treemap SHA-256: `85c7d901c362a6c7e78b40868f9305b649b0862208e11c27da64707ba522f2e1`.

`mermaid-owned-styles.svg` and `pele-owned-styles.svg` retain unchanged
Mermaid 12.2.0 and Pele 1.9.0 output for
`features:flowchart:owned-style-effect` in that campaign. The independent
source asks for both node fills `#ffcc00` and default route stroke `#225588`
at `3px`. Tests change the actual colors and rename renderer CSS prefixes;
neither source selectors nor a matching unrelated decoration supplies paint
credit. Their SHA-256 digests are
`f0d673370fd93927296bb304626cd8bec9246a6c47bce99c4481e2798c144879` and
`6ffdf8b0566c5b9cb19a2d9d13cb707f527d595a025946a0da03f120b2d3bcc1`.

`mermaid-four-shapes.svg` and `pele-four-shapes.svg` retain the unchanged
Mermaid12.2.0 and Pele1.9.0 outputs for pinned Mermaid documentation
`packages/mermaid/src/docs/syntax/examples.md:40` at
`1fb7869866dd619168d840291c9c54b4f129758b`, from the same31October campaign.
The source asks for an ordinary box, circle, rounded box and diamond. Pele's
ordinary box has cosmetic4px corners; its explicitly rounded box has12px
corners. Tests verify the geometric contrast rather than requiring one
renderer skin's sharp-corner convention, then swap the source shapes and
collapse the actual contrast. The SHA-256 digests are
`a782b10ce8314d76c1685bb98eda70d9d2008baa25385b9f73020ec53653bb82` and
`4600302dbb91083fa8b3096353cdeabb4c876ea39b8c64062e83972c72d00a77`.
