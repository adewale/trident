# Drawing checks

`drawing/` holds Drawing Correctness: the shared corpus (`corpus.ts`, reading
`../corpus/drawing-regressions.json` and the reviewed terminal corpus), the label
assessment (`labels.ts`) and the SVG and terminal workers. `drawing:correctness`
in `../unified/drawing-correctness.ts` runs it. Python requirements for its
raster helpers are in `drawing/requirements.txt`.

The other modules here are the source and output observers that `drawing/` builds
on:

- `inspect-svg.ts`, `paint*.ts`, `svg-assessment.ts`: SVG paint and text inspection.
- `terminal*.ts`: terminal text interpretation, source contracts and family facts,
  with the reviewed terminal corpus in `terminal-corpus.ts`.
- `meaning.ts`, `ledger.ts`, `source-contract.ts` and the `*-expectation.ts`
  modules: expected content derived from Mermaid source.
- `cases.ts`: authored cases used by the observer tests.

Mermaid Fidelity does not use these modules; it lives in `../unified/mermaid-fidelity/`.
