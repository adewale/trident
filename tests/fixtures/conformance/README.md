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

`public-tests-v4-evidence.json.gz` retains actual native reports, call events and
source/runtime inventories from the 2026-10-31 qualification collection. The
archive records each file's SHA256 and distinguishes original/control measurement
commit `ad86635` from assessment commit `4425f5c`. Original and delegated Mermaid
controls passed 41 unchanged callbacks. Reporting tests unpack and regrade these
bytes; they generate no renderer results and make no project calls.
