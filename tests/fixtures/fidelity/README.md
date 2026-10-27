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
