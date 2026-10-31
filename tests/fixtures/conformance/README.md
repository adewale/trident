`mermaidAPI.spec.ts.txt`, `mermaid.spec.ts.txt` and `utils.spec.ts.txt` are the unmodified original
MIT-licensed Mermaid files under `packages/mermaid/src/` at
`1fb7869866dd619168d840291c9c54b4f129758b`. SHA256 values and the 41 selected/expanded
callback IDs, locations and hashes are in `corpus/mermaid-public-tests.json`.
They are stored as text so Trident can verify source identity without importing a
renderer or executing unrelated upstream tests. Original copyright/license
remains Mermaid's.

The production runner executes the actual files in the pinned source checkout
under original Vitest plugins. It changes SHA-bound public implementation
bodies, never the callbacks, assertions or snapshots. Tests of the boundary
transform use synthetic source and supply no ecosystem benchmark result.

The complete census contains 4,060 test declarations in 368 files. Its static
source review identifies pending public operations and private-import candidates;
a private import alone does not establish that an entire test is internal-only.
Whole-suite eligibility and conformance remain unqualified.
