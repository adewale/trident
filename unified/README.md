# Collectors and reports

Each `commands.ts` command runs one module here:

| Command | Module |
|---|---|
| `versions` | `benchmark-versions.ts`: resolves and freezes each project's benchmark version. |
| `prepare` | `prepare-artifacts.ts`: installs the frozen versions through the shared community preparation (`community.ts`, `community-browser.ts`, `community-artifact-prepare.ts`, `community-source-prepare.ts`). |
| `upstream:prepare` | `prepare-upstream.ts`: builds the pinned Mermaid test runtime for Mermaid Fidelity. |
| `davebench`, `davebench:terminal`, `davebench:native-png` | `davebench.ts`, `davebench-terminal.ts`, `davebench-native-png.ts`, with output admission in `davebench-validity.ts`. |
| `drawing:correctness` | `drawing-correctness.ts`, using the checks in `../fidelity/drawing/`. |
| `mermaid:fidelity` | `mermaid-fidelity.ts` and `mermaid-fidelity/` (runtime, parser bridges, reviewed views). |
| `campaign:results` | `three-benchmark-report.ts`: DaveBench rankings from collected results. |
| `results:snapshot` | `results-snapshot.ts`: regenerates `RESULTS.md` and the generated numbers in the docs (`published-facts.ts`, `overall-score.ts`). |

The `community*` modules hold the public-artifact adapters shared by all three
benchmarks: declared npm exports, release CLIs, source builds, WASM, Python and
native workers. Product source controllers live in the product repositories.
