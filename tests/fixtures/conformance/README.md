`mermaidAPI.spec.ts.txt` is the unmodified original MIT-licensed Mermaid test file
`packages/mermaid/src/mermaidAPI.spec.ts` at
`1fb7869866dd619168d840291c9c54b4f129758b`. Its SHA256 and selected callback IDs,
locations and hashes are in `corpus/mermaid-public-tests.json`. It is stored as text
so Trident's fixture suite can verify source identity without importing a renderer
or executing unrelated upstream tests. Original copyright/license remains Mermaid's.

The production conformance runner executes this file in its actual pinned source
checkout under original Vitest plugins; it does not execute this retained text or
rewrite the callbacks/assertions. Tests of the boundary transform use synthetic
implementation source and supply no ecosystem benchmark result.
